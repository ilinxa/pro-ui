"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsTrigger } from "@/components/ui/tabs";
import { SwipeTabsList } from "@/components/site/swipe-tabs-list";
import { StoryComposer01 } from "./story-composer-01";
import { SAMPLE_BRAND_STICKERS } from "./dummy-data";
import type { PublishedStory } from "./types";

// Demo-site uploader — pretends to upload (1.5s) and returns the blob's own
// object URL. Keeps every tab able to round-trip Publish → Done without a
// real backend; consumers wire `uploadUrl` or their own `uploader` for prod.
async function demoUploader(blob: Blob) {
  await new Promise((r) => setTimeout(r, 1500));
  return {
    url: URL.createObjectURL(blob),
    thumbnailUrl: URL.createObjectURL(blob),
  };
}

export default function StoryComposer01Demo() {
  return (
    <Tabs defaultValue="default" className="flex flex-col gap-4">
      <SwipeTabsList>
        <TabsTrigger value="default">Default</TabsTrigger>
        <TabsTrigger value="photo-only">Photo only</TabsTrigger>
        <TabsTrigger value="custom-stickers">Custom stickers</TabsTrigger>
        <TabsTrigger value="custom-uploader">Custom uploader</TabsTrigger>
        <TabsTrigger value="no-confirm">No discard guard</TabsTrigger>
      </SwipeTabsList>

      <TabsContent value="default">
        <ComposerLauncher
          description="All three modes (photo / video / text), 36 built-in emoji stickers. Wired to a fake uploader for the docs site — consumers pass `uploadUrl` or a real `uploader` for prod."
          props={{ uploader: demoUploader }}
        />
      </TabsContent>

      <TabsContent value="photo-only">
        <ComposerLauncher
          description="hideModes={['video','text']} — photo-only flow (useful for product or content surfaces that don't accept video)."
          props={{
            uploader: demoUploader,
            hideModes: ["video", "text"],
          }}
        />
      </TabsContent>

      <TabsContent value="custom-stickers">
        <ComposerLauncher
          description="Adds a consumer-supplied sticker set (Ilinxa brand) alongside the built-in catalog. Toggle replaceBuiltinStickers to ship consumer-only."
          props={{
            uploader: demoUploader,
            stickers: [SAMPLE_BRAND_STICKERS],
          }}
        />
      </TabsContent>

      <TabsContent value="custom-uploader">
        <ComposerLauncher
          description="Custom async uploader — useful for S3 pre-signed PUT, Cloudinary direct upload, Mux. The composer hands the blob + metadata to your function and you return { url }."
          props={{ uploader: demoUploader }}
        />
      </TabsContent>

      <TabsContent value="no-confirm">
        <ComposerLauncher
          description="confirmOnDiscard={false} — silent discard on close, matching Instagram's behavior. Don't ship this in production unless you have a separate draft-recovery path."
          props={{ uploader: demoUploader, confirmOnDiscard: false }}
        />
      </TabsContent>
    </Tabs>
  );
}

interface ComposerLauncherProps {
  description: string;
  props: Partial<React.ComponentProps<typeof StoryComposer01>>;
}

function ComposerLauncher({ description, props }: ComposerLauncherProps) {
  const [open, setOpen] = useState(false);
  const [lastPublished, setLastPublished] = useState<PublishedStory | null>(
    null,
  );

  return (
    <div className="flex flex-col items-center gap-4 p-8">
      <p className="max-w-md text-center text-sm text-muted-foreground">
        {description}
      </p>
      <Button onClick={() => setOpen(true)}>Open composer</Button>
      <StoryComposer01
        isOpen={open}
        onClose={() => setOpen(false)}
        onPublished={(story) => {
          setLastPublished(story);
          setOpen(false);
        }}
        {...props}
      />
      {lastPublished ? (
        <pre className="max-w-md overflow-x-auto rounded-md border border-border bg-muted p-3 font-mono text-xs">
          {JSON.stringify(lastPublished, null, 2)}
        </pre>
      ) : null}
    </div>
  );
}
