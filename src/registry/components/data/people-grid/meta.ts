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
    "Initials fallback when image is missing — handles Dr./Prof./etc. honorifics",
    "Public getInitials helper kernel exported as pure function",
    "Polymorphic per-card link via linkComponent + per-item href (overlay-link pattern)",
    "Custom renderItem slot for full per-person takeover",
    "Optional section heading with configurable level (h2/h3/h4, default h2)",
    "Soft-failure on optional fields (title / image / imageAlt / href)",
    "Empty state slot + labels.emptyText fallback",
    "<ul role='list'> semantics + section aria-labelledby",
    "aria-labelledby on per-card link → accessible name = person's name only",
  ],
  tags: ["people-grid", "team", "speakers", "grid", "avatar"],

  version: "0.2.0",
  status: "alpha",
  artifactBudgetKB: 15,
  createdAt: "2026-05-02",
  updatedAt: "2026-08-11",

  author: { name: "ilinxa" },

  dependencies: {
    shadcn: [],
    npm: {},
    internal: [],
  },

  related: ["author-card", "info-list", "thumbnail-list"],
};
