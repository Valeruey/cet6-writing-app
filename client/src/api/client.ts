import { supabase } from "../supabase";

const BASE = "/api";

async function getAuthHeaders(): Promise<Record<string, string>> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  const { data } = await supabase.auth.getSession();
  if (data.session?.access_token) {
    headers["Authorization"] = `Bearer ${data.session.access_token}`;
  }
  return headers;
}

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  if (!navigator.onLine) {
    throw new Error("你当前处于离线状态，请检查网络连接");
  }
  const headers = await getAuthHeaders();
  const res = await fetch(`${BASE}${url}`, {
    headers,
    ...options,
  });
  if (res.status === 401) {
    // Don't hard-redirect — let the component handle the auth error gracefully
    throw new Error("UNAUTHORIZED");
  }
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Request failed" }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
  return res.json();
}

// ===== Auth =====
export async function fetchMe() {
  return request<{ user: { id: string; email: string } }>("/auth/me");
}

// ===== Articles =====
export function fetchArticles(page = 1, tag?: string) {
  const params = new URLSearchParams({ page: String(page), limit: "15" });
  if (tag) params.set("tag", tag);
  return request<{ data: any[]; total: number; page: number; limit: number; hasMore: boolean }>(
    `/articles?${params}`
  );
}

export function fetchArticle(id: string) {
  return request<any>(`/articles/${id}`);
}

export function fetchArticleExpressions(id: string) {
  return request<any[]>(`/articles/${id}/expressions`);
}

// ===== Expressions =====
export function fetchExpression(id: string) {
  return request<any>(`/expressions/${id}`);
}

export function saveExpression(id: string) {
  return request<any>(`/expressions/${id}/save`, { method: "POST" });
}

export function unsaveExpression(id: string) {
  return request<any>(`/expressions/${id}/save`, { method: "DELETE" });
}

export function fetchSavedExpressions(page = 1) {
  return request<any[]>(`/expressions/saved/list?page=${page}&limit=30`);
}

// ===== Practice =====
export function generatePractice(body: { type: string; article_id?: string; topic_keyword?: string }) {
  return request<{ prompt_text: string; prompt_type: string; topic_keywords: string[] }>(
    "/practice/generate",
    { method: "POST", body: JSON.stringify(body) }
  );
}

export function scorePractice(body: { type: string; prompt_text: string; user_writing: string }) {
  return request<{
    overall_score: number;
    breakdown: { content: number; language: number; structure: number };
    corrections: Array<{ original: string; corrected: string; explanation_cn: string }>;
    feedback_cn: string;
    suggestions: string[];
    session_id: string;
  }>("/practice/score", { method: "POST", body: JSON.stringify(body) });
}

export function fetchPracticeHistory(page = 1) {
  return request<{ data: any[]; total: number; page: number; limit: number; hasMore: boolean }>(
    `/practice/history?page=${page}&limit=20`
  );
}

// ===== Progress =====
export function fetchProgress() {
  return request<{
    articles_read: number;
    total_articles: number;
    practice_count: number;
    average_score: number | null;
    score_trend: Array<{ date: string; score: number }>;
    expressions_saved: number;
  }>("/progress");
}

export function updateArticleProgress(body: { article_id: string; completed?: number; position?: number }) {
  return request<any>("/progress/article", { method: "POST", body: JSON.stringify(body) });
}

// ===== Translation =====
export function fetchTranslationTopics(page = 1) {
  return request<{ data: any[]; total: number; page: number; limit: number; hasMore: boolean }>(
    `/translation/topics?page=${page}&limit=15`
  );
}

export function fetchTranslationTopic(id: string) {
  return request<any>(`/translation/topics/${id}`);
}

export function scoreTranslation(body: {
  source_text: string;
  user_translation: string;
  reference_answer?: string;
  topic_id?: string;
}) {
  return request<{
    overall_score: number;
    breakdown: { accuracy: number; fluency: number; key_phrases: number };
    phrase_comparisons: Array<{
      chinese: string;
      user_translation: string;
      reference: string;
      score: string;
      suggestion: string;
    }>;
    corrections: Array<{ original: string; corrected: string; explanation_cn: string }>;
    improved_version: string;
    feedback_cn: string;
    suggestions: string[];
    session_id: string;
  }>("/translation/score", { method: "POST", body: JSON.stringify(body) });
}

// ===== Review =====
export function fetchReviewDue(limit = 20) {
  return request<any[]>(`/review/due?limit=${limit}`);
}

export function rateReview(id: string, quality: number) {
  return request<any>(`/review/${id}/rate`, {
    method: "POST",
    body: JSON.stringify({ quality }),
  });
}

export function fetchReviewStats() {
  return request<{ total: number; due_today: number; mastered: number }>("/review/stats");
}
