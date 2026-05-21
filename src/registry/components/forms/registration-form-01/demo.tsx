"use client";

import { RegistrationForm01 } from "./registration-form-01";
import { defaultRegistrationProps } from "./dummy-data";

/**
 * C1 placeholder demo — full six-tab demo (single-step / OAuth / two-step /
 * magic-link / dense / controlled) lands in C6.
 */
export default function RegistrationForm01Demo() {
  return <RegistrationForm01 {...defaultRegistrationProps} />;
}
