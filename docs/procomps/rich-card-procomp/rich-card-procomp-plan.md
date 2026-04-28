# `rich-card` — Pro-component Plan (Stage 2)

> **Stage:** 2 of 3 · **Status:** Draft — awaiting sign-off
> **Slug:** `rich-card` · **Category:** `data`
> **Inputs:** description signed off ([rich-card-procomp-description.md](rich-card-procomp-description.md)). All sixteen description-stage decisions (Q1–Q16) are inherited as fixed inputs. **Markdown is OUT of rich-card** per the top-of-description deviation banner.
> **Scope of this plan:** v0.1 (viewer) only. v0.2 / v0.3 / v0.4 / v0.5 each get their own plan revision when they're up next.

This doc locks **how** we build what the description committed to for v0.1. After sign-off, no scaffolding-time second-guessing — implementation follows the plan, deviations are loud.

---

## 1. Inherited inputs (one paragraph)

`rich-card` is a `data`-category pro-component: a JSON-driven recursive card-tree viewer. Input is a single root `RichCardJsonNode`; the component auto-attaches missing `__rcid` (UUID) and `__rcorder` (integer); reserved-key collisions reject. Each card has typed flat **JSON-scalar** fields (string / number / boolean / null + ISO-8601-date subtype), five **predefined-key** elements (`codearea`, `image`, `table`, `quote`, `list`), child cards, and per-card meta. Per-level styling via `levelStyles[]` / `getLevelStyle()` slots; per-key styling via `predefinedKeyStyles`. Collapse persists per session. Meta is exposed in three modes (`hidden` / `inline` / `popover`). Imperative `getValue()` returns canonical JSON; `getTree()` returns the parsed object form. **Full ARIA tree** (`role="tree"`, level-aware) and keyboard navigation from day one. Render-everything to ~500 nodes; no virtualization in v0.1. **Uncontrolled state** with imperative ref API (matches workspace). Editing, drag, permissions, validation, undo, multi-select, custom predefined keys, markdown adapter — all out of v0.1.

---

## 2. Final API (locked)

This is the public surface for v0.1.0. Every type goes in `types.ts` and is re-exported from `index.ts`. Plan refinements over the description's sketch (loud, not silent):

- **`__rcid` / `__rcorder` are optional on the input type** (description sketched them as required with a comment "auto-generated if absent" — TypeScript-correct shape is optional). The component fills them in at parse time.
- Added **`RichCardTree` (private)** — the normalized internal shape. Not exported.
- Added **`RichCardTree.parentKey`** — stores the property name each child was found under, so serialize can re-emit children at their original keys. **Required for Q3 round-trip fidelity** (caught during plan-review consistency pass — without this, child keys like `section1` / `section2` would be lost on serialize).
- Added **`Action` (private)** — strict-typed reducer-action union. Not exported.
- Added **`'aria-label'` prop** for the landmark name on the tree root, default `"Rich card"`.

```ts
// ───── public consts ─────

export const RESERVED_KEYS = ['__rcid', '__rcorder', '__rcmeta'] as const;
export const PREDEFINED_KEYS = ['codearea', 'image', 'table', 'quote', 'list'] as const;

// ───── public types ─────

export type PredefinedKey = typeof PREDEFINED_KEYS[number];
export type FlatFieldValue = string | number | boolean | null;

export type CodeAreaValue = { format: string; content: string };
export type ImageValue    = { src: string; alt?: string };
export type TableValue    = { headers: string[]; rows: FlatFieldValue[][] };
export type QuoteValue    = string;
export type ListValue     = FlatFieldValue[];

export type RichCardJsonNode = {
  __rcid?: string;                                     // auto-attached if absent
  __rcorder?: number;                                  // auto-attached if absent
  __rcmeta?: Record<string, FlatFieldValue>;
  [key: string]: unknown;                              // flat fields, predefined values, child nodes/arrays
};

export type LevelStyle = {
  containerClassName?: string;
  headerClassName?: string;
  fieldsClassName?: string;
  childrenClassName?: string;
};

export type RichCardProps = {
  defaultValue: RichCardJsonNode;                      // seed; remount via key prop to reset

  levelStyles?: LevelStyle[];                          // index = level - 1; last entry repeats deeper
  getLevelStyle?: (level: number) => LevelStyle;       // overrides levelStyles
  predefinedKeyStyles?: Partial<Record<PredefinedKey, string | LevelStyle>>;

  defaultCollapsed?: 'all' | 'none' | ((level: number) => boolean);
  metaPresentation?: 'hidden' | 'inline' | 'popover';
  disabledPredefinedKeys?: PredefinedKey[];
  dateDetection?: 'auto' | 'never' | ((value: string) => boolean);

  className?: string;
  'aria-label'?: string;                               // default "Rich card"
};

export type RichCardHandle = {
  getValue(): string;                                  // canonical JSON (pretty-printed)
  getTree(): RichCardJsonNode;                         // parsed object form, with auto-attached IDs
};

// ───── private (NOT exported) ─────

type FlatFieldType = 'string' | 'number' | 'boolean' | 'date' | 'null';

type RichCardTree = {
  id: string;
  order: number;
  level: number;                                       // 1 = root
  parentKey?: string;                                  // property name on parent that pointed to this card; undefined only on root. Used to round-trip the original key through serialize.
  meta?: Record<string, FlatFieldValue>;
  fields: Array<{ key: string; value: FlatFieldValue; type: FlatFieldType }>;
  predefined: Array<{ key: PredefinedKey; value: unknown }>;
  children: RichCardTree[];                            // sorted by order ascending
};

type Action =
  | { type: 'toggle-collapse'; id: string }
  | { type: 'set-focus'; id: string | null }
  | { type: 'replace-tree'; tree: RichCardTree };
```

**Defaults:**
- `metaPresentation`: `'hidden'`
- `defaultCollapsed`: `'none'`
- `dateDetection`: `'auto'`
- `disabledPredefinedKeys`: `[]`
- `'aria-label'`: `"Rich card"`

**Required props:** `defaultValue`. Everything else is optional.

**Counts:** 9 public types + 2 const exports + 1 component + 1 ref-handle type. 1 required prop, 9 optional props. Within the description's ~12-prop budget.

---

## 3. Architecture

### 3.1 Two-layer data model: input vs. internal

Public API: `RichCardJsonNode` — the loose, dynamic-key shape consumers write.
Internal: `RichCardTree` — normalized, statically-keyed, sorted, type-tagged.

**Parse pass** (`lib/parse.ts`) walks the input once:

1. Validate node is a non-array object → else push error, skip.
2. Resolve identity: `id` from `__rcid` (or `crypto.randomUUID()`), `order` from `__rcorder` (coerced to `0` if non-numeric, with warning).
3. Validate `__rcmeta` shape (object of scalar values) → drop bad entries, warn.
4. For each non-reserved property in object-key insertion order:
   - Call `classifyKey(key, value, opts.disabledPredefinedKeys)` → `'reserved' | 'predefined' | 'field' | 'child'`.
   - **Reserved-key collision on a non-reserved name:** push error, skip. (Can't happen on reserved names since those are short-circuited above; this fires on attempts to use a `PREDEFINED_KEYS` name as a flat field when the key is **not** disabled — see §5.3.)
   - **Predefined:** validate payload shape against the matching `*Value` type. Valid → push to `predefined[]`. Invalid → drop + warn.
   - **Field:** infer type via `inferFlatFieldType(value, opts.dateDetection)`. Push to `fields[]`.
   - **Child:** if value is an array → push error and skip (per locked Q-P4: arrays of objects are not supported as children in v0.1). Else recursively parse with `parentKey = key`. Push to `children[]`.
5. Sort `children` by `order` ascending.
6. Return `{ tree, errors }`.

**Serialize pass** (`lib/serialize.ts`) walks `RichCardTree` and rebuilds the dynamic-key object. Property emission order:
1. `__rcid`
2. `__rcorder`
3. `__rcmeta` (if present)
4. Flat fields in original insertion order (preserved from parse via `fields` array order)
5. Predefined-key elements in original insertion order
6. Children in `order` ascending — **each emitted under its stored `parentKey`** (so input keys like `section1` / `section2` round-trip identically)

`getValue()` returns `JSON.stringify(node, null, 2)` (pretty-printed canonical). Consumers wanting compact form can `JSON.parse(handle.getValue())` and re-stringify.

The two passes form the round-trip contract per locked Q3:

```
parse(serialize(parse(x))) === parse(x)
```

Fixed-point on the second round trip. Both passes are pure functions in `lib/`, so they're independently testable when Vitest lands.

### 3.2 Rendering: depth-first walk with ARIA tree semantics

`rich-card.tsx` renders a `<ul role="tree">` containing a single `<Card tree={root} level={1} />`. `parts/card.tsx` renders its own structure recursively:

```tsx
<li role="treeitem" aria-level={level} aria-expanded={!collapsed} aria-selected={isFocused}>
  <CardHeader />                          {/* title, collapse toggle, meta trigger */}
  <div className={fieldsClassName}>
    <FieldList />                         {/* dl of typed key/value rows */}
    <PredefinedList />                    {/* codearea/image/table/quote/list elements */}
  </div>
  {hasChildren && !collapsed && (
    <ul role="group" className={childrenClassName}>
      {children.map(child => <Card tree={child} level={level + 1} />)}
    </ul>
  )}
</li>
```

`level` is passed via prop chain — no React context needed in v0.1 (level is static at render time; predefined-key set is closed). **Flagged Q-P1.**

### 3.3 State model: single reducer over collapse + focus

State:

```ts
{
  tree: RichCardTree;                  // parsed once; replaced only by `replace-tree` action (used internally on key remount)
  collapsed: ReadonlySet<string>;      // ids of currently-collapsed cards
  focusedId: string | null;            // tree-keyboard focus target
}
```

Reducer (pure, in `lib/reducer.ts`):

| Action | Effect |
|---|---|
| `toggle-collapse` | Flip the id's presence in `collapsed`. Returns same state if id is unknown. |
| `set-focus` | Replace `focusedId` (with bounds-check: must be a valid id in tree). |
| `replace-tree` | Wholesale replace the tree. Used internally by `rich-card.tsx` if the consumer remounts via `key`. |

Initial state computed in `createInitialState(input, props)`:
- Parse `input` → tree (or error tree if parse fails).
- Resolve `defaultCollapsed`:
  - `'all'` → all card ids in the collapse set.
  - `'none'` → empty set.
  - function → walk tree, call function with each card's level, collect collapsed ids.
- `focusedId = null` (set on first user interaction, not at mount).

### 3.4 Per-card props vs. context

**No React context in v0.1.** Every card receives its full render config via prop drilling: `level`, `levelStyle`, `predefinedKeyStyles`, `dateDetection`, `metaPresentation`, `disabledPredefinedKeys`, `dispatch` (for keyboard interactions), `state` slices needed for that card.

Why: simpler. React 19's compiler memoization handles the prop-drilling cost. Adding a context provider + hook + default values is boilerplate without v0.1 benefit. We'll revisit when (a) editing operations need to dispatch from deep in the tree (v0.2), or (b) custom predefined-key components need to read level (v0.3).

### 3.5 Pure helpers in `lib/`

| File | Exports | Purpose |
|---|---|---|
| `parse.ts` | `parseInput(node, opts) => { tree, errors }` | Input → normalized tree |
| `serialize.ts` | `serializeTree(tree) => string`, `treeToJsonNode(tree) => RichCardJsonNode` | Tree → canonical JSON / object form |
| `classify-key.ts` | `classifyKey(key, value, disabled) => 'reserved' \| 'predefined' \| 'field' \| 'child'` | Key router |
| `infer-type.ts` | `inferFlatFieldType(value, mode) => FlatFieldType` | Scalar type tagging incl. ISO-8601 detection |
| `reducer.ts` | `reducer(state, action)`, `createInitialState(...)` | Pure state machine |

All five are pure JS modules with no React imports.

---

## 4. File structure

```
src/registry/components/data/rich-card/
├── rich-card.tsx                  ← root; "use client"; useReducer + useImperativeHandle + ARIA tree
├── parts/
│   ├── card.tsx                   ← single card: <li role="treeitem">; recursive children
│   ├── card-header.tsx            ← title row, collapse chevron, meta trigger
│   ├── field-row.tsx              ← typed key/value renderer (string/number/boolean/date/null)
│   ├── meta-popover.tsx           ← Popover affordance for metaPresentation="popover"
│   ├── meta-inline.tsx            ← inline strip for metaPresentation="inline"
│   ├── predefined-codearea.tsx    ← styled monospace block (no syntax highlighting in v0.1)
│   ├── predefined-image.tsx       ← <img> with alt; max-width contained
│   ├── predefined-table.tsx       ← simple table, headers row + data rows
│   ├── predefined-quote.tsx       ← styled blockquote
│   └── predefined-list.tsx        ← bullet list of typed scalars
├── hooks/
│   ├── use-collapse-state.ts      ← isCollapsed(id) + toggle dispatch helper
│   ├── use-tree-focus.ts          ← focusedId helper + traversal-order id list
│   └── use-tree-keyboard.ts       ← keyboard handler bound to root; arrow nav, expand/collapse, home/end
├── lib/
│   ├── parse.ts                   ← input → RichCardTree (pure)
│   ├── serialize.ts               ← RichCardTree → canonical JSON (pure)
│   ├── classify-key.ts            ← key → 'reserved'|'predefined'|'field'|'child' (pure)
│   ├── infer-type.ts              ← scalar value → FlatFieldType incl. ISO-8601 detection (pure)
│   └── reducer.ts                 ← state machine (pure)
├── types.ts                       ← every public export from §2
├── dummy-data.ts                  ← three demo trees: ADR (typed scalars + codearea + quote), agent trace (numbers + booleans + meta + popover), bare-no-IDs (showcases canonicalization)
├── demo.tsx                       ← renders three demos in a stack
├── usage.tsx                      ← prose docs
├── meta.ts                        ← ComponentMeta
└── index.ts                       ← barrel
```

**Deviation from convention:** the component-guide §5 anatomy lists `parts/` and `hooks/` as optional. **`lib/` is added** for pure non-React helpers. Same justification as workspace's plan: parsing/serialization/classification are pure non-React algorithms that benefit from being testable in isolation when Vitest lands. **Flagged Q-P2.**

**Counts:** 7 mandatory anatomy files + 10 parts + 3 hooks + 5 lib = **25 files total**. Slightly smaller than workspace (26); larger than data-table.

---

## 5. Parsing & canonicalization

### 5.1 Parse algorithm (pseudocode)

```
parseInput(input, opts) → { tree, errors }:
  errors = []
  tree = parseNode(input, parentKey=undefined, level=1, opts, errors)
  return { tree, errors }

parseNode(node, parentKey, level, opts, errors):
  if node is null/undefined or not an object or is an array → push error, return null

  id = (typeof node.__rcid === 'string' && node.__rcid.length) ? node.__rcid : crypto.randomUUID()
  order = (typeof node.__rcorder === 'number' && Number.isFinite(node.__rcorder)) ? node.__rcorder : 0
  if node.__rcorder && !Number.isFinite(node.__rcorder): warn("non-numeric __rcorder coerced to 0")

  meta = parseMeta(node.__rcmeta, errors)   // drop non-scalar entries

  fields = []
  predefined = []
  children = []
  seenKeys = new Set()

  for (key of Object.keys(node) in insertion order):
    if RESERVED_KEYS.includes(key): continue
    if seenKeys.has(key): error("duplicate sibling key: " + key); continue
    seenKeys.add(key)

    value = node[key]
    classification = classifyKey(key, value, opts.disabledPredefinedKeys)

    switch classification:
      case 'reserved':
        // only fires when classifyKey rejects (shouldn't happen here since reserved are skipped above)
        error("reserved-key collision: " + key)
        break

      case 'predefined':
        validated = validatePredefinedShape(key, value, errors)
        if (validated): predefined.push({ key, value: validated })
        // invalid → drop + already-warned

      case 'field':
        type = inferFlatFieldType(value, opts.dateDetection)
        if (type === null):  // unrecognized (e.g., undefined)
          error("unsupported flat-field value type for key: " + key)
        else:
          fields.push({ key, value, type })

      case 'child':
        if (Array.isArray(value)):
          // arrays-of-objects are NOT supported as children in v0.1 (per locked Q-P4)
          error("array values are not supported as children in v0.1 (key: " + key + "). Use object-keyed children, or the `list` predefined key for scalar arrays.")
          break
        child = parseNode(value, /*parentKey=*/key, level + 1, opts, errors)
        if (child): children.push(child)

  children.sort((a, b) => a.order - b.order)
  return { id, order, level, parentKey, meta, fields, predefined, children }
```

Parse errors are collected, not thrown. Caller (`rich-card.tsx`) decides what to do with them: in v0.1, they're surfaced as `console.warn` lines with a single `console.error` summary listing all errors, and the tree renders best-effort with bad entries skipped.

### 5.2 Type-inference rules

`inferFlatFieldType(value, mode)`:

| Value | Resolved type |
|---|---|
| `null` | `'null'` |
| `typeof === 'boolean'` | `'boolean'` |
| `typeof === 'number'` and `Number.isFinite(value)` | `'number'` |
| `typeof === 'number'` and NOT finite (`NaN`, `Infinity`) | warn + coerce to `'string'` rendering of the value |
| `typeof === 'string'` and mode === `'never'` | `'string'` |
| `typeof === 'string'` and mode is a function and `mode(value) === true` | `'date'` |
| `typeof === 'string'` and mode === `'auto'` and matches ISO-8601 regex AND `Date.parse(value)` is not NaN | `'date'` |
| `typeof === 'string'` (else) | `'string'` |
| Anything else (array, object) | caller would not reach here (would be classified as `'child'` or `'predefined'`); if reached → `null` (signaling unsupported) |

ISO-8601 regex (locked): `^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})?)?$`

The `Date.parse` validation rules out false positives like `"2026-12-99"` (matches regex; `Date.parse` returns `NaN`).

### 5.3 Predefined-key shape validation

| Key | Required shape |
|---|---|
| `codearea` | `{ format: string; content: string }` |
| `image` | `{ src: string; alt?: string }` |
| `table` | `{ headers: string[]; rows: FlatFieldValue[][] }` (each row's length must equal `headers.length`) |
| `quote` | `string` |
| `list` | `FlatFieldValue[]` (each element must be a JSON scalar) |

Validation failures **drop the entry** with a console-warned error. The dropped entry does NOT round-trip back out — it's gone. Consumers who need to keep an arbitrary same-name key as a flat field must add it to `disabledPredefinedKeys`. Documented in usage.

### 5.4 `classifyKey` decision tree

```
classifyKey(key, value, disabledKeys):
  if RESERVED_KEYS.includes(key)       → 'reserved'      // auto-skipped by parser
  if PREDEFINED_KEYS.includes(key):
    if disabledKeys.includes(key)      → 'field'         // user opted out
    else                               → 'predefined'
  if value is a JSON scalar (string/number/boolean/null) → 'field'
  if value is a non-null, non-array object → 'child'
  if value is an array                 → 'child'         // parser rejects in v0.1 (Q-P4)
  else (undefined, function, etc.)     → 'field'         // (with type=null → error)
```

### 5.5 Canonicalization on output

`__rcid` and `__rcorder` are written into the JSON output by `serializeTree`, even if absent on input. **Each child is re-emitted under its stored `parentKey`**, so input keys like `section1` / `section2` / any consumer-chosen names round-trip identically. So the round trip:

1. `parse(rawInput)` → tree (with auto-attached IDs and per-child `parentKey`)
2. `serialize(tree)` → canonical JSON string (IDs included; child keys preserved)
3. `parse(canonicalJson)` → identical tree

Fixed-point on the second round trip. v0.2 editing operations rely on IDs being present — v0.1 effectively prepares JSON for the editor, which is the standalone use case in description §5.3.

---

## 6. Rendering & styling

### 6.1 Per-level style resolution

```
resolveLevelStyle(level, props):
  if (props.getLevelStyle): return props.getLevelStyle(level)
  if (props.levelStyles?.length):
    return props.levelStyles[Math.min(level - 1, props.levelStyles.length - 1)]
  return DEFAULT_LEVEL_STYLES[Math.min(level - 1, DEFAULT_LEVEL_STYLES.length - 1)]
```

Built-in `DEFAULT_LEVEL_STYLES` (semantic tokens only, per design-system mandate):

| Level | Default container className |
|---|---|
| 1 | `rounded-2xl border-2 border-border bg-card p-6 shadow-sm` |
| 2 | `rounded-xl border border-border bg-muted/40 p-4` |
| 3+ | `rounded-lg border border-border/50 bg-muted/20 p-3` |

Header / fields / children classNames inherit sensible defaults (header: `flex items-center justify-between gap-3`; fields: `mt-3 grid gap-2`; children: `mt-3 space-y-2 ps-4 border-s border-border/40`).

All defaults use `border` / `card` / `muted` / `border-border` / etc. — never hardcoded colors.

### 6.2 Per-predefined-key styling resolution

```
resolvePredefinedStyle(key, props):
  s = props.predefinedKeyStyles?.[key]
  if (typeof s === 'string') return { containerClassName: s }
  return s ?? DEFAULT_PREDEFINED_STYLES[key]
```

`LevelStyle`-shape support means `table` (which has natural slots: header row vs body rows) can be customized at multiple levels. Other keys (codearea, image, quote, list) typically only need `containerClassName`.

### 6.3 Field-row rendering by type

| Type | Rendering |
|---|---|
| `string` | Plain text in `<dd>`, inherits Onest sans |
| `number` | Right-aligned, JetBrains Mono mono font, `tabular-nums` |
| `boolean` | `lucide-react/Check` icon if true, `lucide-react/Minus` if false |
| `date` | Formatted via `Intl.DateTimeFormat(undefined, { dateStyle: 'medium' })` (or full date+time if value has a time component) |
| `null` | Em-dash `—` in `text-muted-foreground` |

Each card's fields render inside one `<dl>`. Each row is `<div class="flex">` containing `<dt class="font-mono text-muted-foreground">{key}</dt>` and `<dd>{typedRenderer(value)}</dd>`. Definition-list semantics inside a treeitem are valid HTML.

### 6.4 Collapse animation

Pure CSS transition: `max-height` + `opacity` on the children-group `<ul role="group">`. No `Collapsible` shadcn primitive (avoids one more install, and our tree doesn't need height-aware animation logic since the simple max-height approach is sufficient for v0.1). **Flagged Q-P3.**

`prefers-reduced-motion`: skip the transition (instant snap).

### 6.5 Meta presentation modes

| Mode | Render |
|---|---|
| `hidden` | Not rendered. Default. |
| `inline` | Small mono-text strip below the card header showing `key: value · key: value` separated by interpuncts (`·`). One-line, truncated with `text-ellipsis` on overflow. |
| `popover` | `lucide-react/Info` icon button in the card header. Click opens a shadcn `<Popover>` containing the meta key/value list as a `<dl>`. |

Empty meta (no entries) → renders nothing regardless of mode.

---

## 7. Composition pattern

Per component-guide §9, the canonical patterns are: render-props, generics, `children`, slot-props, headless+presentation.

**Rich-card's pattern: slot-classNames + closed sub-component set.**
- Single public component `<RichCard>`. `forwardRef` exposing `RichCardHandle`.
- Sub-components (`Card`, `CardHeader`, `FieldRow`, `Predefined*`) are **all private** in v0.1 — not exported.
- Customization happens through the slot-className props (`levelStyles`, `predefinedKeyStyles`, `className`).
- No render-props in v0.1. Custom predefined-key components and custom field renderers are deferred to v0.3.

State: **uncontrolled** (locked Q10). `defaultValue` is the seed; `key` remount resets. No controlled-mode `value` + `onChange` in v0.1 (might add in v0.2 if real consumers need it).

---

## 8. Client/server boundary

`rich-card.tsx`: **`"use client"`**. Required for: `useReducer`, `useRef`, `useImperativeHandle`, keyboard event handlers, click handlers on collapse toggle / meta trigger.

Server-safe (no directive needed):
- `types.ts`, `lib/*.ts`, `meta.ts`, `index.ts`, `dummy-data.ts` — pure modules, no React runtime.
- `demo.tsx` — server component that renders `<RichCard>` with the dummy data. The "use client" boundary inside `<RichCard>` handles hydration.
- `usage.tsx` — server component, prose only.

Inherit "use client" from import boundary (no explicit directive needed, but allowed):
- `parts/*.tsx`, `hooks/*.ts`.

---

## 9. Dependencies

### shadcn primitives

| Primitive | Used for | Already installed? |
|---|---|---|
| `popover` | `metaPresentation="popover"` trigger + content | ✗ (verified — must add before scaffolding) |
| `separator` | Optional visual rule between fields and predefined regions | ✓ |

**Install command before scaffolding:** `pnpm dlx shadcn@latest add popover`.

`meta.ts` `dependencies.shadcn`: `["popover", "separator"]`.

### npm peer deps

| Package | Used for |
|---|---|
| `lucide-react` | Icons: `ChevronRight` (collapse), `Check` / `Minus` (boolean fields), `Info` (meta popover trigger) |

`meta.ts` `dependencies.npm`: `{ "lucide-react": "^x.y.z" }` (resolve actual version range at scaffold time).

### internal

None. `rich-card` doesn't compose other registry components.

`meta.ts` `dependencies.internal`: `[]`.

### Zero-cost browser APIs (no deps required)

- `crypto.randomUUID()` — UUID generation. Standard in browser + Node 19+.
- `Intl.DateTimeFormat` — date formatting. Standard.
- `Date.parse()` — ISO-8601 validation. Standard.

### Banned / not-imported

- `next/*` — per portability contract.
- `process.env` — per portability contract.
- App-context — per portability contract.
- **`unified` / `remark-*` / `mdast-*` / any markdown parser** — per locked top-level deviation. Confirm at scaffold time and again pre-PR that no markdown deps have crept in (transitive or direct).

---

## 10. Edge cases

| Case | Behavior |
|---|---|
| `defaultValue` is undefined / null / not an object | Render error card: "Invalid input — `defaultValue` must be a JSON object." Don't crash. Still renders the root `<ul role="tree">` for a11y consistency. |
| Empty card (no fields, predefined, children) | Renders header + empty body. Visually intentional (a card *can* be just a title). |
| Reserved-key collision on a flat field (`__rcid` used as field name) | Auto-skipped during parse — reserved keys are extracted before the field loop. Effectively impossible in this code path; no error needed. |
| Predefined-key with invalid shape (`codearea: 42`) | Drop the entry + warn. Does NOT round-trip. Consumer can fix in source, or add the key to `disabledPredefinedKeys` to keep it as a flat field. |
| Disabled predefined key (`disabledPredefinedKeys: ['codearea']`) with object value | Treated as 'field' classification, but value is an object → field validation fails → drop + warn. Consumers using `disabledPredefinedKeys` should pass scalar values. |
| Sibling-key collision (impossible from `JSON.parse`, possible from JS-constructed objects) | First wins, subsequent entries dropped + warned. |
| `__rcorder` is `NaN` / `Infinity` / a string | Coerced to `0` + warn. |
| Two siblings with same `__rcid` | Keep first; regenerate id for duplicates + warn. |
| Two siblings with same `__rcorder` | Allowed; tie-break by input-traversal order. |
| Child value is an array (of objects or scalars) | **Rejected with parse error** (per locked Q-P4): "array values are not supported as children in v0.1; use object-keyed children, or the `list` predefined key for scalar arrays." Other keys on the same card still parse normally. |
| Child value is `null` or a primitive | `null` → `'null'` flat field. Primitives → flat field per `infer-type`. |
| Date-detection false positive on string like `"2026-12-99"` | Pattern matches; `Date.parse` returns `NaN`; falls back to `'string'`. |
| Very long string field value | Renders in a `<dd>` that wraps; no truncation in v0.1. |
| Very deep tree (> 50 levels) | Renders correctly; per-level styling clamps to last entry. The container's natural overflow handles horizontal scroll if children indent past viewport. |
| Very wide siblings (> 100 cards at one level) | Renders correctly. Performance budget covers ~500 nodes total tree-wide. |
| `defaultValue` reference changes after mount | Ignored (uncontrolled). To reset, consumer remounts via `key` prop. Documented in usage. |
| `levelStyles` / other style props change mid-session | Re-renders with new styles; collapse and focus state preserved. |
| Meta value with non-scalar (e.g. nested object) | Dropped during meta parse + warn. Meta values must be scalars. |
| `aria-label` empty string | Falls back to default `"Rich card"`. |
| RTL (`dir="rtl"` on parent) | Card layout uses CSS logical properties; indentation flips. Arrow-key semantics unchanged: `→` always means "expand/descend deeper" per ARIA tree spec, even when visually it points "left" in RTL. |

---

## 11. Accessibility

### Tree semantics

- **Root container:** `<div role="region" aria-label={ariaLabel}>` wrapping the tree (default label `"Rich card"`).
- **Tree:** `<ul role="tree">` (only at the top level; nested children use `role="group"`).
- **Card item:** `<li role="treeitem" aria-level={level} aria-expanded={!collapsed} aria-selected={isFocused} aria-labelledby={titleId}>`.
- **Children group:** `<ul role="group">` only when expanded **and** the card has children.
- **Collapse toggle:** `<button>` inside `card-header.tsx` with `aria-label={collapsed ? "Expand card" : "Collapse card"}`. Activatable via Enter / Space (also via global keyboard shortcuts; both paths dispatch the same action).
- **Meta popover trigger:** `<button>` with `aria-label="Show meta information"`; the shadcn `Popover` primitive handles `aria-haspopup` / `aria-expanded` automatically.
- **Field rows:** `<dl>` per card; `<dt>` is the key, `<dd>` carries the typed value. Definition-list semantics inside a `treeitem` are valid HTML.
- **Boolean field icons:** wrapped with `aria-label="true"` / `aria-label="false"` (icons alone aren't readable).
- **Date field:** the formatted display string is sufficient; raw ISO string is in a `title` attribute for screen-reader users who want it.

### Keyboard model

| Key | Action |
|---|---|
| `Tab` | Move focus into the tree (lands on the first treeitem). Subsequent `Tab` exits the tree. |
| `↑` / `↓` | Move focus to previous / next visible treeitem (depth-first, skipping collapsed subtrees). |
| `→` | If focused card is collapsed → expand. If expanded with children → focus first child. Else no-op. |
| `←` | If focused card is expanded → collapse. If collapsed or leaf → focus parent. |
| `Home` | Focus first treeitem (root). |
| `End` | Focus last visible treeitem. |
| `Enter` / `Space` | Toggle collapse on focused card. |
| `*` (asterisk) | Optional: expand all siblings of focused card. **Deferred** — not in v0.1. |

Type-ahead (jumping to next card whose title starts with a typed letter) is **deferred** to v0.2+ along with selection.

### Focus management

- Focus ring on the focused treeitem: `focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2`. Inset offset to avoid clipping.
- When a card is collapsed via keyboard while one of its descendants holds focus, focus moves up to the collapsed card.
- When the tree mounts, no card is focused; first `Tab` into the tree focuses the root card.

### Reduced motion

`prefers-reduced-motion: reduce` → skip collapse transition (instant snap).

### RTL

- All padding / margin / border classes use logical properties (`ps-4` / `pe-4` / `border-s` / `border-e`).
- Tree-keyboard semantics unchanged across LTR / RTL (per ARIA tree spec — `→` always descends, never visually right-arrow).

---

## 12. Performance

| Concern | Strategy |
|---|---|
| Re-renders on collapse toggle | Only the toggled card and its children-group re-render. Collapse state in a memoized `Set`; equality check by id. |
| Tree walks on every render | `RichCardTree` is parsed once and stored in reducer state. No re-parsing per render. |
| Many cards rendered | React 19 compiler should auto-memo `<Card>` subtrees. Verify in profiling; fall back to manual `React.memo` keyed by `tree.id` if needed. |
| Date-detection cost | Cheap (regex + `Date.parse`); not in render hot path (computed at parse time). |
| Initial parse | Single O(n) pass over input. Validated up-front. |
| Memory | Internal `RichCardTree` is ~2× the input shape (extra type tags + sorted children); acceptable for ≤ 500 nodes. |
| Prop drilling | Per-level resolved style memoized at the root and passed by reference; React 19 should not re-render leaves on unrelated state changes. |

**Budget:** 500 leaves at 60fps during sustained collapse-toggle / arrow-nav on a mid-tier laptop (per success criterion #10). If profiling fails the budget, fall back to manual `React.memo` wrappers around `<Card>`. That fallback is documented but not implemented unless needed.

**No test runner** is wired in this repo (description risk §8). Plan-stage stance: ship v0.1 with extensive demo-driven verification + an explicit STATUS.md test-debt entry. Round-trip property tests (random `RichCardJsonNode` → `parse` → `serialize` → `parse` → assert tree-equal) are the highest-priority test once Vitest lands. **Flagged Q-P5.**

---

## 13. Risks & alternatives

### Risks (carried from description, with plan-stage mitigations)

| Risk | Mitigation in this plan |
|---|---|
| Scope creep across phases | This plan is explicit: v0.1 viewer only. Editing / dnd / permissions / validation / undo all out of v0.1. Each future phase needs its own plan revision. |
| Accessibility debt | Full ARIA tree + keyboard from §11 — designed in, not bolted on. Editing layers in v0.2 will add textbox roles + live regions; that's a v0.2-plan concern. |
| Performance regression | 500-node budget + memoization strategy in §12. Manual `React.memo` fallback documented. |
| Date-detection heuristic | Strict mode (regex + `Date.parse` validation) per §5.2. `dateDetection: 'never'` opt-out and `dateDetection: fn` for custom predicates. |
| Test coverage | Pure `lib/` modules trivially testable when Vitest lands. v0.1 ships with demo verification + STATUS test-debt note. |
| Markdown-adapter creep | This plan contains **zero** markdown-shaped concessions. No definition-list field encoding. No HTML-comment meta. v0.5 adapter (if ever) is a clean external module operating on `RichCardJsonNode`. |

### Alternatives considered, rejected

- **Internal tree as JSON-shaped (no normalization).** Saves a parse pass but pushes key-classification into every render. Rejected — parse once, render fast.
- **External tree-rendering library (`react-arborist`, `@uiw/react-json-view`).** Both excellent for their use cases (huge trees, JSON exploration); neither supports per-type scalar rendering, predefined-key content blocks, or per-level styling slots. Wrapping them would mostly mean fighting them. Build wins.
- **`react-aria` `Tree` primitive.** Mature, accessible, but the scaffold is overkill for v0.1's scope and adds a non-trivial dep. Pure-DOM ARIA roles handle our needs.
- **Compound-component API (`<RichCard.Card>` etc.).** Adds a parallel surface that only matters once we have customization beyond classNames; v0.3 is the right time. Defer.
- **Live `useLevelContext()` hook.** Cleaner for consumer-supplied custom predefined components; no consumer needs it in v0.1 (predefined-key set is closed). Defer to v0.3.
- **Syntax highlighting in `codearea` v0.1.** `prism-react-renderer` / `shiki` adds 50KB+ and runtime overhead. v0.1 ships a styled monospace block. Highlighting in v0.2 if there's appetite.
- **Server-side parsing (RSC).** Tempting because parsing is pure, but the component needs `useReducer` for collapse state, which is client-only. The whole component is `"use client"`.
- **`Collapsible` shadcn primitive for animation.** Marginal value over pure CSS height/opacity transitions; adds another install. Rejected for v0.1.

---

## 14. Plan-stage open questions

The description sealed the *what*. These five are *how* questions the plan needs your call on before scaffolding.

| # | Question | Recommendation | Why |
|---|---|---|---|
| Q-P1 | **Live `useLevelContext()` hook or prop-chain `level` for v0.1?** | **Prop-chain.** | Level is static at render time; predefined-key set is closed in v0.1. A hook adds boilerplate (provider + hook + default fallback) without v0.1 benefit. v0.3 adds it when custom predefined-key components arrive. |
| Q-P2 | **Add `lib/` directory** for pure parser / serializer / classifier / type-inference / reducer, deviating from §5 anatomy that lists only `parts/` and `hooks/` as optional? | **Yes — add `lib/`.** | Same justification as workspace's plan: parsing / serialization / classification are pure non-React algorithms that benefit from being testable in isolation when Vitest lands. The `hooks/` folder is the wrong home for non-React code. |
| Q-P3 | **Collapse animation: pure CSS or shadcn `Collapsible` primitive?** | **Pure CSS** (`max-height` + `opacity` transition). | Less dep surface; the simple animation is sufficient for v0.1 and easier to make `prefers-reduced-motion`-correct. `Collapsible` adds another install for marginal benefit. |
| Q-P4 | **Child value that's an array of objects:** flatten / wrap / disallow? | ⚠ **Disallow + clear parse error in v0.1.** Updated from "flatten" during plan-review consistency pass — flatten silently breaks the Q3 round-trip contract (parent key is lost; serialize cannot reconstruct it). | The original brief says "Nested **objects** become child cards" (singular). v0.2 editing needs each child to have a stable parent-key for path semantics; arrays-of-objects make paths ambiguous. The simplest contract that round-trips correctly. Consumers with array data convert to object-keyed form before passing (e.g. `{ items: [a, b, c] }` → `{ items: { item_0: a, item_1: b, item_2: c } }`); the `list` predefined key handles scalar arrays. v0.3 may revisit with the wrap behavior locked in then. |
| Q-P5 | **Test-runner stance.** Same question as workspace's plan Q-P6. | **Ship with test-debt note.** Pure `lib/` modules will be testable when Vitest lands; round-trip property test is the one I'd want first. | Blocking on a test-runner decision delays v0.1 indefinitely. STATUS-level conversation is separate. Test debt is honest and recoverable. |

---

## 15. Definition of "done" for THIS document (stage gate)

Before any code or scaffolding:

- [ ] User reads §1–§13 (the locked plan) and §14 (plan-stage Qs).
- [ ] Each Q-P1 through Q-P5 has either an "agreed" or override answer.
- [ ] User explicitly says **"plan approved"** (or equivalent) — this unlocks Stage 3 (implementation).

After sign-off, the next session starts with:

1. `pnpm dlx shadcn@latest add popover` (the only missing primitive)
2. Open a STATUS.md note recording the test-debt for `rich-card`
3. `pnpm new:component data/rich-card`
4. Implement against this plan, file by file. Suggested order:
   1. `types.ts` — lock the public surface from §2
   2. `lib/classify-key.ts`, `lib/infer-type.ts` — small pure helpers
   3. `lib/parse.ts`, `lib/serialize.ts` — round-trip pair; manually verify by passing the dummy data through both
   4. `lib/reducer.ts` — state machine + initial-state factory
   5. `parts/predefined-codearea.tsx` … `parts/predefined-list.tsx` — five leaf renderers (independent)
   6. `parts/field-row.tsx` — typed value renderer
   7. `parts/card-header.tsx`, `parts/meta-popover.tsx`, `parts/meta-inline.tsx`
   8. `parts/card.tsx` — recursive card shell
   9. `hooks/use-collapse-state.ts`, `hooks/use-tree-focus.ts`, `hooks/use-tree-keyboard.ts`
   10. `rich-card.tsx` — root, ARIA tree wrapper, `forwardRef` + `useImperativeHandle`
   11. `dummy-data.ts` — three demo trees
   12. `demo.tsx`
   13. `usage.tsx`
   14. `meta.ts`
   15. `index.ts`
5. Author `rich-card-procomp-guide.md` (Stage 3) alongside the implementation
6. Run the verification checklist from `docs/component-guide.md`
7. Update `.claude/STATUS.md` with the new entry

If at any point during implementation a plan decision turns out wrong, **stop, document the issue, ask before deviating**. The plan is the contract; deviations are loud, not silent.
