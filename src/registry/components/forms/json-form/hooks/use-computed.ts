"use client";

import { useMemo } from "react";
import { useFormContext, useWatch } from "react-hook-form";
import type { FieldDefinition } from "../types";
import { interpolate, parseExpression } from "../lib/expression-parser";
import { setByPath } from "../lib/path";

/**
 * Evaluate a `computed` field's value. Two forms:
 *   - `expression: '{firstName} {lastName}'` — pure interpolation
 *   - `compute: (args) => unknown` — function escape hatch
 *
 * v0.1.6 — narrow-deps subscription (T1.2). For the `expression` form we
 * statically extract the referenced field paths from the parsed template and
 * scope the `useWatch` to those names; the `compute` form is opaque and
 * falls back to a full-bag subscription.
 *
 * v0.1.3 — inline evaluation (F-R5). The body is cheap (string interpolation
 * OR a single function call) and `field-computed.tsx` has an outer
 * value-equality guard before propagating to RHF, so referential instability
 * of the return value is not a correctness concern.
 */
export function useComputed(field: FieldDefinition): unknown {
  const { control } = useFormContext();

  const parsed = useMemo(() => {
    if (!field.expression) return null;
    return parseExpression(field.expression);
  }, [field.expression]);

  // Static deps when we have an `expression`; full-bag fallback for the
  // `compute` function form (or when neither is set — short-circuit later).
  const watchTarget = useMemo(() => {
    if (parsed) {
      return { mode: "narrow" as const, names: Array.from(parsed.deps) };
    }
    return { mode: "full" as const };
  }, [parsed]);

  // `as never` matches the codebase's RHF-overload pattern; v7.76 added a
  // `compute` overload that ambiguates union-arg call sites here.
  const watched = useWatch(
    (watchTarget.mode === "narrow"
      ? { control, name: watchTarget.names }
      : { control }) as never,
  );

  const values = useMemo<Record<string, unknown>>(() => {
    if (watchTarget.mode === "narrow") {
      const arr = Array.isArray(watched) ? watched : [];
      const bag: Record<string, unknown> = {};
      watchTarget.names.forEach((n, i) => {
        setByPath(bag, n, arr[i]);
      });
      return bag;
    }
    return (watched ?? {}) as Record<string, unknown>;
  }, [watched, watchTarget]);

  if (field.expression && parsed) {
    return interpolate(parsed, values);
  }
  if (field.compute) {
    return field.compute({ values });
  }
  return undefined;
}
