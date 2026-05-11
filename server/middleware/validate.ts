import type { ZodSchema } from "zod";
import type { Context, Next } from "hono";

export function validateBody(schema: ZodSchema) {
  return async (c: Context, next: Next) => {
    let body: unknown;
    try {
      body = await c.req.json();
    } catch {
      return c.json({ error: "Invalid JSON body" }, 400);
    }
    const result = schema.safeParse(body);
    if (!result.success) {
      return c.json(
        { error: "Validation failed", details: result.error.flatten() },
        400
      );
    }
    c.set("validatedBody", result.data);
    await next();
  };
}
