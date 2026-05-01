export default function GridLayoutNews01Usage() {
  return (
    <div className="max-w-none text-sm leading-relaxed text-foreground">
      <h3 className="mb-2 mt-0 text-base font-semibold">When to use</h3>
      <p className="text-muted-foreground">
        Reach for <code>GridLayoutNews01</code> when you need a magazine-
        style layout: optional hero band, optional filter row, descending-
        density card tower in a main column, optional sticky sidebar,
        infinite scroll. The layout is generic over your item type and
        slot-based — bring your own cards, hero, filter bar, sidebar.
      </p>

      <h3 className="mb-2 mt-6 text-base font-semibold">Minimal example</h3>
      <pre className="overflow-x-auto rounded-md border border-border bg-muted p-4 font-mono text-xs">
        <code>{`import { GridLayoutNews01 } from "@/registry/components/layout/grid-layout-news-01";

<GridLayoutNews01<Article>
  displayedItems={articles}
  renderItem={(article, slot) => (
    <ArticleCard article={article} variant={slot} />
  )}
/>;`}</code>
      </pre>
      <p className="mt-2 text-muted-foreground">
        <code>slot</code> is either <code>&quot;large&quot;</code> (lead
        article) or <code>&quot;medium&quot;</code> (the rest of the tower).
        Your renderer maps slot to a card variant.
      </p>

      <h3 className="mb-2 mt-6 text-base font-semibold">
        Full magazine composition (the canonical use case)
      </h3>
      <p className="text-muted-foreground">
        Combines all four sibling components from the news family. The
        layout itself imports nothing from them — composition happens at
        the consumer level.
      </p>
      <pre className="overflow-x-auto rounded-md border border-border bg-muted p-4 font-mono text-xs">
        <code>{`import { GridLayoutNews01, useMagazineFilter } from "@/registry/components/layout/grid-layout-news-01";
import { ContentCardNews01 } from "@/registry/components/data/content-card-news-01";
import { FilterBar01 } from "@/registry/components/forms/filter-bar-01";
import { CategoryCloud01 } from "@/registry/components/forms/category-cloud-01";
import { NewsletterCard01 } from "@/registry/components/marketing/newsletter-card-01";
import { PageHeroNews01 } from "@/registry/components/marketing/page-hero-news-01";

const filtered = useMagazineFilter<Article>({
  items: articles,
  pageSize: 6,
  isFeatured: (a) => a.featured,
  filterPredicate: (a) => a.title.includes(search) && (cat ? a.category === cat : true),
  sortComparator: (a, b) => +new Date(b.date) - +new Date(a.date),
});

<GridLayoutNews01<Article>
  hero={<PageHeroNews01 badge="News" title="Latest Stories" description="..." />}
  filterBar={<FilterBar01 categories={categories} onChange={...} />}
  sidebar={
    <>
      <CategoryCloud01 items={categories} value={cat} onChange={setCat} title="Categories" />
      <NewsletterCard01 onSubmit={subscribe} />
    </>
  }
  displayedItems={filtered.displayedItems}
  featuredItem={filtered.featuredItem}
  hasMore={filtered.hasMore}
  isLoading={filtered.isLoading}
  onLoadMore={filtered.loadMore}
  renderItem={(article, slot) => (
    <ContentCardNews01 item={article} variant={slot} href={\`/news/\${article.id}\`} />
  )}
/>;`}</code>
      </pre>

      <h3 className="mb-2 mt-6 text-base font-semibold">Companion hook: useMagazineFilter</h3>
      <p className="text-muted-foreground">
        For consumers who don&apos;t need server-driven filtering / pagination,{" "}
        <code>useMagazineFilter</code> derives all the props the layout
        expects from your full <code>items</code> array + filter / sort /
        feature predicates.
      </p>
      <pre className="overflow-x-auto rounded-md border border-border bg-muted p-4 font-mono text-xs">
        <code>{`const {
  displayedItems,
  featuredItem,
  hasMore,
  isLoading,
  filteredCount,
  loadMore,
  reset,
} = useMagazineFilter<Article>({
  items,
  pageSize: 6,
  isFeatured: (a) => a.featured,
  filterPredicate: (a) => /* filter */,
  sortComparator: (a, b) => /* sort */,
  simulatedLoadingMs: 500, // optional artificial delay for demos
});`}</code>
      </pre>

      <h3 className="mb-2 mt-6 text-base font-semibold">Slot-only patterns</h3>
      <ul className="ml-5 list-disc space-y-1 text-muted-foreground">
        <li>
          Omit <code>sidebar</code> — main column expands to full width.
        </li>
        <li>
          Omit <code>hero</code> and <code>filterBar</code> — bare layout for
          documentation indexes or simple lists.
        </li>
        <li>
          Provide <code>emptyState</code> for a custom empty fallback;
          otherwise the default <code>labels.emptyStateText</code> renders.
        </li>
        <li>
          Use <code>renderFeatured</code> for a different visual on the
          featured item (e.g., a hero card variant) vs. the in-tower large.
        </li>
      </ul>

      <h3 className="mb-2 mt-6 text-base font-semibold">Server-driven filtering / pagination</h3>
      <p className="text-muted-foreground">
        Skip the companion hook. Drive <code>displayedItems</code> /{" "}
        <code>hasMore</code> / <code>isLoading</code> /{" "}
        <code>onLoadMore</code> from your data layer (React Query,
        Tanstack Router, etc.) directly:
      </p>
      <pre className="overflow-x-auto rounded-md border border-border bg-muted p-4 font-mono text-xs">
        <code>{`const { data, fetchNextPage, hasNextPage, isFetching } = useInfiniteQuery(...);

<GridLayoutNews01
  displayedItems={data?.pages.flatMap(p => p.items) ?? []}
  hasMore={!!hasNextPage}
  isLoading={isFetching}
  onLoadMore={() => fetchNextPage()}
  renderItem={...}
/>;`}</code>
      </pre>

      <h3 className="mb-2 mt-6 text-base font-semibold">Accessibility</h3>
      <ul className="ml-5 list-disc space-y-1 text-muted-foreground">
        <li>
          Sidebar uses <code>{"<aside>"}</code> for landmark semantics.
        </li>
        <li>
          Loader region has <code>{"aria-live=\"polite\""}</code> with a
          visually-hidden text label.
        </li>
        <li>
          End-of-list announcement also uses{" "}
          <code>{"aria-live=\"polite\""}</code>.
        </li>
        <li>
          Tower is plain CSS grid — natural Tab order through items.
        </li>
      </ul>
    </div>
  );
}
