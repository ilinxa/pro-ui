"use client";

import { useMemo, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { StoryViewer01 } from "./story-viewer-01";
import { STORY_VIEWER_01_DUMMY } from "./dummy-data";
import type {
  Story,
  StoryItem,
  StoryViewerDelta,
  Subscribe,
} from "./types";

function log(tag: string, payload: unknown) {
  if (typeof console !== "undefined") {
    console.log(`[demo:story-viewer:${tag}]`, payload);
  }
}

const IMAGE_ONLY: Story[] = [STORY_VIEWER_01_DUMMY[0]];
const VIDEO_ONLY: Story[] = [STORY_VIEWER_01_DUMMY[1]];
const MIXED: Story[] = [STORY_VIEWER_01_DUMMY[2]];
const ALL_STORIES: Story[] = STORY_VIEWER_01_DUMMY;

function OpenButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <div className="flex items-center justify-center py-12">
      <Button onClick={onClick}>{label}</Button>
    </div>
  );
}

function ImageOnlyTab() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <OpenButton label="Open image-only story" onClick={() => setOpen(true)} />
      <StoryViewer01
        stories={IMAGE_ONLY}
        initialStoryIndex={0}
        isOpen={open}
        onClose={() => setOpen(false)}
        onStoryViewed={(id) => log("story-viewed", id)}
      />
    </>
  );
}

function VideoOnlyTab() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <OpenButton label="Open video-only story" onClick={() => setOpen(true)} />
      <StoryViewer01
        stories={VIDEO_ONLY}
        initialStoryIndex={0}
        isOpen={open}
        onClose={() => setOpen(false)}
        onItemViewed={(s, i, idx) => log("item-viewed", { s, i, idx })}
      />
    </>
  );
}

function MixedTab() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <OpenButton label="Open mixed (image + video)" onClick={() => setOpen(true)} />
      <StoryViewer01
        stories={MIXED}
        initialStoryIndex={0}
        isOpen={open}
        onClose={() => setOpen(false)}
        onCursorChange={(s, i) => log("cursor", { s, i })}
      />
    </>
  );
}

function MultiStoryTab() {
  const [open, setOpen] = useState(false);
  const [initialIdx, setInitialIdx] = useState(0);
  return (
    <div className="flex flex-col items-center gap-3 py-8">
      <p className="text-sm text-muted-foreground">
        Open from a specific starting story to see ← → navigation across stories.
      </p>
      <div className="flex flex-wrap items-center justify-center gap-2">
        {ALL_STORIES.map((s, idx) => (
          <Button
            key={s.id}
            variant="outline"
            size="sm"
            onClick={() => {
              setInitialIdx(idx);
              setOpen(true);
            }}
          >
            Open: {s.username}
          </Button>
        ))}
      </div>
      <StoryViewer01
        stories={ALL_STORIES}
        initialStoryIndex={initialIdx}
        isOpen={open}
        onClose={() => setOpen(false)}
        onStoryViewed={(id) => log("story-viewed", id)}
        onAutoCloseAtEnd={() => log("auto-close-at-end", null)}
      />
    </div>
  );
}

function RealtimeTab() {
  const [open, setOpen] = useState(false);
  const subscribe = useMemo<Subscribe<StoryViewerDelta>>(
    () => (handler) => {
      const itemTimer = setInterval(() => {
        const newItem: StoryItem = {
          id: `live-item-${Date.now()}`,
          type: "image",
          src: "https://images.unsplash.com/photo-1454496522488-7a8e488e8606?w=900&h=1600&fit=crop",
          duration: 5,
        };
        handler({
          kind: "item-added",
          storyId: ALL_STORIES[0].id,
          item: newItem,
          position: "end",
        });
      }, 8000);

      const storyTimer = setInterval(() => {
        const story: Story = {
          id: `live-story-${Date.now()}`,
          userId: `live-user-${Date.now()}`,
          username: "live_friend",
          createdAt: new Date().toISOString(),
          hasUnread: true,
          items: [
            {
              id: `live-story-${Date.now()}-item-1`,
              type: "image",
              src: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=900&h=1600&fit=crop",
              duration: 5,
            },
          ],
        };
        handler({ kind: "story-added", story, position: "end" });
      }, 15000);

      return () => {
        clearInterval(itemTimer);
        clearInterval(storyTimer);
      };
    },
    [],
  );

  return (
    <>
      <p className="px-4 py-2 text-center text-xs text-muted-foreground">
        Synthetic feed: new item every 8s, new story every 15s. Open the viewer to see them appear live.
      </p>
      <OpenButton label="Open realtime viewer" onClick={() => setOpen(true)} />
      <StoryViewer01
        stories={ALL_STORIES}
        initialStoryIndex={0}
        isOpen={open}
        onClose={() => setOpen(false)}
        subscribe={subscribe}
        onSubscribeDelta={(d) => log("delta", d)}
      />
    </>
  );
}

function CustomRenderItemTab() {
  const [open, setOpen] = useState(false);

  // Inject a "promo" item by spreading custom data into the viewer.
  const customStories = useMemo<Story[]>(() => {
    const promoItem: StoryItem = {
      id: "promo-item-1",
      type: "image",
      src: "promo://placeholder",
      duration: 6,
    };
    return [
      {
        ...ALL_STORIES[0],
        items: [...ALL_STORIES[0].items, promoItem],
      },
    ];
  }, []);

  return (
    <>
      <OpenButton label="Open with custom 'promo' item" onClick={() => setOpen(true)} />
      <StoryViewer01
        stories={customStories}
        initialStoryIndex={0}
        isOpen={open}
        onClose={() => setOpen(false)}
        renderItem={(item, ctx) => {
          if (item.id === "promo-item-1") {
            return (
              <div className="flex h-full w-full items-center justify-center bg-linear-to-br from-accent via-warning to-destructive p-8 text-center">
                <div>
                  <p className="text-2xl font-bold text-primary-foreground">Sponsored</p>
                  <p className="mt-2 text-sm text-primary-foreground/80">
                    Custom item rendered via the renderItem slot. Item index {ctx.itemIndex + 1}.
                  </p>
                </div>
              </div>
            );
          }
          // For non-promo items, mimic the default by returning null + relying on
          // the host wrapping pattern. In practice, hosts using renderItem own
          // the full render — including image/video. Keep this minimal for demo.
          if (item.type === "image") {
            return <img src={item.src} alt="story" className="h-full w-full object-cover" />;
          }
          return (
            <video
              src={item.src}
              autoPlay
              muted
              playsInline
              className="h-full w-full object-cover"
            />
          );
        }}
      />
    </>
  );
}

export default function StoryViewer01Demo() {
  return (
    <Tabs defaultValue="image" className="w-full">
      <TabsList>
        <TabsTrigger value="image">Image only</TabsTrigger>
        <TabsTrigger value="video">Video only</TabsTrigger>
        <TabsTrigger value="mixed">Mixed</TabsTrigger>
        <TabsTrigger value="multi">Multi-story nav</TabsTrigger>
        <TabsTrigger value="realtime">Realtime</TabsTrigger>
        <TabsTrigger value="custom">Custom renderItem</TabsTrigger>
      </TabsList>
      <TabsContent value="image"><ImageOnlyTab /></TabsContent>
      <TabsContent value="video"><VideoOnlyTab /></TabsContent>
      <TabsContent value="mixed"><MixedTab /></TabsContent>
      <TabsContent value="multi"><MultiStoryTab /></TabsContent>
      <TabsContent value="realtime"><RealtimeTab /></TabsContent>
      <TabsContent value="custom"><CustomRenderItemTab /></TabsContent>
    </Tabs>
  );
}
