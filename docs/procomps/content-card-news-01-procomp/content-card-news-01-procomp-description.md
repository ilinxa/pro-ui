# content-card-news-01 — procomp description

> Stage 1: what & why. The "should we build this at all?" doc.
>
> **Migration origin:** [`docs/migrations/content-card-news-01/`](../../migrations/content-card-news-01/) (kasder `kas-social-front-v0` `NewsCard.tsx`)
>
> Family: 4-component news-domain set (`content-card-news-01`, `page-hero-news-01`, `grid-layout-news-01`, `detail-page-news-01`-deferred). All four totally independent, fully compatible, dynamic.

## Problem

Magazine-style news / content sites need **multiple visual treatments of the same item** in the same layout — a featured hero card on top, a 2-col horizontal "large" article below it, a grid of vertical "medium" cards in the main column, a list of compact "small" thumbnails in a sidebar, and a dense "list" row for popular-news lists. Currently each of these is built ad-hoc per project: 5 components, 5 maintenance burdens, 5 chances for visual drift, plus the magazine layouts that compose them.

Pro-ui has no existing answer here. `rich-card` is a tree editor; `data-table` is tabular; force-graph is graph viz. None render an article preview with image + title + excerpt + meta in 5 calibrated densities driven by a single prop.

## In scope

- **5 visual variants** dispatched via a single `variant` prop — `featured` / `large` / `medium` / `small` / `list`.
- **Dynamic content** — every consumer-visible string, color, format, behavior is overridable via prop / slot / callback.
- **Polymorphic root** — works with plain `<a>`, Next.js `Link`, Remix `Link`, react-router `Link`, or no link at all (read-only preview).
- **Overlay-link pattern from day 1** — clickable whole-card surface that doesn't lock out nested interactive children (bookmark, share, follow-author buttons).
- **Optional `actions` slot** for those nested interactives.
- **Content-shape soft-failure** — only `id` + `title` + `image` are required; all other fields (`excerpt`, `category`, `author`, `date`, `readTime`, `views`) optional and gracefully omitted.
- **Editorial typography** via a new pro-ui `--font-serif` CSS variable (default Playfair Display; consumer-overridable at any DOM scope).
- **WCAG 2.1 AA** target — focus-visible ring across full card, decorative icons aria-hidden, view-count labeled, reduced-motion respected.

## Out of scope

- **Layout orchestration** — composing cards into magazine grids, infinite scroll, search/filter UIs. That's `grid-layout-news-01`.
- **Article body rendering** — full article view with markdown / prose / sidebar / share. That's `detail-page-news-01` (deferred).
- **Media variants** beyond a single image (no carousels, no video, no gallery).
- **Bookmarking / save / follow author / share UI** — these are nested interactives the consumer composes via the `actions` slot; the card just provides space.
- **Server fetching, suspense, loading skeletons** — pure presentation. Consumers handle data loading.
- **Heavy animation** — Tailwind transitions + `motion-safe:` only. No framer-motion.
- **CDN-aware image components** (`next/image` etc.) — consumer can wrap via `imageClassName` slot.

## Target consumers

- News / blog / editorial sites that need a magazine layout (the kasder use case driving the migration)
- Marketing sites listing articles, case studies, tutorials, blog posts
- Internal company portals listing announcements / KB articles
- Documentation sites with article preview cards in landing or category pages

The consumer is a **frontend dev composing a feed/grid**, not an end user. They'll typically reach for this when they have an array of items with title + image + metadata and need to render them at different densities depending on layout context.

## Rough API sketch

```ts
<ContentCardNews01
  item={{
    id: 'a',
    title: 'Headline',
    image: '/img.jpg',
    excerpt: 'Lead paragraph…',
    category: 'Sustainability',
    author: 'A. Yilmaz',
    date: '2026-05-01',
    readTime: 8,
    views: 2453,
  }}
  variant="featured"
  href="/articles/a"
  linkComponent={Link}
  categoryStyles={{ Sustainability: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' }}
  formatRelativeTime={(d) => myI18n.formatRelative(d)}
  labels={{ readMore: 'Daha Fazla', minutesRead: 'dk okuma' }}
  actions={
    <button onClick={bookmark}>Bookmark</button>
  }
/>
```

5 props are most-used: `item`, `variant`, `href`, `linkComponent`, `categoryStyles`. The rest are escape hatches for i18n, styling overrides, and nested interactives.

## Example usages

**1. Magazine landing page** (composes with `grid-layout-news-01`):

```tsx
<MagazineGrid
  items={articles}
  renderItem={(item, slot) => (
    <ContentCardNews01
      item={item}
      variant={slot}                 // 'featured' | 'large' | 'medium' | 'list'
      linkComponent={NextLink}
      href={`/news/${item.id}`}
      categoryStyles={categoryStyles}
    />
  )}
/>
```

**2. Sidebar "popular" list** (single variant, no layout component):

```tsx
<aside>
  <h3>Popular</h3>
  {topArticles.map(item => (
    <ContentCardNews01
      key={item.id}
      item={item}
      variant="list"
      href={`/news/${item.id}`}
      linkComponent={NextLink}
    />
  ))}
</aside>
```

**3. Editorial card with bookmark + share actions** (overlay-link pattern):

```tsx
<ContentCardNews01
  item={article}
  variant="medium"
  href={`/news/${article.id}`}
  linkComponent={NextLink}
  actions={
    <div className="flex gap-2">
      <BookmarkButton onClick={() => bookmark(article.id)} />
      <ShareButton onClick={() => share(article)} />
    </div>
  }
/>
```

The `actions` cluster sits above the link overlay (z-10) — clicking a button does NOT navigate; the rest of the card surface still does.

## Success criteria

- All 5 variants render correctly at their typical container widths (full-row for `featured` / `large`, half-row for `medium`, sidebar-width for `small` / `list`).
- Cards flex across container widths without internal layout breakage (already true in source; preserved).
- Whole card is clickable AND nested `actions` are independently clickable (overlay-link pattern works).
- Whole card receives focus-visible ring (not just the invisible link rectangle).
- Card omits gracefully when `excerpt` / `category` / `author` / `date` / `readTime` / `views` are missing.
- Featured-variant badge readable on dark gradient (backdrop-blur fix applied).
- Switching `--font-serif` at any DOM scope changes the title font without prop changes.
- Reduced-motion users see no scale/translate transitions.
- TypeScript: prop types are strict; `item` shape is enforced; `variant` is a literal union.
- `pnpm tsc --noEmit` + `pnpm lint` + `pnpm build` clean.
- SSR `/components/content-card-news-01` returns 200 with all 7 demo tabs (5 variants + Composed + Actions slot).

## Open questions

1. **Component export name.** `ContentCardNews01` (verbose, version-explicit, future-proof for `02`/`03`) vs. `ContentCardNews` (clean JSX, requires alias on import if multiple variants installed). **Resolved (analysis sign-off):** `ContentCardNews01` — verbose but unambiguous.
2. **Default serif font.** Playfair Display (high-contrast editorial face, matches kasder screenshot) vs. Lora (lower contrast, friendlier) vs. Source Serif 4 (Adobe's neutral). **Resolved (analysis sign-off):** Playfair Display — character matches the source.
3. **Should `category` be clickable as a filter trigger?** Currently no — clicking the badge clicks through to the article (it's inside the link overlay). If consumers want `onCategoryClick`, the badge needs to be in the `actions` slot or as a separate `<CategoryBadge>` slot. **Open** — defer to v0.2 unless a real consumer asks. v0.1 keeps the badge inside the link.
4. **Should the link overlay be a true overlay (`absolute inset-0`) or use the `::before` pseudo-element pattern?** Both work. Overlay is simpler; `::before` requires positioning the title's `<a>` differently. **Resolved (analysis pass):** absolute-overlay link. Simpler markup, equally accessible.
5. **Loading skeleton variants.** Should the card ship a `<ContentCardNews01.Skeleton variant="medium" />` companion for loading states? **Open** — v0.1 ships without; consumers can render a `bg-muted` placeholder. v0.2 candidate.
