import { useMemo } from "react";
import type { TodoStatusOption } from "../../todo-rich-card/types";

/**
 * Memoized lookup of a status option by `value`. Returns undefined when no
 * match is found. Used by the row's status indicator + sort dropdown labels.
 */
export function useStatusOptionByValue(
  statusOptions: ReadonlyArray<TodoStatusOption> | undefined,
  value: string,
): TodoStatusOption | undefined {
  return useMemo(() => {
    if (!statusOptions || statusOptions.length === 0) return undefined;
    return statusOptions.find((o) => o.value === value);
  }, [statusOptions, value]);
}

/**
 * Memoized id → option map. Cheap O(N) once per statusOptions change; lookups
 * are O(1) thereafter. The hook is useful when many rows render concurrently.
 */
export function useStatusOptionMap(
  statusOptions: ReadonlyArray<TodoStatusOption> | undefined,
): ReadonlyMap<string, TodoStatusOption> {
  return useMemo(() => {
    const map = new Map<string, TodoStatusOption>();
    if (!statusOptions) return map;
    for (const o of statusOptions) map.set(o.value, o);
    return map;
  }, [statusOptions]);
}
