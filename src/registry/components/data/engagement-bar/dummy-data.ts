import { createElement } from "react";
import { Heart, Laugh, PartyPopper } from "lucide-react";
import type { LikersStripLabels } from "./parts/likers-strip";
import type { ShareMenuLabels } from "./parts/share-menu";
import type {
  EngagementAction,
  EngagementBarLabels,
  EngagementDelta,
  EngagementLikeUser,
  EngagementReactionKind,
  Subscribe,
} from "./types";

const noop = () => {};

// Demo data uses UNCONTROLLED mode (no explicit `liked` / `bookmarked` fields)
// so clicks visibly flip via the bar's internal mirror. Passing `liked: false`
// would put the action in CONTROLLED mode (action.liked !== undefined), which
// means the host owns the value — clicks dispatch nothing visible because the
// noop callback doesn't update a host-side state. Pre-existing demos passed
// these explicit-false fields, which silently disabled interactivity. v0.3.0
// fix: drop them; let the internal mirror drive.
export const DUMMY_POST_ENGAGEMENT: EngagementAction[] = [
  { kind: "like", count: 142, onToggle: noop },
  { kind: "comment", count: 23, onClick: noop },
  { kind: "share", count: 8, onClick: noop },
  { kind: "bookmark", onToggle: noop },
];

export const DUMMY_NEWS_CARD_ENGAGEMENT: EngagementAction[] = [
  { kind: "like", count: 56, onToggle: noop },
  { kind: "share", onClick: noop },
  { kind: "bookmark", onToggle: noop },
];

export const DUMMY_VIDEO_ENGAGEMENT_STACKED: EngagementAction[] = [
  { kind: "like", count: 1234, onToggle: noop },
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

// ---------------------------------------------------------------------------
// v0.5.0 fixtures — RTL (Arabic) sample text + large counts for the locale tab.
// ---------------------------------------------------------------------------

/** Arabic-named sample users for the RTL tab (LikersStrip + ShareMenu). */
export const DUMMY_AR_USERS: EngagementLikeUser[] = [
  { id: "ar1", name: "ليلى الحسن", username: "layla", avatar: "" },
  { id: "ar2", name: "يوسف المنصور", username: "yousef", avatar: "" },
  { id: "ar3", name: "مريم الزهراني", username: "maryam", avatar: "" },
  { id: "ar4", name: "خالد العتيبي", username: "khaled", avatar: "" },
  { id: "ar5", name: "نور الدين", username: "nour", avatar: "" },
];

/** Arabic labels for every `EngagementBar` key. */
export const DUMMY_AR_LABELS: Required<Omit<EngagementBarLabels, "formatCount">> = {
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
};

/** Arabic labels for `LikersStrip`. */
export const DUMMY_AR_LIKERS_LABELS: LikersStripLabels = {
  heading: "الإعجابات",
  close: "إخفاء",
  loading: "…",
  loadMore: "المزيد",
  moreAriaLabel: (_count, formatted) => `و${formatted} آخرين`,
  morePill: (formatted) => `+${formatted}`,
};

/** Arabic labels for `ShareMenu`. */
export const DUMMY_AR_SHARE_LABELS: ShareMenuLabels = {
  heading: "مشاركة مع…",
  searchPlaceholder: "ابحث عن أشخاص…",
  searchLabel: "بحث عن أشخاص",
  empty: "لا توجد نتائج.",
  close: "إخفاء",
};

/** Three-kind reaction catalog with Arabic labels (icons via createElement — this is a .ts file). */
export const DUMMY_AR_REACTION_KINDS: EngagementReactionKind[] = [
  {
    key: "love",
    icon: createElement(Heart, { className: "h-5 w-5 fill-current" }),
    label: "أحببته",
    count: 124,
    color: "var(--destructive)",
  },
  {
    key: "laugh",
    icon: createElement(Laugh, { className: "h-5 w-5" }),
    label: "أضحكني",
    count: 38,
  },
  {
    key: "wow",
    icon: createElement(PartyPopper, { className: "h-5 w-5" }),
    label: "رائع",
    count: 12,
  },
];

/** Large counts so compact formatting differs per locale ("1.2K" / "1,2 B" / "1,2 Tsd." / "١٫٢ ألف"). */
export const DUMMY_LARGE_COUNT_ACTIONS: EngagementAction[] = [
  { kind: "like", count: 1200, onToggle: noop },
  { kind: "comment", count: 45_300, onClick: noop },
  { kind: "share", count: 999, onClick: noop },
  { kind: "view-count", count: 2_400_000 },
];
