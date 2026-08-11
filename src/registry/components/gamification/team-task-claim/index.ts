// Assembly — the logic-free fan-out (single-unit; no Root/context).
export { TeamTaskClaim } from "./team-task-claim";

// Flat à-la-carte sub-parts (each mountable alone).
export { OpenForAnyoneToggle } from "./parts/open-for-anyone-toggle";
export { ClaimButton } from "./parts/claim-button";
export { AssigneeChip } from "./parts/assignee-chip";

// Pure helpers (a hand-assembly resolves identically).
export { resolveTaskClaimState } from "./lib/state";
export { resolveMember, initialsFor } from "./lib/members";

// Public types.
export type {
  TaskClaimState,
  TeamMember,
  TaskClaimRenderState,
  TaskClaimInteraction,
  TaskClaimEvent,
  TaskClaimDensity,
  TaskClaimLabels,
  TeamTaskClaimProps,
  OpenForAnyoneToggleProps,
  ClaimButtonProps,
  AssigneeChipProps,
} from "./types";
