"use client";

import { AlertOctagon, Eye } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import type {
  ContentCardNewsLabels,
  ContentSensitivity,
} from "../types";

interface ContentSensitiveGateProps {
  sensitivity: ContentSensitivity | undefined;
  /** Has the host pushed `sensitiveRevealed=true` via the handle's revealSensitive? */
  revealed?: boolean;
  /**
   * Internal reveal handler — fires `onRevealSensitive(articleId)` analytics
   * hook AND flips local `sensitiveRevealed` state.
   */
  onReveal: () => void;
  /**
   * The media this gate wraps. Renders normally when not sensitive, OR when
   * already revealed; otherwise is masked behind the blur overlay.
   */
  children: ReactNode;
  labels: Required<ContentCardNewsLabels>;
  className?: string;
}

/**
 * Sensitive content gate — content-warning overlay over media only.
 *
 * Distinct from `NewsPaywallGate` per Q-D9 — sensitive = content warning
 * (NSFW / graphic / upsetting); paywall = monetization gate. Different
 * motivations, different CTAs, separately styleable.
 *
 * UX: heavy blur over the media + an `AlertOctagon` icon + heading +
 * optional content-warning list + reveal button. Tap the button to reveal
 * for this session (state lives in the root component's `sensitiveRevealed`
 * mirror; the host can re-gate via `ref.current.reset(item)`).
 *
 * `prefers-reduced-motion` snaps reveal instead of fading.
 *
 * Sub-exported as `ContentSensitiveGate` for standalone use.
 */
export function ContentSensitiveGate({
  sensitivity,
  revealed = false,
  onReveal,
  children,
  labels,
  className,
}: ContentSensitiveGateProps) {
  if (!sensitivity?.isSensitive || revealed) return <>{children}</>;

  const warnings = sensitivity.contentWarnings ?? [];
  const warningText = warnings.length
    ? labels.sensitiveContentWarningTemplate.replace(
        "{warnings}",
        warnings.join(", "),
      )
    : sensitivity.reason;

  return (
    <div className={cn("relative", className)}>
      <div
        className="motion-safe:transition-[filter,opacity] pointer-events-none select-none blur-xl opacity-30"
        aria-hidden
      >
        {children}
      </div>

      <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 rounded-md bg-card/90 p-4 text-center backdrop-blur-md">
        <AlertOctagon
          className="size-6 text-amber-600 dark:text-amber-400"
          aria-hidden
        />
        <p className="text-sm font-semibold">{labels.sensitiveHeading}</p>
        {warningText && (
          <p className="text-xs text-muted-foreground">{warningText}</p>
        )}
        <button
          type="button"
          onClick={onReveal}
          className="relative z-20 mt-1 inline-flex h-11 cursor-pointer items-center justify-center gap-1.5 rounded-md border border-border bg-background px-4 text-sm font-medium transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          <Eye className="size-4" aria-hidden />
          {labels.sensitiveRevealLabel}
        </button>
      </div>
    </div>
  );
}
