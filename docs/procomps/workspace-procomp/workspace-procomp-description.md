# `workspace` — Pro-component Description (Stage 1)

> **Stage:** 1 of 3 · **Status:** Decisions locked — awaiting final sign-off
> **Slug:** `workspace` · **Category:** `layout`
> **Conceptual lineage:** desktop tiling-window patterns (Blender areas, VS Code editor groups, tiling WMs) — adapted to the modern web. **Not a Blender clone.** A web-app / dashboard / dev-tool layout primitive.

This is the **description** doc. Its job is to pin down what we're building and why, surface open decisions, and earn sign-off before any planning or code. All twelve open questions raised during review have been resolved (see §7). The full concept brief authored by the user is preserved verbatim in the appendix at the end.

---

## 1. Problem

Web apps with diverse, multi-purpose UIs force users into rigid layouts: fixed sidebars, modal tabs, hidden panels, accordion drawers. The user has to fit their workflow into the layout the developer chose. Power users — in **dashboards, admin consoles, dev tools, and data-exploration apps** — consistently want the inverse: **spatial freedom**. Drop any tool into any region; subdivide the screen on demand; reconfigure without leaving the app.

Today, every team that wants this either:

- Settles for tabs / fixed splits and watches power users file feature requests forever, or
- Builds a custom layout engine from scratch (3–12 weeks of work, accessibility usually skipped, never quite right).

There is no high-quality, pluggable React component for **professional dynamic containers** — the layout pattern where any region of the canvas can be split, merged, resized, and re-typed at runtime. This pro-component fills that gap. The conceptual model borrows from desktop tiling tools (Blender's areas, VS Code's editor groups, tiling window managers), adapted to the realities of the modern web — responsive viewports, no native window decorations, accessibility from day one, and developer-controlled limits per device.

It is — by intent — **the most ambitious component in the registry**: it doesn't render a piece of UI, it provides the *frame* that other UIs live inside. Get this right and every dashboard and dev-tool app the registry serves becomes simpler downstream.

---

## 2. In scope / Out of scope

### In scope (v0.1.0 → v1.0.0 trajectory)

- A **single root container** that tiles its viewport with rectangular **editor areas** (no overlap, no float, no gaps).
- A **registry of components** that any area can host. The workspace itself is content-agnostic — consumers register components.
- A **component selector** in each area's header (top-left dropdown) that swaps the area's content from the registry.
- **Corner-drag gestures** to split (drag inward) and merge (drag outward toward neighbor) areas.
- **Edge-drag resizing** between adjacent areas, with a configurable minimum area size.
- **Per-area scrollable viewports** — when content overflows, the area scrolls; the layout never deforms.
- **Tree-based internal model** — binary tree of splits, every node either leaf (area) or internal (vertical/horizontal split). Serializable to/from JSON.
- **Workspace presets** — named saved layouts the user can switch between via tabs.
- **Controlled and uncontrolled modes** — consumers can own the layout state or let the component manage it.
- **Keyboard accessibility** for split / merge / resize (gestures alone fail AA).
- **Responsive layout collapse** — viewports below the configured mobile breakpoint render as a 1-column stack of cards (leaves in tree-traversal order). Tree state is preserved internally; widening the viewport restores the full layout. No corner gestures, no edge-drag in stacked mode. (This is the special case of `maxSplitDepth.mobile = 0`; the same flatten-deeper-subtrees principle applies at the tablet breakpoint when the existing tree exceeds the tablet cap — see next bullet.)
- **Per-breakpoint hard cap on split depth** — `maxSplitDepth: number | { mobile?, tablet?, desktop? }`. The cap is **per-leaf** (a leaf can split iff its own depth < cap; merge is never gated by the cap because it doesn't deepen the tree) and enforced two ways:
  - **Preventive:** when the leaf the corner-drag started on is at cap, the **split intent** is suppressed — no preview line, no error toast. The gesture itself engages (so merge into a neighbor still works); only split-on-release is the no-op. Discoverable through inertness, not through error UI. Devtools console logs once per session for developer debugging.
  - **Adaptive:** when a viewport shift changes the active breakpoint and the existing tree is deeper than the new cap, subtrees deeper than the cap **flatten to card stacks within their parent region**. The tree is preserved internally and resizing back up restores the original layout exactly (same area-ids, same component-ids, same positions).
- **State preservation across split** — splitting an area preserves the **original area's component instance and its internal state**; the new sibling area mounts a **fresh instance** of the same component. Documented as the contract.

### Out of scope (deliberate non-goals)

- **Floating / overlapping panels** — explicitly rejected. The whole point is non-overlapping tiling.
- **Tab-based UIs inside an area** — different paradigm; if a consumer wants tabs inside an area, they register a tabbed component themselves.
- **Implementations of registered components** — the registry is empty by default. Consumer-supplied.
- **Persistence to a backend** — workspace tree is serializable; saving is the consumer's job.
- **Detach-to-OS-window** — the original brief mentions it. **Deferred to v0.2** (see Q2 in §7). Area ids stay stable and subtrees stay independently serializable so v0.2 can add it without breaking v0.1's API.
- **Touch / pen support for corner gestures** — desktop-first in v0.1.0. On narrow viewports the layout collapses to a card stack (no gestures needed). v0.2 may add a long-press → action-sheet alternative.
- **Cross-tab sync** of layouts.
- **Built-in undo/redo** — consumer can wire it via `onLayoutChange` snapshots; we don't ship a history stack.
- **Non-rectangular regions** — areas are always axis-aligned rectangles. No diagonal splits, no L-shapes.
- **Drag-and-drop of components between areas** — type-switch via dropdown is the intended path; DnD is a v0.2 conversation.
- **Live collaborative editing** of layouts.

---

## 3. Target consumers

Four concrete archetypes drive the design, in priority order:

| Archetype | Example | What they need |
|---|---|---|
| **Dashboard / admin console team** *(primary)* | Ops console, observability portal, BI tool, internal CRUD app | Many widgets, ad-hoc rearrangement, "let me put two charts side by side without rebuilding the page" |
| **Dev-tool / IDE-like builder** *(primary)* | Code/console/preview app, query workbench, log explorer | Code + terminal + file tree + preview, with workspace presets per workflow ("debug", "review", "write") |
| **Data-exploration app** *(primary)* | Notebook UI, BI explorer, debugging console | Table + chart + filter + detail side-by-side, reconfigured per question |
| Creative-tool builder *(secondary)* | Image editor, audio workstation, design tool | Edit + properties + outliner + history side-by-side; user-controlled layout per task |

Non-targets: simple landing pages, marketing sites, transactional forms, content-first reading apps. For those, this is overkill — use a regular layout component.

---

## 4. Rough API sketch (NOT final — that's the plan stage)

This is illustrative. The plan doc will lock the final shape after we agree on the description.

```ts
// What consumers register
type WorkspaceComponent = {
  id: string;                          // unique within the registry
  name: string;                        // shown in the dropdown
  icon?: ReactNode;                    // optional, shown left of name
  category?: string;                   // optional grouping label in the dropdown
  render: (ctx: AreaContext) => ReactNode;
};

// What an area's render() function receives
type AreaContext = {
  areaId: string;                      // stable id for the area
  width: number;                       // current pixel width
  height: number;                      // current pixel height
  isFocused: boolean;
};

// Layout tree (what gets serialized)
type AreaTree =
  | { kind: "leaf"; id: string; componentId: string }
  | { kind: "split"; orientation: "vertical" | "horizontal"; ratio: number; a: AreaTree; b: AreaTree };

// The component itself
type WorkspaceProps = {
  components: WorkspaceComponent[];
  defaultComponentId: string;          // what new areas show until changed (REQUIRED)

  layout?: AreaTree;                   // controlled mode
  defaultLayout?: AreaTree;            // uncontrolled mode
  onLayoutChange?: (next: AreaTree) => void;

  presets?: WorkspacePreset[];         // optional named layouts shown as tabs
  activePresetId?: string;
  onActivePresetChange?: (id: string) => void;

  minAreaSize?: { width: number; height: number };       // px floor; default { 120, 80 }

  // Hard cap on split nesting depth, per breakpoint. Gesture is inert at cap.
  maxSplitDepth?: number | {
    mobile?: number;   // default 0 — forces 1-column card stack
    tablet?: number;   // default 3
    desktop?: number;  // default 7
  };

  // Viewport thresholds (px width). Below mobile = card stack; below tablet = tablet caps; else desktop.
  breakpoints?: {
    mobile: number;    // default 640
    tablet: number;    // default 1024
  };

  className?: string;
};

type WorkspacePreset = {
  id: string;
  name: string;
  layout: AreaTree;
};
```

Five public types, two required props (`components`, `defaultComponentId`), ~ten optional props. If this expands to 30+ props during planning, the API is wrong and we restart this section.

---

## 5. Example usages

Examples appear in the same priority order as the archetypes in §3.

### 5.1 Dashboard — diverse widgets in a flexible grid (primary)

```tsx
<Workspace
  defaultComponentId="trend"
  components={[
    { id: "trend",  name: "Trend Chart", category: "Charts", render: () => <TrendChart /> },
    { id: "kpi",    name: "KPI Card",    category: "Stats",  render: () => <KpiCard /> },
    { id: "table",  name: "Data Table",  category: "Data",   render: () => <DataTable /> },
    { id: "alerts", name: "Alerts Feed", category: "Status", render: () => <AlertsFeed /> },
    { id: "filter", name: "Filters",     category: "Tools",  render: () => <FilterPanel /> },
  ]}
  defaultLayout={{
    kind: "split", orientation: "vertical", ratio: 0.22,
    a: { kind: "leaf", id: "left", componentId: "filter" },
    b: { kind: "split", orientation: "horizontal", ratio: 0.55,
         a: { kind: "leaf", id: "main", componentId: "trend" },
         b: { kind: "split", orientation: "vertical", ratio: 0.5,
              a: { kind: "leaf", id: "tbl",    componentId: "table" },
              b: { kind: "leaf", id: "alerts", componentId: "alerts" } } },
  }}
/>
```

Filter rail at left; trend chart fills the main area; data table and alerts feed split the lower-right corner. The user can swap any tile to a different registered component (the registry has five — `kpi` is unused initially but available via the dropdown), split a tile to compare two metrics side-by-side, or drag an edge to redistribute space. With the default `maxSplitDepth = { mobile: 0, tablet: 3, desktop: 7 }`, this depth-3 layout fits in full at desktop and tablet; on mobile, all four leaves render as a single column. To demonstrate adaptive flattening, lower the tablet cap (e.g. `maxSplitDepth={{ tablet: 2 }}`) — the rightmost vertical split (table + alerts) then flattens to a card stack within the lower-right region.

### 5.2 Dev-tool — code + console + preview with presets (primary)

```tsx
<Workspace
  components={[
    { id: "code", name: "Code",     render: () => <CodeEditor /> },
    { id: "term", name: "Terminal", render: () => <Terminal /> },
    { id: "prev", name: "Preview",  render: () => <Preview /> },
    { id: "tree", name: "Files",    render: () => <FileTree /> },
  ]}
  defaultComponentId="code"
  presets={[
    { id: "write",  name: "Write",  layout: writeLayout },
    { id: "debug",  name: "Debug",  layout: debugLayout },
    { id: "review", name: "Review", layout: reviewLayout },
  ]}
/>
```

User clicks "Debug" tab → layout reflows to a vertical split of code over terminal with preview on the side.

### 5.3 Creative tool — image editor (secondary)

```tsx
<Workspace
  defaultComponentId="canvas"
  components={[
    { id: "canvas",     name: "Canvas",     category: "View",  render: () => <Canvas /> },
    { id: "properties", name: "Properties", category: "Tools", render: () => <PropertiesPanel /> },
    { id: "layers",     name: "Layers",     category: "Tools", render: () => <LayersPanel /> },
    { id: "history",    name: "History",    category: "Tools", render: () => <HistoryPanel /> },
  ]}
  defaultLayout={{
    kind: "split", orientation: "vertical", ratio: 0.7,
    a: { kind: "leaf", id: "main", componentId: "canvas" },
    b: { kind: "split", orientation: "horizontal", ratio: 0.5,
         a: { kind: "leaf", id: "side-top", componentId: "properties" },
         b: { kind: "leaf", id: "side-bot", componentId: "layers" } },
  }}
/>
```

---

## 6. Success criteria

The component ships v0.1.0 (alpha) when:

1. **Consumer onboarding**: a developer can register 3 sample components and see a working split/merge workspace in under 30 minutes from copy-paste.
2. **All gestures from the cheat sheet work** at first try (no scrolling docs):
   - Corner-drag inward → split
   - Corner-drag outward → merge
   - Edge-drag → resize
   - Top-left dropdown → swap component
3. **Layout serialization round-trips** — `onLayoutChange` produces JSON that fed back as `layout` reproduces the exact layout.
4. **State preservation contract**: resize never unmounts; split preserves the original area's component instance and state, mounts the new sibling fresh; only merge or type-switch unmounts.
5. **No hardcoded colors** — semantic Tailwind tokens only (per design system contract). Light/dark themes both look right.
6. **Performance**: 20+ areas at 60fps during edge-drag on a mid-tier laptop.
7. **Accessibility**: keyboard alternatives for split/merge/resize exist and are documented; focus visible on areas; semantic roles where applicable.
8. **Portability**: zero `next/*` imports, no `process.env`, no app-context coupling. Standard pro-component portability rules.
9. **Demo and usage docs** complete; one component (`data-table`-style) registered as the default demo content.
10. **Compiles and renders** at `/components/workspace` with no console warnings.
11. **Responsive collapse**: viewport below `breakpoints.mobile` renders a 1-column card stack of leaves in tree-traversal order. At the tablet breakpoint, subtrees deeper than `maxSplitDepth.tablet` flatten to card stacks within their parent region. Tree state is preserved across all breakpoint transitions — re-widening to desktop restores the full layout with the same area-ids and component-ids in the same positions.
12. **Hard depth cap honored** (preventive + adaptive): the cap is **per-leaf** (a leaf can split iff `leaf.depth < cap`; merge is unaffected). (a) When the originating leaf is at cap, **split intent is suppressed** during corner-drag — user-facing UI silent (no preview, no toast); merge into a neighbor on the same gesture still works; devtools console logs once per session. (b) When a viewport shift makes the existing tree exceed the new cap, deeper subtrees flatten gracefully without losing tree state.

Stable (`1.0.0`) is gated separately and includes external consumers + 30-day no-break window.

---

## 7. Locked decisions (was: open questions)

All twelve questions raised during description review have been resolved. Two diverged from the originally-proposed defaults — those are flagged ⚠. The plan stage will inherit these as fixed inputs.

| # | Question | Decision | Notes |
|---|---|---|---|
| Q1 | **Slug name** — `workspace` vs alternatives | **`workspace`** ✓ | Confirmed. Preset-tab UI labels can use "Layouts" if the term overlap matters in chrome strings. |
| Q2 | **Detach-to-OS-window in v0.1.0?** | **Defer to v0.2.** ✓ | Architectural hooks (stable area-ids, subtree-serializable) stay in v0.1 so v0.2 doesn't break the API. |
| Q3 | **State on split: clone or fresh-mount?** | ⚠ **Hybrid** — original area keeps its state and component instance; new sibling area mounts fresh. | Diverged from originally-proposed "fresh on both sides". The hybrid is achievable via stable area-ids as React keys; better UX. Documented as the contract. |
| Q4 | **Presets-tabs UI: included or separate?** | **Included.** ✓ | Renders only when `presets` prop is provided. No tab strip otherwise. |
| Q5 | **Touch / pen support** | **Desktop-first in v0.1.0.** Mobile viewports collapse to a **1-column stack of cards** instead of supporting gestures. ✓ | This unifies with Q12 — mobile = stacked cards = `maxSplitDepth.mobile` defaults to 0. |
| Q6 | **RTL flip orientation?** | **No.** ✓ | Splits stay orientation-named (vertical = side-by-side); chrome flips via CSS logical properties. |
| Q7 | **Configurable min area size?** | **Yes** — `minAreaSize` prop, default `{ width: 120, height: 80 }`. ✓ | |
| Q8 | **Required `defaultComponentId`?** | **Required.** ✓ | |
| Q9 | **`AreaContext.isFocused` semantics** | **`isFocused` = subtree contains `document.activeElement`.** ✓ | Single focus listener at the workspace root. Cheap. |
| Q10 | **Internal state model** | **Internal `useReducer`**, no zustand/jotai dep. ✓ | Consumers who want store integration use controlled mode. |
| Q11 | **DnD reorder between areas** | **Out of scope for v0.1.0.** ✓ | Revisit at v0.2 if real consumers ask. |
| Q12 | **Maximum tree depth** | ⚠ **HARD cap, configurable per breakpoint, applied per-leaf, enforced two ways.** A leaf can split iff its own depth < cap (`origin.depth < cap` inside `computeIntent`); merge is never gated since it doesn't deepen the tree. **Preventive:** when a leaf is at-cap, the split intent is suppressed — user-facing UI silent (no preview, no toast); devtools console logs once per session for developer debugging. The gesture itself still engages (so a merge into a neighbor still works on the same gesture). **Adaptive:** when a viewport shift makes the existing tree exceed the new cap, deeper subtrees flatten to card stacks within their parent region; tree preserved, resizing back up restores fully. | Diverged from originally-proposed "soft cap with warning". Default `{ mobile: 0, tablet: 3, desktop: 7 }`. The mobile-stack behavior is the special case `maxSplitDepth.mobile = 0`. |

### What "diverged" means

Q3 and Q12 are improvements over my original recommendations. Q3's hybrid is the better UX (preserves the user's working state on the existing area). Q12's hard cap is the better contract (a cap that warns but allows is functionally not a cap).

---

## 8. Risks

- **Scope creep.** This is the largest component in the registry by far. Every "while we're at it..." threatens v0.1.0 ship date. The plan stage must be ruthless about deferring.
- **Accessibility debt.** Mouse-first gestures are seductive; keyboard alternatives are usually bolted on later and feel like it. We must design them in from day 1, not ship and patch.
- **State-management entanglement.** Once consumers wire this up to their app's persistence layer, the API is hard to change. Get the controlled/uncontrolled story right *before* anyone consumes it.
- **Performance regressions on tree updates.** A 20-area tree re-rendered naively per pixel of edge-drag will jank. Plan must specify memoization strategy and `requestAnimationFrame` throttling.
- **Test coverage.** No test runner is wired in this repo. A component this complex needs *something* — either we land Vitest as a STATUS decision before this ships, or we ship with extensive demo-driven verification and a documented test-debt note. (Lean: raise as a STATUS decision.)

---

## 9. Definition of "done" for THIS document (stage gate)

Before moving to the plan stage:

- [x] Sections 1–8 reviewed.
- [x] Q1–Q12 each carry an agreed or overridden answer (see §7). Q3 and Q12 diverged from originally-proposed defaults; the new answers are the locked ones.
- [x] In-scope / Out-of-scope list updated — added: responsive collapse to 1-column card stack, hard depth cap, state-preservation on split. Confirmed deferred to v0.2: detach-to-OS-window, touch gestures, DnD between areas.
- [x] Framing reset — primary targets are dashboards / dev tools / data-exploration apps, not creative tools. Blender / VS Code / tiling WMs cited as conceptual lineage, not implementation models.
- [ ] **User explicitly says "description approved" (or equivalent)** — this unlocks Stage 2 (`workspace-procomp-plan.md`).

After sign-off, no editing this doc casually — changes after sign-off should be loud and intentional, not silent rewrites.

---

## Appendix A — Original concept brief (verbatim)

This is the user's authored description, preserved unchanged for reference. The structured sections above distill from this source.

> # Blender-Inspired Layout System — Comprehensive Description
>
> ## Overview
>
> The layout system is a **dynamic, infinitely subdivisible workspace** where the entire application window is treated as a single canvas that can be split, merged, and reconfigured in real-time. Unlike traditional tab-based or fixed-panel interfaces, every region of the screen is a fully functional, self-contained "editor area" that the user can transform on demand. The layout adapts to the user's workflow rather than forcing the user to adapt to a predefined layout.
>
> The core philosophy is: **no wasted space, no hidden panels, and total spatial freedom.** Every pixel belongs to some editor, and the user controls exactly how that real estate is divided.
>
> ---
>
> ## Core Concepts
>
> ### 1. The Editor Area (Window Pane)
>
> The fundamental building block of the layout is the **editor area** — a rectangular region that acts as a **generic, empty container** capable of hosting any predefined component or DOM content (a div, a widget, a custom component, etc.).
>
> Each editor area is **independent and self-sufficient**:
> - It owns its own header/toolbar
> - It owns its own content viewport, which is **scrollable** when the inner content exceeds the area's bounds (both vertically and horizontally as needed)
> - It owns its own context (scroll position, internal state, focus)
> - It does not depend on any neighbor to function
> - Its content is fully isolated — interactions inside one area do not bleed into others
>
> The screen begins as a single editor area covering the entire window, and all complex layouts are built by recursively subdividing this initial area.
>
> ### 2. The Component Registry
>
> Editor areas do not inherently "know" what to display. Instead, the system maintains a **registry of predefined components** that can be plugged into any area. A component is any self-contained UI module — examples include:
>
> - Chat panel
> - Banner
> - Clock
> - Canvas
> - Image viewer
> - Text editor
> - Node graph
> - Properties panel
> - Outliner / tree view
> - Terminal / console
> - Data table
> - Media player
> - Form builder
> - ...and any custom component the application developer registers
>
> Each registered component declares:
> - A **unique identifier** (used internally)
> - A **display name** (shown in the dropdown menu)
> - An **icon** (optional, for visual recognition)
> - A **category** (optional, for grouping in the dropdown — e.g., "Media", "Data", "Tools")
> - The **actual content** it renders inside the area
>
> The registry is the single source of truth for "what can go inside an area." Only registered components are selectable, which keeps the system predictable and prevents arbitrary content injection.
>
> ### 3. The Component Selector (Dropdown Menu)
>
> In one corner of every editor area's header (typically the top-left), there is a **dropdown selector** that defines which registered component the area currently displays. This is the single most important control of an editor area, because it determines the area's identity.
>
> Key behaviors:
> - Clicking the selector reveals a categorized menu listing **all components from the registry**
> - Switching the selection **instantly swaps the content** of the area — the previous component unmounts and the new one mounts in its place
> - The area's size, position, and surrounding layout remain unchanged; only the inner content changes
> - Multiple areas can display the **same component simultaneously** (e.g., two clocks showing different time zones, two canvases for side-by-side comparison)
> - When content overflows the area, the area's viewport **scrolls** rather than clipping or pushing neighbors
>
> This makes the layout fluid: any area can become any registered component at any time, without rearranging the workspace.
>
> ---
>
> ## The Split & Merge System
>
> This is the heart of the layout's dynamism. The user never opens "new windows" through menus — instead, they **directly manipulate the geometry of existing areas** using a corner-based gesture system.
>
> ### 4. Corner Action Zones
>
> Every editor area has small, interactive **action zones in its corners** (visible as a subtle textured triangle or grip indicator). These corners are the universal entry points for splitting and merging. The cursor changes to a crosshair when hovering over them, signaling that a layout operation is available.
>
> A single gesture — **click and drag from a corner** — produces different results depending on the direction of the drag.
>
> ### 5. Splitting an Area (Creating a New Window)
>
> When the user **drags inward from a corner toward the interior of the same area**, the area is **split into two**:
> - Dragging horizontally (left or right) creates a **vertical split**, producing two side-by-side areas
> - Dragging vertically (up or down) creates a **horizontal split**, producing two stacked areas
> - A live preview line follows the cursor, showing exactly where the new boundary will land
> - On release, the original area is duplicated: both new areas inherit the **same component**, and the user can immediately change one of them via the dropdown selector
>
> This means **any area, at any size, can be split into smaller areas**, and the splits can be nested infinitely (a split area can itself be split, and so on).
>
> ### 6. Merging Areas (Replacing a Neighbor)
>
> When the user **drags outward from a corner toward a neighboring area**, the two areas are **merged**:
> - A directional arrow overlay appears, indicating which area will absorb which
> - The area being "dragged onto" is the one that gets replaced — its component is unmounted and discarded
> - The originating area expands to fill the combined region, keeping its component intact
> - Merging only works between **directly adjacent areas that share a full edge** (you cannot merge across non-aligned boundaries)
>
> This gesture is the inverse of splitting and uses the exact same corner-and-drag interaction, which makes the system feel symmetrical and intuitive.
>
> ### 7. Resizing Boundaries
>
> Between any two adjacent areas, the **shared edge itself is draggable**. Hovering over a boundary changes the cursor to a resize handle, and dragging it redistributes space between the two neighbors. Boundaries can be moved freely as long as no area shrinks below a minimum viable size.
>
> When multiple areas share aligned edges (e.g., three areas in a row), dragging a shared boundary may move all aligned edges together, preserving the visual grid integrity of the layout.
>
> When an area is resized smaller, its inner component does not break — the area's **scrollable viewport** absorbs the size change, and scrollbars appear automatically if the content no longer fits.
>
> ---
>
> ## Layout Behavior & Rules
>
> ### 8. Tree-Based Geometry
>
> Internally, the layout behaves like a **binary tree of splits**:
> - The root is the entire window
> - Every node is either a leaf (an editor area hosting one component) or an internal split (vertical or horizontal) with two children
> - Splits and merges modify this tree structure
> - This guarantees that the layout always tiles the window perfectly with no gaps and no overlaps
>
> ### 9. Non-Overlapping, Non-Floating
>
> Unlike traditional UIs with floating/dockable panels, **areas never overlap and never float**. Every area is rectangular, occupies a unique region, and tiles seamlessly with its neighbors. There are no z-order issues, no panels covering each other, and no hidden content.
>
> ### 10. Component Lifecycle Across Layout Changes
>
> Because components can be mounted, unmounted, and re-mounted as the user splits, merges, and switches types, the system must define a clear lifecycle:
> - **On split**: the component is duplicated (or instanced twice), and each copy lives in its own area with its own internal state
> - **On merge**: the absorbed area's component is unmounted and its state is discarded; the surviving area's component continues uninterrupted
> - **On type switch**: the previous component is unmounted and the new one is mounted fresh
> - **On resize**: no mount/unmount occurs; the component simply re-flows within the new dimensions, with the area's scroll container handling overflow
>
> ### 11. Detachable Sub-Windows (Optional Extension)
>
> While the primary layout lives inside one main window, the user can **tear off an area into its own OS-level window** (typically via a modifier key + corner drag, or a header menu option). The detached window behaves as an independent layout root that can itself be split and merged. This is useful for multi-monitor setups.
>
> ### 12. Workspace Presets
>
> Layouts can be **saved as named presets** (called "workspaces") and switched between via tabs at the top of the application. Each preset captures the full split tree and the component assigned to each area. Users can have one workspace optimized for one task, another for a different task, and switch instantly.
>
> ---
>
> ## Interaction Summary (Gesture Cheat Sheet)
>
> | Gesture | Result |
> |---|---|
> | Click corner + drag **inward** (into same area) | Split the area into two |
> | Click corner + drag **outward** (into neighbor) | Merge — neighbor is replaced |
> | Click + drag a **shared edge** | Resize the boundary between two areas |
> | Click the **top-left dropdown** of an area | Change that area's component from the registry |
> | Click + drag a corner with a **modifier key** | Detach the area into a floating window |
> | Scroll inside an area when content overflows | The area's viewport scrolls independently |
>
> ---
>
> ## Design Principles
>
> The layout system embodies several principles worth preserving in any reimplementation:
>
> 1. **Everything is the same kind of thing.** Every region is a generic editor area with the same header, corner gestures, and scroll behavior. There are no "special" panels with unique rules.
> 2. **Components are pluggable, not hardcoded.** The layout system itself knows nothing about what a "chat panel" or "clock" does — it only knows how to host whatever the registry provides.
> 3. **Direct manipulation over menus.** Layout changes happen by grabbing the layout itself, not by opening dialogs or settings.
> 4. **Reversibility.** Every action has a clear inverse: split ↔ merge, resize ↔ resize back, switch component ↔ switch back.
> 5. **No modal layout state.** The user never enters a "layout editing mode" — the layout is always editable, and editing it is part of normal use.
> 6. **Content adapts to container, not the other way around.** When an area is small, its component scrolls. The layout never deforms a component's intrinsic size; it just gives it a scrollable window onto its content.
> 7. **Spatial persistence.** Layouts feel like physical spaces: edges are real, corners are grippable, and dragging things has predictable physical consequences.
