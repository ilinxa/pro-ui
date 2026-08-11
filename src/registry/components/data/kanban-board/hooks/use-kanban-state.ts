"use client";

import { useCallback, useEffect, useReducer, useRef } from "react";
import type { KanbanAction, KanbanData } from "../types";
import { kanbanReducer } from "../lib/reducer";

const EMPTY: KanbanData = { columns: [] };

export function useKanbanState({
  data,
  defaultData,
  onChange,
}: {
  data?: KanbanData;
  defaultData?: KanbanData;
  onChange?: (next: KanbanData) => void;
}): [KanbanData, (action: KanbanAction) => void] {
  const [internal, internalDispatch] = useReducer(kanbanReducer, defaultData ?? EMPTY);

  const isControlled = data !== undefined;
  const state = isControlled ? data : internal;

  // Latest-state ref: `dispatch` computes `next` from here (and syncs it in
  // the same dispatch) instead of the render-captured `state`, so two
  // dispatches in one tick COMPOSE — the second sees the first's result
  // rather than silently dropping it (controlled mode's re-render, and
  // therefore a fresh `state` closure, only lands after the parent echoes).
  const latestRef = useRef(state);
  const committedRef = useRef(state);
  useEffect(() => {
    // Renders remain authoritative: a controlled parent that rejects or
    // rewrites an update wins back the ref on commit.
    latestRef.current = state;
    committedRef.current = state;
  }, [state]);

  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  // The optimistic chain in latestRef only lives for the current tick. A
  // controlled parent that silently vetoes (no state change → no commit)
  // must not have the vetoed mutation re-emitted by the NEXT dispatch, so a
  // microtask falls back to the last committed state; a commit (echo or
  // rewrite) re-syncs both refs via the effect above and wins either way.
  const resetQueuedRef = useRef(false);

  const dispatch = useCallback(
    (action: KanbanAction) => {
      const next = kanbanReducer(latestRef.current, action);
      latestRef.current = next;
      if (!resetQueuedRef.current) {
        resetQueuedRef.current = true;
        queueMicrotask(() => {
          resetQueuedRef.current = false;
          latestRef.current = committedRef.current;
        });
      }
      if (!isControlled) internalDispatch(action);
      onChangeRef.current?.(next);
    },
    [isControlled],
  );

  return [state, dispatch];
}
