import type { ComponentMeta } from "../../../types";

export const meta: ComponentMeta = {
  slug: "author-card",
  name: "Author Card",
  category: "marketing",

  description:
    "Person identity card — avatar, name, role, optional bio, optionally clickable.",
  context:
    "Surfaces authorship context next to a piece of content: news article sidebars, blog post bylines, doc page authors, team listings, comment headers, contributor cards. Sized for sidebars (works at ~280px and up). Avatar is image-or-icon-fallback; the whole card optionally renders as a link via polymorphic root + href. Same visual rhythm as newsletter-signup / category-cloud / filter-bar — composes cleanly in the same sidebar.",
  features: [
    "Image-or-icon-fallback avatar",
    "3 tones (primary / accent / muted)",
    "Polymorphic root — pass href + linkComponent to make the whole card a link",
    "Custom fallback icon via fallbackIcon prop (e.g. Users for collectives)",
    "Configurable heading level (h2 / h3 / h4)",
    "i18n via labels prop with English defaults",
    "Memoized; SSR-safe; lazy-loaded image",
  ],
  tags: ["author-card", "author", "byline", "profile", "card", "marketing"],

  version: "0.2.0",
  status: "alpha",
  createdAt: "2026-05-02",
  updatedAt: "2026-08-11",

  author: { name: "ilinxa" },

  dependencies: {
    shadcn: [],
    npm: { "lucide-react": "^1.11.0" },
    internal: [],
  },

  related: ["newsletter-signup", "thumbnail-list", "news-card"],
};
