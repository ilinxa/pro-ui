"use client";

import type { Ref } from "react";
import type {
  ComposerStep,
  ComposerStepCtx,
  SlotHandle,
  SlotKind,
  SlotSubstrateMap,
  SlotValueFor,
} from "../types";
import { findSubstrate } from "../lib/substrates";
import {
  MissingSubstrateFallback,
  warnMissingSubstrate,
} from "./missing-substrate";

export interface SlotMountProps {
  /** the merged substrate map (DEFAULT_SUBSTRATES under consumer overrides) */
  substrates: SlotSubstrateMap;
  step: ComposerStep;
  value: SlotValueFor<SlotKind> | undefined;
  onChange: (next: SlotValueFor<SlotKind>) => void;
  ctx: ComposerStepCtx;
  /** the shell threads a ref the substrate populates with a uniform SlotHandle */
  handleRef: Ref<SlotHandle<SlotValueFor<SlotKind>>>;
}

/**
 * Looks up the substrate for a step's slot-kind and renders it — or a degraded
 * fallback if none is registered. The fallback is a RENDER concern (NON-blocking):
 * navigation still works and the validation gate passes on a missing substrate
 * (see the gate's `if (!handle) return { ok: true }`). DISTINCT from the blocking
 * validation gate (mirrors kanban's `item-renderer.tsx`).
 */
export function SlotMount({
  substrates,
  step,
  value,
  onChange,
  ctx,
  handleRef,
}: SlotMountProps) {
  const substrate = findSubstrate(substrates, step.slot);
  if (!substrate) {
    warnMissingSubstrate(step.slot);
    return <MissingSubstrateFallback slotKind={step.slot} />;
  }
  return (
    <>
      {substrate.render({
        slotConfig: step.slotConfig,
        value,
        onChange,
        ctx,
        handleRef,
      })}
    </>
  );
}
