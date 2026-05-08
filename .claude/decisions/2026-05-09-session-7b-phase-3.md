---
date: 2026-05-09
session: 7b
phase: 3
type: fix
commits: [c46352b, c3f2ba6, 2f907bd, 65ccf6f, 25466df, aa89388]
components: [rich-card, article-body-01, markdown-editor, properties-form, entity-picker]
findings: [F-cross-07, F-cross-10, F-cross-03, F-cross-05]
status: shipped
---

# Session 7b Phase 3 — F-cross-07 + F-cross-10 closure; smoke-verify F-cross-03/05

## Summary

Phase 3 of the master-plan §7 mid-sweep checkpoint. Closed F-cross-07 (cross-component dep declaration drift) and F-cross-10 (smoke harness hygiene drift); smoke-verified F-cross-03 + F-cross-05 fixes from session 7 Phase 2 against the deployed Vercel registry. Six producer commits + three harness commits (separate git, never pushed).

## Context

After session 7 Phase 2 closed 4 of 9 cross-cutting findings, three remained that needed Phase 3:

- F-cross-07 (⚠️ High): cross-component dep declaration drift across 3 sub-shapes (wrong-major / phantom radix-ui / over-declared shadcn primitives). Affirmed across 5 of 9 Tier 1 components.
- F-cross-10 (⚠️ High, NEW): harness `package.json` hygiene drift (wrong-major ranges blocking unrelated installs); the auto-revert anomaly during session 7 Phase 1 was unexplained.
- Smoke verification deferred from Phase 2 — needed Vercel redeploy of `master`.

## Outcome

**F-cross-10 CLOSED (3 harness commits + 1 producer tracker commit):**

- Harness baseline committed at `e2e7a7b` — three drifts in `package.json` reset to producer ground truth (`@types/node ^9.14.0 → ^20`, `react-day-picker ^10.0.0 → ^9.14.0`, `lucide-react ^1.14.0 → ^1.11.0`)
- `pnpm install --frozen-lockfile` pre-flight added to `scripts/smoke-all.mjs` at `d53315a`; aborts with reset hints on drift
- `HARNESS.md` documents baseline + drift workflow + 3 reset cases at the same commit
- `--overwrite` flag added at `879cf8a` after surfacing silent-prompt-abort during smoke verification (post-card-01 + story-viewer-01 returned exit 0 but MISSING install dirs); `KNOWN_MISSING` cleared (flow-canvas-01 now in registry per F-cross-03)
- **Auto-revert mystery resolved:** root cause = `pnpm dlx shadcn add` invokes `pnpm add <pkg>` for procomp meta deps with bare-name versions; cumulative drift across the 36-slug loop. NOT a hook/watcher. The `@types/node: ^9.14.0` value was a separate manual fat-finger from a prior session.

**F-cross-03 + F-cross-05 SMOKE-VERIFIED (post-Vercel-redeploy):**

- flow-canvas-01: 15s pass, 26 files installed → F-cross-03 confirmed live
- comment-thread-01 (12s, 11f), post-card-01 (14s, 13f w/ --overwrite), media-carousel-01 (8s, 9f), story-viewer-01 (10s, 13f w/ --overwrite) → F-cross-05 confirmed live across all 4 carriers

**F-cross-07 CLOSED (3 producer commits):**

- `c3f2ba6` ships `scripts/validate-meta-deps.mjs` (350 lines) covering all 3 sub-shapes + `radix-ui` forbidden-list. Wired as `pnpm validate:meta-deps`.
- Initial run reveals **74 high findings across 32 of 36 components** — much wider than the originally-tracked 5 Tier 1 carriers (audit-systematic-scope memory in action). Breakdown: 37 over-declared-shadcn / 25 version-drift / 8 phantom-npm / 4 forbidden-npm.
- `2f907bd` updates F-cross-07 status with audit data
- `65ccf6f` applies wide-scope sweep across all 32 affected meta.ts files via a one-time fix script (deleted after run): 47 insertions / 55 deletions. Lint: 36/36 clean post-fix.
- `25466df` chains validate-meta-deps into `pnpm registry:build`; `aa89388` chains registry:build into `pnpm vercel-build` so deploys fail fast on drift.

**Step 4 (scaffolder audit):** no-op — `_template/_template/meta.ts` and `scripts/new-component.mjs.writeFreshMeta` already generate empty deps. Widespread drift is from human copy-paste behavior.

## Cross-references

- Phase 4 plan: `.claude/PHASE-4-PLAN.md`
- Tracker rows: docs/reviews/sweep-tracker.md (F-cross-07, F-cross-10, F-cross-03, F-cross-05 status cells)
- Harness git: `e:/tmp/ilinxa-smoke-consumer/.git` (separate; not pushed to a remote)
- Decision-question format memory locked from this session's interactions
