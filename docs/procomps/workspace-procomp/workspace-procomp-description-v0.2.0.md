# `workspace` — v0.2.0 Description Addendum (Stage 1 for the alpha → beta promotion ship)

> **Stage:** 1 of 3 (description for the v0.2.0 ship) · **Status: ✅ SIGNED OFF 2026-05-25.** All 9 Q-Ps locked per recommendations (QP-3 reversed during re-validation pass). Unlocks GATE 2 — refresh of [`workspace-procomp-plan.md`](workspace-procomp-plan.md) Phase B section.
> **Targets:** alpha → beta promotion; `version: 0.2.0`.
> **Canonical v0.1.x scope:** [`workspace-procomp-description.md`](workspace-procomp-description.md) — that doc stays frozen as signed-off. This addendum layers **only the deltas** for v0.2.0; everything not explicitly contradicted here carries over.
> **Master plan reference:** [`C:/Users/AsiaData/.claude/plans/lets-create-a-comprehensive-proud-cloud.md`](file:///C:/Users/AsiaData/.claude/plans/lets-create-a-comprehensive-proud-cloud.md) — Phase B section (items B-1..B-9).

The job of this doc: pin down **what changes in v0.2.0 and why**, surface the breaking-change inventory upfront, list the genuine open decisions still requiring a pick, and earn sign-off before any planning or code. Decisions Q1–Q12 from the v0.1.x description remain locked; v0.2.0 only reopens the ones the new scope forces (flagged ⚠ below).

---

## 1. Why a minor bump now

Three pressures justify the alpha → beta promotion:

1. **Architectural gap closures.** v0.1.x's two known structural compromises — the `<Workspace>` having no imperative ref API and the cap-exceeded-tree collapsing into a balanced-split *chain* (depth `log₂(N)`) instead of a true stack — are both fixable in one ship without breaking the rest of the surface.
2. **Footgun retirement.** v0.1.2 documented `onLayoutChange` firing per-rAF tick as a "gotcha" with a debounce recipe. That's defensible for an alpha; for beta it's a structural problem the API should solve, not document. Splitting `onResize` (per-frame) from `onLayoutChange` (commit-only) closes it.
3. **Backlog cash-in.** Three high-demand items (touch/pen gestures, undo/redo, linked-edge resize) have been deferred since v0.1.0 with stable, locked architectural hooks. Pulling them all in one ship lets us write one migration guide instead of three.

The bar for beta is "the API surface a long-term consumer would commit to." Today's v0.1.x doesn't meet it for any of the three reasons above.

---

## 2. What v0.2.0 adds (in scope)

Seven net new items. Each maps to a Phase-B planning item.

| # | What | Maps to | Breaking? |
|---|---|---|---|
| N-1 | **Imperative ref API** — `WorkspaceHandle` (17 methods: 3 tree access + 4 area ops + 2 focus + 2 query + 2 presets + 4 undo/redo). Pattern mirrors `TodoTreeHandle`. | B-1 | No (additive). |
| N-2 | **`stack` kind in `AreaTree`** — closes the v0.1.0 review's F-01 trade-off. `flattenSubtreesPastDepth` emits `stack` nodes instead of balanced-split chains; depth cap is now strictly honored (no "chain has log₂(N) depth below the cap" loophole). | B-2 | **Yes (TS-only).** `AreaTree` discriminator widens `leaf \| split` → `leaf \| split \| stack`. Consumers exhaustively switching on `kind` get a tsc error until they add a `stack` arm. |
| N-3 | **`onResize` per-frame callback split from `onLayoutChange` commit callback.** `onResize?: (next: AreaTree) => void` fires per rAF tick during edge-drag only. `onLayoutChange` semantics narrow to: (a) **resize-commit** — fires on pointer-up / cancel at the end of an edge-drag (previously fired per-frame *and* on pointer-up); (b) **all non-resize action commits** (split, merge, swap, replace-tree from v0.1.x — unchanged, those never were per-frame; undo, redo from v0.2.0 N-4 — same commit-only semantics). | B-3 | **Yes (subtle).** Consumers using `onLayoutChange` for in-flight per-frame feedback lose those callbacks. Opt-back-in: `onResize={onLayoutChange}`. |
| N-4 | **Built-in undo / redo.** New `lib/history.ts`. New props `historyDepth?: number = 50` (`0` disables). New reducer actions `undo` / `redo`. Keyboard `Ctrl/Cmd+Z` + `Ctrl/Cmd+Shift+Z` wired in `use-keyboard-actions.ts`. New handle methods `undo()` / `redo()` / `canUndo()` / `canRedo()`. **This is the explicit reversal of the v0.1.x §2 line "Built-in undo/redo — consumer can wire it via onLayoutChange snapshots; we don't ship a history stack."** | B-4 | No (additive). |
| N-5 | **Touch / pen gesture support.** Pointer Events already in use; adds `touch-action: none` on corner handles + 300ms long-press activation on touch pointer-type (Dual-DnD pattern from `todo-tree`). Default `maxSplitDepth.mobile` `0 → 2`. **Reversal of the v0.1.x §2 line "Touch / pen support for corner gestures — desktop-first in v0.1.0."** | B-5 | **Yes (mobile default).** Default `maxSplitDepth.mobile` changes from `0` to `2`. Opt-out: `maxSplitDepth={{ mobile: 0 }}`. |
| N-6 | **Multi-edge linked resize.** Dragging a divider aligned with another moves both in one tree commit. New `linkedResize?: boolean = true` opt-out prop. | B-6 | **Yes (default behavior change).** Opt-out: `linkedResize={false}`. |
| N-7 | **Corner-drag carries initial ratio.** `Action` `split` variant gains optional `ratio?: number` (default `0.5`); corner gesture computes drag-offset-as-fraction-of-origin and passes it. Keyboard-split + chevron-menu paths unchanged (omit ratio → default 0.5). | B-7 | No (additive). |

## 3. What v0.2.0 still does NOT add (still out of scope)

These remain explicitly deferred past v0.2.0 (mostly v0.3+ candidates):

- **Detach-to-OS-window.** Original concept brief mentions it; architectural hooks (stable area-ids, subtree-serializable) stay in place but no implementation in v0.2.0.
- **DnD-between-areas.** Component swap via dropdown / picker remains the intended path.
- **Cross-tab layout sync.**
- **Live collaborative editing** of layouts.
- **Non-rectangular regions.** Areas remain axis-aligned rectangles.
- **Vitest tests.** Project-wide informed-defer; `lib/` modules stay testable when Vitest lands.

## 4. Updated API sketch (deltas only — not final; plan stage locks)

Only the surface changes vs v0.1.2. Items unchanged from [the canonical description](workspace-procomp-description.md#4-rough-api-sketch-not-final--thats-the-plan-stage) are omitted.

```ts
// AreaTree gains a `stack` discriminator (N-2 — BREAKING TS-only).
type AreaTree =
  | AreaTreeLeaf
  | AreaTreeSplit
  | AreaTreeStack;  // NEW

type AreaTreeStack = {  // NEW — also exported from index.ts for symmetry
  kind: "stack";
  id: string;
  leaves: AreaTreeLeaf[];
};

// QP-7 helper, exported from index.ts. One-line today; insulates against
// later shape evolution (e.g., `leaves` → `children`) without forcing a
// breaking change on consumers writing their own stack renderers.
export function flattenStackToLeaves(stack: AreaTreeStack): AreaTreeLeaf[];

// WorkspaceProps additions / changes.
type WorkspaceProps = {
  // ...all v0.1.2 fields unchanged...

  // N-3: callback split (BREAKING-subtle).
  onResize?: (next: AreaTree) => void;     // per-rAF tick during edge-drag
  onLayoutChange?: (next: AreaTree) => void;  // commit-only (pointer-up / non-resize action)

  // N-4: undo/redo opt-out.
  historyDepth?: number;  // default 50; 0 disables

  // N-6: linked resize opt-out.
  linkedResize?: boolean; // default true

  // N-5: default mobile cap reverses 0 → 2 (BREAKING-default).
  // maxSplitDepth?: number | { mobile?: number; tablet?: number; desktop?: number };
  // New defaults: { mobile: 2, tablet: 3, desktop: 7 } (was { mobile: 0, tablet: 3, desktop: 7 })
};

// N-1: new imperative ref API.
export interface WorkspaceHandle {
  // Tree access
  getLayout(): AreaTree;
  setLayout(next: AreaTree): void;
  resetLayout(): void;

  // Area ops
  splitArea(areaId: string, orientation: SplitOrientation, ratio?: number): string;
  mergeArea(survivorId: string, absorbedId: string): boolean;
  resizeArea(splitPath: number[], ratio: number): void;
  swapComponent(areaId: string, componentId: string): void;

  // Focus
  focusArea(areaId: string | null): void;
  getFocusedAreaId(): string | null;

  // Query
  findArea(areaId: string): AreaTreeLeaf | null;
  listAreas(): ReadonlyArray<AreaTreeLeaf>;

  // Presets
  setActivePreset(id: string): boolean;
  getActivePresetId(): string | null;

  // Undo/redo (N-4)
  undo(): boolean;
  redo(): boolean;
  canUndo(): boolean;
  canRedo(): boolean;
}
```

Public-API surface delta from v0.1.2: **+2 types** (`WorkspaceHandle`, `AreaTreeStack`), **+1 helper export** (`flattenStackToLeaves`), **+3 props** (`onResize`, `historyDepth`, `linkedResize`), **+1 discriminator arm** (`stack` in `AreaTree`), **1 default value change** (`mobile` cap `0 → 2`), **1 prop semantics change** (`onLayoutChange` now commit-only). The `Workspace` component itself becomes a `forwardRef<WorkspaceHandle, WorkspaceProps>` (runtime identity change only — `displayName` preserved; no consumer-visible behavior diff except `ref` becoming available).

## 5. Breaking-change inventory (the v0.2.0 migration story)

The whole reason this is a minor bump and not another patch. Each item lists the failure mode for a v0.1.x consumer who upgrades blind, the opt-back-in recipe, and the deliberate justification.

| ID | Change | Failure mode | Opt-back-in | Justification |
|---|---|---|---|---|
| BC-1 (N-2) | `AreaTree` discriminator widens `leaf \| split` → `leaf \| split \| stack` | tsc error on exhaustive `switch(node.kind)` in consumer code | Add `case "stack":` arm. Import the exported helper `flattenStackToLeaves` from `@ilinxa/workspace` to extract leaves without coupling to the internal shape (per QP-7). One-line recipe in the v0.2.0 migration guide. | Closes F-01 (v0.1.0 review) honestly. The v0.1.x balanced-split-chain workaround silently produced trees with depth `log₂(N)` below the documented cap — strictly speaking, the cap was a lie. A type error is the right way to surface this. |
| BC-2 (N-3) | `onLayoutChange` no longer fires per rAF tick; fires only on commit | In-flight feedback (e.g., live preview tied to layout state) goes silent during edge-drag | `onResize={onLayoutChange}` restores exact v0.1.x behavior. | v0.1.2 documented the 60Hz storm as a footgun with a debounce recipe. For a beta API that's not acceptable — the API should make the safe default safe. Per-frame is now opt-in (named correctly). |
| BC-3 (N-5) | Default `maxSplitDepth.mobile` `0 → 2` | Mobile devices now allow up to 2 levels of split instead of always card-stacking | `maxSplitDepth={{ mobile: 0 }}` restores v0.1.x mobile-stack-only | Touch support landing (N-5) makes the mobile-cap-0 default user-hostile: phones suddenly have real gestures but get no tiling. 2 is a conservative ceiling — leaves max-4-leaves at mobile. |
| BC-4 (N-6) | `linkedResize` defaults to `true` — dragging a divider aligned with another moves both | A consumer carefully positioning two independent divider pairs finds them moving together | `linkedResize={false}` restores v0.1.x single-boundary movement | Aligned-edge linked resize is the desktop tiling expectation (Blender, VS Code). v0.1.x's siloed-boundary behavior was an under-implementation, not a design. |

Five-line migration guide auto-applies for the median consumer:
1. Add `case "stack"` arm to any `switch(node.kind)` (or rely on `never` exhaustiveness in the default arm). Use `flattenStackToLeaves(node)` (exported from `@ilinxa/workspace`) inside the case.
2. If you were using `onLayoutChange` for live preview, rename to `onResize`. If you only persisted on commit, no change needed.
3. If you want mobile to keep card-stacking, add `maxSplitDepth={{ mobile: 0 }}`.
4. If you want each divider drag to stay siloed, add `linkedResize={false}`.
5. Optional: adopt the imperative `ref` API where you were previously cloning the `AreaTree` manually to programmatically split / merge / swap / focus from outside the component (v0.1.x had no public path for this — gesture and chevron menu only).

## 6. Updated success criteria (beta promotion)

v0.1.0's 12 success criteria from the canonical description remain in force. Beta promotion adds:

13. **Imperative ref API parity** — every reducer action reachable via at least one `WorkspaceHandle` method. Round-trip test: `handle.setLayout(handle.getLayout())` is a no-op (referential identity preserved when content unchanged).
14. **Stack kind renders** — `maxSplitDepth.desktop = 1` + 4-leaf default layout → root is `split`, both children are `stack` nodes with 2 leaves each. Visual: 2 vertical regions, each containing a 2-card stack. Depth cap honored strictly.
15. **`onResize` vs `onLayoutChange` split verified** — edge-drag with both wired: `onResize` fires once per animation frame for the duration of the drag (≈60 calls per second on a 60Hz display); `onLayoutChange` fires exactly once on pointer-up. A non-resize action (e.g., split) fires `onLayoutChange` once and `onResize` zero times.
16. **Undo/redo correctness** — `Ctrl+Z` after a split reverts; `Ctrl+Shift+Z` re-applies. After hitting `historyDepth` limit, oldest action drops (LRU). `canUndo()` returns `false` only when past-stack is empty; `canRedo()` clears whenever a new action commits after an undo (standard undo/redo invariant: history branches discard the future on new action). **External `layout` prop reassignment clears past + future stacks** (RHF-`reset()` semantics per QP-2). **Preset switch clears stacks for the new preset's editing session** (per QP-3) — internal dispatches still push to history as normal within a preset.
17. **Touch gesture works on real device** — Pixel / iPhone Safari, long-press 300ms on corner-handle engages split preview; resume to test on actual hardware OR documented as DevTools-touch-emulation-only.
18. **Linked-edge resize verified** — `defaultLayout` with two siblings whose aligned divider matches a parent-level divider; dragging either moves both unless `linkedResize={false}`.
19. **All 4 BC items have working migration recipes** in the guide, each demonstrated in a copy-paste snippet.
20. **GATE 3 full 16-dim checklist verdict ≥ Pass with follow-ups.** (Per the readiness-review rule, alpha → beta is a tier-1 trigger; spotcheck is not sufficient.)

## 7. Locked decisions carried forward from v0.1.x (no reopens)

Q1 (slug), Q2 (detach-to-OS-window deferred — pushed further out, now v0.3+), Q4 (presets-tabs included), Q6 (no RTL flip), Q7 (`minAreaSize` default), Q8 (`defaultComponentId` required), Q9 (`isFocused` semantics), Q10 (internal reducer), Q11 (DnD out — same as v0.1.x), Q12 (HARD cap, per-leaf) — all unchanged.

Q3 (split state hybrid) and Q5 (touch deferred) are TOUCHED by v0.2.0 but the existing decisions still apply:
- Q3 unchanged: split preserves the original area's instance, new sibling fresh-mounts. `WorkspaceHandle.splitArea()` follows the same contract.
- Q5 effectively reversed: touch is now in. The 300ms long-press disambiguation against scroll is the new locked choice (per Dual-DnD precedent in todo-tree).

## 8. New Open Decisions (Q-Ps) — these need a pick from the user before plan stage

Genuine forks where the locked-pattern-from-elsewhere doesn't fully decide. Each carries my recommendation; user accept / override.

| Q-P | Question | Options | Recommendation |
|---|---|---|---|
| **QP-1** | When `setLayout(next)` is called via the imperative handle in **controlled mode** (consumer owns `layout` prop), does the handle (a) call `onLayoutChange` with `next` and let the consumer ack-and-pass-back-as-prop, or (b) update internal state immediately + still fire `onLayoutChange` (consumer prop and internal state may briefly diverge), or (c) noop with a dev-warn (controlled mode means use the prop)? | (a) consumer-loop / (b) internal-bypass+notify / (c) dev-warn-noop | **(a) consumer-loop, with mode-aware behavior.** In **uncontrolled mode**, `handle.setLayout(next)` updates internal state + fires `onLayoutChange`. In **controlled mode**, it fires `onLayoutChange` only — the consumer's `setState(next)` triggers re-render → `<Workspace>` receives the new `layout` prop → defense-2 structural-resync guard absorbs it. Mirrors RHF `setValue` / Plate's controlled contract; preserves single source of truth; aligns with the project's controlled-mode three-defenses pattern. **Dev-only warning** when called in controlled mode without `onLayoutChange` set (the call would be silently swallowed). (b) creates brief truth divergence that's a debug nightmare. (c) is too strict — consumers calling the handle have a reason. |
| **QP-2** | Undo/redo + controlled mode — when consumer's `layout` prop changes externally (NOT via a handle call), what happens to history? **Internal-dispatch actions (split/merge/resize/swap/undo/redo) ALWAYS push to history — this question is about non-dispatch path only: i.e., the consumer reassigning the `layout` prop from outside.** | (a) external prop change pushes a history entry (treated as user action) / (b) external prop change **CLEARS** history (RHF-`reset()` semantics — "the source-of-truth was replaced, prior history references unreachable states") / (c) external prop change is ignored by history (history retains entries pointing to trees that may no longer be reachable from current state — confusing on Ctrl+Z) | **(b) clear.** RHF-reset semantics: when the consumer pushes a fresh `layout` from outside (e.g., loading a saved snapshot, switching documents, resetting to default), they're saying "discard the editing session". Any history snapshots from the prior session reference states the consumer no longer considers current — `Ctrl+Z` into them would resurrect data the consumer just intentionally replaced. (a) double-counts every parent re-render that creates a new tree object identity. (c) creates "undo to a state that came from outside" oddity. Note: internal dispatches still push to history as normal — Ctrl+Z is fully functional in controlled mode for user-initiated actions. |
| **QP-3** | Undo/redo + preset switches — does `setActivePreset(id)` push the pre-switch layout to history? | (a) yes (Ctrl+Z reverts the preset change) / (b) no (presets are out-of-band navigation, like browser tabs — Ctrl+Z is page-scoped to within-preset edits only) | **⚠ REVISED: (b) no.** Initial recommendation was (a), but on re-validation Blender / VS Code precedent goes the other way: switching workspace / editor group in Blender does not appear in the undo stack, and Ctrl+Z in VS Code is per-document. Presets are explicitly user-selected named layouts — switching is a navigation gesture, not an edit. If a user reflexively hits Ctrl+Z after a preset switch and gets nothing, they look up at the preset tabs and re-click; that's clearer than mystery-undoing the active preset. **Side effect of (b) per QP-2's RHF-reset semantics:** preset switch is treated as an external-source layout replacement → history clears for the new preset's editing session (each preset gets its own undo stack scoped to within-preset edits). |
| **QP-4** | `linkedResize` (N-6) — what counts as "aligned"? | (a) strict pixel-equal boundary at exact same X or Y / (b) within `±1px` tolerance in computed rect-space / (c) within `±KEYBOARD_RESIZE_STEP×rect` (~4%) / (d) only direct siblings of the same parent split (no walking) | **(b) ±1px tolerance in computed rect-space (not ratio-space).** Floating-point ratio math compounds 0.5px per nested split level; even intentionally-aligned dividers can drift. **Same tolerance as the existing `useResizeKeyboard` divider hit-test in v0.1.2** (`Math.abs(focusedRect.x + focusedRect.width - d.x) < 1` in [`hooks/use-keyboard-actions.ts:151`](../../src/registry/components/layout/workspace/hooks/use-keyboard-actions.ts)) — consistency is the right framing. (a) breaks on legitimate drift. (c) over-links. (d) misses deliberately-aligned cross-parent boundaries (the common "left rail + main area divider lined up with header/footer split" pattern). |
| **QP-5** | `linkedResize` (N-6) — when one of the linked dividers would push a leaf below `minAreaSize`, does the resize (a) clamp all dividers to the strictest min, (b) clamp only the offending pair (others move freely), or (c) bail out (no-op)? | (a) clamp-all / (b) clamp-pair / (c) bail | **(a) clamp-all = the most-constrained linked divider governs the movement of all linked dividers, preserving alignment even at the floor.** Each dispatch frame: compute desired-ratio for each linked divider → check `minAreaSize` constraint per divider → reduce all to the strictest-achievable delta → batch-commit. Visual alignment is what the linking is FOR; (b) breaks alignment exactly when the user would notice (the moment any leaf hits its floor); (c) frustrates the drag entirely. Matches Blender's tiling-window resize behavior. |
| **QP-6** | Touch long-press (N-5) — apple-pencil / stylus pointerType: (a) treat as mouse (immediate engagement), (b) treat as touch (300ms long-press), (c) detect specific pointerType and route accordingly. | (a) mouse-like / (b) touch-like / (c) per-type | **(c) per-type.** `pointerEvent.pointerType` is reliably `"pen"` for stylus on Surface / iPad+Pencil. Disambiguation reasoning: on **mouse**, hover-cursor already signals intent; on **touch**, scroll is the page default — long-press disambiguates "I'm about to drag" from "I'm about to scroll"; on **pen**, the user has deliberately positioned a precision instrument — direct manipulation IS the default expectation. Mouse engages immediately; touch waits 300ms; pen engages immediately. **Forward door:** if real pen users report friction (e.g., accidental splits while sketching), revisit by exposing a `penGestureDelay?: number = 0` prop in v0.2.x without breaking. |
| **QP-7** | Should `BC-1` (`stack` kind) ship with a `flattenStackToLeaves(node: AreaTreeStack): AreaTreeLeaf[]` helper exported from `index.ts` for consumers writing their own renderers? | (a) yes — export the helper / (b) no — inline-trivial, don't widen API | **(a) yes — bundled with type-export alignment.** `index.ts` already exports `AreaTreeLeaf` + `AreaTreeSplit`; v0.2.0 adds `AreaTreeStack` to that list for symmetry, plus the `flattenStackToLeaves` helper. Even though the helper is currently `(stack) => stack.leaves` (one line), the export insulates against later shape evolution (e.g., changing `leaves` → `children`) — that's exactly the contract value an exported helper provides. Discoverable in autocomplete when a consumer writes `case "stack":` and goes "what do I do with this?". Adds 8 lines to the public surface. |
| **QP-8** | Phase B ship cadence — (a) one big v0.2.0 ship covering all of B-1..B-9, or (b) chunked into v0.1.4 (N-1 imperative additive) + v0.1.5 (N-4 undo additive) + v0.2.0 (N-2/N-3/N-5/N-6 breaking-bundle + N-7 promotion)? | (a) bang / (b) chunked | **(a) bang.** Three reasons. (1) The 4 breaking changes share a single migration guide; splitting means writing 2 partial guides + a final one. (2) The features cross-plumb — `stack` kind interacts with `linkedResize` walking (does the walker enter stack children?); `onResize` split interacts with controlled-mode three-defenses (which defense suppresses per-frame echoes when both `onResize` and `onLayoutChange` are wired?). Bang lets the GATE 2 plan decide these once. (3) **Chunked optimizes for the wrong axis** with the current 1–2 consumer count — risk-spreading via consumer bug surfacing on additive APIs first only pays off when there are many consumers to surface bugs. **One caveat:** if the user actually wants the additive parts in production *while still iterating on the breaking parts* (e.g., a critical consumer needs `WorkspaceHandle` immediately and v0.2.0 takes 4 weeks), (b) chunked becomes the right answer despite the migration-guide overhead. |
| **QP-9** | `Ctrl/Cmd+Z` collision with focused-area inner content (e.g., consumer registers a `CodeEditor` component; user types text, hits `Ctrl+Z` expecting to undo the keystroke). The workspace's keyboard handler currently fires on the global `window` `keydown` (per the v0.1.2 A-3 `useResizeKeyboard` precedent). | (a) Always intercept (layout undo wins; consumer must use `e.stopPropagation()` in their editor) / (b) Skip workspace undo when `document.activeElement` is inside a `[contenteditable]` / `<textarea>` / `<input>` / `<select>` ("native edit context" heuristic) / (c) Require explicit `enableHistoryShortcuts?: boolean = false` opt-in; consumer wires their own shortcut if they want layout undo | **(b) skip on native edit context.** Heuristic: `document.activeElement` matches `:is([contenteditable="true"], [contenteditable=""], textarea, input:not([type="checkbox"]):not([type="radio"]):not([type="button"]):not([type="submit"]), select)`. Aligns with browser convention (Gmail, VS Code, Google Docs all behave this way). Layout undo via toolbar button or `handle.undo()` ref call remains accessible. **Escape hatch for custom non-native-edit components** (e.g., a custom drawing canvas that wants its own undo): consumer registers a `onKeyDownCapture` on their area-rendered element that calls `e.stopPropagation()` for `Ctrl/Cmd+Z` / `Ctrl/Cmd+Shift+Z` — workspace's global listener will see nothing. Same rule applies to `Ctrl/Cmd+Shift+Z`. (a) is hostile; (c) buries the feature behind boilerplate. |

## 9. New risks (specific to Phase B; v0.1.x risks unchanged)

- **`stack` kind affects the controlled-mode three-defenses pattern.** Defense-2 (structural resync guard) compares incoming controlled-tree to internal-tree — `stack` arm needs explicit handling or comparison returns false-positive "different".
- **Undo history memory growth per workspace instance.** Worst-case `historyDepth=50` × 200-leaf layout × 5KB per AreaTree snapshot ≈ 50MB of refs held by a single mounted `<Workspace>`. Need a docs warning + a `historyDepth=0` opt-out call-out in the guide; consider an internal LRU cap on snapshot size if `JSON.stringify(tree).length > N`.
- **Multi-edge linked resize amplifies the controlled-mode echo problem.** Defense-3 (suppress consumer notify mid-flow) already guards against per-frame echoes; with N dividers moving per drag, the dispatch payload is N× bigger. Verify the throttle doesn't queue.
- **Touch + Pointer Capture interactions on iOS Safari.** `setPointerCapture` on touch pointers has historically been quirky on iOS; need real-device verification, not just DevTools emulation.
- **`forwardRef` displayName / React-DevTools / HMR boundary.** `forwardRef`'d components have slightly different runtime identity than plain functions. Practical impact nil but worth a smoke-test in the dev page after wiring.

## 10. Definition of "done" for THIS document (stage gate)

Before moving to the v0.2.0 plan stage:

- [x] Sections 1–9 reviewed.
- [x] QP-1 through QP-9 each carry an accepted answer (re-validation pass surfaced 1 reversed recommendation — QP-3 — plus 8 clarifications; all locked).
- [x] Breaking-change inventory (§5) is the final list — no surprise BC-5 emerging at plan stage.
- [x] §4 API sketch reviewed for completeness — no other prop/handle/type touches needed (post-re-validation includes `AreaTreeStack` + `flattenStackToLeaves` helper export per QP-7).
- [x] **User signed off 2026-05-25 ("confirmed").** GATE 2 (plan refresh) unlocked.

After sign-off, this addendum becomes frozen alongside the canonical description; any changes are loud + intentional, not silent rewrites.

---

## Appendix — what this addendum deliberately does NOT do

- Doesn't re-author or replace [`workspace-procomp-description.md`](workspace-procomp-description.md). v0.1.x scope is preserved; this is layered.
- Doesn't restate Q1–Q12 from the canonical description. Those are locked.
- Doesn't write the plan. That's GATE 2 after this signs off.
- Doesn't enumerate the implementation file list. That's the plan's job (and Phase B section of [`workspace-procomp-plan.md`](workspace-procomp-plan.md) already has a working draft).
- Doesn't decide commit cadence inside the ship (e.g., one B-1 commit vs five). Plan stage.
- Doesn't pick the new procomp version of `meta.ts`'s `updatedAt` or the eventual commit SHAs. Ship-time concerns.
