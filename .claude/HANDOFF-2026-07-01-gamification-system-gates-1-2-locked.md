# HANDOFF — `gamification-system` GATES 1 + 2 locked (planning complete, implementation pending)

> **Date:** 2026-07-01 · **State:** planning-locked, tree GREEN (`tsc` 0), **ALL UNCOMMITTED**.
> **Resume in one line:** implement the six gamification pro-components in build order — `team-progress-bar-01` is already scaffolded; fill its stubs per its plan, then proceed down the list. Each component: implement → `manifest.ts` + `registry.json` (base + `-fixtures`) → `tsc`/`lint`/`build`/`validate:meta-deps` clean → GATE-3 spot-check → ship.

---

## 1. What this is

A new **`gamification-system`** (a *system*, like `graph-system` — see [`docs/systems/README.md`](../docs/systems/README.md)): a **cooperative-only, team-scoped gamification layer** extracted from the thesis "Gamification Design Specification." Six pro-components, **one per SDT element**, each independently usable and composable. Origin/provenance: [`docs/systems/gamification-system/gamification-elements-catalogue.md`](../docs/systems/gamification-system/gamification-elements-catalogue.md).

The shared contract — domain model, cooperative-only rules, telemetry, and **16 locked decisions (D-01…D-16)** — lives in the **system description** ([`docs/systems/gamification-system/gamification-system-description.md`](../docs/systems/gamification-system/gamification-system-description.md)). **Where any component doc disagrees with the system description, the system description wins.**

---

## 2. Status — what's done vs pending

| Stage | State |
|---|---|
| **GATE 1** — system description + catalogue + 6 component descriptions | ✅ authored, deep-audited, signed off |
| **GATE 2** — 6 implementation plans | ✅ authored, deep-revalidated, signed off |
| **D-01** — `gamification` registry category | ✅ plumbed ([types.ts](../src/registry/types.ts) union + [categories.ts](../src/registry/categories.ts), order 11) |
| **Scaffold** — `team-progress-bar-01` | ✅ `pnpm new:component gamification/team-progress-bar-01` ran (template stubs on disk; **NOT** in `manifest.ts`, **NOT** implemented) |
| **Implementation** — all 6 | ⏳ not started |
| **Verify** — `tsc` | ✅ 0 errors (working tree green) |
| **git** | ⚠️ **everything UNCOMMITTED** (planning docs + D-01 + scaffold + this handoff/STATUS/decision/memory). Not committed per convention — commit on resume if desired. Branch is `master`; if committing, branch first per repo guidance. |

---

## 3. Document map (all signed off)

| Doc | Path |
|---|---|
| System description (the contract) | [`docs/systems/gamification-system/gamification-system-description.md`](../docs/systems/gamification-system/gamification-system-description.md) |
| Elements catalogue (provenance) | [`docs/systems/gamification-system/gamification-elements-catalogue.md`](../docs/systems/gamification-system/gamification-elements-catalogue.md) |
| Per component (×6) | `docs/procomps/<slug>-procomp/<slug>-procomp-description.md` + `<slug>-procomp-plan.md` |

Thesis source docs (read-only, another repo): `e:\2026\thesis\thises-v1\output\for-advisor\PRJ001_Methodology_Appendix_A_Gamification-Design_2026-05-13.md` (+ `app-instruction/V1_UI_UX_Features.md`, `V2_UI_UX_Features.md`, `App_Data_Capture.md`).

---

## 4. The locked architecture (D-01…D-16 — read §8 of the system description for the full table)

The load-bearing ones to carry into implementation:

- **D-03 — registry independence.** Each component imports **no other registry component**; declares its own slice of the shared domain model in its own `types.ts`; `registryDependencies: []`. (Minor type duplication across folders is the accepted price; a shared `gamification-kit` is **deferred** until 2–3 components prove the surface — D-04, graph-system #25 precedent.)
- **D-05 — shadcn compound.** Each is `Root` + flat à-la-carte parts + logic-free `<Name>` assembly, flat exports, heavy deps `React.lazy`. **Exception:** `task-choice-control-01` is **single-unit** (no Root/context — nothing cross-cutting to hold; D-06 forbids requiring a provider).
- **D-06 — prop-driven, controlled.** No provider/store required; the host owns data.
- **D-07 — telemetry via optional `onEvent`.** Each emits only its semantic event(s); the host adds the envelope. No env-specific code, never `next/*`.
- **D-08 — cooperative-only + team-scoped.** Never inter-team / public / per-individual. **Excluded forever:** leaderboards, rankings, points, public failure displays.
- **D-09 — milestone is the shared spine.** Progress %, badges, chapters all derive from host-defined milestones.
- **D-10 — non-blocking feedback.** Animations < 1 s, skippable, no modal blocking (the cardinal constraint for E6).
- **D-13 — design system.** Onest + JetBrains Mono, signal-lime `oklch(0.80 0.20 132)`/dark `oklch(0.86 0.18 132)` + near-black foreground, OKLCH only, [globals.css](../src/app/globals.css) tokens, `reveal-up`. Use the `frontend-design` skill for visual surfaces.
- **D-15 — team prop convention.** Renders team-identity *text* (name/questName) → take a `team` object subset; identity-only → scalar `teamId` (+ `members`).
- **D-16 — celebration ownership.** `team-trophy-shelf-01` (in-place award) and `team-feedback-loop-01` (transient overlay) never trigger each other; the host wires exactly one path per event kind (shelf `animateAward={false}` to defer to the feedback-loop).

---

## 5. Per-component cheat-sheet (build order)

Build order = system §10 (pilot the simplest end-to-end first, then replicate).

| # | Slug · element · SDT | Structure (locked) | shadcn deps | Telemetry | Key locked points |
|---|---|---|---|---|---|
| 1 | `team-progress-bar-01` · E1 · Competence | light compound: Root + Track + Label + `ProgressTrack` | `progress` | `progress-bar.checked` | `team:{id,name?}`; `milestones[]` OR `value` (value wins); `labelFormat percent\|fraction`; viewed-once-per-mount IO emit; fill transition (reduced-motion). **SCAFFOLDED.** |
| 2 | `team-trophy-shelf-01` · E2 · Comp+Relat | compound: Root + Grid/Header/Empty + `TeamMilestoneBadge` + **lazy** `BadgeAwardOverlay` | `tooltip`,`badge`,`separator` (+lucide) | `badges.viewed` | `team:{id,name?}`; `awardedAt` = earned discriminator; **diff-driven SSR-safe award** (`prevBadgesRef`+`mounted` → no hydration flash); CSS burst, no confetti npm; D-16 `animateAward`. |
| 3 | `team-feedback-loop-01` · E6 · Competence | compound: Root + Celebration + Nudge + **lazy** `ConfettiBurst` | `button` (+ **lazy confetti npm**) | none (C4: `onEvent` accept-but-silent) | scalar `teamId`; **D-10 non-blocking is cardinal** (`pointer-events:none` except skip, no focus trap, clamp <1000ms); BOTH controlled `event` + imperative `celebrate()` into one reducer; reduced-motion = real static branch; newest-wins retrigger. |
| 4 | `cooperative-challenge-01` · E3 · Relatedness | light compound: Root + Header/Progress/Reward/OptIn + primitives | `progress`,`avatar`,`button`,`badge`,`skeleton` | `challenge.opened` + `challenge.opt-in` | full `team{id,name,members}`; ONE challenge v1; **never-forced opt-in = button-toggle (not switch)**, opted-out neutral/joinable, collective progress only; done = lightweight inline ack (heavy celebration → E6). |
| 5 | `team-quest-log-01` · E5 · Auto+Relat | compound: Root + NameEditor + Chapters + primitives | `input`,`button` (+lucide) | `narrative.chapter-viewed` | `team:{id,name,questName?}`; title=`questName?.trim()\|\|name` (**blank-save reverts = the skip path, never forced**); beat-state derive (done/current/upcoming); IO fire-once telemetry; vertical rail. |
| 6 | `task-choice-control-01` · E4 · Autonomy | **single-unit** (flat parts, no Root/context) | `switch`,`button`,`avatar`,`popover`,`command` | `task-choice.interaction` | scalar `teamId` + `members`; three states (open/claimed/unassigned); **release = `onAssigneeChange(undefined)`, no separate onRelease, NO penalty** (structural ban list on color/copy/motion); member picker = popover+command. |

---

## 6. The per-component build loop

For each component (start with #1, already scaffolded):

1. **Scaffold** (if not done): `pnpm new:component gamification/<slug>` — **prints the 3 manifest lines.** (Category exists now; D-01 done.)
2. **Implement per the plan** — fill the sealed-folder files (`<slug>.tsx`, `parts/`, `hooks/`, `lib/`, `types.ts`, `dummy-data.ts`, `demo.tsx`, `usage.tsx`, `meta.ts`, `index.ts`). The plan's §"File-by-file" + §"Final API" + §"Tier inventory" are the contract. **Read the real shadcn primitive source** (`src/components/ui/<name>.tsx`) before using it — don't assume the Radix prop shape (AGENTS.md mandate).
3. **`manifest.ts`** — paste the 3 printed lines into [`src/registry/manifest.ts`](../src/registry/manifest.ts).
4. **`registry.json`** — add the base item (all shipped files, `type: "registry:component"`, `target: "components/<slug>/<sub>"`, **never `demo.tsx`/`usage.tsx`/`meta.ts`**) + a `<slug>-fixtures` sibling (just `dummy-data.ts`). `registryDependencies` = the shadcn primitive bare names (+ feedback-loop's confetti npm in `dependencies`); **no `@ilinxa/*`** (D-03).
5. **Verify:** `pnpm tsc --noEmit` · `pnpm lint` · `pnpm build` · `pnpm validate:meta-deps` (declare exactly the shadcn primitives actually imported) · `pnpm registry:build` (spot-check the artifact).
6. **GATE 3** — author `docs/procomps/<slug>-procomp/reviews/<date>-v0.1.0-spotcheck.md` (5 dims; verdict ≥ Pass-with-follow-ups). Rotating-dim suggestions are in each plan's §"Verification".
7. **Ship** — update STATUS.md + decision file; commit + push (Vercel auto-deploys → installable via `pnpm dlx shadcn add @ilinxa/<slug>`).

---

## 7. Gotchas to carry (from prior procomp ships + the plans)

- **F-cross-13 (Radix↔Base-UI divergence) is about the PRIMITIVE, not "new to the library."** Simple/proven primitives (`progress`, `input`, `button`, `tooltip`-via-calendar-01's-proven-usage) → standard first-ship consumer-tsc smoke. Controlled-divergence-prone (`popover`/`command` in task-choice) → cross-backend smoke recommended. The **only genuinely new dep** is feedback-loop's **confetti npm** → run the 4-ship smoke for it.
- **`validate:meta-deps` regex:** in any file with a side-effect import, put the dep-declaring `from`-import FIRST; never reference a dep name only inside a comment (false-positive). (blackboard-01 / content-composer-01 lessons.)
- **`meta.dependencies.shadcn`** is the real field (a couple of plans write `meta.shadcn` shorthand — see [types.ts](../src/registry/types.ts) `ComponentDependencies`).
- **SSR determinism:** no `Date.now()`/`new Date()`/`matchMedia`/`Math.random()` during render; client-only behavior (IO, timers, reduced-motion) goes in effects. (trophy-shelf award diff + feedback-loop timer are the seams.)
- **Lazy boundaries must be real** `React.lazy(() => import("./parts/<x>"))` so dropping a part drops its weight (trophy-shelf `BadgeAwardOverlay`, feedback-loop `ConfettiBurst`).
- **`registry.json` is hand-formatted** — surgical text insert, not a JSON re-stringify (content-composer lesson).

---

## 8. Open sign-off items (all resolved to recommended defaults; revisitable at each component's GATE 3)

The user confirmed the recommendations; these are the defaults locked in the plans, listed for awareness:
- progress-bar: light-compound (vs single-widget fallback); `GamificationEvent` narrow per-component slice; ticks shown from `milestones` even in value-mode.
- trophy-shelf: `team.name` optional; hand-rolled CSS burst (no confetti npm); `playAward` imperative handle → v0.2.
- cooperative-challenge: button-toggle (not switch); `<CooperativeChallengeSkeleton>` (not a `loading` prop).
- task-choice: one "I'll take this" button; release-undo → v0.2.
- quest-log: `input` primitive; vertical rail; imperative handle included; `TeamQuestHeader` → v2.
- feedback-loop: both trigger paths (controlled-primary); `onEvent` accept-but-silent.

---

## 9. RESUME CHECKLIST

```
[ ] 1. (optional) commit the locked state (branch off master first)
[ ] 2. Implement team-progress-bar-01 per its plan (folder already scaffolded)
[ ] 3. manifest.ts + registry.json (base + fixtures) for it
[ ] 4. tsc / lint / build / validate:meta-deps / registry:build green
[ ] 5. GATE 3 spot-check → ship
[ ] 6. Repeat for trophy-shelf → feedback-loop → challenge → quest-log → task-choice
[ ] 7. (after 2–3 ship) revisit the deferred shared gamification-kit (D-04 / system §7.3)
[ ] 8. (later) Tier-host page src/app/systems/gamification-system/page.tsx ("all together")
```
