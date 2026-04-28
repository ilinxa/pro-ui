# `workspace` — Pro-component Guide (Stage 3)

> **Stage:** 3 of 3 · **Shipped:** v0.1.0 (alpha) · **Date:** 2026-04-27
> **Slug:** `workspace` · **Category:** `layout`
> **Files:** [src/registry/components/layout/workspace/](../../../src/registry/components/layout/workspace/)
> **Detail page:** `/components/workspace` (after `pnpm dev`)

The consumer-facing reference. The description ([workspace-procomp-description.md](workspace-procomp-description.md)) explains *why*; the plan ([workspace-procomp-plan.md](workspace-procomp-plan.md)) explains *how we built it*; this doc explains *how to use it*.

---

## When to use Workspace

Reach for it when one fixed layout never fits every user's workflow. Three concrete signals:

1. **Diverse widgets.** You have many panels (charts, tables, filters, logs, code, terminal, preview, properties) and users want to mix-and-match — not rearrange them through a settings dialog.
2. **Long sessions.** The user lives inside the app for hours and the layout *is* their environment. Dashboards, dev tools, BI explorers, ops consoles.
3. **Power users.** The user is an analyst, dev, ops engineer, or producer — not a casual visitor. They care enough about their workflow to set it up once.

## When NOT to use Workspace

- Marketing sites, landing pages, content-first reading apps. Use a regular layout.
- Transactional forms (signup, checkout). Use a fixed shell.
- Mobile-first apps. Workspace collapses to a card stack on phones — the gesture model assumes desktop. If your users are 90%+ mobile, this is overkill.
- Apps where you (the developer) actually *want* one canonical layout. Workspace is for "we don't know what users will want, so let them decide."

## The five-minute walkthrough

```tsx
import { Workspace, type WorkspaceComponent } from "@/registry/components/layout/workspace";

const components: WorkspaceComponent[] = [
  { id: "chart",  name: "Chart",   category: "Data",  render: () => <Chart /> },
  { id: "table",  name: "Table",   category: "Data",  render: () => <Table /> },
  { id: "filter", name: "Filters", category: "Tools", render: () => <Filters /> },
];

export function App() {
  return (
    <div className="h-screen w-full">
      <Workspace components={components} defaultComponentId="chart" />
    </div>
  );
}
```

That's a working workspace. The user starts with one full-screen `Chart`. They drag a corner inward to split into two. They use the dropdown in each area's header to switch between the three components. They drag the divider to resize.

## The mental model

The workspace is **a binary tree of splits**. Every node is either a leaf (an editor area showing one of your registered components) or an internal split node (vertical or horizontal) with two children. The root is the entire workspace; the leaves are the visible areas.

Splits and merges are tree edits:

| User gesture | Tree change |
|---|---|
| Corner-drag inward | A leaf becomes an internal split with two leaves |
| Corner-drag outward (onto neighbor) | An internal split's surviving child replaces the split |
| Edge-drag | A split node's `ratio` changes |
| Dropdown swap | A leaf's `componentId` changes |

## Composition patterns

### Pattern 1: pure components

The simplest case — registered components are pure, take no props, render the same content every time. The content might still be live (clock, market ticker) or stateful internally (notes, counter), but each component is self-contained.

```tsx
const components: WorkspaceComponent[] = [
  { id: "clock",  name: "Clock",  render: () => <Clock /> },
  { id: "notes",  name: "Notes",  render: () => <Notes /> },
];
```

Multiple areas can host the same component — two clocks, two notes pads — and each gets its own state.

### Pattern 2: live area context

Components that depend on their area's dimensions or focus state read live values via `useAreaContext()`:

```tsx
import { useAreaContext } from "@/registry/components/layout/workspace";

function Chart() {
  const { width, height, isFocused } = useAreaContext();
  return <Sparkline width={width} height={height} highlight={isFocused} />;
}
```

`width` and `height` update on every resize (useful for canvas / SVG components). `isFocused` flips when the user focuses an element inside the area. `areaId` is stable for the lifetime of the area.

> `useAreaContext` throws if called outside a Workspace area's `render()` subtree. Don't try to read it from a parent.

### Pattern 3: parameterized via closure

Closures capture per-component data:

```tsx
function makeMetricCard(metricId: string): WorkspaceComponent {
  return {
    id: `metric-${metricId}`,
    name: metricId.toUpperCase(),
    category: "Metrics",
    render: () => <MetricCard metricId={metricId} />,
  };
}

const components = METRICS.map(makeMetricCard);
```

This is how you wire up "one component per metric" without exploding the registry by hand.

### Pattern 4: controlled mode for persistence

For "remember the user's layout" UX, use controlled mode:

```tsx
const [layout, setLayout] = useState<AreaTree>(() => loadFromLocalStorage());

useEffect(() => saveToLocalStorage(layout), [layout]);

return (
  <Workspace
    components={components}
    defaultComponentId="chart"
    layout={layout}
    onLayoutChange={setLayout}
  />
);
```

The `AreaTree` is plain JSON — `JSON.stringify` / `JSON.parse` round-trip cleanly. Persist to localStorage, IndexedDB, your backend, or wherever.

### Pattern 5: presets as tabs

For "saved workflows" UX, supply `presets`:

```tsx
const presets: WorkspacePreset[] = [
  { id: "write",  name: "Write",  layout: writeLayout },
  { id: "debug",  name: "Debug",  layout: debugLayout },
  { id: "review", name: "Review", layout: reviewLayout },
];

<Workspace
  components={components}
  defaultComponentId="code"
  presets={presets}
/>
```

The user sees a tab strip at the top. Clicking a tab swaps the entire layout to that preset's tree. Combine with controlled mode if you want users to *modify* presets, not just switch them.

## Gotchas

### Set a height on the wrapper

Workspace fills its container. If the container has no height, the workspace is 0px tall. Common fixes:

```tsx
<div className="h-screen">    {/* full viewport */}
<div className="h-150">       {/* fixed 600px */}
<div className="flex-1">      {/* fill remaining flex space */}
```

### State preservation, exactly

- **Resize** → no remount. Internal component state survives.
- **Split** → the *original* area keeps its state and component instance. The *new sibling* mounts fresh with the same `componentId`. (Try this with the `Counter` in the demo — increment, then split a corner.)
- **Merge** → the absorbed area unmounts (its state is lost). The surviving area continues uninterrupted.
- **Type-switch via dropdown** → the area unmounts the old component and mounts the new one fresh.

If you need state to persist across remount events (e.g., merge), lift state into your app store. The workspace is layout, not state.

### Mobile collapses to a card stack

Below `breakpoints.mobile` (default 640px), the layout flattens to a 1-column stack of cards in tree-traversal order. No corner gestures, no edge resizing. The dropdown selector still works.

The tree itself is preserved — widening the viewport restores the full layout with the same area-ids.

### The depth cap is a hard cap

`maxSplitDepth` (default `{ mobile: 0, tablet: 3, desktop: 7 }`) is a *hard* cap, applied **per leaf** — splitting a leaf at depth N produces children at depth N+1, so the rule is `leaf.depth < cap`. When a leaf is at cap:

- Splitting it is **inert** — no preview line, no toast. The gesture engages but produces no result on release.
- **Merging still works** — moving an area into a neighbor reduces depth, so cap never blocks it.
- Devtools console logs `[workspace] split inert: leaf at depth <N> would exceed cap <M> for breakpoint "..."` once per session.

If your users are hitting the cap and you think they shouldn't, lift it: `maxSplitDepth={{ desktop: 12 }}`.

### `defaultComponentId` is required

Without it, what does a freshly-split area show? You'd get a runtime error. Pick one component as the default — typically the most useful starting view.

### `componentId` mismatch renders a fallback

If your `layout` (or a preset) references a `componentId` that's not in `components[]`, that area shows a placeholder card with the missing id and a hint to swap. This is intentional — silent failure would be worse.

A common cause: persisted layouts referencing components that have since been removed from the registry. Either keep stale ids around forever, or version your layouts and migrate.

### `aria-label` defaults to "Workspace"

The root has `role="application"` (appropriate for keyboard-driven workspace UIs) and `aria-label="Workspace"` by default. Override per page:

```tsx
<Workspace components={...} defaultComponentId="..." aria-label="Sales dashboard" />
```

## Common operations cookbook

### Programmatically reset to a clean layout

Switch to controlled mode and replace the tree:

```tsx
const [layout, setLayout] = useState(initialLayout);

const reset = () => setLayout(initialLayout);
```

### Programmatically focus an area

The workspace tracks focus via `document.activeElement`. To programmatically focus an area, query `[data-area-id="..."]` and call `.focus()`:

```tsx
const ref = useRef<HTMLDivElement>(null);

useEffect(() => {
  ref.current?.querySelector<HTMLElement>('[data-area-id="main"]')?.focus();
}, []);

return <div ref={ref}><Workspace ... /></div>;
```

### Persist + restore

```tsx
const KEY = "myapp.workspace.layout";

const [layout, setLayout] = useState<AreaTree>(() => {
  const saved = localStorage.getItem(KEY);
  return saved ? JSON.parse(saved) : DEFAULT_LAYOUT;
});

useEffect(() => {
  localStorage.setItem(KEY, JSON.stringify(layout));
}, [layout]);

return <Workspace components={...} defaultComponentId="..." layout={layout} onLayoutChange={setLayout} />;
```

### Add a "reset layout" button outside the workspace

Same pattern — controlled mode, replace tree:

```tsx
<button onClick={() => setLayout(DEFAULT_LAYOUT)}>Reset layout</button>
<Workspace layout={layout} onLayoutChange={setLayout} ... />
```

## Known limitations / deferred to v0.2

These are deliberate non-goals for v0.1.0:

- **Detach-to-OS-window** (multi-monitor "tear off") — area-ids are stable, subtrees are independently serializable, so the architectural hooks are in place.
- **Touch / pen gestures** — desktop-first. Mobile users get the card stack instead.
- **Drag-and-drop components between areas** — use the dropdown picker.
- **Aligned-edge linked resize** — dragging one shared boundary moves only that boundary; multi-edge tracking is v0.2.
- **Built-in undo/redo** — wire your own history via `onLayoutChange` snapshots.
- **Cross-breakpoint animation** — when the viewport shifts breakpoints, the layout snaps. No animation in v0.1.

## Migration notes

This is the first ship. Nothing to migrate from. When v0.2 lands, this section will document any breaking changes.

## Open follow-ups

Tracked in [.claude/STATUS.md](../../../.claude/STATUS.md):

- **Test debt** — no test runner is wired in this repo. The pure modules in `lib/` (`tree.ts`, `reducer.ts`, `geometry.ts`) are written to be testable in isolation when Vitest lands. Visual verification for v0.1 is demo-driven (the `Counter` panel in the demo proves Q3 state preservation).
- **Aligned-edge linked resize** for v0.2.
- **Touch / pen support** for v0.2.
- **Detach-to-OS-window** for v0.2 — the API surface won't break when this lands.

## Reference

- **Description (what & why):** [workspace-procomp-description.md](workspace-procomp-description.md)
- **Plan (how it was built):** [workspace-procomp-plan.md](workspace-procomp-plan.md)
- **Source:** [src/registry/components/layout/workspace/](../../../src/registry/components/layout/workspace/)
- **Public API surface:** see `index.ts` in the source folder — `Workspace`, `useAreaContext`, plus 9 type exports
- **Dummy registry used in the demo:** [src/registry/components/layout/workspace/demo.tsx](../../../src/registry/components/layout/workspace/demo.tsx) — Notes, Clock, Counter, Data Table
