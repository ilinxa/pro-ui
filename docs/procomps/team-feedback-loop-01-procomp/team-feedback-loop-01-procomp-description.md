# `team-feedback-loop-01` — Pro-component Description (Stage 1 / GATE 1)

> **Stage:** 1 of 3 · **Status:** DRAFT — pending GATE 1 sign-off
> **Slug:** `team-feedback-loop-01` · **Category:** `gamification` · **Tier:** pro-component (ships as a **shadcn-style compound** — see §0)
> **System:** member of the [`gamification-system`](../../systems/gamification-system/gamification-system-description.md) (element **E6**, SDT need **Competence**). Honors that document's locked decisions (§7); where this doc and the system contract disagree, **the system contract wins** — flag it back there.
> **Upstream extraction:** catalogue components **C9** (feedback / celebration layer) + **C10** ("next-task" prompt / nudge) — see [gamification-elements-catalogue.md](../../systems/gamification-system/gamification-elements-catalogue.md).
> **Conceptual lineage:** Werbach & Hunter (2012) 6D *engagement* + *progression* loops; the lightweight, non-blocking "toast + nudge" patterns of Linear / Notion / Duolingo's streak beats — minus the modal celebration walls those products sometimes overdo.

This is the **description** doc (the "what & why"). Its job: pin down what we're building and why, give a precise inventory of the trigger data it consumes + the states it must cover, surface the open design decisions, and earn sign-off before any planning or code.

> 🎯 **Read-me-first.** This is the system's **feedback layer** — it is **triggered by the host** ("celebrate this", "suggest this next"), never a data store. It owns **no** milestone/badge/task state. The headline constraint is **D-10**: every animation is **brief (< 1 s), skippable, and NON-BLOCKING — no modal blocking, ever** (§7). §4 is the exact trigger shape; §9 is the success bar; §10 is the design coverage checklist.

---

## 0. Compound-structure declaration (mandated)

`team-feedback-loop-01` qualifies as a compound under [`.claude/rules/compound-component-structure.md`](../../../.claude/rules/compound-component-structure.md): it has **two distinct mountable surfaces** (a celebration overlay + a next-task nudge) and a reasonable consumer wants **only one** of them — "celebration without a nudge" (a board that has no task queue) and "nudge without celebration" (a quiet checklist) are both real shapes. It also pulls a **heavy/optional animation primitive** (confetti / burst) that not every consumer wants. **Therefore it ships as a shadcn-style compound** — headless `Root` provider + flat à-la-carte parts + standalone primitives + one logic-free assembly. Flat exports, never a `Name.Root` namespace (system **D-05**).

**Rough part inventory** (precise tier split + names are locked at GATE 2):

| Tier | Members (rough) | Role |
|---|---|---|
| **B — headless Root** | `TeamFeedbackLoopRoot` | Owns the current-event state (controlled `event` prop **and/or** an imperative `celebrate()` handle), the auto-dismiss timer (< 1 s, §7), the reduced-motion read, the skip/dismiss handlers, optional `onEvent` pass-through, and the context. Renders `children`. **Holds no milestone/badge/task data** — only "what to show right now." |
| **B — context parts** (flat) | `TeamFeedbackCelebration` · `TeamFeedbackNudge` | One module per surface; each reads `useTeamFeedbackLoop()` — no prop-drilling. Celebration shows the current `FeedbackEvent`; nudge shows the current `NextTaskSuggestion`. |
| **C — standalone primitives** (context-free) | `CelebrationOverlay` (dumb, prop-driven: title/detail/narrative + skippable + reduced-motion variant) · `NextTaskNudge` (dumb: label + accept/dismiss) · `ConfettiBurst` (the **`React.lazy`** heavy bit) | Usable anywhere; pure props. |
| **A — assembly** | `TeamFeedbackLoop01` | `Root` + both parts, gated by `show*` toggles (`showCelebration` / `showNudge`). Contains no logic the parts don't. Demo + screenshot use this. |

**Tree-shaking story:** each part is its own module re-exported from the barrel. `ConfettiBurst` (and any other heavy burst/animation lib) is `React.lazy(() => import(...))`, so the **default** celebration (a token-driven CSS `reveal-up` flourish, no library) keeps confetti out of the consumer's graph entirely. A consumer who mounts only `TeamFeedbackNudge` pulls neither the celebration overlay nor confetti; a consumer who mounts only `TeamFeedbackCelebration` pulls no nudge logic. The à-la-carte subsets must fall out for free.

---

## 1. Problem

A cooperative team-management surface needs to **close the feedback loops** that make progress feel earned and momentum feel continuous — the two loops the source 6D design names:

- **Engagement loop:** task-completion → a brief feedback flourish → a **"what's next" prompt** so the team doesn't stall after a win.
- **Progression loop:** a milestone is achieved → a **team badge appears + a narrative beat plays** → the team is pointed at the next milestone.

Today every product hand-rolls this and gets it wrong in one of two ways: either there's **no feedback at all** (a task quietly checks off, the moment evaporates), or the feedback is a **blocking modal** that demands a click before the team can keep working — which, in a research-grounded cooperative setting, is exactly the failure mode to avoid (§7, **D-10**). What's missing is a **portable, prop-driven feedback layer** that:

1. shows a **brief, skippable, non-blocking** celebration when the host says "team progress just advanced,"
2. follows it with a **gentle next-task nudge** the team can accept or ignore,
3. keeps every reward **about the TEAM, never an individual** (system **D-08**), and
4. owns **no state of its own** — the host triggers it; this component renders the moment and gets out of the way.

This procomp is that layer. It does **not** decide *when* a milestone is hit or *which* badge is earned — that's the host's domain model (the trophy-shelf, progress-bar, and quest-log are separate components the host wires; this one imports **none** of them, per **D-03**).

---

## 2. In scope / Out of scope

### v1 — in scope

**Celebration surface (C9 — engagement + progression flourish)**
- Renders a **brief overlay flourish** when the host pushes a `FeedbackEvent` (kinds: `milestone` · `badge` · `task-complete`).
- **Default flourish is token-driven CSS** (`reveal-up` + a signal-lime accent burst), zero library. An **optional `ConfettiBurst`** (lazy) is opt-in for `milestone`/`badge` kinds.
- Shows `title`, optional `detail`, and — for the progression loop — an optional `narrativeBeat` chapter line.
- **Auto-dismisses in < 1 s** (the locked ceiling, **D-10**) **and** is **manually skippable** (click / tap / Esc) at any point. Never steals focus into a trap; never blocks pointer events behind a scrim that requires interaction.
- **Reduced-motion variant:** when `prefers-reduced-motion: reduce`, the burst/confetti is replaced by a static, instantly-readable badge appearance (no movement) — still time-boxed, still skippable.

**Next-task nudge surface (C10 — closes the engagement loop)**
- Renders a **non-blocking nudge** ("Next up: …") from a host-supplied `NextTaskSuggestion`.
- **Accept** → fires `onNextTask(suggestion)` (host navigates / opens). **Dismiss** → quietly hides; no penalty, no nag.
- Inline or corner placement (prop-gated); never a modal.

**Loop wiring**
- The two surfaces can fire **together** (milestone → celebration *then* nudge) or **independently** (a bare `task-complete` flourish with no nudge; a standalone nudge with no celebration).
- **Retrigger / queueing of rapid events** is handled deterministically (§8) — a second event arriving mid-celebration must not stack overlays or jank.

**Team-scope & cooperative rules (system §5)**
- Copy and visuals are **about the team** ("Your team unlocked…"), **never an individual** ("You unlocked…"). No per-member call-out, no comparison, no inter-team/public surface.

**Portability**
- Zero `next/*`, no `process.env`, no app context. Registry-import rules: only `react`, `@/components/ui/*`, `@/lib/utils`, and explicitly-declared third-party deps (the lazy confetti lib). **Imports no other registry component** (**D-03**) — not the trophy-shelf, not the progress-bar. SSR-safe (no animation runs until mount; the auto-dismiss timer is client-only).

### v1 — out of scope (deferred)

- **Owning milestone/badge/task state** → never; the host owns it (**D-06**). This component is told what happened.
- **A queue *history* / "missed celebrations" replay** → out; we render the current moment, not a log.
- **Sound / haptics** → deferred (a later opt-in prop; v1 is visual-only).
- **Achievement *definitions* / rules engine** ("award a badge when N tasks done") → host concern, not this layer.
- **A `GamificationProvider` / shared store** → deferred to the system's kit (system **D-12**); v1 is self-sufficient props.

### Deliberate non-goals (any version) — call these out explicitly

- **NO modal blocking.** This is the headline constraint (**D-10**). The celebration is an overlay flourish, not a dialog the team must dismiss to continue. No focus trap, no required click, no work-halting scrim.
- **NO individual feedback.** Never "you," never a single member's name as the subject of a reward, never a per-member ranking (system §5.3). Feedback is team-scoped only.
- **Not a notification center.** It shows *this* event, then clears. Persistence, history, and badges-earned galleries live elsewhere (`team-trophy-shelf-01`, host).
- **Not a toast library.** It's two purpose-built cooperative-feedback surfaces, not a generic queueable toast system.

---

## 3. Target consumers

| Archetype | Example | What they need |
|---|---|---|
| **Gamified team board** *(primary)* | The `gamification-system` host page | Celebration on milestone/badge + a next-task nudge, both team-scoped, both non-blocking |
| **Cooperative checklist / sprint app** *(primary)* | A team to-do with milestones | A brief flourish on milestone completion; quietly point at the next task |
| **Celebration-only consumer** *(secondary)* | A board that has no task queue | Just the `TeamFeedbackCelebration` part — drop the nudge entirely |
| **Nudge-only consumer** *(secondary)* | A quiet productivity surface that doesn't want flair | Just the `TeamFeedbackNudge` part — no overlay, no confetti |

Non-targets: app-wide error/success toasts (use a toast lib), individual achievement popups (excluded by design), persistent badge galleries (→ `team-trophy-shelf-01`), the progress number itself (→ `team-progress-bar-01`).

---

## 4. Data structure — what the host pushes in

**The component is fed two small, host-owned shapes.** It re-declares the slice it needs in its **own `types.ts`** (system **D-03** — no shared import; this aligns with §4 of the system contract but is the component's local copy). No persistence, no internal store.

```ts
// What just happened (drives the celebration). The host decides when to push this.
interface FeedbackEvent {
  kind: "milestone" | "badge" | "task-complete";
  title: string;            // e.g. "First playable build!"  — team-scoped copy
  detail?: string;          // optional secondary line
  narrativeBeat?: string;   // optional chapter beat text (progression loop, E5 overlap)
}

// What to do next (drives the nudge). Closes the engagement loop.
interface NextTaskSuggestion {
  taskId: string;           // opaque to this component; passed back on accept
  label: string;            // e.g. "Pick up: wire the win screen"
}
```

> These mirror the system's domain model (§4) without importing it: `FeedbackEvent.kind` aligns with the milestone/badge spine (system **D-09**), and `narrativeBeat` echoes E5's `NarrativeChapter.title`. The component never resolves a `milestoneId` or a `Badge` itself — the host pre-renders the human strings into `title`/`detail`/`narrativeBeat`.

### Field → visual mapping (the design table)

| Field | Where it shows | Notes for design |
|---|---|---|
| `kind: "milestone"` | Celebration: largest flourish; optional confetti; narrative line shown if present | Progression loop — the "chapter advances" beat |
| `kind: "badge"` | Celebration: badge-appearance treatment (static-friendly for reduced-motion) | Team badge, **never** attributed to a person |
| `kind: "task-complete"` | Celebration: smallest/quietest flourish; usually no confetti | Engagement loop — the fast, frequent beat |
| `title` | Celebration headline | Team-scoped copy ("Your team…"); truncate gracefully |
| `detail` | Celebration sub-line | Optional |
| `narrativeBeat` | Celebration chapter line (progression) | Optional; ties to E5 narrative |
| `NextTaskSuggestion.label` | Nudge body ("Next up: …") | The visible prompt |
| `NextTaskSuggestion.taskId` | (not rendered) | Returned via `onNextTask` on accept |

### Trigger resolution (deterministic — lock this in design)

```
celebration shows  ⟺  a FeedbackEvent is "current" (controlled prop set OR celebrate() called)
auto-dismiss        =  current event clears after celebrationDurationMs (≤ ~900ms; clamped < 1s, D-10)
skip                =  click / tap / Esc clears the current event immediately
reduced-motion      =  motion replaced by a static, time-boxed, still-skippable appearance
rapid retrigger     =  newest event wins (replace, don't stack); see §8
nudge shows         ⟺  a NextTaskSuggestion is provided; independent of the celebration lifecycle
```

---

## 5. Rough API sketch (NOT final — that's the plan stage)

Illustrative. The canonical shape lands in `src/registry/components/gamification/team-feedback-loop-01/types.ts` at plan stage; defer to it on naming. Two triggering mechanisms are sketched — the **recommendation is to support both** (controlled `event` prop for declarative hosts, imperative `celebrate()` handle for event-driven hosts); the final call is **Q3** (§7, open).

```ts
export interface FeedbackEvent {
  kind: "milestone" | "badge" | "task-complete";
  title: string;
  detail?: string;
  narrativeBeat?: string;
}
export interface NextTaskSuggestion { taskId: string; label: string }

// Optional telemetry, for symmetry with the system contract (D-07).
// NOTE: E6 has NO dedicated telemetry event in the catalogue — see §7 / open Q4.
type GamificationEvent =
  | { type: string; teamId: string; [k: string]: unknown }; // host-typed; this component emits nothing required

export interface TeamFeedbackLoopProps {
  /** Team identity for team-scoped copy + (if used) telemetry envelope. */
  teamId: string;

  // ── Celebration (controlled trigger) ──
  /** The current event to celebrate. Setting it (re)opens the celebration; null = closed. */
  event?: FeedbackEvent | null;
  /** Auto-dismiss after N ms. Clamped to < 1000 (D-10). Default ~800. */
  celebrationDurationMs?: number;
  /** Opt-in confetti burst for milestone/badge kinds (lazy-loaded). Default false. */
  enableConfetti?: boolean;
  /** Override the celebration render entirely (still must respect skippable + reduced-motion). */
  renderCelebration?: (event: FeedbackEvent) => React.ReactNode;
  /** Fired when the celebration is dismissed (auto or skipped). */
  onCelebrationDismiss?: (event: FeedbackEvent, reason: "auto" | "skip") => void;

  // ── Next-task nudge ──
  /** The suggestion to nudge toward; undefined = no nudge. */
  nextTask?: NextTaskSuggestion;
  /** Accepted the nudge — host navigates/opens the task. */
  onNextTask?: (suggestion: NextTaskSuggestion) => void;
  /** Dismissed the nudge — no penalty, no nag. */
  onNudgeDismiss?: (suggestion: NextTaskSuggestion) => void;
  /** Where the nudge mounts. Default "inline". Never modal. */
  nudgePlacement?: "inline" | "corner";

  // ── Assembly toggles (compound) ──
  showCelebration?: boolean;   // default true
  showNudge?: boolean;         // default true

  // ── Optional telemetry (D-07) — emits nothing required for E6 (Q4) ──
  onEvent?: (e: GamificationEvent) => void;

  className?: string;
  "aria-label"?: string;
}

// Imperative trigger (the event-driven path; complements the controlled `event` prop).
export interface TeamFeedbackLoopHandle {
  /** Fire a celebration imperatively. */
  celebrate(event: FeedbackEvent): void;
  /** Dismiss the current celebration now. */
  dismiss(): void;
}
```

**Surface budget:** counting feature concepts (controlled `event` + imperative `celebrate` as one trigger concept, excluding `className`/`aria-label`), this sketch is **~13 concepts — comfortably under the ~25 ceiling.** This is a small, focused component; if a real v1 approaches the ceiling, the surface is wrong.

---

## 6. Example usages

### 6.1 — Full loop in the gamification host (the primary consumer)

```tsx
import { TeamFeedbackLoop01 } from "@/registry/components/gamification/team-feedback-loop-01";

function GamificationZone({ team, lastEvent, nextTask }) {
  return (
    <TeamFeedbackLoop01
      teamId={team.id}
      event={lastEvent}                 // host pushes { kind: "milestone", title: "First playable build!" }
      enableConfetti
      nextTask={nextTask}               // { taskId, label: "Pick up: wire the win screen" }
      onNextTask={(s) => openTask(s.taskId)}
      onEvent={(e) => analytics.track(e)} // host wires transport; E6 emits nothing required
    />
  );
}
```

A milestone push triggers a brief (< 1 s), skippable, confetti-backed celebration with the chapter beat, then the next-task nudge points the team at the next task — neither blocks the board.

### 6.2 — Celebration only (no task queue) — proves the compound subset

```tsx
import {
  TeamFeedbackLoopRoot, TeamFeedbackCelebration,
} from "@/registry/components/gamification/team-feedback-loop-01";

// A board with no "next task" concept: drop the nudge entirely — confetti never loads either if disabled.
<TeamFeedbackLoopRoot teamId={team.id} event={lastEvent}>
  <TeamFeedbackCelebration />
</TeamFeedbackLoopRoot>
```

### 6.3 — Imperative, nudge-only (event-driven, quiet surface)

```tsx
import {
  TeamFeedbackLoopRoot, TeamFeedbackNudge, type TeamFeedbackLoopHandle,
} from "@/registry/components/gamification/team-feedback-loop-01";

const ref = useRef<TeamFeedbackLoopHandle>(null);
// elsewhere: ref.current?.celebrate({ kind: "task-complete", title: "Your team cleared the backlog column" });

<TeamFeedbackLoopRoot ref={ref} teamId={team.id} nextTask={nextTask} showCelebration={false}>
  <TeamFeedbackNudge />
</TeamFeedbackLoopRoot>
```

---

## 7. Decisions

System-inherited rows are **locked at the system level** (see [`gamification-system-description.md` §8](../../systems/gamification-system/gamification-system-description.md#8-locked-decisions-index)); component-specific rows recommend a default and confirm at sign-off / plan stage.

| # | Question | Decision |
|---|---|---|
| **D-03** *(inherited)* | Registry independence | 🔒 **Imports no other registry component.** Owns its `FeedbackEvent` / `NextTaskSuggestion` slice in its own `types.ts`. Does **not** import `team-trophy-shelf-01` or `team-progress-bar-01` — the host wires those alongside. |
| **D-05** *(inherited)* | Compound structure | 🔒 **Ships as a shadcn-style compound** (§0): celebration part + nudge part are independently mountable; flat exports; the confetti/burst dep is `React.lazy`. |
| **D-06** *(inherited)* | Prop-driven, controlled | 🔒 **Self-sufficient, no provider/store.** The host triggers it (controlled `event` prop and/or imperative `celebrate()`); the component owns only "what to show now," never milestone/badge/task data. |
| **D-08** *(inherited)* | Cooperative + team-scoped | 🔒 **Feedback about the TEAM, never an individual; never inter-team/public.** Copy, visuals, and rewards are team-subject only. Enforced at GATE 3. |
| **D-10** *(inherited)* | Non-blocking feedback | 🔒 **CRITICAL — animations < 1 s, skippable, NO modal blocking.** No focus trap, no required click, no work-halting scrim. `celebrationDurationMs` is clamped < 1000. The single most important interaction constraint of this component. |
| **D-13** *(inherited)* | Design system | 🔒 Onest + JetBrains Mono, **signal-lime** accent (chroma ≤ 0.20), OKLCH, [globals.css](../../../src/app/globals.css) tokens, no hard-coded colors, `reveal-up` for the default flourish, **respects `prefers-reduced-motion`**. |
| **D-16** *(inherited)* | Celebration ownership | 🔒 Complementary with `team-trophy-shelf-01`'s in-place badge reveal (system §7.4). A host using both routes each event kind to exactly **one** path — set the shelf's `animateAward={false}` to let this component own `badge`/`milestone` moments, or don't push those kinds here. This component never triggers the shelf, and vice-versa. |
| **C1** | **Default animation primitive** | ▶︎ **Recommend:** token-driven CSS (`reveal-up` + a lime accent flourish) as the **default**, zero library; **opt-in `ConfettiBurst` (lazy)** for `milestone`/`badge`. Keeps the default bundle library-free and the constraint (< 1 s, skippable) trivially met. Confirm at plan. |
| **C2** | **Reduced-motion behavior** | ▶︎ **Recommend:** under `prefers-reduced-motion: reduce`, replace all movement with a **static, instantly-readable** appearance (no confetti, no slide) — still time-boxed, still skippable. This is a hard requirement, not a nicety (D-13). |
| **C3** | **Trigger mechanism — controlled prop vs imperative handle** | ▶︎ **Recommend: support BOTH.** Controlled `event` prop for declarative hosts; imperative `celebrate(event)` handle for event-driven hosts (a task-complete fires from a callback, not a render). Both feed the same single chokepoint in `Root`. **OPEN — flag for sign-off** (the system suggests recommending one in §5/§7; the recommendation is both, with the controlled prop as the documented-primary). |
| **C4** | **Does `onEvent` emit anything?** | ▶︎ **Recommend: accept `onEvent` for symmetry (D-07) but emit NOTHING required** — the [catalogue's telemetry table](../../systems/gamification-system/gamification-elements-catalogue.md) lists **no event for E6** (C9/C10 have no telemetry row). Do **not** invent one. **OPEN — flag for sign-off:** confirm "accept-but-silent," or drop `onEvent` from this component entirely. |
| **C5** | **Rapid-event retrigger policy** | ▶︎ **Recommend: newest wins (replace, don't stack).** A second event mid-celebration replaces the current one and restarts the < 1 s timer; overlays never stack. A short debounce/coalesce window is a plan-stage detail. Confirm at plan. |
| **C6** | **Nudge persistence** | ▶︎ **Recommend:** the nudge persists while `nextTask` is set (it's not time-boxed like the celebration — it's a standing, dismissible prompt), independent of the celebration's < 1 s lifecycle. Confirm at plan. |

---

## 8. Risks

- **Animation-blocking regression (the cardinal risk).** The whole point is non-blocking; a stray focus trap, a `pointer-events` scrim, or an over-long timer turns the celebration into the modal **D-10** forbids. Plan must specify: overlay uses `pointer-events: none` except the explicit skip target, never moves focus, and the timer is clamped < 1000 ms. GATE 3 verifies the board is fully usable *during* a celebration.
- **Reduced-motion correctness.** Confetti/burst under `prefers-reduced-motion` is an accessibility failure. The static variant must be a real, tested branch — not just "shorter animation." Plan locks the exact reduced-motion render.
- **Lazy-chunk flash.** `ConfettiBurst` is `React.lazy`; if the chunk loads after the celebration has already auto-dismissed (< 1 s), the burst flashes late or not at all. Plan must decide: preload-on-arm, or skip confetti if the chunk isn't ready (graceful degrade to the CSS flourish). The default-CSS path sidesteps this for non-confetti consumers.
- **Rapid retrigger / queueing.** Tasks completing in quick succession could stack overlays or restart timers chaotically. Locked policy (C5: newest-wins, no stack) must be implemented as a single chokepoint in `Root`; plan specifies the coalesce window.
- **SSR + timer determinism.** The auto-dismiss timer is client-only; no animation may run during SSR/first paint (would hydrate-mismatch). Same client-only-effect discipline the library already uses.
- **Individual-feedback leak.** Easy to accidentally write "You unlocked…" copy or pass a member name as the celebration subject. Plan + demo copy must be team-subject only; GATE 3 checks every string (system **D-08**).
- **Confetti dep portability.** Any burst lib must be registry-clean (no `next/*`), declared in `meta.ts` *and* `registry.json`, and genuinely lazy so the default consumer never pulls it. (Even though this component imports no *registry* component, a *third-party* burst dep still needs declaring.)
- **Two triggering paths (C3) staying coherent.** Supporting both controlled `event` and imperative `celebrate()` risks double-fires or desync. Plan funnels both into one internal "current event" reducer so behavior is identical regardless of entry point.

---

## 9. Success criteria

v1 ships when:

1. **A pushed `FeedbackEvent` renders the right flourish** — `milestone` / `badge` / `task-complete` each map to their celebration treatment (§4 table); `narrativeBeat` renders when present.
2. **The celebration is < 1 s, auto-dismissing, AND manually skippable** (click / tap / Esc) — the **D-10** ceiling is enforced in code (`celebrationDurationMs` clamped < 1000) and verified live.
3. **The celebration is NON-BLOCKING** — the underlying surface stays fully interactive during a celebration; no focus trap, no required click, no work-halting scrim. (Adversarially verified at GATE 3.)
4. **A `NextTaskSuggestion` renders a non-blocking nudge**; accept fires `onNextTask`, dismiss is penalty-free and silent.
5. **Reduced-motion variant works** — `prefers-reduced-motion: reduce` yields a static, instantly-readable, still-skippable appearance with no movement and no confetti.
6. **Rapid retrigger is sane** — newest event wins, overlays never stack, the timer restarts cleanly.
7. **Team-scoped, never individual** — every string and visual is team-subject; no per-member call-out, no inter-team/public surface (system **D-08**).
8. **Compound is real** — flat exports; celebration-only and nudge-only subsets each render (§6.2 / §6.3); the default (no-confetti) path keeps the burst lib out of the bundle; the demo includes a "lighter / composed" example.
9. **Telemetry contract honored** — `onEvent` is accepted for symmetry (D-07) but emits nothing required for E6 (Q4 resolved); no invented event.
10. **Portability** — no `next/*`, no `process.env`, SSR-safe, registry-import-clean; imports no other registry component (**D-03**).
11. **Design system** — signal-lime accent (chroma ≤ 0.20), Onest/JetBrains Mono, OKLCH tokens, `reveal-up` default flourish; every color maps to a token.
12. **Demo + (deferred) tests** — demo exercises all three event kinds, the nudge, reduced-motion, and rapid retrigger; the timer-clamp + retrigger reducer are unit-testable (Vitest informed-defer per house convention).

---

## 10. Design coverage checklist (what design must produce)

> Each box is a screen/state to define against the **ilinxa-ui-pro design system** ([`src/app/globals.css`](../../../src/app/globals.css)): **signal-lime** accent `oklch(0.80 0.20 132)` light / `oklch(0.86 0.18 132)` dark (always with near-black `--primary-foreground`), cool off-white `--background`, graphite-cool dark surfaces, **Onest** (sans) / **JetBrains Mono** (mono), one orchestrated `reveal-up` flourish. **Forbidden:** pure-white page backgrounds, modal-blocking celebration walls, neon-saturated lime (chroma ≤ 0.20), individual-subject copy, Inter/Roboto/Geist defaults.

**A. Celebration overlay (×3 event kinds)**
- [ ] `milestone` (largest, optional confetti, narrative line) · `badge` (badge-appearance, static-friendly) · `task-complete` (quietest, fast) — each with its entrance flourish, skip affordance, and auto-dismiss timing.

**B. Next-task nudge**
- [ ] Inline placement · corner placement · accept state · dismiss (penalty-free) · empty (no suggestion) · long-label truncation.

**C. Reduced-motion variant**
- [ ] Each celebration kind rendered with **zero movement** — static appearance, no confetti, still skippable, still time-boxed. (A required parallel design, not an afterthought.)

**D. States & timing**
- [ ] Default (CSS flourish, no library) · confetti-enabled · rapid-retrigger (newest-wins, no stacking) · skipped-early · celebration + nudge firing together · nudge-only · celebration-only.

**E. Tokens & motion**
- [ ] Map every color to a design token (accent burst, badge tint, nudge surface, skip control). The default flourish uses one orchestrated `reveal-up`; confirm the overlay never reads as a blocking dialog (no heavy scrim, no centered modal chrome).

**F. Responsive**
- [ ] Wide desktop · narrow / mobile (overlay + corner-nudge placement that doesn't cover primary actions).

---

## 11. Definition of "done" for THIS document (stage gate)

- [ ] §§0–10 drafted, reconciled to `ilinxa-ui-pro` + the `gamification-system` contract (paths, imports, design tokens, locked decisions D-03/D-05/D-06/D-08/D-10/D-13).
- [ ] Trigger data pinned to the host-supplied `FeedbackEvent` / `NextTaskSuggestion` shapes (§4); confirmed the component owns no milestone/badge/task state.
- [ ] Compound-structure declared with rough part inventory (§0) — per the mandatory rule; celebration + nudge are independently mountable; confetti is `React.lazy`.
- [ ] **D-10 made central** to scope (§2 non-goals), API (`celebrationDurationMs` clamp, no modal), and success criteria (§9.2/§9.3).
- [ ] Open questions flagged for sign-off: **C3** (trigger mechanism — recommend BOTH, controlled-primary), **C4** (no E6 telemetry event — recommend accept-`onEvent`-but-silent, or drop it), plus C1/C2/C5/C6 recommendations to confirm.
- [ ] **User sign-off pending** → on approval, proceed to Stage 2 (`team-feedback-loop-01-procomp-plan.md`, GATE 2).

After sign-off, changes to this doc are loud and intentional, not silent rewrites.
