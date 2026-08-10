import { Suspense } from "react";

import { ORDERED_CATEGORIES } from "@/registry/categories";
import { getMetaList } from "@/registry/manifest";
import type { ComponentMeta } from "@/registry/types";

import { ComponentCard } from "./_components/component-card";
import { ComponentsExplorer } from "./_components/components-explorer";
import { deriveFacets } from "./_components/filter-utils";

export default function ComponentsIndexPage() {
  const entries = getMetaList();
  const facets = deriveFacets(entries);

  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-12">
      <header className="mb-10 flex flex-col gap-3">
        <p className="text-sm font-medium text-muted-foreground">
          ilinxa-ui-pro
        </p>
        <h1 className="text-4xl font-semibold tracking-tight text-foreground">
          Components
        </h1>
        <p className="max-w-2xl text-base text-muted-foreground">
          High-level, fully-composed components built on top of shadcn/ui and
          Tailwind. Each one is standalone, dynamic, and follows the shadcn
          customization model.
        </p>
      </header>

      <Suspense fallback={<StaticCatalog entries={entries} />}>
        <ComponentsExplorer entries={entries} facets={facets} />
      </Suspense>
    </div>
  );
}

/**
 * Server-rendered full catalog. The explorer reads useSearchParams, so static
 * prerender emits this fallback — rendering the real grid here (instead of
 * skeletons) puts every component name + link in the HTML for crawlers and
 * no-JS agents. The interactive explorer replaces it identically on hydration.
 */
function StaticCatalog({ entries }: { entries: ComponentMeta[] }) {
  const grouped = ORDERED_CATEGORIES.map((category) => ({
    category,
    list: entries.filter((m) => m.category === category.slug),
  })).filter((g) => g.list.length > 0);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3 text-sm text-muted-foreground">
        <span>
          {entries.length} component{entries.length === 1 ? "" : "s"}
        </span>
        <span aria-hidden>·</span>
        <span>
          {grouped.length} categor{grouped.length === 1 ? "y" : "ies"}
        </span>
      </div>
      <div className="flex flex-col gap-12">
        {grouped.map(({ category, list }) => (
          <section key={category.slug}>
            <div className="mb-4 flex items-baseline justify-between">
              <div className="flex flex-col gap-1">
                <h2 className="text-xl font-semibold tracking-tight text-foreground">
                  {category.label}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {category.description}
                </p>
              </div>
              <span className="text-xs uppercase tracking-wide text-muted-foreground">
                {list.length} item{list.length === 1 ? "" : "s"}
              </span>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {list.map((meta) => (
                <ComponentCard key={meta.slug} meta={meta} />
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
