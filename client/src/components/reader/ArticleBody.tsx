import { useRef, useEffect } from "react";
import HighlightSpan from "./HighlightSpan";

interface Expression {
  id: string;
  text: string;
  start_offset: number;
  end_offset: number;
  category: string;
  sentence_context: string;
}

interface ArticleBodyProps {
  content: string;
  expressions: Expression[];
  activeExpressionId?: string | null;
  onHighlightClick: (expr: Expression) => void;
}

interface Segment {
  text: string;
  expr?: Expression;
}

function buildSegments(content: string, expressions: Expression[]): Segment[] {
  // Sort expressions by start_offset
  const sorted = [...expressions].sort((a, b) => a.start_offset - b.start_offset);

  const segments: Segment[] = [];
  let cursor = 0;

  for (const expr of sorted) {
    if (expr.start_offset > cursor) {
      // Non-highlighted text before this expression
      segments.push({ text: content.slice(cursor, expr.start_offset) });
    }
    segments.push({
      text: content.slice(expr.start_offset, expr.end_offset),
      expr,
    });
    cursor = expr.end_offset;
  }

  // Remaining text after the last expression
  if (cursor < content.length) {
    segments.push({ text: content.slice(cursor) });
  }

  return segments;
}

export default function ArticleBody({
  content,
  expressions,
  activeExpressionId,
  onHighlightClick,
}: ArticleBodyProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  const segments = buildSegments(content, expressions);

  // Auto-scroll to active expression
  useEffect(() => {
    if (activeExpressionId && containerRef.current) {
      const el = containerRef.current.querySelector(`[data-expr-id="${activeExpressionId}"]`);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }
  }, [activeExpressionId]);

  return (
    <div ref={containerRef} className="text-base leading-8 text-gray-800 tracking-wide whitespace-pre-wrap">
      {segments.map((seg, i) => {
        if (seg.expr) {
          return (
            <HighlightSpan
              key={i}
              text={seg.text}
              category={seg.expr.category}
              isActive={seg.expr.id === activeExpressionId}
              onClick={() => onHighlightClick(seg.expr!)}
            />
          );
        }
        return <span key={i}>{seg.text}</span>;
      })}
    </div>
  );
}
