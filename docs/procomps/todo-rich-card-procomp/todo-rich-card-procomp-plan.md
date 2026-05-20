# `todo-rich-card` — Pro-component Plan (Stage 2)

> **Stage:** 2 of 3 · **Status:** ✅ Signed off (GATE 2 closed 2026-05-20)
> **Slug:** `todo-rich-card` · **Category:** `data`
> **Inputs:** description signed off ([todo-rich-card-procomp-description.md](todo-rich-card-procomp-description.md)). All sixteen description-stage decisions (Q1–Q16) are inherited as fixed inputs. **Do NOT extend `rich-card`** per the top-of-description deviation banner — mirror patterns, not code.
> **Scope of this plan:** v0.1.0 only. v0.2 (field-renderer slots) / v0.3 (color-engine extensions + pulse) each get their own plan revision when they're up next. Companion adapters (`todo-rich-card-in-flow`, kanban adapter) are referenced but their plans are separate documents.

This doc locks **how** we build what the description committed to. After sign-off, no scaffolding-time second-guessing — implementation follows the plan, deviations are loud.

---

## 1. Inherited inputs (one paragraph)

`todo-rich-card` is a `data`-category pro-component: a fixed-schema, time-aware task card. Input is a single root `TodoItem` (recursive `children?: TodoItem[]`); the closed schema covers `id` (required string) / `name` / `description?` / `status` (free string) / `active` (boolean) / four time fields (`setAt` required, `startAt?` / `expireAt?` / `duration?`) / `targetPerson?` / `creatorPerson?` / `images?: TodoImage[]` / `links?: TodoLink[]` / `borderColor?` / `locked?` / `children?`. An **auto-color engine** computes `elapsed = clamp01((now - startAt) / (expireAt - startAt))` (or `/ duration` if no `expireAt`) and paints urgency through an OKLCH **green → red** ramp onto the card border; past `expireAt` pins full red. Two **edit modes** ship in v0.1 — `editable=false` (default) → click edit button opens a **popup**; `editable=true` → toggle inline mode per item, popup remains as secondary action. **Locked** items block both. **JSON I/O** mirrors rich-card patterns: uncontrolled `defaultValue`, imperative ref handle with `getValue()` / `getTree()`, programmatic + keyboard-bound **clipboard** copy/paste with `application/x-ilinxa-todo+json` MIME, **DnD** card-as-source + card-as-target for matching payloads. **Permission predicates** mirror rich-card's matrix + per-action predicates + `onPermissionDenied`. Field renderers (person / link / image) are **fixed** in v0.1 — slot props deferred to v0.2. **Companion adapters** ship as sibling procomps (`todo-rich-card-in-flow`) or named exports (`todoRichCardKanbanRenderer` for `kanban-board-01`).

---

## 2. Final API (locked)

This is the public surface for v0.1.0. Every type goes in `types.ts` and is re-exported from `index.ts`. Plan refinements over the description's sketch (loud, not silent):

- **Added `now?: Date | (() => Date)` prop** for testing — lets consumers freeze the time-engine for snapshot tests and Storybook-style demos. Default: `() => new Date()`.
- **Added `RAMPS` const export** so consumers can compose ramps externally (`RAMPS.muted`) before passing them in, mirroring rich-card's `RESERVED_KEYS` / `PREDEFINED_KEYS` exports.
- **Added `'onEditRequest'` callback** distinct from the `onChange` master — fires when the user clicks the edit button, BEFORE the popup/inline mode opens. Lets consumers veto the open (return `false`) for cross-cutting cases like "redirect to detail page instead of opening inline." Optional; defaulting to "open" if absent.
- **Renamed `editButtonVisible` → `showEditButton`** for naming convention (matches `showXxx` / `hideXxx` ergonomics across the registry).
- **Reworked `TodoPermissionRule.addChild` → `addChildren`** to disambiguate from rich-card's `addField` / `addCard` naming. The capability is "add child items"; plural matches our list/tree semantics.
- **Promoted `TodoFlatField` keys to a typed union** rather than `keyof TodoItem` — `keyof TodoItem` would include `children` / `id` which aren't user-editable fields.
- **Promoted `TodoItemMovedEvent` to ONLY fire for intra-card moves** (a child reparented to another position under the same root). Cross-card moves are the list-shell's concern (`todo-list` will emit its own `TodoListItemMovedEvent`).

```ts
// ───── public consts ─────

export const TODO_RAMPS = ['default', 'muted', 'vivid', 'monochrome'] as const;
export type TodoColorRampPreset = typeof TODO_RAMPS[number];

// Built-in ramp functions, exported for composition.
export const RAMPS: Record<TodoColorRampPreset, (elapsed: number) => string>;

// MIME for clipboard + DnD payloads.
export const TODO_CLIPBOARD_MIME = 'application/x-ilinxa-todo+json' as const;

// ───── public types ─────

export type TodoPerson = {
  id: string;
  name: string;
  avatar?: string;
};

export type TodoImage = {
  src: string;
  alt?: string;
  caption?: string;
};

export type TodoLink = {
  url: string;
  label?: string;
  icon?: string;
};

export type TodoItem = {
  id: string;
  name: string;
  description?: string;
  status: string;
  active: boolean;
  setAt: string;                       // ISO-8601
  startAt?: string;
  expireAt?: string;
  duration?: number;                   // ms
  targetPerson?: TodoPerson;
  creatorPerson?: TodoPerson;
  images?: TodoImage[];
  links?: TodoLink[];
  borderColor?: string;
  locked?: boolean;
  children?: TodoItem[];
};

export type TodoColorRamp = TodoColorRampPreset | ((elapsed: number) => string);

// Status rendering (plan refinement; see Q-P4)
export type TodoStatusOption = {
  value: string;
  label: string;
  variant?: 'default' | 'secondary' | 'destructive' | 'outline';
};

// Field union for the GENERIC `onFieldEdited` event. Excludes fields with dedicated events:
//   - borderColor → fires `onColorOverridden` (not `onFieldEdited`)
//   - locked      → fires `onLockedToggled`
//   - active      → ALSO fires `onActiveToggled` in addition to `onFieldEdited` (typed listeners can prefer the dedicated event)
// Structural keys (`id`, `children`) are excluded entirely — they're not edits, they're tree operations
// covered by `onItemAdded` / `onItemRemoved` / `onItemMoved`.
export type TodoEditableField =
  | 'name' | 'description' | 'status' | 'active'
  | 'setAt' | 'startAt' | 'expireAt' | 'duration'
  | 'targetPerson' | 'creatorPerson' | 'images' | 'links';

export type TodoPermissionRule = {
  edit?: boolean;
  remove?: boolean;
  addChildren?: boolean;                   // plural — capability is "add child items"
  drag?: boolean;
  toggleActive?: boolean;
  overrideColor?: boolean;
};

export type TodoPermissionReason =
  | 'locked' | 'by-item' | 'by-level' | 'default' | 'predicate';

export type TodoPermissions = {
  default?: TodoPermissionRule;
  byLevel?: Record<number, TodoPermissionRule>;
  byItem?: Record<string, TodoPermissionRule>;
  inherit?: boolean;                       // default true — child rules cascade from parent's effective rule
};

// ───── events ─────

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
  parentId: string;                        // never null in v0.1 — siblings of root are list-shell concern
  item: TodoItem;
};

export type TodoItemRemovedEvent = {
  itemId: string;
  removed: TodoItem;
  parentId: string;                        // never null in v0.1 (root removal is list-shell concern)
};

export type TodoItemMovedEvent = {
  itemId: string;
  oldParentId: string;                     // both within the same root
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

export type TodoLockedToggledEvent = {
  itemId: string;
  oldLocked: boolean;
  newLocked: boolean;
};

export type TodoCopyEvent = {
  itemId: string;
  payload: TodoItem;
};

export type TodoPasteEvent = {
  parentId: string;
  payload: TodoItem;
};

export type TodoEditRequestEvent = {
  itemId: string;
  mode: 'popup' | 'inline';
};

// ───── component props (v0.1 surface) ─────

export type TodoRichCardProps = {
  defaultValue: TodoItem;                  // seed; remount via key prop to reset

  // Auto-color
  colorRamp?: TodoColorRamp;               // default 'default'
  colorRefreshIntervalMs?: number;         // default 60_000; 0 disables interval (render-time computation still works)
  now?: Date | (() => Date);               // default () => new Date(); for testing

  // Edit modes
  editable?: boolean;                      // default false (popup-only)
  showEditButton?: boolean;                // default true; auto-hides when fully view-only
  statusOptions?: TodoStatusOption[];      // (plan refinement; see Q-P4) enables <Select> in edit modes + variant-colored badges in view; absent → free-string <Input> + secondary <Badge>

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
    reason: TodoPermissionReason,
  ) => void;

  // Events
  onChange?: (tree: TodoItem) => void;
  onEditRequest?: (event: TodoEditRequestEvent) => boolean | void; // return false to veto open
  onFieldEdited?: (event: TodoFieldEditedEvent) => void;
  onStatusChanged?: (event: TodoStatusChangedEvent) => void;
  onItemAdded?: (event: TodoItemAddedEvent) => void;
  onItemRemoved?: (event: TodoItemRemovedEvent) => void;
  onItemMoved?: (event: TodoItemMovedEvent) => void;
  onColorOverridden?: (event: TodoColorOverriddenEvent) => void;
  onActiveToggled?: (event: TodoActiveToggledEvent) => void;
  onLockedToggled?: (event: TodoLockedToggledEvent) => void;
  onCopy?: (event: TodoCopyEvent) => void;
  onPaste?: (event: TodoPasteEvent) => void;

  // Container
  className?: string;
  'aria-label'?: string;                   // default name of root item
};

// ───── imperative handle ─────

export type TodoRichCardHandle = {
  getValue(): string;                                // canonical pretty-printed JSON
  getTree(): TodoItem;                               // object form
  isDirty(): boolean;
  markClean(): void;
  focusItem(id: string): void;
  copy(itemId?: string): Promise<void>;              // root if omitted
  paste(parentId?: string): Promise<void>;           // root if omitted
  setBorderColor(itemId: string, color: string | null): void;
  toggleActive(itemId: string): void;
  setLocked(itemId: string, locked: boolean): void;
  openEdit(itemId: string, mode?: 'popup' | 'inline'): void;
  closeEdit(): void;
};

// ───── private (NOT exported) ─────

type EditState =
  | { kind: 'view' }
  | { kind: 'popup'; itemId: string }
  | { kind: 'inline'; itemId: string };

type Action =
  | { type: 'replace-tree'; tree: TodoItem }
  | { type: 'open-edit'; itemId: string; mode: 'popup' | 'inline' }
  | { type: 'close-edit' }
  | { type: 'edit-field'; itemId: string; key: TodoEditableField; value: unknown }
  | { type: 'add-child'; parentId: string; item: TodoItem; index?: number }
  | { type: 'remove-item'; itemId: string }
  | { type: 'move-item'; itemId: string; newParentId: string; newIndex: number }
  | { type: 'set-border-color'; itemId: string; color: string | null }
  | { type: 'toggle-active'; itemId: string }
  | { type: 'set-locked'; itemId: string; locked: boolean }
  | { type: 'set-focus'; itemId: string | null }
  | { type: 'mark-clean' };

type ResolvedPermissions = {
  edit: boolean;
  remove: boolean;
  addChildren: boolean;
  drag: boolean;
  toggleActive: boolean;
  overrideColor: boolean;
  reason: TodoPermissionReason;
};
```

**Defaults:**
- `colorRamp`: `'default'`
- `colorRefreshIntervalMs`: `60_000`
- `now`: `() => new Date()`
- `editable`: `false`
- `showEditButton`: `true`
- `permissions.inherit`: `true`
- `'aria-label'`: defaults to root `item.name`

**Required props:** `defaultValue`. Everything else optional.

**Counts:** 1 component + 1 ref-handle type + 1 props type + 13 event/data types + 4 const exports + 1 ramp type union + 1 permission rule + 1 permission reason union + 1 editable-field union = ~24 public exports. Within the description's ~30-prop surface budget.

---

## 3. Architecture

### 3.1 Two-layer data model: input vs. internal

Public API: `TodoItem` — the loose, optional-field-rich shape consumers write.
Internal: `TodoNode` — normalized with derived data attached (`level`, `parentId`, `path`).

```ts
type TodoNode = {
  item: TodoItem;
  level: number;          // 1 = root
  parentId: string | null;
  index: number;          // sibling position (0-based)
  childNodes: TodoNode[]; // recursive; same order as item.children
};
```

**Normalize pass** (`lib/normalize.ts`) walks the input once:

1. Validate node is an object with `id: string` and `name: string` → else push error, fallback to a synthesized error node.
2. Validate `setAt` is a parseable ISO-8601 → else push error, fall back to `now()` ISO.
3. Validate person / image / link entries → drop bad entries with warning, keep good ones.
4. Detect duplicate `id`s within the subtree → first wins, subsequent dropped + warned (per Q16, IDs are required + unique within a root).
5. Recurse for each child, computing `level + 1`, `parentId = parent.id`, `index = position-in-children-array`.
6. Return `{ root: TodoNode, errors: NormalizationError[], idIndex: Map<string, TodoNode> }`.

**Denormalize pass** (`lib/normalize.ts:denormalize`) walks `TodoNode` and rebuilds the public `TodoItem` shape (drops internal `level` / `parentId` / `index`). Same shape consumers passed in, with any auto-defaults filled.

`getValue()` returns `JSON.stringify(denormalize(state.root), null, 2)`. `getTree()` returns `denormalize(state.root)`.

The two passes form the round-trip contract:

```
parse(serialize(parse(x))) === parse(x)
```

Both passes are pure functions in `lib/`, independently testable when Vitest lands.

### 3.2 Rendering: depth-first walk with article semantics

`todo-rich-card.tsx` renders a `<section role="region">` containing a single `<Card node={root} />`. `parts/card.tsx` renders its own structure recursively:

```tsx
<article
  role="article"
  aria-label={item.name}
  aria-disabled={!permissions.edit || !item.active || item.locked}
  style={{ borderColor: resolveBorderColor(node, computedElapsed, ramp) }}
  className={cn(cardChrome, ...)}
>
  <CardHeader />              {/* name, status badge, active toggle, edit button, action menu */}
  <CardBody />                {/* description, time-info, person chips, links, images */}
  {hasChildren && (
    <div role="group" className="children-group">
      {childNodes.map(child => <Card node={child} />)}
    </div>
  )}
</article>
```

The recursion is uniform — child cards are **the same component** as the root (no `level`-conditional branching in JSX). Per-item rendering treatment matches parent (locked Q9 / description §2 "Children"). The card itself doesn't render an outer `<ul role="tree">` (that's a list-shell concern); a single card is an `article`, and nested children form a `group` of articles. This keeps the card valid as a kanban-board item or flow-canvas node without a wrapping tree element.

### 3.3 State model: single reducer

State:

```ts
type State = {
  root: TodoNode;
  edit: EditState;
  focusedId: string | null;
  dirty: boolean;
  // Derived on demand (NOT stored): elapsed per item, resolved permissions per item, computed border colors.
};
```

Reducer (pure, in `lib/reducer.ts`):

| Action | Effect |
|---|---|
| `replace-tree` | Wholesale replace `root`; reset `edit`, `dirty = false`. Used by `key` remount only — host doesn't call this. |
| `open-edit` | If permissions allow, set `edit = { kind: mode, itemId }`. Closes any other open edit. |
| `close-edit` | Set `edit = { kind: 'view' }`. Discards in-flight edits unless the inline form already committed via `edit-field`. |
| `edit-field` | Locate node by id; replace `item[key]` with `value`; bump `dirty = true`. Validates against the type for that field. |
| `add-child` | Insert item under parent at `index` (or append). Bumps `dirty`. |
| `remove-item` | Remove from parent's children array. Closes edit if removed item was being edited. |
| `move-item` | Splice from old parent, insert into new parent at index. Only intra-card moves; cross-card is list-shell concern. |
| `set-border-color` | Set or clear `item.borderColor`. |
| `toggle-active` | Flip `item.active`. Fires `onActiveToggled`. |
| `set-locked` | Set `item.locked`. Fires `onLockedToggled`. Closes any open edit on this item. |
| `set-focus` | Replace `focusedId`. |
| `mark-clean` | `dirty = false`. |

Initial state computed in `createInitialState(input, props)`:
- Normalize `input` → root + idIndex (or error node if normalize fails).
- `edit = { kind: 'view' }`.
- `focusedId = null` (set on first user interaction).
- `dirty = false`.

### 3.4 Per-card props vs. context

**Single React context (`TodoCardContext`) for tree-wide config in v0.1.** Unlike rich-card's pure prop-drilling stance, todo-rich-card has more values that every card needs uniformly. Prop-drilling them through `<Card>` recursion would be 8+ props per level. A single provider at the root keeps the recursive `<Card>` component clean. **Flagged Q-P1.**

```ts
// Private — not exported. Constructed in todo-rich-card.tsx, consumed by parts/*.
type TodoCardContextValue = {
  // Time + color
  now: () => Date;
  tick: number;                                     // bumped by useColorEngine on each interval; included in memo dep so cards re-render
  ramp: (elapsed: number) => string;                // resolved ramp function (preset → fn, or custom passthrough)

  // State machine
  dispatch: Dispatch<Action>;
  editState: EditState;                             // { kind: 'view' | 'popup' | 'inline'; itemId?: string }
  focusedId: string | null;
  dirty: boolean;

  // Permissions resolver (closure over props.permissions + predicates; memoized)
  resolvePermissions: (node: TodoNode) => ResolvedPermissions;

  // Display config
  statusOptions?: TodoStatusOption[];
  editable: boolean;
  showEditButton: boolean;

  // Event firing (closure that dispatches AND fires the matching on* callback)
  fireEvent: <K extends keyof TodoEventMap>(name: K, event: TodoEventMap[K]) => void;
};
```

The context is **stable**: `ctx` is recomputed only when its inputs change. Memoized via `useMemo`; React 19 compiler tracks dependencies automatically. The `tick` field is the one value that *intentionally* changes on a timer — it forces children to re-render so they recompute `elapsed` from `now()`.

### 3.5 Pure helpers in `lib/`

| File | Exports | Purpose |
|---|---|---|
| `normalize.ts` | `normalize(item)`, `denormalize(node)` | Input ↔ internal tree |
| `color-engine.ts` | `computeElapsed(item, now)`, `resolveBorderColor(node, elapsed, ramp)` | Time → 0-1 + color resolution |
| `ramp.ts` | `RAMPS` (record of preset fns), `applyRamp(ramp, t)`, `interpolateOklch(a, b, t)` | OKLCH ramp engine |
| `permissions.ts` | `resolvePermissions(node, props) => ResolvedPermissions` | Permission resolver |
| `json-io.ts` | `serialize(item)`, `parse(json)`, `validate(item)`, `toClipboardItem(item)`, `fromClipboardData(data)` | JSON + clipboard payload shape |
| `reducer.ts` | `reducer(state, action)`, `createInitialState(...)` | State machine |
| `time.ts` | `parseIso(s)`, `formatRelative(d, now)`, `formatAbsolute(d)` | Date arithmetic + display |

All seven are pure modules with no React imports.

---

## 4. File structure

```
src/registry/components/data/todo-rich-card/
├── todo-rich-card.tsx              ← root; "use client"; forwardRef + useReducer + useImperativeHandle + Context.Provider
├── parts/
│   ├── card.tsx                    ← single TodoItem renderer (recursive)
│   ├── card-header.tsx             ← name + status badge + active toggle + edit button + action menu trigger
│   ├── card-body.tsx               ← description + time-info + person chips + links + image strip
│   ├── time-info.tsx               ← formatted set/start/expire/duration + remaining-time text
│   ├── person-chip.tsx             ← avatar + name (target / creator variants)
│   ├── link-chip.tsx               ← icon + label + external-link affordance
│   ├── image-strip.tsx             ← multi-image horizontal scroll with captions
│   ├── status-badge.tsx            ← status pill (consumer-styled if status maps to a known token)
│   ├── action-menu.tsx             ← dropdown: edit / copy / paste / lock / remove / override color / toggle active
│   ├── edit-popup.tsx              ← Dialog containing edit form (all fields in one place)
│   └── edit-inline.tsx             ← inline-mode field renderers (text input, date pickers, select, switch)
├── hooks/
│   ├── use-color-engine.ts         ← single root-level setInterval; triggers re-render at interval; recomputes elapsed per render via context
│   ├── use-card-state.ts           ← consolidated edit-mode + clipboard + DnD orchestration; wraps reducer dispatch
│   └── use-keyboard.ts             ← Cmd/Ctrl+C/V + Enter/Escape + Tab handling
├── lib/
│   ├── normalize.ts                ← TodoItem ↔ TodoNode (pure)
│   ├── color-engine.ts             ← computeElapsed + resolveBorderColor (pure)
│   ├── ramp.ts                     ← OKLCH ramp presets + interpolation (pure)
│   ├── permissions.ts              ← resolvePermissions (pure)
│   ├── json-io.ts                  ← serialize / parse / validate / clipboard helpers (pure)
│   ├── reducer.ts                  ← state machine (pure)
│   └── time.ts                     ← date helpers (pure)
├── types.ts                        ← every public export from §2 + internal types
├── dummy-data.ts                   ← 4 demo items: fresh task (early ramp), urgent task (late ramp), overdue task (pinned red), nested family (3 levels)
├── demo.tsx                        ← renders the four demos in a stack with mode toggles
├── usage.tsx                       ← prose docs
├── meta.ts                         ← ComponentMeta
└── index.ts                        ← barrel
```

**Deviation from convention:** the component-guide §5 anatomy lists `parts/` and `hooks/` as optional. **`lib/` is added** for pure non-React helpers — same justification as rich-card and workspace plans. **Flagged Q-P2.**

**Counts:** 7 mandatory anatomy files + 11 parts + 3 hooks + 7 lib = **28 files total**. Comparable to rich-card (25) and workspace (26).

---

## 5. Color engine

### 5.1 `computeElapsed` algorithm

```
computeElapsed(item, now) → number | null:
  start = parseIso(item.startAt ?? item.setAt)
  if (start is invalid): return null

  if (item.expireAt):
    end = parseIso(item.expireAt)
    if (end is invalid OR end <= start): return null
    return clamp01((now - start) / (end - start))

  if (item.duration && item.duration > 0):
    return clamp01((now - start) / item.duration)

  return null    // no expireAt + no duration → time engine inactive for this item
```

Behavior summary:
- **Both `expireAt` and `duration` present** → `expireAt` wins (per Q5).
- **Only `expireAt`** → normalize over `(expireAt - startAt)`.
- **Only `duration`** → normalize over `duration` from `startAt`.
- **Neither** → returns `null`; border uses theme default (semantic `border-border` token).
- **Past `expireAt`** → returns `1.0` (clamped); ramp produces full red.
- **Before `startAt`** → returns `0.0` (clamped); ramp produces full green.

### 5.2 `resolveBorderColor` decision tree

```
resolveBorderColor(item, elapsed, ramp, theme) → CSS color string:
  if (item.borderColor != null): return item.borderColor             // per-item override wins
  if (elapsed == null):          return null                          // signal "use default"
  return applyRamp(ramp, elapsed)
```

A `null` return tells the renderer to omit the `style={{ borderColor }}` prop entirely and let the semantic-token className (`border-border`) apply.

### 5.3 OKLCH ramp implementation

Ramp functions take `t: number` in `[0, 1]` and return a CSS color string. Built in OKLCH for perceptual smoothness — green at `t=0`, red at `t=1`.

```ts
// Endpoint colors (matched to design-system tokens for visual coherence).
const STOPS = {
  default:    { from: { l: 0.78, c: 0.18, h: 142 }, to: { l: 0.62, c: 0.22, h: 25  } },
  muted:      { from: { l: 0.82, c: 0.08, h: 142 }, to: { l: 0.68, c: 0.12, h: 25  } },
  vivid:      { from: { l: 0.75, c: 0.22, h: 145 }, to: { l: 0.58, c: 0.26, h: 22  } },
  monochrome: { from: { l: 0.85, c: 0.02, h: 250 }, to: { l: 0.45, c: 0.02, h: 250 } },
};

interpolateOklch({ l: l1, c: c1, h: h1 }, { l: l2, c: c2, h: h2 }, t) →
  // Hue interpolation takes the shorter path around the circle (so green→red goes through yellow/orange, not blue/purple).
  hueDelta = ((h2 - h1 + 540) % 360) - 180
  return {
    l: l1 + (l2 - l1) * t,
    c: c1 + (c2 - c1) * t,
    h: h1 + hueDelta * t,
  }
→ `oklch(${l} ${c} ${h})`
```

Browser support for native `oklch()` syntax is universal in our target browsers (locked by the rest of the design system, which uses OKLCH tokens throughout). No fallback computation needed.

**Custom ramp functions** (`(elapsed: number) => string`) are called as-is and trusted to return a valid CSS color. No validation — invalid colors silently fall back to browser default per CSS spec.

### 5.4 Refresh interval architecture

**Single setInterval at the root** — driven by `useColorEngine()` hook mounted once in `todo-rich-card.tsx`. NOT per-card (would be N intervals for N-node tree).

```ts
// hooks/use-color-engine.ts
function useColorEngine(intervalMs: number) {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    if (intervalMs <= 0) return;
    const id = setInterval(() => setTick(t => t + 1), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  // `tick` is read by Context.Provider's memo dep — triggers a single re-render of the whole tree on each interval.
}
```

Every card reads `now()` from context (same instance, refreshed each tick), recomputes `elapsed` for itself in render, and the OKLCH `style.borderColor` is recalculated. React 19 compiler memoization means cards whose `elapsed` rounded-to-thousandths hasn't changed shouldn't re-render their DOM — only the `style` prop changes when the color actually changes.

`intervalMs = 0` → no interval; render-time computation still works (uses `now()` at mount). Lets consumers drive ticking externally (e.g., from a global app clock) by remounting via `key`.

### 5.5 SSR boundary

`use-color-engine.ts` schedules its first `setInterval` inside `useEffect`. First-paint computation uses the props-derived `now()` from the prop (or `new Date()` from the default-factory) which is **the same on server and client** if the consumer freezes it via the `now` prop. Without a frozen `now`, server and client will compute slightly different elapsed values and React will hydrate-mismatch.

**Mitigation:** the component renders **without** a `borderColor` style on first paint (just the semantic token), and applies the computed color in a `useLayoutEffect` after mount. Documented in usage. Consumers wanting deterministic SSR pass a frozen `now`.

---

## 6. Edit modes

### 6.1 State machine

```ts
type EditState =
  | { kind: 'view' }                        // default
  | { kind: 'popup'; itemId: string }       // dialog open for one item
  | { kind: 'inline'; itemId: string };     // inline form active for one item
```

**Invariant:** only ONE item is in edit mode at a time (either popup OR inline). Opening a new edit closes any current edit. The list-shell may eventually want multi-item inline editing, but the card alone enforces single-item-edit.

**Transitions:**

```
view → popup     (open-edit, mode='popup'): permissions check passes
view → inline    (open-edit, mode='inline'): permissions check passes AND editable=true
popup → view     (close-edit): always allowed
inline → view    (close-edit): always allowed
popup → inline   (open-edit, mode='inline' on same/different item): allowed if editable=true
inline → popup   (open-edit, mode='popup'): allowed
```

Permissions check is `resolvePermissions(node).edit && !item.locked && !globalReadOnly`.

### 6.2 Mode resolution at click time

When the user clicks the edit button:

```
onClick:
  if (!editable):
    → dispatch('open-edit', { itemId, mode: 'popup' })
  else:
    // editable=true: the button is a TOGGLE
    if (state.edit.kind === 'inline' && state.edit.itemId === item.id):
      → dispatch('close-edit')                    // toggle off
    else:
      → dispatch('open-edit', { itemId, mode: 'inline' })

  // Either way, fire the veto-capable event first
  if (props.onEditRequest?.({ itemId, mode }) === false): return
```

**Secondary popup access** when `editable=true`: long-press / right-click / "Edit in dialog…" in action menu opens popup explicitly. Single-click on the edit button always toggles inline. **Flagged Q-P3** — the long-press affordance might be unergonomic; we can alternatively always show a small "open in dialog" affordance next to the edit button when `editable=true`. Recommendation: small `Dialog` icon next to the toggle (visible only when `editable=true`).

### 6.3 Field-by-field renderers

**Popup mode** (`parts/edit-popup.tsx`):
- Renders all editable fields in a single shadcn `<Dialog>` form.
- Form is uncontrolled: each field initializes from `item[key]`, commits to reducer on Save.
- Cancel discards in-flight changes (state was never bumped).
- Save dispatches `edit-field` actions for each changed field, then `close-edit`.

**Inline mode** (`parts/edit-inline.tsx`):
- Each field renders an inline editor in place of the view-mode display.
- Edits commit immediately on blur (or Enter for text fields) via `edit-field` action.
- No save button — changes are saved as you go.
- Escape closes inline mode without rollback (changes already committed live).

**Field → primitive mapping:**

| Field | Primitive |
|---|---|
| `name` | `<Input>` (popup), inline `<input>` styled as headline (inline) |
| `description` | `<Textarea>` |
| `status` | `<Select>` if consumer passes `statusOptions` prop; otherwise `<Input>` (free string fallback) |
| `active` | `<Switch>` |
| `setAt` / `startAt` / `expireAt` | `<Popover>` + `<Calendar>` + `<Input type="time">` row |
| `duration` | `<Input type="number">` + unit `<Select>` (ms / s / min / hour / day) |
| `targetPerson` / `creatorPerson` | popup: `<Input>` for name + id + avatar URL. inline: same row layout. (Full person picker is a v0.2+ concern.) |
| `images[]` | popup: list editor with add/remove + per-row src/alt/caption inputs. inline: read-only in v0.1 (multi-row inline editing in nested cards is a layout headache). |
| `links[]` | same shape as images: popup full-editor; inline read-only. |
| `borderColor` | popup: free-hex input + small swatch row (10 OKLCH presets). inline: small color-square button → `<Popover>` with the same picker. |

**Note:** `statusOptions?: Array<{ value: string; label: string }>` is added to props during this section — necessary to make status edit ergonomic. Added to the props table in §2 silently here for transparency: this is a plan refinement.

Actually — **let me flag it loud, not silent.** Going back to update §2's prop list to include `statusOptions`. Doing so in the impl, not in this draft. **Flagged Q-P4.**

### 6.4 Action menu

Per-item `<DropdownMenu>` triggered by `<MoreHorizontal />` icon next to the edit button. Items:

- **Edit** (default popup mode)
- **Edit in dialog…** (forces popup even when `editable=true`)
- **Copy**
- **Paste as child** (disabled if clipboard doesn't have our MIME)
- **Toggle active**
- **Lock / Unlock**
- **Override color…** → opens borderColor picker
- **Remove**

Each item respects `resolvePermissions(node)`. Disabled items render greyed-out with a tooltip explaining why.

---

## 7. JSON I/O, clipboard, DnD

### 7.1 Serialize / parse

`serialize(item)` is `JSON.stringify(item, replacer, 2)` with a replacer that strips computed-only fields (none in v0.1 — schema is already serializable). Pretty-printed for human-readability when consumers inspect the clipboard.

`parse(json)` is `JSON.parse(json)` followed by `validate(item)`. Validate ensures:
- `id: string, length > 0`
- `name: string`
- `status: string`
- `active: boolean`
- `setAt: string` matching ISO-8601 regex
- Other fields validated by `normalize` later; this is a structural fence.

Errors throw with a typed `TodoValidationError` carrying `path` + `expected` + `actual`.

### 7.2 Clipboard payload

`toClipboardItem(item)` returns a `ClipboardItem` with two representations:

```ts
new ClipboardItem({
  [TODO_CLIPBOARD_MIME]: new Blob([serialize(item)], { type: TODO_CLIPBOARD_MIME }),
  'text/plain': new Blob([serialize(item)], { type: 'text/plain' }),
})
```

Two-MIME write means consumers of plain `text/plain` clipboards (terminals, text editors) get the JSON they can read; consumers of our specific MIME get a fast-path indicator that it's a verified todo payload.

`fromClipboardData(dataTransfer)` reads:
1. Try our MIME first.
2. Fall back to `text/plain` → `JSON.parse` → `validate`. If validation fails, return `null` (paste is a no-op).

**Browser compatibility:** custom MIMEs on the system clipboard work in Chromium 104+, Safari 17.4+, Firefox 127+. Our target browsers cover this. Plain-text fallback handles the rest. Documented in usage.

### 7.3 Keyboard bindings

`use-keyboard.ts` attaches to the root `<section>`. Active only when a card has focus:

| Keys | Action |
|---|---|
| `Cmd/Ctrl + C` | Copy focused card |
| `Cmd/Ctrl + V` | Paste from clipboard as child of focused card |
| `Enter` / `Space` | Open default edit affordance (popup or inline-toggle, depending on `editable`) |
| `Escape` | If editing → close edit. Else → no-op. |
| `Tab` / `Shift+Tab` | Standard focus traversal (browser default, no override). |

No arrow-key navigation in v0.1 — a single card isn't a tree; arrow nav would imply parent/child traversal which is a list-shell concern. Consumers wrapping the card in a list shell get arrow nav from the shell.

### 7.4 DnD as source

Card sets up `draggable` HTML attribute on the outer `<article>`. On `dragstart`:

```ts
e.dataTransfer.setData(TODO_CLIPBOARD_MIME, serialize(item));
e.dataTransfer.setData('text/plain', serialize(item));
e.dataTransfer.effectAllowed = 'copy';                  // see note below
```

`effectAllowed = 'copy'` (NOT `'copyMove'`): the card alone never performs DnD-driven *moves* — cross-card moves are the list-shell's concern (§7.5). The card-as-source always produces a copy; the list-shell can override with `effectAllowed = 'copyMove'` on its own drag handles when sibling-reparent semantics are desired.

`onCopy` fires. The card visually goes semi-transparent during drag.

### 7.5 DnD as target

Children-group `<div role="group">` is a drop zone. On `dragover`:

```ts
if (e.dataTransfer.types.includes(TODO_CLIPBOARD_MIME)
    || e.dataTransfer.types.includes('text/plain')):
  e.preventDefault();   // signal "can accept"
```

On `drop`:
1. Extract payload via `fromClipboardData(e.dataTransfer)`.
2. If `null` → no-op.
3. Otherwise dispatch `add-child` action; fire `onPaste`.

**The card itself is not a drop target for sibling reparenting** — that's strictly a list-shell concern (per the description risk: "card swallows drops into its own child slots; list shell handles drops into sibling/reparent slots").

---

## 8. Permissions

### 8.1 Resolution order

`resolvePermissions(node, props) → ResolvedPermissions`:

1. **Hard locks** (highest priority):
   - If `item.locked` → all actions `false` with `reason: 'locked'`.
   - If `globalReadOnly` (not a prop in v0.1; placeholder for future) → all actions `false`.

2. **Per-action predicate** (`canEditItem?` / `canRemoveItem?` / etc.):
   - If predicate returns `false` → that action `false` with `reason: 'predicate'`.

3. **`permissions.byItem?.[itemId]`** rule → cascades upward via `inherit` flag.

4. **`permissions.byLevel?.[level]`** rule.

5. **`permissions.default`** rule.

6. **Fallback:** all actions `true` (open by default).

The `reason` field captures **the first layer that DENIED** the action. Used by `onPermissionDenied`.

### 8.2 Inheritance semantics

`permissions.inherit = true` (default): child's effective rule starts from parent's effective rule, then overlaid with the child's own byItem/byLevel entries. Cascade applies through descendant chain.

`permissions.inherit = false`: each item starts from `permissions.default` (no cascade from ancestors).

The resolution is computed lazily per-render-per-card (memoized by node id + permissions ref). Not stored in state.

### 8.3 `onPermissionDenied` callback

Fires when a user-triggered action is blocked. Triggered from:
- Edit button click → check `edit`
- Action menu items → check the corresponding action
- DnD drop → check `addChildren` on target
- Clipboard paste → check `addChildren` on parent
- Keyboard Cmd+V → check `addChildren` on focused card's parent

Argument: `(action, itemId, reason)`. Used by hosts for analytics, toast messages, or "request access" flows.

---

## 9. Rendering & styling

### 9.1 Card chrome

Default classNames (semantic tokens only):

```
article: rounded-2xl border-2 bg-card text-card-foreground p-4 shadow-sm transition-colors
        + when locked: opacity-70 cursor-not-allowed
        + when !active: opacity-50 saturate-50
        + focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2
```

`borderColor` from the time engine is applied as an inline `style.borderColor`. When the engine returns `null` (no time fields), the border falls back to the `border-border` token via the className.

Nested children-group: `mt-3 space-y-2 ps-4 border-s border-border/40`. Same indentation pattern as rich-card.

### 9.2 Card-header layout

```
<header class="flex items-center justify-between gap-2">
  <div class="flex items-center gap-2 min-w-0 flex-1">
    <h3 class="font-medium truncate">{item.name}</h3>
    <StatusBadge status={item.status} />
  </div>
  <div class="flex items-center gap-1 shrink-0">
    <Switch checked={item.active} onCheckedChange={toggleActive} aria-label="Active" />
    {showEditButton && <EditButton />}                       {/* primary edit affordance */}
    {showEditButton && editable && (                          {/* per Q-P3: secondary popup access when inline is the toggle action */}
      <button class="..." aria-label="Edit in dialog" onClick={() => openEdit(id, 'popup')}>
        <PanelTop class="size-3.5" />
      </button>
    )}
    <ActionMenu />
  </div>
</header>
```

The secondary "Edit in dialog" icon renders only when `editable={true}` (the inline-toggle mode), giving users a non-toggle path into the popup form. When `editable={false}`, the primary edit button already opens the popup, so the icon is hidden.

### 9.3 Card-body layout

```
<div class="mt-3 space-y-2 text-sm">
  {description && <p class="text-muted-foreground">{description}</p>}
  <TimeInfo />
  <div class="flex flex-wrap items-center gap-2">
    {targetPerson && <PersonChip person={targetPerson} variant="target" />}
    {creatorPerson && <PersonChip person={creatorPerson} variant="creator" />}
  </div>
  {links?.length > 0 && <div class="flex flex-wrap gap-1.5">{links.map(LinkChip)}</div>}
  {images?.length > 0 && <ImageStrip images={images} />}
</div>
```

### 9.4 Time-info display

```
<div class="flex items-center gap-2 text-xs text-muted-foreground">
  {expireAt && <span>Due {formatRelative(expireAt, now)}</span>}      // "Due in 2 days"
  {!expireAt && duration && <span>{formatDuration(duration)}</span>}   // "30 min"
  <Tooltip>
    <TooltipTrigger><Info class="size-3" /></TooltipTrigger>
    <TooltipContent>
      <dl>
        <dt>Set</dt><dd>{formatAbsolute(setAt)}</dd>
        <dt>Start</dt><dd>{formatAbsolute(startAt ?? setAt)}</dd>
        <dt>Expire</dt><dd>{expireAt ? formatAbsolute(expireAt) : '—'}</dd>
      </dl>
    </TooltipContent>
  </Tooltip>
</div>
```

### 9.5 Person chip

```
<span class="inline-flex items-center gap-1.5 rounded-full bg-muted px-2 py-0.5">
  <Avatar class="size-5">
    <AvatarImage src={person.avatar} alt={person.name} />
    <AvatarFallback>{initials(person.name)}</AvatarFallback>
  </Avatar>
  <span>{person.name}</span>
  {variant === 'creator' && <span class="text-muted-foreground text-xs">(creator)</span>}
</span>
```

### 9.6 Link chip

```
<a href={link.url} target="_blank" rel="noopener noreferrer"
   class="inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-xs hover:bg-muted">
  {link.icon ? <img src={link.icon} class="size-3" /> : <LinkIcon class="size-3" />}
  <span>{link.label ?? new URL(link.url).hostname}</span>
  <ExternalLink class="size-3 text-muted-foreground" />
</a>
```

### 9.7 Image strip

Horizontal `scroll-area` containing thumbnails. Click opens a lightbox `<Dialog>` (deferred — v0.1 just shows thumbs that open the original src in a new tab on click; full lightbox is v0.2). Caption renders below each thumb if present.

### 9.8 Status badge

Free-string `status` rendered in a `<Badge>` with `variant="secondary"`. Consumers wanting status-specific colors can pass `statusOptions?: Array<{ value: string; label: string; variant?: 'default' | 'secondary' | 'destructive' | 'outline' }>` (the v0.1 addition flagged in §6.3).

---

## 10. Composition pattern

Per component-guide §9, the canonical patterns are: render-props, generics, `children`, slot-props, headless+presentation.

**`todo-rich-card`'s pattern: closed sub-component set + className escape hatch.**

- Single public component `<TodoRichCard>`. `forwardRef` exposing `TodoRichCardHandle`.
- Sub-components (`Card`, `CardHeader`, `CardBody`, `EditPopup`, etc.) are **all private** in v0.1 — not exported.
- Customization happens through:
  - `colorRamp` (named preset or function)
  - `statusOptions` for status rendering
  - `permissions` + per-action predicates
  - `className` for outer container
  - `now` for time-engine override

- No render-props in v0.1. Field-renderer slots (`renderPerson?`, `renderLink?`, `renderImage?`) are explicitly deferred to v0.2 (additive, non-breaking — locked Q10 / description §2 v0.1 out-of-scope).

- The companion adapters (`todoRichCardKanbanRenderer`, `todo-rich-card-in-flow`) are separate exports that USE this component — they are not slot-prop alternatives.

State: **uncontrolled** (mirrors rich-card's locked pattern). `defaultValue` is seed; `key` remount resets. No controlled-mode `value` + `onChange` in v0.1.

---

## 11. Client/server boundary

`todo-rich-card.tsx`: **`"use client"`**. Required for: `useReducer`, `useRef`, `useImperativeHandle`, `setInterval` (color engine), click handlers, keyboard handlers, clipboard API, DnD API.

Server-safe (no directive needed):
- `types.ts`, `lib/*.ts`, `meta.ts`, `index.ts`, `dummy-data.ts` — pure modules.
- `demo.tsx` — server component wrapping `<TodoRichCard>` with dummy data.
- `usage.tsx` — server component, prose only.

Inherit "use client" from import boundary:
- `parts/*.tsx`, `hooks/*.ts`.

**SSR hydration**: per §5.5, color engine defers its `borderColor` style application to `useLayoutEffect` (no border color in first paint). This avoids server/client mismatch when `now` isn't frozen. Documented in usage.

---

## 12. Dependencies

### shadcn primitives (ALL already installed per `src/components/ui/` audit at planning time)

| Primitive | Used for |
|---|---|
| `avatar` | Person chips |
| `badge` | Status badge |
| `button` | Edit button, action triggers |
| `calendar` | Date picker in edit modes |
| `card` | Reference for chrome (we extend, don't compose directly) |
| `dialog` | Popup edit mode + (future v0.2) image lightbox |
| `dropdown-menu` | Action menu (edit/copy/paste/lock/remove/etc.) |
| `input` | Inline + popup text fields |
| `popover` | Date picker shell, borderColor picker, tooltip alternative |
| `scroll-area` | Image strip horizontal scroll |
| `select` | Status select (when statusOptions provided), duration unit |
| `separator` | Visual rules in popup edit form |
| `switch` | Active toggle, popup form booleans |
| `textarea` | Description editing |
| `tooltip` | Time-info hover details, disabled-action explanations |

**No installs required** — all 15 primitives are already in `src/components/ui/`.

`meta.ts` `dependencies.shadcn`: `["avatar", "badge", "button", "calendar", "dialog", "dropdown-menu", "input", "popover", "scroll-area", "select", "separator", "switch", "textarea", "tooltip"]`.

### npm peer deps

| Package | Used for |
|---|---|
| `lucide-react` | Icons throughout: `Pencil` (edit), `MoreHorizontal` (action menu), `Lock` / `Unlock`, `Copy` / `ClipboardPaste`, `Trash2`, `Palette`, `Calendar` / `Clock`, `Link` / `ExternalLink`, `Image`, `Info`, `User` / `UserPlus` |

`meta.ts` `dependencies.npm`: `{ "lucide-react": "^1.11.0" }` (matches rich-card's pin).

### internal registry deps

**None.** `todo-rich-card` does not compose other registry components. (`todo-rich-card-in-flow` will depend on this + `flow-canvas-01`; `todo-list` will depend on this + `kanban-board-01`. Both are separate procomps with their own meta.)

`meta.ts` `dependencies.internal`: `[]`.

### Zero-cost browser APIs

- `crypto.randomUUID()` — used by `id`-collision recovery (when input has duplicates).
- `navigator.clipboard.read/write` + `ClipboardItem` — clipboard ops.
- `Intl.DateTimeFormat` + `Intl.RelativeTimeFormat` — time display.
- `DataTransfer` — DnD payload.
- `setInterval` / `clearInterval` — color refresh.

### Banned / not-imported

- `next/*` — per portability contract.
- `process.env` — per portability contract.
- App context — per portability contract.
- `framer-motion` — not adopted yet (v0.3 pulse keyframe gated on this).
- Date libs (`date-fns`, `dayjs`, `luxon`) — `Intl` covers our needs; adding 80KB+ for a card component is wrong. If we ever need timezone math, revisit.

---

## 13. Edge cases

| Case | Behavior |
|---|---|
| `defaultValue` is undefined / null / not an object | Render error card: "Invalid input — `defaultValue` must be a TodoItem." Don't crash. |
| `id` missing or empty | Synthesize via `crypto.randomUUID()` + console warning. (Q16 says id is required; the warning enforces it without crashing.) |
| `name` missing or empty | Renders `"(Untitled)"` placeholder; warn. |
| Duplicate `id`s within subtree | First wins; subsequent get fresh UUIDs + warning. |
| `setAt` invalid ISO-8601 | Coerce to `now()` + warn. Time engine treats item as freshly created. |
| `expireAt < startAt` | Engine returns `null` (no color override); item renders with default border. Warn at parse. |
| `duration <= 0` | Engine treats as if absent. Warn. |
| Both `expireAt` and `duration` set | `expireAt` wins (per Q5). `duration` silently ignored (no warn — both-set is valid use). |
| Neither `expireAt` nor `duration` set | Engine inactive for this item; default border. |
| Time engine on a deeply-nested tree | Single `setInterval` at root drives all cards via context tick. No per-card timers. |
| Person with no `avatar` | Avatar fallback shows initials computed from `name`. |
| Image with no `alt` | `alt=""` (decorative) + console hint for a11y. |
| Link with no `label` | Display = `new URL(url).hostname` fallback. |
| Link with invalid URL | Render as plain `<span>` with the raw text + warn. |
| Locked item + user clicks edit | `onPermissionDenied('edit', id, 'locked')` fires; nothing else happens. |
| Inactive item + user clicks edit | Permissions still resolve normally (active is independent of permissions). |
| Clipboard paste with non-todo JSON | `fromClipboardData` returns `null`; no-op. `onPaste` does NOT fire. |
| Clipboard paste with our MIME but invalid schema | `validate` throws; caught; warn; no-op. |
| DnD drop on a locked parent | Permissions check on `addChildren` → denied → drop rejected + `onPermissionDenied`. |
| Inline edit on a field while another item is being edited | Reducer closes the prior edit, opens the new one. Any uncommitted inline change is lost (inline commits per-field on blur, so this only loses unblurred state). |
| `colorRefreshIntervalMs = 0` | No interval. Render-time computation uses current `now()` once at mount; never refreshes until something else triggers re-render. |
| `now` is a frozen `Date` instance | Engine uses it as-is; never advances. Useful for snapshot tests. |
| Border color override during edit | `setBorderColor(id, color)` dispatches `set-border-color`; fires `onColorOverridden`. |
| `images` / `links` arrays mutated externally (consumer mutation) | Ignored (uncontrolled). To update, remount via `key`. |
| Status string with leading/trailing whitespace | Rendered as-is (no trim). `statusOptions` matching is case-sensitive whole-string. |
| `aria-label` empty string | Falls back to `item.name`. |
| Very long descriptions | Wraps; no truncation in v0.1. Consumers wanting truncation wrap with `expandable-text-01`. |
| Very many children | Renders all (no virtualization in v0.1). Performance budget: 200 cards in a single tree. |
| RTL (`dir="rtl"` on parent) | Uses CSS logical properties (`ps-*` / `pe-*` / `border-s`). Drag handles unaffected. |

---

## 14. Accessibility

### Card semantics

- **Root container:** `<section role="region" aria-label={ariaLabel}>` (default label = root item's name).
- **Each card:** `<article role="article" aria-label={item.name} aria-disabled={locked || !active}>`.
- **Children group:** `<div role="group">` only when the card has children.
- **Edit button:** `<button aria-label={editable ? "Toggle edit" : "Edit"} aria-haspopup={editable ? undefined : "dialog"} aria-pressed={editable ? isInlineActive : undefined}>`.
- **Action menu:** shadcn `DropdownMenu` primitive handles its own ARIA.
- **Active switch:** `<Switch aria-label="Active">`.
- **Status badge:** `<span role="status">{status}</span>`.
- **Person chips:** avatar img has `alt={name}`; whole chip is a `<span>` (not interactive in v0.1).
- **Time info:** tooltip uses shadcn `Tooltip` primitive (correct ARIA out of the box).

### Keyboard model

| Keys | Action |
|---|---|
| `Tab` | Enter focusable elements within card (active switch, edit button, action menu, link chips). |
| `Enter` / `Space` on card (focusable wrapper) | Open default edit affordance. |
| `Enter` on edit button | Open edit (popup or inline toggle, per `editable`). |
| `Escape` in edit mode | Close edit (popup) or exit inline mode. |
| `Cmd/Ctrl + C` on card focus | Copy. |
| `Cmd/Ctrl + V` on card focus | Paste. |
| `Cmd/Ctrl + Enter` in popup form | Save. |

**Focus management:**
- Card's `<article>` is `tabindex="0"` to receive focus from the page.
- When edit opens (popup or inline), focus moves into the first form field.
- When edit closes, focus returns to the trigger element (edit button or action menu item).
- Inline edit fields use `focus-visible:ring-2 focus-visible:ring-ring`.

**Reduced motion:**
- `prefers-reduced-motion: reduce` → no color transition on border-color change (instant swap). Other CSS transitions on hover (chip lift, etc.) skip too.

**RTL:**
- All padding / margin / border classes use logical properties (`ps-4` / `pe-4` / `border-s`).
- DnD semantics unchanged.

---

## 15. Performance

| Concern | Strategy |
|---|---|
| Color recompute on every interval tick | Single setInterval at root. Context-tick value memoized so unchanged-elapsed cards don't recompute their style strings (React 19 compiler memo). |
| Re-renders on edit-mode change | Only the editing card and its edit form re-render; other cards' memoized output stays stable. |
| Permissions resolution | Memoized per-card via `useMemo` keyed by `(itemId, permissions ref, predicate refs, locked, active)`. Cheap recompute. |
| Many cards rendered | React 19 compiler should auto-memo `<Card>` subtrees. Fall back to manual `React.memo` keyed by `node.item.id` if profiling reveals jank. |
| Clipboard write | One JSON serialize per copy call. Cheap. |
| DnD drag | Native HTML5 DnD (no library). No per-pointer-move React state updates. |
| Tree normalize on input | Single O(n) walk at mount. Stored in reducer state; not redone per render. |

**Budget:** 200 cards in a single tree at 60fps for sustained scroll + interval-tick on a mid-tier laptop. Lower than rich-card's 500-node budget because per-card render cost is substantially higher here: color-engine recompute on tick, OKLCH ramp interpolation, person/link/image chip layouts, action-menu trigger, time-info tooltip, and Switch primitive. Each todo card is roughly 2.5× the DOM weight of a rich-card card. Larger trees should switch to a list-shell with virtualization (todo-list v0.2 will address).

**No test runner.** Same risk as rich-card. Color engine + ramp + permissions + normalize are pure modules — high-leverage candidates for property tests when Vitest lands. Plan-stage stance: ship v0.1 with demo-driven verification + STATUS.md test-debt entry. **Flagged Q-P5.**

---

## 16. Risks & alternatives

### Risks (carried from description, with plan-stage mitigations)

| Risk | Mitigation in this plan |
|---|---|
| Auto-color staleness | Single root setInterval (§5.4). Memo'd context prevents redundant re-renders. `colorRefreshIntervalMs = 0` escape hatch for consumer-driven ticking. |
| OKLCH ramp contrast | OKLCH endpoints in §5.3 are chosen against design-system tokens. Plan adds a contrast-check step to the implementation checklist before pre-PR — assert that mid-ramp values pass WCAG AA contrast against `--background` (light + dark) when used as a border. |
| Edit-mode UX divergence | Both modes share the same field→primitive mapping (§6.3). The same `<Calendar>` primitive drives both popup and inline date pickers. Save behavior differs (per-field on inline, batched on popup) but field rendering is shared. |
| Clipboard MIME compatibility | Dual-MIME write (custom + text/plain) ensures plain-text consumers get JSON they can read. Plain-text fallback on paste covers browsers without custom-MIME support. |
| DnD payload collision with list shell | Card swallows drops into its own children-group; list shell handles drops into sibling/reparent zones. Established in §7.5. |
| F-S1 lock | Once `todo-rich-card-in-flow` ships, relative imports + no cross-procomp barrel re-exports. Adapter has its own plan. |
| F-cross-13 lurking | All 15 shadcn primitives listed in §12 are already installed. Plan stage adds a smoke-test step pre-PR: install via `pnpm dlx shadcn@latest add` in a tmp consumer, verify no Radix→Base UI divergence in shipped output. |
| shadcn v4 `<Select>` ships `w-fit` baked in (project memory lock) | Both `<Select>` uses in this plan (status edit in §6.3, duration unit in §6.3) must explicitly override with `className="w-full"` to fill the form-row container. Cost a UI iteration cycle on rcif port editor before DevTools inspection revealed the root cause. `<Input>` is `w-full` by default, only `<Select>` needs the override. Document in `edit-popup.tsx` + `edit-inline.tsx` headers. |
| Test coverage | Pure `lib/` modules trivially testable when Vitest lands. v0.1 ships with extensive demo + STATUS test-debt note. |
| No undo/redo | Documented in usage: consumers should wire optimistic-undo themselves, or defer edits to v0.2+ where undo is on roadmap. |

### Alternatives considered, rejected

- **Native CSS `color-mix()` for the ramp** (browser-native interpolation). Rejected — browser support for OKLCH in `color-mix()` is patchier than the bare `oklch()` color syntax; JS interpolation gives deterministic output and unlocks the `colorRamp: (elapsed) => string` custom-function escape hatch.
- **Per-item setInterval.** Rejected — N intervals for N cards on a deeply-nested tree is wasted CPU. Single root interval ticks the whole tree via context.
- **Built-in Lightbox for images in v0.1.** Rejected — adds a heavy modal + carousel surface; native `target="_blank"` link on the thumbnail works fine in v0.1. v0.2 can add a real Lightbox.
- **Status as a typed enum (closed catalog).** Rejected — every consumer's status taxonomy is different. Free string with optional `statusOptions` for ergonomics.
- **`createContext` per concern** (separate context for color, edit, permissions). Rejected — three providers is more code than one merged context. Single context, one provider.
- **Render props for the card body.** Considered for "consumer wants to inject custom rows between description and time-info." Rejected for v0.1 — the use case is hypothetical; slot props for individual field renderers in v0.2 cover the real cases without opening a render-props surface.
- **Controlled-mode `value` + `onChange` prop pair.** Considered, rejected. Uncontrolled + ref handle matches rich-card and workspace patterns and dodges the controlled-mode-wrapper-three-defenses footgun documented in project memory.
- **Embedding `rich-card`'s sub-components for the field renderers.** Rejected per the top-of-description deviation: todo-rich-card builds its own fixed-schema renderers; rich-card's renderers are arbitrary-JSON and don't model our fields.

---

## 17. Plan-stage open questions

The description sealed the *what*. These are *how* questions the plan needs your call on before scaffolding.

| # | Question | Recommendation | Why |
|---|---|---|---|
| Q-P1 | **Single React context vs. pure prop drilling?** | **Single context.** | Six values must flow to every card (now, ramp, permissions, dispatch, edit state, color tick). Drilling six props per recursion level is noise. Rich-card got away with prop-drilling because v0.1 was view-only — todo-rich-card needs dispatch + edit state at every level. Memoized context is the cleaner pattern. |
| Q-P2 | **Add `lib/` directory** for pure helpers, deviating from §5 anatomy that lists only `parts/` and `hooks/`? | **Yes — add `lib/`.** | Same justification as rich-card and workspace: color engine + permissions + json-io + normalize are pure non-React algorithms that benefit from being testable in isolation when Vitest lands. The `hooks/` folder is the wrong home for non-React code. |
| Q-P3 | **Secondary popup access when `editable=true`:** small inline "open in dialog" affordance next to the toggle, or long-press / right-click only? | **Small inline icon next to the toggle.** | Long-press is unergonomic on desktop and unreliable on touch. Right-click conflicts with browser context menu. A small `<Dialog>` icon next to the edit toggle (visible only when `editable=true`) is discoverable and consistent across input methods. |
| Q-P4 | **Add `statusOptions?: Array<{ value; label; variant? }>` to the public props?** This is a plan refinement over the description's API sketch. | **Yes — add it.** | Without it, status edit is a free `<Input>` (no validation, no constraint, no visual variants). With it, consumers get a `<Select>` in edit modes + colored badges in view mode. Additive, non-breaking. Adds one prop to the surface. |
| Q-P5 | **Test-runner stance.** Same question as rich-card and workspace plans. | **Ship with test-debt note.** | Pure `lib/` modules (color engine, ramp, permissions, normalize, json-io) are testable when Vitest lands. Round-trip property tests + color-engine math tests are the highest priorities. Blocking on test-runner adoption delays v0.1 indefinitely. |
| Q-P6 | **Kanban adapter location** — does `todoRichCardKanbanRenderer` live in this procomp (e.g., `parts/kanban-adapter.tsx` + exported from `index.ts`) or in the future `todo-list` procomp's kanban variant? | **In this procomp.** | Keeping the adapter alongside the card it adapts means consumers using `kanban-board-01` directly (without `todo-list`) get a one-stop install. Adds one file + one export. todo-list's kanban variant imports this adapter rather than rebuilding it. |
| Q-P7 | **First-paint border color (SSR)** — render with no border color until layout effect, or render with computed color from props-derived `now()` (accepting hydration mismatch)? | **No border color on first paint; apply in `useLayoutEffect`.** | Hydration mismatches are loud (React logs warnings) and can break analytics. Suppressing the border color for one frame is a small visual blip — consumers wanting perfect SSR pass a frozen `now`. Documented in usage. |

---

## 18. Definition of "done" for THIS document (stage gate)

Before any code or scaffolding:

- [ ] User reads §1–§16 (the locked plan) and §17 (plan-stage Qs).
- [ ] Each Q-P1 through Q-P7 has either an "agreed" or override answer.
- [x] User explicitly says **"plan approved"** (or equivalent) — this unlocks Stage 3 (implementation). Signed off 2026-05-20.

After sign-off, the next session starts with:

1. **Verify shadcn primitive sync** — `pnpm dlx shadcn@latest add` for any primitive that's drifted from the F-cross-13 producer/consumer divergence (defensive check; should be no-op given §12 audit).
2. **Open a STATUS.md note** recording the test-debt for `todo-rich-card`.
3. `pnpm new:component data/todo-rich-card` — scaffold the folder.
4. **Implement against this plan, file by file. Suggested order:**
   1. `types.ts` — lock the public surface from §2 (including refinements: `now`, `statusOptions`, `showEditButton` rename, etc.).
   2. `lib/time.ts`, `lib/normalize.ts` — small pure helpers.
   3. `lib/ramp.ts`, `lib/color-engine.ts` — color engine + OKLCH ramp; verify endpoints render correctly in isolation via a one-off `<div style={{ background: applyRamp('default', 0.5) }}>` smoke.
   4. `lib/permissions.ts` — pure resolver.
   5. `lib/json-io.ts` — serialize / parse / validate / clipboard helpers; round-trip-verify by passing dummy data through.
   6. `lib/reducer.ts` — state machine.
   7. `parts/status-badge.tsx`, `parts/person-chip.tsx`, `parts/link-chip.tsx`, `parts/image-strip.tsx`, `parts/time-info.tsx` — leaf renderers (independent).
   8. `parts/card-header.tsx`, `parts/card-body.tsx`, `parts/action-menu.tsx`.
   9. `parts/edit-inline.tsx`, `parts/edit-popup.tsx`.
   10. `parts/card.tsx` — recursive card shell.
   11. `hooks/use-color-engine.ts`, `hooks/use-card-state.ts`, `hooks/use-keyboard.ts`.
   12. `todo-rich-card.tsx` — root, context provider, `forwardRef` + `useImperativeHandle`.
   13. `dummy-data.ts` — four demo items per §4.
   14. `demo.tsx`.
   15. `usage.tsx`.
   16. `meta.ts`.
   17. `index.ts`.
5. **Kanban adapter** (per Q-P6): add `parts/kanban-adapter.tsx` + named export in `index.ts`. Verify it registers cleanly with `kanban-board-01`'s `<KanbanBoard renderers={[todoRichCardKanbanRenderer]} />` in a smoke harness or demo.
6. **Run the verification checklist** from `docs/component-guide.md` §13.
7. **F-cross-11 path-b consumer-tsc smoke** — install via `pnpm dlx shadcn add @ilinxa/todo-rich-card` in a tmp consumer; run `pnpm tsc --noEmit`.
8. **Author the guide doc** (`todo-rich-card-procomp-guide.md`) alongside implementation — consumer-facing usage notes, gotchas, the SSR caveat.
9. **Run GATE 3 spot-check review** per `.claude/rules/component-readiness-review.md`. Pick rotating dimension (recommended: **Public API** given F-cross-12 lessons + the surface size).
10. **Update `.claude/STATUS.md`** with the new component entry + decision file.
11. **Add to `registry.json`** (base + fixtures items) + push. Vercel auto-deploys.

If at any point during implementation a plan decision turns out wrong, **stop, document the issue, ask before deviating**. The plan is the contract; deviations are loud, not silent.
