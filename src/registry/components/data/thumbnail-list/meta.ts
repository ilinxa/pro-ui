import type { ComponentMeta } from "../../../types";

export const meta: ComponentMeta = {
  slug: "thumbnail-list",
  name: "Thumbnail List",
  category: "data",

  description:
    "Linked thumbnail list — small image, title, and meta line per row, each row one link target.",
  context:
    "Built for sidebars and dropdowns: related posts, popular articles, search-suggestion results, 'up next' media queues, file-picker recents. Short lists only (3–10 items typically; cap ~20). Same family rhythm as author-card / newsletter-signup — composes cleanly in the same sidebar. Polymorphic link component, custom meta render slot, frame toggle, empty state.",
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
  tags: ["thumbnail-list", "list", "thumbnails", "related", "sidebar", "data"],

  version: "0.2.0",
  status: "alpha",
  artifactBudgetKB: 10,
  createdAt: "2026-05-02",
  updatedAt: "2026-08-11",

  author: { name: "ilinxa" },

  dependencies: {
    shadcn: [],
    npm: { "lucide-react": "^1.11.0" },
    internal: [],
  },

  related: ["author-card", "newsletter-signup", "news-card"],
};
