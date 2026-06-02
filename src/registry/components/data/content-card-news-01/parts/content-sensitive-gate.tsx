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
  /**
   * Compact rendering for tight containers (used by the `small` variant's
   * 96×96 thumb per Q-PA matrix). Drops the heading + warnings list +
   * 44px reveal button in favor of a single icon + tiny `<button>` pill
   * sized to fit a 96×96 container. The full overlay is too tall to fit a
   * sidebar-density thumb (~180px content height vs 96px container) — fall
   * back to compact when wrapping anything narrower than ~160×160.
   */
  compact?: boolean;
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
  compact = false,
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

      {compact ? (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-1.5 rounded-md bg-card/95 p-2 text-center backdrop-blur-md">
          <AlertOctagon
            className="size-5 text-amber-600 dark:text-amber-400"
            aria-hidden
          />
          <button
            type="button"
            onClick={onReveal}
            aria-label={`${labels.sensitiveHeading}: ${labels.sensitiveRevealLabel}`}
            className="relative z-20 inline-flex cursor-pointer items-center gap-1 rounded-full bg-foreground/90 px-2 py-1 text-[11px] font-medium text-background transition-colors hover:bg-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
          >
            <Eye className="size-3" aria-hidden />
            {labels.sensitiveRevealLabel}
          </button>
        </div>
      ) : (
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
      )}
    </div>
  );
}
