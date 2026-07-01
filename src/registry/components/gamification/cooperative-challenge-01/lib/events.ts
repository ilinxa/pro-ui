import type { Challenge, GamificationEvent, Team } from "../types";

/**
 * The single place the two event shapes are constructed — standalone pure
 * factories (kit-extraction candidates, system §7.3), so the union stays
 * single-sourced from `types.ts` and the shapes are testable. The host adds the
 * envelope (timestamp, anonymized IDs, app variant) at its transport layer.
 */

/** `challenge.opened` — first reveal/mount of the card (D-C5). */
export function openedEvent(team: Team, challenge: Challenge): GamificationEvent {
  return {
    type: "challenge.opened",
    teamId: team.id,
    challengeId: challenge.id,
  };
}

/** `challenge.opt-in` — the team toggled opt-in; carries the new value. */
export function optInEvent(
  team: Team,
  challenge: Challenge,
  optedIn: boolean,
): GamificationEvent {
  return {
    type: "challenge.opt-in",
    teamId: team.id,
    challengeId: challenge.id,
    optedIn,
  };
}
