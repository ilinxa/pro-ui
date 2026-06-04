"use client";

import { useCallback, useRef } from "react";
import type { RefCallback } from "react";
import type { SlotHandle } from "../types";

/**
 * Registry of the live `SlotHandle`s keyed by step id. The shell renders only
 * the ACTIVE step's slot, so at any moment the map holds one entry (the active
 * step's handle). The shell reads it for the active-step gate (full json-form
 * validation) and for the pull-only media export at step-leave / publish.
 *
 * `registerHandle(stepId)` returns a STABLE callback ref per step id (so React
 * doesn't detach/reattach on every render). Dirty tracking is intentionally NOT
 * here — it's draft-level (`draft !== savedDraft` in useAutosave), which both is
 * correct for single-step mounting and structurally averts the Plate autosave
 * loop (the handle-aggregate-dirty trap).
 */
export function useSlotHandles() {
  const handles = useRef(new Map<string, SlotHandle<unknown>>());
  const callbacks = useRef(new Map<string, RefCallback<SlotHandle<unknown>>>());

  const registerHandle = useCallback(
    (stepId: string): RefCallback<SlotHandle<unknown>> => {
      let cb = callbacks.current.get(stepId);
      if (!cb) {
        cb = (h) => {
          if (h) handles.current.set(stepId, h);
          else handles.current.delete(stepId);
        };
        callbacks.current.set(stepId, cb);
      }
      return cb;
    },
    [],
  );

  const getHandle = useCallback(
    (stepId: string) => handles.current.get(stepId),
    [],
  );

  return { registerHandle, getHandle };
}
