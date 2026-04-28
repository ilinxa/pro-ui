# `filter-stack` — Pro-component Description

> **Status:** **signed off 2026-04-28.** Stage 2 (`filter-stack-procomp-plan.md`) authoring may begin.
> **Slug:** `filter-stack`
> **Category:** `forms`
> **Created:** 2026-04-28
> **Last updated:** 2026-04-28 (signed off; Q2 reversed and Q7 refined on re-validation; all 10 open questions resolved)
> **Owner:** ilinxa team
> **Parent system:** [graph-system](../../systems/graph-system/graph-system-description.md) — Tier 1 (generic; no graph dependency)

This is Stage 1 of the [procomp gate](../README.md). It answers *should we build this at all, and what shape should it be?* It does NOT specify implementation — that's Stage 2 (`filter-stack-procomp-plan.md`).

The system-level constraints in [graph-system-description.md §8](../../systems/graph-system/graph-system-description.md) (decisions #9 inherited from original spec, #25, #35, #37) are inherited as constraints; this doc does not re-litigate them.

---

## 1. Problem

Multi-dimensional filter UIs share a recurring shape:

- A graph view filters by group, by node type, by edge type, by search query (force-graph v0.4)
- A data table filters by column values, by date range, by status
- A search-results page narrows by faceted filters
- A file browser filters by file type, by size, by modification date

Every one of these reimplements the same patterns: stacked filter sections, per-section controls (checkbox lists, toggles, text inputs), per-section clear, global clear-all, the AND-across-categories / OR-within-category composition rule, the "is anything active" detection that drives the global clear button. Reimplementations diverge on small UX details — *does the clear button live next to the section label or below the controls? does the union/intersection toggle render as a button group or a switch? does typing in the search box debounce, and at what interval?* — producing fragmented filter UX across surfaces that should feel uniform.

In the graph-system specifically, the filters panel ([original spec §6.4](../../../graph-visualizer-old.md)) needs four filter categories — group, node-type, edge-type, search — composed with AND across and OR within (system decision #9, inherited). Without a shared filter-stack component, force-graph v0.4 would reimplement filtering chrome that data-table also needs for its eventual column-filter feature.

**A reusable, schema-driven filter-stack component closes this gap.** It provides the layout, the per-section controls (with built-in types + custom slot), the composition rule (AND across categories), and the global clear-all. Hosts describe each filter category (id, label, predicate, control type); the component handles everything mechanical.

---

## 2. In scope (v0.1)

- **Schema-driven filter sections.** Host provides a list of filter category definitions; component renders them stacked vertically in the order given.
- **Four built-in filter types**:
  - `checkbox-list` — multi-select with options + optional union/intersection mode toggle
  - `toggle` — boolean (e.g., "Show wikilink-derived edges")
  - `text` — text input with debounce (e.g., search)
  - `custom` — host-rendered via render function (escape hatch for range, date, slider, etc.)
- **AND-across / OR-within composition** (system decision #9). filter-stack composes per-category predicates with `&&`. Within a category (e.g., a checkbox-list with `mode: "union"`), the host's predicate handles "does any active value pass." This is the filter-composition pattern locked at the system level.
- **Per-category state**: values are keyed by `category.id` in a flat `Record<string, unknown>`. Pure controlled — host owns `values`, `onChange` is mandatory. (Mirrors `properties-form` decision Q6.)
- **Per-category clear button** rendered next to the section label when the category's value is non-empty.
- **Global clear-all** in the footer; disabled when all categories are empty.
- **Empty-detection per category** via a mandatory `isEmpty(value)` method on each category definition. filter-stack uses this to gate per-category clear visibility and global clear-all enable state.
- **Mode toggle on `checkbox-list`** when `modeToggle: true` — renders a union/intersection switch. Default mode: `"union"`.
- **Per-option solo buttons on `checkbox-list`** when `showSoloButtons: true` (opt-in, default `false`). Each option gets a small "solo" affordance — clicking it sets the category's value to that single option. Useful for "only show this group" shortcuts in graph filter panels. (Added on Q2 re-validation; original recommendation was to defer solo to v0.2, reversed because host-side implementation without API support is awkward and force-graph v0.4 explicitly wants it.)
- **`onFilteredChange` convenience callback** — receives the filtered items array. Host can use this directly OR derive their own filtered list by reading `values` and applying predicates manually.
- **Generic typing**: `FilterStack<T>` parameterized over the item type, defaulting to `unknown`. Predicates take `(item: T, value: FilterValue) => boolean`.
- **Vertical stack layout** with consistent spacing between sections (no collapsibles in v0.1).
- **Design system compliance** per [system decision #37](../../systems/graph-system/graph-system-description.md): signal-lime accent on active filters, OKLCH tokens, Onest font.
- **ARIA contract**: each section is a `<fieldset>` with `<legend>`; checkbox lists are properly grouped; mode toggles announced via `aria-pressed`.

---

## 3. Out of scope (deferred)

- **Built-in `range` filter** (dual-slider) and **`date-range` filter**. v0.1 punts to `custom` slot. v0.2 ships these as built-ins if real demand surfaces.
- **Section collapsing / expand-collapse UI.** v0.1 ships flat. Worth considering when the graph-system's filter panel grows past 5 sections, but deferred for now.
- **Horizontal / compact layout** (top-bar style filters). v0.1 vertical only. Adding horizontal is an additive layout-direction prop in v0.2.
- **Persistent filter state** (URL params, localStorage). Host's responsibility; pass `values` from wherever they're stored.
- **Filter presets / saved filter sets.** Out of scope; would be a separate companion (`<FilterStack.Presets>`) if ever needed.
- **Search-overrides-filters semantics** (system decision #12). This is a HOST-level concern: filter-stack returns who passes the filter; the host then unions that result with search-matched items independently. filter-stack does not have a "search override" prop.
- **Async filter predicates.** Synchronous only in v0.1.
- **Per-section edit/sort/reorder.** Sections render in the order supplied; no drag-to-reorder.

---

## 4. Target consumers

In dependency order:

1. **`force-graph` v0.4** (Tier 2) — the primary driver. force-graph's filter panel composes group, node-type, edge-type, search categories. Used in the Tier 3 page sidebar.
2. **`data-table` column-filter feature** (future enhancement) — when data-table grows column-filter UI, filter-stack is the right substrate. Existing data-table doesn't have this today; would be a v0.2 data-table feature.
3. **Tier 3 graph-system page** — wires the filter-stack instance to force-graph's filter state.
4. **Generic faceted-search surfaces** (any pro-component or page that needs multi-dimensional filtering).

filter-stack has zero graph dependency. This is per [system decision #35](../../systems/graph-system/graph-system-description.md): Tier 1 components are independent.

---

## 5. Rough API sketch

A schema array describing categories, plus a controlled `values` / `onChange` pair for state. Final shapes locked in Stage 2.

```ts
type FilterValue = string[] | boolean | string | unknown;

interface BaseFilterCategory<T> {
  id: string;
  label: string;
  description?: string;
  predicate: (item: T, value: FilterValue) => boolean;
  isEmpty: (value: FilterValue) => boolean;
}

interface CheckboxListFilter<T> extends BaseFilterCategory<T> {
  type: "checkbox-list";
  options: ReadonlyArray<{ value: string; label: string }>;
  modeToggle?: boolean;          // show union/intersection switch; default false (union only)
  defaultMode?: "union" | "intersection";  // when modeToggle is true; default "union"
  showSoloButtons?: boolean;     // per-option "only this one" affordance; default false
  // value shape: string[] (selected option values)
  // mode shape: stored as separate flat key (e.g., values["groups"] = string[]; values["groups__mode"] = "union" | "intersection")
  // schema validation rejects category ids ending in "__mode" to avoid collision
}

interface ToggleFilter<T> extends BaseFilterCategory<T> {
  type: "toggle";
  // value shape: boolean
}

interface TextFilter<T> extends BaseFilterCategory<T> {
  type: "text";
  placeholder?: string;
  debounceMs?: number;           // default 250
  // value shape: string
}

interface CustomFilter<T> extends BaseFilterCategory<T> {
  type: "custom";
  render: (props: {
    value: unknown;
    onChange: (value: unknown) => void;
    items: ReadonlyArray<T>;
  }) => ReactNode;
}

type FilterCategory<T> =
  | CheckboxListFilter<T>
  | ToggleFilter<T>
  | TextFilter<T>
  | CustomFilter<T>;

interface FilterStackProps<T = unknown> {
  items: ReadonlyArray<T>;
  categories: ReadonlyArray<FilterCategory<T>>;
  values: Record<string, FilterValue>;        // keyed by category.id
  onChange: (values: Record<string, FilterValue>) => void;

  // Filtered output
  onFilteredChange?: (filtered: ReadonlyArray<T>) => void;

  // Footer
  showClearAll?: boolean;        // default true
  clearAllLabel?: string;        // default "Clear all"

  className?: string;
}

interface FilterStackHandle {
  clearAll(): void;              // imperative trigger; same as clicking the footer button
  clear(categoryId: string): void;
  isEmpty(): boolean;            // true when ALL categories are empty
}
```

Predicate composition is automatic: filter-stack ANDs every category's `predicate(item, values[id])` to produce the filtered list. The `mode: "union" | "intersection"` for `checkbox-list` is a hint to the host's predicate (filter-stack stores mode but doesn't impose semantics — the host's `predicate` reads it and decides).

---

## 6. Example usages

### 6.1 Graph filter panel (force-graph v0.4 → Tier 3 graph-system page)

```tsx
<FilterStack<NodeWithGraphContext>
  items={visibleCandidateNodes}
  categories={[
    {
      id: "groups",
      label: "By group",
      type: "checkbox-list",
      options: groupOptions,
      modeToggle: true,
      defaultMode: "union",
      predicate: (node, value) => {
        const ids = (value as string[]) ?? [];
        if (ids.length === 0) return true;
        const mode = filterValues["groups__mode"] ?? "union";
        return mode === "union"
          ? ids.some((id) => node.groupIds.includes(id))
          : ids.every((id) => node.groupIds.includes(id));
      },
      isEmpty: (v) => !Array.isArray(v) || v.length === 0,
    },
    {
      id: "nodeTypes",
      label: "By node type",
      type: "checkbox-list",
      options: nodeTypeOptions,
      predicate: (node, value) => {
        const ids = (value as string[]) ?? [];
        return ids.length === 0 || ids.includes(node.nodeTypeId);
      },
      isEmpty: (v) => !Array.isArray(v) || v.length === 0,
    },
    {
      id: "showDocNodes",
      label: "Show doc nodes",
      type: "toggle",
      predicate: (node, value) => value !== false || node.kind !== "doc",
      isEmpty: (v) => v === true,        // default state is "on"
    },
    {
      id: "search",
      label: "Search",
      type: "text",
      placeholder: "Search nodes…",
      debounceMs: 300,
      predicate: (node, value) => {
        const q = ((value as string) ?? "").trim().toLowerCase();
        return q.length === 0 || node.label.toLowerCase().includes(q);
      },
      isEmpty: (v) => typeof v !== "string" || v.length === 0,
    },
  ]}
  values={filterValues}
  onChange={setFilterValues}
  onFilteredChange={(filtered) => setVisibleNodeIds(new Set(filtered.map((n) => n.id)))}
/>
```

This is the canonical graph-system filter panel. AND across categories, OR within (via the host's predicates).

### 6.2 Data-table column filters (future v0.2 data-table feature)

```tsx
<FilterStack<Order>
  items={orders}
  categories={[
    {
      id: "status",
      label: "Status",
      type: "checkbox-list",
      options: [
        { value: "pending", label: "Pending" },
        { value: "shipped", label: "Shipped" },
        { value: "delivered", label: "Delivered" },
      ],
      predicate: (order, value) => {
        const statuses = (value as string[]) ?? [];
        return statuses.length === 0 || statuses.includes(order.status);
      },
      isEmpty: (v) => !Array.isArray(v) || v.length === 0,
    },
    {
      id: "dateRange",
      label: "Created",
      type: "custom",
      render: ({ value, onChange }) => (
        <DateRangePicker value={value as [Date, Date] | null} onChange={onChange} />
      ),
      predicate: (order, value) => {
        if (!Array.isArray(value)) return true;
        const [from, to] = value as [Date, Date];
        return order.createdAt >= from && order.createdAt <= to;
      },
      isEmpty: (v) => v === null || !Array.isArray(v),
    },
  ]}
  values={filterValues}
  onChange={setFilterValues}
  onFilteredChange={setVisibleOrders}
/>
```

Demonstrates the `custom` slot + non-graph use.

### 6.3 Generic faceted search

```tsx
<FilterStack
  items={searchResults}
  categories={[
    { id: "type", label: "Type", type: "checkbox-list", options: typeOptions, predicate: ..., isEmpty: ... },
    { id: "verified", label: "Verified only", type: "toggle", predicate: ..., isEmpty: ... },
    { id: "q", label: "Refine", type: "text", debounceMs: 200, predicate: ..., isEmpty: ... },
  ]}
  values={values}
  onChange={setValues}
  onFilteredChange={setRefinedResults}
/>
```

Standalone use with no graph involvement.

---

## 7. Success criteria

The component is "done" for v0.1 when:

1. **Used by `force-graph` v0.4 with no API additions or workarounds.** The 4-category panel from §6.1 (groups + nodeTypes + showDocNodes + search) works end-to-end with proper AND-across composition.
2. **Custom slot tested** with a non-built-in filter type (a date range or numeric range, exercised in the demo).
3. **Mode toggle (union/intersection) renders correctly** on `checkbox-list` with `modeToggle: true`; mode change triggers re-filter via host's predicate.
4. **Per-category clear buttons** appear/disappear correctly based on `isEmpty(value)`. Clicking clears that category only.
5. **Global clear-all enables/disables** based on `isEmpty()` across all categories. Clicking clears every category.
6. **Debounced text input** doesn't fire `onChange` faster than the configured `debounceMs`.
7. **`onFilteredChange` only fires when the filtered set changes** — not on every keystroke if debounce hasn't elapsed.
8. **A11y audit passes**: each section is a fieldset/legend, keyboard navigation through all controls, screen-reader announces mode toggle state, ESC clears the focused text field.
9. **Bundle weight ≤ 12KB** (minified + gzipped) — pure layout + state component, no heavy deps.
10. **`tsc + lint + build` clean** with no React Compiler warnings.
11. **Demo at `/components/filter-stack`** demonstrates: 3 built-in types side-by-side, custom slot example, mode toggle, per-category clear, global clear, debounced text input.

---

## 8. Resolved questions (locked on sign-off 2026-04-28)

All 10 questions resolved at sign-off. The recommendations below are the locked decisions for v0.1; Stage 2 (plan) builds against these. New questions surfacing during plan authoring land in a fresh `## 8.6 New open questions` section as needed.

1. **Built-in filter types — locked: 4 types** (`checkbox-list`, `toggle`, `text`, `custom`). `range` and `date-range` deferred to v0.2 (custom slot covers them in v0.1). `toggle` stays separate from `checkbox-list` because the UI idiom differs (switch vs. list).

2. **Solo buttons — locked: ship in v0.1 as opt-in `showSoloButtons?: boolean` flag on `checkbox-list`** (default `false`). **Reversed from the original "defer to v0.2" recommendation on re-validation.** Reasoning: host-side implementation without API support is awkward (checkbox options have no per-option click hook in the schema); force-graph v0.4 explicitly wants solo per the original spec; the implementation cost is small (~50 LOC) and entirely opt-in (zero impact for hosts who don't enable). Adding later as a non-breaking flag is technically possible but means force-graph v0.4 either delays or re-implements solo at host level.

3. **Section collapsibles — locked: defer to v0.2.** v0.1 ships flat layout. `collapsible: boolean` per category lands in v0.2 if real consumers complain at 5+ sections (additive, non-breaking).

4. **`onFilteredChange` convenience callback — locked: ship alongside `onChange`.** Both callbacks: `onChange(values)` is mandatory (state ownership); `onFilteredChange(filtered)` is optional convenience. Hosts wanting filter-stack to do composition once (efficient) use the convenience callback; hosts wanting raw `values` for external state get them via `onChange`. No conflict.

5. **Generic typing — locked: parameterized from v0.1**, defaulting to `T = unknown`. Same answer as `properties-form` Q2 (decision #2 in that procomp). Cheap one-time win; no migration cost.

6. **Mode-storage shape — locked: flat with `__mode` suffix.** `values["groups"] = string[]; values["groups__mode"] = "union" | "intersection"`. Simpler `FilterValue` type and easier URL serialization than the nested alternative. Plan stage MUST include schema validation that rejects category ids ending in `__mode` (or any reserved suffix used internally) to prevent collisions.

7. **`isEmpty` defaults — locked with refinement:** filter-stack ships per-type default `isEmpty` checkers for `checkbox-list` (empty when value is empty array) and `text` (empty when string is empty). **`toggle` and `custom` REQUIRE explicit `isEmpty`** — for `toggle`, "empty" depends on host intent (`true` could mean "show all" OR "filter to true-only"); for `custom`, only the host knows the value shape. Refined from the original "defaults for all built-in types" recommendation on re-validation.

8. **Debounce default — locked: 250ms** for `text` type. Standard for search inputs; per-category override via `debounceMs`.

9. **Footer placement — locked: static** (scrolls with content). Filter-stack typically lives inside a scrollable container; sticky-within-stack is unusual. Host wraps in a sticky container if desired.

10. **Layout direction — locked: vertical only** in v0.1. Horizontal compact-bar filters are a different visual idiom (overflow handling, drawer for hidden filters). `direction?: "vertical" | "horizontal"` is an additive v0.2 prop if a real consumer needs it (likely none for graph-system).

## 8.5 Plan-stage tightenings (surfaced during description review + re-validation)

These are NOT description-blocking, but plan authoring must address them:

1. **Schema validation for reserved suffixes.** Per Q6: reject category ids ending in `__mode` at schema load time (dev-error in development; runtime check). If the project later adds more reserved suffixes (e.g., `__solo` for some future feature), the validation logic must be extensible.
2. **`isEmpty` enforcement at the type level.** Per Q7: `BaseFilterCategory` has `isEmpty?: ...` (optional with defaults available). The discriminated union refines:
   - `CheckboxListFilter`: `isEmpty?` (optional; default applies)
   - `TextFilter`: `isEmpty?` (optional; default applies)
   - `ToggleFilter`: `isEmpty: ...` (required)
   - `CustomFilter`: `isEmpty: ...` (required)
   Plan locks this discriminated typing.
3. **Solo button placement and ARIA.** Per Q2 refinement: solo button renders next to each option (right-aligned within the option row). ARIA: `aria-label` of "Show only {label}". Click sets `values[id] = [optionValue]`. Plan locks the visual + a11y treatment.
4. **`FilterValue` discriminated union typing.** Plan must specify whether `FilterValue` is the loose `string[] | boolean | string | unknown` (current sketch) or strictly per-category-type discriminated. Recommendation: loose union — strict per-category typing is verbose and the predicate-side cast pattern works fine.
5. **`onFilteredChange` change-detection semantics.** Per Q4: the callback fires only when the filtered set changes — not on every value change if the filtered output is identical. Plan locks the equality check (referential? shallow? by-id-set?).
6. **Mode toggle UI placement within the section.** Plan decides: mode toggle inline next to the section label, or below the options? Recommendation lean: inline next to label (compact + obvious binding).

---

## 9. Sign-off checklist

- [x] Problem framing correct
- [x] Scope boundaries defensible (in / out)
- [x] Target consumers complete (force-graph v0.4 primary; data-table column filters secondary)
- [x] API sketch covers the three example use cases
- [x] Built-in types (Q1) confirmed as 4
- [x] Mode-storage shape (Q6) confirmed flat with `__mode` suffix
- [x] Success criteria measurable
- [x] Open questions §8 — all 10 resolved on sign-off (Q2 reversed, Q7 refined on re-validation)

**Signed off 2026-04-28.** Stage 2 (`filter-stack-procomp-plan.md`) authoring may begin. Parallel description authoring for `entity-picker` and `markdown-editor` is now unblocked. Plan must build against the §8 locked decisions and address the §8.5 plan-stage tightenings, defining the file-by-file structure per the [component-guide.md anatomy](../../component-guide.md#5-anatomy-of-a-component-folder).
