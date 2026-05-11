import { useState, useCallback, useEffect } from "react";
import { useNavigate, useLocation, useSearchParams } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";
import { generatePractice, scorePractice, fetchTranslationTopics, scoreTranslation } from "../api/client";
import PromptCard from "../components/practice/PromptCard";
import WritingEditor from "../components/practice/WritingEditor";
import ScoreFeedback from "../components/practice/ScoreFeedback";
import TranslationPromptCard from "../components/translation/TranslationPromptCard";
import TranslationEditor from "../components/translation/TranslationEditor";
import TranslationScoreFeedback from "../components/translation/TranslationScoreFeedback";
import LoadingSpinner from "../components/shared/LoadingSpinner";
import ErrorMessage from "../components/shared/ErrorMessage";

type Mode = "writing" | "translation";
type Step = "select" | "write" | "scoring" | "result";

interface PracticeState {
  // Writing
  writingPrompt: { prompt_text: string; prompt_type: string; topic_keywords: string[] } | null;
  writingResult: {
    overall_score: number;
    breakdown: { content: number; language: number; structure: number };
    corrections: Array<{ original: string; corrected: string; explanation_cn: string }>;
    feedback_cn: string;
    suggestions: string[];
  } | null;
  // Translation
  translationTopic: { id: string; prompt_text: string; reference_answer: string; year: number; month: number } | null;
  translationResult: {
    overall_score: number;
    breakdown: { accuracy: number; fluency: number; key_phrases: number };
    phrase_comparisons: Array<{
      chinese: string;
      user_translation: string;
      reference: string;
      score: string;
      suggestion: string;
    }>;
    corrections: Array<{ original: string; corrected: string; explanation_cn: string }>;
    improved_version: string;
    feedback_cn: string;
    suggestions: string[];
  } | null;
}

export default function PracticePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const mode = (searchParams.get("mode") as Mode) || "writing";

  const contextFromReader = location.state as {
    expressionText?: string;
    sentenceContext?: string;
    category?: string;
  } | null;

  const [step, setStep] = useState<Step>("select");
  const [state, setState] = useState<PracticeState>({
    writingPrompt: null,
    writingResult: null,
    translationTopic: null,
    translationResult: null,
  });
  const [error, setError] = useState<string | null>(null);

  // Reset step when mode changes
  useEffect(() => {
    setStep("select");
    setError(null);
  }, [mode]);

  const setMode = (m: Mode) => {
    setSearchParams({ mode: m });
  };

  // ===== Writing mutations =====
  const generateMutation = useMutation({
    mutationFn: () =>
      generatePractice({
        type: "writing",
        topic_keyword: contextFromReader?.expressionText || undefined,
      }),
    onSuccess: (data) => {
      setState((s) => ({ ...s, writingPrompt: data }));
      setStep("write");
    },
    onError: (err: any) => {
      setError(err.message || "生成题目失败");
    },
  });

  const scoreMutation = useMutation({
    mutationFn: (text: string) =>
      scorePractice({
        type: "writing",
        prompt_text: state.writingPrompt!.prompt_text,
        user_writing: text,
      }),
    onSuccess: (data) => {
      setState((s) => ({ ...s, writingResult: data }));
      setStep("result");
    },
    onError: (err: any) => {
      setError(err.message || "评分失败");
      setStep("write");
    },
  });

  // ===== Translation queries & mutations =====
  const topicsQuery = useQuery({
    queryKey: ["translation-topics"],
    queryFn: () => fetchTranslationTopics(1),
    enabled: mode === "translation" && step === "select",
  });

  const translationScoreMutation = useMutation({
    mutationFn: (text: string) =>
      scoreTranslation({
        source_text: state.translationTopic!.prompt_text,
        user_translation: text,
        reference_answer: state.translationTopic!.reference_answer,
        topic_id: state.translationTopic!.id,
      }),
    onSuccess: (data) => {
      setState((s) => ({ ...s, translationResult: data }));
      setStep("result");
    },
    onError: (err: any) => {
      setError(err.message || "评分失败");
      setStep("write");
    },
  });

  // ===== Handlers =====
  const handleGenerate = useCallback(() => {
    setError(null);
    generateMutation.mutate();
  }, [generateMutation]);

  const handleSelectTranslationTopic = useCallback((topic: any) => {
    setState((s) => ({ ...s, translationTopic: topic }));
    setStep("write");
  }, []);

  const handleWritingSubmit = useCallback(
    (text: string) => {
      setStep("scoring");
      scoreMutation.mutate(text);
    },
    [scoreMutation]
  );

  const handleTranslationSubmit = useCallback(
    (text: string) => {
      setStep("scoring");
      translationScoreMutation.mutate(text);
    },
    [translationScoreMutation]
  );

  const handleTryAgain = useCallback(() => {
    setState({
      writingPrompt: null,
      writingResult: null,
      translationTopic: null,
      translationResult: null,
    });
    setStep("select");
  }, []);

  const handleDone = useCallback(() => {
    navigate("/history");
  }, [navigate]);

  const modeLabel = mode === "writing" ? "写作练习" : "翻译练习";
  const modeEmoji = mode === "writing" ? "✍️" : "🔄";

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
          <h1 className="text-sm font-semibold text-gray-900">{modeLabel}</h1>
        </div>

        {/* Mode toggle */}
        {step === "select" && (
          <div className="flex mt-3 bg-gray-100 rounded-lg p-0.5">
            <button
              onClick={() => setMode("writing")}
              className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-colors ${
                mode === "writing" ? "bg-white text-primary shadow-sm" : "text-gray-500"
              }`}
            >
              议论文写作
            </button>
            <button
              onClick={() => setMode("translation")}
              className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-colors ${
                mode === "translation" ? "bg-white text-primary shadow-sm" : "text-gray-500"
              }`}
            >
              英汉翻译
            </button>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 px-4 py-4">
        {/* Context from reader */}
        {contextFromReader?.expressionText && step === "select" && mode === "writing" && (
          <div className="mb-4 p-3 bg-primary/5 rounded-xl border border-primary/10">
            <p className="text-xs text-gray-500 mb-1">基于以下表达生成练习题目：</p>
            <p className="text-sm font-medium text-primary">{contextFromReader.expressionText}</p>
          </div>
        )}

        {/* ===== WRITING MODE ===== */}
        {mode === "writing" && (
          <>
            {step === "select" && (
              <div className="space-y-4">
                <div className="text-center py-8">
                  <span className="text-5xl block mb-4">{modeEmoji}</span>
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

            {(step === "write" || step === "scoring") && state.writingPrompt && (
              <div className="flex flex-col h-full space-y-4">
                <PromptCard
                  promptText={state.writingPrompt.prompt_text}
                  promptType={state.writingPrompt.prompt_type}
                  topicKeywords={state.writingPrompt.topic_keywords}
                  onStart={() => {}}
                />
                <WritingEditor onSubmit={handleWritingSubmit} isSubmitting={scoreMutation.isPending} />
              </div>
            )}

            {step === "scoring" && !state.writingResult && <LoadingSpinner text="AI 评分中，请稍候..." />}

            {step === "result" && state.writingResult && (
              <ScoreFeedback
                score={state.writingResult.overall_score}
                breakdown={state.writingResult.breakdown}
                corrections={state.writingResult.corrections}
                feedbackCn={state.writingResult.feedback_cn}
                suggestions={state.writingResult.suggestions}
                onTryAgain={handleTryAgain}
                onDone={handleDone}
              />
            )}
          </>
        )}

        {/* ===== TRANSLATION MODE ===== */}
        {mode === "translation" && (
          <>
            {step === "select" && (
              <div className="space-y-4">
                <div className="text-center py-4">
                  <span className="text-4xl block mb-3">{modeEmoji}</span>
                  <h2 className="text-base font-semibold text-gray-900 mb-1">CET-6 翻译练习</h2>
                  <p className="text-xs text-gray-400">选择一篇真题开始练习</p>
                </div>

                {topicsQuery.isLoading && <LoadingSpinner />}
                {topicsQuery.error && (
                  <ErrorMessage
                    message="加载题目失败"
                    onRetry={() => topicsQuery.refetch()}
                  />
                )}

                {topicsQuery.data && (
                  <div className="space-y-2">
                    {topicsQuery.data.data.map((topic: any) => (
                      <button
                        key={topic.id}
                        onClick={() => handleSelectTranslationTopic(topic)}
                        className="w-full text-left bg-white border border-gray-100 rounded-xl p-4 hover:border-primary/30 hover:shadow-sm transition-all"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded">
                            {topic.year}年{topic.month}月
                          </span>
                          <span className="text-xs text-gray-400">卷{topic.set_number}</span>
                        </div>
                        <p className="text-sm text-gray-700 line-clamp-2">{topic.prompt_text}</p>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {(step === "write" || step === "scoring") && state.translationTopic && (
              <div className="flex flex-col h-full space-y-4">
                <TranslationPromptCard
                  sourceText={state.translationTopic.prompt_text}
                />
                <TranslationEditor
                  onSubmit={handleTranslationSubmit}
                  isSubmitting={translationScoreMutation.isPending}
                />
              </div>
            )}

            {step === "scoring" && !state.translationResult && (
              <LoadingSpinner text="AI 评分中，请稍候..." />
            )}

            {step === "result" && state.translationResult && (
              <TranslationScoreFeedback
                score={state.translationResult.overall_score}
                breakdown={state.translationResult.breakdown}
                phraseComparisons={state.translationResult.phrase_comparisons}
                corrections={state.translationResult.corrections}
                improvedVersion={state.translationResult.improved_version}
                feedbackCn={state.translationResult.feedback_cn}
                suggestions={state.translationResult.suggestions}
                onTryAgain={handleTryAgain}
                onDone={handleDone}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}
