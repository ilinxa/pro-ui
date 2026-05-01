# article-meta-01 — procomp description

> Stage 1: what & why.
>
> **Migration origin:** [`docs/migrations/article-meta-01/`](../../migrations/article-meta-01/) (kasder `kas-social-front-v0` news detail page article column — `src/app/(platform)/news/[id]/page.tsx` lines 89–106)
>
> Sibling migration: [`share-bar-01`](../../migrations/share-bar-01/) — bottom-of-article share strip from the same page.

## Problem

Every long-form content surface — blog posts, news articles, doc pages, video player meta lines, podcast episode headers, forum threads — surfaces a horizontal strip of icon + value pairs (author / date / read-time / view-count / etc.) immediately under the title or hero. Built ad-hoc per project: hardcoded fields, hardcoded icons, baked-in localized strings, no clickability for byline or date-permalink, no shared a11y baseline.

## In scope

- **Data-driven horizontal flex-wrap row** — generic `items` array of arbitrary length.
- **Per-item icon + value** — each item has its own optional Lucide-style icon + a `ReactNode` value (consumer pre-formats; we don't do date / number formatting).
- **Per-item link wrap** — optional `href` makes a single item clickable (e.g. byline → author page, date → permalink). Polymorphic via `linkComponent` slot.
- **Optional bottom-divider** — `divider: true` applies `pb-8 border-b border-border` for the standard "between hero and body" placement.
- **Alignment** — `start` / `center` / `end`. Useful for centered meta lines on hero-overlay layouts.
- **Tunable gap** — `gapClass` override for tighter/looser spacing without forking class merging.
- **a11y** — `<ul>` / `<li>` semantics; per-item icons `aria-hidden="true"`; optional `ariaLabel` per item for icon-meaning clarity.

## Out of scope

- **No multi-row stats grid** — single horizontal row only. (Stat grids belong to a future `data/stat-grid` or `feedback/stat-card`.)
- **No formatting helpers** — values are pre-formatted `ReactNode`. Consumer brings the formatter (`formatDate`, `Intl.NumberFormat`, etc.).
- **No tooltips on items** — values are short. If a consumer needs them, they wrap their value in their own Tooltip.
- **No badges or chips inside items** — keep items text-only with optional icon. Tag chips belong to `category-cloud-01`.
- **No truncation** — values render as-is; consumer truncates upstream if needed.
- **No editable mode** — display only.
- **No separator characters between items** — just `gap-N`. Consumers wanting `·` separators can override via `className` (or wait for `separator?` prop in v0.2 if real demand surfaces).

## Target consumers

- News article detail pages (the kasder source itself)
- Blog post headers (under title)
- Doc page metadata strips
- Video player meta lines
- Podcast episode headers
- Forum thread titles
- GitHub-issue-style metadata strips
- Any "long-form content with metadata" surface

## Rough API sketch

```tsx
import { User, Calendar, Clock, Eye } from "lucide-react";

<ArticleMeta01
  divider
  items={[
    { id: "author", icon: User, value: "Maya Chen", href: "/team/maya-chen" },
    { id: "date", icon: Calendar, value: "Apr 28, 2026" },
    { id: "read", icon: Clock, value: "5 min read", ariaLabel: "5 minute read" },
    { id: "views", icon: Eye, value: "12.4k", ariaLabel: "12,400 views" },
  ]}
/>
```

Most-used props: `items`, `divider`. Rest are escape hatches.

## Example usages

**1. News article detail page** (the kasder source pattern):
```tsx
<article>
  <h1>{article.title}</h1>
  <ArticleMeta01
    divider
    items={[
      { id: "author", icon: User, value: article.author, href: `/team/${article.authorSlug}` },
      { id: "date", icon: Calendar, value: formatDate(article.publishedAt) },
      { id: "read", icon: Clock, value: `${article.readMinutes} min read` },
      { id: "views", icon: Eye, value: formatCompact(article.views) },
    ]}
  />
  {/* lead paragraph + body follow */}
</article>
```

**2. Centered meta line under a hero**:
```tsx
<ArticleMeta01
  align="center"
  items={[
    { id: "author", icon: User, value: "Daniel Park" },
    { id: "date", icon: Calendar, value: "March 15, 2026" },
  ]}
/>
```

**3. Doc page byline** — fewer items, no divider:
```tsx
<ArticleMeta01
  items={[
    { id: "author", icon: User, value: "@maya", href: "/team/maya" },
    { id: "updated", icon: GitCommit, value: "Updated Apr 28" },
    { id: "version", icon: Tag, value: "v3.2.1" },
  ]}
/>
```

**4. Video player meta line** — tight gap:
```tsx
<ArticleMeta01
  gapClass="gap-3"
  items={[
    { id: "channel", icon: User, value: "Cinema Lab", href: "/channels/cinema-lab" },
    { id: "uploaded", icon: Calendar, value: "2 days ago" },
    { id: "duration", icon: PlayCircle, value: "12:34" },
    { id: "views", icon: Eye, value: "1.2M" },
  ]}
/>
```

## Success criteria

1. **Visual fidelity** — when rendered with kasder-equivalent props, the strip matches the source within 1–2px and identical color tokens.
2. **Universally applicable** — the same component renders cleanly in ALL the target-consumer contexts above with prop-only changes (no className overrides needed).
3. **Polymorphic-link works** — verified with native `<a>` (default); compatible with `next/link` / RemixLink consumer-side.
4. **Per-item icons optional** — items render cleanly without an icon (text-only).
5. **Wrap behavior** — at narrow widths, items wrap to multi-line gracefully; no overflow.
6. **a11y** — `<ul>` / `<li>` semantics with Safari `role="list"` workaround; decorative icons `aria-hidden`; optional `ariaLabel` per item composes the link's accessible name.
7. **Bundle envelope** — ≤ 3KB component code (smallest pro-comp shipped).
8. **Memoization** — exported as `React.memo`; pure for given props. Documents the "stable items array" caveat.
9. **Demo coverage** — 5 sub-tabs (default / centered / clickable byline / no-icons (text-only) / video meta line variation).
10. **Verification** — `pnpm tsc --noEmit` + `pnpm lint` + `pnpm build` clean (1 pre-existing rich-card warning OK; no new); SSR `HTTP 200` for `/components/article-meta-01` with all demo tabs rendered.

## Open questions

None. Decisions are clear from source + sibling conventions (author-card-01, thumb-list-01).

## Why not...

- **Render `value` via a formatter prop?** — Adds a layer that 90% of consumers don't use. They already format upstream (date libraries, i18n, Intl.NumberFormat). Component renders ReactNode as-is.
- **Per-item `tooltip?: string` in v0.1?** — Adds shadcn Tooltip dep for a feature not in source. Native `title` attribute is the YAGNI fallback (consumer can pass an item with a `<span title="...">` value if needed).
- **`renderItem(item)` slot?** — Possible v0.2 escape hatch for richer items, but the icon + value shape covers the realistic 95%. Don't pre-build for hypothetical use.
- **Default `items` for "common" presets** (`["author", "date", "readTime"]` etc.)? — Anti-pattern. Consumer always brings the data; no presets buy anything.
