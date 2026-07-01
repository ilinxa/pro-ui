# `team-feedback-loop-01` — Pro-component Plan (Stage 2 / GATE 2)

> **Stage 2 of 3 · Status: DRAFT — pending GATE 2 sign-off**
> **Slug:** `team-feedback-loop-01` · **Category:** `gamification` · **Tier:** pro-component · **Structure:** shadcn-style compound
> **Predecessor:** [`team-feedback-loop-01-procomp-description.md`](./team-feedback-loop-01-procomp-description.md) (GATE 1, signed off)
> **System:** element **E6** (SDT need **Competence**) of the [`gamification-system`](../../systems/gamification-system/gamification-system-description.md). Honors that contract's locked decisions — **D-03** (registry-independent), **D-05** (compound), **D-06** (prop-driven), **D-08** (cooperative + team-scoped), **D-10** (non-blocking — *the headline*), **D-13** (design system), **D-15** (team-prop convention), **D-16** (celebration ownership). Where this doc and the system contract disagree, **the system contract wins** — flag it back there.

This is the **how** — the contract the implementation must follow. Once signed off (**GATE 2**), `pnpm new:component gamification/team-feedback-loop-01` scaffolds the folder and code begins. Nothing here re-opens GATE-1 decisions; it operationalises them, resolves C1–C6 to locked defaults, and flags **C3** (both trigger paths) + **C4** (`onEvent` silent vs drop) for sign-off.

> **Reviewer focus:** the **non-blocking guarantee** (§6 — *the cardinal constraint, D-10*), the single-chokepoint event reducer that funnels both trigger paths (§5), the reduced-motion branch (§7), the retrigger/coalesce policy (§8), and the lazy-confetti boundary + its `meta.npm`/`registry.json` wiring (§3). These are where a celebration overlay goes wrong.

---

## 1. Summary of what we're building

A **host-triggered, non-blocking feedback layer** for a cooperative team surface: a **brief (< 1 s), skippable celebration overlay** when the host pushes a `FeedbackEvent` (`milestone` / `badge` / `task-complete`), followed independently by a **gentle next-task nudge** the team can accept or dismiss. It owns **no** milestone/badge/task state — the host triggers it, it renders the moment and gets out of the way. Ships as a **compound**: `TeamFeedbackLoopRoot` (headless — owns the single current-event reducer that both trigger paths funnel into, the < 1 s auto-dismiss timer, the reduced-motion read, the skip/dismiss handlers, the context) + flat parts (`TeamFeedbackCelebration` / `TeamFeedbackNudge`) + Tier-C primitives (`CelebrationOverlay` / `NextTaskNudge` / `ConfettiBurst` — the **`React.lazy`** heavy bit) + `TeamFeedbackLoop01` assembly. The **default flourish is token CSS `reveal-up`** (zero library); confetti is **opt-in + lazy** so the default consumer never pulls it.

---

## 2. Resolution of the GATE-1 open questions

| # | Question | Resolution (LOCKED unless flagged) |
|---|---|---|
| **C1** | Default animation primitive | 🔒 **Token-driven CSS `reveal-up` + a signal-lime accent flourish as the default, zero library.** Opt-in lazy `ConfettiBurst` for `milestone`/`badge` only (`enableConfetti`, default `false`). Keeps the default bundle library-free and the < 1 s / skippable constraint trivially met. |
| **C2** | Reduced-motion behavior | 🔒 **A real, separate render branch** — under `prefers-reduced-motion: reduce` the overlay is static, instantly-readable, **no movement, no confetti**, still time-boxed, still skippable. Not "shorter animation" — a distinct path (§7). |
| **C3** | Trigger mechanism | ▶︎ **Recommend: BOTH, controlled-primary.** Controlled `event?: FeedbackEvent \| null` is the documented-primary; imperative `celebrate(event)` / `dismiss()` via `ref` for event-driven hosts. **Both funnel into ONE internal reducer** (§5) so behavior is identical regardless of entry point. **OPEN — flag for GATE-2 sign-off.** |
| **C4** | Does `onEvent` emit anything? | ▶︎ **Recommend: accept `onEvent` for D-07 symmetry but emit NOTHING** — the catalogue lists no telemetry event for E6 (C9/C10 have no row). Do not invent one. **OPEN — flag for GATE-2 sign-off:** confirm "accept-but-silent," or drop `onEvent` from this component entirely. (If dropped, success-criterion §9.9 and the prop both vanish; trivial either way.) |
| **C5** | Rapid-event retrigger policy | 🔒 **Newest wins (replace, don't stack).** A second event mid-celebration replaces the current one and **restarts** the < 1 s timer through the single reducer chokepoint; overlays never stack. Coalesce window specified §8. |
| **C6** | Nudge persistence | 🔒 **The nudge persists while `nextTask` is set**, independent of the celebration's < 1 s lifecycle — it's a standing, dismissible prompt, not time-boxed. Dismiss is local (`dismissedTaskId`), re-armed when a *new* `taskId` arrives (§8). |

---

## 3. Dependencies

### 3.1 — shadcn primitives

| Primitive | In `src/components/ui/`? | Used by | Purpose |
|---|---|---|---|
| `button` | check at scaffold; `pnpm dlx shadcn@latest add button` if absent | `NextTaskNudge` (accept/dismiss), `CelebrationOverlay` (skip target) | the explicit skip target + the nudge accept/dismiss controls — the **only** pointer-interactive elements in the celebration layer (D-10) |

**No new high-divergence primitive** (no `toggle-group` / `tooltip` / `popover` / `context-menu`) → **no F-cross-13 Radix-vs-Base-UI smoke trap.** `button` is already exercised library-wide; we follow its proven usage. (The 4-ship smoke pattern still runs at GATE 3 because confetti is a *new npm dep* — see §3.3.)

### 3.2 — internal registry dependencies

**NONE (D-03).** This component imports **no** other registry component — not `team-trophy-shelf-01`, not `team-progress-bar-01`, not `todo-rich-card`. It re-declares the slice it needs (`FeedbackEvent` / `NextTaskSuggestion` / the `GamificationEvent` slice) in its **own `types.ts`** (system §4 — these E6 trigger shapes are *intentionally component-local*, deliberately NOT in the shared domain model). `registry.json` carries **no `registryDependencies`**. This is the cleanest possible install: a single self-contained `shadcn add`.

### 3.3 — npm: the lazy confetti burst (opt-in only)

- **One small confetti/burst lib**, pulled **only** when `enableConfetti` is set AND the kind is `milestone`/`badge`. Candidate: **`canvas-confetti`** (tiny, zero-dep, registry-clean — pure DOM/canvas, no `next/*`, no React coupling) wrapped by the Tier-C `ConfettiBurst`. *Alternative considered:* `react-confetti` (heavier, needs window-size; rejected). Final lib pinned at scaffold after a size/portability check; the contract is "a tiny canvas burst behind `React.lazy`."
- **`React.lazy` is mandatory and load-bearing:** `ConfettiBurst` is the **only** module that imports the lib value — `React.lazy(() => import("./parts/confetti-burst"))` (a same-folder default-export wrapper; the wrapper does the `import("canvas-confetti")`). The **default** (CSS `reveal-up`) path never touches it → the lib stays out of the default consumer's graph entirely (tree-shaking story §4.2).
- **Declared in BOTH `meta.ts` (`meta.npm`) AND `registry.json`** as a package dependency (`dependencies`, not `registryDependencies` — it's a third-party npm dep, not a registry item). **Even though it's lazy and opt-in, it must be declared** — a consumer who sets `enableConfetti` needs it installed (the cross-procomp lesson: "lazy/erased ≠ skip-the-dep", applied here to a *third-party* dep). `validate:meta-deps` must see it in `meta.ts` deps AND imported (by `confetti-burst.tsx`). ✅ by construction.
- **No date lib, no animation framework.** The default flourish is CSS keyframes (`reveal-up` from globals.css) + Web Animations-free transitions; the timer is `setTimeout`/`requestAnimationFrame`. Zero framer-motion.

---

## 4. Composition pattern — the compound (export surface)

Per [`.claude/rules/compound-component-structure.md`](../../../.claude/rules/compound-component-structure.md). **Flat exports, never a `TeamFeedbackLoop.Root` namespace** (system D-05). Each part module co-locates a **dumb Tier-C core** + a **thin Tier-B context wrapper** (the `media-library-01` one-file-two-exports pattern — zero duplication).

### 4.1 — Tier inventory (the GATE-2 enumeration the rule requires) — LOCK

| Export | Tier | Module | Reads context? | Role |
|---|---|---|---|---|
| `TeamFeedbackLoopRoot` | **B (provider)** | `parts/team-feedback-loop-root.tsx` | provides | Owns ALL state: the **single current-event reducer** that BOTH the controlled `event` prop AND the imperative `celebrate()`/`dismiss()` handle funnel into (C3); the **< 1 s auto-dismiss timer** (clamped, D-10); the **reduced-motion read**; the skip/dismiss handlers; the nudge `dismissedTaskId`; the `forwardRef` imperative handle; the `TeamFeedbackContext`. Renders `children`. **No layout opinion, holds NO milestone/badge/task data** — only "what to show right now." `"use client"`. |
| `TeamFeedbackCelebration` | **B** | `parts/team-feedback-celebration.tsx` | yes | Reads `useTeamFeedbackLoop()` → the current `FeedbackEvent` + reduced-motion + skip handler → renders the Tier-C `CelebrationOverlay` (and gates `ConfettiBurst` on `enableConfetti` + kind). No prop-drilling. |
| `TeamFeedbackNudge` | **B** | `parts/team-feedback-nudge.tsx` | yes | Reads context → the current `NextTaskSuggestion` (suppressed if dismissed) + placement → renders the Tier-C `NextTaskNudge`. Independent of the celebration lifecycle (C6). |
| `CelebrationOverlay` | **C** | `parts/celebration-overlay.tsx` | no | Dumb, prop-driven: `event` + `reducedMotion` + `onSkip` + optional `renderCelebration`. Renders title/detail/narrativeBeat + the CSS `reveal-up` flourish (or the static reduced-motion variant). **`pointer-events: none` on the wrapper; the skip target is the only `pointer-events: auto` element** (D-10, §6). |
| `NextTaskNudge` | **C** | `parts/next-task-nudge.tsx` | no | Dumb: `suggestion` + `placement` + `onAccept` + `onDismiss`. Inline or corner; **never modal**. Keyboard-operable (`button`s). |
| `ConfettiBurst` | **C (lazy host)** | `parts/confetti-burst.tsx` | no | The **`React.lazy`** heavy bit — the only module importing the confetti npm value. Fires a one-shot burst on mount; **inert under reduced-motion** (the celebration part never mounts it when `reducedMotion`). Default-exported so `React.lazy(() => import("./parts/confetti-burst"))` works. |
| `TeamFeedbackLoop01` | **A (assembly)** | `team-feedback-loop-01.tsx` | no (composes B parts) | `Root` + `TeamFeedbackCelebration` (gated `showCelebration`, default `true`) + `TeamFeedbackNudge` (gated `showNudge`, default `true`). **Contains NO logic the parts don't.** Demo + screenshot use this. `"use client"`. |
| `useTeamFeedbackLoop` | hook | `hooks/use-team-feedback-context.ts` | — | context consumer for hand-assembled layouts; throws if used outside `Root`. |

> **`forwardRef` placement (C3):** the imperative handle lives on `TeamFeedbackLoopRoot` (it owns the reducer). `TeamFeedbackLoop01` forwards its `ref` straight through to `Root` so both `<TeamFeedbackLoop01 ref>` and `<TeamFeedbackLoopRoot ref>` expose `celebrate`/`dismiss`.

### 4.2 — Tree-shaking story (must be real)

- Each part is its own module re-exported from `index.ts`. Dropping `TeamFeedbackNudge` drops the nudge code; dropping `TeamFeedbackCelebration` drops the overlay code (description §6.2/§6.3 subsets).
- The confetti npm value enters the graph **only** via `ConfettiBurst`'s `React.lazy`. The **default** path (CSS `reveal-up`, `enableConfetti` off) ⇒ the lib never loads. **Verified at GATE 3** by inspecting the built bundle / the lazy chunk boundary (the `media-library-01` / `gantt` lazy-proof convention).
- A nudge-only consumer (`showCelebration={false}` or mounting only `TeamFeedbackNudge`) pulls neither `CelebrationOverlay` nor the confetti chunk.

### 4.3 — Root holds context; assembly is logic-free

`TeamFeedbackLoopRoot` is the single source of state + the imperative handle + the reduced-motion/timer logic. `TeamFeedbackLoop01` is a fixed child tree with `show*` toggles and **zero** state of its own — a hand-assembled layout (description §6.2/§6.3) gets identical behavior. A reviewer rejects any logic that lives in the assembly but not the parts.

---

## 5. The event engine — single chokepoint reducer (C3 + C5 core)

The heart of the build. **Both trigger paths funnel into one reducer** so the two-path-desync risk (description §8) cannot occur.

### 5.1 — State + actions (`parts/team-feedback-loop-root.tsx`)

```ts
type FeedbackState = {
  current: FeedbackEvent | null;   // what the celebration shows right now; null = closed
  epoch: number;                   // bumped on every (re)open → re-arms the timer effect cleanly
  dismissedTaskId: string | null;  // nudge: which suggestion the team dismissed (C6)
};

type FeedbackAction =
  | { type: "open";    event: FeedbackEvent }     // controlled-prop change OR celebrate()
  | { type: "dismiss"; reason: "auto" | "skip" }  // timer fired OR skip click/tap/Esc OR dismiss()
  | { type: "nudge-dismiss"; taskId: string }     // nudge dismissed
  | { type: "nudge-rearm";   taskId: string };    // a new taskId arrived → clear dismissal
```

- **`open` always replaces + bumps `epoch`** → C5 "newest wins, never stack": there is only ever **one** `current`; a second event overwrites the first, and the bumped `epoch` re-arms the auto-dismiss timer (the effect keys on `epoch`, so the old timer is torn down and a fresh < 1 s timer starts). No overlay stacking is structurally possible — there's a single `current` slot.
- **`dismiss` fires `onCelebrationDismiss(event, reason)`** with the event being closed (captured before clearing) — `reason: "auto"` (timer) or `"skip"` (click/tap/Esc). Both controlled and imperative `dismiss()` route here.

### 5.2 — Funnelling both trigger paths into the reducer (C3)

1. **Controlled `event` prop** — an effect watches `event` identity. On a non-null change → `dispatch({ type: "open", event })`. On `event === null` while something is open → `dispatch({ type: "dismiss", reason: "auto" })` (host-driven close; no callback double-fire — see §5.4 controlled-echo).
2. **Imperative `celebrate(event)`** — the `useImperativeHandle` method dispatches `{ type: "open", event }` directly. `dismiss()` dispatches `{ type: "dismiss", reason: "skip" }`.

Both end at the **same `open`/`dismiss` actions** → identical behavior, identical timer, identical retrigger semantics. **This is the C3 guarantee.**

### 5.3 — The auto-dismiss timer (D-10 clamp, client-only)

- One effect, keyed on `[epoch]` (so each open arms exactly one timer; each new open tears the prior one down). When `current != null`: `const ms = clampDuration(celebrationDurationMs); const id = setTimeout(() => dispatch({type:"dismiss", reason:"auto"}), ms); return () => clearTimeout(id);`
- **`clampDuration`** (`lib/clamp.ts`, pure): `Math.min(Math.max(value ?? 800, 200), 999)` → **default ~800 ms, hard ceiling 999 ms (< 1000, D-10)**, floor 200 ms (a sub-200 ms flash is unreadable). Unit-testable.
- **Reduced-motion:** the timer still runs (the static variant is still time-boxed) — reduced-motion changes the *render*, not the lifecycle.
- **Client-only:** the timer effect only runs after mount; **no timer during SSR/first paint** (§ client-vs-server). The reduced-motion media query is also read in an effect (`mounted` flag) — see §5.4.

### 5.4 — SSR-safety + controlled-echo discipline

- **No animation/timer during SSR or first client paint.** `reducedMotion` is read via `matchMedia("(prefers-reduced-motion: reduce)")` in a client effect into state (default `false` server-side), so server and first client render match (the `rich-card`/`calendar` hydration-mismatch lesson). The overlay's `reveal-up` is a CSS class that only does anything once the element mounts client-side; nothing animates server-side.
- **Controlled-echo guard (calendar `use-calendar-edit` precedent):** when a controlled `event`-prop change drives the internal `open`, the component does **not** re-emit a callback that would round-trip into the host's `event` and re-open — the dismiss callback fires only on auto/skip/imperative-dismiss, never on a host-driven `event = null`. Single chokepoint = no double-fire.

---

## 6. D-10 NON-BLOCKING — the cardinal constraint

> This is the single most important section of the plan. Every other feature is subordinate to it. **The underlying board MUST stay fully interactive during a celebration** — this is adversarially verified at GATE 3 (success §9.3).

The implementation contract:

1. **`pointer-events: none` on the overlay wrapper.** The entire `CelebrationOverlay` container is `pointer-events: none` so clicks pass straight through to the board behind it. **The single exception** is the explicit skip target (a small `button` / dismiss affordance), which is `pointer-events: auto`. Nothing else in the overlay is clickable; there is no full-viewport interactive scrim.
2. **NEVER moves focus. No focus trap.** The overlay does **not** call `.focus()`, does **not** render a focus-trapping primitive (no Radix `Dialog`, no `react-focus-lock`), and does **not** restore focus on close. Focus stays exactly where the team left it on the board. The skip control is reachable by mouse/touch/Esc but the component never *forces* focus onto it.
3. **No work-halting scrim.** Any backdrop is **decorative only** — low-opacity, `pointer-events: none`, no blur that implies "blocked," and it is NOT a centered modal-chrome dialog (success §10.E "never reads as a blocking dialog"). The overlay positions as a corner/edge flourish or a light top band, not a screen-centered card the team must dismiss.
4. **Timer clamped < 1000 ms** (§5.3) — even if a consumer passes `celebrationDurationMs={5000}`, it is clamped to 999. The "modal that lingers" failure mode is impossible by construction.
5. **Skip = click/tap on the skip target, OR Esc.** Esc is a `keydown` listener on `document` (added in a client effect while `current != null`, removed on close) that dispatches `dismiss({reason:"skip"})` — it does **not** preventDefault other Esc behavior and does **not** trap; it's purely additive.
6. **`aria-live="polite"` (not `assertive`), `role="status"`** on the overlay so AT announces the celebration **without** stealing focus or interrupting — the non-blocking principle extended to assistive tech.

This section is mirrored into the API (`celebrationDurationMs` clamp, no modal prop exists), the risks (§11 cardinal risk), and the success criteria (§9.2/§9.3).

---

## 7. Reduced-motion — a real tested branch (C2)

Not "shorter animation" — a **distinct render path**.

- **Detection:** `matchMedia("(prefers-reduced-motion: reduce)")` read into state in a client effect (`mounted`-gated, SSR-safe §5.4), and the listener updates it live if the user toggles the OS setting mid-session.
- **When `reducedMotion === true`:**
  - `CelebrationOverlay` renders a **static** appearance — the badge/title/detail appear **instantly** at final position/opacity (no `reveal-up` translate, no fade-in transition, no movement).
  - **`ConfettiBurst` is never mounted** — `TeamFeedbackCelebration` gates it on `enableConfetti && !reducedMotion && kindAllowsConfetti`.
  - Still **time-boxed** (the §5.3 timer runs) and still **skippable** (skip target + Esc unchanged).
- **When `reducedMotion === false`:** the default `reveal-up` flourish (one orchestrated reveal, lime accent), optional lazy confetti for milestone/badge.
- **Tested explicitly at GATE 3** (success §9.5): emulate `prefers-reduced-motion: reduce`, confirm zero movement, no confetti chunk loads, still readable + skippable. Demo includes a reduced-motion toggle row (§ demo plan).

---

## 8. Retrigger (C5) + nudge persistence (C6)

### 8.1 — Retrigger: newest-wins, never stack (C5)

- Structurally guaranteed by the single `current` slot (§5.1): a new `open` overwrites `current` and bumps `epoch` → the timer effect re-arms cleanly (old `setTimeout` cleared, new one armed). **Overlays cannot stack** — there is one slot, not a queue.
- **Coalesce window:** to avoid jank from a burst of events firing within the same frame (e.g. three tasks completing on one batch update), the controlled-`event` effect compares incoming `event` identity and the imperative path coalesces synchronous calls within a **~50 ms leading-edge window** — the *first* event in a ≤50 ms cluster opens immediately (responsive), subsequent ones within the window replace `current` in place **without re-bumping `epoch`** (so a 3-event flurry shows the latest title but doesn't restart the < 1 s timer three times and visually flicker). A cluster gap > 50 ms is treated as a genuine new celebration (fresh `epoch`, fresh timer). The window is a small `lib/clamp.ts`-adjacent constant, documented in the guide; chosen leading-edge so the *first* beat is never delayed.
- *(Plan note: the coalesce window is a polish detail, not a correctness requirement — the single-slot reducer is already stack-proof without it. If review finds it over-engineered, the fallback is "every `open` bumps `epoch`" — slightly more flicker on rapid bursts, still no stacking.)*

### 8.2 — Nudge persistence (C6)

- The nudge is **independent of the celebration's < 1 s lifecycle**. It shows whenever `nextTask` is set AND `nextTask.taskId !== dismissedTaskId`.
- **Dismiss** (`onNudgeDismiss(suggestion)`) sets `dismissedTaskId = taskId` locally → the nudge hides; **no penalty, no nag** (D-08 never-forced).
- **Re-arm:** when `nextTask.taskId` changes to a *new* id, `dispatch({type:"nudge-rearm", taskId})` clears `dismissedTaskId` so the new suggestion shows. (Same `taskId` re-supplied after dismiss stays dismissed — the team said no to *that* task.)
- **Accept** (`onNextTask(suggestion)`) fires the callback; the component does **not** hide the nudge itself (the host typically navigates away / supplies a new `nextTask`), keeping it controlled/host-driven.

### 8.3 — Celebration + nudge together vs each alone

- **Together** (milestone → celebration *then* the standing nudge): both render; the celebration is the transient < 1 s overlay, the nudge persists beneath/beside it. They don't share state — the nudge is visible during AND after the celebration.
- **Celebration-only** (`showNudge={false}` / no `nextTask`): only the overlay; no nudge code path.
- **Nudge-only** (`showCelebration={false}` / mount only `TeamFeedbackNudge`): only the standing prompt; no overlay, no confetti.

---

## 9. Edge cases

| Case | Handling |
|---|---|
| `event` set then immediately `null` (host toggles fast) | `null` → `dismiss(auto)`; no callback double-fire (controlled-echo §5.4). |
| Rapid retrigger (burst of events) | Single-slot reducer + ~50 ms coalesce (§8.1); newest title wins, one timer, no stack, no flicker. |
| **Lazy confetti chunk loads after auto-dismiss** | **Preload-on-arm:** when an `open` for a confetti-eligible kind lands AND `enableConfetti`, kick the `import()` **at open time** (not at burst-render) so the chunk is usually ready within the < 1 s window. If the chunk still isn't ready when the celebration dismisses, **the burst is simply skipped** — the CSS `reveal-up` flourish already played, so there's a graceful, flash-free degrade (no late confetti flash after the overlay is gone). `<Suspense fallback={null}>` around the lazy burst guarantees no fallback flicker. |
| Confetti requested but `prefers-reduced-motion` | Confetti never mounts (§7); only the static appearance. |
| Celebration + nudge fire together | Both render independently (§8.3). |
| Nudge with no celebration / celebration with no nudge | Each subset renders standalone (§8.3 / compound §4.2). |
| **Long `nextTask.label`** | Nudge truncates to ~2 lines with `line-clamp` + `title` attr (full text on hover); the corner placement caps `max-width` so it never covers primary board actions. |
| Long celebration `title`/`detail` | Truncate gracefully (`line-clamp`); the overlay never grows into a screen-filling block (would read as modal — D-10). |
| `celebrationDurationMs` out of range (0, negative, 5000) | Clamped to [200, 999] (§5.3). |
| `renderCelebration` supplied | Custom node replaces the default overlay body **but the wrapper still enforces `pointer-events: none` + skip target + timer** — a consumer cannot accidentally make it blocking. Documented in the guide. |
| No `event` ever pushed | Nothing renders (overlay returns `null` when `current == null`); zero cost. |
| SSR / first paint | No animation, no timer, no confetti; static null/closed state until mount (§5.4). |
| OS reduced-motion toggled mid-session | `matchMedia` listener updates `reducedMotion` live (§7). |

---

## 10. Accessibility

- **Non-blocking is the a11y headline** (§6): no focus trap, no focus steal, `pointer-events: none` except skip, `role="status"` + `aria-live="polite"` so the celebration is *announced* without interrupting.
- **Skip** via click/tap on the skip `button` (labelled, e.g. `aria-label="Dismiss celebration"`) OR **Esc** (§6.5) — additive, non-trapping.
- **Nudge keyboard-operable:** accept + dismiss are real `button`s in DOM order, focusable, Enter/Space-activatable, with visible focus rings; the nudge region is `aria-label`led ("Suggested next task"). Dismiss is penalty-free (D-08).
- **Reduced-motion** honored (§7) — a hard a11y requirement, not a nicety (D-13).
- **Team-subject copy ONLY** (D-08, §5.3 system): every string is team-scoped ("Your team unlocked…"), **never** "you"/an individual name/a per-member call-out. Enforced in the demo copy, the dummy data, and verified string-by-string at GATE 3.
- **Color is not the only signal:** the celebration kind reads via icon + label, not just the lime accent; overdue/blocked aren't this component's concern (no status here — it's a celebration).

---

## 11. Final API (locked surface)

> **Implementation-alignment note (shipped v0.1.0, 2026-07-01):** two loud, intentional refinements landed vs the sketch below (recorded in the [decision file](../../../.claude/decisions/2026-07-01-team-feedback-loop-01-v0.1.0-first-ship.md) + [GATE 3 review](./reviews/2026-07-01-v0.1.0-spotcheck.md)): (1) the assembly props interface ships as **`TeamFeedbackLoop01Props`** (the library `<Name>01Props` convention + scaffolder output), factored over a shared **`TeamFeedbackLoopBaseProps`** — not the sketch name `TeamFeedbackLoopProps`. (2) `CelebrationOverlayProps` ships **without** `enableConfetti` (confetti gating moved up to the Tier-B `TeamFeedbackCelebration`, keeping the Tier-C overlay dumb) and **with** a `children?` slot (the confetti host) + `className?`. The `types.ts` in the shipped folder is the source of truth.

`types.ts` is **framework-free** (no `"use client"`; importable from a server component's type position). It re-declares the E6-local slice (D-03) — **no shared import**.

```ts
// ── Component-local domain slice (D-03; intentionally NOT in the shared model, system §4) ──
export interface FeedbackEvent {
  kind: "milestone" | "badge" | "task-complete";
  title: string;            // team-scoped copy ("Your team…"); never individual
  detail?: string;
  narrativeBeat?: string;   // optional progression-loop chapter line (E5 overlap)
}
export interface NextTaskSuggestion {
  taskId: string;           // opaque; returned on accept
  label: string;
}

// Telemetry slice (D-07 symmetry; this component emits NOTHING — C4). Host-typed envelope.
export type GamificationEvent = { type: string; teamId: string; [k: string]: unknown };

// ── Props (assembly) ──
export interface TeamFeedbackLoopProps {
  /** Team identity for team-scoped copy + (if wired) telemetry envelope. Identity-only (D-15). */
  teamId: string;

  // Celebration — controlled trigger (primary, C3)
  event?: FeedbackEvent | null;          // set → (re)open; null → close
  celebrationDurationMs?: number;        // clamped [200, 999); default ~800 (D-10)
  enableConfetti?: boolean;              // default false; lazy, milestone/badge only
  renderCelebration?: (event: FeedbackEvent) => React.ReactNode;  // body override; wrapper stays non-blocking
  onCelebrationDismiss?: (event: FeedbackEvent, reason: "auto" | "skip") => void;

  // Next-task nudge
  nextTask?: NextTaskSuggestion;
  onNextTask?: (suggestion: NextTaskSuggestion) => void;
  onNudgeDismiss?: (suggestion: NextTaskSuggestion) => void;
  nudgePlacement?: "inline" | "corner";  // default "inline"; NEVER modal

  // Assembly toggles (compound)
  showCelebration?: boolean;             // default true
  showNudge?: boolean;                   // default true

  // Telemetry (D-07) — accepted for symmetry, emits nothing for E6 (C4 — flag)
  onEvent?: (e: GamificationEvent) => void;

  className?: string;
  "aria-label"?: string;
}

// Root props = assembly props minus the show* toggles, plus children.
export interface TeamFeedbackLoopRootProps
  extends Omit<TeamFeedbackLoopProps, "showCelebration" | "showNudge"> {
  children: React.ReactNode;
}

// Imperative handle (C3 — both, controlled-primary). On Root; forwarded by the assembly.
export interface TeamFeedbackLoopHandle {
  celebrate(event: FeedbackEvent): void;  // → reducer "open"
  dismiss(): void;                        // → reducer "dismiss" (reason "skip")
}

// Tier-C primitive prop types (also exported)
export interface CelebrationOverlayProps {
  event: FeedbackEvent;
  reducedMotion: boolean;
  onSkip: () => void;
  enableConfetti?: boolean;
  render?: (event: FeedbackEvent) => React.ReactNode;
}
export interface NextTaskNudgeProps {
  suggestion: NextTaskSuggestion;
  placement?: "inline" | "corner";
  onAccept: (s: NextTaskSuggestion) => void;
  onDismiss: (s: NextTaskSuggestion) => void;
}
```

- **Generics:** none. `FeedbackEvent`/`NextTaskSuggestion` are fixed shapes (host pre-renders strings) — no `<T>`.
- **Defaults (LOCK):** `celebrationDurationMs ≈ 800` (clamp [200,999)), `enableConfetti=false`, `nudgePlacement="inline"`, `showCelebration=true`, `showNudge=true`.
- **Surface budget:** ~14 feature concepts (excl. `className`/`aria-label`) — comfortably under the ~25 ceiling. ✅
- **C4 note:** if sign-off says **drop `onEvent`**, remove the prop + the `GamificationEvent` type + success §9.9; nothing else changes (it's accept-but-silent today).

---

## 12. File-by-file plan

Sealed folder under `src/registry/components/gamification/team-feedback-loop-01/` (compound layout; `parts/` co-locates Tier-B wrappers + Tier-C cores):

| File | Contents |
|---|---|
| `team-feedback-loop-01.tsx` | **Tier A** `TeamFeedbackLoop01` assembly — `"use client"`; `forwardRef` → `Root`; `TeamFeedbackCelebration` (gated `showCelebration`) + `TeamFeedbackNudge` (gated `showNudge`). No logic the parts don't have. |
| `index.ts` | Barrel — flat exports: `TeamFeedbackLoop01`, `TeamFeedbackLoopRoot`, `TeamFeedbackCelebration`, `TeamFeedbackNudge`, `CelebrationOverlay`, `NextTaskNudge`, `ConfettiBurst`, `useTeamFeedbackLoop`, + all public types. **No re-export from another registry component** (D-03). |
| `types.ts` | Framework-free. `FeedbackEvent`, `NextTaskSuggestion`, `GamificationEvent`, `TeamFeedbackLoopProps`, `TeamFeedbackLoopRootProps`, `TeamFeedbackLoopHandle`, `CelebrationOverlayProps`, `NextTaskNudgeProps`, context value type. |
| `parts/team-feedback-loop-root.tsx` | **Tier B** provider — `"use client"`; the `useReducer` chokepoint (§5), controlled-`event` effect, `celebrate`/`dismiss` `useImperativeHandle`, < 1 s timer effect (keyed on `epoch`), reduced-motion `matchMedia` read, Esc listener, nudge dismiss/re-arm, `TeamFeedbackContext.Provider`. |
| `parts/team-feedback-celebration.tsx` | **Tier B** `TeamFeedbackCelebration` — reads context, renders `CelebrationOverlay`, gates `ConfettiBurst` on `enableConfetti && !reducedMotion && kind∈{milestone,badge}`; preloads the lazy chunk on arm (§9). |
| `parts/team-feedback-nudge.tsx` | **Tier B** `TeamFeedbackNudge` — reads context, renders `NextTaskNudge` (suppressed when dismissed); placement passthrough. |
| `parts/celebration-overlay.tsx` | **Tier C** `CelebrationOverlay` — dumb; `pointer-events:none` wrapper + skip target; default `reveal-up` flourish vs static reduced-motion branch; `role="status"`/`aria-live="polite"`; `render` override slot. |
| `parts/next-task-nudge.tsx` | **Tier C** `NextTaskNudge` — dumb; inline/corner; `button` accept/dismiss; line-clamp + title for long labels; never modal. |
| `parts/confetti-burst.tsx` | **Tier C (lazy)** `ConfettiBurst` — `"use client"`; **default export**; the ONLY module importing the confetti npm value; one-shot burst on mount; inert under reduced-motion (never mounted there). |
| `hooks/use-team-feedback-context.ts` | `TeamFeedbackContext` + `useTeamFeedbackLoop()` (throws outside Root). |
| `lib/clamp.ts` | Pure `clampDuration(ms?)` → `[200, 999)`; the coalesce-window constant. Framework-free, unit-testable. |
| `dummy-data.ts` | Fixtures: a `FeedbackEvent` per kind (milestone w/ narrativeBeat, badge, task-complete) + a `NextTaskSuggestion` + a long-label suggestion + a long-title event. **All copy team-scoped, never individual** (D-08). **Fixtures registry item.** |
| `demo.tsx` | Docs demo (`"use client"`) — tabs: **Event kinds** (fire milestone/badge/task-complete buttons → see each flourish), **Confetti** (toggle `enableConfetti`), **Reduced motion** (toggle to preview the static branch), **Retrigger** (rapid-fire button → proves newest-wins/no-stack), **Nudge** (inline vs corner, accept/dismiss, long label), **Composed / lighter** (hand-assembled `Root` + only `TeamFeedbackNudge` — proves the compound subset + confetti-never-loads). Uses imperative `celebrate()` for the fire buttons. |
| `usage.tsx` | Consumer usage notes (React component; MDX not wired). |
| `meta.ts` | Full `ComponentMeta`; `meta.npm` includes the confetti lib + `button`; **no `registryDependencies`** (D-03); today's date at scaffold. |

**Out of the shipped registry** (docs-site only, per convention): `demo.tsx`, `usage.tsx`, `meta.ts`.

---

## 13. Client vs server

**`"use client"` on every module that holds state, refs, effects, gestures, or the timer** — `team-feedback-loop-01.tsx`, all `parts/*`, the hook. Pure `lib/clamp.ts` and `types.ts` are **framework-free, no directive** (importable from a server component's type position).

Justification: `useReducer`, `useImperativeHandle`, the `setTimeout` auto-dismiss timer, the `matchMedia` reduced-motion read, the `document` Esc listener, and `React.lazy` confetti all require the client. The component still server-renders (client components SSR + hydrate in Next 16); **SSR determinism** is preserved by: (a) `current` starts `null` server-side → overlay renders nothing on first paint; (b) `reducedMotion` defaults `false` server-side, read into state in a client effect → server and first client render match (the `rich-card`/`calendar` hydration-mismatch lesson — never `matchMedia`/`Date.now()`/timers during render); (c) the timer + confetti only arm in client effects. **No animation runs during SSR or first paint.**

---

## 14. D-16 celebration ownership (coordination — documentation contract)

This component **never triggers `team-trophy-shelf-01`** and the shelf never triggers this — neither imports the other (D-03). The **host** routes each event kind to exactly **one** celebrator:

- To let *this* component own a `badge`/`milestone` moment: the host sets the shelf's `animateAward={false}` and pushes the event here.
- To let the *shelf* own it (in-place badge reveal): the host does NOT push that kind here (or mounts this with `showCelebration={false}`).

This is a **host-wiring contract**, documented in the guide + demo notes; this plan introduces **no code** that reaches the shelf. GATE 3 verifies the plan/guide state the contract and that no shelf import exists.

---

## 15. registry.json shipping plan

Per [`docs/component-guide.md §11.5`](../../component-guide.md#115-shipping-via-the-registry) + the `shadcn-registry-pro` skill. Two items:

- **Base item `team-feedback-loop-01`** — `type: "registry:component"`; files = the sealed-folder source **minus** `demo.tsx` / `usage.tsx` / `meta.ts`: `team-feedback-loop-01.tsx`, `index.ts`, `types.ts`, `parts/*` (root, celebration, nudge, celebration-overlay, next-task-nudge, confetti-burst), `hooks/use-team-feedback-context.ts`, `lib/clamp.ts`. **Locked target convention:** every file `target: "components/team-feedback-loop-01/<sub-path>"`. **`registryDependencies: []`** (D-03 — none). **`dependencies`** = the confetti npm lib + (if not assumed) `button`'s shadcn registry dep handled via the standard shadcn primitive mechanism.
- **Fixtures item `team-feedback-loop-01-fixtures`** — depends on the base; adds only `dummy-data.ts` at `target: "components/team-feedback-loop-01/dummy-data.ts"`.

**Never ship `demo.tsx`, `usage.tsx`, `meta.ts`.** `pnpm registry:build` regenerates `public/r/team-feedback-loop-01.json` + `…-fixtures.json`; spot-check both (targets correct, no docs-only files, confetti dep present, **no** `registryDependencies`).

---

## 16. Risks & alternatives

Carried from description §8 (all still apply); plan-stage resolution:

- **🚫 Animation-blocking regression (THE cardinal risk).** A stray focus trap / `pointer-events` scrim / over-long timer turns the celebration into the modal D-10 forbids. **Mitigation (§6):** `pointer-events:none` except the skip target; never `.focus()`; no focus-lock primitive; clamp < 1000 ms by construction; `renderCelebration` cannot override the non-blocking wrapper. **GATE 3 adversarially verifies the board is fully usable *during* a celebration** (click-through, no focus steal, no Esc-trap). Made central to API + §6 + success §9.3.
- **⚠️ Reduced-motion correctness.** Confetti/movement under `prefers-reduced-motion` is an a11y failure. **Mitigation (§7):** a distinct static branch (not "shorter"); confetti never mounts; tested as its own GATE-3 case.
- **⚠️ Lazy-chunk flash.** Confetti chunk could load after the < 1 s auto-dismiss → late/no flash. **Mitigation (§9):** preload-on-arm; `<Suspense fallback={null}>`; skip the burst (not flash) if not ready — the CSS flourish already played, so graceful degrade. Default-CSS consumers sidestep entirely.
- **⚠️ Two-trigger-path desync (C3).** Controlled `event` + imperative `celebrate()` could double-fire/desync. **Mitigation (§5):** both funnel into ONE reducer (`open`/`dismiss`); single `current` slot; controlled-echo guard. Identical behavior by construction.
- **⚠️ Individual-feedback leak (D-08).** Easy to write "You unlocked…" or pass a member name. **Mitigation:** team-subject-only copy in dummy-data + demo + guide; GATE 3 checks every string.
- **🔸 Confetti dep portability.** Must be registry-clean (no `next/*`), declared in `meta.npm` + `registry.json`, genuinely lazy. **Mitigation (§3.3):** `canvas-confetti`-class lib (pure canvas, zero React coupling), behind `React.lazy`, declared in both manifests; new-npm-dep ⇒ the 4-ship GATE-3 smoke pattern runs (install → consumer-tsc clean).
- **🔸 Rapid-retrigger jank.** **Mitigation (§8.1):** single-slot reducer (stack-proof) + ~50 ms leading-edge coalesce; fallback "always bump epoch" if coalesce is judged over-engineered.
- **🔸 SSR timer/animation nondeterminism.** **Mitigation (§13/§5.4):** client-only timer + `matchMedia`; `current` null + `reducedMotion` false server-side.

**Alternatives considered:** (1) imperative-only trigger — rejected, declarative hosts want a controlled prop (C3 = both). (2) A queue with playback of missed celebrations — rejected (description out-of-scope; we render the current moment, single slot). (3) `react-confetti` — rejected (heavier, window-size coupling) in favor of a `canvas-confetti`-class lib. (4) framer-motion for the flourish — rejected (CSS `reveal-up` is lighter + already the house pattern; no dep). (5) A `loading`/modal prop — N/A (this is a transient overlay, not a data surface).

---

## 17. Verification plan (pre-GATE-3)

1. `pnpm tsc --noEmit` clean · `pnpm lint` clean · `pnpm validate:meta-deps` clean (confetti lib declared in `meta.ts` deps AND imported by `confetti-burst.tsx`; `button` declared). **meta-deps gotchas:** in any file with side-effect imports, place the dep-declaring `from`-import FIRST; never reference a dep name only inside a comment (blackboard-01 + content-composer-01 lessons).
2. `pnpm build` succeeds.
3. Docs render at `/components/team-feedback-loop-01`; all demo tabs interactive.
4. `pnpm registry:build`; spot-check `public/r/team-feedback-loop-01.json` + `…-fixtures.json` (targets `components/team-feedback-loop-01/<sub>`; no demo/usage/meta; confetti in `dependencies`; **`registryDependencies` empty**).
5. **Compound proof:** the demo's "Composed / lighter" tab renders a hand-assembled subset (Root + nudge only); bundle inspection confirms the confetti value is behind the lazy boundary (default path never loads it).
6. **D-10 adversarial check (the headline):** during an active celebration — click a board control behind the overlay (registers), confirm focus did not move, confirm Esc dismisses without trapping, confirm the timer never exceeds 999 ms even with `celebrationDurationMs={5000}`.
7. **Reduced-motion case:** emulate `prefers-reduced-motion: reduce` → static appearance, zero movement, no confetti chunk loads, still skippable.
8. **Retrigger case:** rapid-fire events → newest title wins, no overlay stacking, single timer.
9. **New-npm-dep smoke (4-ship pattern):** `pnpm dlx shadcn add @ilinxa/team-feedback-loop-01` in a tmp consumer → `pnpm tsc --noEmit` clean post-install; verify the confetti dep installs and the default (no-confetti) path doesn't pull it.
10. **Clamp + reducer unit tests (Vitest — informed-defer per house convention; `lib/clamp.ts` + the reducer written test-ready):** clamp bounds [200,999); `open` replaces (never stacks); `dismiss` reason plumbing; nudge re-arm on new taskId.
11. GATE 3: `docs/reviews/templates/review-spotcheck.md`, 5 dims, **rotating dim = Accessibility** (the non-blocking + reduced-motion + team-subject surface is the risk) — *or* Robustness (retrigger/lazy-chunk); pick at review.

---

## 18. Definition of "done" for THIS document (stage gate)

- [ ] Final API locked (§11); compound export surface enumerated (§4.1); tree-shaking + Root-holds-context stated (§4.2/4.3).
- [ ] Event engine specified — single-chokepoint reducer funnelling both trigger paths (§5); D-10 non-blocking contract central (§6); reduced-motion branch (§7); retrigger + nudge persistence (§8).
- [ ] File-by-file plan (§12) mirrors the sealed-folder + compound house pattern.
- [ ] Dependencies + lazy-confetti `meta.npm`/`registry.json` wiring locked (§3); **no internal registry deps** (D-03).
- [ ] Client/server, edge cases, a11y, D-16 coordination, registry shipping, risks, verification all covered.
- [ ] C1/C2/C5/C6 resolved to locked defaults (§2); **C3** (both trigger paths, controlled-primary) + **C4** (`onEvent` accept-but-silent vs drop) flagged for GATE-2 sign-off.
- [ ] **User sign-off pending** → on approval, `pnpm new:component gamification/team-feedback-loop-01` (after the D-01 `gamification` category plumbing) + implementation begins.

After sign-off, deviations from this plan are loud and intentional, not silent.
