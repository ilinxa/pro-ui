# `kanban-board-01` — Pro-component Description (Stage 1)

> **Stage:** 1 of 3 · **Status:** Signed off · v0.4.0 (alpha)
> **Slug:** `kanban-board-01` · **Category:** `data`
> **Conceptual lineage:** Trello / Linear / GitHub Projects board view, JIRA swimlane boards. **Not a clone of any of them.** A reusable React surface for column-based, drag-and-drop work-in-progress visualization.

This is the **description** doc. Its job is to pin down what we're building and why, surface open decisions, and earn sign-off before any planning or code. The full concept brief authored by the user is preserved verbatim in the appendix.

---

## v0.2 update (2026-05-06)

Three additive changes since v0.1 sign-off — all **non-breaking**:

1. **`dragHandle: "shell" | "header"` on `KanbanCardRenderer`** — opt-in per renderer. `"shell"` (default) keeps v0.1 behavior (whole-card grab). `"header"` renders a thin grip strip above the item; only that strip activates dnd-kit drag, so the body stays fully interactive. Required for renderers that own internal pointer interactions — click-to-edit fields, embedded inputs, internal DnD. The rich-card adapter (see #2) is the canonical use case.
2. **Rich-card adapter pattern (demonstrated)** — the demo now registers a third renderer that wraps `<RichCard>` (the structural-content tree editor in this registry) with full feature passthrough — `editable`, `onChange`, `defaultCollapsed`, predefined keys, internal DnD, all preserved. Items with `rendererId: "rich-card"` carry a `RichCardJsonNode` as their data; the renderer mounts the real `<RichCard>` so all of its features work inside a kanban column. This is the renderer-registry's marquee feature delivered: heterogeneous columns with first-class rich content.
3. **Column body uses native `overflow-y-auto`** — replaces the radix `<ScrollArea>` that wasn't reliably constraining inside the `flex-1` chain. Tall items (rich-card with expanded children) now scroll natively within the column. `min-h-0` propagates from `Column` → body so the flex chain shrinks correctly. `scroll-area` is no longer a registryDependency.

Demo and docs updated to reflect all three. The kanban-card / kanban-note renderers default to `"shell"` mode (no consumer migration required).

---

## 1. Problem

Kanban-style boards — columns of cards moved between buckets to track work — are one of the most common UI patterns in product, ops, and project tools. Every team that wants one today either:

- Embeds a SaaS board (Trello, Linear) inside an iframe and gives up on integrating it with their own data, or
- Pulls in a heavyweight DnD library (`react-beautiful-dnd`, `dnd-kit`) and **builds the column / card / drop-zone / collapse / swimlane chrome from scratch** — typically 1–3 weeks of work, accessibility usually skipped, never quite right.

There is no high-quality, pluggable React component that ships the **column-and-card chrome** — the bit that wraps a DnD primitive into something a product team can drop into a route and have it look professional out of the box. This pro-component fills that gap.

The registry already has a strong rich-card system (`post-card-01`, `project-card-01`, `event-card-01`, etc.). Kanban must host **any of them as first-class column items** — not by wrapping them, but by treating each column as an **ordered list of heterogeneous objects** where every item references a *card renderer* by id. The board ships a built-in lightweight `kanban-card` renderer (title / description / tags / assignees / meta) and a built-in `kanban-note` renderer (title + short body) for teams that don't have a card system yet; consumers register additional renderers — including any rich card from elsewhere in the registry — and items become pure-JSON records: `{ id, rendererId, data, swimlaneId?, locked? }`. Built-in and consumer renderers are siblings — equal citizens in a column's item list. That's the contract this component owns: the column system, the renderer registry, the drag-and-drop choreography, and the optional CRUD affordances.

---

## 2. In scope / Out of scope

### In scope (v0.1.0 → v1.0.0 trajectory)

- A **single root board** that renders a horizontal row of columns, with optional swimlanes (horizontal rows) crossing all columns.
- A **card-renderer registry** — every column item is a pure-JSON record `{ id, rendererId, data, swimlaneId?, locked? }`. The board itself does not know how to render anything; it delegates to a renderer looked up by `rendererId`. Two renderers ship built-in: **`kanban-card`** (title / description / tags / assignees / meta — the lightweight default) and **`kanban-note`** (title + short body — the simple between-cards annotation user described). Consumers register additional renderers, e.g. a rich card from elsewhere in the registry: `{ id: "project-card", label: "Project Card", render: (data) => <ProjectCard {...data} /> }`. Built-in and consumer renderers are siblings — a single column's `items[]` can freely mix `kanban-card`, `kanban-note`, `project-card`, `post-card`, etc.
- A **column** with: title, optional description, color (border + header tint), item list, optional inline-create row, optional menu (edit/delete column), collapse toggle.
- A **uniform draggable shell** wraps every rendered item — grip handle, drag preview, lock indicator, focus ring, drop-target highlighting. Renderers don't know about DnD; they just render content.
- **Drag and drop** via `dnd-kit`: reorder cards within a column, move cards across columns, reorder columns. Touch / pen support included via dnd-kit's pointer sensor. Keyboard alternatives included (dnd-kit's keyboard sensor — `space` to lift, arrow keys to move, `space` to drop).
- **Per-column movement controls** — flag schema:
  - `allowReorder: boolean` — can items reorder within this column? (default `true`)
  - `allowIncoming: boolean` — can items be dropped INTO this column from elsewhere? (default `true`)
  - `allowOutgoing: boolean` — can items LEAVE this column? (default `true`)
  - `acceptsRendererIds?: string[]` — which renderers this column will host (default: all registered renderers). E.g. a "Notes" column with `acceptsRendererIds: ["kanban-note"]` rejects all card kinds.
- **Per-item lock** — `item.locked: true` pins the item; it cannot be moved at all (overrides column-level flags).
- **Color picker on column header** — a small swatch button next to the column menu opens a 6-swatch palette (semantic-token-based, design-system-safe). Affects the column's left border accent and header tint. The palette is overridable via the `palette` prop; consumers can ship their own swatches.
- **Optional CRUD affordances** — purely opt-in via callbacks. When `onItemCreate` is supplied, an inline "+ Add" row renders at the bottom of the column (with a renderer picker if ≥2 renderers are registered). When `onColumnCreate` is supplied, a "+ Add column" affordance renders at the right edge of the board. Same pattern for `onItemUpdate` / `onItemDelete` / `onColumnUpdate` / `onColumnDelete`. **No callback → no affordance.** Inline-editor UI itself is per-renderer: a renderer that ships `newItem` + `editForm` gets inline editing; one that omits them falls back to "save shell only, consumer handles the form" via the callback.
- **Collapsible columns** — `column.collapsed: true` renders the column as a ~40px vertical strip showing only the column title (rotated 90° or written vertically) + the item count. Items inside still occupy logical state but render hidden. Toggleable via column header. Items dropped onto a collapsed column expand it.
- **Swimlanes** — when `swimlanes` is provided, each column is split horizontally into one section per swimlane. Each `(column × swimlane)` cell is its own droppable. Items carry a `swimlaneId`. When `swimlanes` is omitted, the board renders without horizontal grouping (single implicit lane).
- **Controlled and uncontrolled state** — `data` (controlled) / `defaultData` (uncontrolled) / `onChange`. Same shape as workspace pro-component.
- **Keyboard accessibility** — keyboard DnD via dnd-kit's keyboard sensor; tab order through columns and cards; visible focus rings on all interactive elements.
- **Portability** — zero `next/*` imports, no app-context coupling, no `process.env`. Standard pro-component portability rules.

### Out of scope (deliberate non-goals)

- **WIP limits with enforcement** — `column.maxItems` is exposed as a SOFT cap (renders a warning chip when over) but does **not** block drops. There is no hard-enforcement mode; gate over-capacity drops in your own `onItemMove` handler if needed.
- **Filters / search inside the board** — consumers wrap the board with their own filter UI and pass already-filtered data.
- **Card detail modal / drawer** — out of scope. The item click event is exposed via `onItemClick`; consumers route to a detail view of their choice.
- **Persistence to a backend** — board data is serializable; saving is the consumer's job (mirrors workspace).
- **Undo/redo** — consumers can wire it via `onChange` snapshots; we don't ship a history stack.
- **Multi-select drag** — single-card drag in v0.1.0. Multi-select is v0.2.
- **Cross-board drag** — single-board only in v0.1.0.
- **Live collaborative editing** of the board (presence cursors, conflict resolution, etc.).
- **Built-in card detail / activity feed** — the `note` item handles a *contextual* between-cards comment use case, but kanban does NOT ship a full Trello-style "comments on a card" thread. Use `comment-thread-01` inside a custom card-detail surface for that.
- **Rich-card auto-discovery** — kanban does not auto-detect or specially-render any registry component. Every renderer is explicitly registered by the consumer via the `renderers` prop. (Built-in `kanban-card` and `kanban-note` are exported helpers; everything else is consumer-supplied.)

---

## 3. Target consumers

Three concrete archetypes drive the design, in priority order:

| Archetype | Example | What they need |
|---|---|---|
| **Project / task tracking app** *(primary)* | Internal task board, lightweight project tracker, side-project to-do | Columns by status (Todo / Doing / Done), cards with title + tags + assignees, move on drop, optional inline create |
| **CRM-style pipeline view** *(primary)* | Sales pipeline, hiring pipeline, customer support stage tracker | Columns by stage, cards represent deals/candidates, color-coded columns by stage criticality, swimlanes by team/owner |
| **Editorial / content workflow** *(secondary)* | Newsroom story tracker, marketing campaign board | Columns by phase (Draft / Review / Scheduled / Live), cards rendered by a custom registered renderer (preview thumb + headline), notes between cards as editorial annotations |

Non-targets: dense data tables (use `data-table`), pure timelines (use `progress-timeline-01` or similar), Gantt charts.

---

## 4. Rough API sketch (NOT final — that's the plan stage)

This is illustrative. The plan doc will lock the final shape after we agree on the description.

```ts
// ─────────────────────────────────────────────────────────────────────
// Renderers — every column item is rendered by one of these.
// ─────────────────────────────────────────────────────────────────────

type KanbanRenderContext = {
  itemId: string;
  columnId: string;
  isDragging: boolean;
  isLocked: boolean;
};

type KanbanCardRenderer<TData = unknown> = {
  id: string;                       // referenced by item.rendererId
  label: string;                    // shown in "+ Add" menu
  render: (data: TData, ctx: KanbanRenderContext) => ReactNode;

  // Optional inline create + edit (omit to use callback-only flow):
  newItem?: () => TData;
  editForm?: (
    data: TData,
    onSave: (next: TData) => void,
    onCancel: () => void
  ) => ReactNode;

  // v0.2 — where the kanban-level drag listeners attach.
  // "shell" (default): the whole card is the drag activator.
  // "header": a thin grip strip on top activates drag; body stays fully interactive.
  //  Use for renderers that own internal pointer interactions (e.g. rich-card).
  dragHandle?: "shell" | "header";
};

// ─────────────────────────────────────────────────────────────────────
// Items — pure JSON, serializable end to end. No JSX in here.
// ─────────────────────────────────────────────────────────────────────

type KanbanItem = {
  id: string;
  rendererId: string;               // which renderer renders this
  data: unknown;                    // renderer-specific payload (free-form)
  swimlaneId?: string;
  locked?: boolean;
};

type KanbanColumn = {
  id: string;
  title: string;
  description?: string;
  color?: string;                   // swatch id from palette
  collapsed?: boolean;
  items: KanbanItem[];

  // Movement controls
  allowReorder?: boolean;
  allowIncoming?: boolean;
  allowOutgoing?: boolean;
  acceptsRendererIds?: string[];    // default = all registered renderers

  maxItems?: number;                // soft cap; renders warning, does not block
};

type KanbanSwimlane = { id: string; title: string; description?: string; color?: string };

type KanbanData = {
  columns: KanbanColumn[];
  swimlanes?: KanbanSwimlane[];     // omit = single implicit lane
};

// ─────────────────────────────────────────────────────────────────────
// The board component
// ─────────────────────────────────────────────────────────────────────

type KanbanBoardProps = {
  renderers: KanbanCardRenderer[];  // REQUIRED — at minimum [kanbanCardRenderer]

  // State
  data?: KanbanData;                // controlled
  defaultData?: KanbanData;         // uncontrolled
  onChange?: (next: KanbanData) => void;

  // CRUD — affordances render only when supplied
  onItemCreate?: (args: { columnId: string; item: KanbanItem }) => void;
  onItemUpdate?: (item: KanbanItem) => void;
  onItemDelete?: (itemId: string) => void;
  onColumnCreate?: (column: KanbanColumn) => void;
  onColumnUpdate?: (column: KanbanColumn) => void;
  onColumnDelete?: (columnId: string) => void;

  onItemClick?: (item: KanbanItem) => void;

  palette?: { id: string; label: string; cssVar: string }[];
  readOnly?: boolean;
  className?: string;
};

// ─────────────────────────────────────────────────────────────────────
// Built-in renderers (named exports from the kanban-board-01 package)
// ─────────────────────────────────────────────────────────────────────

// import { kanbanCardRenderer, kanbanNoteRenderer } from "@/components/kanban-board-01";

type KanbanCardData = {
  title: string;
  description?: string;
  tags?: { label: string; color?: string }[];
  assignees?: { id: string; name: string; avatarUrl?: string }[];
  meta?: { key: string; label: string; value: ReactNode }[];
};

type KanbanNoteData = {
  title: string;
  body?: string;
  color?: string;
};
```

Six public types, one required prop (`renderers`), ~ten optional props. If this expands during planning, the API is wrong and we restart this section.

---

## 5. Example usages

### 5.1 Task tracker — built-in renderers only, inline CRUD (primary)

```tsx
import { KanbanBoard, kanbanCardRenderer, kanbanNoteRenderer } from "@/components/kanban-board-01";

<KanbanBoard
  renderers={[kanbanCardRenderer, kanbanNoteRenderer]}
  defaultData={{
    columns: [
      {
        id: "todo",
        title: "To do",
        color: "slate",
        items: [
          { id: "c1", rendererId: "kanban-card",
            data: { title: "Wire auth flow", tags: [{ label: "frontend" }] } },
          { id: "n1", rendererId: "kanban-note",
            data: { title: "Reminder", body: "Coordinate with backend on session shape." } },
          { id: "c2", rendererId: "kanban-card",
            data: { title: "Settings page polish" } },
        ],
      },
      { id: "doing", title: "In progress", color: "lime", items: [] },
      { id: "done",  title: "Done",        color: "emerald", items: [], allowReorder: false },
    ],
  }}
  onItemCreate={insertItem}
  onItemUpdate={updateItem}
  onItemDelete={deleteItem}
  onColumnCreate={addColumn}
  onChange={persist}
/>
```

A three-column board with both built-in renderers active. The "+ Add" menu under each column lets the user pick "Card" or "Note." "Done" accepts cards from elsewhere but doesn't reorder internally.

### 5.2 Project board — mixing built-in + rich card from the registry (primary)

```tsx
import { ProjectCard } from "@/components/project-card-01";
import { KanbanBoard, kanbanCardRenderer } from "@/components/kanban-board-01";

const projectRenderer = {
  id: "project-card",
  label: "Project",
  render: (data) => <ProjectCard {...data} />,
};

<KanbanBoard
  renderers={[kanbanCardRenderer, projectRenderer]}
  defaultData={{
    columns: [
      {
        id: "backlog",
        title: "Backlog",
        items: [
          // Mix freely in the same column:
          { id: "p1", rendererId: "project-card",
            data: { name: "Onboarding redesign", owner: "Ada", dueDate: "2026-06-01", coverUrl: "/c1.jpg" } },
          { id: "t1", rendererId: "kanban-card",
            data: { title: "Spike: dnd-kit virtualization" } },
          { id: "p2", rendererId: "project-card",
            data: { name: "Mobile push pipeline", owner: "Bo", dueDate: "2026-07-15", coverUrl: "/c2.jpg" } },
        ],
      },
      { id: "active", title: "Active", items: [] },
    ],
  }}
/>
```

Two renderers registered. The same column hosts both — `ProjectCard` (full registry component) and the lightweight `kanban-card`. The board treats them identically for drag, drop, lock, and lookup; only their rendered output differs.

### 5.3 Sales pipeline with swimlanes (secondary)

```tsx
<KanbanBoard
  renderers={[kanbanCardRenderer]}
  data={pipelineData}
  onChange={setPipelineData}
  // pipelineData shape:
  // columns:   [{ id: "lead", ... }, { id: "qualified", ... }, { id: "won", ... }]
  // swimlanes: [{ id: "team-a", title: "Team A" }, { id: "team-b", title: "Team B" }]
  // items each carry swimlaneId so they slot into the right (col × lane) cell.
/>
```

Cards group horizontally by stage (column) and vertically by team (swimlane). All cards use the built-in `kanban-card` renderer; the deal amount and close date live in the `meta` field.

---

## 6. Success criteria

The component ships v0.1.0 (alpha) when:

1. **Consumer onboarding**: a developer can render a 3-column board with sample data and working DnD in under 15 minutes from copy-paste.
2. **All gestures from the cheat sheet work** at first try:
   - Drag an item up/down within a column → reorder
   - Drag an item to another column → cross-column move
   - Drag a column header → reorder columns
   - Click "+ Add" under a column → renderer picker (when ≥2 renderers registered + `onItemCreate` supplied) → inline editor appears
   - Click column color swatch → palette popover, click swatch → header re-tints
   - Click column collapse → column narrows to vertical strip
3. **Movement controls honored** — `allowReorder: false`, `allowIncoming: false`, `allowOutgoing: false`, `acceptsRendererIds`, and per-item `locked` all visibly prevent the disallowed drop (with a clear hover indicator that the drop is rejected).
4. **State round-trip** — `onChange` produces JSON that, fed back as `data`, reproduces the exact board state. **Items round-trip as pure data** — no JSX or function references in the serialized form.
5. **State preservation contract** — moving an item between columns does NOT remount the rendered body; only its column membership changes. Consumers relying on body internal state (focused inputs, expanded sections) see it preserved across moves. Documented as the contract.
6. **No hardcoded colors** — semantic Tailwind tokens only; column color palette is built from design tokens. Light/dark themes both look right.
7. **Performance**: a 50-card / 5-column board scrolls and drags at 60fps on a mid-tier laptop.
8. **Accessibility**: keyboard alternatives for all DnD operations exist (dnd-kit keyboard sensor); tab order is logical; visible focus rings; screen-reader live region announces drag start / drop landing target / drop result.
9. **Portability**: zero `next/*` imports, no `process.env`, no app-context coupling.
10. **Demo and usage docs** complete; one demo per archetype above.
11. **Compiles and renders** at `/components/kanban-board-01` with no console warnings.
12. **Touch / pen DnD works** on a tablet viewport — long-press to lift, drag, release to drop. Not pixel-perfect-Trello-quality, but functional.

Stable (`1.0.0`) is gated separately and includes external consumers + 30-day no-break window.

---

## 7. Open questions (will become locked decisions after sign-off)

| # | Question | Proposed answer | Notes |
|---|---|---|---|
| Q1 | **Slug name** — `kanban-board-01` vs alternatives | **`kanban-board-01`** | Matches `-01` versioned-component convention. Future variants (`kanban-board-02` swimlane-first?) are reachable. |
| Q2 | **Decomposition** — single sealed folder or multiple registry items? | **Single sealed folder** `kanban-board-01` with internal parts (`column.tsx`, `card.tsx`, `note.tsx`, `swimlane.tsx`, `palette.tsx`). | Matches `data-table` precedent. Tightly coupled — only meaningful together. One install: `pnpm dlx shadcn add @ilinxa/kanban-board-01`. |
| Q3 | **Card chrome — built-in slot, or first-class renderer registry?** | ⚠ **Card-renderer registry** (workspace-style). Items are pure JSON `{ id, rendererId, data }`; the board delegates rendering to a registered renderer. **Built-in renderers ship**: `kanban-card` (title / description / tags / assignees / meta) and `kanban-note` (title + body). **Consumers register more renderers** — including any rich card from elsewhere in this registry — with one wrapper line. A column's `items[]` may freely mix kinds. | Diverged from originally-proposed "lightweight chrome with renderBody slot." The registry pattern makes rich cards first-class siblings rather than nested-into-a-slot, matches the user's "ordered list of objects" framing, and keeps items pure-JSON-serializable. |
| Q4 | **Drag library** — dnd-kit, react-beautiful-dnd, native? | **`@dnd-kit/core` + `@dnd-kit/sortable` + `@dnd-kit/utilities`** | Modern standard. Accessible (keyboard sensor). Maintained. Touch + pen via pointer sensor. **Already a project dependency** (`@dnd-kit/core ^6.3.1`, `@dnd-kit/sortable ^10.0.0`, `@dnd-kit/utilities ^3.2.2`) — no install step. |
| Q5 | **CRUD trigger pattern** — inline editors or callback-only? | **Hybrid, controlled at the renderer.** When the consumer supplies CRUD callbacks (`onItemCreate` etc.), affordances render. Whether *inline editing UI* renders is decided per renderer: a renderer that ships `newItem` + `editForm` gets a built-in inline form; one that omits them only fires the callback (consumer handles their own form). No board-level kill switch needed — granularity lives at the renderer. | Two consumer types: "give me everything" (use built-in renderers, get inline) and "I have my own design system" (omit editForm, use the callback). The renderer-level toggle is finer-grained than a board-level flag. |
| Q6 | **Color picker — built-in palette or fully consumer-supplied?** | **Built-in 6-swatch palette** (slate / lime / amber / emerald / sky / rose; each maps to a semantic CSS var). **`palette` prop** allows full override. | Default ships safe. Consumers with brand systems pass their own. |
| Q7 | **Per-column movement controls** — flag schema? | **Per-column flags:** `allowReorder`, `allowIncoming`, `allowOutgoing`, `acceptsRendererIds` (which renderers this column hosts; default = all). **Per-item lock:** `item.locked` (overrides column flags). **Board-level:** `readOnly` (kills all DnD + CRUD). | Three-tier control. Common cases (read-only "Done" column, "Notes-only" column) covered by single flag. `acceptsRendererIds` replaces the earlier `acceptsKinds` since kinds are now arbitrary renderer ids, not a fixed `card`/`note` enum. |
| Q8 | **Swimlanes** — v0.1 or v0.2? | **v0.1.** | User explicitly listed swimlanes. API stays simple: `swimlanes` prop + `card.swimlaneId`. Each `(col × lane)` is its own droppable. |
| Q9 | **Notes between cards** — separate item kind or part of card chrome? | **Built-in renderer `kanban-note`**, registered the same way as `kanban-card`. Data shape: `{ title, body?, color? }`. Reorderable like any other item; subject to the same column-level controls (`acceptsRendererIds: ["kanban-note"]` makes a notes-only column). | User said "very simple … like a simple text boxes with title" — that's a different render, not a different mechanism. Under the renderer-registry model (Q3), notes are just one more renderer. No special discriminated union needed. |
| Q10 | **Collapsible columns — collapsed UI?** | **~40px vertical strip** showing column title (rotated or written vertically) + item count. Items still occupy logical state. Drop-onto-collapsed expands the column. | Matches sidebar-collapse pattern user referenced. |
| Q11 | **Controlled vs uncontrolled state** | **Both,** mirroring workspace: `data` / `defaultData` / `onChange`. | Standard React pattern. |
| Q12 | **WIP limits** — v0.1 hard, v0.1 soft, or v0.2? | **SOFT** — `column.maxItems` renders a warning chip when over capacity but does NOT block drops. Hard mode was never shipped and is out of scope (gate over-capacity in a consumer `onItemMove` handler). | Soft cap is the common ask. Hard enforcement adds UX complexity (rejection animation, block/queue UX). |
| Q13 | **Touch / pen DnD in v0.1?** | **Yes,** via dnd-kit's pointer sensor. Long-press lift, drag, release drop. Not pixel-perfect; functional. | Kanban without touch on tablets is a known gap. dnd-kit gets us 80% for free. |
| Q14 | **Card detail modal** | **Out of scope.** `onItemClick` exposed; consumers route to their own detail view. | Avoids modal-design rabbit hole. Detail surfaces vary too much per app to standardize. |
| Q15 | **Comment thread per card?** | **Out of scope.** The note item handles between-cards annotation; per-card threads use `comment-thread-01` inside a consumer-built card-detail surface. | Two different patterns; conflating them bloats the kanban surface. |

---

## 8. Risks

- **Scope creep.** Kanban is famously feature-bloated in real products (filters, search, swimlanes-by-N-axes, card templates, calendar views). The plan stage must be ruthless about deferring everything not in §2 in-scope.
- **DnD edge cases.** Drop targets near scroll edges, drop on collapsed columns, drop on empty columns, drop on swimlane boundaries, keyboard reorder across columns — each is a small project. dnd-kit handles most but the chrome around it is on us.
- **State preservation on cross-column move.** React reconciliation will remount cards if their position in the parent's children array changes naively. The implementation must use stable keys (item id) at every level so a moved card keeps its DOM and its body's internal state. This is a contract — easy to break, easy to ship, easy to regress.
- **Color picker palette ergonomics.** Consumers will want their own brand colors. The default 6-swatch palette must work in light + dark + pass contrast, AND the override path must be obvious. Plan stage locks palette schema.
- **Inline CRUD vs consumer's design system.** Inline editors are convenient but every team has their own form library. The hybrid (inline default + override flag) must be clean — not a half-shipped both-modes mess.
- **Test coverage.** No test runner in the repo; same risk as workspace. A DnD-heavy component is hard to verify by demo alone. Either land Vitest as a STATUS decision before this ships, or document test-debt and rely on demo + manual checklist.

---

## 9. Definition of "done" for THIS document (stage gate)

Before moving to the plan stage:

- [ ] Sections 1–8 reviewed.
- [ ] Q1–Q15 each carry an agreed or overridden answer (see §7).
- [ ] In-scope / Out-of-scope list confirmed.
- [ ] **User explicitly says "description approved" (or equivalent)** — this unlocks Stage 2 (`kanban-board-01-procomp-plan.md`).

After sign-off, no editing this doc casually — changes after sign-off should be loud and intentional, not silent rewrites.

---

## Appendix A — Original concept brief (verbatim)

> kanban component
> ------
> in kanban boards most of the time we have multiple column and each of them accepts different cards and all colomns and cars are dragable so we can move a card alongside the column and change the order or change the position in between the cols
> we alredy has rich card system that is more then enough and has its oun ordering and ...
> now we need a col system that accepts these cards as (kanban card objects) wit title, description, meta data ... plus optional card creation systen (+ crud)
> it must have a color picker option that enable to change the border and header color
> - card move ablity  must be controlable (order_changeable true/ false) and other card movements
> then we nead to create board components that keeps these columns (with optional column "crud" oftions)
>
> these col components must have narrowable option like sidebar colaps (optional)
> swimlane component, comment component between cards (same feature the cards has(but very simple ) like a simple text boxes with title
