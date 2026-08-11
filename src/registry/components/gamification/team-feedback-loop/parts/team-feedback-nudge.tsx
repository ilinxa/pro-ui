"use client";

import { useTeamFeedbackLoop } from "../hooks/use-team-feedback-context";
import { NextTaskNudge } from "./next-task-nudge";

/**
 * Tier B — reads context and renders the current nudge (suppressed while
 * dismissed). Independent of the celebration's < 1s lifecycle (C6) — a standing,
 * dismissible prompt. Renders nothing when there's no active suggestion.
 */
export function TeamFeedbackNudge() {
  const { nudge, nudgePlacement, acceptNudge, dismissNudge } =
    useTeamFeedbackLoop();

  if (nudge === null) return null;

  return (
    <NextTaskNudge
      suggestion={nudge}
      placement={nudgePlacement}
      onAccept={acceptNudge}
      onDismiss={dismissNudge}
    />
  );
}
