# `properties-form` — Pro-component Description

> **Status:** **signed off 2026-04-28.** Stage 2 (`properties-form-procomp-plan.md`) authoring may begin.
> **Slug:** `properties-form`
> **Category:** `forms`
> **Created:** 2026-04-28
> **Last updated:** 2026-04-28 (signed off; Q2 + Q5 revised on review; all 10 open questions resolved)
> **Owner:** ilinxa team
> **Parent system:** [graph-system](../../systems/graph-system/graph-system-description.md) — Tier 1 (generic; no graph dependency)

This is Stage 1 of the [procomp gate](../README.md). It answers *should we build this at all, and what shape should it be?* It does NOT specify implementation — that's Stage 2 (`properties-form-procomp-plan.md`).

The system-level constraints in [graph-system-description.md §8](../../systems/graph-system/graph-system-description.md) (decisions #6, #17, #23, #25, #35, #37) are inherited as constraints; this doc does not re-litigate them.

---

## 1. Problem

Many UI surfaces in this library (and in any application built with it) need to render an entity's properties as an **editable form**:

- A graph node's label, type, color, position (force-graph)
- A graph edge's type, direction, label
- User annotations on a read-only system-origin entity (the "hybrid documenter" use case)
- A rich-card flat field's key, type, value (eventual rich-card refactor)
- A settings panel with typed knobs

Today, every site that needs this pattern reimplements: layout, type-aware rendering (string vs number vs date vs select), per-field validation, dirty tracking, edit-mode toggle, save/cancel actions, error display, and ARIA wiring. Reimplementations diverge on small but visible details — *when does dirty state reset? does Cancel revert or stay dirty? do disabled fields explain why?* — which produces UX inconsistency across the product.

Worse: in the graph-system, the same form must render two **fundamentally different editability shapes** on the same entity: a system-origin node's canonical fields (read-only) sit side-by-side with its user-owned annotations (editable). Reimplementing that mixed-permission rendering for each call site is a known rough patch — see `force-graph` v0.3 design notes.

**A reusable, schema-driven properties editor closes this gap.** It is the single substrate for "render and optionally edit a typed key-value entity," handling layout, type-aware inputs, validation, dirty state, and per-field permissions in one place. Consumers describe the schema; the component handles everything mechanical.

---

## 2. In scope (v0.1)

- **Schema-driven rendering.** Host provides a list of field definitions (key, type, label, validation, permission); component renders typed inputs in the order given.
- **Six built-in field types**: `string`, `number`, `boolean`, `date`, `select`, `textarea`. (See §8 open questions for date-picker library.)
- **Read mode vs Edit mode** — toggleable via prop. Read mode shows formatted values (numbers right-aligned mono, booleans as icons, dates as ISO formatted) — same flat-field treatment as rich-card. Edit mode renders typed inputs.
- **Per-field permission** with three levels: `editable`, `read-only`, `hidden`. Declarative on the schema; can be overridden per-render via a `resolvePermission` predicate (parallel to rich-card's resolver shape).
- **Sync per-field validation** via a `validate(value, allValues)` callback returning an error string or `undefined`. Errors render inline below the field with proper ARIA association.
- **Sync form-level validation** via a `validate(values)` callback returning a `Record<key, string>` of errors.
- **Dirty tracking** — counter-based (every commit increments; `markClean` snapshots), exposed via imperative ref. Save button auto-disables when not dirty.
- **Custom field renderer slot** — host can supply a `renderer` per field for non-built-in types or for visual customization (e.g., a color picker, an entity-picker for relation fields).
- **Save / Cancel actions** rendered by default; can be hidden so the host owns the action surface (e.g., when the form is inside a detail-panel that has its own action bar).
- **Submission flow**: `onSubmit(values) => Promise<{ ok, errors? }>`. While the promise is pending, fields are disabled and a loading indicator renders. On `ok: false` with `errors`, the relevant fields surface inline errors and stay editable.
- **Permission UX**: read-only fields show their value but not an input; hovering surfaces a tooltip explaining why (e.g., "this is a canonical field on a system-origin node — annotations only"). Hidden fields are omitted from the DOM entirely.
- **ARIA contract**: every field has `<label>` association, `aria-required` where applicable, `aria-invalid` + `aria-describedby` linking errors, focus management on Save (first error gets focus).
- **Design system compliance** per [system decision #37](../../systems/graph-system/graph-system-description.md): OKLCH tokens, Onest + JetBrains Mono fonts, no hard-coded colors.

---

## 3. Out of scope (deferred)

- **Async validation** (e.g., "is this slug already taken?"). v0.2.
- **Multi-step / wizard forms.** Separate component if needed.
- **Conditional fields** ("show field B only if field A has value X"). v0.2 — would be added via a `visible` predicate alongside `permission`.
- **Field grouping / sections / collapsibles.** v0.2; v0.1 ships flat vertical layout.
- **Two-column / grid layouts.** v0.2 via a layout prop.
- **File uploads.** Out of scope; separate component if/when needed.
- **Slash commands or rich-text fields.** Out of scope — see `markdown-editor` for prose editing.
- **Schema generation from runtime data** (introspect a JSON object, infer fields). Host's responsibility.
- **Form persistence / autosave.** Host's responsibility via `onChange`.
- **Cross-field linking** ("when X changes, recompute Y"). Host can do this via `onChange` then setting `values` externally.

The v0.1 surface is intentionally narrow. v0.2 additions are all *additive* — none would change the v0.1 API, only extend it.

---

## 4. Target consumers

In dependency order:

1. **`detail-panel`** (Tier 1) — slots `properties-form` as the editable content for selected entities. The single most important integration; properties-form's inline-edit affordance must compose cleanly with detail-panel's read/edit toggle. (System decision #6 locks "DetailPanel Edit is inline".)
2. **`force-graph` v0.3** (Tier 2) — composes `detail-panel` (which composes `properties-form`) for editing graph nodes and edges. Must support the **mixed-permission case**: a system-origin node where canonical fields are read-only and user annotations are editable side-by-side.
3. **Tier 3 graph-system page** — the creation flow uses `properties-form` to build new user-origin nodes / edges before submitting.
4. **rich-card eventual refactor** — rich-card's flat-field editing currently uses bespoke parts (`field-edit.tsx`, `card-title-edit.tsx`). When properties-form is mature, rich-card may consume it — but that's a future migration, not a v0.1 concern.
5. **Settings forms throughout the docs site** — opportunistic; would consume properties-form for any "edit these typed knobs" UI.

Critically, **properties-form has zero graph dependency**. It is a generic form component that happens to be useful in the graph system. This is per [system decision #35](../../systems/graph-system/graph-system-description.md): Tier 1 components are independent.

---

## 5. Rough API sketch

Three primary props plus optional ergonomic ones. Final signatures locked in Stage 2.

```ts
type FieldType = "string" | "number" | "boolean" | "date" | "select" | "textarea";
type FieldPermission = "editable" | "read-only" | "hidden";

interface PropertiesFormField {
  key: string;
  type: FieldType;
  label: string;
  description?: string;          // helper text below label
  required?: boolean;
  options?: ReadonlyArray<{ value: string; label: string }>;  // select only
  permission?: FieldPermission;  // default: "editable"
  permissionReason?: string;     // tooltip for read-only / hidden
  validate?: (value: unknown, allValues: Record<string, unknown>) => string | undefined;
  renderer?: ComponentType<FieldRendererProps>;  // slot
}

interface PropertiesFormProps<T extends Record<string, unknown> = Record<string, unknown>> {
  schema: ReadonlyArray<PropertiesFormField>;
  values: T;
  mode?: "read" | "edit";        // default: "read"

  // change + commit lifecycle
  onChange?: (values: T) => void;
  onSubmit?: (values: T) => Promise<{ ok: boolean; errors?: Record<string, string> }>;
  onCancel?: () => void;
  onModeChange?: (mode: "read" | "edit") => void;

  // permission + validation overrides
  resolvePermission?: (field: PropertiesFormField, values: T) => FieldPermission;
  validate?: (values: T) => Record<string, string> | undefined;  // form-level

  // action surface control
  showSubmitActions?: boolean;   // default: true
}

interface PropertiesFormHandle {
  isDirty(): boolean;
  markClean(): void;
  reset(): void;                 // restores original values, clears errors
  focusField(key: string): void;
  submit(): Promise<void>;       // imperative trigger for hosts that hide default actions
}
```

A consumer that just wants to render and edit a flat object hits the happy path with three props: `schema`, `values`, `onSubmit`.

---

## 6. Example usages

### 6.1 Editing a user-origin graph node (force-graph v0.3 → detail-panel slot)

```tsx
<PropertiesForm
  schema={[
    { key: "label", type: "string", label: "Label", required: true },
    { key: "nodeTypeId", type: "select", label: "Type", options: nodeTypeOptions, required: true },
    { key: "icon", type: "string", label: "Icon", description: "Lucide icon name" },
    { key: "pinned", type: "boolean", label: "Pin position" },
  ]}
  values={selectedNode}
  mode="edit"
  onSubmit={async (values) => {
    const result = await applyMutation({ type: "updateNode", id: selectedNode.id, patch: values });
    return result.ok ? { ok: true } : { ok: false, errors: { label: result.error?.message ?? "" } };
  }}
/>
```

All fields editable. Standard happy path.

### 6.2 Annotating a system-origin graph node (mixed permissions — the showcase case)

```tsx
<PropertiesForm
  schema={[
    // Canonical fields from the DB — read-only
    { key: "label", type: "string", label: "Label", permission: "read-only",
      permissionReason: "Canonical field from Kuzu — DB-managed" },
    { key: "schemaType", type: "string", label: "Type", permission: "read-only",
      permissionReason: "DB schema; not editable from this UI" },
    // User annotations — editable
    { key: "annotations.priority", type: "select", label: "Priority",
      options: [{ value: "low", label: "Low" }, { value: "high", label: "High" }] },
    { key: "annotations.notes", type: "textarea", label: "Notes" },
    { key: "annotations.owner", type: "string", label: "Owner" },
  ]}
  values={flattenForForm(selectedSystemNode)}
  mode="edit"
  onSubmit={async (values) => {
    // host translates `annotations.priority` etc. back into setAnnotation mutations
    const ops = unflattenAnnotations(values);
    const results = await Promise.all(ops.map(applyMutation));
    return results.every(r => r.ok) ? { ok: true } : { ok: false, errors: collectErrors(results) };
  }}
/>
```

The same form renders two visually distinct field clusters. The `permissionReason` tooltip explains why some fields are read-only. This is the case that drove the component's design.

### 6.3 Settings panel form (no graph involvement)

```tsx
<PropertiesForm
  schema={[
    { key: "enableNotifications", type: "boolean", label: "Enable notifications" },
    { key: "threshold", type: "number", label: "Alert threshold",
      validate: (v) => typeof v === "number" && v >= 0 ? undefined : "Must be non-negative" },
    { key: "theme", type: "select", label: "Theme",
      options: [{ value: "dark", label: "Dark" }, { value: "light", label: "Light" }] },
  ]}
  values={settings}
  mode="edit"
  onChange={setSettings}
  onSubmit={async (values) => {
    await persistSettings(values);
    return { ok: true };
  }}
/>
```

Demonstrates the component's value far outside the graph system — generic form pattern.

---

## 7. Success criteria

The component is "done" for v0.1 when:

1. **Used by `detail-panel` and `force-graph` v0.3** with zero API additions or workarounds. If detail-panel needs a hook into properties-form that isn't on the public API, the API was wrong.
2. **The mixed-permission showcase (§6.2) works** end-to-end: read-only fields render with tooltips, editable fields commit through `onSubmit`, dirty tracking reflects only the editable subset.
3. **Custom field renderer slot tested** with at least one non-built-in type (e.g., a color picker integrated by the host).
4. **Validation surfaces correctly**: per-field error inline, form-level error in a summary at the top, focus moves to the first error on failed submit.
5. **Dirty tracking is reliable**: `markClean` snapshots, mode toggle preserves dirty state correctly, Save button enable/disable matches expectation.
6. **Accessibility audit passes**: keyboard navigation through all fields, screen-reader announces field labels + errors + permission tooltips, focus management on submit / cancel.
7. **Bundle weight ≤ 30KB** (minified + gzipped) — no heavy form library imports for v0.1; we own the implementation.
8. **`tsc + lint + build` clean** with no React Compiler warnings.
9. **Demo at `/components/properties-form`** demonstrates: editable form, read-only form, mixed-permission form, custom renderer, validation errors.

---

## 8. Resolved questions (locked on sign-off 2026-04-28)

All 10 questions resolved at sign-off. The recommendations below are now the locked decisions for v0.1; Stage 2 (plan) builds against these. New questions surfacing during plan authoring land in a fresh `## 8.5 New open questions` section as needed.

1. **Date picker library — locked: native `<input type="date">` v0.1.** Zero cost, accessible by default. Visual inconsistency with shadcn-styled adjacent fields is real but acceptable for v0.1. v0.2 upgrades to shadcn `Calendar` (~17KB via `react-day-picker`) without API change.

2. **Generic typing — locked: parameterized generic from v0.1, defaulting to loose record.** API: `function PropertiesForm<T extends Record<string, unknown> = Record<string, unknown>>(props: PropertiesFormProps<T>)`. Loose default works for casual consumers; opt-in narrow `<PropertiesForm<MyEntity>>` gives type safety. Revised from the original "loose now, narrow later" recommendation because deferring would force every consumer to opt in later — shipping the generic from v0.1 is a cheap one-time win with zero migration cost.

3. **Nested-key handling — locked: opaque keys; host flattens/unflattens at the boundary.** properties-form treats keys as strings, no path resolution. Plan stage may ship a `flattenObject(o, depth)` utility helper alongside the component. If two source fields collapse to the same flat key, host must rename — document this constraint.

4. **Hidden vs read-only — locked: 3-state model.** `hidden` omits the field from DOM entirely; `read-only` renders with disabled visual + tooltip from `permissionReason` + `aria-readonly`. No "muted but interactive" middle state; custom `renderer` slot covers edge cases.

5. **Form-level error rendering — locked: inline + summary, hardcoded, no opt-out prop in v0.1.** Inline errors next to fields (a11y best practice); summary at top with anchor links (helps long forms). Revised from the original "configurable prop" recommendation — YAGNI for v0.1; add the prop in v0.2 if real complaints surface (additive, non-breaking).

6. **Controlled vs uncontrolled — locked: pure controlled.** Host owns `values`; `onChange` is required when `mode === "edit"`. **Enforcement is a runtime dev-only `console.error`, not a compile-time discriminated union** — type pain isn't worth it. Future uncontrolled support is additive (`defaultValues` prop) if ever needed.

7. **Submission feedback — locked: disable fields + Save spinner during pending.** `aria-busy="true"` on the form during async `onSubmit`. Plan stage adds a 200ms delay before showing the spinner to avoid flicker on fast submissions.

8. **`reset()` behavior — locked: calls `onChange(cleanSnapshot)`, clears all errors, dirty resets to false.** `cleanSnapshot` is the values at last `markClean()` (or mount-time if never called). If `onChange` is omitted (read mode), `reset()` is a no-op.

9. **Default `mode` — locked: `"read"`.** Reasoning: edit mode requires `onChange` to be useful, so a consumer writing `<PropertiesForm schema values />` without `onChange` should NOT get a broken edit-mode form. Read mode is the "useful with minimum config" default. Edit mode requires deliberate setup (`mode="edit"` + `onChange` together).

10. **State management library — locked: build from scratch.** Form state surface is genuinely simple (flat values + per-field errors + dirty version counter) — ~200-400 LoC. RHF (~10KB) would make properties-form unnecessarily heavy; `markdown-editor` (~150KB CodeMirror) is already the heaviest pro-component. We own a11y wiring directly. Re-evaluation trigger: if v0.2+ pushes the from-scratch implementation past ~800 LoC, reconsider RHF migration.

## 8.5 Plan-stage tightenings (surfaced during description review)

These are NOT description-blocking, but plan authoring must address them:

1. **`PropertiesFormHandle.submit()` return type** — should mirror `onSubmit`'s `Promise<{ ok, errors? }>`, not `Promise<void>`. The imperative submit must give hosts the same result shape they'd get from the default Save action.
2. **`FieldRendererProps` shape** — referenced in §5 but not defined; predictable: `{ value, onChange, field, allValues, mode, error, disabled }`. Plan locks the exact shape.
3. **Array / multiselect fields** — not in the 6 built-in types in v0.1. Hosts use the `renderer` slot (e.g., for tags input, multi-entity-picker). Plan must explicitly call this out with an example.
4. **`focusField(key)` on hidden/read-only field** — behavior currently undefined. Plan picks: (a) no-op, (b) focus the read-only display, (c) throw a dev warning. Recommendation lean: (a) silent no-op for hidden, (b) focus the read-display for read-only.

---

## 9. Sign-off checklist

- [x] Problem framing correct
- [x] Scope boundaries defensible (in / out)
- [x] Target consumers complete
- [x] API sketch covers the three example use cases
- [x] Success criteria measurable
- [x] Open questions §8 — all 10 resolved on sign-off (Q2 + Q5 revised on review)

**Signed off 2026-04-28.** Stage 2 (`properties-form-procomp-plan.md`) authoring may begin. Plan must build against the §8 locked decisions and address the §8.5 plan-stage tightenings, defining the file-by-file structure per the [component-guide.md anatomy](../../component-guide.md#5-anatomy-of-a-component-folder).
