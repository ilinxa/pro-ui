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
  // The rows' like / unlike names: an explicit thread label, else the nested engagement one,
  // else the default — so `labels.engagement.like` alone localizes the heart.
  if (labels.like === undefined && labels.engagement?.like !== undefined) out.like = labels.engagement.like;
  if (labels.unlike === undefined && labels.engagement?.unlike !== undefined) {
    out.unlike = labels.engagement.unlike;
  }
  return out;
}
