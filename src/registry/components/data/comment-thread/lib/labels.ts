import {
  defaultCommentThreadLabels,
  type CommentThreadLabels,
  type ResolvedCommentThreadLabels,
} from "../types";

/** Merge a partial `labels` over the defaults; an explicit `undefined` keeps the default. */
export function resolveLabels(
  labels: CommentThreadLabels | undefined,
): ResolvedCommentThreadLabels {
  const out: ResolvedCommentThreadLabels = { ...defaultCommentThreadLabels };
  if (!labels) return out;
  const target = out as unknown as Record<string, unknown>;
  for (const [key, value] of Object.entries(labels)) {
    if (key === "formatRelativeTime") continue; // a formatter, not a string
    if (value !== undefined) target[key] = value;
  }
  return out;
}
