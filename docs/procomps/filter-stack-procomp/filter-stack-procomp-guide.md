# `filter-stack` — Pro-component Guide (Stage 3)

> **Stage:** 3 of 3 · **Shipped:** v0.1.0 (alpha) · **Date:** 2026-05-09
> **Slug:** `filter-stack` · **Category:** `forms`
> **Files:** [src/registry/components/forms/filter-stack/](../../../src/registry/components/forms/filter-stack/)
> **Detail page:** `/components/filter-stack` (after `pnpm dev`)

The consumer-facing reference. The description ([filter-stack-procomp-description.md](filter-stack-procomp-description.md)) explains *why*; the plan ([filter-stack-procomp-plan.md](filter-stack-procomp-plan.md)) explains *how we built it*; this doc explains *how to use it*.

---

## When to use FilterStack

Reach for it when you have a list of typed items and want a stacked, schema-driven filter panel that composes filters with **AND across categories** and lets the host decide **OR vs AND within a category**. Three signals:

1. **Multi-dimensional filtering.** Two or more independent filter axes — status + tags + search; group + node-type + edge-type + search; type + verified + query. The user expects all axes to apply simultaneously.
2. **Heterogeneous controls.** Some axes are checkbox lists, some are toggles, some are debounced text inputs. You want one panel that hosts all of them with consistent chrome (per-section clear, global clear-all, mode toggles where they apply).
3. **Schema-driven config.** You'd rather declare categories as data than wire JSX per filter. The host owns predicates and value shapes; FilterStack owns the layout, controls, and composition mechanics.

## When NOT to use FilterStack

- **Single-axis filtering.** If you have one search box, use an `Input`. If you have one dropdown, use `Select`. FilterStack's machinery is justified at 2+ categories.
- **Top-bar / horizontal compact filter strips.** v0.1 ships vertical only. A horizontal `direction` prop is on the v0.2 roadmap; don't fork or wrap to fake it.
- **Server-driven asynchronous filters.** v0.1 predicates are synchronous (`(item, value) => boolean`). If you need debounce-then-fetch-from-API, FilterStack returns who passes locally; the host pairs that with its own request layer or waits for v0.2 async support.
- **Saved filter presets / URL sync as a built-in.** FilterStack is pure controlled — `values` is a prop, `onChange` is yours. Persistence (localStorage, URL params, named saved filters) is host-side. Wire it once around the panel.
- **Filter-on-keystroke without debounce.** The text type is debounced (default 250 ms). If you genuinely want every keystroke to fire, set `debounceMs: 0` — but consider whether your downstream pipeline can keep up.

## The five-minute walkthrough

```tsx
import { useMemo, useState } from "react";
import {
  FilterStack,
  type FilterCategory,
  type FilterValue,
} from "@/components/filter-stack";

interface Project {
  id: string;
  name: string;
  status: "todo" | "in-progress" | "done";
  tags: string[];
}

const CATEGORIES: ReadonlyArray<FilterCategory<Project>> = [
  {
    id: "status",
    type: "checkbox-list",
    label: "Status",
    options: [
      { value: "todo", label: "To do" },
      { value: "in-progress", label: "In progress" },
      { value: "done", label: "Done" },
    ],
    predicate: (item, value) => {
      const sel = (value as string[]) ?? [];
      return sel.length === 0 || sel.includes(item.status);
    },
  },
  {
    id: "search",
    type: "text",
    label: "Search",
    placeholder: "Filter by name…",
    predicate: (item, value) =>
      typeof value !== "string" || value.length === 0 ||
      item.name.toLowerCase().includes(value.toLowerCase()),
  },
];

export function ProjectFilters({ projects }: { projects: Project[] }) {
  const [values, setValues] = useState<Record<string, FilterValue>>({});
  const [filtered, setFiltered] = useState<ReadonlyArray<Project>>(projects);

  return (
    <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
      <FilterStack<Project>
        items={projects}
        categories={CATEGORIES}
        values={values}
        onChange={setValues}
        onFilteredChange={setFiltered}
        ariaLabel="Project filters"
      />
      <ProjectList items={filtered} />
    </div>
  );
}
```

That's a working two-axis filter panel. The user types a name, ticks a status; FilterStack ANDs the active categories and pushes the filtered array via `onFilteredChange`. `values` state is yours — persist it to URL, localStorage, or a server preset whenever you want.

## The mental model

FilterStack is **a layout + state-orchestration component**, not a filtering library:

- You supply a **schema** (`categories`) of filter definitions.
- You supply **items** + **values** + **onChange** (controlled state).
- You supply each category's **`predicate(item, value)` and `isEmpty(value)`** functions.
- FilterStack renders the controls, debounces text input, manages mode toggles for `checkbox-list`, calls your predicates, and ANDs the results.

The contract:

| FilterStack owns | You own |
|---|---|
| Layout (vertical stack, per-section chrome, footer) | Filter semantics (predicate, isEmpty) |
| Built-in controls (checkbox-list, toggle, text, custom slot) | Item type, value shape per category |
| Mode-toggle UX (Union/Intersection radiogroup) | The interpretation of mode in your predicate |
| Debounced text buffer + commit | Where filtered results render |
| Per-category clear + global clear-all | How filter state is persisted |
| Schema validation (dev-only) + reference-stability dev warning | The category list and its memoization |
| `onFilteredChange` change-detection (referential) | Strict-change deduplication if you need it |

The composition rule is **AND across categories, OR (or AND, or whatever you like) within**. FilterStack ANDs every active category's predicate; *within* a category, your predicate decides what counts as a match. For `checkbox-list` with `modeToggle`, FilterStack stores the user's chosen mode at `values["${id}__mode"]`; your predicate reads it and switches between OR-of-options and AND-of-options.

A category is "empty" when its `isEmpty(value)` returns true; empty categories are skipped — FilterStack doesn't even build their predicate. That's how the panel behaves correctly with no values set (no filtering happens) and how the per-category clear and global clear-all decide their own visibility/disabled state.

## Composition patterns

These cover the recurring "how do I…" cases. Each pattern is a small recipe; combine freely.

### 1. Mixing all four built-in types

```tsx
const CATEGORIES: ReadonlyArray<FilterCategory<Order>> = [
  // checkbox-list with mode toggle (Union/Intersection)
  {
    id: "tags",
    type: "checkbox-list",
    label: "Tags",
    options: tagOptions,
    modeToggle: true,
    defaultMode: "union",
    predicate: (item, value) => {
      const sel = (value as string[]) ?? [];
      if (sel.length === 0) return true;
      const mode = values["tags__mode"] ?? "union"; // read from outer scope
      return mode === "intersection"
        ? sel.every((t) => item.tags.includes(t))
        : sel.some((t) => item.tags.includes(t));
    },
  },
  // toggle (boolean) — isEmpty is required for toggle
  {
    id: "verified",
    type: "toggle",
    label: "Verified only",
    isEmpty: (v) => v !== true,
    predicate: (item, value) => (value === true ? item.verified : true),
  },
  // text (debounced)
  {
    id: "search",
    type: "text",
    label: "Search",
    placeholder: "Filter by name…",
    debounceMs: 300,
    predicate: (item, value) =>
      typeof value !== "string" || value.length === 0 ||
      item.name.toLowerCase().includes(value.toLowerCase()),
  },
  // custom (escape hatch) — isEmpty is required for custom
  {
    id: "members",
    type: "custom",
    label: "Member range",
    isEmpty: (v) => !Array.isArray(v) || (v as [number, number])[0] === 0,
    predicate: (item, value) => {
      if (!Array.isArray(value)) return true;
      const [min, max] = value as [number, number];
      return item.members >= min && item.members <= max;
    },
    render: ({ value, onChange, fieldId }) => (
      <RangeSlider
        id={fieldId}
        value={(value as [number, number]) ?? [0, 1000]}
        onChange={onChange}
      />
    ),
  },
];
```

### 2. Reading the mode flag inside a checkbox-list predicate

Mode is stored under a sibling key (`${id}__mode`); your predicate reads `values` *from the outer scope*, not from the predicate's value parameter:

```tsx
{
  id: "groups",
  type: "checkbox-list",
  label: "Groups",
  options: groupOptions,
  modeToggle: true,
  predicate: (item, value) => {
    const sel = (value as string[]) ?? [];
    if (sel.length === 0) return true;
    const mode = values["groups__mode"] ?? "union";
    return mode === "intersection"
      ? sel.every((g) => item.groups.includes(g))
      : sel.some((g) => item.groups.includes(g));
  },
}
```

Predicate identity matters here — `values` is captured by closure. If you build the schema inside `useMemo`, include the relevant slice of `values` (or the mode key specifically) in the deps. See pattern #5 below.

### 3. Solo buttons (per-option "show only this")

`showSoloButtons: true` adds a small target-icon button next to each option. Clicking it sets the category's value to `[optionValue]` (collapses to that single option). Useful for graph filter panels: "show only this group".

```tsx
{
  id: "kind",
  type: "checkbox-list",
  label: "Node type",
  options: kindOptions,
  showSoloButtons: true,
  predicate: (item, value) => {
    const sel = (value as string[]) ?? [];
    return sel.length === 0 || sel.includes(item.kind);
  },
}
```

When `modeToggle` is also true, the solo click preserves the existing mode (or falls back to `defaultMode` / `"union"`). When `modeToggle` is false, no mode key is written — solo just sets the value.

### 4. Custom slot — wrapping a third-party widget

The `custom` type is the escape hatch for filters that don't fit checkbox / toggle / text. The render fn receives `{ value, onChange, items, fieldId }`; you own the layout, ARIA, and any debounce.

```tsx
{
  id: "createdAt",
  type: "custom",
  label: "Created",
  isEmpty: (v) => !Array.isArray(v) || v[0] === null,
  predicate: (item, value) => {
    if (!Array.isArray(value)) return true;
    const [from, to] = value as [Date | null, Date | null];
    if (!from || !to) return true;
    return item.createdAt >= from && item.createdAt <= to;
  },
  render: ({ value, onChange, fieldId }) => (
    <DateRangePicker
      id={fieldId}
      value={value as [Date | null, Date | null] | null}
      onChange={onChange}
    />
  ),
}
```

The host's `render` is wrapped in an error boundary; if it throws, FilterStack shows a fallback message and the rest of the panel keeps working.

### 5. Memoizing categories that depend on values or props

Inline `categories={[...]}` rebuilds objects on every render. In-repo, the React Compiler memoizes inline literals; for NPM consumers (or when categories depend on outer state), hoist or `useMemo`:

```tsx
// Static schema — module scope is best
const CATEGORIES: ReadonlyArray<FilterCategory<Item>> = [/* ... */];

// Schema that depends on props or values — useMemo
const categories = useMemo<ReadonlyArray<FilterCategory<Item>>>(
  () => buildCategories(options, values),
  [options, values?.tags__mode], // narrow deps
);
```

If `categories` reference changes more than 5 times in succession, FilterStack emits a dev-only warning (`[filter-stack] \`categories\` prop is changing every render…`).

### 6. Imperative reset from outside the panel

The ref handle exposes three methods. `clearAll` cancels in-flight text debounces and dispatches a single `onChange` with mode keys preserved.

```tsx
const ref = useRef<FilterStackHandle>(null);

<>
  <FilterStack<Item>
    ref={ref}
    items={items}
    categories={CATEGORIES}
    values={values}
    onChange={setValues}
  />
  <Button onClick={() => ref.current?.clearAll()}>Reset filters</Button>
</>
```

Use `ref.current?.isEmpty()` to gate that button's disabled state — it returns true iff every category's `isEmpty(value)` returns true.

### 7. Subscribing to filtered output via `onFilteredChange`

Two ways to consume the filtered set:

```tsx
// (a) Subscribe — push the filtered array into state
const [filtered, setFiltered] = useState<ReadonlyArray<Item>>(items);

<FilterStack<Item>
  items={items}
  categories={CATEGORIES}
  values={values}
  onChange={setValues}
  onFilteredChange={setFiltered}
/>

// Render `filtered` somewhere downstream.
```

```tsx
// (b) Compute it yourself — read values + categories
const filtered = useMemo(
  () => items.filter((item) =>
    categories.every((c) =>
      c.isEmpty?.(values[c.id]) ? true : c.predicate(item, values[c.id])
    )
  ),
  [items, categories, values],
);
```

`onFilteredChange` fires when the filtered array's reference changes — "may have changed", not "definitely differs". Cost-conscious hosts dedupe via shallow-equal-by-id on their side.

## Gotchas

### 1. Mode flag lives in a sibling key, not in the option array

`values["status"] = ["todo", "done"]` AND `values["status__mode"] = "intersection"` are two separate keys. If you serialize values to a URL or local storage, you serialize **both**. If you reset only `values["status"]`, the mode key remains; whether that's correct depends on your UX (it usually is — mode is UI preference, not filter state). The reserved-suffix validation rejects category ids ending in `__mode` to prevent collisions.

### 2. `isEmpty` is required for `toggle` and `custom`

For `checkbox-list` and `text`, FilterStack supplies sensible defaults (empty array / empty string). For `toggle` and `custom`, only the host knows what counts as empty — TypeScript enforces it on the schema. A common toggle empty check is `(v) => v !== true` (the toggle is "active" only when it's true).

### 3. Predicates and `isEmpty` should not throw

If they do, FilterStack catches the throw, logs `[filter-stack] predicate threw for category "<id>":` in dev, and treats:
- A throwing `predicate` as `false` for that item (filtered out).
- A throwing `isEmpty` as "not empty" (clear button shows).

Both are fail-safe defaults; production builds strip the dev warnings. Don't rely on this — fix the throw.

### 4. Inline `categories` causes re-computation

FilterStack memoizes the filter pipeline on `(items, categories, values)` references. Inline `categories={[...]}` creates a fresh array literal every render and re-walks the pipeline. In-repo, the React Compiler covers most cases; for NPM consumers, hoist or `useMemo`. The component emits a dev warning after 5+ unstable renders to nudge the fix.

### 5. Text-input debounce flushes on blur

Type, blur the input → the buffered value commits immediately. Type, click clear → the buffer is cancelled. Type, unmount → the buffer is cancelled. ESC inside a focused text input clears that field and stops propagation (so an outer ESC handler closing a sidebar won't fire). If you need outer ESC priority, bind in capture phase higher up.

### 6. `onFilteredChange` fires on mount

The first render with non-empty `items` fires the callback with the initial filtered set. If you render the filtered list off the same `items` until the first user interaction, you'll see one mount-time fire that pushes the same data. Skip it via a ref guard if it matters; usually it's fine.

### 7. The `__mode` key is yours after category removal

FilterStack does **not** prune `values["${removedId}__mode"]` when you drop a category from the schema. The orphan stays in `values` until you `delete` it via `onChange`. Same goes for the value key itself.

### 8. Category id ending in `__mode` is rejected (dev-only)

The reserved-suffix validation logs `console.error` if any category's `id` ends in `__mode`. Pick a different id; "__mode" is FilterStack's territory. The list is exported as `RESERVED_SUFFIXES` if you ever need to test against it.

### 9. `clear(id)` cancels in-flight text debounces; `clearAll()` cancels all of them

If a user is mid-typing and another part of the UI calls `clear("search")` or `clearAll()`, the pending commit is cancelled — no late `onChange` arrives after the clear. This matters for "save & close" patterns where you want a clean state after the dialog is dismissed.

## Cookbook

### Recipe 1 — Persist filter state to URL

```tsx
import { useSearchParams } from "next/navigation";

function useUrlFilterValues() {
  const [params, setParams] = useSearchParams();
  const values = useMemo<Record<string, FilterValue>>(() => {
    const out: Record<string, FilterValue> = {};
    for (const [k, v] of params.entries()) {
      out[k] = k.endsWith("__mode") ? v : v.split(",");
    }
    return out;
  }, [params]);

  const onChange = useCallback((next: Record<string, FilterValue>) => {
    const usp = new URLSearchParams();
    for (const [k, v] of Object.entries(next)) {
      if (k.endsWith("__mode") && typeof v === "string") usp.set(k, v);
      else if (Array.isArray(v) && v.length > 0) usp.set(k, v.join(","));
      else if (typeof v === "string" && v.length > 0) usp.set(k, v);
    }
    setParams(usp);
  }, [setParams]);

  return [values, onChange] as const;
}
```

Adapt the encoder/decoder to your value shapes (toggle, custom). Mode keys are strings; arrays are comma-joined; toggles serialize as `"true"`.

### Recipe 2 — Add a "saved presets" dropdown above the panel

```tsx
const PRESETS = {
  "Active work": { status: ["in-progress"], pinned: true },
  "Done last week": { status: ["done"], dateRange: [last7d, now] },
};

<div className="flex flex-col gap-3">
  <Select onValueChange={(name) => setValues(PRESETS[name] ?? {})}>
    <SelectTrigger><SelectValue placeholder="Apply preset…" /></SelectTrigger>
    <SelectContent>
      {Object.keys(PRESETS).map((n) => (
        <SelectItem key={n} value={n}>{n}</SelectItem>
      ))}
    </SelectContent>
  </Select>
  <FilterStack<Item> items={items} categories={CATEGORIES} values={values} onChange={setValues} />
</div>
```

The preset just replaces `values`; FilterStack picks up the new state via its controlled prop.

### Recipe 3 — Server-side filtering (predicate as no-op, fetch on values change)

```tsx
const [serverData, setServerData] = useState<Item[]>([]);

useEffect(() => {
  // debounce + fetch is yours
  fetch(`/api/items?` + serializeValues(values)).then(/* setServerData */);
}, [values]);

<FilterStack<Item>
  items={[]} // FilterStack doesn't filter; it only renders chrome + dispatches values
  categories={CATEGORIES.map((c) => ({
    ...c,
    predicate: () => true, // no-op; server is the filter
  }))}
  values={values}
  onChange={setValues}
/>
<ServerItemList items={serverData} />
```

Wasteful in the strict sense — the panel still walks an empty `items` array. v0.2's async predicate support will make this idiomatic. For now, the workaround is small.

### Recipe 4 — Read the filtered set without subscribing

If you want to compute the filtered list on demand (e.g., for an export button) rather than subscribing, derive it from `values` and `categories` directly:

```tsx
function exportFiltered(items: Item[], categories: FilterCategory<Item>[], values: Record<string, FilterValue>) {
  return items.filter((item) =>
    categories.every((c) => {
      const v = values[c.id];
      const isEmptyFn = c.isEmpty ?? defaultIsEmpty(c);
      return isEmptyFn(v) ? true : c.predicate(item, v);
    })
  );
}
```

`defaultIsEmpty` is re-exported from `@/components/filter-stack` for exactly this purpose.

### Recipe 5 — Gate a "Clear all" button outside the panel

The footer's clear-all already does this; if you want a second clear button elsewhere (e.g., in a top toolbar), wire it via the ref:

```tsx
const ref = useRef<FilterStackHandle>(null);
const [allEmpty, setAllEmpty] = useState(true);

// Recompute on values change — cheap because isEmpty is fast
useEffect(() => {
  setAllEmpty(ref.current?.isEmpty() ?? true);
}, [values]);

<Toolbar>
  <Button disabled={allEmpty} onClick={() => ref.current?.clearAll()}>Reset</Button>
</Toolbar>
```

### Recipe 6 — Custom checkbox renderer (override built-in look)

The `checkbox-list` body isn't slotted; if you genuinely need a different visual (chips? tag pills?), use the `custom` type and render your own widget. The trade-off is you lose the built-in solo-button + per-option ARIA + mode-toggle plumbing — you re-implement them at the host level.

```tsx
{
  id: "tags",
  type: "custom",
  label: "Tags",
  isEmpty: (v) => !Array.isArray(v) || v.length === 0,
  predicate: (item, value) => {
    const sel = (value as string[]) ?? [];
    return sel.length === 0 || sel.some((t) => item.tags.includes(t));
  },
  render: ({ value, onChange }) => (
    <TagPills value={value as string[] ?? []} onChange={onChange} options={tagOptions} />
  ),
}
```

Reach for this only when the built-in checkbox-list visual is genuinely wrong. For most cases, restyling the existing parts via Tailwind utilities on a wrapping `className` is enough.

## What ships in v0.2+

The roadmap (per description §3 + plan §11.2):

- **Built-in `range` and `date-range` types** — replace the most common `custom` slot uses.
- **Per-category collapsibles** — `collapsible: boolean` + `defaultExpanded?: boolean`. Becomes useful at 5+ sections.
- **Horizontal layout** — `direction?: "vertical" | "horizontal"` for top-bar filter strips with overflow drawer.
- **Async predicate support** — `(item, value) => boolean | Promise<boolean>` with built-in pending state per category.
- **Deep-equal change detection** for `onFilteredChange` — opt-in stricter mode that compares filtered set membership, not just reference.
- **Filter presets / saved sets** — possibly as a companion `<FilterStack.Presets>` component, possibly as a host concern.

All v0.2+ items are designed as additive — no breaking changes to the v0.1 API.

## Migration notes

- **From hand-rolled stacked checkboxes + a search box.** Move each filter into a `FilterCategory` with the right `type`. The hardest part is usually moving the global "any active?" + "clear all" logic — FilterStack does both for free; you can delete that code.
- **From a single `<Combobox>` with multi-select.** If your filter is one-axis, FilterStack is overkill; stay with the combobox. If you've grown to 2+ axes, lift each into a category.
- **From a render-prop filter library (e.g., react-table's column filters).** FilterStack is its own panel — the items live with the panel, not on a row. For data-table column filters, FilterStack will ship as the substrate in a future data-table release; until then, render-prop column filters and FilterStack-as-sidebar coexist.
- **From a v0.x earlier than 0.1** — there is no earlier version. v0.1 is the first ship.

If you're moving from a custom in-app filter component, the lift is usually:
1. Translate each filter to a category.
2. Replace your central "compute filtered" function with `onFilteredChange` (or keep it host-side via `useMemo` reading `values`).
3. Delete your "is anything active" + "clear all" code.
4. Wire up the schema once at module scope (or `useMemo` if it depends on props).
5. Keep your persistence layer (URL, localStorage) — it just wraps `values`/`onChange`.

## Reference

### Public exports

```ts
// from @/components/filter-stack
export { FilterStack, defaultIsEmpty, meta };
export type {
  FilterCategory,
  CheckboxListFilter,
  ToggleFilter,
  TextFilter,
  CustomFilter,
  CustomFilterRenderProps,
  FilterOption,
  FilterMode,
  FilterValue,
  FilterStackProps,
  FilterStackHandle,
};
```

### Props

| Prop | Type | Default | Notes |
|---|---|---|---|
| `items` | `ReadonlyArray<T>` | required | The full source array; FilterStack derives `filtered` from this. |
| `categories` | `ReadonlyArray<FilterCategory<T>>` | required | Schema. Hoist or memoize for stability. |
| `values` | `Record<string, FilterValue>` | required | Controlled state, keyed by `category.id`. Mode lives at `${id}__mode`. |
| `onChange` | `(values) => void` | required | Mandatory; FilterStack is pure-controlled. |
| `onFilteredChange` | `(filtered) => void` | undefined | Convenience — fires on referential change of the filtered array. |
| `showClearAll` | `boolean` | `true` | Toggle the footer clear-all button. |
| `clearAllLabel` | `string` | `"Clear all"` | Footer button label. |
| `ariaLabel` | `string` | undefined | `aria-label` on the root `<form>`. |
| `className` | `string` | undefined | Forwarded to root. |
| `ref` | `Ref<FilterStackHandle>` | undefined | React 19 ref-as-prop; preserves the `<T>` generic. |

### `FilterStackHandle`

| Method | Signature | Notes |
|---|---|---|
| `clearAll` | `() => void` | Cancels all in-flight text debounces, dispatches one `onChange` with values cleared (mode keys preserved). |
| `clear` | `(id: string) => void` | Per-category clear; cancels that category's text debounce if applicable. |
| `isEmpty` | `() => boolean` | True iff every category's `isEmpty(value)` returns true. |

### Built-in defaults

| Type | Default `isEmpty` | Required `isEmpty`? |
|---|---|---|
| `checkbox-list` | empty array | optional |
| `text` | empty string | optional |
| `toggle` | — | **required** |
| `custom` | — | **required** |

### Reserved id suffixes

`__mode` — used internally for mode storage on `checkbox-list` with `modeToggle: true`. Validation rejects any category id ending in this suffix. Exported as `RESERVED_SUFFIXES` from `lib/validate-schema.ts` for tooling.

### Dev-only checks

In non-production builds, FilterStack runs schema validation on every `categories` reference change and emits warnings/errors for: reserved-suffix collisions, duplicate category ids, `checkbox-list` with empty options, `defaultMode` set without `modeToggle: true`. It also tracks `categories` reference instability and warns after 5+ unstable renders. All checks are stripped from production bundles.

---

*End of guide. Pair with [filter-stack-procomp-description.md](filter-stack-procomp-description.md) for the *why* and [filter-stack-procomp-plan.md](filter-stack-procomp-plan.md) for the *how*.*
