# people-grid-01 — procomp guide

> Stage 3: how to use it.

## When to use

- Conference / event speakers (the kasder use case)
- Team / About-us pages
- Board / committee / advisor lists
- Contributors / maintainers grids
- Podcast guest galleries
- Course instructor lists
- Judge / panel lineups

## When NOT to use

- **Single-card author byline** (avatar left, text right, horizontal) — use `author-card-01`
- **Inline mention chips** with avatar + name — too small/different shape; use a Tag/Badge
- **Bulk profile management** with edit affordances — different component class
- **Hierarchical org chart** with manager/report relationships — different data shape

## Composition patterns

### Speakers grid (the kasder use case)

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

### Team page with NextLink to profiles

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
  avatarSize="md"
  linkComponent={NextLink}
/>
```

### Initials fallback (no images)

```tsx
<PeopleGrid01
  heading="Board of Directors"
  items={[
    { id: "1", name: "Dr. Sara Ahmed",      title: "Chair" },
    { id: "2", name: "Prof. James O'Neill", title: "Vice-Chair" },
    { id: "3", name: "Madonna",             title: "Director" },
  ]}
  columns={3}
/>
```

Each card renders an initials circle (`bg-primary/10 text-primary font-semibold`). Honorifics are skipped: "Dr. Sara Ahmed" → "SA", "Madonna" → "M".

### Compact contributor strip

```tsx
<PeopleGrid01
  items={contributors}
  columns={5}
  avatarSize="sm"
  alignment="start"
/>
```

### Custom renderItem (social links beneath title)

```tsx
<PeopleGrid01
  items={speakers}
  renderItem={(person) => (
    <div className="text-center">
      <Avatar src={person.image} className="mx-auto mb-3" />
      <h4 className="font-semibold">{person.name}</h4>
      <p className="text-sm text-muted-foreground mb-2">{person.title}</p>
      <SocialLinks links={person.social} />
    </div>
  )}
/>
```

## Public helper kernel — `getInitials`

The initials helper is exported as a pure function. Use it in mention chips, comment headers, contact rows, presence badges:

```tsx
import { getInitials } from "@/registry/components/data/people-grid-01";

getInitials("Dr. Ahmet Yılmaz")    // → "AY"
getInitials("Prof. Dr. Elif Kaya") // → "EK"
getInitials("Madonna")              // → "M"
getInitials("")                     // → "?"
```

Skipped honorifics: `Dr.`, `Prof.`, `Mr.`, `Mrs.`, `Ms.`, `Sr.`, `Jr.` (case-insensitive, optional trailing dot).

Pure JS, no React imports — works in client + server components, tree-shakeable.

## Columns × avatar size

All grids start at `grid-cols-1` mobile and scale up at sm/md/lg breakpoints based on `columns`:

| `columns` | mobile | sm: | md: | lg: |
|---|---|---|---|---|
| `2` | 1 col | 2 col | — | — |
| `3` | 1 col | 2 col | 3 col | — |
| `4` | 1 col | 2 col | 4 col | — |
| `5` | 1 col | 2 col | 3 col | 5 col |

For wider columns (`4` / `5`) in narrow containers, pair with `avatarSize: "sm"` or `"md"` — large avatars (`w-24 h-24` = 96px each) at 4-5 columns need ~600px+ container width to avoid crowding. Defaults (`columns: 3`, `avatarSize: "lg"`) match kasder and work everywhere down to mobile.

## Item shape — soft-failure

| Field | Required | Behavior when absent |
|---|---|---|
| `id` / `name` | ✅ | — |
| `title` | optional | Title `<p>` omitted; only avatar + name render |
| `image` | optional | Initials fallback rendered |
| `imageAlt` | optional | Falls back to `name` |
| `href` | optional | Card stays non-interactive |

## Accessibility

- `<ul role="list">` with one `<li>` per person.
- `<section aria-labelledby={headingId}>` when `heading` is supplied (id from `useId`).
- Per-card `<h4 id={nameId}>` for the name.
- Linked cards: `aria-labelledby={nameId}` on the polymorphic link → screen reader announces just the person's name (clean), not flattened title/image-alt.
- Initials fallback `aria-hidden="true"` (decorative; the name is in `<h4>` which screen readers announce).
- Image alt: `imageAlt ?? name` — sensible default for portrait avatars.
- Heading levels: `h2` default (people grids are top-level page sections); per-card name is `h4` (one level below the section).
- Hover-color transition on the name is gated via `motion-safe:`.

## Performance

- `React.memo` at export — pass stable `items` references.
- `useMemo` over the labels merge.
- `useId` per card for `nameId`.
- No effects, no async — pure presentation.
- Image uses `loading="lazy"` by default.

## Migration origin

Ported from kasder `kas-social-front-v0` `src/app/(platform)/events/[id]/page.tsx` lines 215–231 (the "Konuşmacılar" / Speakers block). Notable rewrites:

| Source | Pro-comp |
|---|---|
| Inline `<div className="grid sm:grid-cols-3 gap-6">` | Configurable `columns: 2 \| 3 \| 4 \| 5` with built-in responsive scaling |
| Hardcoded `w-24 h-24` avatar | Configurable `avatarSize: "sm" \| "md" \| "lg"` |
| Hardcoded `text-center` | Configurable `alignment: "center" \| "start"` |
| No avatar fallback (broken-image icon when `image` missing) | Initials fallback via public `getInitials` helper |
| No link semantics | Polymorphic `linkComponent` + per-item `href` (overlay-link with `aria-labelledby`) |
| Hardcoded Turkish heading "Konuşmacılar" | `heading` + `headingAs` props (English defaults) |
| `<div>` non-list semantics | Semantic `<ul role="list">` + `<li>` per person |
| Inline JSX duplicated per page | Sealed component with `parts/person-card.tsx` |
