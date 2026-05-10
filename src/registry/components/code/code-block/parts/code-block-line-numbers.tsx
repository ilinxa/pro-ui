"use client";
import { cn } from "@/lib/utils";
import { gutterWidth } from "../lib/line-utils";

interface CodeBlockLineNumbersProps {
  totalLines: number;
  highlighted?: Set<number>;
  onLineClick?: (line: number) => void;
  className?: string;
}

export function CodeBlockLineNumbers({
  totalLines,
  highlighted,
  onLineClick,
  className,
}: CodeBlockLineNumbersProps) {
  const width = gutterWidth(totalLines);
  const lines = Array.from({ length: totalLines }, (_, i) => i + 1);

  return (
    <div
      aria-hidden="true"
      className={cn(
        "select-none pr-3 pl-3 text-right font-mono text-[0.75rem] text-muted-foreground/60",
        className,
      )}
      style={{ minWidth: `${width + 2}ch` }}
    >
      {lines.map((n) => (
        <div
          key={n}
          className={cn(
            "leading-relaxed",
            highlighted?.has(n) && "text-foreground/80",
            onLineClick && "cursor-pointer hover:text-foreground",
          )}
          onClick={onLineClick ? () => onLineClick(n) : undefined}
        >
          {n}
        </div>
      ))}
    </div>
  );
}
