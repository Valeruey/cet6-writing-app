import { Hono } from "hono";
import { cors } from "hono/cors";
import { articlesRouter } from "./routes/articles";
import { expressionsRouter } from "./routes/expressions";
import { practiceRouter } from "./routes/practice";
import { progressRouter } from "./routes/progress";

export function createApp() {
  const app = new Hono();

  app.use("*", cors());

  // API routes
  const api = new Hono();
  api.route("/articles", articlesRouter);
  api.route("/expressions", expressionsRouter);
  api.route("/practice", practiceRouter);
  api.route("/progress", progressRouter);

  // Handle saved-expressions under expressions router
  api.get("/saved-expressions", (c) =>
    c.redirect("/api/expressions/saved/list?page=1&limit=30")
  );

  app.route("/api", api);

  // Health check
  app.get("/health", (c) => c.json({ status: "ok", time: new Date().toISOString() }));

  return app;
}
