"use client";

import { useMemo, useState } from "react";
import { Tabs, TabsContent, TabsTrigger } from "@/components/ui/tabs";
import { SwipeTabsList } from "@/components/site/swipe-tabs-list";
import { Button } from "@/components/ui/button";
import { StoryViewer01 } from "./story-viewer-01";
import {
  STORY_VIEWER_01_DUMMY,
  STORY_VIEWER_01_DUMMY_CURRENT_USER,
  STORY_VIEWER_01_DUMMY_REACTION_KINDS,
  STORY_VIEWER_01_DUMMY_VIEWERS,
} from "./dummy-data";
import { CommentThread01 } from "@/registry/components/data/comment-thread-01/comment-thread-01";
import {
  DUMMY_FLAT_COMMENTS,
  generateOlderPage,
} from "@/registry/components/data/comment-thread-01/dummy-data";
import { ShareMenu } from "@/registry/components/data/engagement-bar-01/parts/share-menu";
import { DUMMY_LIKE_USERS } from "@/registry/components/data/engagement-bar-01/dummy-data";
import type {
  Story,
  StoryItem,
  StoryViewerDelta,
  Subscribe,
  ViewerListItem,
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

// ─── v0.2.0 — viewer / owner / slots / link demos ──────────────────────────

function ViewerModeTab() {
  const [open, setOpen] = useState(false);
  return (
    <div className="flex flex-col items-center gap-3 py-8">
      <p className="text-sm text-muted-foreground">
        viewerMode=&quot;viewer&quot;: stacked engagement overlay + reply composer +
        viewer-side kebab.
      </p>
      <OpenButton label="Open viewer-mode story" onClick={() => setOpen(true)} />
      <StoryViewer01
        stories={ALL_STORIES}
        initialStoryIndex={0}
        isOpen={open}
        onClose={() => setOpen(false)}
        viewerMode="viewer"
        currentUser={STORY_VIEWER_01_DUMMY_CURRENT_USER}
        reactionKinds={STORY_VIEWER_01_DUMMY_REACTION_KINDS}
        onLikeStory={(s, i, liked) => log("like", { s, i, liked })}
        onReactStory={(s, i, kind) => log("react", { s, i, kind })}
        onShareStory={(s, i) => log("share", { s, i })}
        onAddReply={(s, i, content) => log("reply", { s, i, content })}
        onReport={(s) => log("report", s)}
        onBlockAuthor={(a) => log("block-author", a)}
        onCopyLink={(s) => log("copy-link", s)}
        onAuthorClick={(s) => log("author-click", s.username)}
        renderCommentsPanel={(story, item) => (
          <CommentThread01
            comments={DUMMY_FLAT_COMMENTS}
            currentUser={{
              id: STORY_VIEWER_01_DUMMY_CURRENT_USER.id,
              name: STORY_VIEWER_01_DUMMY_CURRENT_USER.name,
              avatar: STORY_VIEWER_01_DUMMY_CURRENT_USER.avatar,
            }}
            pageSize={5}
            onAddComment={(content) => {
              log("add-comment", { story: story.id, item: item.id, content });
            }}
            onLoadMore={async (page) => {
              log("load-more", { story: story.id, item: item.id, page });
              await new Promise((r) => setTimeout(r, 300));
              return generateOlderPage(page);
            }}
            onLikeComment={(id, liked) => log("like-comment", { id, liked })}
            className="px-4 py-3"
          />
        )}
        renderSharePanel={(story, item, helpers) => (
          <div className="px-4 py-3">
            <ShareMenu
              users={DUMMY_LIKE_USERS}
              onShareTo={(user) => {
                log("share-to", {
                  story: story.id,
                  item: item.id,
                  to: user.username,
                });
                helpers.closeSharePanel();
              }}
              heading="Send to…"
            />
          </div>
        )}
      />
    </div>
  );
}

function OwnerModeTab() {
  const [open, setOpen] = useState(false);
  // Lazy-fetch handler — simulates a server round-trip after the eager
  // count chip is tapped (Q-V5 hybrid: viewerCount eager, viewers lazy).
  const onLoadViewers = useMemo(
    () => async (storyId: string): Promise<ViewerListItem[]> => {
      log("load-viewers", storyId);
      await new Promise((r) => setTimeout(r, 350));
      return STORY_VIEWER_01_DUMMY_VIEWERS;
    },
    [],
  );
  return (
    <div className="flex flex-col items-center gap-3 py-8">
      <p className="text-sm text-muted-foreground">
        viewerMode=&quot;owner&quot;: view-count chip + lazy viewers list (350ms
        simulated fetch). Owner-side kebab (save / delete / share-to-feed).
      </p>
      <OpenButton label="Open owner-mode story" onClick={() => setOpen(true)} />
      <StoryViewer01
        stories={ALL_STORIES}
        initialStoryIndex={0}
        isOpen={open}
        onClose={() => setOpen(false)}
        viewerMode="owner"
        onLoadViewers={onLoadViewers}
        onSaveToHighlights={(s) => log("save-to-highlights", s)}
        onDeleteStory={(s) => log("delete-story", s)}
        onShareToFeed={(s) => log("share-to-feed", s)}
        isSavedToHighlights={false}
      />
    </div>
  );
}

function CustomSlotsTab() {
  const [open, setOpen] = useState(false);
  return (
    <div className="flex flex-col items-center gap-3 py-8">
      <p className="text-sm text-muted-foreground">
        Full takeover via renderHeader + renderProgress + renderEngagementOverlay.
        Slots receive helpers (cursor / pause / nav) so custom UI keeps full
        control of the viewer.
      </p>
      <OpenButton label="Open custom-slots story" onClick={() => setOpen(true)} />
      <StoryViewer01
        stories={ALL_STORIES}
        initialStoryIndex={0}
        isOpen={open}
        onClose={() => setOpen(false)}
        viewerMode="viewer"
        currentUser={STORY_VIEWER_01_DUMMY_CURRENT_USER}
        reactionKinds={STORY_VIEWER_01_DUMMY_REACTION_KINDS}
        renderHeader={(story, _item, helpers) => (
          <div className="absolute top-4 right-4 left-4 z-20 flex items-center justify-between rounded-lg bg-black/50 px-3 py-2 backdrop-blur-sm">
            <p className="text-sm font-semibold text-white">@{story.username}</p>
            <Button
              size="sm"
              variant="ghost"
              className="text-white hover:bg-white/20 hover:text-white"
              onClick={helpers.onClose}
            >
              Close
            </Button>
          </div>
        )}
        renderProgress={(items, idx, p) => (
          <div className="absolute top-0 right-0 left-0 z-20 flex gap-0.5 p-2">
            {items.map((it, i) => (
              <div
                key={it.id}
                className="h-1 flex-1 overflow-hidden rounded-full bg-white/20"
              >
                <div
                  className="h-full rounded-full bg-accent transition-[width] duration-100"
                  style={{ width: `${i < idx ? 100 : i === idx ? p : 0}%` }}
                />
              </div>
            ))}
          </div>
        )}
        renderEngagementOverlay={(_story, _item, helpers) => (
          <div className="absolute right-3 bottom-24 z-30 flex flex-col items-center gap-3">
            <Button
              size="icon"
              variant="secondary"
              onClick={() => helpers.setPaused(!helpers.isPaused)}
            >
              {helpers.isPaused ? "▶" : "❚❚"}
            </Button>
          </div>
        )}
      />
    </div>
  );
}

function LinkAndLongPressTab() {
  const [open, setOpen] = useState(false);
  // Use the story-1 fixture (the dummy ships an item with a link CTA).
  return (
    <div className="flex flex-col items-center gap-3 py-8">
      <p className="px-6 text-center text-sm text-muted-foreground">
        First item carries a link CTA (&quot;Shop now&quot; → example.com).
        Hold-press anywhere on the viewer to pause; release to resume.
      </p>
      <OpenButton label="Open link + long-press story" onClick={() => setOpen(true)} />
      <StoryViewer01
        stories={[STORY_VIEWER_01_DUMMY[0]]}
        initialStoryIndex={0}
        isOpen={open}
        onClose={() => setOpen(false)}
        viewerMode="viewer"
        currentUser={STORY_VIEWER_01_DUMMY_CURRENT_USER}
        reactionKinds={STORY_VIEWER_01_DUMMY_REACTION_KINDS}
        onLinkClick={(s, i, url) => log("link-click", { s, i, url })}
        longPressThresholdMs={250}
      />
    </div>
  );
}

export default function StoryViewer01Demo() {
  return (
    <Tabs defaultValue="image" className="w-full">
      <SwipeTabsList>
        <TabsTrigger value="image">Image only</TabsTrigger>
        <TabsTrigger value="video">Video only</TabsTrigger>
        <TabsTrigger value="mixed">Mixed</TabsTrigger>
        <TabsTrigger value="multi">Multi-story nav</TabsTrigger>
        <TabsTrigger value="realtime">Realtime</TabsTrigger>
        <TabsTrigger value="custom">Custom renderItem</TabsTrigger>
        <TabsTrigger value="viewer-mode">Viewer mode</TabsTrigger>
        <TabsTrigger value="owner-mode">Owner mode</TabsTrigger>
        <TabsTrigger value="custom-slots">Custom slots</TabsTrigger>
        <TabsTrigger value="link-longpress">Link + long-press</TabsTrigger>
      </SwipeTabsList>
      <TabsContent value="image"><ImageOnlyTab /></TabsContent>
      <TabsContent value="video"><VideoOnlyTab /></TabsContent>
      <TabsContent value="mixed"><MixedTab /></TabsContent>
      <TabsContent value="multi"><MultiStoryTab /></TabsContent>
      <TabsContent value="realtime"><RealtimeTab /></TabsContent>
      <TabsContent value="custom"><CustomRenderItemTab /></TabsContent>
      <TabsContent value="viewer-mode"><ViewerModeTab /></TabsContent>
      <TabsContent value="owner-mode"><OwnerModeTab /></TabsContent>
      <TabsContent value="custom-slots"><CustomSlotsTab /></TabsContent>
      <TabsContent value="link-longpress"><LinkAndLongPressTab /></TabsContent>
    </Tabs>
  );
}
