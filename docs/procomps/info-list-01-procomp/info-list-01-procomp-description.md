# info-list-01 — procomp description

> Stage 1: what & why.
>
> **Migration origin:** kasder `kas-social-front-v0` `src/app/(platform)/events/[id]/page.tsx` lines 276–336 (the "Etkinlik Bilgileri" + "İletişim" sidebar cards on the event detail page). Two visual patterns from the same page collapse into one component via a `variant` prop.

## Problem

Sidebar info cards — Event Details, Contact Info, Address Info, Account Settings, Specs, Restaurant Info, Profile Attributes, "About this listing" — all share the same anatomy: card chrome + heading + vertical list of icon + content rows. The two visual flavors that show up everywhere are:

- **Comfortable** — icon `w-5 h-5 text-primary` + bold primary line + muted secondary line + optional action (e.g. "View on map →"). Separators between rows. Used for the kasder Event Details card.
- **Compact** — icon `w-4 h-4 text-muted-foreground` + single inline text/link. No separators. Used for the kasder Contact card.

Every project re-implements both patterns inline. Pro-ui has no answer — `thumb-list-01` is image-led, `article-meta-01` is horizontal flex strip, `schedule-list-01` is time-anchored.

## In scope

- **Single component, two variants** — `variant: "comfortable" | "compact"` — covers both kasder patterns + most variations seen elsewhere
- **Per-item shape** — `icon` (required), `primary` (required), `secondary` (optional), `action` (optional ReactNode for buttons / links below the row), `href` (optional — wraps `primary` in a polymorphic link)
- **Polymorphic root** for clickable items via `linkComponent: ElementType` (default `"a"`) — works with `tel:` / `mailto:` / `https://` schemes consumers prefix themselves
- **Frame toggle** — `framed: true` default (card chrome) / `false` (bare for embedded use)
- **Separator toggle** — `separated: boolean` (default: `true` for comfortable / `false` for compact) — between-rows divider via CSS border, not a `<Separator>` component
- **Optional heading** — text + configurable level (`headingAs: "h2" | "h3" | "h4"`, default `h3`)
- **Empty state** — `emptyState?: ReactNode` slot OR fallback `labels.emptyText`
- **Custom renderItem** — bypass the default row layout entirely
- **a11y** — `<ul role="list">` semantics; `<section aria-labelledby={headingId}>` when heading present; decorative icons `aria-hidden`; linked rows wrap `primary` in the polymorphic link with the link's accessible name = primary text content

## Out of scope

- **Editable inline values** — read-only display; for editable, use `properties-form`
- **Drag-reorder** — different component class
- **Nested / tree rows** — for nested data, use `rich-card`
- **Internal href construction** (e.g., auto-prefix `tel:`) — consumer passes full URL; keeps the API minimal
- **Density variants beyond comfortable/compact** — defer until real demand surfaces

## Target consumers

- Sidebar info cards on detail pages (the kasder Event Details / Contact use case)
- Account / settings summary panels
- Product spec sheets (dimensions / weight / materials)
- Restaurant info (hours / phone / address)
- Listing / profile attributes (ratings, member since, location)
- Order / shipment summary cards
- Footer column with contact links
- Compact "About this listing" boxes

## Rough API sketch

```ts
<InfoList01
  heading="Event Details"
  variant="comfortable"
  items={[
    {
      id: "date",
      icon: Calendar,
      primary: "May 31, 2026 — Sunday",
      secondary: "09:00 - 18:00",
    },
    {
      id: "location",
      icon: MapPin,
      primary: "Istanbul Conference Center",
      secondary: "Darülbedai Caddesi No:3, Şişli/Istanbul",
      action: (
        <Button variant="link" className="px-0">
          View on map <ExternalLink className="w-3 h-3" />
        </Button>
      ),
    },
    {
      id: "capacity",
      icon: Users,
      primary: "500-person capacity",
      secondary: "423 registered",
    },
  ]}
/>;
```

5 props are most-used: `items`, `heading`, `variant`, `framed`, `linkComponent`. `renderItem` is the escape hatch.

## Example usages

**1. Event Details card (kasder comfortable variant):**

```tsx
<InfoList01
  heading="Etkinlik Bilgileri"
  variant="comfortable"
  items={[
    { id: "date", icon: Calendar, primary: formatDate(event.date), secondary: event.time },
    { id: "location", icon: MapPin, primary: event.location, secondary: event.address, action: <MapLink href={mapUrl} /> },
    { id: "capacity", icon: Users, primary: `${event.capacity} Kişilik Kapasite`, secondary: `${event.registered} kişi kayıtlı` },
  ]}
/>
```

**2. Contact card (compact, with linked rows):**

```tsx
<InfoList01
  heading="İletişim"
  variant="compact"
  items={[
    { id: "org", icon: Building, primary: organizer.name },
    { id: "phone", icon: Phone, primary: organizer.phone, href: `tel:${organizer.phone}` },
    { id: "email", icon: Mail, primary: organizer.email, href: `mailto:${organizer.email}` },
  ]}
/>
```

**3. Bare list inside a wider section (no card chrome):**

```tsx
<aside className="rounded-2xl border bg-card p-6">
  <h2>Listing details</h2>
  <InfoList01 framed={false} variant="comfortable" items={items} />
</aside>
```

**4. Footer column with linked items:**

```tsx
<InfoList01
  variant="compact"
  framed={false}
  items={[
    { id: "phone", icon: Phone, primary: "+90 (212) 555 0123", href: "tel:..." },
    { id: "email", icon: Mail, primary: "info@example.com", href: "mailto:..." },
    { id: "address", icon: MapPin, primary: "Istanbul, Turkey" },
  ]}
  linkComponent={NextLink}
/>
```

**5. Custom renderItem (full takeover for special row, e.g. avatar):**

```tsx
<InfoList01
  items={items}
  renderItem={(item) => (
    <div className="flex gap-3">
      <Avatar src={item.avatarUrl} />
      <div>
        <p>{item.primary}</p>
        <p className="text-sm text-muted-foreground">{item.secondary}</p>
      </div>
    </div>
  )}
/>
```

## Success criteria

- Renders the kasder Event Details + Contact cards verbatim from `items` prop (no inline JSX duplication).
- `comfortable` variant: stacked content (primary bold + secondary muted + optional action), `w-5` icon in `text-primary`, separators between rows.
- `compact` variant: inline single-line content, `w-4` icon in `text-muted-foreground`, no separators.
- Linked items: `primary` wraps in polymorphic link element; non-linked items render `primary` as plain text.
- TypeScript: `InfoListItem` shape strict; `variant` literal union; `linkComponent` defaults to `"a"`.
- a11y: `<ul role="list">`, section `aria-labelledby`, decorative icons `aria-hidden`, link's accessible name = primary text.
- `pnpm tsc --noEmit` + `pnpm lint` + `pnpm build` clean; SSR returns 200.

## Open questions

1. **`<dl>` semantics vs `<ul>`?** **Resolved: `<ul role="list">`.** Icons are visual labels, not semantic terms. `<dl>` would force consumers to think of items as term/definition pairs, which doesn't fit (e.g. requirements / linked contacts have no clear term/definition split).
2. **Separators — CSS borders or `<Separator>` components?** **Resolved: CSS borders.** Cleaner DOM (no `<div>` siblings inside `<ul>`); `[&>li:not(:first-child)]:border-t` Tailwind pattern works.
3. **Should `href` auto-prefix schemes (e.g. detect `+90...` → prefix `tel:`)?** **Resolved: no.** Consumers pass full URLs; keeps the API minimal and predictable.
4. **`density: "comfortable" | "compact"` vs `variant`?** **Resolved: `variant` for symmetry with content-card-news-01 + event-card-01.** Easier to reason about in JSX.
5. **Separator default per variant?** **Resolved: comfortable defaults `separated=true`, compact defaults `separated=false`.** Mirrors the kasder source.
