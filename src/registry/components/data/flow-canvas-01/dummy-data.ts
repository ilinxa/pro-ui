import type { CanvasData, EdgeRecord, NodeRecord } from "./types";

export const FLOW_CANVAS_EMPTY: CanvasData = {
  version: 1,
  nodes: [],
  edges: [],
};

// Single custom-JSON node — minimal fixture for render smoke-tests.
export const FLOW_CANVAS_HELLO: CanvasData = {
  version: 1,
  nodes: [
    {
      id: "hello",
      position: { x: 200, y: 120 },
      data: {
        __type: "custom-json",
        _label: "Hello, flow",
        message: "Drop or paste any JSON onto the canvas.",
        tip: "Unknown __type renders here as a custom-JSON node.",
      },
    },
  ],
  edges: [],
};

// Rich, connected workflow — Prompt → LLM → (Display | ProjectCard).
// Demonstrates: custom renderer registration, typed port handles via
// <PortsAt>, multi-edge per port (the LLM's `out` fans out to two
// downstream consumers), rich-card-as-node (ProjectCard01 adapter),
// mixed renderers in one canvas, and live drag-to-connect (M2 onConnect).
export const FLOW_CANVAS_RICH: CanvasData = {
  version: 1,
  nodes: [
    {
      id: "prompt-1",
      position: { x: 0, y: 60 },
      data: {
        __type: "prompt",
        template: "Summarize the project brief in two sentences.",
        ports: [
          { id: "out", side: "right", dir: "out", type: "text" },
        ],
      },
    },
    {
      id: "llm-1",
      position: { x: 280, y: 60 },
      data: {
        __type: "llm",
        model: "claude-opus-4",
        // Each tool is a sub-object with its own __type — extractable as a
        // standalone node via right-click menu OR drag-out gesture (M5).
        tools: [
          { __type: "tool", name: "search", description: "Web search" },
          { __type: "tool", name: "calc", description: "Numeric eval" },
        ],
        ports: [
          { id: "in", side: "left", dir: "in", type: "text" },
          { id: "out", side: "right", dir: "out", type: "text", multi: true },
        ],
      },
    },
    {
      id: "display-1",
      position: { x: 540, y: 0 },
      data: {
        __type: "display",
        label: "Console",
        ports: [{ id: "in", side: "left", dir: "in", type: "text" }],
      },
    },
    {
      id: "project-1",
      position: { x: 540, y: 200 },
      data: {
        __type: "project-card-01",
        project: {
          id: "proj-1",
          title: "Onboarding redesign",
          category: "Product",
          image:
            "https://images.unsplash.com/photo-1551434678-e076c223a692?auto=format&fit=crop&w=640&q=70",
          description:
            "Reduce friction in the first-run flow; cut signup-to-first-action time in half.",
          status: "ongoing",
          location: "Remote",
          year: "2026",
        },
        ports: [
          { id: "in", side: "left", dir: "in", type: "text" },
          { id: "out", side: "right", dir: "out", type: "card" },
        ],
      },
    },
    {
      id: "json-1",
      position: { x: 880, y: 220 },
      data: {
        __type: "custom-json",
        _label: "Saved card",
        note: "Unknown __type renders here as a custom-JSON node.",
      },
    },
  ],
  edges: [
    {
      id: "e1",
      source: "prompt-1:out",
      target: "llm-1:in",
    },
    {
      id: "e2",
      source: "llm-1:out",
      target: "display-1:in",
    },
    {
      id: "e3",
      source: "llm-1:out",
      target: "project-1:in",
    },
  ],
};

// 200-node stress fixture for M8 perf verification. Custom-JSON nodes laid
// out in a grid with a sparse, deterministic edge weave. Pair with
// `onlyRenderVisibleElements` on <FlowCanvas> to see viewport culling kick in.
//
// An explicit `viewport` is shipped with the fixture: without it, the canvas
// would `fitView` on mount and put every node on-screen, defeating
// `onlyRenderVisibleElements` (xyflow only culls off-screen nodes). The
// initial zoom shows ~30 nodes; pan to discover the rest. Tune zoom up to
// see more at once, or set viewport to undefined to opt into fitView.
export function makeStressData(count = 200): CanvasData {
  const cols = 20;
  const cellW = 200;
  const cellH = 120;
  const nodes: NodeRecord[] = [];
  for (let i = 0; i < count; i++) {
    const col = i % cols;
    const row = Math.floor(i / cols);
    nodes.push({
      id: `s${i}`,
      position: { x: col * cellW, y: row * cellH },
      data: {
        __type: "custom-json",
        _label: `Node ${i}`,
        index: i,
        ports: [
          { id: "in", side: "left", dir: "in", type: "data" },
          { id: "out", side: "right", dir: "out", type: "data", multi: true },
        ],
      },
    });
  }
  const edges: EdgeRecord[] = [];
  // Connect every node to the next-but-one + the next-row neighbor.
  for (let i = 0; i + 2 < count; i++) {
    edges.push({
      id: `se-${i}-a`,
      source: `s${i}:out`,
      target: `s${i + 1}:in`,
    });
    if (i + cols < count) {
      edges.push({
        id: `se-${i}-b`,
        source: `s${i}:out`,
        target: `s${i + cols}:in`,
      });
    }
  }
  return {
    version: 1,
    nodes,
    edges,
    viewport: { x: 40, y: 40, zoom: 0.9 },
  };
}
