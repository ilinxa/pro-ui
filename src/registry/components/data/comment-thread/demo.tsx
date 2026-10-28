"use client";

import { useMemo, useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsTrigger } from "@/components/ui/tabs";
import { SwipeTabsList } from "@/components/site/swipe-tabs-list";
import { CommentThread } from "./comment-thread";
import { commentModeration } from "./features/moderation";
import type { Comment, CommentThreadHandle } from "./types";
import {
  DUMMY_CURSOR_FIRST_PAGE,
  DUMMY_FLAT_COMMENTS,
  DUMMY_LARGE_THREAD,
  DUMMY_MODERATION_COMMENTS,
  DUMMY_NESTED_DEPTH_2,
  DUMMY_NESTED_DEPTH_3,
  DUMMY_RTL_COMMENTS,
  DUMMY_RTL_VIEWER,
  DUMMY_VIEWER,
  createDummySubscribe,
  generateOlderPage,
  loadCursorPage,
  loadReplyPage,
} from "./dummy-data";

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

function ConsoleSink({ tag, payload }: { tag: string; payload: unknown }) {
  // Demo-only no-op log helper.
  if (typeof console !== "undefined") {
    console.log(`[demo:${tag}]`, payload);
  }
}

function FlatTab() {
  return (
    <CommentThread
      comments={DUMMY_FLAT_COMMENTS}
      currentUser={DUMMY_VIEWER}
      onAddComment={async (content) => {
        ConsoleSink({ tag: "add", payload: content });
      }}
      onLikeComment={(id, liked) =>
        ConsoleSink({ tag: "like", payload: { id, liked } })
      }
      onDeleteComment={(id) =>
        ConsoleSink({ tag: "delete", payload: id })
      }
      onReportComment={(id) =>
        ConsoleSink({ tag: "report", payload: id })
      }
    />
  );
}

function NestedDepth2Tab() {
  return (
    <CommentThread
      comments={DUMMY_NESTED_DEPTH_2}
      currentUser={DUMMY_VIEWER}
      maxDepth={2}
      onAddComment={async (content, parentId) => {
        ConsoleSink({ tag: "reply", payload: { content, parentId } });
      }}
      onLikeComment={(id, liked) =>
        ConsoleSink({ tag: "like", payload: { id, liked } })
      }
    />
  );
}

function NestedDepth3Tab() {
  return (
    <CommentThread
      comments={DUMMY_NESTED_DEPTH_3}
      currentUser={DUMMY_VIEWER}
      maxDepth={2}
      onAddComment={async (content, parentId) => {
        ConsoleSink({ tag: "reply", payload: { content, parentId } });
      }}
    />
  );
}

function PaginatedTab() {
  return (
    <CommentThread
      comments={DUMMY_LARGE_THREAD}
      currentUser={DUMMY_VIEWER}
      pageSize={10}
      onAddComment={async (content) => {
        ConsoleSink({ tag: "add", payload: content });
      }}
      onLoadMore={async (page) => {
        await wait(500);
        return generateOlderPage(page);
      }}
    />
  );
}

function RealtimeTab() {
  const subscribe = useMemo(() => createDummySubscribe(), []);
  return (
    <CommentThread
      comments={DUMMY_FLAT_COMMENTS}
      currentUser={DUMMY_VIEWER}
      subscribe={subscribe}
      onSubscribeDelta={(d) => ConsoleSink({ tag: "delta", payload: d })}
      onAddComment={async (content) => {
        ConsoleSink({ tag: "add", payload: content });
      }}
      onLikeComment={(id, liked) =>
        ConsoleSink({ tag: "like", payload: { id, liked } })
      }
    />
  );
}

function DisabledComposerTab() {
  return (
    <CommentThread
      comments={DUMMY_FLAT_COMMENTS}
      currentUser={undefined}
      composerEmptyState={
        <Card className="flex items-center justify-between rounded-md p-3">
          <span className="text-sm text-muted-foreground">
            Sign in to join the conversation.
          </span>
          <Button size="sm" variant="default">
            Sign in
          </Button>
        </Card>
      }
    />
  );
}

function CompactVariantTab() {
  return (
    <CommentThread
      variant="compact"
      comments={DUMMY_NESTED_DEPTH_2}
      currentUser={DUMMY_VIEWER}
      maxDepth={1}
      indentPx={16}
    />
  );
}

/** Controlled thread: cursor paging, lazy replies, and a post that fails once so Retry shows. */
function ControlledTab() {
  const [comments, setComments] = useState<Comment[]>(DUMMY_CURSOR_FIRST_PAGE);
  const [failNext, setFailNext] = useState(true);
  return (
    <div className="flex flex-col gap-3">
      <label className="flex items-center gap-2 text-sm text-muted-foreground">
        <input
          type="checkbox"
          checked={failNext}
          onChange={(e) => setFailNext(e.target.checked)}
        />
        Make the next post fail (the composer keeps your text; send again to retry)
      </label>
      <CommentThread
        comments={comments}
        onCommentsChange={(next) => setComments(next)}
        currentUser={DUMMY_VIEWER}
        pageSize={3}
        onLoadMoreCursor={loadCursorPage}
        onLoadReplies={loadReplyPage}
        onAddComment={async (content, _parentId, options) => {
          await wait(700);
          if (failNext) {
            setFailNext(false);
            throw new Error("The demo server said no");
          }
          return {
            id: `server-${options?.clientId ?? content}`,
            author: DUMMY_VIEWER,
            content,
            createdAt: new Date(),
            likes: 0,
          } satisfies Comment;
        }}
        onLikeComment={async () => {
          await wait(300);
        }}
        onDeleteComment={async () => {
          await wait(300);
        }}
        onError={(error, context) => ConsoleSink({ tag: "error", payload: { error, context } })}
      />
    </div>
  );
}

const REACTIONS = [
  { key: "love", icon: <span aria-hidden="true">❤️</span>, label: "Love" },
  { key: "laugh", icon: <span aria-hidden="true">😂</span>, label: "Laugh" },
  { key: "wow", icon: <span aria-hidden="true">😮</span>, label: "Wow" },
];

function ReactionsTab() {
  const comments = useMemo<Comment[]>(
    () => [
      {
        ...DUMMY_FLAT_COMMENTS[0]!,
        id: "rx1",
        reactions: { viewerReaction: "love", counts: { love: 9, laugh: 2, wow: 1 }, totalCount: 12 },
      },
      {
        ...DUMMY_FLAT_COMMENTS[1]!,
        id: "rx2",
        reactions: { viewerReaction: null, counts: { love: 3, laugh: 8, wow: 0 }, totalCount: 11 },
      },
      { ...DUMMY_FLAT_COMMENTS[4]!, id: "rx3", likes: null, reactions: { viewerReaction: null } },
    ],
    [],
  );
  return (
    <CommentThread
      comments={comments}
      currentUser={DUMMY_VIEWER}
      reactionKinds={REACTIONS}
      onReactComment={async (id, reaction) => {
        await wait(300);
        ConsoleSink({ tag: "react", payload: { id, reaction } });
      }}
    />
  );
}

/** The `comment-thread-moderation` add-on: edit, tombstones with replies, pin marker. */
function ModerationTab() {
  const ref = useRef<CommentThreadHandle>(null);
  return (
    <CommentThread
      ref={ref}
      comments={DUMMY_MODERATION_COMMENTS}
      currentUser={DUMMY_VIEWER}
      moderation={commentModeration}
      removedMode="tombstone"
      onEditComment={async (id, content) => {
        await wait(400);
        ConsoleSink({ tag: "edit", payload: { id, content } });
      }}
      onDeleteComment={async () => {
        await wait(300);
      }}
      extraActions={(comment, { isOwn }) =>
        isOwn
          ? []
          : [
              {
                label: "Hide (moderator)",
                separatorBefore: true,
                onClick: () =>
                  ref.current?.dispatch({
                    kind: "subscribe-delta",
                    delta: { kind: "state", commentId: comment.id, state: "hidden" },
                  }),
              },
            ]
      }
    />
  );
}

// 0.5.0 — renderContent: turn @mentions and URLs into links without injecting HTML.
function linkify(text: string) {
  return text.split(/(@\w+|https?:\/\/\S+)/g).map((part, i) => {
    if (part.startsWith("@")) {
      return (
        <a key={i} href={`#/u/${part.slice(1)}`} className="font-medium text-foreground underline decoration-primary underline-offset-2">
          {part}
        </a>
      );
    }
    if (/^https?:\/\//.test(part)) {
      return (
        <a key={i} href={part} className="underline underline-offset-2" target="_blank" rel="noreferrer">
          {part}
        </a>
      );
    }
    return part;
  });
}

const RICH_COMMENTS: Comment[] = DUMMY_FLAT_COMMENTS.map((c, i) =>
  i === 0
    ? { ...c, content: `${c.content} cc @marta, notes at https://ui.ilinxa.com/components/comment-thread` }
    : i === 1
      ? { ...c, content: `@leo agreed. ${c.content}` }
      : c,
);

function RichLinksTab() {
  const [closed, setClosed] = useState(false);
  return (
    <div className="flex flex-col gap-3">
      <Button
        type="button"
        size="sm"
        variant="outline"
        className="self-start"
        aria-pressed={closed}
        onClick={() => setClosed((c) => !c)}
      >
        {closed ? "Reopen comments" : "Close comments"}
      </Button>
      <CommentThread
        comments={RICH_COMMENTS}
        currentUser={DUMMY_VIEWER}
        closed={closed}
        renderContent={(c) => <p className="whitespace-pre-wrap">{linkify(c.content)}</p>}
        getAuthorHref={(author) => (author.username ? `#/u/${author.username}` : undefined)}
        onAddComment={async (content) => {
          ConsoleSink({ tag: "add", payload: content });
        }}
        onLikeComment={(id, liked) => ConsoleSink({ tag: "like", payload: { id, liked } })}
      />
    </div>
  );
}

function TurkishTab() {
  return (
    <CommentThread
      locale="tr"
      comments={DUMMY_NESTED_DEPTH_2}
      currentUser={DUMMY_VIEWER}
      labels={{
        composerPlaceholder: "Yorum yaz…",
        composerSend: "Gönder",
        composerCancel: "İptal",
        like: "Beğen",
        unlike: "Beğenmekten vazgeç",
        reply: "Yanıtla",
        delete: "Sil",
        report: "Şikayet et",
        viewReplies: (count) => `${count} yanıtı gör`,
        loadMore: "Daha eski yorumlar",
        kebabAriaLabel: (name) => `${name} yorumu için işlemler`,
        replyTo: (name) => `${name} kişisine yanıt`,
        sending: "Gönderiliyor…",
        postFailed: "Yorumunuz gönderilemedi. Tekrar deneyin.",
        editedSuffix: "(düzenlendi)",
        showMore: "Devamını gör",
        showLess: "Daha az göster",
        closed: "Yorumlar kapatıldı.",
        engagement: { comment: "Yorum", share: "Paylaş", react: "Tepki ver" },
      }}
      onReportComment={() => {}}
    />
  );
}

function RtlTab() {
  return (
    <div dir="rtl" lang="ar">
      <CommentThread
        dir="rtl"
        locale="ar"
        comments={DUMMY_RTL_COMMENTS}
        currentUser={DUMMY_RTL_VIEWER}
        labels={{
          composerPlaceholder: "اكتب تعليقاً…",
          composerSend: "إرسال",
          composerCancel: "إلغاء",
          like: "أعجبني",
          unlike: "إلغاء الإعجاب",
          reply: "رد",
          delete: "حذف",
          report: "إبلاغ",
          viewReplies: (count) => `عرض ${count} ردود`,
          sending: "جارٍ الإرسال…",
          postFailed: "تعذّر إرسال تعليقك. حاول مرة أخرى.",
        }}
        onAddComment={async () => {
          await wait(400);
        }}
      />
    </div>
  );
}

export default function CommentThreadDemo() {
  const [tab, setTab] = useState("flat");
  return (
    <Tabs value={tab} onValueChange={setTab} className="w-full">
      <SwipeTabsList>
        <TabsTrigger value="flat">Flat</TabsTrigger>
        <TabsTrigger value="depth2">Nested d2</TabsTrigger>
        <TabsTrigger value="depth3">Nested d3</TabsTrigger>
        <TabsTrigger value="paginated">Paginated</TabsTrigger>
        <TabsTrigger value="controlled">Controlled</TabsTrigger>
        <TabsTrigger value="moderation">Moderation</TabsTrigger>
        <TabsTrigger value="rich">Rich &amp; links</TabsTrigger>
        <TabsTrigger value="reactions">Reactions</TabsTrigger>
        <TabsTrigger value="realtime">Realtime</TabsTrigger>
        <TabsTrigger value="disabled">No user</TabsTrigger>
        <TabsTrigger value="compact">Compact</TabsTrigger>
        <TabsTrigger value="tr">Türkçe</TabsTrigger>
        <TabsTrigger value="rtl">RTL</TabsTrigger>
      </SwipeTabsList>

      <TabsContent value="flat" className="mt-4">
        <FlatTab />
      </TabsContent>
      <TabsContent value="depth2" className="mt-4">
        <NestedDepth2Tab />
      </TabsContent>
      <TabsContent value="depth3" className="mt-4">
        <NestedDepth3Tab />
      </TabsContent>
      <TabsContent value="paginated" className="mt-4">
        <PaginatedTab />
      </TabsContent>
      <TabsContent value="controlled" className="mt-4">
        <ControlledTab />
      </TabsContent>
      <TabsContent value="moderation" className="mt-4">
        <ModerationTab />
      </TabsContent>
      <TabsContent value="rich" className="mt-4">
        <RichLinksTab />
      </TabsContent>
      <TabsContent value="reactions" className="mt-4">
        <ReactionsTab />
      </TabsContent>
      <TabsContent value="realtime" className="mt-4">
        <RealtimeTab />
      </TabsContent>
      <TabsContent value="disabled" className="mt-4">
        <DisabledComposerTab />
      </TabsContent>
      <TabsContent value="compact" className="mt-4">
        <CompactVariantTab />
      </TabsContent>
      <TabsContent value="tr" className="mt-4">
        <TurkishTab />
      </TabsContent>
      <TabsContent value="rtl" className="mt-4">
        <RtlTab />
      </TabsContent>
    </Tabs>
  );
}
