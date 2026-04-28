# `entity-picker` — Pro-component Description

> **Status:** **signed off 2026-04-28.** Stage 2 (`entity-picker-procomp-plan.md`) authoring may begin.
> **Slug:** `entity-picker`
> **Category:** `forms`
> **Created:** 2026-04-28
> **Last updated:** 2026-04-28 (signed off; all 10 open questions resolved as recommended; no refinements on re-validation)
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

## 8. Resolved questions (locked on sign-off 2026-04-28)

All 10 questions resolved at sign-off. The recommendations below are the locked decisions for v0.1; Stage 2 (plan) builds against these. No refinements on re-validation. New questions surfacing during plan authoring land in a fresh `## 8.6 New open questions` section as needed.

1. **Single vs multi — locked: one component with `mode: "single" | "multi"` prop**, defaulting to `"single"`. Two components would duplicate trigger/dropdown/search/keyboard-nav code. Plan stage decides whether to use TypeScript discriminated union or function overloads for strict mode-aware value typing.

2. **`kind` field — locked: optional.** `showKindBadges?: boolean` defaults to `true` when any item has a kind, `false` otherwise. Hosts can override.

3. **Default match — locked: case-insensitive substring + `match` slot.** Plan stage specifies the locale-handling (no accent folding by default). Hosts wanting fuzzy plug in `fuse.js` via the slot.

4. **Open/close — locked: support both controlled and uncontrolled.** Default uncontrolled when neither `open` nor `onOpenChange` is supplied. Same precedence pattern as Radix Popover.

5. **Trigger UI default — locked: button-shaped trigger.** Search input lives inside the dropdown. Hosts wanting combobox-input pattern (typing opens dropdown) use `renderTrigger`.

6. **Multi-mode chip overflow — locked: wrap to multiple lines** in v0.1. `overflowMode: "wrap" | "scroll" | "collapse"` is an additive v0.2 prop if real consumers need it.

7. **Search debounce — locked: none in v0.1.** Local filtering on host-supplied `items` is cheap. Async fetch (v0.2) and virtualization (v0.2) handle large-list case differently.

8. **`value` shape — locked: full `T` (or `T[]` in multi).** Storing IDs would require lookup against `items`, which breaks for async sources. Storing entities is robust.

9. **Generic typing — locked: parameterized from v0.1**, defaulting to `T extends EntityLike = EntityLike`. Same answer as `properties-form` Q2 and `filter-stack` Q5.

10. **Render-trigger slot — locked: ctx includes `value`, `open`, and a forwarded ref.** Plan stage locks the ref-forwarding mechanism (`forwardRef` vs callback ref via ctx).

## 8.5 Plan-stage tightenings (surfaced during description review + re-validation)

These are NOT description-blocking, but plan authoring must address them:

1. **Mode-aware value typing mechanism (Q1).** Choose between: (a) discriminated union of `Props<T>` (verbose at call site, strict types); (b) function overloads for `EntityPicker` (compact at call site, strict types); (c) loose union `value: T | T[] | null` with consumer-side casting (simple but unsafe). Recommendation lean: function overloads.
2. **Default match locale handling (Q3).** Plan picks: case-insensitive via `String.toLowerCase()` (English-biased) vs `Intl.Collator` with `sensitivity: "accent"` (locale-aware, slower). Recommendation lean: `toLowerCase()` for v0.1; `Intl.Collator` upgrade is non-breaking.
3. **Multi-mode keyboard chip removal.** Plan locks: when input is empty and Backspace is pressed, the LAST chip is removed (not all). When input has text, Backspace edits text normally.
4. **Selection equality for change detection.** Plan locks: equality is by `item.id` (referential identity may differ for the "same" entity across renders if items are re-derived). `onChange` only fires when the id-set changes.
5. **Default empty-state copy.** Plan picks specific text: "No matches for '{query}'" vs "No matches found" (less i18n-fragile). Recommendation lean: parameterized via `renderEmpty` slot ctx; default copy is "No results."
6. **Trigger ref forwarding mechanism.** Plan picks: `forwardRef` (standard React; couples render-trigger to React 18+) vs callback ref via ctx (`(node: HTMLElement | null) => void`). Recommendation lean: callback ref via ctx — more flexible for custom triggers that aren't a single DOM node.

---

## 9. Sign-off checklist

- [x] Problem framing correct
- [x] Scope boundaries defensible (in / out)
- [x] Target consumers complete (force-graph linking-mode + group-membership editor + creation flow; properties-form custom field; generic reference fields)
- [x] API sketch covers the three example use cases
- [x] Single component with `mode` prop (Q1) confirmed
- [x] Success criteria measurable
- [x] Open questions §8 — all 10 resolved on sign-off; no refinements on re-validation

**Signed off 2026-04-28.** Stage 2 (`entity-picker-procomp-plan.md`) authoring may begin. The final Tier 1 description (`markdown-editor`) is now unblocked. Plan must build against the §8 locked decisions and address the §8.5 plan-stage tightenings, defining the file-by-file structure per the [component-guide.md anatomy](../../component-guide.md#5-anatomy-of-a-component-folder).
