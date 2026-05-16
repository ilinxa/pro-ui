---
date: 2026-05-16
type: feat
commits: [19e3f42, 4c185ef, 3519a7c, 86cdd05]
components: [rich-card-in-flow]
findings: [F-01-closed, F-02-v0.2, F-03-v0.2]
status: shipped
---

# rich-card-in-flow v0.1.0 — first ship (Workstream B)

## Summary

`rich-card-in-flow@v0.1.0` ships the canonical implementation of the popup-edit renderer convention locked in [flow-canvas-01@v0.2.0 perf description Q33](../../docs/procomps/flow-canvas-01-procomp/flow-canvas-01-v0.2.0-perf-description.md). A read-only `RichCardViewer` renderer paints inside each flow-canvas-01 node (title + first 3 flat fields + nested-card outlines with their own ports + selectability + click affordances at root and subcard levels); clicking fires `ctx.onEditRequest?.(subPath?)` which bubbles up through `FlowCanvasProps.onEditRequest?.(nodeId, subPath?)`; the consumer's dialog mounts the full `<RichCard editable>` editor with the same `RichCardJsonNode` data (no transformation layer). At most ONE rich-card editor instance is mounted at any moment, regardless of node count.

This is **Workstream B** of the two-workstream plan signed off 2026-05-16 (GATE 2 closed, commit `f3108f5`). Workstream A (`flow-canvas-01@v0.2.1` — the `onEditRequest` API + `updateNodeData` helper) shipped earlier the same day (commits `9dbb06c` + `55c630e` + `ef50f0a` + `22e5955`).

**43rd component** in the library (was 42). New sealed folder at `src/registry/components/data/rich-card-in-flow/`.

### Release notes

> **New procomp.** `@ilinxa/rich-card-in-flow@v0.1.0` (alpha) — read-only RichCardViewer renderer for `@ilinxa/flow-canvas-01` nodes + consumer-owned-dialog pattern for editing rich-card content inside canvas nodes. Cross-registry deps on `@ilinxa/rich-card@^0.4.0` (editor) and `@ilinxa/flow-canvas-01@^0.2.1` (host).
>
> **Use it when** each flow-canvas-01 node should carry a rich-card JSON tree as its data — agent workflow editors, schema/config canvases, decision/runbook maps. The viewer paints a read-only summary; clicking opens a consumer-owned dialog with the full `<RichCard>` editor.
>
> **Three properties:** at-most-one editor mounted regardless of N; renderer is content-agnostic about editability; flow-canvas-01 stays rich-card-unaware.
>
> **Subcard-level click-to-focus** — clicking a nested card pre-focuses the dialog on that subcard via `RichCardHandle.focusCard(rcid)` (imperative ref method; F-02 lock — rich-card has no `initialFocusCardId` prop today).
>
> **n8n-style multi-select** supported out of the box via flow-canvas-01's marquee + shift-click. Single-edit gesture on clicked node; bulk EDIT deferred to v0.2.
>
> **Install:** `pnpm dlx shadcn@latest add @ilinxa/rich-card-in-flow` — pulls procomp source + cross-registry deps. Optional fixtures sibling: `@ilinxa/rich-card-in-flow-fixtures` (agent-workflow demo dataset).

## Files

### B1+B2 commit (`19e3f42`) — sealed folder + manifest registration

| File | What |
|---|---|
| `types.ts` | F-V6 lock — `type RichCardCanvasNode = NodeData & RichCardJsonNode` intersection. `FlatField` + `FlatFieldType` for viewer's type-aware rendering. |
| `parts/rich-card-viewer.tsx` | `richCardViewerRenderer: NodeRenderer<RichCardCanvasNode>` + `RichCardViewerImpl` component. F-V1 outer is `<div role="group">` + per-element `<button>`s. F-05+G1 `position: relative` on outer + subcard blocks. Q6 constants locked: MAX_FLAT_FIELDS=3, MAX_NESTED_OUTLINES=4. Title-strip `disabled` when `ctx.onEditRequest` undefined. |
| `parts/subcard-block.tsx` | Nested subcard rendering. F-03 graceful degradation when `__rcid` missing (click bubbles to title-strip → root edit; dev-mode `console.warn`). `e.stopPropagation()` only on the focusable path. Subcard's own ports painted via `<PortsAt>`. |
| `parts/flat-field-strip.tsx` | Definition-list grid; numbers right-aligned tabular-nums, booleans centered, dates monospaced. |
| `lib/enumerate-subcards.ts` | F-04 lock — `Object.entries` walker with `isCardLike` heuristic (`__rcid`/`__rcorder`/`__rcmeta` OR own `ports[]`). Kept PRIVATE per F-rev-3 (signature depends on heuristic which may tighten in v0.2). |
| `lib/derive-title.ts` | `data.title` if non-empty string → first non-reserved string flat field → `undefined`. |
| `lib/derive-flat-fields.ts` | `boolean` / `number` / ISO-date `string` / plain `string` classification; first N entries by `Object.entries` order. |
| `lib/format-value.ts` | `Intl.NumberFormat` / `Intl.DateTimeFormat({ dateStyle: "short" })` / ✓-or-em-dash. |
| `index.ts` | Public barrel: `richCardViewerRenderer` + `RichCardCanvasNode`. **NO cross-procomp re-exports** (dropped per F-S1 — see below). |
| `meta.ts` | v0.1.0 alpha; `dependencies.internal: ["rich-card", "flow-canvas-01"]`; `shadcn: []`; `npm: {}`. |
| `src/registry/manifest.ts` | 3-line registration appended after json-form (REGISTRY index 42 — 43rd entry). |

### B3 commit (`4c185ef`) — demo + usage + dummy-data

| File | What |
|---|---|
| `dummy-data.ts` | Agent-workflow fixture: 3 rich-card nodes (User Prompt → GPT-4 Inference → Response, each with `__rcids` pre-attached at root + subcards + own ports) + 1 custom-json audit-log node (renderer-mixed proof). 3 edges including subcard→subcard routing. Viewport (0, 0, 0.85) so culling kicks in on first paint. |
| `demo.tsx` | Full `<FlowCanvas>` + `<Dialog>` + `<RichCard editable>` wiring. Module-scoped RENDERERS (xyflow-react-pro skill rule). `useRef<RichCardHandle>` + `useEffect` calling `focusCard(subPath)` (F-02 lock). `key={editing.nodeId}` clean remount. `onChange` routes through `updateNodeData` helper; preserves `__type` + `ports` by spreading prior data shape. |
| `usage.tsx` | Consumer-facing docs: when to use, canonical wiring (three-import pattern post-F-S1), subPath model, F-03 graceful degradation, multi-select behavior, v0.1 viewer limits, footguns (port-uniqueness, position:relative load-bearing chain, Radix forceMount defeats single-instance, subcards not drag-extractable). |

### B4 commit (`3519a7c`) — registry distribution

- `registry.json` — two new items at end of items array per locked convention:
  - `rich-card-in-flow` (base, `registry:block`): 9 shipped files (index.ts + types.ts + 4 lib/*.ts + 3 parts/*.tsx). `registryDependencies: ["@ilinxa/rich-card", "@ilinxa/flow-canvas-01"]`. NO shadcn deps (renderer uses native `<button>`+`<div>`).
  - `rich-card-in-flow-fixtures` (`registry:block`): just `dummy-data.ts`. Depends on base.
- `public/r/rich-card-in-flow.json` + `public/r/rich-card-in-flow-fixtures.json` regenerated via `pnpm registry:build`. Verified base artifact carries 9 files; fixtures carries 1.

### B-smoke commit (`86cdd05`) — F-S1 cross-procomp import bug fix-up

F-V2 smoke harness path-b surfaced TWO shadcn 4.6.0 path-rewriter bugs that producer-side tsc didn't catch:

1. **`index.ts` cross-procomp re-exports get mis-rewritten.** `@/registry/components/data/rich-card/types` → `@/components/data/rich-card/types` (kept stray `data/`). `@/registry/components/data/flow-canvas-01/lib/update-node-data` → `@/lib/update-node-data` (stripped most of path).

   **Fix:** dropped cross-procomp re-exports from `index.ts` entirely (per json-form v0.1.4 precedent). Consumers import directly from each procomp's barrel.

2. **Same-category `<other-slug>/types` imports substitute the CURRENT slug for the target slug.** From `parts/rich-card-viewer.tsx`: `@/registry/components/data/flow-canvas-01/types` → `@/components/rich-card-in-flow/types` (substituted `rich-card-in-flow` for `flow-canvas-01`). NOT seen in json-form (cross-category forms→data works correctly); appears specific to same-category siblings.

   **Fix:** RELATIVE imports for all cross-procomp paths in shipped source — relative paths bypass the alias rewriter and translate verbatim through producer→consumer tree (sibling-procomp relationships preserved at same depth).

Smoke post-fix: 0 errors in `rich-card-in-flow` / `flow-canvas-01` / `rich-card` consumer files. 87 pre-existing errors remain in `code-block` / `json-form` / `pdf-viewer` (out of scope; tracked in their respective decision files).

**Promote-to-cross-cutting candidate:** Bug 2 (same-category cross-procomp `/types` substitution) is potentially cross-cutting. If a future same-category cross-procomp ship trips it, escalate to `sweep-tracker.md` as F-cross-13.

## Verification

All commits clean:
- `pnpm tsc --noEmit` — clean
- `pnpm lint` — 0 errors (2 pre-existing virtualizer warnings unchanged)
- `pnpm validate:meta-deps` — 43/43 clean
- `pnpm registry:build` — clean; artifacts spot-checked
- F-V2 smoke harness path-b — pass (after F-S1 fix-up cycle)

## GATE 3 spot-check

**Verdict: Pass with follow-ups** ([reviews/2026-05-16-v0.1.0-spotcheck.md](../../docs/procomps/rich-card-in-flow-procomp/reviews/2026-05-16-v0.1.0-spotcheck.md))

Rotating dimension: **Public API** (subPath protocol + F-V6 type intersection + imperative-ref pattern + F-S1 lock — all first-of-kind in the library; load-bearing for this component).

Three findings:
- **F-01 (Medium, closed pre-ship):** F-S1 shadcn path-rewriter bugs surfaced + fixed in same v0.1.0 ship (commit `86cdd05`). Documented in procomp guide §9.1 for future maintainers.
- **F-02 (Low, v0.2 candidate):** `isCardLike` heuristic may over-trigger on incidental object shapes. Tighten when rich-card v0.5 ships a canonical "is-card" predicate.
- **F-03 (Low, v0.2 candidate):** Rapid open/close per-mount cost — `key={editing.nodeId}` remounts Plate per click. Blocked on rich-card v0.5's hypothetical `RichCardHandle.setTree(tree)` API.

## Rationale points worth keeping

**Why drop the cross-procomp re-exports from `index.ts`?** The shadcn rewriter has demonstrable bugs handling them at the `index.ts` re-export site. Consumers paying a 2-line import cost (three imports instead of one) for robustness against the rewriter is the right trade. Json-form v0.1.4 set the precedent; rich-card-in-flow extends it.

**Why relative paths for cross-procomp imports in shipped source?** Bug 2 (same-category slug substitution) is specific to alias imports of `<other-slug>/types` from same-category siblings. Relative paths bypass the alias rewriter entirely. Both producer + consumer trees preserve sibling-procomp relationships at the same depth, so `../<slug>/types` resolves correctly in both.

**Why `NodeRenderer<RichCardCanvasNode>` instead of `NodeRenderer<RichCardJsonNode>`?** F-V6 lock — `NodeRenderer<TData extends NodeData>` requires `TData` to extend `NodeData` (which mandates `__type: string`). `RichCardJsonNode` alone has only optional `__rcid?` + index signature; the intersection `NodeData & RichCardJsonNode` is what flows through the registry. Precedent: `customJsonRenderer`'s `NodeData & { _label?: string }`.

**Why imperative `focusCard(rcid)` via ref instead of `<RichCard initialFocusCardId={rcid}>` prop?** F-02 lock — rich-card has no `initialFocusCardId` prop today. The imperative path works. If three consumers signal friction with the `useRef + useEffect` pattern, file a rich-card v0.5 PR.

**Why one rich-card editor instance at a time, not persistent?** The perf claim depends on it — Plate's per-instance state machine (DnD provider + reducer + keyboard handlers) is expensive enough that N=20 inline editors break the canvas; N=1 in a dialog is fine. The trade-off: rapid-switch latency (G3 finding). Worth it.

## What this does NOT include

- **Bulk EDIT across multi-select** — deferred to v0.2 per Q3 lock. Needs real consumer signal + UX shape that doesn't violate single-tree contract.
- **Configurable viewer options** — `RichCardViewerOptions` factory deferred to v0.2 per Q6 lock.
- **Inline editing** — all edits go through the dialog per Q1 + popup-edit convention.
- **Shipped dialog component** — consumers own their dialog choice (Dialog / Drawer / Sheet / custom).
- **Subcard drag-extract** — flow-canvas-01's `data-draggable-subobject` pattern doesn't apply (subcards are part of one rich-card tree per Q1).
- **Quick-edit gestures** — deferred to v0.3.
- **Server-driven streaming canvas** — deferred to v0.3+.
