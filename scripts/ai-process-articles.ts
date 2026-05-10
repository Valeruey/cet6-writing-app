/**
 * Batch AI processing: for each "draft" article, run highlight detection
 * then generate analysis for each highlight.
 *
 * Usage: bun run scripts/ai-process-articles.ts
 *
 * This script processes articles in batches with rate limiting.
 * Set DEEPSEEK_API_KEY in .env first.
 */

import { Database } from "bun:sqlite";
import { v4 as uuid } from "uuid";

const DB_PATH = process.env.DATABASE_PATH || "./data/cet6.db";
const API_KEY = process.env.DEEPSEEK_API_KEY || "";
const BASE_URL = "https://api.deepseek.com/anthropic";
const DELAY_MS = 800; // Rate limit delay between API calls

if (!API_KEY) {
  console.error("DEEPSEEK_API_KEY not set in .env");
  process.exit(1);
}

const HIGHLIGHT_PROMPT = `You are a CET-6 writing coach. Analyze the following English article and identify useful expressions.

For each expression, classify into:
- "vocabulary": Advanced/formal academic single words
- "phrase": Collocations, idioms, fixed expressions for formal writing
- "sentence_pattern": Syntactic structures worth imitating (inverted, emphatic, complex subordination, participial phrases)
- "transition": Logical connectors, discourse markers

Focus on expressions that are transferable across many essay topics and demonstrate good academic style.

Return ONLY a valid JSON array:
[{"text": "exact text", "start_offset": N, "end_offset": N, "category": "...", "sentence_context": "full sentence"}]`;

const ANALYSIS_PROMPT = `Analyze this English expression for CET-6 writing preparation (target: 210+/250).

Expression: "[EXPRESSION]"
Full sentence: "[CONTEXT]"
Category: [CATEGORY]

Provide analysis in Chinese. Return ONLY JSON:
{
  "where_to_use": "适用场景（2-3句中文）",
  "why_good": "为什么值得学（2-3句中文）",
  "cautions": "注意事项（1-2句中文）",
  "similar_expressions": [{"text": "替代表达", "nuance": "区别"}] (2-3 items)
}`;

async function chat(systemPrompt: string, userMessage: string): Promise<string> {
  const response = await fetch(`${BASE_URL}/v1/messages`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "deepseek-v4-pro",
      max_tokens: 4096,
      temperature: 0.2,
      thinking: { type: "disabled" },
      messages: [{ role: "user", content: `${systemPrompt}\n\n${userMessage}` }],
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`API error ${response.status}: ${errText.slice(0, 200)}`);
  }

  const data = (await response.json()) as {
    content: Array<{ type: string; text: string }>;
  };
  return data.content.find((c) => c.type === "text")?.text || "";
}

function extractJson(text: string): string {
  let cleaned = text.trim();
  cleaned = cleaned.replace(/^```(?:json)?\s*\n?/, "").replace(/\n?```\s*$/, "");
  return cleaned;
}

async function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function processArticle(
  sqlite: Database,
  article: { id: string; title: string; content: string }
): Promise<boolean> {
  console.log(`\nProcessing: "${article.title}"`);
  console.log(`  Words: ${article.content.split(/\s+/).filter(Boolean).length}`);

  try {
    // Step 1: Detect highlights
    console.log("  Step 1: Detecting highlights...");
    const highlightsResult = await chat(HIGHLIGHT_PROMPT, article.content);

    let highlights: any[];
    try {
      highlights = JSON.parse(extractJson(highlightsResult));
      if (!Array.isArray(highlights)) throw new Error("Not an array");
    } catch {
      console.log(`  -> Failed to parse highlights: ${highlightsResult.slice(0, 200)}`);
      return false;
    }

    console.log(`  -> Found ${highlights.length} expressions`);

    const now = new Date().toISOString();

    // Step 2: Validate and insert highlights
    const validHighlights: any[] = [];
    for (const h of highlights) {
      // Validate offset
      const extracted = article.content.slice(h.start_offset, h.end_offset);
      if (extracted !== h.text) {
        // Try fuzzy matching
        const pos = article.content.indexOf(h.text);
        if (pos !== -1) {
          h.start_offset = pos;
          h.end_offset = pos + h.text.length;
        } else {
          console.log(`    Skipping "${h.text}" - not found in article`);
          continue;
        }
      }
      validHighlights.push(h);
    }

    // Insert into database
    for (const h of validHighlights) {
      const exprId = uuid();
      sqlite
        .prepare(
          `INSERT INTO expressions (id, article_id, text, start_offset, end_offset, category, sentence_context, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
        )
        .run(
          exprId,
          article.id,
          h.text,
          h.start_offset,
          h.end_offset,
          h.category,
          h.sentence_context || "",
          now
        );
    }

    // Step 3: Generate analysis for each highlight
    console.log("  Step 2: Generating analysis...");
    for (let i = 0; i < validHighlights.length; i++) {
      const h = validHighlights[i]!;
      const exprId = sqlite
        .prepare("SELECT id FROM expressions WHERE article_id = ? AND text = ? LIMIT 1")
        .get(article.id, h.text) as { id: string } | undefined;

      if (!exprId) continue;

      console.log(`    [${i + 1}/${validHighlights.length}] Analyzing: "${h.text.slice(0, 50)}..."`);

      try {
        const analysisPrompt = ANALYSIS_PROMPT.replace("[EXPRESSION]", h.text)
          .replace("[CONTEXT]", h.sentence_context || "")
          .replace("[CATEGORY]", h.category);

        const analysisResult = await chat("Return only JSON.", analysisPrompt);
        const analysis = JSON.parse(extractJson(analysisResult));

        sqlite
          .prepare("UPDATE expressions SET analysis = ? WHERE id = ?")
          .run(JSON.stringify(analysis), exprId.id);
      } catch (e: any) {
        console.log(`      Failed: ${e.message.slice(0, 100)}`);
      }

      await sleep(DELAY_MS);
    }

    // Mark article as published
    sqlite
      .prepare("UPDATE articles SET status = 'published', updated_at = ? WHERE id = ?")
      .run(now, article.id);

    console.log(`  -> Done! Published with ${validHighlights.length} expressions.`);
    return true;
  } catch (e: any) {
    console.log(`  -> Error: ${e.message}`);
    return false;
  }
}

async function main() {
  console.log("AI Article Processor");
  console.log("====================\n");

  const sqlite = new Database(DB_PATH);

  // Get draft articles
  const articles = sqlite
    .prepare("SELECT id, title, content FROM articles WHERE status = 'draft' LIMIT 50")
    .all() as Array<{ id: string; title: string; content: string }>;

  console.log(`Found ${articles.length} draft articles to process.\n`);

  if (articles.length === 0) {
    console.log("No draft articles found. Run prepare-articles.ts first.");
    sqlite.close();
    return;
  }

  let success = 0;
  let failed = 0;

  for (let i = 0; i < articles.length; i++) {
    const article = articles[i]!;
    console.log(`\n[Article ${i + 1}/${articles.length}]`);

    const ok = await processArticle(sqlite, article);
    if (ok) success++;
    else failed++;

    if (i < articles.length - 1) {
      await sleep(DELAY_MS);
    }
  }

  console.log(`\n=== Processing Complete ===`);
  console.log(`Success: ${success}`);
  console.log(`Failed: ${failed}`);

  sqlite.close();
}

main().catch(console.error);
