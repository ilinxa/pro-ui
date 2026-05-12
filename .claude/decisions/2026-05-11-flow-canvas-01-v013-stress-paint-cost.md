---
date: 2026-05-11
type: fix
components: [flow-canvas-01]
status: shipped
---

# flow-canvas-01 v0.1.3 — second-round perf patch (paint cost + culling)

## Summary

After v0.1.2 fixed the cascading-callback churn during drags, the user reported the Stress (200 nodes) tab was still "very heavy — 200 isn't that much." Remaining cost was paint-side, not React-side: `fitView` was zooming to fit all 200 nodes → `onlyRenderVisibleElements` had nothing to cull → the browser was painting 200 full DOM cards on every pan/zoom frame. Plus the default `<CustomJsonNode>` ran `JSON.stringify` on every render even when collapsed. Fixed both. Patch-bump scope.

## Context

v0.1.2 made `onNodesChange` / `onEdgesChange` / `isValidConnection` / the context-menu lookups all stable so they no longer cascade ReactFlow reconciliation per drag tick. That brought the React-render cost to ~zero during steady-state interaction. What was left was the **rendering** cost: with 200 heavy cards (border + shadow + truncated `<pre>` block + 2 handles each) all painted into the DOM, browser compositing during a pan was the bottleneck. `onlyRenderVisibleElements` was set on the canvas, but the demo's `fitView` was overriding it by putting every node on-screen at first paint.

Three contributing factors:
1. **`fitView` always-on in `<ReactFlow>`** — hardcoded at the consumer-invisible boundary. `CanvasData.viewport` was already a public field; the canvas just wasn't reading it.
2. **`CustomJsonNode` collapsed-mode cost** — ran `JSON.stringify(data, null, 0)` on every render and rendered the result into a CSS-truncated `<pre><code>` block. At 200 mounted nodes that's 200 stringifications + 200 `<pre>` paints + 200 `shadow-sm` GPU paints.
3. **Stress fixture had no initial viewport** — there was no signal from data that the canvas should NOT fit.

## Outcome

- **`parts/canvas.tsx`** — read `data?.viewport ?? defaultData?.viewport` once at mount via `useState(() => …)` (snapshot pattern; React Compiler's `react-hooks/refs` rule rejects reading `ref.current` during render). Pass to `<ReactFlow>` as `defaultViewport={initialViewport}` and disable fitView when an initial viewport is present (`fitView={!initialViewport}`).
- **`parts/custom-json-node.tsx`** — collapsed mode now renders label + `+` chevron only. No `<pre>`, no `JSON.stringify`, no border under the header, no shadow. Expanded mode keeps the full payload (`JSON.stringify(data, null, 2)`), border separator, and shadow.
- **`dummy-data.ts`** — `makeStressData()` now ships `viewport: { x: 40, y: 40, zoom: 0.9 }`. Comment explains the choice so future maintainers know why the fixture opts out of fitView.
- **`meta.ts`** — `version: "0.1.2" → "0.1.3"`.

**Verification:**
- `pnpm tsc --noEmit` — clean.
- `pnpm lint` — clean (only the 2 pre-existing TanStack Virtual `incompatible-library` warnings on `file-manager` + `file-tree`; unrelated to this patch).
- `pnpm validate:meta-deps` — 41/41 clean.

**Why patch-bump:** internal-only paint/heuristic tweaks; `CanvasData.viewport` was already a public field. No new props, no signature changes. Per the readiness-review rule, patch bumps skip GATE 3.

## Cross-references

- Prior round: [2026-05-11 v0.1.2 callback churn](2026-05-11-flow-canvas-01-v012-perf-patch.md)
- Skill: [`.claude/skills/xyflow-react-pro/`](../skills/xyflow-react-pro/) — *"`onlyRenderVisibleElements={true}` — opt-in viewport culling"* + *"hidden: true on a node hides without unmounting"*
- Readiness-review rule: [`.claude/rules/component-readiness-review.md`](../rules/component-readiness-review.md) — patch-bump exemption
