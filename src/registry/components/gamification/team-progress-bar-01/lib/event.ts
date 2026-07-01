import type { GamificationEvent } from "../types";

/**
 * The single place the `progress-bar.checked` event shape is constructed.
 * Kept as a standalone pure factory (kit-extraction candidate, system §7.3) —
 * the component emits only this semantic event; the host adds the envelope
 * (timestamp, anonymized IDs, app variant) at its transport layer.
 */
export function progressBarCheckedEvent(teamId: string): GamificationEvent {
  return { type: "progress-bar.checked", teamId };
}
