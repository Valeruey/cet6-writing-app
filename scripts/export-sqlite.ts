// Export SQLite data to JSON files
import { Database } from "bun:sqlite";
import { writeFileSync, mkdirSync } from "fs";

const sqlite = new Database("./data/cet6.db");
mkdirSync("./data/export", { recursive: true });

const tables = [
  "articles",
  "expressions",
  "exam_topics",
  "practice_sessions",
  "user_progress",
  "saved_expressions",
];

for (const table of tables) {
  const rows = sqlite.query(`SELECT * FROM ${table}`).all();
  writeFileSync(`./data/export/${table}.json`, JSON.stringify(rows));
  console.log(`Exported ${table}: ${rows.length} rows`);
}

console.log("Export complete!");
