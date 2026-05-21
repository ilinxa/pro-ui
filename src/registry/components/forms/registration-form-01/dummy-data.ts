import type { ReactNode } from "react";
import type { RegistrationForm01Props } from "./types";

/**
 * Six fixture shapes covering the canonical registration surfaces.
 * Used by `demo.tsx` to render six tabs and by `registry-form-01-fixtures`
 * to ship copy-paste-ready prop bundles to consumers.
 *
 * `onSubmit` is intentionally left as a no-op here — the demo wraps each
 * fixture with a local `setLast(payload)` handler so consumers can see
 * the discriminated envelope shape live.
 */

const NOOP_ON_SUBMIT: RegistrationForm01Props["onSubmit"] = () => {
  /* demo wires a real handler at usage site */
};

const TERMS_LABEL: ReactNode = "I agree to the Terms and Privacy Policy";

// 1. Default — single-step, email + password + consent only.
export const defaultRegistrationProps: RegistrationForm01Props = {
  heading: "Create your account",
  subheading: "Start free, upgrade when you grow.",
  flow: "single-step",
  passwordStrategy: "password",
  consent: {
    required: true,
    label: TERMS_LABEL,
    href: "#",
  },
  signInHref: "#",
  onSubmit: NOOP_ON_SUBMIT,
};

// 2. OAuth row above + the oauthIcons slot wired (lucide-react example).
//    Demo populates the icons; this fixture leaves the slot empty so
//    consumers see the text-only fallback in the dummy-data shape.
export const oauthRegistrationProps: RegistrationForm01Props = {
  heading: "Create your account",
  subheading: "Continue with your provider — or use email and password.",
  flow: "single-step",
  passwordStrategy: "password",
  oauthProviders: ["google", "github"],
  // oauthIcons populated at the demo site (so this fixture stays
  // ReactNode-free for the registry-fixtures consumer).
  consent: {
    required: true,
    label: TERMS_LABEL,
    href: "#",
  },
  signInHref: "#",
  onSubmit: NOOP_ON_SUBMIT,
};

// 3. Two-step — email/password/consent → optional profile fields.
//    skippableStepTwo defaults to true.
export const twoStepRegistrationProps: RegistrationForm01Props = {
  heading: "Create your account",
  subheading: "Two-step flow — basics first, profile next.",
  flow: "two-step",
  passwordStrategy: "password",
  fields: {
    firstName: { required: true },
    lastName: true,
    company: true,
  },
  passwordPolicy: {
    minLength: 10,
    requireUppercase: true,
    requireNumber: true,
  },
  consent: {
    required: true,
    label: TERMS_LABEL,
    href: "#",
  },
  signInHref: "#",
  onSubmit: NOOP_ON_SUBMIT,
};

// 4. Magic-link — email-only + OAuth.
export const magicLinkRegistrationProps: RegistrationForm01Props = {
  heading: "Sign up with a magic link",
  subheading: "We'll email you a one-time link — no password.",
  flow: "single-step",
  passwordStrategy: "magic-link",
  oauthProviders: ["google", "apple"],
  consent: {
    required: true,
    label: TERMS_LABEL,
    href: "#",
  },
  submitButton: { label: "Send me a link", variant: "default" },
  signInHref: "#",
  onSubmit: NOOP_ON_SUBMIT,
};

// 5. Dense — compact density for sidebars / modals.
export const denseRegistrationProps: RegistrationForm01Props = {
  heading: "Quick sign-up",
  flow: "single-step",
  passwordStrategy: "password",
  density: "compact",
  consent: {
    required: true,
    label: TERMS_LABEL,
    href: "#",
  },
  onSubmit: NOOP_ON_SUBMIT,
};

// 6. Controlled status — demo of the mutual-exclusion contract.
//    The demo site keeps `status` in local state, mutates it on consumer
//    actions, and never expects internal transitions.
export const controlledRegistrationProps: RegistrationForm01Props = {
  heading: "Create your account",
  subheading:
    "Controlled status: the parent component owns the submission lifecycle.",
  flow: "single-step",
  passwordStrategy: "password",
  consent: {
    required: true,
    label: TERMS_LABEL,
    href: "#",
  },
  // status + onStatusChange wired at the demo site
  onSubmit: NOOP_ON_SUBMIT,
};
