import type { Comment, CommentDelta, CommentThreadCurrentUser, Subscribe } from "@/registry/components/data/comment-thread-01";
import type { EngagementDelta } from "@/registry/components/data/engagement-bar-01";
import type { Post, PostLikeUser } from "./types";

export const DUMMY_LIKERS: PostLikeUser[] = [
  { id: "l-ayse", name: "Ayşe Demir", username: "ayse_demir", avatar: "https://i.pravatar.cc/100?img=5" },
  { id: "l-ali", name: "Ali Öztürk", username: "ali_ozturk", avatar: "https://i.pravatar.cc/100?img=11" },
  { id: "l-fatma", name: "Fatma Kara", username: "fatma_kara", avatar: "https://i.pravatar.cc/100?img=49" },
  { id: "l-mehmet", name: "Mehmet Şahin", username: "mehmet_s", avatar: "https://i.pravatar.cc/100?img=14" },
  { id: "l-zeynep", name: "Zeynep Yıldız", username: "zeynep_y", avatar: "https://i.pravatar.cc/100?img=39" },
];

export function generateMoreLikers(page: number): PostLikeUser[] {
  return Array.from({ length: 6 }, (_, i) => {
    const idx = (page - 1) * 6 + i;
    return {
      id: `l-extra-${idx}`,
      name: `Liker ${idx + 1}`,
      username: `liker_${idx + 1}`,
      avatar: `https://i.pravatar.cc/100?img=${(idx % 70) + 1}`,
    };
  });
}

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

const PEXELS_IMG_1 =
  "https://images.pexels.com/photos/1264210/pexels-photo-1264210.jpeg?auto=compress&cs=tinysrgb&w=800";
const PEXELS_IMG_2 =
  "https://images.pexels.com/photos/1287145/pexels-photo-1287145.jpeg?auto=compress&cs=tinysrgb&w=800";
const PEXELS_IMG_3 =
  "https://images.pexels.com/photos/2832382/pexels-photo-2832382.jpeg?auto=compress&cs=tinysrgb&w=800";
// Same demo videos kasder uses — the w3schools canonical Big Buck Bunny clip.
const TEST_VIDEO_1 = "https://www.w3schools.com/html/mov_bbb.mp4";
const TEST_VIDEO_2 = "https://www.w3schools.com/html/movie.mp4";
const TEST_VIDEO_POSTER =
  "https://images.unsplash.com/photo-1552664730-d307ca884978?w=600";

export const DUMMY_TEXT_ONLY_POST: Post = {
  id: "post-text-only",
  author: {
    id: "u-mira",
    name: "Mira Solano",
    username: "mira",
    avatar: "https://i.pravatar.cc/100?img=47",
    isVerified: true,
  },
  content:
    "Quick thought before standup: the team's been shipping at a remarkable cadence — five components in three days — but the value of any single component shrinks when the surface area grows past a hundred. We're at 60. Time to think about deprecation flows.",
  createdAt: minutesAgo(8),
  likes: 47,
  isLiked: false,
  comments: 12,
  shares: 3,
};

export const DUMMY_SINGLE_IMAGE_POST: Post = {
  id: "post-single-image",
  author: {
    id: "u-theo",
    name: "Theo Zarrin",
    username: "theoz",
    avatar: "https://i.pravatar.cc/100?img=12",
  },
  content: "Sunset over the bay yesterday. Worth the climb.",
  media: [
    {
      id: "media-1",
      type: "image",
      url: PEXELS_IMG_1,
      alt: "Sunset over a bay with mountains",
    },
  ],
  createdAt: hoursAgo(4),
  likes: 142,
  isLiked: true,
  comments: 23,
  shares: 8,
  isBookmarked: false,
};

export const DUMMY_MULTI_IMAGE_POST: Post = {
  id: "post-multi-image",
  author: {
    id: "u-ines",
    name: "Ines Park",
    username: "ines",
    avatar: "https://i.pravatar.cc/100?img=32",
    isVerified: true,
  },
  content:
    "Studio process this week — three iterations on the same composition. Trying to figure out which one carries the message clearest.",
  media: [
    { id: "media-2-a", type: "image", url: PEXELS_IMG_1, alt: "Iteration A" },
    { id: "media-2-b", type: "image", url: PEXELS_IMG_2, alt: "Iteration B" },
    { id: "media-2-c", type: "image", url: PEXELS_IMG_3, alt: "Iteration C" },
  ],
  createdAt: hoursAgo(12),
  likes: 384,
  isLiked: false,
  comments: 56,
  shares: 21,
};

export const DUMMY_VIDEO_POST: Post = {
  id: "post-video",
  author: {
    id: "u-renee",
    name: "Renee Bishop",
    username: "renee",
    avatar: "https://i.pravatar.cc/100?img=22",
  },
  content: "Drone footage from the morning flight. Sound on.",
  media: [
    {
      id: "media-3",
      type: "video",
      url: TEST_VIDEO_1,
      poster: TEST_VIDEO_POSTER,
      alt: "Aerial drone footage",
    },
  ],
  createdAt: daysAgo(1),
  likes: 1234,
  isLiked: false,
  comments: 87,
  shares: 45,
  viewCount: 12_345,
};

export const DUMMY_MIXED_MEDIA_POST: Post = {
  id: "post-mixed",
  author: {
    id: "u-lev",
    name: "Lev Ortega",
    username: "lev",
    avatar: "https://i.pravatar.cc/100?img=15",
  },
  content: "Field notes from the trip — a mix of stills and one short clip.",
  media: [
    { id: "media-4-a", type: "image", url: PEXELS_IMG_2, alt: "Field shot 1" },
    {
      id: "media-4-b",
      type: "video",
      url: TEST_VIDEO_2,
      poster: TEST_VIDEO_POSTER,
      alt: "Short clip",
    },
    { id: "media-4-c", type: "image", url: PEXELS_IMG_3, alt: "Field shot 2" },
  ],
  createdAt: daysAgo(2),
  likes: 56,
  comments: 11,
  shares: 4,
};

export const DUMMY_FEATURED_POST: Post = {
  id: "post-featured",
  author: {
    id: "u-hana",
    name: "Hana Sato",
    username: "hana",
    avatar: "https://i.pravatar.cc/100?img=45",
    isVerified: true,
  },
  content:
    "Big announcement — the kasder homepage redesign goes live next week. Three months of cross-team work, the smallest team I've shipped with, the biggest impact metric we've targeted. Couldn't have done it without the team. Watch this space.",
  media: [
    { id: "media-5-a", type: "image", url: PEXELS_IMG_3, alt: "Hero shot" },
  ],
  createdAt: hoursAgo(2),
  likes: 8742,
  isLiked: true,
  comments: 312,
  shares: 187,
  viewCount: 142_000,
  isBookmarked: true,
};

export const DUMMY_LONG_TEXT_POST: Post = {
  id: "post-long-text",
  author: {
    id: "u-sina",
    name: "Sina Aytaç",
    username: "sina",
    avatar: "https://i.pravatar.cc/100?img=68",
  },
  content:
    "On the design-vs-implementation gap: I've been working through this for years and the closest answer I have is that design IS implementation, just at a different scale. The choices a designer makes about whitespace, hierarchy, motion all become engineering work downstream — and the engineering choices about state machines, error boundaries, retries propagate back into the product's emotional shape. The further out the team is from that loop, the more friction shows up at the seams. So if you're hiring designers and want to know if they'll work — ask them which engineering constraint they spent the most time fighting against last quarter, and what they did with the answer.",
  createdAt: hoursAgo(7),
  likes: 234,
  isLiked: false,
  comments: 19,
  shares: 11,
};

// ─── v0.2.0 schema-expansion fixtures ─────────────────────────────────────
//
// These don't replace any v0.1 dummies — they're new fixtures showcasing the
// 12 new optional Post fields (visibility, isPinned, isSensitive, poll,
// repostOf, linkPreview, replyTo, mentions, tags, location, editedAt, language).
// The v0.1 dummies above remain untouched to preserve zero visual regression
// for v0.1 demo tabs.

/** Pinned + public visibility + edited — owner-side header polish. */
export const DUMMY_PINNED_POST: Post = {
  id: "post-pinned",
  author: {
    id: "u-yusuf",
    name: "Yusuf Kaya",
    username: "yusuf",
    avatar: "https://i.pravatar.cc/100?img=33",
    isVerified: true,
  },
  content:
    "Pinned: the v0.2 ship locks the schema for the post-editor sibling — if you've been waiting on this to start your form work, the green light is here. Editor description doc lands next week.",
  createdAt: daysAgo(3),
  editedAt: hoursAgo(2),
  isPinned: true,
  visibility: "public",
  likes: 521,
  isLiked: false,
  comments: 38,
  shares: 14,
};

/** Sensitive media gate — viewer sees the overlay until they tap "Show". */
export const DUMMY_SENSITIVE_POST: Post = {
  id: "post-sensitive",
  author: {
    id: "u-noor",
    name: "Noor Halabi",
    username: "noor",
    avatar: "https://i.pravatar.cc/100?img=44",
  },
  content:
    "Studio test print from this morning's run. Apologies for the warning gate — the print includes content the platform flags by default; here's the explanation.",
  media: [
    { id: "media-sensitive-1", type: "image", url: PEXELS_IMG_2, alt: "Test print" },
  ],
  createdAt: hoursAgo(6),
  isSensitive: true,
  sensitiveReason: "Contains depictions that may be flagged by automated review.",
  visibility: "followers",
  likes: 89,
  isLiked: false,
  comments: 17,
  shares: 2,
};

/** Active poll — viewer can vote; bar fills optimistically. */
export const DUMMY_POLL_POST: Post = {
  id: "post-poll",
  author: {
    id: "u-priya",
    name: "Priya Menon",
    username: "priya",
    avatar: "https://i.pravatar.cc/100?img=20",
  },
  content: "Quick poll for the team — which onboarding flow feels right for the v2 ship?",
  createdAt: hoursAgo(3),
  visibility: "followers",
  likes: 24,
  comments: 7,
  shares: 1,
  poll: {
    options: [
      { id: "opt-a", label: "Single-step (just email)", voteCount: 18 },
      { id: "opt-b", label: "Two-step (email + workspace)", voteCount: 47 },
      { id: "opt-c", label: "Three-step with role pick", voteCount: 12 },
    ],
    closesAt: hoursAgo(-48), // 2 days from now
    totalVotes: 77,
  },
};

/** Poll viewer has already voted — results view with viewer's choice highlighted. */
export const DUMMY_POLL_VOTED_POST: Post = {
  id: "post-poll-voted",
  author: DUMMY_POLL_POST.author,
  content: "Server-resolved vote state — viewer chose option B; results view renders.",
  createdAt: hoursAgo(3),
  likes: 24,
  comments: 7,
  shares: 1,
  poll: {
    options: [
      { id: "opt-a", label: "Single-step (just email)", voteCount: 18 },
      { id: "opt-b", label: "Two-step (email + workspace)", voteCount: 48 },
      { id: "opt-c", label: "Three-step with role pick", voteCount: 12 },
    ],
    closesAt: hoursAgo(-48),
    totalVotes: 78,
    hasVoted: true,
    viewerVoteOptionId: "opt-b",
  },
};

/** Closed poll — vote buttons hidden; results visible to everyone. */
export const DUMMY_POLL_CLOSED_POST: Post = {
  id: "post-poll-closed",
  author: DUMMY_POLL_POST.author,
  content: "Last week's poll — closed. The team picked option B by a wide margin.",
  createdAt: daysAgo(8),
  likes: 56,
  comments: 14,
  shares: 3,
  poll: {
    options: [
      { id: "opt-a", label: "Single-step (just email)", voteCount: 22 },
      { id: "opt-b", label: "Two-step (email + workspace)", voteCount: 91 },
      { id: "opt-c", label: "Three-step with role pick", voteCount: 18 },
    ],
    closesAt: daysAgo(1), // closed 1 day ago
    totalVotes: 131,
  },
};

/** Repost — nested compact mini-card pointing at DUMMY_FEATURED_POST. */
export const DUMMY_REPOST_POST: Post = {
  id: "post-repost",
  author: {
    id: "u-elena",
    name: "Elena Marchetti",
    username: "elena",
    avatar: "https://i.pravatar.cc/100?img=29",
  },
  content:
    "Reposting Hana's announcement — three months of cross-team work shipping next week. If you're on the launch list, watch this space for the rollout cadence.",
  createdAt: minutesAgo(35),
  visibility: "public",
  likes: 73,
  comments: 9,
  shares: 5,
  repostOf: DUMMY_FEATURED_POST,
};

/** Link preview — OG card renders below content + above any media. */
export const DUMMY_LINK_PREVIEW_POST: Post = {
  id: "post-linkpreview",
  author: {
    id: "u-akira",
    name: "Akira Tanaka",
    username: "akira",
    avatar: "https://i.pravatar.cc/100?img=58",
  },
  content:
    "Worth a read if you're working on shadcn-registry distribution — the namespace pattern alone unlocks a lot.",
  createdAt: hoursAgo(11),
  likes: 142,
  comments: 22,
  shares: 18,
  linkPreview: {
    url: "https://ui.shadcn.com/docs/registry",
    title: "shadcn/ui — Registry",
    description:
      "Build your own component distribution platform with the same primitives the shadcn CLI ships against.",
    siteName: "ui.shadcn.com",
    image: PEXELS_IMG_1,
  },
};

/** Reply — "Replying to @username" sub-line above the header (feed/detail only). */
export const DUMMY_REPLY_POST: Post = {
  id: "post-reply",
  author: {
    id: "u-sina",
    name: "Sina Aytaç",
    username: "sina",
    avatar: "https://i.pravatar.cc/100?img=68",
  },
  content:
    "@mira agree on the deprecation thread — the migration tooling at component count > 60 is where the real cost is, not the surface area itself.",
  createdAt: minutesAgo(20),
  likes: 8,
  comments: 1,
  shares: 0,
  replyTo: {
    id: DUMMY_TEXT_ONLY_POST.id,
    author: DUMMY_TEXT_ONLY_POST.author,
  },
  mentions: [
    {
      id: "u-mira",
      name: "Mira Solano",
      username: "mira",
      range: [0, 5], // "@mira"
    },
  ],
};

/** Rich post — combines tags + location + visibility + editedAt + mentions
 *  to showcase header sub-row density. */
export const DUMMY_RICH_POST: Post = {
  id: "post-rich",
  author: {
    id: "u-camille",
    name: "Camille Dubois",
    username: "camille",
    avatar: "https://i.pravatar.cc/100?img=23",
    isVerified: true,
  },
  content:
    "Field report from the field test — @theo nailed the prototype handoff, location pin attached. Tags below for retrieval.",
  createdAt: hoursAgo(5),
  editedAt: hoursAgo(4),
  visibility: "circle",
  likes: 67,
  comments: 11,
  shares: 4,
  location: {
    name: "Marseille, FR",
    lat: 43.296482,
    lng: 5.36978,
  },
  tags: ["fieldtest", "prototype", "v0.2"],
  mentions: [
    { id: "u-theo", name: "Theo Zarrin", username: "theoz", range: [35, 40] }, // "@theo"
  ],
  language: "en",
};

export const DUMMY_POSTS: Post[] = [
  DUMMY_TEXT_ONLY_POST,
  DUMMY_SINGLE_IMAGE_POST,
  DUMMY_MULTI_IMAGE_POST,
  DUMMY_VIDEO_POST,
  DUMMY_MIXED_MEDIA_POST,
  DUMMY_FEATURED_POST,
  DUMMY_LONG_TEXT_POST,
  // v0.2.0 additions:
  DUMMY_PINNED_POST,
  DUMMY_SENSITIVE_POST,
  DUMMY_POLL_POST,
  DUMMY_POLL_VOTED_POST,
  DUMMY_POLL_CLOSED_POST,
  DUMMY_REPOST_POST,
  DUMMY_LINK_PREVIEW_POST,
  DUMMY_REPLY_POST,
  DUMMY_RICH_POST,
];

export const DUMMY_DETAIL_THREAD: Comment[] = [
  {
    id: "c-1",
    author: {
      id: "u-mira",
      name: "Mira Solano",
      username: "mira",
      avatar: "https://i.pravatar.cc/100?img=47",
    },
    content:
      "Saving this for later — exactly what I've been trying to articulate to my team.",
    createdAt: minutesAgo(15),
    likes: 8,
    isLiked: false,
  },
  {
    id: "c-2",
    author: {
      id: "u-theo",
      name: "Theo Zarrin",
      username: "theoz",
      avatar: "https://i.pravatar.cc/100?img=12",
    },
    content: "Where can I read more on this?",
    createdAt: minutesAgo(45),
    likes: 2,
    replies: [
      {
        id: "c-2-r-1",
        author: {
          id: "u-sina",
          name: "Sina Aytaç",
          username: "sina",
          avatar: "https://i.pravatar.cc/100?img=68",
        },
        content: "I'll DM you a reading list.",
        createdAt: minutesAgo(40),
        likes: 1,
      },
    ],
  },
];

export function createDummyEngagementSubscribe(): Subscribe<EngagementDelta> {
  return (handler) => {
    let tick = 0;
    const id = setInterval(() => {
      tick++;
      const variant = tick % 3;
      if (variant === 0) {
        handler({ kind: "like-changed", count: 142 + tick * 2 });
      } else if (variant === 1) {
        handler({ kind: "comment-count-changed", count: 23 + tick });
      } else {
        handler({ kind: "view-count-changed", count: 12_345 + tick * 137 });
      }
    }, 5000);
    return () => clearInterval(id);
  };
}

export function createDummyCommentSubscribe(): Subscribe<CommentDelta> {
  return (handler) => {
    let tick = 0;
    const id = setInterval(() => {
      tick++;
      handler({
        kind: "added",
        comment: {
          id: `live-c-${Date.now()}`,
          author: {
            id: `u-live-${tick}`,
            name: `Live User ${tick}`,
            username: `live${tick}`,
            avatar: `https://i.pravatar.cc/100?img=${(tick % 70) + 1}`,
          },
          content: `Live comment #${tick} arriving via subscribe.`,
          createdAt: new Date(),
          likes: 0,
        },
      });
    }, 7000);
    return () => clearInterval(id);
  };
}
