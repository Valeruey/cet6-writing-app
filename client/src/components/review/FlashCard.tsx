import { useState } from "react";

interface Props {
  expression: {
    id: string;
    text: string;
    category: string;
    sentence_context: string;
    analysis: {
      where_to_use: string;
      why_good: string;
      cautions: string;
      similar_expressions: Array<{ text: string; nuance: string }>;
    } | null;
  };
  onRate: (quality: number) => void;
  isLast: boolean;
}

const QUALITY_LABELS = [
  { label: "完全不记得", emoji: "😰", quality: 0 },
  { label: "有点印象", emoji: "🤔", quality: 1 },
  { label: "记得大概", emoji: "😐", quality: 2 },
  { label: "勉强记住", emoji: "🙂", quality: 3 },
  { label: "记得较好", emoji: "😊", quality: 4 },
  { label: "完全掌握", emoji: "🎉", quality: 5 },
];

const CATEGORY_COLORS: Record<string, string> = {
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

export default function FlashCard({ expression, onRate, isLast }: Props) {
  const [flipped, setFlipped] = useState(false);

  return (
    <div className="space-y-4">
      {/* Card */}
      <div
        onClick={() => setFlipped(!flipped)}
        className="relative cursor-pointer select-none"
        style={{ perspective: "1000px" }}
      >
        <div
          className="relative w-full min-h-[280px] transition-transform duration-500"
          style={{
            transformStyle: "preserve-3d",
            transform: flipped ? "rotateY(180deg)" : "rotateY(0)",
          }}
        >
          {/* Front */}
          <div
            className="absolute inset-0 bg-white border border-gray-200 rounded-2xl p-6 flex flex-col items-center justify-center"
            style={{ backfaceVisibility: "hidden" }}
          >
            <span
              className={`text-xs px-2 py-0.5 rounded-full mb-4 ${
                CATEGORY_COLORS[expression.category] || "bg-gray-100 text-gray-600"
              }`}
            >
              {CATEGORY_LABELS[expression.category] || expression.category}
            </span>
            <p className="text-xl font-bold text-gray-900 text-center mb-3">
              {expression.text}
            </p>
            {expression.sentence_context && (
              <p className="text-xs text-gray-400 text-center italic line-clamp-3">
                "{expression.sentence_context}"
              </p>
            )}
            <p className="text-xs text-gray-300 mt-4">点击翻转查看解析</p>
          </div>

          {/* Back */}
          <div
            className="absolute inset-0 bg-white border border-gray-200 rounded-2xl p-5 flex flex-col overflow-y-auto"
            style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
          >
            <span
              className={`text-xs px-2 py-0.5 rounded-full self-start mb-3 ${
                CATEGORY_COLORS[expression.category] || "bg-gray-100 text-gray-600"
              }`}
            >
              {CATEGORY_LABELS[expression.category] || expression.category}
            </span>
            <p className="text-lg font-bold text-gray-900 mb-3">{expression.text}</p>

            {expression.analysis && (
              <div className="space-y-3 text-sm">
                <div>
                  <p className="text-xs font-semibold text-gray-400 mb-0.5">适用场景</p>
                  <p className="text-gray-600">{expression.analysis.where_to_use}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-400 mb-0.5">学习价值</p>
                  <p className="text-gray-600">{expression.analysis.why_good}</p>
                </div>
                {expression.analysis.cautions && (
                  <div>
                    <p className="text-xs font-semibold text-gray-400 mb-0.5">注意事项</p>
                    <p className="text-gray-500 text-xs">{expression.analysis.cautions}</p>
                  </div>
                )}
                {expression.analysis.similar_expressions?.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-gray-400 mb-1">相似表达</p>
                    {expression.analysis.similar_expressions.map((s, i) => (
                      <div key={i} className="flex gap-2 text-xs mb-0.5">
                        <span className="text-primary font-medium">{s.text}</span>
                        <span className="text-gray-400">— {s.nuance}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Rating buttons (only visible after flip) */}
      {flipped && (
        <div className="space-y-2 animate-fade-in">
          <p className="text-xs text-center text-gray-400">你的记忆程度？</p>
          <div className="grid grid-cols-3 gap-2">
            {QUALITY_LABELS.map(({ label, emoji, quality }) => (
              <button
                key={quality}
                onClick={() => onRate(quality)}
                className="flex flex-col items-center gap-1 p-2.5 bg-white border border-gray-100 rounded-xl hover:border-primary/30 hover:shadow-sm transition-all"
              >
                <span className="text-lg">{emoji}</span>
                <span className="text-[10px] text-gray-500">{label}</span>
              </button>
            ))}
          </div>
          {isLast && (
            <p className="text-xs text-center text-gray-300">
              这是最后一张卡片
            </p>
          )}
        </div>
      )}
    </div>
  );
}
