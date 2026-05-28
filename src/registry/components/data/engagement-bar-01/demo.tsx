"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import {
  Angry,
  Frown,
  Heart,
  Laugh,
  PartyPopper,
  Wand2,
} from "lucide-react";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsTrigger } from "@/components/ui/tabs";
import { SwipeTabsList } from "@/components/site/swipe-tabs-list";
import { EngagementBar01 } from "./engagement-bar-01";
import { EngagementHeartBurst } from "./parts/engagement-heart-burst";
import { LikersStrip } from "./parts/likers-strip";
import { ShareMenu } from "./parts/share-menu";
import { CommentThread01 } from "@/registry/components/data/comment-thread-01";
import type { Comment } from "@/registry/components/data/comment-thread-01";
import {
  DUMMY_FLAT_COMMENTS,
  DUMMY_VIEWER,
} from "@/registry/components/data/comment-thread-01/dummy-data";
import {
  DUMMY_LIKE_USERS,
  DUMMY_NEWS_CARD_ENGAGEMENT,
  DUMMY_POST_ENGAGEMENT,
  DUMMY_VIDEO_ENGAGEMENT_STACKED,
  createDummySubscribe,
} from "./dummy-data";
import type {
  EngagementAction,
  EngagementBar01Handle,
  EngagementReactionKind,
} from "./types";

// Static avatar pile + "Liked by X and N others" caption.
// Distinct from the v0.2.0 `<LikersStrip>` sub-export (which is the swipable
// horizontal list used by the InteractiveDefaultDemo below).
function LikersPile({ users }: { users: typeof DUMMY_LIKE_USERS }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex -space-x-2">
        {users.slice(0, 4).map((u) => (
          <Avatar
            key={u.id}
            className="h-7 w-7 border-2 border-card"
          >
            <AvatarImage src={u.avatar} alt={u.name} />
            <AvatarFallback className="text-[10px]">
              {u.name.substring(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        ))}
      </div>
      <span className="text-xs text-muted-foreground">
        Liked by <span className="font-medium text-foreground">{users[0].name}</span>{" "}
        and {users.length - 1} others
      </span>
    </div>
  );
}

/**
 * Default-tab interactive showcase — wires all four engagement-bar callbacks
 * to demonstrate the kasder-style inline panel pattern:
 *  - `like.onCountClick`  → toggle inline `<LikersStrip>` (v0.2.0 sub-export, swipable)
 *  - `comment.onClick`    → toggle a comment-panel placeholder (real comment thread
 *                            lives in the `comment-thread-01` sibling procomp; see
 *                            `post-card-01` for the full inline-panel pattern)
 *  - `share.onClick`      → toggle inline `<ShareMenu>` (v0.2.0 sub-export, searchable)
 *  - `bookmark.onToggle`  → uncontrolled, internal mirror flips the icon on click
 *
 * The bar's library code only fires the callbacks; the host (this demo)
 * decides what UI those callbacks open. Three of the four panels are
 * mutually exclusive (one active at a time), matching the kasder UX.
 */
function InteractiveDefaultDemo() {
  const [activePanel, setActivePanel] = useState<
    "none" | "likers" | "share" | "comments"
  >("none");

  const toggle = (p: "likers" | "share" | "comments") =>
    setActivePanel((prev) => (prev === p ? "none" : p));

  const actions: EngagementAction[] = useMemo(
    () => [
      {
        kind: "like",
        count: 142,
        onToggle: (next) => console.log("[demo] like →", next),
        // Split heart-vs-count: heart fires onToggle; count opens likers panel.
        onCountClick: () => toggle("likers"),
      },
      {
        kind: "comment",
        count: 23,
        onClick: () => toggle("comments"),
      },
      {
        kind: "share",
        count: 8,
        onClick: () => toggle("share"),
      },
      {
        kind: "bookmark",
        onToggle: (next) => console.log("[demo] bookmark →", next),
      },
    ],
    [],
  );

  return (
    <div className="space-y-3">
      <EngagementBar01 actions={actions} />
      {activePanel === "likers" ? (
        <LikersStrip
          totalCount={142}
          likers={DUMMY_LIKE_USERS}
          heading="Likes"
          onClose={() => setActivePanel("none")}
        />
      ) : null}
      {activePanel === "share" ? (
        <div className="rounded-lg border border-border bg-card p-3">
          <ShareMenu
            users={DUMMY_LIKE_USERS}
            onShareTo={(user) => {
              console.log("[demo] share to", user.name);
              setActivePanel("none");
            }}
            onClose={() => setActivePanel("none")}
          />
        </div>
      ) : null}
      {activePanel === "comments" ? (
        <div className="overflow-hidden rounded-lg border border-border bg-card p-4 text-sm">
          <div className="mb-3 flex items-center justify-between">
            <p className="font-medium">Comments</p>
            <button
              type="button"
              onClick={() => setActivePanel("none")}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Hide
            </button>
          </div>
          {/* max-h-105 (= 420px in Tailwind v4's 4px spacing scale) gives
              ~5 comments before scroll kicks in. pageSize={5} + onLoadMore =
              "Load older comments" button at the bottom of the thread once
              initial 5 are exhausted. Page-3 returns [] → button disappears. */}
          <div className="max-h-105 overflow-y-auto pr-1">
            <CommentThread01
              comments={INITIAL_COMMENTS}
              currentUser={DUMMY_VIEWER}
              pageSize={5}
              onLoadMore={async (page) => {
                // Simulate network latency for realistic UX.
                await new Promise((r) => setTimeout(r, 400));
                if (page === 1) return OLDER_COMMENTS_PAGE_2;
                return [];
              }}
              onAddComment={(content, parentId) => {
                console.log("[demo] add comment", { content, parentId });
              }}
              onLikeComment={(id, next) =>
                console.log("[demo] like comment", id, next)
              }
              onDeleteComment={(id) =>
                console.log("[demo] delete comment", id)
              }
              onReportComment={(id) =>
                console.log("[demo] report comment", id)
              }
            />
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            Real <code>{"<CommentThread01>"}</code> sibling procomp (composer + recursive replies). Scrollable list capped at 5 visible rows; <code>pageSize=5</code> + <code>onLoadMore</code> drives the {'"Load older comments"'} lazy-load button. engagement-bar-01 only fires <code>comment.onClick</code>; the host composes this surface. <code>post-card-01</code> wires the same flow inline.
          </p>
        </div>
      ) : null}
    </div>
  );
}

function RealtimeDemo() {
  const subscribe = useMemo(() => createDummySubscribe(142), []);
  return (
    <EngagementBar01
      actions={DUMMY_POST_ENGAGEMENT}
      subscribe={subscribe}
      onSubscribeDelta={(d) =>
        console.log("[demo] delta", d)
      }
      likersPreview={<LikersPile users={DUMMY_LIKE_USERS} />}
    />
  );
}

function HeartBurstDemo() {
  const barRef = useRef<EngagementBar01Handle>(null);
  const [burstKey, setBurstKey] = useState(0);

  return (
    <div className="space-y-3">
      <div className="relative overflow-hidden rounded-2xl bg-muted">
        <button
          type="button"
          onDoubleClick={() => {
            barRef.current?.triggerLike();
            setBurstKey((k) => k + 1);
          }}
          className="block w-full"
          aria-label="Double-click the photo to like"
        >
          <img
            src="https://images.unsplash.com/photo-1518770660439-4636190af475?w=800"
            alt="Demo media"
            className="aspect-square w-full object-cover"
          />
        </button>
        <EngagementHeartBurst
          trigger={burstKey}
          className="absolute inset-0 z-10 flex items-center justify-center"
        />
      </div>
      <EngagementBar01
        ref={barRef}
        actions={DUMMY_POST_ENGAGEMENT}
        likersPreview={<LikersPile users={DUMMY_LIKE_USERS} />}
      />
      <p className="text-xs text-muted-foreground">
        Double-click the image — the bar&apos;s like flips and the heart bursts.
        Burst is a sibling RSC sub-export driven by a counter prop; the bar
        doesn&apos;t own the burst node, so retrofit consumers (news-card,
        event-card) skip it entirely.
      </p>
    </div>
  );
}

const CUSTOM_REMIX_ACTIONS: EngagementAction[] = [
  { kind: "like", count: 89, onToggle: (next) => console.log("[demo] like →", next) },
  { kind: "comment", count: 12, onClick: () => console.log("[demo] comment click") },
  {
    kind: "custom",
    id: "remix",
    label: "Remix",
    icon: <Wand2 className="h-5 w-5" />,
    onClick: () => console.log("[demo] remix"),
  },
];

// FB-style 5-reaction catalog. Host owns icons + labels + colors — library
// ships no defaults (per Q-P1 lock; matches PostVisibility convention).
const REACTION_KINDS: EngagementReactionKind[] = [
  {
    key: "love",
    icon: <Heart className="h-5 w-5 fill-current" />,
    label: "Love",
    count: 124,
    color: "#e0245e",
  },
  {
    key: "laugh",
    icon: <Laugh className="h-5 w-5" />,
    label: "Laugh",
    count: 38,
    color: "#f7b928",
  },
  {
    key: "wow",
    icon: <PartyPopper className="h-5 w-5" />,
    label: "Wow",
    count: 12,
    color: "#9b59b6",
  },
  {
    key: "sad",
    icon: <Frown className="h-5 w-5" />,
    label: "Sad",
    count: 5,
    color: "#5b9bd5",
  },
  {
    key: "angry",
    icon: <Angry className="h-5 w-5" />,
    label: "Angry",
    count: 2,
    color: "#e74c3c",
  },
];

const REACTION_TOTAL_COUNT = REACTION_KINDS.reduce(
  (acc, k) => acc + k.count,
  0,
);

// `viewerReaction` is OMITTED in the reaction action below — passing `null`
// OR a string would put the bar in controlled mode (`action.viewerReaction
// !== undefined`), which causes `handlePick` to skip the optimistic dispatch
// and rely on the host to update the prop. Since the demo's `onSelect` is
// just `console.log` (per F-05 fix: no demo-side useState re-derive), the
// bar would never visually change. Omitting makes it uncontrolled → internal
// mirror drives visual updates.

/**
 * Reactions tab interactive showcase.
 *  - `reaction.onCountClick` toggles a scrollable reactors panel below the bar
 *    (host-owned UI; library only fires the event).
 *  - Panel uses the same max-h-105 (= 420px, ~5 rows) + Load-older lazy-load
 *    pattern as the comment thread on the Default tab — 3 pages, 5 + 5 + 3
 *    reactors (DEMO_REACTORS sliced).
 *  - The `reactionsPreview` slot keeps the static avatar-cluster preview above
 *    the expandable panel (the slot is independent of the click-to-expand
 *    behavior; demo keeps both visible to show that).
 */
function InteractiveReactionsDemo() {
  const [panelOpen, setPanelOpen] = useState(false);
  const [reactors, setReactors] = useState<Reactor[]>(REACTORS_PAGE_1);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  const hasMore = page < 3;

  const handleLoadMore = useCallback(async () => {
    if (isLoading || !hasMore) return;
    setIsLoading(true);
    await new Promise((r) => setTimeout(r, 400));
    if (page === 1) {
      setReactors((prev) => [...prev, ...REACTORS_PAGE_2]);
      setPage(2);
    } else if (page === 2) {
      setReactors((prev) => [...prev, ...REACTORS_PAGE_3]);
      setPage(3);
    }
    setIsLoading(false);
  }, [isLoading, hasMore, page]);

  const actions: EngagementAction[] = useMemo(
    () => [
      {
        kind: "reaction",
        kinds: REACTION_KINDS,
        totalCount: REACTION_TOTAL_COUNT,
        onSelect: (kind) =>
          console.log("[demo] reaction onSelect", kind),
        onCountClick: () => setPanelOpen((open) => !open),
      },
      { kind: "comment", count: 28, onClick: () => {} },
      { kind: "share", count: 11, onClick: () => {} },
      { kind: "bookmark", onToggle: () => {} },
    ],
    [],
  );

  return (
    <div className="space-y-3">
      <EngagementBar01
        actions={actions}
        reactionsPreview={<ReactorsPreview />}
      />
      {panelOpen ? (
        <ReactorsList
          reactors={reactors}
          hasMore={hasMore}
          isLoading={isLoading}
          onLoadMore={handleLoadMore}
          onClose={() => setPanelOpen(false)}
        />
      ) : null}
    </div>
  );
}

// Hybrid per Q-P3 lock — both `like` AND `reaction` in the same actions array.
// Library does not enforce mutual exclusion; renders both in array order.
// Use case: classic thumbs-up + emoji-reactions on the same content.
// Same uncontrolled-mode rationale as REACTION_ACTIONS above.
const HYBRID_ACTIONS: EngagementAction[] = [
  { kind: "like", count: 67, onToggle: () => {} },
  {
    kind: "reaction",
    kinds: REACTION_KINDS,
    totalCount: REACTION_TOTAL_COUNT,
    onSelect: (kind) => console.log("[demo] hybrid reaction onSelect", kind),
  },
  { kind: "comment", count: 14, onClick: () => {} },
];

// Page-1 = first 5 of the flat fixture. Page-2 = the 6th + 4 synthetic ones.
// Page-3+ returns empty → "Load older comments" button disappears.
const INITIAL_COMMENTS = DUMMY_FLAT_COMMENTS.slice(0, 5);

const OLDER_COMMENTS_PAGE_2: Comment[] = [
  DUMMY_FLAT_COMMENTS[5], // c6 — Hana Sato
  {
    id: "c7",
    author: {
      id: "u7",
      name: "Owen Tanaka",
      username: "owent",
      avatar: "https://i.pravatar.cc/100?img=8",
    },
    content:
      "Late to this, but the section on slot-driven composition saved me a 3-day refactor. Bookmarked.",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5),
    likes: 3,
  },
  {
    id: "c8",
    author: {
      id: "u8",
      name: "Priya Raman",
      username: "priya",
      avatar: "https://i.pravatar.cc/100?img=23",
    },
    content: "I disagree with the cross-folder import constraint — but only mildly. Net-positive overall.",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7),
    likes: 9,
  },
  {
    id: "c9",
    author: {
      id: "u9",
      name: "Mateo Ríos",
      username: "mateo",
      avatar: "https://i.pravatar.cc/100?img=11",
    },
    content: "Echoing what others said upstream — this is the right tradeoff.",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 9),
    likes: 1,
  },
  {
    id: "c10",
    author: {
      id: "u10",
      name: "Yuna Park",
      username: "yuna",
      avatar: "https://i.pravatar.cc/100?img=20",
    },
    content: "Saved. Will revisit when we tackle the same arc internally.",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 12),
    likes: 6,
  },
];

// Reactor records — user + which reaction kind they picked. Synthetic data for
// the reactors-panel demo (no equivalent built-in fixture; library doesn't ship
// a reactors list — host owns the data shape).
type Reactor = {
  id: string;
  name: string;
  avatar: string;
  kind: (typeof REACTION_KINDS)[number];
};

const DEMO_REACTORS: Reactor[] = [
  { id: "r1", name: "Ada Lovelace", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80", kind: REACTION_KINDS[0] },
  { id: "r2", name: "Grace Hopper", avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=80", kind: REACTION_KINDS[0] },
  { id: "r3", name: "Linus Torvalds", avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=80", kind: REACTION_KINDS[1] },
  { id: "r4", name: "Margaret Hamilton", avatar: "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=80", kind: REACTION_KINDS[0] },
  { id: "r5", name: "Alan Turing", avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=80", kind: REACTION_KINDS[2] },
  { id: "r6", name: "Hedy Lamarr", avatar: "https://i.pravatar.cc/100?img=29", kind: REACTION_KINDS[0] },
  { id: "r7", name: "Donald Knuth", avatar: "https://i.pravatar.cc/100?img=51", kind: REACTION_KINDS[1] },
  { id: "r8", name: "Barbara Liskov", avatar: "https://i.pravatar.cc/100?img=21", kind: REACTION_KINDS[2] },
  { id: "r9", name: "Edsger Dijkstra", avatar: "https://i.pravatar.cc/100?img=55", kind: REACTION_KINDS[3] },
  { id: "r10", name: "Frances Allen", avatar: "https://i.pravatar.cc/100?img=18", kind: REACTION_KINDS[0] },
  { id: "r11", name: "John Carmack", avatar: "https://i.pravatar.cc/100?img=33", kind: REACTION_KINDS[1] },
  { id: "r12", name: "Anita Borg", avatar: "https://i.pravatar.cc/100?img=36", kind: REACTION_KINDS[4] },
  { id: "r13", name: "Tim Berners-Lee", avatar: "https://i.pravatar.cc/100?img=57", kind: REACTION_KINDS[0] },
];

const REACTORS_PAGE_SIZE = 5;
const REACTORS_PAGE_1 = DEMO_REACTORS.slice(0, REACTORS_PAGE_SIZE);
const REACTORS_PAGE_2 = DEMO_REACTORS.slice(REACTORS_PAGE_SIZE, REACTORS_PAGE_SIZE * 2);
const REACTORS_PAGE_3 = DEMO_REACTORS.slice(REACTORS_PAGE_SIZE * 2);

function ReactorsList({
  reactors,
  hasMore,
  isLoading,
  onLoadMore,
  onClose,
}: {
  reactors: Reactor[];
  hasMore: boolean;
  isLoading: boolean;
  onLoadMore: () => void;
  onClose: () => void;
}) {
  return (
    <div className="overflow-hidden rounded-lg border border-border bg-card p-4 text-sm">
      <div className="mb-3 flex items-center justify-between">
        <p className="font-medium">Reactions</p>
        <button
          type="button"
          onClick={onClose}
          className="text-xs text-muted-foreground hover:text-foreground"
        >
          Hide
        </button>
      </div>
      {/* max-h-105 (= 420px) → ~5 rows before scroll kicks in. */}
      <ul className="max-h-105 space-y-2 overflow-y-auto pr-1">
        {reactors.map((r) => (
          <li
            key={r.id}
            className="flex items-center gap-3 rounded-md py-1.5 transition-colors hover:bg-accent/50"
          >
            <div className="relative">
              <Avatar className="h-9 w-9">
                <AvatarImage src={r.avatar} alt={r.name} />
                <AvatarFallback className="text-xs">
                  {r.name.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span
                aria-hidden
                className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-card ring-2 ring-card"
                style={{ color: r.kind.color }}
              >
                <span className="scale-75">{r.kind.icon}</span>
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium">{r.name}</p>
              <p className="text-xs text-muted-foreground">
                Reacted with {r.kind.label}
              </p>
            </div>
          </li>
        ))}
      </ul>
      {hasMore ? (
        <button
          type="button"
          onClick={onLoadMore}
          disabled={isLoading}
          className="mt-3 w-full rounded-md border border-border bg-background px-3 py-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent disabled:opacity-60"
        >
          {isLoading ? "Loading older reactions…" : "Load older reactions"}
        </button>
      ) : null}
    </div>
  );
}

function ReactorsPreview() {
  return (
    <div className="flex items-center gap-2">
      <div className="flex -space-x-1">
        {REACTION_KINDS.slice(0, 3).map((k) => (
          <span
            key={k.key}
            aria-hidden
            className="flex h-5 w-5 items-center justify-center rounded-full bg-card ring-1 ring-border"
            style={{ color: k.color }}
          >
            <span className="scale-75">{k.icon}</span>
          </span>
        ))}
      </div>
      <span className="text-xs text-muted-foreground">
        <span className="font-medium text-foreground">
          {DUMMY_LIKE_USERS[0].name}
        </span>{" "}
        and {REACTION_TOTAL_COUNT - 1} others reacted
      </span>
    </div>
  );
}

export default function EngagementBar01Demo() {
  return (
    <Tabs defaultValue="default">
      <SwipeTabsList>
        <TabsTrigger value="default">Default (post)</TabsTrigger>
        <TabsTrigger value="compact">Compact (news-card)</TabsTrigger>
        <TabsTrigger value="stacked">Stacked (video overlay)</TabsTrigger>
        <TabsTrigger value="realtime">Realtime subscribe</TabsTrigger>
        <TabsTrigger value="burst">Heart-burst</TabsTrigger>
        <TabsTrigger value="custom">Custom action</TabsTrigger>
        <TabsTrigger value="reactions">Reactions</TabsTrigger>
        <TabsTrigger value="hybrid">Hybrid (like + reaction)</TabsTrigger>
      </SwipeTabsList>

      <TabsContent value="default" className="mt-6 space-y-3">
        <InteractiveDefaultDemo />
        <p className="text-xs text-muted-foreground">
          Fully-wired post-style engagement row. Every action is uncontrolled — internal mirror drives visuals; callbacks log to console.
        </p>
        <ul className="ml-4 list-disc space-y-1 text-xs text-muted-foreground">
          <li>
            <strong>Heart icon</strong> — toggles like (mirror flips visibly).
          </li>
          <li>
            <strong>Like count</strong> — split-tap target via <code>like.onCountClick</code>; opens the v0.2.0 <code>{"<LikersStrip>"}</code> sub-export (swipable horizontal avatar row + {'"+N"'} pill).
          </li>
          <li>
            <strong>Comment</strong> — opens a placeholder panel with input + Send. Atomic bar fires <code>onClick</code>; real comment thread comes from <code>comment-thread-01</code> (see <code>post-card-01</code> for the full inline pattern).
          </li>
          <li>
            <strong>Share</strong> — opens the v0.2.0 <code>{"<ShareMenu>"}</code> sub-export (searchable user picker).
          </li>
          <li>
            <strong>Bookmark</strong> — right-aligned via default <code>align</code> rule; uncontrolled toggle, fill flips on click.
          </li>
        </ul>
      </TabsContent>

      <TabsContent value="compact" className="mt-6 space-y-3">
        <div className="max-w-md rounded-xl border border-border bg-card p-3">
          <p className="mb-2 text-sm font-medium">News card body...</p>
          <EngagementBar01
            variant="compact"
            actions={DUMMY_NEWS_CARD_ENGAGEMENT}
          />
        </div>
        <p className="text-xs text-muted-foreground">
          Compact variant for tight surfaces. Drop into{" "}
          <code>content-card-news-01</code>&apos;s <code>actions</code> slot
          for an instant social upgrade — no framer-motion, no client-component
          boundary added (heart-burst not imported).
        </p>
      </TabsContent>

      <TabsContent value="stacked" className="mt-6 space-y-3">
        <div className="flex justify-center rounded-2xl bg-zinc-900 p-6">
          <EngagementBar01
            variant="stacked"
            actions={DUMMY_VIDEO_ENGAGEMENT_STACKED}
            className="text-white"
          />
        </div>
        <p className="text-xs text-muted-foreground">
          Stacked variant — TikTok/Reels style vertical action column. Designed
          to overlay the right edge of a video. <code>align</code> is silently
          ignored in stacked mode. View-count renders as a non-button group
          (display-only).
        </p>
      </TabsContent>

      <TabsContent value="realtime" className="mt-6 space-y-3">
        <RealtimeDemo />
        <p className="text-xs text-muted-foreground">
          Synthetic <code>subscribe</code> fires a like-count delta every 4
          seconds — watch the count tick up without clicks. Console logs the
          raw deltas via <code>onSubscribeDelta</code>. Real consumers wire
          their own websocket / SSE channel; the contract is the same.
        </p>
      </TabsContent>

      <TabsContent value="burst" className="mt-6">
        <HeartBurstDemo />
      </TabsContent>

      <TabsContent value="custom" className="mt-6 space-y-3">
        <EngagementBar01 actions={CUSTOM_REMIX_ACTIONS} />
        <p className="text-xs text-muted-foreground">
          Custom action via <code>{'kind: "custom"'}</code>: host
          provides <code>id</code>, <code>label</code>, <code>icon</code>,
          optional <code>count</code> + <code>active</code>, and{" "}
          <code>onClick</code>. The bar treats it like any other action.
        </p>
      </TabsContent>

      <TabsContent value="reactions" className="mt-6 space-y-3">
        <InteractiveReactionsDemo />
        <p className="text-xs text-muted-foreground">
          FB / LinkedIn-style multi-kind reactions via <code>{'kind: "reaction"'}</code>. Host supplies a <code>kinds</code> catalog (key + icon + label + seed count + optional color); library ships no defaults.
        </p>
        <ul className="ml-4 list-disc space-y-1 text-xs text-muted-foreground">
          <li>Demo is uncontrolled (no <code>viewerReaction</code> passed) — bar&apos;s internal mirror drives visuals.</li>
          <li>Tap the action → opens the picker; pick a kind → trigger icon + total tick update.</li>
          <li>Long-press (~350ms) → opens the picker regardless of current state.</li>
          <li>Once a kind is set, default <code>clearOnTap: true</code> means a tap CLEARS; flip to <code>false</code> for picker-only UX.</li>
          <li>Remove (×) button inside the picker always available when a reaction is set.</li>
          <li><strong>Click the total count</strong> → toggles the scrollable + lazy-loaded reactors panel below (host-owned UI). Panel caps at ~5 rows visible; {'"Load older reactions"'} button paginates (5 + 5 + 3 reactors across 3 pages, 400ms simulated latency).</li>
          <li>The static avatar cluster (<code>reactionsPreview</code> slot, parallel to <code>likersPreview</code>) stays above the expandable panel — the slot is independent of the count-click expand behavior.</li>
        </ul>
      </TabsContent>

      <TabsContent value="hybrid" className="mt-6 space-y-3">
        <EngagementBar01 actions={HYBRID_ACTIONS} />
        <p className="text-xs text-muted-foreground">
          Hybrid layout per the Q-P3 lock — both <code>{'kind: "like"'}</code> AND <code>{'kind: "reaction"'}</code> in the same <code>actions</code> array. Library does NOT enforce mutual exclusion; both render in array order, both interact independently.
        </p>
        <p className="text-xs text-muted-foreground">
          Use case: a product that wants the classic thumbs-up alongside emoji-reactions on the same content. End-user UX is the host&apos;s call — library blesses the configuration, not the visual outcome.
        </p>
      </TabsContent>
    </Tabs>
  );
}
