import type {
  FilterPreset,
  FontOption,
  GradientPreset,
  MediaEditorPresetNames,
  StickerSet,
} from "../types";

/**
 * Applies `labels.presets` (id -> display name) to preset data. Presets whose
 * id has no entry keep their own label; the input is returned as-is (same
 * identity) when there is nothing to rename.
 */

export function renameBackgrounds(
  items: GradientPreset[],
  names: MediaEditorPresetNames["backgrounds"],
): GradientPreset[] {
  if (!names) return items;
  return items.map((g) => (names[g.id] ? { ...g, label: names[g.id]! } : g));
}

export function renameFonts(
  items: FontOption[],
  names: MediaEditorPresetNames["fonts"],
): FontOption[] {
  if (!names) return items;
  return items.map((f) => (names[f.id] ? { ...f, label: names[f.id]! } : f));
}

export function renameFilters(
  items: FilterPreset[],
  names: MediaEditorPresetNames["filters"],
): FilterPreset[] {
  if (!names) return items;
  return items.map((f) => (names[f.id] ? { ...f, label: names[f.id]! } : f));
}

export function renameStickerSets(
  sets: StickerSet[],
  setNames: MediaEditorPresetNames["stickerSets"],
  stickerNames: MediaEditorPresetNames["stickers"],
): StickerSet[] {
  if (!setNames && !stickerNames) return sets;
  return sets.map((set) => ({
    ...set,
    label: setNames?.[set.id] ?? set.label,
    stickers: stickerNames
      ? set.stickers.map((s) =>
          stickerNames[s.id] ? { ...s, alt: stickerNames[s.id]! } : s,
        )
      : set.stickers,
  }));
}
