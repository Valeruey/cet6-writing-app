import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { fetchProgress } from "../api/client";
import { useOnlineStatus } from "../hooks/useOnlineStatus";
import { useInstallPrompt } from "../hooks/useInstallPrompt";
import LoadingSpinner from "../components/shared/LoadingSpinner";
import ErrorMessage from "../components/shared/ErrorMessage";

export default function HomePage() {
  const navigate = useNavigate();
  const isOnline = useOnlineStatus();
  const installPrompt = useInstallPrompt();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["progress"],
    queryFn: fetchProgress,
    retry: false,
  });

  if (isLoading) return <LoadingSpinner />;
  if (error) {
    const isUnauthorized = (error as Error).message === "UNAUTHORIZED";
    return (
      <div className="max-w-lg mx-auto px-4 py-6 space-y-5">
        {isUnauthorized ? (
          <div className="bg-white rounded-xl border border-gray-100 p-6 text-center space-y-4">
            <p className="text-4xl">🔐</p>
            <h2 className="text-lg font-bold text-gray-900">欢迎使用 WriteLab</h2>
            <p className="text-sm text-gray-500">登录后可查看学习进度和个性化推荐</p>
            <div className="flex gap-2 justify-center">
              <button onClick={() => navigate("/login")} className="px-6 py-2.5 text-sm font-semibold text-white bg-primary hover:bg-primary-light rounded-xl transition-colors">
                登录
              </button>
              <button onClick={() => navigate("/register")} className="px-6 py-2.5 text-sm font-semibold text-primary bg-primary/10 hover:bg-primary/20 rounded-xl transition-colors">
                注册
              </button>
            </div>
            <div className="pt-3 border-t border-gray-50">
              <button onClick={() => navigate("/articles")} className="text-sm text-primary hover:underline">
                先看看外刊文章 →
              </button>
            </div>
          </div>
        ) : (
          <ErrorMessage message="加载失败" onRetry={() => refetch()} />
        )}
      </div>
    );
  }

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
      {/* Offline banner */}
      {!isOnline && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl px-4 py-2 text-center">
          <p className="text-xs text-yellow-700">📡 你当前处于离线状态，部分功能可能不可用</p>
        </div>
      )}

      {/* Install banner */}
      {installPrompt && (
        <div className="bg-primary/5 border border-primary/10 rounded-xl px-4 py-3 flex items-center justify-between">
          <p className="text-xs text-primary font-medium">添加到主屏幕，随时练习</p>
          <button
            onClick={() => installPrompt.prompt()}
            className="text-xs px-3 py-1.5 bg-primary text-white rounded-lg font-medium hover:bg-primary-light transition-colors"
          >
            安装
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">CET-6 写作备考</h1>
          <p className="text-xs text-gray-400 mt-0.5">目标：210+ 分</p>
        </div>
        <div className="flex items-center gap-2">
          {data.current_streak > 0 && (
            <span className="text-xs text-orange-500 font-medium">🔥 {data.current_streak} 天</span>
          )}
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <span className="text-lg">📝</span>
          </div>
        </div>
      </div>

      {/* Weakness card */}
      {data.weakness && (
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <p className="text-xs text-gray-400 mb-2">薄弱项分析</p>
          <div className="flex items-center gap-3">
            <div className="flex-1 space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">内容</span>
                <span className="text-gray-700">{data.weakness.content_avg}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">语言</span>
                <span className="text-gray-700">{data.weakness.language_avg}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">结构</span>
                <span className="text-gray-700">{data.weakness.structure_avg}</span>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-400">最需提升</p>
              <p className="text-sm font-semibold text-amber-600">
                {data.weakness.weakest === "content" ? "内容立意" :
                 data.weakness.weakest === "language" ? "语言词汇" : "结构连贯"}
              </p>
            </div>
          </div>
        </div>
      )}

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
          练习写作
        </button>
        <button
          onClick={() => navigate("/practice?mode=translation")}
          className="w-full py-3.5 text-sm font-semibold text-accent bg-accent/10 hover:bg-accent/20 rounded-xl transition-colors"
        >
          练习翻译
        </button>
      </div>
    </div>
  );
}
