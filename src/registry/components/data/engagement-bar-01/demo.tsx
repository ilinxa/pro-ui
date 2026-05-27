"use client";

import { useMemo, useRef, useState } from "react";
import { Wand2 } from "lucide-react";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsTrigger } from "@/components/ui/tabs";
import { SwipeTabsList } from "@/components/site/swipe-tabs-list";
import { EngagementBar01 } from "./engagement-bar-01";
import { EngagementHeartBurst } from "./parts/engagement-heart-burst";
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
} from "./types";

function LikersStrip({ users }: { users: typeof DUMMY_LIKE_USERS }) {
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

function RealtimeDemo() {
  const subscribe = useMemo(() => createDummySubscribe(142), []);
  return (
    <EngagementBar01
      actions={DUMMY_POST_ENGAGEMENT}
      subscribe={subscribe}
      onSubscribeDelta={(d) =>
        console.log("[demo] delta", d)
      }
      likersPreview={<LikersStrip users={DUMMY_LIKE_USERS} />}
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
        likersPreview={<LikersStrip users={DUMMY_LIKE_USERS} />}
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
  { kind: "like", count: 89, liked: false, onToggle: () => {} },
  { kind: "comment", count: 12, onClick: () => {} },
  {
    kind: "custom",
    id: "remix",
    label: "Remix",
    icon: <Wand2 className="h-5 w-5" />,
    onClick: () => console.log("[demo] remix"),
  },
];

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
      </SwipeTabsList>

      <TabsContent value="default" className="mt-6 space-y-3">
        <EngagementBar01
          actions={DUMMY_POST_ENGAGEMENT}
          likersPreview={<LikersStrip users={DUMMY_LIKE_USERS} />}
        />
        <p className="text-xs text-muted-foreground">
          Standard post engagement row. Like / comment / share on the left;
          bookmark drifts right via default <code>align</code> rule. Click
          like — count flips optimistically (uncontrolled mode, internal state
          owns it).
        </p>
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
          Custom action via <code>kind: &quot;custom&quot;</code>: host
          provides <code>id</code>, <code>label</code>, <code>icon</code>,
          optional <code>count</code> + <code>active</code>, and{" "}
          <code>onClick</code>. The bar treats it like any other action.
        </p>
      </TabsContent>
    </Tabs>
  );
}
