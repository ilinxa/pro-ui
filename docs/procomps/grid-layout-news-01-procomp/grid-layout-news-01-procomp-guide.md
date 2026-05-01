# grid-layout-news-01 — procomp guide

> Stage 3.

## When to use

- News landing pages, blog archives, doc indexes, content hubs.
- E-commerce category pages with infinite scroll.
- Any list-driven UI where you want a magazine-style "lead + grid + sidebar" hierarchy with infinite scroll.

## When NOT to use

- **Strict tabular data** — use `data-table`.
- **Tree-structured content** — use `rich-card`.
- **Single-column linear feed** (Twitter-style) — overkill; just map your items.
- **Server-rendered, no client interaction** — the layout uses IntersectionObserver and `useState` for paging; works in RSC trees as a client island, but if you have zero interactivity needs the layout is overkill.

## Composition patterns

### Full magazine page (the canonical use case)

```tsx
import { GridLayoutNews01, useMagazineFilter } from "@/registry/components/layout/grid-layout-news-01";
import { ContentCardNews01 } from "@/registry/components/data/content-card-news-01";
import { FilterBar01 } from "@/registry/components/forms/filter-bar-01";
import { CategoryCloud01 } from "@/registry/components/forms/category-cloud-01";
import { NewsletterCard01 } from "@/registry/components/marketing/newsletter-card-01";
import { PageHeroNews01 } from "@/registry/components/marketing/page-hero-news-01";

const filtered = useMagazineFilter<Article>({
  items: articles,
  pageSize: 6,
  isFeatured: (a) => a.featured,
  filterPredicate: (a) =>
    a.title.toLowerCase().includes(search.toLowerCase()) &&
    (cat ? a.category === cat : true),
  sortComparator: (a, b) => +new Date(b.date) - +new Date(a.date),
});

<GridLayoutNews01<Article>
  hero={<PageHeroNews01 badge="News" title="Latest" description="..." />}
  filterBar={
    <FilterBar01
      categories={categoriesArr}
      search={search}
      onSearchChange={setSearch}
      category={cat}
      onCategoryChange={setCat}
      resultsCount={filtered.filteredCount}
    />
  }
  sidebar={
    <>
      <CategoryCloud01
        items={categoriesArr.map(c => ({ value: c, label: c }))}
        value={cat}
        onChange={setCat}
        title="Categories"
      />
      <NewsletterCard01 onSubmit={subscribe} />
    </>
  }
  displayedItems={filtered.displayedItems}
  featuredItem={filtered.featuredItem}
  hasMore={filtered.hasMore}
  isLoading={filtered.isLoading}
  onLoadMore={filtered.loadMore}
  renderItem={(article, slot) => (
    <ContentCardNews01
      item={article}
      variant={slot}
      href={`/news/${article.id}`}
    />
  )}
/>
```

### Bare layout (no slots)

```tsx
<GridLayoutNews01
  displayedItems={items}
  renderItem={(item, slot) => <Card item={item} variant={slot} />}
/>
```

Main column expands to `col-span-12` when no sidebar; no hero/filter bar above.

### Server-driven pagination (skip the hook)

```tsx
const { data, fetchNextPage, hasNextPage, isFetching } = useInfiniteQuery(...);
const items = data?.pages.flatMap(p => p.items) ?? [];

<GridLayoutNews01
  displayedItems={items}
  hasMore={!!hasNextPage}
  isLoading={isFetching}
  onLoadMore={() => fetchNextPage()}
  renderItem={(item, slot) => <Card item={item} variant={slot} />}
/>
```

## Gotchas

### `featuredItem` only shows on page 1

`useMagazineFilter` returns `featuredItem` only when `page === 1`. As the user scrolls and loads more pages, the featured card disappears (matches the source's behavior). If you drive props directly without the hook, you control this manually — only pass `featuredItem` on page 1.

### Tower structure assumes ≥ 3 items

The tower renders: 1 large (item 0) + 2-up medium (items 1-2) + 3-up medium (items 3+). If you have fewer than 3 items, the layout adapts but visually unbalanced. Use the `bare` layout pattern for very small lists.

### `renderItem` slot is `large | medium`

Always one of those two. The layout never asks for `featured` / `small` / `list` slots — those are content-card-news-01 specifics. If your card maps differently, use a switch in `renderItem`:

```tsx
renderItem={(item, slot) => (
  <Card variant={slot === "large" ? "hero" : "tile"} item={item} />
)}
```

### `useMagazineFilter` reset semantics

The hook resets to page 1 when `items`, `filterPredicate`, or `sortComparator` references change. So passing inline arrows (`filterPredicate: (a) => ...`) creates new references every render = always-on-page-1. Memoize:

```tsx
const filterPredicate = useCallback(
  (a: Article) => a.title.includes(search),
  [search],
);
```

### Sticky sidebar offset

Sidebar uses `sticky top-24` (96px from top). If your page has a sticky header with different height, override via `sidebarClassName`:

```tsx
<GridLayoutNews01 sidebarClassName="sticky top-16" ... />
```

Wait — the inner `<div>` inside `<aside>` is what's sticky. To override, you'd need to reach into the layout. For now: ensure your page header is < 96px tall, OR open a v0.2 issue to expose `stickyOffset` as a prop.

### IntersectionObserver fires once per intersection

The observer fires `onLoadMore` whenever the sentinel enters the viewport. `useMagazineFilter` guards re-entry via `isLoading`. If you drive props directly, ensure your `onLoadMore` is similarly guarded (don't double-fetch).

## Migration notes

Supersedes the kasder `kas-social-front-v0` `NewsMagazineGrid.tsx` (~320-line component). The migration:

- **Preserved:** magazine layout shape (1 large → 2-up → 3-up), 8/4 main+sidebar grid, sticky sidebar, featured-on-page-1 semantics, IntersectionObserver loader, "all shown" terminal message, bouncing-3-dots loader animation.
- **Rewrote:** tightly coupled to `NewsType` → generic over `T`; imports `NewsCard` directly → `renderItem` callback; filter / search / sort / pagination logic baked in → companion `useMagazineFilter` hook (in-memory) with simulatedLoadingMs option; sidebar contents hardcoded → `sidebar` slot; header filter section hardcoded → `filterBar` slot; hero hardcoded inline → `hero` slot; Turkish strings → `labels` prop with English defaults.
- **Added:** `<aside>` semantic landmark; `aria-live="polite"` on loader + end-of-list; empty state slot; `renderFeatured` for distinct featured rendering; `mainClassName` / `sidebarClassName` overrides.

The original's filter logic (search debounce / category chips / date range) moved entirely into `filter-bar-01`. The sidebar contents (popular news / categories / newsletter) became `category-cloud-01` + `newsletter-card-01` — slot composables. The result: layout is ~120 lines + a 60-line filter hook, vs. the source's ~320-line monolith.

Originals at [`docs/migrations/grid-layout-news-01/original/`](../../migrations/grid-layout-news-01/original/).

## Open follow-ups

- v0.2: virtualization for the medium-card grid (auto-enable at 500+ items).
- v0.2: `stickyOffset` prop for the sidebar (currently hardcoded `top-24`).
- v0.2: alternate tower shapes (e.g., 2-large side-by-side, no large + uniform grid).
- v0.2: scroll restoration on browser back-nav.
- v0.3: URL-state sync helper hook (separate from `useMagazineFilter` to keep the simple case simple).
