import { Hono } from "hono";
import { db } from "../db/connection";
import { articles as articlesTable } from "../db/schema";
import { eq, asc } from "drizzle-orm";
import { detectHighlights, generateAnalysis } from "../services/ai-client";
import { v4 as uuid } from "uuid";

const cronRouter = new Hono();

// Verify cron secret
cronRouter.use("*", async (c, next) => {
  const secret = c.req.header("Authorization")?.replace("Bearer ", "");
  if (secret !== process.env.CRON_SECRET) {
    return c.json({ error: "Unauthorized" }, 401);
  }
  await next();
});

// GET/POST /api/cron/daily-article — process oldest draft article
async function processDailyArticle(c: any) {
  try {
    const [draft] = await db
      .select()
      .from(articlesTable)
      .where(eq(articlesTable.status, "draft"))
      .orderBy(asc(articlesTable.created_at))
      .limit(1);

    if (!draft) {
      return c.json({ message: "No draft articles to process" });
    }

    // Step 1: Detect highlights
    const highlights = await detectHighlights(draft.content);

    if (highlights.length === 0) {
      await db
        .update(articlesTable)
        .set({ status: "published", updated_at: new Date().toISOString() })
        .where(eq(articlesTable.id, draft.id));
      return c.json({ message: "Published without highlights", article_id: draft.id });
    }

    // Step 2: Generate analysis for each highlight
    const now = new Date().toISOString();
    let processed = 0;
    for (const h of highlights) {
      const analysis = await generateAnalysis(h.text, h.sentence_context, h.category);
      if (analysis) {
        try {
          // Insert expression using raw SQL to avoid Drizzle type issues
          const { sql } = await import("../db/connection");
          await sql`
            INSERT INTO expressions (id, article_id, text, start_offset, end_offset, category, analysis, sentence_context, created_at)
            VALUES (${uuid()}, ${draft.id}, ${h.text}, ${h.start_offset}, ${h.end_offset}, ${h.category}, ${JSON.stringify(analysis)}, ${h.sentence_context}, ${now})
          `;
          processed++;
        } catch (e) {
          console.error(`Failed to insert expression: ${h.text}`, e);
        }
      }
    }

    // Step 3: Mark as published
    await db
      .update(articlesTable)
      .set({ status: "published", updated_at: now })
      .where(eq(articlesTable.id, draft.id));

    return c.json({
      message: "Article processed successfully",
      article_id: draft.id,
      highlights_found: highlights.length,
      expressions_saved: processed,
    });
  } catch (e: any) {
    console.error("Cron daily-article failed:", e.message);
    return c.json({ error: e.message }, 500);
  }
}

cronRouter.get("/daily-article", processDailyArticle);
cronRouter.post("/daily-article", processDailyArticle);

export { cronRouter };
