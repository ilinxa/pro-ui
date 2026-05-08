export default function ForceGraphUsage() {
  return (
    <div className="max-w-none text-sm leading-relaxed text-foreground">
      <h3 className="mb-2 mt-0 text-base font-semibold">When to use</h3>
      <p className="text-muted-foreground">
        Reach for <code>ForceGraph</code> when you need to render a knowledge
        graph as a force-directed canvas — panning, zooming, a running
        layout, click-to-select, hover focus, and drag-to-pin out of the
        box. Editing (full CRUD) lands in v0.3; groups + filters in v0.4;
        doc-node visuals + wikilink reconciliation in v0.5.
      </p>

      <h3 className="mb-2 mt-6 text-base font-semibold">Static snapshot</h3>
      <pre className="overflow-x-auto rounded-md border border-border bg-muted p-4 font-mono text-xs">
        <code>{`import { ForceGraph } from "@/registry/components/data/force-graph"
import { SMALL_GRAPH } from "./your-fixture"

export function Example() {
  return <div className="h-125"><ForceGraph data={SMALL_GRAPH} /></div>
}`}</code>
      </pre>
      <p className="text-muted-foreground">
        Pass a fully-validated <code>GraphSnapshot</code> as the{" "}
        <code>data</code> prop. The component validates on import and
        rejects malformed data via <code>onError</code>; graceful-
        degradation cases (unknown system schemaTypes whose id matches a
        node&apos;s <code>nodeTypeId</code>) auto-register a neutral default
        and surface a warning.
      </p>

      <h3 className="mb-2 mt-6 text-base font-semibold">Live source</h3>
      <pre className="overflow-x-auto rounded-md border border-border bg-muted p-4 font-mono text-xs">
        <code>{`const source: GraphSource = {
  async loadInitial() { return await api.fetchGraphSnapshot() },
  subscribe(cb) { return ws.onDelta(cb) },          // optional
  // applyMutation typed but not exercised until v0.3
}

<ForceGraph data={source} onError={(e) => toast.error(e.message)} />`}</code>
      </pre>
      <p className="text-muted-foreground">
        Live-source deltas apply atomically per delta and bump{" "}
        <code>graphVersion</code>; UI state (selection, hover, undo) is
        preserved per decision #22 — only deletion-induced cascade clearing
        will fire (foundational; activates in v0.2).
      </p>

      <h3 className="mb-2 mt-6 text-base font-semibold">
        Soft / default edges (decision #38)
      </h3>
      <p className="text-muted-foreground">
        Per-edge <code>color</code> + <code>size</code> is computed at
        edge-add time:
      </p>
      <ul className="ml-5 list-disc space-y-1 text-muted-foreground">
        <li>
          At least one endpoint is a <code>kind: &quot;doc&quot;</code> node
          → soft (<code>--muted-foreground</code>, size 1)
        </li>
        <li>
          No doc endpoint, but the edge&apos;s <code>EdgeType.softVisual</code>{" "}
          is true → soft
        </li>
        <li>
          Otherwise → default (<code>--foreground</code>, size 1.5)
        </li>
      </ul>
      <p className="text-muted-foreground">
        Group endpoints don&apos;t transit doc-ness: a group↔group or
        group↔normal edge follows the per-edgetype flag regardless of any
        doc node elsewhere in the graph.
      </p>

      <h3 className="mb-2 mt-6 text-base font-semibold">
        Compound API (v0.2)
      </h3>
      <p className="text-muted-foreground">
        For sibling-hook composition — Tier 1 panels reading the same
        graph state as the canvas — render the Provider yourself and
        place the Canvas alongside your panels:
      </p>
      <pre className="overflow-x-auto rounded-md border border-border bg-muted p-4 font-mono text-xs">
        <code>{`<ForceGraph.Provider data={graph} onSelectionChange={setSel}>
  <FilterStackPanel />              // calls useGraphSelector
  <ForceGraph.Canvas />
  <DetailPanelForCurrentSelection />// calls useGraphSelector + useGraphActions
</ForceGraph.Provider>`}</code>
      </pre>
      <p className="text-muted-foreground">
        <code>&lt;ForceGraph data={"{...}"} /&gt;</code> still works — it
        renders <code>&lt;Provider&gt;&lt;Canvas/&gt;&lt;/Provider&gt;</code>{" "}
        internally. Per <a href="#" className="underline">decision #35</a>,
        Tier 1 components are NOT imported by force-graph itself; the host
        composes them as Provider children.
      </p>

      <h3 className="mb-2 mt-6 text-base font-semibold">
        Selection / hover / drag (v0.2)
      </h3>
      <pre className="overflow-x-auto rounded-md border border-border bg-muted p-4 font-mono text-xs">
        <code>{`const sel = useGraphSelector((s) => s.ui.selection)
const actions = useGraphActions()

actions.select({ kind: "node", id })
actions.clearSelection()
actions.pinNode(id, true)            // recorded in history
actions.undo() / actions.redo()`}</code>
      </pre>
      <ul className="ml-5 list-disc space-y-1 text-muted-foreground">
        <li>
          Click a node or edge to select; click empty stage to clear.
          Selection changes don&apos;t bump <code>graphVersion</code> per
          spec §5.2.
        </li>
        <li>
          Hover a node → 1-hop neighbors stay full-color, others dim to
          ~35% via Sigma reducers. 100ms lead-in delay; immediate exit.
        </li>
        <li>
          Drag a node → live position update + auto-pin on drop. The
          drag fires ONE history entry coalescing position + (optional)
          new-pin into a single undo step.
        </li>
        <li>
          Cmd/Ctrl+Z undoes; Cmd/Ctrl+Shift+Z (or Cmd/Ctrl+Y) redoes;
          Esc cancels linking-mode. Canvas-focus only — click inside
          first; panel inputs handle their own undo.
        </li>
      </ul>

      <h3 className="mb-2 mt-6 text-base font-semibold">
        Linking mode (v0.2)
      </h3>
      <p className="text-muted-foreground">
        <code>actions.enterLinkingMode({"{ kind: \"node\", id }"})</code>{" "}
        flips a flag in the UI slice, swaps the canvas cursor to
        crosshair, and overlays a dashed selection-ring on the source
        node. Subsequent canvas clicks set the would-be edge target
        instead of changing selection. v0.2 only ships the
        infrastructure (state + click precedence + visual cue); the
        picker chrome (entity-picker for valid targets, edge-type
        dropdown, direction toggle) lives at Tier 3 per decision #35.
        v0.3 wires the actual <code>addEdge</code> dispatch.
      </p>

      <h3 className="mb-2 mt-6 text-base font-semibold">Imperative handle</h3>
      <pre className="overflow-x-auto rounded-md border border-border bg-muted p-4 font-mono text-xs">
        <code>{`const ref = useRef<ForceGraphHandle>(null)

ref.current?.setLayoutEnabled(false)
ref.current?.pinAllPositions()
ref.current?.focusNode(id, { animate: true, zoom: 0.6 })  // v0.2
ref.current?.select({ kind: "edge", id })                 // v0.2
const snap = ref.current?.getSnapshot()
const sigma = ref.current?.getSigmaInstance()  // substrate escape hatch`}</code>
      </pre>
      <p className="text-muted-foreground">
        The substrate-leak escape hatches (
        <code>getSigmaInstance</code> + <code>getGraphologyInstance</code>)
        return the live underlying instances — useful for advanced
        integrations (custom event handlers, foreign cameras), but a major-
        version bump if either substrate ever swaps.
      </p>

      <h3 className="mb-2 mt-6 text-base font-semibold">Theming</h3>
      <p className="text-muted-foreground">
        Colors come from CSS variables in{" "}
        <code>src/app/globals.css</code> per decision #37 — the graph
        captures both palettes (with and without <code>.dark</code>) at
        mount time so its visual identity stays decoupled from the host
        document&apos;s theme. The <code>theme</code> prop picks which
        palette to apply (default <code>&quot;dark&quot;</code>); pass{" "}
        <code>theme=&quot;custom&quot;</code> +{" "}
        <code>customColors</code> to override. Missing keys fall back to
        dark-theme defaults regardless of the requested theme (decision
        #8). OKLCH / lab values returned by{" "}
        <code>getComputedStyle</code> are normalized to{" "}
        <code>rgb()</code> via a 1×1 canvas so Sigma&apos;s WebGL parser
        can render them.
      </p>

      <h3 className="mb-2 mt-6 text-base font-semibold">
        Current limitations
      </h3>
      <ul className="ml-5 list-disc space-y-1 text-muted-foreground">
        <li>
          Editing affordances (full CRUD) land in v0.3; v0.2 only
          records position + pin changes.
        </li>
        <li>
          Group hulls + group-involving edge rendering land in v0.4.
        </li>
        <li>
          Bidirectional edges render with a single arrow; dual-arrow
          visual deferred to v0.6 multi-edge work.
        </li>
        <li>
          Lucide icon atlas + doc-glyph + system-origin glyph land in
          v0.5 with the custom <code>IconNodeProgram</code>.
        </li>
      </ul>
    </div>
  );
}
