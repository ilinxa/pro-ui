---
date: 2026-05-22
type: ship
commits: [pending C11]
components: [registration-form-01]
findings: [F-01-magic-link-password-slot, F-02-step1-trigger-strategy-aware, F-03-demo-oauth-icons-generic, F-04-path-b-smoke-deferred, F-05-honeypot-memo]
status: shipped
---

# registration-form-01 v0.1.0 — first ship (46th component)

## Summary

User requested the queued `registration-form-01` procomp (sibling of in-flight `pricing-table-01` in the CMS conversion-block batch). Built greenfield per the user's pasted spec — GATE 1 description + GATE 2 plan both authored, signed off with seven open-question resolutions and seven consistency-audit fixes, then implemented in an 11-commit chain ahead of the 46th-component ship.

**Final shape:** schema-driven sign-up surface, hand-rolled on RHF v7 + zod v4 (does NOT depend on `@ilinxa/json-form` — Q1 lock). Two flow variants × two password strategies × two densities × optional OAuth row + declarative optional-fields bag + off-screen honeypot. ~1,400 LOC across 25 shipped files + dummy-data; 6 fixtures × 6 demo tabs.

## What's load-bearing

Three contracts shape the public API:

1. **Discriminated submit payload.** `onSubmit` receives one of three envelope shapes (`stepCompleted: "single" | "step1" | "step2"`). Consumers MUST `switch` on the discriminant — narrowing optional profile fields as `string | undefined` was rejected because it silently lets naïve destructuring send `undefined` values to backend APIs. The envelope forces the discriminant.

2. **Mutual-exclusion status contract.** Controlled `status` + `onStatusChange` escape hatch: if `status` is provided, internal state becomes read-only (component reads `status` as source of truth, fires `onStatusChange` for observers only). Mixing the two — passing `status` AND expecting internal `success` transition on resolve — is documented as a contract violation in usage.tsx.

3. **Honeypot two-key duality.** HTML `name="website"` (spam-bait) + RHF register key `_honeypot` (clean values shape). Off-screen rendering (`position: absolute; left: -9999px`), NOT `display: none` — the latter is bot-detectable. Attribute order matters in the JSX: `{...register("_honeypot")}` returns `{ name: "_honeypot", ... }`, so the `name={HONEYPOT_HTML_NAME}` override MUST come AFTER the register spread; otherwise React drops the override and the rendered HTML reads `name="_honeypot"`, defeating the trap. Docstring inside `parts/honeypot-field.tsx` spells this out so a future refactorer doesn't break it.

## Plan refinements (Q1–Q7) — user-confirmed at GATE 1

| Q | Resolution | Refinement |
|---|---|---|
| Q1 | Hand-roll on RHF + Zod | "Registration is one form per app; pulling json-form's substrate + 12 shadcn deps is overkill. Not translatable in the CMS-content sense — no per-locale fallback chain." |
| Q2 | OAuth icons text-only + `oauthIcons` slot | Fixtures bundle ships a lucide-react example wiring so consumers see the slot shape on first read. |
| Q3 | Honeypot name `website` | Docstring + render explicitly call out off-screen pattern: `position: absolute; left: -9999px; top: auto; width: 1px; height: 1px; overflow: hidden` + `tabIndex={-1}` + `aria-hidden` + `autoComplete="off"`. **`display: none` is bot-detectable.** |
| Q4 | `skippableStepTwo` + "Skip for now" submits step-1 values | `onSubmit` payload is a **discriminated envelope** `{ stepCompleted, values, isHoneypotTripped }` — not optional-field narrowing. |
| Q5 | Internal status default + controlled escape hatch | Mutual exclusion documented explicitly. |
| Q6 | Built-in length + char-class-count heuristic | `strengthCalculator?: (password) => 0 \| 1 \| 2 \| 3 \| 4` v0.1 seam for v0.2 zxcvbn opt-in. |
| Q7 | 150ms CSS opacity fade | `prefers-reduced-motion: reduce` collapses to 0ms. |

## Consistency-audit refinements (7 caught + fixed pre-scaffold)

| F | Severity | Issue | Fix |
|---|---|---|---|
| F-01 | High | description.md:26 referenced a `mode?: "internal" \| "external"` prop in "open questions" — never made it to the API | Replaced with reference to the resolved Q5 |
| F-03 | Low | description.md:43 used loose `Record<string, ReactNode>` for oauthIcons; actual type is `Partial<Record<OAuthProvider, ReactNode>>` | Tightened |
| F-04 | Medium | plan §20 conflated HTML `name` and RHF register key | Split into `HONEYPOT_HTML_NAME` + `HONEYPOT_RHF_KEY` + `isHoneypotTripped()` |
| F-08 | Medium | plan §16 hook returned opaque `transitions` | Replaced with explicit `{ form, status, step, goNext, goBack, submit, skip }` |
| F-11 | Medium | plan §5 ↔ §17 disagreed on `useStrengthMeter` signature | Locked as `useStrengthMeter({ calculator?, labels })` reading password via `useWatch` internally |
| F-16 | **Blocker** | plan §8 honeypot rendered `name="website"` BEFORE `{...register("_honeypot")}` — RHF's spread clobbers the name attribute and defeats the spam ruse | Reordered: spread `register()` first, override `name` after; explicit docstring note |
| F-18 | Low | `mergeLabels` (§15) vs `mergeRegistrationLabels` (§29) naming drift | Locked as `mergeRegistrationLabels` everywhere |
| F-21 | Low | description type sketch used `RegistrationFormProps`; plan uses `RegistrationForm01Props` | Aligned |

## Commit chain

| # | Subject | LOC |
|---|---|---|
| C1 | scaffold + types + meta + manifest | ~340 |
| C2 | lib + hooks substrate | ~530 |
| C3 | input parts (5) | ~350 |
| C4 | shell + state parts (10) | ~470 |
| C5 | root orchestrator + final index.ts | ~245 |
| C6 | demo, usage, 6-fixture bundle | ~740 |
| C7 | registry.json (base + fixtures) | ~310 |
| C8 | full verification (no file changes — tsc + lint + meta-deps + whitelist + registry:build + CDP page-load + 6-tab walk all clean) | — |
| C9 | path-b smoke — deferred to post-push (same pattern as todo-tree / todo-rich-card / json-form first ships) | — |
| C10 | GATE 3 spotcheck — Pass with follow-ups | — |
| C11 | STATUS.md + decision file + component-versions.md + push (this commit) | — |

## GATE 3 spotcheck verdict

**Pass with follow-ups** ([reviews/2026-05-22-v0.1.0-spotcheck.md](../../docs/procomps/registration-form-01-procomp/reviews/2026-05-22-v0.1.0-spotcheck.md))

Rotating dimension: Public API (envelope + mutual-exclusion + strength-calc seam + honeypot two-key duality). 5 findings, all **non-blocking**:

- F-01 🔹 Low — `magic-link` keeps `password` ZodTypeAny slot for shape stability (introspection edge; v0.2 candidate if needed)
- F-02 🔹 Low — `step1Fields` trigger list hardcodes `["email", "password", "consentAccepted"]` (works under all v0.1.0 combos; v0.2 candidate if two-step + magic-link lands)
- F-03 🔹 Low — demo OAuth icons use lucide-react generics (Mail / GitBranch) instead of brand SVGs — documented; consumers swap
- **F-04 🔸 Medium — path-b consumer-tsc smoke deferred to post-deploy** (established pattern; F-cross-13 carriers pre-empted via defensive callback contravariance in the consent checkbox)
- F-05 🔹 Low — honeypot field re-renders on every form-state update via `useFormContext` (v0.2 perf-bundle candidate)

## Verification

- `pnpm tsc --noEmit` → 0
- `pnpm validate:meta-deps` → 47/47 clean
- `pnpm validate:default-registry-whitelist` → 25/25 clean
- `pnpm lint` → clean for this slug (5 pre-existing unrelated files carry warnings)
- `pnpm registry:build` → clean (regenerates `public/r/registration-form-01.json` + `public/r/registration-form-01-fixtures.json`)
- CDP page-load via `e:/tmp/rf01-repro.mjs` → `/components/registration-form-01` renders with `v0.1.0` version label + meta description; all 6 demo tabs click through cleanly; **zero console warnings, zero page errors**

## Files

```
docs/procomps/registration-form-01-procomp/
├── registration-form-01-procomp-description.md           (GATE 1)
├── registration-form-01-procomp-plan.md                  (GATE 2)
└── reviews/
    └── 2026-05-22-v0.1.0-spotcheck.md                    (GATE 3)

src/registry/components/forms/registration-form-01/
├── registration-form-01.tsx                              (root orchestrator)
├── registration-form-01.css                              (step-fade keyframe)
├── index.ts                                              (barrel)
├── types.ts                                              (public types)
├── meta.ts                                               (catalog metadata)
├── dummy-data.ts                                         (6 fixtures)
├── demo.tsx                                              (6-tab demo)
├── usage.tsx                                             (consumer guide)
├── parts/
│   ├── email-field.tsx
│   ├── password-field.tsx
│   ├── consent-checkbox.tsx
│   ├── honeypot-field.tsx
│   ├── optional-fields-fieldset.tsx
│   ├── step-indicator.tsx
│   ├── step-shell.tsx
│   ├── server-error.tsx
│   ├── success-screen.tsx
│   ├── submit-row.tsx
│   ├── sign-in-link.tsx
│   ├── oauth-row.tsx
│   ├── strength-meter.tsx
│   └── labels.ts
├── hooks/
│   ├── use-registration-form.ts
│   ├── use-strength-meter.ts
│   └── use-form-step.ts
└── lib/
    ├── build-schema.ts
    ├── honeypot.ts
    ├── oauth-providers.ts
    └── strength-calculator.ts

registry.json                                              (base + fixtures items added)
public/r/registration-form-01.json                         (generated)
public/r/registration-form-01-fixtures.json                (generated)
public/r/registry.json                                     (catalog index updated)
src/registry/manifest.ts                                   (3-line entry slotted after json-form)
```

**46 components total** across 8 categories after this ship.

## Post-deploy

Run `node e:/tmp/ilinxa-smoke-consumer/run-smoke.mjs registration-form-01` once Vercel completes the deploy. If any F-cross-13 hit surfaces, patch v0.1.1 same-day per the established pattern (todo-tree v0.1.0 → v0.1.1 / todo-rich-card v0.1.0 → v0.1.1 precedents).
