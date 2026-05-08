# `properties-form` — Pro-component Guide (Stage 3)

> **Audience:** consumer using `<PropertiesForm />` to render typed read/edit forms over flat record values.
>
> **Companion docs:** [description](properties-form-procomp-description.md) (what & why), [plan](properties-form-procomp-plan.md) (how it's built).

---

## When to use PropertiesForm

- You have a typed record (`Record<string, unknown>` or stronger) and need a form over it
- The fields are ~6–30 in number, mostly the six built-in types (`string` / `number` / `boolean` / `date` / `select` / `textarea`)
- You want **layered permissions** — host predicate beats field declaration beats default-editable
- You want **sync validation** with first-error focus on submit failure
- You want **dirty tracking** with a counter (no comparison-by-value bugs)
- You want **read mode → edit mode** as a controlled or uncontrolled flip
- You're OK with the host owning persistence (we don't talk to your DB)

Examples that fit:
- Entity properties drawer in a graph-system app (paired with `detail-panel`)
- Settings panel for a single record (workspace settings, project settings, billing details)
- Inline edit surface inside a richer view (a card that flips between read-only summary and editable form)

---

## When NOT to use PropertiesForm

- **Multi-step / wizard forms.** `<PropertiesForm>` is one schema, one submit. Sequential pages need a different host.
- **Highly dynamic schemas** (fields appear / disappear faster than every couple of seconds). Schema instability triggers a dev-warning and degrades reducer performance. Stabilize first.
- **Async validation as a first-class need.** v0.1 is sync-only. If your fields need server-side uniqueness checks etc., either (a) validate on submit through `onSubmit` and return errors, or (b) wait for v0.2 which adds async per-field validation.
- **Repeating arrays / sub-records inline.** The schema is flat. Nested records flatten to dotted keys (use the exported `flatten` / `unflatten` helpers); deeply nested arrays-of-objects don't fit.
- **Document-style rich-text fields.** Use `<MarkdownEditor>` (or compose it via the `renderer` slot) for fields that need a real editor.
- **Form-level state outside our reducer.** If a host wants to drive every keystroke, the controlled `values` + `onChange` round-trip works but the form's internal reducer + dirty tracking is then redundant.

---

## The five-minute walkthrough

```tsx
"use client";

import { useState } from "react";
import { PropertiesForm, type PropertiesFormField } from "@/components/properties-form";

const schema: ReadonlyArray<PropertiesFormField> = [
  { key: "name",        type: "string",   label: "Name",        required: true },
  { key: "role",        type: "select",   label: "Role",
    options: [
      { value: "owner",  label: "Owner" },
      { value: "admin",  label: "Admin" },
      { value: "member", label: "Member" },
    ],
  },
  { key: "active",      type: "boolean",  label: "Active" },
  { key: "joinedAt",    type: "date",     label: "Joined" },
  { key: "bio",         type: "textarea", label: "Bio" },
];

export function MemberProperties({ initial }: { initial: Record<string, unknown> }) {
  const [values, setValues] = useState(initial);
  const [mode, setMode] = useState<"read" | "edit">("read");

  return (
    <PropertiesForm
      schema={schema}
      values={values}
      mode={mode}
      onModeChange={setMode}
      onChange={setValues}
      onSubmit={async (next) => {
        await api.updateMember(next);
        return { ok: true };
      }}
    />
  );
}
```

`mode === "read"` shows formatted values. `mode === "edit"` shows inputs. The toggle is the host's; the form just renders what mode says.

---

## The mental model

`<PropertiesForm>` is **schema → form → values → submit → result**. Internally:

1. **Schema is flat.** Each entry is a `PropertiesFormField` with a `key`, `type`, `label`, optional `validate`, optional `renderer`. Order of the schema is the render order.
2. **Values are flat.** `values: T extends Record<string, unknown>`. The form reads keys directly; nested objects must be flattened first via the exported `flatten` helper.
3. **Permissions are layered.** Three states (`editable` / `read-only` / `hidden`) resolved in order: host `resolvePermission(field, values)` predicate → field's declarative `permission` → default `"editable"`. Hidden means the row doesn't render at all.
4. **Validation runs in two layers.** Per-field `validate(value, allValues)` runs on change + blur + submit. Form-level `validate(values)` runs only on submit. First-error focus snaps to the first schema-order field whose error is set.
5. **Dirty tracking is counter-based.** Every `field-changed` action bumps `state.version`. `markClean()` snapshots `cleanVersion = version`. `isDirty()` returns `version !== cleanVersion`. No deep-equality bugs.
6. **Submit is async with a 200ms-delayed spinner.** `onSubmit` returns `Promise<SubmitResult>`; `aria-busy` flips on; the spinner fades in only if the submit takes longer than 200ms (no flash for fast submits).

The reducer is private; consumers see only the imperative handle (`isDirty`, `markClean`, `reset`, `focusField`, `submit`).

---

## Composition patterns

### Pattern 1: read-only display (no submit)

Pass `mode="read"` and don't supply `onSubmit`. The submit actions row hides automatically when `showSubmitActions={false}`.

```tsx
<PropertiesForm
  schema={memberSchema}
  values={member}
  mode="read"
  showSubmitActions={false}
/>
```

The form renders formatted field values (e.g. ISO dates → human dates, booleans → ✓/✗). No inputs.

### Pattern 2: layered permissions

Three layers, evaluated in order:

```tsx
<PropertiesForm
  schema={schema}
  values={values}
  resolvePermission={(field, values) => {
    // 1. Host predicate (highest priority — wins if it returns non-undefined)
    if (field.key === "billingEmail" && !canEditBilling()) return "read-only";
    if (field.key === "ownerId" && !isAdmin()) return "hidden";
    return undefined;  // fall through to field-declared permission
  }}
/>
```

The schema can also declare a permission per-field:

```tsx
{ key: "internalNotes", type: "textarea", label: "Internal notes", permission: "read-only" }
```

If neither layer returns a permission, the field is editable.

When a field is `read-only`, hovering shows a tooltip with `permissionReason` if provided:

```tsx
{ key: "ownerId", type: "string", label: "Owner ID", permission: "read-only",
  permissionReason: "Owner is set at workspace creation; contact support to change." }
```

### Pattern 3: per-field + form-level validation

Per-field runs on change / blur / submit:

```tsx
{
  key: "email",
  type: "string",
  label: "Email",
  validate: (v, all) => {
    const value = String(v ?? "").trim();
    if (!value) return "Email is required";
    if (!value.includes("@")) return "Invalid email format";
    return undefined;
  },
}
```

Form-level runs only on submit:

```tsx
<PropertiesForm
  schema={schema}
  values={values}
  validate={(values) => {
    const errors: Record<string, string> = {};
    if (values.endDate && values.startDate && values.endDate < values.startDate) {
      errors.endDate = "End date must be after start date";
    }
    return Object.keys(errors).length > 0 ? errors : undefined;
  }}
/>
```

Form-level runs second; per-field errors win when both fire on the same key.

### Pattern 4: custom field renderer (escape hatch for non-built-in types)

The 6 built-in types cover ~95% of forms. For the rest, supply `renderer`:

```tsx
import { useState } from "react";
import type { FieldRendererProps } from "@/components/properties-form";

function ColorRenderer({ value, onChange, mode, fieldId, errorId, error, disabled }: FieldRendererProps<string>) {
  if (mode === "read") {
    return <span className="inline-flex items-center gap-2"><span className="h-4 w-4 rounded" style={{ background: value }} />{value}</span>;
  }
  return (
    <input
      id={fieldId}
      type="color"
      value={value || "#000000"}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      aria-describedby={error ? errorId : undefined}
      aria-invalid={error ? "true" : undefined}
      className="h-9 w-16 cursor-pointer rounded border"
    />
  );
}

const schema: PropertiesFormField[] = [
  { key: "accentColor", type: "string", label: "Accent color", renderer: ColorRenderer },
];
```

The renderer must:
- Read `value` from props (controlled)
- Call `onChange` on every value change
- Honor `disabled` (true when field is read-only)
- Wire `id={fieldId}` and `aria-describedby={error ? errorId : undefined}` for screen-reader association

`type` is what the schema declares but the renderer takes over the rendering layer. It's per-field; built-in types are unaffected.

### Pattern 5: imperative handle for advanced flows

Pass a `ref` and call methods imperatively. Useful for parent-driven submit, focus management, or save-via-keyboard-shortcut.

```tsx
"use client";

import { useRef } from "react";
import { PropertiesForm, type PropertiesFormHandle } from "@/components/properties-form";

export function ParentDrivenForm({ schema, initial }: { ... }) {
  const ref = useRef<PropertiesFormHandle>(null);
  return (
    <div className="space-y-4">
      <PropertiesForm ref={ref} schema={schema} values={initial} showSubmitActions={false} />
      <div className="flex justify-between">
        <Button variant="ghost" onClick={() => ref.current?.reset()}>Discard changes</Button>
        <Button onClick={async () => {
          const result = await ref.current?.submit();
          if (result?.ok) toast({ title: "Saved" });
        }}>Save</Button>
      </div>
    </div>
  );
}
```

Available methods: `isDirty()`, `markClean()`, `reset()`, `focusField(key)`, `submit()`.

### Pattern 6: nested values via flatten / unflatten

For records with nested shape:

```tsx
import { flatten, unflatten, PropertiesForm } from "@/components/properties-form";

const initialNested = {
  profile: { name: "Aria", email: "aria@x.dev" },
  settings: { notifications: true },
};

// Flatten before passing to the form
const initial = flatten(initialNested);
// → { "profile.name": "Aria", "profile.email": "aria@x.dev", "settings.notifications": true }

const schema: PropertiesFormField[] = [
  { key: "profile.name",  type: "string",  label: "Name" },
  { key: "profile.email", type: "string",  label: "Email" },
  { key: "settings.notifications", type: "boolean", label: "Notifications" },
];

<PropertiesForm
  schema={schema}
  values={initial}
  onSubmit={async (flatValues) => {
    const nested = unflatten(flatValues);
    await api.updateProfile(nested);
    return { ok: true };
  }}
/>
```

The form treats `"profile.name"` as a single key; the dot-notation has no special meaning to the reducer. `flatten` / `unflatten` are pure utilities.

---

## Gotchas

### Schema reference must be stable

The schema array MUST keep a stable reference across renders. Re-creating it inline blows up the reducer's "schema instability" detector after 5 renders (development-only `console.warn`). Lift to module scope OR `useMemo` on stable deps:

```tsx
// ✓ Module scope (preferred for static schemas)
const SCHEMA: ReadonlyArray<PropertiesFormField> = [/* ... */];

// ✓ useMemo on truly-changing inputs
const schema = useMemo<ReadonlyArray<PropertiesFormField>>(() => buildSchema(featureFlags), [featureFlags]);

// ✗ Inline — works in repos with React Compiler memoizing literal arrays;
// breaks for NPM consumers without it
<PropertiesForm schema={[/* ... */]} ... />
```

This is the same footgun pattern as `data-table` columns, `entity-picker` items, `markdown-editor` candidates, `filter-stack` categories.

### `values` must be controlled (or memoized stable)

Pass a stable `values` object — re-creating it on every render bumps the reducer's `valuesRef`. Use `useState` (the form will mirror your state) or supply a memoized snapshot.

### Permission "hidden" removes the row entirely

A hidden field doesn't render its row. Tabbing skips it; screen readers don't announce it. If you need the row visible but disabled, use `"read-only"`.

### `permissionReason` only shows on `read-only`, not `hidden`

`hidden` means "you can't see this exists". A reason is meaningless for a hidden field. The tooltip only fires on read-only.

### `validate` is sync; throwing rejects to bubble

A throwing `validate` will surface as an unhandled error. Return a string for "this field has an error"; return `undefined` for "valid".

### `onSubmit` MUST return `SubmitResult`

```ts
type SubmitResult = { ok: boolean; errors?: Record<string, string> };
```

Returning `void` or `undefined` shows up as an unresolved promise — submit hangs forever. If your API call doesn't tell you success/failure, wrap it:

```tsx
onSubmit={async (values) => {
  try { await api.update(values); return { ok: true }; }
  catch (e) { return { ok: false, errors: { _form: String(e.message ?? "Save failed") } }; }
}}
```

The `_form` key (or any key not in the schema) lands as `state.formError` — rendered above the field list.

### `submit-attempted` flag is sticky

Once `submit()` runs, blurred-error suppression flips off. Errors show even on fields the user hasn't touched. There's no "reset to pristine" — call `reset()` (which also resets values) or `markClean()` (which keeps current values but resets dirtiness).

### Dev-only `process.env.NODE_ENV` warnings

Plan §12.5 #5 deliberately gates dev warnings with `process.env.NODE_ENV !== "production"`. Bundlers strip the dead branches in production builds, so runtime cost is zero. F-cross-08 (component-guide §7) explicitly allows this pattern as the project-wide standard.

### Bundle weight

The form imports 7 shadcn primitives (`button`, `input`, `select`, `switch`, `textarea`, `tooltip`, plus `react`-only deps). Total install ~25 KB before consumer-side cells. Lighter than a full form library; heavier than a hand-rolled `<form>`.

---

## Common operations cookbook

### Programmatically save via keyboard shortcut

```tsx
const formRef = useRef<PropertiesFormHandle>(null);
useEffect(() => {
  function onKey(e: KeyboardEvent) {
    if ((e.ctrlKey || e.metaKey) && e.key === "s") {
      e.preventDefault();
      formRef.current?.submit();
    }
  }
  window.addEventListener("keydown", onKey);
  return () => window.removeEventListener("keydown", onKey);
}, []);
```

### Block navigation when dirty

```tsx
useEffect(() => {
  function onBeforeUnload(e: BeforeUnloadEvent) {
    if (formRef.current?.isDirty()) {
      e.preventDefault();
      e.returnValue = "";
    }
  }
  window.addEventListener("beforeunload", onBeforeUnload);
  return () => window.removeEventListener("beforeunload", onBeforeUnload);
}, []);
```

### Focus a specific field after a submit failure

```tsx
const result = await formRef.current?.submit();
if (!result?.ok) {
  formRef.current?.focusField("billingEmail");  // override built-in first-error focus
}
```

The built-in first-error focus runs by default; calling `focusField` after submit failure overrides it.

### Conditional field visibility based on other field values

```tsx
<PropertiesForm
  schema={schema}
  values={values}
  resolvePermission={(field, values) => {
    if (field.key === "trialEndDate" && values.plan !== "trial") return "hidden";
    return undefined;
  }}
/>
```

`resolvePermission` runs on every render with the current `values`. `trialEndDate` appears/disappears as `plan` changes.

### Read + edit mode toggle with optimistic UI

```tsx
const [mode, setMode] = useState<"read" | "edit">("read");
const formRef = useRef<PropertiesFormHandle>(null);

return (
  <div>
    <PropertiesForm
      ref={formRef}
      schema={schema}
      values={values}
      mode={mode}
      onModeChange={setMode}
      onSubmit={async (next) => {
        const previous = values;
        setValues(next);  // optimistic
        const result = await api.save(next);
        if (!result.ok) setValues(previous);  // rollback
        return result;
      }}
    />
    {mode === "read" && <Button onClick={() => setMode("edit")}>Edit</Button>}
  </div>
);
```

---

## Known limitations / deferred to v0.2

- **Async per-field validation.** v0.1 sync-only. v0.2 will add `validateAsync(value, allValues): Promise<string | undefined>` + a debounce knob.
- **Field arrays / repeating sub-records.** Not in v0.1; flatten/unflatten covers shallow nesting only. v0.2+ may add an `array` field type.
- **i18n / locale-aware formatting.** Date / number formatting is the renderer's job today. v0.2 may add a `locale` prop.
- **Schema versioning.** No migration helpers from a prior schema's keys. Hand-roll if migrating saved values.
- **Conditional sub-schemas.** `resolvePermission` covers visibility; "show field B only if field A is X" with completely different sub-fields is best modeled by hosting two `<PropertiesForm>` instances and switching.

---

## Migration notes

This is the v0.1.0 component (description + plan retroactively reviewed at v0.1.1). No prior version to migrate from.

If you're moving from `react-hook-form`, the closest mapping:

| react-hook-form | properties-form |
|---|---|
| `useForm({ defaultValues })` | `useState(defaultValues)` + pass to `values` |
| `register("foo")` | schema entry `{ key: "foo", type: "..." }` |
| `formState.errors` | (no direct read; surface via `submit()` SubmitResult or imperative `focusField`) |
| `handleSubmit(onSubmit)` | `onSubmit={async (values) => ({ ok: true })}` |
| Resolver (zod / yup) | `validate(values)` form-level OR per-field `validate` on each schema entry |
| `formState.isDirty` | `formRef.current.isDirty()` |
| `reset()` | `formRef.current.reset()` |

The mental shift: react-hook-form is uncontrolled-by-default and tracks per-field state at the registration call site. `<PropertiesForm>` is controlled-by-default and tracks state at the schema level. Schemas are easier to serialize / version / generate from a backend type definition.

---

## Open follow-ups

- v0.2 async validation
- v0.2 maybe-conditional renderer wiring (today: register a renderer, it replaces the entire row's input area; tomorrow: layered renderers per-mode)
- A `validate-on-blur-only` opt-out for forms where keystroke-validation is too noisy
- Documented compose patterns with `detail-panel` (the canonical pairing)

---

## Reference

### Public exports

```ts
// from @/components/properties-form
export { PropertiesForm } from "./properties-form";
export { flatten, unflatten } from "./lib/flatten";
export type {
  FieldOption,
  FieldPermission,
  FieldRendererProps,
  FieldType,
  FormMode,
  PropertiesFormField,
  PropertiesFormHandle,
  PropertiesFormProps,
  SubmitResult,
} from "./types";
export { meta } from "./meta";
```

### Imperative handle

```ts
interface PropertiesFormHandle {
  isDirty(): boolean;
  markClean(): void;
  reset(): void;
  focusField(key: string): void;
  submit(): Promise<SubmitResult>;
}
```

### Install

```bash
pnpm dlx shadcn@latest add @ilinxa/properties-form
```

Then import from `@/components/properties-form`.

### Related

- `detail-panel` — the canonical inline-editing host for this form
- `entity-picker` — common companion for typed reference fields (use as a custom `renderer`)
- `markdown-editor` — heavy "rich-text field" replacement when `textarea` isn't enough
- `filter-stack` — sibling forms component for filter-bar composition
- `rich-card` — when the records you're editing are hierarchical (cards-of-fields), not flat
