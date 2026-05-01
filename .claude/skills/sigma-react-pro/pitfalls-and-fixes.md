# Pitfalls and fixes

A symptom-first lookup. When a Sigma component misbehaves, scan the headings for the visible failure mode and jump to the entry.

---

## SSR / mount-time

### `WebGL2RenderingContext is not defined` during build or initial render

**Symptom:** Next.js prerender (or any SSR runtime, or even a Vitest/jsdom test) throws `ReferenceError: WebGL2RenderingContext is not defined` from inside `sigma/rendering`.

**Root cause:** `sigma/rendering` references `WebGL2RenderingContext` at module-evaluation time. Top-level `import "sigma/rendering"` triggers the reference during the SSR module graph walk, where `WebGL2RenderingContext` is `undefined`.

**Fix:** Replace top-level imports with dynamic `import()` inside a mount effect. Keep `import type` for compile-time types.

```tsx
import type SigmaType from "sigma";

useEffect(() => {
  if (!container) return;
  let cancelled = false;
  Promise.all([import("sigma"), import("sigma/rendering")]).then(([s, r]) => {
    if (cancelled) return;
    // construct here
  });
  return () => { cancelled = true; };
}, [container]);
```

**Source:** [`force-graph/parts/sigma-container.tsx`](../../src/registry/components/data/force-graph/parts/sigma-container.tsx); [Next.js + react-sigma SSR discussion](https://github.com/vercel/next.js/discussions/73861).

---

### Two Sigma instances mounted on the same DOM node

**Symptom:** Memory grows on every fast unmount/remount. Event listeners fire twice. CPU stays elevated even when the component is "off."

**Root cause:** The dynamic-import promise from a previous mount resolves AFTER the next mount has already started. Without a cancellation flag, both resolutions construct Sigma against the same container.

**Fix:** Cancellation flag in the effect.

```tsx
useEffect(() => {
  let cancelled = false;
  let instance: SigmaType | null = null;

  Promise.all([import("sigma"), import("sigma/rendering")]).then(mods => {
    if (cancelled) return;            // <-- bail if unmounted during await
    instance = new SigmaClass(graph, container, settings);
  });

  return () => {
    cancelled = true;
    instance?.kill();
  };
}, [container, graph]);
```

**Source:** [`force-graph/parts/sigma-container.tsx`](../../src/registry/components/data/force-graph/parts/sigma-container.tsx).

---

### Sigma throws `Container has no size` on first render

**Symptom:** `RangeError: Container has invalid dimensions` or similar on the first frame.

**Root cause:** The container ref attaches before CSS layout has computed dimensions. Sigma defaults to refusing 0×0.

**Fix:** Pass `allowInvalidContainer: true`. Sigma proceeds and resizes itself once the container has area.

```tsx
new Sigma(graph, container, { allowInvalidContainer: true, ...rest });
```

**Source:** [`force-graph/parts/sigma-container.tsx`](../../src/registry/components/data/force-graph/parts/sigma-container.tsx).

---

### Container ref attached but Sigma mount effect doesn't run

**Symptom:** Component renders, you can see the `<div>` in DevTools, but no canvas appears. `useRef` was used for the container.

**Root cause:** `useRef` doesn't trigger an effect re-run when the ref attaches. The effect runs once with `containerRef.current === null` and never again.

**Fix:** Use `useState<HTMLDivElement | null>(null)` and pass `setContainer` as the ref callback. State change triggers the effect.

```tsx
const [container, setContainer] = useState<HTMLDivElement | null>(null);

useEffect(() => {
  if (!container) return;
  // ... mount Sigma
}, [container, graph]);

return <div ref={setContainer} className="absolute inset-0" />;
```

---

## Theming and colors

### Every node, edge, and label renders as black

**Symptom:** Sigma renders the canvas, FA2 layout runs, you can pan/zoom, but everything is black. Hex literals work; CSS-variable colors fail.

**Root cause:** Tailwind v4 globals.css uses `oklch(...)`. `getComputedStyle` returns those values as `lab(...)` on most browsers. Sigma's WebGL color parser only knows `#hex`, `rgb(...)`, and `rgba(...)`. It silently falls back to black on unrecognized inputs.

**Fix:** Round-trip every CSS-variable color through a 1×1 Canvas2D pixel and read RGB back via `getImageData`. See [theme-and-styling.md §Canvas2D fix](theme-and-styling.md#the-canvas2d-rasterization-round-trip-fix).

**Source:** [`force-graph/lib/theme.ts`](../../src/registry/components/data/force-graph/lib/theme.ts); [html2canvas oklch issue](https://github.com/niklasvh/html2canvas/issues/3269) (same root cause, different library).

---

### Hover label is unreadable on dark canvas

**Symptom:** Hovering a node shows a glowing white box with white-on-white or black-on-black text.

**Root cause:** Sigma's stock `defaultDrawNodeHover` hardcodes `fillStyle = "white"` and `shadowColor = "black"`. Theme-blind by design.

**Fix:** Provide a theme-aware factory via `defaultDrawNodeHover`. See [theme-and-styling.md §custom hover](theme-and-styling.md#custom-defaultdrawnodehover-for-dark-canvas-readability).

**Source:** [`force-graph/lib/draw-node-hover.ts`](../../src/registry/components/data/force-graph/lib/draw-node-hover.ts).

---

### Graph theme drifts from the surrounding UI on host theme flip

**Symptom:** Host document toggles `.dark`, the rest of the page recolors, but the graph stays in its previous palette.

**Root cause:** Sigma instances do not subscribe to `documentElement` class changes. Whatever palette was captured at construction is what Sigma uses until you tell it otherwise.

**Fix:** Capture both palettes via hidden `.dark`/`.light` helper elements at module init. Pass the resolved theme as a prop. On theme prop change, call `setSetting()` for every theme-derived Sigma setting AND walk the graph to remerge per-element color attributes.

```tsx
useEffect(() => {
  const sigma = sigmaRef.current;
  if (!sigma) return;
  sigma.setSetting("defaultNodeColor", theme.nodeColor);
  sigma.setSetting("defaultEdgeColor", theme.edgeColor);
  sigma.setSetting("labelColor", { color: theme.labelColor });
  sigma.setSetting("defaultDrawNodeHover", makeDrawNodeHover(theme));
  // Parent walks the graph + remerges attrs in a separate effect.
  sigma.refresh();
}, [theme]);
```

**Source:** [`force-graph/lib/theme.ts`](../../src/registry/components/data/force-graph/lib/theme.ts); [`force-graph/parts/sigma-container.tsx`](../../src/registry/components/data/force-graph/parts/sigma-container.tsx).

---

## Layout and FA2

### Dragged node "snaps back" or fights the cursor

**Symptom:** Holding a node and dragging shows visible flicker. The node may walk to a previous position over 1–2 seconds after release.

**Root cause:** `graphology-layout-forceatlas2/worker` builds its position matrix at `start()` and only re-reads on `nodeAdded` / `edgeAdded` / `nodeDropped` / `edgeDropped` events. Setting `fixed: true` mid-flight is invisible; the worker keeps writing the matrix's stored position back over your cursor updates.

**Fix:** Pause the worker on `downNode` and resume on `mouseup` — in this project via the `FA2Controls` wrapper: `worker.setEnabled(false)` (calls `layout.stop()`) on down, `worker.setEnabled(true)` (calls `layout.start()`) on up. Resume rebuilds the matrix and picks up the new `fixed` value. See [fa2-and-physics.md §drag-during-FA2](fa2-and-physics.md#drag-during-fa2-pause-on-down--resume-on-up).

**Source:** [`force-graph/hooks/use-drag-handler.ts`](../../src/registry/components/data/force-graph/hooks/use-drag-handler.ts).

---

### Disconnected components fly off-screen

**Symptom:** A graph with multiple disconnected subgraphs has one component centered, the others drifting toward infinity over time.

**Root cause:** Default `gravity: 1` is too weak to keep disconnected components together — they only attract via edges, and there are no edges between them.

**Fix:** Bump `gravity` to 5–10. Or enable `strongGravityMode: true`. Or pre-seed positions via `circular` layout from `graphology-layout` before kicking FA2.

```tsx
new FA2Layout(graph, {
  settings: { gravity: 5, strongGravityMode: false, ...rest },
});
```

---

### FA2 never settles, nodes wiggle forever

**Symptom:** Layout keeps oscillating. CPU stays at 100%. No equilibrium.

**Root cause:** Either `slowDown` is too low, the graph has no anchor (very low gravity), or you're running continuously with cascading perturbations from external mutations.

**Fix:** Increase `slowDown` (try 5–10). Increase `gravity`. Switch from continuous-run to settle-then-stop (`kick()` for `layoutSettleDuration` ms after each mutation). See [fa2-and-physics.md §settle-then-stop](fa2-and-physics.md#settle-then-stop-vs-continuous-run).

---

### `setEnabled(true)` doesn't restart layout after `kill()`

**Symptom:** A layout-enabled toggle worked once, then never again.

**Root cause:** After `worker.kill()`, the instance is dead. Calling `start()` is a no-op.

**Fix:** Recreate the worker. Track in a ref and gate on cleanup:

```tsx
const workerRef = useRef<FA2Layout | null>(null);

useEffect(() => {
  const w = new FA2Layout(graph, { settings });
  workerRef.current = w;
  return () => {
    w.kill();
    if (workerRef.current === w) workerRef.current = null;
  };
}, [graph, settings.repulsion, settings.gravity]);
```

**Source:** [`force-graph/hooks/use-fa2-worker.ts`](../../src/registry/components/data/force-graph/hooks/use-fa2-worker.ts).

---

## Lifecycle and updates

### `setSetting` crashes after component unmount

**Symptom:** Console shows `TypeError: Cannot read property 'render' of undefined` (or similar) shortly after navigating away from a graph view.

**Root cause:** `setSetting()` schedules a `requestAnimationFrame` that runs `render()`. If the Sigma instance was killed between the `setSetting` call and the rAF firing, `render()` runs against an empty `nodePrograms` map and throws.

**Fix:** In every update effect, early-return on null. In cleanup, null the ref BEFORE `kill()`.

```tsx
useEffect(() => {
  const sigma = sigmaRef.current;
  if (!sigma) return; // <-- always check
  sigma.setSetting(...);
}, [dep]);

return () => {
  cancelled = true;
  if (instance) instance.kill();
  sigmaRef.current = null;
};
```

**Source:** [`force-graph/parts/sigma-container.tsx`](../../src/registry/components/data/force-graph/parts/sigma-container.tsx).

---

### Sigma remounts on every theme flip / settings nudge

**Symptom:** Camera resets to default. FA2 restarts. Hover state clears. Every UI interaction that changes a theme or setting prop tears the graph down.

**Root cause:** The construction effect's deps include `theme` and/or `settings`, so React tears down + reconstructs Sigma on every change.

**Fix:** Mount-time prop snapshot via per-prop refs. Construction effect deps reduce to `[container, graph]`. Theme/settings live-update via separate effects calling `setSetting()`. See [sigma-lifecycle.md §mount-time-prop-snapshot](sigma-lifecycle.md#mount-time-prop-snapshot-via-per-prop-refs).

**Source:** [`force-graph/parts/sigma-container.tsx`](../../src/registry/components/data/force-graph/parts/sigma-container.tsx).

---

### Adapter recreated on every theme change

**Symptom:** A `useGraphologyAdapter` hook (or similar imperative wrapper) re-creates on every render. Source-adapter subscriptions tear down + re-bootstrap, causing flickering data.

**Root cause:** `theme` is a memo dep on the adapter. The adapter's downstream consumers (the source-adapter hook) take the adapter as a memo dep, so theme cascades through the entire chain.

**Fix:** Mirror theme into a ref inside the adapter. Read `themeRef.current` at call time, not at memo-time. Adapter deps become `[store, graph]`.

```tsx
const themeRef = useRef(theme);
useEffect(() => { themeRef.current = theme; }, [theme]);

return useMemo(() => ({
  importSnapshot(snapshot) {
    const currentTheme = themeRef.current; // read at call time
    // ... use currentTheme
  },
}), [store, graph]); // theme NOT a dep
```

**Source:** [`force-graph/hooks/use-graphology-adapter.ts`](../../src/registry/components/data/force-graph/hooks/use-graphology-adapter.ts).

---

## Programs and rendering

### Nodes render as nothing when edge programs are overridden

**Symptom:** Edges appear correctly, nodes are invisible. No console error.

**Root cause:** When you supply `edgeProgramClasses`, Sigma's bundled node-program registry doesn't auto-populate. `nodeProgramClasses` is empty; the default node program (circle) isn't registered.

**Fix:** Always register `NodeCircleProgram` explicitly when you override edges.

```tsx
import { NodeCircleProgram } from "sigma/rendering";

new Sigma(graph, container, {
  defaultNodeType: "circle",
  nodeProgramClasses: { circle: NodeCircleProgram },
  edgeProgramClasses: { rectangle: EdgeRectangleProgram, arrow: EdgeArrowProgram },
});
```

**Source:** [`force-graph/parts/sigma-container.tsx`](../../src/registry/components/data/force-graph/parts/sigma-container.tsx).

---

### Edges visibly disappear during pan/zoom

**Symptom:** Every drag, scroll, or pinch makes all edges flicker out and back. Feels broken on small graphs.

**Root cause:** `hideEdgesOnMove: true` is Sigma's default. It's a perf optimization for large graphs but presents as visual jank for everyone else.

**Fix:** Set `hideEdgesOnMove: false` unless you have >50k edges. See [performance.md §hideEdgesOnMove](performance.md#hideedgesonmove).

```tsx
new Sigma(graph, container, { hideEdgesOnMove: false });
```

---

### Custom edge program renders but arrow doesn't

**Symptom:** Edges with `type: "arrow"` render as plain rectangles with no arrowhead.

**Root cause:** `EdgeArrowProgram` not registered, or `defaultEdgeType` isn't being overridden per-edge.

**Fix:** Register both programs and set `type` per-edge.

```tsx
new Sigma(graph, container, {
  defaultEdgeType: "rectangle",
  edgeProgramClasses: {
    rectangle: EdgeRectangleProgram,
    arrow: EdgeArrowProgram,
  },
});

graph.addEdge("a", "b", { type: "arrow" }); // arrowhead
graph.addEdge("b", "c", { /* falls back to "rectangle" */ });
```

---

### Reducer changes don't paint until mouse moves

**Symptom:** You set a new selection, the reducer closure has the new IDs, but the canvas still shows the old highlight until you wiggle the mouse.

**Root cause:** Setting a reducer closure does not by itself trigger a re-paint. Sigma re-renders on graphology events and on user input, but not on closure replacement.

**Fix:** Call `sigma.refresh()` (or `scheduleRefresh()`) after `setSetting("nodeReducer", ...)`.

```tsx
useEffect(() => {
  if (!sigma) return;
  sigma.setSetting("nodeReducer", (id, attrs) => /* ... uses selectedSet */);
  sigma.refresh();
}, [sigma, selectedSet]);
```

**Source:** [Sigma v3 lifecycle docs](https://www.sigmajs.org/docs/advanced/lifecycle/).

---

## Captors and interaction

### Stage pans during a node drag

**Symptom:** Dragging a node also pans the camera. Both motions accumulate.

**Root cause:** Sigma's stage panner runs in parallel with custom `downNode` + `moveBody` handlers unless you explicitly suppress it.

**Fix:** Call `event.preventSigmaDefault()` in the `downNode` handler. Add `event.original.preventDefault()` for good measure (suppresses some browser native behaviors).

```tsx
sigma.on("downNode", ({ event }) => {
  event.preventSigmaDefault();
  event.original.preventDefault?.();
});
```

**Source:** [`force-graph/hooks/use-drag-handler.ts`](../../src/registry/components/data/force-graph/hooks/use-drag-handler.ts).

---

### Dragged node teleports by the container's screen offset

**Symptom:** Click-and-drag a node and it jumps by exactly the container's distance from the screen edge.

**Root cause:** Confusing `event.x` / `event.y` (container-relative) with `event.original.clientX` / `clientY` (window-relative). Passing `clientX`/`Y` to `viewportToGraph` adds the container's bounding-rect offset.

**Fix:** Use `event.x` / `event.y` directly. Sigma's mouse captor already applies `getBoundingClientRect()` for you.

```tsx
sigma.on("moveBody", ({ event }) => {
  const pos = sigma.viewportToGraph({ x: event.x, y: event.y }); // <-- container-relative
  graph.setNodeAttribute(node, "x", pos.x);
  graph.setNodeAttribute(node, "y", pos.y);
});
```

**Source:** [`force-graph/hooks/use-drag-handler.ts`](../../src/registry/components/data/force-graph/hooks/use-drag-handler.ts).

---

## React 19 compiler / lint

### Lint flags `setState in useEffect for derivable state`

**Symptom:** ESLint or React Compiler-aware lint reports a "you don't need this effect" warning around a mounted-flag pattern.

**Root cause:** The classic `const [mounted, setMounted] = useState(false); useEffect(() => setMounted(true), [])` pattern is now flagged.

**Fix:** Use `useSyncExternalStore` with no-op subscribe and snapshot returning `true`/`false` for client/server.

```tsx
const noopSubscribe = () => () => {};
const getMountedSnapshot = () => true;
const getServerSnapshot = () => false;

const isMounted = useSyncExternalStore(noopSubscribe, getMountedSnapshot, getServerSnapshot);
```

**Source:** [`force-graph/hooks/use-theme-resolution.ts`](../../src/registry/components/data/force-graph/hooks/use-theme-resolution.ts).

---

### Lint flags `ref read during render`

**Symptom:** React Compiler-aware lint reports a ref read in a render expression (e.g. inside JSX or a memo body).

**Root cause:** Reading `ref.current` during render produces stale-value bugs because refs don't trigger re-renders. The lint catches the pattern proactively.

**Fix:** Move the ref read to a callback or effect. If you need the ref's current value as a derived render-time value, hold it in state or `useSyncExternalStore` instead.

```tsx
// BAD
const sigma = sigmaRef.current;
return <div>{sigma ? "ready" : "loading"}</div>;

// GOOD — pair the ref with a state flag and update both in cleanup.
const [ready, setReady] = useState(false);
useEffect(() => {
  // ... mount, then setReady(true)
  return () => setReady(false);
}, [container]);
return <div>{ready ? "ready" : "loading"}</div>;
```

---

### Effect re-fires on every render due to inline-object dep

**Symptom:** A construction effect remounts every render despite stable underlying state.

**Root cause:** Passing an inline object as a dep, e.g. `useEffect(..., [{ key: state.key }])`. Object identity changes every render.

**Fix:** Hoist the object, or use individual properties as deps:

```tsx
// BAD
useEffect(() => {...}, [{ a: state.a, b: state.b }]);

// GOOD
useEffect(() => {...}, [state.a, state.b]);
```

---

## Miscellaneous

### Worker fails to construct in jsdom / Vitest

**Symptom:** Tests crash with `Worker is not defined` or `URL.createObjectURL is not a function`.

**Root cause:** jsdom doesn't ship a Worker implementation. `graphology-layout-forceatlas2/worker` constructs a Worker via `new Worker(URL.createObjectURL(...))`.

**Fix:** Wrap construction in try/catch. Treat worker-unavailable as "layout disabled," not as a fatal error.

```tsx
try {
  worker = new FA2Layout(graph, { settings });
} catch {
  // Worker unavailable — controls become no-ops.
  return;
}
```

**Source:** [`force-graph/hooks/use-fa2-worker.ts`](../../src/registry/components/data/force-graph/hooks/use-fa2-worker.ts).

---

### Edge labels disappear when node labels are empty

**Symptom:** A node with empty `label` causes its edges' labels to also disappear, even though `renderEdgeLabels: true`.

**Root cause:** Long-standing Sigma issue ([#1200](https://github.com/jacomyal/sigma.js/issues/1200)) — edge labels are gated on the source/target node labels being non-empty.

**Fix:** Provide a non-empty label for every node, even if it's a single space `" "` or a placeholder. Or render edge labels via the SVG overlay instead.

**Source:** [Sigma issue #1200](https://github.com/jacomyal/sigma.js/issues/1200).

---

### Camera state lost when graph is replaced

**Symptom:** Calling `sigma.setGraph(newGraph)` resets camera to default.

**Root cause:** `setGraph` reinitializes internal indices including the camera state by default.

**Fix:** Capture and restore camera state across the swap.

```tsx
const cam = sigma.getCamera();
const state = cam.getState();
sigma.setGraph(newGraph);
cam.setState(state);
sigma.refresh();
```

**Source:** Pattern documented in [Sigma v3 lifecycle docs](https://www.sigmajs.org/docs/advanced/lifecycle/).

---

### `setGraph` mishandles highlighted nodes (Sigma 3.0.1 and earlier)

**Symptom:** Calling `setGraph` while nodes are highlighted leaves stale highlight state.

**Root cause:** Bug in pre-3.0.2 `setGraph` implementation.

**Fix:** Upgrade to `sigma@3.0.2` or later. See [CHANGELOG](https://github.com/jacomyal/sigma.js/blob/main/CHANGELOG.md).

---

### Performance degradation after dragging stops (Sigma 3.0.0)

**Symptom:** After dragging a node and releasing, FPS drops by half until the next interaction.

**Root cause:** Bug in 3.0.0 — internal index not invalidated correctly post-drag.

**Fix:** Upgrade to `sigma@3.0.1` or later.

**Source:** [CHANGELOG entry for 3.0.1](https://github.com/jacomyal/sigma.js/blob/main/CHANGELOG.md).
