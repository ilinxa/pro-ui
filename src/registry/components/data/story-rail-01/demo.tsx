"use client";

import { useMemo, useRef, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StoryViewer01 } from "../../media/story-viewer-01";
import type { Story } from "../../media/story-viewer-01";
import { StoryRail01 } from "./story-rail-01";
import { AddStoryThumbnail } from "./parts/add-story-thumbnail";
import {
  DUMMY_STORIES,
  DUMMY_VIEWER_AVATAR,
  createDummyStoryRailSubscribe,
} from "./dummy-data";
import type { StoryRail01Handle, StoryRailItem } from "./types";

function log(tag: string, payload: unknown) {
  if (typeof console !== "undefined") {
    console.log(`[demo:story-rail:${tag}]`, payload);
  }
}

const NOW = new Date("2026-05-03T14:00:00Z");
const isoMinusMin = (min: number) =>
  new Date(NOW.getTime() - min * 60_000).toISOString();

/**
 * Real Unsplash + w3schools URLs (verified working) cycled across the 7 rail items
 * so the viewer's nav arrows + tap zones visibly advance to a different image
 * each time. Demo-only — NOT in dummy-data.ts (which ships via story-rail-01-fixtures
 * and stays viewer-free).
 */
const SECONDARY_IMAGES = [
  "https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=900&h=1600&fit=crop",
  "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=900&h=1600&fit=crop",
  "https://images.unsplash.com/photo-1454496522488-7a8e488e8606?w=900&h=1600&fit=crop",
  "https://images.unsplash.com/photo-1504805572947-34fad45aed93?w=900&h=1600&fit=crop",
  "https://images.unsplash.com/photo-1418065460487-3e41a6c84dc5?w=900&h=1600&fit=crop",
  "https://images.unsplash.com/photo-1444080748397-f442aa95c3e5?w=900&h=1600&fit=crop",
  "https://images.unsplash.com/photo-1505765050516-f72dcac9c60e?w=900&h=1600&fit=crop",
];

/**
 * Full-Story shape for the viewer, parallel to DUMMY_STORIES (same IDs).
 * Rail dummies are minimal previews; viewer needs full items[] + createdAt.
 */
const DUMMY_FULL_STORIES: Story[] = DUMMY_STORIES.map((rail, idx) => ({
  id: rail.id,
  userId: rail.userId ?? `u${idx + 1}`,
  username: rail.username,
  avatar: rail.avatar,
  hasUnread: rail.hasUnread,
  createdAt: isoMinusMin((idx + 1) * 18),
  items:
    idx === 1
      ? [
          { id: `${rail.id}-i1`, type: "video", src: "https://www.w3schools.com/html/mov_bbb.mp4" },
          { id: `${rail.id}-i2`, type: "image", src: rail.previewImage, duration: 5 },
        ]
      : idx === 4
        ? [
            { id: `${rail.id}-i1`, type: "image", src: rail.previewImage, duration: 5 },
            { id: `${rail.id}-i2`, type: "video", src: "https://www.w3schools.com/html/movie.mp4" },
          ]
        : [
            { id: `${rail.id}-i1`, type: "image", src: rail.previewImage, duration: 5 },
            { id: `${rail.id}-i2`, type: "image", src: SECONDARY_IMAGES[idx], duration: 5 },
          ],
}));

interface RailWithViewerProps {
  framed?: boolean;
  showAddLeading?: boolean;
  renderThumbnail?: React.ComponentProps<typeof StoryRail01>["renderThumbnail"];
  subscribe?: React.ComponentProps<typeof StoryRail01>["subscribe"];
}

/**
 * Shared rail+viewer wiring — the canonical pattern from the guide:
 * rail click sets activeIdx, viewer opens, viewer's onStoryViewed feeds back
 * into railRef.markViewed to clear the unread ring.
 */
function RailWithViewer({
  framed = true,
  showAddLeading = false,
  renderThumbnail,
  subscribe,
}: RailWithViewerProps) {
  const railRef = useRef<StoryRail01Handle | null>(null);
  const [activeIdx, setActiveIdx] = useState(-1);

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-3">
      <StoryRail01
        ref={railRef}
        items={DUMMY_STORIES}
        framed={framed}
        leading={
          showAddLeading ? (
            <AddStoryThumbnail
              userAvatar={DUMMY_VIEWER_AVATAR}
              onClick={() => log("add-story", null)}
            />
          ) : undefined
        }
        renderThumbnail={renderThumbnail}
        subscribe={subscribe}
        onSubscribeDelta={subscribe ? (d) => log("delta", d) : undefined}
        onItemClick={(item, index) => {
          log("click", { item, index });
          setActiveIdx(index);
        }}
      />

      {activeIdx >= 0 ? (
        <StoryViewer01
          stories={DUMMY_FULL_STORIES}
          initialStoryIndex={activeIdx}
          isOpen
          onClose={() => setActiveIdx(-1)}
          onStoryViewed={(id) => {
            log("story-viewed", id);
            railRef.current?.markViewed(id);
          }}
          onAutoCloseAtEnd={() => log("auto-close-at-end", null)}
        />
      ) : null}
    </div>
  );
}

function DefaultTab() {
  return <RailWithViewer />;
}

function WithAddTab() {
  return <RailWithViewer showAddLeading />;
}

function MixedReadUnreadTab() {
  return <RailWithViewer />;
}

function RealtimeTab() {
  const subscribe = useMemo(() => createDummyStoryRailSubscribe(), []);
  return <RailWithViewer showAddLeading subscribe={subscribe} />;
}

function CustomRenderTab() {
  return (
    <RailWithViewer
      renderThumbnail={(item: StoryRailItem, isUnread, { onClick }) => (
        <button
          type="button"
          onClick={onClick}
          aria-label={item.username}
          className="group flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl border-2 border-card bg-muted shadow-sm transition-transform hover:scale-105"
        >
          <img
            src={item.previewImage}
            alt=""
            className="h-full w-full object-cover"
            style={{
              filter: isUnread ? "saturate(1.1)" : "saturate(0.4)",
            }}
          />
        </button>
      )}
    />
  );
}

function BareTab() {
  return <RailWithViewer framed={false} showAddLeading />;
}

function EmptyTab() {
  const [items] = useState<StoryRailItem[]>([]);
  return (
    <div className="mx-auto max-w-2xl">
      <StoryRail01 items={items} />
    </div>
  );
}

export default function StoryRail01Demo() {
  return (
    <Tabs defaultValue="default" className="w-full">
      <TabsList className="grid grid-cols-7">
        <TabsTrigger value="default">Default</TabsTrigger>
        <TabsTrigger value="add">+ Add</TabsTrigger>
        <TabsTrigger value="mixed">Mixed</TabsTrigger>
        <TabsTrigger value="realtime">Realtime</TabsTrigger>
        <TabsTrigger value="custom">Custom</TabsTrigger>
        <TabsTrigger value="bare">Bare</TabsTrigger>
        <TabsTrigger value="empty">Empty</TabsTrigger>
      </TabsList>
      <TabsContent value="default" className="mt-4">
        <DefaultTab />
      </TabsContent>
      <TabsContent value="add" className="mt-4">
        <WithAddTab />
      </TabsContent>
      <TabsContent value="mixed" className="mt-4">
        <MixedReadUnreadTab />
      </TabsContent>
      <TabsContent value="realtime" className="mt-4">
        <RealtimeTab />
      </TabsContent>
      <TabsContent value="custom" className="mt-4">
        <CustomRenderTab />
      </TabsContent>
      <TabsContent value="bare" className="mt-4">
        <BareTab />
      </TabsContent>
      <TabsContent value="empty" className="mt-4">
        <EmptyTab />
      </TabsContent>
    </Tabs>
  );
}
