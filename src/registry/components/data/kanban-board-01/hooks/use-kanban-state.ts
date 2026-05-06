"use client";

import { useCallback, useReducer } from "react";
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

  const dispatch = useCallback(
    (action: KanbanAction) => {
      const next = kanbanReducer(state, action);
      if (!isControlled) internalDispatch(action);
      onChange?.(next);
    },
    [isControlled, state, onChange],
  );

  return [state, dispatch];
}
