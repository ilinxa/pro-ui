import type { ComponentMeta } from "../../../types";

export const meta: ComponentMeta = {
  slug: "magazine-layout",
  name: "Magazine Layout",
  category: "layout",

  description:
    "Slot-based magazine layout — hero, filter bar, sidebar, and a mixed-size article grid with infinite scroll and a filter hook.",
  context:
    "The layout assembly for the news-domain family. Generic over `T`; renders cards via a `renderItem(item, slot)` callback so the layout itself imports nothing from sibling registry components — composition happens at the consumer level. Pair with news-card (renderItem), filter-bar (filterBar slot), category-cloud + newsletter-signup (sidebar slot), and page-hero (hero slot) for the full kasder magazine experience. The companion `useMagazineFilter` hook gives the simple consumer one-line filter+page state; sophisticated consumers skip the hook and drive props from React Query / their router. Migration origin: kasder kas-social-front-v0 NewsMagazineGrid.tsx (~320-line component) → distilled to this slot-based shell + a 60-line filter hook. The original's filter logic / chip row / search / date picker / sidebar contents all moved into the dedicated sibling components.",
  features: [
    "Slot-based layout — `hero` / `filterBar` / `sidebar` / `renderItem` / `renderFeatured` / `emptyState`",
    "Generic over item type via `<MagazineLayout<T>>`",
    "Magazine-tower main column — 1 large + 2-up medium row + 3-up medium grid",
    "Persistent featured slot via `featuredItem` prop — the companion hook keeps it out of the paged regular list, so it renders once and survives load-more",
    "Sticky sidebar (`sticky top-24`) with `<aside>` landmark",
    "IntersectionObserver-driven infinite scroll via internal `useInfiniteScroll` hook",
    "Bouncing-3-dots loader with `aria-live='polite'` and visually-hidden text label",
    "End-of-list announcement also `aria-live='polite'`",
    "Empty state slot or `labels.emptyStateText` fallback",
    "Companion `useMagazineFilter` hook — in-memory filter + sort + page + simulated loading",
    "Sealed-folder convention — layout imports zero sibling registry components at runtime",
  ],
  tags: ["magazine-layout", "layout", "magazine", "feed", "infinite-scroll", "migration", "news"],

  version: "0.3.0",
  status: "alpha",
  artifactBudgetKB: 20,
  createdAt: "2026-05-02",
  updatedAt: "2026-08-11",

  author: { name: "ilinxa" },

  dependencies: {
    shadcn: [],
    npm: {},
    internal: [],
  },

  related: [
    "news-card",
    "filter-bar",
    "category-cloud",
    "newsletter-signup",
    "page-hero",
  ],
};
