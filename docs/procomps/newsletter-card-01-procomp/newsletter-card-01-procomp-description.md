# newsletter-card-01 — procomp description

> Stage 1: what & why.
>
> **Migration origin:** [`docs/migrations/newsletter-card-01/`](../../migrations/newsletter-card-01/) (kasder `kas-social-front-v0` `NewsMagazineGrid.tsx` + news detail page sidebar)
>
> Family: 1 of 3 sub-extractions from kasder's news system (siblings: `category-cloud-01`, `filter-bar-01`). Each is general-purpose; `grid-layout-news-01` will compose them via slots.

## Problem

Marketing / blog / news / docs sites all need a brand-tinted CTA card asking visitors to subscribe to a newsletter. Built ad-hoc per project: 5 different CTAs across 5 sidebars in one app, no shared form-state pattern, no consistent success/error UX, no shared accessibility floor. Pro-ui has zero `marketing` category components yet.

## In scope

- **Brand-tinted CTA frame** — distinct from content cards; `bg-primary/5 border-primary/20` style, `tone` prop for variation.
- **2 variants** — `inline-form` (email input + button) and `cta-only` (just button, click-leads-elsewhere).
- **Form state** — controlled-or-uncontrolled email value; controlled-or-derived status (idle / pending / success / error).
- **Async submission** — Promise-returning `onSubmit` auto-tracks pending → success/error.
- **i18n** — `labels` prop for all visible strings; English defaults.
- **a11y** — `<form>` wrapping, `aria-label` on input, `aria-live` on status, `role="alert"` on error, `aria-busy` on Button during pending.

## Out of scope

- Email validation beyond HTML5 `type="email"` + `required` (consumers wanting strong validation use Zod / Yup themselves).
- Multi-field signup (name, preferences, etc.).
- Email-service integration (Mailchimp, ConvertKit, etc.) — consumer's `onSubmit` handles the network call.
- Double-opt-in / verification flows — product-side concern.
- Modal-based signup — consumer wraps in their own Dialog if needed.
- Inline preference toggles — out of v0.1 scope.

## Target consumers

- Marketing landing pages, content sites, blogs, docs sites that need an email-capture CTA in a sidebar / footer / hero.
- Any project wanting a quick "drop email + go" affordance with consistent styling + a11y baseline.

## Rough API sketch

```tsx
<NewsletterCard01
  variant="inline-form"      // or 'cta-only'
  tone="primary"             // 'primary' | 'accent' | 'muted'
  onSubmit={async (email) => {
    await api.subscribe(email);  // Promise → component auto-tracks status
  }}
  labels={{
    title: "Join our newsletter",
    body: "Latest stories, weekly.",
    placeholder: "you@example.com",
    button: "Subscribe",
  }}
/>
```

5 props are most-used: `variant`, `tone`, `onSubmit`, `labels`, `headingAs`. Rest are escape hatches.

## Example usages

**1. Sidebar CTA on a magazine grid** (`grid-layout-news-01` integration):
```tsx
<aside>
  <NewsletterCard01 onSubmit={subscribeAction} />
</aside>
```

**2. Footer CTA on a docs site:**
```tsx
<NewsletterCard01
  variant="inline-form"
  tone="muted"
  onSubmit={subscribeAction}
  labels={{ title: "Stay updated", body: "Release notes + roadmap." }}
/>
```

**3. CTA-only variant** (click leads to a sign-up modal):
```tsx
<NewsletterCard01
  variant="cta-only"
  labels={{ button: "Sign up" }}
  onSubmit={() => openSignupModal()}
/>
```

## Success criteria

- Both variants render correctly at sidebar widths (~280px) and full-width.
- Form Enter-key submits when in `inline-form` variant.
- `onSubmit` returning a Promise auto-tracks status without consumer intervention.
- Status messages (success / error) render with correct ARIA semantics.
- TypeScript: prop types strict; `variant` is a literal union; `onSubmit` is `(email: string) => void | Promise<void>`.
- `pnpm tsc --noEmit` + `pnpm lint` + `pnpm build` clean.
- SSR `/components/newsletter-card-01` returns 200 with all 4 demo tabs.

## Open questions

1. **Component export name.** `NewsletterCard01` (matching slug + variant-explicit) — confirmed pattern from content-card-news-01.
2. **Tone palette scope.** Three tones (primary / accent / muted) or just one? **Resolved:** three — gives consumers room without exploding the API.
3. **Should `inline-form` show inline validation errors?** v0.1 ships with HTML5 validation only. Strong validation (regex, async unique-check) is consumer concern.
4. **Disabled state.** Should the card support a `disabled` prop (read-only display)? **Open** — defer unless a real consumer asks. Likely a v0.2 candidate.
