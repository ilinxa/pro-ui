"use client";

import { useMemo } from "react";
import { useFormContext, useWatch } from "react-hook-form";
import type { FieldDefinition } from "../types";
import {
  extractConditionOrFnDeps,
  resolveConditionOrFn,
} from "../lib/condition-evaluator";
import { setByPath } from "../lib/path";

export interface ConditionalState {
  visible: boolean;
  enabled: boolean;
  required: boolean;
}

/**
 * Evaluates `visibleWhen` / `enabledWhen` / `requiredWhen` for a single
 * field.
 *
 * v0.1.6 — narrow-deps subscription (T1.2). The union of static deps across
 * all three conditions drives `useWatch({ name })`, so a conditional that
 * only depends on `country` only re-renders when `country` changes — not on
 * every keystroke anywhere in the form. Function-form conditions can't be
 * statically analyzed (`extractConditionOrFnDeps` returns `null`); we fall
 * back to the full-bag subscription for those.
 *
 * v0.1.3 — memoization on the boolean shape (F-R5). The returned object has
 * stable identity when nothing changed.
 */
export function useConditional(field: FieldDefinition): ConditionalState {
  const { control } = useFormContext();

  const watchTarget = useMemo(() => {
    if (!field.visibleWhen && !field.enabledWhen && !field.requiredWhen) {
      return { mode: "none" as const };
    }
    const allDeps = new Set<string>();
    let anyFnForm = false;
    for (const key of ["visibleWhen", "enabledWhen", "requiredWhen"] as const) {
      const c = field[key];
      if (!c) continue;
      const deps = extractConditionOrFnDeps(c);
      if (deps == null) {
        anyFnForm = true;
        break;
      }
      deps.forEach((d) => allDeps.add(d));
    }
    if (anyFnForm) return { mode: "full" as const };
    return { mode: "narrow" as const, names: Array.from(allDeps) };
  }, [field.visibleWhen, field.enabledWhen, field.requiredWhen]);

  // `useWatch` is called UNCONDITIONALLY (hook rules); the `name` arg drives
  // narrow vs full subscription. RHF returns `[]` for `name: []`, which is
  // fine — we never read it in that case. The `as never` cast matches the
  // codebase's existing RHF-overload-disambiguation pattern (see
  // `use-json-form.ts` resolver cast comment for the precedent rationale);
  // here the union of `{ control, name }` vs `{ control }` ambiguates v7.76
  // overload resolution against the new `compute` overload.
  const watched = useWatch(
    (watchTarget.mode === "narrow"
      ? { control, name: watchTarget.names }
      : { control }) as never,
  );

  const values = useMemo<Record<string, unknown>>(() => {
    if (watchTarget.mode === "narrow") {
      // RHF returns an array (positional) when `name` is an array. Rebuild
      // a nested bag via `setByPath` so the condition evaluator's
      // `getByPath('address.city')` walks into the right shape.
      const arr = Array.isArray(watched) ? watched : [];
      const bag: Record<string, unknown> = {};
      watchTarget.names.forEach((n, i) => {
        setByPath(bag, n, arr[i]);
      });
      return bag;
    }
    return (watched ?? {}) as Record<string, unknown>;
  }, [watched, watchTarget]);

  const visible = field.visibleWhen
    ? resolveConditionOrFn(field.visibleWhen, values)
    : true;
  const enabled = field.enabledWhen
    ? resolveConditionOrFn(field.enabledWhen, values)
    : true;
  const required = field.requiredWhen
    ? resolveConditionOrFn(field.requiredWhen, values)
    : false;

  return useMemo<ConditionalState>(
    () => ({ visible, enabled, required }),
    [visible, enabled, required],
  );
}
