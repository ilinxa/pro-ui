# `entity-picker` — v0.1 Plan (Stage 2)

> **Status:** **DRAFT 2026-04-29.** Pending user validate pass per project cadence (draft → validate → re-validate → sign off → commit). Recommendations below convert to `**Locked: X.**` form on sign-off.
> **Slug:** `entity-picker` · **Category:** `forms` · **Tier:** 1 (generic; no graph dependency)
> **Parent description:** [entity-picker-procomp-description.md](entity-picker-procomp-description.md) (signed off 2026-04-28)
> **Parent system:** [graph-system](../../systems/graph-system/graph-system-description.md) — Tier 1 (independent at the registry level per [decision #35](../../systems/graph-system/graph-system-description.md))
> **Sibling completion:** doesn't gate any specific `force-graph` phase plan-lock, but is composed inside Tier 3 from `force-graph` v0.3 onward (linking-mode UI) + v0.4 (group-membership editor). Tier 1 plan-lock cascade after this: 4 of 5 done (with [`properties-form`](../properties-form-procomp/properties-form-procomp-plan.md), [`detail-panel`](../detail-panel-procomp/detail-panel-procomp-plan.md), [`filter-stack`](../filter-stack-procomp/filter-stack-procomp-plan.md) signed off 2026-04-29).

---

## 1. Inherited inputs (one paragraph)

Builds against [entity-picker description §8 locked decisions](entity-picker-procomp-description.md#8-resolved-questions-locked-on-sign-off-2026-04-28) (10 questions; no refinements on re-validation) and [§8.5 plan-stage tightenings](entity-picker-procomp-description.md#85-plan-stage-tightenings-surfaced-during-description-review--re-validation) (6 surfaced). Inherits system constraints: [decision #25](../../systems/graph-system/graph-system-description.md) (per-component permission resolver — N/A; entity-picker has no permission concept), [#35](../../systems/graph-system/graph-system-description.md) (Tier 1 independence — entity-picker imports no other Tier 1 component; properties-form custom-field integration in §6.3 of description is host-side composition), [#37](../../systems/graph-system/graph-system-description.md) (design-system mandate — Onest + JetBrains Mono, OKLCH only). Pattern parity: mirrors [`properties-form` plan §3.3](../properties-form-procomp/properties-form-procomp-plan.md#33-component-props) controlled-state posture; mirrors [`filter-stack` plan §10.1.1](../filter-stack-procomp/filter-stack-procomp-plan.md#1011-categories-reference-stability-host-responsibility) `items` reference-stability footgun (entity-picker has it too via cmdk's filter cost); mirrors [`detail-panel` plan §4.3](../detail-panel-procomp/detail-panel-procomp-plan.md#43-react-context--the-compound-api-mechanism-q-p6) controlled-vs-uncontrolled posture for `open` state.

---

## 2. v0.1 scope summary

The deliverable is a single Tier 1 pro-component at `src/registry/components/forms/entity-picker/`. Surface area:

- **Searchable typed picker** — host supplies `items: ReadonlyArray<T>` where `T extends EntityLike = { id: string; label: string; kind?: string; ... }`; component renders a button-shaped trigger + Popover dropdown with Command (cmdk) search + result list.
- **Single OR multi mode** via `mode: "single" | "multi"` prop (default `"single"` per description Q1). Mode-aware value typing via TypeScript function overloads per Q-P1.
- **Kind badges** — when items carry `kind`, results render with a small Badge prefix; host supplies `kinds: Record<string, KindMeta>` for label/color. `showKindBadges?: boolean` defaults to true iff any item has a kind.
- **Default match** — case-insensitive substring match on `label` via `String.toLowerCase()` (Q-P2 lock; English-biased acceptable v0.1 trade-off; `Intl.Collator` upgrade is non-breaking). Host can override via `match?: (item, query) => boolean`.
- **Open/close state** — controlled (`open` + `onOpenChange`) OR uncontrolled (managed internally) per description Q4; pass-through to shadcn Popover's controlled props per Q-P9.
- **Selection state** — pure controlled (`value` + `onChange`); same posture as properties-form / filter-stack. `value: T | null` (single) or `value: T[]` (multi) per overload.
- **Selection equality** — id-based, NOT referential (Q-P4 lock; `onChange` only fires when the id-set changes; survives upstream item-array re-derivation).
- **Keyboard navigation** — cmdk handles ↑/↓ result navigation + Enter activation natively. Esc closes (Popover default). Tab moves focus in/out without losing selection. Backspace on empty search input removes the LAST chip in multi mode (Q-P3 lock).
- **Empty states** — distinct UI for "no matches for query" vs "no items provided" via `renderEmpty?` slot with ctx (`{ query, itemCount }`); default copy is `"No results"` (Q-P5 lock).
- **Slots** — `renderItem?(item, ctx)` for richer rows; `renderTrigger?(ctx)` for custom triggers with callback ref via ctx (Q-P6 lock); `renderEmpty?` for empty-state copy.
- **Multi-mode chip cluster** in the default trigger — selected entities render as Badge chips with remove buttons (Q-P8); chips wrap to multiple lines per description Q6.
- **Generic typing** — `<EntityPicker<T extends EntityLike>>` parameterized; default `T = EntityLike`.
- **Imperative ref handle** — `focus()`, `open()`, `close()`, `clear()` per description §5; minimal scope (Q-P10).
- **ARIA contract** — WAI-ARIA 1.2 combobox pattern: `role="combobox"` on the search input, `role="listbox"` on the list (cmdk handles), `aria-expanded`, `aria-activedescendant`, `aria-multiselectable` in multi mode.
- **Bundle ≤ 8KB** (per description success #8); shadcn Command (cmdk peer) is registry-shared infrastructure NOT entity-picker-attributable.

**Doesn't ship in v0.1** (per description §3): async `loadItems(query, page)`, virtualization for huge lists, "create new" affordance, multi-section grouping, recently-selected memory, drag-to-reorder chips, free-text values, fuzzy search. All v0.2+ are designed as additive — none change the v0.1 API.

**Implementation budget:** ~1 week focused (per system §10.2 and HANDOFF.md §5).

---

## 3. Final v0.1 API (recommended)

Builds out [description §5](entity-picker-procomp-description.md#5-rough-api-sketch) into final shapes.

### 3.1 Entity + kind shapes

```ts
interface EntityLike {
  id: string;
  label: string;
  kind?: string;
  // host's additional metadata is preserved via the generic
}

interface KindMeta {
  label: string;                                                     // shown in the badge text
  color?: string;                                                    // CSS variable name (e.g. "var(--chart-1)") or OKLCH literal
}
```

### 3.2 Component props (discriminated by mode; consumed via overloads — Q-P1)

```ts
interface CommonProps<T extends EntityLike> {
  items: ReadonlyArray<T>;

  // Search
  match?: (item: T, query: string) => boolean;                       // default: case-insensitive substring on label
  placeholder?: string;                                              // default "Search…"

  // Open/close (controlled or uncontrolled — Q-P9)
  open?: boolean;
  onOpenChange?: (open: boolean) => void;

  // Kind badges
  kinds?: Record<string, KindMeta>;                                  // keyed by item.kind
  showKindBadges?: boolean;                                          // default: true iff any item has a kind

  // Slots
  renderItem?: (item: T, ctx: RenderItemContext) => ReactNode;
  renderTrigger?: (ctx: RenderTriggerContext<T>) => ReactNode;
  renderEmpty?: (ctx: RenderEmptyContext) => ReactNode;

  // UX details
  disabled?: boolean;
  triggerLabel?: string;                                             // a11y label for the trigger button
  className?: string;
}

interface SinglePickerProps<T extends EntityLike> extends CommonProps<T> {
  mode?: "single";                                                   // optional — single is default
  value: T | null;
  onChange: (value: T | null) => void;
}

interface MultiPickerProps<T extends EntityLike> extends CommonProps<T> {
  mode: "multi";                                                     // REQUIRED for multi (no implicit-multi)
  value: T[];
  onChange: (value: T[]) => void;
}

type EntityPickerProps<T extends EntityLike> =
  | SinglePickerProps<T>
  | MultiPickerProps<T>;
```

Function overloads per Q-P1:

```ts
function EntityPicker<T extends EntityLike>(
  props: SinglePickerProps<T> & { ref?: Ref<EntityPickerHandle> }
): JSX.Element;
function EntityPicker<T extends EntityLike>(
  props: MultiPickerProps<T> & { ref?: Ref<EntityPickerHandle> }
): JSX.Element;
function EntityPicker<T extends EntityLike>(
  props: EntityPickerProps<T> & { ref?: Ref<EntityPickerHandle> }
): JSX.Element {
  // implementation operates on the union; narrows via mode discriminator
}
```

### 3.3 Slot contexts

```ts
interface RenderItemContext {
  selected: boolean;
  query: string;                                                     // current search input value
}

interface RenderTriggerContext<T extends EntityLike> {
  value: T | T[] | null;
  open: boolean;
  triggerRef: (node: HTMLElement | null) => void;                   // callback ref (Q-P6 lock)
}

interface RenderEmptyContext {
  query: string;
  itemCount: number;                                                 // total items supplied (helps distinguish "no items" vs "no matches")
}
```

`triggerRef` is a callback ref per Q-P6 — more flexible than `forwardRef` for custom triggers that aren't a single DOM node (e.g., a wrapper with multiple focusable children). The picker tracks the last node passed and uses it for `focus()` (imperative handle) + popover anchor positioning.

### 3.4 Imperative ref handle

```ts
interface EntityPickerHandle {
  focus(): void;                                                     // focuses the trigger via the latest triggerRef target
  open(): void;                                                      // sets open=true (calls onOpenChange in controlled; mutates internal state in uncontrolled)
  close(): void;                                                     // sets open=false
  clear(): void;                                                     // calls onChange(null) (single) or onChange([]) (multi)
}
```

Per Q-P10: minimal scope. `setValue(v)` and `getValue()` are redundant with controlled `value`/`onChange`.

### 3.5 What's NOT on the API

- No `loadItems(query, page)` — async/paginated is v0.2 per description §3.
- No `onCreate(query)` — "create new" affordance is v0.2 per description §3.
- No `groups: Array<{ kind, label }>` — multi-section grouping is v0.2.
- No `overflowMode` for multi-mode chip overflow — wrap-only in v0.1 per description Q6.
- No `debounceMs` — local filtering on host-supplied items is cheap; async case is v0.2.

---

## 4. State model

Two concerns: open/close (controlled-or-uncontrolled per Q-P9) and selection (purely controlled). No reducer needed.

### 4.1 Internal state shape

```ts
interface EntityPickerInternalState {
  // Used only when open is uncontrolled (open prop omitted)
  internalOpen: boolean;
  // Used only as a buffer for cmdk's search query (cmdk owns it via CommandInput)
  // We mirror via onValueChange so renderItem ctx + renderEmpty ctx can read query.
  query: string;
}
```

`internalOpen` is a `useState<boolean>` initialized to `false`. Activated only in the uncontrolled configuration; controlled-config reads `props.open` directly.

`query` is mirrored from cmdk's `CommandInput onValueChange` so the slot contexts (`RenderItemContext.query`, `RenderEmptyContext.query`) can read it. cmdk owns the actual filtering pipeline.

### 4.2 Open/close dispatch (Q-P9)

```ts
const isControlled = props.open !== undefined;
const openValue = isControlled ? props.open : internalOpen;

const handleOpenChange = useCallback((next: boolean) => {
  if (isControlled) {
    props.onOpenChange?.(next);
  } else {
    setInternalOpen(next);
    props.onOpenChange?.(next);   // fire even in uncontrolled if host supplied callback for observation
  }
}, [isControlled, props.onOpenChange]);
```

Pass `openValue` + `handleOpenChange` to shadcn `<Popover open onOpenChange>`. Standard "controlled-with-uncontrolled-fallback" pattern; mirrors Radix Popover's own posture.

`onOpenChange` fires in both modes — uncontrolled hosts can still observe open/close transitions without committing to controlling the state. This is a Radix convention.

### 4.3 Selection equality (Q-P4)

`onChange` fires only when the **id-set** of the selection changes:

- **Single mode**: `onChange` fires when `value?.id !== nextValue?.id` (or when one side is null and the other isn't).
- **Multi mode**: `onChange` fires when the SET of `value.map(v => v.id)` differs from the next set's ids.

Mechanism: the click/keyboard handlers compute the next value, then compare ids before dispatching. If the id-set is unchanged, no `onChange` fires (avoids needless host re-render when an upstream re-derivation produced semantically-identical entities with new references).

The `value` passed to `onChange` is **always** the freshly-computed array of full entities (not ids). Per description Q8: storing entities is robust against async-source race conditions.

### 4.4 Multi-mode toggle semantics

- Click on an unselected item: append to value array; dropdown stays open per description §2.
- Click on a selected item: remove from value array; dropdown stays open.
- Click on a chip's remove button: remove that entity; dropdown does NOT toggle open state.
- Backspace on empty search input: remove LAST chip in selection order (Q-P3 lock).
- Backspace on non-empty search: edit text normally (default browser behavior).
- Enter on highlighted result (cmdk): toggle the highlighted item.

Selection order is the order picked (description §3 explicitly excludes drag-to-reorder).

### 4.5 Single-mode select-and-close

- Click on any item: set value; close dropdown via `handleOpenChange(false)`.
- Click on the same item that's already selected: no value change (per Q-P4 id-equality); but dropdown closes anyway (matches user mental model of "I tapped the picker and committed").
- `clear()` ref method: `onChange(null)`; does NOT change open state.

---

## 5. Search / cmdk integration

### 5.1 cmdk delegation

Filtering is delegated to cmdk's built-in filter pipeline. cmdk's `Command` root accepts a `filter` prop:

```ts
filter?: (value: string, search: string, keywords?: string[]) => number;  // returns 0-1 score
```

Default cmdk filter is `command-score` (case-insensitive substring + fuzzy weighting). For description Q3 lock (case-insensitive substring), we override:

```ts
const filterFn = (value: string, search: string): number => {
  // 'value' is the CommandItem's `value` prop (set to item.id by us)
  // We need the item's label to filter by; lookup via the items array
  const item = itemsById.get(value);
  if (!item) return 0;
  if (props.match) return props.match(item, search) ? 1 : 0;
  // Default: case-insensitive substring on label
  return item.label.toLowerCase().includes(search.toLowerCase()) ? 1 : 0;
};
```

This requires `itemsById` (a `Map<string, T>` derived via `useMemo` from `props.items`).

cmdk filter returns 0–1; >0 = visible, 0 = hidden. We treat boolean match results as 1/0.

### 5.2 Search input + query mirroring

Use shadcn `<CommandInput>` as the search input. cmdk owns the input value internally (uncontrolled cmdk-side); we mirror via `onValueChange` to populate `query` for slot contexts:

```tsx
<CommandInput
  placeholder={props.placeholder ?? "Search…"}
  value={query}
  onValueChange={setQuery}
  aria-label={props.triggerLabel ?? "Search entities"}
/>
```

When the dropdown closes, query is reset to `""` (next open starts fresh) — matches user expectation.

### 5.3 Empty state branching

cmdk renders `<CommandEmpty>` when no items pass the filter. We use this slot to render the appropriate empty state:

```tsx
<CommandEmpty>
  {props.renderEmpty
    ? props.renderEmpty({ query, itemCount: items.length })
    : <DefaultEmptyState query={query} itemCount={items.length} />}
</CommandEmpty>
```

`DefaultEmptyState` distinguishes the two cases per description §2:

- `itemCount === 0`: "No entities to pick from" (host supplied empty `items`).
- `itemCount > 0 && query.length > 0`: "No matches for "{query}"".
- `itemCount > 0 && query.length === 0`: cmdk doesn't render `<CommandEmpty>` when query is empty (all items pass the empty filter); this branch is unreachable in practice.

Per Q-P5 lock, default copy is `"No results"` for the no-matches case (less i18n-fragile than embedding the query string). The `renderEmpty` slot lets hosts include the query if they want.

---

## 6. Chip cluster (multi-mode trigger UI)

The default trigger button (multi mode) renders selected entities as Badge-style chips with per-chip remove buttons. Single mode renders the selected entity's label (or placeholder when null) as a single line.

### 6.1 Layout

```
┌────────────────────────────────────────────┐
│ [chip 1 ×] [chip 2 ×] [chip 3 ×]    ▾ ▼   │
│ [chip 4 ×]                                  │
└────────────────────────────────────────────┘
```

Flex row with `flex-wrap: wrap`; chips occupy the trigger's interior; the dropdown chevron sits on the right. When the chip count grows, the trigger button grows vertically (Q6 description lock: "wrap to multiple lines").

For empty multi mode (`value.length === 0`), the trigger renders the placeholder `triggerLabel ?? "Select…"`.

### 6.2 Chip primitive

`parts/chip.tsx` wraps shadcn `Badge` with a small remove button:

```tsx
function Chip({ entity, kindMeta, onRemove }: ChipProps) {
  return (
    <Badge variant="secondary" className="gap-1">
      {kindMeta && (
        <span className="text-[10px] uppercase opacity-60">{kindMeta.label}</span>
      )}
      <span>{entity.label}</span>
      <button
        type="button"
        aria-label={`Remove ${entity.label}`}
        onClick={(e) => {
          e.stopPropagation();
          onRemove();
        }}
        className="ml-1 -mr-1 rounded p-0.5 hover:bg-foreground/10"
      >
        <X className="h-3 w-3" aria-hidden="true" />
      </button>
    </Badge>
  );
}
```

Click on the chip body (Badge surface) propagates to the parent trigger button → opens the dropdown. Click on the X button stops propagation → only removes the chip without toggling open state.

### 6.3 Chip removal mechanics

Two paths:
1. Click chip's X button → remove that entity from value array.
2. Backspace in search input when empty → remove the LAST entity from value array (Q-P3 lock).

Both paths route through `removeEntity(id)` which dispatches `onChange(value.filter(v => v.id !== id))`.

### 6.4 Single-mode trigger

```tsx
<button className="trigger">
  {value
    ? (
      <span className="flex items-center gap-2">
        {kindMeta && <KindBadge meta={kindMeta} />}
        <span>{value.label}</span>
      </span>
    )
    : <span className="text-muted-foreground">{triggerLabel ?? "Select…"}</span>}
  <ChevronDown className="ml-auto h-4 w-4 opacity-60" />
</button>
```

No chip cluster; single-line label (or placeholder when null). Value's kind badge inline if present.

---

## 7. Files and parts

### 7.1 File-by-file plan

```
src/registry/components/forms/entity-picker/
├── entity-picker.tsx                 # main component (function overloads; Popover + Command wiring;
│                                      #   imperative handle; open/close dispatch)
├── types.ts                          # EntityLike, KindMeta, CommonProps, Single/MultiPickerProps,
│                                      #   EntityPickerProps union, EntityPickerHandle, slot contexts
├── parts/
│   ├── trigger-button.tsx            # default trigger UI (single value OR chip cluster); chevron icon
│   ├── chip-cluster.tsx              # multi-mode chip wrapper (flex-wrap container + chevron alignment)
│   ├── chip.tsx                      # single chip with remove button + optional kind label
│   ├── kind-badge.tsx                # Badge wrapper with KindMeta-driven color (CSS var or OKLCH literal)
│   ├── result-row.tsx                # CommandItem with kind-badge + label + selected-indicator (Check icon)
│   ├── default-empty-state.tsx       # "no items" vs "no matches" branching with default copy
│   └── selected-indicator.tsx        # Check icon for selected items in dropdown (multi mode)
├── hooks/
│   ├── use-open-state.ts             # controlled-or-uncontrolled open/close dispatch (Q-P9)
│   ├── use-imperative-handle.ts      # builds the EntityPickerHandle (Q-P10) — focus/open/close/clear
│   └── use-items-by-id.ts            # memoized Map<string, T> for cmdk filter lookup
├── lib/
│   ├── default-match.ts              # case-insensitive substring (Q-P2 lock)
│   ├── selection-equality.ts         # id-set equality for onChange dedup (Q-P4 lock)
│   └── normalize-value.ts            # mode-aware value helpers (toArray, fromArray, hasId)
├── dummy-data.ts                     # fixtures: 30 nodes + 8 groups (linking-mode) + 12 users (custom row)
├── demo.tsx                          # 7 demos per description success #10 (single page, internal switch)
├── usage.tsx                         # consumer-facing patterns + properties-form custom-field recipe
├── meta.ts                           # registry meta
└── index.ts                          # EntityPicker + types + (no other named exports)
```

**File count: 19.** Slightly more than detail-panel / filter-stack (17) due to richer interaction surface — chip cluster + chip primitive + kind badge + selected indicator + custom result row are 5 small parts on top of the main component. Smaller than properties-form (22).

### 7.2 Build order within v0.1

Three internal phases, each ~2 days:

**Phase A — types + state + lib (foundational; ~2 days):**
- **Pre-flight (must precede everything else):** install missing shadcn primitive — `pnpm dlx shadcn@latest add command` (1 primitive; pulls `cmdk` peer dep). **State of `src/components/ui/` verified at plan-write time (2026-04-29):** contains `badge`, `button`, `card`, `dropdown-menu`, `popover`, `scroll-area`, `separator`, `table`, `tabs`. `Popover` and `Badge` already present; `Command` is the only missing primitive entity-picker uses. Commit separately so the install diff stays distinct from the component-add diff.
- `types.ts` — full type surface (overloaded API; discriminated union; slot contexts)
- `lib/default-match.ts` — case-insensitive substring
- `lib/selection-equality.ts` — id-set equality for onChange dedup
- `lib/normalize-value.ts` — mode-aware value helpers (`toArray`, `fromArray`, `hasId`)
- `hooks/use-open-state.ts` — controlled-or-uncontrolled dispatch
- `hooks/use-imperative-handle.ts` — handle builder
- `hooks/use-items-by-id.ts` — memoized Map for cmdk filter lookup
- Unit-testable in isolation when Vitest lands; v0.1 verification is demo-driven.

**Phase B — rendering (~3 days):**
- `parts/kind-badge.tsx` — KindMeta → Badge with color (CSS var or OKLCH)
- `parts/selected-indicator.tsx` — Check icon for multi-mode selected dropdown items
- `parts/chip.tsx` — Badge + X button + optional kind label
- `parts/chip-cluster.tsx` — flex-wrap container
- `parts/trigger-button.tsx` — chip cluster (multi) or single value (single) + chevron
- `parts/result-row.tsx` — CommandItem wrapper with kind badge + label + selected indicator
- `parts/default-empty-state.tsx` — branching empty state copy
- `entity-picker.tsx` — main component wiring Popover + Command + slots + handle
- Phase B end: `axe-core` smoke run for combobox-pattern a11y; Radix Popover + cmdk handle most of it.

**Phase C — demos + integration (~2 days):**
- `demo.tsx` (7 sub-demos covering description success #10), `dummy-data.ts`, `usage.tsx`, `meta.ts`, `index.ts`
- Verify `tsc + lint + build` clean
- Verify all 10 success-criteria items
- Verify properties-form custom-field integration (description §6.3) works against the signed-off properties-form plan API

---

## 8. ARIA contract

Per description success #5; WAI-ARIA 1.2 combobox pattern. cmdk + Radix Popover handle most of this natively; entity-picker layers in the multi-mode-specific bits.

| Element | ARIA |
|---|---|
| Picker root | no implicit role; the trigger is the focal element |
| Trigger button | `<button>` with `aria-haspopup="listbox"`, `aria-expanded={open}`, `aria-controls={listboxId}`, `aria-label={triggerLabel}` (when no visible text describes it) |
| Chip (multi mode) | `<span>` with kind label + entity label visually; remove button is a separate `<button aria-label="Remove {label}">` |
| Popover content | `role="dialog"` is suppressed (Popover) — the listbox role is on the result list itself |
| Search input | `<CommandInput>` provides `role="combobox"`, `aria-expanded`, `aria-controls`, `aria-autocomplete="list"`, `aria-activedescendant` (cmdk wires this) |
| Result list | cmdk's `<CommandList>` provides `role="listbox"`; multi mode adds `aria-multiselectable="true"` |
| Result row | cmdk's `<CommandItem>` provides `role="option"`, `aria-selected` (we set on selected items in multi mode) |
| Selected indicator | `<Check aria-hidden="true">` icon — the `aria-selected` attr is the screen-reader signal |
| Empty state | `role="status"` on the wrapper; cmdk's `<CommandEmpty>` is announced when results drop to zero |

Focus management:
- **Open via click**: focus moves to search input (cmdk default).
- **Open via keyboard (Enter on trigger)**: focus moves to search input.
- **Close via Esc**: focus returns to trigger.
- **Close via outside click**: focus does NOT return to trigger (Popover convention).
- **`focus()` ref method**: focuses the latest `triggerRef` target.

---

## 9. Edge cases (locked)

| Case | Handling |
|---|---|
| `items` is empty | Trigger renders normally; opening shows `default-empty-state` with `itemCount === 0` branch ("No entities to pick from" or `renderEmpty` slot output). |
| `items` contains duplicate `id`s | cmdk uses `id` as filter key; duplicates collapse into one displayed row. Dev-only `console.error` flagged from a useEffect on items reference change. |
| `value` (single) references an item not in `items` | Trigger displays the value's label (the host-supplied entity); dropdown shows no checkmark match. Documented behavior. |
| `value` (multi) contains entities not in `items` | Each chip renders the supplied label; dropdown shows no checkmark for missing entities. Same posture as single. |
| `value` (multi) contains duplicates | Each chip renders separately; click-to-remove removes the FIRST occurrence (`filter(v => v.id !== id)` is filter-not-by-position). Host bug; documented. |
| `kinds` map missing an entry for `item.kind` | Render the kind value as plain text in the badge with `--muted` color; dev-only `console.warn` once per missing kind per session (tracked in a Set). |
| `match(item, query)` throws | Caught at the cmdk filter call site; treats as `false` (item filtered out); dev-only `console.error` with item id + query. |
| `renderItem` / `renderTrigger` / `renderEmpty` throws | React error boundary at the slot site (`<RenderItemErrorBoundary>` wrapper); renders fallback ("Custom render crashed — see console"); rest of the picker remains interactive. |
| `disabled: true` | Trigger button has `aria-disabled="true"` + `pointer-events-none`; opening via ref method or controlled `open` is allowed (host's choice); search input inside is also disabled. |
| `mode` switched mid-life from "single" to "multi" or vice versa | Value type mismatches from props would surface as a dev-only `console.error` (single value when mode is multi, etc.). Internal state resets (open closes; query clears). Hosts should mount a new picker rather than flip mode. |
| `open: true` controlled but `disabled: true` | Picker stays open per host's controlled state; dev-only `console.warn` ("disabled picker is open — ignoring disabled state for visibility"). Edge case worth being explicit about. |
| Trigger ref callback receives `null` (component unmounting) | Clear the ref (`triggerRef.current = null`); `focus()` ref method becomes no-op; production-safe. |
| `clear()` called when `value` is already null/empty | Dispatches `onChange(null)` / `onChange([])` anyway — host's reducer no-ops if same. Idempotent. |
| `open()` called when `disabled: true` | Dispatches `handleOpenChange(true)` regardless; the host can decide. Picker still renders dropdown (consistent with the `open: true && disabled: true` row above). |
| Backspace in multi mode with empty search AND empty value | No-op (no chips to remove). |
| Backspace in single mode | Standard text-input behavior (no chip removal in single mode). |
| Hosts pass new `items` reference each render (inline literal) | Same footgun as filter-stack's `categories` and properties-form's `schema`. Cmdk re-derives filter on items change; if items are referentially unstable, cmdk re-runs filter on every render. Mitigated by React Compiler in-repo; documented in usage for NPM consumers. See §10.1.1. |
| `match` is referentially unstable (inline arrow) | Same footgun. Documented. |
| Very long entity labels in chips | Chip wraps via `flex-wrap` per Q6; long labels can produce a tall chip cluster. Acceptable; `overflowMode` is a v0.2 prop if real consumers need it. |

---

## 10. Performance + bundle

### 10.1 Performance

- **`useItemsById` Map** — built once per `items` reference change; O(N) construction; O(1) lookup at filter time. `useMemo` keyed on `items`.
- **cmdk filter** — runs synchronously on every keystroke; cmdk handles its own debouncing internally where appropriate; no virtualization in v0.1 (description §3 — v0.2 adds for >500 items).
- **Selection equality** — id-set equality at the click/keyboard handler site; computed once per click; O(N) where N is selection size (typical: <20).
- **Chip cluster** — flex-wrap layout has no JS-side performance concern; rendering is O(M) per render where M is selection size.
- **Popover content** — mounted only when `open: true`; cmdk Command is unmounted between opens. Search query resets on close.

#### 10.1.1 `items` reference stability (host responsibility)

Same footgun as [filter-stack's `categories`](../filter-stack-procomp/filter-stack-procomp-plan.md#1011-categories-reference-stability-host-responsibility) and [properties-form's `schema`](../properties-form-procomp/properties-form-procomp-plan.md#1111-schema-reference-stability-host-responsibility). Hosts that pass an inline `items={[...]}` literal create new entity object references on every parent render. Without reference stability, `useItemsById`'s memo invalidates and cmdk re-derives its internal index.

**In-repo mitigation:** React Compiler ([CLAUDE.md tech stack](../../../CLAUDE.md)) auto-memoizes JSX-literal arrays at the call site. Inline `items={[...]}` is fine for in-repo consumers.

**NPM-extraction concern:** consumers without React Compiler must memoize manually. Two patterns documented in `usage.tsx`:

1. **Module-scope items** (preferred for static lists):
   ```tsx
   const USERS = [/* ... */] satisfies User[];
   <EntityPicker items={USERS} ... />
   ```
2. **`useMemo` items** (for derived lists):
   ```tsx
   const items = useMemo(() => [...nodes, ...groups], [nodes, groups]);
   <EntityPicker items={items} ... />
   ```

Same dev-only runtime warning posture: fires when `items` reference changes more than 5 times in succession (avoiding false positives on first-mount churn). The same warning surfaces unstable `match` references.

### 10.2 Bundle audit

Budget: **≤ 8KB minified + gzipped** per description success #8.

**State of `src/components/ui/` at plan-write time** (verified 2026-04-29): `badge`, `button`, `card`, `dropdown-menu`, `popover`, `scroll-area`, `separator`, `table`, `tabs`. **Of the 3 shadcn primitives entity-picker uses (`Popover`, `Command`, `Badge`), only `Command` is missing.** Phase A pre-flight installs it via `pnpm dlx shadcn@latest add command`. The cmdk peer dep is ~5KB minified + gzipped.

Realistic breakdown — entity-picker's *own* code:
- Component code: ~5-6KB (19 files; 3 hooks; 3 lib helpers; 7 parts; main component ~1KB)
- `lucide-react` icons: tree-shaken; ~1KB for `X` (chip remove) + `Check` (selected indicator) + `ChevronDown` (trigger).
- **Entity-picker-attributable total: ~6-7KB**, ceiling 8KB with ~1-2KB headroom (tighter than filter-stack; comparable to detail-panel).

Newly-installed shadcn `Command` adds to the registry's overall bundle but is **shared infrastructure**, amortized across all current and future consumers — it's NOT entity-picker-attributable cost. cmdk peer dep (~5KB) is the dominant share of the install cost.

Wired via `size-limit` (or equivalent) at v0.1 implementation start — same posture as the other Tier 1 plans.

---

## 11. Risks & alternatives

### 11.1 Risks

| Risk | Mitigation |
|---|---|
| Function overloads + generics + React 19 ref-as-prop is a known TS pain point | Plan ships a single union-typed implementation with overloads at the export boundary. Smoke-test the generic-inference path (`<EntityPicker<User> mode="multi" ... />`) at end of Phase A before building parts. |
| cmdk's internal filter runs on every keystroke; large item lists could feel sluggish | Description §3 punts virtualization to v0.2; v0.1 documents the >500-item rough threshold. If real consumers hit this, lazy-mount + virtualize is non-breaking. |
| Chip cluster a11y — chips are visual, X buttons are interactive; tab-traversal through trigger | Each chip's X button is a separate Tab stop. Tab order: trigger → chip-1-X → chip-2-X → ... → trigger's chevron. Tested in Phase B with axe-core; if traversal is unwieldy, fall back to "Tab enters the trigger as one stop; arrow keys navigate chips" pattern (more code, more standard for combobox-with-tags UX). |
| Bundle exceeds 8KB | Audit at end of Phase B. Specific cut candidates in priority order: (1) `selected-indicator.tsx` is a thin `<Check>` wrapper — could inline into `result-row.tsx` (~0.2KB structural cost); (2) `default-empty-state.tsx` could be inlined into `entity-picker.tsx` (~0.3KB structural cost); (3) drop the dev-only "missing kind" warning (~0.1KB). Don't cut a11y machinery (callback ref forwarding, kind badges, chip remove buttons). |
| Mode flip mid-life crashes | Internal state resets via `useEffect` on mode change; dev-warn flagged. Documented as host bug. |
| cmdk's filter-prop lookup-by-id is slower than passing labels directly | We use `item.id` as cmdk's `value` (because labels can collide); the `itemsById` map keeps lookup O(1). Smoke-test at 500 items in Phase B. |
| `value` reference instability across renders (host re-derives entity objects) | id-equality at the dispatch site (Q-P4) prevents spurious onChange fires; but re-derivation still triggers re-renders inside the picker. React Compiler covers in-repo. |

### 11.2 Alternatives considered, rejected

- **Two separate components (`<SingleEntityPicker>` + `<MultiEntityPicker>`)** — rejected per description Q1; duplicated chrome / search / keyboard nav.
- **Discriminated union props (no overloads)** — Q-P1 alternative; works but call-site has worse error messages when mode/value shapes mismatch. Overloads give better narrowing at the call site.
- **Mode-aware generic param (`<EntityPicker<T, M>>`)** — Q-P1 alternative; TS struggles to infer M when mode prop is optional. More verbose at call sites.
- **Build search/filter from scratch (not cmdk)** — rejected per description §2 (explicitly built on cmdk). cmdk's a11y wiring + filter ergonomics are battle-tested.
- **Async `loadItems`** — rejected per description §3; v0.2.
- **Virtualization** — rejected per description §3; v0.2.
- **`Intl.Collator` default match** — rejected per Q-P2; English-biased `toLowerCase` is the v0.1 floor; `Intl.Collator` upgrade is non-breaking.
- **`forwardRef` for trigger ref** — rejected per Q-P6 + description §8.5 #6; callback ref via ctx is more flexible for non-DOM-node triggers.
- **Storing `value` as ids only** — rejected per description Q8; full entities are robust against async re-derivation race conditions.

---

## 12. Resolved plan-stage questions (recommendations; convert on sign-off)

10 questions. **High-impact:** Q-P1 (mode-aware typing mechanism), Q-P4 (selection equality), Q-P9 (open/close dispatch). **Medium:** Q-P2 (default match), Q-P3 (Backspace chip removal), Q-P6 (trigger ref forwarding), Q-P7 (cmdk integration shape), Q-P8 (chip cluster). **Low:** Q-P5 (empty-state default copy), Q-P10 (handle scope).

### Q-P1 (from description §8.5 #1) — Mode-aware value typing mechanism

**Recommendation: function overloads** per §3.2. Two overload signatures (Single + Multi) plus a third union-typed implementation signature consumed only inside the function body. Mode discriminator narrows the union at the boundary; call-site type errors point at the right shape ("`value` should be `T | null` when `mode` is `"single"`").

Alternatives considered:
- **Discriminated union of `Props<T>`** — works but call-site error messages are noisier; "Property 'mode' is missing in type" instead of "Did you mean to use multi mode?".
- **Mode-aware generic param `<EntityPicker<T, M>>`** — TS can't reliably infer M when `mode` is optional + defaulted; verbose.
- **Loose union `value: T | T[] | null`** — rejected per description §8.5 #1; consumer-side casting is unsafe and error-prone.

**Impact:** high — defines the API ergonomic for every consumer.
**Trade-off:** function overloads + generics + React 19 ref-as-prop is a known TS pain point. Mitigation: smoke-test the generic-inference path early in Phase A. If overloads break under React 19 + React Compiler, fall back to discriminated union as the second-best — same runtime behavior, slightly worse DX.

### Q-P2 (from description §8.5 #2) — Default match locale handling

**Recommendation: `String.prototype.toLowerCase()`** for v0.1 per §5.1. English-biased — `"Café"` and `"Cafe"` won't match by default. `Intl.Collator` with `sensitivity: "accent"` is the locale-aware alternative but ~3× slower per call. The `match` slot lets hosts plug in their preferred matcher (`fuse.js`, `Intl.Collator`, custom).

**Impact:** medium — defines the OOTB matching behavior.
**Trade-off:** non-English consumers see degraded matching by default. Documented; v0.2 may add `matchOptions: { collation: "accent" | "base" | "case" }` if real consumers ask. The upgrade is non-breaking — `match` slot consumers are unaffected; default-match upgraders see better matches.

### Q-P3 (from description §8.5 #3) — Multi-mode Backspace chip removal

**Recommendation: Backspace removes LAST chip ONLY when search input is empty** per §4.4. When search has text, Backspace edits text normally (default browser behavior). Standard combobox-with-tags pattern (matches Material UI Autocomplete, Mantine MultiSelect).

Implementation: `onKeyDown` on the search input checks `query === "" && key === "Backspace" && value.length > 0`; if true, prevent default + dispatch `removeEntity(value[value.length - 1].id)`.

**Impact:** medium — defines the keyboard interaction shape.
**Trade-off:** "remove last chip" can be surprising the first time but is the conventional pattern. Tested in Phase B with axe-core for screen-reader announcement on chip removal.

### Q-P4 (from description §8.5 #4) — Selection equality for change detection

**Recommendation: id-set equality** per §4.3. `onChange` fires only when the id-set differs:

- Single: `onChange` fires when `value?.id !== nextValue?.id` (or null↔non-null).
- Multi: `onChange` fires when `Set(value.map(v => v.id))` differs from the next set.

Mechanism: click/keyboard handlers compute the next value, then compare ids before dispatching. If unchanged, no `onChange` fires.

**Impact:** high — defines the host-observable change-detection contract.
**Trade-off:** non-id changes to the same entity (e.g., host updates `entity.label` upstream) are NOT propagated through `onChange`. Acceptable: hosts that mutate entity contents without changing id should re-render via their own state; entity-picker's `onChange` is for "the user picked something different," not "the picked entity was edited." Documented in usage.

### Q-P5 (from description §8.5 #5) — Default empty-state copy

**Recommendation: `"No results"`** for the no-matches case per Q-P5 lock. Less i18n-fragile than embedding the query string. The `renderEmpty` slot lets hosts include the query if they want richer copy. For the "no items at all" branch (`itemCount === 0`): `"Nothing to pick from"`.

**Impact:** low — primarily i18n posture.
**Trade-off:** hosts wanting "No matches for X" copy supply `renderEmpty`. Documented in usage with the recipe.

### Q-P6 (from description §8.5 #6) — Trigger ref forwarding mechanism

**Recommendation: callback ref via `RenderTriggerContext`** per §3.3. The picker passes `triggerRef: (node: HTMLElement | null) => void` in the ctx; custom triggers call this on their root focusable element. The picker tracks the latest non-null node for `focus()` ref method and Popover anchor positioning.

Implementation: `useCallback` on the picker side that captures `node` into a ref + invokes `setPositionerNode` on Popover.

Alternatives considered:
- **`forwardRef`** — couples render-trigger to React.forwardRef, doesn't compose with React 19 ref-as-prop cleanly. Triggers that wrap multiple DOM nodes (e.g., a host-built compound trigger) struggle.
- **Imperative `triggerRef.current` exposed via ctx** — rejected; mutable state in ctx is anti-pattern.

**Impact:** medium — affects custom-trigger ergonomics.
**Trade-off:** custom-trigger authors must remember to call `triggerRef(node)`. Documented; usage example shows the pattern.

### Q-P7 (NEW) — cmdk integration: filter shape + query mirroring

**Recommendation: cmdk owns filtering via `filter` prop on `Command` root** per §5.1. Override default cmdk filter with `filterFn(value, search)` that looks up the item by id (`itemsById.get(value)`) and applies `props.match ?? defaultMatch`. cmdk's `<CommandInput>` owns the search input value internally; we mirror via `onValueChange` → `setQuery(value)` for slot contexts.

**Impact:** medium — defines how cmdk and entity-picker collaborate.
**Trade-off:** the `itemsById` Map adds a small memory cost (~50 bytes per entity) but enables O(1) filter lookup. Without it, cmdk would need labels as the value (with id collisions possible).

### Q-P8 (NEW) — Chip cluster: implementation surface

**Recommendation: roll-our-own chip cluster** using shadcn `Badge` per §6. shadcn doesn't ship a multi-select-with-chips primitive; Radix has none either. ~80-100 LOC across `chip-cluster.tsx` + `chip.tsx`. Each chip is a `<Badge>` with kind label + entity label + X button (separate `<button>` for screen-reader removal action).

Alternatives considered:
- **Use `dropdown-menu` selection state** — wrong primitive; dropdown-menu is for actions, not selection chips.
- **Third-party multiselect (e.g., `react-select`)** — adds ~30KB dep for a one-off use case. Rejected.
- **Wait for shadcn to ship a multiselect** — none on the roadmap as of plan-write time.

**Impact:** medium — adds a small component surface that's inherently non-standard.
**Trade-off:** owning the chip cluster means we own the a11y wiring (Tab traversal through chip X buttons). Plan-stage refinement #2 below locks the Tab-order pattern.

### Q-P9 (NEW) — Open/close state dispatch

**Recommendation: controlled-with-uncontrolled-fallback** per §4.2, mirroring Radix Popover's posture. `isControlled = props.open !== undefined`; uncontrolled config uses `useState<boolean>(false)` for `internalOpen`; `handleOpenChange` dispatches via host's callback in controlled mode and via `setInternalOpen` in uncontrolled (with optional callback fire-through for observation).

**Impact:** high — defines the open-state ownership contract.
**Trade-off:** none; this is the standard Radix/shadcn pattern. Imperative handle's `open()` / `close()` methods route through the same dispatch.

### Q-P10 (NEW) — Imperative ref handle scope

**Recommendation: minimal — `focus`, `open`, `close`, `clear`** per §3.4. Other candidates rejected:
- `setValue(v)` — redundant with controlled `onChange`.
- `getValue()` — redundant with controlled `value`.
- `getQuery()` — internal mirror; if hosts want, they observe `onValueChange` themselves.

**Impact:** low — primarily an API tightening.
**Trade-off:** none — small surface is easier to evolve. Additive in v0.2 if needed.

## 12.5 Plan-stage refinements (surfaced during draft)

These bake into implementation but worth flagging:

1. **`React 19 ref-as-prop` + function overloads + generics smoke-test.** Phase A end gate: write a 10-line generic-inference test (`<EntityPicker<User> mode="multi" value={[]} onChange={(users: User[]) => {}} />`) and verify TS narrows correctly. If broken, fall back to discriminated union props (same runtime behavior).
2. **Chip Tab-order pattern.** Plan locks: each chip's X button is a separate Tab stop; tab traversal: trigger button (opens dropdown) → chip-1-X → chip-2-X → ... → trigger chevron region. Alternative ("trigger is one Tab stop; arrow keys navigate chips") considered but rejected — chip removal via mouse + Tab is more discoverable than arrow-key chip removal. Tested in Phase B with axe-core.
3. **`itemsById` map invalidation on items reference change.** `useMemo` keyed on `items` reference; when host passes inline `items={[...]}` (no React Compiler), Map rebuilds every render. Documented in §10.1.1 as the same footgun pattern.
4. **`onOpenChange` fire-through in uncontrolled config.** Even when uncontrolled, fire `props.onOpenChange?.(next)` so hosts can observe transitions (e.g., for analytics) without committing to controlling state. Matches Radix convention.
5. **Production-build warning suppression.** Dev-only `console.warn` / `console.error` calls (duplicate ids, missing kind in kinds map, mode-flip mid-life, disabled-but-open) are gated by `process.env.NODE_ENV !== "production"`. Bundlers strip the dead code.
6. **`renderItem` / `renderTrigger` / `renderEmpty` error boundaries.** Each slot site wraps in a small error boundary with a fallback message; rest of the picker remains interactive. Other parts (default trigger, default result row, default empty state) don't need boundaries.
7. **`focus()` no-op on null trigger.** When the latest `triggerRef` callback received `null` (component unmounting / custom-trigger unmounted), `focus()` is a silent no-op. Production-safe.
8. **cmdk's CommandList scroll behavior.** cmdk auto-scrolls active item into view. We don't need additional scroll handling. Verified in Phase B with a 100-item demo.
9. **Single-mode select-and-close timing.** The order is: `onChange(item)` → `handleOpenChange(false)` → ... close animation. If host's `onChange` re-renders synchronously and removes the item from `items`, the dropdown still closes correctly (close is a separate dispatch).
10. **`clear()` does NOT close the dropdown.** Host calls `clear()` to wipe selection; if the dropdown is open, it stays open (user is presumably picking again). This matches the chip-X behavior (multi mode) where removing a chip doesn't close the dropdown either.

---

## 13. Definition of "done" for THIS document (stage gate)

- [ ] User reviewed §1–§11 (the plan body) and §12 (Q-Ps + §12.5 refinements).
- [ ] All 10 plan-stage questions resolved (Q-P1 to Q-P10).
- [ ] User said **"go ahead"** — sign-off applied. Stage 3 (implementation) unlocks: run §7.2 Phase A pre-flight (`pnpm dlx shadcn@latest add command`) FIRST, then `pnpm new:component forms/entity-picker`.
- [ ] `Recommendation:` form converted to `**Locked: X.**`; status header flipped; [system §9 sub-doc map](../../systems/graph-system/graph-system-description.md#9-sub-document-map) updated to mark `entity-picker` plan ✓ signed off.

The plan is signed off when v0.1 implementation can begin. Tier 1 plan-lock cascade: 4 of 5 done after this; only `markdown-editor` plan remains. `force-graph` v0.5 plan-lock stays gated on `markdown-editor`.

---

*End of v0.1 plan draft. Pause for user validate pass per project cadence (draft → validate → re-validate → sign off → commit).*
