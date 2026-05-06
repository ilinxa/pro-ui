import type {
  EngagementAction,
  EngagementDelta,
  EngagementLikeUser,
  Subscribe,
} from "./types";

const noop = () => {};

export const DUMMY_POST_ENGAGEMENT: EngagementAction[] = [
  { kind: "like", count: 142, liked: false, onToggle: noop },
  { kind: "comment", count: 23, onClick: noop },
  { kind: "share", count: 8, onClick: noop },
  { kind: "bookmark", bookmarked: false, onToggle: noop },
];

export const DUMMY_NEWS_CARD_ENGAGEMENT: EngagementAction[] = [
  { kind: "like", count: 56, liked: false, onToggle: noop },
  { kind: "share", onClick: noop },
  { kind: "bookmark", bookmarked: true, onToggle: noop },
];

export const DUMMY_VIDEO_ENGAGEMENT_STACKED: EngagementAction[] = [
  { kind: "like", count: 1234, liked: true, onToggle: noop },
  { kind: "comment", count: 87, onClick: noop },
  { kind: "share", count: 12, onClick: noop },
  { kind: "view-count", count: 12_345 },
];

export const DUMMY_LIKE_USERS: EngagementLikeUser[] = [
  {
    id: "u1",
    name: "Ada Lovelace",
    username: "ada",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80",
  },
  {
    id: "u2",
    name: "Grace Hopper",
    username: "grace",
    avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=80",
  },
  {
    id: "u3",
    name: "Linus Torvalds",
    username: "linus",
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=80",
  },
  {
    id: "u4",
    name: "Margaret Hamilton",
    username: "maggie",
    avatar: "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=80",
  },
  {
    id: "u5",
    name: "Alan Turing",
    username: "alan",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=80",
  },
];

/**
 * Sandbox-only fake subscription. Fires a synthetic like-changed delta every 4s
 * for the realtime demo. Real consumers wire their own subscribe over websocket / SSE.
 */
export function createDummySubscribe(initialCount = 142): Subscribe<EngagementDelta> {
  return (handler) => {
    let current = initialCount;
    const id = setInterval(() => {
      current += Math.floor(Math.random() * 5) + 1;
      handler({ kind: "like-changed", count: current });
    }, 4000);
    return () => clearInterval(id);
  };
}
