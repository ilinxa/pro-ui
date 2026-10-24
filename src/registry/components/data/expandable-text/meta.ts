import type { ComponentMeta } from "../../../types";

export const meta: ComponentMeta = {
  slug: "expandable-text",
  name: "Expandable Text",
  category: "data",

  description:
    "Truncating text block — plain or rich children — that shows its toggle only when text overflows; configurable clamp, bidi-safe, controlled or uncontrolled.",
  context:
    "Use for any user-authored multi-line text where the surface budget is bounded — post bodies, comment bodies, event descriptions, news excerpts, product descriptions, profile bios. Pure CSS line-clamp clips silently; this component measures scrollHeight against lineHeight × maxLines after mount + on resize, so the 'show more' toggle only appears when content actually exceeds the budget. Migration origin: kasder kas-social-front-v0 PostContent.tsx; first ship in the 8-component social-posts-system arc.",
  features: [
    "Measure-based truncation detection — toggle hidden when content fits",
    "Rich children (your own link / mention renderer) inside the clamp, rendered in a <div>; plain `content` stays a <p>",
    "Re-measure on content / measureKey / maxLines change, on container resize (ResizeObserver) and on DOM changes inside rich children (MutationObserver)",
    "Clamped from the first paint — no full-text flash or layout shift on hydration",
    "dir=\"auto\" on the text by default (bidi isolation), overridable",
    "Configurable maxLines (default 3)",
    "Controlled-or-uncontrolled expand state via expanded / defaultExpanded / onExpandedChange (the prop wins every render)",
    "Keyboard focus moving onto hidden content below the clamp expands it (controlled: asks)",
    "i18n via labels object (English defaults: 'Show more' / 'Show less'; an undefined key keeps its default)",
    "renderToggle slot for full toggle takeover",
    "Public useLineClampDetect hook export (optional observeMutations; line-height: normal handled)",
    "a11y: real <button> with aria-expanded + aria-controls; content id from useId; focus-visible ring",
    "Empty guard — renders nothing when there is neither content nor renderable children",
    "No peer deps beyond React",
  ],
  tags: ["expandable-text", "text", "truncate", "line-clamp", "expand"],

  version: "0.3.0",
  status: "alpha",
  artifactBudgetKB: 15,
  createdAt: "2026-05-02",
  updatedAt: "2026-10-24",

  author: { name: "ilinxa" },

  dependencies: {
    shadcn: [],
    npm: {},
    internal: [],
  },

  related: ["comment-thread", "post-card", "rich-text-editor", "info-list", "schedule-list"],
};
