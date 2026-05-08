# `force-graph` v0.3 Plan (Stage 2, Phase 3 of 6) — Editing Layer

> **Status:** **signed off 2026-04-29** (with [system decision #38](../../systems/graph-system/graph-system-description.md#8-locked-decisions-index) amendment 2026-04-29 cascade applied: editorial-only — Phase 0 risk spike CANCELLED, so the "gated on Phase 0 risk spike" pre-condition no longer applies; v0.3 doesn't touch edge rendering substrate). Validate-pass refinements applied (7 fixes: 5 substantive + 2 minor — **group CRUD scope creep removed** (deferred to v0.4 per description §2.4 lock); **annotation routing rewrite** for full applyMutation matrix (user-origin updateNode + system-origin setAnnotation paths); **PermissionAction enum cleanup** (added `edit-pinned` + `edit-direction`; dropped unused `edit-group-membership`; addNode/addEdge don't gate); **CRUD return shape consolidation** (all actions return discriminated `CrudResult`); **NodeType.schema typing as `ReadonlyArray<unknown>`** to honor decision #35 (no PropertiesFormField import); composite atomicity §4.1 covers all deletes; Q-P10 divergence detection locked at field-level pre-mutation snapshot). All 10 Q-Ps locked.
> **Phase:** v0.3 — Editing layer (CRUD with permissions); 2 weeks focused per [system §10.3](../../systems/graph-system/graph-system-description.md#103-tier-2-force-graph-phasing).
> **Parent description:** [force-graph-procomp-description.md §2.3](force-graph-procomp-description.md#23-v03--editing-layer-2-weeks) (signed off 2026-04-28).
> **Predecessors:** [v0.1 plan](force-graph-v0.1-plan.md) (viewer core; signed off 2026-04-28) + [v0.2 plan](force-graph-v0.2-plan.md) (interaction infrastructure; signed off 2026-04-29).
> **Cascade unlocked by:** [`properties-form` plan](../properties-form-procomp/properties-form-procomp-plan.md) + [`detail-panel` plan](../detail-panel-procomp/detail-panel-procomp-plan.md) (both signed off 2026-04-29).
> **Composes (host-side, NOT registry-side per [decision #35](../../systems/graph-system/graph-system-description.md)):** properties-form, detail-panel.

---

## 1. Inherited inputs (one paragraph)

Builds on v0.2's interaction infrastructure (selection / hover / drag / undo / linking-mode / compound API). v0.3 activates: **Node + Edge + Type CRUD** action surface (~9 new actions; group CRUD deferred to v0.4 per description §2.4 lock — validate-pass refinement #1), origin-aware permission resolver (full implementation per [decision #25](../../systems/graph-system/graph-system-description.md)), system-canonical-field read-only enforcement (decision #23), `applyMutation` routing across all user mutations in live-source mode (decision #33; full matrix per validate-pass refinement #2), schema reactivity via graceful degradation (decision #24), stale-write conflict policy (decision #32 — last-write-wins + banner). Composes [`properties-form` plan](../properties-form-procomp/properties-form-procomp-plan.md) (mixed-permission entity editing per its §6.2 showcase) and [`detail-panel` plan](../detail-panel-procomp/detail-panel-procomp-plan.md) (inline edit per decision #6) AT THE HOST/Tier 3 LEVEL only — force-graph itself imports neither (decision #35; **single most violated rule**). Inherits the v0.1 + v0.2 locks: origin field mandatory (decision #17), two-layer state (graphology imperative + Zustand reactive), `useGraphSelector` observes `graphVersion` (decision #4), composite transactional history entries (v0.2 §9), UI-state cascade-on-delete (v0.1 scaffolded, v0.2 activated, v0.3 amplified by user-driven deletes).

---

## 2. v0.3 scope summary

The v0.3 deliverable is the **editing layer** activated on top of v0.2's interaction infrastructure. v0.2 wired the canvas-side state and undo machinery; v0.3 wires the actions that mutate state. Group CRUD is **deferred to v0.4** per description §2.4 (validate-pass refinement #1).

- **Node CRUD** — `addNode`, `updateNode`, `deleteNode`, `pinNode` (single-node pin already in v0.2 drag-coalesced; v0.3 surfaces it as a standalone action).
- **Edge CRUD** — `addEdge`, `updateEdge`, `deleteEdge`. Unified — accepts any endpoint kind combination; dispatches internally to graphology-native (node↔node) or group-edge slice (group-involving — group endpoints exist in v0.4+, but the dispatch path is wired in v0.3 for forward-compatibility).
- **Type CRUD** — `addNodeType` / `updateNodeType` / `deleteNodeType` + `addEdgeType` / `updateEdgeType` / `deleteEdgeType`. Delete refuses if any entity references the type (returns `CrudResult` with `ok: false`, `code: "TYPE_IN_USE"`, `entityIds` populated per Q-P7).
- **Origin-aware permission resolver** — full implementation per [decision #25](../../systems/graph-system/graph-system-description.md) + [system §5](../../systems/graph-system/graph-system-description.md#5-permission-resolver-pattern-cross-cutting). 4-layer resolution: predicate escape hatch → per-entity meta lock → origin × action defaults → fallback allow. Host supplies optional `resolvePermission` prop for layer 1.
- **System-canonical-field read-only enforcement** ([decision #23](../../systems/graph-system/graph-system-description.md)) — `updateNode` on a `system`-origin node rejects edits to canonical fields (everything except `annotations`); structured `CrudResult` returned (`ok: false; code: "PERMISSION_DENIED"`).
- **Annotations through `applyMutation`** ([decision #33](../../systems/graph-system/graph-system-description.md)) — full live-source-mode routing matrix per Q-P4 lock + §4.3: user-origin entities use `applyMutation({ type: "updateNode", ... })`; system-origin annotations use `applyMutation({ type: "setAnnotation", ... })`; system-origin canonical patches blocked at resolver layer 3 before reaching applyMutation.
- **User-edges-between-system rule** ([decision #21](../../systems/graph-system/graph-system-description.md)) — `addEdge` between two system nodes stamps `origin: "user"` automatically (no host action needed; force-graph enforces).
- **Schema reactivity by graceful degradation** ([decision #24](../../systems/graph-system/graph-system-description.md)) — when `updateNode` references an unknown `schemaType`, auto-register a neutral default `NodeType` and surface via `onError` (no crash).
- **Stale-write conflict policy** ([decision #32](../../systems/graph-system/graph-system-description.md)) — last-write-wins for v0.1: if `applyMutation` returns `ok: true` AND `serverState` reflects a divergent canonical at any locally-mutated field (per Q-P10 field-level comparison), local mutation has already been applied; host receives a warning event (`onError({ code: "STALE_WRITE", ... })`). Banner chrome is host-side per Q-P5 (force-graph emits the signal; host renders the UI).
- **Cascade-on-delete amplified** — v0.2 scaffolded UI-state cascade (selection / hovered / linkingMode / multiEdgeExpanded); v0.3 adds the data-mutation cascade for `deleteNode`: cascades to incident edges (UI-state cascade for refs follows). `deleteEdge` cascades to UI-state refs only (no further data). All produce single composite transactional history entries (one entry per user action; multiple primitive inverses per spec §5.5 and v0.2 §9.2). Same collect-then-apply atomicity for both per Q-P6.
- **Composite history entries for CRUD** — v0.2 shipped the ring buffer and the entry shape (`{ label, forwards, inverses }`); v0.3 produces real composite entries from CRUD actions (deleteNode = single entry containing N+1 primitive inverses for the cascade).
- **CRUD return shape consolidation** — all CRUD actions return discriminated `CrudResult` per validate-pass refinement #4. Hosts always check `result.ok`; permission-block, type-in-use, not-found, mutation-throw all surface uniformly.
- **Permission-tooltip pattern** — port from rich-card's [permission-tooltip.tsx](../../../src/registry/components/data/rich-card/parts/permission-tooltip.tsx). Force-graph itself doesn't render UI for blocked actions (Tier 3 host owns toolbar + buttons); but `CrudResult.reason` strings flow to host for `Tooltip` wiring.
- **Detail-panel inline-edit composition** ([decision #6](../../systems/graph-system/graph-system-description.md)) — fully a host concern. Force-graph exposes the action surface; Tier 3 page composes `<DetailPanel>` + `<PropertiesForm>` + force-graph actions (description §6.3). v0.3 verifies the contract via the integration showcase but ships zero new force-graph code for it (decision #35).

**Doesn't ship in v0.3** (per description §2.4–§2.6): **group CRUD** (v0.4 — `addGroup`/`updateGroup`/`deleteGroup`/`addNodeToGroup`/`removeNodeFromGroup`); group hull rendering (v0.4); filter-stack composition (v0.4); doc-node visuals (v0.5); markdown-editor integration (v0.5); search (v0.6); advanced settings UI (v0.6).

**Implementation budget:** ~2 weeks focused (per system §10.3). Sequential after v0.2 implementation lands; ~~gated on Phase 0 risk spike like v0.1 + v0.2~~ Phase 0 risk spike CANCELLED per [#38](../../systems/graph-system/graph-system-description.md#8-locked-decisions-index) (2026-04-29) — no spike prerequisite for v0.1/v0.2/v0.3.

---

## 3. Final v0.3 API additions (locked)

Builds on v0.1's props/handle/actions/selectors and v0.2's compound API. v0.3 adds new actions, one new prop, and one new type-level concept (`CrudResult`); no breaking changes.

### 3.1 New props + permission types

```ts
// Added to ForceGraphProps and ForceGraph.Provider props
interface EditingProps {
  resolvePermission?: (
    entity: Node | Edge | Group,
    action: PermissionAction,
    ctx: PermissionContext
  ) => boolean | undefined;        // returns undefined to defer to next layer
}

// PermissionAction enum (validate-pass refinement #3 — added edit-pinned + edit-direction;
// dropped edit-group-membership; addNode/addEdge do NOT gate via resolver per §5.2 lock)
type PermissionAction =
  | "edit-canonical"      // mutate canonical fields on user nodes; rejected on system entities
  | "edit-annotations"    // mutate annotations field
  | "edit-pinned"          // toggle pinned state — layout-local, ALLOWED on system per v0.2 §16.5 #1
  | "edit-direction"       // mutate edge direction — separate from canonical for finer-grained policy
  | "delete"
  | "add-to-group"         // forward-compatible; v0.4 starts using when group CRUD lands
  | "remove-from-group"    // forward-compatible; v0.4 starts using
  | "connect-edge";

interface PermissionContext {
  origin: "system" | "user";
  hasMetaLock: boolean;             // entity.metadata.__locked === true
  fieldKey?: string;                // when action === "edit-canonical", the specific field being edited
}
```

### 3.2 `CrudResult` discriminated return type (validate-pass refinement #4)

```ts
type CrudErrorCode =
  | "PERMISSION_DENIED"             // resolver blocked
  | "NOT_FOUND"                     // entity id doesn't exist
  | "TYPE_IN_USE"                   // deleteType refused; entityIds populated
  | "INVALID_INPUT"                 // schema check failed (missing origin, etc.)
  | "CASCADE_FAILED"                // mid-apply throw; partial state possible
  | "MUTATION_THROW"                // applyMutation rejected/threw
  ;

type CrudResult<TOk = void> =
  | (TOk extends void ? { ok: true } : { ok: true } & TOk)
  | { ok: false; code: CrudErrorCode; reason?: string; entityIds?: readonly string[] };
```

`STALE_WRITE` is NOT a CrudResult code — it surfaces via `onError` because it's informational on a successful mutation (decision #32 + Q-P10).

### 3.3 New actions (~9 total per validate-pass refinement #1; group CRUD deferred to v0.4)

```ts
interface ActionsV03Additions {
  // Node CRUD
  addNode(input: NewNodeInput): CrudResult<{ id: string }>;
  updateNode(id: string, patch: PartialNode): CrudResult;
  deleteNode(id: string): CrudResult;

  // pinNode — surfaced in v0.2 inside drag; v0.3 adds the standalone action
  pinNode(id: string, pinned: boolean): CrudResult;       // single-node, recorded as own history entry

  // Edge CRUD
  addEdge(input: NewEdgeInput): CrudResult<{ id: string }>;
  updateEdge(id: string, patch: PartialEdge): CrudResult;
  deleteEdge(id: string): CrudResult;

  // Type CRUD
  addNodeType(input: Omit<NodeType, "id">): CrudResult<{ id: string }>;
  updateNodeType(id: string, patch: Partial<NodeType>): CrudResult;
  deleteNodeType(id: string): CrudResult;                 // ok:false code "TYPE_IN_USE" with entityIds populated
  addEdgeType(input: Omit<EdgeType, "id">): CrudResult<{ id: string }>;
  updateEdgeType(id: string, patch: Partial<EdgeType>): CrudResult;
  deleteEdgeType(id: string): CrudResult;                 // ok:false code "TYPE_IN_USE" with entityIds populated
}

interface NewNodeInput {
  id?: string;                                            // optional; auto-generated if absent (Q-P8)
  label: string;
  kind: "normal" | "doc";
  origin: Origin;                                          // mandatory per decision #17
  systemRef?: SystemRef;                                   // mandatory iff origin === "system"
  nodeTypeId: string;
  position?: { x: number; y: number };
  pinned?: boolean;
  // groupIds: omitted in v0.3 — groups don't exist yet; v0.4 reintroduces via addNodeToGroup action
  metadata?: Record<string, unknown>;
  annotations?: Record<string, unknown>;
  unresolvedWikilinks?: string[];                          // doc nodes only (decision #15)
}

type PartialNode = Partial<Omit<Node, "id" | "origin" | "systemRef">>;  // origin + systemRef immutable post-create
```

`PartialEdge` follows the same posture (id + origin immutable post-create; everything else patchable).

### 3.4 `NodeType.schema?` opaque carrier (Q-P3 + validate-pass refinement #5)

```ts
interface NodeType {
  // ...existing v0.1 fields (id, label, color, icon, etc.)
  schema?: ReadonlyArray<unknown>;        // opaque: host attaches PropertiesFormField[] from properties-form;
                                          // force-graph never inspects, only stores + serializes
                                          // (snapshot import/export round-trip). Decision #35 honored.
}
```

Same posture as `metadata?: Record<string, unknown>` — force-graph is the carrier, host owns the shape. Tier 3 page casts to `PropertiesFormField[]` when feeding properties-form. Force-graph cannot import properties-form's types per [decision #35](../../systems/graph-system/graph-system-description.md).

### 3.5 Permission action surface (Q-P1)

Internal `resolvePermission(entity, action, ctx) → ResolutionResult` is called inside CRUD action handlers. 4-layer resolution per [system §5.2](../../systems/graph-system/graph-system-description.md#52-layered-resolution):

1. **Host predicate** — `props.resolvePermission?.(entity, action, ctx)` returns `boolean | undefined`. `undefined` defers; `true`/`false` decides.
2. **Per-entity meta lock** — `entity.metadata?.__locked === true` → blocked; reason `"This entity is locked"`.
3. **Origin × action defaults** — table from system §5.1:
   - `system` + `"edit-canonical"` → blocked (`"System-origin canonical fields are read-only"`)
   - `system` + `"edit-direction"` → blocked (`"System-origin edge direction is read-only"`)
   - `system` + `"delete"` → blocked (`"System-origin entities cannot be deleted via this UI"`)
   - `system` + `"edit-pinned"` → **allowed** (layout-local; v0.2 §16.5 #1 lock)
   - `system` + `"edit-annotations"` → allowed
   - all others → allowed
4. **Fallback** → `allowed` (permissive default for unrecognized actions).

Implementation file: `lib/permission-resolver.ts`. Single function signature: `resolvePermission(entity, action, ctx, hostResolver?) → ResolutionResult`.

### 3.6 What's NOT in v0.3

- **No group CRUD** — `addGroup` / `updateGroup` / `deleteGroup` / `addNodeToGroup` / `removeNodeFromGroup` deferred to v0.4 per description §2.4 (validate-pass refinement #1).
- No filter-stack composition (v0.4).
- No group hull rendering / group gravity force (v0.4).
- No doc-node visuals or markdown-editor (v0.5).
- No search (v0.6).
- No multi-edge expansion UI (v0.6).
- No advanced-settings panel chrome (v0.6).
- No permission-tooltip rendered by force-graph itself — host owns it via `CrudResult.reason` (decision #35).

---

## 4. State model additions

v0.3 activates the dispatchers; the slice shapes from v0.1/v0.2 don't change.

### 4.1 graphologyAdapter — CRUD methods activated; collect-then-apply for deletes

v0.1 shipped `addNode` / `updateNode` / `deleteNode` / etc. as the adapter boundary; v0.1/v0.2 didn't surface them as public actions. v0.3 wires the action layer with `CrudResult` returns.

**Collect-then-apply atomicity (Q-P6 lock — applies to both `deleteNode` and `deleteEdge`):**

```
public action addNode(input) → CrudResult<{ id: string }>
  → validate input (origin required; systemRef required iff origin=system; etc.)
  → if validation fails: return { ok: false, code: "INVALID_INPUT", reason: "..." }
  → schema-reactivity check: if input.nodeTypeId not in state.nodeTypes:
       auto-register neutral default; emit onError({ code: "UNKNOWN_NODE_TYPE_AUTO_REGISTERED", ... })
  → graphologyAdapter.addNode(input)        // bumps graphVersion
  → record history entry { label: "Add node ${input.label}", forwards: [...], inverses: [deleteNode(id)] }
  → return { ok: true, id }

public action updateNode(id, patch) → CrudResult
  → if entity not found: return { ok: false, code: "NOT_FOUND" }
  → split patch into canonical-fields vs annotations
  → check resolvePermission per field-class:
       canonical patch on system-origin → return { ok: false, code: "PERMISSION_DENIED", reason: "..." }
       any other block → return ditto
  → route per origin + applyMutation (§4.3 matrix)
  → optimistic apply local first; await server if applyMutation present
  → record history entry { label: "Edit ${entity.label}", inverses: [updateNode(id, prevPatch)] }
  → return { ok: true } on success; { ok: false } on rollback

public action deleteNode(id) → CrudResult
  → if entity not found: return { ok: false, code: "NOT_FOUND" }
  → resolvePermission(entity, "delete", ctx) → blocked? return { ok: false, code: "PERMISSION_DENIED", reason }
  → COLLECT cascades:
       incident edges (from graphology — group-involving in v0.4)
       (no group memberships in v0.3 — group CRUD deferred)
  → COLLECT primitive inverses for each cascade target (edge restorations, node restoration)
  → if collection throws: return { ok: false, code: "CASCADE_FAILED", reason: err.message }
  → APPLY atomically (in order):
       graphologyAdapter.deleteEdgesByEndpoint(id)  // each as primitive op
       graphologyAdapter.deleteNode(id)
  → if apply throws mid-way: log + emit onError({ code: "CASCADE_FAILED", ... }); state may be inconsistent
  → activate UI-state cascade (v0.2 §4.5): clear selection / hovered / multiEdgeExpanded / linkingMode if they reference id
  → record SINGLE composite history entry { label: "Delete ${entity.label}", forwards: [...all-deletions], inverses: [...all-restorations-in-reverse] }
  → graphVersion increments once at the end (single render trigger)
  → return { ok: true }

public action deleteEdge(id) → CrudResult
  → if entity not found: return { ok: false, code: "NOT_FOUND" }
  → resolvePermission(entity, "delete", ctx) → blocked? return blocked result
  → COLLECT primitive inverse (edge restoration data captured pre-delete)
  → APPLY: graphologyAdapter.deleteEdge(id)
  → activate UI-state cascade (UI-state only — no data cascade since edges have no children)
  → record history entry { label: "Delete edge", forwards: [deleteEdge(id)], inverses: [addEdge(prev)] }
  → return { ok: true }
```

The collect-then-apply principle: **cascade collection completes before any mutation fires; partial-deletion failure mode rejected by design** (validate-pass refinement #6 — explicit for both delete actions).

### 4.2 Edit-history slice — composite entry production

v0.2 §9.2 locked the entry shape; v0.3 produces real composite entries:

| Action | forwards | inverses |
|---|---|---|
| `addNode` | `[addNode(input)]` | `[deleteNode(id)]` |
| `updateNode(id, patch)` | `[updateNode(id, patch)]` | `[updateNode(id, prevPatch)]` (prevPatch captured pre-mutation) |
| `deleteNode(id)` | `[deleteNode(id), ...edgeDeletes]` | `[restoreNode(prev), ...edgeRestores]` (reverse order on undo) |
| `pinNode(id, pinned)` | `[pinNode(id, pinned)]` | `[pinNode(id, !pinned)]` |
| `addEdge` | `[addEdge(input)]` | `[deleteEdge(id)]` |
| `updateEdge` | `[updateEdge(id, patch)]` | `[updateEdge(id, prevPatch)]` |
| `deleteEdge` | `[deleteEdge(id)]` | `[addEdge(prev)]` |
| Type CRUD (add/update) | `[addType / updateType]` | `[deleteType / updateType (prev)]` |
| Type CRUD (delete) | `[deleteType]` | `[addType(prev)]` (only when ok: true; type-in-use blocks the mutation) |
| `setAnnotation` (via updateNode → applyMutation; §4.3 system-origin path) | `[setAnnotation(entityId, key, value)]` | `[setAnnotation(entityId, key, prevValue)]` |

Group rows deferred to v0.4 (validate-pass refinement #1).

`PrimitiveOp` is a discriminated union; the redo path applies `forwards` in order; the undo path applies `inverses` in reverse order. Both via `graphologyAdapter` directly (no resolver re-check on undo/redo — Q-P10 + plan-stage refinement #4).

### 4.3 Annotation routing — full applyMutation matrix (Q-P4 + validate-pass refinement #2)

When `updateNode(id, patch)` is called, routing depends on `(entity.origin × patch shape × applyMutation presence)`:

```
IF entity.origin === "user":
    IF dataSource.applyMutation present:
        // Live source mode: round-trip user mutations through host's applyMutation
        const result = await dataSource.applyMutation({ type: "updateNode", id, patch });
        if !result.ok: rollback optimistic; return { ok: false, code: "MUTATION_THROW", reason: result.error.message };
        if result.serverState: reconcile per Q-P10 (field-level diff; emit STALE_WRITE if divergent);
        return { ok: true };
    ELSE:
        // Static snapshot mode: local-only
        graphologyAdapter.updateNode(id, patch);
        return { ok: true };

IF entity.origin === "system":
    IF patch contains canonical fields (anything except annotations):
        // Resolver layer 3 already blocks at the action entry; this branch is unreachable when
        // permission check fires correctly. Defense-in-depth fallback:
        return { ok: false, code: "PERMISSION_DENIED", reason: "System-origin canonical fields are read-only" };

    // Annotation-only patch on system-origin entity
    IF dataSource.applyMutation present:
        // Per-key setAnnotation routing (decision #33)
        for each (key, value) in patch.annotations:
            const result = await dataSource.applyMutation({ type: "setAnnotation", entityId: id, key, value });
            if !result.ok: rollback this key; collect errors; emit onError per error; continue
            if result.serverState: reconcile per Q-P10
        return { ok: <all-succeeded> };
    ELSE:
        // No applyMutation supplied; persist annotations locally (graphology has no annotations field
        // for system entities in canonical sense; we update entity.annotations in-place)
        dev-only console.warn once per session: "Setting annotations on system entity without applyMutation; persists locally only"
        graphologyAdapter.updateNode(id, { annotations: { ...prev.annotations, ...patch.annotations } });
        return { ok: true };
```

The `applyMutation` calls are async; the action handler awaits per spec §6.4. Optimistic update applied locally before await; rolled back on failure. Per Q-P4 lock: **mixed patches on system-origin entities are blocked atomically** (any canonical-field write rejects the whole patch; annotations not applied either).

For canonical-field updates on user-origin nodes WITHOUT `applyMutation`, no round-trip — local state is canonical for user data in static-snapshot mode.

### 4.4 Schema reactivity (decision #24)

When `addNode` or `updateNode` references a `nodeTypeId` not in `state.nodeTypes`:

```
on action: addNode({ nodeTypeId: "unknown-id", ... })
  → check: state.nodeTypes has "unknown-id"? No.
  → auto-register: addNodeType({ id: "unknown-id", label: "Unknown type", color: "var(--muted)", icon: null })
  → emit onError({ code: "UNKNOWN_NODE_TYPE_AUTO_REGISTERED", message: "Type 'unknown-id' was not registered; auto-registered with neutral defaults", entityId: nodeId, typeId: "unknown-id" })
  → continue addNode normally
```

Same for `edgeTypeId` → `addEdgeType` auto-registration. The `onError` is informational (not fatal); host can surface a notification but the operation succeeds. After first auto-register, the type is in state; subsequent references resolve normally — one-time per unknown id per session.

### 4.5 UI-state cascade-on-delete amplified

v0.2 §4.5 wired the cascade. v0.3 amplifies it with the data-driven cascades:

- `deleteNode(id)`: per spec §5.2, in this order:
  1. Collect incident edges (from graphology).
  2. UI-state cascade: clear selection/hovered/linkingMode/multiEdgeExpanded if they reference id (or, for multiEdgeExpanded, if either endpoint was deleted).
  3. Apply data deletions atomically: edges → node.
  4. graphVersion increments once at the end (single render trigger).

- `deleteEdge(id)`: only UI-state cascade fires (no data cascade — edges have no children).
- `deleteGroup(id)`: deferred to v0.4 per validate-pass refinement #1.

Both delete operations produce single composite history entries (Q-P6 lock; collect-then-apply atomicity).

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
    try {
      const result = hostResolver(entity, action, ctx);
      if (result === true) return { allowed: true };
      if (result === false) return { allowed: false, reason: "Blocked by host policy" };
      // result === undefined → defer to next layer
    } catch (err) {
      // Q-P1 + edge case row: host predicate throws → treat as undefined (defer); dev-only console.error
      if (process.env.NODE_ENV !== "production") console.error("[force-graph] resolvePermission threw:", err);
    }
  }

  // Layer 2: per-entity meta lock
  if (ctx.hasMetaLock) {
    return { allowed: false, reason: "This entity is locked" };
  }

  // Layer 3: origin × action defaults
  if (ctx.origin === "system") {
    if (action === "edit-canonical") return { allowed: false, reason: "System-origin canonical fields are read-only" };
    if (action === "edit-direction") return { allowed: false, reason: "System-origin edge direction is read-only" };
    if (action === "delete") return { allowed: false, reason: "System-origin entities cannot be deleted via this UI" };
    // edit-pinned, edit-annotations, add-to-group, remove-from-group, connect-edge → allowed
  }

  // Layer 4: fallback
  return { allowed: true };
}
```

Per Q-P1: invoked on every CRUD action (except create operations — see §5.2); **NOT memoized** (entity state changes via mutation, so caching introduces stale-read risk). Cost is O(1) per call; ~5 conditionals; negligible.

### 5.2 Action → permission-action mapping (validate-pass refinement #3)

| Action | PermissionAction(s) checked | Notes |
|---|---|---|
| `addNode` | **none** — creation is host-UI-gated, not API-gated (refined on validate pass per system §5.1 origin × action table; no "create" row) | Force-graph allows; host's UI shows/hides the create button |
| `addEdge` | **none** — same as addNode | + per [decision #21](../../systems/graph-system/graph-system-description.md): user-edge between two system nodes stamps `origin: "user"` automatically |
| `updateNode(patch)` | per patch class: `"edit-canonical"` if any non-annotation field; `"edit-annotations"` if patch.annotations | Splits per-class; canonical-only patches blocked on system entities; mixed patches all-or-nothing per Q-P4 |
| `deleteNode` | `"delete"` | Blocked on system entities by default |
| `pinNode` | `"edit-pinned"` | **Layout-local; ALLOWED on system per v0.2 §16.5 #1** — drag-to-pin works on system nodes too |
| `updateEdge(patch)` | `"edit-canonical"` if any field except direction; `"edit-direction"` if direction; `"edit-annotations"` if annotations | Edge `origin` immutable per #17 |
| `deleteEdge` | `"delete"` | System-origin edges blocked by default; user-origin edges allowed |
| `addNodeType` / `updateNodeType` / `deleteNodeType` (and edge variants) | **none** — types aren't entities | Type deletion enforces "type-in-use" via referential check (Q-P7 `CrudResult` with `code: "TYPE_IN_USE"`), NOT permission resolver |
| `setAnnotation` (via updateNode for system origin) | `"edit-annotations"` | Default-allowed for both origins |

(Group rows deferred to v0.4 per validate-pass refinement #1.)

### 5.3 UI integration (host's responsibility)

When force-graph's CRUD action returns `{ ok: false, reason }`, the host's UI:

1. Skips the optimistic update (the action returned without dispatching).
2. Renders the reason string in a tooltip, toast, or inline error message — host's choice.
3. Force-graph itself **does not render** any blocking-UX chrome — pure host concern (decision #35; rich-card's [permission-tooltip.tsx](../../../src/registry/components/data/rich-card/parts/permission-tooltip.tsx) is the reference pattern).

For the `<PropertiesForm>` integration (description §6.3), the host computes per-field permissions from origin via the resolver and supplies them to properties-form's `resolvePermission` prop — covered by [properties-form plan §5](../properties-form-procomp/properties-form-procomp-plan.md#5-permission-resolver-own-implementation-per-decision-25).

---

## 6. File-by-file plan (additions to v0.2)

### 6.1 New files in v0.3

```
src/registry/components/data/force-graph/
├── lib/
│   ├── permission-resolver.ts            # full 4-layer resolver (was: scaffolding in v0.1)
│   ├── cascade-on-delete.ts              # data cascades for deleteNode + deleteEdge (group cascade scaffolded for v0.4)
│   ├── auto-register-types.ts            # decision #24 — schema reactivity
│   ├── id-factory.ts                     # auto-id for NewNodeInput / NewEdgeInput when absent
│   └── crud-result.ts                    # CrudResult type + factory helpers (Q-P7 + validate-pass refinement #4)
├── store/
│   └── actions/
│       ├── crud-node.ts                  # addNode, updateNode, deleteNode, pinNode (standalone)
│       ├── crud-edge.ts                  # addEdge, updateEdge, deleteEdge
│       ├── crud-types.ts                 # addNodeType / updateNodeType / deleteNodeType + edge-type variants
│       └── set-annotation.ts             # internal dispatch for updateNode → applyMutation routing matrix
```

**File count delta (validate-pass refinement #1):** +9 files (was +9 with group CRUD; same count after substituting `crud-group.ts` removal with `crud-result.ts` added). Total v0.3 files (cumulative from v0.1's structure): ~50-55.

(`crud-group.ts` deferred to v0.4.)

### 6.2 Modified files in v0.3

- `force-graph.tsx` — adds `resolvePermission` prop pass-through to Provider context.
- `store/store.ts` — wires the new actions; no slice-shape changes.
- `types.ts` — adds `PermissionAction`, `PermissionContext`, `HostPermissionResolver`, `NewNodeInput`, `NewEdgeInput`, `PartialNode`, `PartialEdge`, `ResolutionResult`, `CrudResult`, `CrudErrorCode`. Also adds `NodeType.schema?: ReadonlyArray<unknown>` (validate-pass refinement #5 — opaque carrier).
- `lib/graphology-adapter.ts` — exposes the CRUD primitives (was: `addNode` / etc. internal-only in v0.1); adds `snapshot()` / `restoreSnapshot()` for optimistic-rollback (§10.5 #3).
- `parts/canvas.tsx` — no-op for v0.3.
- `dummy-data.ts` — adds editing-flow demo fixtures.
- `demo.tsx` — adds the editing showcase (mixed-permission entity; properties-form composition).
- `usage.tsx` — adds the v0.3 host wiring recipe (DetailPanel + PropertiesForm + force-graph actions).

### 6.3 Build order within v0.3

Three internal phases, ~3-4 days each (~2 weeks total):

**Phase A — types + permission resolver + cascades (~3 days):**
- `types.ts` additions (including `CrudResult` + `NodeType.schema?: ReadonlyArray<unknown>`)
- `lib/crud-result.ts` (factory helpers: `ok()`, `err(code, reason?, entityIds?)`)
- `lib/permission-resolver.ts` (full 4-layer with try/catch on host predicate)
- `lib/cascade-on-delete.ts` (deleteNode + deleteEdge collect-then-apply)
- `lib/auto-register-types.ts`
- `lib/id-factory.ts` (uses `crypto.randomUUID()`)
- Phase A end gate: unit-test the resolver against the system §5.1 table including the system-pinned exception (`edit-pinned` allowed); smoke-test cascade collection (deleteNode produces the right inverse list); smoke-test auto-register-types fires on unknown nodeTypeId; smoke-test `CrudResult` factory shapes.

**Phase B — CRUD actions + composite history entries (~5 days):**
- `store/actions/crud-node.ts` (addNode, updateNode, deleteNode, pinNode)
- `store/actions/crud-edge.ts`
- `store/actions/crud-types.ts`
- `store/actions/set-annotation.ts` (full applyMutation routing matrix per §4.3)
- Wire actions into the Provider context; expose via the v0.2 `useGraphActions()` hook
- Phase B end gate: smoke-test single-action history entries (addNode, updateNode, pinNode); smoke-test composite entries (deleteNode produces N+1 inverses; undo restores everything atomically); smoke-test the system-canonical-field rejection path; **smoke-test annotation routing through applyMutation across the full matrix** (3 fixtures: static-snapshot user-update; live-source user-update; live-source system-annotation); smoke-test mixed-patch atomic rejection on system entity.

**Phase C — integration showcase + demo (~3-4 days):**
- Tier 3 host wiring (in `demo.tsx`): DetailPanel + PropertiesForm + force-graph actions per description §6.3
- Mixed-permission demo: a system node with read-only canonical fields + writable annotations
- Stale-write banner host-rendered example
- Verify `tsc + lint + build` clean
- Verify integration matches both [`properties-form` plan §6.2 mixed-permission showcase](../properties-form-procomp/properties-form-procomp-plan.md) AND [`detail-panel` plan §4.5 composition contract](../detail-panel-procomp/detail-panel-procomp-plan.md#45-composition-with-detail-panel-the-showcase-integration)

---

## 7. Edge cases (locked)

| Case | Handling |
|---|---|
| `addNode` with a `nodeTypeId` that doesn't exist | Auto-register a neutral default per decision #24 + §4.4; fire `onError({ code: "UNKNOWN_NODE_TYPE_AUTO_REGISTERED" })`; node creation succeeds with `{ ok: true, id }`. |
| `addNode` missing `origin` | `{ ok: false, code: "INVALID_INPUT", reason: "'origin' is required on every node" }` per decision #17. |
| `addNode` with `origin: "system"` but no `systemRef` | `{ ok: false, code: "INVALID_INPUT", reason: "'systemRef' required when origin === 'system'" }` per [v0.1 plan §6.1](force-graph-v0.1-plan.md). |
| `updateNode` on a system entity, patch contains canonical fields | Resolver returns blocked; action returns `{ ok: false, code: "PERMISSION_DENIED", reason: "System-origin canonical fields are read-only" }`; no mutation, no history entry. |
| `updateNode` on a system entity, patch contains BOTH canonical + annotations | Atomic rejection per Q-P4: `{ ok: false, code: "PERMISSION_DENIED" }`; annotations are NOT applied either. Host re-submits with a clean patch. |
| `updateNode` on a user entity with applyMutation present | Routes through `applyMutation({ type: "updateNode", ... })` per §4.3 (validate-pass refinement #2). On `ok: false`, rollback + `{ ok: false, code: "MUTATION_THROW" }`. |
| `updateNode` on a user entity without applyMutation | Plain graphologyAdapter update; local-canonical for static-snapshot mode. |
| `updateNode` with annotations on system entity, applyMutation undefined | Persists locally (annotations field on the node); fire dev-only `console.warn` once per session; returns `{ ok: true }`. |
| `applyMutation` rejects (`ok: false`) | Local optimistic update is rolled back via `graphologyAdapter.restoreSnapshot()`; `onError({ code: result.error.code, message: result.error.message })` fires; action returns `{ ok: false, code: "MUTATION_THROW" }`. |
| `applyMutation` returns `ok: true` with `serverState` (Q-P10) | Local optimistic update kept; serverState's overlapping fields merged on top (server-authoritative for canonical fields). Pre-mutation snapshot of locally-touched fields compared against serverState's values; any differing field emits informational `onError({ code: "STALE_WRITE", entityId, fieldKey, serverValue, localValue })` per decision #32 + Q-P10. |
| `applyMutation` throws (network error, etc.) | Local optimistic update rolled back; `onError({ code: "MUTATION_THROW", message: err.message })` fires; action returns `{ ok: false, code: "MUTATION_THROW" }`. |
| `deleteNode` while pinned | Pin state is part of the deletion's primitive inverses (re-pin on undo). |
| `deleteNode` while in linking mode with this node as source | UI-state cascade clears `linkingMode`; data cascade deletes the node + edges. Host re-renders. |
| `deleteEdge` for a `derivedFromWikilink: true` edge | v0.3 doesn't enforce decision #9 yet (lands in v0.5); programmatic `deleteEdge` accepts. |
| `deleteNodeType` while nodes use it | `{ ok: false, code: "TYPE_IN_USE", entityIds: [...] }` per Q-P7; no mutation. Host UI prompts for reassignment. |
| `addNodeToGroup` / `removeNodeFromGroup` | **Deferred to v0.4** per validate-pass refinement #1. v0.3 doesn't expose these actions. |
| Composite history entry partial failure | Q-P6 lock: collect-then-apply atomic. Cascade collection completes before apply; if any apply step throws, log + bail + emit `onError({ code: "CASCADE_FAILED", ... })`; state may be inconsistent (rare). |
| `resolvePermission` host predicate throws | Caught at the call site (§5.1); treated as `undefined` (defer); dev-only `console.error`. |
| Permission resolver returns `false` for an action triggered by a delta (real-time `subscribe`) | Deltas are applied directly to graph state; resolver is NOT consulted (deltas express remote facts, not user intent). Per decision #22. |
| `updateNode` on entity that doesn't exist | `{ ok: false, code: "NOT_FOUND" }`; no history entry; no graphVersion bump. |
| Two simultaneous `updateNode` calls on same id (race) | Sequenced through Zustand's set-state queue; second sees first's result. Standard Zustand behavior. |
| Auto-id collision (id-factory generates duplicate) | id-factory uses `crypto.randomUUID()`; collision probability ~negligible. If somehow collides, underlying graphology rejects with "Node X already exists"; force-graph returns `{ ok: false, code: "INVALID_INPUT" }`. |

---

## 8. Performance + bundle

### 8.1 Performance

- Permission resolver is O(1) per call; ~5 conditionals; called once per CRUD action handler (skipped for create operations per §5.2).
- Cascade collection is O(E) for `deleteNode` (E = incident edges); bounded by graph fan-out (~10s for typical nodes).
- Composite history entry size scales with cascade size; ring-buffer cap (default 100) limits memory.
- `applyMutation` round-trip is async; doesn't block UI (optimistic apply + rollback on failure).
- No new selectors in v0.3; existing v0.1/v0.2 selectors observe `graphVersion` per [decision #4](../../systems/graph-system/graph-system-description.md).

### 8.2 Bundle

v0.3 adds:
- Permission resolver: ~1KB
- Cascade-on-delete logic: ~0.7KB (smaller without group cascade)
- 4 CRUD action files: ~4-5KB total (smaller without crud-group.ts)
- Auto-register-types: ~0.5KB
- id-factory (uses native `crypto.randomUUID`): ~0.2KB
- CrudResult helpers: ~0.5KB
- **v0.3 delta: ~7-8KB** (~1KB lighter than draft-version with group CRUD)

v0.1+v0.2+v0.3 cumulative: ~225KB (well under 300KB ceiling per [v0.1 plan §15](force-graph-v0.1-plan.md)). Comfortable headroom for v0.4-v0.6.

Tier 1 deps composed at host level are NOT counted (decision #35).

---

## 9. Risks & alternatives

### 9.1 Risks

| Risk | Mitigation |
|---|---|
| Cascade collection produces stale references | Phase A end gate smoke-tests; collection is single-pass under Zustand's atomic set; no inter-action interleaving. |
| Permission-resolver host predicate has side effects (throws, mutates state) | Try/catch in §5.1; treated as `undefined` (defer); dev-only console.error. Host-bug-resilient. |
| `applyMutation` async race — local mutation X applied; server returns serverState that doesn't include X | Per decision #32: last-write-wins; X stays applied; serverState merged on top; field-level diff detects divergence; `onError({ code: "STALE_WRITE" })` informs host. Banner UX is host-side per Q-P5. |
| Composite history entry undo applies inverses in wrong order | Inverses applied in REVERSE order (LIFO) per spec §5.5 + v0.2 §9.2 lock; Phase B smoke-test verifies. |
| Schema reactivity auto-register fires repeatedly on every delta | After first auto-register, the type is in `state.nodeTypes`; subsequent references resolve normally. One-time per unknown id per session. |
| Annotation-via-applyMutation rollback leaves UI desynced | Optimistic update reversed via `graphologyAdapter.restoreSnapshot()` (§6.2 + §10.5 #3); next render re-syncs. Phase B smoke-test. |
| Mixed-patch atomic rejection on system entity is surprising to hosts | Documented in §10 edge case row + usage `usage.tsx`; host's properties-form integration naturally splits patches via field-level permissions, so mixed patches in practice are rare. |
| CrudResult discriminated return adds boilerplate | Factory helpers (`ok()`, `err()` in `lib/crud-result.ts`) reduce boilerplate. Hosts always have one consistent shape to handle. Net: less code than the throw-vs-return mixed approach. |
| Detail-panel + properties-form integration breaks under selection re-key | Per [detail-panel plan §4.5](../detail-panel-procomp/detail-panel-procomp-plan.md#45-composition-with-detail-panel-the-showcase-integration), properties-form is REMOUNTED on selection change; detail-panel handles via composite re-key wrapper. force-graph emits selection events; host's Tier 3 page wires the rest. v0.3 verifies in Phase C. |

### 9.2 Alternatives considered, rejected

- **Memoize permission-resolver results per (entity, action) pair** — rejected per Q-P1; entity state mutates; cache risks stale read. Resolver is cheap enough to call per render.
- **Permission-tooltip rendered by force-graph** — rejected per decision #35; host owns UI for blocked actions.
- **Built-in stale-write banner chrome** — rejected per Q-P5; host renders via `onError`. Decoupled.
- **Split `updateNode` into `updateNodeCanonical` + `updateNodeAnnotations`** — rejected per Q-P4; single API with internal dispatch is simpler. Routing decision is data-driven (origin × patch shape).
- **Partial-apply on mixed system-entity patches** (annotations apply when canonical blocked) — rejected per Q-P4; partial-apply is more error-prone than all-or-nothing. Host re-submits with a clean patch.
- **Throw-on-failure** for CRUD actions instead of CrudResult — rejected per validate-pass refinement #4; mixed throw/return is error-prone. Discriminated result is uniform.
- **Group CRUD in v0.3** — rejected on validate pass per refinement #1; description §2.4 locks group CRUD as v0.4. Removed from this plan.
- **`NodeType.schema?: PropertiesFormField[]`** typed import — rejected on validate pass per refinement #5; would violate decision #35 (Tier 2 → Tier 1 import). Locked as `ReadonlyArray<unknown>` opaque carrier.

---

## 10. Resolved plan-stage questions (locked on sign-off 2026-04-29)

10 questions. **Q-P3 + Q-P4 + Q-P7 refined on validate pass** (Q-P3: `schema?:` typed as opaque `ReadonlyArray<unknown>` not `PropertiesFormField[]` for decision #35; Q-P4 annotation routing rewritten with full applyMutation matrix across origin × patch × applyMutation-presence; Q-P7 consolidated to discriminated `CrudResult` across all CRUD actions, not just deleteType). **Group CRUD removed from v0.3** per validate-pass refinement #1. **High-impact:** Q-P1 (resolver architecture), Q-P4 (annotation routing semantics), Q-P6 (composite-entry atomicity). **Medium:** Q-P2 (mixed-permission boundary — re-confirms description §8.4 #7), Q-P3 (`NodeType.schema` carrier), Q-P5 (stale-write banner UX), Q-P7 (CrudResult shape across CRUD), Q-P10 (serverState reconciliation). **Low:** Q-P8 (auto-id), Q-P9 (auto-register notification surface).

### Q-P1 (NEW) — Permission-resolver internal architecture (per-render vs memoized)

**Locked: per-render, no memoization.** Resolver is O(1) (~5 conditionals); entity state changes via mutation, so caching would risk stale-read bugs. Called once per CRUD action handler — cost is dwarfed by the action itself. Phase A smoke-test verifies <0.1ms per call.

**Plus exception lock:** `pinNode` action uses a separate `edit-pinned` permission that defaults `allowed: true` regardless of origin (drag-to-pin works for system nodes — pinned state is layout-local, NOT canonical, per [v0.2 plan §16.5 #1](force-graph-v0.2-plan.md)). `edit-direction` similarly defaults blocked on system but is a distinct action from `edit-canonical` for finer-grained host policy.

**Impact:** high — defines the resolver call frequency and the layout-local-state exception.
**Trade-off:** none for the per-render call cost. Two extra PermissionAction members (`edit-pinned`, `edit-direction`); documented in §3.1.

### Q-P2 (from description §8.4 #7) — Mixed-permission rendering boundary

**Locked: host computes per-field permissions; force-graph exposes only `origin` + `systemRef`** per description §8.4 #7 lock + properties-form §6.2 showcase. force-graph stays out of the schema-building business; the host uses force-graph's permission resolver outputs (or its own logic) to compute properties-form's `resolvePermission` prop per field.

`NodeType.schema?: ReadonlyArray<unknown>` is the opaque carrier (Q-P3 + validate-pass refinement #5) — force-graph never inspects this field; host casts to `PropertiesFormField[]` when feeding properties-form.

**Impact:** medium — re-confirms description-level lock.
**Trade-off:** none — alternative ("force-graph derives schema-with-permissions automatically") was rejected at the description stage on coupling grounds.

### Q-P3 (from description §8.5 #3; refined on validate pass) — `NodeType.schema?:` carrier

**Locked: ship in v0.3 as `NodeType.schema?: ReadonlyArray<unknown>`** — opaque carrier per validate-pass refinement #5. force-graph never inspects the field (cannot import properties-form's types per decision #35); it just stores + serializes (snapshot import/export round-trip). Hosts attach per-NodeType schemas via this carrier and feed them to properties-form at the Tier 3 host level by casting.

**Refined on validate pass:** the original recommendation typed it as `PropertiesFormField[]` — but `PropertiesFormField` lives in properties-form's types. force-graph importing properties-form's types would violate decision #35 (the single most violated rule per HANDOFF.md). Locked as `ReadonlyArray<unknown>` to honor decision #35; same posture as `metadata?: Record<string, unknown>`.

**Impact:** medium — additive type extension; refined for decision #35 correctness.
**Trade-off:** hosts must cast (`schema as PropertiesFormField[]`) when feeding properties-form. Acceptable; documented in usage.

### Q-P4 (NEW; refined on validate pass) — Annotation routing semantics

**Locked: unified `updateNode` with internal dispatch matrix** per §4.3. Single API; force-graph routes per `(origin × patch shape × applyMutation-presence)`:

- **User-origin entity, applyMutation present:** route through `applyMutation({ type: "updateNode", ... })` for the FULL patch (canonical + annotations together).
- **User-origin entity, no applyMutation:** plain graphologyAdapter update; local-canonical.
- **System-origin entity, annotations-only patch, applyMutation present:** per-key `applyMutation({ type: "setAnnotation", ... })` per decision #33.
- **System-origin entity, annotations-only patch, no applyMutation:** local-only with dev-warn (annotations persist in entity state but server is unaware).
- **System-origin entity, canonical patch (or mixed):** blocked atomically at resolver layer 3; never reaches applyMutation.

**Refined on validate pass:** the original recommendation only handled the system-origin annotation case; missed that user-origin updateNode in live-source mode also routes through applyMutation (as `type: "updateNode"`). Full matrix locked per system §6.4 + decision #33 spirit.

Mixed patches (canonical + annotations on same call) on system entities: **all-or-nothing rejection** if any canonical field is blocked. Host re-submits with a clean patch.

**Alternatives considered:**
- **Split into `updateNodeCanonical` + `updateNodeAnnotations`** — rejected; doubles the action surface; hosts now need to know the origin before calling.
- **Partial-apply on mixed patches** — rejected; subtle UX (host expects atomicity).

**Impact:** high — defines the data-side dispatch shape across the editing surface.
**Trade-off:** all-or-nothing rejection means a host with a mixed patch must re-submit twice (once for canonical, once for annotations). Acceptable; common in mixed-permission UIs.

### Q-P5 (NEW) — Stale-write banner UX: chrome or callback?

**Locked: callback only via existing `onError({ code: "STALE_WRITE", ... })`.** No built-in chrome. Host renders the banner per its design system. Mirrors description §6.4: force-graph emits the signal; UI is host-side.

**Impact:** medium — defines the v0.3 stale-write surface.
**Trade-off:** hosts must opt in to the banner; missed by hosts who don't subscribe to `onError` but in practice every host wires it for error reporting. v0.4+ may add an optional `<ForceGraph.StaleWriteBanner>` compound part if real consumers report friction.

### Q-P6 (NEW) — Composite history entry atomicity

**Locked: collect-then-apply atomic for both `deleteNode` AND `deleteEdge`** per §4.1 (validate-pass refinement #6 — explicit for both). Cascade collection (incident edges + UI-state refs) happens BEFORE any mutation fires. If collection fails, the entire delete is rejected; no partial state. If apply fails mid-way, log + bail + emit `onError({ code: "CASCADE_FAILED" })`; state may be inconsistent (rare under sane input).

**Impact:** high — defines the deleteNode + deleteEdge reliability semantics.
**Trade-off:** atomic cascade is more code than greedy-delete-as-you-go (~30 LOC for the collect-pass). Worth it; partial-deletion bugs are notoriously hard to debug.

### Q-P7 (NEW; refined on validate pass) — CRUD action return shape consolidation

**Locked: ALL CRUD actions return discriminated `CrudResult`** per §3.2 + validate-pass refinement #4. `addNode` / `addEdge` / `addNodeType` / `addEdgeType` return `CrudResult<{ id: string }>`; `updateNode` / `pinNode` / `delete*` return `CrudResult` (no extra payload). `deleteNodeType` / `deleteEdgeType` return `CrudResult` with `ok: false; code: "TYPE_IN_USE"; entityIds: string[]` populated when the type is in use.

**Refined on validate pass:** the original recommendation was structured-return only for `deleteType`; mixing throw/void/structured shapes across the CRUD surface was error-prone for hosts. Consolidated to one shape across all CRUD. Factory helpers (`ok()`, `err(code, reason?, entityIds?)` in `lib/crud-result.ts`) reduce boilerplate.

Error codes (cumulative; per §10.5 #2): `"PERMISSION_DENIED"`, `"NOT_FOUND"`, `"TYPE_IN_USE"`, `"INVALID_INPUT"`, `"CASCADE_FAILED"`, `"MUTATION_THROW"`. `"STALE_WRITE"` surfaces via `onError`, NOT CrudResult (informational on a successful mutation).

**Impact:** medium — uniformizes the host-facing CRUD contract.
**Trade-off:** hosts must always check `result.ok`. Acceptable; predictable. Alternative (throw-on-failure) was rejected because permission-block + type-in-use + not-found + mutation-throw are all expected outcomes (not exceptional), and try/catch obscures the discrimination.

### Q-P8 (NEW) — Action input shapes (auto-id, origin defaults)

**Locked: auto-id when `input.id` is absent**; use `crypto.randomUUID()`. Origin is **always required** on `NewNodeInput` / `NewEdgeInput` — no default, no fallback (per decision #17). systemRef required iff origin === "system" — Phase A schema check enforces.

`groupIds` on `NewNodeInput` is **omitted in v0.3** (validate-pass refinement #1 — groups don't exist yet); v0.4 reintroduces membership management via `addNodeToGroup` action.

**Impact:** low — input ergonomics.
**Trade-off:** none — auto-id is convenience; origin requirement is system #17 lock.

### Q-P9 (NEW) — Schema-reactivity notification surface

**Locked: emit via `onError`** with code `"UNKNOWN_NODE_TYPE_AUTO_REGISTERED"` (or `"UNKNOWN_EDGE_TYPE_AUTO_REGISTERED"`) per decision #24. Informational severity (NOT fatal). Host can surface a notification or silently ignore.

The auto-registered NodeType uses neutral defaults (`label: "Unknown type"`, `color: "var(--muted)"`, `icon: null`); host can `updateNodeType` later to give it real metadata.

**Impact:** low — error-channel surface.
**Trade-off:** sharing `onError` between fatal and informational events means host must check `code` to differentiate. Acceptable; alternative (separate `onWarning` callback) is API bloat for one use case.

### Q-P10 (NEW; refined on validate pass) — `applyMutation` `serverState` reconciliation

**Locked: server-authoritative for canonical fields; field-level pre-mutation snapshot for divergence detection** per validate-pass refinement #7. When `applyMutation` returns `ok: true` with optional `serverState: GraphDelta`:

```
1. Capture pre-mutation snapshot of locally-touched fields (already needed for history inverse).
2. Apply delta to local store on top of the optimistic update.
3. For each field in the local mutation's patch:
     compare serverState's value (if present) against the optimistic value;
     if divergent → emit informational onError({ code: "STALE_WRITE", entityId, fieldKey, serverValue, localValue }).
4. If serverState is undefined (host's adapter doesn't return it):
     optimistic update stays as-is (no reconciliation possible); no STALE_WRITE emitted.
```

**Refined on validate pass:** the original recommendation said *"if delta diverges from optimistic"* without locking a comparison mechanism. Now: **field-level diff** of locally-touched fields vs serverState. Cost: O(F) where F is fields-in-patch; small.

Per decision #32, last-write-wins for v0.1: if upstream mutates an entity currently being edited locally, the local commit wins over the server's prior state, AND the server's response (if it includes the fresh server state post-our-mutation) wins over the local's optimistic. The "stale-write" banner informs the host that something changed remotely; host UI surfaces.

**Impact:** medium — defines the optimistic-update reconciliation flow.
**Trade-off:** "last-write-wins + warning" is the v0.1 simplification. Optimistic concurrency tokens are an additive upgrade per decision #32 if real-world conflicts warrant.

## 10.5 Plan-stage refinements (surfaced during draft + validate pass)

These bake into implementation but worth flagging:

1. **`pinNode` as standalone action**, distinct from drag-coalesced pin in v0.2. v0.2's drag interaction produces ONE history entry combining position + (maybe) pin; v0.3's standalone `pinNode(id, true/false)` is its own entry per spec §5.5.
2. **`onError` codes (cumulative across all force-graph phases)**: v0.1 introduces `INVALID_SNAPSHOT`, `MISSING_ORIGIN`, `MISSING_SYSTEM_REF`. v0.3 adds: `STALE_WRITE`, `MUTATION_THROW`, `UNKNOWN_NODE_TYPE_AUTO_REGISTERED`, `UNKNOWN_EDGE_TYPE_AUTO_REGISTERED`, `TYPE_IN_USE`, `CASCADE_FAILED`, `NOT_FOUND`, `PERMISSION_DENIED`. Plan-stage codifies the union; v0.3 plan locks the v0.3-introduced subset.
3. **`graphologyAdapter.snapshot()` and `.restoreSnapshot()`** — primitives for optimistic-update rollback. Used by §4.3 annotation routing's rollback path. v0.3 surfaces them as adapter API (still NOT public to consumers).
4. **`resolvePermission` host predicate is called inside CRUD action handlers, NOT inside renders.** No hot-path concern; documented for hosts who might worry. NOT consulted on undo/redo or delta application (Q-P4 + edge case rows).
5. **Group CRUD deferred to v0.4** per validate-pass refinement #1. Description §2.4 locks `addGroup` / `updateGroup` / `deleteGroup` / `addNodeToGroup` / `removeNodeFromGroup` as v0.4 work alongside hull rendering. v0.3's `crud-edge.ts` wires the group-edge-slice dispatch path forward-compatibly (group-involving edges flow through a code path that exists but has no group endpoints to address in v0.3).
6. **`updateNode` patch with `position` field** — accepted in v0.3; routes through standard graphologyAdapter; bumps graphVersion. Distinct from drag's `setNodePositions` (v0.2 silent batch). Generally hosts use drag for interactive moves and `updateNode({ position })` for programmatic placements.
7. **`addEdge` between two system nodes stamps `origin: "user"`.** Force-graph enforces this automatically per [decision #21](../../systems/graph-system/graph-system-description.md); host's input can omit origin for cross-system edges (force-graph defaults to "user"). Documented in usage.
8. **`PartialNode` excludes `id`, `origin`, `systemRef`** at the type level. Mutating these post-create requires delete + re-add, intentionally. Documented.
9. **Auto-id factory uses `crypto.randomUUID()`** — a Web standard; no third-party dep. Same UUIDv4 shape across all environments (Node 19+, browsers).
10. **No new selectors in v0.3.** v0.1 + v0.2 selectors (`visibleNodeIds`, `neighborsOf`, etc.) all observe `graphVersion`; CRUD actions bump it; selectors re-fire automatically. v0.4 adds filter-related selectors.
11. **PermissionAction enum is forward-compatible** — `"add-to-group"` and `"remove-from-group"` declared in v0.3 but only USED in v0.4 (when group CRUD ships). Type-only forward-compatibility; harmless.
12. **`CrudResult` factory helpers** — `lib/crud-result.ts` exports `ok<T>(payload?: T)` and `err(code, reason?, entityIds?)` to reduce boilerplate at every CRUD call site. Hosts can use the type alias directly without importing the factory.
13. **`STALE_WRITE` is informational** on `onError`, NOT a `CrudResult` failure code. The mutation succeeded locally; the warning informs the host that remote state was newer. Host UI may render a banner per Q-P5.

---

## 11. Definition of "done" for THIS document (stage gate)

- [x] User reviewed §1–§9 (the plan body) and §10 (Q-Ps + §10.5 refinements).
- [x] All 10 plan-stage questions resolved (Q-P1 to Q-P10); Q-P3 + Q-P4 + Q-P7 + Q-P10 refined on validate pass; group CRUD removed from v0.3 per validate-pass refinement #1.
- [x] User said **"go ahead"** — sign-off applied. Stage 3 (implementation) unlocks: v0.3 implementation runs sequentially after v0.2 lands. ~~gated on Phase 0 risk spike like v0.1 + v0.2~~ Phase 0 risk spike CANCELLED per [#38](../../systems/graph-system/graph-system-description.md#8-locked-decisions-index) (2026-04-29).
- [x] `Recommendation:` form converted to `**Locked: X.**`; status header flipped; [system §9 sub-doc map](../../systems/graph-system/graph-system-description.md#9-sub-document-map) updated to mark `force-graph` v0.3 plan ✓ signed off.

---

*End of v0.3 plan. Stage 3 (implementation) is unlocked subject to v0.2 implementation landing (~~+ Phase 0 risk spike completion~~ — Phase 0 cancelled per [#38](../../systems/graph-system/graph-system-description.md#8-locked-decisions-index) 2026-04-29).*
