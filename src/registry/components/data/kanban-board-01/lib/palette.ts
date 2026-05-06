import type { KanbanPaletteSwatch } from "../types";

export const DEFAULT_PALETTE: KanbanPaletteSwatch[] = [
  { id: "slate", label: "Slate", cssVar: "--muted-foreground" },
  { id: "lime", label: "Lime", cssVar: "--primary" },
  { id: "amber", label: "Amber", cssVar: "--chart-1" },
  { id: "emerald", label: "Emerald", cssVar: "--chart-2" },
  { id: "sky", label: "Sky", cssVar: "--chart-3" },
  { id: "rose", label: "Rose", cssVar: "--destructive" },
];

export function findSwatch(
  palette: KanbanPaletteSwatch[],
  id: string | undefined,
): KanbanPaletteSwatch | undefined {
  if (!id) return undefined;
  return palette.find((s) => s.id === id);
}

export function swatchCssColor(swatch: KanbanPaletteSwatch | undefined): string | undefined {
  if (!swatch) return undefined;
  return `var(${swatch.cssVar})`;
}
