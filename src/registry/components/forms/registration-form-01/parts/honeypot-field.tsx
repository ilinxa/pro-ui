"use client";

import { useFormContext } from "react-hook-form";
import {
  HONEYPOT_HTML_NAME,
  HONEYPOT_RHF_KEY,
  HONEYPOT_STYLE,
} from "../lib/honeypot";
import type { RegistrationLabels, RegistrationStep2Values } from "../types";

export interface HoneypotFieldProps {
  labels: Pick<RegistrationLabels, "honeypotLabel">;
}

/**
 * Off-screen anti-spam honeypot. **Two non-obvious facts** worth keeping
 * in mind during refactors:
 *
 * 1. The `style` prop uses absolute off-screen position rather than
 *    `display: none`. `display: none` is bot-detectable; serious form-fill
 *    bots skip non-visible fields. The off-screen pattern keeps the field
 *    *rendered* (and fillable by naïve bots) while invisible to real users.
 *
 * 2. **Attribute order matters.** `{...register(HONEYPOT_RHF_KEY)}`
 *    returns `{ name: "_honeypot", onChange, onBlur, ref }`. The
 *    `name={HONEYPOT_HTML_NAME}` override MUST come AFTER the spread,
 *    otherwise React drops the override and the rendered HTML reads
 *    `name="_honeypot"` — defeating the spam-bait. The two-key duality
 *    (HTML name "website" vs RHF key "_honeypot") is intentional:
 *    consumers see `payload.values._honeypot` cleanly without a confusing
 *    `payload.values.website` shape.
 *
 * `aria-hidden="true"` + `tabIndex={-1}` keep the input out of the AT
 * tree and the keyboard tab order.
 */
export function HoneypotField({ labels }: HoneypotFieldProps) {
  const { register } = useFormContext<RegistrationStep2Values>();
  return (
    <input
      type="text"
      autoComplete="off"
      tabIndex={-1}
      aria-hidden="true"
      aria-label={labels.honeypotLabel}
      style={HONEYPOT_STYLE}
      {...register(HONEYPOT_RHF_KEY as never)}
      name={HONEYPOT_HTML_NAME}
    />
  );
}
