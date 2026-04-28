import type { ComponentMeta } from "../../../types";

export const meta: ComponentMeta = {
  slug: "data-table",
  name: "Data Table",
  category: "data",

  description:
    "A typed, composable table primitive with column accessors and per-cell rendering.",
  context:
    "DataTable is the foundational data display component — every more advanced table (sortable, paginated, virtualized) in this registry is expected to compose on top of it. It is deliberately small: one render, no client state, no DOM-level magic.",
  features: [
    "Generic over row type — fully type-safe column accessors",
    "Per-column alignment and fixed widths",
    "Custom empty state slot",
    "Composes any ReactNode in cells (badges, avatars, actions)",
  ],
  tags: ["table", "data", "list", "typed"],

  version: "0.1.0",
  status: "alpha",
  createdAt: "2026-04-26",
  updatedAt: "2026-04-26",

  author: { name: "ilinxa" },

  dependencies: {
    shadcn: ["table"],
    npm: {},
    internal: [],
  },

  related: [],
};
