# people-grid-01 — procomp description

> Stage 1: what & why.
>
> **Migration origin:** kasder `kas-social-front-v0` `src/app/(platform)/events/[id]/page.tsx` lines 215–231 (the "Konuşmacılar" / Speakers block on the event detail page).

## Problem

Section heading + N-column grid of person cards (round avatar + name + title) shows up everywhere: conference speakers, team pages, board / committees, contributors, judges, podcast guests, mentors, instructors. Every project re-implements the same anatomy: avatar with circular border, centered name, muted role text, responsive column count. Plus the avatar-fallback problem when images are missing (initials? generic icon? broken-image SVG?).

Pro-ui has `author-card-01` for **single-card** author bylines (avatar left, text right, horizontal). It doesn't fit grid contexts where:
- The card is **centered** (avatar above, text below)
- Multiple cards render in a **responsive grid** (1/2/3/4/5 columns)
- The pattern needs an **owning section heading** ("Speakers", "Our Team", "Contributors")
- Some persons have no `image` and need a graceful **initials fallback**

`people-grid-01` is the compound: heading + grid + per-person cards + initials fallback, in one component.

## In scope

- **Compound:** optional section heading + responsive N-column grid + per-person cards
- **Per-person shape:** `id` + `name` required; `title`, `image`, `imageAlt`, `href` optional
- **Avatar fallback** — when `image` is missing, render a `bg-primary/10 text-primary` circle with **initials** computed from `name` (handles "Dr. Ahmet Yılmaz" → "AY"; "Madonna" → "M")
- **Public helper** — `getInitials(name): string` exported as a pure function so consumers can reuse the same initials logic in other contexts (mention chips, comment headers, contact rows)
- **Configurable columns** — `columns: 2 | 3 | 4 | 5` (default 3) with a built-in responsive map: 1 col on mobile, scaling up at sm/md/lg breakpoints
- **Configurable avatar size** — `avatarSize: "sm" | "md" | "lg"` (default `lg` matching kasder)
- **Configurable alignment** — `alignment: "center" | "start"` (default `center` matching kasder)
- **Polymorphic per-person link** via `linkComponent: ElementType` + per-item `href` — entire card becomes clickable
- **Custom render** — `renderItem(item)` slot for full per-person takeover (e.g., social links beneath title)
- **Optional section heading** with configurable level (`headingAs: "h2" | "h3" | "h4"`, default `h2` since people grids are typically top-level page sections)
- **Empty state** — `emptyState?: ReactNode` slot OR fallback `labels.emptyText`
- **a11y** — `<ul role="list">` with `<li>` per person; section `aria-labelledby={headingId}`; decorative borders/rings on avatar are background CSS (no extra DOM); links wrap the whole card with `aria-labelledby={nameId}` so the link's accessible name = the person's name (not the flattened title text)

## Out of scope

- **Hover-reveal bio panels** — different interaction class; consumer composes via `renderItem`
- **Drag-reorder / inline edit** — different component class
- **Speaker session linking** (linking each speaker to their schedule items) — host concern; consumer composes via `href` + their own routing
- **Image upload / cropping** — pre-supplied URLs only
- **Category / department grouping** (multiple grids per page) — consumer wraps multiple `<PeopleGrid01>` instances
- **Card flip / hover-reveal animations** — keep v0.1 still; consumer adds CSS via `itemClassName` if needed

## Target consumers

- Conference speaker pages (the kasder use case)
- Team / About-us pages
- Board / committee / advisor lists
- Contributors / maintainers grids
- Podcast guest galleries
- Course instructor lists
- Judge / panel lineups

## Rough API sketch

```ts
<PeopleGrid01
  heading="Konuşmacılar"
  items={event.speakers.map((s, i) => ({ id: String(i), name: s.name, title: s.title, image: s.image }))}
  columns={3}
/>;
```

5 props are most-used: `items`, `heading`, `columns`, `avatarSize`, `linkComponent`. `renderItem` is the escape hatch.

## Public helper kernel

```ts
import { PeopleGrid01, getInitials } from "@ilinxa/people-grid-01";

// Use without the grid:
const initials = getInitials("Dr. Elif Kaya");  // → "EK"
const userTagInitial = getInitials("Madonna");   // → "M"
```

Pure function, no React imports — tree-shakeable, server-safe, reusable in mention chips / comment headers / contact rows / etc.

## Example usages

**1. Conference speakers (the kasder use case):**

```tsx
<PeopleGrid01
  heading="Konuşmacılar"
  items={event.speakers.map((s, i) => ({
    id: String(i),
    name: s.name,
    title: s.title,
    image: s.image,
  }))}
  columns={3}
/>
```

**2. Team page with NextLink to profiles:**

```tsx
import NextLink from "next/link";

<PeopleGrid01
  heading="Our Team"
  items={team.map((m) => ({
    id: m.slug,
    name: m.name,
    title: m.role,
    image: m.avatarUrl,
    href: `/team/${m.slug}`,
  }))}
  columns={4}
  linkComponent={NextLink}
/>
```

**3. Initials fallback (no images):**

```tsx
<PeopleGrid01
  heading="Board of Directors"
  items={board.map((b) => ({
    id: b.id,
    name: b.name,
    title: b.position,
    // no image — falls back to initials avatar
  }))}
  columns={3}
/>
```

**4. Compact contributor strip (smaller avatar, more columns):**

```tsx
<PeopleGrid01
  items={contributors}
  columns={5}
  avatarSize="sm"
  alignment="start"
/>
```

**5. Custom renderItem with social links:**

```tsx
<PeopleGrid01
  items={speakers}
  renderItem={(person) => (
    <div className="text-center">
      <img src={person.image} className="w-24 h-24 rounded-full mx-auto" />
      <h4 className="font-semibold">{person.name}</h4>
      <p className="text-sm text-muted-foreground">{person.title}</p>
      <SocialLinks links={person.social} />
    </div>
  )}
/>
```

## Success criteria

- Renders the kasder Konuşmacılar block verbatim from `items` prop with default `columns: 3`, `avatarSize: "lg"`, `alignment: "center"`.
- Initials fallback renders a `bg-primary/10` circle with auto-computed initials when `image` is absent.
- `columns: 2 | 3 | 4 | 5` produce sensible responsive layouts (mobile 1-col → desktop N-col).
- `href` + `linkComponent` make the entire card clickable with the person's name as the link's accessible name.
- TypeScript: `PeopleGridItem` shape strict; `columns` literal union; `linkComponent` defaults to `"a"`.
- `pnpm tsc --noEmit` + `pnpm lint` + `pnpm build` clean; SSR returns 200.

## Open questions

1. **`headingAs` default — `h2` or `h3`?** **Resolved: `h2`.** People grids (Speakers / Team / Contributors) are typically top-level page sections, not nested cards. Differs from `info-list-01` (h3) and `progress-timeline-01` (h3) which are sidebar / sub-card patterns.
2. **Avatar fallback — initials or generic icon?** **Resolved: initials.** More personal, doesn't read as "missing data," and the helper (`getInitials`) is reusable elsewhere (mention chips, etc).
3. **Initials handling for titles like "Dr." / "Prof."?** **Resolved: skip them.** `getInitials("Dr. Ahmet Yılmaz")` → "AY". Documented + tested.
4. **`columns: number` (free) vs `2 \| 3 \| 4 \| 5` (literal union)?** **Resolved: literal union.** Tailwind v4 needs static class names for tree-shaking; literal union maps to a fixed lookup table of pre-defined responsive classes.
5. **Heading + grid as one compound vs two components?** **Resolved: one compound.** The screenshot you sent showed the WHOLE block (heading + grid) as the unit — that's the natural shape. Heading is optional (consumers can omit it and wrap externally if they want).
