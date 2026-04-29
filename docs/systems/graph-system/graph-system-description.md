# Graph System — System Description

> **Status:** **signed off 2026-04-28** (with amendment [#38](#8-locked-decisions-index) **signed off 2026-04-29** — dashed-edge rule + Phase 0 risk spike removed; replaced with stock-Sigma color/size differentiation; cascade to force-graph descriptions/plans + STATUS + HANDOFF in progress). All Tier 1 + Tier 2 procomp Stage 1 descriptions are signed off (see [§9](#9-sub-document-map)). **System Stage 2 plan (`graph-system-plan.md`) now AUTHORABLE — all 5 Tier 1 plans + force-graph v0.1 + v0.2 + v0.3 plans signed off 2026-04-28 to 2026-04-29.** **Force-graph v0.1 + v0.3 + v0.4 + v0.5 plan-locks all fully unblocked at the planning level** (no Phase 0 prerequisite per #38); v0.6 always independent. Per-phase / per-procomp plan cascade fully resolved on the Tier 1 axis; remaining work is force-graph v0.4 / v0.5 / v0.6 per-phase plans + the system Stage 2 plan + the #38 cascade through existing v0.1/v0.2/v0.3 plans.
> **Working title:** `graph-system` (locked, decision #28; rename only at NPM extraction)
> **Created:** 2026-04-28
> **Last updated:** 2026-04-29 (amendment #38 signed off — dashed-edge feature removed, Phase 0 spike cancelled, replaced with stock-Sigma color/size differentiation; superseded markers applied to #1, #10 Phase-0 clause, and §10.1; cascade through force-graph description/plans/spike-brief + STATUS + HANDOFF in progress)
> **Owner:** ilinxa team

This document is the integration contract for a multi-component product surface that visualizes, edits, and adapts knowledge graphs. It composes five generic pro-components and one graph-specific pro-component into three usage modes (DB visualizer / personal knowledge graph / hybrid documenter).

This is **not** an implementation spec. Each constituent pro-component carries its own procomp description, plan, and guide. This doc fixes what the components must agree on. Where a sub-doc exists, this document defers to it.

---

## 0. How to read this document

- Read **§1** to understand intent.
- Read **§3** for the component inventory and follow links to each procomp folder for depth.
- Read **§4–§6** for the cross-cutting concerns every constituent component must honor.
- Read **§8** for the locked decisions index — these are the decisions that, once signed off, propagate to every procomp doc as constraints.
- Use **§9** to track sub-document status.
- Treat **§12** as the only blocking section for sign-off.

When a constituent procomp doc disagrees with this system doc, **the system doc wins** — but flag it back here so we can revise consciously.

---

## 1. Vision

### 1.1 The problem

Three separate-looking problems are actually the same problem with different data sources:

1. **Visualizing a graph database.** A user has a Kuzu / Neo4j / Memgraph instance and wants to explore it visually — see communities, follow relationships, query by type, run shortest-path explorations. Today this requires a bespoke tool per DB or a generic visualizer that doesn't understand the user's schema.
2. **Personal knowledge management, Obsidian-style.** A user wants markdown notes with `[[wikilinks]]` rendered as a force-directed graph, where they own all the data and edit freely.
3. **Documenting a graph database with personal notes.** The user has authoritative graph-DB data they cannot edit, *and* personal markdown documentation that references DB nodes, groups them logically, annotates them. The two layers must coexist, with clear ownership boundaries.

These are the same UI surface — a force-directed graph with rich panels — distinguished only by the **origin and editability** of the data inside it.

### 1.2 Goals

- **One component surface, three usage modes.** Same code path, different data distributions.
- **Decomposed into small, useful-on-their-own pro-components.** Tier 1 components (filter-stack, detail-panel, properties-form, entity-picker, markdown-editor) must be valuable independently of the graph; the graph composes them.
- **DB-agnostic.** No Kuzu lock-in. Source adapters live outside the registry.
- **Origin-aware from day one.** The system distinguishes user-owned from DB-owned data at the data-model level, not as a UI overlay.
- **Phased delivery.** Each pro-component ships through the procomp gate independently. The graph component itself ships in six phases (v0.1–v0.6) like rich-card.

### 1.3 Non-goals

- **Building a markdown editor from scratch.** We wrap CodeMirror 6.
- **Building a graph database.** The system is a *client* of graph data, not a store.
- **Collaborative editing.** Out of scope; hosts can layer CRDT/OT on top of the snapshot/delta API.
- **Mobile-first interaction.** Desktop primary. Touch works via library defaults but isn't a design driver.
- **Scaling beyond ~100k nodes.** v1 budget. Cluster-level rendering is a v2 concern.

### 1.4 Why decompose instead of building one big component

A monolithic graph-visualizer was estimated at ~80–120 files / 14–18 calendar weeks with all of the cross-cutting concerns coupled. The decomposed plan (this doc) yields:

- **Risk distribution.** The highest-risk core (custom WebGL programs, force layout) is concentrated in one Tier 2 component (`force-graph`). The five Tier 1 components are conventional React work.
- **Reusability.** Every Tier 1 component is useful far beyond graphs. `filter-stack` slots into `data-table`. `detail-panel` slots into `rich-card`. `markdown-editor` slots into any future docs system.
- **Independent shipping cadence.** Tier 1 can ship in parallel with Tier 2. We get useful components even if `force-graph` slips.
- **Cleaner NPM extraction.** Smaller focused packages travel better than one monolith with 9+ third-party deps and a Web Worker.

---

## 2. Naming

Working title: **"graph-system"**.

This is a placeholder. The current name is generic and overlaps with "graph DB". Better candidates to consider:

- **graph-studio** — implies authoring and visualization
- **graph-workspace** — overlaps with the existing `layout/workspace` component, rejected
- **knowledge-graph** — overlaps with one of the three usage modes, rejected
- **graphboard** — distinctive but unclear
- **graphlab** — distinctive, implies experimentation

**Decision (locked, decision #28):** `graph-system` is the working title. We rename only if/when the system extracts to its own NPM package — at that point the public name matters; until then, doc-folder cost of renaming is trivial. The Tier 2 component slug remains `force-graph` regardless.

---

## 3. Component inventory

The system has three tiers.

### 3.1 Tier 1 — Generic pro-components

Useful standalone, no graph dependency. Each ships through its own procomp gate. Per-phase plan-lock dependency:

- `properties-form` + `detail-panel` plans → required before `force-graph` **v0.3** plan can be signed off
- `filter-stack` plan → required before `force-graph` **v0.4** plan
- `markdown-editor` plan → required before `force-graph` **v0.5** plan
- `entity-picker` is a utility used wherever; useful but not a hard gate
- `force-graph` **v0.1, v0.2, v0.6** compose zero Tier 1 components — those plans can be locked independently of any Tier 1 work

This matches the phased shipability in §10.3 — `force-graph` v0.1 ships before any Tier 1 component is implemented.

| # | Slug | Category | Role in graph-system | Procomp doc |
|---|---|---|---|---|
| 1 | `properties-form` | forms | Schema-driven entity editor — used inside `detail-panel` for editable system / user nodes and edges, and inside the creation flow. **Mirrors rich-card's typed flat-field approach.** | [→ procomp folder](../../procomps/properties-form-procomp/) (TBA) |
| 2 | `detail-panel` | feedback | Selection-aware multi-state container (empty / one-of-N typed-content states). Slot-based: host provides per-entity-type read/edit renderers. | [→ procomp folder](../../procomps/detail-panel-procomp/) (TBA) |
| 3 | `filter-stack` | forms | Composable filter UI with **AND-across-categories / OR-within-category** semantics. Generic over the filter category type. | [→ procomp folder](../../procomps/filter-stack-procomp/) (TBA) |
| 4 | `entity-picker` | forms | Searchable picker with kind badges; single or multi select. Used by linking-mode UI, creation flows, group-membership editors. | [→ procomp folder](../../procomps/entity-picker-procomp/) (TBA) |
| 5 | `markdown-editor` | forms | CodeMirror 6 wrapper with markdown mode + wikilink autocomplete + slot-able toolbar + preview toggle. **Heaviest pro-component by bundle (~150KB).** | [→ procomp folder](../../procomps/markdown-editor-procomp/) (TBA) |

**`forms` category** is in place. Added pre-session per [decision #31](#8-locked-decisions-index) (✓ done); the duplicate-source-of-truth issue across [src/registry/categories.ts](../../../src/registry/categories.ts), [src/registry/types.ts](../../../src/registry/types.ts), and [scripts/new-component.mjs](../../../scripts/new-component.mjs) was resolved by deriving `VALID_CATEGORIES` from the type union at runtime (commit `260d035`).

### 3.2 Tier 2 — Graph pro-component

| # | Slug | Category | Role | Procomp doc |
|---|---|---|---|---|
| 6 | `force-graph` | data | The WebGL canvas, force layout, custom edge/node programs, source-adapter integration, group hulls, doc-node visuals, undo/redo. Composes all five Tier 1 components. Phased v0.1 → v0.6 (see §10). | [→ procomp folder](../../procomps/force-graph-procomp/) (TBA) |

### 3.3 Tier 3 — Assembled experience (NOT in the registry)

A page in `src/app/` that wires the Tier 2 component together with the Tier 1 panels into the full product surface (sidebars, app shell, persistence). This is **host code**, not a registry component. It is the demo of "what this system looks like assembled" and the integration test for the contract.

**Location (locked, decision #29):** `src/app/systems/graph-system/page.tsx`. Adds "Systems" as a top-nav peer of "Components" in [src/components/site/site-header.tsx](../../../src/components/site/site-header.tsx). This also resolves the "site nav has only Components" item from [STATUS.md](../../../.claude/STATUS.md) for the systems case.

### 3.4 What is intentionally NOT a pro-component

- **Control sliders / advanced settings panel.** These are compositions of shadcn primitives (`Slider`, `Switch`, etc.) plus an accordion. No new pro-component pattern emerges. They live in Tier 3 host code.
- **The Sigma container itself.** It's an internal `parts/` of `force-graph`, not a separate component.
- **Source adapters (Kuzu, Neo4j, etc.).** They're host code or companion packages, not pro-components.

---

## 4. The two-layer data model (cross-cutting)

Every constituent pro-component must understand and honor this model.

### 4.1 The `origin` field

Every node and every edge carries:

```ts
type Origin = "system" | "user";
```

- **`origin: "system"`** — the entity comes from an authoritative source the user does not own (a graph DB). It is **read-only** at the canonical-field level. The user CAN attach metadata annotations (see §4.4) but cannot mutate canonical fields.
- **`origin: "user"`** — the entity was authored by the user. Full CRUD via the visualizer.

Origin is **mandatory** on every node and edge from v0.1 of every component. Snapshot validation rejects entities missing `origin`. There is no default and no fallback — explicit by design.

### 4.2 System nodes

```ts
interface SystemNode extends BaseNode {
  origin: "system";
  systemRef: {                  // mandatory when origin === "system"
    source: string;             // e.g. "kuzu", "neo4j", or host-defined
    sourceId: string;           // stable ID in the source system
    schemaType?: string;        // DB label / class / table
  };
  // canonical fields from the source: read-only at the visualizer level
  // user annotations: writable (see §4.4)
}
```

The visualizer never overwrites canonical fields. If the source emits a delta updating a canonical field, the visualizer applies it (see §6.3). User-driven mutations to canonical fields are blocked by the permission resolver (§5).

### 4.3 User nodes

```ts
interface UserNode extends BaseNode {
  origin: "user";
  // all fields fully editable through the visualizer
}
```

User nodes include everything the user creates — including doc nodes (`kind: "doc"`). Doc nodes are a sub-shape of user nodes; system nodes never have `kind: "doc"`.

### 4.4 User annotations on system nodes

Users CAN attach metadata to system nodes. This is how the "hybrid documenter" mode (use case 3 from §1.1) works — annotating a DB node with priority, notes, tags, ownership without touching the DB.

```ts
interface BaseNode {
  ...
  metadata?: Record<string, unknown>;  // free-form, host-defined
  annotations?: {                      // user-owned annotations on this node
    [key: string]: unknown;
  };
}
```

- For user nodes: `metadata` and `annotations` are both fully writable (the distinction collapses).
- For system nodes: canonical fields are immutable; `annotations` is writable; `metadata` is whatever the source emitted (read-only).

**Persistence:** annotations on system nodes need user-side persistence (host's responsibility), since the source DB is read-only at the user level. The source adapter's `applyMutation` handles this (§6.4).

### 4.5 Edge origin rules

An edge's origin is **not** derived from its endpoints. It is explicit:

| Endpoint origins | Edge `origin` | When it's set |
|---|---|---|
| system → system | `"system"` | Edge came from the source DB |
| system → system | `"user"` | User authored an annotation edge between two DB nodes (rare but allowed) |
| user → user | `"user"` | Always |
| user → system | `"user"` | User-authored link from a doc/user node to a DB node |
| system → user | `"user"` | Same; rare |

Rule of thumb: **if the user created it, it's `origin: "user"`, regardless of endpoint origins.** System-origin edges only come from the source.

A separate field `derivedFromWikilink?: boolean` is true for user-origin edges produced by markdown reconciliation. These are auto-managed (see §4.7).

### 4.6 Group origin

Groups are always `origin: "user"` in v1. There is no concept of a "system-defined group" yet. (DB labels / classes / communities are surfaced as `nodeTypeId` on system nodes; visual grouping by label is a filter affordance, not a Group entity.)

This is a deliberate simplification for v1. v2 may introduce `origin: "system"` groups for DB-derived communities; `force-graph` v0.4+ should not assume groups are always user-origin in its internal data model, even though no system groups exist yet.

### 4.7 Wikilink reconciliation interacts with origin

When a doc node's content has `[[Target]]`:

- If `Target` resolves to a system node → a `derivedFromWikilink: true, origin: "user"` edge is created (the user authored the wikilink).
- If `Target` resolves to a user node → same.
- If `Target` resolves to a group → same (group endpoint, user-origin edge).
- If `Target` is unresolved → `unresolvedWikilinks: string[]` on the doc node is updated. (Promoted from `metadata.unresolvedLinks` to a first-class field per decision #15.)

Reconciliation triggers (per decision #36):

- **`importSnapshot`** — all phases, every import.
- **Doc-node save** — `force-graph` v0.5+ only, fires when the mounted markdown editor commits doc content.

In `force-graph` v0.1–v0.4, doc nodes have no editor mounted, so import-only reconciliation suffices for those phases.

---

## 5. Permission resolver pattern (cross-cutting)

Origin alone doesn't decide editability. Some hosts may want read-only mode for everything. Some may want stricter rules ("system nodes annotation-only"). The system uses a resolver pattern, similar to rich-card's 7-layer permission resolver.

### 5.1 Default rules (origin-driven)

| Action | system entity | user entity |
|---|---|---|
| Read canonical fields | yes | yes |
| Edit canonical fields | **no** | yes |
| Edit annotations / `annotations` field | yes | yes |
| Delete | **no** | yes |
| Add to user-origin group | yes | yes |
| Connect via user-origin edge | yes | yes |

### 5.2 Layered resolution

The resolver evaluates in priority order, first match wins:

1. **Predicate escape hatch** — host-supplied `(entity, action) => boolean | undefined`. Returns `undefined` to defer.
2. **Per-entity meta lock** — entity has `__locked: true` in metadata.
3. **By origin × action** — the default table from §5.1.
4. **Global default** — fallback (rejects).

### 5.3 Where the resolver lives

Each component owns its own resolver in v1. **Do not pre-extract a shared library.** Once `force-graph` v0.3 ships, we'll have two production permission resolvers (rich-card's and force-graph's) and can extract commonalities into `src/lib/permissions/` then. Premature abstraction is the bigger risk.

### 5.4 Permission UX

When an action is blocked by the resolver, the UI shows a tooltip ("This is a system node from Kuzu — annotations only") rather than silently disabling. `force-graph` v0.3 ships with permission tooltips on disabled actions; rich-card's [`permission-tooltip.tsx`](../../../src/registry/components/data/rich-card/parts/permission-tooltip.tsx) is the reference pattern.

---

## 6. Source-adapter pattern (cross-cutting)

The graph component accepts either a static snapshot or a live source.

### 6.1 The interface

```ts
type GraphInput = GraphSnapshot | GraphSource;

interface GraphSource {
  loadInitial(): Promise<GraphSnapshot>;
  subscribe?(callback: (delta: GraphDelta) => void): () => void;  // unsubscribe
  applyMutation?(mutation: UserMutation): Promise<MutationResult>;
}
```

### 6.2 Modes

- **Static snapshot mode.** `loadInitial` returns a frozen snapshot, no `subscribe`, no `applyMutation`. Mutations live only in component state; host subscribes via `onChange` and persists however. This is the "Obsidian-like personal KG" mode.
- **Live source mode.** `loadInitial` returns the initial graph, `subscribe` streams deltas, `applyMutation` persists user-layer changes. This is the "DB visualizer" or "hybrid documenter" mode.

### 6.3 Real-time delta handling

When a `GraphDelta` arrives via `subscribe`:

- Apply to the data layer (graphology and/or the Zustand group-edge slice).
- Bump `graphVersion`.
- Run the UI-state cascade (inherited from original spec #20 — see §11.5) for any deleted entities.
- **Preserve UI state**: selection, hover, filters, multi-edge expansion, linking-mode source, undo stack are NOT touched (unless the cascade requires clearing a deleted reference).
- Deltas do NOT enter the undo stack — they're not user actions.

**Stale-write conflict policy (locked, decision #32 — last-write-wins for v0.1):** if the upstream source mutates an entity that is currently being edited in the inline form, the user's submit applies. The form surfaces a "this was updated remotely while you were editing — your changes overwrote remote state" banner. Conflicts are rare in single-user workflows; optimistic concurrency tokens are an additive upgrade path if real-world conflict rates warrant them (every entity would gain a `version: number`, mutations would carry the version client started from, adapters would CAS — none of this is breaking to add later).

### 6.4 `applyMutation` contract

```ts
type UserMutation =
  | { type: "addNode"; node: UserNode }
  | { type: "updateNode"; id: string; patch: Partial<UserNode> }
  | { type: "deleteNode"; id: string }
  | { type: "setAnnotation"; entityId: string; key: string; value: unknown }
  // ...edge / group mutations
  ;

interface MutationResult {
  ok: boolean;
  serverState?: GraphDelta;  // optional: the canonical state after the mutation
  error?: { code: string; message: string };
}
```

The component:
1. Applies the mutation optimistically to local state and bumps `graphVersion`.
2. Calls `applyMutation`.
3. On `ok: false`, rolls back the optimistic update and surfaces the error.
4. On `ok: true` with `serverState`, reconciles local state with server canonical (handles race conditions where the server's state diverges).

**Single-method routing (locked, decision #33):** annotations on system nodes route through this same `applyMutation` (as the `setAnnotation` variant) — there is no separate `applyAnnotation` method. The mutation `type` field discriminates; adapter implementers dispatch on `type` internally. This keeps the GraphSource interface minimal.

### 6.5 Adapters live outside the registry

Adapters for Kuzu, Neo4j, Memgraph, etc. are host code or separate packages. The registry component is generic over adapters. This keeps the component portable and the dep tree small.

---

## 7. Inter-component integration contracts

How the constituent pro-components communicate.

### 7.1 Composition vs. shared store

Tier 1 components are **composition primitives** — they accept props and emit events. They do not share a global store. The host (Tier 3 page) wires them together with its own state.

`force-graph` (Tier 2) has an internal **selector-based state store** for graph state, selection, filters, linking mode, etc. — Zustand or equivalent; final implementation locked in `force-graph-procomp-plan.md`. A selector-based store is required (rather than `useReducer`, which rich-card uses) because multiple panels read different slices at high frequency; whole-tree re-renders would dominate at the panel density this component supports. The store exposes a **public actions API** and a **public selector API** so host code (and the wired Tier 1 panels) can read and dispatch.

This is the pattern:

```
              ┌────────────────────────────┐
              │      Tier 3 host page       │
              │ (wires panels to canvas)    │
              └──────┬───────────────┬──────┘
                     │               │
        ┌────────────▼─────┐ ┌───────▼────────┐
        │   force-graph    │ │  Tier 1 panel  │  (filter-stack, detail-panel, ...)
        │ (canvas + store) │ │ (props + events)│
        └────────┬─────────┘ └────────┬───────┘
                 │       reads/dispatches
                 └───────────────►◄───┘
```

The Tier 1 panels are **dumb** — they don't know about graph state. The host translates between the panel's props/events and the force-graph store actions.

### 7.2 Where does each contract live?

| Contract | Owner doc |
|---|---|
| Graph snapshot / delta shapes | This doc, §4 + §6, with detail in `force-graph-v0.1-plan.md` |
| `properties-form` schema → entity render | `properties-form-procomp-plan.md` |
| `detail-panel` slot signatures | `detail-panel-procomp-plan.md` |
| `filter-stack` filter category interface | `filter-stack-procomp-plan.md` |
| `entity-picker` entity shape | `entity-picker-procomp-plan.md` |
| `markdown-editor` value/onChange + wikilink candidate provider | `markdown-editor-procomp-plan.md` |
| `force-graph` actions / selectors / events | per-phase plans (`force-graph-v0.{N}-plan.md`); v0.1 plan covers props + ~6 actions + ~5 selectors |
| Tier 3 wiring | `graph-system-plan.md` (this folder, Stage 2) |

---

## 8. Locked decisions index

Decisions made during the design discussion, locked at the system level so every constituent procomp inherits them as constraints.

> **Note on plan references:** rows referencing `force-graph-procomp-plan.md` in the "Where it's enforced" column below mean the relevant per-phase plan (`force-graph-v0.{N}-plan.md` per the [§9 cascade](#9-sub-document-map)). The original column wording predates the per-phase decomposition; specific phase mapping is locked in each per-phase plan's §17 (or equivalent). Some rows below have been updated to point at the specific phase (e.g., decision #11 → v0.5; decision #36 → v0.5); others retain the umbrella term.

| # | Decision | Where it's enforced |
|---|---|---|
| 1 | <a id="decision-1-superseded"></a>~~**Dashed-edge rule** finalized: an edge renders dashed iff at least one endpoint is a node of `kind === "doc"`, OR (no doc-node endpoint AND `edgeType.dashed === true`). Group endpoints do NOT transit doc-ness — group↔group edges follow the per-edgetype flag regardless.~~ **SUPERSEDED by [#38](#8-locked-decisions-index)** (2026-04-29 amendment) — dashed rendering removed; replaced with color desaturation + size differentiation via stock Sigma. The scoping predicate (doc-endpoint OR per-type flag, group endpoints not transiting doc-ness) is preserved verbatim in #38; only the visual treatment changed. | ~~`force-graph-procomp-plan.md` §dashed-rendering~~ → see #38 |
| 2 | **`group.memberNodeIds` is canonical**; `node.groupIds` is a derived index kept in sync by store actions. On import: derive from canonical; if both present and disagree → reject snapshot. | `force-graph-procomp-plan.md` §data-model |
| 3 | **Single `state.edgeOrder: string[]`** array tracking edge IDs across both storage layers (graphology native + group-edge slice). `exportSnapshot` walks this array. | `force-graph-procomp-plan.md` §state |
| 4 | **`useGraphSelector(fn)` hook** codifies that selectors reading graphology MUST observe `graphVersion`. Hook bakes this in; consumers can't forget. | `force-graph-procomp-plan.md` §selectors |
| 5 | **`validateSnapshot(s)` runs on every `importSnapshot`** with structured error returns. Checks: ID uniqueness within nodes/groups + disjointness, type reference resolution, edge endpoint resolution, `memberNodeIds`/`groupIds` agreement, no self-loops, **`origin` field present on every node and edge**, **`systemRef` present and well-formed when `origin === "system"`**. | `force-graph-procomp-plan.md` §snapshot-io |
| 6 | **DetailPanel "Edit" is inline**, not modal. Toggle replaces read view with edit form; Save/Cancel commits or reverts. | `detail-panel-procomp-plan.md` |
| 7 | **`setNodePositions(batch, options?: { silent?: boolean })`** — silent mode bypasses undo recording, for layout-load and procedural placement. | `force-graph-procomp-plan.md` §actions |
| 8 | **Custom theme missing keys fall back to dark-theme defaults** regardless of system theme. | `force-graph-procomp-plan.md` §theming |
| 9 | **Deleting a `derivedFromWikilink: true` edge is refused in the UI** with a tooltip ("Edit the source doc to remove this link"). Programmatic `deleteEdge` accepts but logs a warning. | `force-graph-procomp-plan.md` §edge-actions |
| 10 | <a id="decision-10-superseded-phase-0-clause"></a>**Phase budgets recalibrated** to ~13.5 weeks focused / ~18–22 weeks calendar. ~~Phase 0 (custom edge program risk spike) precedes v0.1.~~ **Phase 0 clause SUPERSEDED by [#38](#8-locked-decisions-index)** (2026-04-29) — risk spike cancelled; budget reverts to v0.1. Phase budgets otherwise unchanged. | This doc §10 |
| 11 | **Lucide icon atlas** ships with a **fixed sub-atlas of ~64 first-class icons**. `iconAtlas: 'dynamic'` opt-in for runtime atlas rebuilding lands later. **Footnote (2026-04-28, per [force-graph-v0.1-plan.md Q-P3](../../procomps/force-graph-procomp/force-graph-v0.1-plan.md#17-resolved-plan-stage-questions-locked-on-sign-off-2026-04-28)):** the original wording said "in v0.1," authored before the procomp decomposition. In the phased plan, the icon atlas is paired with the custom `IconNodeProgram` and ships in `force-graph` **v0.5**, not v0.1. v0.1–v0.4 render plain disc nodes via Sigma's stock `NodeCircleProgram`; icons + glyphs land with the custom node program in v0.5 per [spec §11.5 build-order note](../../../graph-visualizer-old.md). | `force-graph-v0.5-plan.md` §node-program |
| 12 | **Search overrides filters.** Matched nodes always visible + glow, regardless of group/type filters. | `force-graph-procomp-plan.md` §filtering |
| 13 | **Single-member group click target is the group**, not the contained node. SVG halo hit takes priority. | `force-graph-procomp-plan.md` §interaction |
| 14 | **Edge labels are viewport-culled by default** + `edgeLabelZoomThreshold` (default 0.7). | `force-graph-procomp-plan.md` §performance |
| 15 | **`unresolvedWikilinks: string[]` is a first-class field on doc nodes**, not stored in `metadata`. | `force-graph-procomp-plan.md` §doc-nodes |
| 16 | **`forms` is a new registry category.** Update [categories.ts](../../../src/registry/categories.ts), [types.ts](../../../src/registry/types.ts), [new-component.mjs](../../../scripts/new-component.mjs). | Done before scaffolding any Tier 1 form component |
| 17 | **Origin field is mandatory** on every node and every edge from v0.1. No default, no fallback. | All component plans |
| 18 | **System nodes are visually distinguishable but not visually inferior.** Small DB-source glyph in the bottom-right corner of the node disc; user nodes are clean. Per §4.3, system nodes are never `kind: "doc"`, so this does not collide with the doc-glyph (top-right corner) — a node has at most one origin/kind glyph. | `force-graph-procomp-plan.md` §node-program |
| 19 | **Markdown editor wraps CodeMirror 6.** Wikilink autocomplete via custom CM6 extension. No build-from-scratch. | `markdown-editor-procomp-plan.md` |
| 20 | **Markdown editor toolbar is slot-able.** Default toolbar ships; host can replace, extend, or hide via `toolbar` prop. | `markdown-editor-procomp-plan.md` |
| 21 | **User-authored edges between two system nodes are `origin: "user"`.** | `force-graph-procomp-plan.md` §edge-data-model |
| 22 | **Real-time deltas preserve UI state**, do NOT enter the undo stack. | `force-graph-procomp-plan.md` §source-adapter |
| 23 | **System data canonical fields are read-only; `annotations` field is user-writable** even on system nodes. Permission resolver enforces. | `force-graph-procomp-plan.md` §permissions |
| 24 | **Schema reactivity by graceful degradation.** Unknown `schemaType` auto-registers a neutral default NodeType + surfaces a notification. No crash. | `force-graph-procomp-plan.md` §schema |
| 25 | **Permission resolver is per-component in v1.** Shared `src/lib/permissions/` extracted only after rich-card and force-graph both ship resolvers. | This doc §5.3 |
| 26 | **CodeMirror 6 bundle weight (~150KB) accepted.** Markdown editor is the heaviest pro-component by bundle. | This doc §3.1 (acknowledged) |
| 27 | **Source adapters live outside the registry.** Component is generic over them. | This doc §6.5 |
| 28 | **System name `graph-system` (working title) locked.** Rename only if/when the system extracts to its own NPM package. | This doc §2 |
| 29 | **Tier 3 page lives at `src/app/systems/graph-system/page.tsx`.** Add "Systems" as a top-nav peer of "Components" in [site-header.tsx](../../../src/components/site/site-header.tsx). | This doc §3.3 |
| 30 | **Markdown editor v0.1 strict scope:** CodeMirror 6 + standard toolbar + wikilink autocomplete + preview toggle. Slash commands, drag-drop image insertion, live wikilink hover preview deferred to v0.2+. | `markdown-editor-procomp-plan.md` |
| 31 | **`forms` category added immediately as one-off plumbing PR**, before any form-category procomp doc starts. **✓ done** — `forms` was already present in `types.ts`/`categories.ts`/`new-component.mjs` pre-session; codegen fix for `VALID_CATEGORIES` (deriving from the type union at script startup) landed in commit `260d035`, eliminating the duplicate-source-of-truth issue. | [src/registry/types.ts](../../../src/registry/types.ts), [src/registry/categories.ts](../../../src/registry/categories.ts), [scripts/new-component.mjs](../../../scripts/new-component.mjs) |
| 32 | **Stale-write conflict policy: last-write-wins + warning banner for v0.1.** Optimistic concurrency tokens are an additive upgrade only if real-world conflicts surface. | This doc §6.3, `force-graph-procomp-plan.md` §source-adapter |
| 33 | **Annotations route through `applyMutation`** with a `setAnnotation` variant — single GraphSource method, not two. | This doc §6.4 |
| 34 | **Existing backlog committed before any new procomp folders open. ✓ done** as 2 commits (revised 2026-04-28 from the original 6-chunk plan): `cc44b55` rich-card v0.3+v0.4; `c2cfef6` system planning docs. Reduced from 6 because chunks 1+2 and rich-card v0.1+v0.2 were already in commit `000169c` (the workspace-shipping commit), and v0.3/v0.4 lacked clean working-tree separation — STATUS.md and per-version plan docs preserve the version granularity independently. | git history |
| 35 | **Tier 1 components are independent at the component level** — none of them imports another at the registry level. Composition (panels embedding forms) happens only at the host/Tier 3 level via slot props. | All Tier 1 procomp plans |
| 36 | **Wikilink reconciliation runs on doc save in `force-graph` v0.5+** (in addition to `importSnapshot`). v0.1–v0.4 docs are read-only because the markdown editor isn't mounted; import-only reconciliation suffices for those phases. This is a deliberate scope expansion vs. the original spec, which deferred all reconciliation triggers other than import to v2. | `force-graph-procomp-plan.md` v0.5 |
| 37 | **All constituent pro-components honor the design-system mandate** from [.claude/CLAUDE.md](../../../.claude/CLAUDE.md): Onest + JetBrains Mono fonts, signal-lime accent (`oklch(0.80 0.20 132)` light / `oklch(0.86 0.18 132)` dark), cool off-white light bg, graphite-cool dark bg, `reveal-up` keyframe for orchestrated reveals, OKLCH colors only, no `tailwind.config.*`. Components MUST use the CSS variables defined in [globals.css](../../../src/app/globals.css), never hard-code colors. | All component plans |
| 38 | **Custom dashed-edge WebGL program REMOVED. Phase 0 risk spike CANCELLED.** Supersedes [#1](#decision-1-superseded) and the Phase 0 clause of [#10](#decision-10-superseded-phase-0-clause). Rationale: the 2-day GPU benchmark + custom shader development is high-effort, high-risk for a feature that can be approximated with stock Sigma capabilities at acceptable visual fidelity; pre-implementation we have no real consumers depending on literal dashes. **Replacement contract — visual differentiation via stock Sigma uniforms:** (a) **"soft" edges** (the new name; replaces "dashed") = edges where at least one endpoint is a node of `kind === "doc"`, OR `edgeType.softVisual === true`. Rendered with **desaturated muted color** (`--muted-foreground` token, derived per-frame from theme: ~`oklch(0.55 0.02 250)` light / ~`oklch(0.65 0.02 250)` dark) + **size 1**. (b) **default edges** = rendered with foreground color (`--foreground` token) + **size 1.5**. (c) Group endpoints do NOT transit doc-ness — same scoping rule preserved from #1. (d) **Implementation:** stock Sigma `EdgeRectangleProgram` for straight (v0.1+) + `EdgeArrowProgram` for directed (v0.1+) — both ship inside the main `sigma` package via `sigma/rendering` in Sigma 3.x (verified at install time 2026-04-30: Sigma 3.0.2 bundles `edge-rectangle` / `edge-arrow` / `edge-double-arrow` / `edge-line` / `edge-triangle` / `edge-curve` programs together; `@sigma/edge-arrow` is NOT a separate npm package). `@sigma/edge-curve` ships separately for v0.6 multi-edge expansion only — NOT in v0.1; non-breaking add when v0.6 lands. Per-edge `color` and `size` attributes computed by the rendering layer at edge-add time and re-applied on schema/edgetype/theme update. (e) **API rename:** `edgeType.dashed: boolean` → `edgeType.softVisual: boolean` in v0.1+ plans (no consumer impact pre-implementation). (f) **Build-order impact:** Phase 0 risk spike (§10.1) cancelled; the 2-day budget reverts to `force-graph` v0.1 implementation; v0.1 implementation gate is now unblocked at the planning level. | `force-graph-v0.1-plan.md` §edge-rendering (post-amendment cascade) |

When a new decision is made during sub-doc authoring, append it here AND the relevant procomp doc cross-references the row.

---

## 9. Sub-document map

| Pro-component | Description | Plan | Guide | Status |
|---|---|---|---|---|
| `properties-form` | [signed off 2026-04-28](../../procomps/properties-form-procomp/properties-form-procomp-description.md) | [signed off 2026-04-29](../../procomps/properties-form-procomp/properties-form-procomp-plan.md) | TBA | description + plan signed off; **v0.1 IMPLEMENTED 2026-04-29** in `src/registry/components/forms/properties-form/` (alpha 0.1.0; 25 files; build/typecheck/lint clean; SSR rendered ok; browser interactivity not yet validated). First Tier 1 component to convert plan → implementation. Force-graph v0.3 plan-lock half-unblocked at the implementation level (still gates on detail-panel implementation) |
| `detail-panel` | [signed off 2026-04-28](../../procomps/detail-panel-procomp/detail-panel-procomp-description.md) | [signed off 2026-04-29](../../procomps/detail-panel-procomp/detail-panel-procomp-plan.md) | TBA | description + plan signed off; **v0.1 IMPLEMENTED 2026-04-29** in `src/registry/components/feedback/detail-panel/` (alpha 0.1.0; 18 files; build/typecheck/lint clean; SSR rendered ok; browser interactivity not yet validated). Paired with `properties-form`, this **fully unblocks the `force-graph` v0.3 plan-lock at the implementation level** |
| `filter-stack` | [signed off 2026-04-28](../../procomps/filter-stack-procomp/filter-stack-procomp-description.md) | [signed off 2026-04-29](../../procomps/filter-stack-procomp/filter-stack-procomp-plan.md) | TBA | description + plan signed off; **v0.1 IMPLEMENTED 2026-04-29** in `src/registry/components/forms/filter-stack/` (alpha 0.1.0; 21 files; build/typecheck/lint clean; SSR rendered ok; browser interactivity not yet validated). **Unblocks `force-graph` v0.4 plan-lock at the implementation level** |
| `entity-picker` | [signed off 2026-04-28](../../procomps/entity-picker-procomp/entity-picker-procomp-description.md) | [signed off 2026-04-29](../../procomps/entity-picker-procomp/entity-picker-procomp-plan.md) | TBA | description + plan signed off; **v0.1 IMPLEMENTED 2026-04-29** in `src/registry/components/forms/entity-picker/` (alpha 0.1.0; 18 files; build/typecheck/lint clean; SSR rendered ok; browser interactivity not yet validated). Doesn't gate a specific `force-graph` phase but composed inside Tier 3 from v0.3 onward (linking-mode UI) + v0.4 (group-membership editor) |
| `markdown-editor` | [signed off 2026-04-28](../../procomps/markdown-editor-procomp/markdown-editor-procomp-description.md) | [signed off 2026-04-29](../../procomps/markdown-editor-procomp/markdown-editor-procomp-plan.md) | TBA | description + plan signed off; **unblocks `force-graph` v0.5 plan-lock**; **completes the 5 of 5 Tier 1 plan cascade — system Stage 2 plan now authorable**; implementation pre-flight is `pnpm add @codemirror/state @codemirror/view @codemirror/commands @codemirror/language @codemirror/lang-markdown @codemirror/autocomplete @codemirror/search @lezer/markdown @lezer/highlight marked` |
| `force-graph` (v0.1–v0.6) | [signed off 2026-04-28](../../procomps/force-graph-procomp/force-graph-procomp-description.md) | [v0.1 signed off 2026-04-28](../../procomps/force-graph-procomp/force-graph-v0.1-plan.md); [v0.2 signed off 2026-04-29](../../procomps/force-graph-procomp/force-graph-v0.2-plan.md); [v0.3 signed off 2026-04-29](../../procomps/force-graph-procomp/force-graph-v0.3-plan.md); v0.4 / v0.5 / v0.6 TBA | TBA | description signed off; **v0.1 + v0.2 + v0.3 plans signed off** (Stage 3 implementation runs sequentially v0.1 → v0.2 → v0.3; gated on Phase 0 risk-spike per STATUS.md); v0.6 plan unblocked; v0.4 + v0.5 plans now also fully unblocked (all 5 Tier 1 plans signed off) |
| **System-level** | this doc | `graph-system-plan.md` (TBA) | `graph-system-guide.md` (TBA) | **description signed off 2026-04-28** |

Each procomp folder lives at `docs/procomps/<slug>-procomp/` per the existing convention.

Authoring order — per decision #35, all five Tier 1 components are independent at the component level (none imports another). Recommended order below is based on **`force-graph` phasing dependencies** (which Tier 1 component each phase consumes), not on inter-Tier-1 dependencies:

```
Tier 1 (parallelizable; recommended order = force-graph phase needs):
  1. properties-form-procomp-description.md       (consumed by force-graph v0.3)
  2. detail-panel-procomp-description.md           (consumed by force-graph v0.3)
  3. filter-stack-procomp-description.md           (consumed by force-graph v0.4)
  4. entity-picker-procomp-description.md          (utility; useful throughout)
  5. markdown-editor-procomp-description.md        (consumed by force-graph v0.5)

Tier 2 (depends on Tier 1 description-locked, not Tier 1 implemented):
  6. force-graph-procomp-description.md            (with v0.1-v0.6 phasing)

System-level Stage 2:
  7. graph-system-plan.md
```

`force-graph` v0.1 and v0.2 (viewer + interaction) consume zero Tier 1 components, so `force-graph` implementation can begin as soon as its description and v0.1 plan are signed off — even before any Tier 1 component is implemented. Tier 1 implementation only blocks `force-graph` v0.3 onwards.

---

## 10. Build order across the system

### 10.0 Prerequisite — backlog commit (~half a day)

Per decision #34: commit the existing rich-card v0.1–v0.4 / workspace / design-system / site-chrome backlog into git in 6 logical chunks before any new procomp folders open. STATUS.md currently describes shipped work that doesn't exist in git history (only 2 commits exist). This must land before procomp authoring begins to keep PR review and ultrareview workflows clean.

### 10.1 Phase 0 — Risk spike (CANCELLED per [#38](#8-locked-decisions-index))

**Status: cancelled 2026-04-29.** Per [decision #38](#8-locked-decisions-index), the custom `DashedDirectedEdgeProgram` is removed and replaced with stock Sigma edge programs + color/size differentiation. The 2-day spike budget reverts to `force-graph` v0.1 implementation. The original brief at [`force-graph-phase-0-spike-brief.md`](../../procomps/force-graph-procomp/force-graph-phase-0-spike-brief.md) is preserved for historical reference but no longer on the build path.

~~**Independent of procomp gate** — pure technical research.~~

~~- Build a prototype `DashedDirectedEdgeProgram` (custom Sigma WebGL edge program supporting solid+dashed × arrows × straight+curved).~~
~~- Test at 100k edge scale on integrated and discrete GPUs.~~
~~- Gate: ≥30 fps on integrated GPU.~~

~~If this fails, the entire system is replanned — `force-graph` falls back to SVG-overlay rendering, capping practical edge count at ~5k visible. Tier 1 components are unaffected.~~

### 10.2 Tier 1 build order

After all five Tier 1 description docs are signed off, plans can be authored in parallel. Recommended implementation order (matches §9 authoring order; based on `force-graph` phasing needs, not inter-Tier-1 dependencies — per decision #35):

1. `properties-form` (~2–3 weeks) — needed by `force-graph` v0.3
2. `detail-panel` (~1.5 weeks) — needed by `force-graph` v0.3
3. `filter-stack` (~1.5 weeks) — needed by `force-graph` v0.4
4. `entity-picker` (~1 week) — utility; useful throughout
5. `markdown-editor` (~3 weeks) — needed by `force-graph` v0.5

**Tier 1 total: ~9–10 weeks serial / ~5–6 weeks if parallelized across developers.**

### 10.3 Tier 2 (`force-graph`) phasing

Each phase is independently shippable.

| Phase | Focus | Budget | Composes |
|---|---|---|---|
| v0.1 | Viewer core, origin-aware data model, source adapter, custom programs | 3 weeks | — |
| v0.2 | Selection / hover / drag / undo / linking-mode infrastructure | 2 weeks | — |
| v0.3 | Editing layer: CRUD with permissions, properties-form integration | 2 weeks | properties-form, detail-panel |
| v0.4 | Groups: hulls, gravity, group-involving edges, filters | 2.5 weeks | filter-stack |
| v0.5 | Doc nodes + wikilink reconciliation + markdown editor | 2 weeks | markdown-editor |
| v0.6 | Perf hardening, multi-edge expansion, advanced settings | 2 weeks | — |

**Tier 2 total: ~13.5 weeks** focused, ~18–22 calendar.

### 10.4 Tier 3 timing

Tier 3 page can begin in parallel with Tier 2 v0.3, using v0.1 + v0.2 of `force-graph` plus the available Tier 1 components. Final wiring and polish follow Tier 2 v0.6.

### 10.5 Total system budget

- Phase 0: 2 days
- Tier 1: 9–10 weeks focused (~5–6 weeks if parallelized across developers)
- Tier 2: 13.5 weeks focused (parallelizable with Tier 1 from v0.3 onward)
- Tier 3: ~2 weeks focused (largely overlaps Tier 2 tail end)

**Realistic calendar end-to-end: ~24–32 weeks for solo dev.** Substantial; phased delivery means usable components ship throughout.

---

## 11. Out of scope / deferred

Explicit non-goals or v2 candidates:

1. **Layout algorithms beyond ForceAtlas2.** Hierarchical (dagre), circular, geographic — v2.
2. **Collaborative editing.** Out of scope; hosts can layer CRDT/OT.
3. **Mobile-first interaction.** Desktop primary; touch via library defaults only.
4. **Cluster-level rendering at >100k scale.** Future v2 with Louvain clustering and zoom-driven expansion.
5. **System-origin groups (DB communities as Group entities).** v2; v1 surfaces DB labels via `nodeTypeId`.
6. ~~Live wikilink reconciliation during doc editing.~~ **Moved to v0.5** per decision #36 — reconciliation runs on doc save once the markdown editor lands. v0.1–v0.4 docs are non-editable so import-only reconciliation suffices.
7. **Image embeds in markdown (`![[image.png]]`).** Render as literal text in v1; parsed in v2.
8. **Slash commands in markdown editor.** Toolbar-only in v1; slash commands later.
9. **Multi-source composition** (one component pulling from two GraphSources simultaneously). v1 accepts one source at a time.
10. **Permission resolver shared library.** Extracted only after rich-card and force-graph both ship resolvers.

---

## 11.5 Alignment with original spec ([graph-visualizer-old.md](../../../graph-visualizer-old.md) v4)

This document **supersedes** the original spec for cross-cutting decisions. The original 21 confirmed v1 decisions in its §13.1 are mapped here:

**Inherited verbatim** (carried into the relevant per-phase plan without restating):

- Original #6 — Layout toggle ON/OFF semantics
- Original #7 — Smoothed convex hull style
- Original #8 — Doc node visual differentiator (page-corner glyph, top-right). Cross-ref decision #18 — coexists with the system-origin glyph (bottom-right) without collision since system nodes are never `kind: "doc"`.
- Original #9 — Filter composition AND-across-categories / OR-within-category
- Original #10 — Selection model as discriminated union (`{ kind, id }`)
- Original #12 — Wikilink matching rules (case-insensitive, trimmed, no accent folding, exact, alias-form)
- Original #13 — Self-referential wikilinks skipped
- Original #14 — Wikilink tiebreaking (lex-smallest id; node beats group; warnings surfaced)
- Original #15 — Image embeds (`![[image.png]]`) render as literal text in v1; cross-ref §11 #7
- Original #16 — Undo recording principle (intent-vs-mode)
- Original #17 — Composite operations as transactional history entries
- Original #18 — Undo buffer non-disable; range 10–500; default 100
- Original #19 — Keyboard shortcuts canvas-focus only
- Original #20 — UI-state cascade on deletes
- Original #21 — `graphVersion` increment timing

**Preserved by omission** (the rule still holds; this doc doesn't introduce anything that would violate it):

- Original #3 — No nested groups in v1. §4.6 defines groups without nesting; §11 doesn't relax this.

**Reinterpreted / overridden by this document:**

- **Original #1** ("Doc node editor read-only in v1") — **superseded.** Markdown editor lands in `force-graph` v0.5; doc nodes become editable. v0.1–v0.4 of `force-graph` render docs read-only because the editor isn't mounted yet, which preserves the original's spirit at those phases. See decisions #19, #20, #30, #36.
- **Original #4** ("Group-to-anything edges first-class via unified edge model") — **preserved**, extended with origin awareness (§4.5).
- **Original #11** ("Doc-edge dashing forced; per-type `dashed: false` overridden when doc node involved") — **preserved as decision #1** with the original §3.5 ambiguity fixed (group-involving edges with a doc-node endpoint ARE forced dashed; the original wording was misleading).
- **Original #2** ("Unresolved wikilink ghost nodes: listed in detail panel; no canvas rendering") — **preserved**, but storage moved from `metadata.unresolvedLinks` to a first-class `unresolvedWikilinks` field (decision #15).

**Preserved as out of scope** (all in §11):

- Original §13.2 #1 — Layout algorithms beyond FA2 → §11 #1
- Original §13.2 #2 — Collaborative editing → §11 #2
- Original §13.2 #3 — Mobile / touch → §11 #3
- Original §13.2 #4 — Group-involving SVG ceiling check → tracked as `force-graph` v0.6 perf check + Phase 0 risk

**New decisions not in the original spec** (all in §8):

- **Origin model** (#17, #18, #21, #23) — the two-layer data architecture is new and is the cornerstone of the three-mode usage (DB visualizer / personal KG / hybrid documenter)
- **Source-adapter pattern** (#22, #27, #32, #33) — DB integration was implicit in the original
- **Phased delivery** (#10) — the original was a single 9-week monolith
- **Decomposition into Tier 1 + Tier 2** (#16, #25, #26, #35) — the original was one component
- **Markdown editor specifics** (#19, #20, #30) — original deferred all editing to v2
- **Backlog commit prerequisite** (#34) — process discipline, project-specific
- **Design-system mandate enforcement** (#37) — project-specific

The original spec remains the authoritative source for `force-graph` internals (custom WebGL programs, FA2 worker integration, hull anchoring math, multi-edge expansion mechanics, edge anchor projection on hull boundaries). The system description here is the cross-cutting integration contract.

---

## 12. Open questions for sign-off

**Status: all initial sign-off questions resolved (2026-04-28).** Resolutions are recorded in §8 (Locked decisions):

| Original question | Resolution |
|---|---|
| Q1 — system name | decision #28 |
| Q2 — Tier 3 location | decision #29 |
| Q3 — markdown-editor v0.1 scope | decision #30 |
| Q4 — `forms` category timing | decision #31 |
| Q5 — stale-write policy | decision #32 |
| Q6 — Tier 1 parallelism | decision #35 |
| Q7 — annotation routing | decision #33 |
| Q8 — commit backlog first | decision #34 |

This section is currently empty; new questions land here as they surface during sub-doc authoring.

---

## 13. Update protocol

This document is **not a changelog**. When something changes:

- **Locked decision changes:** update the row in §8 in place. Add a footnote with the date and reason if the change is non-obvious.
- **Sub-doc status changes:** update the row in §9.
- **New decisions:** append to §8 (don't renumber; numbers are referenced from procomp docs).
- **Open questions resolved:** strike through in §12 with the resolution, or move to a "Resolved questions" appendix once §12 is empty.
- **Scope changes:** update §1 (vision) and §11 (out of scope) together — they must remain in sync.

When this document changes meaningfully, [.claude/STATUS.md](../../../.claude/STATUS.md) gets a one-line entry.

---

*End of system description. Next stage: Stage 2 system plan (`graph-system-plan.md`), authored only after all per-procomp description docs are signed off.*
