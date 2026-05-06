# project-card-01 — procomp plan

> Stage 2: how. The implementation contract.
>
> See [`project-card-01-procomp-description.md`](./project-card-01-procomp-description.md) for the what & why.
>
> **Migration origin:** [`docs/migrations/project-card-01/`](../../migrations/project-card-01/) — see [`analysis.md`](../../migrations/project-card-01/analysis.md) for the design-DNA inventory + rewrite items + dependency audit. Locked-in intake decisions: [`source-notes.md` § Locked-in decisions](../../migrations/project-card-01/source-notes.md#locked-in-decisions-signed-off-2026-05-03).

## Final API

### Public types

```ts
// src/registry/components/data/project-card-01/types.ts

import type { ComponentType, ElementType, MouseEvent, ReactNode } from 'react';
import type { ProjectStatus } from './lib/project-status';
export type { ProjectStatus };

export type ProjectCard01Variant = 'grid' | 'feature';

export interface ProjectCardItem {
  /** Stable identifier. Used for React keys and the default ariaLabel. */
  id: string;
  /** Headline. Rendered as <h3>. Required. */
  title: string;
  /** Editorial category (e.g. "Urban Renewal"). Used as a key into `categoryStyles`. Required. */
  category: string;
  /** Image URL. Required (can be empty string — fallback placeholder rendered when falsy). */
  image: string;
  /** Image alt-text. Optional — falls back to `title`. */
  imageAlt?: string;
  /** Short summary. Required (`grid` variant uses it; `feature` uses it; both line-clamp). */
  description: string;
  /** Editorial status. Required — drives the status pill. */
  status: ProjectStatus;
  /** Free-form location string ("Istanbul, Kadıköy", "Remote", etc). Optional — meta line omitted if missing. */
  location?: string;
  /** Free-form year string ("2023", "Q4 2023", "2023–2025" ranges). Optional — meta line omitted if missing. */
  year?: string;
  /** Default href for this project. Optional — overridden by `href` / `getHref` on the card. */
  href?: string;
  /** Promotional flag. Optional — adds visual lift treatment + Star title prefix. */
  featured?: boolean;
}

export interface ProjectCard01Labels {
  // ─── Status badges ─────────────────────────────────────────────
  /** Default: 'Completed'. */
  completed?: string;
  /** Default: 'In progress'. */
  ongoing?: string;
  /** Default: 'Planned'. */
  planned?: string;
  // ─── Image-area CTA (grid only) ────────────────────────────────
  /** Hover-reveal CTA pill text. Default: 'View details'. */
  viewDetails?: string;
  // ─── A11y ──────────────────────────────────────────────────────
  /** sr-only label on the featured-star icon. Default: 'Featured project'. */
  featuredAriaLabel?: string;
}

export interface ProjectCategoryStyle {
  /** Tailwind class string for the category pill. Optional. */
  className?: string;
  /** Custom icon overriding the default `Building2`. Optional. */
  icon?: ComponentType<{ className?: string; 'aria-hidden'?: boolean }>;
}

export interface ProjectCard01Props {
  /** The project to render. */
  project: ProjectCardItem;

  /** Visual variant. Required — no default; explicit per render site. */
  variant: ProjectCard01Variant;

  // ─── Navigation ──────────────────────────────────────────────────────
  /** URL the card links to. Mutually exclusive with `getHref`. */
  href?: string;
  /** Alternative href derivation. Receives the project, returns a URL. */
  getHref?: (project: ProjectCardItem) => string;
  /** Click handler, fired before navigation if href is also set. */
  onClick?: (project: ProjectCardItem, mouseEvent: MouseEvent) => void;
  /** Element used for the link. Default: 'a'. Pass NextLink / RemixLink / etc. */
  linkComponent?: ElementType;

  // ─── Theming ─────────────────────────────────────────────────────────
  /** Map of category → className + icon override. Default: empty (universal Building2 + neutral chip). */
  categoryStyles?: Record<string, ProjectCategoryStyle>;
  /** Localized labels. Defaults are English. */
  labels?: ProjectCard01Labels;
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
  actions?: ReactNode;

  // ─── Performance ─────────────────────────────────────────────────────
  /** Image loading strategy. Default: 'lazy'. */
  loading?: 'lazy' | 'eager';
}
```

### Public status kernel

```ts
// src/registry/components/data/project-card-01/lib/project-status.ts

export type ProjectStatus = 'completed' | 'ongoing' | 'planned';

export interface ProjectStatusConfigEntry {
  /** Status label (English default; consumer overrides via `labels`). */
  label: string;
  /** Tailwind class string for the status badge background + foreground. */
  className: string;
}

export const PROJECT_STATUS_CONFIG: Record<ProjectStatus, ProjectStatusConfigEntry>;
```

**No `getProjectStatus(project, now)` helper.** Status is editorial — set on the data object, not derived. This is the deliberate simplification vs. event-card-01: projects don't have a time-window kernel; they don't need a derivation helper. Consumers read `project.status` directly.

**No icons in the config.** Differs from `EVENT_STATUS_CONFIG`: project status is text-only on the badge (matches kasder source — no icons there). Keeps the kernel zero-React-import (pure data). Consumers wanting icons add them at the consumer level.

### Exported names

```ts
// src/registry/components/data/project-card-01/index.ts

export { default as ProjectCard01 } from './project-card-01';

export type {
  ProjectCardItem,
  ProjectCard01Labels,
  ProjectCard01Props,
  ProjectCard01Variant,
  ProjectCategoryStyle,
} from './types';

export {
  PROJECT_STATUS_CONFIG,
  type ProjectStatus,
  type ProjectStatusConfigEntry,
} from './lib/project-status';
```

### No generics

The card uses `ProjectCardItem` directly, not `<T extends ProjectCardItem>`. Consumers `.map(raw => mapToProjectCardItem(raw))` once before render. Power users still customize via `categoryStyles` / `titleClassName` / `imageClassName` / `actions`. Same call as content-card-news-01 + event-card-01.

### Required vs optional fields — soft-failure contract

| Field | Required | Behavior when absent |
|---|---|---|
| `id` | ✅ | — |
| `title` | ✅ | — |
| `category` | ✅ | — (used as key into `categoryStyles`; falls to neutral white-on-image chip if not in map) |
| `image` | ✅ (string) | Empty string ⇒ tinted `bg-muted` placeholder + centered `Building2` icon. No broken-image icon. |
| `description` | ✅ | — |
| `status` | ✅ | — (editorial; drives status pill via `PROJECT_STATUS_CONFIG`) |
| `location` | optional | Location meta line omitted (grid only) |
| `year` | optional | Year meta line omitted (grid only) |
| `imageAlt` | optional | Falls back to `title` |
| `href` | optional | Card-level `href` / `getHref` override; absent everywhere ⇒ `'#'` |
| `featured` | optional | No featured treatment |

Note: `feature` variant **never renders a meta row** (no Location / Year) — encoded in the variant part, not as a prop. Matches source DNA (the kasder `BusinessProjectsSection` bento item omits both).

---

## File-by-file plan

11 files total. Sealed-folder convention.

```
src/registry/components/data/project-card-01/
├── project-card-01.tsx           # 1
├── parts/
│   ├── grid.tsx                  # 2
│   └── feature.tsx               # 3
├── lib/
│   ├── project-status.ts         # 4 (PUBLIC)
│   └── image-fallback.tsx        # 5
├── types.ts                      # 6
├── dummy-data.ts                 # 7
├── demo.tsx                      # 8
├── usage.tsx                     # 9
├── meta.ts                       # 10
└── index.ts                      # 11
```

3 fewer files than event-card-01 (14 → 11): no `format-default.ts`, no `list.tsx`, no `compact.tsx`. Two variants, one tiny helper module.

### 1. `project-card-01.tsx` — root component

- `"use client"` directive.
- Wrapped in `React.memo` at the export.
- Resolves all defaults (labels, link component, category styles, loading).
- Computes a unique `titleId` via `React.useId()` for `aria-labelledby` on the link overlay.
- Reads `status` directly from `project.status` (no derivation, no `useMemo` — trivial property read).
- Looks up `statusEntry`: `PROJECT_STATUS_CONFIG[project.status]`, with merged label override from `labels`.
- Resolves `categoryEntry`: `categoryStyles?.[project.category] ?? {}`. Default icon is `Building2` (imported once at the top of the root). Resolved icon: `categoryEntry.icon ?? Building2`.
- Resolves `href`: `getHref?.(project) ?? href ?? project.href ?? '#'`. **`getHref` wins** (description's locked precedence chain).
- Resolves `featured` flag: `project.featured === true`.
- Dispatches to `parts/grid.tsx` or `parts/feature.tsx` based on `variant` prop. **No fallback** — variant is required (TypeScript narrows the union; runtime gets a dev-only `console.warn` if anything else slips through).
- Each part receives a fully-resolved render bag:
  - `project` (the raw item)
  - `statusEntry` (PROJECT_STATUS_CONFIG[status] merged with consumer labels)
  - `categoryEntry` (resolved class + icon)
  - `featured` (boolean)
  - `labels` (fully merged with defaults)
  - `linkProps` ({ href, linkComponent, onClick, ariaLabel, titleId })
  - `slotProps` ({ titleClassName, imageClassName, className, actions, loading })

### 2. `parts/grid.tsx` — vertical image-on-top variant

Anatomy:

- Root `<article className={cn(rootClasses, featured && 'border-t-4 border-t-primary', className)}>` (NOTE: `border-t-primary` not `border-primary` — top-only color scope)
  - rootClasses: `"relative group bg-card rounded-2xl overflow-hidden shadow-sm motion-safe:hover:shadow-xl motion-safe:hover:-translate-y-2 transition-all duration-500 border border-border h-full flex flex-col"`
  - **No `expired`-style fade** — projects don't have a faded-out state. `completed` projects render at full opacity (they're celebrated, not archived).
- Image area: `<div className="relative aspect-16/10 overflow-hidden">`
  - `<img>` with `motion-safe:group-hover:scale-110 transition-transform duration-700`, `loading={loading}`, `alt={project.imageAlt ?? project.title}`. Falls back to `<ImageFallback />` if `image` is empty/falsy.
  - **Subtle dark gradient overlay** (revised 2026-05-03 — kasder's primary-tint overpowered photography): `<div className="absolute inset-0 bg-linear-to-t from-black/60 via-black/15 to-transparent motion-safe:group-hover:from-black/70 transition-all duration-300" aria-hidden="true" />`. Keeps badges legible without imposing a brand-color tint on arbitrary image content.
  - **Top-left:** Status pill — `<span className={cn("inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium", statusEntry.className)}>{statusEntry.label}</span>`. Text-only (no icon — matches source).
  - **Top-right:** Category pill with `Building2` icon (or override) + label — `<span className={cn("inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium backdrop-blur-sm", categoryEntry.className ?? "bg-white/20 text-white")}><CategoryIcon aria-hidden className="w-3 h-3 mr-1.5" />{project.category}</span>`. **Yields to `actions` slot when supplied** — category pill moves to bottom-right; actions take top-right.
  - **Hover-reveal CTA — center of image area:** `<div aria-hidden="true" className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-0 motion-safe:group-hover:opacity-100 transition-opacity duration-300"><span className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-full font-medium shadow-md">{labels.viewDetails}<ArrowRight className="w-4 h-4 motion-safe:group-hover:translate-x-1 transition-transform rtl:rotate-180" /></span></div>`.
    - **`pointer-events-none` on the outer absolute container** — clicks pass through to the link overlay underneath; no nested-button-in-link a11y violation.
    - **`bg-primary text-primary-foreground`** — branded lime-on-near-black pill. Originally proposed `bg-accent text-accent-foreground` but `--accent` is a surface token (near-white) → would render as ~white-on-near-black (visible but unbranded; missing the "lime CTA" reading).
    - `aria-hidden` because the link's accessible name (the title) already conveys the action.
  - **`actions` slot** (when supplied): `<div className="absolute top-4 right-4 z-10 flex gap-1.5">{actions}</div>` — pushes category pill to bottom-right via conditional `position` class.
  - **Bottom-right:** Category pill (when `actions` supplied) OR silent.
- Link overlay: `<linkComponent href={href} aria-labelledby={titleId} aria-label={ariaLabel} className="absolute inset-0 z-0 rounded-2xl focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 outline-none" onClick={handleClick} />` — covers the WHOLE article. Same overlay-link pattern as content-card-news-01 + event-card-01.
- Content area: `<div className="p-6 flex-1 flex flex-col">`
  - Title: `<h3 id={titleId} className={cn("text-xl font-semibold text-foreground mb-3 motion-safe:group-hover:text-primary transition-colors line-clamp-2", titleClassName)}>{featured && <Star aria-hidden className="inline w-4 h-4 fill-primary text-primary mr-1.5 align-baseline" />}{project.title}{featured && <span className="sr-only">{labels.featuredAriaLabel}</span>}</h3>`. **Sans-not-serif** per description (default `--font-sans`, Onest). **Hover shifts to `text-primary` (lime), NOT `text-accent`** — pro-ui's `--accent` is a near-white surface token; `text-accent` would render as ~white-on-card-bg (invisible). Mirrors event-card-01.
  - Description: `<p className="text-muted-foreground text-sm mb-4 line-clamp-2">{project.description}</p>`
  - **Meta lines** (only rendered when at least one of `location` / `year` present): `<ul role="list" className="flex items-center gap-4 text-sm text-muted-foreground">` containing 1-2 `<li>` rows:
    - `<li className="inline-flex items-center gap-1.5"><MapPin aria-hidden className="w-4 h-4 text-muted-foreground/70" />{project.location}</li>` (only if `location`)
    - `<li className="inline-flex items-center gap-1.5"><Calendar aria-hidden className="w-4 h-4 text-muted-foreground/70" />{project.year}</li>` (only if `year`)
    - **Icons NOT `text-accent`** — `--accent` is a surface token (near-white in light mode); muted-foreground at 70% is the readable subtle-accent for meta icons.
  - **No CTA at the foot.** Differs from event-card-01 — projects don't have a status-driven action (no "Register" / "Sold Out"). The hover-reveal CTA over the image IS the action affordance.

### 3. `parts/feature.tsx` — full-bleed background variant

Anatomy:

- Root `<article className={cn(rootClasses, featured && 'ring-2 ring-primary ring-inset', className)}>`
  - rootClasses: `"relative group rounded-xl overflow-hidden cursor-pointer h-full"` — sized externally by the consumer (no default aspect ratio; relies on parent container OR future `bento-grid-01`).
- Image as `<img>` (NOT `bg-image` — `loading="lazy"` + alt + error-handling all need a real `<img>`): `<img src={...} className="absolute inset-0 w-full h-full object-cover motion-safe:group-hover:scale-110 transition-transform duration-500" loading={loading} alt={project.imageAlt ?? project.title} />`. Falls back to `<ImageFallback />` if `image` is empty.
- **Neutral-darken gradient overlay** (NOT primary-tinted; differs from grid deliberately per locked decision #8): `<div className="absolute inset-0 bg-linear-to-t from-black/90 via-black/40 to-transparent opacity-80 motion-safe:group-hover:opacity-90 transition-opacity duration-300" />`
- **Top-left:** Category pill — `<span className={cn("absolute top-3 left-3 inline-flex items-center text-xs px-2 py-1 rounded-full backdrop-blur-sm z-[1]", categoryEntry.className ?? "bg-white/20 text-white")}><CategoryIcon aria-hidden className="w-3 h-3 mr-1" />{project.category}</span>`. **Yields when `actions` supplied** — moves to bottom-right (consistent with grid).
- **Top-right:** Status badge — `<span className={cn("absolute top-3 right-3 text-xs px-2.5 py-1 rounded-full backdrop-blur-sm z-[1]", statusEntry.className)}>{statusEntry.label}</span>`. **Yields when `actions` supplied** — actions take top-right; status badge moves to top-left below the category pill (stacked).
- **`actions` slot** (when supplied): `<div className="absolute top-3 right-3 z-10 flex gap-1.5">{actions}</div>`.
- **Bottom content block:** `<div className="absolute bottom-0 left-0 right-0 p-4 text-white z-[1]">`
  - Title: `<h3 id={titleId} className={cn("font-bold text-base mb-1 text-white motion-safe:group-hover:text-primary transition-colors duration-300 line-clamp-2", titleClassName)}>{featured && <Star aria-hidden className="inline w-4 h-4 fill-primary text-primary mr-1.5 align-baseline" />}{project.title}{featured && <span className="sr-only">{labels.featuredAriaLabel}</span>}</h3>`
  - Description: `<p className="text-xs text-white/80 line-clamp-2 motion-safe:group-hover:text-white/90 transition-colors">{project.description}</p>`
  - **NO meta row** — feature variant is dense; matches source DNA. Location / Year omitted entirely on this variant.
  - **NO hover-reveal CTA** — locked decision #7 (matches `BusinessProjectsSection` source).
- Link overlay: same as grid — `<linkComponent>` covers the whole article at `z-0`. Status / category / actions sit at `z-[1]` or `z-10` to remain visually layered above the gradient but not above the link's clickable surface (wait — they DO sit above the link, but the link is INSIDE a positioned wrapper that lets clicks fall through everywhere except the actions cluster, which is `z-10` and stops propagation).

### 4. `lib/project-status.ts` — public status kernel

```ts
import type { ProjectStatus } from '../types';

export type ProjectStatus = 'completed' | 'ongoing' | 'planned';

export interface ProjectStatusConfigEntry {
  label: string;
  className: string;
}

export const PROJECT_STATUS_CONFIG: Record<ProjectStatus, ProjectStatusConfigEntry> = {
  completed: {
    label: 'Completed',
    className: 'bg-primary text-primary-foreground',
  },
  ongoing: {
    // chart-3 (teal) instead of `bg-accent` — pro-ui's `--accent` is a near-white
    // surface token (NOT a brand color), which renders status pills invisibly.
    // Teal sits between completed (lime) and planned (grey) and reads as "active".
    label: 'In progress',
    className: 'bg-chart-3 text-white',
  },
  planned: {
    label: 'Planned',
    className: 'bg-muted text-muted-foreground border border-border',
  },
};
```

Pure data. **Zero React imports** — even type imports avoided. Tree-shakeable. Consumers can import `PROJECT_STATUS_CONFIG` alone or the `ProjectStatus` type alone, in client OR server contexts. **Public.**

> **2026-05-03 revision:** original plan had `ongoing` mapped to `bg-accent text-accent-foreground`. Caught on first-render review — pro-ui's `--accent: oklch(0.96 0.002 250)` is a surface color (near-white in light, graphite in dark), not a brand color. Replaced with `bg-chart-3` (teal hue 200°) which is in the existing chart palette and gives `ongoing` a real, semantically-distinct visual state. Same change applied to the hover-CTA pill (`bg-accent` → `bg-primary`) and to the meta icons + title hover (`text-accent` → `text-muted-foreground/70` and `text-primary` respectively).

### 5. `lib/image-fallback.tsx` — internal placeholder

```tsx
import { Building2 } from 'lucide-react';

export function ImageFallback({ className }: { className?: string }) {
  return (
    <div className={`flex h-full w-full items-center justify-center bg-muted ${className ?? ''}`}>
      <Building2 aria-hidden className="h-8 w-8 text-muted-foreground/40" />
    </div>
  );
}
```

Internal. Not exported. Used by both `grid` and `feature` when `project.image` is empty/falsy. Mirrors event-card-01's pattern (which uses `Calendar` icon — projects use `Building2`).

### 6. `types.ts`

All public types (already shown above). Re-exports `ProjectStatus` from `lib/project-status` so consumers who only need types don't pull `PROJECT_STATUS_CONFIG`.

### 7. `dummy-data.ts`

**`dummyProjects: ProjectCardItem[]`** — 6 projects, ported from kasder's `projectsData.ts` but reduced to 6 + translated to English defaults. Calibrated to demo all 3 statuses + featured + image-fallback edge:

- 1× `completed` — Fikirtepe-equivalent urban renewal, 2023, Istanbul, image present
- 1× `ongoing` — sustainable development, 2024, Ankara, image present
- 1× `planned` — smart city infrastructure, 2025, Trabzon, image present
- 1× `completed + featured: true` — historic preservation, 2021, Bursa, image present (demos featured treatment)
- 1× `ongoing` — coastal development, 2022, Samsun, image present
- 1× `planned + image: ''` — port renewal, 2025, Mersin, **empty image** (demos image-fallback rendering)

**`dummyTrProjects: ProjectCardItem[]`** — sibling Turkish-localized array. Same status / year / images as `dummyProjects` but with Turkish `title` / `description` / `category` / `location` strings (matches kasder's actual data: `Kentsel Dönüşüm` / `Sürdürülebilir Gelişim` / `Akıllı Şehir` / `Tarihi Koruma`). What the Localized demo tab consumes.

**`dummyCategoryStyles: Record<string, ProjectCategoryStyle>`** — 5 English-keyed entries:

```ts
// Solid backgrounds (90% opacity) for over-image legibility — light tints
// (`bg-X/10 text-X border border-X/20`) read poorly over photographic content.
// `text-warning-foreground` for amber (parallels primary-foreground); `text-white`
// for chart-* colors which don't have a -foreground variant defined.
export const dummyCategoryStyles = {
  'Urban Renewal':            { className: 'bg-primary/90 text-primary-foreground' },
  'Sustainable Development':  { className: 'bg-chart-3/90 text-white' },
  'Disaster Management':      { className: 'bg-warning/90 text-warning-foreground' },
  'Historic Preservation':    { className: 'bg-chart-4/90 text-white' },
  'Coastal Development':      { className: 'bg-chart-5/90 text-white' },
};
```

**`dummyTrCategoryStyles`** — Turkish-keyed sibling. Same 5 categories with Turkish keys.

**`dummyTrLabels: ProjectCard01Labels`** — Turkish labels for the Localized demo tab:

```ts
{ completed: 'Tamamlandı', ongoing: 'Devam Ediyor', planned: 'Planlanan', viewDetails: 'Detayları Gör', featuredAriaLabel: 'Öne çıkan proje' }
```

### 8. `demo.tsx`

5-tab demo, built with shadcn `Tabs`:

1. **Grid** — 6-project responsive grid composed via `grid-layout-news-01` (proves the canonical assembly with already-shipped pro-comps). Includes a `filter-bar-01` above for category filtering. Consumes `dummyProjects` + `dummyCategoryStyles`. **This tab IS the kasder ProjectsGrid replacement** — proves zero-new-code page assembly.
2. **Feature (bento)** — 6-project bento mosaic using INLINE CSS Grid with the kasder `getLgPattern` rhythm hardcoded as `className` props on each card (preview of what `bento-grid-01` will eventually own). All 6 projects rendered as `variant="feature"` inside `auto-rows-[180px]` containers. Demonstrates `feature` in its real context.
3. **Featured** — 2-card side-by-side comparison: one `grid` variant with `featured: true` (top-border + Star) + one `feature` variant with `featured: true` (inset ring + Star). Proves both treatments side-by-side.
4. **Localized** — consumes `dummyTrProjects` + `dummyTrCategoryStyles` + `dummyTrLabels`. Mirrors kasder's defaults; proves the i18n surface end-to-end (project data, category styles, labels all swapped together).
5. **Actions slot + custom href** — `grid` variant with an `actions` cluster (Bookmark + Share2) + polymorphic `linkComponent={MockNextLink}` + `getHref={(p) => `/portfolio/${p.id}`}`. Each action button calls `e.preventDefault()` + `e.stopPropagation()` and toggles local state without navigating. Demonstrates the overlay-link pattern + the routing-precedence chain (`getHref` wins over `href` wins over `project.href`).

### 9. `usage.tsx`

Code blocks + prose covering:
- Minimal usage (`project` + `variant` + `href`).
- Both variants side-by-side.
- Polymorphic root with NextLink / RemixLink samples.
- Custom `categoryStyles` (per-category className + icon override).
- Custom `labels` for i18n (with Turkish example).
- `actions` slot — overlay-link pattern, `e.stopPropagation()` requirement.
- Soft-failure with missing fields (no location / no year / empty image).
- Image fallback — describe what renders when `image` is empty.
- **Public helper kernel** — using `PROJECT_STATUS_CONFIG` WITHOUT rendering the card (status-summary chip row example, status-legend sidebar example).
- **Composition with already-shipped pro-comps** — code block showing the full `page-hero-news-01` + `filter-bar-01` + `grid-layout-news-01` + `useMagazineFilter` + `project-card-01` page assembly. **This is the dynamicity-and-reusability story made concrete.**
- `feature` variant sizing contract — feature uses `absolute inset-0` for image; consumer-driven parent container provides height/width.

### 10. `meta.ts`

```ts
import type { ComponentMeta } from '@/registry/manifest';

export const projectCard01Meta: ComponentMeta = {
  slug: 'project-card-01',
  name: 'Project Card (01)',
  category: 'data',
  status: 'alpha',
  version: '0.1.0',
  description:
    'Project / case-study preview card with 3-state editorial status (completed / ongoing / planned) and 2 visual variants (grid / feature). Polymorphic root, soft-failure item shape, overlay-link pattern, fully customizable. Public PROJECT_STATUS_CONFIG export for status-color / label reuse outside the card.',
  // updated, dependencies, tags …
};
```

### 11. `index.ts`

Public exports as shown above.

---

## Dependencies

### Internal (pro-ui)

- `@/components/ui/button` — for `buttonVariants()` helper applied to the decorative hover-CTA pill (grid variant only)
- `@/lib/utils` — `cn()` helper

> Note: shadcn `Badge` primitive is intentionally NOT a dep. Status + category pills are rendered as raw `<span>` with `cn()`-composed classes — gives finer control over icon-gap rhythm + backdrop-blur layering. Consistent with event-card-01's call.

### NPM

- `react` — runtime + types (already in pro-ui)
- `lucide-react` — icons (`Building2`, `MapPin`, `Calendar`, `ArrowRight`, `Star`). Already in pro-ui.

### Forbidden (not added)

- `next/*` — registry rule
- `framer-motion` — pro-ui Motion mandate uses CSS transitions; kasder source's `motion.div` wrappers are dropped
- Date library (date-fns / dayjs / luxon) — `year` is a free-form string; no parsing needed

### Pro-ui-wide additions (non-component)

**None.** Differs from event-card-01 (which added `--warning` + shadcn `progress`). This migration:
- Adds NO new design-system tokens (verified by `git diff src/app/globals.css` should show zero changes)
- Adds NO new shadcn primitives (verified by `git diff src/components/ui/` should show zero new files)
- Adds NO new peer deps

This is the cleanest of the three card migrations on dependency footprint.

---

## Composition pattern

**Headless wrapping + presentational parts** — same as content-card-news-01 + event-card-01.

Root component owns:
- Prop normalization (defaults, label merge, category-styles lookup, link resolution)
- `useId` for the title's `id`
- Memoization (`React.memo` at export)
- Variant dispatch

Each `parts/<variant>.tsx` is stateless presentational. No business logic in parts.

**No render-prop, no compound API.** The `variant` prop is the single dispatch axis. Consumers extend via slot props (`titleClassName`, `imageClassName`, `className`, `categoryStyles`, `actions`).

**Polymorphic root** via `linkComponent: ElementType`. Same pattern as content-card-news-01 + event-card-01.

---

## Client vs server

**Client component** — `project-card-01.tsx` declares `"use client"`. Required for `useId` + `React.memo` + the function-rich props (`onClick`, `linkComponent`, `getHref`).

**Helper module (`lib/project-status.ts`) has no `"use client"` directive** and is a pure data module — it CAN be imported into Server Components (e.g., a server-rendered "Status overview" sidebar that reads `PROJECT_STATUS_CONFIG[s].label` server-side without rendering a card).

The parts (`parts/grid.tsx`, `parts/feature.tsx`) and `lib/image-fallback.tsx` inherit the client boundary from the root.

---

## Edge cases

| Case | Behavior |
|---|---|
| `image` empty string | `<ImageFallback />` rendered (bg-muted + Building2 icon). |
| `imageAlt` undefined | Falls back to `title`. |
| `location` undefined | Location meta line omitted (grid). |
| `year` undefined | Year meta line omitted (grid). |
| Both `location` + `year` undefined | Meta `<ul>` not rendered at all (no empty list element). |
| `feature` variant + any meta field | Meta row never rendered regardless — by design. |
| `featured: true` + `grid` | `border-t-4 border-primary` + Star title prefix. |
| `featured: true` + `feature` | `ring-2 ring-primary ring-inset` + Star title prefix (inset ring works on the full-bleed image background). |
| `actions` provided + grid | Actions cluster at top-right of image area (z-10); category pill moves to bottom-right. |
| `actions` provided + feature | Actions cluster at top-right of content area (z-10); status badge moves to top-left below category pill (stacked). |
| `category` not in `categoryStyles` map | Falls back to `bg-white/20 text-white` neutral chip with `Building2` icon. |
| `categoryStyles[k].icon` provided | Replaces `Building2`. |
| `categoryStyles[k].className` provided + `icon` not | Style overrides; default `Building2` icon retained. |
| `getHref` + `href` both provided | `getHref(project)` wins (precedence: getHref > href > project.href > '#'). |
| All three href sources undefined | Falls to `'#'`. Documented as "consumer must supply navigation." |
| `linkComponent` not provided | Plain `<a>` is used. SSR + CSR works. |
| Title very long | `line-clamp-2` truncates with ellipsis (both variants). |
| Description very long | `line-clamp-2` (both variants). |
| Location very long | Inline meta cell — uses CSS truncation (`overflow-hidden text-ellipsis whitespace-nowrap` if needed). |
| Year very long (e.g. "2023–2025") | No truncation — designed to fit. |
| `actions` cluster very wide | Wraps below the image area top-right slot? No — `top-right` cluster has `flex gap-1.5` + no width clamp; consumer is responsible for keeping the cluster narrow (1-3 small icon buttons, like event-card-01). |
| RTL | `ArrowRight` (grid hover-CTA only) gets `rtl:rotate-180`. All `gap-*` / `space-*` / `flex` work in RTL via `dir="rtl"` parent. |
| Mobile | Both variants are mobile-friendly out of the box. Grid: 1 column < md, 2 < lg, 3 ≥ lg (consumer's grid CSS via `grid-layout-news-01`). Feature: stays 1 column at all widths unless consumer's bento layout overrides. |
| Reduced motion | All `transition-transform`, `group-hover:scale-*`, `group-hover:translate-x-*`, hover-CTA opacity transitions wrapped in `motion-safe:`. Reduced-motion users see static cards. |
| Dark mode | Inherits pro-ui dark tokens. Feature variant's white-on-dark text stays the same (gradient overlays + image background); grid variant's `bg-card` lifts to graphite. |
| Two cards side-by-side, hover one | Hover effects scoped to `group` on the article; sibling cards stay static. |

---

## Accessibility

### Keyboard

- The link overlay is the sole keyboard-focusable element on the card (matches content-card-news-01 + event-card-01).
- Tab → focus the card; Enter → navigate.
- When `actions` slot is provided, those interactive children come AFTER the link in DOM order. Tab order: card-link → action1 → action2 → next card.
- Focus-visible ring renders on the article root via `:has(a:focus-visible)` so the visual focus state covers the whole card surface.

### ARIA

- Link uses `aria-labelledby={titleId}` pointing to the heading's `id` (`useId`-generated). Heading text is the link's accessible name.
- Decorative icons (`Building2`, `MapPin`, `Calendar`, `Star`, `ArrowRight`) get `aria-hidden="true"`.
- Image `<img>` carries `alt={project.imageAlt ?? project.title}`. Fallback placeholder's `<Building2>` is `aria-hidden`.
- Status differentiated by **color AND text** (status text label always present — no icon-only status; color-blind users get the text).
- Featured-star icon `aria-hidden`; the `<span className="sr-only">{labels.featuredAriaLabel}</span>` after the title injects the screen-reader announcement.
- Decorative hover-CTA pill (grid only) `aria-hidden="true"` (the link's accessible name conveys the action).
- Meta lines: `<ul role="list">` (Safari `list-style: none` workaround), `<li>` per row.

### Focus management

- No focus-stealing, no autofocus.
- When the link is clicked, default browser navigation happens (or consumer's `onClick` fires first).

### Screen-reader semantics

- `<article>` for each card.
- Heading level fixed at `h3` for both variants (cards typically render under an `h2` page section heading; consumers can override visual size via `titleClassName`).

### WCAG 2.1 AA target

- ✅ 1.4.1 Use of Color — status differentiated by color AND text label.
- ✅ 1.4.3 Contrast — all default text/bg pairs meet 4.5:1: `bg-primary` (lime) + `text-primary-foreground` (near-black); `bg-chart-3` (teal `oklch(0.66 0.12 200)`) + `text-white`; `bg-muted` + `text-muted-foreground`. All token combinations validated by pro-ui's design system. Feature variant's white-on-dark gradient ensures text contrast against any image content.
- ✅ 1.4.11 Non-text Contrast — focus-visible ring is `ring-2 ring-offset-2`.
- ✅ 2.1.1 Keyboard — full keyboard reach via tab + enter on the link.
- ✅ 2.4.4 Link Purpose — link's accessible name is the project title.
- ✅ 2.4.7 Focus Visible — `focus-visible:ring-*`.
- ✅ 2.5.3 Label in Name — accessible name matches visible heading.
- ✅ 4.1.2 Name, Role, Value — `<article>` + `<a>` + `<h3>` + `aria-labelledby` + `<ul role="list">` correct.

---

## Verification checklist (mirrors component-guide §13)

- [ ] `pnpm tsc --noEmit` clean (no any, no unknown, props strict; `PROJECT_STATUS_CONFIG` typing matches `Record<ProjectStatus, ProjectStatusConfigEntry>`).
- [ ] `pnpm lint` clean (no new warnings).
- [ ] `pnpm build` clean — all routes prerendered including `/components/project-card-01`.
- [ ] SSR `curl -s http://localhost:3000/components/project-card-01` returns 200 with all 5 demo tab triggers rendered (Grid / Feature bento / Featured / Localized / Actions slot) + Grid tab default content visible.
- [ ] `/components` index lists the new entry (manifest registration verified).
- [ ] **Zero new tokens** — `git diff src/app/globals.css` returns no changes.
- [ ] **Zero new shadcn primitives** — `git diff src/components/ui/` returns no new files.
- [ ] **Zero new peer deps** — `git diff package.json` shows no `dependencies` / `peerDependencies` additions.
- [ ] Helper-only imports work — write a quick `pnpm tsc --noEmit` test consumer that does `import { PROJECT_STATUS_CONFIG } from "@/registry/components/data/project-card-01"` and uses it without rendering the card; passes type-check.
- [ ] Visual sanity (demo screenshots in DevTools): Grid with 3 statuses + 5 distinct category-tinted pills + hover-reveal CTA visible on hover; Feature bento with 5 different `lg:col-span/row-span` rhythms; Featured comparison shows top-border on grid + inset-ring on feature; Localized renders Turkish chars; Actions slot doesn't navigate when buttons clicked.

### Manual browser smoke (post-merge, recommended)

- Tab to a card — focus-visible ring covers the whole card, not just the link rectangle.
- Click anywhere on card surface (including the decorative hover-CTA pill on grid) — navigates.
- With actions-slot demo: click an action button — DOES NOT navigate; state toggles.
- Tab through a card with actions — link → action1 → action2 → next card.
- Toggle OS reduced-motion — image scale + arrow translate + hover-CTA opacity transition all disabled; hover shadow + color shift remain.
- Toggle dark mode — both variants adapt; grid lifts to graphite; feature gradient unchanged (image-driven).
- Resize from desktop to mobile — both variants stay readable.
- Empty-image card renders `Building2` icon centered on `bg-muted`.
- Screen-reader pass (VoiceOver / NVDA): each card announces "{title}, link" (single utterance via `aria-labelledby`); featured cards add "Featured project".

---

## Risks & alternatives

### Risk 1: `PROJECT_STATUS_CONFIG` API stability

Exporting `PROJECT_STATUS_CONFIG` widens the public surface — breaking changes here become breaking changes for consumers using the kernel without the card. **Mitigation:** lock the signatures now (the map is tiny + pure data); document in `usage.tsx` that the kernel is part of the API contract; future internal refactors must preserve the entry shape (`{ label, className }`). Adding new statuses (e.g., `cancelled`, `archived`) would be a v0.2 minor bump, not a breaking change — the union widens but existing consumers still type-check.

### Risk 2: `feature` variant sizing contract

`feature` uses `absolute inset-0` for image AND requires a sized parent. If a consumer drops `<ProjectCard01 variant="feature">` into an undimensioned parent, the card collapses to zero height. **Mitigation:** documented prominently in usage.tsx + `meta.ts` description. Demo tab #2 explicitly shows the parent-sizing contract with `auto-rows-[180px]`. Future `bento-grid-01` will absorb this responsibility.

### Risk 3: Image-fallback icon choice

`Building2` is the universal default category icon AND the image-fallback icon — risks being two different visual signals using the same glyph. **Decision:** acceptable — fallback is a rare edge (consumer's data layer should supply images), and when both fire (no image + no `categoryStyles[k].icon`), the visual recovers gracefully (the fallback renders large-and-centered on the muted block; the category pill renders small-with-text in the corner — different sizes, different placements, no confusion).

### Risk 4: `feature` variant top-right collision when `actions` + `featured`

When `featured: true` AND `actions` are both supplied on a `feature` variant, the inset ring + actions cluster at top-right + status pill (which yields to top-left below category pill) all need to coexist. **Decision:** ring renders on the article root (no positional conflict with z-stacked elements). Status pill stacks below category pill at top-left. Actions cluster owns top-right unchallenged. Tested in demo tab #5.

### Risk 5: `categoryStyles` map encourages closed-set thinking

A `Record<string, ProjectCategoryStyle>` invites consumers to enumerate all categories upfront. If their data has 50+ categories, the map gets long. **Mitigation:** map is OPTIONAL and DEFAULTS TO EMPTY — empty map ⇒ universal `Building2` + neutral chip behavior (matches kasder source). Consumers who want per-category theming opt-in with as many entries as they need; consumers who don't bother get a sensible default. Same call as content-card-news-01's `categoryStyles`.

### Risk 6: Gradient overlay primary tint — REALIZED & RESOLVED 2026-05-03

Original plan called for preserving kasder's `from-primary/80 via-primary/20` gradient on the grid variant. **Risk realized on first-render review** — the bright signal-lime tint dominated the image content (cards looked uniformly green regardless of underlying photography). **Resolution:** swapped to neutral darkening `from-black/60 via-black/15 to-transparent` (mirroring event-card-01's grid pattern). The "promotional vs embedded" tonal difference is now expressed by gradient INTENSITY (lighter on grid; heavier on feature) rather than tint hue. Feature variant's `from-black/90 via-black/40` was correct from the start — no change there. **Lesson logged:** "preserve source DNA verbatim" is a fragile call when the source's design system uses different primitive colors than ours. Lime is too bright; treat the source's brand-color overlays as candidates for context-translation, not direct copy.

### Alternatives considered

1. **Compound API** (`<ProjectCard.Image>`, `<ProjectCard.Status>`, `<ProjectCard.Meta>`). Rejected — variants vary too much in structure; compound API fights the variant system. Same call as event-card-01 + content-card-news-01.
2. **Generic over project shape** (`<ProjectCard01<T extends ProjectCardItem>>`). Rejected — strict shape is more ergonomic; users map to it cheaply.
3. **Add `getProjectStatus(project, now)` helper** mirroring event-card-01's kernel. Rejected — projects don't have a time-window kernel; status is editorial. Adding the helper would imply derivation that doesn't exist.
4. **Add `--info` token (blue) for `planned`** mirroring event-card-01's `--warning` add. Rejected — token is single-component-use; `bg-muted` is the closer semantic match. Token system stays lean.
5. **Inline status logic in each part instead of a shared kernel**. Rejected — exporting `PROJECT_STATUS_CONFIG` is the dynamicity-and-reusability decision; consumers building filter rows / status legends benefit.
6. **Drop `feature` variant — ship grid-only in v0.1, add feature in v0.2**. Rejected — kasder source already extracts both layouts; the 2-variant story is fundamental to the migration.
7. **Drop `actions` slot — ship without and add in v0.2**. Rejected — adding it later is a breaking change for layout consumers (memory: dynamicity primacy).
8. **Drop `featured` flag — projects don't have featured semantics in kasder source**. Rejected — cheap forward-compat surface; mirrors event-card-01 + content-card-news-01 conventions; future-proof for portfolio "selected works" use cases.
9. **CSS-Modules per part vs. Tailwind utilities inline**. Rejected — pro-ui's house style is Tailwind utilities. Consistent with prior ships.
10. **Use `bg-image` for `feature` variant** (matches `BusinessProjectsSection` source). Rejected — `<img>` is more accessible (alt, lazy-loading, error-handling all work natively). Visual result is identical.

### Open follow-ups (post v0.1.0)

- v0.2: skeleton companion (`<ProjectCard01.Skeleton variant="grid" />`) — locked open in description #12.
- v0.2: status union widens — `cancelled` / `archived` if real consumer demand surfaces. Adding new entries is non-breaking.
- v0.2: render-prop slots (`renderFooter?` / `renderMeta?`) if consumer customization beyond `actions` + `categoryStyles` proves insufficient.
- **`bento-grid-01` (layout) — separate greenfield procomp** — owns the `getLgPattern` / `getMdPattern` 5-rhythm kernel from `BusinessProjectsSection`. Generic; not project-specific. Composes with this card's `feature` variant.
- **`project-detail-dialog-01` (data) — separate migration** — sequential prev/next viewer composing already-shipped `info-list-01` + `expandable-text-01` + `media-carousel-01` + `engagement-bar-01` + `story-viewer-01`-style state machine.
