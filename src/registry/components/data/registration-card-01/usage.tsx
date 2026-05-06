export default function RegistrationCard01Usage() {
  return (
    <div className="max-w-none text-sm leading-relaxed text-foreground">
      <h3 className="mb-2 mt-0 text-base font-semibold">When to use</h3>
      <p className="text-muted-foreground">
        Reach for <code>RegistrationCard01</code> for any signup / RSVP /
        ticket / fundraising widget — event registration sidebars, course /
        webinar enrollment, training signups, conference tickets, beta /
        waitlist, fundraising goal cards. Capacity progress + spots-left
        counter + status-aware primary CTA + optional share / actions slot.
      </p>

      <h3 className="mb-2 mt-6 text-base font-semibold">Minimal example</h3>
      <pre className="overflow-x-auto rounded-md border border-border bg-muted p-4 font-mono text-xs">
        <code>{`import { RegistrationCard01 } from "@/registry/components/data/registration-card-01";

<RegistrationCard01
  heading="Registration"
  capacity={500}
  registered={142}
  onRegister={() => openRegisterDialog()}
  onShare={() => share(eventUrl)}
/>;`}</code>
      </pre>

      <h3 className="mb-2 mt-6 text-base font-semibold">
        4-state state machine
      </h3>
      <p className="text-muted-foreground">
        Status auto-derives from <code>(capacity, registered, closed)</code>:
      </p>
      <ul className="ml-5 list-disc space-y-1 text-muted-foreground">
        <li>
          <code>open</code> — capacity available, less than{" "}
          <code>lastSpotsRatio</code> full → primary &quot;Register&quot; CTA
        </li>
        <li>
          <code>lastSpots</code> — capacity available, ≥{" "}
          <code>lastSpotsRatio</code> full (default 80%) → primary
          &quot;Register&quot; CTA + spots-left counter flips to{" "}
          <code>text-destructive</code> when ≤ <code>urgentSpotsCount</code>{" "}
          (default 10)
        </li>
        <li>
          <code>full</code> — <code>registered &gt;= capacity</code> →
          disabled secondary &quot;Sold out&quot; CTA
        </li>
        <li>
          <code>closed</code> — host-driven via <code>closed: true</code> →
          disabled secondary &quot;Closed&quot; CTA. Wins over capacity
          (closed always closes regardless of remaining spots).
        </li>
      </ul>

      <h3 className="mb-2 mt-6 text-base font-semibold">
        Public helper kernel — derive state without rendering
      </h3>
      <pre className="overflow-x-auto rounded-md border border-border bg-muted p-4 font-mono text-xs">
        <code>{`import {
  RegistrationCard01,
  deriveRegistrationStatus,
  type RegistrationStatus,
} from "@/registry/components/data/registration-card-01";

// Header counter: how many events are still open?
const stillOpen = events.filter(
  (e) =>
    deriveRegistrationStatus({
      capacity: e.capacity,
      registered: e.registered,
      closed: e.regClosed,
    }) !== "full" &&
    deriveRegistrationStatus({
      capacity: e.capacity,
      registered: e.registered,
      closed: e.regClosed,
    }) !== "closed",
).length;`}</code>
      </pre>

      <h3 className="mb-2 mt-6 text-base font-semibold">
        Composing with <code>event-card-01</code>&apos;s state
      </h3>
      <p className="text-muted-foreground">
        registration-card-01 is architecturally{" "}
        <strong>independent</strong> of event timing — the host derives event
        status (using <code>getEventStatus</code> from{" "}
        <code>event-card-01</code>) and passes <code>closed: true</code>{" "}
        when registration should close. Two common composition patterns:
      </p>
      <pre className="overflow-x-auto rounded-md border border-border bg-muted p-4 font-mono text-xs">
        <code>{`import { getEventStatus } from "@/registry/components/data/event-card-01";

// Pattern 1 — close registration only when event has expired:
<RegistrationCard01
  capacity={event.capacity}
  registered={event.registered}
  closed={getEventStatus(event) === "expired"}
  onRegister={handleRegister}
/>

// Pattern 2 — close registration when event is expired OR ongoing
// (i.e., no walk-ins after the event starts):
<RegistrationCard01
  capacity={event.capacity}
  registered={event.registered}
  closed={["expired", "ongoing"].includes(getEventStatus(event))}
  onRegister={handleRegister}
/>`}</code>
      </pre>

      <h3 className="mb-2 mt-6 text-base font-semibold">No-quota mode</h3>
      <p className="text-muted-foreground">
        For unlimited / drop-in events, omit <code>capacity</code> and{" "}
        <code>registered</code> — the bar + counter rows hide; status stays{" "}
        <code>open</code>; CTA + share remain interactive.
      </p>
      <pre className="overflow-x-auto rounded-md border border-border bg-muted p-4 font-mono text-xs">
        <code>{`<RegistrationCard01
  heading="Sign up"
  onRegister={handleRegister}
  onShare={handleShare}
/>`}</code>
      </pre>

      <h3 className="mb-2 mt-6 text-base font-semibold">Custom actions slot</h3>
      <p className="text-muted-foreground">
        The <code>actions</code> slot fully replaces the default share
        button. Drop in calendar export + save event + share clusters, or
        compose with <code>share-bar-01</code>:
      </p>
      <pre className="overflow-x-auto rounded-md border border-border bg-muted p-4 font-mono text-xs">
        <code>{`<RegistrationCard01
  capacity={200}
  registered={172}
  onRegister={handleRegister}
  actions={
    <div className="grid grid-cols-3 gap-2">
      <Button variant="outline" onClick={addToCalendar}>Cal</Button>
      <Button variant="outline" onClick={save}>Save</Button>
      <ShareBar01 url={eventUrl} variant="compact" />
    </div>
  }
/>`}</code>
      </pre>

      <h3 className="mb-2 mt-6 text-base font-semibold">
        Relabeled for fundraising
      </h3>
      <pre className="overflow-x-auto rounded-md border border-border bg-muted p-4 font-mono text-xs">
        <code>{`<RegistrationCard01
  heading="Fundraising Goal"
  capacity={50000}
  registered={32000}
  onRegister={openDonateDialog}
  labels={{
    capacityLabel: "Goal",
    spotsLeftSuffix: "remaining",
    spotsLeftFull: "Goal reached!",
    registeredSuffix: "raised",
    capacitySuffix: "goal",
    ctaRegister: "Donate now",
    ctaSoldOut: "Goal reached",
  }}
/>`}</code>
      </pre>

      <h3 className="mb-2 mt-6 text-base font-semibold">Configurable thresholds</h3>
      <ul className="ml-5 list-disc space-y-1 text-muted-foreground">
        <li>
          <code>lastSpotsRatio</code> (default <code>0.8</code>) — percent
          of capacity (0–1) at which status flips to <code>lastSpots</code>.
          Drives the state machine.
        </li>
        <li>
          <code>urgentSpotsCount</code> (default <code>10</code>) —
          absolute spots-left count at which the counter color flips to{" "}
          <code>text-destructive</code>. Drives the visual color, not the
          state.
        </li>
      </ul>
      <p className="text-muted-foreground mt-2">
        These are semantically distinct: <code>lastSpotsRatio</code> is
        percent (good for state), <code>urgentSpotsCount</code> is absolute
        (good for color urgency). For a 100-capacity event, 80% means 20
        spots left — not yet urgent. For a 50-capacity event, 80% means 10
        spots left — urgent.
      </p>

      <h3 className="mb-2 mt-6 text-base font-semibold">Notes</h3>
      <ul className="ml-5 list-disc space-y-1 text-muted-foreground">
        <li>
          The primary CTA is a REAL interactive button — fires{" "}
          <code>onRegister()</code> when clicked. (Differs from{" "}
          <code>event-card-01</code>&apos;s grid variant which has a decorative
          CTA.)
        </li>
        <li>
          When <code>onRegister</code> is absent, the CTA renders disabled
          with <code>labels.ctaUnavailable</code> — useful for preview /
          admin contexts.
        </li>
        <li>
          The bar uses Radix <code>Progress</code> primitive — emits{" "}
          <code>role=&quot;progressbar&quot;</code> +{" "}
          <code>aria-valuenow</code> automatically.
        </li>
        <li>
          Heading defaults to <code>h3</code> (this is a sidebar card,
          typically nested under the page&apos;s main <code>h2</code>).
        </li>
        <li>
          <code>statusOverride</code> wins over derived status — useful for
          preview / what-if states in admin UIs.
        </li>
      </ul>
    </div>
  );
}
