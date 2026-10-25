import type { ComponentMeta } from "../../../types";

export const meta: ComponentMeta = {
  slug: "people-grid",
  name: "People Grid",
  category: "data",

  description:
    "Responsive grid of person cards — avatar with initials fallback, name, title, per-card links, and a custom item renderer.",
  context:
    "Use for conference speakers, team / about-us pages, board / committee lists, contributor grids, podcast guests, course instructors, judge lineups. Migration origin: kasder kas-social-front-v0 events/[id]/page.tsx Konuşmacılar (Speakers) block. The `getInitials` helper is reusable for mention chips, comment headers, contact rows.",
  features: [
    "Responsive grid — columns 2/3/4/5 with built-in breakpoint scaling (all start at 1 col mobile)",
    "Avatar size variants (sm/md/lg)",
    "Alignment (center/start)",
    "Card heading one level below the section heading by default (h2 -> h3); cardHeadingAs overrides (h3-h6)",
    "renderActions / renderBadge slots on the default card, raised above the card link so their clicks never navigate (tab order: badge, actions, card link)",
    "locale prop — locale-aware initials casing (tr: ilker yılmaz -> İY)",
    "Image pass-through: imageWidth / imageHeight / imageSrcSet / imageSizes, decoding=async; avatar alt defaults to empty (decorative), imageAlt overrides",
    "Initials fallback when image is missing — handles Dr./Prof./etc. honorifics",
    "Public getInitials(name, locale | { locale, honorifics, fallback }) helper — grapheme-safe, locale-aware, custom honorifics",
    "Polymorphic per-card link via linkComponent + per-item href (overlay-link pattern)",
    "Custom renderItem slot for full per-person takeover",
    "Optional section heading with configurable level (h2/h3/h4, default h2)",
    "Soft-failure on optional fields (title / image / imageAlt / href)",
    "labels.emptyText with an undefined value keeps its default; defaultPeopleGridLabels exported (DEFAULT_PEOPLE_GRID_LABELS kept as a deprecated alias)",
    "Empty state slot + labels.emptyText fallback",
    "<ul role='list'> semantics + section aria-labelledby",
    "aria-labelledby on per-card link → accessible name = person's name only",
    "Memoised card (React.memo)",
  ],
  tags: ["people-grid", "team", "speakers", "grid", "avatar"],

  version: "0.3.0",
  status: "alpha",
  artifactBudgetKB: 18,
  createdAt: "2026-05-02",
  updatedAt: "2026-10-25",

  author: { name: "ilinxa" },

  dependencies: {
    shadcn: [],
    npm: {},
    internal: [],
  },

  related: ["author-card", "info-list", "thumbnail-list"],
};
