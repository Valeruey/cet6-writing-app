import { handle } from "hono/vercel";
import { Hono } from "hono";

const app = new Hono();

app.get("/", (c) => c.json({ ok: true }));

// Test if neon can be imported
app.get("/neon", async (c) => {
  try {
    const { neon } = await import("@neondatabase/serverless");
    const sql = neon(process.env.DATABASE_URL!);
    const r = await sql`SELECT 1 as one`;
    return c.json({ neon: "works", result: r[0] });
  } catch (e: any) {
    return c.json({ neon: "fail", error: e.message }, 500);
  }
});

export const GET = handle(app);
