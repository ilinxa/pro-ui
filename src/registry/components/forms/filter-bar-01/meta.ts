import type { ComponentMeta } from "../../../types";

export const meta: ComponentMeta = {
  slug: "filter-bar-01",
  name: "Filter Bar 01",
  category: "forms",

  description:
    "Composite filter bar — centered search + category pill row + date-range Popover + optional results count. Each sub-control independently controlled-or-uncontrolled. Sub-control hide flags for partial usage.",
  context:
    "Browse-and-filter UI workhorse: news, blogs, docs, dashboards, e-commerce facets. Three sub-controls (search / chips / date-range) with independent state, plus a combined onChange emitting `{ search, category, dateRange }`. Search debounces 250ms in uncontrolled mode. Date-range Popover composes shadcn Calendar (which transitively brings react-day-picker + date-fns into the project — first user). Migration origin: kasder kas-social-front-v0 NewsMagazineGrid.tsx header section. Composed by `grid-layout-news-01` in the news-domain family.",
  features: [
    "3 sub-controls in one bar — search input + category pill row + date-range Popover",
    "Independently controlled-or-uncontrolled per sub-control",
    "Combined `onChange` emits `{ search, category, dateRange }` on any change",
    "Internal 250ms debounce on search in uncontrolled mode (configurable)",
    "Sub-control hide flags — `hideSearch` / `hideCategories` / `hideDateRange` for partial usage",
    "\"All\" sentinel chip clears the category filter (maps to null internally)",
    "Optional results count with `aria-live='polite'` announcements",
    "i18n via `labels` prop + `formatDate` / `formatDateRange` callbacks (English defaults; Turkish in dummy-data)",
    "Layout `align` prop (left | center | right; default center)",
    "Native `<button aria-pressed>` chips; `role=group` on chip row; `role=search` on search input",
    "Date-range uses shadcn Popover + Calendar primitives (react-day-picker; date-fns transitive)",
    "React.memo wrapped",
  ],
  tags: ["filter-bar-01", "forms", "filter", "search", "date-range", "migration"],

  version: "0.1.0",
  status: "alpha",
  createdAt: "2026-05-02",
  updatedAt: "2026-05-02",

  author: { name: "ilinxa" },

  dependencies: {
    shadcn: ["input", "button", "popover", "calendar", "tabs"],
    npm: {
      "lucide-react": "^1.11.0",
      "react-day-picker": "^9.0.0",
      "date-fns": "^4.0.0",
    },
    internal: [],
  },

  related: ["category-cloud-01", "filter-stack", "entity-picker"],
};
