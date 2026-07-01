import type { ComponentMeta } from "../../../types";

export const meta: ComponentMeta = {
  slug: "task-choice-control-01",
  name: "Task Choice Control",
  category: "gamification",

  description:
    "A small, droppable autonomy affordance for one team task: an 'open for anyone' toggle, an 'I'll take this' volunteer/claim action, and an assignee chip with a neutral release + reassign picker. Choice is always available, never forced; releasing or reassigning never penalizes the previous assignee.",
  context:
    "The Autonomy surface of the gamification pack (E4). Renders three states — open / claimed / unassigned (plus the legal assigned-and-open edge) — deterministically from a controlled TaskChoiceState slice + this team's members. A member can open a task for anyone or volunteer for it by their own choice; the release/reassign path is a neutral, no-penalty transition (never destructive/red, never 'Drop'/'Abandon', never a penalty glyph or motion). Ships as a single-unit control (NOT a Root/context compound — nothing cross-cutting to hold, and D-06 forbids requiring a provider): flat à-la-carte sub-parts (OpenForAnyoneToggle, ClaimButton, AssigneeChip) under a logic-free TaskChoiceControl01 assembly, so a host can drop just the toggle or just the chip. The reassign picker is popover + command (searchable, keyboard-navigable, team-scoped). Emits task-choice.interaction via onEvent on meaningful interactions only. Controlled (D-06); capability-gated (omit a callback → that affordance hides); readOnly for display-only. Portable: zero next/*, own types.ts slice, imports no other registry component; SSR-safe. Fifth component of the gamification-system.",
  features: [
    "Three states — open (invite + 'I'll take this') / claimed (chip + neutral Release + Reassign) / unassigned (volunteer + open together)",
    "Never-forced by construction — no mandatory/locked state; choice is the default (readOnly is opt-in)",
    "No-penalty release — folded into onAssigneeChange(undefined); never destructive/red, never a cold verb or penalty motion",
    "Reassign via a searchable, keyboard-navigable, team-scoped popover + command picker",
    "Controlled + capability-gated — value drives render; omit a callback and that affordance hides; no dead buttons",
    "Telemetry — task-choice.interaction on meaningful interactions only (toggle / claim / reassign / release)",
    "Single-unit with flat à-la-carte parts — mount just OpenForAnyoneToggle, ClaimButton, or AssigneeChip; no Root/context",
  ],
  tags: [
    "task-choice-control",
    "gamification",
    "autonomy",
    "assignment",
    "volunteer",
    "team",
    "cooperative",
    "telemetry",
  ],

  version: "0.1.0",
  status: "alpha",
  createdAt: "2026-07-01",
  updatedAt: "2026-07-01",

  author: { name: "ilinxa" },

  dependencies: {
    shadcn: ["switch", "button", "avatar", "popover", "command"],
    npm: {
      "lucide-react": "^1.11.0",
    },
    internal: [],
  },

  related: ["cooperative-challenge-01", "team-quest-log-01", "kanban-board-01"],
};
