# Event Card 01 — migration source notes

> Intake doc for [`docs/migrations/event-card-01/`](./). The assistant pre-filled what is derivable from the source code; please review, correct, and fill the **"What I like"** / **"What bothers me"** / **"Constraints"** sections from your perspective. The companion `analysis.md` is filled by the assistant after this doc is signed off.
>
> See [`docs/migrations/README.md`](../README.md) for the full pipeline.

## Source

- **App:** kasder — `kas-social-front-v0` (Next.js 15 / React 19, shadcn/ui, Tailwind v4)
- **Path in source:**
  - `src/components/public/sections/events/EventCard.tsx` (primary — grid card)
  - `src/components/social/events/SocialEventCard.tsx` (companion — full-bleed feed variant)
  - `src/types/eventsType.ts` (shared `EventType` + `EventStatus` + `FilterType`)
- **Used in:**
  - `EventsGrid.tsx` (public events page) — renders `<EventCard>` in a 1/2/3-column responsive grid with search + status filter + infinite scroll. **Note:** the grid surrounding logic overlaps with our shipped `grid-layout-news-01` + `filter-bar-01`; not part of this migration.
  - `app/social/home/page.tsx` — renders `<SocialEventCard>` in the social feed (single column, full-bleed).
- **Related code:**
  - `src/data/eventsData.ts` (`generateMockEvents()` — fixture generator, used in EventsGrid)
  - `src/components/ui/badge.tsx` + `src/components/ui/button.tsx` + `src/components/ui/progress.tsx` (shadcn primitives consumed)
  - lucide-react icons: `Calendar`, `Clock`, `MapPin`, `Users`, `AlertCircle`, `CheckCircle`, `XCircle`, `Timer`, `ArrowRight`

## Role

Renders a single event with everything a registrant needs to decide whether to sign up: date, time, location, capacity progress, and a status-aware CTA. The card encodes a **6-state status state machine** (`open` / `upcoming` / `lastSpots` / `ongoing` / `full` / `expired`) derived from the current time vs. event date+endDate vs. capacity vs. registered count — the card is "alive" in the sense that its visual state changes with the clock and with registrations, not just with prop changes.

Two layouts exist at the source — same data, different presentation contexts:
- **Grid card** (`EventCard.tsx`) — image-on-top + content-below pattern; rendered at 1/2/3 columns in a magazine-style listing.
- **Full-bleed feed** (`SocialEventCard.tsx`) — image-as-background with content overlaid in white-on-dark; rendered single-column in the social feed. Reuses `getEventStatus` / `statusConfig` / `formatDate` / `getDaysUntil` from EventCard — kasder already factored those out as shared helpers.

This is strong evidence that **variants are real** for this card (similar to content-card-news-01's 5-variant story, but smaller — at minimum `grid` + `feed`).

## What I like (preserve)

> **Filled-in starting point — please add / strike-through / refine.** Sections marked **[ASSISTANT-DERIVED]** are the assistant's read of what looks intentional in the source; you have final say.

**[ASSISTANT-DERIVED] Status state machine** — the 6-named-state derivation in `getEventStatus()` (lines 10–47 of EventCard.tsx) is the most thoughtful part of the source. Edge cases are handled in the right order: time window first (expired / ongoing) before capacity-derived states (full / lastSpots) before time-proximity (upcoming). The named state set drives all visual differentiation downstream.

**[ASSISTANT-DERIVED] Status badge with icon + label, top-left over image** (lines 137–143) — pulse animation specifically for `ongoing`. Reads at-a-glance which events are live right now.

**[ASSISTANT-DERIVED] Days-until countdown overlay** — the large 2xl-bold number + small "gün kaldı" label, bottom-left over image (lines 152–158). Appears only for non-expired/non-ongoing — meaning the slot is reused for the "Şu an devam ediyor" pulsing dot when ongoing (lines 160–166).

**[ASSISTANT-DERIVED] Capacity progress bar** with `{registered} / {capacity}` + spots-left counter (lines 202–219). Spots-left flips to `text-destructive` when `<= 5` for urgency.

**[ASSISTANT-DERIVED] Status-driven CTA at the card foot** — Register / Join / View Details / Sold Out, with `disabled` for `full` (lines 221–239). The button is the action; the card is selectable as a whole link.

**[ASSISTANT-DERIVED] Opacity + grayscale 30% on the entire link wrapper for expired events** (line 124, applied via `bgClass`) — the whole card visually recedes when the event is over. Subtle but effective.

**[ASSISTANT-DERIVED] "Featured" pill bottom-right** — small primary-tinted lozenge (lines 168–173).

**[ASSISTANT-DERIVED] Type badge top-right with type-specific color map** (`Konferans` / `Seminer` / `Çalıştay` / `Panel` / `Eğitim` — lines 88–94, 145–150). Backdrop-blur-sm for legibility over the image.

**[ASSISTANT-DERIVED] Helpers exported as a public surface** (`getEventStatus`, `statusConfig`, `formatDate`, `getDaysUntil` — line 247). `SocialEventCard` consumes them. Suggests the helpers are the actual reusable kernel; the card visual is one consumer.

> Add anything else here — visual rhythms, animation timings, color choices, micro-interactions you specifically want to keep.

-

## What bothers me (rewrite)

> **Filled-in starting point — assistant's read of structural debt.** Tell me what else bugs you.

**[ASSISTANT-DERIVED] `next/link` hardcoded** — registry mandate forbids `next/*`. Will swap to polymorphic `linkComponent` slot (default `"a"`).

**[ASSISTANT-DERIVED] Hardcoded `/events/${event.id}` route** — needs `href` prop or `getHref(event)` callback so consumers control routing.

**[ASSISTANT-DERIVED] Hardcoded Turkish strings everywhere** — `"Sona Erdi"`, `"Devam Ediyor"`, `"Yaklaşıyor"`, `"Kayıt Açık"`, `"Kontenjan Dolu"`, `"Son Yerler"`, `"gün kaldı"`, `"Şu an devam ediyor"`, `"Öne Çıkan"`, `"yer kaldı"`, `"Dolu"`, `"Katıl"`, `"Kayıt Ol"`, `"Detayları Gör"`. All need to flow through a `labels` object with sensible English defaults.

**[ASSISTANT-DERIVED] `tr-TR` locale baked into `formatDate`** — needs `formatDate?: (date: string) => string` callback (consumer's locale) with a sensible English fallback.

**[ASSISTANT-DERIVED] `bg-warning` / `bg-success` / `text-warning-foreground` / `text-success-foreground` tokens are referenced but DON'T exist in pro-ui's `globals.css`** — only `--primary` / `--secondary` / `--accent` / `--destructive` / `--muted` are defined. **Decision needed:** (a) add `--warning` / `--success` tokens to pro-ui as part of this migration, or (b) map status colors to existing palette (e.g., `open` → `bg-primary` lime, `upcoming`/`lastSpots` → inline OKLCH amber, `full` → `bg-destructive`). Option (b) is closer to "ship the card, don't expand the design system." Option (a) is more honest if status colors are a recurring need.

**[ASSISTANT-DERIVED] Type-color map is a closed set keyed by Turkish strings** (`Konferans` / `Seminer` / `Çalıştay` / `Panel` / `Eğitim`). Needs to lift to a `typeStyles?: Record<string, { className: string }>` prop matching the `categoryStyles` pattern from content-card-news-01.

**[ASSISTANT-DERIVED] `index` prop drives `animationDelay`** (line 125 — `style={{ animationDelay: ${index * 100}ms }}`) — but the original doesn't actually define a corresponding keyframe / transition class on the card; the prop is wired but the visual effect is absent. The grid-layout component is the right place for stagger orchestration (per pro-ui's "one orchestrated reveal per page" mandate). Drop `index`; the consumer staggers via the layout component.

**[ASSISTANT-DERIVED] No `actions` slot for nested interactives** (e.g., add-to-calendar, share, save). The whole card is a Link, so any nested interactive collides. Needs the overlay-link pattern from content-card-news-01: link `absolute inset-0 z-0`, actions slot `relative z-10`, accessible name via `aria-labelledby={titleId}` + `useId`.

**[ASSISTANT-DERIVED] No `linkComponent` polymorphism on the inner CTA `<Button>`** — should the button itself navigate (when not in a Link wrapper) or just fire `onAction(event, status)` and let the consumer decide? Currently the Button has no `onClick` at all and just sits inside the Link — every click navigates regardless of which spot was clicked. Plan needs to decide CTA semantics: passive (decorative; whole card is the link) or active (button has its own action — register-in-place dialog, calendar export, etc).

**[ASSISTANT-DERIVED] No `loading="lazy"` on `<img>`** — straightforward fix.

**[ASSISTANT-DERIVED] No `aria-labelledby` on the Link wrapper** — the link's accessible name is currently the entire flattened text content of the card. Same fix as content-card-news-01: compute `titleId = useId()`; set `aria-labelledby={titleId}` on the link; set `id={titleId}` on the `<h3>`.

**[ASSISTANT-DERIVED] `Progress` component is shadcn — needs install in pro-ui** (`pnpm dlx shadcn@latest add progress`). First user.

**[ASSISTANT-DERIVED] No reduced-motion handling** — `transition-transform duration-700 group-hover:scale-110` and the `animate-pulse` on the ongoing badge run regardless. Should gate via `motion-safe:` prefix per content-card-news-01 convention.

**[ASSISTANT-DERIVED] Status-icon mapping is locked to lucide** — fine for v0.1 but the `statusConfig` object literal makes the icon set un-overridable. Probably ok to leave for v0.1; revisit if a consumer wants different icons.

**[ASSISTANT-DERIVED] `event.image` always rendered, no fallback when missing** — line 130 will render a broken image. Either require `image` (and document) or render a tinted placeholder.

> Add anything else — re-render perf, prop ergonomics, accessibility gaps you've noticed.

-

## Constraints / non-goals

> **Filled-in starting point — please confirm or restrict further.**

**[ASSISTANT-DERIVED] No registration flow inside the card.** The card surfaces the CTA, but actually opening a register dialog / handling submission / managing optimistic capacity updates is out of scope. The card emits `onAction(event, status)` (or similar) and that's it.

**[ASSISTANT-DERIVED] No live-clock auto-refresh.** The status is computed once at render time from `new Date()`. Re-deriving every minute via `setInterval` is a consumer concern (host can `key` on a tick or pass a `now` prop). v0.1 stays pure-function.

**[ASSISTANT-DERIVED] Stay framework-agnostic — no `next/*`, no `next/image`, no `next/link`.** Polymorphic `linkComponent` slot.

**[ASSISTANT-DERIVED] No calendar / ICS export logic** — that's a consumer-side concern, optionally surfaced via the `actions` slot.

## Locked-in decisions (signed off 2026-05-02)

1. **Variants in v0.1: BOTH `grid` and `feed`.** Same data shape (`EventType`), variant prop dispatches to one of two layout parts. Mirrors content-card-news-01's multi-variant story.
   - `grid` — image-on-top, content-below; renders in a 1/2/3-column responsive grid
   - `feed` — full-bleed image background, content overlaid white-on-dark; renders single-column in feeds

2. **Tokens: add `--warning` only. Skip `--success`.** Rationale: `--primary` (signal-lime) already IS the success/positive-action color in pro-ui; adding `--success` creates two near-identical green tokens fighting for the same role. `--warning` (amber) is a genuine semantic gap — reusable beyond this card (form warnings, toast variants, banner alerts, deprecating-soon badges). Status mapping that falls out:

   | Status | Token |
   |---|---|
   | `open` | `bg-primary` (lime) |
   | `upcoming` / `lastSpots` | `bg-warning` (new amber) |
   | `ongoing` | `bg-accent` + `motion-safe:animate-pulse` |
   | `full` | `bg-destructive` |
   | `expired` | `bg-muted` (+ wrapper opacity-grayscale-30) |

   Wire `--warning` + `--warning-foreground` in [src/app/globals.css](../../../src/app/globals.css) (light + dark blocks + `@theme inline` mappings) as part of this migration. Token values: `oklch(0.78 0.16 75)` light / `oklch(0.82 0.15 75)` dark; foreground stays near-black both modes (amber is bright, foreground rule mirrors `--primary-foreground`).

3. **CTA semantics: same overlay-link pattern as content-card-news-01.** Whole card is the polymorphic link (`absolute inset-0 z-0`); accessible name via `aria-labelledby={titleId}` + `useId`. The status-driven CTA at the foot becomes a **decorative `<div role="button">` styled like a Button** — shows the status label ("Register" / "Sold Out" / "View Details" / etc.) but clicking it just fires the wrapping link. An `actions` slot at `relative z-10` lets consumers drop a REAL register / calendar-export / share button when needed; nested interactives `stopPropagation` so they don't bubble to the link.

4. **Exports: `EventCard01`, `getEventStatus`, `EVENT_STATUS_CONFIG`, `formatEventDate`, `getDaysUntilEvent` — all four helpers public.** Plus the `EventStatus` union type. They're the actual reusable kernel (kasder already proved this — `SocialEventCard.tsx` consumes them); pro-ui consumers should be able to compute status independently for header counters, calendar coloring, filter logic, etc. Helpers are pure functions of `EventType`, no hidden state, low maintenance cost.

5. **Featured: move to "top accent border + title star prefix."** Drop the bottom-right pill entirely. Featured cards get:
   - `border-t-4 border-primary` on the card chrome (visual lift, reads as promotional treatment, not "yet another badge")
   - A small `<Star className="w-4 h-4 fill-primary text-primary">` icon prefix on the `<h3>` title, with `aria-label="Featured event"`
   - Works identically for `grid` and `feed` variants
   - Frees the image bottom-right corner (now silent)

   Layout-level featured treatment (bigger card, separate slot above the grid — like grid-layout-news-01's `featuredItem` + `renderFeatured`) deferred to a future `events-grid-layout` component. Out of scope for this card.

-

## Screenshots / links

<!-- Paste images, design files, screen recordings if you have them. The assistant will work from the code if you don't. -->
