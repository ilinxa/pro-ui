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
  const isDraggingRef = useRef(false);
  const onChangeRef = useRef(onChange);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  // Defense 1 + 3.
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
    [],
  );

  // Defense 2.
  useEffect(() => {
    if (!isControlled) return;
    if (value === internalItems) return;
    if (treesMatchStructurally(value!, internalItems)) return;
    applyExternalItems(value!);
    // applyExternalItems' identity is stable (the host wraps dispatch in a
    // useCallback with stable deps), so omit it from the dep list to avoid
    // re-running on every internal mutation.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, isControlled]);

  return { isControlled, isDraggingRef, fireOnChange };
}

/**
 * Reference-equality fast path, then DFS structural compare on the fields
 * round-tripped through value → onChange echoes: id, name, status, active,
 * children length + descendants. Stops on first mismatch.
 */
function treesMatchStructurally(
  a: ReadonlyArray<TodoItem>,
  b: ReadonlyArray<TodoItem>,
): boolean {
  if (a === b) return true;
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (!itemMatches(a[i], b[i])) return false;
  }
  return true;
}

function itemMatches(a: TodoItem, b: TodoItem): boolean {
  if (a === b) return true;
  if (a.id !== b.id) return false;
  if (a.name !== b.name) return false;
  if (a.status !== b.status) return false;
  if (a.active !== b.active) return false;
  const ac = a.children;
  const bc = b.children;
  if (ac === bc) return true;
  if (!ac && !bc) return true;
  if (!ac || !bc) return (ac?.length ?? 0) === (bc?.length ?? 0);
  if (ac.length !== bc.length) return false;
  for (let i = 0; i < ac.length; i++) {
    if (!itemMatches(ac[i], bc[i])) return false;
  }
  return true;
}
