# `filter-stack` — v0.1 Plan (Stage 2)

> **Status:** **signed off 2026-04-29.** Validate-pass refinements applied (9 fixes: 5 substantive + 4 minor — Q-P4 typing collapse fix; **Q-P7 reversed: install shadcn `ToggleGroup` instead of rolling our own 2-button radiogroup**; Q-P3 solo-click branch by `modeToggle`; §6 + §7.1 schema-validation wiring lock (`useEffect` in `filter-stack.tsx`, no separate hook); §4.2 + §7.1 stateful `useTextBuffer` hook ownership lock; §3.1 stale comment dropped; §9 unstable-`predicate` row added; §9 `onFilteredChange`-throws row added; §6 plan-stage extensions (duplicate-id + missing-options) flagged as scope-tagged). All 10 Q-Ps locked.
> **Slug:** `filter-stack` · **Category:** `forms` · **Tier:** 1 (generic; no graph dependency)
> **Parent description:** [filter-stack-procomp-description.md](filter-stack-procomp-description.md) (signed off 2026-04-28)
> **Parent system:** [graph-system](../../systems/graph-system/graph-system-description.md) — Tier 1 (independent at the registry level per [decision #35](../../systems/graph-system/graph-system-description.md))
> **Sibling completion:** unblocks the [`force-graph` v0.4 plan-lock](../force-graph-procomp/force-graph-procomp-description.md) (Groups phase; 2.5w focused). Tier 1 plan-lock cascade after this: 3 of 5 done (with [`properties-form`](../properties-form-procomp/properties-form-procomp-plan.md) + [`detail-panel`](../detail-panel-procomp/detail-panel-procomp-plan.md) signed off 2026-04-29).

---

## 1. Inherited inputs (one paragraph)

Builds against [filter-stack description §8 locked decisions](filter-stack-procomp-description.md#8-resolved-questions-locked-on-sign-off-2026-04-28) (10 questions; Q2 reversed and Q7 refined on review) and [§8.5 plan-stage tightenings](filter-stack-procomp-description.md#85-plan-stage-tightenings-surfaced-during-description-review--re-validation) (6 surfaced). Inherits system constraints: [decision #9](../../systems/graph-system/graph-system-description.md) (filter composition AND-across-categories / OR-within-category — inherited from original spec §5.2), [#12](../../systems/graph-system/graph-system-description.md) (search-overrides-filters — explicitly host-level per filter-stack description §3, NOT a filter-stack prop), [#25](../../systems/graph-system/graph-system-description.md) (per-component permission resolver — N/A; filter-stack has no permission concept), [#35](../../systems/graph-system/graph-system-description.md) (Tier 1 independence — filter-stack imports no other Tier 1 component), [#37](../../systems/graph-system/graph-system-description.md) (design-system mandate — Onest + JetBrains Mono, OKLCH only). Pattern parity: mirrors [`properties-form` plan §3.3](../properties-form-procomp/properties-form-procomp-plan.md#33-component-props) controlled-only props posture (Q6 of properties-form's description) and [`properties-form` plan §11.1.1](../properties-form-procomp/properties-form-procomp-plan.md#1111-schema-reference-stability-host-responsibility) schema-reference-stability guidance — `categories` is filter-stack's analogue of `schema`.

---

## 2. v0.1 scope summary

The deliverable is a single Tier 1 pro-component at `src/registry/components/forms/filter-stack/`. Surface area:

- **Schema-driven filter sections** — host supplies an array of filter category definitions; component renders them stacked vertically in supplied order.
- **Four built-in filter types** — `checkbox-list`, `toggle`, `text`, `custom`.
- **AND-across composition** — every active category's `predicate(item, value)` is `&&`'d to produce the filtered list. Within a category, the host's predicate decides "OR vs AND" semantics (mode flag is a hint stored on the side).
- **Per-category state** — flat `Record<string, FilterValue>` keyed by `category.id`. Mode for `checkbox-list` stored at `${id}__mode` per [Q6 lock](filter-stack-procomp-description.md#8-resolved-questions-locked-on-sign-off-2026-04-28).
- **Pure controlled** — `values` is a prop; `onChange` is mandatory. No `defaultValues`; no internal value state. (Mirrors properties-form Q6.)
- **`onFilteredChange` convenience callback** — fires only when filtered set actually changes per Q-P5.
- **Per-category clear button** rendered next to the section label when `isEmpty(value)` returns false.
- **Global clear-all** in the footer; disabled when ALL categories are empty.
- **Empty-detection per category** via `isEmpty(value)` — defaults supplied for `checkbox-list` and `text`; required for `toggle` and `custom` per [Q7 lock](filter-stack-procomp-description.md#8-resolved-questions-locked-on-sign-off-2026-04-28).
- **Mode toggle on `checkbox-list`** when `modeToggle: true` — renders union/intersection control via shadcn `ToggleGroup` (Q-P7 lock; reversed from "roll our own" on validate pass). Default mode: `"union"`.
- **Per-option solo buttons on `checkbox-list`** when `showSoloButtons: true` (opt-in) per [Q2 lock](filter-stack-procomp-description.md#8-resolved-questions-locked-on-sign-off-2026-04-28). Click sets value to `[optionValue]`; `__mode` key is written only when `modeToggle: true` (Q-P3 refinement on validate pass).
- **Debounced text input** — `debounceMs` per category (default 250 per Q8).
- **Generic typing** — `<FilterStack<T>>` parameterized over item type; default `T = unknown` per [Q5 lock](filter-stack-procomp-description.md#8-resolved-questions-locked-on-sign-off-2026-04-28).
- **Imperative ref handle** — `clearAll`, `clear(categoryId)`, `isEmpty()`.
- **Vertical layout only** — no collapsibles in v0.1; `direction` is a v0.2 additive prop per [Q10 lock](filter-stack-procomp-description.md#8-resolved-questions-locked-on-sign-off-2026-04-28).
- **Schema validation** — dev-only check rejects category ids ending in `__mode` (or any reserved suffix) per [Q6 lock](filter-stack-procomp-description.md#8-resolved-questions-locked-on-sign-off-2026-04-28); plan-stage extensions also flag duplicate ids and `checkbox-list` with empty/missing options.
- **ARIA contract** — `<fieldset>` + `<legend>` per section; ToggleGroup carries proper radiogroup semantics; debounced inputs respect normal text-input ARIA.
- **Bundle ≤ 12KB** (per description success #9); zero heavy deps.

**Doesn't ship in v0.1** (per description §3): built-in `range` / `date-range`, section collapsibles, horizontal layout, persistent state, presets/saved sets, search-override semantics (host concern), async predicates, drag-to-reorder. All v0.2+ are designed as additive — none change the v0.1 API.

**Implementation budget:** ~1.5 weeks focused (per system §10.2 and HANDOFF.md §5).

---

## 3. Final v0.1 API (locked)

Builds out [description §5](filter-stack-procomp-description.md#5-rough-api-sketch) into final shapes.

### 3.1 Filter category schema (discriminated)

```ts
// FilterValue is `unknown` per Q-P4 lock — no compile-time type help on values[id];
// per-built-in-type conventional shapes are documented inline in the discriminated subtypes below.
type FilterValue = unknown;
type FilterMode = "union" | "intersection";

interface BaseFilterCategory<T> {
  id: string;                                                       // forbidden suffixes per §6
  label: string;
  description?: string;                                              // helper text under label
  predicate: (item: T, value: FilterValue) => boolean;
  // isEmpty is required or optional per the discriminated subtypes below (Q-P2 lock)
}

interface CheckboxListFilter<T> extends BaseFilterCategory<T> {
  type: "checkbox-list";
  options: ReadonlyArray<{ value: string; label: string }>;
  modeToggle?: boolean;                                              // default false (union only)
  defaultMode?: FilterMode;                                          // when modeToggle true; default "union"
  showSoloButtons?: boolean;                                         // default false
  isEmpty?: (value: FilterValue) => boolean;                         // optional; default checks for empty array
  // value shape: string[] (selected option values)
  // mode shape: separate flat key — values["${id}__mode"] is FilterMode (only when modeToggle true)
}

interface ToggleFilter<T> extends BaseFilterCategory<T> {
  type: "toggle";
  isEmpty: (value: FilterValue) => boolean;                          // REQUIRED — host intent governs
  // value shape: boolean
}

interface TextFilter<T> extends BaseFilterCategory<T> {
  type: "text";
  placeholder?: string;
  debounceMs?: number;                                               // default 250 per Q8
  isEmpty?: (value: FilterValue) => boolean;                         // optional; default checks for empty string
  // value shape: string
}

interface CustomFilter<T> extends BaseFilterCategory<T> {
  type: "custom";
  render: (props: {
    value: unknown;
    onChange: (value: unknown) => void;
    items: ReadonlyArray<T>;
    fieldId: string;                                                  // for label-association (parallel to properties-form's FieldRendererProps)
  }) => ReactNode;
  isEmpty: (value: FilterValue) => boolean;                          // REQUIRED — only host knows value shape
}

type FilterCategory<T> =
  | CheckboxListFilter<T>
  | ToggleFilter<T>
  | TextFilter<T>
  | CustomFilter<T>;
```

The discriminated `isEmpty` signature locks Q-P2 at the type level: TS rejects schemas that omit `isEmpty` on `toggle` / `custom`.

### 3.2 Component props

```ts
interface FilterStackProps<T = unknown> {
  // Items + schema
  items: ReadonlyArray<T>;
  categories: ReadonlyArray<FilterCategory<T>>;

  // Controlled state (mandatory; no defaultValues)
  values: Record<string, FilterValue>;
  onChange: (values: Record<string, FilterValue>) => void;

  // Convenience: filtered output
  onFilteredChange?: (filtered: ReadonlyArray<T>) => void;

  // Footer
  showClearAll?: boolean;                                            // default true
  clearAllLabel?: string;                                            // default "Clear all"

  // ARIA / styling
  ariaLabel?: string;
  className?: string;
}
```

### 3.3 Imperative ref handle

```ts
interface FilterStackHandle {
  clearAll(): void;                                                  // dispatches per-category clears via onChange + cancels all pending text debounces
  clear(categoryId: string): void;                                   // single-category clear via onChange + cancels that text debounce if applicable
  isEmpty(): boolean;                                                // true iff every category is empty
}
```

Per Q-P10: minimal scope. `getActiveCategories()` / `setValue(id, v)` are redundant with `values` / `onChange`.

### 3.4 What's NOT on the API

- No `defaultValues` (controlled-only; uncontrolled is v0.2+ if needed).
- No `direction` prop (vertical only; v0.2 per description Q10).
- No `collapsible` per category (v0.2 per description Q3).
- No async predicate support (sync-only v0.1).
- No internal search-override prop (host concern per system #12 + description §3).

---

## 4. State model

The component is **stateless for filter values** — `values` is read from props on every render. Internal state is limited to two concerns:

### 4.1 Internal state shape

```ts
interface FilterStackInternalState {
  // Debounce buffer: per-text-category staged value awaiting commit.
  // Keyed by category.id. Removed when the input is unfocused or debounce flushes.
  textBuffer: Record<string, string>;
}
```

Implementation per Q-P8: a stateful `useTextBuffer()` hook owns the buffer plus per-id debounced commits (see §4.2 ownership lock). No reducer is needed — the action surface is small enough that a 5-method hook surface is clearer than a reducer.

### 4.2 The flow per type

| Type | Edit event | Buffer? | Commit timing |
|---|---|---|---|
| `checkbox-list` (option toggle) | `onCheckedChange(value, checked)` | no | immediate `onChange` |
| `checkbox-list` (mode toggle) | `ToggleGroup onValueChange` | no | immediate `onChange` (writes `${id}__mode` key) |
| `checkbox-list` (solo) | solo button click | no | immediate `onChange` (sets `[optionValue]`; mode key conditional per Q-P3) |
| `toggle` | `onCheckedChange(checked)` | no | immediate `onChange` |
| `text` | `onChange(string)` keystroke | yes (textBuffer) | debounced `onChange` after `debounceMs` (default 250) |
| `custom` | host's render's `onChange(unknown)` | no | immediate `onChange` (host owns debounce inside render) |

Text is the only buffered case. The buffer + commit pattern is the standard "debounce-controlled-input" idiom: input element is bound to `textBuffer[id] ?? values[id]`; keystrokes update buffer immediately; commit fires `onChange` with the buffered value `debounceMs` after the last keystroke. On unmount or category-clear, pending commits are flushed/cancelled.

**Ownership (Q-P8 lock):** the textBuffer state and per-id debounced commits live inside a stateful `useTextBuffer()` hook (file `hooks/use-text-buffer.ts`), called once from `filter-stack.tsx`. The hook returns `{ buffer, setBuffer(id, value), flush(id), cancel(id), flushAll(), cancelAll() }`. Internally uses `useState<Record<string, string>>` for the buffer plus `useDebouncedCallback` (Q-P9) per-id. `clear(id)` ref method invokes `cancel(id)` then dispatches `onChange` with the cleared key; `clearAll()` invokes `cancelAll()` then dispatches the cleared values object. Each `<filter-text>` consumes a slice via prop drilling: its `value` is `buffer[id] ?? values[id]`; its `onChange` calls `setBuffer(id, v)` which internally schedules a debounced commit via the parent-supplied `commitText(id, value)` callback.

### 4.3 Composition pipeline (`apply-filters.ts`)

`useFilteredItems(items, categories, values)` returns `ReadonlyArray<T>` derived in three steps:

```
1. For each category:
     - if isEmpty(values[id]) → skip (pass-through)
     - else: build (item) => predicate(item, values[id])
   → activePredicates: Array<(item: T) => boolean>
2. filtered = items.filter(item => activePredicates.every(p => p(item)))
3. memoize on (items, categories, values) — referential equality on items + categories;
   shallow equality on values keyed by category.id (per Q-P5)
```

Early-bail: when `activePredicates` is empty (all categories pass-through), return `items` unchanged (referential identity); skips the `.filter()` allocation. Common case for first-mount.

This is wrapped in a custom hook so consumers can tap it for testability when Vitest lands.

### 4.4 `onFilteredChange` change-detection (Q-P5)

The convenience callback fires only when the filtered set's **identity** changes. Mechanism: a `useEffect` keyed on the memoized `filtered` reference; if reference changes, fire `onFilteredChange(filtered)`. Memoization in §4.3 ensures the reference is stable when inputs are stable, so:

- Same items + same values + same categories → same reference → no fire.
- Any input change that produces a different filtered set → new reference → fire.
- Input change that produces an equivalent set (e.g., filter excludes nothing it didn't exclude before) → still a new reference (we don't deep-compare to the previous filtered for cost reasons).

Trade-off: hosts should treat `onFilteredChange` as a "filtered set may have changed" signal, not a "filtered set definitely differs" guarantee. Documented in usage. Cost-conscious hosts can dedupe via shallow-equal of ids on their side; a deep-equal guarantee inside filter-stack would walk the filtered array on every input change, defeating the cost benefit of the convenience callback.

---

## 5. Filter type rendering

Each built-in renders via a small `parts/filter-<type>.tsx` component. Solo buttons + clear buttons + mode toggles are sub-parts shared across types as relevant.

### 5.1 Per-type rendering

| Type | Primitive (existing → new install) | Layout |
|---|---|---|
| `checkbox-list` | shadcn `Checkbox` (NEW install) | `<ul>` of options; each row = `<Checkbox>` + label + optional solo button (right-aligned) |
| `toggle` | shadcn `Switch` (NEW install — also queued by properties-form Phase A) | section-label-row aligned; switch right-aligned next to label |
| `text` | shadcn `Input` (NEW install — also queued by properties-form Phase A) | full-width input below label; debounced via `useTextBuffer` |
| `custom` | host's `render(props)` | full-width container; host owns layout |

Common chrome rendered by `parts/filter-section.tsx`:
- Section label + description (if supplied)
- Per-category clear button (small `X` icon button) — visible when `!isEmpty(values[id])` per [Q-P3](#q-p3-from-description-855-3-refined-on-validate-pass--solo-button-placement-and-aria) below
- Mode toggle for `checkbox-list` with `modeToggle: true` — see Q-P6 / Q-P7 below for placement + implementation
- The body — the type-specific renderer

### 5.2 Solo button (Q-P3, per description §8.5 #3)

Solo button placement: **right-aligned within each option row**, next to the label, when `showSoloButtons: true`. Visual: small ghost button with a "target" lucide icon (`Target` or `Crosshair`); roughly 24×24px.

ARIA: `aria-label="Show only {optionLabel}"`. **Click handler branches by `category.modeToggle`** (refined on validate pass; original sketch always wrote the `__mode` key, polluting categories that have no mode toggle):

- `modeToggle: false`: `onChange({ ...values, [id]: [optionValue] })` — no mode key written.
- `modeToggle: true`: `onChange({ ...values, [id]: [optionValue], [`${id}__mode`]: values[`${id}__mode`] ?? category.defaultMode ?? "union" })` — preserve existing mode, fall back to `defaultMode`, fall back to `"union"`.

Tooltip on hover/focus uses shadcn `Tooltip` (NEW install — also queued by properties-form Phase A). Without tooltip the bare icon button reads ambiguously.

### 5.3 Mode toggle (Q-P6 + Q-P7)

Renders only when `modeToggle: true` on a `checkbox-list` category. **Placement: inline next to the section label** (Q-P6 lock); **implementation: shadcn `ToggleGroup`** (Q-P7 lock — reversed from "roll our own" on validate pass; install via Phase A pre-flight).

```
By group [Union | Intersection]                              [×]
─────────────────────────────────────────────────────────────────
□ Project A
□ Project B
□ Project C
```

```tsx
<ToggleGroup
  type="single"
  value={(values[`${id}__mode`] as FilterMode | undefined) ?? category.defaultMode ?? "union"}
  onValueChange={(next) => {
    if (next) onChange({ ...values, [`${id}__mode`]: next });
  }}
  aria-label={`${category.label} mode`}
>
  <ToggleGroupItem value="union">Union</ToggleGroupItem>
  <ToggleGroupItem value="intersection">Intersection</ToggleGroupItem>
</ToggleGroup>
```

The `if (next) onChange(...)` guard — `ToggleGroup type="single"` allows full deselection (returning empty string); suppress that to keep mode always defined. Active-state styling, roving tabindex, arrow-key focus+select, Home/End, Space/Enter activation are all provided correctly by Radix `react-toggle-group`.

### 5.4 Per-category clear button

Shared part `parts/clear-button.tsx`. Same component used for the per-section clear (small icon button next to the label) and the global clear-all (full-button in the footer). Variants supplied via prop. Visible when `!isEmpty(...)` for the relevant scope. ARIA `aria-label="Clear {categoryLabel}"` (per-category) or `aria-label="Clear all filters"` (global).

### 5.5 Custom renderer slot

Hosts opt out of built-in rendering by setting `field.render`. The slot receives `{ value, onChange, items, fieldId }`. Examples in `usage.tsx`:

- **Date-range picker** (description §6.2): host wraps a `DateRangePicker` (host-supplied or third-party); `onChange` receives `[Date, Date] | null`; predicate destructures.
- **Numeric range slider:** host wraps a slider component; `onChange` receives `[number, number]`.
- **Solo + multi-select with chips:** host wraps a chips-input component.

Custom renderers are responsible for their own debouncing, focus management, and ARIA. filter-stack supplies `fieldId` so labels can associate cleanly.

---

## 6. Schema validation (dev-only)

Per [Q6 lock](filter-stack-procomp-description.md#8-resolved-questions-locked-on-sign-off-2026-04-28) + §8.5 #1: the `__mode` suffix is reserved for internal use. Plan ships a dev-only validation pass at `lib/validate-schema.ts`:

```ts
const RESERVED_SUFFIXES = ["__mode"] as const;

function validateCategorySchema(categories: ReadonlyArray<FilterCategory<unknown>>): void {
  if (process.env.NODE_ENV === "production") return;

  const seen = new Set<string>();
  for (const cat of categories) {
    // 1. Reserved suffix (Q6-mandated)
    for (const suffix of RESERVED_SUFFIXES) {
      if (cat.id.endsWith(suffix)) {
        console.error(
          `[filter-stack] category id "${cat.id}" ends in reserved suffix "${suffix}". ` +
          `Pick a different id; "${suffix}" is used internally for mode storage.`
        );
      }
    }
    // 2. Duplicate id (plan-stage extension)
    if (seen.has(cat.id)) {
      console.error(`[filter-stack] duplicate category id "${cat.id}".`);
    }
    seen.add(cat.id);
    // 3. Type-shape sanity (plan-stage extension)
    if (cat.type === "checkbox-list" && (!cat.options || cat.options.length === 0)) {
      console.warn(`[filter-stack] checkbox-list category "${cat.id}" has no options.`);
    }
  }
}
```

**Wiring (validate-pass lock):** called from `filter-stack.tsx` directly via a `useEffect` keyed on `[categories]` — runs once per `categories` reference change, NOT on every render. No dedicated hook; the `validate-schema.ts` module exports the function and is imported into `filter-stack.tsx`. Production builds strip the function body via `process.env.NODE_ENV` guard + tree-shaking.

Reserved suffix list (`RESERVED_SUFFIXES`) is exported so future internal suffixes (e.g., a hypothetical `__solo`) extend cleanly.

**Plan-stage extensions** (NOT inherited from description Q6): the validation pass also flags duplicate category ids and `checkbox-list` categories with empty/missing `options`. Description Q6 only mandates the reserved-suffix check; these extensions are reasonable host-bug catchers but are scope-tagged here in case a future bundle cut needs them gone — the Q6-mandated suffix check stays unconditionally.

---

## 7. Files and parts

### 7.1 File-by-file plan

```
src/registry/components/forms/filter-stack/
├── filter-stack.tsx                  # main component (controlled wrapper; ref handle; section iterator;
│                                      #   schema-validation useEffect; useTextBuffer hook call)
├── types.ts                          # FilterValue, FilterMode, FilterCategory union, props, handle
├── parts/
│   ├── filter-section.tsx            # per-category container — label, description, clear button,
│   │                                  #   mode toggle, body slot
│   ├── filter-checkbox-list.tsx      # checkbox list body + solo buttons
│   ├── filter-toggle.tsx             # switch row body
│   ├── filter-text.tsx               # debounced input body (consumes useTextBuffer slice)
│   ├── filter-custom.tsx             # thin wrapper that calls host's render(props); error boundary
│   ├── mode-toggle.tsx               # ToggleGroup union/intersection (Q-P7 lock)
│   ├── solo-button.tsx               # per-option solo affordance with Tooltip
│   ├── clear-button.tsx              # shared per-category + global clear
│   └── filter-stack-footer.tsx       # global clear-all button (uses clear-button.tsx)
├── hooks/
│   ├── use-debounced-callback.ts     # debounce primitive (returned fn has flush + cancel methods)
│   ├── use-filtered-items.ts         # memoized filter pipeline + onFilteredChange wiring
│   └── use-text-buffer.ts            # stateful: owns textBuffer state + per-id debounced commits;
│                                      #   exposes { buffer, setBuffer, flush(id), cancel(id),
│                                      #   flushAll, cancelAll } — Q-P8 lock
├── lib/
│   ├── default-is-empty.ts           # per-type defaults for checkbox-list + text
│   ├── validate-schema.ts            # dev-only schema validation (§6)
│   └── apply-filters.ts              # AND-across composition (called inside use-filtered-items)
├── dummy-data.ts                     # fixtures for the demos (graph, orders, faceted search)
├── demo.tsx                          # 5 demos per description success #11 (single page, internal switch)
├── usage.tsx                         # consumer-facing patterns + custom-slot recipes
├── meta.ts                           # registry meta
└── index.ts                          # FilterStack + types + (optional) defaultIsEmpty re-export
```

**File count: 17.** Same as detail-panel; smaller than properties-form (22). Reflects filter-stack's intermediate complexity — more parts than detail-panel (4 type renderers + mode toggle + solo button), but simpler than properties-form (no validation pipeline, no permission resolver, no edit/read mode flip).

### 7.2 Build order within v0.1

Three internal phases, each ~2-3 days:

**Phase A — types + state + lib (foundational; ~2 days):**
- **Pre-flight (must precede everything else):** install missing shadcn primitives — `pnpm dlx shadcn@latest add checkbox input switch tooltip toggle-group` (5 primitives; `Button` already in repo). **State of `src/components/ui/` verified at plan-write time (2026-04-29):** contains `badge`, `button`, `card`, `dropdown-menu`, `popover`, `scroll-area`, `separator`, `table`, `tabs`. None of `Checkbox` / `Input` / `Switch` / `Tooltip` / `ToggleGroup` are present. Note: `Input` / `Switch` / `Tooltip` are also queued by [`properties-form` plan §8.2 Phase A](../properties-form-procomp/properties-form-procomp-plan.md#82-build-order-within-v01); `Checkbox` and `ToggleGroup` are filter-stack-specific. Plan locks the pre-flight as part of filter-stack's gate so a parallel-implementing developer doesn't trip over the missing primitives. Commit separately so the install diff stays distinct.
- `types.ts` — full type surface (discriminated `FilterCategory` with isEmpty per §3.1)
- `lib/default-is-empty.ts` — per-type defaults
- `lib/validate-schema.ts` — dev-only validation
- `lib/apply-filters.ts` — composition pipeline
- `hooks/use-debounced-callback.ts`, `hooks/use-text-buffer.ts`, `hooks/use-filtered-items.ts`
- Unit-testable in isolation when Vitest lands; v0.1 verification is demo-driven.

**Phase B — rendering (~3 days):**
- `parts/filter-section.tsx` — the per-category container
- 4 body parts: `filter-checkbox-list.tsx`, `filter-toggle.tsx`, `filter-text.tsx`, `filter-custom.tsx`
- Shared parts: `mode-toggle.tsx`, `solo-button.tsx`, `clear-button.tsx`, `filter-stack-footer.tsx`
- `filter-stack.tsx` — main component wiring everything
- Phase B end: `axe-core` smoke run for ToggleGroup keyboard-navigation a11y (expected pass — Radix handles it).

**Phase C — demos + integration (~2 days):**
- `demo.tsx` (5 sub-demos covering success #11), `dummy-data.ts`, `usage.tsx`, `meta.ts`, `index.ts`
- Verify `tsc + lint + build` clean
- Verify all 11 success-criteria items

---

## 8. ARIA contract

Per description success #8.

| Element | ARIA |
|---|---|
| Filter stack root | `role="region"` (implicit via `<form>` is acceptable; `<form noValidate>` recommended), `aria-label={ariaLabel}` |
| Each section | `<fieldset>` + `<legend>` (legend contains category label) |
| Section description | `<p>` after legend with `id={descriptionId}`; section's body inputs reference via `aria-describedby` |
| Checkbox option | shadcn `Checkbox` provides correct `role="checkbox"` + `aria-checked`; label association via wrapping `<label>` |
| Mode toggle | shadcn `ToggleGroup type="single"` provides `role="radiogroup"` + `role="radio" aria-checked` per item + roving tabindex + arrow-key navigation + Home/End + Space/Enter; container `aria-label={`${category.label} mode`}` |
| Solo button | `<Button>` with `aria-label="Show only {optionLabel}"`; tooltip via shadcn `Tooltip` |
| Per-category clear button | `<Button>` with `aria-label="Clear {categoryLabel}"`; visible only when `!isEmpty(value)` |
| Toggle filter | shadcn `Switch` provides `role="switch"` + `aria-checked`; label via wrapping `<label>` |
| Text filter | native `<input type="text">` via shadcn `Input`; `aria-describedby` to description if supplied |
| Custom slot | host-owned ARIA — `fieldId` passed to render-fn for label association; documented in usage |
| Footer | `<div role="toolbar">` + the global clear button |
| Global clear-all | `<Button>` with `aria-label="Clear all filters"`; `aria-disabled="true"` when all categories are empty |

ESC behavior: pressing ESC inside a focused text filter clears that field (per description success #8) — implemented via `onKeyDown` on the input; calls `onChange({ ...values, [id]: "" })` and stops propagation. Other filter types do not implement ESC — clearing is via the per-category clear button.

---

## 9. Edge cases (locked)

| Case | Handling |
|---|---|
| `categories` is empty | Renders an empty `<form>` with the footer; clear-all is disabled. No console warning (legitimate state). |
| Duplicate category ids | Dev-only `console.error` from schema validation (§6); component renders all sections, but `values` lookup hits the first one. Behavior is undefined-but-non-crashing in production. |
| Category id ends in `__mode` | Dev-only `console.error` from schema validation (§6); rendered normally but `values["${id}__mode"]` collides with mode storage of any sibling checkbox-list. Documented as host bug. |
| `checkbox-list` with empty `options` | Dev-only `console.warn`; renders the empty fieldset + clear button; no rows. |
| `checkbox-list` with `modeToggle: false` AND `defaultMode` set | `defaultMode` is ignored (mode toggle isn't shown). Dev-only `console.warn`. Mode value never enters `values`. |
| `text` debounce in flight when component unmounts | Pending commit is cancelled in `useEffect` cleanup. No `onChange` fires after unmount. |
| `text` debounce in flight when category is cleared programmatically | `clear(id)` cancels the pending commit and dispatches `onChange({ ...values, [id]: "" })` immediately. Buffer is reset to empty. |
| `text` debounce in flight when input is blurred | Pending commit fires immediately on blur (flushes buffer); `onChange` dispatches with the current buffer value. |
| `clearAll()` called via ref | `cancelAll()` runs first, then a single `onChange` dispatch with all categories cleared (per `default-is-empty.ts` rules + `__mode` keys preserved). One render cycle. |
| `clear(id)` called via ref for unknown id | Dev-only `console.warn`; no-op. |
| `isEmpty(value)` throws | Caught at the call site (`filter-section.tsx`); treated as "not empty" (clear button shows); dev-only `console.error` with category id. Mirrors properties-form's `safeCall` pattern. |
| `predicate(item, value)` throws | Caught at the call site (`apply-filters.ts`); treated as `false` for that item (filtered out); dev-only `console.error` with category id and item. |
| Custom render throws | React error boundary at `filter-custom.tsx` catches; renders `<FilterError>` placeholder ("Custom filter crashed — see console"); filter-stack remains interactive. |
| `onFilteredChange` not supplied but filtered changes | No-op (no callback to invoke). The hook still computes `filtered` because `filter-stack` itself doesn't render filtered items — it's pure convenience. |
| `onFilteredChange` callback throws | Caught at the dispatch site; converted to dev-only `console.error("[filter-stack] onFilteredChange threw:", err)`. Downstream filtering is unaffected. Production builds let it propagate per standard React error-boundary expectations. |
| Inline-array `items` prop with massive size (10k+) | `useFilteredItems` memoizes on `items` reference; if host passes inline `items={[...]}` without memoizing, every render re-computes. Documented in usage; React Compiler covers most in-repo cases. |
| Inline-arrow `predicate` per category (host passes new function each render) | Same footgun as inline `categories` literal (§10.1.1). Each render produces new category objects via inline construction; `useFilteredItems` re-computes. Mitigated by React Compiler in-repo; documented as host responsibility for NPM consumers; same dev-warn machinery surfaces it via the `categories` reference instability counter. |
| `values` references that are stable but `categories` changes mid-life (e.g., category removed) | Stale `values["removedId"]` keys are silently ignored — no category renders for them; pipeline skips them. Host can prune via `onChange`. |
| `defaultMode` change mid-life | Honored only when the category's mode key is absent from `values`. Once `values["${id}__mode"]` is set, `defaultMode` is ignored (host owns persistent value). |
| `showSoloButtons: true` but `options` is empty | No solo buttons render (no rows). |

---

## 10. Performance + bundle

### 10.1 Performance

The component is layout + state-thin by design. Optimizations:

- **`useFilteredItems` memoization** keyed on `(items, categories, values)` references — referential equality on the array refs; categories in particular are usually stable across renders (host rarely rebuilds the schema). Hosts that pass inline categories every render get re-computation; documented in §10.1.1 below as the same footgun properties-form has.
- **Filter sections do NOT need `React.memo`** — typical filter panels have 3-6 sections; per-keystroke re-render of all sections is cheap. (Not the field-row-density problem properties-form has.)
- **Text-input buffer is local state** — keystrokes don't trigger filtered-pipeline computation until the debounce flushes.
- **`onFilteredChange` change-detection** is purely referential per §4.4 — no array-walking diff.
- **Early-bail on empty active-predicate set** in `apply-filters.ts` — when all categories are empty, returns `items` unchanged (referential identity); skips the `.filter()` allocation.

No virtualization; not needed at filter-section count (3-6 typical, 10-15 extreme).

#### 10.1.1 `categories` reference stability (host responsibility)

Same footgun as [properties-form's `schema`](../properties-form-procomp/properties-form-procomp-plan.md#1111-schema-reference-stability-host-responsibility). Hosts that pass an inline `categories={[...]}` literal create new category objects on every parent render. Without reference stability, `useFilteredItems` re-computes unnecessarily.

**In-repo mitigation:** React Compiler ([CLAUDE.md tech stack](../../../CLAUDE.md)) auto-memoizes JSX-literal arrays at the call site. Inline `categories={[...]}` is fine for in-repo consumers.

**NPM-extraction concern:** consumers without React Compiler must memoize manually. Two patterns documented in `usage.tsx`:

1. **Module-scope categories** (preferred for static schemas):
   ```tsx
   const CATEGORIES = [/* ... */] satisfies FilterCategory<MyItem>[];
   <FilterStack categories={CATEGORIES} ... />
   ```
2. **`useMemo` categories** (for schemas derived from props/state):
   ```tsx
   const categories = useMemo(() => buildCategories(options), [options]);
   <FilterStack categories={categories} ... />
   ```

Same dev-only runtime warning posture as properties-form: fires when `categories` reference changes more than 5 times in succession (avoiding false positives on first-mount churn). The same warning surfaces unstable inline-arrow `predicate` references (each new category-object literal carries new function references).

### 10.2 Bundle audit

Budget: **≤ 12KB minified + gzipped** per description success #9.

**State of `src/components/ui/` at plan-write time** (verified 2026-04-29): `badge`, `button`, `card`, `dropdown-menu`, `popover`, `scroll-area`, `separator`, `table`, `tabs`. **Of the 6 shadcn primitives filter-stack uses (`Checkbox`, `Input`, `Switch`, `Tooltip`, `ToggleGroup`, `Button`), only `Button` exists.** Five must be installed via `pnpm dlx shadcn@latest add` before implementation begins (see [§7.2 Phase A pre-flight](#72-build-order-within-v01)). `Input` / `Switch` / `Tooltip` are already queued by [properties-form plan §8.2](../properties-form-procomp/properties-form-procomp-plan.md#82-build-order-within-v01); `Checkbox` and `ToggleGroup` are filter-stack-specific.

Realistic breakdown — filter-stack's *own* code:
- Component code: ~6-9KB (17 files; mostly thin parts; no heavy logic outside `apply-filters.ts` + 3 hooks)
- `lucide-react` icons: tree-shaken; ~1KB for `X` (clear) + `Target` (solo) + maybe one more.
- **Filter-stack-attributable total: ~7-10KB**, ceiling 12KB with ~2-5KB headroom.

Newly-installed shadcn primitives (`Checkbox`, `Input`, `Switch`, `Tooltip`, `ToggleGroup`) add to the registry's overall bundle but are **shared infrastructure**, amortized across all current and future consumers — they are NOT filter-stack-attributable cost. Per-primitive minified+gzipped: ~1-3KB each plus shared `@radix-ui` deps. The Radix peer dep is amortized across all 5 newly-installed primitives.

Wired via `size-limit` (or equivalent) at v0.1 implementation start — same posture as properties-form §11.2 + detail-panel §10.2 + force-graph v0.1 plan §17.5 #3.

---

## 11. Risks & alternatives

### 11.1 Risks

| Risk | Mitigation |
|---|---|
| Inline `categories` literal causes per-render re-compute | React Compiler covers in-repo; usage docs flag for NPM consumers; dev-warn after 5+ unstable renders. |
| Debounce timer interactions with React Compiler / strict mode | `useDebouncedCallback` uses a ref-stored timeout id; safe under strict-mode double-invocation. Smoke test in Phase B. |
| Custom render's `onChange` fires synchronously inside its own commit (loops) | filter-stack treats every `onChange` symmetrically — host's render must not fire `onChange` from its own value commit. Documented; same posture as React's controlled-input contract. |
| `__mode` key collisions if a host genuinely needs `someId__mode` as a category id | Schema validation rejects it; host renames. If a real consumer needs the suffix as data, plan-stage adds an `escapeReservedSuffixes?: boolean` opt-out — but defaulting to safe rejection is the right v0.1 posture. |
| Bundle exceeds 12KB | Audit at end of Phase B. Specific cut candidates in priority order: (1) drop the duplicate-id and missing-options checks from `validate-schema.ts` (~0.3KB; plan-stage extensions per §6, NOT Q6-mandated); (2) drop the `defaultIsEmpty` re-export (~0.1KB; private-use only); (3) collapse `solo-button.tsx` into `filter-checkbox-list.tsx` (~0.3KB structural cost). Don't cut a11y machinery (ESC handler, ARIA wiring, ToggleGroup, Tooltip). |
| `onFilteredChange` reference-only equality misleads consumers | Documented in usage as "may have changed" semantics; consumers needing strict change-detection dedupe on their side. |

### 11.2 Alternatives considered, rejected

- **Reducer-based internal state.** Rejected per Q-P8 — the action surface (text buffer commits + cancellation) is small; a 5-method hook surface is clearer than a reducer for this scale.
- **Tabs primitive for mode toggle.** Rejected per Q-P7 — Tabs is heavier (designed for content panels), introduces unnecessary container chrome. ToggleGroup is purpose-fit.
- **Roll-our-own 2-button radiogroup using existing `Button`** — initially recommended; **rejected on validate pass** in favor of installing shadcn `ToggleGroup`. The WAI-ARIA radiogroup-pattern implementation cost (~150 LOC + Phase B audit risk) outweighs the ~2KB shared bundle of installing ToggleGroup, especially since the Radix peer dep is already shared via the queued `Tooltip` / `Switch` / `Checkbox` installs. Q-P7 lock.
- **Async predicate support.** Rejected per description §3 — explicit out of scope; v0.2+.
- **Built-in `range` / `date-range` types.** Rejected per description §3 + Q1 lock — `custom` slot covers them in v0.1.
- **Internal search-override (system #12).** Rejected per description §3 — host concern; filter-stack returns who passes filters and the host unions with search-matched items independently.
- **Strict per-category-type discriminated `FilterValue`.** Considered (per description §8.5 #4); rejected per Q-P4 — verbose with little ergonomic gain at the predicate boundary, where casts are unavoidable anyway.

---

## 12. Resolved plan-stage questions (locked on sign-off 2026-04-29)

All 10 questions resolved at sign-off. **Q-P3 + Q-P4 + Q-P7 + Q-P8 refined on validate pass** (Q-P3: solo-click branching by `modeToggle`; Q-P4: union ceremony dropped, type collapses to `unknown` directly; Q-P7: roll-our-own reversed → install ToggleGroup; Q-P8: textBuffer ownership lock — stateful `useTextBuffer` hook). **High-impact:** Q-P2 (isEmpty discriminated typing), Q-P5 (onFilteredChange semantics), Q-P7 (mode-toggle implementation). **Medium:** Q-P1 (reserved-suffix validation), Q-P3 (solo button placement), Q-P4 (FilterValue typing — promoted from low on validate pass), Q-P8 (state architecture), Q-P9 (debounce impl). **Low:** Q-P6 (mode-toggle placement), Q-P10 (handle scope).

### Q-P1 (from description §8.5 #1) — Reserved-suffix schema validation

**Locked: dev-only validation pass per §6.** `RESERVED_SUFFIXES = ["__mode"]` exported as an extensible constant. Validation runs once per `categories` reference change (`useEffect` in `filter-stack.tsx`; not memoized — wired via effect dependency, not `useMemo`). Production builds strip via `process.env.NODE_ENV` guard.
**Impact:** medium. **Trade-off:** none — dev-only safety net with zero production cost.

### Q-P2 (from description §8.5 #2) — `isEmpty` enforcement at the type level

**Locked: discriminated typing per §3.1.** `CheckboxListFilter` + `TextFilter` have `isEmpty?` (optional with default applied); `ToggleFilter` + `CustomFilter` have `isEmpty` (required). TS rejects schemas that omit `isEmpty` on the required cases at compile time — no runtime check needed for enforcement.
**Impact:** high — defines the schema contract.
**Trade-off:** loose-typed schemas (the `as any` escape hatch) bypass enforcement; the runtime fallback for missing `isEmpty` on `toggle` / `custom` is a "always not-empty" return (clear button always shows). Documented as host bug.

### Q-P3 (from description §8.5 #3; refined on validate pass) — Solo button placement and ARIA

**Locked: right-aligned inside each option row when `showSoloButtons: true`** per §5.2. Small ghost button, lucide `Target` icon, ~24×24px. ARIA `aria-label="Show only {optionLabel}"` + tooltip via shadcn `Tooltip`. **Click handler branches by `category.modeToggle`** (refined on validate pass — original sketch always wrote the `__mode` key, polluting categories that have no mode toggle):

- `modeToggle: false`: `onChange({ ...values, [id]: [optionValue] })` — no mode key written.
- `modeToggle: true`: `onChange({ ...values, [id]: [optionValue], [`${id}__mode`]: values[`${id}__mode`] ?? category.defaultMode ?? "union" })` — preserve existing mode, fall back to `defaultMode`, fall back to `"union"`.

**Impact:** medium — visible in the graph filter panel's primary use case.
**Trade-off:** placement-inside-row competes with long option labels for horizontal space; if labels are long the solo button can wrap. Acceptable; alternative (separate solo column right of all options) is more visually heavy. Documented in usage.

### Q-P4 (from description §8.5 #4; refined on validate pass) — `FilterValue` typing

**Locked: `type FilterValue = unknown`** per §3.1. **Refined on validate pass:** the description §5 sketch's `string[] | boolean | string | unknown` collapses to just `unknown` in TypeScript (the `unknown` arm absorbs the others — `unknown` is the top type), so the union ceremony adds zero type information while suggesting illusory safety. Locking as `unknown` directly makes the looseness explicit. Per-built-in-type conventional shapes are documented inline in the discriminated category subtypes (§3.1 comments). Predicate-side casts are unchanged.
**Impact:** medium — promoted from low on validate pass; the typing was actively misleading, not just verbose.
**Trade-off:** hosts get no compile-time type help on `values[id]` assignments — same as before, but now with no fake hint of safety. Strict per-category typing (`FilterCategory<T, V>` generic) was rejected: doubles the type parameter count for marginal gain since the predicate boundary always involves a cast either way; deferred to v0.2 if real bugs surface.

### Q-P5 (from description §8.5 #5) — `onFilteredChange` change-detection semantics

**Locked: referential-equality-on-memoized-output** per §4.4. The convenience callback fires when `useFilteredItems`'s memoized array reference changes. Inputs feed memoization by reference: items + categories + values. Same inputs → same reference → no fire. Different inputs → new reference → fire (even if the resulting set is element-wise identical, which is rare).
**Impact:** high — affects the hot path for consumers reading filtered output.
**Trade-off:** the callback is "may have changed," not "definitely differs." Consumers needing strict change detection dedupe via shallow-equal-by-id on their side; documented in usage. Alternative ("by-id-set comparison inside filter-stack") walks the array on every input change, defeating the point of the callback. Alternative ("shallow-equal item arrays") risks false negatives if items reorder. Reference-equality is the right v0.1 posture; stricter modes are an opt-in v0.2 prop if a real consumer needs them.

### Q-P6 (from description §8.5 #6) — Mode toggle UI placement

**Locked: inline next to the section label** per §5.3. Compact, visually binds the mode to its section, leaves vertical space for options. Visual: `[Section label] [Union | Intersection]   [×]`.
**Impact:** low — visual polish.
**Trade-off:** narrow panels (<280px) might wrap the toggle below the label. Acceptable; flex-wrap behaves correctly. Alternative (below options, above the first option) is more visually heavy and pushes options down. Plan locks inline placement; v0.2 may add a `modeTogglePosition: "inline" | "below"` if real consumers need.

### Q-P7 (NEW; reversed on validate pass) — Mode toggle implementation

**Locked: install shadcn `ToggleGroup` (Radix `react-toggle-group`) as Phase A pre-flight; consume in `parts/mode-toggle.tsx`** per §5.3. **Reversed on validate pass:** the original "roll our own 2-button radiogroup using existing Button" recommendation undersold the WAI-ARIA radiogroup-pattern implementation cost — roving tabindex, atomic arrow-key focus+select, Home/End, Space/Enter activation, disabled handling. ~80–150 LOC owned by us plus a Phase B audit risk. ToggleGroup ships all of this correct out of the box; the Radix peer dep is **already shared** via the other queued installs (`Tooltip`, `Switch`, `Checkbox`).

Trade-off math reversed on validate pass: ~2KB shared bundle vs ~150 LOC owned + audit risk + maintenance. ToggleGroup wins.

Implementation per §5.3:

```tsx
<ToggleGroup
  type="single"
  value={(values[`${id}__mode`] as FilterMode | undefined) ?? category.defaultMode ?? "union"}
  onValueChange={(next) => {
    if (next) onChange({ ...values, [`${id}__mode`]: next });
  }}
  aria-label={`${category.label} mode`}
>
  <ToggleGroupItem value="union">Union</ToggleGroupItem>
  <ToggleGroupItem value="intersection">Intersection</ToggleGroupItem>
</ToggleGroup>
```

The `if (next) onChange(...)` guard — `ToggleGroup type="single"` allows full deselection (returning empty string); suppress that to keep mode always defined.

Alternatives considered (rejected):
- **Roll-our-own 2-button radiogroup using existing `Button`** — rejected on validate pass per above. ~150 LOC + ongoing a11y maintenance for the registry's first consumer-site use; not worth it.
- **shadcn `Tabs`** (already in repo) — designed for content panels; introduces unnecessary container chrome. Wrong tool.
- **shadcn `Switch`** — binary on/off, wrong semantics (Union/Intersection are peer values, not on/off).

**Impact:** high — affects bundle, a11y, install set, and pattern for future similar toggles in entity-picker or other Tier 1 components.
**Trade-off:** one additional shadcn primitive in the registry's shared infrastructure (~2KB). Phase A pre-flight install list grows to 5: `checkbox input switch tooltip toggle-group`.

### Q-P8 (NEW; refined on validate pass) — Internal state architecture: useState vs useReducer; ownership

**Locked: stateful `useTextBuffer()` hook owning the textBuffer state + per-id debounced commits** per §4.1 + §4.2. The hook is called once from `filter-stack.tsx` and exposes `{ buffer, setBuffer(id, value), flush(id), cancel(id), flushAll(), cancelAll() }`. Internally uses `useState<Record<string, string>>` for the buffer plus `useDebouncedCallback` (Q-P9) for per-id timing. **Refined on validate pass:** the original sketch was ambiguous about whether textBuffer state lived in `filter-stack.tsx` directly or inside the `use-text-buffer.ts` hook; locked as the latter (cleaner encapsulation; exposes flush/cancel surface that `clear(id)` / `clearAll()` ref methods invoke directly).

The action surface remains small enough to skip a reducer: setBuffer, flush, cancel, flushAll, cancelAll are independent. A reducer would be clearer once cross-action invariants exist (rich-card's case); here, hook-encapsulated useState is simpler.

Alternatives considered:
- **`useReducer`** — overhead exceeds benefit at this action count. Mirrors detail-panel's choice (also `useState`-based; properties-form's reducer was justified by 9 actions with cross-coupled invariants).
- **No internal state at all** (push debounce buffer to host) — would require hosts to manage debounced input themselves; defeats the convenience callback's purpose.

**Impact:** medium — defines the implementation shape AND the textBuffer ownership boundary.
**Trade-off:** if v0.2 adds more buffered/transient state (animation flags, transient validation indicators), revisit and migrate to a reducer then.

### Q-P9 (NEW) — Debounce implementation

**Locked: custom `useDebouncedCallback(fn, ms)` hook** at `hooks/use-debounced-callback.ts`. Implementation pattern: ref-stored timeout id + ref-stored latest fn (so closures don't capture stale values); cleanup on unmount; flush + cancel methods exposed via `Object.assign` on the returned function. Used internally by `useTextBuffer` (Q-P8) per-id.

```ts
// signature sketch
function useDebouncedCallback<T extends (...args: any[]) => void>(
  fn: T,
  ms: number
): T & { flush: () => void; cancel: () => void };
```

Alternatives considered (rejected):
- **Inline `setTimeout` in the input's onChange** — works but verbose at every text-filter site; no flush/cancel surface for the clearAll / unmount cases.
- **Third-party (`use-debounce`, `lodash.debounce`)** — adds a dep for ~50 LOC of logic.

**Impact:** medium — defines text-filter behavior precisely.
**Trade-off:** owning the implementation means we own bug-fixes; the logic is small (~50 LOC) and well-tested when Vitest lands.

### Q-P10 (NEW) — Imperative ref handle scope

**Locked: minimal — `clearAll`, `clear(id)`, `isEmpty()`** per §3.3. Other candidates rejected:
- `getActiveCategories()` — redundant with `values` + `isEmpty` check; hosts compute from props.
- `setValue(id, v)` — redundant with `onChange` (host already controls values).
- `flushDebounce()` — internal concern; surfaces only if a real consumer needs it (probably not in v0.1; filters are eventual-consistency surfaces, not save-form surfaces).

**Impact:** low — primarily an API tightening.
**Trade-off:** none — small surface is easier to evolve. Additive in v0.2 if needed.

## 12.5 Plan-stage refinements (surfaced during draft + validate pass)

These bake into implementation but worth flagging:

1. **`default-is-empty.ts` is opt-in re-export.** `index.ts` re-exports `defaultIsEmpty` as a named utility for hosts that want to reuse the built-in checks (e.g., a custom filter that wraps a checkbox-list-shaped value). Importing is opt-in; tree-shaking prevents bloat for hosts that don't.
2. **Mode-toggle keyboard navigation handled by Radix.** Q-P7 lock → ToggleGroup install means roving tabindex, arrow-key focus+select, Home/End, Space/Enter activation are all provided correctly by Radix `react-toggle-group`. No custom keyboard handling needed in `mode-toggle.tsx`. Phase B smoke test verifies via `axe-core` — pass expected.
3. **`__mode` key cleanup on category removal.** When a host removes a `checkbox-list` category from `categories`, `values["${id}__mode"]` becomes orphaned — same as `values[id]`. Filter-stack does NOT prune; host owns shape. Documented in usage.
4. **`React 19 ref-as-prop` for `FilterStackHandle`.** Same pattern as [properties-form plan §13.5 #8](../properties-form-procomp/properties-form-procomp-plan.md#135-plan-stage-refinements-surfaced-during-draft). Filter-stack is generic (`<FilterStack<T>>`); `forwardRef` strips generics. React 19's first-class `ref` prop preserves them.
5. **Production-build warning suppression.** Dev-only `console.warn` / `console.error` calls (schema validation, predicate throws, isEmpty throws, `onFilteredChange` throws, custom-render error boundary fallback) are gated by `process.env.NODE_ENV !== "production"`. Bundlers strip the dead code in production.
6. **Custom-renderer error boundary scope.** `<filter-custom>` wraps the host's `render(props)` in a small React error boundary (`<FilterErrorBoundary>` part). Catches throws from the render pass; renders a fallback message. Other filter types don't need a boundary — built-ins don't throw under normal conditions.
7. **Solo button + Tooltip mounting cost.** Each option row instantiates a Tooltip when `showSoloButtons: true`. For checkbox-lists with 100+ options this is real cost. Plan-stage refinement: if a real consumer hits N>50 options with solo enabled, consider lazy-mounting tooltips on hover (additive, non-breaking). v0.1 ships eager tooltips; defer optimization.
8. **`apply-filters.ts` early-bail on empty active-predicate set.** When all categories are empty, return `items` unchanged (referential identity); skips the `.filter()` allocation. Common case for first-mount; cheap optimization. Locked in §4.3 + §10.1.
9. **`onFilteredChange` first-fire on mount.** Yes — fires on mount with the initial filtered set. Hosts wanting to skip the first fire can guard via a ref. Mirrors properties-form's `onChange` posture.
10. **ESC-clears-text behavior boundary.** ESC in a text input clears that field only and stops propagation. Outer ESC handlers (e.g., closing a sidebar panel that contains the filter-stack) won't fire. Documented; if a real consumer wants outer-ESC priority, they can bind `keyDown` higher in the tree with capture.

---

## 13. Definition of "done" for THIS document (stage gate)

- [x] User reviewed §1–§11 (the locked plan body) and §12 (resolved Q-Ps + §12.5 refinements).
- [x] All 10 plan-stage questions resolved (Q-P1 to Q-P10); Q-P3 + Q-P4 + Q-P7 + Q-P8 refined on validate pass.
- [x] User said **"go ahead"** — sign-off applied. Stage 3 (implementation) unlocks: run §7.2 Phase A pre-flight (`pnpm dlx shadcn@latest add checkbox input switch tooltip toggle-group`) FIRST, then `pnpm new:component forms/filter-stack`.
- [x] `Recommendation:` form converted to `**Locked: X.**`; status header flipped; [system §9 sub-doc map](../../systems/graph-system/graph-system-description.md#9-sub-document-map) updated to mark `filter-stack` plan ✓ signed off.

The plan is signed off when both (a) v0.1 implementation can begin AND (b) the `force-graph` v0.4 plan-lock cascade unlocks.

---

*End of v0.1 plan. Stage 3 (implementation) is unlocked subject to Phase A pre-flight.*
