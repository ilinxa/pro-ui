/**
 * `task-choice-control-01` — public type surface.
 *
 * Framework-free (no `"use client"`). Per system D-03 the domain slice is
 * **re-declared locally** — this component imports nothing from another registry
 * component (the `gamification-system` §4 model is the source of truth these are
 * copied from, byte-faithful, not imported). The autonomy affordance is generic
 * *over the host's task* only in that it consumes a slice, never a full task —
 * no `<T>` generic (that re-arms the generic-over-host-task drift risk).
 */

/** The choice slice for ONE task (system §4). Controlled (D-06). */
export interface TaskChoiceState {
  taskId: string;
  /** Open for anyone on the team to pick up. */
  openForAnyone: boolean;
  /** Assigned member id; `undefined` → unassigned. */
  assigneeId?: string;
}

/** A team member — identity only (avatar resolution + the reassign picker). */
export type TeamMember = {
  id: string;
  displayName: string;
  avatarUrl?: string;
};

/** The deterministic resolved render state (see `lib/state.ts`). */
export type TaskChoiceRenderState = "open" | "claimed" | "unassigned";

/**
 * Internal interaction discriminant → feeds `onEvent`. Kept internal (not a
 * public callback arg); the public telemetry event is intentionally coarse.
 */
export type TaskChoiceInteraction =
  | { kind: "open-toggled"; open: boolean }
  | { kind: "claimed"; memberId: string }
  | { kind: "reassigned"; memberId?: string }; // undefined = released

/** The public telemetry event (system §6 / D-07 — exact union member). */
export type TaskChoiceEvent = {
  type: "task-choice.interaction";
  teamId: string;
  taskId: string;
};

/** Layout density — fits a kanban card vs a rich-card row. */
export type TaskChoiceDensity = "compact" | "comfortable";

/** Per-state copy overrides (D8 — one button, overridable). */
export interface TaskChoiceLabels {
  claim?: string; // default "I'll take this"
  openForAnyone?: string; // default "Open for anyone"
  release?: string; // default "Release"
  reassign?: string; // default "Reassign…"
}

/** Props for the assembly `TaskChoiceControl01`. */
export interface TaskChoiceControlProps {
  /**
   * Identity + telemetry scope (D-15: a scalar `teamId`, NOT a team object —
   * this component renders NO team-identity text).
   */
  teamId: string;
  /** This team's members — avatar resolution + the reassign picker (D-08). */
  members: TeamMember[];
  /** The choice slice for ONE task. Controlled (D-06). */
  value: TaskChoiceState;
  /** The viewer — default subject of "I'll take this". */
  currentMemberId?: string;

  // Change callbacks — each optional → omit ⇒ that affordance hides.
  onOpenForAnyoneChange?: (open: boolean) => void;
  /** Volunteer / claim. `memberId` defaults to `currentMemberId` upstream. */
  onClaim?: (memberId: string) => void;
  /** Reassign; pass `undefined` to RELEASE (folded in — no separate onRelease, D10). Never penalizes the prior assignee. */
  onAssigneeChange?: (memberId: string | undefined) => void;

  /** Telemetry (D-07) — `{ type:"task-choice.interaction"; teamId; taskId }` on meaningful interactions only. */
  onEvent?: (event: TaskChoiceEvent) => void;

  /** Display-only: shows state, hides ALL actions. Default `false` — choice is the default. */
  readOnly?: boolean;
  /** Density. Default `"comfortable"`. */
  density?: TaskChoiceDensity;
  /** Per-state label overrides. */
  labels?: TaskChoiceLabels;

  className?: string;
  "aria-label"?: string;
}

/** Props for the à-la-carte `OpenForAnyoneToggle` sub-part. */
export interface OpenForAnyoneToggleProps {
  open: boolean;
  onOpenChange?: (open: boolean) => void;
  label?: string;
  readOnly?: boolean;
  density?: TaskChoiceDensity;
  className?: string;
}

/** Props for the à-la-carte `ClaimButton` sub-part. */
export interface ClaimButtonProps {
  /** The member who would claim; defaults to `currentMemberId` at the assembly. */
  memberId?: string;
  onClaim?: (memberId: string) => void;
  label?: string;
  readOnly?: boolean;
  density?: TaskChoiceDensity;
  className?: string;
}

/** Props for the à-la-carte `AssigneeChip` sub-part. */
export interface AssigneeChipProps {
  value: TaskChoiceState;
  members: TeamMember[];
  onAssigneeChange?: (memberId: string | undefined) => void;
  readOnly?: boolean;
  density?: TaskChoiceDensity;
  releaseLabel?: string;
  reassignLabel?: string;
  className?: string;
}
