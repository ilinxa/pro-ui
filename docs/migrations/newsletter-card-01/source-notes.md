# newsletter-card-01 — migration source notes

> Intake doc for [`docs/migrations/newsletter-card-01/`](./). The user provided a high-level description; the assistant drafted this doc from the source code + that description. **Sections tagged `[TO CONFIRM]` are inferred and need user sign-off or edit before the analysis pass.**
>
> **Family context:** part of a sub-extraction from the kasder news system. Three small-but-reusable patterns extracted from `NewsMagazineGrid.tsx` (newsletter card, category cloud, filter bar) so `grid-layout-news-01` can become a slot-based layout that composes them. Each is **general-purpose** (no `-news-` infix) — the patterns are universal across news, blog, marketing, docs.
>
> See [`docs/migrations/README.md`](../README.md) for the full pipeline.

## Source

- **App:** `kas-social-front-v0` (kasder)
- **Primary path:** `E:\my projects\kasder\kas-social-front\kas-social-front-v0\src\components\public\sections\news\NewsMagazineGrid.tsx` lines 277–289 (sidebar newsletter block).
- **Sibling variant:** `E:\my projects\kasder\kas-social-front\kas-social-front-v0\src\app\(platform)\news\[id]\page.tsx` lines ~237–244 — same brand-tinted frame + headline + body, but **no email input** (just a full-width Subscribe button). Worth capturing as a `variant` prop on the card.
- **Used in:** news landing page sidebar (with-input variant) + news article detail page sidebar (button-only variant).
- **Related code:**
  - [`original/NewsMagazineGrid.tsx`](./original/NewsMagazineGrid.tsx) — the with-input variant (lines 277–289 of the grid)

## Role

CTA card asking the visitor to subscribe to a newsletter. Brand-tinted frame (`bg-primary/5 rounded-2xl p-6 border border-primary/20`) makes it visually distinct from regular content cards on the same page. Serif-bold headline, muted body copy, then either:
- An inline email input + Subscribe button (the magazine grid sidebar)
- Or just a full-width Subscribe button (the article detail page sidebar — implies the click leads to a sign-up flow elsewhere)

Reusable beyond news: blog sidebars, docs footers, marketing landing pages, content hubs, anywhere the consumer wants to capture an email.

## What I like (preserve) [TO CONFIRM]

- **Brand-tinted frame** — `bg-primary/5` (very light primary tint) + `border-primary/20` border. Distinct from plain `bg-card` siblings. Calls attention without shouting.
- **Serif title typography** — matches the editorial feel of the news site (consumes the same `--font-serif` token shipped with `content-card-news-01`).
- **Two-section content** (headline + body) before the action. Standard CTA-card rhythm.
- **Compact form: input + button in a row** — consistent with the "drop email and go" pattern seen across news sites.
- **Button-only variant** (detail page version) — useful when the form belongs elsewhere (modal, footer); the card is just the CTA hook.
- **Rounded-2xl + p-6** spacing consistent with the rest of the magazine layout.

## What bothers me (rewrite) [TO CONFIRM]

- **Hardcoded Turkish strings** — `"Bültenimize Katılın"` (title), `"En güncel haberleri e-posta ile alın."` (body), `"E-posta adresiniz"` (placeholder), `"Abone Ol"` (button). All become props with English defaults.
- **No `onSubmit` handling.** Source has `<Input />` and `<Button />` with no form wrapper, no submit handler — the form does nothing. Real component needs a controlled-or-uncontrolled email value + `onSubmit(email) => void | Promise<void>` callback.
- **No success / error / pending states.** A real subscription form needs to communicate "sending… / thanks! / something went wrong." Should support `status: 'idle' | 'pending' | 'success' | 'error'` (controlled) OR derive internally from a Promise-returning `onSubmit`.
- **No email validation.** Should provide a minimum HTML5 `type="email"` baseline; consumers can layer their own.
- **Hardcoded `bg-primary/5` tint** — non-customizable. Could be a `tone` prop (`primary | accent | muted`) with the primary tint as default.
- **Two variants exist in the source but they're separate inline JSX** — combine into a single component with `variant: 'inline-form' | 'cta-only'` (or similar names).
- **No `aria-label` on the input, no `aria-live` for status.** Accessibility gap.
- **No `<form>` element wrapping the input + button** — Enter key in input doesn't submit. Should be a real `<form>`.
- **Headline level locked** to `<h3>`. Should be configurable via `headingAs` prop (consumer may put this in different page sections with different heading-level expectations).
- **Newsletter button color in the screenshot is dark navy, not lime** — kasder's button styling differs from pro-ui's lime primary. In pro-ui this would render with lime; if you want the dark-on-lime feel, that's already pro-ui's default. If you want a *different* color (the dark navy from the screenshot), that becomes a `buttonVariant` prop or className override.

## Constraints / non-goals [TO CONFIRM]

- **Stay framework-agnostic.** No `next/*`, no app contexts, no env coupling. Plain `<form>`, plain `<input>`, shadcn `Button` + `Input`.
- **No data fetching, no email-service integration.** Consumer's `onSubmit` handles network calls.
- **Single-card scope.** No compound API, no multi-step wizard, no "thank you" full-screen takeover. A success message inside the card is fine.
- **Independent of `category-cloud-01` and `filter-bar-01`** — no cross-imports. They share visual harmony only.
- **Don't ship email validation as the primary feature** — it's a thin baseline; consumers wanting strong validation use Zod / Yup themselves.
- **No double-opt-in flow.** Out of scope; that's product-side concern.

## Screenshots / links

User shared 1 screenshot in this turn (the with-input newsletter card). Drop it into [`./original/screenshots/`](./original/screenshots/) when convenient — visual record of the brand-tint + button color.

**Useful for the analysis pass:**
- Screenshot of the button-only variant (detail page sidebar) so we can lock down the differences.
- Hover / focus state on the input + button.
- Success state mockup if you have a design preference.

<!-- Paste additional images, design files, screen recordings, or notes below. -->
