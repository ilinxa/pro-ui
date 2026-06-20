export default function GanttTimeline01Usage() {
  return (
    <div className="max-w-none text-sm leading-relaxed text-foreground">
      <h3 className="mb-2 mt-0 text-base font-semibold">When to use</h3>
      <p className="text-muted-foreground">
        Reach for <code>GanttTimeline01</code> when you already render the canonical{" "}
        <code>TodoItem[]</code> as cards (<code>todo-rich-card</code>) or columns (
        <code>kanban-board-01</code>) and want a third surface that answers{" "}
        <em>&ldquo;what runs when, and what overlaps?&rdquo;</em> — a time axis the other
        surfaces can&apos;t provide. Editing (drag-to-reschedule, resize, create, delete,
        reparent, detail-edit) is opt-in via <code>editable</code> — off by default, so it
        stays a clean read-only timeline until you want more.
      </p>

      <h3 className="mb-2 mt-6 text-base font-semibold">Basic example</h3>
      <pre className="overflow-x-auto rounded-md border border-border bg-muted p-4 font-mono text-xs">
        <code>{`import { GanttTimeline01 } from "@/components/gantt-timeline-01"

export function TasksTimeline({ tasks }) {
  return (
    <GanttTimeline01
      data={tasks}                  // the same TodoItem[] as List + Board
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

      <h3 className="mb-2 mt-6 text-base font-semibold">Editing (v0.2, opt-in)</h3>
      <p className="text-muted-foreground">
        Set <code>editable</code> and wire <code>onChange</code> — data is controlled, so you
        echo the mutated <code>TodoItem[]</code> back (and get undo/redo for free from a history
        stack). Drag bars to move, drag edges to resize, draw on an empty row to create,
        double-click or right-click to edit, drag the gutter grip to reparent. Gated by the
        same <code>permissions</code> matrix as todo-rich-card / todo-tree.
      </p>
      <pre className="overflow-x-auto rounded-md border border-border bg-muted p-4 font-mono text-xs">
        <code>{`<GanttTimeline01
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
          todo-rich-card); <code>borderColor</code> overrides per item; overdue adds a red
          end-cap.
        </li>
        <li>
          <strong>Tooltip:</strong> lightweight by default; pass{" "}
          <code>renderTooltip={"{(item) => <GanttFullCardTooltip item={item} />}"}</code> to
          lazy-embed the full card (todo-rich-card only enters the bundle then).
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
