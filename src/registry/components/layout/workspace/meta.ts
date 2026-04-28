import type { ComponentMeta } from "../../../types";

export const meta: ComponentMeta = {
  slug: "workspace",
  name: "Workspace",
  category: "layout",

  description:
    "A splittable, mergeable canvas of editor areas — a dynamic layout primitive for dashboards, dev tools, and data apps.",
  context:
    "Workspace is the registry's foundational layout primitive: a single root container that tiles its viewport with rectangular editor areas (no float, no overlap). Each area picks from a consumer-supplied registry of components via a top-left dropdown. Users split areas by dragging a corner inward, merge by dragging a corner out into a neighboring area, and resize by dragging shared edges. The component is content-agnostic — consumers register what's pluggable. Designed for web apps where one fixed layout never fits everyone's workflow.",
  features: [
    "Splittable / mergeable canvas via corner-drag gestures (with keyboard parity)",
    "Per-area component registry with a dropdown selector",
    "Per-breakpoint hard cap on split depth (preventive + adaptive)",
    "Responsive collapse to a 1-column card stack on mobile",
    "State preservation: splitting keeps the original area's component instance and state",
    "Saved presets switchable via tabs",
  ],
  tags: ["workspace", "layout", "split", "panels", "tiling", "dashboard"],

  version: "0.1.0",
  status: "alpha",
  createdAt: "2026-04-27",
  updatedAt: "2026-04-27",

  author: { name: "ilinxa" },

  dependencies: {
    shadcn: ["dropdown-menu", "scroll-area", "tabs"],
    npm: { "lucide-react": "^1.11.0" },
    internal: [],
  },

  related: [],
};
