# thumb-list-01 — migration analysis

> Extraction pass for [`docs/migrations/thumb-list-01/`](./). Filled by the assistant after reading [`original/news-detail-page.tsx`](./original/news-detail-page.tsx) and [`source-notes.md`](./source-notes.md). Reviewed and signed off by user before the procomp gate begins.
>
> Pipeline: [`docs/migrations/README.md`](../README.md).

## Design DNA to PRESERVE

1. **Card-framed surface (default)** — `rounded-2xl p-6 border border-border/50` on `bg-card`. Visually matches the sibling `author-card-01` + `newsletter-card-01`.
2. **Editorial header rhythm** — `text-lg font-serif font-bold` heading with optional Lucide icon prefix (`BookOpen` default). Pro-ui consistency.
3. **Per-item two-column layout** — fixed thumbnail on the left (`w-20 h-16` ≈ 80×64px), `gap-3`, title + meta column on the right.
4. **Title hover-shift** — `text-foreground group-hover:text-primary transition-colors` — single-color shift, no underline. Reads as interactive without being noisy.
5. **Title clamp** — `line-clamp-2`. Uniform row heights. Critical for sidebar rhythm.
6. **Meta subordination** — `text-xs text-muted-foreground mt-1`. Clearly secondary.
7. **Vertical rhythm** — `space-y-4` between items.
8. **Image shape** — `rounded-lg object-cover shrink-0` on the thumbnail.

## Structural debt to REWRITE

1. **Inline JSX with no boundaries** — block lives directly in `page.tsx`. Rewrite as sealed-folder pro-comp.
2. **Hardcoded heading + icon** (`"İlgili Haberler"` + `BookOpen`) — must be props with English defaults.
3. **`next/link` baked in** — registry mandate forbids `next/*`. → polymorphic `linkComponent?: ElementType` (default `"a"`); `href` derived per-item.
4. **`relatedNews` shape baked in** (`{ id, title, image, readTime }`) — must be generic. Two patterns possible:
   - **(A)** `items: ThumbListItem[]` with a fixed shape (`{ id, title, imageSrc, imageAlt?, meta?, href }`) — simpler, slightly less flexible.
   - **(B)** Generic `<ThumbList<T>>` with `getId`, `getTitle`, `getImageSrc`, `getMeta`, `getHref` accessors.
   - **Recommended:** (A) for v0.1 with optional `renderMeta?: (item) => ReactNode` slot for richer meta. (B) is over-engineering for the realistic use cases. If a consumer needs (B) they reach for `data-table` or `grid-layout-news-01`.
5. **Heading level fixed to `<h3>`** — → `headingAs?: "h2" | "h3" | "h4"` (default `h3`).
6. **No empty-state handling** — silent empty list. → `emptyState?: ReactNode` slot OR fallback message via `labels.emptyText`.
7. **Frame fixed on** — kasder always wraps in card chrome. → `framed?: boolean` (default `true`); `framed: false` gives borderless inline list.
8. **Not memoized** — `React.memo` wrap.
9. **No image lazy-loading** — add `loading="lazy"` to the thumbnail.
10. **No image-error fallback** — broken `src` shows browser default broken-image icon. **Decision:** YAGNI for v0.1. Consumer ensures URLs are valid; if needed, expose `imagePlaceholder?: ReactNode` later.

## Dependency audit

| Dep | Source uses | Plan |
|---|---|---|
| `react` | yes | yes — declared root |
| `lucide-react` | `BookOpen` icon | yes — declared dep, `BookOpen` as default header icon |
| `@/components/ui/*` | none in this block | not needed |
| `@/lib/utils` (`cn`) | no | yes — class merging |
| `next/link` | yes (the link wrapper) | **rewrite** — polymorphic root |

No new shadcn primitives. Same dep footprint as `author-card-01`.

## Dynamism gaps

1. Heading text → `labels.heading?` (default: `"Related"`).
2. Header icon → `headerIcon?: ComponentType<{ className?: string }>` (default `BookOpen`); pass `null` to hide.
3. `items: ThumbListItem[]` — required.
4. `linkComponent?: ElementType` — default `"a"`.
5. `renderMeta?: (item: ThumbListItem) => ReactNode` — optional override; default renders `item.meta` as `<p>`.
6. `framed?: boolean` — default `true`.
7. `headingAs?: "h2" | "h3" | "h4"` — default `h3`.
8. `emptyState?: ReactNode` — optional; default fallback uses `labels.emptyText`.
9. `labels?: { heading?: string; emptyText?: string }` — defaults `{ heading: "Related", emptyText: "Nothing yet." }`.
10. `className?` (root), `headerClassName?`, `itemClassName?`, `titleClassName?`, `metaClassName?`.
11. `imageClassName?` — for consumers who want a different aspect ratio (e.g. square thumbnails). The `w-20 h-16` default ships as-is via `imageClassName` override.

## Optimization gaps

1. **Memoization** — wrap default export in `React.memo`. Pure for given props.
2. **Stable handlers** — none in v0.1 (no event callbacks at the list level).
3. **Lazy-load thumbnails** — `loading="lazy"` on each `<img>`.
4. **No virtualization** — small-list assumption. If a consumer hits 100+ items they're using the wrong component.
5. **SSR-safe** — entirely server-renderable.

## Accessibility gaps

1. **Each item is a single link target** — accessible name composed by reading the title text inside the link. Standard.
2. **Image alt** — required per item via `imageAlt?` with fallback to `title` (matches `content-card-news-01` pattern).
3. **`role="list"` not needed** — the rendered structure is `<ul>` / `<li>` (rewrite from kasder's `<div>` map; gives free list semantics).
4. **Empty state** — when rendered, `aria-live="polite"` on the empty message so screen-reader users get the update if the list updates dynamically.
5. **Header icon** — `aria-hidden="true"` (decorative; the heading text carries meaning).
6. **Hover-only affordance** — color shift is fine; pair with `focus-visible:text-primary` so keyboard nav has the same affordance.

## Proposed procomp scope

**Slug:** `thumb-list-01`
**Category:** `data` (matches `content-card-news-01` — content-data display).
**Status:** alpha 0.1.0.

**Files (~8):**
- `thumb-list-01.tsx` — root
- `parts/thumb-row.tsx` — single item (image + title + meta + link wrap)
- `parts/empty-state.tsx` — default empty fallback
- `types.ts` — `ThumbListItem` + props
- `dummy-data.ts` — 5 sample items (varying meta types: read-time / date / view-count)
- `demo.tsx` — 5 sub-tabs (default / no-frame / custom render-meta / empty state / custom labels + icon)
- `usage.tsx`, `meta.ts`, `index.ts` — standard

**Public API draft:**

```ts
export interface ThumbListItem {
  id: string;
  title: string;
  imageSrc: string;
  imageAlt?: string;
  meta?: string;
  href?: string;
}

export interface ThumbList01Props {
  items: ReadonlyArray<ThumbListItem>;
  framed?: boolean;                                            // default true
  headingAs?: "h2" | "h3" | "h4";                              // default "h3"
  headerIcon?: ComponentType<{ className?: string }> | null;   // null = hide
  linkComponent?: ElementType;                                 // default "a"
  renderMeta?: (item: ThumbListItem) => ReactNode;
  emptyState?: ReactNode;
  labels?: { heading?: string; emptyText?: string };
  className?: string;
  headerClassName?: string;
  itemClassName?: string;
  imageClassName?: string;
  titleClassName?: string;
  metaClassName?: string;
}
```

**Bundle envelope:** ≤ 5KB component code.

## Recommendation

**Ship as a standalone pro-component.** Same fit-and-finish as the cousin `author-card-01`. Universal pattern with broad reuse beyond news. Migration is low-effort (one inline block → 8-file sealed folder), payoff is high (this pattern shows up in every CMS, every blog, every media-app sidebar).

**Open call before procomp gate:** the fixed thumbnail aspect ratio is `w-20 h-16` (5:4-ish landscape). Confirm — or override default to square (`w-16 h-16`) if that reads more universal. Consumer can always override via `imageClassName`.
