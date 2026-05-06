# event-card-01 — procomp guide

> Stage 3: how to use it. Authored alongside the implementation.
>
> See [`event-card-01-procomp-description.md`](./event-card-01-procomp-description.md) for *why* and [`event-card-01-procomp-plan.md`](./event-card-01-procomp-plan.md) for *how*.

## When to use

- Community / association event listings where the card needs to communicate live, time-and-capacity-aware status.
- Mixed feeds where event items appear alongside news, posts, or other content — the `feed` variant is calibrated for that.
- Conference / training / webinar / meetup listing pages.
- Event sidebars, related events, "happening this week" rails.
- Anywhere an event needs a status-driven CTA (Register / Join / Sold Out / View Details) without the consumer wiring up the dispatch logic.

## When NOT to use

- **Static event listings with no status semantics** — a plain card without the state machine is lighter; use `content-card-news-01` or a custom card.
- **Event detail pages** (speakers, schedule, organizer, requirements) — that's a future `event-detail-page-01` sibling.
- **Calendar grids** — wrong shape; render the event as a small bar in a day cell. You CAN reuse this card's helpers (`getEventStatus` + `EVENT_STATUS_CONFIG`) for color-coding, though.
- **Registration forms inside the card** — text-selection inside form fields collides with the overlay-link pattern. Drop a real register button into `actions` instead, opening a dialog elsewhere.

## Composition patterns

### Grid page (the canonical use case)

```tsx
<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
  {events.map((event) => (
    <EventCard01
      key={event.id}
      event={event}
      variant="grid"
      href={`/events/${event.id}`}
      typeStyles={typeStyles}
    />
  ))}
</div>
```

### Dense list (sidebar / dashboard)

```tsx
<div className="rounded-2xl border bg-card max-w-3xl">
  {events.map((event) => (
    <EventCard01
      key={event.id}
      event={event}
      variant="list"
      href={`/events/${event.id}`}
      typeStyles={typeStyles}
    />
  ))}
</div>
```

The `list` variant is event-specific in design — instead of news/list's category + relative-time + excerpt, every row packs **status badge + type badge + title + 4-icon meta row (date / time / location / spots-left) + status-aware right indicator** (days-until count for upcoming, "Live now" pulsing pill for ongoing, chevron for ended). The right slot is fixed-width so the eye-sweep across a long list aligns. Featured rows get `border-l-4 border-primary`. No description block — the inline meta IS the value-add.

Use list when:
- Sidebar of upcoming events on a homepage / dashboard
- "Events you've registered for" account page
- Compact admin / moderator listings
- Mixed-content feeds where event rows need to be denser than `feed`

### Compact sidebar widget (text-only, "Upcoming events")

```tsx
<aside className="rounded-2xl border bg-card p-2 max-w-md">
  <h3 className="text-base font-semibold px-3 pt-3 pb-2">Upcoming events</h3>
  {events.slice(0, 4).map((event) => (
    <EventCard01
      key={event.id}
      event={event}
      variant="compact"
      href={`/events/${event.id}`}
      typeStyles={typeStyles}
    />
  ))}
  <div className="text-center pt-3 pb-2">
    <a href="/events" className="text-sm text-muted-foreground hover:text-primary">
      All events →
    </a>
  </div>
</aside>
```

Use `compact` when you want a text-only minimal listing — homepage sidebar, dashboard widget, email digest, mobile drawer. No thumbnail, no status badge, no capacity bar; just title + type pill + 3 stacked meta lines (date / time / location).

The compact variant trades information richness for density — if you want the status state machine visible per row, use `list` instead. If you want both context and image, use `grid` or `feed`.

### Mixed feed (events + other content types)

```tsx
<div className="space-y-4 max-w-3xl mx-auto">
  {feedItems.map((item) =>
    item.kind === "event" ? (
      <EventCard01
        key={item.id}
        event={item}
        variant="feed"
        href={`/events/${item.id}`}
      />
    ) : (
      <NewsFeedCard key={item.id} item={item} />
    ),
  )}
</div>
```

### With Next.js (or other framework Link)

```tsx
import NextLink from "next/link";

<EventCard01
  event={event}
  variant="grid"
  linkComponent={NextLink}
  getHref={(e) => `/etkinlik/${e.slug}`}
/>;
```

The card uses `linkComponent` polymorphically — works with `next/link`, `@remix-run/react` Link, `react-router-dom` Link, plain `<a>`, or even `"div"` for non-navigable preview states.

### Live-clock host

For minute-accurate status updates (events flipping from `upcoming` → `ongoing` → `expired` while the user watches), drive `now` from a parent:

```tsx
function LiveEvents({ events }: { events: EventCardItem[] }) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {events.map((e) => (
        <EventCard01
          key={e.id}
          event={e}
          variant="grid"
          href={`/events/${e.id}`}
          now={now}
        />
      ))}
    </div>
  );
}
```

The card has no internal `setInterval` — the consumer drives the cadence, which keeps the card SSR-safe and lets you choose 1-minute / 5-minute / 1-hour update windows.

## Public helper kernel — use without rendering the card

The dynamicity-and-reusability kernel: the four helpers exported alongside the component let you derive status, format dates, and compute days-until WITHOUT a card render.

```tsx
import {
  getEventStatus,
  EVENT_STATUS_CONFIG,
  formatEventDate,
  getDaysUntilEvent,
  type EventStatus,
} from "@/registry/components/data/event-card-01";
```

### Header counter

```tsx
const liveCount = events.filter((e) => getEventStatus(e) === "ongoing").length;
return <span>{liveCount} live now</span>;
```

### Calendar day-cell color coding

```tsx
function DayCell({ events, day }: { events: EventCardItem[]; day: Date }) {
  const todays = events.filter((e) => sameDay(e.date, day));
  const hasOngoing = todays.some((e) => getEventStatus(e, day) === "ongoing");
  const hasFull = todays.some((e) => getEventStatus(e, day) === "full");
  return (
    <div
      className={
        hasOngoing
          ? "bg-accent/30"
          : hasFull
            ? "bg-destructive/10"
            : "bg-transparent"
      }
    >
      {todays.length > 0 && <span>{todays.length}</span>}
    </div>
  );
}
```

### Status filter logic (search + filter pages)

```tsx
const filteredByStatus = events.filter((e) => {
  if (filter === "all") return true;
  return getEventStatus(e) === filter;
});
```

### Deterministic tests

```ts
import { describe, expect, it } from "vitest";
import { getEventStatus } from "@/registry/components/data/event-card-01";

const fixedNow = new Date("2026-06-01T12:00:00Z");

it("derives lastSpots when ≥80% capacity", () => {
  expect(
    getEventStatus(
      {
        id: "1",
        title: "Test",
        type: "Webinar",
        date: "2026-06-15",
        capacity: 100,
        registered: 85,
      },
      fixedNow,
    ),
  ).toBe("lastSpots");
});
```

## Soft-failure (which fields are required)

| Field | Required | Behavior when absent |
|---|---|---|
| `id` / `title` / `type` / `date` | ✅ | — |
| `endDate` | optional | Falls back to `date` (single-day) |
| `time` / `location` / `description` | optional | Meta line / description block omitted |
| `image` / `imageAlt` | optional | Tinted placeholder rendered with calendar icon |
| `capacity` + `registered` | optional | Capacity bar + spots-left counter omitted; `full` / `lastSpots` states unreachable |
| `featured` | optional | No featured treatment |

Capacity-less events are first-class — events with unlimited / drop-in capacity skip the capacity-derived states cleanly. Status falls through to time-only states (`open` / `upcoming` / `ongoing` / `expired`).

## i18n — the 17-key labels object

Every consumer-visible string is overridable. Pass a partial `labels` object; missing keys fall to English defaults:

```tsx
<EventCard01
  event={event}
  variant="grid"
  href={href}
  labels={{
    open: "Kayıt Açık",
    upcoming: "Yaklaşıyor",
    full: "Kontenjan Dolu",
    lastSpots: "Son Yerler",
    ongoing: "Devam Ediyor",
    expired: "Sona Erdi",
    daysUntilSuffix: "gün kaldı",
    ongoingIndicator: "Şu an devam ediyor",
    spotsLeftSuffix: "yer kaldı",
    spotsLeftFull: "Dolu",
    capacityAriaPrefix: "Kayıtlı",
    capacityAriaSeparator: "/",
    ctaRegister: "Kayıt Ol",
    ctaJoin: "Katıl",
    ctaViewDetails: "Detayları Gör",
    ctaSoldOut: "Kontenjan Dolu",
    featuredAriaLabel: "Öne çıkan etkinlik",
  }}
  formatDate={(d) =>
    new Date(d).toLocaleDateString("tr-TR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    })
  }
/>
```

The `capacityAriaPrefix` + `capacityAriaSeparator` split is intentional — without separating them, a Turkish consumer overriding only the prefix gets `"Kayıtlı: 142 of 200"` (half-translated). Both pieces are localizable.

## Theming the type badge

`typeStyles` is a `Record<string, { className: string }>` keyed by `event.type`. Use any Tailwind classes — pro-ui tokens (`bg-primary`, `bg-chart-3`, etc.), Tailwind palette colors, or arbitrary OKLCH:

```tsx
const typeStyles = {
  Conference: { className: "bg-primary/10 text-primary border-primary/20" },
  Webinar: { className: "bg-chart-3/10 text-chart-3 border-chart-3/20" },
  Workshop: {
    className:
      "bg-[oklch(0.95_0.04_45)] text-[oklch(0.45_0.18_45)] dark:bg-[oklch(0.25_0.06_45)] dark:text-[oklch(0.85_0.16_45)]",
  },
};
```

If `event.type` doesn't have a matching key, the badge falls to `bg-muted`.

## Featured treatment

Set `featured: true` on the event:
- **Grid variant:** `border-t-4 border-primary` on the card chrome + a `<Star>` icon prefix on the title (with `aria-label="Featured event"`)
- **Feed variant:** `ring-2 ring-primary ring-inset` on the card chrome + the same star prefix

Both treatments work with `expired` status (the card fades but keeps the featured chrome). For layout-level featured treatment (bigger card, separate slot above the grid), wrap externally — the card itself doesn't grow.

## Actions slot — overlay-link pattern

Drop nested interactive buttons (Save / Share / Calendar / etc.) into `actions`:

```tsx
<EventCard01
  event={event}
  variant="grid"
  href={href}
  actions={
    <>
      <Button
        size="sm"
        variant="secondary"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          saveEvent(event.id);
        }}
        aria-label="Save event"
      >
        <Bookmark className="size-4" aria-hidden="true" />
      </Button>
      <Button
        size="sm"
        variant="secondary"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          exportToCalendar(event);
        }}
        aria-label="Add to calendar"
      >
        <CalendarPlus className="size-4" aria-hidden="true" />
      </Button>
    </>
  }
/>
```

**Critical:** every action button must call `e.preventDefault()` + `e.stopPropagation()` in its onClick handler. Without that, clicks bubble to the wrapping link and navigate.

The actions cluster sits at `z-10` over the link overlay (`z-0`). Tab order: card-link → action1 → action2 → next card.

When `actions` is supplied:
- Grid variant: actions move to top-right of the image area; type badge moves to bottom-right
- Feed variant: actions replace the days-until pill in the top-right of the content overlay

## CTA semantics — decorative by design

The CTA at the foot of the card is **decorative** — clicking it just fires the wrapping link overlay. It exists for visual affordance + status communication, not for distinct interaction. The label varies by status:

| Status | Default CTA label | shadcn Button variant |
|---|---|---|
| `open` / `upcoming` / `lastSpots` | "Register" | `default` |
| `ongoing` | "Join" | `default` |
| `full` | "Sold out" | `secondary` |
| `expired` | "View details" | `outline` |

For a REAL register button that opens a dialog or fires its own action, drop one in the `actions` slot — that's the interactive surface.

## Accessibility

- Whole card is one `<a>` link with `aria-labelledby={titleId}` (computed via `useId`) — accessible name is the event title.
- All decorative icons (`Calendar`, `Clock`, `MapPin`, `Users`, status icons, `Star`, `ArrowRight`) are `aria-hidden="true"`.
- Status differentiated by **both color and icon** — color-blind safe (4.5:1 contrast on all status combinations).
- `motion-safe:` prefix on all transforms + the ongoing-status pulse — reduced-motion users see static cards.
- Capacity bar carries `aria-label={\`${capacityAriaPrefix}: ${registered} ${capacityAriaSeparator} ${capacity}\`}` — screen-reader announces the registration state.
- Featured-star icon `aria-hidden`; the announcement comes from a sibling `<span className="sr-only">`.

## Performance

- Wrapped in `React.memo` at export — pass stable `event` references from upstream to avoid re-render churn.
- Status + days-until + formatted-date all `useMemo`'d over their inputs.
- No internal `setInterval` — pass a controlled `now` if you need live updates; otherwise statuses derive once at render.
- Image uses `loading="lazy"` by default. Pass `loading="eager"` if the card is above the fold.

## Customization escape hatches

| Need | How |
|---|---|
| Wrap image in a CDN component | Pass `imageClassName` (e.g., `imageClassName="aspect-video"`) |
| Override title font (e.g., serif) | Pass `titleClassName="font-serif"` |
| Override card chrome | Pass `className="rounded-3xl border-2"` |
| Override the link's accessible name | Pass `ariaLabel="Custom name"` (overrides `aria-labelledby`) |
| Preview a status (admin / what-if UI) | Pass `statusOverride="open"` |
| Use the helpers without the card | Import `getEventStatus` / `EVENT_STATUS_CONFIG` / etc. |

## Migration origin

This component started as a port from the kasder `kas-social-front-v0` project — the original `EventCard.tsx` (grid variant) + `SocialEventCard.tsx` (feed variant). See [`docs/migrations/event-card-01/`](../../migrations/event-card-01/) for the full extraction analysis: design DNA preserved, structural debt rewritten, dependency audit, and the `--warning` token addition that landed alongside this card.

Notable rewrites from the source:
- Hardcoded `next/link` → polymorphic `linkComponent` slot
- Hardcoded `tr-TR` formatter → `formatDate` callback (with English default)
- Turkish strings → 17-key `labels` object (with English defaults)
- Missing `--warning` token (kasder used `bg-warning` as if it existed) → wired in pro-ui's `globals.css`
- Featured pill bottom-right → top accent border + title star prefix (frees image corners; works in both variants)
- Helpers inlined in the card → exported as a public kernel
- Hardcoded `setInterval` for live status → `now` injection (consumer-controlled)
