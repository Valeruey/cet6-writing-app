import { useState, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { generatePractice, scorePractice } from "../api/client";
import PromptCard from "../components/practice/PromptCard";
import WritingEditor from "../components/practice/WritingEditor";
import ScoreFeedback from "../components/practice/ScoreFeedback";
import LoadingSpinner from "../components/shared/LoadingSpinner";
import ErrorMessage from "../components/shared/ErrorMessage";

type Step = "generate" | "write" | "scoring" | "result";

interface PracticeState {
  prompt: { prompt_text: string; prompt_type: string; topic_keywords: string[] } | null;
  result: {
    overall_score: number;
    breakdown: { content: number; language: number; structure: number };
    corrections: Array<{ original: string; corrected: string; explanation_cn: string }>;
    feedback_cn: string;
    suggestions: string[];
  } | null;
}

export default function PracticePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const contextFromReader = location.state as {
    expressionText?: string;
    sentenceContext?: string;
    category?: string;
  } | null;

  const [step, setStep] = useState<Step>("generate");
  const [state, setState] = useState<PracticeState>({ prompt: null, result: null });
  const [error, setError] = useState<string | null>(null);

  // Generate prompt mutation
  const generateMutation = useMutation({
    mutationFn: () =>
      generatePractice({
        type: "writing",
        topic_keyword: contextFromReader?.expressionText || undefined,
      }),
    onSuccess: (data) => {
      setState((s) => ({ ...s, prompt: data }));
      setStep("write");
    },
    onError: (err: any) => {
      setError(err.message || "生成题目失败");
    },
  });

  // Score mutation
  const scoreMutation = useMutation({
    mutationFn: (text: string) =>
      scorePractice({
        type: "writing",
        prompt_text: state.prompt!.prompt_text,
        user_writing: text,
      }),
    onSuccess: (data) => {
      setState((s) => ({ ...s, result: data }));
      setStep("result");
    },
    onError: (err: any) => {
      setError(err.message || "评分失败");
      setStep("write"); // Allow retry
    },
  });

  const handleStartWriting = useCallback(() => setStep("write"), []);

  const handleSubmit = useCallback(
    (text: string) => {
      setStep("scoring");
      scoreMutation.mutate(text);
    },
    [scoreMutation]
  );

  const handleTryAgain = useCallback(() => {
    setState({ prompt: null, result: null });
    setStep("generate");
  }, []);

  const handleDone = useCallback(() => {
    navigate("/history");
  }, [navigate]);

  const handleGenerate = useCallback(() => {
    setError(null);
    generateMutation.mutate();
  }, [generateMutation]);

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
          <h1 className="text-sm font-semibold text-gray-900">写作练习</h1>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 px-4 py-4">
        {/* Context from reader */}
        {contextFromReader?.expressionText && step === "generate" && (
          <div className="mb-4 p-3 bg-primary/5 rounded-xl border border-primary/10">
            <p className="text-xs text-gray-500 mb-1">基于以下表达生成练习题目：</p>
            <p className="text-sm font-medium text-primary">{contextFromReader.expressionText}</p>
          </div>
        )}

        {/* Step: Generate */}
        {step === "generate" && (
          <div className="space-y-4">
            <div className="text-center py-8">
              <span className="text-5xl block mb-4">✍️</span>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">CET-6 写作练习</h2>
              <p className="text-sm text-gray-400 mb-6">
                AI 将根据外刊文章主题生成六级真题风格的写作题目
              </p>
              <button
                onClick={handleGenerate}
                disabled={generateMutation.isPending}
                className="px-8 py-3 text-sm font-semibold text-white bg-primary hover:bg-primary-light rounded-xl transition-colors disabled:opacity-50"
              >
                {generateMutation.isPending ? "生成中..." : "生成题目"}
              </button>
            </div>
            {error && <ErrorMessage message={error} onRetry={handleGenerate} />}
          </div>
        )}

        {/* Step: Write (also shows prompt) */}
        {(step === "write" || step === "scoring") && state.prompt && (
          <div className="flex flex-col h-full space-y-4">
            <PromptCard
              promptText={state.prompt.prompt_text}
              promptType={state.prompt.prompt_type}
              topicKeywords={state.prompt.topic_keywords}
              onStart={handleStartWriting}
            />
            <WritingEditor onSubmit={handleSubmit} isSubmitting={scoreMutation.isPending} />
          </div>
        )}

        {/* Step: Scoring */}
        {step === "scoring" && !state.result && <LoadingSpinner text="AI 评分中，请稍候..." />}

        {/* Step: Result */}
        {step === "result" && state.result && (
          <ScoreFeedback
            score={state.result.overall_score}
            breakdown={state.result.breakdown}
            corrections={state.result.corrections}
            feedbackCn={state.result.feedback_cn}
            suggestions={state.result.suggestions}
            onTryAgain={handleTryAgain}
            onDone={handleDone}
          />
        )}
      </div>
    </div>
  );
}
