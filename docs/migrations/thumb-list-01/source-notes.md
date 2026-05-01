# thumb-list-01 — migration source notes

> Intake doc for [`docs/migrations/thumb-list-01/`](./). The user pointed at the kasder news detail-page sidebar; the assistant drafted this from that source + the user's brief comment ("could be a simple reusable component"). **Sections tagged `[TO CONFIRM]` are inferred and need user sign-off before the analysis pass.**
>
> **Family context:** sibling sub-extraction from the kasder news detail-page sidebar. Cousin migration: [`author-card-01`](../author-card-01/) extracts the "About the Author" block from the same sidebar. The third sidebar block (newsletter signup) was already shipped as [`newsletter-card-01`](../../../src/registry/components/marketing/newsletter-card-01/).
>
> **No `-news-` infix in the slug** — the pattern is universal (related lists, popular lists, recent lists, search results, playlist queues, file pickers). Same convention as `newsletter-card-01` / `category-cloud-01` / `filter-bar-01`.
>
> See [`docs/migrations/README.md`](../README.md) for the full pipeline.

## Source

- **App:** `kas-social-front-v0` (kasder)
- **Path in source:** `src/app/(platform)/news/[id]/page.tsx` lines 208–234 (Related News sidebar block)
- **Used in:** the news article detail page sidebar, sticky-positioned alongside the article body. One instance per page; renders 3–5 related articles.
- **Related code:**
  - [`original/news-detail-page.tsx`](./original/news-detail-page.tsx) — the full kasder source page; the Related News list lives in the `<aside>` between the Author Card and the Newsletter signup

## Role

A linked thumbnail-list block — header (icon + title) + a vertical stack of items, each item showing a small thumbnail image, a title, and a meta line (read-time / publish date / count / etc.), with the whole row acting as a link.

In the source: shows 3–5 "related news" entries below the article. In production this pattern shows up everywhere lists need to be visually rich without taking up much horizontal space:

- Related / popular / recent posts in blog/CMS sidebars
- Top results in a search-suggestions dropdown
- Playlist queue / "up next" lists in media apps
- File-picker recent-files list
- Comment-related-posts widget
- "More from this author" rail
- Saved-items mini-list in a profile sidebar

## What I like (preserve)

- **Card-framed surface** — `bg-card rounded-2xl p-6 border border-border/50`. Matches the sibling Author Card and the eventual `author-card-01`.
- **Header pattern** — `text-lg font-serif font-bold` heading with optional Lucide icon prefix (`BookOpen` in source) — same editorial rhythm as the rest of the family.
- **Two-column row layout per item** — `w-20 h-16` thumbnail on the left, title-and-meta stacked on the right, `gap-3` rhythm.
- **Hover affordance** — title shifts to `text-primary` on `group-hover`. Single-color shift, no underline; reads as interactive without being noisy.
- **Title clamp** — `line-clamp-2` keeps row heights uniform regardless of title length.
- **Meta line subordination** — `text-xs text-muted-foreground` clearly secondary to the title.
- **Vertical rhythm** — `space-y-4` between items reads as a clear list, not a wall of text.
- **No internal scroll / no pagination** — the list is small (3–5 items) and just renders; consumers cap the input array.

## What bothers me (rewrite)

- Hardcoded heading text (`"İlgili Haberler"`) — must be a configurable label.
- Hardcoded icon (`BookOpen`) — must be a prop (default present, override available).
- `next/link` baked in — registry mandate forbids `next/*`. → polymorphic `linkComponent: ElementType` slot, default `<a>`.
- `relatedNews` shape baked in (`{ id, title, image, readTime }`) — must be generic over `T` with item-shape config: `idKey`, `titleKey`, `imageKey`, `metaKey` OR a `renderItem` slot.
- No way to render meta as anything other than a string — what if it's a Date or a number-of-views? → `renderMeta?: (item: T) => ReactNode` slot.
- No empty-state — if `items` is empty, the section silently renders an empty list. → optional `emptyState?: ReactNode` + sensible default.
- No header-only-when-items-exist option — the header always shows even when the list is empty. → consumer-driven.
- No image-fallback — broken `src` shows broken-image icon. → optional `imagePlaceholder?: ReactNode` (low priority; YAGNI for v0.1).
- No frame-toggle — kasder uses framed (card style) but other use cases want no frame (e.g. inline list). → `framed?: boolean` (default `true`).
- Heading level fixed to `<h3>` — same flex problem as author-card. → `headingAs?: "h2" | "h3" | "h4"`.
- Not memoized — re-renders on parent re-render. → `React.memo` wrap.

## Constraints / non-goals

- **Single list only** — never paginated, never infinite-scroll. (Consumer caps the array; if pagination is needed they reach for `grid-layout-news-01` or future `data/list-XX`.)
- **Never `next/*`** — polymorphic root, native `<img>`.
- **No selection / multi-select** — read-only list, links only. Selection-aware lists belong to a separate component.
- **No item actions / overflow menus** — each item is a single link target, period. Composed UIs that need actions per item belong elsewhere.
- **No drag-reorder** — read-only.
- **No virtualization** — small lists only (rough cap: 20 items; consumers slice).

## Screenshots / links

- Source: kasder dev env, news detail page sidebar.
- Equivalent in production: any blog "Related posts" sidebar, Substack/Medium "More from author" rail, YouTube "Up next" list.
