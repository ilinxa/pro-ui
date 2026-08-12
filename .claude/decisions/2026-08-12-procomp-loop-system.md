---
date: 2026-08-12
session: procomp-loop system + dual pilots
phase: post-P4 (P5-adjacent tooling)
type: process-system + component-ship + component-patch
commits: [see STATUS / git log this date — loop-system, empty-state v0.1.0, blackboard v0.2.1]
components: [empty-state 0.1.0 NEW, blackboard 0.2.0→0.2.1]
findings: 4 CONFIRMED in pilot 1 (fill-mode flash, action={false} row, media aria-hidden, sm-radius doc-drift); 1 harness mechanic (fixtures regDep needs local namespace remap pre-deploy)
status: shipped
---

# procomp-loop: component creation + upgrade loops, configured and proven

**What:** User directive — replace the ad-hoc component workflow with a professional, repeatable
loop system covering end-to-end creation AND upgrade, with subagent orchestration, config-driven
criteria, CLAUDE.md wiring, and proof-by-pilot.

**Shipped:**
- `.claude/skills/procomp-loop/` — SKILL.md (both loops at a glance, orchestration, sign-off
  policy, anti-patterns from P0–P4 evidence) + `references/creation-loop.md` (C0–C8) +
  `references/upgrade-loop.md` (U0–U7) + `assets/loop-state.template.md` +
  `assets/agent-brief.template.md`. Validator-clean.
- `.claude/procomp-loop.config.md` — model matrix (architect = main session; Sonnet 5
  implementers/finders; NEVER Opus 5), sign-off policy incl. delegated mode, **U-loop rigor
  ladder** (patch/minor/breaking/promotion → review depth), quality bars, fix-on-touch ledger.
  Mechanics stay in `readiness.config.md` — configs point, never duplicate.
- CLAUDE.md: component-loop mandate added; `feature-readiness-loop` re-scoped to non-component
  work; Workflow section compressed to gate skeleton (12KB budget: 11.6KB).

**Key design decisions:**
1. ONE skill, two workflows — the shared spine (gates/review/smoke/ship) must not fork.
2. Criteria live in config, procedure in skill — "updated criterias" never require skill edits.
3. State machine per run at `docs/procomps/<slug>-procomp/<slug>-loop.md`, ships with the commit.
4. Upgrade rigor scales by ladder, not one-size — patch ≠ breaking ≠ promotion.

**Proof (both pilots same-day, delegated sign-off recorded):**
- **C-loop / `empty-state` v0.1.0:** 8 pre-code findings at GATE 1/2 (incl. reveal-keyframe
  portability catch); implementer agent + coordinator merge; 7 gates green; finder+architect
  review → 4 CONFIRMED fixed pre-ship; 18/18 Playwright checks on production build; Base UI
  consumer install + tsc 0; GATE 3 Pass with follow-ups.
- **U-loop / `blackboard` v0.2.1:** owed F-03 (absorbed-extras prune) landed via patch-class
  ladder path — architect-implemented, no orchestration overhead, live 3/3 + consumer tsc 0,
  follow-up ledger reconciled.

**Loop-earned lessons (also in improvement log):** tw-animate-css `animate-in` fill-mode
defaults to none — staggered entrances need `animationFillMode:"both"`; fixtures items'
`@ilinxa/...` regDeps can't resolve pre-deploy — smoke via temporary namespace remap to the
local artifact server, then re-verify post-deploy; `next start` orphans survive wrapper kill on
Windows — free the port by PID before re-serving.

**Open:** post-deploy fixtures re-check (review follow-up) · empty-state icons-map export
(v0.2.0 if requested) · blackboard F-04 stays parked for v0.3.0.
