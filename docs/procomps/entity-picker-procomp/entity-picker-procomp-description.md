# `entity-picker` — Pro-component Description

> **Status:** draft v0.1 — pending sign-off
> **Slug:** `entity-picker`
> **Category:** `forms`
> **Created:** 2026-04-28
> **Owner:** ilinxa team
> **Parent system:** [graph-system](../../systems/graph-system/graph-system-description.md) — Tier 1 (generic; no graph dependency)

This is Stage 1 of the [procomp gate](../README.md). It answers *should we build this at all, and what shape should it be?* It does NOT specify implementation — that's Stage 2 (`entity-picker-procomp-plan.md`).

The system-level constraints in [graph-system-description.md §8](../../systems/graph-system/graph-system-description.md) (decisions #25, #35, #37) are inherited as constraints; this doc does not re-litigate them.

---

## 1. Problem

Many UI surfaces need a searchable picker that selects from a heterogeneous list of typed entities:

- **Force-graph linking-mode UI**: pick a source/target endpoint that can be either a node OR a group; each result shows a kind badge so the user knows what they're picking
- **Force-graph group-membership editor**: pick which nodes to add to a group; results are nodes filtered by name
- **Force-graph creation flow**: pick existing nodes to connect a new edge to
- **Properties-form custom field**: a "related entity" field that picks from a typed list (e.g., "owner: pick a user")
- **Any reference field** in any future form

The shape repeats: dropdown trigger, search input that filters by label, list of typed results with optional kind badges, single or multi select, chip-style display when selected, empty state for no matches, "no items at all" state, keyboard navigation. Reimplementing this — especially the kind-badge variant for heterogeneous lists — is the kind of work that's been duplicated in half the projects we've worked on, with each implementation diverging on tiny details (where does the badge sit? does selection happen on click or on hover-then-click? does pressing Enter on first result work?).

In the graph-system specifically, the linking-mode UI must show **both nodes AND groups in the same dropdown** — the same picker handles heterogeneous endpoint types. The kind badge is the visual signal that resolves the ambiguity. Without a generic entity-picker that supports kind badges natively, force-graph would either reimplement this (reinforcing the reimplementation pattern) or ship a worse linking-mode UX.

**A reusable, kind-aware entity-picker closes this gap.** It is the substrate for any "search and pick from a typed list" UI: dropdown chrome, search filter, kind-badged result rows, single/multi selection, keyboard nav, ARIA wiring.

---

## 2. In scope (v0.1)

- **Searchable typed list.** Host provides an array of entities each with `{ id, label, kind?, ...metadata }`; component renders them in a searchable dropdown.
- **Kind badges (optional)**: when entities carry a `kind` field, results render with a small kind-badge prefix. Host supplies the kind→label/color mapping.
- **Single OR multi select** via a `mode: "single" | "multi"` prop. In single mode, selection closes the dropdown; in multi mode, selection toggles and dropdown stays open. Selected entities render as chips (multi) or a single-line value (single) when collapsed.
- **Search input** that filters by entity `label` (case-insensitive substring match by default). Host can override match logic via a `match(item, query)` predicate.
- **Open/close state** controlled by the host (`open` + `onOpenChange`) for hosts that need imperative control, OR managed internally if those props are omitted.
- **Selection state** controlled (`value` + `onChange`); pure-controlled like properties-form / filter-stack.
- **Keyboard navigation**: ↑/↓ moves through results, Enter selects, Esc closes, Backspace removes the last chip in multi mode, Tab moves focus in/out without losing selection.
- **Empty states**: distinct UI for "no items match the search" (e.g., "No matches for '{query}'") vs. "no items provided" (e.g., "No entities to pick from").
- **ARIA contract**: `combobox` pattern per WAI-ARIA 1.2 — `role="combobox"` on the input, `role="listbox"` on the dropdown, `aria-expanded`, `aria-activedescendant`, `aria-multiselectable` on the listbox in multi mode.
- **Custom row renderer slot** — host can supply `renderItem(item)` for richer rows (e.g., entity icon + label + kind badge + secondary metadata).
- **Default trigger UI**: a button-shaped trigger showing the current selection (single) or chip cluster (multi); host can override via `renderTrigger`.
- **Generic typing**: `EntityPicker<T extends EntityLike>` parameterized; `EntityLike = { id: string; label: string; kind?: string }`.
- **Built on shadcn primitives**: `Popover` (dropdown chrome) + `Command` (list + search). Decision #37 design tokens applied.

---

## 3. Out of scope (deferred)

- **Async loading / paginated fetch.** v0.1 expects all items provided up front. v0.2 ships `loadItems(query, page)` for async. Hosts with large lists pre-filter or use the custom item renderer to indicate "loading."
- **Virtualization for huge lists.** v0.1 renders all visible items; if the list is large (>500), perf may degrade. v0.2 adds opt-in virtualization (likely via `@tanstack/react-virtual`, already a registry dep from rich-card).
- **"Create new" affordance** (e.g., "+ Create '{query}'" inline in the dropdown). Useful pattern but not a v0.1 must-have. v0.2 adds via `onCreate?: (query) => Promise<T>` prop.
- **Multi-section grouping** (e.g., "Nodes" header / list, "Groups" header / list). v0.1 ships flat list with kind badges; sectioning is v0.2.
- **Recently-selected memory** across mounts. Out of scope; host's responsibility (use localStorage, prepend recent items to the `items` prop).
- **Drag-to-reorder** in multi mode. Selection order is the order picked; reordering is not supported in v0.1.
- **Free-text values** (the picker ALSO accepts a string that doesn't match any entity). Out of scope; entity-picker is for picking entities, not for arbitrary text.
- **Custom search behavior** (fuzzy match, ranking, scoring). v0.1 ships case-insensitive substring; richer search via the `match` predicate slot.

---

## 4. Target consumers

In dependency order:

1. **`force-graph` v0.3** (Tier 2) — the **linking-mode UI**: when the user is creating an edge, the picker shows nodes AND groups (heterogeneous; kind badges resolve the ambiguity). Single-select mode.
2. **`force-graph` v0.4 group-membership editor** — when editing a group, the picker shows nodes (filtered by label search). Multi-select mode.
3. **`force-graph` v0.3 CreationPanel** — picking source/target for a new edge. Single-select mode.
4. **`properties-form` reference fields** (via custom renderer slot) — a properties-form field of type "custom" can render an entity-picker for "owner: User" type fields.
5. **Generic reference-field UIs** anywhere in the system or future docs site.

entity-picker has zero graph dependency. This is per [system decision #35](../../systems/graph-system/graph-system-description.md): Tier 1 components are independent — none imports another. force-graph and properties-form would each *consume* entity-picker without entity-picker importing them.

---

## 5. Rough API sketch

```ts
interface EntityLike {
  id: string;
  label: string;
  kind?: string;
  // host's additional metadata is preserved via generic
}

interface KindMeta {
  label: string;                              // shown in the badge text
  color?: string;                             // CSS variable name or OKLCH value
}

interface EntityPickerProps<T extends EntityLike = EntityLike> {
  items: ReadonlyArray<T>;
  mode?: "single" | "multi";                  // default: "single"

  value: T | T[] | null;                      // T for single, T[] for multi, null for empty
  onChange: (value: T | T[] | null) => void;

  // Search
  match?: (item: T, query: string) => boolean;  // default: case-insensitive label substring
  placeholder?: string;                       // search input placeholder; default "Search…"

  // Open/close state (controlled or uncontrolled)
  open?: boolean;
  onOpenChange?: (open: boolean) => void;

  // Kind badges
  kinds?: Record<string, KindMeta>;           // keyed by item.kind value
  showKindBadges?: boolean;                   // default: true if any item has a kind

  // Slots
  renderItem?: (item: T, ctx: { selected: boolean; query: string }) => ReactNode;
  renderTrigger?: (ctx: { value: T | T[] | null; open: boolean }) => ReactNode;
  renderEmpty?: (ctx: { query: string; itemCount: number }) => ReactNode;

  // UX details
  disabled?: boolean;
  triggerLabel?: string;                      // a11y label for the trigger button
  className?: string;
}

interface EntityPickerHandle {
  focus(): void;                              // focus the trigger
  open(): void;
  close(): void;
  clear(): void;                              // calls onChange(null) (single) or onChange([]) (multi)
}
```

---

## 6. Example usages

### 6.1 Linking-mode UI (force-graph v0.3, heterogeneous endpoint picker)

```tsx
const linkingItems: ReadonlyArray<{ id: string; label: string; kind: "node" | "group" }> = [
  ...nodes.map((n) => ({ id: n.id, label: n.label, kind: "node" as const })),
  ...groups.map((g) => ({ id: g.id, label: g.name, kind: "group" as const })),
];

<EntityPicker
  items={linkingItems}
  mode="single"
  value={target}
  onChange={setTarget}
  kinds={{
    node: { label: "node", color: "var(--chart-1)" },
    group: { label: "group", color: "var(--chart-2)" },
  }}
  placeholder="Pick endpoint…"
  triggerLabel="Edge target"
/>
```

The same picker handles both kinds; the badge resolves the visual ambiguity. This is the showcase case.

### 6.2 Group-membership editor (force-graph v0.4, multi-select)

```tsx
<EntityPicker
  items={allNodes}
  mode="multi"
  value={selectedMembers}
  onChange={setSelectedMembers}
  placeholder="Add nodes to group…"
  triggerLabel="Group members"
/>
```

Single-kind list (all nodes); kind badges hidden by default since no item has a `kind` field.

### 6.3 Properties-form custom field (referencing another entity)

```tsx
<PropertiesForm
  schema={[
    {
      key: "owner",
      type: "custom",
      label: "Owner",
      renderer: ({ value, onChange }) => (
        <EntityPicker
          items={users}
          mode="single"
          value={value as User | null}
          onChange={onChange}
          renderItem={(user) => (
            <div className="flex items-center gap-2">
              <Avatar src={user.avatar} />
              <span>{user.label}</span>
              <span className="text-xs text-muted-foreground">{user.email}</span>
            </div>
          )}
          placeholder="Select owner…"
        />
      ),
    },
  ]}
  values={values}
  mode="edit"
  onChange={setValues}
/>
```

Demonstrates the integration with `properties-form`'s `custom` field type and the `renderItem` slot.

---

## 7. Success criteria

The component is "done" for v0.1 when:

1. **Used by force-graph v0.3 linking-mode UI** with no API additions or workarounds. Kind badges resolve node-vs-group ambiguity in the heterogeneous picker (§6.1).
2. **Used by force-graph v0.4 group-membership editor** with no API additions or workarounds. Multi-select with chip display works (§6.2).
3. **`properties-form` custom-field integration tested** (§6.3) — entity-picker slots cleanly into `properties-form` via the `renderer` field on a `custom` field type.
4. **Keyboard navigation passes** ARIA combobox pattern: ↑/↓/Enter/Esc/Tab/Backspace work correctly in both single and multi modes.
5. **A11y audit passes**: screen-reader announces selection, `aria-expanded` on the trigger, `aria-activedescendant` on the input during keyboard nav, focus management correct on open/close.
6. **Custom row + custom trigger slots** tested with at least one non-default rendering (e.g., the avatar-decorated row in §6.3).
7. **Empty states distinguish** "no matches" from "no items" — both render with appropriate copy.
8. **Bundle weight ≤ 8KB** (minified + gzipped) — entity-picker is built on shadcn primitives (`Popover` + `Command`) which are already in the bundle; entity-picker adds only the kind-badge + selection layer.
9. **`tsc + lint + build` clean** with no React Compiler warnings.
10. **Demo at `/components/entity-picker`** demonstrates: single mode, multi mode, kind badges, custom row renderer, custom trigger renderer, no-items empty state, no-matches empty state.

---

## 8. Open questions

These need answers before Stage 2 (plan) authoring begins:

1. **Single vs multi: one component with `mode` prop, or two components.** Spec proposes one with `mode`. Alternative: `<SingleEntityPicker>` and `<MultiEntityPicker>` as separate exports. Recommendation: **one component with `mode` prop**, defaulting to `"single"`. The internal implementation differs (selection storage shape: `T | null` vs `T[]`), but the UX shell is shared. Two components would duplicate the trigger / dropdown / search / keyboard-nav code. The `mode` discriminator is small.

2. **`kind` field shape: optional discriminator vs required for heterogeneous lists.** Spec makes it optional. Alternative: require `kind` always (forcing single-kind lists to use a placeholder kind). Recommendation: **optional**. Single-kind lists (group-membership editor) shouldn't be forced to invent a kind; the badge visibility is auto-determined by `showKindBadges?: boolean` (default true if any item has a kind, false otherwise).

3. **Match function: case-insensitive substring vs fuzzy.** Spec ships substring as default; host can override via `match` slot. Alternative: ship fuzzy by default (better UX for typos but slower for large lists). Recommendation: **substring default + `match` slot.** Substring is fast, predictable, and works for the graph-system's labels. Hosts wanting fuzzy can plug in `fuse.js` or similar via the slot. Adding fuzzy as a built-in adds dep weight.

4. **Open/close: controlled vs uncontrolled.** Spec proposes both (props optional → uncontrolled internal state; supplied → controlled). Same pattern as Radix Popover. Recommendation: **support both, default uncontrolled** when neither prop is supplied. Standard React pattern.

5. **Trigger UI default: button vs input.** Spec proposes a button-shaped trigger that, when clicked, opens a dropdown with a search-input inside. Alternative: combobox pattern where the trigger IS the search input (typing opens the dropdown automatically). Recommendation: **button-shaped trigger** — clearer affordance for "click me to pick"; the search input lives inside the dropdown. Consistent with shadcn Combobox conventions. Hosts wanting input-as-trigger can use `renderTrigger`.

6. **Multi-mode chip overflow handling.** With many selected items, chips overflow. How to handle? (a) wrap to multiple lines, (b) horizontal scroll, (c) "+N more" collapsed indicator past N items. Recommendation: **wrap to multiple lines** in v0.1 (simplest, works for up to ~10-15 chips). v0.2 can add an `overflowMode: "wrap" | "scroll" | "collapse"` prop if real consumers want it.

7. **Search debounce.** Should search filter on every keystroke or debounce? With local items (no async fetch), filtering is fast — no debounce needed. With huge lists (>1000), filtering on every keystroke might lag. Recommendation: **no debounce in v0.1.** Local filtering is cheap; if perf becomes an issue at scale, plan-stage adds optional `searchDebounceMs` prop. v0.2 async loading would handle the large-list case differently.

8. **`value` shape in multi mode: array of `T` or array of IDs.** Spec proposes `value: T | T[] | null`. Alternative: `value: string | string[] | null` (just IDs; component looks up `T` from `items`). Recommendation: **array of `T`**. Hosts almost always have the `T` already (they constructed `items`); using IDs forces the component to look up entities, which fails if `items` is async. Storing `T` is more robust.

9. **Generic typing strictness.** Same as properties-form Q2 / filter-stack Q5. Recommendation: **parameterized generic from v0.1** — `EntityPicker<T extends EntityLike = EntityLike>`. Same answer.

10. **Render-trigger slot signature.** Spec proposes `renderTrigger(ctx)`. The `ctx` should include: current `value`, current `open` state, ref to forward (so the trigger can be focused). Recommendation: **include `ref`-forwarding in the ctx** so custom triggers can be focused via `EntityPickerHandle.focus()`. Plan locks the ref-forwarding mechanism (`forwardRef` vs callback ref).

---

## 9. Sign-off checklist

- [ ] Problem framing correct?
- [ ] Scope boundaries defensible (in / out)?
- [ ] Target consumers complete?
- [ ] API sketch covers the three example use cases?
- [ ] Single component with `mode` prop (Q1) — right call?
- [ ] Success criteria measurable?
- [ ] Open questions §8 — recommendations acceptable, or any need re-discussion?

Sign-off enables Stage 2 (`entity-picker-procomp-plan.md`) authoring and unblocks the final Tier 1 description (`markdown-editor`). Plan must lock the open questions and define the file-by-file structure per the [component-guide.md anatomy](../../component-guide.md#5-anatomy-of-a-component-folder).
