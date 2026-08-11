import { useCallback, useEffect, useRef, useState } from "react";

interface UseControllableStateOpts<T> {
  /** Controlled value. When provided, state is fully controlled by parent. */
  value?: T;
  /** Initial value for uncontrolled mode. */
  defaultValue: T;
  /** Fires on every state change (both modes). */
  onChange?: (next: T) => void;
  /** Component name used in dev warnings. */
  componentName: string;
  /** Prop name used in dev warnings (e.g., `"open"`). */
  valuePropName: string;
}

/**
 * Controlled+uncontrolled state-machine helper.
 *
 * Plan §5.1 + re-validation Finding 1 (⚠️ HIGH):
 *   - Locks the controlled/uncontrolled mode based on the FIRST render's
 *     `value` and dev-warns when consumers flip modes mid-life. Switching
 *     between `value={undefined}` and `value={someBoolean}` is the classic
 *     React anti-pattern; we don't silently swap modes.
 *   - Dev-warns when controlled mode is used without an `onChange` handler
 *     (popover would appear frozen).
 *
 * Both warns are gated on `process.env.NODE_ENV !== "production"` so they
 * tree-shake out of prod bundles.
 *
 * Internal helper — not exported from the procomp's public API.
 */
export function useControllableState<T>({
  value,
  defaultValue,
  onChange,
  componentName,
  valuePropName,
}: UseControllableStateOpts<T>): readonly [T, (next: T) => void] {
  const [internal, setInternal] = useState<T>(defaultValue);
  const isControlled = value !== undefined;
  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  });

  const wasControlledRef = useRef(isControlled);
  useEffect(() => {
    if (process.env.NODE_ENV === "production") return;
    if (wasControlledRef.current !== isControlled) {
      console.warn(
        `[${componentName}] \`${valuePropName}\` switched from ${
          wasControlledRef.current ? "controlled" : "uncontrolled"
        } to ${
          isControlled ? "controlled" : "uncontrolled"
        } mode. Components should not switch modes mid-life; pick one at mount.`,
      );
      wasControlledRef.current = isControlled;
    }
  }, [isControlled, componentName, valuePropName]);

  useEffect(() => {
    if (process.env.NODE_ENV === "production") return;
    if (isControlled && !onChangeRef.current) {
      const capitalized = valuePropName.charAt(0).toUpperCase() + valuePropName.slice(1);
      console.warn(
        `[${componentName}] \`${valuePropName}\` is controlled but no onChange handler was provided. ` +
          `State will appear frozen. Pass \`on${capitalized}Change\` ` +
          `(or use the uncontrolled variant by passing \`default${capitalized}\` instead).`,
      );
    }
  }, [isControlled, componentName, valuePropName]);

  const current = isControlled ? (value as T) : internal;

  const set = useCallback(
    (next: T) => {
      if (!isControlled) setInternal(next);
      onChangeRef.current?.(next);
    },
    [isControlled],
  );

  return [current, set] as const;
}
