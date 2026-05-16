---
date: 2026-05-16
type: fix
commits: [022cee8]
components: [flow-canvas-01]
findings: [F-V4-promoted-from-v0.3]
status: shipped
---

# flow-canvas-01 v0.2.2 — defer `fireOnChange` to microtask

## Summary

`flow-canvas-01@v0.2.2` ships a one-site internal bug fix: `fireOnChange`'s body is now wrapped in `queueMicrotask`. Every code path in `use-canvas-data.ts` becomes render-phase-safe — consumer `onChange` always fires post-commit, never synchronously inside a `setInternalNodes` reducer.

**Trigger:** `rich-card-in-flow@v0.1.0`'s demo (the first controlled-mode consumer in the library) tripped a React 19 "Cannot update RichCardInFlowDemo while rendering Canvas" warning on first mount.

**Patch-bump exemption** per the [readiness-review rule](../rules/component-readiness-review.md): internal-only bug fix, no public API touch, **GATE 3 skipped**. v0.2.0 spotcheck verdict `Pass with follow-ups` carries forward.

### Release notes

> **Bug fix:** Consumer `onChange` now fires in a microtask after React commits the corresponding state update, instead of synchronously inside the reducer. Eliminates a React 19 "setState during render" warning that surfaced when the controlled-mode `data={canvas}` + `onChange={setCanvas}` pattern was wired against initial node mount.
>
> **Observable behavior change:** one microtask of additional latency between an xyflow change event and the consumer's `onChange` fire. Imperceptible in practice; React was batching the resulting setState into the next paint either way.
>
> **No public API change.** All v0.2.x types and props unchanged.

## Files touched

| File | What |
|---|---|
| `src/registry/components/data/flow-canvas-01/hooks/use-canvas-data.ts` | Wrapped the body of `fireOnChange` (the single internal helper that ALL 13 consumer-notify sites call) with `queueMicrotask(() => { ... })`. Zero call-site changes. Also updated the comment at `onNodeDragStop` since it referenced the reducer-side-effect cleanup as a v0.3 candidate — that comment now correctly notes the cleanup landed in v0.2.2. |
| `src/registry/components/data/flow-canvas-01/meta.ts` | Version `0.2.1` → `0.2.2`. |
| `public/r/flow-canvas-01.json` | Regenerated via `pnpm registry:build`. Verified artifact carries the `queueMicrotask`-wrapped body. |

## Root cause analysis

`fireOnChange` was called from 13 sites in `use-canvas-data.ts`. Most sit **inside** a `setInternalNodes/Edges/Viewport((prev) => { ... fireOnChange(...); return next; })` reducer. This is the "reducer-side-effect" pattern that the v0.2.0 plan F-V4 finding explicitly acknowledged as a v0.3 cleanup candidate (the comment at `use-canvas-data.ts:287` named it).

Why it was latent until 2026-05-16: xyflow emits initial `dimensions` changes during its own render-phase DOM measurement. That fires `onNodesChange` → the reducer runs → `fireOnChange` calls the consumer's `onChange` synchronously. **If the consumer's `onChange` triggers `setState` in another component** (i.e., the canonical controlled pattern with `data={state}` + `onChange={setState}`), React 19 warns about setState during render.

Why no prior consumer surfaced it:
- `flow-canvas-01`'s own demo passes static `data={FLOW_CANVAS_RICH}` with no `setCanvas` — no consumer setState exists, no warning.
- Other procomps that use flow-canvas-01 (none exist before rich-card-in-flow) would have hit the same issue if they wired controlled bidirectional state.

`rich-card-in-flow@v0.1.0`'s demo is the **first** consumer in the library to wire `data={canvas}` + `onChange={setCanvas}` (because the dialog needs to read current canvas state + write back). Shipped same-day (2026-05-16); the warning surfaced on first dev-server load.

## Why microtask wrap (not full reducer-side-effect refactor)

Two approaches were considered:

1. **Refactor each of the 13 reducer-side-effect sites** to call `fireOnChange` AFTER the reducer returns. Larger patch (~30 LoC), needs explicit `next`-state capture at each site, risk of regressions.
2. **Wrap `fireOnChange`'s body with `queueMicrotask`** (chosen). Single line change, zero call-site touches. All 13 sites get the same deferred behavior automatically.

The user explicitly asked "which is more consistent and reliable" — option 2 satisfies both:
- **Consistent:** all 13 sites get the SAME deferred behavior. F-V4's "consistency over a one-off divergence" principle still holds (don't split into 1-microtask-deferred + 12-still-synchronous).
- **Reliable:** every code path that calls `fireOnChange` (including any future ones) is render-phase-safe by construction. No latent bugs of the same shape can survive.

The "promote v0.3 cleanup forward" framing: F-V4 deferred the cleanup because there was no forcing function in v0.2.0. There is one now (this bug). Promote.

## Capture-semantics rationale (worth documenting)

The microtask captures `nodes` / `edges` / `vp` in its closure. By the time the microtask runs, the captured arrays are still pointing at the same memory — `applyNodeChanges`, `applyEdgeChanges`, `xyAddEdge` all return immutable new arrays. So the consumer always sees the state that the original call site intended to notify about, not whatever state happens to be current at microtask-execution time.

Multiple `fireOnChange` calls scheduled in the same task each queue their own microtask. All run before the next render. Consumer's `setCanvas` fires multiple times → React batches → final state is correct. Minor wasted `.map(fromXyNode)` work on each microtask; negligible.

## Verification

- `pnpm tsc --noEmit` — clean
- `pnpm lint` — 0 errors (2 pre-existing virtualizer warnings unchanged)
- `pnpm validate:meta-deps` — 43/43 clean
- `pnpm registry:build` — clean
- `pnpm build` — clean (43 component routes incl. `/components/rich-card-in-flow`)

Smoke harness re-run was NOT required per readiness-review rule (smoke is for v0.1.0 first ships only; v0.2.1 → v0.2.2 is a non-breaking patch bump). The change is internal to `use-canvas-data.ts` (consumers don't import that file directly) — no consumer-side surface affected.

## Cross-references

- v0.2.0 plan F-V4 (the original "v0.3 cleanup candidate" lock): [`docs/procomps/flow-canvas-01-procomp/flow-canvas-01-v0.2.0-procomp-plan.md`](../../docs/procomps/flow-canvas-01-procomp/flow-canvas-01-v0.2.0-procomp-plan.md)
- v0.2.1 ship (the immediate predecessor): [`2026-05-16-flow-canvas-v0.2.1-on-edit-request.md`](2026-05-16-flow-canvas-v0.2.1-on-edit-request.md)
- rich-card-in-flow v0.1.0 first ship (the consumer that surfaced the bug): [`2026-05-16-rich-card-in-flow-v0.1.0-first-ship.md`](2026-05-16-rich-card-in-flow-v0.1.0-first-ship.md)
- React 19 "setState during render" docs: https://react.dev/link/setstate-in-render
