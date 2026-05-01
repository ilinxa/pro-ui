# filter-bar-01 — procomp plan

> Stage 2.

## Final API

```ts
// types.ts

export interface DateRange {
  from?: Date;
  to?: Date;
}

export interface FilterBarValue {
  search: string;
  category: string | null;
  dateRange: DateRange;
}

export interface FilterBarCategoryItem {
  value: string;
  label?: string;
}

export interface FilterBarLabels {
  searchPlaceholder?: string;
  searchAriaLabel?: string;
  allLabel?: string;            // 'All' chip
  dateButtonText?: string;      // shown when no range set
  clearDateLabel?: string;      // aria-label on the clear-X button
  clearDateText?: string;       // text on the clear button
  resultsCountText?: (count: number) => string; // 'X items found'
}

export type FilterBarAlign = 'left' | 'center' | 'right';

export interface FilterBarProps {
  // ─── Categories ───────────────────────────
  categories?: FilterBarCategoryItem[] | string[];

  // ─── Search (controlled-or-uncontrolled) ──
  search?: string;
  defaultSearch?: string;
  onSearchChange?: (search: string) => void;
  searchDebounceMs?: number;     // default 250 in uncontrolled mode

  // ─── Category (controlled-or-uncontrolled) ─
  category?: string | null;
  defaultCategory?: string | null;
  onCategoryChange?: (category: string | null) => void;

  // ─── Date range (controlled-or-uncontrolled) ─
  dateRange?: DateRange;
  defaultDateRange?: DateRange;
  onDateRangeChange?: (range: DateRange) => void;

  // ─── Combined emitter ─────────────────────
  onChange?: (value: FilterBarValue) => void;

  // ─── Display ──────────────────────────────
  resultsCount?: number;
  align?: FilterBarAlign;        // default 'center'
  hideSearch?: boolean;
  hideCategories?: boolean;
  hideDateRange?: boolean;

  // ─── i18n + theming ───────────────────────
  labels?: FilterBarLabels;
  formatDateRange?: (range: { from: Date; to: Date }) => string;
  formatDate?: (date: Date) => string;

  // ─── Overrides ────────────────────────────
  className?: string;
}
```

## File-by-file plan

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

### 1. `filter-bar-01.tsx` — root
- `"use client"`.
- `React.memo`.
- Owns 3 internal state slots for uncontrolled mode.
- Resolves controlled-vs-uncontrolled per slot.
- Computes combined `FilterBarValue` and fires `onChange` on any sub-change.
- Computes default labels (English) merged with user labels.
- Layout: column flex with center-align by default — search row above, chip+date row below, count below that.

### 2. `parts/search-input.tsx`
- `<div role="search" className="...">`
  - `<Search aria-hidden />` (lucide), absolute-positioned left.
  - `<Input aria-label={...} placeholder={...} value={...} onChange={...} className="pl-12 h-14 text-lg rounded-xl" />`
- Internal debounce in uncontrolled mode via `useEffect` + setTimeout.

### 3. `parts/chip-row.tsx`
- `<div role="group" aria-label={labels.searchAriaLabel ?? 'Filter by category'} className="flex flex-wrap gap-2">`
- First chip: "All" sentinel — clicking sets value to null.
- Each subsequent chip: `<Button variant={isActive ? 'default' : 'outline'} size="sm" aria-pressed={isActive} className="rounded-full">{label}</Button>`

### 4. `parts/date-range-picker.tsx`
- `<Popover>` with shadcn primitives.
  - Trigger: `<Button variant="outline" className="gap-2 rounded-full"> <Calendar /> {label} <ChevronDown /> </Button>`
  - Content: `<CalendarComponent mode="range" selected={range} onSelect={...} numberOfMonths={2} />`
- Conditional clear button to the right of the Popover trigger when range is set: `<Button variant="ghost" size="sm" onClick={clearRange}><X /> {clearDateText}</Button>`

### 5. `lib/format-default.ts`
```ts
const fmt = new Intl.DateTimeFormat(undefined, { day: 'numeric', month: 'short' });
const fmtFull = new Intl.DateTimeFormat(undefined, { day: 'numeric', month: 'long', year: 'numeric' });

export const defaultFormatDate = (d: Date): string => fmtFull.format(d);

export const defaultFormatDateRange = ({ from, to }: { from: Date; to: Date }): string =>
  `${fmt.format(from)} - ${fmt.format(to)}`;
```

### 6. `types.ts` — public types as shown.

### 7. `dummy-data.ts`
```ts
export const DUMMY_CATEGORIES = [
  { value: 'urban-development', label: 'Urban Development' },
  { value: 'sustainability', label: 'Sustainability' },
  { value: 'technology', label: 'Technology' },
  { value: 'events', label: 'Events' },
  { value: 'announcement', label: 'Announcement' },
];

export const DUMMY_LABELS_TR = {
  searchPlaceholder: 'Haber ara...',
  searchAriaLabel: 'Haber arama',
  allLabel: 'Tümü',
  dateButtonText: 'Tarih Filtrele',
  clearDateLabel: 'Tarihi temizle',
  clearDateText: 'Tarihi Temizle',
  resultsCountText: (n: number) => `${n} haber bulundu`,
};
```

### 8. `demo.tsx`
4 tabs as described.

### 9. `usage.tsx`
Code blocks: minimal, controlled, partial-usage, localized.

### 10. `meta.ts` — ComponentMeta with full features list.

### 11. `index.ts` — public exports.

## Dependencies

- `@/components/ui/{input,button,popover,calendar}`
- `@/lib/utils`
- `lucide-react`
- (transitive via Calendar) `react-day-picker`, `date-fns`

## Composition pattern

Headless wrapping; 3 stateless presentational parts. Root holds the state machine.

## Client vs server

**Client component** — `useState` (3 internal slots) + `useEffect` (debounce) + `useId` (ARIA wiring).

## Edge cases

| Case | Behavior |
|---|---|
| All sub-controls hidden | Renders nothing (or just count if provided). |
| Empty `categories` | Chip row hidden. |
| `resultsCount` not provided | Count display hidden. |
| Date range with `from` only (no `to`) | `formatDate(from)` shows; clear-X visible. |
| `category=null` | "All" chip is active. |
| `category` not in `categories` array | Nothing visually selected. |
| RTL | Tailwind flex/gap reverse correctly; chevron and X icons adapt. |
| Reduced motion | No motion in the bar; date-picker animations are Calendar primitive's concern. |

## Accessibility

- `<div role="search">` wraps search.
- `<div role="group">` wraps chip row with aria-label.
- Chips are `<Button>` with `aria-pressed`.
- Results count in `aria-live="polite"`.
- Clear-X has `aria-label` from `labels.clearDateLabel`.
- Date Popover uses shadcn primitives' built-in ARIA.

## Verification

- `tsc / lint / build` clean.
- SSR 200 with all 4 demo tabs.

## Risks

1. **Calendar primitive's locale handling** — react-day-picker accepts a `locale` prop for date-fns locales. We don't expose this in v0.1 (consumer can pass `locale` via spreading extra props if Calendar supports it). Documented as v0.2 candidate.
2. **Debounce interaction with controlled mode** — debounce is ONLY in uncontrolled mode; controlled passes through. Confusing if user mixes (controlled `search` + `searchDebounceMs`); document the rule.
3. **Bundle size** — Calendar + react-day-picker + date-fns is ~180KB minified. First component to use them; future date-driven components amortize the cost.
