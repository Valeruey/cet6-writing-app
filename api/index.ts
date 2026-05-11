import { handle } from "hono/vercel";
import { Hono } from "hono";
import { createApp } from "../server/app";

let appHandler: ReturnType<typeof handle>;

try {
  appHandler = handle(createApp());
} catch (e: any) {
  console.error("App init failed:", e.message, e.stack);
  const fallback = new Hono();
  fallback.all("*", (c) =>
    c.json({ error: "App initialization failed", detail: e.message }, 500)
  );
  appHandler = handle(fallback);
}

export default appHandler;
