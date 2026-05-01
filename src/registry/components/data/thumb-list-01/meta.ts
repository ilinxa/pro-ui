import type { ComponentMeta } from "../../../types";

export const meta: ComponentMeta = {
  slug: "thumb-list-01",
  name: "Thumb List 01",
  category: "data",

  description:
    "Linked thumbnail-list block — small image + title + meta line per row, each row a single link target.",
  context:
    "Built for sidebars and dropdowns: related posts, popular articles, search-suggestion results, 'up next' media queues, file-picker recents. Short lists only (3–10 items typically; cap ~20). Same family rhythm as author-card-01 / newsletter-card-01 — composes cleanly in the same sidebar. Polymorphic link component, custom meta render slot, frame toggle, empty state.",
  features: [
    "Fixed-shape items (id / title / imageSrc / imageAlt? / meta? / href?)",
    "Polymorphic link via linkComponent slot (default native anchor)",
    "renderMeta slot for dates / badges / scores / custom meta UI",
    "Frame toggle (framed: true card-style, false borderless inline)",
    "Custom or default header icon (Lucide); pass null to hide",
    "Empty state: emptyState ReactNode OR labels.emptyText fallback",
    "Configurable heading level (h2 / h3 / h4)",
    "i18n via labels prop with English defaults",
    "Memoized; SSR-safe; lazy-loaded thumbnails",
    "Keyboard parity (focus-visible:text-primary mirrors hover)",
  ],
  tags: ["thumb-list-01", "list", "thumbnails", "related", "sidebar", "data"],

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

  related: ["author-card-01", "newsletter-card-01", "content-card-news-01"],
};
