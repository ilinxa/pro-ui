import type { ContentCardItem } from "./types";

const today = new Date();
const daysAgo = (days: number): string =>
  new Date(today.getTime() - days * 24 * 60 * 60 * 1000).toISOString();

/**
 * 8 demo items spanning the 6 sample categories. The first item is the
 * "featured" piece for the Composed demo tab. Mix of populated and
 * absent optional fields demonstrates the soft-fail behavior:
 *
 *   • #6 has no `excerpt` (kicker-style "headline-only" card)
 *   • #7 has no `author` (anonymous announcement)
 *   • #8 has no `views` (medium variant omits the chip)
 */
export const dummyContentCardItems: ContentCardItem[] = [
  {
    id: "1",
    title: "Türkiye'nin Yeşil Şehir Dönüşümü: 2025 Hedefleri Açıklandı",
    excerpt:
      "Çevre ve Şehircilik Bakanlığı, 2025 yılına kadar 10 büyükşehirde yeşil alan oranını %40'a çıkarmayı hedefleyen kapsamlı planını açıkladı.",
    category: "Sustainability",
    author: "Ayşe Yılmaz",
    date: daysAgo(0),
    readTime: 8,
    image:
      "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=1200",
    views: 2453,
  },
  {
    id: "2",
    title: "Smart City Technology Summit Wraps Up in Istanbul",
    excerpt:
      "The conference brought together 2,000+ attendees from over 50 countries. AI-powered traffic management and energy optimization led the program.",
    category: "Events",
    author: "Mehmet Kaya",
    date: daysAgo(1),
    readTime: 5,
    image:
      "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800",
    views: 1876,
  },
  {
    id: "3",
    title: "Earthquake-Resilient Building Standards Updated",
    excerpt:
      "New regulations make seismic isolation systems mandatory in all new construction. Retrofit incentives announced for existing buildings.",
    category: "Urban Development",
    author: "Prof. Dr. Ali Demir",
    date: daysAgo(2),
    readTime: 12,
    image:
      "https://images.unsplash.com/photo-1486325212027-8081e485255e?w=800",
    views: 3421,
  },
  {
    id: "4",
    title: "Electric Public Transit Fleet Expanding Nationwide",
    excerpt:
      "Metropolitan bus fleets target 60% electrification by end of 2025. Charging infrastructure investments accelerate.",
    category: "Technology",
    author: "Zeynep Öztürk",
    date: daysAgo(3),
    readTime: 6,
    image:
      "https://images.unsplash.com/photo-1570125909232-eb263c188f7e?w=800",
    views: 987,
  },
  {
    id: "5",
    title: "Urban Renewal Permitting Goes Digital",
    excerpt:
      "The new e-government system promises 3-day turnaround on urban-renewal applications. Pilot launches in Istanbul.",
    category: "Announcement",
    author: "Burak Şahin",
    date: daysAgo(4),
    readTime: 4,
    image:
      "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800",
    views: 2134,
  },
  {
    id: "6",
    title: "European Urban Planning Award Goes to Ankara",
    category: "Research",
    author: "Dr. Selin Arslan",
    date: daysAgo(5),
    readTime: 7,
    image:
      "https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?w=800",
    views: 1543,
  },
  {
    id: "7",
    title: "Next-Gen Smart Buildings Cut Energy Use by 70%",
    excerpt:
      "IoT sensors and AI algorithms power a new wave of intelligent building systems, slashing operating costs.",
    category: "Technology",
    date: daysAgo(7),
    readTime: 9,
    image:
      "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800",
    views: 2876,
  },
  {
    id: "8",
    title: "Walkable Cities Design Guide Released",
    excerpt:
      "A comprehensive design guide for pedestrian-friendly urban planning, prepared for municipal teams.",
    category: "Announcement",
    author: "Editorial Team",
    date: daysAgo(18),
    readTime: 5,
    image:
      "https://images.unsplash.com/photo-1519501025264-65ba15a82390?w=800",
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// v0.3.0 demo fixtures — exercise the new editorial features
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Featured + breaking-news fixture — exercises isBreaking + isLive + live-update sub-line.
 */
export const breakingNewsItem: ContentCardItem = {
  id: "v3-1",
  title: "BREAKING: Major Earthquake Strikes Eastern Anatolia",
  excerpt:
    "Magnitude 6.8 reported near Erzurum. Search-and-rescue teams deployed; first damage reports incoming.",
  category: "Urban Development",
  authorEntity: {
    id: "u-1",
    name: "Ayşe Yılmaz",
    role: "Chief Editor",
    avatar: "https://i.pravatar.cc/64?img=47",
    isVerified: true,
  },
  publisher: {
    id: "pub-1",
    name: "Anatolia Today",
    logo: "https://api.dicebear.com/7.x/initials/svg?seed=AT&backgroundColor=ef4444",
    slug: "anatolia-today",
  },
  publishedAt: daysAgo(0),
  isBreaking: true,
  isLive: true,
  lastLiveUpdateAt: daysAgo(0),
  liveUpdateCount: 14,
  readTime: 3,
  image:
    "https://images.unsplash.com/photo-1495344517868-8ebaf0a2044a?w=1200",
  views: 24530,
  likeCount: 1240,
  commentCount: 412,
  shareCount: 890,
  bookmarkCount: 234,
};

/**
 * Paywalled premium content fixture — exercises paywall + preview + CTA.
 */
export const paywalledItem: ContentCardItem = {
  id: "v3-2",
  title: "Inside the Smart-City Procurement Crisis",
  excerpt:
    "Six-month investigation exposes how vendor lock-in has cost three major cities over €40M.",
  category: "Research",
  authorEntity: {
    id: "u-2",
    name: "Dr. Selin Arslan",
    role: "Investigations",
    isVerified: true,
  },
  publishedAt: daysAgo(1),
  visibility: "subscribers",
  isExclusive: true,
  readTime: 18,
  image:
    "https://images.unsplash.com/photo-1486325212027-8081e485255e?w=1200",
  paywall: {
    isPaywalled: true,
    tier: "subscribers",
    preview:
      "What began as a routine audit in March 2025 has uncovered systemic procurement failures",
    ctaLabel: "Subscribe to read",
    ctaHref: "/subscribe",
  },
  views: 8930,
  likeCount: 421,
  commentCount: 89,
  bookmarkCount: 156,
};

/**
 * Sensitive content fixture — exercises sensitivity gate + contentWarnings.
 */
export const sensitiveItem: ContentCardItem = {
  id: "v3-3",
  title: "Field Report: Flood Aftermath in Black Sea Region",
  excerpt:
    "Visual documentation from the recent flooding. Reader discretion advised.",
  category: "Urban Development",
  authorEntity: {
    id: "u-3",
    name: "Mehmet Kaya",
    role: "Field Correspondent",
    avatar: "https://i.pravatar.cc/64?img=12",
  },
  publishedAt: daysAgo(2),
  readTime: 7,
  image:
    "https://images.unsplash.com/photo-1547036967-23d11aacaee0?w=1200",
  sensitivity: {
    isSensitive: true,
    reason: "Documentary imagery of disaster aftermath",
    contentWarnings: ["graphic imagery", "displacement"],
  },
  views: 4521,
  likeCount: 234,
  commentCount: 67,
};

/**
 * Editor-mode draft fixture — exercises status: "draft" + scheduled.
 */
export const draftItem: ContentCardItem = {
  id: "v3-4",
  title: "[DRAFT] Urban Renewal Permitting Goes Digital — Phase 2",
  excerpt:
    "Internal working title. Pending editorial review before scheduled publication.",
  category: "Announcement",
  authorEntity: {
    id: "u-4",
    name: "Burak Şahin",
    role: "Staff Writer",
  },
  publishedAt: daysAgo(3),
  scheduledFor: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
  status: "draft",
  visibility: "staff",
  readTime: 6,
  image:
    "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800",
};

/**
 * Sponsored content fixture — exercises isSponsored + sponsorLabel.
 */
export const sponsoredItem: ContentCardItem = {
  id: "v3-5",
  title: "How Modern Buildings Use AI to Cut Energy Costs",
  excerpt:
    "A practical look at the latest in IoT building automation, with case studies from three pilot deployments.",
  category: "Technology",
  authorEntity: {
    id: "u-5",
    name: "Sponsored Editorial",
    role: "Partner Content",
  },
  publishedAt: daysAgo(4),
  isSponsored: true,
  sponsorLabel: "GreenTech Industries",
  readTime: 6,
  image:
    "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800",
  views: 1234,
};

/**
 * Quoted-article fixture — analysis piece quoting a source article.
 */
export const quotingItem: ContentCardItem = {
  id: "v3-6",
  title: "Analysis: What the Procurement Investigation Means for Public Trust",
  excerpt:
    "Building on the original investigation, here are the three structural reforms that could prevent recurrence.",
  category: "Research",
  authorEntity: {
    id: "u-6",
    name: "Prof. Dr. Ali Demir",
    role: "Senior Analyst",
    isVerified: true,
  },
  publishedAt: daysAgo(0),
  readTime: 9,
  image:
    "https://images.unsplash.com/photo-1518770660439-4636190af475?w=800",
  views: 2103,
  likeCount: 87,
  commentCount: 24,
  quotedArticle: paywalledItem,
};

/**
 * Pinned + featured editor's pick — exercises multiple badges + isPinned + isFeatured.
 */
export const editorsPickItem: ContentCardItem = {
  id: "v3-7",
  title: "Türkiye's Carbon-Neutral City Pilots: Year One Results",
  excerpt:
    "First annual report card on the 2025 pilot cities. Three exceeded targets; one fell short.",
  category: "Sustainability",
  authorEntity: {
    id: "u-1",
    name: "Ayşe Yılmaz",
    role: "Chief Editor",
    avatar: "https://i.pravatar.cc/64?img=47",
    isVerified: true,
  },
  publishedAt: daysAgo(5),
  isPinned: true,
  isFeatured: true,
  isExclusive: true,
  readTime: 14,
  image:
    "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=1200",
  views: 18920,
  likeCount: 945,
  commentCount: 287,
  bookmarkCount: 512,
  shareCount: 401,
  topics: ["sustainability", "urban-planning", "annual-report"],
  tags: ["2025", "carbon-neutral", "pilot-program"],
};

/**
 * v0.3 fixture bundle — items that exercise the editorial feature surface.
 */
export const v3DummyItems: ContentCardItem[] = [
  breakingNewsItem,
  paywalledItem,
  sensitiveItem,
  draftItem,
  sponsoredItem,
  quotingItem,
  editorsPickItem,
];

/**
 * Sample category → Tailwind-class map. Acts as a usage example AND
 * documents the recommended shape for the `categoryStyles` prop.
 */
export const dummyCategoryStyles: Record<string, string> = {
  "Urban Development": "bg-primary/10 text-primary",
  Sustainability: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  Technology: "bg-accent/10 text-accent-foreground",
  Events: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  Announcement: "bg-destructive/10 text-destructive",
  Research: "bg-secondary text-secondary-foreground",
};
