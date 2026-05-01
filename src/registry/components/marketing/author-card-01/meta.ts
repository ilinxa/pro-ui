import type { ComponentMeta } from "../../../types";

export const meta: ComponentMeta = {
  slug: "author-card-01",
  name: "Author Card 01",
  category: "marketing",

  description:
    "Card-framed person identity block — avatar, name, role, optional bio. Optionally clickable.",
  context:
    "Surfaces authorship context next to a piece of content: news article sidebars, blog post bylines, doc page authors, team listings, comment headers, contributor cards. Sized for sidebars (works at ~280px and up). Avatar is image-or-icon-fallback; the whole card optionally renders as a link via polymorphic root + href. Same visual rhythm as newsletter-card-01 / category-cloud-01 / filter-bar-01 — composes cleanly in the same sidebar.",
  features: [
    "Image-or-icon-fallback avatar",
    "3 tones (primary / accent / muted)",
    "Polymorphic root — pass href + linkComponent to make the whole card a link",
    "Custom fallback icon via fallbackIcon prop (e.g. Users for collectives)",
    "Configurable heading level (h2 / h3 / h4)",
    "i18n via labels prop with English defaults",
    "Memoized; SSR-safe; lazy-loaded image",
  ],
  tags: ["author-card-01", "author", "byline", "profile", "card", "marketing"],

  version: "0.1.0",
  status: "alpha",
  createdAt: "2026-05-02",
  updatedAt: "2026-05-02",

  author: { name: "ilinxa" },

  dependencies: {
    shadcn: [],
    npm: { "lucide-react": "^0.x" },
    internal: [],
  },

  related: ["newsletter-card-01", "thumb-list-01", "content-card-news-01"],
};
