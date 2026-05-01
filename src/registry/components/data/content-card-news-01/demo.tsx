"use client";

import { useState } from "react";
import { Bookmark, BookmarkCheck, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ContentCardNews01 } from "./content-card-news-01";
import {
  dummyCategoryStyles,
  dummyContentCardItems,
} from "./dummy-data";

const items = dummyContentCardItems;

function CardActions({
  itemId,
  bookmarked,
  onToggle,
}: {
  itemId: string;
  bookmarked: boolean;
  onToggle: (id: string) => void;
}) {
  return (
    <div className="flex gap-2">
      <Button
        variant="secondary"
        size="sm"
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          onToggle(itemId);
        }}
        aria-label={bookmarked ? "Remove bookmark" : "Bookmark article"}
      >
        {bookmarked ? (
          <BookmarkCheck aria-hidden="true" className="size-4" />
        ) : (
          <Bookmark aria-hidden="true" className="size-4" />
        )}
      </Button>
      <Button
        variant="secondary"
        size="sm"
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
        }}
        aria-label="Share article"
      >
        <Share2 aria-hidden="true" className="size-4" />
      </Button>
    </div>
  );
}

export default function ContentCardNews01Demo() {
  const [bookmarks, setBookmarks] = useState<Set<string>>(() => new Set());

  const toggleBookmark = (id: string) => {
    setBookmarks((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const featured = items[0];
  const large = items[1];
  const mediums = items.slice(2, 6);
  const smalls = items.slice(2, 6);
  const lists = items.slice(0, 5);

  return (
    <Tabs defaultValue="featured" className="w-full">
      <TabsList className="flex flex-wrap gap-2">
        <TabsTrigger value="featured">Featured</TabsTrigger>
        <TabsTrigger value="large">Large</TabsTrigger>
        <TabsTrigger value="medium">Medium</TabsTrigger>
        <TabsTrigger value="small">Small</TabsTrigger>
        <TabsTrigger value="list">List</TabsTrigger>
        <TabsTrigger value="composed">Composed</TabsTrigger>
        <TabsTrigger value="actions">Actions slot</TabsTrigger>
      </TabsList>

      <TabsContent value="featured" className="mt-6">
        <ContentCardNews01
          item={featured}
          variant="featured"
          href={`/news/${featured.id}`}
          categoryStyles={dummyCategoryStyles}
        />
      </TabsContent>

      <TabsContent value="large" className="mt-6">
        <ContentCardNews01
          item={large}
          variant="large"
          href={`/news/${large.id}`}
          categoryStyles={dummyCategoryStyles}
        />
      </TabsContent>

      <TabsContent value="medium" className="mt-6">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {mediums.map((item) => (
            <ContentCardNews01
              key={item.id}
              item={item}
              variant="medium"
              href={`/news/${item.id}`}
              categoryStyles={dummyCategoryStyles}
            />
          ))}
        </div>
      </TabsContent>

      <TabsContent value="small" className="mt-6">
        <div className="grid gap-4 md:grid-cols-2">
          {smalls.map((item) => (
            <ContentCardNews01
              key={item.id}
              item={item}
              variant="small"
              href={`/news/${item.id}`}
              categoryStyles={dummyCategoryStyles}
            />
          ))}
        </div>
      </TabsContent>

      <TabsContent value="list" className="mt-6">
        <div className="rounded-2xl border border-border/50 bg-card p-4">
          {lists.map((item) => (
            <ContentCardNews01
              key={item.id}
              item={item}
              variant="list"
              href={`/news/${item.id}`}
              categoryStyles={dummyCategoryStyles}
            />
          ))}
        </div>
      </TabsContent>

      <TabsContent value="composed" className="mt-6">
        <div className="space-y-8">
          <ContentCardNews01
            item={featured}
            variant="featured"
            href={`/news/${featured.id}`}
            categoryStyles={dummyCategoryStyles}
          />
          <div className="grid gap-6 lg:grid-cols-12">
            <div className="space-y-6 lg:col-span-8">
              <ContentCardNews01
                item={large}
                variant="large"
                href={`/news/${large.id}`}
                categoryStyles={dummyCategoryStyles}
              />
              <div className="grid gap-6 md:grid-cols-2">
                {items.slice(2, 6).map((item) => (
                  <ContentCardNews01
                    key={item.id}
                    item={item}
                    variant="medium"
                    href={`/news/${item.id}`}
                    categoryStyles={dummyCategoryStyles}
                  />
                ))}
              </div>
            </div>
            <aside className="lg:col-span-4">
              <div className="rounded-2xl border border-border/50 bg-card p-4">
                {items.slice(2, 6).map((item) => (
                  <ContentCardNews01
                    key={item.id}
                    item={item}
                    variant="list"
                    href={`/news/${item.id}`}
                    categoryStyles={dummyCategoryStyles}
                  />
                ))}
              </div>
            </aside>
          </div>
        </div>
      </TabsContent>

      <TabsContent value="actions" className="mt-6">
        <p className="mb-4 text-sm text-muted-foreground">
          Click the bookmark or share buttons — they sit ABOVE the link
          overlay (z-10) and don&apos;t trigger card navigation. Click anywhere
          else on the card and you navigate normally.
        </p>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {items.slice(0, 3).map((item) => (
            <ContentCardNews01
              key={item.id}
              item={item}
              variant="medium"
              href={`/news/${item.id}`}
              categoryStyles={dummyCategoryStyles}
              actions={
                <CardActions
                  itemId={item.id}
                  bookmarked={bookmarks.has(item.id)}
                  onToggle={toggleBookmark}
                />
              }
            />
          ))}
        </div>
      </TabsContent>
    </Tabs>
  );
}
