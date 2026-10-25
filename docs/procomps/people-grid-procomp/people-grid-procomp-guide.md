# people-grid — procomp guide

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

- **Single-card author byline** (avatar left, text right, horizontal) — use `author-card`
- **Inline mention chips** with avatar + name — too small/different shape; use a Tag/Badge
- **Bulk profile management** with edit affordances — different component class
- **Hierarchical org chart** with manager/report relationships — different data shape

## Composition patterns

### Speakers grid (the kasder use case)

```tsx
<PeopleGrid
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

<PeopleGrid
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
<PeopleGrid
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
<PeopleGrid
  items={contributors}
  columns={5}
  avatarSize="sm"
  alignment="start"
/>
```

### Custom renderItem (social links beneath title)

```tsx
<PeopleGrid
  items={speakers}
  renderItem={(person) => (
    <div className="text-center">
      <Avatar src={person.image} className="mx-auto mb-3" />
      <p className="font-semibold">{person.name}</p>
      <p className="text-sm text-muted-foreground mb-2">{person.title}</p>
      <SocialLinks links={person.social} />
    </div>
  )}
/>
```

## Public helper kernel — `getInitials`

The initials helper is exported as a pure function. Use it in mention chips, comment headers, contact rows, presence badges:

```tsx
import { getInitials } from "@/components/people-grid";

getInitials("Dr. Ahmet Yılmaz")    // → "AY"
getInitials("Prof. Dr. Elif Kaya") // → "EK"
getInitials("Madonna")              // → "M"
getInitials("")                     // → "?"

getInitials("ilker yılmaz", "tr")   // → "İY"  (string = locale shorthand)
getInitials("Sayın Ali Veli", { honorifics: ["sayın"] }) // → "AV"
getInitials("", { fallback: "·" })  // → "·"
```

Signature: `getInitials(name, options?)` where `options` is a locale string or `{ locale?, honorifics?, fallback? }`.

- `locale` — BCP 47 tag for upper-casing (`toLocaleUpperCase`); an invalid tag falls back to plain upper-casing.
- `honorifics` — a `readonly string[]` (case-insensitive under `locale` — pass `locale: "tr"` so `SAYIN` matches `Sayın`; trailing dot ignored) or a `RegExp` tested per word. It **replaces** the default list. Honorifics are skipped wherever they appear in the name, not only in front (`"Ada Ms"` → `"A"`).
- `fallback` — returned for an empty name (default `"?"`).
- Initials are the first *grapheme* of the first and last word (`Intl.Segmenter` when available, `Array.from` otherwise), so astral characters and emoji sequences are not split.

Default skipped honorifics: `Dr.`, `Prof.`, `Mr.`, `Mrs.`, `Ms.`, `Sr.`, `Jr.` (case-insensitive, optional trailing dot). The grid's `locale` prop feeds the default card's initials.

Pure JS, no React imports — works in client + server components, tree-shakeable.

## Heading levels

The section heading is `headingAs` (default `h2`). Each card's name is one level below it by default: `h2` → `h3`, `h3` → `h4`, `h4` → `h5`. Set `cardHeadingAs` (`h3`–`h6`) to override. **0.3.0 change:** 0.2.0 always rendered `h4`; `cardHeadingAs="h4"` restores that output.

## Action and badge slots

`renderActions(item)` (below the title) and `renderBadge(item)` (beside the name) render inside `relative z-10` wrappers on the default card, so the card link's overlay never swallows their clicks and a slot click never follows the link. DOM and tab order per card: badge, actions, then the card link. A slot returning `null`/`false` renders no wrapper. `renderItem` replaces the whole card, so the slots are not used with it.

```tsx
<PeopleGrid
  heading="Ekip"
  locale="tr"
  items={people}
  renderBadge={(p) => (p.verified ? <VerifiedMark /> : null)}
  renderActions={(p) => <Button onClick={() => follow(p.id)}>Takip et</Button>}
/>
```

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
| `imageAlt` | optional | `alt=""` (decorative: the name is the heading beside the avatar) |
| `imageWidth` / `imageHeight` | optional | Passed to `<img width/height>` (reserve space, avoid layout shift) |
| `imageSrcSet` / `imageSizes` | optional | Passed to `<img srcset/sizes>` |
| `href` | optional | Card stays non-interactive |

## Accessibility

- `<ul role="list">` with one `<li>` per person.
- `<section aria-labelledby={headingId}>` when `heading` is supplied (id from `useId`).
- Per-card heading (`id={nameId}`) for the name, one level below the section heading by default (`cardHeadingAs` overrides).
- Linked cards: `aria-labelledby={nameId}` on the polymorphic link → screen reader announces just the person's name (clean), not flattened title/image-alt.
- Initials fallback `aria-hidden="true"` (decorative; the name is in the card heading which screen readers announce).
- Image alt: `imageAlt ?? ""` — the avatar is decorative by default because the name is the heading right beside it (announcing both double-reads the name). Pass `imageAlt` when the image carries information. 0.2.0 used the name.
- Heading levels: `h2` default (people grids are top-level page sections); per-card name is one level below (`h3`).
- Hover-color transition on the name is gated via `motion-safe:`.

## Performance

- `React.memo` on the grid and on each card — pass stable `items` references (inline `renderActions` / `renderBadge` functions re-render cards).
- `useMemo` over the labels merge (an `undefined` key keeps its default).
- `useId` per card for `nameId`.
- No effects, no async — pure presentation.
- Image uses `loading="lazy"` and `decoding="async"` by default.

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
