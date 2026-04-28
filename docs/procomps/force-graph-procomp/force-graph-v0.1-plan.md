# `force-graph` v0.1 — Pro-component Plan (Stage 2, Phase 1 of 6)

> **Stage:** 2 of 3 (per-phase plan; one of v0.1–v0.6) · **Status:** **signed off 2026-04-28.** Stage 3 (implementation) may begin after Phase 0 risk-spike completes and is documented in STATUS.md.
> **Slug:** `force-graph` · **Category:** `data` · **Phase:** **v0.1 — Viewer core (3 weeks focused)**
> **Last updated:** 2026-04-28 (signed off; Q-P0 surfaced + resolved on re-validation; Q-P5 + Q-P9 refined; Q-P3 deviation from decision #11 noted for system-description amendment)
> **Inputs:**
> - Description signed off ([force-graph-procomp-description.md](force-graph-procomp-description.md), 2026-04-28). All 10 §8 locked decisions are inherited as fixed inputs.
> - System description signed off ([../../systems/graph-system/graph-system-description.md](../../systems/graph-system/graph-system-description.md), 2026-04-28). 37 cross-cutting decisions inherited.
> - Original v4 spec ([../../../graph-visualizer-old.md](../../../graph-visualizer-old.md)) is the authoritative source for `force-graph` internals (data shapes, custom WebGL programs, FA2 worker integration, hull anchoring, multi-edge mechanics).
> - Phase 0 risk spike (DashedDirectedEdgeProgram, ≥30 fps gate at 100k edges on integrated GPU) **must complete before this plan signs off.** This plan writes against "spike succeeded."

This doc locks **how** v0.1 is built — file-by-file structure, exact API surface, data shapes, validation algorithm, two-layer state architecture, custom WebGL program, worker integration, source-adapter contract. v0.2–v0.6 plans (separate files) build on the foundations locked here.

After sign-off, no scaffolding-time second-guessing — implementation follows the plan; deviations are loud and require an explicit STATUS.md note.

---

## 1. Inherited inputs (one paragraph)

`force-graph` v0.1 is the **viewer core** for the [graph-system](../../systems/graph-system/graph-system-description.md): a `<ForceGraph>` component that accepts `GraphInput = GraphSnapshot | GraphSource`, renders an interactive WebGL canvas at up to 100k node scale via Sigma + graphology MultiGraph + ForceAtlas2 (Web Worker), and exposes the actions/selectors API that Tier 1 panels wire through at the host level. v0.1 is **read-only at the user level** — no editing affordances; the layout runs and the user can pan/zoom but not select, hover, drag, or mutate. v0.1 ships the **origin-aware data model** ([decision #17](../../systems/graph-system/graph-system-description.md): every node + edge carries `origin: "system" | "user"`; `systemRef` mandatory when system-origin), **two-layer storage** ([spec §3.4](../../../graph-visualizer-old.md): node↔node edges in graphology native, group-involving edges in a Zustand slice — externally one `edges[]` array, internally partitioned), the **source-adapter contract** (`loadInitial` required; `subscribe` + `applyMutation` optional, with `applyMutation` type-supported-but-not-exercised until v0.3), the **custom `DashedDirectedEdgeProgram`** (Phase 0 spike outcome lands here), and **foundational scaffolding** for selection/hover/cascade/permission-resolver that activate in later phases. Per [decision #35](../../systems/graph-system/graph-system-description.md), `force-graph` does NOT import any Tier 1 component; composition happens at host/Tier 3 only.

---

## 2. Phase 0 pre-condition (must complete before this plan signs off)

Per [system §10.1](../../systems/graph-system/graph-system-description.md#101-phase-0--risk-spike-2-days) and [description Q4](force-graph-procomp-description.md#8-resolved-questions-locked-on-sign-off-2026-04-28):

- **Spike outcome assumed:** custom `DashedDirectedEdgeProgram` (solid+dashed × arrows × straight+curved, all uniform-driven) renders 100k edges at **≥30 fps on integrated GPU**.
- **If spike succeeds:** this plan locks the WebGL pipeline as primary; §8 specifies the program structure.
- **If spike fails:** this plan is replanned — primary fallback is the contingency tree from description §8.5 #2 (intermediate options before full SVG-overlay): split edge programs, custom shader optimizations. SVG-overlay is the worst-case fallback (~5k visible edge ceiling). Replan path is documented but NOT implemented in this plan.

**Pre-condition gate:** Phase 0 spike must be complete and the result documented in STATUS.md before this plan signs off. Implementation can begin immediately after sign-off.

---

## 3. v0.1 scope summary

What ships (read-only viewer with full data-model foundation):

- `<ForceGraph>` component accepting `GraphInput` (snapshot or live source)
- Origin-aware data model with mandatory `origin` field on every node + edge
- Two-layer storage: graphology MultiGraph (node↔node) + Zustand `groupEdges` slice (group-involving)
- `importSnapshot` + `validateSnapshot` (structured error returns; rejects malformed snapshots)
- `exportSnapshot` (walks `state.edgeOrder` preserving insertion order across both storage layers)
- `GraphSource` integration (`loadInitial` + optional `subscribe` + optional `applyMutation`)
- Custom `DashedDirectedEdgeProgram` (WebGL; supports solid+dashed × arrows × straight+curved)
- Plain-disc node rendering via Sigma's stock `NodeCircleProgram` (icons + doc-glyph land in v0.5)
- ForceAtlas2 layout in Web Worker (`graphology-layout-forceatlas2/worker`)
- Layout toggle ON/OFF + kicks of `layoutSettleDuration` on mutation + `pinAllPositions`
- `graphVersion` increment plumbing
- `useGraphSelector(fn)` hook (observes `graphVersion` so consumers can't forget the dependency)
- UI-state cascade-on-delete **scaffolding** (foundational; activates in v0.2 when selection/hover/etc. land)
- System-origin glyph **deferred to v0.5** (`IconNodeProgram` lands then, per [spec §11.5 build-order note](../../../graph-visualizer-old.md))
- Permission resolver scaffolding (v0.1 only enforces canonical-field read-only on system nodes; full resolver lands in v0.3)
- Theming via [globals.css](../../../src/app/globals.css) CSS variables ([decision #37](../../systems/graph-system/graph-system-description.md))
- Source adapters live OUTSIDE the registry ([decision #27](../../systems/graph-system/graph-system-description.md)); v0.1 ships only the contract

What does NOT ship (deferred to later phases):

- Selection / hover / drag / linking-mode (v0.2)
- Click handlers (v0.2)
- Undo/redo (v0.2)
- Keyboard shortcuts (v0.2)
- All node/edge/group/type CRUD (v0.3)
- Permission resolver full implementation (v0.3)
- Stale-write conflict banner (v0.3)
- Group hulls / group gravity / group-involving edge rendering (v0.4)
- Filters (v0.4 + v0.6)
- Doc-node visuals + wikilink reconciliation + markdown-editor mounting (v0.5)
- Custom `IconNodeProgram` for icons + doc-glyph + system glyph (v0.5)
- Search (v0.6)
- Multi-edge expansion (v0.6)
- Advanced settings panel (v0.6, host-composed)
- Perf hardening + SVG-ceiling check (v0.6)

---

## 4. Final v0.1 API (locked)

This is the public surface for v0.1. Every public type lives in `types.ts` and is re-exported from `index.ts`. Per-phase plans for v0.2–v0.6 layer additional surface; existing surface is non-breaking across phases.

### 4.1 Component props

```ts
import type { ReactNode } from "react";
import type { GraphInput, Node, Edge, Group, GraphSnapshot, GraphSettings, ThemeKey } from "./types";

export interface ForceGraphProps {
  // Data input — snapshot OR live source
  data: GraphInput;

  // Lifecycle callbacks (v0.1: only onChange + onError; selection/mutation callbacks land in v0.2 + v0.3)
  onChange?: (snapshot: GraphSnapshot) => void;       // emitted on delta-driven changes from live source
  onError?: (error: { code: string; message: string }) => void;

  // Theming
  theme?: "dark" | "light" | "custom";                // default: inherits from `dark` class on document root
  customColors?: Partial<Record<ThemeKey, string>>;   // missing keys fall back to dark-theme defaults per decision #8

  // A11y / styling
  ariaLabel?: string;                                 // default: "Knowledge graph"
  className?: string;
}

export const ForceGraph: ForwardRefExoticComponent<ForceGraphProps & RefAttributes<ForceGraphHandle>>;
```

**Required props:** `data`. Everything else is optional with sensible defaults.

### 4.2 Imperative ref handle (v0.1 subset)

```ts
import type { Sigma } from "sigma";
import type MultiGraph from "graphology";

export interface ForceGraphHandle {
  // Snapshot escape hatches
  getSnapshot(): GraphSnapshot;
  importSnapshot(s: GraphSnapshot): void;             // same as data prop change; here for ref-based hosts

  // Camera (v0.1 has no selection, but camera control is useful for deep-link landings)
  resetCamera(options?: { animate?: boolean }): void;

  // Layout (v0.1 ships layout toggle + kick)
  setLayoutEnabled(enabled: boolean): void;
  rerunLayout(): void;
  pinAllPositions(): void;
  setNodePositions(
    batch: ReadonlyArray<{ id: string; x: number; y: number }>,
    options?: { silent?: boolean },                   // silent = bypasses undo recording per decision #7
  ): void;
  getNodePositions(): ReadonlyArray<{ id: string; x: number; y: number }>;

  // Substrate-leak escape hatches (typed, not unknown — substrate-leak risk acknowledged per description §8.5 #4)
  getSigmaInstance(): Sigma;
  getGraphologyInstance(): MultiGraph;
}
```

`focusNode`, `focusGroup`, `select`, etc. land in v0.2.

### 4.3 Public actions API (v0.1 subset, ~6 actions)

Actions are exposed via the `useGraphActions()` hook. v0.1 actions:

```ts
export interface ActionsV01 {
  importSnapshot(snapshot: GraphSnapshot): void;      // not recorded; clears history (v0.2+)
  exportSnapshot(): GraphSnapshot;

  setLayoutEnabled(enabled: boolean): void;
  rerunLayout(): void;
  pinAllPositions(): void;
  setNodePositions(
    batch: ReadonlyArray<{ id: string; x: number; y: number }>,
    options?: { silent?: boolean },
  ): void;
}

export function useGraphActions(): ActionsV01;        // throws if called outside <ForceGraph>
```

v0.2 expands this with selection / hover / linking / undo / redo. v0.3 adds CRUD. v0.4 adds groups / filters. v0.6 adds search / multi-edge / settings.

### 4.4 Public selectors API (v0.1 subset)

Selectors gate through `useGraphSelector(fn)` per [decision #4](../../systems/graph-system/graph-system-description.md):

```ts
export function useGraphSelector<T>(fn: (state: ForceGraphState) => T): T;

interface ForceGraphState {
  // Graph data — read-only views
  nodes: ReadonlyMap<string, Node>;
  edges: ReadonlyMap<string, Edge>;
  groups: ReadonlyMap<string, Group>;
  nodeTypes: ReadonlyMap<string, NodeType>;
  edgeTypes: ReadonlyMap<string, EdgeType>;

  // Settings
  settings: GraphSettings;

  // Internal version (consumers shouldn't read directly; useGraphSelector internally observes this)
  graphVersion: number;
}
```

v0.1 derived selectors (memoized inside the store):

```ts
// All visible (in v0.1, "visible" === "all" since filters land in v0.4)
state.derived.visibleNodeIds: ReadonlySet<string>;
state.derived.visibleEdgeIds: ReadonlySet<string>;
state.derived.visibleGroupIds: ReadonlySet<string>;

// Topology
state.derived.neighborsOf(id: string, kind: "node" | "group"): ReadonlyArray<EndpointRef>;
state.derived.parallelEdgesBetween(a: EndpointRef, b: EndpointRef): ReadonlyArray<Edge>;
```

Hull-points and label-position selectors land in v0.4 (with groups). Selection/hover state lives in `state.ui` from v0.2 onward; v0.1 has no `ui` slice yet.

---

## 5. Data shapes (locked)

Inherits from [original spec §3](../../../graph-visualizer-old.md) with origin extensions per [system §4](../../systems/graph-system/graph-system-description.md#4-the-two-layer-data-model-cross-cutting). All shapes are exported from `types.ts`.

### 5.1 Origin + base node + edge

```ts
export type Origin = "system" | "user";

export type EndpointKind = "node" | "group";
export type EndpointRef = { kind: EndpointKind; id: string };

export interface BaseNode {
  id: string;                                         // unique within nodes; namespace-disjoint from group ids
  label: string;
  kind: "normal" | "doc";
  origin: Origin;                                     // mandatory per decision #17
  systemRef?: SystemRef;                              // mandatory iff origin === "system"
  position?: { x: number; y: number };
  pinned?: boolean;
  groupIds: string[];                                 // derived index; canonical is group.memberNodeIds (decision #2)
  metadata?: Record<string, unknown>;
  annotations?: Record<string, unknown>;              // user-writable on system nodes per decision #23
  unresolvedWikilinks?: string[];                     // first-class on doc nodes per decision #15; populated from v0.5
}

export interface SystemRef {
  source: string;                                     // e.g., "kuzu", "neo4j", or host-defined
  sourceId: string;
  schemaType?: string;                                // DB label / class / table; surfaces via NodeType graceful degradation per decision #24
}

export interface NormalNode extends BaseNode {
  kind: "normal";
  nodeTypeId: string;                                 // references NodeType definition
  icon?: string;                                      // lucide icon name; rendered from v0.5 via IconNodeProgram
}

export interface DocNode extends BaseNode {
  kind: "doc";
  // doc body lives in `metadata.body` or a host-defined slot in v0.1; v0.5 may promote to a first-class field
  // wikilink reconciliation runs from v0.5 per decision #36
}

export type Node = NormalNode | DocNode;
```

### 5.2 Edge

```ts
export type EdgeDirection = "undirected" | "directed" | "reverse" | "bidirectional";

export interface Edge {
  id: string;
  source: EndpointRef;
  target: EndpointRef;
  edgeTypeId: string;
  direction: EdgeDirection;
  origin: Origin;                                     // mandatory per decision #17 + #21 (user edges between system nodes are still origin: "user")
  label?: string;
  metadata?: Record<string, unknown>;
  derivedFromWikilink?: boolean;                      // auto-managed from v0.5 reconciliation per decision #36
}
```

### 5.3 Group + types + settings

```ts
export interface Group {
  id: string;                                         // namespace-disjoint from node ids
  name: string;
  origin: "user";                                     // always user in v1 per system §4.6 (system groups are v2)
  color: string;                                      // hex
  memberNodeIds: string[];                            // canonical per decision #2
  description?: string;
  gravity: number;                                    // 0–1; default 0.3 (used by v0.4 group gravity force)
}

export interface NodeType {
  id: string;
  name: string;
  color: string;
  defaultIcon?: string;
  description?: string;
  schema?: ReadonlyArray<unknown>;                    // optional carrier per description §8.5 #3 — force-graph never inspects; flows through to host
}

export interface EdgeType {
  id: string;
  name: string;
  color: string;
  dashed?: boolean;                                   // honored only when no doc node is involved per decision #1
  width?: number;
  description?: string;
}

export type ThemeKey =
  | "background"
  | "edgeDefault"
  | "labelColor"
  | "hullFill"
  | "hullBorder"
  | "selectionRing"
  | "hoverGlow";

export interface GraphSettings {
  // Layout
  layoutEnabled: boolean;                             // default true
  forces: {
    linkDistance: number;                             // default 60
    repulsion: number;                                // default 200
    centerGravity: number;                            // default 0.05
    groupGravity: number;                             // default 1.0 (multiplier; v0.4)
  };
  layoutSettleDuration: number;                       // ms; default 4000

  // Display
  theme: "dark" | "light" | "custom";
  customColors?: Partial<Record<ThemeKey, string>>;
  labelFont: string;                                  // default `var(--font-sans)` resolved at runtime
  labelDensity: number;                               // 0–1; default 0.5
  labelZoomThreshold: number;                         // default 0.6
  edgeOpacity: number;                                // default 0.4
  nodeBaseSize: number;                               // default 5

  // Group rendering (v0.4+)
  groupHullPadding: number;                           // default 24
  groupHullOpacity: number;                           // default 0.15
  groupBorderWidth: number;                           // default 1.5

  // Performance
  hideEdgesOnMove: boolean;                           // default true
  renderEdgeLabels: boolean;                          // default false (v0.6)
  edgeLabelZoomThreshold: number;                     // default 0.7 per decision #14 (v0.6)

  // History (v0.2+)
  undoBufferSize: number;                             // default 100; range 10–500; cannot be 0
}
```

### 5.4 Snapshot + source

```ts
export interface GraphSnapshot {
  version: "1.0";
  nodes: Node[];
  edges: Edge[];                                      // unified — both node↔node and group-involving live here
  groups: Group[];
  edgeTypes: EdgeType[];
  nodeTypes: NodeType[];
  settings: GraphSettings;
}

export interface GraphSource {
  loadInitial(): Promise<GraphSnapshot>;
  subscribe?(callback: (delta: GraphDelta) => void): () => void;
  applyMutation?(mutation: UserMutation): Promise<MutationResult>;
}

export type GraphInput = GraphSnapshot | GraphSource;

// Deltas — applied to local state; do NOT enter undo stack per decision #22
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

// Mutations — type-supported in v0.1; not exercised until v0.3
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
  | { type: "setAnnotation"; entityId: string; key: string; value: unknown };  // single applyMutation routing per decision #33

export interface MutationResult {
  ok: boolean;
  serverState?: GraphDelta;                           // canonical state after the mutation; reconciles local optimistic updates
  error?: { code: string; message: string };
}
```

---

## 6. `validateSnapshot` algorithm (locked)

Runs on every `importSnapshot` per [decision #5](../../systems/graph-system/graph-system-description.md). Returns structured errors; rejects malformed snapshots before they enter the store.

### 6.1 Validation checks (in order)

1. **Schema version:** `snapshot.version === "1.0"`. Reject otherwise.
2. **ID uniqueness within nodes:** every `node.id` is unique. Reject duplicates.
3. **ID uniqueness within groups:** every `group.id` is unique. Reject duplicates.
4. **ID disjointness across nodes + groups:** no node and group share an id. Reject otherwise (the unified edge model relies on disambiguation by `kind`, not id prefix).
5. **NodeType reference resolution:** every `NormalNode.nodeTypeId` resolves to an entry in `snapshot.nodeTypes`. **Graceful degradation per [decision #24](../../systems/graph-system/graph-system-description.md):** unknown `schemaType` (on system nodes, derived from `systemRef.schemaType`) auto-registers a neutral default `NodeType` with a notification surfaced via `onError`. **Strict rejection** for unknown `nodeTypeId` on user nodes (the user authored the reference; broken data is a real bug).
6. **EdgeType reference resolution:** every `Edge.edgeTypeId` resolves to an entry in `snapshot.edgeTypes`. Strict rejection.
7. **Edge endpoint resolution:** every `Edge.source` and `Edge.target` resolves to an existing node (`kind: "node"`) or group (`kind: "group"`). Reject dangling references.
8. **No self-loops:** `Edge` source !== target (by both kind and id). Reject otherwise per [spec §3.3](../../../graph-visualizer-old.md).
9. **`memberNodeIds` ↔ `groupIds` agreement** per [decision #2](../../systems/graph-system/graph-system-description.md): for every group, every `memberNodeIds[i]` resolves to a node, AND that node's `groupIds` contains the group's id. Two cases:
   - If only `group.memberNodeIds` is supplied (`node.groupIds` empty): derive `node.groupIds` from canonical. Allow.
   - If both are supplied and agree: pass.
   - If both are supplied and disagree: **reject snapshot** with structured error indicating which group/node pair disagrees.
10. **Origin field present** per [decision #17](../../systems/graph-system/graph-system-description.md): every node has `origin: "system" | "user"`; every edge has `origin: "system" | "user"`. Reject if missing.
11. **`systemRef` well-formed when system-origin** per [decision #5](../../systems/graph-system/graph-system-description.md): if `node.origin === "system"`, then `node.systemRef` must be present with `source: string` and `sourceId: string`. Reject otherwise.
12. **Settings completeness:** `snapshot.settings` has all required keys with valid types. Missing optional settings get filled with defaults; missing required fields (none in v0.1; all are optional with defaults) wouldn't reject.

### 6.2 Error shape

```ts
type ValidationError =
  | { code: "VERSION_MISMATCH"; message: string; got: string; expected: "1.0" }
  | { code: "DUPLICATE_NODE_ID"; message: string; id: string }
  | { code: "DUPLICATE_GROUP_ID"; message: string; id: string }
  | { code: "ID_NAMESPACE_COLLISION"; message: string; id: string }
  | { code: "UNKNOWN_NODE_TYPE"; message: string; nodeId: string; nodeTypeId: string }
  | { code: "UNKNOWN_EDGE_TYPE"; message: string; edgeId: string; edgeTypeId: string }
  | { code: "DANGLING_EDGE_ENDPOINT"; message: string; edgeId: string; endpoint: "source" | "target"; ref: EndpointRef }
  | { code: "SELF_LOOP"; message: string; edgeId: string }
  | { code: "MEMBERSHIP_DISAGREEMENT"; message: string; groupId: string; nodeId: string }
  | { code: "MISSING_ORIGIN"; message: string; entityKind: "node" | "edge"; entityId: string }
  | { code: "MISSING_SYSTEM_REF"; message: string; nodeId: string };

interface ValidationResult {
  ok: boolean;
  errors: ValidationError[];                          // empty when ok: true
  warnings: ValidationError[];                        // graceful-degradation cases (e.g., unknown system schemaType)
}
```

### 6.3 Side effects

- **Strict errors** → snapshot rejected; `onError` fires with the first error; store remains in previous state (or empty if first import).
- **Warnings** (graceful degradation): snapshot accepted; auto-registered defaults applied; `onError` fires with each warning so hosts can surface a notification.

---

## 7. Architecture: two-layer state model

Per [description §8 Q5 (Locked)](force-graph-procomp-description.md#8-resolved-questions-locked-on-sign-off-2026-04-28) and [original spec §5.1](../../../graph-visualizer-old.md):

```
┌─────────────────────────────────────────────────────────────┐
│  Layer A — Imperative (outside React's render loop)         │
│  ┌─────────────────────────────────┐                        │
│  │  graphology MultiGraph          │ ← Sigma reads directly │
│  │  (node↔node edges only)         │                        │
│  └────────────┬────────────────────┘                        │
│               │ on every mutation                           │
│               ▼                                             │
│  ┌─────────────────────────────────┐                        │
│  │  graphologyAdapter              │                        │
│  │  • addNode/updateNode/deleteNode│                        │
│  │  • addEdge/updateEdge/deleteEdge│                        │
│  │  • bumps Zustand graphVersion   │                        │
│  └────────────┬────────────────────┘                        │
└───────────────┼─────────────────────────────────────────────┘
                │
┌───────────────▼─────────────────────────────────────────────┐
│  Layer B — Reactive (Zustand store)                         │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Slices:                                               │ │
│  │   • groupEdges        (group-involving edges per       │ │
│  │                        spec §3.4, parallel storage)    │ │
│  │   • ui                (selection / hover / linking /   │ │
│  │                        multiEdgeExpanded — v0.2+;      │ │
│  │                        scaffolded in v0.1)             │ │
│  │   • history           (undo ring buffer — v0.2+)       │ │
│  │   • settings          (theme + force config)           │ │
│  │   • graphVersion      (monotonic counter; bumps on     │ │
│  │                        every graphology mutation)      │ │
│  │                                                        │ │
│  │  Derived (memoized selectors, observe graphVersion):   │ │
│  │   • visibleNodeIds / visibleEdgeIds / visibleGroupIds  │ │
│  │   • neighborsOf(id, kind)                              │ │
│  │   • parallelEdgesBetween(a, b)                         │ │
│  └────────────────────────────────────────────────────────┘ │
│  React panels subscribe via useGraphSelector(fn)            │
└─────────────────────────────────────────────────────────────┘
```

### 7.1 graphologyAdapter (v0.1)

A thin object wrapping graphology mutations + Zustand store integration:

```ts
// hooks/use-graphology-adapter.ts
function useGraphologyAdapter(graph: MultiGraph, store: ZustandStore): GraphologyAdapter {
  return useMemo(() => ({
    addNode: (node: Node) => {
      graph.addNode(node.id, { ...node });
      store.bumpGraphVersion();
    },
    updateNode: (id: string, patch: Partial<Node>) => {
      // graphology native: setNodeAttribute per key
      Object.entries(patch).forEach(([k, v]) => graph.setNodeAttribute(id, k, v));
      store.bumpGraphVersion();
    },
    deleteNode: (id: string) => {
      graph.dropNode(id);                              // also drops incident edges
      store.bumpGraphVersion();
      // UI-state cascade (foundational; activates in v0.2 when selection/hover exist)
      store.cascadeOnDelete({ kind: "node", id });
    },
    // ... addEdge / updateEdge / deleteEdge for node↔node only; group-involving routes to groupEdges slice
  }), [graph, store]);
}
```

In v0.1, only `importSnapshot` calls into the adapter (since CRUD lands in v0.3). The adapter exists from v0.1 to enforce the bump-on-mutation pattern.

### 7.2 Zustand store structure

```ts
// store/graph-store.ts
interface GraphStore {
  // Slices (v0.1)
  groupEdges: Map<string, Edge>;                      // group-involving edges (one or both endpoints are groups)
  edgeOrder: string[];                                // single edge order across both storage layers per decision #3
  settings: GraphSettings;
  graphVersion: number;                               // bumped by graphologyAdapter and group-edge mutations

  // Slices scaffolded for later phases (present but minimal in v0.1)
  ui: { selection: null; hovered: null; /* full shape in v0.2 */ };
  history: { entries: []; cursor: 0; /* full shape in v0.2 */ };

  // Derived (memoized)
  derived: {
    visibleNodeIds: ReadonlySet<string>;
    visibleEdgeIds: ReadonlySet<string>;
    visibleGroupIds: ReadonlySet<string>;
    neighborsOf(id: string, kind: EndpointKind): ReadonlyArray<EndpointRef>;
    parallelEdgesBetween(a: EndpointRef, b: EndpointRef): ReadonlyArray<Edge>;
  };

  // Internal mutators
  bumpGraphVersion(): void;
  cascadeOnDelete(target: EndpointRef | { kind: "edge"; id: string }): void;
}

// Created via Zustand's create() with subscribeWithSelector middleware for fine-grained subscriptions
const useGraphStore = create<GraphStore>()(subscribeWithSelector((set, get) => ({ ... })));
```

### 7.3 `useGraphSelector` hook

Per [decision #4](../../systems/graph-system/graph-system-description.md): selectors that read graphology MUST observe `graphVersion`. The hook bakes this in:

```ts
// hooks/use-graph-selector.ts
export function useGraphSelector<T>(fn: (state: ForceGraphState) => T): T {
  return useGraphStore((store) => {
    // Touching graphVersion forces re-fire when graphology mutates;
    // the actual data read happens inside fn(state).
    void store.graphVersion;
    return fn(buildStateView(store, graphologyInstance));
  });
}
```

`buildStateView` constructs the public `ForceGraphState` shape from the imperative graphology instance + Zustand slices. Memoized per `graphVersion + slice references`.

### 7.4 `graphVersion` increment timing

Per [spec §5.2](../../../graph-visualizer-old.md): bumps on any change that affects what the canvas renders. Concretely:

- **Bumps on:** node CRUD (v0.3), edge CRUD (v0.3), group CRUD (v0.4), node/edge type CRUD (v0.3), group membership changes (v0.4), position commits (v0.2), pin changes (v0.2), `importSnapshot` (v0.1), delta-driven mutations from live source (v0.1).
- **Does NOT bump on:** filter changes (v0.4 onwards), selection / hover changes (v0.2), settings sliders that don't change geometry/style (v0.1+), layout-only state (toggle, kicks).

In v0.1, `graphVersion` only bumps from `importSnapshot` and live-source deltas.

### 7.5 UI-state cascade-on-delete (foundational scaffolding)

Per [description §8.5 #1](force-graph-procomp-description.md#85-plan-stage-tightenings-surfaced-during-description-review--re-validation): cascade rules wired into the store BEFORE selection/hover/etc. exist; activated in v0.2+ when those land.

```ts
// store/cascade.ts
function cascadeOnDelete(store: GraphStore, target: EndpointRef | { kind: "edge"; id: string }): void {
  // v0.1: ui.selection / ui.hovered / ui.linkingMode / ui.multiEdgeExpanded all start null/empty,
  // so this is a no-op. Wired in for v0.2+ activation.
  if (store.ui.selection?.kind === target.kind && store.ui.selection.id === target.id) {
    store.ui.selection = null;
  }
  // ... hovered, multiEdgeExpanded, linkingMode.source — all branches present, all no-ops in v0.1
}
```

Wiring the cascade in v0.1 means v0.2 + v0.3 don't have to retrofit it. v0.1 plan documents this as foundational-now-active-later wiring.

---

## 8. Rendering pipeline

### 8.1 Sigma container lifecycle

Single `<canvas>` element managed by Sigma. Mounted in `useEffect` with proper cleanup:

```tsx
// parts/sigma-container.tsx
function SigmaContainer({ graph, settings, theme }: { graph: MultiGraph; settings: GraphSettings; theme: ResolvedTheme }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sigmaRef = useRef<Sigma | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const sigma = new Sigma(graph, containerRef.current, {
      defaultEdgeType: "dashedDirected",
      edgeProgramClasses: { dashedDirected: DashedDirectedEdgeProgram },
      // node program stays Sigma's stock NodeCircleProgram in v0.1; IconNodeProgram lands in v0.5
      ...sigmaSettingsFromTheme(theme, settings),
    });
    sigmaRef.current = sigma;
    return () => {
      sigma.kill();
      sigmaRef.current = null;
    };
  }, [graph, theme, settings]);

  return <div ref={containerRef} className="absolute inset-0" tabIndex={0} role="application" aria-label="Knowledge graph" />;
}
```

`tabIndex={0}` is added in v0.1 even though keyboard shortcuts don't activate until v0.2 — sets up the focus model. The `role="application"` is appropriate for a canvas-as-UI surface.

### 8.2 Custom `DashedDirectedEdgeProgram`

Phase 0 spike outcome lives here. Source structure:

```
parts/programs/
├── dashed-directed-edge-program.ts    # the WebGL Program class
├── shaders/
│   ├── edge-vertex.glsl                # vertex shader (computes line endpoints + curve offset)
│   └── edge-fragment.glsl              # fragment shader (handles dashing, arrow heads, color blending)
```

**Per-edge attributes:** `dashed: 0|1`, `arrowSource: 0|1`, `arrowTarget: 0|1`, `curveOffset: float`, `color: vec4`, `width: float`.

**Uniforms:** none — all variation per-edge.

**Approach:** start from `@sigma/edge-arrow`'s source (per spec §11.3 plan), add:
1. `dashed` attribute → vertex shader computes stroke length; fragment shader uses `mod(strokeLength, dashCycle)` to discard pixels in gap regions.
2. `arrowSource` / `arrowTarget` attributes → vertex shader extends the line ends with arrow tip geometry conditionally.
3. `curveOffset` attribute → vertex shader displaces midpoint along the perpendicular to source→target for parallel-edge curving (used by v0.6 multi-edge expansion; in v0.1 always 0).

**Q-P4** below decides whether we ship the program in v0.1 already or wait until v0.6 for the curveOffset surface (since multi-edge isn't in v0.1, curveOffset is unused).

### 8.3 Stock NodeCircleProgram (v0.1)

v0.1 nodes render as plain colored discs via Sigma's stock `NodeCircleProgram`. Color comes from `NodeType.color`. No icons, no doc-glyph, no system-origin glyph — those land in v0.5 with custom `IconNodeProgram`.

### 8.4 SVG overlay scaffolding

Hulls + group-involving edges land in v0.4. v0.1 mounts an empty `<svg>` overlay div above the Sigma canvas (in DOM order; positioned absolute) so v0.4 has the mount point ready:

```tsx
<div className="relative h-full w-full">
  <SigmaContainer ... />
  <svg className="pointer-events-none absolute inset-0" aria-hidden="true">
    {/* hulls land in v0.4; group-involving edges in v0.4; multi-edge badges in v0.6 */}
  </svg>
</div>
```

### 8.5 Theming pipeline

Per [decision #37](../../systems/graph-system/graph-system-description.md): all colors come from CSS variables in [globals.css](../../../src/app/globals.css). Sigma's settings take concrete colors — we resolve at runtime:

```ts
// lib/theme.ts
function resolveTheme(theme: "dark" | "light" | "custom", customColors?: Partial<Record<ThemeKey, string>>): ResolvedTheme {
  const root = document.documentElement;
  const computed = getComputedStyle(root);
  const resolved: ResolvedTheme = {
    background: computed.getPropertyValue("--background").trim(),
    edgeDefault: computed.getPropertyValue("--muted-foreground").trim(),
    labelColor: computed.getPropertyValue("--foreground").trim(),
    hullFill: computed.getPropertyValue("--accent").trim(),
    hullBorder: computed.getPropertyValue("--accent-foreground").trim(),
    selectionRing: computed.getPropertyValue("--primary").trim(),
    hoverGlow: computed.getPropertyValue("--ring").trim(),
  };
  if (theme === "custom" && customColors) {
    return { ...resolved, ...customColors };          // host overrides; missing keys fall back to resolved (which is from CSS vars)
  }
  return resolved;
}
```

**Decision #8 fallback:** "Custom theme missing keys fall back to dark-theme defaults regardless of system theme." Implementation: if a custom-themed key is missing, we read the resolved value from globals.css under the `.dark` selector (force dark resolution for the missing key). Plan-stage tightening: confirm this matches decision #8's intent; alternative interpretation is fall back to current-theme resolved values. Recommendation lean: literal dark-theme fallback per the decision text.

**Theme reactivity:** subscribe to `document.documentElement` class mutations (via `MutationObserver`) so dark/light toggle re-resolves the theme without remount.

---

## 9. ForceAtlas2 worker integration

`graphology-layout-forceatlas2` ships a Web Worker variant that accepts a `MultiGraph` and runs the layout in a separate thread.

```ts
// hooks/use-fa2-worker.ts
function useFA2Worker(graph: MultiGraph, settings: GraphSettings, enabled: boolean): void {
  useEffect(() => {
    if (!enabled) return;
    const worker = new FA2Layout(graph, {
      settings: {
        linLogMode: false,
        outboundAttractionDistribution: false,
        gravity: settings.forces.centerGravity,
        scalingRatio: settings.forces.repulsion / 10,
        slowDown: 1,
        // group gravity is added as a custom force component in v0.4
      },
    });
    worker.start();

    // Settle-duration kick on mutation
    const unsubscribe = subscribeToMutations(() => {
      worker.start();
      setTimeout(() => worker.stop(), settings.layoutSettleDuration);
    });

    return () => {
      worker.kill();
      unsubscribe();
    };
  }, [graph, settings.forces, settings.layoutSettleDuration, enabled]);
}
```

**Worker lifecycle:** one worker per `<ForceGraph>` instance. The component creates + tears down its worker. Multiple `<ForceGraph>` instances on the same page each get their own worker.

**Layout toggle ON/OFF:** ON → worker runs continuously; OFF → worker paused. Mutations always kick the simulation regardless of toggle state, per [spec §10.1](../../../graph-visualizer-old.md).

**Pinned nodes:** `node.pinned === true` → worker skips that node's position update. Implemented via graphology attribute `fixed: true` (FA2 worker honors this).

---

## 10. Source-adapter contract

Three modes implicit in `GraphInput`:

### 10.1 Static snapshot mode

`data: GraphSnapshot` passed directly. Component:
1. Validates the snapshot via `validateSnapshot`.
2. Imports into graphology + Zustand slices.
3. Starts FA2 worker.
4. Never subscribes; never calls `applyMutation`.

Mutations (in v0.1, none happen at user level; in v0.3+, CRUD actions) live in component state; host gets notified via `onChange(snapshot)` after mutations settle.

### 10.2 Live source mode

`data: GraphSource` passed. Component:
1. Calls `source.loadInitial()` → awaits the snapshot → validates → imports.
2. Calls `source.subscribe(callback)` if available; stores the unsubscribe function for cleanup.
3. On delta callback: applies the delta via `applyDelta(delta)`, bumps `graphVersion`, runs UI-state cascade for any deleted entities. **Deltas do NOT enter the undo stack** ([decision #22](../../systems/graph-system/graph-system-description.md)).
4. v0.3+ user mutations call `source.applyMutation(mutation)`; v0.1 has no user mutations.

### 10.3 `applyMutation` type-supported but not exercised in v0.1

Per [description §8.5 #7](force-graph-procomp-description.md#85-plan-stage-tightenings-surfaced-during-description-review--re-validation): v0.1 ships the `GraphSource` type with `applyMutation` optional but doesn't dispatch any mutations (component is read-only). Hosts in v0.1 can omit `applyMutation` entirely; hosts supplying it have it sit unused until v0.3.

### 10.4 Delta handling

```ts
// store/apply-delta.ts
function applyDelta(adapter: GraphologyAdapter, store: GraphStore, delta: GraphDelta): void {
  switch (delta.type) {
    case "addNode":
      adapter.addNode(delta.node);                    // bumps graphVersion
      break;
    case "updateNode":
      adapter.updateNode(delta.id, delta.patch);
      break;
    case "deleteNode":
      adapter.deleteNode(delta.id);                   // also runs cascade
      break;
    // ... edge / group cases
  }
  // UI state preservation per decision #22 — deltas don't touch selection / hover / filters / linking
}
```

**Real-time delta UI-state preservation:** selection, hover, filters, multi-edge expansion, linking-mode source, undo stack are NOT touched (unless cascade requires clearing a deleted reference).

### 10.5 Stale-write conflict handling

Per [decision #32](../../systems/graph-system/graph-system-description.md): last-write-wins + warning banner for v0.1. **In v0.1, no user mutations happen**, so this is moot until v0.3. v0.1 plan reserves the banner UI surface (`onError({ code: "STALE_WRITE", message: "..." })`) for v0.3 to populate.

---

## 11. Permission resolver scaffolding

Per [decision #25](../../systems/graph-system/graph-system-description.md) + [description §8 Q6](force-graph-procomp-description.md#8-resolved-questions-locked-on-sign-off-2026-04-28): own resolver inside `force-graph`; lands in v0.3. v0.1 ships only the **scaffolding**:

```ts
// lib/permissions/resolver.ts
type PermissionAction =
  | "edit-canonical"
  | "edit-annotation"
  | "delete"
  | "add-to-group"
  | "connect-via-edge";

interface PermissionContext {
  entity: Node | Edge | Group;
  action: PermissionAction;
}

// v0.1: only origin-driven defaults wired; full layered resolution lands in v0.3
function defaultResolver(ctx: PermissionContext): boolean {
  if (ctx.entity.origin === "system" && ctx.action === "edit-canonical") return false;
  if (ctx.entity.origin === "system" && ctx.action === "delete") return false;
  return true;                                        // everything else: allow
}
```

In v0.1, no actions are taken (read-only), so the resolver isn't called. v0.3 wires it into every CRUD path.

---

## 12. File-by-file plan

Sealed folder per [component-guide §5](../../component-guide.md#5-anatomy-of-a-component-folder), with `parts/`, `hooks/`, and `lib/` subfolders given the complexity. The `lib/` deviation matches workspace + rich-card precedent (pure non-React code).

```
src/registry/components/data/force-graph/
├── force-graph.tsx                            # the component (named export, "use client")
├── types.ts                                   # all public types from §5
├── dummy-data.ts                              # 3 fixtures: small (10 nodes, system+user), medium (100), demo-of-modes
├── demo.tsx                                   # default export; static-snapshot mode demo
├── usage.tsx                                  # default export; written guidance + code blocks
├── meta.ts                                    # ComponentMeta with v0.1.0 alpha
├── index.ts                                   # barrel
│
├── parts/
│   ├── sigma-container.tsx                    # Sigma instance lifecycle (mount/unmount)
│   ├── svg-overlay.tsx                        # empty in v0.1; mount point for v0.4 hulls + v0.6 multi-edge badges
│   └── programs/
│       ├── dashed-directed-edge-program.ts    # custom WebGL edge program (Phase 0 spike outcome)
│       ├── README.md                          # GLSL source map + uniform/attribute reference
│       └── shaders/
│           ├── edge-vertex.glsl
│           └── edge-fragment.glsl
│
├── hooks/
│   ├── use-graph-store.ts                     # Zustand store creator; returns useGraphStore + useGraphSelector
│   ├── use-graphology-adapter.ts              # graphologyAdapter (wraps mutations + bumps graphVersion)
│   ├── use-fa2-worker.ts                      # FA2 worker lifecycle (start/stop/kick)
│   ├── use-source-adapter.ts                  # loadInitial + subscribe + applyMutation orchestration
│   ├── use-theme-resolution.ts                # resolves CSS variables → ResolvedTheme; subscribes to dark-class changes
│   └── use-graph-actions.ts                   # exposes ActionsV01 to consumers
│
└── lib/
    ├── validate-snapshot.ts                   # validateSnapshot algorithm from §6
    ├── store/
    │   ├── store-creator.ts                   # Zustand store with subscribeWithSelector middleware
    │   ├── slices/
    │   │   ├── group-edges-slice.ts           # group-involving edge storage (per spec §3.4)
    │   │   ├── ui-slice.ts                    # selection / hover / linking / multiEdgeExpanded — scaffolded; full shape v0.2
    │   │   ├── history-slice.ts               # undo ring buffer — scaffolded; full shape v0.2
    │   │   └── settings-slice.ts              # GraphSettings + defaults
    │   ├── derived/
    │   │   ├── visible-ids.ts                 # visibleNodeIds / visibleEdgeIds / visibleGroupIds (in v0.1, all = all)
    │   │   └── topology.ts                    # neighborsOf, parallelEdgesBetween
    │   ├── cascade.ts                         # cascadeOnDelete (foundational scaffolding)
    │   └── apply-delta.ts                     # delta → adapter dispatch; UI-state preservation
    ├── permissions/
    │   └── resolver.ts                        # default origin-driven resolver scaffolding (v0.3 expands)
    ├── theme.ts                               # CSS variable resolution + decision #8 dark-theme fallback
    └── source-adapter/
        ├── snapshot-mode.ts                   # static snapshot bootstrap
        ├── live-mode.ts                       # subscribe + delta loop
        └── source-types.ts                    # GraphSource interface helpers (typed delta dispatchers)
```

**Total v0.1 files:** ~32 files (1 root + 7 anatomy + 3 parts + 6 hooks + 15 lib).

**Subfolders rationale:**
- `lib/store/`: Zustand store + slices + derived selectors are pure non-React code; `lib/` is the right home (mirrors rich-card and workspace).
- `lib/permissions/`: per [decision #25](../../systems/graph-system/graph-system-description.md), per-component resolver in v1; this folder will move to `src/lib/permissions/` only after rich-card + force-graph both ship resolvers.
- `lib/source-adapter/`: bootstrap helpers (loadInitial wrapper, delta dispatch loop, type helpers). Adapters themselves live OUTSIDE the registry per [decision #27](../../systems/graph-system/graph-system-description.md).
- `parts/programs/`: custom WebGL program(s). v0.1 has just `DashedDirectedEdgeProgram`; v0.5 adds `IconNodeProgram` here.

### 12.1 Build order within v0.1

1. `types.ts` — all public types from §5 (1 day).
2. `lib/validate-snapshot.ts` — validation algorithm from §6 (1 day; pure function, easy to verify by inspection).
3. `lib/store/` — Zustand store + slices + derived selectors (2 days).
4. `hooks/use-graphology-adapter.ts` + `hooks/use-graph-store.ts` + `hooks/use-graph-selector.ts` (1 day).
5. `lib/source-adapter/` — snapshot-mode + live-mode bootstrap (1 day).
6. `lib/theme.ts` + `hooks/use-theme-resolution.ts` (0.5 day).
7. `parts/programs/dashed-directed-edge-program.ts` + shaders (3–5 days; Phase 0 spike outcome refined into production code).
8. `parts/sigma-container.tsx` (1 day).
9. `parts/svg-overlay.tsx` (0.5 day; mount point only).
10. `hooks/use-fa2-worker.ts` (1 day).
11. `force-graph.tsx` — top-level component wiring (0.5 day).
12. `lib/permissions/resolver.ts` (0.5 day; scaffolding only).
13. `dummy-data.ts` + `demo.tsx` + `usage.tsx` + `meta.ts` + `index.ts` (1 day).

**Total:** ~14 dev-days = ~3 weeks at the system §10.3 budget. On track.

---

## 13. Edge cases (locked)

| # | Edge case | Resolution |
|---|---|---|
| 1 | Empty snapshot (zero nodes / zero edges / zero groups) | Validates fine; renders empty canvas with "no data" overlay; FA2 worker starts but has nothing to layout |
| 2 | Snapshot with 100k+ nodes | Validates (cheap); imports (might block briefly); FA2 worker handles layout off-thread; render at ≥30 fps target (Phase 0 gate) |
| 3 | Live source `loadInitial()` rejects | `onError({ code: "LOAD_INITIAL_FAILED", message })` fires; component renders empty canvas with error overlay |
| 4 | Live source `subscribe` callback fires before `loadInitial` resolves | Queue deltas; apply after import settles. Plan-stage tightening for delta queueing semantics |
| 5 | Delta references entity that doesn't exist locally | `onError({ code: "STALE_DELTA_REFERENCE", message })`; delta dropped; cascade NOT run (nothing to cascade) |
| 6 | Snapshot mid-mutation (graphology in inconsistent state) | Not possible — `importSnapshot` is atomic: validate → graph.clear() → load → bump graphVersion in one synchronous block |
| 7 | Theme switch during mount | MutationObserver on `document.documentElement` class triggers theme re-resolve + Sigma settings update without remount |
| 8 | `customColors` partial with `theme: "dark"` | Per [decision #8](../../systems/graph-system/graph-system-description.md): missing keys fall back to dark-theme defaults; supplied keys override |
| 9 | `data` prop changes between snapshot ↔ source | Component re-mounts cleanly; previous source unsubscribed; FA2 worker killed + restarted |
| 10 | FA2 worker fails to start (e.g., browser blocks workers) | `onError({ code: "WORKER_INIT_FAILED" })`; component renders without layout (positions remain at initial values; pinned-only effectively) |
| 11 | Sigma `kill()` during pending render frame | Standard graphology lifecycle; Sigma handles it. Test in CI when Vitest lands |
| 12 | Snapshot `version !== "1.0"` | Strict reject per §6 |
| 13 | Edge endpoint resolves to a deleted entity (live mode race) | Validate at delta-application time; if endpoint missing, drop the delta + warn |
| 14 | `customColors` with invalid CSS color values | Plan-stage tightening: validate via `CSS.supports("color", value)` at theme-resolve time; invalid → dark fallback + warn |

---

## 14. Accessibility

Per [component-guide §8](../../component-guide.md#8-design-system-contract) accessibility section:

- Canvas root: `role="application"` (appropriate for canvas-as-UI), `aria-label` from prop (default `"Knowledge graph"`), `tabIndex={0}` (keyboard-focusable; shortcuts activate v0.2).
- Empty state overlay: `role="status"` with descriptive text.
- Error overlay: `role="alert"` (announces immediately on error).
- Custom theme: respects `prefers-reduced-motion` for FA2 layout (settle duration → 0 if reduced motion, per `useReducedMotion` hook).
- Color contrast: all theme tokens come from globals.css which already meets WCAG AA in both light and dark modes.

In v0.1, no interactive elements — selection, hover, drag, keyboard nav all land in v0.2.

---

## 15. Performance

| Concern | v0.1 strategy |
|---|---|
| Initial render at 100k nodes | Sigma + WebGL handles natively; gate at ≥30 fps from Phase 0 spike |
| Layout blocking UI | FA2 in Web Worker (`graphology-layout-forceatlas2/worker`) |
| Pan/zoom FPS | `hideEdgesOnMove: true` setting drops edge rendering during interaction |
| React re-renders | Zustand selectors via `useGraphSelector`; only panels reading changed slices re-render |
| graphVersion thrash | Bumps only on rendering-affecting changes; filters/UI/settings (when added) don't bump |
| Theme re-resolve | Cached; re-resolves only on `document.documentElement` class change via MutationObserver |
| Bundle weight | 300KB component-alone ceiling per [description §8 Q10](force-graph-procomp-description.md#8-resolved-questions-locked-on-sign-off-2026-04-28); v0.1 well under (~218KB realistic) |

**No test runner wired** — same posture as workspace + rich-card. Pure modules in `lib/` (validate-snapshot, store, theme, permissions/resolver) are written to be testable in isolation when Vitest lands. v0.1 verification is demo-driven via the dummy-data fixtures.

---

## 16. Risks & alternatives

### Risks (carried from description, with v0.1-specific mitigations)

| Risk | v0.1 mitigation |
|---|---|
| Phase 0 spike fails | Pre-condition gate (§2); plan replans with intermediate fallbacks (split edge programs) before SVG-overlay |
| Bundle weight ceiling | 300KB ceiling; v0.1 is the ground floor (~218KB realistic with sigma + graphology + FA2 + d3-polygon + lucide tree-shaken + Zustand + our code); plan-stage `size-limit` audit |
| FA2 worker browser compatibility | Worker is mainstream; `OffscreenCanvas` is NOT used (Sigma stays on main thread). If a host blocks workers, error path activates (edge case #10) |
| graphology MultiGraph mutation patterns | Stable API; `subscribe` middleware in Zustand catches changes the imperative layer didn't bump (defensive) |
| React Compiler interactions | useEffect with cleanup is compiler-safe; refs are stable; verify with compiler enabled at end of v0.1 |

### Alternatives considered, rejected (or deferred)

- **Render the entire surface in React (no Sigma).** Rejected per spec §2: 100k node scale is unrealistic in DOM.
- **Use react-force-graph + custom decoration layer.** Rejected per [description §8 Q2](force-graph-procomp-description.md#8-resolved-questions-locked-on-sign-off-2026-04-28): no native MultiGraph; custom-program API is awkward.
- **Lazy-load FA2 worker.** Possible v0.6 optimization if bundle pressure mounts; not in v0.1.
- **Defer source-adapter contract to v0.2.** Rejected per Q3 lock; would require v0.1→v0.2 refactor of every action handler.
- **Combine `lib/store/` + `hooks/use-graph-store.ts` into one file.** Rejected: separation lets us test pure store logic without React.

---

## 17. Resolved plan-stage questions (locked on sign-off 2026-04-28)

All 11 questions resolved at sign-off. **Q-P0 surfaced during re-validation** (compound API need exposed by description §6.3 sibling-hook pattern); **Q-P5 + Q-P9 refined**; **Q-P3 documents a deviation from system [decision #11](../../systems/graph-system/graph-system-description.md)** which receives a footnote on next system-description revision (per §17.5 #5 below).

**Q-P0 (NEW): Component shape — single `<ForceGraph>` vs compound `<ForceGraph.Provider>` + `<ForceGraph.Canvas>`?**
**Locked: single `<ForceGraph>` component in v0.1; compound API ships in v0.2 plan when sibling-hook access becomes useful.** Surfaced during re-validation: description's [§6.3 Tier 3 wiring example](force-graph-procomp-description.md#63-tier-3-graph-system-page-full-panel-composition--the-integration-test) calls `useGraphSelector` and `useGraphActions` from sibling components (FilterStack, DetailPanel) — standalone hooks need a Provider context to know which ForceGraph instance to subscribe to. **v0.1 is read-only**, so siblings have minimal hook needs (no selection/hover/mutation state to subscribe to). **v0.2 plan introduces** `ForceGraph.Provider` (creates per-instance store, supplies React context) + `ForceGraph.Canvas` (renders WebGL surface against context store) along with the selection/hover state that creates the real sibling-access demand. Both APIs coexist non-breakingly: v0.1's single `<ForceGraph>` continues working; v0.2 adds compound exports. Description §5.1 single-component definition stays correct for v0.1.

**Q-P1: graphology MultiGraph instance ownership.**
**Locked: `useRef` inside the component**; `graphologyAdapter` (a hook) closes over the ref. Non-reactive imperative state inside Zustand fights the reactive paradigm; `useRef` is the React-idiomatic way to hold imperative instances. Same pattern for Sigma instance and FA2 worker — all three imperative things live in `useRef`s.

**Q-P2: Custom edge program `curveOffset` attribute.**
**Locked: ship `curveOffset` attribute in v0.1's `DashedDirectedEdgeProgram`** (always 0 in v0.1; used in v0.6 multi-edge expansion). Adding shader attributes later requires program rebuild + re-test cycle. Cost is one float per edge in vertex buffer. Including now means v0.6 just sets it.

**Q-P3: Lucide icon atlas timing — DEVIATES from system [decision #11](../../systems/graph-system/graph-system-description.md).**
**Locked: defer atlas construction to v0.5** alongside `IconNodeProgram` (the program that consumes the atlas). System decision #11's "v0.1" wording was authored for the original 9-week monolith where all node visuals shipped together. The phased plan's v0.5 ships `IconNodeProgram` + atlas together; building the atlas in v0.1 is wasted scaffolding without the program. **System description amendment proposed** (§17.5 #5): footnote decision #11 on next description revision noting the phased-plan reinterpretation.

**Q-P4: `validateSnapshot` warning surface.**
**Locked: single `onError` channel with `severity: "warning" | "error"` field on the error.** Single channel keeps API surface tight; hosts filter by severity for UI treatment. Adding a separate `onWarning` later is non-breaking if real demand surfaces.

**Q-P5: Delta queueing during initial load — REFINED on re-validation.**
**Locked: queue + apply after `loadInitial` settles; ring buffer with cap 1000.** If buffer exceeds cap (rare; indicates malformed source over-firing), surface `onError({ severity: "error", code: "DELTA_BUFFER_OVERFLOW", count: 1000 })` and abort import; host handles. Without the cap, a runaway source could OOM. Cap value (1000) is plan-stage tightening detail; raise via `GraphSettings` if real consumers hit it.

**Q-P6: `pinAllPositions` undo recording.**
**Locked: never recorded into undo, ever.** Mode-of-operation per [spec §5.5](../../../graph-visualizer-old.md). v0.2 plan honors when undo lands. Documented here so v0.2 plan author doesn't re-litigate.

**Q-P7: `exportSnapshot` settings inclusion.**
**Locked: always include current `settings`.** Round-trip predictability — `import(export(s))` produces an equivalent snapshot. Diffing settings against defaults would be brittle; cost is negligible.

**Q-P8: Test-runner stance for v0.1.**
**Locked: ship with test-debt note.** Same posture as `workspace` + `rich-card`. Pure `lib/` modules (`validate-snapshot`, `store/*`, `theme`, `permissions/resolver`, `source-adapter/*`) are written to be testable in isolation when Vitest lands. v0.1 verification is demo-driven via `dummy-data.ts` fixtures. **Bundle-weight audit IS wired in v0.1** via `size-limit` (or equivalent) — bundle audit is independent of test-runner status (§17.5 #3).

**Q-P9: Theme dark-fallback implementation — REFINED on re-validation.**
**Locked: capture dark-theme defaults once at module init via temporary `.dark` element; cache as `DARK_THEME_FALLBACKS` constant.** Refined approach: at module load, create hidden helper element, apply `.dark` class, read `getComputedStyle` for each ThemeKey, store result as constants, remove element. One-time cost; no ongoing DOM manipulation per call. Decision #8's literal interpretation (fallback to dark-theme regardless of current theme) is preserved.

**Q-P10: Edge type strict vs graceful-degradation parity with node types.**
**Locked: edges strict-reject on unknown `edgeTypeId`** (asymmetric with node-type graceful degradation per [decision #24](../../systems/graph-system/graph-system-description.md)). System nodes evolve at runtime via DB schema additions (the graceful degradation use case); edge types are typically static config supplied by the host. Asymmetry is justified; usage docs note it explicitly.

## 17.5 Plan-stage refinements (surfaced during re-validation)

These are baked into implementation but worth flagging explicitly:

1. **`subscribeWithSelector` middleware rationale.** Zustand's default `subscribe` fires on entire state changes; we need slice-level subscriptions for the panel-density use case (per [spec §5.4](../../../graph-visualizer-old.md)). Implementation note for `hooks/use-graph-store.ts`: wrap the store creator with `subscribeWithSelector(...)`.
2. **React.StrictMode + double-mount handling.** Next 16 dev mode runs effects twice. Sigma + FA2 worker lifecycles must handle double-mount cleanly: store creation idempotent (`if (!storeRef.current)` pattern in `useRef`); Sigma `kill()` callable in cleanup without throwing on second invocation; FA2 worker disposal idempotent (`worker.kill()` is no-op if already killed).
3. **Bundle audit wired in v0.1.** Per Q-P8, set up `size-limit` (or `pnpm build --analyze`) at v0.1 implementation start with budget = 300KB component-alone; per-import breakdown in CI. Not gated on Vitest landing.
4. **Compound API evolution path** (per Q-P0). v0.1 ships single `<ForceGraph>`. v0.2 plan introduces `ForceGraph.Provider` + `ForceGraph.Canvas` with React context for sibling-hook access. Both forms exported from `index.ts` from v0.2 onward; usage docs cover both. v0.1 README / `usage.tsx` notes the future evolution.
5. **System description footnote on decision #11** (per Q-P3). On next system-description revision, decision #11 receives a footnote: "Phased-plan reinterpretation: atlas + `IconNodeProgram` ship together in `force-graph` v0.5, not v0.1. Wording predates the procomp decomposition."
6. **Worker-failure overlay copy.** Edge case #10 (FA2 worker fails to start) needs concrete error overlay text. Plan-stage tightening: "Layout disabled: this browser blocked the layout worker. Drag nodes manually or refresh and try again." Hosts override via `onError` callback.
7. **`exportSnapshot` round-trip property.** Plan should include a self-test on first import: `import(export(import(snapshot)))` produces structurally equivalent state. Demo-driven validation in v0.1; first Vitest target when test runner lands.

---

## 18. Definition of "done" for THIS document (stage gate)

- [x] User reviewed §1–§16 (the locked plan) and §17 (resolved Q-Ps + §17.5 refinements).
- [ ] **Phase 0 risk spike PENDING.** Plan is signed off against the assumption that the spike succeeds (≥30 fps on integrated GPU at 100k edges with `DashedDirectedEdgeProgram`). **Before implementation begins, the spike must actually run and the result documented in STATUS.md.** If the spike fails, this plan is invalidated and rewritten with the contingency tree (intermediate fallbacks → SVG-overlay worst case).
- [x] All 11 plan-stage questions resolved (Q-P0 surfaced + locked on re-validation; Q-P5, Q-P9 refined; Q-P3 deviates from decision #11 with system-description footnote pending per §17.5 #5).
- [x] User said **"plan approved"** — Stage 3 (implementation) unlocks once the Phase 0 spike completes.

After sign-off, the next session starts with:

1. Confirm Phase 0 spike result in STATUS.md (already documented per pre-condition gate above).
2. `pnpm dlx shadcn@latest add <any-missing-primitives>` — likely none in v0.1 since force-graph doesn't compose Tier 1 components.
3. `pnpm new:component data/force-graph` — runs the scaffolder.
4. Implement against this plan, file-by-file in the §12.1 build order.
5. Author `force-graph-procomp-guide.md` (Stage 3) alongside the implementation. The guide is a single doc covering all phases (v0.1 entries first; v0.2–v0.6 sections appear as later plans land).
6. Run the [§13 verification checklist from the component-guide](../../component-guide.md#13-verification-checklist).
7. Update STATUS.md with v0.1 ship entry.
8. Begin v0.2 plan authoring (independent — no Tier 1 dependencies).

If at any point during implementation a plan decision turns out wrong, **stop, document the issue, ask before deviating**. The plan is the contract; deviations are loud, not silent.

---

*End of v0.1 plan. Sister docs in this folder: [description](force-graph-procomp-description.md), [v0.2 plan](force-graph-v0.2-plan.md) (TBA), [v0.3 plan](force-graph-v0.3-plan.md) (TBA — gated on properties-form + detail-panel plans), [v0.4 plan](force-graph-v0.4-plan.md) (TBA — gated on filter-stack plan), [v0.5 plan](force-graph-v0.5-plan.md) (TBA — gated on markdown-editor plan), [v0.6 plan](force-graph-v0.6-plan.md) (TBA), [guide](force-graph-procomp-guide.md) (TBA — authored alongside implementation).*
