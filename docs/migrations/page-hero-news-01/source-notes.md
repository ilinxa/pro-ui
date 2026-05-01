# page-hero-news-01 — migration source notes

> Intake doc for [`docs/migrations/page-hero-news-01/`](./). The user provided a high-level description; the assistant drafted this doc from the source code + that description. **Sections tagged `[TO CONFIRM]` are inferred and need user sign-off or edit before the analysis pass.**
>
> **Family context:** part of a 4-component news-domain migration. Sibling migrations: `content-card-news-01` (the brief card), `grid-layout-news-01` (the magazine grid), and `detail-page-news-01` (deferred). All four must be **totally independent** (no cross-imports — sealed folders), **fully compatible** (compose cleanly when used together), and **dynamic** (props/slots/generics, no hardcoded data).
>
> **Migration target is `PageHero` (the engine), not `NewsHero` (the kasder-specific shell).** NewsHero's configuration becomes the demo + default-prop suggestions only. Future siblings (`page-hero-product-01`, `page-hero-event-01`) reuse the same engine with different defaults.
>
> See [`docs/migrations/README.md`](../README.md) for the full pipeline.

## Source

- **App:** `kas-social-front-v0` (kasder)
- **Engine path:** `E:\my projects\kasder\kas-social-front\kas-social-front-v0\src\components\public\sections\commons\PageHero.tsx`
- **News-flavored shell path:** `E:\my projects\kasder\kas-social-front\kas-social-front-v0\src\components\public\sections\news\NewsHero.tsx`
- **Used in:** `NewsHero` is rendered at the top of the news landing page. Other domain heroes (`AboutHero`, `EventsHero`, etc.) likely wrap `PageHero` the same way.
- **Related code:**
  - [`original/PageHero.tsx`](./original/PageHero.tsx) — the engine (badge / title / highlight / description / children / framer-motion reveal / SVG wave)
  - [`original/NewsHero.tsx`](./original/NewsHero.tsx) — the news-domain consumer (Newspaper icon + Turkish copy + 3-stat row in `children`)

## Role

`PageHero` is a reusable page hero band — the visual entry to a top-level page. Renders as a full-bleed gradient section with:
- An accent badge chip (text + optional Lucide icon)
- A large display title (with optional accent-colored highlight subline rendered as a new `<span class="block">`)
- A subtitle paragraph
- An optional `children` slot for stats / CTAs / search / extra content
- A decorative SVG wave at the bottom that visually transitions into the next section

All content reveals on mount via a 4-step framer-motion stagger: container fade-up (800ms) → badge (200ms delay) → title (300ms) → description (400ms) → children (500ms).

`NewsHero` is the news-domain consumer of `PageHero` — wires in the Newspaper icon, the Turkish "Haberler & Duyurular" / "Güncel Haberler" / "Son Gelişmeler" copy, and a 3-stat row in `children` (icon-circle + bold number + label, e.g. "500+ Makale", "10K+ Okuyucu", "Günlük Güncelleme").

## What I like (preserve) [TO CONFIRM]

> Drafted from reading the code; please trim / add / correct.

- **The 4-tier reveal stagger** — container fade-up then badge → title → description → children, with calibrated delays. Feels orchestrated, not ad-hoc.
- **Title-with-highlight pattern** — second `<span class="block text-accent">` rendered below the main title. Strong typographic device, especially for two-part headlines.
- **Accent badge chip** with optional Lucide icon (`bg-accent/20 text-accent` rounded pill, sits above the title).
- **Display font** for the H1 (`font-display`) — distinct from body sans-serif; matches the editorial mandate of the project.
- **The `children` slot for free composition** — NewsHero uses it for stats, but it could be a CTA cluster, a search bar, breadcrumbs, anything.
- **Bottom SVG wave** — masks the hard gradient edge as the page transitions into the next section. Subtle but characterful.
- **Subtle SVG noise-pattern overlay** on the gradient (low-opacity mesh, gives the bg texture without distracting).
- **The 3-stat row pattern in `NewsHero`** — icon-circle (`bg-white/10`, 48px) + bold 2xl number + small label, three of them in a wrap row. Clean self-contained unit; worth productizing as a sub-component or `stats` prop.

## What bothers me (rewrite) [TO CONFIRM]

> Drafted from registry portability rules + pro-ui's design system mandate. The framer-motion swap is the biggest change.

- **`framer-motion` import is a hard rewrite.** Pro-ui's design mandate ([`.claude/CLAUDE.md`](../../../.claude/CLAUDE.md) "Motion") explicitly says: *"one orchestrated reveal per major page (`reveal-up` keyframe + 60ms stagger)"* — i.e., use the existing CSS keyframe + per-element delay, not introduce a ~100KB JS animation peer. Reveal becomes `animate-[reveal-up_500ms_ease-out_forwards]` with `style={{ animationDelay: '60ms' }}` etc.
- **`prefers-reduced-motion` not respected.** Reveal runs unconditionally. Should be disabled (or instant) when the OS preference is set. CSS solution: `@media (prefers-reduced-motion: reduce) { animation: none; }`.
- **Gradient uses `--primary-light`** which is NOT in pro-ui's token system. Either map to existing tokens (e.g. `from-primary to-primary/70`) or simplify to a 2-stop gradient.
- **SVG wave fill is a hardcoded oklch literal** (`oklch(0.9843 0.0017 247.84)`) — should be `oklch(var(--background))` or driven by a CSS variable so it adapts in dark mode without code change.
- **`title` is `string`, not `ReactNode`.** Consumers can't bold a word, italicize, mix line-breaks, or apply different colors mid-title. Should accept `ReactNode` (or a `renderTitle` prop).
- **`titleHighlight` is locked to `text-accent` and forced to `block` (new line).** Some pages may want inline highlight or a different color. Consider deprecating in favor of consumers passing rich `title` ReactNode — or keep as a convenience for the common case.
- **NewsHero's exact copy is Turkish + civic-planning** — kasder-specific. The pro-ui demo can use English defaults ("News & Updates" / "Latest Stories" / "What's New"); NewsHero's exact strings live only as a code-snippet usage example, not as default props.
- **Stats row is hardcoded inline in NewsHero.** The pattern is too good to bury — should be either (a) a separate `<HeroStats>` sub-component that the hero exports, or (b) a `stats: { value, label, icon }[]` prop on the hero.
- **No `aria-labelledby` / `aria-describedby`** wiring between section ↔ H1 ↔ description. Mostly ornamental but a screen reader navigating by landmark would benefit.
- **`min-h-[70vh]`** is opinionated — fine for landing-page heroes but heavy for sub-pages. Should be a `density` prop (`compact | default | full`) or className-override slot.
- **Locked to `<section>` + `<h1>`.** Nested heroes in a sub-page would want `<h2>`. Consider `headingAs?: 'h1' | 'h2'` prop.

## Constraints / non-goals [TO CONFIRM]

> Drafted minimally; please add or strike.

- **Independent of `content-card-news-01` and `grid-layout-news-01`.** No cross-imports, no shared utilities. Visual harmony only (same brand voice, same accent color via tokens).
- **Use the existing `reveal-up` keyframe** from [`src/app/globals.css`](../../../src/app/globals.css) + 60ms stagger. **No framer-motion.**
- **Stay framework-agnostic.** No `next/*`, no app contexts, no env coupling.
- **`NewsHero` is a usage example, not the migration target.** Migrate `PageHero` engine + bake news-flavored defaults into the demo.
- **No data-fetching, no state.** Hero is pure presentation — no internal state for stats counters, no on-mount load handlers, no scroll-driven reveals (one reveal at mount, that's it).
- **Single hero band scope.** Not a multi-section landing page; not a hero-with-card-overlay; not a parallax hero.

## Screenshots / links

<!-- Paste rendered screenshots here. Most useful: (a) the news landing page hero in real layout context, (b) the 3-stat row close-up so we can lock down the icon-circle / number / label proportions. The visual intent is clear from code, but real screenshots catch design DNA the code alone misses (gradient feel, exact stat-row spacing, brand color saturation). -->
