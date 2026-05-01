# content-card-news-01 — procomp plan

> Stage 2: how. The implementation contract.
>
> See [`content-card-news-01-procomp-description.md`](./content-card-news-01-procomp-description.md) for the what & why.
>
> **Migration origin:** [`docs/migrations/content-card-news-01/`](../../migrations/content-card-news-01/) — see [`analysis.md`](../../migrations/content-card-news-01/analysis.md) for the design-DNA inventory + 16 numbered rewrite items + dependency audit.

## Final API

### Public types

```ts
// src/registry/components/data/content-card-news-01/types.ts

export type ContentCardNewsVariant =
  | 'featured'
  | 'large'
  | 'medium'
  | 'small'
  | 'list';

export interface ContentCardItem {
  /** Stable identifier. Used for React keys and the default ariaLabel. */
  id: string;
  /** Headline. Rendered in the H-tag appropriate for the variant. Required. */
  title: string;
  /** Image URL. Required. */
  image: string;
  /** Short summary or lead paragraph. Optional — variants gracefully omit. */
  excerpt?: string;
  /** Category / tag string. Used as a key into `categoryStyles`. Optional. */
  category?: string;
  /** Author / byline. Optional. */
  author?: string;
  /** Publish date. ISO-8601 string or Date. Optional. */
  date?: string | Date;
  /** Estimated read time in minutes. Optional. */
  readTime?: number;
  /** View count for engagement chip. Optional — only `medium` renders this. */
  views?: number;
}

export interface ContentCardNewsLabels {
  /** Featured-variant CTA label. Default: 'Read More'. */
  readMore?: string;
  /** Compact "min" suffix for `large` variant. Default: 'min'. */
  minutesShort?: string;
  /** Long "min read" suffix for `featured` variant. Default: 'min read'. */
  minutesRead?: string;
  /** Visually-hidden label prefix on the link. Default: 'Read article:'. */
  readArticlePrefix?: string;
  /** aria-label suffix on the views chip. Default: 'views'. */
  viewsLabel?: string;
}

export interface ContentCardNewsProps {
  /** The item to render. */
  item: ContentCardItem;

  /** Visual variant. Default: 'medium'. */
  variant?: ContentCardNewsVariant;

  // ─── Navigation ──────────────────────────────────────────────────────
  /** URL the card links to. */
  href?: string;
  /** Click handler, fired before navigation if href is also set. */
  onClick?: (item: ContentCardItem, event: React.MouseEvent) => void;
  /** Element used for the link. Default: 'a'. Pass NextLink / RemixLink / etc. */
  linkComponent?: React.ElementType;

  // ─── Formatting ──────────────────────────────────────────────────────
  /** Custom relative-time formatter. Default: English ("Today" / "N days ago" / etc). */
  formatRelativeTime?: (date: Date, now?: Date) => string;
  /** Custom absolute-date formatter. Default: browser locale long format. */
  formatDate?: (date: Date) => string;
  /** Localized labels. Defaults are English. */
  labels?: ContentCardNewsLabels;

  // ─── Theming ─────────────────────────────────────────────────────────
  /** Map of category → Tailwind class string. Default: empty (falls to bg-muted). */
  categoryStyles?: Record<string, string>;
  /** Override classes for the title (e.g. swap font-serif → font-sans). */
  titleClassName?: string;
  /** Override classes for the image (e.g. change aspect-ratio per variant). */
  imageClassName?: string;
  /** Override classes for the root <article>. */
  className?: string;

  // ─── Accessibility ───────────────────────────────────────────────────
  /** Override the link's accessible name. Default: '<readArticlePrefix> <title>'. */
  ariaLabel?: string;

  // ─── Nested interactives (overlay-link pattern) ──────────────────────
  /** Optional cluster of buttons/links that sit ABOVE the link overlay. */
  actions?: React.ReactNode;

  // ─── Performance ─────────────────────────────────────────────────────
  /** Image loading strategy. Default: 'lazy' (except 'featured' which defaults 'eager'). */
  loading?: 'lazy' | 'eager';
}
```

### Exported names

```ts
// src/registry/components/data/content-card-news-01/index.ts

export { default as ContentCardNews01 } from './content-card-news-01';

export type {
  ContentCardItem,
  ContentCardNewsLabels,
  ContentCardNewsProps,
  ContentCardNewsVariant,
} from './types';
```

### No generics

The card uses `ContentCardItem` directly, not `<T extends ItemBase>`. Generic shape was considered and rejected — strict shape is more ergonomic for the 99% case (consumers `.map(raw => mapToContentCardItem(raw))` once before render). Power users still customize via `titleClassName` / `imageClassName` / `categoryStyles` / `actions`.

---

## File-by-file plan

14 files total. Sealed-folder convention.

```
src/registry/components/data/content-card-news-01/
├── content-card-news-01.tsx     # 1
├── parts/
│   ├── featured.tsx             # 2
│   ├── large.tsx                # 3
│   ├── medium.tsx               # 4
│   ├── small.tsx                # 5
│   └── list.tsx                 # 6
├── hooks/
│   └── use-relative-time.ts     # 7
├── lib/
│   └── format-default.ts        # 8
├── types.ts                     # 9
├── dummy-data.ts                # 10
├── demo.tsx                     # 11
├── usage.tsx                    # 12
├── meta.ts                      # 13
└── index.ts                     # 14
```

### 1. `content-card-news-01.tsx` — root component

- Wrapped in `React.memo`.
- Resolves all defaults (formatters, labels, link component, loading strategy).
- Computes a unique `titleId` via `React.useId()` for `aria-labelledby` on the link overlay.
- Dispatches to the appropriate `parts/<variant>.tsx` based on `variant` prop.
- Each part receives:
  - `item` (the raw item)
  - `formattedDate` (string, or undefined)
  - `formattedRelativeTime` (string, or undefined)
  - `categoryStyle` (resolved Tailwind class string)
  - `labels` (fully merged with defaults)
  - `linkComponent`, `href`, `onClick`, `ariaLabel`, `titleId`
  - `titleClassName`, `imageClassName`, `className`
  - `actions`, `loading`
- Memoization: `React.memo` with default referential prop comparison; consumers pass stable item refs.

### 2. `parts/featured.tsx` — full-bleed hero card

- `<article className="relative group h-125 md:h-150 rounded-2xl overflow-hidden">`
- `<img>` absolute-positioned, full size, with `transition-transform duration-700 motion-safe:group-hover:scale-105`
- Gradient overlay div: `<div class="absolute inset-0 bg-linear-to-t from-black via-black/50 to-transparent" />`
- Link overlay: `<linkComponent href={href} aria-labelledby={titleId} className="absolute inset-0 z-0 rounded-2xl focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 outline-none" />`
- Content stack absolute-bottom-positioned in `flex flex-col justify-end p-8 md:p-12`:
  - **Badge with backdrop-blur wrapper** (the dark-bg fix): `<span className="bg-black/40 backdrop-blur-sm rounded-full inline-block w-fit mb-4"><Badge className={categoryStyle}>{category}</Badge></span>` — only when category present.
  - `<h2 id={titleId} className={cn("text-3xl md:text-4xl lg:text-5xl font-serif font-bold text-white mb-4 leading-tight", titleClassName)}>{title}</h2>`
  - Excerpt `<p className="text-white/80 text-lg md:text-xl mb-6 max-w-3xl line-clamp-3">{excerpt}</p>` — only when excerpt present.
  - Meta row: User+author / Calendar+relative-time / Clock+readTime+minutesRead / Read-More CTA right-aligned with ArrowRight (and `motion-safe:group-hover:translate-x-1`).
- `actions` slot, if present: rendered AFTER the meta row with `<div class="relative z-10 mt-4">{actions}</div>`.
- All decorative icons get `aria-hidden="true"`.

### 3. `parts/large.tsx` — 2-col horizontal

- `<article className="relative group grid md:grid-cols-2 gap-6 bg-card rounded-2xl overflow-hidden border border-border/50 transition-all duration-300 hover:shadow-xl">`
- Image column (left): `<div className="relative h-64 md:h-full min-h-75 overflow-hidden">` containing `<img>` with `motion-safe:group-hover:scale-105 duration-500`.
- Content column (right): `<div className="p-6 md:p-8 flex flex-col justify-center">`
  - Badge with `categoryStyle` + `w-fit mb-4`.
  - `<h3 id={titleId}>{title}</h3>` — `text-2xl md:text-3xl font-serif font-bold mb-3 motion-safe:group-hover:text-primary transition-colors line-clamp-2` + `titleClassName`.
  - Excerpt `<p>` — `text-muted-foreground mb-4 line-clamp-3`. Optional.
  - Meta row at bottom (`mt-auto`): `<User /> {author}` · `{relativeTime}` · `{readTime} {minutesShort}`.
- Link overlay covers whole article.
- `actions` slot below meta row, optional.

### 4. `parts/medium.tsx` — vertical with view-chip + kicker footer

- `<article className="relative group bg-card rounded-2xl overflow-hidden border border-border/50 transition-all duration-300 hover:shadow-xl h-full flex flex-col">`
- Image area: `<div className="relative h-48 overflow-hidden">`
  - `<img>` with `motion-safe:group-hover:scale-105 duration-500`
  - Badge top-left: `<div className="absolute top-4 left-4"><Badge className={categoryStyle}>{category}</Badge></div>` (no backdrop-blur — light card surface beneath, badge's `bg-X/10` is fine)
  - View chip bottom-right (only when `views` present): `<div className="absolute bottom-4 right-4 flex items-center gap-1 bg-black/60 backdrop-blur-sm rounded-full px-2 py-1 text-xs text-white" aria-label="{views} {viewsLabel}"><Eye aria-hidden /> {views}</div>`
- Content area: `<div className="p-6 flex-1 flex flex-col">`
  - `<h3 id={titleId}>{title}</h3>` — `text-xl font-serif font-bold mb-2 motion-safe:group-hover:text-primary transition-colors line-clamp-2`
  - Excerpt `<p>` with `flex-1` — pushes footer to the bottom.
  - **Kicker footer** (the editorial micro-pattern): `<div className="flex items-center justify-between text-xs text-muted-foreground mt-auto pt-4 border-t border-border/50">` containing `{author}` + `{relativeTime}`. Both optional; if both missing, footer omitted.
- Link overlay covers whole article.
- `actions` slot above the kicker footer, optional.

### 5. `parts/small.tsx` — horizontal thumb tile

- `<article className="relative group flex gap-4 p-4 bg-card rounded-xl border border-border/50 transition-all duration-300 hover:shadow-md">`
- Image left: `<img className="w-24 h-24 rounded-lg object-cover shrink-0">` (no scale-on-hover — small thumb, scale is awkward).
- Content right: `<div className="flex flex-col justify-center min-w-0">` (the `min-w-0` is critical — allows `line-clamp-2` to truncate properly inside a flex child).
  - Badge with `text-xs` size: `<Badge className={cn(categoryStyle, "w-fit mb-2 text-xs")}>{category}</Badge>`
  - `<h4 id={titleId}>{title}</h4>` — sans, `font-semibold text-sm motion-safe:group-hover:text-primary transition-colors line-clamp-2`
  - `{relativeTime}` as `<span className="text-xs text-muted-foreground mt-1">`
- Link overlay covers whole article.
- No actions slot for small (intentional — too compact for nested buttons).

### 6. `parts/list.tsx` — full-width list row

- `<article className="relative group flex gap-4 py-4 border-b border-border/50 last:border-0 transition-colors hover:bg-muted/30 rounded-lg px-2">`
- Content left: `<div className="flex-1 min-w-0">`
  - Top meta row: `<Badge variant="outline" className="text-xs">{category}</Badge>` + `<span>{relativeTime}</span>` (uses outline variant — list rows are visually quieter than card variants).
  - `<h4 id={titleId}>{title}</h4>` — `font-semibold motion-safe:group-hover:text-primary transition-colors line-clamp-1`
  - Compact excerpt `<p className="text-sm text-muted-foreground line-clamp-1 mt-1">` — only when excerpt present.
- ArrowRight chevron right: `<ArrowRight aria-hidden className="w-4 h-4 text-muted-foreground motion-safe:group-hover:text-primary motion-safe:group-hover:translate-x-1 transition-all shrink-0 self-center" />` — `self-center` (not `mt-2`) so the chevron stays vertically centered regardless of content-height variation across rows.
- Link overlay covers whole article.
- `actions` slot replaces the chevron when present (consumer composes their own affordance).

### 7. `hooks/use-relative-time.ts` — default formatter

```ts
export const defaultRelativeTime = (date: Date, now: Date = new Date()): string => {
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  return date.toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' });
};
```

Pure function. No React state. Consumer overrides via `formatRelativeTime` prop. Exported as a named export so consumers can compose with it (e.g., wrap with their i18n).

### 8. `lib/format-default.ts` — default date formatter

```ts
export const defaultDateFormat = (date: Date): string =>
  date.toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' });
```

Browser-locale aware. Exported as named export.

### 9. `types.ts`

Already shown above. All 4 public types + the variant union.

### 10. `dummy-data.ts`

8 items, English-localized, mix of fields populated to demo the soft-fail behavior. One item with `featured: true` (drives the "Composed" demo tab). All 6 categories present so the categoryStyles sample map has full coverage.

```ts
export const dummyContentCardItems: ContentCardItem[] = [
  { id: '1', title: 'Turkey\'s Green City Transformation: 2025 Targets Announced', /* ...all fields */ },
  // ...
];

export const dummyCategoryStyles: Record<string, string> = {
  'Urban Development': 'bg-primary/10 text-primary',
  // Pro-ui has no --success token; demo uses Tailwind's emerald palette directly.
  'Sustainability': 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  'Technology': 'bg-accent/10 text-accent-foreground',
  'Events': 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
  'Announcement': 'bg-destructive/10 text-destructive',
  'Research': 'bg-secondary text-secondary-foreground',
};
```

### 11. `demo.tsx`

7-tab demo: **5 variants** (one tab each — Featured / Large / Medium / Small / List) + **Composed** + **Actions slot**. Built with shadcn `Tabs`. Each variant tab renders the appropriate variant(s) over the dummy data. The **Composed** tab shows the full magazine shape: 1 featured (full-width) + a 12-col grid below where the main column (`col-span-8`) holds 1 large + 4 medium in a 2-up sub-grid, and the sidebar (`col-span-4`) holds 4 list rows — proves the 5-variant set composes. The **Actions slot** tab demonstrates the overlay-link pattern with a `CardActions` component (Bookmark + Share buttons) passed via `actions={...}`; clicks `e.preventDefault()` + `e.stopPropagation()` to prove the buttons don't trigger the link overlay's navigation.

### 12. `usage.tsx`

Code blocks + prose covering: minimal usage, all 5 variants, polymorphic root with NextLink, custom categoryStyles, custom labels for i18n, `actions` slot for nested interactives, soft-fail with missing fields, custom formatRelativeTime.

### 13. `meta.ts`

```ts
import type { ComponentMeta } from '@/registry/types';

export const contentCardNews01Meta: ComponentMeta = {
  slug: 'content-card-news-01',
  name: 'Content Card (News 01)',
  category: 'data',
  status: 'alpha',
  version: '0.1.0',
  description: 'Magazine-style content card with 5 variants (featured / large / medium / small / list) for news, blog, or editorial layouts. Polymorphic root, soft-fail item shape, overlay-link pattern, fully customizable.',
  // updated, dependencies, tags, …
};
```

### 14. `index.ts`

Public exports as shown above.

---

## Dependencies

### Internal (pro-ui)

- `@/components/ui/badge` — shadcn Badge primitive (already shipped)
- `@/lib/utils` — `cn()` helper

### NPM

- `react` — runtime + types (already in pro-ui)
- `lucide-react` — icons (`Calendar`, `Clock`, `User`, `ArrowRight`, `Eye`). Already in pro-ui.

### Forbidden (not added)

- `next/*` — registry rule
- `framer-motion` — pro-ui Motion mandate uses CSS transitions
- Date library (date-fns / dayjs / luxon) — native Date is sufficient for the simple format

### Pro-ui-wide additions (non-component)

- **`--font-serif` CSS variable** in [`src/app/globals.css`](../../../src/app/globals.css) `@theme inline` block (alongside `--font-sans` / `--font-mono` / `--font-heading`):
  ```css
  --font-serif: var(--font-playfair-display), "Lora", ui-serif, Georgia, serif;
  ```
- **Playfair Display font load** via `next/font/google` in [`src/app/layout.tsx`](../../../src/app/layout.tsx):
  ```ts
  import { Playfair_Display } from 'next/font/google';
  const playfairDisplay = Playfair_Display({
    subsets: ['latin', 'latin-ext'],
    weight: ['400', '700'],
    display: 'swap',
    variable: '--font-playfair-display',
  });
  // Apply on <html className={`${onest.variable} ${jetbrainsMono.variable} ${playfairDisplay.variable} ...`}>
  ```
- **Latin Extended subset** is the key — covers Turkish characters (Ş, Ü, Ğ, Ö, Ç, İ). Onest is also bumped to include `latin-ext` for consistency.

---

## Composition pattern

**Headless wrapping + presentational parts.** Root component owns:
- Prop normalization (defaults, formatters)
- `useId` for the title's `id`
- Memoization
- Variant dispatch

Each `parts/<variant>.tsx` is a stateless presentational component that renders the article markup + link overlay. No business logic in parts.

**No render-prop, no compound API.** The `variant` prop is the single dispatch axis — keeps the API surface minimal. Consumers extend via slot props (`titleClassName`, `imageClassName`, `categoryStyles`, `actions`).

**Polymorphic root** via `linkComponent: React.ElementType`. The link overlay element is `<linkComponent href={href}>` — works with `'a'`, NextLink, RemixLink, `'div'` (for non-navigable previews), etc. Type-erased to `ElementType` to avoid forcing consumers into a generic.

---

## Client vs server

**Client component** — `content-card-news-01.tsx` declares `"use client"`. Required because it uses React reconciler hooks (`useId`, `useMemo`, `useCallback`) and `React.memo`, all of which need the client runtime in Next.js App Router.

The component still SSRs fine (the demo at `/components/content-card-news-01` returns 200 with content rendered); the client boundary just means hydration applies hover/focus interactivity on the consumer side. Function-rich props (`onClick`, `formatRelativeTime`, `formatDate`, `linkComponent`) are practical to use only from a client parent — passing functions across the RSC boundary isn't supported, so a client boundary somewhere in the tree is required anyway. Putting it on the card itself keeps consumer choice simple: import the card, pass props, done.

The parts (`parts/featured.tsx` etc.) and the formatters (`hooks/use-relative-time.ts`, `lib/format-default.ts`) are pure / shared modules — no `"use client"` directive — and inherit the client boundary from the root.

---

## Edge cases

| Case | Behavior |
|---|---|
| `excerpt` undefined | Variant omits the excerpt block; following content shifts up (medium grows title-area; featured grows meta-row gap; list collapses to single-line). |
| `category` undefined | Badge omitted entirely (no empty pill). |
| `author` undefined | User+author chip in meta row omitted. |
| `date` undefined | Calendar+date chip omitted; relative-time omitted. |
| `readTime` undefined | Clock+readTime chip omitted. |
| `views` undefined | View-chip on `medium` omitted. |
| All optional fields undefined | Card renders title + image + (badge if category) + variant-appropriate spacing. Featured shows just title + image with the gradient. |
| Title very long (300 chars) | line-clamp-2 (or -3 for featured) truncates with ellipsis. Already in source. |
| Excerpt very long | line-clamp-3 (or -1 for list) truncates. |
| Image fails to load | Browser default broken-image icon. Consumers needing a placeholder render `imageClassName="bg-muted"` or wrap their own image-with-fallback in `imageClassName`. |
| `href` not provided + `onClick` not provided | No link overlay rendered; card is non-interactive (read-only preview mode). Useful for skeletons / disabled states / static lists. |
| `href` provided but `linkComponent` not provided | Plain `<a>` is used. SSR + CSR works; consumers wanting SPA navigation pass their `Link`. |
| `actions` provided | Renders with `relative z-10` above the link overlay. Each interactive child must be a `<button>` or `<a>` with `onClick={(e) => { e.stopPropagation(); ...}}` — propagation could otherwise bubble to the link overlay's click handler. **Documented in usage.tsx.** |
| RTL | Tailwind's `gap-*`, `space-*`, `flex` work in RTL via the `dir="rtl"` parent. Icon-text rows reverse correctly. ArrowRight in list/featured will need a `rtl:rotate-180` Tailwind variant — added to those parts. |
| Mobile (< 640px) | Featured uses `text-3xl` (down from md+ `text-4xl/5xl`); large stacks vertically (`md:grid-cols-2` = single col below `md`); medium/small/list already mobile-friendly. |
| Reduced motion | All `transition-transform` + `transition-colors` wrapped in `motion-safe:` Tailwind variant; card hover shadows + color shifts stay (visually distinguishable, not motion-based). |
| `prefers-color-scheme: dark` | Inherits pro-ui dark tokens (`bg-card` lifts to `oklch(0.17 0.006 250)`; `text-muted-foreground`, `border-border/50` adapt automatically). Featured gradient stays black-to-transparent (white text legible regardless of theme). |
| Two cards side-by-side, hover one | Hover effects scoped to `group` on the article; sibling card stays static. |

---

## Accessibility

### Keyboard

- The link overlay is the sole keyboard-focusable element (matches the source's behavior). Tab → focus the card; Enter → navigate (or fire onClick).
- When `actions` slot is provided, those interactive children come AFTER the link in DOM order, so Tab order: card-link → action1 → action2 → next card.
- Focus-visible ring renders on the article root via `:has(a:focus-visible)` so the visual focus state covers the whole card surface.

### ARIA

- Link uses `aria-labelledby={titleId}` pointing to the heading's `id` (computed via `useId`). The heading text is the link's accessible name.
- Decorative icons (`Calendar`, `Clock`, `User`, `Eye`, `ArrowRight` in non-list contexts): `aria-hidden="true"`.
- Views chip on `medium`: `<span aria-label="2453 views" />` with the icon and number inside as `aria-hidden`.
- Category badge color is decorative (semantic info is the label text); badge has `aria-label="Category: Sustainability"` for screen readers (color → text mapping).
- Featured-variant CTA "Read More →" is part of the link, doesn't need its own label.
- The whole card is one landmark (`<article>`), discoverable by screen-reader article-navigation.

### Focus management

- No focus-stealing, no autofocus.
- When the link is clicked, default browser navigation happens (or consumer's onClick if both supplied).

### Screen-reader semantics

- `<article>` for each card.
- Heading level varies by variant (`h2` for featured, `h3` for large/medium, `h4` for small/list). **Reasoning:** featured tends to be the page's primary article (h2 makes sense under an h1 page heading); list rows are deeply nested aside content (h4). Variants in between scale logically. Consumers can override by passing `titleClassName` (visual only) — semantic level stays variant-driven.
- Visually-hidden link prefix: the link's accessible name is by default `"Read article: <title>"` — the `Read article:` prefix comes from `labels.readArticlePrefix` (visually hidden via the link being `inset-0` overlay with no text content; the announcer reads the heading via `aria-labelledby`).

### WCAG 2.1 AA target

- ✅ 1.4.3 Contrast — all default text/bg pairs meet 4.5:1 (lime+near-black, white+gradient overlay-with-via-50%, etc.); category badges' `bg-X/10 text-X` combos are pre-validated by pro-ui's token system.
- ✅ 1.4.11 Non-text Contrast — focus-visible ring is `ring-2` against `ring-offset-2` background.
- ✅ 2.1.1 Keyboard — all functionality reachable via tab + enter.
- ✅ 2.4.4 Link Purpose — link's accessible name includes article title.
- ✅ 2.4.7 Focus Visible — `focus-visible:ring-*`.
- ✅ 2.5.3 Label in Name — accessible name matches visible heading.
- ✅ 3.3.1 N/A — no form errors (no form).
- ✅ 4.1.2 Name, Role, Value — `<article>` + `<a>` + `<h*>` + `aria-labelledby` correct.

---

## Verification checklist (mirrors component-guide §13)

- [ ] `pnpm tsc --noEmit` clean (no any, no unknown, props strict).
- [ ] `pnpm lint` clean (no new warnings; pre-existing rich-card warning OK).
- [ ] `pnpm build` clean — all routes prerendered including `/components/content-card-news-01`.
- [ ] SSR `curl -s http://localhost:3000/components/content-card-news-01` returns 200 with all 7 demo tab triggers rendered (Featured / Large / Medium / Small / List / Composed / Actions slot) + Featured tab default content visible.
- [ ] `/components` index lists the new entry (manifest registration verified).
- [ ] Visual sanity: 5 variants render at expected sizes; featured backdrop-blur badge readable; medium kicker footer separator visible; list chevron animates on hover (when not reduced-motion).
- [ ] Latin Extended chars render in Playfair Display (verify with a Turkish-content demo item).

### Manual browser smoke (post-merge, recommended)

- Tab to a card — focus-visible ring covers the whole card, not just the link rectangle.
- Click anywhere on card surface — navigates.
- With `actions` slot demo: click a button — DOES NOT navigate.
- Tab through a card with `actions` — link → action1 → action2 → next card.
- Toggle OS reduced-motion — image scale + arrow translate disabled; hover shadow + color shift still happen.
- Toggle dark mode — all cards adapt; gradient overlay still legible.
- Resize from desktop to mobile — featured shrinks correctly; large stacks vertically.
- Set `--font-serif` to a different font in DevTools at the page root — title font swaps.

---

## Risks & alternatives

### Risk 1: Overlay-link pattern + nested `actions` event-bubbling

If a consumer's `actions` button doesn't `stopPropagation`, a click on the button could bubble to the `<article>` and the link overlay's default handler (browser navigation). **Mitigation:** documented in `usage.tsx` with explicit example showing `e.stopPropagation()` + the recommendation to use `<button>`-as-action (which doesn't trigger link navigation by default since stopPropagation isn't strictly required for click events on a sibling button — only for descendants of the link element). **Tested in the demo's "Actions slot" tab** with a Bookmark + Share button cluster; both call `e.preventDefault()` + `e.stopPropagation()` and toggle local state without navigating.

### Risk 2: `actions` z-index conflicts

If a consumer's action button uses `z-{higher}` for its own internal layering (dropdown, tooltip), it may be invisible if both the `actions` container and the consumer's internal element fight z-indices. **Mitigation:** document in usage.tsx. The card's link overlay is `z-0`, actions are `z-10`. Anything above 10 wins. Real-world dropdowns/tooltips use Radix portals which escape the stacking context entirely — non-issue in practice.

### Risk 3: Image without `width`/`height` causes CLS

Browsers calculate aspect-ratio from `width`/`height` HTML attributes (or `aspect-ratio` CSS). Without either, images cause layout shift while loading. **Mitigation:** all 5 variant parts apply `aspect-ratio` via Tailwind classes (`aspect-square` on small, `aspect-video` could be added to medium, etc.) OR set explicit container dimensions (`h-48`, `h-64 md:h-full`, `h-125 md:h-150`). Container-driven dimensions sidestep needing `width/height` attrs.

### Risk 4: Playfair Display fails to load

The font import is via `next/font/google`. If Google Fonts is unreachable at build time, the build fails. **Mitigation:** `display: 'swap'` ensures fallback fonts (Lora, ui-serif, Georgia) render immediately while Playfair loads. Build-time Google Fonts unreachability is a Next.js general issue, not card-specific. Acceptable.

### Risk 5: Overlay-link pattern breaks Cmd+Click "open in new tab"

The link overlay IS a real `<a>` with `href`, so Cmd+Click / Ctrl+Click correctly opens the article in a new tab. **Verified pattern** — used widely in production sites (NYT, Verge, Vox).

### Alternatives considered

1. **Compound API** (`<NewsCard.Image>`, `<NewsCard.Title>`, `<NewsCard.Footer>`). Rejected — variants vary too much in structure (featured stacks differently from list); compound API fights the variant system.
2. **Single image-top-content-bottom variant + container queries**. Rejected — container queries can't replicate the 5-variant set's structural variance (featured's overlaid text vs. list's chevron + truncated row).
3. **Generic over item shape** (`<ContentCardNews01<T>>`). Rejected — strict shape is more ergonomic; users can map to it cheaply. Generic adds complexity without enabling new use cases.
4. **No overlay-link pattern, simple Link wrap** (the v0.2 deferral that was overridden). User pulled forward to v0.1 — implemented per analysis item #10.
5. **CSS-Modules per part vs. Tailwind utilities inline**. Rejected — pro-ui's house style is Tailwind utilities. Consistent with all 8 prior pro-ui ships.

### Open follow-ups (post v0.1.0)

- v0.2: skeleton companion (`<ContentCardNews01.Skeleton variant="medium" />`).
- v0.2: `onCategoryClick` prop for filterable category badges.
- v0.2: built-in image-with-fallback (currently consumer's responsibility via `imageClassName`).
- v0.3: a 6th variant (e.g., `compact-row` — list variant with a thumbnail).
- v0.3: video-card sibling (`media-card-news-01` or similar).
