import { Suspense } from "react";

import { getMetaList } from "@/registry/manifest";

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

      <Suspense fallback={<ExplorerFallback />}>
        <ComponentsExplorer entries={entries} facets={facets} />
      </Suspense>
    </div>
  );
}

function ExplorerFallback() {
  return (
    <div className="flex flex-col gap-6">
      <div className="h-4 w-48 animate-pulse rounded-full bg-muted" />
      <div className="h-10 w-full animate-pulse rounded-md bg-muted" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="h-40 animate-pulse rounded-md border border-border bg-card"
          />
        ))}
      </div>
    </div>
  );
}
