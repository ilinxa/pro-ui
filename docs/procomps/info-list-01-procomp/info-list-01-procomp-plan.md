# info-list-01 — procomp plan

> Stage 2: how. The implementation contract.
>
> See [`info-list-01-procomp-description.md`](./info-list-01-procomp-description.md) for the what & why.

## Final API

### Public types

```ts
// src/registry/components/data/info-list-01/types.ts

import type { ComponentType, ElementType, ReactNode } from "react";

export type InfoList01Variant = "comfortable" | "compact";

export interface InfoListItem {
  /** Stable identifier. Used for React keys. */
  id: string;
  /** Lucide-style icon component. Required — info-list IS icon-prefixed by definition. */
  icon: ComponentType<{
    className?: string;
    "aria-hidden"?: boolean | "true" | "false";
  }>;
  /** Primary content (bold in comfortable, plain in compact). Required. */
  primary: ReactNode;
  /** Secondary content (muted, smaller). Optional — comfortable only renders it; compact ignores. */
  secondary?: ReactNode;
  /** Optional action element (e.g., a link Button) — renders below secondary in comfortable. Ignored in compact. */
  action?: ReactNode;
  /** Optional URL — when supplied + `linkComponent` provided, `primary` wraps in the polymorphic link. */
  href?: string;
}

export interface InfoList01Labels {
  /** Default: "No information." Used when `items` is empty AND `emptyState` not provided. */
  emptyText?: string;
}

export interface InfoList01Props {
  /** Items to render in display order. */
  items: InfoListItem[];

  /** Visual variant. Default: 'comfortable'. */
  variant?: InfoList01Variant;

  /** Insert top-border separators between items. Default: true for comfortable, false for compact. */
  separated?: boolean;

  /** Wrap in card chrome (`bg-card rounded-2xl p-6 border`). Default: true. */
  framed?: boolean;

  // ─── Heading ─────────────────────────────────────────────────────
  /** Optional section heading. */
  heading?: string;
  /** Heading semantic level. Default: 'h3'. */
  headingAs?: "h2" | "h3" | "h4";

  // ─── Polymorphic link ────────────────────────────────────────────
  /** Element used when `item.href` is supplied. Default: 'a'. */
  linkComponent?: ElementType;

  // ─── Customization ───────────────────────────────────────────────
  /** Custom per-item renderer — bypasses the default row layout entirely. */
  renderItem?: (item: InfoListItem) => ReactNode;

  /** Localized labels. Defaults are English. */
  labels?: InfoList01Labels;

  /** Empty-state slot. Wins over `labels.emptyText` when provided. */
  emptyState?: ReactNode;

  /** Override classes for the root <section>. */
  className?: string;
  /** Override classes for the heading. */
  headingClassName?: string;
  /** Override classes per row. */
  itemClassName?: string;
}

/** Default English labels — exported for consumer composition. */
export const DEFAULT_INFO_LIST_LABELS: Required<InfoList01Labels> = {
  emptyText: "No information.",
};
```

### Exported names

```ts
// index.ts
export { default as InfoList01 } from "./info-list-01";
export type {
  InfoListItem,
  InfoList01Labels,
  InfoList01Props,
  InfoList01Variant,
} from "./types";
export { DEFAULT_INFO_LIST_LABELS } from "./types";
export { meta } from "./meta";
```

### No generics

Strict shape. Consumers map their data once before render.

## File-by-file plan

8 files. Sealed-folder.

```
src/registry/components/data/info-list-01/
├── info-list-01.tsx            # 1 — root
├── parts/
│   └── info-row.tsx            # 2 — single-row presentational
├── types.ts                    # 3
├── dummy-data.ts               # 4
├── demo.tsx                    # 5
├── usage.tsx                   # 6
├── meta.ts                     # 7
└── index.ts                    # 8
```

### 1. `info-list-01.tsx` — root

- `"use client"` directive.
- `React.memo` at export.
- Resolves defaults: `variant ?? "comfortable"`, `framed ?? true`, `linkComponent ?? "a"`, `headingAs ?? "h3"`. Separator default = `separated ?? variant === "comfortable"`.
- `headingId` via `useId` (only used when heading present).
- Empty: when `items.length === 0`, render `emptyState` or `<p role="status">{labels.emptyText}</p>`.
- Otherwise render:
  ```tsx
  <section
    aria-labelledby={heading ? headingId : undefined}
    className={cn(
      framed && "bg-card rounded-2xl p-6 border border-border/50",
      className,
    )}
  >
    {heading && (
      <HeadingTag
        id={headingId}
        className={cn(
          "text-lg font-semibold text-foreground mb-4",
          headingClassName,
        )}
      >
        {heading}
      </HeadingTag>
    )}
    <ul
      role="list"
      className={cn(variant === "comfortable" ? "space-y-4" : "space-y-3")}
    >
      {items.map((item, idx) =>
        renderItem ? (
          <li key={item.id}>{renderItem(item)}</li>
        ) : (
          <InfoRow
            key={item.id}
            item={item}
            variant={variant}
            separated={separatedResolved && idx > 0}
            linkComponent={linkComponent}
            itemClassName={itemClassName}
          />
        ),
      )}
    </ul>
  </section>
  ```

### 2. `parts/info-row.tsx` — single row

- Stateless presentational.
- Two layouts dispatched by `variant`:

**Comfortable:**
```tsx
<li
  className={cn(
    "flex gap-3 items-start",
    separated && "pt-4 border-t border-border/50",
    itemClassName,
  )}
>
  <IconComponent
    aria-hidden="true"
    className="w-5 h-5 text-primary shrink-0 mt-0.5"
  />
  <div className="min-w-0 flex-1">
    {item.href ? (
      <LinkComponent
        href={item.href}
        className="font-medium text-foreground hover:text-primary transition-colors"
      >
        {item.primary}
      </LinkComponent>
    ) : (
      <p className="font-medium text-foreground">{item.primary}</p>
    )}
    {item.secondary && (
      <p className="text-sm text-muted-foreground mt-0.5">{item.secondary}</p>
    )}
    {item.action && <div className="mt-1">{item.action}</div>}
  </div>
</li>
```

**Compact:**
```tsx
<li
  className={cn(
    "flex items-center gap-3",
    separated && "pt-3 border-t border-border/50",
    itemClassName,
  )}
>
  <IconComponent
    aria-hidden="true"
    className="w-4 h-4 text-muted-foreground shrink-0"
  />
  {item.href ? (
    <LinkComponent
      href={item.href}
      className="text-sm text-primary hover:underline min-w-0 truncate"
    >
      {item.primary}
    </LinkComponent>
  ) : (
    <span className="text-sm text-foreground min-w-0 truncate">
      {item.primary}
    </span>
  )}
</li>
```

Compact intentionally ignores `secondary` and `action` — those imply a richer row than the variant supports. Documented in usage.

### 3. `types.ts`

All public types as shown above.

### 4. `dummy-data.ts`

Two arrays + dummy speakers shape:

```ts
export const dummyEventDetails: InfoListItem[] = [
  { id: "date", icon: Calendar, primary: "May 31, 2026 — Sunday", secondary: "09:00 - 18:00" },
  { id: "location", icon: MapPin, primary: "Istanbul Conference Center", secondary: "Darülbedai Caddesi No:3, Şişli/Istanbul", action: <MapLinkButton href="https://maps.example.com/..." /> },
  { id: "capacity", icon: Users, primary: "500-person capacity", secondary: "423 registered" },
];

export const dummyEventDetailsTr: InfoListItem[] = [
  { id: "date", icon: Calendar, primary: "31 Mayıs 2026 Pazar", secondary: "09:00 - 18:00" },
  { id: "location", icon: MapPin, primary: "İstanbul Kongre Merkezi", secondary: "Darülbedai Caddesi No:3, 34367 Harbiye/Şişli/İstanbul", action: <span className="inline-flex items-center gap-1 text-sm text-primary mt-1">Haritada Gör <ExternalLink className="w-3 h-3" /></span> },
  { id: "capacity", icon: Users, primary: "500 Kişilik Kapasite", secondary: "423 kişi kayıtlı" },
];

export const dummyContactItems: InfoListItem[] = [
  { id: "org", icon: Building, primary: "Sustainability Foundation" },
  { id: "phone", icon: Phone, primary: "+90 (212) 555 0123", href: "tel:+902125550123" },
  { id: "email", icon: Mail, primary: "info@example.com", href: "mailto:info@example.com" },
];
```

(The `action` element will be a small link-style fragment — rendered as JSX in dummy-data is fine since `action: ReactNode`.)

### 5. `demo.tsx`

5-tab demo, shadcn `Tabs`:

1. **Default (TR)** — kasder Etkinlik Bilgileri verbatim — comfortable variant, separated, with map-link action
2. **Compact (TR)** — kasder İletişim verbatim — compact variant, no separators, with linked phone/email rows
3. **Both stacked** — Event Details on top + Contact below in two cards (mirrors kasder sidebar shape)
4. **Bare** — `framed=false` for embedded use inside a section
5. **Custom renderItem** — full takeover with avatar instead of icon

### 6. `usage.tsx`

Code blocks: minimal usage, both variants side-by-side, linked rows (tel/mailto), polymorphic linkComponent, action slot, custom renderItem, bare/framed toggle, empty state, semantic notes.

### 7. `meta.ts`

```ts
export const meta: ComponentMeta = {
  slug: "info-list-01",
  name: "Info List 01",
  category: "data",
  description:
    "Card-framed icon-prefixed details list — vertical rows of icon + primary + optional secondary + optional action. Two variants (comfortable / compact), polymorphic per-row link, frame toggle, separator toggle, custom renderItem slot.",
  context:
    "Use for sidebar info cards on detail pages — Event Details, Contact, Address, Account Settings, Product Specs, Restaurant Info, Listing Attributes. Comfortable variant: stacked primary/secondary/action rows with separators. Compact variant: inline single-line rows. Migration origin: kasder kas-social-front-v0 events/[id]/page.tsx Etkinlik Bilgileri + İletişim sidebar cards.",
  features: [
    "Two variants — comfortable (stacked, separators, larger icon) and compact (inline, no separators, smaller muted icon)",
    "Required icon + primary; optional secondary + action + href per item",
    "Polymorphic per-row link via linkComponent (default 'a') — works with tel: / mailto: / etc.",
    "Frame toggle (framed=true card chrome / framed=false bare)",
    "Separator toggle (auto-defaults per variant; overridable)",
    "Custom renderItem slot for full row takeover",
    "Optional section heading with configurable level (h2/h3/h4)",
    "Soft-failure on optional fields",
    "Empty state slot + labels.emptyText fallback",
    "i18n via labels object",
    "<ul role='list'> semantics + section aria-labelledby",
  ],
  tags: ["info-list-01", "details", "info", "list", "sidebar"],
  version: "0.1.0",
  status: "alpha",
  createdAt: "2026-05-02",
  updatedAt: "2026-05-02",
  author: { name: "ilinxa" },
  dependencies: { shadcn: ["tabs"], npm: { "lucide-react": "^0.x" }, internal: [] },
  related: ["thumb-list-01", "schedule-list-01", "article-meta-01"],
};
```

### 8. `index.ts`

Public exports as shown above.

## Dependencies

### Internal (pro-ui)

- `@/lib/utils` — `cn()`

### NPM

- `react`
- `lucide-react` — for dummy icons (Calendar, MapPin, Users, Building, Phone, Mail, ExternalLink); component itself takes any `ComponentType` icon

### Forbidden

- `next/*`
- shadcn `Separator` — using CSS borders instead (cleaner DOM inside `<ul>`)

## Composition pattern

Headless wrapping over a presentational row. Same shape as schedule-list-01.

## Edge cases

| Case | Behavior |
|---|---|
| `items` empty | `emptyState` if provided, else `<p role="status">{labels.emptyText}</p>` |
| `secondary` missing in comfortable | Stacks collapse — only primary renders below the icon |
| `secondary` provided in compact | Ignored (compact is single-line) — documented limitation |
| `action` provided in compact | Ignored — same reason |
| `href` provided | Primary wraps in polymorphic `<linkComponent>`; non-linked items use `<p>` (comfortable) or `<span>` (compact) |
| `href` missing + `linkComponent` provided | No-op; row stays non-interactive (typical for non-linked rows like organizer-name) |
| `separated` not set | Auto-defaults per variant: comfortable=true, compact=false |
| `separated: true` + first row | First row never gets a top border (`idx > 0` guard) |
| `framed: false` | Card chrome dropped; rows render naked |
| Heading missing | Section has no `aria-labelledby`; no heading element |
| `renderItem` provided | Default row layout bypassed entirely |
| Long `primary` text | Wraps in comfortable; `truncate` in compact (`min-w-0 truncate` chain) |
| RTL | Icon column flips naturally via flex order; no directional icons in default layout |
| Reduced motion | No motion-driven elements; `motion-safe:` not strictly needed (pure presentation) |
| Empty `items` array OR `null` icon — | Icon is required by type — TS prevents this. Runtime: assume valid item shape (defensive checks would over-engineer) |

## Accessibility

- `<ul role="list">` (Safari list-style workaround).
- `<section aria-labelledby={headingId}>` when heading present; heading id from `useId`.
- Decorative icons: `aria-hidden="true"`.
- Linked rows: link's accessible name is `primary` text content (no separate `aria-label` needed since visible text matches accessibly).
- For compact-variant linked rows where `primary` is a phone number / email / URL, the link's accessible name is the formatted string — screen readers read it character-by-character but visually-readable phone/email already follow that pattern.
- Heading levels: `h3` default (sidebar info-cards typically nest under page `h2`).

## Verification checklist

- [ ] `pnpm tsc --noEmit` clean
- [ ] `pnpm lint` clean (1 pre-existing rich-card warning OK)
- [ ] `pnpm build` clean — `/components/info-list-01` prerendered
- [ ] SSR returns 200 with all 5 demo tab triggers
- [ ] `/components` index lists the new entry
- [ ] Visual sanity: comfortable matches kasder Event Details verbatim; compact matches kasder Contact verbatim; separators only in comfortable

## Risks & alternatives

### Risk 1: Compact variant silently drops `secondary` + `action`

A consumer might pass an item with secondary + action expecting it to render, then be confused when compact eats them. **Mitigation:** documented prominently in usage.tsx + the type doc-comments. If repeated user confusion surfaces, add a dev-only `console.warn` in v0.2.

### Risk 2: `<ul>` semantic vs visual list-style override

Consumers may want bullet points or other list-styles. **Mitigation:** `[&>li]:list-disc` or any `className` override on the root works; default is `list-style: none` via `role="list"` semantic preservation.

### Risk 3: `action` slot overlaps with `href`

If both are present, the row has two interactive surfaces (the linked primary + the action). They don't conflict (different DOM elements), but tab order is: link → action. **Mitigation:** acceptable; this is the kasder pattern (linked org name + map-link button below).

### Alternatives considered

1. **Single variant, props for density** (e.g. `dense: boolean`) — rejected; `variant` matches the convention used across other pro-comps + reads more clearly in JSX.
2. **Compound API** (`<InfoList.Item>...</InfoList.Item>`) — rejected; data-driven `items` array is more ergonomic for the 99% case (consumers map server data).
3. **shadcn `Separator` between items** — rejected; CSS top-border on each `<li>` (with `:not(:first-child)` guard) keeps the DOM clean.
4. **Auto-prefix `tel:` / `mailto:` schemes** — rejected; consumer passes full URL; predictable + minimal.

## Open follow-ups (post v0.1)

- v0.2: a `medium` density variant if real demand surfaces (between comfortable + compact)
- v0.2: per-item `tooltip` for icons that need explanation
- v0.2: `onItemClick(item)` for non-link interactions
