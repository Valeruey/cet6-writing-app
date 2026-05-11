import type { Context, Next } from "hono";

interface RateLimitOptions {
  windowMs: number;
  max: number;
  keyFn?: (c: Context) => string;
}

interface BucketEntry {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, BucketEntry>();

// Cleanup stale entries every 60 seconds
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of buckets) {
    if (now > entry.resetAt) buckets.delete(key);
  }
}, 60000);

export function rateLimit(options: RateLimitOptions) {
  const { windowMs, max, keyFn } = options;

  return async (c: Context, next: Next) => {
    const key = keyFn
      ? keyFn(c)
      : c.req.header("x-forwarded-for") || c.req.header("x-real-ip") || "unknown";

    const now = Date.now();
    const existing = buckets.get(key);

    if (!existing || now > existing.resetAt) {
      buckets.set(key, { count: 1, resetAt: now + windowMs });
      await next();
      return;
    }

    if (existing.count >= max) {
      const retryAfter = Math.ceil((existing.resetAt - now) / 1000);
      return c.json(
        { error: `请求过于频繁，请在 ${retryAfter} 秒后重试` },
        429
      );
    }

    existing.count++;
    await next();
  };
}
