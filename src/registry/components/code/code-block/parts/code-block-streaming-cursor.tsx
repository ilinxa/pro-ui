"use client";
import { cn } from "@/lib/utils";

interface CodeBlockStreamingCursorProps {
  className?: string;
}

export function CodeBlockStreamingCursor({ className }: CodeBlockStreamingCursorProps) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "inline-block h-[1em] w-[0.5ch] -mb-[2px] translate-y-[0.15em] bg-foreground/80",
        "animate-[cb-blink_1s_steps(2)_infinite]",
        className,
      )}
    />
  );
}
