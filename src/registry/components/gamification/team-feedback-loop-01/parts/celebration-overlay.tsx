"use client";

import { CheckCircle2, PartyPopper, Trophy, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import type { CelebrationOverlayProps, FeedbackEvent } from "../types";

const KIND_ICON: Record<FeedbackEvent["kind"], typeof PartyPopper> = {
  milestone: PartyPopper,
  badge: Trophy,
  "task-complete": CheckCircle2,
};

/**
 * Tier C — dumb, prop-driven celebration flourish. **The D-10 non-blocking
 * contract lives here:** the fixed wrapper AND the card are `pointer-events: none`
 * so clicks pass straight through to the board behind; the ONLY `pointer-events:
 * auto` element is the skip button. It never moves/traps focus, never renders a
 * work-halting scrim, and is a bottom-edge band, never a centered modal. Announces
 * via `role="status"` + `aria-live="polite"` (non-interrupting). Under reduced
 * motion the `reveal-up` entrance is dropped (static, instantly readable).
 * The `children` slot hosts the (already reduced-motion-gated) confetti burst.
 */
export function CelebrationOverlay({
  event,
  reducedMotion,
  onSkip,
  render,
  children,
  className,
}: CelebrationOverlayProps) {
  const Icon = KIND_ICON[event.kind];

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "pointer-events-none fixed inset-x-0 bottom-6 z-50 flex justify-center px-4",
        className,
      )}
    >
      {children}
      <div
        className={cn(
          "pointer-events-none flex max-w-md items-start gap-3 rounded-xl border border-border bg-card px-4 py-3 text-card-foreground shadow-lg",
          !reducedMotion && "reveal-up",
        )}
      >
        {render ? (
          render(event)
        ) : (
          <>
            <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Icon className="size-5" aria-hidden />
            </span>
            <div className="flex min-w-0 flex-col gap-0.5">
              <p className="line-clamp-2 text-sm font-semibold text-foreground">
                {event.title}
              </p>
              {event.detail ? (
                <p className="line-clamp-2 text-xs text-muted-foreground">
                  {event.detail}
                </p>
              ) : null}
              {event.narrativeBeat ? (
                <p className="mt-1 font-mono text-[0.7rem] uppercase tracking-wide text-primary/80">
                  {event.narrativeBeat}
                </p>
              ) : null}
            </div>
          </>
        )}
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={onSkip}
          aria-label="Dismiss celebration"
          className="pointer-events-auto shrink-0"
        >
          <X className="size-4" aria-hidden />
        </Button>
      </div>
    </div>
  );
}
