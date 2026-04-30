import type {
  Edge,
  EdgeType,
  GraphSnapshot,
  Group,
  Node,
  NodeType,
} from "./types";
import { DEFAULT_GRAPH_SETTINGS } from "./types";

/**
 * Small mixed fixture for the force-graph v0.1 demo.
 *
 * Demonstrates the v0.1 visual surface:
 *   - origin-aware data model (system + user nodes; system nodes carry
 *     `systemRef`)
 *   - kind variety (normal + doc nodes; doc nodes render in muted color
 *     per the v0.5 visual-language preview)
 *   - per-edge soft/default differentiation per [#38][1]: doc-involving
 *     edges and per-edgetype `softVisual: true` edges render thin +
 *     muted; default edges render thicker + foreground
 *   - direction variety (`undirected` → rectangle program, others →
 *     arrow program)
 *   - groups (no hull rendering in v0.1; lands in v0.4)
 *
 * Initial positions are explicit so demos render predictably even
 * before FA2 settles.
 *
 * [1]: ../../../../docs/systems/graph-system/graph-system-description.md#8-locked-decisions-index
 */

const NODE_TYPES: NodeType[] = [
  {
    id: "person",
    name: "Person",
    color: "oklch(0.72 0.16 30)",
    description: "An individual contributor or author",
  },
  {
    id: "paper",
    name: "Paper",
    color: "oklch(0.70 0.16 220)",
    description: "A published research paper",
  },
  {
    id: "topic",
    name: "Topic",
    color: "oklch(0.78 0.18 132)",
    description: "A subject or research area",
  },
  {
    id: "project",
    name: "Project",
    color: "oklch(0.70 0.14 290)",
    description: "An ongoing initiative",
  },
  {
    id: "document",
    name: "Document",
    color: "oklch(0.65 0.02 250)",
    description: "User-authored notes",
  },
];

const EDGE_TYPES: EdgeType[] = [
  {
    id: "wrote",
    name: "wrote",
    color: "oklch(0.78 0.18 132)",
    description: "Authorship",
  },
  {
    id: "cites",
    name: "cites",
    color: "oklch(0.70 0.10 220)",
    description: "Cites another paper",
  },
  {
    id: "about",
    name: "about",
    color: "oklch(0.65 0.10 250)",
    description: "References a topic",
  },
  {
    id: "related",
    name: "related",
    color: "oklch(0.65 0.05 250)",
    softVisual: true,
    description: "Loose association",
  },
  {
    id: "annotates",
    name: "annotates",
    color: "oklch(0.65 0.02 250)",
    description: "Doc node annotates an entity",
  },
];

const NODES: Node[] = [
  // Three people (system origin — pretend Zotero / DB sourced)
  {
    id: "p-rina",
    label: "Rina Okafor",
    kind: "normal",
    nodeTypeId: "person",
    origin: "system",
    systemRef: { source: "zotero", sourceId: "rina-okafor" },
    position: { x: -120, y: -60 },
    groupIds: ["g-team"],
  },
  {
    id: "p-juno",
    label: "Juno Mendes",
    kind: "normal",
    nodeTypeId: "person",
    origin: "system",
    systemRef: { source: "zotero", sourceId: "juno-mendes" },
    position: { x: -180, y: 30 },
    groupIds: ["g-team"],
  },
  {
    id: "p-aria",
    label: "Aria Stein",
    kind: "normal",
    nodeTypeId: "person",
    origin: "system",
    systemRef: { source: "zotero", sourceId: "aria-stein" },
    position: { x: -100, y: 90 },
    groupIds: ["g-team"],
  },

  // Three papers (system origin)
  {
    id: "paper-a",
    label: "On Graph Decomposition",
    kind: "normal",
    nodeTypeId: "paper",
    origin: "system",
    systemRef: { source: "zotero", sourceId: "graph-decomp-2024" },
    position: { x: 0, y: -90 },
    groupIds: ["g-research"],
  },
  {
    id: "paper-b",
    label: "Force-directed Layouts",
    kind: "normal",
    nodeTypeId: "paper",
    origin: "system",
    systemRef: { source: "zotero", sourceId: "fd-layouts-2023" },
    position: { x: 80, y: -30 },
    groupIds: ["g-research"],
  },
  {
    id: "paper-c",
    label: "Visualizing Knowledge",
    kind: "normal",
    nodeTypeId: "paper",
    origin: "system",
    systemRef: { source: "zotero", sourceId: "viz-knowledge-2022" },
    position: { x: 110, y: 60 },
    groupIds: ["g-research"],
  },

  // Two topics (user origin — categorization the user invented)
  {
    id: "topic-graphs",
    label: "Knowledge Graphs",
    kind: "normal",
    nodeTypeId: "topic",
    origin: "user",
    position: { x: 200, y: -10 },
    groupIds: [],
  },
  {
    id: "topic-viz",
    label: "Information Viz",
    kind: "normal",
    nodeTypeId: "topic",
    origin: "user",
    position: { x: 180, y: 100 },
    groupIds: [],
  },

  // Two doc nodes (user origin, kind: "doc" — wikilinks land in v0.5)
  {
    id: "doc-notes",
    label: "Reading notes",
    kind: "doc",
    origin: "user",
    position: { x: -20, y: 130 },
    groupIds: [],
    metadata: {
      body: "# Reading notes\n\nA running log of insights from each paper.",
    },
  },
  {
    id: "doc-plan",
    label: "Project plan",
    kind: "doc",
    origin: "user",
    position: { x: 60, y: 160 },
    groupIds: [],
    metadata: {
      body: "# Project plan\n\nMilestones for the visualization workstream.",
    },
  },
];

const EDGES: Edge[] = [
  // Authorship — directed
  {
    id: "e-1",
    source: { kind: "node", id: "p-rina" },
    target: { kind: "node", id: "paper-a" },
    edgeTypeId: "wrote",
    direction: "directed",
    origin: "system",
  },
  {
    id: "e-2",
    source: { kind: "node", id: "p-juno" },
    target: { kind: "node", id: "paper-a" },
    edgeTypeId: "wrote",
    direction: "directed",
    origin: "system",
  },
  {
    id: "e-3",
    source: { kind: "node", id: "p-juno" },
    target: { kind: "node", id: "paper-b" },
    edgeTypeId: "wrote",
    direction: "directed",
    origin: "system",
  },
  {
    id: "e-4",
    source: { kind: "node", id: "p-aria" },
    target: { kind: "node", id: "paper-c" },
    edgeTypeId: "wrote",
    direction: "directed",
    origin: "system",
  },

  // Citations — directed, default visual
  {
    id: "e-5",
    source: { kind: "node", id: "paper-b" },
    target: { kind: "node", id: "paper-a" },
    edgeTypeId: "cites",
    direction: "directed",
    origin: "system",
  },
  {
    id: "e-6",
    source: { kind: "node", id: "paper-c" },
    target: { kind: "node", id: "paper-a" },
    edgeTypeId: "cites",
    direction: "directed",
    origin: "system",
  },

  // Topic associations — undirected
  {
    id: "e-7",
    source: { kind: "node", id: "paper-a" },
    target: { kind: "node", id: "topic-graphs" },
    edgeTypeId: "about",
    direction: "undirected",
    origin: "user",
  },
  {
    id: "e-8",
    source: { kind: "node", id: "paper-c" },
    target: { kind: "node", id: "topic-viz" },
    edgeTypeId: "about",
    direction: "undirected",
    origin: "user",
  },

  // Loose associations — `related` has softVisual: true → muted thin
  {
    id: "e-9",
    source: { kind: "node", id: "topic-graphs" },
    target: { kind: "node", id: "topic-viz" },
    edgeTypeId: "related",
    direction: "undirected",
    origin: "user",
  },

  // Doc node annotations — soft because doc-endpoint involved (#38)
  {
    id: "e-10",
    source: { kind: "node", id: "doc-notes" },
    target: { kind: "node", id: "paper-a" },
    edgeTypeId: "annotates",
    direction: "directed",
    origin: "user",
  },
  {
    id: "e-11",
    source: { kind: "node", id: "doc-notes" },
    target: { kind: "node", id: "paper-b" },
    edgeTypeId: "annotates",
    direction: "directed",
    origin: "user",
  },
  {
    id: "e-12",
    source: { kind: "node", id: "doc-plan" },
    target: { kind: "node", id: "topic-viz" },
    edgeTypeId: "annotates",
    direction: "directed",
    origin: "user",
  },
];

const GROUPS: Group[] = [
  {
    id: "g-team",
    name: "Team",
    origin: "user",
    color: "oklch(0.78 0.18 132)",
    memberNodeIds: ["p-rina", "p-juno", "p-aria"],
    gravity: 0.3,
  },
  {
    id: "g-research",
    name: "Research corpus",
    origin: "user",
    color: "oklch(0.70 0.16 220)",
    memberNodeIds: ["paper-a", "paper-b", "paper-c"],
    gravity: 0.3,
  },
];

export const SMALL_GRAPH: GraphSnapshot = {
  version: "1.0",
  nodes: NODES,
  edges: EDGES,
  groups: GROUPS,
  nodeTypes: NODE_TYPES,
  edgeTypes: EDGE_TYPES,
  settings: { ...DEFAULT_GRAPH_SETTINGS },
};

/**
 * A second snapshot identical to `SMALL_GRAPH` but with `layoutEnabled`
 * forced off — used by the "static positions" demo to demonstrate the
 * pin-on-load behavior without FA2 jiggle.
 */
export const SMALL_GRAPH_STATIC: GraphSnapshot = {
  ...SMALL_GRAPH,
  nodes: SMALL_GRAPH.nodes.map((n) => ({ ...n, pinned: true })),
  settings: {
    ...DEFAULT_GRAPH_SETTINGS,
    layoutEnabled: false,
  },
};
