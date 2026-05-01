# article-meta-01 — consumer guide

> Stage 3: how to use it.
>
> Component lives at [`src/registry/components/data/article-meta-01/`](../../../src/registry/components/data/article-meta-01/).

## Install

```bash
pnpm dlx shadcn@latest add @ilinxa/article-meta-01
```

The `@ilinxa/article-meta-01-fixtures` sibling adds the demo dummy-data file. Skip if you have your own data.

## Quick start

```tsx
import { Calendar, Clock, Eye, User } from "lucide-react";
import { ArticleMeta01 } from "@/registry/components/data/article-meta-01";

export function ArticleHeader({ article }) {
  return (
    <ArticleMeta01
      divider
      items={[
        { id: "author", icon: User, value: article.author, href: `/team/${article.authorSlug}` },
        { id: "date", icon: Calendar, value: formatDate(article.publishedAt) },
        { id: "read", icon: Clock, value: `${article.readMinutes} min read`, ariaLabel: `${article.readMinutes} minute read` },
        { id: "views", icon: Eye, value: formatCompact(article.views), ariaLabel: `${article.views} views` },
      ]}
    />
  );
}
```

## API reference

```ts
interface ArticleMetaItem {
  id: string;                                            // unique key
  icon?: ComponentType<{ className?: string }>;          // optional Lucide-style icon
  value: ReactNode;                                      // the displayed text/element
  href?: string;                                         // optional link wrap
  ariaLabel?: string;                                    // optional accessible name
}

interface ArticleMeta01Props {
  items: ReadonlyArray<ArticleMetaItem>;                 // required
  linkComponent?: ElementType;                           // default "a"
  divider?: boolean;                                     // default false
  align?: "start" | "center" | "end";                    // default "start"
  gapClass?: string;                                     // default "gap-6"
  className?: string;
  itemClassName?: string;
  iconClassName?: string;
}
```

## Recipes

### Centered meta line under a hero

```tsx
<ArticleMeta01
  align="center"
  items={[
    { id: "author", icon: User, value: "Daniel Park" },
    { id: "date", icon: Calendar, value: "March 15, 2026" },
  ]}
/>
```

### Polymorphic link

```tsx
import Link from "next/link";

<ArticleMeta01
  items={[
    { id: "author", icon: User, value: "Maya Chen", href: "/team/maya-chen" },
    { id: "date", icon: Calendar, value: "Apr 28, 2026", href: "/archive/2026-04-28" },
  ]}
  linkComponent={Link}
/>
```

### Text-only items

Items can omit `icon` for pure label-value strips:

```tsx
<ArticleMeta01
  items={[
    { id: "category", value: "ENVIRONMENT" },
    { id: "issue", value: "Issue #42" },
    { id: "page", value: "Page 18" },
  ]}
/>
```

### Tighter rhythm (video player meta)

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

### Composed with the news-domain article column

```tsx
<article className="lg:col-span-8">
  <h1 className="text-3xl font-serif font-bold mb-4">{article.title}</h1>

  <ArticleMeta01
    divider
    items={[
      { id: "author", icon: User, value: article.author, href: `/team/${article.authorSlug}` },
      { id: "date", icon: Calendar, value: formatDate(article.publishedAt) },
      { id: "read", icon: Clock, value: `${article.readMinutes} min read` },
      { id: "views", icon: Eye, value: formatCompact(article.views) },
    ]}
  />

  <p className="text-xl mt-8">{article.lead}</p>
  {/* article body */}

  <ShareBar01
    targets={[{ kind: "twitter" }, { kind: "facebook" }, { kind: "linkedin" }, { kind: "copy" }]}
    title={article.title}
    headingAs="h4"
    divider
  />
</article>
```

## A11y

- Items render as `<li>` inside `<ul role="list">`. The explicit role works around Safari's VoiceOver handling of `list-style: none`.
- Item icons are decorative (`aria-hidden="true"`).
- For icon-meaning clarity in screen readers, set `ariaLabel` on the item:
  - When the item is linked, `ariaLabel` becomes the link's accessible name.
  - When unlinked, the content is wrapped in a labeled `<span>` so screen readers announce it as a single labeled unit.
- Linked items show a `focus-visible:ring-ring` on keyboard focus.

## Performance

- Exported as `React.memo`. Memoize the `items` array (or pass a stable reference) for the memo to bite — inline `items={[...]}` defeats it.
- No client-only APIs; renders fully on the server.
- Smallest pro-comp shipped (~2.5KB minified).

## When to use, when not to

**Use it for:**
- News article / blog post header bylines
- Doc page metadata strips
- Video player / podcast meta lines
- Forum / GitHub-issue-style headers
- Any "long-form content with metadata" surface

**Don't use it for:**
- Multi-row stat grids — reach for a future `data/stat-grid` or `feedback/stat-card`
- Tag chips — reach for `category-cloud-01`
- Rich content with badges/buttons inline — keep items text-only

## Known limits / v0.2 candidates

- `separator?: ReactNode | "dot" | "pipe"` — separator characters between items
- `renderItem?: (item) => ReactNode` — full custom render slot
- `density?: "compact" | "default" | "loose"` — preset gap shortcuts (currently use `gapClass`)
- Item tooltips via shadcn Tooltip

## Migration origin

Extracted from `kas-social-front-v0` (`src/app/(platform)/news/[id]/page.tsx`, lines 89–106). The kasder source has the strip inline with hardcoded fields + Turkish strings; this version is data-driven, polymorphic, English-default. See [`docs/migrations/article-meta-01/analysis.md`](../../migrations/article-meta-01/analysis.md) for the full extraction notes.
