import { handle } from "hono/vercel";
import { Hono } from "hono";

let appHandler;
try {
  const { default: app } = await import("./server-bundle.js");
  appHandler = handle(app);
} catch (e) {
  console.error("App init failed:", e.message, e.stack);
  const fallback = new Hono();
  fallback.all("*", (c) =>
    c.json({ error: "App initialization failed", detail: e.message }, 500)
  );
  appHandler = handle(fallback);
}

export default appHandler;
