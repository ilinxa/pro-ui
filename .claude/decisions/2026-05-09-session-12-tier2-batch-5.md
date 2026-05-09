---
date: 2026-05-09
session: 12
type: review
commits: [6390239, b5d7ceb, a716209, adb0d9b, 1ce7b79, 9514496]
components: [detail-panel, story-rail-01, registration-card-01, schedule-list-01, thumb-list-01]
findings: [F-cross-01]
status: shipped
---

# Session 12 — Tier 2 batch 5 (FINAL): 5 spot-checks + detail-panel guide

## Summary

**FINAL Tier 2 batch.** Spot-checked 5 components (4 data + 1 feedback) using the spotcheck template. All 5 verdicts: **Pass with follow-ups**. Authored `detail-panel-procomp-guide.md` (~530L workspace template) alongside the spot-check — **closes the LAST F-cross-01 carrier library-wide.** **Tier 2 progress: 27 of 27 done — Tier 2 complete.** Session 13 next: sweep close + rollup + F-cross-NN evaluation.

## Context

Session 12 completes the Tier 2 review sweep started in session 8. 5 sessions (8-12), 27 components reviewed, 5 cross-cutting regression-checks (F-cross-01 / F-cross-05 / F-cross-06 / F-cross-07 / F-cross-08) — all hold.

Same workflow as sessions 8-11: largest→smallest pacing, distinct rotating dims (2 / 14 / 11 / 6 / 4 — 5 different), F-cross-06 sample-grep on every usage.tsx, decision file with proactive `commits[]` backfill, session-log row at strict reverse-chronological top.

## Outcome

### 5 spot-check review files + 1 guide authored

| # | Component | Rotating dim | Verdict | Findings | Smoke | Commit |
|---|---|---|---|---|---|---|
| 1 | `detail-panel` | 2 — Public API | Pass with follow-ups | 3 (1 🔸 M, 2 🔹 L) | ✓ pass 53s | `6390239` |
| — | `detail-panel` guide.md | — | — | — | — | `b5d7ceb` |
| 2 | `story-rail-01` | 14 — Cross-component coherence | Pass with follow-ups | 1 (1 🔹 L) | ✓ pass 7.3s | `a716209` |
| 3 | `registration-card-01` | 11 — UI copy / text | Pass with follow-ups | 2 (1 🔸 M, 1 🔹 L) | ✓ pass 6.4s | `adb0d9b` |
| 4 | `schedule-list-01` | 6 — Design system | Pass with follow-ups | 1 (1 🔹 L) | ✓ pass 6.8s | `1ce7b79` |
| 5 | `thumb-list-01` | 4 — Demo + usage | Pass with follow-ups | 2 (2 🔹 L) | ✓ pass 6.6s | `9514496` |

**Total findings:** 9 across 5 components. **2 🔸 Medium**, 7 🔹 Low. No findings exceeded the 5-cap; no component triggered "promote to Tier 1".

### F-cross-01 FULLY CLOSED ✅

The detail-panel guide commit (`b5d7ceb`, ~530L workspace template) closes the last F-cross-01 carrier. Library-wide status:

| Carrier | Closed in | Commit |
|---|---|---|
| `data-table` (full trio: description + plan + guide) | s7c | `5389bee` |
| `properties-form` guide | s7c | `d169815` |
| `entity-picker` guide | s7c | `96588dd` |
| `markdown-editor` guide | s7c | `e6aa688` |
| `filter-stack` guide | s8 | `b0c2509` |
| `detail-panel` guide | **s12** | `b5d7ceb` |

**All 36 components now have full description + plan + guide procomp doc trio.** F-cross-01 status: **CLOSED**.

### Recurring patterns confirmed for session-13 F-cross-NN escalation

Session 12 confirmed two systemic patterns ready for sweep-close evaluation:

1. **Cross-folder import brittleness** (post-card-01 F-01 s10 + expandable-text-01 F-01 s11) — `@/registry/...` rewrites to filename-direct, bypassing index.ts barrel. 2 of 27 reviewed Tier 2 components show the latent failure shape. Smoke harness only checks `shadcn add` succeeds, not consumer-side `tsc`.

2. **Positional callback signatures** (4 occurrences across grid-layout-news / content-card-news / project-card / story-rail) — per Dim 2 review-guide bad-signal. Per audit-systematic-scope memory, 4 is enough to confirm systemic. Likely more in Tier 1 (workspace, kanban-board, flow-canvas, rich-card cards).

Both should be promoted to F-cross-NN at session 13 rollup with library-wide migration plans.

### Substantive Mediums to track for v0.1.x

Total Mediums across sessions 8-12: **14 entries** (running tally):

| Severity | Source | Item | Bundle target |
|---|---|---|---|
| 🔸 M | s12 detail-panel F-02 | ariaLabel optional but role=region requires | v0.1.1 |
| 🔸 M | s12 registration-card F-01 | `spotsLeftSuffix` pluralization | **bundle with event-card F-01** |
| 🔸 M | s11 event-card F-01 | `daysUntilSuffix` + `spotsLeftSuffix` pluralization | **bundle with registration-card F-01** |
| 🔸 M | s11 progress-timeline F-01 | 3-state status no visual color encoding | v0.1.1 |
| 🔸 M | s11 expandable-text F-01 | Cross-folder import (s13 F-cross-NN) | s13 |
| 🔸 M | s10 post-card F-01 | Cross-folder import (s13 F-cross-NN) | s13 |
| 🔸 M | s10 engagement-bar F-01 | utils/ → lib/ rename | v0.1.1 |
| 🔸 M | s10 media-carousel F-01 | Embla keyboard plugin | v0.1.1 |
| 🔸 M | s10 media-carousel F-02 | inert on inactive slides | v0.1.1 |
| 🔸 M | s9 page-hero F-01 | white-on-lime mandate concern | v0.1.1 |
| 🔸 M | s8 grid-layout-news F-01 | useMagazineFilter JSDoc/impl drift | v0.1.1 |
| 🔸 M | s8 filter-stack F-02 | Demo doesn't exercise onFilteredChange | v0.1.1 |

Plus dozens of Lows (paired Date.now → performance.now, copy nits, demo gaps, etc).

**Recommendation for s13:** Plan a **Phase 7 patch session** between s13 close and v0.1.1 release that bundles:
- Pluralization fixes (event-card + registration-card)
- engagement-bar utils/ → lib/ rename
- media-carousel keyboard + inert
- page-hero white-on-lime
- progress-timeline status colors
- detail-panel ariaLabel
- The 3-component Date.now → performance.now batch

### F-cross-06 regression-check ✓ on all 5

Per the risk watchlist: sampled `usage.tsx` import paths on all 5 components. All use consumer-side `@/components/<slug>/...` paths correctly. F-cross-06 fix from `fb23a2b` (s7) holds at **27/27 reviewed Tier 2 components** (sessions 8-12 all verified).

### Verification

- **Session start:** tsc 0, lint 0, validate-meta-deps 36/36 clean.
- **Session end:** tsc 0, lint 0, validate-meta-deps 36/36 clean.
- **Smoke harness:** all 5 single-slug smokes ran with reset baseline. detail-panel 53s (compound + skeleton + button). Others 6-8s.

### Tracker updates

- 5 Tier 2 rows in `docs/reviews/sweep-tracker.md` flipped ⚪ → 🟢 (final 5).
- 1 new "Smoke runs" row.
- 1 new session-log row at strict reverse-chronological top.
- **F-cross-01 row: status = ✅ CLOSED** (last carrier closed).

### Tier 2 final state

**27 of 27 reviewed.** 0 components remaining. Sweep close + rollup at session 13.

Cross-cutting findings final state going into s13:
| ID | Status | Notes |
|---|---|---|
| F-cross-01 | ✅ **CLOSED s12** | All 36 components have full doc trio |
| F-cross-02 | ✅ Closed s7d | STATUS.md split + decisions/ convention |
| F-cross-03 | ✅ Closed s7 | flow-canvas-01 shipped |
| F-cross-04 | Open (deferred) | Offline build env; separate plan |
| F-cross-05 | ✅ Closed s7 | 44 namespaced refs; smoke-verified |
| F-cross-06 | ✅ Closed s7 | 37 usage.tsx normalized; 27/27 reg-checks ✓ |
| F-cross-07 | ✅ Closed s7b | validate-meta-deps lint shipped |
| F-cross-08 | ✅ Closed s7 | process.env.NODE_ENV gates allowed |
| F-cross-09 | ✅ Closed s7 | shadcn CLI pinned to @4.6.0 |
| F-cross-10 | ✅ Closed s7b | smoke harness baseline |
| **F-cross-NN candidate (cross-folder imports)** | **Pending s13** | s10 + s11 confirm 2-occurrence systemic |
| **F-cross-NN candidate (positional callbacks)** | **Pending s13** | 4-occurrence systemic |

## Cross-references

- Tracker rows: 5 Tier 2 rows; session log row "12 — Tier 2 batch 5 (FINAL)"; smoke runs row; F-cross-01 row updated to CLOSED.
- Review files (5):
  - `docs/procomps/detail-panel-procomp/reviews/2026-05-09-v0.1.0-spotcheck.md`
  - `docs/procomps/story-rail-01-procomp/reviews/2026-05-09-v0.1.0-spotcheck.md`
  - `docs/procomps/registration-card-01-procomp/reviews/2026-05-09-v0.1.0-spotcheck.md`
  - `docs/procomps/schedule-list-01-procomp/reviews/2026-05-09-v0.1.0-spotcheck.md`
  - `docs/procomps/thumb-list-01-procomp/reviews/2026-05-09-v0.1.0-spotcheck.md`
- New guide: `docs/procomps/detail-panel-procomp/detail-panel-procomp-guide.md` (closes F-cross-01)
- Spotcheck template: `docs/reviews/templates/review-spotcheck.md`
- Master plan §"Session schedule": `~/.claude/plans/now-as-we-have-snazzy-raccoon.md`
- Prior decision file: `.claude/decisions/2026-05-09-session-11-tier2-batch-4.md`

**Tier 2 complete: 27 of 27.** Session 13: sweep close + rollup + F-cross-NN evaluation + Phase 7 v0.1.x patch session planning.
