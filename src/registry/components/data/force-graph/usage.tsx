export default function ForceGraphUsage() {
  return (
    <div className="max-w-none text-sm leading-relaxed text-foreground">
      <h3 className="mb-2 mt-0 text-base font-semibold">When to use</h3>
      <p className="text-muted-foreground">
        Reach for <code>ForceGraph</code> when you need to render a knowledge
        graph as a force-directed canvas — panning, zooming, and a running
        layout out of the box. v0.1 is read-only; selection / hover / drag /
        editing land in v0.2 and v0.3.
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

      <h3 className="mb-2 mt-6 text-base font-semibold">Imperative handle</h3>
      <pre className="overflow-x-auto rounded-md border border-border bg-muted p-4 font-mono text-xs">
        <code>{`const ref = useRef<ForceGraphHandle>(null)

ref.current?.setLayoutEnabled(false)
ref.current?.pinAllPositions()
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
        <code>src/app/globals.css</code> per decision #37 — Sigma resolves
        them at mount time. Pass <code>theme=&quot;custom&quot;</code> +{" "}
        <code>customColors</code> to override. Missing keys fall back to
        dark-theme defaults regardless of the document theme (decision #8).
      </p>

      <h3 className="mb-2 mt-6 text-base font-semibold">v0.1 limitations</h3>
      <ul className="ml-5 list-disc space-y-1 text-muted-foreground">
        <li>
          Read-only — no selection, hover, drag, click handlers, or
          editing affordances. Activate in v0.2 (selection + hover +
          drag) and v0.3 (full CRUD).
        </li>
        <li>
          Theme flip mid-session doesn&apos;t recolor existing edges. Re-
          import the snapshot to refresh; v0.6 perf hardening adds
          walk-and-recompute.
        </li>
        <li>
          Group hulls + group-involving edge rendering land in v0.4.
        </li>
        <li>
          Bidirectional edges render with a single arrow in v0.1; dual-
          arrow visual deferred to v0.6 multi-edge work.
        </li>
        <li>
          Lucide icon atlas + doc-glyph + system-origin glyph land in
          v0.5 with the custom <code>IconNodeProgram</code>.
        </li>
      </ul>

      <h3 className="mb-2 mt-6 text-base font-semibold">Composition</h3>
      <p className="text-muted-foreground">
        Per decision #35, <code>ForceGraph</code> does NOT import any Tier
        1 pro-component (<code>properties-form</code>,{" "}
        <code>detail-panel</code>, etc.) at the registry level. Composition
        with side panels happens at host or Tier 3 level. Read snapshots
        with <code>useGraphSelector</code>; mutate via{" "}
        <code>useGraphActions</code>. v0.3 wires per-component permission
        resolution + CRUD actions.
      </p>
    </div>
  );
}
