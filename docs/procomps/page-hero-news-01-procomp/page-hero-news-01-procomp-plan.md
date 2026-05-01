# page-hero-news-01 — procomp plan

> Stage 2.

## Final API

```ts
// types.ts

import type { ComponentType, ReactNode } from "react";

export type PageHeroDensity = "compact" | "default" | "full";

export type PageHeroHeadingLevel = "h1" | "h2" | "h3";

export interface HeroStat {
  /** Optional Lucide-style icon. */
  icon?: ComponentType<{ className?: string }>;
  /** Bold value text (e.g. "500+", "Daily"). */
  value: string;
  /** Small label below the value (e.g. "Articles", "Updates"). */
  label: string;
}

export interface HeroStatsProps {
  stats: HeroStat[];
  className?: string;
}

export interface PageHeroNewsProps {
  /** Title is required. */
  title: string;
  /** Override `title` with a custom node (e.g. mixed bold + colors). */
  titleSlot?: ReactNode;
  /** Optional accent-colored highlight rendered as a `<span class="block">` below the title. */
  titleHighlight?: string;
  /** Optional badge text rendered above the title. */
  badge?: string;
  /** Optional Lucide-style icon for the badge. */
  badgeIcon?: ComponentType<{ className?: string }>;
  /** Optional description paragraph rendered below the title. */
  description?: string;
  /** Optional content slot rendered below the description (stats / CTAs / search / anything). */
  children?: ReactNode;

  /** Section minimum height. Default: 'default' (70vh). */
  density?: PageHeroDensity;
  /** Heading semantic level. Default: 'h1'. */
  headingAs?: PageHeroHeadingLevel;
  /** Disable the entrance animation entirely (e.g. for SSR-only contexts). */
  disableReveal?: boolean;

  /** Override classes for the root <section>. */
  className?: string;
}
```

## File-by-file plan

```
src/registry/components/marketing/page-hero-news-01/
├── page-hero-news-01.tsx     # 1
├── parts/
│   └── hero-stats.tsx        # 2
├── types.ts                  # 3
├── dummy-data.ts             # 4
├── demo.tsx                  # 5
├── usage.tsx                 # 6
├── meta.ts                   # 7
└── index.ts                  # 8
```

(8 files total — `parts/hero-stats.tsx` counts as the only sub-part.)

### 1. `page-hero-news-01.tsx`
- `"use client"` (uses `useId`).
- `React.memo`.
- Computes `titleId` via `useId` for `aria-labelledby` wiring.
- Resolves `density` → min-height class.
- Resolves `HeadingTag` from `headingAs`.
- Resolves reveal classes: `disableReveal=true` → no `.reveal-up`; otherwise applies `.reveal-up` class to each animated child with staggered `style={{ animationDelay: `${i * 60}ms` }}`.
- Stagger order: badge (0ms) → title (60ms) → description (120ms) → children (180ms).
- Renders:
  - `<section aria-labelledby={titleId} className="relative flex items-center justify-center overflow-hidden ${densityMin}">`
    - Background div: gradient `bg-linear-to-br from-primary via-primary/95 to-primary/80` + SVG noise pattern overlay.
    - Container content: `<div className="container relative z-10 px-4 py-24 text-center max-w-4xl mx-auto">`
      - Badge (if `badge` provided): `<span className="reveal-up inline-flex items-center gap-2 rounded-full bg-accent/20 px-4 py-2 text-sm font-medium text-accent mb-6"> {Icon} {badge} </span>`
      - Title: `{titleSlot ?? <HeadingTag id={titleId}>{title} {titleHighlight && <span className="block text-accent">{titleHighlight}</span>}</HeadingTag>}`
      - Description: `<p className="reveal-up text-lg md:text-xl text-white/80 max-w-3xl mx-auto">{description}</p>`
      - Children wrapper: `<div className="reveal-up mt-10">{children}</div>`
    - Bottom SVG wave: `<svg viewBox="0 0 1440 120" className="absolute -bottom-px left-0 right-0 fill-background">...path...</svg>`

### 2. `parts/hero-stats.tsx`
- Pure presentational component.
- `<div className="flex flex-wrap justify-center gap-8">`
  - For each stat: icon-circle (`w-12 h-12 rounded-full bg-white/10 flex items-center justify-center`) + bold value (`text-2xl font-bold`) + small label (`text-sm text-white/70`).
- All stats inherit white text since the hero bg is gradient-primary.

### 3. `types.ts` — public types as shown.

### 4. `dummy-data.ts`
```ts
export const NEWS_HERO_DEFAULTS = {
  badge: "News & Updates",
  title: "Latest Stories",
  titleHighlight: "From Our Team",
  description: "Insights, announcements, and behind-the-scenes from our editorial team.",
};

export const NEWS_HERO_STATS: HeroStat[] = [
  { icon: Newspaper, value: "500+", label: "Articles" },
  { icon: TrendingUp, value: "10K+", label: "Readers" },
  { icon: Clock, value: "Daily", label: "Updates" },
];
```

### 5. `demo.tsx`
4 tabs as described.

### 6. `usage.tsx`
Code blocks: minimal, with-stats, custom CTA, density variants, custom titleSlot, headingAs override.

### 7. `meta.ts` — ComponentMeta with full features list.

### 8. `index.ts` — public exports including `HeroStats`.

## Dependencies

- `@/lib/utils` (`cn`)
- `lucide-react` (icons in dummy data — Newspaper / TrendingUp / Clock for the news demo)

No new deps. Drops `framer-motion`.

## Composition pattern

Headless wrapping; one sub-component (`HeroStats`) exposed for the typical stats-row pattern. Consumers wanting other compositions just pass them via `children`.

## Client vs server

**Client component** — uses `useId` for ARIA wiring. `React.memo` (client). Pattern matches all other interactive pro-ui components.

(Could be RSC-compatible since useId is server-safe in React 19, but matching the existing convention keeps mental model uniform.)

## Edge cases

| Case | Behavior |
|---|---|
| Only `title` provided | Renders just title; no badge, no description, no children. Section still has the gradient bg + wave. |
| `titleSlot` provided | Replaces the default title rendering; consumer is responsible for the heading element. |
| `disableReveal=true` | No `.reveal-up` classes applied; content renders immediately. |
| Reduced motion (OS-level) | `.reveal-up` keyframe respects `prefers-reduced-motion: reduce`; content fades in instantly. |
| Long title (50+ chars) | Wraps via `max-w-4xl mx-auto`; if very long, may push the layout. |
| `density="full"` | `min-h-screen` — full viewport height. Use sparingly. |
| RTL | Tailwind text-center + flex-center work in RTL. |
| Dark mode | Gradient inherits `--primary` (lime) which lifts in dark mode; white text legible regardless. SVG wave fills `--background` so it transitions correctly. |

## Accessibility

- `<section aria-labelledby={titleId}>` for landmark.
- Title gets `id={titleId}` (`useId`).
- Badge icon is `aria-hidden="true"` (decorative); badge text is the meaningful label.
- Reveal animation respects `prefers-reduced-motion: reduce` (free via existing keyframe).
- Heading semantic level configurable.

WCAG 2.1 AA target.

## Verification checklist

- tsc / lint / build clean.
- SSR 200 with 4 demo tabs.
- Visual: all 3 densities render at expected viewport heights; reveal animations run with stagger; SVG wave masks bottom into background; works in light + dark mode.

## Risks

1. **`fill-background` Tailwind class** — pro-ui's `@theme inline` defines `--color-background: var(--background)`; the corresponding Tailwind utility is `fill-background`. Verify it generates correctly during build.
2. **`max-w-4xl` opinionated** — could be a `contentClassName` override slot. Defer to v0.2 unless a consumer asks.
3. **Stats-row text color hardcoded white** — works only on dark gradients. If a future variant uses a light gradient, stats will be invisible. Out of v0.1 scope.
