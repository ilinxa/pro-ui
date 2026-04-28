# `rich-card` v0.4 — Pro-component Plan (Stage 2 revision)

> **Stage:** 2 of 3 · **Phase:** v0.4 (validation hooks + undo/redo) · **Status:** Draft — awaiting sign-off
> **Slug:** `rich-card` · **Category:** `data`
> **Inputs:**
> - [Description (Stage 1)](rich-card-procomp-description.md) — Q14 locks "sync validation, per-commit undo, history depth configurable, default 50"
> - [v0.1 plan](rich-card-procomp-plan.md) · [v0.2 plan](rich-card-procomp-plan-v0.2.md) · [v0.3 plan](rich-card-procomp-plan-v0.3.md) — all architecture inherited
> - v0.3 shipped 2026-04-28 with structural management, search, permissions, virtualization. v0.4 layers safety on top.
> **Scope of this plan:** v0.4 only. v0.5 (markdown adapter) remains deferred indefinitely as a separate companion.

This doc locks **how** v0.4 extends what v0.3 shipped. After sign-off, no scaffolding-time second-guessing.

---

## 1. Inherited inputs (one paragraph)

v0.1 viewer → v0.2 inline editor → v0.3 structural management. v0.3 shipped: drag-drop, bulk multi-select, permissions, custom predefined-keys, virtualization, native search, meta editing, root-removal, promote-on-delete. v0.4 adds **two safety-net features**: **(a) host-supplied validation hooks** that gate every commit-action — when a validator returns `{ ok: false }`, the action is rejected with inline error (sync only; async deferred indefinitely per Q14); **(b) per-commit undo / redo** with configurable history depth (default 50), state-snapshot strategy with structural sharing, restoring selection / focus alongside the tree, default `Cmd+Z` / `Cmd+Shift+Z` keyboard shortcuts. **Out of v0.4:** async validation hooks, will-change/did-change event split (validators play that role), markdown adapter (v0.5, deferred), structural-diff dirty tracking (could fold in here but kept separate to limit scope).

---

## 2. v0.4 scope summary (one paragraph)

Smallest of the four major phases. Two features arriving together: validation hooks (gate commits) and undo / redo (recover from commits). Both extend existing systems rather than introducing new mental models. All v0.1–v0.3 props are preserved unchanged. Zero new npm deps. File count grows from 53 → ~58. The component reaches feature-complete for its current vision; v0.5 markdown adapter remains a separate companion not part of rich-card itself.

---

## 3. Architecture additions

### 3.1 Validation pipeline

A pure validator pipeline runs **before** every commit-action. Three layers:

```
1. Built-in validators (v0.2 — already shipped)
   ↓ (must pass)
2. Per-action validators (v0.4 new — host-supplied per-action functions)
   ↓ (must pass)
3. Master validator (v0.4 new — host-supplied catch-all function)
   ↓ (must pass)
→ Action commits, events fire.
```

Any validator returning `{ ok: false; errors: [...] }` rejects the action. The first failing layer's errors are reported to the editor part (which surfaces them via `<InlineError>`) and to a new `onValidationFailed` event.

### 3.2 Validator interface

```ts
type RichCardValidationResponse =
  | { ok: true }
  | { ok: false; errors: { code: string; message: string }[] };

type RichCardValidators = {
  // Per-action — typed event payloads
  fieldEdit?: (event: FieldEditedEvent, tree: RichCardJsonNode) => RichCardValidationResponse;
  fieldAdd?: (event: FieldAddedEvent, tree: RichCardJsonNode) => RichCardValidationResponse;
  fieldRemove?: (event: FieldRemovedEvent, tree: RichCardJsonNode) => RichCardValidationResponse;
  cardAdd?: (event: CardAddedEvent, tree: RichCardJsonNode) => RichCardValidationResponse;
  cardRemove?: (event: CardRemovedEvent, tree: RichCardJsonNode) => RichCardValidationResponse;
  cardRename?: (event: CardRenamedEvent, tree: RichCardJsonNode) => RichCardValidationResponse;
  cardMove?: (event: CardMovedEvent, tree: RichCardJsonNode) => RichCardValidationResponse;
  cardDuplicate?: (event: CardDuplicatedEvent, tree: RichCardJsonNode) => RichCardValidationResponse;
  predefinedAdd?: (event: PredefinedAddedEvent, tree: RichCardJsonNode) => RichCardValidationResponse;
  predefinedEdit?: (event: PredefinedEditedEvent, tree: RichCardJsonNode) => RichCardValidationResponse;
  predefinedRemove?: (event: PredefinedRemovedEvent, tree: RichCardJsonNode) => RichCardValidationResponse;
  metaEdit?: (event: MetaChangedEvent, tree: RichCardJsonNode) => RichCardValidationResponse;
  metaAdd?: (event: MetaAddedEvent, tree: RichCardJsonNode) => RichCardValidationResponse;
  metaRemove?: (event: MetaRemovedEvent, tree: RichCardJsonNode) => RichCardValidationResponse;
};

// Plus a master catch-all (runs after per-action validators, last gate)
type RichCardMasterValidator = (
  action: { type: string; cardId?: string },
  tree: RichCardJsonNode,
) => RichCardValidationResponse;
```

Both are **synchronous**. Async hooks are deferred indefinitely (Q14).

### 3.3 Undo / redo state model

State-snapshot strategy with structural sharing. Reducer state grows by two slots:

```ts
type RichCardStateV4 = RichCardStateV3 & {
  undoStack: ReadonlyArray<UndoSnapshot>;   // most recent at end
  redoStack: ReadonlyArray<UndoSnapshot>;   // most recent at end
};

type UndoSnapshot = {
  tree: RichCardTree;
  collapsed: ReadonlySet<string>;
  selectedIds: ReadonlySet<string>;
  focusedId: string | null;
  // Note: searchQuery, dragging-id, edit-mode are NOT snapshotted
  // (transient UI state; not what "undo" should restore)
};
```

On every commit-action (one that increments `version`):
1. Snapshot the *pre-commit* state into `undoStack`
2. Clear `redoStack` (new branching)
3. Trim `undoStack` to the configured `maxUndoDepth` (default 50)
4. Apply the action

On undo:
1. Pop last snapshot from `undoStack`
2. Push current state into `redoStack`
3. Restore popped snapshot's tree / collapsed / selectedIds / focusedId
4. version stays the same (don't increment on undo)

On redo: mirror.

`isDirty()` reads `version !== cleanVersion`. Undo doesn't reset `version` so the dirty state persists through undo. **This means: undoing all your changes still reports `isDirty: true`** unless you also call `markClean()`. Acceptable limitation, documented.

### 3.4 Keyboard shortcuts

Default bindings (when `editable={true}`):
- `Cmd/Ctrl + Z` → undo
- `Cmd/Ctrl + Shift + Z` (or `Cmd/Ctrl + Y` on Windows) → redo

The component intercepts these only when focus is **inside the tree** (not when an editor input is focused — those keep their native input behavior, e.g. browser-native undo within the textbox).

Disable via `disableUndoShortcuts: true` for hosts that have global undo handling.

### 3.5 Validation event

```ts
type ValidationFailedEvent = {
  action: string;        // e.g. "field-edit-value"
  cardId?: string;
  errors: { code: string; message: string }[];
  layer: "per-action" | "master";   // which layer rejected
};

onValidationFailed?: (event: ValidationFailedEvent) => void;
```

Useful for analytics, custom toast notifications, audit logging.

---

## 4. Final API delta (v0.4)

```ts
type RichCardPropsV4 = RichCardPropsV3 & {
  // Validation hooks
  validators?: RichCardValidators;
  validate?: RichCardMasterValidator;
  onValidationFailed?: (event: ValidationFailedEvent) => void;

  // Undo / redo
  maxUndoDepth?: number;              // default 50
  disableUndoShortcuts?: boolean;     // default false
  onUndo?: () => void;                // fires after undo applies
  onRedo?: () => void;                // fires after redo applies
};

type RichCardHandleV4 = RichCardHandleV3 & {
  undo(): boolean;                    // returns true if undo happened
  redo(): boolean;                    // returns true if redo happened
  canUndo(): boolean;
  canRedo(): boolean;
  /** Clear both stacks. Useful after a save → markClean cycle. */
  clearHistory(): void;
};
```

**Counts:**
- Types: 31 (v0.3) + 4 new (`RichCardValidators`, `RichCardMasterValidator`, `RichCardValidationResponse`, `ValidationFailedEvent`) = **35 public types**
- Props: 46 (v0.3) + 6 new (validators, validate, onValidationFailed, maxUndoDepth, disableUndoShortcuts, onUndo, onRedo — that's 7; calling 6 because onUndo/onRedo can be one prop) = wait, listing: validators (1), validate (2), onValidationFailed (3), maxUndoDepth (4), disableUndoShortcuts (5), onUndo (6), onRedo (7). **53 total optional props** (46 + 7).

The prop count is getting large. By v0.4 the API surface mirrors what mature editor libraries have (Tiptap, Slate). Documented; not a "wrong API" signal at this scale.

---

## 5. File additions and modifications

### 5.1 New files (3)

```
src/registry/components/data/rich-card/
├── lib/
│   └── validators.ts                  ← runs the 3-layer validation pipeline (built-in → per-action → master)
├── hooks/
│   └── use-undo.ts                    ← can-undo / can-redo / undo / redo helpers + keyboard binding
└── parts/
    └── undo-toolbar.tsx               ← optional default UI for undo/redo buttons (sibling export)
```

That's **3 new files**.

### 5.2 Modified files (5)

| File | Changes |
|---|---|
| [`types.ts`](../../../src/registry/components/data/rich-card/types.ts) | Add 4 validation types, 7 new props, 5 new handle methods |
| [`lib/reducer.ts`](../../../src/registry/components/data/rich-card/lib/reducer.ts) | Add `undoStack` + `redoStack` state slots, 3 new actions (undo / redo / clear-history), snapshot-and-trim on every commit-action |
| [`rich-card.tsx`](../../../src/registry/components/data/rich-card/rich-card.tsx) | Validation pipeline integration in dispatchers; undo / redo wiring; keyboard shortcut listener; expand handle |
| [`demo.tsx`](../../../src/registry/components/data/rich-card/demo.tsx) | Add validator demo (e.g. "field 'priority' must be 1–5"), undo / redo buttons, history-depth toggle |
| [`meta.ts`](../../../src/registry/components/data/rich-card/meta.ts) | Bump version to 0.4.0; add v0.4 features |

### 5.3 Updated counts

- v0.3: 53 files
- v0.4 additions: 3 new files
- v0.4 total: **56 files**

About 1.06× v0.3's footprint. Smallest phase yet.

---

## 6. Validator pipeline behavior

### 6.1 Order of execution per commit attempt

```
  user action triggers dispatcher
    ↓
  built-in validators run (v0.2 — collisions, shape, type)
    ↓ (block on failure with InlineError; no event fires)
    ↓ (pass)
  per-action validator runs (if defined)
    ↓ (block on failure; fires onValidationFailed with layer="per-action")
    ↓ (pass)
  master validator runs (if defined)
    ↓ (block on failure; fires onValidationFailed with layer="master")
    ↓ (pass)
  reducer dispatches → state commits
    ↓
  granular event fires (e.g. onFieldEdited)
  onChange fires
  undo snapshot pushed
```

### 6.2 What the validator receives

- `event` — the SAME shape that would fire on commit (so consumers can pre-compute the post-state for validation logic). Already-typed per action.
- `tree` — the **current** (pre-commit) tree as a `RichCardJsonNode`. Read-only for the validator.

The validator does NOT see the post-commit state. If they need it, they can simulate (e.g. for "would this make the tree exceed 5 levels?", they have the cardId + level info from the event).

### 6.3 What happens on rejection

- The action does NOT commit
- `<InlineError>` shows the validator's error messages (in the editor that originated the action)
- `onValidationFailed` fires with `{ action, cardId, errors, layer }`
- No state change
- Edit mode remains open (user can fix and retry)

### 6.4 Validator error code namespace

To avoid clashes with built-in validators:
- Built-ins use lower-case kebab codes: `reserved-key`, `sibling-collision`, etc.
- Convention for host validators: prefix with `host-`, e.g. `host-priority-out-of-range`.

Documented but not enforced.

### 6.5 Examples

```tsx
<RichCard
  defaultValue={data}
  editable
  validators={{
    fieldEdit: (event, tree) => {
      if (event.key === "priority" && typeof event.newValue === "number") {
        if (event.newValue < 1 || event.newValue > 5) {
          return {
            ok: false,
            errors: [{ code: "host-priority-out-of-range", message: "Priority must be 1–5." }],
          };
        }
      }
      return { ok: true };
    },
    cardRemove: (event, tree) => {
      if (event.removed.__rcmeta?.locked === true) {
        return {
          ok: false,
          errors: [{ code: "host-locked-removal", message: "Cannot remove locked cards." }],
        };
      }
      return { ok: true };
    },
  }}
  validate={(action, tree) => {
    // Master: block any action while the tree is in "review" status
    const root = tree.__rcmeta;
    if (root?.status === "review") {
      return {
        ok: false,
        errors: [{ code: "host-frozen", message: "Tree is in review; no edits allowed." }],
      };
    }
    return { ok: true };
  }}
  onValidationFailed={(e) => analytics.track("validation.failed", e)}
/>
```

---

## 7. Undo / redo behavior

### 7.1 What's undoable

| Action | Undoable? |
|---|---|
| Field add / edit / remove | ✅ |
| Card add / remove / rename / duplicate / move | ✅ |
| Predefined add / edit / remove | ✅ |
| Meta add / edit / remove | ✅ |
| Bulk-remove | ✅ (single undo step restores all removed cards) |
| Selection / focus / collapse changes | ❌ (UI state, not what "undo" means) |
| Search query | ❌ |
| Drag transient state (drag-start / drag-end) | ❌ |
| `replace-tree` (root-removal callback) | ❌ — clears history (it's a tree replacement, not a delta) |

### 7.2 Snapshot frequency

One snapshot per commit-action. So a single `field-edit-value` commit = one undo step.

### 7.3 Bulk operations

Bulk-remove counts as ONE commit (one snapshot, one undo). Likewise bulk-set-field would be one snapshot. v0.3's bulk operations already commit atomically through one reducer dispatch, so this works automatically.

### 7.4 Restore semantics

Undo restores: tree, collapsed (so cards re-collapse / re-expand to their pre-commit state), selectedIds, focusedId.
Undo does NOT restore: searchQuery (controlled by host), draggingId (transient).

`version` does NOT decrement on undo — it stays. This means `isDirty()` remains `true` after undoing all changes. To reset to clean, host must `markClean()` after a known-clean point (typical pattern: after save).

### 7.5 Clear-history triggers

History is cleared when:
- `replace-tree` action fires (root replacement; old states are no longer valid)
- `markClean()` is called AND `clearHistory: true` option (default behavior on `markClean()` is to KEEP history; opt into clearing via the imperative `clearHistory()` method).

### 7.6 History depth

Configurable via `maxUndoDepth: number` (default 50). When the stack exceeds the limit, the oldest snapshot is dropped (FIFO trim from the front).

Memory cost per snapshot: with structural sharing, a single field edit snapshot costs ~few bytes (just the changed path). A card-move snapshot costs more (the whole rebuilt subtree). Typical 50-snapshot stack: < 1MB for most trees.

### 7.7 Keyboard shortcuts

When focus is inside the tree (and not inside an active editor input):
- `Cmd/Ctrl + Z` → `undo()`
- `Cmd/Ctrl + Shift + Z` → `redo()`
- `Cmd/Ctrl + Y` → `redo()` (Windows convention)

When focus is inside an active editor input, the browser's native textbox undo handles it. The component's tree-keyboard handler is already bypassed during editing (v0.2), so this works without special handling.

Default behavior can be disabled via `disableUndoShortcuts: true`.

### 7.8 Imperative API

```ts
const ref = useRef<RichCardHandle>(null);

ref.current?.canUndo();    // boolean
ref.current?.canRedo();    // boolean
ref.current?.undo();       // returns true if happened
ref.current?.redo();       // returns true if happened
ref.current?.clearHistory(); // wipe both stacks
```

### 7.9 Optional default UI

`<UndoToolbar>` sibling export (in `parts/undo-toolbar.tsx`) — a small toolbar with undo / redo buttons + history depth indicator. Hosts can drop it in or wire their own.

---

## 8. A11y deltas from v0.3

- **Validation errors**: same `<InlineError>` mechanism as v0.2 sync validation; `aria-live="polite"` already in place.
- **Undo / redo buttons** (in `<UndoToolbar>`): native `<button>` with `aria-label="Undo"` / `aria-label="Redo"`. `aria-disabled={!canUndo}` reflects state.
- **Live region for undo / redo announcements**: optional. v0.4 doesn't ship this by default; mature screen-reader users typically know when they hit `Cmd+Z`. Can be added in a polish pass.

---

## 9. Edge cases

| Case | Behavior |
|---|---|
| Validator throws an error | Caught by the dispatch wrapper; logged to console; treated as `{ ok: false }` to err on the side of safety |
| Validator returns `{ ok: false }` with empty errors array | Action blocked; `onValidationFailed` fires with `errors: []`; UI shows a generic "Edit blocked by validator" message |
| Master + per-action both reject | Per-action reports first; master never runs |
| Async validator returned (Promise) | TypeScript blocks at compile time. At runtime: treated as truthy (`{ ok: true }`); console.error suggests using sync only |
| Undo across a `replace-tree` (e.g. root removal callback) | History was cleared at the replace-tree boundary; undo can't cross |
| `maxUndoDepth: 0` | History disabled entirely; undo / redo no-ops |
| Trying to undo when stack is empty | `canUndo()` returns false; `undo()` returns false; no error |
| Edit during active validation rejection | User can edit again; new validation runs against new value |
| Cmd+Z while editing a field | Browser's native textbox undo handles it (we don't intercept inside an active input) |
| Validator sees a stale `tree` | The tree passed is the current pre-commit snapshot; in concurrent React mode there's a guarantee that the dispatched action has already captured the state |
| `clearHistory()` while there are pending validation rejections | History cleared; pending UI errors remain visible until the user dismisses |

---

## 10. Risks & alternatives

### Risks

| Risk | Mitigation |
|---|---|
| **Validators block all editing if buggy** | Document: validator errors are caught; if a validator throws, the action is blocked but the user can keep editing. Suggest TypeScript strict-mode for catching obvious bugs. |
| **Undo memory growth** | `maxUndoDepth` bounds the stack. With structural sharing, snapshots are cheap. Typical 500-node tree: ~50 snapshots ≈ 200KB. |
| **Complex validators slow down editing** | They run on every keystroke during edit-validation cycle (v0.2 already does this for built-in checks). Document: keep host validators O(1) or O(log n); don't traverse the whole tree on every call. |
| **Undo restoring stale collapse state** | Snapshotting collapsed-set is intentional — undoing should put the tree back exactly as it was, including which cards were collapsed. |

### Alternatives considered, rejected

- **Action-replay undo** instead of state-snapshot — requires every action to have a clean inverse, complex for card-move and bulk-remove with their secondary effects. Rejected.
- **Async validators** — adds UI complexity (pending state, race conditions, optimistic updates). Deferred indefinitely per Q14.
- **Will-change events separate from validators** — overlapping concerns; consumer can use validators that always return `{ ok: true }` and do side-effects there if they need notifications. Rejected.
- **Time-window undo merging** (multiple keystrokes within 500ms = one undo step) — rich-card doesn't commit per-keystroke (commit happens on blur/Enter), so this isn't needed. The need would re-emerge if we added typing-as-you-go validation, which we're not.

---

## 11. Plan-stage open questions

8 Q-Ps. None scope-shifting.

| # | Question | My pick | Why |
|---|---|---|---|
| Q-P1 | **Validator API shape** — per-action object (`validators: { fieldEdit, cardAdd, ... }`) vs single master function (`validate: (action, ...) => ...`)? | **Both, in 3-layer pipeline.** Per-action validators run first (typed payloads); master runs as last-pass safety net. | Per-action is ergonomic for the common case; master covers cross-cutting policies (e.g. "no edits during review"). |
| Q-P2 | **Validator rejection visibility** — block the action with inline error (silent for analytics) vs require explicit user dismissal? | **Block with inline error + fire `onValidationFailed`.** Auto-clears when user fixes and retries. | Matches v0.2 sync-validation pattern. No double-dismissal friction. |
| Q-P3 | **Undo strategy** — state-snapshot vs action-replay vs hybrid? | **State-snapshot.** | Simpler with structural sharing. Cheap. Action-replay needs every action to have a clean inverse, which fails for `card-move` (need original position) and `bulk-remove`. |
| Q-P4 | **What's snapshotted in undo** — only the tree, or also UI state (selection, focus, collapse)? | **Tree + collapse + selection + focus.** NOT search query (controlled by host) or drag-transient state. | Without UI state, undoing feels disconnected — "I undid my edit but my selection moved." With it, undo restores the full editing context. |
| Q-P5 | **Default `maxUndoDepth`** — 25, 50, 100, or unbounded? | **50.** | Description Q14 locks 50. Reasonable default. Hosts override. |
| Q-P6 | **Undo affects `version` / `isDirty`?** | **No.** Version monotonically increases; `isDirty()` stays true after undo. | Otherwise, "I undid all changes; component says clean; I save; my work is lost" is a footgun. Hosts who want this call `markClean()` explicitly. |
| Q-P7 | **Default keyboard shortcuts** — bind `Cmd+Z` / `Cmd+Shift+Z` automatically? | **Yes, default-bind.** Disable via `disableUndoShortcuts: true`. | Industry standard. Hosts with their own undo handling opt out. |
| Q-P8 | **Ship a default `<UndoToolbar>` sibling export?** | **Yes.** Tiny file (~80 lines). Hosts who want their own UI just don't import it. | Same pattern as v0.3's `<RichCardSearchBar>`. Symmetric. |

---

## 12. Definition of "done" for THIS document (stage gate)

Before any code or scaffolding:

- [ ] User reads §1–§10 and §11 (plan-stage Qs).
- [ ] Each Q-P1 through Q-P8 has either an "agreed" or override answer.
- [ ] User explicitly says **"plan approved"** — this unlocks Stage 3 (v0.4 implementation).

After sign-off, the next session starts with:

1. Update STATUS.md: bump rich-card target version to 0.4.0; add v0.4 in-flight entry.
2. Implement against this plan, file by file. Suggested order:
   1. **Types first** — extend `types.ts` with 4 validator types + 7 new props + 5 new handle methods.
   2. **Validation pipeline** — `lib/validators.ts` (pure 3-layer pipeline runner).
   3. **Reducer** — extend `lib/reducer.ts` with `undoStack` / `redoStack` state slots + 3 new actions (`undo`, `redo`, `clear-history`); snapshot-and-trim on every commit.
   4. **Hook** — `hooks/use-undo.ts` (memoized canUndo / canRedo selectors; default keyboard binding).
   5. **Toolbar part** — `parts/undo-toolbar.tsx` (sibling export).
   6. **Wire into `rich-card.tsx`** — validators in dispatchers (3-layer pipeline), undo / redo handlers, keyboard listener, expanded imperative handle, `onValidationFailed` event firing.
   7. **Update `demo.tsx`** — add a validator example (e.g. "field 'priority' must be 1–5"), undo / redo buttons via `<UndoToolbar>`, mark-clean reset.
   8. **Update guide and STATUS** — guide gets v0.4 features section; STATUS gets shipped entry.
3. Verify with `pnpm tsc --noEmit`, `pnpm lint`, `pnpm build`.
4. Manual browser smoke test at `/components/rich-card`: validation rejection visible inline, `Cmd+Z` undoes a field edit, `Cmd+Shift+Z` redoes, multi-action undo across bulk operations works as one step.

If at any point during implementation a plan decision turns out wrong, **stop, document the issue, ask before deviating**. The plan is the contract; deviations are loud, not silent.
