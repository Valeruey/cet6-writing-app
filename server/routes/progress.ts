import { Hono } from "hono";
import { db } from "../db/connection";
import { articles, practiceSessions, userProgress, savedExpressions } from "../db/schema";
import { eq, desc, count, sql } from "drizzle-orm";
import { v4 as uuid } from "uuid";

const progressRouter = new Hono();

// GET /api/progress — overview
progressRouter.get("/", async (c) => {
  const totalResult = await db
    .select({ count: count() })
    .from(articles)
    .where(eq(articles.status, "published"));

  const readResult = await db
    .select({ count: count() })
    .from(userProgress)
    .where(eq(userProgress.completed, 1));

  const practiceResult = await db
    .select({ count: count() })
    .from(practiceSessions);

  const avgResult = await db
    .select({ avg: sql<number>`avg(score)` })
    .from(practiceSessions)
    .where(sql`score IS NOT NULL`);

  const savedResult = await db
    .select({ count: count() })
    .from(savedExpressions);

  const recentSessions = await db
    .select({
      created_at: practiceSessions.created_at,
      score: practiceSessions.score,
    })
    .from(practiceSessions)
    .where(sql`score IS NOT NULL`)
    .orderBy(desc(practiceSessions.created_at))
    .limit(10);

  return c.json({
    articles_read: readResult[0]?.count || 0,
    total_articles: totalResult[0]?.count || 0,
    practice_count: practiceResult[0]?.count || 0,
    average_score: avgResult[0]?.avg || null,
    score_trend: recentSessions
      .reverse()
      .map((s) => ({ date: s.created_at.slice(0, 10), score: s.score! })),
    expressions_saved: savedResult[0]?.count || 0,
  });
});

// POST /api/progress/article — mark article progress
progressRouter.post("/article", async (c) => {
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
    .where(eq(userProgress.article_id, body.article_id))
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
    article_id: body.article_id,
    completed: body.completed ?? 0,
    last_position: body.position ?? 0,
    updated_at: now,
  });

  return c.json({ message: "Created", id });
});

export { progressRouter };
