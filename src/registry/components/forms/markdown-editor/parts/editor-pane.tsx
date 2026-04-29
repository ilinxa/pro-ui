import type { CSSProperties } from "react";
import { cn } from "@/lib/utils";

interface EditorPaneProps {
  setContainer: (node: HTMLDivElement | null) => void;
  minHeight: string | number | undefined;
  maxHeight: string | number | undefined;
  className?: string;
}

function toCss(value: string | number | undefined): string | undefined {
  if (value === undefined) return undefined;
  return typeof value === "number" ? `${value}px` : value;
}

export function EditorPane({ setContainer, minHeight, maxHeight, className }: EditorPaneProps) {
  const style: CSSProperties = {
    minHeight: toCss(minHeight) ?? "12rem",
    maxHeight: toCss(maxHeight),
  };

  return (
    <div
      ref={setContainer}
      style={style}
      className={cn(
        "markdown-editor__editor flex-1 overflow-hidden bg-card",
        className,
      )}
    />
  );
}
