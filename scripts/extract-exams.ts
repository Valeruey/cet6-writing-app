/**
 * Extract CET-6 exam topics from DOCX files in the exam data directory.
 * Parses DOCX XML to find writing prompts (Part I) and translation passages (Part IV).
 *
 * Usage: bun run scripts/extract-exams.ts
 */

import { readdirSync, existsSync, mkdirSync, writeFileSync } from "fs";
import { join, basename } from "path";
import { v4 as uuid } from "uuid";

const EXAM_ROOT = "D:/文件/学习/英文/CET4-6/四六级历年真题汇总";
const OUTPUT_FILE = "./data/extracted_exams.json";

async function extractTextFromDocx(filePath: string): Promise<string> {
  const escapedPath = filePath.replace(/\\/g, "\\\\");
  const pythonScript = `
import sys, io, zipfile, xml.etree.ElementTree as ET
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
try:
    z = zipfile.ZipFile(r"${escapedPath}")
    xml_bytes = z.read("word/document.xml")
    z.close()
    tree = ET.fromstring(xml_bytes)
    paragraphs = []
    for p in tree.iter("{http://schemas.openxmlformats.org/wordprocessingml/2006/main}p"):
        texts = []
        for t in p.iter("{http://schemas.openxmlformats.org/wordprocessingml/2006/main}t"):
            if t.text:
                texts.append(t.text)
        if texts:
            paragraphs.append("".join(texts))
    print("\\n".join(paragraphs))
except Exception as e:
    print(f"__ERROR__:{e}")
`.trim();

  const proc = Bun.spawn(["python", "-c", pythonScript], {
    stdout: "pipe",
    stderr: "pipe",
  });

  const output = await new Response(proc.stdout).text();
  if (output.startsWith("__ERROR__:")) {
    console.log(`  XML parse error: ${output.slice(0, 200)}`);
    return "";
  }
  return output;
}

interface ExamTopicData {
  year: number;
  month: number;
  set_number: number;
  type: "writing" | "translation";
  prompt_type?: string | null;
  prompt_text: string;
  reference_answer?: string | null;
  source_file: string;
}

function parseYearMonth(relPath: string): { year: number; month: number } | null {
  // Try full path first, then filename
  const candidates = [relPath, basename(relPath)];
  for (const candidate of candidates) {
    // Match "2015年12月" or "2015年6月" (both 1-digit and 2-digit months)
    let match = candidate.match(/(\d{4})年(\d{1,2})月/);
    if (match) {
      return { year: parseInt(match[1]!), month: parseInt(match[2]!) };
    }
    // Match "2023.03" or "2023_03" or "2023-03" format
    match = candidate.match(/(\d{4})[._-](\d{1,2})\b/);
    if (match) {
      const m = parseInt(match[2]!);
      if (m >= 1 && m <= 12) {
        return { year: parseInt(match[1]!), month: m };
      }
    }
  }
  return null;
}

function parseSetNumber(relPath: string): number {
  const candidates = [relPath, basename(relPath)];
  for (const candidate of candidates) {
    if (/卷一|第一套|第1套|vol\.?\s*1|set\.?\s*1/i.test(candidate)) return 1;
    if (/卷二|第二套|第2套|vol\.?\s*2|set\.?\s*2/i.test(candidate)) return 2;
    if (/卷三|第三套|第3套|vol\.?\s*3|set\.?\s*3/i.test(candidate)) return 3;
  }
  return 1;
}

function isCET4File(relPath: string): boolean {
  // Strip combined "四六级" / "cet4-6" terms first, then check for standalone CET-4
  const lower = relPath.toLowerCase();
  const stripped = lower.replace(/四六级|cet[\s_-]?4[\s_-]?6/gi, "");
  return /四级|cet[\s_-]?4/.test(stripped) && !/六级|cet[\s_-]?6/.test(stripped);
}

function extractWritingPrompt(text: string): { prompt: string; type: string | null } | null {
  // Match "Part I Writing" through directions/content until Part II or end
  const patterns = [
    /Part\s+I\s+Writing[\s\S]*?Directions:\s*([\s\S]*?)(?=Part\s+II\s|Part\s+Two\s|$)/i,
    /Part\s+I\s+Writing[\s\S]*?(?=Part\s+II\s|Part\s+Two\s)/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    const promptBlock = match?.[1] ? match[1].trim() : match?.[0]?.trim();
    if (!promptBlock) continue;

    // Collapse whitespace
    let prompt = promptBlock.replace(/\s+/g, " ").trim();
    prompt = prompt.replace(/^Directions:\s*/i, "").trim();

    // Reject if it looks like a non-writing section
    if (
      /In this section[,.]?\s*you (will|are going to) (hear|read)/i.test(prompt) ||
      /listening comprehension/i.test(prompt) ||
      /reading comprehension/i.test(prompt) ||
      /long conversation/i.test(prompt) ||
      /passage (one|two|three|1|2|3)/i.test(prompt) ||
      /Section\s+[ABC]/i.test(prompt)
    ) {
      return null;
    }

    // Must be long enough and contain writing-related keywords
    if (prompt.length < 25) continue;
    if (
      !/essay|write|writing|letter|report|advertisement|saying|comment/i.test(prompt)
    ) {
      continue;
    }

    let promptType: string | null = "topic_scenario";
    if (/picture below|cartoon|describe the drawing|as shown in/i.test(prompt)) {
      promptType = "picture";
    } else if (/begins with the sentence|start with the sentence|begin your essay with/i.test(prompt)) {
      promptType = "sentence_continuation";
    } else if (/commenting on the saying/i.test(prompt)) {
      promptType = "saying_commentary";
    } else if (/write a letter|write an email/i.test(prompt)) {
      promptType = "letter";
    }

    return { prompt, type: promptType };
  }
  return null;
}

function extractTranslation(text: string): string | null {
  // Broader patterns for Part IV Translation
  const patterns = [
    // Pattern 1: Standard format with time limit
    /Part\s+IV\s+Translation[\s\S]*?(?:\d+\s*minutes?\s*\)?)\s*([\s\S]*?)(?=Part\s+V|Part\s+Five|$)/i,
    // Pattern 2: Translation section
    /Part\s+IV\s+Translation[\s\S]*?([一-鿿][\s\S]{30,}?)(?=Part\s+V|Part\s+Five|$)/i,
    // Pattern 3: Just look for translation section
    /Translation\s*(?:\([^)]*\))?\s*([一-鿿][\s\S]*?[一-鿿][\s\S]*?)(?=Part\s+|Section\s+|$)/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (!match?.[1]) continue;

    let passage = match[1].trim();
    // Remove answer sheet references
    passage = passage.replace(/Answer\s*Sheet\s*\d+/gi, "").trim();
    passage = passage.replace(/\s+/g, "").trim();

    // Must contain Chinese characters
    if (!/[一-鿿]/.test(passage)) continue;
    if (passage.length < 20) continue;

    return passage;
  }
  return null;
}

async function walkFiles(
  dir: string,
  predicate: (f: string) => boolean
): Promise<string[]> {
  const results: string[] = [];
  try {
    const entries = readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = join(dir, entry.name);
      if (entry.isDirectory()) {
        results.push(...await walkFiles(fullPath, predicate));
      } else if (entry.isFile() && predicate(entry.name)) {
        results.push(fullPath);
      }
    }
  } catch {
    // Skip inaccessible directories
  }
  return results;
}

async function main() {
  console.log("Starting exam extraction...");
  console.log(`Exam root: ${EXAM_ROOT}\n`);

  if (!existsSync(EXAM_ROOT)) {
    console.error(`Exam directory not found: ${EXAM_ROOT}`);
    process.exit(1);
  }

  // Find all CET6 DOCX files
  const allDocxFiles = await walkFiles(EXAM_ROOT, (name) =>
    name.toLowerCase().endsWith(".docx")
  );

  // Filter to only CET6 files, excluding CET4
  // "四六级" means both CET4+CET6, so strip it before checking for standalone 四级/六级
  const cet6Files = allDocxFiles.filter((f) => {
    const relative = f.replace(EXAM_ROOT, "");
    const lower = relative.toLowerCase();
    // Remove "四六级" and "cet4-6" / "cet4~6" combined terms
    const stripped = lower.replace(/四六级|cet[\s_-]?4[\s_-]?6/gi, "");
    const isCet6 = /六级|cet[\s_-]?6/.test(stripped);
    const isCet4 = /四级|cet[\s_-]?4/.test(stripped);
    return isCet6 && !isCet4;
  });

  console.log(`Found ${cet6Files.length} CET6 DOCX files (${allDocxFiles.length} total DOCX)\n`);

  const allTopics: ExamTopicData[] = [];

  for (const file of cet6Files) {
    console.log(`Extracting: ${basename(file)}`);
    const text = await extractTextFromDocx(file);

    if (!text || text.length < 100) {
      console.log("  -> Skipped (no meaningful text)");
      continue;
    }

    // Parse year/month from path and filename
    const relPath = file.replace(EXAM_ROOT, "");
    const ym = parseYearMonth(relPath);
    const year = ym?.year ?? 0;
    const month = ym?.month ?? 0;
    const setNum = parseSetNumber(relPath);
    const sourceFile = relPath.replace(/\\/g, "/");

    if (year === 0) {
      console.log(`  -> Warning: could not parse year/month from: ${relPath.slice(0, 80)}`);
    }

    // Extract writing prompt
    const writingResult = extractWritingPrompt(text);
    if (writingResult) {
      console.log(`  -> Found writing (${writingResult.type})`);
      allTopics.push({
        year,
        month,
        set_number: setNum,
        type: "writing",
        prompt_type: writingResult.type,
        prompt_text: writingResult.prompt,
        source_file: sourceFile,
      });
    } else {
      console.log("  -> No writing prompt found");
    }

    // Extract translation
    const translation = extractTranslation(text);
    if (translation) {
      console.log(`  -> Found translation (${translation.length} chars)`);
      allTopics.push({
        year,
        month,
        set_number: setNum,
        type: "translation",
        prompt_text: translation,
        source_file: sourceFile,
      });
    } else {
      console.log("  -> No translation found");
    }
  }

  console.log(`\n=== Extraction Complete ===`);
  console.log(`Total topics: ${allTopics.length}`);
  console.log(`Writing: ${allTopics.filter((t) => t.type === "writing").length}`);
  console.log(`Translation: ${allTopics.filter((t) => t.type === "translation").length}`);

  // Show year distribution
  const yearDist: Record<number, number> = {};
  allTopics.forEach((t) => {
    yearDist[t.year] = (yearDist[t.year] || 0) + 1;
  });
  console.log("Year distribution:", yearDist);

  if (!existsSync("./data")) {
    mkdirSync("./data", { recursive: true });
  }
  writeFileSync(OUTPUT_FILE, JSON.stringify(allTopics, null, 2), "utf-8");
  console.log(`Saved to: ${OUTPUT_FILE}`);

  // Generate SQL inserts
  const sqlLines: string[] = [];
  const now = new Date().toISOString();
  for (const topic of allTopics) {
    const id = uuid();
    const escapedPrompt = topic.prompt_text.replace(/'/g, "''");
    sqlLines.push(
      `INSERT OR IGNORE INTO exam_topics (id, year, month, set_number, type, prompt_type, prompt_text, source_file, created_at) VALUES ('${id}', ${topic.year}, ${topic.month}, ${topic.set_number}, '${topic.type}', ${topic.prompt_type ? `'${topic.prompt_type}'` : "NULL"}, '${escapedPrompt}', '${topic.source_file}', '${now}');`
    );
  }

  const sqlFile = "./data/extracted_exams.sql";
  writeFileSync(sqlFile, sqlLines.join("\n"), "utf-8");
  console.log(`SQL saved to: ${sqlFile}`);
}

main().catch(console.error);
