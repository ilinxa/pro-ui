export default function ProjectCard01Usage() {
  return (
    <div className="max-w-none text-sm leading-relaxed text-foreground">
      <h3 className="mb-2 mt-0 text-base font-semibold">When to use</h3>
      <p className="text-muted-foreground">
        Reach for <code>ProjectCard01</code> when you need a project /
        case-study / portfolio preview with a 3-state editorial status
        (completed / in-progress / planned). Two layouts:{" "}
        <code>variant=&quot;grid&quot;</code> (vertical image-on-top with a
        hover-reveal &quot;View details&quot; CTA) and{" "}
        <code>variant=&quot;feature&quot;</code> (full-bleed image background,
        white-on-dark text, designed for embedded mosaic widgets).
      </p>

      <h3 className="mb-2 mt-6 text-base font-semibold">Minimal example</h3>
      <pre className="overflow-x-auto rounded-md border border-border bg-muted p-4 font-mono text-xs">
        <code>{`import { ProjectCard01 } from "@/registry/components/data/project-card-01";

<ProjectCard01
  project={{
    id: "fikirtepe-renewal",
    title: "Fikirtepe Urban Renewal",
    category: "Urban Renewal",
    location: "Istanbul, Kadıköy",
    year: "2023",
    image: "/cover.jpg",
    description: "15,000 housing units modernised across the district.",
    status: "ongoing",
  }}
  variant="grid"
  href="/projects/fikirtepe-renewal"
/>;`}</code>
      </pre>

      <h3 className="mb-2 mt-6 text-base font-semibold">Two variants</h3>
      <ul className="ml-5 list-disc space-y-1 text-muted-foreground">
        <li>
          <code>grid</code> — vertical image-on-top with status pill (top-left),
          category pill (top-right), primary-tinted gradient overlay,
          hover-reveal &quot;View details&quot; CTA, lift-on-hover. Renders well
          in 1/2/3-column responsive grids — pair with{" "}
          <code>grid-layout-news-01</code>.
        </li>
        <li>
          <code>feature</code> — full-bleed image background, white-on-dark
          content overlaid at the bottom (title + 2-line description). Status
          pill top-right, category top-left. NO meta row, NO hover-CTA — denser
          and quieter than <code>grid</code>. Designed for embedded widgets
          inside <code>bento-grid-01</code> (deferred) or any consumer-driven
          sized parent.
        </li>
      </ul>

      <h3 className="mb-2 mt-6 text-base font-semibold">
        Three statuses (editorial — not derived)
      </h3>
      <p className="text-muted-foreground">
        Status is set on the data object by an editor. The card does NOT derive
        status from a date or completion-percentage — projects don&apos;t have a
        time-window kernel. The status drives the pill color + label via{" "}
        <code>PROJECT_STATUS_CONFIG</code>:
      </p>
      <ul className="ml-5 list-disc space-y-1 text-muted-foreground">
        <li>
          <code>completed</code> — primary lime pill. Project is done; reads
          celebratory.
        </li>
        <li>
          <code>ongoing</code> — chart-3 teal pill. Project is currently
          active. (Originally proposed <code>bg-accent</code> but pro-ui&apos;s{" "}
          <code>--accent</code> is a near-white surface token, not a brand
          color — teal is the readable middle ground.)
        </li>
        <li>
          <code>planned</code> — muted-grey pill with subtle border. Project
          is scheduled but not yet started; reads quiet, not attention-grabbing.
        </li>
      </ul>

      <h3 className="mb-2 mt-6 text-base font-semibold">
        Public helper kernel (without rendering the card)
      </h3>
      <p className="text-muted-foreground">
        <code>PROJECT_STATUS_CONFIG</code> + <code>ProjectStatus</code> are
        exported alongside the card. Consumers can read the same color / label
        map for status legends, filter rows, count summaries — without rendering
        a card. Pure data, server-component-importable, tree-shakeable.
      </p>
      <pre className="overflow-x-auto rounded-md border border-border bg-muted p-4 font-mono text-xs">
        <code>{`import {
  PROJECT_STATUS_CONFIG,
  type ProjectStatus,
} from "@/registry/components/data/project-card-01";

function StatusSummary({ projects }: { projects: { status: ProjectStatus }[] }) {
  const counts = projects.reduce<Record<ProjectStatus, number>>(
    (acc, p) => ({ ...acc, [p.status]: (acc[p.status] ?? 0) + 1 }),
    { completed: 0, ongoing: 0, planned: 0 },
  );
  return (
    <div className="flex gap-3">
      {(Object.keys(counts) as ProjectStatus[]).map((s) => (
        <span key={s} className={\`px-2 py-0.5 rounded-full text-xs \${PROJECT_STATUS_CONFIG[s].className}\`}>
          {PROJECT_STATUS_CONFIG[s].label}: {counts[s]}
        </span>
      ))}
    </div>
  );
}`}</code>
      </pre>

      <h3 className="mb-2 mt-6 text-base font-semibold">
        Polymorphic linking (NextLink, RemixLink, react-router Link)
      </h3>
      <p className="text-muted-foreground">
        Pass <code>linkComponent</code> to swap the underlying anchor:
      </p>
      <pre className="overflow-x-auto rounded-md border border-border bg-muted p-4 font-mono text-xs">
        <code>{`import NextLink from "next/link";
import { ProjectCard01 } from "@/registry/components/data/project-card-01";

<ProjectCard01
  project={project}
  variant="grid"
  href={\`/projects/\${project.id}\`}
  linkComponent={NextLink}
/>;`}</code>
      </pre>
      <p className="text-muted-foreground mt-2">
        href precedence: <code>getHref(project)</code> wins over{" "}
        <code>href</code> wins over <code>project.href</code> wins over{" "}
        <code>&quot;#&quot;</code> fallback.
      </p>

      <h3 className="mb-2 mt-6 text-base font-semibold">
        Per-category theming (categoryStyles)
      </h3>
      <p className="text-muted-foreground">
        Default behavior renders a universal <code>Building2</code> icon + a
        white-translucent chip on top of the image. Override per-category via
        the <code>categoryStyles</code> map (default: empty). Each entry can
        provide a className, an icon, or both:
      </p>
      <pre className="overflow-x-auto rounded-md border border-border bg-muted p-4 font-mono text-xs">
        <code>{`import { Trees, Shield } from "lucide-react";

<ProjectCard01
  project={project}
  variant="grid"
  href={\`/projects/\${project.id}\`}
  // Solid backgrounds (90% opacity) for over-image legibility — light tints
  // (bg-X/15 text-X) read poorly over photographic content. Use solid fills with
  // text-white or text-{token}-foreground.
  categoryStyles={{
    "Sustainable Development": {
      className: "bg-chart-3/90 text-white",
      icon: Trees,
    },
    "Disaster Management": {
      className: "bg-warning/90 text-warning-foreground",
      icon: Shield,
    },
  }}
/>;`}</code>
      </pre>

      <h3 className="mb-2 mt-6 text-base font-semibold">
        Internationalization (labels)
      </h3>
      <p className="text-muted-foreground">
        Pass a partial <code>labels</code> object — only the keys you want to
        override:
      </p>
      <pre className="overflow-x-auto rounded-md border border-border bg-muted p-4 font-mono text-xs">
        <code>{`<ProjectCard01
  project={project}
  variant="grid"
  href={\`/projects/\${project.id}\`}
  labels={{
    completed: "Tamamlandı",
    ongoing: "Devam Ediyor",
    planned: "Planlanan",
    viewDetails: "Detayları Gör",
    featuredAriaLabel: "Öne çıkan proje",
  }}
/>;`}</code>
      </pre>

      <h3 className="mb-2 mt-6 text-base font-semibold">
        Actions slot (overlay-link pattern)
      </h3>
      <p className="text-muted-foreground">
        Drop interactive children into <code>actions</code> — they sit at{" "}
        <code>z-10</code> over the link overlay. When supplied, the category
        pill yields its top-right slot to actions and moves to bottom-right
        (grid) OR the status pill yields and stacks under the category pill at
        top-left (feature). Each nested button MUST call{" "}
        <code>e.stopPropagation()</code> or the card&apos;s link will fire too.
      </p>
      <pre className="overflow-x-auto rounded-md border border-border bg-muted p-4 font-mono text-xs">
        <code>{`<ProjectCard01
  project={project}
  variant="grid"
  href={\`/projects/\${project.id}\`}
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
/>;`}</code>
      </pre>

      <h3 className="mb-2 mt-6 text-base font-semibold">
        Composing the public projects page (with already-shipped pro-comps)
      </h3>
      <p className="text-muted-foreground">
        The card is a leaf. Compose the full page from already-shipped pro-comps
        — zero new code beyond the data layer:
      </p>
      <pre className="overflow-x-auto rounded-md border border-border bg-muted p-4 font-mono text-xs">
        <code>{`import { useState } from "react";
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
          href={\`/projects/\${project.id}\`}
          linkComponent={NextLink}
        />
      )}
    />
  );
}`}</code>
      </pre>

      <h3 className="mb-2 mt-6 text-base font-semibold">
        <code>feature</code> variant sizing contract
      </h3>
      <p className="text-muted-foreground">
        The <code>feature</code> variant uses <code>absolute inset-0</code> for
        its image and requires a <strong>sized parent</strong> — the card does
        NOT impose a default aspect ratio. Without a sized container, the card
        collapses to zero height. The future <code>bento-grid-01</code> (layout)
        will absorb this responsibility; until then, drive sizing with{" "}
        <code>auto-rows-[180px]</code> on the grid container or pass{" "}
        <code>className=&quot;lg:col-span-2 lg:row-span-1&quot;</code> per card.
      </p>

      <h3 className="mb-2 mt-6 text-base font-semibold">
        Soft-failure on missing fields
      </h3>
      <ul className="ml-5 list-disc space-y-1 text-muted-foreground">
        <li>
          <code>image</code> empty string ⇒ <code>bg-muted</code> placeholder
          with centered <code>Building2</code> icon. No broken-image icon.
        </li>
        <li>
          <code>imageAlt</code> undefined ⇒ falls back to <code>title</code>.
        </li>
        <li>
          <code>location</code> / <code>year</code> undefined ⇒ that meta cell
          omitted (grid). Both undefined ⇒ entire <code>&lt;ul&gt;</code> not
          rendered.
        </li>
        <li>
          <code>feature</code> variant never renders the meta row regardless
          (matches source DNA).
        </li>
        <li>
          No <code>href</code> / <code>getHref</code> / <code>project.href</code>
          {" "}⇒ link falls to <code>&quot;#&quot;</code>.
        </li>
      </ul>

      <h3 className="mb-2 mt-6 text-base font-semibold">Accessibility</h3>
      <ul className="ml-5 list-disc space-y-1 text-muted-foreground">
        <li>
          The wrapping link uses <code>aria-labelledby</code> pointing to the{" "}
          <code>useId()</code>-generated <code>&lt;h3&gt;</code> id. The
          link&apos;s accessible name is the title — not a flattened blob.
        </li>
        <li>
          Override the link&apos;s accessible name explicitly via{" "}
          <code>ariaLabel</code> when needed (e.g. translated titles).
        </li>
        <li>
          Status differentiated by <strong>color AND text</strong> — the label
          is always rendered (not icon-only). Color-blind safe.
        </li>
        <li>
          All hover transforms / opacity transitions gated via{" "}
          <code>motion-safe:</code>. Reduced-motion users see static cards.
        </li>
        <li>
          Featured projects render a <code>&lt;Star&gt;</code> icon prefix on
          the title (<code>aria-hidden</code>) plus an{" "}
          <code>sr-only</code> announcement (
          <code>labels.featuredAriaLabel</code>).
        </li>
        <li>
          <code>ArrowRight</code> on the grid hover-CTA is mirrored via{" "}
          <code>rtl:rotate-180</code> for right-to-left locales.
        </li>
      </ul>

      <h3 className="mb-2 mt-6 text-base font-semibold">Performance</h3>
      <ul className="ml-5 list-disc space-y-1 text-muted-foreground">
        <li>
          Component is wrapped in <code>React.memo</code> at the export. Pass
          stable <code>project</code> references from your data layer to keep
          memo effective.
        </li>
        <li>
          <code>&lt;img&gt;</code> uses <code>loading=&quot;lazy&quot;</code> by
          default — override via the <code>loading</code> prop for above-fold
          cards.
        </li>
        <li>
          The status kernel (<code>PROJECT_STATUS_CONFIG</code>) is pure data
          with zero React imports — safe to import in Server Components.
        </li>
      </ul>
    </div>
  );
}
