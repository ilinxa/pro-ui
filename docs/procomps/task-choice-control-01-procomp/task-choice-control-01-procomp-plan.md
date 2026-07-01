# `task-choice-control-01` — Pro-component Plan (Stage 2 / GATE 2)

> **Stage 2 of 3 · Status: DRAFT — pending GATE 2 sign-off**
> **Slug:** `task-choice-control-01` · **Category:** `gamification` · **Tier:** pro-component · **Structure:** single-unit control with flat à-la-carte sub-parts (NOT a `Root`/context compound)
> **Element:** E4 — Task Choice / Volunteering · **SDT need:** Autonomy (catalogue C6)
> **Predecessor:** [`task-choice-control-01-procomp-description.md`](./task-choice-control-01-procomp-description.md) (GATE 1)
> **System contract:** [`gamification-system`](../../systems/gamification-system/gamification-system-description.md) — honors D-01, D-03, D-05, D-06, D-07, D-08, D-13, **D-15**.

This is the **how** — the implementation contract the code must follow. Once signed off (**GATE 2**), `pnpm new:component gamification/task-choice-control-01` scaffolds the folder and code begins. Nothing here re-opens GATE-1 decisions (D1–D12); it operationalises them and **resolves the open description rows (D7 / D8 / D9 + edge-case ambiguities) to locked defaults** (§13 flags any that still want explicit sign-off).

> **Reviewer focus:** the never-forced + no-penalty guarantee made structural, not just visual (§6); the single-unit-vs-compound justification (§4); the member-picker dependency call (§3); and the `readOnly`-vs-omitted-callbacks canonical display rule (§9).

---

## 1. Summary of what we're building

A small, droppable **autonomy affordance** for one team task: an "open for anyone" toggle, an "I'll take this" claim/volunteer action, and an assignee chip with a neutral release + reassign path. It renders **three states** — `open` / `claimed` / `unassigned` — plus the legal `assigned-and-open` edge, deterministically from a controlled `TaskChoiceState` slice + a team `members` list. Releasing or reassigning is a **neutral, no-penalty transition** (the defining constraint). Ships as a **single-unit control** exposing flat à-la-carte sub-parts (`OpenForAnyoneToggle` / `ClaimButton` / `AssigneeChip`) under a logic-free `TaskChoiceControl01` assembly — **no headless `Root`, no React context** (D-06 forbids requiring a provider; there is nothing cross-cutting to hold). Imports no other registry component (D-03).

---

## 2. Client vs server

**`"use client"` on every module that holds state, refs, effects, or event handlers** — i.e. `task-choice-control-01.tsx`, all `parts/*`. Pure `lib/*` (the state-resolution + member-resolution functions) and `types.ts` are **framework-free, no directive** (importable from a server component's type position).

Justification: the control has interactive affordances (a `Switch`, buttons, a member-picker `Popover`+`Command`) with `onClick`/`onCheckedChange` handlers, plus light internal UI state (the picker open/closed flag) via `useState`. None of this can run on the server.

**SSR-safe by construction:** the component holds **no source-of-truth data state** (fully controlled, D-06/D4) and **never calls `new Date()`/`Date.now()`/random IDs during render** — every visual derives purely from `value` + `members` + props, so the server render and first client render are byte-identical (no hydration mismatch; the `rich-card` SSR-determinism lesson applies trivially because there's no time/random surface here). The only internal state (picker open) initialises to `false` on both server and client.

---

## 3. Dependencies

### 3.1 — shadcn primitives (all already in `src/components/ui/` — verified)

| Primitive | Used by | Purpose |
|---|---|---|
| `switch` | `OpenForAnyoneToggle` | the "open for anyone" on/off control (semantic on/off state — a `Switch` reads as a setting, which is exactly what "open for anyone" is). |
| `button` | `ClaimButton`, assembly actions | "I'll take this" primary action; the inline Release affordance; the reassign trigger. |
| `avatar` | `AssigneeChip`, member-picker rows | assignee + candidate avatars with initials fallback. |
| `popover` | reassign / member picker | anchored floating panel that hosts the member list. |
| `command` | reassign / member picker | searchable, keyboard-navigable member list (filter by name in a long team). |

**Decision (LOCKED) — member picker = `popover` + `command`.** Rationale: a reassign picker is a *searchable selection from a list*, which is exactly `command`'s job (built-in filter, full keyboard navigation, ARIA listbox semantics for free). A bare `dropdown-menu` would force the host into an unfiltered menu that degrades badly past ~8 members (the description §8 density risk + §2.1 team-scope). `popover` provides the anchored surface; `command` provides the searchable body. This is the proven shadcn "combobox" composition. **No `dropdown-menu`** (rejected: no search, menu semantics not list semantics).

> **F-cross-13 note (Radix vs Base UI divergence).** `popover` / `command` / `switch` are **already shipped** in `src/components/ui/` and exercised by prior components, so this introduces **no new primitive** → the "new-primitive" 4-ship smoke trigger does **not** fire by the strict rule. BUT the cross-backend divergence class (the `toggle-group` ToggleGroup model + the `Select (v: string | null)` annotation traps from the calendar/kanban smokes) means a **post-deploy cross-backend consumer-tsc smoke is still recommended** at GATE 3 — `command`/`popover` controlled-prop shapes are exactly where Radix and Base UI have diverged before. Follow the existing components' proven usage; don't hand-roll a controlled signature.

### 3.2 — npm

**None.** No date library, no DnD, no virtualization. The control is small and list-bounded by one team's membership.

### 3.3 — internal registry dependencies

**None (D-03).** The component imports **no** other registry component and re-declares the `TaskChoiceState` / `TeamMember` slice locally in its own `types.ts` (§5 of the description). Therefore:

- `meta.ts` → `dependencies.internal` is **empty / omitted**.
- `registry.json` → **no `registryDependencies`** entry.
- `validate:meta-deps` passes trivially (nothing to reconcile).

> **Lesson folded in (the task-family clipboard miss):** *"meta `internal:[]` ≠ registry.json `registryDependencies`."* That trap only bites when a component **does** import another registry component at runtime but omits the registry dep. Here there is genuinely **zero** cross-registry import (by D-03), so both must stay empty — and the GATE-3 deep-review must confirm no `@/registry/...` or `../<other-component>` import sneaked in (the §11 generic-over-host-task drift risk). The verification step (§12) greps for it explicitly.

---

## 4. Composition / structure (LOCK) — single-unit, flat parts, no `Root`/context

Assessed against [`.claude/rules/compound-component-structure.md`](../../../.claude/rules/compound-component-structure.md). **The mandatory compound rule does NOT bind this component** — it trips **none** of the four binding triggers:

| Binding trigger | This component | Verdict |
|---|---|---|
| ≥ 3 distinct mountable **regions** (toolbar/grid/sidebar/overlay) | One inline control cluster (toggle + action + chip). Not separate page regions. | ❌ not tripped |
| Composes ≥ 1 other procomp | Imports no registry component (D-03). | ❌ not tripped |
| Pulls a heavy dep | shadcn primitives only; no Konva/pdf.js/CodeMirror/charting. | ❌ not tripped |
| A consumer would want a **subset** | 🟡 *soft maybe* — a host might want only the toggle, or only the chip. | 🟡 soft only |

Per system **D-05** (which explicitly calls this element out as *"likely single-unit or a light compound — assess honestly"*) and description **D2**: **single-unit class.** The one soft trigger (subset-want) is satisfied **without** the three-tier ceremony, the headless `Root`, or React context.

> **Why no `Root`/context (the explicit justification the rule asks for).** A `Root` provider exists to own **cross-cutting state** that multiple sibling parts must read without prop-drilling (DndContext, selection across many rows, a shared imperative handle — see `media-library-01`). This control has **one task's worth of state**, it is **fully controlled** (the host owns `value`; D-06/D4), and the three sub-parts each read at most two or three props. There is nothing cross-cutting to hold. **D-06 forbids *requiring* a provider**, and a context that wraps a single controlled value would be pure overhead that *defeats* tree-shaking (a context object keeps its consumers coupled). So: **the assembly is a thin prop fan-out, not a context owner.**

### 4.1 — Export surface (flat — the GATE-2 enumeration)

Flat exports, **never** a `TaskChoiceControl.Toggle` namespace object (defeats tree-shaking). Each sub-part is its own module re-exported from the barrel.

| Export | Kind | Module | Reads context? | Role |
|---|---|---|---|---|
| `TaskChoiceControl01` | **assembly (logic-free fan-out)** | `task-choice-control-01.tsx` | n/a (no context) | Resolves the §4-table state once, then renders the relevant sub-parts for that state, passing each only the props it needs. Contains **no logic the parts don't** (a hand-assembly using the resolver + parts behaves identically). Demo + screenshot use this. |
| `OpenForAnyoneToggle` | **sub-part (à-la-carte)** | `parts/open-for-anyone-toggle.tsx` | no | `Switch` + friendly "🙌 Open for anyone" label. Prop-driven (`open`, `onOpenChange`, `readOnly`, `density`). Mountable alone. |
| `ClaimButton` | **sub-part (à-la-carte)** | `parts/claim-button.tsx` | no | the "I'll take this" volunteer/claim action. Prop-driven (`memberId`, `onClaim`, `label?`, `readOnly`, `density`). Mountable alone. |
| `AssigneeChip` | **sub-part (à-la-carte)** | `parts/assignee-chip.tsx` | no | avatar + name chip for the current assignee + inline **neutral Release** + reassign trigger (the `popover`+`command` picker). Prop-driven. Mountable alone. |
| `resolveTaskChoiceState` | **pure helper** | `lib/state.ts` | — | `(value) => "open" | "claimed" | "unassigned"` — the deterministic resolver (description §4 table). Exported so a hand-assembly resolves identically. |
| `resolveMember` | **pure helper** | `lib/members.ts` | — | `(id, members) => TeamMember | undefined` + an `initialsFor(idOrName)` fallback. Graceful stale-id handling (§9). |

> **Subset paths the flat exports unlock (the soft-trigger answer):** a host wanting *only* the open-flag imports `OpenForAnyoneToggle`; a host wanting *only* the assignee display imports `AssigneeChip`; a host wanting the full three-state behavior imports `TaskChoiceControl01`. Dropping the assembly drops nothing the parts need; dropping a part drops its `Switch`/`Command` import from that consumer's graph. **Tree-shaking is real** because each part is a separate module re-exported from `index.ts` and nothing is wrapped in a namespace object.

### 4.2 — Assembly is logic-free

`TaskChoiceControl01` does exactly one non-trivial thing — call `resolveTaskChoiceState(value)` and branch the JSX — and that resolver is **exported**, so the branch is reproducible by hand. It owns **no state** except the picker-open flag, which lives in `AssigneeChip` (the only part that needs it), not the assembly. A reviewer rejects any behavior that lives in the assembly but not in a part + the resolver.

---

## 5. The state resolution + member resolution engine (`lib/state.ts` + `lib/members.ts`, pure)

The deterministic core (description §4 "State resolution"). Pure, framework-free, test-ready.

```ts
// lib/state.ts
export type TaskChoiceRenderState = "open" | "claimed" | "unassigned";

export function resolveTaskChoiceState(v: TaskChoiceState): TaskChoiceRenderState {
  const isAssigned = v.assigneeId != null;
  if (isAssigned) return "claimed";          // claimed wins (covers the legal assigned-AND-open edge)
  return v.openForAnyone ? "open" : "unassigned";
}

// The legal edge: openForAnyone === true AND assigneeId set → resolves to "claimed",
// but the assembly STILL renders the OpenForAnyoneToggle alongside the chip (it stays
// visible + toggleable). The toggle's `open` reflects v.openForAnyone independently of state.
export const isOpenFlagVisible = (v: TaskChoiceState) => true; // always renderable; "claimed" doesn't hide it
```

```ts
// lib/members.ts
export function resolveMember(id: string | undefined, members: TeamMember[]): TeamMember | undefined {
  return id == null ? undefined : members.find((m) => m.id === id);
}

// Graceful stale-id fallback (§9): an assigneeId not in `members` does NOT crash.
// Render a chip from the raw id (initials derived from the id), no avatar, no name lookup.
export function initialsFor(member: TeamMember | undefined, fallbackId: string): string {
  const src = member?.displayName ?? fallbackId;
  return src.trim().slice(0, 2).toUpperCase(); // deterministic, SSR-safe
}
```

**State → rendered affordances (the contract the assembly implements):**

| Resolved state | OpenForAnyoneToggle | Primary action | AssigneeChip |
|---|---|---|---|
| `open` | shown, **on** (lime invite) | `ClaimButton` ("I'll take this") | — |
| `claimed` | shown, reflects `v.openForAnyone` (on/off) | — | chip (avatar+name) + **neutral Release** + reassign |
| `unassigned` | shown, **off** | `ClaimButton` ("I'll take this") **and** the toggle offered side by side | — |

---

## 6. Never-forced + no-penalty — made structural, not just visual (the core, hard GATE-3 check)

This is the entire point of the Autonomy mapping (system §5.2; description D3/D10). The plan makes it **structural** so it can't silently regress:

1. **No locked/mandatory state exists in the type system.** There is **no** `disabled`/`required`/`mustAssign` prop and no internal "you must choose" branch. The only non-interactive path is the **opt-in** `readOnly` (default `false`) — choice is the default (success criterion #2).

2. **Release folds into reassign — one chokepoint, no separate `onRelease` (D10).** Releasing is `onAssigneeChange(undefined)`. There is **no** `onRelease` callback to drift out of sync. The Release affordance simply calls `onAssigneeChange(undefined)`.

3. **No penalty signal anywhere on a release/reassign (hard check).** Enforced as concrete bans the GATE-3 review greps/eyeballs for:
   - **Color:** Release uses `variant="ghost"`/muted-foreground tokens — **never** `destructive`, **never** red, **never** a warning amber. (The `destructive` variant is forbidden on Release.)
   - **Copy:** Release reads **"Release"** or **"Open it up"** — **never** "Drop", "Abandon", "Give up", "Unassign" (cold), "Removed from". The prior assignee is **never** named in a negative frame ("X dropped this").
   - **Motion:** the release transition is a smooth neutral fade — **no** shake, **no** red flash, **no** celebratory flourish either (release is generosity, not failure *and* not a win).
   - **Iconography:** no ✕-on-a-person, no "warning"/"error" glyph. A simple "open hands"/swap glyph or plain text.
4. **The "open for anyone" state reads as a friendly invite (D9, LOCKED below).** Signal-lime accent, "🙌 Open for anyone", never a red/alert treatment. Releasing a task into "open for anyone" reads as generosity.

> **GATE-3 gate:** success criteria #2 (never forced) + #3 (no-penalty) are the two **hard** checks. The rotating review dimension SHOULD be **Copy** (the coercion-creep risk lives almost entirely in wording + color; §11). A single red pixel or one cold verb on the release path = `Needs revision`.

---

## 7. File-by-file plan

Sealed folder under `src/registry/components/gamification/task-choice-control-01/` (the `gamification` category must be plumbed first — see §8 prerequisite). Sub-parts are flat à-la-carte modules under `parts/`; pure logic under `lib/`. **No `hooks/` folder** (the only internal state is the picker-open flag, local to `AssigneeChip` — no shared hook needed). **No `Root`/context module.**

| File | Contents |
|---|---|
| `task-choice-control-01.tsx` | **Assembly** `TaskChoiceControl01` — `"use client"`. Calls `resolveTaskChoiceState(value)`; renders the relevant sub-parts per the §5 table; fans props out. Emits `onEvent` (§8). Capability-gates each affordance on its callback (§9). Holds **no** state. |
| `index.ts` | Barrel — flat exports: `TaskChoiceControl01`, `OpenForAnyoneToggle`, `ClaimButton`, `AssigneeChip`, `resolveTaskChoiceState`, `resolveMember`, `initialsFor`, + all public types. **No namespace object.** |
| `types.ts` | Framework-free. Locally-declared `TaskChoiceState`, `TeamMember` (D-03 — re-declared, NOT imported; byte-faithful to system §4). Plus `TaskChoiceControlProps`, `OpenForAnyoneToggleProps`, `ClaimButtonProps`, `AssigneeChipProps`, `TaskChoiceInteraction`, `TaskChoiceRenderState`, `TaskChoiceEvent`. |
| `parts/open-for-anyone-toggle.tsx` | **Sub-part** — `"use client"`. `Switch` + label. Props: `open`, `onOpenChange?`, `readOnly?`, `density?`, `className?`. Capability-gate: no `onOpenChange` ⇒ rendered read-only (display state, no interaction). |
| `parts/claim-button.tsx` | **Sub-part** — `"use client"`. `Button` "I'll take this". Props: `memberId?` (defaults to `currentMemberId` upstream), `onClaim?`, `label?`, `readOnly?`, `density?`, `className?`. No `onClaim` ⇒ hidden. |
| `parts/assignee-chip.tsx` | **Sub-part** — `"use client"`. Avatar+name chip; inline **neutral Release** (calls `onAssigneeChange(undefined)`); reassign trigger → `Popover`+`Command` member picker (team-scoped). Holds the only internal state (`pickerOpen`). Props: `value`, `members`, `onAssigneeChange?`, `readOnly?`, `density?`, `releaseLabel?`, `className?`. Stale-id fallback via `lib/members.ts`. |
| `lib/state.ts` | Pure `resolveTaskChoiceState` + `isOpenFlagVisible` (§5). |
| `lib/members.ts` | Pure `resolveMember` + `initialsFor` (§5). |
| `dummy-data.ts` | Fixtures: a `members: TeamMember[]` team + several `TaskChoiceState` examples exercising **all three states + the legal edge + a stale-assigneeId** + a member with no `avatarUrl` (initials path). **Fixtures registry item.** |
| `demo.tsx` | Docs demo — tabs/sections: **Three states** (open / claimed / unassigned), **Legal edge** (assigned-and-open), **Density** (compact vs comfortable side by side), **Read-only** (display-only), **À-la-carte** (the three sub-parts mounted standalone — proves the subset paths). |
| `usage.tsx` | Consumer usage notes (React component; MDX not wired). |
| `meta.ts` | Full `ComponentMeta`; `category: "gamification"`; `dependencies.shadcn: ["switch","button","avatar","popover","command"]`; **no `internal`, no `npm`**; version `0.1.0`, status `alpha`. |

**Out of the shipped registry** (docs-site only, per convention): `demo.tsx`, `usage.tsx`, `meta.ts`.

---

## 8. Final API (locked surface)

### 8.1 — Local types (D-03 — re-declared, NOT imported; byte-faithful to system §4)

```ts
// types.ts — declared locally, imports NOTHING from another registry component.
export interface TaskChoiceState {
  taskId: string;
  openForAnyone: boolean;
  assigneeId?: string;          // undefined → unassigned
}

export type TeamMember = {
  id: string;
  displayName: string;
  avatarUrl?: string;
};

export type TaskChoiceRenderState = "open" | "claimed" | "unassigned";

// Internal interaction union → feeds onEvent (kept internal; not a public callback arg).
export type TaskChoiceInteraction =
  | { kind: "open-toggled"; open: boolean }
  | { kind: "claimed"; memberId: string }
  | { kind: "reassigned"; memberId?: string };   // undefined = released

// The public telemetry event shape (system §6 / D-07 — exact union member).
export type TaskChoiceEvent = { type: "task-choice.interaction"; teamId: string; taskId: string };
```

### 8.2 — The control props (locked)

```ts
export type TaskChoiceControlProps = {
  /** Identity + scope for telemetry/team-scope (D-15: scalar teamId, NOT a team object;
   *  renders NO team name — this component shows no team-identity text). */
  teamId: string;
  /** This team's members — avatar resolution + the reassign picker. Team-scoped (D-08/§5.1). */
  members: TeamMember[];
  /** The choice slice for ONE task. Controlled (D-06/D4). */
  value: TaskChoiceState;
  /** The viewer — default subject of "I'll take this" when onClaim is called without an arg upstream. */
  currentMemberId?: string;

  // ── Change callbacks (each optional → omit ⇒ that affordance hides; §9 capability-gating) ──
  onOpenForAnyoneChange?: (open: boolean) => void;
  /** Volunteer / claim. memberId defaults to currentMemberId when the host doesn't override. */
  onClaim?: (memberId: string) => void;
  /** Reassign; pass undefined to RELEASE. Folds release in — NO separate onRelease (D10).
   *  NEVER penalizes the prior assignee (§5.2/§6). */
  onAssigneeChange?: (memberId: string | undefined) => void;

  /** Telemetry (D-07). Emits { type:"task-choice.interaction"; teamId; taskId } on meaningful interactions only. */
  onEvent?: (e: TaskChoiceEvent) => void;

  /** Display-only: shows current state, hides ALL actions. Default false — choice is the default (§5.2). */
  readOnly?: boolean;
  /** Density to fit a kanban card vs a rich-card row. Default "comfortable". */
  density?: "compact" | "comfortable";

  /** Per-state label overrides (D8 — one button, overridable copy). */
  labels?: {
    claim?: string;        // default "I'll take this"
    openForAnyone?: string; // default "Open for anyone"
    release?: string;      // default "Release"
    reassign?: string;     // default "Reassign…"
  };

  className?: string;
  "aria-label"?: string;
};
```

**Sub-part prop types** (`OpenForAnyoneToggleProps`, `ClaimButtonProps`, `AssigneeChipProps`) are narrow slices of the above — each takes only what it renders (enumerated in §7). They are the à-la-carte surface; the assembly maps the control props onto them.

**Surface budget (review method):** ~4 data props (`teamId`, `members`, `value`, `currentMemberId`) + 4 callbacks (`onOpenForAnyoneChange`, `onClaim`, `onAssigneeChange`, `onEvent`) + 3 presentation (`readOnly`, `density`, `labels`) ≈ **~11 feature concepts**, well under the ~25 ceiling. A single small control should stay small. ✅

### 8.3 — Telemetry emit points (exact — avoids over-firing, §11)

`onEvent` fires **once per meaningful committed interaction**, never on render/hover/picker-open:
- open toggled (either direction) → after `onOpenForAnyoneChange`
- claimed/volunteered → after `onClaim`
- reassigned (to a member) → after `onAssigneeChange(id)`
- released (`onAssigneeChange(undefined)`) → after the release

All emit the **same** envelope `{ type: "task-choice.interaction", teamId, taskId }` (the §6 union member). The richer `TaskChoiceInteraction` discriminant stays internal (the public event is intentionally coarse per system §6).

### 8.4 — Generics

**None.** `TaskChoiceState` / `TeamMember` are fixed local schemas (D-03). The component is generic *over the host's task* only in the sense that it consumes a **slice**, not a full task — no `<T>` type parameter (that would re-introduce the generic-over-host-task drift risk; §11).

### 8.5 — Prerequisite (D-01, system-level, one-off)

Before `pnpm new:component gamification/task-choice-control-01` can run, the **`gamification` category must be plumbed** (currently absent — verified in [`categories.ts`](../../../src/registry/categories.ts) + [`types.ts`](../../../src/registry/types.ts)): add `"gamification"` to `ComponentCategorySlug` ([`src/registry/types.ts`](../../../src/registry/types.ts)), add a `gamification` row to `CATEGORIES` ([`src/registry/categories.ts`](../../../src/registry/categories.ts)), and add the category to [`scripts/new-component.mjs`](../../../scripts/new-component.mjs). This is a **system-level one-off** (D-01) shared by all six gamification components; it is NOT this component's work to own, but this component **cannot scaffold until it lands**. Flagged as a build-order dependency, not a code item in this plan.

---

## 9. Edge cases

| Case | Handling |
|---|---|
| **Stale `assigneeId` not in `members`** | `resolveMember` returns `undefined`; `AssigneeChip` renders from the raw id — initials from the id (`initialsFor`), no avatar, no name lookup, **no crash** (§5). The reassign picker still lists the real `members`. |
| **`readOnly` vs omitted-callbacks** *(canonical rule — LOCKED)* | **One canonical display-only rule: a component is interactive for an affordance iff `readOnly !== true` AND that affordance's callback is provided.** I.e. `readOnly` is a *global* off-switch; an omitted callback is a *per-affordance* off-switch. They compose. **`readOnly` and "all callbacks omitted" produce the identical display-only render** (description §6.3 success criterion #5). Documented in the guide: prefer `readOnly` to express intent; omitting callbacks is the capability-gating mechanism. No third behavior. |
| **Compact-density truncation in a kanban column** | Compact: assignee name truncates with `text-ellipsis` + the full name in a native `title` (NOT a tooltip primitive — avoid the F-cross-13 surface for a one-liner); avatar never truncates; action collapses to icon-led ("I'll take this" → a hand/＋ icon button with an `aria-label`). The name never truncates to **zero** — minimum is the avatar (always shown). |
| **No `members` (empty array)** | Avatars fall back to id-initials; the reassign picker shows an empty-state ("No teammates to assign"); claim/volunteer still works against `currentMemberId`. |
| **`currentMemberId` absent but `onClaim` provided** | `ClaimButton` still renders; on click, if no `memberId` resolves it is a no-op guarded call (the host must supply a subject) — documented; the button is not shown if there is *no* possible claimant only when the host also omits `currentMemberId` AND the open/unassigned state has no viewer (rare; guide-noted). |
| **Legal edge: `openForAnyone === true` AND `assigneeId` set** | Resolves to `claimed`; the chip renders **and** the open-flag toggle stays visible/toggleable (§5). No conflict, deterministic. |
| **Long team in the reassign picker** | `command` filter handles search; the list is scroll-bounded. Team-scoped — only `members`, nothing inter-team (D-08). |
| **RTL** | Inline cluster uses logical properties (`gap`, `inline-start/end`); no horizontal-axis math → RTL-clean. (Lighter surface than gantt's time-axis; no known blocker.) |
| **`prefers-reduced-motion`** | The single `reveal-up` entrance + the release fade respect it (no motion). |

---

## 10. Accessibility

- **Region:** the control is a labelled group (`role="group"` + `aria-label`, default "Task assignment choice", overridable via the `aria-label` prop).
- **OpenForAnyoneToggle:** the shadcn `Switch` carries `role="switch"` + `aria-checked`; labelled via an associated `<label>` ("Open for anyone") so SR reads "Open for anyone, switch, on/off". Keyboard: Space/Enter toggles (native to `Switch`).
- **ClaimButton:** a real `<button>` with text **or** (compact) an icon + `aria-label="I'll take this"`. Keyboard-operable natively; visible focus ring (token).
- **AssigneeChip:** the chip exposes the assignee as SR-readable text ("Assigned to {name}"); the **Release** button has `aria-label` ("Release task" / the `release` label); the **Reassign** trigger has `aria-haspopup` + `aria-expanded` (popover state). The `command` picker is a searchable listbox (ARIA from the primitive) — full keyboard nav (↑/↓/Enter/Esc).
- **State-change announcement:** the cluster wraps a **polite `aria-live` region** (`aria-live="polite"`) carrying the current resolved state sentence ("Open for anyone", "Assigned to {name}", "Unassigned") so a claim/release/reassign is announced **without** stealing focus. The announcement copy is **neutral** for release ("Now open for anyone" — never "X dropped this"; §6).
- **Focus management:** after a reassign-from-picker, focus returns to the reassign trigger (popover close convention); after a release, focus stays on the cluster (the Release button is gone; focus moves to the next focusable affordance, the toggle).
- **Color is not the only signal:** "open for anyone" pairs the lime accent with the 🙌 glyph + text; assignee state is conveyed by avatar+name text, not color. Read-only state is conveyed by absence of controls, not by color alone.

---

## 11. Risks & alternatives

Carried from description §8 (all still apply), made concrete here:

- **Coercion creep (headline).** Mitigated structurally in §6: no mandatory state in the type system, banned colors/copy/motion on release, neutral `aria-live`. GATE-3 rotating dim = **Copy**; #2/#3 are hard checks. *This is the one that fails the component if missed.*
- **Generic-over-host-task drift.** Mitigated by D-03 local slice (no `TodoItem`, no `<T>` generic) + the §12 grep for any `@/registry/...`/`../<other>` import. Accepted cost: the slice is duplicated from system §4 — plan keeps it byte-faithful.
- **Subset-want vs single-unit tension.** Answered by flat à-la-carte parts **without** a `Root`/context (§4). Risk = over-building toward a compound it doesn't need; mitigated by keeping parts dumb + prop-driven and the assembly a thin fan-out (a reviewer rejects logic in the assembly that isn't in a part).
- **Member resolution (stale id).** Locked graceful fallback (§5/§9) — id-as-initials, no crash.
- **Telemetry over-firing.** Exact emit points (§8.3) — committed interactions only, never render/hover/picker-open.
- **Density truncation.** Locked compact behavior (§9) — avatar floor, native `title` for the full name, icon-led action.
- **`readOnly` vs omitted-callbacks ambiguity.** Locked canonical rule (§9) — `readOnly` global off + per-affordance callback gate compose; identical display-only render.
- **F-cross-13 cross-backend divergence.** `popover`/`command`/`switch` are not *new* primitives, but the Radix-vs-Base-UI controlled-prop divergence class is real (calendar `toggle-group`/`Select` smokes). Mitigation: follow shipped components' proven controlled usage; **post-deploy cross-backend consumer-tsc smoke recommended** at GATE 3.

**Alternatives considered:**
- **`dropdown-menu` for the member picker** — rejected (no search, menu not list semantics; degrades past ~8 members). `popover`+`command` chosen.
- **A `Root`/context compound** — rejected per §4 (nothing cross-cutting to hold; D-06 forbids requiring a provider; context defeats tree-shaking for a single value).
- **A separate `onRelease` callback** — rejected per D10 (folded into `onAssigneeChange(undefined)`; one chokepoint, no sync drift).
- **Multi-assignee (`assigneeIds[]`)** — deferred per D12 (single `assigneeId` in v1; avoids speculative surface).
- **`toggle` instead of `switch`** for "open for anyone" — `switch` chosen (a setting that's on/off reads as a switch; `toggle` reads as a pressed-button, less semantically apt for a persistent flag).

---

## 12. Verification plan (pre-GATE-3)

1. `pnpm tsc --noEmit` clean · `pnpm lint` clean · `pnpm validate:meta-deps` clean (trivial — no internal/npm deps; **meta-deps gotcha:** if any `parts/*` file has a side-effect import, put the dep-declaring `from`-import first; never name a dep only in a comment — blackboard-01 + content-composer-01 lessons).
2. **D-03 import audit (grep):** confirm **no** `@/registry/` and **no** `../` import that escapes the component folder, in any shipped file — the generic-over-host-task firewall (§11).
3. `pnpm build` succeeds.
4. Docs render at `/components/task-choice-control-01`; all demo sections interactive (three states + edge + density + read-only + à-la-carte).
5. `pnpm registry:build`; spot-check `public/r/task-choice-control-01.json` + `task-choice-control-01-fixtures.json` (targets follow the locked `components/task-choice-control-01/<sub>` convention; **no** demo/usage/meta shipped; **no** `registryDependencies`).
6. **Subset proof:** the demo's "À-la-carte" section mounts `OpenForAnyoneToggle` / `ClaimButton` / `AssigneeChip` standalone (proves the flat-export subset paths).
7. **Never-forced / no-penalty proof (hard):** walk all three states + the legal edge; confirm release/reassign shows **neutral** styling + copy (the §6 ban list) — no red, no cold verb, no penalty motion.
8. **(Recommended) cross-backend consumer-tsc smoke:** `pnpm dlx shadcn add @ilinxa/task-choice-control-01` in a tmp consumer on **both** Radix and Base UI backends; `pnpm tsc --noEmit` clean post-install (the `popover`/`command`/`switch` controlled-prop divergence surface; F-cross-13).
9. **Pure-lib unit tests (Vitest — informed-defer per house convention, but `lib/*` is written test-ready):** `resolveTaskChoiceState` for all four input shapes incl. the legal edge; `resolveMember` stale-id; `initialsFor` fallback.
10. GATE 3: [`docs/reviews/templates/review-spotcheck.md`](../../reviews/templates/review-spotcheck.md), 5 dims, **rotating dim = Copy** (coercion-creep is the dominant risk; §6/§11). Verdict ≥ `Pass with follow-ups` to close.

---

## 13. Resolved open rows (D7 / D8 / D9) + flags for sign-off

The description left D7 / D8 / D9 as 🟡 *recommend* rows. This plan **LOCKS** them to the recommended defaults:

| # | Question | LOCKED default (this plan) | Wants explicit sign-off? |
|---|---|---|---|
| **D7** | Control layout | 🔒 **Inline cluster** — `OpenForAnyoneToggle` on the inline-start, primary action / assignee chip on the inline-end; `density` switches compact (icon-led, kanban) vs comfortable (labelled, rich-card row). | No — confirm at design polish only. |
| **D8** | "Claim" vs "Volunteer" wording | 🔒 **"I'll take this"** as the single primary verb for **both** the `open` and the `unassigned` state (one `ClaimButton`, one `onClaim`), overridable via `labels.claim`. Warm, volitional, autonomy-flavored. | Light — confirm the literal string at sign-off. |
| **D9** | How "open for anyone" reads | 🔒 **Friendly invite, never a warning** — "🙌 Open for anyone" with signal-lime accent; release reads as generosity; **no** red/alert treatment ever (the §6 ban). | No — locked by the never-forced core. |
| **D-edge** | `readOnly` vs omitted-callbacks | 🔒 **Canonical rule (§9):** `readOnly` = global off-switch; omitted callback = per-affordance off-switch; they compose; identical display-only render. | No. |
| **D-picker** | Member picker primitive | 🔒 **`popover` + `command`** (searchable, keyboard-nav, list semantics). Not `dropdown-menu`. | No. |

**Genuinely open for GATE-2 sign-off (flagged):**
- **(a)** The exact `labels.claim` default string — **"I'll take this"** is recommended (D8). If the team prefers "Volunteer" for `unassigned` and "Claim" for `open` (two strings, two buttons), that re-opens the one-button decision; the plan recommends **one button, one string** for simplicity. *Confirm.*
- **(b)** Whether a tiny **release-undo** (a 1-tap "Take it back" right after a release, host-state permitting) is in v1 or deferred. The plan **defers it** (the host owns `value`; an undo is host state) — but it strongly reinforces the no-penalty/reversible promise, so flag for a yes/no. *Recommend defer to v0.2; confirm.*

---

## 14. Definition of "done" for THIS document (stage gate)

- [ ] Final API locked (§8); flat export surface enumerated (§4.1); single-unit-vs-compound justified (§4).
- [ ] Never-forced + no-penalty made structural (§6) — the hard GATE-3 checks have concrete ban lists.
- [ ] State + member resolution engine specified (§5); deterministic + SSR-safe.
- [ ] File-by-file plan (§7) mirrors the sealed-folder house pattern (no `Root`/context, no `hooks/`).
- [ ] Dependencies locked (§3) — shadcn `switch`/`button`/`avatar`/`popover`/`command`; **no npm, no internal** (D-03); member-picker call justified.
- [ ] Client/server (§2), edge cases (§9), a11y (§10), risks (§11), verification (§12) covered.
- [ ] Open description rows resolved to locked defaults (§13); remaining sign-off flags (a)/(b) surfaced.
- [ ] D-01 `gamification` category plumbing noted as a build-order prerequisite (§8.5).
- [ ] **User sign-off** → scaffold `gamification/task-choice-control-01` + implement (GATE 2 cleared).

After sign-off, deviations from this plan are loud and intentional, not silent.
