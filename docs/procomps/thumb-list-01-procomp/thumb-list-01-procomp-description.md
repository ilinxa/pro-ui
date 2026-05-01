# thumb-list-01 — procomp description

> Stage 1: what & why.
>
> **Migration origin:** [`docs/migrations/thumb-list-01/`](../../migrations/thumb-list-01/) (kasder `kas-social-front-v0` news detail page sidebar — `src/app/(platform)/news/[id]/page.tsx` lines 208–234)
>
> Cousin migration: [`author-card-01`](../../migrations/author-card-01/) — sibling extraction from the same sidebar.

## Problem

A linked thumbnail-list block — small image + title + meta line per row — is one of the most-replicated patterns in CMS / blog / media UIs. Built ad-hoc per project: hardcoded copy, baked-in `next/link`, no shared empty-state, no shared a11y baseline. The kasder source uses it for the "Related News" sidebar; the same pattern shows up everywhere lists need to be visually rich without taking horizontal space.

## In scope

- **Header** — optional Lucide icon + title (`text-lg font-serif font-bold` rhythm), same as siblings.
- **Vertical stack of items** — fixed-aspect thumbnail (`w-20 h-16`) on the left, title (clamped to 2 lines) + meta line stacked on the right.
- **Frame toggle** — `framed: true` (default — card-style) vs `framed: false` (borderless inline).
- **Polymorphic item link** — `linkComponent` slot defaults to `<a>`; per-item `href`.
- **Render-meta slot** — default renders `item.meta` as a string; consumers override via `renderMeta(item)` for dates, view counts, badges.
- **Empty state** — default fallback message via `labels.emptyText`; `emptyState?: ReactNode` for full custom UI.
- **i18n** — `labels` for chrome strings; English defaults.
- **Heading-level config** — `h2` / `h3` / `h4` (default `h3`).
- **Class overrides** — root, header, item, image, title, meta.
- **a11y** — `<ul>` / `<li>` semantics; per-item single link target with auto-composed accessible name; decorative header icon `aria-hidden`; lazy thumbnails; `focus-visible` parity with `:hover`.

## Out of scope

- **Pagination / infinite-scroll** — small lists only. If the consumer needs more, they reach for `grid-layout-news-01` or future `data/list-XX`.
- **Selection / multi-select** — read-only list, links only.
- **Per-item action menus** — single link target per row.
- **Drag-reorder** — read-only.
- **Virtualization** — small-list assumption (rough cap: 20 items; consumer slices).
- **Image-error fallback in v0.1** — broken `src` shows browser default; YAGNI.

## Target consumers

- Related / popular / recent posts in blog/CMS sidebars
- Top results in a search-suggestions dropdown
- Playlist queue / "up next" lists in media apps
- File-picker recent-files list
- "More from this author" rail
- Saved-items mini-list in a profile sidebar

## Rough API sketch

```tsx
<ThumbList01
  items={[
    { id: "1", title: "Sustainable cities, then and now", imageSrc: "/r/1.jpg", meta: "5 min read", href: "/news/1" },
    { id: "2", title: "Local mobility on the rise", imageSrc: "/r/2.jpg", meta: "3 min read", href: "/news/2" },
  ]}
  labels={{ heading: "Related" }}
/>
```

Most-used props: `items`, `labels`, `linkComponent`, `framed`, `renderMeta`. Rest are escape hatches.

## Example usages

**1. News article sidebar** (the kasder source pattern):
```tsx
import { BookOpen } from "lucide-react";
import Link from "next/link";

<ThumbList01
  items={relatedNews}
  headerIcon={BookOpen}
  labels={{ heading: "İlgili Haberler" }}
  linkComponent={Link}
/>
```

**2. Search-suggestions dropdown** — no frame, no header, custom meta render:
```tsx
<ThumbList01
  items={searchHits}
  framed={false}
  headerIcon={null}
  labels={{ heading: "Top results" }}
  renderMeta={(item) => (
    <span className="text-xs text-muted-foreground">
      {item.meta} · {item.score}% match
    </span>
  )}
/>
```

**3. "More from author" rail** — date instead of read-time, custom heading:
```tsx
<ThumbList01
  items={postsByAuthor}
  labels={{ heading: "More from Maya" }}
  renderMeta={(item) => (
    <time className="text-xs text-muted-foreground" dateTime={item.publishedAt}>
      {formatRelative(item.publishedAt)}
    </time>
  )}
/>
```

**4. Empty state** — custom message:
```tsx
<ThumbList01
  items={[]}
  labels={{
    heading: "Recently viewed",
    emptyText: "Nothing here yet — articles you read will show up here.",
  }}
/>
```

## Success criteria

1. **Visual fidelity to kasder source** — when rendered with kasder-equivalent props, the framed list matches the source within 1–2px and identical color tokens.
2. **Sibling-rhythm match** — header typography, card chrome, spacing rhythm matches `author-card-01` / `newsletter-card-01` / `category-cloud-01` / `filter-bar-01` so the family composes.
3. **Generic shape works** — fixed `ThumbListItem` shape (`{ id, title, imageSrc, imageAlt?, meta?, href? }`) covers the realistic 80% case; `renderMeta` slot covers the long tail.
4. **Polymorphic-root works** — verified with native `<a>` (default); compatible with `next/link` / RemixLink consumer-side.
5. **Empty state covers both modes** — `emptyState` ReactNode wins if provided; otherwise `labels.emptyText` renders.
6. **Frame-toggle works** — `framed: false` produces a clean borderless list usable inline.
7. **a11y** — `<ul>` / `<li>` semantics; per-item link with title-composed accessible name; `focus-visible:text-primary` parity with hover; decorative header icon `aria-hidden`.
8. **i18n** — all visible chrome strings ride through `labels`; English defaults.
9. **Bundle envelope** — ≤ 5KB component code.
10. **Memoization** — exported as `React.memo`.
11. **Demo coverage** — 5 sub-tabs (default / no-frame / custom render-meta / empty state / Turkish content + custom icon).
12. **Verification** — `pnpm tsc --noEmit` + `pnpm lint` + `pnpm build` clean; SSR `HTTP 200` for `/components/thumb-list-01` with all demo tabs rendered.

## Open questions

1. **Default thumbnail aspect** — `w-20 h-16` (5:4 landscape, kasder source). Confirmed in source-notes; consumer can override via `imageClassName` for square or other ratios.
2. **Default header icon** — `BookOpen` matches the kasder "Related News" semantics. Generic enough for blog/news/article contexts; consumers swap for `Music`, `Film`, `History`, etc. via `headerIcon`. Pass `null` to omit.
3. **No `getKey` accessor** — `items` requires `id: string` directly. Simpler than a generic accessor; covers 100% of realistic cases.
4. **No image-error placeholder in v0.1** — broken `src` shows browser default. v0.2 candidate: `imagePlaceholder?: ReactNode`.

## Why not...

- **Generic `<ThumbList<T>>` with accessor functions?** — The fixed-shape `ThumbListItem` covers the realistic 80% with less prop ceremony. Consumers with custom shapes do `items.map(toThumbListItem)` upstream. Consistent with `author-card-01` flat-prop API.
- **shadcn `Card` wrapper around the framed variant?** — kasder visual is `bg-card rounded-2xl p-6 border border-border/50`; shadcn `Card` is `rounded-xl border` with different padding semantics. Match the kasder visual exactly via raw classes; same approach as `author-card-01` / `newsletter-card-01`.
- **Compound component pattern (`<ThumbList.Header>` etc.)?** — Overkill. Flat-prop API mirrors the family.
- **Combine with `data-table`?** — Different pattern. `data-table` is column-driven and selection-aware; `thumb-list-01` is row-as-link, image-forward. Different use cases.
