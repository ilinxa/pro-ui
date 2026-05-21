# registration-form-01 — procomp description

> Stage 1: what & why.
>
> **Greenfield** — no migration origin. Authored to spec; the spec text the user pasted is the load-bearing input and is reproduced inline below.
>
> Batch: 2 of 2 in the CMS conversion-block batch (sibling: [`pricing-table-01`](../pricing-table-01-procomp/)). Newsletter + share are already covered by `newsletter-card-01` and `share-bar-01` — no work needed there. This batch fills the remaining "convert the visitor" surfaces every CMS / marketing site needs.

## Problem

Every product, SaaS landing page, and team-CMS surface eventually needs a registration form — and every team rebuilds it. Email/password is the floor; some need OAuth above (Google / GitHub / Apple); some need a two-step flow that captures profile detail after a low-friction first step; some need magic-link (email-only); all need ToS-consent gating, password-strength feedback, server-error surfacing, and accessible inline error messages. The shape is universal and the wiring is fiddly: RHF + Zod + password strength + OAuth branded buttons + multi-step progress + ARIA error bindings + honeypot anti-spam + a confirmation state — every team writes the same 250-line surface from scratch, gets the a11y wrong on first pass, and ships a different visual treatment than their pricing/marketing siblings.

Pro-ui has zero registration components today. `properties-form` is entity-edit, not authentication; `json-form` (v0.2.5) is the right substrate for backend-driven forms but is the wrong shape for the specific UX of a sign-up — registration is a *named-surface* component with strong defaults, not a *render-anything-from-schema* generic. The two coexist; this component sits beside `newsletter-card-01` and `pricing-table-01` as the third member of the conversion-block batch under the `forms` category.

## In scope

- **Two flow variants** — `flow: "single-step" | "two-step"`. Single-step renders email + password + optional fields + consent on one screen. Two-step renders email/password + consent in step 1, then optional profile fields in step 2 with a thin progress indicator (`1 / 2`, `2 / 2`), a Back button, and a "Skip for now" button on step 2 that submits with step-1 values only. **Discriminated payload envelope** — `onSubmit` receives `{ stepCompleted: "step1" | "step2", values, isHoneypotTripped }` (or `{ stepCompleted: "single", values, isHoneypotTripped }` for the single-step flow). Consumers MUST switch on `stepCompleted` to know whether optional profile fields are present — narrowing optional fields as `| undefined` was rejected because it silently lets naïve destructuring send `undefined` values to backend APIs. The envelope forces the discriminant. `skippableStepTwo?: boolean` (default `true`) controls whether the "Skip for now" button renders; setting it to `false` removes the button and requires the user to complete step 2 — `stepCompleted` will then always be `"step2"` for two-step flows.
- **Two password strategies** — `passwordStrategy: "password" | "magic-link"`. `password` is the default; `magic-link` drops the password input entirely and renders only the email field + consent + submit. `passwordPolicy`, the strength meter, and any password validation are skipped when `magic-link` is selected.
- **Density** — `density: "compact" | "default"`. `compact` tightens vertical rhythm for sidebars / modals. No layout difference between flow variants; `compact` shrinks paddings, font-size on labels, and the strength-meter height.
- **Declarative optional fields** — `fields?: { firstName?, lastName?, displayName?, phone?, company? }`, each `boolean | { required: boolean }`. `true` shorthand means "show, optional"; the object form lets consumers mark a field required. Email + password (or just email under `magic-link`) are always present and required.
- **Password policy + strength meter** — `passwordPolicy?: { minLength, requireUppercase, requireNumber, requireSymbol, showStrengthMeter }`. `minLength` defaults to `8`; the requireX flags compile into Zod validators. `showStrengthMeter` (default `true`) renders a 4-segment bar with one of `"weak" | "fair" | "strong" | "excellent"` labels. The score is derived from `(length, character-class-count)` — pure-client estimation, not a zxcvbn-style dictionary check (which would bring a ~400KB peer dep). **Pluggable strength calculator** — `strengthCalculator?: (password: string) => 0 | 1 | 2 | 3 | 4` (0 = empty / unrated, 1–4 = weak / fair / strong / excellent). Consumers with corporate password policies (or who want to drop in zxcvbn) replace the heuristic here; default is the built-in. This seam is the v0.1 contract for the v0.2 zxcvbn opt-in to land without a breaking change.
- **ToS-consent gate** — `consent: { required: boolean; label: ReactNode | string; href?: string }`. When `required: true`, submit is blocked + an inline error fires until the checkbox is checked. `label` accepts a `ReactNode` so consumers can compose `"I agree to the <Link>Terms</Link> and <Link>Privacy Policy</Link>"`; the convenience `string + href?` overload renders a simple anchor.
- **OAuth providers** — `oauthProviders?: ReadonlyArray<OAuthProvider>`. `OAuthProvider = "google" | "github" | "apple" | "facebook" | "microsoft" | "x"` initially. When provided, renders a `Continue with <provider>` button row + a `─── or ───` divider **above** the email field. On mobile the row stacks vertically; on `sm:` and up it flexes horizontally. **Click semantics:** `onOAuthClick?: ({ provider }) => void` fires; the component does NOT handle the redirect / SDK call — the consumer drives the actual OAuth handshake. **Icons via `oauthIcons` slot** — text-only by default; consumers wire branded SVG via `oauthIcons?: Partial<Record<OAuthProvider, ReactNode>>`. The fixtures bundle ships an example wiring lucide-react `<Mail />` / `<Github />` / etc. so consumers see the slot shape on first read.
- **Submit button** — `submitButton?: { label?: string; variant?: ButtonVariant }`. Defaults to `{ label: "Create account", variant: "default" }`; on step 1 of the two-step flow, label auto-derives to `"Continue"` unless overridden.
- **Server-error surface** — `errorMessage?: string` (controlled prop). When set, renders a `role="alert"` banner above the form. Internal `idle | submitting | success | error` state is owned by the component but yields to `errorMessage` for the displayed text.
- **Success screen** — on `onSubmit` resolving without throwing, the form swaps to a `successMessage` string (or `ReactNode` for richer copy) wrapped in a `role="status"` region. Consumer can override the swap by handling the lifecycle externally via the controlled `status` / `onStatusChange` escape hatch (Q5 — see below).
- **i18n labels bag** — full bag covering every visible string: field labels + placeholders (`emailLabel`, `passwordLabel`, `firstNameLabel`, etc.), error messages (`emailRequired`, `passwordTooShort`, `consentRequired`, `serverError`), button text (`createAccountLabel`, `continueLabel`, `backLabel`, `skipForNowLabel`, `signInLabel`), strength-meter labels (`strengthWeak` / `strengthFair` / `strengthStrong` / `strengthExcellent`), divider text (`orContinueWith`), success copy (`successDefaultMessage`), step indicator template (`stepOf` — `"Step {current} of {total}"`). English defaults.
- **Sign-in link** — `signInHref?: string`. When set, renders `"Already have an account? Sign in"` below the form (link text + href via `labels.signInLabel`).
- **Honeypot anti-spam** — a single hidden input (`name="website"`, `tabIndex={-1}`, `aria-hidden="true"`, `autoComplete="off"`, off-screen via `position: absolute; left: -9999px; top: auto; width: 1px; height: 1px; overflow: hidden`) included in every flow. **`display: none` is detectable by bots and they skip it — the off-screen-position pattern is load-bearing.** The submitted payload includes `_honeypot: string` so the consumer can flag spam upstream (the component does NOT auto-reject — explicit flag instead of silent drop, so the consumer can analytics-track + return success to the bot).
- **ARIA wiring** — each input has `aria-describedby` pointing to its inline error region (`role="alert"` only when populated); step indicator is `role="status" aria-live="polite"` on transition; OAuth divider uses `<hr role="separator">` with `aria-label="or"`; consent checkbox links to its label via `htmlFor`; password strength meter has an `aria-live="polite"` text companion ("Strength: strong"). RTL-safe via logical properties.
- **Controlled vs uncontrolled** — flow state (single vs two-step) is structural and lives in the schema; **step state** (current step in the two-step flow) is internal-only in v0.1 (no `step` / `onStepChange` controlled prop). Submission state is internal by default with an optional `status?` + `onStatusChange?` controlled escape hatch (mirroring `newsletter-card-01`'s state shape). **Mutual exclusion is explicit**: if `status` is passed, internal state becomes read-only — the component reads `status` as the source of truth and fires `onStatusChange` for observers, but never self-transitions. If `status` is omitted, internal state owns transitions and `onStatusChange` fires on each one. Mixing the two (passing `status` and expecting internal transitions) is a controlled-mode contract violation; documented in the consumer guide.
- **Heading semantic level** — `headingAs?: "h1" | "h2" | "h3"` (default `h2`, since registration is usually a top-of-section block but sometimes lives in a full-page route).

## Out of scope

- **Backend / API integration** — the component never makes a network request. `onSubmit(values)` is `async`-aware; the consumer is responsible for the actual auth call (Supabase, NextAuth, raw fetch, etc.) and for surfacing server errors via the controlled `errorMessage` prop.
- **CAPTCHA / hCaptcha / Turnstile** — the honeypot field is the only built-in anti-spam. CAPTCHA needs a slot + a script-load contract that's out of scope for v0.1; planned for v0.2 if a real consumer asks.
- **2FA / TOTP enrollment** — registration creates the account; 2FA enrollment is a downstream flow (different component, different state).
- **Email verification UI** — "We sent you a confirmation link" is post-registration; the success screen here is a generic `successMessage` that the consumer can override to point at the verification flow.
- **Password reset** — separate component (`password-reset-form-01` candidate, future).
- **Account-already-exists handling** — surfaced via the controlled `errorMessage` prop. No built-in "try signing in" CTA inside the error banner.
- **OAuth SDK / redirect logic** — `onOAuthClick({ provider })` is just an event; the consumer drives the popup / redirect / SDK call.
- **OAuth branded icons** — Q2 resolution (below) shipped text-only buttons (`"Continue with Google"`) and the optional `oauthIcons?: Partial<Record<OAuthProvider, ReactNode>>` slot for consumers to plug their own SVGs. We do NOT bundle a Google/Apple/Microsoft branded asset set (licensing).
- **Field-level async validation** (e.g., "username taken") — registration here is one-shot at submit; v0.2 could add a `validateField?` async hook if a real consumer asks.
- **More than two flow steps** — three-or-more-step wizards are a different problem (left for a future `multi-step-form-01` if anyone needs it).
- **Username field** — covered by `displayName` in the optional-fields bag. We don't try to encode separate username + display-name fields; consumers who genuinely need `username` (Twitter-style) treat `displayName` as their username slot in v0.1.
- **Server-side / SSR-only flows** (Next.js Server Actions, etc.) — the component is a client component (`"use client"`); progressive-enhancement variant is a v0.2 candidate.

## Target consumers

- New-product landing pages with an inline "Sign up" surface in the hero or after a feature scroll.
- Auth pages on full-page routes (`/sign-up`, `/register`).
- SaaS onboarding flows that combine OAuth + email/password + ToS-gating.
- Headless CMS / website-builder schemas where the registration block ships as a reusable conversion block in the visual editor.
- Demo / marketing surfaces that need a credible sign-up CTA without wiring real auth.

## Rough API sketch

```tsx
<RegistrationForm01
  heading="Create your account"
  subheading="Start free, upgrade when your team grows."
  headingAs="h2"
  flow="two-step"
  passwordStrategy="password"
  density="default"
  fields={{
    firstName: { required: true },
    lastName: true,
    company: false,           // hidden (same as omitting the key)
    phone: false,
    displayName: { required: false },
  }}
  passwordPolicy={{
    minLength: 10,
    requireUppercase: true,
    requireNumber: true,
    requireSymbol: false,
    showStrengthMeter: true,
  }}
  consent={{
    required: true,
    label: (
      <>
        I agree to the <Link href="/terms">Terms</Link> and <Link href="/privacy">Privacy Policy</Link>
      </>
    ),
  }}
  oauthProviders={["google", "github"]}
  oauthIcons={{
    google: <GoogleSvg className="size-4" />,
    github: <Github className="size-4" />,    // lucide-react
  }}
  onOAuthClick={({ provider }) => analytics.track("registration_oauth_click", { provider })}
  submitButton={{ label: "Create account", variant: "default" }}
  skippableStepTwo                              // default true; "Skip for now" renders on step 2
  signInHref="/sign-in"
  labels={{
    emailLabel: "Work email",
    passwordLabel: "Password",
    consentRequired: "You must accept the terms to continue.",
    successDefaultMessage: "Check your inbox to verify your email.",
    // … rest of the bag falls back to English defaults
  }}
  errorMessage={serverError}                    // controlled error string
  successMessage="You're in — check your inbox to verify your email."
  onSubmit={async (payload) => {
    if (payload.isHoneypotTripped) {
      // silently flag spam upstream; component will still show success
      analytics.track("registration_honeypot_tripped");
      return;
    }
    if (payload.stepCompleted === "step1") {
      // user skipped step 2 — optional profile fields are absent
      await api.signUp({ email: payload.values.email, password: payload.values.password });
    } else {
      // stepCompleted === "step2" (or "single") — full payload available
      await api.signUp(payload.values);
    }
  }}
/>
```

Type sketch (final shapes lock in Stage 2):

```ts
interface RegistrationForm01Props {
  heading?: string;
  subheading?: string;
  headingAs?: "h1" | "h2" | "h3";
  flow?: "single-step" | "two-step";              // default "single-step"
  passwordStrategy?: "password" | "magic-link";   // default "password"
  density?: "compact" | "default";                // default "default"
  skippableStepTwo?: boolean;                     // default true; only matters when flow="two-step"
  fields?: Partial<Record<OptionalFieldName, boolean | { required: boolean }>>;
  passwordPolicy?: {
    minLength?: number;                           // default 8
    requireUppercase?: boolean;
    requireNumber?: boolean;
    requireSymbol?: boolean;
    showStrengthMeter?: boolean;                  // default true
  };
  /**
   * v0.1 contract for the v0.2 zxcvbn opt-in: consumers can BYO strength
   * heuristic (corporate policies, dictionary checks) without a breaking
   * change. 0 = empty / unrated; 1–4 = weak / fair / strong / excellent.
   */
  strengthCalculator?: (password: string) => 0 | 1 | 2 | 3 | 4;
  consent: {
    required: boolean;
    label: ReactNode | string;
    href?: string;                                // only used when label is a string
  };
  oauthProviders?: ReadonlyArray<OAuthProvider>;
  oauthIcons?: Partial<Record<OAuthProvider, ReactNode>>;
  onOAuthClick?: (args: { provider: OAuthProvider }) => void;
  submitButton?: { label?: string; variant?: ButtonVariant };
  signInHref?: string;
  errorMessage?: string;
  successMessage?: ReactNode | string;
  /**
   * Controlled escape hatch. If provided, the component reads `status` as
   * source of truth and never self-transitions; `onStatusChange` fires for
   * observers. If omitted, internal state owns transitions and
   * `onStatusChange` fires on each one. Mixing the two (passing `status`
   * and expecting internal transitions) is a contract violation.
   */
  status?: RegistrationFormStatus;
  onStatusChange?: (status: RegistrationFormStatus) => void;
  onSubmit: (payload: RegistrationSubmitPayload) => void | Promise<void>;
  labels?: Partial<RegistrationLabels>;
  className?: string;
  style?: React.CSSProperties;
}

type OptionalFieldName = "firstName" | "lastName" | "displayName" | "phone" | "company";
type OAuthProvider = "google" | "github" | "apple" | "facebook" | "microsoft" | "x";
type RegistrationFormStatus = "idle" | "submitting" | "success" | "error";

/** Step-1 values only (email + password + consent + honeypot). */
interface RegistrationStep1Values {
  email: string;
  password?: string;                              // omitted under magic-link
  consentAccepted: boolean;
  _honeypot: string;                              // honeypot field value (should be "")
}

/** Step-1 values PLUS the optional profile bag. */
interface RegistrationStep2Values extends RegistrationStep1Values {
  firstName?: string;
  lastName?: string;
  displayName?: string;
  phone?: string;
  company?: string;
}

/**
 * Discriminated envelope — consumers MUST switch on `stepCompleted` to
 * know whether optional profile fields are populated. Narrowing fields
 * as `| undefined` was rejected because it silently lets naïve
 * destructuring send `undefined` values to backend APIs.
 */
type RegistrationSubmitPayload =
  | {
      stepCompleted: "single";                    // flow="single-step"
      values: RegistrationStep2Values;
      isHoneypotTripped: boolean;
    }
  | {
      stepCompleted: "step1";                     // two-step + user skipped step 2
      values: RegistrationStep1Values;
      isHoneypotTripped: boolean;
    }
  | {
      stepCompleted: "step2";                     // two-step + step 2 completed
      values: RegistrationStep2Values;
      isHoneypotTripped: boolean;
    };
```

## Design notes (load-bearing)

These come from the spec the user pasted + GATE 1 refinements; reproduced for traceability.

- Two-step flow uses a thin progress indicator (`1 / 2`, `2 / 2`) at the top, above the heading.
- Password strength meter is a 4-segment bar with descriptive label (`weak` / `fair` / `strong` / `excellent`).
- OAuth buttons are above the email field on mobile (stacked column); same-row flex on desktop (`sm:` breakpoint).
- ARIA error messages bound to inputs via `aria-describedby`; the inline error region carries `role="alert"` only when populated.
- Honeypot field is hidden via `position: absolute; left: -9999px; top: auto; width: 1px; height: 1px; overflow: hidden` + `tabIndex={-1}` + `aria-hidden="true"` + `autoComplete="off"`. The field is `name="website"`; spam-bot fillers tend to fill it. `_honeypot` flag in the submit payload exposes the trigger. **Critical: `display: none` is bot-detectable — the off-screen-position pattern is load-bearing for the honeypot to work.**
- Step-1 → step-2 transition: 150ms CSS opacity fade via project keyframes (no Framer Motion peer). **`prefers-reduced-motion: reduce` collapses the transition to a 0ms hard-swap** so screen-reader / a11y-tooling users aren't disorientated.

## Locks (carried from siblings without further question)

These mirror precedents already shipped in the registry — no need to re-litigate:

- **L1** Object-shape callbacks throughout (F-cross-12 lock — every shipped component since 2026-05-09 uses `(args) => ...`).
- **L2** Controlled-or-uncontrolled state pattern mirroring `newsletter-card-01`'s `status` / `onStatusChange` pair.
- **L3** Tone tokens via Tailwind v4 + OKLCH design tokens (signal-lime accent, Onest + JetBrains Mono fonts). No hardcoded hex; no `bg-gradient-to-X` (`bg-linear-to-X` in v4).
- **L4** Heading semantic level configurable; default `h2`.
- **L5** RTL-safe via logical properties only.
- **L6** Analytics via `onOAuthClick` + `onSubmit` callbacks; mirrors `share-bar-01`'s pattern.
- **L7** ARIA bridge via `ariaProps`-style attribute spreading (json-form v0.1.2 lock — `Slot.Root` strategy was dropped industry-wide for this).
- **L8** Component is a sealed folder with the standard 7 files (`<slug>.tsx`, `parts/`, `hooks/`, `types.ts`, `dummy-data.ts`, `demo.tsx`, `usage.tsx`, `meta.ts`, `index.ts`).
- **L9** Registry-shippable; meta.ts pins peer deps; `internal: []` (no cross-procomp deps).
- **L10** No `next/*` imports anywhere in the registry source (portability lock).

## Q1–Q7 — resolved at GATE 1 sign-off

All seven open questions locked with refinements; folded into the spec above. Verbatim from user sign-off:

- **Q1 ✅ Hand-roll on RHF + Zod.** "Registration is one form per app; bringing json-form's substrate + 12 shadcn deps for one consumer is overkill. No loss for us either: this form isn't translatable in the CMS-content sense (no per-locale fallback chain)."
- **Q2 ✅ OAuth icons text-only + `oauthIcons` slot.** Refinement: **fixtures bundle ships an example wiring lucide-react** (`<Mail />`, `<Github />`, etc.) so consumers see the slot shape on first read.
- **Q3 ✅ Honeypot field name `website`.** Refinement: docstring + render call out the off-screen pattern explicitly — `position: absolute; left: -9999px; top: auto; width: 1px; height: 1px; overflow: hidden` + `tabIndex={-1}` + `aria-hidden` + `autoComplete="off"`. **`display: none` is bot-detectable; the off-screen pattern is load-bearing.**
- **Q4 ✅ `skippableStepTwo` + "Skip for now" submits step-1 values.** Refinement: `onSubmit` payload is a **discriminated envelope** `{ stepCompleted: "single" | "step1" | "step2"; values; isHoneypotTripped }` — not optional-field narrowing. The envelope forces a switch on `stepCompleted` and prevents naïve destructuring from silently sending `undefined` profile fields to backend APIs.
- **Q5 ✅ Internal status default + controlled `status` / `onStatusChange` escape hatch.** Refinement: **mutual exclusion** documented explicitly — if `status` is passed, internal state becomes read-only (`status` is source of truth, `onStatusChange` fires for observers only). Mixing the two is a contract violation; surfaced in the consumer guide.
- **Q6 ✅ Built-in length + char-class-count heuristic; zxcvbn deferred to v0.2.** Refinement: **`strengthCalculator?: (password: string) => 0 | 1 | 2 | 3 | 4` is the v0.1 seam** — consumers BYO (corporate password policies, dictionary checks) without a breaking change; v0.2 can ship a zxcvbn adapter as a pluggable calc against the same shape.
- **Q7 ✅ 150ms CSS opacity fade, no motion peer.** Refinement: **`prefers-reduced-motion: reduce` collapses the transition to 0ms** so a11y tooling isn't disorientated.

---

**GATE 1 ✅ SIGNED OFF** (2026-05-22). Proceeding to Stage 2 plan (file-by-file scaffold, commit chain, validation glue). Will pause again for GATE 2 sign-off before any code lands.
