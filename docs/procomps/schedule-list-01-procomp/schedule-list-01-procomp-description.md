# schedule-list-01 — procomp description

> Stage 1: what & why.
>
> **Migration origin:** kasder `kas-social-front-v0` `src/app/(platform)/events/[id]/page.tsx` lines 197–213 (the "Program" / Schedule block on the event detail page). Source page already deep-analyzed during event-card-01 migration; intake doc skipped per session agreement.

## Problem

Conferences, courses, podcasts, broadcast schedules, meeting agendas — anywhere a time-ordered list of activities needs to render. Current pattern in kasder is inline JSX repeated per page; no shared component. Every project re-implements: row chrome, time-column rhythm, optional description rendering, time-range support, day grouping, accessible markup.

Pro-ui has no existing answer. `data-table` is tabular. `thumb-list-01` is image-led. `article-meta-01` is horizontal flex strip. `info-list-01` (next sibling) is icon-prefixed; this is time-prefixed.

## In scope

- **Vertical list** of schedule items, each: `time` (left, ~20-column) + `title` (bold) + optional `description` (muted)
- **Optional time range** — `time` + optional `endTime` rendered as "09:00 - 10:30" when both present
- **Optional section heading** with `headingAs` (h2 / h3 / h4) — consumer can omit if they wrap with their own
- **Optional per-item icon** (e.g. `Coffee` for break, `Users` for networking) — replaces nothing; sits left of the time
- **Polymorphic per-item link** via `linkComponent` + per-item `href` — items optionally clickable
- **Custom render slots** — `renderItem(item)`, `renderTime(item)` for full control
- **Frame toggle** (`framed: true` default — card chrome per row; `false` for bare rows in dense contexts)
- **Empty state** — `emptyState?: ReactNode` slot OR fallback text from labels
- **i18n** — `labels` object (heading, empty text, separator for time-range)
- **a11y** — `<ol role="list">` (ordered — order matters for schedules), each `<li>`; section `aria-labelledby` to heading id; decorative icons `aria-hidden`

## Out of scope

- **Day grouping** (multi-day schedules) — v0.2 candidate. v0.1 is single-day.
- **Live "current item" highlighting** based on `now` — v0.2 candidate. v0.1 is presentation-only.
- **Inline edit / drag-reorder** — different component class entirely.
- **Live agenda updates** (WebSocket integration) — host concern; this card just renders props.
- **Speaker chips per item** — host can compose via `renderItem` slot.

## Target consumers

- Event detail pages (the kasder use case driving the migration)
- Conference / training agendas
- Course curriculum pages (lesson schedule)
- Podcast / broadcast schedules ("9pm: News", "10pm: Talk Show")
- Meeting agendas / project standups
- Recipe / cooking step lists with timing

## Rough API sketch

```ts
<ScheduleList01
  heading="Program"
  headingAs="h2"
  items={[
    { id: '1', time: '09:00', title: 'Registration & Welcome Coffee', description: 'Check-in and networking' },
    { id: '2', time: '10:00', endTime: '10:30', title: 'Opening Keynote', description: 'Annual address' },
    { id: '3', time: '11:00', title: 'Panel: Future Cities', icon: Users },
    { id: '4', time: '13:00', title: 'Lunch', icon: Coffee, href: '/menu' },
  ]}
  linkComponent={NextLink}
  labels={{ emptyText: 'No items scheduled.' }}
  framed                                      // default true
/>;
```

5 props are most-used: `items`, `heading`, `linkComponent`, `framed`, `labels`. Custom renderers are escape hatches.

## Example usages

**1. Conference agenda (this page's use case):**

```tsx
<ScheduleList01 heading="Program" items={event.schedule} />
```

**2. Bare rows inside a sidebar widget (no per-row chrome):**

```tsx
<aside className="rounded-2xl border bg-card p-4">
  <ScheduleList01 items={today.items} framed={false} headingAs="h3" heading="Today" />
</aside>
```

**3. Clickable items linking to talk detail pages:**

```tsx
<ScheduleList01
  items={items}
  linkComponent={NextLink}
  // each item has its own href: /talks/${item.id}
/>
```

**4. Custom per-item renderer (e.g. inject a speaker avatar):**

```tsx
<ScheduleList01
  items={items}
  renderItem={(item) => (
    <div className="flex gap-4 ...">
      <span>{item.time}</span>
      <Avatar src={item.speakerImage} />
      <div>
        <h4>{item.title}</h4>
        <p>{item.description}</p>
      </div>
    </div>
  )}
/>
```

## Success criteria

- Renders the kasder Program section verbatim from `event.schedule` without modification.
- Optional fields gracefully omit (no description → no `<p>`, no icon → no icon slot, no endTime → no separator).
- `framed: false` removes per-row card chrome cleanly.
- Items are wrappable in a polymorphic Link when `linkComponent` + per-item `href` provided.
- TypeScript: `ScheduleListItem` shape strict; `headingAs` literal union.
- `<ol role="list">` semantics; section `aria-labelledby` resolves to heading id; decorative icons `aria-hidden`.
- `pnpm tsc --noEmit` + `pnpm lint` + `pnpm build` clean; `/components/schedule-list-01` SSR returns 200.

## Open questions

1. **`<ol>` vs `<ul>`?** — schedules are ordered by time. Use `<ol>` semantically. **Resolved: `<ol>`.**
2. **Time-range separator** — hardcode "—" or expose via `labels.timeRangeSeparator`? **Resolved: expose via labels (default ` - `).** Locale-aware (e.g. RTL might prefer different glyph).
3. **Heading semantic level** — `h2` default, configurable via `headingAs`. Same convention as content-card-news-01 / author-card-01.
4. **Frame variants** — `framed: true | false` covers most cases. Skip `compact` / `comfortable` density variants until real demand.
