import type { ComponentMeta } from "../../../types";

export const meta: ComponentMeta = {
  slug: "media-editor-01",
  name: "Media Editor 01",
  category: "media",

  description:
    "TODO: short, single-sentence description of what the component does.",
  context:
    "TODO: a paragraph explaining when and why to use this component, where it sits in the overall system, and what it composes.",
  features: ["TODO: replace with real features"],
  tags: ["media-editor-01"],

  version: "0.1.0",
  status: "alpha",
  createdAt: "2026-06-02",
  updatedAt: "2026-06-02",

  author: { name: "ilinxa" },

  dependencies: {
    // Grow progressively as each commit's imports land (per `project_validate_meta_deps_lint` memory + plan C1 lock).
    // Verified at C1: konva ^10.3.0 + react-konva ^19.2.4 will be added when first source file imports them.
    // shadcn primitives (dialog, slider, popover, button, input, select) added when corresponding parts land in C3-C12.
    shadcn: [],
    npm: {},
    internal: [],
  },

  related: [],
};
