# category-cloud-01 — procomp description

> Stage 1: what & why.
>
> **Migration origin:** [`docs/migrations/category-cloud-01/`](../../migrations/category-cloud-01/) (kasder `NewsMagazineGrid.tsx` sidebar).

## Problem

Sites with categorized content need a sidebar / inline filter affordance: the user sees the full set of categories at a glance + per-category counts, clicks one to filter the main content. Common in news, blogs, doc sites, e-commerce facets, dashboards. Pro-ui has `entity-picker` (popover-driven select) but no always-visible flex-wrap filter cloud with counts.

## In scope

- **Always-visible flex-wrap of category chips** — clicking selects, re-clicking clears (toggleable).
- **Inline counts** — `Tech (12)` style; optional per-item.
- **Controlled-or-uncontrolled selection** — single-select; multi is v0.2 candidate.
- **Optional title with editorial-header rhythm** — serif-bold + bottom border.
- **Generic over category items** — `string[]` shorthand or `{value, label, count}[]` full form.
- **WCAG 2.1 AA** — native button semantics, `aria-pressed`, focus-visible ring.

## Out of scope

- Multi-select — v0.2 candidate.
- Search-within-categories — that's `entity-picker`.
- Drag-reorder of categories.
- Async category loading — consumer fetches and passes the array.
- Counts beyond integer (no "1.2k" formatting; consumer's `formatCount` callback handles).

## Target consumers

- News landing pages (the kasder use case)
- Blog tag filters
- Doc topic indexes
- E-commerce facet pills (when count distribution matters)
- Dashboard segment toggles

## Rough API sketch

```tsx
<CategoryCloud01
  items={[
    { value: "tech", label: "Technology", count: 12 },
    { value: "design", label: "Design", count: 8 },
    { value: "events", label: "Events", count: 3 },
  ]}
  value={activeCategory}
  onChange={setActiveCategory}
  title="Categories"
/>
```

## Example usages

**1. Sidebar of a magazine grid:**
```tsx
<aside>
  <CategoryCloud01 items={categories} value={cat} onChange={setCat} title="Categories" />
</aside>
```

**2. Inline filter row (no header):**
```tsx
<CategoryCloud01 items={["All", "Tech", "Design"]} value={cat} onChange={setCat} />
```

**3. Tag cloud with counts only on some items:**
```tsx
<CategoryCloud01 items={tags.map(t => ({ value: t.slug, label: t.name, count: t.count }))} />
```

## Success criteria

- Renders correctly at sidebar widths (~280px) and full-width inline.
- Click selects, re-click clears (when `toggleable`).
- Keyboard: Tab between chips, Enter/Space activates, focus-visible ring per chip.
- `aria-pressed` correctly reflects state.
- Generic input — `string[]` and `{value,label,count}[]` both work.
- `pnpm tsc --noEmit` + `pnpm lint` + `pnpm build` clean.
- SSR returns 200 with all 3 demo tabs.
