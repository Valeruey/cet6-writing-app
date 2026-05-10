import { Hono } from "hono";
import { db } from "../db/connection";
import { articles, expressions } from "../db/schema";
import { eq, like, desc, and, count } from "drizzle-orm";

const articlesRouter = new Hono();

// GET /api/articles — list articles (paginated)
articlesRouter.get("/", async (c) => {
  const page = parseInt(c.req.query("page") || "1");
  const limit = parseInt(c.req.query("limit") || "15");
  const tag = c.req.query("tag");
  const offset = (page - 1) * limit;

  const conditions = [eq(articles.status, "published")];
  if (tag) {
    conditions.push(like(articles.topic_tags, `%${tag}%`));
  }

  const totalResult = await db
    .select({ count: count() })
    .from(articles)
    .where(and(...conditions));

  const list = await db
    .select()
    .from(articles)
    .where(and(...conditions))
    .orderBy(desc(articles.created_at))
    .limit(limit)
    .offset(offset);

  return c.json({
    data: list.map((a) => ({
      ...a,
      topic_tags: JSON.parse(a.topic_tags || "[]"),
    })),
    total: totalResult[0]?.count || 0,
    page,
    limit,
    hasMore: offset + limit < (totalResult[0]?.count || 0),
  });
});

// GET /api/articles/:id — get full article with expressions
articlesRouter.get("/:id", async (c) => {
  const id = c.req.param("id");
  const [article] = await db
    .select()
    .from(articles)
    .where(eq(articles.id, id))
    .limit(1);

  if (!article) return c.json({ error: "Article not found" }, 404);

  const exprList = await db
    .select()
    .from(expressions)
    .where(eq(expressions.article_id, id));

  return c.json({
    ...article,
    topic_tags: JSON.parse(article.topic_tags || "[]"),
    expressions: exprList.map((e) => ({
      ...e,
      analysis: e.analysis ? JSON.parse(e.analysis) : null,
    })),
  });
});

// GET /api/articles/:id/expressions — summary view
articlesRouter.get("/:id/expressions", async (c) => {
  const id = c.req.param("id");
  const list = await db
    .select({
      id: expressions.id,
      text: expressions.text,
      category: expressions.category,
      sentence_context: expressions.sentence_context,
    })
    .from(expressions)
    .where(eq(expressions.article_id, id));

  return c.json(list);
});

export { articlesRouter };
