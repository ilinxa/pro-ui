import type { MediaSource } from "@/registry/components/media/media-editor-01/types";

const KNOWN: readonly MediaSource[] = ["camera", "upload"];

/**
 * Drop any mediaSource media-editor-01 v0.1.x doesn't understand (e.g.
 * `"library"`, which a `post` config declares ahead of media-editor-01 v0.2).
 * Never throws — mirrors the dial's own no-crash membership-only degradation.
 * Falls back to `["upload"]` if the filtered set is empty so the slot is never
 * sourceless. The ONLY transformed dial — every other dial is membership-
 * filtered inside media-editor, so over-declared arrays degrade the same way.
 */
export function clampMediaSources(
  declared: readonly string[] | undefined,
): MediaSource[] {
  const known = (declared ?? KNOWN).filter(
    (s): s is MediaSource => s === "camera" || s === "upload",
  );
  return known.length ? known : ["upload"];
}
