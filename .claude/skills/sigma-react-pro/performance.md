# Performance

Measure first. Sigma + graphology + FA2 handle 10k–50k nodes on integrated GPUs without intervention. The recipes here matter when you're outside that range or chasing 60 FPS on low-end hardware.

## Bundle

Sigma v3 ships as `sigma` (core) + `sigma/rendering` (programs subpath). Per-program imports tree-shake — if you only use circles and rectangles, only those programs land in the bundle.

```ts
// Bundles only NodeCircleProgram + EdgeRectangleProgram + EdgeArrowProgram
import { NodeCircleProgram, EdgeRectangleProgram, EdgeArrowProgram } from "sigma/rendering";
```

Optional add-ons live in separate npm packages:

| Package | Use case |
|---|---|
| [`@sigma/edge-curve`](https://www.npmjs.com/package/@sigma/edge-curve) | Curved edges (multi-edge spreading) |
| [`@sigma/node-image`](https://www.npmjs.com/package/@sigma/node-image) | Image-textured nodes |
| [`@sigma/node-border`](https://www.npmjs.com/package/@sigma/node-border) | Bordered nodes |
| [`@sigma/utils`](https://www.npmjs.com/package/@sigma/utils) | Helpers (zoom-to-node, etc.) |

Approximate gzipped sizes (verify in your bundle):

| Module | Min+gzipped |
|---|---|
| `sigma` core | ~85 KB |
| `sigma/rendering` (all programs) | ~25 KB |
| `graphology` | ~30 KB |
| `graphology-layout-forceatlas2` (sync) | ~10 KB |
| `graphology-layout-forceatlas2/worker` | ~12 KB (includes inlined worker) |
| `@sigma/edge-curve` | ~6 KB |
| `@sigma/node-image` | ~8 KB |

The dynamic-import pattern in [sigma-lifecycle.md](sigma-lifecycle.md) keeps Sigma + rendering out of the initial JS payload — they land on a code-split chunk loaded after hydration.

## WebGL ceilings

Sigma's practical limits, observed on M1 Air integrated GPU at 60 FPS:

| Scale | With defaults | With perf tuning |
|---|---|---|
| 10k nodes / 30k edges | smooth | smooth |
| 50k / 100k | edges flicker on pan if `hideEdgesOnMove: false` | smooth with `hideEdgesOnMove: true`, label thresholds |
| 100k / 200k | choppy | smooth with all knobs + drop FA2 to pre-computed |
| 500k+ | unusable | needs custom culling, pre-computed positions, possibly WebGPU |

For comparison:
- **Cytoscape.js Canvas2D** caps near 5k. The [WebGL preview in 3.31](https://blog.js.cytoscape.org/2025/01/13/webgl-preview/) extends this by ~10x.
- **react-force-graph 2D** (Canvas) caps near 5k. **3D** (Three.js) caps near 20k.
- **AntV G6 v5** with WebGL renderer + WASM layout extends to ~100k for layout-light cases.
- **Reagraph** sits between react-force-graph and Sigma — WebGL via Three.js, ~10k nodes smooth.

## hideEdgesOnMove

Sigma's default is `true`. This *visibly* hides every edge during a pan or zoom drag — feels broken on small graphs (the user thinks they did something wrong). On large graphs (>50k edges), the FPS gain is real because edge programs are the most expensive draw.

| Graph size | Recommendation |
|---|---|
| < 10k edges | `false`. The visual jank from edges disappearing dwarfs any FPS win. |
| 10k–50k edges | `false` if your target hardware is M-series / Ryzen, `true` for low-end. |
| > 50k edges | `true`. Visible flicker is preferable to a dropped frame rate. |

```tsx
new Sigma(graph, container, {
  hideEdgesOnMove: graph.size > 50_000,
});
```

## Label settings

Three knobs, in order of impact:

1. **`labelRenderedSizeThreshold`** (px) — minimum on-screen pixel size for a label to render. Default 6. Bump to 12–18 to drop micro-labels at far-zoom.
2. **`labelDensity`** (0–1) — fraction of competing labels to render. Default 1. Drop to 0.6 for cleaner zoomed-out views.
3. **`labelGridCellSize`** (px) — controls the spatial bucket Sigma uses to dedupe overlapping labels. Larger = fewer labels. Default 60.

Common tuning:

```tsx
new Sigma(graph, container, {
  labelRenderedSizeThreshold: 14,  // hides labels below 14px
  labelDensity: 0.7,                // shows 70% of competing labels
  labelGridCellSize: 80,            // larger dedupe grid
});
```

For very large graphs, a `labelRenderedSizeThreshold` of 18–24 keeps the canvas readable when zoomed out while still showing labels on focus.

## OutputReducer (FA2) vs Sigma reducers

Two different layers, often confused:

| | `OutputReducer` (graphology layouts) | `nodeReducer` / `edgeReducer` (Sigma) |
|---|---|---|
| Where | Inside FA2 / other layout algorithms | Inside Sigma's render pipeline |
| When | Per layout iteration (60+/sec while running) | Per render frame |
| Modifies | Node x/y written back to graphology | Display attributes only — does NOT mutate graphology |
| Use | Pre-render position adjustments (snap to grid, clamp to bounds) | Per-render visual overrides (selection, hover, filters) |

The FA2 worker doesn't expose an `OutputReducer` directly. To clamp positions inside a worker-running FA2, you have two options:

- Subscribe to graphology's `nodeAttributesUpdated` event and clamp x/y in a separate handler. Cheap; runs after the worker writes.
- Use the synchronous (non-worker) `forceAtlas2.assign(graph, { ...settings, getEdgeWeight: ... })` and post-process. Loses the worker.

For overrides per-render, use Sigma's reducers — they're cheaper and don't fight the layout.

## Reducer performance

Reducers run for every visible element on every render. A poorly written reducer is the most common Sigma perf bug.

**Bad:**

```tsx
sigma.setSetting("nodeReducer", (id, attrs) => {
  // Allocates an object every call, even when nothing changes.
  // Map.get() is O(1) but slower than Set.has() in V8 hot paths.
  const isSelected = selectedNodesMap.get(id)?.selected;
  return { ...attrs, color: isSelected ? "red" : attrs.color };
});
```

**Good:**

```tsx
const selectedSet = useMemo(
  () => new Set(state.selectedIds),
  [state.selectedIds],
);

sigma.setSetting("nodeReducer", (id, attrs) => {
  if (!selectedSet.has(id)) return attrs; // <-- early return, NO allocation
  return { ...attrs, color: theme.selectionRing, zIndex: 1 };
});
```

Rules:

1. **Return the input attrs unchanged** when no override applies. Sigma checks identity — same object means no diff.
2. **Use `Set` over `Map`** when you only need membership.
3. **Pre-compute closures** — derive `Set<string>` once via `useMemo`, not inside the reducer.
4. **Avoid string concatenation** per call (`color: "rgba(" + r + "," + ...`). Pre-build the variants.

When `selectedSet` changes, you must call `sigma.refresh()` to trigger a re-paint with the new closure. Sigma can't observe arbitrary external state.

## Multi-edge rendering

Multi-edges (parallel edges between the same two nodes) overlap as straight lines and lose visual distinguishability. Two strategies:

1. **`@sigma/edge-curve`** — curve parallel edges away from the straight line by an offset proportional to edge index in the parallel set. Visually clear but adds ~30% per-edge cost.
2. **Stagger by per-edge `size` and `color`** — keep edges straight but vary thickness/hue. Cheaper but only works for 2–3 parallel edges.

The force-graph procomp defers `@sigma/edge-curve` to v0.6 — initial release ships straight edges only. The decision: edge-curve isn't free, and we don't have multi-edge UX requirements until later phases.

## React-layer memoization

The graphology graph is the single source of truth, but most React state (UI mode, selection, hover, settings) lives in Zustand. Selector subtleties:

```tsx
// BAD — derives a new array on every render, breaks reference equality.
const selectedIds = useStore((s) => Array.from(s.selectedNodeIds));

// BAD — derives a new Set on every render.
const selectedSet = useStore((s) => new Set(s.selectedNodeIds));

// GOOD — stable Set reference; updates only when the underlying state changes.
const selectedSet = useStore((s) => s.selectedNodeIds);
//                                  ^ store should hold a Set or readonly array directly
```

For derived collections, compute them in the store action (not in the selector) so subscribers see referentially-stable values.

```tsx
// In the store creator:
selectNode: (id: string) =>
  set((state) => ({
    selectedNodeIds: new Set([...state.selectedNodeIds, id]),
  })),
```

The `subscribeWithSelector` middleware lets you subscribe to a single derived value without re-rendering the whole component tree:

```tsx
useEffect(() => {
  const unsubscribe = store.subscribe(
    (state) => state.selectedNodeIds,
    (selectedIds) => {
      sigma.refresh(); // re-run reducers
    },
    { fireImmediately: false },
  );
  return unsubscribe;
}, [store, sigma]);
```

## React Compiler considerations

The React Compiler-aware lint rules flag:

- **`setState` in `useEffect` for derivable state.** Use `useMemo` or `useSyncExternalStore` instead.
- **Ref reads during render.** Read refs in event handlers or effects, never in the JSX expression. Sigma instance ref reads should always happen post-commit.
- **Prop-typed object literals as deps.** `useEffect(() => {...}, [{ key }])` re-fires every render. Hoist the literal or use individual properties as deps.
- **Closure over mutable values.** If a callback closes over a ref's `.current`, the captured value is stale. Pass the ref itself, dereference inside.

The ref-mirror pattern documented in [sigma-lifecycle.md](sigma-lifecycle.md#mount-time-prop-snapshot-via-per-prop-refs) is the canonical workaround for prop-snapshot effects: it satisfies the lint by keeping the construction effect's deps minimal while still letting the construction body read the latest prop values.

## graphVersion: a manual subscription primitive

The force-graph procomp uses a `graphVersion: number` counter in the Zustand store, bumped once per logical mutation. React-side panels (filter results, selection lists, type tables) `useGraphSelector(fn)` which observes graphVersion and forces re-evaluation when it bumps.

Why a counter instead of subscribing to graphology events directly:

- React panels need referentially-stable derived values. graphology fires events for every micro-mutation; you'd need to debounce.
- Multiple mutations in a single user action (e.g. cascade-on-delete: 1 node + 5 edges removed) should bump once, not 6 times.
- The counter doubles as a memo key: `useMemo(() => derive(graph), [graphVersion])`.

Sigma re-renders independently — it subscribes to graphology events directly and doesn't use graphVersion. This decoupling keeps Sigma's frame budget independent of React's reconciliation.

## When to drop FA2 entirely

Mentioned in [fa2-and-physics.md](fa2-and-physics.md), worth repeating here for the perf angle:

For >50k nodes, the per-iteration cost of FA2 + the message round-trip + the position writeback can exceed your frame budget even on M-series. Pre-compute positions on the server (Gephi, networkx + cugraph, or a custom service) and ship them in the snapshot. Skip the worker entirely. Save bundle, save CPU, save iteration jitter.

## Sources

- [Sigma performance issue #967](https://github.com/jacomyal/sigma.js/issues/967)
- [Sigma performance drop caused by edges #906](https://github.com/jacomyal/sigma.js/issues/906)
- [Sigma v3 lifecycle (refresh vs scheduleRefresh)](https://www.sigmajs.org/docs/advanced/lifecycle/)
- [Cytoscape WebGL preview](https://blog.js.cytoscape.org/2025/01/13/webgl-preview/)
- [Best Libraries for Large Force-Directed Graphs (Weber, Medium)](https://weber-stephen.medium.com/the-best-libraries-and-methods-to-render-large-network-graphs-on-the-web-d122ece2f4dc)
