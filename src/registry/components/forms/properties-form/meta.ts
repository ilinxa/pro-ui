import type { ComponentMeta } from "../../../types";

export const meta: ComponentMeta = {
  slug: "properties-form",
  name: "Properties Form",
  category: "forms",

  description:
    "Schema-driven, controlled read/edit form for typed records — six built-in field types, three-state permissions, sync validation, and a custom-renderer slot.",
  context:
    "Tier 1 pro-component for the graph-system. Pairs with detail-panel as the inline editing surface for entity properties; useful standalone wherever a settings page or properties drawer needs typed fields without pulling in a full form library. Generic over the entity shape; the host owns the data and persistence; permission resolution is layered (host predicate → field declaration → default editable). Sync-only validation in two layers; async deferred to v0.2.",
  features: [
    "Six built-in field types — string, number, boolean, date, select, textarea",
    "Three-state permissions per field — editable / read-only / hidden",
    "Layered permission resolver (host predicate → declarative → default)",
    "Sync per-field + form-level validation; first-error focus on submit failure",
    "Counter-based dirty tracking with markClean / reset / isDirty",
    "Async onSubmit with 200ms-delayed spinner and aria-busy",
    "Custom renderer slot for non-built-in field types",
    "Imperative handle (submit / reset / markClean / isDirty / focusField)",
    "ARIA-complete: label, aria-required / -invalid / -describedby, error summary",
  ],
  tags: ["properties-form", "form", "schema", "validation", "graph-system"],

  version: "0.1.0",
  status: "alpha",
  createdAt: "2026-04-29",
  updatedAt: "2026-04-29",

  author: { name: "ilinxa" },

  dependencies: {
    shadcn: ["button", "input", "select", "switch", "textarea", "tooltip", "tabs", "badge"],
    npm: {
      "lucide-react": "^1.11.0",
      "radix-ui": "^1.4.3",
    },
    internal: [],
  },

  related: ["detail-panel", "rich-card"],
};
