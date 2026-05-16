---
date: 2026-05-17
type: fix
commits: []
components: [flow-canvas-01]
findings: [v0.2.2-followup, v0.2.3-followup]
status: shipped
---

# flow-canvas-01 v0.2.4 — suppress mid-drag onChange + microtask-time drag guard

## Summary

`flow-canvas-01@v0.2.4` ships the THIRD follow-up in the v0.2.2/v0.2.3/v0.2.4 controlled-mode saga. Mid-drag mixed-batch `onChange` notifications + their microtask-deferred snapshots were producing a stale-snapshot race that v0.2.3's structural-equality guard couldn't catch (the snapshot was genuinely stale by the time the structural check ran).

**Trigger:** even after v0.2.3, xyflow's "trying to drag a node that is not initialized" warning (error #015) was still firing during drag on the rich-card-in-flow demo — ~15+ warnings per drag at drag-start, traced through `drag.js → updateNodes → calculateNodePosition`.

**Patch-bump exemption** per the [readiness-review rule](../rules/component-readiness-review.md). Internal-only bug fix, no public API touch, GATE 3 skipped.

### Release notes

> **Bug fix:** Controlled-mode (`data={canvas}` + `onChange={setCanvas}`) consumers no longer trigger xyflow's "trying to drag a node that is not initialized" warning during drag. The previous fix (v0.2.3) silenced most echo cycles but left a stale-snapshot race that fired through mid-drag mixed batches.
>
> **Observable behavior change:** consumer `onChange` is now called ZERO times during a drag (was: variable, depending on whether xyflow emitted mixed batches). The single drag-end `onChange` from `onNodeDragStop` is unchanged and carries the authoritative post-drag canvas state.
>
> **No public API change.** All v0.2.x types and props unchanged.

## Root cause (the v0.2.2 → v0.2.4 saga, completed)

| Version | State | Issue |
|---|---|---|
| pre-v0.2.2 | `fireOnChange` synchronous inside reducer | "setState during render" warning when xyflow's render-phase dimensions emit triggered consumer's setCanvas |
| v0.2.2 | `fireOnChange` body wrapped in `queueMicrotask` | First warning silenced. Round-trip echoes wholesale-replaced internal refs → measured wiped → #015 warning. |
| v0.2.3 | Structural-equality guard added to data-prop useEffect | Reference-clean round-trip echoes now correctly identified as no-ops. #015 mostly gone — but mid-drag mixed batches still slipped through. |
| **v0.2.4** | Suppress ALL onChange during drag + microtask-time drag guard | The stale-snapshot race is eliminated. Drag-end fires the single authoritative snapshot. |

## What changed in v0.2.4

Two complementary defenses in [`hooks/use-canvas-data.ts`](../../src/registry/components/data/flow-canvas-01/hooks/use-canvas-data.ts):

### Defense 1 — `onNodesChange` suppresses ALL onChange during drag

Before v0.2.4, the position-only short-circuit only suppressed `onChange` when every change in the batch was `{type: "position"}`. Mixed batches (e.g. `position` + `dimensions` for a non-dragged node during multi-select or auto-layout resize) still fired `onChange` mid-drag.

After v0.2.4, **any** change batch arriving while `isDraggingRef.current === true` is suppressed at the consumer-notification layer. Internal state still updates (xyflow keeps measuring); only the consumer is shielded from mid-drag flux. `onNodeDragStop` continues to flush a single authoritative `onChange` at drag end.

### Defense 2 — `fireOnChange` microtask checks `isDraggingRef` at fire time

`fireOnChange` queues a closure via `queueMicrotask`. Between queue-time and microtask-fire-time, a drag may have started — and the captured snapshot is now stale vs internal state.

After v0.2.4, the microtask callback reads `isDraggingRef.current` at fire time and bails early if a drag is in progress. The pre-drag select-change pathway (which queues a fireOnChange before `onNodeDragStart` flips the flag) is the canonical case this catches. Drag-end's queued snapshot fires correctly because by microtask time the flag is back to false.

## Why the v0.2.3 structural-equality guard wasn't enough

The structural check correctly identifies "data prop matches internal state" round-trip echoes. But mid-drag, this sequence runs:

1. T0: xyflow fires mixed-batch `onNodesChange`. `setInternalNodes` reducer applies changes → returns `next`. Captures `next` for `fireOnChange`, queues microtask.
2. T0+1 to T0+N: xyflow keeps firing position changes for the dragged node. `setInternalNodes` updates internal state further.
3. T1: microtask fires with the snapshot from T0. Consumer setCanvas with that data.
4. T2: useEffect runs. **Structural check compares the T0 snapshot against the T0+N internal state → genuine divergence on position fields → wholesale replace.**

The snapshot is genuinely stale, not just a ref difference. Structural equality correctly identifies it as different, but the "fix" (wholesale replace) wipes `measured` and triggers #015 on the next drag tick.

The v0.2.4 defense closes the gap upstream: the snapshot isn't taken in the first place during a drag, so there's nothing to stale-compare.

## Verification

- `pnpm tsc --noEmit` — clean
- `pnpm lint` — 0 errors (2 pre-existing virtualizer warnings unchanged)
- `pnpm validate:meta-deps` — 43/43 clean
- Manual: rich-card-in-flow demo — multiple drags, console clean (no #015 warnings, no warnings of any kind)

## Cross-references

- v0.2.3 (the immediate predecessor): [`2026-05-16-flow-canvas-v0.2.3-resync-echo-guard.md`](2026-05-16-flow-canvas-v0.2.3-resync-echo-guard.md)
- v0.2.2 (the round-trip pathology origin): [`2026-05-16-flow-canvas-v0.2.2-microtask-defer.md`](2026-05-16-flow-canvas-v0.2.2-microtask-defer.md)
- v0.2.1 (`onEditRequest` API ship): [`2026-05-16-flow-canvas-v0.2.1-on-edit-request.md`](2026-05-16-flow-canvas-v0.2.1-on-edit-request.md)
- rich-card-in-flow v0.1.0 (consumer surfacing the saga): [`2026-05-16-rich-card-in-flow-v0.1.0-first-ship.md`](2026-05-16-rich-card-in-flow-v0.1.0-first-ship.md)
- xyflow error #015: https://reactflow.dev/error#015

## Lessons

**Microtask defer + structural equality + drag-time suppression are all load-bearing together.** None of them is sufficient alone:

- Microtask defer alone (v0.2.2) → round-trip cycle.
- Microtask defer + structural equality (v0.2.3) → mid-drag stale-snapshot race.
- Microtask defer + structural equality + drag-time suppression (v0.2.4) → both warnings gone, round-trips robust.

**Diagnostic logging is cheap and conclusive.** The fix was identified in a single instrumented drag pass: three `dbg()` callsites around `fireOnChange` / `onNodesChange` / data-prop useEffect surfaced the stale-snapshot pattern within minutes. Time spent reasoning about possible race paths without logs > time spent adding logs + reading their output.

**Generalize:** any controlled wrapper around a stateful library (xyflow / monaco / codemirror / plate) with continuous-update flows (drag / type / select) needs all three patterns: deferred consumer notify + reference/structural resync guard + suppression of mid-continuous-flow notifications. The library's `use-canvas-data.ts` is now the canonical reference for the pattern; future flow-shaped procomps can replicate.

**Active-memory updates:** [`project_controlled_mode_two_defenses.md`](../../C:/Users/AsiaData/.claude/projects/e--2026-ilinxaDOC-ilinxa-ui-pro/memory/project_controlled_mode_two_defenses.md) needs to widen from "two defenses" to "three defenses" — drag-time suppression added as the third.
