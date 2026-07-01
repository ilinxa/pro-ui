import type { TaskChoiceState, TeamMember } from "./types";

/**
 * Fixtures for `task-choice-control-01` — one team's `members` + `TaskChoiceState`
 * examples exercising every state: open · claimed · unassigned · the legal
 * assigned-and-open edge · a stale `assigneeId` (not in `members`) · a member
 * with no `avatarUrl` (initials path). Team-scoped, no per-member ranking.
 */

export const TASK_TEAM: TeamMember[] = [
  { id: "u-mina", displayName: "Mina Devi" },
  { id: "u-theo", displayName: "Theo Fischer" },
  { id: "u-ama", displayName: "Ama Boateng" },
  { id: "u-ravi", displayName: "Ravi Kapoor" },
  { id: "u-sol", displayName: "Sol Reyes" },
];

export const CURRENT_MEMBER_ID = "u-mina";

/** Open for anyone → invite + "I'll take this". */
export const CHOICE_OPEN: TaskChoiceState = {
  taskId: "T-open",
  openForAnyone: true,
  assigneeId: undefined,
};

/** Claimed → assignee chip + neutral release + reassign. */
export const CHOICE_CLAIMED: TaskChoiceState = {
  taskId: "T-claimed",
  openForAnyone: false,
  assigneeId: "u-theo",
};

/** Unassigned, not open → volunteer + open-for-anyone side by side. */
export const CHOICE_UNASSIGNED: TaskChoiceState = {
  taskId: "T-unassigned",
  openForAnyone: false,
  assigneeId: undefined,
};

/** Legal edge: assigned AND open (resolves to "claimed"; the flag stays toggleable). */
export const CHOICE_ASSIGNED_AND_OPEN: TaskChoiceState = {
  taskId: "T-edge",
  openForAnyone: true,
  assigneeId: "u-ama",
};

/** Stale assigneeId (not in TASK_TEAM) → id-initials fallback, no crash. */
export const CHOICE_STALE_ASSIGNEE: TaskChoiceState = {
  taskId: "T-stale",
  openForAnyone: false,
  assigneeId: "u-ghost",
};
