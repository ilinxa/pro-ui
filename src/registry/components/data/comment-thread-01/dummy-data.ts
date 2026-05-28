import type {
  Comment,
  CommentDelta,
  CommentThreadCurrentUser,
  Subscribe,
} from "./types";

export const DUMMY_VIEWER: CommentThreadCurrentUser = {
  id: "viewer-1",
  name: "Sina Aytaç",
  avatar: "https://i.pravatar.cc/100?img=68",
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
      avatar: "https://i.pravatar.cc/100?img=47",
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
      avatar: "https://i.pravatar.cc/100?img=12",
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
      avatar: "https://i.pravatar.cc/100?img=32",
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
      avatar: "https://i.pravatar.cc/100?img=68",
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
      avatar: "https://i.pravatar.cc/100?img=15",
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
      avatar: "https://i.pravatar.cc/100?img=45",
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
      avatar: "https://i.pravatar.cc/100?img=47",
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
          avatar: "https://i.pravatar.cc/100?img=12",
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
              avatar: "https://i.pravatar.cc/100?img=32",
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
          avatar: "https://i.pravatar.cc/100?img=22",
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
      avatar: "https://i.pravatar.cc/100?img=15",
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
      avatar: "https://i.pravatar.cc/100?img=47",
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
          avatar: "https://i.pravatar.cc/100?img=12",
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
              avatar: "https://i.pravatar.cc/100?img=32",
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
                  avatar: "https://i.pravatar.cc/100?img=22",
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
      avatar: `https://i.pravatar.cc/100?img=${[47, 12, 32, 22, 15][i % 5]}`,
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
      avatar: `https://i.pravatar.cc/100?img=${[47, 12, 32, 22, 15][i % 5]}`,
    },
    content: `Older comment from page ${page}, slot ${i + 1}.`,
    createdAt: daysAgo(page * 7 + i),
    likes: (i * 3) % 8,
  }));
}

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
              avatar: `https://i.pravatar.cc/100?img=${(tick % 70) + 1}`,
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
