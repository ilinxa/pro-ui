# article-meta-01 — migration source notes

> Intake doc for [`docs/migrations/article-meta-01/`](./). The user pointed at the kasder news detail-page article column; the assistant drafted this from the source. **Sections tagged `[TO CONFIRM]` are inferred and need user sign-off before the analysis pass.**
>
> **Family context:** part of the news-domain article-column extraction — sibling migrations: [`share-bar-01`](../share-bar-01/) and the upcoming `article-body-01` (Plate-based WYSIWYG, deferred to its own session). Together with the already-shipped sidebar set (author-card-01 / thumb-list-01 / newsletter-card-01) they assemble the full kasder news detail page.
>
> **No `-news-` infix in the slug** — universal "article meta strip" pattern (blog post header, doc page byline, video player meta line, podcast episode header). Same convention as the rest of the pro-ui news-domain extractions.
>
> See [`docs/migrations/README.md`](../README.md) for the full pipeline.

## Source

- **App:** `kas-social-front-v0` (kasder)
- **Path in source:** `src/app/(platform)/news/[id]/page.tsx` lines 89–106 (Meta Info row inside the article column)
- **Used in:** the news article detail page, immediately under the hero section, above the article lead paragraph. One instance per page.
- **Related code:**
  - [`original/news-detail-page.tsx`](./original/news-detail-page.tsx) — the full kasder source page; the meta strip lives between the hero section and the lead paragraph in `<article>`

## Role

A horizontal strip of icon + value pairs that surface key metadata about a piece of content immediately under its title or hero. In the source: author / publish-date / read-time / view-count for a news article. The pattern is universal — any "long-form content with metadata" surface uses some flavor of this:

- Blog posts: author / date / read-time / claps
- Doc pages: author / last-updated / version
- Video player meta: uploader / publish-date / duration / view count
- Podcast episodes: host / publish-date / duration / play count
- Forum threads: author / posted / reply count / view count

The kasder version is a flex-wrap row of 4 fixed pairs (author / date / read-time / views), each rendered as `<icon /> <span>value</span>` with `text-muted-foreground` chrome.

## What I like (preserve)

- **Horizontal flex-wrap layout** — `flex flex-wrap items-center gap-6` reads cleanly even at narrow widths (wraps to multi-line gracefully).
- **Icon + value pairing** — each item is `flex items-center gap-2` with a lucide icon + a span. Compact, scannable.
- **Subordinate chrome** — entire strip is `text-muted-foreground` so it doesn't compete with the article title above.
- **Bottom border separator** — `pb-8 border-b border-border` separates the meta strip from the article body cleanly.
- **Top margin from hero** — `mb-8` between meta strip and lead paragraph.
- **Icon sizing** — `w-4 h-4` on lucide icons matches body text x-height.
- **No labels** — just icon + value (the icons themselves carry the semantic).

## What bothers me (rewrite)

- **Hardcoded set of 4 fixed fields** (author / date / read-time / views) — must be data-driven via an `items` array of arbitrary length and shape. Different consumers want different fields.
- **Hardcoded icons** — `User`, `Calendar`, `Clock`, `Eye` baked in. Each item must accept its own icon.
- **Hardcoded localized strings** — `"dk okuma"` (read time), `"görüntülenme"` (views). Must be consumer-supplied via `value: ReactNode` or label transform.
- **No support for clickable items** — author should optionally link to author page; date could be a permalink. Each item should accept optional `href` + the polymorphic `linkComponent` slot.
- **No date formatting indirection** — uses `formatDate(news.date)` from a foreign module. Component accepts pre-formatted `value: ReactNode`; consumer brings their own formatter.
- **Not memoized** — re-renders on parent re-render.
- **Density / spacing inflexibility** — `gap-6` is generous for desktop, may be tight on mobile. Could expose `density` prop (compact / default / loose), but YAGNI for v0.1.
- **No separator option** — kasder uses gap only; some designs use `·` dots between items. Could expose `separator` prop, but YAGNI for v0.1.
- **No alignment option** — kasder is left-aligned. Center-aligned variants exist (under-hero centered meta on landing pages). YAGNI for v0.1; consumer can override via `className`.

## Constraints / non-goals

- **Display only** — never an editor. (Edit-meta UIs are different surface.)
- **Never `next/*`** — registry mandate. Polymorphic link via `linkComponent: ElementType`.
- **Single row** — no multi-row "stats grid" mode. (Stats grids belong to `data/stat-card` or future `feedback/stat-grid`.)
- **No tooltips on items in v0.1** — useful for long values but adds dep on shadcn Tooltip; YAGNI. Consumer can wrap individual values in their own Tooltip.
- **No badges or chips inside items** — keep items text-only with optional icon. (Tag chips belong to `category-cloud-01` or a future `tag-row` component.)
- **No truncation logic** — values render as-is; consumer truncates upstream if needed.

## Screenshots / links

- Source: kasder dev env, news detail page article column.
- Equivalent in production: any blog post header byline, Medium / Substack post meta strip, YouTube video meta line, GitHub issue header.
