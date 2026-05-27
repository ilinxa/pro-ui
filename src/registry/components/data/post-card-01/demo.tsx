"use client";

import { useMemo, useRef, useState } from "react";
import { Wand2 } from "lucide-react";
import { Tabs, TabsContent, TabsTrigger } from "@/components/ui/tabs";
import { SwipeTabsList } from "@/components/site/swipe-tabs-list";
import { PostCard01 } from "./post-card-01";
import { defaultPostEngagementActions } from "./lib/defaults";
import {
  DUMMY_DETAIL_THREAD,
  DUMMY_FEATURED_POST,
  DUMMY_LIKERS,
  DUMMY_LINK_PREVIEW_POST,
  DUMMY_LONG_TEXT_POST,
  DUMMY_MIXED_MEDIA_POST,
  DUMMY_MULTI_IMAGE_POST,
  DUMMY_PINNED_POST,
  DUMMY_POLL_CLOSED_POST,
  DUMMY_POLL_POST,
  DUMMY_POLL_VOTED_POST,
  DUMMY_REPLY_POST,
  DUMMY_REPOST_POST,
  DUMMY_RICH_POST,
  DUMMY_SENSITIVE_POST,
  DUMMY_SINGLE_IMAGE_POST,
  DUMMY_TEXT_ONLY_POST,
  DUMMY_VIDEO_POST,
  DUMMY_VIEWER,
  createDummyCommentSubscribe,
  createDummyEngagementSubscribe,
  generateMoreLikers,
} from "./dummy-data";
import type { CommentMenuItem } from "@/registry/components/data/comment-thread-01";
import type { EngagementAction } from "@/registry/components/data/engagement-bar-01";

function log(tag: string, payload: unknown) {
  if (typeof console !== "undefined") {
    console.log(`[demo:post-card:${tag}]`, payload);
  }
}

function FeedTab() {
  const likersPageRef = useRef(1);
  return (
    <div className="mx-auto max-w-xl">
      <PostCard01
        variant="feed"
        post={DUMMY_MULTI_IMAGE_POST}
        currentUser={DUMMY_VIEWER}
        likers={DUMMY_LIKERS}
        commentThread={DUMMY_DETAIL_THREAD}
        shareSuggestions={DUMMY_LIKERS}
        onShareTo={(id, user) => log("share-to", { id, user })}
        onLike={(id, liked) => log("like", { id, liked })}
        onBookmark={(id, bookmarked) => log("bookmark", { id, bookmarked })}
        onReport={(id) => log("report", id)}
        onAddComment={async (content, parentId) => {
          log("add-comment", { content, parentId });
        }}
        onLikeComment={(id, liked) => log("like-comment", { id, liked })}
        onDeleteComment={(id) => log("delete-comment", id)}
        onLoadMoreLikers={async () => {
          await new Promise((r) => setTimeout(r, 300));
          likersPageRef.current += 1;
          return generateMoreLikers(likersPageRef.current);
        }}
        getHref={(p) => `/posts/${p.id}`}
      />
    </div>
  );
}

function VideoTab() {
  return (
    <div className="mx-auto max-w-xl">
      <PostCard01
        variant="feed"
        post={DUMMY_VIDEO_POST}
        currentUser={DUMMY_VIEWER}
        likers={DUMMY_LIKERS}
        commentThread={DUMMY_DETAIL_THREAD}
        shareSuggestions={DUMMY_LIKERS}
        onShareTo={(id, user) => log("share-to", { id, user })}
        onLike={(id, liked) => log("like", { id, liked })}
        onBookmark={(id, bookmarked) => log("bookmark", { id, bookmarked })}
      />
    </div>
  );
}

function CompactTab() {
  return (
    <div className="mx-auto max-w-sm">
      <PostCard01
        variant="compact"
        post={DUMMY_SINGLE_IMAGE_POST}
        onLike={(id, liked) => log("like", { id, liked })}
        onComment={(id) => log("comment", id)}
        getHref={(p) => `/posts/${p.id}`}
      />
    </div>
  );
}

function ListTab() {
  return (
    <div className="flex flex-col gap-3">
      <PostCard01
        variant="list"
        post={DUMMY_FEATURED_POST}
        kebabActions={(p) => [
          { label: "Pin to top", onClick: () => log("pin", p.id) },
          {
            label: "Take down",
            destructive: true,
            onClick: () => log("takedown", p.id),
          },
        ]}
        getHref={(p) => `/posts/${p.id}`}
      />
      <PostCard01
        variant="list"
        post={DUMMY_TEXT_ONLY_POST}
        kebabActions={(p) => [
          { label: "Pin to top", onClick: () => log("pin", p.id) },
          { label: "Block author", onClick: () => log("block", p.author.id) },
        ]}
      />
    </div>
  );
}

function DetailTab() {
  // v0.2.0 — Detail tab demonstrates the full owner-side surface via
  // viewerMode="owner" + all 8 mutation handlers wired. The kebab will
  // render Edit / Pin / Change visibility / Mark sensitive / See analytics /
  // Bookmark / Share / Copy link / [sep] / Delete.
  return (
    <div className="mx-auto max-w-2xl">
      <PostCard01
        variant="detail"
        post={DUMMY_PINNED_POST}
        currentUser={DUMMY_VIEWER}
        commentThread={DUMMY_DETAIL_THREAD}
        viewerMode="owner"
        onLike={(id, liked) => log("like", { id, liked })}
        onShare={(id) => log("share", id)}
        onBookmark={(id, bookmarked) => log("bookmark", { id, bookmarked })}
        onEdit={(id) => log("edit", id)}
        onDelete={(id) => log("delete", id)}
        onPin={(id, next) => log("pin", { id, next })}
        onChangeVisibility={(id, current) =>
          log("change-visibility", { id, current })
        }
        onMarkSensitive={(id, next) => log("mark-sensitive", { id, next })}
        onSeeAnalytics={(id) => log("see-analytics", id)}
        onAddComment={async (content, parentId) => {
          log("add-comment", { content, parentId });
        }}
        onLikeComment={(id, liked) =>
          log("like-comment", { id, liked })
        }
        onDeleteComment={(id) => log("delete-comment", id)}
        onReportComment={(id) => log("report-comment", id)}
        getHref={(p) => `/posts/${p.id}`}
      />
    </div>
  );
}

// ─── v0.2.0 tabs ──────────────────────────────────────────────────────────

function RepostTab() {
  // Showcases the nested repost mini-card (Q-D3 / Q-P30). Outer post is a
  // public viewer-mode repost; nested mini-card is the original FEATURED post
  // with engagementActions={()=>[]} suppressing the inner bar.
  return (
    <div className="mx-auto max-w-xl">
      <PostCard01
        variant="feed"
        post={DUMMY_REPOST_POST}
        currentUser={DUMMY_VIEWER}
        viewerMode="viewer"
        onLike={(id, liked) => log("like", { id, liked })}
        onShare={(id) => log("share", id)}
        onBookmark={(id, bookmarked) => log("bookmark", { id, bookmarked })}
        onRepostOfClick={(orig) => log("repost-of-click", orig.id)}
        getHref={(p) => `/posts/${p.id}`}
      />
    </div>
  );
}

function PollTab() {
  // Three cards stacked: active poll (vote view) → voted poll (results view
  // with viewer choice highlighted) → closed poll (results + closed label).
  return (
    <div className="mx-auto flex max-w-xl flex-col gap-4">
      <PostCard01
        variant="feed"
        post={DUMMY_POLL_POST}
        currentUser={DUMMY_VIEWER}
        viewerMode="viewer"
        onVotePoll={(id, optionId) => log("vote-poll", { id, optionId })}
        onLike={(id, liked) => log("like", { id, liked })}
      />
      <PostCard01
        variant="feed"
        post={DUMMY_POLL_VOTED_POST}
        currentUser={DUMMY_VIEWER}
        viewerMode="viewer"
        onLike={(id, liked) => log("like", { id, liked })}
      />
      <PostCard01
        variant="feed"
        post={DUMMY_POLL_CLOSED_POST}
        currentUser={DUMMY_VIEWER}
        viewerMode="viewer"
        onLike={(id, liked) => log("like", { id, liked })}
      />
    </div>
  );
}

function SensitiveTab() {
  // Two cards: sensitive gate (viewer taps Show) + link-preview card + rich
  // header (visibility / edited / location / mentions / tags).
  return (
    <div className="mx-auto flex max-w-xl flex-col gap-4">
      <PostCard01
        variant="feed"
        post={DUMMY_SENSITIVE_POST}
        currentUser={DUMMY_VIEWER}
        viewerMode="viewer"
        onLike={(id, liked) => log("like", { id, liked })}
        onRevealSensitive={(id) => log("reveal-sensitive", id)}
      />
      <PostCard01
        variant="feed"
        post={DUMMY_LINK_PREVIEW_POST}
        currentUser={DUMMY_VIEWER}
        viewerMode="viewer"
        onLike={(id, liked) => log("like", { id, liked })}
        onLinkPreviewClick={(url) => log("link-preview-click", url)}
      />
      <PostCard01
        variant="feed"
        post={DUMMY_RICH_POST}
        currentUser={DUMMY_VIEWER}
        viewerMode="viewer"
        onLike={(id, liked) => log("like", { id, liked })}
        onLocationClick={(loc) => log("location-click", loc)}
        onMentionClick={(mid) => log("mention-click", mid)}
        onTagClick={(tag) => log("tag-click", tag)}
      />
      <PostCard01
        variant="feed"
        post={DUMMY_REPLY_POST}
        currentUser={DUMMY_VIEWER}
        viewerMode="viewer"
        onLike={(id, liked) => log("like", { id, liked })}
        onMentionClick={(mid) => log("reply-mention-click", mid)}
      />
    </div>
  );
}

function TextOnlyTab() {
  return (
    <div className="mx-auto max-w-xl">
      <PostCard01
        variant="feed"
        post={DUMMY_LONG_TEXT_POST}
        currentUser={DUMMY_VIEWER}
        onLike={(id, liked) => log("like", { id, liked })}
        onComment={(id) => log("comment", id)}
        onShare={(id) => log("share", id)}
        onBookmark={(id, bookmarked) => log("bookmark", { id, bookmarked })}
      />
    </div>
  );
}

function RealtimeTab() {
  const engagementSubscribe = useMemo(
    () => createDummyEngagementSubscribe(),
    [],
  );
  const commentSubscribe = useMemo(() => createDummyCommentSubscribe(), []);
  return (
    <div className="mx-auto max-w-xl">
      <PostCard01
        variant="detail"
        post={DUMMY_VIDEO_POST}
        currentUser={DUMMY_VIEWER}
        commentThread={DUMMY_DETAIL_THREAD}
        engagementSubscribe={engagementSubscribe}
        commentSubscribe={commentSubscribe}
        onSubscribeEngagementDelta={(d) => log("engagement-delta", d)}
        onSubscribeCommentDelta={(d) => log("comment-delta", d)}
        onLike={(id, liked) => log("like", { id, liked })}
        onAddComment={async (content) => {
          log("add-comment", content);
        }}
      />
    </div>
  );
}

function InlineEngagementTab() {
  // TR-localized variant — same panels, kasder labels.
  const likersPageRef = useRef(1);
  return (
    <div className="mx-auto max-w-xl">
      <PostCard01
        variant="feed"
        post={DUMMY_MULTI_IMAGE_POST}
        currentUser={DUMMY_VIEWER}
        likers={DUMMY_LIKERS}
        commentThread={DUMMY_DETAIL_THREAD}
        shareSuggestions={DUMMY_LIKERS}
        onShareTo={(id, user) => log("share-to", { id, user })}
        onLoadMoreLikers={async () => {
          await new Promise((r) => setTimeout(r, 300));
          likersPageRef.current += 1;
          return generateMoreLikers(likersPageRef.current);
        }}
        onLike={(id, liked) => log("like", { id, liked })}
        onBookmark={(id, b) => log("bookmark", { id, b })}
        onAddComment={async (content, parentId) => {
          log("add-comment", { content, parentId });
        }}
        onLikeComment={(id, liked) => log("like-comment", { id, liked })}
        onDeleteComment={(id) => log("delete-comment", id)}
        onReportComment={(id) => log("report-comment", id)}
        onLoadMoreComments={async () => {
          await new Promise((r) => setTimeout(r, 300));
          return [];
        }}
        labels={{
          likersHeading: "Beğenenler",
          shareHeading: "Şununla paylaş…",
          shareSearchPlaceholder: "Kişi ara…",
          shareEmptyLabel: "Eşleşme yok.",
          hidePanelLabel: "Gizle",
          commentLabels: { reply: "Yanıtla", like: "Beğen" },
        }}
      />
    </div>
  );
}

function CustomActionsTab() {
  const [extras] = useState({ remixActive: false });
  return (
    <div className="mx-auto max-w-xl">
      <PostCard01
        variant="feed"
        post={DUMMY_MIXED_MEDIA_POST}
        currentUser={DUMMY_VIEWER}
        onLike={(id, liked) => log("like", { id, liked })}
        onComment={(id) => log("comment", id)}
        onShare={(id) => log("share", id)}
        onBookmark={(id, bookmarked) => log("bookmark", { id, bookmarked })}
        engagementActions={(p, h, v): EngagementAction[] => [
          ...defaultPostEngagementActions(p, h, v),
          {
            kind: "custom",
            id: "remix",
            label: "Remix",
            icon: <Wand2 className="h-4 w-4" />,
            active: extras.remixActive,
            onClick: () => log("remix", p.id),
          },
        ]}
        kebabActions={(p): CommentMenuItem[] => [
          { label: "Pin", onClick: () => log("pin", p.id) },
          { label: "Translate", onClick: () => log("translate", p.id) },
          {
            label: "Block author",
            onClick: () => log("block", p.author.id),
          },
          {
            label: "Report",
            destructive: true,
            onClick: () => log("report", p.id),
          },
        ]}
      />
    </div>
  );
}

export default function PostCard01Demo() {
  return (
    <Tabs defaultValue="feed" className="w-full">
      <SwipeTabsList>
        <TabsTrigger value="feed">Feed</TabsTrigger>
        <TabsTrigger value="compact">Compact</TabsTrigger>
        <TabsTrigger value="list">List</TabsTrigger>
        <TabsTrigger value="detail">Detail</TabsTrigger>
        <TabsTrigger value="text">Text-only</TabsTrigger>
        <TabsTrigger value="video">Video</TabsTrigger>
        <TabsTrigger value="realtime">Realtime</TabsTrigger>
        <TabsTrigger value="inline">Inline TR</TabsTrigger>
        <TabsTrigger value="custom">Custom</TabsTrigger>
        <TabsTrigger value="repost">Repost</TabsTrigger>
        <TabsTrigger value="poll">Poll</TabsTrigger>
        <TabsTrigger value="sensitive">Sensitive</TabsTrigger>
      </SwipeTabsList>
      <TabsContent value="feed" className="mt-4">
        <FeedTab />
      </TabsContent>
      <TabsContent value="compact" className="mt-4">
        <CompactTab />
      </TabsContent>
      <TabsContent value="list" className="mt-4">
        <ListTab />
      </TabsContent>
      <TabsContent value="detail" className="mt-4">
        <DetailTab />
      </TabsContent>
      <TabsContent value="text" className="mt-4">
        <TextOnlyTab />
      </TabsContent>
      <TabsContent value="video" className="mt-4">
        <VideoTab />
      </TabsContent>
      <TabsContent value="realtime" className="mt-4">
        <RealtimeTab />
      </TabsContent>
      <TabsContent value="inline" className="mt-4">
        <InlineEngagementTab />
      </TabsContent>
      <TabsContent value="custom" className="mt-4">
        <CustomActionsTab />
      </TabsContent>
      <TabsContent value="repost" className="mt-4">
        <RepostTab />
      </TabsContent>
      <TabsContent value="poll" className="mt-4">
        <PollTab />
      </TabsContent>
      <TabsContent value="sensitive" className="mt-4">
        <SensitiveTab />
      </TabsContent>
    </Tabs>
  );
}
