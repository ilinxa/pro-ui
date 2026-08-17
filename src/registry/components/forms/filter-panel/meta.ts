import type { ComponentMeta } from "../../../types";

export const meta: ComponentMeta = {
  slug: "filter-panel",
  name: "Filter Panel",
  category: "forms",

  description:
    "Schema-driven filter panel — checkbox lists, toggles, text, and custom filter types with AND composition and debounced input.",
  context:
    "Tier 1 pro-component for the graph-system. Generic over the item type; the host supplies items, categories, predicates, and decides what to do with the filtered output. AND-across-categories with OR-or-AND-within-category controlled by the host's predicate. Pairs with the graph in force-graph v0.4 for the groups/filter panel; useful standalone wherever a faceted-filter sidebar is needed.",
  features: [
    "Four built-in filter types — checkbox-list, toggle, text, custom",
    "AND-across-categories composition; host-defined within-category semantics",
    "Mode toggle (Union / Intersection) on checkbox-list via a plain-button segmented control",
    "Per-option solo button with tooltip on checkbox-list",
    "Debounced text input (default 250ms) with flush-on-blur, ESC-clears",
    "Custom render slot with error boundary and label-association via fieldId",
    "Per-category clear button + global clear-all in footer",
    "Dev-only schema validation — reserved suffix, duplicate id, empty options",
    "Categories-reference-instability dev warning (>5 successive unstable renders)",
    "Imperative handle — clearAll / clear / isEmpty",
  ],
  tags: ["filter-panel", "filter", "facets", "graph-system"],

  version: "0.2.1",
  status: "alpha",
  artifactBudgetKB: 40,
  createdAt: "2026-04-29",
  updatedAt: "2026-08-18",

  author: { name: "ilinxa" },

  dependencies: {
    shadcn: ["button", "checkbox", "input", "switch", "tooltip"],
    npm: {
      "lucide-react": "^1.11.0",
    },
    internal: [],
  },

  related: ["properties-form", "data-table"],
};
