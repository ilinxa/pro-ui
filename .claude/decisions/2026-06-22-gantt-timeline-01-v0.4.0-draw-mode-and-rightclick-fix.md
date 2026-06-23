---
date: 2026-06-22
session: gantt-timeline-01 v0.4.0 — draw-mode toggle + right-click portal fix (finishing the uncommitted WIP)
phase: procomp v0.4.0 (minor — public-API-touching, narrow scope; GATE 3 spot-check, no new GATE 1/2 docs)
type: feature-fix
commits: [pending]
components: [gantt-timeline-01]
findings: [F-01-live-walkthrough-OWED-Med, F-02-no-defaultDrawMode-prop-Low, F-03-draw-insert-index-Low, F-04-alt-captured-at-down-Low]
status: shipped-pending-push
---

# gantt-timeline-01 v0.4.0 — Draw-mode toggle + right-click portal fix

These changes existed as **uncommitted WIP** in the working tree (sitting beside the push-pending `calendar-01` v0.1.0). The user clarified they were **fixes for two reported issues**, then asked to finish + ship them properly. They are bug-driven, but the fix mechanism adds public API and flips a default, so they ship as a **minor**, not a patch.

## The two issues fixed

1. **Draw-vs-pan conflict.** Since v0.2.0 the gantt had "draw on an empty row to create a task," but an empty-row drag *also* wanted to pan. v0.2.1 had already carved out "summary-bracket drag pans, not draw." The full resolution: make drawing an **explicit mode**. The editable toolbar gains a **Draw** toggle (`Pencil`, `aria-pressed`); with it **off** (default) an empty-row drag **pans**, and only with it **on** does an empty-row drag draw a sibling task (crosshair cursor). Bars / edges / brackets still move/resize/group-move directly regardless.

2. **Right-click options did nothing.** The Radix `ContextMenu` content portals to `document.body` but stays a **React** child of the scroll surface, so its pointer/key events bubbled back into the body's gesture handlers and the gutter's keyboard handler — a menu-item click started a canvas gesture that swallowed the item's own `pointerup` (and menu keys double-triggered row nav/delete). Fixed by guarding the three reached handlers with `if (!e.currentTarget.contains(e.target as Node)) return;` — a **DOM**-descendant check that rejects the React-tree-only (portaled) events while accepting real in-canvas presses.

## What changed structurally

The fix for (1) wasn't a bolt-on flag — it was a **rewrite of the press pipeline** from *immediate-classify* (`tryStartEdit` decided edit-vs-pan at `pointerdown`) to **deferred-classify**:

- `onPointerDown` now just records a `Pending` (pointer id, start x/y, start ms, and a `Candidate` from `classifyTarget`) — it commits to nothing.
- The first move past a 4px `DRAG_THRESHOLD` calls `resolvePending`, which picks exactly one gesture: **vertical-dominant → scroll**, **horizontal → the candidate** (`barEdge`→resize / `barBody`→move / `summary`→group-move / `emptyRow`→draw) **or `void`→pan**.
- A release below threshold is a **click → select** (the shape's `onClick`).

This is strictly more robust than the old path: a click can't be mistaken for a 1px pan/edit, and a scroll intent is never hijacked into an edit. `classifyTarget` returns `void` whenever `!editable`, so the read-only path is byte-identical to v1, and the `emptyRow` branch is gated on `ctx.drawMode`.

## Why minor, not patch (the version call)

The user framed these as "fixes," which reads patch. But:
- **New public API** — `GanttContextValue.drawMode` + `setDrawMode` (the type is exported; a hand-assembly can drive its own Draw control off context).
- **Behavior change** — empty-row drag now pans by default instead of drawing. A consumer relying on the old auto-draw loses it unless they toggle Draw.

The patch precedents (v0.2.1 pan-not-draw, v0.3.1 hardening) added **zero** public API — that's what made them clean patches. This touches public API + changes a default, so semver says signal it with a minor. Chosen gate path (recommended to + confirmed by the user): **v0.4.0 minor + GATE 3 spot-check**, **no** retroactive GATE 1/2 description/plan docs (fix-driven, narrow — design rationale lives here instead).

## Files touched (6 source + docs)

| File | Change |
|---|---|
| `types.ts` | `GanttContextValue` += `drawMode` + `setDrawMode` |
| `parts/gantt-timeline-root.tsx` | `useState(false)` for `drawMode`; threaded into ctx |
| `parts/gantt-timeline-toolbar.tsx` | Draw toggle `Button` (editable only; `Pencil`, `aria-pressed`) |
| `parts/gantt-timeline-body.tsx` | deferred-classify pipeline (`Pending`/`Candidate`/`classifyTarget`/`resolvePending`/`edgeAt`); drawMode-gated empty-row branch; portal-target guard on `onPointerDown` + `onKeyDown`; cursor crosshair-in-draw-mode |
| `parts/gantt-timeline-gutter.tsx` | portal-target guard on `onKeyDown` (menu-key double-trigger) |
| `meta.ts` · `registry.json` · `guide.md` · `usage.tsx` · `demo.tsx` | version 0.4.0 + feature bullet + description; surfaces table + Draw-mode paragraph; demo/usage hint |

**No new files, no new deps, no new shadcn primitive** (the Draw button reuses `Pencil` from the already-declared `lucide-react`) → the F-cross-13 cross-backend smoke trigger does not fire.

## Gates

tsc **0** · lint **0 err** (1 pre-existing TanStack Virtual warning) · meta-deps **57/57** · build **66/66** (no SSR err) · registry:build ✓ (artifact spot-checked: `drawMode`/`setDrawMode`/`classifyTarget`/`resolvePending`/`Pencil` + v0.4 description present; no `demo`/`usage`/`meta`). Dev-server SSR of `/components/gantt-timeline-01` on `:3001` returns 200 at v0.4.0 with no error overlay.

## GATE 3

[`reviews/2026-06-22-v0.4.0-spotcheck.md`](../../docs/procomps/gantt-timeline-01-procomp/reviews/2026-06-22-v0.4.0-spotcheck.md) — rotating dim **Robustness** (the gesture-pipeline rewrite's regression surface + the portal-guard correctness). Verdict **Pass with follow-ups**.

## Open follow-ups

- **F-01 (Medium) — live drag-walkthrough: ✅ CLOSED 2026-06-23.** Initially blocked (no X server). Run post-deploy against Production via the dockerized stealth-browser (`virtualbrowser-stealth-browser-1`, after reviving its dead Xvfb display). Both fixes validated live: the **Draw toggle** flips `aria-pressed` + active variant + crosshair cursor (draw-vs-pan), and the **right-click menu opens** with a real menu-item click ("Add task below") **creating a new task** (the swallowed-pointerup bug is gone). Discharges the owed item carried from v0.3.0/v0.3.1 for the rendered/interaction surface. (Pointer-drag reschedule/resize stays gesture-level.)
- **F-02 (Low, v0.4.x):** no `defaultDrawMode` / controlled prop — the toolbar toggle is the only entry (context escape hatch exists for hand-assembly).
- **F-03 (Low, v0.4.x / v2.1):** empty-row draw inserts the sibling at `index + 1`; position-on-draw refinement deferred.
- **F-04 (Low, won't-fix):** snap/Alt captured at `pointerdown` — parity with single-move/group-move.
- Carried: richer group-move per-leaf preview, **resize-the-group**, marquee + multi-select + bulk, virt-suspend-on-gutter-drag, chart `height` prop, Vitest for the pure `lib/` surface.
