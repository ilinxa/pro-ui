import type { ComponentMeta } from "../../../types";

export const meta: ComponentMeta = {
  slug: "category-cloud",
  name: "Category Cloud",
  category: "forms",

  description:
    "Flex-wrapped cloud of clickable category chips with optional counts — single-select, toggleable, controlled or uncontrolled.",
  context:
    "Sidebar / inline filter affordance. Differs from `entity-picker` (popover-driven select with search) by being always-visible and count-augmented. Differs from `filter-panel` (multi-section schema-driven filter panel) by handling a single category dimension. Generic over category items via `string[]` shorthand or full `CategoryCloudItem[]` shape. Migration origin: kasder kas-social-front-v0 NewsMagazineGrid.tsx sidebar Categories block. Composed by `magazine-layout` in the news-domain family.",
  features: [
    "Always-visible flex-wrap of pill chips (vs entity-picker's popover-driven select)",
    "Optional inline counts via `count` field on items; configurable format via `formatCount` callback",
    "String-array shorthand: `items={[\"All\", \"Tech\"]}` desugars to `{value, label}` form",
    "Controlled-or-uncontrolled value (single-select; pass null to clear)",
    "Toggleable — re-clicking active clears (configurable via `toggleable` prop)",
    "Native `<button>` semantics with `aria-pressed`; Tab + Enter/Space work natively",
    "Optional editorial-header title with `pb-2 border-b` separator (matches the magazine sidebar header rhythm)",
    "Heading semantic level configurable via `headingAs` (h2 | h3 | h4)",
    "ARIA group with auto-derived label (from `title` or explicit `ariaLabel`)",
    "React.memo wrapped",
  ],
  tags: ["category-cloud", "forms", "filter", "tags", "categories", "migration"],

  version: "0.2.0",
  status: "alpha",
  createdAt: "2026-05-02",
  updatedAt: "2026-08-11",

  author: { name: "ilinxa" },

  dependencies: {
    shadcn: ["badge"],
    npm: {},
    internal: [],
  },

  related: ["entity-picker", "filter-panel", "newsletter-signup"],
};
