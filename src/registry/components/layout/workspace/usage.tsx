export default function WorkspaceUsage() {
  return (
    <div className="max-w-none text-sm leading-relaxed text-foreground">
      <h3 className="mb-2 mt-0 text-base font-semibold">When to use</h3>
      <p className="text-muted-foreground">
        Reach for <code>Workspace</code> when one fixed layout never fits every
        user&apos;s workflow — dashboards with diverse widgets, dev tools that
        mix code / preview / console, data-exploration apps that need
        side-by-side views. Users split areas with corner drags, swap each
        area&apos;s content from a registry, and save common arrangements as
        presets.
      </p>

      <h3 className="mb-2 mt-6 text-base font-semibold">Basic example</h3>
      <pre className="overflow-x-auto rounded-md border border-border bg-muted p-4 font-mono text-xs">
        <code>{`import { Workspace, type WorkspaceComponent } from "@/registry/components/layout/workspace"

const components: WorkspaceComponent[] = [
  { id: "chart",  name: "Chart",  category: "Data",  render: () => <ChartPanel /> },
  { id: "table",  name: "Table",  category: "Data",  render: () => <TablePanel /> },
  { id: "filter", name: "Filter", category: "Tools", render: () => <FilterPanel /> },
]

export function Example() {
  return (
    <div className="h-screen w-full">
      <Workspace
        components={components}
        defaultComponentId="chart"
      />
    </div>
  )
}`}</code>
      </pre>

      <h3 className="mb-2 mt-6 text-base font-semibold">Inside a registered component</h3>
      <p className="text-muted-foreground">
        Every component&apos;s <code>render()</code> runs inside an area
        context. Call <code>useAreaContext()</code> to read live dimensions,
        the area&apos;s id, and whether it currently holds focus.
      </p>
      <pre className="overflow-x-auto rounded-md border border-border bg-muted p-4 font-mono text-xs">
        <code>{`import { useAreaContext } from "@/registry/components/layout/workspace"

function ChartPanel() {
  const { width, height, isFocused } = useAreaContext()
  return <Chart width={width} height={height} highlight={isFocused} />
}`}</code>
      </pre>

      <h3 className="mb-2 mt-6 text-base font-semibold">Gestures (desktop)</h3>
      <ul className="ml-5 list-disc space-y-1 text-muted-foreground">
        <li>
          <strong>Corner-drag inward</strong> — split the area; orientation is
          inferred from the drag direction.
        </li>
        <li>
          <strong>Corner-drag outward into a neighbor</strong> — merge; the
          neighbor is replaced.
        </li>
        <li>
          <strong>Drag a shared edge</strong> — resize. Boundaries clamp to{" "}
          <code>minAreaSize</code>.
        </li>
        <li>
          <strong>Top-left dropdown</strong> — change the area&apos;s component.
        </li>
      </ul>

      <h3 className="mb-2 mt-6 text-base font-semibold">Keyboard alternatives</h3>
      <ul className="ml-5 list-disc space-y-1 text-muted-foreground">
        <li>
          <code>Tab</code> — focus an area.
        </li>
        <li>
          Header chevron menu — split / merge / pick a component (works without a
          mouse).
        </li>
        <li>
          <code>Alt+Shift+Arrow</code> on a focused area — nudge the adjacent
          boundary.
        </li>
      </ul>

      <h3 className="mb-2 mt-6 text-base font-semibold">Notes</h3>
      <ul className="ml-5 list-disc space-y-1 text-muted-foreground">
        <li>
          State preservation: splitting keeps the original area&apos;s component
          instance intact (state, scroll position, focus); the new sibling
          mounts fresh. Merging and switching component-id remount.
        </li>
        <li>
          Mobile (viewport width below <code>breakpoints.mobile</code>) renders
          as a 1-column card stack regardless of the underlying tree. Tree
          state is preserved internally and restored when widening back.
        </li>
        <li>
          <code>maxSplitDepth</code> is a hard cap, applied per leaf and
          configurable per breakpoint (default{" "}
          <code>{`{ mobile: 0, tablet: 3, desktop: 7 }`}</code>). When the
          originating leaf is at cap, splitting is inert (no preview, no
          toast); merging into a neighbor on the same gesture still works.
          Devtools console logs once per session.
        </li>
        <li>
          Set a height on the wrapper (<code>h-[600px]</code>, <code>h-screen</code>,
          {" "}<code>flex-1</code>, etc.) — Workspace fills its container.
        </li>
        <li>
          Pass <code>layout</code> + <code>onLayoutChange</code> for controlled
          mode (consumer owns persistence). Omit <code>layout</code> and pass{" "}
          <code>defaultLayout</code> for uncontrolled.
        </li>
      </ul>
    </div>
  );
}
