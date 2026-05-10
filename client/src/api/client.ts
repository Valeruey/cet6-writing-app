const BASE = "/api";

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${url}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Request failed" }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
  return res.json();
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
