# page-hero-news-01 — procomp description

> Stage 1.
>
> **Migration origin:** [`docs/migrations/page-hero-news-01/`](../../migrations/page-hero-news-01/). Engine: kasder `commons/PageHero.tsx`. Defaults/demo: kasder `news/NewsHero.tsx`.

## Problem

Marketing / content / docs sites need a top-of-page hero band: gradient bg, accent badge chip, large title with optional highlight subline, description, and a flexible content slot for stats / CTAs / search. Pro-ui has zero `marketing` category components beyond newsletter-card-01; no hero band yet. Built ad-hoc per project = visual drift + repeated motion-library setups.

## In scope

- **Hero band** — full-bleed gradient section with `min-h-[70vh]` (configurable via `density`).
- **Composable content stack** — badge + title + titleHighlight + description + children, all optional except title.
- **Reveal-on-mount animation** — staggered 60ms via existing pro-ui `reveal-up` keyframe (no framer-motion peer dep).
- **`HeroStats` sub-component** — typical icon-circle + value + label triplet, reusable inside `children`.
- **Decorative SVG wave** at the bottom that masks into the next section.
- **i18n** — `labels` not needed (consumer passes copy directly via props); demo ships news-flavored Turkish-friendly content.
- **WCAG 2.1 AA** — `aria-labelledby`, `aria-hidden` on icons, reduced-motion respect.

## Out of scope

- Multi-section landing page composition (this is the hero band, not the whole landing page).
- Parallax scroll effects.
- Background video / Lottie animation — `children` slot can hold a static image; consumers wanting video bring their own.
- A/B testing variants — consumer's concern.
- Sticky-on-scroll mini-header — different component; this hero is a one-shot top-of-page band.

## Target consumers

- News / blog landing pages (the kasder use case).
- Marketing pages (product launches, feature pages, pricing, about).
- Documentation site landing.
- App login / signup welcome screens.

## Rough API sketch

```tsx
<PageHeroNews01
  badge="News & Updates"
  badgeIcon={Newspaper}
  title="Latest Stories"
  titleHighlight="From Our Team"
  description="Insights, announcements, and behind-the-scenes."
>
  <HeroStats stats={[
    { icon: Newspaper, value: "500+", label: "Articles" },
    { icon: Users, value: "10K+", label: "Readers" },
    { icon: Clock, value: "Daily", label: "Updates" },
  ]} />
</PageHeroNews01>
```

## Example usages

**1. Marketing landing — gradient hero + CTA cluster:**
```tsx
<PageHeroNews01
  badge="New: v2.0"
  title="Build faster"
  titleHighlight="Ship sooner"
  description="The component library for teams that move."
>
  <div className="flex gap-4 justify-center">
    <Button size="lg">Get started</Button>
    <Button variant="outline" size="lg">View docs</Button>
  </div>
</PageHeroNews01>
```

**2. Compact sub-page hero (smaller density, h2 heading):**
```tsx
<PageHeroNews01
  density="compact"
  headingAs="h2"
  title="Pricing"
  description="Simple plans for teams of any size."
/>
```

## Success criteria

- Renders correctly at all 3 density levels.
- Reveal animation runs on mount with 60ms stagger; respects `prefers-reduced-motion` (free via existing keyframe).
- `title` works as `string` AND as `ReactNode` via `titleSlot` override.
- `HeroStats` sub-component renders 3-stat row that matches the kasder `NewsHero` visual.
- Section has `aria-labelledby` pointing to title id.
- TypeScript: types strict; `density` and `headingAs` literal unions; `badgeIcon` accepts any Lucide-style component.
- tsc / lint / build clean.
- SSR returns 200 with all 4 demo tabs.
