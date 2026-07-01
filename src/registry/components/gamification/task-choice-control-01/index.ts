// Assembly — the logic-free fan-out (single-unit; no Root/context).
export { TaskChoiceControl01 } from "./task-choice-control-01";

// Flat à-la-carte sub-parts (each mountable alone).
export { OpenForAnyoneToggle } from "./parts/open-for-anyone-toggle";
export { ClaimButton } from "./parts/claim-button";
export { AssigneeChip } from "./parts/assignee-chip";

// Pure helpers (a hand-assembly resolves identically).
export { resolveTaskChoiceState } from "./lib/state";
export { resolveMember, initialsFor } from "./lib/members";

// Public types.
export type {
  TaskChoiceState,
  TeamMember,
  TaskChoiceRenderState,
  TaskChoiceInteraction,
  TaskChoiceEvent,
  TaskChoiceDensity,
  TaskChoiceLabels,
  TaskChoiceControlProps,
  OpenForAnyoneToggleProps,
  ClaimButtonProps,
  AssigneeChipProps,
} from "./types";
