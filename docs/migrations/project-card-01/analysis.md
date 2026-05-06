# Project Card 01 — migration analysis

> Extraction pass for [`docs/migrations/project-card-01/`](./). Filled by the assistant after reading `original/` and `source-notes.md`. Reviewed and signed off by you before the procomp gate begins.
>
> Pipeline: [`docs/migrations/README.md`](../README.md). Locked-in decisions: see [`source-notes.md`](./source-notes.md#locked-in-decisions-signed-off-2026-05-03).

## Source artifacts read

- [`original/ProjectCard.tsx`](./original/ProjectCard.tsx) — 92 lines, public projects-page card (vertical, hover-CTA)
- [`original/BusinessProjectsSection.tsx`](./original/BusinessProjectsSection.tsx) — 328 lines; only the per-item card visual (lines 130–166) is in scope for this migration. Bento layout (lines 41–64, 104–114, 128) and detail dialog (lines 170–306) are explicitly DEFERRED to future migrations
- [`original/ProjectsGrid.tsx`](./original/ProjectsGrid.tsx) — 123 lines, public-page orchestrator. Reference only — entirely subsumed by [`grid-layout-news-01`](../../../src/registry/components/layout/grid-layout-news-01/) + [`filter-bar-01`](../../../src/registry/components/forms/filter-bar-01/)
- [`original/ProjectsHero.tsx`](./original/ProjectsHero.tsx) — 17 lines. Reference only — entirely subsumed by [`page-hero-news-01`](../../../src/registry/components/marketing/page-hero-news-01/)
- [`original/PageHero.tsx`](./original/PageHero.tsx) — 97 lines. Reference for what `page-hero-news-01` already covers (badge / title / titleHighlight / description). Confirmed 1:1 surface match — see "Reuse confirmation" below
- [`original/projectsType.ts`](./original/projectsType.ts) — `Project` (8 fields), `ProjectCardProps`
- [`original/projectsData.ts`](./original/projectsData.ts) — 12-item `allProjects` fixture + 7-pill `categories` list
- [`original/useInfiniteScroll.ts`](./original/useInfiniteScroll.ts) — clean `IntersectionObserver` hook. Reference only — `grid-layout-news-01` ships its own internal infinite-scroll AND a `useMagazineFilter` hook covering pagination + filtering

## Reuse confirmation — already-shipped pro-comps cover the page assembly

Verified by reading the shipped types files. **No new code needed for the page-level assembly** — consumers compose existing pro-comps.

### `page-hero-news-01` — 100% subsumes `ProjectsHero` + `PageHero`

| Kasder source surface | Maps to `PageHeroNewsProps` |
|---|---|
| `badge="Projelerimiz"` | `badge?: string` |
| `badgeIcon={Building2}` | `badgeIcon?: ComponentType<{ className?: string }>` |
| `title="Hayata Geçirdiğimiz"` | `title: string` |
| `titleHighlight="Dönüşüm Projeleri"` | `titleHighlight?: string` |
| `description="Türkiye genelinde…"` | `description?: string` |
| `<motion.div>` reveal animation | Built-in `disableReveal?: boolean` (default false; one orchestrated reveal) |

Plus extras the source doesn't have: `density: "compact" | "default" | "full"`, `headingAs: "h1" | "h2" | "h3"`, `children` slot for stats/CTAs, `titleSlot` ReactNode override. **Drop-in.**

### `filter-bar-01` — covers the category-pill row

| Kasder source surface | Maps to `FilterBarProps` |
|---|---|
| `categories.map((category) => …pill button…)` | `categories?: FilterBarCategoryItem[] \| string[]` (string[] shorthand) |
| `useState("Tümü")` | `category?: string \| null` (controlled) OR `defaultCategory?` (uncontrolled) |
| `setSelectedCategory(category)` onClick | `onCategoryChange?: (c: string \| null) => void` |
| (no search in source) | `hideSearch` — toggles search off to match the kasder simplicity |
| (no date range in source) | `hideDateRange` — toggles date-range off |

Bonus: filter-bar-01's `"All"` chip is built-in (kasder's source manually treats `"Tümü"` as the all-state). Use `labels.allLabel: "Tümü"` for the Turkish demo. **Drop-in.**

### `grid-layout-news-01` — covers grid + infinite-scroll + the kasder hook

| Kasder source surface | Maps to `GridLayoutNewsProps<Project>` |
|---|---|
| `displayedProjects` slice + `setDisplayedProjects(filteredProjects.slice(0, ...))` | `displayedItems: T[]` |
| `hasMore` state + `loadMore()` callback | `hasMore?: boolean` + `onLoadMore?: () => void` |
| `loading` state | `isLoading?: boolean` |
| `<ProjectCard project={...}>` per item | `renderItem: (item, slot) => ReactNode` (slot ignored for this card; render same variant for both `large` and `medium`) |
| `<motion.div>` filter row + grid | `hero?: ReactNode` + `filterBar?: ReactNode` slots (compose hero + filter-bar above the grid) |
| Manual `IntersectionObserver` setup (lines 53–71) | Built-in — sentinel + observer wired internally |
| Custom `useInfiniteScroll` hook (`BusinessProjectsSection`) | `useMagazineFilter<T>` ships at [`grid-layout-news-01/hooks/use-magazine-filter.ts`](../../../src/registry/components/layout/grid-layout-news-01/hooks/) — covers pagination + filtering + simulated loading delay |

The kasder `pageSize = 6` + `setTimeout(500)` simulated delay maps directly to `useMagazineFilter({ items, pageSize: 6, simulatedLoadingMs: 500 })`. **Drop-in.**

### Verdict on reuse

`ProjectsHero` + `ProjectsGrid` + `useInfiniteScroll` + `PageHero` (4 source files, ~330 LOC combined) collapse to **zero new pro-ui code** — fully subsumed by 3 already-shipped pro-comps + 1 shipped hook. The migration is now narrowly scoped to the card visual.

## Design DNA to PRESERVE

Distilled from `original/ProjectCard.tsx` + the bento-item visual in `original/BusinessProjectsSection.tsx`. These are the visual / behavioral decisions worth keeping verbatim — the parts that make these cards feel intentional rather than generic.

### Status state — editorial, not derived

`statusLabels` + `statusColors` form a 3-state closed union. **Crucially**, status is editorially set on the `Project` object — there is NO time-window kernel like event-card-01's `getEventStatus`. A project is `completed` because an editor said so, not because `now > endDate`. This is the right design — projects don't have a binary "ended" point; they accrete completion over months/years and the editorial team marks the transition.

| State | Kasder Turkish | Default English | Token (locked decision #1, REVISED 2026-05-03) |
|---|---|---|---|
| `completed` | "Tamamlandı" | "Completed" | `bg-primary text-primary-foreground` (signal-lime — celebratory) |
| `ongoing` | "Devam Ediyor" | "In progress" | `bg-chart-3 text-white` (teal — active, between lime and grey) |
| `planned` | "Planlanan" | "Planned" | `bg-muted text-muted-foreground border border-border` (neutral, bordered for definition) |

> **Note on `ongoing`:** the original analysis proposed `bg-accent text-accent-foreground`. After the first-render review, this was revised — pro-ui's `--accent: oklch(0.96 0.002 250)` is a near-white **surface token** (not a brand color), so `bg-accent` rendered as a near-invisible pill on `bg-card`. Teal (`--chart-3`) gives the "in progress" semantic a real, distinct color while staying within the existing token system (no new tokens added).

The 3-state set is **leaner** than event-card-01's 6-state set because projects don't fork on capacity / time-proximity. Preserve verbatim.

### Visual states (`grid` variant — image-on-top)

| Slot | What | Notes |
|---|---|---|
| Image area | `aspect-16/10 overflow-hidden` | Wider than typical 16/9 — gives projects an architectural-photography feel |
| Image | `transition-transform duration-700 group-hover:scale-110` | Slow zoom on hover; gate via `motion-safe:` |
| Image gradient overlay | `bg-linear-to-t from-black/60 via-black/15 to-transparent motion-safe:group-hover:from-black/70` | Neutral darkening for badge legibility. **Originally preserved kasder's `from-primary/80 via-primary/20` (primary-tinted) but revised on first-render review** — pro-ui's bright signal-lime overpowered photographic content. The "promotional vs embedded" tonal difference is preserved by gradient intensity (lighter on grid; heavier on feature), not by tint hue. |
| Image area top-left | Status pill — text-only, no icon | `inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium` |
| Image area top-right | Category pill — `Building2` icon + label | `bg-white/20 backdrop-blur-sm text-white` — universal icon for all categories (no per-type color map in source) |
| Image area center | Hover-reveal CTA — "View details" + arrow | `opacity-0 group-hover:opacity-100`, accent-tinted pill. Decorative `<div>` (not a button) — clicking the wrapping link IS the action. Preserves source's overlay-link UX |
| Card chrome | `bg-card border border-border rounded-2xl shadow-soft hover:shadow-medium hover:-translate-y-2 transition-all duration-500` | Lift-on-hover (-2px translate + shadow upgrade), 500ms ease |
| Content padding | `p-6` | |
| Title | `text-xl font-semibold motion-safe:group-hover:text-primary transition-colors line-clamp-2` | Default sans (Onest). **Hover color shifts to `text-primary` (signal-lime), NOT `text-accent`** — pro-ui's `--accent` is a surface token; `text-accent` would render as ~white-on-card-bg (invisible). Mirrors event-card-01's hover behavior. |
| Description | `text-muted-foreground text-sm line-clamp-2 mb-4` | |
| Meta row | flex gap-4 — Location (MapPin) + Year (Calendar), both `text-muted-foreground/70` icons | Optional fields; render only when present. **Icons NOT `text-accent`** (which is a surface token = invisible). Subtle muted icons match the meta-text foreground. |

### Visual states (`feature` variant — full-bleed)

Mirrors `BusinessProjectsSection`'s bento item: `absolute inset-0` image background on a sized container, gradient overlay, content overlaid white-on-dark.

| Slot | What |
|---|---|
| Card chrome | `relative rounded-xl overflow-hidden cursor-pointer group` — sized externally by the consumer's bento layout (`lg:col-span-X lg:row-span-Y`) |
| Image | `absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-110` (or `<img>` with same classes for `loading="lazy"`) |
| Gradient overlay | `bg-linear-to-t from-black/90 via-black/40 to-transparent opacity-80 motion-safe:group-hover:opacity-90` — neutral darkening, heavier than `grid` (white-on-image text needs more darkening to stay readable). After the 2026-05-03 grid-gradient revision both variants are neutral; the difference is intensity not hue. |
| Top-left | Category pill — `Building2` + label, `bg-white/20 backdrop-blur-sm text-white` |
| Top-right | Status badge — same color tokens as `grid`, `backdrop-blur-sm bg-background/20` |
| Bottom | Title + description block, white text, `font-bold text-base mb-1 group-hover:text-primary transition-colors duration-300 line-clamp-2` for title, `text-xs text-white/80 line-clamp-2 group-hover:text-white/90` for description |
| Meta row | Source omits Location/Year on the bento item — the bento favors title + 2-line description only. PRESERVE that omission for `feature` — keeps the dense mosaic visually quiet |
| Hover-CTA | NONE — source has no hover-reveal here (the bento item opens a detail dialog instead). PRESERVE — locked decision #7 |

### Motion

- `transition-transform duration-700 group-hover:scale-110` (grid) / `duration-500 group-hover:scale-110` (feature) on image — gate via `motion-safe:`
- `transition-all duration-500` on card chrome (grid hover-shadow lift)
- `transition-opacity duration-300` on hover-reveal CTA (grid only) — gate via `motion-safe:`
- The kasder `framer-motion` `whileInView` + `delay: (index % 6) * 0.1` is **dropped**: card-level reveal is a layout concern (`grid-layout-news-01` orchestrates one stagger per page per pro-ui mandate)

### Typography

- Title: `text-xl font-semibold` (grid) / `text-base font-bold` (feature). **Sans, not serif** — projects feel like utility/portfolio surfaces, not editorial features. Stick with default `--font-sans` (Onest). Differs from content-card-news-01 (which uses `--font-serif` for editorial DNA), matches event-card-01.
- Description: `text-sm text-muted-foreground` (grid) / `text-xs text-white/80` (feature)
- Meta: `text-sm text-muted-foreground` (grid only)

## Structural debt to REWRITE

Default action for each item: rewrite. Deviations called out explicitly.

### Framework coupling

- `import Link from "next/link"` → polymorphic `linkComponent: ElementType` slot (default `"a"`); same pattern as event-card-01 / content-card-news-01 / author-card-01.
- Hardcoded route `href={\`/projects/${project.id}\`}` → required `href: string` prop OR `getHref?: (project: ProjectCardItem) => string` callback. Default identity returns `project.href ?? '#'`.
- `import { motion } from "framer-motion"` → drop entirely. Card-level reveal is layout-orchestrated; `motion.div` wrapper is dead weight inside a `grid-layout-news-01` cell.

### i18n / l10n

All Turkish strings hoisted to a `labels` object with English defaults:

```ts
type ProjectCard01Labels = {
  // status badges
  completed: string;       // default "Completed"
  ongoing: string;         // default "In progress"
  planned: string;         // default "Planned"
  // CTA (grid only)
  viewDetails: string;     // default "View details"
  // a11y
  featuredAriaLabel: string;   // default "Featured project"
};
```

No date formatting (projects use `year: string` like `"2023"`, not full ISO dates). No locale callback needed — string passes through.

### Color tokens — no new tokens needed (locked decision #1)

Status mapping resolves to existing pro-ui tokens. **No new tokens to wire** — differs from event-card-01 which added `--warning`. Status-config map:

```ts
const STATUS_CLASSNAMES: Record<ProjectStatus, string> = {
  completed: "bg-primary text-primary-foreground",          // signal-lime
  ongoing:   "bg-chart-3 text-white",                        // teal — see note
  planned:   "bg-muted text-muted-foreground border border-border",
};
```

> **`ongoing` was originally `bg-accent text-accent-foreground` per the first analysis pass.** Revised after first-render review — `--accent` is a surface token in pro-ui's neutral preset (near-white in light mode, graphite in dark), which made the pill invisible against `bg-card`. `--chart-3` (teal, hue 200°) gives the "in progress" state a real, distinct color while staying within the existing token system.

Source's raw `bg-green-500/20 text-green-400` (completed) + `bg-blue-500/20 text-blue-400` (planned) drop. Pro-ui token mandate enforced.

### Status union drift

Source has TWO inline types with conflicting unions:
- `projectsType.ts` — `"completed" | "ongoing" | "planned"` (used by public ProjectCard)
- `BusinessProjectsSection.tsx` — `"completed" | "ongoing" | "upcoming"` (inline)

Migration normalizes to the public type's union (`planned`). The BusinessProjectsSection inline type is treated as a copy-paste typo. Documented in locked decision #2.

### Category-color map (locked decision #3)

Source has NO category-color map (universal `Building2` icon for all categories). Migration ships an OPTIONAL `categoryStyles?: Record<string, { className?: string; icon?: ComponentType<{ className?: string }> }>` prop, default empty. Behavior identical to source when consumer doesn't pass it. Mirrors content-card-news-01's `categoryStyles` API.

### CTA decoration (grid variant)

The hover-reveal "View details" overlay becomes a **decorative `<div role="button" aria-hidden="true">`** — visual only, no interactivity beyond the wrapping link click. Source already does this (it's a `<span>`, not a `<button>`). Preserve. No nested `<button>` inside `<a>` (invalid HTML).

### `index` prop

Drop. Source uses it for `delay: (index % 6) * 0.1` on framer-motion's `transition` — but framer-motion is being dropped entirely. Card is index-agnostic.

### `actions` slot (new — for nested interactives) — locked decision #5

Add `actions?: ReactNode` slot rendered at `relative z-10`. Position:
- `grid` variant — top-right of the image area, below the category pill (use `flex flex-col gap-2`) when actions are present; OR overlap-with-shift (push category pill to bottom-right)
- `feature` variant — bottom-right of the content area, inline with title

Consumers drop bookmark / share / save-to-favorites / external-link buttons here. Mirrors event-card-01 + content-card-news-01.

### `featured` flag (new) — locked decision #4

Add `featured?: boolean` to `ProjectCardItem`. Visual treatment:
- `grid` — `border-t-4 border-primary` on card chrome + `<Star className="w-4 h-4 fill-primary text-primary mr-1.5 inline-block">` icon prefix on `<h3>`
- `feature` — `ring-2 ring-primary ring-inset` on card chrome (replaces top-border which doesn't read on full-bleed) + same star prefix on title

`<Star>` carries `aria-hidden="true"`; accessible label via `<span className="sr-only">{labels.featuredAriaLabel}</span>` adjacent to title.

### Image fallback

Source's `<img src={project.image}>` always renders, no fallback when `image` is empty. For v0.1: render a tinted placeholder (`bg-muted` block + `<Building2>` icon centered) when `image` is falsy. Cheap and prevents broken-image icons. Add `loading="lazy"` to `<img>`.

### a11y rewrites

- `aria-labelledby={titleId}` (computed via `useId`) on the wrapping link → accessible name is the title, not the flattened text content
- `id={titleId}` on `<h3>`
- Decorative icons (`Building2`, `MapPin`, `Calendar`, `ArrowRight`, `Star`) get `aria-hidden="true"`
- Image `<img>` carries `alt={project.imageAlt ?? project.title}`
- `motion-safe:` prefix on all transforms / hover effects
- Meta row uses `<ul role="list">` + `<li>` (Safari list-style: none workaround)
- `focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2` on the link

## Dependency audit

### Existing pro-ui primitives — already installed

Confirmed present in `src/components/ui/`:
- `badge.tsx` — feature variant uses Badge for status; grid uses raw `<span>` for status
- `button.tsx` — grid hover-CTA uses `cn(buttonVariants(...))` from button (decorative); not a real button

### NEW shadcn primitives to install

**None.** The card uses only existing primitives. No `Progress` (event-card-01 added it), no `Dialog` (deferred to detail-dialog migration), no new shadcn deps.

### Lucide icons — already a transitive dep

Required: `Building2`, `MapPin`, `Calendar`, `ArrowRight`, `Star`. All present.

### Zero new peer deps

No `framer-motion` (dropped), no `embla`, no `date-fns`, no carousel libs. Card is a pure-React leaf component.

## Dynamism gaps

What needs to lift from "implementation detail" to "consumer-controllable surface":

| Source has | New surface |
|---|---|
| Hardcoded `Link` from `next/link` | `linkComponent?: ElementType` (default `"a"`) |
| Hardcoded `/projects/${id}` route | `href: string` (required) OR `getHref?: (project) => string` callback |
| Hardcoded Turkish strings | `labels?: Partial<ProjectCard01Labels>` |
| No category-color map | `categoryStyles?: Record<string, { className?: string; icon?: ComponentType }>` (default empty) |
| Single layout, no variant prop | `variant: "grid" \| "feature"` (required) — dispatches to `parts/grid.tsx` / `parts/feature.tsx` |
| No actions slot | `actions?: ReactNode` (overlay-link pattern) |
| No featured flag | `featured?: boolean` on `ProjectCardItem` |
| Universal `Building2` icon hardcoded | `categoryStyles[k].icon?` overrides; default falls back to `Building2` |
| Image alt = title | `imageAlt?: string` field on `ProjectCardItem`, falls back to `title` |
| Meta on `feature` variant | Source omits — encoded in the variant parts (NOT a prop). `feature` has no meta row by design |

## Optimization gaps

| Concern | v0.1 plan |
|---|---|
| Re-render on parent re-render | Wrap default export in `React.memo`. Card receives `project: ProjectCardItem` (object) — consumers pass stable refs from data layer, otherwise memo busts. Documented in `usage.tsx`. |
| Status lookup | Trivial (3 entries). No `useMemo` overhead. |
| Image lazy-load | `loading="lazy"` on `<img>` |
| Suspense / code-split | None at this scope. `project-card-01` is a leaf component. |
| React Compiler | Already auto-applied (Next.js 16 React Compiler default). The `React.memo` at the export boundary is the only explicit optimization. |

## Accessibility gaps

| Concern | v0.1 plan |
|---|---|
| Accessible link name | `aria-labelledby={titleId}` via `useId` — link's name is the title, not the flattened content |
| Decorative icons | All lucide icons get `aria-hidden="true"` |
| Image alt | `alt={project.imageAlt ?? project.title}` |
| Keyboard nav | Native `<a>` works for the whole-card link; `actions` slot interactives are consumer-supplied `<button>`s with their own a11y |
| Focus-visible | `focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2` on the link |
| Reduced motion | All transforms + hover-reveals gated via `motion-safe:` prefix. Reduced-motion users see static cards. |
| Color-only status differentiation | Source uses color-only — but adding icons to status would deviate from source DNA (status is text-only there). **Decision:** keep color-only on the badge, BUT enforce text-contrast (the locked tokens all have proper foregrounds) AND ensure status text label is always present (not icon-only). Color-blind users still get the text. |
| RTL | Single directional icon — `ArrowRight` in grid hover-CTA. Add `rtl:rotate-180`. |

## Proposed procomp scope

**Single component, two-variant dispatch** — same shape as event-card-01:

```
src/registry/components/data/project-card-01/
├── project-card-01.tsx           # variant dispatcher (memoized export)
├── parts/
│   ├── grid.tsx                  # vertical image-on-top layout
│   └── feature.tsx               # full-bleed background layout
├── lib/
│   └── project-status.ts         # PROJECT_STATUS_CONFIG (public)
├── types.ts                      # ProjectCardItem + ProjectCard01Props + ProjectCard01Labels + variant + ProjectStatus
├── dummy-data.ts                 # ~6 mixed projects covering all 3 statuses + featured + various categories
├── demo.tsx                      # 5 sub-tabs (see below)
├── usage.tsx                     # consumer notes
├── meta.ts                       # ComponentMeta
└── index.ts                      # public exports — ProjectCard01, PROJECT_STATUS_CONFIG, ProjectStatus, ProjectCardItem, etc.
```

Estimated file count: 11 (1 root + 2 parts + 1 lib + types + dummy + demo + usage + meta + index). Slightly fewer than event-card-01 (12) because no time-window helper is needed (status is editorial).

### Demo plan — 5 sub-tabs

1. **Grid — basic** — 6-project mixed grid covering all 3 statuses (completed / ongoing / planned), various categories, lifted into `grid-layout-news-01` to show the canonical assembly
2. **Feature** — bento-style 6-project grid using raw CSS Grid with `lg:col-span-X lg:row-span-Y` patterns inline (placeholder for future `bento-grid-01`); demonstrates `feature` variant in its real context
3. **Featured** — same 6 projects but one is `featured: true` showing top-border + star prefix (grid) AND ring + star prefix (feature)
4. **Localized** — Turkish labels override (proves the i18n surface) — uses `labels` (Tamamlandı / Devam Ediyor / Planlanan / Detayları Gör) + `categoryStyles` with Turkish category keys to per-tint Kentsel Dönüşüm / Afet Yönetimi / etc.
5. **Actions slot + custom href** — bookmark + share buttons in `actions`, polymorphic `linkComponent`, custom `getHref` (e.g. `(p) => \`/portfolio/${p.id}\``)

### Public API surface (locked-in via decisions)

```ts
// from index.ts
export { ProjectCard01 } from "./project-card-01";
export type {
  ProjectCard01Props,
  ProjectCardItem,
  ProjectCard01Labels,
  ProjectCard01Variant,
} from "./types";
export {
  PROJECT_STATUS_CONFIG,
  type ProjectStatus,
} from "./lib/project-status";
```

### Out-of-scope for v0.1

- **Bento layout** — `getLgPattern` / `getMdPattern` rhythm from `BusinessProjectsSection`. **Future generic `bento-grid-01` (layout)**. Will arrange events / news / portfolio items just as well — should NOT be project-specific.
- **Detail dialog** — sequential prev/next viewer with goals + gallery + external-link. **Future `project-detail-dialog-01` (data) OR generic `sequential-detail-dialog-01`**. Composes already-shipped [`info-list-01`](../../../src/registry/components/data/info-list-01/) (meta chips) + [`expandable-text-01`](../../../src/registry/components/data/expandable-text-01/) (full description) + [`media-carousel-01`](../../../src/registry/components/media/media-carousel-01/) (gallery) + [`engagement-bar-01`](../../../src/registry/components/data/engagement-bar-01/) (external link / share / bookmark) + [`story-viewer-01`](../../../src/registry/components/media/story-viewer-01/)-style prev/next state machine.
- **Public projects page orchestrator** — composed by consumer from [`page-hero-news-01`](../../../src/registry/components/marketing/page-hero-news-01/) + [`filter-bar-01`](../../../src/registry/components/forms/filter-bar-01/) + [`grid-layout-news-01`](../../../src/registry/components/layout/grid-layout-news-01/) + this component. Registry doesn't ship "page templates."
- **Live-status logic** — projects don't have a time-window kernel. Status is editorial (set on the data object).
- **Internal animation library** — framer-motion is dropped; reveal staggering is layout-orchestrated.
- **`compact` / `list` variants** — revisit when a real consumer surfaces. Two variants is enough for v0.1.

## Recommendation

**PROCEED to procomp description (Stage 1).**

The scope is the cleanest of the three card migrations so far:
- **Smaller dependency footprint** than event-card-01 (no `Progress`, no new design-system token)
- **Simpler kernel** than event-card-01 (3-state editorial union vs. 6-state time-window machine)
- **Higher reuse leverage** — 4 source files (~330 LOC) collapse to zero new pro-ui code thanks to `page-hero-news-01` + `filter-bar-01` + `grid-layout-news-01` + `useMagazineFilter`
- **Same multi-variant story** as event-card-01 — `grid` + `feature` dispatch, identical convention reuse

Closest precedent: **event-card-01** (same `data` category, same multi-variant story, same overlay-link + actions-slot pattern, same helper-export pattern). Reuse its conventions verbatim where applicable.

**Next step:** I draft `project-card-01-procomp-description.md` (what the component IS, why it exists, what consumers do with it). Pause for your sign-off before the plan doc.

---

## Open items the description / plan should resolve

These didn't need a decision before analysis but will surface during description / plan authoring. Flagging here so we don't lose them:

1. **`feature` variant featured treatment** — `border-t-4 border-primary` works on the grid card chrome, but the feature variant has no card chrome (it's a full-bleed image). Resolves to `ring-2 ring-primary ring-inset` (same call as event-card-01 feed-variant). Confirm in the plan.
2. **`actions` slot positioning per variant** — grid: top-right of image area conflicts with category pill. Maybe top-right when actions are present, push category pill to bottom-right (like event-card-01 did with the type badge). Decide in plan.
3. **`feature` variant sizing** — source assumes the bento parent sizes the card via `lg:col-span-X lg:row-span-Y` (180px row height). The card itself doesn't know its size. Plan should document: `feature` variant uses `absolute inset-0` for its image AND requires a sized parent (consumer's layout container OR bento-grid-01). `feature` does NOT impose a default aspect ratio.
4. **Hover-CTA arrow icon `rtl:rotate-180`** — simple but worth not forgetting in plan.
5. **`Building2` as default category icon** — encoded as fallback when `categoryStyles[category]?.icon` is undefined? Or always rendered? Source always renders `Building2` regardless of category. Proposed: always render `Building2` UNLESS `categoryStyles[category]?.icon` provided (which then overrides). Document in plan.
6. **`year: string` shape** — source uses `"2023"` not `2023` (number) and not full ISO. Keep as `string` (most flexible — handles `"2023"`, `"Q4 2023"`, `"2023–2025"` ranges). Document in plan.
7. **Demo tab #2 `feature` variant** — without `bento-grid-01` shipped, demo uses inline CSS Grid with hardcoded `lg:col-span-X lg:row-span-Y`. Acceptable — demo can demonstrate the card visual without depending on a future pro-comp. Document in plan that the canonical bento layout will land in `bento-grid-01`.
