---
date: 2026-05-25
session: workspace v0.1.3 patch (F-03 close-out)
phase: post-Phase-A polish (between v0.1.2 ship and v0.2.0 Phase B start)
type: patch-ship
commits: [48a503c]
components: [workspace]
findings: [F-03]
status: shipped
---

# 2026-05-25 — workspace v0.1.3 (F-03 close-out)

## Context

v0.1.2 shipped + pushed earlier this session ([decision-file](2026-05-24-workspace-v0.1.2-deep-review-closeout.md), [HANDOFF](../HANDOFF-2026-05-25-workspace-v0.1.2-shipped-locally-phase-b-queued.md)). GATE 3 spotcheck ([reviews/2026-05-24-v0.1.2-spotcheck.md](../../docs/procomps/workspace-procomp/reviews/2026-05-24-v0.1.2-spotcheck.md)) Pass with follow-ups; F-01 (path-b smoke deferred) was closed in commit `3a6f707` post-push. **Two follow-ups remained**: F-02 🔸 Medium = Phase B v0.2.0 backlog (long-arc; deferred); F-03 🔹 Low = decide whether to un-export or document `useResizeKeyboard` (this patch).

## Decision

**Hybrid of (a) un-export and (b) document.** The spotcheck author's option (a) — "keep it module-private to the workspace folder" — isn't strictly reachable in a sealed-folder shipment: `useResizeKeyboard` lives in `hooks/use-keyboard-actions.ts` and is sibling-imported by `workspace.tsx`, so the `export` keyword has to stay. Even with the export keyword gone, consumers could still deep-import — the folder ships intact. The realistic interpretation of "un-export" in this distribution model is **mark it not-for-public-use** via convention.

Two restructure-heavier alternatives were considered and rejected:

1. **Merge `useResizeKeyboard` into `useKeyboardActions`** so workspace.tsx has a single import. Rejected — `useKeyboardActions` returns a kit of callbacks; `useResizeKeyboard` is a pure side-effect hook with three additional required inputs (`enabled`, `dividers`, `renderedTree`). Merging widens the wrapper signature and couples unrelated concerns. `useKeyboardActions` would still be deep-importable, so the surface concern doesn't actually shrink.
2. **Inline `useResizeKeyboard` back into `workspace.tsx`.** Rejected — undoes the v0.1.2 A-3 refactor (workspace.tsx loses 7 lines, gains 55).

Chosen close: `@internal` JSDoc tag explaining the contract is not stable + a clarifying note in the procomp guide's "Public API surface" reference. Matches what other libraries do for similar internal-but-syntactically-exported symbols. Zero code restructure.

## Changes

| File | Change |
|---|---|
| [`hooks/use-keyboard-actions.ts`](../../src/registry/components/layout/workspace/hooks/use-keyboard-actions.ts) | Added 8-line `@internal` JSDoc block above `useResizeKeyboard` (explains the hook exists to keep `workspace.tsx` lean, is not in `index.ts`, inputs are derived state, may change in any patch). |
| [`workspace-procomp-guide.md`](../../docs/procomps/workspace-procomp/workspace-procomp-guide.md) "Public API surface" line (Reference §) | Appended: "Anything not re-exported by `index.ts` is internal and may change in any patch — e.g. `useResizeKeyboard` is `@internal`-tagged in v0.1.3 and exists only to keep `workspace.tsx` lean; do not deep-import it." |
| [`workspace-procomp-guide.md`](../../docs/procomps/workspace-procomp/workspace-procomp-guide.md) Migration notes § | New `### v0.1.2 → v0.1.3 (2026-05-25)` block. |
| [`meta.ts`](../../src/registry/components/layout/workspace/meta.ts) | `version: "0.1.2"` → `"0.1.3"`; `updatedAt: "2026-05-24"` → `"2026-05-25"`. |
| [`docs/component-versions.md`](../../docs/component-versions.md) | workspace row bumped 0.1.2 → 0.1.3; new v0.1.3 entry at top of Bumps log. |
| [`docs/procomps/workspace-procomp/reviews/2026-05-24-v0.1.2-spotcheck.md`](../../docs/procomps/workspace-procomp/reviews/2026-05-24-v0.1.2-spotcheck.md) | F-03 marked ✅ CLOSED 2026-05-25 with full resolution note; follow-ups table updated. |
| [`.claude/STATUS.md`](../STATUS.md) | New top-banner row for v0.1.3 ship; workspace components-table row 0.1.2 → 0.1.3. |

## Public API impact

**None.** No exported symbol changed; no signature changed; no runtime behavior changed. Convention-only.

## GATE 3 status

**Exempt** per [`.claude/rules/component-readiness-review.md`](../rules/component-readiness-review.md): patch bumps `v0.1.x → v0.1.y` that don't touch public API don't trigger the spot-check. v0.1.2's verdict carries forward.

## Verification

- `pnpm tsc --noEmit` → exit 0
- `pnpm eslint src/registry/components/layout/workspace/hooks/use-keyboard-actions.ts` → exit 0
- `pnpm validate:meta-deps` → 49/49 clean
- No `registry.json` changes (file list unchanged); `pnpm vercel-build` will rebuild artifacts on push

## Status of v0.1.2 spotcheck follow-ups (all three resolved)

| ID | Resolution |
|---|---|
| F-01 🔹 Low (path-b smoke deferred) | ✅ Closed 2026-05-25 via push+smoke (commit `3a6f707`); 0 workspace-scoped tsc errors against deployed Vercel artifact. |
| F-02 🔸 Medium (Phase B v0.2.0 backlog) | **Open — queued for v0.2.0.** Plan at [`C:/Users/AsiaData/.claude/plans/lets-create-a-comprehensive-proud-cloud.md`](file:///C:/Users/AsiaData/.claude/plans/lets-create-a-comprehensive-proud-cloud.md). |
| F-03 🔹 Low (`useResizeKeyboard` undocumented) | ✅ Closed 2026-05-25 here in v0.1.3. |

## What's next

Phase B (v0.2.0) is the only remaining workspace work item — alpha→beta promotion ship comprising B-1..B-9 (imperative `WorkspaceHandle`, `stack` kind in `AreaTree`, `onResize`/`onLayoutChange` split, undo/redo, touch/pen gestures, multi-edge linked resize, full 16-dim checklist review). Effort ~3–4 days; has 4 breaking changes (TS-only B-2; subtle B-3; mobile default B-5; default behavior B-6) all opt-back-in-able.
