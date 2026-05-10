import { useQuery } from "@tanstack/react-query";
import { fetchPracticeHistory } from "../api/client";
import LoadingSpinner from "../components/shared/LoadingSpinner";
import ErrorMessage from "../components/shared/ErrorMessage";
import EmptyState from "../components/shared/EmptyState";
import { useNavigate } from "react-router-dom";

export default function HistoryPage() {
  const navigate = useNavigate();
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["practiceHistory"],
    queryFn: () => fetchPracticeHistory(1),
  });

  const scoreBadge = (score: number | null) => {
    if (score === null) return null;
    let cls = "text-xs font-bold px-2 py-0.5 rounded-full ";
    if (score >= 85) cls += "bg-green-100 text-green-700";
    else if (score >= 70) cls += "bg-blue-100 text-blue-700";
    else if (score >= 55) cls += "bg-yellow-100 text-yellow-700";
    else cls += "bg-red-100 text-red-700";
    return <span className={cls}>{Math.round(score)}分</span>;
  };

  return (
    <div className="max-w-lg mx-auto px-4 py-4 space-y-4">
      <h1 className="text-lg font-bold text-gray-900">练习记录</h1>

      {isLoading && <LoadingSpinner />}
      {error && <ErrorMessage message="加载失败" onRetry={() => refetch()} />}

      {!isLoading && !error && data?.data.length === 0 && (
        <EmptyState
          icon="📋"
          title="暂无练习记录"
          description="完成一次写作练习后，记录会显示在这里"
          action={{ label: "去练习", onClick: () => navigate("/practice") }}
        />
      )}

      <div className="space-y-3">
        {data?.data.map((session: any) => (
          <div
            key={session.id}
            className="bg-white rounded-xl border border-gray-100 p-4"
          >
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-600 line-clamp-2 leading-relaxed">
                  {session.prompt_text.slice(0, 120)}...
                </p>
              </div>
              {scoreBadge(session.score)}
            </div>

            <div className="flex items-center gap-2 text-xs text-gray-400">
              <span>{session.created_at.slice(0, 10)}</span>
              <span>·</span>
              <span>{session.word_count} 词</span>
              <span>·</span>
              <span>{session.type === "writing" ? "议论文" : "翻译"}</span>
            </div>

            {session.feedback && (
              <p className="mt-2 text-xs text-gray-500 line-clamp-2 leading-relaxed">
                {session.feedback}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
