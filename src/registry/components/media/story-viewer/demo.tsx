"use client";

import { useMemo, useState } from "react";
import { Tabs, TabsContent, TabsTrigger } from "@/components/ui/tabs";
import { SwipeTabsList } from "@/components/site/swipe-tabs-list";
import { Button } from "@/components/ui/button";
import { StoryViewer } from "./story-viewer";
import {
  STORY_VIEWER_DUMMY,
  STORY_VIEWER_DUMMY_AR,
  STORY_VIEWER_DUMMY_CURRENT_USER,
  STORY_VIEWER_DUMMY_MUTED,
  STORY_VIEWER_DUMMY_REACTION_KINDS,
  STORY_VIEWER_DUMMY_VIEWERS,
} from "./dummy-data";
import { CommentThread } from "@/registry/components/data/comment-thread/comment-thread";
import {
  DUMMY_FLAT_COMMENTS,
  generateOlderPage,
} from "@/registry/components/data/comment-thread/dummy-data";
import { ShareMenu } from "@/registry/components/data/engagement-bar/parts/share-menu";
import { DUMMY_LIKE_USERS } from "@/registry/components/data/engagement-bar/dummy-data";
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

const IMAGE_ONLY: Story[] = [STORY_VIEWER_DUMMY[0]];
const VIDEO_ONLY: Story[] = [STORY_VIEWER_DUMMY[1]];
const MIXED: Story[] = [STORY_VIEWER_DUMMY[2]];
const ALL_STORIES: Story[] = STORY_VIEWER_DUMMY;
// 0.6.0 - a host-muted group sits between two others: sequential moves skip it.
const WITH_MUTED: Story[] = [
  STORY_VIEWER_DUMMY[0],
  STORY_VIEWER_DUMMY_MUTED,
  STORY_VIEWER_DUMMY[2],
];

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
      <StoryViewer
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
      <StoryViewer
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
      <StoryViewer
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
  const [disableCube, setDisableCube] = useState(false);
  const [duration, setDuration] = useState(400);
  return (
    <div className="flex flex-col items-center gap-3 py-8">
      <p className="px-6 text-center text-sm text-muted-foreground">
        Open from a specific starting story to see story-to-story navigation —
        v0.4 ships an Instagram-canonical 3D cube transition (auto-advance + ← →
        arrows + tap-zone spillover at last item + keyboard arrows). On touch +
        mouse, drag horizontally to swipe between stories (release commits past
        30% width or 0.5 px/ms velocity; otherwise snaps back).
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
      <div className="mt-2 flex flex-wrap items-center justify-center gap-4 text-xs text-muted-foreground">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={disableCube}
            onChange={(e) => setDisableCube(e.target.checked)}
            className="size-4"
          />
          <code>disableStoryTransition</code>
        </label>
        <label className="flex items-center gap-2">
          <span>
            <code>storyTransitionDurationMs</code>: {duration}
          </span>
          <input
            type="range"
            min={100}
            max={1000}
            step={50}
            value={duration}
            onChange={(e) => setDuration(Number(e.target.value))}
            className="w-32"
          />
        </label>
      </div>
      <StoryViewer
        stories={ALL_STORIES}
        initialStoryIndex={initialIdx}
        isOpen={open}
        onClose={() => setOpen(false)}
        onStoryViewed={(id) => log("story-viewed", id)}
        onAutoCloseAtEnd={() => log("auto-close-at-end", null)}
        disableStoryTransition={disableCube}
        storyTransitionDurationMs={duration}
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
      <StoryViewer
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
      <StoryViewer
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
          // 0.6.0: read `ctx.src` - it is `item.src`, or the URL `resolveMedia` /
          // `onMediaError` supplied. `item.src` can be absent for a resolved item.
          if (item.type === "image") {
            return <img src={ctx.src} alt="story" className="h-full w-full object-cover" />;
          }
          return (
            <video
              src={ctx.src}
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
      <StoryViewer
        stories={ALL_STORIES}
        initialStoryIndex={0}
        isOpen={open}
        onClose={() => setOpen(false)}
        viewerMode="viewer"
        currentUser={STORY_VIEWER_DUMMY_CURRENT_USER}
        reactionKinds={STORY_VIEWER_DUMMY_REACTION_KINDS}
        onLikeStory={(s, i, liked) => log("like", { s, i, liked })}
        onReactStory={(s, i, kind) => log("react", { s, i, kind })}
        onShareStory={(s, i) => log("share", { s, i })}
        onAddReply={(s, i, content) => log("reply", { s, i, content })}
        onReport={({ story, item }) => log("report", { story: story.id, item: item.id })}
        onBlockAuthor={(a) => log("block-author", a)}
        onCopyLink={({ story, item }) => log("copy-link", { story: story.id, item: item.id })}
        onAuthorClick={(s) => log("author-click", s.username)}
        renderHeaderBadge={(story) =>
          story.id === "story-1" ? (
            <span className="rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-medium text-primary-foreground">
              Close friends
            </span>
          ) : null
        }
        renderCommentsPanel={(story, item) => (
          <CommentThread
            comments={DUMMY_FLAT_COMMENTS}
            currentUser={{
              id: STORY_VIEWER_DUMMY_CURRENT_USER.id,
              name: STORY_VIEWER_DUMMY_CURRENT_USER.name,
              avatar: STORY_VIEWER_DUMMY_CURRENT_USER.avatar,
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
    () => async (
      itemId: string,
      cursor: string | null,
    ): Promise<{ items: ViewerListItem[]; nextCursor: string | null }> => {
      log("load-viewers", `${itemId} · ${cursor ?? "first page"}`);
      await new Promise((r) => setTimeout(r, 350));
      return { items: STORY_VIEWER_DUMMY_VIEWERS, nextCursor: null };
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
      <StoryViewer
        stories={ALL_STORIES}
        initialStoryIndex={0}
        isOpen={open}
        onClose={() => setOpen(false)}
        viewerMode="owner"
        onLoadViewers={onLoadViewers}
        onSaveToHighlights={({ story, item }) =>
          log("save-to-highlights", { story: story.id, item: item.id })
        }
        onDeleteStory={({ story, item }) => log("delete-story", { story: story.id, item: item.id })}
        onShareToFeed={({ story, item }) => log("share-to-feed", { story: story.id, item: item.id })}
        isSavedToHighlights={false}
      />
    </div>
  );
}

function MutedGroupTab() {
  const [open, setOpen] = useState(false);
  return (
    <div className="flex flex-col items-center gap-3 py-8">
      <p className="px-6 text-center text-sm text-muted-foreground">
        The middle group has <code>muted: true</code>: auto-advance, tap, arrow keys and swipe all
        skip it. Open it directly (<code>initialStoryIndex=1</code>) and it still plays.
      </p>
      <OpenButton label="Open (muted group skipped)" onClick={() => setOpen(true)} />
      <StoryViewer
        stories={WITH_MUTED}
        initialStoryIndex={0}
        isOpen={open}
        onClose={() => setOpen(false)}
        onCursorChange={(s, i) => log("cursor", { s, i })}
      />
    </div>
  );
}

function RtlTab() {
  const [open, setOpen] = useState(false);
  return (
    <div dir="rtl" lang="ar" className="flex flex-col items-center gap-3 py-8">
      <p className="px-6 text-center text-sm text-muted-foreground">
        الاتجاه من اليمين إلى اليسار: يتبدّل السهمان والسحب، وتنعكس أزرار التنقل، ويتبع الوصف
        اتجاه النص.
      </p>
      {/* The viewer renders in a portal: it reads the direction of the nearest [dir] (here the
          document), so the host sets dir on the document / app root as well. */}
      <OpenButton
        label="افتح القصص"
        onClick={() => {
          document.documentElement.dir = "rtl";
          setOpen(true);
        }}
      />
      <StoryViewer
        stories={STORY_VIEWER_DUMMY_AR}
        initialStoryIndex={0}
        isOpen={open}
        onClose={() => {
          setOpen(false);
          document.documentElement.removeAttribute("dir");
        }}
        locale="ar"
        viewerMode="viewer"
        currentUser={{ id: "user-current", name: "أنا" }}
        labels={{
          viewerLabel: "عارض القصص",
          play: "تشغيل",
          pause: "إيقاف مؤقت",
          mute: "كتم الصوت",
          unmute: "إلغاء الكتم",
          close: "إغلاق",
          prevStory: "القصة السابقة",
          nextStory: "القصة التالية",
          prevItem: "العنصر السابق",
          nextItem: "العنصر التالي",
          kebabAriaLabel: "إجراءات القصة",
          replyComposerPlaceholder: (s) => `الرد على ${s.username}…`,
          replyAriaLabel: (s) => `الرد على ${s.username}`,
          replyComposerSend: "إرسال",
          replyComposerCancel: "إلغاء",
          engagementShowLabel: "إظهار التفاعلات",
          engagementHideLabel: "إخفاء التفاعلات",
          report: "إبلاغ",
          copyLink: "نسخ الرابط",
          position: (author, index, total) => `${author}، ${index + 1} من ${total}`,
          itemImageAlt: (story, index, total) => `${story.username}، صورة القصة ${index + 1} من ${total}`,
          reactionPickerLabel: "اختر تفاعلاً",
          viewerCountLabel: (count, time, formatted) => `${formatted ?? count} مشاهدة · ${time}`,
          viewersHeading: "المشاهدون",
          viewersMoreLabel: (count) => `+${count} آخرون`,
          viewersLoading: "جارٍ تحميل المشاهدين…",
          viewersEmpty: "لا يوجد مشاهدون بعد.",
          viewersLoadMore: "تحميل المزيد",
          viewersError: "تعذّر تحميل المشاهدين.",
          viewersRetry: "إعادة المحاولة",
          saveToHighlights: "حفظ في المميزة",
          unsaveFromHighlights: "إزالة من المميزة",
          deleteStory: "حذف القصة",
          shareToFeed: "مشاركة في الخلاصة",
          blockAuthor: "حظر الكاتب",
          muteAuthor: "كتم الكاتب",
          openLink: "فتح الرابط",
          linkCloseLabel: "إغلاق الرابط",
          commentsHeading: "التعليقات",
          commentsCloseLabel: "إغلاق التعليقات",
          commentsDefaultEmptyState: "لا توجد تعليقات بعد. كن أول من يرد.",
          shareHeading: "مشاركة",
          shareCloseLabel: "إغلاق المشاركة",
          shareDefaultEmptyState: "لم يتم تحميل وجهات المشاركة بعد.",
          unavailable: "هذه القصة لم تعد متاحة",
          unavailableClose: "إغلاق",
          engagementLabels: {
            like: "إعجاب",
            unlike: "إلغاء الإعجاب",
            openLikersPanel: "عرض المعجبين",
            comment: "تعليق",
            share: "مشاركة",
            bookmark: "حفظ",
            unbookmark: "إزالة الحفظ",
            viewCount: "المشاهدات",
            react: "تفاعل",
            removeReaction: "إزالة التفاعل",
            openReactionsPanel: "عرض التفاعلات",
            reactionPickerLabel: "اختر تفاعلاً",
          },
          commentLabels: {
            composerPlaceholder: "اكتب تعليقاً…",
            composerSend: "إرسال",
            composerCancel: "إلغاء",
          },
        }}
        onReport={({ story, item }) => log("report", { story: story.id, item: item.id })}
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
      <StoryViewer
        stories={ALL_STORIES}
        initialStoryIndex={0}
        isOpen={open}
        onClose={() => setOpen(false)}
        viewerMode="viewer"
        currentUser={STORY_VIEWER_DUMMY_CURRENT_USER}
        reactionKinds={STORY_VIEWER_DUMMY_REACTION_KINDS}
        renderHeader={(story, _item, helpers) => (
          <div className="absolute top-4 right-4 left-4 z-20 flex items-center justify-between rounded-lg bg-media-overlay px-3 py-2 backdrop-blur-sm">
            <p className="text-sm font-semibold text-media-overlay-foreground">@{story.username}</p>
            <Button
              size="sm"
              variant="ghost"
              className="text-media-overlay-foreground hover:bg-media-overlay-foreground/20 hover:text-media-overlay-foreground"
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
                className="h-1 flex-1 overflow-hidden rounded-full bg-media-overlay-foreground/20"
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
          <div className="absolute right-3 bottom-20 z-30 flex flex-col items-center gap-3">
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
      <StoryViewer
        stories={[STORY_VIEWER_DUMMY[0]]}
        initialStoryIndex={0}
        isOpen={open}
        onClose={() => setOpen(false)}
        viewerMode="viewer"
        currentUser={STORY_VIEWER_DUMMY_CURRENT_USER}
        reactionKinds={STORY_VIEWER_DUMMY_REACTION_KINDS}
        onLinkClick={(s, i, url) => log("link-click", { s, i, url })}
        longPressThresholdMs={250}
      />
    </div>
  );
}

export default function StoryViewerDemo() {
  return (
    <Tabs defaultValue="image" className="w-full">
      <SwipeTabsList>
        <TabsTrigger value="image">Image only</TabsTrigger>
        <TabsTrigger value="video">Video only</TabsTrigger>
        <TabsTrigger value="mixed">Mixed</TabsTrigger>
        <TabsTrigger value="multi">Cube + swipe</TabsTrigger>
        <TabsTrigger value="realtime">Realtime</TabsTrigger>
        <TabsTrigger value="custom">Custom renderItem</TabsTrigger>
        <TabsTrigger value="viewer-mode">Viewer mode</TabsTrigger>
        <TabsTrigger value="owner-mode">Owner mode</TabsTrigger>
        <TabsTrigger value="muted">Muted group</TabsTrigger>
        <TabsTrigger value="rtl">RTL (Arabic)</TabsTrigger>
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
      <TabsContent value="muted"><MutedGroupTab /></TabsContent>
      <TabsContent value="rtl"><RtlTab /></TabsContent>
      <TabsContent value="custom-slots"><CustomSlotsTab /></TabsContent>
      <TabsContent value="link-longpress"><LinkAndLongPressTab /></TabsContent>
    </Tabs>
  );
}
