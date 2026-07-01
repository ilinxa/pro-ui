"use client";

import * as React from "react";

import type { CooperativeChallengeContextValue } from "../types";

export const CooperativeChallengeContext =
  React.createContext<CooperativeChallengeContextValue | null>(null);

/**
 * Read the challenge state from a surrounding `CooperativeChallengeRoot`.
 * For hand-assembled layouts; throws if used outside a `Root`.
 */
export function useCooperativeChallenge(): CooperativeChallengeContextValue {
  const ctx = React.useContext(CooperativeChallengeContext);
  if (ctx === null) {
    throw new Error(
      "useCooperativeChallenge must be used within a <CooperativeChallengeRoot>.",
    );
  }
  return ctx;
}
