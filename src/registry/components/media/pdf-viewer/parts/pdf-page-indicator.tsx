"use client";

import { useState, type FormEvent } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { usePdfViewer } from "../hooks/use-pdf-viewer-context";

interface PdfPageIndicatorProps {
  className?: string;
}

export function PdfPageIndicator({ className }: PdfPageIndicatorProps) {
  const { page, numPages, actions, labels, status } = usePdfViewer();
  // Override is set while the user is editing; cleared on commit/blur. The
  // displayed value falls through to the live `page` when no override exists.
  const [override, setOverride] = useState<string | null>(null);
  const draft = override ?? String(page);

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const parsed = Number.parseInt(draft, 10);
    if (Number.isFinite(parsed) && parsed >= 1) {
      actions.goToPage(Math.min(parsed, numPages || parsed));
    }
    setOverride(null);
    (e.currentTarget.querySelector("input") as HTMLInputElement | null)?.blur();
  };

  const disabled = status !== "ready" || numPages === 0;

  return (
    <form
      onSubmit={onSubmit}
      className={cn(
        "flex items-center gap-1.5 font-mono text-xs tabular-nums text-foreground",
        className,
      )}
    >
      <Input
        aria-label={
          typeof labels.jumpToPage === "string" ? labels.jumpToPage : "Jump to page"
        }
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        value={draft}
        onChange={(e) => {
          setOverride(e.target.value.replace(/[^0-9]/g, ""));
        }}
        onFocus={(e) => {
          setOverride(String(page));
          e.currentTarget.select();
        }}
        onBlur={() => {
          setOverride(null);
        }}
        disabled={disabled}
        className="h-7 w-12 px-1.5 text-center font-mono text-xs tabular-nums"
      />
      <span className="text-muted-foreground">/</span>
      <span className="min-w-6 text-left text-muted-foreground">
        {numPages || "—"}
      </span>
    </form>
  );
}
