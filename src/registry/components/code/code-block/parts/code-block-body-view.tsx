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
  CodeBlockRegexEngine,
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
  /** v0.2.0 — see `CodeBlockProps.regexEngine`. */
  regexEngine?: CodeBlockRegexEngine;
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
  regexEngine,
}: CodeBlockBodyViewProps) {
  const { html, failed } = useShikiHighlighter({
    value,
    lang,
    themes,
    highlightedLines,
    streaming,
    regexEngine,
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

  const lines = splitToLines(value);

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
        // Observable highlight state (v0.2.0). "failed" means the engine gave
        // up and the body below is raw text, not tokens — a host that saw an
        // empty panel and an empty console now has something to assert on, and
        // hosts can style/telemeter the degraded state without new props.
        data-highlight={failed ? "failed" : html ? "ready" : "pending"}
        className={cn(
          "code-block-shiki-body relative min-w-0 flex-1 overflow-auto px-4 py-3 font-mono text-[0.8rem] leading-relaxed",
          wrap === "wrap" ? "whitespace-pre-wrap break-words" : "whitespace-pre",
        )}
      >
        {visibleHtml ? (
          <div
            // dangerouslySetInnerHTML: Shiki output is server-controlled and
            // sanitized by the library (no user-supplied HTML can leak through
            // the code path).
            dangerouslySetInnerHTML={{ __html: visibleHtml }}
          />
        ) : (
          /*
           * v0.2.0 — soft-failure for the highlighter itself.
           *
           * `html` is "" both before the first tokenize AND forever after the
           * engine gives up (strict CSP with no `wasm-unsafe-eval`, failed
           * grammar chunk). Rendering nothing in that state produced an empty
           * panel with no message and nothing in the console — the one
           * documented failure mode that had no fallback.
           *
           * Showing the raw code covers both cases: it is the pre-highlight
           * paint AND the permanent degradation. Deliberately NOT gated on
           * `failed`, because "still loading" should show the code too.
           *
           * Structure mirrors Shiki's own output (block-level lines at the
           * same 1.6em rhythm) so the line-number gutter stays aligned.
           */
          <pre className="m-0 bg-transparent p-0">
            <code className="block">
              {lines.map((line, i) => (
                <span
                  key={i}
                  // `line` + `data-highlighted` are what globals.css keys the
                  // row tint and gutter accent-bar off. Without them a degraded
                  // block still bolds the gutter NUMBER (that comes from
                  // CodeBlockLineNumbers) while the row itself stays plain —
                  // a half-applied highlight.
                  className="line block min-h-[1.6em] -ml-1 pl-1"
                  data-highlighted={highlightedSet.has(i + 1) ? "true" : undefined}
                >
                  {line === "" ? " " : line}
                </span>
              ))}
            </code>
          </pre>
        )}
        {streaming ? <CodeBlockStreamingCursor /> : null}
      </div>

      {showCollapse ? <CodeBlockCollapseFade hiddenLineCount={hiddenCount} /> : null}
    </div>
  );
}
