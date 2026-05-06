# info-list-01 — procomp guide

> Stage 3: how to use it.

## When to use

- Sidebar info cards on detail pages (the kasder Event Details + Contact use case)
- Account / settings summary panels
- Product spec sheets (dimensions / weight / materials)
- Restaurant info (hours / phone / address)
- Listing / profile attributes (ratings, member since, location)
- Order / shipment summary cards
- Footer column with contact links

## When NOT to use

- **Tabular data with multiple parallel columns** — use `data-table`
- **Image-led list** (avatar/thumbnail + content) — use `thumb-list-01`
- **Time-anchored list** (schedule, agenda) — use `schedule-list-01`
- **Editable inline values** — use `properties-form`
- **Nested / tree data** — use `rich-card`

## Choose the variant

| | `comfortable` | `compact` |
|---|---|---|
| Icon | `w-5 h-5 text-primary` | `w-4 h-4 text-muted-foreground` |
| Layout | Stacked (primary bold + secondary muted + optional action) | Inline single-line |
| Separators | Default ON (top-border between rows) | Default OFF |
| Reads | `secondary` + `action` | Ignores `secondary` + `action` (single-line only) |
| Use for | Event Details, address blocks, capacity summary, product specs | Contact list, footer columns, dense info ticker |

## Composition patterns

### Event Details card (kasder comfortable)

```tsx
import { Calendar, MapPin, Users, ExternalLink } from "lucide-react";

<InfoList01
  heading="Etkinlik Bilgileri"
  variant="comfortable"
  items={[
    { id: "date", icon: Calendar, primary: formatDate(event.date), secondary: event.time },
    {
      id: "location",
      icon: MapPin,
      primary: event.location,
      secondary: event.address,
      action: (
        <a href={mapUrl} className="inline-flex items-center gap-1 text-sm text-primary hover:underline">
          Haritada Gör <ExternalLink className="w-3 h-3" />
        </a>
      ),
    },
    { id: "capacity", icon: Users, primary: `${event.capacity} Kişilik Kapasite`, secondary: `${event.registered} kişi kayıtlı` },
  ]}
/>
```

### Contact card (kasder compact)

```tsx
import { Building, Phone, Mail } from "lucide-react";

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

### Footer column with NextLink

```tsx
import NextLink from "next/link";

<InfoList01
  framed={false}
  variant="compact"
  items={[
    { id: "phone",   icon: Phone, primary: "+90 (212) 555 0123", href: "tel:+902125550123" },
    { id: "email",   icon: Mail,  primary: "info@example.com",   href: "mailto:info@example.com" },
    { id: "address", icon: MapPin, primary: "Istanbul, Turkey" },
  ]}
  linkComponent={NextLink}
/>
```

### Embedded inside an existing card (`framed=false`)

```tsx
<aside className="rounded-2xl border bg-card p-6">
  <h2>Listing details</h2>
  <InfoList01 framed={false} variant="comfortable" items={items} />
</aside>
```

### Custom renderItem (avatar instead of icon)

```tsx
<InfoList01
  items={speakers}
  renderItem={(item) => (
    <div className="flex items-center gap-3">
      <img src={people[item.id].image} className="w-12 h-12 rounded-full object-cover" />
      <div>
        <p className="font-medium">{item.primary}</p>
        <p className="text-sm text-muted-foreground">{item.secondary}</p>
      </div>
    </div>
  )}
/>
```

## Item shape — soft-failure

| Field | Required | Behavior when absent |
|---|---|---|
| `id` / `icon` / `primary` | ✅ | — |
| `secondary` | optional (comfortable only) | Stacked content collapses to just primary |
| `action` | optional (comfortable only) | Action block omitted |
| `href` | optional | Row stays non-interactive |

**Note on compact:** `secondary` and `action` are silently ignored — compact rows are single-line by definition. Pass them in comfortable, or use `renderItem` for richer compact rows.

## Linked rows + polymorphic linkComponent

Pass full URLs in `href` (`tel:` / `mailto:` / `https://` / etc.) — no auto-prefixing. The component wraps `primary` in `<linkComponent href={href}>` (default `<a>`).

```tsx
<InfoList01
  variant="compact"
  linkComponent={NextLink}    // or RemixLink, react-router Link, or 'a' (default)
  items={[
    { id: "doc",     icon: FileText, primary: "View Specifications", href: "/specs.pdf" },
    { id: "support", icon: Phone,    primary: "+1 (555) 0123",       href: "tel:+15550123" },
  ]}
/>
```

The link's accessible name is the visible `primary` text (no separate `aria-label` needed — WCAG 2.5.3 Label in Name passes naturally).

## Frame + separators

| Prop | Default | Effect |
|---|---|---|
| `framed` | `true` | Wraps in card chrome (`bg-card rounded-2xl p-6 border`). Pass `false` for embedded use. |
| `separated` | comfortable=`true`, compact=`false` | CSS top-border on each row except the first. Override per-need. |

## Empty state

```tsx
<InfoList01
  items={[]}
  emptyState={<p className="italic">No details available yet.</p>}
/>
// OR fall back to labels.emptyText:
<InfoList01 items={[]} labels={{ emptyText: "Nothing here yet." }} />
```

## Accessibility

- `<ul role="list">` — Safari `list-style: none` workaround.
- `<section aria-labelledby={headingId}>` when `heading` is supplied (id from `useId`).
- Decorative icons get `aria-hidden="true"`.
- Linked rows: link's accessible name = `primary` text content.
- Heading levels: `h3` default (sidebar info-cards typically nest under page `h2`).

## Performance

- `React.memo` at export — pass stable `items` references.
- `useMemo` over labels merge.
- No effects, no async — pure presentation.

## Migration origin

Ported from kasder `kas-social-front-v0` `src/app/(platform)/events/[id]/page.tsx` lines 276–336 — both the "Etkinlik Bilgileri" (comfortable) and "İletişim" (compact) sidebar cards collapse into one component via the `variant` prop. Notable rewrites:

| Source | Pro-comp |
|---|---|
| Inline `<div className="flex gap-3">` per row × 2 separate cards | Single component, two-variant dispatch |
| Manual `<Separator />` siblings between rows | CSS top-border on each `<li>` (cleaner DOM) |
| Hardcoded `tel:${phone}` / `mailto:${email}` in JSX | Consumer passes full URL via `href` (predictable) |
| Inline link buttons (`<Button variant="link">View on map</Button>`) | `action: ReactNode` slot per item — consumer composes |
| `<div>` non-list semantics | Semantic `<ul role="list">` |
