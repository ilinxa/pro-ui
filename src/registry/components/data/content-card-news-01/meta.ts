import type { ComponentMeta } from "../../../types";

export const meta: ComponentMeta = {
  slug: "content-card-news-01",
  name: "Content Card (News 01)",
  category: "data",

  description:
    "Magazine-style content card with 5 visual variants (featured / large / medium / small / list) for news, blog, or editorial layouts. Polymorphic root, soft-fail item shape, overlay-link pattern with optional actions slot, fully customizable formatting and theming.",
  context:
    "First component in the news-domain family (siblings: page-hero-news-01, grid-layout-news-01, detail-page-news-01-deferred). The card itself is layout-agnostic — flexes across container widths, dispatches all 5 variants from a single API. Migration origin: kasder kas-social-front-v0 NewsCard.tsx; design DNA preserved (serif typography, category-color map, gradient overlay on featured, eye-chip on medium, kicker footer with separator). Structural rewrites per the analysis: next/link → linkComponent slot, Turkish strings → labels object, NewsType → strict ContentCardItem with optional fields, single Link wrap → overlay-link pattern with actions slot. Pulls in a new pro-ui-wide --font-serif CSS variable defaulting to Playfair Display, customizable at any DOM scope.",
  features: [
    "5 visual variants — featured / large / medium / small / list — dispatched via single `variant` prop",
    "Overlay-link pattern (v0.1) — whole card clickable, optional `actions` slot for nested interactives",
    "Polymorphic root — `linkComponent` slot accepts NextLink / RemixLink / plain <a>",
    "Soft-fail item shape — only id/title/image required; excerpt/category/author/date/readTime/views all optional",
    "Localizable — `formatRelativeTime` + `formatDate` callbacks + `labels` object with English defaults",
    "Theming via `categoryStyles` map + `titleClassName` / `imageClassName` / `className` slots",
    "Editorial typography via pro-ui-wide --font-serif CSS variable (Playfair Display default; consumer-overridable)",
    "Featured-variant badge wears bg-black/40 backdrop-blur-sm chip for legibility on the dark gradient overlay",
    "Editorial kicker footer in `medium` — separator above author/date row",
    "View-count chip on `medium` (eye icon + bg-black/60 backdrop-blur-sm)",
    "ARIA — link aria-labelledby points to heading id (computed via useId); decorative icons aria-hidden; views chip labeled",
    "Focus-visible ring covers full card via :has(a:focus-visible)",
    "motion-safe: prefix on all transitions; reduced-motion users see static cards",
    "RTL aware — chevron + arrow icons flip via rtl:rotate-180",
    "React.memo wrapped — stable item refs prevent re-renders in long feeds",
  ],
  tags: [
    "content-card-news-01",
    "data",
    "card",
    "news",
    "editorial",
    "magazine",
    "migration",
  ],

  version: "0.1.0",
  status: "alpha",
  createdAt: "2026-05-01",
  updatedAt: "2026-05-01",

  author: { name: "ilinxa" },

  dependencies: {
    shadcn: ["badge", "button", "tabs"],
    npm: {
      "lucide-react": "^1.11.0",
    },
    internal: [],
  },

  related: ["data-table", "rich-card"],
};
