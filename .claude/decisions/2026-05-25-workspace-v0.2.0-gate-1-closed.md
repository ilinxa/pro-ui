---
date: 2026-05-25
session: workspace v0.2.0 Phase B — GATE 1 close
phase: pre-implementation planning (post-v0.1.3 ship, pre-GATE 2 plan refresh)
type: gate-1-close
commits: []
components: [workspace]
findings: []
status: gate-closed
---

# 2026-05-25 — workspace v0.2.0 GATE 1 closed (description addendum signed off)

## Context

`workspace` v0.1.3 shipped earlier this session ([decision](2026-05-25-workspace-v0.1.3-f-03-internal-jsdoc.md)) closing the last of the v0.1.2 spotcheck follow-ups (F-03). With F-01 + F-03 both closed, the only remaining workspace work item is Phase B = v0.2.0 alpha → beta promotion. The user picked path A3 from the options list: **"GATE 1 description refresh only"** — author the description addendum, audit it, present for sign-off, stop. Do NOT write the plan or any code in this pass.

## Deliverable

New file: [`docs/procomps/workspace-procomp/workspace-procomp-description-v0.2.0.md`](../../docs/procomps/workspace-procomp/workspace-procomp-description-v0.2.0.md) (~290 lines, 10 sections).

Layered addendum — does NOT replace the canonical [`workspace-procomp-description.md`](../../docs/procomps/workspace-procomp/workspace-procomp-description.md). v0.1.x scope stays frozen as signed-off; this doc carries only the v0.2.0 deltas. Pattern follows the json-form precedent (separate `-v0.2.0.md` doc for the next ship's planning).

## Process

Two-pass authoring per the "re-validation catches real issues" feedback rule:
1. **Initial draft** (~290 lines) — 7 in-scope items, 4 breaking changes inventory, 9 open Q-Ps with recommendations.
2. **Self-audit re-validation pass** — surfaced **1 reversed recommendation (QP-3) + 8 clarifications across the other QPs + 6 cross-section consistency fixes**. All applied pre-sign-off.

User confirmed with "confirmed" → GATE 1 closed.

## Locked Q-Ps (the 9 picks that shape GATE 2)

| Q-P | Topic | Locked answer |
|---|---|---|
| QP-1 | `handle.setLayout()` in controlled mode | (a) consumer-loop with mode-aware behavior: uncontrolled updates internal state + notifies; controlled only notifies. Dev-warn on controlled mode + no `onLayoutChange` set. |
| QP-2 | Undo + external prop change | (b) RHF-`reset()` semantics — external prop reassignment **clears** past + future stacks. Internal dispatches always push to history (Ctrl+Z works in controlled mode). |
| QP-3 | Undo + preset switch | **(b) no — REVERSED during re-validation.** Initial rec was (a) yes. Blender/VSCode precedent: presets are navigation, not edits. Side effect per QP-2: preset switch clears history for new preset's editing session. |
| QP-4 | linkedResize alignment tolerance | (b) ±1px in **computed rect-space, not ratio-space**. Matches existing `useResizeKeyboard` divider hit-test in v0.1.2 (`< 1px` at [`use-keyboard-actions.ts:151`](../../src/registry/components/layout/workspace/hooks/use-keyboard-actions.ts)). |
| QP-5 | linkedResize + minAreaSize collision | (a) clamp-all = most-constrained linked divider governs movement of all linked dividers, preserving alignment even at floor. Per-frame: compute desired delta each, reduce to strictest-achievable, batch-commit. |
| QP-6 | Pen/stylus pointerType | (c) per-type. Mouse engages immediately; touch waits 300ms; pen engages immediately. Forward door: expose `penGestureDelay?: number = 0` in v0.2.x if real pen users report friction. |
| QP-7 | Export `flattenStackToLeaves` helper | (a) yes, bundled with type-export alignment. `AreaTreeStack` joins existing `AreaTreeLeaf` + `AreaTreeSplit` exports; helper is one-line today but insulates against later shape evolution. |
| QP-8 | Phase B ship cadence | (a) bang — single v0.2.0 ship covering all B-1..B-9. Cross-plumbing (stack ↔ linkedResize; onResize ↔ three-defenses) and shared migration guide both favor bang. Caveat: chunked becomes correct only if a real consumer needs additive parts *during* the breaking-bundle development cycle. |
| QP-9 | Ctrl/Cmd+Z vs focused-area native edit context | (b) skip on native edit context. Heuristic: `document.activeElement` matches `:is([contenteditable="true"], [contenteditable=""], textarea, input:not([type="checkbox"]):not([type="radio"]):not([type="button"]):not([type="submit"]), select)`. Escape hatch for custom non-native-edit components: register `onKeyDownCapture` + `stopPropagation` on the area-rendered element. |

## Public API delta locked for v0.2.0

- **+2 types**: `WorkspaceHandle` (17 methods), `AreaTreeStack` (new discriminator member type).
- **+1 helper export**: `flattenStackToLeaves`.
- **+3 props**: `onResize`, `historyDepth` (default 50; 0 disables), `linkedResize` (default true).
- **+1 discriminator arm**: `stack` in `AreaTree` (BC-1, TS-only breaking).
- **1 default change**: `maxSplitDepth.mobile` `0 → 2` (BC-3, runtime breaking-default).
- **1 prop semantics change**: `onLayoutChange` now commit-only — fires on pointer-up of edge-drag and all non-resize action commits (BC-2, subtle breaking).
- **Component identity change**: `Workspace` becomes `forwardRef<WorkspaceHandle, WorkspaceProps>` — runtime identity change only, displayName preserved.

## 4 Breaking changes locked

| ID | What | Opt-back-in |
|---|---|---|
| BC-1 | `AreaTree` widens `leaf \| split` → `leaf \| split \| stack` | Add `case "stack":` arm, use exported `flattenStackToLeaves(node)` helper |
| BC-2 | `onLayoutChange` no longer fires per-frame during resize | `onResize={onLayoutChange}` restores v0.1.x behavior exactly |
| BC-3 | `maxSplitDepth.mobile` default `0 → 2` | `maxSplitDepth={{ mobile: 0 }}` restores v0.1.x mobile-stack-only |
| BC-4 | `linkedResize` defaults to `true` | `linkedResize={false}` restores v0.1.x single-boundary movement |

## What this gate explicitly does NOT do

- Does NOT write the plan. That's GATE 2.
- Does NOT write any code. Pre-implementation.
- Does NOT replace the canonical v0.1.x description doc.
- Does NOT pick the v0.2.0 commit chain structure (decision-file frontmatter / SHA / etc.). Plan-stage / ship-stage concerns.
- Does NOT decide whether to add a Vitest harness for Phase B. Project-wide informed-defer remains in place.

## What's next

GATE 2 = refresh the Phase B section of [`workspace-procomp-plan.md`](../../docs/procomps/workspace-procomp/workspace-procomp-plan.md) to lock the 9 Q-P answers into concrete implementation deltas. The plan already has a working Phase B draft (B-1..B-9); GATE 2 amends it to reflect the locked choices (e.g., adds the `flattenStackToLeaves` helper to B-2's file list; adds the mode-aware behavior to B-1's `WorkspaceHandle` spec per QP-1; etc.).

After GATE 2 signs off → GATE 3 plan-amend complete → implementation begins. Effort estimate from the master plan unchanged: ~3–4 days for the full Phase B ship.

User has the option to either continue with GATE 2 in the same session or pause here cleanly (GATE 1 is committed + pushed; resume is trivial).
