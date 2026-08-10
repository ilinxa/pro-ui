# Rule: Readiness review (all library tiers) — core

> Size budget: ≤4KB (always-loaded). Full spec — per-tier dimensions, smoke matrix, workflow diagram, review-file contents — lives at [`docs/reviews/readiness-review-spec.md`](../../docs/reviews/readiness-review-spec.md). Split 2026-08-10 (plan P0.2); substance unchanged from the 2026-05-25 rule.

**MANDATORY.** Every library artifact (pro-component / pro-section / pro-page / pro-panel) must pass a structured review before push to `master` (= deployed = installable). "Compiles + renders + has docs" ≠ "ready" — the 2026-05 sweep proved the drift classes are real.

## Triggers

| Trigger | Review | Min verdict |
|---|---|---|
| First ship `v0.1.0` | spotcheck ([template](../../docs/reviews/templates/review-spotcheck.md)); pages/panels: peer or AI-assisted required | `Pass` / `Pass with follow-ups` |
| `alpha → beta` promotion | full [checklist](../../docs/reviews/templates/review-checklist.md); peer preferred | same |
| Public-API-touching minor | spotcheck (narrow) or checklist (broad) | same |
| Patch bump (no public-API touch) | NOT required | — |

2026-05-sweep procomps are grandfathered until they trip a trigger. No grandfathered cohort for sections/pages/panels. Pages + panels NEVER self-review (composition risk) — peer or AI-assisted, findings tagged.

## Close conditions (all must hold)

1. Planning trio (description / plan / guide) current.
2. tsc + lint + `validate:meta-deps` + `pnpm build` clean; per-tier smoke pass (consumer install + consumer-tsc for runtime tiers — spec §smoke).
3. Review file at the artifact's `reviews/` folder: procomp → `docs/procomps/<slug>-procomp/reviews/<date>-v<version>-<scope>.md`; other tiers → `docs/<tier>/<slug>/reviews/...`.
4. Verdict ≥ `Pass with follow-ups`; every follow-up has owner + bump target.
5. Pages/panels: every constituent closed its own GATE 3 first.
6. STATUS.md row honest; decision file if non-obvious.

`Needs revision` / `Block` = not closed — fix, re-review.

## Fixed ladders

**Severity:** 🚫 Blocker / ⚠️ High / 🔸 Medium / 🔹 Low.
**Verdict:** Pass / Pass with follow-ups / Needs revision / Block.

Don't rubber-stamp: reviews consistently surface real findings (1–3 per description, 3–5 per plan, more on composition tiers). Cross-cutting findings promote to `F-cross-NN` in [`docs/reviews/sweep-tracker.md`](../../docs/reviews/sweep-tracker.md).

This is GATE 3 of the three-gate workflow (GATE 1 description sign-off · GATE 2 plan sign-off · GATE 3 review). It does not replace the planning gates, require automated tests, or gate mid-build iteration.

**Established** 2026-05-09 · **tiers** 2026-05-25 · **core/spec split** 2026-08-10.
