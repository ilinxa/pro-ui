# task-choice-control-01 — consumer guide

> The **Autonomy** surface of the [`gamification-system`](../../systems/gamification-system/gamification-system-description.md) (E4). A small, droppable control that lets a team member **open a task for anyone** or **volunteer for it** — by their own choice, never told to. Fifth component of the pack.

Install: `pnpm dlx shadcn@latest add @ilinxa/task-choice-control-01` (add `@ilinxa/task-choice-control-01-fixtures` for sample data).

## When to use

- Any team task card (kanban card, rich card, todo row) that wants a first-class "open for anyone / I'll take this" affordance.
- A plain team app that needs assignment + volunteering without any gamification infrastructure.
- A host that needs only one piece — the toggle, the claim button, or the assignee chip (use the flat à-la-carte parts).

## When NOT to use

- **Competitive** assignment mechanics — no "most tasks volunteered" ranking, no per-member leaderboard. Excluded by design.
- Full board layout → `kanban-board-01`. Single-card detail → `todo-rich-card`.
- It is **not** a fork of those cards — it's a droppable control the host wires into any card. It imports none of them (D-03).

## The three states

| State | Reads as | Driven by |
|---|---|---|
| **open** | 🙌 Open for anyone + an "I'll take this" claim | `openForAnyone: true`, no assignee |
| **claimed** | assignee chip + a **neutral** Release + a reassign picker | `assigneeId` set |
| **unassigned** | Volunteer *and* Open-for-anyone offered together | neither |

The legal edge `openForAnyone && assigneeId` resolves to **claimed**, with the open-flag still visible and toggleable.

## Quick start

```tsx
import { TaskChoiceControl01 } from "@/components/task-choice-control-01";

<TaskChoiceControl01
  teamId={team.id}
  members={team.members}          // this team only (avatar resolution + reassign picker)
  value={task.choice}             // { taskId, openForAnyone, assigneeId }
  currentMemberId={viewerId}
  onOpenForAnyoneChange={(open) => update(task.id, { openForAnyone: open })}
  onClaim={(id) => update(task.id, { assigneeId: id, openForAnyone: false })}
  onAssigneeChange={(id) => update(task.id, { assigneeId: id })} // undefined = release
  onEvent={(e) => analytics.track(e.type, e)}
  density="compact"
/>
```

## Never-forced (the load-bearing rule)

- **Choice is always available** — there is no `disabled`/`required`/`mustAssign` prop and no "you must choose" branch. The only non-interactive path is the opt-in `readOnly`.
- **Release/reassign never penalizes the prior assignee** — Release is `onAssigneeChange(undefined)` (folded in; no separate `onRelease`). Its styling is a muted `ghost` action reading "Release" — **never** destructive/red, **never** "Drop"/"Abandon", **never** a penalty glyph or shake. Releasing reads as generosity.
- **"Open for anyone" is a friendly invite** (signal-lime), never a warning.

## Controlled + capability-gating

`value` drives the render; the component holds no source-of-truth state. Each affordance hides when its callback is omitted; `readOnly` is a global off-switch. They compose — **omitting all callbacks produces the same display-only render as `readOnly`**. Prefer `readOnly` to express intent.

```tsx
// Display-only:
<TaskChoiceControl01 teamId={team.id} members={team.members} value={task.choice} readOnly />
```

## À-la-carte parts

Flat exports, no Root/context — mount just what you need:

```tsx
import { OpenForAnyoneToggle, ClaimButton, AssigneeChip } from "@/components/task-choice-control-01";

<OpenForAnyoneToggle open={task.choice.openForAnyone} onOpenChange={setOpen} />
<ClaimButton memberId={viewerId} onClaim={claim} />
<AssigneeChip value={task.choice} members={team.members} onAssigneeChange={reassign} />
```

`resolveTaskChoiceState(value)` and `resolveMember(id, members)` / `initialsFor(...)` are exported so a hand-assembly resolves identically.

## Density

`density="compact"` (kanban) collapses labels to icons and truncates the assignee name (the avatar is the floor — the name never truncates to nothing; full name in a native `title`). `density="comfortable"` (default, rich-card row) is labelled.

## Edge cases

- **Stale `assigneeId`** (not in `members`) → the chip renders from id-initials, no avatar, no crash. The reassign picker still lists the real members.
- **Empty `members`** → the picker shows an empty state; claim still works against `currentMemberId`.

## Telemetry

`onEvent` (optional) emits `{ type: "task-choice.interaction", teamId, taskId }` on **meaningful committed interactions only** — toggle / claim / reassign / release — never on render, hover, or opening the picker. No SDK, no `next/*`.

## Accessibility

- The control is a labelled `role="group"`; the resolved state is announced via a polite `aria-live` region (neutral copy on release — never "X dropped this").
- The toggle is a labelled `role="switch"`; the claim/release are real buttons; the reassign picker is a searchable listbox (full keyboard nav).
- State is never conveyed by color alone (glyph + text throughout).

## Portability

Zero `next/*`, no app context, no other registry import. Own `types.ts` slice (D-03). SSR-safe. Only the shadcn `switch` / `button` / `avatar` / `popover` / `command` primitives + `lucide-react`.
