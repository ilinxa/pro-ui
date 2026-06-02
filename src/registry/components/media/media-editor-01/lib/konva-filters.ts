import type { FilterPreset, KonvaFilterSpec } from "../types";

/**
 * Built-in filter presets (Q-P9-style Instagram-inspired chains, recreated
 * with Konva's filter primitives + reusable param overrides).
 *
 * Each preset is applied by:
 *   node.cache();
 *   node.filters(buildKonvaFilterChain(preset.konvaFilters));
 *   node.brightness(params.brightness ?? 0);
 *   // ...etc. per filter
 *
 * Real wiring lives in `composer-editor.tsx` — this file ships the data.
 */

const f = (name: string, params?: Record<string, number>): KonvaFilterSpec =>
  params ? { name, params } : { name };

export const BUILT_IN_FILTER_PRESETS: FilterPreset[] = [
  {
    id: "original",
    label: "Original",
    konvaFilters: [],
  },
  {
    id: "clarendon",
    label: "Clarendon",
    konvaFilters: [
      f("Brighten", { brightness: 0.08 }),
      f("Contrast", { contrast: 18 }),
      f("HSL", { saturation: 0.45, hue: 4 }),
    ],
  },
  {
    id: "gingham",
    label: "Gingham",
    konvaFilters: [
      f("Brighten", { brightness: 0.05 }),
      f("Contrast", { contrast: -12 }),
      f("HSL", { saturation: -0.25 }),
      f("Sepia"),
    ],
  },
  {
    id: "moon",
    label: "Moon",
    konvaFilters: [
      f("Grayscale"),
      f("Brighten", { brightness: 0.04 }),
      f("Contrast", { contrast: 14 }),
    ],
  },
  {
    id: "lark",
    label: "Lark",
    konvaFilters: [
      f("Brighten", { brightness: 0.12 }),
      f("HSL", { saturation: 0.2, hue: -4 }),
    ],
  },
  {
    id: "reyes",
    label: "Reyes",
    konvaFilters: [
      f("Brighten", { brightness: 0.1 }),
      f("Contrast", { contrast: -18 }),
      f("HSL", { saturation: -0.3 }),
      f("Sepia"),
    ],
  },
  {
    id: "juno",
    label: "Juno",
    konvaFilters: [
      f("Contrast", { contrast: 22 }),
      f("HSL", { saturation: 0.4, hue: 6 }),
    ],
  },
  {
    id: "slumber",
    label: "Slumber",
    konvaFilters: [
      f("Brighten", { brightness: -0.04 }),
      f("HSL", { saturation: -0.2, hue: 8 }),
      f("Sepia"),
    ],
  },
  {
    id: "crema",
    label: "Crema",
    konvaFilters: [
      f("Brighten", { brightness: 0.06 }),
      f("HSL", { saturation: -0.15 }),
      f("Sepia"),
    ],
  },
  {
    id: "ludwig",
    label: "Ludwig",
    konvaFilters: [
      f("Brighten", { brightness: 0.08 }),
      f("Contrast", { contrast: 16 }),
      f("HSL", { saturation: 0.1 }),
    ],
  },
];

/**
 * Merge consumer-supplied presets with built-ins.
 * `replace` true → consumer set wins entirely (no built-ins).
 */
export function resolveFilterPresets(
  consumer: FilterPreset[] | undefined,
  replace: boolean,
): FilterPreset[] {
  if (replace) return consumer ?? [];
  if (!consumer || consumer.length === 0) return BUILT_IN_FILTER_PRESETS;
  // Consumer presets appended after built-ins; ids are not de-duped (consumer's
  // responsibility — id collisions can't happen by accident with built-in names).
  return [...BUILT_IN_FILTER_PRESETS, ...consumer];
}
