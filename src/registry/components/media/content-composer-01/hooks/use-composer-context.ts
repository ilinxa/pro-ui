"use client";

import { createContext, useContext } from "react";
import type { ComposerCtx, ComposerStepCtx } from "../types";

// Two contexts (workspace useAreaContext model): the per-mount composer context
// (phase / cursor / steps / lifecycle actions) and the per-step context (active
// step id + its error slice). Both throw when read outside their subtree so a
// mis-mounted custom field/slot fails loudly rather than silently no-op-ing.

export const ComposerContext = createContext<ComposerCtx | null>(null);
export const ComposerStepContext = createContext<ComposerStepCtx | null>(null);

export function useComposerContext(): ComposerCtx {
  const ctx = useContext(ComposerContext);
  if (!ctx) {
    throw new Error(
      "useComposerContext must be called inside a <ContentComposer01> subtree",
    );
  }
  return ctx;
}

export function useComposerStep(): ComposerStepCtx {
  const ctx = useContext(ComposerStepContext);
  if (!ctx) {
    throw new Error(
      "useComposerStep must be called inside a composer step's slot subtree",
    );
  }
  return ctx;
}
