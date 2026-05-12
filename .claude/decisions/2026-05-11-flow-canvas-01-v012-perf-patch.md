---
date: 2026-05-11
type: fix
components: [flow-canvas-01]
status: shipped
---

# flow-canvas-01 v0.1.2 — perf patch (200-node stress tab hang)

## Summary

User reported that the Stress (200 nodes) demo tab on `/components/flow-canvas-01` was hanging the browser — pan/zoom/select all but unresponsive. Root cause: three xyflow anti-patterns the `xyflow-react-pro` skill explicitly calls out (stale-closure event handlers passed to `<ReactFlow>` that rebuild on every drag tick). Fixed in a patch bump, no public-API change.

## Context

`flow-canvas-01` v0.1.1 worked fine at the demo sizes its other tabs use (~5 nodes), but the Stress fixture surfaces an O(N) cost per drag-frame that compounds with three cascading callback-rebuild patterns:

1. **`isValidConnection`** ([parts/canvas.tsx](../../src/registry/components/data/flow-canvas-01/parts/canvas.tsx)) — `useCallback([canvas.xyNodes, canvas.xyEdges])`. xyflow treats this as a prop change every drag tick → internal reconciliation walks every mounted node.
2. **`onNodesChange` / `onEdgesChange` / `onConnect` / `appendNode` / etc.** ([hooks/use-canvas-data.ts](../../src/registry/components/data/flow-canvas-01/hooks/use-canvas-data.ts)) — closed over sibling state (`internalEdges`, `viewport`) so their dep arrays churned on every state update. Every change handler passed to `<ReactFlow>` is a prop; new identity → cascade.
3. **`<CanvasContextMenu>` arrays** ([parts/canvas.tsx](../../src/registry/components/data/flow-canvas-01/parts/canvas.tsx)) — `nodes={useMemo(() => canvas.xyNodes.map(...), [canvas.xyNodes])}` re-mapped all 200 entries per drag tick, plus the menu wrapper's own `handleContextMenu` callback rebuilt on those arrays.

`fitView` puts all 200 nodes on-screen at initial mount, so `onlyRenderVisibleElements` can't cull anything until the user manually zooms in — meaning every cascade hits the full mounted node set. At 5 nodes invisible; at 200, hangs the main thread.

Per the `xyflow-react-pro` skill mandate (CLAUDE.md): *"`useCallback` every event handler passed to `<ReactFlow>` (production code)"* and *"components passed as props to `<ReactFlow>` should either be memoized or declared outside the parent."*

## Outcome

- **`hooks/use-canvas-data.ts`** — mirror `internalNodes`, `internalEdges`, `viewport`, and every callback prop in refs. All change handlers (`onNodesChange`, `onEdgesChange`, `onConnect`, `appendNode`, `updateNodeData`, `deleteNode`, `deleteEdge`, `duplicateNode`, `setNodes`, `setEdges`, `replace`, `extractSubObject`) now have empty dep arrays except `[fireOnChange]` (itself empty). Added new `getNodeById(id)` / `getEdgeById(id)` resolvers — ref-based, stable identity.
- **`parts/canvas.tsx`** — local `nodesRef` + `edgesRef` for `isValidConnection`'s reads; callback is now `useCallback(..., [])`. Replaced `nodes={useMemo(map(...))}` + `edges={useMemo(map(...))}` props on `<CanvasContextMenu>` with stable `getNodeById` / `getEdgeById` resolvers from `useCanvasData`. Wrapped `actions` in `useMemo` over the (now stable) member references.
- **`parts/canvas-context-menu.tsx`** — contract changed from `nodes: NodeRecord[]` / `edges: EdgeRecord[]` to `getNodeById` / `getEdgeById` resolvers. Internal-only change (component is not exported via `index.ts`), so no public-API touch.
- **`meta.ts`** — bumped `version: "0.1.1" → "0.1.2"`, `updatedAt: "2026-05-11"`.

**Verification:**
- `pnpm tsc --noEmit` — clean.
- `pnpm lint` — clean (only the 2 pre-existing TanStack Virtual React-Compiler-skip warnings on `file-manager` + `file-tree`, unrelated to this patch).
- `pnpm validate:meta-deps` — 41/41 clean.

**Patch-bump scope per the readiness-review rule:** non-breaking, no public-API touch → GATE 3 spot-check **NOT required**. (Rule explicitly excludes `v0.1.x → v0.1.y` patch bumps.)

## Cross-references

- Skill: [`.claude/skills/xyflow-react-pro/`](../skills/xyflow-react-pro/) — "Performance" section + "useCallback every event handler" mandate
- Procomp: [`docs/procomps/flow-canvas-01-procomp/`](../../docs/procomps/flow-canvas-01-procomp/)
- Readiness-review rule: [`.claude/rules/component-readiness-review.md`](../rules/component-readiness-review.md) — patch-bump exemption
