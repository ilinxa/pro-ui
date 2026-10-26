import {
  defaultPostCardLabels,
  type PostCardLabels,
  type PostCardNestedLabelKeys,
  type ResolvedPostCardLabels,
} from "../types";

const NESTED: ReadonlySet<string> = new Set<PostCardNestedLabelKeys>([
  "formatRelativeTime",
  "engagementLabels",
  "commentLabels",
  "likersLabels",
  "shareLabels",
  "textLabels",
]);

/**
 * Merge a partial `labels` over the defaults; an explicit `undefined` keeps the default. The
 * nested and deprecated keys are left out (the parts that own them read them from `labels`).
 * A function-valued label must be a function: anything else keeps the default and is reported
 * to `onInvalid(key)`.
 */
export function resolveLabels(
  labels: PostCardLabels | undefined,
  onInvalid?: (key: string) => void,
): ResolvedPostCardLabels {
  const out: ResolvedPostCardLabels = { ...defaultPostCardLabels };
  if (!labels) return out;
  const target = out as unknown as Record<string, unknown>;
  const defaults = defaultPostCardLabels as unknown as Record<string, unknown>;
  for (const [key, value] of Object.entries(labels)) {
    if (value === undefined || NESTED.has(key)) continue;
    if (typeof defaults[key] === "function" && typeof value !== "function") {
      onInvalid?.(key);
      continue;
    }
    target[key] = value;
  }
  return out;
}

/** `{ ...base, ...over }` that skips `undefined` values in `over` (an explicit `undefined` keeps the base). */
export function mergeLabels<T extends object>(base: T, over: Partial<T> | undefined): T {
  if (!over) return base;
  const out = { ...base } as Record<string, unknown>;
  for (const [key, value] of Object.entries(over)) {
    if (value !== undefined) out[key] = value;
  }
  return out as T;
}
