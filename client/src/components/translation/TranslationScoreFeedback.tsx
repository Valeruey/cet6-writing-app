interface Props {
  score: number;
  breakdown: { accuracy: number; fluency: number; key_phrases: number };
  phraseComparisons: Array<{
    chinese: string;
    user_translation: string;
    reference: string;
    score: string;
    suggestion: string;
  }>;
  corrections: Array<{ original: string; corrected: string; explanation_cn: string }>;
  improvedVersion: string;
  feedbackCn: string;
  suggestions: string[];
  onTryAgain: () => void;
  onDone: () => void;
}

const scoreGrade = (s: number) => {
  if (s >= 85) return { label: "优秀", className: "score-excellent" };
  if (s >= 70) return { label: "良好", className: "score-good" };
  if (s >= 55) return { label: "一般", className: "score-average" };
  return { label: "需努力", className: "score-poor" };
};

function BreakdownBar({ label, score, maxLabel }: { label: string; score: number; maxLabel: string }) {
  const pct = Math.min(Math.max(score, 0), 100);
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-gray-500">{label}</span>
        <span className="font-medium text-gray-700">{score}/{maxLabel}</span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-primary rounded-full transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export default function TranslationScoreFeedback({
  score,
  breakdown,
  phraseComparisons,
  corrections,
  improvedVersion,
  feedbackCn,
  suggestions,
  onTryAgain,
  onDone,
}: Props) {
  const grade = scoreGrade(score);

  return (
    <div className="space-y-4 pb-6">
      {/* Score badge */}
      <div className="text-center">
        <div
          className={`inline-flex items-center justify-center w-20 h-20 rounded-2xl ${grade.className} mb-2`}
        >
          <div className="text-center">
            <span className="block text-2xl font-bold">{Math.round(score)}</span>
            <span className="text-[10px] opacity-80">/100</span>
          </div>
        </div>
        <p className="text-sm font-semibold text-gray-900">{grade.label}</p>
        <p className="text-xs text-gray-400 mt-0.5">翻译评分</p>
      </div>

      {/* Breakdown */}
      <div className="bg-white rounded-xl border border-gray-100 p-4 space-y-3">
        <h3 className="text-sm font-semibold text-gray-700">维度分析</h3>
        <BreakdownBar label="准确性" score={breakdown.accuracy} maxLabel="50%" />
        <BreakdownBar label="流畅度" score={breakdown.fluency} maxLabel="30%" />
        <BreakdownBar label="关键词汇" score={breakdown.key_phrases} maxLabel="20%" />
      </div>

      {/* Feedback */}
      <div className="bg-white rounded-xl border border-gray-100 p-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-2">总体评价</h3>
        <p className="text-sm text-gray-600 leading-relaxed">{feedbackCn}</p>
      </div>

      {/* Phrase comparisons */}
      {phraseComparisons.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">关键表达对比</h3>
          <div className="space-y-2">
            {phraseComparisons.map((pc, i) => (
              <div key={i} className="text-sm border-b border-gray-50 last:border-0 pb-2 last:pb-0">
                <p className="text-gray-500 text-xs">{pc.chinese}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-gray-700 text-xs">你的: {pc.user_translation}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded ${
                      pc.score === "good"
                        ? "bg-green-100 text-green-700"
                        : pc.score === "acceptable"
                          ? "bg-yellow-100 text-yellow-700"
                          : "bg-red-100 text-red-700"
                    }`}
                  >
                    {pc.score === "good" ? "好" : pc.score === "acceptable" ? "可" : "差"}
                  </span>
                </div>
                <p className="text-xs text-primary mt-0.5">参考: {pc.reference}</p>
                {pc.suggestion && <p className="text-xs text-gray-400 mt-0.5">{pc.suggestion}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Corrections */}
      {corrections.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">错误纠正</h3>
          <div className="space-y-2">
            {corrections.map((c, i) => (
              <div key={i} className="text-sm bg-red-50 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-red-600 line-through text-xs">{c.original}</span>
                  <span className="text-gray-300">→</span>
                  <span className="text-green-600 text-xs font-medium">{c.corrected}</span>
                </div>
                <p className="text-xs text-gray-500">{c.explanation_cn}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Improved version */}
      {improvedVersion && (
        <details className="bg-white rounded-xl border border-gray-100 p-4">
          <summary className="text-sm font-semibold text-gray-700 cursor-pointer">改进版译文</summary>
          <p className="mt-2 text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">{improvedVersion}</p>
        </details>
      )}

      {/* Suggestions */}
      {suggestions.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">学习建议</h3>
          <ul className="space-y-1.5">
            {suggestions.map((s, i) => (
              <li key={i} className="text-sm text-gray-600 flex items-start gap-2">
                <span className="text-primary mt-1">•</span>
                {s}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={onTryAgain}
          className="flex-1 py-3 text-sm font-semibold text-primary bg-primary/10 hover:bg-primary/20 rounded-xl transition-colors"
        >
          再练一篇
        </button>
        <button
          onClick={onDone}
          className="flex-1 py-3 text-sm font-semibold text-white bg-primary hover:bg-primary-light rounded-xl transition-colors"
        >
          查看历史
        </button>
      </div>
    </div>
  );
}
