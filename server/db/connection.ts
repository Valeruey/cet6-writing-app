import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.warn("DATABASE_URL is not set — DB features will fail");
}

export const sql = neon(DATABASE_URL || "postgresql://localhost/none");
export const db = drizzle(sql, { schema });
