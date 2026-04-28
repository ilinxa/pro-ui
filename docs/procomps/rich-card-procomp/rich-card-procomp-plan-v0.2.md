# `rich-card` v0.2 — Pro-component Plan (Stage 2 revision)

> **Stage:** 2 of 3 · **Phase:** v0.2 (inline editor) · **Status:** Draft — awaiting sign-off
> **Slug:** `rich-card` · **Category:** `data`
> **Inputs:**
> - [Description (Stage 1)](rich-card-procomp-description.md) — all 16 Q-decisions inherited as fixed inputs
> - [v0.1 plan (Stage 2)](rich-card-procomp-plan.md) — v0.1 architecture inherited; v0.2 adds, never replaces
> - [v0.1 guide (Stage 3)](rich-card-procomp-guide.md) — public surface inherited
> - **Four scope calls confirmed by user (2026-04-28):** one v0.2 release (no a/b split); meta editing deferred to v0.3; single `editable: boolean` permission gate; click-to-edit affordance trigger.
> **Scope of this plan:** v0.2 only. v0.3/v0.4/v0.5 each get their own plan revision when they're up next.

This doc locks **how** v0.2 extends what v0.1 shipped. After sign-off, no scaffolding-time second-guessing — implementation follows the plan, deviations are loud.

---

## 1. Inherited inputs (one paragraph)

v0.1 shipped a JSON-driven viewer with parse / serialize / per-level styling / collapse / meta presentation / full ARIA tree / canonical round-trip. v0.2 adds **inline editing** under an `editable: boolean` global gate (default `false`, backward-compat). Every flat-field value, flat-field key, predefined-key entry, and card title is editable in place via single-click → input swap. Add operations are affordance-driven (hover-revealed inline buttons in card chrome). Remove operations are instant (undo arrives in v0.4). Selection becomes distinct from focus — single-click selects, single-select only. Granular change events fire per action; a coarse `onChange(tree)` fires after every commit. `markClean()` / `isDirty()` track unsaved-changes via a version counter. Validation is sync (Q14) — collisions and predefined-key shape mismatches block commit with inline error. **Out of v0.2 (deferred):** meta editing, drag-drop reordering, per-level/per-card/per-key permission matrix, multi-select / bulk ops, custom predefined-key registration, undo/redo, validation hooks, markdown adapter.

---

## 2. Architecture additions

v0.1's architecture (two-layer data model, depth-first ARIA-tree render, single reducer, prop-chain config, pure helpers in `lib/`) is preserved entirely. v0.2 layers on:

### 2.1 Edit-mode UI state (separate from reducer state)

"What's currently being edited" is **transient UI state**, not committed state. It lives in a dedicated `useState<EditMode | null>(null)` in [`rich-card.tsx`](../../../src/registry/components/data/rich-card/rich-card.tsx) and the new [`hooks/use-edit-mode.ts`](../../../src/registry/components/data/rich-card/hooks/use-edit-mode.ts).

```ts
type EditMode =
  | { kind: "field-value"; cardId: string; key: string }
  | { kind: "field-key";   cardId: string; key: string }
  | { kind: "card-title";  cardId: string }
  | { kind: "predefined";  cardId: string; key: PredefinedKey }
  | { kind: "field-add";   cardId: string }
  | { kind: "predefined-add"; cardId: string };
```

Why outside the reducer: edit-mode focus shouldn't be replayed by undo/redo (v0.4). Keeping it separate keeps the reducer pure and the action history meaningful.

### 2.2 Reducer extension

[`lib/reducer.ts`](../../../src/registry/components/data/rich-card/lib/reducer.ts) gains 12 new actions and 3 state slots:

```ts
// new state slots
type RichCardStateV2 = RichCardStateV1 & {
  selectedId: string | null;
  version: number;          // increments on every committing action
  cleanVersion: number;     // snapshot taken at mount and on mark-clean
};

// new actions (added to the union)
type ActionV2 =
  | ActionV1
  | { type: "field-edit-value"; cardId: string; key: string; value: FlatFieldValue; valueType: FlatFieldType }
  | { type: "field-edit-key";   cardId: string; oldKey: string; newKey: string }
  | { type: "field-add";        cardId: string; key: string; value: FlatFieldValue; valueType: FlatFieldType }
  | { type: "field-remove";     cardId: string; key: string }
  | { type: "card-add";         parentId: string; card: RichCardTree }
  | { type: "card-remove";      cardId: string }
  | { type: "card-rename";      cardId: string; newParentKey: string }
  | { type: "predefined-add";   cardId: string; entry: RichCardPredefinedEntry }
  | { type: "predefined-edit";  cardId: string; key: PredefinedKey; entry: RichCardPredefinedEntry }
  | { type: "predefined-remove"; cardId: string; key: PredefinedKey }
  | { type: "set-selection";    id: string | null }
  | { type: "mark-clean" };
```

Every commit-action increments `version`. `mark-clean` sets `cleanVersion = version`. `set-selection` does NOT increment version (selection is not a tree mutation).

### 2.3 Validation layer

New file [`lib/validate-edit.ts`](../../../src/registry/components/data/rich-card/lib/validate-edit.ts) — pure synchronous validators per action type. Returns `{ ok: true } | { ok: false, errors: ValidationError[] }`. The reducer calls the validator before mutating; if invalid, state is unchanged and the caller (the editor part) surfaces the error inline.

```ts
type ValidationError = { code: string; message: string };

export function validateFieldEditValue(
  state: RichCardState,
  cardId: string,
  key: string,
  value: FlatFieldValue,
): { ok: true } | { ok: false; errors: ValidationError[] };

export function validateFieldEditKey(state, cardId, oldKey, newKey, opts): ...;
export function validateFieldAdd(state, cardId, key, value, opts): ...;
export function validatePredefinedShape(key, value): ...;
// etc.
```

### 2.4 Edit-on-click flow

1. View mode: field value renders as `<span>` inside `<dd>`.
2. User clicks the value → edit-mode set to `{ kind: "field-value", cardId, key }`.
3. `<FieldEdit>` mounts in place, type-aware input pre-filled with current value.
4. User types. Validation runs on each commit attempt.
5. Blur or `Enter` → reducer dispatches `field-edit-value`. If valid: state mutates, version++, granular event + `onChange` fire, edit-mode clears.
6. `Escape` → edit-mode clears, view rendering resumes (no commit).

Same flow for keys (click on `<dt>`), card titles (click on title `<h3>`), and predefined-key blocks (click on the rendered block).

### 2.5 Add-button placement

Each card in edit mode shows hover-revealed buttons in its chrome:
- **+ field** at the bottom of the field list
- **+ block** at the bottom of the predefined-key list
- **+ child** at the bottom of the children group (or at the card body if no children yet)

Clicking opens the corresponding editor inline. No popovers, no modals — input lives in the card body.

### 2.6 Remove flow

- **Field row:** hover-revealed × button on the right edge of the row → instant remove on click.
- **Predefined-key block:** hover-revealed × button in the block's header → instant remove.
- **Card:** small "..." actions menu in the card header (only visible in edit mode) → "Remove card" option → instant remove (cascade default per Q15).

No confirmation dialog in v0.2 — undo recovers in v0.4. Documented as a v0.2 limitation.

⚠ **Two deviations from description Q17 flagged here for visibility (both deferring scope to v0.3):**

1. **`promote` option on card removal.** Description Q17 said *"`promote` available as a per-delete option in v0.2+"*. This v0.2 plan **defers `promote` entirely to v0.3** alongside the per-deletion override UX (shift-click, modifier key, or context-menu pick). Rationale: promote requires collision resolution for promoted children whose `parentKey` collides with siblings at the new level, which is its own UX call (suffix `_2` / fully-qualify / refuse?) — and the per-deletion override UX naturally pairs with v0.3's bulk-ops + permissions scope. Cascade is the only behavior in v0.2. **If you want promote in v0.2:** the simplest add is a `defaultDeletePolicy?: 'cascade' | 'promote'` prop (developer-set default applied to every delete; no per-deletion override) — ~25 lines of reducer logic plus one prop. Push back to add it.
2. **Root removal.** Description Q17 said *"v0.2 may allow [root delete] with explicit consumer config."* This plan **forbids root removal in v0.2 entirely**. Rationale: removing the root requires a "what becomes the new root?" UX call (auto-promote first child? render an empty-tree placeholder? consumer-supplied callback?) that doesn't fit v0.2's inline-editing scope. Lands in v0.3 as a developer-opt-in flag with the new-root rule decided. Push back if you want this in v0.2.

---

## 3. Final API delta (v0.2)

All v0.1 props remain. v0.2 adds:

```ts
type RichCardPropsV2 = RichCardPropsV1 & {
  /** Global editing toggle. When false (default), behaves exactly like v0.1. */
  editable?: boolean;

  /** Coarse change handler. Fires after every commit with the canonical tree. */
  onChange?: (tree: RichCardJsonNode) => void;

  /** Granular change handlers (all optional; fire alongside `onChange`). */
  onFieldEdited?: (event: FieldEditedEvent) => void;
  onFieldAdded?: (event: FieldAddedEvent) => void;
  onFieldRemoved?: (event: FieldRemovedEvent) => void;
  onCardAdded?: (event: CardAddedEvent) => void;
  onCardRemoved?: (event: CardRemovedEvent) => void;
  onCardRenamed?: (event: CardRenamedEvent) => void;
  onPredefinedAdded?: (event: PredefinedAddedEvent) => void;
  onPredefinedEdited?: (event: PredefinedEditedEvent) => void;
  onPredefinedRemoved?: (event: PredefinedRemovedEvent) => void;

  /** Selection change handler (single-select in v0.2). */
  onSelectionChange?: (id: string | null) => void;
};
```

All v0.1 imperative-handle methods remain. v0.2 adds:

```ts
type RichCardHandleV2 = RichCardHandleV1 & {
  /** Returns true if any committing action has run since mount or last markClean(). */
  isDirty(): boolean;
  /** Snapshots the current state as the new "clean" baseline. */
  markClean(): void;
  /** Returns the currently-selected card id, or null. */
  getSelectedId(): string | null;
};
```

The v0.1 plan's API sketch flagged `focusCard` and `setSelection` as `v0.2+` candidates. **This v0.2 plan defers both to v0.3** alongside multi-select + permissions. Rationale: v0.2's selection is always click-driven (no host-supplied selection); programmatic selection from the host is a fit for v0.3's bulk-ops API where shift+click, cmd+click, and host-side selection management all land together. Both are 5-line additions to the imperative handle if a real consumer needs them earlier. Flagged as a minor deferral.

New event types (all exported from `index.ts`):

```ts
export type FieldEditedEvent = {
  cardId: string;
  key: string;
  oldValue: FlatFieldValue;
  oldType: FlatFieldType;
  newValue: FlatFieldValue;
  newType: FlatFieldType;
};

export type FieldAddedEvent = {
  cardId: string;
  key: string;
  value: FlatFieldValue;
  type: FlatFieldType;
};

export type FieldRemovedEvent = {
  cardId: string;
  key: string;
  oldValue: FlatFieldValue;
  oldType: FlatFieldType;
};

export type CardAddedEvent = {
  parentId: string;
  card: RichCardJsonNode;
};

export type CardRemovedEvent = {
  cardId: string;
  removed: RichCardJsonNode;     // the full removed subtree (for host-side undo)
  parentId: string | null;       // null if root (v0.2 forbids root removal regardless)
};

export type CardRenamedEvent = {
  cardId: string;
  oldKey: string | undefined;    // root has no old key
  newKey: string;
};

export type PredefinedAddedEvent = {
  cardId: string;
  key: PredefinedKey;
  value: unknown;
};

export type PredefinedEditedEvent = {
  cardId: string;
  key: PredefinedKey;
  oldValue: unknown;
  newValue: unknown;
};

export type PredefinedRemovedEvent = {
  cardId: string;
  key: PredefinedKey;
  oldValue: unknown;
};
```

**Counts:**
- **Types:** v0.1 had 11 public types + 2 const exports + 1 component + 1 ref-handle type. v0.2 adds 9 event types + makes `FlatFieldType` newly public (referenced by event types). → **10 new types, 21 public types total**.
- **Props:** 1 required (unchanged). Optional: 9 → 21 (**12 new** — `editable`, `onChange`, 9 granular handlers, `onSelectionChange`).

This blows past the v0.1 plan's "if surface expands beyond ~12 props, the API is wrong" guideline — but that guideline was for v0.1 specifically. v0.2 was always going to add a lot of props (event handlers in particular). Expected, not a budget breach.

---

## 4. File additions and modifications

### 4.1 New files (11)

```
src/registry/components/data/rich-card/
├── parts/
│   ├── field-edit.tsx              ← inline edit for flat-field value AND key (combined)
│   ├── field-add.tsx               ← "+ field" inline form
│   ├── card-title-edit.tsx         ← inline edit for card's parentKey (rename)
│   ├── card-actions.tsx            ← "..." menu in card header (delete card, etc.)
│   ├── predefined-edit.tsx         ← editor for all 5 predefined keys (switches internally)
│   ├── predefined-add-menu.tsx     ← "+ block" menu listing available predefined keys
│   └── inline-error.tsx            ← validation error message component
├── hooks/
│   ├── use-edit-mode.ts            ← (mode, setMode, clear) — UI state for what's being edited
│   ├── use-dirty.ts                ← isDirty() selector + version-counter helpers
│   └── use-selection.ts            ← selectedId selector + setSelection helper
└── lib/
    └── validate-edit.ts            ← pure validators per edit action
```

### 4.2 Modified files (6)

| File | Changes |
|---|---|
| [`types.ts`](../../../src/registry/components/data/rich-card/types.ts) | Add `RichCardPropsV2` union (or extend in place), 9 event types, expanded `RichCardHandle` |
| [`lib/reducer.ts`](../../../src/registry/components/data/rich-card/lib/reducer.ts) | Add ~12 actions, `selectedId`/`version`/`cleanVersion` state slots |
| [`parts/card.tsx`](../../../src/registry/components/data/rich-card/parts/card.tsx) | Accept editing props via config; render add buttons in edit mode; click selects card; switch field/predefined rendering to editors when in edit mode for that target |
| [`parts/card-header.tsx`](../../../src/registry/components/data/rich-card/parts/card-header.tsx) | Render `<CardActions>` in edit mode; switch title to `<CardTitleEdit>` when in edit-mode for this card's title |
| [`parts/field-row.tsx`](../../../src/registry/components/data/rich-card/parts/field-row.tsx) | Switch to `<FieldEdit>` when edit-mode targets this row's value or key; show hover-× when in edit mode |
| [`rich-card.tsx`](../../../src/registry/components/data/rich-card/rich-card.tsx) | Wire `editable` prop, edit-mode state, all event handlers; expand imperative handle |

### 4.3 Updated counts

- v0.1: 25 files
- v0.2 additions: 11 new files
- v0.2 total: **36 files**

Breakdown: **7 parts + 3 hooks + 1 lib** (the 7th part is `inline-error.tsx`, which I miscounted as a separate category in an earlier draft of this plan). About 1.5× v0.1's footprint — within the magnitude declared in the v0.1 plan ("v0.2 will add props rather than change them").

---

## 5. Edit interaction model (the meat)

### 5.1 Per-target trigger / commit / cancel rules

| Target | Trigger | Commit | Cancel | Validation |
|---|---|---|---|---|
| Flat-field value | Click on `<dd>` | `Enter` or blur | `Escape` | Type-preserve; reject collisions only on key edits |
| Flat-field key | Click on `<dt>` | `Enter` or blur | `Escape` | Reserved/predefined/sibling collision |
| Card title (parentKey) | Click on `<h3>` (in edit mode only) | `Enter` or blur | `Escape` | Sibling collision (no two children of same parent share parentKey); reserved/predefined collision |
| Predefined-key block | Click on the block | `Save` button or blur with valid value | `Escape` or `Cancel` button | Predefined-key shape (per type) |
| Add field (form) | "+ field" button | `Add` button or `Enter` | `Escape` | Reserved/predefined/sibling collision; non-empty key |
| Add predefined (menu) | "+ block" button | Click any of 5 keys | Click outside | None at click time; opens edit for the new entry |
| Add child | "+ child" button | (immediate; new card auto-named "untitled" + auto-enter title edit) | `Escape` during title edit removes the new card | Title collision validated on title commit |
| Remove field / predefined / card | Hover-× / actions menu | Click | n/a | None (no confirm) |

### 5.2 Type-aware input widgets (FieldEdit)

| Type | Widget |
|---|---|
| `string` | `<input type="text">` |
| `number` | `<input type="number">` with `parseFloat` on commit |
| `boolean` | `<input type="checkbox">` (toggle commits immediately on change, not on blur) |
| `date` | Native `<input type="date">` for date-only ISO; `<input type="datetime-local">` if source had a time component |
| `null` | **Read-only in v0.2** — must remove + re-add to change. Documented limitation. |

Type changes on edit are **not supported in v0.2** — the value's type is preserved through edit. To change a string field to a number, the user removes it and adds a new field with type=number. v0.3 may add a type-picker. Flagged Q-P2 below.

### 5.3 Predefined-key editors (single file, 5 sub-components)

[`parts/predefined-edit.tsx`](../../../src/registry/components/data/rich-card/parts/predefined-edit.tsx) is one file with five inner components:

| Predefined | Editor UX |
|---|---|
| `codearea` | Format input (text, mono, small) above a content textarea (mono, larger, autosizing). |
| `image` | Two text inputs: src, alt. Live preview of the image below. |
| `quote` | Single textarea (multi-line). |
| `list` | Textarea where each line is a list item. Empty lines dropped on commit. Type per line: scalar inference (number / boolean / null / string per `infer-type`). |
| `table` | **JSON-textarea fallback** for v0.2 — show the value as JSON, parse on commit, validate shape. Cell-by-cell editor deferred to v0.3. Flagged Q-P4 below. |

All editors render a small `Save` / `Cancel` button row at the bottom (and respond to `Enter` / `Escape` on text inputs).

### 5.4 Add-field form

```
┌─────────────────────────────────┐
│ key:  [                       ] │
│ type: [string ▾]                │
│ value:[                       ] │
│ [Cancel]  [Add]                 │
└─────────────────────────────────┘
```

- `key` is a required text input (validated on every keystroke for collisions; submit disabled if invalid).
- `type` is a `<select>` with 4 options: `string` / `number` / `boolean` / `date`. `null` not addable in v0.2 (Q-P1 below).
- `value` widget swaps based on `type` (matches §5.2).
- Submit (Add button or `Enter` in any input) commits via `field-add` reducer action.
- Cancel (button or `Escape`) clears edit-mode without changes.

### 5.5 Add-card flow

1. Click "+ child" button on a card → reducer `card-add` action with auto-generated id, `__rcorder = max(siblings) + 1`, `parentKey = "untitled"`, empty fields/predefined/children.
2. Edit-mode immediately set to `{ kind: "card-title", cardId: newId }` — input swaps the new card's title.
3. User types, commits.
4. New card auto-selected (`set-selection`).

If the user presses `Escape` during title edit, the new card is **removed** (the add was tentative). This avoids stranded "untitled" cards.

### 5.6 Predefined add-menu flow

Click "+ block" → small menu opens listing the 5 predefined keys MINUS:
- any already present on this card (each key allowed at most once per card; multi-instance is v0.3)
- any in `disabledPredefinedKeys`

Click a key → reducer `predefined-add` with default-shape value:

| Key | Default shape |
|---|---|
| `codearea` | `{ format: "text", content: "" }` |
| `image` | `{ src: "", alt: "" }` |
| `quote` | `""` |
| `list` | `[""]` |
| `table` | `{ headers: ["col"], rows: [[""]] }` |

Then edit-mode immediately set to `{ kind: "predefined", cardId, key }` so the user fills in the real content. `Escape` during this edit removes the just-added entry.

---

## 6. Add operations summary

| Operation | Action | Where the affordance lives | Auto-edit after add |
|---|---|---|---|
| Add field | `field-add` | "+ field" button below last field row | No — form fills before commit |
| Add predefined | `predefined-add` | "+ block" button → menu → click key | Yes — opens edit for new entry; Escape removes |
| Add child | `card-add` | "+ child" button below last child / in body if no children | Yes — opens title edit; Escape removes |

---

## 7. Remove operations summary

| Operation | Action | Affordance | Confirm? |
|---|---|---|---|
| Remove field | `field-remove` | Hover × on field row right edge | No |
| Remove predefined | `predefined-remove` | Hover × on block header | No |
| Remove card | `card-remove` | "..." actions menu in card header → "Remove card" | No |

Cascade default per Q15. Root removal forbidden in v0.2. v0.3 adds the per-deletion `promote` option and may add confirm-on-large-subtree.

---

## 8. Change-event contract

Every commit-action in the reducer fires events in this order:

1. **Granular event** — the specific `onFieldEdited` / `onCardAdded` / etc. handler if registered.
2. **Coarse event** — `onChange(tree)` if registered, where `tree` is the post-commit `RichCardJsonNode` (a fresh `treeToJsonNode(state.tree)`).

Events fire **synchronously** within the React state update path (using `useEffect` dispatched after commit, to ensure consumers see the post-commit state). Event listeners must NOT mutate the tree they receive — it's the canonical post-state, not a draft.

`onSelectionChange(id)` fires only when `selectedId` actually changes (no spurious fires on repeat-clicks).

`mark-clean` does NOT fire `onChange` — it's a pure version-counter snapshot.

---

## 9. Dirty tracking

[`hooks/use-dirty.ts`](../../../src/registry/components/data/rich-card/hooks/use-dirty.ts) reads `state.version` and `state.cleanVersion`:

```ts
isDirty(): boolean   →   state.version !== state.cleanVersion
```

Lifecycle:
- Mount: `version = 0`, `cleanVersion = 0` → not dirty.
- Any commit-action: `version += 1` → dirty.
- `markClean()` action: `cleanVersion = version` → not dirty.

This is a **counter-based** approach — cheap, predictable, but doesn't detect "edited and then edited back to original". For v0.2 that trade-off is acceptable. v0.4 (when undo arrives) upgrades to structural-diff dirty tracking that knows about reversibility.

`isDirty()` exposed via the imperative handle; `onChange` does NOT carry dirty state (consumer reads via ref).

---

## 10. Selection model

**Selection is distinct from focus** in v0.2:

| Concept | v0.1 | v0.2 |
|---|---|---|
| Focus | Keyboard nav target. Single. Persists through arrow keys. | Same. Unchanged. |
| Selection | (didn't exist) | Click-driven. Single. Persists across keyboard nav. |
| `aria-selected` | Reflected focus | **Reflects selection** (changed) |
| `tabIndex` | Reflected focus | Reflected focus (unchanged) |

Click on the card's chrome (header or background, **not** on body content like a field value or predefined block — those have their own click handlers for editing) → reducer `set-selection` with that card's id. Re-clicking the same card does nothing. Clicking on the outer container (outside any card) clears selection (`set-selection: null`).

`onSelectionChange(id)` fires when `selectedId` changes. `getSelectedId()` exposes current selection via the imperative handle.

Multi-select (shift-click range, cmd-click toggle) is v0.3.

### 10.1 ARIA shift

In v0.1, every focused card had `aria-selected={true}`. In v0.2, that's incorrect — focus and selection are now separate concepts. The shift:

- Cards with `state.selectedId === card.id` → `aria-selected={true}`
- Cards without selection → `aria-selected={false}` (was `aria-selected={undefined}` in v0.1)

This is a behavior change for screen-reader users on v0.1-style consumers. Documented as a deliberate v0.2 a11y delta in the guide.

---

## 11. Validation at edit time

All validation is **synchronous** (Q14 — async hooks deferred to v0.4). The reducer calls the validator before any commit:

```ts
function reducer(state, action) {
  switch (action.type) {
    case "field-edit-value": {
      const result = validateFieldEditValue(state, action.cardId, action.key, action.value);
      if (!result.ok) return state;  // no-op; caller's editor surfaces errors
      // ... apply mutation
    }
    // ...
  }
}
```

Validators in [`lib/validate-edit.ts`](../../../src/registry/components/data/rich-card/lib/validate-edit.ts):

| Validator | Checks |
|---|---|
| `validateFieldEditValue` | Value is a JSON scalar; type matches expected (no string-to-number coercion in v0.2) |
| `validateFieldEditKey` | New key is non-empty; not in `RESERVED_KEYS`; not in `PREDEFINED_KEYS` (unless disabled); not a sibling collision |
| `validateFieldAdd` | Same as edit-key + value-type validation |
| `validateFieldRemove` | Card has the key (no-op if not) |
| `validateCardRename` | Same key rules as field-key for the card's `parentKey` |
| `validateCardAdd` | Parent exists; new card's `parentKey` doesn't collide |
| `validateCardRemove` | Card exists; not the root |
| `validatePredefinedShape` | The 5 shape rules from v0.1's `lib/parse.ts` (extracted and reused) |
| `validatePredefinedEdit` / `validatePredefinedAdd` | Card exists; key is a valid `PredefinedKey`; shape matches |
| `validatePredefinedRemove` | Card has the key |

Editor parts call the relevant validator on every keystroke (cheap; pure functions) and surface errors via `<InlineError>`. Submit is gated on `result.ok`.

### 11.1 Inline error component

[`parts/inline-error.tsx`](../../../src/registry/components/data/rich-card/parts/inline-error.tsx):

```tsx
<InlineError errors={[{ code, message }]} />
```

Renders a small red strip below the input with each message. `aria-live="polite"` so screen readers announce. Hidden when `errors` is empty.

---

## 12. A11y deltas from v0.1

| Area | v0.1 | v0.2 |
|---|---|---|
| `aria-selected` source | Focus | **Selection** (deliberate change; documented in guide) |
| Editable inputs | (none) | Type-appropriate roles (`role="textbox"` from native input; `role="checkbox"` from native checkbox); `aria-label` on each input describing what's being edited (e.g. "Edit value of field 'priority'") |
| Inline error | (n/a) | `aria-live="polite"` region; appears below the editing input |
| Add buttons | (n/a) | Native `<button>` with `aria-label` describing the add target |
| Remove × buttons | (n/a) | Native `<button>` with `aria-label="Remove field 'priority'"` etc. |
| Live announcements | (n/a) | `aria-live="polite"` region in the tree root announcing add / remove actions ("Field 'priority' added", "Card 'introduction' removed") |
| Edit mode keyboard | (n/a) | `Enter` commits, `Escape` cancels — handled at the editor level so they don't bubble to tree-keyboard nav |
| Read-only fields (null type) | (n/a) | `<dd>` in null fields has `aria-readonly="true"` — clicking does NOT enter edit mode |

Tree-level keyboard nav (arrow keys, home/end) is unchanged. **When a card is in edit mode, the tree-keyboard handler must NOT process arrow keys** — they belong to the active input. Implementation: edit-mode state checked at the top of the `onKeyDown` handler in the tree root; if an editor is active, return early.

---

## 13. Edge cases (deltas from v0.1)

| Case | Behavior |
|---|---|
| `editable={false}` (default) | Identical to v0.1. No add buttons, no edit-mode triggers, no × buttons, click selects the card but doesn't enter edit mode. |
| Toggle `editable` from true → false at runtime | All open editors close (commit if blur-friendly, else cancel); add buttons disappear; selection preserved. |
| Edit a date field with a non-date string entered | Validator catches; commit blocked; inline error "must be a valid date". |
| Add a field with a key matching a predefined name when that key is in `disabledPredefinedKeys` | Allowed (predefined treatment is opted out). |
| Add a field with an empty key | Submit disabled; "key is required" error. |
| Remove the only field on a card that has no children either | Card becomes header-only (no body); chevron disappears (it auto-hides per v0.1's `canCollapse` logic). |
| Remove a card while one of its descendants is being edited | Edit-mode cleared; reducer drops the entire subtree; `card-removed` event fires with the full removed subtree. |
| Add a child to a collapsed card | Card auto-expands so the user can see and rename the new child. |
| Two siblings rapidly renamed to colliding keys | Second rename rejected; inline error on the second editor. |
| Predefined-key already present, user clicks "+ block" → menu | The already-present key is omitted from the menu (max-one-per-card rule). |
| User opens edit mode on field A, then clicks field B without committing A | A commits if valid, else cancels; B opens. |
| Network / clipboard failure during a custom event handler | We don't catch consumer errors; if `onChange` throws, React surfaces it. Documented. |
| Direct `__rcorder` editing of an existing card | **Not supported in v0.2.** Sibling order in v0.1+v0.2 is determined by the data shape (parser sorts by `__rcorder`; new cards land at `max(siblings) + 1`). The original brief's "edit card identity/order" item maps to v0.3's drag-drop reordering (which covers the use case ergonomically) plus optional keyboard move-up/move-down. Direct numeric `__rcorder` editing has poor UX vs drag-drop and offers no v0.2 affordance. Flagged as a minor deferral from the description's appendix brief. |
| Direct `__rcid` editing of an existing card | **Not supported in v0.2 or any phase.** `__rcid` is auto-generated and stable; consumers should not manipulate it. Renaming a card means changing its `parentKey` (the property name on its parent), not its `__rcid`. The card-rename action only touches `parentKey`. |

---

## 14. Risks & alternatives

### Risks (carried + new)

| Risk | Mitigation |
|---|---|
| **Scope creep** — v0.2 already includes a lot. | This plan deliberately defers meta editing, drag-drop, permission matrix, undo, multi-select. Each future phase needs its own plan. |
| **Re-render storm during edit** | Edit-mode state changes only on enter/exit (not per keystroke), so the prop-drilled edit-mode triggers a tree re-render only at edit-mode boundaries — rare relative to keystrokes. Each editor's `<input>` owns its local typing state via local `useState`; the shared reducer fires on commit (blur / Enter), not per keystroke. Inline validation runs on each keystroke against pure validators — cheap. |
| **Stale-prop closures in event handlers** | All `onChange`-style handlers are read from a `useEffect`-tracked ref, not closed over directly, so latest handler always fires. |
| **Tree-keyboard intercepting editor keystrokes** | Edit-mode check at the top of the tree's `onKeyDown` handler — if any editor is active, return early. |
| **Counter-based dirty tracking misses "edited back to original"** | Acknowledged. v0.4 upgrades to structural-diff. v0.2 trade-off is documented. |
| **Add-card "untitled" stranding if user closes browser mid-add** | Auto-removal on `Escape` during title edit. If the user closes without Escape, the untitled card persists in tree state — but this is consumer-saved state, so on reload it reappears with title "untitled". Documented. |

### Alternatives considered, rejected

- **Optimistic state with separate "draft" tree** — adds a third state layer (clean / committed / draft). Overkill for v0.2; commit-only model is simpler and predictable.
- **Modal-based editing** — easier to implement (one modal component, all editors live inside) but breaks Notion / Linear inline-editing convention. Rejected.
- **JSON-textarea editing for everything** — uniform UI but terrible UX (escaping, no type-awareness). Rejected.
- **Controlled mode (`value` + `onChange`) instead of uncontrolled** — re-renders the whole tree on every keystroke. Rejected (matches Q12).
- **Confirm dialogs on remove** — adds friction; v0.4 undo recovers anyway. Rejected for v0.2; v0.3 may add confirm-on-large-subtree.
- **Per-capability permission props** (`allowEdit` / `allowAdd` / `allowRemove`) — more granular but premature. Single `editable` boolean for v0.2; full per-level/per-card/per-key matrix in v0.3.

---

## 15. Plan-stage open questions

The description sealed v0.2's *what*. These are *how* questions for the editor implementation that need your call before scaffolding.

| # | Question | Recommendation | Why |
|---|---|---|---|
| Q-P1 | **Editing null fields:** read-only in v0.2 (must remove + re-add) or opt-in via type-picker? | **Read-only.** | Type-changing-on-edit is genuinely complex; null is uncommon; remove+re-add works. Defer type-picker to v0.3. |
| Q-P2 | **Type-changing on edit** of non-null fields (string ↔ number etc.)? | **No — type preserved.** Type-pick only at add time. | Same reason as Q-P1. v0.3 may add inline type-picker if real consumers ask. |
| Q-P3 | **New card placeholder name** when "+ child" is clicked? | **`"untitled"`** + auto-enter title edit + auto-remove on Escape. | Avoids stranded "untitled" cards; matches Notion's "Untitled page" with immediate edit. |
| Q-P4 | **Table editing UX** in v0.2 — proper cell-by-cell editor or JSON-textarea fallback? | **JSON-textarea fallback.** | Cell-editor is its own UX problem (add/remove rows, add/remove columns, cell-type validation). Defer to v0.3. v0.2 keeps tables editable via JSON; ergonomic enough for content authors. |
| Q-P5 | **Field-add form layout:** popover (above the "+ field" button) or inline (replaces the button)? | **Inline** (replaces the "+ field" button location). | Matches the rest of the inline-editing pattern; popovers add a focus-trap layer we don't need. |
| Q-P6 | **Selection click target:** entire card (chrome + header + body) or just chrome? | **Just header / outer chrome.** | Body content is interactive in edit mode (click a field to edit); using it as a "select" trigger is ambiguous. |
| Q-P7 | **Remove confirmation** in v0.2 for cards with children? | **No confirmation.** | Adds friction; v0.4 undo recovers. v0.3 may add confirm-on-N+-children if real consumers complain. |
| Q-P8 | **`editable` runtime toggle behavior** — when toggled false mid-edit, commit pending edits or cancel? | **Commit if valid, else cancel.** | Matches blur-commit semantics; user-friendly; predictable. |
| Q-P9 | **Boolean field commit timing** — on toggle (immediate) or on blur? | **Immediate on toggle.** | Checkbox / switch semantics; users expect instant feedback. No "Enter to commit" needed. |
| Q-P10 | **Predefined-key max-one-per-card** rule (e.g. one `codearea` per card) — keep from v0.1's implicit constraint? | **Keep.** Multi-instance per card deferred to v0.3. | Matches v0.1's parser behavior; consumers wanting multiple code blocks use child cards. |

10 Q-Ps. None are scope-shifting blockers — all are bounded UX calls.

---

## 16. Definition of "done" for THIS document (stage gate)

Before any code or scaffolding:

- [ ] User reads §1–§14 (the locked plan) and §15 (plan-stage Qs).
- [ ] Each Q-P1 through Q-P10 has either an "agreed" or override answer.
- [ ] User explicitly says **"plan approved"** (or equivalent) — this unlocks Stage 3 (v0.2 implementation).

After sign-off, the next session starts with:

1. Update [STATUS.md](../../../.claude/STATUS.md): bump rich-card version target to 0.2.0; add a v0.2 in-flight entry.
2. Implement against this plan, file by file. Suggested order:
   1. **Types first** — extend `types.ts` with new event types, prop deltas, expanded handle.
   2. **Validation** — `lib/validate-edit.ts` (pure; testable independently).
   3. **Reducer** — extend `lib/reducer.ts` with the new actions + version counter + selection state. Hand-verify by walking dummy data through each action.
   4. **Hooks** — `use-edit-mode.ts`, `use-dirty.ts`, `use-selection.ts` (small, independent).
   5. **Inline-error** — `parts/inline-error.tsx` (used by every editor).
   6. **Field editors** — `parts/field-edit.tsx`, `parts/field-add.tsx`.
   7. **Card editors** — `parts/card-title-edit.tsx`, `parts/card-actions.tsx`.
   8. **Predefined editors** — `parts/predefined-edit.tsx`, `parts/predefined-add-menu.tsx`.
   9. **Wire in card.tsx + card-header.tsx + field-row.tsx** — switch view↔edit rendering based on edit-mode state.
   10. **Wire in rich-card.tsx** — new props, edit-mode state, event firing, expanded handle.
   11. **Update demo.tsx** — add an "Edit mode" toggle to the demo so the side-by-side preview can showcase v0.2 editing alongside the live JSON.
   12. **Update guide and STATUS** — guide gets a new v0.2 features section; STATUS gets a "shipped v0.2" entry.
3. Verify with `pnpm tsc --noEmit`, `pnpm lint`, `pnpm build`.
4. Manual browser smoke-test at `/components/rich-card`.

If at any point during implementation a plan decision turns out wrong, **stop, document the issue, ask before deviating**. The plan is the contract; deviations are loud, not silent.
