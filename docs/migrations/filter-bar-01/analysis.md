# filter-bar-01 — migration analysis

> Extraction pass for [`docs/migrations/filter-bar-01/`](./). Filled by the assistant after reading [`original/`](./original/) + [`source-notes.md`](./source-notes.md).
>
> **Family context:** largest of 3 sub-extractions from kasder's `NewsMagazineGrid.tsx` (siblings: `newsletter-card-01`, `category-cloud-01`).

## Design DNA to PRESERVE

- **Centered search as visual centerpiece** — large rounded input (`h-14 text-lg rounded-xl`), magnifier icon left, `focus:border-primary`.
- **Pill-shape category chips** — `rounded-full` Buttons with active-state via variant swap (`default` ↔ `outline`). Source uses Button-as-chip (not Badge), so chip row diverges visually from `category-cloud-01`'s Badge-style.
- **"All" sentinel chip** — first chip, default-active, clears the category filter.
- **Date-range Popover** — Button trigger with Calendar icon + dynamic label, opens 2-month range picker; conditional clear-X button when range is set.
- **Centered results count** — small muted text below the bar.
- **Wrap behavior** — `flex flex-wrap gap-4`.

## Structural debt to REWRITE

| # | Source | Resolution |
|---|---|---|
| 1 | All Turkish strings hardcoded | `labels` prop with English defaults |
| 2 | All filter state in parent | Each sub-control supports controlled-or-uncontrolled |
| 3 | Categories array imported from app data | `categories: string[] \| { value, label }[]` prop |
| 4 | Hardcoded "Tümü" sentinel | `allLabel` prop (default: "All"); internally maps to `null` |
| 5 | `date-fns/locale/tr` hardcoded | `formatDateRange` callback (default: native `Intl.DateTimeFormat`) |
| 6 | No debounce on search | Internal 250ms debounce in uncontrolled mode; controlled mode passes through immediately |
| 7 | No `<form role="search">` | Wrap search input in `<div role="search">` for landmark |
| 8 | No `aria-pressed` on chips | Add per-chip |
| 9 | Results count not announced | `aria-live="polite"` |
| 10 | Layout opinionated (centered) | `align?: 'left' \| 'center' \| 'right'` (default: `center`) |
| 11 | Three sub-controls always rendered | `hideSearch` / `hideCategories` / `hideDateRange` for partial usage |

## Dependency audit

### Keep
- `@/components/ui/input`, `button`, `popover`, `calendar` (newly added)
- `@/lib/utils`
- `lucide-react` (Search, Calendar, ChevronDown, X)

### Add
- **shadcn `Calendar` primitive** — wraps `react-day-picker`; pulls `date-fns` transitively.

## Dynamism gaps

Three sub-controls each controlled/uncontrolled, plus combined `onChange` callback emitting `{ search, category, dateRange }`. i18n labels + format callbacks + sub-control hide flags.

## Optimization gaps

- `React.memo` wrap.
- Internal 250ms debounce on search in uncontrolled mode.

## Accessibility gaps

`<div role="search">` wrap, native `<button aria-pressed>` per chip, `role="group"` on chip container, `aria-live="polite"` on count, `aria-label` on clear-date X.

WCAG 2.1 AA target.

## Proposed procomp scope

```
src/registry/components/forms/filter-bar-01/
├── filter-bar-01.tsx
├── parts/
│   ├── search-input.tsx
│   ├── chip-row.tsx
│   └── date-range-picker.tsx
├── lib/
│   └── format-default.ts
├── types.ts
├── dummy-data.ts
├── demo.tsx
├── usage.tsx
├── meta.ts
└── index.ts
```

**File count:** 11. **Category:** `forms`.

### Demo plan

4 tabs:
1. **Basic** — uncontrolled, all 3 sub-controls.
2. **Controlled** — sibling state display.
3. **Partial usage** — `hideDateRange` / `hideCategories`.
4. **Localized** — Turkish labels + custom date formatter.

## Recommendation

**PROCEED** with full feature parity (search + chips + date-range). Calendar primitive (with transitive `react-day-picker` + `date-fns`) is acceptable infrastructure investment — unblocks future date-driven components.
