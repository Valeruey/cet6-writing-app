// Import JSON data into Neon — in correct dependency order
import { readFileSync } from "fs";
import { neon } from "@neondatabase/serverless";

const DATABASE_URL = process.env.DATABASE_URL!;
const sql = neon(DATABASE_URL);

// Order matters: articles first, then expressions (FK to articles), then exam_topics
const importOrder = [
  "articles",
  "exam_topics",
  "expressions",
  "practice_sessions",
  "user_progress",
  "saved_expressions",
];

for (const table of importOrder) {
  let rows: Record<string, any>[];
  try {
    rows = JSON.parse(readFileSync(`./data/export/${table}.json`, "utf-8"));
  } catch {
    console.log(`Skipping ${table}: no export file`);
    continue;
  }

  if (rows.length === 0) {
    console.log(`Skipping ${table}: 0 rows`);
    continue;
  }

  console.log(`Importing ${table}: ${rows.length} rows`);

  let ok = 0;
  let fail = 0;

  // Insert in batches of 5 rows
  for (let i = 0; i < rows.length; i += 5) {
    const batch = rows.slice(i, i + 5);

    for (const row of batch) {
      const cols = Object.keys(row);
      const vals = cols.map((c) => row[c]);
      const quotedCols = cols.map((c) => `"${c}"`).join(", ");
      const placeholders = vals.map((_, idx) => `$${idx + 1}`).join(", ");

      try {
        await sql.query(
          `INSERT INTO "${table}" (${quotedCols}) VALUES (${placeholders}) ON CONFLICT ("id") DO NOTHING`,
          vals
        );
        ok++;
      } catch (e: any) {
        fail++;
        if (fail <= 5) {
          console.error(`  Error on ${table} row ${i}:`, e.message.slice(0, 120));
        }
      }
    }
  }

  console.log(`  ${table}: ${ok} ok, ${fail} failed`);
}

console.log("Import complete!");
