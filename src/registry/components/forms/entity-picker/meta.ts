import type { ComponentMeta } from "../../../types";

export const meta: ComponentMeta = {
  slug: "entity-picker",
  name: "Entity Picker",
  category: "forms",

  description:
    "Searchable typed picker — single or multi mode, kind badges, custom search, custom render slots, multi-mode chip cluster with chip-X removal.",
  context:
    "Tier 1 pro-component for the graph-system. Generic over the entity type via `<EntityPicker<T extends EntityLike>>` with mode-aware `value` typing via TypeScript function overloads. Built on shadcn `Command` (cmdk) for search and `Popover` for the dropdown. Composed inside force-graph from v0.3 onward (linking-mode UI) and inside properties-form custom field renderers. Generic standalone: any 'pick one or more typed things' surface. cmdk's a11y wiring + keyboard nav (↑/↓/Enter/Esc) is inherited; multi-mode adds chips with per-chip remove buttons + Backspace-on-empty-search-removes-last-chip.",
  features: [
    "Single OR multi mode via `mode` prop with mode-aware value typing (function overloads)",
    "Searchable via shadcn Command (cmdk) with case-insensitive substring default",
    "Custom match function for richer search (e.g., search across description)",
    "Kind badges via `kinds: Record<string, KindMeta>` map; OKLCH color literals supported",
    "Custom render slots — renderItem / renderTrigger / renderEmpty",
    "Multi-mode chip cluster with per-chip remove buttons and Backspace-on-empty-search removal",
    "Controlled-or-uncontrolled open state mirroring Radix Popover convention",
    "id-set selection equality — onChange fires only when selection ids change",
    "Trigger as `<div role=\"button\">` (not `<button>`) to allow nested chip remove buttons",
    "Imperative handle — focus / open / close / clear",
    "WAI-ARIA 1.2 combobox pattern; cmdk + Radix Popover handle most of the wiring",
  ],
  tags: ["entity-picker", "picker", "combobox", "graph-system"],

  version: "0.1.0",
  status: "alpha",
  createdAt: "2026-04-29",
  updatedAt: "2026-04-29",

  author: { name: "ilinxa" },

  dependencies: {
    shadcn: ["badge", "button", "command", "popover", "tabs"],
    npm: {
      cmdk: "^1.1.1",
      "lucide-react": "^1.11.0",
      "radix-ui": "^1.4.3",
    },
    internal: [],
  },

  related: ["properties-form", "filter-stack"],
};
