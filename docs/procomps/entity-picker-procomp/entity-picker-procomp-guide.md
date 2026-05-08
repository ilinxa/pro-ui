# `entity-picker` — Pro-component Guide (Stage 3)

> **Audience:** consumer using `<EntityPicker />` to pick one or more typed entities from a searchable list.
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
- **Async-loaded items > 5000.** v0.1 renders all items in the popover (no virtualization). For large lists, paginate at the source (filter `items` upstream by query) — the picker stays consumer-controlled.
- **Hierarchical / grouped lists.** v0.1 is flat. If you need section headers, render them via `renderItem` returning `null` plus parent-rendered separators — but it's smoother to use shadcn's `Command` directly.
- **Filterable on multiple axes.** `match` is one predicate. For multi-axis (kind + label + tag) filter UIs, consider `filter-stack` instead.
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
      placeholder="Search members…"
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

1. **Trigger** — a `<div role="button">` (not a `<button>`; chips need to be focusable inside) — clicked or Enter-keyed opens the popover. Built on shadcn `Popover`.
2. **Popover content** — shadcn `Command` (cmdk) for search + filtered items, with a default item renderer or a consumer-provided one.
3. **Selection equality is id-based** — `onChange` only fires when the SET of selected IDs changes, not on identity-only changes (a re-fetched user with a different object reference but same id is treated as the same selection).
4. **Multi mode** — selected items render as chips above (or alongside) the trigger. Each chip has a remove button. Backspace on an empty search input removes the last chip.
5. **`mode` is the discriminant** for the function-overloaded value type. Single = `T | null`, multi = `T[]`. v0.1 doesn't allow mode-flipping at runtime (would break the typing contract).
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
  placeholder="Pick an owner"
/>
```

`value` is `User | null` (not `User`); a null value renders the placeholder in the trigger.

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

Default trigger is a `<div role="button">` showing chips (multi) or label (single). For a custom shape (e.g. an icon button that opens the popover), pass `renderTrigger`:

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

The `triggerRef` MUST be attached to the focusable element — this is what `EntityPickerHandle.focus()` targets. Without it, `focus()` silently no-ops (dev-only `console.warn`).

### Pattern 6: imperative handle

Pass a `ref` for parent-driven control:

```tsx
"use client";

import { useRef } from "react";
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

Same footgun pattern as `data-table` columns, `properties-form` schemas, `markdown-editor` candidates, `filter-stack` categories.

### `mode` is fixed at the call site

You can't switch from `mode="single"` to `mode="multi"` between renders — the `value` type changes, so React would see a value-shape change that the picker isn't built to recover from. If you need both, render two distinct `<EntityPicker>` instances and conditionally show one.

### `value` shape MUST match `mode`

TypeScript catches the mismatch via function overloads. At runtime, passing `User[]` to a `mode="single"` picker (or `User | null` to `mode="multi"`) crashes when the picker tries to read selected ids. Trust the types.

### `triggerRef` in custom triggers is mandatory

If you use `renderTrigger` and forget to attach `triggerRef`, the imperative `focus()` silently no-ops. In development, you get a one-time `console.warn`; in production, no signal. Always attach it to your focusable root element (the `<button>` / `<div role="button">` / etc.).

### The default trigger is `<div role="button">`, not `<button>`

This is deliberate — multi-mode chips have their own remove `<button>`s, and nesting `<button>` inside `<button>` is invalid HTML. The `<div role="button">` is keyboard-accessible (Enter / Space open the popover), focusable (`tabIndex={0}`), and screen-reader-announced as a button.

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

`clear()` resets to `null` (single) or `[]` (multi) and fires `onChange`.

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

### Async items (load after user types ≥ 2 chars)

```tsx
const [query, setQuery] = useState("");
const [items, setItems] = useState<User[]>([]);

useEffect(() => {
  if (query.length < 2) { setItems([]); return; }
  let cancelled = false;
  api.searchUsers(query).then((results) => {
    if (!cancelled) setItems(results);
  });
  return () => { cancelled = true; };
}, [query]);

<EntityPicker
  mode="single"
  items={items}
  value={selected}
  onChange={setSelected}
  // The picker calls match(item, query) per item; we want it to bypass that and trust our pre-filtered items
  match={() => true}
  // Wire the query to our fetcher via renderEmpty's ctx OR via cmdk's onValueChange directly... requires shadcn Command escape hatch
/>
```

> **Note:** v0.1 doesn't expose a public `query` prop. Async items work but you don't have direct access to the search string. v0.2 may add `value`/`onValueChange` for the search input. For now, pre-load `items` or use a wide enough match function.

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

## Known limitations / deferred to v0.2

- **No mode flip at runtime.** Locked at the call site.
- **No virtualization.** Render budget ~500 items in the popover. Past that, filter `items` upstream.
- **No public `query` / `onQueryChange` for async items.** v0.2 candidate.
- **No "create new" affordance.** Out of scope; would need a separate `combobox-with-create` host.
- **Single trigger style** for the default. The `renderTrigger` slot covers visual customization; the underlying focus model + a11y wiring is fixed.

---

## Migration notes

This is the v0.1.0 component. No prior version.

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

- v0.2 public `query` / `onQueryChange` for async-load patterns
- v0.2 maybe a `groupBy` prop for hierarchical popover lists
- Compose-with-properties-form recipe documented + tested as a sweep-tracker entry
- Integration with `markdown-editor`'s wikilink autocomplete (different code paths today; future shared substrate possible)

---

## Reference

### Public exports

```ts
// from @/components/entity-picker
export { EntityPicker } from "./entity-picker";
export type {
  CommonPickerProps,
  EntityLike,
  EntityPickerHandle,
  EntityPickerProps,
  KindMeta,
  MultiPickerProps,
  PickerMode,
  RenderEmptyContext,
  RenderItemContext,
  RenderTriggerContext,
  SinglePickerProps,
} from "./types";
export { meta } from "./meta";
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
- `filter-stack` — when you need filter-shaped picker UIs (multi-axis filters, query strings)
- `detail-panel` — the canonical inline-editing host that pairs picker fields with properties-form
- `markdown-editor` — when the picker target is a referenced doc, consider the wikilink pattern as an alternative
