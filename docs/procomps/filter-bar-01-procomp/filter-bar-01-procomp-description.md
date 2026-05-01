# filter-bar-01 — procomp description

> Stage 1.
>
> **Migration origin:** [`docs/migrations/filter-bar-01/`](../../migrations/filter-bar-01/).

## Problem

Browse-and-filter UIs need a composite filter bar: search + category chips + date range, often with a results count. Common in news, blog archives, doc indexes, dashboards, e-commerce category pages. Built ad-hoc per project; no consistent state model, no consistent a11y baseline, no shared i18n surface.

## In scope

- **3 sub-controls** in one bar: search input + category chips + date-range picker.
- **Each sub-control controlled-or-uncontrolled** with its own `value` / `defaultValue` / `onXChange` triplet.
- **Combined `onChange`** emitting `{ search, category, dateRange }` on any change.
- **"All" sentinel chip** that clears the category filter (maps to `null` internally).
- **Optional results count** below the bar with `aria-live`.
- **Sub-control hide flags** for partial usage (`hideSearch` / `hideCategories` / `hideDateRange`).
- **i18n** — `labels` prop covers all visible text; English defaults.
- **WCAG 2.1 AA** target.

## Out of scope

- Multi-select on categories — v0.2.
- Saved filter presets / reset-all button — v0.2.
- Server-side filtering or URL-state sync — consumer's concern.
- Custom date-input UI (text-typed instead of Popover-Calendar) — out of v0.1; consumer can hide the date and bring their own.
- Numeric range / dropdown / multi-tag filters — out of v0.1.

## Target consumers

News landing pages, blog archives, doc indexes, file browsers, dashboards, e-commerce category pages.

## Rough API sketch

```tsx
<FilterBar01
  categories={[
    { value: 'tech', label: 'Tech' },
    { value: 'design', label: 'Design' },
  ]}
  onChange={({ search, category, dateRange }) => {
    setFilters({ search, category, dateRange });
  }}
  resultsCount={42}
/>
```

## Example usages

**1. Sticky header above a magazine grid:**
```tsx
<header className="sticky top-0 bg-background py-4 z-10">
  <FilterBar01
    categories={categories}
    onChange={setFilters}
    resultsCount={filteredItems.length}
  />
</header>
```

**2. Search + chips only (date hidden):**
```tsx
<FilterBar01 categories={categories} hideDateRange onChange={setFilters} />
```

**3. Localized + controlled:**
```tsx
<FilterBar01
  categories={categories}
  search={search}
  onSearchChange={setSearch}
  category={cat}
  onCategoryChange={setCat}
  dateRange={range}
  onDateRangeChange={setRange}
  labels={trLabels}
  formatDateRange={(r) => format(r.from, 'd MMM') + ' - ' + format(r.to, 'd MMM')}
/>
```

## Success criteria

- All 3 sub-controls render correctly; each can be hidden independently.
- Search debounces in uncontrolled mode (~250ms).
- Date Popover opens 2-month range picker; clear-X button appears when range set.
- "All" chip clears category to null.
- Results count announced via `aria-live`.
- TypeScript: types strict, FilterBarValue exported, sub-control hide flags work.
- `pnpm tsc --noEmit` + `pnpm lint` + `pnpm build` clean.
- SSR returns 200 with all 4 demo tabs.
