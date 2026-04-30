import type { ComponentMeta } from "../../../types";

export const meta: ComponentMeta = {
  slug: "force-graph",
  name: "Force Graph",
  category: "data",

  description:
    "WebGL force-directed knowledge graph viewer (v0.1) — Sigma + graphology + ForceAtlas2 worker; origin-aware data model; soft/default edge differentiation per system decision #38.",
  context:
    "Tier 2 graph-system pro-component, phased v0.1–v0.6. v0.1 is the read-only viewer core: panning, zooming, FA2 layout in a Web Worker, theming via CSS vars, snapshot OR live-source data input, validated origin-aware data model. Selection / hover / drag land in v0.2; full CRUD in v0.3; groups + filters in v0.4; doc-node visuals + wikilink reconciliation in v0.5; perf hardening + multi-edge expansion + advanced settings in v0.6. Per decision #35, force-graph does NOT import any Tier 1 pro-component at the registry level — composition with properties-form / detail-panel / filter-stack / entity-picker / markdown-editor happens at host or Tier 3 level only.",
  features: [
    "Stock-Sigma WebGL rendering — EdgeRectangleProgram + EdgeArrowProgram (per #38; no custom shaders in v0.1)",
    "Origin-aware data model — every node + edge carries `origin: \"system\" | \"user\"`; `systemRef` mandatory when system-origin (decision #17)",
    "Two-layer storage — graphology MultiGraph for node↔node edges, Zustand `groupEdges` slice for group-involving (spec §3.4)",
    "Per-edge soft/default visual differentiation — doc-endpoint edges + per-edgetype `softVisual: true` render muted thin; default edges render foreground thicker",
    "ForceAtlas2 layout in a Web Worker (one worker per ForceGraph instance)",
    "GraphInput accepts a static `GraphSnapshot` or a live `GraphSource` (loadInitial + optional subscribe + optional applyMutation)",
    "Snapshot validation — strict reject for malformed data; graceful degradation for unknown system schemaTypes (decision #24)",
    "Theming via CSS variables (decision #37) — `dark` / `light` / `custom` with partial overrides falling back to dark-theme defaults (decision #8)",
    "Imperative handle — getSnapshot / importSnapshot / resetCamera / setLayoutEnabled / rerunLayout / pinAllPositions / setNodePositions / getNodePositions + typed substrate-leak escape hatches (getSigmaInstance / getGraphologyInstance)",
    "useGraphSelector hook observes graphVersion automatically (decision #4)",
    "Permission resolver scaffolding (origin-driven defaults; full layered resolver in v0.3 per decision #25)",
    "UI-state cascade-on-delete plumbing (foundational; activates in v0.2 when selection/hover state lands)",
  ],
  tags: ["force-graph", "graph", "knowledge-graph", "graph-system", "sigma", "webgl"],

  version: "0.1.0",
  status: "alpha",
  createdAt: "2026-04-29",
  updatedAt: "2026-04-30",

  author: { name: "ilinxa" },

  dependencies: {
    shadcn: ["button", "tabs"],
    npm: {
      sigma: "^3.0.2",
      graphology: "^0.26.0",
      "graphology-types": "^0.24.8",
      "graphology-layout-forceatlas2": "^0.10.1",
      zustand: "^5.0.12",
    },
    internal: [],
  },

  related: [
    "properties-form",
    "detail-panel",
    "filter-stack",
    "entity-picker",
    "markdown-editor",
  ],
};
