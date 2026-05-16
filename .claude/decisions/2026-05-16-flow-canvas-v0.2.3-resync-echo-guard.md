---
date: 2026-05-16
type: fix
commits: [1910e2d]
components: [flow-canvas-01]
findings: [v0.2.2-followup]
status: shipped
---

# flow-canvas-01 v0.2.3 — skip controlled-mode resync on round-trip echo

## Summary

`flow-canvas-01@v0.2.3` ships a follow-up fix to v0.2.2's microtask defer. Structural-equality guard added to the controlled-mode `useEffect` so consumer round-trip echoes don't trigger a wholesale-replace of xyflow's internal node refs.

**Trigger:** after v0.2.2 silenced the "setState during render" warning, `rich-card-in-flow@v0.1.0`'s demo started emitting xyflow's "trying to drag a node that is not initialized" warning during interaction.

**Patch-bump exemption** per the [readiness-review rule](../rules/component-readiness-review.md). Internal-only bug fix, no public API touch, GATE 3 skipped.

### Release notes

> **Bug fix:** Controlled-mode (`data={canvas}` + `onChange={setCanvas}`) consumers no longer trigger an infinite resync cycle where xyflow's internal node references are replaced on every consumer setState. Eliminates the "trying to drag a node that is not initialized" xyflow warning that surfaced post-v0.2.2.
>
> **Observable behavior change:** consumer setCanvas calls that round-trip the canvas state unchanged are now correctly identified as echoes and skipped at the resync layer. Genuine external data changes (loading a new canvas, programmatic node updates) still trigger the resync.
>
> **No public API change.** All v0.2.x types and props unchanged.

## Root cause (the v0.2.2 / v0.2.3 saga)

| Version | State | Issue |
|---|---|---|
| pre-v0.2.2 | `fireOnChange` synchronous inside reducer | "setState during render" warning when xyflow's render-phase dimensions emit triggered consumer's setCanvas |
| v0.2.2 | `fireOnChange` body wrapped in `queueMicrotask` | First warning silenced. But the microtask defer separated the consumer's setState from the reducer's commit → each round-trip created a NEW data prop reference → reference-equality guard missed every echo → controlled-mode useEffect wholesale-replaced xyflow's internal refs via `toXyNode(...)` → xyflow lost `measured` field → re-measured → emitted `onNodesChange` → fired `onChange` again → resync cycle. The "trying to drag a node that is not initialized" warning fired during the re-measurement window between cycles. |
| **v0.2.3** | Same microtask defer + structural-equality guard in controlled-mode useEffect | Round-trip echoes now identified by structural match (id / position / data-ref / viewport). Genuine external changes still trigger resync. Cycle broken. |

## Why structural equality (not reference / not flag-based)

Three approaches considered:

1. **Reference equality on `data` prop (v0.2.2's existing guard).** Fails for the common consumer pattern: `setCanvas((prev) => updateNodeData(prev, ...))` creates a new top-level reference + new `nodes` array. The reference check misses every echo.

2. **Echo-flag pattern** (set `isOwnEchoRef = true` in `fireOnChange`; useEffect checks + clears). Works for canonical case but has edge cases: if consumer doesn't update state (e.g., drops onChange), the flag persists and the next external data change is mistakenly skipped. Mitigation via `setTimeout(0)` reset adds timing fragility.

3. **Structural equality** (chosen). Pure functional comparison: if `data` structurally matches current internal state, skip resync. No persistent flag, no timing concerns, no edge cases with consumer transformations (transforms producing structurally-identical output are correctly identified as no-ops). O(N) per data prop change; short-circuits on first mismatch.

For controlled-mode consumers at N up to a few thousand (the canonical use case), structural comparison cost is dominated by React's reconciliation overhead anyway. Larger canvases should use `defaultData` (uncontrolled) per the procomp guide's perf section.

## What's compared

| Field | Compared? | Why / Why not |
|---|---|---|
| viewport.x / y / zoom | yes | Pan/zoom would round-trip identically |
| nodes.length, edges.length | yes | Quick length mismatch short-circuit |
| node.id | yes | Identity check |
| node.position.x, position.y | yes | Position changes are the most common consumer update |
| node.data | yes (reference check) | Same object iff consumer didn't edit; `updateNodeData` creates a new reference for the edited node, so consumer-driven content edits trigger resync correctly |
| node.width / height | **no** | xyflow-managed `measured` field; doesn't round-trip cleanly through `NodeRecord` |
| node.selected | no | Selection-only changes don't need wholesale resync; xyflow tracks selection internally |
| node.locked / draggable | no | Edge case (consumer mutates lock externally); not worth the complexity in v0.2.3, can add in v0.3 if needed |
| edge.id, source, target | yes | Connection topology |
| edge.type, selected | no | Same rationale as node selection — secondary properties |

The selectivity is deliberate: catch the common round-trip case, let genuine consumer-driven content/topology changes pass through.

## Verification

- `pnpm tsc --noEmit` — clean
- `pnpm lint` — 0 errors (2 pre-existing virtualizer warnings unchanged)
- `pnpm validate:meta-deps` — 43/43 clean
- `pnpm registry:build` — clean (verified artifact carries the new helper + updated useEffect)
- `pnpm build` — clean (43 component routes incl. `/components/rich-card-in-flow`)

## Cross-references

- v0.2.2 (the immediate predecessor that introduced the round-trip pathology): [`2026-05-16-flow-canvas-v0.2.2-microtask-defer.md`](2026-05-16-flow-canvas-v0.2.2-microtask-defer.md)
- v0.2.1 (the `onEditRequest` API ship): [`2026-05-16-flow-canvas-v0.2.1-on-edit-request.md`](2026-05-16-flow-canvas-v0.2.1-on-edit-request.md)
- rich-card-in-flow v0.1.0 (the consumer surfacing both warnings): [`2026-05-16-rich-card-in-flow-v0.1.0-first-ship.md`](2026-05-16-rich-card-in-flow-v0.1.0-first-ship.md)
- xyflow error #015 (node-not-initialized): https://reactflow.dev/error#015

## Lessons

**Microtask defer alone wasn't sufficient.** The v0.2.2 ship treated "setState during render" as the only problem, but the round-trip resync pathology was always there — just masked by React's defensive batching. v0.2.2 silenced the symptom; v0.2.3 fixes the actual cycle.

**Controlled-mode flow-canvas-01 is now genuinely robust.** With both fixes in place, consumer `data` + `onChange` round-trips don't cascade into internal state churn. v0.2.3 is the floor for safe controlled-mode use.

**The lesson generalizes:** any controlled wrapper around a stateful library (xyflow, monaco, codemirror, plate, etc.) needs both (a) deferred consumer notify AND (b) reference-aware resync guard to avoid this cycle. Future flow-shaped procomps in this library will inherit both patterns from `use-canvas-data.ts`.
