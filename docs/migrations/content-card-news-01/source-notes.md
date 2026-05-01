# content-card-news-01 — migration source notes

> Intake doc for [`docs/migrations/content-card-news-01/`](./). The user provided a high-level description; the assistant drafted this doc from the source code + that description. **Signed off 2026-05-01.** All inferred sections were confirmed; the only deviation from the draft was pulling the overlay-link pattern forward from v0.2 to v0.1 (see "rewrite" item below).
>
> **Family context:** this is part of a 4-component news-domain migration. Sibling migrations: `page-hero-news-01` (hero band), `detail-page-news-01` (article page), `grid-layout-news-01` (magazine grid). All four must be **totally independent** (no cross-imports — sealed folders), **fully compatible** (compose cleanly when used together), and **dynamic** (props/slots/generics, no hardcoded data).
>
> See [`docs/migrations/README.md`](../README.md) for the full pipeline.

## Source

- **App:** `kas-social-front-v0` (kasder)
- **Path in source:** `E:\my projects\kasder\kas-social-front\kas-social-front-v0\src\components\public\sections\news\NewsCard.tsx`
- **Used in:** `NewsMagazineGrid.tsx` (sibling file in the same folder) — the magazine-style news landing layout. All 5 variants are exercised by that one consumer:
  - `featured` — top hero card (big image, gradient overlay, full meta row)
  - `large` — 2-column horizontal card (image left, content right) below the hero
  - `medium` — 2-up and 3-up grid cells in the main column
  - `small` — *(defined in the component but not used in `NewsMagazineGrid.tsx`)*
  - `list` — sidebar "Popüler Haberler" rows
- **Related code:**
  - [`original/NewsCard.tsx`](./original/NewsCard.tsx) — the migration target (5 variants in one file)
  - [`original/newsTypes.ts`](./original/newsTypes.ts) — `NewsType`, `NewsCardProps` type contract
  - [`original/NewsMagazineGrid.tsx`](./original/NewsMagazineGrid.tsx) — consumer reference (search + category filter + date range + infinite scroll grid that wires the 5 variants together)

## Role

Magazine-style news preview card. Renders a brief of a single news article — title, excerpt, image, category, author, date, view count, read time — in **5 visual variants** picked via a `variant` prop, so the same component can serve as a hero, a 2-column feature, a vertical grid cell, a horizontal thumbnail tile, or a list row.

The 5 variants are a deliberate set, not five different components — they share visual DNA (rounded corners, category-badge color map, hover-scale image, group-hover title color shift) and let one consumer compose a full magazine layout (hero + main grid + sidebar list) by swapping `variant`.

## What I like (preserve) [CONFIRMED]

> Drafted from reading the code; signed off as drafted.

- **The 5-variant set as a single API.** One component, one type, five layouts — same `news` prop, swap `variant`. This is what makes a magazine grid composable in 20 lines.
- **Serif title typography** (`font-serif`) on every variant — strong editorial brand; immediately separates from the generic "blog card" look.
- **Rounded-2xl corners + `border-border/50`** card frame with `hover:shadow-xl` lift on `large` / `medium`, `hover:shadow-md` on `small` — calibrated, not flat.
- **Image scale-on-hover micro-interaction** — `group-hover:scale-105` with `duration-500` (700 on featured). Subtle, not gimmicky.
- **Category-colored badges** via the `categoryColors` map — each category gets its own brand tint (lime / success / accent / warning / destructive / secondary). This is the single most "branded" piece of the card.
- **Featured variant's gradient overlay** — `bg-linear-to-t from-black via-black/50 to-transparent` for legible white text over any image. Plus the `Devamını Oku → ArrowRight` CTA pinned to the right with `translate-x-1` on hover.
- **Eye-icon view-count chip** on the medium variant — `bg-black/60 backdrop-blur-sm` floating bottom-right of the image. Optional (only renders when `news.views` is present).
- **Per-variant meta-row density.** Featured shows author + date + read-time + CTA. Large drops the icons but keeps all three meta items. Medium shows just author + date in the footer. Small shows just date. List shows category + relative date inline. This descending detail-density is the magazine-layout intuition baked in.
- **Relative-time formatting.** "Bugün / Dün / N gün önce / N hafta önce / fallback to absolute date" — friendly for fresh content, precise for older.
- **List variant's `ArrowRight` chevron** with `group-hover:translate-x-1` — quiet affordance that the row is clickable.
- **Editorial "kicker" footer in `medium` variant** — `pt-4 border-t border-border/50` separator above the author-left / date-right row. The single most editorial-feeling micro-pattern in the card; visible in the real-layout screenshot.
- **Cards already flex across different container widths** — `large` works at full-row, `medium` at half-row, all without internal layout changes. The "useful in different layouts" requirement is already satisfied at the card level; the layout work happens in `grid-layout-news-01`.

## What bothers me (rewrite) [CONFIRMED]

> Drafted from registry portability rules + general migration heuristics. Signed off as drafted with one deviation: the overlay-link pattern was pulled forward to v0.1 (see item below).

- **`import Link from "next/link"`** — forbidden in registry code per [`.claude/CLAUDE.md`](../../../.claude/CLAUDE.md) "Registry conventions". Must become a polymorphic root: either `linkComponent` slot, `asChild` slot, or `href` + plain `<a>` default. (Consumers pass their `Link` if they want SPA navigation.)
- **`/news/${news.id}` URL is hardcoded.** Should be a `getHref(item) => string` callback or just an `href` prop on each card. Not every consumer's news lives at `/news/:id`.
- **All Turkish strings hardcoded** — `"Bugün"`, `"Dün"`, `"N gün önce"`, `"N hafta önce"`, `"N dk okuma"`, `"N dk"`, `"Devamını Oku"`. Should be a `labels` object prop with sensible English fallbacks (or a full `formatRelativeTime` callback for total control).
- **`tr-TR` locale baked into `formatDate`.** Should be a `locale` prop or formatter callback.
- **`categoryColors` map has Turkish category keys baked in** (`"Kentsel Dönüşüm"`, `"Sürdürülebilirlik"`, etc.). The map itself is a great pattern; the *keys* are kasder-specific. Should be a `categoryStyles?: Record<string, string>` prop with a fallback (`bg-muted` is fine).
- **`NewsType` is opinionated about field names** (`readTime`, `views`, `featured`). For pro-ui generality the card should be **generic over an item type** — `NewsCard<T>` with field accessors (`getTitle`, `getImage`, …) OR a strict `NewsCardItem` shape that consumers map their data into. Prefer the strict-shape approach for ergonomics; the generic accessor pattern is the escape hatch.
- **No `loading="lazy"` / `decoding="async"` / explicit `width`+`height` on `<img>`.** Cards in a 50-item infinite-scroll grid should lazy-load images and reserve aspect-ratio space to prevent CLS. Trivially fixable.
- **No `React.memo`.** In `NewsMagazineGrid`'s infinite-scroll list, every search/filter/scroll keystroke re-renders all visible cards. `React.memo` with stable item refs is free.
- **No focus-visible ring style.** Relies on browser default; the rest of the card has heavy hover styling but no equivalent for keyboard users. Add a `focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2` on the link root.
- ~~**The whole `<article>` is wrapped in one `<Link>`.**~~ **RESOLVED 2026-05-01 (user pulled forward to v0.1):** v0.1 implements the heading-as-link + absolute-overlay link pattern. The link uses `position: absolute; inset: 0; z-index: 0` to cover the whole card; nested interactives in the new `actions` slot get `position: relative; z-index: 10` and sit above. Accessible name via `aria-labelledby={titleId}` (computed via React 19 `useId`). Focus-visible ring covers the full card via `:has(a:focus-visible)`. Mechanics + edge cases documented in [analysis.md item #10](./analysis.md) and [the procomp plan](../../procomps/content-card-news-01-procomp/content-card-news-01-procomp-plan.md).
- **No `onClick` callback option.** Some consumers want the click handled in JS (analytics, modal-open) without navigation. Should be a separate `onClick` prop alongside `href`.
- **5 variants implemented as 5 inline `if` blocks in one function.** Pro-ui's sealed-folder convention prefers one `parts/<variant>.tsx` per visual variant for review-ability + tree-shaking. Mechanical refactor on the way in.
- **Soft-fail on missing fields.** What happens if `news.author` is empty? Currently an empty span renders. Should be skipped. Same for `views`, `readTime`, `excerpt`, `category`. Make all but `id` + `title` + `image` optional and omit gracefully.
- ~~**Serif font dependency.**~~ **RESOLVED 2026-05-01 (user):** font must be dynamically customizable, with the kasder editorial serif as the **default for news-flavored components.** Implementation: add `--font-serif` CSS variable to pro-ui [`globals.css`](../../../src/app/globals.css) defaulting to a free editorial serif (e.g. Playfair Display / Lora — exact pick decided in `analysis.md`); card uses `font-serif` Tailwind utility (auto-maps to the var via Tailwind v4); consumers override at any scope via `--font-serif: <other-font>`. Optional `titleClassName?: string` slot on the card for per-instance class-level overrides. **Future non-news content components inherit the same token** — `--font-serif` is global, not card-local.
- **Image aspect ratio is fixed per variant** (`h-48` for medium, column-height for large, etc.). Different consumer layouts may want different ratios (taller image for narrow columns, ultrawide for hero rows). Add an `imageClassName` slot or per-variant aspect-ratio prop.
- **Featured-variant badge contrast on dark gradient** — the `featured` screenshot shows the "Sürdürülebilirlik" badge (`bg-success/10 text-success`) sitting on a black-gradient image background; it's **barely legible**. For featured (and any variant where the badge sits on imagery), the category-color map needs a dark-bg variant — either (a) higher-saturation tints + white text for dark contexts, or (b) the same color map but with a `backdrop-blur-sm` chip wrapper for guaranteed contrast, or (c) variant-aware color resolution (`getCategoryStyle(category, variant)`). Recommendation: (b) — wrap the badge in a `bg-black/40 backdrop-blur-sm` pill on `featured` (and any other dark-bg variant), keep the colored badge inside. Single-source-of-truth for category colors; layout decides whether to add a backdrop.

## Constraints / non-goals [CONFIRMED]

> Drafted minimally; signed off as drafted.

- **Keep the 5-variant set.** The variants are the value proposition — don't reduce to a single "responsive" card.
- **Don't break the visual DNA.** Serif titles, rounded-2xl corners, hover-scale image, gradient-overlay on featured, eye-chip on medium. These are the "why this card not another" — preserve.
- **Stay framework-agnostic.** No `next/link`, no `next/image`, no app contexts. Plain `<a>` + plain `<img>` + a `linkComponent` / `imgComponent` slot for consumers that want their framework's wrappers.
- **Single-card scope.** This component renders ONE card. The grid (`NewsMagazineGrid.tsx`) is migrated separately as the sibling [`grid-layout-news-01`](../grid-layout-news-01/) (intake drafted, on hold per user pending source-side adjustments). The Popüler / Categories / Newsletter sidebar sections are not in scope at all — they're consumer-side composition.
- **No data-fetching, no state.** The card stays a pure presentation component. `NewsMagazineGrid`'s infinite-scroll / filter logic stays out.

## Screenshots / links

User dropped reference screenshots into [`./original/screenshots/`](./original/screenshots/) on 2026-05-01. Visually reviewed during the migration intake; analysis decisions traceable to:

1. **Real-layout grid** — `large` variant (top, full-row) + 2× `medium` variant (bottom row). Confirmed: serif title, category-color map (Etkinlik→warning, Kentsel Dönüşüm→primary, Teknoloji→accent), eye-icon view chip on medium, kicker footer with separator, line-clamp-2 truncation, cards flex across container widths.
2. **Featured variant standalone** — full-bleed dark city image with gradient overlay, white serif title, excerpt, meta row (User+author / Calendar+relative-date / Clock+readtime / right-aligned "Devamını Oku →" CTA). Surfaced **the dark-bg badge contrast issue** ("Sürdürülebilirlik" badge barely legible on the dark gradient — drove the backdrop-blur recommendation in "rewrite", implemented in [`parts/featured.tsx`](../../../src/registry/components/data/content-card-news-01/parts/featured.tsx)).

**Useful for future audits / v0.2 follow-ups (not yet provided):**
- `small` variant in real layout context (defined but unused in the source `NewsMagazineGrid`).
- `list` variant in the sidebar's "Popüler Haberler" block.
- Hover state on any variant (image scale + title color shift + arrow translate) — useful for verifying motion-safe gating.

<!-- Paste additional images, design files, screen recordings, or notes below. -->
