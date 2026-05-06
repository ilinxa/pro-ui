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

export const DUMMY_POSTS: Post[] = [
  DUMMY_TEXT_ONLY_POST,
  DUMMY_SINGLE_IMAGE_POST,
  DUMMY_MULTI_IMAGE_POST,
  DUMMY_VIDEO_POST,
  DUMMY_MIXED_MEDIA_POST,
  DUMMY_FEATURED_POST,
  DUMMY_LONG_TEXT_POST,
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
