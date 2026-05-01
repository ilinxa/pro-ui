# page-hero-news-01 — procomp guide

> Stage 3.

## When to use

- Top-of-page hero band on landing pages, blog indexes, marketing sections, app welcomes.
- When you want a brand gradient + badge + headline + description + flex content slot.
- When `framer-motion` would be overkill — this hero gets you the staggered reveal via CSS only.

## When NOT to use

- **Sticky-on-scroll mini-header** — different component; this hero is one-shot top-of-page.
- **Multi-section landing page composition** — use this for the hero band, build the rest with normal layout primitives.
- **Background video / parallax / Lottie** — out of scope; consumers wanting motion video bring their own and stack it themselves.

## Composition patterns

### News landing (the kasder use case)

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

### Marketing CTA hero

```tsx
<PageHeroNews01
  badge="New: v2.0"
  title="Build faster"
  titleHighlight="Ship sooner"
  description="The component library for teams that move."
>
  <div className="flex justify-center gap-4">
    <Button size="lg" variant="secondary">Get started</Button>
    <Button size="lg" variant="outline">View docs</Button>
  </div>
</PageHeroNews01>
```

### Compact sub-page hero

```tsx
<PageHeroNews01
  density="compact"
  headingAs="h2"
  title="Pricing"
  description="Simple plans for teams of any size."
/>
```

### Custom title rendering

```tsx
<PageHeroNews01
  title=""
  titleSlot={
    <h1 className="text-5xl font-bold text-white">
      The <em className="text-accent">future</em> of news
    </h1>
  }
  description="..."
/>
```

## Gotchas

### `title` is required even with `titleSlot`

The `title` prop is required by the type but unused when `titleSlot` is provided. This is intentional — keeps the simple path simple. Pass `title=""` if you're using `titleSlot`.

### CTA button colors on the gradient

The hero's gradient is the brand primary (lime in pro-ui). Default `<Button>` uses `bg-primary` (also lime) → blends in. For visible CTAs:

- `<Button variant="secondary">` — muted button, contrasts well.
- `<Button variant="outline" className="bg-transparent text-white border-white/40 hover:bg-white/10 hover:text-white">` — the demo's pattern.

### `disableReveal` for SSR-only contexts

If you're rendering inside a context that strips client-side JS entirely (some static-site exports), `.reveal-up` keyframes still run via CSS and work fine. The flag exists for cases where any animation is undesirable (e.g. embedded in an existing animation framework).

### SVG wave `fill-background`

The bottom wave uses Tailwind's `fill-background` utility, which resolves to `var(--background)`. In the docs site this is a cool off-white in light mode and graphite in dark mode — the wave automatically transitions. If you embed the hero on a non-`bg-background` page, the wave will look misaligned; override via `className` on the SVG.

### `font-display` falls back to Onest

Pro-ui's `--font-heading` token resolves to Onest (the existing sans). `font-display` Tailwind utility maps there. If you want serif headlines (matching content-card-news-01), wrap your title in `<span className="font-serif">...</span>` inside `titleSlot`, OR globally swap `--font-heading: var(--font-playfair-display)` in your app.

## Migration notes

Supersedes the kasder `kas-social-front-v0` `commons/PageHero.tsx` (engine) + `news/NewsHero.tsx` (news-flavored shell). The migration:

- **Preserved:** 4-tier reveal stagger, badge chip with icon, title-with-highlight pattern, description body, children slot, bottom SVG wave, gradient + noise overlay, 3-stat row pattern.
- **Rewrote:** `framer-motion` → CSS `reveal-up` keyframe (drops ~100KB peer); `--primary-light` → 2-stop gradient using existing tokens; hardcoded oklch SVG fill → `fill-background` Tailwind utility; `min-h-[70vh]` → 3-density `density` prop; locked `<h1>` → `headingAs` prop; NewsHero's stats row → exported `HeroStats` sub-component.
- **Added:** `aria-labelledby` wiring; `titleSlot` prop for rich title rendering; `disableReveal` opt-out for SSR-only contexts; `prefers-reduced-motion` respect (free via existing keyframe).

Originals at [`docs/migrations/page-hero-news-01/original/`](../../migrations/page-hero-news-01/original/).

## Open follow-ups

- v0.2: `gradientFrom` / `gradientTo` props for non-primary tints.
- v0.2: Light-on-light variant (text-foreground instead of text-white).
- v0.2: Optional sticky-on-scroll mini-mode (cuts to a thin band when user scrolls past).
- v0.3: Sibling components — `page-hero-product-01`, `page-hero-event-01` — same engine, different defaults.
