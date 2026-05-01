import type { ComponentMeta } from "../../../types";

export const meta: ComponentMeta = {
  slug: "grid-layout-news-01",
  name: "Grid Layout (News 01)",
  category: "layout",

  description:
    "Slot-based magazine layout — optional hero / filter bar / sidebar + a generic main-column tower (1 large + 2-up + N-up medium grid) + IntersectionObserver-driven infinite scroll. Generic over item type. Companion `useMagazineFilter` hook for in-memory filter + page state.",
  context:
    "The layout assembly for the news-domain family. Generic over `T`; renders cards via a `renderItem(item, slot)` callback so the layout itself imports nothing from sibling registry components — composition happens at the consumer level. Pair with content-card-news-01 (renderItem), filter-bar-01 (filterBar slot), category-cloud-01 + newsletter-card-01 (sidebar slot), and page-hero-news-01 (hero slot) for the full kasder magazine experience. The companion `useMagazineFilter` hook gives the simple consumer one-line filter+page state; sophisticated consumers skip the hook and drive props from React Query / their router. Migration origin: kasder kas-social-front-v0 NewsMagazineGrid.tsx (~320-line component) → distilled to this slot-based shell + a 60-line filter hook. The original's filter logic / chip row / search / date picker / sidebar contents all moved into the dedicated sibling components.",
  features: [
    "Slot-based layout — `hero` / `filterBar` / `sidebar` / `renderItem` / `renderFeatured` / `emptyState`",
    "Generic over item type via `<GridLayoutNews01<T>>`",
    "Magazine-tower main column — 1 large + 2-up medium row + 3-up medium grid",
    "Featured-only-on-page-1 semantics via `featuredItem` prop",
    "Sticky sidebar (`sticky top-24`) with `<aside>` landmark",
    "IntersectionObserver-driven infinite scroll via internal `useInfiniteScroll` hook",
    "Bouncing-3-dots loader with `aria-live='polite'` and visually-hidden text label",
    "End-of-list announcement also `aria-live='polite'`",
    "Empty state slot or `labels.emptyStateText` fallback",
    "Companion `useMagazineFilter` hook — in-memory filter + sort + page + simulated loading",
    "Sealed-folder convention — layout imports zero sibling registry components at runtime",
  ],
  tags: ["grid-layout-news-01", "layout", "magazine", "feed", "infinite-scroll", "migration", "news"],

  version: "0.1.0",
  status: "alpha",
  createdAt: "2026-05-02",
  updatedAt: "2026-05-02",

  author: { name: "ilinxa" },

  dependencies: {
    shadcn: ["badge", "button", "input", "tabs"],
    npm: {},
    internal: [],
  },

  related: [
    "content-card-news-01",
    "filter-bar-01",
    "category-cloud-01",
    "newsletter-card-01",
    "page-hero-news-01",
  ],
};
