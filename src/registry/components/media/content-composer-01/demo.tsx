"use client";

import * as React from "react";
import { Tabs, TabsContent, TabsTrigger } from "@/components/ui/tabs";
import { SwipeTabsList } from "@/components/site/swipe-tabs-list";
import { Button } from "@/components/ui/button";
import { ContentComposer01 } from "./content-composer-01";
import { createNewsComposerConfig } from "./configs/news-composer.config";
import { postComposerConfig } from "./configs/post-composer.config";
import { SAMPLE_AUTHORS, SAMPLE_NEWS_BODY, SAMPLE_NEWS_ITEM } from "./dummy-data";
import type { AuthorSourceConfig } from "./parts/field-author-picker";
import type { ContentCardItem } from "./types";

const sampleAuthorSource: AuthorSourceConfig = async (query) => {
  const q = query.trim().toLowerCase();
  return SAMPLE_AUTHORS.filter((a) => a.name.toLowerCase().includes(q));
};

// Fake uploader — returns a local object URL so Publish resolves in the demo
// (NOT a network endpoint).
const demoUploader = async (blob: Blob) => ({ url: URL.createObjectURL(blob) });

const newsConfig = createNewsComposerConfig({ authorSource: sampleAuthorSource });

type LastAction =
  | { kind: "draft" | "publish" | "schedule"; item: ContentCardItem; at?: Date }
  | null;

function ResultPanel({ last }: { last: LastAction }) {
  if (!last) return null;
  const heading =
    last.kind === "draft"
      ? "Saved draft"
      : last.kind === "publish"
        ? "Published"
        : `Scheduled for ${last.at?.toLocaleString()}`;
  return (
    <div className="rounded-lg border border-border bg-muted/30 p-3 text-xs">
      <p className="font-medium text-foreground">
        {heading}: {last.item.title}
      </p>
      <pre className="mt-2 max-h-48 overflow-auto wrap-break-word whitespace-pre-wrap font-mono text-[10px] text-muted-foreground">
        {JSON.stringify(last.item, null, 2)}
      </pre>
    </div>
  );
}

function NewsComposerDemo({ reEdit }: { reEdit?: boolean }) {
  const [last, setLast] = React.useState<LastAction>(null);
  return (
    <div className="flex flex-col gap-4">
      <ContentComposer01
        config={newsConfig}
        uploader={demoUploader}
        {...(reEdit
          ? { initialItem: SAMPLE_NEWS_ITEM, initialBody: SAMPLE_NEWS_BODY }
          : {})}
        onAutosave={() => {}}
        onSaveDraft={(item) => setLast({ kind: "draft", item })}
        onPublish={(item) => setLast({ kind: "publish", item })}
        onSchedule={(item, at) => setLast({ kind: "schedule", item, at })}
      />
      <ResultPanel last={last} />
    </div>
  );
}

export default function ContentComposer01Demo() {
  const [tab, setTab] = React.useState("news");
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [dialogLast, setDialogLast] = React.useState<LastAction>(null);

  return (
    <Tabs value={tab} onValueChange={setTab} className="w-full">
      <SwipeTabsList>
        <TabsTrigger value="news">News</TabsTrigger>
        <TabsTrigger value="re-edit">Re-edit</TabsTrigger>
        <TabsTrigger value="post">Post (clamp)</TabsTrigger>
        <TabsTrigger value="dialog">Dialog</TabsTrigger>
        <TabsTrigger value="dark">Dark</TabsTrigger>
      </SwipeTabsList>

      <TabsContent value="news" className="mt-4">
        <NewsComposerDemo />
      </TabsContent>

      <TabsContent value="re-edit" className="mt-4">
        <p className="mb-3 text-sm text-muted-foreground">
          Seeded from a published article (plus its persisted body). On re-publish
          the adapter omits engagement counts, so the page preserves the real
          numbers.
        </p>
        <NewsComposerDemo reEdit />
      </TabsContent>

      <TabsContent value="post" className="mt-4">
        <p className="mb-3 text-sm text-muted-foreground">
          The post config declares <code>mediaSources: [&quot;upload&quot;,&quot;library&quot;]</code>;
          the substrate clamps <code>&quot;library&quot;</code> to upload-only. Publishing is
          deferred (no <code>post-content-item</code> adapter in v0.1).
        </p>
        <ContentComposer01
          config={postComposerConfig}
          uploader={demoUploader}
          onAutosave={() => {}}
          onSaveDraft={() => {}}
          onPublish={() => {}}
        />
      </TabsContent>

      <TabsContent value="dialog" className="mt-4">
        <Button type="button" onClick={() => setDialogOpen(true)}>
          Open composer dialog
        </Button>
        <ContentComposer01
          config={newsConfig}
          presentation="dialog"
          isOpen={dialogOpen}
          onClose={() => setDialogOpen(false)}
          uploader={demoUploader}
          onAutosave={() => {}}
          onSaveDraft={(item) => setDialogLast({ kind: "draft", item })}
          onPublish={(item) => {
            setDialogLast({ kind: "publish", item });
            setDialogOpen(false);
          }}
        />
        <div className="mt-4">
          <ResultPanel last={dialogLast} />
        </div>
      </TabsContent>

      <TabsContent value="dark" className="mt-4">
        <div className="dark rounded-xl border border-border bg-background p-4 text-foreground">
          <NewsComposerDemo />
        </div>
      </TabsContent>
    </Tabs>
  );
}
