import type { ComponentMeta } from "../../../types";

export const meta: ComponentMeta = {
  slug: "schedule-list",
  name: "Schedule List",
  category: "data",

  description:
    "Time-anchored agenda list — time or range, title, optional description and icons, per-row links, framed or bare.",
  context:
    "Use for conference programs, course curricula, podcast / broadcast schedules, meeting agendas, recipe-step lists with timing — anywhere a time-ordered list of activities renders. Migration origin: kasder kas-social-front-v0 events/[id]/page.tsx Program section. Composes naturally inside event-detail-page-01 (deferred sibling).",
  features: [
    "Vertical schedule list — time + title + optional description per row",
    "Optional time range (start - end), separator localizable",
    "Optional Lucide-style icon per row",
    "Polymorphic per-row link via linkComponent + per-item href",
    "Frame toggle (framed=true card chrome / framed=false bare rows)",
    "Custom renderItem + renderTime slots",
    "Optional section heading with configurable level (h2/h3/h4)",
    "Soft-failure on optional fields (description / icon / endTime / href)",
    "i18n via labels object",
    "Semantic <ol role='list'> — schedules are ordered",
    "Empty state slot with labels fallback",
  ],
  tags: ["schedule-list", "schedule", "agenda", "timeline", "events"],

  version: "0.2.0",
  status: "alpha",
  createdAt: "2026-05-02",
  updatedAt: "2026-08-11",

  author: { name: "ilinxa" },

  dependencies: {
    shadcn: [],
    npm: { "lucide-react": "^1.11.0" },
    internal: [],
  },

  related: ["event-card", "thumbnail-list"],
};
