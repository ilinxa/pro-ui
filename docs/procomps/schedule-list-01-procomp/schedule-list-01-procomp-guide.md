# schedule-list-01 — procomp guide

> Stage 3: how to use it.

## When to use

- Conference / event programs (the kasder use case)
- Course curricula / lesson plans
- Podcast / broadcast schedules
- Meeting agendas / sprint planning
- Recipe steps with timing

## When NOT to use

- **Tabular data with multiple parallel columns** — use `data-table`.
- **Calendar / day-cell view** — different layout primitive.
- **Inline-edit / drag-reorder** — different component class.

## Composition patterns

### Conference program (the canonical use case)

```tsx
<ScheduleList01 heading="Program" items={event.schedule} />
```

### Bare rows in a sidebar widget

```tsx
<aside className="rounded-2xl border bg-card p-4">
  <ScheduleList01
    heading="Today"
    headingAs="h3"
    framed={false}
    items={today.items}
  />
</aside>
```

### Clickable items (link to talk detail pages)

```tsx
import NextLink from "next/link";

<ScheduleList01
  heading="Conference Day 1"
  items={items.map((item) => ({ ...item, href: `/talks/${item.id}` }))}
  linkComponent={NextLink}
/>;
```

### Custom row renderer (speaker-augmented)

```tsx
<ScheduleList01
  items={items}
  renderItem={(item) => (
    <div className="flex gap-4 ...">
      <span className="w-20 font-bold text-primary">{item.time}</span>
      <Avatar src={speakers[item.id]?.image} />
      <div>
        <h4>{item.title}</h4>
        <p>{item.description}</p>
      </div>
    </div>
  )}
/>
```

## Item shape — soft-failure contract

| Field | Required | Behavior when absent |
|---|---|---|
| `id` / `time` / `title` | ✅ | — |
| `endTime` | optional | Time renders as just `${time}` (no separator) |
| `description` | optional | Description block omitted |
| `icon` | optional | Icon column omitted |
| `href` | optional | Row stays non-interactive |

## i18n

```tsx
<ScheduleList01
  items={items}
  labels={{
    timeRangeSeparator: " → ",     // default " - "
    emptyText: "Henüz program eklenmedi.",  // default "No items scheduled."
  }}
/>
```

## Frame toggle

- `framed: true` (default) — each row gets `bg-card rounded-xl border` chrome, rows spaced `space-y-4`.
- `framed: false` — chrome dropped, rows tighten to `space-y-2`. Use inside container cards (sidebars, modals) where outer chrome already exists.

## Custom rendering

| Slot | When to reach for it |
|---|---|
| `renderItem(item)` | Replace the entire row layout (e.g. embed speaker avatar, status badge, per-item actions) |
| `renderTime(item)` | Replace just the time-string renderer (e.g. transform "09:00" → "9:00 AM"). Used inside the default row when `renderItem` is not supplied. |
| `emptyState` | Custom empty placeholder. Wins over `labels.emptyText`. |

## Accessibility

- Renders `<ol role="list">` — schedules ARE ordered.
- `<section aria-labelledby={headingId}>` when `heading` is supplied; heading id auto-generated via `useId`.
- Decorative icons get `aria-hidden="true"`.
- Linked rows: link's accessible name is the item title (`aria-label={item.title}`); link rectangle covers the whole row via overlay-link pattern.
- All hover transitions gated via `motion-safe:` prefix.
- Heading levels: `h2` default; configurable via `headingAs`.

## Performance

- `React.memo` at export boundary — pass stable `items` references to avoid re-render churn.
- `useMemo` over the labels merge.
- No internal effects, no async work — pure presentation.

## Migration origin

Ported from kasder `kas-social-front-v0` `src/app/(platform)/events/[id]/page.tsx` lines 197–213. Notable rewrites:
- Hardcoded `event.schedule` → `items` prop with explicit shape
- Inline JSX rows → sealed `parts/schedule-row.tsx` reusable presentational
- No section heading semantic → `<section aria-labelledby>` + configurable heading level
- No icons / time-range / link support → all opt-in via item shape
- Hardcoded Turkish heading "Program" → `heading` prop with no default
- `<div>` per row → semantic `<ol>` / `<li>`
