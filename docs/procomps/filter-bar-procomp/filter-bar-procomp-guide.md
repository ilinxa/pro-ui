# filter-bar — procomp guide

> Stage 3 · v0.3.0 (2026-10-26). Upgrading from 0.2.x: read [Migration 0.2 → 0.3](#migration-02--03) first — `onChange`
> no longer fires on mount and the default date format is `"en"`.

## When to use

- Browse-and-filter UIs: news landing pages, blog archives, doc indexes, file browsers, dashboards, e-commerce category pages.
- When you need search + categories + date-range bundled in one bar with consistent state model + a11y.
- When you want results-count feedback alongside the filter UI.

## When NOT to use

- **Multi-section / multi-dimension filters** (price range + size + color + brand) — use `filter-panel`.
- **Single-dimension filter only** — `category-cloud` (chips only) or a plain shadcn `Input` (search only).
- **Server-driven autocomplete-style search** — bring your own component; this bar emits state, doesn't drive remote queries.

## Composition patterns

### Sticky header above a content grid

```tsx
<header className="sticky top-0 z-10 bg-background py-4">
  <FilterBar
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

<FilterBar
  categories={categories}
  onChange={setFilters}
  resultsCount={filtered.length}
/>
```

### Per-dimension controlled (URL sync)

```tsx
<FilterBar
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
<FilterBar categories={categories} hideDateRange />

{/* Search + date only */}
<FilterBar hideCategories />

{/* Just the date picker */}
<FilterBar hideSearch hideCategories />
```

### Localization

```tsx
import { tr } from "date-fns/locale";

<FilterBar
  categories={categories}
  locale="tr"                 // dates on the trigger + the results count number
  timeZone="Europe/Istanbul"  // optional; also given to the calendar
  calendarLocale={tr}         // month / weekday names inside the calendar (date-fns Locale you import)
  labels={{
    searchPlaceholder: "Haber ara…",
    searchAriaLabel: "Haber ara",
    allLabel: "Tümü",
    dateButtonText: "Tarihe göre filtrele",
    clearDateLabel: "Tarih filtresini temizle",
    clearDateText: "Tarihi temizle",
    categoriesAriaLabel: "Kategoriye göre filtrele",
    resultsCountText: (n) => `${new Intl.NumberFormat("tr").format(n)} haber bulundu`,
    calendarLoadErrorText: "Takvim yüklenemedi.",
    calendarRetryText: "Tekrar dene",
  }}
/>
```

- `locale` (default `"en"`; an invalid or unsupported tag falls back to `"en"`) formats the trigger dates. Without
  `locale` the count reads "12345 items found"; with it the number is grouped for that locale ("12.345").
- The default count text uses plural rules: "1 item found" / "{n} items found". `resultsCountText` gets the raw number.
- Every label key is optional; passing `undefined` for a key keeps its default.
- `formatDate` / `formatDateRange` still override the date text completely.
- `dir` (`"ltr"` / `"rtl"`) is needed because the date popover renders in a portal and does not inherit direction
  from your layout. Without it the bar reads the nearest `dir` after mounting.

### Search accessory, alignment

```tsx
<FilterBar
  align="left"                      // "left" | "center" (default) | "right" — both rows; logical: "left" = start (right under RTL)
  searchAccessory={<Kbd>⌘K</Kbd>}   // inline end of the search field, after the input in tab order
/>
```

## Gotchas

### When `onChange` fires

Once per user interaction (a chip, a date pick, clearing the date, a committed search), with the merged value. Never on
mount (unless `emitInitialChange`), never because your `onChange` changed identity, never because you changed a
controlled prop. If a chip or date is used while a search is still debouncing, that search is committed first and
included in the same call — no second, late search-only call follows. `onSearchChange` / `onCategoryChange` /
`onDateRangeChange` keep firing for their own control.

### Search debounce

Uncontrolled search commits after `searchDebounceMs` (default 250). Controlled search (`search` passed) fires on every
keystroke unless you set `debounceControlledSearch`: then the field keeps a local echo and commits after the delay.
Your `search` prop wins whenever it changes to something that is not one of our pending commits (a reset, a URL change),
and a host that adopts commits late (router / URL state) does not make the field jump back. If you never adopt a
commit, the field keeps showing the typed text until your prop next changes. A commit still pending when the bar
unmounts is dropped.

### The calendar loads lazily

The date picker is the shadcn `Calendar` (range, two months). Its code loads only when the date popover first opens,
behind a calendar skeleton (two months from `md` up, one on phones); with `hideDateRange` it never loads. The install still includes `calendar`,
`react-day-picker` and `date-fns`. If the chunk fails to load (offline, a stale tab after a deploy) the popover shows
`labels.calendarLoadErrorText` with a `labels.calendarRetryText` button instead of crashing the page.

### Server rendering with a preset date range

The default time zone is the runtime's. If you server-render a preset `dateRange`, pass `timeZone` so the server and the
browser format the same day.

### "All" chip is the sentinel

The first chip in the row is the "All" chip — clicking it clears `category` to `null`. Default label is "All"; override via `labels.allLabel`. The chip's active state is `category === null`, not "the value 'all' is selected" — there's no item with `value: 'all'`.

### Sub-control hide flags + empty `categories`

If you don't pass `categories` (or pass `[]`) AND `hideCategories` is false, the chip row is automatically hidden. You don't need both. Same for `dateRange` — the picker always renders if `hideDateRange` is false (no auto-hide based on data).

## Migration 0.2 → 0.3

| Before | Now | What to do |
|---|---|---|
| `onChange` fired once on mount, again when its identity changed, and when a controlled prop changed | Fires only from user interactions | Drop any "skip the first call" ref. If you seeded state from the mount call, pass `emitInitialChange` (one call on mount). |
| Dates formatted in the browser's language | Formatted in `"en"` unless `locale` is passed (no hydration mismatch) | Pass `locale` (and `timeZone`) to localize. |
| "1 items found" | "1 item found" | Nothing, unless you matched the old text. |
| Chip row always centred | `align` applies to the chip row too | Nothing for the default (`center`). |
| Calendar in the initial bundle | Loads when the popover opens | Nothing. |

## Migration notes (from the source app)

Supersedes the search/filter section in kasder `kas-social-front-v0` `NewsMagazineGrid.tsx` (lines 128–200). The migration:

- **Preserved:** centered search with magnifier icon, pill-shape category chips with active variant swap, "All" sentinel chip, date-range Popover with Calendar icon, conditional clear-date button, results-count display, flex-wrap behavior.
- **Rewrote:** all Turkish strings → labels prop with English defaults; each sub-control independently controlled-or-uncontrolled; `<div role="search">` landmark; `aria-pressed` on chips; `aria-live` on count; native `<button>` semantics throughout; Intl.DateTimeFormat replacing date-fns format strings; debounce in uncontrolled mode; sub-control hide flags.
- **Added:** combined `onChange` emitter for single-state consumers; `align` prop; `formatDate` / `formatDateRange` callbacks; ARIA group label on chip row.

The shadcn Calendar primitive was newly installed for this component (first user). Originals at [`docs/migrations/filter-bar/original/`](../../migrations/filter-bar/original/).

## Open follow-ups

- Not implemented: multi-select on categories.
- Not implemented: saved filter presets (chip-row of preset names + "Save current").
- Not implemented: reset-all button.
- Not implemented: numeric range / dropdown / multi-tag sub-controls.
- Not implemented: the chip row could optionally render as `category-cloud` (with counts) when consumer prefers — currently the bar uses Button-as-chip (visually different from category-cloud's Badge-as-chip).
