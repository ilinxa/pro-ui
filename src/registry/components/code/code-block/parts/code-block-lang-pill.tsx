"use client";
import { cn } from "@/lib/utils";

export interface CodeBlockLangPillProps {
  lang: string;
  className?: string;
}

export function CodeBlockLangPill({ lang, className }: CodeBlockLangPillProps) {
  if (!lang || lang === "plaintext") return null;
  return (
    <span
      className={cn(
        "font-mono text-[0.7rem] uppercase tracking-wider text-muted-foreground/80",
        className,
      )}
    >
      {lang}
    </span>
  );
}
