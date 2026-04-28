# `force-graph` v0.2 — Pro-component Plan (Stage 2, Phase 2 of 6)

> **Stage:** 2 of 3 (per-phase plan; one of v0.1–v0.6) · **Status:** **signed off 2026-04-29.** Stage 3 (v0.2 implementation) unlocks once v0.1 implementation lands.
> **Slug:** `force-graph` · **Category:** `data` · **Phase:** **v0.2 — Interaction infrastructure (2 weeks focused)**
> **Last updated:** 2026-04-29 (signed off; Q-P3 revised + Q-P10 wording fixed on re-validation; §16.5 expanded with 6 new refinements covering pinned-state permissions, context memoization, ref delegation, stale-history-on-delta-delete, onSelectionChange initial-fire suppression, and history capture timing)
> **Inputs:**
> - Description signed off ([force-graph-procomp-description.md](force-graph-procomp-description.md), 2026-04-28). All 10 §8 locked decisions are inherited as fixed inputs.
> - **v0.1 plan signed off** ([force-graph-v0.1-plan.md](force-graph-v0.1-plan.md), 2026-04-28). All 11 v0.1 Q-P locks are inherited; v0.2 builds on v0.1's two-layer state, custom edge program, source-adapter contract, and validateSnapshot foundation.
> - System description ([../../systems/graph-system/graph-system-description.md](../../systems/graph-system/graph-system-description.md)) — 37 cross-cutting decisions inherited (decision #11 footnoted per v0.1 plan Q-P3; rest unchanged).
> - Original v4 spec ([../../../graph-visualizer-old.md](../../../graph-visualizer-old.md)) — authoritative for force-graph internals; v0.2 maps to spec Phase 2 (core interactivity, 1w in spec → 2w focused here including the compound API + foundation activation).
> - **No Tier 1 dependencies.** v0.2 composes zero Tier 1 components per [decision #35](../../systems/graph-system/graph-system-description.md); plan can author independently of any Tier 1 plan.
> - **No Phase 0 dependency.** Phase 0 spike is a v0.1 pre-condition; v0.2 doesn't add new WebGL programs.

This doc locks **how** v0.2 is built. Where v0.1 laid the foundation (data model, source adapter, custom WebGL edge program, FA2 worker, theming, store scaffolding), v0.2 **activates** the user-facing interaction layer: selection, hover, drag, undo/redo, linking-mode. v0.2 also introduces the **compound API** (`<ForceGraph.Provider>` + `<ForceGraph.Canvas>`) that v0.1 plan Q-P0 locked, since selection/hover state creates the first real demand for sibling-hook access.

After sign-off, no scaffolding-time second-guessing — implementation follows the plan; deviations are loud and require an explicit STATUS.md note.

---

## 1. Inherited inputs (one paragraph)

`force-graph` v0.2 turns the **read-only viewer** from v0.1 into an **interactive viewer** without yet enabling editing. The user can select (nodes, edges, groups), hover (with focus+neighbors highlight), drag-to-pin (auto-coalesced into a single transactional history entry per [spec §5.5](../../../graph-visualizer-old.md)), enter/exit linking-mode (the canvas-side state for edge creation; entity-picker chrome lives at Tier 3 per [decision #35](../../systems/graph-system/graph-system-description.md)), and undo/redo any user-intent operation (canvas-focus keyboard shortcuts only per [spec §19](../../../graph-visualizer-old.md)). The previously-scaffolded `ui` and `history` Zustand slices ([v0.1 plan §7.5](force-graph-v0.1-plan.md#75-ui-state-cascade-on-delete-foundational-scaffolding)) are now activated; the UI-state cascade-on-delete logic from v0.1 — wired-in but inert — fires for the first time when v0.3 introduces deletion (v0.2 still has no CRUD, so the cascade remains untriggered but its branches are now meaningful). v0.2 also introduces the compound API (`ForceGraph.Provider` + `ForceGraph.Canvas`) per [v0.1 plan Q-P0](force-graph-v0.1-plan.md#17-resolved-plan-stage-questions-locked-on-sign-off-2026-04-28), enabling sibling-hook access (`useGraphSelector` / `useGraphActions` from FilterStack/DetailPanel siblings of the canvas, the pattern shown in [description §6.3](force-graph-procomp-description.md#63-tier-3-graph-system-page-full-panel-composition--the-integration-test)). The single `<ForceGraph>` component from v0.1 continues to work — internally restructured to wrap Provider+Canvas — so v0.1 hosts upgrade to v0.2 with no API breakage.

---

## 2. v0.2 scope summary

What ships:

- **Compound API**: `<ForceGraph.Provider>` (creates per-instance store, supplies React context) + `<ForceGraph.Canvas>` (consumes context, renders WebGL surface). Single `<ForceGraph>` continues to work — internally wraps `<Provider><Canvas /></Provider>`.
- **`useGraphSelector(fn)` and `useGraphActions()`** as public hooks consuming the Provider's context. Throw helpful errors when called outside any Provider.
- **`ui` Zustand slice fully activated**: `selection`, `hovered`, `linkingMode`, `multiEdgeExpanded`, `dragState`.
- **`history` Zustand slice fully activated**: ring buffer of composite transactional entries (10–500 capacity, default 100 per [decision #14 system](../../systems/graph-system/graph-system-description.md) — wait, that's edge labels. Correct ref: [spec §5.5](../../../graph-visualizer-old.md) + [spec §3.9 `undoBufferSize`](../../../graph-visualizer-old.md)). Cannot be 0.
- **Selection model** as discriminated union per [spec §5.2](../../../graph-visualizer-old.md): `{ kind: "node" | "group" | "edge"; id: string } | null`.
- **Hover** state with focus+neighbors highlight: hovered entity + 1-hop neighbors keep full opacity; non-neighbors dim per [spec §6.1](../../../graph-visualizer-old.md).
- **Click-to-select** with [click precedence rule](../../../graph-visualizer-old.md): `linkingMode.active === true` → click sets edge target; otherwise → `state.selection` updates.
- **Single-member group click target is the group**, not the contained node, per [decision #13](../../systems/graph-system/graph-system-description.md).
- **Drag-to-pin** with drag-coalesced transactional history entry: drag start → drag end produces ONE entry containing `setPosition(old → new)` + (if newly pinned) `pinNode(false → true)`. Implemented per [spec §5.5 composite entries](../../../graph-visualizer-old.md).
- **Linking-mode infrastructure**: `enterLinkingMode(source)` / `exitLinkingMode()` actions, cursor change (`crosshair`), source-endpoint visual highlight. The picker chrome (entity-picker for target selection, creation-flow UI) lives at Tier 3 per [decision #35](../../systems/graph-system/graph-system-description.md).
- **Undo/redo** with the recording principle from [spec §5.5](../../../graph-visualizer-old.md): user **intent about specific data** is recorded (graph CRUD, position commits, single-node pin); **mode-of-operation** changes are not (selection, hover, filters, layout toggle, search, theme, settings). v0.2 has no CRUD, so what's recorded is just `setNodePosition` + `pinNode` (from drag-to-pin) and the `pinNode` action when called individually.
- **Keyboard shortcuts** scoped to canvas focus: `Cmd/Ctrl+Z` (undo), `Cmd/Ctrl+Shift+Z` + `Ctrl+Y` (redo), `Esc` (exit linking mode). Hosts wanting broader scope wire their own bindings to `actions.undo()` / `actions.redo()` per [spec §5.5](../../../graph-visualizer-old.md).
- **`useGraphSelector(fn)` hook** ([decision #4](../../systems/graph-system/graph-system-description.md)) becomes the canonical entry point — codifies that selectors reading graphology MUST observe `graphVersion`. v0.1 introduced the hook; v0.2 expands it across all UI slices.
- **`setNodePositions(batch, options?: { silent?: boolean })`** ([decision #7](../../systems/graph-system/graph-system-description.md)) — `silent: true` bypasses undo recording for procedural placement. The signature shipped in v0.1; v0.2 starts honoring `silent` (since undo is now active).
- **UI-state cascade-on-delete** — wired in v0.1 as no-op scaffolding; v0.2 makes it meaningful (selection / hovered / multiEdgeExpanded / linkingMode.source clear when their target is deleted). v0.3 introduces deletion; the cascade is correctly active before the first delete dispatches.
- **Public selectors expanded**: `state.ui.selection`, `state.ui.hovered`, `state.ui.linkingMode`, `state.ui.multiEdgeExpanded`, plus topology selectors from v0.1 (`neighborsOf`, `parallelEdgesBetween`, `visibleNodeIds`, etc.).

What does NOT ship (deferred to later phases):

- Node/edge/group/type CRUD (v0.3)
- Permission resolver full implementation (v0.3)
- Group rendering (v0.4)
- Doc-node visuals + reconciliation (v0.5)
- Filters (v0.4 + v0.6)
- Search (v0.6)
- Multi-edge expansion UI (v0.6)
- Advanced settings panel (v0.6, host-composed)

---

## 3. Final v0.2 API additions (locked)

v0.2 is **purely additive** to v0.1's surface. v0.1 hosts continue to work unchanged. Public types live in `types.ts` and are re-exported from `index.ts`.

### 3.1 Compound API

```ts
import { createContext, type ReactNode } from "react";

// New compound-form components (alongside the existing single ForceGraph from v0.1)
export interface ForceGraphProviderProps extends ForceGraphProps {
  children: ReactNode;
}

export const ForceGraph: ForwardRefExoticComponent<...>;        // v0.1 single component (unchanged signature)
export namespace ForceGraph {
  export const Provider: FC<ForceGraphProviderProps>;            // creates per-instance store + supplies context
  export const Canvas: FC<{ className?: string }>;               // consumes context; renders WebGL surface
}
```

**Restructuring the v0.1 single component (non-breaking):** internally, `<ForceGraph data={...} {...rest}>` renders `<ForceGraph.Provider data={...} {...rest}><ForceGraph.Canvas /></ForceGraph.Provider>`. Hosts using the v0.1 form get the same behavior; the single component is now a thin convenience wrapper. The `ref` forwarded to `<ForceGraph>` is forwarded to `<ForceGraph.Canvas>` underneath.

**`<ForceGraph.Provider>` accepts every prop `<ForceGraph>` accepts** plus `children: ReactNode`. The Provider creates the per-instance store via `useRef` (idempotent under React.StrictMode double-mount per [v0.1 plan §17.5 #2](force-graph-v0.1-plan.md#175-plan-stage-refinements-surfaced-during-re-validation)) and exposes it via React context.

**`<ForceGraph.Canvas>` consumes the context and renders the Sigma container** + SVG overlay scaffolding (still empty in v0.2; hulls land in v0.4). It accepts only `className` (the `data`/`onChange`/`theme`/`resolvePermission` props all live on Provider).

### 3.2 Public hooks

```ts
// Hooks throw a helpful error if called outside any <ForceGraph.Provider> (or its convenience-wrapping <ForceGraph>).
export function useGraphSelector<T>(fn: (state: ForceGraphState) => T): T;
export function useGraphActions(): ActionsV02;
```

`useGraphSelector` internally observes `graphVersion` per [decision #4](../../systems/graph-system/graph-system-description.md); shallow-equality guard prevents redundant re-renders. v0.1 introduced the hook signature; v0.2 expands the `ForceGraphState` shape with the activated `ui` + `history` slices.

### 3.3 v0.2 actions API additions

`ActionsV02` extends `ActionsV01` with:

```ts
export interface ActionsV02 extends ActionsV01 {
  // Selection
  select(target: Selection): void;
  clearSelection(): void;

  // Hover
  hover(target: HoverState | null): void;

  // Linking mode
  enterLinkingMode(source: EndpointRef): void;
  exitLinkingMode(): void;

  // Pin (single-node)
  pinNode(id: string, pinned: boolean): void;        // recorded per spec §5.5

  // Drag (internal — not in public API; the canvas's pointer handler dispatches drag-coalesced entries)

  // Undo / redo
  undo(): void;
  redo(): void;
  canUndo(): boolean;                                 // selector-backed; UI re-renders on flip
  canRedo(): boolean;
}

// Types
export type Selection =
  | { kind: "node"; id: string }
  | { kind: "group"; id: string }
  | { kind: "edge"; id: string }
  | null;

export type HoverState =
  | { kind: "node"; id: string }
  | { kind: "group"; id: string }
  | { kind: "edge"; id: string }
  | null;

export type EndpointRef = { kind: "node" | "group"; id: string };

export interface LinkingMode {
  active: boolean;
  source: EndpointRef | null;
  // While active: canvas clicks set the edge target instead of changing selection.
  // Esc cancels and exits linking mode.
}
```

`canUndo()` and `canRedo()` return booleans but are selector-backed under the hood — calling `useGraphSelector((s) => s.history.canUndo)` is the reactive form for UI buttons; the `actions.canUndo()` plain call is for one-shot reads.

### 3.4 Imperative ref handle additions

```ts
export interface ForceGraphHandleV02 extends ForceGraphHandleV01 {
  // Camera / focus (v0.2: now meaningful with selection)
  focusNode(id: string, options?: { animate?: boolean; zoom?: number }): void;
  focusGroup(id: string, options?: { animate?: boolean; zoom?: number }): void;

  // Selection / hover (also available via actions; here for ref-based hosts)
  select(target: Selection): void;
  getSelection(): Selection;
}
```

`focusNode` / `focusGroup` smoothly animate the camera to center on the target. Useful for deep-link landings (Tier 3 page navigates by URL → handle.focusNode).

### 3.5 Lifecycle callbacks (now meaningful)

The `onSelectionChange` callback that the v0.1 description sketched in `<ForceGraphProps>` is now active:

```ts
interface ForceGraphProps {
  // ... v0.1 props
  onSelectionChange?: (selection: Selection) => void;  // fires whenever ui.selection changes
}
```

v0.1 plan §4.1 listed only `onChange` + `onError`. v0.2 adds `onSelectionChange` to the props (additive; v0.1 hosts unaffected since they didn't pass it).

---

## 4. Architecture changes from v0.1

### 4.1 Provider / Canvas split

v0.1's `<ForceGraph>` was a single component owning everything. v0.2 splits internal responsibilities:

```
<ForceGraph.Provider data={...} onChange={...} theme={...}>
  ├── creates per-instance Zustand store via useRef (idempotent)
  ├── creates per-instance graphology MultiGraph via useRef
  ├── orchestrates source-adapter (loadInitial, subscribe, applyMutation lifecycle)
  ├── runs FA2 worker (start/stop/kick on mutation)
  ├── runs theme resolution + dark/light reactivity
  └── exposes store via React context (ForceGraphContext)
       │
       └── <children />               ← Tier 1 panels can call useGraphSelector / useGraphActions here
            │
            └── <ForceGraph.Canvas />  ← consumes context; renders Sigma + SVG overlay
```

The Provider is the **state root**; Canvas is a **state consumer**. Hooks consume the Provider's context. Sibling components of Canvas (children of Provider) also see the same context. This is what enables the [description §6.3 wiring pattern](force-graph-procomp-description.md#63-tier-3-graph-system-page-full-panel-composition--the-integration-test) where FilterStack / DetailPanel are siblings of `<ForceGraph.Canvas>` inside a Provider.

### 4.2 Per-instance store — context shape

```ts
// lib/store/context.ts
interface ForceGraphContextValue {
  store: ForceGraphStore;           // the Zustand store (with subscribeWithSelector middleware per v0.1 plan §17.5 #1)
  graph: MultiGraph;                // the graphology instance
  sigma: Sigma | null;              // null until Canvas mounts; non-null thereafter
  worker: FA2Worker | null;         // null when layout is OFF
}

const ForceGraphContext = createContext<ForceGraphContextValue | null>(null);
```

Hooks (`useGraphSelector`, `useGraphActions`) call `useContext(ForceGraphContext)`. If the value is `null`, they throw: `"useGraphSelector must be called inside <ForceGraph.Provider> (or <ForceGraph>, which wraps Provider internally)."`.

### 4.3 UI slice activation

v0.1 scaffolded a minimal `ui: { selection: null; hovered: null; /* full shape in v0.2 */ }`. v0.2 fills it out:

```ts
// lib/store/slices/ui-slice.ts
interface UISlice {
  selection: Selection;                          // discriminated union per §3.3 above
  hovered: HoverState;                           // same shape; null when nothing hovered
  linkingMode: LinkingMode;
  multiEdgeExpanded: { a: EndpointRef; b: EndpointRef } | null;  // v0.6 activates the UI; v0.2 has the slot

  dragState: { activeNodeId: string; startX: number; startY: number } | null;  // transient; not part of selectors API
}
```

`dragState` is INTERNAL — not exposed via `useGraphSelector`. Used only by the interaction layer to coalesce drag-end commits.

### 4.4 History slice activation

v0.1 scaffolded a minimal `history: { entries: []; cursor: 0; /* full shape in v0.2 */ }`. v0.2 fills it out:

```ts
// lib/store/slices/history-slice.ts
interface HistoryEntry {
  label: string;                     // human-readable: "Drag node Alice", "Pin node Bob"
  inverses: PrimitiveInverse[];      // applied in reverse order on undo; in order on redo
}

type PrimitiveInverse =
  | { type: "setNodePosition"; id: string; x: number; y: number }
  | { type: "pinNode"; id: string; pinned: boolean }
  // v0.3 adds: addNode / updateNode / deleteNode / addEdge / updateEdge / deleteEdge / addGroup / updateGroup / deleteGroup / addNodeToGroup / removeNodeFromGroup / addNodeType / updateNodeType / deleteNodeType / addEdgeType / updateEdgeType / deleteEdgeType
  ;

interface HistorySlice {
  entries: HistoryEntry[];           // ring buffer
  cursor: number;                    // index of next-to-undo (i.e., entries.length when nothing undone)
  capacity: number;                  // settings.undoBufferSize (10–500, default 100)

  // Derived (memoized; consumers read via useGraphSelector)
  canUndo: boolean;                  // cursor > 0
  canRedo: boolean;                  // cursor < entries.length

  // Actions (internal; exposed via ActionsV02)
  push(entry: HistoryEntry): void;   // pushes; truncates redo stack; ring-buffer trim if at capacity
  undo(): void;                      // applies entries[cursor - 1].inverses in reverse order
  redo(): void;                      // applies entries[cursor].inverses in order
  clear(): void;                     // called on importSnapshot
}
```

**Truncation on new mutation after undo** (standard linear history; no branching): when `push` is called with `cursor < entries.length`, the entries from `cursor` onward are dropped before the new entry is appended.

**Ring-buffer trim**: if `entries.length === capacity` at push time, the OLDEST entry is dropped (entries[0] removed; cursor decremented).

### 4.5 UI-state cascade activation

[v0.1 plan §7.5](force-graph-v0.1-plan.md#75-ui-state-cascade-on-delete-foundational-scaffolding) wired the cascade as no-op scaffolding. v0.2 makes the branches meaningful:

```ts
// lib/store/cascade.ts (v0.2 form — v0.1 scaffolded structure)
function cascadeOnDelete(store: ForceGraphStore, target: EndpointRef | { kind: "edge"; id: string }): void {
  const { ui } = store.getState();

  // Selection
  if (ui.selection?.kind === target.kind && ui.selection.id === target.id) {
    store.setState({ ui: { ...ui, selection: null } });
  }

  // Hovered
  if (ui.hovered?.kind === target.kind && ui.hovered.id === target.id) {
    store.setState({ ui: { ...ui, hovered: null } });
  }

  // Linking mode source
  if (ui.linkingMode.active && ui.linkingMode.source?.kind === target.kind && ui.linkingMode.source.id === target.id) {
    store.setState({ ui: { ...ui, linkingMode: { active: false, source: null } } });
  }

  // Multi-edge expansion (v0.6 fully activates this; v0.2 just clears if either endpoint is the target)
  if (ui.multiEdgeExpanded) {
    const { a, b } = ui.multiEdgeExpanded;
    if (
      (a.kind === target.kind && a.id === target.id) ||
      (b.kind === target.kind && b.id === target.id)
    ) {
      store.setState({ ui: { ...ui, multiEdgeExpanded: null } });
    }
  }
}
```

**v0.2 itself dispatches no deletes** (CRUD is v0.3). But the cascade is now meaningful for `force-graph` when v0.3 lands — wiring is no longer pure scaffolding.

### 4.6 Interaction layer

v0.1 had `parts/sigma-container.tsx` with no event handlers (read-only). v0.2 introduces a dedicated interaction layer:

```ts
// parts/interaction-layer.tsx
function InteractionLayer({ store, sigma, graph }: { store: ForceGraphStore; sigma: Sigma; graph: MultiGraph }) {
  // Mounts Sigma event listeners (clickNode / clickEdge / clickStage / enterNode / leaveNode / etc.).
  // Translates Sigma events → store actions per §5–§8 below.
  // Manages drag-coalesced history entries.
  // Manages keyboard shortcuts (canvas-focus only).
  // Handles linking-mode click precedence rule.
  // Returns null (event-only; no DOM).
}
```

`<ForceGraph.Canvas>` mounts `<InteractionLayer>` once Sigma is ready.

---

## 5. Selection model + click-to-select

### 5.1 Discriminated-union selection

Lock per [spec §5.2](../../../graph-visualizer-old.md):

```ts
type Selection =
  | { kind: "node"; id: string }
  | { kind: "group"; id: string }
  | { kind: "edge"; id: string }
  | null;
```

**Why discriminated union, not flat `{ id, type }`:** the union form prevents `kind: "node"; id: groupId` typos at the type level. Hosts pattern-match via `selection?.kind === "node"`.

### 5.2 Click-to-select

Sigma's `clickNode` / `clickEdge` / `clickStage` events translate to store actions:

```ts
sigma.on("clickNode", ({ node }) => {
  if (store.getState().ui.linkingMode.active) {
    // Linking mode: click sets edge target (v0.3 will dispatch addEdge here; v0.2 just exits linking mode)
    store.getState().actions.exitLinkingMode();
    // v0.3 expands this to dispatch the edge creation
    return;
  }
  store.getState().actions.select({ kind: "node", id: node });
});

sigma.on("clickEdge", ({ edge }) => {
  if (store.getState().ui.linkingMode.active) return;  // edges aren't valid linking targets
  store.getState().actions.select({ kind: "edge", id: edge });
});

sigma.on("clickStage", () => {
  if (store.getState().ui.linkingMode.active) {
    store.getState().actions.exitLinkingMode();
    return;
  }
  store.getState().actions.clearSelection();
});
```

**Single-member group click target** ([decision #13](../../systems/graph-system/graph-system-description.md)) — when groups land in v0.4, the SVG hull overlay's hit-test will take priority over the contained node. v0.2 has no groups yet, so this is documented but not implemented.

### 5.3 Selection causes no `graphVersion` bump

Per [spec §5.2](../../../graph-visualizer-old.md): selection changes do NOT bump `graphVersion`. Only `ui.selection` slice changes; `useGraphSelector((s) => s.ui.selection)` re-fires; selectors observing `graphVersion` do NOT re-fire (correct; selection doesn't change render).

### 5.4 `onSelectionChange` callback

Fires on every `ui.selection` change. Implementation: subscribe to the `ui.selection` slice via Zustand's `subscribe(selector, callback)` middleware; call the host's `onSelectionChange` prop.

---

## 6. Hover + focus-and-neighbors highlight

### 6.1 Hover state

```ts
// Sigma events
sigma.on("enterNode", ({ node }) => store.getState().actions.hover({ kind: "node", id: node }));
sigma.on("leaveNode", () => store.getState().actions.hover(null));
sigma.on("enterEdge", ({ edge }) => store.getState().actions.hover({ kind: "edge", id: edge }));
sigma.on("leaveEdge", () => store.getState().actions.hover(null));
```

### 6.2 Focus-and-neighbors highlight

When `ui.hovered` is non-null:
- The hovered entity + 1-hop neighbors render at full opacity.
- All other entities dim to ~30% opacity.
- Edges connecting hovered to non-hovered: render dimmed.
- Edges between non-hovered entities: render dimmed.

**Implementation** via Sigma's reducer pattern (`nodeReducer` / `edgeReducer`):

```ts
sigma.setSetting("nodeReducer", (nodeKey, attrs) => {
  const ui = store.getState().ui;
  if (!ui.hovered) return attrs;
  if (ui.hovered.kind === "node" && ui.hovered.id === nodeKey) return attrs;     // hovered itself
  if (ui.hovered.kind === "node" && graph.areNeighbors(ui.hovered.id, nodeKey)) return attrs;  // 1-hop neighbor
  // Otherwise: dim
  return { ...attrs, color: dimColor(attrs.color), label: null };               // hide label too at low opacity
});
```

**N-hop neighbors deferred** to v0.6 if real consumers need it; v0.2 ships 1-hop only.

### 6.3 Hover delay

To prevent flicker on rapid mouse traversal, hover state has a small lead-in delay (~100ms): the `hover(target)` action debounces by 100ms; `hover(null)` is immediate. Plan-stage detail (Q-P below).

---

## 7. Drag-to-pin + drag-coalesced history

### 7.1 Drag interaction

Sigma's `downNode` / pointer-move / pointer-up events drive drag:

```ts
sigma.on("downNode", ({ node, event }) => {
  store.getState().actions._setDragState({
    activeNodeId: node,
    startX: graph.getNodeAttribute(node, "x"),
    startY: graph.getNodeAttribute(node, "y"),
  });
  // Suppress FA2 layout for the dragged node during drag (graphology supports `fixed: true` per node)
  graph.setNodeAttribute(node, "fixed", true);
});

window.addEventListener("pointermove", (e) => {
  const ui = store.getState().ui;
  if (!ui.dragState) return;
  // Update node position in graphology (no graphVersion bump during drag — bumped on commit only)
  const viewportXY = sigma.viewportToGraph({ x: e.clientX, y: e.clientY });
  graph.setNodeAttribute(ui.dragState.activeNodeId, "x", viewportXY.x);
  graph.setNodeAttribute(ui.dragState.activeNodeId, "y", viewportXY.y);
  // Sigma re-renders via its own graphology subscription; no React re-render
});

window.addEventListener("pointerup", () => {
  const ui = store.getState().ui;
  if (!ui.dragState) return;
  const { activeNodeId, startX, startY } = ui.dragState;
  const endX = graph.getNodeAttribute(activeNodeId, "x");
  const endY = graph.getNodeAttribute(activeNodeId, "y");
  const wasPinned = graph.getNodeAttribute(activeNodeId, "pinned") === true;

  // Auto-pin on drop
  graph.setNodeAttribute(activeNodeId, "pinned", true);

  // Push drag-coalesced history entry
  const inverses: PrimitiveInverse[] = [
    { type: "setNodePosition", id: activeNodeId, x: startX, y: startY },
  ];
  if (!wasPinned) inverses.push({ type: "pinNode", id: activeNodeId, pinned: false });

  store.getState().history.push({
    label: `Drag node ${graph.getNodeAttribute(activeNodeId, "label") ?? activeNodeId}`,
    inverses,
  });

  // Bump graphVersion ONCE for the entire drag (position + maybe pin)
  store.getState().bumpGraphVersion();
  store.getState().actions._setDragState(null);
});
```

### 7.2 Drag-coalesced entry shape

**Single history entry per drag** — start position → end position → maybe-pin all reversed atomically on undo. **Not 60 entries per drag** (that would be one per `pointermove`).

```ts
// On undo:
//   1. Apply pinNode(false) — un-pin if newly pinned
//   2. Apply setNodePosition(startX, startY) — restore position
// On redo: apply forward order (re-apply current end position + re-pin)
```

### 7.3 No `setPosition` action recording for drag

The drag flow uses graphology mutations directly (`graph.setNodeAttribute`); the `setNodePositions(batch)` action is NOT used (that action is for procedural placement). Drag entries push directly into `history.push` with the right inverses. This keeps the action / history surfaces decoupled.

---

## 8. Linking-mode infrastructure

### 8.1 Enter / exit

```ts
actions.enterLinkingMode(source: EndpointRef): void;
actions.exitLinkingMode(): void;
```

Effect on state:
```ts
{ active: true | false, source: EndpointRef | null }
```

### 8.2 UI cursor change

When `linkingMode.active === true`:
- Canvas root gets `cursor: crosshair` (CSS).
- Source endpoint highlights with a "selected as source" ring (visual cue; reuses the selection-ring rendering from `DashedDirectedEdgeProgram` — actually that's edges; nodes use Sigma's stock circle with an additional outer ring rendered by a small SVG overlay).

**Scope refinement:** v0.1 ships plain disc nodes (no custom node program). The source-endpoint highlight in v0.2 uses an SVG overlay ring drawn at the source node's screen position, sized to the node's display size. This overlay layer is separate from the v0.4 hull SVG layer.

### 8.3 Click precedence

Per [spec §5.2](../../../graph-visualizer-old.md): when `linkingMode.active === true`, canvas clicks set the edge target instead of changing selection. Implementation in §5.2 above (`clickNode` handler).

### 8.4 Esc cancels

Keyboard handler in §10 below.

### 8.5 Tier 1 panel composition

The picker chrome (entity-picker showing valid edge targets, edge-type dropdown, direction toggle) lives at Tier 3 per [decision #35](../../systems/graph-system/graph-system-description.md). v0.2 only owns the canvas-side state (`linkingMode.active`, `linkingMode.source`) and the click-precedence handler.

Tier 3 page wires this:
```tsx
function CreationPanel() {
  const linkingMode = useGraphSelector((s) => s.ui.linkingMode);
  const actions = useGraphActions();

  return linkingMode.active ? (
    <div className="p-4 border-l border-border">
      <h3>Creating edge from: {linkingMode.source?.id}</h3>
      <p>Click a node or group on the canvas to set the target.</p>
      <Button variant="ghost" onClick={actions.exitLinkingMode}>Cancel (Esc)</Button>
    </div>
  ) : (
    <Button onClick={() => actions.enterLinkingMode(currentSelectionAsEndpoint())}>
      Connect from selection
    </Button>
  );
}
```

---

## 9. Undo / redo

### 9.1 Recording principle

Per [spec §5.5](../../../graph-visualizer-old.md): user **intent about specific data** is recorded; **mode-of-operation** changes are not. Lock for v0.2:

| Action | Recorded? |
|---|---|
| Drag-to-pin (drag-coalesced) | ✓ One entry: `setNodePosition + pinNode (if newly pinned)` |
| `pinNode(id, pinned)` (from DetailPanel pin/unpin in v0.3 — but the action exists in v0.2) | ✓ One entry: `pinNode(opposite)` |
| `setNodePositions(batch, { silent: true })` | ✗ silent bypasses recording per [decision #7](../../systems/graph-system/graph-system-description.md) |
| `setNodePositions(batch)` (silent omitted/false) | ✓ One entry: batch of `setNodePosition` inverses |
| `select(target)` / `clearSelection()` | ✗ Selection is not data |
| `hover(target)` | ✗ Hover is not data |
| `enterLinkingMode` / `exitLinkingMode` | ✗ Mode of operation |
| `setLayoutEnabled` / `rerunLayout` | ✗ Mode of operation (from v0.1) |
| `pinAllPositions` (bulk) | ✗ Mode of operation per [v0.1 plan Q-P6](force-graph-v0.1-plan.md) |
| `importSnapshot` | ✗ Clears history (replaces world) |
| Source-adapter delta (from `subscribe`) | ✗ Per [decision #22](../../systems/graph-system/graph-system-description.md) — deltas don't enter undo stack |
| `applyMutation` result reconciliation | ✗ Same as above |

v0.3 expands with full CRUD (every node/edge/group/type mutation = recorded entry, with composite cascade entries for deletes).

### 9.2 Composite entry execution

```ts
function undo(store: ForceGraphStore): void {
  const { history } = store.getState();
  if (history.cursor === 0) return;
  const entry = history.entries[history.cursor - 1];

  // Apply inverses in REVERSE order
  for (let i = entry.inverses.length - 1; i >= 0; i--) {
    applyPrimitiveInverse(entry.inverses[i]);
  }

  store.setState({ history: { ...history, cursor: history.cursor - 1 } });
  store.bumpGraphVersion();
}

function redo(store: ForceGraphStore): void {
  const { history } = store.getState();
  if (history.cursor === history.entries.length) return;
  const entry = history.entries[history.cursor];

  // Apply inverses in FORWARD order... but wait: redo should re-apply the FORWARD operation, not the inverse of the inverse.
  // The history entry stores INVERSES (operations to undo). For redo, we need the FORWARD operations.
  // Solution: store BOTH forward and inverse in each entry, OR derive forward from current state at undo time.
  // Plan-stage detail (Q-P below).
  ...
}
```

This is a real plan-stage detail — see Q-P9 below.

### 9.3 Buffer + truncation

Ring buffer with `capacity = settings.undoBufferSize` (10–500, default 100). New entry while `cursor < entries.length` truncates the redo stack (entries from `cursor` onward dropped). Oldest entry dropped when at capacity.

### 9.4 `importSnapshot` clears history

Per [spec §5.5](../../../graph-visualizer-old.md): importing a snapshot replaces the world; both undo and redo stacks are cleared. v0.1 already handles this (importSnapshot bumps graphVersion); v0.2 adds explicit `history.clear()` to the import flow.

---

## 10. Keyboard shortcuts

Per [spec §5.5](../../../graph-visualizer-old.md): canvas-focus only; canvas root has `tabIndex={0}` (set in v0.1). Implementation via native `addEventListener` on the canvas root (NOT React's synthetic events; native is more reliable for global-feel shortcuts).

```ts
// hooks/use-keyboard-shortcuts.ts
function useKeyboardShortcuts(canvasRoot: HTMLDivElement, store: ForceGraphStore): void {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Only fire when canvas root has focus (or contains the focused element)
      if (!canvasRoot.contains(document.activeElement)) return;

      const { actions } = store.getState();
      const meta = e.metaKey || e.ctrlKey;

      if (e.key === "z" && meta && !e.shiftKey) {
        e.preventDefault();
        actions.undo();
      } else if ((e.key === "z" && meta && e.shiftKey) || (e.key === "y" && meta)) {
        e.preventDefault();
        actions.redo();
      } else if (e.key === "Escape") {
        if (store.getState().ui.linkingMode.active) {
          e.preventDefault();
          actions.exitLinkingMode();
        }
      }
    };

    canvasRoot.addEventListener("keydown", handler);
    return () => canvasRoot.removeEventListener("keydown", handler);
  }, [canvasRoot, store]);
}
```

**Hosts wanting broader scope** (e.g., "Cmd+Z works anywhere in my app for graph undo") wire their own document-level listeners that call `actions.undo()` / `actions.redo()`. Public API is exactly that — exposed via `useGraphActions()`.

**Panel inputs**: text fields, sliders, etc. handle their own undo (browser field-level undo). Canvas-focus scope ensures we don't fight panel inputs.

---

## 11. File-by-file plan (additions to v0.1)

v0.2 adds files; modifies a few v0.1 files. **No v0.1 files are deleted or restructured beyond addition.**

```
src/registry/components/data/force-graph/
├── force-graph.tsx                            # MODIFIED — single component now wraps Provider+Canvas
├── types.ts                                   # MODIFIED — add Selection, HoverState, LinkingMode, HistoryEntry types + ActionsV02
├── dummy-data.ts                              # MODIFIED — add v0.2 demo fixture (small graph for selection/hover demo)
├── demo.tsx                                   # MODIFIED — add v0.2 phase tab (selection + hover + drag-to-pin)
├── usage.tsx                                  # MODIFIED — document compound API and v0.2 hooks
├── meta.ts                                    # MODIFIED — bump version to 0.2.0; status remains alpha
├── index.ts                                   # MODIFIED — export ForceGraph.Provider, ForceGraph.Canvas, useGraphSelector, useGraphActions
│
├── parts/
│   ├── sigma-container.tsx                    # MODIFIED — extracted into Canvas; previously the whole canvas surface
│   ├── canvas.tsx                             # NEW — <ForceGraph.Canvas>; mounts InteractionLayer once Sigma is ready
│   ├── provider.tsx                           # NEW — <ForceGraph.Provider>; creates store + graph + worker; supplies context
│   ├── interaction-layer.tsx                  # NEW — Sigma event handlers (click/hover/drag); keyboard shortcuts; linking-mode click precedence
│   ├── linking-source-overlay.tsx             # NEW — small SVG ring around source endpoint when linking-mode active
│   └── programs/                              # unchanged from v0.1 (DashedDirectedEdgeProgram + shaders)
│
├── hooks/
│   ├── use-graph-store.ts                     # MODIFIED — store creator; subscribeWithSelector middleware; expose context provider
│   ├── use-graph-selector.ts                  # MODIFIED — reads from context (was direct store ref in v0.1); throws on no-context
│   ├── use-graph-actions.ts                   # MODIFIED — returns ActionsV02; throws on no-context
│   ├── use-graphology-adapter.ts              # MODIFIED — bumpGraphVersion on mutations now also fires cascade if delete
│   ├── use-fa2-worker.ts                      # MODIFIED — pause worker for active-drag node (graph.fixed = true)
│   ├── use-source-adapter.ts                  # MODIFIED — delta dispatch now runs cascade (selection / hover / linkingMode clears if target deleted)
│   ├── use-theme-resolution.ts                # unchanged from v0.1
│   ├── use-keyboard-shortcuts.ts              # NEW — Cmd+Z / Cmd+Shift+Z / Esc on canvas root
│   ├── use-drag-handler.ts                    # NEW — drag start / pointermove / pointerup; coalesces into single history entry
│   └── use-hover-debounce.ts                  # NEW — 100ms lead-in delay on hover-target acquisition
│
└── lib/
    ├── validate-snapshot.ts                   # unchanged from v0.1
    ├── store/
    │   ├── store-creator.ts                   # MODIFIED — accepts initial data; creates per-instance store
    │   ├── slices/
    │   │   ├── group-edges-slice.ts           # unchanged from v0.1
    │   │   ├── ui-slice.ts                    # MODIFIED — full activation (selection, hovered, linkingMode, multiEdgeExpanded, dragState)
    │   │   ├── history-slice.ts               # MODIFIED — full activation (ring buffer, push/undo/redo/clear)
    │   │   └── settings-slice.ts              # unchanged from v0.1
    │   ├── derived/
    │   │   ├── visible-ids.ts                 # unchanged from v0.1 (returns "all"; filters land v0.4)
    │   │   └── topology.ts                    # unchanged from v0.1
    │   ├── cascade.ts                         # MODIFIED — branches activated (no longer no-op scaffolding)
    │   └── apply-delta.ts                     # MODIFIED — runs cascade on delete deltas
    ├── history/                               # NEW SUBFOLDER
    │   ├── inverses.ts                        # NEW — pure functions: applyPrimitiveInverse(state, inverse)
    │   ├── composite.ts                       # NEW — entry construction helpers (drag-coalesce, deleteCascade for v0.3)
    │   └── recording-rules.ts                 # NEW — recorded vs not-recorded action table; helper predicates
    ├── permissions/
    │   └── resolver.ts                        # unchanged from v0.1 (full implementation lands v0.3)
    ├── theme.ts                               # unchanged from v0.1
    ├── source-adapter/
    │   ├── snapshot-mode.ts                   # unchanged from v0.1
    │   ├── live-mode.ts                       # MODIFIED — delta application now runs cascade for delete deltas
    │   └── source-types.ts                    # unchanged from v0.1
    └── context.ts                             # NEW — ForceGraphContext + ForceGraphContextValue
```

**v0.2 files added:** ~12 new files. **v0.2 files modified:** ~16 v0.1 files. **No deletions.**

### 11.1 Build order within v0.2

1. `lib/context.ts` + `parts/provider.tsx` (Provider creation; per-instance store; context wiring) — 1 day
2. `parts/canvas.tsx` (Canvas as Sigma host; consumes context) — 0.5 day
3. `force-graph.tsx` restructured (single component wraps Provider+Canvas internally; v0.1 backward compat preserved) — 0.5 day
4. `lib/store/slices/ui-slice.ts` (full activation: selection, hovered, linkingMode, multiEdgeExpanded, dragState) — 1 day
5. `hooks/use-graph-selector.ts` + `hooks/use-graph-actions.ts` (context-aware versions; throw if no context) — 0.5 day
6. `lib/store/slices/history-slice.ts` (ring buffer, push/undo/redo/clear, capacity from settings) — 1 day
7. `lib/history/inverses.ts` + `lib/history/composite.ts` + `lib/history/recording-rules.ts` (pure-function support modules) — 1 day
8. `parts/interaction-layer.tsx` (Sigma event handlers → store actions; click precedence; cursor change) — 1.5 days
9. `hooks/use-drag-handler.ts` (drag-coalesced history entry construction) — 0.5 day
10. `parts/linking-source-overlay.tsx` (SVG ring around source endpoint) — 0.5 day
11. `hooks/use-keyboard-shortcuts.ts` (Cmd+Z / Cmd+Shift+Z / Esc) — 0.5 day
12. `hooks/use-hover-debounce.ts` (100ms hover lead-in) — 0.5 day
13. `lib/store/cascade.ts` (activation; branches per §4.5) — 0.5 day
14. `dummy-data.ts` + `demo.tsx` + `usage.tsx` + `meta.ts` updates — 1 day

**Total:** ~10.5 dev-days = 2.1 weeks. On track for the 2-week budget.

---

## 12. Edge cases (v0.2-specific; v0.1 edge cases inherited)

| # | Edge case | Resolution |
|---|---|---|
| 1 | Pointer leaves the window mid-drag | `pointerup` listener is on `window`, not canvas root. Drag commits even if cursor exits. Plan-stage tightening verifies. |
| 2 | Drag interrupted by component unmount | Cleanup in `useEffect` cancels listeners; `dragState` is in store and discarded when Provider unmounts. No half-committed entry. |
| 3 | Undo while drag in progress | Refused — `dragState !== null` short-circuits `undo()` with a dev warning. Plan-stage tightening locks this. |
| 4 | Click on a node that's currently being dragged (rare; programmatic) | Selection update suppressed; drag handler owns the pointer. |
| 5 | Multiple `<ForceGraph.Provider>` instances on the same page | Each gets its own store + context. Hooks called inside Provider A see Provider A's state. Provider B is independent. Verified via per-instance `useRef`. |
| 6 | `<ForceGraph.Canvas>` rendered without a Provider | Throws on mount: `"<ForceGraph.Canvas> must be a child of <ForceGraph.Provider> (or <ForceGraph>, which wraps Provider internally)."`. |
| 7 | `useGraphSelector` called outside any Provider | Throws helpful error message (see §3.2). |
| 8 | Linking-mode + node deletion (v0.3) where source is the deleted node | Cascade clears `linkingMode.source` + sets `active: false`. The CreationPanel UI re-renders to its idle state. Wired in v0.2 (cascade activation); v0.3 dispatches the delete that triggers it. |
| 9 | Hover on a node with no neighbors | Only the node itself stays full-opacity; everything else dims. |
| 10 | Hover transition between adjacent nodes | Hover state changes; reducer re-fires; dim updates. 100ms hover lead-in delay (§6.3) prevents flicker on rapid mouse movement. |
| 11 | Undo when nothing to undo | `actions.undo()` is a no-op; `actions.canUndo()` returns false. |
| 12 | Capacity bumped via `updateSettings({ undoBufferSize: 50 })` while history has 80 entries | Trim oldest 30 entries; cursor adjusts. Ring buffer integrity preserved. |
| 13 | Drag on a pinned node | Allowed; drag commits new position; `pinNode(true)` is no-op since already pinned (no inverse pushed for pin-toggle). |
| 14 | Sigma `clickStage` while linking-mode active (clicked empty space) | Cancels linking mode (per the §5.2 implementation). |
| 15 | Provider re-renders with new `data` prop | New snapshot imported; history cleared (per [spec §5.5](../../../graph-visualizer-old.md)); selection cascaded if no longer present in new data. |

---

## 13. Accessibility

Inherits v0.1 a11y baseline (`role="application"`, `tabIndex={0}`, `aria-label`). v0.2 adds:

- **Selection announced**: `aria-live="polite"` region (sibling of canvas, in Provider tree) announces selection changes ("Selected: node Alice"). Per [spec §6.1](../../../graph-visualizer-old.md).
- **Linking-mode announced**: `aria-live="polite"` announces "Linking mode active. Click a node or group to set edge target. Press Escape to cancel."
- **Hover does NOT announce** — too noisy for screen readers. Hover state is purely visual; selection is the keyboard-accessible affordance.
- **Keyboard navigation between nodes** is NOT in v0.2 — there's no canvas-internal focus model beyond `tabIndex={0}` on the root. v0.6 may add arrow-key navigation if accessibility audit demands it.
- **Reduced-motion** respected: hover transition + camera-focus animations honor `prefers-reduced-motion: reduce` (instant transitions instead of animated).

---

## 14. Performance

| Concern | v0.2 strategy |
|---|---|
| Re-renders during drag | Drag updates graphology directly (Sigma re-renders via its own subscription); Zustand `dragState` slice changes once on `down` and once on `up` only — not per-frame. React panels reading `ui.dragState` would re-render on those two events; no panels currently read it. |
| Hover reducer fires on every mouse move | Sigma's reducer runs on every render frame; cheap (one closure call per node). Plan-stage tightening: profile at 100k node scale; if > 10ms per frame, switch to a pre-computed neighbor-set Map. |
| `canUndo` / `canRedo` reactivity | Selector-backed via `useGraphSelector`; only UI components reading them re-render on flip. |
| History memory | Inverse-operation entries (not snapshots); ~50 bytes per entry × 100 default capacity = ~5KB. Trivial. |
| `subscribeWithSelector` overhead | Subscriptions are per-slice; only relevant subscribers fire on slice change. Standard Zustand performance. |
| Multi-Provider page | Each Provider has its own store + context. No cross-talk. Memory cost is multiplicative; rare in practice (Tier 3 page has one ForceGraph). |
| Keyboard handler scope | Native listener on canvas root; doesn't fight React event delegation; doesn't fire when panel inputs have focus (since canvas root doesn't contain them). |

**Bundle weight delta from v0.1:** v0.2 adds ~12 files of pure JS/TSX (~5KB minified). Total v0.2 component bundle: ~225KB (v0.1 ~218KB + ~7KB for compound API + interaction + history). Well under the 300KB ceiling per [description Q10](force-graph-procomp-description.md).

**No test runner** — same posture as v0.1 (test-debt note in STATUS). Pure modules in `lib/history/`, `lib/store/cascade.ts`, the recording-rules table are written to be testable when Vitest lands.

---

## 15. Risks & alternatives

### Risks (v0.2-specific)

| Risk | Mitigation |
|---|---|
| Provider/Canvas split breaks v0.1 hosts | Single `<ForceGraph>` continues to work (internally wraps Provider+Canvas); verified by re-using the v0.1 demo unchanged. |
| Drag-coalesced history entry includes stale start position | `dragState` captures start pos at `downNode`; immutable through drag; commit reads from `dragState.startX/Y`. No race. |
| Undo while async source delta is mid-flight | Deltas don't enter undo stack; undo applies inverse to current state; if a delta arrives during undo, it applies after (last-write-wins). Standard. |
| Keyboard shortcut conflicts with panel inputs | Canvas-focus scope ensures shortcuts only fire when canvas root contains the focused element. Panel text inputs handle their own undo via browser. |
| `subscribeWithSelector` middleware compat with React 19 | Zustand v5 supports React 19; no known issues. Plan-stage smoke test with React Compiler enabled. |
| Linking-mode source highlight overlay misaligns on camera zoom/pan | Overlay subscribes to `sigma.getCamera().on("updated", ...)` and re-positions per-frame. Same pattern as v0.4 hull overlay (when groups land). |

### Alternatives considered, rejected

- **Single component with no Provider** (v0.1's form). Rejected: doesn't enable sibling hooks; description §6.3 wiring pattern wouldn't compile.
- **Render-prop API** (`<ForceGraph>{({ selection, actions }) => ...}</ForceGraph>`). Rejected: forces every host into a render-prop wrapper at the top of the page layout, awkward for grid-based Tier 3 layouts.
- **Module-level singleton store**. Rejected: footgun for multi-instance; per-instance Provider is the right shape.
- **Recording every `setNodeAttribute` during drag as a separate history entry**. Rejected per [spec §5.5 granularity rule](../../../graph-visualizer-old.md): drag is one user-intent event; coalescing is mandatory.
- **N-hop hover highlight** (configurable depth). Deferred to v0.6 if real consumers need it; v0.2 ships 1-hop only (matches Obsidian / spec).

---

## 16. Resolved plan-stage questions (locked on sign-off 2026-04-29)

All 10 questions resolved at sign-off. **Q-P3 revised** on re-validation (Zustand v5 API correction); **Q-P10 wording fixed** (clarifying the React `key` direction). The locks below are the v0.2 plan decisions; implementation builds against them.

**Q-P1: Compound API export shape — locked: compound subcomponents `<ForceGraph.Provider>` + `<ForceGraph.Canvas>`.** Matches `<DetailPanel.Header>` / `<DetailPanel.Body>` / `<DetailPanel.Actions>` precedent in [detail-panel](../detail-panel-procomp/detail-panel-procomp-description.md), and Radix's Provider+Consumer pattern (TooltipProvider + Tooltip + TooltipContent). Discoverable via TypeScript autocomplete; namespaced under one import.

**Q-P2: `<ForceGraph>` single component fate — locked: continues working; no deprecation warning.** v0.1 hosts upgrade to v0.2 transparently. Internally restructured: `<ForceGraph data={...}>` renders `<ForceGraph.Provider data={...}><ForceGraph.Canvas /></ForceGraph.Provider>`. Both forms are first-class. Ref forwarded to Provider; Provider exposes the full handle (state methods direct; render methods delegate to internal Canvas ref) per [§16.5 refinement #10](#165-plan-stage-refinements-surfaced-during-draft--re-validation).

**Q-P3: `useGraphSelector` shallow-equality — locked: re-export `useShallow` from Zustand for object selectors.** **Refined on re-validation:** Zustand v5 removed the equality-fn parameter from `useStore`; the v5 idiom is the `useShallow` wrapper. Default `useGraphSelector` uses Zustand's `Object.is` equality (per Zustand v5 default); consumers wrap with `useShallow` for object selectors that destructure multiple slices:

```ts
import { useShallow } from "zustand/react/shallow";

const { selection, hovered } = useGraphSelector(
  useShallow((s) => ({ selection: s.ui.selection, hovered: s.ui.hovered })),
);
```

Pattern documented in `usage.tsx` with example.

**Q-P4: Hover lead-in delay value — locked: 100ms.** Industry convention (Obsidian / Figma); prevents flicker on rapid mouse traversal without feeling sluggish. `hover(null)` (mouse leave) is immediate — only acquisition is debounced. `settings.hoverDelayMs` is a v0.6 setting if real consumers want override; not in v0.2 surface.

**Q-P5: `canUndo` / `canRedo` API — locked: both methods AND selectors.** Methods on `actions` (one-shot reads; e.g., conditional dispatch). Selectors via `useGraphSelector((s) => s.history.canUndo)` for reactive UI buttons (Tier 3 page's undo/redo toolbar re-renders on flip). Minor surface bloat is worth the ergonomic; both are first-class.

**Q-P6: Composite history entry shape — locked: store BOTH `forwards` and `inverses` per entry.** Each `HistoryEntry` carries `inverses: PrimitiveInverse[]` (applied in reverse order on undo) AND `forwards: PrimitiveInverse[]` (applied in order on redo). Doubles entry size (~50 → ~100 bytes; ~10KB at 100-entry default capacity — trivial). Predictability over space efficiency. Per [§16.5 refinement #13](#165-plan-stage-refinements-surfaced-during-draft--re-validation): at action-dispatch time, capture BEFORE-state (becomes inverses) and AFTER-state (becomes forwards) via pure-function helpers in `lib/history/composite.ts`.

**Q-P7: `enterLinkingMode(source)` invalid kind — locked: reject at type level + runtime check.** `EndpointRef = { kind: "node" | "group"; id: string }` excludes edge endpoints at the type level. Runtime validation in the action handler covers casts and dynamic data. Edges cannot be edge endpoints by [spec §3.3](../../../graph-visualizer-old.md).

**Q-P8: Drag during active layout — locked: pin via `graph.setNodeAttribute(id, "fixed", true)` on `downNode`.** FA2 worker honors `fixed: true` (skips that node's position update). On `pointerup`, set `pinned: true` ([spec §10](../../../graph-visualizer-old.md): drag auto-pins) for permanent user-intent pin. The `fixed` attribute is FA2-specific; `pinned` is the visualizer's user-facing concept. Plan locks: `fixed` is computed as `pinned === true || dragState.activeNodeId === id` (kept in sync by the drag handler + pin action). They coincide most of the time.

**Q-P9: Sigma `viewportToGraph` call pattern — locked: per-event call (no caching).** `viewportToGraph` is a synchronous arithmetic transform (~1μs). Caching helps marginally; premature optimization. Plan-stage profiling can revisit if hot.

**Q-P10: `data` prop swap mid-life — locked: full reset on `data` reference change.** When `data` changes (rare; e.g., kuzuSource → neo4jSource), Provider tears down internally: old store + graphology + worker disposed; new initialization runs against the new `data`. Selection / hover / history / linkingMode all clear. **Wording fix on re-validation:** to PREVENT this reset, hosts stabilize the `data` prop reference via `useMemo` or component-level state — the typical pattern, since sources are usually created once per lifetime. React `key={sourceId}` is for the OPPOSITE case — forcing a fresh remount of Provider state. Cross-source state migration is out of v0.2 scope; hosts wanting it serialize manually (read state via `getSnapshot()` before swap; restore via `importSnapshot()` post-swap).

---

## 16.5 Plan-stage refinements (surfaced during draft + re-validation)

Baked into implementation:

1. **`bumpGraphVersion` on drag commit, NOT per-frame.** Drag mutates `graph.setNodeAttribute` per pointer-move (Sigma re-renders directly); Zustand `graphVersion` bumps once on `pointerup`. Selectors observing graphVersion (e.g., neighbor counts, visible-set derivations) don't re-fire 60×/sec.
2. **Provider cleanup on unmount.** Worker killed; Sigma killed; graphology garbage-collected. Verify no listener leaks via React DevTools at v0.2 implementation completion.
3. **Selection state NOT serialized into snapshots.** `exportSnapshot` returns graph data only (nodes + edges + groups + types + settings). UI state (selection, hover, linkingMode, history) is per-session. Re-import doesn't restore selection. v0.6 settings panel may add session-snapshot serialization separately.
4. **`onSelectionChange` debouncing.** Selection changes are user-driven (1 click = 1 change); no debounce needed. Hover changes ARE debounced internally (Q-P4) but `onHoverChange` is NOT exposed in v0.2 (hover is too noisy for host callbacks; if a real use case surfaces, add `onHoverChange` in v0.3+).
5. **Test-debt continuation.** Same posture as v0.1 + workspace + rich-card. Pure modules in `lib/history/` + `lib/store/cascade.ts` + `lib/history/recording-rules.ts` are pure functions; obvious Vitest targets when test runner lands. Specifically: drag-coalesced entry construction round-trip, recording-rules predicates, ring-buffer wrap-around, undo→redo→state-equivalence property test.
6. **React.StrictMode double-mount handling.** Provider creates store via `useRef(create(...))`; idempotent. Sigma + worker creation guarded by `if (!sigmaRef.current)`. Verified by running v0.1 patterns through the same StrictMode harness.
7. **Sigma `nodeReducer` / `edgeReducer` compose with theme.** Hover dim reducer wraps the theme-resolved color (doesn't replace it). Theme switch + hover compose correctly: dim is applied to whatever color the theme resolved.
8. **`pinned` state is layout-local, NOT subject to canonical-field permission.** System-origin nodes CAN be pinned by the user — `pinned` is a visualizer-local layout preference, not a canonical-field mutation. [Decision #23](../../systems/graph-system/graph-system-description.md) (canonical fields read-only on system nodes) does NOT block drag-to-pin. Plan locks: drag-to-pin and the `pinNode` action both bypass the permission resolver because `position` and `pinned` are not canonical fields. Same logic applies to `setNodePositions` (silent or recorded) — layout positions are local data.
9. **Provider context value stability via `useMemo`.** `ForceGraphContextValue = { store, graph, sigma, worker }` — all stable refs (`useRef`), but the containing object must be memoized. Without `useMemo`, every Provider render produces a new context object, causing all consumers to re-render unnecessarily. Implementation: `const ctx = useMemo(() => ({ store, graph, sigma, worker }), [store, graph, sigma, worker])`.
10. **Single-component ref delegation through Provider.** `<ForceGraph ref={ref}>` forwards `ref` to `<ForceGraph.Provider>` internally. Provider holds an internal `useRef` to its child Canvas's Sigma instance. Provider's `useImperativeHandle` exposes the full handle: state methods (`getSnapshot`, `importSnapshot`, `setNodePositions`, `getGraphologyInstance`) call store / graph directly; render methods (`focusNode`, `focusGroup`, `resetCamera`, `getSigmaInstance`) delegate via the Canvas-ref. v0.1 single-component handle surface intact across the v0.2 restructuring.
11. **History entries with stale references after delta-driven deletes.** v0.2 cascade fires on source-adapter delta deletions. History entries may reference deleted entities (e.g., `setNodePosition(deletedNodeX, ...)`). Plan locks: cascade scans history for entries with inverses OR forwards referencing the deleted ID; replaces those primitives with `{ type: "noop" }` (preserves cursor positions; safer than pruning entries — pruning would shift indices and break in-flight undo/redo). v0.3 expands the cleanup with full CRUD-driven deletes.
12. **`onSelectionChange` initial fire suppression.** Don't fire `onSelectionChange(null)` on mount. Subscribe with prev=current bookmarked at mount; first dispatch only fires when prev !== current. Standard subscriber pattern; matches Zustand's `subscribe(selector, callback, { fireImmediately: false })` default.
13. **History entry capture at action-dispatch time** (per Q-P6 lock). Action handlers read CURRENT state (BEFORE), apply the change, then construct `HistoryEntry` with `inverses` derived from BEFORE and `forwards` derived from AFTER. Pure-function helpers in `lib/history/composite.ts` (`buildInverses(before, op)` + `buildForwards(after, op)`). Bulk operations (drag) compose multiple primitives into one entry per the drag-coalesce pattern (§7).

---

## 17. Definition of "done" for THIS document (stage gate)

- [x] User reviewed §1–§15 (the locked plan) and §16 (resolved Q-Ps + §16.5 refinements).
- [x] **v0.1 plan signed off** (✓ done 2026-04-28; pre-condition for v0.2 plan sign-off).
- [x] All 10 plan-stage questions resolved (Q-P3 + Q-P10 refined on re-validation).
- [x] User said **"plan approved"** — Stage 3 (v0.2 implementation) unlocks once **Phase 0 risk spike** completes (per [v0.1 plan §18](force-graph-v0.1-plan.md#18-definition-of-done-for-this-document-stage-gate) pre-condition) and **v0.1 implementation** lands. v0.2 is implemented sequentially after v0.1 — depends on v0.1's foundations (data model, store, Sigma container, source-adapter contract).

After sign-off, the next session starts with:

1. Confirm v0.1 implementation is complete (per the v0.1 plan §18 unlock cascade).
2. Implement v0.2 against this plan, file-by-file in the §11.1 build order.
3. Update `meta.ts` to `version: "0.2.0"`, `status: "alpha"`, bump `updatedAt`.
4. Run the [§13 verification checklist from the component-guide](../../component-guide.md#13-verification-checklist).
5. Update STATUS.md with v0.2 ship entry.
6. Begin v0.6 plan authoring (also independent of Tier 1 plans) OR pause for Tier 1 plan authoring.

If at any point during implementation a plan decision turns out wrong, **stop, document the issue, ask before deviating**. The plan is the contract; deviations are loud, not silent.

---

*End of v0.2 plan. Sister docs in this folder: [description](force-graph-procomp-description.md), [v0.1 plan](force-graph-v0.1-plan.md), v0.3 plan (TBA — gated on properties-form + detail-panel plans), v0.4 plan (TBA — gated on filter-stack plan), v0.5 plan (TBA — gated on markdown-editor plan), v0.6 plan (TBA — independent), [guide](force-graph-procomp-guide.md) (TBA — authored alongside implementation).*
