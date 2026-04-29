import type { ComponentMeta } from "../../../types";

export const meta: ComponentMeta = {
  slug: "detail-panel",
  name: "Detail Panel",
  category: "feedback",

  description:
    "Selection-aware compound container with read/edit modes, lifecycle states, composite re-keying on selection change, sticky header + footer actions, and a slot-based body.",
  context:
    "Tier 1 pro-component for the graph-system. Pairs with properties-form as the inline editing surface. Useful standalone wherever a selection-driven side panel is needed (file inspector, item drawer, settings detail). Generic over entity type via host-supplied children. Three mode configurations (controlled / uncontrolled / locked); composite re-key on `${type}:${id}` change so slotted forms remount cleanly without state bleed. Detail-panel does NOT import properties-form at the registry level (decision #35); composition lives at the host level.",
  features: [
    "Compound API — DetailPanel.Header / .Body / .Actions via React Context",
    "Composite re-key on selection.type / selection.id change (host-form remount)",
    "Three mode configurations — controlled / uncontrolled / locked (dev-warned anti-pattern)",
    "Sticky header (top:0) + sticky footer actions (bottom:0); header-positioned actions opt-in",
    "Lifecycle precedence — error > loading > content > empty",
    "Render-fn Actions context — { mode, setMode, canEdit }",
    "Built-in skeleton mirrors panel layout; built-in error UI with optional retry",
    "Built-in empty state with sibling export for composition",
    "Focus management — selection-change focuses panel root; mode→edit focuses body's first focusable; mode→read restores focus to triggering action by id",
    "ARIA — role region, aria-busy on loading, aria-live polite selection announcements",
    "Imperative handle — focusBody() + resetMode()",
  ],
  tags: ["detail-panel", "feedback", "compound", "selection", "graph-system"],

  version: "0.1.0",
  status: "alpha",
  createdAt: "2026-04-29",
  updatedAt: "2026-04-29",

  author: { name: "ilinxa" },

  dependencies: {
    shadcn: ["button", "skeleton", "tabs", "badge"],
    npm: {
      "lucide-react": "^1.11.0",
    },
    internal: [],
  },

  related: ["properties-form", "rich-card"],
};
