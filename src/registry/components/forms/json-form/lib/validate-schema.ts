import type { FieldDefinition, FormSchema } from "../types";
import { extractConditionOrFnDeps } from "./condition-evaluator";

/**
 * Dev-only sanity checks. Emits warnings via `console.warn`. Does NOT throw —
 * a broken schema should still render something (the offending field falls
 * back to "always visible / enabled / always-true" defaults).
 *
 * Skipped in production builds (no-op).
 */
export function validateSchemaDev(schema: FormSchema): void {
  if (process.env.NODE_ENV === "production") return;

  // (1) Duplicate field names
  const seen = new Set<string>();
  for (const field of schema.fields) {
    if (seen.has(field.name)) {
      console.warn(
        `[json-form] Duplicate field name "${field.name}". First occurrence renders; others are ignored.`,
      );
    }
    seen.add(field.name);
  }

  // (2) Value-carrying types without a name (shouldn't be possible per TS,
  //     but defensive in case consumers pass loose JSON)
  for (const field of schema.fields) {
    if (!field.name) {
      console.warn(
        `[json-form] Field of type "${field.type}" has no name. All field types require a stable name.`,
      );
    }
  }

  // (3) Active-conditional count — perf ceiling (O1 lock; threshold bumped
  // from 50 → 200 in v0.2.0 since per-keystroke render count no longer scales
  // with conditional count under the default-registry watch drop).
  let conditionalCount = 0;
  for (const field of schema.fields) {
    if (field.visibleWhen) conditionalCount++;
    if (field.enabledWhen) conditionalCount++;
    if (field.requiredWhen) conditionalCount++;
  }
  if (conditionalCount > 200) {
    console.warn(
      `[json-form] Schema has ${conditionalCount} active conditionals (visibleWhen / enabledWhen / requiredWhen). ` +
        `Performance may degrade past ~200; consider hoisting conditionals into a derived schema or splitting the form.`,
    );
  }

  // (4) Conditional dependency cycles — A.visibleWhen depends on B, B.visibleWhen depends on A, etc.
  const depGraph = new Map<string, Set<string>>();
  for (const field of schema.fields) {
    const deps = new Set<string>();
    for (const key of ["visibleWhen", "enabledWhen", "requiredWhen"] as const) {
      const c = field[key];
      if (!c) continue;
      const fieldDeps = extractConditionOrFnDeps(c);
      if (fieldDeps) fieldDeps.forEach((d) => deps.add(d));
    }
    if (deps.size) depGraph.set(field.name, deps);
  }

  function hasCycle(start: string, visited: Set<string>, stack: Set<string>): string[] | null {
    if (stack.has(start)) return [start];
    if (visited.has(start)) return null;
    visited.add(start);
    stack.add(start);
    const deps = depGraph.get(start);
    if (deps) {
      for (const d of deps) {
        const result = hasCycle(d, visited, stack);
        if (result) return [start, ...result];
      }
    }
    stack.delete(start);
    return null;
  }

  const cycleVisited = new Set<string>();
  for (const name of depGraph.keys()) {
    if (cycleVisited.has(name)) continue;
    const cycle = hasCycle(name, cycleVisited, new Set<string>());
    if (cycle) {
      console.warn(
        `[json-form] Conditional dependency cycle detected: ${cycle.join(" → ")}. ` +
          `Falling back to "always true" for the cyclic fields.`,
      );
      break; // one warn is enough; consumer can fix and re-run
    }
  }

  // (5) v0.1.7 — dangling `dependsOn` references. Match is dot-path-as-flat
  // -string against `schema.fields[i].name` exactly. Fields declared via
  // nested `defaultValue` shapes (e.g., `{ name: 'address', defaultValue:
  // { city: '…' } }`) WON'T satisfy this lint for `'address.city'` —
  // consumers using nested-default patterns need individual leaf entries
  // to declare them lint-visible. Runtime watch-gating that honors
  // `dependsOn` ships in v0.2.0; the lint runs in v0.1.7 so consumers can
  // author forward-compatible schemas now.
  const knownNames = new Set(schema.fields.map((f) => f.name));
  for (const field of schema.fields) {
    if (!field.dependsOn) continue;
    for (const dep of field.dependsOn) {
      if (knownNames.has(dep)) continue;
      console.warn(
        `[json-form] Field "${field.name}" declares dependsOn: "${dep}", ` +
          `but no field with that exact name exists in the schema. ` +
          `Lint matches against schema.fields[].name as a flat dot-path string.`,
      );
    }
  }
}

/** Convenience: skip `section` / `divider` types when walking value-carrying fields. */
export function isValueField(field: FieldDefinition): boolean {
  return field.type !== "section" && field.type !== "divider";
}
