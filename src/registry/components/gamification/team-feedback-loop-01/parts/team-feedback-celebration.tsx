"use client";

import * as React from "react";

import { useTeamFeedbackLoop } from "../hooks/use-team-feedback-context";
import { CelebrationOverlay } from "./celebration-overlay";

// The confetti value enters the graph ONLY here, via React.lazy — the default
// CSS flourish and `enableConfetti={false}` never load this chunk.
const ConfettiBurst = React.lazy(() => import("./confetti-burst"));

/**
 * Tier B — reads context and renders the current `FeedbackEvent` as a
 * `CelebrationOverlay`. Gates the lazy `ConfettiBurst` on
 * `enableConfetti && !reducedMotion && kind ∈ {milestone, badge}`, and preloads
 * its chunk at open time (so the burst is usually ready within the < 1s window;
 * if not, it's simply skipped — the CSS flourish already played). Renders nothing
 * when no event is current.
 */
export function TeamFeedbackCelebration() {
  const { current, reducedMotion, enableConfetti, renderCelebration, skip } =
    useTeamFeedbackLoop();

  const confettiEligible =
    enableConfetti &&
    !reducedMotion &&
    current != null &&
    (current.kind === "milestone" || current.kind === "badge");

  // Preload-on-arm: kick the import when an eligible event opens.
  React.useEffect(() => {
    if (confettiEligible) {
      void import("./confetti-burst").catch(() => {});
    }
  }, [confettiEligible]);

  if (current === null) return null;

  return (
    <CelebrationOverlay
      event={current}
      reducedMotion={reducedMotion}
      onSkip={skip}
      render={renderCelebration}
    >
      {confettiEligible ? (
        <React.Suspense fallback={null}>
          <ConfettiBurst />
        </React.Suspense>
      ) : null}
    </CelebrationOverlay>
  );
}
