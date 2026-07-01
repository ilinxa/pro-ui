---
date: 2026-07-01
session: gamification-system implementation (component 3 of 6)
phase: implementation
type: first-ship
commits: []   # built + gated; uncommitted on master at write time
components:
  - team-feedback-loop-01
findings: "GATE 3 Pass-with-follow-ups (rotating dim Accessibility/non-blocking). F-01 post-deploy 4-ship smoke RAN + CAUGHT a real gap (consumer TS7016: canvas-confetti ships no types, artifact shipped only `dependencies:[canvas-confetti,lucide-react]`) → fixed in v0.1.1 (added `@types/canvas-confetti` to the registry item's devDependencies; re-smoke: consumer tsc 0). F-02 live D-10 non-blocking walkthrough owed (Low). F-03 rapid-burst coalesce deferred to v0.2 (Low). D-10 non-blocking enforced structurally; confetti lazy chunk proven isolated (10.6KB); reduced-motion via useSyncExternalStore."
status: shipped
---

# team-feedback-loop-01 v0.1.0 — 3rd gamification component (new confetti dep)

## What

The **third** component of the [`gamification-system`](../../docs/systems/gamification-system/gamification-system-description.md) — the 60th pro-component and the pack's **first genuinely-new npm dep** (`canvas-confetti`). **E6 (Competence):** a host-triggered, **NON-BLOCKING** cooperative feedback layer — a brief (< 1s), skippable celebration overlay (`milestone`/`badge`/`task-complete`) + a gentle, dismissible next-task nudge. Owns no state. Built per its signed-off [description](../../docs/procomps/team-feedback-loop-01-procomp/team-feedback-loop-01-procomp-description.md) (GATE 1) + [plan](../../docs/procomps/team-feedback-loop-01-procomp/team-feedback-loop-01-procomp-plan.md) (GATE 2), with C3 (both trigger paths, controlled-primary) + C4 (`onEvent` accept-but-silent) taken per the handoff.

## How it was built (matches the plan's compound)

Full shadcn-compound (plan §4.1): pure `lib/clamp.ts` + headless `TeamFeedbackLoopRoot` (the single-chokepoint `useReducer` both trigger paths funnel into, the clamped auto-dismiss timer, the reduced-motion read, the Esc listener, the `forwardRef` imperative handle) + flat `TeamFeedbackCelebration` / `TeamFeedbackNudge` + Tier-C `CelebrationOverlay` / `NextTaskNudge` / **`React.lazy` `ConfettiBurst`** (the only module importing `canvas-confetti`) + the `TeamFeedbackLoop01` assembly. Deps: `button` (already-shipped) + lucide + `canvas-confetti`; zero `@ilinxa/*` (D-03).

## Key decisions / deviations (loud, not silent)

- **D-10 non-blocking enforced structurally** (the cardinal constraint): the `CelebrationOverlay` wrapper AND card are `pointer-events:none`; the **only** `pointer-events:auto` element is the skip `<button>`. No `.focus()` call, no focus-lock, no work-halting scrim; a bottom-edge band, not a centered modal. `role="status"` + `aria-live="polite"`. Esc is an additive `document` keydown (no preventDefault/trap). The timer is **clamped `[200, 999)`** so a `celebrationDurationMs={5000}` can't linger — the "modal that lingers" failure mode is impossible by construction.
- **Two trigger paths → one reducer.** The controlled `event` effect and the imperative `celebrate()` handle both dispatch the same `open`/`close` actions. A single `current` slot → overlays cannot stack (newest wins, C5). Skip vs auto-dismiss never double-fire `onCelebrationDismiss` (skip clears the pending timer); host-driven `event=null` closes **silently** (controlled-echo).
- **Reduced-motion via `useSyncExternalStore`, not `matchMedia`-into-state-in-effect.** The plan §5.4/§7 specced reading `matchMedia` into state in a client effect — but `setState` synchronously in an effect trips the repo's `set-state-in-effect` lint rule. `useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot→false)` is the idiomatic, SSR-safe, reactive-to-OS-toggle tool with no setState. (Second component this session where the same repo lint rule pushed a better pattern than the plan's literal approach — cf. trophy-shelf's setState-during-render.)
- **Confetti lazy boundary proven.** `canvas-confetti` (default-exported wrapper) is pulled only via `React.lazy(() => import("./confetti-burst"))`, preloaded at open time. The built output confirms a dedicated **10.6KB chunk** with **0** overlay/reducer markers — the default CSS flourish + `enableConfetti={false}` never load it. Confetti colors are raw lime-forward hexes (a canvas needs raw color; documented exception to the no-hardcoded-color rule for decorative particles).
- **Coalesce window (§8.1) — used the plan's sanctioned fallback** ("every `open` bumps `epoch`") over the ~50ms leading-edge coalesce. Still stack-proof; rapid bursts restart the timer per event → v0.2 polish if flicker appears.
- **`onEvent` accept-but-silent (C4)** — the prop exists in the type for D-07 symmetry; the Root doesn't read it (E6 has no telemetry event). No invented event.
- **`CelebrationOverlayProps` gained a `children` slot** (the confetti host) beyond the plan's prop list; assembly props type named `TeamFeedbackLoop01Props`.

## Verification

`tsc` 0 · ESLint (folder) 0 (four `exhaustive-deps` warnings on `state.current` member-access in deps were resolved by destructuring reducer state to locals) · `validate:meta-deps` 60/60 · `pnpm build` 60 component pages (no SSR error) · `registry:build` ✓. Artifact: 11 files, 0 forbidden, `registryDependencies: ["button"]`, `dependencies: ["canvas-confetti","lucide-react"]`; fixtures resolve the base. `canvas-confetti ^1.9.4` + `@types/canvas-confetti ^1.9.0` added to package.json.

## Follow-ups

| # | Sev | Item | Target |
|---|---|---|---|
| F-01 | 🔸 Med | ✅ **CLOSED (v0.1.1)** — 4-ship smoke ran, caught the missing-types gap, fixed + re-smoked clean (see below) | v0.1.1 |
| F-02 | 🔹 Low | live D-10 non-blocking + reduced-motion + confetti walkthrough | v0.1.x post-deploy |
| F-03 | 🔹 Low | leading-edge coalesce for rapid bursts | v0.2.0 |

## v0.1.1 — F-01 4-ship smoke: caught + fixed the `canvas-confetti` types gap

The 4-ship pattern ran exactly as intended, against the **base-nova / Base UI** consumer (`e:/tmp/ilinxa-smoke-consumer`) pulling from the **live production** registry:

- **Ship (v0.1.0):** `pnpm dlx shadcn add @ilinxa/team-feedback-loop-01 …` created 37 files; `canvas-confetti ^1.9.4` landed in the consumer's `dependencies` (from the item's `dependencies`).
- **Smoke — CAUGHT:** consumer `tsc --noEmit` → **exactly 1 error**: `confetti-burst.tsx(7,22): error TS7016: Could not find a declaration file for module 'canvas-confetti'`. Root cause: `canvas-confetti` ships **no bundled types**, `confetti-burst.tsx` does a bare `import confetti from "canvas-confetti"` (no `@ts-ignore`/shim), and the registry item declared only `dependencies:["canvas-confetti","lucide-react"]` — so the consumer never got `@types/canvas-confetti`. **Producer tsc passed because the producer has `@types/canvas-confetti` in its own devDeps** — the exact class of gap only a cross-consumer smoke surfaces. (Progress-bar + trophy-shelf: **0 errors** — clean.)
- **Patch (v0.1.1):** added `"devDependencies": ["@types/canvas-confetti"]` to the `team-feedback-loop-01` registry item (shadcn v4 installs a registry item's `devDependencies` into the consumer's devDeps — schema-confirmed via the `shadcn-registry-pro` skill). Bumped `meta.version` → `0.1.1`; `registry:build` regenerated the artifact (`devDependencies:["@types/canvas-confetti"]` present).
- **Re-smoke — CLEAN:** local-registry re-add (served `public/r` on `localhost:5055`, `shadcn add http://localhost:5055/team-feedback-loop-01.json --overwrite`) installed `@types/canvas-confetti ^1.9.0` into the consumer's **devDependencies**, and consumer `tsc --noEmit` → **0 errors**. Mechanism proven pre-deploy; production redeploy carries the identical artifact bytes.

**Lesson (reusable):** a genuinely-new npm dep that ships **no bundled types** needs its `@types/*` in the **registry item's `devDependencies`**, not only in the producer's `package.json`. Producer tsc is blind to this — it has the `@types` locally. This is the types-analogue of the content-composer/task-family "meta `internal:[]` ≠ registry.json `registryDependencies`" lesson: *the producer compiling clean ≠ the consumer compiling clean; only the cross-consumer smoke closes the gap.* First `@types/*` package the library has shipped.

## Resume

**Done:** committed + pushed (v0.1.0 pack + v0.1.1 fix); F-01 CLOSED. **Next: component 4 `cooperative-challenge-01`** (E3 Relatedness) per its plan (build order = system §10). After it, the deferred shared `gamification-kit` (D-04) is worth revisiting — 3 components now share the resolve/diff/clamp + event-factory shape.
