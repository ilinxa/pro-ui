# `entity-picker` — Pro-component Guide (Stage 3)

> **Audience:** consumer using `<EntityPicker />` to pick one or more typed entities from a searchable list.
>
> **Version:** v0.2.0 (2026-10-26) — server search (controlled `query`, `filterItems={false}`, loading / error / Load more), `labels`, `locale`.
>
> **Companion docs:** [description](entity-picker-procomp-description.md) (what & why), [plan](entity-picker-procomp-plan.md) (how it's built).

---

## When to use EntityPicker

- You have a list of typed records (anything with `{ id, label, kind? }`) and the user needs to pick one or more
- You want **searchable** with case-insensitive substring matching out of the box (and overridable per-app)
- You want **kind badges** when items mix categories (Person, Project, Tag)
- You want **mode-aware value typing** — `<EntityPicker<User> mode="single">` types `value: User | null`; `<EntityPicker<User> mode="multi">` types `value: User[]`
- You want **chip cluster** for multi-mode with per-chip remove + Backspace-on-empty-search-removes-last-chip
- You want **slot-able rendering** — custom item rows, custom triggers, custom empty states
- You're OK with the host owning the list (we don't fetch; you pass `items`)

Examples that fit:
- Assignee picker (multi) on a task / issue
- Owner field (single) on a project
- Tag picker (multi) where tags have a kind/group taxonomy
- Reference field on a graph node where each candidate is a typed entity
- Linked-record picker inside `properties-form` as a custom renderer

---

## When NOT to use EntityPicker

- **Pure free-text input.** This is a picker — values must come from `items`. For arbitrary string entry, use a plain `<Input>` or wait for a future `combobox-with-create` host.
- **Huge client-side lists.** The popover renders every item it is given (no virtualization). For large sets, search on the server: controlled `query` + `filterItems={false}` + `hasMore` / `onLoadMore` (see [Server search](#server-search-you-own-the-fetch)).
- **Hierarchical / grouped lists.** The list is flat. If you need section headers, render them via `renderItem` returning `null` plus parent-rendered separators — but it's smoother to use shadcn's `Command` directly.
- **Filterable on multiple axes.** `match` is one predicate. For multi-axis (kind + label + tag) filter UIs, consider `filter-panel` instead.
- **Inline-editable picker** (type-and-create). Out of scope; create-on-the-fly UIs need a different host.

---

## The five-minute walkthrough

```tsx
"use client";

import { useState, useMemo } from "react";
import { EntityPicker, type EntityLike } from "@/components/entity-picker";

type User = EntityLike & { email: string };

// Items must have stable reference. Lift to module scope OR useMemo.
const USERS: ReadonlyArray<User> = [
  { id: "u1", label: "Aria Montgomery",  email: "aria@x.dev",   kind: "owner"  },
  { id: "u2", label: "Bilal Hashemi",     email: "bilal@x.dev",  kind: "admin"  },
  { id: "u3", label: "Camille Okafor",    email: "camille@x.dev", kind: "member" },
];

export function AssigneeField() {
  const [assignees, setAssignees] = useState<User[]>([]);
  return (
    <EntityPicker<User>
      mode="multi"
      items={USERS}
      value={assignees}
      onChange={setAssignees}
      labels={{ searchPlaceholder: "Search members…" }}
      kinds={{
        owner:  { label: "Owner",  color: "var(--chart-1)" },
        admin:  { label: "Admin",  color: "var(--chart-2)" },
        member: { label: "Member" },
      }}
    />
  );
}
```

That's the multi case. Single mode swaps two lines:

```tsx
<EntityPicker<User>
  mode="single"
  value={owner}                  // User | null (not User[])
  onChange={setOwner}            // (value: User | null) => void
  // ...
/>
```

The mode determines the typing of `value` + `onChange` via TypeScript function overloads — TS errors if you pass `User[]` to a `mode="single"` picker.

---

## The mental model

`<EntityPicker>` is **items + value + onChange**, with rendering layered on top. Internally:

1. **Trigger** — a real `PopoverTrigger` `<button>` rendered as a full-field overlay beneath a click-transparent chip layer (chips' remove `<button>`s sit above it, so there's no button-in-button nesting) — clicked or Enter-keyed opens the popover. Built on shadcn `Popover`. *(v0.1.2, F-cross-13: replaces the former `<div role="button">` + `asChild` shape, which broke Base-UI consumers.)*
2. **Popover content** — shadcn `Command` (cmdk) for search + filtered items, with a default item renderer or a consumer-provided one.
3. **Selection equality is id-based** — `onChange` only fires when the SET of selected IDs changes, not on identity-only changes (a re-fetched user with a different object reference but same id is treated as the same selection).
4. **Multi mode** — selected items render as chips above (or alongside) the trigger. Each chip has a remove button. Backspace on an empty search input removes the last chip.
5. **`mode` is the discriminant** for the function-overloaded value type. Single = `T | null`, multi = `T[]`. The mode can't flip at runtime (it would break the typing contract).
6. **Custom triggers + items + empty states** — three render slots. Default renderers cover the common case; slots are escape hatches for richer UIs.

The component is generic: `<EntityPicker<Project>>` types every callback's argument as `Project`, including `renderItem`, `renderTrigger`, `match`.

---

## Composition patterns

### Pattern 1: single picker (the simplest case)

```tsx
const [owner, setOwner] = useState<User | null>(null);

<EntityPicker<User>
  mode="single"
  items={USERS}
  value={owner}
  onChange={setOwner}
  labels={{ triggerPlaceholder: "Pick an owner" }}
/>
```

`value` is `User | null` (not `User`); a null value shows `labels.triggerPlaceholder` (default "Select…") in the
trigger. `labels.searchPlaceholder` is the search input's placeholder.

### Pattern 2: multi picker with kind badges

```tsx
const [tags, setTags] = useState<Tag[]>([]);

<EntityPicker<Tag>
  mode="multi"
  items={ALL_TAGS}
  value={tags}
  onChange={setTags}
  kinds={{
    feature: { label: "Feature", color: "var(--chart-1)" },
    bug:     { label: "Bug",     color: "var(--destructive)" },
    chore:   { label: "Chore",   color: "var(--muted-foreground)" },
  }}
  showKindBadges
/>
```

The `kind` field on each `Tag` keys into `kinds`. The picker renders the badge inline next to the label in the popover and inside each chip.

### Pattern 3: custom search semantics

By default `match` is case-insensitive substring on `label`. Override per-app:

```tsx
<EntityPicker<Project>
  mode="single"
  items={PROJECTS}
  value={project}
  onChange={setProject}
  match={(item, query) => {
    const q = query.toLowerCase();
    return (
      item.label.toLowerCase().includes(q) ||
      (item.description ?? "").toLowerCase().includes(q) ||
      (item.code ?? "").toLowerCase().includes(q)
    );
  }}
/>
```

The picker calls `match` for every item against the current query. Return `true` to include in the popover list.

### Pattern 4: custom item renderer (rich rows)

Built-in rendering is a single-line label + optional kind badge. For richer rows (avatar, multi-line, metadata), pass `renderItem`:

```tsx
<EntityPicker<User>
  mode="single"
  items={USERS}
  value={owner}
  onChange={setOwner}
  renderItem={(user, ctx) => (
    <div className="flex items-center gap-3">
      <Avatar className="h-6 w-6">
        <AvatarImage src={user.avatarUrl} />
        <AvatarFallback>{user.label[0]}</AvatarFallback>
      </Avatar>
      <div className="flex flex-col">
        <span className={cn("text-sm", ctx.selected && "font-medium")}>{user.label}</span>
        <span className="text-xs text-muted-foreground">{user.email}</span>
      </div>
      {ctx.selected && <Check className="ml-auto h-4 w-4" />}
    </div>
  )}
/>
```

`ctx.selected` lets the renderer style the active item; `ctx.query` is the live search string (use to highlight matched substrings).

### Pattern 5: custom trigger

Default trigger is a full-field overlay `<button>` showing chips (multi) or label (single). For a custom shape (e.g. an icon button that opens the popover), pass `renderTrigger`:

```tsx
<EntityPicker<User>
  mode="single"
  items={USERS}
  value={owner}
  onChange={setOwner}
  renderTrigger={({ value, open, triggerRef }) => (
    <button
      ref={triggerRef}
      type="button"
      className={cn("h-9 w-9 rounded-full", open && "ring-2 ring-primary")}
    >
      {value
        ? <Avatar><AvatarImage src={value.avatarUrl} /></Avatar>
        : <UserPlus className="h-4 w-4" />}
    </button>
  )}
/>
```

The `triggerRef` MUST be attached to the focusable element — this is what `EntityPickerHandle.focus()` targets. Without it, `focus()` silently does nothing (no warning).

Since v0.1.2 (F-cross-13) your node is no longer slot-merged into the Popover trigger — the picker wraps it in an `inline-flex max-w-full` span that owns open-on-click, with a hidden anchor button providing popover positioning. Three consequences:

- **Wire popup a11y yourself**: nothing injects `aria-haspopup` / `aria-expanded` into your node anymore — set `aria-haspopup="listbox"` and `aria-expanded={open}` from the render context (the example above should add them for screen-reader users).
- **No `data-[state=open]:` styling** on your node — branch on the `open` flag instead (as the example's `ring-2` does).
- **Full-width triggers** need their own width (`w-full` works against the wrapper's `max-w-full`, but the wrapper itself is `inline-flex` — give your node an explicit width if it must stretch).

### Pattern 6: imperative handle

Pass a `ref` for parent-driven control:

```tsx
"use client";

import { useEffect, useRef } from "react";
import { EntityPicker, type EntityPickerHandle } from "@/components/entity-picker";

export function CommandPaletteAssignee() {
  const ref = useRef<EntityPickerHandle>(null);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === "/") {
        e.preventDefault();
        ref.current?.open();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return <EntityPicker ref={ref} mode="multi" items={USERS} value={selected} onChange={setSelected} />;
}
```

Available methods: `focus()`, `open()`, `close()`, `clear()`.

---

## Gotchas

### `items` reference must be stable

Inline-creating `items={[{...}, {...}]}` re-creates the array each render. Effects:

- The popover's filter cache busts every render
- `onChange` can fire false-positive even though the SET of ids hasn't changed (the picker compares by id, but if the items array re-creates the picker can lose track of which "instance" of an item is selected)

Always lift to module scope OR memoize:

```tsx
// ✓ Module scope
const USERS: ReadonlyArray<User> = [/* ... */];

// ✓ useMemo
const items = useMemo(() => filterByVisibility(allUsers, viewerRole), [allUsers, viewerRole]);

// ✗ Inline (works in this repo via React Compiler; breaks for NPM consumers)
<EntityPicker items={[/* ... */]} ... />
```

Same footgun pattern as `data-table` columns, `properties-form` schemas, `markdown-editor` candidates, `filter-panel` categories.

### `mode` is fixed at the call site

You can't switch from `mode="single"` to `mode="multi"` between renders — the `value` type changes, so React would see a value-shape change that the picker isn't built to recover from. If you need both, render two distinct `<EntityPicker>` instances and conditionally show one.

### `value` shape MUST match `mode`

TypeScript catches the mismatch via function overloads. At runtime, passing `User[]` to a `mode="single"` picker (or `User | null` to `mode="multi"`) crashes when the picker tries to read selected ids. Trust the types.

### `triggerRef` in custom triggers is mandatory

If you use `renderTrigger` and forget to attach `triggerRef`, the imperative `focus()` silently does nothing — there is no warning in any environment. Always attach it to your focusable root element (the `<button>` / `<div role="button">` / etc.).

### The default trigger is a full-field overlay `<button>`

Multi-mode chips have their own remove `<button>`s, and nesting `<button>` inside `<button>` is invalid HTML — so the field surface is a plain `<div>` fully covered by an absolutely-positioned real `PopoverTrigger` `<button>`, with the chip layer painting above it (click-transparent except each chip's remove button). The overlay carries the keyboard behavior (Enter / Space / ArrowDown open) and the aria wiring (`aria-haspopup="listbox"`, `aria-expanded`, `aria-controls`). *(v0.1.2, F-cross-13: replaces the `<div role="button">` + `asChild` shape, which broke Base-UI consumers.)*

### Selection equality is by id

`onChange` only fires when `selectedIds = new Set(value.map(v => v.id))` differs from the prior set. If you re-fetch users from the server with the same ids but new object references, the picker correctly does NOT fire `onChange` — your selection is stable.

### Backspace-on-empty removes the LAST selected chip

In multi mode, pressing Backspace while the search input is empty removes the most recently selected item. This is a discoverable UX shortcut; it doesn't have a button. If your users find it surprising, document it in your app's help.

### `Command` (cmdk) bundles ~7 KB

The picker depends on shadcn's `Command` primitive (cmdk-based). Total install adds ~7 KB minified. cmdk handles a11y wiring + keyboard nav (↑/↓/Enter/Esc) — saves you reimplementing.

### Dev-only `process.env.NODE_ENV` warnings

Plan §12.5 #5 explicitly locks `process.env.NODE_ENV !== "production"` as the dev-warn gate. Bundlers strip the dead branches. F-cross-08 sweep-wide rule allows this pattern; entity-picker plan §12.5 #5 is the canonical citation.

---

## Common operations cookbook

### Pre-select a value via initial state

```tsx
const [assignees, setAssignees] = useState<User[]>([USERS[0]]);  // pre-selected first user
<EntityPicker mode="multi" items={USERS} value={assignees} onChange={setAssignees} />
```

### Programmatically clear selection

```tsx
const ref = useRef<EntityPickerHandle>(null);
<>
  <EntityPicker ref={ref} mode="multi" items={USERS} value={selected} onChange={setSelected} />
  <Button variant="ghost" onClick={() => ref.current?.clear()}>Clear all</Button>
</>
```

`clear()` resets to `null` (single) or `[]` (multi) and fires `onChange` when something was selected.

### Use as a form field via properties-form custom renderer

```tsx
import type { FieldRendererProps } from "@/components/properties-form";
import { EntityPicker, type EntityLike } from "@/components/entity-picker";

function UserPickerRenderer({ value, onChange, mode, disabled }: FieldRendererProps<string | null>) {
  const selected = USERS.find((u) => u.id === value) ?? null;
  return (
    <EntityPicker<typeof USERS[number]>
      mode="single"
      items={USERS}
      value={selected}
      onChange={(next) => onChange(next?.id ?? null)}
      disabled={disabled}
    />
  );
}

const schema: PropertiesFormField[] = [
  { key: "ownerId", type: "string", label: "Owner", renderer: UserPickerRenderer },
];
```

The form stores the id (string); the picker shows the entity. Two-way conversion happens inside the renderer.

### Server search (you own the fetch)

The picker never fetches. You own the query, the request and the results; the picker renders what you pass.

```tsx
const [query, setQuery] = useState("");
const [items, setItems] = useState<User[]>([]);
const [hasMore, setHasMore] = useState(false);
const [loading, setLoading] = useState(false);
const [error, setError] = useState<string | null>(null);
const [attempt, setAttempt] = useState(0);

useEffect(() => {
  const ctrl = new AbortController(); // your stale-response guard
  setLoading(true);
  setError(null);
  api.searchUsers({ q: query, page: 1, signal: ctrl.signal })
    .then((r) => { setItems(r.items); setHasMore(r.hasMore); })
    .catch((e) => { if (!ctrl.signal.aborted) setError(e.message); })
    .finally(() => { if (!ctrl.signal.aborted) setLoading(false); });
  return () => ctrl.abort();
}, [query, attempt]);

<EntityPicker
  mode="multi"
  items={items}
  value={selected}
  onChange={setSelected}
  query={query}
  onQueryChange={(q) => setQuery(q)} // reason: "input" while typing, "reset" ("") when the popover closes
  filterItems={false}                 // render items as given; match is not used
  loading={loading}
  error={error ?? false}              // true → labels.error; a string is shown as is
  onRetry={() => setAttempt((n) => n + 1)}
  hasMore={hasMore}
  onLoadMore={loadNextPage}
  loadingMore={loadingMore}
/>
```

- `query` wins every render. Closing the popover calls `onQueryChange("", "reset")` once. Without `query` the picker
  keeps its own search and clears it on close, as before.
- Precedence: loading > error > empty. Loading with rows keeps the rows and adds a loading row; `aria-busy` is on the
  list while loading. Retry renders only when you pass `onRetry`. `renderLoading({ query, itemCount })` and
  `renderError({ message, query, onRetry })` replace the default rows.
- "Load more" is a button after the list, rendered only with both `hasMore` and `onLoadMore`; it keeps the popover open
  and ignores presses while `loadingMore` (`aria-disabled`, showing `labels.loading`; it stays focusable so keyboard focus
  isn't lost). Status rows, the server-mode empty row and Load more sit below the list, outside it; Enter / Space on
  them never selects a row.
- When loading settles while the popover is open, `labels.resultsCount` is announced once to screen readers (not per
  keystroke, not on an error). With client filtering it counts the rows that match.
- With `filterItems={false}` the highlight goes back to the first row when the result ids change. Selected chips stay
  even when their items are not in the current results (they render from `value`).

### Labels and locale

```tsx
<EntityPicker
  locale="tr" // the default match folds case with Turkish rules: "istanbul" finds "İstanbul"
  labels={{
    searchPlaceholder: "Ara…",
    searchLabel: "Kişi ara",
    triggerPlaceholder: "Seçin…",
    removeChip: (label) => `${label} kaldır`,
    nothingToPick: "Seçilecek bir şey yok",
    noResults: "Sonuç yok",
    loading: "Yükleniyor…",
    error: "Bir şeyler ters gitti",
    retry: "Tekrar dene",
    loadMore: "Daha fazla yükle",
    resultsCount: (count, formatted) => `${formatted} sonuç`,
    listLabel: "Öneriler",
    selectedState: "seçili",
  }}
  …
/>
```

Every key is optional; `undefined` keeps the default (`defaultEntityPickerLabels`). The English defaults are the text
the picker showed before 0.2.0. `listLabel` names the result list (default "Suggestions") and `selectedState` is
read out for chosen rows. `resultsCount` gets the count and the count formatted for `locale` (default `"en"`).
`placeholder` and `triggerLabel` still work and win over `searchPlaceholder` / `triggerPlaceholder`; they are
deprecated. Without `locale` matching uses plain `toLowerCase()`, as before.

The popover renders in a portal, outside your layout, so it cannot inherit `dir`. It reads the trigger's direction after the
trigger mounts; pass `dir="rtl"` / `"ltr"` to set it explicitly — and pass it if your app switches direction at runtime
without remounting, or if a custom trigger doesn't attach `triggerRef`.

### Custom empty state

```tsx
<EntityPicker
  mode="single"
  items={USERS}
  value={selected}
  onChange={setSelected}
  renderEmpty={({ query, itemCount }) => (
    itemCount === 0
      ? <p className="p-4 text-sm text-muted-foreground">Loading members…</p>
      : <p className="p-4 text-sm text-muted-foreground">No members match "{query}".</p>
  )}
/>
```

`itemCount` is the source-list size (zero before load); `query` is the current search string.

---

## Known limitations

- **No mode flip at runtime.** Locked at the call site.
- **Fetching is yours.** No built-in loader, abort or stale-response guard — keep that in your data layer.
- **Selected items missing from the current results can't be unticked in the list.** In multi mode remove the chip; in
  single mode use the handle's `clear()`.
- **No virtualization.** Render budget ~500 items in the popover. Past that, filter `items` upstream.
- **No "create new" affordance.** Out of scope; would need a separate `combobox-with-create` host.
- **Single trigger style** for the default. The `renderTrigger` slot covers visual customization; the underlying focus model + a11y wiring is fixed.

---

## Migration notes

**0.1.x → 0.2.0** is additive: without the new props the picker renders, filters and reads as before. Two accessibility
additions change the open markup slightly: the result list has an explicit name ("Suggestions", which cmdk already gave
it) and chosen rows carry a hidden "selected". `placeholder` / `triggerLabel` are deprecated in favour of
`labels.searchPlaceholder` / `labels.triggerPlaceholder`. If you used `match={() => true}` for server results, switch to
`filterItems={false}` + `query`.

If migrating from `react-select`, the closest mapping:

| react-select | entity-picker |
|---|---|
| `options` | `items` |
| `value` (with `getOptionValue`) | `value` (typed as `T \| null` or `T[]`; uses `id` for equality) |
| `onChange` | `onChange` (mode-aware typing) |
| `isMulti` | `mode="multi"` (and value typing flips) |
| `formatOptionLabel` | `renderItem` |
| `components.ValueContainer` | `renderTrigger` (more limited; trigger only) |
| `noOptionsMessage` | `renderEmpty` |

The mental shift: react-select is uncontrolled-by-default with deep customization slots; entity-picker is controlled-by-default with three named slots and a tighter API surface.

---

## Open follow-ups

- Not implemented: a `groupBy` prop for hierarchical popover lists
- Compose-with-properties-form recipe documented + tested as a sweep-tracker entry
- Integration with `markdown-editor`'s wikilink autocomplete (different code paths today; future shared substrate possible)

---

## Reference

### Public exports

```ts
// from @/components/entity-picker
export { EntityPicker } from "./entity-picker";
export { defaultEntityPickerLabels } from "./types";
export type {
  CommonPickerProps,
  EntityLike,
  EntityPickerHandle,
  EntityPickerLabels,
  EntityPickerProps,
  KindMeta,
  MultiPickerProps,
  PickerMode,
  RenderEmptyContext,
  RenderErrorContext,
  RenderItemContext,
  RenderLoadingContext,
  RenderTriggerContext,
  SinglePickerProps,
} from "./types";
```

### Imperative handle

```ts
interface EntityPickerHandle {
  focus(): void;
  open(): void;
  close(): void;
  clear(): void;
}
```

### Install

```bash
pnpm dlx shadcn@latest add @ilinxa/entity-picker
```

Then import from `@/components/entity-picker`.

### Related

- `properties-form` — the form host; entity-picker is a common custom-renderer for typed reference fields
- `filter-panel` — when you need filter-shaped picker UIs (multi-axis filters, query strings)
- `detail-panel` — the canonical inline-editing host that pairs picker fields with properties-form
- `markdown-editor` — when the picker target is a referenced doc, consider the wikilink pattern as an alternative
