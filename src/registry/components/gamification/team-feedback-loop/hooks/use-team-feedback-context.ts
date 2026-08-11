"use client";

import * as React from "react";

import type { TeamFeedbackContextValue } from "../types";

export const TeamFeedbackContext =
  React.createContext<TeamFeedbackContextValue | null>(null);

/**
 * Read the current feedback state from a surrounding `TeamFeedbackLoopRoot`.
 * For hand-assembled layouts; throws if used outside a `Root`.
 */
export function useTeamFeedbackLoop(): TeamFeedbackContextValue {
  const ctx = React.useContext(TeamFeedbackContext);
  if (ctx === null) {
    throw new Error(
      "useTeamFeedbackLoop must be used within a <TeamFeedbackLoopRoot>.",
    );
  }
  return ctx;
}
