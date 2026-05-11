import { Hono } from "hono";
import { authMiddleware } from "../middleware/auth";
import type { AppVariables } from "../lib/types";

export const authRouter = new Hono<{ Variables: AppVariables }>();

authRouter.get("/me", authMiddleware, (c) => {
  return c.json({
    user: {
      id: c.get("userId"),
      email: c.get("userEmail"),
    },
  });
});
