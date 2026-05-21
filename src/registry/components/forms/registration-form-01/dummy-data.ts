import type { RegistrationForm01Props } from "./types";

/**
 * C1 placeholder fixtures — full six-fixture bundle lands in C6.
 *
 * The shape and naming convention will then be:
 *   - defaultRegistrationProps      — single-step, email/password, consent only
 *   - oauthRegistrationProps        — single-step + Google + GitHub + oauthIcons example
 *   - twoStepRegistrationProps      — two-step + firstName/lastName optional + skippable
 *   - magicLinkRegistrationProps    — magic-link strategy + email-only + OAuth
 *   - denseRegistrationProps        — density="compact" + minimal fields
 *   - controlledRegistrationProps   — status + onStatusChange (mutual-exclusion demo)
 */
export const defaultRegistrationProps: RegistrationForm01Props = {
  heading: "Create your account",
  subheading: "C1 scaffold placeholder — replaced in C6.",
  consent: {
    required: true,
    label: "I agree to the Terms and Privacy Policy",
    href: "#",
  },
  onSubmit: () => {
    /* C6 demo wires this to a `setLast(payload)` state setter */
  },
};
