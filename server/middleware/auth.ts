import { createMiddleware } from "hono/factory";
import { supabase } from "../lib/supabase";
import type { AppVariables } from "../lib/types";

export const authMiddleware = createMiddleware<{ Variables: AppVariables }>(async (c, next) => {
  const authHeader = c.req.header("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return c.json({ error: "请先登录" }, 401);
  }

  const token = authHeader.slice(7);
  const { data, error } = await supabase.auth.getUser(token);

  if (error || !data.user) {
    return c.json({ error: "登录已过期，请重新登录" }, 401);
  }

  c.set("userId", data.user.id);
  c.set("userEmail", data.user.email ?? "");
  await next();
});
