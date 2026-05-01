# grid-layout-news-01 — migration analysis

> Extraction pass for [`docs/migrations/grid-layout-news-01/`](./).
>
> **Family context:** the layout assembly for the news-domain family. Composes content-card-news-01, filter-bar-01, category-cloud-01, newsletter-card-01 in the demo via slots — the layout itself imports none of them at runtime (sealed-folder convention).

## Design DNA to PRESERVE

- **Magazine layout shape** — featured-hero band + 8/4 main+sidebar grid + main's "tower" of cards (1 large → 2-up → 3-up).
- **Sticky-scrolling sidebar** (`sticky top-24`).
- **Featured-only-on-page-1** semantics.
- **Bouncing-3-dots loader** + "all shown" terminal message.
- **IntersectionObserver-driven infinite scroll**.

## Structural debt to REWRITE

| # | Source | Resolution |
|---|---|---|
| 1 | Tightly coupled to `NewsType` | Generic over `T`: `<MagazineGridLayout<T>>`. |
| 2 | Imports `NewsCard` directly | Replaced by `renderItem(item, slot)` callback prop. |
| 3 | All Turkish strings | `labels` prop + English defaults. |
| 4 | Filter / search / sort / pagination logic baked in | **Layout becomes dumb**: accepts `displayedItems`, `featuredItem`, `hasMore`, `isLoading`, `onLoadMore`. Companion hook `useMagazineFilter` provides one-line filter setup for simple consumers. |
| 5 | Sidebar contents hardcoded | `sidebar?: ReactNode` slot. |
| 6 | Header/filter section hardcoded | `filterBar?: ReactNode` slot. |
| 7 | Hero band hardcoded inline | `hero?: ReactNode` slot. |
| 8 | `setTimeout(... 500)` simulating loading | `isLoading: boolean` prop. |
| 9 | Hardcoded `ITEMS_PER_PAGE = 6` | Lives in the companion hook. |
| 10 | `featured` flag picked from item shape | `featuredItem?: T` prop OR `getFeatured?` callback in the hook. |
| 11 | No virtualization | Document as v0.2 candidate. |
| 12 | No URL-state sync | Consumer's job. |
| 13 | No `aria-live` on the loader | Add to the loader part. |

## Dependency audit

- **Keep:** `react`, `@/lib/utils`.
- **Drop:** N/A.
- **Add:** none.

## Dynamism gaps

Generic over `T`. Slots: `hero` / `filterBar` / `sidebar` / `renderItem(item, slot)`. State: `displayedItems` / `featuredItem` / `hasMore` / `isLoading` / `onLoadMore`. Labels + className overrides per region.

## Optimization gaps

`React.memo` + IntersectionObserver hook. Virtualization deferred.

## Accessibility gaps

`aria-live="polite"` on loader + end-of-list. `<aside>` for sidebar. WCAG 2.1 AA.

## Proposed procomp scope

```
src/registry/components/layout/grid-layout-news-01/
├── grid-layout-news-01.tsx         # root composer
├── parts/
│   ├── magazine-tower.tsx          # main column's 1-large + 2-up + 3-up grid
│   └── infinite-loader.tsx         # IntersectionObserver loader region
├── hooks/
│   ├── use-infinite-scroll.ts
│   └── use-magazine-filter.ts      # companion filter+page hook
├── types.ts
├── dummy-data.ts
├── demo.tsx                        # composes all 5 sibling components
├── usage.tsx
├── meta.ts
└── index.ts
```

**File count:** 11. **Category:** `layout`.

### Demo plan

3 tabs:
1. **Slot-based composition** — wires page-hero-news-01 + filter-bar-01 + content-card-news-01 + category-cloud-01 + newsletter-card-01 via slots; uses `useMagazineFilter`.
2. **Bare layout** — no hero/filter/sidebar; just renderItem.
3. **Empty state** — `displayedItems={[]}` with empty fallback.

## Recommendation

**PROCEED.** Slot-based layout keeps the registry sealed-folder convention intact. Companion hook provides the simple-consumer path. Composing-via-demo proves the family integrates.

**Sign-off recorded 2026-05-02.** Proceeding to procomp gate.
