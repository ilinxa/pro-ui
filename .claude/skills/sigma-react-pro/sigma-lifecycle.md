# Sigma v3 lifecycle in React 19

The single most expensive thing you can get wrong is the mount/unmount/update boundary. Get it right once and the rest is cosmetic.

## SSR-safe dynamic import

`sigma/rendering` references `WebGL2RenderingContext` at module-evaluation. Top-level `import "sigma/rendering"` crashes on Next.js 16 prerender (and any other SSR runtime where `WebGL2RenderingContext` is `undefined`). The fix is to keep `import type` for compile-time and use `import()` inside an effect.

```tsx
"use client";

import { useEffect, useRef, useState } from "react";
import type SigmaType from "sigma";
import type { MultiGraph } from "graphology";

interface Props {
  graph: MultiGraph;
  className?: string;
}

export function SigmaCanvas({ graph, className }: Props) {
  const [container, setContainer] = useState<HTMLDivElement | null>(null);
  const sigmaRef = useRef<SigmaType | null>(null);

  useEffect(() => {
    if (!container) return;

    let cancelled = false;
    let instance: SigmaType | null = null;

    Promise.all([import("sigma"), import("sigma/rendering")]).then(
      ([sigmaMod, renderingMod]) => {
        if (cancelled) return;
        const SigmaClass = sigmaMod.default;
        const { NodeCircleProgram, EdgeRectangleProgram, EdgeArrowProgram } =
          renderingMod;

        instance = new SigmaClass(graph, container, {
          defaultNodeType: "circle",
          defaultEdgeType: "rectangle",
          nodeProgramClasses: { circle: NodeCircleProgram },
          edgeProgramClasses: {
            rectangle: EdgeRectangleProgram,
            arrow: EdgeArrowProgram,
          },
          allowInvalidContainer: true,
        });

        sigmaRef.current = instance;
      },
    );

    return () => {
      cancelled = true;
      if (instance) instance.kill();
      sigmaRef.current = null;
    };
  }, [container, graph]);

  return (
    <div
      ref={setContainer}
      className={className ?? "absolute inset-0"}
      tabIndex={0}
      role="application"
    />
  );
}
```

Three things to notice:

1. **`useState` for the container, not `useRef`.** `useRef` doesn't trigger an effect re-run when the DOM node attaches. `useState` does. The effect runs as soon as the ref callback fires.
2. **`cancelled` flag.** A fast unmount → remount can produce two live Sigma instances on the same DOM node if the resolved promise from the first mount runs after the second mount started. Without the flag, you get an invisible second canvas leaking memory and event listeners.
3. **`allowInvalidContainer: true`.** Sigma throws if it constructs against a 0×0 container. Between ref attach and CSS layout settling, that's possible on the first render frame. This setting lets construction proceed and Sigma resizes itself once the container has area.

See: [`src/registry/components/data/force-graph/parts/sigma-container.tsx`](../../src/registry/components/data/force-graph/parts/sigma-container.tsx).

## Mount-time settings vs update-time settings

Settings split into two groups:

| Mount-time only | Live-updatable via `setSetting()` |
|---|---|
| `nodeProgramClasses`, `edgeProgramClasses` | `defaultNodeColor`, `defaultEdgeColor` |
| `defaultNodeType`, `defaultEdgeType` | `labelColor`, `edgeLabelColor` |
| `allowInvalidContainer` | `labelFont`, `labelDensity`, `labelRenderedSizeThreshold` |
| | `hideEdgesOnMove`, `renderEdgeLabels` |
| | `defaultDrawNodeHover`, `defaultDrawNodeLabel`, `defaultDrawEdgeLabel` |
| | `nodeReducer`, `edgeReducer` |
| | `minCameraRatio`, `maxCameraRatio` |
| | `enableEdgeEvents` (caveat below) |

Mount-time settings require a fresh Sigma instance — there is no public API to swap programs after construction. Live-updatable settings should be applied via `setSetting()` from a separate effect keyed on the relevant prop, not by tearing down the instance.

```tsx
// Update effect — does NOT remount Sigma.
useEffect(() => {
  const sigma = sigmaRef.current;
  if (!sigma) return; // bail during dynamic-import window
  sigma.setSetting("defaultNodeColor", theme.nodeColor);
  sigma.setSetting("defaultEdgeColor", theme.edgeColor);
  sigma.setSetting("labelColor", { color: theme.labelColor });
  sigma.refresh();
}, [theme]);
```

`refresh()` re-indexes WebGL buffers and re-renders. `scheduleRefresh()` is the same operation debounced to next animation frame — prefer it inside high-frequency callbacks (e.g. mouse-move reducers).

**Important:** `setSetting()` on a killed Sigma instance schedules a `requestAnimationFrame` that runs `render()` against an empty `nodePrograms` map. Always early-return on `!sigmaRef.current`, and null the ref in cleanup before calling `kill()`. See [pitfalls-and-fixes.md #killed-setSetting](pitfalls-and-fixes.md#killed-setSetting-crash).

## Programs registry

Programs are the WebGL pipelines that draw nodes/edges. Sigma v3 ships:

| Import | Purpose |
|---|---|
| `NodeCircleProgram` (from `sigma/rendering`) | filled disc node |
| `EdgeRectangleProgram` (from `sigma/rendering`) | thin straight-line edge |
| `EdgeArrowProgram` (from `sigma/rendering`) | straight-line edge with arrowhead |
| `@sigma/edge-curve` | curved edges (multi-edge spreading) |
| `@sigma/node-image` | image-textured node |
| `@sigma/node-border` | bordered node |

Each program registers under a key in `nodeProgramClasses` / `edgeProgramClasses`. Per-element `type` attribute selects which program renders it.

```tsx
import { NodeCircleProgram, EdgeRectangleProgram, EdgeArrowProgram } from "sigma/rendering";

new Sigma(graph, container, {
  defaultNodeType: "circle",
  defaultEdgeType: "rectangle",
  nodeProgramClasses: {
    circle: NodeCircleProgram,
  },
  edgeProgramClasses: {
    rectangle: EdgeRectangleProgram,
    arrow: EdgeArrowProgram,
  },
});

graph.addEdge("a", "b", { type: "arrow", size: 2, color: "#888" });
graph.addEdge("b", "c", { /* falls back to defaultEdgeType: "rectangle" */ });
```

### The `nodeProgramClasses` auto-population gotcha

If you supply `edgeProgramClasses` but not `nodeProgramClasses`, the bundled node-program registry doesn't auto-populate. Nodes render as nothing. Always register `NodeCircleProgram` explicitly when overriding edges, even if you don't override nodes.

See [pitfalls-and-fixes.md #nodeProgramClasses-auto](pitfalls-and-fixes.md#nodeProgramClasses-auto-population-fails-when-edges-overridden).

### Custom programs

Sigma v3 [rewrote the programs API](https://github.com/jacomyal/sigma.js/blob/main/CHANGELOG.md). A program is a class with `render` / `process` methods. For most apps you do not write your own; pull from the official `@sigma/*` packages. If you need custom (e.g. dashed directed edges with per-edge dash phase), follow the structure of `EdgeRectangleProgram` in [sigma source](https://github.com/jacomyal/sigma.js/tree/main/packages/sigma/src/rendering).

## Reducers (`nodeReducer`, `edgeReducer`)

Reducers transform per-element attributes immediately before rendering, without mutating graphology. Use them for:

- focus / dim states (selection, hover, neighbor highlight)
- temporary visual overlays (filter results, search highlight)
- per-render label gating

```tsx
sigma.setSetting("nodeReducer", (id, attrs) => {
  if (selectedIds.has(id)) {
    return { ...attrs, color: theme.selectionRing, zIndex: 1 };
  }
  if (hoveredId && !neighborSet.has(id) && id !== hoveredId) {
    return { ...attrs, color: withAlpha(attrs.color, 0.2), label: "" };
  }
  return attrs;
});
```

**Performance posture:**

- Reducers run for every visible element on every render. They MUST be cheap — no Map lookups in hot paths if you can use a `Set`, no object allocation when you can early-return the input attrs unchanged.
- Reducers re-run on every `setSetting` call that bumps a render. Don't inline a closure that allocates over `selectedIds` if the set hasn't changed — pull it into a stable ref.
- If you change `selectedIds`, you must call `sigma.refresh()` (or `scheduleRefresh()`) to trigger a re-paint — Sigma can't observe arbitrary external state. The reducer closure captures the current value when the function is set.

## Captors (mouse, touch)

Captors translate raw input into Sigma events. Access via `sigma.getMouseCaptor()` / `sigma.getTouchCaptor()`.

```tsx
sigma.on("downNode", ({ node, event }) => {
  // event.x, event.y are CONTAINER-relative — pass straight to viewportToGraph.
  // Do not add getBoundingClientRect() offsets, you will teleport the node.
  const pos = sigma.viewportToGraph({ x: event.x, y: event.y });

  // Suppress Sigma's stage panner so it doesn't run in parallel with custom drag.
  event.preventSigmaDefault();
  event.original.preventDefault?.();
});

const captor = sigma.getMouseCaptor();
captor.on("mouseup", () => { /* finalize drag */ });
```

`event.preventSigmaDefault()` is Sigma's analog to DOM `event.preventDefault()`. Without it, the stage panner engages alongside your custom handler and the camera pans during a node drag.

See: [`src/registry/components/data/force-graph/hooks/use-drag-handler.ts`](../../src/registry/components/data/force-graph/hooks/use-drag-handler.ts).

## Camera

```tsx
const cam = sigma.getCamera();

// Programmatic move with animation:
cam.animate({ x: 0.5, y: 0.5, ratio: 1, angle: 0 }, { duration: 600 });

// Instant set:
cam.setState({ x: 0.5, y: 0.5, ratio: 1, angle: 0 });

// Coordinate transforms:
sigma.graphToViewport({ x: 100, y: 100 });
sigma.viewportToGraph({ x: 0, y: 0 });
```

For "fit graph in viewport," compute the graph's bounding box (you already have node x/y in graphology), pad it, and animate the camera. Sigma does not ship a built-in fit().

## Default draw overrides

`defaultDrawNodeHover` and `defaultDrawNodeLabel` are Canvas2D callbacks Sigma calls for the hover card and label respectively. The stock `defaultDrawNodeHover` hardcodes a white fill and black drop-shadow, illegible on a dark canvas. Replace with a theme-aware factory:

```tsx
function makeDrawNodeHover(theme: { background: string; labelColor: string }) {
  return function (
    ctx: CanvasRenderingContext2D,
    data: { x: number; y: number; size: number; label: string | null },
    settings: { labelSize: number; labelFont: string; labelWeight: string },
  ) {
    ctx.font = `${settings.labelWeight} ${settings.labelSize}px ${settings.labelFont}`;
    ctx.fillStyle = theme.background;
    ctx.strokeStyle = theme.labelColor;
    ctx.shadowColor = "rgba(0,0,0,0.45)";
    ctx.shadowBlur = 12;
    ctx.shadowOffsetY = 2;
    // ... draw a rounded box anchored at the node, then fill+stroke
  };
}

new Sigma(graph, container, {
  defaultDrawNodeHover: makeDrawNodeHover(theme),
});
```

Full implementation: [`src/registry/components/data/force-graph/lib/draw-node-hover.ts`](../../src/registry/components/data/force-graph/lib/draw-node-hover.ts).

## kill() and the post-kill setSetting crash

`sigma.kill()` releases WebGL contexts, removes event listeners, and detaches from the graph. After `kill()`, the instance is dead — but `setSetting()` does not check if the instance is killed before scheduling a `requestAnimationFrame`. The rAF runs `render()` against an empty `nodePrograms` map and throws.

```tsx
return () => {
  cancelled = true;
  if (instance) {
    instance.kill();
  }
  sigmaRef.current = null; // <-- nullify BEFORE any concurrent effect can read it
};
```

In update effects, always:

```tsx
useEffect(() => {
  const sigma = sigmaRef.current;
  if (!sigma) return; // bail if killed or mid-construction
  sigma.setSetting(...);
}, [dep]);
```

## React 19 patterns

### `ref` as a prop (no `forwardRef`)

React 19 removed the need for `forwardRef`. Refs flow as plain props.

```tsx
interface Props {
  ref?: React.Ref<HTMLDivElement>;
  children?: React.ReactNode;
}

export function Container({ ref, children }: Props) {
  return <div ref={ref}>{children}</div>;
}
```

### `useImperativeHandle` for the Sigma instance

Expose a typed handle to consumers:

```tsx
interface ForceGraphHandle {
  getSigmaInstance(): SigmaType | null;
  zoomTo(nodeId: string): void;
}

export function ForceGraph({ ref, ...props }: Props & { ref?: React.Ref<ForceGraphHandle> }) {
  const sigmaRef = useRef<SigmaType | null>(null);
  useImperativeHandle(ref, () => ({
    getSigmaInstance: () => sigmaRef.current,
    zoomTo: (id) => {
      const sigma = sigmaRef.current;
      if (!sigma) return;
      const { x, y } = sigma.getNodeDisplayData(id) ?? { x: 0, y: 0 };
      sigma.getCamera().animate({ x, y, ratio: 0.5, angle: 0 });
    },
  }), []);
  // ... mount Sigma
}
```

### Mount-time prop snapshot via per-prop refs

Construction effects should not depend on every prop — that would remount Sigma on every theme/setting nudge. Mirror props into refs read inside the construction callback:

```tsx
const themeRef = useRef(theme);
const settingsRef = useRef(settings);
useEffect(() => { themeRef.current = theme; }, [theme]);
useEffect(() => { settingsRef.current = settings; }, [settings]);

useEffect(() => {
  // Construction reads from refs at the time of mount, not at the time of effect re-run.
  const initialTheme = themeRef.current;
  const initialSettings = settingsRef.current;
  // ... mount Sigma with initialTheme/initialSettings ...
}, [container, graph]); // <-- minimal deps; theme/settings absent
```

Then a separate update effect handles theme/settings via `setSetting()`. See [`sigma-container.tsx`](../../src/registry/components/data/force-graph/parts/sigma-container.tsx) for the canonical implementation.

### `useSyncExternalStore` for SSR-safe mounted-flag

When you need "did we hydrate yet?" without setState-in-effect (which the React Compiler-aware lint flags):

```tsx
const noopSubscribe = () => () => {};
const getMountedSnapshot = () => true;
const getServerSnapshot = () => false;

function useIsMounted() {
  return useSyncExternalStore(noopSubscribe, getMountedSnapshot, getServerSnapshot);
}
```

`useSyncExternalStore` returns the server snapshot during SSR and initial hydration, then switches to the client snapshot. No `useEffect` setState, no double-render warning. See [`use-theme-resolution.ts`](../../src/registry/components/data/force-graph/hooks/use-theme-resolution.ts).

## Context vs prop-drilling for store/graph/worker

The force-graph procomp uses a single `<Provider>` exposing the graphology MultiGraph, the Zustand store, the FA2 worker controls, and the resolved theme via context. Children pull what they need.

Why context instead of prop drilling:

- The Sigma container, the FA2 worker hook, the drag handler, the SVG overlay, the keyboard-shortcut hook, and a handful of derived selectors all need the graph + store. Prop-drilling would be six props across four levels.
- The graph reference is stable across the component's lifetime — context doesn't trigger render storms.
- React 19 `<Context>` (no `.Provider` suffix) cleans up the syntax.

```tsx
const GraphCtx = createContext<{
  store: GraphStore;
  graph: MultiGraph;
  worker: FA2Controls;
  theme: ResolvedTheme;
} | null>(null);

export function GraphProvider({ children, ...value }) {
  return <GraphCtx value={value}>{children}</GraphCtx>;
}

export function useGraphStoreContext() {
  const ctx = useContext(GraphCtx);
  if (!ctx) throw new Error("useGraphStoreContext outside GraphProvider");
  return ctx;
}
```

## react-sigma — when to use the wrapper

[`@react-sigma/core` v5](https://sim51.github.io/react-sigma/) wraps Sigma in a `<SigmaContainer>` component and exposes `useSigma()`, `useLoadGraph()`, `useRegisterEvents()`, and friends. v5 added typed generics on `useLoadGraph<NodeAttrs, EdgeAttrs>()`.

It solves:
- Boilerplate for the dynamic-import dance (with Next.js `dynamic(... { ssr: false })` recipes in their docs).
- The mount/unmount lifecycle.
- A clean React event-binding story.

It does NOT solve:
- The OKLCH color rendering bug — that's in Sigma's color parser, not the wrapper.
- The FA2-fixed-attribute observability gap — that's in graphology-layout-forceatlas2/worker.
- The dark-canvas hover bug — that's Sigma's stock `defaultDrawNodeHover`.
- Theme decoupling from host document.

If your component must be portable (e.g. shipped to NPM without a Next.js dependency or framework opinion), build directly on `sigma`. If your component is app-internal and you want the boilerplate gone, `@react-sigma/core` is fine. The force-graph procomp builds direct because the registry has a hard rule against framework imports.

## Sources

- [Sigma v3 lifecycle docs](https://www.sigmajs.org/docs/advanced/lifecycle/)
- [Sigma CHANGELOG](https://github.com/jacomyal/sigma.js/blob/main/CHANGELOG.md)
- [Sigma v3.0 announcement (Ouestware blog)](https://www.ouestware.com/2024/03/21/sigma-js-3-0-en/)
- [Sigma v3 → v4 roadmap discussion](https://github.com/jacomyal/sigma.js/discussions/1469)
- [react-sigma v5 docs](https://sim51.github.io/react-sigma/)
- [Next.js + react-sigma SSR discussion](https://github.com/vercel/next.js/discussions/73861)
