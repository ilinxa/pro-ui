# `flow-canvas-01` — v0.2.0 Performance Plan (Stage 2, perf scope)

> **Stage:** 2 of 3 (perf-scope follow-on) · **Status:** **Signed off 2026-05-16 (GATE 2 closed)** · Re-validated 2026-05-16 (6 V-findings resolved in place, see §3.5)
> **Slug:** `flow-canvas-01` · **Category:** `data` (unchanged)
> **Inputs:** v0.2.0 perf description signed off ([flow-canvas-01-v0.2.0-perf-description.md](flow-canvas-01-v0.2.0-perf-description.md)). All Q1–Q24 (from v0.1.x description) and Q25–Q35 (from v0.2.0 description) inherited as fixed inputs. Validation-pass findings F-01 through F-10 resolved in §3 below; plan-re-validation findings F-V1 through F-V6 (2026-05-16) folded into the relevant sections and indexed in §3.5.
> **Backing measurements:** [research/2026-05-14-baseline.md](research/2026-05-14-baseline.md) (directional, overlay-only, partial matrix). Formal protocol-compliant re-measurement is a §6 plan deliverable.
> **What this plan covers:** Tier 1 + Tier 2 = **v0.2.0** ship. Tier 3 (= v0.3.0) gets its own plan doc when v0.3.0 is scoped — this plan only touches Tier 3 where it amends description findings (F-05, F-07).

After sign-off, no scaffolding-time second-guessing — implementation follows the plan, deviations are loud.

---

## 1. Updated tier-priority priors (post-v0.1.4)

The v0.1.4 patch ([decisions/2026-05-14-flow-canvas-v0.1.4-custom-json-handles.md](../../../.claude/decisions/2026-05-14-flow-canvas-v0.1.4-custom-json-handles.md)) shifted the perf landscape. Description targets are stale; this plan absorbs the updated priors as planning inputs (description is NOT edited per the post-signoff loud-change rule).

| Tier | Description's Tier 1 ceiling | v0.1.4-alone overlay reading | Plan's revised Tier 1 success bar (§5) |
|---|---|---|---|
| pre-Tier-1 | light 200 nodes laggy | light N=1000 vis-on: 60–80 FPS | n/a — v0.1.4 baseline |
| Tier 1 light | ≥50 FPS at N=500 | already 80–90 FPS at N=500 | **≥50 FPS at N=2000 (post Tier 1)** |
| Tier 1 heavy | ≥50 FPS at N=200 | 50–60 FPS at N=200 (vis-off) | **≥50 FPS at N=1000 (post Tier 1)** |
| Tier 2 urgency | "make 1k usable" | 1k light already usable | **"tighten 2k+ light & 1k+ heavy"** |
| Tier 4 threshold | >2k nodes → sibling procomp | 5k heavy + vis-on hits 60–70 FPS | **Capability framing**: *"when you genuinely need zero DOM per node"* (HANDOFF-recommended) |

All overlay numbers above are directional. The first deliverable of this plan (§6 step 1) is **a fresh protocol-compliant re-baseline** that replaces these with DevTools-trace numbers before any tier ships.

---

## 2. Inherited inputs (one-paragraph summary)

v0.2.0 is a **perf-scope follow-on** that ships **Tier 1 + Tier 2 bundled** behind a single minor bump. Public-API additions: **none** (one default flip — `onlyRenderVisibleElements: true` — with documented opt-out via `={false}`; one soft behavior change — `fireOnChange` batches during continuous drag). Internal changes: `useStore` selector in `DefaultEdge` gains a narrow port comparator; selection ring **visual** decouples from React rendering by switching to xyflow's `.react-flow__node.selected` class (per F-V1, this is a CSS-driven-visual + clarity win, NOT a React-reconciliation perf win — React re-renders on selection are unchanged). Tier 3 (canvas edge overlay + LOD) is **v0.3.0 scope** — not addressed here except to amend two description gaps (F-05 invariant + F-07 selection model) so the v0.3 plan can land them cleanly.

---

## 3. Resolved validation findings (lock-in)

The description validation pass surfaced 10 findings. All seven non-low findings are resolved below — the plan IS the resolution. The three low findings (F-08, F-09, F-10) land as plan-stage TODOs at §10.

### F-01 — `useStore` shallow equality: lock the actual API name

**Description's wording:** *"Apply `useShallow` (or `createWithEqualityFn(..., shallow)`) — TBD at GATE 2"*. None of those is the right name for xyflow's `useStore`.

**Lock:** xyflow's `useStore(selector, equality?)` takes a custom equality function as second arg ([xyflow-react-pro/SKILL.md:236](../../../.claude/skills/xyflow-react-pro/SKILL.md#L236)). For the [`DefaultEdge` selector at default-edge.tsx:38-43](../../../src/registry/components/data/flow-canvas-01/parts/default-edge.tsx#L38-L43) the lock is:

```ts
import { shallow } from "./lib/shallow";

const sourcePort: Port | undefined = useStore(
  (s) => {
    if (!source || !sourceHandleId) return undefined;
    const node = s.nodeLookup.get(source);
    if (!node) return undefined;
    return findPortInTree(node.data as NodeData, sourceHandleId)?.port;
  },
  portEqual,  // narrow comparator, see below
);
```

**Why an inline `shallow` helper, not `zustand/shallow`?** Verified via `pnpm list zustand`:
- Project top-level has `zustand@5.0.12` (transitive via platejs; declared in package.json).
- xyflow nests its own `zustand@4.5.7` (peer `^4.4.0`).
- Importing `zustand/shallow` resolves to top-level v5. Functionally equivalent to v4's shallow (pure comparator; algorithm unchanged across v3/v4/v5 per zustand changelog) — but introduces a transitive-coupling risk to consumers of `@ilinxa/flow-canvas-01` (when extracted from registry, the install adds zustand as a registry dep they may not want).

**Decision:** ship a 12-LOC `lib/shallow.ts` inside the sealed folder. Zero new `meta.ts` deps; no `validate:meta-deps` impact; xyflow's nested zustand is irrelevant. Algorithm matches zustand's `shallow` exactly (`Object.is` fast path → object key-count + per-key `Object.is`; Map and Set special cases since we won't pass them here, omitted).

**Narrow comparator for the `DefaultEdge` selector specifically** — the selector returns `Port | undefined`. Generic shallow is overkill; a port-aware comparator is lighter:

```ts
// in default-edge.tsx (private to this file)
const portEqual = (a?: Port, b?: Port) =>
  a === b || (a?.id === b?.id && a?.type === b?.type && a?.multi === b?.multi);
```

Three field equality is what the renderer actually uses (`portType` lookup keys on `port.type`; the rest is identity). Generic `shallow` from `lib/shallow.ts` is exported anyway for any future selector that needs it (e.g., consumer-side custom edge implementations following Tier 2's Change #3 doc rule).

### F-02 — Tier 2 selection-ring change: drop the contradiction

**Description's wording:** *"Move ring to CSS-only via `.react-flow__node.selected`. Existing `data-selected` may stay as a renderer-author convenience."* Internal-API contradiction: keeping `data-selected={isSelected}` on `<NodeShell>` means the shell still carries the `isSelected` prop AND the ring is also CSS-driven — two parallel selection-state paths through the same component for no reason. The clean fix is to pick one. (Note: the description also implied this saved a React re-render — that turned out to be wrong; see "What this change actually buys" below. The contradiction worth fixing is the parallel-paths one; the re-render framing is a separate F-V1 correction.)

**Lock:** the change ships in two steps:

1. **Drop the `isSelected` prop from `<NodeShell>` entirely.** [node-shell.tsx:14-52](../../../src/registry/components/data/flow-canvas-01/parts/node-shell.tsx#L14-L52) becomes `function NodeShellImpl({ isLocked, className, children })`. The `data-selected` attribute is removed from line 27. The Tailwind utility `data-[selected=true]:[&>*]:ring-2 data-[selected=true]:[&>*]:ring-ring` (line 32) is replaced by a CSS rule keyed on xyflow's wrapper class — see step 2.
2. **Selection ring moves to a sealed-folder `flow-canvas-01.css`** (locked in §5.3 — keeps registry-portability, see §5.3 option-comparison). Authoritative selector + declaration in §5.3; conceptually:
   ```css
   /* selection ring — driven by xyflow's wrapper class, no React render needed for the visual */
   .react-flow__node.selected > * > * { box-shadow: 0 0 0 2px var(--ring); }
   ```
   Targeting `> * > *` (xyflow wrapper → NodeShell → renderer output) matches v0.1.x's `data-[selected=true]:[&>*]:ring-2` from NodeShell's perspective. `box-shadow` (not `outline`) preserves the existing ring's z-stack behavior over nested content; it also conforms automatically to the renderer's own border-radius (no `border-radius: inherit` — see F-V6 in §5.3 for why that would BREAK rounded corners). **Focus-visible stays as a Tailwind utility on `<NodeShell>`** (`focus-visible:*:ring-*` per §5.3) — xyflow doesn't own focus state, and NodeShell already has `tabIndex={0}`.

**Renderer-author API:** `RenderContext.isSelected` remains ([types.ts:54](../../../src/registry/components/data/flow-canvas-01/types.ts#L54)). Renderers that want their OWN selection-conditional content keep using it — that's a read-only flag, no re-render coupling beyond what the renderer itself opts into.

**What this change actually buys (F-V1 reframe, 2026-05-16):** the 2026-05-16 re-validation pass corrected an overclaim in this section's prior framing. The change does NOT eliminate React re-renders on selection — those still happen for `NodeAdapter` (xyflow passes a new `selected` prop) and for the renderer (`RenderContext.isSelected` is part of the public API and continues to be populated, so any renderer that reads it re-renders). It does NOT skip `NodeShell`'s re-render either: `NodeAdapter` recreates `<NodeShell>{renderer.render(...)}</NodeShell>` on every render, so `children` is always a fresh JSX ref, defeating `memo(NodeShell)`'s equality check regardless of whether `isSelected` is in the prop set. **The real benefit is two things:** (a) the visual selection ring is purely a browser-side CSS effect — it applies the instant xyflow toggles the `.selected` class, decoupled from any React reconciliation pressure (batching, suspended renders, slow renderer work); (b) one fewer prop on `<NodeShell>`'s contract, removing a coupling the shell never had a reason to know about. Frame this as **a clarity + visual-resilience win**, not a React-perf win. (True React-perf savings on selection would require dropping `RenderContext.isSelected` from the public API — that's a breaking change, out of scope for v0.2.0; revisit at v0.3+ if measurements demand.)

**Adapter change:** [`NodeAdapter` at node-adapter.tsx](../../../src/registry/components/data/flow-canvas-01/parts/node-adapter.tsx) currently passes `selected` to `<NodeShell>`. Stops passing it. `RenderContext.isSelected` continues to be populated from xyflow's `selected` prop for the renderer's own use.

### F-03 — Tier 1 success criteria: replace with bars that actually prove value

**Description's bars (Tier 1):** light ≥50 FPS at N=500; heavy ≥50 FPS at N=200. Both trivially met by v0.1.4 alone — the bars don't prove Tier 1 ships value.

**Lock:** Tier 1 success criteria for v0.2.0 ship gate (replacing description §4.1):

- **Light fixture, post-Tier-1, vis-on (now default):** min FPS ≥ 50 at N=2000.
- **Heavy fixture, post-Tier-1, vis-on (now default):** min FPS ≥ 50 at N=1000.
- **Anti-regression:** light at N=200 + heavy at N=200 stay ≥ v0.1.4 baseline (no silent regression from the `fireOnChange` batching).
- **Subjective smoothness:** dragging a node across the viewport at N=2000 light feels smooth (no perceived stutter), validated against the [protocol §9 rule](research/2026-05-14-measurement-protocol.md#L150-L151) (eyes beat overlay).
- **Zero new TypeScript / lint errors; `validate:meta-deps` clean.**
- **Spot-check review** authored at `reviews/<YYYY-MM-DD>-v0.2.0-spotcheck.md`.

**Why these numbers:** N=2000 light is the upper-bound test cell in the protocol matrix and the natural "raised ceiling" target above v0.1.4's demonstrated N=1000 floor. N=1000 heavy is the corresponding heavy cell — the heavy fixture's per-node render cost gates higher N.

### F-04 — `fireOnChange` batching: soft behavior change, document the delta

**Description's wording:** *"None. Consumers can't observe per-tick vs per-end fires without instrumenting their own callback."* Overconfident — autosave / undo-stack / collab consumers absolutely observe the delta.

**Lock:** treat as a documented soft behavior change in v0.2.0 release notes. No escape hatch prop in v0.2.0 (premature — no real consumer has reported needing per-tick fires; the dynamicity-primacy memory says "add it later" is the wrong frame for actual API but a one-line opt-out is cheap if a consumer asks).

**Release-notes line (locked text for v0.2.0):**

> **Behavior change:** `onChange` no longer fires on every drag tick — only on drag-end. The change reduces consumer-callback overhead by ~50% at N=1000. Consumers that depend on per-tick fires (autosave during drag, real-time collab broadcast) can either (a) debounce on the receiving side as before (unchanged on the wire — they now just receive at drag-end instead of intermediate ticks), or (b) wire to the existing xyflow `onNodeDrag` callback if they need per-tick granularity. File an issue if neither path works.

**Implementation:** the existing [`fireOnChange` at use-canvas-data.ts:222-238](../../../src/registry/components/data/flow-canvas-01/hooks/use-canvas-data.ts#L222-L238) is called from [`onNodesChange` at line 240](../../../src/registry/components/data/flow-canvas-01/hooks/use-canvas-data.ts#L240-L249) on every node change. The batching wraps this:

- Maintain a ref `isDraggingRef` updated by xyflow's `onNodeDragStart` / `onNodeDragStop` (already-exposed callbacks).
- During drag (`isDraggingRef.current === true`), the `position`-only path-of-changes skips `fireOnChange` entirely.
- On `onNodeDragStop`, fire once with current `nodes` / `edges` / `viewport`.
- All other change types (add, remove, select, dimensions) fire immediately as today.

This satisfies both description §4.1 Change #2 (batch during drag) and Change #3 (skip the re-map when only position changed) — the skip is what makes "fire once at end" cheap; the changes set is filtered to position-only by the dragging-state ref before going into the re-map at end-of-drag.

### F-05 — Tier 3 LOD handle-count invariant (amendment to description, lands in v0.3 plan)

**Description's wording:** *"if a renderer changes handle count between modes it MUST call `useUpdateNodeInternals(nodeId)`."* Under-specified for mid-pan transitions.

**Lock (for v0.3 plan to absorb):** LOD renderers MUST keep **handle count and handle positions constant across all LOD modes**. Hide visually via `opacity: 0`, never `display: none` or conditional return. `useUpdateNodeInternals` becomes the escape hatch for renderers that knowingly opt out of the invariant (rare; not the default pattern). This matches the xyflow-react-pro skill's pitfall list ([SKILL.md `<Handle>` section](../../../.claude/skills/xyflow-react-pro/SKILL.md)).

**Plan-stage action:** this finding is FYI for v0.2.0 (no Tier 3 implementation here). The amendment is logged in the v0.2 plan because the description is signed-off and post-signoff changes must be loud. The v0.3 plan picks this up explicitly.

### F-06 — Multi-machine measurement: pick a practical framing

**Protocol's wording:** *"every available developer machine"* with min-FPS-across-machines as the success criterion. Solo-developer project; baseline already breaks the rule (hardware logged as `<unspecified>`).

**Lock:** option **(a) — best-effort framing**. Protocol §1 amendment (for v0.2.0 ship gate):

- **≥1 machine required** for any measurement that informs a tier ship. Hardware MUST be fully logged per the existing protocol §1 template.
- **≥2 machines strongly preferred.** If 2+, use min-FPS across machines as the success bar.
- **If 1 machine:** include a `Caveat: cross-machine variance unmeasured` line in the measurement file's header. Don't claim it as a multi-machine result.
- **Consumer-reported regression on different hardware triggers re-baseline** on that hardware class (laptop iGPU vs desktop dGPU vs Apple Silicon, ARM Windows, etc.).

**Plan-stage action:** when the §6 step 1 re-baseline runs, the user's primary dev machine is the floor. If a second machine is available (incognito profile, work laptop, etc.) it's a bonus. Don't block Tier 1 ship on a second machine; do block on hardware-fully-logged.

**Why option (a) over option (b):** keeps the protocol's intent (catching cross-hardware regressions) while admitting current reality. Option (b) would have to be undone the moment a second contributor joins.

### F-07 — Tier 3 canvas edge selection model: enumerate the open questions (v0.3 plan to lock)

**Description's wording:** Q30 deferred to GATE 2 as "cosmetic only."

**Lock (for v0.3 plan to absorb):** four open questions the v0.3 plan must answer before any canvas-mode code lands:

1. **Edge hit-test precision** — what px-tolerance defines a click on a canvas-rendered edge? SVG mode benefits from `BaseEdge`'s built-in stroke-width hit-test; canvas needs an explicit radius (recommend `8px` along the path's nearest-segment distance).
2. **Z-order between canvas + SVG layers** — `<MiniMap>` (deferred v0.2 candidate) and any consumer-side overlay sit above/below canvas-rendered edges. v0.3 plan locks the stacking context.
3. **Multi-select feedback** — what visual delta distinguishes one selected edge from multiple? SVG mode currently uses `--ring` color + 2.5px width uniformly. Canvas mode: same or different?
4. **Hover affordance** — SVG `BaseEdge` benefits from CSS `:hover` cheaply; canvas needs an explicit render path (hover-tracking ref + re-paint). Plan locks the perf trade-off.

**Plan-stage action:** same as F-05 — FYI for v0.2.0, captured here so the v0.3 plan inherits the resolved questions without re-discovery.

### 3.5 Plan re-validation findings (V-series, 2026-05-16)

Second-pass re-validation of this plan against the v0.1.4 actual code state. Six findings surfaced; each was resolved IN PLACE in the section it affects (rather than added as new top-level scope), and each carries the section it amends so a reader can trace why text reads the way it does.

| ID | Severity | Resolved in | One-line summary |
|---|---|---|---|
| **F-V1** | ⚠️ High | §3 F-02 ("What this change actually buys" paragraph) | Selection-ring change's perf-justification was wrong: NodeShell still re-renders because NodeAdapter passes fresh children every render; NodeAdapter itself re-renders because xyflow changes the `selected` prop; renderer re-renders because `RenderContext.isSelected` is public API. Reframed as a CSS-driven visual + clarity win, NOT a React-perf win. Change still ships. |
| **F-V2** | 🔸 Med | §6 step 4, §11 #4, Appendix B preamble | Release-notes destination locked: `.claude/decisions/<date>-flow-canvas-v0.2.0-perf-bundle.md` (full text per Appendix B) + STATUS.md "Last updated" lead (terse paraphrase) + `docs/component-versions.md` row + Highlights bullet. No centralized per-version release-notes file exists in this project — verified. |
| **F-V3** | 🔸 Med | §10 Impl-time, §11 #7 | `flow-canvas-01.css` ships as `type: "registry:file"`, NOT `registry:component` — verified precedent: `engagement-bar-01/parts/engagement-heart-burst.css` already follows this. The literal CLAUDE.md "every file registry:component" wording overstates; .css is the exception. `lib/shallow.ts` stays as `registry:component`. |
| **F-V4** | 🔹 Low | §4.2 (pattern note after `onNodeDragStop`) | Calling `fireOnChange` from inside a `setInternalNodes` reducer is a React idiom violation. **Picked: consistency** — eleven existing sites in `use-canvas-data.ts` already do exactly this. Propagate the pattern in `onNodeDragStop`; flag the broader cleanup as a v0.3 candidate. |
| **F-V5** | 🔹 Low | §10 F-08 (reframed) | F-08 originally said "re-anchor refs IN THE PLAN to symbol names" but the plan extensively uses line numbers. Reframed: the plan's pre-edit line numbers are fine for its lifetime (they anchor to the state we planned against); future docs (v0.3 plan, future reviews) reference symbols, not lines. |
| **F-V6** | 🔸 Med | §3 F-02 CSS sample, §5.3 CSS rule | `border-radius: inherit` would inherit from NodeShell (no border-radius) and OVERRIDE the renderer's existing `rounded-md` → sharp corners. Removed. `box-shadow` already conforms to the element's own border-radius automatically — no inheritance needed. |

None of the V-findings expand scope. All are clarifications, lock-downs of TBD items, or corrections to claims/code samples within sections already locked. The plan's structural shape — Tier 1 + Tier 2 in v0.2.0, file-by-file edits in §4/§5, sequencing in §6 — is unchanged.

---

## 4. Tier 1 changes — file-by-file plan

### 4.1 Default flip: `onlyRenderVisibleElements: true`

**File:** [src/registry/components/data/flow-canvas-01/parts/canvas.tsx](../../../src/registry/components/data/flow-canvas-01/parts/canvas.tsx)

```ts
// line 78 currently:
onlyRenderVisibleElements = false,
// becomes:
onlyRenderVisibleElements = true,
```

**File:** [src/registry/components/data/flow-canvas-01/types.ts](../../../src/registry/components/data/flow-canvas-01/types.ts)

JSDoc on `FlowCanvasProps.onlyRenderVisibleElements` (currently lines 155-159) rewritten:

```ts
/**
 * When true (default v0.2.0+), xyflow culls nodes + edges outside the viewport
 * before rendering. Transforms perf at large N (5k+ heavy: ~12× FPS lift on
 * one machine). Marginal effect below ~200 nodes.
 *
 * Known caveats (don't block adoption):
 * - All nodes still render on initial mount; culling kicks in after first
 *   viewport movement (xyflow issue #4378).
 * - Offscreen edges may stutter if their offscreen target node has an
 *   explicit height (xyflow issue #4329).
 *
 * Pass `={false}` to opt out (e.g. if you rely on offscreen-node DOM for
 * layout measurement — rare).
 */
onlyRenderVisibleElements?: boolean;
```

### 4.2 `fireOnChange` batching during continuous drag

**File:** [src/registry/components/data/flow-canvas-01/hooks/use-canvas-data.ts](../../../src/registry/components/data/flow-canvas-01/hooks/use-canvas-data.ts)

Add a drag-state ref (mirrors xyflow's drag lifecycle):

```ts
const isDraggingRef = useRef(false);
```

Expose two new internal callbacks consumed by `<ReactFlow>` props in canvas.tsx:

```ts
const onNodeDragStart = useCallback(() => {
  isDraggingRef.current = true;
}, []);

const onNodeDragStop = useCallback(() => {
  isDraggingRef.current = false;
  // Flush a final onChange with the latest committed state. Using the
  // setInternalNodes reducer to read fresh state synchronously —
  // `nodesRef.current` is mirrored by an existing useEffect (lines 180-182)
  // and may be one tick stale if drag-stop fires in the same tick as the
  // last position change. The reducer-with-return-unchanged pattern reads
  // the committed React state without triggering a re-render.
  setInternalNodes((latestNodes) => {
    fireOnChange(latestNodes, edgesRef.current, viewportRef.current);
    return latestNodes;
  });
}, [fireOnChange]);
```

**F-V4 pattern note (2026-05-16):** firing `fireOnChange` from inside a `setInternalNodes` reducer is a React idiom violation (reducers should be pure). **Picked: consistency.** Verified that the existing v0.1.4 code does exactly this in `onNodesChange`, `onEdgesChange`, `onConnect`, `appendNode`, `updateNodeData`, `deleteNode`, `deleteEdge`, `setNodes`, `setEdges`, `replace`, and `extractSubObject` — eleven sites in `use-canvas-data.ts` follow the same pattern. Propagating it in `onNodeDragStop` matches the established shape and avoids a one-off divergence. Cleaning up all twelve sites to use refs + `flushSync` (or similar) is a **v0.3 cleanup candidate**, not a v0.2.0 deliverable.

Modify `onNodesChange` (currently lines 240-249) to skip `fireOnChange` during drag IF all changes in the batch are `position` type:

```ts
const onNodesChange = useCallback(
  (changes: NodeChange<XyNode<XyNodeData>>[]) => {
    setInternalNodes((prev) => {
      const next = applyNodeChanges(changes, prev);
      const isAllPositionChanges = changes.every((c) => c.type === "position");
      if (isDraggingRef.current && isAllPositionChanges) {
        // Skip the per-tick consumer callback during drag — onNodeDragStop
        // flushes a final fire with the committed state.
        return next;
      }
      fireOnChange(next, edgesRef.current, viewportRef.current);
      return next;
    });
  },
  [fireOnChange],
);
```

**Wiring:** [canvas.tsx](../../../src/registry/components/data/flow-canvas-01/parts/canvas.tsx) `<ReactFlow>` gains `onNodeDragStart={canvas.onNodeDragStart}` and `onNodeDragStop={canvas.onNodeDragStop}` (these are existing xyflow props, currently unset).

**Hook return shape:** `UseCanvasDataResult` ([use-canvas-data.ts:105-136](../../../src/registry/components/data/flow-canvas-01/hooks/use-canvas-data.ts#L105-L136)) gains two new fields:

```ts
export type UseCanvasDataResult = {
  // ...existing fields...
  onNodeDragStart: () => void;
  onNodeDragStop: () => void;
};
```

Type extension only — `UseCanvasDataResult` is exported but not part of `FlowCanvasProps`, so no public-API surface change. The hook itself is internal-only ([not re-exported from index.ts](../../../src/registry/components/data/flow-canvas-01/index.ts)).

### 4.3 Skip the re-map on position-only changes

**Done implicitly by 4.2** — the `isAllPositionChanges + isDragging` short-circuit skips both `fireOnChange` and the `nodes.map(fromXyNode)` it would call. No additional refactor needed. Description §4.1 Change #3 absorbed.

---

## 5. Tier 2 changes — file-by-file plan

### 5.1 New file: `lib/shallow.ts`

**Path:** `src/registry/components/data/flow-canvas-01/lib/shallow.ts`

```ts
/**
 * Inline shallow-equality helper. Matches zustand's shallow algorithm
 * (zustand v3/v4/v5 — algorithm unchanged) without taking on a transitive
 * dep. Used by useStore selectors that return small object shapes where
 * identity-only equality (the zustand default) thrashes — e.g. selectors
 * that look up an object in a Map and return it (same lookup, same object,
 * but xyflow's store updates the Map reference per change, so the selector
 * returns a fresh reference even when the underlying object is unchanged).
 *
 * Map / Set comparison is intentionally omitted — selectors in this codebase
 * never return those.
 */
export function shallow<T>(a: T, b: T): boolean {
  if (Object.is(a, b)) return true;
  if (typeof a !== "object" || a === null) return false;
  if (typeof b !== "object" || b === null) return false;
  const aKeys = Object.keys(a as object);
  const bKeys = Object.keys(b as object);
  if (aKeys.length !== bKeys.length) return false;
  for (const k of aKeys) {
    if (!Object.prototype.hasOwnProperty.call(b, k)) return false;
    if (!Object.is((a as Record<string, unknown>)[k], (b as Record<string, unknown>)[k])) return false;
  }
  return true;
}
```

### 5.2 `DefaultEdge` selector: narrow port comparator

**File:** [src/registry/components/data/flow-canvas-01/parts/default-edge.tsx](../../../src/registry/components/data/flow-canvas-01/parts/default-edge.tsx)

```ts
// File-private comparator (not exported — narrowly scoped to this selector)
const portEqual = (a?: Port, b?: Port) =>
  a === b || (a?.id === b?.id && a?.type === b?.type && a?.multi === b?.multi);

// ...inside DefaultEdgeImpl, lines 38-43:
const sourcePort: Port | undefined = useStore(
  (s) => {
    if (!source || !sourceHandleId) return undefined;
    const node = s.nodeLookup.get(source);
    if (!node) return undefined;
    return findPortInTree(node.data as NodeData, sourceHandleId)?.port;
  },
  portEqual,
);
```

**Why narrow comparator:** the selector's returned shape is `Port | undefined`. Only three fields (`id`, `type`, `multi`) are used downstream — `portType` lookup keys on `port.type`; `multi` affects connect-time validation (not used inside `DefaultEdge` but kept stable for any future use). `label` and `side` are renderer-internal; changing them shouldn't re-render the edge.

**Anti-regression check:** verify edges still re-stroke when port `type` changes — open the demo at `/components/flow-canvas-01`, drag a node whose source port type changes via consumer-side edit, confirm edge color updates.

### 5.3 Selection ring: decouple from React-prop re-render

Per F-02 resolution. Three coupled edits:

**File 1:** [node-shell.tsx:14-52](../../../src/registry/components/data/flow-canvas-01/parts/node-shell.tsx#L14-L52) — drop `isSelected` prop.

```ts
function NodeShellImpl({
  isLocked,
  className,
  children,
}: {
  isLocked: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      data-locked={isLocked}
      tabIndex={0}
      className={cn(
        "relative outline-none",
        // Selection ring moved to xyflow's .react-flow__node.selected class
        // (see sealed-folder flow-canvas-01.css). Focus-visible kept here
        // because xyflow doesn't own focus state.
        // Tailwind v4 canonical: `*:` shorthand replaces `[&>*]:` (canonicalized
        // during this v0.2.0 edit; existing node-shell.tsx uses the legacy form).
        "focus-visible:*:ring-2 focus-visible:*:ring-ring/60",
        className,
      )}
    >
      {children}
      {/* lock chip unchanged */}
    </div>
  );
}
```

**File 2:** new sealed-folder `src/registry/components/data/flow-canvas-01/flow-canvas-01.css` — CSS rule keyed on xyflow's class, two levels deep to match v0.1.x ring placement.

```css
/* flow-canvas-01 selection ring — driven by xyflow's wrapper class.
 * Decouples the selection VISUAL from React re-render (v0.2.0). React-side
 * re-render savings on selection are nil per F-V1 (NodeAdapter still
 * re-renders); this rule's win is the visual being a pure CSS effect.
 *
 * DOM hierarchy when a node is selected:
 *   <div class="react-flow__node ... selected">     ← xyflow's wrapper
 *     <div class="relative outline-none">           ← NodeShell
 *       <renderer-output />                          ← ring target (v0.1.x parity)
 *       <span class="lock chip" />                   ← also rings, matches v0.1.x
 *     </div>
 *   </div>
 *
 * The `> * > *` selector targets NodeShell's direct children — the same
 * elements v0.1.x ringed via NodeShell's `data-[selected=true]:[&>*]:ring-2`.
 * One level shallower (`> *`) would ring NodeShell itself; that's a visual
 * regression vs v0.1.x. Anti-regression check at §6 step 3.
 *
 * NO `border-radius: inherit` (F-V6, 2026-05-16): renderer outputs already
 * carry their own border-radius (e.g. `rounded-md` on CustomJsonNode); the
 * CSS `box-shadow` automatically conforms to the element's own border-radius
 * — no inheritance needed. Setting `border-radius: inherit` here would pull
 * NodeShell's (none) and OVERRIDE the renderer's rounded corners. Don't.
 */
.react-flow__node.selected > * > * {
  box-shadow: 0 0 0 2px var(--ring);
}
```

**Import:** [canvas.tsx](../../../src/registry/components/data/flow-canvas-01/parts/canvas.tsx) gets a side-effect import at the top — `import "../flow-canvas-01.css";` — which Turbopack bundles + injects automatically; consumers receive the file on install + the same relative import resolves post-install.

**Why sealed-folder, not globals.css:** the project's registry-portability rule (CLAUDE.md "Registry conventions") forbids registry code depending on app-level state. Three options considered:
- **(a)** `globals.css` — works for the docs site but breaks portability when the component is consumed via `pnpm dlx shadcn add` (consumer's globals.css doesn't get the rule).
- **(b)** `styled-jsx`'s `<style jsx global>` — works at runtime but registry rule forbids deps beyond `react / @/components/ui/* / @/lib/utils + declared third-party`. `styled-jsx` ships transitively with Next.js but isn't allowed as a registry-code dependency.
- **(c) LOCKED** — sealed-folder `flow-canvas-01.css` side-effect imported by `canvas.tsx`. Registry-portable; consumers get it on install; F-cross-07 lint won't flag it (the validator tracks `npm` deps, not `.css` siblings).

**File 3:** [node-adapter.tsx](../../../src/registry/components/data/flow-canvas-01/parts/node-adapter.tsx) — stop passing `selected` to `<NodeShell>`. `RenderContext.isSelected` continues to be populated for the renderer's own use (read-only flag).

### 5.4 Renderer-author rule doc (description §4.2 Change #3)

**File:** [docs/procomps/flow-canvas-01-procomp/flow-canvas-01-procomp-guide.md](flow-canvas-01-procomp-guide.md) — adds a new top-level section **"Performance & scale"** with two subsections:

- **Custom edge selection state** — *"if you need to react to source/target node selection inside a custom edge, query xyflow's store via `useStore(s => s.nodeLookup.get(id).selected)`, NOT via per-edge React state."* Cite [xyflow discussion #4975](https://github.com/xyflow/xyflow/discussions/4975).
- **Popup-edit renderer convention** — per description Q33. Renderer = read-only display + `onClick → ctx.onEditRequest?.(nodeId)` (note: `onEditRequest` is a v0.3 addition to `RenderContext`; for v0.2 the convention is documented but consumer-side `onClick` handlers do their own dialog opening). Cite rich-card-in-flow track as future canonical consumer.

**Plan-stage action:** the "Performance & scale" guide section is part of the v0.2.0 deliverables, NOT a v0.3.0 split. F-04's release-notes line is referenced from this section.

---

## 6. Sequencing

Tier 1 + Tier 2 ship as one v0.2.0 bundle. Internal sequencing minimizes review surface per commit:

1. **Re-baseline (no code change).** Open sandbox stress page in incognito → run the protocol §3 5-second-drag matrix at N = 100, 200, 500, 1000, 2000 for both light + heavy fixtures. File results under `research/<YYYY-MM-DD>-baseline-fresh.md`. Hardware fully logged per F-06's amended protocol. **No commits.**
2. **Tier 1 implementation (commit 1):** §4.1 + §4.2 + §4.3. JSDoc rewrite + canvas.tsx default + use-canvas-data.ts drag batching. Run measurement matrix again, file as `<date>-tier1-postship.md`. Verify §3 F-03 success criteria met.
3. **Tier 2 implementation (commit 2):** §5.1 + §5.2 + §5.3. New `lib/shallow.ts` + default-edge selector + selection-ring CSS decoupling. Run matrix once more, file as `<date>-tier2-postship.md`. (This is the v0.2.0 final measurement file.)
4. **Guide update (commit 3):** §5.4 — "Performance & scale" section added to procomp guide. Release-notes destination (F-V2 lock, 2026-05-16): there is NO centralized per-version release-notes file in this project — `docs/component-versions.md` is a current-snapshot table, not a per-release log. Release notes for v0.2.0 land in **two** places, both project convention: (a) the v0.2.0 decision file at `.claude/decisions/<date>-flow-canvas-v0.2.0-perf-bundle.md` (Appendix B verbatim text goes here), and (b) the STATUS.md "Last updated" lead (terse, matches the existing pattern for other recent ships). Also update the `flow-canvas-01` row in `docs/component-versions.md` (version + Highlights bullet).
5. **`meta.ts` version bump (commit 4):** `0.1.4 → 0.2.0`, `updatedAt: <date>`. `validate:meta-deps` clean.
6. **registry.json regeneration (commit 4 or 5):** ensure both new files are in the base item's `files` array — `lib/shallow.ts` as `registry:component` and `flow-canvas-01.css` as `registry:file` (per §10 Impl-time F-V3 lock). `pnpm registry:build`. Smoke-test from the consumer harness at `e:/tmp/ilinxa-smoke-consumer/` (per [project_smoke_harness memory](../../../.claude/projects/.../memory/project_smoke_harness.md)) — confirm the .css file is fetched + the side-effect import resolves consumer-side.
7. **GATE 3 spot-check review** authored at `reviews/<date>-v0.2.0-spotcheck.md`. Rotating dimension: **performance** (obviously). Verdict must be `Pass` or `Pass with follow-ups` per the [readiness-review rule](../../../.claude/rules/component-readiness-review.md).
8. **STATUS.md update + decision file** for the v0.2.0 ship.
9. **Commit + push** (Vercel auto-deploys).

**Each step's local verification:** `pnpm tsc --noEmit && pnpm lint && pnpm validate:meta-deps`. The HANDOFF's two pre-existing virtualizer warnings stay; no new lint signal.

---

## 7. Public API matrix (v0.2.0)

| Surface | v0.1.4 | v0.2.0 | Migration |
|---|---|---|---|
| `FlowCanvasProps.onlyRenderVisibleElements` | optional, default `false` | optional, default `true` | Pass `={false}` to opt out |
| `FlowCanvasProps.onChange` fire cadence | every node change | every change except per-tick drag (fires on drag-stop) | Receivers debounce or wire `onNodeDrag` if per-tick needed |
| `RenderContext.isSelected` | populated | populated, unchanged | none |
| `NodeShell.isSelected` prop (internal) | exists | **removed** | None — internal type |
| `lib/shallow.ts` | n/a | new file | None — internal helper |
| `flow-canvas-01.css` | n/a | new file (sealed-folder) | None — auto-imported by canvas.tsx |
| Public types (`Port`, `NodeRecord`, `EdgeRecord`, etc.) | as-is | unchanged | none |

**Net:** one observable default flip, one observable soft behavior change, zero type-level breaking changes.

---

## 8. Edge cases

- **Consumer that pre-passes `onlyRenderVisibleElements={false}` explicitly:** unaffected — opt-out value wins over new default. Verify via demo's "Stress" tab.
- **Consumer with no `onChange` wired:** `fireOnChange` does nothing today (`if (!cb) return`); behavior unchanged.
- **Consumer that wires `onChange` to React state setter:** batching means setState fires fewer times per drag — same end state, fewer renders. Strict improvement.
- **Drag cancelled (Escape key during drag):** xyflow fires `onNodeDragStop` regardless. Our final `fireOnChange` flushes correctly.
- **Drag interrupted by external state update (controlled mode):** `useEffect` at [use-canvas-data.ts:213-220](../../../src/registry/components/data/flow-canvas-01/hooks/use-canvas-data.ts#L213-L220) re-syncs from `data` prop. Drag state ref still says `true` if we were mid-drag; xyflow's drag handler should clear it on the next drag-stop. Acceptable — even if it doesn't, the worst case is one missed `fireOnChange` flush, but the next change fires it.
- **Selection ring in dark theme:** `var(--ring)` resolves correctly in both light + dark via the existing OKLCH tokens. Visual regression check is part of §6 step 3.
- **Custom edge selector returning `undefined` repeatedly:** `portEqual(undefined, undefined) === true` via the `a === b` fast path. No infinite re-render.
- **Renderer that DOES care about `isSelected` for content (not just ring):** still gets it via `RenderContext.isSelected`. Will re-render on selection change (its own choice) — same as v0.1.4, no change. (Per F-V1: dropping the prop from `<NodeShell>` doesn't reduce React reconciliation on selection; the win is the visual ring being CSS-driven.)

---

## 9. Risks (v0.2.0-scoped, not the description's full list)

- **CSS-only selection ring loses keyboard focus visibility.** `:focus-visible` is preserved on `<NodeShell>` (§5.3). Anti-regression check: tab to a node in the demo, confirm focus ring appears.
- **`box-shadow`-based ring breaks against existing renderer surfaces with their own `box-shadow`.** Possible — most renderers don't, but `CustomJsonNode`'s `shadow-sm` could stack. Plan-stage check at §6 step 3: render the demo and verify ring appears OVER any per-renderer shadow. If conflict, switch ring to `outline: 2px solid var(--ring); outline-offset: 0`.
- **`flow-canvas-01.css` not picked up by Tailwind's content scanner.** The CSS file references `var(--ring)` which is an existing CSS variable, not a Tailwind class — no scanner involvement needed. But if the file's class selectors include Tailwind utilities (it doesn't), `@source` directives in `globals.css` would be needed. Verified at impl time.
- **`fireOnChange` drag batching breaks consumers that rely on per-tick fire.** Already covered by F-04 release-notes line. Risk is small (no consumer reports yet) but real if one exists in the wild.
- **`portEqual` comparator misses a `type` change that the renderer cares about.** Comparator covers `id` + `type` + `multi`; if a future port adds a field that affects rendering, the comparator won't catch it. Mitigation: revisit `portEqual` when adding any new `Port` field that affects `DefaultEdge` rendering (currently: only `type` affects color).
- **Re-baseline measurements show Tier 1 doesn't move the needle.** If v0.1.4's accidental gains were so large that Tier 1's default-flip adds <5 FPS at the N matrix, ship anyway — the default-flip is a "make it free for every consumer" lever, not a "lift the FPS curve" lever. Document the dichotomy in the v0.2.0 review file.
- **Tier 2 selection-ring CSS rule conflicts with a future custom renderer's own ring/border.** Targeting `.react-flow__node.selected > * > *` (renderer output level) is narrow. Mitigation: documented in the guide; renderer authors can override with higher specificity if needed.

---

## 10. Plan-stage TODOs (F-08, F-09, F-10 + impl-time items)

- **F-08** (F-V5 reframe, 2026-05-16) — Description's Appendix C line refs are stale post-v0.1.4. Don't edit the description (signed-off). **This plan's existing line numbers are pre-edit anchors and are fine for its lifetime** — they fix the historical state we planned against. The rule going forward: **post-v0.2.0 docs (v0.3 plan, future reviews) reference symbol names** (e.g. `fireOnChange` in `use-canvas-data.ts`) rather than line numbers, because v0.2.0's commits will shift every line ref in this file.
- **F-09** — Q31 LOD defaults (`dotZoom: 0.4`, `cardZoom: 0.8`) lack empirical backing. **Defer to v0.3 plan.** v0.3 plan must test readability at DPR 1x / 1.5x / 2x with the heavy fixture before locking.
- **F-10** — JSDoc on `onlyRenderVisibleElements` rewrite is locked at §4.1.
- **Impl-time** — when scaffolding `lib/shallow.ts`, verify the `flow-canvas-01` `index.ts` does NOT re-export it (internal helper only). The component's barrel exposes public types only.
- **Impl-time** (F-V3 lock, 2026-05-16) — `registry.json` for `flow-canvas-01` base item needs two new entries in its `files` array: `lib/shallow.ts` as **`type: "registry:component"`** (matches the locked CLAUDE.md convention for .ts files), and `flow-canvas-01.css` as **`type: "registry:file"`** (CSS exception — verified precedent: `engagement-bar-01/parts/engagement-heart-burst.css` already ships as `registry:file`, NOT `registry:component`. The literal "every file registry:component" wording in CLAUDE.md overstates; .css is the exception). Both use the locked target convention (`target: "components/flow-canvas-01/<sub-path>"`).
- **Impl-time** — when adding the "Performance & scale" guide section, also add a back-link from `usage.tsx` (the renderer-author rule belongs in usage as well, since it's the consumer-facing artifact per the [procomps README §"What this directory is NOT"](../README.md#what-this-directory-is-not)).
- **Impl-time** — `validate:meta-deps` will see no new npm imports (the inline shallow + sealed-folder CSS approach means meta.ts deps don't change). Verified: the script walks only `.tsx?|m?js` files (the .css file isn't scanned) and `npmPkgFromImport` returns `null` for relative paths (so the `import "../flow-canvas-01.css"` side-effect import isn't flagged either). Confirm 42/42 clean before each commit.

---

## 11. Definition of done (this v0.2.0 plan)

The plan is "done" — i.e., scaffolding (= no scaffolding needed here; component exists) and Tier 1+2 implementation — **when ALL of the following hold**:

1. §6 step 1 fresh baseline measurement filed under `research/`.
2. §6 step 2 + step 3 commits land all the file edits listed in §4 + §5.
3. F-03's revised Tier 1 success criteria measurably met (filed in `<date>-tier2-postship.md`).
4. F-04's release-notes line + Appendix B's locked text land in the v0.2.0 decision file at `.claude/decisions/<date>-flow-canvas-v0.2.0-perf-bundle.md` AND a terse version is in STATUS.md's "Last updated" lead (F-V2 lock — verified there is no centralized per-version release-notes file; decision file + STATUS lead IS the project's release-notes pattern). `docs/component-versions.md` row + Highlights bullet also updated.
5. Procomp guide has the new "Performance & scale" section (§5.4).
6. `meta.ts` bumped to `0.2.0`, `updatedAt` set.
7. `registry.json` includes `lib/shallow.ts` as `registry:component` AND `flow-canvas-01.css` as `registry:file` (F-V3 lock — CSS is the registry:component exception per engagement-heart-burst.css precedent).
8. `pnpm tsc --noEmit && pnpm lint && pnpm validate:meta-deps` clean.
9. `pnpm build` succeeds.
10. Spot-check review at `reviews/<date>-v0.2.0-spotcheck.md` — verdict ≥ `Pass with follow-ups`.
11. STATUS.md updated; decision file authored.
12. Push to master (Vercel auto-deploys).

After sign-off of THIS plan doc (GATE 2), no scaffolding-time second-guessing — implementation follows the plan, deviations are loud and documented.

---

## Appendix A — what this plan deliberately does NOT cover

- **Tier 3 (canvas edge overlay + LOD)** — v0.3.0 scope. F-05 + F-07 amendments captured here for the v0.3 plan to absorb.
- **MiniMap, undo/redo, marquee select** — v0.2 non-perf candidates per description §2; scoped separately, not in this plan.
- **rich-card-in-flow system** — parallel track (Q35); its own description doc, its own plan doc.
- **Worker-based force layout, automated perf regression tests** — description §2 deferral; unchanged.
- **A second perf-related component (`graph-canvas-01` sibling procomp)** — Tier 4 scope; out of this component's reach.

---

## Appendix B — locked text for v0.2.0 release notes

(Single text block to drop verbatim into the v0.2.0 decision file at `.claude/decisions/<date>-flow-canvas-v0.2.0-perf-bundle.md` per the F-V2 lock. A terse paraphrase — first paragraph only — also lands in STATUS.md's "Last updated" lead. `docs/component-versions.md` gets a one-line Highlights bullet pointing back to the decision file.)

> ### `flow-canvas-01` v0.2.0 — Tier 1 + Tier 2 perf bundle (2026-MM-DD)
>
> **Default change:** `onlyRenderVisibleElements` now defaults to `true`. Transforms perf at large N (12–20× FPS lift on the protocol's stress matrix at the high end). Pass `={false}` to opt out — only needed if your consumer code relies on offscreen-node DOM (rare; e.g. layout measurement of nodes outside the viewport).
>
> **Behavior change:** `onChange` no longer fires on every drag tick — only on drag-end. Reduces consumer-callback overhead by ~50% at N=1000. Consumers that depended on per-tick fires (autosave during drag, real-time collab broadcast) can either (a) debounce on the receiving side as before — unchanged on the wire, just received at drag-end instead — or (b) wire to xyflow's `onNodeDrag` callback if per-tick granularity is needed. File an issue if neither path works.
>
> **Internal:** `DefaultEdge`'s xyflow store selector now uses a narrow port comparator (avoids re-rendering on unrelated store updates). Selection ring **visual** now driven by xyflow's `.react-flow__node.selected` CSS class — the ring applies as a pure browser-side effect regardless of React reconciliation timing (no React-render savings on selection; the win is visual resilience + a cleaner `<NodeShell>` contract). New sealed-folder `flow-canvas-01.css` auto-imported by `canvas.tsx`.
>
> **No breaking type changes.** All v0.1.x types (`Port`, `NodeRecord`, `EdgeRecord`, etc.) unchanged.
>
> **Measured (per [protocol](docs/procomps/flow-canvas-01-procomp/research/2026-05-14-measurement-protocol.md), single dev machine, hardware logged in [research/](docs/procomps/flow-canvas-01-procomp/research/)):** light fixture at N=2000 min ≥50 FPS; heavy fixture at N=1000 min ≥50 FPS. (Numbers filled in at impl time from `<date>-tier2-postship.md`.)

---

## Appendix C — Cross-references

- v0.2.0 description (signed off): [flow-canvas-01-v0.2.0-perf-description.md](flow-canvas-01-v0.2.0-perf-description.md)
- v0.1.x description / plan / guide: [flow-canvas-01-procomp-description.md](flow-canvas-01-procomp-description.md), [flow-canvas-01-procomp-plan.md](flow-canvas-01-procomp-plan.md), [flow-canvas-01-procomp-guide.md](flow-canvas-01-procomp-guide.md)
- v0.1.4 decision file: [.claude/decisions/2026-05-14-flow-canvas-v0.1.4-custom-json-handles.md](../../../.claude/decisions/2026-05-14-flow-canvas-v0.1.4-custom-json-handles.md)
- Baseline measurements: [research/2026-05-14-baseline.md](research/2026-05-14-baseline.md) (caveat: overlay-only, single-machine)
- Measurement protocol: [research/2026-05-14-measurement-protocol.md](research/2026-05-14-measurement-protocol.md) (amended by F-06)
- xyflow-react-pro skill: [.claude/skills/xyflow-react-pro/SKILL.md](../../../.claude/skills/xyflow-react-pro/SKILL.md)
- Component-readiness-review rule (GATE 3): [.claude/rules/component-readiness-review.md](../../../.claude/rules/component-readiness-review.md)
- HANDOFF (2026-05-14 pause): [.claude/HANDOFF-2026-05-14-flow-canvas-perf-pause.md](../../../.claude/HANDOFF-2026-05-14-flow-canvas-perf-pause.md)
