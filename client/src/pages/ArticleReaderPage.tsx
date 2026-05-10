import { useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { fetchArticle } from "../api/client";
import ArticleBody from "../components/reader/ArticleBody";
import ExpressionPanel from "../components/reader/ExpressionPanel";
import LoadingSpinner from "../components/shared/LoadingSpinner";
import ErrorMessage from "../components/shared/ErrorMessage";

export default function ArticleReaderPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeExpr, setActiveExpr] = useState<any>(null);
  const [showPanel, setShowPanel] = useState(false);

  const { data: article, isLoading, error, refetch } = useQuery({
    queryKey: ["article", id],
    queryFn: () => fetchArticle(id!),
    enabled: !!id,
  });

  const handleHighlightClick = useCallback((expr: any) => {
    setActiveExpr(expr);
    setShowPanel(true);
  }, []);

  const handleClosePanel = useCallback(() => {
    setShowPanel(false);
    // Keep activeExpr briefly for the exit animation
    setTimeout(() => setActiveExpr(null), 300);
  }, []);

  if (isLoading) return <LoadingSpinner text="加载文章中..." />;
  if (error) return <ErrorMessage message="加载文章失败" onRetry={() => refetch()} />;
  if (!article) return null;

  return (
    <div className="max-w-lg mx-auto">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white/90 backdrop-blur-sm border-b border-gray-100 px-4 py-3 safe-top">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-1.5 -ml-1.5 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-sm font-semibold text-gray-900 truncate">{article.title}</h1>
            <div className="flex items-center gap-2 text-[10px] text-gray-400">
              {article.source && <span>{article.source}</span>}
              <span>{article.word_count} 词</span>
            </div>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="px-4 py-2 flex gap-3 text-[10px] text-gray-400 overflow-x-auto scrollbar-hide">
        <span className="flex items-center gap-1 flex-shrink-0">
          <span className="w-2.5 h-2.5 rounded bg-amber-400" /> 词汇
        </span>
        <span className="flex items-center gap-1 flex-shrink-0">
          <span className="w-2.5 h-2.5 rounded bg-emerald-400" /> 短语
        </span>
        <span className="flex items-center gap-1 flex-shrink-0">
          <span className="w-2.5 h-2.5 rounded bg-purple-400" /> 句型
        </span>
        <span className="flex items-center gap-1 flex-shrink-0">
          <span className="w-2.5 h-2.5 rounded bg-blue-400" /> 过渡词
        </span>
      </div>

      {/* Article content */}
      <div className="px-4 py-4">
        <ArticleBody
          content={article.content}
          expressions={article.expressions || []}
          activeExpressionId={activeExpr?.id}
          onHighlightClick={handleHighlightClick}
        />
      </div>

      {/* Expression panel (bottom sheet) */}
      {showPanel && activeExpr && (
        <ExpressionPanel expression={activeExpr} onClose={handleClosePanel} />
      )}
    </div>
  );
}
