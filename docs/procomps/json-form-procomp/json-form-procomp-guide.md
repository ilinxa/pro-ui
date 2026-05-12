# json-form — consumer guide

> Stage 3: how to use it.
>
> Component lives at [`src/registry/components/forms/json-form/`](../../../src/registry/components/forms/json-form/).
>
> Schema-driven form renderer. RHF v7 + zod v4 substrate; 24 built-in field types; extensible renderer registry; conditional + computed fields; standalone parts for fully-headless layouts.

## What ships in v0.1.0

- **24 built-in field types** across 5 families — text (×7), choice (×6), date/time (×4), rich/composite (`code` / `slider` / `rating`), special (`computed` / `hidden` / `section` / `divider`).
- **Conditional logic** — 11-operator Condition DSL (`equals` / `notEquals` / `in` / `notIn` / `matches` / `truthy` / `greaterThan` / `lessThan` / `all` / `any` / `not`) plus function escape hatch. Covers `visibleWhen` / `enabledWhen` / `requiredWhen`.
- **Computed fields** — pure `expression: '{firstName} {lastName}'` interpolation OR `compute: (args) => unknown` function. Both deps-tracked.
- **Extensible renderer registry** — spread `defaultJsonFormRegistry` and add entries. Form-level `renderField` slot intercepts every field if you need surgery.
- **Standalone parts** — `<JsonFormField>` / `<JsonFormSubmitButton>` / `<JsonFormResetButton>` / `<JsonFormErrorSummary>` / `<JsonFormHeader>` / `<JsonFormFieldWrapper>`. Pair with `<JsonFormProvider>` + `useJsonForm()` for fully-headless layouts.
- **Imperative handle** — `submit / reset / setValue / getValue / setError / clearErrors / trigger / focus / isDirty / isValid / isSubmitting`. Wire via `<JsonForm ref={...}>`.
- **Headless factory** — `useJsonForm(schema, options)` returns `{ form, zodSchema, fieldList, isValid, isSubmitting, handle }`.
- **Cross-registry dep on `@ilinxa/code-block`** — the `code` field renderer wraps it, lazy-loaded via `React.lazy` so the CodeMirror chunk only ships when a form contains a `code` field.

## Install

```bash
pnpm dlx shadcn@latest add @ilinxa/json-form
```

This pulls the sealed-folder source AND auto-installs the npm dependencies (`react-hook-form@^7.75.0`, `@hookform/resolvers@^5.2.2`, `zod@^4.4.3`, `lucide-react@^1.11.0`) AND chain-installs `@ilinxa/code-block`.

The `@ilinxa/json-form-fixtures` sibling adds the 6 fixture schemas + `mockFetchSchema` async helper. Skip if you have your own schemas.

## Quick start

```tsx
"use client";

import { JsonForm, type FormSchema } from "@/components/json-form";

const schema: FormSchema = {
  meta: { title: "Create account" },
  fields: [
    { name: "email", type: "email", label: "Email", validators: { required: true } },
    { name: "password", type: "password", label: "Password", validators: { required: true, minLength: 8 } },
  ],
};

export function Signup() {
  return (
    <JsonForm
      schema={schema}
      onSubmit={({ values }) => console.log(values)}
    />
  );
}
```

## Field DSL — at a glance

```ts
interface FieldDefinition {
  name: string;            // required for every type, even section/divider
  type: FieldType;         // 24 built-ins + consumer types
  label?: string;
  description?: string;    // helper text below label
  placeholder?: string;
  defaultValue?: unknown;

  // declarative validators (compiled to Zod)
  validators?: {
    required?: boolean | string;
    min?: number | string | { value; message };
    max?: number | string | { value; message };
    minLength?: number | { value; message };
    maxLength?: number | { value; message };
    pattern?: string | { value; message };
    email?: boolean | { message };
    url?: boolean | { message };
  };

  // imperative validators
  validate?: (args: { value; allValues }) => string | undefined;
  validateAsync?: (args: { value; allValues }) => Promise<string | undefined>;
  validateAsyncDebounce?: number;       // default 400ms

  // conditional logic
  visibleWhen?: ConditionOrFn;
  enabledWhen?: ConditionOrFn;
  requiredWhen?: ConditionOrFn;
  keepValueWhenHidden?: boolean;        // default false

  // simple primitives
  options?: ReadonlyArray<FieldOption> | FieldOptionsResolver;
  searchable?: boolean;
  min?: number; max?: number; step?: number;
  rows?: number;                        // textarea
  lang?: string;                        // code

  // type-specific config
  config?: { code?: ...; date?: ...; rating?: ... };

  // computed fields
  expression?: string;                  // '{a} - {b}'
  compute?: (args: { values }) => unknown;
  editable?: boolean;

  // layout
  width?: 'full' | 'half' | 'third' | 'quarter' | number;
  labelPosition?: 'top' | 'left';

  // misc
  disabled?: boolean;
  readOnly?: boolean;
  autoComplete?: string;
  autoFocus?: boolean;
}
```

## Conditional fields

```ts
{
  name: "vatId",
  type: "text",
  label: "VAT ID",
  visibleWhen: { field: "country", in: ["DE", "FR", "IT", "ES"] },
  requiredWhen: ({ values }) => values.cadence === "annually",
}
```

When `visibleWhen` flips to `false`, the field unmounts and its value is stripped from submission. Override with `keepValueWhenHidden: true`. `type: "hidden"` fields are tracked separately and ALWAYS submit — use them for CSRF tokens, request ids, etc.

## Computed fields

```ts
// Pure interpolation
{ name: "displayName", type: "computed", label: "Display name",
  expression: "{firstName} {lastName}" }

// Function form
{
  name: "total",
  type: "computed",
  label: "Total",
  compute: ({ values }) => Number(values.qty) * Number(values.unitPrice),
}
```

`expression` parses dependencies from the template (`{firstName}` → deps include `firstName`). `compute` runs as-is — for branchy logic, add an explicit `dependsOn?: string[]` if needed (v0.1.x).

Set `editable: true` to let the consumer type over the computed value (the field renders as a text input prefilled with the latest compute result, but accepts overrides).

## Custom field types

```tsx
import {
  defaultJsonFormRegistry,
  type FieldRenderer,
} from "@/components/json-form";

const ColorRenderer: FieldRenderer = ({ value, onChange, disabled }) => (
  <input
    type="color"
    value={String(value ?? "#000")}
    onChange={(e) => onChange(e.target.value)}
    disabled={disabled}
  />
);

const registry = { ...defaultJsonFormRegistry, color: ColorRenderer };

<JsonForm schema={schema} fieldRegistry={registry} onSubmit={...} />;
```

Field renderers receive `{ field, value, onChange, onBlur, error, disabled, readOnly, allValues, formApi }` and MUST return a single React element — the wrapper uses `Slot.Root` to forward `id` and `aria-*` attributes onto it.

## Imperative API

```tsx
const ref = useRef<JsonFormHandle>(null);

<JsonForm ref={ref} schema={schema} onSubmit={...} />

// Then:
ref.current?.submit();           // programmatic submit (returns {ok, values, errors})
ref.current?.reset();            // reset to defaultValues
ref.current?.setValue("x", 42);  // set a single field
ref.current?.setError("x", "Server rejected this value");
ref.current?.focus("x");
ref.current?.isDirty();
ref.current?.isValid();
ref.current?.isSubmitting();
```

## Headless usage

For fully-custom layouts, use the factory + standalone parts:

```tsx
"use client";

import {
  useJsonForm,
  JsonFormProvider,
  JsonFormField,
  JsonFormSubmitButton,
  defaultJsonFormRegistry,
  defaultJsonFormStrings,
} from "@/components/json-form";

function MyForm() {
  const { form, zodSchema, handle } = useJsonForm(schema);
  const ctx = {
    ...handle,
    rhf: form,
    schema,
    zodSchema,
    strings: defaultJsonFormStrings,
    formId: "my-form",
    hasSubmitted: false,
    fieldRegistry: defaultJsonFormRegistry,
  };
  return (
    <JsonFormProvider value={ctx}>
      <form onSubmit={(e) => {
        e.preventDefault();
        form.handleSubmit((v) => console.log(v))(e);
      }}>
        <div className="grid grid-cols-2 gap-4">
          <JsonFormField name="firstName" />
          <JsonFormField name="lastName" />
          <JsonFormField name="email" />
        </div>
        <JsonFormSubmitButton />
      </form>
    </JsonFormProvider>
  );
}
```

## Value shapes

| Field type | Submitted shape |
|---|---|
| `text` / `email` / `password` / `url` / `tel` / `textarea` | `string` |
| `number` / `slider` / `rating` | `number` |
| `checkbox` / `switch` | `boolean` |
| `select` / `radio-group` | `unknown` (preserves `option.value` type) |
| `multi-select` / `checkbox-group` | `unknown[]` |
| `date` / `time` / `datetime` | `string` (ISO 8601) |
| `date-range` | `{ start: string; end: string }` |
| `code` | `string` |
| `computed` | whatever `expression` / `compute` returns |
| `hidden` | the `defaultValue` (unchanged unless `setValue`'d) |
| `section` / `divider` | excluded from submission |

`TValues` is your responsibility — type it per-form:

```ts
type SignupValues = { email: string; password: string };
<JsonForm<SignupValues> ... />
```

## Validation timing

Default `validationMode` is `'onTouched'` — errors surface after the first blur OR submit attempt, then update on every keystroke. Override per-form via the `validationMode` prop (RHF's standard values: `'onChange' | 'onBlur' | 'onTouched' | 'onSubmit' | 'all'`).

When both `validate` and `validateAsync` are set on a field, sync runs first and short-circuits async on failure — useful for "check the network only if the format passes."

## Customizing strings (i18n)

Pass `strings={{ ... }}`. Shallow-merge over the defaults; per-key override of `errorTemplates`:

```tsx
<JsonForm
  schema={schema}
  strings={{
    submit: "Envoyer",
    reset: "Réinitialiser",
    errorTemplates: {
      required: "Ce champ est requis",
      minLength: "Au moins {n} caractères",
    },
  }}
  onSubmit={...}
/>
```

`{n}` is interpolated with the validator value (e.g., `minLength: 8` → `"Au moins 8 caractères"`).

## Anti-patterns

- **Don't pin `zod@^3`** — the resolver chain uses zod v4 APIs. Peer dep is `zod@^4`.
- **Don't pass an unstable schema reference** — `<JsonForm schema={...}>` re-mounts on schema identity change. Memoize with `useMemo` or hoist to module scope.
- **Don't use both `values` AND `onChange`** — that's double-bookkeeping. Pick one: `values` if the parent owns state, `onChange` if you want change events.
- **Don't render `<JsonFormField>` outside a `<JsonForm>` or `<JsonFormProvider>`** — `useJsonFormContext` throws a dev-friendly error.
- **Don't return fragments from custom field renderers** — `Slot.Root` forwards ARIA onto a single child element.

## Migration notes — `properties-form` vs `json-form`

`properties-form` (entity-edit) and `json-form` (schema-driven) coexist intentionally:

- `properties-form` is for one-off, deeply bespoke entity-edit flows (admin "Edit project" pages). Hand-rolled fields, full control over layout.
- `json-form` is for the same surface rendering many variants, backend-driven schemas, or AI-tooling agents driving the UI.

If you're rendering the same form for one entity type and the field set is fixed forever, `properties-form` is lighter. If the field set could change (admin-configurable forms, multi-tenant schemas, generated forms), reach for `json-form`.
