# `flow-canvas-01` — Pro-component Guide (Stage 3)

> **Stage:** 3 of 3 · **Status:** Living — grows with each milestone
> **Slug:** `flow-canvas-01` · **Category:** `data` · **Version:** `0.1.0-alpha (M1–M9 shipped — ready for first-consumer testing)`
> **Authoring rule:** every section here describes what is **actually shipped** in v0.1.0-alpha. Items deferred to v0.2 or later are flagged inline. The plan-stage shape (locked decisions Q1–Q24) lives in [the plan doc](flow-canvas-01-procomp-plan.md).

The procomp-guide is the consumer-facing usage reference. It is wider than `usage.tsx` (which renders inside the docs site) and goes deeper on rationale, footguns, and stack-specific integration. It is the source of truth for "how to use `<FlowCanvas />` correctly."

---

## 1. What `<FlowCanvas />` is

A node-and-edge canvas built on `@xyflow/react@12.10.2` for **JSON-first** node graphs. Every node is a JSON object discriminated by a `__type` field that keys into a renderer registry; unknown shapes fall back to a built-in `custom-json` renderer. Three keystone registries (`renderers` / `portTypes` / `edgeTypes`) plus a recursive port walker, a source-vs-canvas data boundary, and an imperative export handle.

The library underneath (xyflow, formerly React Flow) is MIT-licensed with no feature gates ([reactflow.dev/pro](https://reactflow.dev/pro)).

**Use it for:** flow editors (n8n-style), AI agent graphs (Langflow / Flowise), workflow canvases, visual configuration, schema-of-data viewers, knowledge-graph authoring with typed connections.

**Don't use it for:** force-directed layouts (use `force-graph`), hierarchical org charts (use a tree visualizer), Gantt charts, dense data tables, pure timelines.

---

## 2. Status by milestone

The component ships incrementally toward `v0.1.0-alpha`. Each milestone is independently demoable.

| M | Status | What works | What's deferred |
|---|---|---|---|
| **M1** | ✅ shipped | `<FlowCanvas>` renders, custom-json fallback, controlled + uncontrolled state, `exportRef.export({ withPorts })`, gradient background (light + dark), pan / zoom / fit-view, per-node `locked`, `readOnly` mode, three-registry plumbing via Context (built-ins ship), keyboard select / delete, `<NodeShell>` wraps every renderer (selection ring + lock chip + focus-visible) | — |
| **M2** | ✅ shipped | `<PortsAt>` helper for stacked handles, `<PortHandle>` typed handle with port-type color, `usePortType` consumed in handles, recursive `RenderContext.renderChild` available, rich demo with 4 custom renderers (Prompt / LLM / Display / Project-card adapter) + `ProjectCard01` wrapped as a node + multi-edge fan-out | `findPortInTree` walker (M3 territory now); `useRenderer` / `useEdgeType` consumer-facing hooks (exported but typically unused in v0.1) |
| **M3** | ✅ shipped | Drag-to-connect creates edges live; typed `isValidConnection` rejects mismatched-type / wrong-direction / `multi: false`-already-connected pairs at drag time; `connectionMode: ConnectionMode.Strict`; `findPortInTree` walker exported; edge selection visible (`stroke-width: 2.5` + `--xy-edge-stroke-selected`); `Backspace` AND `Delete` both delete selected edges/nodes; **port-color edge stroke** — each edge picks up its source port's type color at render (text=blue, image=emerald, card=lime); **`onBeforeConnect` consumer hook** chained after typed validation (can reject for semantic reasons or rewrite the edge) | Per-handle `isValidConnection` overrides; consumer-registered edge renderers dispatched via the edge-type registry (deferred to v0.2 — registry exists in Context but xyflow only sees the single `'ilinxa-edge'` adapter) |
| **M4** | ✅ shipped | **DOM drag-and-drop** of JSON onto the canvas (file drag, drag from another element, or sub-object — M5 — share this pipeline); **clipboard paste** via `Cmd/Ctrl-V` on a focused canvas; both flow through `onBeforeDrop` (consumer can intercept / rewrite / reject); JSON parses safely (parse error logs in dev, aborts cleanly); **schema detection** via `__type` discriminator with auto-coercion to `'custom-json'` for missing types; **default port inflation** runs `renderer.defaultPorts` and `renderer.defaultSubPorts` at the drop boundary, never on render; respects existing `ports: []` (deliberate-empty signal); `onNodeCreate` fires after successful drop. Three MIMEs accepted: `application/json` (canonical), `application/reactflow` (xyflow sidebar pattern compat), `text/plain` (clipboard fallback) | Right-click "Paste JSON…" dialog (deferred to M6 — needs the menu surface); toast notifications on parse error (deferred — v0.1 logs in dev, aborts silently in prod) |
| **M5** | ✅ shipped | `emitSubObjectDrag(e, subData, path, parentId)` helper exported; renderer marks draggable sub-paths with `data-draggable-subobject={path}` + `draggable` + `onDragStart`; drop handler routes own-canvas extractions through the `extract-sub-object` action; default gesture **copy** (parent retains), **Alt-drag** = move (parent loses sub-object via `onNodeUpdate`); sub-objects without `__type` auto-coerce to `custom-json` on extraction; `onSubObjectExtract(parentId, path, gesture)` callback fires after; demo's LLM node has 2 draggable tool chips. | — |
| **M6** | ✅ shipped | Right-click menus on canvas / node / edge via shadcn `<ContextMenu>`. Canvas: "Paste JSON…" (opens dialog with textarea), "Add custom node" (spawns custom-json at right-click point), "Fit view", "Reset zoom". Node: "Copy as JSON" (clipboard), "Duplicate", "Convert to custom-JSON", dynamic "Extract `<path>`" entries from `renderer.extractablePaths` (Q10 keyboard fallback for sub-object extract), "Delete". Edge: "Delete" (no "reverse" — typed ports are directional, flipping an edge would always violate the validator). Mutation items hide in `readOnly` mode. Consumer items append via `menuItems.{canvas, node, edge}`. | — |
| **M7** | 🟡 partial | `--xy-controls-*`, `--xy-edge-stroke`, `--xy-handle-*` overrides in `globals.css` (Controls + edges + handles match design tokens in light + dark); selected-edge stroke pulls `--xy-edge-stroke-selected` (signal-lime ring) | Minimap slot (deferred to v0.2); polish on attribution badge; per-node-type accent palette beyond the 5 built-ins |
| **M8** | ✅ shipped | `React.memo` audit done — every component in `parts/` is memoized (`NodeAdapter`, `NodeShell`, `CustomJsonNode`, `DefaultEdge`, `PortHandle`, `PortsAt`, `FlowCanvasBackground`); every event handler passed to `<ReactFlow>` is `useCallback`; `nodeTypes` / `edgeTypes` defined at module scope; `onlyRenderVisibleElements?: boolean` exposed on `FlowCanvasProps`; **200-node stress fixture** (`makeStressData`) ships in `dummy-data` and is wired into the demo's "Stress" tab | xyflow's documented sweet spot is 1–2k nodes; beyond that is custom-canvas territory. Measure first; flip `onlyRenderVisibleElements` second. |
| **M9** | ✅ shipped | Demo refactored into **four tabs** covering all five archetypes from description §5: **Workflow** (1+2+3 — agent flow + ProjectCard adapter + sub-object extraction), **Read-only viewer** (5), **Custom JSON only** (4 — empty start, paste-friendly), **Stress (200 nodes)** (M8 verification). `usage.tsx` and this guide finalized. | — |

If a feature is documented in this guide it is **shipped**. If it isn't here yet, it isn't ready.

---

## 3. Core concepts

### 3.1 Data-first model

`<FlowCanvas>` operates on JSON, not React components. When the user drags a card or pastes a JSON object onto the canvas, what transfers is *data*. The canvas inspects each node's `data.__type` and routes to a registered renderer; unknown `__type` falls back to the built-in `custom-json` renderer.

```ts
type NodeData = {
  __type: string;                    // schema discriminator
  ports?: Port[];                    // root-level ports (Q22 — transient `selected` strips on export)
  [key: string]: unknown;            // renderer-specific payload
};
```

Source-shape data (e.g. a `post-card-01` JSON) and canvas-instance data are kept separate by convention: ports are inflated *only when JSON enters the canvas* via the drop pipeline; export with `{ withPorts: false }` strips them so source data round-trips clean.

### 3.2 Three keystone registries

| Registry | Maps | Built-ins | Consumer adds via |
|---|---|---|---|
| **Renderer** | `__type` → React renderer | `custom-json` | `renderers` prop |
| **Port-type** | `port.type` (string) → `{ color, label?, icon? }` | `data` / `text` / `image` / `card` / `event` | `portTypes` prop |
| **Edge-type** | `EdgeRecord.type` → React edge renderer | `smoothstep` | `edgeTypes` prop |

All three registries last-wins on collision. Built-in entries cannot be removed in v0.1.0 (consumers can override by re-registering with the same id).

Port-type built-ins map to design-system tokens, not raw colors:

| `port.type` | CSS variable |
|---|---|
| `data`  | `var(--muted-foreground)` |
| `text`  | `var(--chart-5)` (blue) |
| `image` | `var(--chart-2)` (emerald) |
| `card`  | `var(--primary)` (signal-lime accent) |
| `event` | `var(--chart-4)` (cyan) |

(The description doc described these as "blue / orange / lime / rose"; the actual chart palette in `globals.css` is lime → emerald → teal → cyan → blue, so we map to the closest semantic neighbor. Override via `portTypes` prop if you need a different mapping.)

### 3.3 Recursive ports

Ports live *inside* the data, recursively — every level of the tree may carry an optional `ports?: Port[]`. A port-walker flattens them into a node-wide unique-id lookup so edges stay flat (`nodeId:portId`).

```ts
{
  id: "post-1",
  position: { x: 100, y: 100 },
  data: {
    __type: "post-card-01",
    body: "...",
    ports: [{ id: "in", side: "left", dir: "in", type: "card" }],
    media: [
      {
        __type: "media-image",
        url: "/a.jpg",
        ports: [{ id: "m0", side: "right", dir: "out", type: "image" }],
      },
    ],
  },
}
```

The edge `{ source: "post-1:m0", target: "viewer-2:in" }` resolves by walking the tree to find `m0` somewhere inside `post-1`'s data. Renderer authors must keep port ids unique within a node.

### 3.4 Source data vs canvas data

The canvas owns its own state. Ports edited inside the canvas live there; a save/load via `exportRef.export({ withPorts })` toggles whether ports + edges round-trip:

- `exportRef.export({ withPorts: true })` — full canvas snapshot. `selected` flags are stripped (transient UI state per Q22 of the description). Edges included.
- `exportRef.export({ withPorts: false })` — every `ports` field at every depth is removed; all edges are dropped (they reference port ids that won't exist in source); positions + viewport kept. Result: a clean source-shape tree per `__type` schema.

This contract is what lets you persist a canvas as a graph **and** save the underlying source data without graph metadata leaking.

---

## 4. Quick start

Install:

```bash
pnpm dlx shadcn@latest add @ilinxa/flow-canvas-01
```

(Within this monorepo, import from `@/registry/components/data/flow-canvas-01`. Once the component ships through the shadcn registry, consumers will install via `pnpm dlx shadcn@latest add @ilinxa/flow-canvas-01`.)

Minimum viable canvas:

```tsx
"use client";
import { FlowCanvas } from "@/registry/components/data/flow-canvas-01";

export function Example() {
  return (
    <div className="h-140 w-full">
      <FlowCanvas
        defaultData={{
          version: 1,
          nodes: [
            {
              id: "hello",
              position: { x: 200, y: 120 },
              data: {
                __type: "custom-json",
                _label: "Hello, flow",
                message: "Drop or paste any JSON onto the canvas.",
              },
            },
          ],
          edges: [],
        }}
      />
    </div>
  );
}
```

Things to notice:

1. **Parent has explicit width and height.** xyflow measures its parent — `h-140 w-full` is sized; never put height on `<FlowCanvas />` itself.
2. **`'use client'`** at the top of any file rendering `<FlowCanvas />`. xyflow reads `window`, measures DOM, and uses Context with internal state. It cannot SSR. ([xyflow-react-pro skill — Next.js 16 / SSR boundary](../../.claude/skills/xyflow-react-pro/SKILL.md))
3. **CSS** — `<FlowCanvas />` ships with its required xyflow stylesheet imported from inside the component. If your app already imports `@xyflow/react/dist/style.css` at the root, the import deduplicates harmlessly.
4. **`__type: "custom-json"`** is the built-in fallback. Any unknown shape lands on it.
5. **`_label`** (optional) overrides the auto-derived label on the custom-JSON node.

---

## 5. Capabilities — full reference

### 5.1 Props that work today

```ts
type FlowCanvasProps = {
  // State (one of these two; pass both is undefined behavior)
  data?: CanvasData;                   // controlled
  defaultData?: CanvasData;            // uncontrolled — initial only
  onChange?: (next: CanvasData) => void;

  // Registries — built-ins always registered; consumer additions merge on top
  renderers?: NodeRenderer[];          // built-in: 'custom-json'; consumers append more
  portTypes?: PortType[];              // built-ins: data | text | image | card | event
  edgeTypes?: EdgeRenderer[];          // built-in: 'smoothstep'; consumer dispatch v0.2

  // Behavior
  readOnly?: boolean;                  // default false
  panOnDrag?: boolean;                 // default true
  zoomOnScroll?: boolean;              // default true
  selectionMode?: "single" | "multi";  // default "multi" — Shift-click to add

  // Background
  background?: {
    light?: { from: string; to: string; angle?: number };
    dark?:  { from: string; to: string; angle?: number };
    overlay?: "none" | "dots" | "grid" | "cross";
    overlayOpacity?: number;
  };

  // Imperative export
  exportRef?: Ref<{
    export: (opts: { withPorts: boolean }) => CanvasData;
  }>;

  // A11y
  "aria-label"?: string;               // default "Flow canvas"

  className?: string;
};
```

All FlowCanvasProps surfaces are now wired in v0.1.0:

- `onBeforeDrop`, `onBeforeConnect` — interception hooks for drop and connect; both can reject (return `null`/`false`) or rewrite (return a `NodeData` / `EdgeRecord`)
- `onNodeCreate`, `onNodeUpdate`, `onNodeDelete`, `onEdgeCreate`, `onEdgeDelete`, `onSubObjectExtract` — full mutation lifecycle
- `menuItems.{canvas,node,edge}` — right-click menu extensions append after built-ins
- `onlyRenderVisibleElements` (M8) — viewport-culling toggle for very large graphs; default `false`

You can pass them today; they are accepted by the type but have no effect until their milestone ships.

### 5.2 What the user can do

- **Pan** with left-mouse drag on empty canvas
- **Zoom** with mouse wheel, or `+` / `-` keys
- **Fit-to-view** via the controls panel (bottom-left) or the `0` key
- **Select a node** by clicking it; `Shift`-click adds; click-empty clears
- **Select an edge** by clicking on or near it (xyflow uses a 20px interaction width). Selected edges thicken to `stroke-width: 2.5` and pick up the signal-lime ring color.
- **Delete a selection** with `Backspace` OR `Delete` (when `readOnly` is false). Cascades — deleting a node also drops its incident edges.
- **Drag a node** by its body to reposition (when `readOnly` is false and `node.locked` is false)
- **Drag from an output handle to a same-type input handle** to create a new edge — the in-flight line shows valid/invalid feedback; releasing on an invalid target rejects silently. The new edge picks up the source port's color as its stroke.
- **Multi-edge fan-out** — a single output port with `multi: true` can connect to multiple downstream targets (the LLM node's output in the demo fans into both Display and Project). Ports without `multi` reject second-edge attempts.
- **Drop a JSON file** from the OS desktop onto the canvas, or drag JSON from another draggable on the page — a node spawns at the drop point. Schema-detected via `__type`; unknown shapes render as `custom-json`.
- **Paste JSON** with `Cmd/Ctrl-V` while the canvas has focus — same dispatch as drop; the new node spawns at the viewport center. Editable inputs / textareas don't lose their normal paste behavior.
- **Default ports inflate at the drop boundary** — if the dropped JSON has a recognized `__type` and the renderer declares `defaultPorts`, the canvas inflates them into the canvas-instance copy of the data. `ports: []` (deliberate empty) is respected.
- **Plug `onBeforeDrop`** to transform / validate / reject incoming JSON; **plug `onBeforeConnect`** to add semantic validation (e.g. cyclic-dep rejection) on top of the built-in typed validation.
- **Drag a sub-object out of a node** — renderers mark draggable sub-paths with `data-draggable-subobject={path}` + `draggable` + an `onDragStart` that calls `emitSubObjectDrag`. Drop on empty canvas → spawns a new node from the sub-JSON. Default copy (parent retains); **Alt-drag** = move (parent loses the sub-object via `onNodeUpdate`). The demo's LLM node has 2 draggable tool chips you can extract.
- **Right-click anywhere** for the context menu — the canvas, a node, or an edge each show their own menu. Mutation items hide in `readOnly`. Consumer items append via the `menuItems.{canvas, node, edge}` props. The node menu's "Extract `<path>`" entries are the keyboard fallback for the drag-out gesture (Q10).
- **Paste arbitrary JSON via dialog** — right-click empty canvas → "Paste JSON…" → opens a textarea modal. On submit, parses + dispatches through the same drop pipeline.

### 5.3 What the user CANNOT do in v0.1 (deferred to v0.2)

- **Register custom edge renderers via `edgeTypes` and have them dispatched** — the registry is consumer-extendable in Context, but xyflow only sees a single `'ilinxa-edge'` adapter that always falls back to `defaultEdgeRenderer`. Custom edge dispatch lands in v0.2.
- **Toast notifications on parse error** — today errors `console.warn` in dev and abort silently in prod. Consumers wrap their own toast layer (e.g. sonner) if needed.
- **DB-ref nodes** (`{ ref: 'post:abc123' }` placeholders that fetch on demand) — its own loader / cache subsystem; v0.2.
- **Marquee / lasso selection**, **undo / redo**, **groups / frames**, **execution-state animation** — all v0.2+ candidates per description §2.
- **Per-handle `isValidConnection` overrides** — today only the global validator on `<ReactFlow>` runs. Per-handle composition lands in v0.2 if a consumer surfaces the need.

### 5.4 Read-only mode

```tsx
<FlowCanvas data={savedGraph} readOnly />
```

In read-only mode:
- `nodesDraggable={false}` — no node movement
- `nodesConnectable={false}` — no edge dragging from handles
- `elementsSelectable={false}` — no selection
- `Backspace` / `Delete` — no-op

What still works:
- Pan, zoom, fit-view
- Hover state, focus rings
- Right-click menu "view-only" entries (M6)

### 5.5 Per-node lock

Set `node.locked: true` on the node object (NOT on the renderer):

```tsx
{
  id: "pinned",
  position: { x: 0, y: 0 },
  data: { __type: "custom-json", _label: "Pinned" },
  locked: true,
}
```

A locked node cannot be dragged. Other operations (edge connect, delete via menu, sub-object extract — when those land) remain available unless `readOnly` is also set. The `<NodeShell>` shows a small lock chip in the top-right corner.

### 5.6 Background

Configure via the `background` prop. Defaults match design tokens:

```ts
{
  light: { from: "var(--background)", to: "var(--muted)", angle: 145 },
  dark:  { from: "var(--background)", to: "var(--card)",  angle: 145 },
  overlay: "dots",
  overlayOpacity: 0.4,
}
```

The gradient is a CSS-only element (no JS); xyflow's `<Background>` sits on top providing the dot/grid/cross overlay. Light/dark switch via xyflow's `colorMode` (defaults to inheriting the `.dark` class from a parent — works with the repo's class-based dark mode).

Override:

```tsx
<FlowCanvas
  background={{
    light: { from: "oklch(0.98 0.005 250)", to: "oklch(0.92 0.01 250)" },
    overlay: "grid",
    overlayOpacity: 0.25,
  }}
/>
```

### 5.7 Export

```tsx
import { useRef } from "react";
import { FlowCanvas, type FlowCanvasExportHandle } from "@/registry/components/data/flow-canvas-01";

function Example() {
  const ref = useRef<FlowCanvasExportHandle>(null);
  return (
    <>
      <FlowCanvas defaultData={initial} exportRef={ref} />
      <button onClick={() => console.log(ref.current?.export({ withPorts: true }))}>
        Export with ports (full canvas snapshot)
      </button>
      <button onClick={() => console.log(ref.current?.export({ withPorts: false }))}>
        Export source data (ports stripped, edges dropped)
      </button>
    </>
  );
}
```

The exported `CanvasData` is JSON-serializable. Round-trip:

```ts
const dump = ref.current!.export({ withPorts: true });
localStorage.setItem("my-flow", JSON.stringify(dump));
// ...later...
const restored = JSON.parse(localStorage.getItem("my-flow")!);
<FlowCanvas data={restored} onChange={save} />
```

### 5.8 Controlled vs uncontrolled

| Mode | When | Pattern |
|---|---|---|
| **Uncontrolled** (prototypes) | Demos, internal tools, no persistence | `defaultData={X}` once; `onChange` optional |
| **Controlled** (production) | Persistence, undo/redo, multi-window, network sync | Own the `CanvasData` in your store; `data={...}` + `onChange={...}` |

Don't mix `data` and `defaultData` — only the first one read takes effect.

In controlled mode, replacing the `data` prop with a new reference triggers a state replacement (an internal effect detects the change). Inflation does NOT re-run on prop replacement — inflation only fires at the drop boundary (Q23 + plan §3.5).

---

## 6. Stack-specific notes — `ilinxa-ui-pro`

### 6.1 Next.js 16 / App Router

Every file in this folder begins with `'use client'`. xyflow cannot SSR. Two correct integration patterns:

**(a) Component-level boundary (recommended):**

```tsx
// app/canvas/page.tsx — server component
import { FlowCanvas } from "@/registry/components/data/flow-canvas-01";
export default function Page() {
  return (
    <div className="h-screen w-screen">
      <FlowCanvas defaultData={...} />
    </div>
  );
}
```

`<FlowCanvas>` is itself a client component (declares `'use client'`), so importing it in a server page works — Next.js inserts the boundary automatically.

**(b) `next/dynamic` with `ssr: false`** when keeping flow-canvas off the SSR HTML matters:

```tsx
import dynamic from "next/dynamic";
const FlowCanvas = dynamic(
  () => import("@/registry/components/data/flow-canvas-01").then((m) => m.FlowCanvas),
  { ssr: false },
);
```

Use (a) by default. (b) only if your page is mostly server-rendered and you want to keep the xyflow client bundle out of the initial HTML.

### 6.2 Tailwind v4

The xyflow stylesheet is plain CSS (no `@layer`). Tailwind v4 cascade order is preserved. Our component imports the xyflow CSS at the top of `flow-canvas-01.tsx`; bundlers deduplicate, so importing it again at the app root is harmless.

For pure-Tailwind theming, swap the import to `@xyflow/react/dist/base.css` (structural rules only — no visual defaults) and override the design via the `--xy-*` CSS variables on `.react-flow`. Variable list and override examples in [the xyflow-react-pro skill](../../.claude/skills/xyflow-react-pro/SKILL.md#theming).

The repo has `@source not "../../docs"` in `globals.css` — keeps procomp markdown's literal class snippets out of Tailwind's class-detection sweep. Don't remove it during refactors. (See the auto-memory entry "Tailwind v4 scans docs/ — @source not directive".)

### 6.3 Design tokens (signal-lime, OKLCH, no pure white)

The component holds the line on tokens defined in `globals.css`:

- **Accent on active port handles**: signal-lime via `var(--primary)` — paired with near-black `--primary-foreground` (lime is too bright for white text).
- **Light backgrounds**: cool off-white via `var(--background)` and `var(--muted)`. Never pure white as the canvas surface.
- **Dark backgrounds**: graphite-cool via `var(--background)` and `var(--card)`. Never warm-grey.
- **Custom port-type colors**: prefer mapping to `--chart-1` … `--chart-5` and `--primary`. Raw hex / oklch literals are reserved for *consumer* code, not framework files.

### 6.4 Performance ceiling

xyflow's documented sweet spot is ~1–2k nodes. The plan caps `flow-canvas-01` v0.1.0 success criteria at **200 nodes** at 60fps on a mid-tier laptop. Beyond ~500 nodes, expect to:

- Set `onlyRenderVisibleElements` (M8 surface)
- Ensure every consumer renderer is `React.memo`'d
- Avoid `useNodes()` in hot components (use narrow `useStore(selector)` slices instead)
- Hide off-screen nodes via `node.hidden = true` rather than splicing them out

For thousand-plus-node graphs, consider sub-flow grouping or a custom canvas instead of `flow-canvas-01`.

---

## 7. Footguns

(Updates as milestones land. The full list mirrors the [xyflow-react-pro skill's pitfalls section](../../.claude/skills/xyflow-react-pro/SKILL.md#pitfalls).)

### 7.1 Parent must have explicit dimensions

Wrong:

```tsx
<FlowCanvas className="h-screen w-screen" />
```

Right:

```tsx
<div className="h-screen w-screen">
  <FlowCanvas />
</div>
```

xyflow measures its parent. Putting height/width on `<FlowCanvas>` itself does not work.

### 7.2 `nodeTypes` / `edgeTypes` recreation (handled internally)

We register a single xyflow node type (`"ilinxa-node"`) and edge type (`"ilinxa-edge"`) at module scope. You do NOT pass these maps; you pass `renderers` / `edgeTypes` (our registry shape) and the canvas dispatches internally. This is the locked architectural call (plan §3.2) that avoids xyflow's most common LLM-emitted bug.

### 7.3 Direct mutation of `nodes` / `edges`

Don't. Always spread:

```tsx
// Wrong
node.data.body = "new"; setNodes([...nodes]);

// Right
setNodes(nodes.map((n) =>
  n.id === id ? { ...n, data: { ...n.data, body: "new" } } : n
));
```

xyflow's change detection relies on referential identity.

### 7.4 Multiple handles of the same `type` need unique `id`s

Every `<Handle>` of the same `type` (e.g. multiple `target` handles on one node) **must** have a unique `id`. Without it, connections target the wrong handle. Our typed-port id convention (`out:image`, `in:text`, `m0`, `m1`) covers this naturally.

### 7.5 `data-draggable-subobject` paths must match `extractablePaths`

Sub-object extract relies on two agreeing places: the renderer marks draggable sub-paths via `data-draggable-subobject={path}` on the DOM, and declares the same paths via `extractablePaths` so the keyboard menu fallback ("Extract `<path>`") can list them. Drift between the two = invisible bugs.

---

## 8. Migration

Until v0.1 stabilizes, every milestone may reshape the API. Migrations from M(n) → M(n+1) are documented per release in `STATUS.md` "Recent decisions".

For consumers porting from another canvas library:

| From | Notes |
|---|---|
| **bare `@xyflow/react`** | Move your `nodes` / `edges` arrays into our `CanvasData` shape (add `version: 1`, swap `node.type` for `data.__type`). Edge type strings round-trip through `EdgeRecord.type`; in v0.1 only the built-in `'smoothstep'` is dispatched (consumer-registered edge renderers ship in v0.2). |
| **`reactflow` (v11)** | Run through the v11→v12 rename table in the [xyflow-react-pro skill](../../.claude/skills/xyflow-react-pro/SKILL.md#v11--v12-renames-llms-most-often-mis-emit) before migrating to ours. |
| **`reaflow`** | No automatic migration. Re-author each node renderer against our `NodeRenderer` shape. |

---

## 9. FAQ

**Q: Can I render any React component as a node?**
A: Yes — register it as a `NodeRenderer`:
```ts
const myRenderer: NodeRenderer = {
  type: "my-node",
  label: "My Node",
  render: (data) => <MyCard {...data} />,
};
<FlowCanvas renderers={[myRenderer]} ... />
```
Use `<PortsAt position="left|right|top|bottom" ports={data.ports} />` for the easy stacked-handle layout. The renderer must have `position: relative` on its outer div so handles anchor correctly. `<NodeShell>` (selection ring + lock chip + focus) wraps your output automatically — you don't render it yourself.

**Q: Can I override the built-in `custom-json` renderer?**
A: Yes — register a `NodeRenderer` with `type: "custom-json"`. Last-wins; a `console.warn` fires in dev.

**Q: How do I make a node read-only without making the whole canvas read-only?**
A: Set `node.locked: true` (prevents drag) — and rely on the renderer not exposing edit affordances. There's no per-node "no-edit" flag; consumer renderers own that.

**Q: Why doesn't `multi: true` on a port let me connect a third edge?**
A: It does — `multi: true` allows fan-out / fan-in. If a third connection is rejected, the **other** end likely has `multi: false` and is already wired. Both endpoints must allow another edge.

**Q: My edge has `type: "smoothstep"` but renders as the default bezier. Why?**
A: In v0.1, only the built-in `defaultEdgeRenderer` is dispatched. The `edgeTypes` registry accepts consumer entries (and merges them into Context) but xyflow only sees the single `'ilinxa-edge'` adapter today. Custom edge dispatch lands in v0.2. Stroke color does still pull from the source port's type — that part works in v0.1.

**Q: Does the canvas re-inflate ports if I reload from saved JSON?**
A: No. Presence of the `ports` field — even an empty array `[]` — is the deliberate-state signal. The inflation pipeline only runs at the drop boundary (Q23 + plan §3.5).

**Q: Can I run two `<FlowCanvas>` instances on the same page?**
A: Yes — each instance has its own `ReactFlowProvider`. Drag-from-A-to-B is **not** supported (cross-canvas drag is out of scope per Q-decision in the description doc).

---

## 10. Where things live

| Concern | File |
|---|---|
| Public API surface | [`types.ts`](../../../src/registry/components/data/flow-canvas-01/types.ts) |
| Root component | [`flow-canvas-01.tsx`](../../../src/registry/components/data/flow-canvas-01/flow-canvas-01.tsx) |
| Built-in renderer | [`parts/custom-json-node.tsx`](../../../src/registry/components/data/flow-canvas-01/parts/custom-json-node.tsx) |
| Single xyflow node type | [`parts/node-adapter.tsx`](../../../src/registry/components/data/flow-canvas-01/parts/node-adapter.tsx) |
| Selection / lock / focus | [`parts/node-shell.tsx`](../../../src/registry/components/data/flow-canvas-01/parts/node-shell.tsx) |
| Gradient + overlay | [`parts/background.tsx`](../../../src/registry/components/data/flow-canvas-01/parts/background.tsx) |
| State machine (controlled / uncontrolled) | [`hooks/use-canvas-data.ts`](../../../src/registry/components/data/flow-canvas-01/hooks/use-canvas-data.ts) |
| Imperative export | [`hooks/use-export.ts`](../../../src/registry/components/data/flow-canvas-01/hooks/use-export.ts) |
| Registries (renderer / port-type / edge-type) | [`registries/`](../../../src/registry/components/data/flow-canvas-01/registries/) |

---

## 11. Where to file issues

- For component issues: `STATUS.md` "Recent decisions" log + a discussion in the PR thread for the milestone.
- For xyflow-substrate issues (the underlying library): [github.com/xyflow/xyflow/issues](https://github.com/xyflow/xyflow/issues). Our component does not patch xyflow internals.

---

> **Maintenance note:** v0.1.0-alpha covers all M1–M9 features. Items still flagged "v0.2" are deliberate exclusions (custom edge dispatch, minimap, undo/redo, marquee, DB-ref nodes, execution-state animation, cross-canvas drag — see description §2 out-of-scope). When v0.2 lands, replace those flags with the actual behavior. **If the implementation diverges from this guide, the guide is wrong — fix it loudly, not silently.**
