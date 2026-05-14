# flow-canvas-01 — performance tier validation

> **Status:** research artifact. Not a procomp doc, not a GATE-3 review. Informs the eventual v0.2.0 description.
> **Date:** 2026-05-14
> **Author:** AI-assisted research pass (Claude Opus 4.7, 1M context)
> **Triggered by:** user question — "can we go from xyflow to D3+Canvas to handle 10k nodes? what's the realistic perf ceiling and what are the actual levers?"
> **Project tip at time of research:** `832e4f0` (flow-canvas-01 at v0.1.3, post perf+paint patches)

---

## TL;DR

1. flow-canvas-01 is already heavily tuned. Most "obvious" xyflow perf levers (module-scope `nodeTypes`/`edgeTypes`, `React.memo` on every node + edge + shell, ref-mirrored callbacks, empty-dep `useCallback` on `isValidConnection`) are already in place. Confirmed by inspection of the source.
2. **xyflow maintainer's own position** is that React Flow is **"not intended to be used in that kind of scale [1000+ nodes]"** and that **"a canvas based approach would be better for that sort of use-case"** ([discussion #3003](https://github.com/xyflow/xyflow/discussions/3003)). The skill file echoes this: *"xyflow's documented sweet spot is ~1–2k nodes; beyond that is custom canvas territory."*
3. There IS still measurable headroom in flow-canvas-01 — but **it's smaller than the four-tier comparison initially suggested**. Several proposed Tier 2 levers (quadtree port hit-test, edge memoization, event throttling) were either already done or addressed problems that don't exist in this codebase.
4. **No public xyflow benchmark covers this codebase's node shape** (rich card with ports + nested JSON data). Every "smooth at N" number anywhere in this doc is a plausibility estimate, not a measurement. **The right next step is a stress-test page that records actual FPS** on the existing `makeStressData` fixture.
5. The popup-edit constraint (no inline editing in canvas cards; click → dialog) is **independently validated** as the correct pattern: it's how n8n, Make.com, Pipedream, and similar tools all work, and it removes the "rich editable text on canvas" wall that otherwise caps any approach near low hundreds.

---

## Pre-existing perf state (verified by code inspection)

| Lever | Source | Status |
|---|---|---|
| Module-scope `NODE_TYPES` / `EDGE_TYPES` | [canvas.tsx:31-32](../../../../src/registry/components/data/flow-canvas-01/parts/canvas.tsx) | ✅ in place, comment cites the skill |
| `React.memo` on `NodeAdapter` | [node-adapter.tsx:62](../../../../src/registry/components/data/flow-canvas-01/parts/node-adapter.tsx) | ✅ |
| `React.memo` on `NodeShell` | [node-shell.tsx:54](../../../../src/registry/components/data/flow-canvas-01/parts/node-shell.tsx) | ✅ |
| `React.memo` on `CustomJsonNode` + collapsed-mode skip of `JSON.stringify`/`<pre>`/shadow | [custom-json-node.tsx:58,26-55](../../../../src/registry/components/data/flow-canvas-01/parts/custom-json-node.tsx) | ✅ |
| `React.memo` on `DefaultEdge` | [default-edge.tsx:73](../../../../src/registry/components/data/flow-canvas-01/parts/default-edge.tsx) | ✅ |
| `isValidConnection` with empty deps + ref-based reads | [canvas.tsx:139-179](../../../../src/registry/components/data/flow-canvas-01/parts/canvas.tsx) | ✅ v0.1.2 perf patch |
| Ref-mirrored callbacks in `useCanvasData` | [use-canvas-data.ts:177-209](../../../../src/registry/components/data/flow-canvas-01/hooks/use-canvas-data.ts) | ✅ |
| `defaultViewport` to preserve initial zoom and not defeat culling | [canvas.tsx:117-121](../../../../src/registry/components/data/flow-canvas-01/parts/canvas.tsx) | ✅ |
| `onlyRenderVisibleElements` flipped on | [canvas.tsx:78,242](../../../../src/registry/components/data/flow-canvas-01/parts/canvas.tsx) | ⚠ **off by default** — consumer opt-in |
| Edge rendering substrate | xyflow native SVG (`BaseEdge` + `getSmoothStepPath`) | ⚠ SVG, no canvas overlay |
| LOD by zoom (dot / rect / card render modes) | — | ❌ not implemented |
| `useShallow` / `createWithEqualityFn` on `useStore` selectors | [default-edge.tsx:38-43](../../../../src/registry/components/data/flow-canvas-01/parts/default-edge.tsx) reads `useStore` without shallow | ❌ not applied |
| Batched `fireOnChange` (drag-end only, not per tick) | [use-canvas-data.ts:222-238](../../../../src/registry/components/data/flow-canvas-01/hooks/use-canvas-data.ts) fires on every change | ❌ fires per tick |

**flow-canvas-01's own procomp doc commits to 200 nodes as the v0.1 success ceiling.** That ceiling reflects the realistic interactive sweet spot for the current node shape (custom-JSON nodes + rich nested data).

---

## Validated tier ladder (corrected)

> **All ceilings are plausibility estimates, not measurements.** Run the stress harness before committing to numbers.

### Tier 1 — Defaults & cheap wins  (~½ day)

| Change | Status | Realistic impact |
|---|---|---|
| Flip `onlyRenderVisibleElements` default to `true` | confirmed lever, no quantified multiplier | small lift; known mount-time quirk (all nodes initially rendered — [issue #4378](https://github.com/xyflow/xyflow/issues/4378)); offscreen-edge corner case ([issue #4329](https://github.com/xyflow/xyflow/issues/4329)) |
| Batch `fireOnChange` during drag (drag-end only, not every tick) | new finding | real win for consumers that wire `onChange`; ~10-20% callback overhead saved at 1k nodes |
| Skip the full `nodes.map(fromXyNode)` when only `position` fields changed | new finding | reduces consumer callback payload work |

**Plausible ceiling after Tier 1:** ~300-500 nodes smooth.  
**Earlier claim of "2-4× lift" was unverified** — drop the multiplier, frame as "do because it's free."

### Tier 2 — Internal optimization, no API break  (~1-2 days)

| Change | Validated? | Source |
|---|---|---|
| `useShallow` on `DefaultEdge`'s `useStore` selector | ✅ community-confirmed major win | [PR #5629](https://github.com/xyflow/xyflow/pull/5629), [Synergy Codes guide](https://www.synergycodes.com/blog/guide-to-optimize-react-flow-project-performance) |
| Pure-CSS selection styling (use xyflow's own `.selected` class via `--xy-*` vars, bypass the `selected` prop re-render path) | ✅ xyflow team's #1 recommendation | [discussion #4975](https://github.com/xyflow/xyflow/discussions/4975) — *"`.react-flow__node.selected { /* your selected styles */ }`"* |
| Custom edge that queries source/target selection via xyflow store, not via per-edge state | ✅ xyflow team's recommendation | [discussion #4975](https://github.com/xyflow/xyflow/discussions/4975) — *"create a custom edge and check whether it's source or target is selected in there"* |
| ~~Quadtree-based port hit-test~~ | ❌ refuted | `findPortInTree` is per-node-data-tree, called only at connection-drop time; not a perf bottleneck |
| ~~Edge memoization~~ | ❌ already done | `memo(DefaultEdgeImpl)` |
| ~~Throttle non-critical updates~~ | ❌ no such handlers exist in canvas.tsx | xyflow handles its own batching |

**Plausible ceiling after Tier 2:** ~500-800 nodes smooth, possibly 1,000. Heavily depends on per-node renderer complexity.

### Tier 3 — Substrate-level changes inside xyflow  (~1-2 weeks)

| Change | Validated? | Source |
|---|---|---|
| Canvas edge overlay (sibling `<canvas>` with `Path2D` edge paths, same transform as xyflow, quadtree culling) | ✅ community pattern; ⚠ **user-side work, NOT a library feature** | [issue #5442](https://github.com/xyflow/xyflow/issues/5442) — issue is closed without library implementation; cites Yandex Gravity UI as a working precedent |
| LOD on nodes via `useViewport()` (zoom-based render shape: dot / rect / card) | ✅ confirmed pattern; one pitfall to lock | skill file (xyflow-react-pro), `useViewport` is reactive ✅; if LOD changes handle count/position must call `useUpdateNodeInternals(nodeId)` ⚠ |
| Aggressive edge culling (midpoint outside viewport → skip paint) | ✅ standard in canvas-rendered graph libs | implied by #5442 |
| Edge label virtualization (only paint at zoom level where readable) | ✅ implied | — |

**Plausible ceiling after Tier 3:** ~1,500 nodes smooth, MAYBE 2,000 with very lean nodes. **NOT the 2,000-3,000 the earlier comparison claimed** — the xyflow maintainer's framing (*"not intended for that scale"*) makes 2,000 the practical wall for this substrate.

### Tier 4 — Beyond xyflow  (3-4 weeks, sibling procomp, not flow-canvas-01)

| Change | Validated? | Source |
|---|---|---|
| Full canvas substrate (D3+Canvas2D or Sigma.js wrap) for 10k+ nodes | ✅ xyflow maintainer's own recommendation | [discussion #3003](https://github.com/xyflow/xyflow/discussions/3003) — *"A canvas based approach would be better for that sort of use-case as the performance would be a lot better though there's trade-offs using a canvas instead."* |

**Threshold is firmer than implied earlier:** the maintainer directs **>1,000-node use cases** to canvas substrates, not >5,000. So 1,000-2,000 is where you should *seriously consider* the sibling procomp.

---

## Corrected tier table (honest)

```
                    today        Tier 1         Tier 2         Tier 3         Tier 4 (sibling)
Smooth ceiling:     ~200         ~300-500*      ~500-800*      ~1,500*        10,000+ (per skill)
                                 (* measure)    (* measure)    (* measure)
Edges smooth:       ~300         ~400-600       ~800           ~3k (canvas)   30k+
Effort:              —           ½ day          1-2 days       1-2 weeks      3-4 wk sibling procomp
API breaks:          —           none           none           opt-in flag    new component
What's new:          —           default flip,  useShallow,    canvas edges,  D3+Canvas / Sigma
                                 batched fire   CSS selection, LOD on nodes,  substrate
                                                drag-end fire  quadtree edges
```

\* **Every ceiling number is a plausibility estimate, not a measurement.**

---

## What changes vs the conversational tier comparison

1. Tier 1 is smaller than implied — most levers already pulled.
2. Tier 2's real wins are `useShallow` and CSS-driven selection styling, **not** the things originally listed (which were either already done or non-issues).
3. Tier 3 canvas overlay is real but ~1-2 weeks of work, not a drop-in.
4. Tier 3 ceiling is ~1,500, not ~2,500-3,000.
5. Tier 4 threshold is ~1,000-2,000, not ~5,000.
6. **No measurement exists for any of these claims in this repo.** Stress fixture should be built before committing.

---

## Recommended next concrete step

Before any tier commitment, build a stress harness:

1. Add `src/app/(devtools)/flow-canvas-stress/page.tsx` (or similar) using `makeStressData(N)` from [dummy-data.ts](../../../../src/registry/components/data/flow-canvas-01/dummy-data.ts).
2. Record FPS via Chrome DevTools Performance tab at N = 100, 200, 500, 1000 with default renderers.
3. Apply Tier 1 levers in isolation → re-record.
4. Apply Tier 2 levers in isolation → re-record.
5. Now the v0.2.0 procomp description has real numbers, not estimates.

---

## Validated sources

- [Performance — reactflow.dev](https://reactflow.dev/learn/advanced-use/performance)
- [Stress Test example — reactflow.dev](https://reactflow.dev/examples/nodes/stress)
- [xyflow discussion #3003 — "Can ReactFlow work with 1000+ nodes/edges?"](https://github.com/xyflow/xyflow/discussions/3003)
- [xyflow discussion #4975 — "How to improve React Flow performance"](https://github.com/xyflow/xyflow/discussions/4975)
- [xyflow issue #5442 — "Performance recommendation: use canvas renderer on low zoom"](https://github.com/xyflow/xyflow/issues/5442)
- [xyflow issue #4378 — `onlyRenderVisibleElements` initial-render behavior](https://github.com/xyflow/xyflow/issues/4378)
- [xyflow issue #4329 — `onlyRenderVisibleElements` + offscreen edge bug](https://github.com/xyflow/xyflow/issues/4329)
- [xyflow PR #5629 — "Prevent re-render on every store update by using shallow"](https://github.com/xyflow/xyflow/pull/5629)
- [Synergy Codes — The ultimate guide to optimize React Flow project performance](https://www.synergycodes.com/blog/guide-to-optimize-react-flow-project-performance)
- [DEV Community — React Flow (xyFlow) Optimization](https://dev.to/usman_abdur_rehman/react-flowxyflow-optimization-45ik)
- [xyflow issue #4983 — Re-rendering non-changed nodes even with React.memo](https://github.com/xyflow/xyflow/issues/4983)
- Project-internal: [.claude/skills/xyflow-react-pro/SKILL.md](../../../../.claude/skills/xyflow-react-pro/SKILL.md)

---

## Companion open question (not in scope of this doc)

If/when flow-canvas-01 v0.2.0 lands the popup-edit constraint, **rich-card** is NOT a viable in-canvas node (5,302 LOC, per-instance `DndContext` + `useReducer` + ~12 hooks + permissions + undo + search). The right pattern is an **adapter** that registers a lean preview-renderer with flow-canvas-01's renderer registry, and opens the FULL rich-card in a dialog on click. Details to be captured in a separate research doc when that decision is made.
