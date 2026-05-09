---
date: 2026-05-09
session: 11
type: review
commits: [8cc060d, 44080b4, a259afc, 49e943e, af03a44, 11373ec]
components: [event-card-01, project-card-01, people-grid-01, info-list-01, progress-timeline-01, expandable-text-01]
findings: []
status: shipped
---

# Session 11 — Tier 2 batch 4: 6 spot-checks (data part 2)

## Summary

Tier 2 sweep batch 4 of 5. Spot-checked 6 components (all data category) using the 4-fixed-core + 1-rotating-dim spotcheck template. All 6 verdicts: **Pass with follow-ups**. **Tier 2 progress: 22 of 27 done — only 5 remain for session 12.** F-cross-06 regression-check ✓ on all 6 (sample-grep of usage.tsx import paths). **Critical finding:** expandable-text-01 F-01 confirms post-card-01 F-01 (s10) as a **library-wide latent failure mode** — escalate to F-cross-NN at sweep close (s13).

## Context

Session 11 continued the largest→smallest pacing pattern. 6 components, all data-category Tier 2 cards + primitives. All have description/plan/guide present (no F-cross-01 work). Two unusual folder shapes investigated (info-list-01's `dummy-data.tsx` extension, progress-timeline-01's `lib/`-only shape) — both confirmed legitimate (JSX in fixtures, primitive variant respectively), not drift.

Session-11 plan was self-audited before execution: revised progress-timeline-01 from Dim 3 → Dim 6 to vary rotating dim distribution + better load-bearing fit. Added F-cross-06 regression-check to risk watchlist (sample-grep on all 6 usage.tsx files).

## Outcome

### 6 spot-check review files authored

| # | Component | Rotating dim | Verdict | Findings | Smoke | Commit |
|---|---|---|---|---|---|---|
| 1 | `event-card-01` | 11 — UI copy / text | Pass with follow-ups | 2 (1 🔸 M, 1 🔹 L) | ✓ pass 51s | `8cc060d` |
| 2 | `project-card-01` | 2 — Public API | Pass with follow-ups | 2 (2 🔹 L) | ✓ pass 9s | `44080b4` |
| 3 | `people-grid-01` | 8 — Performance | Pass with follow-ups | 2 (2 🔹 L) | ✓ pass 5.6s | `a259afc` |
| 4 | `info-list-01` | 7 — Accessibility | Pass with follow-ups | 2 (2 🔹 L) | ✓ pass 8.6s | `49e943e` |
| 5 | `progress-timeline-01` | 6 — Design system | Pass with follow-ups | 1 (1 🔸 M) | ✓ pass 6.5s | `af03a44` |
| 6 | `expandable-text-01` | 14 — Cross-component coherence | Pass with follow-ups | 2 (1 🔸 M, 1 🔹 L) | ✓ pass 3.8s | `11373ec` |

**Total findings:** 11 across 6 components. **3 🔸 Medium**, 8 🔹 Low. No findings exceeded the 5-cap; no component triggered "promote to Tier 1".

### Critical finding for sweep-close (F-cross-NN candidate)

**expandable-text-01 F-01 confirms post-card-01 F-01 (s10) as a library-wide latent failure mode.** 2 of 16 reviewed Tier 2 components demonstrate the cross-folder import brittleness shape — shadcn rewrites producer-side `@/registry/components/data/<slug>` (folder) → consumer-side `@/components/<slug>/<slug>` (filename-direct, bypassing `index.ts` barrel). Today this works for symbols re-exported from `<slug>.tsx`; it would silently break for symbols only re-exported via `index.ts` (e.g., `useLineClampDetect` lives in `hooks/`). Smoke harness only checks `shadcn add` succeeds, not consumer-side `tsc`.

**Action:** Escalate to F-cross-NN at sweep close (session 13 rollup). Per the audit-systematic-scope memory, 2 confirmed shapes is enough signal to warrant a library-wide audit + fix (3 paths: doc the constraint / extend smoke harness / realign import paths).

### Other substantive Mediums to track for v0.1.x

3 🔸 Mediums total this batch:

1. **event-card-01 F-01** — Pluralization bug on `daysUntilSuffix` + `spotsLeftSuffix` ("1 days left" / "1 spots left"). Recommend formatter callbacks with `Intl.PluralRules`.

2. **progress-timeline-01 F-01** — 3-state status (before/active/after) has NO visual color differentiation. Bar + marker are always lime regardless of state; only caption text changes. Add status-conditional bar + marker colors per the color-AND-text pattern from event-card-01.

3. **expandable-text-01 F-01** — see F-cross-NN escalation above.

### F-cross-06 regression-check ✓ on all 6

Per the risk watchlist from session-11 plan: sampled `usage.tsx` import paths on all 6 components. All use consumer-side `@/components/<slug>/...` paths correctly. F-cross-06 fix from `fb23a2b` (s7) holds at 14/16 reviewed Tier 2 components (8 from sessions 8-9 + 6 from session 11; session 10 verified content-card-news-01 explicitly).

### No new F-cross-NN escalations beyond the post-card / expandable-text confirmation

The 3 Mediums in this batch are per-component fixes — no sweep-wide pattern. The cross-folder import brittleness IS the sweep-wide pattern, escalating to F-cross-NN.

### Verification

- **Session start:** tsc 0, lint 0, validate-meta-deps 36/36 clean (Phase 3 baseline intact).
- **Session end:** tsc 0, lint 0, validate-meta-deps 36/36 clean.
- **Smoke harness:** all 6 single-slug smokes ran with reset baseline before each run. event-card-01 took 51s (capacity-bar pulls shadcn `progress` + heaviest content config); others 4-9s.

### Tracker updates

- 6 Tier 2 rows in `docs/reviews/sweep-tracker.md` flipped ⚪ → 🟢.
- 1 new "Smoke runs" row added.
- 1 new session-log row at strict reverse-chronological top.

### Session 11 progress vs master plan

**Tier 2 progress: 22 of 27 done.** Remaining: **5 components for session 12** — registration-card-01, schedule-list-01, story-rail-01, thumb-list-01, **detail-panel** (closes the last F-cross-01 carrier with its guide.md authored alongside the review).

## Cross-references

- Tracker rows: 6 Tier 2 rows; session log row "11 — Tier 2 batch 4"; smoke runs row.
- Review files (6):
  - `docs/procomps/event-card-01-procomp/reviews/2026-05-09-v0.1.0-spotcheck.md`
  - `docs/procomps/project-card-01-procomp/reviews/2026-05-09-v0.1.0-spotcheck.md`
  - `docs/procomps/people-grid-01-procomp/reviews/2026-05-09-v0.1.0-spotcheck.md`
  - `docs/procomps/info-list-01-procomp/reviews/2026-05-09-v0.1.0-spotcheck.md`
  - `docs/procomps/progress-timeline-01-procomp/reviews/2026-05-09-v0.1.0-spotcheck.md`
  - `docs/procomps/expandable-text-01-procomp/reviews/2026-05-09-v0.1.0-spotcheck.md`
- Spotcheck template: `docs/reviews/templates/review-spotcheck.md`
- Master plan §"Session schedule": `~/.claude/plans/now-as-we-have-snazzy-raccoon.md`
- Prior decision file: `.claude/decisions/2026-05-09-session-10-tier2-batch-3.md` (Tier 2 batch 3)
- **Related sweep-close concern:** post-card-01 F-01 (s10) + expandable-text-01 F-01 (s11) → F-cross-NN candidate at s13.

**Tier 2 progress: 22 of 27 done.** Session 12 closes the remaining 5 (including detail-panel guide authoring → closes F-cross-01 final carrier). Session 13: sweep close + rollup + F-cross-NN evaluation.
