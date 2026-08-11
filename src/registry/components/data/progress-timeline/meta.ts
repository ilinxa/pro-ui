import type { ComponentMeta } from "../../../types";

export const meta: ComponentMeta = {
  slug: "progress-timeline",
  name: "Progress Timeline",
  category: "data",

  description:
    "Horizontal progress bar with a current-position marker and start, state-aware center, and end captions — derives its state from three dates.",
  context:
    "Use for any time-bound progress display — registration windows, sprints, sales countdowns, course completion windows, fundraising deadlines. Public helper `deriveTimelineState` exported alongside so consumers can derive state without rendering (header counters, calendar coloring, deterministic tests). Migration origin: kasder events/[id]/page.tsx Time Bar block.",
  features: [
    "Horizontal progress bar with marker dot at current %",
    "3-state state machine (before / active / after) auto-derived",
    "Public helper kernel — deriveTimelineState pure function",
    "Dynamic center label — string OR (state) => ReactNode",
    "Frame toggle (framed/bare) + marker toggle (dot/none)",
    "Optional heading with configurable level + icon",
    "value escape hatch for non-time-based progress",
    "now injection for deterministic / live-clock hosts",
    "statusOverride for preview / what-if states",
    "i18n via labels object (6 keys)",
    "WCAG — Radix Progress role=progressbar + aria-valuenow",
    "Status-conditional bar fill + marker color — before (muted gray), active (lime), after (mid-gray); pairs with center-text differentiation",
    "Soft-failure on invalid dates",
  ],
  tags: ["progress-timeline", "progress", "timeline", "countdown", "events"],

  version: "0.2.0",
  status: "alpha",
  createdAt: "2026-05-02",
  updatedAt: "2026-08-11",

  author: { name: "ilinxa" },

  dependencies: {
    shadcn: ["progress"],
    npm: { "lucide-react": "^1.11.0" },
    internal: [],
  },

  related: ["event-card", "schedule-list"],
};
