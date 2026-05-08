---
date: 2026-05-09
session: 7b
phase: 5
type: fix
commits: [153949c, 80f60b3, 3240ba0, 2c04587, 396c986, 9dd33cc]
components: [kanban-board-01, rich-card, flow-canvas-01, data-table, workspace, markdown-editor, properties-form, entity-picker]
findings: []
status: shipped
---

# Session 7b Phase 5 — per-component v0.1.1 patches across 8 Tier 1 components

## Summary

Phase 5 of the master-plan §7 mid-sweep checkpoint. After F-cross-06/F-cross-07/F-cross-08 closed sweep-wide in sessions 7+7b Phase 3, the remaining backlog was per-component findings — substantive code fixes (3 components), plan-doc nits (~14 items across 6 components), and version bumps. Six producer commits across 8 Tier 1 components.

## Context

Tier 1 reviews (sessions 1-6) surfaced 53 component-level findings. Many closed sweep-wide:

- All "F-04 usage.tsx import drift" findings → closed by F-cross-06 (commit fb23a2b)
- All `process.env.NODE_ENV` findings → closed by F-cross-08 (commit b807e35)
- All version-drift / phantom-npm / over-declared-shadcn → closed by F-cross-07 (commit 65ccf6f)

Remaining per-component work fell into three buckets: substantive code fixes (3), plan-doc nits (~14), kanban dead-code (2 items).

## Outcome

**Substantive code fixes (3 commits):**

- `80f60b3` kanban-board-01 F-01 — KanbanNoteView + KanbanNoteEditForm hardcoded `bg-amber-*`/`text-amber-*` palette violation. Replaced with `findSwatch` + `swatchCssColor` against DEFAULT_PALETTE; `data.color` (already on KanbanNoteData type) wired to render. Default "amber" preserves visual via --chart-1 token.
- `3240ba0` rich-card v0.4.1 — removed unwired `virtualize` prop + dead `useTreeVirtualizer` hook + `@tanstack/react-virtual` dep. The prop existed in types since v0.3 but was never wired into rich-card.tsx; the published claim ("Opt-in virtualization for trees > 500 nodes") was unmet. Wiring deferred to v0.5 alongside the markdown adapter. Doc updates across 8 spots in guide.md keep the public framing honest.
- `2c04587` workspace F-01 — `flattenSubtreesPastDepth` previously called `collapseToFirstLeaf` when a subtree was beyond the breakpoint depth cap, silently discarding every leaf except the leftmost (Q12 contract violation). Replaced with `collapseToBalancedSplits` that gathers all leaves via `flattenLeavesInOrder` and rebuilds a balanced binary chain inheriting the over-depth split's orientation. Documented stopgap; v0.2 will add a `stack` kind to AreaTree.

**Plan-doc + meta.related nits (`153949c` — 17 files):**

- 6 component metas updated (`related` populated; flow-canvas-01 deps under-declaration fixed retroactively)
- workspace plan: §2 reducer-action union swapped `preset` → `focus` (matches source); §5.3 amended to chevron-menu pattern; §9 separator struck
- markdown-editor plan §3.3 (`getView()` type EditorView | null), §3.1 (label sentinel doc); usage.tsx separator note
- properties-form plan §8.1 (file count 22→25); entity-picker plan §6.3 (useState-as-callback-ref note)
- flow-canvas-01 plan: appended "Implementation deviations" section (35→30 file count); STATUS.md file count fix (39→30)
- review-guide §3 split into "simple primitive" vs "host pattern"
- Kanban: deleted empty stub use-keyboard-actions.ts; removed from registry.json; demo.tsx column color "indigo" → "sky"

**Version bumps (`396c986` — 9 files):** kanban-board-01 → 0.2.1; rich-card → 0.4.1; flow-canvas-01 → 0.1.1; data-table → 0.1.1; workspace → 0.1.1; markdown-editor → 0.1.1; properties-form → 0.1.1; entity-picker → 0.1.1. article-body-01 unchanged (everything closed sweep-wide).

**Tracker close (`9dd33cc`):** Phase 5 row added to session log; 7 Tier 1 component rows refreshed with new versions + per-row v0.1.1-shipped citations.

**Verification:** tsc clean across all commits; lint 0 errors / 0 warnings (the 2 unused-import warnings in validate-meta-deps.mjs that surfaced post-rich-card-removal also fixed in `3240ba0`); validate-meta-deps 36/36 clean.

## Cross-references

- Phase 4 plan: `.claude/PHASE-4-PLAN.md`
- Per-component v0.1.1 backlog: HANDOFF-sweep-paused-session-7.md §"Per-component v0.1.1 patch backlog"
- Tracker rows updated for 7 of 9 Tier 1 components (article-body-01 unchanged)
