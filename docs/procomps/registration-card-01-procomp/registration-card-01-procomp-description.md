# registration-card-01 — procomp description

> Stage 1: what & why.
>
> **Migration origin:** kasder `kas-social-front-v0` `src/app/(platform)/events/[id]/page.tsx` lines 237–274 (the "Kayıt Durumu" / Registration Status sidebar card on the event detail page). Final of 5 components extracted from this page.

## Problem

Registration / signup / RSVP cards show up on every event, course, training, webinar, ticket, fundraising, beta-signup, waitlist page. The anatomy is consistent: capacity counter (registered / total) + progress bar + a status-aware primary CTA (Register / Sold Out / Closed) + an optional secondary share button. Every project re-implements:
- The capacity-percentage math + clamping
- The 4-state state machine (`open` / `lastSpots` / `full` / `closed`)
- Destructive color flip on the spots-left counter when below threshold
- Status-driven CTA label + variant + disabled state
- The dual-button stacked layout

Pro-ui has no answer. `event-card-01` has a decorative CTA inside its grid variant, but the registration-card pattern needs a REAL interactive button as the primary action.

## Architectural decision: registration-card-01 is INDEPENDENT of event timing

Per pro-ui's sealed-folder mandate, registration-card-01 cannot import from event-card-01. It also doesn't NEED to — the registration state machine is a pure function of `(capacity, registered, closed)` inputs, with no concept of event dates. The host knows event timing context and passes `closed: true` when the event window has ended.

This gives **two cleanly separated concerns:**
- **`event-card-01`** — what's the event's lifecycle state? (`expired` / `ongoing` / `upcoming` / `open` / `full` / `lastSpots`) — uses `(date, endDate, now, capacity, registered)`
- **`registration-card-01`** — is the registration open right now? (`open` / `lastSpots` / `full` / `closed`) — uses `(capacity, registered, closed)`

Hosts using both compose them at the page level (e.g., on the event detail page, the host derives event-card status to decide whether to even show the registration card, then passes `closed: true` when status is `expired` or `ongoing` past start).

## In scope

- **Card-framed** registration status display — capacity counter + progress bar + dual action buttons
- **4-state state machine** — `open` / `lastSpots` / `full` / `closed` derived from `(capacity, registered, closed)`
- **Public helper kernel** — `deriveRegistrationStatus(opts)` exported as a pure function
- **Real interactive primary CTA** via `onRegister?: () => void` — not decorative; this is the actual registration trigger
- **Default share button** when `onShare` is provided — outline-variant `<Button>` with `Share2` icon
- **`actions` slot** — fully replaces the default share button when consumer wants custom action cluster (e.g., calendar export + save event + share via `share-bar-01`)
- **Configurable thresholds:**
  - `lastSpotsRatio` (default `0.8`) — drives the `lastSpots` state
  - `urgentSpotsCount` (default `10`) — drives the destructive color on the spots-left counter
- **No-quota mode** — when `capacity` and `registered` are absent, the progress bar + counter rows hide; status defaults to `open`; CTA stays interactive
- **Optional heading** — text + configurable level (`headingAs: "h2" | "h3" | "h4"`, default `h3` since this is a sidebar card)
- **Frame toggle** — `framed: true` default (card chrome with `shadow-lg` for sidebar elevation) / `false` (bare for embedded use)
- **i18n** — `labels` object covering 7 keys: heading meta + counter labels + spots-left text + 4 CTA states
- **a11y** — heading id via `useId` + section `aria-labelledby`; Radix Progress emits `role="progressbar"` + `aria-valuenow`; share button accessible-name from labels

## Out of scope

- **Actual registration form / dialog** — host owns the form. The card just fires `onRegister()` callback.
- **Optimistic capacity updates** — host owns the data. After registration completes, host updates the `registered` prop.
- **Calendar / ICS export** — consumer composes via `actions` slot.
- **Share UI** — default ships a single Share2 button; consumer drops `share-bar-01` in `actions` for richer sharing.
- **Date / time / "starts in X" counters** — that's `progress-timeline-01`'s job.
- **Live capacity polling / WebSocket integration** — host owns data layer.
- **Multi-tier ticket pricing** — different shape entirely.

## Target consumers

- Event registration sidebars (the kasder use case)
- Course / webinar signup cards
- Training enrollment widgets
- Conference ticket cards
- Beta / waitlist signup
- Fundraising goal cards (where "registered" = "donations" and CTA = "Donate")
- Pre-order / RSVP widgets

## Rough API sketch

```ts
<RegistrationCard01
  heading="Kayıt Durumu"
  capacity={500}
  registered={423}
  onRegister={() => openRegisterDialog()}
  onShare={() => share(eventUrl)}
  labels={{
    capacityLabel: "Kontenjan",
    spotsLeftSuffix: "yer kaldı",
    spotsLeftFull: "Dolu",
    registeredSuffix: "kayıtlı",
    capacitySuffix: "kapasite",
    ctaRegister: "Hemen Kayıt Ol",
    ctaSoldOut: "Kontenjan Dolu",
    ctaClosed: "Etkinlik Sona Erdi",
    ctaShare: "Paylaş",
  }}
/>;
```

5 props are most-used: `capacity`, `registered`, `onRegister`, `onShare`, `labels`.

## Public helper kernel

```ts
import {
  RegistrationCard01,
  deriveRegistrationStatus,
  type RegistrationStatus,
} from "@ilinxa/registration-card-01";

// Use the kernel without rendering:
const stillOpen = events.filter(
  (e) =>
    deriveRegistrationStatus({
      capacity: e.capacity,
      registered: e.registered,
      closed: e.regClosed,
    }).status !== "full",
).length;
```

Pure function. No React imports. Tree-shakeable. Server-component friendly.

## Example usages

**1. Event registration card (the kasder use case):**

```tsx
<RegistrationCard01
  heading="Kayıt Durumu"
  capacity={event.capacity}
  registered={event.registered}
  closed={getEventStatus(event) === "expired"}
  onRegister={() => openRegisterDialog(event)}
  onShare={() => share(eventUrl)}
  labels={trLabels}
/>
```

**2. Capacity-less webinar (open registration, no cap):**

```tsx
<RegistrationCard01
  heading="Sign Up"
  onRegister={handleRegister}
  // no capacity / registered — progress bar hides; status stays "open"
/>
```

**3. Custom actions cluster (calendar + share + save):**

```tsx
<RegistrationCard01
  heading="Registration"
  capacity={200}
  registered={172}
  onRegister={handleRegister}
  actions={
    <div className="flex gap-2">
      <Button variant="outline" onClick={addToCalendar}>
        <CalendarPlus className="size-4 mr-2" /> Calendar
      </Button>
      <Button variant="outline" onClick={save}>
        <Bookmark className="size-4 mr-2" /> Save
      </Button>
      <ShareBar01 url={eventUrl} variant="compact" />
    </div>
  }
/>
```

**4. Fundraising goal card (relabeled):**

```tsx
<RegistrationCard01
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
/>
```

**5. Pure-helper composition (no card render):**

```tsx
import { deriveRegistrationStatus } from "@ilinxa/registration-card-01";

const Stat = ({ events }) => {
  const open = events.filter(
    (e) => deriveRegistrationStatus({ capacity: e.capacity, registered: e.registered }).status !== "full",
  ).length;
  return <span>{open} registrations open</span>;
};
```

## Success criteria

- Renders the kasder Kayıt Durumu block verbatim from `(capacity, registered, onRegister, onShare, labels)` props.
- Status state machine derives correctly from `(capacity, registered, closed)`.
- Spots-left counter flips `text-destructive` when count ≤ `urgentSpotsCount` (default `10`).
- CTA dispatches correctly per status: `open`/`lastSpots` → enabled primary; `full` → disabled secondary "Sold out"; `closed` → disabled secondary "Closed".
- Share button appears when `onShare` is provided AND `actions` is NOT provided. `actions` slot fully replaces the default share.
- No-quota mode (no `capacity`/`registered`) hides the bar + counter rows but keeps CTA + share.
- TypeScript: `RegistrationStatus` literal union; `Required<RegistrationCard01Labels>` defaults exported.
- a11y: section `aria-labelledby={headingId}`; Radix `progressbar` role; CTA + share buttons keyboard-reachable with focus-visible ring; disabled state announced via `aria-disabled` (Radix Button default).
- `pnpm tsc --noEmit` + `pnpm lint` + `pnpm build` clean; SSR returns 200.

## Open questions

1. **Does the bar need a marker dot like progress-timeline-01?** **Resolved: no.** Capacity progress is a "fill" metaphor (X% full); marker dot reads as "current position in time" which doesn't apply here. The bar uses shadcn `Progress` directly (no marker), matching kasder.
2. **`onRegister` required or optional?** **Resolved: optional.** Lets consumers render the card in preview / read-only states (e.g., admin dashboards). When omitted, the CTA renders as `aria-disabled` with a soft "Registration unavailable" label fallback.
3. **Default share button — ship one or always require `actions` slot?** **Resolved: ship a default when `onShare` is provided; `actions` slot fully replaces it.** Best of both: easy default, escape hatch when needed.
4. **State machine name collision with event-card-01's `RegistrationStatus`?** **Resolved: rename here to `RegistrationStatus`.** event-card-01's union is `EventStatus`; this card's is `RegistrationStatus`. No collision since both are exported from different modules.
5. **`closed` prop — boolean OR a richer reason like `closedReason: "expired" \| "manual" \| "scheduled-close"`?** **Resolved: boolean.** Keep API minimal. The CTA shows `labels.ctaClosed` when `closed: true`; consumer customizes the label per their context (e.g., "Event ended" vs "Registration closed manually").
6. **Two thresholds (`lastSpotsRatio` + `urgentSpotsCount`) — overengineered?** **Resolved: keep both.** They're semantically distinct (lastSpots is percent-of-capacity for state machine; urgent is absolute count for color). Default values match kasder (`0.8` and `10`).
