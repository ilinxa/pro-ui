# event-card-01 — procomp description

> Stage 1: what & why. The "should we build this at all?" doc.
>
> **Migration origin:** [`docs/migrations/event-card-01/`](../../migrations/event-card-01/) (kasder `kas-social-front-v0` `EventCard.tsx` + `SocialEventCard.tsx`)
>
> **Locked-in intake decisions:** [`source-notes.md` § Locked-in decisions](../../migrations/event-card-01/source-notes.md#locked-in-decisions-signed-off-2026-05-02). Extraction analysis: [`analysis.md`](../../migrations/event-card-01/analysis.md).
>
> Family: events-domain set begins here. Future siblings — `events-grid-layout-01` (search + filter + infinite scroll over a card array, mirrors `grid-layout-news-01`), `event-detail-page-01` (deferred). All independent, fully compatible, dynamic — same convention as the news-domain family.

## Problem

Event-listing pages need to surface the **status** of each event at a glance — is it accepting registrations, almost full, sold out, happening right now, or already over? — and that status is derived from real-time clock + capacity, not just the event's own data. The card has to communicate this visually (badge color, icon, animation), encode it semantically (a11y, screen-reader announcements), AND drive the call-to-action (Register / Join / View Details / Sold Out). Plus the same event data shape needs to render in three very different surfaces: a **grid** (image-on-top magazine card), a **feed** (full-bleed image background, content overlaid white-on-dark), and a **list** (dense info-rich row for sidebars / dashboards). Building these ad-hoc per project means duplicating the status state machine + helpers, drifting visually between layouts, and re-solving i18n / polymorphic linking / overlay-link a11y every time.

Pro-ui has no existing answer here. `content-card-news-01` is editorial (passive read-link, no status, no capacity, no CTA semantics). `data-table` is tabular. Nothing in the registry renders an event preview with status-aware visuals + capacity bar + CTA in two calibrated layouts driven by a single prop.

## In scope

- **3 visual variants** dispatched via a single `variant` prop — `grid` (image-on-top) / `feed` (full-bleed background) / `list` (dense info-rich row).
- **Public status kernel** — four pure helper functions exported as part of the component's API: `getEventStatus(event, now?)`, `EVENT_STATUS_CONFIG`, `formatEventDate(date, locale?)`, `getDaysUntilEvent(date, now?)`. Consumers can derive status independently for header counters, calendar coloring, filter logic, deterministic tests — without re-implementing.
- **6-state status machine** — `expired` / `ongoing` / `upcoming` / `open` / `full` / `lastSpots`. Time-window first (now > endDate → expired; now ∈ [start, end] → ongoing), then capacity (full / lastSpots), then time-proximity (upcoming if ≤ 7 days). Each status drives a color, an icon, and a CTA label.
- **Dynamic content** — every consumer-visible string, color, format, behavior is overridable: `labels` object (17 keys), `typeStyles` map, `formatDate` callback, `linkComponent` polymorphism, `getHref` callback, `actions` slot, `now?: Date` injection, `statusOverride?` for preview states.
- **Polymorphic root** — works with plain `<a>`, Next.js `Link`, Remix `Link`, react-router `Link`, or no link wrapper.
- **Overlay-link pattern from day 1** — clickable whole-card surface that doesn't lock out nested interactives (register-in-place, add-to-calendar, share, save). Same pattern as `content-card-news-01`.
- **Optional `actions` slot** for those nested interactives, with status-cascade-aware positioning so the type badge yields top-right when actions are supplied.
- **Content-shape soft-failure** — only `id` + `title` + `date` + `type` are required; `description` / `endDate` / `time` / `location` / `image` / `capacity` + `registered` / `featured` all optional and gracefully omitted. **Capacity-derived status states (`full` / `lastSpots`) are SKIPPED when capacity/registered aren't supplied** — consumers with unlimited-capacity events get sensible defaults.
- **New design-system token** — adds `--warning` (amber) + `--warning-foreground` to `globals.css`. Reusable beyond this card (form warnings, toast variants, banner alerts, deprecating-soon badges in the docs site itself).
- **First user of shadcn `progress` primitive** — installed as part of this migration.
- **Featured treatment** — `border-t-4 border-primary` on grid card chrome / `ring-2 ring-primary ring-inset` on feed card + a `<Star>` icon prefix on the title with `aria-label`. No more bottom-right pill.
- **WCAG 2.1 AA target** — accessible-name via `aria-labelledby` + `useId`, color-AND-icon status differentiation (color-blind safe), `motion-safe:` gating, `<ul role="list">` for meta lines, capacity-bar `aria-label`, focus-visible ring on full card.

## Out of scope

- **Layout orchestration** — composing cards into grids, infinite scroll, search/filter. Defer to `events-grid-layout-01` (sibling, not yet started).
- **Registration flow / capacity mutation** — opening a register dialog, handling form submission, optimistic capacity updates. Consumer composes via the `actions` slot.
- **Live-clock auto-refresh** — the card is pure: status is computed once at render against `now ?? new Date()`. Consumers wanting minute-by-minute updates pass a controlled `now` from a parent `setInterval`. **No internal `setInterval`** — consumer controls update cadence.
- **Calendar / ICS export** — consumer-side concern, optionally surfaced via the `actions` slot.
- **Event detail page** — speakers, schedule, organizer, requirements, address. Belongs to `event-detail-page-01` (deferred), not this card.
- **`compact` / `list` / `inline` variants** beyond grid + feed — revisit when a real consumer surfaces. Two variants matches kasder's actual usage.
- **Layout-level featured treatment** — bigger card, separate slot above the grid, `featuredItem` + `renderFeatured` props. That's `events-grid-layout-01`'s job.
- **Loading skeletons** — pure presentation. Consumers handle data-loading states. v0.2 candidate if real demand surfaces.
- **CDN-aware image components** (`next/image` etc.) — consumer wraps via `imageClassName` slot.
- **Heavy animation** — Tailwind transitions + `motion-safe:` only. No framer-motion.

## Target consumers

- Community / association sites listing events (the kasder use case driving the migration)
- Conference / training-platform listings
- Internal company portals listing internal trainings, town halls, hack days
- Marketing sites listing webinars, masterclasses, workshops
- Any product feed where events are mixed with other content types (news, posts) — the `feed` variant is built for this

The consumer is a **frontend dev composing an events page or feed**, not an end user. They'll typically reach for this when they have an array of events and need the same item rendered as a magazine card in one place AND a full-bleed feed item in another, sharing all status logic.

## Rough API sketch

```ts
<EventCard01
  event={{
    id: 'a',
    title: 'Annual Knowledge Day',
    type: 'Konferans',
    date: '2026-06-15',
    endDate: '2026-06-15',
    time: '09:00 - 18:00',
    location: 'Istanbul Conference Center',
    image: '/img.jpg',
    description: 'Full-day event covering…',
    capacity: 200,
    registered: 142,
    featured: true,
  }}
  variant="grid"                     // 'grid' | 'feed'
  href="/events/a"
  linkComponent={Link}
  typeStyles={{
    Konferans: { className: 'bg-primary/10 text-primary border-primary/20' },
    Seminer: { className: 'bg-chart-3/10 text-chart-3 border-chart-3/20' },
  }}
  formatDate={(d) => myI18n.format(d, 'long')}
  labels={{
    open: 'Kayıt Açık',
    upcoming: 'Yaklaşıyor',
    daysUntilSuffix: 'gün kaldı',
    ctaRegister: 'Kayıt Ol',
    // …17 keys total, all optional partial
  }}
  actions={
    <div className="flex gap-1.5">
      <CalendarExportButton event={event} />
      <ShareButton event={event} />
    </div>
  }
  // optional escape hatches
  now={controlledNow}                // for testability / live-clock host
  statusOverride="open"              // rare — for preview / what-if states
  getHref={(event) => `/etkinlik/${event.slug}`}  // alternative to href
/>
```

5 props are most-used: `event`, `variant`, `href`, `linkComponent`, `actions`. The rest are escape hatches for i18n, deterministic-status tests, capacity-less events, and consumer-defined type taxonomies.

## Public helper exports (the kernel)

These are exported alongside `EventCard01` from the package — consumers can use them WITHOUT rendering the card:

```ts
import {
  EventCard01,
  getEventStatus,         // (event, now?) => EventStatus
  EVENT_STATUS_CONFIG,    // Record<EventStatus, { label, icon, className }>
  formatEventDate,        // (dateString, locale?) => string
  getDaysUntilEvent,      // (dateString, now?) => number
  type EventStatus,
  type EventCardItem,
  type EventCard01Labels,
} from '@ilinxa/event-card-01';

// Use the kernel without the card:
const liveCount = events.filter((e) => getEventStatus(e) === 'ongoing').length;
const dayColor = (d: Date) =>
  events.some((e) => getDaysUntilEvent(e.date, d) === 0)
    ? 'bg-primary/20'
    : 'bg-transparent';
```

This is the dynamicity-and-reusability story made concrete: **the helpers ARE the kernel; the card is one consumer of them.**

## Example usages

**1. Events grid page — the primary kasder use case:**

```tsx
<div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
  {events.map((event) => (
    <EventCard01
      key={event.id}
      event={event}
      variant="grid"
      href={`/events/${event.id}`}
      linkComponent={NextLink}
      typeStyles={typeStyles}
      labels={trLabels}
      formatDate={formatTr}
    />
  ))}
</div>
```

**2. Mixed social feed — the SocialEventCard use case:**

```tsx
<div className="space-y-4">
  {feedItems.map((item) =>
    item.kind === 'event' ? (
      <EventCard01
        key={item.id}
        event={item}
        variant="feed"
        href={`/events/${item.id}`}
        linkComponent={NextLink}
      />
    ) : (
      <NewsFeedCard key={item.id} item={item} />
    )
  )}
</div>
```

**3. Card with calendar-export + share actions** (overlay-link pattern):

```tsx
<EventCard01
  event={event}
  variant="grid"
  href={`/events/${event.id}`}
  linkComponent={NextLink}
  actions={
    <div className="flex gap-1.5">
      <button onClick={() => exportToICS(event)} aria-label="Add to calendar">
        <CalendarPlus className="h-4 w-4" />
      </button>
      <button onClick={() => share(event)} aria-label="Share">
        <Share2 className="h-4 w-4" />
      </button>
    </div>
  }
/>
```

The `actions` cluster sits at `relative z-10` over the link overlay — clicking a button does NOT navigate; the rest of the card surface still does. When `actions` is present, the type badge yields its top-right slot to actions and moves to bottom-right.

**4. Live-clock host driving controlled `now` for minute-accurate status:**

```tsx
function LiveEventsList({ events }: { events: EventCardItem[] }) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  return events.map((e) => (
    <EventCard01 key={e.id} event={e} variant="grid" href={`/events/${e.id}`} now={now} />
  ));
}
```

The card has no internal `setInterval` — consumer drives the cadence.

**5. Calendar day-cell using only the kernel, no card:**

```tsx
import { getEventStatus, EVENT_STATUS_CONFIG } from '@ilinxa/event-card-01';

function DayCell({ events, day }: { events: EventCardItem[]; day: Date }) {
  const todays = events.filter((e) => sameDay(e.date, day));
  const hasOngoing = todays.some((e) => getEventStatus(e, day) === 'ongoing');
  return (
    <div className={hasOngoing ? 'bg-accent/30' : ''}>
      {todays.length > 0 && <span>{todays.length}</span>}
    </div>
  );
}
```

Pure-helper composition, zero card render, zero React tree.

## Success criteria

- Both variants render correctly: `grid` in 1/2/3-column responsive grids; `feed` single-column at any width down to mobile.
- All 6 statuses derive correctly from clock + capacity in unit-testable isolation (helpers are pure functions of `(event, now)`).
- Whole card is clickable AND nested `actions` are independently clickable (overlay-link pattern works in both variants).
- Whole card receives focus-visible ring (not just the invisible link rectangle) — screen reader announces the title as the link's name.
- Card omits gracefully when `description` / `endDate` / `time` / `location` / `image` / `featured` are missing.
- Card with no `capacity` / `registered` skips capacity-derived states (`full` / `lastSpots`) and skips the progress bar entirely; status falls through to time-only states.
- Type badge yields top-right slot to `actions` when supplied; reverts when not.
- Featured treatment — top accent border (grid) / inset ring (feed) + star prefix on title — works in both variants without conflict.
- TypeScript: prop types are strict; `EventCardItem` shape is enforced; `variant` is a literal union; `EventStatus` is exported.
- Public helpers are pure and tree-shakeable (no React imports, no DOM access).
- `pnpm tsc --noEmit` + `pnpm lint` + `pnpm build` clean.
- SSR `/components/event-card-01` returns 200 with all 6 demo tabs rendered.
- `--warning` token wired in [globals.css](../../../src/app/globals.css) (light + dark + `@theme inline` mappings) — verifiable via `bg-warning` / `text-warning-foreground` Tailwind utilities resolving correctly in the docs site.

## Open questions

1. **Component export name.** `EventCard01` (verbose, version-explicit, future-proof for `event-card-02` if a richer schema emerges). **Resolved:** `EventCard01` — matches the `<Slug><NN>` convention already established by `content-card-news-01`, `page-hero-news-01`, etc.
2. **`now?: Date` injection — opt-in or always-required?** Always-optional. Default is `new Date()` at render. The few consumers who need deterministic status (tests, live clock, calendar) opt in. **Resolved:** optional with sensible default.
3. **Capacity-less events behavior.** What does the card render when `capacity` and `registered` are both `undefined`? **Resolved:** progress bar is hidden entirely; status logic skips `full` / `lastSpots`; CTA reverts to plain "Register" / "View Details" / "Ended" without sold-out branch. Documented in the soft-failure contract.
4. **`statusOverride` — first-class prop or escape hatch only?** First-class but rare. Use case: previewing event-card states in admin UIs / preview-mode pages. **Resolved:** include in v0.1; type-checked against `EventStatus` union; documented as "rare — prefer letting the helper derive."
5. **`feed` variant featured treatment** — `border-t-4` doesn't work on the full-bleed image background. **Resolved (analysis):** `ring-2 ring-primary ring-inset` on the card chrome. Visible against dark image, no layout shift, mirrors the grid's "lift" semantic. Confirmed in plan if any conflict surfaces.
6. **Title font — sans or serif?** **Resolved:** sans (default `--font-sans`, Onest). Events are utilities (when/where/how-to-register), not editorial. Differs intentionally from `content-card-news-01` (which uses `--font-serif`).
7. **`actions` slot positioning per variant.** Grid: top-right of image area when supplied (pushes type badge to bottom-right). Feed: top-right of the content overlay area. **Resolved:** documented in plan; visual contract preserved.
8. **CTA decoration vs interaction.** **Resolved:** decorative `<div role="button">` styled like a real Button — clicking it just fires the wrapping link; consumers wanting a real Register button drop one in `actions`.
9. **Helper API stability.** Exporting `getEventStatus` / `EVENT_STATUS_CONFIG` / `formatEventDate` / `getDaysUntilEvent` widens the public surface — breaking changes here become breaking changes for consumers using the kernel without the card. **Open** — locking the signatures now is fine (they're tiny + pure), but flag in usage.tsx that the kernel is the contract; future internal refactors must preserve them.
10. **Loading skeleton.** Should the card ship a `<EventCard01.Skeleton variant="grid" />` for loading states? **Open** — v0.1 ships without; consumers render a `bg-muted` placeholder. v0.2 candidate if real demand surfaces.

---

**Stage 1 contract:** if you sign off on the above, the plan doc (`event-card-01-procomp-plan.md`) will lock down: file shape, type definitions, prop/state/effect/render flow per variant, helper signatures, design-system token wiring, demo plan, success-gate verification steps, and known plan deviations to flag during implementation.
