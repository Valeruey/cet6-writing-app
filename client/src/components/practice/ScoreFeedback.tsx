interface ScoreBreakdown {
  content: number;
  language: number;
  structure: number;
}

interface Correction {
  original: string;
  corrected: string;
  explanation_cn: string;
}

interface ScoreFeedbackProps {
  score: number;
  breakdown: ScoreBreakdown;
  corrections: Correction[];
  feedbackCn: string;
  suggestions: string[];
  onTryAgain: () => void;
  onDone: () => void;
}

function ScoreBadge({ score }: { score: number }) {
  let colorClass = "score-poor";
  if (score >= 85) colorClass = "score-excellent";
  else if (score >= 70) colorClass = "score-good";
  else if (score >= 55) colorClass = "score-average";

  return (
    <div className="flex flex-col items-center gap-1">
      <div
        className={`w-20 h-20 rounded-full ${colorClass} flex items-center justify-center shadow-lg`}
      >
        <span className="text-2xl font-bold">{Math.round(score)}</span>
      </div>
      <span className="text-xs text-gray-400">百分制</span>
    </div>
  );
}

function BreakdownBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = Math.min((value / max) * 100, 100);
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-gray-500">{label}</span>
        <span className="font-medium text-gray-700">{Math.round(value)}/{max}</span>
      </div>
      <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export default function ScoreFeedback({
  score,
  breakdown,
  corrections,
  feedbackCn,
  suggestions,
  onTryAgain,
  onDone,
}: ScoreFeedbackProps) {
  return (
    <div className="space-y-5 animate-fade-in">
      {/* Score */}
      <div className="flex justify-center py-4">
        <ScoreBadge score={score} />
      </div>

      {/* Breakdown */}
      <div className="space-y-3 px-1">
        <h4 className="text-sm font-semibold text-gray-700">得分分布</h4>
        <BreakdownBar label="内容与观点 (40%)" value={breakdown.content} max={100} color="bg-blue-500" />
        <BreakdownBar label="语言与词汇 (35%)" value={breakdown.language} max={100} color="bg-green-500" />
        <BreakdownBar label="结构与连贯 (25%)" value={breakdown.structure} max={100} color="bg-purple-500" />
      </div>

      {/* Feedback */}
      <div className="p-4 bg-blue-50 rounded-xl">
        <h4 className="text-sm font-semibold text-blue-700 mb-1.5">总体评价</h4>
        <p className="text-sm text-blue-800 leading-relaxed">{feedbackCn}</p>
      </div>

      {/* Corrections */}
      {corrections.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-semibold text-gray-700 px-1">具体纠错</h4>
          {corrections.map((corr, i) => (
            <div key={i} className="p-3 bg-red-50 rounded-lg space-y-1">
              <div className="flex items-start gap-2 text-sm">
                <span className="text-red-400 line-through flex-shrink-0">{corr.original}</span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth={2} className="flex-shrink-0 mt-0.5">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
                <span className="text-green-700 font-medium">{corr.corrected}</span>
              </div>
              <p className="text-xs text-red-500 ml-0">{corr.explanation_cn}</p>
            </div>
          ))}
        </div>
      )}

      {/* Suggestions */}
      {suggestions.length > 0 && (
        <div className="p-4 bg-amber-50 rounded-xl">
          <h4 className="text-sm font-semibold text-amber-700 mb-2">改进建议</h4>
          <ul className="space-y-1.5">
            {suggestions.map((s, i) => (
              <li key={i} className="text-sm text-amber-800 flex items-start gap-2">
                <span className="text-amber-400 mt-1 flex-shrink-0">•</span>
                {s}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3 pt-2">
        <button
          onClick={onTryAgain}
          className="flex-1 py-3 text-sm font-medium text-primary bg-primary/10 hover:bg-primary/20 rounded-xl transition-colors"
        >
          重新写作
        </button>
        <button
          onClick={onDone}
          className="flex-1 py-3 text-sm font-semibold text-white bg-primary hover:bg-primary-light rounded-xl transition-colors"
        >
          完成
        </button>
      </div>
    </div>
  );
}
