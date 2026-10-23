"use client";

import { createContext, useContext } from "react";
import type { ResolvedStoryRailLabels } from "../types";

/**
 * Carries the rail's resolved labels to host-rendered parts placed in the
 * `leading` slot (e.g. `AddStoryThumbnail`), which the rail never renders
 * itself and so cannot pass props to. `null` outside a rail.
 */
export const StoryRailLabelsContext =
  createContext<ResolvedStoryRailLabels | null>(null);

export function useStoryRailLabels(): ResolvedStoryRailLabels | null {
  return useContext(StoryRailLabelsContext);
}
