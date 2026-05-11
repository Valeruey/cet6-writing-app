interface Props {
  sourceText: string;
  keyPhrases?: string[];
}

export default function TranslationPromptCard({ sourceText, keyPhrases }: Props) {
  return (
    <div className="space-y-3">
      {/* Source text */}
      <div className="bg-amber-50 border border-amber-100 rounded-xl p-4">
        <h3 className="text-xs font-semibold text-amber-700 mb-2">中文原文</h3>
        <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">{sourceText}</p>
      </div>

      {/* Key phrases hints */}
      {keyPhrases && keyPhrases.length > 0 && (
        <details className="bg-white border border-gray-100 rounded-xl p-3">
          <summary className="text-xs font-medium text-gray-500 cursor-pointer">关键短语提示</summary>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {keyPhrases.map((phrase, i) => (
              <span
                key={i}
                className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-md"
              >
                {phrase}
              </span>
            ))}
          </div>
        </details>
      )}
    </div>
  );
}
