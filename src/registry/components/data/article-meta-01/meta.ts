import type { ComponentMeta } from "../../../types";

export const meta: ComponentMeta = {
  slug: "article-meta-01",
  name: "Article Meta 01",
  category: "data",

  description:
    "Horizontal strip of icon + value pairs surfacing key metadata (author / date / read-time / view-count) under an article title.",
  context:
    "Reach for it on any long-form content surface: news articles, blog post headers, doc page bylines, video player meta lines, podcast episode headers, forum thread titles, GitHub-issue-style metadata strips. Data-driven items array of arbitrary length and shape. Optional per-item href (with polymorphic linkComponent) makes individual items clickable (byline → author page, date → permalink). Optional bottom divider for the standard 'between hero and body' placement.",
  features: [
    "Data-driven items array (icon + value + optional href + optional ariaLabel)",
    "Polymorphic per-item link via linkComponent (default native anchor)",
    "Optional bottom divider (`pb-8 border-b border-border`)",
    "3 alignment modes (start / center / end)",
    "Tunable gap class (default `gap-6`; override for tighter rhythms)",
    "Items can omit `icon` for text-only strips",
    "Memoized; SSR-safe; <ul>/<li> semantics with Safari workaround",
  ],
  tags: ["article-meta-01", "meta", "byline", "metadata", "strip", "data"],

  version: "0.1.0",
  status: "alpha",
  createdAt: "2026-05-02",
  updatedAt: "2026-05-02",

  author: { name: "ilinxa" },

  dependencies: {
    shadcn: [],
    npm: {},
    internal: [],
  },

  related: ["author-card-01", "thumb-list-01", "share-bar-01"],
};
