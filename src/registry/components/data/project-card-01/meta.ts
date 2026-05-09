import type { ComponentMeta } from "../../../types";

export const meta: ComponentMeta = {
  slug: "project-card-01",
  name: "Project Card 01",
  category: "data",

  description:
    "Project / case-study preview card with 3-state editorial status (completed / ongoing / planned) and 2 visual variants (grid / feature). Polymorphic root, soft-failure item shape, overlay-link pattern, fully customizable. Public PROJECT_STATUS_CONFIG export for status-color / label reuse outside the card.",
  context:
    "Use when listing portfolio / case-study / completed-projects cards on a public page or embedded business-profile widget. The grid variant fits magazine grids (compose with grid-layout-news-01 + filter-bar-01 + page-hero-news-01 for the full page assembly with zero new code); the feature variant fits embedded mosaic widgets (designed for the future bento-grid-01 layout). Status is editorial — set on the data object by an editor, NOT derived from a clock; differs from event-card-01's time-window kernel by design. The public PROJECT_STATUS_CONFIG export lets consumers build status legends, count summaries, and filter rows that share the same color / label vocabulary as the card. Migration origin: kasder kas-social-front-v0 ProjectCard.tsx + BusinessProjectsSection.tsx.",
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
  tags: ["project-card-01", "projects", "portfolio", "case-study", "status", "card"],

  version: "0.1.1",
  status: "alpha",
  createdAt: "2026-05-03",
  updatedAt: "2026-05-09",

  author: { name: "ilinxa" },

  dependencies: {
    shadcn: [],
    npm: {
      "lucide-react": "^1.11.0",
    },
    internal: [],
  },

  related: ["event-card-01", "content-card-news-01"],
};
