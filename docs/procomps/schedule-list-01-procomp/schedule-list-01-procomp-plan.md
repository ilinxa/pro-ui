# schedule-list-01 — procomp plan

> Stage 2: how. The implementation contract.
>
> See [`schedule-list-01-procomp-description.md`](./schedule-list-01-procomp-description.md) for the what & why.

## Final API

### Public types

```ts
// src/registry/components/data/schedule-list-01/types.ts

import type { ComponentType, ElementType, ReactNode } from "react";

export interface ScheduleListItem {
  /** Stable identifier. Used for React keys + accessible-name composition. */
  id: string;
  /** Time string ("09:00", "14:30", "9pm"). Required — schedules ARE time-anchored. */
  time: string;
  /** Optional end time for a time range. Renders as `${time}{separator}${endTime}` (e.g. "09:00 - 10:30"). */
  endTime?: string;
  /** Item title (bold). Required. */
  title: string;
  /** Item description (muted, smaller). Optional. */
  description?: string;
  /** Optional Lucide-style icon shown left of the time column (e.g. Coffee, Users for break / networking). */
  icon?: ComponentType<{ className?: string; "aria-hidden"?: boolean | "true" | "false" }>;
  /** Optional URL — when supplied + `linkComponent` provided, item becomes clickable. */
  href?: string;
}

export interface ScheduleList01Labels {
  /** Default: " - " (with surrounding spaces) — separator between time + endTime. */
  timeRangeSeparator?: string;
  /** Default: "No items scheduled." Used when `items` is empty AND `emptyState` not provided. */
  emptyText?: string;
}

export interface ScheduleList01Props {
  /** Schedule items in display order (chronological). */
  items: ScheduleListItem[];

  /** Optional section heading text. Omit to render without heading (consumer wraps externally). */
  heading?: string;
  /** Heading semantic level. Default: 'h2'. */
  headingAs?: "h2" | "h3" | "h4";

  /** Render per-row card chrome (`bg-card rounded-xl border ...`). Default: true. */
  framed?: boolean;

  /** Element used for clickable items. Default: 'a'. Pass NextLink / RemixLink / etc. */
  linkComponent?: ElementType;

  /** Localized labels. Defaults are English. */
  labels?: ScheduleList01Labels;

  /** Custom per-item renderer — receives the item, returns the row content (replaces the default time + title + description layout). */
  renderItem?: (item: ScheduleListItem) => ReactNode;

  /** Custom time-string renderer — receives the item, returns ReactNode (e.g. transform "09:00" → "9:00 AM"). Default: time + optional endTime joined by separator. */
  renderTime?: (item: ScheduleListItem) => ReactNode;

  /** Empty-state slot. Wins over `labels.emptyText` when provided. */
  emptyState?: ReactNode;

  /** Override classes for the root <section>. */
  className?: string;
  /** Override classes for the heading. */
  headingClassName?: string;
  /** Override classes per row. */
  itemClassName?: string;
}
```

### Default labels

```ts
export const DEFAULT_SCHEDULE_LIST_LABELS: Required<ScheduleList01Labels> = {
  timeRangeSeparator: " - ",
  emptyText: "No items scheduled.",
};
```

### Exported names

```ts
// index.ts
export { default as ScheduleList01 } from "./schedule-list-01";
export type {
  ScheduleListItem,
  ScheduleList01Labels,
  ScheduleList01Props,
} from "./types";
export { DEFAULT_SCHEDULE_LIST_LABELS } from "./types";
export { meta } from "./meta";
```

### No generics

`ScheduleListItem` is a fixed shape. Consumers map their data once before render. Power users override per-item rendering via `renderItem`.

## File-by-file plan

8 files. Sealed-folder convention.

```
src/registry/components/data/schedule-list-01/
├── schedule-list-01.tsx           # 1 — root component
├── parts/
│   └── schedule-row.tsx           # 2 — single-row presentational component
├── types.ts                       # 3
├── dummy-data.ts                  # 4
├── demo.tsx                       # 5
├── usage.tsx                      # 6
├── meta.ts                        # 7
└── index.ts                       # 8
```

### 1. `schedule-list-01.tsx` — root

- `"use client"` directive (only because the polymorphic `linkComponent` accepts function components; pure presentational otherwise — but consistent with other pro-comps).
- Wrapped in `React.memo`.
- Resolves defaults (labels merge, framed default true, linkComponent default `"a"`).
- Computes `headingId` via `useId()` for `aria-labelledby` on the `<ol>` (when heading is rendered).
- Renders `<section aria-labelledby={headingId ?? undefined}>` containing optional `<HeadingTag id={headingId} className={cn(...)}>` + `<ol role="list" className="space-y-4">` (or no `space-y` if `!framed` + tighter `space-y-2`) + items.
- For each item: dispatches to consumer's `renderItem(item)` if supplied, else renders `<ScheduleRow {...resolvedProps} />`.
- Empty state: when `items.length === 0`, render `emptyState` OR `<p role="status">{labels.emptyText}</p>`.

### 2. `parts/schedule-row.tsx` — single row

- Stateless presentational.
- Root: `<li className={cn(rowClasses, framed && frameClasses, itemClassName)}>`
  - rowClasses: `"relative group flex items-start gap-4"`
  - frameClasses: `"p-4 bg-card rounded-xl border border-border/50 motion-safe:hover:border-border transition-colors"`
- **Optional icon column** (when `item.icon` present): `<div className="shrink-0 mt-1"><IconComponent aria-hidden="true" className="w-5 h-5 text-primary" /></div>`
- **Time column:** `<div className="w-20 shrink-0">` containing
  - If `renderTime` supplied: `{renderTime(item)}`
  - Else: `<span className="text-lg font-bold text-primary">{item.time}{item.endTime && \`${separator}${item.endTime}\`}</span>`
- **Content column:** `<div className="min-w-0 flex-1">` containing
  - `<h4 className="font-semibold text-foreground motion-safe:group-hover:text-primary transition-colors">{item.title}</h4>`
  - When `item.description` present: `<p className="text-sm text-muted-foreground mt-0.5">{item.description}</p>`
- **Link overlay** (when `item.href` AND `linkComponent` supplied): `<LinkComponent href={item.href} aria-label={item.title} className="absolute inset-0 z-0 rounded-xl focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 outline-none" />`

### 3. `types.ts`

All public types as shown above.

### 4. `dummy-data.ts`

Two arrays: `dummySchedule` (English, 6 items, includes one icon item + one href item + one item without description for soft-fail) + `dummyScheduleTr` (Turkish, mirrors the kasder source).

```ts
export const dummySchedule: ScheduleListItem[] = [
  { id: "1", time: "09:00", title: "Registration & Welcome Coffee", description: "Check-in and networking", icon: Coffee },
  { id: "2", time: "10:00", endTime: "10:30", title: "Opening Keynote", description: "Annual address by the Board" },
  { id: "3", time: "11:00", title: "Panel: Future Cities", description: "Interactive discussion with experts" },
  { id: "4", time: "13:00", title: "Lunch", icon: Utensils },
  { id: "5", time: "14:30", endTime: "16:30", title: "Workshops", description: "Parallel breakout sessions", href: "#workshops" },
  { id: "6", time: "17:00", title: "Closing & Networking", description: "Wrap-up and cocktail reception" },
];

export const dummyScheduleTr: ScheduleListItem[] = [
  { id: "1", time: "09:00", title: "Kayıt ve Karşılama Kahvaltısı", description: "Katılımcı kayıtları ve networking", icon: Coffee },
  // ... 6 items total
];
```

### 5. `demo.tsx`

5-tab demo, shadcn `Tabs`:

1. **Default** — kasder Turkish source verbatim (matches the screenshot exactly)
2. **English** — same shape, English labels + items
3. **Bare rows** — `framed={false}` for sidebar/widget contexts
4. **With icons + links** — items with `icon` + `href`, polymorphic `linkComponent` slot
5. **Custom renderItem** — speaker-augmented row (drops `<Avatar>` next to time)

### 6. `usage.tsx`

Code blocks: minimal usage, framed vs bare, polymorphic linkComponent, custom renderItem, soft-fail with missing description / icon / endTime, empty state.

### 7. `meta.ts`

```ts
export const meta: ComponentMeta = {
  slug: "schedule-list-01",
  name: "Schedule List 01",
  category: "data",
  description: "Vertical time-anchored agenda — time + title + optional description rows. Polymorphic per-row link, optional icons, time-range support, framed/bare toggle, custom renderItem slot.",
  context: "Use for conference programs, course curricula, podcast schedules, broadcast schedules, meeting agendas — anywhere a time-ordered list of activities renders. Migration origin: kasder kas-social-front-v0 events/[id]/page.tsx Program section.",
  features: [
    "Vertical schedule list — time + title + optional description per row",
    "Optional time range (start - end)",
    "Optional Lucide-style icon per row",
    "Polymorphic per-row link via linkComponent + per-item href",
    "Frame toggle (framed=true card chrome / framed=false bare rows)",
    "Custom renderItem + renderTime slots",
    "Optional section heading with configurable level (h2/h3/h4)",
    "Soft-failure on optional fields (description/icon/endTime/href)",
    "i18n via labels object",
    "Semantic <ol role='list'> — schedules are ordered",
  ],
  tags: ["schedule-list-01", "schedule", "agenda", "timeline", "events"],
  version: "0.1.0",
  status: "alpha",
  createdAt: "2026-05-02",
  updatedAt: "2026-05-02",
  author: { name: "ilinxa" },
  dependencies: { shadcn: ["tabs"], npm: { "lucide-react": "^0.x" }, internal: [] },
  related: ["event-card-01", "info-list-01"],
};
```

### 8. `index.ts`

Public exports as shown above.

## Dependencies

### Internal (pro-ui)

- `@/lib/utils` — `cn()` helper

### NPM

- `react` — runtime + types
- `lucide-react` — for the dummy icons (Coffee, Utensils, Users); component itself accepts arbitrary icons via the `ComponentType` prop type, so consumers aren't forced into lucide

### Forbidden (not added)

- `next/*` — registry rule
- shadcn `Card` — could use it, but raw `<li>` + Tailwind classes are equally clean and avoid an unnecessary primitive dep

## Composition pattern

**Headless wrapping + presentational row.** Root component owns prop normalization + heading dispatch + empty state + per-item iteration. The `parts/schedule-row.tsx` is stateless presentational.

**Polymorphic root** via `linkComponent: ElementType`. Same pattern as event-card-01 / content-card-news-01.

## Edge cases

| Case | Behavior |
|---|---|
| `items` is empty | Render `emptyState` if provided, else `<p role="status">{labels.emptyText}</p>` |
| Item missing `description` | Description block omitted; row collapses to time + title |
| Item missing `icon` | Icon column omitted; time column starts at left |
| Item missing `endTime` | Time renders as just `${time}` (no separator) |
| Item missing `href` | Row is non-interactive (no link overlay) |
| `framed: false` | Row chrome (`bg-card rounded-xl border p-4`) removed; tighter `space-y-2` between rows |
| Heading missing | `<section>` rendered without `aria-labelledby`; no heading element rendered |
| Two icons / Long titles | Icons fixed `w-5 h-5`; titles wrap (no line-clamp); description wraps |
| `renderItem` provided | Default row layout bypassed entirely; consumer's render wins |
| `renderTime` provided | Default time renderer bypassed; consumer's render wins (used inside default row layout when `renderItem` NOT provided) |
| RTL | Flex order natural; no directional icons in default layout |
| Reduced motion | Hover-color transition gated via `motion-safe:` |

## Accessibility

- `<ol role="list">` (Safari `list-style: none` workaround) — schedules are inherently ordered.
- `<section aria-labelledby={headingId}>` when heading is present; heading gets `id={headingId}` via `useId`.
- Decorative icons (`item.icon`) get `aria-hidden="true"`.
- Linked rows: link's `aria-label={item.title}` (since the visible time + title are both inside the link rectangle, the title alone is the most natural accessible name).
- Focus-visible ring on the link covers the whole row via the absolute overlay pattern.
- Heading levels: `h2` default; configurable via `headingAs`.

## Verification checklist

- [ ] `pnpm tsc --noEmit` clean
- [ ] `pnpm lint` clean (only pre-existing rich-card warning)
- [ ] `pnpm build` clean — all routes prerendered including `/components/schedule-list-01`
- [ ] SSR returns 200 with all 5 demo tab triggers + Default tab content visible
- [ ] `/components` index lists the new entry
- [ ] Visual sanity: framed default matches kasder screenshot exactly; bare rows render without chrome; icons + links render correctly

## Risks & alternatives

### Risk 1: `<ol>` vs `<ul>` breaks consumer expectations

`<ol>` is semantically correct (schedules are ordered), but some consumers expect `<ul>` for "lists" and CSS them differently. **Mitigation:** documented in usage.tsx; consumers can `className` override list-style if needed.

### Risk 2: Polymorphic link `aria-label={item.title}` is redundant when title is visible

The link rectangle covers time + title + description; screen-reader announces both via `aria-label`. Slight redundancy with adjacent visible text. **Mitigation:** acceptable per WCAG 2.5.3 Label in Name (accessible name SHOULD include visible text). Consumers can override via `renderItem` if they want richer link names.

### Alternatives considered

1. **Generic over item shape** — rejected; strict shape matches usage.
2. **Compound API** (`<ScheduleList.Item time={...}>...</ScheduleList.Item>`) — rejected; the data-driven `items` array is more ergonomic for the 99% case where consumers map server data.
3. **`<table>` semantics** — rejected; schedules are read top-to-bottom as a list, not scanned across columns. Table semantics would over-engineer accessibility.
4. **Day-grouping in v0.1** — deferred to v0.2; complicates type shape (would need `items: ScheduleListItem[] | { day: string; items: ScheduleListItem[] }[]`). Real demand needed first.

## Open follow-ups (post v0.1)

- v0.2: day grouping for multi-day schedules
- v0.2: `currentTime?: Date` to highlight the active row
- v0.2: vertical timeline visual (connecting line between rows + dots) — new variant
