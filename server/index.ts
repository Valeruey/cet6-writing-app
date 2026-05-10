import { createApp } from "./app";

// Run migrations on startup
try {
  await import("./db/migrate");
} catch {
  // Tables may already exist, which is fine
}

const app = createApp();

export default app;
