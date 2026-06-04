import type { Ref, RefCallback } from "react";

/**
 * Assign a value to a React ref in either form. Substrate mounts capture their
 * uniform `SlotHandle` into the shell-provided `handleRef` (typed `Ref<…>`,
 * which can be a callback or an object ref), so they go through this helper
 * rather than assuming `.current`.
 */
export function assignRef<T>(ref: Ref<T> | undefined, value: T): void {
  if (typeof ref === "function") {
    (ref as RefCallback<T>)(value);
  } else if (ref) {
    (ref as { current: T }).current = value;
  }
}
