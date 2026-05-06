# `flow-canvas-01` — Pro-component Description (Stage 1)

> **Stage:** 1 of 3 · **Status:** Draft — awaiting sign-off
> **Slug:** `flow-canvas-01` · **Category (proposed):** `data` (see Q2)
> **Conceptual lineage:** n8n / Retool Workflows / Langflow / Flowise / ComfyUI / Figma FigJam / Blender's geometry-nodes editor. **Not a clone of any of them.** A reusable React surface for visualizing and authoring connected, JSON-shaped nodes on an infinite zoomable canvas.

This is the **description** doc. Its job is to pin down what we're building and why, surface open decisions, and earn sign-off before any planning or code. The full concept brief authored by the user is preserved verbatim in Appendix A; the in-conversation reframes that hardened the model are summarized in Appendix B.

---

## 1. Problem

Node-and-edge canvases are everywhere in modern tooling — workflow automation (n8n, Zapier visual builder), AI agent graphs (Langflow, Flowise), shader/material editors (Blender, Substance), data pipelines (Retool, Dagster UI), digital whiteboards with structured cards (FigJam, Miro). Every team that wants one today either:

- Embeds a SaaS canvas inside an iframe and gives up on owning the data model,
- Forks an OSS canvas (n8n, Langflow) and accepts inheriting an entire product, or
- Pulls in `@xyflow/react` (formerly React Flow) and **builds the node chrome / port system / type registry / right-click menus / save-load shape from scratch** — typically 2–4 weeks of work, never quite right.

There is no high-quality, pluggable React component that ships **the canvas chrome** — the layer that wraps a viewport-and-edges primitive into something a product team can drop into a route, point at their existing JSON-shaped data, and have a polished node editor on day one. This pro-component fills that gap.

The registry already has a strong rich-card system (`post-card-01`, `project-card-01`, `event-card-01`, etc.) and our newer composite surfaces (`kanban-board-01`, `workspace-01`) ship serializable data shapes by design. Flow-canvas treats **every JSON object as a potential node** — recognized shapes (by `__type` discriminator) render via a registered renderer; unknown shapes fall back to a "custom JSON" node with a raw JSON viewer/editor. **Connection ports live inside the data, recursively** — every level of the tree (root and any sub-object) may carry an optional `ports?: Port[]` field, and the canvas walks the tree to render handles. Sub-object extraction (drag a `media[0]` out of a `post-card`) is just sub-JSON copy + paste through the same drop pipeline.

That is the contract this component owns: **the viewport, the renderer registry, the port-type registry, the connection rules, the right-click menus, the background system, and the JSON save/load shape.** Everything else (specific renderers, specific port types, specific node business logic) is consumer-supplied.

---

## 2. In scope / Out of scope

### In scope (v0.1.0 → v1.0.0 trajectory)

- **A single root canvas surface** with infinite virtual viewport: pan, zoom (mouse wheel + pinch + zoom controls), fit-to-view, zoom-to-selection, viewport snapshot/restore.
- **Customizable background** — gradient (light / dark theme aware) + optional dot/grid/cross overlay. Direction, color stops, and overlay style all consumer-overridable via `background` prop. Defaults match design-system tokens (graphite-cool dark, cool off-white light).
- **Two ingestion paths for JSON onto the canvas** — (a) **DOM drag-and-drop** of `application/json` payloads (external file drag, drag from another element on the page, or sub-object drag from within the canvas); (b) **clipboard paste** via `Cmd/Ctrl-V` on a focused canvas or "Paste JSON…" in the canvas right-click menu. Both paths flow through `onBeforeDrop` for consumer transformation, then schema detection (`__type` discriminator) into renderer dispatch or custom-JSON fallback. Sub-object extraction reuses the same drop pipeline — the dragged payload is just sub-JSON.
- **Renderer registry by `__type`** — every node's `data.__type` keys into a registered renderer. Renderers are passed `(data, ctx)` and produce a React subtree. The canvas does not know how to render anything; it delegates. **Recursion is natural**: a sub-object that itself has `__type` can be looked up by the parent renderer and rendered through its own registered renderer. Handle placement happens *inside* renderers — each level reads its own `data.ports[]` and emits xyflow `<Handle>` elements at appropriate positions.
- **Custom-JSON fallback** — incoming JSON without a recognized `__type` (or with `__type: 'custom-json'` explicitly) renders as a built-in custom-JSON node: collapsed view shows a label + JSON-tree summary; expanded view shows a raw JSON viewer (read-only by default; editable when `onNodeUpdate` is supplied). The user can promote a custom JSON to a typed node by editing `__type` and saving.
- **Port-type registry** — global, separate from renderer registry. Each port type registers `{ id, color, label?, icon? }`. Ports declare only `{ id, side, dir, type, multi }`; color follows from registry. Built-in port types ship: `data` (neutral), `image`, `text`, `card`, `event`. Consumers extend with `registerPortType(...)`.
- **Edge-type registry** — third registry, sibling to renderers and port types. Each edge type registers `{ id, render(edge, ctx) }` and is keyed by `EdgeRecord.type`. Built-in default `'smoothstep'` ships and is used when `EdgeRecord.type` is omitted; default styling pulls stroke color from the source port's type. Consumers register more (e.g. animated, dashed, labeled, control-flow vs data-flow). Open from v0.1 because adding edge polymorphism later would be a breaking change to the registry shape.
- **Ports embedded in data, recursively.** A node's `data` carries an optional `ports?: Port[]` at any depth. Tree-walker resolves all ports on a node into one flat lookup keyed by `portId` (unique within a node). Edges reference `nodeId:portId` — edges remain flat regardless of where the port sits in the tree.
- **Default port topology per `__type`.** When registering a renderer, the consumer may declare `defaultPorts: (data) => Port[]` (or a sub-tree-aware variant for nested ports). On drop of a JSON of that type that has no `ports` declared, the canvas inflates the defaults and merges them into the canvas-instance data. Inflation never mutates the source JSON — only the canvas state.
- **Source data vs canvas data — explicit boundary.** The canvas owns its own state; ports edited inside the canvas live there. An imperative `exportRef.export({ withPorts })` returns either a portable graph (JSON with ports + edges, round-trippable) or a clean export (ports stripped, edges dropped, sub-trees match their original schema). This boundary is the v0.1 contract.
- **Typed connections.** A connection from `out:type-A` to `in:type-A` succeeds; mismatched types are rejected with a visible block indicator on hover. Same direction (`out → out`) is rejected. Connection rules are the *only* validation layer in v0.1; consumers add semantic validation via `onBeforeConnect` callback.
- **`multi: true | false` per port** — `false` rejects a second incoming/outgoing edge; `true` allows fan-out / fan-in at the single port. Independent of "multiple ports of the same type+direction on a node," which is allowed naturally (sub-objects of the same kind each carrying typed ports produce this case).
- **Sub-object drag-extract** — dragging a sub-object out of a parent node onto empty canvas creates a new node from that sub-JSON. Default gesture: copy (parent retains the sub-object). `Alt+drag` moves (parent loses it). Renderer must mark sub-objects as draggable with `data-draggable-subobject="<path>"`; canvas handles the gesture.
- **Right-click menus** — three contexts, each consumer-extendable:
  - **Canvas** (empty space): "Paste JSON…", "Add custom node", "Fit view", "Reset zoom"
  - **Node**: "Duplicate", "Copy as JSON", "Convert to custom-JSON", "Delete"
  - **Edge**: "Delete" (typed ports are inherently directional — out → in — so reversal is meaningless and not exposed)
  Consumers append items via `menuItems.canvas` / `menuItems.node` / `menuItems.edge` props.
- **Selection model** — single click selects; shift-click adds; click empty clears. Marquee selection deferred to v0.2.
- **Per-node lock** — `node.locked: true` pins the node in place. The locked node cannot be moved by drag (overrides drag); other operations (edge connect/disconnect, delete via menu, sub-object extract) remain available unless `readOnly` is also set. Mirrors the kanban-board per-item lock contract. Visual indicator (lock chip on hover or in the node shell) is plan-stage detail.
- **Save / load** — full canvas state is `{ version, nodes: NodeRecord[], edges: EdgeRecord[], viewport?: { x, y, zoom } }`. Round-trips through `JSON.stringify` cleanly. Versioned for forward migration.
- **Controlled and uncontrolled state** — `data` (controlled) / `defaultData` (uncontrolled) / `onChange`. Same shape as workspace and kanban-board precedents.
- **Read-only mode** — `readOnly` disables all editing (no drag, no connect, no menus that mutate). Pan and zoom remain enabled.
- **Keyboard accessibility** — pan via arrow keys when canvas focused; `+` / `-` zoom; `0` fit view; `Delete` removes selected nodes/edges; tab order through nodes; visible focus rings. xyflow's keyboard a11y is leveraged.
- **Portability** — zero `next/*` imports, no app-context coupling, no `process.env`. Standard pro-component portability rules. Peer deps explicit.

### Out of scope (deliberate non-goals)

- **Undo / redo** — consumers wire it via `onChange` snapshots; we don't ship a history stack. (v0.2 candidate.)
- **Minimap** — xyflow ships one; we'll expose it via a slot in v0.2 but not enable it by default.
- **Auto-layout / dagre / ELK integration** — out of scope for v0.1. Consumers lay out manually or compute positions themselves.
- **Marquee / lasso selection** — single + shift-click only in v0.1. Marquee is v0.2.
- **Group / frame containers** — n8n-style "sticky frames" wrapping multiple nodes. Useful, but its own design space. v0.3+ candidate.
- **Execution-state visualization** — animated edges, running spinners on nodes, error markers. This is workflow-specific and varies wildly per use case. Consumers can overlay via `nodeStatus` prop callbacks but no built-in UI.
- **Component / palette sidebar** — the "draggable list of node types you can drag onto canvas" panel that n8n and Langflow ship. Useful but a separate component (`flow-palette-01`?) — flow-canvas itself just receives drops.
- **Search palette / command picker** — consumer-supplied if needed.
- **Cross-canvas drag** — single canvas only.
- **DB-ref nodes** (`{ ref: 'post:abc123' }` placeholders that fetch and visualize on demand) — its own subsystem with loader registry, fetch state, cache, refetch policy. **Deferred to v2.** v0.1 nodes carry inline data.
- **Live collaborative editing** — presence cursors, conflict resolution, CRDT.
- **Inline edge controls** — mid-edge buttons (delete on hover, edit-label affordances), mid-edge editable labels, animation-state toggles. Edge appearance is polymorphic via the edge-type registry, but inline-on-edge interactivity beyond the registry is v0.2.
- **Built-in renderer set beyond `custom-json`** — flow-canvas ships ONLY the custom-JSON fallback renderer. Cards from elsewhere in the registry (`post-card-01`, `project-card-01`, etc.) are wrapped by consumers via thin adapter renderers. Auto-discovery is explicitly NOT in scope.

---

## 3. Target consumers

Five concrete archetypes drive the design, in priority order:

| Archetype | Example | What they need |
|---|---|---|
| **Workflow / automation builder** *(primary)* | Internal Zapier-like, ETL pipeline editor, data-flow orchestration | Typed inputs/outputs, custom node renderers, save/load JSON, read-only execution view |
| **AI agent / LLM graph editor** *(primary)* | Langflow-style, RAG pipeline builder, agent topology designer | Many node types with typed ports (text/embedding/tool), custom-JSON fallback for ad-hoc config |
| **Visual configuration / no-code** *(primary)* | Form-flow builder, conditional logic editor, decision tree | Drop registry cards as nodes, drag sub-objects out as standalone nodes, save user-built graph as JSON |
| **Knowledge / mind-map authoring** *(secondary)* | Note-graph editor, idea mapping, concept linking | Custom-JSON nodes + rich card nodes mixed; loose port semantics |
| **Schema / data-model designer** *(secondary)* | Visual ERD-lite, API schema relationship view | Typed ports per field, multi-port per node, save as JSON for downstream codegen |

**Non-targets:** force-directed graphs (use `force-graph-01`), hierarchical org charts (use a tree visualizer), Gantt charts, pure timelines, dense data tables.

---

## 4. Rough API sketch (NOT final — that's the plan stage)

This is illustrative. The plan doc will lock the final shape after we agree on the description.

```ts
// ─────────────────────────────────────────────────────────────────────
// Port — embedded inside data at any tree depth
// ─────────────────────────────────────────────────────────────────────

type PortDir = 'in' | 'out';
type PortSide = 'left' | 'right' | 'top' | 'bottom';

type Port = {
  id: string;          // unique WITHIN the node (across all tree depths)
  side: PortSide;      // visual placement on the rendered handle
  dir: PortDir;        // 'in' or 'out'
  type: string;        // key into PortTypeRegistry
  multi?: boolean;     // false = at most one connection; true = many. Default false.
  label?: string;      // optional visible label next to the handle
};

// ─────────────────────────────────────────────────────────────────────
// Node data — pure JSON, schema-discriminated, ports recursive
// ─────────────────────────────────────────────────────────────────────

// Every node carries __type at root; sub-objects MAY carry __type too if they
// are independently renderable / extractable. Both root and sub-objects MAY
// carry ports.

type NodeData = {
  __type: string;          // matched against renderer registry; 'custom-json' is reserved
  ports?: Port[];          // root-level ports
  [key: string]: unknown;  // renderer-specific payload — may itself contain typed sub-objects
};

type NodeRecord = {
  id: string;
  position: { x: number; y: number };
  data: NodeData;          // full data tree, ports embedded recursively
  width?: number;          // optional explicit size; otherwise renderer-driven
  height?: number;
  selected?: boolean;      // transient UI state — see Q22; not persisted on export
  locked?: boolean;        // pins the node; drag rejected (other ops still allowed unless readOnly)
};

type EdgeRecord = {
  id: string;
  source: `${string}:${string}`;   // 'nodeId:portId' — port resolved by tree-walk
  target: `${string}:${string}`;
  type?: string;                    // key into edgeTypes registry; default 'smoothstep' if omitted
  selected?: boolean;               // transient UI state — see Q22; not persisted on export
};

type CanvasData = {
  version: number;                  // schema version — for future migrations
  nodes: NodeRecord[];
  edges: EdgeRecord[];
  viewport?: { x: number; y: number; zoom: number };
};

// ─────────────────────────────────────────────────────────────────────
// Registries — the three keystones (renderers, port types, edge types)
// ─────────────────────────────────────────────────────────────────────

type RenderContext = {
  nodeId: string;
  isSelected: boolean;
  isDragging: boolean;
  isReadOnly: boolean;
  // Recursive child rendering — look up a sub-object's renderer by its data.__type
  // and render it. Falls back to the custom-JSON renderer if no match. Used by parent
  // renderers that want to delegate sub-object rendering instead of re-implementing it.
  renderChild: (data: NodeData, opts?: { path?: string }) => ReactNode;
};

type NodeRenderer<TData extends NodeData = NodeData> = {
  type: string;                                       // matches data.__type
  label: string;                                      // shown in palettes / right-click menus
  defaultPorts?: (data: TData) => Port[];             // inflated on drop if data.ports is absent
  defaultSubPorts?: (data: TData) => Record<string, Port[]>;  // path → ports for sub-objects
  render: (data: TData, ctx: RenderContext) => ReactNode;     // must place <Handle> elements for data.ports
  // Optional: drag-extract registration. Returns paths within data that are independently extractable.
  extractablePaths?: (data: TData) => string[];
};

type PortType = {
  id: string;
  label?: string;
  color: string;                                      // CSS color or token reference (prefer design-system tokens)
  icon?: ReactNode;
};

type EdgeRenderContext = {
  edgeId: string;
  source: { node: NodeRecord; port: Port };
  target: { node: NodeRecord; port: Port };
  isSelected: boolean;
};

type EdgeRenderer = {
  type: string;                                       // matches EdgeRecord.type
  label?: string;                                     // shown in right-click "convert to" menu (plan-stage)
  render: (edge: EdgeRecord, ctx: EdgeRenderContext) => ReactNode;
};

// ─────────────────────────────────────────────────────────────────────
// The canvas component
// ─────────────────────────────────────────────────────────────────────

type FlowCanvasProps = {
  // Registries (built-ins always registered; consumer additions merge on top)
  renderers?: NodeRenderer[];           // consumer-registered; built-in 'custom-json' always available
  portTypes?: PortType[];               // consumer-registered; built-ins: data | image | text | card | event
  edgeTypes?: EdgeRenderer[];           // consumer-registered; built-in 'smoothstep' default always available

  // State
  data?: CanvasData;                    // controlled
  defaultData?: CanvasData;             // uncontrolled
  onChange?: (next: CanvasData) => void;

  // Drop pipeline — consumer can intercept & rewrite incoming JSON
  onBeforeDrop?: (incoming: unknown, point: { x: number; y: number }) => NodeData | null;
  onBeforeConnect?: (edge: EdgeRecord, ctx: { source: Port; target: Port }) => boolean | EdgeRecord;

  // Mutation callbacks — affordances render only when supplied
  onNodeCreate?: (node: NodeRecord) => void;
  onNodeUpdate?: (node: NodeRecord) => void;
  onNodeDelete?: (nodeId: string) => void;
  onEdgeCreate?: (edge: EdgeRecord) => void;
  onEdgeDelete?: (edgeId: string) => void;
  onSubObjectExtract?: (parentId: string, path: string, gesture: 'copy' | 'move') => void;

  // Right-click menu extensions
  menuItems?: {
    canvas?: MenuItem[];
    node?: (node: NodeRecord) => MenuItem[];
    edge?: (edge: EdgeRecord) => MenuItem[];
  };

  // Background
  background?: {
    light?: { from: string; to: string; angle?: number };  // gradient stops + angle deg
    dark?:  { from: string; to: string; angle?: number };
    overlay?: 'none' | 'dots' | 'grid' | 'cross';
    overlayOpacity?: number;
  };

  // Behavior
  readOnly?: boolean;
  panOnDrag?: boolean;                  // default true
  zoomOnScroll?: boolean;               // default true
  selectionMode?: 'single' | 'multi';   // default 'multi' (with shift)

  // Export
  exportRef?: Ref<{ export: (opts: { withPorts: boolean }) => CanvasData }>;

  className?: string;
};

type MenuItem = {
  id: string;
  label: string;
  icon?: ReactNode;
  onSelect: () => void;
  disabled?: boolean;
  separatorBefore?: boolean;
};

// ─────────────────────────────────────────────────────────────────────
// Built-in custom-JSON renderer (named export)
// ─────────────────────────────────────────────────────────────────────

// import { customJsonRenderer } from "@/components/flow-canvas-01";
//
// Rendered when data.__type is 'custom-json' OR when data.__type has no
// registered renderer. Shows a label header + collapsible JSON tree.
// Editable when consumer supplies onNodeUpdate.
```

**Surface budget:** fourteen public types (`Port`, `PortDir`, `PortSide`, `NodeData`, `NodeRecord`, `EdgeRecord`, `CanvasData`, `RenderContext`, `NodeRenderer`, `PortType`, `EdgeRenderer`, `EdgeRenderContext`, `MenuItem`, `FlowCanvasProps`), zero strictly-required props (built-in renderers / port types / edge types cover the empty case), ~twenty optional props. If this expands materially during planning, the API is wrong and we restart this section.

---

## 5. Example usages

### 5.1 LLM agent graph — typed text/embedding flow (primary)

```tsx
import { FlowCanvas, customJsonRenderer } from "@/components/flow-canvas-01";

const promptRenderer = {
  type: 'prompt-node',
  label: 'Prompt',
  defaultPorts: () => [
    { id: 'in',  side: 'left',  dir: 'in',  type: 'text' },
    { id: 'out', side: 'right', dir: 'out', type: 'text' },
  ],
  render: (data) => (
    <div className="p-3 rounded-lg bg-card border">
      <Handle id="in"  type="target" position="left"  />
      <div className="font-mono text-sm">{data.template}</div>
      <Handle id="out" type="source" position="right" />
    </div>
  ),
};

<FlowCanvas
  renderers={[customJsonRenderer, promptRenderer, llmRenderer, retrieverRenderer]}
  portTypes={[
    { id: 'text',      color: 'oklch(0.7 0.15 250)' },
    { id: 'embedding', color: 'oklch(0.7 0.15 30)'  },
    { id: 'document',  color: 'oklch(0.7 0.15 130)' },
  ]}
  defaultData={{
    version: 1,
    nodes: [
      { id: 'p1', position: { x: 100, y: 100 }, data: {
        __type: 'prompt-node',
        template: 'Summarize: {{input}}',
        ports: [
          { id: 'in',  side: 'left',  dir: 'in',  type: 'text' },
          { id: 'out', side: 'right', dir: 'out', type: 'text' },
        ],
      }},
      // ...llm-node, retriever-node
    ],
    edges: [
      { id: 'e1', source: 'p1:out', target: 'l1:in' },
    ],
  }}
  onChange={persist}
/>
```

A typed agent graph. Connecting `out:text` → `in:text` succeeds; `out:embedding` → `in:text` is rejected with a visible block indicator. Custom-json renderer is the fallback for any ad-hoc node the user pastes in.

### 5.2 Project board as a flow — registry cards as nodes (primary)

```tsx
import { ProjectCard } from "@/components/project-card-01";
import { PostCard }    from "@/components/post-card-01";
import { FlowCanvas, customJsonRenderer } from "@/components/flow-canvas-01";

const projectCardRenderer = {
  type: 'project-card-01',
  label: 'Project',
  defaultPorts: () => [
    { id: 'depends-on', side: 'left',  dir: 'in',  type: 'card', multi: true },
    { id: 'enables',    side: 'right', dir: 'out', type: 'card', multi: true },
  ],
  render: (data, ctx) => (
    <div className="relative">
      <Handle id="depends-on" type="target" position="left"  />
      <ProjectCard {...data} />
      <Handle id="enables" type="source" position="right" />
    </div>
  ),
};

<FlowCanvas
  renderers={[customJsonRenderer, projectCardRenderer, postCardRenderer]}
  defaultData={fromMyAppState}
  onChange={syncBackToAppState}
/>
```

Rich registry cards become nodes through a thin adapter renderer. The `ProjectCard` itself stays untouched — the renderer just wraps it with handles. Source `ProjectCard` JSON dropped onto the canvas inflates with `defaultPorts` automatically.

### 5.3 Sub-object extraction — drag a media item out of a post-card (primary)

```tsx
const postCardRenderer = {
  type: 'post-card-01',
  label: 'Post',
  defaultPorts: () => [
    { id: 'reply', side: 'left', dir: 'in', type: 'card' },
  ],
  defaultSubPorts: (data) =>
    Object.fromEntries(
      data.media.map((m, i) => [
        `media[${i}]`,
        [{ id: `m${i}`, side: 'right', dir: 'out', type: 'image' }],
      ])
    ),
  extractablePaths: (data) => data.media.map((_, i) => `media[${i}]`),
  render: (data) => (
    <PostCardWithHandles data={data} />  // walks data.ports + data.media[i].ports
  ),
};

<FlowCanvas
  renderers={[customJsonRenderer, postCardRenderer, mediaImageRenderer]}
  onSubObjectExtract={(parentId, path, gesture) => {
    console.log(`extracted ${path} from ${parentId} (${gesture})`);
  }}
/>
```

Each media item carries its own `out:image` port, rendered alongside the parent post. Dragging a media item handle out of the card detaches it as a new node (a `media-image` node with its own port). Default gesture is copy; `Alt+drag` is move.

### 5.4 Custom-JSON fallback — paste arbitrary JSON (secondary)

```tsx
<FlowCanvas
  renderers={[customJsonRenderer]}     // ONLY the fallback registered
  defaultData={{ version: 1, nodes: [], edges: [] }}
  onChange={persist}
/>
```

User pastes any JSON. With no matching renderer, it renders as a custom-JSON node. User can manually add `__type` and `ports` in the raw editor; on next render the canvas re-evaluates and (if a matching renderer is now registered) renders it as that type.

### 5.5 Read-only execution view — viewer of a saved graph (secondary)

```tsx
<FlowCanvas
  renderers={[customJsonRenderer, ...allRenderers]}
  data={savedGraph}
  readOnly
  background={{ overlay: 'dots', overlayOpacity: 0.3 }}
/>
```

Renders the same graph without any editing affordances. Pan and zoom remain. Used for reviewing a published workflow or sharing a graph as a read-only artifact.

---

## 6. Success criteria

The component ships v0.1.0 (alpha) when:

1. **Consumer onboarding**: a developer can render a 3-node canvas with two custom renderers, typed connections, and working save/load in under 30 minutes from copy-paste.
2. **All gestures from the cheat sheet work** at first try:
   - Pan with mouse drag on empty canvas; zoom with wheel; fit-to-view via control button or `0` key
   - Drag node by its body → reposition
   - Drag from output handle to input handle → edge created (only if types match)
   - Drag from output handle to incompatible input → connection rejected with visible indicator
   - Right-click empty canvas / node / edge → respective menu opens
   - Drop arbitrary JSON onto canvas → renderer-or-custom-JSON node appears at drop point
   - `Cmd/Ctrl-V` on focused canvas with JSON in clipboard → same dispatch as drop
   - Drag a sub-object handle out of a parent → new node created, parent retains sub-object
   - `Alt+drag` sub-object → new node, parent loses sub-object
3. **Type rules honored** — `out:A → in:A` connects; `out:A → in:B` rejects; `out → out` rejects; `multi: false` rejects a second edge to the same port.
4. **State round-trip** — `onChange` produces JSON that, fed back as `data`, reproduces the exact canvas state including viewport. **Nodes round-trip as pure data** — no JSX or function references in the serialized form.
5. **Source vs canvas data contract** — `exportRef.export({ withPorts: false })` strips all `ports` arrays at every depth and drops all edges, returning a clean source-shape tree. `exportRef.export({ withPorts: true })` returns the full canvas state.
6. **State preservation contract** — moving a node across the viewport does NOT remount its rendered body; only its position transform changes. Consumers relying on body internal state see it preserved.
7. **No hardcoded colors** — semantic Tailwind tokens only; gradient defaults reference design-system OKLCH tokens. Light/dark themes both look right.
8. **Performance**: a 200-node / 300-edge canvas pans, zooms, and drags at 60fps on a mid-tier laptop. Edge re-routing during node drag stays smooth.
9. **Accessibility**: keyboard pan/zoom/select/delete all work; tab order through nodes is logical; visible focus rings; screen-reader live region announces selection changes and connection results.
10. **Portability**: zero `next/*` imports, no `process.env`, no app-context coupling. `@xyflow/react` is the only new external peer dep.
11. **Demo and usage docs** complete; one demo per primary archetype above.
12. **Compiles and renders** at `/components/flow-canvas-01` with no console warnings.
13. **Touch / pen support** — basic pan/zoom on tablets via xyflow's built-in pointer support. Edge creation on touch is functional (long-press handle, drag, release on target).

Stable (`1.0.0`) is gated separately and includes external consumers, undo/redo, marquee selection, and a 30-day no-break window.

---

## 7. Open questions (will become locked decisions after sign-off)

| # | Question | Proposed answer | Notes |
|---|---|---|---|
| Q1 | **Slug name** — `flow-canvas-01` vs `node-canvas-01` / `flow-board-01` / `data-flow-01` | **`flow-canvas-01`** | "Flow" disambiguates from `kanban-board` and from `force-graph` (which is a different graph paradigm). "Canvas" reads better than "board" for a free-form viewport. |
| Q2 | **Category** — `data` (matches kanban precedent) or new `canvas` / `surfaces` category? | **`data`** for v0.1; revisit if 2+ canvas-style components ship | Kanban-board already lives in `data`. Adding a category for one component is premature; if `flow-palette-01` and a whiteboard ship later, promote then. |
| Q3 | **Decomposition** — single sealed folder or multiple registry items? | **Single sealed folder** `flow-canvas-01` with parts (`canvas.tsx`, `node-shell.tsx`, `port-handle.tsx`, `custom-json-node.tsx`, `default-edge.tsx`, `menu-canvas.tsx`, `menu-node.tsx`, `menu-edge.tsx`, `background.tsx`, `tree-walker.ts`, `renderer-registry.ts`, `port-type-registry.ts`, `edge-type-registry.ts`). | Tightly coupled — only meaningful together. One install: `pnpm dlx shadcn add @ilinxa/flow-canvas-01`. |
| Q4 | **Substrate library** — custom build, `@xyflow/react`, `reaflow`, native? | **`@xyflow/react`** (latest stable; React 19 compatible). | Industry standard. Ships viewport, edges, handles, controls, minimap, keyboard a11y. Custom build buys very little for weeks of work. New peer dep — needs to be acknowledged. |
| Q5 | **Built-in renderers shipped** — just `custom-json` or also adapters for our existing cards? | **Just `custom-json`** (the fallback). All other renderers are consumer-supplied via thin adapters around existing registry components. | Auto-discovery is explicitly out of scope (§2). Adapter pattern is documented in usage. Keeps flow-canvas independent of every other registry component. |
| Q6 | **Built-in port types shipped** — full set or minimal? | **Five built-ins** registered by default: `data` (neutral grey), `text` (blue), `image` (orange), `card` (lime accent), `event` (rose). Consumers add more or override colors. | Common enough to be useful out of the box; small enough to not feel opinionated. All overridable via `portTypes` prop. |
| Q7 | **Default port topology — declared by renderer or required in data?** | **Renderer declares `defaultPorts(data)`; canvas inflates at drop time IF `data.ports` is absent.** Once inflated, ports live in canvas-instance data and the user can edit. | Source data stays clean. Renderer authors define "what ports a fresh-from-source node has." Aligns with the source-vs-canvas-data split. |
| Q8 | **Sub-object port topology** — `defaultSubPorts(data)` map, or renderer walks the tree itself? | **`defaultSubPorts(data): Record<path, Port[]>`** — explicit map keyed by JSONPath-ish string. Canvas merges into the canvas-instance data tree. | Trade-off: less flexible than letting renderer mutate data, but inspectable, declarative, and works with the source-vs-canvas split. |
| Q9 | **Port-ID uniqueness scope** — node-wide or tree-position-local? | **Node-wide unique.** Edges are flat `nodeId:portId`; tree-walker resolves location. Renderer authors are responsible for naming uniquely (use prefixes for sub-objects: `m0`, `m1` for `media[0..n]`). | Simpler edges. Spec'd in §4 and called out as a renderer-author rule in usage docs. |
| Q10 | **Sub-object extraction gesture** — drag-out, context-menu, or both? | **Drag-out is primary** (default copy, `Alt+drag` to move). Right-click menu adds "Extract as node" as an explicit fallback for accessibility. | Two paths to the same operation; drag is intuitive, menu is keyboard-accessible. |
| Q11 | **`onBeforeDrop` interceptor** — yes? | **Yes.** Consumer can transform incoming JSON (e.g. fetch full data from a DB-ref placeholder, normalize a foreign schema, reject). Returning `null` cancels the drop. | This is the v0.1 hook for the v2 DB-ref pattern. Doesn't require us to ship a loader subsystem now. |
| Q12 | **`onBeforeConnect` validator** — yes? | **Yes.** Consumer-supplied predicate runs after type-rule passes; can reject for semantic reasons (e.g. cyclic dep, capacity limit). Returning a modified `EdgeRecord` rewrites the edge. | Consistent with `onBeforeDrop`. Keeps validation surface narrow in v0.1 but extensible. |
| Q13 | **Background customization API** — preset only or full-CSS pass-through? | **Preset object** with light/dark gradient stops + overlay style. Full-CSS escape hatch via `className` on the canvas root if a consumer needs it. | Preset covers the 95% case; escape hatch covers the rest. No per-node-background customization in v0.1. |
| Q14 | **Right-click menu items — locked or extendable?** | **Built-in items are fixed** (Duplicate, Copy as JSON, Convert to custom-JSON, Delete on nodes; etc.). **Consumers append additional items** via `menuItems.{canvas, node, edge}`. No removing built-ins in v0.1. | Predictability over configurability for the default set. Consumers wanting fully custom menus build their own renderer chrome. |
| Q15 | **Edge deletion on node delete** — cascade or orphan? | **Cascade.** Deleting a node deletes all its incident edges. No "dangling edge" state. | Standard graph semantics. No use case for orphan edges in v0.1. |
| Q16 | **Save/load schema versioning** — versioned now or later? | **Versioned now** — `CanvasData.version: number` starting at `1`. Plan stage decides migration story. | Forward-compatible from day one is cheap; retrofitting versions is expensive. |
| Q17 | **Selection model** — single, multi (shift), or marquee? | **v0.1: single + shift-multi.** Marquee deferred to v0.2. | Covers the common case; marquee adds drag-overlap math we don't need yet. |
| Q18 | **Read-only mode coverage** — disable just edits, or also disable selection? | **Disable edits only.** Selection, pan, zoom, right-click "view" menu items remain. | Read-only viewers (audit, share-link) need to inspect the graph; pure-static is a CSS render of nodes, not what we ship. |
| Q19 | **Touch / pen interaction parity with mouse** — full parity or basic? | **Basic.** Pan, zoom, drag-to-connect on touch. Long-press to open right-click menu. Sub-object extract via long-press + drag is functional but not pixel-perfect. | xyflow gets us most of this. Polishing touch DnD is a v0.2 task. |
| Q20 | **`@xyflow/react` peer dep — bundled or peer?** | **Peer dep** declared in registry component metadata. Consumer installs via `pnpm dlx shadcn add @ilinxa/flow-canvas-01` which then prompts to install xyflow. | Standard registry pattern for non-trivial third-party deps. |
| Q21 | **Edge rendering — polymorphic from v0.1?** | **Yes — `edgeTypes?: EdgeRenderer[]` registry, sibling to `renderers` and `portTypes`.** Built-in `'smoothstep'` default registered; default styling pulls stroke color from source port's type. Consumers register more (animated, dashed, labeled, control-flow vs data-flow). | Per the dynamicity-primacy rule: open API surfaces from v0.1 ("add it later is breaking"). Edges deserve the same registry treatment as nodes and port types. Surface added in §4. |
| Q22 | **Selection state — runtime-only or persisted in saved JSON?** | **Runtime-only.** `selected` flags on `NodeRecord` / `EdgeRecord` do NOT round-trip through `exportRef.export(...)`; they are stripped on export and not restored on load. Marked `// transient UI state` in API. | Saving selection rarely useful and can mislead "load from storage and resume" flows. The field stays on the public type for runtime introspection (a node knows it's selected during render) but is filtered out on serialization. Plan stage may instead lift selection to a separate `Set<string>` outside `CanvasData`. |
| Q23 | **Default port precedence — three sources of port defaults exist (parent renderer's `defaultSubPorts`, the sub-object's own renderer's `defaultPorts` if extracted, and the user's edits in canvas state).** | **Order: user-edits > parent's `defaultSubPorts` > extracted-renderer's `defaultPorts`.** User-edits always win. While nested inside a parent, the parent's say is authoritative for sub-paths. When a sub-object is extracted as a standalone root, its own renderer's `defaultPorts` runs (parent no longer in scope). | Locks the inflation rule. Plan-stage detail: also distinguish `ports: []` (deliberate empty, do NOT re-inflate) from absent `ports` (use defaults) on reload. |
| Q24 | **Recursive child rendering API** — how does a parent renderer ask the canvas to render a sub-object via that sub-object's `__type`? | **`RenderContext.renderChild(data, opts?)`** — passed into every renderer; falls back to custom-JSON when no match. Renderers can opt into recursion or render sub-objects manually; both are fine. | Without this hook, recursion was implied but unimplementable from §1's promises. Surface added in §4. Plan stage decides whether `opts.path` is needed for sub-port-id namespacing. |

---

## 8. Risks

- **Scope is enormous.** This is comparable to data-table or kanban-board in surface area, but with a more dynamic substrate (xyflow's API) and more registry-style indirection (three registries — node renderers, port types, edge types — plus recursive rendering and the source-vs-canvas data split). Plan stage must be ruthless about deferring everything not in §2 in-scope.
- **xyflow API churn.** xyflow is actively developed; pinning a version and tracking releases is non-trivial. Major-version migrations could be painful.
- **Recursive port placement is on the renderer author.** Each canvas-mode renderer must walk its own data tree and place handles at the right visual positions for sub-object ports. We can't fully abstract this without imposing a layout engine. Burden is documented; helper utilities (e.g. `<PortHandlesFor data={data.media[i]} path="media[0]" />`) may emerge in v0.2.
- **Schema-discriminator collisions.** Two consumers register renderers for the same `__type` → last-write-wins or warn? Plan stage decides; a strict "throw on collision" prevents silent overrides but makes hot-reload painful. Default to last-wins-with-warning.
- **Source-vs-canvas data semantics.** The boundary is precisely defined for "ports" but what about other canvas-only edits (e.g. user changes a `body` text field on a custom-JSON node)? Those edits land in canvas data and survive export-with-ports; export-without-ports is a *port strip*, not a *revert to original*. This needs to be explicit in the guide doc.
- **Sub-object extraction for sub-objects without `__type`.** A media item without a `__type` extracted into the canvas can only render as `custom-json`. We could auto-assign `__type: 'custom-json'` on extraction, but that mutates data subtly. Plan stage decides.
- **Performance ceiling.** xyflow's documented sweet spot is ~1–2k nodes; beyond that is custom canvas territory. We cap success criteria at 200 nodes for v0.1 and document the ceiling.
- **Test coverage.** No test runner in the repo; same risk as kanban and workspace. A canvas-heavy component with drag, zoom, recursion, and registry-driven rendering is hard to verify by demo alone. Either land Vitest as a STATUS decision before this ships, or document test-debt and rely on demo + manual checklist.
- **Tailwind v4 + xyflow CSS** — xyflow ships a stylesheet (`@xyflow/react/dist/style.css`). Need to verify it doesn't conflict with `@source not "../../docs"` rules and that its custom properties play nicely with our OKLCH token system. Plan stage validates.
- **Right-click menu portability** — we use Radix's context menu? Custom popover? xyflow's hooks for menu positioning? Plan stage picks one.
- **Naming clash risk.** `flow-canvas` is generic enough that future variants are likely (`flow-canvas-02` with collaborative editing? `flow-canvas-readonly-01`?). Slug versioning is fine; component-internal naming should not pre-empt that space.
- **`ports: []` vs absent `ports` semantics on reload.** A user who deliberately clears all ports on a node should not have them re-inflated by `defaultPorts` on next render or on load-from-storage. Plan stage locks: presence of an empty array means "deliberate empty, respect"; absent field means "use defaults." The same rule applies to `defaultSubPorts` at sub-paths.
- **Built-in port-type colors must resolve to design-system tokens.** Q6 lists `text` (blue), `image` (orange), `card` (lime accent), `event` (rose) — these strings need to map to specific OKLCH tokens (likely `--chart-1` … `--chart-5` or named accents). Raw hex/oklch literals in the framework would violate the no-hardcoded-colors mandate. Plan stage maps each built-in to a CSS variable.
- **Drop-pipeline edge cases — non-JSON drops, partial JSON, MIME-less plain-text paste.** The two ingestion paths (drop, paste) need defined behavior for: invalid JSON (reject with a toast? render as `custom-json` with a `_parseError`?), drops of multiple files, paste of a string that looks JSON-ish but isn't. Plan stage defines the parse + reject ladder.

---

## 9. Definition of "done" for THIS document (stage gate)

Before moving to the plan stage:

- [ ] Sections 1–8 reviewed.
- [ ] Q1–Q24 each carry an agreed or overridden answer (see §7).
- [ ] In-scope / Out-of-scope list confirmed (especially: DB-ref deferred, no built-in renderer set beyond `custom-json`, marquee deferred, undo/redo deferred, edge polymorphism IN via registry).
- [ ] xyflow as substrate is approved as a new peer dep.
- [ ] Three registry surfaces (`renderers`, `portTypes`, `edgeTypes`) confirmed as the dynamicity contract.
- [ ] **User explicitly says "description approved" (or equivalent)** — this unlocks Stage 2 (`flow-canvas-01-procomp-plan.md`).

After sign-off, no editing this doc casually — changes after sign-off should be loud and intentional, not silent rewrites.

---

## Appendix A — Original concept brief (verbatim)

> i wanna make a perfectly optimized canvas like n8n that allow us to create complecated flows
> with all functionality (pan, zoom,...)
> with seamless dark and light gradient shade of backgrount (costomizable)
> in canvas right click functions and ...
> ----
> but as nodes each json could be a considered as a node
> but we must have predefined one and an empty custom node system
> ----
> i am imagining we could use our rich cards as a node or even use a kanban col component that can contain multiple cards as our predefined nodes
> ---
> even we should be able to drag the cards sub object and use them as independent node
> ----
> as all have same json format it should be doable
> but the cretic point is defining them the connection points (input, output, both, none) and connection type (points with similar type could connect to each other (and always output to the input) with multi connection on or off feature
>
> and i think we could have this feature in different way but we must
> 1. add this connection points to the cards (main and object) and cols
> as an optional connection object and same for sub objects in rich cards
> 2. create an empty conection components as a wrapper (in this method we may miss the sub card object manageable connections but we will be able to use it for any new component that we wanna use as a node
> 3. both
> ---
> what do you think?

> ok lets imagin this way
> we are interacting with data !!
> not component
> when we drag and drop a card or copy and paste it actually we transfer the data !!!
> so the cards json will grabed or copied to clipboard and paste in the canvas
> now our canvas must be identify that json
> if it is a json but not fredefined structure it just shows a node "costom json" and openning it shows us the json file raw content
> if it has card structure it shows it in a card component
> now the card is the same just we can define the inputs and outputs and manage them for all objects and jsons (and it will be nothing more than a sub object for that jsons :
> JSON-X.Port:{}
> JSON-X.SUB_OBJ.Port:{}
> ....
> ---- and wen we drag a sub ubject from a card we actually copy that sub obj json data and pased it in the canvas and same senario will happend
> in data bases we can just use the obj id and fetch them and visualize them !

> Default ports per type:user can edit afterward and the edits live in the data. yes but in canvas data not in main src data
> we later on can export it with or with out them
> ----
> we also need to customize the cards (canvas version) to visualize that ports
> ---
> edges must have define able types
>  node-1 [out, type-A, color-A] ---->  node-2 [in, type-A, color-A]
> node-1 [out, type-A, color-A] ----X  node-2 [in, type-B, color-B]
> -----
> actually ports have types
> and each elements {nodes} could have mor then 1 in or out port with different types not same type

> can a node have two ports of the same type+direction : do you think we need that?
> we could consider it as a single port but support multiple connections! right? or you mean somthing different?

---

## Appendix B — Reframes hardened in conversation

These were the structural shifts that took us from the original brief to the locked design. Recording them so the plan stage and reviewer don't relitigate.

1. **Custom canvas → xyflow substrate.** Building n8n-grade pan/zoom/edge-routing/port-snap from scratch is weeks of work and largely solved. `@xyflow/react` is the substrate.
2. **Component-first → data-first.** The canvas operates on JSON, not React components. Drag/drop/copy/paste move *data*, not components. Schema detection happens at the canvas drop boundary via `__type` discriminator.
3. **"Ports on cards" / "ports on wrapper" / "both" → ports embedded in the data tree, recursively.** Each level of the data tree (root and any sub-object) may carry `ports?: Port[]`. The canvas walks the tree.
4. **Source data vs canvas data — explicit boundary.** Source JSON is pure (no ports). On drop, the canvas inflates default ports (declared by the renderer) into a canvas-only copy. User edits to ports live in the canvas state. Export toggles whether ports come along.
5. **Ports separated from renderers — two registries.** Renderer registry maps `__type → React renderer`. Port-type registry maps `port type id → color/icon/label`. These are independent concerns.
6. **Edges stay flat (`nodeId:portId`).** Port IDs are unique within a node; tree-walker resolves their location. Edges don't encode tree paths.
7. **Multiple same-type-direction ports per node are allowed.** Naturally produced by sub-objects of the same kind each carrying their own typed port (e.g. three media items each with `out:image`). Distinct from `multi: true` on a single port (one logical value, broadcast to many wires) — both features coexist.
8. **Sub-object extraction = drag the sub-JSON out, paste through the same drop pipeline.** Default copy (parent retains), `Alt+drag` to move.
9. **DB-ref nodes (`{ ref: 'post:abc123' }`) are deferred to v2.** Their loader / cache / refetch protocol is its own subsystem. v0.1 nodes carry inline data. The `onBeforeDrop` hook is where v2's ref-resolution will plug in.
10. **No built-in renderer set beyond `custom-json`.** Existing registry cards are wrapped by consumers via thin adapter renderers. Auto-discovery is explicitly NOT in scope.
