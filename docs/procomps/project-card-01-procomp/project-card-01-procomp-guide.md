# project-card-01 — procomp guide

> Stage 3: how to use it. Authored alongside the implementation.
>
> See [`project-card-01-procomp-description.md`](./project-card-01-procomp-description.md) for *why* and [`project-card-01-procomp-plan.md`](./project-card-01-procomp-plan.md) for *how*.

## When to use

- Civil-society / association sites listing completed and in-progress projects (urban renewal, disaster management, sustainable development — the kasder use case driving the migration).
- Architecture / engineering / construction firm portfolios — completed builds, ongoing commissions, planned projects.
- Agency / consultancy "selected work" sections — case studies with editorial status (live / in-development / concept).
- B2B SaaS landing pages with "customer success stories" or "implementation" listings.
- Internal company portals listing initiatives, programs, or strategic projects.
- Mixed-content feeds where projects appear alongside news + events — the `feature` variant is built for embedded mosaic widgets.

## When NOT to use

- **Projects with a time-window state machine** — if status auto-derives from start-date / end-date / completion-percentage, you want the kind of kernel `event-card-01` ships. `project-card-01` status is editorial only (set on the data object).
- **Project detail pages** — the full case-study page with goals + gallery + meta + external link belongs to the future `project-detail-dialog-01` (composes `info-list-01` + `expandable-text-01` + `media-carousel-01` + `engagement-bar-01`).
- **Bento mosaic layout itself** — the layout that arranges these cards in `lg:col-span-X lg:row-span-Y` rhythms is the future generic `bento-grid-01`, not this card.
- **Forms or in-card interactions beyond the link / `actions` slot** — text-selection inside form fields collides with the overlay-link pattern.

## Composition patterns

### Public projects page (the canonical use case — zero new code)

```tsx
import { useState } from "react";
import NextLink from "next/link";
import { Building2 } from "lucide-react";
import { PageHeroNews01 } from "@/registry/components/marketing/page-hero-news-01";
import { FilterBar01 } from "@/registry/components/forms/filter-bar-01";
import {
  GridLayoutNews01,
  useMagazineFilter,
} from "@/registry/components/layout/grid-layout-news-01";
import { ProjectCard01 } from "@/registry/components/data/project-card-01";

export default function ProjectsPage({ allProjects }) {
  const [category, setCategory] = useState<string | null>(null);
  const filtered = useMagazineFilter({
    items: allProjects,
    pageSize: 6,
    filterPredicate: (p) => !category || p.category === category,
    simulatedLoadingMs: 500,
  });

  return (
    <GridLayoutNews01
      hero={
        <PageHeroNews01
          badge="Projects"
          badgeIcon={Building2}
          title="Transformations We've Delivered"
          titleHighlight="Across Türkiye"
          description="Urban renewal, disaster management, and sustainable-development projects."
        />
      }
      filterBar={
        <FilterBar01
          categories={["Urban Renewal", "Disaster Management", "Sustainable Development"]}
          category={category}
          onCategoryChange={setCategory}
          hideSearch
          hideDateRange
        />
      }
      displayedItems={filtered.displayedItems}
      hasMore={filtered.hasMore}
      isLoading={filtered.isLoading}
      onLoadMore={filtered.loadMore}
      renderItem={(project) => (
        <ProjectCard01
          key={project.id}
          project={project}
          variant="grid"
          href={`/projects/${project.id}`}
          linkComponent={NextLink}
        />
      )}
    />
  );
}
```

The card itself is the only NEW pro-comp on this page — `page-hero-news-01`, `filter-bar-01`, and `grid-layout-news-01` (with its built-in `useMagazineFilter` hook) cover the rest.

### Embedded business-profile mosaic (`feature` variant)

Until `bento-grid-01` ships, the bento layout is consumer-supplied via inline `lg:col-span-X lg:row-span-Y` className overrides:

```tsx
<section className="bg-card rounded-xl p-6 shadow-sm border border-border">
  <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
    <Briefcase className="h-5 w-5 text-primary" />
    Our Projects
  </h2>
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 auto-rows-[180px] gap-4">
    {projects.slice(0, 5).map((project, i) => (
      <ProjectCard01
        key={project.id}
        project={project}
        variant="feature"
        href={`/projects/${project.id}`}
        linkComponent={NextLink}
        className={
          i === 0 ? "lg:col-span-2 lg:row-span-1" : "lg:col-span-1 lg:row-span-1"
        }
      />
    ))}
  </div>
</section>
```

When `bento-grid-01` lands, the per-card `className` props become unnecessary — the layout drives sizing.

### Status legend (helper kernel, no card render)

```tsx
import {
  PROJECT_STATUS_CONFIG,
  type ProjectStatus,
} from "@/registry/components/data/project-card-01";

function StatusLegend() {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {(Object.keys(PROJECT_STATUS_CONFIG) as ProjectStatus[]).map((s) => (
        <span
          key={s}
          className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${PROJECT_STATUS_CONFIG[s].className}`}
        >
          {PROJECT_STATUS_CONFIG[s].label}
        </span>
      ))}
    </div>
  );
}
```

Pure-data import — `PROJECT_STATUS_CONFIG` has zero React imports, zero DOM access, server-component-importable.

### Status-count summary

```tsx
import {
  PROJECT_STATUS_CONFIG,
  type ProjectStatus,
  type ProjectCardItem,
} from "@/registry/components/data/project-card-01";

function StatusSummary({ projects }: { projects: ProjectCardItem[] }) {
  const counts = projects.reduce<Record<ProjectStatus, number>>(
    (acc, p) => ({ ...acc, [p.status]: (acc[p.status] ?? 0) + 1 }),
    { completed: 0, ongoing: 0, planned: 0 },
  );
  return (
    <div className="flex gap-3">
      {(Object.keys(counts) as ProjectStatus[]).map((s) => (
        <span
          key={s}
          className={`px-2 py-0.5 rounded-full text-xs ${PROJECT_STATUS_CONFIG[s].className}`}
        >
          {PROJECT_STATUS_CONFIG[s].label}: {counts[s]}
        </span>
      ))}
    </div>
  );
}
```

## Variant cheat-sheet

| Decision | Use `grid` | Use `feature` |
|---|---|---|
| Layout context | Stand-alone listing page (1/2/3-col) | Embedded mosaic widget (any sized parent / future `bento-grid-01`) |
| Image treatment | Top of card, fixed `aspect-16/10`, scales on hover | Full-bleed background, fills the parent, scales on hover |
| Content treatment | Below image, `bg-card` + `text-foreground` | Overlaid on image, `text-white` over neutral-darken gradient |
| Hover-reveal CTA | Yes — "View details" pill centered over image | No — the image-as-background is the affordance |
| Meta row (location / year) | Yes (when fields present) | Never (denser by design) |
| Featured treatment | `border-t-4 border-t-primary` + Star title prefix | `ring-2 ring-primary ring-inset` + Star title prefix |
| Sizing contract | Self-sizes (image at fixed aspect, content fills below) | Requires sized parent (`absolute inset-0` for image; collapses without parent dimensions) |

## Status visual cheat-sheet

| Status | Token | Hue | Reads as |
|---|---|---|---|
| `completed` | `bg-primary text-primary-foreground` | Signal-lime (132°) | Done, celebrated |
| `ongoing` | `bg-chart-3 text-white` | Teal (200°) | Active, in-flight |
| `planned` | `bg-muted text-muted-foreground border border-border` | Neutral grey | Scheduled, quiet |

> **Why teal for `ongoing` and not accent?** Pro-ui's `--accent: oklch(0.96 0.002 250)` is a near-white **surface token** (used for hover-bg / muted-bg / popover-bg), not a brand accent. Mapping `ongoing` to `bg-accent` would render as a near-invisible pill on `bg-card`. Teal sits semantically between completed-lime and planned-grey while staying in the existing chart palette (no new tokens added).

## `categoryStyles` tip — solid backgrounds for over-image legibility

```tsx
// ✅ GOOD — solid background, readable over any image
categoryStyles={{
  "Urban Renewal": { className: "bg-primary/90 text-primary-foreground" },
  "Disaster Management": { className: "bg-warning/90 text-warning-foreground" },
  "Sustainable Development": { className: "bg-chart-3/90 text-white" },
}}

// ❌ BAD — light tint, low contrast over photographic backgrounds
categoryStyles={{
  "Urban Renewal": { className: "bg-primary/15 text-primary border border-primary/20" },
}}
```

The card renders the category pill with `backdrop-blur-sm` baked in, so even your solid-background classes get a subtle glassiness from the underlying image. Reserve light tints for off-image contexts (sidebars, plain backgrounds).

## `actions` slot — overlay-link semantics

When you drop interactive children into `actions`, every nested button MUST call `e.stopPropagation()` (and usually `e.preventDefault()` if it's an anchor inside another anchor). Otherwise the wrapping link will fire on top of your handler.

```tsx
<ProjectCard01
  project={project}
  variant="grid"
  href={`/projects/${project.id}`}
  actions={
    <button
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggleBookmark(project.id);
      }}
      aria-label="Bookmark"
    >
      <Bookmark className="size-4" />
    </button>
  }
/>
```

When `actions` is supplied:
- **`grid`** — actions cluster takes top-right of image area; category pill yields to bottom-right.
- **`feature`** — actions cluster takes top-right of image area; status pill stacks under category pill at top-left.

## `href` precedence chain

Three layers, narrow → broad:
1. **`getHref(project)`** — function on the card (highest precedence; useful for routes that depend on more than `project.id`)
2. **`href`** — string on the card
3. **`project.href`** — default on the data object
4. **fallback** — `'#'` (consumer hasn't supplied navigation)

```tsx
// All three sources defined — getHref wins
<ProjectCard01
  project={{ ...project, href: "/legacy/project" }}
  href="/projects/explicit"
  getHref={(p) => `/portfolio/${p.category.toLowerCase()}/${p.id}`}
  variant="grid"
/>
// Renders link to: /portfolio/urban-renewal/fikirtepe-renewal
```

## Polymorphic linking (NextLink, RemixLink, react-router)

```tsx
// Next.js
import NextLink from "next/link";
<ProjectCard01 ... linkComponent={NextLink} />

// Remix
import { Link as RemixLink } from "@remix-run/react";
<ProjectCard01 ... linkComponent={RemixLink} />

// react-router v6+
import { Link as RRLink } from "react-router-dom";
<ProjectCard01 ... linkComponent={RRLink} />

// Plain anchor (default — no linkComponent prop needed)
<ProjectCard01 ... />
```

The `linkComponent` receives `href`, `aria-labelledby`, `aria-label`, `onClick`, and `className` — the same props every Link / NextLink / etc. variant accepts.

## Internationalization

Pass a partial `labels` object — only override what you need:

```tsx
<ProjectCard01
  project={project}
  variant="grid"
  href={`/projects/${project.id}`}
  labels={{
    completed: "Tamamlandı",
    ongoing: "Devam Ediyor",
    planned: "Planlanan",
    viewDetails: "Detayları Gör",
    featuredAriaLabel: "Öne çıkan proje",
  }}
/>
```

Labels object is 5 keys; `DEFAULT_PROJECT_CARD_LABELS` is exported if you want the English defaults as a base for spreading.

## Soft-failure cheat-sheet

| Field absent / empty | Behavior |
|---|---|
| `image: ""` | `bg-muted` placeholder + centered `Building2` icon (no broken-image icon) |
| `imageAlt` | Falls back to `title` |
| `location` | Location meta cell omitted (grid only) |
| `year` | Year meta cell omitted (grid only) |
| Both `location` + `year` | Entire meta `<ul>` not rendered |
| `feature` variant + any meta | Meta row never rendered (matches source DNA) |
| `featured` | No featured treatment |
| `href` / `getHref` / `project.href` | All three undefined ⇒ link falls to `'#'` |

## Performance notes

- Component is wrapped in `React.memo` at export. Pass stable `project` references from your data layer to keep memo effective.
- `<img>` uses `loading="lazy"` by default — override via the `loading` prop for above-fold cards.
- `PROJECT_STATUS_CONFIG` has zero React imports — safe in Server Components.
- No `useEffect`, no `useState`, no `setInterval`, no internal subscriptions. Pure render-from-props.

## Accessibility

- The wrapping link uses `aria-labelledby` pointing to the `useId()`-generated `<h3>` id. The link's accessible name is the title — not a flattened blob of all card text.
- Override the link's accessible name explicitly via `ariaLabel` when needed.
- Status differentiated by **color AND text label** (label is always rendered, never icon-only). Color-blind safe.
- All hover transforms / opacity transitions gated via `motion-safe:`. Reduced-motion users see static cards.
- Featured projects render a `<Star>` icon prefix on the title (`aria-hidden`) plus a `<span className="sr-only">` announcement.
- `ArrowRight` on the grid hover-CTA is mirrored via `rtl:rotate-180` for right-to-left locales.

## Cross-references

- **Sibling cards in the registry:**
  - [`event-card-01`](../../../src/registry/components/data/event-card-01/) — events with time-window state machine + capacity bar
  - [`content-card-news-01`](../../../src/registry/components/data/content-card-news-01/) — editorial content cards (5 variants, `--font-serif` titles)
- **Compose with:**
  - [`page-hero-news-01`](../../../src/registry/components/marketing/page-hero-news-01/) — page hero band
  - [`filter-bar-01`](../../../src/registry/components/forms/filter-bar-01/) — category-pill filter row
  - [`grid-layout-news-01`](../../../src/registry/components/layout/grid-layout-news-01/) — magazine grid + infinite scroll + `useMagazineFilter`
- **Future siblings (deferred):**
  - `bento-grid-01` (layout, generic) — the `getLgPattern`/`getMdPattern` 5-rhythm kernel from kasder's `BusinessProjectsSection`
  - `project-detail-dialog-01` (data) — sequential prev/next viewer composing `info-list-01` + `expandable-text-01` + `media-carousel-01` + `engagement-bar-01`
- **Migration source:** [`docs/migrations/project-card-01/`](../../migrations/project-card-01/)
