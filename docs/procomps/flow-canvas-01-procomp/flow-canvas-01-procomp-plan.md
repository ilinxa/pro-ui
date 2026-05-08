# `flow-canvas-01` — Pro-component Plan (Stage 2)

> **Stage:** 2 of 3 · **Status:** Draft — awaiting sign-off
> **Slug:** `flow-canvas-01` · **Category:** `data`
> **Inputs:** description signed off ([flow-canvas-01-procomp-description.md](flow-canvas-01-procomp-description.md)). All twenty-four description-stage decisions (Q1–Q24) are inherited as fixed inputs.

This doc locks **how** we build what the description doc said we'd build. After sign-off, no scaffolding-time second-guessing — implementation follows the plan, deviations are loud.

---

## 1. Inherited inputs (from description, in one paragraph)

`flow-canvas-01` is a `data`-category pro-component: an infinite-zoomable node-and-edge canvas built on **`@xyflow/react@12.10.2`** as substrate. The model is **data-first** — every node is a JSON object discriminated by a `__type` field that keys into a **renderer registry**; unknown shapes fall back to a built-in `custom-json` renderer. **Three keystone registries** sit side by side: `renderers` (`__type → React renderer`), `portTypes` (`type id → color/icon/label`), and `edgeTypes` (`type id → React edge renderer`). The canvas ships a built-in renderer for `custom-json`, five built-in port types (`data`, `text`, `image`, `card`, `event`), and a built-in `'smoothstep'` edge type — each consumer-extendable. **Ports live inside the data, recursively** — every level may carry an optional `ports?: Port[]`, and a tree-walker flattens them into a node-wide unique-id lookup so edges can stay flat (`nodeId:portId`). **Source data is kept clean**: ports are inflated from per-renderer `defaultPorts` / `defaultSubPorts` only into a canvas-instance copy on drop; an imperative `exportRef.export({ withPorts })` toggles whether ports + edges round-trip on save. **Two ingestion paths** — DOM drag-and-drop (external file, in-canvas sub-object drag) and clipboard paste (Cmd/Ctrl-V or right-click "Paste JSON…"); both flow through an `onBeforeDrop` hook then schema detection. **Connection rules**: `connectionMode: 'strict'` + same-`type` ports only; `multi: true | false` per port; `onBeforeConnect` for consumer-side semantic validation. **Sub-object drag-extract** copies (Alt-drag moves) sub-JSON onto the canvas as a new node. **Right-click menus** in three contexts (canvas, node, edge) — built-in items are fixed, consumers append. **Per-node lock**, **read-only mode**, **controlled and uncontrolled state**, **single + shift-multi selection**, **versioned save/load**. Deferred: undo/redo, marquee, minimap, auto-layout, palette sidebar, DB-ref nodes, execution-state visualization. Single sealed folder; one install.

---

## 2. Final API (locked)

This is the public surface for v0.1.0. Every type goes in `types.ts` and is re-exported from `index.ts`. The plan stage adds four things to the description's sketch: `findRenderer` / `findPortType` / `findEdgeType` lookup helpers, `findPortInTree` for tree-walking, `defaultPortTypes` as a named export so consumers can splice them, the `<PortsAt position={...} ports={...} />` helper for the easy stacked-handles layout case, and a `useRenderer` / `usePortType` / `useEdgeType` hook trio for renderers that want to introspect the registry.

```ts
import type { ReactNode, Ref } from "react";

// ───── Port — embedded inside data at any tree depth ─────

export type PortDir = "in" | "out";
export type PortSide = "left" | "right" | "top" | "bottom";

export type Port = {
  id: string;          // unique WITHIN the node (across all tree depths)
  side: PortSide;
  dir: PortDir;
  type: string;        // key into PortTypeRegistry
  multi?: boolean;     // false (default) = at most one connection; true = many
  label?: string;
};

// ───── Node data — pure JSON, schema-discriminated, ports recursive ─────

export type NodeData = {
  __type: string;          // 'custom-json' is reserved for the fallback
  ports?: Port[];          // root-level ports (optional)
  [key: string]: unknown;  // renderer-specific payload
};

export type NodeRecord = {
  id: string;
  position: { x: number; y: number };
  data: NodeData;
  width?: number;
  height?: number;
  selected?: boolean;      // transient — stripped on export
  locked?: boolean;        // pins position; other ops still allowed unless readOnly
};

export type EdgeRecord = {
  id: string;
  source: `${string}:${string}`;   // 'nodeId:portId'
  target: `${string}:${string}`;
  type?: string;                    // edgeTypes registry key; default 'smoothstep'
  selected?: boolean;               // transient
};

export type CanvasData = {
  version: 1;
  nodes: NodeRecord[];
  edges: EdgeRecord[];
  viewport?: { x: number; y: number; zoom: number };
};

// ───── Registries ─────

export type RenderContext = {
  nodeId: string;
  isSelected: boolean;
  isDragging: boolean;
  isReadOnly: boolean;
  // Recursive child rendering — dispatch on data.__type via the renderer registry.
  // Falls back to custom-json renderer if no match.
  // `opts.path` is the JSONPath of `data` within the parent node's data tree
  // (e.g. "media[0]"). The child renderer uses this to mark itself as
  // `data-draggable-subobject={path}` so sub-object drag-extract knows which
  // path to remove from the parent on Alt-move. Omit when the child has no
  // standalone identity (pure visual decomposition).
  renderChild: (data: NodeData, opts?: { path?: string }) => ReactNode;
};

export type NodeRenderer<TData extends NodeData = NodeData> = {
  type: string;                                                      // matches data.__type
  label: string;
  defaultPorts?: (data: TData) => Port[];                            // root-port inflation on drop
  defaultSubPorts?: (data: TData) => Record<string, Port[]>;         // path → ports for sub-objects
  render: (data: TData, ctx: RenderContext) => ReactNode;            // emits Handles + content
  extractablePaths?: (data: TData) => string[];                      // sub-paths that may be drag-extracted
};

export type PortType = {
  id: string;
  label?: string;
  color: string;                                                     // CSS color or var() reference
  icon?: ReactNode;
};

export type EdgeRenderContext = {
  edgeId: string;
  source: { node: NodeRecord; port: Port };
  target: { node: NodeRecord; port: Port };
  isSelected: boolean;
};

export type EdgeRenderer = {
  type: string;                                                      // matches EdgeRecord.type
  label?: string;
  render: (edge: EdgeRecord, ctx: EdgeRenderContext) => ReactNode;
};

// ───── Right-click menu ─────

export type MenuItem = {
  id: string;
  label: string;
  icon?: ReactNode;
  onSelect: () => void;
  disabled?: boolean;
  separatorBefore?: boolean;
};

// ───── The canvas component ─────

export type FlowCanvasProps = {
  // Registries — built-ins always registered; consumer additions merge on top
  renderers?: NodeRenderer[];          // built-in: 'custom-json'
  portTypes?: PortType[];              // built-ins: data | text | image | card | event
  edgeTypes?: EdgeRenderer[];          // built-in: 'smoothstep'

  // State
  data?: CanvasData;
  defaultData?: CanvasData;
  onChange?: (next: CanvasData) => void;

  // Drop pipeline
  onBeforeDrop?: (incoming: unknown, point: { x: number; y: number }) => NodeData | null;
  onBeforeConnect?: (
    edge: EdgeRecord,
    ctx: { source: Port; target: Port },
  ) => boolean | EdgeRecord;

  // Mutation callbacks — affordances render only when supplied
  onNodeCreate?: (node: NodeRecord) => void;
  onNodeUpdate?: (node: NodeRecord) => void;
  onNodeDelete?: (nodeId: string) => void;
  onEdgeCreate?: (edge: EdgeRecord) => void;
  onEdgeDelete?: (edgeId: string) => void;
  onSubObjectExtract?: (parentId: string, path: string, gesture: "copy" | "move") => void;

  // Right-click menu extensions
  menuItems?: {
    canvas?: MenuItem[];
    node?: (node: NodeRecord) => MenuItem[];
    edge?: (edge: EdgeRecord) => MenuItem[];
  };

  // Background
  background?: {
    light?: { from: string; to: string; angle?: number };
    dark?:  { from: string; to: string; angle?: number };
    overlay?: "none" | "dots" | "grid" | "cross";
    overlayOpacity?: number;
  };

  // Behavior
  readOnly?: boolean;
  panOnDrag?: boolean;                 // default true
  zoomOnScroll?: boolean;              // default true
  selectionMode?: "single" | "multi";  // default 'multi'

  // Imperative export handle
  exportRef?: Ref<{ export: (opts: { withPorts: boolean }) => CanvasData }>;

  // A11y
  "aria-label"?: string;               // default "Flow canvas"

  className?: string;
};

// ───── Public helpers (exported, no React) ─────

export function findRenderer(renderers: NodeRenderer[], type: string): NodeRenderer | undefined;
export function findPortType(portTypes: PortType[], id: string): PortType | undefined;
export function findEdgeType(edgeTypes: EdgeRenderer[], type: string): EdgeRenderer | undefined;
export function findPortInTree(node: NodeRecord, portId: string): { port: Port; path: string } | undefined;

// ───── Public hooks (exported, React) ─────

export function useRenderer(type: string): NodeRenderer | undefined;
export function usePortType(id: string): PortType | undefined;
export function useEdgeType(type: string): EdgeRenderer | undefined;

// ───── Layout helper for renderers (the easy case) ─────

export function PortsAt(props: {
  ports: Port[] | undefined;
  position: PortSide;          // which edge of the renderer to stack on
  spacing?: number;            // default 24px between handles
}): ReactNode;

// ───── Built-in named exports ─────

export const customJsonRenderer: NodeRenderer<NodeData & { _label?: string }>;
export const defaultPortTypes: PortType[];     // ['data','text','image','card','event']
export const defaultEdgeRenderer: EdgeRenderer; // 'smoothstep'

// ───── Private (not exported) ─────

type Action =
  | { type: "drop";              data: NodeData; position: { x: number; y: number } }
  | { type: "connect";           edge: EdgeRecord }
  | { type: "delete-nodes";      ids: string[] }   // cascades to incident edges
  | { type: "delete-edges";      ids: string[] }
  | { type: "extract-sub-object";parentId: string; path: string; gesture: "copy" | "move" }
  | { type: "set-selection";     nodeIds: string[]; edgeIds: string[] }
  | { type: "replace";           data: CanvasData };
```

**Defaults locked here:**

| Token | Value |
|---|---|
| Built-in port types (`defaultPortTypes`) | `data` → `var(--muted-foreground)`, `text` → `var(--chart-1)`, `image` → `var(--chart-2)`, `card` → `var(--primary)` (signal-lime), `event` → `var(--chart-4)` (rose-leaning) |
| Built-in edge type | `'smoothstep'` (xyflow's `getSmoothStepPath` with `borderRadius: 8`); stroke pulled from source-port's type color |
| Background gradient — light | from `var(--background)` to `var(--muted)`, angle `145deg` |
| Background gradient — dark | from `var(--background)` to `var(--card)`, angle `145deg` |
| Background overlay | `'dots'`, opacity `0.4` |
| `selectionMode` | `'multi'` |
| `panOnDrag` / `zoomOnScroll` | `true` |
| `aria-label` | `"Flow canvas"` |
| Connection rule | `connectionMode: 'strict'` + same-`type` validator (built-in `isValidConnection`) |

**Surface count:** 14 public types + 4 lookup helpers + 3 hooks + 1 layout helper + 3 built-in named exports. Zero strictly-required props (built-ins cover the empty case). 20 optional props.

---

## 3. Architecture

### 3.1 Why xyflow does the heavy lifting (and what we add)

xyflow handles: viewport (pan/zoom/fit/snapshot), node dragging, handle placement at node edges, edge routing, connection drag-and-drop with in-flight preview, selection (single + shift-multi), keyboard a11y for selection/delete, controls + minimap + background components, internal state via Zustand. We do not re-implement any of that.

We add: the renderer / port-type / edge-type registries, the recursive port walker, the source-vs-canvas data boundary + export helper, the drop-pipeline + paste path with schema detection, the sub-object extraction gesture, the typed-connection validator, the right-click menu trio (Radix `<ContextMenu>` from shadcn), the gradient + overlay background layer, the design-token CSS-variable mapping, the `<PortsAt>` layout helper, and the hooks + helpers for consumer renderers.

### 3.2 Adapter layer — one xyflow node type, all our renderers

xyflow's `nodeTypes` is keyed by string. We register **a single xyflow node type** — `"ilinxa-node"` — and route to consumer renderers internally. Same pattern for edges (`"ilinxa-edge"`).

```
xyflow nodeTypes = { "ilinxa-node": NodeAdapter }
xyflow edgeTypes = { "ilinxa-edge": EdgeAdapter }
```

`NodeAdapter` reads `props.data.__type`, looks up the consumer renderer via the renderer registry, wraps the renderer's output in `<NodeShell>` (selection ring + lock chip + focus-visible state), and returns the result. `EdgeAdapter` does the analogous lookup against the edge-type registry. Every `NodeRecord` we hand to xyflow has `type: "ilinxa-node"`; every `EdgeRecord` has `type: "ilinxa-edge"`. The consumer's `__type` lives inside `data` for nodes and on `EdgeRecord.type` for edges.

This keeps xyflow's `nodeTypes` / `edgeTypes` static (one entry each) — no risk of accidental re-creation triggering remounts (the [highest-frequency LLM bug](../../.claude/skills/xyflow-react-pro/SKILL.md) per the xyflow-react-pro skill).

### 3.3 Registry plumbing — Context, not props-drilling

The three registries plus a few cross-cutting flags are exposed via a single React Context:

```tsx
<FlowCanvasContext.Provider
  value={{
    renderers,        // merged: built-ins + consumer
    portTypes,        // merged
    edgeTypes,        // merged
    readOnly,         // forwarded into RenderContext.isReadOnly
    selectionMode,
    onNodeUpdate,     // exposed for renderers that need to write back (e.g. custom-json edits)
  }}
>
  <ReactFlow ... />
</FlowCanvasContext.Provider>
```

Consumer renderers reach the registries via `useRenderer(type)`, `usePortType(id)`, `useEdgeType(type)`, or via `RenderContext.renderChild(data)` (which uses the renderer hook internally). The flags (`readOnly`, etc.) reach the `NodeAdapter` via the same context and flow into the `RenderContext` it constructs for the renderer.

Built-in entries are merged with consumer-supplied entries by id. **Last-wins on collision, with a `console.warn` in dev.** A consumer who overrides `custom-json` deliberately is supported; collisions among consumer entries are logged but not blocked.

### 3.4 Port walker — flat lookup from a recursive tree

`findPortInTree(node, portId)` walks `node.data` depth-first, collecting every `ports?: Port[]` it encounters at every depth, returning the first match by id. The walker is memoized per node by a `WeakMap<NodeData, Map<portId, { port, path }>>`. Edges resolve to their actual handle positions via this lookup.

Renderer authors must keep port ids unique within a node (locked decision Q9). The walker does not validate uniqueness at runtime; instead, dev-mode `console.warn` fires on the first duplicate seen during walking.

### 3.5 Default port inflation — at the drop boundary, never on re-render

The inflation pipeline (locked via Q23):

1. JSON arrives via drop or paste (via `onBeforeDrop` if supplied).
2. Look up `data.__type` in renderer registry → `renderer`.
3. If `data.ports` is **absent** (not `[]`), call `renderer.defaultPorts(data)` and merge into canvas-instance data.
4. For every sub-path produced by `renderer.defaultSubPorts(data)` whose corresponding sub-object lacks a `ports` field, merge defaults at that path.
5. Sub-object extraction: when extracted as a standalone root, its own renderer's `defaultPorts` runs (parent no longer applies).
6. **`ports: []` (deliberately empty)** is respected — never re-inflated. The marker is "presence of the array, regardless of length."

Inflation never mutates source JSON — it builds a new `data` tree before pushing into the canvas state.

### 3.6 Source vs canvas data export

`exportRef.export({ withPorts: true })` returns the full `CanvasData` snapshot — nodes (with embedded ports), edges, viewport. **`selected` is stripped from both `NodeRecord` and `EdgeRecord` (transient UI state per Q22).** Round-trips through `JSON.stringify`.

`exportRef.export({ withPorts: false })` walks every node's `data` tree and **strips every `ports` field at every depth**, drops every edge (edges reference port ids that won't exist in source), strips `selected` from nodes, keeps node positions + viewport. Result is a clean source-shape tree per `__type` schema.

### 3.7 Drop pipeline + paste

Two ingestion paths share the same dispatch tail:

```
Path A (DOM drop):     onDrop on <ReactFlow> wrapper
                            ↓
                       dataTransfer.getData('application/json')
                            ↓
Path B (clipboard paste): React onPaste handler on canvas root
                            ↓                (captures Cmd/Ctrl-V naturally
                            ↓                 when canvas is focused)
                       e.clipboardData.getData('text') → JSON.parse
                            ↓
              ┌─────────────────────────────┐
              │  parse + validate JSON      │
              │  fail → toast + abort       │
              └─────────────────────────────┘
                            ↓
              onBeforeDrop?(incoming, point)
                            ↓
              data.__type missing?
                  yes → coerce to { __type: 'custom-json', ...incoming }
                  no  → keep
                            ↓
              renderer = findRenderer(__type)
              renderer missing? → fallback to customJsonRenderer
                            ↓
              inflate default ports (§3.5)
                            ↓
              dispatch { type: 'drop', data, position }
```

MIME convention: **`'application/json'`** (NOT `'application/reactflow'` — that's xyflow's internal sidebar pattern; we use a broader convention so external sources like file-drops also work). Sub-object drag uses the same MIME plus an extra dataTransfer entry `application/x-ilinxa-subobject` carrying `parentId|path` so the canvas can identify same-canvas sub-object drops and trigger the extraction code path.

Right-click "Paste JSON…" opens a small dialog with a textarea (in case the user wants to paste programmatically); same dispatch tail.

### 3.8 Sub-object extraction gesture

Renderers mark draggable sub-paths in their rendered DOM:

```tsx
<div
  data-draggable-subobject={`media[${i}]`}
  draggable
  onDragStart={(e) => emitSubObjectDrag(e, data.media[i], `media[${i}]`)}
>
  <MediaItem ... />
</div>
```

`emitSubObjectDrag(e, subData, path)` is a helper we export. It writes:
- `dataTransfer.setData('application/json', JSON.stringify(subData))`
- `dataTransfer.setData('application/x-ilinxa-subobject', JSON.stringify({ parentId, path }))`
- `dataTransfer.effectAllowed = 'copyMove'`

Drop handler reads both. If `application/x-ilinxa-subobject` is present and the drop point is inside the canvas (not on the source node), dispatch `extract-sub-object` with `gesture: e.altKey ? 'move' : 'copy'`. Move removes the sub-object from the parent (via `onNodeUpdate`); copy leaves the parent intact.

If the drop lands on empty canvas in a different app (not our canvas), the `application/json` data still works as a normal external drop.

**Keyboard-accessible fallback (per Q10).** The node right-click menu dynamically appends one "Extract `<path>`" entry per item returned by `renderer.extractablePaths(data)`. Selecting an entry dispatches the same `extract-sub-object` action as the drag gesture (default copy; `Alt+Enter` on the menu item triggers move). This is the keyboard / screen-reader equivalent of the drag-out gesture.

### 3.9 Right-click menus

Three menus, each rendered via shadcn's `<ContextMenu>` (Radix-backed). Built-in items per the description:

- Canvas: "Paste JSON…", "Add custom node", "Fit view", "Reset zoom"
- Node: "Duplicate", "Copy as JSON", "Convert to custom-JSON", "Delete", plus dynamic "Extract `<path>`" entries from `renderer.extractablePaths` (Q10 keyboard fallback)
- Edge: "Delete" (typed ports are directional — out → in — so reversing an edge has no valid interpretation; flipped, the now-source would be an `in` port and the now-target an `out` port, both of which the connection validator would reject anyway)

Consumer items appended via `menuItems.{canvas, node, edge}`. Mutation built-ins are hidden when `readOnly` is true (only "Fit view" / "Reset zoom" / "Copy as JSON" remain).

### 3.10 Background — separate layer behind xyflow's `<Background>`

The gradient is a CSS-only element (no JS). xyflow's `<Background>` sits on top, rendering the dot/grid/cross overlay only. Two stacked layers:

```tsx
<div className="absolute inset-0 bg-[linear-gradient(...)]" aria-hidden />
<Background variant={overlay} ... />
```

Light/dark gradient stops are CSS variables; `colorMode="system"` toggles xyflow's `.dark`/`.light` class which our gradient layer reads via `globals.css`.

### 3.11 State model — xyflow internal store + a thin wrapper

We do NOT add a Zustand store of our own. xyflow's internal store handles nodes / edges / selection / viewport. Our wrapper:

- Holds `data` (controlled mode) or `defaultData` (uncontrolled) internally.
- Wires `onNodesChange` / `onEdgesChange` to `applyNodeChanges` / `applyEdgeChanges` from `@xyflow/react`, then calls our `onChange` with the next `CanvasData`.
- Holds the merged registries (built-ins + consumer additions) in Context — effectively static after mount.
- Holds the `exportRef` imperative handle.

**Inflation runs once, at drop time** (§3.5) — never on render. The "deliberate empty `ports: []` vs absent `ports`" rule (§3.5 step 6) is sufficient to prevent re-inflation of saved-and-reloaded nodes, so no separate tracker is needed. Controlled-mode prop changes that replace `data` wholesale do NOT re-inflate; if a consumer wants fresh inflation, they must drop the JSON in via the drop pipeline rather than push it through `data`.

No external state library required. Production consumers who want to own state lift up via the controlled mode (`data` + `onChange`).

---

## 4. File-by-file plan

Sealed-folder structure per [docs/component-guide.md §5](../component-guide.md#5-anatomy-of-a-component-folder), under `src/registry/components/data/flow-canvas-01/`:

```
flow-canvas-01/
├── flow-canvas-01.tsx        # Root export — <FlowCanvas {...props} />
├── parts/
│   ├── canvas.tsx            # Inner ReactFlow wrapper (assumes Provider above)
│   ├── node-adapter.tsx      # The single xyflow node type — looks up renderer + wraps in shell
│   ├── node-shell.tsx        # Selection ring, lock chip, focus-visible wrapper around renderer output
│   ├── edge-adapter.tsx      # Single xyflow edge type — looks up edgeTypes
│   ├── default-edge.tsx      # The built-in 'smoothstep' renderer
│   ├── custom-json-node.tsx  # The built-in custom-json renderer (collapsed + expanded view)
│   ├── ports-at.tsx          # Layout helper for stacked handles on a single edge
│   ├── port-handle.tsx       # Wrapper around xyflow's <Handle> with type → color from registry
│   ├── menu-canvas.tsx       # Right-click menu — empty canvas
│   ├── menu-node.tsx         # Right-click menu — node
│   ├── menu-edge.tsx         # Right-click menu — edge
│   ├── background.tsx        # Gradient layer + xyflow <Background> overlay
│   ├── controls.tsx          # Wrapper around xyflow <Controls> with our styling
│   ├── paste-dialog.tsx      # Modal for "Paste JSON…" menu action
│   └── built-in-renderers.tsx # Re-exports for tree-shaking
├── hooks/
│   ├── use-canvas-data.ts    # Controlled / uncontrolled state machine + onChange plumbing
│   ├── use-port-walker.ts    # findPortInTree + memo cache
│   ├── use-default-port-inflation.ts  # Inflation pipeline
│   ├── use-drop-pipeline.ts  # onDragOver / onDrop / paste keyboard binding
│   ├── use-export.ts         # exportRef imperative handle
│   ├── use-render-child.ts   # The renderChild factory used by RenderContext
│   └── use-context-menu.ts   # Co-ordinates menu show/hide on right-click
├── registries/
│   ├── renderer-registry.tsx # Context + useRenderer hook + findRenderer helper
│   ├── port-type-registry.ts # Context + usePortType hook + findPortType + defaultPortTypes
│   ├── edge-type-registry.tsx # Context + useEdgeType hook + findEdgeType + defaultEdgeRenderer
│   └── canvas-context.tsx    # The merged provider
├── lib/
│   ├── port-walker.ts        # Pure tree-walker (used by use-port-walker hook)
│   ├── export-strip.ts       # Strip ports + edges for source export
│   ├── coerce-to-node-data.ts # Adds __type: 'custom-json' if missing
│   ├── parse-clipboard.ts    # JSON.parse with toast-friendly error
│   └── emit-sub-object-drag.ts # The exported helper renderers use
├── types.ts                  # Every public type
├── dummy-data.ts             # Sample CanvasData for demos
├── demo.tsx                  # Five demos mirroring §5 of description
├── usage.tsx                 # Usage guide (consumer-facing)
├── meta.ts                   # ComponentMeta — populated by scaffolder + edited
└── index.ts                  # Public re-exports
```

**File responsibilities (one-liner each, where not obvious):**

- **`flow-canvas-01.tsx`** — composes Context provider + `<Canvas>`. The only file consumers reach directly. `'use client'`.
- **`parts/canvas.tsx`** — owns `<ReactFlow>` invocation, wires our `nodeTypes` / `edgeTypes` (static one-entry maps), passes `defaultEdgeOptions`, attaches drop / paste handlers. Reads from `useCanvasData()`.
- **`parts/node-adapter.tsx`** — wrapped in `React.memo`. Receives xyflow `NodeProps`. Reads `data.__type` → looks up renderer → calls `renderer.render(data, ctx)`. The `ctx.renderChild` is curried with the registry from context.
- **`parts/node-shell.tsx`** — selection ring (CSS via `data-selected`), lock chip (small icon top-right when `node.locked`), `tabIndex` for keyboard focus. Renders children passed through.
- **`parts/edge-adapter.tsx`** — wrapped in `React.memo`. Receives xyflow `EdgeProps`. Reads `edge.type` → looks up edge renderer → falls back to `defaultEdgeRenderer`.
- **`parts/default-edge.tsx`** — `defaultEdgeRenderer`. Uses `getSmoothStepPath({ borderRadius: 8 })`, stroke from source port's type color via `usePortType`.
- **`parts/custom-json-node.tsx`** — collapsed: label header + `{ ... }` summary. Expanded: `<ScrollArea>` + monospace JSON dump. Editable when `onNodeUpdate` is supplied (textarea + parse-on-blur + toast on parse error). Promotes to typed node when `__type` field is edited and matches a registered renderer.
- **`parts/ports-at.tsx`** — `<PortsAt>` layout helper. Maps `ports[]` filtered by `side` to vertically-stacked `<PortHandle>` elements, equal spacing, centered on the renderer's edge.
- **`parts/port-handle.tsx`** — wraps xyflow's `<Handle>`. Reads `usePortType(port.type)` for color. Sets `id={port.id}`, `type={port.dir === 'in' ? 'target' : 'source'}`, `position={Position[port.side]}`. Includes `isValidConnection` (per-handle override) that delegates to the global validator + checks `multi`.
- **`parts/menu-{canvas,node,edge}.tsx`** — three `<ContextMenu>` components. Each takes consumer `MenuItem[]` extension and renders built-ins + extensions.
- **`parts/background.tsx`** — gradient div (CSS variables) + xyflow `<Background>` for the overlay variant.
- **`parts/controls.tsx`** — xyflow `<Controls>` with shadcn-styled buttons override.
- **`parts/paste-dialog.tsx`** — shadcn `<Dialog>` with `<Textarea>` and a "Paste" button. On submit, runs through `parseClipboard` + dispatch.
- **`parts/built-in-renderers.tsx`** — barrel for `customJsonRenderer`, `defaultEdgeRenderer`, `defaultPortTypes`. Lets bundlers tree-shake unused defaults.
- **`hooks/use-canvas-data.ts`** — returns `{ nodes, edges, viewport, dispatch, onChange }`. Controlled-vs-uncontrolled bifurcation lives here.
- **`hooks/use-port-walker.ts`** — wraps `findPortInTree` with `WeakMap` cache.
- **`hooks/use-default-port-inflation.ts`** — exports `inflate(data, renderer): NodeData`. Pure; used inside drop pipeline.
- **`hooks/use-drop-pipeline.ts`** — returns `{ onDragOver, onDrop, onPaste }` callbacks bound via `useCallback`. Owns the paste keyboard listener (registered on canvas root).
- **`hooks/use-export.ts`** — exposes the `useImperativeHandle` for `exportRef`.
- **`hooks/use-render-child.ts`** — closure factory that returns `renderChild(data, opts)` for the `RenderContext`. Consults the renderer registry from context.
- **`hooks/use-context-menu.ts`** — manages right-click event → menu position; small wrapper to keep the three menus in sync with selection state.
- **`registries/canvas-context.tsx`** — single provider that bundles the three sub-contexts. The `<FlowCanvas>` root sets it up.
- **`registries/renderer-registry.tsx`** — Context, `useRenderer`, `findRenderer`. Merges built-ins (just `customJsonRenderer` for v0.1) with consumer entries; warns on duplicates.
- **`registries/port-type-registry.ts`** — Context, `usePortType`, `findPortType`, `defaultPortTypes` array.
- **`registries/edge-type-registry.tsx`** — Context, `useEdgeType`, `findEdgeType`, `defaultEdgeRenderer`.
- **`lib/*`** — pure functions, no React imports. Easy to unit-test if Vitest lands.
- **`types.ts`** — all public types from §2. No values.
- **`dummy-data.ts`** — three sample `CanvasData` objects covering the three primary archetypes.
- **`demo.tsx`** — `<DemoFlowCanvas archetype="agent" />` etc., switchable via tabs at the docs page.
- **`usage.tsx`** — narrative usage notes (renderer registration, typed-port pattern, theming, perf).
- **`meta.ts`** — `ComponentMeta` with full population.
- **`index.ts`** — re-exports everything in §2's public surface.

**Total file count:** 4 root + 14 parts + 7 hooks + 4 registries + 5 lib + 7 fixed (`types`, `dummy-data`, `demo`, `usage`, `meta`, `index`, plus `flow-canvas-01.tsx`) ≈ **35 files**. Comparable to `kanban-board-01` (~25 files) and `data-table` (~30 files); justified by the three-registry plus drop-pipeline plus sub-object-extract surface area.

---

## 5. Dependencies

| Package | Version | Role | Source |
|---|---|---|---|
| `@xyflow/react` | `^12.10.2` | substrate (canvas, viewport, handles, edges, controls, background overlay) | new peer dep |
| `@radix-ui/react-context-menu` (via shadcn) | already present | right-click menus | shadcn primitive |
| `@radix-ui/react-dialog` (via shadcn) | already present | "Paste JSON…" modal | shadcn primitive |
| `@radix-ui/react-scroll-area` (via shadcn) | already present | custom-JSON expanded view | shadcn primitive |
| `sonner` (via shadcn) | already present | parse errors, sub-object move confirmation. Kanban precedent. | shadcn primitive |
| `lucide-react` | already present | icons in menus, lock chip, controls | icon library |
| `react`, `react-dom` | `^19.2.x` | host | already present |
| `clsx` / `tailwind-merge` (`@/lib/utils#cn`) | already present | classname composition | internal |

**Net new deps:** one — `@xyflow/react`. Declared as a peer in the registry component metadata so consumer apps install it themselves (locked decision Q20). Plan: add to `package.json` under `peerDependencies` for the registry build, and to `devDependencies` for the docs site so demos work locally.

**No `@dnd-kit/*`** — sub-object drag uses native HTML5 DnD. Kanban already pulls dnd-kit, but flow-canvas's drag model is different (drop-to-canvas, not within-list reorder), and HTML5 DnD is sufficient + already integrates with xyflow's drop surface.

**No `framer-motion`** — per memory's "motion substrate — CSS first, FM deferred" note. Edge animation (when used) leverages SVG `stroke-dasharray` + CSS animation, not FM.

---

## 6. Composition pattern

- **Renderer registry** (renderer-registry pattern from `kanban-board-01` and `workspace`) — proven; default for v0.1.
- **Single xyflow node/edge type** routes to consumer renderers via Context — keeps xyflow's `nodeTypes` static (avoids the [memoization footgun](../../.claude/skills/xyflow-react-pro/SKILL.md)).
- **Headless + presentation** — hooks own state (`use-canvas-data`, `use-drop-pipeline`, `use-export`); presentation components are thin and `React.memo`'d.
- **Slot-friendly `<NodeShell>`** — shell wraps consumer renderer's output rather than the renderer wrapping shell. Consumer never thinks about selection ring, focus indicator, or lock chip.
- **Polymorphic via three registries** — every "what does this look like" decision goes through one of the three registries. No per-instance prop overrides for visuals (consumers register variants instead).
- **Imperative ref for export** — `exportRef` is imperative because export is an action, not a reactive value. Same pattern xyflow uses for its own viewport methods.
- **Controlled and uncontrolled both supported** — same shape (`data` / `defaultData` / `onChange`) as workspace and kanban-board. Internal `useCanvasData` hook bifurcates.

---

## 7. Client vs server

**Every file in this folder begins with `'use client'`.** Reasons:
- xyflow reads `window`, measures DOM, uses Context with `useState` internally → cannot SSR.
- Our hooks all use `useState` / `useReducer` / `useCallback` / `useEffect`.
- Drop pipeline binds `dragover` / `drop` / `paste` events.

Per repo convention (registry components cannot import `next/*`), this remains pure React. The docs site at `src/app/components/flow-canvas-01/page.tsx` is also a client page (or wraps `<FlowCanvasDemo />` in a client boundary). The xyflow-react-pro skill's `'use client'` boundary guidance applies; downstream consumers may also use `next/dynamic` with `ssr: false` if they want to keep flow-canvas off the SSR HTML entirely.

---

## 8. Edge cases (must work, must be tested in demo)

| # | Case | Expected behavior |
|---|---|---|
| 1 | Empty canvas (`{ version: 1, nodes: [], edges: [] }`) | Renders gradient background + `<Controls>` + `<Background>` overlay; right-click menu still works for "Paste JSON…" |
| 2 | Single node, no edges | Renders centered (or at given position); fit-view zooms to it |
| 3 | Disconnected sub-graphs | Renders fine; selection is per-node, not per-component |
| 4 | Drop of invalid JSON (parse fails) | Toast: "Could not parse pasted JSON"; no canvas change |
| 5 | Drop of multiple files | Take first; toast warning "Only first file loaded" |
| 6 | Paste of plain text (not JSON) | Toast: "Clipboard does not contain valid JSON" |
| 7 | Sub-object extracted from object lacking `__type` | Auto-assign `__type: 'custom-json'` on extraction; toast info "Extracted as custom JSON node" |
| 8 | Connection drag never released (drop on non-handle) | xyflow handles — connection rejected silently |
| 9 | Node deleted while sub-object extraction is mid-drag | Cancel extraction (DnD aborts naturally because source DOM is gone) |
| 10 | Edges still pointing at a port whose `__type` schema removed it | At render time, `findPortInTree` returns undefined → edge is filtered out before being passed to xyflow (drop silently); dev-mode `console.warn` lists the dropped edge ids. Re-adding the port restores the edge from `data` on next render. |
| 11 | Mobile / touch viewport (Q19 — basic) | xyflow's pointer support: pinch-to-zoom, drag-to-pan, tap-to-select, long-press to open right-click menu, long-press-then-drag from a handle to create a connection. Sub-object drag-extract via long-press-then-drag is functional but not pixel-perfect; Alt-modifier is mouse-only — touch users get the menu fallback (Q10) |
| 12 | RTL languages (`dir="rtl"` on parent) | Right-click menus mirror naturally (Radix handles); gradient/overlay unchanged |
| 13 | Very long node body (overflow) | Renderer's responsibility; we provide `<NodeShell>` with `overflow: hidden` and document `max-width` recipe in usage |
| 14 | Re-load with persisted ports in JSON | Respect ports as-is, do NOT re-inflate (presence of `ports` field — even `[]` — is the deliberate-state signal) |
| 15 | Network-loaded `data` arriving after first render | Controlled mode: change of `data` prop replaces canvas state via internal effect |
| 16 | `connectionMode: 'loose'` not exposed | Locked to `'strict'` in v0.1; consumers wanting loose can fork via `onBeforeConnect` returning `true` for any pair |
| 17 | `multi: false` port already has one edge, user drags a second | Connection rejected at drop, in-flight line shows the rejection indicator |
| 18 | Two consumer renderers register the same `__type` | Last-wins; `console.warn` once in dev with both labels |
| 19 | `defaultPorts` returns ports with duplicate ids within the same node | `console.warn` once per node id; first wins for tree-walker |
| 20 | `readOnly` toggled at runtime | Drag, connect, menu mutations all disable; existing edges stay; `Delete` key no-ops |

---

## 9. Accessibility

Built into the substrate:

- **Pan / zoom** — xyflow ships keyboard pan (arrow keys with canvas focused) and zoom (`+` / `-` / `0` for fit). We forward focus to the canvas root on mount.
- **Selection** — Tab through nodes; `Shift+Click` adds; `Esc` clears. xyflow's defaults.
- **Delete** — `Delete` / `Backspace` removes selected nodes/edges (cascades, per Q15).
- **Focus rings** — `<NodeShell>` adds `focus-visible:ring-2 ring-ring` (via design tokens).
- **`<Controls>` ARIA** — xyflow's controls have built-in `aria-label`; we override to localized strings if needed via `aria-label` props.

We add:

- **Live region** at canvas root: `aria-live="polite"` div that announces:
  - "Connection created from {sourceNodeLabel} to {targetNodeLabel}"
  - "Connection rejected: type mismatch ({sourceType} → {targetType})"
  - "{n} nodes deleted"
  - "Custom JSON node added"
- **Right-click menus** — Radix's `<ContextMenu>` is fully keyboard-accessible (Shift+F10 opens, arrow keys navigate, Enter activates).
- **`<PortsAt>` handles** — each `<Handle>` carries `aria-label="${port.label ?? port.id} (${port.dir} ${port.type})"`.
- **Custom-JSON node** — collapse/expand toggle is a `<button>`; expanded view focuses the textarea; `Esc` collapses without saving.

**Reduced motion**: respect `prefers-reduced-motion` on edge animations (none in v0.1, but the gradient transition uses `media (prefers-reduced-motion)` to disable).

---

## 10. Risks & alternatives

### 10.1 Risks (carried from description, plan-stage refinements in italics)

- **Scope is enormous.** Three registries + recursion + source-vs-canvas split + drop pipeline + sub-object extract + right-click menus. *Plan-stage mitigation: implement in milestones (§11), ship M1–M4 to demo, gate M5–M8 on first feedback.*
- **xyflow API churn.** Pinning `^12.10.2` minor-version range. *Plan-stage: lock peer-dep to `^12.10.2` (caret = same major), test `pnpm dev` on every patch bump before committing.*
- **Recursive port placement is on the renderer author.** *Plan-stage: ship `<PortsAt position={...} ports={...} />` as the easy default; document approach A (stack at node edge) in usage; flag approach B (positioned per sub-object) as a custom path.*
- **Schema-discriminator collisions.** *Plan-stage: last-wins + `console.warn` in dev. Consumers can detect via `findRenderer` return value mismatching expected.*
- **Source-vs-canvas data semantics for non-port edits.** Custom-JSON edits to `body` text (or any other field) survive export-with-ports; export-without-ports strips ports but keeps user's content edits. *Plan-stage: document this in usage.tsx as the "canvas owns content edits" contract.*
- **Sub-object extraction for sub-objects without `__type`.** *Plan-stage: locked — auto-assign `__type: 'custom-json'` on extraction with a confirmation toast.*
- **Performance ceiling.** xyflow sweet spot ~1–2k nodes. *Plan-stage: cap demos and success criteria at 200 nodes; document the ceiling in usage; M8 implements `onlyRenderVisibleElements` toggle.*
- **Test coverage.** No Vitest in repo. *Plan-stage: ship pure functions in `lib/` so they're testable when test runner lands; for now, demo + manual cheat-sheet checklist (§9 of description).*
- **Tailwind v4 + xyflow CSS.** *Plan-stage validation: import xyflow CSS in `globals.css` BEFORE Tailwind directives; verify `@source not "../../docs"` doesn't conflict; OKLCH variables map cleanly to xyflow's `--xy-*` properties.*
- **Right-click menu portability.** *Plan-stage: locked — Radix `<ContextMenu>` (shadcn). Already a project pattern.*
- **State-sync with xyflow's internal store.** xyflow holds its own copy of nodes/edges; our `data` prop is a separate source of truth in controlled mode. *Plan-stage: `useCanvasData` subscribes to `useStore` slice for `nodes` / `edges` and reflects back to consumer via `onChange`. Single direction. No two-way sync.*

### 10.2 Alternatives considered (and rejected)

| Alternative | Why rejected |
|---|---|
| **Custom-built canvas (no xyflow)** | 4–8 weeks of work to match xyflow's pan/zoom/edge-routing/handle-snap/keyboard a11y. Zero strategic benefit. |
| **`reaflow`** | Smaller community, less active maintenance, no React 19 story. xyflow is the de-facto standard. |
| **`vis-network` / `cytoscape`** | Canvas-rendered, not React-component-based. Custom node renderers would be painful or impossible. |
| **Force-graph** (already in this repo as `force-graph-01`, frozen at v0.2) | Different paradigm — physics-driven layout, no typed ports. Complementary, not alternative. |
| **Two-way sync between consumer state and xyflow internal store** | Race conditions, double-renders, hard to debug. Single-direction (consumer → xyflow → callback → consumer) is the well-trodden path. |
| **Per-instance edge style override (no edgeTypes registry)** | Leaks visual concerns into data. Registry pattern is consistent with the other two registries and matches xyflow's own mental model. |
| **Bake ports into the card schemas (ilinxa rich cards modified to add `ports?`)** | Decided against in description discussion — pollutes pure-content schemas, requires every card to learn graph concerns, harder to ship a card without ports. |

---

## 11. Implementation milestones

Build in this order. Each milestone is independently demoable; each gates the next.

| M | Deliverable | Verifies | Files added/modified |
|---|---|---|---|
| **M1** | Skeleton — `<FlowCanvas>` renders, custom-json fallback, save via `exportRef`, dark-aware gradient background. Empty-canvas demo. | xyflow boots in our shell; CSS imports right; gradient theme works light + dark; export round-trips. | `flow-canvas-01.tsx`, `parts/canvas.tsx`, `parts/background.tsx`, `parts/controls.tsx`, `parts/custom-json-node.tsx`, `parts/node-adapter.tsx` (minimal), `hooks/use-canvas-data.ts`, `hooks/use-export.ts`, `registries/*` (skeleton), `types.ts`, `dummy-data.ts`, `demo.tsx` (1 demo), `meta.ts`, `index.ts`. |
| **M2** | Custom renderer registration via `renderers` prop + recursive `renderChild` + `<PortsAt>` helper + port-handle rendering. Demo: register a `prompt-node` renderer, see ports. | Registry merge works; recursion produces correct subtree; handles appear at right positions with right colors. | `parts/ports-at.tsx`, `parts/port-handle.tsx`, `hooks/use-render-child.ts`, `hooks/use-port-walker.ts`, `lib/port-walker.ts`, `registries/renderer-registry.tsx`, `registries/port-type-registry.ts`. |
| **M3** | Connection validation (typed) + `onBeforeConnect` hook + `multi: true/false` enforcement + edge-type registry + default smoothstep with port-color stroke. Demo: typed agent graph (text → text connects, embedding → text rejects). | `isValidConnection` global + per-handle composes correctly; rejection indicator shows; `multi: false` blocks 2nd edge. | `parts/edge-adapter.tsx`, `parts/default-edge.tsx`, `registries/edge-type-registry.tsx`, validator wired into `parts/canvas.tsx`. |
| **M4** | Drop pipeline (drag + paste) + `onBeforeDrop` + default port inflation + paste dialog + parse-error toast. Demo: drag a JSON file onto canvas, see it appear. | DOM drop works; clipboard paste works; invalid JSON toasts; inflation runs once per drop. | `hooks/use-drop-pipeline.ts`, `hooks/use-default-port-inflation.ts`, `parts/paste-dialog.tsx`, `lib/parse-clipboard.ts`, `lib/coerce-to-node-data.ts`. |
| **M5** | Sub-object extraction — `data-draggable-subobject` convention, `emitSubObjectDrag` helper, extraction dispatch (copy / Alt-move). Demo: drag a media item out of a post-card. | Sub-JSON copies on drag; canvas recognizes own-canvas sub-object drop; Alt-drag removes from parent via `onNodeUpdate`. | `lib/emit-sub-object-drag.ts`, extraction branch in `use-drop-pipeline`. |
| **M6** | Right-click menus — canvas, node, edge — built-in items + consumer extension. Read-only mode hides mutation items. | All three menus open; built-ins fire; `menuItems.{canvas,node,edge}` extends; readOnly hides mutation entries. | `parts/menu-canvas.tsx`, `parts/menu-node.tsx`, `parts/menu-edge.tsx`, `hooks/use-context-menu.ts`. |
| **M7** | Theming pass — `--xy-*` overrides in `globals.css`, dark mode via `colorMode="system"`, gradient + overlay token mapping, signal-lime accent on active handles. Demo: dark/light toggle. | All visuals pull from design tokens; no raw hex/oklch in framework files; light + dark both pass design QA. | `parts/background.tsx` final styling; `globals.css` `--xy-*` block. |
| **M8** | Performance pass — `React.memo` audit on every component, `useCallback` audit on every handler, `onlyRenderVisibleElements` toggle exposed (default false), 200-node demo with measured frame rate. | 200-node demo at 60fps on a mid-tier laptop; drag stays smooth; no console warnings. | Audit-only edits across `parts/`. |
| **M9** | Demos + usage docs — five demos mirroring §5 of description; full `usage.tsx` + procomp-guide.md. | Docs site shows all five demos; `usage.tsx` covers register-renderer / typed-port / theme / perf recipes. | `demo.tsx`, `usage.tsx`, `flow-canvas-01-procomp-guide.md`. |

**Estimated effort:** M1–M3 are the foundation (~50% of total). M4–M5 are the dynamic surface (~25%). M6–M9 are polish + docs (~25%). Sequential — no parallelization opportunities given the dependency chain.

---

## 12. Definition of "done" for THIS document (stage gate)

Before scaffolding (`pnpm new:component data/flow-canvas-01`):

- [ ] §2 Final API reviewed; no surface additions promised that aren't typed in the locked block.
- [ ] §3 Architecture reviewed; the **single-xyflow-node-type adapter** decision (§3.2) and **Context-based registry plumbing** decision (§3.3) confirmed.
- [ ] §4 File-by-file plan reviewed; ~35 files acceptable.
- [ ] §5 Dependencies confirmed: only one new peer dep (`@xyflow/react`).
- [ ] §6 Composition pattern (renderer registry × 3 + headless/presentation + single-direction state) confirmed.
- [ ] §7 `'use client'` everywhere confirmed.
- [ ] §8 Edge cases reviewed; nothing missing.
- [ ] §9 Accessibility plan confirmed.
- [ ] §10 Risks acknowledged; alternatives noted.
- [ ] §11 Milestones confirmed; M1 is the right foundation.
- [ ] **User explicitly says "plan approved" (or equivalent)** — this unlocks scaffolding (`pnpm new:component data/flow-canvas-01`) and code.

After sign-off, deviations during implementation should surface as STATUS.md notes, not silent rewrites.

---

## Appendix — Plan-stage decisions added beyond the description

These are choices the description didn't explicitly lock; the plan stage commits to them so the implementation has no ambiguity:

1. **Single xyflow node type (`"ilinxa-node"`)** registered with xyflow; consumer renderers dispatched internally via `data.__type`. Avoids the `nodeTypes` re-creation footgun.
2. **MIME convention `'application/json'`** (not `'application/reactflow'`) for drop pipeline + a custom `'application/x-ilinxa-subobject'` MIME for in-canvas sub-object drags.
3. **Schema collision policy: last-wins + dev-only `console.warn`.**
4. **Default port inflation runs once at the drop boundary, never on render.** No tracker needed — the "presence of `ports` array (even empty) means deliberate" rule from §3.5 step 6 covers reload-and-replay. Controlled-mode `data` replacement does not re-inflate.
5. **No internal Zustand store** — use xyflow's internal store for nodes/edges/selection/viewport; React Context for the three registries; `useReducer` for everything else.
6. **`<PortsAt>` ships as the easy-case helper** for stacked-handle layout on a node edge. Custom positioning is the renderer's responsibility.
7. **Right-click menu = shadcn `<ContextMenu>`** (Radix). Built-in items fixed; consumers append, never replace, in v0.1.
8. **Edge stroke color = source port's type color** by default (set by `defaultEdgeRenderer`). Custom edge renderers may override.
9. **`'application/x-ilinxa-subobject'` carries `parentId|path`** so the drop handler can distinguish own-canvas extractions from external drops.
10. **Built-in port-type → CSS variable mapping locked** in §2 (`data` → `--muted-foreground`, `text` → `--chart-1`, etc.).
11. **`exportRef` over `onExport` callback** — export is an action, not a reactive value.
12. **Live region for connection / selection events** — added to satisfy the description's a11y success criterion explicitly.
13. **`aria-label` prop with default `"Flow canvas"`** — added to FlowCanvasProps for landmark naming.
14. **Toast library locked to `sonner`** — kanban precedent; already in repo.
15. **`onPaste` synthetic React handler** (not a `keydown` listener) for clipboard ingestion — captures Cmd/Ctrl-V naturally when canvas is focused.
16. **Stale-edge handling: silent drop + dev-warn** when `findPortInTree` cannot resolve a port that an edge references.

These decisions can be revisited in a v0.2 plan but are frozen for v0.1.

---

## Implementation deviations (post-v0.1 review F-05)

The implementation that shipped at v0.1.0 differs from the file-by-file plan in §4 in a few places. Plan was 35 files; as-built is 30. The deltas are deliberate consolidations made during implementation, not silent drift — recorded here for traceability.

| Plan'd | As-built | Why |
|---|---|---|
| Three menu files (`canvas-menu.tsx`, `node-menu.tsx`, `edge-menu.tsx` in `parts/`) | One unified `parts/context-menu.tsx` dispatching by xyflow event target | Three menus shared 80%+ of structure; one parametric component is simpler than three near-duplicates. |
| Hook for port walker + hook for connection validation (`hooks/use-port-walker.ts`, `hooks/use-connection-validator.ts`) | Pure functions in `lib/ports.ts` and `lib/validation.ts`; consumed inline | These didn't need React state or effects — `lib/` is the right home; hooks were over-modeling. |
| `parts/edge-adapter.tsx` to dispatch on `__type` to consumer edges | Built-in smoothstep + a single `'ilinxa-edge'` xyflow type with `data.__type` carried through | Consumer edge dispatch deferred to v0.2 (out-of-scope for v0.1 per description §2). The adapter became unnecessary. |
| `parts/controls.tsx` with custom Controls override matching design tokens | Not authored. Relies on xyflow's default `<Controls />` styled via `--xy-controls-*` CSS variables in `globals.css`. Visual gap on the bottom-left edge of the controls panel is acknowledged. | Theming via CSS variables turned out sufficient for v0.1. v0.2 may revisit if the gap becomes a design concern. |

Net effect on the file count breakdown:
- 1 root (`flow-canvas-01.tsx`)
- 13 parts (was 14; menu consolidation)
- 5 hooks (was 7; two migrated to `lib/`)
- 4 registries (renderers, port-types, edge-types, custom-json)
- 7 lib (was 5; gained 2 from hook migration)
- 6 fixed (`types.ts`, `dummy-data.ts`, `demo.tsx`, `usage.tsx`, `meta.ts`, `index.ts`)
- **Total: 30** (— `controls.tsx` not authored).
