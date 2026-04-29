# `force-graph` — Pro-component Description

> **Status:** **signed off 2026-04-28** (with amendment per [system decision #38](../../systems/graph-system/graph-system-description.md#8-locked-decisions-index) signed off 2026-04-29 — dashed-edge feature removed + Phase 0 risk spike cancelled; replaced with stock-Sigma color/size differentiation. Strikethroughs throughout this doc preserve historical record). Per-phase plan authoring (`force-graph-v0.1-plan.md` through `force-graph-v0.6-plan.md`) may begin per the [§9 cascade](#9-sign-off-checklist).
> **Slug:** `force-graph`
> **Category:** `data`
> **Created:** 2026-04-28
> **Last updated:** 2026-04-29 (amendment #38 cascade applied: dashed→soft visual rule throughout §2.1/§2.5/§3/§7.1/§8.5; "Phase 0 dep" column dropped from §2 table; SVG fallback path superseded; checklist items 4 + 15 superseded)
> **Owner:** ilinxa team
> **Parent system:** [graph-system](../../systems/graph-system/graph-system-description.md) — Tier 2 (graph-specific; the WebGL canvas + state store)

This is Stage 1 of the [procomp gate](../README.md). It answers *should we build this at all, and what shape should it be?* It does NOT specify implementation — that's Stage 2 (per-phase plans `force-graph-v0.1-plan.md` through `force-graph-v0.6-plan.md`; v0.1 plan signed off 2026-04-28).

The system-level constraints in [graph-system-description.md §8](../../systems/graph-system/graph-system-description.md) (decisions #1–#5, #7–#15, #17–#18, #21–#27, #32–#33, #35–#37) are inherited as constraints; this doc does not re-litigate them. Internal mechanics — data structures, custom WebGL programs, FA2 worker integration, hull anchoring, multi-edge expansion — remain anchored to [graph-visualizer-old.md](../../../graph-visualizer-old.md) as the authoritative source. The system description supersedes it for cross-cutting only.

---

## 1. Problem

Force-directed knowledge-graph visualization at 100k-node scale is a hard component to "drop in":

- Generic graph libraries (vis-network, react-force-graph, cytoscape, ngraph) each cover *some* of what's needed, *none* cover all of: typed nodes/edges with custom WebGL rendering, structural groups with smooth-hull overlays, doc-node markdown linking with wikilink reconciliation, source-adapter pattern for live DB data, origin-aware mixed-permission editing, undo/redo with composite transactional entries, multi-edge collapsing+expansion.
- Hand-rolling produces ~80–120 files with deeply coupled cross-cutting concerns (the rejected monolith approach — see [graph-system §1.4](../../systems/graph-system/graph-system-description.md#14-why-decompose-instead-of-building-one-big-component)).
- The graph-system's three usage modes ([§1.1 of system description](../../systems/graph-system/graph-system-description.md#11-the-problem)) — DB visualizer, personal Obsidian-like KG, hybrid documenter — all need the **same** visualization surface, distinguished only by the data origin distribution. A Tier 1 component can't supply this; it's intrinsically graph-specific.

The Tier 1 components ([properties-form](../properties-form-procomp/properties-form-procomp-description.md), [detail-panel](../detail-panel-procomp/detail-panel-procomp-description.md), [filter-stack](../filter-stack-procomp/filter-stack-procomp-description.md), [entity-picker](../entity-picker-procomp/entity-picker-procomp-description.md), [markdown-editor](../markdown-editor-procomp/markdown-editor-procomp-description.md)) each solve a piece. They are useful far beyond graphs; they don't know about graph state. The integration belongs at Tier 3 (the graph-system page) — but only if there's a Tier 2 component that owns the graph state and exposes the actions/selectors needed to wire Tier 1 panels in.

**`force-graph` closes the gap.** It owns:

- The WebGL canvas and its custom edge/node programs (Sigma + graphology MultiGraph + ForceAtlas2 in Web Worker)
- The graph state store (Zustand, selector-based — supports the high-frequency reads from many panels without whole-tree re-renders)
- The two-layer storage strategy (graphology native for node↔node; Zustand slice for group-involving edges)
- The source-adapter integration (`GraphInput = GraphSnapshot | GraphSource`)
- The origin-aware permission resolver
- The actions/selectors API the host wires Tier 1 panels through

It does NOT own panel composition, source adapters (decision #27 — those live outside the registry), or page chrome. Per [decision #35](../../systems/graph-system/graph-system-description.md), it composes Tier 1 components only at the host level — `force-graph` itself never imports a Tier 1 component.

---

## 2. Phased delivery (v0.1 → v0.6)

Per [decision #10](../../systems/graph-system/graph-system-description.md) and [system §10.3](../../systems/graph-system/graph-system-description.md#103-tier-2-force-graph-phasing): six phases, ~13.5 weeks focused. Each phase is independently shippable. **Tier 1 dependencies gate per-phase plan-locks**, not per-phase implementation — `force-graph` v0.1 + v0.2 + v0.6 compose zero Tier 1 components and can implement before any Tier 1 lands.

| Phase | Focus | Budget | Composes Tier 1 |
|---|---|---|---|
| **v0.1** | Viewer core + origin-aware data model + source adapter + stock-Sigma rendering | 3w | none |
| **v0.2** | Selection / hover / drag / undo / linking-mode infrastructure | 2w | none |
| **v0.3** | Editing layer (CRUD with permissions) | 2w | `properties-form`, `detail-panel` |
| **v0.4** | Groups (hulls, gravity, group-involving edges, filters) | 2.5w | `filter-stack` |
| **v0.5** | Doc nodes + wikilink reconciliation + markdown editor | 2w | `markdown-editor` |
| **v0.6** | Perf hardening + multi-edge expansion + advanced settings | 2w | none |

> "Phase 0 dep" column removed per [system decision #38](../../systems/graph-system/graph-system-description.md#8-locked-decisions-index) (2026-04-29) — Phase 0 risk spike cancelled; v0.1 substrate is stock Sigma, no GPU benchmark prerequisite. v0.1 focus updated from "custom programs" to "stock-Sigma rendering."

[`entity-picker`](../entity-picker-procomp/entity-picker-procomp-description.md) is composed inside Tier 3 (linking-mode UI in v0.3, group-membership editor in v0.4) but does NOT appear in `force-graph` itself per [decision #35](../../systems/graph-system/graph-system-description.md). The host wires it; `force-graph` exposes the actions it needs (`enterLinkingMode`, `addNodeToGroup`, etc.).

~~**Phase 0 risk spike** (2 days, independent of procomp gate, [system §10.1](../../systems/graph-system/graph-system-description.md#101-phase-0--risk-spike-2-days)): prototype `DashedDirectedEdgeProgram` (custom Sigma WebGL edge program supporting solid+dashed × arrows × straight+curved) and benchmark at 100k edge scale. **Gate: ≥30 fps on integrated GPU.** If this fails, the entire system replans — `force-graph` falls back to SVG-overlay rendering with a practical edge ceiling of ~5k visible. Tier 1 components are unaffected. This description writes against the assumption that the spike succeeds; the SVG fallback path is documented in §3 (out of scope refinements) and §8.5 plan-stage tightenings.~~

**Edge rendering substrate** (per [system decision #38](../../systems/graph-system/graph-system-description.md#8-locked-decisions-index), 2026-04-29 amendment): stock Sigma `EdgeRectangleProgram` for straight + `@sigma/edge-curve` for curved + `@sigma/edge-arrow` for directed. No custom WebGL edge program; no Phase 0 prerequisite. Visual differentiation between "soft" (doc-involving or per-type-flagged) and "default" edges via per-edge `color` + `size` attributes — see §2.5 for the soft-edge rule and [decision #38](../../systems/graph-system/graph-system-description.md#8-locked-decisions-index) for the full contract.

### 2.1 v0.1 — Viewer core (3 weeks)

The minimum useful viewer. Read-only. Plain disc nodes (no icons yet — `IconNodeProgram` lands in v0.5 per spec §11.5).

**Ships:**

- **`<ForceGraph>` component** — accepts `GraphInput` (snapshot or live source), renders WebGL canvas
- **Origin-aware data model** ([§4 of system description](../../systems/graph-system/graph-system-description.md#4-the-two-layer-data-model-cross-cutting)) — every node and edge carries `origin: "system" | "user"` ([decision #17](../../systems/graph-system/graph-system-description.md)); `systemRef` mandatory when `origin === "system"`
- **Two-layer storage** ([spec §3.4](../../../graph-visualizer-old.md)) — node↔node edges in graphology MultiGraph; group-involving edges in Zustand store slice. Externally one `edges[]` array; internally partitioned.
- **`importSnapshot` + `validateSnapshot`** ([decision #5](../../systems/graph-system/graph-system-description.md)) — checks ID uniqueness within nodes/groups + cross-disjointness, edge endpoint resolution, `memberNodeIds`/`groupIds` agreement (with `memberNodeIds` canonical per [decision #2](../../systems/graph-system/graph-system-description.md)), no self-loops, **`origin` present on every node and edge**, **`systemRef` well-formed when system-origin**. Structured error returns; rejects malformed snapshots.
- **`exportSnapshot`** — walks the single `state.edgeOrder: string[]` array ([decision #3](../../systems/graph-system/graph-system-description.md)) preserving insertion order across both storage layers.
- **`GraphSource` integration** — `loadInitial`, optional `subscribe`, optional `applyMutation`. Real-time deltas preserve UI state ([decision #22](../../systems/graph-system/graph-system-description.md)) and don't enter the undo stack.
- **Stock-Sigma edge rendering** (per [decision #38](../../systems/graph-system/graph-system-description.md#8-locked-decisions-index), 2026-04-29 amendment; supersedes ~~`DashedDirectedEdgeProgram`~~) — `EdgeRectangleProgram` for straight + `@sigma/edge-arrow` for directed (`@sigma/edge-curve` deferred to v0.6 multi-edge expansion). Visual differentiation between "soft" and "default" edges via per-edge `color` + `size` attributes computed at edge-add time. No custom WebGL development; no Phase 0 prerequisite.
- **Plain-disc node rendering** — Sigma's stock `NodeCircleProgram`. Icons + doc-glyph come in v0.5.
- **ForceAtlas2 layout** in Web Worker (`graphology-layout-forceatlas2/worker`); group gravity is NOT yet wired (lands in v0.4).
- **Layout toggle ON/OFF** ([spec §10](../../../graph-visualizer-old.md)) — kicks of `layoutSettleDuration` on mutation; bulk pinning via `pinAllPositions`.
- **`graphVersion` increment plumbing** ([decision #4](../../systems/graph-system/graph-system-description.md), [spec §5.2](../../../graph-visualizer-old.md)) — bumps on rendering-affecting changes; not on filter/UI/settings; consumed via `useGraphSelector` hook to ensure selectors observe it.
- **UI-state cascade on deletes** ([spec §5.2](../../../graph-visualizer-old.md)) — when an entity is deleted, cleared/updated: `selection`, `hovered`, `multiEdgeExpanded`, `linkingMode.source`. Without this, panels reading stale references crash.
- **`origin` glyph on system nodes** ([decision #18](../../systems/graph-system/graph-system-description.md)) — small DB-source glyph in bottom-right corner. (Doc glyph is top-right; system nodes are never `kind === "doc"`, so no collision.)
- **Permission resolver scaffolding** ([decision #25](../../systems/graph-system/graph-system-description.md)) — own resolver lives in `force-graph`. v0.1 only enforces canonical-field read-only on system nodes; full resolver lands with v0.3 editing.
- **Source adapters live outside the registry** ([decision #27](../../systems/graph-system/graph-system-description.md)) — `force-graph` is generic over them; this phase ships the contract, not adapters.
- **Theming** via [globals.css](../../../src/app/globals.css) CSS variables ([decision #37](../../systems/graph-system/graph-system-description.md)). Custom theme overrides fall back to dark-theme defaults regardless of system theme ([decision #8](../../systems/graph-system/graph-system-description.md)).

**Doesn't ship:** selection, hover, click, drag, edit, groups, doc-node visuals, filters, search, undo/redo, multi-edge expansion, advanced settings UI. v0.1 is a *viewer* — read-only canvas with layout running.

### 2.2 v0.2 — Interaction infrastructure (2 weeks)

The interaction layer. Still no editing.

**Ships:**

- **Selection model** as discriminated union ([spec §5.2](../../../graph-visualizer-old.md)): `{ kind: "node" | "group" | "edge", id }` or `null`.
- **Hover state** + focus+neighbors highlight (dim everything else).
- **Click-to-select** — but per the **click precedence rule** ([spec §5.2](../../../graph-visualizer-old.md)): when `linkingMode.active === true`, canvas clicks set the edge target instead. **Single-member group click target is the group**, not the contained node ([decision #13](../../systems/graph-system/graph-system-description.md)).
- **Drag-to-pin** — drop auto-pins; recorded as a drag-coalesced transactional history entry (single entry covering position commit + pin toggle).
- **Linking-mode infrastructure** — `enterLinkingMode(source)` / `exitLinkingMode()` actions. Esc cancels. UI cursor change. Tier 3 + `entity-picker` provide the picker chrome; `force-graph` only owns the canvas-side state.
- **Undo/redo** with composite transactional entries ([spec §5.5](../../../graph-visualizer-old.md)) — recording principle: **user intent about specific data** is recorded; **mode-of-operation** changes are not. Buffer 10–500, default 100, cannot be 0. Keyboard shortcuts canvas-focus only (`tabIndex={0}` on canvas root); hosts wire broader scope by calling `actions.undo()` / `actions.redo()`.
- **Keyboard shortcuts** scoped to canvas focus: Cmd/Ctrl+Z (undo), Cmd/Ctrl+Shift+Z + Ctrl+Y (redo), Esc (exit linking mode).
- **`setNodePositions(batch, options?: { silent?: boolean })`** ([decision #7](../../systems/graph-system/graph-system-description.md)) — silent mode bypasses undo recording for layout-load and procedural placement.
- **`useGraphSelector(fn)` hook** ([decision #4](../../systems/graph-system/graph-system-description.md)) — codifies that selectors reading graphology MUST observe `graphVersion`. Hook bakes this in; consumers can't forget.
- **Public selectors API** — `neighborsOf(id, kind)`, `parallelEdgesBetween(a, b)`, `visibleNodeIds`, `visibleEdgeIds` (filters not yet present, so this returns "all").

**Doesn't ship:** add/edit/delete affordances (host can call actions; no UI), groups, doc nodes, filters/search.

### 2.3 v0.3 — Editing layer (2 weeks)

CRUD lands. Plan-locks `properties-form` and `detail-panel`.

**Ships:**

- **Node CRUD** (`addNode`, `updateNode`, `deleteNode`, `pinNode`) — all recorded with composite transactional entries; deletes cascade to incident edges + group memberships + UI-state refs.
- **Edge CRUD** (`addEdge`, `updateEdge`, `deleteEdge`) — accepts any endpoint kind combination; dispatches internally to graphology-native or group-edge slice.
- **Type CRUD** (`NodeType` + `EdgeType`) — refuses delete if any entity references the type; UI prompts to reassign.
- **Origin-aware permission resolver** (full implementation, [decision #25](../../systems/graph-system/graph-system-description.md)). Layered resolution per [system §5.2](../../systems/graph-system/graph-system-description.md#52-layered-resolution): predicate escape hatch → per-entity meta lock → origin × action defaults → reject. Permission tooltip pattern from rich-card.
- **System-canonical-field read-only enforcement** ([decision #23](../../systems/graph-system/graph-system-description.md)) — canonical fields immutable; `annotations` field user-writable even on system nodes.
- **Annotations through `applyMutation`** ([decision #33](../../systems/graph-system/graph-system-description.md)) — single GraphSource method with a `setAnnotation` variant; not a separate `applyAnnotation` channel.
- **User-edges-between-system rule** ([decision #21](../../systems/graph-system/graph-system-description.md)) — user-authored edges between two system nodes are `origin: "user"`, regardless of endpoint origins.
- **Schema reactivity by graceful degradation** ([decision #24](../../systems/graph-system/graph-system-description.md)) — unknown `schemaType` auto-registers a neutral default `NodeType` and surfaces a notification; no crash.
- **Stale-write conflict policy: last-write-wins + warning banner** ([decision #32](../../systems/graph-system/graph-system-description.md)) — if upstream source mutates an entity currently being edited, user's submit applies; banner surfaces "this was updated remotely while you were editing." Optimistic concurrency tokens are an additive upgrade path.
- **DetailPanel "Edit" is inline**, not modal ([decision #6](../../systems/graph-system/graph-system-description.md)) — host slots `<DetailPanel.Body>` between read view and an edit form (typically `<PropertiesForm>` per [properties-form §6.1+§6.2](../properties-form-procomp/properties-form-procomp-description.md)).
- **Mixed-permission entity editing** ([properties-form §6.2 showcase](../properties-form-procomp/properties-form-procomp-description.md)) — the host computes per-field permissions from origin via the resolver and supplies them to `<PropertiesForm>` (force-graph doesn't derive the schema).

### 2.4 v0.4 — Groups (2.5 weeks)

Group rendering + filter integration. Plan-locks `filter-stack`.

**Ships:**

- **Group CRUD** (`addGroup`, `updateGroup`, `deleteGroup`, `addNodeToGroup`, `removeNodeFromGroup`).
- **Smoothed convex hull overlay** ([spec §7.1](../../../graph-visualizer-old.md)) via SVG layer. Inflated by `groupHullPadding`; smoothed via cubic Bezier curves through hull vertices; group name at hull centroid with backdrop pill.
- **Hull edge cases** — single-member: circular halo; two-member: stadium/capsule; empty group: pill near world origin.
- **Group gravity** as custom force component in FA2 ([spec §7.4](../../../graph-visualizer-old.md)) — attractive force toward member centroid scaled by `group.gravity * settings.forces.groupGravity`.
- **Group-involving edges** rendered through SVG overlay with hull-boundary anchoring ([spec §7.3](../../../graph-visualizer-old.md)) — endpoints anchor to closest hull-boundary point each frame.
- **Hull recomputation throttled** to ~10fps via dirty-flag + `requestAnimationFrame`.
- **Hover behavior on hulls** — hovered hull rises to ~25% alpha; non-hovered fade to ~8%; non-hovered labels dim.
- **Filters infrastructure** — group filter with union/intersection mode toggle; clear-all. Host wires `<FilterStack>` ([filter-stack §6.1 showcase](../filter-stack-procomp/filter-stack-procomp-description.md)) to force-graph's filter actions/selectors.
- **`visibleNodeIds`/`visibleEdgeIds`/`visibleGroupIds`** selectors (proper implementation; decision #12 search-overrides-filters lands in v0.6 with the search section).
- **Edge visibility rules** ([spec §5.2](../../../graph-visualizer-old.md)) — edge visible iff both endpoints visible AND its type is filtered in AND wikilink-derived edges are visible per setting.
- **Group visibility for hulls** — hull renders iff at least one member is currently visible (filters cascade to hulls).

**Doesn't ship:** node-type filter, edge-type filter, search (those land in v0.6).

### 2.5 v0.5 — Doc nodes + wikilink reconciliation (2 weeks)

Doc-node visuals, the markdown editor, and reconciliation. Plan-locks `markdown-editor`.

**Ships:**

- **Custom `IconNodeProgram`** ([spec §11.4](../../../graph-visualizer-old.md)) — fragment-shader-driven; renders icons (lucide texture atlas, [decision #11](../../systems/graph-system/graph-system-description.md): 64-icon sub-atlas in v0.1, runtime atlas rebuilding deferred), doc-glyph (folded-page corner, top-right), system-origin glyph (DB-source, bottom-right per [decision #18](../../systems/graph-system/graph-system-description.md)), selection ring + hover glow.
- **Doc-node kind support** with full visual treatment.
- **Markdown editor mounting in Detail Panel** for editable doc-kind entities (host slots `<MarkdownEditor>` per [markdown-editor §6.1 showcase](../markdown-editor-procomp/markdown-editor-procomp-description.md)).
- **Wikilink reconciliation** ([decision #36](../../systems/graph-system/graph-system-description.md), [spec §3.10](../../../graph-visualizer-old.md)) — runs on `importSnapshot` AND on doc-node save (Cmd+S from the markdown editor's `onSave` callback). v0.1–v0.4 doc nodes are read-only because the editor isn't mounted; import-only reconciliation suffices for those phases.
- **Wikilink matching rules**: case-insensitive, leading/trailing whitespace trimmed, **internal whitespace preserved**, no accent folding, exact label match, alias-form `[[Target|alias]]` (resolution uses pre-pipe).
- **Tiebreaking**: lex-smallest `id` wins for case-collision; **node beats group**; warnings surface in detail panel.
- **Self-referential wikilinks skipped** (no self-loops, [spec §3.10 #2](../../../graph-visualizer-old.md)).
- **Image embeds (`![[...]]`) NOT parsed** ([spec §3.10](../../../graph-visualizer-old.md), [decision #30](../../systems/graph-system/graph-system-description.md), [system §11 #7](../../systems/graph-system/graph-system-description.md)) — render as literal text in preview; editor decoration treats them as plain text.
- **Derived edges**: each resolved wikilink produces a `derivedFromWikilink: true, origin: "user", direction: "directed"` edge; auto-rendered as **soft** per [decision #38](../../systems/graph-system/graph-system-description.md#8-locked-decisions-index) (the source is a doc node, satisfying the soft-edge predicate).
- **Reconciliation sweep on save**: removes stale `derivedFromWikilink: true` edges whose source doc no longer contains the matching wikilink; idempotent across re-imports.
- **Deleting a `derivedFromWikilink: true` edge is refused in the UI** ([decision #9](../../systems/graph-system/graph-system-description.md)) — tooltip "Edit the source doc to remove this link." Programmatic `deleteEdge` accepts but logs a warning.
- **`unresolvedWikilinks: string[]`** as a first-class field on doc nodes ([decision #15](../../systems/graph-system/graph-system-description.md)) — NOT stored in `metadata.unresolvedLinks`. Detail panel surfaces unresolved + self-link + tiebreaking warnings.
- **Soft-edge rule finalized** ([decision #38](../../systems/graph-system/graph-system-description.md#8-locked-decisions-index), supersedes ~~#1~~) — an edge renders **soft** (`color: --muted-foreground`, `size: 1`) iff at least one endpoint is a node of `kind === "doc"`, OR (no doc-node endpoint AND `edgeType.softVisual === true`). Otherwise renders **default** (`color: --foreground`, `size: 1.5`). Group endpoints do NOT transit doc-ness — group↔group edges follow the per-edgetype `softVisual` flag regardless. Implementation via stock Sigma per-edge `color` + `size` attributes; no custom WebGL.

### 2.6 v0.6 — Perf hardening + multi-edge + advanced settings (2 weeks)

The polish phase. Profile, validate, and ship the long-tail UX.

**Ships:**

- **Multi-edge expansion** — count badges on collapsed multi-edges; click to expand into curved parallel edges; auto-collapse via UI-state cascade if the parallel set drops below 2.
- **Search** (`setSearchQuery`) with **search-overrides-filters** semantics ([decision #12](../../systems/graph-system/graph-system-description.md)) — matched nodes always visible + glow, regardless of group/type filters.
- **Edge labels viewport-culled by default** ([decision #14](../../systems/graph-system/graph-system-description.md)) + `edgeLabelZoomThreshold` (default 0.7).
- **Node-type and edge-type filters** (filter-stack categories added to the panel host-side).
- **Advanced settings panel host-side composition** (force-graph exposes the action surface; host renders the chrome via shadcn primitives + accordion — NOT a pro-component per [system §3.4](../../systems/graph-system/graph-system-description.md#34-what-is-intentionally-not-a-pro-component)).
- **Performance profiling at 100k nodes / 200k edges**: hull throttle tuning, label culling tuning, `hideEdgesOnMove` verification, group-involving edge SVG ceiling check ([spec §11.2](../../../graph-visualizer-old.md): if visible group-involving edges exceed ~3k, migrate that layer to canvas — plan-stage gate).
- **Custom node program fallback validation** — verify SVG-overlay path works for ≤5k visible nodes if `IconNodeProgram` doesn't stabilize in production.
- **Undo buffer memory check** — confirm inverse-operation entries scale to buffer 500.
- **Bundle audit** — final size budget enforcement.

---

## 3. Out of scope (deferred or external)

Locked at the system level (most), or scoped down by this Tier 2 description (some):

- **Layout algorithms beyond ForceAtlas2** — hierarchical (dagre), circular, geographic, geographic GIS. v2.
- **Collaborative editing (CRDT/OT)** — out of scope; hosts can layer on top of snapshot/delta API ([system §11 #2](../../systems/graph-system/graph-system-description.md)).
- **Mobile-first / touch primary interaction** — desktop primary; touch via Sigma defaults ([system §11 #3](../../systems/graph-system/graph-system-description.md)).
- **Cluster-level rendering at >100k node scale** — Louvain clustering with zoom-driven expansion is v2 ([system §11 #4](../../systems/graph-system/graph-system-description.md)).
- **System-origin groups** — groups always `origin: "user"` in v1 ([§4.6 of system description](../../systems/graph-system/graph-system-description.md#46-group-origin)); v2 may introduce DB-derived community groups.
- **Image embeds in markdown** ([system §11 #7](../../systems/graph-system/graph-system-description.md)) — literal text in v1.
- **Live wikilink hover preview** in the editor — markdown-editor v0.2 ([decision #30](../../systems/graph-system/graph-system-description.md)).
- **Multi-source composition** (one component pulling from two `GraphSource`s simultaneously) — v1 accepts one source at a time.
- **Source adapters** ([decision #27](../../systems/graph-system/graph-system-description.md)) — Kuzu, Neo4j, Memgraph adapters live outside the registry as host code or companion packages. `force-graph` is generic over them.
- **The Tier 3 page** — `src/app/systems/graph-system/page.tsx` ([decision #29](../../systems/graph-system/graph-system-description.md)) — host code, not a registry component.
- **Control sliders / advanced settings panel** — host-composed from shadcn primitives + accordion, not a pro-component ([system §3.4](../../systems/graph-system/graph-system-description.md)).
- **Permission-resolver shared library** — extracted only after `rich-card` and `force-graph` both ship resolvers ([decision #25](../../systems/graph-system/graph-system-description.md)).
- **Cross-Tier-1 imports** ([decision #35](../../systems/graph-system/graph-system-description.md)) — `force-graph` does not import any Tier 1 component at registry level; composition happens at host/Tier 3 only.

~~**SVG fallback path** (Phase 0 risk-spike contingency): if `DashedDirectedEdgeProgram` fails the ≥30 fps gate at 100k edges on integrated GPU, the entire system replans. `force-graph` falls back to SVG-overlay rendering for all edges; practical edge ceiling drops to ~5k visible. Tier 1 components are unaffected. This description writes against the WebGL-pipeline-succeeds assumption; the SVG fallback is a contingency, not v0.1 scope.~~

**SVG fallback path SUPERSEDED** by [decision #38](../../systems/graph-system/graph-system-description.md#8-locked-decisions-index): with stock-Sigma rendering as the v0.1 substrate, there is no custom-WebGL gate that could fail and trigger the fallback. Stock `EdgeRectangleProgram` is well-proven at the 100k-edge target on integrated GPUs; if real-world performance falls short post-implementation, optimization happens in v0.6 perf-hardening — not as a system-replan contingency.

---

## 4. Target consumers

In dependency order:

1. **Tier 3 graph-system page** ([decision #29](../../systems/graph-system/graph-system-description.md): `src/app/systems/graph-system/page.tsx`) — the **primary driver**. Composes `<ForceGraph>` with all five Tier 1 panels (filter-stack sidebar, detail-panel right pane, properties-form inside detail-panel, entity-picker for linking-mode + group membership, markdown-editor inside doc-node detail). The integration test for the system contract.
2. **DB-visualizer host applications** — wrap `<ForceGraph>` with a Kuzu / Neo4j / Memgraph source adapter (host code per [decision #27](../../systems/graph-system/graph-system-description.md)). Read-mostly. User annotations writable on system nodes per [decision #23](../../systems/graph-system/graph-system-description.md).
3. **Personal Obsidian-like KG applications** — static snapshot mode; full CRUD; user owns all data; doc nodes carry markdown bodies authored via the embedded markdown-editor.
4. **Hybrid documenter applications** — both modes mixed: live DB source provides system-origin nodes + edges; user authors annotation edges + doc nodes that reference DB nodes via `[[wikilinks]]`.
5. **Speculative future consumers** — any registry component or page that needs interactive force-directed visualization at scale (e.g., a future "knowledge browser" surface, dependency graphs, org charts).

Critically, **`force-graph` is graph-specific**. Unlike Tier 1 components, it has no standalone use outside graph-shaped data. This is per its Tier 2 placement ([system §3.2](../../systems/graph-system/graph-system-description.md#32-tier-2--graph-pro-component)).

---

## 5. Rough API sketch

Final shapes locked in Stage 2. The API has four surfaces: **props** (configuration + lifecycle), **actions** (state mutations), **selectors** (state reads), and the **imperative ref handle** (escape hatch).

### 5.1 Top-level component

```ts
import type { GraphSnapshot, GraphSource, GraphInput } from "./types";

interface ForceGraphProps {
  // Data input
  data: GraphInput;                                    // snapshot or live source

  // Lifecycle callbacks
  onChange?: (snapshot: GraphSnapshot) => void;        // emitted on any user mutation
  onSelectionChange?: (selection: Selection) => void;
  onError?: (error: { code: string; message: string }) => void;

  // Permission resolver (optional override)
  resolvePermission?: (entity: Node | Edge | Group, action: PermissionAction) => boolean | undefined;

  // Theming
  theme?: "dark" | "light" | "custom";
  customColors?: Partial<Record<ThemeKey, string>>;    // missing keys fall back to dark per decision #8

  // A11y / styling
  ariaLabel?: string;
  className?: string;
}

function ForceGraph(props: ForceGraphProps): JSX.Element;
```

### 5.2 Graph data shapes

Mirrors [original spec §3.1–§3.10](../../../graph-visualizer-old.md) with origin extensions per [system §4](../../systems/graph-system/graph-system-description.md#4-the-two-layer-data-model-cross-cutting):

```ts
interface GraphSnapshot {
  version: "1.0";
  nodes: Node[];                                       // all carry `origin`
  edges: Edge[];                                       // all carry `origin`; unified node↔node + group-involving
  groups: Group[];                                     // always origin: "user" in v1 (decision #6 → v2)
  edgeTypes: EdgeType[];
  nodeTypes: NodeType[];
  settings: GraphSettings;
}

type GraphInput = GraphSnapshot | GraphSource;

interface GraphSource {
  loadInitial(): Promise<GraphSnapshot>;
  subscribe?(callback: (delta: GraphDelta) => void): () => void;
  applyMutation?(mutation: UserMutation): Promise<MutationResult>;
}

type Origin = "system" | "user";

interface BaseNode {
  id: string;
  label: string;
  kind: "normal" | "doc";
  origin: Origin;                                      // mandatory; decision #17
  systemRef?: { source: string; sourceId: string; schemaType?: string };  // mandatory iff origin === "system"
  position?: { x: number; y: number };
  pinned?: boolean;
  groupIds: string[];                                  // derived index; canonical is group.memberNodeIds (decision #2)
  metadata?: Record<string, unknown>;
  annotations?: Record<string, unknown>;               // user-writable even on system nodes (decision #23)
  unresolvedWikilinks?: string[];                      // first-class on doc nodes (decision #15)
}
```

Edge / Group / EdgeType / NodeType / Settings shapes inherit from [spec §3](../../../graph-visualizer-old.md) with `origin` added to Edge per [decision #17](../../systems/graph-system/graph-system-description.md). Plan stage locks the full shapes.

### 5.3 Public actions API

The full action surface is large (~30 actions). Plan stage locks the exact list. v0.1–v0.6 introduce them progressively per the phasing in §2.

Categories (representative members shown):

```ts
interface Actions {
  // Snapshots
  importSnapshot(snapshot: GraphSnapshot): void;       // not recorded; clears history
  exportSnapshot(): GraphSnapshot;

  // Node CRUD (v0.3+)
  addNode(input: NewNodeInput): string;
  updateNode(id: string, patch: Partial<Node>): void;
  deleteNode(id: string): void;
  pinNode(id: string, pinned: boolean): void;
  setNodePositions(batch: Array<{ id: string; x: number; y: number }>, options?: { silent?: boolean }): void;

  // Edge CRUD (v0.3+) — accepts any endpoint kind combination
  addEdge(input: NewEdgeInput): string;
  updateEdge(id: string, patch: Partial<Edge>): void;
  deleteEdge(id: string): void;

  // Group CRUD (v0.4+)
  addGroup(input: NewGroupInput): string;
  updateGroup(id: string, patch: Partial<Group>): void;
  deleteGroup(id: string): void;
  addNodeToGroup(nodeId: string, groupId: string): void;
  removeNodeFromGroup(nodeId: string, groupId: string): void;

  // Type CRUD (v0.3+)
  addNodeType(input: Omit<NodeType, "id">): string;
  // ... updateNodeType, deleteNodeType, addEdgeType, updateEdgeType, deleteEdgeType

  // Selection / hover (v0.2+)
  select(target: Selection): void;
  hover(target: HoverState | null): void;

  // Linking mode (v0.2+)
  enterLinkingMode(source: EndpointRef): void;
  exitLinkingMode(): void;

  // Filters (v0.4+)
  setGroupFilter(groupIds: Set<string>): void;
  setGroupFilterMode(mode: "union" | "intersection"): void;
  // ... node-type / edge-type / search (v0.6)
  clearAllFilters(): void;

  // Layout (v0.1+)
  setLayoutEnabled(enabled: boolean): void;
  rerunLayout(): void;
  pinAllPositions(): void;

  // Multi-edge (v0.6)
  expandMultiEdge(a: EndpointRef, b: EndpointRef): void;
  collapseMultiEdge(): void;

  // Undo / redo (v0.2+)
  undo(): void;
  redo(): void;
  canUndo(): boolean;
  canRedo(): boolean;

  // Settings (v0.6)
  updateSettings(patch: Partial<GraphSettings>): void;
  resetSettings(): void;
}
```

### 5.4 Public selectors API

`useGraphSelector(fn)` ([decision #4](../../systems/graph-system/graph-system-description.md)) is the single entry point — it internally observes `graphVersion` so consumers can't forget the dependency. Exposed selectors:

```ts
// Read state
useGraphSelector((s) => s.selection);
useGraphSelector((s) => s.hovered);
useGraphSelector((s) => s.filters);
useGraphSelector((s) => s.linkingMode);
useGraphSelector((s) => s.settings);

// Derived selectors (memoized inside the store)
useGraphSelector((s) => s.derived.visibleNodeIds);     // Set<string>
useGraphSelector((s) => s.derived.visibleEdgeIds);
useGraphSelector((s) => s.derived.visibleGroupIds);
useGraphSelector((s) => s.derived.neighborsOf(id, kind));
useGraphSelector((s) => s.derived.parallelEdgesBetween(a, b));
useGraphSelector((s) => s.derived.groupHullPoints(groupId));
```

### 5.5 Imperative ref handle

```ts
interface ForceGraphHandle {
  // Snapshots (also available via actions; here for ref-based hosts)
  getSnapshot(): GraphSnapshot;
  setSnapshot(s: GraphSnapshot): void;

  // Camera / focus
  focusNode(id: string, options?: { animate?: boolean; zoom?: number }): void;
  focusGroup(id: string, options?: { animate?: boolean; zoom?: number }): void;
  resetCamera(options?: { animate?: boolean }): void;

  // Layout escape hatch
  getNodePositions(): Array<{ id: string; x: number; y: number }>;
  setNodePositions(batch: Array<{ id: string; x: number; y: number }>, options?: { silent?: boolean }): void;

  // Underlying instances (substrate-leak escape hatch — major-version-bump risk if substrate swaps)
  getSigmaInstance(): unknown;                         // Sigma instance
  getGraphologyInstance(): unknown;                    // graphology MultiGraph
}
```

---

## 6. Example usages

### 6.1 DB visualizer mode (showcase — Kuzu source adapter, read-mostly with user annotations)

```tsx
// Kuzu source adapter (host code; lives outside the registry per decision #27)
const kuzuSource: GraphSource = {
  async loadInitial() {
    const result = await fetch("/api/kuzu/snapshot").then((r) => r.json());
    return ensureOrigin(result, "system");             // adapter stamps origin on every entity
  },
  subscribe(callback) {
    const ws = new WebSocket("/api/kuzu/stream");
    ws.onmessage = (e) => callback(JSON.parse(e.data) as GraphDelta);
    return () => ws.close();
  },
  async applyMutation(mutation) {
    // Annotations and user-origin entities persist to user-side storage; canonical Kuzu data is read-only
    if (mutation.type === "setAnnotation" || mutationIsUserOrigin(mutation)) {
      return persistUserMutation(mutation);
    }
    return { ok: false, error: { code: "READ_ONLY", message: "DB canonical fields are read-only" } };
  },
};

<ForceGraph
  data={kuzuSource}
  onChange={(snap) => persistUserLayer(snap)}          // host owns user-layer persistence
  resolvePermission={(entity, action) => {
    // Defer to default origin × action table for everything except the annotation case
    if (action === "edit-annotation") return true;
    return undefined;                                  // defer to default resolver
  }}
  theme="dark"
/>
```

The host's source adapter stamps `origin: "system"` on entities from Kuzu; user-authored annotations route through `applyMutation` with `setAnnotation` per [decision #33](../../systems/graph-system/graph-system-description.md). Permission resolver enforces canonical-field read-only per [decision #23](../../systems/graph-system/graph-system-description.md).

### 6.2 Personal Obsidian-like KG (static snapshot, full CRUD)

```tsx
const initial: GraphSnapshot = loadFromLocalStorage() ?? createEmptySnapshot();

function PersonalKG() {
  const [snapshot, setSnapshot] = useState(initial);

  return (
    <ForceGraph
      data={snapshot}                                  // static snapshot mode
      onChange={(snap) => {
        setSnapshot(snap);
        saveToLocalStorage(snap);
      }}
      theme="light"
    />
  );
}
```

User owns all data; every node + edge is `origin: "user"`; full CRUD; doc nodes carry markdown bodies authored via the host-slotted markdown-editor in v0.5+. The static snapshot mode requires no `subscribe` or `applyMutation` — mutations live in component state until the host persists them via `onChange`.

### 6.3 Tier 3 graph-system page (full panel composition — the integration test)

```tsx
// src/app/systems/graph-system/page.tsx (host code, NOT a registry component)
"use client";

export default function GraphSystemPage() {
  const ref = useRef<ForceGraphHandle>(null);
  const selection = useGraphSelector((s) => s.selection);
  const filters = useGraphSelector((s) => s.filters);
  const actions = useGraphActions();                   // exposed by force-graph

  return (
    <div className="grid h-screen grid-cols-[280px_1fr_360px]">
      <aside className="border-r border-border">
        <FilterStack
          items={visibleCandidates}
          categories={[...]}                           // group / node-type / edge-type / search
          values={filters}
          onChange={actions.setFilterValues}
        />
      </aside>

      <main className="relative">
        <ForceGraph
          ref={ref}
          data={kuzuSource}
          onChange={persistUserLayer}
          resolvePermission={hostResolver}
        />
      </main>

      <aside className="border-l border-border">
        <DetailPanel
          selection={selection}
          mode={mode}
          onModeChange={setMode}
        >
          {selection?.type === "node" && node && (
            <>
              <DetailPanel.Header><NodeHeader entity={node} /></DetailPanel.Header>
              <DetailPanel.Body>
                {node.kind === "doc" ? (
                  <MarkdownEditor
                    value={node.body ?? ""}
                    onChange={(v) => actions.updateNode(node.id, { body: v })}
                    readOnly={!canEdit(node)}
                    wikilinkCandidates={wikilinkCandidates}
                    onWikilinkClick={(target) => actions.select(resolveByLabel(target))}
                    onSave={(v) => {
                      actions.updateNode(node.id, { body: v });
                      // force-graph v0.5+ reconciliation runs automatically on save (decision #36)
                    }}
                  />
                ) : mode === "edit" ? (
                  <PropertiesForm
                    schema={schemaFor(node, hostResolver)}
                    values={flattenForForm(node)}
                    mode="edit"
                    onSubmit={async (values) => actions.updateNode(node.id, unflatten(values))}
                  />
                ) : (
                  <NodeReadView entity={node} />
                )}
              </DetailPanel.Body>
              <DetailPanel.Actions>{({ mode, setMode }) => /* Edit/Save/Cancel/Delete */}</DetailPanel.Actions>
            </>
          )}
        </DetailPanel>
      </aside>
    </div>
  );
}
```

This is the **integration test for the system contract**. All five Tier 1 components composed with `force-graph` at the host level (decision #35: no Tier 1 imports another; force-graph imports no Tier 1). Selection drives detail panel; mode drives form/preview switch; markdown-editor's save triggers force-graph's reconciliation pipeline (decision #36).

---

## 7. Success criteria

The component is "done" for v0.1–v0.6 when each phase passes its gate AND the cross-cutting criteria below hold.

### 7.1 Per-phase gates

1. **v0.1 ships**: snapshot import + validation + export round-trips a 10k-node graph; live source mode subscribes and applies deltas without UI flicker; layout runs at ≥30 fps on integrated GPU at 100k edges via stock Sigma `EdgeRectangleProgram` (per [decision #38](../../systems/graph-system/graph-system-description.md#8-locked-decisions-index); was: Phase 0 spike outcome via custom `DashedDirectedEdgeProgram`); origin field rejected when missing; soft/default edge differentiation via per-edge `color` + `size` attributes.
2. **v0.2 ships**: selection/hover/drag/undo work end-to-end; canvas-focus keyboard shortcuts fire correctly; UI-state cascade on delete prevents stale-reference crashes (verified by deleting a selected/hovered/multi-edge-expanded entity).
3. **v0.3 ships**: mixed-permission editing showcase (system node with read-only canonical + writable annotations) works end-to-end through host-slotted `<PropertiesForm>` per [§6.2 of properties-form](../properties-form-procomp/properties-form-procomp-description.md); permission tooltips render on disabled actions; stale-write banner surfaces on conflict.
4. **v0.4 ships**: 4-category filter panel via host-slotted `<FilterStack>` per [§6.1 of filter-stack](../filter-stack-procomp/filter-stack-procomp-description.md) drives `visibleNodeIds`/`visibleEdgeIds`/`visibleGroupIds`; group hulls render correctly for single-member, two-member, and N-member cases; group gravity composes with FA2 forces; group-involving edges anchor to hull boundary smoothly.
5. **v0.5 ships**: doc-node visual treatment (folded-page glyph, top-right) renders correctly; system-origin glyph (DB-source, bottom-right) coexists without collision per [decision #18](../../systems/graph-system/graph-system-description.md); markdown-editor save triggers reconciliation; wikilink matching follows [spec §3.10](../../../graph-visualizer-old.md) rules; tiebreaking warnings surface; image embeds render as literal text.
6. **v0.6 ships**: search overrides filters per [decision #12](../../systems/graph-system/graph-system-description.md); multi-edge expansion + collapse work; advanced settings panel (host-composed) edits all knobs; profiling at 100k nodes / 200k edges meets budget; hull SVG ceiling check verified.

### 7.2 Cross-cutting criteria

7. **Tier 1 panels compose without `force-graph` importing them** ([decision #35](../../systems/graph-system/graph-system-description.md)) — the Tier 3 page (§6.3) wires all five with no `force-graph` → Tier 1 imports.
8. **Source-adapter pattern works for all three usage modes** — DB visualizer (live source), personal KG (static snapshot), hybrid documenter (live source + user annotations + doc nodes). Same code path; different data distributions.
9. **Origin model is mandatory and validated** ([decision #17](../../systems/graph-system/graph-system-description.md)) — snapshots missing `origin` are rejected with structured errors; system entities missing `systemRef` are rejected.
10. **Bundle weight ≤ 300KB component-alone** (minified + gzipped). Per [decision #35](../../systems/graph-system/graph-system-description.md), Tier 1 deps composed at the host level are NOT part of `force-graph`'s bundle. Realistic breakdown: third-party ~138KB (sigma 80, graphology 25, FA2 15, d3-polygon 5, lucide-react tree-shaken 10, Zustand 3) + our code ~80KB (custom WebGL programs, store + slices, hull computation, source-adapter integration, permission resolver, misc) = **~218KB realistic**, with 300KB ceiling providing ~37% headroom for v0.6 hardening + dev-tooling overhead. The Tier 3 page total bundle (force-graph + 5 Tier 1) is a separate concern, not bounded by this description.
11. **A11y audit passes**: canvas has `role="application"` + `aria-label`; `tabIndex={0}` for keyboard focus per [spec §6.1](../../../graph-visualizer-old.md); keyboard shortcuts canvas-focus only; screen-reader announcements on selection change.
12. **Theming follows globals.css** ([decision #37](../../systems/graph-system/graph-system-description.md)) — OKLCH tokens; signal-lime accent on selection ring; Onest + JetBrains Mono fonts; switching dark/light flips canvas + overlays without remount.
13. **`tsc + lint + build` clean** with no React Compiler warnings — Sigma + graphology effects properly cleaned up.
14. **Demo at `/components/force-graph`** demonstrates: viewer mode (v0.1), interaction (v0.2), edit (v0.3), groups (v0.4), doc-node + wikilinks (v0.5), full-feature (v0.6). Plan stage decides whether the demo is a single page with phase tabs or six sub-demos.

---

## 8. Resolved questions (locked on sign-off 2026-04-28)

All 10 questions resolved at sign-off. The recommendations below are the locked decisions for v0.1–v0.6; per-phase Stage 2 plans build against these. Q5 + Q8 + Q10 refined on re-validation. New questions surfacing during plan authoring land in a fresh `## 8.6 New open questions` section as needed.

1. **Phasing structure — locked: keep 6 phases v0.1–v0.6** ([system §10.3](../../systems/graph-system/graph-system-description.md#103-tier-2-force-graph-phasing)). Each phase produces an independently shippable deliverable; Tier 1 plan-lock dependencies cleanly map to phase boundaries (v0.3 → properties-form + detail-panel; v0.4 → filter-stack; v0.5 → markdown-editor); the dedicated v0.6 perf phase produces measurable benchmarks rather than scattering perf work across all phases. Folding v0.6 into earlier phases would lose the SVG-ceiling gate ([spec §11.2](../../../graph-visualizer-old.md)) which needs the full system stood up.

2. **Renderer substrate — locked: Sigma + graphology MultiGraph + ForceAtlas2 in Web Worker** ([original spec §2](../../../graph-visualizer-old.md)). Already evaluated and locked in the v4 spec; this description re-confirms given the evolved system architecture (origin model, source-adapter pattern). Alternatives considered + rejected: react-force-graph (no native MultiGraph, no clean custom-program API, layout not in worker); Cytoscape.js (design philosophy mismatch — graph editor vs viz at scale; WebGL renderer is add-on); regl-graph / custom WebGL (massive build cost); ngraph family (no built-in canvas).

3. **Source-adapter timing — locked: full `GraphInput = GraphSnapshot | GraphSource` in v0.1.** `loadInitial` required; `subscribe` + `applyMutation` optional. v0.1 type-supports `applyMutation` but doesn't exercise it (component is read-only); v0.3 starts dispatching mutations when editing arrives. The architecture is core, not optional; live source mode is just snapshot + subscribe — small upfront cost vs a v0.1→v0.2 refactor of every action handler. Hosts in v0.1 can omit `applyMutation` entirely; hosts supplying it have it sit unused until v0.3.

4. **Phase 0 risk-spike timing — locked: 2 days BEFORE v0.1 implementation begins** ([system §10.1](../../systems/graph-system/graph-system-description.md)). Prototype `DashedDirectedEdgeProgram`; benchmark at 100k edges on integrated and discrete GPUs; gate ≥30 fps on integrated GPU. This description writes against "spike succeeds." If the spike fails, intermediate fallbacks exist (split edge programs — separate dashed-only and directed-only programs switching per edge — and custom shader optimizations) BEFORE going full SVG-overlay; the SVG-overlay path is the worst-case contingency, not the only fallback. Plan stage locks the contingency tree.

5. **State store architecture — locked: two-layer state per [spec §5.1](../../../graph-visualizer-old.md).** Refined on re-validation:
   - **Outside Zustand:** graphology MultiGraph (imperative; node↔node edges; Sigma reads directly from it)
   - **Zustand slices:** `groupEdges` (group-involving edges' parallel storage per [spec §3.4](../../../graph-visualizer-old.md)), `ui` (selection / hover / filters / linking mode / multiEdgeExpanded), `history` (undo ring buffer per [spec §5.5](../../../graph-visualizer-old.md)), `settings` (theme + force config), `derived` (memoized selectors observing `graphVersion`)

   `graphologyAdapter` wraps node↔node mutations and bumps `graphVersion` in Zustand on every graphology mutation, so selectors observing `graphVersion` (via [`useGraphSelector`](#52-graph-data-shapes), decision #4) re-fire. Alternatives considered (Jotai, Valtio, Redux Toolkit) rejected per [spec §5.4](../../../graph-visualizer-old.md): Zustand's selector-based subscriptions fit the panel-density use case; whole-tree re-renders would dominate at this panel count.

6. **Permission resolver location — locked: own resolver inside `force-graph`; lands in v0.3.** Per [decision #25](../../systems/graph-system/graph-system-description.md): per-component in v1; shared `src/lib/permissions/` extracted only after `rich-card` and `force-graph` both ship resolvers. Premature abstraction is the bigger risk.

7. **Mixed-permission editing — locked: host computes per-field permissions; `force-graph` exposes only `origin` + `systemRef` on entities.** The host's permission resolver decides which fields are canonical-read-only vs annotation-writable and feeds them to `<PropertiesForm>`'s `resolvePermission` per the [properties-form §6.2 showcase](../properties-form-procomp/properties-form-procomp-description.md). `force-graph` stays out of the schema-building business; the host owns it. Alternative ("force-graph derives schema-with-permissions automatically from origin") rejected on coupling grounds — would couple `force-graph` to a specific schema convention and break generic-schema use cases. Plan-stage tightening: `NodeType.schema?: PropertiesFormField[]` could give hosts a natural carrier (force-graph never inspects the field; it just flows through).

8. **Hull overlay rendering — locked: SVG hull overlay in v0.4; v0.6 perf gate for migration of group-involving edge layer.** Refined on re-validation:
   - **Hulls** (group hulls + labels) — SVG, ~200 DOM nodes expected, no ceiling concern. Group count is bounded; hull DOM scales with group count (~200 expected).
   - **Group-involving edges** (node↔group, group↔group) — SVG `<line>` per edge, ceiling at ~3k visible per [spec §11.2](../../../graph-visualizer-old.md). v0.6 migration to canvas (or a second Sigma instance) IF profiling shows ceiling hit.

   The hull layer itself does NOT migrate (it's not the bottleneck). Only the group-involving edge SVG layer migrates if the ceiling check fails. Plan stage locks the migration path conditionally.

9. **Public action/selector surface — locked: ~30 actions + ~10 selectors.** Categorized in §5.3 / §5.4. Plan stage locks the exact list per phase, validated against [spec §5.3](../../../graph-visualizer-old.md). Selectors gate through `useGraphSelector(fn)` per [decision #4](../../systems/graph-system/graph-system-description.md), which observes `graphVersion` so consumers can't forget the dependency. Hosts wire Tier 1 panels through this surface; the surface is the contract for Tier 3 composition.

10. **Bundle weight ceiling — locked: ≤300KB component-alone** (minified + gzipped). Refined on re-validation. Per [decision #35](../../systems/graph-system/graph-system-description.md), Tier 1 deps composed at the host level are NOT part of `force-graph`'s bundle. Realistic breakdown:

    | Item | Size |
    |---|---|
    | Third-party deps (sigma 80, graphology 25, FA2 15, d3-polygon 5, lucide-react tree-shaken 10, Zustand 3) | **~138KB** |
    | Our code (custom WebGL programs, store + slices, hull computation, source-adapter integration, permission resolver, misc) | **~80KB** |
    | **Component-alone realistic total** | **~218KB** |
    | Ceiling | **300KB** (~37% headroom) |

    The Tier 3 page total bundle (force-graph + 5 Tier 1 components) is a separate concern, not bounded by this description. Risk-mitigation options if ceiling threatens: (a) lazy-load the FA2 worker (only when layout is enabled), (b) split `force-graph` itself into smaller chunks at module boundaries (e.g., editing layer in v0.3 lazy-loads on first edit). Plan stage decides if any of these are needed.

## 8.5 Plan-stage tightenings (surfaced during description review + re-validation)

These are NOT description-blocking, but per-phase plan authoring must address them:

1. **UI-state cascade plumbing in v0.1 is foundational scaffolding.** Per [spec Phase 1](../../../graph-visualizer-old.md): cascade rules wired into the store BEFORE selection/hover/etc. exist; activated in v0.2+ when those land. v0.1 itself doesn't exercise the cascade. v0.1 plan documents this as foundational-now-active-later wiring.
2. ~~**Phase 0 risk-spike intermediate fallbacks.** "Spike fails → SVG-overlay rendering" is the worst case, not the only path. Intermediate options: split edge programs (separate dashed-only and directed-only WebGL programs, switching per edge); custom shader optimizations; reduced quality at scale. Plan stage locks the contingency tree as a decision tree, not a binary.~~ **SUPERSEDED by [decision #38](../../systems/graph-system/graph-system-description.md#8-locked-decisions-index)** — Phase 0 spike cancelled; stock-Sigma rendering replaces the custom WebGL pipeline. No contingency tree needed.
3. **`NodeType.schema?: PropertiesFormField[]` as optional carrier.** Gives hosts a natural place to attach per-NodeType schemas without `force-graph` knowing about it (force-graph never inspects the field; it just flows through). Additive, non-breaking. Plan stage decides v0.1 type extension vs v0.3 introduction (when editing arrives).
4. **Typed escape hatches on the imperative handle.** `getSigmaInstance(): Sigma` (NOT `unknown`) and `getGraphologyInstance(): MultiGraph` (NOT `unknown`). Substrate-leak documented as major-version-bump risk if either substrate ever swaps. Two substrates leak (vs markdown-editor's one with `getView()`); the doubled risk is acknowledged.
5. **Demo structure for `/components/force-graph`.** Plan stage decides: single page with phase tabs (one demo route, internal switching) vs six sub-demos (separate routes per phase). Recommendation lean: single page with phase tabs (cohesive overview) + a "full feature" demo as the v0.6 showcase.
6. **Action list per phase audit.** §5.3 is illustrative (~30 actions). Plan stage produces the exact list per phase, validating against [spec §5.3](../../../graph-visualizer-old.md). Several exact assignments need confirming: `setNodePositions(silent: true)` is foundational for layout-load and could land in v0.1 even though §2.2 lists it under v0.2; `pinAllPositions` is in v0.1 layout but spec Phase 2; etc.
7. **v0.1 `applyMutation` type-supported but not exercised.** v0.1 ships the `GraphSource` type with `applyMutation` optional but doesn't dispatch any mutations (read-only). v0.3 starts exercising it when editing lands. v0.1 plan documents this lifecycle so adapter authors know `applyMutation` is reserved-but-unused in v0.1.
8. **Direction visuals (undirected/directed/reverse/bidirectional) — v0.1 plan locks the rendering rules.** Per [spec §9.1](../../../graph-visualizer-old.md): `undirected` (no arrowheads), `directed` (arrowhead at target), `reverse` (arrowhead at source — rare), `bidirectional` (arrowheads at both ends). Per [decision #38](../../systems/graph-system/graph-system-description.md#8-locked-decisions-index): v0.1 ships all four via stock Sigma — undirected uses `EdgeRectangleProgram` directly; directed/reverse/bidirectional layer `@sigma/edge-arrow` (with reverse achieved by source/target swap or arrow-at-source variant; bidirectional via dual-arrow program). Was: ~~all four through `DashedDirectedEdgeProgram`'s arrow uniform~~.
9. **Wikilink reconciliation algorithm locked in v0.5 plan.** Per [decision #36](../../systems/graph-system/graph-system-description.md) and [spec §3.10 + §8.1](../../../graph-visualizer-old.md): runs on `importSnapshot` (all phases) AND on doc-node save (v0.5+). v0.5 plan locks the algorithm: build label index → parse content → resolve per matching rules → reconcile edges (idempotent sweep). Markdown-editor's contract is just "call `onSave` on Cmd+S"; reconciliation lives in force-graph.
10. **Origin glyph fragment-shader rules locked in v0.5 plan.** Per [decision #18](../../systems/graph-system/graph-system-description.md) (system glyph bottom-right) + [spec §8.2](../../../graph-visualizer-old.md) (doc glyph top-right): `IconNodeProgram` fragment shader masks two corner regions independently. System nodes never have `kind === "doc"` per [§4.3 of system description](../../systems/graph-system/graph-system-description.md), so a node has at most one origin/kind glyph — the shader handles both corners but only one fires per node.

---

## 9. Sign-off checklist

- [x] Problem framing correct (§1) — the gap force-graph closes
- [x] Phased delivery (§2) consistent with [system §10.3](../../systems/graph-system/graph-system-description.md#103-tier-2-force-graph-phasing): six phases, ~13.5 weeks focused, Tier 1 plan-lock dependencies aligned
- [x] Per-phase scope (§2.1–§2.6) defensible — each phase independently shippable
- [x] Out-of-scope (§3) consistent with [system §11](../../systems/graph-system/graph-system-description.md#11-out-of-scope--deferred); ~~SVG fallback path documented~~ SVG fallback superseded by [decision #38](../../systems/graph-system/graph-system-description.md#8-locked-decisions-index) (2026-04-29)
- [x] Target consumers (§4) complete — Tier 3 page + 3 usage modes + speculative
- [x] API sketch (§5) covers GraphInput, props, actions, selectors, ref handle
- [x] Example usages (§6) cover all 3 system usage modes including the full Tier 3 wiring (§6.3)
- [x] Per-phase gates + cross-cutting criteria (§7) measurable
- [x] Renderer substrate (Q2) confirmed — Sigma + graphology + FA2
- [x] Source-adapter timing (Q3) confirmed — full `GraphInput` in v0.1
- [x] State store architecture (Q5) confirmed — two-layer model per spec §5.1 (graphology imperative + Zustand reactive)
- [x] Mixed-permission editing (Q7) confirmed — host computes per-field permissions
- [x] Hull overlay (Q8) confirmed — SVG hulls (no ceiling); group-involving edge SVG migrates conditionally in v0.6
- [x] Bundle weight ceiling (Q10) confirmed — 300KB component-alone (Tier 1 deps NOT included per decision #35)
- [x] ~~Phase 0 risk-spike (Q4) timing confirmed — 2 days BEFORE v0.1; intermediate fallbacks before SVG-overlay~~ Phase 0 risk spike CANCELLED per [decision #38](../../systems/graph-system/graph-system-description.md#8-locked-decisions-index) (2026-04-29) — replaced with stock-Sigma rendering; no prerequisite
- [x] Open questions §8 — all 10 resolved on sign-off (Q5 + Q8 + Q10 refined on re-validation)

**Signed off 2026-04-28.** Per-phase Stage 2 plan authoring may begin per the cascade below. Each plan must build against the §8 locked decisions and address the §8.5 plan-stage tightenings, defining the file-by-file structure per the [component-guide.md anatomy](../../component-guide.md#5-anatomy-of-a-component-folder).

**The per-phase plan-lock cascade unlocks**:

- `force-graph-v0.1-plan.md` (and v0.2, v0.6) can author independently — they compose zero Tier 1 components
- `force-graph-v0.3-plan.md` is gated on `properties-form-procomp-plan.md` + `detail-panel-procomp-plan.md` (both Tier 1 plans signed off)
- `force-graph-v0.4-plan.md` is gated on `filter-stack-procomp-plan.md`
- `force-graph-v0.5-plan.md` is gated on `markdown-editor-procomp-plan.md`

The system-level Stage 2 (`graph-system-plan.md`) is authored after all per-procomp Stage 2 docs are locked.
