interface PromptCardProps {
  promptText: string;
  promptType: string;
  topicKeywords: string[];
  onStart: () => void;
}

export default function PromptCard({ promptText, promptType, topicKeywords, onStart }: PromptCardProps) {
  const typeLabel = promptType === "sentence_continuation" ? "续写型" : "话题型";

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5 space-y-4">
      <div className="flex items-center gap-2">
        <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-primary/10 text-primary">
          {typeLabel}
        </span>
        {topicKeywords.map((kw) => (
          <span
            key={kw}
            className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500"
          >
            {kw}
          </span>
        ))}
      </div>

      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-2">写作题目</h3>
        <div className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap bg-gray-50 p-4 rounded-lg border border-gray-100">
          {promptText}
        </div>
      </div>

      <div className="flex gap-1 items-center text-xs text-gray-400">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="6" x2="12" y2="12" />
          <line x1="12" y1="12" x2="16" y2="14" />
        </svg>
        <span>写作时间 30 分钟 · 150-200 词</span>
      </div>

      <button
        onClick={onStart}
        className="w-full py-3 text-sm font-semibold text-white bg-primary hover:bg-primary-light rounded-xl transition-colors"
      >
        开始写作
      </button>
    </div>
  );
}
