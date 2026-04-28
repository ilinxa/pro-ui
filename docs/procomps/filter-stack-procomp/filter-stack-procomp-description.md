# `filter-stack` — Pro-component Description

> **Status:** draft v0.1 — pending sign-off
> **Slug:** `filter-stack`
> **Category:** `forms`
> **Created:** 2026-04-28
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
- **`onFilteredChange` convenience callback** — receives the filtered items array. Host can use this directly OR derive their own filtered list by reading `values` and applying predicates manually.
- **Generic typing**: `FilterStack<T>` parameterized over the item type, defaulting to `unknown`. Predicates take `(item: T, value: FilterValue) => boolean`.
- **Vertical stack layout** with consistent spacing between sections (no collapsibles in v0.1).
- **Design system compliance** per [system decision #37](../../systems/graph-system/graph-system-description.md): signal-lime accent on active filters, OKLCH tokens, Onest font.
- **ARIA contract**: each section is a `<fieldset>` with `<legend>`; checkbox lists are properly grouped; mode toggles announced via `aria-pressed`.

---

## 3. Out of scope (deferred)

- **Solo buttons** ("only show this one" shorthand for clear + add). Useful in graph-system but omitted from v0.1 to keep the surface tight; v0.2 adds `<FilterStack.SoloButton>` or a per-option `solo: true` flag.
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
  // value shape: string[] (selected option values)
  // mode shape: stored separately at category-id-level (e.g., values["groups"] = string[]; values["groups__mode"] = "union" | "intersection")
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

## 8. Open questions

These need answers before Stage 2 (plan) authoring begins:

1. **Built-in filter types — which 4?** Spec proposes `checkbox-list`, `toggle`, `text`, `custom`. Alternatives: also include `range` (dual-slider) and `date-range` as built-ins; or trim further (drop `toggle`, since it's `checkbox-list` with one option). Recommendation: **the proposed 4.** `range` and `date-range` deferred to v0.2 (custom slot covers them in v0.1). `toggle` stays separate from `checkbox-list` because the UI is fundamentally different (single switch vs. list).

2. **Solo buttons in v0.1 or v0.2?** Original spec (graph-visualizer-old.md §6.4) wanted per-item solo buttons in checkbox-list ("only show this one" shortcut). Recommendation: **defer to v0.2.** Solo is shorthand for "clear category + add one value" — host can wire it via `onChange` calls. Adding solo as a built-in adds API surface without enabling anything new. v0.2 can add `<FilterStack.SoloButton>` as a slot if real demand surfaces.

3. **Section collapsibles in v0.1 or v0.2?** Long filter panels (5+ sections) benefit from collapse/expand. Recommendation: **defer to v0.2.** v0.1 ships flat layout. If real consumers complain at 5+ sections, add `collapsible: boolean` per category in v0.2 (additive, non-breaking).

4. **`onFilteredChange` convenience vs host-derives.** Should filter-stack provide the filtered items list, or should hosts derive it from `values` + predicates? Spec proposes both: `onFilteredChange` callback for ergonomics, while `onChange(values)` is mandatory. Recommendation: **ship both.** The convenience callback is cheap and removes boilerplate from 90% of hosts. Hosts who need raw `values` for memoization or external state still get them via `onChange`. No conflict.

5. **Generic typing strictness** (same question as `properties-form` Q2). Recommendation: **ship parameterized generic from v0.1**, defaulting to `T = unknown`. Same answer as properties-form — cheap one-time win.

6. **Mode-storage shape: separate key vs. nested object.** Spec proposes `values["groups"] = string[]` and `values["groups__mode"] = "union" | "intersection"` as two flat keys. Alternative: `values["groups"] = { selection: string[]; mode: "union" }` (nested). The flat version keeps `values` shape simple (Record<string, FilterValue>); the nested version is type-safer. Recommendation: **flat with `__mode` suffix.** filter-stack's contract is "values is a flat Record"; nested objects complicate the type. Document the convention.

7. **`isEmpty` mandatory on every category.** Spec makes it mandatory. Alternative: filter-stack has built-in defaults per filter type (e.g., `checkbox-list` is empty when `value` is empty array; `text` is empty when string is empty). Recommendation: **mandatory but provide defaults that hosts can override.** filter-stack ships per-type default `isEmpty` checkers; if the category's `isEmpty` is omitted, the default applies. For `custom`, host MUST supply `isEmpty`. Cleaner default ergonomics.

8. **Debounce default for `text` type.** Spec proposes 250ms. Alternatives: 150ms (snappier), 400ms (less work for slower filter predicates). Recommendation: **250ms.** Standard for search inputs; balances responsiveness with avoiding wasted re-filters. Per-category override available via `debounceMs`.

9. **Footer placement and styling: sticky vs static.** Should the "Clear all" footer stick to the bottom of the filter-stack container, or scroll with the content? Recommendation: **static (scrolls with content).** Filter-stack itself is typically inside a scrollable container; sticky-within-stack is unusual. Host can wrap in a sticky container if desired. Simpler default.

10. **Layout direction in v0.1.** Vertical only, or also support horizontal? Recommendation: **vertical only.** Horizontal compact-bar filters are a different visual idiom (would need overflow handling, drawer for hidden filters, etc.). Add `direction?: "vertical" | "horizontal"` in v0.2 if a real consumer needs it (likely none for graph-system).

---

## 9. Sign-off checklist

- [ ] Problem framing correct?
- [ ] Scope boundaries defensible (in / out)?
- [ ] Target consumers complete?
- [ ] API sketch covers the three example use cases?
- [ ] Built-in types (Q1) are the right 4?
- [ ] Mode-storage shape (Q6) acceptable as flat with `__mode` suffix?
- [ ] Success criteria measurable?
- [ ] Open questions §8 — recommendations acceptable, or any need re-discussion?

Sign-off enables Stage 2 (`filter-stack-procomp-plan.md`) authoring and unblocks parallel description authoring for `entity-picker` and `markdown-editor`. Plan must lock the open questions and define the file-by-file structure per the [component-guide.md anatomy](../../component-guide.md#5-anatomy-of-a-component-folder).
