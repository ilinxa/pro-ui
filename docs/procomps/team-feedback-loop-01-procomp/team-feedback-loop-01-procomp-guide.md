# team-feedback-loop-01 — consumer guide

> Stage 3: how to use it. Companion to the [description](./team-feedback-loop-01-procomp-description.md) (GATE 1) and [plan](./team-feedback-loop-01-procomp-plan.md) (GATE 2). Shipped v0.1.0, 2026-07-01. Third component of the [`gamification-system`](../../systems/gamification-system/gamification-system-description.md).

A **host-triggered, non-blocking feedback layer**: a brief (< 1s), skippable **celebration** overlay when team progress advances, plus a gentle, dismissible **next-task nudge**. It owns no milestone/badge/task state — the host triggers it, it renders the moment and gets out of the way. Every reward is about the **team, never an individual** (D-08).

## When to use

- A **gamified team board** — celebrate a milestone/badge/task-complete, then point the team at the next task.
- A **cooperative checklist / sprint app** — a brief flourish on completion; quietly suggest what's next.
- **Celebration-only** (no task queue) or **nudge-only** (a quiet surface) — each subset stands alone.

## When NOT to use

- **A blocking celebration modal** → the whole point is non-blocking (D-10). There is no modal mode.
- **An individual achievement popup** → team-subject only, forever (D-08).
- **A persistent badge gallery** → that's `team-trophy-shelf-01` (E2).
- **A generic toast/notification system** → this shows *this* moment then clears; it's not a queue.

## The cardinal constraint: non-blocking (D-10)

- The board stays **fully interactive** during a celebration — the overlay is `pointer-events: none`; clicks pass straight through. The **only** clickable element is the skip (✕) button.
- It **never moves or traps focus**, and renders no work-halting scrim.
- `celebrationDurationMs` is **clamped to `[200, 999)`** — a lingering modal is impossible even if you pass `5000`.
- Skip anytime with **✕** or **Esc**.

## Two trigger paths (one reducer)

```tsx
import { TeamFeedbackLoop01, type TeamFeedbackLoopHandle } from "@/components/team-feedback-loop-01"

// Controlled (declarative): set event → open, null → close.
<TeamFeedbackLoop01
  teamId={team.id}
  event={lastEvent}               // { kind: "milestone", title: "Your team…" }
  enableConfetti
  nextTask={nextTask}             // { taskId, label: "Pick up: wire the win screen" }
  onNextTask={(s) => openTask(s.taskId)}
/>

// Imperative (event-driven): fire from a callback.
const ref = useRef<TeamFeedbackLoopHandle>(null)
ref.current?.celebrate({ kind: "task-complete", title: "Your team cleared the column" })
ref.current?.dismiss()
```

Both funnel into one internal reducer — **identical behavior regardless of entry point**. A second event mid-celebration **replaces** the first (newest wins); overlays never stack. Use one path or the other (pass `event` for controlled, omit it entirely for imperative-only).

> **Controlled re-open:** the `event` prop is compared by object identity. To replay a celebration for the *same* logical event after it auto-dismissed, push a **new** object (`{ ...event }`) or use the imperative `celebrate()` — re-supplying the same reference won't re-open.

## Data

```ts
interface FeedbackEvent {
  kind: "milestone" | "badge" | "task-complete"
  title: string          // team-scoped copy ("Your team…"); NEVER an individual
  detail?: string
  narrativeBeat?: string  // optional progression-loop chapter line
}
interface NextTaskSuggestion { taskId: string; label: string }
```

## Props

| Prop | Default | Notes |
|---|---|---|
| `teamId` | — | identity for copy + (if wired) telemetry envelope |
| `event` | — | controlled trigger; `null` closes (silently); omit for imperative-only |
| `celebrationDurationMs` | ~800 | clamped `[200, 999)` |
| `enableConfetti` | `false` | lazy `canvas-confetti` for `milestone`/`badge` only |
| `renderCelebration` | — | body override; the wrapper stays non-blocking |
| `onCelebrationDismiss` | — | `(event, "auto" \| "skip")` — never fires on host-driven `event = null` |
| `nextTask` / `onNextTask` / `onNudgeDismiss` | — | the nudge; dismiss is penalty-free |
| `nudgePlacement` | `"inline"` | `"inline"` or `"corner"` — never modal |
| `showCelebration` / `showNudge` | `true` | assembly toggles |
| `onEvent` | — | accepted for D-07 symmetry; **E6 emits nothing** |

## Confetti + reduced motion

- `enableConfetti` adds a lazy `canvas-confetti` burst for `milestone`/`badge`. The **default CSS flourish** keeps the confetti chunk out of the bundle entirely; it loads only when confetti is enabled AND an eligible event fires (preloaded at open time; skipped gracefully if it isn't ready within the < 1s window).
- Under `prefers-reduced-motion: reduce` the celebration renders **static** — no movement, **no confetti** — still time-boxed and skippable. (A real branch, not a shortened animation.)

## D-16 celebration ownership

If you also use `team-trophy-shelf-01`, route each event kind to **exactly one** celebrator:
- Let *this* own a `badge`/`milestone` moment → set the shelf's `animateAward={false}` and push the event here.
- Let the *shelf* own it (in-place reveal) → don't push that kind here (or mount this with `showCelebration={false}`).

Neither component imports or triggers the other — it's a host-wiring contract.

## Composition — the compound

```tsx
import { TeamFeedbackLoopRoot, TeamFeedbackNudge } from "@/components/team-feedback-loop-01"

// Nudge only — no celebration, confetti never loads:
<TeamFeedbackLoopRoot teamId={team.id} nextTask={nextTask} onNextTask={openTask}>
  <TeamFeedbackNudge />
</TeamFeedbackLoopRoot>
```

- `TeamFeedbackLoopRoot` — headless: the reducer, timer, reduced-motion, imperative handle. Holds the `ref`.
- `TeamFeedbackCelebration` / `TeamFeedbackNudge` — flat context parts.
- `CelebrationOverlay` / `NextTaskNudge` — context-free Tier-C primitives.
- `ConfettiBurst` — the `React.lazy` heavy bit (its own chunk).
- `useTeamFeedbackLoop()` — read state in a hand-assembled layout (throws outside `Root`).

## Portability

Zero `next/*`, no app context, SSR-safe (nothing animates on first paint), imports no other registry component. Install:

```bash
pnpm dlx shadcn@latest add @ilinxa/team-feedback-loop-01
# pulls the shadcn `button` primitive + `canvas-confetti` + `lucide-react`
# fixtures (sample events): add @ilinxa/team-feedback-loop-01-fixtures
```
