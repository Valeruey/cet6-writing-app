import { Hono } from "hono";
import { cors } from "hono/cors";
import { articlesRouter } from "./routes/articles";
import { expressionsRouter } from "./routes/expressions";
import { practiceRouter } from "./routes/practice";
import { progressRouter } from "./routes/progress";
import { authRouter } from "./routes/auth";
import { translationRouter } from "./routes/translation";
import { reviewRouter } from "./routes/review";
import { cronRouter } from "./routes/cron";

export function createApp() {
  const app = new Hono();

  app.use("*", cors());

  // API routes
  const api = new Hono();
  api.route("/auth", authRouter);
  api.route("/articles", articlesRouter);
  api.route("/expressions", expressionsRouter);
  api.route("/practice", practiceRouter);
  api.route("/translation", translationRouter);
  api.route("/review", reviewRouter);
  api.route("/progress", progressRouter);
  api.route("/cron", cronRouter);

  // Handle saved-expressions under expressions router
  api.get("/saved-expressions", (c) =>
    c.redirect("/api/expressions/saved/list?page=1&limit=30")
  );

  app.route("/api", api);

  // Health check (no DB)
  app.get("/health", (c) => c.json({ status: "ok", time: new Date().toISOString() }));
  api.get("/health", async (c) => {
    try {
      const { sql } = await import("./db/connection");
      const result = await sql`SELECT 1 as ok`;
      return c.json({ status: "ok", db: "connected" });
    } catch (e: any) {
      return c.json({ status: "error", db: e.message }, 500);
    }
  });

  return app;
}
