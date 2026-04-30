import type { Ref } from "react";
import type Sigma from "sigma";
import type { MultiGraph } from "graphology";

// ─────────────────────────────────────────────────────────────────────────────
// 1. Origin + endpoints (per system §4 — origin-aware data model)
// ─────────────────────────────────────────────────────────────────────────────

export type Origin = "system" | "user";

export type EndpointKind = "node" | "group";

export interface EndpointRef {
  kind: EndpointKind;
  id: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. Nodes
// ─────────────────────────────────────────────────────────────────────────────

export interface SystemRef {
  source: string;
  sourceId: string;
  schemaType?: string;
}

export interface BaseNode {
  id: string;
  label: string;
  kind: "normal" | "doc";
  origin: Origin;
  systemRef?: SystemRef;
  position?: { x: number; y: number };
  pinned?: boolean;
  groupIds: string[];
  metadata?: Record<string, unknown>;
  annotations?: Record<string, unknown>;
  unresolvedWikilinks?: string[];
}

export interface NormalNode extends BaseNode {
  kind: "normal";
  nodeTypeId: string;
  icon?: string;
}

export interface DocNode extends BaseNode {
  kind: "doc";
  nodeTypeId?: string;
}

export type Node = NormalNode | DocNode;

// ─────────────────────────────────────────────────────────────────────────────
// 3. Edges
// ─────────────────────────────────────────────────────────────────────────────

export type EdgeDirection =
  | "undirected"
  | "directed"
  | "reverse"
  | "bidirectional";

export interface Edge {
  id: string;
  source: EndpointRef;
  target: EndpointRef;
  edgeTypeId: string;
  direction: EdgeDirection;
  origin: Origin;
  label?: string;
  metadata?: Record<string, unknown>;
  derivedFromWikilink?: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. Groups + types
// ─────────────────────────────────────────────────────────────────────────────

export interface Group {
  id: string;
  name: string;
  origin: "user";
  color: string;
  memberNodeIds: string[];
  description?: string;
  gravity: number;
}

export interface NodeType {
  id: string;
  name: string;
  color: string;
  defaultIcon?: string;
  description?: string;
  schema?: ReadonlyArray<unknown>;
}

export interface EdgeType {
  id: string;
  name: string;
  color: string;
  /**
   * Per system decision #38: when no doc-node endpoint is involved, this
   * flag triggers the "soft" visual treatment (muted color + thinner size).
   * Doc-endpoint edges always render soft regardless of this flag.
   * Renamed from `dashed` (the original literal-dashes feature was dropped).
   */
  softVisual?: boolean;
  width?: number;
  description?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. Theme + settings
// ─────────────────────────────────────────────────────────────────────────────

export type ThemeKey =
  | "background"
  | "edgeDefault"
  | "edgeMuted"
  | "labelColor"
  | "hullFill"
  | "hullBorder"
  | "selectionRing"
  | "hoverGlow";

export interface ResolvedTheme {
  background: string;
  edgeDefault: string;
  edgeMuted: string;
  labelColor: string;
  hullFill: string;
  hullBorder: string;
  selectionRing: string;
  hoverGlow: string;
}

export interface GraphSettings {
  layoutEnabled: boolean;
  forces: {
    linkDistance: number;
    repulsion: number;
    centerGravity: number;
    groupGravity: number;
  };
  layoutSettleDuration: number;

  theme: "dark" | "light" | "custom";
  customColors?: Partial<Record<ThemeKey, string>>;
  labelFont: string;
  labelDensity: number;
  labelZoomThreshold: number;
  edgeOpacity: number;
  nodeBaseSize: number;

  groupHullPadding: number;
  groupHullOpacity: number;
  groupBorderWidth: number;

  hideEdgesOnMove: boolean;
  renderEdgeLabels: boolean;
  edgeLabelZoomThreshold: number;

  undoBufferSize: number;
}

export const DEFAULT_GRAPH_SETTINGS: GraphSettings = {
  layoutEnabled: true,
  forces: {
    linkDistance: 60,
    repulsion: 200,
    centerGravity: 0.05,
    groupGravity: 1.0,
  },
  layoutSettleDuration: 4000,

  theme: "dark",
  labelFont: "var(--font-sans)",
  labelDensity: 0.5,
  labelZoomThreshold: 0.6,
  edgeOpacity: 0.4,
  nodeBaseSize: 5,

  groupHullPadding: 24,
  groupHullOpacity: 0.15,
  groupBorderWidth: 1.5,

  hideEdgesOnMove: false,
  renderEdgeLabels: false,
  edgeLabelZoomThreshold: 0.7,

  undoBufferSize: 100,
};

// ─────────────────────────────────────────────────────────────────────────────
// 6. Snapshot + source-adapter
// ─────────────────────────────────────────────────────────────────────────────

export interface GraphSnapshot {
  version: "1.0";
  nodes: Node[];
  edges: Edge[];
  groups: Group[];
  edgeTypes: EdgeType[];
  nodeTypes: NodeType[];
  settings: GraphSettings;
}

export type GraphDelta =
  | { type: "addNode"; node: Node }
  | { type: "updateNode"; id: string; patch: Partial<Node> }
  | { type: "deleteNode"; id: string }
  | { type: "addEdge"; edge: Edge }
  | { type: "updateEdge"; id: string; patch: Partial<Edge> }
  | { type: "deleteEdge"; id: string }
  | { type: "addGroup"; group: Group }
  | { type: "updateGroup"; id: string; patch: Partial<Group> }
  | { type: "deleteGroup"; id: string }
  | { type: "addNodeToGroup"; nodeId: string; groupId: string }
  | { type: "removeNodeFromGroup"; nodeId: string; groupId: string };

export type UserMutation =
  | { type: "addNode"; node: Node }
  | { type: "updateNode"; id: string; patch: Partial<Node> }
  | { type: "deleteNode"; id: string }
  | { type: "addEdge"; edge: Edge }
  | { type: "updateEdge"; id: string; patch: Partial<Edge> }
  | { type: "deleteEdge"; id: string }
  | { type: "addGroup"; group: Group }
  | { type: "updateGroup"; id: string; patch: Partial<Group> }
  | { type: "deleteGroup"; id: string }
  | { type: "addNodeToGroup"; nodeId: string; groupId: string }
  | { type: "removeNodeFromGroup"; nodeId: string; groupId: string }
  | { type: "setAnnotation"; entityId: string; key: string; value: unknown };

export interface MutationResult {
  ok: boolean;
  serverState?: GraphDelta;
  error?: { code: string; message: string };
}

export interface GraphSource {
  loadInitial(): Promise<GraphSnapshot>;
  subscribe?(callback: (delta: GraphDelta) => void): () => void;
  applyMutation?(mutation: UserMutation): Promise<MutationResult>;
}

export type GraphInput = GraphSnapshot | GraphSource;

export function isGraphSource(input: GraphInput): input is GraphSource {
  return typeof (input as GraphSource).loadInitial === "function";
}

// ─────────────────────────────────────────────────────────────────────────────
// 7. Validation (per plan §6)
// ─────────────────────────────────────────────────────────────────────────────

export type ValidationError =
  | { code: "VERSION_MISMATCH"; message: string; got: string; expected: "1.0" }
  | { code: "DUPLICATE_NODE_ID"; message: string; id: string }
  | { code: "DUPLICATE_GROUP_ID"; message: string; id: string }
  | { code: "ID_NAMESPACE_COLLISION"; message: string; id: string }
  | {
      code: "UNKNOWN_NODE_TYPE";
      message: string;
      nodeId: string;
      nodeTypeId: string;
    }
  | {
      code: "UNKNOWN_EDGE_TYPE";
      message: string;
      edgeId: string;
      edgeTypeId: string;
    }
  | {
      code: "DANGLING_EDGE_ENDPOINT";
      message: string;
      edgeId: string;
      endpoint: "source" | "target";
      ref: EndpointRef;
    }
  | { code: "SELF_LOOP"; message: string; edgeId: string }
  | {
      code: "MEMBERSHIP_DISAGREEMENT";
      message: string;
      groupId: string;
      nodeId: string;
    }
  | {
      code: "MISSING_ORIGIN";
      message: string;
      entityKind: "node" | "edge";
      entityId: string;
    }
  | { code: "MISSING_SYSTEM_REF"; message: string; nodeId: string }
  | { code: "AUTO_REGISTERED_NODE_TYPE"; message: string; nodeTypeId: string };

export interface ValidationResult {
  ok: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
}

// ─────────────────────────────────────────────────────────────────────────────
// 8. Store state shape (consumer-facing read view)
// ─────────────────────────────────────────────────────────────────────────────

export interface ForceGraphState {
  nodes: ReadonlyMap<string, Node>;
  edges: ReadonlyMap<string, Edge>;
  groups: ReadonlyMap<string, Group>;
  nodeTypes: ReadonlyMap<string, NodeType>;
  edgeTypes: ReadonlyMap<string, EdgeType>;
  settings: GraphSettings;
  graphVersion: number;

  /**
   * v0.2 UI slice — selection / hover / linking-mode / multi-edge-expand
   * slot. `dragState` is internal and intentionally NOT exposed here.
   */
  ui: {
    selection: Selection;
    hovered: HoverState;
    linkingMode: LinkingMode;
    multiEdgeExpanded: { a: EndpointRef; b: EndpointRef } | null;
  };

  /**
   * v0.2 history slice — ring-buffer entries, cursor, derived flags.
   */
  history: {
    entries: ReadonlyArray<HistoryEntry>;
    cursor: number;
    canUndo: boolean;
    canRedo: boolean;
  };

  derived: {
    visibleNodeIds: ReadonlySet<string>;
    visibleEdgeIds: ReadonlySet<string>;
    visibleGroupIds: ReadonlySet<string>;
    neighborsOf(id: string, kind: EndpointKind): ReadonlyArray<EndpointRef>;
    parallelEdgesBetween(
      a: EndpointRef,
      b: EndpointRef,
    ): ReadonlyArray<Edge>;
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// 8b. v0.2 selection / hover / linking
// ─────────────────────────────────────────────────────────────────────────────

export type Selection =
  | { kind: "node"; id: string }
  | { kind: "group"; id: string }
  | { kind: "edge"; id: string }
  | null;

export type HoverState = Selection;

export interface LinkingMode {
  active: boolean;
  source: EndpointRef | null;
}

// ─────────────────────────────────────────────────────────────────────────────
// 8c. v0.2 history primitives + entries (per plan §4.4 + Q-P6 lock)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Per Q-P6 + plan §4.4: the smallest unit of state change that history
 * can replay. Each `HistoryEntry` carries forward + inverse arrays of
 * primitives. v0.2 ships only `setNodePosition` and `pinNode`; v0.3
 * expands the union with full CRUD primitives.
 *
 * `noop` is the cascade placeholder per plan §16.5 #11: when a
 * delta-driven delete invalidates an entry's referenced entity, the
 * primitive is replaced with `noop` so cursor positions stay stable
 * without breaking in-flight undo/redo.
 */
export type PrimitiveInverse =
  | { type: "setNodePosition"; id: string; x: number; y: number }
  | { type: "pinNode"; id: string; pinned: boolean }
  | { type: "noop" };

export interface HistoryEntry {
  label: string;
  inverses: ReadonlyArray<PrimitiveInverse>;
  forwards: ReadonlyArray<PrimitiveInverse>;
}

// ─────────────────────────────────────────────────────────────────────────────
// 9. Public actions API
// ─────────────────────────────────────────────────────────────────────────────

export interface ActionsV01 {
  importSnapshot(snapshot: GraphSnapshot): void;
  exportSnapshot(): GraphSnapshot;
  setLayoutEnabled(enabled: boolean): void;
  rerunLayout(): void;
  pinAllPositions(): void;
  setNodePositions(
    batch: ReadonlyArray<{ id: string; x: number; y: number }>,
    options?: { silent?: boolean },
  ): void;
}

/**
 * Per v0.2 plan §3.3: ActionsV02 extends V01 with selection / hover /
 * linking / pin-single / undo-redo. Drag is INTERNAL (handled by the
 * canvas's pointer handler in A3, not part of the public surface).
 */
export interface ActionsV02 extends ActionsV01 {
  // Selection
  select(target: Selection): void;
  clearSelection(): void;

  // Hover
  hover(target: HoverState): void;

  // Linking mode
  enterLinkingMode(source: EndpointRef): void;
  exitLinkingMode(): void;

  // Single-node pin (recorded per spec §5.5)
  pinNode(id: string, pinned: boolean): void;

  // Undo / redo
  undo(): void;
  redo(): void;
  canUndo(): boolean;
  canRedo(): boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// 10. Imperative ref handle (v0.1 subset)
// ─────────────────────────────────────────────────────────────────────────────

export interface ForceGraphHandle {
  getSnapshot(): GraphSnapshot;
  importSnapshot(s: GraphSnapshot): void;
  resetCamera(options?: { animate?: boolean }): void;
  setLayoutEnabled(enabled: boolean): void;
  rerunLayout(): void;
  pinAllPositions(): void;
  setNodePositions(
    batch: ReadonlyArray<{ id: string; x: number; y: number }>,
    options?: { silent?: boolean },
  ): void;
  getNodePositions(): ReadonlyArray<{ id: string; x: number; y: number }>;
  // Substrate-leak escape hatches (typed, not unknown — risk acknowledged
  // per description §8.5 #4; major-version bump if substrates ever swap).
  getSigmaInstance(): Sigma;
  getGraphologyInstance(): MultiGraph;
}

// ─────────────────────────────────────────────────────────────────────────────
// 11. Component props
// ─────────────────────────────────────────────────────────────────────────────

export interface ForceGraphProps {
  data: GraphInput;
  onChange?: (snapshot: GraphSnapshot) => void;
  onError?: (error: ValidationError | { code: string; message: string }) => void;
  theme?: "dark" | "light" | "custom";
  customColors?: Partial<Record<ThemeKey, string>>;
  ariaLabel?: string;
  className?: string;
  ref?: Ref<ForceGraphHandle>;
}

/**
 * Per v0.2 plan §3.1 + §4.1: the Provider/Canvas split. `<ForceGraph>`
 * remains the convenience wrapper; hosts that need sibling-hook access
 * to graph state from Tier 1 panels render `<ForceGraph.Provider>`
 * around `<ForceGraph.Canvas>` plus their own panels.
 */
export interface ForceGraphProviderProps {
  data: GraphInput;
  onChange?: (snapshot: GraphSnapshot) => void;
  onError?: (error: ValidationError | { code: string; message: string }) => void;
  theme?: "dark" | "light" | "custom";
  customColors?: Partial<Record<ThemeKey, string>>;
  children: import("react").ReactNode;
}

export interface ForceGraphCanvasProps {
  ariaLabel?: string;
  className?: string;
  ref?: Ref<ForceGraphHandle>;
}
