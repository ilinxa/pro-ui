import type { AuthorEntity } from "./parts/field-author-picker";
import type { BodySlotValue, NewsCardItem } from "./types";

/**
 * Re-edit fixtures (shipped via `content-composer-fixtures`). Functions
 * (the demo uploader + author loader) live in `demo.tsx`, not here — fixtures
 * are data only.
 */

export const SAMPLE_AUTHORS: AuthorEntity[] = [
  { id: "u-1", name: "Dana Reyes" },
  { id: "u-2", name: "Sam Okonkwo" },
  { id: "u-3", name: "Mira Lindqvist" },
  { id: "u-4", name: "Theo Vance" },
];

/**
 * A published article to drive the re-edit round-trip. Its engagement counts
 * (`likeCount` / `commentCount` / `views`) are intentionally present so the demo
 * shows the adapter's OMIT rule: on re-publish, `toContentItem` never re-emits
 * them, so the page's PATCH/merge preserves the real numbers.
 */
export const SAMPLE_NEWS_ITEM: NewsCardItem = {
  id: "news-42",
  title: "City council approves the riverside transit corridor",
  image: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=1280&h=720&fit=crop&q=80",
  excerpt: "After a two-year review, the corridor breaks ground this spring.",
  category: "Local",
  slug: "riverside-transit-corridor",
  status: "published",
  visibility: "public",
  readTime: 4,
  language: "en",
  topics: ["transit", "infrastructure"],
  tags: ["riverside", "council"],
  authorEntity: { id: "u-1", name: "Dana Reyes" },
  isFeatured: true,
  likeCount: 128,
  commentCount: 24,
  views: 5400,
  publishedAt: "2026-05-20T09:00:00.000Z",
};

/** The persisted article body (NOT on NewsCardItem) — fed via `initialBody`. */
export const SAMPLE_NEWS_BODY: BodySlotValue = {
  kind: "richtext",
  value: [
    {
      type: "p",
      children: [
        {
          text: "The council voted 7–2 in favour of the corridor after a packed public session.",
        },
      ],
    },
    {
      type: "p",
      children: [
        { text: "Construction is expected to begin in April, with the first segment opening late next year." },
      ],
    },
  ],
};
