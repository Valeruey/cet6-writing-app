import { handle } from "hono/vercel";
import { Hono } from "hono";
import { default as app } from "./server-bundle.js";

export default handle(app || new Hono().all("*", (c) => c.json({ error: "app init failed" }, 500)));
