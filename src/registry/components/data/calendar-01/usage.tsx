export default function Calendar01Usage() {
  return (
    <div className="max-w-none text-sm leading-relaxed text-foreground">
      <h3 className="mb-2 mt-0 text-base font-semibold">When to use</h3>
      <p className="text-muted-foreground">
        Reach for <code>Calendar01</code> when you already hold the canonical{" "}
        <code>TodoItem[]</code> (the data behind <code>todo-rich-card</code>,{" "}
        <code>todo-tree</code>, <code>kanban-board-01</code>, and{" "}
        <code>gantt-timeline-01</code>) and want a date-grid surface — month,
        week, day, or agenda — with no adapter. It is the read-only display
        sibling of the gantt; editing lands in v0.2.
      </p>

      <h3 className="mb-2 mt-6 text-base font-semibold">Basic example</h3>
      <pre className="overflow-x-auto rounded-md border border-border bg-muted p-4 font-mono text-xs">
        <code>{`import { Calendar01 } from "@/components/calendar-01"

export function Example({ tasks }) {
  return (
    <Calendar01
      data={tasks}                 // TodoItem[]
      statusOptions={statusOptions}
      defaultView="month"          // "month" | "week" | "day" | "agenda"
      now={serverNow}              // SSR-stable "now"
      showMiniNav
      onTaskClick={(item) => openDetail(item)}
      onRangeChange={({ start, end }) => fetchWindow(start, end)}
    />
  )
}`}</code>
      </pre>

      <h3 className="mb-2 mt-6 text-base font-semibold">
        Lighter (hand-assembled subset)
      </h3>
      <pre className="overflow-x-auto rounded-md border border-border bg-muted p-4 font-mono text-xs">
        <code>{`import {
  Calendar01Root, CalendarToolbar, CalendarMonthView,
} from "@/components/calendar-01"

// month-only — the week/day time-grid code never enters your bundle
<Calendar01Root data={tasks} statusOptions={statusOptions} views={["month"]}>
  <CalendarToolbar />
  <CalendarMonthView />
</Calendar01Root>`}</code>
      </pre>

      <h3 className="mb-2 mt-6 text-base font-semibold">All-day vs timed</h3>
      <ul className="ml-5 list-disc space-y-1 text-muted-foreground">
        <li>
          A <code>classifyEvent(item)</code> predicate wins when it returns a
          kind.
        </li>
        <li>
          Otherwise a date-only string (<code>&quot;2026-06-22&quot;</code>, no{" "}
          <code>T</code>) is an all-day event (parsed floating-local — no
          timezone off-by-one); a full timestamp is timed.
        </li>
        <li>
          With no end and a full timestamp, the item is a milestone (a marker /
          dot).
        </li>
      </ul>

      <h3 className="mb-2 mt-6 text-base font-semibold">Notes</h3>
      <ul className="ml-5 list-disc space-y-1 text-muted-foreground">
        <li>
          Fully controlled — no internal data state. Pass <code>now</code> for
          an SSR-stable first paint.
        </li>
        <li>
          Keyboard: <code>M/W/D/A</code> switch views, <code>←/→</code> +{" "}
          <code>PageUp/PageDown</code> step the period, <code>T</code> jumps to
          today.
        </li>
        <li>
          The default hover tooltip is a native title; pass{" "}
          <code>renderTooltip</code> (e.g. <code>CalendarFullCardTooltip</code>)
          for a rich card.
        </li>
      </ul>
    </div>
  );
}
