# `detail-panel` — Pro-component Guide (Stage 3)

> **Stage:** 3 of 3 · **Shipped:** v0.1.0 (alpha) · **Date:** 2026-05-09
> **Slug:** `detail-panel` · **Category:** `feedback`
> **Files:** [src/registry/components/feedback/detail-panel/](../../../src/registry/components/feedback/detail-panel/)
> **Detail page:** `/components/detail-panel` (after `pnpm dev`)

The consumer-facing reference. The description ([detail-panel-procomp-description.md](detail-panel-procomp-description.md)) explains *why*; the plan ([detail-panel-procomp-plan.md](detail-panel-procomp-plan.md)) explains *how we built it*; this doc explains *how to use it*.

---

## When to use DetailPanel

Reach for it when a **selection drives a side-panel** showing details — and the panel needs to handle the realities of selection-driven UIs: state changes when selection changes, optional inline editing, loading + error lifecycle, focus management. Three signals:

1. **Selection-driven detail surfaces.** Click a row in a table → see the row's full record. Click a node in a graph → see the node's properties. Click a card in a kanban → see the card's metadata. The panel updates when selection changes.
2. **Optional inline editing.** The panel toggles between read mode (display) and edit mode (form). Per-permission `canEdit` gating; properties-form (Tier 1) is the canonical edit-form pairing.
3. **Lifecycle states.** While loading, show a skeleton. On error, show a retry. With no selection, show an empty-state. With a selection, show the content. detail-panel orchestrates the precedence so you don't have to.

## When NOT to use DetailPanel

- **Always-open page panels.** If the panel is part of the layout (always visible), use a regular section/region — detail-panel's selection-aware machinery is overkill.
- **Modal dialogs.** detail-panel is a `<div role="region">`, not a modal. For "click row → open dialog", use Radix Dialog or shadcn Dialog. detail-panel sits inline on the page.
- **Wizard / multi-step forms.** detail-panel has a single body slot + read/edit modes. For a 3-step wizard, build a dedicated component or use Tabs.
- **Master-detail with the master inside the panel.** The master (list/grid) lives outside; detail-panel is the *detail* half. It receives the `selection` from outside.
- **Sub-component-per-detail patterns.** If every selection type needs a wildly different rendering, you're better off conditional-switching outside the panel.

## The five-minute walkthrough

```tsx
import { useState } from "react";
import { DetailPanel, type DetailPanelSelection } from "@/components/detail-panel";

interface Project {
  id: string;
  type: "project";
  name: string;
  status: "active" | "archived";
}

const projects: Project[] = [
  { id: "p1", type: "project", name: "Phoenix", status: "active" },
  { id: "p2", type: "project", name: "Atlas",   status: "archived" },
];

export function ProjectInspector() {
  const [selection, setSelection] = useState<DetailPanelSelection | null>(null);
  const project = projects.find((p) => p.id === selection?.id) ?? null;

  return (
    <div className="grid h-screen grid-cols-[240px_1fr]">
      <ProjectList projects={projects} onSelect={setSelection} />
      <div className="p-4">
        <DetailPanel
          selection={selection}
          ariaLabel={project ? `${project.name} details` : "No selection"}
        >
          {project ? (
            <>
              <DetailPanel.Header>
                <h2 className="text-lg font-semibold">{project.name}</h2>
              </DetailPanel.Header>
              <DetailPanel.Body>
                <dl>
                  <dt>Status</dt>
                  <dd>{project.status}</dd>
                </dl>
              </DetailPanel.Body>
            </>
          ) : null}
        </DetailPanel>
      </div>
    </div>
  );
}
```

That's a working selection-driven panel. The user clicks a project in the list (the "master"); state updates `selection`; detail-panel re-renders the children keyed on `${type}:${id}`. When `selection` is null, detail-panel shows its built-in empty state.

## The mental model

DetailPanel is **a stateful container with five lifecycle slots and a compound API**.

### The 5 lifecycle states (precedence: error > loading > content > empty)

```
              ┌─ error      → DetailPanel.Error    (built-in)  ──┐
              ├─ loading    → DetailPanel.Skeleton (built-in)  ──┤
selection? ──┤                                                    ├── one renders
              ├─ children   → your <Header>, <Body>, <Actions>  ──┤
              └─ empty      → DetailPanelEmptyState (built-in) ──┘
                  (no selection)                  OR your `emptyState` prop
```

Whichever state the props describe wins. The built-ins ship with sane defaults; consumers override via:
- `error={{ message, retry? }}` — render `<DetailPanel.Error>` (built-in retry button if `retry` supplied)
- `loading={true}` — render `<DetailPanel.Skeleton>` (mirrors the panel's layout)
- `selection !== null && children` — render your composition
- `selection === null` — render `emptyState` slot OR the default `<DetailPanelEmptyState>`

### The compound children

```tsx
<DetailPanel selection={...} ariaLabel={...}>
  <DetailPanel.Header>...</DetailPanel.Header>     {/* sticky-top by default */}
  <DetailPanel.Body>...</DetailPanel.Body>          {/* scrollable middle */}
  <DetailPanel.Actions position="footer | header"> {/* sticky-bottom by default; render-fn or static */}
    {({ mode, setMode, canEdit }) => /* render-fn for mode-aware actions */}
  </DetailPanel.Actions>
</DetailPanel>
```

### The two modes

`DetailPanelMode = "read" | "edit"`. `mode` is controlled or uncontrolled (mirrors React form-input convention):

| Pattern | Setup | Notes |
|---|---|---|
| **Uncontrolled** | omit `mode` and `onModeChange` | Internal state; defaults to `"read"`; resets on selection change |
| **Controlled** | pass both `mode` and `onModeChange` | You drive it from your store / URL / parent state |
| **Locked** | pass `mode` without `onModeChange` (or `canEdit={false}`) | Dev-warned anti-pattern unless intentional; locks to a single mode |

### The composite re-key

The internal body wraps your children in `<div key={`${selection.type}:${selection.id}`}>`. When selection changes, React **unmounts + remounts** the children — your form state, drafts, dirty flags all reset cleanly. No stale `value` from the prior selection bleeds into the new one.

### Focus management

Focus moves automatically:
- **selection changes** → panel root receives focus (preventScroll: true)
- **mode → "edit"** → first focusable inside `<DetailPanel.Body>` receives focus
- **mode → "read"** → focus restores to the action that triggered the mode change (typically the Edit button)

You don't write any of this code. The component handles it.

## Composition patterns

These cover the recurring "how do I…" cases. Combine freely.

### 1. The kasder-canonical compound

```tsx
<DetailPanel selection={selection} ariaLabel={node?.name ?? "Detail"}>
  <DetailPanel.Header>
    <h2>{node.name}</h2>
    <Badge>{node.status}</Badge>
  </DetailPanel.Header>
  <DetailPanel.Body>
    <NodeForm node={node} />
  </DetailPanel.Body>
  <DetailPanel.Actions>
    <Button>Save</Button>
  </DetailPanel.Actions>
</DetailPanel>
```

Static actions: same regardless of mode. Use when you don't need read/edit-mode-aware UI.

### 2. Mode-aware actions (render-fn)

```tsx
<DetailPanel.Actions>
  {({ mode, setMode, canEdit }) =>
    mode === "read" ? (
      <Button disabled={!canEdit} onClick={() => setMode("edit")}>
        Edit
      </Button>
    ) : (
      <>
        <Button variant="ghost" onClick={() => setMode("read")}>Cancel</Button>
        <Button onClick={() => /* save then */ setMode("read")}>Save</Button>
      </>
    )
  }
</DetailPanel.Actions>
```

Render-fn receives `{ mode, setMode, canEdit }` from context. Pattern matches React's compound + render-prop idioms.

### 3. Mode-aware body

The body itself can be mode-aware via the `useDetailPanel` context hook (exported from `@/components/detail-panel/parts/detail-panel-context`):

```tsx
import { useDetailPanel } from "@/components/detail-panel/parts/detail-panel-context";

function NodeBody({ node }: { node: Node }) {
  const { mode } = useDetailPanel();
  if (mode === "read") return <NodeReadView node={node} />;
  return <NodeEditForm node={node} />;
}
```

Use when read/edit are visually distinct enough to warrant separate render trees.

### 4. Properties-form pairing

The canonical inline-edit pairing — properties-form (Tier 1, reviewed) is built to compose into detail-panel's body slot. The properties-form schema-driven validation + dirty state + submit handlers integrate cleanly:

```tsx
<DetailPanel selection={selection}>
  <DetailPanel.Header>{node.name}</DetailPanel.Header>
  <DetailPanel.Body>
    <PropertiesForm
      schema={nodeSchema}
      value={node}
      mode={mode}        // propagate panel mode → form mode
      onSubmit={(next) => mutate(next)}
    />
  </DetailPanel.Body>
  <DetailPanel.Actions>
    {({ mode, setMode }) => /* read/edit toggle calling form ref */}
  </DetailPanel.Actions>
</DetailPanel>
```

The composite re-key ensures form state resets when selection changes. No leak between two selections.

### 5. Custom empty state

```tsx
<DetailPanel
  selection={selection}
  emptyState={
    <div className="flex h-full flex-col items-center justify-center gap-3 p-6">
      <DetailPanelEmptyState
        title="Pick a node"
        description="Click a graph node or use the search palette."
      />
      <Button onClick={loadDefault}>Load default node</Button>
    </div>
  }
>
  ...
</DetailPanel>
```

`emptyState` is a slot (ReactNode). For minor variants, use the exported `<DetailPanelEmptyState title="..." description="..." />` building block. For full takeover, replace it entirely.

### 6. Loading + error orchestration

```tsx
const { data, isLoading, error, refetch } = useNode(selection?.id);

<DetailPanel
  selection={selection}
  loading={isLoading}
  error={error ? { message: error.message, retry: refetch } : null}
>
  {data ? (
    <>
      <DetailPanel.Header>{data.name}</DetailPanel.Header>
      <DetailPanel.Body><NodeView node={data} /></DetailPanel.Body>
    </>
  ) : null}
</DetailPanel>
```

The precedence (error > loading > content > empty) means you always set both `loading` and `error` from your data layer — detail-panel picks the right state.

### 7. Imperative reset on save

Handle saves cleanly with the imperative handle:

```tsx
const ref = useRef<DetailPanelHandle>(null);

async function handleSave(next: Node) {
  await mutate(next);
  ref.current?.resetMode();   // back to read mode
}

<DetailPanel ref={ref} selection={selection}>
  ...
</DetailPanel>
```

Or programmatically focus the body:

```tsx
ref.current?.focusBody();  // useful after a tab/keyboard navigation
```

## Gotchas

### 1. `ariaLabel` is currently optional but should always be supplied

`<div role="region">` requires an accessible name per WAI-ARIA. The component doesn't yet enforce a default ARIA name for the region. Always pass `ariaLabel`. (v0.1.1 will likely make this required or provide a default.)

### 2. The composite re-key uses `${type}:${id}`

If you reuse `id` across types (e.g., `id: "1"` exists in both `node` and `edge` namespaces), the panel correctly remounts when the type changes. Don't try to share state across types — the remount is intentional.

### 3. Focus moves on selection change

The panel root receives focus when selection changes. If your master list is keyboard-driven, this means focus moves OUT of the list into the panel. To prevent the user "losing" their list position, restore focus to the list after the user signals "back to list" (e.g., Escape inside the panel).

### 4. Mode-on-mount under uncontrolled

The default uncontrolled mode is `"read"`. On every selection change the mode resets to `"read"`. If you need the panel to stay in edit mode across selections (rare), use the controlled pattern + persist mode in your store.

### 5. Children are NOT memoized for you

The `children` prop receives whatever JSX you pass; if your parent re-renders for unrelated reasons, the `<DetailPanel.Body>`'s subtree re-renders too. Wrap heavy bodies in `useMemo` or extract a memoized component:

```tsx
const body = useMemo(() => <ExpensiveBody node={node} />, [node]);
return <DetailPanel ...>{body}</DetailPanel>;
```

### 6. `canEdit={false}` + `mode="edit"` is undefined behavior

Don't combine `canEdit={false}` with a controlled `mode="edit"`. Either lock to read mode (set `canEdit={false}` and let mode default to read), or allow edit mode (set `canEdit={true}`). The component dev-warns; production behavior is "stays in edit mode but actions disabled," which is rarely what you want.

### 7. The error retry is your callback

`error={{ message, retry }}` — the built-in `<DetailPanel.Error>` renders the retry button only when `retry` is supplied. Your `retry` is what's called; the panel doesn't manage retry state. Wire it to your data layer's refetch.

### 8. `<DetailPanel.Actions position="header">` opts in to header placement

By default, actions render in the sticky footer. To put a "Quick action" cluster in the header, set `position="header"`. You CAN have two `<DetailPanel.Actions>` (one footer, one header) — they don't conflict.

### 9. The `selection` shape is intentionally minimal

`{ type: string; id: string }` — that's all detail-panel knows. Your real entity (the project / node / file) is fetched from your data layer using `selection.id` (and optionally `selection.type` if your IDs aren't globally unique). Don't try to put richer data on `selection`; it's the composite re-key, not the payload.

## Cookbook

### Recipe 1 — Master-detail with table → panel

```tsx
const [selection, setSelection] = useState<DetailPanelSelection | null>(null);

<div className="grid grid-cols-[1fr_400px]">
  <DataTable
    items={rows}
    onRowClick={(row) => setSelection({ type: "row", id: row.id })}
  />
  <DetailPanel selection={selection} ariaLabel={selectedRow?.title ?? "Row details"}>
    {selectedRow ? (
      <>
        <DetailPanel.Header>{selectedRow.title}</DetailPanel.Header>
        <DetailPanel.Body>{/* read view */}</DetailPanel.Body>
      </>
    ) : null}
  </DetailPanel>
</div>
```

### Recipe 2 — Persist mode in URL

```tsx
const router = useRouter();
const mode = (router.query.mode as DetailPanelMode) ?? "read";
const setMode = (next: DetailPanelMode) => {
  router.replace({ query: { ...router.query, mode: next } });
};

<DetailPanel mode={mode} onModeChange={setMode} ...>
  ...
</DetailPanel>
```

Allows deep-linking to edit mode (e.g., `/items/abc?mode=edit`).

### Recipe 3 — Optimistic save with rollback

```tsx
const [optimistic, setOptimistic] = useState<Node | null>(null);

async function handleSave(next: Node) {
  setOptimistic(next);                      // optimistic UI
  ref.current?.resetMode();                 // back to read
  try {
    await mutate(next);
  } catch (e) {
    setOptimistic(null);                    // rollback
    setError({ message: "Save failed", retry: () => handleSave(next) });
  }
}
```

### Recipe 4 — Confirm-before-discarding-edit

```tsx
const [hasDirtyEdits, setHasDirtyEdits] = useState(false);
const [pendingSelection, setPendingSelection] = useState<DetailPanelSelection | null>(null);

function tryNavigate(next: DetailPanelSelection | null) {
  if (hasDirtyEdits) {
    setPendingSelection(next);              // queue
    showConfirmDialog();
  } else {
    setSelection(next);
  }
}

// On confirm: setSelection(pendingSelection); setHasDirtyEdits(false); setPendingSelection(null);
```

### Recipe 5 — Per-permission edit gating

```tsx
const canEdit = useUserHasPermission("entity:edit", selection?.id);

<DetailPanel selection={selection} canEdit={canEdit} ...>
  ...
</DetailPanel>
```

The Actions render-fn receives `canEdit`; disable Edit button when `false`.

### Recipe 6 — Custom skeleton

```tsx
<DetailPanel selection={selection} loading={isLoading}>
  {/* When loading=true, the built-in <DetailPanel.Skeleton> renders.
      To replace, use a custom render flow: */}
  {isLoading ? (
    <DetailPanel.Body>
      <CustomSkeleton />
    </DetailPanel.Body>
  ) : (
    <>
      <DetailPanel.Header>...</DetailPanel.Header>
      <DetailPanel.Body>...</DetailPanel.Body>
    </>
  )}
</DetailPanel>
```

(For "always custom skeleton," set `loading={false}` and conditionally render your own skeleton inside `children`.)

## What ships in v0.2+

The roadmap (per description + plan):

- **`DetailPanel.Empty` compound shorthand** — currently `DetailPanelEmptyState` is a sibling export; v0.2 adds `DetailPanel.Empty = DetailPanelEmptyState` for consistency with `Header` / `Body` / `Actions`.
- **Required `ariaLabel`** OR **default `labels.region`** — currently optional, leaves a `<div role="region">` without accessible name if omitted. v0.1.1 closes this.
- **`DetailPanelError` type rename to `DetailPanelErrorInfo`** — disambiguate from the internal `<DetailPanelError>` component. v0.2 (with deprecation alias).
- **Multi-selection mode** — current contract is single-selection. v0.2+ may add `selection: Selection | Selection[]` for multi-edit flows (typed properly via overloads or a separate `<MultiDetailPanel>`).
- **Resizable** — v0.2 candidate to add `<DetailPanel.Resizer>` for user-controlled width.
- **Confirm-before-mode-change** — currently mode changes are immediate; v0.2 may add `onBeforeModeChange?: (next) => boolean | Promise<boolean>` for "are you sure?" guards.

All v0.2+ items are designed as additive — no breaking changes to v0.1 API (except the `DetailPanelError` rename with deprecation period).

## Migration notes

- **From a hand-rolled "if (selection) show form, else show empty" panel.** Replace your conditional rendering with `<DetailPanel selection={selection}>` and pass children unconditionally — detail-panel handles the empty state.
- **From a Radix Dialog with selection-driven open state.** Different component class. detail-panel is inline (`<div role="region">`), not modal (`<dialog>`). If you need modal behavior, use Radix Dialog. detail-panel is for "always-visible side panel updated by selection."
- **From a v0.x earlier than 0.1** — there is no earlier version. v0.1 is the first ship.

If you're moving from a hand-rolled inline panel:
1. Replace the panel root `<div>` with `<DetailPanel>`.
2. Move the title/header content into `<DetailPanel.Header>`.
3. Move the body content into `<DetailPanel.Body>`.
4. Move action buttons into `<DetailPanel.Actions>`.
5. Wire your loading/error state to the `loading`/`error` props.
6. Delete your "if no selection" empty-state fallback — detail-panel ships one.
7. (Optional) Migrate to controlled `mode` if you need URL persistence or cross-component sync.

The compound API + lifecycle precedence + composite re-key + focus management together replace ~150–200 LOC of typical hand-rolled inline-panel code.

## Reference

### Public exports

```ts
// from @/components/detail-panel
export { DetailPanel, DetailPanelEmptyState, meta };
export type {
  DetailPanelActionsContext,
  DetailPanelActionsProps,
  DetailPanelActionsRenderFn,
  DetailPanelBodyProps,
  DetailPanelError,        // type — error data shape
  DetailPanelHandle,
  DetailPanelHeaderProps,
  DetailPanelMode,
  DetailPanelProps,
  DetailPanelSelection,
};
```

### Props (root)

| Prop | Type | Default | Notes |
|---|---|---|---|
| `selection` | `DetailPanelSelection \| null` | required | `{ type, id }`. Composite re-key on change. |
| `mode` | `DetailPanelMode` | undefined | `"read" \| "edit"`. Pass with `onModeChange` for controlled. |
| `onModeChange` | `(mode) => void` | undefined | Pair with `mode`. |
| `canEdit` | `boolean` | `true` | Forwarded to Actions render-fn ctx. |
| `loading` | `boolean` | `false` | Renders `<DetailPanel.Skeleton>`. |
| `error` | `DetailPanelError \| null` | `null` | `{ message, retry? }`. Renders `<DetailPanel.Error>`. |
| `emptyState` | `ReactNode` | undefined | Falls back to `<DetailPanelEmptyState>`. |
| `children` | `ReactNode` | required | Your `<Header>` / `<Body>` / `<Actions>` composition. |
| `ariaLabel` | `string` | undefined | **Should always be supplied** (region role requires accessible name). |
| `className` | `string` | undefined | Forwarded to root. |
| `ref` | `Ref<DetailPanelHandle>` | undefined | React 19 ref-as-prop. |

### Compound children

| Component | Static prop | Notes |
|---|---|---|
| `DetailPanel.Header` | `sticky?: boolean` (default `true`) | Sticky-top by default. |
| `DetailPanel.Body` | `className?: string` | Scrollable middle section. |
| `DetailPanel.Actions` | `position?: "footer" \| "header"` (default `"footer"`) | Children can be a render-fn `(ctx) => ReactNode`. |

### Imperative handle

| Method | Signature | Notes |
|---|---|---|
| `focusBody` | `() => void` | Focuses first focusable inside `<DetailPanel.Body>`, or the body itself. |
| `resetMode` | `() => void` | Sets mode back to `"read"`. Useful after save. |

### Lifecycle precedence

Highest priority renders:

1. `error` → `<DetailPanel.Error>` (built-in retry if `error.retry`)
2. `loading` → `<DetailPanel.Skeleton>` (mirrors panel layout)
3. `selection !== null` → your `children` (re-keyed on `${type}:${id}`)
4. `selection === null` → `emptyState` slot OR `<DetailPanelEmptyState>` default

### Mode patterns

| Pattern | `mode` prop | `onModeChange` | `canEdit` |
|---|---|---|---|
| Uncontrolled | omit | omit | `true` (default) |
| Controlled | required | required | `true` |
| Locked-read | `"read"` | omit | `false` (anti-pattern; dev-warned) |

### Dev warnings

In non-production builds, the component warns when:
- `mode` is supplied without `onModeChange` (locked anti-pattern)
- `canEdit={false}` is combined with a controlled `mode="edit"`

Production builds strip the warnings per the project's dev-warn convention.

---

*End of guide. Pair with [detail-panel-procomp-description.md](detail-panel-procomp-description.md) for the *why* and [detail-panel-procomp-plan.md](detail-panel-procomp-plan.md) for the *how*.*
