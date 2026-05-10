"use client";
import { cn } from "@/lib/utils";

export interface CodeBlockFilenameProps {
  filename?: string;
  className?: string;
}

export function CodeBlockFilename({ filename, className }: CodeBlockFilenameProps) {
  if (!filename) return null;
  return (
    <span
      className={cn(
        "font-mono text-[0.78rem] text-foreground/85 tracking-tight",
        className,
      )}
    >
      {filename}
    </span>
  );
}
