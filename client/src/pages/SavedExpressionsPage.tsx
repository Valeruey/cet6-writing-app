import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchSavedExpressions, unsaveExpression } from "../api/client";
import LoadingSpinner from "../components/shared/LoadingSpinner";
import ErrorMessage from "../components/shared/ErrorMessage";
import EmptyState from "../components/shared/EmptyState";
import ExpressionPanel from "../components/reader/ExpressionPanel";

export default function SavedExpressionsPage() {
  const [activeExpr, setActiveExpr] = useState<any>(null);
  const [showPanel, setShowPanel] = useState(false);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["savedExpressions"],
    queryFn: () => fetchSavedExpressions(1),
  });

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

  const categoryBadge = (cat: string) => {
    const colors: Record<string, string> = {
      vocabulary: "bg-amber-100 text-amber-700",
      phrase: "bg-emerald-100 text-emerald-700",
      sentence_pattern: "bg-purple-100 text-purple-700",
      transition: "bg-blue-100 text-blue-700",
    };
    const labels: Record<string, string> = {
      vocabulary: "词汇",
      phrase: "短语",
      sentence_pattern: "句型",
      transition: "过渡",
    };
    return (
      <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${colors[cat] || "bg-gray-100 text-gray-600"}`}>
        {labels[cat] || cat}
      </span>
    );
  };

  return (
    <div className="max-w-lg mx-auto px-4 py-4 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold text-gray-900">我的收藏</h1>
        {data && data.length > 0 && (
          <span className="text-xs text-gray-400">{data.length} 条</span>
        )}
      </div>

      {isLoading && <LoadingSpinner />}
      {error && <ErrorMessage message="加载失败" onRetry={() => refetch()} />}

      {!isLoading && !error && (!data || data.length === 0) && (
        <EmptyState
          icon="📑"
          title="暂无收藏"
          description="在文章阅读中点击收藏按钮，保存你感兴趣的表达式"
        />
      )}

      <div className="space-y-2">
        {data?.map((item: any) => (
          <div
            key={item.id}
            className="bg-white rounded-xl border border-gray-100 p-3.5"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0 cursor-pointer" onClick={() => handleClick(item)}>
                <div className="flex items-center gap-2 mb-1">
                  {categoryBadge(item.category)}
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
        ))}
      </div>

      {/* Expression panel */}
      {showPanel && activeExpr && (
        <ExpressionPanel expression={activeExpr} onClose={handleClose} />
      )}
    </div>
  );
}
