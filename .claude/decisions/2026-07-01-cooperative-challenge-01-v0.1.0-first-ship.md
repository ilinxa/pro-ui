---
date: 2026-07-01
session: gamification-system implementation (component 4 of 6)
phase: implementation
type: first-ship
commits: []   # built + gated; committed on ship
components:
  - cooperative-challenge-01
findings: "GATE 3 Pass-with-follow-ups (rotating dim Copy / never-forced framing). F-01 post-deploy smoke RAN + CAUGHT a real Base UI divergence (Radix-only `getValueLabel` on `Progress` → consumer TS2322) → fixed in v0.1.1 (drop getValueLabel/max, carry the count via aria-label — the sibling's proven cross-backend pattern); re-smoke consumer tsc 0. F-02 live never-forced walkthrough owed (Low). F-03 superseded by the v0.1.1 fix. Never-forced enforced literally; collective progress only; whole-team reward; done = inline ack not celebration (E6 seam clean)."
status: shipped
---

# cooperative-challenge-01 v0.1.0 — 4th gamification component (E3 Relatedness)

## What

The **fourth** component of the [`gamification-system`](../../docs/systems/gamification-system/gamification-system-description.md) — the 61st pro-component. **E3 (Relatedness):** a safe-by-design cooperative team challenge card — one shared goal, a **collective** progress meter, a **whole-team** reward, and a **penalty-free** opt-in where opted-out is a neutral, first-class "joinable" state. Built per its signed-off [description](../../docs/procomps/cooperative-challenge-01-procomp/cooperative-challenge-01-procomp-description.md) (GATE 1) + [plan](../../docs/procomps/cooperative-challenge-01-procomp/cooperative-challenge-01-procomp-plan.md) (GATE 2), decisions D-C1…D-C6 locked to their plan defaults.

## How it was built (matches the plan's light compound)

Light shadcn-compound (plan §4.1), **no `React.lazy`** (no heavy dep), **no npm** beyond `lucide-react`, **no internal registry dep** (D-03). Pure `lib/derive.ts` (SSR-deterministic derivations + centralized never-forced copy defaults) + `lib/events.ts` (2-event factory) + headless `CooperativeChallengeRoot` (controlled-echo + telemetry chokepoint) + flat context parts (`Header`, `Progress`, `Reward`, `OptIn`) + standalone Tier-C primitives (`ChallengeProgressMeter`, `ChallengeRewardChip`, `OptInToggle`, `TeamMemberStack`, `CooperativeChallengeSkeleton`) + the `CooperativeChallenge01` assembly. Deps: shadcn `progress`/`avatar`/`button`/`badge`/`skeleton` + `lucide-react`; own `types.ts` slice.

## Key decisions / deviations (loud, not silent)

- **Never-forced made literal (the load-bearing rule, system §5.2).** Opted-out (`isJoinable`) renders full-opacity `--card`/`--border` (never `--destructive`/dimmed), an "Optional" badge, a *prominent* signal-lime "Join this challenge" primary, and a visible `noPenaltyHint`. Leaving (`isActive`) is a plain `outline` button — one click, no confirm, no guilt copy. There is **no** `required`/`locked`/`mandatory` surface in the type system.
- **Opt-in button-toggle, not `switch` (plan §3.1).** A labelled action reads never-forced far better than a switch thumb (which implies a "correct" default). `aria-pressed` conveys state; the visible text carries the `joinLabel`/`leaveLabel` copy.
- **Collective progress only (D-C2).** One bar + one `current / target` count (mono); `TeamMemberStack` is identity-only (no per-avatar state). No per-member surface exists in the type — a per-member breakdown would need a researcher check (catalogue Hard Guardrails).
- **Whole-team reward (D-08).** `ChallengeRewardChip` copy is *"The team earns/earned:"* — never first-person; no per-member reward field.
- **Done = lightweight inline ack (D-C4), E6 seam clean.** `isComplete` → a "Completed together" pill (glyph+text, `.reveal-up` reduced-motion-safe, `aria-live="polite"` on the pill only → announced once). The heavy celebration is `team-feedback-loop-01` (E6) — **not imported/invoked here**; the host wires it alongside.
- **Controlled-only opt-in (D-C6).** `challenge.optedIn` is the value; the Root holds no local opt-in state (controlled-echo). Omitting `onOptInChange` hides the control (read-only card falls out — capability-gating).
- **Telemetry chokepoint.** `challenge.opened` fires once from a client effect, keyed on `challenge.id` via a `firedRef` (StrictMode-safe, re-fires only on a new challenge); `challenge.opt-in` on toggle. `onEvent`/`onOptInChange` read through refs so inline handlers don't re-subscribe.
- **Deviations (documented in the GATE 3 review):** (1) meter `aria-valuenow` is the pct (the shadcn `progress` wrapper fills from a 0–100 `value`); "3 of 5" is delivered via Radix `getValueLabel` → `aria-valuetext` (the WAI-ARIA-preferred channel). (2) The earned-ack folds into the `Header` rather than a new export (keeps the locked §4.1 export surface exact). (3) Copy defaults centralized in `lib/derive.ts` so Root + bare `OptInToggle` can't drift.

## Verification

`tsc` **0** · ESLint (folder) **0** · `validate:meta-deps` **61/61 clean** · `pnpm build` **70 pages (no SSR error)** · `registry:build` ✓. Artifact: 13 files, **0 forbidden**, targets locked-convention, `registryDependencies: [progress,avatar,button,badge,skeleton]`, `dependencies: [lucide-react]`, `internal: []` (D-03); fixtures resolve `@ilinxa/cooperative-challenge-01`.

## Follow-ups

| # | Sev | Item | Target |
|---|---|---|---|
| F-01 | 🔸 Med | ✅ **CLOSED (v0.1.1)** — smoke caught a Base UI divergence, fixed + re-smoked (see below) | v0.1.1 |
| F-02 | 🔹 Low | live never-forced visual walkthrough (opted-out reads as invitation, not failure) | v0.1.x post-deploy |
| F-03 | 🔹 Low | ~~meter `aria-valuenow`~~ — superseded: the v0.1.1 fix drops `getValueLabel`; the count reads via `aria-label` | closed |

## v0.1.1 — F-01 smoke caught a Base UI (F-cross-13) divergence, fixed

The post-deploy smoke (base-nova / **Base UI** consumer, live registry) caught a **real** cross-backend break — "no new primitive" did **not** mean "no divergence risk":

- **Smoke — CAUGHT:** consumer `tsc` → **1 error**, `cooperative-challenge-progress.tsx: error TS2322 … not assignable to ProgressRootProps`. Root cause: I used **`getValueLabel`** (a **Radix-only** `Progress.Root` prop) to set `aria-valuetext="3 of 5"`. Base UI's `Progress.Root` has no `getValueLabel`, so the consumer's Base UI `progress` primitive rejected the prop. **Producer tsc passed because the producer's `progress` is Radix** — the exact F-cross-13 producer-blind-spot the memory names ("F-cross-13 risk is about the PRIMITIVE's Radix↔Base-UI divergence-proneness, NOT 'new to the library'"). The sibling `team-progress-bar-01` had smoked clean precisely because it passed **only `value` + `aria-label`** to `Progress` (no Radix-specific API).
- **Fix (v0.1.1):** drop `getValueLabel` + the redundant `max={100}`; carry the "3 of 5" reading via the `aria-label` accessible name (`Team progress: 3 of 5`) + the visible mono `current / target` — the sibling's proven cross-backend pattern. Bumped `meta.version` → `0.1.1`; `registry:build` regenerated the artifact.
- **Re-smoke — CLEAN:** local-registry re-add (served `public/r`, `shadcn add http://localhost:5056/cooperative-challenge-01.json --overwrite`) → **1 file updated**, consumer `tsc` → **0 errors**.

**Lesson (reinforces [[project_shadcn_primitive_radix_baseui_divergence]]):** F-cross-13 fires on *how you use* an already-shipped primitive, not only on new ones. A Radix-only prop (`getValueLabel`, `delayDuration`, multi-value ToggleGroup, …) passes producer-tsc and breaks Base UI consumers. **Only pass the cross-backend-common surface to a shadcn primitive** (`value`/`aria-label` on `Progress`), or verify the specific prop exists on both backends. The producer being Radix makes it blind to this by construction; the cross-consumer smoke is the only catch.

## Resume

**Next: component 5 `task-choice-control-01`** (E4 Autonomy) — the pack's single-unit exception (no Root/compound). Then component 6 `team-quest-log-01` (E5). After all six, revisit the deferred shared `gamification-kit` (D-04) — the `derive`/`resolve`/`diff`/`clamp` + event factories across 4 components now clearly share a shape.
