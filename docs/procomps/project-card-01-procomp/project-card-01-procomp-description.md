# project-card-01 — procomp description

> Stage 1: what & why. The "should we build this at all?" doc.
>
> **Migration origin:** [`docs/migrations/project-card-01/`](../../migrations/project-card-01/) (kasder `kas-social-front-v0` `ProjectCard.tsx` + `BusinessProjectsSection.tsx`)
>
> **Locked-in intake decisions:** [`source-notes.md` § Locked-in decisions](../../migrations/project-card-01/source-notes.md#locked-in-decisions-signed-off-2026-05-03). Extraction analysis: [`analysis.md`](../../migrations/project-card-01/analysis.md).
>
> Family: completes the **portfolio / case-study card pattern** alongside `content-card-news-01` (editorial) and `event-card-01` (registrations). Designed to compose with `page-hero-news-01` + `filter-bar-01` + `grid-layout-news-01` for the public-page assembly, and with the future `bento-grid-01` (deferred) for embedded mosaic widgets. Future siblings — `bento-grid-01` (layout, generic), `project-detail-dialog-01` (data, sequential viewer composing `info-list-01` + `expandable-text-01` + `media-carousel-01` + `engagement-bar-01`).

## Problem

Portfolio / case-study / completed-projects pages need to surface **what was built, where, when, and what stage it's at** in a card that doubles as both a magazine-style listing item AND an embedded mosaic tile inside a denser widget (a business profile, a partner page, a "selected works" sidebar). The two contexts have genuinely different visual needs — a vertical promotional card with hover-reveal CTA on a public listing page reads as "browse our work," while a full-bleed image-as-background tile inside a bento mosaic on a profile page reads as "here's a peek, click to see more." The kasder source proves this — same `Project` data, two completely different visual treatments.

Building these ad-hoc per project means duplicating the status-color map, drifting visually between the two contexts (the kasder source already has a typo: `planned` vs. `upcoming` in two places that should agree), and re-solving polymorphic-link / overlay-link a11y / image-fallback / lazy-loading every time. And — unlike events — projects don't have a time-window kernel; status is editorial. So the card's logic is genuinely simpler than `event-card-01`'s, and the two contexts collapse to a single component with a `variant` prop.

Pro-ui has no existing answer here. `content-card-news-01` is editorial-toned (read-link, author + read-time, no status). `event-card-01` carries time-window state machines + capacity bars projects don't need. Nothing in the registry renders a project / case-study / portfolio item with status-aware visuals in two calibrated layouts driven by a single prop.

## In scope

- **2 visual variants** dispatched via a single `variant` prop:
  - `grid` — vertical image-on-top, content-below, hover-reveal "View details" CTA, hover-lift + shadow upgrade. For 1/2/3-column responsive listings (use [`grid-layout-news-01`](../../../src/registry/components/layout/grid-layout-news-01/)).
  - `feature` — full-bleed image background, content overlaid white-on-dark, no hover-CTA. For embedded mosaic tiles inside a sized container (the future `bento-grid-01`, or any consumer-driven `lg:col-span-X lg:row-span-Y` layout).
- **3-state editorial status set** — `completed` / `ongoing` / `planned`. Not derived from a clock — set on the data object by an editor. Each status drives a color (`bg-primary` lime / `bg-chart-3` teal / `bg-muted` neutral) and a label (`labels` overridable).
- **Public status kernel** — `PROJECT_STATUS_CONFIG` constant map exported alongside `ProjectCard01`. Consumers can read the same color / label / icon map for filter rows, status legends, sidebars, count summaries — without rendering the card.
- **Dynamic content** — every consumer-visible string, color, link, behavior is overridable: `labels` object (5 keys), `categoryStyles` map (per-category className + icon override), `linkComponent` polymorphism, `getHref` callback, `actions` slot, `featured` flag.
- **Polymorphic root** — works with plain `<a>`, Next.js `Link`, Remix `Link`, react-router `Link`, or no link wrapper.
- **Overlay-link pattern from day 1** — clickable whole-card surface that doesn't lock out nested interactives (bookmark, share, save-to-favorites, external-link). Same pattern as `event-card-01` + `content-card-news-01`.
- **Optional `actions` slot** for those nested interactives, with category-pill yield-positioning when actions are supplied (pill moves to bottom-right; actions take top-right).
- **Content-shape soft-failure** — only `id` + `title` + `category` + `image` + `description` + `status` are required; `location` / `year` / `imageAlt` / `featured` / `href` all optional and gracefully omitted. **Meta row (Location + Year) is rendered ONLY on `grid` and ONLY when at least one is present** — `feature` variant never renders meta (matches the source's bento DNA).
- **Image fallback** — when `image` is empty / falsy, renders a tinted `bg-muted` block with a centered `Building2` icon. No broken-image icons. `loading="lazy"` on `<img>`.
- **Featured treatment** — `featured: true` adds `border-t-4 border-primary` (grid) / `ring-2 ring-primary ring-inset` (feature) + a `<Star>` icon prefix on the `<h3>` with screen-reader-only `featuredAriaLabel`.
- **No new design-system tokens** — uses existing `--primary` / `--accent` / `--muted` only. Differs from `event-card-01` migration which added `--warning`.
- **No new shadcn primitives** — uses existing `badge` / `button`. Differs from `event-card-01` which added `progress`.
- **No new peer deps** — `framer-motion` from the source is dropped (card-level reveal is layout-orchestrated). Card is a pure-React leaf.
- **WCAG 2.1 AA target** — accessible-name via `aria-labelledby` + `useId`, status text labels ALWAYS present (color + text differentiation), `motion-safe:` gating on transforms / hover effects, `<ul role="list">` for the meta row, focus-visible ring on the full card, `rtl:rotate-180` on the directional arrow icon.

## Out of scope

- **Layout orchestration** — composing cards into grids, bento mosaics, infinite scroll, search/filter. Defer to existing [`grid-layout-news-01`](../../../src/registry/components/layout/grid-layout-news-01/) (public-page assembly) + future `bento-grid-01` (embedded-widget mosaic, deferred to its own greenfield procomp gate since it's generic — not project-specific).
- **Detail dialog / sequential viewer** — the prev/next chevron modal with goals + gallery + external-link from `BusinessProjectsSection`. Defer to future `project-detail-dialog-01` (data, deferred). It composes 4 already-shipped pro-comps + a `story-viewer-01`-style prev/next state machine.
- **Live status logic** — projects don't have a time-window kernel. Status is editorial; no `now?: Date` injection, no `getProjectStatus(project, now)` helper. If a consumer wants to flip status based on dates, they do it at the data layer.
- **Year parsing / formatting** — `year` is a free-form `string` (`"2023"` / `"Q4 2023"` / `"2023–2025"` ranges). No `Intl` calls, no callback. The flexibility IS the contract.
- **Public projects page orchestrator** — composed by consumer from existing `page-hero-news-01` + `filter-bar-01` + `grid-layout-news-01` + this component. Registry doesn't ship "page templates."
- **Featured layout treatment** — bigger card, separate slot above the grid (mirrors `content-card-news-01`'s `featuredItem` + `renderFeatured` integration with `grid-layout-news-01`). The card flag is set; the layout-level treatment is the consumer's choice.
- **`compact` / `list` / `inline` variants** beyond grid + feature — revisit when a real consumer surfaces. Two variants matches the source's actual usage exactly.
- **Loading skeletons** — pure presentation. Consumers handle data-loading states.
- **CDN-aware image components** (`next/image` etc.) — consumer wraps via the polymorphic-img path or `<Image>` slot if/when needed.
- **Heavy animation** — Tailwind transitions + `motion-safe:` only. No `framer-motion`.

## Target consumers

- Civil-society / association sites listing completed and in-progress projects (the kasder use case driving the migration — urban renewal, disaster management, sustainable development)
- Architecture / engineering / construction firm portfolios — completed builds, ongoing commissions, planned projects
- Agency / consultancy "selected work" sections — case studies with status (live / in-development / concept)
- B2B SaaS landing pages with "customer success stories" or "implementation" listings
- Internal company portals listing initiatives, programs, or strategic projects
- Mixed-content feeds where projects appear alongside news + events (the `feature` variant is built for this)

The consumer is a **frontend dev composing a portfolio page or business-profile widget**, not an end user. They'll typically reach for this when they have an array of projects and need the same item rendered as a magazine card on a listings page AND a full-bleed mosaic tile inside a profile widget, sharing all status logic + a11y + i18n.

## Rough API sketch

```ts
<ProjectCard01
  project={{
    id: 'fikirtepe-renewal',
    title: 'Fikirtepe Urban Renewal',
    category: 'Urban Renewal',
    location: 'Istanbul, Kadıköy',     // optional
    year: '2023',                       // optional, free-form string
    image: '/img.jpg',
    imageAlt: 'Aerial view of completed renewal blocks',  // optional, falls back to title
    description: 'One of the largest urban renewal projects…',
    status: 'ongoing',
    featured: false,                    // optional
    href: '/projects/fikirtepe-renewal' // optional — overridden by `href`/`getHref` on the card
  }}
  variant="grid"                        // 'grid' | 'feature'
  href="/projects/fikirtepe-renewal"
  linkComponent={Link}
  categoryStyles={{
    // SOLID backgrounds for over-image legibility — light tints (bg-X/15 text-X)
    // read poorly over photographic content. Solid colors with text-white (or
    // text-{token}-foreground for amber) preserve brand identity AND contrast.
    'Urban Renewal':  { className: 'bg-primary/90 text-primary-foreground', icon: BuildingIcon },
    'Disaster Mgmt':  { className: 'bg-warning/90 text-warning-foreground', icon: ShieldIcon },
    // open map — consumers add as many keys as their data has
  }}
  labels={{
    completed: 'Tamamlandı',
    ongoing:   'Devam Ediyor',
    planned:   'Planlanan',
    viewDetails: 'Detayları Gör',
    featuredAriaLabel: 'Öne çıkan proje',
  }}
  actions={
    <div className="flex gap-1.5">
      <BookmarkButton project={project} />
      <ShareButton project={project} />
    </div>
  }
  // optional escape hatches
  getHref={(project) => `/portfolio/${project.id}`}  // alternative to href
/>
```

5 props are most-used: `project`, `variant`, `href`, `linkComponent`, `actions`. The rest are escape hatches for i18n (`labels`), per-category theming (`categoryStyles`), and dynamic-routing (`getHref`).

## Public exports (the kernel)

These are exported alongside `ProjectCard01` from the package — consumers can use them WITHOUT rendering the card:

```ts
import {
  ProjectCard01,
  PROJECT_STATUS_CONFIG,    // Record<ProjectStatus, { label: string; className: string }>
  type ProjectStatus,        // 'completed' | 'ongoing' | 'planned'
  type ProjectCardItem,
  type ProjectCard01Labels,
  type ProjectCard01Variant, // 'grid' | 'feature'
} from '@ilinxa/project-card-01';

// Use the kernel without the card:
const completedCount = projects.filter((p) => p.status === 'completed').length;
const statusBadgeClass = (s: ProjectStatus) => PROJECT_STATUS_CONFIG[s].className;
```

The kernel is **smaller than event-card-01's** because there are no derivation helpers — status is editorial, and `year` is a free-form string. `PROJECT_STATUS_CONFIG` + the 4 types are the entire public surface beyond the component itself. Smaller surface = smaller breaking-change footprint long-term.

## Example usages

**1. Public projects page — the canonical kasder use case:**

```tsx
import { PageHeroNews01 } from '@ilinxa/page-hero-news-01';
import { FilterBar01 } from '@ilinxa/filter-bar-01';
import { GridLayoutNews01, useMagazineFilter } from '@ilinxa/grid-layout-news-01';
import { ProjectCard01 } from '@ilinxa/project-card-01';
import NextLink from 'next/link';
import { Building2 } from 'lucide-react';

export default function ProjectsPage() {
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
          categories={['All', 'Urban Renewal', 'Disaster Mgmt', 'Sustainable Dev']}
          category={category}
          onCategoryChange={setCategory}
          hideSearch
          hideDateRange
          labels={{ allLabel: 'All' }}
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

Zero new code for the page — just composition of already-shipped pro-comps + this card.

**2. Business profile mosaic — the BusinessProjectsSection use case (uses inline bento until `bento-grid-01` ships):**

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
          i === 0 ? 'lg:col-span-2 lg:row-span-1' : 'lg:col-span-1 lg:row-span-1'
        }
      />
    ))}
  </div>
</section>
```

When `bento-grid-01` ships, the `className` props become unnecessary — the layout drives sizing.

**3. Card with bookmark + share actions** (overlay-link pattern):

```tsx
<ProjectCard01
  project={project}
  variant="grid"
  href={`/projects/${project.id}`}
  linkComponent={NextLink}
  actions={
    <div className="flex gap-1.5">
      <button onClick={() => toggleBookmark(project.id)} aria-label="Bookmark">
        <Bookmark className="h-4 w-4" />
      </button>
      <button onClick={() => share(project)} aria-label="Share">
        <Share2 className="h-4 w-4" />
      </button>
    </div>
  }
/>
```

The `actions` cluster sits at `relative z-10` over the link overlay — clicking a button does NOT navigate; the rest of the card surface still does. When `actions` is present, the category pill yields its top-right slot to actions and moves to bottom-right.

**4. Status-count summary using only the kernel, no card render:**

```tsx
import { PROJECT_STATUS_CONFIG, type ProjectStatus } from '@ilinxa/project-card-01';

function StatusSummary({ projects }: { projects: ProjectCardItem[] }) {
  const counts = projects.reduce<Record<ProjectStatus, number>>(
    (acc, p) => ({ ...acc, [p.status]: (acc[p.status] ?? 0) + 1 }),
    { completed: 0, ongoing: 0, planned: 0 },
  );
  return (
    <div className="flex gap-3">
      {(Object.keys(counts) as ProjectStatus[]).map((s) => (
        <span key={s} className={`px-2 py-0.5 rounded-full text-xs ${PROJECT_STATUS_CONFIG[s].className}`}>
          {PROJECT_STATUS_CONFIG[s].label}: {counts[s]}
        </span>
      ))}
    </div>
  );
}
```

Pure-helper composition, zero card render, zero React tree dependency.

**5. Custom routing via `getHref` (e.g. portfolio app where IDs aren't slugs):**

```tsx
<ProjectCard01
  project={project}
  variant="grid"
  getHref={(p) => `/portfolio/${p.category.toLowerCase().replace(/\s+/g, '-')}/${p.id}`}
  linkComponent={NextLink}
/>
```

`getHref` takes precedence over `href` over `project.href` — three layers of customization.

## Success criteria

- Both variants render correctly: `grid` in 1/2/3-column responsive grids; `feature` in any sized parent (consumer-driven `lg:col-span-X lg:row-span-Y` or a future `bento-grid-01`).
- All 3 statuses render with the locked-in tokens (`bg-primary` lime / `bg-chart-3` teal / `bg-muted` neutral) — no raw hex / Tailwind palette colors. (`bg-chart-3` for `ongoing` replaces the originally-proposed `bg-accent`, which renders invisibly in pro-ui's neutral preset where `--accent` is a near-white surface token.)
- Whole card is clickable AND nested `actions` are independently clickable (overlay-link pattern works in both variants).
- Whole card receives focus-visible ring (not just the invisible link rectangle) — screen reader announces the title as the link's name.
- Card omits gracefully when `location` / `year` / `imageAlt` / `featured` / `href` are missing.
- Card with no `image` (or empty string) renders a tinted `bg-muted` placeholder with a centered `Building2` icon — never a broken-image icon.
- Category pill yields top-right slot to `actions` when supplied; reverts when not. Tested in both variants.
- Featured treatment — top accent border (grid) / inset ring (feature) + star prefix on title — works in both variants without conflict.
- Hover-reveal "View details" CTA appears on `grid` only; never on `feature` (matches source DNA).
- Image gradient is primary-tinted on `grid` (promotional tone), neutral-darken on `feature` (mosaic tone). Confirmed by visual diff of demo tabs.
- TypeScript: prop types are strict; `ProjectCardItem` shape is enforced; `variant` is a literal union; `ProjectStatus` is exported as a re-usable union.
- Public exports (`PROJECT_STATUS_CONFIG`, types) are pure and tree-shakeable (no React imports, no DOM access).
- `pnpm tsc --noEmit` + `pnpm lint` + `pnpm build` clean.
- SSR `/components/project-card-01` returns 200 with all 5 demo tabs rendered.
- No new design-system tokens added (verified by `git diff src/app/globals.css` showing zero changes).
- No new shadcn primitives installed (verified by `git diff src/components/ui/` showing zero new files).

## Open questions

1. **Component export name.** `ProjectCard01` — matches the `<Slug><NN>` convention already established by `EventCard01`, `ContentCardNews01`, etc. **Resolved:** `ProjectCard01`.
2. **Status union — `planned` vs. `upcoming`.** Source has both (typo drift). **Resolved (intake):** `planned` — matches the larger fixture and reads more concrete. `upcoming` is dropped.
3. **`year` field shape — `string` vs. `number`.** **Resolved:** `string` — handles `"2023"` / `"Q4 2023"` / `"2023–2025"` ranges with one type. No `Intl` work.
4. **`image` field required vs. optional.** **Resolved:** required `string` (can be empty), with image-fallback rendering when empty. Forcing the field surfaced makes consumers think about images explicitly; the fallback handles the empty case without a TypeScript "?" complicating the type.
5. **Title font — sans or serif?** **Resolved:** sans (default `--font-sans`, Onest). Projects feel like utility/portfolio surfaces, not editorial features. Differs from `content-card-news-01` (which uses `--font-serif`), matches `event-card-01`.
6. **`feature` variant featured treatment** — `border-t-4` doesn't work on the full-bleed image. **Resolved (analysis):** `ring-2 ring-primary ring-inset`. Visible against image, no layout shift, mirrors `event-card-01`'s feed-variant treatment.
7. **`actions` slot positioning per variant.** Grid: top-right of image area when supplied (pushes category pill to bottom-right). Feature: top-right of content overlay area (pushes category pill to bottom-right). **Resolved:** documented; visual contract preserved per `event-card-01` precedent.
8. **`feature` variant sizing contract.** The card uses `absolute inset-0` for its image AND requires a sized parent (consumer's layout container OR future `bento-grid-01`). Card does NOT impose a default aspect ratio on `feature`. **Resolved:** documented in usage.tsx; demo tab #2 demonstrates inline bento patterns until `bento-grid-01` ships.
9. **`Building2` as default category icon.** Source always renders it regardless of category. **Resolved:** always render as fallback UNLESS `categoryStyles[project.category]?.icon` provided (which then overrides). Matches source behavior; opens the customization door.
10. **`href` precedence chain.** Three layers: `getHref(project)` overrides `href` overrides `project.href`. **Resolved:** documented; `getHref` is for dynamic routing (e.g. category-prefixed routes), `href` is for single-card use, `project.href` is for data-driven routing.
11. **Image rendering — `<img>` or `bg-image`?** Source uses both (public uses `<img>`, BusinessProjectsSection uses `style={{ backgroundImage }}`). **Resolved:** `<img>` in both variants — `loading="lazy"` works, `alt` works, image-loading errors fire (so the fallback can be triggered via state, future enhancement). `feature` uses `<img className="absolute inset-0 w-full h-full object-cover">` to mimic the bg-image effect without losing semantic image.
12. **Loading skeleton.** Should the card ship a `<ProjectCard01.Skeleton variant="grid" />`? **Open** — v0.1 ships without; consumers render a `bg-muted` placeholder. v0.2 candidate if real demand surfaces.

---

**Stage 1 contract:** if you sign off on the above, the plan doc (`project-card-01-procomp-plan.md`) will lock down: file shape, type definitions, prop/state/effect/render flow per variant, status-config map, demo plan (5 tabs), success-gate verification steps, and known plan deviations to flag during implementation.
