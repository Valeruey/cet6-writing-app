import { useState, useEffect, useRef, useCallback } from "react";

interface WritingEditorProps {
  onSubmit: (text: string) => void;
  isSubmitting: boolean;
}

export default function WritingEditor({ onSubmit, isSubmitting }: WritingEditorProps) {
  const [text, setText] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-save draft
  const DRAFT_KEY = "cet6_writing_draft";

  useEffect(() => {
    const saved = localStorage.getItem(DRAFT_KEY);
    if (saved) setText(saved);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      localStorage.setItem(DRAFT_KEY, text);
    }, 10_000);
    return () => clearInterval(timer);
  }, [text]);

  const wordCount = text.trim().split(/\s+/).filter(Boolean).length;
  const isInRange = wordCount >= 150 && wordCount <= 200;

  const handleSubmit = useCallback(() => {
    if (!text.trim()) return;
    localStorage.removeItem(DRAFT_KEY);
    onSubmit(text.trim());
  }, [text, onSubmit]);

  return (
    <div className="flex flex-col h-full">
      {/* Word count bar */}
      <div className="flex items-center justify-between px-1 py-2">
        <span className="text-xs text-gray-400">字数统计</span>
        <span
          className={`text-sm font-mono font-semibold ${
            isInRange ? "text-green-600" : wordCount > 0 ? "text-orange-500" : "text-gray-400"
          }`}
        >
          {wordCount}
          <span className="text-gray-300 font-normal"> / 150-200</span>
        </span>
      </div>

      {/* Textarea */}
      <textarea
        ref={textareaRef}
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="在此输入你的作文..."
        className="flex-1 w-full resize-none border border-gray-200 rounded-xl p-4 text-sm leading-7 text-gray-800 placeholder-gray-300 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-colors"
        style={{ minHeight: "40vh" }}
        autoFocus
      />

      {/* Actions */}
      <div className="flex gap-3 mt-3">
        <button
          onClick={() => setText("")}
          className="flex-1 py-3 text-sm font-medium text-gray-500 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
          disabled={isSubmitting || !text}
        >
          清空
        </button>
        <button
          onClick={handleSubmit}
          disabled={isSubmitting || !text.trim()}
          className="flex-1 py-3 text-sm font-semibold text-white bg-primary hover:bg-primary-light rounded-xl transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {isSubmitting ? "评分中..." : "提交评分"}
        </button>
      </div>
    </div>
  );
}

export { type WritingEditorProps };
