export default function ScheduleList01Usage() {
  return (
    <div className="max-w-none text-sm leading-relaxed text-foreground">
      <h3 className="mb-2 mt-0 text-base font-semibold">When to use</h3>
      <p className="text-muted-foreground">
        Reach for <code>ScheduleList01</code> when you need a vertical
        time-anchored list of activities — conference programs, course
        curricula, podcast / broadcast schedules, meeting agendas, recipe
        steps with timing. Each row is a time + title + optional description
        triplet, with optional icons and optional per-row links.
      </p>

      <h3 className="mb-2 mt-6 text-base font-semibold">Minimal example</h3>
      <pre className="overflow-x-auto rounded-md border border-border bg-muted p-4 font-mono text-xs">
        <code>{`import { ScheduleList01 } from "@/components/schedule-list-01";

<ScheduleList01
  heading="Program"
  items={[
    { id: "1", time: "09:00", title: "Welcome", description: "Check-in" },
    { id: "2", time: "10:00", endTime: "10:30", title: "Opening Keynote" },
    { id: "3", time: "11:00", title: "Panel: Future Cities" },
  ]}
/>;`}</code>
      </pre>

      <h3 className="mb-2 mt-6 text-base font-semibold">
        Item shape — what&apos;s required
      </h3>
      <ul className="ml-5 list-disc space-y-1 text-muted-foreground">
        <li>
          <code>id</code>, <code>time</code>, <code>title</code> — required.
        </li>
        <li>
          <code>endTime</code> — optional. When present, time renders as{" "}
          <code>{`{time}{separator}{endTime}`}</code> (default separator{" "}
          <code>&quot; - &quot;</code>, configurable via{" "}
          <code>labels.timeRangeSeparator</code>).
        </li>
        <li>
          <code>description</code> — optional. Description block omitted when
          missing.
        </li>
        <li>
          <code>icon</code> — optional Lucide-style component
          (<code>{`ComponentType<{ className?: string }>`}</code>). When
          present, sits left of the time column.
        </li>
        <li>
          <code>href</code> — optional. When present + <code>linkComponent</code>{" "}
          provided, the entire row becomes clickable via the overlay-link
          pattern.
        </li>
      </ul>

      <h3 className="mb-2 mt-6 text-base font-semibold">Frame toggle</h3>
      <p className="text-muted-foreground">
        Default <code>framed: true</code> — each row gets card chrome (
        <code>bg-card rounded-xl border</code>) and rows are spaced{" "}
        <code>space-y-4</code>. Pass <code>framed=&#123;false&#125;</code> for
        bare rows in dense contexts (sidebars, widgets) — chrome dropped, rows
        tighten to <code>space-y-2</code>.
      </p>

      <h3 className="mb-2 mt-6 text-base font-semibold">Custom rendering</h3>
      <ul className="ml-5 list-disc space-y-1 text-muted-foreground">
        <li>
          <code>renderItem(item)</code> — bypass the default row layout
          entirely. Useful for embedding speaker avatars, status badges,
          per-item actions.
        </li>
        <li>
          <code>renderTime(item)</code> — bypass the default time string
          renderer (e.g. transform &quot;09:00&quot; → &quot;9:00 AM&quot;).
          Used inside the default row layout when <code>renderItem</code> is
          not supplied.
        </li>
      </ul>

      <h3 className="mb-2 mt-6 text-base font-semibold">Polymorphic root</h3>
      <pre className="overflow-x-auto rounded-md border border-border bg-muted p-4 font-mono text-xs">
        <code>{`import NextLink from "next/link";

<ScheduleList01
  heading="Conference Day 1"
  items={items.map((item) => ({ ...item, href: \`/talks/\${item.id}\` }))}
  linkComponent={NextLink}
/>;`}</code>
      </pre>

      <h3 className="mb-2 mt-6 text-base font-semibold">Empty state</h3>
      <p className="text-muted-foreground">
        When <code>items</code> is empty, the component renders{" "}
        <code>emptyState</code> (if provided) OR a{" "}
        <code>&lt;p role=&quot;status&quot;&gt;</code> with{" "}
        <code>labels.emptyText</code> (default &quot;No items
        scheduled.&quot;).
      </p>

      <h3 className="mb-2 mt-6 text-base font-semibold">Notes</h3>
      <ul className="ml-5 list-disc space-y-1 text-muted-foreground">
        <li>
          Renders semantic <code>&lt;ol role=&quot;list&quot;&gt;</code> — schedules
          ARE ordered.
        </li>
        <li>
          Section <code>aria-labelledby</code> resolves to the heading id
          (computed via <code>useId</code>) — only when{" "}
          <code>heading</code> is supplied.
        </li>
        <li>
          Decorative icons get <code>aria-hidden=&quot;true&quot;</code>;
          link&apos;s accessible name is the item title.
        </li>
        <li>
          All hover transitions gated via <code>motion-safe:</code> —
          reduced-motion users see static rows.
        </li>
      </ul>
    </div>
  );
}
