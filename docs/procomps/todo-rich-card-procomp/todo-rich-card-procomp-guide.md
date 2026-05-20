# `todo-rich-card` — Pro-component Guide (Stage 3)

> **Stage:** 3 of 3 · **Status:** Authored alongside v0.1.0 implementation
> **Slug:** `todo-rich-card` · **Category:** `data`
> **Version:** 0.1.0 (alpha) · **Shipped:** 2026-05-20
> Consumer-facing usage notes. The description doc explains "why," the plan doc explains "how"; this doc explains "use it."

---

## When to use

Reach for `todo-rich-card` when you need a **time-aware task surface** carrying the standard task fields, painted with urgency directly onto the chrome, and fully data-interactive.

Good fits:
- **Workflow / agent run queues** — tasks have hard deadlines; the auto-color makes overdue ones unmissable
- **Editorial / content scheduling** — `setAt` + `expireAt` model embargo and sunset directly
- **Sprint / project boards** — drop into `kanban-board-01` via the included renderer
- **Pipeline graphs** — drop into `flow-canvas-01` via the sibling `todo-rich-card-in-flow` adapter (shipping separately)
- **Standalone task viewers / editors** — works on its own with no orchestration shell

## When NOT to use

- **You need sort/filter/search across many tasks** → use the sibling `todo-list` procomp (ships separately) which wraps this card in three variants (rich / tree / kanban).
- **Your tasks aren't time-bound** → the auto-color engine is the headline feature; without `expireAt`/`duration`, the border falls back to the semantic-token color (still works, but you're paying for unused engine).
- **You need a calendar grid or gantt timeline** → use a calendar/gantt primitive. This card sits in a flow; it doesn't place itself on a time axis.
- **You need recurring tasks** → no RRULE engine. Generate fresh `TodoItem`s on the consumer side.

---

## Basic install

```bash
pnpm dlx shadcn@latest add @ilinxa/todo-rich-card
```

Then in your code:

```tsx
import { TodoRichCard } from "@/components/todo-rich-card";

export function Example() {
  return (
    <TodoRichCard
      defaultValue={{
        id: "task-001",
        name: "Review pull request #482",
        description: "Auth middleware rewrite — flagged by legal compliance.",
        status: "in-progress",
        active: true,
        setAt: "2026-05-19T09:00:00Z",
        expireAt: "2026-05-21T17:00:00Z",
      }}
      editable
    />
  );
}
```

For fixtures (the four-item demo set):
```bash
pnpm dlx shadcn@latest add @ilinxa/todo-rich-card-fixtures
```

---

## The auto-color engine

The headline feature. Border color comes from `elapsed = (now - startAt) / (expireAt - startAt)`, clamped to `[0, 1]`, then mapped through an OKLCH ramp — **green at 0**, **red at 1**.

| Field combination | Behavior |
|---|---|
| `setAt` only | Engine inactive; border falls back to default `--border` token |
| `setAt` + `expireAt` | Normalize over `(expireAt - startAt)` (uses `startAt ?? setAt`) |
| `setAt` + `duration` | Normalize over `duration` from `startAt ?? setAt` |
| `setAt` + `expireAt` + `duration` | **`expireAt` wins**; `duration` ignored |
| `now > expireAt` | Pinned to `1.0` → full red |
| `now < startAt` | Pinned to `0.0` → full green |

**Per-item override:** `item.borderColor = "<any CSS color>"` skips the engine for that item only.

Users can also override the color interactively: from the action menu (the `...` button on the card header) choose **Override color…** to open a centered Dialog with a curated 8-swatch OKLCH palette, a free-text input for any CSS color string, and an **Auto** button (with sparkle icon) that clears the override and hands control back to the time engine.

**Per-host ramp swap:**

```tsx
<TodoRichCard colorRamp="muted" defaultValue={...} />
<TodoRichCard colorRamp="vivid" defaultValue={...} />
<TodoRichCard colorRamp="monochrome" defaultValue={...} />
<TodoRichCard
  colorRamp={(elapsed) => `oklch(0.7 0.2 ${250 - elapsed * 200})`}
  defaultValue={...}
/>
```

**Refresh cadence:** `colorRefreshIntervalMs={60_000}` is the default. Single root `setInterval` ticks the whole tree. Pass `0` to disable the timer (render-time computation still works at mount but won't refresh). For consumer-driven external clocks, remount via `key` or pass a `now` factory that reads from your app's tick source.

---

## SSR + the `now` prop

**Default behavior (default `now`):** the engine reads `new Date()` at render time. On SSR, the server and client compute different values, which would normally trigger React's hydration warning. We mitigate with `suppressHydrationWarning` on the card root — the visual flash is sub-frame and the data is consistent server→client because the underlying `TodoItem` is the same.

**For deterministic SSR** (snapshot tests, server-rendered HTML caching), pass a frozen clock:

```tsx
<TodoRichCard
  defaultValue={...}
  now={new Date("2026-05-20T12:00:00Z")}  // frozen
/>

// Or a factory if your app has its own clock:
<TodoRichCard
  defaultValue={...}
  now={() => myAppClock.currentTime()}
/>
```

Frozen clocks also stop the refresh interval from advancing the displayed elapsed.

---

## Edit modes

| `editable` | What the edit button does | Where to make edits |
|---|---|---|
| `false` (default) | Single click → opens a popup dialog | All fields in one form, batched on Save |
| `true` | Single click → toggles inline mode for that item | Each field commits on blur / Enter |

When `editable=true`, a secondary "Edit in dialog…" icon also appears next to the toggle, and the action menu carries the same option. Inline edits commit one field at a time; popup edits batch into a single Save.

**`locked: true`** on an item blocks both modes. `onPermissionDenied` fires with `reason: 'locked'`.

**`onEditRequest(event)`** fires before either mode opens. Return `false` to veto:

```tsx
<TodoRichCard
  onEditRequest={({ itemId, mode }) => {
    if (shouldRedirectToDetailPage(itemId)) {
      router.push(`/tasks/${itemId}`);
      return false;  // veto opening
    }
  }}
/>
```

---

## Collapsibility

Every card carries a chevron icon at the left of its header. Clicking it toggles a collapsed/expanded state for that card; collapsed cards hide their body (description, time-info, person chips, links, images) **and** their nested children — only the header (chevron + name + status + active switch + edit / action menu) remains visible.

**Per-item, independent at every depth.** Collapsing a parent doesn't force children to collapse; collapsing a child doesn't affect siblings.

**UI-only state.** The collapsed-or-not flag lives in the component's internal reducer (`collapsedIds: ReadonlySet<string>`); it is **not** stored in the `TodoItem` schema. JSON I/O round-trips ignore it. Remounting via `key` resets all collapse state to expanded.

```tsx
// Programmatic control is not exposed on v0.1's handle — the affordance is
// user-driven via the header chevron. v0.2 may add `setCollapsed(id, bool)` /
// `expandAll()` / `collapseAll()` to the imperative handle if real consumers ask.
```

---

## JSON I/O + clipboard

### Imperative ref handle

```tsx
const ref = useRef<TodoRichCardHandle>(null);

// Read
const json: string = ref.current!.getValue();   // pretty-printed canonical
const tree: TodoItem = ref.current!.getTree();  // object form
const dirty: boolean = ref.current!.isDirty();
ref.current!.markClean();

// Write
ref.current!.setBorderColor("task-001", "oklch(0.7 0.2 90)");
ref.current!.toggleActive("task-001");
ref.current!.setLocked("task-001", true);
ref.current!.openEdit("task-001", "popup");
ref.current!.closeEdit();
ref.current!.focusItem("task-001");

// Clipboard
await ref.current!.copy("task-001");           // root if id omitted
await ref.current!.paste("task-001");           // root if id omitted
```

### Keyboard shortcuts (card must have focus)

| Keys | Action |
|---|---|
| `Cmd/Ctrl + C` | Copy focused card to clipboard |
| `Cmd/Ctrl + V` | Paste from clipboard as child of focused card |
| `Enter` / `Space` | Open default edit affordance |
| `Escape` | Close any open edit |

### DnD

Cards are draggable as a source AND children-group is a drop target. Payload format:

- Primary MIME: `application/x-ilinxa-todo+json`
- Fallback: `text/plain` containing the same JSON

Drag a card onto another's children area → drops as a child. Non-matching payloads are rejected gracefully (no-op). Browsers without custom-MIME support use the text/plain fallback.

---

## Permissions

Mirrors rich-card's pattern. Two layers:

**Declarative permissions matrix:**

```tsx
<TodoRichCard
  permissions={{
    default: { edit: true, remove: false },       // all items: editable but can't remove
    byLevel: { 1: { remove: true } },              // root level can remove
    byItem: { "task-001": { drag: false } },       // specific item can't be dragged
    inherit: true,                                  // cascade through descendants
  }}
/>
```

**Per-action predicates (override the matrix per call):**

```tsx
<TodoRichCard
  canEditItem={(id) => userIs("admin") || id.startsWith("draft-")}
  canRemoveItem={(id) => !id.startsWith("locked-")}
  canAddChildren={(id) => permissions.has(`add:${id}`)}
  canDragItem={() => isDesktop}
  canToggleActive={() => true}
  canOverrideColor={() => userIs("admin")}
  onPermissionDenied={(action, itemId, reason) => {
    analytics.track("todo_permission_denied", { action, itemId, reason });
  }}
/>
```

**Hard-lock:** `item.locked = true` blocks everything with `reason: 'locked'`. This wins over every predicate and matrix entry.

---

## Composing with kanban-board-01

Use the included `todoRichCardKanbanRenderer`:

```tsx
import { KanbanBoard01 } from "@/components/kanban-board-01";
import { todoRichCardKanbanRenderer } from "@/components/todo-rich-card";

<KanbanBoard01
  renderers={[todoRichCardKanbanRenderer]}
  data={{
    columns: [
      {
        id: "todo",
        title: "To do",
        items: [
          {
            id: "task-001",
            rendererId: "todo-rich-card",
            data: { /* TodoItem shape */ },
          },
        ],
      },
    ],
  }}
/>
```

The renderer uses `dragHandle: "header"` — the kanban-board attaches its drag listeners to a thin grip strip above the card body so internal pointer interactions (inline editors, color picker, action menu) work cleanly.

---

## Composing with flow-canvas-01

The sibling adapter `todo-rich-card-in-flow` ships separately and exposes a NodeRenderer that wraps this card. Once that adapter ships:

```tsx
import { ReactFlowProvider } from "@xyflow/react";
import { FlowCanvas } from "@/components/flow-canvas-01";
import { todoRichCardFlowRenderer } from "@/components/todo-rich-card-in-flow";

<FlowCanvas
  nodeTypes={{ "todo-rich-card": todoRichCardFlowRenderer }}
  defaultNodes={...}
  defaultEdges={...}
/>
```

(Refer to `todo-rich-card-in-flow`'s own guide for the full integration when it ships.)

---

## Status rendering

By default, `status` renders as a `<Badge variant="secondary">` with the raw string as the label. For variant-colored badges and a `<Select>` in edit modes, pass `statusOptions`:

```tsx
<TodoRichCard
  defaultValue={...}
  statusOptions={[
    { value: "todo",        label: "To do",       variant: "outline" },
    { value: "in-progress", label: "In progress", variant: "default" },
    { value: "blocked",     label: "Blocked",     variant: "destructive" },
    { value: "done",        label: "Done",        variant: "secondary" },
  ]}
/>
```

Status values not matching any option render as-is (raw string in `secondary` variant). No constraint enforcement — the schema's `status: string` is intentionally open.

---

## Gotchas

- **Images and links are read-only in inline edit mode** (v0.1). Use the popup to add/remove. Slot-prop renderers for these fields land in v0.2.
- **No undo/redo in v0.1.** Wire optimistic-undo yourself via `onChange` if you need it, or wait for v0.2+.
- **One item edits at a time.** Opening a new edit closes any open one. The reducer enforces this.
- **`id` collisions** auto-recover by minting a fresh UUID + console warning. Don't rely on this — fix your input data.
- **`children: TodoItem[]` is recursive.** Children render with the same component as the root. They carry the same action affordances (edit button, drag handle, lock toggle, color override). No per-level styling in v0.1 — every depth looks the same.
- **`now()` default is `() => new Date()`.** SSR will produce hydration warnings if you don't pass a frozen `now`. The card root sets `suppressHydrationWarning` to mute it gracefully, but consumers needing perfect SSR should pass a frozen clock.
- **`colorRefreshIntervalMs = 0` disables the timer entirely.** Render-time computation still uses `now()` at mount. Re-render via `key` or external state to refresh.
- **Custom `colorRamp` functions are trusted** — invalid CSS color strings fall back silently to the browser default. Validate before passing if needed.
- **`onChange` fires on every structural mutation,** debounced only by React's batched updates. If you wire this to a persistence layer, debounce/throttle on your side.
- **The kanban adapter renders ONE `TodoRichCard` per kanban item.** The item's own `children` recurse inside that card — kanban "items" are not the same as todo "children." For deep nesting in a kanban, flatten one level at the kanban level and keep depth inside each card.

---

## Migration notes

This is a new component — no migration path. If you have an existing todo data model, map it to `TodoItem` at the boundary; the closed schema is intentional and won't bend.

---

## Open follow-ups

- **v0.1.1 patch** — Add `removeItem(id)` + `addChild(parentId, item, index?)` to the imperative handle (per spotcheck F-03).
- **v0.2** — Slot props for person/link/image renderers; field-level permission predicates; `setCollapsed(id, bool)` / `expandAll()` / `collapseAll()` on the imperative handle (if consumers ask); SSR strategy switch from `suppressHydrationWarning` to `useSyncExternalStore` (per spotcheck F-01).
- **v0.3** — Custom ramp registry; optional overdue pulse keyframe (gated on framer-motion adoption).
- **Companion** — `todo-rich-card-in-flow` adapter procomp for flow-canvas-01.
- **Test runner** — Vitest landing is project-wide. Pure `lib/` modules (color engine, ramp, permissions, normalize, json-io) are the highest-priority test targets.
