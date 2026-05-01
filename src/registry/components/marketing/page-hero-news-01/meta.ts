import type { ComponentMeta } from "../../../types";

export const meta: ComponentMeta = {
  slug: "page-hero-news-01",
  name: "Page Hero (News 01)",
  category: "marketing",

  description:
    "Full-bleed gradient hero band with badge / title / highlight / description / children slot. Reveal-on-mount animation via the project's `reveal-up` keyframe (no framer-motion peer). Includes a `HeroStats` sub-component for the typical icon-value-label triplet.",
  context:
    "Top-of-page hero band for landing pages, blog indexes, marketing sections, and app welcomes. Three density levels (compact / default / full) cover full-screen splashes down to sub-page banners. Engine is generic; news-flavored defaults live in dummy-data + demo (kasder NewsHero's content). Composable `children` slot supports stats / CTAs / search / anything. Migration origin: kasder kas-social-front-v0 commons/PageHero.tsx (engine) + sections/news/NewsHero.tsx (news-flavored shell). Drops framer-motion in favor of the existing pro-ui CSS keyframe — saves ~100KB peer dep + inherits prefers-reduced-motion respect for free.",
  features: [
    "Full-bleed gradient hero band — 3 density levels (compact 40vh / default 70vh / full 100vh)",
    "4-tier reveal stagger via project's `reveal-up` keyframe — badge / title / description / children, 60ms apart",
    "Drops framer-motion peer dep (~100KB) — uses existing pro-ui CSS keyframe",
    "`prefers-reduced-motion` respect inherited from the keyframe — content fades instantly for reduced-motion users",
    "Badge chip (rounded-full, accent tint) with optional Lucide-style icon",
    "Title-with-highlight pattern — second `<span>` rendered as a new line in accent color",
    "`titleSlot` prop accepts ReactNode for rich custom rendering",
    "`children` slot for stats / CTAs / search / breadcrumbs / anything",
    "`HeroStats` sub-component exported separately for the icon-circle + value + label triplet pattern",
    "Bottom SVG wave that fills with `--background` so the hero transitions cleanly",
    "Subtle SVG noise pattern overlay on the gradient",
    "ARIA — `aria-labelledby` wires section landmark to title id (useId)",
    "Heading semantic level configurable via `headingAs` (h1 | h2 | h3)",
    "`disableReveal` prop for SSR-only contexts",
    "React.memo wrapped",
  ],
  tags: ["page-hero-news-01", "marketing", "hero", "landing", "migration", "news"],

  version: "0.1.0",
  status: "alpha",
  createdAt: "2026-05-02",
  updatedAt: "2026-05-02",

  author: { name: "ilinxa" },

  dependencies: {
    shadcn: ["button", "tabs"],
    npm: {
      "lucide-react": "^1.11.0",
    },
    internal: [],
  },

  related: ["newsletter-card-01", "content-card-news-01"],
};
