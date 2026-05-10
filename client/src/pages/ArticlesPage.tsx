import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { fetchArticles } from "../api/client";
import LoadingSpinner, { ArticleCardSkeleton } from "../components/shared/LoadingSpinner";
import ErrorMessage from "../components/shared/ErrorMessage";
import EmptyState from "../components/shared/EmptyState";

const TOPIC_TAGS = ["全部", "education", "technology", "society", "science", "culture", "economy"];

export default function ArticlesPage() {
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const navigate = useNavigate();

  const tag = activeTag === "全部" || !activeTag ? undefined : activeTag;
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["articles", tag],
    queryFn: () => fetchArticles(1, tag),
  });

  const difficultyBadge = (d: string) => {
    const colors: Record<string, string> = {
      easy: "bg-green-50 text-green-600",
      medium: "bg-yellow-50 text-yellow-600",
      hard: "bg-red-50 text-red-600",
    };
    const labels: Record<string, string> = { easy: "简单", medium: "中等", hard: "较难" };
    return (
      <span className={`text-xs px-2 py-0.5 rounded-full ${colors[d] || "bg-gray-50 text-gray-500"}`}>
        {labels[d] || d}
      </span>
    );
  };

  return (
    <div className="max-w-lg mx-auto px-4 py-4 space-y-4">
      <h1 className="text-lg font-bold text-gray-900">外刊精读</h1>

      {/* Topic filter chips */}
      <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
        {TOPIC_TAGS.map((t) => {
          const isActive = t === "全部" ? !activeTag : activeTag === t;
          return (
            <button
              key={t}
              onClick={() => setActiveTag(isActive ? null : t)}
              className={`flex-shrink-0 px-3.5 py-1.5 text-xs font-medium rounded-full transition-colors ${
                isActive
                  ? "bg-primary text-white"
                  : "bg-gray-100 text-gray-500 hover:bg-gray-200"
              }`}
            >
              {t === "全部" ? "全部" : t}
            </button>
          );
        })}
      </div>

      {/* Article list */}
      {isLoading && (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <ArticleCardSkeleton key={i} />
          ))}
        </div>
      )}

      {error && <ErrorMessage message="加载文章失败" onRetry={() => refetch()} />}

      {!isLoading && !error && data?.data.length === 0 && (
        <EmptyState
          icon="📰"
          title="暂无文章"
          description="数据库还没有导入外刊文章，请先运行数据导入脚本"
        />
      )}

      {!isLoading && !error && (
        <div className="space-y-3">
          {data?.data.map((article: any) => (
            <div
              key={article.id}
              onClick={() => navigate(`/articles/${article.id}`)}
              className="bg-white rounded-xl border border-gray-100 p-4 cursor-pointer hover:shadow-md transition-all active:scale-[0.98]"
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <h3 className="text-sm font-semibold text-gray-900 leading-snug line-clamp-2 flex-1">
                  {article.title}
                </h3>
                {difficultyBadge(article.difficulty)}
              </div>

              <div className="flex items-center gap-2 text-xs text-gray-400 mb-2">
                {article.source && <span>{article.source}</span>}
                {article.source && article.word_count > 0 && <span>·</span>}
                {article.word_count > 0 && <span>{article.word_count} 词</span>}
              </div>

              {(article.topic_tags || []).length > 0 && (
                <div className="flex gap-1.5 flex-wrap">
                  {article.topic_tags.map((tag: string) => (
                    <span
                      key={tag}
                      className="text-[10px] px-2 py-0.5 rounded-full bg-gray-50 text-gray-400"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
