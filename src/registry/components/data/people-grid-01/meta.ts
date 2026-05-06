import type { ComponentMeta } from "../../../types";

export const meta: ComponentMeta = {
  slug: "people-grid-01",
  name: "People Grid 01",
  category: "data",

  description:
    "Section heading + responsive N-column grid of person cards (round avatar + name + title). Initials fallback when image is missing. Polymorphic per-card link, configurable columns / avatar size / alignment, custom renderItem slot. Public `getInitials` helper kernel.",
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
  tags: ["people-grid-01", "team", "speakers", "grid", "avatar"],

  version: "0.1.0",
  status: "alpha",
  createdAt: "2026-05-02",
  updatedAt: "2026-05-02",

  author: { name: "ilinxa" },

  dependencies: {
    shadcn: ["tabs"],
    npm: {},
    internal: [],
  },

  related: ["author-card-01", "info-list-01", "thumb-list-01"],
};
