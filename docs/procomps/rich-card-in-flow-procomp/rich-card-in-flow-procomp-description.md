# `rich-card-in-flow` — Pro-component Description (Stage 1)

> **Stage:** 1 of 3 · **Status:** **Signed off 2026-05-16 (GATE 1 closed; Stage 2 plan doc unlocked)** — all 10 questions locked (Q1, Q3, Q4, Q5, Q6, Q9 explicitly resolved 2026-05-16; Q2, Q7, Q8, Q10 wholesale-accepted with proposed answers 2026-05-16)
> **Slug:** `rich-card-in-flow` · **Category:** `data`
> **Conceptual lineage:** *viewer-renderer + dialog-edit* architecture for putting heavy editor content into a `flow-canvas-01` node without mounting the full editor per node.
> **Parallel track to:** [`flow-canvas-01-v0.2.0-perf-description.md`](../flow-canvas-01-procomp/flow-canvas-01-v0.2.0-perf-description.md) — that doc's Q33 locks the "popup-edit renderer convention" as the prescribed pattern for heavy node content; this doc is the canonical first consumer of that convention. The two tracks are independent (per Q35 of that doc) and ship on their own cadences. **Note:** flow-canvas-01@v0.2.0 SHIPPED 2026-05-16 (commits `a6b3295`..`6587ef6`) WITHOUT the `onEditRequest` API addition that this doc's Q5 originally proposed bundling — that API now lands as an additive `v0.2.1` patch (see updated Q5 lock).
> **Composes:** `flow-canvas-01` (host, v0.2.0 shipped + v0.2.1 additive patch pending) · `rich-card` (editor, currently at **v0.4.1 beta** per STATUS.md — well past the originally-anticipated v0.1 viewer + v0.2 editor milestones; see updated Q9 lock) · a new read-only `RichCardViewer` renderer · a consumer-owned dialog.

This is the description doc. Job: pin down the architecture, surface decisions, earn sign-off before any planning or code.

---

## 1. Problem

`flow-canvas-01@v0.1.x` supports custom renderers per node via the `NodeRenderer` registry. A natural consumer use case is putting rich-card content into nodes — agent transcripts, decision records, config trees, schema fragments — and letting the user edit that content directly inside the canvas.

The naive approach is to mount the full `<RichCard>` editor inline in each node renderer. This breaks at any meaningful scale:

1. **Per-node mount cost is huge.** `rich-card` is currently the largest shipped component (v0.4.1 beta — full editor, reducer-driven, internal DnD + keyboard nav). At N=20 nodes the canvas would mount 20 full editors — including 20 DnD providers, 20 reducer trees, 20 keyboard handlers.
2. **Per-frame paint cost compounds.** Every pan / zoom / drag re-renders every visible node renderer. A rich-card editor inside a flow node would re-paint its entire subtree each frame.
3. **Pointer-interaction conflicts.** `rich-card` will have internal click-to-edit, drag-drop, keyboard navigation. `flow-canvas-01` has node-drag, pan, marquee selection. Two competing pointer systems in the same DOM subtree corrupt both — the same class of bug `kanban-board-01@v0.2` solved with its `dragHandle: "header"` opt-in.
4. **A11y is incompatible.** `rich-card`'s `role="tree"` contract assumes it owns a screen-reader region. Inside a node renderer it competes with xyflow's own a11y tree for the canvas.

The `flow-canvas-01@v0.2` perf description locks the **popup-edit renderer convention** (Q33) as the prescribed pattern for heavy node content:

> "renderer must be read-only display + `onClick` → `ctx.onEditRequest?.(nodeId)` + the consumer-side dialog pattern mounts the full editor."

This procomp **is the canonical first implementation of that convention** — the bridge that lets rich-card content live inside flow-canvas-01 nodes without paying the per-node editor cost, while keeping a single source of truth for the node's JSON.

---

## 2. Architecture (the system, one glance)

Three roles, **at most one** rich-card editor instance mounted at a time, regardless of node count:

```
┌─────────────────────────────────────────────────────────────────────┐
│ flow-canvas-01 (host)                                               │
│                                                                     │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐                 │
│  │RichCardViewer│ │RichCardViewer│ │RichCardViewer│  ... × N        │
│  │  ~120 LoC    │ │  ~120 LoC    │ │  ~120 LoC    │  read-only      │
│  │  title + few │ │              │ │              │  paint only     │
│  │  fields +    │ │              │ │              │                 │
│  │  nested      │ │              │ │              │                 │
│  │  outlines +  │ │              │ │              │                 │
│  │  port handles│ │              │ │              │                 │
│  └──────┬───────┘ └──────────────┘ └──────────────┘                 │
│         │ onClick                                                   │
│         ▼ ctx.onEditRequest()                                       │
└─────────┼───────────────────────────────────────────────────────────┘
          │ onEditRequest(nodeId) — bubbles to FlowCanvasProps
          ▼
  ┌──────────────────────────────────────────────────────────────┐
  │ Consumer-owned <Dialog> / <Drawer> (NOT shipped by procomp)  │
  │                                                              │
  │   <RichCard                                                  │
  │      defaultValue={nodeData}            ← same JSON node     │
  │      onChange={(next) => updateNode(    ← consumer wires     │
  │        editingNodeId, next              ←   write-back into  │
  │      )}                                 ←   CanvasData       │
  │   />                                                         │
  └──────────────────────────────────────────────────────────────┘

  Data contract: shared RichCardJsonNode shape.
  NO transformation between canvas storage and editor storage —
  the same object is what the renderer paints AND what the editor edits.
```

**Three properties that fall out of this shape:**

1. **At most one rich-card instance is mounted** at any moment (the one in the open dialog). Closed dialog → zero instances. Canvas at N=1000 nodes → still zero rich-card editor instances unless someone clicks one.
2. **The renderer is content-agnostic about editability.** Whether the consumer wires a real editor dialog or no dialog at all (read-only canvas) is the consumer's decision. The viewer always paints the same read-only summary.
3. **flow-canvas-01 stays rich-card-unaware.** The host knows `onEditRequest(nodeId)` exists; it does NOT know anything about `RichCardJsonNode` or how the consumer's dialog handles it. The viewer renderer is registered like any other `NodeRenderer<TData>`.

---

## 3. In scope / Out of scope (v0.1)

### v0.1 — in scope

- **`RichCardViewer` renderer** (`~150–180 LoC` revised — subcard-level ports + selectability adds modest complexity over the original ~120 LoC estimate). A `NodeRenderer<RichCardJsonNode>` that paints a read-only summary of a rich-card JSON tree:
  - **Title strip** — the card's `title` flat field (or first string flat field as a fallback).
  - **First 2–4 flat fields** rendered as `key: value` pairs, type-aware (numbers right-aligned, booleans as checkmarks, ISO-8601 dates formatted) — same surface contract as `rich-card`'s read-only viewer mode, just clipped to top-of-card.
  - **Nested-card outlines with their OWN ports + selectability** (Q1 lock, 2026-05-16) — child cards rendered as named visual blocks (the child's title + a faint border), NOT recursively descended (one level deep). Each subcard:
    - Renders its OWN `<PortsAt>` calls bound to the subcard's `ports?: Port[]` at the subcard's screen-anchor position (uses the existing recursive `NodeData.ports` shape — port-walker already supports this; subcards' ports are flat-addressable as `nodeId:subPortId` from the canvas's perspective). Connections can target a subcard's port directly, not just the root's ports.
    - Is individually selectable — clicking a subcard region highlights it as the editing target (visual cue: subcard outline emphasis + `data-selected-subcard={subPath}` for consumer-side styling) and fires `ctx.onEditRequest?.(subPath)` so the dialog opens with rich-card pre-focused on that subcard's tree path. Clicking outside any subcard (but on the renderer body) fires `ctx.onEditRequest?.()` with no subPath → dialog opens at the root.
    - **Content-edit always routes through the popup** — subcards are NOT independent flow-canvas nodes; their content lives inside the root rich-card tree and is edited via the dialog's rich-card editor (which has its own tree navigation to drill into any subcard). The flow-canvas node hosts ONE root rich-card tree per node.
  - **Root port handles** — 2–4 `<PortsAt>` calls bound to the root's `data.ports` (same hookup as the existing `customJsonRenderer` after the `v0.1.4` fix; see [the v0.1.4 decision file](../../../.claude/decisions/2026-05-14-flow-canvas-v0.1.4-custom-json-handles.md)). Combined with subcard ports above, the viewer respects the existing recursive port model.
  - **Click-to-edit affordance** — renderer body is keyboard-activatable (Enter / Space on the focused root or subcard → fires `onEditRequest` with the appropriate subPath). Visible focus ring at both root and subcard levels.
- **Additive API on `flow-canvas-01@v0.2.1`** (Q5 lock — additive patch post-v0.2.0 ship, non-breaking, opt-in):
  - `FlowCanvasProps.onEditRequest?: (nodeId: string, subPath?: string) => void` — the `subPath` second argument is optional (per Q1 lock); renderers fire it with `undefined` for root-level edits and with a string path for subcard-targeted edits (e.g. `"children[0]"` or rich-card-internal path syntax).
  - `RenderContext.onEditRequest?: (subPath?: string) => void` (bound to the current `nodeId`; renderers call it with an optional `subPath` argument).
  - Both default to `undefined`. Renderers that ignore them lose nothing. Existing v0.2.0 consumers are untouched.
- **Shared data contract — `RichCardJsonNode` is the canvas node's `data`.** The renderer reads it; the editor mutates it; the consumer's `onEditRequest` handler stores the editing target's `nodeId` + opens the dialog; the dialog's `<RichCard>` reads the same JSON via `getNodeById(canvasData, nodeId).data`; `onChange` on the editor calls `updateNodeData(nodeId, next)` on the canvas. **No translation layer.**
- **Documented dialog pattern** — a one-page section in the procomp guide showing the consumer-owned dialog wiring (illustrative code), including the recommended close-on-save vs explicit-save UX. Pattern only — no shipped dialog component.
- **Demo + usage** — a working flow-canvas demo with 3–5 nodes that each hold a non-trivial rich-card tree, click any node → opens dialog → edits in `<RichCard>` (v0.4.1 beta editor — full feature surface) → close → node renderer re-paints with the new summary. Demo also exercises subcard-level click (selects subcard + opens dialog focused on that subcard's tree path).
- **Type re-exports** — `rich-card-in-flow` re-exports `RichCardJsonNode` from the rich-card package so consumers writing typed canvas data don't need a second import.
- **n8n-style multi-select support** (Q3 lock, 2026-05-16) — marquee select + shift-click multi-select work out-of-the-box (these are flow-canvas-01 host features, already shipped at v0.1.x). For EDIT specifically: clicking-to-edit when N>1 nodes are selected opens the dialog on the **clicked node only** (single-node-edit gesture); other selected nodes remain selected for non-edit operations (move, delete, duplicate, copy-paste — all flow-canvas-01-level features). Bulk-EDIT-via-multi-select (one editor op applied across the selection) is the v0.2 deferral above; v0.1 ships only the multi-select-for-canvas-ops side of the n8n model.

### Out of scope (v0.1 — deliberate non-goals)

- **Inline editing of any rich-card content inside the canvas.** All editing goes through the consumer's dialog. No "edit one flat field without opening the dialog."
- **Bulk-EDIT across a multi-select** — applying a single edit operation across all selected rich-card nodes via the dialog. Deferred to v0.2 per Q3 lock — needs a real consumer signal on which fields are bulk-editable + a UX shape that doesn't conflict with rich-card's single-tree contract. (Multi-select itself IS supported in v0.1 — see new in-scope bullet below.)
- **Shipped dialog component.** Consumer owns the dialog because dialog choice (`<Dialog>` vs `<Drawer>` vs `<Sheet>` vs custom) is product-specific. We ship the *pattern*, not the chrome.
- **Recursive viewer descent.** `RichCardViewer` paints one level + nested-card *outlines*. It does NOT render rich-card's full styled output (per-level styles, predefined-key components, collapsible subtrees). That's what the editor dialog is for.
- **Per-tree styling props** — `levelStyles`, `predefinedKeyStyles`, etc. on the viewer renderer. The viewer paints a fixed summary shape; consumers wanting custom in-canvas presentation register their own `NodeRenderer<RichCardJsonNode>`.
- **Backward auto-coupling.** `flow-canvas-01` doesn't bundle this; consumers opt in by registering the viewer renderer + wiring `onEditRequest`. The host stays rich-card-unaware (per §2 property 3).
- **Async / streaming rich-card data.** The viewer assumes the JSON is present at render time. Streaming nodes load into the canvas as completed JSON.
- **Cross-node references.** If a rich-card tree somehow referenced another node's content, that's out of scope — rich-card itself forbids cross-document references per its description §2.
- **Markdown ingestion.** Same as rich-card — markdown adapter is rich-card's v0.5+ deferred companion; not relevant here.

### Out of scope (deferred to later versions, not deferred indefinitely)

| Feature | Earliest version | Trigger |
|---|---|---|
| Bulk-EDIT across multi-select (single edit op applied to all selected nodes via dialog) | v0.2 | Real consumer asks + UX shape locked (multi-select for canvas ops ships in v0.1 per Q3 lock — see in-scope above) |
| `RichCardViewer` styling props (configurable field-count, port-layout overrides) | v0.2 | Two consumers diverge from default |
| "Quick edit" inline gesture (edit title without opening dialog) | v0.3 | Consumer signal + a clean a11y story |
| Server-driven streaming canvas → progressively rendered viewer | v0.3+ | Consumer signal |

---

## 4. Target consumers

| Archetype | Example | What they need |
|---|---|---|
| **Agent workflow editor** *(primary)* | LLM tool-call graph, multi-step agent designer | Each node = one tool/step with structured config; clicking opens a rich-card editor for that step's parameters |
| **Schema / config canvas** *(primary)* | API resource map, config-flag dependency tree | Each node = one schema fragment or feature gate; rich-card edits its fields, predefined `codearea` for code samples |
| **Decision / runbook map** *(primary)* | Architecture decision graph, on-call runbook tree | Each node = one decision or step; rich-card holds the body content with code blocks, tables, quotes |
| Trace explorer *(secondary)* | LLM trace replay UI | Read-only view (no edit; `onEditRequest` left `undefined`); the viewer alone is useful |

Non-targets: pure read-only graphs that don't carry rich content (use `flow-canvas-01` with `customJsonRenderer`); single-document outline editors (use `<RichCard>` directly); whiteboards (use a canvas component, not this).

---

## 5. Rough API sketch (NOT final — that's the plan stage)

This is illustrative. The plan doc will lock the final shape.

### 5.1 — Additions to `flow-canvas-01@v0.2.1` (additive patch post-v0.2.0 ship; Q5 lock)

```ts
// types.ts — additive only

export type RenderContext = {
  nodeId: string;
  isSelected: boolean;
  isDragging: boolean;
  isReadOnly: boolean;
  renderChild: (data: NodeData, opts?: { path?: string }) => ReactNode;

  // NEW v0.2.1 (additive; undefined when consumer doesn't wire it).
  // Optional subPath argument lets renderers signal subcard-level edit
  // targets per Q1 lock — e.g. RichCardViewer fires `ctx.onEditRequest("children[0]")`
  // when a subcard is clicked, vs `ctx.onEditRequest()` for root.
  onEditRequest?: (subPath?: string) => void;
};

export type FlowCanvasProps = {
  // ... existing v0.2.0 props ...

  // NEW v0.2.1 (additive; undefined when consumer doesn't wire it)
  onEditRequest?: (nodeId: string, subPath?: string) => void;
};
```

The bound `ctx.onEditRequest?: (subPath?: string) => void` is the ergonomic surface for renderer authors (the renderer already knows its `nodeId`; passes `subPath` if applicable). The unbound `FlowCanvasProps.onEditRequest?: (nodeId, subPath?) => void` is what flow-canvas calls into when any renderer triggers an edit. **Why a patch and not a minor:** the change is purely additive — no default flip, no behavior change for consumers who don't register the viewer or wire the prop. Patch is the right semver call.

### 5.2 — The new viewer renderer

```ts
// rich-card-in-flow/parts/rich-card-viewer.tsx (~120 LoC)

import type { NodeRenderer, RenderContext } from "@/registry/components/data/flow-canvas-01";
import type { RichCardJsonNode } from "@/registry/components/data/rich-card";

export const richCardViewerRenderer: NodeRenderer<RichCardJsonNode> = {
  type: "rich-card",
  label: "Rich card",
  render: (data, ctx) => <RichCardViewer data={data} ctx={ctx} />,
};

function RichCardViewer({
  data,
  ctx,
}: {
  data: RichCardJsonNode;
  ctx: RenderContext;
}) {
  // 1. Title strip from data.title (or first string flat field).
  // 2. First 2-4 flat fields, type-aware.
  // 3. Nested-card outlines (one level, named blocks). Each subcard:
  //    - paints its own `<PortsAt>` for `subcard.ports` (recursive port model).
  //    - is keyboard-focusable + click-selectable; clicking fires
  //      `ctx.onEditRequest?.(subPath)` where `subPath` addresses this subcard.
  //    - shows a `data-selected-subcard` attribute when locally selected.
  // 4. Root PortsAt × 4 sides (left/right/top/bottom — bound to `data.ports`).
  // 5. Outer button-role surface: clicking outside any subcard but inside the
  //    renderer body fires `ctx.onEditRequest?.()` with no subPath (root edit).
}
```

### 5.3 — Consumer wiring (illustrative; ships as a guide example, NOT shipped code)

```tsx
const [editingNodeId, setEditingNodeId] = useState<string | null>(null);
const [canvasData, setCanvasData] = useState<CanvasData>(initialData);

const editingNode = editingNodeId
  ? canvasData.nodes.find((n) => n.id === editingNodeId)
  : null;

return (
  <>
    <FlowCanvas
      data={canvasData}
      onChange={setCanvasData}
      renderers={[richCardViewerRenderer, /* other renderers */]}
      onEditRequest={(nodeId, subPath) => {
        setEditingNodeId(nodeId);
        setEditingSubPath(subPath);                   // optional — pre-focus subcard
      }}
    />

    <Dialog open={editingNodeId !== null} onOpenChange={(open) => {
      if (!open) { setEditingNodeId(null); setEditingSubPath(undefined); }
    }}>
      <DialogContent className="max-w-3xl">
        {editingNode && (
          <RichCard
            key={editingNodeId}                       // remount per node
            defaultValue={editingNode.data as RichCardJsonNode}
            initialFocusPath={editingSubPath}         // pre-focus subcard if set
            onChange={(next) => {
              setCanvasData((prev) => updateNodeData(prev, editingNodeId!, next));
            }}
          />
        )}
      </DialogContent>
    </Dialog>
  </>
);
```

`updateNodeData(canvas, nodeId, nextData)` is a small consumer-side helper (4 lines) — could become a re-exported utility from `flow-canvas-01` if multiple consumers want it; locked at GATE 2.

Two public surfaces added (one prop on `FlowCanvasProps`, one field on `RenderContext`) + one new renderer export. v0.1 is intentionally small.

---

## 6. Success criteria

The system ships v0.1.0 (alpha) when:

1. **`flow-canvas-01@v0.2.1`** ships the additive `onEditRequest` patch (Q5 lock — `FlowCanvasProps.onEditRequest?: (nodeId, subPath?) => void` + `RenderContext.onEditRequest?: (subPath?) => void`); existing v0.2.0 consumers are untouched (no default change, no behavior change for non-consumers); ships before rich-card-in-flow@v0.1.0.
2. **The `RichCardViewer` renderer is published** as a `NodeRenderer<RichCardJsonNode>` from `rich-card-in-flow` (slug TBD per Q4) — registry distribution per locked convention, no `demo.tsx` / `usage.tsx` / `meta.ts` shipped.
3. **The shared data contract holds.** Clicking a node opens the dialog; the dialog reads the same JSON the viewer painted; `onChange` updates the canvas; closing + reopening shows the latest edits. No transformation step anywhere.
4. **At most one editor instance mounts at a time.** Verified by mounting a 50-node demo (each node carrying a non-trivial rich-card tree), clicking through 10 nodes sequentially, and verifying via React DevTools that exactly one `<RichCard>` exists in the tree at any time (or zero when no dialog is open).
5. **Canvas perf does not regress at scale.** With 200 nodes (the v0.1.x flow-canvas success criterion) where every node uses `RichCardViewer`, drag / pan / zoom holds the same FPS bar set by `flow-canvas-01@v0.1.4` for the heavy stress fixture (per the [v0.2.0 perf description §3 measurement protocol](../flow-canvas-01-procomp/flow-canvas-01-v0.2.0-perf-description.md#3-pre-work-measurement-instrumentation)). The viewer is allowed to be slightly heavier than `customJsonRenderer` per node — but the curve shape stays the same.
6. **Port handles render correctly at root AND subcard levels** (Q1 lock) — all four sides on root; subcard ports painted at subcard anchor positions; edges connect to both root ports and subcard ports; clicking + drag-to-connect from a subcard's port works exactly like from a root port. The v0.1.4 "no rendered handles → console flood → FPS cliff" regression class is structurally avoided (the viewer always calls `<PortsAt>` for any declared `ports?: Port[]` at every level).
6a. **Subcard selectability + edit targeting** (Q1 lock) — clicking a subcard region selects it (visual highlight + `data-selected-subcard` attribute), keyboard-tab navigates between subcards, Enter / Space on a focused subcard fires `ctx.onEditRequest?.(subPath)` and the dialog opens with rich-card pre-focused on that subcard's tree path. Clicking the renderer body outside any subcard fires `ctx.onEditRequest?.()` (root edit).
7. **Click-to-edit a11y.** Keyboard activation (Enter / Space) opens the dialog. Focus moves into the dialog content on open and returns to the source node on close. `aria-haspopup="dialog"` on the renderer body.
8. **The consumer dialog pattern is documented** in the procomp guide as a one-page section with the illustrative example above, plus the recommended close-on-save vs explicit-save UX note (per Q2's resolution).
9. **Demo + usage docs complete.** Demo exercises 3 node renderers (`customJsonRenderer`, `richCardViewerRenderer`, one synthetic) on the same canvas to demonstrate the registry-mixed pattern. Demo also exercises (a) n8n-style multi-select on rich-card nodes (Q3 lock — marquee + shift-click; bulk move / delete / duplicate work; bulk-edit does NOT) and (b) subcard-level click → dialog pre-focuses subcard (Q1 lock).
10. **No silent flow-canvas-01 default change.** Adding `onEditRequest` props (v0.2.1 additive patch) does NOT alter any existing default. A consumer who upgrades flow-canvas without registering the viewer or wiring `onEditRequest` sees zero behavior change.
11. **`pnpm tsc --noEmit` clean · `pnpm lint` clean · `pnpm validate:meta-deps` clean** (43/43 once this ships).
12. **GATE 3 review file authored** at `docs/procomps/rich-card-in-flow-procomp/reviews/<YYYY-MM-DD>-v0.1.0-spotcheck.md` with verdict ≥ `Pass with follow-ups`. Public-API-touching, so the review may escalate to checklist if Q4 chooses "sibling procomp" + the API surface is judged broad — locked at review time per the readiness-review rule.

---

## 7. Open questions

| # | Question | Proposed answer | Notes |
|---|---|---|---|
| **Q1** ✅ **LOCKED 2026-05-16** | **Inner cards: visual blocks or independent entities?** When `RichCardViewer` paints a nested child card, is the child a flat visual block painted by the same renderer (single hit-target, all clicks go to the parent's `onEditRequest`) — or an independent entity with its own hit-test and its own edit gesture? | **Visual blocks WITH their own port features AND individual selectability; content edits route through the popup rich-card editor.** Each subcard renders as a named bordered outline inside the parent's renderer AND: (a) carries its own `ports?: Port[]` (using the existing recursive `NodeData.ports` shape — subcards' ports are flat-addressable as `nodeId:subPortId` via the existing port-walker); (b) is individually selectable (click highlights the subcard via `data-selected-subcard`, keyboard-tab navigates between subcards); (c) firing `ctx.onEditRequest?.(subPath)` opens the dialog with rich-card pre-focused on that subcard's tree path. Clicking the renderer body outside any subcard fires `ctx.onEditRequest?.()` → root edit. **All content editing still routes through the popup rich-card editor** — subcards are NOT independent flow-canvas nodes; the entire `RichCardJsonNode` tree IS the node's `data`. The dialog's `<RichCard>` is where the user actually mutates content; the canvas-side viewer is read-only paint + click-to-focus signaling. | Decides: (a) data model — the entire RichCardJsonNode tree IS the node's `data` (not split across multiple flow-canvas nodes); (b) port model — ports live recursively (root + subcards), matching the existing flow-canvas-01 NodeData.ports recursive shape (no new port plumbing needed; the port-walker already supports this); (c) hit-test depth = N (root + each subcard); (d) the `onEditRequest` API needs an optional `subPath` second arg so renderers can tell the host where the edit gesture targets (this is the trigger for the v0.2.1 patch's signature widening — see Q5). The alternative (each rich-card sub-card = a separate flow-canvas node) would explode node count, scatter the tree across the canvas, lose rich-card's per-tree styling + a11y contract, AND require explicit edges between nominally-parent-child cards. This lock keeps the rich-card tree contiguous AND lets it integrate with the wider canvas via subcard-level ports. |
| **Q2** ✅ **LOCKED 2026-05-16** | **Save semantics: live or explicit?** When the user edits in the dialog, does `<RichCard>`'s `onChange` write to canvas state on every keystroke (live; rich-card owns undo) — or does the dialog need an explicit "Save" button that batches changes? | **Live (every keystroke flows to canvas state).** `<RichCard>` owns its undo/redo (already shipped at v0.4.1 beta); the canvas is the source of truth and reflects current state continuously. Dialog close is a UI gesture, not a save gesture. | Two consequences: (a) closing the dialog without "saving" still keeps the edits — that's intentional; explicit Cancel = user must undo via rich-card's history; (b) consumers wanting transactional edit (Save / Cancel) can wrap the dialog with their own staging state — not the default. Documented in the guide. Alternative (explicit Save) doubles the state machine and forks rich-card's undo from the canvas's undo — unwanted complexity. |
| **Q3** ✅ **LOCKED 2026-05-16** | **Multi-select / bulk-edit support in v0.1?** flow-canvas-01 already supports marquee multi-select. Does clicking-to-edit when N>1 nodes are selected open one dialog per node? a single dialog with a multi-edit surface? open the dialog on just the most-recently-clicked? | **Yes — n8n-style multi-select supported in v0.1.** Multi-select itself (marquee + shift-click) ships at the canvas level — already present in flow-canvas-01 since v0.1.x. Bulk canvas operations (move, delete, duplicate, copy-paste) work across the selection per flow-canvas-01's existing model. **For EDIT specifically:** clicking-to-edit when N>1 nodes are selected opens the dialog on the **clicked node only** (single-node-edit gesture); the other selected nodes remain selected for non-edit operations. **Bulk-EDIT** (single edit op applied across the selection via the dialog) is the v0.2 deferral — needs a real consumer signal on which fields are bulk-editable + a UX shape that doesn't conflict with rich-card's single-tree contract. | n8n's model is the precedent: multi-select for canvas operations is broad, but the edit gesture is always single-node (you click ONE node to edit; multi-select changes what bulk-delete/move applies to, not what the editor sees). Matches kanban-board-01's posture exactly. v0.1 ships everything the n8n analog ships; bulk-edit-via-dialog is the additional thing we DON'T attempt to spec without a real consumer ask. |
| **Q4** ✅ **LOCKED 2026-05-16** | **`RichCardViewer` ships inline in `flow-canvas-01` OR as a sibling procomp `rich-card-in-flow`?** Two options: (a) bundle into flow-canvas-01 as a built-in renderer (like `customJsonRenderer`); (b) ship as a dedicated procomp with its own `meta.ts` / registry entry / version. | **Sibling procomp.** New folder `src/registry/components/data/rich-card-in-flow/` with its own version, registry entry, demo, usage, and meta. flow-canvas-01 only gets the additive `onEditRequest` API (v0.2.1 patch per Q5). | Three reasons: (i) `flow-canvas-01` must stay rich-card-unaware to keep its portability promise (CLAUDE.md hard rule: "Registry code may import only: `react`, `@/components/ui/*`, `@/lib/utils`, and explicitly-declared third-party deps"); inline (option a) would directly violate this. (ii) The two slugs version independently — rich-card moving to v0.5 / v0.6 doesn't require a flow-canvas-01 bump. (iii) Pay-for-what-you-use — consumers wanting flow-canvas without rich-card don't carry the rich-card bundle cost (and vice versa). **Slug locked: `rich-card-in-flow`. Category: `data`.** Convention extensibility bonus: future heavy-content adapters (`plate-editor-in-flow`, `code-block-in-flow`) follow the same shape — each is its own sibling procomp, not bundled into flow-canvas. |
| **Q5** ✅ **LOCKED 2026-05-16 (REVISED)** | **Version target for the flow-canvas-01 API addition.** Does `onEditRequest` (both surfaces) land as part of the v0.2.0 perf release, in a separate v0.2.x patch, or coupled to rich-card-in-flow v0.1.0? | **Land it as a `flow-canvas-01@v0.2.1` additive patch** (post-v0.2.0 ship). **History:** the original Q5 proposal bundled `onEditRequest` into v0.2.0 alongside the Tier 1 + Tier 2 perf work, but v0.2.0 shipped (commits `a6b3295`..`6587ef6`, 2026-05-16) WITHOUT the API addition — the v0.2.0 perf description that was signed off didn't include `onEditRequest` as scope, and the v0.2.0 plan doc didn't pick it up. v0.2.1 patch is the cleanest path forward: purely additive (no default change, no behavior change for non-consumers — same properties that would have justified bundling into v0.2.0); small enough scope (2 new optional fields, 1 wiring change in `node-adapter.tsx`) to qualify as a patch rather than a minor; ships before rich-card-in-flow@v0.1.0 so the procomp can declare `flow-canvas-01@^0.2.1` as its peer-dep baseline. The Q1 lock also widened the signature to take an optional `subPath` second argument (subcard-level edit targeting); v0.2.1 absorbs that signature directly. | Consequence: rich-card-in-flow@v0.1.0 declares `flow-canvas-01@^0.2.1` in `meta.ts` peer requirements. The v0.2.1 patch is a small standalone work item (not blocked on anything else); it can ship independently of rich-card-in-flow's GATE 1 sign-off — though in practice they'll ship close together. Alternative paths considered and rejected: **(b)** waiting for v0.3.0 (Tier 3 canvas-edge-overlay + LOD) — would unnecessarily couple the API addition to a much bigger ship; **(c)** skipping the host-level API entirely and having the viewer wire its own onClick handler directly — works but loses the convention-extensibility win for future heavy renderers (`plate-editor-in-flow`, `code-block-in-flow`). The convention belongs at the host level so future heavy renderers inherit it. |
| **Q6** ✅ **LOCKED 2026-05-16** | **`RichCardViewer` content — what exactly does the read-only paint surface include?** Fixed for v0.1 (per §3 in scope): title + first 2–4 flat fields + nested-card outlines (1 level) + port handles. Should "first 2–4 flat fields" be configurable, or hardcoded? | **Hardcoded in v0.1; configurable in v0.2.** v0.1 ships a fixed shape: constants `MAX_FLAT_FIELDS = 3`, `MAX_NESTED_OUTLINES = 4`, `NESTED_DEPTH = 1`. v0.2 opens optional config when a real second consumer surfaces with diverging needs. | **Key insight (resolved at lock time):** the API surface for "I want a different shape" is **already open** via the `NodeRenderer` registry — any consumer can write their own `NodeRenderer<RichCardJsonNode>` with whatever paint they want. The shipped `richCardViewerRenderer` is the "default opinion," not "the renderer." Hardcoded internal constants v0.1 keeps the surface tiny + lets real consumer signal pick the right knobs for v0.2. Aligns with dynamicity-primacy memory at the API level (registry is open); the "add later is breaking" concern doesn't apply to internal constants — opening them up in v0.2 is purely additive optional config. |
| **Q7** ✅ **LOCKED 2026-05-16** | **What happens if a node's `data.__type === "rich-card"` but the data doesn't look like a `RichCardJsonNode`** (malformed, partial, schema drift)? | **Soft-fail to a neutral fallback paint.** The viewer guards against missing/malformed fields (no title, no flat fields, weird nesting) and renders a placeholder ("Untitled rich-card") rather than throwing. Port handles still render if `ports` is present at root or any subcard level. | rich-card's own validation rejects malformed input at parse time inside the editor — the viewer doesn't have rich-card's full parser; it does a defensive render. Same posture as `customJsonRenderer`. The neutral-placeholder fallback is keyboard-focusable + still fires `ctx.onEditRequest?.()` so consumers can open the dialog and fix the malformed data inside rich-card's editor. |
| **Q8** ✅ **LOCKED 2026-05-16** | **Does the renderer enforce single-instance-edit, or can a consumer open multiple dialogs (one per node)?** | **Consumer's choice.** The procomp ships the single-dialog pattern as the guide example, but doesn't force it — `onEditRequest(nodeId, subPath?)` fires every time; the consumer's state model decides whether to allow concurrent dialogs. Single-dialog is **strongly recommended** in the guide because that's what unlocks the "at most one mounted editor" perf property. | Multi-dialog is a consumer footgun for perf, not a correctness bug. Recommend in docs; don't enforce in code. Dev-mode warning for "more than one `<RichCard>` mounted simultaneously while paired with a `richCardViewerRenderer`-using canvas" deferred to v0.2 polish if a real consumer hits this. |
| **Q9** ✅ **LOCKED 2026-05-16 (already satisfied)** | **Does this v0.1 block on rich-card v0.1 shipping?** rich-card's description was originally awaiting GATE 1 sign-off when this doc was first drafted. | **Soft dependency, already satisfied.** rich-card has progressed far beyond the originally-anticipated v0.1 viewer + v0.2 editor milestones — current state per STATUS.md: **rich-card v0.4.1, status `beta`** (only beta-status component in the registry). The `RichCardJsonNode` shape + `<RichCard>` `defaultValue` / `onChange` / imperative-handle surface are stable. `rich-card-in-flow@v0.1.0` declares `rich-card@>=v0.4.0` as its `dependencies.internal` baseline (the `initialFocusPath` prop used by §5.3's consumer example may need a rich-card patch bump if it doesn't already exist — verify at GATE 2). | The original "blocks on rich-card v0.1" framing was the only source of meaningful schedule risk; it's now moot. The procomp is now blocked ONLY on: (a) flow-canvas-01@v0.2.1 patch (small, can ship anytime per Q5 lock); (b) this doc's remaining GATE 1 sign-off (Q4 + Q6 still pending). |
| **Q10** ✅ **LOCKED 2026-05-16 (home deferred to GATE 2)** | **Where does the consumer-side `updateNodeData(canvas, nodeId, next)` helper live?** | **Re-export from `rich-card-in-flow`** (or `flow-canvas-01` — final home picked at GATE 2). It's a 4-line walk-and-replace; ships as a typed utility so consumers don't reinvent it. | Tiny enough that the description doesn't need to lock the home — GATE 2 plan stage decides between (a) flow-canvas-01@v0.2.1 ships the helper alongside the `onEditRequest` API (broadest reach; any consumer using `onEditRequest` likely needs it) vs (b) rich-card-in-flow re-exports it (narrower; tied to this procomp). Recommendation surfacing now: option (a) — pair the helper with the API that creates the need. |

---

## 8. Validation backing (sources)

- **The convention itself:** [`flow-canvas-01-v0.2.0-perf-description.md` Q33](../flow-canvas-01-procomp/flow-canvas-01-v0.2.0-perf-description.md) — "popup-edit renderer convention" locked in that doc, this procomp implements it.
- **Renderer-registry precedent:** workspace + kanban-board-01 + flow-canvas-01 all use the `{ id, label, render }` registry pattern; rich-card-in-flow plugs into flow-canvas-01's existing `NodeRenderer<TData>` surface unchanged. See project-memory `project_renderer_registry_pattern.md` (rendered-as-renderer demo precedent: kanban v0.2 wraps `<RichCard>` as a `KanbanCardRenderer` with full feature passthrough).
- **The v0.1.4 port-handle fix:** [`decisions/2026-05-14-flow-canvas-v0.1.4-custom-json-handles.md`](../../../.claude/decisions/2026-05-14-flow-canvas-v0.1.4-custom-json-handles.md) — the `RichCardViewer` MUST call `<PortsAt>` for declared ports; the v0.1.4 lesson applies one-for-one.
- **xyflow performance ceiling:** [`flow-canvas-01-v0.2.0-perf-description.md` §1](../flow-canvas-01-procomp/flow-canvas-01-v0.2.0-perf-description.md) — even with the v0.2 perf ladder, the substrate's practical wall is ~1–2k nodes. The "at most one editor mounted" property is what keeps `rich-card-in-flow` from collapsing that ceiling.
- **rich-card surface contract:** [`rich-card-procomp-description.md`](../rich-card-procomp/rich-card-procomp-description.md) — `RichCardJsonNode` shape is locked there; this procomp consumes it unchanged. The `defaultValue` + imperative-handle state model + `onChange` (v0.2) is what the dialog wires to.
- **Drag-interaction-conflict precedent:** project-memory `project_renderer_registry_pattern.md` describes kanban v0.2's `dragHandle: "header"` opt-in — same class of bug (host DnD vs renderer-internal pointer interactions). For `rich-card-in-flow` v0.1, we *avoid* the conflict entirely by not mounting interactive rich-card content inline; the read-only viewer has no internal pointer interactions to compete with xyflow's.

---

## 9. Per-surface API matrix (one-glance summary)

| Surface | v0.1 addition | Default | Visible API break? |
|---|---|---|---|
| `flow-canvas-01` `FlowCanvasProps` | `onEditRequest?: (nodeId: string) => void` | `undefined` | No (additive) |
| `flow-canvas-01` `RenderContext` | `onEditRequest?: () => void` (bound to current `nodeId`) | `undefined` | No (additive) |
| `rich-card-in-flow` (new procomp) | `richCardViewerRenderer: NodeRenderer<RichCardJsonNode>` named export | — | New procomp — no existing API to break |
| `rich-card-in-flow` (new procomp) | `updateNodeData(canvas, nodeId, next): CanvasData` utility (per Q10) | — | New helper |
| `rich-card-in-flow` (new procomp) | Re-export `type { RichCardJsonNode } from "rich-card"` | — | Convenience re-export |
| Procomp guide (`rich-card-in-flow-procomp-guide.md`) | "Consumer-owned dialog pattern" — one page | — | Doc-only |
| Procomp guide (`flow-canvas-01-procomp-guide.md`) | New section: "Edit-on-click renderer convention" — links to rich-card-in-flow | — | Doc-only |

---

## 10. Risks

- **rich-card v0.1 slips.** This procomp can't ship without rich-card v0.1's viewer surface. Mitigation: flow-canvas-01@v0.2.0 ships the `onEditRequest` API addition + the convention is documented in the guide *without* this procomp existing yet. Consumers can implement the convention against any heavy editor (not just rich-card) starting v0.2.0. If rich-card is delayed, this procomp's first ship slips with it; the convention is live regardless.
- **Single-mounted-instance property breaks silently.** A consumer registers `RichCardViewer` but wires multi-dialog state (one dialog per node, opens on click, doesn't close on next click). Now N nodes click-edited → N `<RichCard>` instances mounted. The procomp's perf claim degrades. Mitigation: (a) recommend single-dialog explicitly in the guide; (b) demo uses single-dialog; (c) consider a dev-mode warning if more than one `<RichCard>` is mounted simultaneously when paired with a `richCardViewerRenderer`-using canvas — deferred to v0.2 polish if it bites.
- **Viewer outline depth = 1 hides important structure.** A 4-level rich-card tree shows the root + 1 level of children as outlines; deeper levels are invisible until the dialog opens. Mitigation: this is intentional (deeper levels = more paint cost per node); documented in the guide. v0.2 can add a `maxOutlineDepth?: number` config if a consumer asks.
- **Live-save (Q2) corrupts canvas state on dialog crash.** If `<RichCard>` throws mid-edit, the canvas may have absorbed a partial JSON. Mitigation: (a) rich-card's own validation contract rejects malformed input at the parse boundary; (b) consumers wanting transactional semantics wrap the dialog with staging state (documented in the guide).
- **Port-handle drift at root AND subcard levels.** `RichCardViewer` must call `<PortsAt>` for all four sides on the root AND for each subcard's own `ports?: Port[]` (per the v0.1.4 lesson + the Q1 lock). A future contributor refactors the viewer and accidentally removes a side OR drops the subcard ports → silent FPS regression at scale + console flood for unwired edges. Mitigation: (a) the GATE 3 review's "rotating dimension" for this procomp should be **performance** specifically targeting the port-handle invariant at every level; (b) the procomp guide's "Renderer-author rule" includes the lesson explicitly for recursive ports.
- **Subcard hit-test bleed-through onto root.** Clicking a subcard region must fire `ctx.onEditRequest?.(subPath)` but NOT also fire `ctx.onEditRequest?.()` for the root (i.e., event bubble swallow). Mitigation: subcard click handlers call `e.stopPropagation()` before firing; tested in demo with 2-level subcards.
- **A11y handoff between canvas and dialog.** Focus must move into the dialog on open and back to the source node on close; if the source node is no longer in viewport (consumer scrolled the canvas while editing), the return focus has nowhere obvious to go. Mitigation: scroll-into-view + visible focus ring on the source node on dialog close. Locked at GATE 2.
- **Two-procomp version sync.** `flow-canvas-01@v0.2.1` (additive patch per Q5 lock) exposes `onEditRequest`; if `rich-card-in-flow@v0.1.0` ships before the v0.2.1 patch lands, consumers see a TypeScript error (missing `onEditRequest` prop on `FlowCanvasProps` / `RenderContext`). Mitigation: the rich-card-in-flow `meta.ts` declares `flow-canvas-01@^0.2.1` as a peer dep; the registry-distribution `validate-meta-deps` lint catches the drift before push. Sequencing: v0.2.1 patch ships first (small standalone work item per Q5), then rich-card-in-flow@v0.1.0 lands.
- **"At most one editor" is a property of consumer wiring, not of this procomp's code.** We can document and recommend, but a misconfigured consumer can defeat it. Mitigation: covered by the dev-mode-warning idea above; otherwise this is a doc + demo discipline.
- **Convention drift if a second heavy-content renderer ships.** If `plate-editor-in-flow` or `code-block-in-flow` is built next, they should follow the same convention. Mitigation: the popup-edit convention is documented at the **flow-canvas-01 guide** level (not just this procomp's guide), so future heavy renderers inherit it.

---

## 11. Definition of "done" for THIS document (stage gate)

Before moving to Stage 2 (`rich-card-in-flow-procomp-plan.md`):

- [x] Sections 1–10 reviewed (consistency review pass — partial, 2026-05-16; reflects Q1/Q3/Q5/Q9 locks).
- [x] **Q1–Q10 each carry an agreed or overridden answer.** All 10 locked 2026-05-16. Q1 (subcard ports + selectability + content via popup), Q2 (live save — every keystroke flows to canvas), Q3 (n8n-style multi-select supported in v0.1; bulk-EDIT deferred to v0.2), Q4 (sibling procomp; slug `rich-card-in-flow` confirmed), Q5 (REVISED — v0.2.1 additive patch, not v0.2.0 bundle), Q6 (hardcoded constants v0.1, configurable v0.2 — consumers can also register their own `NodeRenderer<RichCardJsonNode>` for fully custom paint), Q7 (soft-fail to neutral placeholder; port handles still render if present), Q8 (consumer's choice; single-dialog strongly recommended), Q9 (already satisfied — rich-card at v0.4.1 beta), Q10 (re-export from rich-card-in-flow or flow-canvas-01 — home picked at GATE 2; recommend pairing with the v0.2.1 patch).
- [x] In-scope / Out-of-scope per §3 confirmed — specifically that v0.1 is **single-node edit gesture only** (with n8n-style multi-select supported for canvas operations per Q3), **no inline editing inside the canvas**, and the **dialog component is consumer-owned, not shipped**.
- [x] Architecture per §2 confirmed (subject to Q4 lock on inline-vs-sibling-procomp) — viewer-renderer in canvas + consumer-owned dialog + at-most-one editor instance + shared `RichCardJsonNode` shape with no transformation.
- [x] flow-canvas-01 API addition (`onEditRequest` on both surfaces, with optional `subPath` per Q1) confirmed as **additive only**, no default change, no behavior change for non-consumers. Versions onto `flow-canvas-01@v0.2.1` per revised Q5.
- [x] Soft-dependency on rich-card acknowledged + already satisfied (Q9): rich-card at v0.4.1 beta; `RichCardJsonNode` + `<RichCard>` surface stable.
- [x] Risks (§10) acceptable; mitigations agreed. **New risks added 2026-05-16:** subcard hit-test bleed-through, port-handle drift extended to subcard level.
- [x] Slug `rich-card-in-flow` + category `data` confirmed (Q4 locked).
- [x] **User explicit "approved" 2026-05-16 — GATE 1 closed, Stage 2 plan doc unlocked.**

After sign-off, no editing this doc casually — changes after sign-off should be loud and intentional, not silent rewrites. Same rule as the flow-canvas-01 + rich-card descriptions.

---

## Appendix A — How this doc relates to existing planning artifacts

- **flow-canvas-01 v0.1.x description + plan + guide** — authoritative for the host's pre-v0.2.0 surface.
- **flow-canvas-01 v0.2.0 perf description + plan + spotcheck** ([description](../flow-canvas-01-procomp/flow-canvas-01-v0.2.0-perf-description.md) · [plan](../flow-canvas-01-procomp/flow-canvas-01-v0.2.0-procomp-plan.md) · [spotcheck](../flow-canvas-01-procomp/reviews/2026-05-16-v0.2.0-spotcheck.md) · [decision file](../../../.claude/decisions/2026-05-16-flow-canvas-v0.2.0-perf-bundle.md)) — Q33 of the perf description locks the popup-edit convention; this procomp is the canonical first consumer. **v0.2.0 SHIPPED 2026-05-16 (commits `a6b3295`..`6587ef6`)** without the `onEditRequest` API (Q5 originally proposed bundling but the v0.2.0 scope didn't include it). Per the revised Q5 lock, the API addition is now a `flow-canvas-01@v0.2.1` additive patch — a small standalone work item that ships before rich-card-in-flow@v0.1.0.
- **flow-canvas-01 v0.2.1 patch (TBD)** — small additive work item: adds `onEditRequest` to `FlowCanvasProps` + `RenderContext` + wires the per-node binding in `node-adapter.tsx`. No default change, no behavior change. Estimated effort: ~1 hour incl. tests + meta bump + registry regen.
- **rich-card description + plan + guide** ([description](../rich-card-procomp/rich-card-procomp-description.md)) — authoritative for the editor's surface. rich-card is at **v0.4.1 beta** (only beta-status component in the registry). `RichCardJsonNode` shape + `<RichCard>` `defaultValue` / `onChange` / imperative-handle surface are stable. The `initialFocusPath` prop used by §5.3's consumer example may need a rich-card patch bump if it doesn't already exist; verify at GATE 2.
- **kanban-board-01 v0.2 description + plan** — precedent for "register a rich component as a renderer" pattern (per project-memory). The rich-card-in-flow design is structurally the same, with the heavy-content twist solved via dialog-extraction instead of `dragHandle: "header"`.
- **Future:** when a second heavy-content adapter ships (`plate-editor-in-flow`, `code-block-in-flow`, etc.), it should follow this doc as the template.

---

## Appendix B — Quick links to the levers (file:line references)

| Touch point | Location | Change |
|---|---|---|
| `FlowCanvasProps.onEditRequest` | [`flow-canvas-01/types.ts:113-166`](../../../src/registry/components/data/flow-canvas-01/types.ts) | Add `onEditRequest?: (nodeId: string) => void` |
| `RenderContext.onEditRequest` | [`flow-canvas-01/types.ts:52-58`](../../../src/registry/components/data/flow-canvas-01/types.ts) | Add `onEditRequest?: () => void` (bound to current `nodeId`) |
| Plumbing — context construction | [`flow-canvas-01/parts/node-adapter.tsx`](../../../src/registry/components/data/flow-canvas-01/parts/node-adapter.tsx) | Bind `() => props.onEditRequest?.(nodeId)` into the per-node ctx |
| New procomp folder | `src/registry/components/data/rich-card-in-flow/` (does not exist yet) | Scaffolded at GATE 2 ship via `pnpm new:component data/rich-card-in-flow` |
| New renderer | `src/registry/components/data/rich-card-in-flow/parts/rich-card-viewer.tsx` | ~120 LoC read-only paint + `PortsAt` × 4 + click → `ctx.onEditRequest?.()` |
| `RichCardJsonNode` (rich-card source) | `src/registry/components/data/rich-card/types.ts` (does not exist yet — pending rich-card v0.1) | Consumed via re-export from `rich-card-in-flow` |
