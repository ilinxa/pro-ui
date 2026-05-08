# Session 8 starter prompt

We're starting session 8 of the procomp review sweep. **Mid-sweep checkpoint Phases 1-6 are fully closed** as of session 7d. Tier 1 is done at 9/9. Now Tier 2 spot-checks begin.

Read the handoff first — it has everything you need:

  e:/2026/ilinxaDOC/ilinxa-ui-pro/.claude/HANDOFF-sweep-paused-session-7d.md

The handoff covers:
- TL;DR + read order (11 files in priority order)
- Per-session summary of sessions 7 / 7b / 7c / 7d (16 producer commits + 3 harness commits)
- Tier 1 progress (9/9 reviewed; all v0.1.1 patches shipped)
- Tier 2 schedule for sessions 8-12
- Smoke harness state (CLI pinned shadcn@4.6.0; pre-flight; --overwrite required)
- Cross-cutting findings (8 closed / 2 open: F-cross-01 Tier 2 + F-cross-04 offline build env)
- Conventions post-Phase-6 (lean STATUS.md; per-decision files; b3 hybrid)

After the handoff, read these in order:
- `.claude/STATUS.md` (lean snapshot, ~8KB; single Read works)
- `.claude/decisions/2026-05-09-session-7d-phase-6.md` (most recent context)
- `docs/reviews/sweep-tracker.md` (live state — Tier 2 rows for session 8)
- `docs/reviews/templates/review-spotcheck.md` (the Tier 2 template you'll instantiate)

## Session 8 work

5 Tier 2 spot-checks (25-35 min hard time-box each):

1. `category-cloud-01` (forms)
2. `filter-bar-01` (forms)
3. `filter-stack` (forms — **author guide.md as part of the review** per F-cross-01 Tier 2 carrier convention; this closes one of the 2 remaining F-cross-01 carriers)
4. `grid-layout-news-01` (layout)
5. `author-card-01` (marketing)

## Workflow per spot-check

1. `cp docs/reviews/templates/review-spotcheck.md docs/procomps/<slug>-procomp/reviews/2026-05-XX-v<version>-spotcheck.md`
2. Read description + plan + guide (each component already has all 3 — verify with `ls docs/procomps/<slug>-procomp/`)
3. Read `<slug>.tsx` + spot-check `parts/` if any
4. Run `pnpm tsc --noEmit && pnpm lint && pnpm validate:meta-deps`
5. Single-slug smoke from harness — but **reset baseline first**:
   ```bash
   cd e:/tmp/ilinxa-smoke-consumer
   git checkout -- package.json pnpm-lock.yaml
   pnpm install --frozen-lockfile
   node scripts/smoke-all.mjs --slug <name>
   ```
6. Author at most 5 findings per spot-check; pick 1 rotating dimension to dive on
7. Verdict + sign-off

## At session 8 sign-off

- One decision file at `.claude/decisions/2026-05-XX-session-8-tier2-batch-1.md`
- Update `.claude/STATUS.md` "Recent activity" pointer list (keep top-5)
- Update `docs/reviews/sweep-tracker.md` (Tier 2 rows; smoke runs row; F-cross-01 status when filter-stack guide lands)
- Push to `origin/master` (triggers Vercel redeploy with the validate-meta-deps gate)

## Don't

- Re-litigate API choices (planning docs locked them)
- Author new cross-cutting findings unless something genuinely surfaces — the lint + smoke harness + per-decision convention are guards
- Push the smoke harness's git (it's local-only at `e:/tmp/ilinxa-smoke-consumer/`)
- Append to STATUS.md verbose entries — use `.claude/decisions/<date>-<slug>.md` instead
- Edit STATUS-archive.md (frozen)
- Touch the handoff doc, prior session handoffs, or PHASE-4-PLAN.md (frozen historical references)

After reading the handoff + STATUS + tracker + spot-check template, summarize what you understood in 5-7 short bullets so I can confirm you have the picture before we start the first spot-check.

Don't author plans, modify code, or run tools until I explicitly say which component to start with.
