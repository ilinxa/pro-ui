"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GridLayoutNews01 } from "./grid-layout-news-01";
import { useMagazineFilter } from "./hooks/use-magazine-filter";
import { DEMO_ARTICLES, type DemoArticle } from "./dummy-data";
import type { GridLayoutItemSlot } from "./types";

/**
 * Demo cards inlined here (rather than importing sibling registry components)
 * to keep the registry's sealed-folder convention. The cards mimic the
 * visual rhythm consumers would compose using content-card-news-01 in real
 * applications.
 */
function DemoCard({
  article,
  slot,
}: {
  article: DemoArticle;
  slot: GridLayoutItemSlot;
}) {
  const isLarge = slot === "large";
  return (
    <article
      className={`group flex h-full flex-col overflow-hidden rounded-2xl border border-border/50 bg-card transition-all duration-300 hover:shadow-xl ${
        isLarge ? "md:flex-row" : ""
      }`}
    >
      <div
        className={`relative bg-linear-to-br from-primary/40 to-accent/40 ${
          isLarge ? "h-48 md:h-auto md:w-1/2" : "h-48"
        }`}
      >
        <div className="absolute left-4 top-4">
          <Badge variant="secondary">{article.category}</Badge>
        </div>
      </div>
      <div className={`flex flex-1 flex-col p-6 ${isLarge ? "md:p-8" : ""}`}>
        <h3
          className={`mb-2 font-bold transition-colors line-clamp-2 group-hover:text-primary ${
            isLarge ? "text-2xl md:text-3xl" : "text-xl"
          }`}
        >
          {article.title}
        </h3>
        <p className="mb-4 flex-1 text-sm text-muted-foreground line-clamp-3">
          {article.excerpt}
        </p>
        <p className="mt-auto pt-4 border-t border-border/50 text-xs text-muted-foreground">
          {article.date}
        </p>
      </div>
    </article>
  );
}

function FeaturedCard({ article }: { article: DemoArticle }) {
  return (
    <article className="group relative h-80 overflow-hidden rounded-2xl bg-linear-to-br from-primary/60 via-primary/40 to-accent/40 md:h-96">
      <div className="absolute inset-0 bg-linear-to-t from-black via-black/50 to-transparent" />
      <div className="absolute inset-0 flex flex-col justify-end p-8 md:p-12">
        <Badge className="mb-4 w-fit bg-black/40 text-white backdrop-blur-sm">
          {article.category}
        </Badge>
        <h2 className="mb-4 text-3xl font-bold leading-tight text-white md:text-4xl lg:text-5xl">
          {article.title}
        </h2>
        <p className="max-w-3xl text-lg text-white/80 line-clamp-2">
          {article.excerpt}
        </p>
      </div>
    </article>
  );
}

function DemoFilterBar({ onSearch }: { onSearch: (s: string) => void }) {
  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative w-full max-w-xl">
        <Input
          placeholder="Search articles…"
          onChange={(e) => onSearch(e.target.value.toLowerCase())}
          className="h-12 rounded-xl"
        />
      </div>
    </div>
  );
}

function DemoSidebar() {
  return (
    <>
      <div className="rounded-2xl border border-border/50 bg-card p-6">
        <h3 className="mb-4 border-b border-border pb-2 font-bold text-foreground">
          Categories
        </h3>
        <div className="flex flex-wrap gap-2">
          {["Urban", "Sustainability", "Tech", "Events", "Research"].map((c) => (
            <Badge key={c} variant="secondary" className="cursor-pointer">
              {c}
            </Badge>
          ))}
        </div>
      </div>
      <div className="rounded-2xl border border-primary/20 bg-primary/5 p-6">
        <h3 className="mb-2 font-bold text-foreground">Join our newsletter</h3>
        <p className="mb-4 text-sm text-muted-foreground">
          Latest stories, weekly.
        </p>
        <Button className="w-full">Subscribe</Button>
      </div>
    </>
  );
}

export default function GridLayoutNews01Demo() {
  const [search, setSearch] = useState("");

  const filtered = useMagazineFilter<DemoArticle>({
    items: DEMO_ARTICLES,
    pageSize: 6,
    isFeatured: (a) => Boolean(a.featured),
    filterPredicate: search
      ? (a) => a.title.toLowerCase().includes(search)
      : undefined,
    simulatedLoadingMs: 500,
  });

  return (
    <Tabs defaultValue="composed" className="w-full">
      <TabsList className="flex flex-wrap gap-2">
        <TabsTrigger value="composed">Slot composition</TabsTrigger>
        <TabsTrigger value="bare">Bare layout</TabsTrigger>
        <TabsTrigger value="empty">Empty state</TabsTrigger>
      </TabsList>

      <TabsContent value="composed" className="mt-6">
        <GridLayoutNews01<DemoArticle>
          displayedItems={filtered.displayedItems}
          featuredItem={filtered.featuredItem}
          hasMore={filtered.hasMore}
          isLoading={filtered.isLoading}
          onLoadMore={filtered.loadMore}
          renderItem={(article, slot) => (
            <DemoCard article={article} slot={slot} />
          )}
          renderFeatured={(article) => <FeaturedCard article={article} />}
          filterBar={<DemoFilterBar onSearch={setSearch} />}
          sidebar={<DemoSidebar />}
        />
      </TabsContent>

      <TabsContent value="bare" className="mt-6">
        <GridLayoutNews01<DemoArticle>
          displayedItems={DEMO_ARTICLES.slice(0, 6)}
          renderItem={(article, slot) => (
            <DemoCard article={article} slot={slot} />
          )}
        />
      </TabsContent>

      <TabsContent value="empty" className="mt-6">
        <GridLayoutNews01<DemoArticle>
          displayedItems={[]}
          renderItem={(article, slot) => (
            <DemoCard article={article} slot={slot} />
          )}
          emptyState={
            <div className="space-y-2">
              <p className="text-lg font-semibold text-foreground">
                No articles yet
              </p>
              <p className="text-sm text-muted-foreground">
                Check back soon — we publish weekly.
              </p>
            </div>
          }
        />
      </TabsContent>
    </Tabs>
  );
}
