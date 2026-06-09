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
  /** Prop name used in dev warnings (e.g., `"selectedIds"`). */
  valuePropName: string;
}

/**
 * Controlled+uncontrolled state helper. Sealed copy of the proven generic used
 * across the library (account-switcher-01, code-block, media-carousel-editor-01)
 * — registry portability bans a shared cross-component module, so each procomp
 * vendors its own. Locks the mode at first render and dev-warns on mode-flip or
 * controlled-without-onChange.
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
