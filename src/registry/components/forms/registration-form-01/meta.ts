import type { ComponentMeta } from "../../../types";

export const meta: ComponentMeta = {
  slug: "registration-form-01",
  name: "Registration Form 01",
  category: "forms",

  description:
    "Email + password registration form with optional second-step profile fields, ToS-consent gate, OAuth row above, password-strength meter, magic-link variant, and an off-screen honeypot. Hand-rolled on RHF v7 + zod v4 — does not depend on @ilinxa/json-form. Discriminated submit payload (`{ stepCompleted, values, isHoneypotTripped }`) forces consumers to switch on the flow-completion discriminant so naïve destructuring never silently sends `undefined` profile fields to backend APIs.",
  context:
    "Sibling of `pricing-table-01` in the CMS conversion-block batch (2 of 2). Newsletter + share are already covered by `newsletter-card-01` and `share-bar-01`. Coexists with `properties-form` (entity-edit; different intent) and `json-form` (schema-driven generic; wrong shape for the specific UX of a registration surface — password meter, OAuth split, multi-step flow, honeypot anti-spam, mutual-exclusion-controlled success screen). The hand-roll on RHF v7 + zod v4 keeps the bundle small (~1,400 LOC; 4 shadcn primitives, no internal pro-ui deps). Two flow variants (`single-step` / `two-step`) × two password strategies (`password` / `magic-link`) × two densities (`compact` / `default`) × optional OAuth row × declarative optional-fields bag × pluggable strength calculator (`strengthCalculator?: (password) => 0|1|2|3|4` — the v0.1 seam for the v0.2 zxcvbn opt-in). Controlled-status escape hatch mirrors newsletter-card-01's pattern with explicit mutual-exclusion: if `status` is passed, internal state becomes read-only. Honeypot field renders off-screen (`position: absolute; left: -9999px` — `display: none` is bot-detectable, so the off-screen pattern is load-bearing) and exposes `isHoneypotTripped: boolean` on the payload for the consumer to flag spam upstream. Object-shape callbacks throughout (F-cross-12).",
  features: [
    "Two flow variants: `single-step` (one screen) and `two-step` (email/password/consent → optional profile fields with progress indicator + Skip-for-now button)",
    "Two password strategies: `password` (full validators + strength meter) and `magic-link` (email-only — drops password input entirely)",
    "Declarative optional fields — `fields?: { firstName, lastName, displayName, phone, company }`, each `boolean | { required: boolean }`",
    "Pluggable password-strength calculator (`strengthCalculator?: (password) => 0 | 1 | 2 | 3 | 4`) — built-in length+char-class heuristic; v0.2 zxcvbn opt-in lands against the same seam without a breaking change",
    "Discriminated submit-payload envelope (`stepCompleted: 'single' | 'step1' | 'step2'`) — forces consumers to switch on the completion discriminant; prevents naïve destructuring from sending `undefined` profile fields to backend APIs",
    "ToS-consent gate with ReactNode `label` for inline `<Link>` composition + `string + href?` convenience overload",
    "OAuth row above the email field (mobile stacked, desktop flex) — text-only buttons by default + `oauthIcons?: Partial<Record<OAuthProvider, ReactNode>>` slot for consumer branded SVGs (Google/Apple/Microsoft licensing untouched)",
    "Off-screen honeypot anti-spam (`position: absolute; left: -9999px`, NOT `display: none` which is bot-detectable) — `isHoneypotTripped: boolean` flag on the payload",
    "Internal `idle | submitting | success | error` state machine with controlled `status` / `onStatusChange` escape hatch + explicit mutual-exclusion contract (controlled mode is read-only for internal state)",
    "i18n labels bag covering every visible string (field labels, error messages, button text, strength-meter levels, divider text, success copy, step indicator template, password-toggle aria labels)",
    "150ms CSS-only step transition; `prefers-reduced-motion: reduce` collapses to 0ms hard-swap (no Framer Motion peer)",
    "ARIA wiring — `aria-describedby` for inline errors, `role='alert'` only when populated, `role='status' aria-live='polite'` on step indicator + success screen, `role='separator'` on OAuth divider, `aria-busy` + `disabled` on submit during `submitting`",
    "Object-shape callbacks throughout (F-cross-12)",
    "Hand-rolled on react-hook-form v7 + @hookform/resolvers/zod + zod v4 — no @ilinxa/json-form dep",
  ],
  tags: [
    "registration-form-01",
    "form",
    "registration",
    "auth",
    "oauth",
    "magic-link",
    "rhf",
    "zod",
    "honeypot",
    "two-step",
  ],

  version: "0.1.0",
  status: "alpha",
  createdAt: "2026-05-22",
  updatedAt: "2026-05-22",

  author: { name: "ilinxa" },

  // Deps grow incrementally per the commit chain (validate:meta-deps
  // lint enforces no phantom entries). C2 added rhf + resolvers + zod
  // as lib/hooks landed. C3 will add input + label + button + checkbox
  // when parts import them. C4 will add lucide-react when icons land.
  dependencies: {
    shadcn: [],
    npm: {
      "react-hook-form": "^7.75.0",
      "@hookform/resolvers": "^5.2.2",
      zod: "^4.4.3",
    },
    internal: [],
  },

  related: ["pricing-table-01", "newsletter-card-01", "share-bar-01", "properties-form", "json-form"],
};
