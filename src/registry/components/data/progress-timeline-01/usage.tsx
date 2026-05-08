export default function ProgressTimeline01Usage() {
  return (
    <div className="max-w-none text-sm leading-relaxed text-foreground">
      <h3 className="mb-2 mt-0 text-base font-semibold">When to use</h3>
      <p className="text-muted-foreground">
        Reach for <code>ProgressTimeline01</code> when you need to communicate
        progress through a time-bound window — registration windows, sprints,
        sales countdowns, course completion windows, fundraising deadlines.
        The component renders a horizontal progress bar with a marker dot at
        the current percentage + 3 captions (start / dynamic state-aware
        center / end), auto-deriving a 3-state machine (
        <code>before</code> / <code>active</code> / <code>after</code>) from{" "}
        <code>start</code> + <code>end</code> + <code>now</code>.
      </p>

      <h3 className="mb-2 mt-6 text-base font-semibold">Minimal example</h3>
      <pre className="overflow-x-auto rounded-md border border-border bg-muted p-4 font-mono text-xs">
        <code>{`import { ProgressTimeline01 } from "@/components/progress-timeline-01";

<ProgressTimeline01
  start="2026-04-01"
  end="2026-06-30"
  heading="Registration Window"
/>;`}</code>
      </pre>

      <h3 className="mb-2 mt-6 text-base font-semibold">
        Public helper kernel — derive state without rendering
      </h3>
      <p className="text-muted-foreground">
        The kernel is a pure function exported alongside the component. Use
        it for header counters, calendar coloring, status filter logic,
        deterministic tests — without rendering the bar:
      </p>
      <pre className="overflow-x-auto rounded-md border border-border bg-muted p-4 font-mono text-xs">
        <code>{`import {
  ProgressTimeline01,
  deriveTimelineState,
  type TimelineState,
} from "@/components/progress-timeline-01";

// Header counter — how many windows are currently open?
const activeCount = events.filter(
  (e) => deriveTimelineState(e.regStart, e.regEnd).status === "active",
).length;

// Calendar day-cell coloring
function isWithinWindow(start: string, end: string, day: Date) {
  return deriveTimelineState(start, end, day).status === "active";
}`}</code>
      </pre>

      <h3 className="mb-2 mt-6 text-base font-semibold">Localizing labels</h3>
      <p className="text-muted-foreground">
        Pass a <code>labels</code> object. Each text label accepts a string OR
        a function <code>(state: TimelineState) =&gt; ReactNode</code> for
        dynamic content driven by the derived state:
      </p>
      <pre className="overflow-x-auto rounded-md border border-border bg-muted p-4 font-mono text-xs">
        <code>{`<ProgressTimeline01
  start={event.registrationOpens}
  end={event.date}
  labels={{
    startLabel: "Kayıt Başlangıcı",
    endLabel: "Etkinlik Günü",
    beforeText: (state) => \`\${state.daysToStart} gün sonra başlıyor\`,
    activeText: (state) => \`\${state.daysToEnd} gün kaldı\`,
    afterText: "Etkinlik Sona Erdi",
  }}
/>`}</code>
      </pre>

      <h3 className="mb-2 mt-6 text-base font-semibold">
        <code>renderCenterLabel</code> — full takeover
      </h3>
      <p className="text-muted-foreground">
        For full control of the center caption (e.g. compose percent + days),
        use <code>renderCenterLabel</code> — receives the derived{" "}
        <code>TimelineState</code>:
      </p>
      <pre className="overflow-x-auto rounded-md border border-border bg-muted p-4 font-mono text-xs">
        <code>{`<ProgressTimeline01
  start={start}
  end={end}
  renderCenterLabel={(state) => (
    <span>
      <strong>{Math.round(state.percent)}%</strong> · {state.daysToEnd} days left
    </span>
  )}
/>`}</code>
      </pre>

      <h3 className="mb-2 mt-6 text-base font-semibold">
        <code>value</code> escape hatch — non-time progress
      </h3>
      <p className="text-muted-foreground">
        For non-time-based progress (course completion %, fundraising %,
        etc.), pass <code>value</code> (0-100) — overrides the time-derived
        bar fill. The state machine still derives from{" "}
        <code>start</code>/<code>end</code> so the captions stay meaningful:
      </p>
      <pre className="overflow-x-auto rounded-md border border-border bg-muted p-4 font-mono text-xs">
        <code>{`<ProgressTimeline01
  start={course.startDate}
  end={course.endDate}
  value={courseCompletion}
  labels={{
    startLabel: "Module 1",
    endLabel: "Module 12",
    activeText: () => \`\${courseCompletion}% complete\`,
  }}
/>`}</code>
      </pre>

      <h3 className="mb-2 mt-6 text-base font-semibold">
        Live-clock host — minute-accurate state flips
      </h3>
      <pre className="overflow-x-auto rounded-md border border-border bg-muted p-4 font-mono text-xs">
        <code>{`function LiveTimeline({ event }) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);
  return (
    <ProgressTimeline01 start={event.start} end={event.end} now={now} />
  );
}`}</code>
      </pre>
      <p className="text-muted-foreground">
        The component has no internal <code>setInterval</code> — consumer
        drives the cadence (1-minute / 5-minute / 1-hour windows your call).
      </p>

      <h3 className="mb-2 mt-6 text-base font-semibold">Notes</h3>
      <ul className="ml-5 list-disc space-y-1 text-muted-foreground">
        <li>
          <code>start</code> + <code>end</code> are required even when{" "}
          <code>value</code> is supplied — captions need anchors and the state
          machine needs date boundaries.
        </li>
        <li>
          Invalid dates clamp gracefully (no crash); out-of-window times
          render as 0% / 100%.
        </li>
        <li>
          <code>headingAs</code> defaults to <code>h3</code> (timelines are
          typically nested under a page <code>h2</code> section). Bump via{" "}
          <code>headingAs=&quot;h2&quot;</code> when standalone.
        </li>
        <li>
          <code>headingIcon</code> defaults to{" "}
          <code>Timer</code> from lucide-react. Pass{" "}
          <code>headingIcon=&#123;null&#125;</code> to omit, or pass any
          <code>ComponentType</code> to swap.
        </li>
        <li>
          <code>marker=&quot;none&quot;</code> hides the dot; useful for dense
          contexts.
        </li>
        <li>
          The marker dot extends slightly past the bar at 0% / 100% (half-dot
          width) — by design; the dot represents the position, not the bar
          fill.
        </li>
      </ul>
    </div>
  );
}
