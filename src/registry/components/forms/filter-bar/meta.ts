import type { ComponentMeta } from "../../../types";

export const meta: ComponentMeta = {
  slug: "filter-bar",
  name: "Filter Bar",
  category: "forms",

  description:
    "Composite filter bar — search, category pills, date-range picker, and results count, each independently controlled or hidden.",
  context:
    "Browse-and-filter UI workhorse: news, blogs, docs, dashboards, e-commerce facets. Three sub-controls (search / chips / date-range) with independent state, plus a combined onChange emitting `{ search, category, dateRange }`. Search debounces 250ms in uncontrolled mode. Date-range Popover composes a lazily loaded shadcn Calendar (react-day-picker; date-fns comes with it). Migration origin: kasder kas-social-front-v0 NewsMagazineGrid.tsx header section. Composed by `magazine-layout` in the news-domain family.",
  features: [
    "3 sub-controls in one bar — search input + category pill row + date-range Popover",
    "Independently controlled-or-uncontrolled per sub-control",
    "Combined `onChange` emits the merged `{ search, category, dateRange }` once per user interaction — never on mount, never when a callback identity or a controlled prop changes; `emitInitialChange` opts in to one mount call",
    "Uncontrolled search debounces 250ms (configurable) and emits one `onChange` per commit; `debounceControlledSearch` gives controlled search the same debounce with a local echo and a resync when the prop moves",
    "Sub-control hide flags — `hideSearch` / `hideCategories` / `hideDateRange` for partial usage",
    "\"All\" sentinel chip clears the category filter (maps to null internally)",
    "Optional results count with `aria-live='polite'` announcements; default text is \"1 item found\" / \"{n} items found\"",
    "i18n via `labels` prop, `locale` (default \"en\") + `timeZone` for the default date formatting, and `formatDate` / `formatDateRange` callbacks",
    "`calendarLocale` forwards a date-fns Locale (host-imported) and `dir` to the calendar; `dir` otherwise resolves from the nearest [dir]",
    "Layout `align` (left | center | right; default center) aligns the search, the filter row and the chip row",
    "`searchAccessory` slot at the inline end of the search field, after the input in tab order",
    "Calendar is lazy-loaded: react-day-picker + date-fns load only when the date popover first opens (never with `hideDateRange`)",
    "Native `<button aria-pressed>` chips; `role=group` on chip row; `role=search` on the search wrapper",
    "React.memo wrapped",
  ],
  tags: ["filter-bar", "forms", "filter", "search", "date-range", "migration"],

  version: "0.3.0",
  status: "alpha",
  // 0.3.0: 18.4 → 33.75 KB built (lazy calendar part + load-error boundary, locale /
  // time-zone / plural helpers, pending-search flush + echo tracking). U1 estimated ~22;
  // budget 25 → 38 (≈12% headroom).
  artifactBudgetKB: 38,
  createdAt: "2026-05-02",
  updatedAt: "2026-10-26",

  author: { name: "ilinxa" },

  dependencies: {
    shadcn: ["input", "button", "popover", "calendar"],
    npm: {
      "lucide-react": "^1.11.0",
      "react-day-picker": "^9.14.0",
    },
    internal: [],
  },

  related: ["category-cloud", "filter-panel", "entity-picker"],
};
