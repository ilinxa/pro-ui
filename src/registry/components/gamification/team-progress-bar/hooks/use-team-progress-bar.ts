"use client";

import * as React from "react";

import type { TeamProgressBarContextValue } from "../types";

export const TeamProgressBarContext =
  React.createContext<TeamProgressBarContextValue | null>(null);

/**
 * Read the resolved progress from a surrounding `TeamProgressBarRoot`.
 * For hand-assembled layouts; throws if used outside a `Root`.
 */
export function useTeamProgressBar(): TeamProgressBarContextValue {
  const ctx = React.useContext(TeamProgressBarContext);
  if (ctx === null) {
    throw new Error(
      "useTeamProgressBar must be used within a <TeamProgressBarRoot>.",
    );
  }
  return ctx;
}
