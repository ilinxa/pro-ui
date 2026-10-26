"use client";

import { useMemo, useRef, useState } from "react";
import { Lock, Star, Trash2, Wand2 } from "lucide-react";
import { Tabs, TabsContent, TabsTrigger } from "@/components/ui/tabs";
import { SwipeTabsList } from "@/components/site/swipe-tabs-list";
import { PostCard } from "./post-card";
import { defaultPostEngagementActions } from "./lib/defaults";
import {
  DUMMY_CURSOR_COMMENTS,
  DUMMY_DETAIL_THREAD,
  DUMMY_NOW,
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
  DUMMY_REACTION_KINDS,
  DUMMY_REPLY_POST,
  DUMMY_REPOST_POST,
  DUMMY_RICH_POST,
  DUMMY_RTL_POST,
  DUMMY_RTL_THREAD,
  DUMMY_SENSITIVE_POST,
  DUMMY_SINGLE_IMAGE_POST,
  DUMMY_TEXT_ONLY_POST,
  DUMMY_VIDEO_POST,
  DUMMY_VIEWER,
  createDummyCommentSubscribe,
  createDummyEngagementSubscribe,
  generateMoreLikers,
  loadDummyCommentPage,
} from "./dummy-data";
import type { Post, PostCardLabels, PostChange, PostMediaProps } from "./types";
import type { CommentMenuItem } from "@/registry/components/data/comment-thread";
import type { EngagementAction } from "@/registry/components/data/engagement-bar";

function log(tag: string, payload: unknown) {
  if (typeof console !== "undefined") {
    console.log(`[demo:post-card:${tag}]`, payload);
  }
}

// ─── Complete locale label sets (the Turkish and Arabic tabs show no English) ───────────

const TR_LABELS: PostCardLabels = {
  kebabAriaLabel: "Gönderi işlemleri",
  verifiedBadgeLabel: "Doğrulanmış hesap",
  pinnedBadgeLabel: "Sabitlendi",
  editedSuffix: "(düzenlendi)",
  bookmark: "Kaydet",
  unbookmark: "Kaydı kaldır",
  share: "Paylaş",
  copyLink: "Bağlantıyı kopyala",
  report: "Şikayet et",
  commentsHeading: "Yorumlar",
  likersHeading: "Beğenenler",
  likersMoreLabel: (_n, f) => `${f} kişi daha`,
  hidePanelLabel: "Gizle",
  shareHeading: "Şununla paylaş…",
  shareSearchPlaceholder: "Kişi ara…",
  shareEmptyLabel: "Eşleşme yok.",
  openRepost: (name) => `${name} gönderisini aç`,
  visibilityPublic: "Herkese açık",
  visibilityFollowers: "Takipçiler",
  visibilityFriends: "Arkadaşlar",
  visibilityCircle: "Yakın çevre",
  visibilityOnlyMe: "Yalnızca ben",
  visibilityPrivate: "Gizli",
  visibilityCustom: "Özel",
  pollHeading: "Anket",
  pollTotalVotesLabel: (_n, f) => `${f} oy`,
  pollClosesAtLabel: (t) => `Bitiş: ${t}`,
  pollClosedLabel: "Anket kapandı",
  listLikes: (_n, f) => `${f} beğeni`,
  listComments: (_n, f) => `${f} yorum`,
  listShares: (_n, f) => `${f} paylaşım`,
  textLabels: { showMore: "Devamını gör", showLess: "Daha az göster" },
  engagementLabels: {
    like: "Beğen",
    unlike: "Beğenmekten vazgeç",
    openLikersPanel: "Beğenenleri göster",
    comment: "Yorum yap",
    share: "Paylaş",
    bookmark: "Kaydet",
    unbookmark: "Kaydı kaldır",
    viewCount: "Görüntülenme",
  },
  likersLabels: { loadMore: "Daha fazla" },
  shareLabels: { searchLabel: "Kişi ara" },
  commentLabels: {
    composerPlaceholder: "Yorum yaz…",
    composerSend: "Gönder",
    composerCancel: "Vazgeç",
    reply: "Yanıtla",
    like: "Beğen",
    unlike: "Beğenmekten vazgeç",
    delete: "Sil",
    report: "Şikayet et",
    loadMore: "Daha eski yorumları yükle",
    emptyState: "Henüz yorum yok.",
    kebabAriaLabel: (name) => `${name} yorumu için işlemler`,
    replyTo: (name) => `${name} adlı kişiye yanıt`,
    viewReplies: (n) => `${n} yanıtı gör`,
  },
};

const TR_MEDIA_PROPS: PostMediaProps = {
  labels: {
    carouselLabel: "Medya galerisi",
    previousSlide: "Önceki",
    nextSlide: "Sonraki",
    goToSlide: (position) => `${position}. görsele git`,
    slideAriaLabel: (position, total) => `${position} / ${total}`,
    carouselRoleDescription: "galeri",
    slideRoleDescription: "görsel",
  },
};

const AR_LABELS: PostCardLabels = {
  kebabAriaLabel: "إجراءات المنشور",
  verifiedBadgeLabel: "حساب موثّق",
  pinnedBadgeLabel: "مثبّت",
  editedSuffix: "(معدّل)",
  bookmark: "حفظ",
  unbookmark: "إزالة الحفظ",
  share: "مشاركة",
  copyLink: "نسخ الرابط",
  report: "إبلاغ",
  commentsHeading: "التعليقات",
  likersHeading: "المعجبون",
  hidePanelLabel: "إخفاء",
  openRepost: (name) => `فتح منشور ${name}`,
  visibilityPublic: "عام",
  visibilityFollowers: "المتابعون",
  visibilityFriends: "الأصدقاء",
  visibilityCircle: "الدائرة المقرّبة",
  visibilityOnlyMe: "أنا فقط",
  visibilityPrivate: "خاص",
  visibilityCustom: "مخصّص",
  pollHeading: "استطلاع",
  pollTotalVotesLabel: (_n, f) => `${f} صوت`,
  pollClosesAtLabel: (t) => `ينتهي ${t}`,
  pollClosedLabel: "انتهى الاستطلاع",
  textLabels: { showMore: "عرض المزيد", showLess: "عرض أقل" },
  engagementLabels: {
    like: "أعجبني",
    unlike: "إلغاء الإعجاب",
    openLikersPanel: "عرض المعجبين",
    comment: "تعليق",
    share: "مشاركة",
    bookmark: "حفظ",
    unbookmark: "إزالة الحفظ",
    viewCount: "المشاهدات",
  },
  commentLabels: {
    composerPlaceholder: "اكتب تعليقاً…",
    composerSend: "إرسال",
    composerCancel: "إلغاء",
    reply: "ردّ",
    like: "أعجبني",
    unlike: "إلغاء الإعجاب",
    delete: "حذف",
    report: "إبلاغ",
    loadMore: "تحميل تعليقات أقدم",
    emptyState: "لا توجد تعليقات بعد.",
    kebabAriaLabel: (name) => `إجراءات تعليق ${name}`,
    replyTo: (name) => `الرد على ${name}`,
    viewReplies: (n) => `عرض ${n} ردود`,
  },
};

const AR_MEDIA_PROPS: PostMediaProps = {
  labels: {
    carouselLabel: "معرض الوسائط",
    previousSlide: "السابق",
    nextSlide: "التالي",
    goToSlide: (position) => `الانتقال إلى الشريحة ${position}`,
    slideAriaLabel: (position, total) => `${position} من ${total}`,
    carouselRoleDescription: "معرض",
    slideRoleDescription: "شريحة",
  },
};

function FeedTab() {
  const likersPageRef = useRef(1);
  return (
    <div className="mx-auto max-w-xl">
      <PostCard
        now={DUMMY_NOW}
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
      <PostCard
        now={DUMMY_NOW}
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
      <PostCard
        now={DUMMY_NOW}
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
      <PostCard
        now={DUMMY_NOW}
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
      <PostCard
        now={DUMMY_NOW}
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
      <PostCard
        now={DUMMY_NOW}
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
      <PostCard
        now={DUMMY_NOW}
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
      <PostCard
        now={DUMMY_NOW}
        variant="feed"
        post={DUMMY_POLL_POST}
        currentUser={DUMMY_VIEWER}
        viewerMode="viewer"
        onVotePoll={(id, optionId) => log("vote-poll", { id, optionId })}
        onLike={(id, liked) => log("like", { id, liked })}
      />
      <PostCard
        now={DUMMY_NOW}
        variant="feed"
        post={DUMMY_POLL_VOTED_POST}
        currentUser={DUMMY_VIEWER}
        viewerMode="viewer"
        onLike={(id, liked) => log("like", { id, liked })}
      />
      <PostCard
        now={DUMMY_NOW}
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
      <PostCard
        now={DUMMY_NOW}
        variant="feed"
        post={DUMMY_SENSITIVE_POST}
        currentUser={DUMMY_VIEWER}
        viewerMode="viewer"
        onLike={(id, liked) => log("like", { id, liked })}
        onRevealSensitive={(id) => log("reveal-sensitive", id)}
      />
      <PostCard
        now={DUMMY_NOW}
        variant="feed"
        post={DUMMY_LINK_PREVIEW_POST}
        currentUser={DUMMY_VIEWER}
        viewerMode="viewer"
        onLike={(id, liked) => log("like", { id, liked })}
        onLinkPreviewClick={(url) => log("link-preview-click", url)}
      />
      <PostCard
        now={DUMMY_NOW}
        variant="feed"
        post={DUMMY_RICH_POST}
        currentUser={DUMMY_VIEWER}
        viewerMode="viewer"
        onLike={(id, liked) => log("like", { id, liked })}
        onLocationClick={(loc) => log("location-click", loc)}
        onMentionClick={(mid) => log("mention-click", mid)}
        onTagClick={(tag) => log("tag-click", tag)}
      />
      <PostCard
        now={DUMMY_NOW}
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
      <PostCard
        now={DUMMY_NOW}
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
      <PostCard
        now={DUMMY_NOW}
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
      <PostCard
        now={DUMMY_NOW}
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
        locale="tr"
        mediaProps={TR_MEDIA_PROPS}
        labels={TR_LABELS}
      />
    </div>
  );
}

// ─── 0.6.0 tabs ───────────────────────────────────────────────────────────

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function ControlledTab() {
  // The host owns the post. `onPostChange` fires once a request is accepted; the card shows the
  // like at once while the promise is in flight, and a rejection rolls it back without reporting.
  const [post, setPost] = useState<Post>(DUMMY_MULTI_IMAGE_POST);
  const [failNext, setFailNext] = useState(false);
  const [lastChange, setLastChange] = useState<PostChange | null>(null);
  return (
    <div className="mx-auto flex max-w-xl flex-col gap-3">
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={failNext}
          onChange={(e) => setFailNext(e.target.checked)}
        />
        Reject the next like / bookmark (rolls back, nothing is reported)
      </label>
      <PostCard
        now={DUMMY_NOW}
        variant="feed"
        post={post}
        currentUser={DUMMY_VIEWER}
        engagementMode="navigate"
        onPostChange={(next, change) => {
          setPost(next);
          setLastChange(change);
        }}
        onLike={async (id, liked) => {
          log("like", { id, liked });
          await sleep(700);
          if (failNext) throw new Error("server said no");
        }}
        onBookmark={async (id, bookmarked) => {
          log("bookmark", { id, bookmarked });
          await sleep(700);
          if (failNext) throw new Error("server said no");
        }}
      />
      <pre className="overflow-x-auto rounded-md border border-border bg-muted p-3 font-mono text-xs">
        {`post prop   likes ${post.likes} · liked ${String(post.isLiked ?? false)} · bookmarked ${String(post.isBookmarked ?? false)}
last change ${lastChange ? JSON.stringify(lastChange) : "none yet"}`}
      </pre>
    </div>
  );
}

function ReactionsTab() {
  // `reactions` takes the like's place. Double-tap on the photos applies `defaultKind` when you
  // have no reaction yet; with one set it only plays the burst.
  const [viewerReaction, setViewerReaction] = useState<string | null>(null);
  const [counts, setCounts] = useState<Record<string, number>>(() =>
    Object.fromEntries(DUMMY_REACTION_KINDS.map((k) => [k.key, k.count ?? 0])),
  );
  const totalCount = Object.values(counts).reduce((sum, n) => sum + n, 0);
  return (
    <div className="mx-auto max-w-xl">
      <PostCard
        now={DUMMY_NOW}
        variant="feed"
        post={DUMMY_MULTI_IMAGE_POST}
        currentUser={DUMMY_VIEWER}
        engagementMode="navigate"
        reactions={{
          kinds: DUMMY_REACTION_KINDS,
          counts,
          totalCount,
          viewerReaction,
          defaultKind: "love",
          onReact: async (id, kind) => {
            log("react", { id, kind });
            await sleep(400);
            setCounts((c) => {
              const next = { ...c };
              if (viewerReaction) next[viewerReaction] = (next[viewerReaction] ?? 1) - 1;
              if (kind) next[kind] = (next[kind] ?? 0) + 1;
              return next;
            });
            setViewerReaction(kind);
          },
        }}
      />
    </div>
  );
}

function HeaderSlotsTab() {
  // Author link, subtitle, notice, an extra kebab item, a hidden item and a disabled one.
  return (
    <div className="mx-auto max-w-xl">
      <PostCard
        now={DUMMY_NOW}
        variant="feed"
        post={DUMMY_FEATURED_POST}
        currentUser={DUMMY_VIEWER}
        viewerMode="owner"
        engagementMode="navigate"
        permissions={{ disabled: { delete: true } }}
        getHref={(p) => `/posts/${p.id}`}
        getAuthorHref={(a) => `/people/${a.username ?? a.id}`}
        subtitle={() => "Community manager"}
        noticeSlot={() => (
          <p
            role="status"
            className="rounded-md border border-border bg-muted px-3 py-2 text-xs text-muted-foreground"
          >
            This post is under review.
          </p>
        )}
        extraKebabActions={(p): CommentMenuItem[] => [
          {
            label: "Boost post",
            icon: <Star className="h-4 w-4" />,
            separatorBefore: true,
            onClick: () => log("boost", p.id),
          },
          { label: "Internal note", hidden: true },
        ]}
        onEdit={(id) => log("edit", id)}
        onDelete={(id) => log("delete", id)}
        onBookmark={(id, bookmarked) => log("bookmark", { id, bookmarked })}
        labels={{ kebabAriaLabel: "More actions" }}
      />
    </div>
  );
}

function LocaleTab() {
  // One `locale` for the card and everything it composes; label functions carry the plurals.
  return (
    <div className="mx-auto flex max-w-xl flex-col gap-4">
      <PostCard
        now={DUMMY_NOW}
        variant="feed"
        post={DUMMY_POLL_POST}
        currentUser={DUMMY_VIEWER}
        engagementMode="navigate"
        locale="tr"
        onVotePoll={async (id, optionId) => {
          log("vote-poll", { id, optionId });
          await sleep(500);
        }}
        mediaProps={TR_MEDIA_PROPS}
        labels={TR_LABELS}
      />
      <PostCard
        now={DUMMY_NOW}
        variant="list"
        post={{ ...DUMMY_FEATURED_POST, likes: 12400 }}
        locale="tr"
        mediaProps={TR_MEDIA_PROPS}
        labels={TR_LABELS}
      />
    </div>
  );
}

function ThreadTab() {
  // `commentThreadProps` hands cursor paging (and anything else the thread takes) to the thread.
  return (
    <div className="mx-auto max-w-2xl">
      <PostCard
        now={DUMMY_NOW}
        variant="detail"
        post={DUMMY_PINNED_POST}
        currentUser={DUMMY_VIEWER}
        commentThread={DUMMY_CURSOR_COMMENTS.slice(0, 3)}
        commentPageSize={3}
        commentThreadProps={{
          onLoadMoreCursor: loadDummyCommentPage,
          onError: (error, context) => log("thread-error", { error, context }),
        }}
        onAddComment={async (content, parentId) => {
          log("add-comment", { content, parentId });
        }}
        onLikeComment={(id, liked) => log("like-comment", { id, liked })}
      />
    </div>
  );
}

function RtlTab() {
  // Direction comes from the surrounding element; `locale` picks Arabic digits and dates.
  return (
    <div dir="rtl" lang="ar" className="mx-auto flex max-w-xl flex-col gap-4">
      <PostCard
        now={DUMMY_NOW}
        variant="feed"
        post={DUMMY_RTL_POST}
        currentUser={{ id: "viewer-ar", name: "نور الهدى" }}
        engagementMode="navigate"
        locale="ar"
        getAuthorHref={(a) => `/people/${a.username}`}
        onLike={(id, liked) => log("like", { id, liked })}
        onVotePoll={(id, optionId) => log("vote-poll", { id, optionId })}
        mediaProps={AR_MEDIA_PROPS}
        labels={AR_LABELS}
      />
      <PostCard
        now={DUMMY_NOW}
        variant="detail"
        post={{ ...DUMMY_RTL_POST, id: "post-rtl-detail", poll: undefined }}
        currentUser={{ id: "viewer-ar", name: "نور الهدى" }}
        commentThread={DUMMY_RTL_THREAD}
        locale="ar"
        onAddComment={async (content) => {
          log("add-comment", content);
        }}
        mediaProps={AR_MEDIA_PROPS}
        labels={AR_LABELS}
      />
    </div>
  );
}

function ModeratorTab() {
  // v0.3.0 ILX-3 — viewer-mode card with moderator capability opted in via
  // `permissions={{ canModerate: true }}`. `moderatorActions(post)` supplies
  // the items; the library wraps them in a section between common items and
  // viewer-destructive items, with a divider above. `kebabActions` is left
  // unset so the role-aware default kebab assembly runs.
  return (
    <div className="mx-auto max-w-xl">
      <PostCard
        now={DUMMY_NOW}
        variant="feed"
        post={DUMMY_FEATURED_POST}
        currentUser={DUMMY_VIEWER}
        viewerMode="viewer"
        permissions={{ canModerate: true }}
        moderatorActions={(p): CommentMenuItem[] => [
          {
            label: "Feature post",
            icon: <Star className="h-4 w-4" />,
            onClick: () => log("mod:feature", p.id),
          },
          {
            label: "Lock comments",
            icon: <Lock className="h-4 w-4" />,
            onClick: () => log("mod:lock", p.id),
          },
          {
            label: "Remove post",
            icon: <Trash2 className="h-4 w-4" />,
            destructive: true,
            onClick: () => log("mod:remove", p.id),
          },
        ]}
        onLike={(id, liked) => log("like", { id, liked })}
        onShare={(id) => log("share", id)}
        onBookmark={(id, bookmarked) => log("bookmark", { id, bookmarked })}
        onReport={(id) => log("report", id)}
        onBlockAuthor={(authorId) => log("block-author", authorId)}
        onMuteAuthor={(authorId) => log("mute-author", authorId)}
        getHref={(p) => `/posts/${p.id}`}
      />
    </div>
  );
}

function CustomActionsTab() {
  const [extras] = useState({ remixActive: false });
  return (
    <div className="mx-auto max-w-xl">
      <PostCard
        now={DUMMY_NOW}
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

export default function PostCardDemo() {
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
        <TabsTrigger value="controlled">Controlled</TabsTrigger>
        <TabsTrigger value="reactions">Reactions</TabsTrigger>
        <TabsTrigger value="header">Header</TabsTrigger>
        <TabsTrigger value="locale">Locale TR</TabsTrigger>
        <TabsTrigger value="thread">Thread</TabsTrigger>
        <TabsTrigger value="rtl">RTL</TabsTrigger>
        <TabsTrigger value="custom">Custom</TabsTrigger>
        <TabsTrigger value="moderator">Moderator</TabsTrigger>
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
      <TabsContent value="controlled" className="mt-4">
        <ControlledTab />
      </TabsContent>
      <TabsContent value="reactions" className="mt-4">
        <ReactionsTab />
      </TabsContent>
      <TabsContent value="header" className="mt-4">
        <HeaderSlotsTab />
      </TabsContent>
      <TabsContent value="locale" className="mt-4">
        <LocaleTab />
      </TabsContent>
      <TabsContent value="thread" className="mt-4">
        <ThreadTab />
      </TabsContent>
      <TabsContent value="rtl" className="mt-4">
        <RtlTab />
      </TabsContent>
      <TabsContent value="custom" className="mt-4">
        <CustomActionsTab />
      </TabsContent>
      <TabsContent value="moderator" className="mt-4">
        <ModeratorTab />
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
