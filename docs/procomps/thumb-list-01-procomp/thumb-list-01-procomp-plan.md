# thumb-list-01 — procomp plan

> Stage 2: how. Implementation blueprint for [`thumb-list-01-procomp-description.md`](./thumb-list-01-procomp-description.md).

## File map

```
src/registry/components/data/thumb-list-01/
├── thumb-list-01.tsx           # root component, memoized default export
├── parts/
│   ├── thumb-row.tsx           # single <li> with image + title + meta + link wrap
│   └── empty-state.tsx         # default empty fallback
├── types.ts                    # ThumbListItem + props + defaults
├── dummy-data.ts               # 5 sample items (varying meta types)
├── demo.tsx                    # 5 sub-tabs
├── usage.tsx
├── meta.ts
└── index.ts
```

9 files (matches the migration analysis estimate of ~8 ± 1).

## Public types

```ts
import type { ComponentType, ElementType, ReactNode } from "react";

export interface ThumbListItem {
  id: string;
  title: string;
  imageSrc: string;
  imageAlt?: string;
  meta?: string;
  href?: string;
}

export interface ThumbList01Labels {
  heading?: string;
  emptyText?: string;
}

export interface ThumbList01Props {
  items: ReadonlyArray<ThumbListItem>;
  framed?: boolean;
  headingAs?: "h2" | "h3" | "h4";
  headerIcon?: ComponentType<{ className?: string }> | null;
  linkComponent?: ElementType;
  renderMeta?: (item: ThumbListItem) => ReactNode;
  emptyState?: ReactNode;
  labels?: ThumbList01Labels;
  className?: string;
  headerClassName?: string;
  itemClassName?: string;
  imageClassName?: string;
  titleClassName?: string;
  metaClassName?: string;
}

export const THUMB_LIST_DEFAULT_LABELS: Required<ThumbList01Labels>;
```

## Empty-state part

```tsx
// parts/empty-state.tsx
import type { ReactNode } from "react";

interface EmptyStateProps {
  custom?: ReactNode;
  message: string;
}

export function ThumbListEmpty({ custom, message }: EmptyStateProps) {
  if (custom) return <>{custom}</>;
  return (
    <p
      className="text-sm text-muted-foreground"
      role="status"
      aria-live="polite"
    >
      {message}
    </p>
  );
}
```

## Thumb-row part

```tsx
// parts/thumb-row.tsx
import type { ElementType, ReactNode } from "react";
import { cn } from "@/lib/utils";
import type { ThumbListItem } from "../types";

interface ThumbRowProps {
  item: ThumbListItem;
  linkComponent: ElementType;
  renderMeta?: (item: ThumbListItem) => ReactNode;
  itemClassName?: string;
  imageClassName?: string;
  titleClassName?: string;
  metaClassName?: string;
}

export function ThumbRow({
  item,
  linkComponent: LinkEl,
  renderMeta,
  itemClassName,
  imageClassName,
  titleClassName,
  metaClassName,
}: ThumbRowProps) {
  const meta = renderMeta ? renderMeta(item) : item.meta ? (
    <p className={cn("text-xs text-muted-foreground mt-1", metaClassName)}>
      {item.meta}
    </p>
  ) : null;

  const InnerLayout = (
    <>
      <img
        src={item.imageSrc}
        alt={item.imageAlt ?? item.title}
        loading="lazy"
        className={cn("w-20 h-16 rounded-lg object-cover shrink-0", imageClassName)}
      />
      <div className="min-w-0">
        <h4
          className={cn(
            "text-sm font-medium text-foreground line-clamp-2",
            "group-hover:text-primary group-focus-visible:text-primary transition-colors",
            titleClassName
          )}
        >
          {item.title}
        </h4>
        {meta}
      </div>
    </>
  );

  return (
    <li className={cn("group", itemClassName)}>
      {item.href ? (
        <LinkEl
          href={item.href}
          className="flex gap-3 items-start focus-visible:outline-none rounded-md focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          {InnerLayout}
        </LinkEl>
      ) : (
        <div className="flex gap-3 items-start">{InnerLayout}</div>
      )}
    </li>
  );
}
```

**Decisions:**

- `<li>` wraps the link, not the other way around (link semantics inside list-item — standard a11y).
- `<h4>` per row's title — semantic-but-low. Always renders as `<h4>` regardless of root `headingAs` (which controls only the section heading). **[refinement]:** actually, this could create heading-order issues if root is `<h2>`. Switch to `<p>` with bold styling (the kasder source uses `<h4>` but it's not load-bearing — it's a list item, not a heading landmark). **Final decision:** `<p>` with `font-medium` — clean list-item semantics, no heading-order pitfalls.
- `group-hover:text-primary` + `group-focus-visible:text-primary` — keyboard parity with hover. Group classes on `<li>`; the `<a>` doesn't need `group` since the parent already has it.
- Item without `href` — renders as plain row (still inside `<li>`), no link affordance. Useful when consumer wants to preserve the visual but disable navigation.

## Root component

```tsx
// thumb-list-01.tsx
import { memo } from "react";
import { BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import { ThumbRow } from "./parts/thumb-row";
import { ThumbListEmpty } from "./parts/empty-state";
import { THUMB_LIST_DEFAULT_LABELS, type ThumbList01Props } from "./types";

function ThumbList01Inner(props: ThumbList01Props) {
  const {
    items,
    framed = true,
    headingAs: HeadingTag = "h3",
    headerIcon = BookOpen,
    linkComponent = "a",
    renderMeta,
    emptyState,
    labels,
    className,
    headerClassName,
    itemClassName,
    imageClassName,
    titleClassName,
    metaClassName,
  } = props;

  const resolvedLabels = { ...THUMB_LIST_DEFAULT_LABELS, ...labels };
  const HeaderIcon = headerIcon;
  const isEmpty = items.length === 0;

  return (
    <section
      className={cn(
        framed && "bg-card rounded-2xl p-6 border border-border/50",
        className
      )}
    >
      <HeadingTag
        className={cn(
          "text-lg font-serif font-bold text-foreground mb-4 flex items-center gap-2",
          headerClassName
        )}
      >
        {HeaderIcon ? (
          <HeaderIcon className="w-5 h-5 text-primary" aria-hidden="true" />
        ) : null}
        {resolvedLabels.heading}
      </HeadingTag>

      {isEmpty ? (
        <ThumbListEmpty custom={emptyState} message={resolvedLabels.emptyText} />
      ) : (
        <ul className="space-y-4">
          {items.map((item) => (
            <ThumbRow
              key={item.id}
              item={item}
              linkComponent={linkComponent}
              renderMeta={renderMeta}
              itemClassName={itemClassName}
              imageClassName={imageClassName}
              titleClassName={titleClassName}
              metaClassName={metaClassName}
            />
          ))}
        </ul>
      )}
    </section>
  );
}

export const ThumbList01 = memo(ThumbList01Inner);
ThumbList01.displayName = "ThumbList01";
```

**Decisions:**

- `<section>` not `<div>` — gives a landmark when the heading is `<h2>`+, falls back to a regular grouping at `<h3>`.
- `headerIcon` is `ComponentType | null` — pass `null` to suppress.
- `framed: false` strips the card chrome but keeps internal structure (heading + list).
- `<ul className="space-y-4">` — list semantics + the kasder vertical rhythm.

## Demo (5 sub-tabs)

1. **Default** — framed, BookOpen icon, "Related" heading, 4 items with read-time meta.
2. **No frame** — same items, `framed: false` — borderless inline list.
3. **Custom render-meta** — date-rendering example with `<time>` and `Intl.RelativeTimeFormat`.
4. **Empty state** — `items: []`, custom `labels.emptyText`. Shows the default empty UI.
5. **i18n + custom icon** — Turkish heading, custom Lucide icon (`Bookmark` for saved-items).

Built on shadcn primitive `Tabs` only.

## Dummy data

```ts
// dummy-data.ts
import type { ThumbListItem } from "./types";

export const THUMB_LIST_01_DUMMY: ReadonlyArray<ThumbListItem> = [
  {
    id: "1",
    title: "How sustainable cities are rethinking density",
    imageSrc: "https://images.unsplash.com/photo-1480714378408-67cf0d13bc1f?w=400&h=300&fit=crop&auto=format",
    imageAlt: "City skyline at dusk",
    meta: "5 min read",
    href: "/news/sustainable-density",
  },
  {
    id: "2",
    title: "Public transit on the rebound",
    imageSrc: "https://images.unsplash.com/photo-1519501025264-65ba15a82390?w=400&h=300&fit=crop&auto=format",
    imageAlt: "Bus station at night",
    meta: "3 min read",
    href: "/news/public-transit",
  },
  {
    id: "3",
    title: "What e-bikes are doing to city centers",
    imageSrc: "https://images.unsplash.com/photo-1571068316344-75bc76f77890?w=400&h=300&fit=crop&auto=format",
    imageAlt: "E-bikes in a row",
    meta: "8 min read",
    href: "/news/ebikes",
  },
  {
    id: "4",
    title: "Mapping the unmapped — community-led OSM",
    imageSrc: "https://images.unsplash.com/photo-1487958449943-2429e8be8625?w=400&h=300&fit=crop&auto=format",
    imageAlt: "Hands pointing at a paper map",
    meta: "6 min read",
    href: "/news/community-osm",
  },
];

export const THUMB_LIST_01_DUMMY_TR: ReadonlyArray<ThumbListItem> = [
  { id: "1", title: "Sürdürülebilir şehirler nasıl yeniden tasarlanıyor", imageSrc: "https://images.unsplash.com/photo-1480714378408-67cf0d13bc1f?w=400&h=300&fit=crop&auto=format", meta: "5 dk", href: "/haberler/1" },
  { id: "2", title: "Toplu taşımanın geri dönüşü", imageSrc: "https://images.unsplash.com/photo-1519501025264-65ba15a82390?w=400&h=300&fit=crop&auto=format", meta: "3 dk", href: "/haberler/2" },
  { id: "3", title: "E-bisikletler şehir merkezlerini değiştiriyor", imageSrc: "https://images.unsplash.com/photo-1571068316344-75bc76f77890?w=400&h=300&fit=crop&auto=format", meta: "8 dk", href: "/haberler/3" },
];

export const THUMB_LIST_01_DUMMY_DATED: ReadonlyArray<ThumbListItem & { publishedAt: string }> = [
  { id: "a", title: "What we got wrong about remote-first", imageSrc: "https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?w=400&h=300&fit=crop&auto=format", href: "/posts/a", publishedAt: "2026-04-15", meta: "" },
  { id: "b", title: "Five tools we replaced this quarter", imageSrc: "https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=400&h=300&fit=crop&auto=format", href: "/posts/b", publishedAt: "2026-04-08", meta: "" },
  { id: "c", title: "Why we deleted half our docs", imageSrc: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=400&h=300&fit=crop&auto=format", href: "/posts/c", publishedAt: "2026-03-22", meta: "" },
];
```

## Verification (end-of-implementation gate)

1. `pnpm tsc --noEmit` clean
2. `pnpm lint` clean (1 pre-existing rich-card warning OK)
3. `pnpm build` clean — `/components/thumb-list-01` prerendered
4. SSR smoke — `HTTP 200`, all 5 demo tab triggers present, default tab content rendered
5. Manifest entry present, `/components` index lists the new entry
6. Registry artifacts at `public/r/thumb-list-01.json` + `public/r/thumb-list-01-fixtures.json`

## Risks / known unknowns

1. **Image error fallback** — broken `src` shows browser default. Acknowledged.
2. **Heading-order pitfalls** — if a consumer uses `<thumb-list-01 headingAs="h2">` deep inside an article whose top-of-page is also `<h2>`, document order may be wrong. Default `h3` is the safe choice; documented in guide.
3. **List with all `href: undefined` items** — renders as a non-clickable list. Edge case; functions correctly (no a11y violation, just no navigation).
4. **`renderMeta` called every render** — pure, no `useCallback` needed; React Compiler should memo. Document the "stable refs help memoization" caveat.

## Bundle envelope

Component code only:
- `thumb-list-01.tsx` ~75 LOC
- `parts/thumb-row.tsx` ~55 LOC
- `parts/empty-state.tsx` ~18 LOC
- `types.ts` ~35 LOC
- Total: ~180 LOC TSX

Estimated minified: ~4.5KB. Under the ≤ 5KB envelope.

## Out of plan (deferred to v0.2 if needed)

- `imagePlaceholder?: ReactNode` for image-error fallback
- `getId/getTitle/getMeta` accessor flavor for non-conforming item shapes
- Skeleton loading state primitive
- Item icons (alongside or instead of thumbnails) for non-image use cases — likely a separate slug if ever needed
