---
date: 2026-08-10
session: production-readiness-p1
phase: P1 (plan: docs/production-readiness-plan.md)
type: fix-program (6 batches, 16 component bumps, 2 new validators)
commits: 9de7448 media · fa53691 task · 7085159 calendar/grid · 88e5717 nav/layout · 8216794 misc · b035f51 infra
components: content-composer-01 0.2.2 · media-editor-01 0.1.4 · media-carousel-editor-01 0.1.3 · story-composer-01 0.2.2 · todo-rich-card 0.4.1 · todo-tree 0.3.1 · gantt-timeline-01 0.5.1 · kanban-board-01 0.4.2 · calendar-01 0.2.4 · grid-layout-news-01 0.2.1 · rich-sidebar 0.3.1 · file-tree 0.1.1 · file-manager 0.1.1 · workspace 0.1.4 · code-block 0.1.2 · markdown-editor 0.1.2 · flow-canvas-01 0.2.6 · json-form 0.2.6 · team-feedback-loop-01 0.1.2 · team-trophy-shelf-01 0.1.2 · team-quest-log-01 0.1.2 · share-bar-01 0.1.1 · blackboard-01 0.1.1 (+ article-meta-01, rich-card-in-flow, media-carousel-01 dep declarations, no bump)
findings: closes review §1 (all), §2 (2.1-2.11), §3 (3.1-3.4, 3.8), §5 (all 12), §6 (in-batch mediums), 1E lint 81→0; ledger in review §0
status: shipped + pushed; verification = adversarial×3 pre-ship, browser + consumer smoke post-deploy
---

# P1 — the fix program

Executed the signed-off plan's Phase 1 in one arc: six parallel implementation agents (disjoint folders), three adversarial verification agents over the diffs, coordinator-applied infra + hardenings.

## Method notes worth keeping

- **The adversarial pass earned its place**: the media verifier caught a real ⚠️ regression *introduced by a fix* — the gate's added `editorState` truthiness arm let a discard→publish flow resurrect a discarded hero (the substrate snapshots a truthy empty state on the dirty→false flip while `pendingBlobRef` survived the spread). Fixed with a content-aware `editorStateHasMedia` predicate at all four gate layers + evidence eviction on discard. *Lesson: a fix that widens a predicate beyond the review's prescription needs its own adversarial trace.*
- **The reverse-npm validator out-performed the review**: review 3.3 knew 2 undeclared-dep items; the (b2) check found 6 more (article-meta, content-composer, media-carousel embla-carousel, media-carousel-editor + the pair). Mechanical checks > sampled review for this class.
- **IMPORT_RE precision**: the lazy `[\s\S]*?` bridge in the validator regex matched `export function … "…read state from …"` as an import (pdf-viewer). The tightened declaration-shape regex + comment stripping closed review 3.8's masking class.
- **Cross-agent seams need explicit verification**: calendar (agent B) embeds todo-rich-card (agent C); the date-only round-trip contract between them was verified end-to-end by the reviewer (byte-identical `startAt` on name-only edit, no phantom `onFieldEdited`) — this seam was the highest-risk point of the parallel split and it held.
- **Lint 81→0** with only 3 suppressions, each a documented named false-positive class (render-prop ref-readers ×1, Permissions-API mount query ×1, MediaStream lifecycle chokepoint ×1). The dominant real fix was the "ref-poisoning destructure" (a `ref={obj.field}` JSX ref making the compiler flag every later `obj.*` read — destructure to locals).

## Open follow-ups (owners in review §0 ledger)

Re-export-on-re-edit (composer v0.2.3) · text-export webfonts (media-editor v0.2) · §6 unowned remainders + §7 Lows → P3.4 fix-on-touch · date-only convention 3-copies → P3.5 gamification-kit/family-lib extraction · 2.12 now-prop semantics → P3.4.

## Verification chain

tsc 0 · lint 0 err/10 pre-existing warns · meta-deps 63/63 (with b2) · registry-json 0 high · doc validators ✓ · registry:build ✓ (artifacts regenerated) · next build 72 pages ✓ · adversarial review ×3 (all fixes CONFIRMED-FIXED post-N1) · post-deploy: virtual-browser walkthrough + Base-UI consumer smoke (results appended to STATUS/Recent activity).
