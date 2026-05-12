"use client";

import { useMemo } from "react";
import { useFormContext, useWatch } from "react-hook-form";
import type { FieldDefinition } from "../types";
import { resolveConditionOrFn } from "../lib/condition-evaluator";

export interface ConditionalState {
  visible: boolean;
  enabled: boolean;
  required: boolean;
}

/**
 * Evaluates `visibleWhen` / `enabledWhen` / `requiredWhen` for a single
 * field. Subscribes to the full values bag (50-conditional ceiling per the
 * O1 plan lock); plan-stage P-06 deferred the narrow-deps optimization
 * to v0.2 when real consumers hit the wall.
 *
 * v0.1.3 — memoization strategy changed (F-R5). v0.1.0–v0.1.2 used
 * `JSON.stringify(values)` as the dep key, which throws on circular refs
 * and silently fell back to a key that didn't react to value changes.
 * Now we compute the three booleans inline (cheap — bounded by condition
 * tree depth) and memoize the returned object on the BOOLEAN values, so
 * the returned shape has stable identity when nothing changed.
 */
export function useConditional(field: FieldDefinition): ConditionalState {
  const { control } = useFormContext();
  const watched = useWatch({ control }) ?? {};
  const values = watched as Record<string, unknown>;

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
