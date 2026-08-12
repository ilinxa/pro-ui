import type { ComponentMeta } from "../../../types";

export const meta: ComponentMeta = {
  slug: "empty-state",
  name: "Empty State",
  category: "feedback",

  description:
    "The designed answer for empty surfaces — icon or illustration, title, description, capability-gated actions, and a hint, across 6 variants and 3 sizes.",
  context:
    "General-purpose empty-state for any surface that can render nothing: empty tables/lists, no-results search, failed fetches, offline banners, permission walls, first-run onboarding. The host decides when it's empty and supplies copy + handlers via props; this component only renders the answer — no data fetching, no state detection. Distinct from `DetailPanelEmptyState` (detail-panel's internal empty view) — no cross-dependency either direction, composition happens at the host (decision #35). Single-unit presentational widget: stateless, no context, capability-gated action slots (omit a handler and its button/link is absent from the DOM).",
  features: [
    "6 semantic variants — default / search / error / offline / permission / first-use — each with its own default lucide icon and tone",
    "3 sizes (sm / md / lg) — type scale, icon-tile scale, and padding",
    "icon slot (overrides the variant default) or media slot (illustration; replaces the icon tile + bloom entirely)",
    "Capability-gated action + secondaryAction — object form renders a real Button (or a plain <a> via buttonVariants when href is set, never asChild), ReactNode form for full control; omit both and no button/link renders",
    "Optional footer hint slot for micro-copy (e.g. a keyboard shortcut)",
    "frame prop — 'none' (bare) / 'dashed' (dropzone-style border) / 'card' (raised bg-card surface)",
    "Semantic heading level via headingLevel (1-6, default 3) so empties participate in the page outline",
    "role='status' aria-live='polite' only on transient variants (search / error / offline); static walls (permission / first-use) stay silent landmarks",
    "60ms-staggered entrance reveal via tw-animate-css motion-safe utilities — no app-level reveal-up dependency, so consumers get the animation without the docs-site keyframe",
    "animated={false} renders SSR-stable with no reveal classes; reduced-motion respected automatically",
    "Decorative spinning dashed ring on the first-use variant's icon tile, disabled under reduced motion and when animated={false}",
    "Design-token only — no hex/rgb literals, both themes",
  ],
  tags: [
    "empty-state",
    "feedback",
    "empty",
    "no-results",
    "error-state",
    "offline",
    "permission",
    "onboarding",
    "placeholder",
  ],

  version: "0.1.0",
  status: "alpha",
  artifactBudgetKB: 20,
  createdAt: "2026-08-12",
  updatedAt: "2026-08-12",

  author: { name: "ilinxa" },

  dependencies: {
    shadcn: ["button"],
    npm: {
      "lucide-react": "^1.11.0",
    },
    internal: [],
  },

  related: ["detail-panel", "data-table", "file-manager"],
};
