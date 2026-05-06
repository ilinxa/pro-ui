# Event Card 01 — migration analysis

> Extraction pass for [`docs/migrations/event-card-01/`](./). Filled by the assistant after reading `original/` and `source-notes.md`. Reviewed and signed off by you before the procomp gate begins.
>
> Pipeline: [`docs/migrations/README.md`](../README.md). Locked-in decisions: see [`source-notes.md`](./source-notes.md#locked-in-decisions-signed-off-2026-05-02).

## Source artifacts read

- [`original/EventCard.tsx`](./original/EventCard.tsx) — 247 lines, primary grid card
- [`original/SocialEventCard.tsx`](./original/SocialEventCard.tsx) — 122 lines, full-bleed feed variant; reuses the four exported helpers from `EventCard.tsx`
- [`original/eventsType.ts`](./original/eventsType.ts) — `EventType` (12 fields), `EventStatus` (6-string union), `EventCardProps`, `FilterType`

The full kasder source has a much richer `EventDetail` shape (with `speakers`, `schedule`, `organizer`, `requirements`, `address` etc) — this card only needs the leaner `EventType`. Detail-page material out of scope.

## Design DNA to PRESERVE

Distilled from `original/EventCard.tsx` + `original/SocialEventCard.tsx`. These are the visual / behavioral decisions worth keeping verbatim — the parts that make these cards feel intentional rather than generic.

### Status state machine — the kernel

`getEventStatus(event)` returns one of 6 named states; all visual differentiation downstream flows from these names. The derivation order is meaningful and **must be preserved**:

1. **Time-window first** — if `now > endDate`: `expired`. If `now ∈ [eventDate, endDate]`: `ongoing`. Time wins over capacity.
2. **Capacity next** — if `capacity - registered <= 0`: `full`. If `registered / capacity >= 0.8`: `lastSpots`.
3. **Time-proximity last** — if `daysUntil <= 7`: `upcoming`. Else: `open`.

Edge case: `eventDate.setHours(0,0,0,0)` + `endDate.setHours(23,59,59,999)` — events span their entire start day through their entire end day. `endDate` falls back to `eventDate` when single-day. **Preserve verbatim.**

### Visual states (`grid` variant — image-on-top)

| Slot | What | Notes |
|---|---|---|
| Image area top-left | Status badge — icon + label | `gap-1.5 px-3 py-1`. `ongoing` adds `motion-safe:animate-pulse` |
| Image area top-right | Type badge — colored by event.type | `backdrop-blur-sm` for legibility over image |
| Image area bottom-left | Days-until overlay (`{n}\ngün kaldı`) — large 2xl-bold + small label | `bg-black/70 backdrop-blur-sm rounded-lg px-3 py-2 text-white`. Hidden when `expired` or `ongoing` |
| Image area bottom-left (alt) | "Şu an devam ediyor" pulsing dot | Same slot as days-until; only when `ongoing`. Pill-shape with `bg-accent/90`, dot `animate-pulse` |
| Card foot — meta lines | Calendar / Clock / MapPin icon-prefixed rows | `text-sm text-muted-foreground`, icons `w-4 h-4 text-primary`, location truncated |
| Card foot — capacity bar | Users-icon + `{registered} / {capacity}` + spots-left counter + Progress bar | Spots-left flips `text-destructive` when ≤5 |
| Card foot — CTA | Status-labeled button | Width 100%, label varies by status (Register / Join / View Details / Sold Out) |
| Card chrome on `expired` | `opacity-60 grayscale-[30%]` | Applied to the whole link wrapper, not just the image. The card visually recedes |

### Visual states (`feed` variant — full-bleed)

Mirrors the social-feed aesthetic: `h-64 md:h-72 overflow-hidden` rectangle, image as `absolute inset-0` background, `bg-gradient-to-t from-black/90 via-black/50 to-black/30` overlay, content in `absolute inset-0 flex flex-col justify-between p-6`. White-on-dark text throughout (`text-white`, `text-white/80`, `text-white/60`).

| Slot | What |
|---|---|
| Top row left | Status badge + type badge inline |
| Top row right | Days-until OR ongoing pill (mutually exclusive — same logic as grid) |
| Bottom row title | `text-xl md:text-2xl font-bold text-white line-clamp-2` |
| Bottom row meta | Inline flex-wrap: Calendar / Clock / MapPin / Users (with spots-left) — gap-x-4 gap-y-2 |
| Bottom row footer | Status-CTA + "Etkinlik Detayı →" arrow indicator |

### Type-color map

`Konferans` / `Seminer` / `Çalıştay` / `Panel` / `Eğitim` each get a tinted token combo (e.g. `bg-primary/10 text-primary border-primary/20`). The PATTERN — `bg-{token}/10 text-{token} border-{token}/20` — is reusable; the specific Turkish keys are not. Lift to `typeStyles?: Record<string, { className: string }>` matching content-card-news-01's `categoryStyles`.

### Motion

- `transition-transform duration-700 group-hover:scale-110` on image (grid) / `group-hover:scale-105` on image (feed) — gate via `motion-safe:`
- `transition-all duration-500` on the card chrome (grid hover-shadow lift)
- `motion-safe:animate-pulse` on the ongoing-status pulsing dot
- The kasder `style={{ animationDelay }}` is wired to no actual keyframe — drop it; staggered reveal is a layout concern (per pro-ui's "one orchestrated reveal per major page" mandate)

### Typography

- Title: `text-xl font-bold` (grid) / `text-xl md:text-2xl font-bold` (feed). **Sans, not serif** — events feel like utilities, not editorial. Stick with default `--font-sans` (Onest). Differs from content-card-news-01 (which uses `--font-serif` for editorial DNA).
- Meta: `text-sm text-muted-foreground` (grid) / `text-sm text-white/80` (feed)

## Structural debt to REWRITE

Default action for each item: rewrite. Deviations called out explicitly.

### Framework coupling

- `import Link from "next/link"` → polymorphic `linkComponent: ElementType` slot (default `"a"`); same pattern as content-card-news-01 / author-card-01 / thumb-list-01.
- Hardcoded route `href={\`/events/${event.id}\`}` → required `href: string` prop OR a `getHref?: (event: EventType) => string` callback for consumers who want to derive (default identity returns `event.href ?? '#'`).

### i18n / l10n

All Turkish strings hoisted to a `labels` object with English defaults:

```ts
type EventCard01Labels = {
  // status badges
  expired: string;       // default "Ended"
  ongoing: string;       // default "Live now"
  upcoming: string;      // default "Soon"
  open: string;          // default "Registration open"
  full: string;          // default "Sold out"
  lastSpots: string;     // default "Last spots"
  // overlays
  daysUntilSuffix: string;     // default "days left"
  ongoingIndicator: string;    // default "Happening now"
  // capacity
  spotsLeftSuffix: string;     // default "spots left"
  spotsLeftFull: string;       // default "Sold out"
  // CTA
  ctaRegister: string;         // default "Register"
  ctaJoin: string;             // default "Join"
  ctaViewDetails: string;      // default "View details"
  ctaSoldOut: string;          // default "Sold out"
  // a11y
  featuredAriaLabel: string;   // default "Featured event"
};
```

`tr-TR` formatter → `formatDate?: (dateString: string) => string` callback (default uses `Intl.DateTimeFormat(undefined, { day: "numeric", month: "long", year: "numeric" })` — undefined locale = browser default).

### Color tokens — wire `--warning` (locked decision #2)

Add to [src/app/globals.css](../../../src/app/globals.css):

```css
/* @theme inline block */
--color-warning: var(--warning);
--color-warning-foreground: var(--warning-foreground);

/* :root */
--warning: oklch(0.78 0.16 75);            /* amber */
--warning-foreground: oklch(0.18 0 0);     /* near-black */

/* .dark */
--warning: oklch(0.82 0.15 75);            /* lifted L for graphite bg */
--warning-foreground: oklch(0.13 0 0);     /* near-black */
```

This makes `bg-warning` / `text-warning-foreground` valid Tailwind utilities. The status-config map then resolves to:

```ts
const STATUS_CLASSNAMES: Record<EventStatus, string> = {
  expired:    "bg-muted text-muted-foreground",
  ongoing:    "bg-accent text-accent-foreground motion-safe:animate-pulse",
  upcoming:   "bg-warning text-warning-foreground",
  open:       "bg-primary text-primary-foreground",
  full:       "bg-destructive text-destructive-foreground",
  lastSpots:  "bg-warning text-warning-foreground",
};
```

### Type-color map

Closed Turkish-string-keyed `typeColors` → `typeStyles?: Record<string, { className: string }>` prop with a sensible default empty map. Consumers wire their own type → color mapping. Same pattern as content-card-news-01's `categoryStyles`.

### CTA decoration (locked decision #3)

The CTA at the foot becomes a **decorative `<div role="button">`** — visual only, no interactivity beyond inheriting the wrapping link click. Reasons: nested `<button>` inside `<a>` is invalid HTML + ambiguous a11y. Style mirrors shadcn `Button` via the `cn()` + `buttonVariants()` helper from [src/components/ui/button.tsx](../../../src/components/ui/button.tsx) (or just direct shadcn classes).

### `index` prop

Drop. The original wires `style={{ animationDelay: \`${index * 100}ms\` }}` but no keyframe ever fires it — dead code. Stagger orchestration is a layout-level concern.

### `actions` slot (new — for nested interactives)

Add `actions?: ReactNode` slot rendered at `absolute z-10` (top-right or bottom-right of the image area in grid; top-right of the content overlay in feed). Consumers drop bookmark / share / add-to-calendar / register-in-place buttons here. Mirrors content-card-news-01.

### Image fallback

`event.image` always rendered, no fallback. For v0.1: render a tinted placeholder (`bg-muted` block + `<Calendar>` icon centered) when `image` is falsy. Cheap and prevents broken-image icons. `loading="lazy"` on `<img>`.

### Featured (locked decision #5)

Drop bottom-right pill. When `featured`:
- Card chrome gets `border-t-4 border-primary` (or top accent style in `feed` variant — TBD in plan, possibly a `ring-2 ring-primary` for the dark-image background)
- `<Star className="w-4 h-4 fill-primary text-primary" aria-label={labels.featuredAriaLabel} />` icon prefix on the `<h3>` (with `aria-hidden` on the icon and the label on a `<span className="sr-only">`)

### Helpers — public exports (locked decision #4)

Lift the four helpers into `lib/event-status.ts` and `lib/format-default.ts`:

```ts
// lib/event-status.ts
export type EventStatus = "expired" | "ongoing" | "upcoming" | "open" | "full" | "lastSpots";
export function getEventStatus(event: EventType, now?: Date): EventStatus;
export const EVENT_STATUS_CONFIG: Record<EventStatus, EventStatusConfig>;

// lib/format-default.ts
export function formatEventDate(dateString: string, locale?: string): string;
export function getDaysUntilEvent(dateString: string, now?: Date): number;
```

Re-exported from `index.ts`. The `now?: Date` parameter (defaulting to `new Date()`) is a small but important addition — lets consumers test status logic deterministically and lets host code derive status against a controlled "now" (e.g., a calendar view's selected day).

### a11y

- `aria-labelledby={titleId}` (computed via `useId`) on the wrapping link → accessible name is the title, not the flattened text content
- `id={titleId}` on `<h3>`
- Decorative icons get `aria-hidden="true"`
- Image `<img>` carries `alt` with `event.title` fallback
- `motion-safe:` prefix on all transforms / pulse animations
- `<ul role="list">` for the meta lines (Safari `list-style: none` workaround), `<li>` per meta row

## Dependency audit

### Existing pro-ui primitives — already installed

Confirmed present in `src/components/ui/`:
- `badge.tsx`, `button.tsx`, `card.tsx` (not used directly — we render raw `<article>` for fine-grained image-overlay control), `tabs.tsx` (for demo)

### NEW shadcn primitive to install

- **`progress`** — `pnpm dlx shadcn@latest add progress`. First user in pro-ui. Used in the grid variant's capacity bar. Confirmed `Progress` is a Radix primitive in shadcn New York preset; no peer-dep surprises.

### Lucide icons — already a transitive dep

All required icons are already in lucide-react: `Calendar`, `Clock`, `MapPin`, `Users`, `AlertCircle`, `CheckCircle`, `XCircle`, `Timer`, `ArrowRight`, `Star`. No new install.

### Nothing else

No date-fns, no framer-motion, no react-icons, no datepicker peer dep. Status helpers are pure JS; format helpers use native `Intl`.

## Dynamism gaps

What needs to lift from "implementation detail" to "consumer-controllable surface":

| Source has | New surface |
|---|---|
| Hardcoded `Link` from `next/link` | `linkComponent?: ElementType` (default `"a"`) |
| Hardcoded `/events/${id}` route | `href: string` (required) OR `getHref?: (event) => string` callback |
| Hardcoded `tr-TR` locale formatter | `formatDate?: (dateString: string) => string` callback |
| Hardcoded Turkish strings | `labels?: Partial<EventCard01Labels>` |
| Hardcoded type-color map (Turkish keys) | `typeStyles?: Record<string, { className: string }>` |
| Single layout, no variant prop | `variant: "grid" \| "feed"` (required) — dispatches to `parts/grid.tsx` / `parts/feed.tsx` |
| No actions slot | `actions?: ReactNode` (overlay-link pattern) |
| No "now" injection | `now?: Date` (testability + deterministic status) |
| No status override | `statusOverride?: EventStatus` (rare — but lets host show e.g. all events as "open" in a preview state) |
| No render-prop slots | Consider for v0.2 — `renderFooter?` / `renderMeta?`. v0.1 ships with a closed surface; revisit if real consumer needs emerge |
| Capacity hidden on `feed`? | Source `SocialEventCard` doesn't render the progress bar — only the spots-left counter inline with meta. Honor that: `feed` variant does NOT render the progress bar; `grid` does. Encoded in the variant parts, not as a prop |

## Optimization gaps

| Concern | v0.1 plan |
|---|---|
| Re-render on parent re-render | Wrap default export in `React.memo` with default shallow comparison. The card receives `event: EventType` (object) — consumers pass stable refs from their data layer, otherwise memo busts. Documented in `usage.tsx`. |
| Status re-derived every render | `useMemo` over `[event, now]`. Status derivation is ~10 ns; memo is for readability, not perf. |
| Stale `now` between renders | Card computes against `now ?? new Date()` at render. Consumers wanting live updates pass a controlled `now` from a `setInterval` upstream. **No internal `setInterval`** — keeps the card pure, lets consumers control update cadence |
| Image lazy-load | `loading="lazy"` on `<img>` |
| Suspense / code-split | None at this scope. `event-card-01` is a leaf component. |
| React Compiler | Already auto-applied (Next.js 16 React Compiler default). No manual memo of inline functions needed; the `React.memo` at the export boundary is the only explicit optimization. |

## Accessibility gaps

| Concern | v0.1 plan |
|---|---|
| Accessible link name | `aria-labelledby={titleId}` via `useId` — link's name is the title, not the flattened content |
| Decorative icons | All lucide icons get `aria-hidden="true"` |
| Image alt | `alt={event.imageAlt ?? event.title}` |
| Keyboard nav | Native `<a>` + `<div role="button">` decorative — keyboard works via the link. Real interactive `actions` slot interactives are consumer-supplied `<button>`s with their own a11y. |
| Focus-visible | `focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2` on the link |
| Reduced motion | All transforms + pulse animations gated via `motion-safe:` prefix. Reduced-motion users see static cards. |
| Status changes (live updates) | Out of scope for v0.1. If a consumer drives a controlled `now` that flips status, they can wrap the card in their own `aria-live` region. |
| Color-only status differentiation | Each status has BOTH a color AND an icon (Timer / AlertCircle / CheckCircle / XCircle). Color-blind users still get the icon signal. |
| Capacity progress bar | shadcn `Progress` is Radix-based — has `role="progressbar"` + `aria-valuemin`/`max`/`now` for free. Add `aria-label={\`${event.registered} of ${event.capacity} registered\`}` for screen-reader clarity. |
| RTL | No directional icons in v0.1 except `ArrowRight` in feed variant footer — add `rtl:rotate-180` |

## Proposed procomp scope

**Single component, two-variant dispatch** — same shape as content-card-news-01:

```
src/registry/components/data/event-card-01/
├── event-card-01.tsx              # variant dispatcher (memoized export)
├── parts/
│   ├── grid.tsx                   # image-on-top layout
│   └── feed.tsx                   # full-bleed background layout
├── lib/
│   ├── event-status.ts            # getEventStatus + EVENT_STATUS_CONFIG (public)
│   └── format-default.ts          # formatEventDate + getDaysUntilEvent (public)
├── hooks/                         # likely empty for v0.1; may not exist
├── types.ts                       # EventCardItem + EventCard01Props + EventCard01Labels + variant + EventStatus re-export
├── dummy-data.ts                  # ~6 mixed events covering all 6 statuses
├── demo.tsx                       # 6 sub-tabs (see below)
├── usage.tsx                      # consumer notes
├── meta.ts                        # ComponentMeta
└── index.ts                       # public exports — EventCard01, EVENT_STATUS_CONFIG, getEventStatus, formatEventDate, getDaysUntilEvent, EventStatus, EventCardItem, etc.
```

Estimated file count: 12 files (1 root + 2 parts + 3 lib + types + dummy + demo + usage + meta + index). Comparable to content-card-news-01 (14 files); fewer because we ship 2 variants instead of 5.

### Demo plan — 6 sub-tabs

1. **Grid — basic** — 6-event mixed grid covering all 6 statuses (open / upcoming / lastSpots / ongoing / full / expired)
2. **Feed** — single-column feed with the same 6 events, full-bleed variant
3. **Featured** — same 6 events but one is `featured: true` showing the top-border + star prefix
4. **Localized** — Turkish labels override (proves the i18n surface) — uses `labels` + `formatDate` + `typeStyles` with Turkish category keys, mirroring kasder's defaults
5. **Custom type colors** — demo of `typeStyles` prop with 5 custom OKLCH-tinted entries
6. **Actions slot + custom href** — demo with bookmark + share buttons in `actions`, polymorphic `linkComponent`, custom `getHref`

### Public API surface (locked-in via decisions)

```ts
// from index.ts
export { EventCard01 } from "./event-card-01";
export type {
  EventCard01Props,
  EventCardItem,
  EventCard01Labels,
  EventCard01Variant,
} from "./types";
export {
  getEventStatus,
  EVENT_STATUS_CONFIG,
  type EventStatus,
} from "./lib/event-status";
export {
  formatEventDate,
  getDaysUntilEvent,
} from "./lib/format-default";
```

### Out-of-scope for v0.1

- Live-clock auto-refresh (consumer controls `now` if they want it)
- Registration flow / dialog / capacity-update mutation
- Calendar / ICS export
- Speakers / schedule / organizer / requirements blocks (those belong to a separate `event-detail-page-01` if/when needed — explicitly NOT this card)
- Render-prop slots beyond `actions` (revisit in v0.2 if needed)
- Layout-level featured treatment (deferred to a future `events-grid-layout` component)
- `compact` / `list` variants (revisit when a real consumer surfaces; two variants is enough for v0.1)

## Recommendation

**PROCEED to procomp description (Stage 1).**

The scope is clear, the design DNA is well-formed (status state machine + visual states are the kernel; everything else is rewrite), the variants are real (kasder already extracted them naturally), the dependency footprint is minimal (1 new shadcn primitive: `progress`; 1 new design-system token: `--warning`), and the API surface lifts cleanly from kasder's existing helper-export pattern.

Closest precedent in pro-ui: **content-card-news-01** (same "data" category, same multi-variant story, same overlay-link + actions-slot pattern, same `--font-*` token decisions). Reuse its conventions; expect a similar implementation arc.

**Next step:** I draft `event-card-01-procomp-description.md` (what the component IS, why it exists, what consumers do with it). Pause for your sign-off before the plan doc.

---

## Open items the description / plan should resolve

These didn't need a decision before analysis but will surface during description / plan authoring. Flagging here so we don't lose them:

1. **`feed` variant featured treatment** — `border-t-4 border-primary` works on the grid card chrome, but the feed variant has no card chrome (it's a full-bleed image). Probably resolves to `ring-2 ring-primary ring-inset` on the feed card OR a star-only treatment (no border at all). Decide in the plan.
2. **`now?: Date` injection** — confirmed in v0.1, but the demo doesn't currently use it. Worth a `now` demo tab if we have surface budget? Or leave for usage.tsx documentation.
3. **`actions` slot positioning per variant** — grid variant: top-right of the image area conflicts with type badge. Maybe top-right when actions are present, push type badge to bottom-right (where featured pill used to live). Decide in plan.
4. **`memberSince` / `social-feed-context` strings on kasder feed** — the `KASDER ETKINLIK` brand-tag at the top of `SocialEventCard` is kasder-specific. Drop entirely (no slot); consumers add their own brand tag via the `actions` slot if they want.
5. **Capacity bar tone on `lastSpots`** — currently the bar inherits `Progress`'s primary color. When `lastSpots` (red flag), should the bar tint warn? Probably not — the spots-left counter already flips destructive at ≤5, the bar staying primary keeps the visual quiet. Confirm in plan.
6. **Typography for the title — sans not serif.** Differs from content-card-news-01 (which uses `--font-serif` for editorial DNA). Events are utilities, not editorial. Document the decision in the description.
