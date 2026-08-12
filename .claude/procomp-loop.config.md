# procomp-loop config — ilinxa-ui-pro

<!-- Criteria + roles for the procomp-loop skill (C-loop / U-loop). This file is where the bar
     CHANGES over time — edit here, not the skill. Repo mechanics (gate commands, flakes, env
     prep, orchestration incidents) stay in .claude/readiness.config.md — never duplicate them
     here; this file may only point at them. Updating either config is part of the change that
     invalidated it. -->

## meta
- config_version: 1.0.0
- updated: 2026-08-12
- mechanics source of truth: `.claude/readiness.config.md` (gates table, known-flakes, env-prep, agent-orchestration)

## model matrix (per `.claude/rules/subagent-model-policy.md` — NEVER Opus 5 / bare `opus` alias)

| Role | Who | Model | Notes |
|---|---|---|---|
| Architect / coordinator / verdicts | main session | session model | never delegated; owns shared files + all sign-off requests |
| Implementer (slices, fixes) | subagent | Sonnet 5 (`sonnet` alias OK) | 1 per independent slice; brief from the template |
| Finder (adversarial review) | fresh subagent | Sonnet 5 | fresh context mandatory; verdicts stay with architect |
| Smoke-driver (installs, browser) | subagent or coordinator | Sonnet 5 | never overlapped with heavy browser audits (machine-load incident) |
| Bulk-mechanical (sweeps, regen, conversions) | subagent | Sonnet 5; Haiku 4.5 only for trivially mechanical | ALWAYS coordinator re-verification + central gate battery after |

Fan-out defaults: ≤ 2 implementers + 1 finder for a single-unit component; up to 4 implementers +
2 finders for a compound. Don't orchestrate diffs the architect can hold alone (≲150 lines).

## sign-off policy

| Gate | Default | Delegated mode |
|---|---|---|
| GATE 1 (description) / GATE 2 (plan) / U1 minor+ | pause, ask user | allowed only when the user explicitly authorized end-to-end execution this run; record `delegated by user (<quote/context>)` in the state doc |
| U1 patch | architect proceeds, records it | — |
| Breaking change to a composed-by-others component | ALWAYS user | never delegated |
| GATE 3 verdict | architect (self-review OK per tier table) | pages/panels: peer or AI-assisted, never self |

## U-loop rigor ladder

| Change class | Sign-off | Review (U4) | Review file (U6) | Smoke (U5) |
|---|---|---|---|---|
| patch (no public-API touch) | recorded, no pause | architect self-check | not required | changed slug install + tsc |
| minor (additive API) | per policy above | 1 fresh finder + dependents axis | spotcheck (narrow) | slug + 1 dependent |
| breaking (0.x minor bump) | user (composed → always) | 2 fresh finders + dependents axis | spotcheck broad or checklist | slug + ALL dependents + feature slices |
| promotion (alpha→beta) | user | full | full checklist (16 dims) + report; peer/AI-assisted preferred | full per-tier smoke + browser pass |

## quality bars (current — raise here, not in the skill)

- Consumer smoke: install exit 0 AND consumer `tsc --noEmit` **0 errors** AND render; fixtures
  item too; ≥1 negative path. First ships: both backends when the component carries any
  F-cross-13 surface.
- Docs-site proof: production build, both themes, every documented interaction pattern mounted
  and exercised.
- Review floors: verdict ≥ Pass-with-follow-ups; every follow-up has owner + bump target;
  expected findings base rate 1–3 (description) / 3–5 (plan) / >0 (GATE 3) — zero findings =
  redo the pass.
- Size: built artifact ≤ the slug's own `artifactBudgetKB` in `meta.ts` (feature items:
  `meta.budgetKB` on the registry.json item); `validate:artifact-size` fails at >1.2× budget.
  Estimate = source bytes × 1.13.
- Versioning: semver-while-0.x (breaking → 0.x+1.0); bump `meta.ts` + STATUS row; the
  component-versions freshness `--check` runs inside `pnpm validate:doc-drift` (and
  `registry:build`) — must be green.
- New-category adds: types + CATEGORIES edit is part of the plan, not an implementation surprise.

## fix-on-touch ledger (owed follow-ups the U-loop U0 MUST consult)

- F-cross-15 static-import-vs-lazy — fix when touching a carrier.
- `--radix-popover-trigger-width` residual audit — check when touching any popover-bearing component.
- Per-component cohorts: card-tree-node v0.3 · flow-canvas v0.2.x · pdf-viewer worker default
  v0.2 · blackboard F-04 (F-03 closed v0.2.1, 2026-08-12) · content-composer v0.4.0 conditional
  imports (MED-4).
- Source of truth for the full list: STATUS.md "Open decisions / TODOs" + each review file's
  follow-up table. This ledger is a pointer, keep it short; mark items done in their source files.

## state docs
- Location: `docs/procomps/<slug>-procomp/<slug>-loop.md` (template in the skill's assets).
- U-loop on a component with an existing loop file: append a new run section, don't overwrite.
- The state doc ships with the base commit — it is part of the audit trail.
