# author-card-01 — procomp description

> Stage 1: what & why.
>
> **Migration origin:** [`docs/migrations/author-card-01/`](../../migrations/author-card-01/) (kasder `kas-social-front-v0` news detail page sidebar — `src/app/(platform)/news/[id]/page.tsx` lines 191–205)
>
> Cousin migration: [`thumb-list-01`](../../migrations/thumb-list-01/) — sibling extraction from the same sidebar. Shared family member already shipped: [`newsletter-card-01`](../../../src/registry/components/marketing/newsletter-card-01/).

## Problem

Blog / news / CMS / docs / team / contributor pages all surface a "person identity card" — avatar + name + role + short bio — with the goal of giving the reader who-wrote-this context. Built ad-hoc per project: hardcoded copy, hardcoded role, baked-in `next/link`, no shared a11y baseline, no consistent visual rhythm with sibling sidebar blocks. The kasder source has the pattern inline in `page.tsx` with Turkish-only copy.

## In scope

- **Card-framed identity block** — avatar (image OR icon fallback) on the left, name + role stacked on the right, optional bio paragraph below.
- **Tone variants** — `primary` / `accent` / `muted` matching the `newsletter-card-01` resolver pattern.
- **Polymorphic root** — optional `href` + `linkComponent: ElementType` slot makes the whole card a link; without `href`, renders as a plain `<div>`.
- **i18n** — `labels` prop for all visible chrome strings; English defaults.
- **Custom fallback icon** — default `User` from `lucide-react`; overridable.
- **Heading-level config** — `h2` / `h3` / `h4` (default `h3`).
- **Class overrides** — `className` (root), `headingClassName`, `nameClassName`, `bioClassName`.
- **a11y** — `aria-labelledby` on the link root pointing to the name element id; `aria-hidden` on decorative fallback icon; `loading="lazy"` on the avatar image.

## Out of scope

- **Lists of authors** — single card only. Consumers compose via array map.
- **Vertical / portrait variants** — keep it horizontal (avatar on left). If a vertical variant is later needed, it ships as a separate slug.
- **Social links / contact buttons inside the card** — consumer composes around the card if needed; `footer` slot is YAGNI for v0.1.
- **Edit-author UI** — read-only display.
- **Following / follow-back / subscribe affordances** — product surface, not a card concern.
- **Avatar groups / multiple authors per card** — separate component if ever needed.
- **Skeleton loading state** — consumers wrap their own `Skeleton` while data loads; YAGNI for v0.1.

## Target consumers

- Blog post bylines (sidebar or top-of-article)
- News article "about the author" sidebars (the kasder source itself)
- Doc page authorship attribution
- Team / contributor listing pages
- Comment headers (with bio omitted)
- Expert Q&A cards
- Profile-link tiles

## Rough API sketch

```tsx
<AuthorCard01
  name="Aylin Demir"
  role="Senior Editor"
  bio="Specializes in sustainable urbanism and environmental journalism."
  imageSrc="/authors/aylin.jpg"
  imageAlt="Aylin Demir"
  href="/authors/aylin-demir"
  tone="primary"
  labels={{ heading: "About the author" }}
/>
```

Most-used props: `name`, `role`, `bio`, `imageSrc`, `href`. The rest are escape hatches.

**Without an image** — falls back to a tinted circle with a `User` icon:
```tsx
<AuthorCard01
  name="Anonymous Contributor"
  role="Guest Writer"
  bio="Writes occasionally about local environmental stories."
/>
```

**Custom fallback icon** (e.g. for non-person bylines):
```tsx
import { Users } from "lucide-react";
<AuthorCard01
  name="The Editorial Team"
  role="Collective"
  bio="Reporting and analysis from across the newsroom."
  fallbackIcon={Users}
/>
```

## Example usages

**1. News article sidebar** (the kasder source pattern):
```tsx
<aside className="lg:col-span-4">
  <div className="sticky top-24 space-y-8">
    <AuthorCard01 {...author} />
    <ThumbList01 items={relatedArticles} />
    <NewsletterCard01 {...newsletterProps} />
  </div>
</aside>
```

**2. Blog post byline (top-of-article)** — clickable, no bio, custom heading:
```tsx
<AuthorCard01
  name="Maya Chen"
  role="Senior Engineer"
  imageSrc="/team/maya.jpg"
  href="/team/maya-chen"
  linkComponent={Link}                  // next/link or RemixLink
  labels={{ heading: "Written by" }}
  headingAs="h2"
/>
```

**3. Team page grid item** — muted tone, no link, full bio:
```tsx
<AuthorCard01
  name="Daniel Park"
  role="Product Designer"
  bio="Currently designing onboarding flows; previously at Atlassian and Notion."
  imageSrc="/team/daniel.jpg"
  tone="muted"
/>
```

## Success criteria

1. **Visual fidelity to kasder source** — when rendered with kasder-equivalent props, the card matches the source within 1–2px and identical color tokens.
2. **Sibling-rhythm match** — heading typography (`text-lg font-serif font-bold`), card chrome (`rounded-2xl p-6 border border-border/50`), and overall vertical feel matches `newsletter-card-01` / `category-cloud-01` / `filter-bar-01` so the three blocks visually compose without retuning.
3. **Tone resolver consistency** — same `primary` / `accent` / `muted` mapping as `newsletter-card-01`.
4. **Polymorphic-root works for any link component** — verified with native `<a>` (default), demo'd as conceptually-compatible with `next/link` / RemixLink (consumer-side; we don't import them).
5. **Imagery — image-and-fallback both look correct** — image renders cleanly with `object-cover`; icon-fallback circle is tinted `bg-{tone}/10` with `text-{tone}` icon.
6. **a11y** — `aria-labelledby` on link root resolves to the name element via `useId`; decorative icon has `aria-hidden="true"`; image carries `alt`; non-link variant has no extraneous a11y attrs.
7. **i18n** — all visible chrome strings ride through `labels`; English defaults; passes a Turkish-content demo without code changes.
8. **Bundle envelope** — ≤ 4KB component code (excluding `lucide-react` and `cn`).
9. **Memoization** — exported as `React.memo`; pure for given props.
10. **Demo coverage** — 5 sub-tabs (default / with image / clickable / muted tone / custom labels + Turkish content).
11. **Verification** — `pnpm tsc --noEmit` + `pnpm lint` + `pnpm build` clean (1 pre-existing rich-card warning OK; no new); SSR `HTTP 200` for `/components/author-card-01` with all demo tabs rendered.

## Open questions

1. **Tone default = `primary` (signal-lime)?** — Matches kasder source. Confirmed in source-notes; assumed for v0.1.
2. **Avatar size fixed at `w-16 h-16`?** — Matches kasder source. v0.2 could expose a `size` prop if needed; YAGNI for v0.1.
3. **Bio character cap?** — None enforced; consumer responsibility. Source uses ~90 chars; longer bios just wrap.
4. **No avatar-image-error fallback in v0.1** — broken `src` shows browser default. Could add `imagePlaceholder?: ReactNode` later; YAGNI for v0.1.

## Why not...

- **shadcn `Avatar`?** — Radix Avatar's fallback semantics differ from the kasder visual. The kasder pattern uses raw div + img + icon with a precise tint pairing (`bg-{tone}/10` + `text-{tone}`); replicating that on top of Radix Avatar requires fighting its primitives. Rolling raw is simpler and matches the design DNA exactly.
- **Compound component pattern (`<AuthorCard.Avatar>` etc.)?** — Overkill for ≤ 4 visible parts. Flat-prop API matches the cousin `newsletter-card-01` shape; consistent learning curve across the family.
- **Generic `<AuthorCard<T>>`?** — The card has 4 required-ish display fields. Generics buy nothing here; just adds friction.
