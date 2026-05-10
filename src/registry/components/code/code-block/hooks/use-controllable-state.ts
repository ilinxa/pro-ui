"use client";
import { useCallback, useEffect, useRef, useState } from "react";

interface UseControllableStateArgs<T> {
  prop: T | undefined;
  defaultProp: T;
  onChange?: (value: T) => void;
}

/**
 * Standard controlled/uncontrolled state helper. When `prop` is defined it
 * is treated as the source of truth (controlled); otherwise component state
 * is used (uncontrolled). `onChange` always fires.
 */
export function useControllableState<T>({
  prop,
  defaultProp,
  onChange,
}: UseControllableStateArgs<T>): [T, (next: T) => void] {
  const [uncontrolledValue, setUncontrolledValue] = useState<T>(defaultProp);
  const isControlled = prop !== undefined;
  const value = isControlled ? prop : uncontrolledValue;

  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  const setValue = useCallback(
    (next: T) => {
      if (!isControlled) {
        setUncontrolledValue(next);
      }
      onChangeRef.current?.(next);
    },
    [isControlled],
  );

  return [value, setValue];
}
