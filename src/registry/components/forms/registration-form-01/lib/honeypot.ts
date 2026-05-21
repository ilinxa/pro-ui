import type { CSSProperties } from "react";

/**
 * The rendered HTML `name` attribute on the honeypot input. Tuned to the
 * spam-bait names most form-fill bots target (`url`, `website`,
 * `homepage`); `website` has the broadest hit-rate. **This is NOT the
 * RHF register key** — see `HONEYPOT_RHF_KEY` below.
 */
export const HONEYPOT_HTML_NAME = "website";

/**
 * The RHF register key + values-bag key. The `_` prefix keeps it out of
 * the natural reading order of `payload.values` (consumers see
 * `payload.values._honeypot` and immediately read it as a meta field
 * rather than mistaking it for a real `website` field).
 */
export const HONEYPOT_RHF_KEY = "_honeypot";

/**
 * Off-screen rendering style. **Critical: `display: none` is
 * bot-detectable — bots skip non-visible fields.** The off-screen
 * absolute-position pattern keeps the field rendered (and fillable by
 * a naïve form-fill bot) while invisible to real users.
 *
 * The 1×1 pixel sizing + `overflow: hidden` prevents any focus-ring
 * leakage if the field somehow receives focus. `tabIndex={-1}` (set on
 * the input element, not here) keeps it off keyboard tab order;
 * `aria-hidden="true"` keeps it off the AT tree.
 */
export const HONEYPOT_STYLE: CSSProperties = {
  position: "absolute",
  left: "-9999px",
  top: "auto",
  width: "1px",
  height: "1px",
  overflow: "hidden",
};

/**
 * A real user cannot tab into the honeypot field (tabIndex={-1}) and
 * cannot see it (off-screen), so any non-empty value means a spam bot
 * filled it. The submit handler surfaces this on the payload via
 * `isHoneypotTripped: boolean`.
 */
export function isHoneypotTripped(value: string): boolean {
  return value.length > 0;
}
