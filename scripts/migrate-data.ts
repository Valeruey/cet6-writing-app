// Migrate data from local SQLite to Neon
import { Database } from "bun:sqlite";
import { neon } from "@neondatabase/serverless";

const sqlite = new Database("./data/cet6.db");
const sql = neon(process.env.DATABASE_URL!);

const tables = [
  "articles",
  "expressions",
  "exam_topics",
  "practice_sessions",
  "user_progress",
  "saved_expressions",
];

for (const table of tables) {
  const rows = sqlite.query(`SELECT * FROM ${table}`).all() as Record<string, any>[];
  console.log(`Table ${table}: ${rows.length} rows`);

  if (rows.length === 0) continue;

  for (const row of rows) {
    const cols = Object.keys(row);
    const placeholders = cols.map((_, i) => `$${i + 1}`);
    const values: any[] = cols.map((c) => row[c]);

    try {
      await sql`INSERT INTO ${sql(table)} (${sql(cols)}) VALUES (${sql(values)}) ON CONFLICT (id) DO UPDATE SET id = EXCLUDED.id`;
    } catch (e: any) {
      console.error(`  Error on ${table} row id=${row.id}:`, e.message);
    }
  }

  console.log(`  Done: ${table}`);
}

console.log("Data migration complete!");
