# `todo-rich-card` — Pro-component Description (Stage 1)

> **Stage:** 1 of 3 · **Status:** ✅ Signed off (GATE 1 closed 2026-05-20)
> **Slug:** `todo-rich-card` · **Category:** `data`
> **Conceptual lineage:** task cards (Linear, Things 3, Height, Notion task boards), time-aware UI (calendar urgency gradients, SLA traffic-lights). **Fixed-schema sibling to [`rich-card`](../rich-card-procomp/)** — it borrows rich-card's architecture (uncontrolled + imperative handle, granular events, permission predicates, JSON I/O) but ships a closed `TodoItem` schema and a time-driven auto-color engine that rich-card deliberately doesn't carry.

This is the **description** doc. Its job is to pin down what we're building and why, surface open decisions, and earn sign-off before any planning or code. The original concept brief authored by the user is preserved verbatim in **Appendix A**.

> ⚠ **Architectural deviation flagged here for visibility:** the original brief mentioned "we can reuse the rich card as well but im not sure we must verify that." Verification result — **`todo-rich-card` does NOT extend, embed, or import `rich-card`.** Rationale: rich-card is an arbitrary-JSON outline editor; todo-rich-card is a fixed-schema task renderer with a time-driven color engine. Extending rich-card would inherit its full surface (~30 props, custom-key registry, reserved-key catalog, master validators) for no schema gain. **Instead** we mirror rich-card's architectural patterns — uncontrolled state with imperative ref handle, granular event surface, permission predicates, JSON-native input/output — so consumers who learn one component already know the other's shape. Same family, separate genes.

---

## 1. Problem

Every product Hessam touches eventually needs a **time-aware task surface**:

- agent run-queues with start/expire windows
- content publication schedules with embargo + sunset
- workflow tasks with assignees, attachments, deadlines
- moderation queues with SLA-driven urgency
- personal planning tools, daily-standup tickets, sprint cards

Today, every project handles this differently:

- **Headless task libraries** (`@dnd-kit` recipes, custom drag stacks) ship the mechanics but no card UI, no time engine, no kanban story.
- **Off-the-shelf task UIs** (react-trello, asana-style boards, calendar libs) lock you into their schema and visual language.
- **Custom-built per project** — 1–3 weeks per occurrence, accessibility usually skipped, time-aware visual states almost never implemented.

The piece that's missing is a **rich, time-aware, fixed-schema task card** that:

1. carries the standard task fields out of the box (people, attachments, links, status, dates),
2. paints urgency directly onto the card chrome via a deterministic time→color engine,
3. is fully data-interactive (JSON I/O, clipboard, drag-drop of payloads),
4. and is composable into both **its own list shell** (sibling procomp `todo-list`) AND **existing host surfaces** — `rich-card-in-flow`-style canvases and `kanban-board-01`-style boards.

This pro-component is the card. Its sibling, `todo-list`, is the orchestration shell (separate description doc, separate ship).

### Release strategy — phased

| Version | Scope |
|---|---|
| **v0.1 (this doc)** | Single-card renderer. All fields, auto-color engine, both edit modes (popup default + inline-toggle), JSON I/O, clipboard, DnD payload, granular events, permission predicates, imperative handle. Standalone-usable. |
| **v0.2** | Slot props for `person` / `link` / `image` field renderers (additive, non-breaking). Field-level permission predicates. |
| **v0.3** | Color-engine extensions: custom ramps published as a named-preset registry, optional pulse keyframe (gated on framer-motion adoption). |
| **Companion adapters (parallel)** | `todo-rich-card-in-flow` (flow-canvas-01 node renderer, mirrors `rich-card-in-flow` shape). Kanban integration ships as a `KanbanCardRenderer<TodoItem>` either inside this folder or via `todo-list`'s kanban variant — decision in GATE 2. |
| **`todo-list` v0.1** (separate procomp) | Orchestration shell with `variant="rich" \| "tree" \| "kanban"`, sort/filter/search, drag-reorder + drag-to-reparent, infinite nesting, bulk JSON ops. |

Each step is independently shippable: v0.1 alone is a registerable card.

---

## 2. In scope / Out of scope

### v0.1 — in scope

**Data**
- Fixed `TodoItem` schema (see §4). Closed set of fields; consumer-defined `status` enum (string).
- **Multi-** support: `images: Array<{src, alt?, caption?}>`, `links: Array<{url, label?, icon?}>`. Single or multi consumers both work.
- **Time fields**: `setAt` (required), `startAt?` (defaults to `setAt`), `expireAt?`, `duration?` (ms). `expireAt` wins over `duration` when both are present.
- **Person fields**: `targetPerson?` + `creatorPerson?`, structured as `{id, name, avatar?}`. Minimal `{name}` consumers get default render.
- **Status field**: free string (consumer-defined enum); `active: boolean` is the separate visibility flag.
- **Per-item lock**: `locked: boolean` blocks both edit modes and drag from the host.
- **Per-item color override**: `borderColor?: string` skips the time engine for that node. Accepts any CSS color string (hex, rgb, oklch, named). The inline-edit affordance for setting this — free hex input vs. palette dropdown vs. both — is a plan-stage UX decision.
- **Children**: `children?: TodoItem[]` — infinite recursive nesting. Child rendering treatment matches parent: every nested item carries the **same action affordances** as a top-level item (edit button, drag handle, lock toggle, color override, status badge, person chips). No per-level style hierarchy in v0.1 — that's a list-variant concern; nested cards here all paint and act identically.

**Auto-color engine**
- Computes `elapsed = clamp01((now - startAt) / (expireAt - startAt))` (or `/ duration` if no `expireAt`).
- Maps `0 → green`, `1 → red` via OKLCH ramp (urgency direction — fresh tasks calm, overdue tasks alarming).
- Past `expireAt`: pinned full red.
- Painted as border color of the card chrome.
- Host-level `colorRamp?: 'default' | 'muted' | 'vivid' | 'monochrome' | (elapsed: number) => string` swaps the ramp.
- Per-item `borderColor` overrides everything for that node.
- Independent per item; **no parent rollup** in v0.1 (each item paints from its own dates).
- Recompute strategy: on render + on a configurable interval prop (default 60s).

**Edit modes** (both ship in v0.1 — not split across versions)
- `editable?: boolean` (default `false`).
- `editable=false`: edit button on each item opens a **popup** (canonical convention locked by rich-card-in-flow v0.1.0).
- `editable=true`: edit button toggles **inline mode** for that item — fields become inputs in-place; popup remains available as secondary action.
- `locked: true` blocks both modes for that node.

**Edit button**
- Always rendered on the card chrome (top-trailing).
- Hidden only when fully view-only — i.e., no edit-capable callback is wired AND `editable` is `false` AND no `onEdit` handler.
- Consumers can force-hide via `showEditButton={false}` (escape hatch for hosts that ship their own edit affordance, e.g. a flow-canvas adapter that wires its own toolbar).

**JSON I/O surface** (mirrors rich-card v0.3 patterns)
- `defaultValue: TodoItem` — uncontrolled seed; remount via `key` prop to reset.
- Imperative ref handle: `getValue(): string` (canonical JSON), `getTree(): TodoItem`, `isDirty()`, `markClean()`, `focusItem(id)`.
- Clipboard ops: `copy()`, `paste()` (also wired to standard Cmd/Ctrl+C and Cmd/Ctrl+V keyboard shortcuts when the card has keyboard focus).
- DnD payload: card is a DnD source for its own JSON payload AND a drop target for matching payloads (same `application/x-ilinxa-todo+json` MIME type). Cross-card paste within a list is the list shell's concern; intra-card paste of children is in scope here.

**Granular event surface** (mirrors rich-card)
- `onChange(tree)` (master), `onFieldEdited(event)`, `onStatusChanged(event)`, `onItemAdded(event)`, `onItemRemoved(event)`, `onItemMoved(event)` (within own subtree), `onColorOverridden(event)`, `onActiveToggled(event)`, `onPaste(event)`, `onCopy(event)`.

**Permission predicates** (mirrors rich-card's per-action predicate pattern)
- `canEditItem?(id)`, `canRemoveItem?(id)`, `canAddChildren?(id)`, `canDragItem?(id)`, `canToggleActive?(id)`, `canOverrideColor?(id)`.
- Declarative shortcut: `permissions?: { default?, byLevel?, byItem?, inherit? }` — same shape as rich-card's `RichCardPermissions` (the `inherit` flag controls whether child rules cascade from their parent's effective rule).
- `onPermissionDenied?(action, itemId, reason)` fires for analytics when an action would have been blocked (mirrors rich-card's [`onPermissionDenied`](../../src/registry/components/data/rich-card/types.ts) pattern).

**A11y**
- `role="article"` on the card; `aria-label` from `name`; `aria-disabled` when `locked` or `!active`.
- Edit button is a real `<button>` with `aria-haspopup="dialog"` (popup mode) or `aria-pressed` (inline mode).
- Keyboard: Tab into card → Enter/Space activates default edit affordance; Escape closes inline mode without saving.
- Color contrast: borderColor never affects text contrast (text uses semantic tokens); ramp values verified against light + dark backgrounds.

**Portability**
- Zero `next/*` imports; no `process.env`; no app context.
- SSR-safe (time engine uses `Date.now()` only inside `useEffect` + interval — first paint uses props-derived static state).

**Composable target surfaces** (out-of-the-box renderers shipped or planned)
- **Standalone**: drop a `<TodoRichCard defaultValue={item} />` anywhere.
- **`rich-card-in-flow` style** (flow-canvas-01 node): adapter ships as the sibling procomp `todo-rich-card-in-flow` (mirrors rich-card-in-flow's shape exactly). v0.1 of this procomp ships before the flow adapter; adapter follows in its own PR.
- **`kanban-board-01` card slot**: ships a `todoRichCardKanbanRenderer: KanbanCardRenderer<TodoItem>` export with `dragHandle: "header"` (the kanban-board pattern explicitly designed for renderers with internal pointer interactions — same lock rich-card uses). Lives either in this folder's `parts/kanban-adapter.tsx` or in todo-list's kanban variant; decision in GATE 2.

### v0.1 — out of scope (deferred to v0.2+)

- Slot props for field renderers (`renderPerson?`, `renderLink?`, `renderImage?`). Fixed renderers in v0.1; slot opening is non-breaking when added in v0.2.
- Custom ramp registry (named presets are baked in v0.1; consumer-registered named presets land v0.3).
- Pulse / overdue animation — waiting on framer-motion adoption gate.
- Parent-rollup color/status aggregation — explicitly out of v0.1 per locked decision.
- Per-item override of `colorRamp` (only `borderColor` is per-item in v0.1).
- Built-in undo/redo (mirrors rich-card v0.4 — not needed in v0.1; consumer can wire via events if required).

### Deliberate non-goals (any version of `todo-rich-card`)

- **Not a list shell.** Multi-item orchestration (drag-reorder across siblings, drag-to-reparent across the tree, sort/filter/search, multi-select bulk ops, variant switching) is `todo-list`'s job, not this card's.
- **Not a calendar / scheduling primitive.** It carries dates and paints urgency from them. It does not lay items out on a time axis.
- **Not a recurrence engine.** No RRULE, no "repeats every Monday." Recurrence is consumer-owned and produces fresh `TodoItem`s.
- **Not a notification system.** No alarms, no email triggers, no push. Color is the only built-in urgency cue.
- **Not a server-state synchronizer.** Consumer wires persistence via events; we ship no backend or local-storage adapter.
- **Not a markdown / rich-text editor for `description`.** Description is a plain string in v0.1. If a consumer wants rich text, they wrap it themselves (e.g., feed our `description` to plate-as-viewer).

---

## 3. Target consumers

| Archetype | Example | What they need |
|---|---|---|
| **Workflow / project app** *(primary)* | Internal task manager, sprint board, agent queue UI | Card carries assignee + dates + status + links; renders into a kanban board or a flat list; clipboard + DnD between sites |
| **Content scheduling tool** *(primary)* | Editorial calendar, publish queue, embargo manager | Cards with `startAt` + `expireAt`; urgency-coloring helps editors triage at a glance |
| **Agent / pipeline orchestrator** *(primary)* | Run-queue viewer, retry dashboard, batch-job monitor | Cards represent runs; auto-color shows queue freshness vs SLA; JSON I/O lets the host paste in new runs |
| **Embedded in `flow-canvas-01`** *(primary)* | Pipeline editor where nodes ARE tasks | Card-as-node via the companion `todo-rich-card-in-flow` adapter; same shape as `rich-card-in-flow` |
| Personal planning UI *(secondary)* | Daily standup, weekly review, todo MVP | Drop-in card with sensible defaults; both edit modes |

Non-targets: free-form prose docs, calendar grid layouts (use a calendar primitive), gantt timelines (use a gantt primitive), notification feeds (use a notification system).

---

## 4. Rough API sketch (NOT final — that's the plan stage)

This is illustrative. **The canonical, shipped shape lives in [`src/registry/components/data/todo-rich-card/types.ts`](../../../src/registry/components/data/todo-rich-card/types.ts)** — defer to it on any naming difference (sketch updated to current names: `addChildren`, `showEditButton`, `key: TodoEditableField`, non-null event `parentId`).

```ts
// ─── Data shape ───

export type TodoPerson = {
  id: string;
  name: string;
  avatar?: string;          // URL
};

export type TodoImage = {
  src: string;
  alt?: string;
  caption?: string;
};

export type TodoLink = {
  url: string;
  label?: string;           // defaults to URL display
  icon?: string;            // optional named icon or URL
};

export type TodoItem = {
  id: string;
  name: string;
  description?: string;
  status: string;                      // consumer-defined enum
  active: boolean;                     // false → dimmed + filtered by default in list shell
  // Time fields (drive the auto-color engine)
  setAt: string;                       // ISO-8601
  startAt?: string;                    // defaults to setAt
  expireAt?: string;                   // wins over duration when both present
  duration?: number;                   // ms; used only if expireAt absent
  // People
  targetPerson?: TodoPerson;
  creatorPerson?: TodoPerson;
  // Attachments
  images?: TodoImage[];
  links?: TodoLink[];
  // Visual + behavior overrides
  borderColor?: string;                // skips the time engine for this node
  locked?: boolean;                    // blocks edit + drag
  // Nesting
  children?: TodoItem[];
};

// ─── Auto-color engine ───

export type TodoColorRampPreset = 'default' | 'muted' | 'vivid' | 'monochrome';
export type TodoColorRamp = TodoColorRampPreset | ((elapsed: number) => string);

// ─── Permissions (mirrors rich-card's pattern) ───

export type TodoPermissionRule = {
  edit?: boolean;
  remove?: boolean;
  addChildren?: boolean;
  drag?: boolean;
  toggleActive?: boolean;
  overrideColor?: boolean;
};

export type TodoPermissions = {
  default?: TodoPermissionRule;
  byLevel?: Record<number, TodoPermissionRule>;
  byItem?: Record<string, TodoPermissionRule>;
  inherit?: boolean;
};

// ─── Events ───

export type TodoFieldEditedEvent = {
  itemId: string;
  key: TodoEditableField;
  oldValue: unknown;
  newValue: unknown;
};

export type TodoStatusChangedEvent = {
  itemId: string;
  oldStatus: string;
  newStatus: string;
};

export type TodoItemAddedEvent = {
  parentId: string;                    // always set — adds are scoped under an existing node
  item: TodoItem;
};

export type TodoItemRemovedEvent = {
  itemId: string;
  removed: TodoItem;
  parentId: string;
};

export type TodoItemMovedEvent = {
  itemId: string;
  oldParentId: string;
  newParentId: string;
  oldIndex: number;
  newIndex: number;
};

export type TodoColorOverriddenEvent = {
  itemId: string;
  oldColor: string | undefined;
  newColor: string | undefined;
};

export type TodoActiveToggledEvent = {
  itemId: string;
  oldActive: boolean;
  newActive: boolean;
};

export type TodoPasteEvent = {
  parentId: string;                    // where the paste lands
  payload: TodoItem;
};

export type TodoCopyEvent = {
  itemId: string;
  payload: TodoItem;
};

// ─── Component props (v0.1 surface) ───

export type TodoRichCardProps = {
  defaultValue: TodoItem;              // seed; remount via key prop to reset

  // Auto-color
  colorRamp?: TodoColorRamp;           // default 'default'
  colorRefreshIntervalMs?: number;     // default 60_000; 0 to disable

  // Edit modes
  editable?: boolean;                  // default false (popup-only)
  showEditButton?: boolean;         // default true; auto-hides when no edit handler wired

  // Permissions (declarative + predicate escape hatches)
  permissions?: TodoPermissions;
  canEditItem?: (id: string) => boolean;
  canRemoveItem?: (id: string) => boolean;
  canAddChildren?: (id: string) => boolean;
  canDragItem?: (id: string) => boolean;
  canToggleActive?: (id: string) => boolean;
  canOverrideColor?: (id: string) => boolean;
  onPermissionDenied?: (
    action: keyof TodoPermissionRule,
    itemId: string,
    reason: 'by-item' | 'by-level' | 'default' | 'predicate' | 'locked',
  ) => void;

  // Events
  onChange?: (tree: TodoItem) => void;
  onFieldEdited?: (event: TodoFieldEditedEvent) => void;
  onStatusChanged?: (event: TodoStatusChangedEvent) => void;
  onItemAdded?: (event: TodoItemAddedEvent) => void;
  onItemRemoved?: (event: TodoItemRemovedEvent) => void;
  onItemMoved?: (event: TodoItemMovedEvent) => void;
  onColorOverridden?: (event: TodoColorOverriddenEvent) => void;
  onActiveToggled?: (event: TodoActiveToggledEvent) => void;
  onCopy?: (event: TodoCopyEvent) => void;
  onPaste?: (event: TodoPasteEvent) => void;

  // Container
  className?: string;
  'aria-label'?: string;
};

// ─── Imperative handle ───

export type TodoRichCardHandle = {
  getValue(): string;                            // canonical JSON
  getTree(): TodoItem;                           // object form
  isDirty(): boolean;
  markClean(): void;
  focusItem(id: string): void;
  copy(itemId?: string): Promise<void>;          // copies item (or root if omitted)
  paste(parentId?: string): Promise<void>;       // pastes into parent (or root if omitted)
  setBorderColor(itemId: string, color: string | null): void;
  toggleActive(itemId: string): void;
};
```

**Surface budget**: ~10 prop categories, ~15 events, ~8 imperative methods. If v0.1 surface inflates beyond ~30 props total, the API is wrong and we restart this section.

---

## 5. Example usages

### 5.1 — Standalone task card

```tsx
<TodoRichCard
  defaultValue={{
    id: 'task-001',
    name: 'Review pull request #482',
    description: 'Auth middleware rewrite — flagged by legal',
    status: 'in-progress',
    active: true,
    setAt: '2026-05-19T09:00:00Z',
    expireAt: '2026-05-21T17:00:00Z',
    targetPerson: { id: 'hessam', name: 'Hessam', avatar: '/avatars/hessam.png' },
    creatorPerson: { id: 'legal-bot', name: 'Legal Compliance Bot' },
    links: [{ url: 'https://github.com/...', label: 'PR #482' }],
  }}
  editable={false}
  onFieldEdited={(e) => console.log('field changed', e)}
/>
```

Card renders with assignee chip, creator chip, one link with a default github favicon, no images, status badge "in-progress", border color computed from now → expireAt (probably mid-ramp yellow-orange). Edit button opens popup.

### 5.2 — Inline-editable card with custom color ramp

```tsx
<TodoRichCard
  defaultValue={{
    id: 'task-002',
    name: 'Publish Q2 newsletter',
    status: 'draft',
    active: true,
    setAt: '2026-05-01T00:00:00Z',
    expireAt: '2026-05-31T23:59:59Z',
    images: [
      { src: '/hero-1.jpg', alt: 'Q2 highlights', caption: 'Hero candidate A' },
      { src: '/hero-2.jpg', alt: 'Alternative hero', caption: 'Hero candidate B' },
    ],
  }}
  editable={true}
  colorRamp="muted"
  onChange={(tree) => saveDraft(tree)}
/>
```

Editable card with muted (low-chroma) ramp. Edit button toggles inline mode — name, description, status, dates become inputs in-place. Images render as a multi-image strip. Saves on every change.

### 5.3 — JSON I/O round-trip

```tsx
const ref = useRef<TodoRichCardHandle>(null);

return (
  <>
    <TodoRichCard
      ref={ref}
      defaultValue={{ id: 'task-003', name: 'Draft', status: 'todo', active: true, setAt: '2026-05-20T00:00:00Z' }}
    />
    <button onClick={() => ref.current?.copy()}>Copy</button>
    <button onClick={() => ref.current?.paste()}>Paste as child</button>
    <button onClick={() => navigator.clipboard.writeText(ref.current!.getValue())}>
      Export canonical JSON
    </button>
  </>
);
```

Demonstrates the JSON I/O surface — programmatic copy/paste, imperative export. The card also responds to standard Cmd/Ctrl+C / Cmd/Ctrl+V when focused.

---

## 6. Success criteria

The component ships v0.1.0 (alpha) when:

1. **TodoItem parses + renders** — every field in the schema produces the expected visual element.
2. **Auto-color is deterministic** — same `now`, `startAt`, `expireAt` always produces the same border color; OKLCH ramp verified across light + dark backgrounds with no contrast regressions on text.
3. **Color edge cases** — past `expireAt` pins full red; `duration`-only normalizes against duration; `expireAt` wins when both present; per-item `borderColor` overrides ramp.
4. **Color refresh** — `colorRefreshIntervalMs` actually re-renders the border at the configured cadence; `0` disables the interval but render-time computation still works.
5. **Both edit modes work** — `editable=false` opens popup; `editable=true` toggles inline; `locked` blocks both; permission predicates gate every action.
6. **JSON I/O round-trips cleanly** — `JSON.parse(handle.getValue())` equals the seed (with any missing optional fields filled in to defaults).
7. **Clipboard ops** — `copy()` puts payload on the system clipboard with the right MIME; `paste()` accepts both the MIME payload and a plain-JSON paste; keyboard shortcuts work when the card has focus.
8. **DnD payload** — card is draggable as a source; matching payloads can be dropped onto child slots; non-matching payloads are rejected gracefully.
9. **Granular events fire correctly** — every public event has at least one demo path that exercises it.
10. **Permissions enforce** — declarative `permissions` + predicate escape hatches both deny the right actions; `onPermissionDenied` fires with the correct `reason` for analytics.
11. **A11y contract holds** — VoiceOver / NVDA announces the card and its edit button; keyboard reaches every interactive element; `aria-disabled` reflects `locked` + `!active`.
12. **Portability** — zero `next/*` imports, no `process.env`, no app context, SSR-safe first paint.
13. **Demo + usage docs** complete; demo exercises both edit modes + auto-color ramp options + per-item override + JSON I/O + clipboard + DnD payload.
14. **Compiles + renders** at `/components/todo-rich-card` with no console warnings, validate-meta-deps clean, build clean, F-cross-11 path-b consumer-tsc smoke clean.
15. **Companion-adapter readiness** — `todoRichCardKanbanRenderer` ships as a named export (so kanban-board demos can register it); `todo-rich-card-in-flow` adapter procomp scaffolded but its v0.1 ships separately.

Stable (`1.0.0`) is gated separately and includes v0.2 + external consumer + 30-day no-break window.

---

## 7. Locked decisions (was: open questions)

Decisions reached during the GATE 1 conversation. Each row records the question + the agreed answer. Pre-sign-off changes should update this section in place; post-sign-off changes are loud and intentional.

| # | Question | Decision |
|---|---|---|
| Q1 | **Slug + category** | `data/todo-rich-card`. No `-01` suffix (foundational primitive; convention follows `rich-card`, `stat-card`, `data-table`, `file-tree`). Sibling list shell is `data/todo-list`, sibling flow adapter is `data/todo-rich-card-in-flow`. |
| Q2 | **Architecture** | **Two procomps, shipped in order: `todo-rich-card` first, then `todo-list`.** Card ships standalone, registerable in `rich-card-in-flow`-style canvases and `kanban-board-01`. List shell follows in a separate PR. Reuse of `rich-card` itself was considered and **rejected** (rich-card is arbitrary-JSON; todo-rich-card is fixed-schema). We **mirror rich-card's patterns** — uncontrolled + imperative handle, granular events, permission predicates, JSON I/O — without sharing code. |
| Q3 | **Color ramp direction** | **Urgency direction.** `0% elapsed → green`, `100% elapsed → red`. Past `expireAt`: pinned full red. Matches calendar / SLA convention. |
| Q4 | **Color override API shape** | **Two layers**: (1) per-item `borderColor?: string` skips the engine for that node; (2) per-host `colorRamp?: 'default' \| 'muted' \| 'vivid' \| 'monochrome' \| (elapsed) => string` swaps the ramp globally. Time engine still computes `elapsed`; only the mapping changes. |
| Q5 | **Duration vs expire-at precedence** | `expireAt` wins when both are set. `duration` is used only when `expireAt` is absent (normalized against duration from `startAt`). Single deterministic rule. |
| Q6 | **Past-expire color behavior** | **Pinned full red.** No pulse, no distinct "overdue" color in v0.1 (animation deferred pending framer-motion adoption). |
| Q7 | **Edit mode semantics** | **`editable` enables a toggle**, popup remains default click affordance. `editable=false` → click edit button = popup (canonical convention from rich-card-in-flow v0.1.0). `editable=true` → edit button toggles per-item between view and inline-edit; popup still available as a secondary action. Per-item state — host doesn't dictate. `locked` blocks both. |
| Q8 | **Edit button visibility** | **Always visible on the card chrome.** Hidden only when fully view-only (no edit handler wired AND `editable=false` AND no `onEdit`). |
| Q9 | **Nesting — status & color rollup** | **Independent per item.** Each item paints from its own dates; no parent-child color/status aggregation in v0.1. Consumers can compute rollup externally via public helpers if they want it. |
| Q10 | **Person / link / image field shape** | **Structured objects with sensible defaults**: `person {id, name, avatar?}`, `link {url, label?, icon?}`, `image {src, alt?, caption?}`. Minimal shapes (just `name` / `url` / `src`) get a sensible default render. Slot-prop renderers deferred to v0.2 (additive, non-breaking). |
| Q11 | **JSON I/O surface** | **Mirror rich-card v0.3** — `defaultValue` for seed, imperative handle with `getValue(): string` (canonical JSON) + `getTree(): TodoItem`. Clipboard via `copy() / paste()` methods + Cmd/Ctrl+C / Cmd/Ctrl+V when focused. DnD as source + target with `application/x-ilinxa-todo+json` MIME. Cross-card moves are list-shell concern; intra-card child paste is in-scope here. |
| Q12 | **Permission model** | **Mirror rich-card's pattern** — declarative `permissions?: { default?, byLevel?, byItem?, inherit? }` + per-action predicates (`canEditItem`, `canRemoveItem`, `canAddChildren`, `canDragItem`, `canToggleActive`, `canOverrideColor`). |
| Q13 | **Standalone vs embedded** | **Both.** Standalone usable as `<TodoRichCard />`. Registerable in `kanban-board-01` via a `KanbanCardRenderer<TodoItem>` named export with `dragHandle: "header"` (the kanban-board pattern for renderers with internal pointer interactions, e.g., inline editors). Registerable in `flow-canvas-01` via a sibling adapter procomp `todo-rich-card-in-flow` (mirrors `rich-card-in-flow` shape exactly — separate procomp, separate PR, separate v0.1). |
| Q14 | **Color refresh cadence** | `colorRefreshIntervalMs` prop, **default 60s**. `0` disables the interval. First paint uses props-derived static state to stay SSR-safe; client interval re-renders on mount. |
| Q15 | **Tree-variant treatment of color** | **N/A here** — tree variant lives on `todo-list`, not on this card. Locked: tree variant **opts out** of auto-color (lightweight rows, no border-color ramp). This card always carries color; tree consumers use the row primitive, not this card. |
| Q16 | **Identifier strategy** | `id: string` is **required** on input (no auto-generation, unlike rich-card's `__rcid`). Consumers carrying a real-world entity already have one; auto-generating UUIDs would obscure data flow. Plan stage will lock collision-detection behavior. |

---

## 8. Risks

- **Auto-color staleness.** The 60s default refresh interval is a compromise — too aggressive wakes laptops, too slow makes border colors lie. Real consumers (live dashboards) will want faster; planning UIs slower. Plan must verify the interval prop wires cleanly to a single setInterval per mounted card (not per-item — would be N intervals on a nested tree).
- **OKLCH ramp contrast against backgrounds.** Border colors at mid-ramp (yellow-orange) may have low contrast against the design system's off-white background. Plan must include a contrast check against both light + dark theme tokens and document any colors that get nudged inward.
- **Edit-mode UX divergence between popup and inline.** Two modes means two UX surfaces to keep visually consistent. Risk: inline-mode date pickers behave differently from popup-mode date pickers. Plan must specify which shadcn primitives back each, and confirm a single shared schema.
- **Clipboard MIME compatibility.** Browsers vary in how they handle custom MIME types on the clipboard. Plan must specify the fallback: when consumer system doesn't expose our MIME, paste plain JSON as a fallback path.
- **DnD payload collision with `todo-list` shell.** Both this card and the list shell are DnD-aware. If a list shell renders these cards, who handles the drop? Plan must declare: card swallows drops into its own child slots; list shell handles drops into sibling/reparent slots. Establish the protocol now to avoid double-handling.
- **F-S1 lock applies** — once `todo-rich-card-in-flow` ships, cross-procomp imports between it and `todo-rich-card` MUST use relative paths and MUST NOT re-export through a barrel. Existing lock pattern (`json-form v0.1.4`, `rich-card-in-flow v0.1.0`) is the template.
- **F-cross-13 lurking** — shadcn primitive Radix → Base UI divergence may affect any new shadcn primitives we add. Plan stage must list every shadcn primitive used and verify behavior under the producer-side `pnpm dlx shadcn add` flow (defensive callback shape, etc.).
- **Test coverage.** Same as rich-card — no test runner wired. Color engine is the kind of thing that benefits from property tests (random `now/startAt/expireAt` → assert clamp + monotonicity). Either land Vitest as a STATUS decision before v0.1, or ship with extensive demo-driven verification + test-debt note.
- **No undo/redo in v0.1.** Consumers wiring edit handlers without undo expose users to data loss on accidental clicks. Document explicitly in the guide that consumers should wire optimistic-undo themselves or wait for v0.2+.

---

## 9. Definition of "done" for THIS document (stage gate)

Before moving to Stage 2 (`todo-rich-card-procomp-plan.md`):

- [x] Sections 1–8 reviewed.
- [x] Q1–Q16 each carry an agreed answer (see §7).
- [x] Architectural decision flagged at top: **do not extend `rich-card`** — build fresh, mirror patterns.
- [x] Companion adapter strategy stated: `todo-rich-card-in-flow` ships as a sibling procomp following `rich-card-in-flow` precedent; kanban integration ships as a named `KanbanCardRenderer<TodoItem>` export.
- [x] Phased release strategy documented: v0.1 ships full card surface; v0.2 adds field renderer slots; v0.3 adds ramp extensions + pulse.
- [x] **User explicitly says "description approved" (or equivalent)** — this unlocks Stage 2 (`todo-rich-card-procomp-plan.md`). Signed off 2026-05-20.

After sign-off, no editing this doc casually — changes after sign-off should be loud and intentional, not silent rewrites.

---

## Appendix A — Original concept brief (verbatim)

This is the user's authored description from the GATE 1 conversation, preserved unchanged for reference. The structured sections above distill from this source and resolve the gaps via §7's locked decisions.

> next pro component is todo list
> but i want you to help me silidify my idea
> ----
> - it must have defferent visual version
> - it must have well structured sub components
> - time aware feature
> here i want to apply a realy cool feature
> we will have different time or duration
> set-at, expire-at , start-at
> start at by default = set at unless we specify a date and time
> we normalize the deference of start at time and expire at time  to 0-100 and we define a auytomaticali change color
> 0 = red 100 = green and shade of them in mid values
> ----
> other value is duration: if we dont have expire at we should set duration number and in that case again we normalize that to 0-100 again and same color fonction
> ----
> both color are border colors of that list item or sub item
> -----
> each item should have the standard todo items featurs and fields
> - name
> - description
> - target person
> - creator erson
> - img => multy sopport
> - link => multy support
> - status
> - active deactive
> ...
> ----
> some dynamik system like our rich-card pro component
> same infinit nested structure
> nested items has parent features as well
> posision lockable or dragable
> - custom change order  (drag up and done)
> - drag to inside of other item
> - sort features
> - filter and search
> - ...
> -----
> we have tree version like our file tree with colabsable items les ui effort strait forward and simple (no auto color system)
> and canban version
> use the same canbann panels and items can sit in kanbans insted of cards
> kanban columns represent the status or person or any other multy state variable and cards in them represents the items
> this version is ui rich
> ewen i think we can reuse the rich card as well but im not shure we must verify that
> ---
> also these todo-rich-cards must be usable in richcard-flow as one of the component types supported by rich-card-flow
> ---
>
> [Follow-up message refining the brief:]
>
> 3 important thing
> - these card must have structured json sopport (import export) clipboard - dragdrop
> as we hadd in rich card (we interact with data)
> - ... iem and sub item must have edit btn
> -- color setup -> custom or fixed custom color from palete
> -- edit mode (on / off) this will activate inline edit mode
> if edsitable = true by dev

### Notes on direction interpretation

The original brief states `0 = red 100 = green` for the normalized time→color mapping. After conversation this was inverted to the **urgency direction** (`0% elapsed = green`, `100% elapsed = red`) so the visual matches universal calendar/SLA convention (fresh = calm, overdue = alarming). The original wording is preserved verbatim above; §7-Q3 records the inverted-and-locked decision.
