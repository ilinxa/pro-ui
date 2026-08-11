"use client";

import * as React from "react";

import type { TeamChallengeContextValue } from "../types";

export const TeamChallengeContext =
  React.createContext<TeamChallengeContextValue | null>(null);

/**
 * Read the challenge state from a surrounding `TeamChallengeRoot`.
 * For hand-assembled layouts; throws if used outside a `Root`.
 */
export function useTeamChallenge(): TeamChallengeContextValue {
  const ctx = React.useContext(TeamChallengeContext);
  if (ctx === null) {
    throw new Error(
      "useTeamChallenge must be used within a <TeamChallengeRoot>.",
    );
  }
  return ctx;
}
