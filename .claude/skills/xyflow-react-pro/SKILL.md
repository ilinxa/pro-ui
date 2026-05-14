---
name: xyflow-react-pro
description: >
  Production patterns for @xyflow/react v12 (React Flow successor) in Next.js 16 + React 19 + Tailwind v4 + TypeScript.
  Covers install + required CSS import, parent-dimensions rule, controlled vs uncontrolled state, every component and hook
  the library exports, custom node/edge registration with the CRITICAL memoization rule, typed-port connection validation,
  drag-from-sidebar, save/restore, theming with --xy-* CSS variables, performance levers (React.memo, onlyRenderVisibleElements,
  narrow useStore selectors), Next.js SSR boundary placement, React 19 compat, and v11 to v12 renames. Use when building flow
  editors, node graphs, workflow canvases, port-and-edge UIs, or whenever the user mentions xyflow, @xyflow/react, React Flow,
  ReactFlow, node editor, flow canvas, or works in a file importing from @xyflow/react.
---

# xyflow-react-pro

Production-grade `@xyflow/react` v12 (React Flow successor) — node-flow canvas, custom nodes/edges, typed ports, save/restore — for Next.js 16 + React 19 + Tailwind v4 + TypeScript.

The library is MIT, no feature gates ([reactflow.dev/pro](https://reactflow.dev/pro)). All API references in this skill cite reactflow.dev (still the live docs domain; xyflow.com cross-redirects).

## Quick start

```bash
pnpm add @xyflow/react
```

Latest stable as of 2026-05: `@xyflow/react@12.10.2`. Peer deps: `react >=17`, `react-dom >=17`. React 19 satisfied by the open range; treat 12.10.2 as the safe baseline ([npm](https://www.npmjs.com/package/@xyflow/react)).

Required CSS at app top-level (root layout, NOT inside the canvas component):
```ts
import '@xyflow/react/dist/style.css';
```

For fully-restyled apps, the structural-only stylesheet:
```ts
import '@xyflow/react/dist/base.css';
```

Minimum viable canvas:
```tsx
'use client';
import { ReactFlow, Background, Controls } from '@xyflow/react';
import '@xyflow/react/dist/style.css';

export function Flow() {
  return (
    <div style={{ width: '100%', height: '100vh' }}>
      <ReactFlow defaultNodes={[{ id: '1', position: { x: 0, y: 0 }, data: { label: 'A' } }]}>
        <Background />
        <Controls />
      </ReactFlow>
    </div>
  );
}
```

## The three highest-frequency LLM mistakes — read first

These three account for most "it's broken" reports. Internalize them.

### 1. Parent dimensions rule

The wrapper around `<ReactFlow>` MUST have explicit width and height. Common Tailwind mistake: putting `h-screen` on `<ReactFlow>` itself instead of its wrapper. Official warning: *"The React Flow parent container needs a width and a height to render the graph."* ([reactflow.dev/learn/troubleshooting](https://reactflow.dev/learn/troubleshooting))

```tsx
// Wrong — <ReactFlow> measures 0×0
<ReactFlow className="h-screen w-screen" ... />

// Right — wrapper has dimensions
<div className="h-screen w-screen">
  <ReactFlow ... />
</div>
```

### 2. Memoize `nodeTypes` / `edgeTypes`

Define at module scope or wrap in `useMemo`. A new object reference each render triggers teardown/remount of every custom node — flicker, lost focus, broken handles, sometimes infinite render loops. Official warning: *"It looks like you have created a new nodeTypes or edgeTypes object."*

```tsx
// Wrong — fresh object every render
function Flow() {
  return <ReactFlow nodeTypes={{ counter: CounterNode }} ... />;
}

// Right — module scope
const nodeTypes = { counter: CounterNode };
function Flow() {
  return <ReactFlow nodeTypes={nodeTypes} ... />;
}

// Right — useMemo (when types depend on props)
function Flow({ Theme }) {
  const nodeTypes = useMemo(() => ({ counter: makeCounter(Theme) }), [Theme]);
  return <ReactFlow nodeTypes={nodeTypes} ... />;
}
```

### 3. `<ReactFlowProvider>` for sibling components

Hooks like `useReactFlow`, `useStore`, `useViewport` work inside the `<ReactFlow>` subtree without a provider. The provider is only required when components OUTSIDE the canvas (e.g. a sibling sidebar that calls `screenToFlowPosition`) need those hooks. Without it: *"Seems like you have not used zustand provider as an ancestor."*

```tsx
// Wrong — Sidebar can't read flow state
<>
  <Sidebar />          {/* calls useReactFlow → throws */}
  <ReactFlow ... />
</>

// Right
<ReactFlowProvider>
  <Sidebar />          {/* now works */}
  <ReactFlow ... />
</ReactFlowProvider>
```

## v11 → v12 renames LLMs most often mis-emit

If your training data is v11-flavored, you'll silently emit broken code on v12. Map them ([reactflow.dev/learn/troubleshooting/migrate-to-v12](https://reactflow.dev/learn/troubleshooting/migrate-to-v12)):

| v11 | v12 |
|---|---|
| `import ReactFlow from 'reactflow'` (default) | `import { ReactFlow } from '@xyflow/react'` (named) |
| `'reactflow/dist/style.css'` | `'@xyflow/react/dist/style.css'` |
| `node.width` / `node.height` (measured) | `node.measured?.width` / `node.measured?.height` (measured); `node.width`/`height` now mean explicit fixed inline size |
| `parentNode` | `parentId` |
| `onEdgeUpdate*`, `edgeUpdaterRadius` | `onReconnect*`, `reconnectRadius` |
| `nodeInternals` | `nodeLookup` |
| `xPos` / `yPos` (NodeProps) | `positionAbsoluteX` / `positionAbsoluteY` |
| `getTransformForBounds`, `getRectOfNodes`, `project`, `getMarkerEndId`, `updateEdge` | removed (use `reconnectEdge` etc.) |

## Controlled vs uncontrolled state

Two valid modes. **Pick one per `<ReactFlow>` instance.**

### Uncontrolled (prototypes)

```tsx
import { ReactFlow, useNodesState, useEdgesState, addEdge } from '@xyflow/react';

const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

<ReactFlow
  nodes={nodes}
  edges={edges}
  onNodesChange={onNodesChange}
  onEdgesChange={onEdgesChange}
  onConnect={(c) => setEdges((es) => addEdge(c, es))}
/>
```

### Controlled (production / persistence / undo-redo)

Own the arrays in your store. Apply changes via the helpers from `@xyflow/react`:

```tsx
import { applyNodeChanges, applyEdgeChanges, addEdge } from '@xyflow/react';

const onNodesChange = (changes) => set({ nodes: applyNodeChanges(changes, nodes) });
const onEdgesChange = (changes) => set({ edges: applyEdgeChanges(changes, edges) });
const onConnect    = (c)        => set({ edges: addEdge(c, edges) });
```

Docs explicitly recommend Zustand: *"React Flow already uses it internally."* Redux / Jotai / Recoil are equally fine. ([reactflow.dev/learn/advanced-use/state-management](https://reactflow.dev/learn/advanced-use/state-management))

**Critical rule for both modes:** never mutate a node or edge in place. Always spread: `{ ...node, data: { ...node.data, x } }`. Mutation breaks change detection.

`defaultNodes` / `defaultEdges` puts you in uncontrolled mode (xyflow owns state). Passing `nodes`/`edges` as props REQUIRES `onNodesChange`/`onEdgesChange` or interactivity dies silently.

## `<ReactFlow>` — key props reference

| Prop | Type | Default | Notes |
|---|---|---|---|
| `nodes` / `edges` | `Node[]` / `Edge[]` | `[]` | Controlled mode. |
| `defaultNodes` / `defaultEdges` | same | — | Uncontrolled — initial only. |
| `nodeTypes` / `edgeTypes` | `NodeTypes` / `EdgeTypes` | builtins | **Memoize.** See above. |
| `onNodesChange` / `onEdgesChange` | functions | — | Required in controlled mode. |
| `onConnect` | `OnConnect` | — | Fires when user completes a new connection. |
| `fitView` | `boolean` | `false` | Zoom/pan to fit on initial render. |
| `defaultViewport` | `Viewport` | `{x:0,y:0,zoom:1}` | |
| `panOnDrag` | `boolean \| number[]` | `true` | Array = list of mouse buttons (`[1, 2]` = middle + right). |
| `zoomOnScroll` | `boolean` | `true` | |
| `selectionMode` | `'partial' \| 'full'` | `'full'` | `'partial'` selects nodes touching the box. |
| `deleteKeyCode` | `KeyCode \| null` | `'Backspace'` | `null` disables. |
| `multiSelectionKeyCode` | `KeyCode \| null` | `'Meta'` (mac) / `'Control'` | |
| `snapToGrid` + `snapGrid` | `boolean` + `[number, number]` | `false` | |
| `connectionLineType` | `ConnectionLineType` | `Bezier` | |
| `connectionMode` | `'strict' \| 'loose'` | `'strict'` | Strict = source→target only. |
| `isValidConnection` | `IsValidConnection<Edge>` | — | Return `boolean`. |
| `onlyRenderVisibleElements` | `boolean` | `false` | Performance lever. |
| `nodesDraggable` / `nodesConnectable` | `boolean` | `true` | Read-only flow → both `false`. |
| `connectionDragThreshold` | `number` | — | Added 12.8.0. |
| `colorMode` | `'light' \| 'dark' \| 'system'` | `'light'` | Adds `.dark` / `.light` class on the `.react-flow` root. |

([reactflow.dev/api-reference/react-flow](https://reactflow.dev/api-reference/react-flow))

## Other components

### `<Handle>`

Required: `type` (`'source' | 'target'`), `position` (`Position.Top|Right|Bottom|Left`).

**`id` is required when multiple handles of the same `type` exist on a node** — without unique ids, connections target the wrong handle.

Optional: `isConnectable`, `isConnectableStart`, `isConnectableEnd`, `isValidConnection` (per-handle override), `onConnect`, `style`, `className`. ([reactflow.dev/api-reference/components/handle](https://reactflow.dev/api-reference/components/handle))

### `<Background>`

`variant: BackgroundVariant.Dots | Lines | Cross` (default Dots), `gap` (default 20, or `[x, y]`), `size`, `color`, `lineWidth`, `offset`, `bgColor`, `id` (required if you stack two `<Background>` layers). ([reactflow.dev/api-reference/components/background](https://reactflow.dev/api-reference/components/background))

### `<MiniMap>` / `<Controls>` / `<Panel>`

- **MiniMap**: `nodeColor` (string or `(node) => string`), `nodeStrokeColor`, `nodeBorderRadius` (5), `nodeStrokeWidth` (2), `maskColor`, `position` (default `bottom-right`), `pannable`, `zoomable` (both default `false`).
- **Controls**: `showZoom` / `showFitView` / `showInteractive` (all default `true`), `position` (default `bottom-left`), `orientation: 'horizontal' | 'vertical'` (default vertical), `fitViewOptions`, `onZoomIn` / `onZoomOut` / `onFitView` / `onInteractiveChange`.
- **Panel**: required `position` (`top-left|top-center|top-right|center-left|center-right|bottom-left|bottom-center|bottom-right`). For floating toolbars, legends, status text. Standard `<div>` props.

### `<NodeResizer>` / `<NodeToolbar>`

Drop these inside a custom node component.

- **NodeResizer**: `color`, `isVisible` (true), `minWidth/minHeight` (10), `maxWidth/maxHeight` (`Number.MAX_VALUE`), `keepAspectRatio` (false), `autoScale` (true), `shouldResize`, `onResize*`, plus `handleClassName` / `handleStyle` / `lineClassName` / `lineStyle`.
- **NodeToolbar**: `nodeId: string | string[]`, `isVisible` (defaults to "shown when node selected"), `position: Position` (default `Position.Top`), `offset` (10px), `align: 'start'|'center'|'end'` (default center). Hidden when multiple nodes selected unless `isVisible` is forced.

### `<EdgeLabelRenderer>` / `<BaseEdge>` / `<EdgeToolbar>`

- **EdgeLabelRenderer**: DOM portal where edge labels can use HTML/CSS instead of SVG. Position via `transform: translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`. **Pointer events off by default** — set `pointerEvents: 'all'` AND add the `nopan` className when the label is interactive.
- **BaseEdge**: `path` (string from `getXxxPath`), `markerStart`/`markerEnd` (`url(#id)`), `interactionWidth` (20), `label`, `labelStyle`, `labelX`/`labelY`, `labelShowBg`, `labelBgStyle`, `labelBgPadding` (`[x, y]`), `labelBgBorderRadius`, `style`.
- **EdgeToolbar** (added 12.9.0): edge-attached parallel of `<NodeToolbar>`. Useful for delete/edit on selected edges.

## Hooks

All hooks must be inside a `<ReactFlowProvider>` OR inside the subtree rendered by `<ReactFlow>` itself.

| Hook | Returns | Reactive? | Notes |
|---|---|---|---|
| `useNodesState(initial)` / `useEdgesState(initial)` | `[state, setState, onChange]` | yes | Prototypes; use Zustand for production. |
| `useReactFlow<N, E>()` | imperative instance | **no** | Methods: `getNodes`, `setNodes`, `addNodes`, `getEdges`, `setEdges`, `addEdges`, `getNode`, `getEdge`, `getViewport`, `setViewport`, `fitView`, `zoomIn/Out`, `screenToFlowPosition`, `flowToScreenPosition`, `toObject`, `deleteElements`, `updateNode`, `updateNodeData`, `updateEdge`, `updateEdgeData`. Won't trigger re-renders. |
| `useStore(selector, equality?)` / `useStoreApi()` | selector slice / imperative | yes / no | Direct Zustand. *"Should only be used if there is no other way."* |
| `useViewport()` | `{x, y, zoom}` | yes | |
| `useNodes()` / `useEdges()` | full arrays | yes | **Avoid in hot components** — use narrow `useStore(selector)` slices instead. |
| `useNodeId()` | string | n/a | Inside a custom node only. |
| `useUpdateNodeInternals()` | `(nodeId) => void` | n/a | Call after dynamically adding/removing/repositioning a `<Handle>`. |
| `useOnSelectionChange({ onChange })` | void | n/a | `onChange` MUST be wrapped in `useCallback`. |
| `useKeyPress(keyCode)` | `boolean` | yes | |
| `useConnection(selector?)` | `ConnectionState` | yes | While a connection drag is in flight: `inProgress`, `from`/`to`, `fromPosition`/`toPosition`, `isValid`. |
| `useNodesInitialized(includeHidden?)` | `boolean` | yes | Flips true once every node measured — canonical trigger for auto-layout (Dagre/ELK). |
| `useNodesData(ids)` / `useHandleConnections(...)` | narrow slice | yes | Subscribe to specific node data / handle wiring. |

([reactflow.dev/api-reference/hooks/use-react-flow](https://reactflow.dev/api-reference/hooks/use-react-flow))

## Custom node pattern

```tsx
import { Handle, Position, type Node, type NodeProps } from '@xyflow/react';
import { memo } from 'react';

export type CounterNode = Node<{ count: number }, 'counter'>;

export const CounterNode = memo(function CounterNode({ data, selected }: NodeProps<CounterNode>) {
  return (
    <div className={selected ? 'selected' : ''}>
      <Handle type="target" position={Position.Left} id="in" />
      <div>{data.count}</div>
      <Handle type="source" position={Position.Right} id="out" />
    </div>
  );
});

// MUST be defined outside the component, or memoized:
const nodeTypes = { counter: CounterNode };
```

(Type and value with the same name coexist — TS's type and value namespaces are separate. This is the canonical xyflow pattern.)

`NodeProps<T>` fields: `id`, `type`, `data`, `selected`, `selectable`, `deletable`, `draggable`, `dragging`, `dragHandle`, `zIndex`, `isConnectable`, `positionAbsoluteX`, `positionAbsoluteY`, `width`, `height`, `sourcePosition`, `targetPosition`, `parentId`. ([reactflow.dev/api-reference/types/node-props](https://reactflow.dev/api-reference/types/node-props))

**Per-node behavior overrides** (set on the node OBJECT, not the component): `draggable`, `selectable`, `deletable`, `connectable`, `hidden`. These override the global `<ReactFlow nodesDraggable={...}>` flag.

## Custom edge pattern

```tsx
import { BaseEdge, EdgeLabelRenderer, getBezierPath, type Edge, type EdgeProps } from '@xyflow/react';
import { memo } from 'react';

export type LabelEdge = Edge<{ note: string }, 'label'>;

export const LabelEdge = memo(function LabelEdge({
  id, sourceX, sourceY, targetX, targetY,
  sourcePosition, targetPosition, data, markerEnd,
}: EdgeProps<LabelEdge>) {
  const [path, labelX, labelY] = getBezierPath({
    sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition,
  });
  return (
    <>
      <BaseEdge id={id} path={path} markerEnd={markerEnd} />
      <EdgeLabelRenderer>
        <div
          className="nodrag nopan"
          style={{
            position: 'absolute',
            transform: `translate(-50%,-50%) translate(${labelX}px,${labelY}px)`,
            pointerEvents: 'all',
          }}
        >
          {data?.note}
        </div>
      </EdgeLabelRenderer>
    </>
  );
});

const edgeTypes = { label: LabelEdge };
```

**Path helpers** all return `[pathString, labelX, labelY, offsetX, offsetY]`:
- `getBezierPath` — smooth curve.
- `getSimpleBezierPath` — single-segment bezier.
- `getSmoothStepPath` — orthogonal with rounded corners; takes `borderRadius`, `centerX`, `centerY`, `offset`, `stepPosition` (added 12.8.2).
- `getStraightPath` — line.

`EdgeProps`: `id`, `type` (added 12.9.0), `source`, `target`, `sourceX/Y`, `targetX/Y`, `sourcePosition`, `targetPosition`, `sourceHandleId`, `targetHandleId`, `selected`, `animated`, `label`, `labelStyle`, `data`, `markerStart`, `markerEnd`, `style`, `interactionWidth`, `selectable`, `deletable`. ([reactflow.dev/api-reference/types/edge-props](https://reactflow.dev/api-reference/types/edge-props))

## Connection validation — three layers

Applied in this order:

1. **`connectionMode`** on `<ReactFlow>`: `'strict'` (default — `source` handle ↔ `target` handle only) or `'loose'` (any-to-any).
2. **`isValidConnection` on `<ReactFlow>`** — global guard, runs for every attempted connection.
3. **`isValidConnection` on `<Handle>`** — per-handle override.

Canonical typed-port pattern (encode the type in the handle id, then validate in the global guard):

```tsx
const isValidConnection = useCallback((c: Connection) => {
  const srcType = c.sourceHandle?.split(':')[1];
  const tgtType = c.targetHandle?.split(':')[1];
  return srcType === tgtType;
}, []);

<Handle id="out:image" type="source" position={Position.Right} />
<Handle id="in:image"  type="target" position={Position.Left}  />
```

Combine with `onConnectStart` / `onConnectEnd` for visual feedback during the drag — both fire with `nodeId` and `handleType`. Custom in-flight line: pass a component to `connectionLineComponent` on `<ReactFlow>`. ([reactflow.dev/examples/interaction/validation](https://reactflow.dev/examples/interaction/validation))

## Drag-and-drop from outside the canvas

The canonical sidebar pattern:

```tsx
// Sidebar item
<div
  draggable
  onDragStart={(e) => {
    e.dataTransfer.setData('application/reactflow', 'counter');  // MIME convention
    e.dataTransfer.effectAllowed = 'move';
  }}
>
  Counter
</div>

// On the <ReactFlow> wrapper
const { screenToFlowPosition } = useReactFlow();
const onDragOver = useCallback((e: React.DragEvent) => {
  e.preventDefault();
  e.dataTransfer.dropEffect = 'move';
}, []);
const onDrop = useCallback((e: React.DragEvent) => {
  e.preventDefault();
  const type = e.dataTransfer.getData('application/reactflow');
  if (!type) return;
  const position = screenToFlowPosition({ x: e.clientX, y: e.clientY });
  setNodes((ns) => ns.concat({ id: crypto.randomUUID(), type, position, data: {} }));
}, [screenToFlowPosition, setNodes]);

<ReactFlow onDragOver={onDragOver} onDrop={onDrop} ... />
```

**MIME convention is `'application/reactflow'`** (NOT `'text/plain'`). Both `onDragOver` and `onDrop` need `preventDefault()`. Because the sidebar lives outside the canvas, the page must be wrapped in `<ReactFlowProvider>`. ([reactflow.dev/examples/interaction/drag-and-drop](https://reactflow.dev/examples/interaction/drag-and-drop))

## Save / restore

```ts
const rf = useReactFlow();
// save
const dump = rf.toObject();           // { nodes, edges, viewport }
localStorage.setItem('flow', JSON.stringify(dump));

// restore
const flow = JSON.parse(localStorage.getItem('flow') ?? 'null');
if (flow) {
  setNodes(flow.nodes ?? []);
  setEdges(flow.edges ?? []);
  const { x = 0, y = 0, zoom = 1 } = flow.viewport ?? {};
  rf.setViewport({ x, y, zoom });
}
```

Capture the instance via `onInit` if you don't want to call `useReactFlow` in the same component. ([reactflow.dev/examples/interaction/save-and-restore](https://reactflow.dev/examples/interaction/save-and-restore))

## Theming

xyflow exposes CSS custom properties under the `.react-flow` selector. Override in `globals.css`:

```css
.react-flow {
  --xy-edge-stroke-default: oklch(0.6 0.18 250);
  --xy-handle-background-color-default: oklch(0.55 0.2 132);
  --xy-background-pattern-dots-color-default: oklch(0.85 0.005 250);
}
.react-flow.dark {
  --xy-edge-stroke-default: oklch(0.85 0.18 250);
}
```

Full variable set ([reactflow.dev/learn/customization/theming](https://reactflow.dev/learn/customization/theming)):
- **Edges**: `--xy-edge-stroke-default`, `--xy-edge-stroke-width-default`, `--xy-edge-stroke-selected-default`
- **Nodes**: `--xy-node-background-color-default`, `--xy-node-border-default`, `--xy-node-boxshadow-selected-default`, `--xy-node-color-default`, `--xy-node-border-radius-default`
- **Handles**: `--xy-handle-background-color-default`, `--xy-handle-border-color-default`
- **Background**: `--xy-background-pattern-dots-color-default`, `--xy-background-pattern-line-color-default`, `--xy-background-pattern-cross-color-default`, `--xy-background-color-default`
- **Controls**: `--xy-controls-button-background-color-default` (+ hover), `--xy-controls-button-color-default` (+ hover), `--xy-controls-button-border-color-default`
- **Selection**: `--xy-selection-background-color-default`, `--xy-selection-border-default`
- **Attribution**: `--xy-attribution-background-color-default`

**Dark mode**: pass `colorMode="dark" | "light" | "system"` on `<ReactFlow>`. xyflow puts `.dark` or `.light` on the `.react-flow` root → CSS overrides per-mode.

**Tailwind v4 interaction**: xyflow's `style.css` is plain CSS (no `@layer`), so v4 cascade ordering is unaffected. **Import xyflow CSS BEFORE your Tailwind entry** so utilities win. For pure-Tailwind theming, import `@xyflow/react/dist/base.css` (structural rules only — no visual defaults) and rebuild the look in your design system.

## Performance

Verbatim guidance from [reactflow.dev/learn/advanced-use/performance](https://reactflow.dev/learn/advanced-use/performance):

> *"Components provided as props to the `<ReactFlow>` component, including custom node and edge components, should either be memoized using `React.memo` or declared outside the parent component."*

Concretely:
- `React.memo` every custom node and edge component.
- Memoize (or hoist to module scope) `nodeTypes`, `edgeTypes`, `defaultEdgeOptions`, `snapGrid`, `connectionLineStyle`, `proOptions` — anything passed as a prop.
- `useCallback` every event handler passed to `<ReactFlow>`.
- Read-only graphs: `nodesDraggable={false}`, `nodesConnectable={false}`, `elementsSelectable={false}`, `panOnDrag={true}`.
- `onlyRenderVisibleElements={true}` — opt-in viewport culling.
- *"Avoid directly accessing the `nodes` array"* — these objects mutate frequently during drag/pan/zoom. Use narrow `useStore(selector)` slices instead of `useNodes()`.
- `hidden: true` on a node hides without unmounting — cheaper than splicing it out of the array.

The docs do **not** quantify a recommended max node count or formal "large graph" definition. Treat interaction lag as the trigger to apply the levers above. **[unverified — the docs don't give a number]**

## Next.js 16 / SSR boundary

`<ReactFlow>` reads `window`, measures DOM, uses zustand context — **it cannot SSR.** Two correct patterns:

### (a) Component-level `'use client'` + import in a server page

```tsx
// app/flow/flow-client.tsx
'use client';
import { ReactFlow } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
export default function FlowClient() { return <ReactFlow ... />; }

// app/flow/page.tsx (server component)
import FlowClient from './flow-client';
export default function Page() { return <FlowClient />; }
```

### (b) `next/dynamic` with `ssr: false`

When you need to keep the client bundle off the initial HTML entirely:

```tsx
// app/flow/page.tsx (server component)
import dynamic from 'next/dynamic';
const FlowClient = dynamic(() => import('./flow-client'), { ssr: false });
export default function Page() { return <FlowClient />; }
```

What breaks if you forget `'use client'`: `window is not defined` at SSR build time, or hydration mismatches at runtime.

**Hydration**: parent must have explicit dimensions inside the client component, NOT relying on a server-rendered parent's measured size. CSS-variable overrides via `globals.css` (server-imported) work fine — variable names are referenced from xyflow's own client styles.

**Next.js 16 specifics**: xyflow has no Next-specific code. Next 16's other breaking changes (App Router internals, route handlers, etc.) don't affect xyflow integration. The only Next touchpoint is the `'use client'` boundary placement.

## React 19 compatibility

Peer dep range `react >=17` covers React 19. Earlier zustand-4-plus-React-19 issue ([xyflow/xyflow#5229](https://github.com/xyflow/xyflow/issues/5229)) is resolved across the 12.6.x → 12.10.x line. Treat `12.10.2` as the safe baseline.

The changelog never explicitly says *"Add React 19 support"* — the "React Flow UI Components updated to React 19 and Tailwind CSS 4" announcement (2025-10-28) confirms current viability for the official UI kit. **[unverified — no single version-pin in the changelog for React 19]** ([reactflow.dev/whats-new/2025-10-28](https://reactflow.dev/whats-new/2025-10-28))

## Pitfalls — official troubleshooting checklist

From [reactflow.dev/learn/troubleshooting](https://reactflow.dev/learn/troubleshooting):

1. **Parent has no dimensions** — see Quick Start.
2. **`nodeTypes` / `edgeTypes` recreated each render** — see Quick Start.
3. **Hooks outside provider** — see Quick Start.
4. **Unknown node type** — *"Node type not found. Using fallback type 'default'."* Type strings are case-sensitive; must match `nodeTypes` keys exactly.
5. **Stale handle positions** — programmatically adding/removing/moving a `<Handle>` requires `useUpdateNodeInternals()(nodeId)` afterwards.
6. **Edges not displaying** — check (a) CSS imported, (b) handles actually present in custom node, (c) Tailwind/utility CSS not setting `overflow: hidden` on the wrapper, (d) `display: none` on a handle (use `opacity: 0` instead — `display: none` removes the handle from the layout system).
7. **Multiple same-type handles without unique `id`** — connections target the wrong handle.
8. **Direct mutation** of nodes/edges arrays — breaks change detection. Always spread.
9. **z-index** — sub-flow children render below their parent unless explicitly raised. `zIndexMode` (added 12.10.0) gives finer control. `<NodeToolbar>` and `<EdgeLabelRenderer>` use a high portal layer by design.

## Recent changelog highlights

- **12.10.0** — `zIndexMode` prop on `<ReactFlow>`, plus `experimental_useOnNodesChangeMiddleware` (intercept node-change events).
- **12.9.0** — `<EdgeToolbar>` component (parallel to `<NodeToolbar>`); child nodes of different parents no longer overlap; selection-on-drag can start over a node; `EdgeProps.type` field added.
- **12.8.0** — `connectionDragThreshold` prop; edges now render above nodes inside subflows.
- **12.7.0** — `ariaRole`, `ariaLabelConfig`, `domAttributes` for nodes and edges; `ease` and `interpolate` viewport options on every `setViewport`/`fitView` call; `autoPanOnNodeFocus`.
- **12.6.0** — `initialMinZoom`, `initialMaxZoom`, `initialFitViewOptions` directly on `<ReactFlowProvider>`; `resizeDirection` on `<NodeResizeControl>`.

When emitting v12 code, prefer the toolbar / aria / domAttributes / zIndexMode props over hand-rolled equivalents.

## Stack-specific notes — `ilinxa-ui-pro`

This repo is Next.js 16.2.x (Turbopack, React Compiler), React 19.2.x, Tailwind v4.2.x with OKLCH tokens, signal-lime accent (`oklch(0.80 0.20 132)` light / `oklch(0.86 0.18 132)` dark). Design mandate: no pure-white backgrounds, near-black `--primary-foreground` paired with lime, graphite-cool dark surfaces.

When integrating xyflow into a registry component (e.g. `flow-canvas-01`):

- **Boundary**: components in `src/registry/` cannot import `next/*`. Put the `'use client'` directive at the top of the registry component itself (xyflow needs window access). The docs site at `src/app/...` consumes the registry component directly — no extra wrapper needed beyond Next's normal client/server split.
- **CSS import location**: ship the `import '@xyflow/react/dist/style.css'` at the consumer side (docs site or downstream app), NOT inside the registry component file. Document this in the procomp's usage notes.
- **Theme tokens**: map `--xy-edge-stroke-default` → `var(--border)` or a contextual chart color; `--xy-handle-background-color-default` → `var(--accent)` or `var(--primary)`; `--xy-background-color-default` → `var(--background)` (cool off-white light / graphite-cool dark). Avoid raw hex/oklch literals in framework-shipped CSS — only consumer code may use literals.
- **Lime accent on handles**: lime is bright; pair handle backgrounds with near-black borders or use lime sparingly (e.g., only on selected/active handles).
- **Tailwind `@source not "../../docs"`**: already in `globals.css` — keeps procomp markdown's literal class snippets out of extraction. Don't remove during refactors.
- **Dark mode**: this repo uses class-based dark mode. `colorMode="system"` works because the `.react-flow` root inherits `.dark` from a parent; alternatively pass `colorMode="dark"` reactively from your theme hook.
- **Performance ceiling**: xyflow's documented sweet spot is ~1–2k nodes; beyond that is custom canvas territory. flow-canvas-01 caps success criteria at 200 nodes for v0.1.

## Quality checklist — run before claiming done

- [ ] Parent of `<ReactFlow>` has explicit width and height (not on `<ReactFlow>` itself).
- [ ] `nodeTypes` and `edgeTypes` are at module scope OR memoized with `useMemo`.
- [ ] Every custom node and edge component is wrapped in `React.memo`.
- [ ] Every event handler passed to `<ReactFlow>` is wrapped in `useCallback` (production code).
- [ ] If using props (`nodes` / `edges`) you also pass `onNodesChange` / `onEdgesChange`.
- [ ] No direct mutation of nodes/edges arrays — always spread.
- [ ] Multiple handles of the same `type` on a node have unique `id`s.
- [ ] If sidebar / sibling components call `useReactFlow`, the page is wrapped in `<ReactFlowProvider>`.
- [ ] `'use client'` is on the file that renders `<ReactFlow>`.
- [ ] `import '@xyflow/react/dist/style.css'` happens once, at the app top-level.
- [ ] No v11 imports (`reactflow`), v11 prop names (`xPos`, `parentNode`, `onEdgeUpdate*`), or v11 helpers (`project`, `getRectOfNodes`).
- [ ] Drag-from-sidebar uses MIME `'application/reactflow'`, both `onDragOver` and `onDrop` call `preventDefault()`, position via `screenToFlowPosition`.
- [ ] Custom edges use `<BaseEdge>` + a path helper, with `<EdgeLabelRenderer>` for HTML labels (not raw SVG `<text>`).
- [ ] Theme overrides target `--xy-*` CSS variables on `.react-flow` (and `.react-flow.dark` for dark mode), not the internal element classes.
- [ ] Read-only flows set `nodesDraggable={false}`, `nodesConnectable={false}`, `elementsSelectable={false}`, `panOnDrag={true}`.

## Sources

All citations resolve to live xyflow docs (reactflow.dev cross-redirects to xyflow.com):

- [@xyflow/react on npm](https://www.npmjs.com/package/@xyflow/react)
- [Installation & requirements](https://reactflow.dev/learn/getting-started/installation-and-requirements)
- [`<ReactFlow>` API](https://reactflow.dev/api-reference/react-flow)
- [Component APIs](https://reactflow.dev/api-reference/components/handle)
- [Hook APIs](https://reactflow.dev/api-reference/hooks/use-react-flow)
- [NodeProps](https://reactflow.dev/api-reference/types/node-props) / [EdgeProps](https://reactflow.dev/api-reference/types/edge-props)
- [Custom nodes](https://reactflow.dev/learn/customization/custom-nodes) / [Custom edges](https://reactflow.dev/learn/customization/custom-edges)
- [TypeScript guide](https://reactflow.dev/learn/advanced-use/typescript)
- [State management](https://reactflow.dev/learn/advanced-use/state-management)
- [Performance](https://reactflow.dev/learn/advanced-use/performance)
- [Theming](https://reactflow.dev/learn/customization/theming)
- [Troubleshooting](https://reactflow.dev/learn/troubleshooting) / [Migrate to v12](https://reactflow.dev/learn/troubleshooting/migrate-to-v12)
- [Drag-and-drop example](https://reactflow.dev/examples/interaction/drag-and-drop)
- [Save and restore example](https://reactflow.dev/examples/interaction/save-and-restore)
- [Validation example](https://reactflow.dev/examples/interaction/validation)
- [React Flow Pro](https://reactflow.dev/pro)
- [What's new — React 19 + Tailwind 4 (2025-10-28)](https://reactflow.dev/whats-new/2025-10-28)
- [Changelog](https://github.com/xyflow/xyflow/blob/main/packages/react/CHANGELOG.md)
