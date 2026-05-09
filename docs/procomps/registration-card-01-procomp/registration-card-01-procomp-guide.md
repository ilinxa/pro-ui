# registration-card-01 — procomp guide

> Stage 3: how to use it.

## When to use

- Event registration sidebar (the kasder use case)
- Course / webinar / training signup widgets
- Conference ticket cards
- Beta / waitlist signup
- Fundraising goal cards (relabeled — see example below)
- Pre-order / RSVP boxes
- Anywhere you need: capacity progress + status-aware CTA + optional share

## When NOT to use

- **Tabular ticket pricing** with multiple tiers — different shape
- **Inline form fields** for the registration form itself — host owns the form; this card just fires the trigger
- **Live capacity polling / WebSocket display** — host owns data layer
- **Time-bound progress** (registration window over time) — use `progress-timeline-01` for a separate widget alongside

## Architectural decision: independent of event timing

`registration-card-01` is **architecturally independent** of `event-card-01`'s date-driven state machine — sealed-folder rule. The host derives event status (using `getEventStatus` from `event-card-01` if needed) and passes `closed: true` when registration should end.

Two cleanly separated concerns:
- **`event-card-01`** — what's the event's lifecycle state? (`expired` / `ongoing` / `upcoming` / `open` / `full` / `lastSpots`) — uses `(date, endDate, now, capacity, registered)`
- **`registration-card-01`** — is registration open right now? (`open` / `lastSpots` / `full` / `closed`) — uses `(capacity, registered, closed)`

## Composition patterns

### Event registration sidebar (the kasder use case)

```tsx
import { RegistrationCard01 } from "@/registry/components/data/registration-card-01";

<RegistrationCard01
  heading="Kayıt Durumu"
  capacity={event.capacity}
  registered={event.registered}
  onRegister={() => openRegisterDialog(event)}
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
/>
```

### Composing with `event-card-01`'s state

```tsx
import { getEventStatus } from "@/registry/components/data/event-card-01";

// Pattern 1 — close registration only when event has expired:
<RegistrationCard01
  capacity={event.capacity}
  registered={event.registered}
  closed={getEventStatus(event) === "expired"}
  onRegister={handleRegister}
/>

// Pattern 2 — close registration when event is expired OR ongoing
// (no walk-ins after the event starts):
<RegistrationCard01
  capacity={event.capacity}
  registered={event.registered}
  closed={["expired", "ongoing"].includes(getEventStatus(event))}
  onRegister={handleRegister}
/>
```

### Capacity-less webinar (no quota)

```tsx
<RegistrationCard01
  heading="Sign up"
  onRegister={handleRegister}
  // no capacity / registered — bar hides, status stays "open"
/>
```

### Fundraising goal (relabeled)

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

### Custom actions cluster (replaces default share)

```tsx
import { ShareBar01 } from "@/registry/components/marketing/share-bar-01";

<RegistrationCard01
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
/>
```

## Public helper kernel — `deriveRegistrationStatus`

Pure function, no React imports. Use for header counters, calendar coloring, filter logic, deterministic tests:

```tsx
import { deriveRegistrationStatus } from "@/registry/components/data/registration-card-01";

// Header counter
const stillOpen = events.filter((e) => {
  const status = deriveRegistrationStatus({
    capacity: e.capacity,
    registered: e.registered,
    closed: e.regClosed,
  });
  return status !== "full" && status !== "closed";
}).length;
```

## State machine

| Status | Trigger | CTA label | CTA variant | CTA disabled |
|---|---|---|---|---|
| `open` | < `lastSpotsRatio` full (default 80%) | `labels.ctaRegister` | `default` | no |
| `lastSpots` | ≥ `lastSpotsRatio` full | `labels.ctaRegister` | `default` | no |
| `full` | `registered ≥ capacity` | `labels.ctaSoldOut` | `secondary` | yes |
| `closed` | `closed: true` | `labels.ctaClosed` | `secondary` | yes |

Plus when **`onRegister` is undefined** → CTA renders disabled with `labels.ctaUnavailable` (useful for preview / admin contexts).

## Configurable thresholds

| Prop | Default | Drives |
|---|---|---|
| `lastSpotsRatio` | `0.8` | State machine — fraction of capacity at which status flips to `lastSpots` |
| `urgentSpotsCount` | `10` | Visual color — absolute spots-left count at which the counter flips to `text-destructive` |

Semantically distinct: ratio for state, count for color. For 100-capacity events, 80% means 20 left (not yet urgent). For 50-capacity events, 80% means 10 left (urgent).

## Plural-correct suffix — `formatSpotsLeftSuffix`

The default English suffix word ("spots left") is now produced by an `Intl.PluralRules`-driven callback rather than a static label. At count `=== 1` you get "spot left"; otherwise "spots left".

Override the callback for non-English locales whose plural rules differ from English:

```tsx
<RegistrationCard01
  capacity={100}
  registered={99}
  formatSpotsLeftSuffix={(count) => {
    const rules = new Intl.PluralRules("ru");
    switch (rules.select(count)) {
      case "one": return "место осталось";
      case "few": return "места осталось";
      default:    return "мест осталось";
    }
  }}
  onRegister={handleRegister}
/>
```

The legacy `labels.spotsLeftSuffix` string still works (used as a constant suffix for every count) but is `@deprecated` — it produces ungrammatical "1 spots left" output and doesn't vary by count. Prefer the callback for any new integration.

Resolution priority (highest first):
1. `formatSpotsLeftSuffix` (callback prop) — wins
2. `labels.spotsLeftSuffix` (deprecated static suffix) — back-compat
3. Default Intl.PluralRules-based English

## Item shape — soft-failure

| Field | Required | Behavior when absent |
|---|---|---|
| `capacity` + `registered` | optional | No-quota mode: bar + counter rows hide; status stays `open` (or `closed` if `closed: true`) |
| `closed` | optional, default `false` | Falls through to capacity logic |
| `onRegister` | optional | CTA renders disabled with `ctaUnavailable` label |
| `onShare` | optional | No default share button rendered |
| `actions` | optional | Wins over `onShare` (full takeover); when both absent, no secondary row |

## Frame + heading

| Prop | Default | Effect |
|---|---|---|
| `framed` | `true` | Wraps in `bg-card rounded-2xl p-6 border border-border/50 shadow-lg` (sidebar elevation). Pass `false` for embedded use. |
| `heading` | none | Optional section heading. Section gets `aria-labelledby={headingId}` only when supplied. |
| `headingAs` | `h3` | Sidebar cards typically nest under page `h2`. Bump via `h2`/`h4` as needed. |

## Accessibility

- `<section aria-labelledby={headingId}>` when `heading` is supplied (id from `useId`).
- Inner Radix `Progress` emits `role="progressbar"` + `aria-valuemin=0` / `aria-valuemax=100` / `aria-valuenow={percent}`.
- `aria-label={labels.ariaLabel}` on the bar.
- Primary CTA: shadcn Button handles `disabled` → `aria-disabled` automatically.
- Share2 icon `aria-hidden`; share button accessible-name = `labels.ctaShare`.

## Performance

- `React.memo` at export — pass stable props for best results.
- Status + percent + isUrgent derivation memoized.
- No effects, no async, no internal `setInterval` — pure presentation.

## Migration origin

Ported from kasder `kas-social-front-v0` `src/app/(platform)/events/[id]/page.tsx` lines 237–274 (the "Kayıt Durumu" sidebar card). Notable rewrites:

| Source | Pro-comp |
|---|---|
| Cross-couples to `event.status` from event-card | Independent `closed: boolean` prop; host owns the date logic |
| Hardcoded `spotsLeft <= 10` destructive color | Configurable `urgentSpotsCount` prop (default 10) |
| Inline JSX 3-branch ternary for CTA dispatch | Sealed `getCtaConfig(status, hasOnRegister, labels)` function |
| Hardcoded Turkish heading + labels | `heading` + 11-key `labels` object (English defaults) |
| Single share button (Share2 + "Paylaş") | Default share when `onShare` provided; `actions` slot for custom clusters |
| No `closed` semantic — implicit via "expired event" branch | First-class `closed: boolean` + `ctaClosed` label |
| No state-machine helper | Public `deriveRegistrationStatus` exported as pure function |
