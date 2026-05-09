import type { ComponentMeta } from "../../../types";

export const meta: ComponentMeta = {
  slug: "progress-timeline-01",
  name: "Progress Timeline 01",
  category: "data",

  description:
    "Horizontal progress bar with marker dot at current % + 3-caption row (start / dynamic state-aware center / end). Auto-derives 3-state machine (before/active/after) from start + end + now. Public helper kernel for state reuse outside the card.",
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
  tags: ["progress-timeline-01", "progress", "timeline", "countdown", "events"],

  version: "0.1.1",
  status: "alpha",
  createdAt: "2026-05-02",
  updatedAt: "2026-05-09",

  author: { name: "ilinxa" },

  dependencies: {
    shadcn: ["progress"],
    npm: { "lucide-react": "^1.11.0" },
    internal: [],
  },

  related: ["event-card-01", "schedule-list-01"],
};
