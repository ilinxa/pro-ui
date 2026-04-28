# `workspace` — Pro-component Plan (Stage 2)

> **Stage:** 2 of 3 · **Status:** Draft — awaiting sign-off
> **Slug:** `workspace` · **Category:** `layout`
> **Inputs:** description signed off ([workspace-procomp-description.md](workspace-procomp-description.md)). All twelve description-stage decisions are inherited as fixed inputs.

This doc locks **how** we build what the description doc said we'd build. After sign-off, no scaffolding-time second-guessing — implementation follows the plan, deviations are loud.

---

## 1. Inherited inputs (from description, in one paragraph)

`workspace` is a `layout`-category pro-component: a splittable canvas where rectangular **editor areas** tile the viewport (no float, no overlap). Areas pick from a consumer-supplied **registry** of components via a top-left dropdown. **Corner-drag** splits and merges; **edge-drag** resizes. Splitting preserves the original area's component state and mounts the new sibling fresh; merge / type-switch unmount. **Per-breakpoint hard cap on split depth** (`maxSplitDepth: number | { mobile, tablet, desktop }`, default 0/3/7) — applied **per leaf**: a leaf can split iff `leaf.depth < cap`. Preventive (split intent inert when origin leaf is at cap; merge always works regardless; devtools log once/session) and adaptive (deeper subtrees flatten to card stacks when viewport shifts). Mobile = 1-column card stack (special case of `mobile = 0`). Internal state via `useReducer`. **Saved presets** as a tab strip when the `presets` prop is provided. Detach-to-OS-window, touch gestures, and DnD-between-areas are all **deferred to v0.2**.

---

## 2. Final API (locked)

This is the public surface for v0.1.0. Every type goes in `types.ts` and is re-exported from `index.ts`. The plan stage adds three things to the description's sketch: a `ResponsiveValue<T>` helper, an explicit `useAreaContext()` hook for live area dimensions (replacing arg-passing — see §3.2), and a strict-typed reducer-action union (kept private).

```ts
// ───── helpers ─────

export type ResponsiveValue<T> = T | { mobile?: T; tablet?: T; desktop?: T };

// ───── public types ─────

export type WorkspaceComponent = {
  id: string;
  name: string;
  icon?: ReactNode;
  category?: string;
  render: () => ReactNode;     // no args — use useAreaContext() inside for live ctx
};

export type AreaContext = {
  areaId: string;
  width: number;
  height: number;
  isFocused: boolean;
};

export type AreaTree =
  | { kind: "leaf";  id: string; componentId: string }
  | { kind: "split"; orientation: "vertical" | "horizontal"; ratio: number; a: AreaTree; b: AreaTree };

export type WorkspacePreset = {
  id: string;
  name: string;
  layout: AreaTree;
};

export type WorkspaceProps = {
  components: WorkspaceComponent[];
  defaultComponentId: string;

  layout?: AreaTree;
  defaultLayout?: AreaTree;
  onLayoutChange?: (next: AreaTree) => void;

  presets?: WorkspacePreset[];
  activePresetId?: string;
  onActivePresetChange?: (id: string) => void;

  minAreaSize?: { width: number; height: number };
  maxSplitDepth?: ResponsiveValue<number>;
  breakpoints?: { mobile: number; tablet: number };

  "aria-label"?: string;       // landmark name on the root region; default "Workspace"
  className?: string;
};

// ───── public hook ─────

export function useAreaContext(): AreaContext;
// Throws if called outside a Workspace area's render() subtree.

// ───── private (not exported) ─────

type Action =
  | { type: "split";  areaId: string; orientation: "vertical" | "horizontal"; newAreaId: string }
  | { type: "merge";  survivorId: string; absorbedId: string }
  | { type: "resize"; splitPath: number[]; ratio: number }
  | { type: "swap";   areaId: string; componentId: string }
  | { type: "preset"; presetId: string }
  | { type: "replace-tree"; tree: AreaTree };
```

**Defaults:**
- `minAreaSize`: `{ width: 120, height: 80 }`
- `maxSplitDepth`: `{ mobile: 0, tablet: 3, desktop: 7 }`
- `breakpoints`: `{ mobile: 640, tablet: 1024 }` (px width)

**Required props:** `components`, `defaultComponentId`. Everything else is optional.

**Counts:** 5 public types + 1 helper + 1 hook. 2 required props, 11 optional. Within the §6.6 component-guide budget.

---

## 3. Architecture

### 3.1 Rendering strategy: flat list with absolute positioning

The naive recursive approach (render the tree as nested `<div>` flexboxes) causes the original area's React subtree to be re-parented when the tree restructures around it. That breaks the **state-preservation contract from Q3**.

Instead: **walk the tree once per render to compute a flat list of `{ areaId, x, y, width, height }` rectangles, then render areas as a flat list of `<Area key={areaId} />` elements with absolute positioning.** Splitting an area = inserting a new entry in the flat list + repositioning everything else. React's reconciler matches by key, so the original area's DOM node and component subtree are preserved untouched.

Same approach for split dividers (computed from internal split nodes) and corner handles (computed per leaf rectangle).

**Performance corollary:** during edge-drag, only the `ratio` of one split node changes; the flat-list recomputation is O(n) and produces transform-only style updates — no React tree changes, no remounts.

### 3.2 Live area context via hook (departs from description sketch)

Description's sketch: `render: (ctx: AreaContext) => ReactNode`. Problem: passing live `width`/`height` as a `render()` argument means the consumer's whole component re-renders on every resize tick. Bad for performance, surprising for consumers.

**Plan:** `render` takes no arguments. Each area wraps its rendered children in a React context provider that publishes the live `AreaContext`. Consumers who need it call `useAreaContext()` inside their component. Consumers who don't need live dimensions never re-render on resize.

This is a meaningful API change vs the description sketch. Flagged as Q-P1 below — we don't ship it without your sign-off.

### 3.3 State model: single reducer over `AreaTree`

One `useReducer((state, action) => state)` lives in `workspace.tsx`. The state is the `AreaTree` (plus a small bag of UI state: `activePresetId`, `focusedAreaId`, `dragInProgress`).

Actions enumerated above. The reducer is a **pure function** in `lib/reducer.ts` — testable independently of React.

Controlled mode: when `layout` prop is provided, the reducer's tree is read from props and its `replace-tree` action calls `onLayoutChange` instead of updating internal state.

### 3.4 Pure tree operations in `lib/tree.ts`

Extracted helpers (no React, no DOM, no side effects):

- `findLeaf(tree, areaId): { node, path } | null`
- `splitLeaf(tree, areaId, orientation, newAreaId, defaultComponentId): AreaTree`
- `mergeAreas(tree, survivorId, absorbedId): AreaTree`
- `resizeSplit(tree, path, ratio): AreaTree`
- `swapComponent(tree, areaId, componentId): AreaTree`
- `treeDepth(tree): number`
- `flattenLeavesInOrder(tree): Leaf[]` — for mobile card stack
- `flattenSubtreesPastDepth(tree, cap): AreaTree` — for adaptive tablet rendering
- `validateTree(tree): { valid: boolean; errors: string[] }` — guards consumer-provided layouts

These are the only tree-mutation primitives. Reducer composes them.

---

## 4. File structure

```
src/registry/components/layout/workspace/
├── workspace.tsx                ← root; "use client"; props → reducer → flat-list render
├── parts/
│   ├── area.tsx                 ← single area: header + body, provides AreaContext
│   ├── area-header.tsx          ← top bar: dropdown selector + corner handles
│   ├── area-body.tsx            ← scrollable viewport (uses ScrollArea primitive)
│   ├── component-picker.tsx     ← the dropdown: categories, icons, click-to-swap
│   ├── corner-handle.tsx        ← 16×16 grip target; emits drag-start
│   ├── split-divider.tsx        ← 4-px hit zone on a split's edge; emits resize-drag
│   ├── card-stack.tsx           ← mobile / cap-flattened renderer
│   ├── presets-tabs.tsx         ← top-of-canvas tab strip (uses Tabs primitive)
│   └── drag-overlay.tsx         ← live preview line during corner-drag
├── hooks/
│   ├── use-area-context.ts      ← public hook; reads AreaContext from provider in parts/area.tsx
│   ├── use-corner-gesture.ts    ← pointer events → split or merge dispatch
│   ├── use-edge-gesture.ts      ← pointer events on dividers → resize dispatch
│   ├── use-breakpoint.ts        ← ResizeObserver on root → "mobile"|"tablet"|"desktop"
│   ├── use-area-focus.ts        ← single focus listener at root → focusedAreaId
│   └── use-keyboard-actions.ts  ← keyboard alternatives (split/merge/resize/swap)
├── lib/
│   ├── tree.ts                  ← pure tree ops (see §3.4)
│   ├── reducer.ts               ← pure reducer
│   ├── geometry.ts              ← rectangle math, drag-direction inference
│   └── ids.ts                   ← stable areaId generator
├── types.ts                     ← public API (everything in §2)
├── dummy-data.ts                ← demo registry of 4 components: notes (textarea), clock (live time), counter (state-bearing — proves Q3 preservation across split), data-table (composes the existing registry component)
├── demo.tsx                     ← workspace with the dummy registry
├── usage.tsx                    ← prose docs
├── meta.ts                      ← ComponentMeta
└── index.ts                     ← barrel
```

**Deviation from convention:** the component-guide §5 anatomy lists `parts/` and `hooks/` as optional. **`lib/` is added** for pure non-React helpers (tree ops, reducer, geometry). Justified because workspace's tree algorithms are non-trivial pure functions that benefit from being testable independent of React. Flagged as Q-P2 — confirm or override.

**Counts:** 7 mandatory anatomy files (`workspace.tsx`, `types.ts`, `dummy-data.ts`, `demo.tsx`, `usage.tsx`, `meta.ts`, `index.ts`) + 9 parts + 6 hooks + 4 lib = **26 files total**. This is large; the description warned the component is the most ambitious in the registry.

---

## 5. Gestures

### 5.1 Corner gesture (split / merge)

State machine on `pointerdown` over a corner handle:

```
idle
 ↓ pointerdown on corner
press
 ↓ pointer moves > 4px
dragging  (cursor: crosshair)
 ↓ pointerup
   ├─ if pointer in same area, > minAreaSize/2 from corner: SPLIT
   │     orientation = primary axis of drag distance from corner
   │     dispatch { type: "split", areaId, orientation, newAreaId }
   ├─ if pointer in adjacent area sharing a full edge: MERGE
   │     survivor = origin area; absorbed = target area
   │     dispatch { type: "merge", survivorId, absorbedId }
   └─ else: cancel (no action)
```

**Cap enforcement (preventive, per-leaf):** the cap is checked **per leaf**, not against the global tree depth — splitting a leaf at depth N produces children at depth N+1, so the rule is `origin.depth < cap` for the leaf the gesture starts on. The check lives inside `computeIntent` (during pointermove): `pointerdown` always engages the gesture, but if the resolved intent would be a SPLIT and `origin.depth >= cap`, intent stays `none` (no preview line, no dispatch on release). **Merge intent is unaffected** — merging never increases depth, so cap doesn't gate it. `console.debug` once per session when a split is suppressed: `"[workspace] split inert: leaf at depth <N> would exceed cap <M> for breakpoint <X>"`.

**Visuals during drag:** `<DragOverlay>` renders a 1-px line at the proposed split position; on hover over a mergeable neighbor, an arrow overlay indicates direction.

### 5.2 Edge gesture (resize)

`pointerdown` on a `<SplitDivider>` → dispatch `resize` action on every `pointermove`, throttled with `requestAnimationFrame`. Cursor changes to `col-resize` / `row-resize` based on the divider's split orientation.

**Min-area clamping:** new ratio is clamped so neither child goes below `minAreaSize`. The clamp happens in the reducer (single source of truth), not in the gesture hook.

**Aligned-edge linking:** described concept (multiple aligned edges move together). Plan: **deferred to v0.2.** v0.1 ships with simple per-divider resize. Flagged as Q-P3 — confirm.

### 5.3 Keyboard alternatives

Per Q-from-description-Q5 (AA accessibility): mouse gestures alone fail. Keyboard contract for v0.1:

- Focus an area: `Tab` cycles areas in tree-traversal order.
- `Alt+Enter` on focused area: opens an "Area actions" menu (a shadcn `DropdownMenu` rooted at the area header).
  - Split horizontal → dispatch split action
  - Split vertical → dispatch split action
  - Merge with neighbor → opens submenu (Up/Down/Left/Right) listing valid merge targets
  - Change component → opens the component picker (same as clicking the dropdown)
  - Close
- `Alt+Shift+ArrowKeys` on focused area: resize the boundary in that direction by 8px (or a percent step).

The Alt+Enter menu mirrors mouse gestures 1:1, so keyboard users have full functional parity. Flagged as Q-P4 — confirm key mappings.

---

## 6. Responsive system

### 6.1 Breakpoint detection

`useBreakpoint(rootRef, breakpoints)`:
- `ResizeObserver` on the workspace root element (NOT `window`, so workspace inside a sidebar/modal works).
- Returns `"mobile" | "tablet" | "desktop"` based on root's clientWidth vs `breakpoints.mobile`/`breakpoints.tablet`.
- Debounced 100ms to avoid thrashing during user-initiated drag-resize of a parent.

### 6.2 Render path per breakpoint

```
desktop: render flat list of areas with split tree, dividers, corner handles
tablet:  same as desktop, but tree is first passed through flattenSubtreesPastDepth(tree, capTablet)
         deeper subtrees become CardStack regions (no internal splits / no corner handles)
mobile:  entire tree is flattenLeavesInOrder(tree); render single CardStack
         (special case of capMobile = 0 → flattenSubtreesPastDepth produces a single stack)
```

The tree state itself never changes when the breakpoint changes — only the *render function* changes. Resizing back to desktop restores the full layout exactly (per the locked Q12 adaptive contract).

### 6.3 No animation across breakpoints in v0.1

When the breakpoint changes mid-session (rare; usually just initial mount), the layout snaps to the new render mode without animation. Animating across the structural change is complex and not high-value. Flagged as Q-P5 — confirm "snap, no animate" for v0.1.

---

## 7. Composition pattern

Per component-guide §9, the canonical patterns are: render-props, generics, `children`, slot-props, headless+presentation.

**Workspace's pattern: registry + render fn.** Consumers register `WorkspaceComponent`s; each declares a `render()` returning `ReactNode`. This is closer to "headless host + consumer-supplied content" than to render-props because the workspace is the host, not the consumer.

Sub-components (`Area`, `AreaHeader`, etc.) are **all private** — not exposed. The `<Workspace>` is the only public component. We don't ship a compound component (`<Workspace.Area>` etc.). This keeps the surface minimal; advanced composition can come later if real consumers need it.

State: **controlled and uncontrolled** both supported (Q10 locked: internal `useReducer`; consumers can lift state via `layout` + `onLayoutChange`).

---

## 8. Client/server boundary

`workspace.tsx`: **`"use client"`**. Required for: pointer events, keyboard handlers, `ResizeObserver`, `document.activeElement` tracking, `useReducer`, `useRef`.

Everything else in the component folder stays server-safe:
- `types.ts`, `dummy-data.ts`, `lib/*.ts`, `meta.ts`, `index.ts` — pure modules, no React runtime.
- `demo.tsx` — server component that just renders `<Workspace>` with the dummy registry. The workspace's "use client" boundary handles hydration.
- `usage.tsx` — server component, prose only.
- `parts/*.tsx` and `hooks/*.ts` — inherit "use client" from `workspace.tsx`'s import boundary; no need for explicit directive.

---

## 9. Dependencies

### shadcn primitives (all already installed)

| Primitive | Used for |
|---|---|
| `dropdown-menu` | Component picker, area-actions menu (Alt+Enter) |
| `scroll-area` | Per-area scrollable viewport |
| `separator` | Visual edges where needed |
| `tabs` | Presets tab strip |

`tabs` is **not yet installed**. Plan-step before scaffolding: `pnpm dlx shadcn@latest add tabs`. Flagged in §15 stage gate.

`meta.ts` `dependencies.shadcn`: `["dropdown-menu", "scroll-area", "separator", "tabs"]`.

### npm peer deps

| Package | Used for |
|---|---|
| `lucide-react` | Icons in dropdown menu, split/merge indicator arrows |

`meta.ts` `dependencies.npm`: `{ "lucide-react": "^1.11.0" }` (per the corrected guide rule that all third-party imports get declared).

### internal

None. `workspace` doesn't compose other registry components.

`meta.ts` `dependencies.internal`: `[]`.

### Banned / not-imported

`next/*`, `process.env`, app-context — per the portability contract. The workspace component is a candidate for early NPM extraction once stable.

---

## 10. Edge cases

| Case | Behavior |
|---|---|
| Initial layout exceeds breakpoint cap | At first render, `flattenSubtreesPastDepth` runs immediately; user sees the capped render. No error. |
| Provided `layout` references a `componentId` not in `components[]` | Render a fallback panel: card with `componentId` + "missing from registry" message + a "swap" CTA opening the picker. Validated up-front via `validateTree`. |
| `defaultComponentId` not in `components[]` | Validation error at mount: `console.error` and render a single error card. Documented as a developer mistake. |
| Empty `components[]` | Same as above — validation error. |
| Resize during drag (window or parent) | Drag is canceled; reducer emits no further actions for that gesture. |
| Component re-renders during drag | Gesture state lives in `useRef` to avoid re-renders mid-drag. |
| Tree depth on initial mount equals exactly the cap | OK — at-cap is allowed, only beyond-cap is blocked. |
| Adjacent merge on a tree where merge isn't valid (non-aligned edges) | Gesture cancels silently; cursor doesn't change to indicate-merge. |
| Controlled mode with stale `layout` prop | Reducer always reads from props in controlled mode; `dispatch` calls `onLayoutChange(nextTree)`. Consumer responsible for echoing back. |
| `presets` change at runtime | Re-render the tab strip; if `activePresetId` no longer exists in the new presets array, switch to first preset and call `onActivePresetChange`. |
| Switching presets mid-drag | Drag is canceled before preset takes effect. |
| `minAreaSize` larger than viewport / 2 | Edge-drag becomes locked; preventive cap on splits also engages once a split would violate. Documented as a developer-config error. |

---

## 11. Accessibility

- **Areas:** `role="region"` with `aria-label` = current component's `name`. `tabIndex={0}` so they're keyboard-focusable.
- **Dividers:** `role="separator"` with `aria-orientation` and `aria-valuenow` reflecting the split ratio (0–100). Keyboard-resizable via Alt+Shift+arrow.
- **Corner handles:** rendered as `<button>` with `aria-label="Split or merge area"`. Activatable via Enter/Space, opening the same Alt+Enter menu.
- **Component picker:** native shadcn `DropdownMenu` semantics; `aria-expanded` etc. handled by the primitive.
- **Presets tabs:** native shadcn `Tabs` semantics.
- **Focus visible:** every interactive element gets `focus-visible:ring-2 focus-visible:ring-ring` (matches design-system contract).
- **No `outline-none` overrides** without paired `focus-visible` styles.
- **Landmark structure:** the workspace root has `role="application"` (acceptable for workspace-style UIs) with its `aria-label` sourced from the `aria-label` prop on `<Workspace>` (default: `"Workspace"`). Document this prop in usage.

**AA contrast:** semantic tokens only. Verified against globals.css token system.

**Internationalization (RTL):** split orientations (`vertical` / `horizontal`) are direction-agnostic — `vertical` always means "side by side" regardless of `dir`. Chrome with directional reading order (component picker, presets tabs, area-actions menu, area headers) uses CSS logical properties (`inline-start` / `inline-end`, `padding-inline-*`, etc.) so it flips automatically when the consumer wraps the workspace in `dir="rtl"`. Per locked decision Q6, serialized layouts round-trip cleanly between LTR and RTL contexts without tree mutation.

---

## 12. Performance

| Concern | Strategy |
|---|---|
| Re-renders during edge-drag | Drag state in `useRef`; ratio change triggers a single dispatch per `requestAnimationFrame` tick. Flat-list rendering means only positioning style changes. |
| Tree walks on every render | Memoize `flatten(tree, breakpoint, cap)` keyed by `(treeRef, breakpoint, cap)`. Tree updates are immutable, so reference equality works. |
| Many areas rendered | React 19 compiler should auto-memo Area subtrees. Verify in profiling; fall back to manual `memo` if needed. |
| Resize listener thrash | `useBreakpoint` debounced 100ms; `ResizeObserver` only on root. |
| Initial mount with large tree | Validate up-front (cheap); render is O(n) where n = leaf count. |
| Memory: dragging components mounted/unmounted | Per Q3 contract, splits don't unmount. Merges/swaps unmount via React's natural lifecycle. No leaks expected. |

**Budget:** 20+ areas at 60fps during sustained edge-drag on a mid-tier laptop (per success criterion #6). If profiling shows we miss this, fall back to `transform: translate3d` updates without React re-renders during drag, applying the final state on `pointerup`. That fallback is documented but not implemented unless needed.

**No test runner** is wired in this repo (description risk §8). Plan-stage stance: ship v0.1 with extensive demo-driven verification + explicit STATUS.md test-debt entry. Land Vitest as a separate STATUS decision before v0.2. Flagged as Q-P6.

---

## 13. Risks & alternatives

### Risks (carried from description, with plan-stage mitigations)

| Risk | Mitigation in this plan |
|---|---|
| Scope creep | Detach-window, touch, DnD, aligned-edge resize all explicitly **deferred**. Plan-stage Qs surface remaining scope decisions. |
| Accessibility debt | Keyboard contract designed in §5.3 from day 1 — not bolted on. ARIA roles in §11. |
| State-management entanglement | Controlled/uncontrolled both supported; reducer is pure and testable; live area context exposed via hook (not arg-passing) so consumers can opt out of live updates. |
| Performance during drag | Flat-list architecture + ref-based drag state + rAF throttling. Documented fallback (transform-only during drag) if profiling fails the 60fps budget. |
| Test coverage | Pure `lib/` modules ARE testable independent of React when Vitest lands. v0.1 ships with demo verification + test-debt note. |

### Alternatives considered, rejected

- **Use an existing lib (Allotment, FlexLayout, Mosaic).** None ship the registry + component-picker pattern. Wrapping one would inherit its API conventions and bundle weight; we'd still own the registry layer. Build wins for control + portability.
- **Recursive nested-flexbox rendering.** Idiomatic but breaks state preservation on split (Q3). Rejected for the flat-list approach.
- **External state lib (zustand/jotai).** Q10 locked: no external state dep. `useReducer` over an immutable tree is sufficient.
- **CSS Grid template areas.** Too rigid for runtime-mutable split tree. Rejected.
- **One ResizeObserver per area.** Wasteful; one root observer + flat-list-derived sizes suffices. Rejected.

---

## 14. Plan-stage open questions

The description sealed the *what*. These six are *how* questions the plan needs your call on before scaffolding.

| # | Question | Recommendation | Why |
|---|---|---|---|
| Q-P1 | **`render` API: arg-passing vs `useAreaContext()` hook?** Description sketched `render(ctx)`. Plan proposes `render()` + `useAreaContext()` inside. | **Hook.** | Avoids re-rendering consumer components on every resize tick. Standard pattern (cf. `useFormContext`, `useDndContext`). |
| Q-P2 | **Add `lib/` directory** for pure tree/reducer/geometry helpers, deviating from the §5 anatomy that lists only `parts/` and `hooks/` as optional? | **Yes — add `lib/`.** Document in `meta.ts` context. | Tree algorithms are pure non-React functions; "hooks" is the wrong home. The deviation makes the code testable in isolation when Vitest lands. |
| Q-P3 | **Aligned-edge linked resize** (described concept #7: dragging a shared boundary moves all aligned edges together) — v0.1 or v0.2? | **v0.2.** Per-divider resize only in v0.1. | Aligned-edge tracking adds tree-walking complexity without changing the core UX. Deferring keeps v0.1 lean. |
| Q-P4 | **Keyboard shortcuts.** Plan proposes Tab to focus, Alt+Enter for actions menu, Alt+Shift+arrows to resize. | **Adopt as proposed.** | Matches platform conventions (Alt+Enter = "open contextual menu" on Windows, similar to `meta` patterns elsewhere). Easy to remap if real users push back. |
| Q-P5 | **Cross-breakpoint transition: snap or animate?** When viewport shifts mid-session, should the layout transition smoothly between desktop/tablet/mobile renderings, or snap instantly? | **Snap, no animate, in v0.1.** | Animating across structural changes (tree-deep → flat stack) is complex and rarely needed. Snap is honest about what's happening and free of edge cases. |
| Q-P6 | **Test-runner stance.** No test runner is wired in this repo. Workspace is complex enough to *want* tests. Block on landing Vitest first, or ship with test-debt note? | **Ship with test-debt note.** Pure modules in `lib/` will be test-ready when Vitest lands; v0.1 verification is demo-driven. | Blocking on a test-runner decision (a separate STATUS-level conversation) would delay this component indefinitely. Test debt is honest and recoverable. |

---

## 15. Definition of "done" for THIS document (stage gate)

Before any code or scaffolding:

- [ ] User reads §1–§13 (the locked plan) and §14 (plan-stage Qs).
- [ ] Each Q-P1 through Q-P6 has either an "agreed" or override answer.
- [ ] User explicitly says **"plan approved"** (or equivalent) — this unlocks Stage 3 (implementation).

After sign-off, the next session starts with:

1. `pnpm dlx shadcn@latest add tabs` (the only missing primitive)
2. Open a STATUS.md note recording the test-debt for `workspace`
3. `pnpm new:component layout/workspace`
4. Implement against this plan, file by file in the order listed in §4
5. Author `workspace-procomp-guide.md` (Stage 3) alongside the implementation
6. Run the §13 verification checklist from the component-guide
7. Update STATUS.md

If at any point during implementation a plan decision turns out wrong, **stop, document the issue, ask before deviating**. The plan is the contract; deviations are loud, not silent.
