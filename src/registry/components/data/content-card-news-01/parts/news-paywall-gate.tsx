"use client";

import { Lock } from "lucide-react";
import type { ElementType, MouseEvent, ReactNode } from "react";
import { cn } from "@/lib/utils";
import type { ContentCardNewsLabels, ContentPaywall } from "../types";

interface NewsPaywallGateProps {
  paywall: ContentPaywall | undefined;
  /**
   * Internal reveal handler — fires `onRevealPaywall(articleId)` analytics
   * hook AND flips local `paywallRevealed` state. Called BEFORE navigation
   * when `ctaHref` is set.
   */
  onReveal: () => void;
  /**
   * The content this gate wraps (excerpt + media). Renders below the preview
   * and gets blurred + overlaid when `paywall.isPaywalled` AND not revealed.
   */
  children: ReactNode;
  /** Has the host pushed `paywallRevealed=true` via the handle's revealPaywall? */
  revealed?: boolean;
  /** Element used for the CTA anchor when `ctaHref` is set. Default 'a'. */
  linkComponent?: ElementType;
  labels: Required<ContentCardNewsLabels>;
  className?: string;
  /** Tailwind classes for the overlay (background, padding, etc). */
  overlayClassName?: string;
}

/**
 * Paywall gate — premium-content overlay. Gates `children` (excerpt + media)
 * when `paywall.isPaywalled === true` AND not yet revealed.
 *
 * When `paywall.preview` is set, the preview words render INLINE above the
 * gate (visible without dismissing). The CTA button below fires
 * `onRevealPaywall(articleId)` (analytics hook) — when `paywall.ctaHref` is
 * set, the CTA renders as `<a href={ctaHref}>` with the analytics hook
 * firing BEFORE navigation; otherwise it's a `<button>` that just fires the
 * hook (host shows their own paywall UI in response).
 *
 * Sub-exported as `NewsPaywallGate` for standalone use.
 */
export function NewsPaywallGate({
  paywall,
  onReveal,
  children,
  revealed = false,
  linkComponent: LinkComponent = "a",
  labels,
  className,
  overlayClassName,
}: NewsPaywallGateProps) {
  if (!paywall?.isPaywalled || revealed) return <>{children}</>;

  const ctaLabel = paywall.ctaLabel ?? labels.paywallDefaultCta;
  const hasHref = Boolean(paywall.ctaHref);

  const handleCtaClick = (event: MouseEvent) => {
    // Fire analytics hook BEFORE any navigation. When ctaHref is set, the
    // browser will navigate after this callback returns; when not set, the
    // host opens their own paywall UI in response.
    onReveal();
    if (!hasHref) event.preventDefault();
  };

  return (
    <div className={cn("relative", className)}>
      {paywall.preview && (
        <div className="text-sm leading-relaxed">
          {paywall.preview}
          <span className="text-muted-foreground">
            {" "}
            {labels.paywallPreviewSeparator}
          </span>
        </div>
      )}

      <div className="relative">
        {/* Blurred underlying content (decorative — actual interactions blocked) */}
        <div
          className="motion-safe:transition-[filter,opacity] pointer-events-none select-none blur-sm opacity-40"
          aria-hidden
        >
          {children}
        </div>

        {/* Overlay with CTA */}
        <div
          aria-label={labels.paywallBlurredOverlayAria}
          className={cn(
            "absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 rounded-md bg-card/95 p-4 text-center backdrop-blur-sm",
            overlayClassName,
          )}
        >
          <Lock className="size-5 text-primary" aria-hidden />
          <p className="text-sm font-semibold">{labels.paywallHeading}</p>

          {hasHref ? (
            <LinkComponent
              href={paywall.ctaHref}
              onClick={handleCtaClick}
              className="relative z-20 inline-flex h-11 cursor-pointer items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              {ctaLabel}
            </LinkComponent>
          ) : (
            <button
              type="button"
              onClick={handleCtaClick}
              className="relative z-20 inline-flex h-11 cursor-pointer items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              {ctaLabel}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
