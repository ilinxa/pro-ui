"use client";
import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { useShikiHighlighter } from "../hooks/use-shiki-highlighter";
import { lineCount, rangeToLines, splitToLines } from "../lib/line-utils";
import type {
  CodeBlockAnnotation,
  CodeBlockAnnotationRenderArgs,
  CodeBlockLineRange,
  CodeBlockLineClickArgs,
  CodeBlockThemes,
} from "../types";
import { CodeBlockAnnotationMarker } from "./code-block-annotation-marker";
import { CodeBlockCollapseFade } from "./code-block-collapse-fade";
import { CodeBlockEmpty } from "./code-block-empty";
import { CodeBlockLineNumbers } from "./code-block-line-numbers";
import { CodeBlockStreamingCursor } from "./code-block-streaming-cursor";

interface CodeBlockBodyViewProps {
  value: string;
  lang: string;
  themes: CodeBlockThemes | undefined;
  highlightedLines?: Array<number | CodeBlockLineRange>;
  annotations?: CodeBlockAnnotation[];
  renderAnnotation?: (args: CodeBlockAnnotationRenderArgs) => React.ReactNode;
  showLineNumbers: boolean;
  wrap: "wrap" | "scroll";
  streaming: boolean;
  expanded: boolean;
  maxLines: number | undefined;
  emptyMessage?: string;
  maxHeight?: number | string;
  onLineClick?: (args: CodeBlockLineClickArgs) => void;
}

export function CodeBlockBodyView({
  value,
  lang,
  themes,
  highlightedLines,
  annotations,
  renderAnnotation,
  showLineNumbers,
  wrap,
  streaming,
  expanded,
  maxLines,
  emptyMessage,
  maxHeight,
  onLineClick,
}: CodeBlockBodyViewProps) {
  const { html } = useShikiHighlighter({
    value,
    lang,
    themes,
    highlightedLines,
    streaming,
  });

  const total = lineCount(value);
  const showCollapse = maxLines !== undefined && total > maxLines && !expanded;
  const hiddenCount = showCollapse ? total - maxLines : 0;

  const visibleHtml = useMemo(() => {
    if (!showCollapse) return html;
    // Naive but correct: cap the rendered <pre> visual via max-height.
    // Slicing tokenized HTML by line is unreliable across grammars; we keep
    // the full HTML and clip visually.
    return html;
  }, [html, showCollapse]);

  const highlightedSet = useMemo(() => rangeToLines(highlightedLines), [highlightedLines]);
  const annotationByLine = useMemo(() => {
    const m = new Map<number, CodeBlockAnnotation[]>();
    for (const a of annotations ?? []) {
      const list = m.get(a.line) ?? [];
      list.push(a);
      m.set(a.line, list);
    }
    return m;
  }, [annotations]);

  if (value === "" && !streaming) {
    return <CodeBlockEmpty message={emptyMessage} />;
  }

  const clipHeight = showCollapse
    ? `calc(${maxLines} * 1.6em + 2rem)`
    : maxHeight !== undefined
      ? typeof maxHeight === "number"
        ? `${maxHeight}px`
        : maxHeight
      : undefined;

  // splitToLines is only used to ensure totalLines & line-number alignment.
  const lines = splitToLines(value);
  void lines; // unused at render time; ref'd above via lineCount

  return (
    <div
      className={cn(
        "relative flex w-full overflow-hidden",
        wrap === "wrap" ? "whitespace-pre-wrap" : "",
      )}
      style={{ maxHeight: clipHeight }}
    >
      {showLineNumbers || (annotations && annotations.length > 0) ? (
        <div className="relative flex items-stretch">
          {showLineNumbers ? (
            <CodeBlockLineNumbers
              totalLines={Math.max(total, 1)}
              highlighted={highlightedSet}
              onLineClick={onLineClick ? (line) => onLineClick({ line }) : undefined}
            />
          ) : null}
          {annotations && annotations.length > 0 ? (
            <div className="relative w-5 select-none">
              {Array.from(annotationByLine.entries()).map(([line, items]) => (
                <div
                  key={line}
                  className="absolute left-0 flex items-center"
                  style={{ top: `calc(${line - 1} * 1.6em)`, height: "1.6em" }}
                >
                  {items.map((a, i) => (
                    <CodeBlockAnnotationMarker
                      key={i}
                      annotation={a}
                      renderAnnotation={renderAnnotation}
                    />
                  ))}
                </div>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}

      <div
        className={cn(
          "code-block-shiki-body relative min-w-0 flex-1 overflow-auto px-4 py-3 font-mono text-[0.8rem] leading-relaxed",
          wrap === "wrap" ? "whitespace-pre-wrap break-words" : "whitespace-pre",
        )}
      >
        <div
          // dangerouslySetInnerHTML: Shiki output is server-controlled and
          // sanitized by the library (no user-supplied HTML can leak through
          // the code path).
          dangerouslySetInnerHTML={{ __html: visibleHtml }}
        />
        {streaming ? <CodeBlockStreamingCursor /> : null}
      </div>

      {showCollapse ? <CodeBlockCollapseFade hiddenLineCount={hiddenCount} /> : null}
    </div>
  );
}
