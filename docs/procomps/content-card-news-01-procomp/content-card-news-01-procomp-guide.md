# content-card-news-01 — procomp guide

> Stage 3: how to use it. Authored alongside the implementation.
>
> See [`content-card-news-01-procomp-description.md`](./content-card-news-01-procomp-description.md) for *why* and [`content-card-news-01-procomp-plan.md`](./content-card-news-01-procomp-plan.md) for *how*.

## When to use

- News / blog / editorial / documentation feeds where the same item shape needs to render at different visual densities (hero on top, grid in main column, list in sidebar).
- Magazine landing pages where featured + main + sidebar layouts compose by swapping `variant`.
- Card-style article previews on a marketing site, internal portal, or release notes page.
- Any place you have an item with `id` + `title` + `image` and want a polished, stylable preview.

## When NOT to use

- **Tabular data** — use `data-table`.
- **Tree-structured content** with editing — use `rich-card`.
- **Article body / full prose page** — that's `detail-page-news-01` (deferred sibling).
- **Cards with deeply nested editable surfaces** (forms inside cards) — the overlay-link pattern can complicate text selection inside form fields. Use a custom non-link card composition instead.
- **Cards with multiple discrete actions as the primary interaction** (e.g. "Approve / Reject / Defer" on each row) — the card surface should not navigate; build a custom `<article>` without the link overlay.

## Composition patterns

### Magazine layout (the canonical use case)

```tsx
<div className="space-y-8">
  <ContentCardNews01 item={featured} variant="featured" href={`/news/${featured.id}`} />
  <div className="grid gap-6 lg:grid-cols-12">
    <div className="space-y-6 lg:col-span-8">
      <ContentCardNews01 item={lead} variant="large" href={`/news/${lead.id}`} />
      <div className="grid gap-6 md:grid-cols-2">
        {middleArticles.map(item => (
          <ContentCardNews01 key={item.id} item={item} variant="medium" href={`/news/${item.id}`} />
        ))}
      </div>
    </div>
    <aside className="lg:col-span-4">
      <div className="rounded-2xl border bg-card p-4">
        {topPopular.map(item => (
          <ContentCardNews01 key={item.id} item={item} variant="list" href={`/news/${item.id}`} />
        ))}
      </div>
    </aside>
  </div>
</div>
```

The 5-variant set is a deliberate vocabulary — featured / large / medium / small / list. Mix freely.

### Sidebar "popular" / "related" lists

`variant="list"` rows live well inside any container. The chevron + truncated excerpt + relative date is calibrated for `~300px` widths.

### With Next.js (or other framework Link)

```tsx
import NextLink from "next/link";

<ContentCardNews01
  item={item}
  variant="medium"
  href={`/news/${item.id}`}
  linkComponent={NextLink}
/>
```

The `linkComponent` defaults to `'a'` (plain anchor — works SSR + CSR fine). Pass your framework's link to opt into SPA navigation.

### With nested actions (overlay-link pattern)

```tsx
<ContentCardNews01
  item={item}
  variant="medium"
  href={`/news/${item.id}`}
  actions={
    <div className="flex gap-2">
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          bookmark(item.id);
        }}
        aria-label="Bookmark"
      >
        <Bookmark />
      </button>
      <button
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); share(item); }}
        aria-label="Share"
      >
        <Share2 />
      </button>
    </div>
  }
/>
```

The `actions` cluster gets `position: relative; z-index: 10`, sitting above the `<a>` overlay. The buttons have their own click handlers; `stopPropagation` keeps the click from bubbling to the link.

### Without navigation (read-only preview)

```tsx
<ContentCardNews01 item={item} variant="medium" />
```

When `href` is omitted, the link overlay isn't rendered. Card becomes a non-interactive `<article>` — useful for skeletons, disabled states, or static lists.

## Gotchas

### Action buttons must `stopPropagation`

Inside an action button's `onClick`, call `e.preventDefault()` + `e.stopPropagation()` so the click doesn't bubble to the article and trigger the link overlay's default navigation. The Demo's "Actions slot" tab includes the working example. Forgetting `stopPropagation` will navigate-and-click simultaneously — Cmd-click also opens a new tab.

### `categoryStyles` should be a stable reference

In long feeds, the card is `React.memo`'d. Inline-creating a `categoryStyles` map per render breaks memoization (new reference every render = always re-render). Hoist it out of the render or memoize:

```tsx
// Hoist outside component
const categoryStyles = { Sustainability: "...", /* ... */ };

// Or memoize inside
const categoryStyles = useMemo(() => ({ /* ... */ }), []);
```

### Image lazy-loading defaults differ by variant

`featured` defaults to `loading="eager"` (it's typically above-the-fold and the LCP element). All other variants default to `loading="lazy"`. Override via the `loading` prop:

```tsx
<ContentCardNews01 item={item} variant="medium" loading="eager" />
```

### `font-serif` falls back gracefully

If Playfair Display fails to load (Google Fonts down at build, network unreachable), the title falls back to the rest of the `--font-serif` chain (`Lora`, `ui-serif`, `Georgia`, `serif`). The `display: 'swap'` in the next/font config ensures fallback fonts render immediately while Playfair loads.

### Featured-variant badge backdrop-blur is automatic

Don't try to override the dark-bg badge wrapper; it's built into `parts/featured.tsx` because the dark gradient overlay would otherwise render `bg-success/10` etc. illegibly. If you need a different category-badge treatment on featured, pass `categoryStyles` keys with explicit dark-bg-friendly classes (e.g. `bg-emerald-600 text-white`).

### `min-w-0` matters in flex contexts

The `small` and `list` variants use `min-w-0` on the content container so `line-clamp-*` works correctly inside flex children. If you wrap a card in a flex layout that *also* truncates, double-check the parent's `min-w-0`.

### RTL support is basic

ArrowRight / chevron icons flip via `rtl:rotate-180`. Other layout choices (image left, content right in `large`) follow Tailwind's writing-direction-aware utilities. If you have specific RTL design intent (e.g. you want featured's "Read More" CTA to be at the *right* in LTR but visually "trailing" still in RTL), pass a custom `className` with explicit `rtl:` overrides.

## Migration notes

This component supersedes the kasder `kas-social-front-v0` `NewsCard.tsx`. The migration:

- **Preserved:** 5-variant set, serif title typography, category-color map pattern, featured gradient overlay, eye-icon view chip on medium, kicker footer, image scale-on-hover, all spacing rhythms.
- **Rewrote:** `next/link` → `linkComponent` slot, hardcoded URL → `href` prop, Turkish strings → English defaults + `labels` prop, `tr-TR` locale → `formatRelativeTime` / `formatDate` callbacks, `categoryColors` map with Turkish keys → `categoryStyles` prop, `NewsType` → `ContentCardItem` (soft-fail optional fields), single-`Link`-wrap → overlay-link pattern with `actions` slot, no React.memo → memoized, no focus-visible ring → full-card focus ring, hardcoded image attributes → lazy + decoding-async + per-variant aspect ratios, no `motion-safe:` → all transitions wrapped.
- **Added:** `actions` slot for nested interactives, `--font-serif` global token (Playfair Display default), backdrop-blur badge wrapper on featured for dark-bg legibility.

The original lives in [`docs/migrations/content-card-news-01/original/`](../../migrations/content-card-news-01/original/) for historical reference; never imported.

## Open follow-ups

### v0.2 candidates

- **Skeleton companion** (`<ContentCardNews01.Skeleton variant="medium" />`) for loading states matching each variant's shape.
- **`onCategoryClick`** prop for filterable category badges (would require lifting the badge OUT of the link overlay).
- **Image-with-fallback** built-in (currently consumer's responsibility via `imageClassName`).

### v0.3 candidates

- 6th variant (`compact-row` — list with thumbnail) for medium-density tables.
- Sibling `media-card-news-01` for video / podcast preview cards.
- Theme-aware view-chip (currently always `bg-black/60` regardless of theme).

### Known limitations

- **No virtualization** at the card level — that's the layout's job (`grid-layout-news-01` will support `virtualize: 'auto'` when it ships).
- **No browser test runner** — verification is demo-driven. Pure modules (`defaultRelativeTime`, `defaultDateFormat`) are trivially testable when Vitest lands.
- **Text-selection inside the card** can be awkward because the link overlay sits above text. Click-and-drag to select the excerpt may register as a click-and-navigate. Workaround: select text by double-click-and-drag instead, or use the article detail page for serious copying.
