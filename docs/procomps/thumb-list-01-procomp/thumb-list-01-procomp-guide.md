# thumb-list-01 — consumer guide

> Stage 3: how to use it. Authored alongside the implementation.
>
> Component lives at [`src/registry/components/data/thumb-list-01/`](../../../src/registry/components/data/thumb-list-01/).

## Install

From any consumer app:

```bash
pnpm dlx shadcn@latest add @ilinxa/thumb-list-01
```

The `@ilinxa/thumb-list-01-fixtures` sibling adds the demo dummy-data file. Skip it if you have your own data.

## Quick start

```tsx
import { ThumbList01 } from "@/registry/components/data/thumb-list-01";

const items = [
  {
    id: "1",
    title: "Sustainable cities, then and now",
    imageSrc: "/img/1.jpg",
    meta: "5 min read",
    href: "/news/1",
  },
  {
    id: "2",
    title: "Public transit on the rebound",
    imageSrc: "/img/2.jpg",
    meta: "3 min read",
    href: "/news/2",
  },
];

export function RelatedPosts() {
  return <ThumbList01 items={items} labels={{ heading: "Related" }} />;
}
```

## API reference

```ts
interface ThumbListItem {
  id: string;          // required
  title: string;       // required
  imageSrc: string;    // required
  imageAlt?: string;   // defaults to title
  meta?: string;       // optional secondary line
  href?: string;       // optional; when absent, row renders as plain (no link)
}

interface ThumbList01Props {
  items: ReadonlyArray<ThumbListItem>;                     // required
  framed?: boolean;                                        // default true
  headingAs?: "h2" | "h3" | "h4";                          // default "h3"
  headerIcon?: ComponentType<{ className?: string }> | null; // default lucide BookOpen; null hides
  linkComponent?: ElementType;                             // default "a"
  renderMeta?: (item: ThumbListItem) => ReactNode;         // override the default meta render
  emptyState?: ReactNode;                                  // wins over labels.emptyText when provided
  labels?: { heading?: string; emptyText?: string };       // defaults: "Related" / "Nothing here yet."
  className?: string;
  headerClassName?: string;
  itemClassName?: string;
  imageClassName?: string;
  titleClassName?: string;
  metaClassName?: string;
}
```

`THUMB_LIST_DEFAULT_LABELS` is exported for consumers who want to extend the defaults.

## Recipes

### Inline (no frame)

For dropdowns, modals, or any surface that already provides framing:

```tsx
<ThumbList01 items={searchHits} framed={false} />
```

### Custom meta rendering

```tsx
const formatter = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

<ThumbList01
  items={posts}
  labels={{ heading: "More from this author" }}
  renderMeta={(item) => (
    <time
      className="text-xs text-muted-foreground mt-1 block"
      dateTime={item.publishedAt}
    >
      {formatter.format(daysAgo(item.publishedAt), "day")}
    </time>
  )}
/>
```

### Polymorphic link

```tsx
import Link from "next/link";

<ThumbList01 items={items} linkComponent={Link} />
```

By default the row link renders as a native `<a>`. Pass `linkComponent` for router-aware links.

### Empty state

```tsx
<ThumbList01
  items={[]}
  labels={{
    heading: "Recently viewed",
    emptyText: "Nothing here yet — articles you read will show up here.",
  }}
/>
```

For a richer custom UI, pass `emptyState` as a ReactNode — it replaces the default fallback message:

```tsx
<ThumbList01
  items={[]}
  emptyState={
    <div className="text-sm text-muted-foreground">
      <p>You haven&apos;t saved any articles yet.</p>
      <Button variant="outline" size="sm" className="mt-2">
        Browse articles
      </Button>
    </div>
  }
/>
```

### Custom icon and i18n

```tsx
import { Bookmark } from "lucide-react";

<ThumbList01
  items={savedPosts}
  headerIcon={Bookmark}
  labels={{ heading: "Kaydedilen Haberler", emptyText: "Henüz kayıt yok." }}
/>
```

Pass `headerIcon={null}` to omit the icon entirely.

### Within the news-domain sidebar

```tsx
<aside className="lg:col-span-4">
  <div className="sticky top-24 space-y-8">
    <AuthorCard01 {...author} />
    <ThumbList01 items={relatedArticles} labels={{ heading: "Related" }} />
    <NewsletterCard01 onSubmit={subscribe} />
  </div>
</aside>
```

All three components share the same card chrome and heading rhythm — they compose cleanly.

## A11y

- Items render as `<li>` inside a `<ul>` — list semantics for free.
- Each item with `href` is a single link; the accessible name is the title.
- Hover and `focus-visible` both shift the title color (`group-hover:text-primary` / `group-focus-visible:text-primary`) — keyboard parity.
- Header icon is decorative (`aria-hidden="true"`).
- Empty state announces via `role="status" aria-live="polite"` so screen readers pick up dynamic empty/non-empty transitions.
- Thumbnails carry `alt` (defaults to `title`).

## Performance

- The component is exported as `React.memo`. Pass stable refs for `linkComponent`, `headerIcon`, and `renderMeta` for memoization to hold.
- Thumbnails use `loading="lazy"` — no impact on initial paint.
- No client-only APIs; the component renders fully on the server.

## When to use, when not to

**Use it for:**

- Sidebar lists (related / popular / recent / saved)
- Search-suggestion dropdowns
- "Up next" media queues
- File-picker recents
- "More from author" rails

**Don't use it for:**

- Paginated or virtualized result sets — reach for `data-table` or `grid-layout-news-01`
- Lists that need per-item action menus / overflow buttons — different shape
- Drag-reordering — read-only
- More than ~20 items eagerly — perf will degrade

## Known limits / v0.2 candidates

- **Image error fallback** — broken `src` shows browser default. v0.2 candidate: `imagePlaceholder?: ReactNode`.
- **Custom item shape** — current API requires `ThumbListItem`. v0.2 could expose `getId/getTitle/getImageSrc/...` accessors for non-conforming sources; YAGNI for now (consumer maps upstream).
- **Skeleton loading** — consumers wrap their own.
- **Item icons (alongside or instead of thumbnails)** — separate slug if ever needed.

## Migration origin

Extracted from `kas-social-front-v0` (`src/app/(platform)/news/[id]/page.tsx`, lines 208–234). The kasder source has the block inline with hardcoded Turkish copy and `next/link` baked in. See [`docs/migrations/thumb-list-01/analysis.md`](../../migrations/thumb-list-01/analysis.md) for the full extraction notes.
