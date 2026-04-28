# `rich-card` — Pro-component Guide (Stage 3)

> **Stage:** 3 of 3 · **Status:** Aligned with shipped v0.4.0 (2026-04-28) · **Maturity: beta**
> **Slug:** `rich-card` · **Category:** `data` · **Version:** 0.4.0 (beta)
> **Source:** [src/registry/components/data/rich-card/](../../../src/registry/components/data/rich-card/) — 56 files
> **Demo route:** `/components/rich-card`
> **Procomp planning trail:** [description](rich-card-procomp-description.md) · [v0.1 plan](rich-card-procomp-plan.md) · [v0.2 plan](rich-card-procomp-plan-v0.2.md) · [v0.3 plan](rich-card-procomp-plan-v0.3.md) · [v0.4 plan](rich-card-procomp-plan-v0.4.md)

This guide is the **complete developer reference** for `RichCard` v0.4. Every feature, prop, gotcha, composition pattern, and behavior the component supports — in one place. If you're integrating, customizing, or porting `RichCard` into another codebase, this is your map.

---

## 1. What it is

`RichCard` is a JSON-driven recursive card-tree component for hierarchical structured content. It is — in one component — a **viewer**, **inline editor**, **structural manager**, and **safety net**:

- **Viewer**: render any JSON object as a navigable card tree with typed scalar field rendering, five styled content blocks (`codearea` / `image` / `table` / `quote` / `list`), per-card meta, per-level visual hierarchy, and full ARIA tree accessibility.
- **Editor (v0.2)**: click-to-edit field values, keys, card titles, predefined-key blocks, and meta entries. Hover-× to remove. "+" affordances to add. Sync built-in validation (reserved keys, sibling collisions, predefined shapes). Granular change events. Dirty tracking.
- **Structural manager (v0.3)**: drag-drop reordering with two scopes (same-level + cross-level) via `@dnd-kit`, bulk multi-select (shift-click range + cmd-click toggle), per-level/per-card/per-predefined-key/per-field-type permission matrix with predicate escape hatches, `__rcmeta.locked` cascade lock, custom predefined-key registration, opt-in virtualization for trees > 500 nodes via `@tanstack/react-virtual`, native data-model search that finds matches in collapsed subtrees / virtualized off-screen cards / meta entries, inline meta editing with custom renderers + audit trail, root-removal opt-in, promote-on-delete with configurable collision strategy.
- **Safety net (v0.4)**: host-supplied sync validation hooks (3-layer pipeline: built-in → per-action → master) with `onValidationFailed` event, per-commit undo/redo with state-snapshot strategy + structural sharing + 50-step default history, `Cmd+Z` / `Cmd+Shift+Z` / `Cmd+Y` keyboard shortcuts.

Markdown source/serialization is **intentionally not in `rich-card`**. A v0.5 markdown adapter is deferred indefinitely as a separate companion module operating on the JSON model.

---

## 2. When to use / when NOT to use

### Use when

- Your data is **JSON-shaped, hierarchical, mixed-content** (flat fields + rich blocks + nested cards)
- You want a **card-tree visualization** with optional inline editing and structural manipulation
- You need **keyboard + screen-reader accessibility** out of the box
- You're displaying or authoring agent traces, configuration trees, decision records (ADRs), runbooks, requirement docs, postmortems, schema-driven dashboards, research outlines, or any "outline with content under each heading"

### Skip when

- Your data is flat (use `data-table`)
- You need rich-text prose editing inside flat fields (use a markdown editor)
- You need a free-form whiteboard / graph (cards have one parent — no graphs)
- You need **markdown source-of-truth** today (intentionally dropped — wait for v0.5 companion adapter)

---

## 3. Installation

### 3.1 Inside the ilinxa-ui-pro repo

```tsx
import { RichCard } from "@/registry/components/data/rich-card";
```

### 3.2 Porting into another project

Zero `next/*` imports, zero app-context coupling. To copy:

1. **Copy the folder** [src/registry/components/data/rich-card/](../../../src/registry/components/data/rich-card/) into your project's component tree.
2. **Update import paths** if your aliases differ. The component imports:
   - `react` (peer)
   - `@/components/ui/popover` (shadcn)
   - `@/lib/utils` (`cn()` helper)
   - `lucide-react`
   - `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities`
   - `@tanstack/react-virtual` (only loaded when `virtualize` is on)
3. **Install shadcn primitives**: `npx shadcn@latest add popover separator`
4. **Install npm peers**:
   ```bash
   npm install lucide-react @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities @tanstack/react-virtual
   ```
5. **Verify Tailwind v4 semantic tokens** (`--card`, `--muted`, `--border`, `--primary`, `--ring`, `--destructive`, etc.). Override defaults via `levelStyles` if your token set differs.

That's it. No bundler config, no runtime initialization.

---

## 4. Quick start

### 4.1 Read-only viewer

```tsx
<RichCard
  defaultValue={{
    title: "ADR-0042",
    status: "accepted",
    priority: 2,
    codearea: { format: "ts", content: "const x = 1;" },
    context: { reason: "performance" },
  }}
/>
```

### 4.2 Editable

```tsx
<RichCard
  defaultValue={data}
  editable
  onChange={(tree) => persistToBackend(tree)}
/>
```

### 4.3 Full feature set

```tsx
import {
  RichCard,
  RichCardSearchBar,
  RichCardUndoToolbar,
  type RichCardHandle,
  type RichCardValidators,
} from "@/registry/components/data/rich-card";

const ref = useRef<RichCardHandle>(null);
const [query, setQuery] = useState("");
const [canUndo, setCanUndo] = useState(false);
const [canRedo, setCanRedo] = useState(false);

const validators: RichCardValidators = {
  fieldEdit: (event) => {
    if (event.key === "priority" && typeof event.newValue === "number") {
      if (event.newValue < 1 || event.newValue > 5) {
        return { ok: false, errors: [{ code: "out-of-range", message: "Priority must be 1–5." }] };
      }
    }
    return { ok: true };
  },
};

return (
  <>
    <RichCardSearchBar
      value={query}
      onChange={setQuery}
      matchCount={result?.matches.length ?? 0}
      activeIndex={result?.activeIndex ?? null}
      onNext={() => ref.current?.findNext()}
      onPrevious={() => ref.current?.findPrevious()}
      onClear={() => { setQuery(""); ref.current?.clearSearch(); }}
    />
    <RichCardUndoToolbar
      canUndo={canUndo}
      canRedo={canRedo}
      onUndo={() => ref.current?.undo()}
      onRedo={() => ref.current?.redo()}
    />
    <RichCard
      ref={ref}
      defaultValue={data}
      editable
      dndScopes={{ sameLevel: true, crossLevel: true }}
      validators={validators}
      search={{ query }}
      virtualize="auto"
      onChange={() => {
        setCanUndo(ref.current?.canUndo() ?? false);
        setCanRedo(ref.current?.canRedo() ?? false);
      }}
    />
  </>
);
```

---

## 5. Data model

### 5.1 The `RichCardJsonNode` shape

```ts
type RichCardJsonNode = {
  __rcid?: string;                                  // auto-attached if absent
  __rcorder?: number;                               // auto-attached if absent
  __rcmeta?: Record<string, FlatFieldValue>;        // hidden by default
  [key: string]: unknown;                           // flat fields, predefined values, child nodes
};
```

The parser routes each non-reserved property to one of four buckets:

| Bucket | Trigger | Renders as |
|---|---|---|
| **Reserved** | Key is `__rcid` / `__rcorder` / `__rcmeta` | Stripped (used for identity / order / meta) |
| **Predefined** | Key matches a built-in (`codearea` / `image` / `table` / `quote` / `list`) OR a custom-key (v0.3) — and not in `disabledPredefinedKeys` | A typed content block |
| **Field** | Value is a JSON scalar (string / number / boolean / null) | A key-value row in the card body |
| **Child** | Value is a non-array, non-null object | A nested card |

Arrays at child positions are **rejected** with a console warning at parse time (use object-keyed children, or the `list` predefined key for scalar arrays).

### 5.2 Reserved keys

| Key | Type | Purpose |
|---|---|---|
| `__rcid` | `string` | Stable card identity. Auto-generated via `crypto.randomUUID()` if absent. |
| `__rcorder` | `number` | Sibling order; integer; gaps allowed. |
| `__rcmeta` | `Record<string, FlatFieldValue>` | Per-card hidden metadata. Exposed via `metaPresentation` prop. **`__rcmeta.locked: true` cascades read-only to the card and all descendants** (v0.3). |

### 5.3 Flat-field types

| Type | Trigger | Rendering |
|---|---|---|
| `string` | `typeof === 'string'` | Plain text |
| `number` | `typeof === 'number'` and `Number.isFinite()` | Right-aligned mono `tabular-nums` |
| `boolean` | `typeof === 'boolean'` | Check icon for `true`, dash for `false` |
| `date` | String matches ISO-8601 regex AND `Date.parse()` is valid | Formatted via `Intl.DateTimeFormat` |
| `null` | Literal `null` | Em-dash in muted color (read-only in editor) |

**Date detection** (`dateDetection` prop): `'auto'` (default) / `'never'` / `(value) => boolean` custom predicate.

### 5.4 Predefined-key blocks

| Key | Required shape | Rendering |
|---|---|---|
| `codearea` | `{ format: string; content: string }` | Bordered figure with format-label header + monospace `<pre>` |
| `image` | `{ src: string; alt?: string }` | Lazy-loaded `<img>` with caption when alt present |
| `table` | `{ headers: string[]; rows: FlatFieldValue[][] }` | Bordered table with mono uppercase headers |
| `quote` | `string` | Italic blockquote with primary-colored start border |
| `list` | `FlatFieldValue[]` | Bulleted list (booleans / numbers / null per their flat-field rules) |

Invalid shapes drop the entry at parse with a console warning. Add the key name to `disabledPredefinedKeys` to use it as a flat-field name instead.

### 5.5 Children

Any non-reserved, non-predefined property whose value is a **non-array, non-null object** becomes a child card. The property name is stored as `parentKey` for round-trip.

**Arrays of objects are rejected** (locked Q-P4). Convert to object-keyed form first.

### 5.6 Per-card meta

```tsx
{
  __rcmeta: {
    author: "Hessam",
    started: "2026-01-15",
    pages: 87,
    submitted: false,
    grade: null,
    locked: true,    // structurally significant in v0.3 — cascades read-only
  },
}
```

Meta values must be scalars. Surface via `metaPresentation` prop (§11). Edit inline via popover/inline modes (§12 below).

---

## 6. Field types — JSON example

```jsonc
{
  "status": "accepted",
  "priority": 2,
  "score": 0.92,
  "approved": true,
  "submitted": false,
  "deadline": "2026-06-15",
  "started_at": "2026-04-28T09:30:00Z",
  "grade": null
}
```

---

## 7. Predefined keys — JSON examples

```jsonc
{
  "codearea": { "format": "ts", "content": "const x = 1;" },
  "image":    { "src": "https://example.com/x.png", "alt": "diagram" },
  "table":    {
    "headers": ["metric", "before", "after"],
    "rows":    [["dev-time", 21, 2], ["a11y-score", 76, 98]]
  },
  "quote":    "Adopt OKLCH for all design tokens.",
  "list":     ["structured-content", "json-native", "accessible"]
}
```

### 7.1 Custom predefined keys (v0.3)

Register additional content blocks at mount via `customPredefinedKeys`:

```tsx
import type { CustomPredefinedKey } from "@/registry/components/data/rich-card";

const metricKey: CustomPredefinedKey = {
  key: "metric",
  description: "A KPI value with unit",
  category: "stats",
  defaultValue: () => ({ value: 0, unit: "" }),
  validate: (v) => {
    const ok = typeof v === "object" && v !== null
      && typeof (v as any).value === "number"
      && typeof (v as any).unit === "string";
    return ok ? { ok: true } : {
      ok: false,
      errors: [{ code: "shape-mismatch", message: "metric must be { value, unit }" }],
    };
  },
  render: (value, ctx) => <MyMetricBlock value={value} cardId={ctx.cardId} />,
  edit: (value, save, cancel) => <MyMetricEditor value={value} onSave={save} onCancel={cancel} />,
};

<RichCard defaultValue={data} customPredefinedKeys={[metricKey]} editable />
```

If `edit` is omitted, the editor falls back to a JSON-textarea. Mount-only registration — runtime conflicts (same name as built-in) are rejected with a console error.

---

## 8. Props reference (full)

```ts
type RichCardProps = {
  // Required
  defaultValue: RichCardJsonNode;

  // Styling (v0.1)
  levelStyles?: LevelStyle[];
  getLevelStyle?: (level: number) => LevelStyle;
  predefinedKeyStyles?: Partial<Record<PredefinedKey | string, string | LevelStyle>>;

  // Viewer behavior (v0.1)
  defaultCollapsed?: 'all' | 'none' | ((level: number) => boolean);
  metaPresentation?: 'hidden' | 'inline' | 'popover';
  disabledPredefinedKeys?: PredefinedKey[];
  dateDetection?: 'auto' | 'never' | ((value: string) => boolean);

  // Editor (v0.2)
  editable?: boolean;
  onChange?: (tree: RichCardJsonNode) => void;
  onFieldEdited?: (event: FieldEditedEvent) => void;
  onFieldAdded?: (event: FieldAddedEvent) => void;
  onFieldRemoved?: (event: FieldRemovedEvent) => void;
  onCardAdded?: (event: CardAddedEvent) => void;
  onCardRemoved?: (event: CardRemovedEvent) => void;
  onCardRenamed?: (event: CardRenamedEvent) => void;
  onPredefinedAdded?: (event: PredefinedAddedEvent) => void;
  onPredefinedEdited?: (event: PredefinedEditedEvent) => void;
  onPredefinedRemoved?: (event: PredefinedRemovedEvent) => void;
  onSelectionChange?: (ids: readonly string[]) => void;     // v0.3 multi-select shape

  // Structural management (v0.3)
  dndScopes?: DndScopes;
  permissions?: RichCardPermissions;
  canEditField?: (cardId: string, key: string) => boolean;
  canAddField?: (cardId: string) => boolean;
  canRemoveField?: (cardId: string, key: string) => boolean;
  canEditCard?: (cardId: string) => boolean;
  canAddCard?: (parentId: string) => boolean;
  canRemoveCard?: (cardId: string) => boolean;
  canEditPredefined?: (cardId: string, key: string) => boolean;
  canAddPredefined?: (cardId: string, key: string) => boolean;
  canRemovePredefined?: (cardId: string, key: string) => boolean;
  canDragCard?: (cardId: string) => boolean;
  canDropCard?: (cardId: string, targetParentId: string) => boolean;
  onPermissionDenied?: (action, cardId, target, reason) => void;
  customPredefinedKeys?: CustomPredefinedKey[];
  virtualize?: boolean | 'auto';
  allowRootRemoval?: boolean;
  onRootRemoved?: (current: RichCardJsonNode) => RichCardJsonNode | null;
  defaultDeletePolicy?: 'cascade' | 'promote';
  promoteCollisionStrategy?: 'suffix' | 'qualify' | 'reject';
  emptyTreeRenderer?: () => ReactNode;
  metaRenderers?: Record<string, MetaRenderer>;
  auditTrail?: AuditTrailConfig;
  onCardMoved?: (event: CardMovedEvent) => void;
  onCardDuplicated?: (event: CardDuplicatedEvent) => void;
  onMetaChanged?: (event: MetaChangedEvent) => void;
  onMetaAdded?: (event: MetaAddedEvent) => void;
  onMetaRemoved?: (event: MetaRemovedEvent) => void;
  search?: SearchOptions;
  onSearchResults?: (result: SearchResult) => void;

  // Safety net (v0.4)
  validators?: RichCardValidators;
  validate?: RichCardMasterValidator;
  onValidationFailed?: (event: ValidationFailedEvent) => void;
  maxUndoDepth?: number;                               // default 50
  disableUndoShortcuts?: boolean;
  onUndo?: () => void;
  onRedo?: () => void;

  // Container
  className?: string;
  'aria-label'?: string;                                // default "Rich card"
};
```

That's **1 required prop + 53 optional**. Most are no-ops you'll never pass. The default behavior (no props except `defaultValue`) is a clean read-only viewer.

---

## 9. Imperative API (`RichCardHandle`)

```tsx
const ref = useRef<RichCardHandle>(null);
<RichCard ref={ref} defaultValue={...} />
```

| Method | Returns | Phase | Notes |
|---|---|---|---|
| `getValue()` | `string` | v0.1 | Canonical pretty-printed JSON (with auto-IDs). |
| `getTree()` | `RichCardJsonNode` | v0.1 | Object form. |
| `isDirty()` | `boolean` | v0.2 | True if any commit since mount or last `markClean()`. **Stays true after undo** (v0.4). |
| `markClean()` | `void` | v0.2 | Snapshot current state as new clean baseline. |
| `getSelectedId()` | `string \| null` | v0.2 | First selected card's id (back-compat). |
| `getSelectedIds()` | `readonly string[]` | v0.3 | All selected card ids. |
| `setSelection(ids)` | `void` | v0.3 | Single id, array, or null to clear. |
| `focusCard(id)` | `void` | v0.3 | Programmatic keyboard focus. |
| `addCardAt(parentId)` | `string` | v0.3 | Returns new card id. |
| `removeCard(id)` | `void` | v0.3 | Cascade. |
| `replaceRoot(newRoot)` | `void` | v0.3 | `null` → empty placeholder. |
| `getEffectivePermissions(cardId, target?)` | `EffectivePermissions` | v0.3 | Resolves the 7-layer cascade for debugging / host-side gating. |
| `findNext()` | `SearchMatch \| null` | v0.3 | Advance to next search match + scroll into view. |
| `findPrevious()` | `SearchMatch \| null` | v0.3 | Reverse direction. |
| `scrollToMatch(match)` | `void` | v0.3 | Scroll a specific match into view. |
| `clearSearch()` | `void` | v0.3 | Restores user-collapsed state. |
| `undo()` | `boolean` | v0.4 | Returns true if undo happened. |
| `redo()` | `boolean` | v0.4 | Returns true if redo happened. |
| `canUndo()` | `boolean` | v0.4 | |
| `canRedo()` | `boolean` | v0.4 | |
| `clearHistory()` | `void` | v0.4 | Wipes both undo and redo stacks. |

---

## 10. Styling

### 10.1 Per-level styling

```ts
type LevelStyle = {
  containerClassName?: string;
  headerClassName?: string;
  fieldsClassName?: string;
  childrenClassName?: string;
};
```

**Default (6 levels, minimal x-padding, semantic tokens only):**

| Level | Default container chrome |
|---|---|
| 1 | `rounded-xl border border-border bg-card px-3 py-3 shadow-sm` |
| 2 | `rounded-lg border border-border bg-muted/30 px-3 py-2.5` |
| 3 | `rounded-md border border-border/70 bg-muted/20 px-2.5 py-2` |
| 4 | `rounded-md border border-border/50 bg-muted/15 px-2 py-2` |
| 5 | `rounded-sm border border-border/40 bg-muted/10 px-2 py-1.5` |
| 6+ | `rounded-sm border border-dashed border-border/30 px-2 py-1.5` |

Override via `levelStyles?: LevelStyle[]` (last entry repeats deeper) or `getLevelStyle?: (level) => LevelStyle` for full programmatic control.

### 10.2 Per-predefined-key styling

```tsx
<RichCard
  defaultValue={data}
  predefinedKeyStyles={{
    codearea: "bg-zinc-900 text-zinc-100",
    quote: "border-l-4 border-amber-500",
    metric: { containerClassName: "bg-emerald-500/10" },   // custom key
  }}
/>
```

---

## 11. Meta presentation modes

| Mode | Render |
|---|---|
| `'hidden'` (default) | Not shown (still survives round-trip). |
| `'inline'` | Truncated mono strip in card header. Click any value to edit. |
| `'popover'` | `Info` icon button → shadcn `Popover` with full meta `<dl>`. In edit mode the popover swaps to a full meta-edit form (add / edit / remove). |

### 11.1 Custom meta renderers (v0.3)

```tsx
import type { MetaRenderer } from "@/registry/components/data/rich-card";

const tagsRenderer: MetaRenderer = (value, ctx) => {
  if (typeof value !== "string") return String(value);
  return (
    <div className="flex flex-wrap gap-1">
      {value.split(",").map((tag) => (
        <span key={tag} className="rounded-full bg-primary/10 px-2 py-0.5 text-xs">
          {tag.trim()}
        </span>
      ))}
    </div>
  );
};

<RichCard
  defaultValue={data}
  metaPresentation="popover"
  metaRenderers={{ tags: tagsRenderer }}
/>
```

### 11.2 Audit trail (v0.3)

`auditTrail?: { editor?: string; lastEditedKey?: string; lastEditorKey?: string }`

When set, every commit auto-stamps `__rcmeta._lastEdited` (ISO timestamp) and `__rcmeta._lastEditor` (the supplied editor string) on the changed card. Default keys can be customized.

---

## 12. v0.2 inline editing reference

### 12.1 Edit triggers (single-click)

| Click target | Action |
|---|---|
| Field value (in editor mode) | Type-aware input swap (text / number / checkbox / native date input) |
| Field key | Rename input (with collision validation) |
| Card title (the parentKey) | Rename input |
| Predefined block | Inline editor for that block type |
| Meta value (in popover) | Inline edit |

### 12.2 Commit / cancel

- **Enter** or blur → commit
- **Escape** → cancel
- **Boolean toggle** → commits immediately on toggle (no Enter)
- **Tentative cards** (just-added via "+ child"): Escape removes the card

### 12.3 Add affordances (hover-revealed in edit mode)

- **+ field** at the bottom of the field list → inline form (key + type selector + value)
- **+ block** → menu of available predefined keys (filtered to only show keys not already present + not disabled)
- **+ child** → adds a tentative "untitled" card and auto-enters title edit

### 12.4 Remove affordances

- Hover-× on field rows
- Hover-× on predefined-block headers
- "..." menu on cards in edit mode (Remove cascade / Remove (promote children) / Duplicate)
- Bulk delete via toolbar when ≥ 2 cards selected (v0.3)

### 12.5 Type-changing

**Not supported.** `string` stays a string on edit. To change type, remove + re-add. (v0.4 candidate.)

### 12.6 Null fields

**Read-only.** Click does nothing. Remove + re-add to replace.

---

## 13. Selection model

### 13.1 Selection ≠ focus

| Concept | Source | Lifetime | Reflected in |
|---|---|---|---|
| **Focus** | Keyboard (arrows) | Transient | `tabIndex` |
| **Selection** | Click on card chrome | Persistent | `aria-selected` + ring overlay |

### 13.2 Multi-select (v0.3)

| Gesture | Behavior |
|---|---|
| Click | Replace selection with single id |
| Shift+Click | Range select from anchor to clicked card |
| Cmd/Ctrl+Click | Toggle id in/out of selection |
| Click outside any card | Clear selection |

### 13.3 `<BulkToolbar>` (auto-renders when ≥ 2 selected, in editor mode)

Shows: `count cards · L<min>–L<max> · X fields · Y locked` plus action buttons:
- **set field** (popover with key + type + value → applies to all selected)
- **toggle lock** (flips `__rcmeta.locked`)
- **duplicate**
- **delete** (atomic — counts as one undo step)

### 13.4 `onSelectionChange`

⚠ **Breaking change in v0.3** — signature shifted from `(id: string | null) => void` to `(ids: readonly string[]) => void`.

Migration: `onSelectionChange={(ids) => setSelected(ids[0] ?? null)}`.

---

## 14. Validation (v0.2 + v0.4)

Three layers run **synchronously** before every commit. Any layer rejecting blocks the action.

### 14.1 Built-in validators (v0.2 — always on)

| Action | Built-in checks |
|---|---|
| Field key edit / add | Reserved key collision; predefined-key collision (unless disabled); sibling key collision; non-empty |
| Field value edit / add | Type matches expected; ISO-8601 validity for `date` |
| Card rename | Same key rules as field-key, applied to `parentKey` |
| Card move | Cycle prevention (target can't be source's descendant); not the root |
| Card remove | Card exists; not the root (unless `allowRootRemoval`) |
| Predefined add / edit | Shape validation per key |
| Meta add | Reserved key check; sibling collision; scalar value |
| Meta edit | Scalar value |

### 14.2 Per-action validators (v0.4 — host-supplied, optional)

```ts
type RichCardValidators = {
  fieldEdit?: (event, tree) => RichCardValidationResponse;
  fieldAdd?: ...;
  cardAdd?: ...;
  cardRemove?: ...;
  cardMove?: ...;
  // ... all 14 action types covered
};

type RichCardValidationResponse =
  | { ok: true }
  | { ok: false; errors: { code: string; message: string }[] };
```

Each receives the typed event payload + the current tree (read-only). Returning `{ ok: false; errors }` blocks the action and surfaces errors to the editor.

### 14.3 Master validator (v0.4 — host-supplied, optional, runs last)

```ts
validate?: (action: { type: string; cardId?: string }, tree: RichCardJsonNode) => RichCardValidationResponse;
```

Catch-all. Useful for cross-cutting policies like "no edits while tree is in review status."

### 14.4 Failure UX

- Action does NOT commit
- `<InlineError>` shows messages below the affected input
- `onValidationFailed?: (event) => void` fires with `{ action, cardId, errors, layer }` (`layer` = `'per-action'` or `'master'`)
- Edit mode remains open so user can fix and retry

### 14.5 Throwing validators

If a validator throws, the action is blocked and the error becomes a `validator-error` code. Documented; not a fatal pattern but noisy in the console.

### 14.6 Built-in error codes

`empty-key`, `reserved-key`, `predefined-key`, `sibling-key-collision`, `sibling-collision`, `meta-key-collision`, `type-mismatch`, `invalid-date`, `invalid-meta-value`, `no-null-add`, `no-card`, `no-field`, `no-meta-key`, `no-root-remove`, `no-root-move`, `self-parent`, `cycle`, `shape-mismatch`, `json-parse`. Host validators should use a `host-` prefix to avoid future clashes.

---

## 15. Change events

### 15.1 Granular events (per-action)

Every commit-action fires its event after state updates:

| Event | Payload |
|---|---|
| `onFieldEdited` | `{ cardId, key, oldValue, oldType, newValue, newType }` |
| `onFieldAdded` | `{ cardId, key, value, type }` |
| `onFieldRemoved` | `{ cardId, key, oldValue, oldType }` |
| `onCardAdded` | `{ parentId, card }` |
| `onCardRemoved` | `{ cardId, removed, parentId }` (full subtree for host-side undo) |
| `onCardRenamed` | `{ cardId, oldKey, newKey }` |
| `onCardMoved` | `{ cardId, oldParentId, newParentId, oldOrder, newOrder }` |
| `onCardDuplicated` | `{ sourceCardId, newCardId, parentId }` |
| `onPredefinedAdded` / `Edited` / `Removed` | `{ cardId, key, value / oldValue / newValue }` |
| `onMetaChanged` / `MetaAdded` / `MetaRemoved` | `{ cardId, key, oldValue / value }` |
| `onSelectionChange` | `(ids: readonly string[])` |
| `onValidationFailed` | `{ action, cardId, errors, layer }` |

### 15.2 Coarse `onChange(tree)`

Fires after every commit-action with the canonical post-state tree. Bulk operations fire **per-card events** + a single coarse `onChange`.

### 15.3 Order

1. Built-in validation
2. Per-action validator
3. Master validator
4. Reducer commits
5. **Granular event fires**
6. **`onChange(tree)` fires**
7. Undo snapshot pushed
8. `onSelectionChange` fires (if selection changed)

`onSearchResults` is **not** a commit event — it fires whenever search results change without affecting `version` or `isDirty`.

---

## 16. Drag-drop reordering (v0.3)

### 16.1 Two scopes

```tsx
<RichCard
  editable
  dndScopes={{ sameLevel: true, crossLevel: true }}    // both default true when editable
/>
```

- **`sameLevel`** — reorder within the same parent (drop near a sibling's edge)
- **`crossLevel`** — reparent (drop into a card's body → becomes last child)

Drop intent inferred from pointer position relative to the target card's bounding rect:
- Upper 25% → before sibling (same-level)
- Lower 25% → after sibling (same-level)
- Middle 50% → into card (cross-level)

### 16.2 Affordances

- **Drag handle** — small grip icon in card header (visible only in edit mode)
- **Cycle prevention** — dropping into a descendant is silently rejected
- **Drag threshold** — 6px pointer movement before drag activates (prevents accidental drag-on-click for editing)
- **Permission gating** — `canDragCard(id)` blocks drag start; `canDropCard(id, targetParentId)` blocks drop
- **Keyboard alternative** — built into `@dnd-kit`: Space to grab, arrow keys to move, Space to drop, Escape to cancel

### 16.3 Multi-card drag

When ≥ 2 cards are selected and you start dragging one, the whole selection moves as a group (descendants of selected ancestors are deduplicated).

---

## 17. Permission system (v0.3)

7-layer resolution, most-specific wins:

1. **Predicate predicates** (`canEditField`, `canAddCard`, etc.) — host functions, top priority
2. **`__rcmeta.locked: true`** — read-only cascade for the card and all descendants
3. **Per-card** (`permissions.byCard[id]`)
4. **Per-predefined-key** (`permissions.byPredefinedKey[key]`)
5. **Per-field-type** (`permissions.byFieldType[type]`)
6. **Per-level** (`permissions.byLevel[level]`)
7. **Default** (`permissions.default`)
8. **Global `editable`** — false denies everything

### 17.1 Declarative shape

```ts
type PermissionRule = {
  edit?: boolean;
  add?: boolean;
  remove?: boolean;
  reorder?: boolean;
  reparent?: boolean;
};

type RichCardPermissions = {
  default?: PermissionRule;
  byLevel?: Record<number, PermissionRule>;
  byCard?: Record<string, PermissionRule>;
  byPredefinedKey?: Partial<Record<PredefinedKey, PermissionRule>>;
  byFieldType?: Partial<Record<FlatFieldType, PermissionRule>>;
  inherit?: boolean;       // when true, descendants inherit ancestor's `false` flags
};
```

### 17.2 Predicate functions (escape hatches)

11 fine-grained predicates: `canEditField`, `canAddField`, `canRemoveField`, `canEditCard`, `canAddCard`, `canRemoveCard`, `canEditPredefined`, `canAddPredefined`, `canRemovePredefined`, `canDragCard`, `canDropCard`. Each returns boolean. Predicates take precedence over declarative rules.

### 17.3 Locked cards (`__rcmeta.locked`)

When a card has `__rcmeta.locked === true`, the card and **all descendants** become read-only:
- No edit affordances
- No drag handle
- No add/remove buttons
- A small `Lock` icon appears next to the title
- `aria-readonly` data attribute (for styling hooks)

### 17.4 Denial reasons

`onPermissionDenied?: (action, cardId, target, reason) => void` fires when an action is blocked. `reason` is one of: `global-editable-false`, `meta-locked`, `by-card`, `by-predefined-key`, `by-field-type`, `by-level`, `default`, `predicate`. Useful for analytics / inline tooltips.

### 17.5 Effective-permissions inspector

```ts
ref.current?.getEffectivePermissions(cardId, { kind: "field", key: "priority" });
// → { edit: false, add: true, remove: true, reorder: false, reparent: false, reason: 'meta-locked' }
```

---

## 18. Virtualization (v0.3)

### 18.1 Modes

| `virtualize` | Behavior |
|---|---|
| `false` (default) | Nested rendering — every card in DOM. `Ctrl+F` works. Best for ≤ 500 nodes. |
| `true` | Flat-list rendering with `position: absolute` + `aria-level` for hierarchy. ~30 cards in DOM at any time. |
| `'auto'` | Auto-enables when tree exceeds 500 nodes |

### 18.2 Trade-offs of virtualized mode

- ✅ Handles 5000+ node trees at 60fps
- ❌ Browser `Ctrl+F` only finds visible cards — **use the native search** (§19) instead, which works regardless
- ❌ Some screen readers expect all `treeitem` siblings in DOM; we set `aria-rowcount` + `aria-rowindex` to compensate

### 18.3 Dynamic loading

`@tanstack/react-virtual` is dynamically imported only when `virtualize: true` (or auto-resolved to true). Bundle stays lean for the default case.

---

## 19. Native search (v0.3)

### 19.1 Controlled by host

```tsx
const [query, setQuery] = useState("");
const [result, setResult] = useState<SearchResult | null>(null);

<RichCardSearchBar
  value={query}
  onChange={setQuery}
  matchCount={result?.matches.length ?? 0}
  activeIndex={result?.activeIndex ?? null}
  onNext={() => ref.current?.findNext()}
  onPrevious={() => ref.current?.findPrevious()}
  onClear={() => { setQuery(""); ref.current?.clearSearch(); }}
/>
<RichCard ref={ref} defaultValue={data} search={{ query }} onSearchResults={setResult} />
```

### 19.2 What gets searched

| `SearchOptions` flag | Default | Searches |
|---|---|---|
| `matchTitles` | `true` | `parentKey` (card title) |
| `matchKeys` | `true` | Field key names |
| `matchValues` | `true` | Flat-field values (string content; numeric/boolean/null stringified) |
| `matchPredefined` | `true` | Codearea content+format, image src+alt, table headers+cells, quote text, list items |
| `matchMeta` | `true` | Meta keys + values (regardless of `metaPresentation` setting) |

Custom predefined-keys are skipped in v0.3 search (Q-P15 deferred). `searchableText: (value) => string[]` on `CustomPredefinedKey` is a v0.4+ candidate.

### 19.3 Auto-expand path-to-match

When matches change, the parser walks ancestors of every matched card and removes them from `state.collapsed`. The user's manual collapse state is preserved separately as `userCollapsed` and restored when the search clears.

### 19.4 `<MatchHighlight>` integration

Every text-rendering location (card title, field key, field value, predefined-key blocks, meta values) wraps its text in `<MatchHighlight>` which renders matched substrings in `<mark>` elements. Active match (the one navigated to via `findNext`) gets distinct active styling.

### 19.5 Virtualization-safe

Native search walks the data model (not the DOM), so it finds matches in virtualized off-screen cards. `scrollToMatch` works in both nested and flat rendering modes.

### 19.6 Keyboard

`<RichCardSearchBar>` binds `F3` / `Shift+F3` for next/previous. Cmd+G / Cmd+Shift+G also bound. **Cmd+F is NOT intercepted** — browser's native find is preserved (Q-P14 lock).

---

## 20. Root removal + delete policy (v0.3)

### 20.1 Root removal opt-in

```tsx
<RichCard
  defaultValue={data}
  editable
  allowRootRemoval
  onRootRemoved={(currentTree) => currentTree.section1 ?? null}
  emptyTreeRenderer={() => <p>No content yet.</p>}
/>
```

When the user triggers root remove (now enabled in "..." menu when `allowRootRemoval`), the host's `onRootRemoved` is called with the current tree. The host returns:
- A `RichCardJsonNode` → that becomes the new root
- `null` → empty-tree state, renders `<EmptyTreePlaceholder>` (or your custom `emptyTreeRenderer`)

### 20.2 Promote-on-delete

```tsx
<RichCard
  defaultDeletePolicy="promote"
  promoteCollisionStrategy="suffix"     // 'suffix' (default), 'qualify', or 'reject'
/>
```

- **`'cascade'`** (default) — children deleted with the card
- **`'promote'`** — children promoted up to the deleted card's parent; per-deletion override available via `dispatchers.cardRemove(id, 'promote')` from host code OR via the "..." menu's "Remove (promote children)" option

Collision resolution when a promoted child's `parentKey` collides with a sibling at the new level:
- **`'suffix'`** → append `_2`, `_3`, etc.
- **`'qualify'`** → prefix with the deleted card's parentKey: `removedName_x`
- **`'reject'`** → block the promotion entirely with an error

---

## 21. Undo / redo (v0.4)

### 21.1 What's undoable

Tree mutations only:
- Field add / edit / remove
- Card add / remove / rename / duplicate / move
- Predefined add / edit / remove
- Meta add / edit / remove
- Bulk-remove (one undo step restores all removed cards)

NOT undoable: selection, focus, search query, drag-transient, collapse changes (UI state).

Wait — collapse IS snapshotted and restored on undo. Adding for clarity:

| Action | In undo snapshot? |
|---|---|
| Tree mutation | ✅ |
| Collapse / expand | ✅ (restored on undo) |
| Selection | ✅ (restored on undo) |
| Focus | ✅ (restored on undo) |
| Search query | ❌ (controlled by host) |
| Drag transient (`drag-start`/`drag-end`) | ❌ |
| `replace-tree` (root replacement) | ❌ — clears history |

### 21.2 Stack mechanics

State-snapshot strategy with structural sharing. Each commit-action pushes the *pre-commit* state to `undoStack` and clears `redoStack`. Trim to `maxUndoDepth` (default 50; configurable).

```
commit → snapshot prev → undoStack: [...past, prev] → redoStack: []
undo   → pop undoStack → redoStack: [...future, current] → restore popped
redo   → pop redoStack → undoStack: [...past, current] → restore popped
```

### 21.3 `version` does NOT decrement on undo

`isDirty()` stays `true` after undoing all changes. **Intentional** — prevents the "I undid everything, dirty cleared, save = lost work" footgun. Hosts call `markClean()` after a known-clean point (typically after save).

### 21.4 Keyboard shortcuts

Default bindings (when `editable={true}` and focus is inside the tree but NOT inside an active editor input):

- `Cmd/Ctrl + Z` → undo
- `Cmd/Ctrl + Shift + Z` → redo
- `Cmd/Ctrl + Y` → redo (Windows convention)

When focus is inside an active editor input, browser-native textbox undo handles it.

Disable via `disableUndoShortcuts: true`.

### 21.5 `<RichCardUndoToolbar>`

Optional sibling export. Drop in next to `<RichCard>` for default undo / redo affordances:

```tsx
const [canUndo, setCanUndo] = useState(false);
const [canRedo, setCanRedo] = useState(false);

<RichCardUndoToolbar
  canUndo={canUndo}
  canRedo={canRedo}
  onUndo={() => ref.current?.undo()}
  onRedo={() => ref.current?.redo()}
/>
<RichCard
  ref={ref}
  editable
  onChange={() => {
    setCanUndo(ref.current?.canUndo() ?? false);
    setCanRedo(ref.current?.canRedo() ?? false);
  }}
/>
```

---

## 22. Keyboard navigation (full)

| Key | Mode | Action |
|---|---|---|
| `Tab` | Tree | Move focus into / out of the tree (lands on first treeitem) |
| `↑` / `↓` | Tree | Previous / next visible card |
| `→` | Tree | Collapsed → expand. Expanded with children → focus first child. Else no-op. |
| `←` | Tree | Expanded → collapse. Collapsed/leaf → focus parent. |
| `Home` / `End` | Tree | First / last visible card |
| `Enter` / `Space` | Tree | Toggle collapse |
| `Click` | Tree | Single select (replaces) |
| `Shift+Click` | Tree | Range select |
| `Cmd/Ctrl+Click` | Tree | Toggle select |
| `Delete` (when bulk-selected) | Tree (editor) | Bulk-remove |
| `Cmd/Ctrl+D` (when bulk-selected) | Tree (editor) | Duplicate selected (deferred — currently via toolbar) |
| `Cmd/Ctrl+Z` | Tree (editor) | Undo |
| `Cmd/Ctrl+Shift+Z` / `Cmd/Ctrl+Y` | Tree (editor) | Redo |
| `Enter` / blur | Editor input | Commit edit |
| `Escape` | Editor input | Cancel edit |
| Drag-mode keys (`Space`, arrows) | Tree (during dnd) | Built into `@dnd-kit` |
| `F3` / `Shift+F3` | Search bar | Next / previous match |

When an editor is active, the tree-keyboard handler is bypassed entirely so keystrokes belong to the input.

---

## 23. Accessibility

### Tree semantics

- `<div role="region" aria-label={ariaLabel}>` wraps everything
- `<ul role="tree" aria-label aria-multiselectable={editable}>` is the top list
- Each card: `<li role="treeitem" aria-level={N} aria-expanded={...} aria-selected={isSelected} aria-labelledby={titleId}>`
- Children groups: `<ul role="group">` only when expanded with children
- Locked cards: `data-readonly="true"` (data attribute for styling); lock icon in header has `aria-label="Locked"`
- `aria-selected` reflects **selection** (not focus) since v0.3 — deliberate change documented

### Editor semantics

- Inputs use native `<input>` / `<textarea>` / `<select>` with descriptive `aria-label`s
- Inline error: `role="alert" aria-live="polite"` strip below the input
- Add/remove buttons: native `<button>` with descriptive `aria-label`
- Live region announcement on validation failure (via `<InlineError>`)

### DnD semantics

- `@dnd-kit` provides full keyboard alternative + screen-reader announcements
- We supply custom announcement strings per scope
- Drop indicators have `aria-live="polite"` for "Dropping at position N under <parent>"

### Search semantics

- `<RichCardSearchBar>` uses native `<input type="search">` with `aria-label`
- Match count fires into `aria-live="polite"` region
- Active-match navigation moves keyboard focus to the matched card

### Reduced motion

`prefers-reduced-motion: reduce` skips collapse + chevron rotation transitions.

### RTL

All padding / margin / border classes use logical properties (`ps-*` / `pe-*` / `border-s` / `border-e`). Tree-keyboard semantics are direction-agnostic per ARIA spec — `→` always descends, never visually right-arrow.

---

## 24. Composition patterns

### 24.1 Drop-in viewer

```tsx
<RichCard defaultValue={someJson} />
```

### 24.2 Drop-in editor

```tsx
<RichCard
  defaultValue={someJson}
  editable
  onChange={(tree) => persistToBackend(tree)}
/>
```

### 24.3 Form preview (uncontrolled with key remount)

```tsx
<RichCard
  key={data.__rcid ?? "default"}    // remount on identity change
  defaultValue={data}
  metaPresentation="popover"
/>
```

### 24.4 Save flow with dirty tracking

```tsx
const ref = useRef<RichCardHandle>(null);
const [dirty, setDirty] = useState(false);

const save = async () => {
  await api.save(ref.current!.getValue());
  ref.current!.markClean();
  setDirty(false);
};

<RichCard
  ref={ref}
  editable
  defaultValue={data}
  onChange={() => setDirty(ref.current?.isDirty() ?? false)}
/>
<button onClick={save} disabled={!dirty}>Save{dirty ? " *" : ""}</button>
```

### 24.5 Read-only with permission cascade

```tsx
<RichCard
  defaultValue={data}
  editable
  permissions={{
    default: { edit: true, add: true, remove: true, reorder: true, reparent: true },
    byLevel: {
      1: { remove: false },                    // root cards can't be removed
    },
    byPredefinedKey: {
      codearea: { edit: false },               // codeblocks frozen
    },
  }}
  canEditField={(cardId, key) => key !== "id"}  // ID fields read-only via predicate
/>
```

### 24.6 Validator + undo workflow

```tsx
import {
  RichCard,
  RichCardUndoToolbar,
  type RichCardValidators,
} from "@/registry/components/data/rich-card";

const validators: RichCardValidators = {
  fieldEdit: (event) => {
    if (event.key === "priority" && typeof event.newValue === "number") {
      if (event.newValue < 1 || event.newValue > 5) {
        return { ok: false, errors: [{ code: "host-priority", message: "1–5 only." }] };
      }
    }
    return { ok: true };
  },
};

<RichCardUndoToolbar canUndo={canUndo} canRedo={canRedo} onUndo={undo} onRedo={redo} />
<RichCard
  defaultValue={data}
  editable
  validators={validators}
  onValidationFailed={(e) => toast.error(e.errors[0].message)}
/>
```

### 24.7 Audit trail (auto-stamped meta)

```tsx
<RichCard
  defaultValue={data}
  editable
  metaPresentation="popover"
  auditTrail={{ editor: currentUser.email }}
/>
```

Every commit auto-stamps `__rcmeta._lastEdited` (ISO timestamp) and `__rcmeta._lastEditor` (the supplied editor string) on the changed card.

### 24.8 Granular event listening (analytics / audit log)

```tsx
<RichCard
  defaultValue={data}
  editable
  onFieldEdited={(e) => analytics.track("field.edited", e)}
  onCardAdded={(e) => analytics.track("card.added", e)}
  onCardRemoved={(e) => audit.log("card.removed", { cardId: e.cardId, subtree: e.removed })}
  onValidationFailed={(e) => analytics.track("validation.failed", e)}
/>
```

---

## 25. Gotchas

| # | Gotcha | Fix / workaround |
|---|---|---|
| 1 | Arrays of objects are rejected | Convert to object-keyed form (`{ items: { item_0: a, item_1: b } }`) |
| 2 | Predefined-key shape mismatches drop entries silently | Console-warned. Opt out via `disabledPredefinedKeys` to keep as flat field. |
| 3 | Component is **uncontrolled** | `defaultValue` changes after mount are ignored. Remount via `key`. |
| 4 | Null fields are read-only | Remove + re-add to replace |
| 5 | Type-changing on edit not supported | String stays string. Remove + re-add for new type. |
| 6 | Root has no `parentKey` | Title comes from `aria-label` (default `"Rich card"`) |
| 7 | Root removal forbidden by default | Set `allowRootRemoval={true}` + supply `onRootRemoved` callback |
| 8 | Multi-instance predefined keys not allowed | One `codearea` / `image` / etc. per card. Use child cards for multiples. |
| 9 | Tree-keyboard bypassed during editing | Arrow keys belong to active input; tree nav suspended |
| 10 | `isDirty()` stays true after undo | Intentional — call `markClean()` after save |
| 11 | Browser `Ctrl+F` doesn't find virtualized off-screen content | Use native search (`<RichCardSearchBar>`) instead — searches the data model |
| 12 | Custom keys aren't searched in v0.3 | `searchableText` API deferred. Search the card's `parentKey` or other fields meanwhile. |
| 13 | `Cmd+F` is NOT intercepted by rich-card | Browser-native find still works; native search is `F3` / explicit input |
| 14 | Validators don't see post-commit state | Pass-through is pre-commit only. Validators compute "would this be valid" from the event payload + current tree. |
| 15 | `replace-tree` clears undo history | Documented; root replacement invalidates prior snapshots |
| 16 | `onSelectionChange` signature changed v0.2 → v0.3 | Migration: `(ids) => setSelected(ids[0] ?? null)` |
| 17 | Predefined-key max-one-per-card | "+ block" menu hides keys already present |
| 18 | `__rcmeta.locked` cascades to all descendants | Toggle on root-level → entire tree read-only |
| 19 | Tentative cards (just added via "+ child") removed on Escape | No stranded "untitled" cards |

---

## 26. Performance

| Concern | Strategy |
|---|---|
| Render budget | 500 leaves at 60fps in default rendering. Trees > 500 → use `virtualize: 'auto'`. |
| Edit re-renders | Only the editing input + its card re-render on keystroke. Reducer commits on blur/Enter. |
| Validation cost | Pure functions; safe to run on every keystroke. Host validators should be O(1) or O(log n). |
| Permission resolution | Memoized by `tree`; recomputes on tree change only. |
| Search walk | O(n × s) one-shot per query change. Debounce host input for huge trees. |
| DnD perf | `@dnd-kit` uses CSS transforms during drag; only the dragged item re-renders. |
| Undo memory | Structural sharing keeps snapshots cheap. 50-snapshot stack: < 1MB for typical 500-node trees. |

If profiling fails the budget, the documented fallback is manual `React.memo` wrappers around `<Card>`. Not implemented unless needed.

---

## 27. Phase boundaries / roadmap

| Phase | Status | Adds |
|---|---|---|
| **v0.1** | ✅ shipped | Viewer — JSON input, typed fields, 5 predefined keys, per-level styling, ARIA tree, keyboard nav, canonical round-trip |
| **v0.2** | ✅ shipped | Inline editor — click-to-edit, granular events, dirty tracking, single-select |
| **v0.3** | ✅ shipped | Structural management — drag-drop, bulk multi-select, permissions, custom keys, virtualization, native search, meta editing, root-removal, promote-on-delete |
| **v0.4** | ✅ shipped (current, **beta**) | Safety net — host validation hooks, per-commit undo/redo |
| **v0.5** | deferred indefinitely | Markdown ↔ JSON adapter (separate companion module, NOT inside rich-card) |

**Stable (1.0.0)** is gated on:
- External consumer adoption
- 30-day no-break window
- Comprehensive test coverage (Vitest landing as a STATUS-level decision)

**Beta (0.4.0 — current)** means feature-complete for the planned scope, API stable, suitable for real use; minor edge cases may surface during external use.

The v0.1 + v0.2 + v0.3 + v0.4 API is designed so future additions extend rather than break. The one intentional break — `onSelectionChange` v0.2 → v0.3 signature — is the only migration any existing consumer would face.

---

## 28. Public exports reference

From [`src/registry/components/data/rich-card/index.ts`](../../../src/registry/components/data/rich-card/index.ts):

```ts
// Component
export { RichCard } from "./rich-card";

// Sibling exports (optional default UI)
export { RichCardSearchBar } from "./parts/search-bar";
export { RichCardUndoToolbar } from "./parts/undo-toolbar";

// v0.1 types
export type {
  CodeAreaValue, FlatFieldType, FlatFieldValue, ImageValue, LevelStyle,
  ListValue, PredefinedKey, QuoteValue, RichCardHandle, RichCardJsonNode,
  RichCardProps, TableValue,
} from "./types";

// v0.2 event types
export type {
  CardAddedEvent, CardRemovedEvent, CardRenamedEvent,
  FieldAddedEvent, FieldEditedEvent, FieldRemovedEvent,
  PredefinedAddedEvent, PredefinedEditedEvent, PredefinedRemovedEvent,
} from "./types";

// v0.3 event + permission + custom-key + search types
export type {
  CardMovedEvent, CardDuplicatedEvent,
  MetaChangedEvent, MetaAddedEvent, MetaRemovedEvent,
  RichCardPermissions, PermissionRule, EffectivePermissions, PermissionDenialReason,
  DndScopes, CustomPredefinedKey, CustomKeyContext,
  MetaRenderer, MetaRendererContext, AuditTrailConfig,
  SearchOptions, SearchMatch, SearchMatchType, SearchResult,
} from "./types";

// v0.4 validation types
export type {
  RichCardValidators, RichCardMasterValidator,
  RichCardValidationResponse, RichCardValidationError,
  ValidationFailedEvent,
} from "./types";

// constants
export { PREDEFINED_KEYS, RESERVED_KEYS } from "./types";

// component metadata
export { meta } from "./meta";
```

---

## 29. Internal reference index

- **Source:** [src/registry/components/data/rich-card/](../../../src/registry/components/data/rich-card/) — 56 files (1 root + ~22 parts + ~10 hooks + ~10 lib + 7 anatomy + assorted)
- **Pure helpers (testable):** [lib/parse.ts](../../../src/registry/components/data/rich-card/lib/parse.ts), [serialize.ts](../../../src/registry/components/data/rich-card/lib/serialize.ts), [classify-key.ts](../../../src/registry/components/data/rich-card/lib/classify-key.ts), [infer-type.ts](../../../src/registry/components/data/rich-card/lib/infer-type.ts), [reducer.ts](../../../src/registry/components/data/rich-card/lib/reducer.ts), [validate-edit.ts](../../../src/registry/components/data/rich-card/lib/validate-edit.ts), [permissions.ts](../../../src/registry/components/data/rich-card/lib/permissions.ts), [search.ts](../../../src/registry/components/data/rich-card/lib/search.ts), [dnd-helpers.ts](../../../src/registry/components/data/rich-card/lib/dnd-helpers.ts), [bulk-actions.ts](../../../src/registry/components/data/rich-card/lib/bulk-actions.ts), [validators.ts](../../../src/registry/components/data/rich-card/lib/validators.ts)
- **Procomp planning trail:**
  - [Description (Stage 1)](rich-card-procomp-description.md)
  - [v0.1 plan (Stage 2)](rich-card-procomp-plan.md)
  - [v0.2 plan (Stage 2)](rich-card-procomp-plan-v0.2.md)
  - [v0.3 plan (Stage 2)](rich-card-procomp-plan-v0.3.md)
  - [v0.4 plan (Stage 2)](rich-card-procomp-plan-v0.4.md)
  - This guide (Stage 3) — refreshed 2026-04-28 for v0.4
- **Project-level:**
  - [STATUS.md](../../../.claude/STATUS.md)
  - [component-guide.md](../../component-guide.md) — general pro-component conventions
- **Demo route:** `/components/rich-card`

---

**Last updated:** 2026-04-28 · **Maturity:** beta · **Next milestone:** stable (1.0.0) gated on external consumers + 30-day no-break window
