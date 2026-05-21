# registration-form-01 — procomp plan

> Stage 2: how. Implementation contract.
>
> **Predecessor:** [`registration-form-01-procomp-description.md`](./registration-form-01-procomp-description.md), GATE 1 signed off 2026-05-22 with seven refinements folded back into the spec (envelope payload, off-screen honeypot, mutual-exclusion docs, `strengthCalculator` seam, fixtures-show-the-slot, prefers-reduced-motion, hand-roll lock).
>
> Batch: 2 of 2 in the CMS conversion-block batch. Sibling: [`pricing-table-01`](../pricing-table-01-procomp/) (in-flight; structure mirrored here).

## Substrate decisions (locked)

| Decision | Choice | Source |
|---|---|---|
| Slug | `registration-form-01` | Description, GATE 1 lock |
| Category | `forms` (existing in `categories.ts`) | Description, GATE 1 lock |
| Substrate — form state | **`react-hook-form` v7.75.0** | Q1 lock — hand-roll, don't pull `@ilinxa/json-form` |
| Substrate — resolver | **`@hookform/resolvers` v5.2.2** (`/zod` import path) | Q1 lock — same versions as json-form for monorepo coherence |
| Substrate — validation schema | **`zod@^4.4.3`** | Q1 lock |
| Substrate — multi-step state | Internal `useState<'step1' \| 'step2'>` — no `useStepper` library, no controlled prop in v0.1 | Description "step state is internal-only" |
| Substrate — strength meter | Built-in heuristic + `strengthCalculator?` slot for BYO | Q6 lock |
| Substrate — transitions | CSS-only opacity fade (150ms) + `prefers-reduced-motion: reduce` → 0ms variant | Q7 lock — no Framer Motion peer |
| Substrate — honeypot rendering | Off-screen position (`left: -9999px`), NOT `display: none` | Q3 lock — bot-detectability |
| Submit payload | Discriminated envelope `{ stepCompleted, values, isHoneypotTripped }` | Q4 lock |
| Status state | Internal default with controlled `status` / `onStatusChange` escape hatch + mutual-exclusion contract | Q5 lock |
| OAuth icons | Text-only by default + `oauthIcons?: Partial<Record<OAuthProvider, ReactNode>>` slot; fixtures bundle ships a lucide-react example | Q2 lock |
| Object-shape callbacks | All `(args) => ...` per F-cross-12 lock | Library-wide lock |
| ARIA strategy | `ariaProps`-style attribute spreading; `role="alert"` on inline errors only when populated; `role="status"` on step indicator + success screen | json-form v0.1.2 lock, mirrored here |
| `next/*` imports | Forbidden (registry portability lock) | CLAUDE.md mandate |
| GATE 3 review template | **Spot-check** (5 dimensions, ~25–35 min) for v0.1.0 first ship. Rotating dim = Public API (the envelope payload + status-control mutual-exclusion are the load-bearing surfaces a peer would catch issues with). | Component-readiness rule |

## Final API

```ts
// types.ts — load-bearing surface

import type { ReactNode } from "react";
import type { ButtonVariant } from "../../../types";

export interface RegistrationForm01Props {
  /** Heading rendered above the form. Optional — consumer may render their own. */
  heading?: string;
  /** Subheading below the heading. */
  subheading?: string;
  /** Semantic level for `heading`. Defaults to `h2`. */
  headingAs?: "h1" | "h2" | "h3";

  /** Flow shape. Default `"single-step"`. */
  flow?: "single-step" | "two-step";
  /** Password vs magic-link strategy. Default `"password"`. */
  passwordStrategy?: "password" | "magic-link";
  /** Vertical-rhythm density. Default `"default"`. */
  density?: "compact" | "default";
  /** Controls whether step 2 of the two-step flow renders a "Skip for now" button. Default `true`. Ignored when `flow === "single-step"`. */
  skippableStepTwo?: boolean;

  /** Optional-fields bag. Each key: `true` = show + optional; `false` (or omitted) = hidden; `{ required: true }` = show + required. */
  fields?: Partial<Record<OptionalFieldName, boolean | { required: boolean }>>;

  /** Password validators + strength-meter toggle. Ignored under `passwordStrategy: "magic-link"`. */
  passwordPolicy?: {
    minLength?: number; // default 8
    requireUppercase?: boolean;
    requireNumber?: boolean;
    requireSymbol?: boolean;
    showStrengthMeter?: boolean; // default true
  };
  /** BYO strength heuristic. Returns 0 (empty/unrated) or 1–4 (weak/fair/strong/excellent). Default is the built-in length+char-class scorer. */
  strengthCalculator?: (password: string) => 0 | 1 | 2 | 3 | 4;

  /** ToS consent gate. `required: true` blocks submit until checked. `label` accepts ReactNode for inline `<Link>` composition. */
  consent: {
    required: boolean;
    label: ReactNode | string;
    href?: string; // only used when `label` is a string
  };

  /** Render OAuth buttons above the email field. Empty array (or omitted) renders no OAuth row + no divider. */
  oauthProviders?: ReadonlyArray<OAuthProvider>;
  /** Per-provider icon override slot. Default: text-only buttons. */
  oauthIcons?: Partial<Record<OAuthProvider, ReactNode>>;
  /** Fires on OAuth button click. Component does NOT handle the redirect / SDK call. */
  onOAuthClick?: (args: { provider: OAuthProvider }) => void;

  /** Submit button label + variant override. Defaults: `{ label: "Create account", variant: "default" }`. Step-1 of two-step auto-overrides to `{ label: "Continue" }`. */
  submitButton?: { label?: string; variant?: ButtonVariant };

  /** Renders "Already have an account? Sign in" link below the form. Omit to hide the link. */
  signInHref?: string;

  /** Controlled server-error message. When set, renders a `role="alert"` banner. Yields display precedence over internal `error` status. */
  errorMessage?: string;
  /** Success screen content. Renders on `onSubmit` resolving without throwing (default) or on `status === "success"` (controlled). */
  successMessage?: ReactNode | string;

  /**
   * Controlled status escape hatch. **Mutual exclusion:** if provided, internal state becomes read-only — the component reads `status` as source of truth and fires `onStatusChange` for observers only. If omitted, internal state owns transitions and `onStatusChange` fires on each one. Mixing the two is a contract violation; surfaced in the consumer guide.
   */
  status?: RegistrationFormStatus;
  onStatusChange?: (status: RegistrationFormStatus) => void;

  /** Submit handler — receives the discriminated envelope. */
  onSubmit: (payload: RegistrationSubmitPayload) => void | Promise<void>;

  /** Per-string overrides. Falls back to `defaultRegistrationLabels`. */
  labels?: Partial<RegistrationLabels>;

  /** Container className / style — applied to the outermost wrapper. */
  className?: string;
  style?: React.CSSProperties;
}

export type OptionalFieldName =
  | "firstName" | "lastName" | "displayName" | "phone" | "company";

export type OAuthProvider =
  | "google" | "github" | "apple" | "facebook" | "microsoft" | "x";

export type RegistrationFormStatus =
  | "idle" | "submitting" | "success" | "error";

export interface RegistrationStep1Values {
  email: string;
  password?: string;        // omitted under `passwordStrategy: "magic-link"`
  consentAccepted: boolean;
  _honeypot: string;        // should be ""
}

export interface RegistrationStep2Values extends RegistrationStep1Values {
  firstName?: string;
  lastName?: string;
  displayName?: string;
  phone?: string;
  company?: string;
}

export type RegistrationSubmitPayload =
  | { stepCompleted: "single"; values: RegistrationStep2Values; isHoneypotTripped: boolean }
  | { stepCompleted: "step1"; values: RegistrationStep1Values; isHoneypotTripped: boolean }
  | { stepCompleted: "step2"; values: RegistrationStep2Values; isHoneypotTripped: boolean };

export interface RegistrationLabels {
  // Field labels
  emailLabel: string;
  emailPlaceholder: string;
  passwordLabel: string;
  passwordPlaceholder: string;
  firstNameLabel: string; firstNamePlaceholder: string;
  lastNameLabel: string;  lastNamePlaceholder: string;
  displayNameLabel: string; displayNamePlaceholder: string;
  phoneLabel: string;     phonePlaceholder: string;
  companyLabel: string;   companyPlaceholder: string;

  // Buttons
  createAccountLabel: string;     // default submit label
  continueLabel: string;          // step-1 → step-2 label
  backLabel: string;
  skipForNowLabel: string;
  signInLabel: string;

  // OAuth
  orContinueWith: string;         // divider text
  oauthLabelTemplate: string;     // e.g., "Continue with {provider}"; {provider} interpolated

  // Step indicator
  stepOf: string;                 // e.g., "Step {current} of {total}"

  // Error messages
  emailRequired: string;
  emailInvalid: string;
  passwordRequired: string;
  passwordTooShort: string;       // "{min}" interpolated
  passwordMissingUppercase: string;
  passwordMissingNumber: string;
  passwordMissingSymbol: string;
  consentRequired: string;

  // Strength meter
  strengthWeak: string;
  strengthFair: string;
  strengthStrong: string;
  strengthExcellent: string;
  strengthLabel: string;          // "Strength: {level}"

  // Server-error fallback
  serverError: string;

  // Success
  successDefaultMessage: string;

  // sr-only accessibility hints
  passwordToggleShow: string;
  passwordToggleHide: string;
  honeypotLabel: string;          // sr-only; "Leave this field empty"
}
```

The default English labels live in `parts/labels.ts` and are merged with consumer overrides at the top of the component via `mergeRegistrationLabels()`.

## File-by-file plan

### 1. `registration-form-01.tsx` — root

- Renders `<section>` + heading + (optional) `<OauthRow>` + `<form>` + (optional) `<StepIndicator>` + (optional) `<ServerError>` + step shell + `<SubmitRow>` + `<SignInLink>`.
- Owns: top-level state (current step for two-step), internal `status`, `consentAccepted` checkbox state, honeypot value.
- Uses `useRegistrationForm()` hook for the RHF + Zod glue.
- Resolves status precedence: if `props.status` is provided, render based on it (read-only mode); else render based on internal `status`. Fire `onStatusChange` on every internal transition AND when `status` reads change.
- Handles `errorMessage` precedence — when set, displays it; otherwise uses internal-error fallback from labels.
- On submit success → if `status` is uncontrolled, internal flips to `"success"` and the success screen renders. If `status` is controlled and not flipped to `"success"`, the form stays mounted (consumer responsibility).

### 2. `parts/oauth-row.tsx`

- Renders the OAuth button row + divider. Stacks column on mobile, flex-row on `sm:` breakpoint.
- Maps `oauthProviders` × `oauthIcons` × `labels.oauthLabelTemplate` to a button per provider.
- Divider is `<hr role="separator" aria-label={labels.orContinueWith}>` with visual text spans either side (the `<hr>` is sr-only; the text is presentational).
- Each button is `<Button variant="outline">` with `onClick={() => onOAuthClick?.({ provider })}` + the icon slot rendered inline if provided.
- Skipped entirely (returns `null`) if `oauthProviders` is undefined or empty.

### 3. `parts/email-field.tsx`

- `<Input type="email" autoComplete="email" />` + `<Label>` + inline error.
- Wired to RHF via `<Controller>` or `register()`.
- `aria-describedby` points to the inline error region; error has `role="alert"` only when populated (controlled by `fieldState.error?.message`).

### 4. `parts/password-field.tsx`

- `<Input type="password" autoComplete="new-password" />` + show/hide eye toggle button (a `<Button variant="ghost" size="icon">` with `<Eye />` / `<EyeOff />` from lucide-react and an `aria-label` from `labels.passwordToggleShow` / `Hide`).
- Toggle is local state inside the component (uncontrolled).
- Strength meter renders inline below when `passwordPolicy.showStrengthMeter !== false` AND `passwordStrategy === "password"`.
- Hidden entirely under `passwordStrategy: "magic-link"` (parent skips rendering).

### 5. `parts/strength-meter.tsx`

- 4-segment bar (`<div role="presentation">` containing four spans).
- Renders `{ score, label }` returned by the hook `useStrengthMeter({ calculator?, labels })`. The hook internally watches the password field via `useWatch({ control, name: "password" })` (RHF context — no password arg passed through props).
- Segments highlight from left based on score; descriptive text label below has `aria-live="polite"` so SR users hear "Strength: strong" on update.
- Respect `prefers-reduced-motion: reduce` — segments transition `transform`/`opacity` over 100ms by default; transition is `none` under reduced-motion.

### 6. `parts/optional-fields-fieldset.tsx`

- `<fieldset>` containing each field configured in `props.fields`.
- Iterates a static `OPTIONAL_FIELD_NAMES` array and renders the configured ones.
- Each input is a small inline component (no separate file per — keeps the part count down).
- Two-column grid on `sm:` breakpoint (`grid grid-cols-1 sm:grid-cols-2 gap-3`); single column under `density: "compact"`.

### 7. `parts/consent-checkbox.tsx`

- `<Checkbox>` + `<Label>` containing the consent `label` ReactNode (or `<a href>` for the string-+-href convenience overload).
- Wired to RHF via `<Controller>`.
- `aria-invalid` flips true when consent is required + unchecked + form has been submitted.

### 8. `parts/honeypot-field.tsx`

- Single `<input>` with **two-key duality** — the HTML `name` attribute is the spam-bait name (`"website"`), and the RHF register key is the values-bag key (`"_honeypot"`). Bots tuned to fill `name="website"` get caught; the RHF state carries the value under the underscore-prefixed key so consumers reading `payload.values._honeypot` see the trap value cleanly without a misleading `payload.values.website` shape.
- **Critical implementation detail:** `{...register("_honeypot")}` returns `{ name: "_honeypot", onChange, onBlur, ref }`. The default `name` value will override an `name="website"` JSX attribute placed BEFORE the spread. The correct order is: spread `register()` FIRST, then override `name` AFTER:
  ```tsx
  <input
    type="text"
    autoComplete="off"
    tabIndex={-1}
    aria-hidden="true"
    {...register(HONEYPOT_RHF_KEY)}
    name={HONEYPOT_HTML_NAME}        // OVERRIDES register's name="_honeypot"
    style={HONEYPOT_STYLE}
  />
  ```
- Component-internal docstring explicitly calls out two non-obvious facts so a future refactorer doesn't break the trap:
  1. `display: none` is bot-detectable — the off-screen-position pattern is load-bearing.
  2. JSX attribute order matters here: `name` override must come AFTER the `register()` spread; otherwise React quietly drops the override and the rendered input has `name="_honeypot"`, defeating the spam ruse.

### 9. `parts/step-indicator.tsx`

- Renders the `1 / 2`, `2 / 2` progress strip when `flow === "two-step"`.
- `<div role="status" aria-live="polite">` containing two dot/segment indicators + the `labels.stepOf` template ("Step 1 of 2").
- Hidden entirely on single-step flow.

### 10. `parts/step-shell.tsx`

- Wrapper that renders step 1 OR step 2 content based on internal step state.
- Applies a CSS opacity-fade transition on step change via a `data-step="step1"|"step2"` attribute + CSS keyframes in the sealed-folder CSS.
- Honors `prefers-reduced-motion` — keyframes collapse to `animation: none` under reduce.
- For `flow === "single-step"`, renders all sections inline without the step-shell wrapper.

### 11. `parts/server-error.tsx`

- `role="alert"` banner above the form when `errorMessage` is non-empty.
- Style: red-border + tinted-bg + `<AlertCircle />` icon.
- `null` when no error.

### 12. `parts/success-screen.tsx`

- `role="status"` region that replaces the form when status is `"success"`.
- Renders `successMessage` (default English fallback if not provided).
- A "Back to sign-up" link is NOT included by default — the consumer either re-renders parent with a fresh `status: "idle"` or pops the user to a different route. Mention in usage docs.

### 13. `parts/submit-row.tsx`

- Renders the submit button + (on step 2 only) back button + (on step 2 only, if `skippableStepTwo`) "Skip for now" button.
- Submit button is `type="submit"`; back / skip are `type="button"` to avoid firing form submit.
- Spinner inside the submit label when `status === "submitting"` (lucide-react `<Loader2 className="animate-spin" />`).

### 14. `parts/sign-in-link.tsx`

- Renders `"Already have an account? Sign in"` below the form when `signInHref` is provided.
- `<a href>` only — no router primitive (registry portability).
- Returns `null` when `signInHref` is undefined.

### 15. `parts/labels.ts`

- Exports `defaultRegistrationLabels: RegistrationLabels` (English defaults) + `mergeRegistrationLabels(override?: Partial<RegistrationLabels>): RegistrationLabels` helper (shallow merge over defaults).
- Both names are re-exported from `index.ts` (matches the names referenced in §29). Mirrors json-form's `defaultJsonFormStrings` + `mergeJsonFormStrings` aliasing pattern.

### 16. `hooks/use-registration-form.ts`

- The substrate hook. Owns:
  - `useForm()` from RHF with the dynamically-built Zod resolver (memoized via `useMemo(() => buildSchema(...), [...])`).
  - Status state machine (`idle` → `submitting` → (`success` | `error`)) with controlled-mode mutual-exclusion check.
  - Step state (`"step1"` | `"step2"`) for two-step flow (composes `useFormStep` internally).
  - Submit handler that builds the discriminated envelope from current step + form values + honeypot value.
- Return shape (explicit action surface, no opaque `transitions` bag):
  ```ts
  {
    form: UseFormReturn<RegistrationStep2Values>;
    status: RegistrationFormStatus;          // current (controlled or internal)
    step: "step1" | "step2";
    goNext: () => Promise<boolean>;          // step1 → step2 with partial validation
    goBack: () => void;                      // step2 → step1
    submit: () => Promise<void>;             // wraps form.handleSubmit + status transitions + envelope build
    skip: () => Promise<void>;               // step2 skip → submit with stepCompleted: "step1"
  }
  ```
- **Mutual-exclusion enforcement (Q5 lock):** if `props.status` is provided, the hook's internal `setStatus` is a no-op (`if (props.status !== undefined) return;`). The "what status SHOULD this transition to" calc still runs and fires `onStatusChange(nextStatus)` for observers — consumers can either reflect the change into their controlled `status` prop or ignore it.

### 17. `hooks/use-strength-meter.ts`

- Signature: `useStrengthMeter(args: { calculator?: StrengthCalculator; labels: Pick<RegistrationLabels, "strengthWeak" | "strengthFair" | "strengthStrong" | "strengthExcellent" | "strengthLabel"> }): { score: 0|1|2|3|4; label: string }`.
- Subscribes to the password field via `useWatch({ control, name: "password" })` against the active RHF FormProvider context — no password value passed through props.
- Computes score via `args.calculator ?? defaultStrengthCalculator` from `lib/strength-calculator.ts`. Clamps the result to `[0, 4]` defensively so a buggy consumer-supplied calculator returning out-of-range values doesn't crash the meter.
- Returns the rendered label by interpolating `labels.strengthLabel` (template `"Strength: {level}"`) with the bucketed `strengthWeak|Fair|Strong|Excellent` text.

### 18. `hooks/use-form-step.ts`

- Encapsulates the step state machine: `useState<"step1" | "step2">("step1")` + `goNext()` / `goBack()` actions.
- Validates step 1 (email + password + consent) before allowing `goNext()` to flip to step 2 — partial validation via `form.trigger(["email", "password", "consentAccepted"])`.
- For `flow === "single-step"`, the hook is still called for hook-order stability but step is always `"step1"` and actions are no-ops.

### 19. `lib/build-schema.ts`

- Pure function `buildSchema({ flow, passwordStrategy, passwordPolicy, fields, consent, labels }): ZodObject<...>`.
- Composes Zod chain from props — no runtime overhead beyond one composition at mount.
- Returns DIFFERENT shapes for `step1` vs `step2` vs `single` since the step-2 schema is a superset of step-1.
- Memoized at the hook level via `useMemo(buildSchema(...), [propsThatChangeShape])`.

### 20. `lib/honeypot.ts`

- Exports three constants (two-key duality is load-bearing — see part 8):
  - `HONEYPOT_HTML_NAME = "website"` — the rendered HTML `name` attribute (the spam-bait name bots fill).
  - `HONEYPOT_RHF_KEY = "_honeypot"` — the RHF register key + the values-bag key consumers see at `payload.values._honeypot`.
  - `HONEYPOT_STYLE: React.CSSProperties` — inline-style object for the off-screen rendering (`position: absolute; left: -9999px; top: auto; width: 1px; height: 1px; overflow: hidden`).
- Exports `isHoneypotTripped(value: string): boolean` — `value.length > 0` (a real user can't tab into this field, so any non-empty value means a bot filled it).
- Reused by `parts/honeypot-field.tsx` + the submit handler in `hooks/use-registration-form.ts` (which reads the honeypot value via `form.getValues(HONEYPOT_RHF_KEY)` to set the `isHoneypotTripped` flag on the payload).

### 21. `lib/oauth-providers.ts`

- Exports `OAUTH_PROVIDERS` constant array (`["google", "github", ...]`) for runtime iteration.
- Exports `getOAuthProviderLabel(provider, template)` helper that capitalizes the provider name and interpolates `{provider}` into `labels.oauthLabelTemplate`.

### 22. `lib/strength-calculator.ts`

- Exports `defaultStrengthCalculator(password): 0 | 1 | 2 | 3 | 4`.
- Algorithm: 0 for empty; else `score = clamp(1, 4, floor(length / 4) + characterClassCount - 1)` where character classes = `{ has-lowercase, has-uppercase, has-number, has-symbol }`.
- Pure function, ~30 LOC.

### 23. `registration-form-01.css`

- Sealed-folder CSS for the step-transition keyframes.
- Imported once at the root component (`import "./registration-form-01.css"`).
- ~30 LOC: `@keyframes step-fade-in` + `[data-step-shell] { animation: ... }` + `@media (prefers-reduced-motion: reduce) { [data-step-shell] { animation: none; } }`.

### 24. `types.ts`

- Already shown above. Exported types: `RegistrationForm01Props`, `OptionalFieldName`, `OAuthProvider`, `RegistrationFormStatus`, `RegistrationStep1Values`, `RegistrationStep2Values`, `RegistrationSubmitPayload`, `RegistrationLabels`.

### 25. `dummy-data.ts`

- Six fixtures:
  - `defaultRegistrationProps` — minimal single-step + email/password + consent (no OAuth, no optional fields).
  - `oauthRegistrationProps` — single-step + Google + GitHub OAuth + email/password + consent + `oauthIcons` example wiring lucide-react `<Mail />` (Google fallback) + `<Github />`.
  - `twoStepRegistrationProps` — two-step + firstName/lastName optional in step 2 + skippable.
  - `magicLinkRegistrationProps` — magic-link strategy + email-only + Apple + Google OAuth.
  - `denseRegistrationProps` — `density: "compact"` + minimal fields for sidebar.
  - `controlledRegistrationProps` — `status` + `onStatusChange` example (demonstrates mutual-exclusion contract).

### 26. `demo.tsx`

- Single-page tab layout (6 tabs, one per fixture above).
- Each tab renders the component with the fixture's props.
- `onSubmit` logs the payload to a `<pre>` block below the form so the consumer can see the envelope shape.
- Top-of-page caption: "Six common registration shapes. Tabs above; submit any form to see the discriminated payload."

### 27. `usage.tsx`

- Consumer-facing usage doc. Sections:
  - **Quick start** — 10-line minimal example.
  - **OAuth icons slot** — code showing the `oauthIcons` wire with lucide-react.
  - **Two-step flow** — the discriminated envelope walkthrough with a `switch (payload.stepCompleted)` block.
  - **Magic-link** — minimal example.
  - **Password policy + strength calculator** — built-in default + BYO heuristic example.
  - **Controlled status** — mutual-exclusion contract + worked example.
  - **Honeypot** — what it does, why off-screen position is load-bearing.
  - **Accessibility** — ARIA notes, prefers-reduced-motion behavior.
  - **FAQ** — 5-6 entries (Why no JSON schema? Why no built-in OAuth icons? Why a discriminated envelope? How do I show server errors?).

### 28. `meta.ts`

- `slug: "registration-form-01"`, `name: "Registration Form 01"`, `category: "forms"`, `status: "alpha"`, `version: "0.1.0"`, `createdAt: "2026-05-22"`, `updatedAt: "2026-05-22"`.
- `dependencies.shadcn`: `["input", "label", "button", "checkbox"]` (4 primitives — no select, no dialog, no popover).
- `dependencies.npm`: `{ "react-hook-form": "^7.75.0", "@hookform/resolvers": "^5.2.2", "zod": "^4.4.3", "lucide-react": "^1.11.0" }`.
- `dependencies.internal`: `[]` (no cross-procomp deps — Q1 lock).
- `description` + `features` follow the json-form / pricing-table-01 pattern (load-bearing intro + bullet list of capabilities).
- `tags`: `["registration", "form", "auth", "oauth", "magic-link", "rhf", "zod"]`.

### 29. `index.ts`

- Re-exports `RegistrationForm01` (the root component) + all public types from `types.ts` + `defaultRegistrationLabels` + `mergeRegistrationLabels` + `defaultStrengthCalculator`.
- Internal-only (`use-*` hooks, `lib/honeypot.ts`, `parts/*`) are NOT re-exported.

## Dependencies

### Internal (pro-ui)
- None. `internal: []` in meta.ts. (Q1 lock.)

### NPM
- `react-hook-form@^7.75.0` (substrate)
- `@hookform/resolvers@^5.2.2` (zod adapter)
- `zod@^4.4.3` (validation)
- `lucide-react@^1.11.0` (icons — `<Eye>`, `<EyeOff>`, `<Loader2>`, `<AlertCircle>`, `<Check>`)

All four are already producer deps for json-form / other procomps — no new NPM additions.

### shadcn primitives
- `input`, `label`, `button`, `checkbox` — all already in `src/components/ui/`. No `pnpm dlx shadcn add` needed.

## Composition pattern

The root component is a **single-file orchestrator**: it threads props through the hook + renders the small parts in the right order. Step transitions are handled in `parts/step-shell.tsx` via CSS-only attribute-driven keyframes; the hook fires `goNext()` / `goBack()` which flip `data-step` on the wrapper.

Status state machine:
- Internal default: `idle` → `submitting` (on form submit) → `success` (on resolve) | `error` (on reject).
- Controlled mode: `props.status` is the source of truth; internal `setState` calls are no-ops; `onStatusChange` fires for observers only.

## Client vs server

- Component is `"use client"` — RHF, status state, step state, password show/hide all need client state.
- SSR-safe: no `window` / `document` access at render time; only inside event handlers.
- SSR + hydration: deterministic — no `Math.random()` / `useId` collisions (uses React 19 `useId()` for any generated IDs).

## Edge cases

- **`passwordStrategy: "magic-link"` + `passwordPolicy` provided** → policy is ignored, no console warning (it's not a misuse, just a no-op).
- **`flow: "single-step"` + `skippableStepTwo: true`** → `skippableStepTwo` is ignored (no console warning; single-step has no step 2).
- **`oauthProviders: []` (empty array)** → row + divider don't render (same as omitting).
- **`fields: { firstName: { required: true }, lastName: false }`** → firstName renders + required; lastName doesn't render at all.
- **`consent.required: false`** → checkbox still renders (unchecked by default, no validation), `consentAccepted` in the payload reflects the actual checkbox state.
- **`consent.label` is `ReactNode` AND `consent.href` is also provided** → ReactNode wins; href is ignored.
- **Submit during `submitting` status** → ignored (button is `disabled` while submitting).
- **User pastes a very long password (>1000 chars)** → strength meter clamps to score 4 (no perf issue; calc is O(n) char-class check).
- **OAuth click while form is in `submitting` status** → OAuth fires anyway (it's a separate flow; consumer drives the redirect).
- **`status === "success"` + user navigates back via browser back** → component remounts in `idle` state (state-on-mount default).
- **Honeypot field actually filled** → form submits successfully + payload has `isHoneypotTripped: true`. Component does NOT block the submit. Consumer flags upstream.
- **Step-1 partial validation fails** → `goNext()` doesn't transition; the failing fields surface their errors inline.
- **Consumer passes `status="submitting"` + clicks submit again** → the second click is a contract violation (controlled-mode read-only state); component fires `onStatusChange` again but doesn't transition internal state. Documented in mutual-exclusion contract.
- **`prefers-reduced-motion: reduce`** → step transitions collapse to 0ms (no animation); strength-meter segment transitions collapse to 0ms.
- **`compact` density + `flow="two-step"` + `oauthProviders` with 4 providers + all optional fields visible** → still legible at `sm:` breakpoint (verified via design system mandate review during implementation).

## Accessibility

- `<section aria-labelledby={headingId}>` wraps the whole form.
- `<h2 id={headingId}>` for the heading; `headingAs` overrides the element.
- Step indicator: `role="status" aria-live="polite"` so SR users hear "Step 2 of 2" on transition.
- Each input: `<Label htmlFor>` → `<Input id>` binding; `aria-describedby` → inline error id; `aria-invalid` flips on validation failure.
- Inline errors: `role="alert"` only when populated (so SR users don't hear empty regions).
- Server-error banner: `role="alert"` (always announces if rendered).
- Success screen: `role="status" aria-live="polite"` (announces "You're in — check your inbox" on transition).
- Honeypot: `aria-hidden="true"` + `tabIndex={-1}` keeps it off keyboard / SR tab order.
- OAuth divider: `<hr role="separator" aria-label={labels.orContinueWith}>` keeps the divider announced as a separator with the "or" label.
- Submit button: `aria-busy={status === "submitting"}` + disabled during submit.
- Password toggle: `aria-pressed={isShown}` + `aria-label={isShown ? labels.passwordToggleHide : labels.passwordToggleShow}`.
- Strength meter: bar is `role="presentation"`; the descriptive text label below has `aria-live="polite"` and reads "Strength: strong".

## Verification checklist (before push)

- [ ] `pnpm tsc --noEmit` clean (0 errors)
- [ ] `pnpm lint` clean (or only pre-existing warnings unrelated to this slug)
- [ ] `pnpm validate:meta-deps` clean (46/46 after adding this slug)
- [ ] `pnpm validate:default-registry-whitelist` clean (25/25 — this component doesn't touch the json-form whitelist but the lint runs over the project)
- [ ] `pnpm registry:build` produces `public/r/registration-form-01.json` + `registration-form-01-fixtures.json` cleanly
- [ ] Docs site renders at `/components` + `/components/registration-form-01` without console errors
- [ ] CDP harness: clicks through every demo tab and the submit button on each; captures any console warnings / errors
- [ ] Honeypot rendering: visual inspection — field NOT visible in the layout, NOT in keyboard tab order (Tab key skips over it)
- [ ] OAuth fixture: clicking a provider button fires `onOAuthClick({ provider })` with the right name
- [ ] Two-step skip: clicking "Skip for now" submits with `stepCompleted: "step1"` payload + optional fields absent
- [ ] Controlled-status demo: passing `status="submitting"` keeps the spinner spinning + ignores user clicks
- [ ] Reduced-motion: with `prefers-reduced-motion: reduce`, step transitions are instant (Chrome DevTools → Rendering → "Emulate CSS media feature prefers-reduced-motion: reduce")
- [ ] Path-b smoke: install `@ilinxa/registration-form-01` into the local `e:/tmp/ilinxa-smoke-consumer/` harness; consumer-tsc clean; component renders

## Risks & alternatives

### Risk 1: Honeypot-effectiveness regression
Spam-bot evolution outpaces honeypot design. The off-screen + `tabIndex={-1}` + `aria-hidden` triple is current best practice, but well-built bots may eventually parse the inline style and skip the field. Mitigation: the `isHoneypotTripped` flag in the payload lets consumers add CAPTCHA / Turnstile / hCaptcha as a v0.2 slot if the false-negative rate ever becomes a problem. Tracked as an out-of-scope item in the description.

### Risk 2: Discriminated envelope feels heavy to consumers used to flat `values`
Some consumers will write `onSubmit={async ({ values }) => await api.signUp(values)}` and the destructure will fail at runtime (well, at type-check). Mitigation: the FAQ in usage.tsx leads with the envelope-payload walkthrough + a `switch (payload.stepCompleted)` example. This is intentional — the alternative (narrowing fields as `| undefined`) silently sends `undefined` profile data to backend APIs, which is worse.

### Risk 3: Status mutual-exclusion misuse
Consumers passing `status="submitting"` AND expecting internal `success` transition on resolve will hit the "did it transition?" debugging trap. Mitigation: usage.tsx + the JSDoc on `status` document the contract explicitly; the component never transitions when controlled.

### Risk 4: `strengthCalculator` BYO returning out-of-range values
A consumer-supplied calculator could return `5` or `-1`. Mitigation: clamp the return at the meter render site (`Math.max(0, Math.min(4, score))`); document the type signature as `0 | 1 | 2 | 3 | 4` so TS catches the common case.

### Alternatives considered
- **Delegate to json-form** (Q1 trade-off) — rejected. ~12 shadcn primitives + the json-form bundle for one form is overkill.
- **Three-step (or more) wizard** — out of scope per description.
- **Built-in CAPTCHA** — out of scope per description; honeypot is the v0.1 anti-spam.
- **OAuth SDK / redirect** — out of scope; `onOAuthClick` is the seam.
- **Framer Motion for transitions** — rejected. Per the project's motion-substrate memory, FM is not a peer dep yet; CSS keyframes are free.

## Commit chain (locked)

11 commits, one logical concern each. Each prefixed `feat(registration-form-01):` unless noted.

| # | Subject | Files |
|---|---|---|
| C1 | scaffold + types + meta + index + empty parts | `src/registry/components/forms/registration-form-01/**` (sealed folder via `pnpm new:component`); `src/registry/manifest.ts` (3-line entry add) |
| C2 | lib + hooks — Zod schema builder, strength calc, honeypot const, step state, status state | `lib/build-schema.ts`, `lib/honeypot.ts`, `lib/oauth-providers.ts`, `lib/strength-calculator.ts`, `hooks/use-registration-form.ts`, `hooks/use-strength-meter.ts`, `hooks/use-form-step.ts` |
| C3 | parts (input bits) — email, password (+show/hide), consent, honeypot, optional-fields fieldset | `parts/email-field.tsx`, `parts/password-field.tsx`, `parts/consent-checkbox.tsx`, `parts/honeypot-field.tsx`, `parts/optional-fields-fieldset.tsx` |
| C4 | parts (shell + state surfaces) — step-indicator, step-shell, server-error, success-screen, submit-row, sign-in-link, oauth-row, strength-meter, labels, CSS | `parts/step-indicator.tsx`, `parts/step-shell.tsx`, `parts/server-error.tsx`, `parts/success-screen.tsx`, `parts/submit-row.tsx`, `parts/sign-in-link.tsx`, `parts/oauth-row.tsx`, `parts/strength-meter.tsx`, `parts/labels.ts`, `registration-form-01.css` |
| C5 | root component — orchestrator threading | `registration-form-01.tsx`, `index.ts` (final re-exports) |
| C6 | demo + usage + dummy-data — 6 fixtures, 6-tab demo, usage doc | `demo.tsx`, `usage.tsx`, `dummy-data.ts` |
| C7 | registry.json entry + base/fixtures items | `registry.json` (one base + one fixtures sibling) |
| C8 | full verification — tsc + lint + meta-deps + registry:build + page-load | (no file changes; verification commit) |
| C9 | path-b smoke harness | `e:/tmp/ilinxa-smoke-consumer/` (off-tree); no project commit unless smoke surfaces a fix |
| C10 | GATE 3 spotcheck — author review file | `docs/procomps/registration-form-01-procomp/reviews/2026-05-22-v0.1.0-spotcheck.md` |
| C11 | STATUS.md + component-versions.md + decision file + manifest + meta-deps audit + final commit + push | `.claude/STATUS.md`, `.claude/decisions/2026-05-22-registration-form-01-v0.1.0-first-ship.md`, `docs/component-versions.md` |

**Estimated total LOC** ≈ 1,400 (root 200 + parts ~450 + hooks ~250 + lib ~150 + CSS 30 + types 120 + dummy-data 100 + demo 130). Comparable to `pricing-table-01` (in-flight) and `newsletter-card-01` (~700 LOC).

---

**GATE 2 ask:** confirm the file-by-file structure, the commit chain, the dependency set, and the verification checklist. Once signed off, I scaffold with `pnpm new:component forms/registration-form-01` and start C1. No code lands before GATE 2 sign-off.
