# filter-bar-01 — procomp guide

> Stage 3.

## When to use

- Browse-and-filter UIs: news landing pages, blog archives, doc indexes, file browsers, dashboards, e-commerce category pages.
- When you need search + categories + date-range bundled in one bar with consistent state model + a11y.
- When you want results-count feedback alongside the filter UI.

## When NOT to use

- **Multi-section / multi-dimension filters** (price range + size + color + brand) — use `filter-stack`.
- **Single-dimension filter only** — `category-cloud-01` (chips only) or a plain shadcn `Input` (search only).
- **Server-driven autocomplete-style search** — bring your own component; this bar emits state, doesn't drive remote queries.

## Composition patterns

### Sticky header above a content grid

```tsx
<header className="sticky top-0 z-10 bg-background py-4">
  <FilterBar01
    categories={categories}
    onChange={setFilters}
    resultsCount={filteredItems.length}
  />
</header>
<main>{/* content grid */}</main>
```

### Combined onChange (single state)

```tsx
const [filters, setFilters] = useState<FilterBarValue>({
  search: "",
  category: null,
  dateRange: { from: undefined, to: undefined },
});

<FilterBar01
  categories={categories}
  onChange={setFilters}
  resultsCount={filtered.length}
/>
```

### Per-dimension controlled (URL sync)

```tsx
<FilterBar01
  categories={categories}
  search={searchParams.get("q") ?? ""}
  onSearchChange={(s) => updateUrlParam("q", s)}
  category={searchParams.get("cat") ?? null}
  onCategoryChange={(c) => updateUrlParam("cat", c)}
  dateRange={{
    from: searchParams.get("from") ? new Date(searchParams.get("from")!) : undefined,
    to: searchParams.get("to") ? new Date(searchParams.get("to")!) : undefined,
  }}
  onDateRangeChange={({ from, to }) => {
    updateUrlParam("from", from?.toISOString() ?? null);
    updateUrlParam("to", to?.toISOString() ?? null);
  }}
/>
```

### Hide sub-controls for partial usage

```tsx
{/* Search + chips only */}
<FilterBar01 categories={categories} hideDateRange />

{/* Search + date only */}
<FilterBar01 hideCategories />

{/* Just the date picker */}
<FilterBar01 hideSearch hideCategories />
```

### Localization

```tsx
<FilterBar01
  categories={categories}
  labels={{
    searchPlaceholder: "Haber ara...",
    allLabel: "Tümü",
    dateButtonText: "Tarih Filtrele",
    clearDateText: "Tarihi Temizle",
    resultsCountText: (n) => `${n} haber bulundu`,
  }}
  formatDateRange={({ from, to }) => {
    const fmt = new Intl.DateTimeFormat("tr-TR", { day: "numeric", month: "short" });
    return `${fmt.format(from)} - ${fmt.format(to)}`;
  }}
/>
```

## Gotchas

### Debounce only in uncontrolled mode

In **uncontrolled** mode, search debounces 250ms before firing `onSearchChange`. In **controlled** mode (you pass `search`), debounce is bypassed — every keystroke fires `onSearchChange` immediately. If you need debounce in controlled mode, debounce yourself or use `useDeferredValue`.

### `onChange` fires on initial mount

The combined `onChange` callback fires once on mount with initial values. If you want to skip the initial call, track it with a ref:

```tsx
const initialFire = useRef(true);
<FilterBar01
  onChange={(value) => {
    if (initialFire.current) { initialFire.current = false; return; }
    setFilters(value);
  }}
/>
```

### Date Popover uses shadcn Calendar

The date picker is a shadcn `Calendar` primitive in range mode (2 months). It pulls in `react-day-picker` + `date-fns` as transitive peers. If you've already installed Calendar for another reason, no extra cost.

### "All" chip is the sentinel

The first chip in the row is the "All" chip — clicking it clears `category` to `null`. Default label is "All"; override via `labels.allLabel`. The chip's active state is `category === null`, not "the value 'all' is selected" — there's no item with `value: 'all'`.

### Sub-control hide flags + empty `categories`

If you don't pass `categories` (or pass `[]`) AND `hideCategories` is false, the chip row is automatically hidden. You don't need both. Same for `dateRange` — the picker always renders if `hideDateRange` is false (no auto-hide based on data).

## Migration notes

Supersedes the search/filter section in kasder `kas-social-front-v0` `NewsMagazineGrid.tsx` (lines 128–200). The migration:

- **Preserved:** centered search with magnifier icon, pill-shape category chips with active variant swap, "All" sentinel chip, date-range Popover with Calendar icon, conditional clear-date button, results-count display, flex-wrap behavior.
- **Rewrote:** all Turkish strings → labels prop with English defaults; each sub-control independently controlled-or-uncontrolled; `<div role="search">` landmark; `aria-pressed` on chips; `aria-live` on count; native `<button>` semantics throughout; Intl.DateTimeFormat replacing date-fns format strings; debounce in uncontrolled mode; sub-control hide flags.
- **Added:** combined `onChange` emitter for single-state consumers; `align` prop; `formatDate` / `formatDateRange` callbacks; ARIA group label on chip row.

The shadcn Calendar primitive was newly installed for this component (first user). Originals at [`docs/migrations/filter-bar-01/original/`](../../migrations/filter-bar-01/original/).

## Open follow-ups

- v0.2: multi-select on categories.
- v0.2: saved filter presets (chip-row of preset names + "Save current").
- v0.2: reset-all button.
- v0.2: `locale` pass-through for Calendar (date-fns locales).
- v0.3: numeric range / dropdown / multi-tag sub-controls.
- v0.3: chip row could optionally render as `category-cloud-01` (with counts) when consumer prefers — currently the bar uses Button-as-chip (visually different from category-cloud's Badge-as-chip).
