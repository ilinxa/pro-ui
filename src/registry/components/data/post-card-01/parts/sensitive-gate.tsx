"use client";

import { ShieldAlert } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export interface SensitiveGateProps {
  /** Heading text. Default in DEFAULT_POST_CARD_LABELS is "Sensitive content". */
  heading: string;
  /** Optional reason text rendered below the heading (e.g. "Spoiler — finale"). */
  reason?: string;
  /** Reveal button label. Default "Show". */
  revealLabel: string;
  /**
   * Fired when the viewer taps the Reveal button. The parent variant is
   * responsible for flipping the local `sensitiveRevealed` state and firing
   * the host's `onRevealSensitive` callback (post-card-01.tsx wraps both
   * into a single `onSensitiveReveal` baseProp).
   */
  onReveal: () => void;
  className?: string;
}

/**
 * Absolute-positioned overlay shown above the media carousel when
 * `post.isSensitive` is true AND the viewer hasn't revealed yet AND
 * `disableSensitiveGate` is not set.
 *
 * Per Q-D6 / Q-P33 lock: per-post gate (NOT per-MediaItem). One gate covers
 * the entire carousel; one tap dismisses it for all items.
 *
 * Per Q-P41 lock: respects `prefers-reduced-motion` via
 * `motion-reduce:transition-none`. With motion enabled, the gate has a
 * subtle 200ms backdrop transition on mount; with motion reduced, the gate
 * appears + disappears without animation.
 *
 * Keyboard: `<Button>` element supports Enter / Space natively. No focus
 * trap needed — once revealed, the gate unmounts and focus naturally moves
 * to the next interactive element below.
 */
export function SensitiveGate({
  heading,
  reason,
  revealLabel,
  onReveal,
  className,
}: SensitiveGateProps) {
  return (
    <div
      className={cn(
        "absolute inset-0 z-30 flex flex-col items-center justify-center gap-2 bg-background/95 p-6 text-center backdrop-blur-sm",
        "transition-opacity duration-200 motion-reduce:transition-none",
        className,
      )}
      role="alert"
      aria-live="polite"
    >
      <ShieldAlert
        className="h-8 w-8 text-muted-foreground"
        aria-hidden="true"
      />
      <div className="text-sm font-semibold">{heading}</div>
      {reason ? (
        <div className="max-w-prose text-xs text-muted-foreground">
          {reason}
        </div>
      ) : null}
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={onReveal}
        className="mt-2"
      >
        {revealLabel}
      </Button>
    </div>
  );
}

SensitiveGate.displayName = "SensitiveGate";
