---
date: 2026-05-09
session: 14
phase: 7-followup
type: rule
commits:
  - b28bbfa
  - 40abd4a
components: []
findings: []
status: complete
---

# New rule — Component readiness review (GATE 3)

Established 2026-05-09 post-Phase-7. Codifies the lesson the sweep proved: "compiles + renders + has docs" ≠ "ready." Every new component must pass a structured review before it's pushed to `master`.

## Why this rule exists

The 2026-05 sweep surfaced consistent classes of issue across 36 components — design-system drift, positional callback versioning traps, broken cross-folder imports, missing meta-deps, rote TODOs disguised as JSDoc. Every one of these would have been caught by a structured review at v0.1.0 ship time. The sweep was the catch-up; this rule ensures we don't accumulate new debt of the same shape going forward.

## What got authored

**`.claude/rules/component-readiness-review.md`** — the rule. Triggers / templates / verdict bar / workflow position / what doesn't apply. ~165 lines.

| Trigger | Template | Min verdict to close |
|---|---|---|
| First ship `v0.1.0` | `review-spotcheck.md` (5 dims, ~30 min) | `Pass` or `Pass with follow-ups` |
| `alpha → beta` promotion | `review-checklist.md` (16 dims) + `review-report.md` | Same |
| Public-API minor bump | Spot-check or full per scope | Same |
| Patch bump (non-API) | NOT required | (n/a) |

`Needs revision` or `Block` verdict means the component is NOT closed — fix the findings, re-review.

## Workflow integration

- **`.claude/CLAUDE.md`** workflow gains step 8 (the review gate) between `registry:build` and `STATUS.md` update. Three blocking gates total: 1 (description) / 2 (plan) / 3 (review). Existing 9-step workflow becomes 10 steps. New top-level "Rules" section sibling to "Skills mandates" so the gate is visible on every session load.
- **`docs/component-guide.md` §13** verification checklist restructured into 5 groups: Build / Content / Conventions / Registry / Review (GATE 3) / Bookkeeping. The "Component readiness review" group adds 5 explicit checkboxes including the F-cross-11 path-b smoke harness pass.
- **`docs/procomps/README.md`** workflow checklist gains steps 11–14 (spot-check review, GATE 3 verdict, STATUS, push).
- **`docs/reviews/templates/review-spotcheck.md`** Dim 12 (Verification) updated to include the smoke harness consumer-tsc pass + validate-meta-deps clean. "Smoke result" section columns updated to match the new harness output (Install / TSC / Time).
- **`docs/reviews/templates/review-checklist.md`** §12 also got the smoke harness mandate added.

## Audit follow-up (commit `40abd4a`)

Three findings from a re-validation pass on the rule itself, all fixed same-day:

1. **Gate label inconsistency** — CLAUDE.md step 1 used "(Required gate — must)" without GATE 1/2 labels; procomps/README and rule doc used GATE 1/2/3 explicitly. Fixed: CLAUDE.md step 1 now reads "(Required gate — must, GATE 1 + GATE 2)" with description tagged GATE 1 and plan tagged GATE 2.
2. **Spotcheck Dim 12 didn't include smoke harness** — fixed.
3. **Spotcheck "Smoke result" columns stale** (pre-path-b shape) — updated.

## First application

stat-card. The rule's first end-to-end test:
- GATE 1 (description sign-off) ✓
- GATE 2 (plan sign-off) ✓
- Implementation
- GATE 3 (spot-check review) ✓ — verdict Pass with follow-ups; 3 Mediums + 1 Low
- Smoke harness consumer-tsc pass ✓ (post-push, against deployed Vercel artifact)
- v0.1.1 same-day patch closing 3 follow-ups; F-04 (--success token) deferred to v0.2

The audit-systematic-scope memory + the rule's "self-review at sign-off catches real issues" caveat both fired during the v0.1.0 implementation — `validate-meta-deps` flagged a phantom `lucide-react` declaration in stat-card's meta.ts before commit, exactly the kind of catch the rule + lint stack was designed for.

## Existing components grandfathered

Sweep-reviewed components (sessions 1–13) don't need a re-review unless they trip a re-review trigger (alpha→beta or public-API minor bump). The rule is binding for components added AFTER 2026-05-09.

## Cross-references

- Rule: [`.claude/rules/component-readiness-review.md`](../rules/component-readiness-review.md)
- Workflow integration: [`.claude/CLAUDE.md`](../CLAUDE.md), [`docs/component-guide.md`](../../docs/component-guide.md), [`docs/procomps/README.md`](../../docs/procomps/README.md)
- Templates: [`docs/reviews/templates/`](../../docs/reviews/templates/)
- First application: [`docs/procomps/stat-card-procomp/`](../../docs/procomps/stat-card-procomp/)
- Predecessor work: [`2026-05-09-fcross11-path-b-smoke-tsc.md`](2026-05-09-fcross11-path-b-smoke-tsc.md) (the smoke harness consumer-tsc that the review templates now reference as a required check)
