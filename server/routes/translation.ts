import { Hono } from "hono";
import { db } from "../db/connection";
import { examTopics, practiceSessions } from "../db/schema";
import { eq, and, desc, count } from "drizzle-orm";
import { v4 as uuid } from "uuid";
import { scoreTranslation } from "../services/ai-client";
import { authMiddleware } from "../middleware/auth";
import type { AppVariables } from "../lib/types";

const translationRouter = new Hono<{ Variables: AppVariables }>();

// GET /api/translation/topics — list translation exam topics
translationRouter.get("/topics", async (c) => {
  const page = parseInt(c.req.query("page") || "1");
  const limit = parseInt(c.req.query("limit") || "15");
  const offset = (page - 1) * limit;

  const totalResult = await db
    .select({ count: count() })
    .from(examTopics)
    .where(eq(examTopics.type, "translation"));

  const list = await db
    .select()
    .from(examTopics)
    .where(eq(examTopics.type, "translation"))
    .orderBy(desc(examTopics.year), desc(examTopics.month))
    .limit(limit)
    .offset(offset);

  return c.json({
    data: list,
    total: totalResult[0]?.count || 0,
    page,
    limit,
    hasMore: offset + limit < (totalResult[0]?.count || 0),
  });
});

// GET /api/translation/topics/:id — get one topic (with reference answer)
translationRouter.get("/topics/:id", async (c) => {
  const id = c.req.param("id");

  const [topic] = await db
    .select()
    .from(examTopics)
    .where(
      and(
        eq(examTopics.id, id),
        eq(examTopics.type, "translation")
      )
    )
    .limit(1);

  if (!topic) return c.json({ error: "Translation topic not found" }, 404);

  return c.json(topic);
});

// POST /api/translation/score — score a translation
translationRouter.post("/score", authMiddleware, async (c) => {
  const userId = c.get("userId");

  let body: {
    source_text?: string;
    user_translation?: string;
    reference_answer?: string;
    topic_id?: string;
  };
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: "Invalid JSON" }, 400);
  }

  if (!body.source_text || !body.user_translation) {
    return c.json({ error: "source_text and user_translation are required" }, 400);
  }

  // If topic_id provided but no reference_answer, look it up
  let referenceAnswer = body.reference_answer || "";
  if (!referenceAnswer && body.topic_id) {
    const [topic] = await db
      .select()
      .from(examTopics)
      .where(eq(examTopics.id, body.topic_id))
      .limit(1);
    if (topic?.reference_answer) {
      referenceAnswer = topic.reference_answer;
    }
  }

  if (!referenceAnswer) {
    return c.json({ error: "Reference answer is required for scoring" }, 400);
  }

  const result = await scoreTranslation(body.source_text, body.user_translation, referenceAnswer);

  if (!result) {
    return c.json({ error: "AI scoring failed. Please try again." }, 502);
  }

  // Save to database
  const now = new Date().toISOString();
  const sessionId = uuid();
  await db.insert(practiceSessions).values({
    id: sessionId,
    user_id: userId,
    type: "translation",
    prompt_text: body.source_text,
    source: body.topic_id ? "exam_topic" : "ai_generated",
    exam_topic_id: body.topic_id || null,
    user_writing: body.user_translation,
    word_count: body.user_translation.trim().split(/\s+/).filter(Boolean).length,
    score: result.overall_score,
    score_breakdown: JSON.stringify(result.breakdown),
    feedback: result.feedback_cn,
    corrections: JSON.stringify(result.corrections),
    created_at: now,
  });

  return c.json({ ...result, session_id: sessionId });
});

export { translationRouter };
