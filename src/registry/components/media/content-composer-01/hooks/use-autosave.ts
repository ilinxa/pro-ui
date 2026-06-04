"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ComposerDraft, ComposerPhase } from "../types";
import type { PhaseAction } from "../lib/phase-reducer";

export interface UseAutosaveArgs {
  draft: ComposerDraft;
  phase: ComposerPhase;
  /** false disables autosave (affordance-gate); default true */
  autosave?: boolean;
  onAutosave?: (draft: ComposerDraft) => void | Promise<void>;
  debounceMs?: number;
  dispatchPhase: (action: PhaseAction) => void;
}

export interface UseAutosaveReturn {
  /** draft-level dirty — true iff the draft differs from the last saved snapshot */
  isDirty: boolean;
  /** mark a draft saved (called by explicit saveDraft / publish so autosave doesn't re-fire) */
  markSaved: (draft: ComposerDraft) => void;
}

/**
 * Debounced autosave (QP-4). The split is structural: `onDraftChange` is the
 * per-mutation callback inside `useComposerState` dispatch; THIS is the
 * downstream debounced effect watching the draft.
 *
 * Dirty is DRAFT-LEVEL (`draft !== savedDraft`) — every slot mutation flows into
 * the draft via per-mutation `onChange`, so the draft is the single dirty
 * signal. This both is correct for single-step mounting (only the active slot
 * is mounted) and structurally averts the Plate autosave loop (no handle-
 * aggregate-dirty to mis-baseline). After a successful autosave the saved
 * snapshot advances, so a settled idle draft never re-fires.
 */
export function useAutosave({
  draft,
  phase,
  autosave,
  onAutosave,
  debounceMs,
  dispatchPhase,
}: UseAutosaveArgs): UseAutosaveReturn {
  // savedDraft is STATE (render-safe) so `isDirty` is a clean render value.
  const [savedDraft, setSavedDraft] = useState<ComposerDraft>(draft);
  const isDirty = draft !== savedDraft;

  const onAutosaveRef = useRef(onAutosave);
  useEffect(() => {
    onAutosaveRef.current = onAutosave;
  }, [onAutosave]);

  // fire-time phase guard — closes the React-batching window where a Publish/
  // Schedule could flip phase between the timer firing and the cleanup running.
  const phaseRef = useRef(phase);
  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  useEffect(() => {
    if (autosave === false || !onAutosaveRef.current) return; // affordance-gate
    if (phase !== "editing" && phase !== "draft-saved") return; // only while editing/draft
    if (draft === savedDraft) return; // dirty-gated (draft-level)

    const ms = debounceMs ?? 800;
    const id = setTimeout(async () => {
      if (phaseRef.current !== "editing" && phaseRef.current !== "draft-saved") {
        return;
      }
      const snapshot = draft;
      dispatchPhase({ type: "autosave-begin" }); // T5
      try {
        await onAutosaveRef.current?.(snapshot);
        setSavedDraft(snapshot); // advance the saved baseline → settles dirty
      } finally {
        dispatchPhase({ type: "autosave-end" }); // T6
      }
    }, ms);
    return () => clearTimeout(id);
  }, [draft, savedDraft, phase, autosave, debounceMs, dispatchPhase]);

  const markSaved = useCallback((d: ComposerDraft) => setSavedDraft(d), []);

  return { isDirty, markSaved };
}
