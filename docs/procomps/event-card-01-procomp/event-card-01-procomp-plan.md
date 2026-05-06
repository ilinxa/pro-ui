# event-card-01 — procomp plan

> Stage 2: how. The implementation contract.
>
> See [`event-card-01-procomp-description.md`](./event-card-01-procomp-description.md) for the what & why.
>
> **Migration origin:** [`docs/migrations/event-card-01/`](../../migrations/event-card-01/) — see [`analysis.md`](../../migrations/event-card-01/analysis.md) for the design-DNA inventory + rewrite items + dependency audit. Locked-in intake decisions: [`source-notes.md` § Locked-in decisions](../../migrations/event-card-01/source-notes.md#locked-in-decisions-signed-off-2026-05-02).

> **v0.1 mid-implementation expansions (2026-05-02):**
> 1. Added a third variant — `list` — per user request after grid + feed shipped. (Info-rich row with thumbnail.)
> 2. Added a fourth variant — `compact` — when user clarified the screenshot pattern they wanted was actually a text-only minimal row for sidebars / widgets, not the thumbnail-rich `list`. Both kept; they serve different consumers.
>
> The intake docs lock in 2 variants; this plan is the source of truth for the 4-variant v0.1 ship. File count grew 12 → 14.

## Final API

### Public types

```ts
// src/registry/components/data/event-card-01/types.ts

import type { EventStatus } from './lib/event-status';
export type { EventStatus };

export type EventCard01Variant = 'grid' | 'feed' | 'list' | 'compact';

export interface EventCardItem {
  /** Stable identifier. Used for React keys and the default ariaLabel. */
  id: string;
  /** Headline. Rendered as <h3>. Required. */
  title: string;
  /** Event-type label (e.g. "Conference", "Webinar"). Used as a key into `typeStyles`. Required. */
  type: string;
  /** Start date. ISO-8601 string parseable by `new Date()`. Required — drives status logic. */
  date: string;
  /** End date. ISO-8601 string. Optional — defaults to `date` (single-day event). */
  endDate?: string;
  /** Time string ("09:00 - 18:00"). Optional — meta line omitted if missing. */
  time?: string;
  /** Location string ("Istanbul Conference Center", "Virtual", etc). Optional — meta line omitted if missing. */
  location?: string;
  /** Image URL. Optional — placeholder rendered if missing. */
  image?: string;
  /** Image alt-text. Optional — falls back to `title`. */
  imageAlt?: string;
  /** Short summary. Optional — variant gracefully omits. */
  description?: string;
  /** Total seat count. Optional — capacity bar + capacity-derived states (full / lastSpots) skipped if absent. */
  capacity?: number;
  /** Currently-registered count. Optional — same as `capacity`. */
  registered?: number;
  /** Promotional flag. Optional — adds visual lift treatment. */
  featured?: boolean;
}

export interface EventCard01Labels {
  // ─── Status badges ─────────────────────────────────────────────
  /** Default: 'Ended'. */
  expired?: string;
  /** Default: 'Live now'. */
  ongoing?: string;
  /** Default: 'Soon'. */
  upcoming?: string;
  /** Default: 'Registration open'. */
  open?: string;
  /** Default: 'Sold out'. */
  full?: string;
  /** Default: 'Last spots'. */
  lastSpots?: string;
  // ─── Image-area overlays ───────────────────────────────────────
  /** Suffix on the days-until countdown. Default: 'days left'. */
  daysUntilSuffix?: string;
  /** Pulsing-dot pill text on `ongoing` events. Default: 'Happening now'. */
  ongoingIndicator?: string;
  // ─── Capacity counter ──────────────────────────────────────────
  /** Suffix on the spots-left counter. Default: 'spots left'. */
  spotsLeftSuffix?: string;
  /** Spots-left counter when capacity hit. Default: 'Sold out'. */
  spotsLeftFull?: string;
  /** aria-label prefix on the capacity progress bar. Default: 'Registered'. */
  capacityAriaPrefix?: string;
  /** Word between the registered + capacity numbers in the aria-label. Default: 'of'. */
  capacityAriaSeparator?: string;
  // ─── CTA ───────────────────────────────────────────────────────
  /** Default: 'Register'. */
  ctaRegister?: string;
  /** Default: 'Join'. */
  ctaJoin?: string;
  /** Default: 'View details'. */
  ctaViewDetails?: string;
  /** Default: 'Sold out'. */
  ctaSoldOut?: string;
  // ─── A11y ──────────────────────────────────────────────────────
  /** sr-only label on the featured-star icon. Default: 'Featured event'. */
  featuredAriaLabel?: string;
}

export interface EventCard01Props {
  /** The event to render. */
  event: EventCardItem;

  /** Visual variant. Required — no default; explicit per render site. */
  variant: EventCard01Variant;

  // ─── Navigation ──────────────────────────────────────────────────────
  /** URL the card links to. Mutually exclusive with `getHref`. */
  href?: string;
  /** Alternative href derivation. Receives the event, returns a URL. */
  getHref?: (event: EventCardItem) => string;
  /** Click handler, fired before navigation if href is also set. */
  onClick?: (event: EventCardItem, mouseEvent: React.MouseEvent) => void;
  /** Element used for the link. Default: 'a'. Pass NextLink / RemixLink / etc. */
  linkComponent?: React.ElementType;

  // ─── Time / formatting ──────────────────────────────────────────────
  /** Custom date formatter. Default: browser locale long format. */
  formatDate?: (dateString: string) => string;
  /** Inject a "now" reference for deterministic status (tests, live clocks). Default: new Date() at render. */
  now?: Date;
  /** Override the derived status. Rare — for preview / what-if states. */
  statusOverride?: EventStatus;
  /** Localized labels. Defaults are English. */
  labels?: EventCard01Labels;

  // ─── Theming ─────────────────────────────────────────────────────────
  /** Map of event-type → Tailwind class string. Default: empty (falls to bg-muted). */
  typeStyles?: Record<string, { className: string }>;
  /** Override classes for the title (e.g. swap font-sans → font-serif). */
  titleClassName?: string;
  /** Override classes for the image. */
  imageClassName?: string;
  /** Override classes for the root <article>. */
  className?: string;

  // ─── Accessibility ───────────────────────────────────────────────────
  /** Override the link's accessible name. Default: title. */
  ariaLabel?: string;

  // ─── Nested interactives (overlay-link pattern) ──────────────────────
  /** Optional cluster of buttons/links that sit ABOVE the link overlay (z-10). */
  actions?: React.ReactNode;

  // ─── Performance ─────────────────────────────────────────────────────
  /** Image loading strategy. Default: 'lazy'. */
  loading?: 'lazy' | 'eager';
}
```

### Public helper kernel

```ts
// src/registry/components/data/event-card-01/lib/event-status.ts

export type EventStatus = 'expired' | 'ongoing' | 'upcoming' | 'open' | 'full' | 'lastSpots';

export interface EventStatusConfigEntry {
  /** Status label (English default; consumer overrides via `labels`). */
  label: string;
  /** Lucide icon for the status badge. */
  icon: React.ComponentType<{ className?: string; 'aria-hidden'?: boolean }>;
  /** Tailwind class string for the status badge background + foreground. */
  className: string;
  /** Optional class string applied to the card chrome — used for the `expired` opacity-grayscale wrapper. */
  cardClassName?: string;
}

export const EVENT_STATUS_CONFIG: Record<EventStatus, EventStatusConfigEntry>;

/**
 * Pure function. Derives the status from the event + an optional `now`.
 * Order: time-window first (expired / ongoing) → capacity (full / lastSpots) → time-proximity (upcoming) → open.
 * If `capacity` or `registered` is undefined, capacity-derived states are skipped.
 */
export function getEventStatus(event: EventCardItem, now?: Date): EventStatus;
```

```ts
// src/registry/components/data/event-card-01/lib/format-default.ts

/**
 * Default date formatter. Browser locale, long form ("15 June 2026" / "15 Haziran 2026").
 * Consumer overrides via the `formatDate` prop.
 */
export function formatEventDate(dateString: string, locale?: string): string;

/**
 * Days between `now` and the event date, set to midnight on both sides.
 * Negative for past events. Useful for the days-until overlay AND for consumers building calendar UIs.
 */
export function getDaysUntilEvent(dateString: string, now?: Date): number;
```

### Exported names

```ts
// src/registry/components/data/event-card-01/index.ts

export { default as EventCard01 } from './event-card-01';

export type {
  EventCardItem,
  EventCard01Labels,
  EventCard01Props,
  EventCard01Variant,
} from './types';

export {
  getEventStatus,
  EVENT_STATUS_CONFIG,
  type EventStatus,
  type EventStatusConfigEntry,
} from './lib/event-status';

export {
  formatEventDate,
  getDaysUntilEvent,
} from './lib/format-default';
```

### No generics

The card uses `EventCardItem` directly, not `<T extends EventCardItem>`. Consumers `.map(raw => mapToEventCardItem(raw))` once before render. Power users still customize via `typeStyles` / `titleClassName` / `imageClassName` / `actions`. Same call as content-card-news-01.

### Required vs optional fields — soft-failure contract

| Field | Required | Behavior when absent |
|---|---|---|
| `id` | ✅ | — |
| `title` | ✅ | — |
| `type` | ✅ | — (used as key into `typeStyles`; falls to `bg-muted` if not in map) |
| `date` | ✅ | — (drives status logic) |
| `endDate` | optional | Falls back to `date` (single-day event) |
| `time` | optional | Time meta line omitted |
| `location` | optional | Location meta line omitted |
| `image` | optional | Tinted placeholder (`bg-muted` block + `<Calendar>` icon centered) rendered |
| `imageAlt` | optional | Falls back to `title` |
| `description` | optional | Description block omitted (grid only — feed has no description) |
| `capacity` | optional | Capacity bar + spots-left counter omitted; status logic skips `full` / `lastSpots` |
| `registered` | optional | Same as `capacity` (the two come together; missing one degrades both) |
| `featured` | optional | No featured treatment |

---

## File-by-file plan

14 files total. Sealed-folder convention.

```
src/registry/components/data/event-card-01/
├── event-card-01.tsx              # 1
├── parts/
│   ├── grid.tsx                   # 2
│   ├── feed.tsx                   # 3
│   ├── list.tsx                   # 4 (added mid-implementation)
│   └── compact.tsx                # 5 (added mid-implementation)
├── lib/
│   ├── event-status.ts            # 6 (PUBLIC)
│   ├── format-default.ts          # 7 (PUBLIC)
│   └── image-fallback.tsx         # 8
├── types.ts                       # 9
├── dummy-data.ts                  # 10
├── demo.tsx                       # 11
├── usage.tsx                      # 12
├── meta.ts                        # 13
└── index.ts                       # 14
```

Matches content-card-news-01 (14 files = 5 parts + 2 lib/hooks + 7 standard; we have 4 parts + 3 lib + 7 standard = 14).

### 1. `event-card-01.tsx` — root component

- `"use client"` directive.
- Wrapped in `React.memo` at the export.
- Resolves all defaults (formatters, labels, link component, type styles, loading, status override).
- Computes a unique `titleId` via `React.useId()` for `aria-labelledby` on the link overlay.
- Derives status: `const status = statusOverride ?? useMemo(() => getEventStatus(event, now), [event, now])`.
- Derives `cta`: status-driven label + decorative CTA className (resolved via `EVENT_STATUS_CONFIG` + merged labels).
- Resolves `href`: `href ?? getHref?.(event) ?? '#'`.
- Resolves `featured` flag: `event.featured === true`.
- Dispatches to `parts/grid.tsx` or `parts/feed.tsx` based on `variant` prop. **No fallback** — variant is required (TypeScript narrows the union; runtime gets a dev-only `console.warn` if anything else slips through).
- Each part receives a fully-resolved render bag:
  - `event` (the raw item)
  - `status` (derived)
  - `statusEntry` (EVENT_STATUS_CONFIG[status] merged with consumer labels)
  - `daysUntil` (number — only used by image-area overlay; computed once)
  - `formattedDate` (string)
  - `typeStyle` (resolved class string for the type badge)
  - `featured` (boolean)
  - `labels` (fully merged with defaults)
  - `linkProps` ({ href, linkComponent, onClick, ariaLabel, titleId })
  - `slotProps` ({ titleClassName, imageClassName, className, actions, loading })

### 2. `parts/grid.tsx` — image-on-top variant

Anatomy:

- Root `<article className={cn(rootClasses, status === 'expired' && 'opacity-60 grayscale-30', featured && 'border-t-4 border-primary', className)}>`
  - rootClasses: `"relative group bg-card rounded-2xl overflow-hidden shadow-sm motion-safe:hover:shadow-xl transition-all duration-500 border border-border/50 h-full flex flex-col"`
- Image area: `<div className="relative h-48 overflow-hidden">`
  - `<img>` with `motion-safe:group-hover:scale-110 transition-transform duration-700`, `loading={loading}`, fallback to `<ImageFallback />` if `image` missing
  - Subtle dark gradient overlay: `<div className="absolute inset-0 bg-linear-to-t from-black/60 via-transparent to-transparent" />`
  - **Top-left:** Status badge — `<span className={cn("inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium", statusEntry.className)}><StatusIcon aria-hidden className="w-3.5 h-3.5" />{statusEntry.label}</span>`. `motion-safe:animate-pulse` baked into config when status is `ongoing`.
  - **Top-right:** Type badge with `backdrop-blur-sm` for legibility — `<span className={cn(typeStyle, "backdrop-blur-sm border rounded-md text-xs px-2.5 py-0.5")}>{event.type}</span>`. **Yields to `actions` slot when `actions` is supplied** — type badge moves to bottom-right; actions take top-right.
  - **Bottom-left:** Days-until OR ongoing-pill, mutually exclusive based on status:
    - When `status !== 'expired' && status !== 'ongoing'`: `<div className="absolute bottom-4 left-4 bg-black/70 backdrop-blur-sm rounded-lg px-3 py-2 text-white"><div className="text-2xl font-bold leading-none">{daysUntil}</div><div className="text-xs text-white/70">{labels.daysUntilSuffix}</div></div>`
    - When `status === 'ongoing'`: `<div className="absolute bottom-4 left-4 bg-accent/90 backdrop-blur-sm rounded-lg px-3 py-2 text-accent-foreground inline-flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-current motion-safe:animate-pulse" />{labels.ongoingIndicator}</div>`
  - **Bottom-right:** Type badge (when `actions` supplied) OR silent. Featured used to live here — DROPPED per locked decision #5.
  - **`actions` slot** (when supplied): `<div className="absolute top-4 right-4 z-10 flex gap-1.5">{actions}</div>` — pushes type badge to bottom-right via conditional `position` class.
- Link overlay: `<linkComponent href={href} aria-labelledby={titleId} aria-label={ariaLabel} className="absolute inset-0 z-0 rounded-2xl focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 outline-none" onClick={handleClick} />` — applied to image area? **No** — link overlay covers the WHOLE article, not just the image. Same overlay-link pattern as content-card-news-01.
- Content area: `<div className="p-6 flex-1 flex flex-col">`
  - Title: `<h3 id={titleId} className={cn("text-xl font-bold text-foreground mb-2 motion-safe:group-hover:text-primary transition-colors line-clamp-2", titleClassName)}>{featured && <Star aria-hidden className="inline w-4 h-4 fill-primary text-primary mr-1.5 align-baseline" />}{event.title}{featured && <span className="sr-only">{labels.featuredAriaLabel}</span>}</h3>`. **Sans-not-serif per description.**
  - Description (when present): `<p className="text-muted-foreground text-sm mb-4 line-clamp-2">{event.description}</p>`
  - **Meta lines:** `<ul role="list" className="space-y-2 mb-4">` containing 1-3 `<li>` rows for date / time / location (only present-fields rendered):
    - `<li className="flex items-center gap-2 text-sm text-muted-foreground"><Calendar aria-hidden className="w-4 h-4 text-primary" /><span>{formattedDate}</span></li>`
    - similarly Clock + time, MapPin + location (with `truncate` on the location span)
  - **Capacity bar** (only when `capacity != null && registered != null`):
    - Counter row: `<div className="flex items-center justify-between text-sm mb-2"><span className="inline-flex items-center gap-1.5 text-muted-foreground"><Users aria-hidden className="w-4 h-4" />{event.registered} / {event.capacity}</span>{status !== 'expired' && <span className={cn("text-xs font-medium", spotsLeft <= 5 && spotsLeft > 0 ? "text-destructive" : "text-muted-foreground")}>{spotsLeft > 0 ? `${spotsLeft} ${labels.spotsLeftSuffix}` : labels.spotsLeftFull}</span>}</div>`
    - Progress: `<Progress value={percentFull} className={cn("h-2", status === 'expired' && 'opacity-50')} aria-label={\`${labels.capacityAriaPrefix}: ${event.registered} ${labels.capacityAriaSeparator} ${event.capacity}\`} />`
  - **Decorative CTA:** `<div role="button" aria-hidden="true" className={cn(buttonVariants({ variant: ctaButtonVariant }), "w-full mt-4 pointer-events-none")}>{ctaLabel}</div>`
    - `pointer-events-none` so the click passes straight through to the link overlay (no nested-button-in-link a11y violation; clicks on the CTA-shaped div just navigate via the overlay link).
    - `aria-hidden` because the link's accessible name (the title) already conveys the action; the CTA label is decorative.
    - `ctaButtonVariant`: `default` for `open`/`upcoming`/`lastSpots`/`ongoing`, `secondary` for `full`, `outline` for `expired`.

### 3. `parts/feed.tsx` — full-bleed background variant

Anatomy:

- Root `<article className={cn(rootClasses, status === 'expired' && 'opacity-60 grayscale-30', featured && 'ring-2 ring-primary ring-inset', className)}>`
  - rootClasses: `"relative group h-64 md:h-72 overflow-hidden lg:rounded-xl shadow-[inset_0_80px_60px_-40px_rgba(0,0,0,0.4)]"`
- `<img>` absolute-positioned full-size with `motion-safe:group-hover:scale-105 transition-transform duration-700`, fallback to `<ImageFallback />` if missing.
- **Two layered gradient overlays** (preserves source's depth):
  - `<div className="absolute inset-0 bg-linear-to-t from-black/90 via-black/50 to-black/30" />`
  - `<div className="absolute inset-0 shadow-[inset_0_60px_80px_-20px_rgba(0,0,0,0.6)]" />`
- Content stack: `<div className="absolute inset-0 flex flex-col justify-between p-6">`
  - **Top row:** `<div className="flex items-start justify-between">`
    - Left: status badge + type badge inline, `gap-2`. Same status-badge markup as grid; type badge uses `bg-white/10 text-white border-white/20 backdrop-blur-sm` (white-on-dark default — type badge visual is overridden in feed since image background is dark).
    - Right: days-until pill OR ongoing pill (same logic + markup as grid, but with `bg-white/10 backdrop-blur-md rounded-lg px-3 py-2 text-center` styling for white-on-dark contrast).
    - **`actions` slot** (when supplied): replaces the right-side days-until pill; days-until pill moves below the title row in the meta row.
  - **Bottom block:** `<div>` containing
    - Title: `<h3 id={titleId} className={cn("text-xl md:text-2xl font-bold text-white mb-3 line-clamp-2 motion-safe:group-hover:text-accent transition-colors", titleClassName)}>{featured && <Star aria-hidden className="inline w-4 h-4 fill-primary text-primary mr-1.5 align-baseline" />}{event.title}{featured && <span className="sr-only">{labels.featuredAriaLabel}</span>}</h3>`
    - **Inline meta row:** `<ul role="list" className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-white/80 mb-4">` with Calendar+date / Clock+time / MapPin+location / Users+spots-left rows. Each `<li>` is `flex items-center gap-1.5`. **No description in feed** (per source).
    - **No capacity progress bar in feed** (per source — feed shows only the spots-left counter inline). Documented as variant difference.
    - **CTA + chevron row:** `<div className="flex items-center justify-between">` with the decorative CTA on the left (size `sm`, white-on-dark variant for non-default statuses) + a "View event" arrow indicator on the right (`<ArrowRight className="w-4 h-4 motion-safe:group-hover:translate-x-1 transition-transform" />` with `rtl:rotate-180`).
- Link overlay: same as grid — `<linkComponent>` covers the whole article.

### 3.5 `parts/list.tsx` — dense info-rich row (event-specific)

Anatomy:

- Root `<article className={cn("relative group grid grid-cols-[auto_1fr_auto] gap-3 sm:gap-4 py-3 px-3 border-b border-border/50 last:border-0 motion-safe:hover:bg-muted/30 transition-colors rounded-lg items-center", statusEntry.cardClassName, featured && "border-l-4 border-l-primary", className)}>`
  - `border-l-4 border-l-primary` is the **list variant's featured treatment** (different from grid's `border-t-4` because the row is horizontal — left accent reads better than top in a stacked list).
- **Thumbnail left:** `<div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-lg overflow-hidden shrink-0">` — square thumb, no hover-scale (too small for it to read well; chevron / right-slot indicator does the hover affordance instead). `<ImageFallback />` when `event.image` missing.
- **Content middle:** `<div className="flex flex-col justify-center min-w-0">` — the `min-w-0` is critical for the line-clamp / truncate to work inside a grid child.
  - **Top inline row:** Status badge (size-down: `text-[10px]` + `w-3 h-3` icon) + Type badge (also `text-[10px]`, `truncate max-w-[120px]`) — `flex items-center gap-1.5 mb-1 flex-wrap`.
  - **Title:** `<h4 id={titleId} className={cn("text-sm font-semibold line-clamp-1 mb-1 motion-safe:group-hover:text-primary transition-colors", titleClassName)}>` — featured prefix Star (`w-3.5 h-3.5`) + title + `<span className="sr-only">{labels.featuredAriaLabel}</span>`.
  - **4-icon meta row** (the event-specific surface):  `<ul role="list" className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">` containing 1-4 `<li>` rows for date / time / location / spots-left. All icons sized `w-3 h-3 text-primary shrink-0`. **Spots-left flips to `text-destructive` when `spotsLeft <= 5 && spotsLeft > 0`** (mirrors grid behavior). Location truncates at `max-w-[140px]`. Time / location / spots-left omit if absent (soft-failure).
- **Right slot** (`<div className="flex items-center justify-end self-center shrink-0">`): status-aware — exactly one of the four:
  1. `actions` (when supplied) — wins; cluster at `z-10` over the link overlay.
  2. `status === "ongoing"` — small pulsing pill: `<span className="bg-accent/20 text-accent-foreground rounded-full px-2.5 py-1 text-[10px] font-semibold">` + `motion-safe:animate-pulse` dot + `{labels.ongoingIndicator}`.
  3. `status === "expired"` — chevron only: `<ArrowRight aria-hidden className="w-4 h-4 text-muted-foreground motion-safe:group-hover:text-primary motion-safe:group-hover:translate-x-1 rtl:rotate-180" />`.
  4. **Default (open / upcoming / lastSpots / full)** — days-until indicator: `<div className="text-center px-2 min-w-12"><div className="text-base font-bold leading-none">{daysUntil}</div><div className="text-[10px] text-muted-foreground mt-0.5">{labels.daysUntilSuffix}</div></div>`.
- **Link overlay:** same overlay-link pattern as grid + feed — covers the whole row.

**Event-specific delta over content-card-news-01's `list` variant:**

| | news/list | event/list |
|---|---|---|
| Top badge | category (semantic-only) | **status** (status state machine + icon + color) AND type (event-specific taxonomy) |
| Inline meta | category + relative-time | **4-icon row: date · time · location · spots-left** (event has when/where/how-many) |
| Right slot | static chevron | **status-aware: days-until count / ongoing pulse / expired chevron / actions** |
| Featured | not differentiated | `border-l-4 border-l-primary` + Star title prefix |
| Excerpt | one-line line-clamp | not rendered — meta row IS the value-add |

The list variant intentionally does NOT render `event.description` — the inline meta row carries more actionable event info per pixel, and a description would compete for vertical rhythm. Description belongs in grid (where vertical space is generous).

**No capacity progress bar** in list (same call as feed) — spots-left counter inline is enough; the bar would dominate the row.

### 3.6 `parts/compact.tsx` — text-only minimal row (sidebar / widget)

Anatomy:

- Root `<article className={cn("relative group py-4 px-2 border-b border-border/50 last:border-0 motion-safe:hover:bg-muted/30 transition-colors rounded-md", statusEntry.cardClassName, className)}>`
  - `statusEntry.cardClassName` is preserved (so `expired` events still fade).
  - **No featured top/left border** — featured is signaled ONLY by the title `<Star>` prefix. Border treatments would clash with the row-divider rhythm; the simple aesthetic stays clean.
- **Top row:** `<div className="flex items-start justify-between gap-3 mb-2">` containing
  - Title `<h4 id={titleId} className="text-sm font-semibold line-clamp-2 motion-safe:group-hover:text-primary transition-colors flex-1 min-w-0">` — featured Star prefix + title + sr-only featured announcement.
  - **Right slot — actions OR type badge** (mutually exclusive — if `actions` supplied, type moves to inline meta):
    - When `actions`: `<div className="z-10 flex gap-1 shrink-0">{actions}</div>`
    - Else: `<span className={cn("text-xs px-2 py-0.5 rounded shrink-0", typeStyle?.className ?? "bg-muted text-muted-foreground")}>{event.type}</span>`
- **Meta rows** (`<ul role="list" className="space-y-1 text-xs text-muted-foreground">`):
  - When `actions` is present: prepend a type-label `<li>` (no icon, just a small inline pill) so the type semantic isn't lost.
  - Calendar + formattedDate (always — `date` is required)
  - Clock + time (omit if missing)
  - MapPin + location, with `truncate` (omit if missing)
- **Link overlay:** standard overlay-link covering the whole row.

**What's intentionally NOT rendered:**
- No image / thumbnail (text-only)
- No status badge (different from `list` — compact's audience already trusts the listing context, e.g., "Upcoming events" sidebar widget)
- No capacity bar / spots-left counter
- No days-until indicator on the right
- No description block

**When to use:**
- "Upcoming events" sidebar widget on a homepage
- Dense calendar-adjacent listings
- Email digest / notification ticker
- Mobile-first compact event lists where every pixel counts

**Composes with a "See all →" link** below the card stack — the source pattern (kasder homepage) wraps a vertical column of compact rows in a `rounded-2xl border bg-card` container with a footer link.

### 4. `lib/event-status.ts` — public status kernel

```ts
import { AlertCircle, CheckCircle, Timer, XCircle } from 'lucide-react';
import type { ComponentType } from 'react';
import type { EventCardItem } from '../types';

export type EventStatus = 'expired' | 'ongoing' | 'upcoming' | 'open' | 'full' | 'lastSpots';

export interface EventStatusConfigEntry {
  label: string;
  icon: ComponentType<{ className?: string; 'aria-hidden'?: boolean }>;
  className: string;
  cardClassName?: string;
}

export const EVENT_STATUS_CONFIG: Record<EventStatus, EventStatusConfigEntry> = {
  expired: {
    label: 'Ended',
    icon: XCircle,
    className: 'bg-muted text-muted-foreground',
    cardClassName: 'opacity-60 grayscale-30',
  },
  ongoing: {
    label: 'Live now',
    icon: Timer,
    className: 'bg-accent text-accent-foreground motion-safe:animate-pulse',
  },
  upcoming: {
    label: 'Soon',
    icon: AlertCircle,
    className: 'bg-warning text-warning-foreground',
  },
  open: {
    label: 'Registration open',
    icon: CheckCircle,
    className: 'bg-primary text-primary-foreground',
  },
  full: {
    label: 'Sold out',
    icon: XCircle,
    className: 'bg-destructive text-destructive-foreground',
  },
  lastSpots: {
    label: 'Last spots',
    icon: AlertCircle,
    className: 'bg-warning text-warning-foreground',
  },
};

export function getEventStatus(event: EventCardItem, now: Date = new Date()): EventStatus {
  const eventDate = new Date(event.date);
  const endDate = event.endDate ? new Date(event.endDate) : new Date(event.date);
  eventDate.setHours(0, 0, 0, 0);
  endDate.setHours(23, 59, 59, 999);

  // 1. Time-window first (wins over capacity)
  if (now > endDate) return 'expired';
  if (now >= eventDate && now <= endDate) return 'ongoing';

  // 2. Capacity (skipped when capacity/registered absent)
  if (event.capacity != null && event.registered != null) {
    const spotsLeft = event.capacity - event.registered;
    const percentFull = event.capacity === 0 ? 100 : (event.registered / event.capacity) * 100;
    if (spotsLeft <= 0) return 'full';
    if (percentFull >= 80) return 'lastSpots';
  }

  // 3. Time-proximity
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  const daysUntil = Math.ceil((eventDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  if (daysUntil <= 7) return 'upcoming';

  return 'open';
}
```

Pure function. No React imports beyond the type-only `ComponentType`. Tree-shakeable. Consumers can import either `getEventStatus` alone or `EVENT_STATUS_CONFIG` alone without pulling in the card. **Public.**

### 5. `lib/format-default.ts` — public formatters

```ts
export function formatEventDate(dateString: string, locale?: string): string {
  return new Date(dateString).toLocaleDateString(locale, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export function getDaysUntilEvent(dateString: string, now: Date = new Date()): number {
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  const eventDate = new Date(dateString);
  eventDate.setHours(0, 0, 0, 0);
  return Math.ceil((eventDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}
```

Pure functions. Browser-locale aware via `toLocaleDateString(undefined, ...)`. **Public.**

### 6. `lib/image-fallback.tsx` — internal placeholder

```tsx
import { Calendar } from 'lucide-react';

export function ImageFallback({ className }: { className?: string }) {
  return (
    <div className={`flex h-full w-full items-center justify-center bg-muted ${className ?? ''}`}>
      <Calendar aria-hidden className="h-8 w-8 text-muted-foreground/40" />
    </div>
  );
}
```

Internal. Not exported. Used by both grid and feed when `event.image` is missing.

### 7. `types.ts`

All public types (already shown above). The `EventStatus` re-export from `lib/event-status` (so consumers who only need types don't pull `EVENT_STATUS_CONFIG`'s lucide-react imports).

### 8. `dummy-data.ts`

**`dummyNow: Date`** — a fixed reference date (e.g., `new Date('2026-06-01T12:00:00Z')`) exported alongside the events. ALL demos pass `now={dummyNow}` to every card so the rendered statuses are deterministic across SSR + production deployment + screenshots. Without this, demo statuses depend on the real wall clock — events that were `upcoming` at build-time silently become `expired` weeks later. **Critical for CI / demo-screenshot stability.**

**`dummyEvents: EventCardItem[]`** — 8 events. Dates are FIXED ISO strings calibrated against `dummyNow` to demo all 6 statuses:

- 1× `open` — date `dummyNow + 30 days`, capacity 200 / registered 50
- 1× `upcoming` — date `dummyNow + 5 days`, capacity 100 / registered 60
- 1× `lastSpots` — date `dummyNow + 14 days`, capacity 100 / registered 85
- 1× `ongoing` — date `dummyNow` (00:00) → endDate `dummyNow` (23:59)
- 1× `full` — date `dummyNow + 10 days`, capacity 50 / registered 50
- 1× `expired` — endDate `dummyNow - 7 days`
- 1× **featured + open** — to demo featured treatment (override `featured: true` on one of the above)
- 1× **capacity-less** — no `capacity` / `registered`, demos soft-failure

**`dummyTypeStyles: Record<string, { className: string }>`** — covers 5 English type values for the default demos:

```ts
export const dummyTypeStyles = {
  Conference: { className: 'bg-primary/10 text-primary border-primary/20' },
  Webinar: { className: 'bg-chart-3/10 text-chart-3 border-chart-3/20' },
  Workshop: { className: 'bg-chart-2/10 text-chart-2 border-chart-2/20' },
  Panel: { className: 'bg-secondary text-secondary-foreground border-secondary' },
  Training: { className: 'bg-chart-4/10 text-chart-4 border-chart-4/20' },
};
```

**`dummyTrEvents: EventCardItem[]`** — sibling Turkish-localized event array. Same dates / capacities as `dummyEvents` but with Turkish `title` / `description` / `location` strings AND **Turkish `type` field values** (`Konferans` / `Seminer` / `Çalıştay` / `Panel` / `Eğitim`). This is what the Localized demo tab consumes.

**`dummyTrTypeStyles`** — Turkish-keyed type-style map matching the kasder original (5 entries keyed by `Konferans` / `Seminer` / `Çalıştay` / `Panel` / `Eğitim`).

**`dummyTrLabels: EventCard01Labels`** — Turkish-locale labels for the "Localized" demo tab.

**`dummyCustomTypeStyles`** — 5 fully custom OKLCH-tinted entries keyed by the SAME English type values as `dummyTypeStyles` (so the same `dummyEvents` array drops in unchanged). Demonstrates the styling escape hatch.

### 9. `demo.tsx`

8-tab demo, built with shadcn `Tabs`:

All tabs pass `now={dummyNow}` to every card so statuses are deterministic.

1. **Grid** — 8-event responsive grid (`grid md:grid-cols-2 lg:grid-cols-3 gap-6`) covering all 6 statuses + featured + capacity-less rows; consumes `dummyEvents` + `dummyTypeStyles`.
2. **Feed** — 4-event single-column list (open / ongoing / upcoming / lastSpots — the most visually distinct); same data source, `variant="feed"`.
3. **List** — 8-event single-column row stack inside a `rounded-2xl border bg-card` container; demonstrates dense list rendering for sidebars / dashboards. All 6 statuses on display so the right-slot indicator switches between days-until / "Live now" pulse / chevron.
4. **Compact** — 2-column comparison: Turkish-localized `dummyTrEvents` (mirroring the source kasder sidebar pattern) + English-default. Each column is a `rounded-2xl border bg-card` container with a "See all →" footer link. No thumbnail / no status badge / no capacity — just title + type pill + 3 stacked meta lines.
5. **Featured** — 2-card side-by-side comparison: one grid-featured (top-border + star) + one feed-featured (inset ring + star). Proves both treatments side-by-side.
6. **Localized** — consumes `dummyTrEvents` + `dummyTrTypeStyles` + `dummyTrLabels` + `formatDate` callback using `tr-TR` locale. Mirrors kasder's defaults; proves the i18n surface end-to-end (events, type styles, labels, formatter all swapped together).
7. **Custom types** — `dummyEvents` + `dummyCustomTypeStyles` (5 OKLCH-tinted entries different from the default). Demonstrates the styling escape hatch without changing event data.
8. **Actions slot + custom href** — grid variant with an `actions` cluster (Bookmark + CalendarPlus + Share2) + polymorphic `linkComponent={MockNextLink}` + `getHref={(e) => `/etkinlik/${e.id}`}`. Each action button calls `e.preventDefault()` + `e.stopPropagation()` and toggles local state without navigating.

The `now` injection prop is **not** demo'd as its own tab (it powers EVERY tab via `dummyNow`) — documented in usage.tsx as the recommended pattern for live-clock hosts AND for deterministic rendering.

### 10. `usage.tsx`

Code blocks + prose covering:
- Minimal usage (event + variant + href).
- Both variants side-by-side.
- Polymorphic root with NextLink / RemixLink samples.
- Custom `typeStyles`.
- Custom `labels` for i18n (with Turkish example).
- `actions` slot — overlay-link pattern, `e.stopPropagation()` requirement.
- Soft-failure with missing fields (no description / no capacity / no image).
- **Public helper kernel — using `getEventStatus` + `EVENT_STATUS_CONFIG` + formatters WITHOUT rendering the card** (calendar day-cell + "5 events ongoing" header counter examples). This is the dynamicity-and-reusability story made concrete.
- `now` injection for live-clock hosts (controlled-now setInterval pattern).
- `statusOverride` for preview / admin UIs.

### 11. `meta.ts`

```ts
import type { ComponentMeta } from '@/registry/types';

export const eventCard01Meta: ComponentMeta = {
  slug: 'event-card-01',
  name: 'Event Card (01)',
  category: 'data',
  status: 'alpha',
  version: '0.1.0',
  description:
    'Event preview card with 6-state status state machine (open / upcoming / lastSpots / ongoing / full / expired) and 2 visual variants (grid / feed). Polymorphic root, soft-failure item shape, overlay-link pattern, fully customizable. Public helper kernel exports for status / formatting reuse outside the card.',
  // updated, dependencies, tags …
};
```

### 12. `index.ts`

Public exports as shown above.

---

## Dependencies

### Internal (pro-ui)

- `@/components/ui/button` — for `buttonVariants()` helper applied to the decorative CTA div
- `@/components/ui/progress` — **TO INSTALL** (first user; see below)
- `@/lib/utils` — `cn()` helper

> Note: shadcn `Badge` primitive is intentionally NOT a dep. Status + type badges are rendered as raw `<span>` with `cn()`-composed classes — gives us finer control over icon-gap rhythm, gradient backdrop-blur layering, and per-status `motion-safe:animate-pulse` than wrapping `Badge` would.

### NPM

- `react` — runtime + types (already in pro-ui)
- `lucide-react` — icons (`Calendar`, `Clock`, `MapPin`, `Users`, `AlertCircle`, `CheckCircle`, `XCircle`, `Timer`, `Star`, `ArrowRight`). Already in pro-ui.

### Forbidden (not added)

- `next/*` — registry rule
- `framer-motion` — pro-ui Motion mandate uses CSS transitions
- Date library (date-fns / dayjs / luxon) — native Date is sufficient

### Pro-ui-wide additions (non-component)

#### Install shadcn `Progress`

```bash
pnpm dlx shadcn@latest add progress
```

Adds [`src/components/ui/progress.tsx`](../../../src/components/ui/progress.tsx) (Radix-based — has `role="progressbar"` + `aria-valuemin` / `max` / `now` for free). No new transitive deps; `@radix-ui/react-progress` is the underlying primitive. First user is event-card-01; subsequent users (e.g., a future `loading-bar` or upload-progress card) inherit the install.

#### Add `--warning` token to globals.css

Edit [`src/app/globals.css`](../../../src/app/globals.css):

In the `@theme inline` block (after `--color-destructive` line):
```css
--color-warning: var(--warning);
--color-warning-foreground: var(--warning-foreground);
```

In `:root` (after `--destructive` line):
```css
--warning: oklch(0.78 0.16 75);            /* amber */
--warning-foreground: oklch(0.18 0 0);     /* near-black */
```

In `.dark` (after `--destructive` line):
```css
--warning: oklch(0.82 0.15 75);            /* lifted L for graphite bg */
--warning-foreground: oklch(0.13 0 0);     /* near-black */
```

This makes `bg-warning` / `text-warning-foreground` valid Tailwind utilities globally. Reusable beyond this card (form warnings, toast variants, banner alerts, the docs site's `deprecated` badge variant). Chroma 0.16 (under the 0.20 mandate). Hue 75° = amber (between yellow ~95 and orange ~50).

---

## Composition pattern

**Headless wrapping + presentational parts** — same as content-card-news-01.

Root component owns:
- Prop normalization (defaults, formatters, label merge, type-styles lookup, link resolution)
- `useId` for the title's `id`
- `useMemo` for status derivation (memoized over `[event, now]`; cheap but keeps render reads stable)
- Memoization (`React.memo` at export)
- Variant dispatch

Each `parts/<variant>.tsx` is stateless presentational. No business logic in parts.

**No render-prop, no compound API.** The `variant` prop is the single dispatch axis. Consumers extend via slot props (`titleClassName`, `imageClassName`, `className`, `typeStyles`, `actions`).

**Polymorphic root** via `linkComponent: React.ElementType`. Same pattern as content-card-news-01.

---

## Client vs server

**Client component** — `event-card-01.tsx` declares `"use client"`. Required for `useId` + `useMemo` + `React.memo` + the function-rich props (`onClick`, `formatDate`, `linkComponent`, `getHref`).

**Helper modules (`lib/event-status.ts`, `lib/format-default.ts`) have no `"use client"` directive** and are pure modules — they CAN be imported into Server Components (e.g., a server-rendered "5 events ongoing" header that derives status server-side without rendering a card). This is part of the dynamicity-and-reusability story: the kernel works in both client and server contexts.

The parts (`parts/grid.tsx`, `parts/feed.tsx`) and `lib/image-fallback.tsx` inherit the client boundary from the root.

---

## Edge cases

| Case | Behavior |
|---|---|
| `endDate` undefined | Falls back to `date`; single-day event spans midnight → 23:59:59 of `date`. |
| `endDate` < `date` | Status logic still works (now > endDate ⇒ expired, regardless of date order). Doesn't crash. |
| `capacity == null` and `registered == null` | Capacity bar omitted; status logic skips `full`/`lastSpots`; only time-based states reachable. |
| `capacity == null` XOR `registered == null` (one but not the other) | Treated as "missing" — both must be present for capacity logic to run. Documented as soft-failure contract. |
| `capacity === 0` | `percentFull` set to 100 to avoid divide-by-zero; `spotsLeft = 0 - registered = -registered ≤ 0` ⇒ `full`. Edge but consistent. |
| `registered > capacity` | Negative spots-left; `full` status (per `spotsLeft <= 0`); progress bar at 100% (Radix Progress clamps). |
| `image` undefined | `<ImageFallback />` rendered (bg-muted + Calendar icon). |
| `description` undefined | Description block omitted (grid only). |
| `time` undefined | Time meta line omitted; date + location remain. |
| `location` undefined | Location meta line omitted. |
| `time + location` both undefined | Meta block has only the date row. Card stays the same height — Tailwind's `space-y-2` collapses with single child gracefully. |
| `featured: true` + `expired` | Both treatments apply (top-border AND opacity-grayscale). The expired card visually recedes; the featured top-border is dimmed by the opacity. Acceptable — featured-but-expired is a rare edge. |
| `actions` provided + grid variant | Actions cluster at top-right of image area (z-10); type badge moves to bottom-right. |
| `actions` provided + feed variant | Actions cluster at top-right of content overlay area (z-10); days-until pill moves to inline meta row. |
| `statusOverride` provided | Wins over derived status. Used for previews. The `cardClassName` of the status's config still applies (e.g., overriding to `expired` triggers the opacity-grayscale). |
| `now` provided | Used in `getEventStatus` AND in days-until computation. Memoized — only re-derives when `now` changes. |
| Title very long | `line-clamp-2` truncates with ellipsis. |
| Description very long | `line-clamp-2` (grid only). |
| Location very long | `truncate` on the span — single-line truncation. |
| `href` not provided + `getHref` not provided | Falls to `'#'`. Documented as "consumer must supply navigation." Non-breaking. |
| `href` provided AND `getHref` provided | `href` wins (explicit). Document as `href \| getHref` mutually exclusive in the type doc. |
| `linkComponent` not provided | Plain `<a>` is used. SSR + CSR works. |
| RTL | `ArrowRight` (feed only) gets `rtl:rotate-180`. All `gap-*` / `space-*` / `flex` work in RTL via `dir="rtl"` parent. |
| Mobile | Both variants are mobile-friendly out of the box. Grid: 1 column < md, 2 < lg, 3 ≥ lg (consumer's grid CSS). Feed: stays single column at all widths; image height bumps from `h-64` → `h-72` at md+. |
| Reduced motion | All `transition-transform`, `animate-pulse`, `group-hover:scale-*`, `group-hover:translate-x-*` wrapped in `motion-safe:`. Reduced-motion users see static cards (status pulse stops; ongoing-pill dot goes solid). |
| Dark mode | Inherits pro-ui dark tokens. Feed variant's white-on-dark text stays the same (gradient overlays + image background); grid variant's `bg-card` lifts to graphite. |
| Two cards side-by-side, hover one | Hover effects scoped to `group` on the article; sibling cards stay static. |

---

## Accessibility

### Keyboard

- The link overlay is the sole keyboard-focusable element on the card (matches content-card-news-01).
- Tab → focus the card; Enter → navigate.
- When `actions` slot is provided, those interactive children come AFTER the link in DOM order. Tab order: card-link → action1 → action2 → next card.
- Focus-visible ring renders on the article root via `:has(a:focus-visible)` so the visual focus state covers the whole card surface.

### ARIA

- Link uses `aria-labelledby={titleId}` pointing to the heading's `id` (`useId`-generated). Heading text is the link's accessible name.
- Decorative icons (`Calendar`, `Clock`, `MapPin`, `Users`, status icons, `Star`, `ArrowRight`) get `aria-hidden="true"`.
- Image `<img>` carries `alt={event.imageAlt ?? event.title}`. Fallback placeholder's `<Calendar>` is `aria-hidden`.
- Status differentiated by **BOTH color AND icon** (color-blind-safe).
- Capacity progress bar gets `aria-label={\`${labels.capacityAriaPrefix}: ${event.registered} ${labels.capacityAriaSeparator} ${event.capacity}\`}` — Radix's `Progress` role is `progressbar`; we provide the label. Both prefix AND separator are localizable so consumers don't get a half-translated string like `"Kayıtlı: 142 of 200"`.
- Featured-star icon `aria-hidden`; the `<span className="sr-only">{labels.featuredAriaLabel}</span>` after the title injects the screen-reader announcement.
- Decorative CTA `aria-hidden="true"` (the link's accessible name conveys the action).
- Meta lines: `<ul role="list">` (Safari `list-style: none` workaround), `<li>` per row.

### Focus management

- No focus-stealing, no autofocus.
- When the link is clicked, default browser navigation happens (or consumer's `onClick` fires first).

### Screen-reader semantics

- `<article>` for each card.
- Heading level fixed at `h3` for both variants (cards typically render under an `h2` page section heading; consumers can override visual size via `titleClassName`).
- Status changes (when host drives a controlled `now` and status flips) are NOT announced by default — consumers wanting live announcements wrap the card in their own `aria-live` region.

### WCAG 2.1 AA target

- ✅ 1.4.1 Use of Color — status differentiated by color AND icon.
- ✅ 1.4.3 Contrast — all default text/bg pairs meet 4.5:1 (`bg-warning` is amber 0.78L → 0.18L foreground = ~5.5:1; verified). Lime + near-black, white + gradient overlay, etc. — already validated by pro-ui's token system.
- ✅ 1.4.11 Non-text Contrast — focus-visible ring is `ring-2 ring-offset-2`.
- ✅ 2.1.1 Keyboard — full keyboard reach via tab + enter on the link.
- ✅ 2.4.4 Link Purpose — link's accessible name is the event title.
- ✅ 2.4.7 Focus Visible — `focus-visible:ring-*`.
- ✅ 2.5.3 Label in Name — accessible name matches visible heading.
- ✅ 4.1.2 Name, Role, Value — `<article>` + `<a>` + `<h3>` + `aria-labelledby` + `<ul role="list">` + `progressbar` correct.

---

## Verification checklist (mirrors component-guide §13)

- [ ] `pnpm tsc --noEmit` clean (no any, no unknown, props strict; helper signatures match the types.ts re-exports).
- [ ] `pnpm lint` clean (no new warnings; pre-existing rich-card warning OK).
- [ ] `pnpm build` clean — all routes prerendered including `/components/event-card-01`.
- [ ] SSR `curl -s http://localhost:3000/components/event-card-01` returns 200 with all 6 demo tab triggers rendered (Grid / Feed / Featured / Localized / Custom types / Actions slot) + Grid tab default content visible.
- [ ] `/components` index lists the new entry (manifest registration verified).
- [ ] `--warning` Tailwind utilities resolve at runtime — verify by inspecting a `bg-warning` element in the docs site (DevTools shows `oklch(0.78 0.16 75)` light / `oklch(0.82 0.15 75)` dark).
- [ ] Helper-only imports work — write a quick `pnpm tsc --noEmit` test consumer that does `import { getEventStatus } from "@/registry/components/data/event-card-01"` and uses it without rendering the card; passes type-check.
- [ ] Visual sanity (demo screenshots in DevTools): Grid with 6 statuses + 6 distinct color treatments; Feed with white-on-dark; Featured with top-border + star; Localized renders Turkish chars; Custom-types shows 5 OKLCH variants; Actions slot doesn't navigate when buttons clicked.

### Manual browser smoke (post-merge, recommended)

- Tab to a card — focus-visible ring covers the whole card, not just the link rectangle.
- Click anywhere on card surface (including the decorative CTA div) — navigates.
- With actions-slot demo: click an action button — DOES NOT navigate; state toggles.
- Tab through a card with actions — link → action1 → action2 → next card.
- Toggle OS reduced-motion — image scale + ongoing-pulse + arrow translate all disabled; hover shadow + color shift remain.
- Toggle dark mode — both variants adapt; grid lifts to graphite; feed gradient unchanged (image-driven).
- `bg-warning` Tailwind utility renders amber in both light + dark with correct foreground contrast.
- Resize from desktop to mobile — both variants stay readable.
- Screen-reader pass (VoiceOver / NVDA): each card announces "{title}, link" (single utterance via `aria-labelledby`); featured cards add "Featured event"; capacity progress bar announces "Registered: 142 of 200".

---

## Risks & alternatives

### Risk 1: Helper-export API stability

Exporting `getEventStatus` / `EVENT_STATUS_CONFIG` / `formatEventDate` / `getDaysUntilEvent` widens the public surface — breaking changes here become breaking changes for consumers using the kernel without the card. **Mitigation:** lock the signatures now (they're tiny + pure); document in `usage.tsx` that the kernel is part of the API contract; future internal refactors must preserve them. The signatures are deliberately minimal — `getEventStatus(event, now?) → EventStatus` and the formatters take strings + optional locale/now. Hard to break accidentally.

### Risk 2: `EVENT_STATUS_CONFIG` carries lucide imports — bloats consumers using only the kernel

Importing `EVENT_STATUS_CONFIG` pulls 4 lucide icons into the consumer's bundle, even if they only need labels. **Mitigation:** acceptable; lucide-react is tree-shakeable per-icon and consumers wanting label-only access can read `EVENT_STATUS_CONFIG[status].label` without using the icon. Power users can re-implement the config map with their own icons (the type is exported). Splitting `EVENT_STATUS_CONFIG` into `EVENT_STATUS_LABELS` + `EVENT_STATUS_ICONS` was considered — rejected as premature; the unified config matches kasder's pattern and is easier to grok.

### Risk 3: Progress primitive's default tint

shadcn Progress uses `bg-primary` for the filled portion. On `lastSpots` (red flag), the bar tint stays primary while the spots-left counter flips destructive. **Decision (analysis):** keep primary tint; spots-left counter is the urgency signal; double-tinting clutters. Documented in usage.tsx; if real consumer demand for a status-tinted bar emerges, it lives in v0.2 via a `progressClassName` prop.

### Risk 4: Featured + expired collision

A featured event that has expired gets BOTH `border-t-4 border-primary` (or `ring-2` on feed) AND `opacity-60 grayscale-30`. The featured treatment is dimmed by the opacity. **Decision:** acceptable — featured-but-expired is a rare edge case; the visual reads as "this used to be featured." Alternative (drop featured treatment when expired) was considered — rejected; it asymmetrically erases information.

### Risk 5: `--warning` token color choice (amber `oklch(0.78 0.16 75)`)

Hue 75° is between yellow (95°) and orange (50°). **Verification:** chroma 0.16 (under 0.20 mandate); contrast vs near-black foreground ~5.5:1 (passes 4.5:1); distinct from primary (lime, hue 132°) and destructive (red, hue 27°) on both light + dark. **Alternative considered:** orange (hue 50°) — rejected as too aggressive for "soon-ish" semantic; amber strikes the right middle ground.

### Risk 6: Two layered gradients in feed variant cause subtle banding

`bg-linear-to-t from-black/90 via-black/50 to-black/30` + `shadow-[inset_0_60px_80px_-20px_rgba(0,0,0,0.6)]` (preserved from kasder source). On low-color-depth displays, gradient banding might show. **Mitigation:** `via-black/50` softens the transition; tested in source visually fine. If banding shows up post-ship, swap one to a noise-textured overlay (v0.2 candidate).

### Risk 7: `now` injection — stale closure in long-running clients

Consumer drives `now` via `setInterval` upstream. If they forget to clear the interval on unmount, leak. **Mitigation:** documented in usage.tsx with the canonical `useEffect` + `clearInterval` cleanup. Not the card's job to police consumer cleanup.

### Alternatives considered

1. **Compound API** (`<EventCard.Image>`, `<EventCard.Status>`, `<EventCard.Capacity>`). Rejected — variants vary too much in structure (grid stacks; feed overlays); compound API fights the variant system. Same call as content-card-news-01.
2. **Generic over event shape** (`<EventCard01<T extends EventCardItem>>`). Rejected — strict shape is more ergonomic; users map to it cheaply. Generic adds complexity without enabling new use cases.
3. **Internal `setInterval` for live status updates**. Rejected — couples the card to time, can't be SSR'd deterministically, leaks if not cleaned up. `now` injection moves the cadence to the consumer.
4. **Drop `endDate` entirely, derive from `date + time + duration`**. Rejected — forces consumers to pass `duration` everywhere; `endDate` is more direct.
5. **Inline status logic in each part instead of a shared kernel**. Rejected — the kernel is the most valuable part of this migration; centralizing it (and exporting it) is the dynamicity-and-reusability decision.
6. **CSS-Modules per part vs. Tailwind utilities inline**. Rejected — pro-ui's house style is Tailwind utilities. Consistent with prior ships.
7. **Add `--success` token alongside `--warning`**. Rejected — `--primary` (signal-lime) IS the success color in pro-ui; redundancy with `--success` would create two near-identical green tokens.
8. **Keep featured pill at bottom-right of image area**. Rejected (locked decision #5) — image corners overcrowded; top-border treatment is cleaner and works in both variants.
9. **Single layout, no variants — defer feed to v0.2**. Rejected — kasder source already extracts both layouts; shipping with one means a known-pending second variant. Two from v0.1 matches reality.

### Open follow-ups (post v0.1.0)

- v0.2: skeleton companion (`<EventCard01.Skeleton variant="grid" />`).
- v0.2: status-tinted progress bar (via a `progressClassName` prop or a `progressTone` prop derived from status).
- v0.2: register-in-place dialog as an opt-in slot (`<EventCard01.RegisterDialog>` compound, or just a worked usage example with a consumer-supplied dialog).
- v0.2: `events-grid-layout-01` sibling — search + filter + infinite scroll + featured-item slot, mirroring `grid-layout-news-01`. Composes with this card.
- v0.3: `compact` / `list` variants if real consumer demand surfaces.
- v0.3: `event-detail-page-01` — speakers / schedule / organizer / requirements (the `EventDetail` shape from kasder, deferred from this card).
