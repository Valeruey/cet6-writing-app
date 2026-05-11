// Shared types between client and server

// ====== Articles ======
export interface Article {
  id: string;
  title: string;
  source: string | null;
  source_url: string | null;
  author: string | null;
  content: string;
  word_count: number;
  difficulty: "easy" | "medium" | "hard";
  topic_tags: string[]; // JSON array stored as text
  status: "draft" | "highlights_done" | "published";
  created_at: string;
  updated_at: string;
}

export interface ArticleListItem {
  id: string;
  title: string;
  source: string | null;
  word_count: number;
  difficulty: "easy" | "medium" | "hard";
  topic_tags: string[];
  status: string;
  created_at: string;
}

// ====== Expressions ======
export type ExpressionCategory = "vocabulary" | "phrase" | "sentence_pattern" | "transition";

export interface ExpressionAnalysis {
  where_to_use: string;
  why_good: string;
  cautions: string;
  similar_expressions: { text: string; nuance: string }[];
}

export interface Expression {
  id: string;
  article_id: string;
  text: string;
  start_offset: number;
  end_offset: number;
  category: ExpressionCategory;
  analysis: ExpressionAnalysis | null;
  sentence_context: string;
  created_at: string;
}

// ====== Exam Topics ======
export type ExamType = "writing" | "translation";
export type PromptType = "picture" | "topic_scenario" | "sentence_continuation";

export interface ExamTopic {
  id: string;
  year: number;
  month: number;
  set_number: number;
  type: ExamType;
  prompt_type: PromptType | null;
  prompt_text: string;
  reference_answer: string | null;
  source_file: string | null;
  created_at: string;
}

// ====== Practice Sessions ======

export interface ScoreBreakdown {
  content: number;   // 0-40
  language: number;  // 0-35
  structure: number; // 0-25
}

export interface Correction {
  original: string;
  corrected: string;
  explanation_cn: string;
}

export interface PracticeSession {
  id: string;
  type: ExamType;
  prompt_text: string;
  source: "ai_generated" | "exam_topic";
  exam_topic_id: string | null;
  user_writing: string;
  word_count: number;
  score: number | null;
  score_breakdown: ScoreBreakdown | null;
  feedback: string | null;
  corrections: Correction[] | null;
  created_at: string;
}

// ====== User Progress ======

export interface UserProgress {
  id: string;
  article_id: string;
  completed: number;
  expressions_saved: number;
  last_position: number;
  updated_at: string;
}

export interface ProgressOverview {
  articles_read: number;
  total_articles: number;
  practice_count: number;
  average_score: number | null;
  score_trend: { date: string; score: number }[];
  expressions_saved: number;
}

// ====== Saved Expressions ======
export interface SavedExpression {
  id: string;
  expression_id: string;
  saved_at: string;
  review_count: number;
  last_reviewed: string | null;
  expression?: Expression;
}

// ====== API Request/Response ======

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export interface GeneratePracticeRequest {
  type: ExamType;
  article_id?: string;
  topic_keyword?: string;
}

export interface GeneratePracticeResponse {
  prompt_text: string;
  prompt_type: PromptType;
  topic_keywords: string[];
}

export interface ScorePracticeRequest {
  type: ExamType;
  prompt_text: string;
  user_writing: string;
}

export interface ScorePracticeResponse {
  overall_score: number;
  breakdown: ScoreBreakdown;
  corrections: Correction[];
  feedback_cn: string;
  suggestions: string[];
}

// ====== Translation ======
export interface TranslationScoreBreakdown {
  accuracy: number;
  fluency: number;
  key_phrases: number;
}

export interface PhraseComparison {
  chinese: string;
  user_translation: string;
  reference: string;
  score: "good" | "acceptable" | "poor";
  suggestion: string;
}

export interface ScoreTranslationRequest {
  source_text: string;
  user_translation: string;
  reference_answer?: string;
  topic_id?: string;
}

export interface ScoreTranslationResponse {
  overall_score: number;
  breakdown: TranslationScoreBreakdown;
  phrase_comparisons: PhraseComparison[];
  corrections: Correction[];
  improved_version: string;
  feedback_cn: string;
  suggestions: string[];
}
