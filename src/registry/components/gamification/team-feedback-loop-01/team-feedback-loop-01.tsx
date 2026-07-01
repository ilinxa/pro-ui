"use client";

import * as React from "react";

import { TeamFeedbackCelebration } from "./parts/team-feedback-celebration";
import { TeamFeedbackLoopRoot } from "./parts/team-feedback-loop-root";
import { TeamFeedbackNudge } from "./parts/team-feedback-nudge";
import type { TeamFeedbackLoop01Props, TeamFeedbackLoopHandle } from "./types";

/**
 * Tier A — the batteries-included assembly: `Root` + `showCelebration`-gated
 * celebration + `showNudge`-gated nudge. Forwards its `ref` straight to `Root`
 * (which owns the imperative handle). Contains **no logic the parts don't** — a
 * hand-assembled layout behaves identically.
 *
 * A host-triggered, NON-BLOCKING (D-10) cooperative feedback layer: a brief (< 1s),
 * skippable celebration + a gentle next-task nudge. Owns no milestone/badge/task
 * data. Team-scoped copy only — never an individual (D-08).
 */
export const TeamFeedbackLoop01 = React.forwardRef<
  TeamFeedbackLoopHandle,
  TeamFeedbackLoop01Props
>(function TeamFeedbackLoop01(
  { showCelebration = true, showNudge = true, ...rootProps },
  ref,
) {
  return (
    <TeamFeedbackLoopRoot ref={ref} {...rootProps}>
      {showCelebration ? <TeamFeedbackCelebration /> : null}
      {showNudge ? <TeamFeedbackNudge /> : null}
    </TeamFeedbackLoopRoot>
  );
});
