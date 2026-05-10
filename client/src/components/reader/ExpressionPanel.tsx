import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { fetchExpression, saveExpression, unsaveExpression } from "../../api/client";
import LoadingSpinner from "../shared/LoadingSpinner";
import { CATEGORY_LABELS } from "./HighlightSpan";

interface ExpressionPanelProps {
  expression: { id: string; text: string; category: string; sentence_context: string } | null;
  onClose: () => void;
}

interface FullExpression {
  id: string;
  text: string;
  category: string;
  sentence_context: string;
  analysis: {
    where_to_use: string;
    why_good: string;
    cautions: string;
    similar_expressions: { text: string; nuance: string }[];
  } | null;
}

export default function ExpressionPanel({ expression, onClose }: ExpressionPanelProps) {
  const [data, setData] = useState<FullExpression | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const navigate = useNavigate();

  const loadAnalysis = useCallback(async () => {
    if (!expression) return;
    setLoading(true);
    setError(null);
    try {
      const result = await fetchExpression(expression.id);
      setData(result);
    } catch {
      setError("加载分析失败");
    } finally {
      setLoading(false);
    }
  }, [expression?.id]);

  useEffect(() => {
    if (expression) {
      setData(null);
      setSaved(false);
      loadAnalysis();
    }
  }, [expression, loadAnalysis]);

  const handleSave = async () => {
    if (!expression) return;
    try {
      if (saved) {
        await unsaveExpression(expression.id);
        setSaved(false);
      } else {
        await saveExpression(expression.id);
        setSaved(true);
      }
    } catch {
      // ignore
    }
  };

  const handlePractice = () => {
    // Navigate to practice page with context
    if (data) {
      onClose();
      navigate("/practice", {
        state: {
          expressionText: data.text,
          sentenceContext: data.sentence_context,
          category: data.category,
        },
      });
    }
  };

  if (!expression) return null;

  return (
    <>
      {/* Overlay */}
      <div className="sheet-overlay animate-fade-in" onClick={onClose} />

      {/* Bottom sheet */}
      <div className="sheet-content animate-slide-up flex flex-col">
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-gray-300" />
        </div>

        {/* Header: the expression itself */}
        <div className="px-5 pb-3 border-b border-gray-100">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <span className="inline-block text-xs font-medium px-2 py-0.5 rounded-full bg-primary/10 text-primary mb-1.5">
                {CATEGORY_LABELS[expression.category] || expression.category}
              </span>
              <h3 className="text-lg font-semibold text-gray-900 leading-relaxed">{expression.text}</h3>
            </div>
            <div className="flex gap-1 flex-shrink-0">
              <button
                onClick={handleSave}
                className={`p-2 rounded-full transition-colors ${
                  saved ? "text-yellow-500 bg-yellow-50" : "text-gray-300 hover:text-yellow-500"
                }`}
                title="收藏"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill={saved ? "currentColor" : "none"} stroke="currentColor" strokeWidth={2}>
                  <path d="M19 21l-7-4-7 4V5a2 2 0 012-2h10a2 2 0 012 2v16z" />
                </svg>
              </button>
              <button
                onClick={onClose}
                className="p-2 rounded-full text-gray-300 hover:text-gray-500 transition-colors"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
          </div>

          {/* Original sentence context */}
          <p className="mt-2 text-sm text-gray-400 italic leading-relaxed line-clamp-2">
            {expression.sentence_context}
          </p>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-5 py-3 space-y-4">
          {loading && <LoadingSpinner text="加载分析中..." />}
          {error && (
            <div className="text-center py-8">
              <p className="text-sm text-red-500">{error}</p>
              <button
                onClick={loadAnalysis}
                className="mt-2 text-sm text-primary underline"
              >
                重试
              </button>
            </div>
          )}

          {data?.analysis && (
            <>
              {/* Where to use */}
              <section>
                <h4 className="text-sm font-semibold text-primary mb-1.5 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                  适用场景
                </h4>
                <p className="text-sm text-gray-600 leading-relaxed">{data.analysis.where_to_use}</p>
              </section>

              {/* Why good */}
              <section>
                <h4 className="text-sm font-semibold text-green-700 mb-1.5 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                  为什么值得学习
                </h4>
                <p className="text-sm text-gray-600 leading-relaxed">{data.analysis.why_good}</p>
              </section>

              {/* Cautions */}
              <section>
                <h4 className="text-sm font-semibold text-orange-700 mb-1.5 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                  注意事项
                </h4>
                <p className="text-sm text-gray-600 leading-relaxed">{data.analysis.cautions}</p>
              </section>

              {/* Similar expressions */}
              <section>
                <h4 className="text-sm font-semibold text-purple-700 mb-1.5 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                  类似表达
                </h4>
                <div className="space-y-2">
                  {data.analysis.similar_expressions.map((sim, i) => (
                    <div
                      key={i}
                      className="p-2.5 bg-purple-50 rounded-lg"
                    >
                      <span className="text-sm font-medium text-purple-900">{sim.text}</span>
                      <p className="text-xs text-purple-600 mt-0.5">{sim.nuance}</p>
                    </div>
                  ))}
                </div>
              </section>
            </>
          )}
        </div>

        {/* Practice button */}
        <div className="px-5 py-3 border-t border-gray-100 safe-bottom">
          <button
            onClick={handlePractice}
            className="w-full py-3 text-sm font-semibold text-white bg-primary hover:bg-primary-light rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
            仿写练习
          </button>
        </div>
      </div>
    </>
  );
}
