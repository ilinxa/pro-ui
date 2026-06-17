import type { ComponentMeta } from "../../../types";

export const meta: ComponentMeta = {
  slug: "blackboard-01",
  name: "Blackboard",
  category: "data",

  description:
    "A dark-navy chalkboard widget where a team writes handwritten notes — per-note ink, chalk width, and font, with auto-save, scroll-up lazy load, pin, @mentions, and a handwritten unread marker.",
  context:
    "A collaborative handwritten-note wall for dashboards and panels. Notes stream vertically (newest at the bottom) in the author's chosen ink color, chalk width, and handwriting font; the composer auto-saves (no Save button), scrolling up lazy-loads 10 older notes, hovering a note reveals its author inline, authors can @mention teammates and pin notes to a sticky row, and a handwritten red number marks unread notes. The board surface is themeable (color or custom image). Ships as a shadcn-style compound — headless BlackboardRoot + flat parts + standalone primitives + the Blackboard01 assembly — so a read-only wall falls out by dropping the composer. Portable by design: all persistence, real-time transport, and notifications are the consumer's via callbacks (no network I/O in the library).",
  features: [
    "Vertical handwritten-note stream with per-note ink color, chalk width, and handwriting font",
    "Auto-save (debounced, no Save button) + optimistic posting with reconcile/retry",
    "Scroll-up lazy loading (10-note pages) with scroll-anchored, jump-free prepend",
    "Inline author-on-hover label + handwritten red unread marker",
    "@mentions over a team roster + pin-to-sticky-row, both capability-gated",
    "Editable board background (solid color or custom image with legibility overlay)",
    "Compound: headless Root + flat à-la-carte parts; drop the composer for a free read-only board",
  ],
  tags: [
    "blackboard",
    "chalkboard",
    "collaboration",
    "notes",
    "handwriting",
    "mentions",
    "team",
    "feed",
  ],

  version: "0.1.0",
  status: "alpha",
  createdAt: "2026-06-18",
  updatedAt: "2026-06-18",

  author: { name: "ilinxa" },

  dependencies: {
    shadcn: ["button", "textarea"],
    npm: {
      "@fontsource/kalam": "^5.2.8",
      "@fontsource-variable/caveat": "^5.2.8",
      "@fontsource/patrick-hand": "^5.2.8",
      "@fontsource/shadows-into-light": "^5.2.8",
      "date-fns": "^4.1.0",
      "lucide-react": "^1.11.0",
    },
    internal: [],
  },

  related: ["comment-thread-01", "engagement-bar-01"],
};
