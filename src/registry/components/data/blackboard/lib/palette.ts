import type { InkColor, NoteStyle, NoteWidth } from "../types";

/**
 * Curated chalk-tone ink palette. Muted (chroma ≤ 0.20), legible on the dark-navy
 * board, token-aligned. Overridable via the `palette` prop. Keeps the wall coherent
 * vs. a free color wheel (which is an opt-in via `allowFreeColor`).
 */
export const DEFAULT_PALETTE: InkColor[] = [
  { key: "chalk", label: "Chalk", value: "oklch(0.96 0.01 250)" },
  { key: "lime", label: "Lime", value: "oklch(0.86 0.18 132)" },
  { key: "sky", label: "Sky", value: "oklch(0.82 0.12 230)" },
  { key: "amber", label: "Amber", value: "oklch(0.84 0.14 80)" },
  { key: "rose", label: "Rose", value: "oklch(0.80 0.14 18)" },
];

export const DEFAULT_WIDTHS: NoteWidth[] = ["thin", "regular", "bold"];

/** The chalk-red used for the unread number (semantic, chroma-capped). */
export const UNREAD_RED = "oklch(0.66 0.19 22)";

export const DEFAULT_NOTE_STYLE: NoteStyle = {
  color: "chalk",
  width: "regular",
  font: "kalam",
};

/** Resolve a note's stored color key (or raw color) to a CSS color. */
export function resolveInk(color: string, palette: InkColor[]): string {
  const hit = palette.find((p) => p.key === color);
  return hit ? hit.value : color; // raw CSS color passthrough (free-color mode)
}

/** Map a width level to a real font-weight. */
export function weightForWidth(width: NoteWidth): number {
  return width === "thin" ? 300 : width === "bold" ? 700 : 400;
}

/** Faux chalk-stroke width (px) for single-weight fonts. */
export function strokeForWidth(width: NoteWidth): number {
  return width === "thin" ? 0 : width === "bold" ? 0.9 : 0.4;
}
