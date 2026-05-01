import type { ComponentMeta } from "../../../types";

export const meta: ComponentMeta = {
  slug: "category-cloud-01",
  name: "Category Cloud 01",
  category: "forms",

  description:
    "Always-visible flex-wrap of clickable category chips with optional inline counts. Single-select, controlled-or-uncontrolled, toggleable, native button semantics with aria-pressed.",
  context:
    "Sidebar / inline filter affordance. Differs from `entity-picker` (popover-driven select with search) by being always-visible and count-augmented. Differs from `filter-stack` (multi-section schema-driven filter panel) by handling a single category dimension. Generic over category items via `string[]` shorthand or full `CategoryCloudItem[]` shape. Migration origin: kasder kas-social-front-v0 NewsMagazineGrid.tsx sidebar Categories block. Composed by `grid-layout-news-01` in the news-domain family.",
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
  tags: ["category-cloud-01", "forms", "filter", "tags", "categories", "migration"],

  version: "0.1.0",
  status: "alpha",
  createdAt: "2026-05-02",
  updatedAt: "2026-05-02",

  author: { name: "ilinxa" },

  dependencies: {
    shadcn: ["badge", "tabs"],
    npm: {},
    internal: [],
  },

  related: ["entity-picker", "filter-stack", "newsletter-card-01"],
};
