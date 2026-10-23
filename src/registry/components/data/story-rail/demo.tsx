"use client";

import { useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsTrigger } from "@/components/ui/tabs";
import { SwipeTabsList } from "@/components/site/swipe-tabs-list";
import { StoryViewer } from "../../media/story-viewer";
import type { Story } from "../../media/story-viewer";
import { StoryRail } from "./story-rail";
import { AddStoryThumbnail } from "./parts/add-story-thumbnail";
import {
  DUMMY_STORIES,
  DUMMY_VIEWER_AVATAR,
  createDummyStoryRailSubscribe,
} from "./dummy-data";
import type { StoryRailHandle, StoryRailItem } from "./types";

function log(tag: string, payload: unknown) {
  if (typeof console !== "undefined") {
    console.log(`[demo:story-rail:${tag}]`, payload);
  }
}

const NOW = new Date("2026-05-03T14:00:00Z");
const isoMinusMin = (min: number) =>
  new Date(NOW.getTime() - min * 60_000).toISOString();

/**
 * Real Unsplash + w3schools URLs (verified working) cycled across the rail items
 * so the viewer's nav arrows + tap zones visibly advance to a different image
 * each time. Demo-only — NOT in dummy-data.ts (which ships via story-rail-fixtures
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
 * Full-Story shape for the viewer, derived from a rail item (same id). Rail
 * items are minimal previews; the viewer needs full items[] + createdAt.
 * Items without a preview fall back to a SECONDARY_IMAGES entry (modulo, so the
 * array length never matters).
 */
function toFullStory(rail: StoryRailItem, idx: number): Story {
  const first =
    rail.previewImage ?? SECONDARY_IMAGES[idx % SECONDARY_IMAGES.length];
  const second = SECONDARY_IMAGES[(idx + 1) % SECONDARY_IMAGES.length];
  return {
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
            { id: `${rail.id}-i2`, type: "image", src: first, duration: 5 },
          ]
        : idx === 4
          ? [
              { id: `${rail.id}-i1`, type: "image", src: first, duration: 5 },
              { id: `${rail.id}-i2`, type: "video", src: "https://www.w3schools.com/html/movie.mp4" },
            ]
          : [
              { id: `${rail.id}-i1`, type: "image", src: first, duration: 5 },
              { id: `${rail.id}-i2`, type: "image", src: second, duration: 5 },
            ],
  };
}

type RailProps = React.ComponentProps<typeof StoryRail>;

interface RailWithViewerProps {
  framed?: boolean;
  showAddLeading?: boolean;
  renderThumbnail?: RailProps["renderThumbnail"];
  subscribe?: RailProps["subscribe"];
  /** Uncontrolled seed. Defaults to DUMMY_STORIES. */
  defaultItems?: StoryRailItem[];
  /** Controlled mode: pass `items` together with `onItemsChange`. */
  items?: StoryRailItem[];
  onItemsChange?: RailProps["onItemsChange"];
  onPreviewError?: RailProps["onPreviewError"];
  arrows?: RailProps["arrows"];
  dir?: RailProps["dir"];
  labels?: RailProps["labels"];
  /** Custom `leading` node; wins over `showAddLeading`. */
  leading?: RailProps["leading"];
  /** Lets a parent reach the rail handle too (controlled tab). */
  railRef?: React.RefObject<StoryRailHandle | null>;
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
  defaultItems,
  items,
  onItemsChange,
  onPreviewError,
  arrows,
  dir,
  labels,
  leading,
  railRef: externalRef,
}: RailWithViewerProps) {
  const ownRef = useRef<StoryRailHandle | null>(null);
  const railRef = externalRef ?? ownRef;
  const [activeIdx, setActiveIdx] = useState(-1);

  const controlled = items !== undefined && onItemsChange !== undefined;
  const seed = items ?? defaultItems ?? DUMMY_STORIES;
  const fullStories = useMemo(() => seed.map(toFullStory), [seed]);

  const leadingNode =
    leading ??
    (showAddLeading ? (
      <AddStoryThumbnail
        userAvatar={DUMMY_VIEWER_AVATAR}
        onClick={() => log("add-story", null)}
      />
    ) : undefined);

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-3">
      <StoryRail
        ref={railRef}
        {...(controlled ? { items, onItemsChange } : { defaultItems: seed })}
        framed={framed}
        leading={leadingNode}
        renderThumbnail={renderThumbnail}
        subscribe={subscribe}
        onSubscribeDelta={subscribe ? (d) => log("delta", d) : undefined}
        onPreviewError={onPreviewError}
        arrows={arrows}
        dir={dir}
        labels={labels}
        onItemClick={({ item, index }) => {
          log("click", { item, index });
          setActiveIdx(index);
        }}
      />

      {activeIdx >= 0 && fullStories[activeIdx] ? (
        <StoryViewer
          stories={fullStories}
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
          {item.previewImage ? (
            <img
              src={item.previewImage}
              alt=""
              className="h-full w-full object-cover"
              style={{
                filter: isUnread ? "saturate(1.1)" : "saturate(0.4)",
              }}
            />
          ) : (
            <span aria-hidden="true" className="h-full w-full bg-muted" />
          )}
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
      <StoryRail defaultItems={items} />
    </div>
  );
}

const BROKEN_URL =
  "https://images.unsplash.com/photo-0000000000000-broken?w=200";
const RECOVERED_URL =
  "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=400&h=600&fit=crop&q=80";

const FALLBACK_ITEMS: StoryRailItem[] = [
  {
    id: "fb-none",
    userId: "fb1",
    username: "no-preview",
    avatar: DUMMY_STORIES[0]?.avatar,
    hasUnread: true,
  },
  {
    id: "fb-muted",
    userId: "fb2",
    username: "muted",
    avatar: DUMMY_STORIES[1]?.avatar,
    previewImage: DUMMY_STORIES[1]?.previewImage,
    hasUnread: true,
    muted: true,
  },
  {
    id: "fb-recover",
    userId: "fb3",
    username: "recovers",
    avatar: DUMMY_STORIES[2]?.avatar,
    previewImage: BROKEN_URL,
    hasUnread: true,
  },
  {
    id: "fb-dead",
    userId: "fb4",
    username: "stays-broken",
    avatar: DUMMY_STORIES[3]?.avatar,
    previewImage: BROKEN_URL,
    hasUnread: true,
  },
];

async function resolvePreview(item: StoryRailItem): Promise<string | void> {
  log("preview-error", item.id);
  // "recovers" gets a fresh URL (think: a re-signed one). Everything else
  // resolves nothing, so the rail falls back to the avatar card.
  if (item.id === "fb-recover") return RECOVERED_URL;
}

function FallbacksTab() {
  return (
    <div className="flex flex-col gap-3">
      <RailWithViewer
        defaultItems={FALLBACK_ITEMS}
        onPreviewError={resolvePreview}
      />
      <p className="mx-auto max-w-2xl text-xs text-muted-foreground">
        1: no <code>previewImage</code> (avatar card). 2: <code>muted</code> +
        unread (grey ring). 3: broken URL, <code>onPreviewError</code> resolves
        a working one. 4: broken URL, nothing resolves, so the avatar card.
      </p>
    </div>
  );
}

let nextControlledId = 1;

function ControlledTab() {
  const railRef = useRef<StoryRailHandle | null>(null);
  const [items, setItems] = useState<StoryRailItem[]>(() =>
    DUMMY_STORIES.slice(0, 6),
  );
  const unread = items.filter((i) => i.hasUnread && !i.muted).length;

  const addStory = () =>
    setItems((prev) => {
      const n = nextControlledId++;
      const src = DUMMY_STORIES[(prev.length + n) % DUMMY_STORIES.length];
      return [
        {
          ...src,
          id: `ctl-${n}`,
          userId: `ctl-u${n}`,
          username: `new${n}`,
          hasUnread: true,
          muted: false,
        },
        ...prev,
      ];
    });
  const flipFirst = () =>
    setItems((prev) =>
      prev.map((it, i) => (i === 0 ? { ...it, hasUnread: !it.hasUnread } : it)),
    );
  const reorder = () =>
    setItems((prev) => (prev.length > 1 ? [...prev.slice(1), prev[0]] : prev));

  return (
    <div className="flex flex-col gap-3">
      <RailWithViewer
        railRef={railRef}
        items={items}
        onItemsChange={(next) => {
          log("items-change", next.length);
          setItems(next);
        }}
      />
      <div className="mx-auto flex w-full max-w-2xl flex-wrap items-center gap-2">
        <Button size="sm" variant="outline" onClick={addStory}>
          Add story
        </Button>
        <Button size="sm" variant="outline" onClick={flipFirst}>
          Flip first unread
        </Button>
        <Button size="sm" variant="outline" onClick={reorder}>
          Reorder
        </Button>
        <span
          data-testid="controlled-unread-count"
          className="ms-auto font-mono text-xs text-muted-foreground"
        >
          {unread} unread / {items.length} total
        </span>
      </div>
      <p className="mx-auto max-w-2xl text-xs text-muted-foreground">
        Parent state owns the list. Open a story: the viewer calls{" "}
        <code>markViewed</code>, the rail reports it through{" "}
        <code>onItemsChange</code>, and the count above drops.
      </p>
    </div>
  );
}

function ArrowsTab() {
  const items = useMemo<StoryRailItem[]>(
    () =>
      Array.from({ length: 16 }, (_, i) => {
        const base = DUMMY_STORIES[i % DUMMY_STORIES.length];
        return { ...base, id: `arr-${i}`, username: `${base.username}${i + 1}` };
      }),
    [],
  );
  return (
    <div className="flex flex-col gap-3">
      <RailWithViewer defaultItems={items} arrows="always" showAddLeading />
      <p className="mx-auto max-w-2xl text-xs text-muted-foreground">
        <code>arrows=&quot;always&quot;</code> shows on touch screens too;
        production consumers typically use{" "}
        <code>arrows=&quot;fine-pointer&quot;</code>.
      </p>
    </div>
  );
}

const RTL_LABELS: NonNullable<RailProps["labels"]> = {
  railLabel: "القصص",
  addStoryLabel: "أضف قصة",
  addStoryAriaLabel: "أضف قصة جديدة",
  previousLabel: "القصص السابقة",
  nextLabel: "القصص التالية",
  thumbnailAriaLabel: (item) =>
    item.muted
      ? `${item.username}، مكتومة`
      : item.hasUnread
        ? `${item.username}، قصة غير مقروءة`
        : `${item.username}، تمت المشاهدة`,
  emptyState: "لا توجد قصص بعد.",
};

function RtlTab() {
  const items = useMemo<StoryRailItem[]>(
    () =>
      Array.from({ length: 12 }, (_, i) => {
        const base = DUMMY_STORIES[i % DUMMY_STORIES.length];
        return { ...base, id: `rtl-${i}`, username: `${base.username}${i + 1}` };
      }),
    [],
  );
  return (
    <div dir="rtl">
      <RailWithViewer
        defaultItems={items}
        arrows="always"
        labels={RTL_LABELS}
        leading={
          <AddStoryThumbnail
            userAvatar={DUMMY_VIEWER_AVATAR}
            onClick={() => log("add-story", null)}
          />
        }
      />
    </div>
  );
}

export default function StoryRailDemo() {
  return (
    <Tabs defaultValue="default" className="w-full">
      <SwipeTabsList>
        <TabsTrigger value="default">Default</TabsTrigger>
        <TabsTrigger value="add">+ Add</TabsTrigger>
        <TabsTrigger value="mixed">Mixed</TabsTrigger>
        <TabsTrigger value="realtime">Realtime</TabsTrigger>
        <TabsTrigger value="custom">Custom</TabsTrigger>
        <TabsTrigger value="bare">Bare</TabsTrigger>
        <TabsTrigger value="empty">Empty</TabsTrigger>
        <TabsTrigger value="fallbacks">Fallbacks</TabsTrigger>
        <TabsTrigger value="controlled">Controlled</TabsTrigger>
        <TabsTrigger value="arrows">Arrows</TabsTrigger>
        <TabsTrigger value="rtl">RTL</TabsTrigger>
      </SwipeTabsList>
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
      <TabsContent value="fallbacks" className="mt-4">
        <FallbacksTab />
      </TabsContent>
      <TabsContent value="controlled" className="mt-4">
        <ControlledTab />
      </TabsContent>
      <TabsContent value="arrows" className="mt-4">
        <ArrowsTab />
      </TabsContent>
      <TabsContent value="rtl" className="mt-4">
        <RtlTab />
      </TabsContent>
    </Tabs>
  );
}
