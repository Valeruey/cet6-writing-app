import { Hono } from "hono";
import { db } from "../db/connection";
import { expressions, savedExpressions } from "../db/schema";
import { eq, and, desc } from "drizzle-orm";
import { v4 as uuid } from "uuid";
import { authMiddleware } from "../middleware/auth";
import type { AppVariables } from "../lib/types";

const expressionsRouter = new Hono<{ Variables: AppVariables }>();

// GET /api/expressions/:id — full analysis (public)
expressionsRouter.get("/:id", async (c) => {
  const id = c.req.param("id");
  const [expr] = await db
    .select()
    .from(expressions)
    .where(eq(expressions.id, id))
    .limit(1);

  if (!expr) return c.json({ error: "Expression not found" }, 404);

  return c.json({
    ...expr,
    analysis: expr.analysis ? JSON.parse(expr.analysis) : null,
  });
});

// POST /api/expressions/:id/save — bookmark an expression
expressionsRouter.post("/:id/save", authMiddleware, async (c) => {
  const expressionId = c.req.param("id");
  const userId = c.get("userId");

  const [expr] = await db
    .select()
    .from(expressions)
    .where(eq(expressions.id, expressionId))
    .limit(1);

  if (!expr) return c.json({ error: "Expression not found" }, 404);

  const [existing] = await db
    .select()
    .from(savedExpressions)
    .where(
      and(
        eq(savedExpressions.expression_id, expressionId),
        eq(savedExpressions.user_id, userId)
      )
    )
    .limit(1);

  if (existing) {
    return c.json({ message: "Already saved", id: existing.id });
  }

  const now = new Date().toISOString();
  const id = uuid();
  await db.insert(savedExpressions).values({
    id,
    user_id: userId,
    expression_id: expressionId,
    saved_at: now,
    review_count: 0,
  });

  return c.json({ message: "Saved", id });
});

// DELETE /api/expressions/:id/save — remove bookmark
expressionsRouter.delete("/:id/save", authMiddleware, async (c) => {
  const expressionId = c.req.param("id");
  const userId = c.get("userId");

  await db
    .delete(savedExpressions)
    .where(
      and(
        eq(savedExpressions.expression_id, expressionId),
        eq(savedExpressions.user_id, userId)
      )
    );

  return c.json({ message: "Unsaved" });
});

// GET /api/expressions/saved/list — list saved for current user
expressionsRouter.get("/saved/list", authMiddleware, async (c) => {
  const userId = c.get("userId");
  const page = parseInt(c.req.query("page") || "1");
  const limit = parseInt(c.req.query("limit") || "30");
  const offset = (page - 1) * limit;

  const list = await db
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
    .where(eq(savedExpressions.user_id, userId))
    .orderBy(desc(savedExpressions.saved_at))
    .limit(limit)
    .offset(offset);

  return c.json(
    list.map((item) => ({
      ...item,
      analysis: item.analysis ? JSON.parse(item.analysis as string) : null,
    }))
  );
});

export { expressionsRouter };
