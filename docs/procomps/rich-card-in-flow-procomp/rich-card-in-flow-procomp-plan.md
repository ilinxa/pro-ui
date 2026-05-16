# `rich-card-in-flow` — Stage 2 Plan

> **Stage:** 2 of 3 · **Status:** **v3 — Signed off 2026-05-16 (GATE 2 closed; implementation unlocked)** · Re-validated 2026-05-16 (6 V-findings + 4 gap-scan fold-ins all resolved; indexed in §3.5)
> **Slug:** `rich-card-in-flow` · **Category:** `data`
> **Inputs:** Stage 1 description signed off 2026-05-16 ([rich-card-in-flow-procomp-description.md](rich-card-in-flow-procomp-description.md), commit `4a9b5a3`). All 10 Qs locked. flow-canvas-01 currently at **v0.2.0** (commits `a6b3295`..`6587ef6`, shipped 2026-05-16) — the `onEditRequest` API has NOT yet landed; per Q5 it ships as `v0.2.1` patch, sequenced before rich-card-in-flow@v0.1.0.
> **What this plan covers:** the **two coordinated workstreams** that together unlock rich-card content inside flow-canvas-01 nodes — `flow-canvas-01@v0.2.1` (small additive API patch) AND `rich-card-in-flow@v0.1.0` (new procomp). The two ship sequentially in close succession; v0.2.1 first, rich-card-in-flow second.

After GATE 2 sign-off, no scaffolding-time second-guessing — implementation follows the plan, deviations are loud.

---

## 1. Inherited inputs (one-paragraph summary)

`rich-card-in-flow@v0.1.0` is the canonical implementation of the popup-edit renderer convention locked in `flow-canvas-01@v0.2.0` perf description Q33. Architecture: a read-only `RichCardViewer` renderer paints inside each flow-canvas node (~150–180 LoC; title + first 3 flat fields + nested-card outlines with their own ports + selectability + click affordances at root and subcard levels); clicking fires `ctx.onEditRequest?.(subPath?: string)` which bubbles up through `FlowCanvasProps.onEditRequest?: (nodeId, subPath?) => void`; the consumer's dialog mounts the full `<RichCard editable={true}>` editor with the same `RichCardJsonNode` data (no transformation layer); rich-card's `onChange` writes back to canvas state live (Q2 lock — every keystroke; rich-card owns undo). At most ONE rich-card editor instance mounted at any time, regardless of node count.

The `subPath?: string` argument (Q1 lock — subcards with their own ports + selectability) carries the clicked subcard's `__rcid` so the consumer can pre-focus the dialog via `RichCardHandle.focusCard(subPath)` (imperative ref method).

---

## 2. Workstream split

This plan is two coordinated bodies of work. They share planning artifacts but ship as separate commits to separate slugs:

| Workstream | Slug | Version | Purpose | Effort |
|---|---|---|---|---|
| **A — Host API patch** | `flow-canvas-01` | `0.2.0 → 0.2.1` | Add `onEditRequest` (both surfaces) + optional `updateNodeData` helper export | ~1 hour |
| **B — Viewer procomp** | `rich-card-in-flow` (new) | `0.1.0 first ship` | New sealed folder + viewer renderer + demo + usage + registry distribution | ~4–6 hours |

Workstream A is a small standalone patch that unlocks Workstream B. A also stands on its own — any future heavy-content adapter (`plate-editor-in-flow`, `code-block-in-flow`, etc.) inherits the same hook.

---

## 3. Resolved validation findings (lock-in)

The Stage 1 description was signed off with 10 locked Qs. This plan adds implementation-level locks AND captures findings from the 2026-05-16 re-validation pass (§3.5).

### F-01 — `subPath` is `__rcid`, not a path-like string

**Description's wording (§5.2 / §5.3):** `subPath` argument carries "the clicked subcard's tree path" — implied path-like (e.g. `"children[0]"`).

**Reality (verified):** [rich-card's `RichCardJsonNode`](../../../src/registry/components/data/rich-card/types.ts) uses `__rcid?: string` (UUID-like) as the canonical card identifier — auto-attached by rich-card on parse. There is no path-like addressing surface in rich-card's public API; `RichCardHandle.focusCard(id: string)` takes the `__rcid` directly.

**Lock:** the `subPath` argument is the clicked subcard's `__rcid` value (a string UUID). The viewer reads `subcard.__rcid` from the rendered subcard's data and fires `ctx.onEditRequest?.(subcard.__rcid)`. Consumers pass this string verbatim to `RichCardHandle.focusCard(subPath)` via ref. **The `subPath` type stays opaque (`string`) at the flow-canvas-01 API level** — flow-canvas-01 remains rich-card-unaware; the string semantic ("it's an rcid") is rich-card-in-flow's contract.

### F-02 — Consumer dialog wiring uses imperative `focusCard(id)`, not a hypothetical prop

**Description's wording (§5.3):** sample code uses `<RichCard initialFocusPath={editingSubPath} ... />` — a fictional prop.

**Reality (verified):** [`RichCardProps`](../../../src/registry/components/data/rich-card/types.ts) has no `initialFocusPath` (or `initialFocusCardId` or similar). Focusing a specific card is via [`RichCardHandle.focusCard(id: string)`](../../../src/registry/components/data/rich-card/types.ts) — imperative method on the ref.

**Lock:** the consumer-side dialog wiring uses `useRef<RichCardHandle>()` + a `useEffect` that calls `richCardRef.current?.focusCard(subPath)` when `subPath` is set. The procomp guide (Stage 3) ships this corrected pattern. **No PR against rich-card needed** — the imperative path works today; adding an `initialFocusCardId?: string` prop to rich-card is a v0.2 polish if the imperative-via-ref ergonomics bite consumers.

### F-03 — Subcard-click-to-edit gracefully degrades when `__rcid` is missing

**Issue:** `__rcid` is OPTIONAL on `RichCardJsonNode` (`__rcid?: string`). rich-card auto-attaches IDs on parse, but a freshly-constructed `RichCardJsonNode` (e.g. consumer-defined fixture data) may not carry `__rcid` until it's been through `<RichCard>` once.

**Lock:** the viewer enables subcard-click-to-edit **only when `subcard.__rcid` is defined**. When missing:
- Subcard is still rendered (visual block + ports still paint).
- Subcard is still keyboard-focusable for visual cue.
- Clicking the subcard bubbles to root (`ctx.onEditRequest?.()` with no subPath) — opens the dialog at root; the user navigates within rich-card's tree to find the subcard.

Dev-mode `console.warn` when a viewer encounters a subcard without `__rcid`: *"RichCardViewer: subcard without __rcid; click-to-focus-this-subcard disabled. Pass the data through `<RichCard>` once or call `rich-card`'s ID-attach helper to fix."*

### F-04 — Subcard enumeration: rich-card uses open-shape, not a fixed `children[]` array

**Issue:** [`RichCardJsonNode`](../../../src/registry/components/data/rich-card/types.ts) is open-shape (`[key: string]: unknown`). Nested cards live under arbitrary keys with their own `__rcid` — there is no canonical `children[]` array (despite the description's §2 ASCII diagram hinting at one).

**Lock:** the viewer's subcard enumeration walks `Object.entries(data)` and treats a value as a nested card when:
1. The value is an object (`typeof === "object" && !Array.isArray(value) && value !== null`)
2. The value has `__rcid` defined (real subcard, addressable)  
   OR
   The value's shape "looks like a card" — has `__rcid` OR `__rcorder` OR `__rcmeta` OR carries `ports?: Port[]` (so subcards without `__rcid` still render but disable click-to-focus per F-03).

Helper exported from rich-card-in-flow's lib: `enumerateSubcards(data: RichCardJsonNode): Array<{ key: string; card: RichCardJsonNode }>`. v0.1 of this helper uses the heuristic above; v0.2 can tighten if rich-card ships a canonical "is-card" predicate.

### F-05 — Port-walker recursion + position-relative chain for subcard handles

**Verified (connection routing):** [`findPortInTree`](../../../src/registry/components/data/flow-canvas-01/lib/port-walker.ts) walks `Object.entries` recursively, skipping `ports` and `__type` keys, descending into all other object children. Subcards' `ports?: Port[]` arrays are found at any depth. **No new plumbing needed for connection validation / edge routing.**

**Visual positioning (G1 fold-in, 2026-05-16):** xyflow's `<Handle>` is `position: absolute` — it anchors to the **nearest positioned ancestor**. For subcard handles to render at the subcard's screen location (not at the outer node's edges), every level of the DOM tree from the xyflow wrapper down to the subcard must be `position: relative` (or absolutely/sticky positioned). **The full chain:**

```
.react-flow__node                  ← xyflow wrapper (xyflow makes this positioned via transforms)
  └─ NodeShell <div>               ← MUST be position: relative (it already is — v0.2.0 line in node-shell.tsx)
     └─ RichCardViewer outer <div> ← MUST be position: relative (locked in §5.2 code sketch via `className="relative ..."`)
        └─ SubcardBlock <button>   ← MUST be position: relative (locked in §5.3 code sketch via `cn("relative ...")`)
           └─ <Handle> × 4 sides   ← position: absolute, anchors to SubcardBlock
```

If a future contributor removes `relative` from any level in the chain, that level's handles silently fly to a wrong ancestor (a higher positioned container). **No console warning. No test catches it.** The bug is purely visual at runtime.

**Lock — three constraints:**
1. **Port IDs unique within the entire node** (flow-canvas-01's locked Q9 — port-walker assumes uniqueness; collisions return the first match). Dev-mode `console.warn` if a duplicate port ID is detected during viewer mount (cheap one-pass scan).
2. **`RichCardViewer` outer `<div>` MUST carry `relative` className** — preserved in code reviews. Comment in `rich-card-viewer.tsx` makes it explicit.
3. **`SubcardBlock` `<button>` MUST carry `relative` className** — preserved in code reviews. Comment in `subcard-block.tsx` makes it explicit.

The viewer's `enumerateSubcards` + per-subcard `<PortsAt>` emit ports with their pre-existing IDs; the consumer is responsible for ID uniqueness in their canvas data.

### F-06 — Editor mode + rich-card version requirement

**Lock:** the dialog mounts `<RichCard editable={true}>` (per Q2's live-save lock — rich-card's v0.2+ editor surface). The procomp declares `rich-card@^0.4.0` as its `meta.ts dependencies.internal` baseline. rich-card is currently at v0.4.1 beta — the requirement is already satisfied. The v0.4 `validators` / `maxUndoDepth` / `onUndo` / `onRedo` props are NOT passed by the procomp guide's default wiring (consumer can pass them through if they want); v0.1 procomp keeps the consumer-side dialog example minimal (~15 lines).

### F-07 — Single-click trigger, not double-click

**Issue:** the description doesn't lock single vs double click as the edit trigger. xyflow's click model: mousedown selects the node; mouseup fires consumer `onClick` handlers. Double-click would require `onDoubleClick` + suppressing the single-click handler.

**Lock:** **single click** opens the dialog (matches n8n's node-edit gesture). Specifically: `mouseup` on the renderer body (or a subcard) fires `ctx.onEditRequest?.(subPath?)`. Selection (xyflow's mousedown handler) and edit (our mouseup handler) both fire on every click — they don't conflict; both are intended side-effects. Drag is unaffected because xyflow's drag-detection requires mouse movement above a threshold before mouseup; if the user drags, no mouseup-click fires.

**v0.2 escape hatch:** `richCardViewerOptions?.editTrigger?: "click" | "doubleClick"` if a consumer surfaces with a real conflict (e.g. they wire their own single-click handler on the canvas and want rich-card edits gated to double-click). Out of v0.1 scope.

### 3.5 Plan re-validation findings (V-series, 2026-05-16)

Three-pass self-validation against current code state — initial draft pass surfaced F-V1/F-V2/F-V3; deeper post-draft pass against actual source files surfaced F-V4/F-V5; a third pre-approval review pass against the typed-generic surface of `NodeRenderer` surfaced F-V6. **Six findings total** (memory says 3–5 typical for Stage 2; this plan came in slightly above after the careful source verification — the extra surfaced an objective tsc blocker, well worth the pass).

| ID | Severity | Resolved in | One-line summary |
|---|---|---|---|
| **F-V1** | 🔸 Med | §5.2 (RichCardViewer impl notes) | The "outer button-role surface" with subcard inner clicks doesn't compose — clicking a subcard inside a button would fire both. Lock: renderer uses a `<div role="group">` at root + per-subcard `<button>` elements + a root `<button>` for the title strip area. NOT one outer button. |
| **F-V2** | 🔸 Med | §6 step 10 | The smoke harness rule for v0.1.0 first ships (per readiness-review rule) applies to **rich-card-in-flow@v0.1.0** — this is a new component. Smoke harness path-b MUST run pre-push. Plan locks this as a required step (NOT skippable like in flow-canvas-01@v0.2.0's case). |
| **F-V3** | 🔹 Low | §10 Impl-time | `dependencies.internal` in `rich-card-in-flow/meta.ts` declares `["rich-card", "flow-canvas-01"]`. The `validate-meta-deps` script will verify both cross-registry imports resolve; precedent: `json-form@v0.1.0` was the first procomp to use `dependencies.internal`. The script's "internal-registry slug" detector handles the `@/registry/components/<cat>/<slug>` pattern in source imports. Verify behavior at impl time. |
| **F-V4** | 🔸 Med | §4.3.1 (NEW — `flow-canvas-01.tsx` wiring) | Plan §4.3 mentioned threading `onEditRequest` through canvas-context "terse" — but the actual wiring needs to land in [`flow-canvas-01.tsx`](../../../src/registry/components/data/flow-canvas-01/flow-canvas-01.tsx) (lines 34–53), which is where the canvas-context `useMemo` is built. Added a dedicated §4.3.1 sub-step documenting the exact edit. The Canvas component itself does NOT need to know about `onEditRequest` (it's context-only, like `renderers`). |
| **F-V5** | 🔸 Med | §4.3.2 (NEW — consumer callback ref-mirror) | The existing pattern in [`use-canvas-data.ts`](../../../src/registry/components/data/flow-canvas-01/hooks/use-canvas-data.ts) ref-mirrors all consumer callbacks (`onChangeRef`, `onBeforeConnectRef`, etc.) so the canvas's internal callbacks stay stable even when consumers pass fresh function identities each render. `onEditRequest` flows through canvas-context (not `useCanvasData`), so it bypasses this defense — every render where the consumer passes a fresh `onEditRequest` would invalidate the context memo + cause ALL `NodeAdapter`s to re-render. Lock: ref-mirror `onEditRequest` inside `flow-canvas-01.tsx`; pass a STABLE wrapped callback through to context. Matches the existing project posture (ref-mirror consumer callbacks defensively; don't trust consumer `useCallback`). |
| **F-V6** | 🚫 Blocker | §5.2 (renderer typing) + §5.7 (new `RichCardCanvasNode` intersection type) + §5.8 (barrel re-export) | The plan originally typed the renderer as `NodeRenderer<RichCardJsonNode>`. `NodeRenderer<TData extends NodeData = NodeData>` ([flow-canvas-01/types.ts:60](../../../src/registry/components/data/flow-canvas-01/types.ts)) constrains `TData` to extend `NodeData` ([flow-canvas-01/types.ts:19](../../../src/registry/components/data/flow-canvas-01/types.ts)), which requires `__type: string`. `RichCardJsonNode` ([rich-card/types.ts:49](../../../src/registry/components/data/rich-card/types.ts)) has only optional `__rcid?`/`__rcorder?`/`__rcmeta?` + index signature — `__type` is NOT required. tsc would error: *"Property '__type' is missing in type 'RichCardJsonNode' but required in type 'NodeData'."* Established precedent in [`parts/custom-json-node.tsx:8`](../../../src/registry/components/data/flow-canvas-01/parts/custom-json-node.tsx) uses intersection: `type CustomJsonData = NodeData & { _label?: string }`. **Lock:** define `type RichCardCanvasNode = NodeData & RichCardJsonNode` in `rich-card-in-flow/types.ts`; type the renderer as `NodeRenderer<RichCardCanvasNode>`. Renderer body can then read `data.ports`, `data.__rcid`, etc. directly without the `(data as NodeData)` cast. Subcards stay typed as `RichCardJsonNode` (legit — they're inner tree nodes, not flow-canvas nodes, and may not have `__type`); the `(card as NodeData).ports` cast at the subcard boundary is structurally sound (NodeData → RichCardJsonNode via the index signature) and stays. Re-export `RichCardCanvasNode` from `index.ts` so consumers can type their `CanvasData.nodes[].data` correctly. |

**Gap-scan fold-ins (2026-05-16, post-draft pass):** four additional gaps surfaced from a deeper source-verification pass against current state. All folded into the plan in place:

| ID | Severity | Resolved in | One-line summary |
|---|---|---|---|
| **G1** | 🔸 Med | §3 F-05 (extended) + §9 risks | F-05 originally locked "port-walker recursion already supports subcard ports — no new plumbing." TRUE for connection routing; FALSE for visual positioning. xyflow `<Handle>` is `position: absolute` — anchors to nearest positioned ancestor. Subcard handles render at subcard locations ONLY IF `position: relative` is preserved at every DOM level (NodeShell, RichCardViewer outer, SubcardBlock). Future contributor removing `relative` from any level → silent visual regression. Lock: explicit code comments at each level + spot-check review verifies. |
| **G2** | 🔹 Low | (impl-time TODO, not plan update) | Demo fixture spec is a stub — concrete `RichCardJsonNode` data with `__rcid`s pre-attached needs to be written at impl time. Cite flow-canvas-01's existing `dummy-data.ts` pattern. |
| **G3** | 🔹 Low | §9 risks | Rapid open/close per-mount cost — `key={editingNodeId}` forces `<RichCard>` remount per click; Plate re-initializes each open. v0.2 polish path: file a rich-card v0.5 PR for `RichCardHandle.setTree(tree)` if rapid-switching becomes real pain. |
| **G4** | 🔹 Low | §9 risks | Radix `<Dialog.Portal forceMount>` defeats the "at most one editor mounted" property. Document in procomp guide as consumer footgun. Not enforceable in code. |
| **G5** | 🔹 Low | Appendix A | Subcards are NOT drag-extractable in v0.1 — they're part of one rich-card tree per Q1 lock. Consumer expecting flow-canvas-01's `data-draggable-subobject` pattern on a subcard will find it doesn't work. v0.2 candidate. |

---

## 4. Workstream A — `flow-canvas-01@v0.2.1` patch — file-by-file plan

Additive patch, three file edits + one optional helper file + meta bump + registry regen.

### 4.1 `types.ts` — add `onEditRequest` to two surfaces

**File:** [`src/registry/components/data/flow-canvas-01/types.ts`](../../../src/registry/components/data/flow-canvas-01/types.ts)

Two additive surface changes. Both optional; both default to `undefined`. Consumers not wiring them see zero behavior change.

```ts
// inside RenderContext (current shape: nodeId / isSelected / isDragging / isReadOnly / renderChild)
export type RenderContext = {
  // ... existing fields ...

  /**
   * Fire from a renderer's click / keyboard-activate handler to request an
   * edit-dialog open for the current node. v0.2.1 addition.
   *
   * - Bound to the renderer's current `nodeId` — renderers call it with NO
   *   nodeId argument (the host already knows which node fired).
   * - Optional `subPath` argument lets renderers signal sub-targeting (e.g.
   *   a clicked subcard inside a rich-card viewer); the host forwards
   *   `subPath` to `FlowCanvasProps.onEditRequest` verbatim.
   * - `undefined` when the consumer doesn't wire `FlowCanvasProps.onEditRequest`.
   *
   * See the popup-edit renderer convention in the procomp guide §8.3 (v0.2.0
   * docs) + the rich-card-in-flow procomp for the canonical implementation.
   */
  onEditRequest?: (subPath?: string) => void;
};

// inside FlowCanvasProps (under the "Performance" section, near onlyRenderVisibleElements)
export type FlowCanvasProps = {
  // ... existing props ...

  /**
   * Fired when a renderer requests an edit-dialog open (typically click).
   * v0.2.1 addition.
   *
   * - `nodeId` is the node firing the request.
   * - `subPath` is an opaque renderer-defined string (e.g. a rich-card subcard's
   *   `__rcid`) for sub-targeting; pass through to your editor (e.g. via
   *   `RichCardHandle.focusCard(subPath)` for the rich-card-in-flow case).
   * - Leave `undefined` if you don't want edit affordances; renderers that
   *   honor the convention will silently no-op.
   *
   * See the popup-edit renderer convention in the procomp guide §8.3 + the
   * rich-card-in-flow procomp.
   */
  onEditRequest?: (nodeId: string, subPath?: string) => void;
};
```

**No version-tag for `RenderContext`'s `onEditRequest` field** — `RenderContext` is part of the public type surface; consumers writing custom renderers see the new optional field automatically.

### 4.2 `parts/node-adapter.tsx` — bind `onEditRequest` into per-node ctx

**File:** [`src/registry/components/data/flow-canvas-01/parts/node-adapter.tsx`](../../../src/registry/components/data/flow-canvas-01/parts/node-adapter.tsx)

Current `NodeAdapter` builds `RenderContext` from xyflow's `NodeProps`. Pull `onEditRequest` from the canvas-level `FlowCanvasContext` (already exposed via `useFlowCanvasContext()`) and bind it per-node:

```ts
// 1. Add to the destructure:
const { renderers, readOnly, onEditRequest } = useFlowCanvasContext();

// 2. Build a stable per-node bound callback:
const handleEditRequest = useCallback(
  (subPath?: string) => onEditRequest?.(id, subPath),
  [onEditRequest, id],
);

// 3. Add to ctx:
const ctx: RenderContext = {
  nodeId: id,
  isSelected: !!selected,
  isDragging: !!dragging,
  isReadOnly: readOnly,
  renderChild,
  onEditRequest: onEditRequest ? handleEditRequest : undefined,
};
```

The `onEditRequest ? handleEditRequest : undefined` ternary ensures `ctx.onEditRequest` stays `undefined` when the consumer hasn't wired the canvas-level prop (per the convention's "renderer that ignores the prop loses nothing" guarantee — and so renderer authors can check `if (ctx.onEditRequest)` to gate their click affordances).

### 4.3 `registries/canvas-context.tsx` — thread `onEditRequest` through the canvas context

**File:** [`src/registry/components/data/flow-canvas-01/registries/canvas-context.tsx`](../../../src/registry/components/data/flow-canvas-01/registries/canvas-context.tsx)

The canvas context already carries `renderers`, `readOnly`, etc. Add `onEditRequest` as an optional context field; threaded from `FlowCanvas` (the root) → through `<FlowCanvasProvider>` → consumed by `<NodeAdapter>`.

```ts
// canvas-context.tsx — add the field to the context shape
type FlowCanvasContextValue = {
  renderers: NodeRenderer[];
  readOnly: boolean;
  // NEW (v0.2.1):
  onEditRequest?: (nodeId: string, subPath?: string) => void;
};
```

### 4.3.1 `flow-canvas-01.tsx` — root component wiring (F-V4 lock)

**File:** [`src/registry/components/data/flow-canvas-01/flow-canvas-01.tsx`](../../../src/registry/components/data/flow-canvas-01/flow-canvas-01.tsx)

The root component currently destructures `renderers / portTypes / edgeTypes / readOnly / selectionMode / onNodeUpdate` from `FlowCanvasProps` and threads them into the canvas-context `useMemo`. Add `onEditRequest` to the same path:

```ts
export function FlowCanvas({
  renderers,
  portTypes,
  edgeTypes,
  readOnly = false,
  selectionMode = "multi",
  onNodeUpdate,
  onEditRequest,       // NEW v0.2.1
  ...rest
}: FlowCanvasProps) {
  // F-V5 lock: ref-mirror the consumer's onEditRequest so its identity
  // changing doesn't invalidate the canvas-context memo on every render.
  const onEditRequestRef = useRef(onEditRequest);
  useEffect(() => {
    onEditRequestRef.current = onEditRequest;
  });

  // Stable wrapper — only flips identity if the consumer toggles between
  // wired and unwired (rare); never if they pass a fresh function identity
  // each render (common — the typical defensive case).
  const stableOnEditRequest = useMemo(
    () =>
      onEditRequest
        ? (nodeId: string, subPath?: string) =>
            onEditRequestRef.current?.(nodeId, subPath)
        : undefined,
    [onEditRequest === undefined],  // identity flips only on wired/unwired toggle
  );

  const ctx = useMemo<FlowCanvasContextValue>(
    () => ({
      renderers: mergeRenderers(renderers),
      portTypes: mergePortTypes(portTypes),
      edgeTypes: mergeEdgeTypes(edgeTypes),
      readOnly,
      selectionMode,
      onNodeUpdate,
      onEditRequest: stableOnEditRequest,    // NEW — stable identity per F-V5
    }),
    [renderers, portTypes, edgeTypes, readOnly, selectionMode, onNodeUpdate, stableOnEditRequest],
  );

  return (/* same as before */);
}
```

**Why the `[onEditRequest === undefined]` dep:** ensures `stableOnEditRequest` flips identity ONLY when consumer transitions between wired and unwired states — not when they pass a fresh function identity each render. Common consumer pattern: `onEditRequest={(nodeId) => setEditingNodeId(nodeId)}` inline. Without F-V5's ref-mirror, this inline pattern would cascade re-renders across every NodeAdapter on every parent re-render.

### 4.3.2 Ref-mirror rationale (F-V5 lock) + alternative considered

Matches the established defensive posture in `use-canvas-data.ts` (which ref-mirrors `onChange`, `onBeforeConnect`, `onNodeCreate`, etc. for the same reason). Alternative considered + rejected: document the rule that consumers MUST `useCallback` their `onEditRequest`. Rejected because (a) the project already takes the defensive ref-mirror posture for other callbacks, so consistency wins; (b) consumers reading the docs may miss the `useCallback` rule, then debug a baffling perf regression; (c) the ref-mirror cost is negligible (one `useRef` + one `useEffect` + one `useMemo`).

### 4.4 (Optional, recommended per Q10) — `lib/update-node-data.ts` helper

**File (new):** `src/registry/components/data/flow-canvas-01/lib/update-node-data.ts`

```ts
import type { CanvasData, NodeData } from "../types";

/**
 * Walk-and-replace the `data` field of a single node by id. Returns a new
 * `CanvasData` reference (immutable update — does NOT mutate the input).
 * Returns the input unchanged if `nodeId` is not found.
 *
 * Shipped as a typed utility so consumers wiring `onEditRequest` + a dialog
 * don't reinvent it. See the rich-card-in-flow procomp guide for the canonical
 * pattern. v0.2.1 addition.
 */
export function updateNodeData(
  canvas: CanvasData,
  nodeId: string,
  nextData: NodeData,
): CanvasData {
  const idx = canvas.nodes.findIndex((n) => n.id === nodeId);
  if (idx < 0) return canvas;
  const nextNodes = canvas.nodes.slice();
  nextNodes[idx] = { ...nextNodes[idx], data: nextData };
  return { ...canvas, nodes: nextNodes };
}
```

**File:** [`src/registry/components/data/flow-canvas-01/index.ts`](../../../src/registry/components/data/flow-canvas-01/index.ts) — add re-export `export { updateNodeData } from "./lib/update-node-data";`

**Locked per Q10 recommendation:** ship the helper with flow-canvas-01@v0.2.1 (alongside the `onEditRequest` API that creates the need). Pairs the helper with the broader convention; future heavy-content adapters reuse it.

### 4.5 `meta.ts` + `registry.json`

- `src/registry/components/data/flow-canvas-01/meta.ts` — `version: "0.2.0" → "0.2.1"`, `updatedAt` to the patch date.
- `registry.json` — `flow-canvas-01` base item gains `lib/update-node-data.ts` as `type: "registry:component"`. Other files unchanged. `pnpm registry:build` regenerates the artifact.

### 4.6 No GATE 3 review

Per the readiness-review rule's patch-bump exemption: `v0.2.0 → v0.2.1` is additive, non-breaking, no public-API-touch-of-existing — patch bumps skip GATE 3. The patch ships under the v0.2.0 GATE 3 spotcheck verdict (Pass with follow-ups) carrying forward.

---

## 5. Workstream B — `rich-card-in-flow@v0.1.0` — file-by-file plan

New sealed folder at `src/registry/components/data/rich-card-in-flow/`. Scaffolded via `pnpm new:component data/rich-card-in-flow` after GATE 2 sign-off, then implementations follow.

### 5.1 Sealed folder shape (target)

```
src/registry/components/data/rich-card-in-flow/
├── rich-card-in-flow.tsx          (~30 LoC barrel-host — re-exports + maybe a wrapper component, TBD impl-time)
├── types.ts                       (~40 LoC — re-exports + RichCardViewerOptions stub for v0.2)
├── index.ts                       (~25 LoC — public barrel)
├── meta.ts                        (per scaffolder + filled-in)
├── parts/
│   ├── rich-card-viewer.tsx       (~120 LoC — the renderer's <div> tree; the actual NodeRenderer object)
│   ├── subcard-block.tsx          (~50 LoC — visual block for one nested subcard + its ports + click handler)
│   └── flat-field-strip.tsx       (~40 LoC — paints first N flat fields, type-aware)
├── lib/
│   ├── enumerate-subcards.ts      (~25 LoC — Object.entries walker; F-04 lock)
│   ├── derive-title.ts            (~15 LoC — title || first string flat field)
│   ├── derive-flat-fields.ts      (~30 LoC — first N flat fields, type-aware)
│   └── format-value.ts            (~40 LoC — number / boolean / date / string formatters)
├── dummy-data.ts                  (~80 LoC — 3-5 fixture nodes with non-trivial RichCardJsonNode trees + ports)
├── demo.tsx                       (~120 LoC — working FlowCanvas + Dialog + RichCard wiring)
└── usage.tsx                      (~80 LoC — consumer-facing docs surface)
```

Total estimated ~700 LoC across 13 files. Comparable shape to `code-block` (42 files for a much more complex component) and `kanban-board-01` (similar registry pattern). Smaller than `rich-card` itself (~51 files at v0.4.1).

### 5.2 `parts/rich-card-viewer.tsx` — the renderer

The exported `NodeRenderer<RichCardJsonNode>`:

```ts
"use client";

import { memo } from "react";
import type { NodeRenderer, RenderContext } from "@/registry/components/data/flow-canvas-01";
import { PortsAt } from "@/registry/components/data/flow-canvas-01";
import { enumerateSubcards } from "../lib/enumerate-subcards";
import { deriveTitle } from "../lib/derive-title";
import { deriveFlatFields } from "../lib/derive-flat-fields";
import { SubcardBlock } from "./subcard-block";
import { FlatFieldStrip } from "./flat-field-strip";
import type { RichCardCanvasNode } from "../types";

// Locked constants (Q6) — v0.2 may open these as RichCardViewerOptions.
const MAX_FLAT_FIELDS = 3;
const MAX_NESTED_OUTLINES = 4;
const NESTED_DEPTH = 1;

function RichCardViewerImpl({
  data,
  ctx,
}: {
  data: RichCardCanvasNode;
  ctx: RenderContext;
}) {
  const title = deriveTitle(data);
  const flatFields = deriveFlatFields(data, MAX_FLAT_FIELDS);
  const subcards = enumerateSubcards(data).slice(0, MAX_NESTED_OUTLINES);
  const ports = data.ports;  // root-level ports — typed via RichCardCanvasNode (F-V6 lock)

  return (
    <div
      role="group"
      aria-label={`Rich card: ${title ?? "Untitled"}`}
      className="relative min-w-60 max-w-90 rounded-md border border-border bg-card text-card-foreground"
    >
      {/* Title strip — click opens root dialog */}
      <button
        type="button"
        onClick={() => ctx.onEditRequest?.()}
        className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm font-semibold border-b border-border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        aria-haspopup="dialog"
      >
        <span className="truncate">{title ?? "Untitled rich-card"}</span>
      </button>

      {/* Flat fields strip */}
      {flatFields.length > 0 && (
        <FlatFieldStrip fields={flatFields} />
      )}

      {/* Subcard blocks (NESTED_DEPTH = 1; deeper levels invisible in v0.1) */}
      {subcards.length > 0 && (
        <div className="space-y-1.5 p-2">
          {subcards.map(({ key, card }) => (
            <SubcardBlock
              key={card.__rcid ?? key}
              cardKey={key}
              card={card}
              onEdit={(rcid) => ctx.onEditRequest?.(rcid)}
            />
          ))}
        </div>
      )}

      {/* Root-level port handles */}
      <PortsAt ports={ports} position="left" />
      <PortsAt ports={ports} position="right" />
      <PortsAt ports={ports} position="top" />
      <PortsAt ports={ports} position="bottom" />
    </div>
  );
}

const RichCardViewer = memo(RichCardViewerImpl);

// F-V6 lock: `NodeRenderer<TData extends NodeData>` requires TData to extend NodeData
// (which requires `__type: string`). RichCardJsonNode alone does NOT satisfy that
// constraint — see §5.7 + §3.5 F-V6. RichCardCanvasNode = NodeData & RichCardJsonNode
// is the type that flows into flow-canvas-01's renderer registry.
export const richCardViewerRenderer: NodeRenderer<RichCardCanvasNode> = {
  type: "rich-card",
  label: "Rich card",
  render: (data, ctx) => <RichCardViewer data={data} ctx={ctx} />,
};
```

**Per F-V1 lock:** the outer element is `<div role="group">`, NOT `<button>`. Inside are multiple `<button>` elements (title strip, each subcard) — nested buttons inside a button is invalid HTML AND fires both onClick handlers. The group-with-buttons shape lets each click route to the right handler cleanly.

### 5.3 `parts/subcard-block.tsx` — nested subcard rendering

```ts
"use client";

import { memo } from "react";
import { cn } from "@/lib/utils";
import { PortsAt } from "@/registry/components/data/flow-canvas-01";
import type { NodeData } from "@/registry/components/data/flow-canvas-01";
import type { RichCardJsonNode } from "@/registry/components/data/rich-card";
import { deriveTitle } from "../lib/derive-title";

function SubcardBlockImpl({
  cardKey,
  card,
  onEdit,
}: {
  cardKey: string;
  card: RichCardJsonNode;
  onEdit: (rcid: string) => void;
}) {
  const rcid = card.__rcid;
  const title = deriveTitle(card) ?? cardKey;
  const ports = (card as NodeData).ports;
  const canFocusThisSubcard = rcid !== undefined;

  // F-03 lock: only fire ctx.onEditRequest(rcid) if __rcid is present.
  // Missing __rcid → click bubbles (no stopPropagation), title-strip handler opens root dialog.
  const handleClick = (e: React.MouseEvent) => {
    if (canFocusThisSubcard) {
      e.stopPropagation();  // F-V1: keep subcard click from bubbling to title strip
      onEdit(rcid!);
    }
    // else: fall through; parent title strip handles → root edit.
  };

  if (!canFocusThisSubcard && process.env.NODE_ENV === "development") {
    // F-03 dev-mode warning. One per render is fine — cheap; helps consumer notice.
    // eslint-disable-next-line no-console
    console.warn(
      `[rich-card-in-flow] Subcard "${cardKey}" has no __rcid — click-to-focus disabled. ` +
      `Pass the canvas data through <RichCard> once or use rich-card's ID-attach helper.`
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      data-selected-subcard={canFocusThisSubcard ? "false" : undefined}  // consumer can style via data attr
      className={cn(
        "relative w-full rounded-sm border border-border/60 bg-muted/30 p-2 text-left",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        canFocusThisSubcard && "hover:border-border hover:bg-muted/50 cursor-pointer",
        !canFocusThisSubcard && "cursor-default",
      )}
      aria-haspopup={canFocusThisSubcard ? "dialog" : undefined}
      aria-label={`Subcard: ${title}`}
    >
      <div className="text-xs font-medium text-muted-foreground">{title}</div>
      {/* Subcard's own ports (F-05 — port-walker handles them transparently) */}
      <PortsAt ports={ports} position="left" />
      <PortsAt ports={ports} position="right" />
      <PortsAt ports={ports} position="top" />
      <PortsAt ports={ports} position="bottom" />
    </button>
  );
}

export const SubcardBlock = memo(SubcardBlockImpl);
```

### 5.4 `lib/enumerate-subcards.ts` — subcard detection (F-04 lock)

```ts
import type { RichCardJsonNode } from "@/registry/components/data/rich-card";

export function enumerateSubcards(
  data: RichCardJsonNode,
): Array<{ key: string; card: RichCardJsonNode }> {
  const out: Array<{ key: string; card: RichCardJsonNode }> = [];

  for (const [key, value] of Object.entries(data)) {
    if (key.startsWith("__rc")) continue;     // skip __rcid / __rcorder / __rcmeta
    if (key === "__type") continue;            // canvas discriminator
    if (key === "ports") continue;             // ports handled by port-walker
    if (!isCardLike(value)) continue;
    out.push({ key, card: value });
  }

  return out;
}

function isCardLike(value: unknown): value is RichCardJsonNode {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const obj = value as Record<string, unknown>;
  // F-04 heuristic: an object value is "card-like" when it has any of the
  // rich-card metadata fields OR carries its own ports[].
  return (
    obj.__rcid !== undefined ||
    obj.__rcorder !== undefined ||
    obj.__rcmeta !== undefined ||
    Array.isArray(obj.ports)
  );
}
```

### 5.5 Other lib files (sketches)

- **`derive-title.ts`** — return `data.title` if string + non-empty; else find the first string flat field by `Object.entries` order; else `undefined`.
- **`derive-flat-fields.ts`** — return `Array<{ key: string; value: unknown; type: "string" | "number" | "boolean" | "date" }>` for the first N keys whose value is a flat scalar (skip `__rc*`, `__type`, `ports`, card-like objects). Type detection: number / boolean primitive; ISO-8601 date detection for strings via regex.
- **`format-value.ts`** — `formatValue(value, type)`: numbers right-aligned (Intl.NumberFormat), booleans as checkmarks, dates as `Intl.DateTimeFormat` short, strings as-is.

### 5.6 `parts/flat-field-strip.tsx` — paints the first N flat fields

Simple component — a `<dl>` (definition list) with `key: value` pairs, type-aware styling. ~40 LoC.

### 5.7 `types.ts` (the procomp's own)

```ts
import type { NodeData } from "@/registry/components/data/flow-canvas-01";
import type { RichCardJsonNode } from "@/registry/components/data/rich-card";

// Public type re-exports for consumer convenience (per Stage 1 §3 "Type re-exports" in-scope)
export type { RichCardJsonNode } from "@/registry/components/data/rich-card";

/**
 * The canvas-node form of a rich-card tree — intersection of `NodeData` (which
 * the renderer registry requires; `__type: string` + optional `ports?: Port[]`)
 * with rich-card's open-shape `RichCardJsonNode` (`__rcid?` / `__rcorder?` /
 * `__rcmeta?` + index signature).
 *
 * Consumers writing typed canvas data should type their rich-card-bearing nodes
 * as `NodeRecord & { data: RichCardCanvasNode }`. The renderer is registered as
 * `NodeRenderer<RichCardCanvasNode>` (see parts/rich-card-viewer.tsx).
 *
 * F-V6 lock — see procomp plan §3.5 + §5.2. Precedent: `customJsonRenderer`'s
 * `type CustomJsonData = NodeData & { _label?: string }` in flow-canvas-01.
 */
export type RichCardCanvasNode = NodeData & RichCardJsonNode;
```

**Note on the dropped v0.2 stub:** the original draft included a `_RichCardViewerOptions_v02_stub` type with a `void {} as ...` suppression. The cast pattern was fragile (operator precedence yields `(void {}) as TYPE` → `undefined as TYPE`, which strict TS rejects). YAGNI applies — the v0.2 options surface lands when v0.2 work begins. Keep this `types.ts` minimal for v0.1.

### 5.8 `index.ts` — public barrel

```ts
export { richCardViewerRenderer } from "./parts/rich-card-viewer";

// Type re-exports for consumers writing typed canvas data
export type { RichCardJsonNode } from "@/registry/components/data/rich-card";
export type { RichCardCanvasNode } from "./types";  // F-V6 lock — canvas-node form

// Optional helper re-export (sourced from flow-canvas-01@v0.2.1's lib;
// re-exported here for ergonomic consumer DX — one import for the whole flow).
export { updateNodeData } from "@/registry/components/data/flow-canvas-01";
```

Note the `updateNodeData` re-export — convenience for consumers who write the rich-card-in-flow dialog wiring (Q10 recommendation: helper homes in flow-canvas-01@v0.2.1; rich-card-in-flow re-exports for ergonomic convenience).

### 5.9 `meta.ts`

```ts
import type { ComponentMeta } from "../../../types";

export const meta: ComponentMeta = {
  slug: "rich-card-in-flow",
  name: "Rich Card in Flow",
  category: "data",
  description:
    "Read-only RichCardViewer renderer for flow-canvas-01 + consumer-owned-dialog pattern for editing rich-card content inside canvas nodes. Canonical implementation of the popup-edit renderer convention from flow-canvas-01@v0.2.0 perf description Q33.",
  context:
    "Use rich-card-in-flow when each flow-canvas-01 node should carry a rich-card tree as its data (agent workflow editor, schema/config canvas, decision/runbook map). The viewer paints a read-only summary (title + first 3 flat fields + nested-card outlines with their own ports + selectability); clicking fires ctx.onEditRequest(subPath?) which the consumer routes to a dialog mounting <RichCard editable> with the same JSON. At most one rich-card editor instance is mounted at any time regardless of node count.",
  features: [
    "RichCardViewer NodeRenderer<RichCardJsonNode> — drop-in for flow-canvas-01's renderer registry",
    "Subcard-level click-to-focus — clicking a nested card pre-focuses the dialog on that subcard via RichCardHandle.focusCard",
    "Subcard ports + selectability — subcards carry their own port handles + visual selection state",
    "Graceful degradation when __rcid is missing — subcard click bubbles to root + dev-mode warning",
    "n8n-style multi-select supported via flow-canvas-01's existing canvas-level marquee + shift-click (bulk-edit-via-dialog deferred to v0.2)",
    "Consumer-owned dialog pattern (no shipped dialog chrome) — documented in procomp guide",
  ],
  tags: [
    "rich-card-in-flow", "flow-canvas-01", "rich-card", "popup-edit",
    "renderer", "json-canvas", "agent-workflow", "config-canvas",
  ],
  version: "0.1.0",
  status: "alpha",
  createdAt: "2026-05-16",
  updatedAt: "2026-05-16",
  author: { name: "ilinxa" },
  dependencies: {
    shadcn: ["dialog"],         // for the consumer-side dialog (demo + docs only — not technically required if consumer brings their own)
    npm: {},                     // no new npm deps
    internal: ["rich-card", "flow-canvas-01"],   // both cross-registry deps
  },
  related: ["flow-canvas-01", "rich-card"],
};
```

### 5.10 `demo.tsx` + `usage.tsx`

- **demo.tsx** — single-page demo: a flow-canvas with 3 rich-card nodes + 1 custom-json node (for renderer-mixed proof). Dialog wires the imperative `RichCardHandle.focusCard(subPath)` per F-02 lock. Click → opens dialog → edits → live-saves via `onChange`. Includes a "Select multiple nodes" hint (marquee select supported per Q3).
- **usage.tsx** — consumer-facing docs surface: how to register the viewer + how to wire the dialog + the subPath pattern + the imperative-ref-vs-prop note.

### 5.11 `dummy-data.ts`

```ts
import type { CanvasData } from "@/registry/components/data/flow-canvas-01";
import type { RichCardJsonNode } from "@/registry/components/data/rich-card";

// 3 rich-card nodes + 1 custom-json node demonstrating the renderer-mixed pattern.
// Each rich-card node carries a non-trivial tree with __rcids pre-attached (so
// subcard-click-to-focus works out of the box per F-03 lock).

export const initialData: CanvasData = {
  version: 1,
  nodes: [
    /* Parent rich-card with 2 subcards, ports at root + each subcard */
    /* ... */
  ],
  edges: [/* connect root → subcard via subcard's port */],
  viewport: { x: 40, y: 40, zoom: 0.9 },
};
```

### 5.12 Registry distribution

`registry.json` — two new items at the end of the `items` array:

```jsonc
{
  "$schema": "https://ui.shadcn.com/schema/registry-item.json",
  "name": "rich-card-in-flow",
  "type": "registry:block",
  "title": "Rich Card in Flow",
  "description": "Read-only RichCardViewer renderer for flow-canvas-01 nodes; consumer-owned-dialog pattern for editing rich-card content inside canvas nodes.",
  "author": "ilinxa",
  "categories": ["data", "flow", "rich-content"],
  "registryDependencies": ["dialog", "@ilinxa/rich-card", "@ilinxa/flow-canvas-01"],
  "dependencies": [],
  "files": [
    /* every shipped .tsx/.ts file in the sealed folder, target: "components/rich-card-in-flow/<sub-path>" */
    /* registry:component for .ts/.tsx; NO .css in this procomp */
  ]
},
{
  "$schema": "https://ui.shadcn.com/schema/registry-item.json",
  "name": "rich-card-in-flow-fixtures",
  "type": "registry:block",
  "title": "Rich Card in Flow — fixtures",
  "description": "Rich Card in Flow bundle including the dummy-data fixtures used by the docs-site demo.",
  "author": "ilinxa",
  "categories": ["data", "flow", "rich-content", "fixtures"],
  "registryDependencies": ["@ilinxa/rich-card-in-flow"],
  "files": [
    { "path": "src/registry/components/data/rich-card-in-flow/dummy-data.ts", "type": "registry:component", "target": "components/rich-card-in-flow/dummy-data.ts" }
  ]
}
```

### 5.13 `manifest.ts` registration

3-line edit to [`src/registry/manifest.ts`](../../../src/registry/manifest.ts) — the scaffolder prints the exact lines after `pnpm new:component data/rich-card-in-flow`.

---

## 6. Sequencing

Two workstreams; A unblocks B. Commits stay small and reviewable.

1. **Workstream A — Commit A1:** flow-canvas-01@v0.2.1 — types.ts + canvas-context.tsx + node-adapter.tsx + lib/update-node-data.ts (new). `pnpm tsc --noEmit && pnpm lint && pnpm validate:meta-deps` clean before commit.
2. **Workstream A — Commit A2:** flow-canvas-01@v0.2.1 — meta.ts bump + registry.json update (lib/update-node-data.ts as `registry:component`) + `pnpm registry:build` regenerated artifacts. Spot-check the regenerated `public/r/flow-canvas-01.json` carries the new file.
3. **Workstream A — Commit A3:** flow-canvas-01@v0.2.1 — STATUS.md `Last updated` lead update + decision file at `.claude/decisions/<date>-flow-canvas-v0.2.1-on-edit-request.md` + `docs/component-versions.md` row + Highlights bullet. No GATE 3 review (patch-bump exemption).
4. **Workstream A — push to origin** (3 commits land together; Vercel auto-deploys; `@ilinxa/flow-canvas-01@v0.2.1` becomes available to consumers).
5. **Workstream B — pnpm new:component data/rich-card-in-flow** — scaffold the sealed folder.
6. **Workstream B — Commit B1:** implement parts/ + lib/ files (rich-card-viewer.tsx, subcard-block.tsx, flat-field-strip.tsx, enumerate-subcards.ts, derive-title.ts, derive-flat-fields.ts, format-value.ts).
7. **Workstream B — Commit B2:** types.ts + index.ts + meta.ts + the 3-line manifest.ts registration.
8. **Workstream B — Commit B3:** dummy-data.ts + demo.tsx + usage.tsx — verify docs render at `/components/rich-card-in-flow`.
9. **Workstream B — Commit B4:** registry.json — add both items (base + fixtures) + `pnpm registry:build` regen.
10. **Workstream B — Run F-V2 smoke harness path-b** (required per readiness-review rule for v0.1.0 first ships). Smoke against locally-served `public/r/rich-card-in-flow.json`; consumer-side `pnpm tsc --noEmit` clean post-install. Fix any consumer-side findings as additional commits.
11. **Workstream B — Author Stage 3 procomp guide** (`rich-card-in-flow-procomp-guide.md`) — same time as B3 typically, but can land in a separate B5 commit.
12. **Workstream B — GATE 3 spot-check review** at `docs/procomps/rich-card-in-flow-procomp/reviews/<date>-v0.1.0-spotcheck.md`. **Rotating dimension: Public API** (subPath signature, viewer composition, the imperative-ref pattern in the consumer wiring all qualify as load-bearing API axes; verdict must be `Pass` or `Pass with follow-ups`).
13. **Workstream B — Commit B5:** STATUS.md update + `.claude/decisions/<date>-rich-card-in-flow-v0.1.0-first-ship.md`. Push to origin.

**Each commit's verification:** `pnpm tsc --noEmit && pnpm lint && pnpm validate:meta-deps` clean.

**Estimated wall-clock (no measurement-driven blocks here, unlike flow-canvas-01 perf):** Workstream A ~1–2 hours. Workstream B ~4–6 hours including smoke + spot-check + decision file. Both workstreams in one session is plausible if uninterrupted.

---

## 7. Public API matrix (cumulative across both workstreams)

### Workstream A — `flow-canvas-01@v0.2.1`

| Surface | v0.2.0 | v0.2.1 | Migration |
|---|---|---|---|
| `RenderContext.onEditRequest` | n/a | optional `(subPath?: string) => void`, bound to current nodeId | None — additive, ignored if not used |
| `FlowCanvasProps.onEditRequest` | n/a | optional `(nodeId: string, subPath?: string) => void` | None — additive, `undefined` default |
| `updateNodeData(canvas, nodeId, nextData): CanvasData` | n/a | new exported helper | None — new utility |
| Existing types + props | unchanged | unchanged | none |

**Net for v0.2.1:** three additive surfaces, zero defaults changed, zero behavior changes for consumers who don't wire `onEditRequest`.

### Workstream B — `rich-card-in-flow@v0.1.0`

| Surface | v0.1.0 |
|---|---|
| `richCardViewerRenderer: NodeRenderer<RichCardJsonNode>` | new named export — drop-in for flow-canvas-01's `renderers` prop |
| `RichCardJsonNode` (re-export from rich-card) | convenience re-export |
| `updateNodeData` (re-export from flow-canvas-01@v0.2.1) | convenience re-export |
| Consumer dialog pattern | documented in procomp guide §X (NOT shipped as a component) |

---

## 8. Edge cases

- **Renderer without a clicked subcard** (root-only click): `ctx.onEditRequest?.()` fires with no subPath; dialog opens at root.
- **Subcard with `__rcid` clicked**: `ctx.onEditRequest?.(rcid)` fires; dialog opens; `useEffect` triggers `focusCard(rcid)`.
- **Subcard WITHOUT `__rcid` clicked** (F-03): click bubbles to title strip; root-edit fires.
- **Consumer's onEditRequest is `undefined`**: `ctx.onEditRequest` is `undefined` (per §4.2 ternary); renderer checks before firing → silent no-op; title strip + subcard buttons still focusable but Enter / Space / click does nothing.
- **Dialog closes mid-edit**: closing the dialog discards focus but NOT the data (Q2 — live save; edits already in canvas state).
- **Two consumers register the viewer with `type: "rich-card"`**: last-wins per flow-canvas-01's renderer registry; dev warning fires.
- **A subcard's port has the same ID as a root port**: violates flow-canvas-01's port-uniqueness rule (Q9 of v0.1 description); `findPortInTree` returns the first match (root); silent edge mis-routing. **Mitigation: dev-mode warning on viewer mount** when duplicate port IDs detected (cheap one-pass scan).
- **`RichCardJsonNode` with no recognizable fields** (e.g. only `__rcid`): viewer shows the F-07 neutral placeholder "Untitled rich-card" + click bubbles to root edit; no subcards / no flat fields / no port handles render (since `data.ports` is undefined).
- **Multi-select with 5 rich-card nodes, then click one to edit**: `onEditRequest(clickedNodeId)` fires for ONE nodeId; other 4 stay selected for bulk move/delete/duplicate (Q3 lock).
- **Drag a rich-card node**: xyflow's drag handler suppresses the mouseup-click that would fire `onEditRequest`. No dialog open on drag-end.
- **Consumer wires two parallel dialogs** (anti-pattern; warned in guide): two rich-card editors mount; performance degrades (multi-instance editor cost); functional correctness preserved (each dialog edits its own node).

---

## 9. Risks (this plan's scope; description's full risk list at Stage 1 §10)

- **F-V1 nested-button trap evaded by careful composition.** If a future contributor refactors `RichCardViewer` to wrap the whole thing in `<button>`, the nested-button violation returns + clicks fire double. Mitigation: comment in `rich-card-viewer.tsx` lock the `<div role="group">` outer pattern; spot-check review covers it.
- **F-04 `isCardLike` heuristic over-triggers on non-card objects.** A consumer-defined RichCardJsonNode might have non-card object values that incidentally carry `ports` or `__rcorder`. The viewer would render them as subcard blocks. Mitigation: the heuristic is conservative (requires AT LEAST ONE rich-card meta field OR `ports`); v0.2 tightens via a canonical predicate from rich-card if it ships one. Doc this in the procomp guide so consumers know the rule.
- **F-V2 smoke harness path-b surfaces real consumer-side bugs** (per the json-form v0.1.4 precedent). Mitigation: the smoke MUST run before push. If 1–4 findings surface (matches json-form's f-cross-11 pattern), fix as additional commits before push; if >5 findings surface, halt and discuss whether the procomp's shape needs revision.
- **rich-card v0.4.x to v0.5 migration during this work.** Unlikely (rich-card is at v0.4.1 beta, stable for now), but if rich-card minors during the rich-card-in-flow build, the `RichCardJsonNode` shape OR `RichCardHandle.focusCard` API could shift. Mitigation: pin rich-card version in `dependencies.internal` requirement (`^0.4.0` per the description's Q9 lock); CI smoke catches regressions.
- **Imperative `focusCard(id)` via ref ergonomics (F-02 follow-up).** Consumers may find the `useRef + useEffect` pattern awkward vs a hypothetical prop. Mitigation: the procomp guide ships the canonical wiring as a copy-pasteable example. If three consumers express friction, file a PR against rich-card to add an `initialFocusCardId?: string` prop in rich-card v0.5.
- **Subcard ports collision risk** (edge case above). Mitigation: dev-mode warning; doc the rule in usage.tsx + procomp guide; production warning silent (no behavior change).
- **Demo carries `Dialog` from shadcn — first procomp to use shadcn `dialog` in a sandbox-style demo (vs the docs-site demo).** Make sure `pnpm dlx shadcn add dialog` was run earlier in the project (it has been — `dialog` is in `code-block`'s `meta.shadcn`).
- **Procomp guide authoring time.** Estimate 2–3 hours to write a thorough Stage 3 guide. If time-boxed, ship a minimal guide v0.1 (architecture + dialog pattern + renderer-author rule) and iterate to v0.1.x as polish.
- **G1 position-relative chain regression** (added 2026-05-16) — see F-05 lock above. If `relative` is removed from any DOM tree level (NodeShell, RichCardViewer outer, SubcardBlock), subcard handles silently fly to a wrong positioned ancestor. Mitigation: explicit code comments at each level + the GATE 3 spot-check's rotating dim (Public API) should target visual port positioning at the subcard level.
- **G3 rapid open/close per-mount cost** (added 2026-05-16) — `key={editingNodeId}` forces `<RichCard>` remount on every node-click. Plate re-initializes (TTI cost) each open. Users clicking through 5 nodes in quick succession experience perceptible delay. Mitigation: this is the price of the "at most one editor instance mounted" property — alternative (persistent editor + imperative tree-switching) would require a `RichCardHandle.setTree(tree)` API that doesn't exist in rich-card v0.4.1. Document in the procomp guide; v0.2 perf polish path: file a rich-card v0.5 PR for `setTree` if rapid-switching surfaces as a real consumer pain.
- **G4 Radix Dialog `forceMount` defeats the single-instance property** (added 2026-05-16) — the "at most one rich-card editor mounted" claim holds because shadcn's `<Dialog>` (Radix) unmounts content when `open=false`. A consumer wrapping with `<Dialog.Portal forceMount>` keeps content (and thus `<RichCard>`) mounted always → defeats the perf property. Mitigation: document `forceMount` as a consumer footgun in the procomp guide; not enforceable in code (consumer's dialog, consumer's choice).

---

## 10. Plan-stage TODOs (impl-time items + F-V findings + minor reminders)

- **Impl-time** (F-V2 lock) — smoke harness path-b MUST run before push for rich-card-in-flow@v0.1.0. Use the harness at `e:/tmp/ilinxa-smoke-consumer/` (per project_smoke_harness memory). Run against locally-served `public/r/rich-card-in-flow.json`; consumer-side `pnpm tsc --noEmit` clean post-install is the bar.
- **Impl-time** (F-V3 lock) — `dependencies.internal: ["rich-card", "flow-canvas-01"]` in `meta.ts`; verify `validate:meta-deps` accepts both. The `flow-canvas-01` dep is for the relative TS imports (`@/registry/components/data/flow-canvas-01`); the script's "internal-registry slug" detector should recognize it via the existing pattern.
- **Impl-time** — when scaffolding the procomp, do NOT re-export `enumerate-subcards.ts` / `derive-*.ts` / `format-value.ts` from `index.ts`. They're internal helpers; only the renderer + type re-exports + helper re-exports go in the barrel. **Why kept private (F-rev-3 lock):** `enumerateSubcards`'s signature depends on the `isCardLike` heuristic (F-04), which is explicitly marked for tightening in v0.2 if rich-card ships a canonical "is-card" predicate. Exporting now then changing the signature later = breaking change for consumers writing custom rich-card renderers on top of this procomp. **Revisit trigger:** v0.2 when (a) the configurable options surface lands AND (b) the `isCardLike` predicate stabilizes, OR a real consumer asks for it.
- **Impl-time** (F-V6 lock) — the renderer is typed `NodeRenderer<RichCardCanvasNode>` where `RichCardCanvasNode = NodeData & RichCardJsonNode` (defined in `types.ts` per §5.7). Re-exported from `index.ts` so consumers can type `CanvasData.nodes[].data` correctly. The renderer body reads `data.ports` directly (no `(data as NodeData)` cast). Subcards stay typed as `RichCardJsonNode` and use the existing `(card as NodeData).ports` cast at the subcard boundary.
- **Impl-time** — when authoring `demo.tsx`, the imperative `focusCard` wiring example matters — it's the single most important thing for consumers. Include comments noting "this is the locked F-02 pattern; see plan + procomp guide for why."
- **Impl-time** — Stage 3 procomp guide (`rich-card-in-flow-procomp-guide.md`) sections to include: 1. Architecture, 2. Quick start (consumer wiring), 3. The dialog pattern (canonical example), 4. subPath model (`__rcid`-based), 5. Multi-select support (Q3 lock note), 6. Subcard limits (NESTED_DEPTH=1; MAX_FLAT_FIELDS=3), 7. Footguns (nested-button trap, port-uniqueness, missing-__rcid behavior), 8. Migration (none for v0.1; for v0.2 the configurable-knobs path).
- **Impl-time** — when authoring the `updateNodeData` helper, type it strictly: `nextData: NodeData` (not `RichCardJsonNode`) — the helper is generic across all renderer types, not rich-card-specific. The procomp guide's example casts at the call site (`updateNodeData(prev, editingNodeId, next as NodeData)`).
- **Impl-time** — the flow-canvas-01@v0.2.1 patch's `decision file` should reference the rich-card-in-flow procomp as the convention's canonical consumer (so future readers can trace why the API was added).
- **Decided at GATE 2; impl-time verify** — Q10 helper home is `flow-canvas-01@v0.2.1` (Q10 recommendation accepted by Workstream A inclusion). The rich-card-in-flow `index.ts` re-exports for ergonomic convenience.

---

## 11. Definition of done (this v0.1.0 plan)

The plan is "done" — i.e., both Workstreams implemented + GATE 3 review passed — when ALL of the following hold:

1. **Workstream A** — flow-canvas-01@v0.2.1 patch shipped (3 commits A1/A2/A3 + push). `meta.ts` at `0.2.1`. `public/r/flow-canvas-01.json` carries `lib/update-node-data.ts`. `flow-canvas-01@v0.2.1` is consumable via `pnpm dlx shadcn add @ilinxa/flow-canvas-01` post-Vercel-deploy.
2. **Workstream B file edits** — all files in §5.1 implemented per the per-section specs.
3. **§3 F-01 / F-02 / F-03 / F-04 / F-05 / F-06 / F-07 locks honored** in code (verifiable via spot-check review).
4. **F-V1 nested-button avoided** — `RichCardViewer` outer element is `<div role="group">`; per-subcard `<button>`; title strip `<button>`. NOT a button-of-buttons.
5. **F-V2 smoke harness path-b** runs clean: `pnpm dlx shadcn add @ilinxa/rich-card-in-flow` succeeds; consumer-side `pnpm tsc --noEmit` clean post-install.
5a. **F-V6 renderer typing honored** — `types.ts` defines `export type RichCardCanvasNode = NodeData & RichCardJsonNode`; `index.ts` re-exports it; the renderer is `NodeRenderer<RichCardCanvasNode>`; `data.ports` is accessed directly (no `(data as NodeData)` cast inside the renderer body).
6. **`meta.ts` declares** `version: "0.1.0"`, `status: "alpha"`, `dependencies.internal: ["rich-card", "flow-canvas-01"]`.
7. **`registry.json` includes** both `rich-card-in-flow` (base) and `rich-card-in-flow-fixtures` items.
8. **`pnpm tsc --noEmit && pnpm lint && pnpm validate:meta-deps` clean** (43/43 once this ships — flow-canvas-01@v0.2.1's `update-node-data.ts` doesn't trigger a count change).
9. **`pnpm build`** succeeds with the new component routes generated.
10. **Spot-check review** at `reviews/<date>-v0.1.0-spotcheck.md` — rotating dim: **Public API** (subPath signature, viewer composition, imperative-ref pattern). Verdict ≥ `Pass with follow-ups`.
11. **Stage 3 procomp guide** authored with the 8 sections in §10 Impl-time.
12. **STATUS.md updated; decision files authored** for both Workstreams (separate files — A and B are distinct ships).
13. **Push to master** for both Workstreams (Vercel auto-deploys both).

After sign-off of THIS plan doc (GATE 2), no scaffolding-time second-guessing — implementation follows the plan, deviations are loud and documented.

---

## Appendix A — what this plan deliberately does NOT cover

- **Configurable viewer options** (`RichCardViewerOptions`) — Q6 lock; v0.2 scope. v0.1 stub-types only; no factory function, no `richCardViewer(options)` API.
- **Bulk-EDIT across multi-select** — Q3 deferral; v0.2 scope.
- **Quick-edit inline gesture** (edit title without opening dialog) — Q3 deferral; v0.3 scope.
- **Server-driven streaming canvas** — Q3 deferral; v0.3+ scope.
- **`<RichCard>` permissions / validators / undo passthrough from the demo's default wiring** — consumers can pass these props through but the v0.1 demo doesn't exercise them.
- **shadcn `Drawer` or `Sheet` as alternative dialog chrome** — the procomp guide shows `<Dialog>`; consumers picking different chrome is supported but not exemplified.
- **A future `plate-editor-in-flow` or `code-block-in-flow` sibling procomp** — uses the same convention but each gets its own description + plan.
- **Sub-object drag-extract of subcards** (G5 fold-in, 2026-05-16) — flow-canvas-01 has a v0.1 feature (`data-draggable-subobject={path}` + `emitSubObjectDrag` helper) that lets users drag a sub-piece OUT of a node to spawn it as a new flow-canvas node. **v0.1 subcards are NOT drag-extractable** — subcards are part of one rich-card tree per Q1's content-edit-routes-through-popup lock; extracting them would mean splitting the tree across multiple flow-canvas nodes, which Q1 explicitly rejected. Consumer expecting flow-canvas-01's familiar drag-extract pattern on a rich-card subcard will find it doesn't work. Document this gap in the procomp guide. **v0.2 candidate** if a consumer signals — would need a careful UX shape (split-tree vs copy-tree-content-as-new-node) that doesn't violate the single-tree contract.

---

## Appendix B — Cross-references

- Stage 1 description: [rich-card-in-flow-procomp-description.md](rich-card-in-flow-procomp-description.md) (signed off 2026-05-16; commit `4a9b5a3`)
- flow-canvas-01 v0.2.0 plan: [`../flow-canvas-01-procomp/flow-canvas-01-v0.2.0-procomp-plan.md`](../flow-canvas-01-procomp/flow-canvas-01-v0.2.0-procomp-plan.md) (signed off 2026-05-16)
- flow-canvas-01 v0.2.0 perf description: [`../flow-canvas-01-procomp/flow-canvas-01-v0.2.0-perf-description.md`](../flow-canvas-01-procomp/flow-canvas-01-v0.2.0-perf-description.md) (Q33 = popup-edit convention; Q35 = parallel-track confirmation)
- flow-canvas-01 v0.2.0 spot-check review: [`../flow-canvas-01-procomp/reviews/2026-05-16-v0.2.0-spotcheck.md`](../flow-canvas-01-procomp/reviews/2026-05-16-v0.2.0-spotcheck.md)
- rich-card description: [`../rich-card-procomp/rich-card-procomp-description.md`](../rich-card-procomp/rich-card-procomp-description.md)
- rich-card source: [`../../../src/registry/components/data/rich-card/`](../../../src/registry/components/data/rich-card/) (v0.4.1 beta — verified)
- flow-canvas-01 source: [`../../../src/registry/components/data/flow-canvas-01/`](../../../src/registry/components/data/flow-canvas-01/) (v0.2.0 — verified)
- port-walker: [`../../../src/registry/components/data/flow-canvas-01/lib/port-walker.ts`](../../../src/registry/components/data/flow-canvas-01/lib/port-walker.ts) (F-05 confirmation)
- Readiness-review rule: [`../../../.claude/rules/component-readiness-review.md`](../../../.claude/rules/component-readiness-review.md)
- Project decisions log: [`../../../.claude/decisions/`](../../../.claude/decisions/)
