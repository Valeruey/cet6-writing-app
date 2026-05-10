import {
  HIGHLIGHT_DETECTION_PROMPT,
  ANALYSIS_PROMPT,
  PRACTICE_GENERATION_PROMPT,
  ESSAY_SCORING_PROMPT,
} from "../lib/prompts";

const API_KEY = process.env.DEEPSEEK_API_KEY || "";
const BASE_URL = "https://api.deepseek.com/anthropic";

interface AIMessage {
  role: "user" | "assistant";
  content: string;
}

async function chat(
  systemPrompt: string,
  userMessage: string,
  options: { temperature?: number; maxTokens?: number } = {}
): Promise<string> {
  const { temperature = 0.3, maxTokens = 4096 } = options;

  const messages: AIMessage[] = [
    { role: "user", content: `${systemPrompt}\n\n${userMessage}` },
  ];

  const response = await fetch(`${BASE_URL}/v1/messages`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "deepseek-v4-pro",
      max_tokens: maxTokens,
      temperature,
      thinking: { type: "disabled" },
      messages,
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`AI API error: ${response.status} ${errText}`);
  }

  const data = (await response.json()) as {
    content: Array<{ type: string; text: string }>;
  };

  const textContent = data.content.find((c) => c.type === "text");
  return textContent?.text || "";
}

function extractJson(text: string): string {
  // Remove markdown code fences if present
  let cleaned = text.trim();
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```(?:json)?\s*\n?/, "").replace(/\n?```\s*$/, "");
  }
  return cleaned;
}

// ====== AI Service Functions ======

export async function detectHighlights(
  articleContent: string
): Promise<
  Array<{
    text: string;
    start_offset: number;
    end_offset: number;
    category: string;
    sentence_context: string;
  }>
> {
  const result = await chat(HIGHLIGHT_DETECTION_PROMPT, articleContent, {
    temperature: 0.2,
    maxTokens: 4096,
  });

  try {
    const parsed = JSON.parse(extractJson(result));
    if (!Array.isArray(parsed)) throw new Error("Expected array");
    return parsed;
  } catch (e) {
    console.error("Failed to parse highlight detection result:", result.slice(0, 500));
    return [];
  }
}

export async function generateAnalysis(
  expression: string,
  context: string,
  category: string
): Promise<{
  where_to_use: string;
  why_good: string;
  cautions: string;
  similar_expressions: Array<{ text: string; nuance: string }>;
} | null> {
  const prompt = ANALYSIS_PROMPT.replace("[EXPRESSION]", expression)
    .replace("[CONTEXT]", context)
    .replace("[CATEGORY]", category);

  const result = await chat("You are a CET-6 writing analysis expert. Return only JSON.", prompt, {
    temperature: 0.3,
    maxTokens: 2048,
  });

  try {
    return JSON.parse(extractJson(result));
  } catch (e) {
    console.error("Failed to parse analysis result:", result.slice(0, 300));
    return null;
  }
}

export async function generatePracticePrompt(
  articleTheme: string,
  topicTags: string
): Promise<{
  prompt_text: string;
  prompt_type: string;
  topic_keywords: string[];
} | null> {
  const prompt = PRACTICE_GENERATION_PROMPT.replace("[ARTICLE_THEME]", articleTheme).replace(
    "[TOPIC_TAGS]",
    topicTags
  );

  const result = await chat("You are a CET-6 exam question writer. Return only JSON.", prompt, {
    temperature: 0.7,
    maxTokens: 1024,
  });

  try {
    return JSON.parse(extractJson(result));
  } catch (e) {
    console.error("Failed to parse practice prompt:", result.slice(0, 300));
    return null;
  }
}

export async function scoreEssay(
  promptText: string,
  userWriting: string,
  wordCount: number
): Promise<{
  overall_score: number;
  breakdown: { content: number; language: number; structure: number };
  corrections: Array<{ original: string; corrected: string; explanation_cn: string }>;
  feedback_cn: string;
  suggestions: string[];
} | null> {
  const fullPrompt = ESSAY_SCORING_PROMPT.replace("[PROMPT]", promptText)
    .replace("[ESSAY]", userWriting)
    .replace("[WORD_COUNT]", String(wordCount));

  const result = await chat("You are a CET-6 writing examiner. Return only JSON.", fullPrompt, {
    temperature: 0.3,
    maxTokens: 4096,
  });

  try {
    return JSON.parse(extractJson(result));
  } catch (e) {
    console.error("Failed to parse scoring result:", result.slice(0, 500));
    return null;
  }
}
