# `rich-card-in-flow` — Stage 3 Consumer Guide

> **Stage:** 3 of 3 · **Version:** v0.1.0-alpha · **Authored:** 2026-05-16
> **Slug:** `@ilinxa/rich-card-in-flow` · **Category:** `data`
> **Companions:** `@ilinxa/flow-canvas-01@^0.2.1` (host) · `@ilinxa/rich-card@^0.4.0` (editor)
> **Stage 1 description:** [rich-card-in-flow-procomp-description.md](rich-card-in-flow-procomp-description.md) (signed off 2026-05-16, commit `4a9b5a3`)
> **Stage 2 plan:** [rich-card-in-flow-procomp-plan.md](rich-card-in-flow-procomp-plan.md) (signed off 2026-05-16, commit `f3108f5`)
> **GATE 3 spot-check:** [reviews/2026-05-16-v0.1.0-spotcheck.md](reviews/2026-05-16-v0.1.0-spotcheck.md)

---

## 1. Architecture

Three roles, **at most one** rich-card editor instance mounted at any moment, regardless of node count:

```
┌─────────────────────────────────────────────────────────────────────┐
│ flow-canvas-01 host                                                 │
│                                                                     │
│  RichCardViewer × N      ← read-only renderers; paint title +       │
│   (this procomp)         ← first 3 flat fields + 4 subcard outlines │
│                          ← with their own ports + 4 root ports      │
│         │                                                           │
│         │ onClick                                                   │
│         ▼ ctx.onEditRequest(subPath?)                               │
└─────────┼───────────────────────────────────────────────────────────┘
          │ FlowCanvasProps.onEditRequest(nodeId, subPath?)
          ▼
  ┌──────────────────────────────────────────────────────────────┐
  │ Consumer-owned <Dialog>      (NOT shipped by this procomp)   │
  │                                                              │
  │   <RichCard editable                                         │
  │      ref={richCardRef}                                       │
  │      defaultValue={nodeData}     ← same JSON node            │
  │      onChange={(next) =>         ← consumer wires            │
  │        setCanvas(updateNodeData(canvas, nodeId, next))       │
  │      }                                                       │
  │   />                                                         │
  │                                                              │
  │   useEffect(() => {                                          │
  │     if (subPath) richCardRef.current?.focusCard(subPath);    │
  │   }, [subPath, nodeId]);   ← F-02 lock                       │
  └──────────────────────────────────────────────────────────────┘

  Data contract: shared RichCardJsonNode shape.
  NO transformation between canvas storage and editor storage —
  the same object is what the renderer paints AND what the editor edits.
```

**Three properties:**

1. **At most ONE rich-card instance is mounted** at any moment. Closed dialog → zero instances. Canvas at N=1000 nodes → still zero instances unless someone clicks one.
2. **The renderer is content-agnostic about editability.** Whether you wire a real dialog or no dialog at all is your decision. The viewer always paints the same read-only summary.
3. **flow-canvas-01 stays rich-card-unaware.** The host knows `onEditRequest(nodeId, subPath?)` exists; it does NOT know anything about `RichCardJsonNode` or how your dialog handles it.

---

## 2. Quick start

Install:

```bash
pnpm dlx shadcn@latest add @ilinxa/rich-card-in-flow
```

This pulls the procomp source + the cross-registry deps `@ilinxa/flow-canvas-01` (v0.2.1+) and `@ilinxa/rich-card` (v0.4.0+). Optionally also install the fixtures sibling for a working demo dataset:

```bash
pnpm dlx shadcn@latest add @ilinxa/rich-card-in-flow-fixtures
```

Minimum viable wiring (read-only viewer, no editing):

```tsx
"use client";

import { FlowCanvas } from "@ilinxa/flow-canvas-01";
import { richCardViewerRenderer } from "@ilinxa/rich-card-in-flow";

const RENDERERS = [richCardViewerRenderer]; // module-scope is critical

export function ReadOnlyCanvas({ data }) {
  return <FlowCanvas data={data} renderers={RENDERERS} />;
}
```

Without wiring `onEditRequest`, the renderer paints normally, the title-strip button is rendered with `disabled` + no `aria-haspopup`, and clicks do nothing. No dead affordances.

---

## 3. The dialog pattern — full canonical wiring

```tsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FlowCanvas, updateNodeData } from "@ilinxa/flow-canvas-01";
import { RichCard, type RichCardHandle, type RichCardJsonNode } from "@ilinxa/rich-card";
import { richCardViewerRenderer } from "@ilinxa/rich-card-in-flow";

const RENDERERS = [richCardViewerRenderer];

export function AgentWorkflowCanvas() {
  const [canvas, setCanvas] = useState(initialData);
  const [editing, setEditing] = useState<
    { nodeId: string; subPath?: string } | null
  >(null);
  const richCardRef = useRef<RichCardHandle>(null);

  // Stable defaultValue per open — derive once per nodeId change.
  const editingTree = useMemo<RichCardJsonNode | null>(() => {
    if (!editing) return null;
    const node = canvas.nodes.find((n) => n.id === editing.nodeId);
    return (node?.data as RichCardJsonNode | undefined) ?? null;
  }, [editing?.nodeId]);

  // F-02 lock: imperative focus once the editor mounts.
  useEffect(() => {
    if (!editing?.subPath) return;
    richCardRef.current?.focusCard(editing.subPath);
  }, [editing?.subPath, editing?.nodeId]);

  return (
    <>
      <FlowCanvas
        data={canvas}
        onChange={setCanvas}
        renderers={RENDERERS}
        onEditRequest={(nodeId, subPath) => setEditing({ nodeId, subPath })}
      />

      <Dialog
        open={editing !== null}
        onOpenChange={(open) => !open && setEditing(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit rich card</DialogTitle>
            <DialogDescription>Live-saves into the canvas.</DialogDescription>
          </DialogHeader>

          {editing && editingTree && (
            <RichCard
              key={editing.nodeId}              /* clean remount */
              ref={richCardRef}
              defaultValue={editingTree}
              editable={true}
              onChange={(next) =>
                setCanvas((prev) =>
                  updateNodeData(prev, editing.nodeId, {
                    ...(prev.nodes.find((n) => n.id === editing.nodeId)?.data ?? {}),
                    ...next,
                  } as RichCardJsonNode & { __type: string })
                )
              }
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
```

**Why the spread in `onChange`?** RichCard returns a `RichCardJsonNode`; the canvas node's `data` is `RichCardCanvasNode = NodeData & RichCardJsonNode` (F-V6 lock). The spread preserves `__type` and `ports` from the prior data shape so flow-canvas-01's renderer registry + connection routing keep working after the edit.

**Why `key={editing.nodeId}`?** Forces RichCard to remount cleanly when switching between nodes. Plate re-initializes per open — there's a perceptible delay if you click through many nodes in rapid succession. Trade-off: simplicity vs. a `setTree(tree)` rich-card API that doesn't exist today. v0.2 polish path if a real consumer signals pain.

---

## 4. The `subPath` model — subcard-level edit targeting

`subPath` is rich-card's `__rcid` (canonical card identifier — UUID-shaped, auto-attached by `<RichCard>` on parse). The renderer reads `subcard.__rcid` from the clicked subcard and fires `ctx.onEditRequest?.(rcid)`. The host bubbles to `FlowCanvasProps.onEditRequest?.(nodeId, rcid)` verbatim. Your dialog receives the `rcid` and routes it to `RichCardHandle.focusCard(rcid)`.

**F-02 lock — `RichCard` has no `initialFocusCardId` prop.** Pre-focusing a specific subcard goes through the imperative `RichCardHandle.focusCard(id)` method via ref. The `useRef + useEffect` pattern in §3 is the only path today. A v0.2 PR against rich-card may add a prop if three consumers signal friction — file an issue with use-case context.

**Click on the title-strip area** (or anywhere outside subcards on the renderer body) fires `ctx.onEditRequest?.()` with NO subPath. The dialog opens at root.

**Click on a subcard with `__rcid` defined** fires `ctx.onEditRequest?.(rcid)`. The dialog opens + focuses that subcard.

**Click on a subcard WITHOUT `__rcid`** (F-03 graceful degradation) — click bubbles to the title strip (no `e.stopPropagation()` on the missing-rcid path); root edit fires. Dev mode logs:

```
[rich-card-in-flow] Subcard "<key>" has no __rcid — click-to-focus disabled.
Pass the canvas data through <RichCard> once or use rich-card's ID-attach helper.
```

Fix the missing IDs by passing the canvas data through `<RichCard>` once at boot (it auto-attaches), or by calling rich-card's ID-attach helper directly.

---

## 5. Multi-select on the canvas

n8n-style multi-select works out of the box — marquee select + shift-click are flow-canvas-01 host features (already shipped at v0.1.x). With multiple nodes selected:

- Clicking a node fires the edit request for THAT clicked node only (single-edit gesture).
- The other selected nodes stay selected for canvas-level operations: move, delete, duplicate, copy-paste — all unaffected.
- **Bulk EDIT (single op applied across selected nodes via the dialog) is deferred to v0.2.** Per Q3 lock — needs a real consumer signal on which fields are bulk-editable + a UX shape that doesn't violate rich-card's single-tree contract.

---

## 6. v0.1 viewer limits + extension knobs

The viewer paints a fixed summary shape — title + first 3 flat fields + up to 4 nested subcard outlines + 4 root-level port handles. v0.1 doesn't expose configurable knobs; the constants are locked at:

| Knob | Value | Where |
|---|---|---|
| `MAX_FLAT_FIELDS` | 3 | `parts/rich-card-viewer.tsx` |
| `MAX_NESTED_OUTLINES` | 4 | `parts/rich-card-viewer.tsx` |
| `NESTED_DEPTH` | 1 | implicit — viewer doesn't recurse |
| `editTrigger` | `"click"` | implicit — single click |
| Title fallback | `data.title` → first non-reserved string flat field → `"Untitled rich-card"` | `lib/derive-title.ts` |

**Custom paint** — if you need a fully different shape, register your own `NodeRenderer<RichCardCanvasNode>` instead of the default. The data contract (root + subcards each addressable by `__rcid`; subcards keep their own `ports[]`) is the only thing the dialog wiring depends on.

**v0.2 configurable options** — `RichCardViewerOptions` factory is the planned path: `richCardViewer(options): NodeRenderer<RichCardCanvasNode>` with `maxFlatFields`, `maxNestedOutlines`, `nestedDepth`, `titleField`, `fieldKeys`, `editTrigger?: "click" | "doubleClick"`. Lands when (a) two consumers diverge from the defaults OR (b) the `isCardLike` heuristic stabilizes (see §7 contributor notes).

---

## 7. Footguns

### 7.1 Nested-button trap

`<RichCardViewer>`'s outer element is `<div role="group">`, NOT `<button>`. Inside are multiple `<button>` elements — title strip + each subcard. **A button-of-buttons is invalid HTML AND fires both onClick handlers** (the inner click bubbles to the outer click). The group-with-buttons composition routes each click to the right handler cleanly.

If you fork or replace the viewer, do NOT wrap the whole renderer in a single `<button>`. F-V1 lock.

### 7.2 `position: relative` chain is load-bearing

xyflow's `<Handle>` is `position: absolute` — it anchors to the **nearest positioned ancestor**. For subcard handles to render at the subcard's screen location (not at the outer node's edges), every DOM level MUST be `position: relative`:

```
.react-flow__node                  ← xyflow makes this positioned
  └─ NodeShell <div>               ← position: relative (flow-canvas-01)
     └─ RichCardViewer outer <div> ← position: relative (this procomp)
        └─ SubcardBlock <button>   ← position: relative (this procomp)
           └─ <Handle> × 4 sides   ← position: absolute, anchors here
```

If you fork the viewer and drop `relative` from any level, subcard handles silently fly to a wrong positioned ancestor. **No console warning. No test catches it.** G1 + F-05 lock. Comments in the source mark each level — preserve them in code reviews.

### 7.3 Port IDs must be unique within the node

Including across subcards. flow-canvas-01's `findPortInTree` returns the **first** match for a given port ID — duplicates silently mis-route edges. Dev mode logs a warning when a duplicate is detected on viewer mount.

### 7.4 Don't use Radix `<Dialog.Portal forceMount>`

It defeats the "at most one editor mounted" property. shadcn's default `<Dialog>` unmounts content on close, which is what makes the perf claim hold. If you wrap with `forceMount`, `<RichCard>` stays mounted always → Plate state machine + DnD provider + reducer all stay live, even with the dialog closed.

### 7.5 Subcards are NOT drag-extractable in v0.1

flow-canvas-01 ships a `data-draggable-subobject={path}` pattern that lets users drag a sub-piece OUT of a node to spawn it as a new canvas node. **Subcards in v0.1 don't support this** — they're part of one rich-card tree per Q1 lock; extracting them would mean splitting the tree across multiple flow-canvas nodes. v0.2 candidate if a consumer asks (needs a careful UX: split-tree vs copy-tree-content-as-new-node).

### 7.6 `__rcid` must be on every subcard you want focusable

See §4 — F-03 graceful degradation handles the missing case but disables click-to-focus for that subcard. Fix at the data layer: pass canvas data through `<RichCard>` once at boot, or call rich-card's ID-attach helper directly.

---

## 8. Migration

**v0.1.0 first ship** — no migration path. You're either on v0.1.0 or you're not.

**Toward v0.2** — `RichCardViewerOptions` will land as additive (the bare `richCardViewerRenderer` continues to work). Switch to `richCardViewer(options)` when you need configurable knobs. No breaking changes planned.

**`flow-canvas-01` version requirement** — `^0.2.1` (the `onEditRequest` API). If you're on v0.2.0 or earlier, you need to bump flow-canvas-01 first; v0.2.1 is non-breaking from v0.2.0.

**`rich-card` version requirement** — `^0.4.0`. rich-card is currently at v0.4.1 beta; the requirement is already satisfied for any consumer up to date with the registry.

---

## 9. Contributor notes (maintenance footguns for the procomp itself)

This section is for **maintainers of rich-card-in-flow**, not consumers. If you're consuming the procomp, you can stop reading.

### 9.1 F-S1 lock — cross-procomp imports use RELATIVE paths

shadcn 4.6.0's path rewriter has two bugs that hit this procomp:

1. **Cross-procomp `index.ts` re-exports get mangled** — observed wrong rewrites:
   - `@/registry/components/data/rich-card/types` → `@/components/data/rich-card/types` (kept stray `data/`)
   - `@/registry/components/data/flow-canvas-01/lib/update-node-data` → `@/lib/update-node-data` (stripped most of the path)

   **Fix:** DON'T re-export cross-procomp symbols from `rich-card-in-flow/index.ts`. Consumers import directly from each procomp's barrel.

2. **Same-category `<other-slug>/types` imports get the slug substituted** — observed wrong rewrite:
   - From `parts/rich-card-viewer.tsx`: `@/registry/components/data/flow-canvas-01/types` → `@/components/rich-card-in-flow/types` (substituted the CURRENT slug for the target slug)

   **Fix:** use RELATIVE paths for all cross-procomp imports. The producer→consumer tree preserves sibling-procomp relationships at the same depth, so `../flow-canvas-01/types` from `rich-card-in-flow/types.ts` (producer or consumer) resolves correctly in both.

If you fork this procomp into another category (e.g. `forms/`), you can probably switch back to alias imports for the cross-procomp paths — Bug 2 didn't reproduce when the producer-side categories differed (json-form is at `forms/` + imports `data/article-body-01` cleanly). Smoke-test before relying on this.

### 9.2 F-V3 lock — `dependencies.internal` declaration

`meta.ts` declares `internal: ["rich-card", "flow-canvas-01"]`. The `validate-meta-deps` audit catches drift between this declaration and the actual relative imports — keep them in sync.

### 9.3 F-rev-3 — `enumerateSubcards` stays private

The helper is kept INTERNAL (not re-exported from `index.ts`) because its signature depends on the `isCardLike` heuristic, which is marked for tightening in v0.2 if rich-card ships a canonical "is-card" predicate. Exporting now then changing the signature later = breaking change for consumers writing custom rich-card renderers on top of this procomp. Revisit in v0.2.

### 9.4 Smoke harness path-b is the F-V2 lock

For v0.1.0 first ships per the readiness-review rule, smoke harness path-b is REQUIRED pre-push. The harness at `e:/tmp/ilinxa-smoke-consumer/` smokes against locally-served `public/r/<slug>.json` via `http-server` on port 8765 with the consumer's `@ilinxa` registry temporarily pointed at localhost. Run before push; reset baseline after.

---

## 10. Cross-references

- **Stage 1 description** — what & why: [`rich-card-in-flow-procomp-description.md`](rich-card-in-flow-procomp-description.md)
- **Stage 2 plan** — how (file-by-file spec): [`rich-card-in-flow-procomp-plan.md`](rich-card-in-flow-procomp-plan.md)
- **GATE 3 review** — verdict + findings: [`reviews/2026-05-16-v0.1.0-spotcheck.md`](reviews/2026-05-16-v0.1.0-spotcheck.md)
- **Flow-canvas-01 v0.2.0 perf description Q33** — the popup-edit convention this procomp implements: [`../flow-canvas-01-procomp/flow-canvas-01-v0.2.0-perf-description.md`](../flow-canvas-01-procomp/flow-canvas-01-v0.2.0-perf-description.md)
- **Flow-canvas-01 procomp guide §8.3** — the convention's contributor-side documentation: [`../flow-canvas-01-procomp/flow-canvas-01-procomp-guide.md`](../flow-canvas-01-procomp/flow-canvas-01-procomp-guide.md)
- **`updateNodeData` helper source** — [`src/registry/components/data/flow-canvas-01/lib/update-node-data.ts`](../../../src/registry/components/data/flow-canvas-01/lib/update-node-data.ts)
- **F-V6 precedent** — `customJsonRenderer`'s `NodeData & { ... }` intersection: [`src/registry/components/data/flow-canvas-01/parts/custom-json-node.tsx`](../../../src/registry/components/data/flow-canvas-01/parts/custom-json-node.tsx)
- **F-S1 precedent** — json-form v0.1.4 smoke fix: [`.claude/decisions/2026-05-13-json-form-v014-smoke-fix.md`](../../../.claude/decisions/2026-05-13-json-form-v014-smoke-fix.md)
