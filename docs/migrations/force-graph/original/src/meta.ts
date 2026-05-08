import type { ComponentMeta } from "../../../types";

export const meta: ComponentMeta = {
  slug: "force-graph",
  name: "Force Graph",
  category: "data",

  description:
    "WebGL force-directed knowledge graph viewer — Sigma + graphology + ForceAtlas2 worker; origin-aware data model; soft/default edge differentiation per system decision #38; v0.2 adds selection / hover / drag-to-pin / undo-redo and a compound Provider/Canvas API.",
  context:
    "Tier 2 graph-system pro-component, phased v0.1–v0.6. v0.1 was the read-only viewer core; v0.2 adds the user-facing interaction layer plus the Provider/Canvas split that lets Tier 3 hosts compose Tier 1 panels alongside the canvas via sibling hooks. v0.3 adds full CRUD; v0.4 adds groups + filters; v0.5 adds doc-node visuals + wikilink reconciliation; v0.6 adds perf hardening + multi-edge expansion + advanced settings. Per decision #35, force-graph does NOT import any Tier 1 pro-component at the registry level — composition with properties-form / detail-panel / filter-stack / entity-picker / markdown-editor happens at host or Tier 3 level only.",
  features: [
    "Stock-Sigma WebGL rendering — EdgeRectangleProgram + EdgeArrowProgram (per #38; no custom shaders)",
    "Origin-aware data model — every node + edge carries `origin: \"system\" | \"user\"`; `systemRef` mandatory when system-origin (decision #17)",
    "Two-layer storage — graphology MultiGraph for node↔node edges, Zustand `groupEdges` slice for group-involving (spec §3.4)",
    "Per-edge soft/default visual differentiation — doc-endpoint edges + per-edgetype `softVisual: true` render muted thin; default edges render foreground thicker",
    "ForceAtlas2 layout in a Web Worker (one worker per ForceGraph instance)",
    "GraphInput accepts a static `GraphSnapshot` or a live `GraphSource` (loadInitial + optional subscribe + optional applyMutation)",
    "Snapshot validation — strict reject for malformed data; graceful degradation for unknown system schemaTypes (decision #24)",
    "Theming decoupled from host document — `dark` / `light` / `custom` with partial overrides falling back to dark-theme defaults (decision #8); oklch/lab inputs normalized to rgb for Sigma's WebGL parser",
    "Compound API — `<ForceGraph.Provider>` + `<ForceGraph.Canvas>` for sibling-hook composition; `<ForceGraph>` continues to work as a convenience wrapper (v0.2)",
    "`useGraphSelector` + `useGraphActions` hooks for sibling components inside the Provider tree (v0.2; observes graphVersion automatically per #4)",
    "Selection (node / edge / group discriminated union) + hover with focus + 1-hop neighbor highlight via Sigma reducers (v0.2)",
    "Drag-to-pin with auto-pin on drop and drag-coalesced single history entry (v0.2)",
    "Linking-mode infrastructure — `enterLinkingMode(source)` / `exitLinkingMode()` + crosshair cursor + click-target precedence + theme-aware SVG source-ring overlay (v0.2; Tier 1 picker chrome lives at host/Tier 3)",
    "Undo / redo ring buffer with forward + inverse primitives per entry, capacity from `settings.undoBufferSize` (default 100), denormalized `canUndo` / `canRedo` flags; canvas-focus-only Cmd/Ctrl+Z + Cmd/Ctrl+Shift+Z + Esc-cancels-linking shortcuts (v0.2)",
    "UI-state cascade-on-delete — selection / hovered / linkingMode.source / multiEdgeExpanded clear when a delta-driven delete removes their target (v0.2)",
    "Imperative handle — getSnapshot / importSnapshot / resetCamera / setLayoutEnabled / rerunLayout / pinAllPositions / setNodePositions / getNodePositions / focusNode / focusGroup / select / getSelection + typed substrate-leak escape hatches (getSigmaInstance / getGraphologyInstance)",
    "Permission resolver scaffolding (origin-driven defaults; full layered resolver in v0.3 per decision #25)",
  ],
  tags: ["force-graph", "graph", "knowledge-graph", "graph-system", "sigma", "webgl"],

  version: "0.2.0",
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
