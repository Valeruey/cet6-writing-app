import { Hono } from "hono";
import { db } from "../db/connection";
import { savedExpressions, expressions } from "../db/schema";
import { eq, and, lte, desc, sql } from "drizzle-orm";
import { authMiddleware } from "../middleware/auth";
import type { AppVariables } from "../lib/types";
import { calculateNextReview, type ReviewQuality } from "../lib/spaced-repetition";

const reviewRouter = new Hono<{ Variables: AppVariables }>();

// GET /api/review/due — expressions due for review today
reviewRouter.get("/due", authMiddleware, async (c) => {
  const userId = c.get("userId");
  const now = new Date().toISOString();
  const limit = parseInt(c.req.query("limit") || "20");

  const due = await db
    .select({
      id: savedExpressions.id,
      expression_id: savedExpressions.expression_id,
      saved_at: savedExpressions.saved_at,
      review_count: savedExpressions.review_count,
      last_reviewed: savedExpressions.last_reviewed,
      ease_factor: savedExpressions.ease_factor,
      interval: savedExpressions.interval,
      next_review_at: savedExpressions.next_review_at,
      text: expressions.text,
      category: expressions.category,
      sentence_context: expressions.sentence_context,
      analysis: expressions.analysis,
    })
    .from(savedExpressions)
    .leftJoin(expressions, eq(savedExpressions.expression_id, expressions.id))
    .where(
      and(
        eq(savedExpressions.user_id, userId),
        lte(savedExpressions.next_review_at, now)
      )
    )
    .orderBy(sql`saved_expressions.next_review_at ASC NULLS FIRST`)
    .limit(limit);

  return c.json(
    due.map((item) => ({
      ...item,
      analysis: item.analysis ? JSON.parse(item.analysis as string) : null,
    }))
  );
});

// POST /api/review/:id/rate — submit review quality rating
reviewRouter.post("/:id/rate", authMiddleware, async (c) => {
  const userId = c.get("userId");
  const savedId = c.req.param("id");

  let body: { quality: number };
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: "Invalid JSON" }, 400);
  }

  if (typeof body.quality !== "number" || body.quality < 0 || body.quality > 5) {
    return c.json({ error: "quality must be 0-5" }, 400);
  }

  const [saved] = await db
    .select()
    .from(savedExpressions)
    .where(
      and(
        eq(savedExpressions.id, savedId),
        eq(savedExpressions.user_id, userId)
      )
    )
    .limit(1);

  if (!saved) return c.json({ error: "Saved expression not found" }, 404);

  const result = calculateNextReview(
    body.quality as ReviewQuality,
    saved.ease_factor ?? 2.5,
    saved.interval ?? 0
  );

  const now = new Date().toISOString();
  await db
    .update(savedExpressions)
    .set({
      review_count: (saved.review_count ?? 0) + 1,
      last_reviewed: now,
      ease_factor: result.easeFactor,
      interval: result.interval,
      next_review_at: result.nextReviewAt,
    })
    .where(eq(savedExpressions.id, savedId));

  return c.json({
    ...result,
    review_count: (saved.review_count ?? 0) + 1,
  });
});

// GET /api/review/stats — review statistics
reviewRouter.get("/stats", authMiddleware, async (c) => {
  const userId = c.get("userId");
  const now = new Date().toISOString();

  const totalResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(savedExpressions)
    .where(eq(savedExpressions.user_id, userId));

  const dueResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(savedExpressions)
    .where(
      and(
        eq(savedExpressions.user_id, userId),
        lte(savedExpressions.next_review_at, now)
      )
    );

  const masteredResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(savedExpressions)
    .where(
      and(
        eq(savedExpressions.user_id, userId),
        sql`interval >= 21`
      )
    );

  return c.json({
    total: totalResult[0]?.count ?? 0,
    due_today: dueResult[0]?.count ?? 0,
    mastered: masteredResult[0]?.count ?? 0,
  });
});

export { reviewRouter };
