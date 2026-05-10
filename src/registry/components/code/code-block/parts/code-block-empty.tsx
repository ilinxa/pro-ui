"use client";
import { cn } from "@/lib/utils";

interface CodeBlockEmptyProps {
  message?: string;
  className?: string;
}

export function CodeBlockEmpty({ message, className }: CodeBlockEmptyProps) {
  return (
    <div
      className={cn(
        "flex min-h-12 items-center justify-center px-4 py-6 text-center font-mono text-xs text-muted-foreground/60",
        className,
      )}
    >
      {message ?? <span aria-hidden="true">&nbsp;</span>}
    </div>
  );
}
