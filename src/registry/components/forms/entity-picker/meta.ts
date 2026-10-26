import type { ComponentMeta } from "../../../types";

export const meta: ComponentMeta = {
  slug: "entity-picker",
  name: "Entity Picker",
  category: "forms",

  description:
    "Searchable picker for typed entities — single or multi select, kind badges, chip cluster with removal, and custom render slots.",
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
    "Field trigger is a real full-field `<button>` overlay beneath a click-transparent chip layer (F-cross-13: no asChild) — chips keep their own nested remove buttons legally",
    "Host-owned async data: controlled `query` + `onQueryChange(query, 'input' | 'reset')`, `filterItems={false}` to render server results as given (`match` ignored)",
    "Async states — `loading` / `error` (true or message) / `onRetry` (Retry renders only with it), `renderLoading` / `renderError`; precedence loading > error > empty; `aria-busy` on the list and a polite results-count announcement once loading settles",
    "Pagination — a 'Load more' row when both `hasMore` and `onLoadMore` are given; `loadingMore` disables it",
    "Typed `labels` (`EntityPickerLabels`, exported `defaultEntityPickerLabels`); `placeholder` / `triggerLabel` remain as deprecated aliases that win over their keys",
    "`locale` — default match folds case with `toLocaleLowerCase(locale)` (Turkish İ/ı); also formats the results count",
    "Kind badges derive from `items` and the selection, so chips keep their badge while `items` is empty",
    "Imperative handle — focus / open / close / clear",
    "WAI-ARIA 1.2 combobox pattern; cmdk + Radix Popover handle most of the wiring",
  ],
  tags: ["entity-picker", "picker", "combobox", "graph-system"],

  version: "0.2.0",
  status: "alpha",
  // 0.2.0: 30.3 → 44.6 KB built (labels + locale, async states / footer, live-region
  // announcement, server-mode highlight, Load more). U1 said 35 → 40 "on the real number";
  // the U4 fix wave added the footer + highlight control → budget 35 → 50 (≈12% headroom).
  artifactBudgetKB: 50,
  createdAt: "2026-04-29",
  updatedAt: "2026-10-26",

  author: { name: "ilinxa" },

  dependencies: {
    shadcn: ["badge", "command", "popover"],
    npm: {
      "lucide-react": "^1.11.0",
    },
    internal: [],
  },

  related: ["properties-form", "filter-panel", "detail-panel", "markdown-editor"],
};
