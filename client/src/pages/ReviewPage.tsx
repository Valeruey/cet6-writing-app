import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import FlashCard from "../components/review/FlashCard";
import LoadingSpinner from "../components/shared/LoadingSpinner";
import EmptyState from "../components/shared/EmptyState";
import ErrorMessage from "../components/shared/ErrorMessage";

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

export default function ReviewPage() {
  const navigate = useNavigate();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [completed, setCompleted] = useState(0);

  const { data: cards, isLoading, error, refetch } = useQuery({
    queryKey: ["review-due"],
    queryFn: () => request<any[]>("/review/due?limit=20"),
  });

  const rateMutation = useMutation({
    mutationFn: ({ id, quality }: { id: string; quality: number }) =>
      request(`/review/${id}/rate`, {
        method: "POST",
        body: JSON.stringify({ quality }),
      }),
  });

  const handleRate = useCallback(
    (quality: number) => {
      if (!cards || currentIndex >= cards.length) return;

      const card = cards[currentIndex];
      rateMutation.mutate({ id: card.id, quality });

      setCompleted((c) => c + 1);

      if (currentIndex < cards.length - 1) {
        setCurrentIndex((i) => i + 1);
      }
    },
    [cards, currentIndex, rateMutation]
  );

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message="加载复习卡片失败" onRetry={() => refetch()} />;

  if (!cards || cards.length === 0) {
    return (
      <div className="max-w-lg mx-auto min-h-dvh flex flex-col">
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
            <h1 className="text-sm font-semibold text-gray-900">复习模式</h1>
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center px-4">
          <EmptyState
            message="暂无待复习的表达"
            description="去精读文章收藏一些表达吧"
            actionLabel="去精读"
            onAction={() => navigate("/articles")}
          />
        </div>
      </div>
    );
  }

  const allDone = currentIndex >= cards.length - 1 && completed > 0 && completed >= cards.length;

  return (
    <div className="max-w-lg mx-auto min-h-dvh flex flex-col">
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
          <div className="flex-1">
            <h1 className="text-sm font-semibold text-gray-900">复习模式</h1>
            <p className="text-[10px] text-gray-400">
              {allDone ? "全部完成" : `${currentIndex + 1} / ${cards.length}`}
            </p>
          </div>
          {completed > 0 && (
            <span className="text-xs text-success font-medium">{completed} 已评</span>
          )}
        </div>
        {/* Progress bar */}
        <div className="h-1 bg-gray-100 rounded-full mt-2 overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all duration-300"
            style={{ width: `${cards.length > 0 ? ((currentIndex + (allDone ? 1 : 0)) / cards.length) * 100 : 0}%` }}
          />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 px-4 py-6">
        {allDone ? (
          <div className="text-center space-y-4 py-12">
            <span className="text-5xl block">🎉</span>
            <h2 className="text-lg font-semibold text-gray-900">复习完成！</h2>
            <p className="text-sm text-gray-400">
              已复习 {completed} 个表达，下次复习时间已自动安排
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => navigate("/saved")}
                className="px-6 py-2.5 text-sm font-medium text-primary bg-primary/10 hover:bg-primary/20 rounded-xl transition-colors"
              >
                查看词库
              </button>
              <button
                onClick={() => navigate("/")}
                className="px-6 py-2.5 text-sm font-medium text-white bg-primary hover:bg-primary-light rounded-xl transition-colors"
              >
                返回首页
              </button>
            </div>
          </div>
        ) : currentIndex < cards.length ? (
          <FlashCard
            expression={cards[currentIndex]}
            onRate={handleRate}
            isLast={currentIndex === cards.length - 1}
          />
        ) : null}
      </div>
    </div>
  );
}
