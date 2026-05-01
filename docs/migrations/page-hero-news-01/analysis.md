# page-hero-news-01 — migration analysis

> Extraction pass for [`docs/migrations/page-hero-news-01/`](./).

## Design DNA to PRESERVE

- **4-tier reveal stagger** — container fade-up, then badge / title / description / children with calibrated delays.
- **Title-with-highlight pattern** — second `<span class="block text-accent">` rendered below the main title.
- **Accent badge chip** with optional Lucide icon (`bg-accent/20 text-accent rounded-full`).
- **Display font** for the H1.
- **`children` slot** for stats / CTAs / search bars / anything.
- **Bottom SVG wave** that masks the gradient into the next section.
- **Subtle SVG noise pattern overlay** on the gradient.
- **3-stat row pattern in NewsHero** — productize as `HeroStats` sub-component.

## Structural debt to REWRITE

| # | Source | Resolution |
|---|---|---|
| 1 | `framer-motion` (~100KB peer) | Drop. Use existing `.reveal-up` CSS keyframe + 60ms stagger. |
| 2 | `prefers-reduced-motion` not respected | Free with the keyframe swap. |
| 3 | Gradient uses `--primary-light` (not in pro-ui) | Simplify to `from-primary via-primary/95 to-primary/80`. |
| 4 | SVG wave fill is hardcoded oklch literal | `fill="hsl(var(--background))"`-style approach via class + `fill-background`. |
| 5 | `title: string` only | Keep + add optional `titleSlot?: ReactNode` for rich rendering. |
| 6 | `titleHighlight` locked to `text-accent block` | Keep behavior; document. |
| 7 | NewsHero's Turkish copy + 3-stat row baked in | NewsHero becomes a demo asset. Pro-ui ships English defaults. Stats row exposed via separate `HeroStats` sub-component. |
| 8 | `min-h-[70vh]` opinionated | `density: 'compact' \| 'default' \| 'full'` (40vh / 70vh / 100vh). |
| 9 | Locked `<h1>` | `headingAs: 'h1' \| 'h2' \| 'h3'`. |
| 10 | Stats row not productized | Export `HeroStats` as a sub-component. |
| 11 | No `aria-labelledby` wiring | Section's `aria-labelledby` points to title id (via `useId`). |

## Dependency audit

- **Drop:** `framer-motion`.
- **Keep:** `react`, `lucide-react`, `@/lib/utils`.
- **Add:** none.

## Dynamism gaps

`badge` / `badgeIcon` / `title` / `titleSlot` / `titleHighlight` / `description` / `children` / `density` / `headingAs` / `disableReveal` / `className`.

## Optimization gaps

- `React.memo` wrap.
- No internal state.

## Accessibility gaps

`aria-labelledby` wiring, `aria-hidden` on badge icon, configurable `headingAs`. WCAG 2.1 AA target.

## Proposed procomp scope

```
src/registry/components/marketing/page-hero-news-01/
├── page-hero-news-01.tsx
├── parts/
│   └── hero-stats.tsx
├── types.ts
├── dummy-data.ts
├── demo.tsx
├── usage.tsx
├── meta.ts
└── index.ts
```

**File count:** 9. **Category:** `marketing` (the "Heroes" entry in `categories.ts`).

### Demo plan

4 tabs:
1. **Default** — engine showcase, no children.
2. **With HeroStats** — News-flavored content + 3-stat row using `HeroStats`.
3. **CTA cluster** — `children` = button cluster instead of stats.
4. **Density variations** — compact / default / full.

## Recommendation

**PROCEED.** Cleanest of the news-domain migrations — main rewrite is motion-engine swap (drops `framer-motion`, free win). 9 files. Pairs with newsletter-card-01 in `marketing`.

**Sign-off recorded 2026-05-02.** Proceeding to procomp gate.
