# filter-bar-01 — migration source notes

> Intake doc for [`docs/migrations/filter-bar-01/`](./). The user provided a high-level description; the assistant drafted this doc from the source code + that description. **Sections tagged `[TO CONFIRM]` are inferred and need user sign-off or edit before the analysis pass.**
>
> **Family context:** part of a sub-extraction from the kasder news system. Three small-but-reusable patterns extracted from `NewsMagazineGrid.tsx` (newsletter card, category cloud, filter bar) so `grid-layout-news-01` can become a slot-based layout that composes them. Each is **general-purpose** (no `-news-` infix) — the patterns are universal across news, blog, marketing, docs.
>
> **Biggest call this intake needs:** scope. The source bar bundles search + category chips + date-range Popover + results count. As a single component this is the most complex of the three sub-extractions; could split. See "Open scope decisions" below.
>
> See [`docs/migrations/README.md`](../README.md) for the full pipeline.

## Source

- **App:** `kas-social-front-v0` (kasder)
- **Path in source:** `E:\my projects\kasder\kas-social-front\kas-social-front-v0\src\components\public\sections\news\NewsMagazineGrid.tsx` lines 128–200 (header search-and-filters section).
- **Used in:** sticky header band of the news landing page magazine grid. Drives the parent's `searchQuery`, `activeCategory`, `dateRange`, and feeds the filtered count back into the count display below.
- **Related code:**
  - [`original/NewsMagazineGrid.tsx`](./original/NewsMagazineGrid.tsx) — the source (lines 128–200 are the relevant section; surrounding context shows the parent state machine)
  - [`original/newsData.ts`](./original/newsData.ts) — fixture: the `categories` array drives the category chip row
  - [`original/newsTypes.ts`](./original/newsTypes.ts) — the `NewsType` shape (informational only — the bar itself is generic)

## Role

Composite filter affordance for browsing-and-filtering UIs. Three sub-controls + a count display:
1. **Centered search input** — large rounded input, magnifier icon left, `focus:border-primary` highlight. Live-updates as you type.
2. **Category pill row** — horizontal flex-wrap of pill-shaped Buttons. Active chip uses Button `variant="default"` (filled), others use `variant="outline"`. First chip is a sentinel ("Tümü" / "All") that clears the category filter.
3. **Date-range Popover** — Button-as-trigger with Calendar icon + dynamic label ("Tarih Filtrele" → formatted range when set), opens a 2-month range picker via shadcn `Calendar` (which wraps `react-day-picker`). When a range is selected, an extra "X" clear-date button appears next to the Popover trigger.
4. **Results count** — centered "X haber bulundu" / "X items found" below the controls.

Reusable across any browse-and-filter UI: news, blog archives, doc indexes, file browsers, dashboards, e-commerce category pages.

## What I like (preserve) [TO CONFIRM]

- **Centered search as visual centerpiece** — large rounded input (`h-14 text-lg rounded-xl`), magnifier icon left, focus-on-primary border accent. Reads as the primary affordance.
- **Pill-shape category chips** — `rounded-full` Buttons with active-state via variant swap (`default` ↔ `outline`). Calibrated, not flat.
- **"All" sentinel chip** — first chip filters nothing, default-active, gives the user a clear "show me everything" affordance without an extra UI element.
- **Date-range Popover with Calendar icon** — minimal trigger, expands to a 2-month range picker. Conditional clear-X button only when a range is set (no clutter when no filter active).
- **Centered results count** — small muted text below the bar. Provides feedback without taking layout weight.
- **Wrap behavior** — `flex flex-wrap gap-4` on the filters row means pills wrap on narrow viewports without overflow scrolling.
- **The whole bar lives ABOVE the content grid** — sticky in the source; this is a layout call that belongs to the consumer, not the bar itself.

## What bothers me (rewrite) [TO CONFIRM]

### Localization / hardcoded strings
- **"Haber ara..."** (search placeholder), **"Tarih Filtrele"** (date-button label when empty), **"Tarihi Temizle"** (clear-date label), **"X haber bulundu"** (results count), **"d MMM"** / **"d MMMM yyyy"** date format strings (Turkish via `tr` locale from date-fns). All become `labels` prop with English defaults.

### State / control model
- **All filter state lives in the parent** (`searchQuery`, `activeCategory`, `dateRange` in `useState` upstream). For pro-ui the bar should be **controlled-or-uncontrolled** mirroring `properties-form` posture:
  - Controlled: consumer drives `searchQuery`, `categoryValue`, `dateRange` + onChange callbacks.
  - Uncontrolled: bar holds its own state internally; consumer only listens via `onFiltersChange({ search, category, dateRange })`.
- **`activeCategory === "Tümü"` sentinel-string** in source — the magic "All" string. Should resolve to `null` / `undefined` internally; the "All" chip clears the value.
- **No debounce on search** — every keystroke fires `onSearchChange`. Should debounce (e.g. 250ms) or use React 19 `useDeferredValue` (matches the markdown-editor pattern).

### Dependencies
- **`date-fns` peer dep** (~70KB minified, with locale subsetting) — pro-ui doesn't ship date-fns yet. Adding it is a meaningful peer-dep introduction. **Decision needed:** add it, OR replace with native `Intl.DateTimeFormat` for the simple format strings used here.
- **shadcn `Calendar` primitive** — pro-ui hasn't installed this yet (`pnpm dlx shadcn@latest add calendar` would bring it in). Ships `react-day-picker` as a transitive peer.
- **Locale hardcoded `tr` from date-fns/locale** — should be configurable via `locale` prop OR `formatDate` callback (matches the formatter pattern in `content-card-news-01`).

### Categories input
- **Categories array hardcoded import** (`import { categories } from "@/data/newsData"`) — should be a `categories: string[]` OR `categories: { value: string; label: string }[]` prop.
- **No way to provide pre-rendered chips** — consumers wanting custom chip styling have to pass classNames or wait for a v0.2 chip slot. Acceptable.

### Accessibility
- **No `<form role="search">`** — the search input is a bare `<Input>` outside any form. Submit-on-enter / autocomplete=off conventions don't apply.
- **No `aria-label`** on the search input.
- **No `aria-pressed` / `role="tablist"`** on the category chip row — it's just a flex of buttons. Should be either `role="tablist"` (radio-group semantics) OR `aria-pressed` per chip.
- **No keyboard arrow-key navigation** between chips (Tab still works, but arrow-keys typical for chip groups would be friendlier).
- **Date-range Popover has no `aria-label` on the trigger** beyond the visible text ("Tarih Filtrele" or the date range).
- **Results count not announced** to screen readers — should be in an `aria-live="polite"` region.

### UI / layout
- **`max-w-xl mx-auto` on search** — opinionated. Consumers may want full-width or narrower. Should be a `searchClassName` slot.
- **Header section is not sticky in the bar itself** — that's a parent concern. Bar shouldn't dictate sticky positioning.
- **Clear-date button always renders to the RIGHT of the date Popover** — for RTL might want flexible positioning.

### Open scope decisions

**(a) One composite component vs. split into atoms.**
- Pros of one composite: simpler import (`<FilterBar>`), single state model, encapsulated keyboard navigation, results-count tied to filter state.
- Cons of one composite: largest component yet (probably ~25 files), complex API surface, hard to mix-and-match if a consumer wants only search + chips (no date).
- **Recommendation: ONE composite, with each sub-control as an internal `parts/<sub>.tsx` module that's NOT exported.** Future v0.2 could expose them if a real consumer needs only search.
- Alternative: scaffold as 3 separate components (`search-input-01`, `category-chip-row-01`, `date-range-picker-01`) and `filter-bar-01` becomes the assembly. Heavier upfront but more LEGO.

**(b) Date-range Popover scope.**
- Pros of including: feature parity with source.
- Cons: `date-fns` + `react-day-picker` peer deps, locale handling complexity, `Calendar` shadcn dep not yet installed.
- Alternative: ship v0.1 with **search + chips only**, leave date-range as a v0.2 add. Consumer with date needs passes their own component as a slot.
- **Worth your call.** If you want feature parity, we add the deps. If you want a faster ship, we punt date-range to v0.2.

## Constraints / non-goals [TO CONFIRM]

- **Generic over filter values** — not coupled to NewsType or any domain.
- **Stay framework-agnostic.** No `next/*`, no app contexts.
- **No actual filtering logic in the component** — bar just emits filter state changes. Consumer applies them to their data.
- **No URL-state sync** — consumer wires that themselves (using their router); bar is presentational + state-emitter only.
- **No multi-select on categories in v0.1** — single-active matches the source. Multi is a v0.2 candidate.
- **No virtualization on the chip row** — chip clouds rarely exceed 20 items.
- **Independent of `newsletter-card-01` and `category-cloud-01`** — no cross-imports.

## Screenshots / links

User shared 1 screenshot in this turn (the full filter bar: centered search + 7-chip pill row with "Tümü" active + Tarih Filtrele button + "12 haber bulundu" count). Drop it into [`./original/screenshots/`](./original/screenshots/) when convenient — visual record of the chip-row density + the search-bar prominence.

**Useful for the analysis pass:**
- Screenshot of the date-range Popover OPEN (the 2-month calendar) — to evaluate the Calendar dep.
- Screenshot of the bar at narrow viewport (chip-row wrap behavior).
- Screenshot with a date range applied (the "X" clear button visible).

<!-- Paste additional images, design files, screen recordings, or notes below. -->
