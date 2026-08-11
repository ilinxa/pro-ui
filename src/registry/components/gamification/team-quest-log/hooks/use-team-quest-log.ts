"use client";

import * as React from "react";

import type { TeamQuestLogContextValue } from "../types";

export const TeamQuestLogContext =
  React.createContext<TeamQuestLogContextValue | null>(null);

/**
 * Read the quest-log state from a surrounding `TeamQuestLogRoot`.
 * For hand-assembled layouts; throws if used outside a `Root`.
 */
export function useTeamQuestLog(): TeamQuestLogContextValue {
  const ctx = React.useContext(TeamQuestLogContext);
  if (ctx === null) {
    throw new Error("useTeamQuestLog must be used within a <TeamQuestLogRoot>.");
  }
  return ctx;
}
