# `force-graph` v0.3 Plan (Stage 2, Phase 3 of 6) — Editing Layer

> **Status:** **DRAFT 2026-04-29.** Pending user validate pass per project cadence (draft → validate → re-validate → sign off → commit). Recommendations below convert to `**Locked: X.**` form on sign-off.
> **Phase:** v0.3 — Editing layer (CRUD with permissions); 2 weeks focused per [system §10.3](../../systems/graph-system/graph-system-description.md#103-tier-2-force-graph-phasing).
> **Parent description:** [force-graph-procomp-description.md §2.3](force-graph-procomp-description.md#23-v03--editing-layer-2-weeks) (signed off 2026-04-28).
> **Predecessors:** [v0.1 plan](force-graph-v0.1-plan.md) (viewer core; signed off 2026-04-28) + [v0.2 plan](force-graph-v0.2-plan.md) (interaction infrastructure; signed off 2026-04-29).
> **Cascade unlocked by:** [`properties-form` plan](../properties-form-procomp/properties-form-procomp-plan.md) + [`detail-panel` plan](../detail-panel-procomp/detail-panel-procomp-plan.md) (both signed off 2026-04-29).
> **Composes (host-side, NOT registry-side per [decision #35](../../systems/graph-system/graph-system-description.md)):** properties-form, detail-panel.

---

## 1. Inherited inputs (one paragraph)

Builds on v0.2's interaction infrastructure (selection / hover / drag / undo / linking-mode / compound API). v0.3 activates: full CRUD action surface (~14 new actions), origin-aware permission resolver (full implementation per [decision #25](../../systems/graph-system/graph-system-description.md)), system-canonical-field read-only enforcement (decision #23), `applyMutation` routing for annotations (decision #33), schema reactivity via graceful degradation (decision #24), stale-write conflict policy (decision #32 — last-write-wins + banner). Composes [`properties-form` plan](../properties-form-procomp/properties-form-procomp-plan.md) (mixed-permission entity editing per its §6.2 showcase) and [`detail-panel` plan](../detail-panel-procomp/detail-panel-procomp-plan.md) (inline edit per decision #6) AT THE HOST/Tier 3 LEVEL only — force-graph itself imports neither (decision #35; **single most violated rule**). Inherits the v0.1 + v0.2 locks: origin field mandatory (decision #17), two-layer state (graphology imperative + Zustand reactive), `useGraphSelector` observes `graphVersion` (decision #4), composite transactional history entries (v0.2 §9), UI-state cascade-on-delete (v0.1 scaffolded, v0.2 activated, v0.3 amplified by user-driven deletes).

---

## 2. v0.3 scope summary

The v0.3 deliverable is the **editing layer** activated on top of v0.2's interaction infrastructure. v0.2 wired the canvas-side state and undo machinery; v0.3 wires the actions that mutate state.

- **Node CRUD** — `addNode`, `updateNode`, `deleteNode`, `pinNode` (single-node pin already in v0.2 drag-coalesced; v0.3 surfaces it as a standalone action).
- **Edge CRUD** — `addEdge`, `updateEdge`, `deleteEdge`. Unified — accepts any endpoint kind combination; dispatches internally to graphology-native (node↔node) or group-edge slice (group-involving).
- **Type CRUD** — `addNodeType` / `updateNodeType` / `deleteNodeType` + `addEdgeType` / `updateEdgeType` / `deleteEdgeType`. Delete refuses if any entity references the type (returns structured error; host UI prompts for reassignment per Q-P7).
- **Origin-aware permission resolver** — full implementation per [decision #25](../../systems/graph-system/graph-system-description.md) + [system §5](../../systems/graph-system/graph-system-description.md#5-permission-resolver-pattern-cross-cutting). 4-layer resolution: predicate escape hatch → per-entity meta lock → origin × action defaults → fallback reject. Host supplies optional `resolvePermission` prop for layer 1.
- **System-canonical-field read-only enforcement** ([decision #23](../../systems/graph-system/graph-system-description.md)) — `updateNode` on a `system`-origin node rejects edits to canonical fields (everything except `annotations` + `position` + `pinned`); structured error returned.
- **Annotations through `applyMutation`** ([decision #33](../../systems/graph-system/graph-system-description.md)) — `updateNode({ annotations: {...} })` on a system node routes to `applyMutation({ type: "setAnnotation", ... })` instead of mutating canonical state. Same `updateNode` API; internal dispatch differs.
- **User-edges-between-system rule** ([decision #21](../../systems/graph-system/graph-system-description.md)) — `addEdge` between two system nodes stamps `origin: "user"` automatically (no host action needed; force-graph enforces).
- **Schema reactivity by graceful degradation** ([decision #24](../../systems/graph-system/graph-system-description.md)) — when `updateNode` references an unknown `schemaType` (e.g., a delta brought in a node with a NodeType id we haven't registered), auto-register a neutral default `NodeType` and surface via `onError` (no crash).
- **Stale-write conflict policy** ([decision #32](../../systems/graph-system/graph-system-description.md)) — last-write-wins for v0.1 (the description-level lock applies here): if `applyMutation` returns `ok: true` AND `serverState` reflects a divergent canonical, the local mutation has already been applied; host receives a warning event (`onError({ code: "STALE_WRITE", ... })`). Banner chrome is host-side per Q-P5 (force-graph emits the signal; host renders the UI).
- **Cascade-on-delete amplified** — v0.2 scaffolded UI-state cascade (selection / hovered / linkingMode / multiEdgeExpanded); v0.3 adds the data-mutation cascades: `deleteNode` cascades to incident edges + group memberships; `deleteEdge` cascades to UI-state refs only (no further data); `deleteGroup` cascades to group-involving edges + membership lookup updates (member nodes themselves remain). All three produce single composite transactional history entries (one entry per user action; multiple primitive inverses per spec §5.5 and v0.2 §9.2).
- **Composite history entries for CRUD** — v0.2 shipped the ring buffer and the entry shape (`{ label, forwards, inverses }`); v0.3 produces real composite entries from CRUD actions (deleteNode = single entry containing N+M+1 primitive inverses for the cascade).
- **Permission-tooltip pattern** — port from rich-card's [permission-tooltip.tsx](../../../src/registry/components/data/rich-card/parts/permission-tooltip.tsx). Force-graph itself doesn't render UI for blocked actions (Tier 3 host owns toolbar + buttons); but the resolver returns reason strings that the host's UI can wire into shadcn `Tooltip`.
- **Detail-panel inline-edit composition** ([decision #6](../../systems/graph-system/graph-system-description.md)) — fully a host concern. Force-graph exposes the action surface; Tier 3 page composes `<DetailPanel>` + `<PropertiesForm>` + force-graph actions (detail-panel description §6.3 of force-graph). v0.3 verifies the contract via the integration showcase but ships zero new force-graph code for it (decision #35).

**Doesn't ship in v0.3** (per description §2.4–§2.6): groups (v0.4 — addGroup/updateGroup/deleteGroup/membership scaffolded but not full hull rendering), filter-stack composition (v0.4), doc-node visuals (v0.5), markdown-editor integration (v0.5), search (v0.6), advanced settings UI (v0.6). v0.3 ships the data-layer for groups too (`addGroup` etc.) since they're part of the unified CRUD surface — but visual rendering of hulls + group gravity lands in v0.4.

**Implementation budget:** ~2 weeks focused (per system §10.3). Sequential after v0.2 implementation lands; gated on Phase 0 risk spike like v0.1 + v0.2.

---

## 3. Final v0.3 API additions (recommended)

Builds on v0.1's props/handle/actions/selectors and v0.2's compound API. v0.3 adds new actions and one new prop; no breaking changes.

### 3.1 New props

```ts
// Added to ForceGraphProps and ForceGraph.Provider props
interface EditingProps {
  // Permission resolver (Q-P1; full implementation in v0.3 vs v0.1's scaffolding)
  resolvePermission?: (
    entity: Node | Edge | Group,
    action: PermissionAction,
    ctx: PermissionContext
  ) => boolean | undefined;        // returns undefined to defer to next layer

  // Stale-write banner — host-rendered via onError signal per Q-P5; no built-in chrome
  // (no new prop; reuses v0.1's onError({ code, message }) callback)
}

type PermissionAction =
  | "edit-canonical"      // mutate canonical fields (label, kind, position, etc. on user nodes; rejected on system)
  | "edit-annotations"    // mutate annotations field
  | "delete"
  | "add-to-group"
  | "remove-from-group"
  | "connect-edge"        // both endpoints accept user-origin edge from this entity
  | "edit-group-membership"
  ;

interface PermissionContext {
  origin: "system" | "user";
  hasMetaLock: boolean;             // entity.metadata.__locked === true
  // Action-specific context (sparse; populated only for actions that need it)
  fieldKey?: string;                // when action === "edit-canonical", the specific field being edited
}
```

### 3.2 New actions (~14 total; ~5 already foundationally present from v0.1/v0.2 — surfaced as full APIs in v0.3)

```ts
interface ActionsV03Additions {
  // Node CRUD (new in v0.3)
  addNode(input: NewNodeInput): string;           // returns id; auto-id if input.id absent (Q-P8)
  updateNode(id: string, patch: PartialNode): void;
  deleteNode(id: string): void;                   // composite cascade per §5.2

  // pinNode — surfaced in v0.2 inside drag; v0.3 adds the standalone action
  pinNode(id: string, pinned: boolean): void;     // single-node, recorded as own history entry

  // Edge CRUD (new in v0.3)
  addEdge(input: NewEdgeInput): string;           // unified; dispatches to graphology or group-edge slice
  updateEdge(id: string, patch: PartialEdge): void;
  deleteEdge(id: string): void;                   // cascades only UI-state; no further data

  // Group CRUD (new in v0.3 — data only; hull rendering in v0.4)
  addGroup(input: NewGroupInput): string;
  updateGroup(id: string, patch: PartialGroup): void;
  deleteGroup(id: string): void;                  // cascades: group-involving edges + membership lookups
  addNodeToGroup(nodeId: string, groupId: string): void;
  removeNodeFromGroup(nodeId: string, groupId: string): void;

  // Type CRUD (new in v0.3)
  addNodeType(input: Omit<NodeType, "id">): string;
  updateNodeType(id: string, patch: Partial<NodeType>): void;
  deleteNodeType(id: string): { ok: false; code: "TYPE_IN_USE"; entityIds: string[] } | { ok: true };
  addEdgeType(input: Omit<EdgeType, "id">): string;
  updateEdgeType(id: string, patch: Partial<EdgeType>): void;
  deleteEdgeType(id: string): { ok: false; code: "TYPE_IN_USE"; entityIds: string[] } | { ok: true };
}

interface NewNodeInput {
  id?: string;                                    // optional; auto-generated if absent (Q-P8)
  label: string;
  kind: "normal" | "doc";
  origin: Origin;                                  // mandatory per decision #17
  systemRef?: SystemRef;                           // mandatory iff origin === "system"
  nodeTypeId: string;
  position?: { x: number; y: number };
  pinned?: boolean;
  groupIds?: string[];                             // derived index per decision #2; resolver populates from canonical
  metadata?: Record<string, unknown>;
  annotations?: Record<string, unknown>;
  unresolvedWikilinks?: string[];                  // doc nodes only (decision #15)
}

type PartialNode = Partial<Omit<Node, "id" | "origin" | "systemRef">>;  // origin + systemRef immutable post-create
```

`PartialEdge` and `PartialGroup` follow the same posture (id + origin immutable post-create; everything else patchable).

### 3.3 Permission action surface (Q-P1)

Internal `resolvePermission(entity, action, ctx) → "allowed" | { blocked: true; reason: string }` is called inside every CRUD action. 4-layer resolution per [system §5.2](../../systems/graph-system/graph-system-description.md#52-layered-resolution):

1. **Host predicate** — `props.resolvePermission?.(entity, action, ctx)` returns `boolean | undefined`. `undefined` defers; `true`/`false` decides.
2. **Per-entity meta lock** — `entity.metadata?.__locked === true` → blocked; reason `"This entity is locked by host"`.
3. **Origin × action defaults** — table from system §5.1:
   - `system` + `edit-canonical` → blocked (canonical fields immutable; reason `"System-origin canonical fields are read-only"`)
   - `system` + `edit-annotations` → allowed
   - `system` + `delete` → blocked (reason `"System-origin entities cannot be deleted via this UI"`)
   - all others → allowed
4. **Fallback** → `allowed` (permissive default for unrecognized actions).

Implementation file: `lib/permission-resolver.ts`. Single function signature: `resolvePermission(entity, action, ctx, hostResolver?) → ResolutionResult`.

### 3.4 What's NOT in v0.3

- No filter-stack composition (v0.4).
- No group hull rendering / group gravity force (v0.4 — the data layer ships now).
- No doc-node visuals or markdown-editor (v0.5).
- No search (v0.6).
- No multi-edge expansion UI (v0.6 — collapse/expand actions stay deferred).
- No advanced-settings panel chrome (v0.6).
- No permission-tooltip rendered by force-graph itself — host owns it via the `reason` strings from blocked-action returns (decision #35).

---

## 4. State model additions

v0.3 activates the dispatchers; the slice shapes from v0.1/v0.2 don't change.

### 4.1 graphologyAdapter — CRUD methods activated

v0.1 shipped `addNode` / `updateNode` / `deleteNode` / etc. as the adapter boundary; v0.1/v0.2 didn't surface them as public actions. v0.3 wires the action layer:

```
public action addNode(input)
  → resolvePermission check (action: "create-node" — implicit since adding new)
  → graphologyAdapter.addNode(input)        // bumps graphVersion
  → record history entry { label: "Add node ${input.label}", inverses: [deleteNode(id)] }
  → return id

public action updateNode(id, patch)
  → resolvePermission check (action: "edit-canonical" or "edit-annotations" per patch shape)
  → if patch contains annotations AND entity.origin === "system":
       route to applyMutation({ type: "setAnnotation", ... })          // decision #33
     else:
       graphologyAdapter.updateNode(id, patch)                         // bumps graphVersion
  → record history entry { label: "Edit ${entity.label}", inverses: [updateNode(id, prevPatch)] }

public action deleteNode(id)
  → resolvePermission check (action: "delete")
  → collect cascades: incident edges, group memberships
  → graphologyAdapter.deleteEdgesByEndpoint(id)
  → membership-slice removeFromAllGroups(id)
  → graphologyAdapter.deleteNode(id)
  → record SINGLE composite history entry { label: "Delete ${entity.label}", inverses: [...all-reverses-in-order] }
  → activate UI-state cascade (v0.2 §4.5): clear selection / hovered / multiEdgeExpanded / linkingMode if they reference id
```

Critical sequencing per Q-P6: cascades are **collected before any mutation fires**, then applied atomically. If any cascade step throws, the entire transaction is rejected (no partial deletion).

### 4.2 Edit-history slice — composite entry production

v0.2 §9.2 locked the entry shape:

```ts
type HistoryEntry = {
  label: string;
  forwards: PrimitiveOp[];
  inverses: PrimitiveOp[];
};
```

v0.3 produces real composite entries. Pattern per CRUD action:

| Action | forwards | inverses |
|---|---|---|
| `addNode` | `[addNode(input)]` | `[deleteNode(id)]` |
| `updateNode(id, patch)` | `[updateNode(id, patch)]` | `[updateNode(id, prevPatch)]` (prevPatch captured pre-mutation) |
| `deleteNode(id)` | `[deleteNode(id), ...cascadedDeletes]` | `[restoreNode(prev), ...cascadedRestores]` |
| `pinNode(id, pinned)` | `[pinNode(id, pinned)]` | `[pinNode(id, !pinned)]` |
| `addEdge` | `[addEdge(input)]` | `[deleteEdge(id)]` |
| `updateEdge` | `[updateEdge(id, patch)]` | `[updateEdge(id, prevPatch)]` |
| `deleteEdge` | `[deleteEdge(id)]` | `[addEdge(prev)]` |
| `addGroup` | `[addGroup(input)]` | `[deleteGroup(id)]` |
| `updateGroup` | `[updateGroup(id, patch)]` | `[updateGroup(id, prevPatch)]` |
| `deleteGroup(id)` | `[deleteGroup(id), ...groupEdgeDeletes]` | `[restoreGroup(prev), ...groupEdgeRestores]` |
| `addNodeToGroup` | `[addNodeToGroup(nodeId, groupId)]` | `[removeNodeFromGroup(nodeId, groupId)]` |
| `removeNodeFromGroup` | `[removeNodeFromGroup(nodeId, groupId)]` | `[addNodeToGroup(nodeId, groupId)]` |
| Type CRUD (add/update) | `[addType / updateType]` | `[deleteType / updateType (prev)]` |
| `setAnnotation` (via updateNode → applyMutation) | `[setAnnotation(entityId, key, value)]` | `[setAnnotation(entityId, key, prevValue)]` |

`PrimitiveOp` is a discriminated union; the redo path applies `forwards` in order; the undo path applies `inverses` in reverse order. Both via `graphologyAdapter` directly (no resolver re-check on undo/redo — Q-P10 lock).

### 4.3 Annotation routing (`updateNode` → `applyMutation` per decision #33)

When `updateNode(id, { annotations: {...} })` is called:

```
if entity.origin === "system":
  // canonical fields are read-only; annotations are user-writable
  for each (key, value) in patch.annotations:
    if dataSource.applyMutation:
      const result = await dataSource.applyMutation({ type: "setAnnotation", entityId: id, key, value });
      if !result.ok:
        rollback local optimistic update; emit onError({ code: result.error.code, message: result.error.message });
      else:
        merge serverState into local store (Q-P10);
    else:
      // host did not supply applyMutation; persist locally only
      graphologyAdapter.updateNode(id, { annotations: { ...prev.annotations, [key]: value } });
else:
  // user-origin node: full canonical update
  graphologyAdapter.updateNode(id, patch);
```

The `applyMutation` call is async; the action handler awaits per spec §6.4. Optimistic update: applied locally before the await; rolled back on failure.

For canonical-field updates on user-origin nodes, no `applyMutation` round-trip — local state is canonical for user data.

### 4.4 Schema reactivity (decision #24)

When `addNode` or `updateNode` references a `nodeTypeId` not in `state.nodeTypes`:

```
on action: addNode({ nodeTypeId: "unknown-id", ... })
  → check: state.nodeTypes has "unknown-id"? No.
  → auto-register: addNodeType({ id: "unknown-id", label: "Unknown type", color: "var(--muted)", icon: null })
  → emit onError({ code: "UNKNOWN_NODE_TYPE_AUTO_REGISTERED", message: "Type 'unknown-id' was not registered; auto-registered with neutral defaults", entityId: nodeId, typeId: "unknown-id" })
  → continue addNode normally
```

Same for `edgeTypeId` → `addEdgeType` auto-registration. The `onError` is informational (not fatal); host can surface a notification but the operation succeeds.

### 4.5 UI-state cascade-on-delete amplified

v0.2 §4.5 wired the cascade. v0.3 amplifies it with the data-driven cascades:

- `deleteNode(id)`: per spec §5.2, in this order:
  1. Collect incident edges (from graphology + group-edge slice).
  2. Collect group memberships of the node.
  3. UI-state cascade: clear selection/hovered/linkingMode/multiEdgeExpanded if they reference id (or, for multiEdgeExpanded, if either endpoint was deleted).
  4. Apply data deletions atomically: edges → memberships → node.
  5. graphVersion increments once at the end (single render trigger).

- `deleteEdge(id)`: only UI-state cascade fires (no data cascade — edges have no children).
- `deleteGroup(id)`: data cascade for group-involving edges + membership-lookup updates; UI-state cascade for refs.

All three produce single composite history entries (Q-P6 lock).

---

## 5. Permission resolver (full implementation)

The resolver lives in `lib/permission-resolver.ts`. v0.1 shipped scaffolding; v0.3 fills in the layered logic.

### 5.1 Implementation shape

```ts
type ResolutionResult =
  | { allowed: true }
  | { allowed: false; reason: string };

export function resolvePermission(
  entity: Node | Edge | Group,
  action: PermissionAction,
  ctx: PermissionContext,
  hostResolver?: HostPermissionResolver,
): ResolutionResult {
  // Layer 1: host predicate
  if (hostResolver) {
    const result = hostResolver(entity, action, ctx);
    if (result === true) return { allowed: true };
    if (result === false) return { allowed: false, reason: "Blocked by host policy" };
    // result === undefined → defer to next layer
  }

  // Layer 2: per-entity meta lock
  if (ctx.hasMetaLock) {
    return { allowed: false, reason: "This entity is locked" };
  }

  // Layer 3: origin × action defaults
  if (ctx.origin === "system") {
    if (action === "edit-canonical") return { allowed: false, reason: "System-origin canonical fields are read-only" };
    if (action === "delete") return { allowed: false, reason: "System-origin entities cannot be deleted via this UI" };
  }

  // Layer 4: fallback
  return { allowed: true };
}
```

Per Q-P1: invoked on every CRUD action; **NOT memoized** (entity state changes via mutation, so caching introduces stale-read risk). Cost is O(1) per call; ~5 conditionals; negligible.

### 5.2 Action → permission-action mapping

| Action | PermissionAction(s) checked | Notes |
|---|---|---|
| `addNode` | `"connect-edge"` (none — addNode itself is unrestricted by default) | force-graph allows node creation by any origin; host's `resolvePermission` is the gate |
| `updateNode(patch)` | per patch: `"edit-canonical"` if any non-annotation field; `"edit-annotations"` if patch.annotations | Splits per-field; canonical-only patches blocked on system entities |
| `deleteNode` | `"delete"` | Blocked on system entities by default |
| `pinNode` | `"edit-canonical"` (technically position/pinned are canonical) | Q-P1 refines: pin is layout-local, NOT subject to canonical-field permission per v0.2 §16.5 #1 — drag-to-pin works for system nodes too. **Treat as `edit-pinned` distinct action.** |
| `addEdge` | `"connect-edge"` on both endpoints | Per [decision #21](../../systems/graph-system/graph-system-description.md): user-edge between two system nodes is `origin: "user"`; force-graph stamps automatically |
| `updateEdge` | `"edit-canonical"` if any field except direction; `"edit-direction"` for direction; `"edit-annotations"` for annotations | Edge `origin` immutable per #17 |
| `deleteEdge` | `"delete"` | System-origin edges blocked by default; user-origin edges allowed |
| `addGroup` / `updateGroup` / `deleteGroup` | groups always `origin: "user"` per decision §4.6 — full edit allowed | No system-origin groups in v1 |
| `addNodeToGroup` / `removeNodeFromGroup` | `"add-to-group"` / `"remove-from-group"` on the node | System nodes default-allowed; host can restrict via predicate |
| Type CRUD | no per-entity check (types aren't entities) | Type deletion enforces "type-in-use" via referential check, NOT permission |
| `setAnnotation` (via updateNode for system origin) | `"edit-annotations"` | Default-allowed for both origins |

`pinNode` exception per Q-P1 + v0.2 lock — separate `edit-pinned` action that defaults `allowed: true` regardless of origin; drag-to-pin works on system nodes (layout-local concern).

### 5.3 UI integration (host's responsibility)

When force-graph's CRUD action returns a `{ ok: false, reason }` result, the host's UI:

1. Skips the optimistic update (the action returned without dispatching).
2. Renders the reason string in a tooltip, toast, or inline error message — host's choice.
3. Force-graph itself **does not render** any blocking-UX chrome — that's pure host concern (decision #35; rich-card's [permission-tooltip.tsx](../../../src/registry/components/data/rich-card/parts/permission-tooltip.tsx) is the reference pattern hosts can copy).

For the `<PropertiesForm>` integration (description §6.3 of force-graph), the host computes per-field permissions from origin via the resolver and supplies them to properties-form's `resolvePermission` prop — covered by [properties-form plan §5](../properties-form-procomp/properties-form-procomp-plan.md#5-permission-resolver-own-implementation-per-decision-25).

---

## 6. File-by-file plan (additions to v0.2)

### 6.1 New files in v0.3

```
src/registry/components/data/force-graph/
├── lib/
│   ├── permission-resolver.ts            # full 4-layer resolver (was: scaffolding in v0.1)
│   ├── cascade-on-delete.ts              # data cascades for deleteNode/deleteEdge/deleteGroup
│   ├── auto-register-types.ts            # decision #24 — schema reactivity
│   └── id-factory.ts                     # auto-id for NewNodeInput / NewEdgeInput / NewGroupInput when absent
├── store/
│   ├── slices/
│   │   └── (no new slices; v0.1 ui + history + groupEdges slices fully activated by v0.2)
│   └── actions/
│       ├── crud-node.ts                  # addNode, updateNode, deleteNode, pinNode (standalone)
│       ├── crud-edge.ts                  # addEdge, updateEdge, deleteEdge
│       ├── crud-group.ts                 # addGroup, updateGroup, deleteGroup, addNodeToGroup, removeNodeFromGroup
│       ├── crud-types.ts                 # addNodeType / updateNodeType / deleteNodeType + edge-type variants
│       └── set-annotation.ts             # internal dispatch for updateNode → applyMutation routing
```

**File count delta:** +9 files. Total v0.3 files (cumulative from v0.1's structure): ~50-55.

### 6.2 Modified files in v0.3

- `force-graph.tsx` — adds `resolvePermission` prop pass-through to Provider context.
- `store/store.ts` — wires the new actions; no slice-shape changes.
- `types.ts` — adds `PermissionAction`, `PermissionContext`, `HostPermissionResolver`, `NewNodeInput`, `NewEdgeInput`, `NewGroupInput`, `PartialNode`, `PartialEdge`, `PartialGroup`, `ResolutionResult`.
- `lib/graphology-adapter.ts` — exposes the CRUD primitives (was: `addNode` / etc. internal-only in v0.1).
- `parts/canvas.tsx` — no-op for v0.3 (CRUD actions don't render anything new on the canvas; that lands in v0.4 hulls + v0.5 doc-glyphs).
- `dummy-data.ts` — adds editing-flow demo fixtures (e.g., a system node with annotations editable; a user node fully editable; a locked node).
- `demo.tsx` — adds the editing showcase (mixed-permission entity; properties-form composition).
- `usage.tsx` — adds the v0.3 host wiring recipe (DetailPanel + PropertiesForm + force-graph actions).

### 6.3 Build order within v0.3

Three internal phases, ~3-4 days each (~2 weeks total):

**Phase A — types + permission resolver + cascades (~3 days):**
- `types.ts` additions
- `lib/permission-resolver.ts` (full 4-layer)
- `lib/cascade-on-delete.ts`
- `lib/auto-register-types.ts`
- `lib/id-factory.ts`
- Phase A end gate: unit-test the resolver against the system §5.1 table; smoke-test cascade collection (deleteNode produces the right inverse list); smoke-test auto-register-types fires on unknown nodeTypeId.

**Phase B — CRUD actions + composite history entries (~5 days):**
- `store/actions/crud-node.ts` (addNode, updateNode, deleteNode, pinNode)
- `store/actions/crud-edge.ts`
- `store/actions/crud-group.ts`
- `store/actions/crud-types.ts`
- `store/actions/set-annotation.ts` (the applyMutation routing)
- Wire actions into the Provider context; expose via the v0.2 `useGraphActions()` hook
- Phase B end gate: smoke-test single-action history entries (addNode, updateNode, pinNode); smoke-test composite entries (deleteNode produces N+M+1 inverses; undo restores everything atomically); smoke-test the system-canonical-field rejection path; smoke-test annotation routing through applyMutation.

**Phase C — integration showcase + demo (~3-4 days):**
- Tier 3 host wiring (in `demo.tsx`): DetailPanel + PropertiesForm + force-graph actions per description §6.3
- Mixed-permission demo: a system node with read-only canonical fields + writable annotations
- Stale-write banner host-rendered example
- Verify `tsc + lint + build` clean
- Verify integration matches both the [`properties-form` plan §6.2 mixed-permission showcase](../properties-form-procomp/properties-form-procomp-plan.md) AND the [`detail-panel` plan §4.5 composition contract](../detail-panel-procomp/detail-panel-procomp-plan.md#45-composition-with-detail-panel-the-showcase-integration)

---

## 7. Edge cases (locked)

| Case | Handling |
|---|---|
| `addNode` with a `nodeTypeId` that doesn't exist | Auto-register a neutral default per decision #24 + §4.4; fire `onError({ code: "UNKNOWN_NODE_TYPE_AUTO_REGISTERED" })`; node creation succeeds. |
| `addNode` missing `origin` | Reject before mutation; throw `Error("'origin' is required on every node")` per decision #17. Host bug. |
| `addNode` with `origin: "system"` but no `systemRef` | Reject before mutation; throw `Error("'systemRef' required when origin === 'system'")` per [v0.1 plan §6.1](force-graph-v0.1-plan.md). |
| `updateNode` on a system entity, patch contains canonical fields | Permission resolver returns `{ allowed: false, reason: "System-origin canonical fields are read-only" }`; action is no-op; returns the result. Host UI surfaces the reason. |
| `updateNode` on a system entity, patch contains BOTH canonical + annotations | Split: canonical block → return `{ allowed: false, ... }`; annotations are NOT applied either (atomic — one failure rejects the whole patch). Host fixes patch and resubmits. |
| `updateNode` on a user entity with annotations | Plain `graphologyAdapter.updateNode`; no `applyMutation` round-trip (user data is local-canonical). |
| `updateNode` with annotations on system entity, but `dataSource.applyMutation` is undefined | Persists locally (annotations field on the node); fire dev-only `console.warn` once per session ("Setting annotations on system entity without applyMutation; persists locally only"). |
| `applyMutation` rejects (`ok: false`) | Local optimistic update is rolled back; `onError({ code, message })` fires with the server's error. |
| `applyMutation` returns `ok: true` with `serverState` (Q-P10) | Local optimistic update kept; serverState merged on top (server-authoritative for canonical fields). If serverState diverges from optimistic, fire informational `onError({ code: "STALE_WRITE", ... })` per decision #32. |
| `applyMutation` throws (network error, etc.) | Local optimistic update is rolled back; `onError({ code: "MUTATION_THROW", message: err.message })` fires. |
| `deleteNode` while pinned | Pin state is part of the deletion's primitive inverses (re-pin on undo). |
| `deleteNode` while in linking mode with this node as source | UI-state cascade clears `linkingMode`; data cascade deletes the node + edges. Host re-renders. |
| `deleteEdge` for a `derivedFromWikilink: true` edge | v0.3 doesn't enforce decision #9 yet (that lands in v0.5 with reconciliation); programmatic `deleteEdge` accepts. v0.5 adds the UI tooltip refusal. |
| `deleteNodeType` while nodes use it | Returns `{ ok: false, code: "TYPE_IN_USE", entityIds: [...] }` per Q-P7; no mutation. Host UI prompts for reassignment. |
| `addNodeToGroup` for an already-member node | No-op; no history entry; returns silently. |
| `removeNodeFromGroup` for a non-member node | Returns; no history entry; no error. |
| Composite history entry partial failure (e.g., one cascade step throws) | Q-P6 lock: atomic — collect cascades BEFORE applying; if collection succeeds, apply all-or-nothing. If a primitive op throws during apply, log + bail; state may be inconsistent (rare). Force-graph emits `onError({ code: "CASCADE_FAILED", ... })`. |
| `resolvePermission` host predicate throws | Caught at the call site; treated as `undefined` (defer); dev-only `console.error`. |
| Permission resolver returns `false` for an action triggered by a delta (real-time `subscribe`) | Deltas are applied directly to graph state; resolver is NOT consulted (deltas express remote facts, not user intent). Per decision #22. |
| `updateNode` on entity that doesn't exist | Returns `{ ok: false, code: "NOT_FOUND" }`; no history entry; no graphVersion bump. |
| Two simultaneous `updateNode` calls on same id (race) | Sequenced through Zustand's set-state queue; second sees first's result. Standard Zustand behavior. |
| Auto-id collision (id-factory generates duplicate) | id-factory uses `crypto.randomUUID()`; collision probability ~negligible. If somehow collides, the underlying graphology rejects with "Node X already exists"; force-graph throws. |

---

## 8. Performance + bundle

### 8.1 Performance

- Permission resolver is O(1) per call; ~5 conditionals; called once per CRUD action.
- Cascade collection is O(E + M) for deleteNode (E = incident edges, M = group memberships); bounded by graph fan-out (~10s for typical nodes).
- Composite history entry size scales with cascade size; ring-buffer cap (default 100) limits memory.
- `applyMutation` round-trip is async; doesn't block UI (optimistic apply).
- No new selectors in v0.3; existing v0.1/v0.2 selectors observe `graphVersion` per [decision #4](../../systems/graph-system/graph-system-description.md).

### 8.2 Bundle

v0.3 adds:
- Permission resolver: ~1KB
- Cascade-on-delete logic: ~1KB
- 5 CRUD action files: ~5-6KB total
- Auto-register-types: ~0.5KB
- id-factory (uses native `crypto.randomUUID`): ~0.2KB
- **v0.3 delta: ~7-9KB**

v0.1+v0.2+v0.3 cumulative: ~225KB (well under 300KB ceiling per [v0.1 plan §15](force-graph-v0.1-plan.md)). Comfortable headroom for v0.4-v0.6.

Tier 1 deps composed at host level are NOT counted (decision #35).

---

## 9. Risks & alternatives

### 9.1 Risks

| Risk | Mitigation |
|---|---|
| Cascade collection produces stale references (entity already deleted before cascade fires) | Phase A end gate smoke-tests; collection is single-pass under Zustand's atomic set; no inter-action interleaving. |
| Permission-resolver host predicate has side effects (throws, mutates state) | Caught at the call site per §7 edge case row; treated as `undefined` (defer); dev-only console.error. Host-bug-resilient. |
| `applyMutation` async race — local mutation X applied; server returns serverState that doesn't include X | Per decision #32: last-write-wins; X stays applied; serverState merged on top; `onError({ code: "STALE_WRITE" })` informs host. Banner UX is host-side per Q-P5. |
| Composite history entry undo applies inverses in wrong order, leaving inconsistent state | Inverses applied in REVERSE order (LIFO) per spec §5.5 + v0.2 §9.2 lock; smoke-test verifies in Phase B. |
| Schema reactivity auto-register fires repeatedly on every delta carrying the unknown type | After first auto-register, the type is in `state.nodeTypes`; subsequent references resolve normally. One-time per unknown id per session. |
| Annotation-via-applyMutation round-trip rolls back, leaving UI desynced | Optimistic update is fully reversed on rollback (graphologyAdapter exposes a "revert to snapshot" primitive); next render re-syncs. Smoke-test in Phase B. |
| Detail-panel + properties-form integration breaks under selection re-key | Per [detail-panel plan §4.5](../detail-panel-procomp/detail-panel-procomp-plan.md#45-composition-with-detail-panel-the-showcase-integration), properties-form is REMOUNTED on selection change; detail-panel handles via composite re-key wrapper. force-graph emits selection events; host's Tier 3 page wires the rest. v0.3 verifies in Phase C; if integration breaks, the host wiring (NOT force-graph) is at fault. |

### 9.2 Alternatives considered, rejected

- **Memoize permission-resolver results per (entity, action) pair** — rejected per Q-P1 (entity state mutates; cache risks stale read). Resolver is cheap enough to call per render.
- **Permission-tooltip rendered by force-graph** — rejected per decision #35; host owns UI for blocked actions; force-graph returns reason strings.
- **Built-in stale-write banner chrome** — rejected per Q-P5; host renders via `onError` callback. Decoupled.
- **Split `updateNode` into `updateNodeCanonical` + `updateNodeAnnotations`** — rejected per Q-P4; single API with internal dispatch is simpler for hosts. Routing decision is data-driven (origin × patch shape).
- **Reject the entire patch when canonical fields are blocked on a mixed-patch update** — accepted per Q-P4; partial-apply is more error-prone than all-or-nothing. Host re-submits with a clean patch.

---

## 10. Resolved plan-stage questions (recommendations; convert on sign-off)

10 questions. **High-impact:** Q-P1 (resolver architecture), Q-P4 (annotation routing semantics), Q-P6 (composite-entry atomicity). **Medium:** Q-P2 (mixed-permission boundary — re-confirms description §8.4 #7), Q-P3 (`NodeType.schema` carrier), Q-P5 (stale-write banner UX), Q-P7 (type-in-use refusal shape), Q-P10 (serverState reconciliation). **Low:** Q-P8 (auto-id), Q-P9 (auto-register notification surface).

### Q-P1 (NEW) — Permission-resolver internal architecture (per-render vs memoized)

**Recommendation: per-render, no memoization.** Resolver is O(1) (~5 conditionals); entity state changes via mutation, so caching would risk stale-read bugs. Called once per CRUD action — cost is dwarfed by the action itself. Phase A smoke-test verifies <0.1ms per call.

**Plus exception lock:** `pinNode` action uses a separate `edit-pinned` permission that defaults `allowed: true` regardless of origin (drag-to-pin works for system nodes — pinned state is layout-local, NOT canonical, per [v0.2 plan §16.5 #1](force-graph-v0.2-plan.md)).

**Impact:** high — defines the resolver call frequency and the layout-local-state exception.
**Trade-off:** none for the per-render call cost. The `edit-pinned` exception adds one more PermissionAction member; documented.

### Q-P2 (from description §8.4 #7) — Mixed-permission rendering boundary

**Recommendation: host computes per-field permissions; force-graph exposes only `origin` + `systemRef`** per description §8.4 #7 lock + properties-form §6.2 showcase. force-graph stays out of the schema-building business; the host uses force-graph's permission resolver outputs (or its own logic) to compute properties-form's `resolvePermission` prop per field.

`NodeType.schema?: PropertiesFormField[]` is the carrier (Q-P3 below) — force-graph never inspects this field.

**Impact:** medium — re-confirms description-level lock.
**Trade-off:** none — alternative ("force-graph derives schema-with-permissions automatically") was rejected at the description stage on coupling grounds.

### Q-P3 (from description §8.5 #3) — `NodeType.schema?: PropertiesFormField[]` carrier

**Recommendation: ship in v0.3** as an optional field on `NodeType`. force-graph never inspects the field (doesn't import properties-form's types); it just stores + returns it on snapshot export/import. Hosts attach per-NodeType schemas via this carrier and feed them to properties-form at the Tier 3 host level.

**Impact:** low — additive type extension.
**Trade-off:** type pollution if hosts don't use it; mitigated by `?:` (optional); zero runtime cost.

### Q-P4 (NEW) — Annotation routing semantics: split or unified `updateNode`?

**Recommendation: unified `updateNode` with internal dispatch.** Single API; force-graph routes per origin + patch shape per §4.3. Hosts call `updateNode(id, { annotations: { priority: 5 } })` regardless of entity origin; force-graph internally:
- `origin === "user"`: plain graphologyAdapter update.
- `origin === "system"`: route through `applyMutation({ type: "setAnnotation", ... })`.

Mixed patches (canonical + annotations on same call) on system entities: **all-or-nothing rejection** if any canonical field is blocked. Host re-submits with a clean patch.

**Alternatives considered:**
- **Split into `updateNodeCanonical` + `updateNodeAnnotations`** — rejected; doubles the action surface; hosts now need to know the origin before calling. Internal dispatch is cleaner.
- **Partial-apply on mixed patches** — rejected; subtle UX (host expects atomicity).

**Impact:** high — defines the data-side dispatch shape across the editing surface.
**Trade-off:** all-or-nothing rejection means a host with a mixed patch must re-submit twice (once for canonical, once for annotations). Acceptable; common in mixed-permission UIs.

### Q-P5 (NEW) — Stale-write banner UX: chrome or callback?

**Recommendation: callback only via existing `onError({ code: "STALE_WRITE", ... })`.** No built-in chrome. Host renders the banner per its design system. Mirrors description §6.4: force-graph emits the signal; UI is host-side.

**Impact:** medium — defines the v0.3 stale-write surface.
**Trade-off:** hosts must opt in to the banner; missed by hosts who don't subscribe to `onError` but in practice every host wires it for error reporting. v0.2 may add an optional `<ForceGraph.StaleWriteBanner>` compound part if real consumers report friction.

### Q-P6 (NEW) — Composite history entry atomicity for `deleteNode`

**Recommendation: collect-then-apply atomic.** Cascade collection (incident edges + group memberships) happens BEFORE any mutation fires. If collection fails (e.g., a cascade step throws), the entire delete is rejected; no partial state. If apply fails mid-way (a primitive op throws), log + bail + emit `onError({ code: "CASCADE_FAILED" })`; state may be inconsistent (rare under sane input).

**Impact:** high — defines the deleteNode reliability semantics.
**Trade-off:** atomic cascade is more code than greedy-delete-as-you-go (~30 LOC for the collect-pass). Worth it; partial-deletion bugs are notoriously hard to debug.

### Q-P7 (NEW) — `deleteNodeType` / `deleteEdgeType` refusal shape when type is in use

**Recommendation: structured return** `{ ok: false, code: "TYPE_IN_USE", entityIds: [...] } | { ok: true }`. Host UI prompts user to reassign entities to a different type before retrying delete.

`entityIds` lists the entities currently referencing the type. Host can highlight them on the canvas, offer batch-reassignment UI, etc.

Force-graph does NOT auto-reassign (would be destructive without user consent). Force-graph does NOT cascade-delete entities of a deleted type (also destructive).

**Impact:** medium — defines the type-management UX.
**Trade-off:** hosts have to write reassignment UI (one-pattern per host). Documented in usage; rich-card has no analog.

### Q-P8 (NEW) — Action input shapes (auto-id, origin defaults)

**Recommendation: auto-id when `input.id` is absent**; use `crypto.randomUUID()`. Origin is **always required** on `NewNodeInput` / `NewEdgeInput` — no default, no fallback (per decision #17). systemRef required iff origin === "system" — Phase A schema check enforces.

`groupIds` on `NewNodeInput` is OPTIONAL (defaults to `[]`); the `addNodeToGroup` action is the canonical path for group membership (which also updates the canonical `group.memberNodeIds` per decision #2).

**Impact:** low — input ergonomics.
**Trade-off:** none — auto-id is convenience; origin requirement is system #17 lock.

### Q-P9 (NEW) — Schema-reactivity notification surface

**Recommendation: emit via `onError`** with code `"UNKNOWN_NODE_TYPE_AUTO_REGISTERED"` (or `"UNKNOWN_EDGE_TYPE_AUTO_REGISTERED"`) per decision #24. Informational severity (NOT fatal). Host can surface a notification or silently ignore.

The auto-registered NodeType uses neutral defaults (`label: "Unknown type"`, `color: "var(--muted)"`, `icon: null`); host can `updateNodeType` later to give it real metadata.

**Impact:** low — error-channel surface.
**Trade-off:** sharing `onError` between fatal and informational events means host must check `code` to differentiate. Acceptable; alternative (separate `onWarning` callback) is API bloat for one use case.

### Q-P10 (NEW) — `applyMutation` `serverState` reconciliation

**Recommendation: server-authoritative for canonical fields; optimistic update kept by default.** When `applyMutation` returns `ok: true` with optional `serverState: GraphDelta`:

```
1. Apply delta to local store on top of the optimistic update.
2. If delta diverges from optimistic (e.g., server normalized the value):
     - Local store ends up with serverState's values (server wins).
     - Emit informational onError({ code: "STALE_WRITE", entityId, fieldKey, serverValue, localValue }).
3. If serverState is undefined (host's adapter doesn't return it):
     - Optimistic update stays as-is (no reconciliation possible).
```

Per decision #32, last-write-wins for v0.1: if upstream mutates an entity currently being edited locally, the local commit wins over the server's prior state, AND the server's response (if it includes the fresh server state post-our-mutation) wins over the local's optimistic. The "stale-write" banner informs the host that something changed remotely; host UI surfaces.

**Impact:** medium — defines the optimistic-update reconciliation flow.
**Trade-off:** "last-write-wins + warning" is the v0.1 simplification. Optimistic concurrency tokens are an additive upgrade per decision #32 if real-world conflicts warrant; not in v0.3 scope.

## 10.5 Plan-stage refinements (surfaced during draft)

These bake into implementation but worth flagging:

1. **`pinNode` as standalone action**, distinct from drag-coalesced pin in v0.2. v0.2's drag interaction produces ONE history entry combining position + (maybe) pin; v0.3's standalone `pinNode(id, true/false)` is its own entry per spec §5.5.
2. **`onError` codes (cumulative across all force-graph phases)**: v0.1 introduces `INVALID_SNAPSHOT`, `MISSING_ORIGIN`, `MISSING_SYSTEM_REF`. v0.3 adds: `STALE_WRITE`, `MUTATION_THROW`, `UNKNOWN_NODE_TYPE_AUTO_REGISTERED`, `UNKNOWN_EDGE_TYPE_AUTO_REGISTERED`, `TYPE_IN_USE`, `CASCADE_FAILED`, `NOT_FOUND`, `PERMISSION_DENIED` (when permission resolver blocks). Plan-stage codifies the union; v0.3 plan locks the v0.3-introduced subset.
3. **`graphologyAdapter.snapshot()` and `.restoreSnapshot()`** — primitives for optimistic-update rollback. Used by §4.3 annotation routing's rollback path. v0.1 may have shipped these as private adapter methods; v0.3 surfaces them as adapter API (still NOT public to consumers).
4. **`resolvePermission` host predicate is called inside CRUD action handlers, NOT inside renders.** No hot-path concern; documented for hosts who might worry.
5. **Group CRUD is included in v0.3 even though hull rendering is v0.4.** Data layer for groups + memberships ships now; v0.4 adds the visual rendering. Host code can call `addGroup` / `addNodeToGroup` from v0.3 onward; the group exists in state but renders nothing on the canvas until v0.4 adds the hull overlay.
6. **`updateNode` patch with `position` field** — accepted in v0.3; routes through standard graphologyAdapter; bumps graphVersion. Distinct from drag's `setNodePositions` (v0.2 silent batch). Generally hosts use drag for interactive moves and `updateNode({ position })` for programmatic placements.
7. **`addEdge` between two system nodes stamps `origin: "user"`.** Force-graph enforces this automatically per [decision #21](../../systems/graph-system/graph-system-description.md); host's input can omit origin for cross-system edges (force-graph defaults to "user"). Documented in usage.
8. **`PartialNode` excludes `id`, `origin`, `systemRef`** at the type level. Mutating these post-create requires delete + re-add, intentionally. Documented.
9. **Auto-id factory uses `crypto.randomUUID()`** — a Web standard; no third-party dep. Same UUIDv4 shape across all environments (Node 19+, browsers).
10. **No new selectors in v0.3.** v0.1 + v0.2 selectors (`visibleNodeIds`, `neighborsOf`, etc.) all observe `graphVersion`; CRUD actions bump it; selectors re-fire automatically. v0.4 adds filter-related selectors.

---

## 11. Definition of "done" for THIS document (stage gate)

- [ ] User reviewed §1–§9 (the plan body) and §10 (Q-Ps + §10.5 refinements).
- [ ] All 10 plan-stage questions resolved (Q-P1 to Q-P10).
- [ ] User said **"go ahead"** — sign-off applied. Stage 3 (implementation) unlocks: v0.3 implementation runs sequentially after v0.2 lands; gated on Phase 0 risk spike like v0.1 + v0.2.
- [ ] `Recommendation:` form converted to `**Locked: X.**`; status header flipped; [system §9 sub-doc map](../../systems/graph-system/graph-system-description.md#9-sub-document-map) updated to mark `force-graph` v0.3 plan ✓ signed off.

---

*End of v0.3 plan draft. Pause for user validate pass per project cadence (draft → validate → re-validate → sign off → commit).*
