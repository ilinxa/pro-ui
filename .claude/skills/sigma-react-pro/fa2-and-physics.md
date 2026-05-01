# ForceAtlas2 worker, drag, and physics

## How `graphology-layout-forceatlas2/worker` actually works

The [worker package](https://github.com/graphology/graphology/tree/master/src/layout-forceatlas2) is a thin supervisor on top of a Web Worker thread that runs the FA2 algorithm. The architecture is:

```
┌─────────────────────────────┐         ┌──────────────────────────────┐
│  Main thread (supervisor)    │         │  Worker thread                │
│  ─ owns the graphology graph │         │  ─ runs FA2 iterations        │
│  ─ owns Float32Array matrix  │ ◄─────► │  ─ reads matrix from msg      │
│    (positions + sizes)       │  msg    │  ─ writes matrix back         │
│  ─ assignLayoutChanges() on  │         │                               │
│    every "result" message    │         │                               │
└─────────────────────────────┘         └──────────────────────────────┘
```

Lifecycle:

1. **`new FA2Layout(graph, { settings })`** — supervisor subscribes to graph events on construction.
2. **`start()`** — allocates the Float32Array matrix, reads node x/y/size/fixed for every node, posts the matrix + edges to the worker, kicks the iteration loop.
3. **Worker iterates.** Each step posts the updated matrix back. Supervisor calls `assignLayoutChanges` to write x/y back to the graphology graph. Sigma observes graphology's `nodeAttributesUpdated` event and re-renders.
4. **`stop()`** — flips `this.running = false` on the supervisor. **No message is sent to the worker thread.** The worker may post one more iteration result, which `handleMessage` drops at its `if (!this.running) return;` guard ([worker.js:108](https://github.com/graphology/graphology/blob/master/src/layout-forceatlas2/worker.js)). Subsequent `askForIterations` calls aren't issued, so the worker eventually idles. Matrix in worker memory persists until `kill()`.
5. **`kill()`** — terminates the worker thread, releases the matrix, unsubscribes from graph events. The instance is dead; calling `start()` after `kill()` always throws `'graphology-layout-forceatlas2/worker.start: layout was killed.'`.

```tsx
import FA2Layout from "graphology-layout-forceatlas2/worker";

const layout = new FA2Layout(graph, {
  settings: {
    gravity: 1,
    scalingRatio: 10,
    slowDown: 1,
    linLogMode: false,
    barnesHutOptimize: false,
    edgeWeightInfluence: 1,
  },
});

layout.start();
// ... later
layout.stop();
// on unmount
layout.kill();
```

## The fixed-attribute observability gap

The supervisor subscribes to graphology's `nodeAdded`, `edgeAdded`, `nodeDropped`, and `edgeDropped` events. **It does NOT subscribe to `nodeAttributesUpdated`.** When you set `fixed: true` on a node mid-flight (e.g. on `downNode` to start a drag), the worker has no idea — its matrix still records the node as non-fixed. On the next iteration, the worker writes the matrix's stale position back to the graph, which fights the cursor.

Visible symptoms during a drag:

- Node "snaps back" to a previous position every few frames.
- Cursor and node visibly desync.
- After release, the node may walk to where the worker thinks it should be over the next 1–2 seconds before settling.

Setting `fixed: true` on the graphology node is the right thing for the persistent record — it's what `sigmaNodeAttributes()` reads, it's what the worker reads on its NEXT `start()`. But during the gesture, the worker is uninformed.

## Drag-during-FA2: pause-on-down + resume-on-up

The fix is to suspend the worker for the duration of the drag and resume it on `mouseup`. Resuming calls `start()`, which rebuilds the matrix from the current graph state — picking up the new `fixed` value cleanly.

In the project we route this through an `FA2Controls` wrapper (`worker.setEnabled(false)` calls `layout.stop()`; `worker.setEnabled(true)` calls `layout.start()`) — see [use-fa2-worker.ts](../../src/registry/components/data/force-graph/hooks/use-fa2-worker.ts). Pattern matches the project's [use-drag-handler.ts](../../src/registry/components/data/force-graph/hooks/use-drag-handler.ts):

```tsx
import type Sigma from "sigma";
import type { MultiGraph } from "graphology";
import type { GraphStore } from "../lib/store/store-creator";
import type { FA2Controls } from "./use-graph-store";

export function useDragHandler(
  sigma: Sigma | null,
  graph: MultiGraph,
  store: GraphStore,
  worker: FA2Controls,
) {
  useEffect(() => {
    if (!sigma) return;
    let suspended = false;
    let activeNodeId: string | null = null;

    const onDownNode = ({ node, event }) => {
      activeNodeId = node;
      graph.setNodeAttribute(node, "fixed", true);
      // Pause FA2 only if it was actually running. `layoutEnabled` lives
      // in the store's settings slice; capturing `suspended` lets us
      // avoid spuriously starting the worker on drop when the host had
      // layout off.
      if (store.getState().settings.layoutEnabled) {
        worker.setEnabled(false); // calls layout.stop() under the hood
        suspended = true;
      }
      event.preventSigmaDefault();
      event.original.preventDefault?.();
    };

    const onMoveBody = ({ event }) => {
      if (!activeNodeId) return;
      // event.x / event.y are container-relative — pass straight to viewportToGraph.
      const pos = sigma.viewportToGraph({ x: event.x, y: event.y });
      graph.setNodeAttribute(activeNodeId, "x", pos.x);
      graph.setNodeAttribute(activeNodeId, "y", pos.y);
    };

    const onMouseUp = () => {
      // ... commit position, push history, clear activeNodeId.
      if (suspended) {
        // Two valid choices on resume — pick based on UX:
        //   • worker.setEnabled(true)  — calls layout.start(); CONTINUOUS run
        //     resumes. Other nodes re-equilibrate around the new pin (visible
        //     drift for ~1–2s post-drop). Matches the project's current
        //     behavior.
        //   • worker.kick()             — calls start() then stops after
        //     `layoutSettleDuration` ms. BOUNDED settle, no perpetual drift.
        //     Recommended if the post-drop wobble is undesirable.
        // See "Settle-then-stop vs continuous-run" below for the tradeoff.
        worker.setEnabled(true);
        suspended = false;
      }
      activeNodeId = null;
    };

    sigma.on("downNode", onDownNode);
    sigma.on("moveBody", onMoveBody);
    sigma.getMouseCaptor().on("mouseup", onMouseUp);

    return () => {
      sigma.off("downNode", onDownNode);
      sigma.off("moveBody", onMoveBody);
      sigma.getMouseCaptor().off("mouseup", onMouseUp);
      if (suspended) worker.setEnabled(true); // defensive: never leave layout paused on unmount
    };
  }, [sigma, graph, store, worker]);
}
```

## Settle-then-stop vs continuous-run

Two UX models for FA2:

| Mode | When |
|---|---|
| **Continuous** (worker always running) | "Living" graph: nodes wiggle when neighbors move; perturbations cascade. Good for exploratory dashboards. Bad for read-heavy reference graphs (constant motion is fatiguing). |
| **Settle-then-stop** | One-shot equilibration. Worker runs for `layoutSettleDuration` ms after a mutation, then stops. Predictable; layout is stable until the next mutation. Recommended default. |

Settle-then-stop is implemented as `kick()`. Naïve form (fine for teaching):

```tsx
function kick(durationMs: number) {
  layout.start();
  setTimeout(() => layout.stop(), durationMs);
}
```

Production form re-reads the worker reference inside the timeout so a remount-during-settle doesn't call `stop()` on a stale instance:

```tsx
function kick(durationMs: number) {
  const w = workerRef.current;
  if (!w) return;
  w.start();
  setTimeout(() => {
    if (workerRef.current === w) w.stop(); // skip if a new worker took its place
  }, durationMs);
}
```

Reference: [`use-fa2-worker.ts`](../../src/registry/components/data/force-graph/hooks/use-fa2-worker.ts) (lines 91–103).

Call `kick()` after:

- Snapshot import (initial layout pass).
- Adding/removing nodes or edges (let the new structure equilibrate).
- Programmatic position changes (e.g. paste, undo).
- Toggling layoutEnabled from off to on (one settling pass).

## Tuning settings

Pulled from [graphology-layout-forceatlas2 README](https://github.com/graphology/graphology/blob/master/src/layout-forceatlas2/README.md):

| Setting | Default | What it does |
|---|---|---|
| `gravity` | 1 | Pull toward the origin. Higher values prevent disconnected components from drifting off-screen. Bump to 5–10 if components fly apart. |
| `scalingRatio` | 1 | Multiplies the repulsive force. Higher = more spread out. We compute `repulsion / 10` from a 0–100 user setting. |
| `slowDown` | 1 | Damps oscillation. Higher = slower convergence but less wiggle at equilibrium. |
| `linLogMode` | false | Switch to Noack's LinLog model. Tighter clusters, more visible community structure. Try for clustered graphs. |
| `barnesHutOptimize` | false | O(n log n) repulsion via Barnes–Hut quadtree. **Enable for >5k nodes.** Below that the overhead exceeds the savings. |
| `barnesHutTheta` | 0.5 | BH approximation threshold. Lower = more accurate, slower. Default is fine. |
| `edgeWeightInfluence` | 1 | How strongly per-edge `weight` attribute biases attraction. Set to 0 to ignore edge weights. |
| `outboundAttractionDistribution` | false | Attraction distributed by node outbound degree. Helps hubs stay central. |
| `strongGravityMode` | false | Linear (not log) gravity falloff. Aggressive centering. |

`inferSettings(graph)` returns a reasonable starting point based on graph size — a good default for "I don't know what I'm doing":

```tsx
import { inferSettings } from "graphology-layout-forceatlas2";

const layout = new FA2Layout(graph, {
  settings: inferSettings(graph),
});
```

## Alternatives in the graphology layout ecosystem

| Layout | Use case |
|---|---|
| [`graphology-layout-forceatlas2`](https://graphology.github.io/standard-library/layout-forceatlas2.html) | The default for force-directed. Worker-capable. |
| [`graphology-layout-noverlap`](https://graphology.github.io/standard-library/layout.html#noverlap) | Anti-collision pass. Run AFTER FA2 to space out overlapping nodes. Worker-capable. |
| [`graphology-layout`](https://graphology.github.io/standard-library/layout.html) | `circular`, `random`, `circlepack` — useful for initial seeding before FA2 runs. |
| [`graphology-layout-force`](https://graphology.github.io/standard-library/layout-force.html) | Simpler force model. Lower fidelity but cheaper. |

## When to drop FA2 entirely

- **Pre-computed positions.** If you have stable graph data and a server-side layout pipeline (Gephi, networkx + cugraph, or a custom service), pre-compute x/y at ingest and ship them as snapshot attributes. Skip FA2 entirely. Best for >100k node graphs.
- **Hierarchical structures.** Use [`@dagrejs/dagre`](https://github.com/dagrejs/dagre) (via Cytoscape's dagre extension or directly) for DAG / tree layouts. FA2 is the wrong tool for hierarchies.
- **Read-only knowledge graphs.** Compute layout once on import via `forceAtlas2.assign(graph, { iterations: 200 })` (the synchronous version), then never run the worker. Saves bundle size and avoids any worker complexity.

## Physics for node-drag UX

If you want "bounce" or spring-damped drag (the node lags behind the cursor with elastic snap), implement it in the drag handler — NOT by running FA2 with `fixed: false`. FA2 is too coarse and too unpredictable for per-frame interaction physics.

A simple spring-damped follow:

```tsx
// In the moveBody handler:
const targetX = sigma.viewportToGraph({ x: event.x, y: event.y }).x;
const currentX = graph.getNodeAttribute(node, "x") as number;
const vx = (graph.getNodeAttribute(node, "_vx") as number) ?? 0;
const k = 0.3; // spring stiffness
const damp = 0.7;
const force = (targetX - currentX) * k;
const nextVx = (vx + force) * damp;
graph.setNodeAttribute(node, "x", currentX + nextVx);
graph.setNodeAttribute(node, "_vx", nextVx);
// (same for y)
```

But the simpler answer for most apps is **direct cursor-tracking + auto-pin on drop** — what the force-graph procomp does. Bounce physics adds visual noise without an interaction benefit.

## Sources

- [graphology-layout-forceatlas2 README](https://github.com/graphology/graphology/blob/master/src/layout-forceatlas2/README.md)
- [graphology layout-forceatlas2 docs](https://graphology.github.io/standard-library/layout-forceatlas2.html)
- [worker.d.ts source](https://github.com/graphology/graphology/blob/master/src/layout-forceatlas2/worker.d.ts)
- [Visualizing Graphs in JavaScript with Graphology and ForceAtlas2 (Brioudes)](https://medium.com/@guillaume-brioudes/visualizing-graphs-in-javascript-with-graphology-and-forceatlas2-11e257c394e0)
- [`force-graph/hooks/use-fa2-worker.ts`](../../src/registry/components/data/force-graph/hooks/use-fa2-worker.ts)
- [`force-graph/hooks/use-drag-handler.ts`](../../src/registry/components/data/force-graph/hooks/use-drag-handler.ts)
