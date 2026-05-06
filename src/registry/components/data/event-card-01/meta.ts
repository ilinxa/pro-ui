import type { ComponentMeta } from "../../../types";

export const meta: ComponentMeta = {
  slug: "event-card-01",
  name: "Event Card 01",
  category: "data",

  description:
    "Event preview card with a 6-state status state machine (open / upcoming / lastSpots / ongoing / full / expired) and 4 visual variants (grid / feed / list / compact). Polymorphic root, soft-failure item shape, overlay-link pattern, fully customizable. Public helper kernel exports for status / formatting reuse outside the card.",
  context:
    "Use when listing events on a community / association / conference / training site, or when mixing events into a multi-content feed. The grid variant fits magazine grids; the feed variant fits social-style single-column feeds; the list variant fits info-rich sidebars / dashboard listings; the compact variant fits text-only sidebar widgets / 'upcoming events' tickers. Public helpers (`getEventStatus`, `EVENT_STATUS_CONFIG`, `formatEventDate`, `getDaysUntilEvent`) are exported alongside the card so consumers can derive status independently for header counters, calendar coloring, filter logic, or deterministic tests — without rendering a card. Migration origin: kasder kas-social-front-v0 EventCard.tsx + SocialEventCard.tsx.",
  features: [
    "6-state status state machine (open / upcoming / lastSpots / ongoing / full / expired)",
    "4 visual variants — grid (image-on-top), feed (full-bleed background), list (info-rich row with thumbnail), compact (text-only minimal row)",
    "Status differentiated by BOTH color AND icon (color-blind safe)",
    "Public helper kernel — getEventStatus, EVENT_STATUS_CONFIG, formatEventDate, getDaysUntilEvent",
    "Polymorphic root via linkComponent (works with NextLink / RemixLink / etc.)",
    "Overlay-link pattern with optional actions slot for nested interactives",
    "Soft-failure on optional fields (capacity-less events skip full/lastSpots states + capacity bar)",
    "Deterministic status via optional `now` injection (testability + live-clock hosts)",
    "17-key labels object for full i18n",
    "typeStyles map for consumer-defined event-type taxonomies",
    "Featured treatment — top accent border (grid) / inset ring (feed) + star title prefix",
    "WCAG 2.1 AA — aria-labelledby + useId, motion-safe gating, capacity bar aria-label, color-AND-icon status",
  ],
  tags: ["event-card-01", "events", "status", "capacity", "card"],

  version: "0.1.0",
  status: "alpha",
  createdAt: "2026-05-02",
  updatedAt: "2026-05-02",

  author: { name: "ilinxa" },

  dependencies: {
    shadcn: ["button", "progress", "tabs"],
    npm: {
      "lucide-react": "^0.x",
    },
    internal: [],
  },

  related: ["content-card-news-01"],
};
