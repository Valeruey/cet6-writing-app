import { Hono } from "hono";
import { db } from "../db/connection";
import { practiceSessions } from "../db/schema";
import { eq, desc, count } from "drizzle-orm";
import { v4 as uuid } from "uuid";
import { generatePracticePrompt, scoreEssay } from "../services/ai-client";

const practiceRouter = new Hono();

// POST /api/practice/generate — generate AI practice prompt
practiceRouter.post("/generate", async (c) => {
  let body: { type?: string; article_id?: string; topic_keyword?: string };
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: "Invalid JSON" }, 400);
  }

  const articleTheme = body.topic_keyword || "contemporary social issues";
  const topicTags = body.topic_keyword || "education, society, technology";

  const result = await generatePracticePrompt(articleTheme, topicTags);

  if (!result) {
    return c.json({ error: "AI generation failed. Please try again." }, 502);
  }

  return c.json(result);
});

// POST /api/practice/score — score user writing
practiceRouter.post("/score", async (c) => {
  let body: { type?: string; prompt_text?: string; user_writing?: string };
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: "Invalid JSON" }, 400);
  }

  if (!body.prompt_text || !body.user_writing) {
    return c.json({ error: "prompt_text and user_writing are required" }, 400);
  }

  const wordCount = body.user_writing
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;

  const result = await scoreEssay(body.prompt_text, body.user_writing, wordCount);

  if (!result) {
    return c.json({ error: "AI scoring failed. Please try again." }, 502);
  }

  // Save to database
  const now = new Date().toISOString();
  const sessionId = uuid();
  await db.insert(practiceSessions).values({
    id: sessionId,
    type: body.type || "writing",
    prompt_text: body.prompt_text,
    source: "ai_generated",
    user_writing: body.user_writing,
    word_count: wordCount,
    score: result.overall_score,
    score_breakdown: JSON.stringify(result.breakdown),
    feedback: result.feedback_cn,
    corrections: JSON.stringify(result.corrections),
    created_at: now,
  });

  return c.json({ ...result, session_id: sessionId });
});

// GET /api/practice/history — list past practice sessions
practiceRouter.get("/history", async (c) => {
  const page = parseInt(c.req.query("page") || "1");
  const limit = parseInt(c.req.query("limit") || "20");
  const offset = (page - 1) * limit;

  const totalResult = await db
    .select({ count: count() })
    .from(practiceSessions);

  const list = await db
    .select()
    .from(practiceSessions)
    .orderBy(desc(practiceSessions.created_at))
    .limit(limit)
    .offset(offset);

  return c.json({
    data: list.map((s) => ({
      ...s,
      score_breakdown: s.score_breakdown ? JSON.parse(s.score_breakdown) : null,
      corrections: s.corrections ? JSON.parse(s.corrections) : null,
    })),
    total: totalResult[0]?.count || 0,
    page,
    limit,
    hasMore: offset + limit < (totalResult[0]?.count || 0),
  });
});

// GET /api/practice/sessions/:id — get one session detail
practiceRouter.get("/sessions/:id", async (c) => {
  const id = c.req.param("id");
  const [session] = await db
    .select()
    .from(practiceSessions)
    .where(eq(practiceSessions.id, id))
    .limit(1);

  if (!session) return c.json({ error: "Session not found" }, 404);

  return c.json({
    ...session,
    score_breakdown: session.score_breakdown ? JSON.parse(session.score_breakdown) : null,
    corrections: session.corrections ? JSON.parse(session.corrections) : null,
  });
});

export { practiceRouter };
