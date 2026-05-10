"use client";
import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { parseTerminalLines, promptPrefix } from "../lib/terminal-utils";
import type { TerminalLine } from "../types";
import { CodeBlockEmpty } from "./code-block-empty";
import { CodeBlockStreamingCursor } from "./code-block-streaming-cursor";

interface CodeBlockBodyTerminalProps {
  value: string;
  lines?: TerminalLine[];
  wrap: "wrap" | "scroll";
  streaming: boolean;
  emptyMessage?: string;
  maxHeight?: number | string;
}

export function CodeBlockBodyTerminal({
  value,
  lines,
  wrap,
  streaming,
  emptyMessage,
  maxHeight,
}: CodeBlockBodyTerminalProps) {
  const resolvedLines = useMemo<TerminalLine[]>(() => {
    if (lines) return lines;
    return parseTerminalLines(value);
  }, [lines, value]);

  if (resolvedLines.length === 0 && !streaming) {
    return <CodeBlockEmpty message={emptyMessage} />;
  }

  const lastInputIdx = (() => {
    for (let i = resolvedLines.length - 1; i >= 0; i--) {
      if (resolvedLines[i].kind === "input") return i;
    }
    return resolvedLines.length - 1;
  })();

  const heightStyle =
    maxHeight !== undefined
      ? typeof maxHeight === "number"
        ? `${maxHeight}px`
        : maxHeight
      : undefined;

  return (
    <div
      role="log"
      aria-live="off"
      className={cn(
        "min-w-0 overflow-auto px-4 py-3 font-mono text-[0.8rem] leading-relaxed",
        wrap === "wrap" ? "whitespace-pre-wrap break-words" : "whitespace-pre",
      )}
      style={{ maxHeight: heightStyle }}
    >
      {resolvedLines.map((line, idx) => {
        if (line.kind === "input") {
          const { prefix, rest } = promptPrefix(line.text);
          return (
            <div key={idx} className="text-foreground">
              <span className="text-muted-foreground/70">{prefix}</span>
              <span>{rest}</span>
              {streaming && idx === lastInputIdx ? (
                <CodeBlockStreamingCursor className="ml-0.5" />
              ) : null}
            </div>
          );
        }
        if (line.kind === "error") {
          return (
            <div key={idx} className="text-destructive">
              {line.text || " "}
            </div>
          );
        }
        return (
          <div key={idx} className="text-muted-foreground">
            {line.text || " "}
          </div>
        );
      })}
    </div>
  );
}
