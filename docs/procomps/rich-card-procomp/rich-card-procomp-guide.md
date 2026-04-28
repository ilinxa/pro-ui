# `rich-card` — Pro-component Guide (Stage 3)

> **Stage:** 3 of 3 · **Status:** Aligned with shipped v0.2.0 (2026-04-28)
> **Slug:** `rich-card` · **Category:** `data` · **Version:** 0.2.0 (alpha)
> **Source:** [src/registry/components/data/rich-card/](../../../src/registry/components/data/rich-card/)
> **Demo route:** `/components/rich-card`
> **Related docs:** [description](rich-card-procomp-description.md) · [v0.1 plan](rich-card-procomp-plan.md) · [v0.2 plan](rich-card-procomp-plan-v0.2.md)

This guide is the **complete developer reference** for using `RichCard` in your project. Everything you need to know to build with it, customize it, edit data through it, or port it into another codebase. It complements `meta.ts` and `usage.tsx` with deeper prose.

---

## 1. What it is

`RichCard` is a JSON-driven recursive card-tree **viewer + inline editor**. Hand it any JSON object and it renders a hierarchical card display with typed-scalar field rendering, five styled content blocks (`codearea` / `image` / `table` / `quote` / `list`), per-card meta, per-level visual hierarchy, full ARIA tree accessibility, keyboard navigation, and canonical JSON round-tripping.

**v0.2 (current) adds inline editing** under an `editable` global gate: click any field value or key to edit, "+ field" / "+ block" / "+ child" affordances to add, hover-× to remove. Granular change events. Dirty tracking. Click-driven single-select distinct from keyboard focus. Sync validation. Drag-drop, permissions, validation hooks, undo, and a markdown adapter are planned for v0.3–v0.5.

---

## 2. When to use / when NOT to use

### Use when

- Your data is **JSON-shaped**, **hierarchical**, and **mixed-content** (flat fields + rich blocks)
- You want a **card-tree visualization** and (optionally) inline editing
- You need **keyboard + screen-reader accessibility** out of the box
- You're displaying or authoring agent traces, configuration trees, decision records (ADRs), runbooks, requirement docs, postmortems, schema-driven dashboards, or research outlines

### Skip when

- Your data is flat (use `data-table`)
- You need rich-text prose editing (use a markdown editor)
- You need a free-form whiteboard or graph (cards have one parent — no graphs)
- You need **markdown source-of-truth** (intentionally dropped — wait for v0.5 companion adapter)
- You need **drag-drop reordering**, **permissions**, or **undo** today (those are v0.3/v0.4)

---

## 3. Installation

### 3.1 Inside the ilinxa-ui-pro repo

```tsx
import { RichCard } from "@/registry/components/data/rich-card";
```

### 3.2 Porting into another project

Zero `next/*` imports, zero app-context coupling. To copy:

1. **Copy the folder** [src/registry/components/data/rich-card/](../../../src/registry/components/data/rich-card/) into your project's component tree.
2. **Update import paths** if your aliases differ — the component imports:
   - `react` (peer)
   - `@/components/ui/popover` (shadcn primitive)
   - `@/lib/utils` (`cn()` helper from shadcn)
   - `lucide-react` (peer dep)
3. **Install shadcn primitives**:
   ```bash
   npx shadcn@latest add popover separator
   ```
4. **Install npm peer**:
   ```bash
   npm install lucide-react
   ```
5. **Verify Tailwind v4** semantic tokens exist in your design system (`--card`, `--muted`, `--border`, `--primary`, `--ring`, `--destructive`, etc.). Override default level styles via `levelStyles` if your tokens differ.

No bundler config. No runtime initialization.

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
  onChange={(tree) => console.log("tree changed:", tree)}
  onFieldEdited={(e) => console.log("field edited:", e)}
/>
```

That's all you need to enable editing. Click any field value, key, or card title to edit. The `+ field` / `+ block` / `+ child` buttons appear on hover in edit mode.

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
| **Predefined** | Key is `codearea` / `image` / `table` / `quote` / `list` (and not in `disabledPredefinedKeys`) | A typed content block |
| **Field** | Value is a JSON scalar (string / number / boolean / null) | A key-value row in the card body |
| **Child** | Value is a non-array, non-null object | A nested card |

Arrays at child positions are **rejected** with a console warning at parse time (use object-keyed children, or the `list` predefined key for scalar arrays).

### 5.2 Reserved keys

| Key | Type | Purpose |
|---|---|---|
| `__rcid` | `string` | Stable card identity. Auto-generated via `crypto.randomUUID()` if absent. |
| `__rcorder` | `number` | Sibling order. Defaults to `0` if absent. New cards added via v0.2 land at `max(siblings) + 1`. |
| `__rcmeta` | `Record<string, FlatFieldValue>` | Per-card hidden metadata. Exposed via `metaPresentation` prop. |

### 5.3 Flat-field types

| Type | Trigger | Rendering |
|---|---|---|
| `string` | `typeof === 'string'` | Plain text |
| `number` | `typeof === 'number'` and `Number.isFinite()` | Right-aligned, mono, `tabular-nums` |
| `boolean` | `typeof === 'boolean'` | Check icon for `true`, dash for `false` |
| `date` | String matches ISO-8601 regex AND `Date.parse()` is valid | Formatted via `Intl.DateTimeFormat` |
| `null` | Literal `null` | Em-dash in muted color (read-only in v0.2) |

**Date detection** (`dateDetection` prop):

| Mode | Behavior |
|---|---|
| `'auto'` (default) | Strict — regex + `Date.parse` validation |
| `'never'` | All strings render as `'string'` |
| `(value: string) => boolean` | Custom predicate |

### 5.4 Predefined-key blocks

| Key | Required shape | Rendering |
|---|---|---|
| `codearea` | `{ format: string; content: string }` | Bordered figure with format-label header + monospace `<pre>` body |
| `image` | `{ src: string; alt?: string }` | Lazy-loaded `<img>` with caption when alt present |
| `table` | `{ headers: string[]; rows: FlatFieldValue[][] }` | Bordered table with mono uppercase headers |
| `quote` | `string` | Italic blockquote with primary-colored start border |
| `list` | `FlatFieldValue[]` | Bulleted list (booleans / numbers / null per their rules) |

Invalid shapes drop the entry at parse with a console warning. Add the key name to `disabledPredefinedKeys` to use it as a flat-field name instead.

### 5.5 Children

Any non-reserved, non-predefined property whose value is a **non-array, non-null object** becomes a child card. The property name is stored on the child as `parentKey` and round-trips through `serializeTree` identically.

**Arrays of objects are rejected in v0.1+v0.2** (locked Q-P4). Convert to object-keyed form first.

### 5.6 Per-card meta

```tsx
{
  __rcmeta: {
    author: "Hessam",
    started: "2026-01-15",
    pages: 87,
    submitted: false,
    grade: null,
  },
}
```

Meta values must be scalars (same rules as flat fields). Surface via `metaPresentation` prop — see §11.

---

## 6. Field types — JSON example

```jsonc
{
  "status": "accepted",            // string — plain text
  "priority": 2,                   // number — right-aligned mono
  "score": 0.92,                   // number
  "approved": true,                // boolean — ✓ icon
  "submitted": false,              // boolean — — icon
  "deadline": "2026-06-15",        // date — formatted
  "started_at": "2026-04-28T09:30:00Z",  // date with time
  "grade": null                    // null — em-dash
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

---

## 8. Props reference

```ts
type RichCardProps = {
  defaultValue: RichCardJsonNode;                            // REQUIRED

  // Styling
  levelStyles?: LevelStyle[];
  getLevelStyle?: (level: number) => LevelStyle;
  predefinedKeyStyles?: Partial<Record<PredefinedKey, string | LevelStyle>>;

  // Viewer behavior (v0.1)
  defaultCollapsed?: 'all' | 'none' | ((level: number) => boolean);
  metaPresentation?: 'hidden' | 'inline' | 'popover';
  disabledPredefinedKeys?: PredefinedKey[];
  dateDetection?: 'auto' | 'never' | ((value: string) => boolean);

  // Editor behavior (v0.2)
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
  onSelectionChange?: (id: string | null) => void;

  // Container
  className?: string;
  'aria-label'?: string;
};
```

| Prop | Type | Default | Purpose |
|---|---|---|---|
| `defaultValue` | `RichCardJsonNode` | — (required) | Seed input. Parsed once on mount. Subsequent prop changes ignored — remount via `key` to reset. |
| `levelStyles` | `LevelStyle[]` | 6 built-in | Indexed by `level - 1`. Last entry repeats deeper. |
| `getLevelStyle` | `(level) => LevelStyle` | — | Programmatic override. |
| `predefinedKeyStyles` | `Partial<Record<PredefinedKey, string \| LevelStyle>>` | — | Per-block-type styling. |
| `defaultCollapsed` | `'all' \| 'none' \| (level) => boolean` | `'none'` | Initial collapse state. |
| `metaPresentation` | `'hidden' \| 'inline' \| 'popover'` | `'hidden'` | How `__rcmeta` is exposed. |
| `disabledPredefinedKeys` | `PredefinedKey[]` | `[]` | Predefined keys to treat as flat fields instead. |
| `dateDetection` | `'auto' \| 'never' \| (value) => boolean` | `'auto'` | ISO-8601 detection mode. |
| **`editable`** | `boolean` | `false` | **v0.2** — global editor gate. v0.1 viewer behavior preserved when `false`. |
| **`onChange`** | `(tree) => void` | — | **v0.2** — fires after every commit with the canonical tree. |
| **`onFieldEdited`** | `(event) => void` | — | **v0.2** — granular event when a field's value or key changes. |
| **`onFieldAdded`** | `(event) => void` | — | **v0.2** — granular event when a field is added. |
| **`onFieldRemoved`** | `(event) => void` | — | **v0.2** — granular event when a field is removed. |
| **`onCardAdded`** | `(event) => void` | — | **v0.2** — fires when a child card is added. |
| **`onCardRemoved`** | `(event) => void` | — | **v0.2** — fires when a card is removed (event includes the full removed subtree for host-side undo). |
| **`onCardRenamed`** | `(event) => void` | — | **v0.2** — fires when a card's `parentKey` changes. |
| **`onPredefinedAdded`** | `(event) => void` | — | **v0.2** |
| **`onPredefinedEdited`** | `(event) => void` | — | **v0.2** |
| **`onPredefinedRemoved`** | `(event) => void` | — | **v0.2** |
| **`onSelectionChange`** | `(id) => void` | — | **v0.2** — fires when the selected card changes. |
| `className` | `string` | — | Outer `<div role="region">` class. |
| `'aria-label'` | `string` | `"Rich card"` | Region label AND root card title. |

---

## 9. Styling

### 9.1 Per-level styling

```ts
type LevelStyle = {
  containerClassName?: string;
  headerClassName?: string;
  fieldsClassName?: string;
  childrenClassName?: string;
};
```

**Default** (6 levels, minimal x-padding, semantic tokens only):

| Level | Default container chrome |
|---|---|
| 1 | `rounded-xl border border-border bg-card px-3 py-3 shadow-sm` |
| 2 | `rounded-lg border border-border bg-muted/30 px-3 py-2.5` |
| 3 | `rounded-md border border-border/70 bg-muted/20 px-2.5 py-2` |
| 4 | `rounded-md border border-border/50 bg-muted/15 px-2 py-2` |
| 5 | `rounded-sm border border-border/40 bg-muted/10 px-2 py-1.5` |
| 6+ | `rounded-sm border border-dashed border-border/30 px-2 py-1.5` |

The dashed border at level 6 is intentional — it signals "consider restructuring." Past level 6, the same dashed style repeats.

**Override** with your own array, or use `getLevelStyle?: (level) => LevelStyle` for full programmatic control.

### 9.2 Per-predefined-key styling

```tsx
<RichCard
  defaultValue={data}
  predefinedKeyStyles={{
    codearea: "bg-zinc-900 text-zinc-100",
    quote: "border-l-4 border-amber-500",
  }}
/>
```

String → `containerClassName` only; pass a `LevelStyle` object for slot-level control.

---

## 10. Collapsibility

### 10.1 Every card with content is collapsible

A chevron toggle appears on any card with body content (fields OR predefined elements) OR child cards. Truly empty cards (header-only) get a placeholder spacer. Toggling collapses everything below the header in one motion.

### 10.2 Default collapse state (`defaultCollapsed`)

```tsx
<RichCard defaultValue={data} defaultCollapsed="all" />        // all collapsed
<RichCard defaultValue={data} defaultCollapsed="none" />       // all expanded (default)
<RichCard defaultValue={data} defaultCollapsed={(level) => level >= 3} />  // depth-3+
```

### 10.3 User toggle

- Click chevron in card header
- Press `Enter` / `Space` on a focused card
- Press `→` on collapsed / `←` on expanded

State persists across re-renders within a session. Resets when the component remounts via `key`.

---

## 11. Meta presentation modes

| Mode | Render |
|---|---|
| `'hidden'` (default) | Not shown (still survives round-trip). |
| `'inline'` | Truncated mono strip in the card header showing `key value · key value`. |
| `'popover'` | `Info` icon button → shadcn `Popover` with the full meta `<dl>`. |

Cards without `__rcmeta` show no affordance regardless of mode.

---

## 12. Imperative API (`RichCardHandle`)

The component is **uncontrolled** — `defaultValue` is the seed. Read state via a ref:

```tsx
const ref = useRef<RichCardHandle>(null);

<RichCard ref={ref} defaultValue={raw} editable />
```

| Method | Returns | Notes |
|---|---|---|
| `getValue()` | `string` | Canonical pretty-printed JSON (2-space). All `__rcid` / `__rcorder` filled in. |
| `getTree()` | `RichCardJsonNode` | Object form. |
| **`isDirty()`** | `boolean` | **v0.2** — true if any committing action has fired since mount or last `markClean()`. |
| **`markClean()`** | `void` | **v0.2** — snapshot current state as the new clean baseline. |
| **`getSelectedId()`** | `string \| null` | **v0.2** — currently-selected card id, or null. |

**Round-trip property**: `parse(serialize(parse(x))) === parse(x)`. Fixed-point on the second round trip.

v0.3 will add `setSelection()` / `focusCard()`. v0.4 will add `undo()` / `redo()`.

---

## 13. Keyboard navigation

| Key | Action |
|---|---|
| `Tab` | Move focus into / out of the tree |
| `↑` / `↓` | Previous / next visible card |
| `→` | Collapsed → expand. Expanded with children → focus first child. Else no-op. |
| `←` | Expanded → collapse. Collapsed/leaf → focus parent. |
| `Home` | First visible card |
| `End` | Last visible card |
| `Enter` / `Space` | Toggle collapse |

When an editor is active (v0.2), the tree-keyboard handler is **bypassed entirely** — keystrokes belong to the active input. `Enter` commits, `Escape` cancels at the editor level.

---

## 14. Accessibility

### Tree semantics

- `<div role="region" aria-label={ariaLabel}>` wraps the tree
- `<ul role="tree">` is the top-level list
- Each card: `<li role="treeitem" aria-level={N} aria-expanded={...} aria-selected={isSelected} aria-labelledby={titleId}>`
- Children groups: `<ul role="group">` only when expanded with children
- Collapse toggle: real `<button>` with `aria-label` reflecting state
- **`aria-selected` reflects selection (v0.2)**, not focus (v0.1 reflected focus)

### v0.2 editor semantics

- Inputs use native `<input>` / `<textarea>` / `<select>` with `aria-label` describing what's being edited
- Inline error: `role="alert" aria-live="polite"` strip below the input
- Add buttons: native `<button>` with descriptive `aria-label`
- Remove × buttons: `aria-label="Remove field 'priority'"` etc.

### Live regions

`aria-live="polite"` on the inline-error region announces validation failures. Add/remove operations don't fire live announcements in v0.2 — that's a v0.3 polish.

### Reduced motion

`prefers-reduced-motion: reduce` skips collapse transition. Edit-mode transitions are minimal (input swap is instant).

### RTL

Layout uses CSS logical properties (`ps-*`, `pe-*`, `border-s`). Tree-keyboard semantics are direction-agnostic per ARIA spec — `→` always descends.

---

## 15. Composition patterns

### 15.1 Drop-in viewer

```tsx
<RichCard defaultValue={someJson} />
```

### 15.2 Drop-in editor

```tsx
<RichCard
  defaultValue={someJson}
  editable
  onChange={(tree) => persistToBackend(tree)}
/>
```

### 15.3 Form preview (uncontrolled-with-remount)

```tsx
<RichCard
  key={data.__rcid ?? data.title ?? "default"}
  defaultValue={data}
  metaPresentation="popover"
/>
```

### 15.4 JSON canonicalizer

```tsx
const ref = useRef<RichCardHandle>(null);
<RichCard ref={ref} defaultValue={rawJson} />
<button onClick={() => navigator.clipboard.writeText(ref.current!.getValue())}>
  Copy canonical
</button>
```

### 15.5 Side-by-side preview + JSON with collapsible JSON pane

The shipped demo at [demo.tsx](../../../src/registry/components/data/rich-card/demo.tsx) is a reusable pattern:

```tsx
const [showJson, setShowJson] = useState(true);
const [editable, setEditable] = useState(false);
const [liveJson, setLiveJson] = useState(initialJson);

<button onClick={() => setEditable(v => !v)}>
  {editable ? "editing" : "view"}
</button>
<button onClick={() => setShowJson(v => !v)}>
  {showJson ? "Hide JSON" : "Show JSON"}
</button>

<div className={cn(
  "grid gap-4",
  showJson ? "lg:grid-cols-[minmax(0,1fr)_minmax(0,28rem)]" : "grid-cols-1",
)}>
  <RichCard
    defaultValue={data}
    editable={editable}
    onChange={(tree) => setLiveJson(JSON.stringify(tree, null, 2))}
  />
  {showJson ? <pre>{liveJson}</pre> : null}
</div>
```

### 15.6 Persistence on save (debounced)

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
  defaultValue={data}
  editable
  onChange={() => setDirty(ref.current?.isDirty() ?? false)}
/>
<button onClick={save} disabled={!dirty}>
  Save {dirty ? "(unsaved)" : ""}
</button>
```

### 15.7 Listening to granular events (analytics, audit log)

```tsx
<RichCard
  defaultValue={data}
  editable
  onFieldEdited={(e) => analytics.track("field.edited", e)}
  onCardAdded={(e) => analytics.track("card.added", e)}
  onCardRemoved={(e) => analytics.track("card.removed", e)}
/>
```

The `CardRemovedEvent` carries the full removed subtree, so a host can implement undo by stashing it.

---

## 16. v0.2 inline editing — full reference

### 16.1 Edit affordance trigger

**Single-click** on:
- A flat-field **value** → swaps to a type-aware input (text / number / checkbox / native date)
- A flat-field **key** → swaps to a text input for renaming
- A card **title** (the card's `parentKey`) → swaps to a text input
- A predefined-key **block** (codearea / image / table / quote / list) → opens that block's inline editor

**Hover-revealed** affordances appear in edit mode:
- × button on each field row (right edge) → instant remove
- × button on each predefined-key block (top right) → instant remove
- "..." actions menu in card header → "Remove card" option
- "+ field" button below the field list → opens add-field form
- "+ block" button below predefined elements → menu of available predefined keys
- "+ child" button below the children area → adds a tentative "untitled" card and immediately enters title edit

### 16.2 Commit / cancel

| Edit type | Commit | Cancel |
|---|---|---|
| Field value | `Enter` or blur | `Escape` |
| Field key | `Enter` or blur | `Escape` |
| Card title | `Enter` or blur | `Escape` (removes the card if it was tentative — just-added via "+ child") |
| Predefined block | "Save" button or `Enter` (in single-line cases) | "Cancel" button or `Escape` |
| Add-field form | "Add" button or `Enter` | "Cancel" button or `Escape` |
| Boolean field | Toggling the checkbox commits immediately (no Enter needed — Q-P9) |

### 16.3 Type-aware value editors

| Type | Widget |
|---|---|
| `string` | `<input type="text">` |
| `number` | `<input type="number">` with `parseFloat` on commit |
| `boolean` | `<input type="checkbox">` (commits on toggle) |
| `date` | Native `<input type="date">` for date-only ISO; `<input type="datetime-local">` if source had a time component |
| `null` | **Read-only in v0.2** — must remove + re-add to change |

**Type changing on edit is not supported in v0.2** — values preserve their parsed type. To change a `string` field to a `number`, remove it and add a new field with `type=number`. v0.3 candidate.

### 16.4 Predefined-key editors (5 sub-editors in one file)

| Key | Editor UX |
|---|---|
| `codearea` | Format text input + content textarea (autosizing mono) |
| `image` | Two text inputs (src + alt) + live preview |
| `quote` | Single textarea (multi-line, italic) |
| `list` | Textarea, one item per line (empty lines dropped); scalar inference (`true` / `false` / `null` / numbers detected) |
| `table` | **JSON-textarea fallback** for v0.2 — show + parse JSON. Cell-by-cell editor in v0.3. |

### 16.5 Add-field form

```
┌─────────────────────────────────┐
│ key:  [____________] [string ▾] │
│ value:[____________]            │
│ [×]                    [✓ add]  │
└─────────────────────────────────┘
```

Type selector: `string` / `number` / `boolean` / `date`. **Cannot add `null`** in v0.2 (Q-P1). Submit disabled until validation passes.

### 16.6 Add-card flow

1. Click "+ child" button on any card
2. New card created with auto-id, `__rcorder = max(siblings) + 1`, `parentKey = "untitled"`, empty body/children
3. Edit mode auto-enters card-title edit on the new card
4. User types real title, presses `Enter` → commits
5. **Pressing `Escape` removes the tentative card** entirely — no stranded "untitled" cards

### 16.7 Add-predefined flow

1. Click "+ block" → menu opens with predefined keys NOT already on this card and NOT in `disabledPredefinedKeys`
2. Click a key → entry inserted with default shape (`codearea: { format: "text", content: "" }`, `image: { src: "", alt: "" }`, `quote: ""`, `list: [""]`, `table: { headers: ["col"], rows: [[""]] }`)
3. Edit mode auto-enters that block's editor for the user to fill in real content
4. User commits or cancels

**Max one of each predefined key per card** (v0.3 may allow multiple).

### 16.8 Remove operations

- Field × button → instant remove (no confirm; v0.4 undo recovers)
- Predefined block × button → instant remove
- Card "..." → "Remove card" → instant **cascade** (children deleted too)
- **Root removal forbidden in v0.2** (locked deviation from description Q17; lands in v0.3)
- **`promote` option not in v0.2** (Q17 said "v0.2+"; deferred to v0.3 alongside per-deletion override UX)

---

## 17. Selection model

### 17.1 Selection ≠ focus

| Concept | Source | Lifetime | Reflected in |
|---|---|---|---|
| **Focus** | Keyboard (arrow keys) | Transient — moves with arrows | `tabIndex` |
| **Selection** | Click on card chrome (header + outer container, not body content) | Persistent until explicitly cleared | `aria-selected` + ring-2 ring-primary/40 styling |

In v0.1, `aria-selected` reflected focus. **In v0.2 it reflects selection.** This is a deliberate a11y delta (mentioned in the v0.2 plan §12).

### 17.2 Single-select only

v0.2 supports one selected card at a time. Multi-select (shift-click range, cmd-click toggle) is v0.3.

### 17.3 Subscribing to selection

```tsx
const [selectedId, setSelectedId] = useState<string | null>(null);

<RichCard
  defaultValue={data}
  editable
  onSelectionChange={setSelectedId}
/>

<button onClick={() => setSelectedId(null)}>Clear selection</button>
```

`getSelectedId()` on the imperative handle returns the current selected id. **Programmatic `setSelection()` is not in v0.2** — clicking outside any card clears selection; v0.3 adds a host-driven setter.

### 17.4 Body content vs chrome

Clicks on field values, field keys, and predefined-key blocks are **edit triggers** in edit mode — they don't bubble up to set selection. Selection happens on:
- The card's outer container (the gap around the card)
- The card header (chevron, title, actions area)

This avoids ambiguity between "I want to edit this value" and "I want to select this card."

---

## 18. Validation behavior

All validation is **synchronous** in v0.2 (async hooks land in v0.4). Validators run on every keystroke against pure functions in [`lib/validate-edit.ts`](../../../src/registry/components/data/rich-card/lib/validate-edit.ts).

### 18.1 What gets validated

| Action | Checks |
|---|---|
| Field value edit | Type matches expected (no coercion in v0.2); ISO-8601 validity for date type |
| Field key rename | Non-empty; not in `RESERVED_KEYS`; not in `PREDEFINED_KEYS` (unless disabled); not a sibling-key collision |
| Field add | Same as key rename + value-type validation |
| Card rename | Same key rules as field-key applied to the card's `parentKey` |
| Card remove | Card exists; is not the root |
| Predefined add / edit | Shape validation per key (`codearea: {format, content}`, etc.) |

### 18.2 What happens on failure

- Submit (button or Enter) is **blocked**
- Inline error renders below the input via `<InlineError>` (`role="alert" aria-live="polite"`)
- `Escape` still works to cancel

### 18.3 Error codes

`ValidationError.code` (for hosts that want to inspect via custom event handling):
- `empty-key` — key is blank
- `reserved-key` — collides with `__rcid` / `__rcorder` / `__rcmeta`
- `predefined-key` — collides with a predefined-key name (and that key isn't in `disabledPredefinedKeys`)
- `sibling-key-collision` / `sibling-collision` — duplicate key on the same card
- `type-mismatch` — value doesn't match declared type
- `invalid-date` — string passed regex but failed `Date.parse`
- `no-null-add` — tried to add a null field (forbidden in v0.2)
- `no-card` / `no-field` — referenced id/key doesn't exist
- `no-root-remove` — tried to remove the root card
- `shape-mismatch` — predefined-key payload doesn't match required shape
- `json-parse` — table-edit JSON-textarea contains invalid JSON

---

## 19. Change events

### 19.1 Granular events

Every commit-action fires a granular event. Each event includes enough information to reconstruct the change:

```ts
type FieldEditedEvent = {
  cardId: string;
  key: string;
  oldValue: FlatFieldValue;
  oldType: FlatFieldType;
  newValue: FlatFieldValue;
  newType: FlatFieldType;
};

type FieldAddedEvent = {
  cardId: string;
  key: string;
  value: FlatFieldValue;
  type: FlatFieldType;
};

type FieldRemovedEvent = {
  cardId: string;
  key: string;
  oldValue: FlatFieldValue;
  oldType: FlatFieldType;
};

type CardAddedEvent = {
  parentId: string;
  card: RichCardJsonNode;          // the new card with auto-IDs
};

type CardRemovedEvent = {
  cardId: string;
  removed: RichCardJsonNode;       // the full removed subtree (host-side undo)
  parentId: string | null;
};

type CardRenamedEvent = {
  cardId: string;
  oldKey: string | undefined;      // root has no oldKey
  newKey: string;
};

type PredefinedAddedEvent = {
  cardId: string;
  key: PredefinedKey;
  value: unknown;
};

type PredefinedEditedEvent = {
  cardId: string;
  key: PredefinedKey;
  oldValue: unknown;
  newValue: unknown;
};

type PredefinedRemovedEvent = {
  cardId: string;
  key: PredefinedKey;
  oldValue: unknown;
};
```

### 19.2 Order of events

Per commit-action:
1. The relevant **granular event** fires (synchronously after state commit, in a `useEffect`).
2. The **coarse `onChange(tree)`** fires with the post-commit tree.

`onSelectionChange(id)` fires only when `selectedId` actually changes (no spurious fires).

### 19.3 Event handlers must NOT mutate the tree

The `tree` passed to `onChange` is the canonical post-commit form. Mutating it has no effect on rich-card's state (which holds the internal `RichCardTree`) but will corrupt downstream consumers.

---

## 20. Dirty tracking

### 20.1 Counter-based

```
state.version       — increments on every commit-action
state.cleanVersion  — snapshot taken at mount and on markClean()
isDirty()           — version !== cleanVersion
```

Cheap and predictable. **Doesn't detect "edited and then edited back to original"** — that's a v0.4 upgrade once structural-diff lands alongside undo.

### 20.2 Lifecycle

- **Mount:** `version = 0`, `cleanVersion = 0` → not dirty.
- **Any commit-action** (edit / add / remove / rename): `version += 1` → dirty.
- **`markClean()`**: `cleanVersion = version` → not dirty.

### 20.3 Reading dirty state

`isDirty()` is on the imperative handle. It is NOT in `onChange` — read it via the ref:

```tsx
const ref = useRef<RichCardHandle>(null);
const [dirty, setDirty] = useState(false);

<RichCard
  ref={ref}
  defaultValue={data}
  editable
  onChange={() => setDirty(ref.current?.isDirty() ?? false)}
/>
```

---

## 21. Gotchas

### 21.1 Arrays of objects are rejected

Convert to object-keyed form before passing — see §5.5.

### 21.2 Predefined-key shape mismatches drop entries silently

Console warning; entry doesn't render and doesn't round-trip. Opt out via `disabledPredefinedKeys` to keep as a flat field.

### 21.3 The component is uncontrolled

`defaultValue` changes after mount are silently ignored. Remount via `key` to reset. There is no `value` + `onChange` controlled mode in v0.2 — for a 500-node tree that pattern would re-render the whole tree on every keystroke.

### 21.4 Null fields are read-only in v0.2

Click on a `null` field doesn't enter edit mode. Remove + re-add to replace with a non-null value.

### 21.5 Type changes on edit are not supported

A `string` field stays a string. To change types, remove + re-add.

### 21.6 Root card has no `parentKey`

Its visible title comes from `aria-label` (default `"Rich card"`). Set `aria-label="My document"` for a useful root title.

### 21.7 Root card cannot be removed in v0.2

Locked deviation from description Q17. The "..." menu's "Remove card" option is disabled on the root with an explanatory hint. v0.3 adds opt-in root-removal with a "new root rule" choice.

### 21.8 Promote-on-delete is not in v0.2

All deletes cascade. Description Q17 said "v0.2+"; deferred to v0.3 alongside the per-deletion override UX (shift-click etc.).

### 21.9 New cards from "+ child" are tentative until renamed

If you press `Escape` during the auto-entered title edit, the tentative card is removed entirely. This avoids stranded "untitled" cards. The `card-removed` event fires with the full subtree (which is just the empty card) — host-side undo handlers can ignore tentative-then-cancelled cycles by checking if the card had no fields/children.

### 21.10 Predefined-key max-one-per-card

Only one `codearea`, one `image`, etc. per card in v0.2. The "+ block" menu hides keys already present. Multi-instance arrives in v0.3. (Most use cases that want "two code blocks" really want two child cards each with one.)

### 21.11 Tree-keyboard is bypassed during editing

When an editor is active, arrow / home / end / enter / space all belong to the input. `Escape` cancels the editor (and re-enables tree-keyboard).

### 21.12 Dirty flag doesn't auto-reset on save

The component doesn't know about your save action. Call `markClean()` from your save handler to reset the flag.

---

## 22. Performance

- **Target:** 500 leaves at 60fps during edit / collapse-toggle / arrow-nav on a mid-tier laptop
- **Strategy:** render-everything; React 19's compiler auto-memoizes `<Card>` subtrees
- **Edit re-renders:** edit-mode boundaries trigger tree re-renders (rare); each editor's input owns local typing state via `useState`, so per-keystroke re-renders are local to the editor
- **Validation cost:** pure validators on each keystroke; cheap
- **Manual `React.memo`** is the documented fallback if profiling fails the budget
- **Trees > 500 nodes:** still work, performance degrades. Virtualization deferred to v0.3.

---

## 23. v0.2 boundaries (what doesn't work yet)

| Want | Status |
|---|---|
| Edit field values inline | ✅ v0.2 |
| Add / remove fields | ✅ v0.2 |
| Add / remove cards | ✅ v0.2 |
| Add / edit / remove predefined-key blocks | ✅ v0.2 |
| Granular change events | ✅ v0.2 |
| Dirty tracking | ✅ v0.2 |
| Click-driven single-select | ✅ v0.2 |
| Edit `__rcmeta` (per-card meta) | ❌ deferred to v0.3 |
| `promote` option on delete | ❌ deferred to v0.3 |
| Remove root card | ❌ forbidden in v0.2; v0.3 opt-in |
| Drag-drop reordering | ❌ v0.3 |
| Bulk multi-select | ❌ v0.3 |
| Permission scoping (per-level / per-card / per-key) | ❌ v0.3 |
| Custom predefined-key registration | ❌ v0.3 |
| Multiple of one predefined key per card | ❌ v0.3 |
| Programmatic `setSelection()` / `focusCard()` | ❌ v0.3 |
| Type-changing on edit | ❌ v0.3 candidate |
| Sync validation hooks | ❌ v0.4 |
| Undo / redo | ❌ v0.4 |
| Async validation hooks | ❌ v0.4+ |
| Markdown source / serialization | ❌ deferred indefinitely; v0.5 separate companion if a real consumer asks |
| Syntax highlighting in `codearea` | ❌ v0.2-but-cut for time; v0.3 candidate |
| Type-ahead keyboard search | ❌ v0.2-but-cut for time |
| Virtualization for > 500 nodes | ❌ v0.3 if needed |
| Controlled (`value` + `onChange`) mode | ❌ Maybe v0.3 if real consumers ask |
| Cell-by-cell `table` editor (vs JSON-textarea) | ❌ v0.3 |

---

## 24. Phased roadmap

| Phase | Status | Adds |
|---|---|---|
| v0.1 | ✅ shipped | Viewer-only — JSON input, typed scalar fields, 5 predefined keys, per-level styling, full a11y tree, keyboard nav, canonical round-trip |
| v0.2 | ✅ shipped (current) | Inline editor — edit/add/remove fields, cards, predefined-key elements; granular change events; dirty tracking; click-driven single-select |
| v0.3 | planned | Drag-drop (2 scopes), bulk ops (multi-select), per-level/per-card/per-key permissions, custom predefined-key registration, virtualization, meta editing, root-delete opt-in, promote-on-delete |
| v0.4 | planned | Sync validation hooks, per-commit undo/redo, structural-diff dirty tracking |
| v0.5 | deferred indefinitely | Markdown ↔ JSON adapter (separate companion module, NOT inside rich-card) |

The v0.1 + v0.2 API is designed so future phases **add props rather than change them**. Watch [STATUS.md](../../../.claude/STATUS.md) for phase-shipping announcements.

---

## 25. Public exports reference

From [`src/registry/components/data/rich-card/index.ts`](../../../src/registry/components/data/rich-card/index.ts):

```ts
// Component
export { RichCard } from "./rich-card";

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

// constants
export { PREDEFINED_KEYS, RESERVED_KEYS } from "./types";

// component metadata
export { meta } from "./meta";
```

---

## 26. Internal reference index

- **Source:** [src/registry/components/data/rich-card/](../../../src/registry/components/data/rich-card/) (36 files at v0.2)
  - Root: [rich-card.tsx](../../../src/registry/components/data/rich-card/rich-card.tsx)
  - Public types: [types.ts](../../../src/registry/components/data/rich-card/types.ts)
  - Pure helpers: [lib/](../../../src/registry/components/data/rich-card/lib/) — parse, serialize, classify-key, infer-type, reducer, validate-edit
  - View parts: card, card-header, field-row, meta-popover, meta-inline, predefined-codearea, predefined-image, predefined-table, predefined-quote, predefined-list
  - Edit parts (v0.2): field-edit, field-add, card-title-edit, card-actions, predefined-edit, predefined-add-menu, inline-error
  - Hooks: use-collapse-state, use-tree-focus, use-tree-keyboard, use-edit-mode, use-dirty, use-selection
  - Demo: [demo.tsx](../../../src/registry/components/data/rich-card/demo.tsx)
  - Dummy data: [dummy-data.ts](../../../src/registry/components/data/rich-card/dummy-data.ts)
- **Procomp planning docs:**
  - [Description (Stage 1)](rich-card-procomp-description.md)
  - [v0.1 plan (Stage 2)](rich-card-procomp-plan.md)
  - [v0.2 plan (Stage 2)](rich-card-procomp-plan-v0.2.md)
- **Project-level:**
  - [STATUS.md](../../../.claude/STATUS.md)
  - [component-guide.md](../../component-guide.md) — general pro-component conventions
- **Demo route:** `/components/rich-card`
