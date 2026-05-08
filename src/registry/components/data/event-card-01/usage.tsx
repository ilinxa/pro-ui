export default function EventCard01Usage() {
  return (
    <div className="max-w-none text-sm leading-relaxed text-foreground">
      <h3 className="mb-2 mt-0 text-base font-semibold">When to use</h3>
      <p className="text-muted-foreground">
        Reach for <code>EventCard01</code> when you need an event preview with a
        live, time-and-capacity-aware status (registration open, almost full,
        sold out, happening right now, ended) plus a status-driven CTA. Four
        layouts:{" "}
        <code>variant=&quot;grid&quot;</code> (image-on-top magazine card),{" "}
        <code>variant=&quot;feed&quot;</code> (full-bleed image background,
        white-on-dark content),{" "}
        <code>variant=&quot;list&quot;</code> (thumbnail + 4-icon meta + status
        indicator), and{" "}
        <code>variant=&quot;compact&quot;</code> (text-only minimal row for
        sidebars / widgets).
      </p>

      <h3 className="mb-2 mt-6 text-base font-semibold">Minimal example</h3>
      <pre className="overflow-x-auto rounded-md border border-border bg-muted p-4 font-mono text-xs">
        <code>{`import { EventCard01 } from "@/components/event-card-01";

<EventCard01
  event={{
    id: "1",
    title: "Annual Summit",
    type: "Conference",
    date: "2026-07-01",
    time: "09:00 - 18:00",
    location: "Istanbul Conference Center",
    image: "/cover.jpg",
    capacity: 200,
    registered: 50,
  }}
  variant="grid"
  href="/events/1"
/>;`}</code>
      </pre>

      <h3 className="mb-2 mt-6 text-base font-semibold">Four variants</h3>
      <ul className="ml-5 list-disc space-y-1 text-muted-foreground">
        <li>
          <code>grid</code> — image-on-top magazine card with full meta lines,
          capacity progress bar, and decorative status CTA at the foot. Renders
          well in 1/2/3-column responsive grids.
        </li>
        <li>
          <code>feed</code> — full-bleed image background, content overlaid
          white-on-dark. Single-column feed item. No capacity progress bar
          (intentional — spots-left is shown inline in the meta row instead).
        </li>
        <li>
          <code>list</code> — info-rich row with thumbnail: 16/20 px square thumb
          left, content middle (status badge + type badge + title + 4-icon
          inline meta row showing date / time / location / spots-left),
          status-aware right indicator (days-until / pulsing &quot;Live
          now&quot; / chevron). Featured rows get a left accent border. Use
          when you want a scannable list with visual context per row.
        </li>
        <li>
          <code>compact</code> — text-only minimal row for sidebars / widgets /
          &quot;upcoming events&quot; tickers. Title + type pill (top-right) +
          3 stacked meta lines (date / time / location). NO thumbnail, NO
          status badge, NO capacity bar. Tightest variant — maximum density per
          pixel. Pairs naturally with a &quot;See all →&quot; footer link.
        </li>
      </ul>

      <h3 className="mb-2 mt-6 text-base font-semibold">
        Six statuses (auto-derived)
      </h3>
      <p className="text-muted-foreground">
        Status flows from the event data + an optional <code>now</code>{" "}
        reference. The card never needs you to set status — it&apos;s derived
        from the event and clock:
      </p>
      <ul className="ml-5 list-disc space-y-1 text-muted-foreground">
        <li>
          <code>open</code> — registrations available, more than 7 days out.
        </li>
        <li>
          <code>upcoming</code> — within 7 days. Amber badge.
        </li>
        <li>
          <code>lastSpots</code> — ≥80% capacity hit. Amber badge + spots-left
          counter flips to <code>text-destructive</code> when ≤5 left.
        </li>
        <li>
          <code>ongoing</code> — between start and end. Pulsing badge + live
          indicator.
        </li>
        <li>
          <code>full</code> — capacity reached. Sold-out CTA, button disabled.
        </li>
        <li>
          <code>expired</code> — past end date. Card fades to{" "}
          <code>opacity-60 grayscale-30</code>; CTA shows &quot;View
          details.&quot;
        </li>
      </ul>

      <h3 className="mb-2 mt-6 text-base font-semibold">
        Public helper kernel — use status logic without rendering the card
      </h3>
      <p className="text-muted-foreground">
        The status helpers are exported alongside the component so consumers can
        derive status, format dates, and compute days-until without rendering an
        actual card — for header counters, calendar day-cells, filter logic,
        deterministic tests:
      </p>
      <pre className="overflow-x-auto rounded-md border border-border bg-muted p-4 font-mono text-xs">
        <code>{`import {
  EventCard01,
  getEventStatus,
  EVENT_STATUS_CONFIG,
  formatEventDate,
  getDaysUntilEvent,
  type EventStatus,
} from "@/components/event-card-01";

// Header counter
const liveCount = events.filter(
  (e) => getEventStatus(e) === "ongoing",
).length;

// Calendar day cell — pure-helper composition, no card render
function DayCell({ events, day }: { events: EventCardItem[]; day: Date }) {
  const todays = events.filter((e) => sameDay(e.date, day));
  const hasOngoing = todays.some(
    (e) => getEventStatus(e, day) === "ongoing",
  );
  return (
    <div className={hasOngoing ? "bg-accent/30" : ""}>
      {todays.length > 0 && <span>{todays.length}</span>}
    </div>
  );
}`}</code>
      </pre>

      <h3 className="mb-2 mt-6 text-base font-semibold">
        Polymorphic root + custom href
      </h3>
      <pre className="overflow-x-auto rounded-md border border-border bg-muted p-4 font-mono text-xs">
        <code>{`import NextLink from "next/link";

<EventCard01
  event={event}
  variant="grid"
  linkComponent={NextLink}
  getHref={(e) => \`/etkinlik/\${e.slug}\`}
/>;`}</code>
      </pre>

      <h3 className="mb-2 mt-6 text-base font-semibold">
        Localized labels + custom date formatter
      </h3>
      <pre className="overflow-x-auto rounded-md border border-border bg-muted p-4 font-mono text-xs">
        <code>{`<EventCard01
  event={event}
  variant="grid"
  href={href}
  formatDate={(d) =>
    new Date(d).toLocaleDateString("tr-TR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    })
  }
  labels={{
    open: "Kayıt Açık",
    upcoming: "Yaklaşıyor",
    ctaRegister: "Kayıt Ol",
    daysUntilSuffix: "gün kaldı",
    capacityAriaPrefix: "Kayıtlı",
    capacityAriaSeparator: "/",
    // ... 17 keys total, all optional
  }}
  typeStyles={{
    Konferans: { className: "bg-primary/10 text-primary border-primary/20" },
  }}
/>;`}</code>
      </pre>

      <h3 className="mb-2 mt-6 text-base font-semibold">
        Actions slot — overlay-link pattern
      </h3>
      <p className="text-muted-foreground">
        The whole card is a link via the overlay-link pattern. Drop nested
        interactive buttons (Save / Share / Calendar) into the{" "}
        <code>actions</code> prop — they render at <code>z-10</code> above the
        link overlay. <strong>Each action button MUST call</strong>{" "}
        <code>e.preventDefault()</code> + <code>e.stopPropagation()</code> in
        its onClick or the click bubbles to the link and navigates. Tab order:
        card-link → action1 → action2 → next card.
      </p>

      <h3 className="mb-2 mt-6 text-base font-semibold">
        Deterministic <code>now</code> for testing + live clocks
      </h3>
      <p className="text-muted-foreground">
        Pass a <code>now</code> Date to make status derivation deterministic.
        For demos / SSR / screenshot tests, pin <code>now</code> to a fixed
        date so events don&apos;t silently drift over time. For minute-accurate
        live status, drive <code>now</code> from a parent <code>setInterval</code>:
      </p>
      <pre className="overflow-x-auto rounded-md border border-border bg-muted p-4 font-mono text-xs">
        <code>{`function LiveEvents({ events }: { events: EventCardItem[] }) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  return events.map((e) => (
    <EventCard01 key={e.id} event={e} variant="grid" href={\`/events/\${e.id}\`} now={now} />
  ));
}`}</code>
      </pre>

      <h3 className="mb-2 mt-6 text-base font-semibold">Soft-failure</h3>
      <p className="text-muted-foreground">
        Only <code>id</code>, <code>title</code>, <code>type</code>,{" "}
        <code>date</code> are required. Missing optional fields gracefully
        omit:
      </p>
      <ul className="ml-5 list-disc space-y-1 text-muted-foreground">
        <li>
          No <code>capacity</code> / <code>registered</code> — capacity bar +
          spots-left counter omitted; status logic skips <code>full</code> /{" "}
          <code>lastSpots</code> states; CTA reverts to plain Register / View
          Details / Ended.
        </li>
        <li>
          No <code>image</code> — tinted placeholder with calendar icon.
        </li>
        <li>
          No <code>endDate</code> — falls back to <code>date</code> (single-day
          event spans 00:00 → 23:59:59).
        </li>
        <li>
          No <code>time</code> / <code>location</code> / <code>description</code>{" "}
          — meta line omitted.
        </li>
      </ul>

      <h3 className="mb-2 mt-6 text-base font-semibold">Notes</h3>
      <ul className="ml-5 list-disc space-y-1 text-muted-foreground">
        <li>
          The CTA at the foot is <strong>decorative</strong> — clicking it
          navigates via the wrapping link overlay. To render a REAL register
          button (registration dialog, in-place form, etc.), drop one in{" "}
          <code>actions</code>.
        </li>
        <li>
          Status is derived once at render — no internal <code>setInterval</code>.
          For live updates, drive <code>now</code> from upstream.
        </li>
        <li>
          Helpers (<code>getEventStatus</code>, <code>EVENT_STATUS_CONFIG</code>,{" "}
          <code>formatEventDate</code>, <code>getDaysUntilEvent</code>) are part
          of the API contract — stable across v0.x.
        </li>
        <li>
          Status differentiated by both <strong>color AND icon</strong>{" "}
          (color-blind safe).
        </li>
        <li>
          All transforms + pulse animations gated via{" "}
          <code>motion-safe:</code> — reduced-motion users see static cards.
        </li>
      </ul>
    </div>
  );
}
