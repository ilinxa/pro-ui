"use client";

import { Tabs, TabsContent, TabsTrigger } from "@/components/ui/tabs";
import { SwipeTabsList } from "@/components/site/swipe-tabs-list";
import { ArticleMeta01 } from "./article-meta-01";
import {
  ARTICLE_META_01_DUMMY,
  ARTICLE_META_01_DUMMY_CENTERED,
  ARTICLE_META_01_DUMMY_DOCS,
  ARTICLE_META_01_DUMMY_TEXT_ONLY,
  ARTICLE_META_01_DUMMY_VIDEO,
} from "./dummy-data";

export default function ArticleMeta01Demo() {
  return (
    <Tabs defaultValue="default" className="w-full">
      <SwipeTabsList>
        <TabsTrigger value="default">Default</TabsTrigger>
        <TabsTrigger value="centered">Centered</TabsTrigger>
        <TabsTrigger value="end">End-aligned</TabsTrigger>
        <TabsTrigger value="clickable">Clickable byline</TabsTrigger>
        <TabsTrigger value="text-only">Text-only</TabsTrigger>
        <TabsTrigger value="video">Video meta</TabsTrigger>
      </SwipeTabsList>

      <TabsContent value="default" className="mt-6 max-w-2xl">
        <h2 className="text-2xl font-serif font-bold text-foreground mb-4">
          How sustainable cities are rethinking density
        </h2>
        <ArticleMeta01 items={ARTICLE_META_01_DUMMY} divider />
        <p className="mt-6 text-sm text-muted-foreground">
          Lead paragraph would go here. The meta strip cleanly separates the
          headline from the body via the bottom rule.
        </p>
      </TabsContent>

      <TabsContent value="centered" className="mt-6 max-w-2xl">
        <h2 className="text-2xl font-serif font-bold text-foreground text-center mb-4">
          Public transit on the rebound
        </h2>
        <ArticleMeta01 items={ARTICLE_META_01_DUMMY_CENTERED} align="center" />
      </TabsContent>

      <TabsContent value="end" className="mt-6 max-w-2xl">
        <h2 className="text-2xl font-serif font-bold text-foreground text-right mb-4">
          Sidebar dispatches: the data this week
        </h2>
        <ArticleMeta01 items={ARTICLE_META_01_DUMMY} align="end" />
        <p className="mt-3 text-xs text-muted-foreground">
          <code>align=&quot;end&quot;</code> right-aligns the meta strip — typical for
          sidebars where the headline is right-aligned, or for RTL layouts
          where the visual gravity should match the reading direction.
        </p>
      </TabsContent>

      <TabsContent value="clickable" className="mt-6 max-w-2xl">
        <ArticleMeta01 items={ARTICLE_META_01_DUMMY_DOCS} />
        <p className="mt-3 text-xs text-muted-foreground">
          Hover the byline (<code>@maya</code>) — color shifts on the
          clickable item; focus-visible ring shows on keyboard nav.
        </p>
      </TabsContent>

      <TabsContent value="text-only" className="mt-6 max-w-2xl">
        <ArticleMeta01 items={ARTICLE_META_01_DUMMY_TEXT_ONLY} />
        <p className="mt-3 text-xs text-muted-foreground">
          Items can omit <code>icon</code> entirely — pure label-value strip.
        </p>
      </TabsContent>

      <TabsContent value="video" className="mt-6 max-w-2xl">
        <ArticleMeta01 items={ARTICLE_META_01_DUMMY_VIDEO} gapClass="gap-3" />
        <p className="mt-3 text-xs text-muted-foreground">
          Tighter gap (<code>gap-3</code>) for video-player-style meta lines.
        </p>
      </TabsContent>
    </Tabs>
  );
}
