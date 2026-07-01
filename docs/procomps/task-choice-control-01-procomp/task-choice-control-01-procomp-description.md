# `task-choice-control-01` — Pro-component Description (Stage 1 / GATE 1)

> **Stage:** 1 of 3 · **Status:** DRAFT — pending GATE 1 sign-off
> **Slug:** `task-choice-control-01` · **Category:** `gamification` · **Tier:** pro-component
> **Gamification element:** **E4 — Task Choice / Volunteering** · **SDT need:** **Autonomy** (catalogue component **C6**).
> **System contract:** part of the signed-off [`gamification-system`](../../systems/gamification-system/gamification-system-description.md). Inherits its locked decisions (D-03, D-05, D-06, D-07, D-08, D-13); upstream extraction in [`gamification-elements-catalogue.md`](../../systems/gamification-system/gamification-elements-catalogue.md) (C6 / E4).
> **Sibling, not a fork.** This is a **standalone, droppable affordance** — it does **not** extend, embed, or modify [`kanban-board-01`](../../../src/registry/components/data/kanban-board-01/) or [`todo-rich-card`](../../../src/registry/components/data/todo-rich-card/). Per system **Q3** (signed off) it ships as its own procomp so a host can drop it into *any* task card. Per **D-03** it imports no other registry component.

This is the **description** doc (the "what & why"). Its job: pin down what we're building and why, give the data + states it must cover, surface the open design decisions, and earn sign-off before any planning or code.

> 🎯 **Read-me-first.** The hard rule that shapes everything below is the system's **never-forced** constraint ([gamification-system §5.2](../../systems/gamification-system/gamification-system-description.md)): **choice is always available, never forced; reassignment never penalizes the previous assignee.** This is the entire point of the Autonomy mapping — it shows up in the scope (§2), the API (§5/§7), the decisions (§7), and the success criteria (§9). If any design choice makes the control feel mandatory, pressuring, or punitive, it is wrong.

---

## 0. Compound-structure declaration (mandated)

Assessed honestly against [`.claude/rules/compound-component-structure.md`](../../../.claude/rules/compound-component-structure.md):

| Trigger | This component? |
|---|---|
| ≥ 3 distinct mountable regions | ❌ One small inline control cluster (open-flag toggle + claim/volunteer button + assignee display). Not separate page regions. |
| Composes ≥ 1 other procomp | ❌ Per **D-03** it imports no other registry component. |
| Pulls a heavy dep | ❌ shadcn primitives only (toggle / button / avatar). No Konva / pdf.js / charting. |
| A consumer would want a *subset* | 🟡 *Maybe* — a host might want only the "open for anyone" toggle, or only the assignee chip. |

**Verdict: single-unit control, NOT a full compound** (per system **D-05**, which calls this one out as "likely single-unit or a light compound — assess honestly"). It does **not** trip the ≥3-region / composes-a-procomp / heavy-dep triggers, so the mandatory compound rule does not bind it.

The one soft trigger (subset-want) is satisfied **without** the full three-tier ceremony: the control is built as a **small flat cluster of à-la-carte sub-parts** under one logic-free assembly — `OpenForAnyoneToggle`, `ClaimButton` (claim/volunteer), `AssigneeChip` — each independently mountable and **flat-exported** (never `TaskChoice.Toggle`). A host that wants only the toggle imports only `OpenForAnyoneToggle`. There is **no headless `Root` provider and no React context** (overkill for one task's worth of state, and **D-06** forbids requiring a provider) — the assembly is a thin prop-fan-out, not a context owner. Final part split is locked at GATE 2; this section only declares the shape.

> Net: flat exports, à-la-carte parts, logic-free assembly — the *spirit* of the compound rule — but **single-unit class**, exempt from the mandatory `Root`+context structure. Justified above.

---

## 1. Problem

A team task card needs an **autonomy affordance**: a member should be able to **opt to do a task themselves**, or **release a task so anyone can pick it up** — *by their own choice, without being told to.* Self-Determination Theory makes volition (acting from one's own will) the lever for the Autonomy need; a control that lets a member volunteer or open a task — and never forces either — is the smallest UI that delivers it ([catalogue C6 / E4](../../systems/gamification-system/gamification-elements-catalogue.md); evidence basis: Sailer et al. 2017 *meaningful choice*; Ryan & Deci 2000 *autonomy as volition*).

Today this lives nowhere in the library. The task-card surfaces we ship (`kanban-board-01`, `todo-rich-card`, `todo-tree`) render *who is assigned* but have **no first-class "open for anyone / I'll take this" control** — and adding one inside each of them would (a) couple the gamification layer to specific cards, breaking system **D-03** independence, and (b) re-implement the same three states three times. This procomp is that control, built **once**, **generic over the host's task**, droppable into any card.

What "good" means here is unusually narrow: the control must be **inviting, never coercive.** Releasing a task or volunteering is a one-tap, reversible, no-stakes gesture; un-volunteering or reassigning carries **no penalty signal** for whoever held it before.

---

## 2. In scope / Out of scope

### In scope (v1)

**Three states the control must render**

| State | Reads as | Driven by |
|---|---|---|
| **Open for anyone** | "🙌 Open for anyone — anyone on the team can take this." A clear, friendly invite, plus a **Claim / I'll take this** action. | `openForAnyone === true` (and typically `assigneeId` undefined). |
| **Claimed / assigned** | "Assigned to {member}" — avatar + name chip, with a low-key **Release** affordance (sets it back to open) and an optional **reassign** path. | `assigneeId` set. |
| **Unassigned, not open** | "Unassigned" — with both **Volunteer (I'll take this)** *and* **Open for anyone** offered side by side. | `assigneeId` undefined && `openForAnyone === false`. |

**Actions (all optional — omit the callback, the affordance hides)**
- **Toggle "open for anyone"** on / off → `onOpenForAnyoneChange(open: boolean)`.
- **Volunteer / Claim** ("I'll take this") → `onClaim(memberId)` (defaults to a `currentMemberId` prop when provided).
- **Reassign** to another team member → `onAssigneeChange(memberId | undefined)`; passing `undefined` = release (no penalty — §5.2).

**Behavior / constraints (the never-forced core)**
- **Choice always available** — the control is interactive whenever the host renders it; there is no locked / "you must" state. (A host may pass `readOnly` to display-only, but the *default* is choosable.)
- **Reassignment never penalizes the previous assignee** — releasing or reassigning shows a neutral transition; **no "abandoned", "dropped", red/penalty styling, or downgrade** on the prior holder. (§9 success criterion.)
- **Team-scoped** (**D-08**) — the candidate-member list is *this team's* members only; nothing public or inter-team.

**Display + portability**
- Avatar + initials-fallback for the assignee and for member pickers.
- Telemetry via optional `onEvent` (**D-07**): emits `{ type: "task-choice.interaction"; teamId; taskId }` on a meaningful interaction (open toggled, claimed, reassigned, released).
- Compact + comfortable density (fits a kanban card *and* a rich card row).
- Design-system tokens only (**D-13**) — signal-lime accent, Onest / JetBrains Mono, OKLCH, no hard-coded colors.
- Portable: no `next/*`, no `process.env`, no app context; registry-import-clean; SSR-safe.

### Out of scope (deferred / never)

- **NOT a fork or modification of `kanban-board-01` / `todo-rich-card` / `todo-tree`.** It is a *droppable control* a host wires into those cards (or any other card). It imports none of them (**D-03**).
- **No task list / board / drag-and-drop** — it controls one task's choice state, nothing more. The card around it is the host's.
- **No persistence / backend** — controlled; the host owns `TaskChoiceState` and writes via the callbacks (**D-06**).
- **No member-management UI** — the host supplies the candidate `members`; this control doesn't add/edit them.
- **No notifications / "someone took your task" toasts** — host concern.
- **No competitive mechanics, ever** ([§5.3](../../systems/gamification-system/gamification-system-description.md)) — no "X tasks volunteered" leaderboard, no per-member volunteer ranking, no points for claiming. Excluded by design.
- **No multi-assignee** in v1 (single `assigneeId`). Reserve only if a host proves the need.

### Deliberate non-goals (any version)
- **Not a task editor** — it edits only the choice slice (open flag + assignee), never the task's name/dates/status.
- **Not a provider / store** — single-unit, prop-driven (**D-06**); no `GamificationProvider` dependency.

---

## 3. Target consumers

| Archetype | Example | What they need |
|---|---|---|
| **Gamified task card** *(primary)* | E4 affordance dropped onto a kanban card or rich card in the gamification zone | The three-state control wired to their task; `onClaim` / `onOpenForAnyoneChange` writing back to their store |
| **Plain team task app** *(primary)* | Any team board wanting "open for anyone / I'll take it" without gamification | Standalone control, direct props, zero gamification infra (system **D-06**) |
| **Tier-host gamification page** *(integration)* | [`src/app/systems/gamification-system/page.tsx`](../../systems/gamification-system/gamification-system-description.md) wiring all six elements | Same `TaskChoiceState` shape as the host's example state; `onEvent` for the demo telemetry log |

Non-targets: full board layout (→ `kanban-board-01`), single-card detail (→ `todo-rich-card`), assignment *analytics* (out of scope — would drift toward per-member ranking, forbidden by §5.3).

---

## 4. Data structure — what the control is drawn from

**Per [system D-03](../../systems/gamification-system/gamification-system-description.md), this component re-declares the slice it needs in its OWN `types.ts` — it imports nothing from another registry component.** The slice below is the contract (verbatim from the system domain model §4), reproduced here, not imported:

```ts
// Declared locally in task-choice-control-01/types.ts — NOT imported.
// The component is generic over the host's task; it needs only the choice slice + the members.
interface TaskChoiceState {
  taskId: string;
  openForAnyone: boolean;
  assigneeId?: string;        // undefined → unassigned
}

type TeamMember = {
  id: string;
  displayName: string;
  avatarUrl?: string;
};
```

### Field → visual mapping

| Field | Where it shows | Notes for design |
|---|---|---|
| `taskId` | not rendered | identity for callbacks + the `onEvent` payload |
| `openForAnyone` | the **toggle** + the "🙌 Open for anyone" badge/label | on = invite state; clearly *friendly*, not a warning |
| `assigneeId` | the **assignee chip** (avatar + name) when set; the **claim/volunteer** action when unset | resolve to a `TeamMember` from the `members` list; initials fallback if no `avatarUrl` |
| `members[]` (prop) | the reassign picker + avatar resolution | **this team's** members only (§5.1) |
| `currentMemberId` (prop) | the default subject of "I'll take this" | the viewer; lets `onClaim()` default its arg |

### State resolution (deterministic — lock this in design)

```
isOpen        = openForAnyone === true
isAssigned    = assigneeId != null
state =
  isAssigned                 → "claimed"      (chip + neutral Release)
  isOpen   && !isAssigned    → "open"         (invite + Claim)
  !isOpen  && !isAssigned    → "unassigned"   (Volunteer + Open-for-anyone)
```

> Edge: `openForAnyone === true` **and** `assigneeId` set is legal (a task can be assigned yet still open for others to swap in). Render as "claimed", with the open-flag still visible/toggleable. Lock the exact treatment at design.

---

## 5. Rough API sketch (NOT final — that's the plan stage)

Illustrative; the canonical shape lands in `src/registry/components/gamification/task-choice-control-01/types.ts` at plan stage. No imports from other registry components (**D-03**); the §4 types are declared locally.

```ts
export type TaskChoiceState = {
  taskId: string;
  openForAnyone: boolean;
  assigneeId?: string;
};

export type TeamMember = { id: string; displayName: string; avatarUrl?: string };

export type TaskChoiceInteraction =
  | { kind: "open-toggled"; open: boolean }
  | { kind: "claimed"; memberId: string }
  | { kind: "reassigned"; memberId?: string }   // undefined = released
  ;

export type TaskChoiceControlProps = {
  /** The choice slice for one task. Controlled. */
  value: TaskChoiceState;
  /** This team's members (avatar resolution + reassign picker). Team-scoped (§5.1). */
  members: TeamMember[];
  /** The viewer — default subject of "I'll take this". */
  currentMemberId?: string;
  /** Required context for telemetry; also scopes the control to a team (D-08). */
  teamId: string;

  // ── Change callbacks (each optional → omit ⇒ that affordance hides) ──
  onOpenForAnyoneChange?: (open: boolean) => void;
  /** Volunteer / claim. Defaults memberId to currentMemberId when omitted. */
  onClaim?: (memberId: string) => void;
  /** Reassign; pass undefined to release. NEVER penalizes the prior assignee (§5.2). */
  onAssigneeChange?: (memberId: string | undefined) => void;

  /** Telemetry (D-07). Emits { type: "task-choice.interaction"; teamId; taskId }. */
  onEvent?: (e: { type: "task-choice.interaction"; teamId: string; taskId: string }) => void;

  /** Display-only (still shows state; hides all actions). Default false — choice is the default. */
  readOnly?: boolean;
  /** Layout density to fit a kanban card vs a rich-card row. Default "comfortable". */
  density?: "compact" | "comfortable";

  className?: string;
  "aria-label"?: string;
};
```

> **Callback-shape recommendation (load-bearing).** Keep callbacks **object/named-argument-free where one value suffices** (`onOpenForAnyoneChange(open)`, `onClaim(memberId)`) but **single-purpose and non-positional-overloaded** — no `(a, b, c)` tuples that a later version must reorder (the positional-callback versioning trap the readiness sweep flagged). `onAssigneeChange(memberId | undefined)` deliberately folds *release* into *reassign* (release = reassign-to-nobody) so there is **one** assignment chokepoint and no separate `onRelease` to keep in sync. The internal `TaskChoiceInteraction` union feeds `onEvent`; the public callbacks stay minimal.

**Surface budget:** ~3 data props (`value`, `members`, `currentMemberId`/`teamId`) + 4 callbacks (`onOpenForAnyoneChange`, `onClaim`, `onAssigneeChange`, `onEvent`) + 2 presentation (`readOnly`, `density`) ≈ **~9 feature concepts**, far under the ~25 ceiling. A single small control should stay small; if a real v1 sprawls past ~15, the API is wrong.

---

## 6. Example usages

### 6.1 — Dropped into a task card (the primary consumer)

```tsx
import { TaskChoiceControl01 } from "@/registry/components/gamification/task-choice-control-01";

function GamifiedTaskCard({ task, team, viewerId }: Props) {
  return (
    <article className="card">
      <h3>{task.name}</h3>
      {/* ...the host's own task chrome... */}
      <TaskChoiceControl01
        teamId={team.id}
        value={task.choice}                 // { taskId, openForAnyone, assigneeId }
        members={team.members}
        currentMemberId={viewerId}
        onOpenForAnyoneChange={(open) => updateTask(task.id, { openForAnyone: open })}
        onClaim={(memberId) => updateTask(task.id, { assigneeId: memberId, openForAnyone: false })}
        onAssigneeChange={(memberId) => updateTask(task.id, { assigneeId: memberId })}
        onEvent={(e) => analytics.track(e.type, { teamId: e.teamId, taskId: e.taskId })}
        density="compact"
      />
    </article>
  );
}
```

The same control sits identically inside a `kanban-board-01` card body or a `todo-rich-card` footer — the host owns the card, this owns the choice.

### 6.2 — Standalone, plain team app (no gamification)

```tsx
<TaskChoiceControl01
  teamId="design-team"
  value={{ taskId: "T-12", openForAnyone: true, assigneeId: undefined }}
  members={designTeam}
  currentMemberId="u-mina"
  onClaim={(id) => assign("T-12", id)}
  onOpenForAnyoneChange={(open) => setOpen("T-12", open)}
/>
```

Renders the **"open for anyone + Claim"** invite state with zero gamification infrastructure (system **D-06**).

### 6.3 — Controlled + display-only (read-only render)

```tsx
// No action callbacks → all affordances hide; shows the current state only.
<TaskChoiceControl01
  teamId={team.id}
  value={task.choice}
  members={team.members}
  readOnly
/>
```

Proves the capability-gating: omit the callbacks (or pass `readOnly`) and the control degrades to a clean status display — no dead buttons.

---

## 7. Decisions

Locked rows are inherited system constraints + this session's GATE-1 calls; open rows recommend a default to confirm at sign-off / plan stage.

| # | Question | Decision |
|---|---|---|
| **D1** | **Standalone vs. fork** | 🔒 **Standalone procomp** (system Q3, signed off). Droppable into any task card; imports no other registry component (**D-03**). NOT a modification of `kanban-board-01` / `todo-rich-card`. |
| **D2** | **Compound or single-unit** | 🔒 **Single-unit class** (§0) — does not trip the ≥3-region / composes-procomp / heavy-dep triggers. Built as flat à-la-carte sub-parts under a logic-free assembly, **no `Root`/context** (**D-06** forbids requiring a provider). Flat exports. |
| **D3** | **Never-forced** | 🔒 **Choice always available; reassignment never penalizes the prior assignee** (system §5.2). No mandatory state, no penalty/"dropped" styling on release. The defining constraint — verified at GATE 3. |
| **D4** | **Controlled** | 🔒 **Fully controlled** (**D-06**) — `value` in, callbacks out; the component holds no source-of-truth choice state. Optional light internal UI state (picker open/closed) only. |
| **D5** | **Telemetry** | 🔒 Optional `onEvent` emitting `{ type: "task-choice.interaction"; teamId; taskId }` (**D-07**). Library code stays env-free; host wires transport. |
| **D6** | **Team-scope** | 🔒 `members` is **this team's** members only; `teamId` required; nothing public/inter-team (**D-08**, §5.1). |
| **D7** | **Control layout** | 🟡 *Recommend:* an **inline cluster** — open-flag toggle/badge on the left, primary action (Claim / Volunteer / assignee chip) on the right; `density` switches compact (icon-led, kanban) vs comfortable (labelled, rich card). Confirm at plan/design. |
| **D8** | **"Claim" vs "Volunteer" wording** | 🟡 *Recommend:* **"I'll take this"** as the primary verb in both the *open* and the *unassigned* state (warm, volitional, autonomy-flavored) — internally one `onClaim`. "Volunteer" reads well for unassigned; "Claim" for open. Default to **"I'll take this"** for both to keep one button; expose label override at plan. Confirm at sign-off. |
| **D9** | **How "open for anyone" reads** | 🟡 *Recommend:* a **friendly invite, never a warning** — e.g. "🙌 Open for anyone" with signal-lime accent, NOT a red/alert treatment. Releasing a task reads as generosity, not failure (reinforces §5.2 no-penalty). Confirm tone at design. |
| **D10** | **Release path** | 🔒 **Release = `onAssigneeChange(undefined)`** — folded into reassign, one chokepoint, no separate `onRelease`. Neutral transition, no penalty signal (§5.2). |
| **D11** | **Slug / category** | 🔒 `gamification/task-choice-control-01` (system §2, Q1 signed off). New `gamification` category plumbed once before any element scaffolds (**D-01**, system-level). |
| **D12** | **Multi-assignee** | 🔒 **Single `assigneeId` in v1.** Multi-assignee deferred unless a host proves the need (avoids speculative surface). |

---

## 8. Risks

- **Coercion creep (the headline risk).** The whole element fails if the control ever *reads* as "you should take this" or shames a release. Design must keep every state inviting + neutral; GATE 3 explicitly checks the never-forced + no-penalty rule (§9). Copy and color (D8/D9) carry most of this weight.
- **Generic-over-host-task drift.** The control must stay decoupled from any specific card shape — it consumes only the `TaskChoiceState` slice + `members`, never a full `TodoItem`. Re-declaring the slice locally (**D-03**) avoids the cross-procomp import trap (`content-composer-01` F-01 lesson) — but means the slice is duplicated; accepted as the price of independence (system §7.3). Plan must keep the local slice byte-faithful to the system §4 model.
- **Subset-want vs single-unit tension.** §0 calls this single-unit, yet a host may want only the toggle. The flat à-la-carte sub-parts answer this *without* a `Root`/context. Risk: over-building toward a compound it doesn't need. Plan must keep the sub-parts dumb + prop-driven and the assembly a thin fan-out.
- **Member resolution.** `assigneeId` referencing a member not in `members` (stale data) must degrade gracefully (show id-as-initials, not crash). Lock the fallback.
- **Telemetry over-firing.** `onEvent` should fire on *meaningful* interactions, not every render/hover. Plan defines the exact emit points (open-toggled / claimed / reassigned / released).
- **Density inside a kanban card.** Compact mode must fit a narrow column without truncating the assignee name to nothing. Design specifies the compact collapse (avatar-only chip, action behind an icon).
- **`readOnly` vs omitted-callbacks ambiguity.** Two ways to get a non-interactive control. Plan picks one canonical "display-only" rule and documents the interaction (omitting all callbacks ⇒ same as `readOnly`).

---

## 9. Success criteria

v1 ships when:

1. **Three states render** — open / claimed / unassigned each produce their mapped affordances per §2 + §4's resolution table; the legal "assigned *and* open" edge renders deterministically.
2. **Never forced** — there is **no** locked/mandatory state; the control is choosable by default; `readOnly` is opt-in, not the norm. *(Hard GATE-3 check.)*
3. **No-penalty reassignment** — releasing (`onAssigneeChange(undefined)`) or reassigning shows a **neutral** transition: no red/penalty/"dropped"/downgrade styling or copy on the previous assignee. *(Hard GATE-3 check.)*
4. **Controlled** — `value` drives the render; every mutation goes out a callback; the component holds no source-of-truth choice state (**D-06**).
5. **Capability-gated** — omitting a callback (or `readOnly`) hides its affordance cleanly; no dead buttons.
6. **Team-scoped** — only `members` (this team) appear; nothing public/inter-team (**D-08**).
7. **Telemetry** — `onEvent` emits `{ type: "task-choice.interaction"; teamId; taskId }` on meaningful interactions only (**D-07**).
8. **Flat à-la-carte parts** — the sub-parts (toggle / claim / assignee chip) are independently importable + flat-exported; a host can mount just one.
9. **Design system** — all colors map to tokens; signal-lime accent; Onest / JetBrains Mono; no hard-coded colors; one `reveal-up` entrance (**D-13**).
10. **Portability** — no `next/*`, no `process.env`, SSR-safe, registry-import-clean; **no import of any other registry component** (**D-03**).
11. **A11y** — the toggle + actions are keyboard-operable with clear labels; state changes announce; the assignee chip is readable by SR.
12. **Demo + (deferred) tests** — demo exercises all three states + compact/comfortable + read-only; the state-resolution table is unit-testable (Vitest informed-defer per house convention).

---

## 10. Design coverage checklist (what design must produce)

> Each box is a state to define against the **ilinxa-ui-pro design system** ([`src/app/globals.css`](../../../src/app/globals.css)): **signal-lime** accent `oklch(0.80 0.20 132)` light / `oklch(0.86 0.18 132)` dark (always with near-black `--primary-foreground`), cool off-white `--background`, graphite-cool dark surfaces, **Onest** (sans) / **JetBrains Mono** (mono), one orchestrated `reveal-up` entrance. **Forbidden:** pure-white page backgrounds, neon-saturated lime (chroma ≤ 0.20), Inter/Roboto/Geist/system-font defaults, **and any penalty/alert treatment on a release** (§5.2).

**A. The three states**
- [ ] **Open for anyone** — friendly invite label/badge + Claim ("I'll take this") action.
- [ ] **Claimed / assigned** — assignee avatar + name chip + neutral Release + optional reassign.
- [ ] **Unassigned, not open** — Volunteer *and* Open-for-anyone offered together.
- [ ] **Legal edge** — assigned *and* open (chip + open-flag still visible/toggleable).

**B. Affordances**
- [ ] Open-for-anyone toggle (on / off) · Claim/Volunteer button · assignee chip (avatar + initials fallback) · reassign picker (member list, team-scoped) · Release (neutral).

**C. Color → token map (no penalty styling)**
- [ ] "Open for anyone" accent → signal-lime (invite, **not** alert) · assignee chip surface → `--card`/`--secondary` · Release → neutral/muted, **never** destructive-red · disabled/`readOnly` → muted · focus ring → token.

**D. Density + responsive**
- [ ] Compact (kanban card — avatar-only chip, icon actions) · comfortable (rich-card row — labelled) · narrow-column truncation behavior.

**E. Interaction + a11y**
- [ ] Keyboard focus + operation on toggle/actions · SR labels for each state · state-change announcement · `readOnly` (display-only) · stale-member fallback.

**F. Motion**
- [ ] One orchestrated `reveal-up` entrance; state transitions (claim / release) are smooth + neutral — no celebratory *or* punitive flourish on release.

---

## 11. Definition of "done" for THIS document (stage gate)

- [ ] §§0–10 drafted, reconciled to `ilinxa-ui-pro` conventions (paths, imports, design tokens) and to the signed-off [gamification-system contract](../../systems/gamification-system/gamification-system-description.md).
- [ ] **Compound assessed honestly (§0):** single-unit class; flat à-la-carte sub-parts, no `Root`/context; justified.
- [ ] Data slice declared **locally** per **D-03** (re-declared, not imported); §4 mapping + resolution table pinned.
- [ ] GATE-1 calls recorded (§7): D1 standalone (Q3), D2 single-unit, **D3 never-forced + D10 no-penalty release** (the core), D4 controlled, D5 telemetry, D6 team-scope, D11 slug/category, D12 single-assignee.
- [ ] Open design rows flagged for sign-off: **D7** control layout · **D8** claim/volunteer wording · **D9** how "open for anyone" reads.
- [ ] **User sign-off** → Stage 2 (`task-choice-control-01-procomp-plan.md`, GATE 2).

After sign-off, changes to this doc are loud and intentional, not silent rewrites.
