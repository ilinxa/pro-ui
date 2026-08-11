import type { ComponentMeta } from "../../../types";

export const meta: ComponentMeta = {
  slug: "project-card",
  name: "Project Card",
  category: "data",

  description:
    "Project and case-study card with editorial status states and grid or feature layouts — overlay links and soft-failure item handling.",
  context:
    "Use when listing portfolio / case-study / completed-projects cards on a public page or embedded business-profile widget. The grid variant fits magazine grids (compose with magazine-layout + filter-bar + page-hero for the full page assembly with zero new code); the feature variant fits embedded mosaic widgets (designed for the future bento-grid-01 layout). Status is editorial — set on the data object by an editor, NOT derived from a clock; differs from event-card's time-window kernel by design. The public PROJECT_STATUS_CONFIG export lets consumers build status legends, count summaries, and filter rows that share the same color / label vocabulary as the card. Migration origin: kasder kas-social-front-v0 ProjectCard.tsx + BusinessProjectsSection.tsx.",
  features: [
    "3-state editorial status (completed / ongoing / planned) — set on data, not derived",
    "2 visual variants — grid (vertical image-on-top, hover-reveal CTA, lift-on-hover) and feature (full-bleed image background, white-on-dark, no hover-CTA)",
    "Public PROJECT_STATUS_CONFIG export — pure data, server-component-importable",
    "Polymorphic root via linkComponent (works with NextLink / RemixLink / etc.)",
    "Overlay-link pattern with optional actions slot for nested interactives",
    "categoryStyles map — per-category className + icon override (default: universal Building2 + neutral chip)",
    "Soft-failure on optional fields (location / year / image — all gracefully omitted)",
    "Image fallback — bg-muted block + Building2 icon when image is empty (no broken-image icon)",
    "Featured treatment — top accent border (grid) / inset ring (feature) + star title prefix",
    "href precedence chain — getHref(project) > href > project.href > '#'",
    "Zero new design-system tokens, zero new shadcn primitives, zero new peer deps",
    "WCAG 2.1 AA — aria-labelledby + useId, motion-safe gating, color-AND-text status differentiation",
  ],
  tags: ["project-card", "projects", "portfolio", "case-study", "status", "card"],

  version: "0.3.0",
  status: "alpha",
  createdAt: "2026-05-03",
  updatedAt: "2026-08-11",

  author: { name: "ilinxa" },

  dependencies: {
    shadcn: [],
    npm: {
      "lucide-react": "^1.11.0",
    },
    internal: [],
  },

  related: ["event-card", "news-card"],
};
