import type { ComponentMeta } from "../../../types";

export const meta: ComponentMeta = {
  slug: "flow-canvas-01",
  name: "Flow Canvas",
  category: "data",

  description:
    "Node-and-edge canvas with typed ports, three keystone registries (renderers / port types / edge types), recursive sub-object rendering, and JSON-based save/load — built on @xyflow/react.",
  context:
    "Use FlowCanvas to build flow editors, workflow canvases, AI agent graphs, visual configuration UIs, or any port-and-edge surface where nodes should be JSON-first. Every node carries a __type field that keys into a renderer registry; unknown shapes fall back to a built-in custom-JSON renderer. Connection ports live inside the data, recursively, so sub-objects can be extracted as standalone nodes through the same drop pipeline. The library is xyflow (formerly React Flow) — MIT-licensed, no feature gates.",
  features: [
    "Pan / zoom / fit-to-view with gradient background (light + dark themes)",
    "Renderer registry by __type — register any React component as a node renderer",
    "Built-in custom-JSON fallback for unrecognized shapes",
    "Port-type registry (5 built-in types: data / text / image / card / event)",
    "Edge-type registry with smoothstep default",
    "Controlled and uncontrolled state (data / defaultData / onChange)",
    "Imperative export via exportRef ({ withPorts } toggles source vs canvas)",
    "Typed connection validation, multi-edge per port, sub-object drag-extract (M2+)",
    "Read-only mode that preserves pan / zoom / select",
  ],
  tags: [
    "flow-canvas-01",
    "flow",
    "canvas",
    "node-editor",
    "graph",
    "workflow",
    "xyflow",
    "react-flow",
    "ports",
    "edges",
  ],

  version: "0.1.3",
  status: "alpha",
  createdAt: "2026-05-06",
  updatedAt: "2026-05-11",

  author: { name: "ilinxa" },

  dependencies: {
    shadcn: ["button", "context-menu", "dialog", "textarea"],
    npm: {
      "@xyflow/react": "^12.10.2",
      "lucide-react": "^1.11.0",
    },
    internal: [],
  },

  related: ["kanban-board-01", "workspace"],
};
