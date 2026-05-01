# article-meta-01 — migration analysis

> Extraction pass for [`docs/migrations/article-meta-01/`](./). Filled by the assistant after reading [`original/news-detail-page.tsx`](./original/news-detail-page.tsx) and [`source-notes.md`](./source-notes.md). Reviewed and signed off by user before the procomp gate begins.
>
> Pipeline: [`docs/migrations/README.md`](../README.md).

## Design DNA to PRESERVE

1. **Horizontal flex-wrap layout** — `flex flex-wrap items-center gap-6` reads cleanly at any width; wraps to multi-line gracefully on narrow viewports.
2. **Per-item icon + value pairing** — `flex items-center gap-2` with a lucide-style icon prefix + value text. Compact, scannable.
3. **Subordinate chrome** — strip uses `text-muted-foreground` so it doesn't compete with the article title.
4. **Icon sizing** — `w-4 h-4` matches body-text x-height. Don't oversize.
5. **Bottom border separator (optional)** — `pb-8 border-b border-border` cleanly separates the meta strip from article body. Should be opt-in (consumer drives via prop) since not every consumer wants the divider.
6. **No labels** — just icon + value. The icons carry semantic meaning; redundant labels would clutter.

## Structural debt to REWRITE

1. **Inline JSX with no boundaries** — block lives directly inside `<article>` in `page.tsx`. Rewrite as sealed-folder pro-comp.
2. **Hardcoded set of 4 fixed fields** (author / date / read-time / views) — must be a data-driven `items` array.
3. **Hardcoded icons** — each item must accept its own icon via `icon?: ComponentType<{ className?: string }>`.
4. **Hardcoded value-formatting strings** (`"dk okuma"`, `"görüntülenme"`) — value rendered as `ReactNode`, consumer brings pre-formatted values.
5. **`formatDate(news.date)` foreign import** — drop. Items just carry `value: ReactNode` already-formatted.
6. **No clickable items** — each item must accept optional `href` + use the polymorphic `linkComponent: ElementType` slot.
7. **Not memoized** — wrap default export in `React.memo`.

## Dependency audit

| Dep | Source uses | Plan |
|---|---|---|
| `react` | yes | yes |
| `lucide-react` | `User`, `Calendar`, `Clock`, `Eye` | yes — declared dep, but icons are CONSUMER-supplied per item; demo uses Lucide |
| `@/components/ui/*` | none | not needed |
| `@/lib/utils` (`cn`) | no | yes — class merging |
| `next/link` | no | not used directly; polymorphic slot |

No new shadcn primitives. Smallest dep footprint of any pro-comp shipped to date.

## Dynamism gaps

1. `items: ArticleMetaItem[]` — required. Each item:
   ```ts
   { id: string; icon?: ComponentType; value: ReactNode; href?: string; ariaLabel?: string }
   ```
2. `linkComponent?: ElementType` — default `"a"`.
3. `divider?: boolean` — default `false`. When `true`, applies `pb-8 border-b border-border` to the root.
4. `align?: "start" | "center" | "end"` — default `"start"`. Maps to `justify-{start|center|end}`. Useful for centered meta lines on hero-overlay layouts.
5. `gapClass?: string` — default `"gap-6"`. Override for tighter/looser spacing without forking class merging.
6. `className?` (root), `itemClassName?`, `iconClassName?`.

## Optimization gaps

1. **Memoization** — wrap default export in `React.memo`. Pure for given props; items array reference equality matters (consumers should memoize the array if it's computed inline).
2. **Stable handlers** — none in v0.1.
3. **No SSR concerns** — entirely server-renderable.
4. **No event listeners** — pure render.

## Accessibility gaps

1. **Item icons must be `aria-hidden="true"`** — they're decorative; the value text carries semantic meaning. (Source has no a11y on the icons; we'll add.)
2. **Optional `ariaLabel` per item** — for icon-only items where the icon meaning is non-obvious. (E.g., `<Eye />` for view count — sighted users get it; SR users benefit from "12.4k views" being announced as a single labeled unit.)
3. **`<ul>` / `<li>` semantics** — the source uses bare `<div>`s. Switch to `<ul role="list">` + `<li>` for free list semantics. Drop `role="list"` since `<ul>` already has it; explicit role kept only as a Safari workaround if `list-style: none` is applied (it is — Tailwind reset). Keep it as `role="list"` to fix the Safari VoiceOver `<ul>+list-style:none` bug.
4. **No clickable-item a11y treatment needed beyond the link itself** — the link wraps the icon + value, accessible name composes from `value` + `ariaLabel?`.
5. **Group landmark not needed** — the strip is sub-section content, not a landmark. No `aria-label` on the root.

## Proposed procomp scope

**Slug:** `article-meta-01`
**Category:** `data` (matches `thumb-list-01` — data-display surfaces).
**Status:** alpha 0.1.0.

**Files (~7):**
- `article-meta-01.tsx` — root, memoized
- `parts/meta-item.tsx` — single icon + value + optional link
- `types.ts` — `ArticleMetaItem` + props
- `dummy-data.ts` — 3 sample meta sets (full / minimal / clickable)
- `demo.tsx` — 5 sub-tabs
- `usage.tsx`, `meta.ts`, `index.ts` — standard

**Public API draft:**

```ts
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
  divider?: boolean;                  // default false
  align?: "start" | "center" | "end"; // default "start"
  gapClass?: string;                  // default "gap-6"
  className?: string;
  itemClassName?: string;
  iconClassName?: string;
}
```

**Bundle envelope:** ≤ 3KB component code (smallest pro-comp shipped).

## Recommendation

**Ship as a standalone pro-component.** Trivially small, universally applicable. Migration is mechanical (one inline block → 7-file sealed folder). Once shipped, slots into the article column of any blog/news/doc/video/podcast page, the centered meta line under any hero, the byline strip on any team-page entry. Sibling to `author-card-01` / `thumb-list-01` — same family rhythm of universal extractions from kasder content.

**No open calls.** Decisions are clear from source + sibling conventions.
