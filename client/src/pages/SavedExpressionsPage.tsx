import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { fetchSavedExpressions, unsaveExpression, fetchReviewStats } from "../api/client";
import LoadingSpinner from "../components/shared/LoadingSpinner";
import ErrorMessage from "../components/shared/ErrorMessage";
import EmptyState from "../components/shared/EmptyState";
import ExpressionPanel from "../components/reader/ExpressionPanel";

const CATEGORY_BADGES: Record<string, string> = {
  vocabulary: "bg-amber-100 text-amber-700",
  phrase: "bg-emerald-100 text-emerald-700",
  sentence_pattern: "bg-purple-100 text-purple-700",
  transition: "bg-blue-100 text-blue-700",
};

const CATEGORY_LABELS: Record<string, string> = {
  vocabulary: "词汇",
  phrase: "短语",
  sentence_pattern: "句型",
  transition: "过渡",
};

function masteryLabel(interval: number | null | undefined): { label: string; color: string } {
  const i = interval ?? 0;
  if (i === 0) return { label: "新学", color: "bg-gray-100 text-gray-500" };
  if (i < 7) return { label: "学习", color: "bg-yellow-100 text-yellow-700" };
  if (i < 21) return { label: "复习", color: "bg-blue-100 text-blue-700" };
  return { label: "掌握", color: "bg-green-100 text-green-700" };
}

export default function SavedExpressionsPage() {
  const navigate = useNavigate();
  const [activeExpr, setActiveExpr] = useState<any>(null);
  const [showPanel, setShowPanel] = useState(false);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["savedExpressions"],
    queryFn: () => fetchSavedExpressions(1),
    retry: false,
  });

  const { data: reviewStats } = useQuery({
    queryKey: ["review-stats"],
    queryFn: fetchReviewStats,
    retry: false,
  });

  const isUnauthorized = (error as Error)?.message === "UNAUTHORIZED";

  const handleClick = (item: any) => {
    setActiveExpr({
      id: item.expression_id,
      text: item.text,
      category: item.category,
      sentence_context: item.sentence_context,
    });
    setShowPanel(true);
  };

  const handleClose = () => {
    setShowPanel(false);
    setTimeout(() => setActiveExpr(null), 300);
  };

  const handleUnsave = async (expressionId: string) => {
    try {
      await unsaveExpression(expressionId);
      refetch();
    } catch {
      // ignore
    }
  };

  return (
    <div className="max-w-lg mx-auto px-4 py-4 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold text-gray-900">表达词库</h1>
        {data && data.length > 0 && (
          <span className="text-xs text-gray-400">{data.length} 条</span>
        )}
      </div>

      {/* Review CTA */}
      {reviewStats && reviewStats.due_today > 0 && (
        <button
          onClick={() => navigate("/review")}
          className="w-full flex items-center justify-between bg-primary/5 border border-primary/10 rounded-xl p-3 hover:bg-primary/10 transition-colors"
        >
          <div className="flex items-center gap-2">
            <span className="text-lg">📝</span>
            <div className="text-left">
              <p className="text-sm font-semibold text-primary">今日复习</p>
              <p className="text-xs text-gray-400">
                {reviewStats.due_today} 个表达待复习 · 已掌握 {reviewStats.mastered} 个
              </p>
            </div>
          </div>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="text-primary">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
      )}

      {isLoading && <LoadingSpinner />}
      {error && !isUnauthorized && <ErrorMessage message="加载失败" onRetry={() => refetch()} />}
      {error && isUnauthorized && (
        <div className="bg-white rounded-xl border border-gray-100 p-6 text-center space-y-4">
          <p className="text-4xl">🔐</p>
          <h2 className="text-lg font-bold text-gray-900">登录后查看词库</h2>
          <p className="text-sm text-gray-500">收藏和复习你的英语表达，利用间隔重复高效记忆</p>
          <button onClick={() => navigate("/login")} className="px-6 py-2.5 text-sm font-semibold text-white bg-primary hover:bg-primary-light rounded-xl transition-colors">
            去登录
          </button>
        </div>
      )}

      {!isLoading && !error && (!data || data.length === 0) && (
        <EmptyState
          icon="📑"
          title="暂无收藏"
          description="在文章阅读中点击收藏按钮，保存你感兴趣的表达式"
        />
      )}

      <div className="space-y-2">
        {data?.map((item: any) => {
          const m = masteryLabel(item.interval);
          return (
            <div
              key={item.id}
              className="bg-white rounded-xl border border-gray-100 p-3.5"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0 cursor-pointer" onClick={() => handleClick(item)}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${CATEGORY_BADGES[item.category] || "bg-gray-100 text-gray-600"}`}>
                      {CATEGORY_LABELS[item.category] || item.category}
                    </span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${m.color}`}>
                      {m.label}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-gray-900 leading-relaxed">{item.text}</p>
                  {item.sentence_context && (
                    <p className="mt-1 text-xs text-gray-400 line-clamp-1 italic">
                      {item.sentence_context}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => handleUnsave(item.expression_id)}
                  className="p-1.5 text-yellow-500 hover:text-red-400 transition-colors flex-shrink-0"
                  title="取消收藏"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" stroke="none">
                    <path d="M19 21l-7-4-7 4V5a2 2 0 012-2h10a2 2 0 012 2v16z" />
                  </svg>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Expression panel */}
      {showPanel && activeExpr && (
        <ExpressionPanel expression={activeExpr} onClose={handleClose} />
      )}
    </div>
  );
}
