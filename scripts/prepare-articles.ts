/**
 * Import foreign journal articles from .txt files into the database.
 *
 * Each .txt file should have a YAML frontmatter header:
 * ---
 * title: Article Title
 * source: Publication Name
 * url: https://...
 * author: Author Name
 * tags: tag1, tag2, tag3
 * difficulty: easy|medium|hard
 * ---
 * [Article body text...]
 *
 * Usage: bun run scripts/prepare-articles.ts [directory_path]
 */

import { readdirSync, readFileSync, existsSync } from "fs";
import { join, extname } from "path";
import { v4 as uuid } from "uuid";
import { Database } from "bun:sqlite";

const DB_PATH = process.env.DATABASE_PATH || "./data/cet6.db";
const ARTICLES_DIR = process.argv[2] || "./data/articles";

interface ArticleHeader {
  title: string;
  source?: string;
  url?: string;
  author?: string;
  tags?: string[];
  difficulty?: string;
}

function parseFrontmatter(content: string): { header: ArticleHeader; body: string } | null {
  const match = content.match(/^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/);
  if (!match) return null;

  const headerBlock = match[1]!;
  const body = match[2]!.trim();

  const header: ArticleHeader = { title: "" };

  for (const line of headerBlock.split("\n")) {
    const sep = line.indexOf(":");
    if (sep === -1) continue;
    const key = line.slice(0, sep).trim();
    const value = line.slice(sep + 1).trim();

    switch (key) {
      case "title":
        header.title = value;
        break;
      case "source":
        header.source = value;
        break;
      case "url":
        header.url = value;
        break;
      case "author":
        header.author = value;
        break;
      case "tags":
        header.tags = value.split(",").map((t) => t.trim());
        break;
      case "difficulty":
        header.difficulty = value;
        break;
    }
  }

  if (!header.title) return null;
  return { header, body };
}

function main() {
  console.log(`Article import script`);
  console.log(`Articles directory: ${ARTICLES_DIR}\n`);

  if (!existsSync(ARTICLES_DIR)) {
    console.error(`Directory not found: ${ARTICLES_DIR}`);
    console.log("Create this directory and add .txt files with YAML frontmatter.");
    console.log("\nExample format:");
    console.log("---");
    console.log("title: Article Title Here");
    console.log("source: The Economist");
    console.log("tags: technology, society");
    console.log("difficulty: medium");
    console.log("---");
    console.log("Article body text here...");
    process.exit(1);
  }

  const sqlite = new Database(DB_PATH);
  const now = new Date().toISOString();

  const files = readdirSync(ARTICLES_DIR)
    .filter((f) => extname(f).toLowerCase() === ".txt")
    .sort();

  console.log(`Found ${files.length} .txt files\n`);

  let imported = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (const file of files) {
    const filePath = join(ARTICLES_DIR, file);
    console.log(`Processing: ${file}`);

    try {
      const raw = readFileSync(filePath, "utf-8");
      const parsed = parseFrontmatter(raw);

      if (!parsed) {
        console.log(`  -> Skipped (no valid frontmatter)`);
        skipped++;
        continue;
      }

      const { header, body } = parsed;
      const wordCount = body.split(/\s+/).filter(Boolean).length;

      if (wordCount < 100) {
        console.log(`  -> Skipped (too short: ${wordCount} words)`);
        skipped++;
        continue;
      }

      const difficulty = header.difficulty || "medium";
      if (!["easy", "medium", "hard"].includes(difficulty)) {
        console.log(`  -> Warning: unknown difficulty '${difficulty}', using 'medium'`);
      }

      const id = uuid();
      const tags = JSON.stringify(header.tags || []);

      sqlite
        .prepare(
          `INSERT OR IGNORE INTO articles (id, title, source, source_url, author, content, word_count, difficulty, topic_tags, status, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'draft', ?, ?)`
        )
        .run(id, header.title, header.source || null, header.url || null,
          header.author || null, body, wordCount, difficulty, tags, now, now);

      console.log(
        `  -> Imported: "${header.title}" (${wordCount} words, ${difficulty}, tags: ${tags})`
      );
      imported++;
    } catch (e: any) {
      const msg = `Error importing ${file}: ${e.message}`;
      console.log(`  -> ${msg}`);
      errors.push(msg);
    }
  }

  console.log(`\n=== Import Complete ===`);
  console.log(`Imported: ${imported}`);
  console.log(`Skipped: ${skipped}`);
  console.log(`Errors: ${errors.length}`);
  if (errors.length > 0) {
    for (const err of errors) {
      console.log(`  - ${err}`);
    }
  }

  sqlite.close();
}

main();
