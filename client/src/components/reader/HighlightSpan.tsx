const CATEGORY_CLASSES: Record<string, string> = {
  vocabulary: "hl-vocabulary",
  phrase: "hl-phrase",
  sentence_pattern: "hl-sentence_pattern",
  transition: "hl-transition",
};

const CATEGORY_LABELS: Record<string, string> = {
  vocabulary: "词汇",
  phrase: "短语",
  sentence_pattern: "句型",
  transition: "过渡",
};

interface HighlightSpanProps {
  text: string;
  category: string;
  onClick: () => void;
  isActive?: boolean;
}

export default function HighlightSpan({ text, category, onClick, isActive }: HighlightSpanProps) {
  const cls = CATEGORY_CLASSES[category] || "hl-vocabulary";
  const activeRing = isActive ? "ring-2 ring-primary/30 rounded" : "";

  return (
    <span
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className={`${cls} ${activeRing} inline transition-all duration-150 hover:opacity-80`}
      title={CATEGORY_LABELS[category] || category}
    >
      {text}
    </span>
  );
}

export { CATEGORY_CLASSES, CATEGORY_LABELS };
