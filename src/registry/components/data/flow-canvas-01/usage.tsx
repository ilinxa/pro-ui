export default function FlowCanvasUsage() {
  return (
    <div className="max-w-none text-sm leading-relaxed text-foreground">
      <h3 className="mb-2 mt-0 text-base font-semibold">When to use</h3>
      <p className="text-muted-foreground">
        <code>FlowCanvas</code> is a node-and-edge canvas built on{" "}
        <code>@xyflow/react</code>. Reach for it when you need a flow editor,
        workflow canvas, AI agent graph, schema designer, or any port-and-edge
        UI where nodes are <em>data-first</em> — JSON objects discriminated by
        a <code>__type</code> field that keys into a renderer registry.
      </p>

      <h3 className="mb-2 mt-6 text-base font-semibold">When NOT to use</h3>
      <ul className="ml-5 list-disc space-y-1 text-muted-foreground">
        <li>
          Force-directed graph layouts (use <code>force-graph-01</code>).
        </li>
        <li>
          Hierarchical org / tree visualizations — flow-canvas is free-form;
          tree layouts want a tree component.
        </li>
        <li>
          Pure timelines, Gantt charts, dense data tables, kanban boards —
          each has a dedicated component in the registry.
        </li>
      </ul>

      <h3 className="mb-2 mt-6 text-base font-semibold">Three keystone registries</h3>
      <p className="text-muted-foreground">
        Every &quot;what does this look like&quot; decision flows through one
        of three consumer-extendable registries — built-ins ship, consumers
        append:
      </p>
      <ul className="ml-5 list-disc space-y-1 text-muted-foreground">
        <li>
          <code>renderers</code> — <code>__type → React renderer</code>.
          Built-in: <code>customJsonRenderer</code> (the fallback for unknown
          shapes).
        </li>
        <li>
          <code>portTypes</code> — <code>type id → color/icon/label</code>.
          Built-ins: <code>data</code>, <code>text</code>, <code>image</code>,
          <code>card</code>, <code>event</code> (mapped to design tokens).
        </li>
        <li>
          <code>edgeTypes</code> — <code>type id → React edge renderer</code>.
          Built-in: <code>defaultEdgeRenderer</code> (smoothstep, stroke pulled
          from source-port type color). Consumer-registered edge dispatch ships
          in v0.2.
        </li>
      </ul>

      <h3 className="mb-2 mt-6 text-base font-semibold">Basic example</h3>
      <pre className="overflow-x-auto rounded-md border border-border bg-muted p-4 font-mono text-xs">
        <code>{`import { FlowCanvas, type NodeRenderer } from "@/components/flow-canvas-01"

// Register a renderer for your domain type. Define at module scope (or
// useMemo) — recreating the array on every render thrashes xyflow's
// nodeTypes registry.
const promptRenderer: NodeRenderer = {
  type: "prompt",
  label: "Prompt",
  defaultPorts: () => [
    { id: "out", side: "right", dir: "out", type: "text" },
  ],
  render: (data) => <PromptCard data={data} />,
}

const RENDERERS = [promptRenderer]

export function MyEditor() {
  return (
    <div className="h-screen w-full"> {/* parent MUST have explicit dims */}
      <FlowCanvas
        renderers={RENDERERS}
        defaultData={{ version: 1, nodes: [], edges: [] }}
        onChange={(next) => persist(next)}
      />
    </div>
  )
}`}</code>
      </pre>

      <h3 className="mb-2 mt-6 text-base font-semibold">Save / restore via{" "}
        <code>exportRef</code>
      </h3>
      <pre className="overflow-x-auto rounded-md border border-border bg-muted p-4 font-mono text-xs">
        <code>{`import { useRef } from "react"
import { type FlowCanvasExportHandle } from "@/components/flow-canvas-01"

const exportRef = useRef<FlowCanvasExportHandle>(null)

// Round-trip with ports + edges (canvas-instance state):
const portable = exportRef.current?.export({ withPorts: true })

// Strip ports + edges for source-shape persistence:
const sourceShape = exportRef.current?.export({ withPorts: false })`}</code>
      </pre>

      <h3 className="mb-2 mt-6 text-base font-semibold">Capabilities — v0.1.0</h3>
      <ul className="ml-5 list-disc space-y-1 text-muted-foreground">
        <li>
          <strong>Pan / zoom / fit-view / select / delete</strong> — pointer +
          keyboard. <code>Backspace</code> AND <code>Delete</code> remove
          selected nodes/edges (cascades).
        </li>
        <li>
          <strong>Typed connections</strong> — drag-to-connect; mismatched-type
          / wrong-direction / <code>multi: false</code>-already-connected pairs
          rejected with the in-flight rejection indicator. Plug{" "}
          <code>onBeforeConnect</code> for semantic validation on top.
        </li>
        <li>
          <strong>Drop / paste pipeline</strong> — drag any <code>.json</code>{" "}
          file from desktop, drag JSON from another draggable, or paste with
          <code> Cmd/Ctrl-V</code> while the canvas is focused. Three MIMEs
          accepted: <code>application/json</code>,{" "}
          <code>application/reactflow</code>,{" "}
          <code>text/plain</code>. <code>onBeforeDrop</code> intercepts.
          Default ports inflate at the drop boundary; <code>ports: []</code>{" "}
          (deliberate empty) is respected.
        </li>
        <li>
          <strong>Sub-object drag-extract</strong> — renderers mark draggable
          sub-paths with <code>data-draggable-subobject={"{path}"}</code> +{" "}
          <code>draggable</code> + an <code>onDragStart</code> calling{" "}
          <code>emitSubObjectDrag</code>. Default <strong>copy</strong>, Alt-drag
          for <strong>move</strong>. Sub-objects without <code>__type</code>{" "}
          auto-coerce to <code>custom-json</code>.
        </li>
        <li>
          <strong>Right-click menus</strong> — three contexts (canvas, node,
          edge). Built-ins: Paste JSON…, Add custom node, Fit view, Reset zoom,
          Copy as JSON, Duplicate, Convert to custom-JSON, Extract{" "}
          <code>{"<path>"}</code> (keyboard fallback for sub-object extract),
          Delete. Mutation items hide in <code>readOnly</code>; consumer items
          append via <code>menuItems.{"{canvas, node, edge}"}</code>.
        </li>
        <li>
          <strong>Per-node lock</strong> — <code>node.locked: true</code> pins
          position; other ops allowed unless <code>readOnly</code>.
        </li>
        <li>
          <strong>Read-only mode</strong> — <code>readOnly</code> kills drag /
          connect / mutation menu items; pan / zoom / select / view-only menus
          stay.
        </li>
        <li>
          <strong>Performance</strong> — every component memoized;{" "}
          <code>onlyRenderVisibleElements</code> toggle for viewport-culling on
          200+ nodes. Stress demo ships with <code>makeStressData(200)</code>.
        </li>
        <li>
          <strong>Theming</strong> — <code>--xy-*</code> CSS variables in{" "}
          <code>globals.css</code> follow design tokens (signal-lime accent on
          ring + selected edges; OKLCH palette for handles). Light + dark via
          class-based toggle on a parent.
        </li>
      </ul>

      <h3 className="mb-2 mt-6 text-base font-semibold">Critical rules</h3>
      <ul className="ml-5 list-disc space-y-1 text-muted-foreground">
        <li>
          <strong>Parent must have explicit width AND height.</strong> Putting{" "}
          <code>h-screen</code> on the canvas itself doesn&apos;t work — xyflow
          measures its parent.
        </li>
        <li>
          <strong>
            Define <code>renderers</code> / <code>portTypes</code> /
            <code> edgeTypes</code> at module scope or via{" "}
            <code>useMemo</code>.
          </strong>{" "}
          Recreating the arrays each render triggers teardown + remount of
          every node — flicker, lost focus, sometimes infinite loops. (We
          mitigate internally by routing all nodes through a single{" "}
          <code>&quot;ilinxa-node&quot;</code> xyflow type, but the rule still
          matters for the props you pass us.)
        </li>
        <li>
          <strong>Port IDs must be unique within a node</strong> — across the
          entire <code>data</code> tree, not just the root. Edges reference
          flat <code>nodeId:portId</code>; the tree-walker resolves location.
        </li>
        <li>
          <strong>Never mutate <code>nodes</code> / <code>edges</code> arrays in place.</strong>{" "}
          Always spread:{" "}
          <code>{"{ ...node, data: { ...node.data, x } }"}</code>. Mutation
          breaks change detection.
        </li>
        <li>
          <strong>Single source of truth for state.</strong> Pick controlled
          (<code>data</code> + <code>onChange</code>) <em>or</em> uncontrolled
          (<code>defaultData</code>) per <code>&lt;FlowCanvas&gt;</code>{" "}
          instance. Don&apos;t flip mid-mount.
        </li>
      </ul>

      <h3 className="mb-2 mt-6 text-base font-semibold">Deferred to v0.2</h3>
      <ul className="ml-5 list-disc space-y-1 text-muted-foreground">
        <li>Custom edge renderers dispatched via <code>edgeTypes</code></li>
        <li>Per-handle <code>isValidConnection</code> overrides</li>
        <li>Toast notifications on parse error (today: <code>console.warn</code> + silent abort)</li>
        <li>Undo / redo, marquee selection, groups / frames, minimap, execution-state animation</li>
        <li>DB-ref nodes (<code>{"{ ref: 'post:abc123' }"}</code> placeholders that fetch on demand)</li>
        <li>Cross-canvas drag</li>
      </ul>

      <p className="mt-6 text-xs text-muted-foreground">
        Full reference: see <code>docs/procomps/flow-canvas-01-procomp/flow-canvas-01-procomp-guide.md</code>.
        Architecture decisions Q1–Q24 live in the description doc; the
        implementation contract lives in the plan doc.
      </p>
    </div>
  );
}
