import { useCallback, useEffect, useRef, useState } from "react";

export interface UseControllableStateOptions<T> {
  /** Controlled value. When defined, it wins on EVERY render — not only when it changes (C5). */
  value?: T;
  /** Starting value for uncontrolled use. */
  defaultValue: T;
  /**
   * Called on every requested change, in both modes. Return a promise to make the change
   * optimistic: a rejection rolls the shown value back.
   */
  onChange?: (next: T) => void | Promise<unknown>;
  /**
   * Applies when `onChange` returns a promise. Default `true`: the requested value shows at
   * once until the promise settles (controlled: or until `value` changes); a rejection rolls
   * it back. Only the LATEST request decides — an older request settling late never
   * overrides a newer one. `false`: show only `value` (controlled) or only a settled change
   * (uncontrolled). A synchronous `onChange` is never optimistic when controlled — the
   * parent's next render decides.
   */
  optimistic?: boolean;
  /**
   * How to tell that `value` really changed. Default `Object.is`. Pass a value comparison
   * when the parent builds a fresh object / array on every render, or an optimistic value
   * would be dropped by unrelated parent re-renders.
   */
  isEqual?: (a: T | undefined, b: T | undefined) => boolean;
}

/**
 * Controlled/uncontrolled state with optional optimistic updates (consumer contract C5).
 * Copy this file into a component's `hooks/` — registry items stay self-contained.
 * Tests: `__tests__/use-controllable-state.test.tsx`.
 */
export function useControllableState<T>({
  value,
  defaultValue,
  onChange,
  optimistic = true,
  isEqual = Object.is,
}: UseControllableStateOptions<T>): readonly [T, (next: T) => void] {
  const controlled = value !== undefined;
  // Uncontrolled: the last value that was applied or accepted.
  const [settled, setSettled] = useState<T>(defaultValue);
  // The latest request's optimistic value while its promise is in flight.
  const [pending, setPending] = useState<{ value: T; seq: number } | null>(null);
  const seq = useRef(0);
  const settledSeq = useRef(0); // the newest request whose result has been applied
  const onChangeRef = useRef(onChange);
  const isEqualRef = useRef(isEqual);
  useEffect(() => {
    onChangeRef.current = onChange;
    isEqualRef.current = isEqual;
  });

  // The prop changed (by `isEqual`): it wins — drop any optimistic value (reconcile).
  const lastValue = useRef(value);
  useEffect(() => {
    if (isEqualRef.current(lastValue.current, value)) return;
    lastValue.current = value;
    setPending(null);
  }, [value]);

  // Switching modes mid-life is a host bug: warn once per switch in development.
  const wasControlled = useRef(controlled);
  useEffect(() => {
    if (process.env.NODE_ENV === "production" || wasControlled.current === controlled) return;
    console.warn(
      `useControllableState: switched from ${wasControlled.current ? "controlled" : "uncontrolled"} to ${
        controlled ? "controlled" : "uncontrolled"
      }. Pick one at mount.`,
    );
    wasControlled.current = controlled;
  }, [controlled]);

  const shown = pending ? pending.value : controlled ? (value as T) : settled;

  const set = useCallback(
    (next: T) => {
      const id = ++seq.current;
      const result = onChangeRef.current?.(next);
      const isPromise = !!result && typeof (result as Promise<unknown>).then === "function";
      if (!isPromise) {
        // Nothing to wait for: uncontrolled applies it; controlled leaves it to the parent's
        // next render — showing it optimistically could outlive a parent that never accepts.
        if (!controlled) {
          settledSeq.current = id;
          setPending(null);
          setSettled(next);
        }
        return;
      }
      const isLatest = () => id === seq.current;
      if (optimistic) setPending({ value: next, seq: id });
      (result as Promise<unknown>).then(
        () => {
          // Accepted. Uncontrolled: apply it unless a NEWER request was already applied.
          if (!controlled && id > settledSeq.current) {
            settledSeq.current = id;
            setSettled(next);
          }
          if (isLatest()) setPending(null); // controlled: the prop is the truth again
        },
        () => {
          if (isLatest()) setPending(null); // roll back to the last settled value / the prop
        },
      );
    },
    [controlled, optimistic],
  );

  return [shown, set] as const;
}
