# grid-layout-news-01 — migration source notes

> Intake doc for [`docs/migrations/grid-layout-news-01/`](./). The user provided a high-level description; the assistant drafted this doc from the source code + that description. **Sections tagged `[TO CONFIRM]` are inferred and need user sign-off or edit before the analysis pass.**
>
> **Family context:** part of a 4-component news-domain migration. Sibling migrations: `content-card-news-01` (the brief card), `page-hero-news-01` (the page hero band), and `detail-page-news-01` (deferred). All four must be **totally independent** (no cross-imports — sealed folders), **fully compatible** (compose cleanly when used together), and **dynamic** (props/slots/generics, no hardcoded data).
>
> **Critical scope decision:** the layout primitive is `card-agnostic` — it does NOT import `content-card-news-01`. It accepts a `renderItem(item, slot)` callback (or a card-component slot) and the consumer wires the card. The pro-ui demo composes both together as a usage example.
>
> See [`docs/migrations/README.md`](../README.md) for the full pipeline.

## Source

- **App:** `kas-social-front-v0` (kasder)
- **Path in source:** `E:\my projects\kasder\kas-social-front\kas-social-front-v0\src\components\public\sections\news\NewsMagazineGrid.tsx`
- **Used in:** the news landing page (sits below `NewsHero`). It IS the news index — search, filter, browse, paginate.
- **Related code:**
  - [`original/NewsMagazineGrid.tsx`](./original/NewsMagazineGrid.tsx) — the migration target (~320 lines: filter+sort+paginate logic + sticky header + 8/4 main+sidebar layout + IntersectionObserver loader)
  - [`original/NewsCard.tsx`](./original/NewsCard.tsx) — **consumer dependency reference** (NOT migrated here — that's `content-card-news-01`). Included so the analysis can see how the grid uses the card's 5 variants (`featured` / `large` / `medium` / `list`)
  - [`original/newsTypes.ts`](./original/newsTypes.ts) — `NewsType` shape that the grid is currently coupled to
  - [`original/newsData.ts`](./original/newsData.ts) — fixture (`generateMockNews()`, `categories` array, `mockNews`, `mockNewsDetails`, `relatedNews`)

## Role

Magazine-style content grid layout. Orchestrates a list of items into a layered hierarchy:

1. **Sticky search-and-filter header** — centered search input (large, rounded, magnifier icon) + horizontal pill row of category chips + date-range Popover (2-month calendar) + clear-date button + "X items found" count.
2. **Featured hero card** (only on page 1) — single full-width card matching the `content-card-news-01` `featured` variant. Picked by `item.featured === true`.
3. **8/4 main+sidebar grid:**
   - **Main column** (`col-span-8`): a "tower" of cards — 1 large card → 2-up medium row → 3-up grid of remaining medium cards.
   - **Sidebar** (`col-span-4`, `sticky top-24`): three blocks stacked — "Popüler Haberler" list (top 5 by views, list-variant cards), Categories cloud (badge cloud with item counts, click-to-filter), Newsletter CTA (input + button).
4. **Infinite scroll loader at the bottom** — IntersectionObserver triggers `loadMore` when in view; bouncing-3-dots while loading; "Tüm haberler gösterildi" terminal message when no more to load.

State (currently): 7 useState (`allNews`, `displayedNews`, `searchQuery`, `activeCategory`, `dateRange`, `page`, `hasMore`, `isLoading`) + 1 useRef + 2 useEffect + 2 useCallback. Page size hardcoded `ITEMS_PER_PAGE = 6`. 500ms artificial loading delay. Default category sentinel `"Tümü"` (= "All").

## What I like (preserve) [TO CONFIRM]

> Drafted from reading the code; please trim / add / correct.

- **The magazine layout shape itself** — featured-hero + 8/4 main+sidebar + main's tower of (large → 2-up → 3-up) cells. This descending-density pattern is the magazine intuition; preserve.
- **Sticky-scrolling sidebar** (`sticky top-24`) — keeps the sidebar useful as the user scrolls a long main column.
- **Pill-shaped filter chips** with active-state via Button variant swap (`outline` ↔ `default`, `rounded-full`).
- **Category cloud with counts** in the sidebar — `{category} ({count})` badges. At-a-glance view of distribution; click-to-filter.
- **Date-range Popover** with 2-month calendar + clear-date affordance. Not many news layouts have date filtering — this is a real differentiator.
- **Centered search bar** — large rounded input, magnifier icon left, `focus:border-primary`. Visual centerpiece of the header.
- **Empty state** — Filter icon + "Haber Bulunamadı" + body text. Calm, not alarming.
- **Bouncing-3-dots loader** — staggered `animate-bounce` (`-0.3s`, `-0.15s`, `0s`). Quiet and professional.
- **"All shown" terminal message** — graceful close to the infinite scroll instead of just stopping.
- **Featured-only-on-page-1 semantics** — featured doesn't repeat as you load more. Sensible.
- **Sort by date desc** — newest first; standard news-feed expectation.
- **The 3-block sidebar structure (Popular / Categories / Newsletter)** as a pattern — even if these become slots in pro-ui, the *layout idea* of "three-block sticky sidebar" is worth surfacing as a default composition.

## What bothers me (rewrite) [TO CONFIRM]

> Drafted from registry portability rules + general migration heuristics. The biggest decision is in the "filter/search/sort/pagination logic" bullet.

- **Tightly coupled to `NewsType`.** Direct field access throughout (`news.title`, `.excerpt`, `.author`, `.date`, `.category`, `.image`, `.featured`, `.views`). For pro-ui generality the layout is **generic over an item type** — `<MagazineGrid<T>>` with field accessors OR (simpler) a `renderItem(item, slot) => ReactNode` callback where `slot` is `'featured' | 'large' | 'medium' | 'list'` and the consumer decides the rendering.
- **Imports `NewsCard` directly.** Must become a `cardComponent` slot or `renderItem` callback. Grid stays card-agnostic — uses `content-card-news-01` only in the demo.
- **All Turkish strings hardcoded** — search placeholder, date-filter button, clear-date label, results count, empty title + body, end-of-list, sidebar headers, newsletter CTA + body + input + button. All become a `labels` object prop with English defaults.
- **`categories` and `generateMockNews` imported from `@/data/newsData`.** Categories array → prop. Items array → prop. Fixture lives in `dummy-data.ts` (registry convention) as the demo source only.
- **Filter / search / sort / pagination logic is baked into the layout** — this is the biggest architectural call. Three options:
  - **Option A (dumb layout):** layout accepts `displayedItems`, `featured`, `hasMore`, `isLoading`, `onLoadMore`, `searchQuery`, `onSearchChange`, etc. Filtering happens entirely outside. Simple, max flexibility, but a lot of plumbing for the simple case.
  - **Option B (controlled-or-uncontrolled):** uncontrolled mode runs the source's internal filtering; controlled mode lets the consumer drive everything. Mirrors `properties-form` posture.
  - **Option C (recommended):** layout is dumb (Option A) PLUS a companion hook `useMagazineFilter({ items, search, categories, dateRange, pageSize })` that gives the simple consumer one-line ergonomics, while sophisticated consumers replace the hook with server-driven pagination, URL-synced filters, etc. **Best ergonomics + max flexibility.**
- **Sidebar contents are hardcoded** (Popular News list, Categories cloud, Newsletter CTA). These don't belong in the layout primitive — should be a single `sidebar?: ReactNode` slot OR named slots (`renderSidebarPopular`, `renderSidebarCategories`, `renderSidebarNewsletter`). Demo can render the trio; the layout shouldn't.
- **`setTimeout(... 500)` simulates loading.** Loading is a prop, not faked. Demo can fake it for the "load more" effect; component accepts `isLoading: boolean`.
- **No virtualization.** At 1000+ items the main column re-renders all visible cards on every search keystroke. Should support `virtualize: 'auto'` (matches rich-card pattern) — auto-enables for the medium-card 3-up grid at, say, 100+ items.
- **Search has no debounce.** Every keystroke triggers a re-filter of `allNews`. With `useDeferredValue` (React 19) this becomes free — schedules at low priority. Matches the markdown-editor pattern.
- **No URL-state sync.** Filters/page/search live in component memory. With dumb-layout + companion hook (Option C), consumers can wire URL state in their own setup. Acceptable.
- **`featured` flag picked from item shape** (`displayedNews.find(n => n.featured)`). Should be either a `getFeatured(item) => boolean` predicate prop OR a `featuredItem?: T` prop.
- **No keyboard navigation** for the category chip row — currently buttons in a div. Should be a roving-tabindex group OR a true `tablist` ARIA pattern.
- **Sidebar "Popüler" sort** is `(b.views || 0) - (a.views || 0)` — assumes a `views` field. With sidebar-as-slot this becomes moot.
- **Newsletter CTA does nothing** — form has no `onSubmit`. Demo bug; sidebar-slot rewrite makes this moot.
- **Hardcoded `ITEMS_PER_PAGE = 6`.** Should be a `pageSize` prop with sensible default.
- **No accessibility on the IntersectionObserver loader** — the loader appears, fires `loadMore`, and the new content arrives, but a screen reader gets no announcement. Consider an `aria-live="polite"` region for "X new items loaded".

## Constraints / non-goals [TO CONFIRM]

> Drafted minimally; please add or strike.

- **Independent of `content-card-news-01`.** Grid does NOT import the card. Grid takes `renderItem(item, slot)`. Demo composes both as a usage example.
- **Generic over item type.** Not coupled to `NewsType` or any other domain shape.
- **Stay framework-agnostic.** No `next/*`, no app contexts.
- **Sidebar contents are slot-based, not built-in.** The Popüler / Kategoriler / Newsletter trio is consumer composition, not part of the primitive. Demo renders the trio.
- **Filter/search/sort/pagination logic moves out of the layout** — recommended Option C: dumb layout + companion `useMagazineFilter` hook.
- **Magazine layout shape preserved** — featured + main+sidebar 8/4 + tower-of-cards in main + sticky sidebar.
- **Card-agnostic primitive** — paired with `content-card-news-01` in the demo only.

## Screenshots / links

<!-- Paste rendered screenshots here. Most useful:
     • Full magazine page with hero + featured + main grid + sidebar visible (the "tower" structure)
     • Sticky sidebar at mid-scroll (showing it staying in place)
     • Category chip row + active-state styling
     • Date-range Popover open with calendar
     • Empty state
     • Loading dots + end-of-list message
     The shape is clear from the code, but real screenshots catch density / spacing / visual weight that the code alone doesn't show. -->
