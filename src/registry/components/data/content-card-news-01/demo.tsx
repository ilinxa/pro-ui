"use client";

import { useState } from "react";
import { Bookmark, BookmarkCheck, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsTrigger } from "@/components/ui/tabs";
import { SwipeTabsList } from "@/components/site/swipe-tabs-list";
import { ContentCardNews01 } from "./content-card-news-01";
import {
  breakingNewsItem,
  draftItem,
  dummyCategoryStyles,
  dummyContentCardItems,
  editorsPickItem,
  paywalledItem,
  quotingItem,
  sensitiveItem,
  sponsoredItem,
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

  const log = (label: string) => () =>
    console.log(`[content-card-news-01 demo] ${label}`);

  return (
    <Tabs defaultValue="featured" className="w-full">
      <SwipeTabsList>
        <TabsTrigger value="featured">Featured</TabsTrigger>
        <TabsTrigger value="large">Large</TabsTrigger>
        <TabsTrigger value="medium">Medium</TabsTrigger>
        <TabsTrigger value="small">Small</TabsTrigger>
        <TabsTrigger value="list">List</TabsTrigger>
        <TabsTrigger value="composed">Composed</TabsTrigger>
        <TabsTrigger value="actions">Actions slot</TabsTrigger>
        <TabsTrigger value="editor">Editor mode</TabsTrigger>
        <TabsTrigger value="paywall">Paywall</TabsTrigger>
        <TabsTrigger value="sensitive">Sensitive</TabsTrigger>
        <TabsTrigger value="quoted">Quoted article</TabsTrigger>
        <TabsTrigger value="engagement">Engagement</TabsTrigger>
      </SwipeTabsList>

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

      <TabsContent value="editor" className="mt-6">
        <p className="mb-4 text-sm text-muted-foreground">
          <strong>viewerMode=&quot;editor&quot;</strong> — kebab shows editor
          actions (Edit / Publish / Schedule / Feature / Pin / Change visibility /
          Change category / Mark sensitive / See analytics / Delete). Draft status
          badge renders only in editor mode. Open the kebab on any card.
        </p>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[editorsPickItem, draftItem, sponsoredItem].map((item) => (
            <ContentCardNews01
              key={item.id}
              item={item}
              variant="medium"
              href={`/news/${item.id}`}
              categoryStyles={dummyCategoryStyles}
              viewerMode="editor"
              onEdit={log(`onEdit(${item.id})`)}
              onDelete={log(`onDelete(${item.id})`)}
              onPublish={log(`onPublish(${item.id})`)}
              onSchedule={log(`onSchedule(${item.id})`)}
              onFeature={log(`onFeature(${item.id})`)}
              onPin={log(`onPin(${item.id})`)}
              onChangeVisibility={log(`onChangeVisibility(${item.id})`)}
              onChangeCategory={log(`onChangeCategory(${item.id})`)}
              onMarkSensitive={log(`onMarkSensitive(${item.id})`)}
              onSeeAnalytics={log(`onSeeAnalytics(${item.id})`)}
              onShare={log(`onShare(${item.id})`)}
              onBookmark={log(`onBookmark(${item.id})`)}
            />
          ))}
        </div>
      </TabsContent>

      <TabsContent value="paywall" className="mt-6">
        <p className="mb-4 text-sm text-muted-foreground">
          Premium content gate. Excerpt + media blurred behind a Subscribe CTA.
          Preview text shows above the gate. Open the console — clicking the CTA
          fires <code>onRevealPaywall</code> as an analytics hook.
        </p>
        <div className="grid gap-6 md:grid-cols-2">
          <ContentCardNews01
            item={paywalledItem}
            variant="medium"
            href={`/news/${paywalledItem.id}`}
            categoryStyles={dummyCategoryStyles}
            onRevealPaywall={log(`onRevealPaywall(${paywalledItem.id})`)}
          />
          <ContentCardNews01
            item={paywalledItem}
            variant="large"
            href={`/news/${paywalledItem.id}`}
            categoryStyles={dummyCategoryStyles}
            onRevealPaywall={log(`onRevealPaywall(${paywalledItem.id})`)}
          />
        </div>
      </TabsContent>

      <TabsContent value="sensitive" className="mt-6">
        <p className="mb-4 text-sm text-muted-foreground">
          Sensitive content gate — media-only blur with reveal button. Distinct
          from paywall (different motivation). Lists content warnings when set.
          Reveal is per-session; reset via the handle&apos;s{" "}
          <code>reset(item)</code>. Small variant uses the gate&apos;s{" "}
          <code>compact</code> mode (icon + tiny &quot;Show&quot; pill) since
          its 96×96 thumb can&apos;t fit the full overlay.
        </p>
        <div className="space-y-6">
          <ContentCardNews01
            item={sensitiveItem}
            variant="medium"
            href={`/news/${sensitiveItem.id}`}
            categoryStyles={dummyCategoryStyles}
            onRevealSensitive={log(`onRevealSensitive(${sensitiveItem.id})`)}
          />
          <ContentCardNews01
            item={sensitiveItem}
            variant="small"
            href={`/news/${sensitiveItem.id}`}
            categoryStyles={dummyCategoryStyles}
            onRevealSensitive={log(`onRevealSensitive(${sensitiveItem.id})`)}
          />
        </div>
      </TabsContent>

      <TabsContent value="quoted" className="mt-6">
        <p className="mb-4 text-sm text-muted-foreground">
          Analysis pieces quoting source articles render a nested mini-card.
          Recursion-stripped (a quoted article&apos;s own <code>quotedArticle</code>
          is ignored). Renders in <code>medium</code> + <code>list</code> variants
          only per the per-variant feature matrix.
        </p>
        <div className="grid gap-6 md:grid-cols-2">
          <ContentCardNews01
            item={quotingItem}
            variant="medium"
            href={`/news/${quotingItem.id}`}
            categoryStyles={dummyCategoryStyles}
            onQuotedClick={(q) => log(`onQuotedClick(${q.id})`)()}
          />
          <ContentCardNews01
            item={quotingItem}
            variant="list"
            href={`/news/${quotingItem.id}`}
            categoryStyles={dummyCategoryStyles}
            onQuotedClick={(q) => log(`onQuotedClick(${q.id})`)()}
          />
        </div>
      </TabsContent>

      <TabsContent value="engagement" className="mt-6">
        <p className="mb-4 text-sm text-muted-foreground">
          Light engagement counts — like / comment / bookmark / share chips with
          handler-driven interactivity. For the news article{" "}
          <strong>detail page</strong>, consumers pass{" "}
          <code>renderEngagementCounts</code> to compose{" "}
          <code>&lt;EngagementBar01&gt;</code> in this slot — see the description
          doc §6.2 for the integration pattern. <code>isLive</code> badge +
          updated-N-ago sub-line surface live-blog state.
        </p>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[breakingNewsItem, editorsPickItem, quotingItem].map((item) => (
            <ContentCardNews01
              key={item.id}
              item={item}
              variant="medium"
              href={`/news/${item.id}`}
              categoryStyles={dummyCategoryStyles}
              onLike={(id, nextLiked) => log(`onLike(${id}, ${nextLiked})`)()}
              onCommentCountClick={(id) => log(`onCommentCountClick(${id})`)()}
              onBookmark={(id, next) => log(`onBookmark(${id}, ${next})`)()}
              onShare={(id) => log(`onShare(${id})`)()}
            />
          ))}
        </div>
      </TabsContent>
    </Tabs>
  );
}
