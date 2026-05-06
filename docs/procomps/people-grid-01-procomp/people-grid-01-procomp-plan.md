# people-grid-01 — procomp plan

> Stage 2: how. The implementation contract.
>
> See [`people-grid-01-procomp-description.md`](./people-grid-01-procomp-description.md) for the what & why.

## Final API

### Public types

```ts
// src/registry/components/data/people-grid-01/types.ts

import type { ElementType, ReactNode } from "react";

export type PeopleGrid01Columns = 2 | 3 | 4 | 5;
export type PeopleGrid01AvatarSize = "sm" | "md" | "lg";
export type PeopleGrid01Alignment = "center" | "start";

export interface PeopleGridItem {
  /** Stable identifier. Used for React keys + accessible-name composition. */
  id: string;
  /** Person's display name. Required — drives the initials fallback. */
  name: string;
  /** Role / title (muted, smaller, below name). Optional. */
  title?: string;
  /** Avatar image URL. Optional — falls back to initials circle. */
  image?: string;
  /** Image alt text. Optional — falls back to `name`. */
  imageAlt?: string;
  /** Optional URL — when supplied + `linkComponent` provided, the entire card becomes clickable. */
  href?: string;
}

export interface PeopleGrid01Labels {
  /** Default: "No people to display." Used when `items` is empty AND `emptyState` not provided. */
  emptyText?: string;
}

export interface PeopleGrid01Props {
  /** Items to render in display order. */
  items: PeopleGridItem[];

  /** Optional section heading text. */
  heading?: string;
  /** Heading semantic level. Default: 'h2'. */
  headingAs?: "h2" | "h3" | "h4";

  /** Number of columns at sm:+ breakpoints. Default: 3. */
  columns?: PeopleGrid01Columns;
  /** Avatar size. Default: 'lg' (w-24 h-24). 'md' = w-16, 'sm' = w-12. */
  avatarSize?: PeopleGrid01AvatarSize;
  /** Card alignment within each grid cell. Default: 'center'. */
  alignment?: PeopleGrid01Alignment;

  /** Element used when `item.href` is supplied. Default: 'a'. */
  linkComponent?: ElementType;

  /** Custom per-item renderer — bypasses the default card layout entirely. */
  renderItem?: (item: PeopleGridItem) => ReactNode;

  /** Localized labels. */
  labels?: PeopleGrid01Labels;

  /** Empty-state slot. Wins over `labels.emptyText`. */
  emptyState?: ReactNode;

  /** Override classes for the root <section>. */
  className?: string;
  /** Override classes for the heading. */
  headingClassName?: string;
  /** Override classes for the grid container. */
  gridClassName?: string;
  /** Override classes per item (the <li>). */
  itemClassName?: string;
}

/** Default English labels. */
export const DEFAULT_PEOPLE_GRID_LABELS: Required<PeopleGrid01Labels> = {
  emptyText: "No people to display.",
};
```

### Public helper kernel

```ts
// src/registry/components/data/people-grid-01/lib/get-initials.ts

/**
 * Pure function. Returns 1–2 uppercase initials from a name.
 *
 * Handles common titles (Dr., Prof., Mr., Mrs., Ms., Sr., Jr.) by skipping them.
 * - "Dr. Ahmet Yılmaz"   → "AY"
 * - "Prof. Dr. Elif Kaya" → "EK"
 * - "Madonna"             → "M"
 * - ""                    → "?"
 */
export function getInitials(name: string): string;
```

### Exported names

```ts
// index.ts
export { default as PeopleGrid01 } from "./people-grid-01";
export type {
  PeopleGridItem,
  PeopleGrid01Labels,
  PeopleGrid01Props,
  PeopleGrid01Columns,
  PeopleGrid01AvatarSize,
  PeopleGrid01Alignment,
} from "./types";
export { DEFAULT_PEOPLE_GRID_LABELS } from "./types";
export { getInitials } from "./lib/get-initials";
export { meta } from "./meta";
```

## File-by-file plan

9 files. Sealed-folder.

```
src/registry/components/data/people-grid-01/
├── people-grid-01.tsx           # 1 — root
├── parts/
│   └── person-card.tsx          # 2 — single-card presentational (avatar + initials fallback inline)
├── lib/
│   └── get-initials.ts          # 3 — public pure helper
├── types.ts                     # 4
├── dummy-data.ts                # 5
├── demo.tsx                     # 6
├── usage.tsx                    # 7
├── meta.ts                      # 8
└── index.ts                     # 9
```

### 1. `people-grid-01.tsx` — root

- `"use client"` directive.
- `React.memo` at export.
- Resolves defaults: `columns ?? 3`, `avatarSize ?? "lg"`, `alignment ?? "center"`, `linkComponent ?? "a"`, `headingAs ?? "h2"`.
- `headingId` via `useId`.
- Lookup map for responsive grid classes (Tailwind v4 needs static class names; ALL rows start at `grid-cols-1` mobile so large-avatar configs never overflow):
  ```ts
  const COLUMNS_MAP: Record<PeopleGrid01Columns, string> = {
    2: "grid-cols-1 sm:grid-cols-2",
    3: "grid-cols-1 sm:grid-cols-2 md:grid-cols-3",
    4: "grid-cols-1 sm:grid-cols-2 md:grid-cols-4",
    5: "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5",
  };
  ```
- Empty state: when `items.length === 0`, render `emptyState` or `<p role="status">{labels.emptyText}</p>`.
- Render:
  ```tsx
  <section
    aria-labelledby={heading ? headingId : undefined}
    className={cn("space-y-6", className)}
  >
    {heading && (
      <HeadingTag
        id={headingId}
        className={cn(
          "text-2xl font-bold text-foreground",
          headingClassName,
        )}
      >
        {heading}
      </HeadingTag>
    )}
    <ul
      role="list"
      className={cn("grid gap-6", COLUMNS_MAP[columnsResolved], gridClassName)}
    >
      {items.map((item) =>
        renderItem ? (
          <li key={item.id}>{renderItem(item)}</li>
        ) : (
          <PersonCard
            key={item.id}
            item={item}
            avatarSize={avatarSize}
            alignment={alignment}
            linkComponent={linkComponent}
            itemClassName={itemClassName}
          />
        ),
      )}
    </ul>
  </section>
  ```

### 2. `parts/person-card.tsx` — single card

- `"use client"` directive (consistency with other pro-comp parts files; uses `useId` for `nameId`).
- Stateless presentational beyond `useId`.
- Avatar size lookup:
  ```ts
  const AVATAR_SIZE_MAP = {
    sm: { wrapper: "w-12 h-12", initials: "text-sm" },
    md: { wrapper: "w-16 h-16", initials: "text-base" },
    lg: { wrapper: "w-24 h-24", initials: "text-2xl" },
  };
  ```
- Layout:
  ```tsx
  <li
    className={cn(
      "relative group",
      alignment === "center" ? "text-center" : "text-start",
      itemClassName,
    )}
  >
    <div
      className={cn(
        "rounded-full overflow-hidden border-4 border-primary/20 mb-3",
        AVATAR_SIZE_MAP[avatarSize].wrapper,
        alignment === "center" ? "mx-auto" : "",
      )}
    >
      {item.image ? (
        <img
          src={item.image}
          alt={item.imageAlt ?? item.name}
          loading="lazy"
          className="w-full h-full object-cover"
        />
      ) : (
        <div
          aria-hidden="true"
          className={cn(
            "w-full h-full flex items-center justify-center bg-primary/10 text-primary font-semibold",
            AVATAR_SIZE_MAP[avatarSize].initials,
          )}
        >
          {getInitials(item.name)}
        </div>
      )}
    </div>

    <h4 id={nameId} className="font-semibold text-foreground motion-safe:group-hover:text-primary transition-colors">
      {item.name}
    </h4>
    {item.title && (
      <p className="text-sm text-muted-foreground">{item.title}</p>
    )}

    {item.href && (
      <LinkComponent
        href={item.href}
        aria-labelledby={nameId}
        className={cn(
          "absolute inset-0 z-0 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          "rounded-lg",
        )}
      />
    )}
  </li>
  ```
- The link is the overlay-link pattern (covers the whole card area), with `aria-labelledby={nameId}` so the link's accessible name is the person's name (not flattened title).
- `nameId` via `useId` per card.

### 3. `lib/get-initials.ts` — public helper

```ts
const TITLE_PATTERN = /^(Dr|Prof|Mr|Mrs|Ms|Sr|Jr)\.?$/i;

export function getInitials(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return "?";

  const parts = trimmed.split(/\s+/).filter((p) => !TITLE_PATTERN.test(p));
  if (parts.length === 0) return trimmed.charAt(0).toUpperCase() || "?";
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (
    parts[0].charAt(0) + parts[parts.length - 1].charAt(0)
  ).toUpperCase();
}
```

Pure JS. No React imports. Tree-shakeable. Public.

### 4. `types.ts`

All public types as shown above.

### 5. `dummy-data.ts`

3 kasder speakers + a 6-person team set for the columns demo:

```ts
export const dummySpeakers: PeopleGridItem[] = [
  { id: "s1", name: "Prof. Dr. Ahmet Yılmaz", title: "Şehir Plancısı", image: "https://images.unsplash.com/photo-..." },
  { id: "s2", name: "Dr. Elif Kaya",          title: "Çevre Mühendisi",   image: "..." },
  { id: "s3", name: "Mehmet Demir",            title: "Akıllı Şehir Uzmanı", image: "..." },
];

export const dummyTeam: PeopleGridItem[] = [
  { id: "t1", name: "Ada Lovelace", title: "CTO", image: "..." },
  { id: "t2", name: "Grace Hopper", title: "Compiler Lead" /* no image — initials fallback */ },
  // ...6 people total mixing image + no-image so initials demo lands naturally
];
```

### 6. `demo.tsx`

5-tab demo, shadcn `Tabs`:

1. **Default (TR)** — kasder Konuşmacılar verbatim (3 speakers, columns=3, lg avatar, centered, "Konuşmacılar" h2)
2. **Initials fallback** — same 3 people but no `image` URLs — shows initials avatars
3. **Columns variants** — 4 grids stacked: columns=2, 3, 4, 5 over the 6-person team set
4. **Linked + NextLink** — speakers with `href` + a mock NextLink — entire card clickable, focus-visible ring on the wrapper
5. **Custom renderItem** — speakers with appended pseudo-social-icon row (Twitter / LinkedIn / GitHub stubs as inline `<a>` placeholders)

### 7. `usage.tsx`

Code blocks: minimal usage, columns + avatarSize + alignment, initials fallback, polymorphic linkComponent, public `getInitials` helper, custom renderItem, empty state, accessibility notes.

### 8. `meta.ts`

```ts
export const meta: ComponentMeta = {
  slug: "people-grid-01",
  name: "People Grid 01",
  category: "data",
  description: "Section heading + responsive N-column grid of person cards (round avatar + name + title). Initials fallback when image is missing. Polymorphic per-card link, configurable columns / avatar size / alignment, custom renderItem slot. Public `getInitials` helper kernel.",
  context: "Use for conference speakers, team / about-us pages, board / committee lists, contributor grids, podcast guests, course instructors, judge lineups. Migration origin: kasder kas-social-front-v0 events/[id]/page.tsx Konuşmacılar (Speakers) block. The `getInitials` helper is reusable for mention chips, comment headers, contact rows.",
  features: [
    "Responsive grid — columns 2/3/4/5 with built-in breakpoint scaling",
    "Avatar size variants (sm/md/lg)",
    "Alignment (center/start)",
    "Initials fallback when image is missing — handles Dr./Prof./etc. titles",
    "Public getInitials helper kernel",
    "Polymorphic per-card link via linkComponent + per-item href (overlay-link pattern)",
    "Custom renderItem slot",
    "Optional section heading with configurable level (h2/h3/h4)",
    "Soft-failure on optional fields (title / image / imageAlt / href)",
    "Empty state slot + labels.emptyText fallback",
    "<ul role='list'> semantics + section aria-labelledby",
    "aria-labelledby on per-card link → accessible name = person's name",
  ],
  tags: ["people-grid-01", "team", "speakers", "grid", "avatar"],
  version: "0.1.0",
  status: "alpha",
  createdAt: "2026-05-02",
  updatedAt: "2026-05-02",
  author: { name: "ilinxa" },
  dependencies: { shadcn: ["tabs"], npm: {}, internal: [] },
  related: ["author-card-01", "info-list-01", "thumb-list-01"],
};
```

### 9. `index.ts`

Public exports as shown above.

## Dependencies

### Internal (pro-ui)

- `@/lib/utils` — `cn()`

### NPM

- `react`
- No lucide-react needed (initials avatar is just text in a circle; consumers compose icons in `renderItem` if they want)

### Forbidden

- `next/*`, `next/image`, framer-motion

## Composition pattern

Headless wrapping over a presentational card. Same shape as schedule-list-01 / info-list-01.

## Edge cases

| Case | Behavior |
|---|---|
| `items` empty | Render `emptyState` if provided, else `<p role="status">{labels.emptyText}</p>` |
| Item missing `image` | `getInitials(name)` rendered in a `bg-primary/10` circle |
| Item missing `title` | Title `<p>` omitted; only avatar + name render |
| Item missing `imageAlt` | Falls back to `name` |
| Item missing `href` | Card stays non-interactive (no link overlay) |
| `name` is empty / whitespace | `getInitials` returns "?"; first-letter fallback otherwise |
| `name` is single word | `getInitials` returns first letter (e.g., "Madonna" → "M") |
| `name` starts with title (Dr. / Prof. / Mr. / Mrs. / Ms. / Sr. / Jr.) | Title skipped; initials computed from real-name parts |
| Long `title` text | Wraps naturally (no `line-clamp` — kasder doesn't clamp; consumers can `itemClassName` override) |
| Custom `renderItem` provided | Default card layout bypassed entirely |
| `columns` not in literal union | TS prevents at compile; runtime guard not needed |
| RTL | `text-start` flips correctly in RTL; `text-center` is symmetric |
| Reduced motion | Hover-color transition on name gated via `motion-safe:` |
| `framed` (no such prop) | Section root has no card chrome by default — people-grids are typically standalone page sections, not nested cards. Consumers wrap in their own `<aside>` / `<section>` if they want chrome. |

## Accessibility

- `<ul role="list">` semantics.
- `<section aria-labelledby={headingId}>` when `heading` is supplied (id from `useId`).
- Per-card `<h4 id={nameId}>` for the name.
- Linked cards: `<linkComponent aria-labelledby={nameId}>` covering the entire card via overlay-link pattern → screen-reader announces just the person's name (clean), not "name + title + image alt".
- Initials fallback `<div aria-hidden="true">` — decorative; the name is in `<h4>` which screen-reader announces.
- Image alt: `imageAlt ?? name` (descriptive when provided; name as a sensible default since alt-as-name is acceptable for portrait avatars).
- Heading levels: `h2` default (people grids are top-level page sections); per-card name uses `h4` (one level below the section heading).
- Decorative avatar borders are CSS-only (no extra DOM).

## Verification checklist

- [ ] `pnpm tsc --noEmit` clean
- [ ] `pnpm lint` clean (1 pre-existing rich-card warning OK)
- [ ] `pnpm build` clean — `/components/people-grid-01` prerendered
- [ ] SSR returns 200 with all 5 demo tab triggers
- [ ] `/components` index lists the new entry
- [ ] Initials fallback renders a colored circle with correct letters at all 3 avatar sizes
- [ ] Columns 2/3/4/5 produce expected layouts (1-col mobile → N-col desktop)
- [ ] Helper-only import works: `import { getInitials } from "@/registry/components/data/people-grid-01"` typechecks without React imports

## Risks & alternatives

### Risk 1: Image alt = name when imageAlt absent

For decorative portraits, "Person Name" alt is acceptable per WCAG. For some images (e.g., of the person doing something specific), a richer alt would be better. **Mitigation:** consumers can provide `imageAlt` per item. Documented.

### Risk 2: Initials fallback color collision with brand

`bg-primary/10 text-primary` uses the design-system primary (signal-lime in pro-ui). Some consumer brand variations might want a different fallback color. **Mitigation:** v0.2 candidate — `fallbackClassName` prop. v0.1 ships with the consistent default.

### Risk 3: `columns × avatarSize` interaction at narrow viewports

`columns: 5` paired with `avatarSize: "lg"` (96px avatars × 5 = 480px minimum + gap) needs ~600px container width before all 5 columns fit comfortably. The lookup table starts at `grid-cols-1` mobile and scales up at sm/md/lg, so narrow viewports degrade gracefully. **Documented in usage:** wider columns (`4` / `5`) work best with smaller `avatarSize` (`sm` / `md`) on narrow containers. Defaults (`columns: 3`, `avatarSize: "lg"`) match kasder and work everywhere down to mobile.

### Alternatives considered

1. **Variant of `author-card-01` instead of new component** — rejected; author-card-01 is left-aligned single-card with avatar+name+title in a horizontal row. People-grid is centered grid with vertical stack. Different shape.
2. **`columns: number` with dynamic class generation** — rejected; Tailwind v4 needs static class names for tree-shaking. Literal union maps to fixed lookup table.
3. **Initials helper inline (not exported)** — rejected (dynamicity priority); export as public kernel since it's reusable in many contexts.
4. **Generic icon fallback (User from lucide-react)** — rejected; initials are more personal + the helper is more reusable.
5. **Built-in `framed` prop** — rejected; people-grids are typically standalone page sections, not nested cards. Consumer wraps externally if they want chrome.

## Open follow-ups (post v0.1)

- v0.2: `fallbackClassName` for custom initials avatar tint
- v0.2: hover-reveal bio panel
- v0.2: optional social-link slot per person (without forcing renderItem)
- v0.2: pagination / load-more for large grids
