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
   * The content this gate wraps (the media block). Gets blurred + overlaid
   * with the CTA when `paywall.isPaywalled === true` AND not yet revealed.
   *
   * **Scope (Q-PG lock):** the gate covers MEDIA only; the variant renders
   * `paywall.preview` text in place of `item.excerpt` in the card body so the
   * preview reads naturally inline with title + author + footer (all of which
   * stay visible above and below the gate per the editorial paywall pattern).
   * Wrapping the entire card body would hide everything the reader needs to
   * recognize the article — title, byline, date — and is the bug closed in
   * v0.3 (initial impl). See parts/medium.tsx + parts/large.tsx for the
   * canonical integration.
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
 * Paywall gate — premium-content overlay over the media area.
 *
 * Renders nothing extra when `!paywall?.isPaywalled || revealed` — the
 * children pass through unwrapped. Otherwise wraps the children in a
 * blurred copy + an absolute overlay carrying the lock icon, heading, and
 * Subscribe CTA.
 *
 * **CTA element resolution (Q-P33):** when `paywall.ctaHref` is set →
 * CTA renders as `<LinkComponent href={ctaHref}>` (consumers pass
 * `linkComponent` to swap in NextLink / RemixLink / etc.); `onClick` fires
 * `onRevealPaywall(articleId)` BEFORE navigation. When unset → `<button>`
 * that fires `onRevealPaywall` only (host shows their own paywall UI in
 * response).
 *
 * **Preview-text note (Q-PG):** the `paywall.preview` words do NOT render
 * inside this part. They render in the variant body in place of
 * `item.excerpt` so they read naturally inline with the rest of the card
 * (title above, author below). This split keeps the gate purely focused
 * on the gated media area + CTA, and prevents the "preview at top of card
 * overlapping the badge stack" bug from earlier implementations.
 *
 * Sub-exported as `NewsPaywallGate` for standalone use — pair it with your
 * own preview text rendering.
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
          "absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 bg-card/95 p-4 text-center backdrop-blur-sm",
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
  );
}
