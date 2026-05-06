# `kanban-board-01` — Pro-component Plan (Stage 2)

> **Stage:** 2 of 3 · **Status:** Signed off · v0.2.0 (alpha)
> **Slug:** `kanban-board-01` · **Category:** `data`
> **Inputs:** description signed off ([kanban-board-01-procomp-description.md](kanban-board-01-procomp-description.md)). All fifteen description-stage decisions (Q1–Q15) are inherited as fixed inputs.

This doc locks **how** we build what the description doc said we'd build. After sign-off, no scaffolding-time second-guessing — implementation follows the plan, deviations are loud.

---

## v0.2 update (2026-05-06)

Three additive changes locked since the v0.1 sign-off:

1. **`KanbanCardRenderer` gains an optional `dragHandle?: "shell" | "header"`** — see §2 below for the full type. The shell-mounted `useSortable` listeners are now applied conditionally in `parts/item-shell.tsx`: shell-mode (default) keeps v0.1 behavior; header-mode renders a `h-7` grip strip on top of the item with the listeners scoped to it, leaving the body's pointer events untouched. Required for renderers with internal pointer interactions.
2. **Rich-card adapter pattern** — the demo now wires `<RichCard>` (sibling registry component) as a third renderer with full feature passthrough: `editable`, `defaultCollapsed`, `onChange`, predefined keys, internal DnD. State for rich-card items lives in the demo's hoisted `boardData` and the renderer closes over a setter that walks the columns to update the matching item's data on RichCard's `onChange`. **No core-kanban changes were needed beyond `dragHandle`** — the renderer-registry already supports any consumer renderer.
3. **`parts/column-body.tsx` swaps `<ScrollArea>` for native `overflow-y-auto`** — radix's ScrollArea was failing to constrain inside the `flex-1` chain when items expanded tall (rich cards). Native scroll on a `flex-1 min-h-0` div is more reliable. `min-h-0` was also added to the `Column` flex wrapper to propagate flex-shrink semantics. `scroll-area` removed from `meta.ts` shadcn deps and `registry.json`'s `registryDependencies`.

Demo + guide + meta updated. No consumer-facing migration needed.

---

## 1. Inherited inputs (from description, in one paragraph)

`kanban-board-01` is a `data`-category pro-component: a horizontal row of **columns** holding ordered lists of pure-JSON **items** `{ id, rendererId, data, swimlaneId?, locked? }`. The board itself is content-agnostic — it delegates rendering to a **renderer registry** (`KanbanCardRenderer[]`). Two renderers ship built-in (`kanban-card`, `kanban-note`); consumers register more (e.g. wrapping `<ProjectCard />` from elsewhere in the registry). Items in a single column may freely mix renderers. Drag and drop via **`@dnd-kit/core` + `@dnd-kit/sortable`** (already project deps). **Per-column movement controls** (`allowReorder`, `allowIncoming`, `allowOutgoing`, `acceptsRendererIds`), **per-item lock** (`item.locked`), **board-level `readOnly`**. **Optional CRUD** via callbacks; **inline editors** rendered by per-renderer `newItem` + `editForm` fields. **Color picker on column header** (built-in 6-swatch palette, overridable). **Collapsible columns** (~40px vertical strip). **Swimlanes** (cross-column horizontal grouping; each `(col × lane)` cell is its own droppable). **Soft `maxItems`** (warning chip, no block). Single sealed folder; controlled and uncontrolled both supported (`data` / `defaultData` / `onChange`). Touch / pen DnD via dnd-kit pointer sensor; keyboard DnD via dnd-kit keyboard sensor. Out-of-scope: card-detail modal, per-card thread, hard WIP limits, multi-select drag, cross-board drag, undo/redo, filters/search, real-time collab.

---

## 2. Final API (locked)

This is the public surface for v0.1.0. Every type goes in `types.ts` and is re-exported from `index.ts`. The plan stage adds three things to the description's sketch: a `KanbanRenderContext` field for `swimlaneId` (so renderers can react to lane), an explicit `findRenderer()` helper exported for advanced consumers, and a strict-typed reducer-action union (kept private).

```ts
// ───── public types ─────

export type KanbanRenderContext = {
  itemId: string;
  columnId: string;
  swimlaneId?: string;
  isDragging: boolean;
  isLocked: boolean;
};

export type KanbanCardRenderer<TData = unknown> = {
  id: string;                               // referenced by item.rendererId
  label: string;                            // shown in "+ Add" picker
  render: (data: TData, ctx: KanbanRenderContext) => ReactNode;

  // Optional inline create + edit. If both omitted, callbacks still fire and
  // the consumer must handle the form themselves.
  newItem?: () => TData;
  editForm?: (
    data: TData,
    onSave: (next: TData) => void,
    onCancel: () => void,
  ) => ReactNode;

  // v0.2 — drag activator location. Default "shell" (whole-card grab).
  // "header" renders a thin top grip strip and keeps the body interactive,
  // for renderers that own internal pointer events (rich-card, embedded WYSIWYG, etc.).
  dragHandle?: "shell" | "header";
};

export type KanbanItem = {
  id: string;                               // unique across the entire board
  rendererId: string;
  data: unknown;                            // renderer-specific payload (free-form JSON)
  swimlaneId?: string;
  locked?: boolean;
};

export type KanbanColumn = {
  id: string;
  title: string;
  description?: string;
  color?: string;                           // swatch id from palette
  collapsed?: boolean;
  items: KanbanItem[];

  // Movement controls (defaults: all true)
  allowReorder?: boolean;
  allowIncoming?: boolean;
  allowOutgoing?: boolean;
  acceptsRendererIds?: string[];            // default = all registered renderers

  maxItems?: number;                        // soft cap; renders warning chip, does not block
};

export type KanbanSwimlane = {
  id: string;
  title: string;
  description?: string;
  color?: string;
};

export type KanbanData = {
  columns: KanbanColumn[];
  swimlanes?: KanbanSwimlane[];             // omit = single implicit lane
};

export type KanbanPaletteSwatch = {
  id: string;                               // referenced by column.color
  label: string;                            // tooltip / a11y label
  cssVar: string;                           // e.g. "--chart-1" (CSS variable from globals.css)
};

export type KanbanBoardProps = {
  renderers: KanbanCardRenderer[];          // REQUIRED — at minimum [kanbanCardRenderer]

  // State
  data?: KanbanData;                        // controlled
  defaultData?: KanbanData;                 // uncontrolled
  onChange?: (next: KanbanData) => void;

  // CRUD — affordances render only when supplied
  onItemCreate?: (columnId: string, item: KanbanItem) => void;
  onItemUpdate?: (item: KanbanItem) => void;
  onItemDelete?: (itemId: string) => void;
  onColumnCreate?: (draft: Partial<KanbanColumn>) => void;
  onColumnUpdate?: (column: KanbanColumn) => void;
  onColumnDelete?: (columnId: string) => void;

  // Interaction
  onItemClick?: (item: KanbanItem) => void;
  onItemMove?: (
    item: KanbanItem,
    from: { columnId: string; swimlaneId?: string },
    to: { columnId: string; swimlaneId?: string },
  ) => void;                                // fires after a successful move; useful even in uncontrolled mode

  // Visual
  palette?: KanbanPaletteSwatch[];          // default: built-in 6-swatch palette
  readOnly?: boolean;                       // default false; kills DnD + CRUD globally

  // Accessibility
  "aria-label"?: string;                    // landmark name on root region; default "Kanban board"

  className?: string;
};

// ───── public helper (exported, no React) ─────

export function findRenderer(
  renderers: KanbanCardRenderer[],
  rendererId: string,
): KanbanCardRenderer | undefined;

// ───── built-in renderers (named exports) ─────

export const kanbanCardRenderer: KanbanCardRenderer<KanbanCardData>;
export const kanbanNoteRenderer: KanbanCardRenderer<KanbanNoteData>;

export type KanbanCardData = {
  title: string;
  description?: string;
  tags?: { label: string; color?: string }[];
  assignees?: { id: string; name: string; avatarUrl?: string }[];
  meta?: { key: string; label: string; value: ReactNode }[];
};

export type KanbanNoteData = {
  title: string;
  body?: string;
  color?: string;
};

// ───── private (not exported) ─────

type Action =
  | { type: "move-item";        itemId: string; toColumnId: string; toIndex: number; toSwimlaneId?: string }
  | { type: "reorder-column";   columnId: string; toIndex: number }
  | { type: "create-item";      columnId: string; item: KanbanItem; index?: number }
  | { type: "update-item";      item: KanbanItem }
  | { type: "delete-item";      itemId: string }
  | { type: "create-column";    column: KanbanColumn; index?: number }
  | { type: "update-column";    column: KanbanColumn }
  | { type: "delete-column";    columnId: string }
  | { type: "toggle-collapse";  columnId: string }
  | { type: "set-color";        columnId: string; color: string | undefined }
  | { type: "replace";          data: KanbanData };
```

**Defaults:**
- `palette`: 6 swatches mapping to existing CSS vars in `globals.css` — `slate` (`--muted-foreground`), `lime` (`--primary`), `amber` (`--chart-1`), `emerald` (`--chart-2`), `sky` (`--chart-3`), `rose` (`--destructive`). Final palette mapping locked in §6.
- `readOnly`: `false`
- `aria-label`: `"Kanban board"`

**Required props:** `renderers` only. Everything else is optional.

**Counts:** 9 public types + 1 helper + 2 built-in renderers + 2 renderer-data types. 1 required prop, 13 optional. The renderer registry pattern keeps the prop count from ballooning even though the component does a lot.

---

## 3. Architecture

### 3.1 Rendering strategy: stable-keyed sortable lists

The state-preservation contract from §6.5 of the description (moving an item across columns must NOT remount the rendered body) requires careful key management. The strategy:

```
<DndContext>                         ← board root
  <SortableContext                   ← horizontal column reorder
    items={columnIds}
    strategy={horizontalListSortingStrategy}
  >
    {columns.map(col =>
      <Column key={col.id}>
        {swimlanes.map(lane =>
          <SortableContext            ← per-cell vertical reorder
            id={`${col.id}:${lane?.id ?? "_"}`}
            items={cellItemIds}
            strategy={verticalListSortingStrategy}
          >
            {cellItems.map(item =>
              <ItemShell key={item.id}>
                <Renderer data={item.data} ctx={...} />
              </ItemShell>
            )}
          </SortableContext>
        )}
      </Column>
    )}
  </SortableContext>
  <DragOverlay>{activeItem && <Renderer ... />}</DragOverlay>
</DndContext>
```

Every level is keyed by stable id (column.id, item.id). When a move happens, dnd-kit reports `{ activeId, overId }` and the reducer mutates the data structure; React reconciles by id, so the moved item's DOM and renderer subtree are preserved.

**`<DragOverlay>`** renders the active item *outside* the column tree at viewport coordinates following the cursor — this is dnd-kit's recommended pattern for cross-column drags. It avoids the visual jump that happens when an item is removed from its source list and inserted into a target list mid-drag.

### 3.2 State model: single reducer over `KanbanData`

One `useReducer` lives in `kanban-board-01.tsx`. The state is `KanbanData` plus a small bag of UI state: `activeItemId` (currently dragged), `activeColumnId` (currently dragged column), `draftItem` (in-progress inline create).

The reducer is a **pure function** in `lib/reducer.ts` — testable independently of React.

**Controlled mode:** when `data` prop is provided, the reducer reads from props; mutating actions call `onChange(nextData)` instead of updating internal state. The single `replace` action covers any external state replacement.

**Uncontrolled mode:** internal state seeded from `defaultData`; `onChange` fires on every change but the consumer is not required to echo back.

### 3.3 Pure data operations in `lib/data.ts`

Extracted helpers (no React, no DOM, no side effects):

- `findItem(data, itemId): { item, columnId, index } | null`
- `findColumn(data, columnId): { column, index } | null`
- `moveItem(data, itemId, toColumnId, toIndex, toSwimlaneId?): KanbanData`
- `reorderColumn(data, columnId, toIndex): KanbanData`
- `addItem(data, columnId, item, index?): KanbanData`
- `updateItem(data, item): KanbanData`
- `deleteItem(data, itemId): KanbanData`
- `addColumn(data, column, index?): KanbanData`
- `updateColumn(data, column): KanbanData`
- `deleteColumn(data, columnId): KanbanData`
- `toggleCollapse(data, columnId): KanbanData`
- `setColumnColor(data, columnId, color | undefined): KanbanData`
- `validateData(data, renderers): { valid: boolean; errors: string[] }` — guards consumer-provided shape (unique ids, every `rendererId` resolves, every `swimlaneId` resolves)

These are the only mutation primitives. The reducer composes them.

### 3.4 Renderer registry lookup

A renderer registry is built once per render via `useMemo`:

```ts
const rendererMap = useMemo(
  () => new Map(renderers.map(r => [r.id, r])),
  [renderers],
);
```

Items lookup their renderer by `item.rendererId`; if missing, `<MissingRendererFallback />` renders (red-outlined card with the missing id and a console warning once per session). This keeps the board functional in the face of a mis-typed renderer id rather than crashing.

The `findRenderer()` helper is exposed publicly so consumers writing custom inline editors can use the same lookup logic.

### 3.5 Drop-validation logic in `lib/permissions.ts`

A drop is *valid* iff all of:

```ts
function canDrop(args: {
  data: KanbanData;
  itemId: string;
  fromColumnId: string;
  toColumnId: string;
  fromSwimlaneId: string | undefined;
  toSwimlaneId: string | undefined;
  readOnly: boolean;
}): boolean {
  if (args.readOnly) return false;
  const item = findItem(args.data, args.itemId)?.item;
  if (!item || item.locked) return false;

  const sameColumn = args.fromColumnId === args.toColumnId;
  const fromCol = findColumn(args.data, args.fromColumnId)?.column;
  const toCol   = findColumn(args.data, args.toColumnId)?.column;
  if (!fromCol || !toCol) return false;

  if (sameColumn && toCol.allowReorder === false) return false;
  if (!sameColumn) {
    if (fromCol.allowOutgoing === false) return false;
    if (toCol.allowIncoming === false) return false;
  }
  if (toCol.acceptsRendererIds && !toCol.acceptsRendererIds.includes(item.rendererId)) return false;

  return true;
}
```

`canDrop` runs in `onDragOver` (for live UI feedback — invalid target gets a red ring + `cursor: not-allowed`) AND in `onDragEnd` (final check before dispatch). Belt-and-suspenders because `onDragOver` only handles visual feedback; the final dispatch must re-validate in case state changed mid-gesture.

### 3.6 Swimlane geometry

When `data.swimlanes` is provided:
- Each column renders as a vertical stack of N cells, one per swimlane
- Each cell has its own `<SortableContext id={`${col.id}:${lane.id}`}>`
- Items belong to exactly one cell, determined by `item.swimlaneId`
- Items missing `swimlaneId` (or with an unknown id) fall into the *first* lane with a one-time console warning

When `data.swimlanes` is omitted, each column has one implicit cell with `id = ${col.id}:_`.

This means the reducer's `move-item` action must always carry `toSwimlaneId` (computed from the drop target's parent context), even when there's only one lane.

---

## 4. File structure

```
src/registry/components/data/kanban-board-01/
├── kanban-board-01.tsx           ← root; "use client"; props → reducer → DnDContext + render
├── parts/
│   ├── board.tsx                 ← horizontal column list + drop-target for column reorder
│   ├── column.tsx                ← single column: header + body + footer
│   ├── column-header.tsx         ← title, count, color picker, collapse toggle, menu
│   ├── column-body.tsx           ← scrollable item list (uses ScrollArea primitive)
│   ├── column-collapsed.tsx      ← ~40px vertical strip rendering for collapsed columns
│   ├── column-footer.tsx         ← "+ Add" affordance row (rendered when onItemCreate supplied)
│   ├── add-column-button.tsx     ← right-edge "+ Add column" affordance
│   ├── swimlane-row.tsx          ← horizontal swimlane label band above the column row
│   ├── swimlane-cell.tsx         ← (col × lane) cell wrapping a SortableContext
│   ├── item-shell.tsx            ← drag wrapper: grip handle, lock badge, focus ring, click target
│   ├── item-renderer.tsx         ← looks up renderer in the map, calls render(data, ctx)
│   ├── missing-renderer.tsx      ← fallback card when rendererId is unknown
│   ├── inline-create-editor.tsx  ← inline form (uses renderer.editForm if provided, else minimal input)
│   ├── inline-edit-editor.tsx    ← inline form for updating an existing item
│   ├── color-picker.tsx          ← Popover with swatch grid (uses Radix Popover)
│   ├── drag-overlay.tsx          ← active-item ghost rendered in DragOverlay
│   ├── kanban-card.tsx           ← built-in `kanban-card` view + exports `kanbanCardRenderer`
│   └── kanban-note.tsx           ← built-in `kanban-note` view + exports `kanbanNoteRenderer`
├── hooks/
│   ├── use-kanban-state.ts       ← controlled/uncontrolled wrapper around useReducer
│   ├── use-renderer-map.ts       ← memoized rendererId → renderer lookup
│   ├── use-drag-handlers.ts      ← onDragStart / onDragOver / onDragEnd / onDragCancel
│   └── use-keyboard-actions.ts   ← keyboard shortcuts (delete, escape, enter on focused item)
├── lib/
│   ├── data.ts                   ← pure data ops (see §3.3)
│   ├── reducer.ts                ← pure reducer
│   ├── permissions.ts            ← canDrop + canCreate + canDelete predicates
│   ├── ids.ts                    ← stable id generation (`item-${nanoid}`, `col-${nanoid}`)
│   └── palette.ts                ← default 6-swatch palette + cssVar resolution
├── types.ts                      ← public API (everything in §2)
├── dummy-data.ts                 ← demo data: 3 columns, mixed renderers, 2 swimlanes
├── demo.tsx                      ← board with the dummy data + 2 built-in renderers
├── usage.tsx                     ← prose docs
├── meta.ts                       ← ComponentMeta
└── index.ts                      ← barrel — exports everything from types.ts + KanbanBoard + built-ins (re-exported from parts/)
```

**Counts:** 7 mandatory anatomy files (`kanban-board-01.tsx`, `types.ts`, `dummy-data.ts`, `demo.tsx`, `usage.tsx`, `meta.ts`, `index.ts`) + 18 parts + 4 hooks + 5 lib = **34 files total**.

This is larger than workspace (26 files). Justified by the renderer-registry pattern (which adds files for renderers, fallbacks, lookup) and the swimlane × column matrix (which adds `swimlane-row`, `swimlane-cell`).

**Deviation from convention:** like workspace, kanban adds a `lib/` directory beyond the `parts/` + `hooks/` listed in component-guide §5. Same justification: pure data/permission/id helpers are not React hooks and don't belong in `hooks/`. **`lib/` stays strictly pure — no React imports.** Built-in renderers, even though they're exported from the public API, live in `parts/` because their `render`/`editForm` fields return JSX. Flagged as Q-P10.

---

## 5. Interactions

### 5.1 Drag — item within a column

Pointer/keyboard sensor → `onDragStart` sets `activeItemId` → user drags → on `pointerup` over a target item or empty slot in the *same column*, dispatch `move-item` with new index. dnd-kit's sortable hook handles the visual reorder during drag.

### 5.2 Drag — item across columns / swimlanes

Same `onDragStart`. As the cursor moves over a different `<SortableContext>` (different column or different swimlane cell), `onDragOver` fires with the new context. `canDrop` is checked; if invalid, the target's `<SortableContext>` is rendered with a red ring and the cursor changes to `not-allowed` (via a CSS class on the document body during drag).

On `pointerup`, `onDragEnd` re-validates and dispatches `move-item` with `{ toColumnId, toIndex, toSwimlaneId }`. The board calls `onItemMove(item, from, to)` for consumers wanting a high-level event.

The `<DragOverlay>` ensures the cursor stays attached to a visually consistent item throughout the gesture, even as the item is internally re-parented in the data tree.

### 5.3 Drag — column reorder

Pointer-down on the column **header's drag region** (the title bar minus the menu button area; explicitly NOT on the body, NOT on the color swatch, NOT on the collapse button). `onDragStart` sets `activeColumnId`. Other columns shift to indicate the new position. On `pointerup`, dispatch `reorder-column`.

### 5.4 Keyboard DnD

Tab to focus an item (or column header). Press `Space` to lift; arrow keys move; `Space` drops; `Escape` cancels. Visual: the lifted item gets a "lifted" elevated style, valid drop zones get a focus ring as the item moves between them.

dnd-kit's `KeyboardSensor` provides this for free with the right configuration (use `sortableKeyboardCoordinates` from `@dnd-kit/sortable`). A live region (`role="status"`, `aria-live="polite"`) announces drag start, drop landing target, and drop result.

**Enter vs Space split:** the conventional pattern is that buttons activate on both Enter and Space, but dnd-kit consumes Space as the lift activator. Resolution:
- `Space` on a focused, idle item → lift (DnD mode)
- `Enter` on a focused item → fire `onItemClick(item)` (does NOT enter DnD)

This gives keyboard users explicit control over which action they want and avoids ambiguity. Documented in usage.

### 5.5 Click on an item

Click (not drag) fires `onItemClick(item)`. dnd-kit distinguishes click from drag via a 5px activation distance on the pointer sensor. Click is suppressed during keyboard-DnD lift mode.

**Locked items still receive clicks.** `item.locked` disables the drag sensor (per §10) but the click pathway remains active — consumers can still route a locked item's click to a detail view or a "request unlock" dialog.

### 5.6 Column color picker

Column header has a small swatch button (~16×16, current color or "no color" indicator). Click → `<Popover>` (Radix) opens. Body: 6-swatch grid + a "clear color" button. Click a swatch → dispatch `set-color`. Popover closes.

If the consumer supplied `palette`, those swatches replace the built-ins.

### 5.7 Collapse toggle

Column header has a small caret/chevron button. Click → dispatch `toggle-collapse`. CSS animates the column width from full-width to ~40px (or vice versa) over 200ms; items are removed from the layout (not from data).

**On drop into a collapsed column:** the `move-item` action itself auto-clears `column.collapsed` on the target column when the move lands there. **This is bundled into the action** (see [lib/data.ts moveItem](../../../src/registry/components/data/kanban-board-01/lib/data.ts)) rather than dispatched as a separate `toggle-collapse` because two separate dispatches in the same tick race in controlled mode (consumer's `setData(next1)` then `setData(next2)` — both `next` values are computed from the same captured render-state, so the second overwrites the first and the toggle is lost). The single-action form is atomic in both controlled and uncontrolled modes. Auto-expand-on-hover with delay was considered but cut from v0.1 — the drop-time auto-expand is sufficient for the locked contract; consumers who want hover-expand can wire it via `onDragOver`.

### 5.8 CRUD affordances

| Affordance | Renders when |
|---|---|
| Inline `+ Add` row at column footer | `onItemCreate` is supplied |
| Renderer picker (dropdown) on `+ Add` | `renderers.length >= 2` AND `onItemCreate` is supplied |
| Inline edit on click | `onItemUpdate` is supplied AND the renderer ships `editForm` |
| Item delete button (in item shell hover state) | `onItemDelete` is supplied |
| Column menu (kebab) | Any of `onColumnUpdate` / `onColumnDelete` is supplied |
| Right-edge `+ Add column` button | `onColumnCreate` is supplied |

When a renderer ships `newItem` + `editForm`, the inline editor uses them. When it doesn't, the affordance is "consumer handles the form" — clicking `+ Add` calls `onItemCreate` with a stub item (`{ id: nanoid(), rendererId, data: {} }`) and the consumer is expected to immediately update or delete it. Documented in usage.

### 5.9 Read-only mode

`readOnly: true` removes ALL DnD listeners (no `<DndContext>` event handlers wired) and ALL CRUD affordances (regardless of callbacks). Items remain interactive for clicks (`onItemClick` still fires). The board renders as a static snapshot.

---

## 6. Color palette

Default 6 swatches, each maps to an existing semantic CSS variable from `src/app/globals.css` (no new tokens introduced):

| `id` | Label | `cssVar` | Visual intent |
|---|---|---|---|
| `slate` | Slate | `--muted-foreground` | Default / undecided |
| `lime` | Lime | `--primary` | Positive / active |
| `amber` | Amber | `--chart-1` | Warning / in-progress |
| `emerald` | Emerald | `--chart-2` | Done / shipped |
| `sky` | Sky | `--chart-3` | Info / blocked-by-others |
| `rose` | Rose | `--destructive` | Risk / blocked / urgent |

**Applied as:** the swatch's `cssVar` is resolved at runtime via `var(...)` and injected through inline `style` (not className) — Tailwind v4 doesn't tokenize `var(--…)` Tailwind candidates well, so we use `style={{ borderLeftColor: var(swatch.cssVar) }}` and `style={{ backgroundColor: ... }}` for the 8%-opacity header tint.

**Light + dark contrast verification** is part of the success-criteria checklist.

When the consumer supplies `palette`, the built-in is replaced wholesale (no merge). The consumer's swatches must declare a `cssVar` that resolves to a valid CSS color in the consuming app's stylesheet.

---

## 7. Composition pattern

Per component-guide §9, the canonical patterns are: render-props, generics, `children`, slot-props, headless+presentation.

**Kanban's pattern: registry + render fn** (same as workspace). Consumers register `KanbanCardRenderer`s; each declares a `render(data, ctx)` returning `ReactNode`. This is closer to "headless host + consumer-supplied content" than to render-props because the board is the host.

**Sub-components are private.** `<KanbanBoard>` is the only public component. We don't expose a compound API (`<Kanban.Board>`, `<Kanban.Column>`, `<Kanban.Card>`). This matches workspace's choice (Stage 2 Q-P) and keeps the surface minimal. Advanced consumers can drop in custom renderers; that's enough flexibility for v0.1.

**State:** controlled and uncontrolled both supported (Q11 locked); internal `useReducer`; consumers can lift state via `data` + `onChange`.

**Generics:** `KanbanCardRenderer<TData = unknown>` is generic over the data shape. The built-in `kanbanCardRenderer` is `KanbanCardRenderer<KanbanCardData>`; consumers write `KanbanCardRenderer<MyDealCardData>` for type-safe `render(data, ctx)`.

---

## 8. Client/server boundary

`kanban-board-01.tsx`: **`"use client"`**. Required for: pointer events, keyboard handlers, `useReducer`, `useRef`, `<DndContext>`.

Everything else stays server-safe:
- `types.ts`, `dummy-data.ts`, `lib/*.ts`, `meta.ts`, `index.ts` — pure modules, no React runtime.
- `demo.tsx` — server component that renders `<KanbanBoard>` with dummy data. The board's "use client" boundary handles hydration.
- `usage.tsx` — server component, prose only.
- `parts/*.tsx` and `hooks/*.ts` — inherit "use client" from `kanban-board-01.tsx`'s import boundary.

---

## 9. Dependencies

### shadcn primitives — all already installed (verified against `src/components/ui/`)

| Primitive | Used for |
|---|---|
| `popover` | Color picker, column menu |
| `dropdown-menu` | Renderer picker on "+ Add", column kebab menu |
| `scroll-area` | Per-column scrollable body |
| `button` | Affordance buttons |
| `input` / `textarea` | Inline edit forms |
| `tooltip` | Color swatch labels, lock indicator hover |
| `avatar` | Assignee avatars in built-in `kanban-card` |
| `badge` | Tag chips in built-in `kanban-card` |

No `pnpm dlx shadcn@latest add` step needed before scaffolding.

`meta.ts` `dependencies.shadcn`: `["avatar", "badge", "button", "dropdown-menu", "input", "popover", "scroll-area", "textarea", "tooltip"]`.

### npm peer deps

| Package | Used for | Status |
|---|---|---|
| `@dnd-kit/core` | DndContext, sensors, collision detection | **Already a project dep** (^6.3.1) |
| `@dnd-kit/sortable` | SortableContext, useSortable, sortableKeyboardCoordinates | **Already a project dep** (^10.0.0) |
| `@dnd-kit/utilities` | CSS.Transform helper | **Already a project dep** (^3.2.2) |
| `lucide-react` | Icons in column menu, drag handle, color swatch button | Already a project dep (^1.11.0) |

`meta.ts` `dependencies.npm`: `{ "@dnd-kit/core": "^6.3.1", "@dnd-kit/sortable": "^10.0.0", "@dnd-kit/utilities": "^3.2.2", "lucide-react": "^1.11.0" }`.

### internal

None. Kanban does not compose other registry components. (Consumers wrap registry components in custom renderers — that's an *external* dependency from the component's perspective.)

`meta.ts` `dependencies.internal`: `[]`.

### Banned / not-imported

`next/*`, `process.env`, app-context — per the portability contract. Kanban is a candidate for early NPM extraction.

---

## 10. Edge cases

| Case | Behavior |
|---|---|
| Item's `rendererId` doesn't resolve in `renderers[]` | Render `<MissingRendererFallback />` (red-outlined card with the id) + `console.warn` once per session per missing id. The item remains draggable. |
| Empty `renderers[]` | `console.error` at mount: "renderers is required, must contain at least one entry". Render an error placeholder. |
| Duplicate item ids | Validation error logged once at mount via `validateData`; React's reconciler will warn separately. Render proceeds with first-occurrence-wins. Documented as a developer mistake. |
| Column with no items | Renders empty drop zone with a "drop here" placeholder (visible only when an item is being dragged elsewhere). |
| Column collapsed and an item is dragged over | After 600ms hover delay, column auto-expands. Drop is then accepted (subject to `canDrop`). |
| Move from a `allowOutgoing: false` column | Drag start still works (gives feedback that the item was picked up); `canDrop` returns false on any column other than the source; drop is silently rejected back to source. |
| Drop on a `acceptsRendererIds`-restricted column with mismatched renderer | Visual rejection during drag-over; drop is no-op'd. |
| Item with `locked: true` | `useSortable` is configured with `disabled: true`. Drag never starts. Visual indicator (lock icon) renders. |
| Swimlane id on item doesn't resolve | Item rendered in the *first* swimlane; one-time console warning. |
| Single swimlane (or no swimlanes prop) | All items render in a single implicit cell per column. No swimlane labels. |
| `maxItems` exceeded | Warning chip in column header (`"15 / 10"`); no block on drops. |
| `readOnly: true` flips mid-session | If a drag is in flight, dnd-kit's `cancelDrop` returns `true`, canceling the gesture (item snaps back). Then DnD listeners detach and CRUD buttons unmount. Item-click events remain active. |
| Controlled mode: `data` updated mid-drag | dnd-kit handles this gracefully — the drag overlay continues with stale data, drop dispatches against the new state and `canDrop` re-validates. |
| Long item (renderer outputs tall content) | Column body is a `<ScrollArea>`; the column itself stays at consistent column width. |
| Very long column (50+ items) | Renders all items; no virtualization in v0.1 (Q-P12 deferred). Performance budget verified at 50 items. |

---

## 11. Accessibility

- **Board root:** `role="region"` with `aria-label` from props (default `"Kanban board"`). Single landmark per board instance.
- **Column:** `role="group"` with `aria-label="{title}"`. The header's drag region is a `<button type="button">` with `aria-roledescription="Column, draggable"`. (`aria-grabbed` is intentionally **not used** — it's deprecated in WAI-ARIA 1.2; dnd-kit's announcer + roledescription cover the same intent without the deprecation.)
- **Column body:** uses shadcn `<ScrollArea>` for scroll semantics.
- **Item shell:** focusable `<div>` with `role="article"` (clickable + draggable). `aria-roledescription={`${renderer.label}, draggable`}` (e.g. "Card, draggable" for `kanban-card`, "Note, draggable" for `kanban-note`, "Project Card, draggable" for a consumer-registered renderer). Locked state is communicated via `aria-roledescription={`${renderer.label}, locked`}` AND a visible lock icon — **NOT** via `aria-disabled` (locked items still receive clicks per §5.5). dnd-kit's `attributes` are spread on this same element so keyboard-DnD a11y wiring connects to a screen-reader-visible node; `aria-roledescription` is overridden after the spread to swap the default `"sortable"` for the per-renderer label. **Note (deviation from initial draft):** an earlier draft used `role="button"`, but the shell hosts nested `<Button>` elements for Edit/Delete and nested-button HTML is invalid + AT-confusing. `role="article"` keeps the semantic of "self-contained content surface" while permitting inner interactive controls.
- **Live region:** a hidden `<div role="status" aria-live="polite">` at board root. dnd-kit's `accessibility.announcements` config feeds:
  - On drag start: "Picked up item {id} from column {colTitle}, position {n} of {N}"
  - On drag over: "Item {id} is over column {colTitle}, position {n} of {N}" (debounced)
  - On drag end: "Item {id} dropped in column {colTitle}, position {n} of {N}"
  - On drag cancel: "Drag canceled. Item {id} returned to column {colTitle}, position {n} of {N}"
- **Focus visible:** every interactive element gets `focus-visible:ring-2 focus-visible:ring-ring`.
- **No `outline-none`** without paired `focus-visible` styles.
- **AA contrast:** semantic tokens only; swatch palette verified light + dark.
- **RTL:** column flow uses CSS logical properties (`margin-inline-end`, `padding-inline-*`). Wrapping in `dir="rtl"` reverses column order automatically. Drag math (left-to-right) flips correctly because dnd-kit reads pointer coords against actual element rects, not assumed direction.

---

## 12. Performance

| Concern | Strategy |
|---|---|
| Re-renders during drag | Drag state in `useRef` for mid-flight; dispatch only on drop. Active item is tracked in `useState` for the overlay only. |
| Validation cost per drag-over | `canDrop` is O(1) given the column lookups; cache `findColumn` results per drag session in `useRef`. |
| Data tree walks | `findItem` / `findColumn` are O(columns + items) but only called on drop, not per move-tick. |
| Renderer map rebuild | `useMemo` keyed on `renderers` array reference. Consumers should pass a stable `renderers` array. |
| React 19 compiler | Auto-memo of column subtrees should kick in; verify in profiling. |
| Many items rendered | No virtualization in v0.1. Budget: 50 items / 5 columns at 60fps. If exceeded, fall back to `@tanstack/react-virtual` (already a project dep) — flagged as v0.2. |
| DragOverlay re-renders | Active item only re-renders once per `activeItemId` change; cursor follows via dnd-kit's CSS transform without React re-render. |

**Budget:** 50-card / 5-column board scrolls and drags at 60fps on a mid-tier laptop (per success criterion #7).

**No test runner** is wired in this repo (description risk §8). Plan-stage stance: ship v0.1 with extensive demo-driven verification + explicit STATUS.md test-debt entry. Pure modules in `lib/` will be test-ready when Vitest lands. Flagged as Q-P8.

---

## 13. Risks & alternatives

### Risks (carried from description, with plan-stage mitigations)

| Risk | Mitigation in this plan |
|---|---|
| Scope creep | Multi-select, hard WIP, virtualization, undo, search, modal — all explicitly **deferred**. Plan-stage Qs surface the remaining scope decisions. |
| DnD edge cases | Explicit `canDrop` predicate (§3.5) covers all permission combinations. Edge case table (§10) enumerates the failure modes and their handling. |
| State preservation on cross-column move | Stable id keys at every level (§3.1); `<DragOverlay>` for visual continuity; reducer mutates immutably so React reconciles by id. |
| Color picker ergonomics | Default palette uses existing CSS vars from `globals.css` (no new tokens); override is a single prop replacement, not a merge. |
| Inline CRUD vs consumer's design system | Renderer-level `editForm` / `newItem` (Q5 locked) — granular opt-in, no half-shipped modes. |
| Test coverage | Pure `lib/` modules ARE testable when Vitest lands. v0.1 ships with demo verification + test-debt note. |

### Alternatives considered, rejected

- **Use an existing kanban lib (`react-trello`, `@asseinfo/react-kanban`).** None ship the renderer-registry pattern; both lock you into their card schema. Wrapping one would inherit its API and bundle weight. Build wins for control + portability.
- **`react-beautiful-dnd`.** Maintenance status is uncertain; dnd-kit is the modern standard with first-class accessibility and touch.
- **Recursive `<Sortable>` only at item level + flexbox for columns.** Loses the cross-column reorder context — `<SortableContext>` for columns at board level is what makes `onDragEnd` fire with consistent data on column reorder.
- **External state lib (zustand) for the board's reducer.** Workspace rejected this; same reasoning here. `useReducer` over an immutable tree is sufficient. Zustand is in the project for other uses (e.g., force-graph) but adding it as a dependency for kanban doesn't pay off.
- **Compound component API (`<Kanban.Column>`, `<Kanban.Card>`).** Tempting for "advanced" usage but actively harmful to the renderer-registry contract (consumers would conflate "where the card renders" with "what renders inside"). Single `<KanbanBoard>` + renderers wins.
- **Auto-discovery of registry components as renderers.** Out of scope per Q3 (description). Explicit registration keeps the data layer pure-JSON.

---

## 14. Plan-stage open questions

The description sealed the *what*. These twelve are *how* questions the plan needs your call on before scaffolding.

| # | Question | Recommendation | Why |
|---|---|---|---|
| Q-P1 | **Renderer lookup pattern** — `Map` (memoized) vs `find()` per item? | **Memoized `Map`** in `useMemo`. | O(1) lookup per item-render; trivial code; `useMemo` keyed on `renderers` reference is enough. |
| Q-P2 | **State lib** — `useReducer` vs `zustand`? Project has zustand as a dep. | **`useReducer`** (pure, in `lib/reducer.ts`). | Matches workspace precedent. Pure reducer is testable independent of React. zustand ownership of state would conflict with controlled-mode contract. |
| Q-P3 | **Column drag region** — entire header or a dedicated grip area? | **The whole header EXCEPT the menu/swatch/collapse buttons.** | Maximizes drag target (Trello/Linear convention) without stealing clicks from buttons. Buttons use `stopPropagation` on pointer-down. |
| Q-P4 | **Collapsed-column hover-expand on drag** — auto-expand or manual click? | **Drop-time auto-expand (shipped); hover-expand deferred to v0.2.** | Plan-stage answer was "Auto-expand after 600ms hover." During implementation, the simpler "drop-on-collapsed → expand AND accept drop" was found sufficient for the locked contract — collapsed columns ARE droppable (their own `useDroppable`) and `moveItem` clears `collapsed` on the target. Hover-expand requires per-column timer state during drag and was cut from v0.1 to keep the gesture surface lean. Wire-in for v0.2 is straightforward: track hovered column id in `useDragHandlers`, set a 600ms timer in `onDragOver`, dispatch toggle-collapse on timer fire. |
| Q-P5 | **Swimlane reorder** — draggable in v0.1? | **No.** Swimlanes are static via the `swimlanes` prop in v0.1. | Adds another sortable axis to an already-complex DnD surface. Real consumer demand can revisit in v0.2. |
| Q-P6 | **Color picker primitive** — Radix `<Popover>` or custom dropdown? | **Radix `<Popover>`** (via shadcn `popover`). | Already a project primitive (confirmed installed; see §9). Accessibility and outside-click handled. No reason to roll our own. |
| Q-P7 | **`+ Add` button when `renderers.length === 1`** — picker still opens? | **No picker; direct create.** Picker only appears when `renderers.length >= 2`. | Avoids a useless one-option picker. Single-renderer boards are the most common case. |
| Q-P8 | **Test-runner stance.** Same as workspace (no runner wired). | **Ship with test-debt note.** Pure `lib/` modules are test-ready when Vitest lands. | Blocking on test-runner adoption is a separate STATUS-level conversation. Test debt is honest and recoverable. |
| Q-P9 | **`useKanbanItem()` hook for renderers?** Consumer renderers may want drag state for fancier "while dragging" effects. | **No hook in v0.1.** The `KanbanRenderContext` arg to `render(data, ctx)` provides `isDragging` + `isLocked`. | One way to read drag state. Simpler. Hook can be added later non-breakingly. |
| Q-P10 | **Add `lib/` directory** for pure non-React helpers (data, reducer, permissions, ids, palette)? | **Yes — add `lib/`.** Same justification as workspace Q-P2. **`lib/` stays strictly pure** — built-in renderers contain JSX and live in `parts/`, NOT `lib/`, despite being part of the public API. | Pure functions don't belong in `hooks/`. The deviation from §5 anatomy is justified and consistent with workspace. The renderer-export-from-`parts/` rule keeps the `lib/` purity invariant simple and enforceable. |
| Q-P11 | **DragOverlay rendering** — same renderer (with `isDragging: true` ctx) or a special "ghost" view? | **Same renderer with `isDragging: true`** + an item-shell wrapper that adds elevation (`shadow-2xl`) + slight rotation (`rotate-2`). | Reuses the renderer (zero divergence). Trello-style "lifted" feel via the shell. |
| Q-P12 | **Virtualization** — use `@tanstack/react-virtual` for long columns in v0.1? | **No.** Defer to v0.2 if real consumers report perf issues. | Adds reflow/measurement complexity that interacts badly with `<SortableContext>`'s assumed-rendered children. Premature without a real workload. Project dep is already there for v0.2. |

---

## 15. Definition of "done" for THIS document (stage gate)

Before any code or scaffolding:

- [ ] User reads §1–§13 (the locked plan) and §14 (plan-stage Qs).
- [ ] Each Q-P1 through Q-P12 has either an "agreed" or override answer.
- [ ] User explicitly says **"plan approved"** (or equivalent) — this unlocks Stage 3 (implementation).

After sign-off, the next session starts with:

1. **Open a STATUS.md note** recording the test-debt for `kanban-board-01` (matches workspace's pattern).
2. `pnpm new:component data/kanban-board-01`
3. **Implement against this plan, file by file in the order listed in §4.** Suggested order:
   1. `types.ts` (locks the API surface)
   2. `lib/ids.ts`, `lib/data.ts`, `lib/permissions.ts`, `lib/palette.ts` (pure foundations)
   3. `lib/reducer.ts` (composes lib/data.ts)
   4. `parts/kanban-card.tsx`, `parts/kanban-note.tsx` (each exports its built-in renderer alongside the view)
   5. `parts/item-shell.tsx`, `parts/item-renderer.tsx`, `parts/missing-renderer.tsx`
   6. `parts/swimlane-cell.tsx`, `parts/column-body.tsx`, `parts/column-collapsed.tsx`
   7. `parts/column-header.tsx`, `parts/color-picker.tsx`
   8. `parts/inline-create-editor.tsx`, `parts/inline-edit-editor.tsx`
   9. `parts/column.tsx`, `parts/column-footer.tsx`, `parts/swimlane-row.tsx`, `parts/add-column-button.tsx`
   10. `parts/board.tsx`, `parts/drag-overlay.tsx`
   11. `hooks/*` then `kanban-board-01.tsx`
   12. `dummy-data.ts`, `demo.tsx`, `usage.tsx`, `meta.ts`, `index.ts`
4. **Author `kanban-board-01-procomp-guide.md` (Stage 3)** alongside the implementation.
5. Run the §13 verification checklist from the component-guide; confirm the success criteria from description §6.
6. **Add to `registry.json`** — base item + `-fixtures` sibling per the locked target convention.
7. `pnpm registry:build`, spot-check `public/r/kanban-board-01.json`.
8. Update `STATUS.md` with the new entry.

If at any point during implementation a plan decision turns out wrong, **stop, document the issue, ask before deviating**. The plan is the contract; deviations are loud, not silent.
