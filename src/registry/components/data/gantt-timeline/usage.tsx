export default function GanttTimelineUsage() {
  return (
    <div className="max-w-none text-sm leading-relaxed text-foreground">
      <h3 className="mb-2 mt-0 text-base font-semibold">When to use</h3>
      <p className="text-muted-foreground">
        Reach for <code>GanttTimeline</code> when you already render the canonical{" "}
        <code>TaskItem[]</code> as cards (<code>task-card</code>) or columns (
        <code>kanban-board</code>) and want a third surface that answers{" "}
        <em>&ldquo;what runs when, and what overlaps?&rdquo;</em> — a time axis the other
        surfaces can&apos;t provide. Editing (drag-to-reschedule, resize, create, delete,
        reparent, detail-edit) is opt-in via <code>editable</code> — off by default, so it
        stays a clean read-only timeline until you want more.
      </p>

      <h3 className="mb-2 mt-6 text-base font-semibold">Basic example</h3>
      <pre className="overflow-x-auto rounded-md border border-border bg-muted p-4 font-mono text-xs">
        <code>{`import { GanttTimeline } from "@/components/gantt-timeline"

export function TasksTimeline({ tasks }) {
  return (
    <GanttTimeline
      data={tasks}                  // the same TaskItem[] as List + Board
      statusOptions={STATUS_OPTIONS}
      defaultZoom="week"
      onTaskClick={(t) => openTaskDetail(t.id)}
    />
  )
}`}</code>
      </pre>

      <h3 className="mb-2 mt-6 text-base font-semibold">Composed (lighter)</h3>
      <p className="text-muted-foreground">
        Drop the assembly and hand-place the parts. <code>GanttTimelineRoot</code> holds all
        state + gestures; any subset of <code>GanttTimelineGutter</code> /{" "}
        <code>GanttTimelineAxis</code> / <code>GanttTimelineBody</code> wires itself through
        context — no prop-drilling.
      </p>
      <pre className="overflow-x-auto rounded-md border border-border bg-muted p-4 font-mono text-xs">
        <code>{`<GanttTimelineRoot data={tasks} statusOptions={STATUS_OPTIONS} defaultZoom="day">
  <GanttTimelineAxis />
  <div className="flex h-105">
    <GanttTimelineGutter />
    <GanttTimelineBody />
  </div>
</GanttTimelineRoot>`}</code>
      </pre>

      <h3 className="mb-2 mt-6 text-base font-semibold">Editing (v0.2–v0.4, opt-in)</h3>
      <p className="text-muted-foreground">
        Set <code>editable</code> and wire <code>onChange</code> — data is controlled, so you
        echo the mutated <code>TaskItem[]</code> back (and get undo/redo for free from a history
        stack). Drag bars to move, drag edges to resize, double-click or right-click to edit,
        drag the gutter grip to reparent, and{" "}
        <strong>drag a summary bracket to group-move the whole subtree</strong> (v0.3). To draw a
        new task, flip the toolbar <strong>Draw</strong> toggle (v0.4) and drag on an empty
        row — with Draw off, an empty-row drag pans instead. Gated by the same{" "}
        <code>permissions</code> matrix as task-card / task-tree.
      </p>
      <pre className="overflow-x-auto rounded-md border border-border bg-muted p-4 font-mono text-xs">
        <code>{`<GanttTimeline
  data={tasks}
  editable
  onChange={setTasks}                 // controlled echo (source of truth)
  permissions={{ byItem: { "epic-1": { remove: false } } }}
  onItemMoved={(e) => persist(e)}
/>`}</code>
      </pre>

      <h3 className="mb-2 mt-6 text-base font-semibold">Notes</h3>
      <ul className="ml-5 list-disc space-y-1 text-muted-foreground">
        <li>
          <strong>Navigation:</strong> drag to pan (flick for momentum), pinch or ⌘/ctrl-wheel
          to zoom toward the cursor, plain wheel scrolls rows, shift-wheel pans. Toolbar{" "}
          <code>+ / − / Fit / Today</code> and the imperative handle cover the same ground.
        </li>
        <li>
          <strong>Bars:</strong> effective window is <code>startAt ?? setAt</code> →{" "}
          <code>expireAt ?? (start + duration)</code>; no end ⇒ a milestone diamond. Color is
          status-tone fill (done=gray, blocked=red, active=urgency ramp imported from
          task-card); <code>borderColor</code> overrides per item; overdue adds a red
          end-cap.
        </li>
        <li>
          <strong>Tooltip:</strong> lightweight by default; pass{" "}
          <code>renderTooltip={"{(item) => <GanttFullCardTooltip item={item} />}"}</code> to
          lazy-embed the full card (task-card only enters the bundle then).
        </li>
        <li>
          <strong>Keyboard:</strong> the gutter is a WAI-ARIA tree — ↑/↓ move rows, ←/→
          collapse/expand, Enter activates, Space toggles. Pan/zoom is gesture + toolbar.
        </li>
        <li>
          <strong>SSR:</strong> pass <code>now</code> for deterministic first paint; otherwise
          the today line + urgency resolve after mount.
        </li>
      </ul>
    </div>
  );
}
