"use client";

import { useMemo } from "react";
import { useFormContext, useWatch } from "react-hook-form";
import type { FieldDefinition } from "../types";
import { interpolate, parseExpression } from "../lib/expression-parser";

/**
 * Evaluate a `computed` field's value. Two forms:
 *   - `expression: '{firstName} {lastName}'` — pure interpolation
 *   - `compute: (args) => unknown` — function escape hatch
 *
 * Subscribes to the full values bag for now (v0.1.0); narrow-deps
 * optimization deferred to v0.2 per plan-stage P-06.
 *
 * v0.1.3 — memoization strategy changed (F-R5). v0.1.0–v0.1.2 used
 * `JSON.stringify(values)` as a memo key, which throws on circular refs
 * (silent fallback meant the memo went stale). Now we compute inline —
 * the body is cheap (interpolation OR a single function call). The
 * caller in `field-computed.tsx` already has the value-equality check
 * (`if (value !== computed) onChange(computed)`) so referential
 * instability of the returned value isn't a correctness problem.
 */
export function useComputed(field: FieldDefinition): unknown {
  const { control } = useFormContext();
  const watched = useWatch({ control }) ?? {};
  const values = watched as Record<string, unknown>;

  const parsed = useMemo(() => {
    if (!field.expression) return null;
    return parseExpression(field.expression);
  }, [field.expression]);

  if (field.expression && parsed) {
    return interpolate(parsed, values);
  }
  if (field.compute) {
    return field.compute({ values });
  }
  return undefined;
}
