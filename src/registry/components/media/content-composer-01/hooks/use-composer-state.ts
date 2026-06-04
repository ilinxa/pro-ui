"use client";

import * as React from "react";
import type {
  ComposerDraft,
  ComposerPhase,
  UseComposerStateArgs,
} from "../types";
import { composerReducer, makeEmptyDraft, type ComposerAction } from "../lib/reducer";
import { phaseReducer, type PhaseAction } from "../lib/phase-reducer";

export interface UseComposerStateReturn {
  draft: ComposerDraft;
  dispatch: (action: ComposerAction) => void;
  phase: ComposerPhase;
  dispatchPhase: (action: PhaseAction) => void;
}

/**
 * The controlled/uncontrolled draft triplet + the ephemeral FSM phase. A
 * verbatim fork of kanban-board-01's `useKanbanState`:
 *   - an internal reducer is ALWAYS kept (used only when uncontrolled);
 *   - `dispatch` reduces over the DERIVED draft (not `internal`) for
 *     controlled-mode correctness, and always fires the per-mutation
 *     `onChange` (= `onDraftChange`) in BOTH modes;
 *   - the FSM phase is a SEPARATE reducer so the draft stays pure JSON (§6).
 */
export function useComposerState({
  contentType,
  value,
  defaultValue,
  onChange,
}: UseComposerStateArgs): UseComposerStateReturn {
  // ALWAYS keep an internal reducer (kanban pattern) — used only when uncontrolled.
  const [internal, internalDispatch] = React.useReducer(
    composerReducer,
    defaultValue ?? makeEmptyDraft(contentType),
  );
  const isControlled = value !== undefined;
  const draft = value ?? internal; // === isControlled ? value : internal, type-safe

  // latest-onChange ref — stable dispatch identity across parent re-renders.
  const onChangeRef = React.useRef(onChange);
  React.useEffect(() => {
    onChangeRef.current = onChange;
  });

  const dispatch = React.useCallback(
    (action: ComposerAction) => {
      // GOTCHA: reduce over the DERIVED draft, NOT `internal` — controlled-mode correctness.
      const next = composerReducer(value ?? internal, action);
      if (!isControlled) internalDispatch(action); // internal store only when uncontrolled
      onChangeRef.current?.(next); // per-mutation onDraftChange — BOTH modes
    },
    [isControlled, value, internal],
  );

  // ephemeral FSM phase — NOT persisted (kept out of ComposerDraft, §6).
  const [phase, dispatchPhase] = React.useReducer(
    phaseReducer,
    "idle" as ComposerPhase,
  );

  return { draft, dispatch, phase, dispatchPhase };
}
