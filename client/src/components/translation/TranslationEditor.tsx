import { useState, useEffect, useCallback } from "react";

interface Props {
  onSubmit: (text: string) => void;
  isSubmitting: boolean;
  savedDraft?: string;
  onSaveDraft?: (text: string) => void;
}

export default function TranslationEditor({ onSubmit, isSubmitting, savedDraft, onSaveDraft }: Props) {
  const [text, setText] = useState(savedDraft || "");
  const wordCount = text.trim().split(/\s+/).filter(Boolean).length;

  // Auto-save draft every 10 seconds
  useEffect(() => {
    if (!onSaveDraft) return;
    const timer = setInterval(() => {
      if (text.trim()) onSaveDraft(text);
    }, 10000);
    return () => clearInterval(timer);
  }, [text, onSaveDraft]);

  const handleSubmit = useCallback(() => {
    if (text.trim().length < 5) return;
    onSubmit(text.trim());
  }, [text, onSubmit]);

  return (
    <div className="flex flex-col flex-1 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold text-gray-500">你的翻译</h3>
        <span className="text-xs text-gray-400">
          {wordCount} words
        </span>
      </div>

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="在此输入你的英文翻译..."
        className="flex-1 min-h-[40vh] w-full px-4 py-3 text-sm border border-gray-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
        autoFocus
      />

      <button
        onClick={handleSubmit}
        disabled={isSubmitting || text.trim().length < 5}
        className="w-full py-3 text-sm font-semibold text-white bg-primary hover:bg-primary-light rounded-xl transition-colors disabled:opacity-50"
      >
        {isSubmitting ? "提交评分中..." : "提交评分"}
      </button>
    </div>
  );
}
