import { handle } from "hono/vercel";

let appHandler: ReturnType<typeof handle>;

try {
  const { createApp } = await import("../server/app");
  appHandler = handle(createApp());
} catch (e: any) {
  console.error("App init failed:", e.message, e.stack);
  // Fallback: minimal Hono app
  const { Hono } = await import("hono");
  const fallback = new Hono();
  fallback.all("*", (c) =>
    c.json({ error: "App initialization failed", detail: e.message }, 500)
  );
  appHandler = handle(fallback);
}

export default appHandler;
