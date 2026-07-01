---
date: 2026-07-01
session: gamification-system implementation (component 2 of 6)
phase: implementation
type: first-ship
commits: []   # built + gated; uncommitted on master at write time
components:
  - team-trophy-shelf-01
findings: "GATE 3 Pass-with-follow-ups (rotating dim Robustness). F-01 post-deploy consumer-tsc smoke (Med, expected clean — no new primitive, lazy relative import). F-02 live award-reveal walkthrough owed (Low). F-03 non-interactive earned-badge tooltip is hover-only, keyboard via aria-label (Low → v0.1.1). F-04 per-shelf landmark region (Low → v0.1.1). Lazy boundary proven (1517-byte isolated chunk); SSR-safe diff proven."
status: built-uncommitted
---

# team-trophy-shelf-01 v0.1.0 — 2nd gamification component

## What

The **second** component of the [`gamification-system`](../../docs/systems/gamification-system/gamification-system-description.md) — the 59th pro-component. **E2 (Competence + Relatedness):** a durable gallery of one team's earned milestone badges, honest locked slots for what's ahead, an optional header count, an awarded-date tooltip, and a brief (< 1s), skippable, non-blocking reveal when a badge is newly earned. Plus the standalone Tier-C `TeamMilestoneBadge` token. Built per its signed-off [description](../../docs/procomps/team-trophy-shelf-01-procomp/team-trophy-shelf-01-procomp-description.md) (GATE 1) + [plan](../../docs/procomps/team-trophy-shelf-01-procomp/team-trophy-shelf-01-procomp-plan.md) (GATE 2). All 3 open Qs took their recommended defaults (optional `team.name`; hand-rolled burst, no npm; imperative `playAward` → v0.2).

## How it was built (matches the plan's compound)

Full shadcn-compound (plan §4.1): pure `lib/resolve.ts` (earned/locked/counts) + `lib/diff.ts` (newly-earned) + headless `TeamTrophyShelfRoot` (owns the diff + telemetry + open path) + flat `TeamTrophyShelfGrid` / `TeamTrophyShelfHeader` / `TeamTrophyShelfEmpty` + the standalone Tier-C `TeamMilestoneBadge` + a **`React.lazy` `BadgeAwardOverlay`** (the spark burst, hand-rolled from `animate-ping`, zero npm) + the `TeamTrophyShelf01` assembly (logic-free, an internal emptiness gate routes Grid | Empty). `awardedAt` is the single earned/locked discriminator. Deps: `tooltip` / `badge` / `separator` + lucide; zero `@ilinxa/*` (D-03); cooperative-only (no members / rank / per-person).

## Key decisions / deviations (loud, not silent)

- **SSR-safe award diff via setState-DURING-render, not a `mounted` effect flag.** The plan (§6) specified `prevBadgesRef` + a `mounted` state set in a post-mount `useEffect`. That `useEffect(() => setMounted(true))` would trip the repo's **`set-state-in-effect` lint rule** (which *errors*, observed live on other files this session). Instead the Root uses React's official "storing information from previous renders" pattern: `const [prevBadges, setPrevBadges] = useState(badges)` seeded from the first render, and the diff runs inline when `badges !== prevBadges`. Init-equality guarantees the initial/hydration render has `prev === current` → nothing animates on load. Same SSR-safe semantics as the plan, but avoids both `set-state-in-effect` AND ref-during-render (also lint-flagged). `lib/diff.newlyEarned` drops the `mounted` param accordingly. **This is the load-bearing correctness call of the build** and a reusable pattern for any "detect a prop change across renders" seam in this repo.
- **Lazy boundary is real + proven.** `BadgeAwardOverlay` is a **default export** pulled only via `React.lazy(() => import("./badge-award-overlay"))` from the Grid, invoked only when `animateAward && a newly-earned badge exists`. The built output confirms a dedicated **1517-byte chunk** carrying the spark burst but **0** grid/token code (verified by grepping distinctive class strings across chunks). The bare-token path and `animateAward={false}` never load it.
- **Deterministic awarded-date** — UTC parts + a fixed month array (no `Date.now()`, no locale) so server + client format identically; the tooltip is portaled/on-open so it isn't in SSR HTML either.
- **Tooltip cross-backend safety** — uses `Tooltip`/`TooltipProvider`/`TooltipTrigger asChild`/`TooltipContent` **without passing `delayDuration`** (the calendar-01 v0.2.1 F-cross-13 lesson: `delayDuration` is a Radix-only prop that breaks Base UI consumer-tsc).
- **Assembly props type** named `TeamTrophyShelf01Props` (library convention + scaffolder), not the plan's sketch `TeamTrophyShelfProps`.
- **No dead state** — dropped the plan's `openedBadgeId` state (nothing renders it in v1); the open path fires `onBadgeOpen` + telemetry directly. Tokens are interactive buttons only when `onBadgeOpen` is wired (todo-tree dead-affordance lesson).

## Verification

`tsc` 0 · ESLint (folder) 0 · `validate:meta-deps` 59/59 · `pnpm build` 59 component pages (no SSR error) · `registry:build` ✓. Artifact: 12 files, 0 forbidden, targets under `components/team-trophy-shelf-01/`; fixtures resolve `@ilinxa/team-trophy-shelf-01`. Lazy chunk isolation + SSR-safe diff verified structurally.

## Follow-ups

| # | Sev | Item | Target |
|---|---|---|---|
| F-01 | 🔸 Med | post-deploy consumer-tsc smoke + verify lazy chunk resolves in consumer | v0.1.0 post-deploy |
| F-02 | 🔹 Low | live award-reveal walkthrough (burst < 1s, reduced-motion, animateAward=false) | v0.1.0 post-deploy |
| F-03 | 🔹 Low | keyboard-accessible awarded-date tooltip on non-interactive tokens | v0.1.1 |
| F-04 | 🔹 Low | reconsider the per-shelf landmark region | v0.1.1 |

## Resume

Commit/push (branch off `master` first) → F-01 smoke → **component 3: `team-feedback-loop-01`** per its plan (build order = system §10; the cardinal D-10 non-blocking constraint + the genuinely-new confetti npm dep → run the 4-ship smoke there). After it, revisit the deferred shared `gamification-kit` (D-04) — `resolveProgress` + `resolve`/`diff` + the event factories are the extraction candidates now that 2 components share the shape.
