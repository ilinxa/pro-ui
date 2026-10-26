import type {
  Comment,
  CommentDelta,
  CommentPage,
  CommentThreadCurrentUser,
  Subscribe,
} from "./types";

export const DUMMY_VIEWER: CommentThreadCurrentUser = {
  id: "viewer-1",
  name: "Sina Aytaç",
  avatar: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=200&h=200&fit=crop&crop=faces&q=80",
};

const NOW = new Date();
const minutesAgo = (n: number) => new Date(NOW.getTime() - n * 60 * 1000);
const hoursAgo = (n: number) => new Date(NOW.getTime() - n * 60 * 60 * 1000);
const daysAgo = (n: number) =>
  new Date(NOW.getTime() - n * 24 * 60 * 60 * 1000);

export const DUMMY_FLAT_COMMENTS: Comment[] = [
  {
    id: "c1",
    author: {
      id: "u1",
      name: "Mira Solano",
      username: "mira",
      avatar: "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=200&h=200&fit=crop&crop=faces&q=80",
    },
    content:
      "This is exactly the kind of post I needed today. Saving for the weekend read.",
    createdAt: minutesAgo(2),
    likes: 12,
    isLiked: true,
  },
  {
    id: "c2",
    author: {
      id: "u2",
      name: "Theo Zarrin",
      username: "theoz",
      avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop&crop=faces&q=80",
    },
    content:
      "Hot take: most of what's framed as a system-design problem is actually a state-management problem dressed up. The boundaries we draw between services are usually load-bearing for our state model, not the other way around. Curious what others think about this — particularly in the context of the analytics-pipeline rewrite we shipped last quarter.",
    createdAt: minutesAgo(18),
    likes: 47,
  },
  {
    id: "c3",
    author: {
      id: "u3",
      name: "Ines Park",
      username: "ines",
      avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop&crop=faces&q=80",
    },
    content:
      "Bookmarked. Thanks for sharing — fixed a typo here, the original phrasing was misleading.",
    createdAt: hoursAgo(2),
    likes: 4,
    edited: true,
  },
  {
    id: "c4",
    author: {
      id: "viewer-1",
      name: "Sina Aytaç",
      username: "sina",
      avatar: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=200&h=200&fit=crop&crop=faces&q=80",
    },
    content: "(my own comment — kebab shows Delete)",
    createdAt: hoursAgo(5),
    likes: 0,
  },
  {
    id: "c5",
    author: {
      id: "u5",
      name: "Lev Ortega",
      username: "lev",
      avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop&crop=faces&q=80",
    },
    content: "Following.",
    createdAt: daysAgo(1),
    likes: 1,
  },
  {
    id: "c6",
    author: {
      id: "u6",
      name: "Hana Sato",
      username: "hana",
      avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop&crop=faces&q=80",
    },
    content:
      "I think I disagree with point 3 — but it depends on what you mean by 'eventual consistency' here. Are you describing the storage layer or the read model?",
    createdAt: daysAgo(3),
    likes: 18,
  },
];

export const DUMMY_NESTED_DEPTH_2: Comment[] = [
  {
    id: "n1",
    author: {
      id: "u1",
      name: "Mira Solano",
      username: "mira",
      avatar: "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=200&h=200&fit=crop&crop=faces&q=80",
    },
    content: "Where does this leave the migration plan from Q2?",
    createdAt: minutesAgo(20),
    likes: 8,
    replies: [
      {
        id: "n1r1",
        author: {
          id: "u2",
          name: "Theo Zarrin",
          username: "theoz",
          avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop&crop=faces&q=80",
        },
        content:
          "Q2 plan still holds — the rewrite slots underneath without changing the user-facing contracts. We just don't get to delete the old code path until Q3.",
        createdAt: minutesAgo(15),
        likes: 11,
        replies: [
          {
            id: "n1r1r1",
            author: {
              id: "u3",
              name: "Ines Park",
              username: "ines",
              avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop&crop=faces&q=80",
            },
            content: "Ack, that tracks.",
            createdAt: minutesAgo(8),
            likes: 2,
          },
        ],
      },
      {
        id: "n1r2",
        author: {
          id: "u4",
          name: "Renee Bishop",
          username: "renee",
          avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop&crop=faces&q=80",
        },
        content: "Linking the migration doc here would help newcomers.",
        createdAt: minutesAgo(3),
        likes: 0,
      },
    ],
  },
  {
    id: "n2",
    author: {
      id: "u5",
      name: "Lev Ortega",
      username: "lev",
      avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop&crop=faces&q=80",
    },
    content: "Solid breakdown.",
    createdAt: hoursAgo(1),
    likes: 3,
  },
];

export const DUMMY_NESTED_DEPTH_3: Comment[] = [
  {
    id: "d1",
    author: {
      id: "u1",
      name: "Mira Solano",
      username: "mira",
      avatar: "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=200&h=200&fit=crop&crop=faces&q=80",
    },
    content: "Top-level question.",
    createdAt: minutesAgo(30),
    likes: 5,
    replies: [
      {
        id: "d1r1",
        author: {
          id: "u2",
          name: "Theo Zarrin",
          username: "theoz",
          avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop&crop=faces&q=80",
        },
        content: "Depth-1 answer.",
        createdAt: minutesAgo(20),
        likes: 3,
        replies: [
          {
            id: "d1r1r1",
            author: {
              id: "u3",
              name: "Ines Park",
              username: "ines",
              avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop&crop=faces&q=80",
            },
            content: "Depth-2 follow-up — past initial maxDepth.",
            createdAt: minutesAgo(10),
            likes: 1,
            replies: [
              {
                id: "d1r1r1r1",
                author: {
                  id: "u4",
                  name: "Renee Bishop",
                  username: "renee",
                  avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop&crop=faces&q=80",
                },
                content:
                  "Depth-3 deep dive — only visible after expanding 'view N replies'.",
                createdAt: minutesAgo(5),
                likes: 0,
              },
            ],
          },
        ],
      },
    ],
  },
];

const ROTATING_AVATARS = [
  "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=200&h=200&fit=crop&crop=faces&q=80",
  "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop&crop=faces&q=80",
  "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop&crop=faces&q=80",
  "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop&crop=faces&q=80",
  "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop&crop=faces&q=80",
];

export const DUMMY_LARGE_THREAD: Comment[] = Array.from(
  { length: 10 },
  (_, i) => ({
    id: `large-${i}`,
    author: {
      id: `u${(i % 5) + 1}`,
      name: [
        "Mira Solano",
        "Theo Zarrin",
        "Ines Park",
        "Renee Bishop",
        "Lev Ortega",
      ][i % 5],
      username: ["mira", "theoz", "ines", "renee", "lev"][i % 5],
      avatar: ROTATING_AVATARS[i % ROTATING_AVATARS.length],
    },
    content: `Comment ${i + 1} on this thread. The pageSize lock means only the first 10 render, with a "Load older comments" button beneath.`,
    createdAt: hoursAgo(i + 1),
    likes: (i * 7) % 20,
  }),
);

export function generateOlderPage(page: number): Comment[] {
  const offset = (page - 1) * 10;
  return Array.from({ length: 10 }, (_, i) => ({
    id: `older-${offset + i}`,
    author: {
      id: `u${(i % 5) + 1}`,
      name: [
        "Mira Solano",
        "Theo Zarrin",
        "Ines Park",
        "Renee Bishop",
        "Lev Ortega",
      ][i % 5],
      username: ["mira", "theoz", "ines", "renee", "lev"][i % 5],
      avatar: ROTATING_AVATARS[i % ROTATING_AVATARS.length],
    },
    content: `Older comment from page ${page}, slot ${i + 1}.`,
    createdAt: daysAgo(page * 7 + i),
    likes: (i * 3) % 8,
  }));
}

const LIVE_AVATARS = [
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop&crop=faces&q=80",
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=faces&q=80",
  "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop&crop=faces&q=80",
  "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop&crop=faces&q=80",
  "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&h=200&fit=crop&crop=faces&q=80",
  "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop&crop=faces&q=80",
  "https://images.unsplash.com/photo-1502685104226-ee32379fefbe?w=200&h=200&fit=crop&crop=faces&q=80",
  "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=200&h=200&fit=crop&crop=faces&q=80",
];

/** Sandbox-only fake subscribe — synthetic deltas every 6s for showcase. */
export function createDummySubscribe(): Subscribe<CommentDelta> {
  return (handler) => {
    let tick = 0;
    const id = setInterval(() => {
      tick++;
      const variant = tick % 3;
      if (variant === 0) {
        handler({
          kind: "added",
          comment: {
            id: `live-${Date.now()}`,
            author: {
              id: `live-user-${tick}`,
              name: `Live User ${tick}`,
              username: `live${tick}`,
              avatar: LIVE_AVATARS[tick % LIVE_AVATARS.length],
            },
            content: `Live-arriving comment #${tick}.`,
            createdAt: new Date(),
            likes: 0,
          },
        });
      } else if (variant === 1) {
        handler({
          kind: "liked",
          commentId: "c1",
          liked: true,
          count: 12 + tick,
        });
      } else {
        handler({
          kind: "edited",
          commentId: "c2",
          content: `(edited live, tick ${tick})`,
        });
      }
    }, 6000);
    return () => clearInterval(id);
  };
}

// ─── 0.4.0 ───────────────────────────────────────────────────────────────────

const delay = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

/** A signed-in Arabic reader, for the RTL example. */
export const DUMMY_RTL_VIEWER: CommentThreadCurrentUser = { id: "viewer-ar", name: "ليلى حداد" };

/** Arabic sample text — render inside `<div dir="rtl" lang="ar">`. */
export const DUMMY_RTL_COMMENTS: Comment[] = [
  {
    id: "ar1",
    author: { id: "ar-u1", name: "سارة النجار", username: "sara" },
    content: "مقال رائع، شكراً على المشاركة. أعجبتني فكرة تقسيم الحالة بين الخادم والعميل.",
    createdAt: minutesAgo(12),
    likes: 24,
    replies: [
      {
        id: "ar1r1",
        author: { id: "ar-u2", name: "يوسف العلي", username: "yousef" },
        content: "أتفق معك تماماً، خاصة في الجزء المتعلق بالتخزين المؤقت.",
        createdAt: minutesAgo(6),
        likes: 3,
      },
    ],
  },
  {
    id: "ar2",
    author: { id: "viewer-ar", name: "ليلى حداد", username: "layla" },
    content: "تعليقي الخاص: هل يمكن إضافة مثال عملي في الجزء الأخير؟",
    createdAt: hoursAgo(2),
    likes: null,
  },
  {
    id: "ar3",
    author: { id: "ar-u3", name: "عمر خليل", username: "omar" },
    content: "ملاحظة سريعة: الرابط الثاني لا يعمل عندي.",
    createdAt: daysAgo(2),
    likes: 1,
    isLiked: true,
  },
];

/** Moderation showcase: a pinned comment, tombstones that keep their replies, an edited own comment. */
export const DUMMY_MODERATION_COMMENTS: Comment[] = [
  {
    id: "m1",
    author: { id: "u1", name: "Mira Solano", username: "mira" },
    content: "Pinned by the moderators: please keep the discussion on topic.",
    createdAt: daysAgo(2),
    likes: 31,
    isPinned: true,
  },
  {
    id: "m2",
    author: { id: "u2", name: "Theo Zarrin", username: "theoz" },
    content: "This text is never shown — the comment was hidden.",
    createdAt: hoursAgo(5),
    likes: 0,
    state: "hidden",
    replies: [
      {
        id: "m2r1",
        author: { id: "u3", name: "Ines Park", username: "ines" },
        content: "The replies under a tombstone stay readable.",
        createdAt: hoursAgo(4),
        likes: 2,
      },
    ],
  },
  {
    id: "m3",
    author: { id: "viewer-1", name: "Sina Aytaç", username: "sina" },
    content: "My own comment — open its menu and choose Edit.",
    createdAt: hoursAgo(1),
    likes: 4,
    permissions: { canEdit: true },
  },
  {
    id: "m4",
    author: { id: "u4", name: "Renee Bishop", username: "renee" },
    content: "Removed for breaking the rules.",
    createdAt: daysAgo(1),
    likes: 0,
    state: "removed",
  },
];

/** A first page for the controlled / cursor demo: some comments know their reply total. */
export const DUMMY_CURSOR_FIRST_PAGE: Comment[] = [
  { ...DUMMY_FLAT_COMMENTS[0]!, id: "k1", replyCount: 3, repliesCursor: "r-k1-0" },
  { ...DUMMY_FLAT_COMMENTS[1]!, id: "k2", replyCount: 0 },
  { ...DUMMY_FLAT_COMMENTS[2]!, id: "k3", replyCount: 1, repliesCursor: "r-k3-0" },
];

/** Sandbox cursor loader: three pages, then done. Pass `DUMMY_CURSOR_FIRST_PAGE` as the first. */
export async function loadCursorPage(cursor: string | null): Promise<CommentPage> {
  await delay(450);
  const page = cursor === null ? 1 : Number(cursor.replace("page-", ""));
  const items = Array.from({ length: 3 }, (_, i): Comment => ({
    id: `cursor-${page}-${i}`,
    author: { id: `u${(i % 5) + 1}`, name: ["Mira Solano", "Theo Zarrin", "Ines Park"][i % 3]! },
    content: `Older comment ${i + 1} from cursor page ${page}.`,
    createdAt: daysAgo(page * 3 + i),
    likes: i,
  }));
  return { items, nextCursor: page >= 3 ? null : `page-${page + 1}` };
}

/** Sandbox replies loader: two replies per call, three calls per comment. */
export async function loadReplyPage(commentId: string, cursor: string | null): Promise<CommentPage> {
  await delay(350);
  const step = cursor === null ? 0 : Number(cursor.split("-").pop());
  const items = Array.from({ length: 2 }, (_, i): Comment => ({
    id: `${commentId}-reply-${step}-${i}`,
    author: { id: `u${(i % 5) + 3}`, name: ["Ines Park", "Renee Bishop"][i % 2]! },
    content: `Reply ${step * 2 + i + 1} to ${commentId}.`,
    createdAt: minutesAgo(40 - step * 10 - i),
    likes: 0,
  }));
  return { items, nextCursor: step >= 1 ? null : `r-${commentId}-${step + 1}` };
}
