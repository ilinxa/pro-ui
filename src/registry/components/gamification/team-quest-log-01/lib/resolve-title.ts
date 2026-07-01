import type { Team } from "../types";

/**
 * Resolve the displayed quest title (the never-forced core, system §5.2 / D-A1).
 * A blank or whitespace-only `questName` is treated as "no quest name" → falls
 * back to the literal team name. Pure, framework-free, SSR-safe, test-ready.
 */
export function resolveQuestTitle(team: Pick<Team, "name" | "questName">): {
  title: string;
  isDefault: boolean;
} {
  const custom = team.questName?.trim();
  return custom
    ? { title: custom, isDefault: false }
    : { title: team.name, isDefault: true };
}
