# grid-layout-news-01 — procomp description

> Stage 1.
>
> **Migration origin:** [`docs/migrations/grid-layout-news-01/`](../../migrations/grid-layout-news-01/) — kasder `NewsMagazineGrid.tsx`. The layout assembly for the news-domain family.

## Problem

Magazine-style content sites need a layout that orchestrates: optional hero band, optional filter section, main column with descending-density card tower (1 large → 2-up → 3-up grid), optional sticky sidebar, and infinite scroll. Built ad-hoc per project = visual drift + repeated state machinery + accessibility gaps.

## In scope

- **Generic over item type** — `<MagazineGridLayout<T>>` with `renderItem(item, slot)` callback.
- **4 named slots** — `hero` / `filterBar` / `sidebar` / `renderItem`. Each optional except `renderItem`.
- **Magazine-tower main column** — 1 large card + 2-up medium row + N-up medium grid.
- **Featured-only-on-page-1** — `featuredItem` prop renders separately from the rest.
- **Infinite scroll** — `hasMore` + `isLoading` + `onLoadMore` props; IntersectionObserver-driven.
- **Companion `useMagazineFilter` hook** — for the simple consumer who wants filter+page state for free.
- **i18n** — `labels` for loader / end-of-list / empty state.

## Out of scope

- URL-state sync (consumer's job).
- Virtualization (v0.2).
- Server-side filtering (consumer hooks into `useMagazineFilter` or replaces it).
- Custom magazine-shape variants beyond 1-large + 2-up + N-up (v0.2).
- Drag-reorder of items.
- Multi-column main (always 8/4 split when sidebar present).

## Target consumers

- News landing pages (the kasder use case).
- Blog archives, doc indexes, content hubs, e-commerce category pages.

## Rough API sketch

```tsx
const { displayedItems, featuredItem, hasMore, isLoading, loadMore, ... } =
  useMagazineFilter({ items, filters, pageSize: 6 });

<GridLayoutNews01<NewsItem>
  hero={<PageHeroNews01 ... />}
  filterBar={<FilterBar01 ... />}
  sidebar={<>
    <CategoryCloud01 ... />
    <NewsletterCard01 ... />
  </>}
  displayedItems={displayedItems}
  featuredItem={featuredItem}
  hasMore={hasMore}
  isLoading={isLoading}
  onLoadMore={loadMore}
  renderItem={(item, slot) => (
    <ContentCardNews01 item={item} variant={slot} ... />
  )}
/>
```

## Example usages

**1. Full magazine page (5-component composition):** see API sketch above.

**2. Bare layout (no hero / no sidebar):**
```tsx
<GridLayoutNews01
  displayedItems={items}
  hasMore={false}
  isLoading={false}
  renderItem={(item, slot) => <Card item={item} variant={slot} />}
/>
```

## Success criteria

- Generic typing flows through correctly (`<MagazineGridLayout<T>>` narrows `renderItem`'s `item` to `T`).
- Tower renders correctly: featured (page 1) → 1 large → 2-up medium → N-up medium grid.
- Sticky sidebar stays in place during scroll.
- IntersectionObserver triggers `onLoadMore` near end of list.
- Loader announces via `aria-live`.
- TypeScript: types strict; slots' types are `ReactNode`; `renderItem` is generic.
- tsc / lint / build clean.
- SSR returns 200 with all 3 demo tabs.
