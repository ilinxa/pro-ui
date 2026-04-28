# Graph Visualization Component — Project Specification (v4)

> A React-based knowledge graph visualization component inspired by Obsidian, with structured groups, typed directional edges, doc-node markdown linking, and an externally-composable panel architecture.

> **v4 changes**: articulated undo recording principle, defined transactional history entries for composite operations, locked keyboard focus model (canvas-only), specified UI-state cascade cleanup on deletions, fixed FiltersPanel build phasing, fixed DetailPanel mode phasing, plus 11 smaller tightening fixes. See §15.

---

## 1. Overview

### 1.1 Purpose

A self-contained, embeddable React component for visualizing and editing a knowledge graph of up to ~100k nodes. The component takes a JSON payload as input, renders an interactive force-directed graph on a WebGL canvas, and exposes a set of independent panels (controls, filters, detail, creation, advanced settings) that the host application places anywhere in its layout.

### 1.2 Design philosophy

- **Canvas is one component, panels are separate components.** No assumption that panels live next to the canvas. They communicate through a shared store.
- **Single source of truth lives outside React.** A graphology instance holds nodes and node-to-node edges; React reads from it via hooks and writes to it via actions. Sigma re-renders on graph mutation; React panels re-render only on their selected store slices.
- **JSON in, JSON out.** No backend coupling. The host owns persistence; the component takes a snapshot in and emits change events / exports a snapshot back.
- **Obsidian-faithful where it makes the experience better, structured where Obsidian is too loose.** Wikilink syntax and force-directed feel are kept; typed edges, structural groups, and explicit node types are added because the use case demands more rigor than personal note-taking.

### 1.3 Target scale

50,000–100,000 nodes with 2–5x as many edges. Drives: WebGL rendering, force layout in a Web Worker, label culling at low zoom, hideEdgesOnMove during pan/zoom, and lazy multi-edge expansion.

---

## 2. Tech stack

| Layer | Choice | Why |
|---|---|---|
| Framework | React 18+ | Required by the brief |
| Renderer | Sigma.js (WebGL) | Only realistic option at 100k node scale |
| Graph data structure | graphology (`MultiGraph` instance) | Sigma's native data layer; supports parallel edges between nodes |
| Layout | graphology-layout-forceatlas2 (Web Worker) | Non-blocking; handles 100k nodes |
| Custom edge program | Hand-rolled WebGL program for "dashed + directed" combinations | Sigma's stock programs handle one or the other, not both — see §11.3 |
| Custom node program | Hand-rolled WebGL program for icon + doc-glyph rendering | Sigma's stock node program doesn't support icons or per-node decorations — see §11.4 |
| Group hull rendering | SVG overlay synced to Sigma's camera | Sigma can't natively render hulls; SVG gives full styling control |
| State store | Zustand | Selector-based subscriptions; minimal re-renders |
| Markdown parsing (doc nodes) | `unified` + `remark-parse` + custom wikilink plugin | Standard, extensible |
| Convex hull computation | `d3-polygon` | For group boundary rendering |
| Icons | `lucide-react` | Icon picker for normal nodes |

**Note on graphology's role**: graphology's MultiGraph natively handles parallel edges between *nodes*. Parallel edges where one or both endpoints are *groups* live in the Zustand store (see §3.4); the parallel-edge bookkeeping for those is custom logic in the group-edge slice, not graphology. This split is invisible to consumers of the public API.

---

## 3. Data model

All data flows in and out as JSON.

### 3.1 Top-level snapshot

```ts
interface GraphSnapshot {
  version: "1.0";
  nodes: Node[];
  edges: Edge[];                   // unified edge model: see §3.3
  groups: Group[];
  edgeTypes: EdgeType[];
  nodeTypes: NodeType[];
  settings: GraphSettings;
}
```

There is **one** edges array. Edges between any combination of nodes and groups all live here.

### 3.2 Nodes

Two kinds, sharing a base shape, differentiated by `kind`.

```ts
type Node = NormalNode | DocNode;

interface BaseNode {
  id: string;                      // stable, unique across nodes (and namespace-distinct from group IDs)
  label: string;
  kind: "normal" | "doc";
  position?: { x: number; y: number };  // optional pinned position
  pinned?: boolean;                // if true, layout won't move it
  groupIds: string[];              // can belong to multiple groups
  metadata?: Record<string, unknown>;  // free-form, host-defined
}

interface NormalNode extends BaseNode {
  kind: "normal";
  nodeTypeId: string;              // references NodeType definition
  icon?: string;                   // lucide icon name, e.g. "database", "user"
}

interface DocNode extends BaseNode {
  kind: "doc";
  content: string;                 // markdown body, may contain [[wikilinks]]
}
```

**ID namespacing**: node and group IDs share the same string namespace (no node and group can have the same ID). This is a hard invariant — the unified edge model needs to disambiguate endpoints by kind, not by ID prefix. The store validates this on `addNode`, `addGroup`, and `importSnapshot`.

### 3.3 Edges (unified model)

Every edge has a typed source and target endpoint. Either endpoint can be a node or a group.

```ts
interface Edge {
  id: string;
  source: { kind: "node" | "group"; id: string };
  target: { kind: "node" | "group"; id: string };
  edgeTypeId: string;              // references EdgeType definition
  direction: EdgeDirection;
  label?: string;                  // optional per-edge label override
  metadata?: Record<string, unknown>;
  derivedFromWikilink?: boolean;   // auto-managed; true when generated from doc content
}

type EdgeDirection =
  | "undirected"      // ───   (semantically: no direction)
  | "directed"        // ───>
  | "reverse"         // <───  (rare; UI usually flips source/target instead — kept for round-tripping data)
  | "bidirectional";  // <───>  (semantically: directed both ways)
```

Allowed endpoint combinations:

| source.kind | target.kind | Use case example |
|---|---|---|
| node | node | Normal connection between two notes/entities |
| node | group | Doc node `[[Apollo Project]]` resolving to a group named "Apollo Project" |
| group | node | A team (group) "owns" a specific person (node) |
| group | group | One project depends on another project |

**Self-loops** (source equals target, both kind and id) are disallowed. The store's `addEdge` rejects them; reconciliation in §3.10 skips them.

**Distinction between `undirected` and `bidirectional`**: undirected means "the relationship has no direction" (e.g. "is sibling of"); bidirectional means "it goes both ways" (e.g. "trades with"). Visually they may look similar, but they're semantically different and queries/filters can distinguish them. Default direction for new edges is `undirected`.

**Multi-edges** between the same endpoint pair are allowed. graphology's `MultiGraph` handles node↔node parallels natively. Group-involving parallels are tracked in the Zustand store (see §3.4). When ≥2 edges exist between the same pair, the renderer collapses them into a single visual edge with a count badge (e.g. `×3`); clicking the badge expands the parallel set into curves.

### 3.4 Storage strategy: where do edges live?

Edges split across two storage layers based on endpoint kinds — implementation detail of the unified model, invisible at the API boundary:

- **Node↔node edges**: stored as native graphology edges. Sigma renders them through the WebGL pipeline. The `direction`, `edgeTypeId`, `label`, `derivedFromWikilink` are stored as edge attributes on the graphology edge.
- **Group-involving edges** (node↔group, group↔node, group↔group): stored in the Zustand store (`state.groupAnchoredEdges`). Rendered through the SVG overlay layer, with endpoints anchored to the group hull's nearest-boundary point on each frame.

Externally, `GraphSnapshot.edges` flattens both. On import, edges are partitioned by endpoint kinds and routed to the right storage. On export, both are merged back into one array, **preserving insertion order** (the order in which edges were added to the store, equivalent to the order they appeared in the most recent `importSnapshot`).

Actions like `addEdge` accept any endpoint combination and dispatch internally.

### 3.5 Edge style: dashed for doc-involving edges

Whether an edge renders dashed is **derived**, not a stored field on the edge. Rule (in priority order):

1. If `source.kind === "node"` and the source node is a doc node → **dashed** (forced).
2. If `target.kind === "node"` and the target node is a doc node → **dashed** (forced).
3. Otherwise: dashed if and only if `edgeType.dashed === true`.

Doc-kind participation **forces dashed**, no override. A user who creates a custom edge type with `dashed: false` will still see dashed rendering on doc-involving edges of that type — by design. The visual contract is: *"dashed always means at least one endpoint is a doc."*

Group-involving edges follow the per-edgetype `dashed` flag normally; doc-kind nodes are not transitive through groups.

### 3.6 Edge types

```ts
interface EdgeType {
  id: string;
  name: string;                    // e.g. "depends-on", "references", "general"
  color: string;                   // hex
  dashed?: boolean;                // honored only when no doc node is involved (see §3.5)
  width?: number;                  // base stroke width
  description?: string;
}
```

Built-in: one type with id `"general"` (neutral color, undirected by default, `dashed: false`). Users define more via the advanced settings panel.

### 3.7 Node types (for normal nodes)

```ts
interface NodeType {
  id: string;
  name: string;                    // e.g. "person", "project", "concept"
  color: string;
  defaultIcon?: string;            // lucide icon name
  description?: string;
}
```

Doc nodes don't use NodeType. They have their own visual identity (see §8.2).

### 3.8 Groups

```ts
interface Group {
  id: string;                      // distinct from any node ID (see §3.2)
  name: string;
  color: string;                   // hull border + translucent fill derived from this
  memberNodeIds: string[];         // can include any node kind (normal or doc)
  description?: string;
  gravity: number;                 // 0–1, force pulling members together (default 0.3)
}
```

**Multi-membership**: a node can be in multiple groups. Hull overlap is intentional and visually meaningful (see §7.2).

**No nesting**: a group cannot contain another group. Group-to-group *connection* is via `Edge`; group-to-group *containment* is not in v1.

**Group-to-anything edges**: handled by the unified edge model in §3.3.

### 3.9 Settings

```ts
type ThemeKey =
  | "background"
  | "edgeDefault"
  | "labelColor"
  | "hullFill"
  | "hullBorder"
  | "selectionRing"
  | "hoverGlow";

interface GraphSettings {
  // Layout
  layoutEnabled: boolean;          // see §10 for ON/OFF semantics
  forces: {
    linkDistance: number;
    repulsion: number;
    centerGravity: number;
    groupGravity: number;          // multiplier on per-group gravity values
  };
  layoutSettleDuration: number;    // ms; how long a mutation/rerun "kick" lasts (default 4000)

  // Display
  theme: "dark" | "light" | "custom";
  customColors?: Partial<Record<ThemeKey, string>>;
  labelFont: string;               // CSS font-family for node labels
  labelDensity: number;            // 0–1
  labelZoomThreshold: number;      // labels appear above this zoom level
  edgeOpacity: number;
  nodeBaseSize: number;

  // Group rendering
  groupHullPadding: number;
  groupHullOpacity: number;
  groupBorderWidth: number;

  // Performance
  hideEdgesOnMove: boolean;
  renderEdgeLabels: boolean;

  // History
  undoBufferSize: number;          // 10–500; default 100; see §5.5. Cannot be 0 (undo always available).
}
```

### 3.10 Wikilinks (doc node connections)

Inside a doc node's `content`, the parser handles `[[Target Label]]` and `[[Target Label|display text]]`. Resolution always uses the part before `|`; the alias (after `|`) affects only the rendered link text in the markdown preview.

**Image embeds (`![[image.png]]`)**: not parsed in v1. Render as literal text in the markdown preview.

**Matching rules** (Obsidian-aligned):
- Case-insensitive
- Leading and trailing whitespace trimmed
- Internal whitespace preserved (not normalized)
- No accent folding (`café` does not match `cafe`)
- Exact match against the full label string (no substring or fuzzy matching)

**Tiebreaking**:
- If multiple nodes share a label modulo the case-insensitive matching rules, the lexicographically smallest `id` wins. The conflict surfaces as a warning in the detail panel.
- If a node and a group both match (regardless of case), **node wins** (per step 5 below). Conflict surfaces as a warning.

For each parsed wikilink:

1. **Resolve** the target label (the part before `|`, after trimming) against:
   - All nodes (any kind)
   - All groups
2. **Self-reference**: if the resolved target is the same doc node containing the wikilink, **skip** it (no edge created — the no-self-loops invariant from §3.3 is upheld). Surface a warning in the detail panel.
3. **If matched to a node**: ensure an edge exists `source: { kind: "node", id: thisDoc }, target: { kind: "node", id: target }, edgeTypeId: "general", direction: "directed", derivedFromWikilink: true`. Edge auto-renders dashed (rule 1 of §3.5).
4. **If matched to a group**: ensure an edge exists `source: { kind: "node", id: thisDoc }, target: { kind: "group", id: target }, edgeTypeId: "general", direction: "directed", derivedFromWikilink: true`. Auto-dashed (rule 1 of §3.5).
5. **Multiple matches** (a node and a group share a label): node wins. A warning surfaces in the detail panel.
6. **No match**: append to `node.metadata.unresolvedLinks: string[]`. Surfaces in the detail panel. v1 does not render ghost nodes on the canvas.

**Reconciliation on import**: after parsing all docs, sweep existing `derivedFromWikilink: true` edges; remove any whose source doc no longer contains the matching wikilink. This makes re-imports idempotent.

**v1 is read-only** for doc content. The reconciliation runs only on `importSnapshot`, not in response to runtime edits.

---

## 4. Architecture & file structure

```
graph-component/
├── src/
│   ├── index.tsx                      # Public entry: <GraphProvider /> + panels
│   ├── store/
│   │   ├── graphStore.ts              # Zustand store (UI state + actions)
│   │   ├── graphologyAdapter.ts       # Wraps node↔node edge storage in graphology
│   │   ├── groupEdgeStore.ts          # Storage for group-involving edges
│   │   ├── historyStore.ts            # Undo/redo: command ring buffer (see §5.5)
│   │   └── selectors.ts               # Memoized selectors:
│   │                                   #   - neighborsOf(id, kind)
│   │                                   #   - visibleNodeIds (filter result)
│   │                                   #   - visibleEdgeIds
│   │                                   #   - visibleGroupIds
│   │                                   #   - parallelEdgesBetween(a, b)
│   │                                   #   - groupHullPoints(groupId)
│   ├── canvas/
│   │   ├── GraphCanvas.tsx            # The Sigma container component
│   │   ├── LayoutController.tsx       # Manages FA2 worker lifecycle + group gravity
│   │   ├── InteractionLayer.tsx       # Hover/click/drag handlers, linking mode, kbd shortcuts
│   │   ├── GroupHullOverlay.tsx       # SVG layer for group hulls
│   │   ├── GroupEdgeOverlay.tsx       # SVG layer for group-involving edges
│   │   └── EdgeBadgeOverlay.tsx       # SVG layer for multi-edge count badges
│   ├── canvas/programs/
│   │   ├── DashedDirectedEdgeProgram.ts  # Custom WebGL edge program (see §11.3)
│   │   ├── IconNodeProgram.ts            # Custom WebGL node program (see §11.4)
│   │   └── shaders/                   # GLSL sources
│   ├── panels/
│   │   ├── ControlsPanel.tsx          # Forces + layout toggle (everyday tuning)
│   │   ├── FiltersPanel.tsx           # Composable filters
│   │   ├── DetailPanel.tsx            # Selection-aware (node | group | edge | empty)
│   │   ├── CreationPanel.tsx          # Create node / edge / group
│   │   ├── AdvancedSettingsPanel.tsx  # Theme, types, all knobs, import/export
│   │   └── shared/
│   │       ├── Slider.tsx
│   │       ├── ColorPicker.tsx
│   │       └── IconPicker.tsx
│   ├── types/
│   │   ├── domain.ts                  # Node, Edge, Group, etc.
│   │   └── settings.ts
│   ├── markdown/
│   │   ├── wikilinkParser.ts
│   │   └── reconciler.ts              # Edge reconciliation from doc content
│   ├── layout/
│   │   ├── forceAtlas2Worker.ts
│   │   └── groupGravity.ts            # Custom force component
│   ├── geometry/
│   │   └── convexHull.ts              # d3-polygon wrapper, smoothed hulls
│   └── theme/
│       └── tokens.ts                  # Color/size/spacing tokens
└── package.json
```

### 4.1 Component composition (host usage)

```tsx
import {
  GraphProvider,
  GraphCanvas,
  ControlsPanel,
  FiltersPanel,
  DetailPanel,
  CreationPanel,
  AdvancedSettingsPanel,
} from "graph-component";

function MyApp() {
  return (
    <GraphProvider data={mySnapshot} onChange={handleChange}>
      <Sidebar>
        <CreationPanel />
        <FiltersPanel />
        <ControlsPanel />
      </Sidebar>

      <Main>
        <GraphCanvas />
      </Main>

      <RightSidebar>
        <DetailPanel />
        <AdvancedSettingsPanel />
      </RightSidebar>
    </GraphProvider>
  );
}
```

Each panel is independently mountable and reads from the shared store. Host owns layout entirely.

---

## 5. State management

### 5.1 Two-layer model

**Layer A — graphology + group-edge store (imperative, outside React's render loop)**: holds the actual graph data. Mutations come through store actions; Sigma re-renders automatically via its event listeners on the graphology instance, and the SVG overlays re-render via Zustand subscriptions.

**Layer B — Zustand store (reactive, drives React panels)**: holds UI state (selection, hover, filters, linking mode), graph-version counter, settings, group-involving-edge slice, and history slice. Panels read narrow slices via selectors.

### 5.2 UI state shape

```ts
type Selection =
  | { kind: "node"; id: string }
  | { kind: "group"; id: string }
  | { kind: "edge"; id: string }
  | null;

type EndpointRef = { kind: "node" | "group"; id: string };

interface Filters {
  // Composable: filter result is the AND across categories,
  // OR within each category.
  groups: {
    active: Set<string>;            // empty = no group filter applied
    mode: "union" | "intersection"; // how to combine multiple selected groups
    // "Solo" is a UI affordance that sets `active = { soloId }` and
    // `mode = "union"`; it is not a separate state mode.
  };
  nodeTypes: Set<string>;           // empty = all node types pass
  includeDocNodes: boolean;         // default true
  edgeTypes: Set<string>;           // empty = all edge types pass
  showWikilinkEdges: boolean;       // default true
  searchQuery: string;              // empty = no search filter
}

interface LinkingMode {
  active: boolean;
  source: EndpointRef | null;       // prefilled when entering mode
  // While active, canvas clicks set the edge target instead of changing selection
  // Esc cancels and exits linking mode
}

interface UIState {
  selection: Selection;
  hovered: { kind: "node" | "group" | "edge"; id: string } | null;
  filters: Filters;
  linkingMode: LinkingMode;
  graphVersion: number;             // see "graphVersion increment timing" below
  settings: GraphSettings;
  multiEdgeExpanded: { a: EndpointRef; b: EndpointRef } | null;
}
```

**graphVersion increment timing**: bumped on any change that affects what the canvas renders. This includes: node/edge/group CRUD, node/edge type CRUD (because type changes affect colors and dashing), group membership changes, position commits, and pin changes. It is **not** bumped for: filter changes, selection/hover changes, settings sliders that don't change geometry/style, or layout-only state (toggle, kicks).

**Filter composition rule**: a node is visible iff it passes all categories. Within "groups", "union" means the node is in any active group; "intersection" means the node is in every active group. Empty filter set in any category = pass-through (no constraint). Search results override visibility for matched nodes (matched nodes always visible + glow).

**Edge visibility**: an edge is visible iff (both endpoints are visible) AND (its type is in `filters.edgeTypes` or that set is empty) AND (`filters.showWikilinkEdges` is true OR `derivedFromWikilink !== true`).

**Group visibility** (for hull rendering): a group's hull renders iff at least one member node is currently visible. This makes filters cascade naturally to hulls.

**Click precedence on canvas**: when `linkingMode.active === true`, canvas clicks set the edge target (and trigger edge creation upon valid second click); selection is *not* updated. When `linkingMode.active === false` (the default), canvas clicks update `state.selection` per §6.1.

**UI-state cascade on deletions** (correctness rule):

When `deleteNode(id)`, `deleteGroup(id)`, or `deleteEdge(id)` runs, the store also clears any UI-state references to the deleted entity:

- If `selection` references the deleted entity → set `selection = null`.
- If `hovered` references the deleted entity → set `hovered = null`.
- If `multiEdgeExpanded` references either endpoint of the deleted entity (or, for `deleteEdge`, the parallel set has dropped below 2) → set `multiEdgeExpanded = null`.
- If `linkingMode.source` references the deleted entity → set `linkingMode.active = false, linkingMode.source = null`.

Without this cleanup, panels reading stale references would crash when trying to look up the missing entity.

### 5.3 Actions

```ts
interface Actions {
  // ---- Node CRUD ----
  addNode(input: NewNodeInput): string;          // returns id
  updateNode(id: string, patch: Partial<Node>): void;
  deleteNode(id: string): void;                  // cascades: edges, group memberships, UI-state refs (§5.2)
  pinNode(id: string, pinned: boolean): void;
  setNodePosition(id: string, x: number, y: number): void;  // for drag commits

  // ---- Edge CRUD (unified — accepts any endpoint kind combination) ----
  addEdge(input: NewEdgeInput): string;
  updateEdge(id: string, patch: Partial<Edge>): void;
  deleteEdge(id: string): void;                  // cascades: UI-state refs (§5.2)

  // ---- Group CRUD ----
  addGroup(input: NewGroupInput): string;
  updateGroup(id: string, patch: Partial<Group>): void;
  deleteGroup(id: string): void;                 // cascades: group-involving edges, UI-state refs (§5.2); nodes remain
  addNodeToGroup(nodeId: string, groupId: string): void;
  removeNodeFromGroup(nodeId: string, groupId: string): void;

  // ---- Type definitions ----
  addNodeType(input: Omit<NodeType, "id">): string;
  updateNodeType(id: string, patch: Partial<NodeType>): void;
  deleteNodeType(id: string): void;              // refuses if any node uses it; UI prompts to reassign

  addEdgeType(input: Omit<EdgeType, "id">): string;
  updateEdgeType(id: string, patch: Partial<EdgeType>): void;
  deleteEdgeType(id: string): void;              // refuses if any edge uses it; UI prompts to reassign

  // ---- Selection / hover ----
  select(target: Selection): void;
  hover(target: UIState["hovered"]): void;

  // ---- Linking mode ----
  enterLinkingMode(source: EndpointRef): void;
  exitLinkingMode(): void;

  // ---- Filters ----
  setGroupFilter(groupIds: Set<string>): void;
  setGroupFilterMode(mode: "union" | "intersection"): void;
  soloGroup(groupId: string): void;              // shortcut: clears + sets {groupId}
  clearGroupFilter(): void;
  setNodeTypeFilter(typeIds: Set<string>): void;
  setEdgeTypeFilter(typeIds: Set<string>): void;
  soloEdgeType(typeId: string): void;            // shortcut for "filter by this type" affordance
  setIncludeDocNodes(include: boolean): void;
  setShowWikilinkEdges(show: boolean): void;
  setSearchQuery(query: string): void;
  clearAllFilters(): void;                       // resets every filter category to its default (empty / true)

  // ---- Layout ----
  setLayoutEnabled(enabled: boolean): void;      // §10
  rerunLayout(): void;                           // kick simulation for layoutSettleDuration
  pinAllPositions(): void;                       // bulk pin

  // ---- Multi-edge expansion ----
  expandMultiEdge(a: EndpointRef, b: EndpointRef): void;
  collapseMultiEdge(): void;

  // ---- Undo / redo ----
  undo(): void;
  redo(): void;
  canUndo(): boolean;
  canRedo(): boolean;

  // ---- Settings ----
  updateSettings(patch: Partial<GraphSettings>): void;
  resetSettings(): void;                         // restores default GraphSettings; does not affect graph data

  // ---- Snapshots ----
  exportSnapshot(): GraphSnapshot;
  importSnapshot(snapshot: GraphSnapshot): void;  // not itself recorded; clears existing history (§5.5)
}
```

### 5.4 Why Zustand and not Context

Context re-renders every consumer when any value changes. With ~10 panels reading different slices and a graph that mutates often, Context becomes a perf trap. Zustand's selector-based subscriptions mean each panel only re-renders when its specific slice changes.

### 5.5 Undo / redo

#### Recording principle

The system records **user intent about specific data**. It does not record **mode-of-operation changes**.

- Adding, editing, or deleting a node, edge, group, or type is intent about specific data → recorded.
- Single-node pinning or position commits express intent about that node → recorded.
- Filter, selection, hover, theme, search query are ways the user is currently *looking at* the data — not changes to the data itself → not recorded.
- Layout toggle, "Re-run layout", "Pin all positions" are mode-of-operation changes affecting the canvas globally → not recorded.
- Importing a snapshot replaces the world entirely → not recorded; the buffer is cleared because there's nothing meaningful to undo to.

This matches the conventions of Figma, VS Code, and Obsidian.

#### What is recorded

- All graph mutations (Node CRUD, Edge CRUD, Group CRUD, type-definition CRUD, group-membership changes, single-node pin, single-node position commit)
- Their cascades (e.g., `deleteNode` records the deletion AND all incident edges removed AND group-membership removals — all reversed atomically on undo)

#### What is NOT recorded

- Selection, hover, filter changes, search query, settings changes, theme — UI state is ephemeral
- Linking mode entry/exit
- Multi-edge expand/collapse
- Layout toggle, re-run layout, `pinAllPositions` (the bulk variant)
- `importSnapshot` itself; instead, importing **clears** the existing history buffer
- `resetSettings` (settings are not part of graph data)
- Wikilink-derived edges created during reconciliation are not separately undoable; they're part of the import operation that produced them

#### Composite (transactional) entries

A single user-initiated operation can produce multiple primitive inverses. The history records these as a **transaction**: one entry containing an ordered list of inverse operations applied atomically on undo (and re-applied atomically on redo).

```ts
type HistoryEntry = {
  label: string;                   // human-readable, e.g. "Drag node Alice", "Delete project Apollo"
  inverses: PrimitiveInverse[];    // applied in reverse order on undo; in order on redo
};
```

Examples:

- **Node drag** = `setNodePosition(id, x_old, y_old)` + (if newly pinned) `pinNode(id, false)`. One entry. Undo restores the original position AND unpins if appropriate.
- **`deleteNode(id)`** = node re-creation + N edge re-creations + M group-membership restorations. One entry. Undo brings everything back exactly as it was.
- **`deleteGroup(id)`** = group re-creation + K group-involving edge re-creations. Member nodes themselves are not affected (the group containment was just metadata on those nodes).
- **`addNodeToGroup` / `removeNodeFromGroup`** = single primitive inverse. One entry.

#### Granularity

- Each top-level user action is one entry.
- A continuous node drag is **coalesced** into a single entry on drop (start position → end position), not 60 mouse-move entries.
- Bulk *graph-mutating* operations (none currently exist in the API, but future bulk imports of nodes etc.) would land as one entry.

#### Buffer

- Ring buffer; size = `settings.undoBufferSize` (range 10–500; default 100; cannot be 0)
- Oldest entry dropped when full
- A new mutation made after one or more undos truncates the redo stack (standard linear history; no branching)
- `importSnapshot` clears both undo and redo stacks

#### Keyboard shortcuts (canvas-only scope)

- `Ctrl/Cmd + Z` → undo
- `Ctrl/Cmd + Shift + Z` and `Ctrl + Y` → redo
- Bound on the **GraphCanvas root element** (which is given `tabIndex={0}` so it can receive focus). Shortcuts fire **only when the canvas itself has focus**.
- Panel inputs (text fields, sliders, etc.) handle these shortcuts in their own context (e.g., undoing typed text in a panel input is the browser's own field-level undo, not graph undo).
- Hosts wanting broader keyboard scope (e.g., "Ctrl+Z works anywhere in my app for graph undo") wire their own bindings to `actions.undo()` / `actions.redo()`. Undo/redo are exposed via the public actions API exactly so this is possible.

---

## 6. Component specifications

### 6.1 GraphCanvas

The Sigma-backed WebGL canvas. Renders nodes, node↔node edges, group hulls (overlay), group-involving edges (overlay), and multi-edge badges (overlay).

**Responsibilities:**
- Render nodes with type-based color and optional icon (via custom node program — §11.4)
- Render node↔node edges with type-based color, direction (arrowheads), and dashed style (per §3.5)
- Render group hulls beneath nodes
- Render group-involving edges via SVG overlay, anchored to hull boundary on the group end
- Hover: focus + neighbors highlight, dim everything else
- Click-to-select (node, group, or edge) — but see "Click precedence" in §5.2 for linking-mode behavior
- Drag a node to reposition (auto-pins on drop, records single drag-coalesced transactional history entry per §5.5)
- Zoom (scroll); pan (drag empty space)
- Multi-edge count badges; click to expand
- Keyboard shortcuts for undo/redo when canvas has focus (§5.5)

**Layered structure** (z-order, bottom to top):
```
<div className="canvas-root" tabIndex={0}>
  <GroupHullOverlay />             {/* SVG: hulls — bottom */}
  <SigmaContainer />               {/* WebGL: nodes + node↔node edges + labels */}
  <GroupEdgeOverlay />             {/* SVG: group-involving edges */}
  <EdgeBadgeOverlay />             {/* SVG: multi-edge count badges — top */}
</div>
```

The `tabIndex={0}` on the canvas root is required for keyboard shortcut focus (§5.5).

All SVG overlays sync to Sigma's camera (zoom + pan) via `sigma.getCamera().on("updated", ...)`.

### 6.2 ControlsPanel

The everyday "force tuning" panel. Exposes the most-used live controls. Heavier configuration lives in AdvancedSettingsPanel (§6.6).

**Contents:**
- **Layout toggle**: ON / OFF (semantics in §10)
- Slider: link distance (20–200)
- Slider: repulsion (50–800)
- Slider: center gravity (0–1)
- Slider: group gravity multiplier (0–2)
- Button: **Re-run layout** (kicks simulation for `layoutSettleDuration` regardless of toggle)
- Button: **Pin all positions** (bulk-sets `pinned: true` on every node — useful before turning toggle off permanently)

### 6.3 CreationPanel

Three sections (or tabs).

1. **Create node**
   - Kind: Normal / Doc (radio)
   - Label: text input
   - If Normal: Node Type (dropdown), Icon (icon picker)
   - If Doc: Content (textarea with markdown preview tab)
   - Group(s): multi-select of existing groups (optional)
   - Button: **Create**

2. **Create edge**
   - Source: searchable picker — accepts both nodes and groups, results show kind badge
   - Target: same as source
   - Edge type: dropdown of EdgeTypes
   - Direction: 4-way toggle (`───`, `───>`, `<───`, `<───>`)
   - Optional label
   - Button: **Create**
   - **Quick mode**: with a node or group selected on the canvas, the "Pick on canvas" button enters linking mode (`enterLinkingMode`) with that selection as source. The cursor changes; subsequent canvas clicks set the target instead of updating selection (per §5.2). Esc cancels.

3. **Create group**
   - Name: text input
   - Color: color picker
   - Initial members: multi-select node picker (optional)
   - Gravity: slider 0–1
   - Button: **Create**

### 6.4 FiltersPanel

All filters are composable (AND across sections, OR within).

**Sections:**

1. **By group**
   - List of groups with checkboxes
   - Mode toggle: **Union** vs **Intersection**
   - Per-group **Solo** button — clears the filter and sets only that group active
   - Clear all groups button

2. **By node type**
   - Checkboxes per NodeType
   - Separate **Show doc nodes** toggle (`includeDocNodes`)

3. **By edge type**
   - Checkboxes per EdgeType
   - Per-edge-type **Solo** button (uses `soloEdgeType` action)
   - Toggle: **Show wikilink-derived edges** (`showWikilinkEdges`)

4. **Search**
   - Text input; fuzzy-matches node labels (and optionally group names)
   - Matches glow on the canvas; non-matches dim

**Footer**: a "Clear all filters" button calling `clearAllFilters()`.

### 6.5 DetailPanel

Reflects whatever's currently in `state.selection`. **One panel, four states** based on `selection`.

**Empty state (`selection === null`):**
- Renders a placeholder: a short instruction line ("Select a node, group, or edge to see details") plus quick stats (total nodes, total edges, total groups). The host may choose to hide the panel entirely when empty by conditionally not mounting DetailPanel; that's host-side. The component itself always renders a meaningful empty state.

**For a selected node:**
- Header: label, kind badge ("normal" / "doc"), node type label or "Doc"
- Color swatch (node type color or doc accent)
- Icon preview
- Memberships: chips listing all groups it belongs to. Click → solo that group's filter
- Metadata table: free-form key/value pairs
- **If doc node**: rendered markdown preview (read-only in v1). Wikilinks are highlighted spans; clicking one navigates `state.selection` to that target (node or group). Image embeds (`![[...]]`) render as literal text in v1 (per §3.10).
- **Unresolved wikilinks** (if any): listed below the preview as plain strings
- **Self-link warnings** (if any): listed if the doc had `[[itself]]` wikilinks that were skipped (per §3.10)
- **Tiebreaking warnings** (if any): listed if a wikilink resolved ambiguously (per §3.10)
- **Neighbors list**: connected entities, grouped by edge type, showing kind:
  ```
  ▾ depends-on (3)
     • [node] Project Apollo  →  click to navigate
     • [node] Database Schema
     • [group] Infrastructure
  ▾ references (1)
     • [node] Wittgenstein
  ▾ general (from wikilink) (2)
     • [node] Apollo
     • [group] Apollo project
  ```
  Each row shows the neighbor's kind ([node]/[group]) and is clickable → updates `state.selection`. Doc-derived neighbors are tagged "(from wikilink)".
- Actions: Edit, Delete, Pin/Unpin, Add to group, Remove from group

**For a selected group:**
- Header: name, color swatch, member count, description
- Member list (clickable)
- Connected entities (groups and nodes), grouped by edge type, with kind badges
- Actions: Edit, Delete, Add members, Remove members

**For a selected edge:**
- Source → Target, both clickable. Each shows kind badge.
- Edge type (clickable → solo this edge type filter via `soloEdgeType`)
- Direction (with the visual glyph)
- Label, if any
- If part of a multi-edge pair: list of all parallel edges between this endpoint pair
- Actions: Edit type, Edit direction, Edit label, Delete

### 6.6 AdvancedSettingsPanel

Tabbed.

**Tab: Display**
- Theme: dark / light / custom
- If custom: color pickers for each ThemeKey (background, edgeDefault, labelColor, hullFill, hullBorder, selectionRing, hoverGlow)
- Label font (CSS font-family string)
- Label density slider, label zoom threshold
- Edge opacity, base node size
- Hull padding, hull opacity, border width

**Tab: Performance**
- Toggle: hide edges during pan/zoom (`hideEdgesOnMove`)
- Toggle: render edge labels
- Slider: layout settle duration (ms) for kicks
- Slider: undo buffer size (range 10–500; cannot be disabled — see §3.9)

**Tab: Node types** (CRUD)
- Table: name, color swatch, default icon, count of nodes using this type
- Add type → modal: name, color, default icon, description
- Click row to edit
- Delete: blocked if any node references it; offers reassignment

**Tab: Edge types** (CRUD)
- Table: name, color swatch, dashed Y/N, count of edges using this type
- Same CRUD pattern as node types
- Note: dashing is overridden by doc-kind participation (§3.5); a per-type `dashed: false` will not affect doc-involving edges

**Tab: Layout**
- Force settings (mirrors ControlsPanel)
- Per-group gravity table — one row per group, edits `group.gravity` directly via `updateGroup`
- Layout algorithm: ForceAtlas2 (only option in v1; placeholder for hierarchical/circular in v2)

**Tab: Import / Export**
- Export snapshot → downloads JSON
- Import snapshot → file picker, validates against schema, replaces current state, clears undo history
- Reset to default settings (calls `resetSettings`; does not affect graph data)

---

## 7. Group rendering

### 7.1 Hull algorithm

For each group:
1. Collect positions of all member nodes from graphology.
2. Compute the convex hull of those positions using `d3-polygon`'s `polygonHull`.
3. Inflate the hull by `groupHullPadding` so it sits visually outside the nodes.
4. Smooth: replace polygon edges with cubic Bezier curves through the hull vertices for an organic blob shape.
5. Render as `<path>` in the SVG overlay with translucent fill (~`groupHullOpacity` alpha) and a stroke (~60% alpha) in the group's color.
6. Render the group name as `<text>` at the hull centroid with a backdrop pill for readability.

**Edge cases:**
- **Single-member groups**: render a small circular halo around the node instead of a hull.
- **Two-member groups**: render a stadium/capsule shape (convex hull of two points is degenerate).
- **Empty groups**: render a small "empty group" pill near world origin; user-actionable.

### 7.2 Overlap

Multi-membership produces overlapping hulls. Translucent fills blend; overlapping regions appear richer. This is the visual signal for multi-membership. To keep readability:

- Hovering a hull brings it to the front, fill rises to ~25% alpha.
- Non-hovered hulls fade to ~8% fill.
- Group labels for non-hovered groups dim.

### 7.3 Group-involving edge anchoring

For an edge with a group endpoint, the SVG line anchors to:
- **At the group end**: the point on the hull boundary closest to the other endpoint's position. As nodes (and thus the hull) move, the edge end glides along the hull boundary — visually clean, no edge-clipping through the hull.
- **At the node end**: the node's position (standard).

For group↔group edges: both ends use boundary projection (each end uses the closest point on its own hull to the other group's centroid).

Updated each frame the camera or member positions change, throttled to ~30fps for the visible viewport.

### 7.4 Group gravity (custom force)

Implemented as a custom force component added to ForceAtlas2's iteration loop. For each member of group G, an attractive force toward the centroid of G's members, scaled by `group.gravity * settings.forces.groupGravity`. Composed with the standard FA2 forces — produces natural settled layouts.

A node in two groups gets pulled toward both centroids; it settles between them, visually justifying the multi-membership.

### 7.5 Recomputation triggers

**Geometry recomputation** is throttled to ~10fps via a dirty-flag + `requestAnimationFrame`. Triggers:
- Member node moved
- Group membership changed
- Padding setting changed

**Style-only updates** (color, opacity, stroke width, theme switch) re-render the SVG paths but don't recompute hull geometry. These are cheap and run on the next frame.

At expected scale (≤ ~200 groups, ≤ ~50 members/group on average), hull computation is cheap. Throttling exists to avoid wasted work during continuous force simulation, not because the math is heavy.

---

## 8. Doc nodes & wikilinks

### 8.1 Initial parse (on snapshot import)

When `importSnapshot` runs:
1. Build a label index over all nodes and all groups.
2. For each doc node, parse `content` for `[[Target]]` and `[[Target|alias]]`.
3. For each wikilink, resolve per §3.10 (matching rules; tiebreaking; node priority over group; self-references skipped; multiple matches surface a warning).
4. Reconcile: ensure each resolved link has a corresponding `derivedFromWikilink: true` edge; sweep and remove stale derived edges.

### 8.2 Visual treatment

- **Doc nodes**: rendered by the custom node program (§11.4) with a small folded-page-corner glyph in the upper-right of the node disc. The glyph is drawn in the same WebGL pass as the node disc using a fragment shader that masks a corner triangle. Color of the glyph is theme-driven.
- **Edges with at least one doc-node endpoint**: dashed (per §3.5).
- **Detail panel neighbors list**: doc-derived neighbors get a "(from wikilink)" tag.

### 8.3 Read-only in v1

Detail panel renders markdown via `react-markdown` plus the wikilink remark plugin, which transforms `[[X]]` into clickable spans. Click navigates `state.selection`. Image embeds are not parsed. No editor in v1.

V2 adds an editor with live reconciliation on doc save.

---

## 9. Edges: rendering, direction, multi-edges

### 9.1 Direction visuals

- `undirected` (`───`): line, no arrowheads
- `directed` (`──>`): arrowhead at target
- `reverse` (`<──`): arrowhead at source (rare; usually authors flip endpoints)
- `bidirectional` (`<──>`): arrowheads at both ends

### 9.2 The dashed + directed combination

Sigma's stock edge programs handle one variant per edge — either dashed or directed (arrows), not both. We need both simultaneously for doc-node directed edges. **Solution**: a custom Sigma edge program (`DashedDirectedEdgeProgram`) that supports:
- Solid or dashed stroke (uniform)
- Arrowhead at source, target, both, or neither (uniform)
- Curved (for parallel edges) or straight (uniform)

This is a real implementation cost — see §11.3.

### 9.3 Multi-edges

When ≥2 edges exist between the same endpoint pair (any endpoint kind):
- Render a single visual edge by default
- Place a circular badge at the visual midpoint with the count: `×3`
- Badge lives in the SVG overlay, fully styleable, clickable
- Click → the parallel edges fan out as curves with their individual properties; detail panel shows them as a list. Click anywhere else (or call `collapseMultiEdge`) to collapse.

For group-involving multi-edges, the same logic applies in the SVG overlay: the count badge appears on the collapsed visual edge; expansion fans curves between hull-anchor points and the other endpoint.

**Auto-collapse on deletion**: if a parallel-edge set drops below 2 because one of its edges was deleted, `multiEdgeExpanded` is cleared automatically (per §5.2 cascade rules).

### 9.4 Edge labels

When `settings.renderEdgeLabels` is true and zoom is sufficient, edge `label` (or edge type name as fallback) renders along the edge. Node↔node edges use Sigma's edge label feature. Group-involving edges get SVG `<text>` along their path.

---

## 10. Layout behavior

### 10.1 Toggle semantics

- **Toggle ON (always-on mode, Obsidian-like)**: the force simulation runs continuously. The graph "breathes." Higher CPU usage; visually alive.
- **Toggle OFF (frozen mode)**: the force simulation is paused. Nodes stay where they are. CPU usage near zero.

In **both** modes:
- A graph mutation (add/delete node, add/delete edge, group membership change) **kicks** the simulation for `layoutSettleDuration` ms (default 4000), then returns to the toggle's steady state.
- The **Re-run layout** button kicks the simulation for `layoutSettleDuration` regardless of toggle state.
- A manual node drag works the same way in both states; on drop, the node is auto-pinned (`pinned: true`) and the drag is recorded as a single transactional history entry (per §5.5: position commit + pin toggle reversed atomically on undo).

### 10.2 Lifecycle

1. **On import**: Toggle defaults to ON. Layout starts running; non-pinned nodes move freely; pinned nodes stay put.
2. **Mode transitions**: switching ON→OFF stops the simulation immediately; OFF→ON starts it from the current configuration.
3. **Pinning**: dragged nodes auto-pin. Pin/unpin via DetailPanel. "Pin all positions" in ControlsPanel bulk-pins (not undoable per §5.5).

### 10.3 Group gravity

Always active when the simulation runs (regardless of toggle). Magnitude controlled by `settings.forces.groupGravity` (multiplier) × `group.gravity` (per-group). When the simulation is paused, group gravity has no effect (no force evaluation happens).

---

## 11. Performance strategy

### 11.1 Strategy table

| Concern | Mitigation |
|---|---|
| Initial render of 100k nodes | Sigma + WebGL handles this natively |
| Layout blocking UI | ForceAtlas2 in Web Worker (graphology's standard worker) |
| Pan/zoom FPS | `hideEdgesOnMove: true` setting drops edges during interaction |
| Label clutter | Label density + zoom threshold; only render labels above N% zoom |
| Hull recomputation overhead | Throttled to ~10fps, only when members move or membership changes |
| React re-renders | Zustand selectors keep panel re-renders surgical |
| Multi-edge visual cost | Lazy: parallel edges only drawn when user expands the badge |
| Filter recomputation | Selectors derive `visibleNodeIds`/`visibleEdgeIds` once per filter change |
| Wikilink reconciliation | Only on import (and on doc save in v2); not at runtime |
| Group-involving edges via SVG | Expected: # of group-involving edges << # of node↔node edges; if not, see §11.2 |
| Undo history memory | Inverse-operation entries (not snapshots); ~100 entries trivial |

For graphs significantly above 100k, future work would add Louvain clustering with cluster-level rendering at low zoom that expands on zoom-in. Out of scope for v1.

### 11.2 Group-involving edges in SVG — when does this break?

The SVG overlay layer for group-involving edges scales linearly with the number of those edges. SVG is comfortable up to ~5k DOM nodes before browser performance suffers. If group-involving edge count exceeds ~3k visible at once, we'd need to migrate that layer to Canvas (or a second Sigma instance). This is unlikely at expected scale but worth flagging as a Phase 7 profiling check.

### 11.3 Implementation risk: custom edge program

The dashed-directed combination requires a custom Sigma edge program written in GLSL + TypeScript. This is the highest-risk piece of the spec.

**Budget**: 3–5 dev days within Phase 3.

**Plan**:
1. Start from `@sigma/edge-arrow`'s source as a base.
2. Add a `dashed` uniform driven by edge attributes.
3. Implement dash pattern via fragment-shader modulo on stroke length.
4. Add `curveOffset` uniform for parallel-edge curving (needed for multi-edge expansion).
5. Test at 100k edge scale on both integrated and discrete GPUs.

**Fallback**: if the custom program proves too expensive, render dashed-directed edges via the SVG overlay (same layer as group-involving edges). This caps practical edge count to the SVG ceiling (~5k visible at once) — a real downgrade. Accept only as a last resort.

### 11.4 Implementation risk: custom node program

Sigma's stock node program renders simple discs with no per-node decoration. We need:
- Icon rendering inside the node (lucide icons for normal nodes)
- Doc-glyph (folded-page corner) for doc nodes
- Selection ring and hover glow as per-node states

**Budget**: 2 dev days within Phase 5 (concurrent with doc node visual work).

**Plan**:
1. Start from Sigma's `NodeCircleProgram` source.
2. Add a `nodeKind` uniform (0 = normal, 1 = doc).
3. For normal nodes: load lucide icons as a texture atlas at component init; sample the atlas in the fragment shader using a per-node `iconIndex` attribute.
4. For doc nodes: fragment-shader corner mask producing the folded-page glyph.
5. Selection ring + hover glow drawn as outer rings via radial distance comparison in the fragment shader.

**Fallback**: render icons and glyphs as overlay SVG elements positioned at node coordinates. At 100k node scale this requires viewport-aware culling — only nodes inside the current camera viewport get SVG decorations. Implementation overhead: ~3 extra days if we hit this fallback. Acceptable downgrade only if the custom program doesn't stabilize.

### 11.5 Build-order note: when do icons appear?

Through Phases 1–4, nodes render as plain colored discs (Sigma's stock node program). Icons and the doc-glyph appear in Phase 5 when `IconNodeProgram` lands. The data model carries `node.icon` and `node.kind === "doc"` from Phase 1; Phases 2–4 simply ignore those fields visually. This is intentional — node visuals are decoupled from data so the project can ship with stock rendering at any phase if a release is needed mid-build.

---

## 12. Implementation phases

Each phase is independently testable.

**Phase 1 — Foundation (1.5 weeks)** *(extended for undo/redo wiring from day one)*
- Project scaffolding, types (full domain model from §3), Zustand store skeleton
- graphology adapter for node↔node edges
- Group-edge store (separate slice in Zustand)
- **History store with command pattern + ring buffer + transactional entry support** — wire from the start so every action lands inverses correctly (~2 days)
- UI-state cascade-on-delete logic (§5.2)
- `graphVersion` increment plumbing (§5.2)
- Snapshot import/export including the unified edge model partitioning
- Sigma container rendering nodes + node↔node edges (no styling yet; stock node program — plain discs)
- Force layout running (no group gravity yet)

**Phase 2 — Core interactivity (1 week)**
- Hover highlight (focus + neighbors)
- Click-to-select with discriminated-union selection state
- Drag-to-pin with drag-coalesced transactional history entry (position + pin in one entry)
- Linking mode infrastructure (the click-precedence rule from §5.2)
- DetailPanel — **node mode only**; edge mode in Phase 3, group mode in Phase 4. Empty state from day one.
- ControlsPanel (forces, toggle, re-run, pin-all)
- Layout toggle semantics (§10) wired up
- Keyboard shortcuts: undo/redo on canvas focus (§5.5), Esc to exit linking mode

**Phase 3 — Edge system (1.5 weeks)** *(extended for custom edge program)*
- Edge types CRUD
- Direction rendering via custom `DashedDirectedEdgeProgram` (§11.3 risk; 3–5 days within this phase)
- Dashed style for doc-involving edges (rule from §3.5)
- Multi-edge collapsing + count badges
- Multi-edge expansion mode (parallel curves)
- DetailPanel: **edge mode added**

**Phase 4 — Groups (2 weeks)** *(extended for unified edges + group-involving edge rendering)*
- Group CRUD
- Hull overlay (smoothed convex hulls) with hover behavior
- Group gravity in the FA2 worker
- Group-involving edge storage + SVG overlay rendering with hull-boundary anchoring
- **FiltersPanel introduced**: group filter only (union/intersection mode + solo). Other filter sections come in Phase 6.
- DetailPanel: **group mode added** (DetailPanel now handles all four states: empty/node/edge/group)
- Snapshot round-trip verified for all four endpoint kind combinations

**Phase 5 — Doc nodes (1.5 weeks)** *(extended for custom node program)*
- Custom `IconNodeProgram` for icons + doc-glyph rendering (§11.4 risk; ~2 days within this phase)
- Doc node kind, doc-glyph rendered in the node program
- Wikilink parser with the matching rules from §3.10 (case-insensitive, whitespace-trimmed, no accent folding, exact, alias-form `[[Target|alias]]`)
- Self-loop skipping for self-referential wikilinks
- Tiebreaking + ambiguity warnings
- Reconciliation on import
- Markdown preview in DetailPanel with clickable wikilinks (image embeds rendered as literal text)
- Neighbors list with kind badges and "(from wikilink)" tags
- *(Side benefit)*: with `IconNodeProgram` shipped, normal-node icons also appear from this phase onward

**Phase 6 — Advanced settings & filter completion (1 week)**
- AdvancedSettingsPanel (all six tabs)
- Node type CRUD with icon picker
- Edge type CRUD
- Theme system using ThemeKey tokens
- Search (with glow + dim)
- **FiltersPanel extended**: node-type filter, edge-type filter, search section, "Clear all filters" footer

**Phase 7 — Performance hardening (0.5 week)**
- Profiling at 100k nodes / 200k edges
- Hull throttle tuning
- Label culling tuning
- `hideEdgesOnMove` behavior verification
- Group-involving edge SVG ceiling check (§11.2)
- Undo buffer memory check
- Custom node program fallback validation (verify SVG-overlay path works for ≤5k visible nodes if needed)

**Total: ~9 weeks for a single developer.** Unchanged from v3; v4 is internal tightening only.

---

## 13. Confirmed scope vs. genuinely open

### 13.1 Confirmed (locked v1 decisions)

These are the locked decisions for v1 — including ones that were earlier framed as "open" (now answered) and ones added during review:

1. **Doc node editor**: read-only preview in v1. V2 adds an editor with live reconciliation.
2. **Unresolved wikilink ghost nodes**: listed in detail panel; no canvas rendering in v1.
3. **Nested groups**: not in v1.
4. **Group-to-anything edges**: first-class via the unified edge model.
5. **Undo/redo**: in v1.
6. **Layout toggle semantics**: §10.1.
7. **Hull style**: smoothed convex hulls.
8. **Doc node visual differentiator**: page-corner glyph rendered by custom node program (§8.2 + §11.4).
9. **Filter composition**: AND across categories, OR within (§5.2).
10. **Selection model**: discriminated union (§5.2).
11. **Doc-edge dashing**: forced; per-type `dashed: false` overridden when a doc node is involved (§3.5).
12. **Wikilink matching**: case-insensitive, whitespace-trimmed, no accent folding, exact label match, alias-form supported (§3.10).
13. **Self-referential wikilinks**: skipped (§3.10).
14. **Wikilink tiebreaking**: lexicographically smallest `id` for case-collision; node beats group; warnings surfaced in detail panel (§3.10).
15. **Image embeds in markdown**: not parsed in v1; render as literal text (§3.10, §8.3).
16. **Undo recording principle**: user intent about specific data is recorded; mode-of-operation changes are not (§5.5).
17. **Composite operations**: drag, deleteNode, deleteGroup are transactional history entries (§5.5).
18. **Undo buffer cannot be disabled**: range 10–500, default 100 (§3.9).
19. **Keyboard shortcuts scope**: canvas-focus only; hosts wire broader scope themselves (§5.5).
20. **UI-state cascade on deletes**: `selection`, `hovered`, `multiEdgeExpanded`, `linkingMode.source` are cleared/updated when their target is deleted (§5.2).
21. **`graphVersion` increment timing**: bumps on anything affecting canvas rendering, including type CRUD; not on filter/UI/settings changes (§5.2).

### 13.2 Genuinely open / deferred

Items where the answer isn't locked, or that are explicitly out of scope:

1. **Layout algorithms beyond FA2**: hierarchical (dagre) and circular layouts deferred to v2.
2. **Collaborative editing**: out of scope. Component takes a snapshot in, emits changes out; the host can layer CRDTs or OT on top.
3. **Mobile / touch**: spec assumes desktop. Pinch-zoom and touch-drag work via Sigma defaults, but panel layouts assume mouse + keyboard.
4. **Group-involving-edge SVG ceiling** (§11.2): if real-world data exceeds ~3k visible group-involving edges at once, migrate that layer to Canvas. Phase 7 profiling check.

---

## 14. JSON dummy data shape

```json
{
  "version": "1.0",
  "nodeTypes": [
    { "id": "person", "name": "Person", "color": "#7fb8d6", "defaultIcon": "user" },
    { "id": "project", "name": "Project", "color": "#e8b65a", "defaultIcon": "folder" },
    { "id": "concept", "name": "Concept", "color": "#b48fc4" }
  ],
  "edgeTypes": [
    { "id": "general", "name": "general", "color": "#888", "dashed": false },
    { "id": "depends-on", "name": "depends on", "color": "#d97a7a" },
    { "id": "references", "name": "references", "color": "#8fb87f" }
  ],
  "nodes": [
    {
      "id": "n1",
      "kind": "normal",
      "label": "Alice",
      "nodeTypeId": "person",
      "icon": "user",
      "groupIds": ["g1"]
    },
    {
      "id": "n2",
      "kind": "normal",
      "label": "Apollo",
      "nodeTypeId": "project",
      "icon": "rocket",
      "groupIds": ["g1", "g2"]
    },
    {
      "id": "n3",
      "kind": "doc",
      "label": "Architecture Notes",
      "content": "The system depends on [[Apollo]] for orchestration. See also [[Apollo project]] for context, and [[Wittgenstein]] for naming rationale.",
      "groupIds": ["g2"]
    }
  ],
  "edges": [
    {
      "id": "e1",
      "source": { "kind": "node", "id": "n1" },
      "target": { "kind": "node", "id": "n2" },
      "edgeTypeId": "depends-on",
      "direction": "directed"
    },
    {
      "id": "e2",
      "source": { "kind": "group", "id": "g1" },
      "target": { "kind": "group", "id": "g2" },
      "edgeTypeId": "references",
      "direction": "bidirectional"
    }
  ],
  "groups": [
    {
      "id": "g1",
      "name": "Team",
      "color": "#e8b65a",
      "memberNodeIds": ["n1", "n2"],
      "gravity": 0.4
    },
    {
      "id": "g2",
      "name": "Apollo project",
      "color": "#7fb8d6",
      "memberNodeIds": ["n2", "n3"],
      "gravity": 0.5
    }
  ],
  "settings": {
    "layoutEnabled": true,
    "layoutSettleDuration": 4000,
    "forces": {
      "linkDistance": 60,
      "repulsion": 200,
      "centerGravity": 0.05,
      "groupGravity": 1.0
    },
    "theme": "dark",
    "labelFont": "Inter, system-ui, sans-serif",
    "labelDensity": 0.5,
    "labelZoomThreshold": 0.6,
    "edgeOpacity": 0.4,
    "nodeBaseSize": 5,
    "groupHullPadding": 24,
    "groupHullOpacity": 0.15,
    "groupBorderWidth": 1.5,
    "hideEdgesOnMove": true,
    "renderEdgeLabels": false,
    "undoBufferSize": 100
  }
}
```

After import, the wikilink parser auto-creates from the doc `n3`:
- `n3 → n2` (`[[Apollo]]` resolves to node Apollo): `derivedFromWikilink: true`, dashed
- `n3 → g2` (`[[Apollo project]]` resolves to group "Apollo project"): `derivedFromWikilink: true`, dashed (per §3.5 rule 1)
- `[[Wittgenstein]]` is unresolved → entry in `n3.metadata.unresolvedLinks`

---

## 15. Summary of v4 changes from v3

For reference (issue numbers refer to the v3 review):

1. **Undo recording principle articulated** (Issue 1, §5.5): added "user intent vs. mode-of-operation" framing as the rationale behind the recording rules.
2. **Composite history entries defined** (Issue 2, §5.5): introduced the `HistoryEntry` shape with an array of `inverses`. Examples worked out for drag, deleteNode, deleteGroup. §10.1 last bullet now references this.
3. **`importSnapshot` recording status** (Issue 3, §5.5 + §5.3): explicitly marked as not-recorded; also clears the buffer.
4. **Keyboard focus model locked** (Issue 4, §5.5 + §6.1): canvas-only scope. `tabIndex={0}` added to canvas root. Hosts wire broader scope themselves via the public actions API.
5. **FiltersPanel build phasing** (Issue 5, §12): Phase 4 introduces the panel with group filter only; Phase 6 extends it with node-type, edge-type, search.
6. **Build-order note for node visuals** (Issue 6, §11.5): nodes render as plain discs through Phases 1–4; icons/glyph appear in Phase 5.
7. **Image embeds clarified** (Issue 7, §3.10 + §8.3): not parsed in v1; render as literal text.
8. **Alias-form resolution** (Issue 8, §3.10): explicitly specified — resolution uses the part before `|`; alias only affects rendered link text.
9. **Custom node program fallback cost** (Issue 9, §11.4): added "~3 extra days for viewport-aware culling" if SVG fallback is needed at 100k scale.
10. **Undo buffer range** (Issue 10, §3.9 + §6.6): explicit range 10–500, cannot be 0/disabled.
11. **§13.1 intro line revised** (Issue 11): no longer claims items were "earlier framed as open"; now reads "locked decisions for v1".
12. **History UI categorization** (Issue 12): non-issue confirmed; `undoBufferSize` lives under Performance tab in UI which is fine.
13. **`clearAllFilters` and `resetSettings` actions added** (Issue 13, §5.3): backs the AdvancedSettingsPanel "Reset to default settings" button and FiltersPanel footer.
14. **Wikilink case-collision tiebreaking** (Issue 14, §3.10): lexicographically smallest `id` wins; warning surfaced.
15. **UI-state cascade on deletions** (Issue 15, §5.2): `selection`, `hovered`, `multiEdgeExpanded`, `linkingMode.source` all clear/update when their target is deleted. The biggest correctness fix in v4.
16. **`graphVersion` increment timing specified** (Issue 16, §5.2): bumps on rendering-affecting changes (including type CRUD); not on filter/UI/settings changes.
17. **DetailPanel mode phasing fixed** (Issue 17, §12): Phase 2 = node mode + empty state, Phase 3 = + edge mode, Phase 4 = + group mode. No more contradiction.
18. **Phase 1 expanded** to include UI-state cascade-on-delete logic and `graphVersion` plumbing as foundational concerns.

No phase budget changes — v4 is tightening only. **Total still: ~9 weeks for a single developer.**

---

Spec is now internally consistent and externally aligned with all stated requirements. Ready to build on green light.