import type { MediaCarouselSource } from "../types";

/**
 * `"library"` is declared for forward-compat (pick from existing backend media)
 * but has no implementation in v0.1 — clamp it out so a config that lists it
 * stays valid with no crash and no cosmetic leak (mirrors content-composer-01's
 * media-source clamp). Always resolves to a non-empty source list.
 */
export function clampSources(
  sources: MediaCarouselSource[] | undefined,
): MediaCarouselSource[] {
  const base = sources && sources.length > 0 ? sources : ["upload"];
  const clamped = base.filter((s) => s === "upload");
  return clamped.length > 0 ? clamped : ["upload"];
}
