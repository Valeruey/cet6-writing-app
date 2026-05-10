import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { fetchProgress } from "../api/client";
import LoadingSpinner from "../components/shared/LoadingSpinner";
import ErrorMessage from "../components/shared/ErrorMessage";

export default function HomePage() {
  const navigate = useNavigate();
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["progress"],
    queryFn: fetchProgress,
  });

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message="加载失败" onRetry={() => refetch()} />;

  if (!data) return null;

  const scoreColor =
    data.average_score !== null
      ? data.average_score >= 80
        ? "text-green-600"
        : data.average_score >= 60
          ? "text-yellow-600"
          : "text-red-500"
      : "text-gray-400";

  return (
    <div className="max-w-lg mx-auto px-4 py-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">CET-6 写作备考</h1>
          <p className="text-xs text-gray-400 mt-0.5">目标：210+ 分</p>
        </div>
        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
          <span className="text-lg">📝</span>
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 gap-3">
        <div
          onClick={() => navigate("/articles")}
          className="bg-white rounded-xl border border-gray-100 p-4 cursor-pointer hover:shadow-md transition-shadow"
        >
          <p className="text-xs text-gray-400 mb-1">已读文章</p>
          <p className="text-2xl font-bold text-gray-900">
            {data.articles_read}
            <span className="text-sm font-normal text-gray-300">/{data.total_articles}</span>
          </p>
        </div>

        <div
          onClick={() => navigate("/history")}
          className="bg-white rounded-xl border border-gray-100 p-4 cursor-pointer hover:shadow-md transition-shadow"
        >
          <p className="text-xs text-gray-400 mb-1">练习次数</p>
          <p className="text-2xl font-bold text-gray-900">{data.practice_count}</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <p className="text-xs text-gray-400 mb-1">平均得分</p>
          <p className={`text-2xl font-bold ${scoreColor}`}>
            {data.average_score !== null ? Math.round(data.average_score) : "--"}
          </p>
        </div>

        <div
          onClick={() => navigate("/saved")}
          className="bg-white rounded-xl border border-gray-100 p-4 cursor-pointer hover:shadow-md transition-shadow"
        >
          <p className="text-xs text-gray-400 mb-1">收藏表达</p>
          <p className="text-2xl font-bold text-gray-900">{data.expressions_saved}</p>
        </div>
      </div>

      {/* Score trend */}
      {data.score_trend.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">近期得分趋势</h3>
          <div className="flex items-end gap-1 h-24">
            {data.score_trend.map((point, i) => {
              const height = Math.max((point.score / 100) * 100, 4);
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-[10px] text-gray-400">{point.score}</span>
                  <div
                    className="w-full bg-primary/60 rounded-t-sm transition-all"
                    style={{ height: `${height}%` }}
                  />
                  <span className="text-[9px] text-gray-300">{point.date.slice(5)}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Quick actions */}
      <div className="space-y-2">
        <button
          onClick={() => navigate("/articles")}
          className="w-full py-3.5 text-sm font-semibold text-white bg-primary hover:bg-primary-light rounded-xl transition-colors"
        >
          开始外刊精读
        </button>
        <button
          onClick={() => navigate("/practice")}
          className="w-full py-3.5 text-sm font-semibold text-primary bg-primary/10 hover:bg-primary/20 rounded-xl transition-colors"
        >
          直接练习写作
        </button>
      </div>
    </div>
  );
}
