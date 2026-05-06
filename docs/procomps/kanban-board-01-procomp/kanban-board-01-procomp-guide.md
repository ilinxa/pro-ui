# `kanban-board-01` — Consumer Guide (Stage 3)

> **Stage:** 3 of 3 · **Status:** v0.2.0 (alpha)
> **Slug:** `kanban-board-01` · **Category:** `data`
> **In-app docs:** [`usage.tsx`](../../../src/registry/components/data/kanban-board-01/usage.tsx) renders at `/components/kanban-board-01`. This doc covers the bits that don't belong in the in-app surface.

## Install

```bash
pnpm dlx shadcn@latest add @ilinxa/kanban-board-01
pnpm dlx shadcn@latest add @ilinxa/kanban-board-01-fixtures   # optional — adds dummy data
```

The base item depends on 8 shadcn primitives (`avatar`, `badge`, `button`, `dropdown-menu`, `input`, `popover`, `textarea`, `tooltip`) and 4 npm packages (`@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities`, `lucide-react`). The shadcn CLI resolves all of them automatically. Column-body scroll uses native `overflow-y-auto` (no scroll-area dep).

## Mental model in one paragraph

A column is an **ordered list of opaque items**. Each item is a JSON record `{ id, rendererId, data, swimlaneId?, locked? }`. The board doesn't render anything itself — it delegates to a renderer looked up by `rendererId` from the `renderers` prop. Two renderers ship built-in (`kanbanCardRenderer`, `kanbanNoteRenderer`); register more to host any kind of card. A single column may freely mix kinds — a kanban-card, a sticky note, and a fully-featured rich-card can sit as siblings in the same swimlane cell.

## Composition recipes

### Hosting a sibling rich component as a kanban item (rich-card adapter)

The renderer-registry's marquee feature: any sibling component from this library can be plugged in as a third renderer with **all of its features intact**. The demo wires `<RichCard>` (the structural-content tree editor) — same pattern works for any rich card you author.

```tsx
import { RichCard, type RichCardJsonNode } from "@ilinxa/rich-card";
import {
  KanbanBoard,
  kanbanCardRenderer,
  kanbanNoteRenderer,
  type KanbanCardRenderer,
} from "@ilinxa/kanban-board-01";

function makeRichCardRenderer(
  onItemDataChange: (itemId: string, next: RichCardJsonNode) => void,
): KanbanCardRenderer<RichCardJsonNode> {
  return {
    id: "rich-card",
    label: "Rich card",
    dragHandle: "header", // ← thin grip strip on top; body stays interactive
    render: (data, ctx) => (
      <RichCard
        key={ctx.itemId}
        defaultValue={data}
        editable
        onChange={(tree) => onItemDataChange(ctx.itemId, tree)}
      />
    ),
    newItem: () => ({ __rcid: crypto.randomUUID(), title: "New card" }),
    // No editForm — RichCard has its own click-to-edit UX.
  };
}
```

The `dragHandle: "header"` is what makes this work. RichCard owns clicks, keyboard input, and its own internal DnD; if the kanban shell competed for those events the inner editor would break. Switching to header mode renders a small grip strip on top — only that strip activates kanban DnD — and lets the entire body stay interactive.

For state, lift the kanban data to the host and have the rich-card renderer call back into a shared updater. Items reference the renderer by id:

```ts
{ id: "p1", rendererId: "rich-card", data: { __rcid: "n1", title: "...", /* ... */ } satisfies RichCardJsonNode }
```

The full wiring lives in [demo.tsx](../../../src/registry/components/data/kanban-board-01/demo.tsx).

### Read-only board (status snapshot embedded in a dashboard)

```tsx
<KanbanBoard renderers={[kanbanCardRenderer]} data={data} readOnly />
```

`readOnly` removes ALL DnD wiring and ALL CRUD affordances. Clicks remain — `onItemClick` still fires.

### Notes-only column

```tsx
{
  id: "notes",
  title: "Notes",
  acceptsRendererIds: ["kanban-note"],   // rejects card drops
  items: [...],
}
```

### Pinned-Done column (drop in but never reorder, never leave)

```tsx
{
  id: "done",
  title: "Done",
  allowReorder: false,    // no internal reorder
  allowOutgoing: false,   // items can't leave once dropped here
  items: [...],
}
```

### Per-item lock

```ts
{ id: "blocked-1", rendererId: "kanban-card", data: {...}, locked: true }
```

Lock overrides column-level flags. Lock icon renders on hover; drag is suppressed; click still fires.

### Custom palette (brand colors)

```tsx
const myPalette = [
  { id: "brand-blue", label: "Brand Blue", cssVar: "--brand-blue" },
  { id: "brand-coral", label: "Brand Coral", cssVar: "--brand-coral" },
  // ... up to whatever you want; the picker grid is auto-sized
];

<KanbanBoard renderers={[...]} palette={myPalette} ... />
```

The CSS vars must resolve in the consuming app's stylesheet. The palette REPLACES the built-in 6-swatch (no merge).

## Writing your own renderer

Minimum:
```ts
type MyData = { headline: string; cover?: string };

const myRenderer: KanbanCardRenderer<MyData> = {
  id: "story",
  label: "Story",
  render: (data, ctx) => (
    <div data-dragging={ctx.isDragging}>
      {data.cover ? <img src={data.cover} alt="" /> : null}
      <h3>{data.headline}</h3>
    </div>
  ),
};
```

Full opt-in (inline create + inline edit):
```ts
const myRenderer: KanbanCardRenderer<MyData> = {
  id: "story",
  label: "Story",
  render: (data, ctx) => <StoryView data={data} ctx={ctx} />,
  newItem: () => ({ headline: "" }),
  editForm: (data, onSave, onCancel) => (
    <StoryEditForm data={data} onSave={onSave} onCancel={onCancel} />
  ),
};
```

The board wraps your renderer's output in a uniform draggable shell — grip handle, lock icon, focus ring, drop-target highlight, `aria-roledescription="<label>, draggable"`. **Renderers don't need to know about DnD.**

### `dragHandle` — choosing where DnD activates

Two modes per renderer:

| Mode | Drag activator | When to use |
|---|---|---|
| `"shell"` *(default)* | The whole item card | Standard cards (kanban-card, kanban-note) — body has no internal pointer interactions. Whole-card grab feels natural. |
| `"header"` | A thin grip strip rendered above the item | Renderers with their own click-to-edit, inputs, or internal DnD (the rich-card adapter, any embedded WYSIWYG, image annotators, etc.) — keeps the body fully interactive. |

In `"header"` mode the shell renders a `h-7` grip bar with a "drag" affordance; only its pointer events feed dnd-kit. The renderer's own root keeps `cursor-default` and pointer events flow normally to its children. Switching modes is a single field on your renderer object — no other API surface changes.

## State: controlled vs uncontrolled

| Mode | Use when |
|---|---|
| **Uncontrolled** (`defaultData` + `onChange`) | You want the board to own its state and just need notifications for persistence. |
| **Controlled** (`data` + `onChange`) | You're integrating with a bigger app store / undo system / live collaboration where the board's state must reflect external sources. |

In controlled mode, every internal action calls `onChange(nextData)` instead of mutating internal state. You're responsible for echoing the new state back via `data`.

## CRUD callback semantics

Affordances render only when their callback is supplied:

| Callback | What renders | What you receive |
|---|---|---|
| `onItemCreate` | Inline `+ Add` row at column footer | `(columnId, item)` — item is fully formed (id + rendererId + data) |
| `onItemUpdate` | Edit affordance on item hover | `(item)` |
| `onItemDelete` | Delete affordance on item hover | `(itemId)` |
| `onColumnCreate` | Right-edge `+ Add column` button | `(column)` — column is fully formed (id + title + empty items) |
| `onColumnUpdate` | Column kebab menu → Rename | `(column)` *(currently the menu just calls back; render your own modal)* |
| `onColumnDelete` | Column kebab menu → Delete | `(columnId)` |
| `onItemClick` | (no affordance — just behavior) | `(item)` on click |
| `onItemMove` | (no affordance — just behavior) | `(item, from, to)` after a successful move |

**Reducer also runs on every callback.** In uncontrolled mode the board's state already reflects the change before your callback fires — useful for "fire-and-forget" persistence.

## Keyboard

| Key | On focused item | On focused column header |
|---|---|---|
| `Tab` | Move focus | Move focus |
| `Enter` | `onItemClick(item)` | (button activate, e.g. column kebab) |
| `Space` | Lift (DnD mode) | Lift column for reorder |
| Arrow keys (in DnD mode) | Move | Move |
| `Space` again (in DnD mode) | Drop | Drop |
| `Escape` | Cancel | Cancel |

dnd-kit's announcer publishes drag start / over / end / cancel events to a live region — screen readers narrate the reorder.

## Versioning

`v0.2.0` is alpha. v0.2 added the `dragHandle` field on renderers, the rich-card adapter pattern in the demo, and replaced the radix `<ScrollArea>` column body with native `overflow-y-auto` for reliability inside flex chains. v0.1 → v0.2 is **non-breaking** — the new `dragHandle` field is optional with `"shell"` default, and the column-body swap is internal. Future feature additions (multi-select drag, hard WIP, virtualization, swimlane reorder, undo/redo) land in v0.3+. Breaking API changes go to `v1.0.0` only after external consumers and a 30-day no-break window.

## Caveats

- **No backend.** Board state is serializable JSON; persistence is your job. Wire `onChange` to your store / API.
- **No card-detail modal.** Click a card → fire `onItemClick(item)` → consumer routes to a detail surface of their choice.
- **No per-card comment thread.** The `kanban-note` renderer covers between-cards annotations; for full per-card threads, embed `comment-thread-01` inside your detail surface.
- **`maxItems` is soft.** Renders an overflow chip; does NOT block drops. Hard enforcement is a v0.2 ask.
- **No virtualization.** v0.1 budgets to ~50 items / 5 columns. Beyond that, file an issue or wait for v0.2 (`@tanstack/react-virtual` is already a project dep).
