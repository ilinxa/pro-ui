import { useCallback, useEffect, useRef } from "react";
import type { TodoItem } from "../../todo-rich-card/types";
import type {
  TodoTreeChangeArgs,
  TodoTreeChangeReason,
} from "../types";

/**
 * Three-defenses controlled-mode wiring. Mirrors flow-canvas-01 v0.2.4's
 * deferred-notify + structural resync + mid-flow suppress pattern. Without
 * all three the round-trip cycle between `value` prop and `onChange`
 * notification cascades into reducer-mid-render warnings + spurious wholesale
 * state replacement during drag.
 *
 * Defense 1 — microtask-defer consumer notify: fireOnChange queues a
 * microtask before invoking the consumer callback. Lets the host's reducer
 * commit AND React flush before the consumer's setState fires.
 *
 * Defense 2 — structural resync guard: when `value` updates, compare against
 * the current internal state by structure. If equal (round-trip echo), skip
 * the dispatch. Avoids the infinite resync cascade.
 *
 * Defense 3 — drop notifications fired during a continuous flow (drag).
 * Drag tick callbacks queue microtasks that fire AFTER the drag started,
 * leaving the snapshot stale. Bail at fire time when isDraggingRef is set.
 */
export interface UseControlledModeArgs {
  value: TodoItem[] | undefined;
  internalItems: TodoItem[];
  onChange: ((args: TodoTreeChangeArgs) => void) | undefined;
  applyExternalItems: (items: TodoItem[]) => void;
  /**
   * Optional external drag-flag ref. When provided, the host (todo-tree.tsx)
   * controls drag state from C6's DnD hooks; defense 3 reads from it at
   * microtask-fire time. When omitted, an internal ref is used (no caller
   * ever flips it, so drag suppression is inert — fine for pure controlled-
   * mode users with no drag).
   */
  isDraggingRef?: React.MutableRefObject<boolean>;
}

export interface UseControlledModeResult {
  isControlled: boolean;
  isDraggingRef: React.MutableRefObject<boolean>;
  fireOnChange: (next: TodoItem[], reason: TodoTreeChangeReason) => void;
}

export function useControlledMode(
  args: UseControlledModeArgs,
): UseControlledModeResult {
  const { value, internalItems, onChange, applyExternalItems } = args;
  const isControlled = value !== undefined;
  const internalDraggingRef = useRef(false);
  const isDraggingRef = args.isDraggingRef ?? internalDraggingRef;
  const onChangeRef = useRef(onChange);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  // Defense 1 + 3. `isDraggingRef` is intentionally omitted from the dep
  // array — refs have stable identity and the callback reads `.current` at
  // microtask-fire time. Including it would force fireOnChange's identity to
  // change whenever the host swapped the ref (it never should).
  const fireOnChange = useCallback(
    (next: TodoItem[], reason: TodoTreeChangeReason) => {
      const cb = onChangeRef.current;
      if (!cb) return;
      queueMicrotask(() => {
        if (isDraggingRef.current) return;
        const live = onChangeRef.current;
        live?.({ items: next, reason });
      });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  // Defense 2 — full-field echo guard (TT2/TT11). Serialize the incoming value
  // once and compare to the last applied snapshot + the current internal state.
  // Replaces the partial 5-field structural walk (id/name/status/active/children
  // only), which silently DROPPED external changes to assignee / description /
  // dates, and removes the unbounded recursive compare on every value change.
  const lastAppliedRef = useRef<string | null>(null);
  useEffect(() => {
    if (!isControlled) return;
    if (value === internalItems) return;
    const incoming = JSON.stringify(value);
    if (incoming === lastAppliedRef.current) return;
    if (incoming === JSON.stringify(internalItems)) {
      lastAppliedRef.current = incoming;
      return;
    }
    lastAppliedRef.current = incoming;
    applyExternalItems(value!);
    // applyExternalItems' identity is stable; `internalItems` is read for the
    // echo compare but intentionally NOT a dep (only react to `value` changes).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, isControlled]);

  return { isControlled, isDraggingRef, fireOnChange };
}
