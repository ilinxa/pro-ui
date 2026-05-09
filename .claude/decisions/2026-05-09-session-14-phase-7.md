---
date: 2026-05-09
session: 14
phase: 7
type: phase-close
commits:
  - 3443262
  - c895a5b
  - 00ffc70
  - d7c5ad6
  - dcb0973
  - 703d05b
  - 482141f
  - 6a62b72
  - 107fb3f
  - 50320ca
components:
  - event-card-01
  - registration-card-01
  - engagement-bar-01
  - media-carousel-01
  - page-hero-news-01
  - progress-timeline-01
  - detail-panel
  - story-viewer-01
  - video-player-01
  - grid-layout-news-01
findings:
  - F-cross-11 (closed via doc-path)
status: complete
---

# Session 14 — Phase 7 v0.1.x patch session COMPLETE

10 logical groups (A–J) executed sequentially, one commit per group, plus this decision file. All 14 Mediums from the Tier 2 sweep + paired Lows shipped in a single session. tsc / lint / validate-meta-deps stayed clean at every commit.

## Summary

Phase 7 was the v0.1.x patch session that followed sweep-close in session 13. The plan at `.claude/PHASE-7-PLAN.md` bundled 14 Medium findings + ~10 paired Lows from sessions 8–12 into 10 groups. This session executed all 10 groups + the close commit + this decision file. F-cross-11 closed via doc-path mitigation. F-cross-12 stays open as a v0.2 candidate (breaking change, out of Phase 7 scope).

## Group log

| Group | Commit | Components | Severity bundle | Notes |
|---|---|---|---|---|
| A | `3443262` | event-card-01, registration-card-01 | 2 × 🔸 Medium | Pluralization via `Intl.PluralRules`. New `formatDaysUntilSuffix` / `formatSpotsLeftSuffix` callbacks with English-plural-rules defaults; legacy `labels.daysUntilSuffix` / `spotsLeftSuffix` kept and `@deprecated` (back-compat). Suffix-only (not full-label) shape preserves the BIG-number / small-suffix stacked visual across grid/feed/list parts. |
| B | `c895a5b` | engagement-bar-01 | 🔸 Medium | `git mv` `utils/format-count.ts` → `lib/format-count.ts`. Single sealed-folder convention now uniform. Updated 1 import in `engagement-bar-01.tsx`, 1 re-export in `index.ts`, 1 path in `registry.json`. |
| C | `00ffc70` | media-carousel-01 | 2 × 🔸 Medium | Plan-deviation: `embla-carousel-keyboard` package doesn't exist on npm — Embla v8 doesn't ship a keyboard plugin. Wired keyboard nav manually instead (region `tabIndex={0}` + `onKeyDown` handler with ArrowLeft/Right/Home/End, RTL-aware). Plus `inert={!isActive}` on every slide group div (gallery + linear). React 19 supports `inert` natively; tsc clean. |
| D | `d7c5ad6` | page-hero-news-01 | 🔸 Medium + audit-systematic-scope expansion | `text-white` over `from-primary` lime gradient violates the design mandate. Plan flagged 2 carriers (title, description); programmatic grep surfaced 4 more (hero-stats, demo outline button, usage titleSlot example) — all expanded in same commit per audit-systematic-scope feedback memory. `text-accent` titleHighlight intentionally NOT touched (separate decision; --accent in this codebase is cool-gray neutral, not signal-lime). |
| E | `dcb0973` | progress-timeline-01 | 🔸 Medium | 3-state status (before/active/after) gets state-conditional bar fill + marker color. Plan-deviation on color picks: `bg-secondary` rejected because in this codebase `--secondary` = `--card` in light mode (after-bar would be near-invisible). Used the plan's listed alternative `bg-muted-foreground/40` for after-bar, `bg-muted-foreground` for non-active markers. Tailwind v4 canonical syntax `**:data-[slot=progress-indicator]:bg-X` (older `[&_[data-slot]]` form rejected by `suggestCanonicalClasses` lint). Picks marked for design-system-owner review in the procomp guide. |
| F | `703d05b` | detail-panel | 🔸 Medium | New `DetailPanelLabels` interface (single key: `region?: string`) + `DEFAULT_DETAIL_PANEL_LABELS = { region: "Detail panel" }`. Resolution chain in detail-panel.tsx: `ariaLabel` (per-render) > `labels?.region` (static landmark) > default. Re-exported both from index.ts. Procomp guide gotcha #1 fully rewritten with worked examples. Existing demos that pass `ariaLabel` explicitly are unaffected. |
| G | `482141f` | story-viewer-01, video-player-01 | 2 × 🔹 Low (paired) | `Date.now()` → `performance.now()` for elapsed-time sites: 3 in `use-story-progress.ts`, 1 in `use-double-tap.ts`. filter-stack out of scope (recon at session start: 0 Date.now sites). Demo/dummy-data ID generators (`Date.now().toString(36)`) intentionally kept on Date.now (want wall-clock IDs, not monotonic ticks). |
| H | `6a62b72` | grid-layout-news-01 | 🔸 Medium | JSDoc claimed reset-on-dep-change but implementation never wired it. Used React's "adjust state during render" pattern (NOT useEffect — `react-hooks/set-state-in-effect` rejects setState inside effects). Function-typed state needed `useState<typeof fn>(() => fn)` + `setX(() => fn)` to bypass useState's lazy-initializer / updater-fn ambiguity. |
| I | `107fb3f` | (docs only) | F-cross-11 — ⚠️ High cross-cutting | New §11.6 *Cross-folder import constraint* in `docs/component-guide.md` — full mechanic of why shadcn-add path rewrites mismatch sub-folder imports + the rule (only-safe cross-folder import is `<slug>.tsx`) + worked example via media-carousel-01 → video-player-01's `useDoubleTap` re-export. Cross-references added to all 6 affected procomp guides (post-card-01, comment-thread-01, engagement-bar-01, expandable-text-01, video-player-01, story-viewer-01). Sweep tracker F-cross-11 updated: Open → CLOSED (doc path). Paths (b) consumer-tsc smoke harness extension and (c) cross-folder import-path realignment remain v0.2 follow-ups. |
| J | `50320ca` | (multiple, doc-only) | ~10 × 🔹 Low bundled | article-meta-01 align="end" demo tab; filter-stack onFilteredChange demo tab + analytics commentary; grid-layout-news-01 guide adds positional renderItem versioning trap; newsletter-card-01 placeholder "Email address" → "you@example.com"; share-bar-01 demo wires onCopySuccess into copy-events counter; share-bar-01 guide documents successResetMs dual-purpose; content-card-news-01 index.ts re-exports `toDate`; thumb-list-01 demo gains explanatory `<p>` per tab + new "No icon + router link" tab (combines `headerIcon={null}` with a MockRouterLink); schedule-list-01 `w-20` → `w-auto min-w-20` on the time column (both schedule-row.tsx and demo.tsx). |

## Version bumps

10 components bumped:

| Component | From | To |
|---|---|---|
| event-card-01 | 0.1.0 | 0.1.1 |
| registration-card-01 | 0.1.0 | 0.1.1 |
| engagement-bar-01 | 0.1.1 | 0.1.2 |
| media-carousel-01 | 0.1.1 | 0.1.2 |
| page-hero-news-01 | 0.1.0 | 0.1.1 |
| progress-timeline-01 | 0.1.0 | 0.1.1 |
| detail-panel | 0.1.0 | 0.1.1 |
| story-viewer-01 | 0.1.0 | 0.1.1 |
| video-player-01 | 0.1.0 | 0.1.1 |
| grid-layout-news-01 | 0.1.0 | 0.1.1 |

`docs/component-versions.md` refreshed; STATUS.md Components table updated; Highlights snapshot rewritten.

## Cross-cutting state — final

10 of 12 F-cross findings now closed:

- F-cross-01 ✅ closed s12
- F-cross-02 ✅ closed s7d
- F-cross-03 ✅ closed s7
- F-cross-04 — open (deferred; environmental, separate plan)
- F-cross-05 ✅ closed s7
- F-cross-06 ✅ closed s7
- F-cross-07 ✅ closed s7b
- F-cross-08 ✅ closed s7
- F-cross-09 ✅ closed s7
- F-cross-10 ✅ closed s7b
- F-cross-11 ✅ **closed Phase 7 Group I (this session)** — doc-path mitigation
- F-cross-12 — open (v0.2 candidate; breaking change, out of Phase 7 scope)

## Plan deviations

Three deviations from `.claude/PHASE-7-PLAN.md`, all flagged in their respective commit messages:

1. **Group C — keyboard nav implementation.** Plan suggested `pnpm add embla-carousel-keyboard@^8.6.0`; the package doesn't exist on npm (Embla v8 doesn't ship a keyboard plugin). Implemented manually instead: `tabIndex={0}` + `onKeyDown` with the APG carousel pattern. Same finding closed; no dep added.
2. **Group E — color picks.** Plan listed `bg-secondary` for after-bar; `--secondary` in this codebase equals `--card` in light mode, making the bar near-invisible at 100% fill. Used the plan's listed alternative (`bg-muted-foreground/40`) for after-bar.
3. **Group A — formatter shape.** Plan named props `formatDaysUntil(count) => string` (returning the FULL label "5 days left"). Implemented as `formatDaysUntilSuffix(count) => string` returning JUST the suffix word ("days left" / "day left") — preserved the existing BIG-number / small-suffix stacked visual across grid/feed/list parts. Same plural-correctness fix; cleaner mechanical replacement of the prior static-suffix label.

## Verification

- `pnpm tsc --noEmit` clean at every commit (10/10).
- `pnpm lint` clean at every commit (10/10).
- `pnpm validate:meta-deps` reports 36 / 36 clean at every commit.
- Two intermediate fixes within Group A (React Compiler `preserve-manual-memoization` deps) and Group H (React Compiler `set-state-in-effect`) were caught by lint and corrected before commit. No commits landed dirty.

No smoke harness run (no Tier 1 component changed; the Tier 2 component changes are within the existing registry-shipped surface, exercised via tsc + lint + validate-meta-deps + manual review of the procomp guide updates). Single Vercel redeploy will land on the eventual push.

## Push state

11 commits ahead of `origin/master` (10 Phase 7 groups + this decision file + the close commit). Push when ready.

## Going forward

Phase 7 is the last `v0.1.x` blanket session driven by sweep findings. Remaining open work:

- **F-cross-04** — environmental. Separate plan for offline-build resilience.
- **F-cross-12 → v0.2.** Library-wide migration to object-shape callbacks. Scoped per-component; needs deprecation warnings emitted in v0.1.x as a transition.
- **F-cross-11 follow-up (path b/c).** Consumer-tsc smoke harness extension to catch cross-folder import brittleness at producer-side commit time. Currently mitigated by convention only.
- **New components from STATUS.md Roadmap.** Now unblocked: stat-card / empty-state / multi-select / page-header / etc.
- **Force-graph v3.** Frozen at `docs/migrations/force-graph/`; recreation pending design.

## Cross-references

- Phase 7 plan: [`.claude/PHASE-7-PLAN.md`](../PHASE-7-PLAN.md)
- Sweep rollup (predecessor): [`docs/reviews/2026-05-09-sweep-rollup.md`](../../docs/reviews/2026-05-09-sweep-rollup.md)
- Component-guide §11.6 (Group I deliverable): [`docs/component-guide.md`](../../docs/component-guide.md)
- Sweep tracker (F-cross-11 status update): [`docs/reviews/sweep-tracker.md`](../../docs/reviews/sweep-tracker.md)
- Sweep close decision (predecessor session): [`2026-05-09-session-13-sweep-close.md`](2026-05-09-session-13-sweep-close.md)
