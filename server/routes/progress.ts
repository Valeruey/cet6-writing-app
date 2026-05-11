import { Hono } from "hono";
import { db } from "../db/connection";
import { articles, practiceSessions, userProgress, savedExpressions } from "../db/schema";
import { eq, and, desc, count, sql } from "drizzle-orm";
import { v4 as uuid } from "uuid";
import { authMiddleware } from "../middleware/auth";
import type { AppVariables } from "../lib/types";

const progressRouter = new Hono<{ Variables: AppVariables }>();

// GET /api/progress — overview for current user
progressRouter.get("/", authMiddleware, async (c) => {
  const userId = c.get("userId");

  const totalResult = await db
    .select({ count: count() })
    .from(articles)
    .where(eq(articles.status, "published"));

  const readResult = await db
    .select({ count: count() })
    .from(userProgress)
    .where(
      and(
        eq(userProgress.user_id, userId),
        eq(userProgress.completed, 1)
      )
    );

  const practiceResult = await db
    .select({ count: count() })
    .from(practiceSessions)
    .where(eq(practiceSessions.user_id, userId));

  const avgResult = await db
    .select({ avg: sql<number>`avg(score)` })
    .from(practiceSessions)
    .where(
      and(
        eq(practiceSessions.user_id, userId),
        sql`score IS NOT NULL`
      )
    );

  const savedResult = await db
    .select({ count: count() })
    .from(savedExpressions)
    .where(eq(savedExpressions.user_id, userId));

  const recentSessions = await db
    .select({
      created_at: practiceSessions.created_at,
      score: practiceSessions.score,
    })
    .from(practiceSessions)
    .where(
      and(
        eq(practiceSessions.user_id, userId),
        sql`score IS NOT NULL`
      )
    )
    .orderBy(desc(practiceSessions.created_at))
    .limit(10);

  // Compute streak from practice dates
  const practiceDates = await db
    .select({ created_at: practiceSessions.created_at })
    .from(practiceSessions)
    .where(eq(practiceSessions.user_id, userId))
    .orderBy(desc(practiceSessions.created_at));

  const uniqueDates = [...new Set(practiceDates.map((d) => d.created_at.slice(0, 10)))].sort().reverse();
  let streak = 0;
  const today = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);

  // Check if user practiced today or yesterday to start streak
  if (uniqueDates[0] === today || uniqueDates[0] === yesterday) {
    let checkDate = new Date(uniqueDates[0]);
    for (const dateStr of uniqueDates) {
      const expected = checkDate.toISOString().slice(0, 10);
      if (dateStr === expected) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else if (dateStr < expected) {
        break;
      }
    }
  }

  // Weakness analysis from last 10 scored sessions
  const lastScored = await db
    .select({
      score_breakdown: practiceSessions.score_breakdown,
    })
    .from(practiceSessions)
    .where(
      and(
        eq(practiceSessions.user_id, userId),
        sql`score_breakdown IS NOT NULL`
      )
    )
    .orderBy(desc(practiceSessions.created_at))
    .limit(10);

  let weakness: { content_avg: number; language_avg: number; structure_avg: number; weakest: string } | null = null;
  if (lastScored.length >= 2) {
    let cTotal = 0, lTotal = 0, sTotal = 0;
    let count = 0;
    for (const s of lastScored) {
      try {
        const b = JSON.parse(s.score_breakdown!);
        if (b.content != null && b.language != null && b.structure != null) {
          cTotal += b.content;
          lTotal += b.language;
          sTotal += b.structure;
          count++;
        }
      } catch {}
    }
    if (count > 0) {
      const cAvg = Math.round(cTotal / count);
      const lAvg = Math.round(lTotal / count);
      const sAvg = Math.round(sTotal / count);
      const weakest = cAvg <= lAvg && cAvg <= sAvg ? "content"
        : lAvg <= sAvg ? "language" : "structure";
      weakness = { content_avg: cAvg, language_avg: lAvg, structure_avg: sAvg, weakest };
    }
  }

  return c.json({
    articles_read: readResult[0]?.count || 0,
    total_articles: totalResult[0]?.count || 0,
    practice_count: practiceResult[0]?.count || 0,
    average_score: avgResult[0]?.avg || null,
    score_trend: recentSessions
      .reverse()
      .map((s) => ({ date: s.created_at.slice(0, 10), score: s.score! })),
    expressions_saved: savedResult[0]?.count || 0,
    current_streak: streak,
    weakness,
  });
});

// POST /api/progress/article — mark article progress
progressRouter.post("/article", authMiddleware, async (c) => {
  const userId = c.get("userId");

  let body: { article_id: string; completed?: number; position?: number };
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: "Invalid JSON" }, 400);
  }

  if (!body.article_id) {
    return c.json({ error: "article_id is required" }, 400);
  }

  const now = new Date().toISOString();
  const [existing] = await db
    .select()
    .from(userProgress)
    .where(
      and(
        eq(userProgress.user_id, userId),
        eq(userProgress.article_id, body.article_id)
      )
    )
    .limit(1);

  if (existing) {
    await db
      .update(userProgress)
      .set({
        completed: body.completed ?? existing.completed,
        last_position: body.position ?? existing.last_position,
        updated_at: now,
      })
      .where(eq(userProgress.id, existing.id));

    return c.json({ message: "Updated", id: existing.id });
  }

  const id = uuid();
  await db.insert(userProgress).values({
    id,
    user_id: userId,
    article_id: body.article_id,
    completed: body.completed ?? 0,
    last_position: body.position ?? 0,
    updated_at: now,
  });

  return c.json({ message: "Created", id });
});

export { progressRouter };
