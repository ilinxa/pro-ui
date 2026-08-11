"use client";

import * as React from "react";

import type { TeamTrophyShelfContextValue } from "../types";

export const TeamTrophyShelfContext =
  React.createContext<TeamTrophyShelfContextValue | null>(null);

/**
 * Read the resolved shelf state from a surrounding `TeamTrophyShelfRoot`.
 * For hand-assembled layouts; throws if used outside a `Root`.
 */
export function useTeamTrophyShelf(): TeamTrophyShelfContextValue {
  const ctx = React.useContext(TeamTrophyShelfContext);
  if (ctx === null) {
    throw new Error(
      "useTeamTrophyShelf must be used within a <TeamTrophyShelfRoot>.",
    );
  }
  return ctx;
}
