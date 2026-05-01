# article-meta-01 — procomp plan

> Stage 2: how. Implementation blueprint for [`article-meta-01-procomp-description.md`](./article-meta-01-procomp-description.md).

## File map

```
src/registry/components/data/article-meta-01/
├── article-meta-01.tsx         # root, memoized
├── parts/
│   └── meta-item.tsx           # single icon + value + optional link wrap
├── types.ts                    # ArticleMetaItem + props
├── dummy-data.ts               # 3 sample item sets
├── demo.tsx                    # 5 sub-tabs
├── usage.tsx
├── meta.ts
└── index.ts
```

8 files (matches the migration analysis estimate of ~7 ± 1).

## Public types

```ts
import type { ComponentType, ElementType, ReactNode } from "react";

export interface ArticleMetaItem {
  id: string;
  icon?: ComponentType<{ className?: string }>;
  value: ReactNode;
  href?: string;
  ariaLabel?: string;
}

export interface ArticleMeta01Props {
  items: ReadonlyArray<ArticleMetaItem>;
  linkComponent?: ElementType;
  divider?: boolean;
  align?: "start" | "center" | "end";
  gapClass?: string;
  className?: string;
  itemClassName?: string;
  iconClassName?: string;
}
```

## Meta-item part

```tsx
// parts/meta-item.tsx
import type { ElementType } from "react";
import { cn } from "@/lib/utils";
import type { ArticleMetaItem } from "../types";

interface MetaItemProps {
  item: ArticleMetaItem;
  linkComponent: ElementType;
  itemClassName?: string;
  iconClassName?: string;
}

export function MetaItem({
  item,
  linkComponent: LinkEl,
  itemClassName,
  iconClassName,
}: MetaItemProps) {
  const Icon = item.icon;

  const content = (
    <>
      {Icon ? (
        <Icon className={cn("w-4 h-4", iconClassName)} aria-hidden="true" />
      ) : null}
      <span>{item.value}</span>
    </>
  );

  return (
    <li className={cn("group flex items-center gap-2", itemClassName)}>
      {item.href ? (
        <LinkEl
          href={item.href}
          aria-label={item.ariaLabel}
          className="inline-flex items-center gap-2 hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-sm"
        >
          {content}
        </LinkEl>
      ) : item.ariaLabel ? (
        <span aria-label={item.ariaLabel} className="inline-flex items-center gap-2">
          {content}
        </span>
      ) : (
        <span className="inline-flex items-center gap-2">{content}</span>
      )}
    </li>
  );
}
```

**Decisions:**

- `<li>` with `flex items-center gap-2` — the group affordance + icon-value pairing.
- Link wrap renders `inline-flex` to keep the icon-text alignment intact.
- Hover affordance on linked items only (`hover:text-foreground`) — lifts from muted to full foreground on hover. Cheap, matches the kasder visual language.
- `focus-visible` ring with `rounded-sm` — small radius matches the inline content, not a giant pill.
- `ariaLabel` plays a dual role: when the item is linked, it composes the link's accessible name; when unlinked, it wraps the content in a labeled `<span>` so screen readers announce it as a labeled unit.

## Root component

```tsx
// article-meta-01.tsx
import { memo } from "react";
import { cn } from "@/lib/utils";
import { MetaItem } from "./parts/meta-item";
import type { ArticleMeta01Props } from "./types";

const ALIGN_CLASS = {
  start: "justify-start",
  center: "justify-center",
  end: "justify-end",
} as const;

function ArticleMeta01Inner(props: ArticleMeta01Props) {
  const {
    items,
    linkComponent = "a",
    divider = false,
    align = "start",
    gapClass = "gap-6",
    className,
    itemClassName,
    iconClassName,
  } = props;

  return (
    <ul
      role="list"
      className={cn(
        "flex flex-wrap items-center text-muted-foreground",
        gapClass,
        ALIGN_CLASS[align],
        divider && "pb-8 border-b border-border",
        className
      )}
    >
      {items.map((item) => (
        <MetaItem
          key={item.id}
          item={item}
          linkComponent={linkComponent}
          itemClassName={itemClassName}
          iconClassName={iconClassName}
        />
      ))}
    </ul>
  );
}

export const ArticleMeta01 = memo(ArticleMeta01Inner);
ArticleMeta01.displayName = "ArticleMeta01";
```

**Decisions:**

- `<ul role="list">` — list semantics + the Safari workaround for `<ul>+list-style:none` (Tailwind's reset).
- `text-muted-foreground` on the root cascades to children — keeps the strip subordinate to surrounding content.
- `flex flex-wrap items-center` is THE layout — no other display modes.
- `gapClass` defaults to `gap-6` (kasder default); easy override.
- `divider` is opt-in (default false) — not every consumer wants the bottom rule.

## Demo (5 sub-tabs)

1. **Default** — kasder-equivalent: 4 items (author / date / read-time / views), divider on, all icons.
2. **Centered** — `align="center"`, fewer items (2–3). Useful under a hero.
3. **Clickable byline** — author item has `href`, demo shows hover affordance + focus-visible ring.
4. **Text-only** — items without icons (`icon` omitted). Pure label-value strip.
5. **Tight (video player style)** — `gapClass="gap-3"`, 4 items mimicking a video meta line.

Built on shadcn primitive `Tabs` only.

## Dummy data

```ts
// dummy-data.ts
import { Calendar, Clock, Eye, GitCommit, PlayCircle, Tag, User } from "lucide-react";
import type { ArticleMetaItem } from "./types";

export const ARTICLE_META_01_DUMMY: ReadonlyArray<ArticleMetaItem> = [
  { id: "author", icon: User, value: "Maya Chen", href: "/team/maya-chen" },
  { id: "date", icon: Calendar, value: "Apr 28, 2026" },
  { id: "read", icon: Clock, value: "5 min read", ariaLabel: "5 minute read" },
  { id: "views", icon: Eye, value: "12.4k", ariaLabel: "12,400 views" },
];

export const ARTICLE_META_01_DUMMY_CENTERED: ReadonlyArray<ArticleMetaItem> = [
  { id: "author", icon: User, value: "Daniel Park" },
  { id: "date", icon: Calendar, value: "March 15, 2026" },
];

export const ARTICLE_META_01_DUMMY_DOCS: ReadonlyArray<ArticleMetaItem> = [
  { id: "author", icon: User, value: "@maya", href: "/team/maya" },
  { id: "updated", icon: GitCommit, value: "Updated Apr 28" },
  { id: "version", icon: Tag, value: "v3.2.1" },
];

export const ARTICLE_META_01_DUMMY_VIDEO: ReadonlyArray<ArticleMetaItem> = [
  { id: "channel", icon: User, value: "Cinema Lab", href: "/channels/cinema-lab" },
  { id: "uploaded", icon: Calendar, value: "2 days ago" },
  { id: "duration", icon: PlayCircle, value: "12:34" },
  { id: "views", icon: Eye, value: "1.2M" },
];

export const ARTICLE_META_01_DUMMY_TEXT_ONLY: ReadonlyArray<ArticleMetaItem> = [
  { id: "category", value: "ENVIRONMENT" },
  { id: "issue", value: "Issue #42" },
  { id: "page", value: "Page 18" },
];
```

## Verification (end-of-implementation gate)

1. `pnpm tsc --noEmit` clean
2. `pnpm lint` clean (1 pre-existing rich-card warning OK)
3. `pnpm build` clean — `/components/article-meta-01` prerendered
4. SSR smoke — `HTTP 200`, all 5 demo tab triggers present, default tab content rendered
5. Manifest entry present, `/components` index lists the new entry
6. Registry artifacts at `public/r/article-meta-01.json` + `public/r/article-meta-01-fixtures.json`

## Risks / known unknowns

1. **Items array reference instability** — if the consumer creates `items={[...]}` inline on every render, memoization defeats. Document in guide; same caveat as `thumb-list-01`.
2. **Long values + narrow viewport** — wrap behavior is graceful (multi-line) but if a single value is wider than the viewport, it overflows. Out of scope for v0.1; consumer responsibility to truncate or use shorter values.
3. **Icon-only items** — if an item has an icon but no `ariaLabel` and the value is empty/whitespace, screen readers get nothing. Edge case; documented in guide.

## Bundle envelope

Component code only:
- `article-meta-01.tsx` ~50 LOC
- `parts/meta-item.tsx` ~45 LOC
- `types.ts` ~20 LOC
- Total: ~115 LOC TSX

Estimated minified: ~2.5KB. Under the ≤ 3KB envelope.

## Out of plan (deferred to v0.2 if needed)

- `separator?: ReactNode | "dot" | "pipe"` — separator characters between items
- `renderItem?: (item) => ReactNode` — full custom render slot
- `density?: "compact" | "default" | "loose"` — preset gap shortcuts (currently use `gapClass`)
- Item tooltips via shadcn Tooltip
