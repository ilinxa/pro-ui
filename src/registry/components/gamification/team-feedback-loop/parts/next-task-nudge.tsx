"use client";

import { ArrowRight, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import type { NextTaskNudgeProps } from "../types";

/**
 * Tier C — dumb, prop-driven next-task nudge. A gentle, standing, dismissible
 * prompt — NEVER a modal. Accept + dismiss are real keyboard-operable `button`s;
 * dismiss is penalty-free (D-08). Long labels line-clamp with a `title` fallback;
 * corner placement caps its width so it never covers primary board actions.
 */
export function NextTaskNudge({
  suggestion,
  placement = "inline",
  onAccept,
  onDismiss,
  className,
}: NextTaskNudgeProps) {
  return (
    <div
      role="group"
      aria-label="Suggested next task"
      className={cn(
        "flex items-center gap-3 rounded-lg border border-border bg-card px-3 py-2 text-card-foreground",
        placement === "corner" &&
          "fixed bottom-4 right-4 z-40 max-w-xs shadow-lg",
        className,
      )}
    >
      <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
        <ArrowRight className="size-4" aria-hidden />
      </span>
      <div className="flex min-w-0 flex-col">
        <span className="text-[0.7rem] font-medium uppercase tracking-wide text-muted-foreground">
          Next up
        </span>
        <span
          className="line-clamp-2 text-sm text-foreground"
          title={suggestion.label}
        >
          {suggestion.label}
        </span>
      </div>
      <div className="ml-auto flex shrink-0 items-center gap-1">
        <Button size="sm" variant="secondary" onClick={() => onAccept(suggestion)}>
          Start
        </Button>
        <Button
          size="icon-sm"
          variant="ghost"
          onClick={() => onDismiss(suggestion)}
          aria-label="Dismiss suggestion"
        >
          <X className="size-4" aria-hidden />
        </Button>
      </div>
    </div>
  );
}
