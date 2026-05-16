---
date: 2026-05-16
type: feat
commits: [9dbb06c, 55c630e]
components: [flow-canvas-01]
findings: []
status: shipped
---

# flow-canvas-01 v0.2.1 — `onEditRequest` API + `updateNodeData` helper (Workstream A)

## Summary

`flow-canvas-01` v0.2.1 lands the additive popup-edit renderer convention API surface locked in [v0.2.0 perf description Q33](../../docs/procomps/flow-canvas-01-procomp/flow-canvas-01-v0.2.0-perf-description.md). Renderers fire `ctx.onEditRequest?.(subPath?)` to request an edit-dialog open; the host bubbles to `FlowCanvasProps.onEditRequest?.(nodeId, subPath?)`. Canonical first consumer: [`rich-card-in-flow@v0.1.0`](../../docs/procomps/rich-card-in-flow-procomp/rich-card-in-flow-procomp-plan.md) (Workstream B, pending).

This is Workstream A of the two-workstream plan signed off 2026-05-16 (GATE 2 closed, commit `f3108f5`). Patch-bump exemption per the [readiness-review rule](../rules/component-readiness-review.md) — additive, non-breaking, no public-API-touch-of-existing → **GATE 3 skipped**. The v0.2.0 GATE 3 spotcheck verdict carries forward.

### Release notes

> **Additive:** `FlowCanvasProps.onEditRequest?: (nodeId: string, subPath?: string) => void` — fired when a renderer requests an edit-dialog open (typically click). `subPath` is an opaque renderer-defined string (e.g. a rich-card subcard's `__rcid`) for sub-targeting. Leave `undefined` if you don't want edit affordances; renderers that honor the convention will silently no-op.
>
> **Additive:** `RenderContext.onEditRequest?: (subPath?: string) => void` — bound to the current `nodeId`. Renderers call it with no nodeId argument (host knows which node fired) and an optional `subPath`. `undefined` when the consumer hasn't wired `FlowCanvasProps.onEditRequest`, so renderers can gate their click affordances via `if (ctx.onEditRequest)`.
>
> **Additive:** new exported helper `updateNodeData(canvas, nodeId, nextData): CanvasData` — immutable walk-and-replace for the `data` field of a single node. Returns the input unchanged if `nodeId` is not found. Use this when wiring a popup-edit dialog's `onChange` back into canvas state.
>
> **No breaking type changes.** All v0.2.0 types unchanged. Existing consumers see zero behavior change.

## Files touched (Commit A1 = 9dbb06c)

| File | What |
|---|---|
| `src/registry/components/data/flow-canvas-01/types.ts` | Added `RenderContext.onEditRequest?` + `FlowCanvasProps.onEditRequest?`. Both optional, both default to `undefined`. |
| `src/registry/components/data/flow-canvas-01/registries/canvas-context.tsx` | Added `FlowCanvasContextValue.onEditRequest?` so the per-node `NodeAdapter` can pull it from context. |
| `src/registry/components/data/flow-canvas-01/parts/node-adapter.tsx` | Pulls `onEditRequest` from context; binds via `useCallback` to current node id; sets `ctx.onEditRequest` to `undefined` when consumer hasn't wired (gating signal). |
| `src/registry/components/data/flow-canvas-01/flow-canvas-01.tsx` | F-V5 ref-mirror lock: `onEditRequest` is ref-mirrored (`onEditRequestRef`); a stable wrapper (`stableOnEditRequest`) is passed through the canvas-context `useMemo`; identity flips ONLY on the wired/unwired transition (not when consumers pass a fresh function identity each render). Matches the established defensive posture in [`use-canvas-data.ts`](../../src/registry/components/data/flow-canvas-01/hooks/use-canvas-data.ts) which ref-mirrors `onChange`, `onBeforeConnect`, etc. |
| `src/registry/components/data/flow-canvas-01/lib/update-node-data.ts` (new) | Q10-locked helper. ~25 LoC. Immutable; preserves NodeRecord identity for unchanged nodes. |
| `src/registry/components/data/flow-canvas-01/index.ts` | Re-exports `updateNodeData`. |

## Files touched (Commit A2 = 55c630e)

| File | What |
|---|---|
| `src/registry/components/data/flow-canvas-01/meta.ts` | `version: "0.2.0" → "0.2.1"`. Added "Popup-edit renderer convention (v0.2.1) — onEditRequest + updateNodeData helper" feature bullet. |
| `registry.json` | Flow-canvas-01 base item gains `lib/update-node-data.ts` as `type: registry:component`, target `components/flow-canvas-01/lib/update-node-data.ts`. |
| `public/r/flow-canvas-01.json` | Regenerated via `pnpm registry:build`. Verified the artifact carries `update-node-data.ts` at the expected target. |
| `public/r/registry.json` | Catalog regenerated for completeness. |

## Verification

All checks clean post-commits:

- `pnpm tsc --noEmit` — 0 errors
- `pnpm lint` — 0 errors (2 pre-existing virtualizer warnings unchanged)
- `pnpm validate:meta-deps` — 42/42 clean
- `pnpm registry:build` — clean; spot-checked `public/r/flow-canvas-01.json` line 103: `update-node-data.ts` present

## Rationale points worth keeping

**Why both `RenderContext.onEditRequest` AND `FlowCanvasProps.onEditRequest` surfaces?** The host's `(nodeId, subPath)` callback can't be passed verbatim to renderers — renderers don't know their own nodeId until `NodeAdapter` binds it. So the host's callback is bubbled through context, and `NodeAdapter` produces a per-node-bound version for `RenderContext`. Renderers see the simpler `(subPath?) => void` signature.

**Why the F-V5 ref-mirror in `flow-canvas-01.tsx`?** Consumers writing inline `onEditRequest={(id) => setEditingNodeId(id)}` (the common pattern) would otherwise cascade re-renders across every `NodeAdapter` on every parent re-render — the canvas-context `useMemo` would invalidate because `onEditRequest`'s identity changed. Ref-mirror + a stable wrapper whose identity flips ONLY on the wired/unwired transition matches the defensive posture in [`use-canvas-data.ts`](../../src/registry/components/data/flow-canvas-01/hooks/use-canvas-data.ts) (which already ref-mirrors `onChange` + `onBeforeConnect` + 6 others). Don't trust consumer `useCallback`.

**Why the `if (onEditRequest) handleEditRequest : undefined` ternary in node-adapter?** Lets renderers gate their click affordances via `if (ctx.onEditRequest)` — when the consumer hasn't wired the canvas-level prop, renderers know not to render an edit affordance. The renderer that ignores the prop entirely loses nothing.

**Why ship `updateNodeData` alongside the API rather than later?** Q10 lock from the rich-card-in-flow Stage 1 sign-off: the helper home is `flow-canvas-01@v0.2.1` (paired with the API that creates the need). Future heavy-content adapters (`plate-editor-in-flow`, `code-block-in-flow`, etc.) inherit it. The rich-card-in-flow `index.ts` re-exports for ergonomic DX (one import for the whole flow).

## What this does NOT change

- **No GATE 3 review.** Patch-bump exemption per the readiness-review rule. v0.2.0's `Pass with follow-ups` verdict carries forward.
- **No new dependencies.** Internal-only additive code change.
- **No CSS / no public component shapes.** Pure type-and-helper surface.
- **No smoke harness run.** Per the readiness-review rule, smoke harness is required for `v0.1.0` first ships only; additive patch bumps don't trigger. The smoke harness WILL run for rich-card-in-flow@v0.1.0 (Workstream B) per F-V2 lock.

## What's next — Workstream B

`rich-card-in-flow@v0.1.0` first ship — new sealed folder + RichCardViewer renderer + consumer-owned-dialog pattern. See the [plan §5](../../docs/procomps/rich-card-in-flow-procomp/rich-card-in-flow-procomp-plan.md) for the file-by-file spec. GATE 3 spot-check REQUIRED (rotating dim: Public API). Smoke harness path-b REQUIRED (F-V2 lock).

The [`updateNodeData` helper](../../src/registry/components/data/flow-canvas-01/lib/update-node-data.ts) shipped here is the canonical pattern for the rich-card-in-flow dialog wiring; rich-card-in-flow's `index.ts` will re-export it for consumer convenience.
