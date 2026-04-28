# `rich-card` v0.3 — Pro-component Plan (Stage 2 revision)

> **Stage:** 2 of 3 · **Phase:** v0.3 (movement + permissions + bulk + custom keys + virtualization + meta) · **Status:** Draft — awaiting sign-off
> **Slug:** `rich-card` · **Category:** `data`
> **Inputs:**
> - [Description (Stage 1)](rich-card-procomp-description.md) — all 16 Q-decisions inherited
> - [v0.1 plan](rich-card-procomp-plan.md) — viewer architecture inherited
> - [v0.2 plan](rich-card-procomp-plan-v0.2.md) — editor architecture inherited
> - [v0.2 guide](rich-card-procomp-guide.md) — public surface as of v0.2
> - **Six scope calls confirmed by user (2026-04-28):** one v0.3 release, `@dnd-kit/core` + `@dnd-kit/sortable`, declarative permissions + predicate escape-hatch, mount-only custom-key registration, opt-in `virtualize` flag, inline meta editing.
> - **Late addition (2026-04-28):** native data-model search bundled into v0.3. Solves the `Ctrl+F`-on-virtualized-tree limitation AND adds capabilities the browser can't (search collapsed subtrees, search meta, search by field type, search by predefined key, jump-to-match with auto-expand of collapsed ancestors).
> **Scope of this plan:** v0.3 only. v0.4 and v0.5 each get their own plan revision.

This doc locks **how** v0.3 extends what v0.2 shipped. After sign-off, no scaffolding-time second-guessing — implementation follows the plan, deviations are loud.

---

## 1. Inherited inputs (one paragraph)

v0.1 shipped the viewer; v0.2 shipped the inline editor with click-to-edit, granular events, dirty tracking, and click-driven single-select. v0.3 extends with: **(a)** drag-drop reordering via `@dnd-kit` with two scopes (same-level reorder, cross-level reparent) and full keyboard alternative; **(b)** bulk multi-select via shift-click range + cmd-click toggle, with cut / duplicate / delete-subtree operations; **(c)** a per-level / per-card / per-predefined-key **permission matrix** with declarative shorthand + predicate escape-hatches; **(d)** **custom predefined-key registration** at mount via a `customPredefinedKeys` prop; **(e)** **opt-in virtualization** for trees > 500 nodes via `virtualize: boolean`; **(f)** inline **meta editing** (click any meta value in popover / inline mode → swap to input); **(g)** **root-removal opt-in** via `allowRootRemoval` + `onRootRemoved` callback; **(h)** **promote-on-delete** option closing the v0.2 description Q17 deviation; **(i)** programmatic `setSelection()` / `focusCard()` on the imperative handle; **(j)** **native data-model search** — searches the JSON tree directly (not the DOM), so it finds matches in collapsed subtrees, virtualized off-screen cards, and meta entries. Auto-expands the path to each match. Works regardless of `virtualize` setting. **Out of v0.3 (deferred):** validation hooks (sync + async), undo/redo, will-change/did-change event split, markdown adapter.

---

## 2. v0.3 scope summary (one paragraph)

This is the biggest delta in rich-card's lifecycle. Six features arriving at once: drag-drop, bulk, permissions, custom keys, virtualization, native search. Plus deferred v0.2 cleanup (meta editing, promote, root-delete, programmatic selection). The component grows from "single-card editor" to "production-grade structural-content editor with multi-user-friendly editing AND find-anything search." All v0.1 + v0.2 props are preserved unchanged (with one intentional `onSelectionChange` signature break); v0.3 only adds. Two new npm deps land (`@dnd-kit/core` + `@dnd-kit/sortable`) plus an optional one (`@tanstack/react-virtual`, only loaded when `virtualize={true}`). Native search is **zero new deps** — pure tree-walk over the data model. File count grows from 36 → 51.

---

## 3. Architecture additions

### 3.1 DndContext at the root

[`rich-card.tsx`](../../../src/registry/components/data/rich-card/rich-card.tsx) wraps its tree in `<DndContext>` from `@dnd-kit/core` when `editable={true}` and any DnD scope is allowed. The context provides:
- Sensors: pointer + keyboard
- Collision detection: custom (closest-corners + edge-aware for same-level reorder vs cross-level reparent)
- Event handlers: `onDragStart`, `onDragOver` (for live preview), `onDragEnd` (commits via reducer)

Each `<Card>` registers as a sortable item via `useSortable({ id: tree.id })`. The drag handle is rendered as a small grip icon in the card header (visible in edit mode).

When `editable={false}`, `<DndContext>` is not rendered — zero overhead for viewer mode.

### 3.2 Reducer extension

[`lib/reducer.ts`](../../../src/registry/components/data/rich-card/lib/reducer.ts) gains 9 new actions and 2 new state slots:

```ts
type RichCardStateV3 = RichCardStateV2 & {
  selectedIds: ReadonlySet<string>;          // multi-select (replaces single selectedId for v0.3)
  draggingId: string | null;                  // transient: during a drag
};

type ActionV3 =
  | ActionV2
  // Movement
  | { type: "card-move"; cardId: string; newParentId: string; newOrder: number }
  // Bulk
  | { type: "card-duplicate"; cardId: string }
  | { type: "bulk-remove"; cardIds: readonly string[] }
  | { type: "set-multi-selection"; ids: readonly string[] }
  | { type: "toggle-selection"; id: string }
  // Drag transient
  | { type: "drag-start"; cardId: string }
  | { type: "drag-end" }
  // Meta (deferred from v0.2)
  | { type: "meta-edit"; cardId: string; key: string; value: FlatFieldValue; valueType: FlatFieldType }
  | { type: "meta-add"; cardId: string; key: string; value: FlatFieldValue; valueType: FlatFieldType }
  | { type: "meta-remove"; cardId: string; key: string };
```

`set-multi-selection` replaces v0.2's `set-selection` (single is treated as a Set of size 0 or 1). Backward-compatible: when only one id is selected, the existing single-selection semantics hold.

`card-move` handles both reorder (within same parent) and reparent (different parent). Reducer detects which by comparing old vs new parentId.

`card-duplicate` creates a deep copy with fresh `__rcid`s throughout the subtree, lands the duplicate at `original.order + 0.5` (re-normalized after).

`bulk-remove` removes multiple cards atomically. Order matters: deepest-first so we don't remove an ancestor before its descendants.

### 3.3 Permission system

New file [`lib/permissions.ts`](../../../src/registry/components/data/rich-card/lib/permissions.ts) — pure resolver. The host can specify permissions at three scopes:

```ts
export type PermissionRule = {
  edit?: boolean;        // can change values, rename keys, edit predefined content
  add?: boolean;         // can add fields, predefined entries, child cards
  remove?: boolean;      // can remove fields, predefined entries, cards
  reorder?: boolean;     // can drag (same-level)
  reparent?: boolean;    // can drag (cross-level)
};

export type RichCardPermissions = {
  default?: PermissionRule;                                   // baseline (when editable=true)
  byLevel?: Record<number, PermissionRule>;                   // per-level override
  byCard?: Record<string, PermissionRule>;                    // per-card override (key = __rcid)
  byPredefinedKey?: Partial<Record<PredefinedKey, PermissionRule>>;  // per-key override
};
```

Resolved per (action, cardId, target) tuple via:

```
resolved = layer(
  global editable,
  permissions.default,
  permissions.byLevel[card.level],
  permissions.byCard[cardId],
  permissions.byPredefinedKey[predefinedKey]?,
  predicate predicates (canEditField, canAddCard, etc.)
)
```

Predicate predicates run last and can override any declarative rule (developer ultimate authority).

Per-card lock-via-meta is also supported: if `__rcmeta.locked === true`, the card and all descendants are forced read-only regardless of other permissions. This is the description's "card-level lock via meta" mechanism.

### 3.4 Custom predefined-key registration

Hosts pass a `customPredefinedKeys` prop at mount:

```ts
type CustomPredefinedKey = {
  key: string;                                                 // unique name
  validate: (value: unknown) => ValidationResult;              // shape check
  render: (value: unknown, ctx: CustomKeyContext) => ReactNode; // view component
  edit?: (value: unknown, onSave: (v: unknown) => void, onCancel: () => void) => ReactNode; // edit component (optional; falls back to JSON-textarea)
  defaultValue: () => unknown;                                  // initial shape on add
};
```

Custom keys merge with the closed v0.1 catalog (`codearea`, `image`, etc.). Conflicts (custom key with the same name as a built-in) are rejected at mount with a console error.

Validation reuses the existing v0.2 sync-validation pipeline. Custom-key entries render via the supplied `render`; if `edit` is omitted, fall back to a generic JSON-textarea editor.

### 3.5 Virtualization (opt-in)

`virtualize?: boolean` (default `false`). When `true`, the rendering mode shifts:

**Default (nested) mode** — current v0.1+v0.2 rendering:
```html
<ul role="tree">
  <li role="treeitem" aria-level=1>
    <ul role="group">
      <li role="treeitem" aria-level=2>...</li>
    </ul>
  </li>
</ul>
```

**Virtualized (flat) mode** — when `virtualize={true}`:
```html
<ul role="tree" style="height: 5000px">
  <!-- only ~30 visible cards rendered at once -->
  <li role="treeitem" aria-level=1 style="position: absolute; top: 0">...</li>
  <li role="treeitem" aria-level=2 style="position: absolute; top: 60">...</li>
  ...
</ul>
```

Visible cards are flattened to a list via `visibleIdsInOrder()` (already exists from v0.1). Each card's `aria-level` provides hierarchy info; CSS indentation derives from level.

`@tanstack/react-virtual` handles the windowing. Loaded dynamically only when `virtualize={true}` so the dep doesn't bloat viewer-only consumers.

**Trade-offs**: virtualized mode breaks `Ctrl+F` browser find within the tree (only visible items are in DOM) and may interfere with screen-reader tree-walking for some readers. Console.warn on enable. Documented in the guide.

### 3.6 Bulk multi-select

Click on a card without modifiers → single select (replaces selection).
Shift-click → range select (from anchor to clicked, inclusive, in visible-traversal order).
Cmd/Ctrl-click → toggle inclusion.

Bulk operations run on `state.selectedIds`:
- `Delete` key → `bulk-remove`
- `Cmd/Ctrl + D` → bulk duplicate (loops `card-duplicate` per selected, in order)
- `Cmd/Ctrl + X` → cut to clipboard (clipboard is internal, since browser clipboard can't hold tree subtrees safely)
- `Cmd/Ctrl + V` → paste subtree under the focused card

A `<BulkToolbar>` appears when ≥ 2 cards are selected — shows count + action buttons.

### 3.7 Drag-drop scopes

```ts
type DndScopes = {
  sameLevel?: boolean;     // reorder among siblings (default true when editable)
  crossLevel?: boolean;    // reparent to a different card (default true when editable)
};
```

`dndScopes={{ sameLevel: true, crossLevel: false }}` allows reorder but not reparent (per locked Q7).

Permissions per-scope: a card with `permissions.byCard[id].reorder = false` cannot be dragged at all; `permissions.byCard[id].reparent = false` can be dragged but only to same-parent positions.

### 3.8 Meta editing

Click any meta value in the popover (or inline strip when `metaPresentation="inline"`) → input swap, same v0.2 inline-editor pattern. New "+ meta" button inside the popover for adding entries. Hover-× on each meta entry for removal.

Meta keys can collide neither with existing meta keys on the same card (sibling collision) nor with reserved keys. Meta-key validation reuses validate-edit's key-collision logic with a meta-scoped variant.

### 3.9 Root removal

```tsx
<RichCard
  defaultValue={data}
  editable
  allowRootRemoval
  onRootRemoved={(state) => {
    // host returns the new root or null (renders empty-tree placeholder)
    return state.children[0] ?? null;
  }}
/>
```

When the user triggers root remove (via "..." menu, now enabled when `allowRootRemoval={true}`), the consumer's `onRootRemoved` is called with the current state's children + meta. Consumer returns the new root or null. If null, an empty-tree placeholder renders ("Tree is empty. + Add card to start.") with a single "+ root card" button.

### 3.10 Promote-on-delete

`defaultDeletePolicy?: 'cascade' | 'promote'` (default `'cascade'`). When `'promote'`, removing a card promotes its children to the deleted card's parent. Per-deletion override: shift-click on any × button (or pick from the actions menu) flips the policy for that one delete.

Collision resolution: if a promoted child's `parentKey` collides with a sibling at the new level, append `_2`, `_3`, etc. Documented; flagged Q-P9 below for rule confirmation.

### 3.11 Imperative handle additions

```ts
type RichCardHandleV3 = RichCardHandleV2 & {
  setSelection(ids: readonly string[] | string | null): void;  // accepts single or array
  focusCard(id: string): void;
  addCardAt(parentId: string, position?: number): string;       // returns new card id
  removeCard(id: string): void;
  // Search
  findNext(): SearchMatch | null;
  findPrevious(): SearchMatch | null;
  scrollToMatch(match: SearchMatch): void;
  clearSearch(): void;
};
```

`setSelection` accepts a single id (single-select), an array (multi-select), or null (clear). `focusCard` sets keyboard focus to a card. `addCardAt` and `removeCard` are programmatic equivalents of the user actions, useful for host-driven edits. `findNext` / `findPrevious` / `scrollToMatch` / `clearSearch` drive the native search system (§11).

### 3.12 Native search (data-model walk)

A pure search function in [`lib/search.ts`](../../../src/registry/components/data/rich-card/lib/search.ts) walks `RichCardTree` and returns a `SearchResult`. The host owns the search query (controlled): pass `search={{ query: "OKLCH" }}` and the component re-runs the walk on every render where the search props change.

**No DOM dependence.** The walk operates on the parsed `RichCardTree`, so:
- Collapsed subtrees → searched
- Virtualized off-screen cards → searched
- Meta entries (hidden by default) → searched
- Field keys, field values, predefined-key payloads, card titles (`parentKey`) → all searched

**Match types:** `'title' | 'field-key' | 'field-value' | 'predefined' | 'meta-key' | 'meta-value'`.

**Auto-expand:** when search results change, the reducer dispatches a synthetic `expand-path-to-matches` action that removes from `state.collapsed` every ancestor of every matched card. User-driven collapse state is preserved separately (so clearing the search restores the user's prior collapse state).

**Highlighting:** matched text in rendered cards is wrapped in `<MatchHighlight>` (a small part) which renders a `<mark>` element scoped to the matched range. Active match (the one navigated to via `findNext`) gets distinct styling.

**Search state lives in the reducer** so it survives re-renders and integrates with collapse / focus / selection consistently. Three new actions: `set-search-query`, `set-active-match-index`, `clear-search`.

---

## 4. Final API delta (v0.3)

```ts
type RichCardPropsV3 = RichCardPropsV2 & {
  // DnD
  dndScopes?: { sameLevel?: boolean; crossLevel?: boolean };

  // Permissions
  permissions?: RichCardPermissions;
  canEditField?: (cardId: string, key: string) => boolean;
  canAddField?: (cardId: string) => boolean;
  canRemoveField?: (cardId: string, key: string) => boolean;
  canEditCard?: (cardId: string) => boolean;
  canAddCard?: (parentId: string) => boolean;
  canRemoveCard?: (cardId: string) => boolean;
  canEditPredefined?: (cardId: string, key: PredefinedKey | string) => boolean;
  canAddPredefined?: (cardId: string, key: PredefinedKey | string) => boolean;
  canRemovePredefined?: (cardId: string, key: PredefinedKey | string) => boolean;
  canDragCard?: (cardId: string) => boolean;
  canDropCard?: (cardId: string, targetParentId: string) => boolean;

  // Custom predefined keys
  customPredefinedKeys?: CustomPredefinedKey[];

  // Performance
  virtualize?: boolean;

  // Root removal + delete policy
  allowRootRemoval?: boolean;
  onRootRemoved?: (current: RichCardJsonNode) => RichCardJsonNode | null;
  defaultDeletePolicy?: "cascade" | "promote";

  // Multi-select handler (replaces v0.2's single-id onSelectionChange)
  onSelectionChange?: (ids: readonly string[]) => void;     // breaking shape change — see §15

  // New events
  onCardMoved?: (event: CardMovedEvent) => void;
  onCardDuplicated?: (event: CardDuplicatedEvent) => void;
  onMetaChanged?: (event: MetaChangedEvent) => void;
  onMetaAdded?: (event: MetaAddedEvent) => void;
  onMetaRemoved?: (event: MetaRemovedEvent) => void;

  // Native search (controlled by host)
  search?: SearchOptions;
  onSearchResults?: (result: SearchResult) => void;
};

type RichCardHandleV3 = RichCardHandleV2 & {
  setSelection(ids: readonly string[] | string | null): void;
  focusCard(id: string): void;
  addCardAt(parentId: string, position?: number): string;
  removeCard(id: string): void;
  // Search
  findNext(): SearchMatch | null;
  findPrevious(): SearchMatch | null;
  scrollToMatch(match: SearchMatch): void;
  clearSearch(): void;
};
```

New event types (5):

```ts
export type CardMovedEvent = {
  cardId: string;
  oldParentId: string;
  newParentId: string;
  oldOrder: number;
  newOrder: number;
};

export type CardDuplicatedEvent = {
  sourceCardId: string;
  newCardId: string;
  parentId: string;
};

export type MetaChangedEvent = {
  cardId: string;
  key: string;
  oldValue: FlatFieldValue;
  newValue: FlatFieldValue;
};

export type MetaAddedEvent = {
  cardId: string;
  key: string;
  value: FlatFieldValue;
};

export type MetaRemovedEvent = {
  cardId: string;
  key: string;
  oldValue: FlatFieldValue;
};

// Native search
export type SearchOptions = {
  query: string;
  caseSensitive?: boolean;       // default false
  matchTitles?: boolean;         // default true — search card parentKey
  matchKeys?: boolean;           // default true — search field keys
  matchValues?: boolean;         // default true — search field values
  matchPredefined?: boolean;     // default true — search predefined-key content
  matchMeta?: boolean;           // default true — search meta keys + values (even when metaPresentation='hidden')
};

export type SearchMatchType =
  | "title"
  | "field-key"
  | "field-value"
  | "predefined"
  | "meta-key"
  | "meta-value";

export type SearchMatch = {
  cardId: string;
  matchType: SearchMatchType;
  fieldKey?: string;             // the field/meta/predefined key the match is in
  excerpt: string;               // ~80 chars of context around the match
  start: number;                 // offset within excerpt where the match starts
  length: number;                // length of the matched span
};

export type SearchResult = {
  matches: SearchMatch[];
  matchedCardIds: ReadonlySet<string>;
  activeIndex: number | null;    // index into matches[] of the currently-focused match
};
```

⚠ **Breaking change in `onSelectionChange`:** v0.2 fired `(id: string | null)`. v0.3 fires `(ids: readonly string[])` to support multi-select. Consumers using v0.2's signature will need to adapt. Migration: `onSelectionChange={(ids) => setSelected(ids[0] ?? null)}`.

This is the **only** intentional v0.2 → v0.3 breaking change. Flagged Q-P10 below — alternative is to keep v0.2's single-id signature and add a separate `onMultiSelectionChange`.

**Counts:**
- **Types:** v0.2 had 21 public types. v0.3 adds 5 event types + `RichCardPermissions` + `PermissionRule` + `DndScopes` + `CustomPredefinedKey` + `CustomKeyContext` + `SearchOptions` + `SearchMatch` + `SearchMatchType` + `SearchResult` = 14 new → **35 public types total**.
- **Props:** v0.2 had 21 optional. v0.3 adds: 1 `dndScopes` + 1 `permissions` + 11 predicate predicates + 1 `customPredefinedKeys` + 1 `virtualize` + 1 `allowRootRemoval` + 1 `onRootRemoved` + 1 `defaultDeletePolicy` + 5 new event handlers + 1 `search` + 1 `onSearchResults` = **25 new optional, 46 total**. Major surface expansion. Justified — v0.3 IS a permission/movement/search layer; props are the natural API.

---

## 5. File additions and modifications

### 5.1 New files (15)

```
src/registry/components/data/rich-card/
├── parts/
│   ├── drag-handle.tsx           ← visible drag affordance in card header (edit mode only)
│   ├── drop-indicator.tsx        ← visual feedback during drag (between-siblings line, into-card highlight)
│   ├── bulk-toolbar.tsx          ← floating toolbar when ≥2 cards selected (count + duplicate / cut / delete)
│   ├── meta-edit.tsx             ← inline meta editor (replaces popover content in edit mode)
│   ├── search-bar.tsx            ← optional default search input (host can skip and wire its own)
│   └── match-highlight.tsx       ← wraps matched text in <mark>; honors active-match styling
├── hooks/
│   ├── use-bulk-selection.ts     ← multi-select state + range / toggle helpers
│   ├── use-permissions.ts        ← bound resolver based on props + state
│   ├── use-dnd-config.ts         ← @dnd-kit sensor + collision config
│   ├── use-virtualizer.ts        ← @tanstack/react-virtual wrapper, dynamic-loaded
│   └── use-search.ts             ← drives the search query → result pipeline; dispatches expand-path-to-matches
└── lib/
    ├── permissions.ts            ← pure permission resolver
    ├── dnd-helpers.ts            ← collision math, position resolution, parent-key generation for moved cards
    ├── bulk-actions.ts           ← deep-clone for duplicate, delete-deepest-first ordering
    └── search.ts                 ← pure tree-walking matcher; returns SearchResult
```

Total: **6 parts + 5 hooks + 4 lib = 15 new files.**

### 5.2 Modified files (12)

| File | Changes |
|---|---|
| [`types.ts`](../../../src/registry/components/data/rich-card/types.ts) | Add 5 event types, 4 search types, `RichCardPermissions`, `PermissionRule`, `DndScopes`, `CustomPredefinedKey`, expanded `RichCardProps` + `RichCardHandle` |
| [`lib/reducer.ts`](../../../src/registry/components/data/rich-card/lib/reducer.ts) | Add 9 movement/bulk/meta actions + 3 search actions, multi-select state, drag-transient state, search state |
| [`lib/validate-edit.ts`](../../../src/registry/components/data/rich-card/lib/validate-edit.ts) | Add `validateMetaEdit`, `validateMetaAdd`, `validateCardMove` |
| [`parts/card.tsx`](../../../src/registry/components/data/rich-card/parts/card.tsx) | Wrap in `useSortable`; render drag handle; multi-select click handlers; permission gates on add/remove buttons; wrap rendered text in `<MatchHighlight>` |
| [`parts/card-header.tsx`](../../../src/registry/components/data/rich-card/parts/card-header.tsx) | Render `<DragHandle>` in edit mode; wrap title in `<MatchHighlight>` |
| [`parts/field-row.tsx`](../../../src/registry/components/data/rich-card/parts/field-row.tsx) | Wrap field key + value renders in `<MatchHighlight>` |
| [`parts/card-actions.tsx`](../../../src/registry/components/data/rich-card/parts/card-actions.tsx) | Add cascade/promote picker; "Duplicate" entry; root-removal flag handling |
| [`parts/meta-popover.tsx`](../../../src/registry/components/data/rich-card/parts/meta-popover.tsx) | Edit-mode integration — switch to `<MetaEdit>` content when in edit mode; wrap meta key/value renders in `<MatchHighlight>` |
| [`parts/meta-inline.tsx`](../../../src/registry/components/data/rich-card/parts/meta-inline.tsx) | Click-to-edit on inline meta values; wrap in `<MatchHighlight>` |
| [`parts/predefined-codearea.tsx` / `predefined-quote.tsx` / `predefined-list.tsx` / `predefined-table.tsx` / `predefined-image.tsx`](../../../src/registry/components/data/rich-card/parts/) | Wrap displayed strings in `<MatchHighlight>` for search-result rendering |
| [`rich-card.tsx`](../../../src/registry/components/data/rich-card/rich-card.tsx) | Mount `<DndContext>` (when editable + any DnD scope on); virtualization integration; search hook integration; handlers for drag-end, bulk ops; multi-select state management; expanded imperative handle |
| [`demo.tsx`](../../../src/registry/components/data/rich-card/demo.tsx) | Add multi-select demo, drag-drop demo, permission demo, search demo (toggles for each) |

### 5.3 Updated counts

- v0.2: 36 files
- v0.3 additions: 15 new files
- v0.3 total: **51 files**

About 1.4× v0.2's footprint. Comparable to v0.2's growth rate.

---

## 6. Drag-drop interaction model

### 6.1 Affordances

- **Drag handle** in card header (edit mode only) — small grip icon; `cursor: grab`; `cursor: grabbing` during drag
- **Drop indicators**:
  - **Same-level (between siblings)**: thin horizontal line at the drop position
  - **Cross-level (into a card body)**: subtle outline highlight on the target card
- **Live preview**: dragged card follows cursor with reduced opacity

### 6.2 Drop zones

- **Between two siblings** at any level → same-level reorder
- **Onto a card's body** (not its drag handle) → cross-level reparent to that card as last child
- **Onto a card's children area** (the empty space below children) → cross-level reparent as last child
- **Onto own descendants** → blocked (prevents cycles); shows red disallowed cursor

### 6.3 Collision detection

Custom collision detector via `@dnd-kit`:
1. Closest-corners against all visible card rectangles
2. If pointer is in the upper or lower 25% of a card → **same-level reorder** target (insert above or below)
3. Else (pointer in middle 50% of card) → **cross-level reparent** target (drop into card)
4. Cycle check: if target is the dragged card or its descendant → reject

### 6.4 Keyboard alternative

Built into `@dnd-kit/core`:
- `Space` on focused card → enter drag mode
- `Arrow keys` → move drop position (up/down for same-level; right for descend, left for ascend)
- `Space` again → commit
- `Escape` → cancel

### 6.5 Permission gating

Drag is initiated only if `canDragCard(id)` (predicate or resolved from `permissions`) returns true.
Drop is allowed only if `canDropCard(id, newParentId)` returns true AND the action conforms to the active scopes (`sameLevel` or `crossLevel`).

---

## 7. Bulk operations

### 7.1 Selection interaction

| Gesture | Behavior |
|---|---|
| Click | Replace selection with the single clicked card |
| Shift+Click | Range select from anchor to clicked card (visible-traversal order) |
| Cmd/Ctrl+Click | Toggle clicked card in/out of selection |
| Click outside any card | Clear selection |
| Cmd/Ctrl+A | Select all visible cards |
| Escape | Clear selection |

### 7.2 Anchor card

The "anchor" for shift-click range is the most recently clicked-without-shift card. Tracked in `state` separately from the selection set.

### 7.3 Bulk actions

Available when ≥ 1 card selected (toolbar appears at ≥ 2):

- **Duplicate** (`Cmd/Ctrl+D`) — clone each selected card with fresh ids, land at `original.order + 0.5`
- **Cut** (`Cmd/Ctrl+X`) — store selected subtrees in internal clipboard; remove them
- **Paste** (`Cmd/Ctrl+V`) — insert clipboard subtrees as children of the focused card
- **Delete** (`Delete` key) — bulk-remove
- **Cancel selection** (`Escape`)

### 7.4 Bulk validation

Each selected card is validated independently against current permissions. If any fails, the whole bulk action is blocked and an error toast appears (or inline error per card?). Flagged Q-P11 below.

---

## 8. Permission system

### 8.1 Resolution order (most to least specific)

1. **Predicate function** (`canEditField`, etc.) — if defined, takes precedence
2. **Per-card meta lock** (`__rcmeta.locked === true`) — forces read-only
3. **Per-card override** (`permissions.byCard[id]`)
4. **Per-predefined-key override** (`permissions.byPredefinedKey[key]`)
5. **Per-level override** (`permissions.byLevel[level]`)
6. **Default** (`permissions.default`)
7. **Global `editable` prop** — if false, all permissions denied regardless of below

### 8.2 Permission combination

`PermissionRule` is non-merging — each layer fully overrides the previous for that axis. So if `permissions.default = { edit: true }` and `permissions.byCard['x'] = { edit: false }`, card `x` is locked for edit even though default allows.

### 8.3 Predicate signatures

All predicates receive (cardId, optional target). Return `true` to allow, `false` to deny. Sync only.

### 8.4 Visual feedback

Permission denials are **silent** in v0.3 — disabled buttons, no toast. Visible affordances simply don't appear (no "+ field" button if `canAddField(id) === false`). Documented in guide.

### 8.5 Locked cards

When `__rcmeta.locked === true`, the card has:
- No edit affordances
- No drag handle
- No add buttons
- No remove × buttons
- A subtle "lock" icon next to the title (lucide `Lock`, muted)
- Children are also locked recursively (cascade)

---

## 9. Custom predefined-key registration

### 9.1 Mount-only registration

```tsx
<RichCard
  defaultValue={data}
  editable
  customPredefinedKeys={[
    {
      key: "metric",
      validate: (v) => /* shape check */,
      render: (v, ctx) => <MyMetricBlock value={v} />,
      edit: (v, save, cancel) => <MyMetricEditor ... />,
      defaultValue: () => ({ value: 0, unit: "" }),
    },
  ]}
/>
```

### 9.2 Conflict resolution

- Custom key with same name as built-in (`codearea`, `image`, etc.) → error at mount, render fallback error tree
- Custom key with same name as another custom key → error at mount

### 9.3 Validation

`validate(value)` runs at parse time (via custom-key validator) and at edit commit (when user updates a custom-key entry). Falls back to "always valid" if not provided.

### 9.4 Default editor fallback

If `edit` is not supplied, falls back to a generic JSON-textarea editor (same as v0.2's `table` editor).

### 9.5 Render context

```ts
type CustomKeyContext = {
  cardId: string;
  level: number;
  isEditing: boolean;       // true when this entry is in edit mode
  className?: string;       // resolved per-key style
};
```

---

## 10. Virtualization

### 10.1 Rendering mode shift

When `virtualize={false}` (default): nested `<ul role="group">` children — current v0.1+v0.2 rendering. SSR-safe. `Ctrl+F` works. Best for trees ≤ 500 nodes.

When `virtualize={true}`: flat-list rendering with `position: absolute` + `aria-level` for hierarchy. Only ~30 cards rendered at any time (window-based). Trade-offs documented in §3.5.

### 10.2 Indentation in flat mode

Each card's left padding is computed from `aria-level`:
```css
.rcc-card[aria-level="1"] { padding-inline-start: 0; }
.rcc-card[aria-level="2"] { padding-inline-start: 0.5rem; }
.rcc-card[aria-level="3"] { padding-inline-start: 1rem; }
/* ... up to level 6+ */
```

### 10.3 Threshold warning

Console.warn when:
- `virtualize={false}` AND tree has > 500 nodes (suggest enabling)
- `virtualize={true}` AND tree has < 100 nodes (suggest disabling for better UX)

### 10.4 Dynamic loading

`@tanstack/react-virtual` is loaded via dynamic `import()` only when `virtualize={true}`. Bundle stays lean for the default case. Loading state during the dynamic-load is the nested rendering (graceful fallback).

---

## 10.5. Native search

### 10.5.1 Search is controlled by the host

The host owns the `query` string and other options:

```tsx
const [query, setQuery] = useState("");

<RichCard
  defaultValue={data}
  search={{ query, caseSensitive: false }}
  onSearchResults={(result) => console.log(`${result.matches.length} matches`)}
/>
```

When `search.query` changes, the component re-runs the pure tree walk and updates highlights / auto-expand. When `query === ""`, search is inactive (no highlights, no auto-expand override).

For consumers who want a built-in input UI, drop in `<RichCardSearchBar>` (in `parts/search-bar.tsx`) — exported as a sibling component:

```tsx
import { RichCard, RichCardSearchBar } from "@/registry/components/data/rich-card";

const [query, setQuery] = useState("");

<RichCardSearchBar value={query} onChange={setQuery} matchCount={result?.matches.length ?? 0} />
<RichCard defaultValue={data} search={{ query }} onSearchResults={setResult} />
```

The search bar is **opt-in** — wholly skippable. Hosts that already have search infrastructure (a global cmd-k palette, etc.) wire `setQuery` directly.

### 10.5.2 What gets searched

Per `SearchOptions` flags (all default `true`):

| Flag | Searches |
|---|---|
| `matchTitles` | Card `parentKey` (the title) |
| `matchKeys` | Field key names (`status`, `priority`, etc.) |
| `matchValues` | Flat-field values (string content; numeric/boolean/null stringified for matching) |
| `matchPredefined` | `codearea.content`, `image.alt`, `quote` text, `list` items, `table` headers + cells (and `codearea.format`) |
| `matchMeta` | Meta keys + meta values (regardless of `metaPresentation` setting) |

Custom predefined keys are searched via the `searchableText?: (value: unknown) => string[]` field in `CustomPredefinedKey` (deferred — v0.3 doesn't search custom keys; flagged Q-P15 below).

### 10.5.3 Match algorithm

```
search(tree, options) → SearchResult:
  matches = []
  walk(tree):
    for each searchable string in this card (per options):
      find all (caseSensitive ? indexOf : ci-indexOf) occurrences
      for each occurrence:
        push { cardId, matchType, fieldKey?, excerpt, start, length }
    for each child:
      walk(child)
  matchedCardIds = new Set(matches.map(m => m.cardId))
  return { matches, matchedCardIds, activeIndex: matches.length > 0 ? 0 : null }
```

The walk is O(n × s) where n = card count and s = total searchable string length per card. Cheap; runs synchronously on every search-prop change. For trees > 1000 nodes, debouncing the host-side input (typical 200ms) is sufficient.

### 10.5.4 Auto-expand path-to-match

When `result.matchedCardIds` changes:
- For each matched card id, walk up to the root collecting ancestor ids
- Reducer dispatches `expand-path-to-matches` with the ancestor set
- Reducer removes those ids from `state.collapsed` (additively — doesn't touch user-collapsed cards that aren't on a match path)

Critically, the user's manual collapse state is **preserved separately** in `state.userCollapsed` (a snapshot taken before search modifies `collapsed`). Clearing the search restores `state.collapsed = state.userCollapsed`. This way, expanding-for-search doesn't permanently lose the user's collapse layout.

### 10.5.5 Highlighting

`<MatchHighlight>` (in `parts/match-highlight.tsx`) takes a string and an optional list of `{ start, length }` ranges, splits the string into highlighted + non-highlighted spans, and renders matched ranges as `<mark className="rcc-search-match">`. The currently-active match (the one navigated to via `findNext`) gets `<mark className="rcc-search-match-active">` for distinct color.

Every render-text-from-data location in the tree (`<FieldRow>`, `<CardHeader>` title, all five predefined renderers, `<MetaInline>`, `<MetaPopover>`) wraps its rendered text in `<MatchHighlight>` with the relevant `SearchMatch[]` for that location. When no match is active, `<MatchHighlight>` is a transparent passthrough (zero overhead).

### 10.5.6 Navigation (`findNext` / `findPrevious`)

Imperative handle methods:

- `findNext()` → moves `activeIndex` forward by 1 (wraps to 0 at end); scrolls the active match's card into view; returns the active `SearchMatch` (or null if no matches)
- `findPrevious()` → reverse direction
- `scrollToMatch(match)` → scrolls a specific match into view (usable when host displays a "results list" outside the tree)
- `clearSearch()` → equivalent to setting `search={{ query: "" }}` plus restoring user-collapsed state

Default keyboard binding (when `<RichCardSearchBar>` is used): `F3` / `Shift+F3` for next/previous match. Cmd+G / Cmd+Shift+G also bound. Hosts wiring their own input handle their own bindings.

### 10.5.7 Search interacts with virtualization correctly

Because search walks the data model (not the DOM), virtualized off-screen cards are searched normally. Jump-to-match calls `scrollToMatch`, which:
- In nested mode: uses `el.scrollIntoView({ block: 'center' })` on the card's DOM node
- In virtualized mode: tells `@tanstack/react-virtual` to scroll to the card's index in the flat list, then scrolls the container into view

This means `Ctrl+F`-on-virtualized — the original gap that motivated this feature — is fully covered.

---

## 11. Meta editing

### 11.1 Inline pattern

Meta values are edited inline, same v0.2 click-to-edit pattern:
- `metaPresentation="popover"` mode: open popover → click any value → input swap
- `metaPresentation="inline"` mode: click any value in the strip → input swap
- `metaPresentation="hidden"` mode: meta is unreachable; v0.3 doesn't change this — to edit, switch to popover/inline first

### 11.2 Add / remove meta entries

In edit mode within the popover:
- "+ meta" button at the bottom → opens add-form (key + type + value, same as field-add)
- Hover-× on each meta entry → remove

Inline-mode meta editing also supports add (a "+" appears at the strip's end) and remove (× appears on hover per entry).

### 11.3 Meta validation

Reuses field validation rules adapted for meta keys:
- Reserved keys (`__rcid`, `__rcorder`, `__rcmeta`) NOT allowed
- Predefined-key names ARE allowed for meta (meta is a separate namespace)
- Sibling-meta-key collision rejected
- Meta values are scalars (string / number / boolean / null + ISO-8601 date subtype)

### 11.4 Special meta key: `locked`

`__rcmeta.locked` is a structurally significant meta entry — `true` flips the card and its descendants to read-only (per §8.5). The meta editor doesn't treat it specially in editing UX — users can edit/remove it like any other meta entry — but the resolved permissions update on commit.

---

## 12. Root-delete + promote-on-delete

### 12.1 Root removal flow

```tsx
<RichCard
  allowRootRemoval
  onRootRemoved={(current) => current.section1 ?? null}
/>
```

When user triggers root remove (now enabled in "..." menu when `allowRootRemoval={true}`):
1. Reducer dispatches `card-remove` for the root id
2. Component calls `onRootRemoved(currentTreeAsJsonNode)` if provided
3. If callback returns a `RichCardJsonNode` → that becomes the new root via `replace-tree`
4. If callback returns null → empty-tree state, render placeholder
5. If `allowRootRemoval={true}` but no `onRootRemoved` provided → console.error and refuse

### 12.2 Promote on remove

```tsx
<RichCard defaultDeletePolicy="promote" />
```

Sets the default for every card-remove. Per-deletion override:
- Shift-click on the × button → flip to the OTHER policy for this one delete
- "..." actions menu → "Remove (cascade)" / "Remove (promote)" sub-pick

### 12.3 Promote collision resolution

When promoted children collide with siblings at the new level:
- **Default rule:** suffix with `_2`, `_3`, etc. on the promoted child's `parentKey`
- **Alternative:** prefix with the deleted card's parentKey (e.g. `removed_x` becomes `removedCardName_x`)

Locked: **suffix `_2/_3/...`**. Simpler; predictable; matches file-system conventions. Flagged Q-P9 below for confirmation.

---

## 13. v0.3 change-event contract

All v0.2 events fire as before. Five new mutation events + 1 search event:

1. `onCardMoved` — fires after `card-move` action commits
2. `onCardDuplicated` — fires after `card-duplicate` action commits
3. `onMetaChanged` — fires after `meta-edit` commits
4. `onMetaAdded` — fires after `meta-add` commits
5. `onMetaRemoved` — fires after `meta-remove` commits
6. `onSearchResults` — fires whenever the search result set changes (debounce on the host side if needed)

Bulk operations fire **per-card events** + a single coarse `onChange(tree)` at the end. So bulk-removing 5 cards fires 5 `onCardRemoved` + 1 `onChange`.

`onSearchResults` is NOT a commit event — it fires from a `useEffect` reactive to the search props, never increments `version`, never affects `isDirty()`.

---

## 14. A11y deltas from v0.2

- **DnD**: `@dnd-kit` provides full keyboard alternative (Space to grab, Arrow to move, Space to drop, Escape to cancel) and screen-reader announcements out of the box. We supply custom announcement strings per scope (e.g. "Reordering within siblings — use up/down arrows").
- **Bulk select**: `aria-multiselectable="true"` on the tree root when `editable` and bulk allowed; `aria-selected` on each treeitem reflects multi-select inclusion. `aria-activedescendant` tracks the anchor card.
- **Locked cards**: `aria-readonly="true"` on the treeitem; lock icon has `aria-label="Locked"`.
- **Drop indicators**: `aria-live="polite"` region announces "Dropping at position 3 under 'Section 2'".
- **Virtualization**: when active, render-only-visible breaks ARIA tree's expectation that all items are present. We set `aria-rowcount` (full count) and `aria-rowindex` per card to compensate. Tested against NVDA + JAWS as part of v0.3 success criteria.
- **Meta edit announcement**: the popover gains `aria-label="Edit meta information"` when in edit mode.
- **Search**: the optional `<RichCardSearchBar>` exposes a native `<input type="search">` with `aria-label="Search cards"`. Match count fires into a `aria-live="polite"` region ("3 matches"). Matched text is wrapped in `<mark>` (semantic, screen-readers announce it). Active-match navigation also moves keyboard focus to the matched card so `aria-activedescendant` updates; screen readers re-announce the card's content on jump. When `query` is non-empty and there are zero matches, the live region announces "No matches found".

---

## 15. Edge cases (deltas from v0.2)

| Case | Behavior |
|---|---|
| Drag a card onto its own descendant | Cycle detected; drop rejected; cursor shows disallowed |
| Drag a card with sub-selected descendants | Drag operates on whole subtree (root + descendants); selection is preserved |
| Drag started while another editor is active | Editor commits/cancels first; drag begins after |
| Bulk-remove when one selected card is locked via meta | Locked card is skipped; others removed; warning logged |
| Bulk-remove the root card when others selected | Root skipped (still forbidden unless `allowRootRemoval`); others removed |
| Custom predefined-key name collides with built-in | Console.error at mount; render error tree |
| Custom predefined-key validator throws | Treated as "invalid"; entry dropped + warned |
| `virtualize={true}` mid-session toggle | Smooth transition between rendering modes; collapse / selection / focus state preserved |
| `virtualize={true}` with < 50 nodes | Console.warn (suggests disabling); component still works |
| `permissions.byCard` references a card that was removed | Permission lookup harmlessly returns undefined; default applies |
| `permissions` prop reference changes mid-session | Permissions re-resolve; visible affordances update |
| `customPredefinedKeys` prop reference changes mid-session | **Reference change ignored after mount**; remount via `key` to reload custom-key catalog |
| `onSelectionChange` v0.2 → v0.3 signature change | Breaking. v0.2 received `id: string \| null`; v0.3 receives `ids: readonly string[]`. Migration documented. |
| Multi-select then enter edit-mode on one card | Selection preserved; only the click target enters edit mode (other selected cards remain selected, can be hot-key-acted) |
| Drag during multi-select drags the WHOLE selection | Subtrees in the selection move together as a group; nested selections are deduplicated (descendants of selected ancestors are skipped) |
| Promote-on-delete with sibling-key collision | Suffix `_2`, `_3`, etc. (Q-P9) |
| Root removal without `onRootRemoved` callback | Console.error; remove action refused |
| Lock toggle (`__rcmeta.locked`) edited while card has open editors | All open editors close (no commit); permissions re-resolve |
| Search query while a tree edit is in progress | Search runs on every render against the current tree state; reflects edit-in-progress text in matches as the user types. Edit-mode persists. |
| Search active when user collapses a card | User-collapse takes priority — the card collapses even if a match is in its descendants. Match remains in `result.matches`; `findNext` jumps to it and re-expands the card automatically. |
| Search active when user removes a matched card | The match list updates on next render; if the removed card was the active match, `activeIndex` advances to the next match (or wraps to 0). |
| Search active when bulk-deleting matched cards | Same — matches re-walk on next render against the post-delete tree. |
| Empty `search.query` | Search inactive; user-collapsed state restored; `onSearchResults` NOT fired (would be misleading). |
| `search.query` matches everything | All paths auto-expand. Console.warn if matches > 100 (likely an unintended broad match). |
| Custom predefined-key search support (v0.3 doesn't search them) | Custom keys are skipped in the walk. Logged hint suggests using `searchableText` (deferred per Q-P15). |
| Active match scrolled out of viewport then user types more in search input | Active match preserved across query changes when still valid; otherwise resets to `activeIndex = 0`. |

---

## 16. Risks & alternatives

### Risks (carried + new)

| Risk | Mitigation |
|---|---|
| **Two new npm deps** (`@dnd-kit/core`, `@dnd-kit/sortable`) plus optional one (`@tanstack/react-virtual`) | Documented in `meta.ts`. `@dnd-kit` is the de-facto standard; alternative (HTML5 DnD + custom keyboard) is much more work for a worse result. |
| **Virtualization breaks Ctrl+F + screen-reader walk** | Opt-in (default off); console.warn on enable; documented in guide. |
| **Permission system complexity** | Pure resolver in `lib/permissions.ts`; comprehensive tests once Vitest lands (test-debt note already in STATUS). |
| **DnD perf in 500-node tree** | `@dnd-kit` uses CSS transforms during drag; only the dragged item re-renders. Verified perf budget. |
| **Breaking onSelectionChange signature** | Single intentional breaking change; documented in guide migration notes; alternatives explored in Q-P10. |
| **Custom predefined-keys can throw or render badly** | Validator + render wrapped in try/catch; failures degrade gracefully (entry dropped + warned, generic JSON fallback). |
| **Bulk operations on huge selections (e.g. 100 cards)** | Reducer handles in single pass (deepest-first ordering for removes); event firing is per-card so consumers see all changes. |
| **`__rcmeta.locked` interaction with edits in progress** | Edit-mode state cleared when permissions tighten via meta-locked toggle. |

### Alternatives considered, rejected

- **Build DnD from scratch** — 2+ weeks of work for an inferior a11y story. Rejected.
- **HTML5 DnD API** — touch-broken, weird drag-image, custom mobile fallback needed. Rejected.
- **Always-on virtualization** — breaks Ctrl+F for everyone, including small trees. Rejected.
- **Imperative-only permissions** (no declarative) — verbose for common cases. Rejected.
- **Declarative-only permissions** (no predicates) — escape-hatch needed for complex cases (e.g., "only edit fields owned by current user"). Rejected.
- **Per-action prop instead of multi-axis matrix** (`canEditL1Cards`, `canEditL2Cards`, ...) — combinatorial explosion. Rejected.
- **Multiple `metaPresentation` modes editable independently** — each mode reuses the inline pattern; no need to specialize. Rejected (kept unified inline).
- **Modal-based root-removal "what becomes new root" UX** — adds a new surface; consumer callback is simpler and more flexible. Rejected.
- **Auto-promote-first-child as root-removal default** — surprising; consumers may want a placeholder. Rejected (require explicit callback).

---

## 17. Plan-stage open questions

15 Q-Ps. None scope-shifting; all bounded UX or API calls.

| # | Question | Recommendation | Why |
|---|---|---|---|
| Q-P1 | **DnD library: `@dnd-kit` confirmed.** Confirming user's prior approval. | **Use `@dnd-kit/core` + `@dnd-kit/sortable`.** | Already approved in scope-call #2. Surfaced for completeness. |
| Q-P2 | **Cross-level drop visualization** — outline highlight on target card vs "between siblings" line near the target's edge? | **Outline highlight on target card.** Drop is "into this card as last child." The between-siblings line is reserved for same-level. | Less ambiguous; mirrors how outlines (Notion etc.) handle reparent drops. |
| Q-P3 | **Bulk-select visual feedback** — checkmarks on selected cards or just the existing `aria-selected` ring? | **Existing `aria-selected` ring + a small count badge** (e.g. "3 selected") in the bulk toolbar. No checkmarks. | Checkmarks add visual clutter. Ring + toolbar count is sufficient and matches v0.2's visual language. |
| Q-P4 | **Permission predicate signatures** — `canEditField(cardId, key)` or `canEdit(cardId, target: { kind, key })`? | **Per-action** (`canEditField`, `canAddField`, etc.). 11 predicates. | Each is type-narrow; consumers don't have to switch on `target.kind`. Verbose but readable. |
| Q-P5 | **Custom predefined-key validator interface** — return-shape: `boolean` or `ValidationResult`? | **`ValidationResult`** (matches v0.2's internal validators). | Lets custom keys surface specific errors via inline-error. Boolean would lose error-message granularity. |
| Q-P6 | **Virtualization rendering mode** — flat (with aria-level) or nested-aware (windowing per `<ul role="group">`)? | **Flat, with aria-level for hierarchy.** | `@tanstack/react-virtual` works on flat lists. Nested-aware windowing is much more complex and gains marginal a11y value (most screen readers handle aria-level fine). |
| Q-P7 | **Meta editing modes** — only popover, only inline-strip, or both? | **Both.** Popover gets full add/edit/remove; inline-strip supports click-to-edit values + shift-click to add. | Description framed meta-presentation as a per-mode UX choice; honoring all three. |
| Q-P8 | **`onRootRemoved` return shape** — `RichCardJsonNode | null` (consumer picks new root) or `'replace-with-empty' | RichCardJsonNode` enum? | **`RichCardJsonNode \| null`.** Null = empty tree placeholder. | Simpler. Consumers who want explicit empty-state behavior can return a synthetic empty card. |
| Q-P9 | **Promote-on-delete collision rule** — suffix `_2/_3/...` or fully-qualify (e.g. `removedCardName_x`)? | **Suffix `_2/_3/...`.** | Predictable; minimal renaming surface; consumers who want fully-qualified names can use a custom event handler to rewrite on `onCardMoved`. |
| Q-P10 | **`onSelectionChange` signature** — keep v0.2's `id: string \| null` and add separate `onMultiSelectionChange(ids)`, OR replace with `ids: readonly string[]` (v0.3 plan)? | ⚠ **Replace with `readonly string[]`** despite the breaking change. | A single source of truth for selection. Single-select consumers do `onSelectionChange={ids => setSelected(ids[0] ?? null)}` — 8-character migration. Two parallel handlers create ambiguity. |
| Q-P11 | **Bulk action validation** — block-all-on-any-failure or skip-failures-and-proceed? | **Skip failures and proceed** (with a console.warn listing the skipped ids). | Otherwise a single locked card in a 50-card selection blocks the bulk delete. Skip-and-warn is the predictable pattern (cf. macOS Finder behavior). |
| Q-P12 | **Custom predefined-keys nesting** — can a custom-key payload itself contain card-shaped data (i.e. nested card)? | **No** — custom keys are leaf blocks (like the built-ins). | Nested cards are siblings via the `child` route, not via predefined-key nesting. Keeps the data model coherent. v0.4+ may revisit. |
| Q-P13 | **Default search-bar UX** — ship `<RichCardSearchBar>` as a sibling export, or no built-in UI (host always wires its own input)? | **Ship as opt-in sibling export.** Hosts that want a quick search drop it in; hosts with their own UI just don't import it. | Saves the most common case (a few lines of host code) without forcing UI on hosts who already have search infrastructure. |
| Q-P14 | **Search keyboard shortcuts** — bind `Cmd+F` (intercept browser find), bind a non-conflicting key (`/`, `Cmd+K`), or no default binding (host wires)? | **Default: `F3` / `Shift+F3` for next/prev match. NO `Cmd+F` intercept.** Hosts can bind their own input. | Intercepting `Cmd+F` surprises users who expect browser find — even if our search is better, the muscle memory is sacred. `F3` is the long-standing "find next" convention across editors. Respects user expectations. |
| Q-P15 | **Custom predefined-key search support** in v0.3 — implement `searchableText?: (value: unknown) => string[]` on `CustomPredefinedKey` to let custom keys participate in search, or defer? | **Defer to v0.4.** Custom keys parse and render in v0.3 but skip search; logged hint suggests the API. | Adds API surface that's mostly unused in v0.3 (custom keys are themselves new). Better to see what real custom-key usage looks like before locking the search-integration shape. Hosts can still find custom-key cards by searching the card's `parentKey` or other fields on the same card. |

---

## 18. Definition of "done" for THIS document (stage gate)

Before any code or scaffolding:

- [ ] User reads §1–§16 and §17 (plan-stage Qs).
- [ ] Each Q-P1 through Q-P15 has either an "agreed" or override answer.
- [ ] User explicitly says **"plan approved"** — this unlocks Stage 3 (v0.3 implementation).

After sign-off, the next session starts with:

1. Update [STATUS.md](../../../.claude/STATUS.md): bump rich-card target version to 0.3.0; add v0.3 in-flight entry.
2. Install npm deps: `pnpm add @dnd-kit/core @dnd-kit/sortable @tanstack/react-virtual`.
3. Implement against this plan, file by file. Suggested order:
   1. **Types first** — extend `types.ts` with new event types, search types, `RichCardPermissions`, `PermissionRule`, `DndScopes`, `CustomPredefinedKey`, expanded handle.
   2. **Pure helpers** — `lib/permissions.ts`, `lib/dnd-helpers.ts`, `lib/bulk-actions.ts`, `lib/search.ts`.
   3. **Validation** — extend `lib/validate-edit.ts` with meta + card-move validators.
   4. **Reducer** — extend `lib/reducer.ts` with 9 movement/bulk/meta actions + 3 search actions + multi-select / drag-transient / search state slots. Hand-verify by walking dummy data through each.
   5. **Hooks** — `use-bulk-selection`, `use-permissions`, `use-dnd-config`, `use-virtualizer`, `use-search`.
   6. **Search parts** — `match-highlight.tsx` (used by every render-text-from-data part), `search-bar.tsx` (sibling export).
   7. **Edit parts** — `meta-edit.tsx` (used by popover + inline).
   8. **DnD parts** — `drag-handle`, `drop-indicator`.
   9. **Bulk parts** — `bulk-toolbar`.
   10. **Wire into existing parts** — wrap text-rendering locations in `<MatchHighlight>` (card-header title, field-row key+value, all 5 predefined renderers, meta-popover, meta-inline). Then card.tsx (sortable + bulk + perms), card-header (drag handle), card-actions (cascade/promote, root-removal).
   11. **Wire into rich-card.tsx** — DndContext, virtualizer integration, multi-select, expanded handle, permission resolution, custom-keys merging, root-removal flow, search hook + active-match scrollToView, sibling export of `<RichCardSearchBar>`.
   12. **Update demo.tsx** — add toggles for: editable, dnd, multi-select, permissions, custom-keys, virtualize, search (with the bundled search-bar).
   13. **Update guide and STATUS** — guide gets v0.3 features section (incl. native search); STATUS gets shipped entry.
4. Verify with `pnpm tsc --noEmit`, `pnpm lint`, `pnpm build`.
5. Manual browser smoke test at `/components/rich-card` covering: drag-drop, multi-select bulk delete, permission lock via `__rcmeta.locked`, virtualization on a 1000-node tree, meta editing, root-removal with callback, **search across collapsed subtrees + meta + virtualized cards with `findNext` jump-to-match auto-expanding ancestors**.

If at any point during implementation a plan decision turns out wrong, **stop, document the issue, ask before deviating**. The plan is the contract; deviations are loud, not silent.
