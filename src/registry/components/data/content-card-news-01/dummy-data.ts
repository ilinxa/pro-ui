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
