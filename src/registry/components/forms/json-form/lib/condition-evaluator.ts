import type { Condition, ConditionOrFn } from "../types";
import { getByPath } from "./path";

/**
 * Evaluate a Condition against a values bag. Returns the boolean result.
 * Unknown shape (defensive — should never happen if types hold) → true
 * (the "always visible / enabled / required" safe default) + a dev warn
 * at the call site.
 */
export function evaluateCondition(
  cond: Condition,
  values: Record<string, unknown>,
): boolean {
  if ("all" in cond) return cond.all.every((c) => evaluateCondition(c, values));
  if ("any" in cond) return cond.any.some((c) => evaluateCondition(c, values));
  if ("not" in cond) return !evaluateCondition(cond.not, values);

  if ("field" in cond) {
    const v = getByPath(values, cond.field);

    if ("equals" in cond) return Object.is(v, cond.equals);
    if ("notEquals" in cond) return !Object.is(v, cond.notEquals);
    if ("in" in cond) return cond.in.includes(v);
    if ("notIn" in cond) return !cond.notIn.includes(v);
    if ("matches" in cond) {
      if (typeof v !== "string") return false;
      try {
        return new RegExp(cond.matches).test(v);
      } catch {
        return false;
      }
    }
    if ("truthy" in cond) return cond.truthy ? !!v : !v;
    if ("greaterThan" in cond) return typeof v === "number" && v > cond.greaterThan;
    if ("lessThan" in cond) return typeof v === "number" && v < cond.lessThan;
  }

  return true;
}

/**
 * Helper: resolve a `Condition` or function form. The fn form receives the
 * full values bag.
 */
export function resolveConditionOrFn(
  cond: ConditionOrFn,
  values: Record<string, unknown>,
): boolean {
  if (typeof cond === "function") return cond({ values });
  return evaluateCondition(cond, values);
}

/**
 * Walk a Condition tree and collect every field path it references.
 * Used to subscribe to only the relevant slice of form state via RHF
 * `watch(deps)` — keeps the per-conditional cost bounded.
 */
export function extractConditionDeps(cond: Condition): Set<string> {
  const deps = new Set<string>();
  function walk(c: Condition): void {
    if ("all" in c) { c.all.forEach(walk); return; }
    if ("any" in c) { c.any.forEach(walk); return; }
    if ("not" in c) { walk(c.not); return; }
    if ("field" in c) { deps.add(c.field); }
  }
  walk(cond);
  return deps;
}

/**
 * For function-form conditions, we can't statically extract deps. Return
 * `null` → caller subscribes to the whole values bag.
 */
export function extractConditionOrFnDeps(cond: ConditionOrFn): Set<string> | null {
  if (typeof cond === "function") return null;
  return extractConditionDeps(cond);
}
