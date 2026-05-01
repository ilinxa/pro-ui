export interface DemoArticle {
  id: string;
  title: string;
  excerpt: string;
  category: string;
  date: string;
  featured?: boolean;
}

export const DEMO_ARTICLES: DemoArticle[] = Array.from({ length: 14 }).map(
  (_, i) => ({
    id: String(i + 1),
    title:
      i === 0
        ? "Featured: Editorial team announces 2026 redesign"
        : `Article ${i + 1}: ${
            [
              "Urban planning trends shaping the year ahead",
              "Sustainability moves to center stage",
              "Smart city tech rolls out across metros",
              "Public transit goes electric",
              "Permitting goes digital, finally",
              "Award-winning planners share their process",
              "AI buildings cut energy use",
              "Restoration goes 3D",
              "Mobility summit dates announced",
              "Heat island strategies tested",
              "Walkability guide published",
              "Bike lane investments accelerate",
              "Year-end community report",
            ][i - 1] ?? "Latest from the editorial team"
          }`,
    excerpt:
      "A short summary of the article — used to give the reader a taste of the content before they click through to the full piece.",
    category: ["Urban", "Sustainability", "Tech", "Events", "Research"][i % 5],
    date: new Date(Date.now() - i * 86400000).toLocaleDateString(undefined, {
      day: "numeric",
      month: "short",
      year: "numeric",
    }),
    featured: i === 0,
  }),
);
