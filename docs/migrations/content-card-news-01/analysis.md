# content-card-news-01 — migration analysis

> Extraction pass for [`docs/migrations/content-card-news-01/`](./). Filled by the assistant after reading [`original/`](./original/) + [`source-notes.md`](./source-notes.md) + screenshots in [`original/screenshots/`](./original/screenshots/). Reviewed and signed off by you before the procomp gate begins.
>
> **Family context:** part of a 4-component news-domain migration (`content-card-news-01`, `page-hero-news-01`, `grid-layout-news-01`, `detail-page-news-01`-deferred). All four must be totally independent (no cross-imports), fully compatible (compose cleanly), and dynamic (props/slots/generics). This card sits in `data/` category and is consumed by `grid-layout-news-01`, but does not depend on it.
>
> Pipeline: [`docs/migrations/README.md`](../README.md).

---

## Design DNA to PRESERVE

Concrete tokens, measurements, and timings extracted from [`original/NewsCard.tsx`](./original/NewsCard.tsx) + the 2 reviewed screenshots. The implementation should reproduce these precisely.

### Typography

- **Title font: serif, bold, weight-700.** Kasder uses a clearly intentional editorial serif (visible in the featured screenshot — high-contrast strokes, slightly elongated proportions). In pro-ui this becomes `font-serif font-bold` where `font-serif` resolves to the new global `--font-serif` CSS variable (default: **Playfair Display** — recommended; high-contrast editorial face, free via Google Fonts, character matches the kasder original; Lora and Source Serif 4 are fallback candidates).
- **Title size scale (per variant):**
  - `featured`: `text-3xl md:text-4xl lg:text-5xl` + `leading-tight`
  - `large`: `text-2xl md:text-3xl`
  - `medium`: `text-xl`
  - `small`: `text-sm` + `font-semibold` (sans, not serif — small enough that serif breaks down)
  - `list`: default sans + `font-semibold` (compact row, serif overkill)
- **Body / excerpt:** Onest sans (existing pro-ui token), `text-muted-foreground`. Sizes:
  - `featured`: `text-lg md:text-xl`
  - `large` / `medium`: default body (~`text-sm`/`text-base`)
  - `small` / `list`: no body (or compact 1-line excerpt for `list`)
- **Meta row:** `text-xs` (small) → `text-sm` (large/list) → larger on featured. Always `text-muted-foreground` for light variants, `text-white/70` for featured.

### Color

- **Card frame:** `bg-card` (white in light, `oklch(0.17 0.006 250)` raised surface in dark per pro-ui mandate). Border: `border border-border/50` (subtle, doesn't compete).
- **Hover lift:** `hover:shadow-xl` on featured/large/medium, `hover:shadow-md` on small. List uses `hover:bg-muted/30` instead.
- **Featured gradient overlay:** `bg-linear-to-t from-black via-black/50 to-transparent`. The `via-black/50` is the legibility floor — the meta row sits in the dense dark portion, the title in the mid-density, the badge area is intentionally lighter (motivating the badge-contrast fix below).
- **View-chip on `medium`:** `bg-black/60 backdrop-blur-sm` rounded pill, bottom-right of image, `text-white text-xs`.
- **Category badges:** `Record<string, string>` map. Source defaults map to pro-ui tokens cleanly:
  - `Kentsel Dönüşüm` → `bg-primary/10 text-primary` (lime)
  - `Sürdürülebilirlik` → `bg-success/10 text-success` (green) — *currently underdefined in pro-ui; falls back to `success` token if present, else needs a default*
  - `Teknoloji` → `bg-accent/10 text-accent`
  - `Etkinlik` → `bg-warning/10 text-warning`
  - `Duyuru` → `bg-destructive/10 text-destructive`
  - `Araştırma` → `bg-secondary text-secondary-foreground`
- **Featured-variant badge backdrop** (NEW per screenshot review): badges render with a transparent base on the dark gradient — the `Sürdürülebilirlik` badge in the screenshot is barely legible. Solution: in `featured` (and any future dark-bg variants), wrap the badge in `<span class="bg-black/40 backdrop-blur-sm rounded-full">` so the colored badge stays readable. Source map stays single-source-of-truth; the chip wrapper is layout-aware.

### Spacing & density

| Variant | Card padding | Image dims | Border-radius | Gap rhythm |
|---|---|---|---|---|
| `featured` | `p-8 md:p-12` (overlaid on image) | `h-125 md:h-150` full-bleed | `rounded-2xl` | `mb-4`/`mb-6`, meta `gap-6` |
| `large` | `p-6 md:p-8` (right column) | `h-64 md:h-full min-h-75` (left col) | `rounded-2xl` | `mb-3`/`mb-4`, meta `gap-4` |
| `medium` | `p-6` | `h-48` (top) | `rounded-2xl` | `mb-2`/`mb-4`, footer `pt-4 border-t` |
| `small` | `p-4` | `w-24 h-24` (left thumb) | `rounded-xl` | `mb-2`, content `gap-4` |
| `list` | `py-4 px-2` | (no image; chevron right) | `rounded-lg` | meta `gap-3`, `mb-2` |

The descending density (featured → list) is the core magazine intuition. **Preserve exactly.**

### Motion

- **Image scale-on-hover:** `transition-transform group-hover:scale-105` with duration:
  - `featured`: `duration-700` (leisurely, hero-feel)
  - `large` / `medium` / `small`: `duration-500`
- **Title color shift on hover:** `group-hover:text-primary transition-colors` for light variants. Featured stays white (deliberately — the gradient overlay handles distinction).
- **ArrowRight translate (list + featured):** `group-hover:translate-x-1 transition-transform`.
- **Hover shadow ramp:** `transition-all duration-300` (the card frame as a whole responds).
- **No mount-reveal animation.** Cards just render — they're not heroes; reveal animations would fight with the scroll-driven feed.
- **`prefers-reduced-motion` respect:** all 4 motion classes wrapped in `motion-safe:` Tailwind variant; reduced-motion users get static cards. Card hover shadows + color shifts can stay (those are accessibility-neutral).

### Editorial micro-patterns to preserve

1. **5-variant set as a single API** — the `variant` prop is the value proposition. Magazine consumers compose hierarchies (hero + main + sidebar) by swapping the prop; we never make 5 separate components.
2. **Per-variant meta-row density** — featured shows User+author / Calendar+date / Clock+readtime / Devamını-Oku CTA. Large drops icons but keeps text. Medium shows author + date in a kicker footer with separator. Small shows just date. List shows category + date inline. This is the "magazine-layout intuition" baked in; preserve verbatim.
3. **Editorial kicker footer in `medium`** — `pt-4 border-t border-border/50` separator above an author-left / date-right row. Single most editorial-feeling micro-pattern in the card.
4. **Eye-icon view-count chip on `medium`** — only renders when `views` is present. Floats bottom-right of the image without blocking the title area. `bg-black/60 backdrop-blur-sm`.
5. **Category-colored badges** — each category gets its own brand tint. Single most "branded" piece of the card.
6. **List-variant ArrowRight chevron** — quiet affordance that the row is clickable; `text-muted-foreground` resting, `text-primary translate-x-1` on hover.
7. **Cards already flex across container widths** — `large` works at full row, `medium` at half row, all without internal layout changes. The "useful in different layouts" requirement (user emphasis) is satisfied at the card level; the layout work happens in `grid-layout-news-01`.

---

## Structural debt to REWRITE

Each item maps to a concrete prop / file / refactor decision.

### 1. `next/link` removal (BLOCKER for registry portability)

**Source:** `import Link from "next/link"` — forbidden in registry per [`.claude/CLAUDE.md`](../../../.claude/CLAUDE.md) "Registry conventions: Never `next/*`".

**Resolution:** `linkComponent` slot prop, defaulting to plain `<a>`. Consumers pass their framework's `Link`:

```tsx
<ContentCardNews01
  item={item}
  href={`/news/${item.id}`}
  linkComponent={NextLink}  // or remix's Link, or react-router's Link
/>
```

The card composes `<linkComponent href={href} className="...">{children}</linkComponent>` internally. Plain `<a>` works fine SSR/CSR; consumers wanting SPA navigation pass their wrapper.

### 2. Hardcoded URL `/news/${news.id}` removal

**Source:** all 5 variants hardcode `<Link href={\`/news/${news.id}\`}>`.

**Resolution:** `href` prop is required when `linkComponent` is used; `onClick` is the alternative for JS-only handlers (analytics, modal-open). Both can coexist:

```ts
href?: string;
onClick?: (item: ContentCardItem, event: React.MouseEvent) => void;
linkComponent?: React.ElementType;  // default: 'a'
```

When neither is provided, the card renders as a non-interactive `<article>` (useful for read-only previews).

### 3. Turkish strings → `labels` object

**Source:** hardcoded `"Bugün"`, `"Dün"`, `"X gün önce"`, `"X hafta önce"`, `"X dk okuma"`, `"X dk"`, `"Devamını Oku"`.

**Resolution:** two-layer approach.
- **`formatRelativeTime?: (date: Date, now: Date) => string`** — full control. Default: English implementation (`"Today"`, `"Yesterday"`, `"N days ago"`, `"N weeks ago"`, then absolute date).
- **`labels?: { readMore?: string; minutesShort?: string; minutesRead?: string }`** — convenience for the few standalone strings. Defaults: `"Read More"` / `"min"` / `"min read"`.

Together: consumers swap one string via `labels.readMore = "Devamını Oku"`, or replace the whole relative-time logic via `formatRelativeTime`. No `tr-TR` string assumptions.

### 4. `tr-TR` locale → formatter callback

**Source:** `date.toLocaleDateString('tr-TR', {...})` inside `formatDate`.

**Resolution:** `formatDate?: (date: Date) => string` prop. Default uses browser locale (`date.toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' })`). Kasder consumers pass `(date) => date.toLocaleDateString('tr-TR', {...})`.

Alternative (rejected): `locale` prop. Less flexible; can't customize format without a second prop. Stick with the formatter-callback approach.

### 5. `categoryColors` map → `categoryStyles` prop

**Source:** hardcoded `Record<string, string>` with Turkish keys.

**Resolution:** `categoryStyles?: Record<string, string>` prop, no default mapping (only `bg-muted` fallback). Consumers map their domain categories to pro-ui Tailwind classes:

```tsx
const categoryStyles = {
  "Kentsel Dönüşüm": "bg-primary/10 text-primary",
  "Sürdürülebilirlik": "bg-success/10 text-success",
  // ...
};
<ContentCardNews01 item={item} categoryStyles={categoryStyles} />
```

Demo ships a sample map matching the kasder original (acts as a usage example and documents the recommended Tailwind shape).

### 6. `NewsType` → strict `ContentCardItem` shape

**Source:** opinionated about field names (`readTime`, `views`, `featured`).

**Resolution:** strict-shape approach with most fields optional:

```ts
export interface ContentCardItem {
  id: string;
  title: string;
  image: string;
  excerpt?: string;
  category?: string;
  author?: string;
  date?: string | Date;
  readTime?: number;
  views?: number;
}
```

`id` + `title` + `image` are required (the minimum viable card). Everything else is optional and **soft-fails**: if `author` is undefined, the card omits the author meta row entry; doesn't render an empty span.

Generic `ContentCardNews01<T>` with field accessors was considered and rejected — the strict-shape API is far more ergonomic for the 99% case (consumers `.map(rawItem => mapToContentCardItem(rawItem))` once before render). Power users still have `renderItem`-style escape hatches via `titleClassName` / `imageClassName` / `categoryStyles`.

### 7. Image optimization (lazy / async / dimensions)

**Source:** `<img>` with no `loading`, no `decoding`, no `width/height`.

**Resolution:**
- `loading="lazy"` (default — featured can opt-in to `loading="eager"` via prop if it's above-the-fold).
- `decoding="async"` always.
- Per-variant `aspect-ratio` CSS — reserves space, prevents CLS during load.
- Optional `imageClassName` slot for consumer overrides.

### 8. `React.memo` wrap (perf)

**Source:** no memoization. In `grid-layout-news-01`'s 50-item infinite scroll, every search/filter/scroll keystroke re-renders all visible cards.

**Resolution:** wrap the root component in `React.memo` with default referential prop comparison. Consumers pass stable item refs (standard React pattern; documented in usage.tsx).

### 9. Focus-visible ring

**Source:** none — relies on browser default outline.

**Resolution:** add `focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 outline-none rounded-2xl` (or matching the card's radius) on the link root. Pro-ui's standard focus pattern.

### 10. Overlay-link pattern (PULLED FORWARD to v0.1 per user)

**Source:** the entire `<article>` is wrapped in `<Link>`. Locks out nested interactives (bookmark button, share button, inline category click).

**Resolution (v0.1):** heading-as-link + absolute-overlay link pattern.

```tsx
<article className="relative group ...">
  {/* The link covers the whole card via absolute inset-0 */}
  <linkComponent
    href={href}
    aria-labelledby={titleId}
    className="absolute inset-0 z-0 rounded-2xl focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 outline-none"
  />
  <img className="..." />
  <Badge>{category}</Badge>
  <h3 id={titleId} className="font-serif ...">{item.title}</h3>
  <p>{item.excerpt}</p>
  <div>{author} - {date}</div>
  {/* Nested interactives go here with z-10 to sit above the link overlay */}
  {actions && <div className="relative z-10">{actions}</div>}
</article>
```

Mechanics:
- The `<article>` becomes the hover-group root (`group` class on it, not the link).
- The link is positioned absolute over the entire article area; its accessible name comes from `aria-labelledby={titleId}`.
- A unique `titleId` per card (use `useId()`) — required because aria-labelledby needs a real DOM id.
- Other interactive children (`actions` slot, future bookmark/share buttons) get `relative z-10` to render above the link overlay.
- Focus-visible ring renders on the article root via `:has(a:focus-visible)` so the visual focus state covers the whole card, not just the invisible link rectangle.

**New prop in v0.1:**

```ts
actions?: ReactNode;  // bookmark/share/etc; rendered with z-10 above the link overlay
```

Default: no actions. The slot is opt-in; consumers without nested interactives ignore it and get the same visual result as the simple wrap.

### 11. `onClick` alternative

**Source:** no onClick; navigation is the only action.

**Resolution:** `onClick?: (item, event) => void` prop. When supplied, calls handler; if no `href` is also supplied, prevents default. When both are supplied, consumer's onClick fires before navigation (standard React pattern).

### 12. 5 inline `if` blocks → 5 sealed `parts/<variant>.tsx` files

**Source:** all 5 variants in one 200-line `NewsCard.tsx` function.

**Resolution:** sealed-folder convention.
- `parts/featured.tsx` — full-bleed hero card
- `parts/large.tsx` — 2-col horizontal
- `parts/medium.tsx` — vertical with view-chip + kicker footer
- `parts/small.tsx` — horizontal thumb tile
- `parts/list.tsx` — full-width list row with chevron

Each part receives the same `ContentCardItem` + resolved props (formatted date, formatted relative time, resolved category style, computed labels). Root `content-card-news-01.tsx` does the dispatch + memoization + link wrapping.

### 13. Soft-fail on missing fields

Already covered in (6). Plus: `readTime` undefined → omit "X dk okuma"; `views` undefined → omit eye-chip; `excerpt` undefined → omit excerpt block (medium/list adapt to taller title area); `author` undefined → omit User+name; `category` undefined → omit badge.

### 14. Image aspect-ratio override

**Source:** fixed per variant (`h-48` for medium, etc.).

**Resolution:** `imageClassName?: string` slot. Consumer-supplied utility classes win:

```tsx
<ContentCardNews01
  item={item}
  variant="medium"
  imageClassName="aspect-square"  // overrides default h-48
/>
```

Default per-variant aspect is preserved when `imageClassName` is absent.

### 15. Featured-variant badge contrast (NEW per screenshot)

**Source:** `Sürdürülebilirlik` badge with `bg-success/10 text-success` is barely legible on the dark gradient.

**Resolution:** in `parts/featured.tsx`, wrap the badge in:

```tsx
<span className="bg-black/40 backdrop-blur-sm rounded-full inline-block">
  <Badge className={resolvedCategoryStyle}>{item.category}</Badge>
</span>
```

The category color stays single-source-of-truth in `categoryStyles`; the dark-bg layout adds the backdrop chip. Pattern reused for any future dark-overlay variants.

### 16. Serif font token addition (RESOLVED in source-notes)

**Source:** `font-serif` Tailwind utility falls back to system serif in pro-ui (no custom font declared).

**Resolution:** add to [`src/app/globals.css`](../../../src/app/globals.css):

```css
@theme {
  --font-serif: "Playfair Display", "Lora", ui-serif, Georgia, serif;
}
```

Plus a `<link>` to Google Fonts (or Next.js `next/font/google` import in [`layout.tsx`](../../../src/app/layout.tsx) — the docs site's layout, not the registry component) to load Playfair Display weights 400 + 700.

**Customization (per user mandate):** consumers override at any DOM scope via `--font-serif: "Other Font"`. Card uses the Tailwind `font-serif` utility which auto-maps to the var (Tailwind v4 behavior). Optional `titleClassName` slot for per-instance class-level overrides.

**Token is global** — future news / blog / editorial content components inherit it. Not card-local.

---

## Dependency audit

### Keep

- **`react`** ✓ (registry-allowed)
- **`@/components/ui/badge`** ✓ (pro-ui shadcn primitive — already shipped)
- **`@/lib/utils`** ✓ (`cn()` helper)
- **`lucide-react`** ✓ (registry-allowed; pro-ui uses it widely). Icons used: `Calendar`, `Clock`, `User`, `ArrowRight`, `Eye`. All available in lucide-react v1.x (pro-ui's pinned version is recent enough — not Github icon, which I had to inline-SVG in the open-threads sweep).

### Drop

- **`next/link`** — replaced by `linkComponent` slot.

### Add

- **`Playfair Display` font** — load via `next/font/google` in the docs site's `layout.tsx` (not the registry component). Add `--font-serif` declaration in `globals.css` `@theme` block. Versioning: latest stable (Playfair Display is mature; Google Fonts handles updates transparently).
  - Total CSS payload: ~30KB woff2 for 400 + 700 weights with Latin Extended subset (covers Turkish characters Ş, Ü, Ç, etc.).
  - Render impact: web-fonts-loaded swap; consumers can configure via Next.js `display: "swap"` (default).

### No new runtime deps for the registry component itself

The card stays clean: react + Badge + lucide-react + cn. No date library, no animation library, no font loader (font is consumer-side via globals.css).

---

## Dynamism gaps

Translation of "things that should be a prop / slot / generic / render-prop":

| Gap | Resolution | Default |
|---|---|---|
| URL hardcoded `/news/${id}` | `href` prop + `linkComponent` slot | none — required if interactive |
| Click handling | `onClick` prop | none |
| Date format | `formatDate` callback | browser locale default |
| Relative time | `formatRelativeTime` callback | English defaults |
| Read-more / min / min-read labels | `labels` object | English defaults |
| Category colors | `categoryStyles` prop | empty (falls to `bg-muted`) |
| Item field shape | strict `ContentCardItem` shape | `id`/`title`/`image` required, rest optional |
| Title font/style override | `titleClassName` slot | uses `font-serif` |
| Image sizing/aspect override | `imageClassName` slot | per-variant default |
| Root className override | `className` slot | per-variant default |
| ARIA label on link | `ariaLabel` prop | `"Read article: <title>"` |

Every consumer-visible string, color, format, behavior, and class is overridable. Five variants × ~12 customization points = the card is "fully dynamic and useful in different layouts" per user emphasis.

---

## Optimization gaps

| Gap | Resolution |
|---|---|
| No `React.memo` | Wrap root in `memo()` with default referential comparison |
| Image not lazy | `loading="lazy"` default; `loading` prop for opt-in eager (featured above-the-fold) |
| Image not async | `decoding="async"` always |
| Image causes CLS | `aspect-ratio` CSS per variant |
| Date parsed every render | Resolved once in root, passed to part as already-formatted strings |
| categoryStyles map re-created per render | Document stable-ref expectation in usage.tsx |
| No virtualization | Not needed at card level; that's `grid-layout-news-01`'s job |

---

## Accessibility gaps

| Gap | Resolution |
|---|---|
| No focus-visible ring | `focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2` on link root |
| Decorative icons announce | `aria-hidden="true"` on Calendar/Clock/User/Eye/ArrowRight |
| Image `alt` is `title` | ✓ already correct |
| Link label is implicit | `ariaLabel` prop with default `"Read article: <title>"` |
| View count not labeled | `<span aria-label="X views">` |
| Featured-variant badge invisible | backdrop-blur chip wrapper (rewrite item 15) |
| Reduced motion not respected | `motion-safe:` prefix on transition utilities; reduced-motion users get static cards |
| List variant chevron not labeled | `aria-hidden="true"` (the row link itself is labeled) |
| Category badge has color-only meaning | `aria-label="Category: <category>"` on the badge (color is decorative, label is semantic) |

WCAG 2.1 AA target.

---

## Proposed procomp scope

**Single component, sealed-folder, 5 variant parts.** Mirrors `data-table` shape.

**NOT compound** (`<NewsCard.Header>` etc.) — too rigid for the 5-variant variation. Consumers don't compose heads/bodies; they pick a variant.

**NOT a system** — single component, no companion procomps. Future siblings (`content-card-news-02`, `content-card-product-01`) live in their own slugs.

### Folder shape

```
src/registry/components/data/content-card-news-01/
├── content-card-news-01.tsx     # root: variant dispatch, link wrap, memoization
├── parts/
│   ├── featured.tsx             # full-bleed hero variant
│   ├── large.tsx                # 2-col horizontal
│   ├── medium.tsx               # vertical w/ view-chip + kicker footer
│   ├── small.tsx                # horizontal thumb tile
│   └── list.tsx                 # list row with chevron
├── hooks/
│   └── use-relative-time.ts     # default English formatter (extracted for testability)
├── lib/
│   └── format-default.ts        # default date format
├── types.ts                     # ContentCardItem, ContentCardNewsProps, Variant union
├── dummy-data.ts                # 5 demo items (kasder shape, English-localized)
├── demo.tsx                     # 5-tab demo (one per variant) + composed grid
├── usage.tsx                    # consumer guide
├── meta.ts                      # ComponentMeta
└── index.ts                     # public API exports (ContentCardNews01 + types)
```

**File count:** 14 files (matches markdown-editor's complexity tier; well below rich-card's 50; above detail-panel's 18). On the larger side for a single procomp — driven by the 5-variant set.

### Public API

```ts
// types.ts
export type ContentCardNewsVariant =
  | 'featured' | 'large' | 'medium' | 'small' | 'list';

export interface ContentCardItem {
  id: string;
  title: string;
  image: string;
  excerpt?: string;
  category?: string;
  author?: string;
  date?: string | Date;
  readTime?: number;
  views?: number;
}

export interface ContentCardNewsProps {
  item: ContentCardItem;
  variant?: ContentCardNewsVariant;     // default 'medium'

  // navigation
  href?: string;
  onClick?: (item: ContentCardItem, event: React.MouseEvent) => void;
  linkComponent?: React.ElementType;    // default 'a'

  // formatting
  formatRelativeTime?: (date: Date, now?: Date) => string;
  formatDate?: (date: Date) => string;
  labels?: {
    readMore?: string;
    minutesShort?: string;
    minutesRead?: string;
  };

  // theming
  categoryStyles?: Record<string, string>;
  titleClassName?: string;
  imageClassName?: string;
  className?: string;

  // a11y
  ariaLabel?: string;

  // nested interactives (overlay-link pattern, v0.1)
  actions?: React.ReactNode;            // rendered with z-10 above the link overlay

  // perf
  loading?: 'lazy' | 'eager';           // default 'lazy', except featured 'eager'
}

// index.ts
export { default as ContentCardNews01 } from './content-card-news-01';
export type { ContentCardItem, ContentCardNewsProps, ContentCardNewsVariant } from './types';
```

JSX: `<ContentCardNews01 item={...} variant="featured" href="/news/1" />`. Verbose but unambiguous; future variants `02`, `03` live in own folders without name collisions.

### Demo plan

7 tabs over an 8-item English-localized fixture:
1. **`featured`** — single hero card with full meta + CTA. Shows the backdrop-blur badge fix.
2. **`large`** — 2-col horizontal. Shows the meta row without icons.
3. **`medium`** — 4 cards in a responsive grid (`md:grid-cols-2 lg:grid-cols-3`). Shows kicker footer + view-chip + grid responsiveness.
4. **`small`** — 4 cards in a 2-col grid (sidebar-like).
5. **`list`** — 5 cards in a list. Shows chevron + hover state.
6. **`Composed`** — full magazine shape: 1 featured (full-width) + 12-col grid below where main column (`col-span-8`) holds 1 large + 4 medium in a 2-up sub-grid, sidebar (`col-span-4`) holds 4 list rows. Hand-composed, not the full `grid-layout-news-01` work — proves the 5-variant set works together.
7. **`Actions slot`** — 3 medium cards each with a `CardActions` cluster (Bookmark + Share buttons) passed via the `actions` prop. Buttons call `e.preventDefault()` + `e.stopPropagation()` to prove the overlay-link pattern works (clicking a button doesn't trigger card navigation).

### Out of scope for v0.1

- Browser test runner / Vitest unit tests (whole-repo decision, not card-local)
- Markdown rendering inside excerpt (use plain text; `markdown-editor` handles markdown elsewhere)
- Social sharing / bookmark / save actions (consumer composition; out of card scope)
- Image CDN integration (`next/image` etc. — consumer's `imageClassName` slot can wrap)
- Multi-image carousel (single image only)
- Animation library integration (uses Tailwind transitions; framer-motion would be a heavyweight peer for marginal gain)

---

## Recommendation

**PROCEED to procomp gate.** Migration is well-bounded, low-risk, high-value:

- **Visual DNA is well-understood** — 5 variants, concrete tokens / spacings / motions, backed by 2 reviewed screenshots. Implementation reproduces the kasder feel without surprises.
- **Structural debt is well-defined** — 16 numbered rewrite items, each with a concrete prop/slot/file resolution.
- **Dependencies are minimal** — drop `next/link` (replaced by polymorphic slot); add `Playfair Display` font + `--font-serif` token (reusable across future content components).
- **Sized appropriately** — 14 files, comparable to markdown-editor's complexity tier. Single procomp gate, not a system.
- **Sets up future components** — `--font-serif` token unblocks `page-hero-news-01` and any future content-heavy procomps. The `linkComponent` polymorphic-root pattern is reusable.
- **Family compatibility honored** — zero imports from `page-hero-news-01` or `grid-layout-news-01`; the grid composes the card via its own `renderItem` callback. Three components, three sealed folders.

### Risks worth flagging

1. **Font addition broadens scope** beyond the card itself. `--font-serif` becomes a pro-ui-wide token. Users of any future component (or the docs site itself) inherit it. **Acceptable** — fits the project's editorial intent and avoids per-card font duplication.
2. **No test runner** — verification is demo-driven SSR check + manual browser interactivity smoke (consistent with all prior pro-ui ships). Card-level pure functions (`formatRelativeTime`, `formatDate`) are trivially testable when Vitest lands.
3. **Featured-variant badge contrast** is a real visual regression vs. the kasder original. The backdrop-blur fix is mandatory for v0.1; can't ship without solving it.
4. **5-variant set is on the larger side** for a single procomp. Could split into 5 components (`featured-content-card-news-01`, etc.), but that loses the single-API value proposition. **Recommendation: stay single-component.** If the file count becomes unwieldy in v0.2 follow-ups, revisit.

### Suggested procomp gate

Once you sign off this analysis:

1. **Stage 1 — `content-card-news-01-procomp-description.md`** — what & why. Codifies the 5-variant API contract, the customization surface (12+ override points), the visual DNA inventory, and the migration-origin one-liner.
2. **Stage 2 — `content-card-news-01-procomp-plan.md`** — how. File-by-file plan, prop signatures finalized, default-value table, edge cases, demo storyboard, verification checklist.
3. **Stage 3 — implementation** — `pnpm new:component data/content-card-news-01`, fill the 14 files per the plan, wire into manifest, ship to registry.

Each stage signed off before the next. Identical to the procomp gate that produced rich-card / properties-form / detail-panel / etc.

---

**Sign-off recorded 2026-05-01.** User confirmed all 16 rewrite items + the 12+ customization surface + the procomp-scope decision; pulled the overlay-link pattern (item #10) forward from v0.2 to v0.1 as the only deviation. Implementation followed per [content-card-news-01-procomp-plan.md](../../procomps/content-card-news-01-procomp/content-card-news-01-procomp-plan.md); shipped as v0.1.0.
