import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

let _sql: ReturnType<typeof neon> | null = null;
let _db: ReturnType<typeof drizzle<typeof schema>> | null = null;

function getConnection() {
  if (!_sql || !_db) {
    const dbUrl = process.env.DATABASE_URL;
    if (!dbUrl) {
      throw new Error(
        "DATABASE_URL is not set — ensure it's configured in Vercel environment variables"
      );
    }
    _sql = neon(dbUrl);
    _db = drizzle(_sql, { schema });
  }
  return { sql: _sql, db: _db };
}

// Lazy proxy — tagged template literal calls go through `apply`,
// method calls (e.g. sql.unsafe) go through `get`
export const sql = new Proxy(function sqlTemplate() {}, {
  apply(_target, _thisArg, args: [TemplateStringsArray, ...unknown[]]) {
    const conn = getConnection();
    return (conn.sql as any)(...args);
  },
  get(_target, prop: string) {
    const conn = getConnection();
    const val = (conn.sql as any)[prop];
    return typeof val === "function" ? val.bind(conn.sql) : val;
  },
}) as unknown as ReturnType<typeof neon>;

export const db = new Proxy({} as ReturnType<typeof drizzle<typeof schema>>, {
  get(_target, prop: string) {
    const conn = getConnection();
    return (conn.db as any)[prop];
  },
});
