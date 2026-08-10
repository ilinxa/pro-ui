# HANDOFF — rich-card-in-flow edge-handle debug pause, 2026-05-16

> **Read this first** when resuming. Locations are relative to repo root.

---

## TL;DR — exactly where we are

This session: shipped rich-card-in-flow@v0.1.0 (Workstream B) + flow-canvas-01@v0.2.1 (Workstream A from the GATE 2 plan) + three follow-up bugfixes surfaced by the controlled-mode demo (`v0.2.2` setState-during-render, `v0.2.3` round-trip echo guard, demo strip helper, dummy-data normalization).

**ONE WARNING REMAINS** in the dev console at `/components/rich-card-in-flow`. The user paused before testing the latest fix (commit `e66f6c1`); next-session task is to test + continue debugging if needed.

| Status | Issue | Resolution |
|---|---|---|
| ✅ FIXED | `[React] setState during render` (Canvas → consumer) | v0.2.2 `queueMicrotask` wrap of `fireOnChange` body in `use-canvas-data.ts` |
| ✅ FIXED | `[ReactFlow] trying to drag a node that is not initialized` (26×) | v0.2.3 structural-equality guard `canvasMatchesInternalState` in the controlled-mode useEffect |
| ✅ FIXED | `[rich-card] at <path>.ports: array values are not supported` (3 per dialog open) | Demo `stripFlowCanvasFields` + `mergeFlowCanvasFields` recursive helpers |
| ✅ FIXED | `[ReactFlow] Couldn't create edge for target handle id: p-llm-user-in` | Demo strip helper merged ports back recursively (the v0.2.3 + demo strip combo) |
| ⏳ UNDER TEST | `[ReactFlow] Couldn't create edge for target handle id: p-llm-system-in` | Latest fixture fix commit `e66f6c1` (drop `multi: true`, fix type mismatch). **Not yet tested by user.** |

---

## What to do FIRST on resume

1. Reload `/components/rich-card-in-flow` (HMR should have picked up `e66f6c1`; if not, hard refresh).
2. Open browser console.
3. Check whether the `p-llm-system-in` warning is gone.

### Outcome A — warning is GONE

The fixture inconsistencies were the cause (`multi: true` mismatch + type mismatch). Close the investigation:

1. Author a decision file at `.claude/decisions/2026-05-16-rcif-edge-handle-fixture-fix.md` documenting the root cause (fixture data inconsistency, not a component bug).
2. Update STATUS.md: drop the "under-test" Open-decisions entry; rcif is fully closed.
3. Pick up next priority — likely one of the 3 remaining active-queue procomps (`rich-graph-2`, `chat-panel`, `notification-system`) OR the flow-canvas-01 v0.2.0 spotcheck follow-ups (F-01 measurement, F-02 smoke).

### Outcome B — warning is STILL THERE

The fixture wasn't the cause. Deeper debug needed. Suggested investigation order:

1. **Temporary debug logging in `PortHandle`** — add `useEffect(() => { console.log("[port-handle] mount", port.id); return () => console.log("[port-handle] unmount", port.id); }, [port.id])` to see whether the system subcard's Handle actually mounts (and stays mounted). Quick + non-invasive.
2. **DOM inspection** — open browser devtools, find node `n-llm` in the DOM (`[data-id="n-llm"]`), verify the `<div class="react-flow__handle ..." data-handleid="p-llm-system-in">` element is present. If absent → rendering issue. If present → measurement issue.
3. **React DevTools** — find the `Handle` component for `p-llm-system-in` and verify its `id` prop. Check if React Compiler is over-memoizing and skipping its render.
4. **xyflow internal store** — using React DevTools or a debug logger, inspect `xyflow.store.nodeLookup.get("n-llm")?.internals.handleBounds` to see whether `p-llm-system-in` is registered (it should be after measurement).

Likely culprits (in rough order of probability):
- **React Compiler quirk** with the nested-button + memoized SubcardBlock + memoized PortHandle stack. The Compiler may be skipping re-renders that should fire. Workaround: bust memoization on SubcardBlock or PortHandle by passing a unique prop (e.g., a render-time counter). If that fixes it → file a React Compiler bug.
- **xyflow measurement race** specific to nested handle positioning. Workaround: ensure the SubcardBlock has a guaranteed-non-zero initial height (e.g., explicit `min-h-[32px]`) so xyflow's ResizeObserver fires.
- **PortsAt offset positioning** colliding for multiple left-side handles on the same node. The system subcard's handle ends up at the same screen position as the root-level left handle (both centered) → xyflow may dedupe by position. Workaround: explicit `offsetFor` overrides per subcard, OR change the `PortsAt` count to include cross-subcard handles.

---

## Implementation sequence in THIS session (commits, oldest → newest)

All on `master`, all pushed to origin (`https://github.com/ilinxa/pro-ui.git`).

| Commit | Stage | What |
|---|---|---|
| `f3108f5` | Plan v3 sign-off (GATE 2) | rich-card-in-flow Stage 2 plan v3 — F-V6 NodeRenderer generic constraint Blocker resolved pre-impl via `type RichCardCanvasNode = NodeData & RichCardJsonNode`; F-rev-2 v0.2 stub fragility + F-rev-3 enumerateSubcards stays private folded in |
| `9dbb06c` | Workstream A · A1 | flow-canvas-01@v0.2.1 code edits — `onEditRequest` on FlowCanvasProps + RenderContext + `updateNodeData` helper + F-V5 ref-mirror lock |
| `55c630e` | A2 | flow-canvas-01@v0.2.1 meta 0.2.0→0.2.1 + registry.json + `pnpm registry:build` regen |
| `ef50f0a` | A3 | flow-canvas-01@v0.2.1 STATUS + decision + handoff + component-versions tracking |
| `22e5955` | A-postship doc fixup | Guide §8.3 popup-edit paragraph + usage.tsx "Deferred to v0.2" heading + spotcheck F-03 closed |
| `19e3f42` | Workstream B · B1+B2 | rich-card-in-flow@v0.1.0 parts/ + lib/ + types.ts (RichCardCanvasNode) + index.ts + meta.ts + manifest.ts |
| `4c185ef` | B3 | rich-card-in-flow@v0.1.0 demo.tsx + usage.tsx + dummy-data.ts (agent-workflow fixture) |
| `3519a7c` | B4 | rich-card-in-flow@v0.1.0 registry.json base + fixtures items + `pnpm registry:build` |
| `86cdd05` | B-smoke F-S1 fix-up | Smoke harness path-b surfaced two shadcn 4.6.0 rewriter bugs: (1) cross-procomp re-exports in `index.ts` get mangled → DROP them; (2) same-category `<other-slug>/types` imports substitute current slug → use RELATIVE paths for all cross-procomp imports in shipped source |
| `bd1042f` | B-final | Stage 3 procomp guide + GATE 3 spotcheck (Pass with follow-ups) + decision file + STATUS + handoff updated |
| `022cee8` | flow-canvas-01@v0.2.2 fix | setState-during-render fix — wrap `fireOnChange` body in `queueMicrotask`; all 13 reducer-side-effect sites uniformly deferred |
| `1e4e0d5` | v0.2.2 tracking | STATUS + decision + component-versions |
| `1910e2d` | flow-canvas-01@v0.2.3 fix | Round-trip echo guard — new `canvasMatchesInternalState` helper; controlled-mode useEffect skips wholesale-replace when consumer's new data prop structurally matches current internal state |
| `024b23d` | v0.2.3 tracking | STATUS + decision + component-versions |
| `e17c62c` | rcif demo strip helper | Demo `stripFlowCanvasFields` + `mergeFlowCanvasFields` recursive helpers — kills rich-card `ports: array values not supported` warnings; merges ports back recursively on save (no version bump — demo only) |
| `e66f6c1` | rcif dummy-data normalize | Dropped `multi: true` from `p-llm-system-in` (was inconsistent with `p-llm-user-in`); changed `p-prompt-meta-out` type from `data` to `text` to match its target (typed-validator coherence). **PENDING USER TEST.** |

---

## Tree state at pause

- **43 components** total across 8 categories. rich-card-in-flow is the 43rd.
- **flow-canvas-01 at v0.2.3** (alpha).
- **rich-card-in-flow at v0.1.0** (alpha).
- All recent commits clean: tsc + lint (2 pre-existing virtualizer warnings unchanged) + validate-meta-deps (43/43) + registry:build + `pnpm build` all clean.
- HANDOFF-2026-05-16-rich-card-in-flow-stage2-pause.md is FROZEN (workstreams shipped).
- HANDOFF-2026-05-14-flow-canvas-perf-pause.md is FROZEN (older).
- HANDOFF-2026-05-09-session-pause.md is FROZEN (older).
- This handoff (HANDOFF-2026-05-16-rcif-edge-handle-debug-pause.md) is the ACTIVE one.

---

## Key technical state to remember

### v0.2.2 / v0.2.3 architecture

`use-canvas-data.ts` now has TWO defensive layers for controlled-mode safety:

1. **Microtask defer** of `fireOnChange` body (v0.2.2) — consumer `onChange` always fires post-commit, never synchronously inside a reducer. Prevents "setState during render" warnings when xyflow emits dimensions during render-phase.

2. **Structural-equality guard** in controlled-mode useEffect (v0.2.3) — `canvasMatchesInternalState(data, nodesRef, edgesRef, viewportRef)` compares id/position/data-ref/viewport. If structurally equal, skip wholesale-replace via `toXyNode(...)` — prevents xyflow re-measurement cycles that cause "node not initialized" warnings.

These two are **load-bearing in tandem**. Removing either re-introduces a class of bug. Document for future flow-shaped procomps in the library:
- Microtask defer alone → setState-during-render gone, but round-trip cycle re-measures
- Resync guard alone → cycle doesn't fire, but reducer-side-effects still trigger setState-during-render warning

### v0.1.0 rich-card-in-flow F-S1 lock

shadcn 4.6.0 path rewriter has two bugs:

1. **`index.ts` cross-procomp re-exports get mangled** — DROP cross-procomp re-exports from the barrel; consumers import directly from each procomp's barrel.

2. **Same-category `<other-slug>/types` imports** in `parts/` / `lib/` get the CURRENT slug substituted for the target slug — use RELATIVE paths for all cross-procomp imports in shipped source.

Documented in procomp guide §9.1 (contributor notes). Promote-to-cross-cutting candidate if a future same-category cross-procomp ship trips it.

### v0.1.0 demo strip pattern

Flow-canvas reserved keys (`ports`, `__type`) aren't compatible with rich-card's open-shape data model. The demo strips them before passing to RichCard and merges them back on save. Pattern is in [demo.tsx](src/registry/components/data/rich-card-in-flow/demo.tsx) — `stripFlowCanvasFields` + `mergeFlowCanvasFields` recursive helpers. Consider exporting these as reusable consumer helpers in v0.1.1 if other consumers ask.

---

## Pre-existing v0.2.0 spotcheck follow-ups (still open)

These were tagged as v0.2.1 candidates pre-Workstream-A but v0.2.1 / v0.2.2 / v0.2.3 stayed minimal-scope. Now **v0.2.4+ candidates** for `flow-canvas-01`:

- **F-01 (Med):** formal protocol-compliant post-Tier-1+2 measurement matrix deferred. Run 4 cells (light vis-on N=200/N=2000, heavy vis-on N=200/N=1000) per protocol §3; file as `research/<date>-tier2-postship.md`.
- **F-02 (Low):** smoke harness path-b not run for v0.2.0 / v0.2.1 / v0.2.2 / v0.2.3 (manual single-slug smoke only).
- **F-03 (Low):** ~~`usage.tsx` "Deferred to v0.2" heading stale post-v0.2.0 ship~~ ✅ Closed in commit `22e5955`.

## Pre-existing rich-card-in-flow v0.1.0 spotcheck follow-ups

- **F-02 (Low):** `isCardLike` heuristic may over-trigger on incidental object shapes. Tighten when rich-card v0.5 ships a canonical "is-card" predicate. v0.2 candidate.
- **F-03 (Low):** Rapid open/close per-mount cost — `key={editing.nodeId}` remounts Plate per click. Blocked on rich-card v0.5's hypothetical `RichCardHandle.setTree(tree)` API.

## Active component queue (3 remaining)

- `rich-graph-2`
- `chat-panel`
- `notification-system`

None started. Pickable in any order.

---

## Files to read on resume (in order)

1. **This file** — start here.
2. [`.claude/STATUS.md`](STATUS.md) — current snapshot.
3. [`.claude/decisions/2026-05-16-flow-canvas-v0.2.3-resync-echo-guard.md`](decisions/2026-05-16-flow-canvas-v0.2.3-resync-echo-guard.md) — most recent flow-canvas fix; explains the v0.2.2→v0.2.3 saga.
4. [`.claude/decisions/2026-05-16-rich-card-in-flow-v0.1.0-first-ship.md`](decisions/2026-05-16-rich-card-in-flow-v0.1.0-first-ship.md) — rcif ship details.
5. (If debugging the edge-handle issue) [`src/registry/components/data/rich-card-in-flow/dummy-data.ts`](../src/registry/components/data/rich-card-in-flow/dummy-data.ts) — the fixture.
6. (If debugging) [`src/registry/components/data/rich-card-in-flow/parts/subcard-block.tsx`](../src/registry/components/data/rich-card-in-flow/parts/subcard-block.tsx) — where subcard handles render.
7. (If debugging) [`src/registry/components/data/flow-canvas-01/parts/port-handle.tsx`](../src/registry/components/data/flow-canvas-01/parts/port-handle.tsx) + [`parts/ports-at.tsx`](../src/registry/components/data/flow-canvas-01/parts/ports-at.tsx) — the handle plumbing.

---

## Lessons captured for the library

1. **Controlled-mode wrappers around stateful libraries need TWO defenses:**
   - Microtask defer of consumer notify
   - Reference-aware (or structural) resync guard
   - Either alone leaves a cycle / race window open.

2. **Smoke harness path-b is genuinely load-bearing for v0.1.0 first ships.** rich-card-in-flow's smoke surfaced two shadcn rewriter bugs that producer-side tsc didn't catch. F-V2 lock was the right call.

3. **Cross-procomp imports for same-category siblings need relative paths.** shadcn's alias rewriter has the slug-substitution bug. Documented in procomp guide §9.1; should be folded into a future skill or component-guide convention.

4. **Demo-side wiring for cross-stateful-library composition needs strip/merge helpers.** rich-card-in-flow's demo strip pattern is the canonical example — future composers (e.g. `plate-editor-in-flow`, `code-block-in-flow`) will need similar.

---

## Estimated time to resume

- Read this + STATUS + most-recent decision: ~5 minutes
- Test the latest fix (reload + check console): ~1 minute
- If Outcome A (warning gone): close out + write decision + commit: ~10 minutes
- If Outcome B (warning persists): debug investigation: variable (15min to several hours depending on cause)

---

## Pause reason

User explicit pause + handoff request: *"ook lets pause the session here i will continue in a fresh session / make sure all memory data and traking documents are fully upto date and also dont forget to creating a perfectlyy matched hatdoff for this session / i will test and continue fixing in next session"*. This handoff + the tracking-state commit are the deliverables.
