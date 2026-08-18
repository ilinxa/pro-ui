# `signup-form` — Pro-component Guide (Stage 3)

> **Status:** shipped · **v0.2.0** · maturity `alpha` · category `forms`
> **Planning trio:** [description](signup-form-procomp-description.md) · [plan](signup-form-procomp-plan.md) · this guide
>
> Written 2026-08-19 while closing the guide-doc gap. Documented against source.

---

## 1. What it is

A complete account-creation form: email + password (or magic link), optional profile fields, a
consent gate, OAuth buttons, password-strength feedback, and a success screen. Validation is
`react-hook-form` + `zod` internally; you supply one `onSubmit`.

It handles the **form**, never the **auth**. It does not call your provider, set cookies, or
redirect — `onSubmit` and `onOAuthClick` are where your code takes over.

## 2. When to use / when NOT to use

**Use when** you need a real signup screen without assembling fifteen primitives and a validation
schema by hand.

**Skip when:**
- **You need sign-*in*.** This is registration-shaped (consent gate, password policy, strength
  meter). A login form is a different, smaller component.
- **You need arbitrary custom fields.** The optional-field bag is a **fixed set** of known
  identity fields, not a form builder. For arbitrary schemas use [`json-form`](../json-form-procomp/).
- **Your flow is more than two steps** or has conditional branching. Compose it yourself.

## 3. Installation

```bash
pnpm dlx shadcn@latest add @ilinxa/signup-form
```

Registry deps: `input`, `label`, `button`, `checkbox`.
npm: `react-hook-form`, `@hookform/resolvers`, `zod`, `lucide-react`.

## 4. Quick start

```tsx
<SignupForm
  heading="Create your account"
  consent={{ required: true, label: "I agree to the Terms", href: "/terms" }}
  onSubmit={async (payload) => {
    await api.signup(payload);
  }}
/>
```

`consent` and `onSubmit` are the only required props.

## 5. Flow shapes

| Prop | Values | Notes |
|---|---|---|
| `flow` | `"single-step"` (default) · `"two-step"` | Two-step splits credentials from profile |
| `passwordStrategy` | `"password"` (default) · `"magic-link"` | Magic link drops the password field **and** the whole `passwordPolicy` |
| `density` | `"default"` · `"compact"` | Vertical rhythm only |
| `skippableStepTwo` | `true` (default) | Renders "Skip for now" on step 2; ignored in single-step |

On step 1 of a two-step flow the submit label auto-overrides to **"Continue"** regardless of
`submitButton.label` — that override is intentional, not a bug to work around.

## 6. The submit payload is discriminated

`onSubmit` receives a `SignupSubmitPayload` — a discriminated envelope, not a flat object. Narrow
it rather than reaching for fields that may not exist under the current strategy:

```tsx
onSubmit={(payload) => {
  // Narrow on the discriminant before reading strategy-specific fields.
  // Under `magic-link` there is no password to read at all.
}}
```

This is why the type is exported: annotate your handler with `SignupSubmitPayload` and let the
compiler show you which fields are actually present.

## 7. Optional fields

```tsx
fields={{
  fullName: true,               // shown, optional
  username: { required: true }, // shown, required
  // omitted or `false` → hidden
}}
```

Three states per key: `true` (show + optional), `{ required: true }` (show + required), absent or
`false` (hidden). The key set is fixed — see `OptionalFieldName`.

## 8. Password policy + strength

```tsx
passwordPolicy={{
  minLength: 10,          // default 8
  requireUppercase: true,
  requireNumber: true,
  requireSymbol: false,
  showStrengthMeter: true, // default true
}}
```

The default scorer is a `(length, character-class-count)` heuristic in
`lib/strength-calculator.ts`. Swap it with `strengthCalculator` — the prop exists so you can drop
in `zxcvbn` without this component taking the dependency:

```tsx
strengthCalculator={(password) => myZxcvbnAdapter(password)}
```

> The whole `passwordPolicy` block is **ignored** under `passwordStrategy: "magic-link"`. Setting a
> policy there is silent, not an error.

## 9. Controlled status — the mutual-exclusion rule

`status` is an escape hatch with a strict contract:

- **Omit `status`** → the component owns transitions and fires `onStatusChange` as they happen.
- **Pass `status`** → internal state becomes **read-only**. The component renders what you tell it
  and `onStatusChange` becomes observer-only.

> ⚠️ **Passing `status` while expecting the component to keep transitioning itself is a contract
> violation**, and it fails in the most confusing way available: the form appears frozen mid-submit
> because your state never advanced. Pick one owner.

`errorMessage` takes display precedence over the internal `error` status — so a server error you
control always wins over the component's own fallback.

## 10. OAuth

```tsx
oauthProviders={["google", "github"]}
oauthIcons={{ google: <GoogleIcon /> }}
onOAuthClick={({ provider }) => startOAuth(provider)}
```

Buttons render above the email field with a divider. **The component performs no handshake** — no
redirect, no SDK call, no popup. `onOAuthClick` fires and your code owns everything after it. An
empty or omitted array renders no OAuth row and no divider.

Icons default to text-only, so buttons are legible without you shipping brand assets.

## 11. Accessibility

- `headingAs` (`h1`/`h2`/`h3`, default `h2`) keeps the form's heading level correct for the page.
- Server errors render in a `role="alert"` banner above the form, so they are announced.
- Consent accepts a `ReactNode` label so the Terms link is a real inline link inside the label —
  not a separate control the checkbox fails to describe.

## 12. Gotchas

1. **`status` is all-or-nothing** — §9. The most common integration bug with this component.
2. **`passwordPolicy` is silently ignored under `magic-link`** — §8.
3. **Step-1 submit label is forced to "Continue"** in two-step flows — §5.
4. **`fields` is a fixed key set**, not a form builder — §7.
5. **OAuth does nothing on its own** — §10.
6. **`consent` is required** even when `required: false`; you must still supply the label object.
7. **`successMessage` renders on `onSubmit` resolving without throwing.** If your handler swallows
   its own errors and resolves, the user sees success after a failure — let it reject.

## 13. Public exports

`SignupForm` · helpers `defaultSignupLabels`, `mergeSignupLabels`, `defaultStrengthCalculator`,
`OAUTH_PROVIDERS` · types `SignupFormProps`, `SignupFormStatus`, `SignupSubmitPayload`,
`SignupStep1Values`, `SignupStep2Values`, `SignupLabels`, `OAuthProvider`, `OptionalFieldName`,
`OptionalFieldConfig`, `StrengthCalculator`, `ButtonVariant`.
