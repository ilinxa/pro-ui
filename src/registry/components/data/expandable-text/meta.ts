import type { ComponentMeta } from "../../../types";

export const meta: ComponentMeta = {
  slug: "expandable-text",
  name: "Expandable Text",
  category: "data",

  description:
    "Truncating text block that only shows its toggle when text actually overflows — configurable line clamp, controlled or uncontrolled.",
  context:
    "Use for any user-authored multi-line text where the surface budget is bounded — post bodies, comment bodies, event descriptions, news excerpts, product descriptions, profile bios. Pure CSS line-clamp clips silently; this component measures scrollHeight against lineHeight × maxLines after mount + on resize, so the 'show more' toggle only appears when content actually exceeds the budget. Migration origin: kasder kas-social-front-v0 PostContent.tsx; first ship in the 8-component social-posts-system arc.",
  features: [
    "Measure-based truncation detection — toggle hidden when content fits",
    "Configurable maxLines (default 3)",
    "Controlled-or-uncontrolled expand state via expanded / defaultExpanded / onExpandedChange (mirrors React form-input convention)",
    "Re-measure on content + maxLines change AND on container resize (ResizeObserver)",
    "i18n via labels object (English defaults: 'Show more' / 'Show less')",
    "renderToggle slot for full toggle takeover",
    "Public useLineClampDetect hook export for advanced consumers",
    "a11y: real <button> with aria-expanded + aria-controls; <p> id from useId; focus-visible ring",
    "Empty content guard — renders nothing when content is empty/null",
    "No peer deps beyond React",
  ],
  tags: ["expandable-text", "text", "truncate", "line-clamp", "expand"],

  version: "0.2.0",
  status: "alpha",
  artifactBudgetKB: 10,
  createdAt: "2026-05-02",
  updatedAt: "2026-08-11",

  author: { name: "ilinxa" },

  dependencies: {
    shadcn: [],
    npm: {},
    internal: [],
  },

  related: ["rich-text-editor", "info-list", "schedule-list"],
};
