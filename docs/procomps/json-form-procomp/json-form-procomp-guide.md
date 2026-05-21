# json-form — consumer guide

> Stage 3: how to use it.
>
> Component lives at [`src/registry/components/forms/json-form/`](../../../src/registry/components/forms/json-form/).
>
> **Current version:** `v0.2.5` (alpha). Substrate-grade schema-driven form renderer. RHF v7 + zod v4; 25 built-in field types; extensible renderer registry with typed authoring; narrow-deps headless hooks; floating devtools panel; per-field subscription gate (default-registry watch drop) + deep-merge `defaultValues`; `<JsonFormProvider>` bridges RHF's `<FormProvider>` internally (v0.2.4) so headless trees no longer need to wrap with both; conditional + computed fields with narrow-deps subscriptions; standalone parts for fully-headless layouts.

## What ships in v0.2

**v0.2.0 (behavioral, 2026-05-21):**

- **Per-field subscription gate** — built-in default renderers skip the FieldWrapper-level `useWatch({ control })` subscription (audited not to read `allValues`; identity-checked against `defaultJsonFormRegistry`, so consumer-registered renderers at default slots correctly opt back into full-bag unless they declare `dependsOn`). Custom renderers opt in via `dependsOn` — `[]` = explicit no-watch + `getValues()` snapshot, `["a","b"]` = narrow watch + rebuilt `allValues`, omitted = legacy full-bag for backward compatibility. On a 20-field form, per-keystroke FieldWrapper renders drop **20 → 1–4**.
- **Deep-merge `defaultValues`** — form-level `defaultValues` now overlays per leaf via a `walkLeaves` + `setByPath` pipeline, so sibling per-field defaults at shared parent paths are no longer dropped.
- **Conditional-count dev-warn threshold** bumped 50 → 200.

**v0.2.1 (docs + devtools patch, 2026-05-21):**

- `dependsOn` JSDoc rewritten with stable-identity guidance + final-renderer-identity check note.
- `allValues` JSDoc covers snapshot / narrow / fullbag freshness contracts.
- `<JsonFormDevtools>` no longer crashes when no `<JsonFormProvider>` is in scope — renders an explanatory fallback panel via internal `useJsonFormContextOptional()` (not exported).
- `prettyReplacer` handles `BigInt` values (`${value.toString()}n`).

**v0.2.3 (2026-05-21):** reverts v0.2.2's `useStableRichtextValue` consumer-side band-aid in `parts/field-richtext.tsx` (back to its v0.2.1 simple shape); the proper fix landed in `article-body-01@v0.2.2` (content-equality echo guard at the substrate). RHF-controlled `richtext` fields now work without keystroke focus-loss. No public-API change; the dropped helpers were file-local.

**v0.2.4 (2026-05-21):** `<JsonFormProvider>` now wraps its children in `<FormProvider {...value.rhf}>` internally. The documented headless pattern (`<JsonFormProvider value={{ ...handle, rhf: form, ... }}>`) no longer requires consumers to also wrap with RHF's `<FormProvider>`. Pre-v0.2.4 code that wraps with both still works (the inner wins; same form instance). The fix closes a user-reported page-crash on the demo's Custom Registry tab — the Imperative tab's `<details>`-embedded `HeadlessExample` was missing the outer wrap and v0.2.0's watch-drop made FieldWrapper's `useFormContext()` load-bearing on first render.

**v0.2.5 (2026-05-22):** `parts/field-radio-group.tsx` now passes `value=""` (Radix-canonical "no selection") instead of `undefined` when the field has no value, so the underlying RadioGroup stays always-controlled. React no longer logs *"RadioGroup is changing from uncontrolled to controlled"* on the first interaction of a radio-group field without a `defaultValue`. Mechanical fix mirroring `FieldSelect`'s already-correct pattern. Cross-checked all 25 default-registry renderers — `field-radio-group` was the lone holdout.

## v0.1.7 substrate (still current — no changes since)

- **25 built-in field types** across 5 families — text (×7), choice (×6), date/time (×4), rich/composite (`code` / `slider` / `rating` / `richtext`), special (`computed` / `hidden` / `section` / `divider`).
- **Conditional logic** — 11-operator Condition DSL (`equals` / `notEquals` / `in` / `notIn` / `matches` / `truthy` / `greaterThan` / `lessThan` / `all` / `any` / `not`) plus function escape hatch. Covers `visibleWhen` / `enabledWhen` / `requiredWhen`. **Narrow-deps subscription** (v0.1.6) — static conditions subscribe only to referenced fields; function form falls back to full-bag.
- **Computed fields** — pure `expression: '{firstName} {lastName}'` interpolation OR `compute: (args) => unknown` function. Both narrow-deps for the `expression` form (v0.1.6).
- **Extensible renderer registry** — spread `defaultJsonFormRegistry` and add entries. Form-level `renderField` slot intercepts every field if you need surgery. **Typed factory** `defineFieldRenderer<TValue, TConfig>` (v0.1.7) for narrowed custom-renderer authoring.
- **Standalone parts** — `<JsonFormField>` / `<JsonFormSubmitButton>` / `<JsonFormResetButton>` / `<JsonFormErrorSummary>` / `<JsonFormHeader>` / `<JsonFormFieldWrapper>` / `<JsonFormDevtools>` (v0.1.7). Pair with `<JsonFormProvider>` + `useJsonForm()` for fully-headless layouts.
- **Narrow-deps headless hooks** (v0.1.7) — `useJsonFormFieldValue<T>(name)` + `useJsonFormFieldsValue<T>(names)` for custom layouts that subscribe to one or more fields without re-rendering on unrelated changes.
- **Devtools panel** (v0.1.7) — `<JsonFormDevtools>` floating-by-default panel with Schema / Values / Conditionals / Errors tabs. `Ctrl+Shift+J` toggle. Prod no-op via `process.env.NODE_ENV` gate; body chunk lazy-loaded via `React.lazy()`.
- **Imperative handle** — `submit / reset / setValue / getValue / setError / clearErrors / trigger / focus / isDirty / isValid / isSubmitting`. Wire via `<JsonForm ref={...}>`.
- **Headless factory** — `useJsonForm(schema, options)` returns `{ form, zodSchema, fieldList, isValid, isSubmitting, handle }`.
- **Cross-registry deps** — `@ilinxa/code-block` (for `code`) + `@ilinxa/article-body-01` (for `richtext`), both lazy-loaded via `React.lazy` so the heavy bundles only ship when a form actually contains those fields.
- **Lifecycle callbacks** (v0.1.6) — `onSubmitAttempt` (fires on every submit press before validation) + `onReady` (fires once after mount + defaults applied).
- **`dependsOn` typed metadata** (v0.1.7) — declare which field names a custom renderer's `allValues` access depends on. Schema-lint warns on dangling refs. **Runtime watch-gating live in v0.2.0** — the FieldWrapper resolves a per-field subscription mode (snapshot / narrow / fullbag) from this flag.
- **`translatable` typed flag** (v0.1.6) — typed metadata for downstream per-locale renderer HOCs. Upstream `JsonForm` does NOT change behavior based on this flag.
- **Robustness** — submit-error focus walks `schema.fields` in declaration order (skips `computed`/`hidden`/`section`/`divider`); `requiredWhen` flip eager-triggers on touched/dirty fields; `AbortController` + `signal` in `FieldOptionsResolver` for fetch cleanup; `number`-input empty-state coerced to `undefined` (not `""` → `0` via `z.coerce.number()`); error-summary anchor scroll + `setFocus` combo.

## Install

```bash
pnpm dlx shadcn@latest add @ilinxa/json-form
```

This pulls the sealed-folder source AND auto-installs the npm dependencies (`react-hook-form@^7.75.0`, `@hookform/resolvers@^5.2.2`, `zod@^4.4.3`, `lucide-react@^1.11.0`) AND chain-installs `@ilinxa/code-block` (for the `code` field) and `@ilinxa/article-body-01` (for the `richtext` field).

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
  type: FieldType;         // 25 built-ins + consumer types
  label?: string;
  description?: string;    // helper text below label
  placeholder?: string;
  defaultValue?: unknown;

  // declarative validators (compiled to Zod) — `{ value, message }` form
  // accepts a typed payload; see `FieldValidators` in types.ts for the
  // full shape (`value: number | string` for min/max, etc.).
  validators?: {
    required?: boolean | string;
    min?: number | string | { value: number | string; message: string };
    max?: number | string | { value: number | string; message: string };
    minLength?: number | { value: number; message: string };
    maxLength?: number | { value: number; message: string };
    pattern?: string | { value: string; message: string };
    email?: boolean | { message: string };
    url?: boolean | { message: string };
  };

  // imperative validators — object-shape callbacks (F-cross-12)
  validate?: (args: { value: unknown; allValues: Record<string, unknown> }) => string | undefined;
  validateAsync?: (args: { value: unknown; allValues: Record<string, unknown> }) => Promise<string | undefined>;
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
  compute?: (args: { values: Record<string, unknown> }) => unknown;
  editable?: boolean;

  // layout
  width?: 'full' | 'half' | 'third' | 'quarter' | number;
  labelPosition?: 'top' | 'left';
  row?: string;                         // group fields onto the same row
  colSpan?: 'full' | 1 | 2;             // columns=2 forms — span both columns

  // misc
  disabled?: boolean;
  readOnly?: boolean;
  autoComplete?: string;
  autoFocus?: boolean;

  // v0.1.6 — typed metadata for downstream per-locale renderer HOCs
  // (upstream JsonForm does NOT change behavior based on this flag)
  translatable?: boolean;

  // v0.1.7 — narrow-deps subscription opt-in for custom renderers
  // (v0.2.0 honors this at runtime — see Performance section below)
  // Three semantic states: [] = no-watch + snapshot; [a,b] = narrow watch;
  // omitted = legacy full-bag (for backward compatibility).
  dependsOn?: ReadonlyArray<string>;
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

`expression` parses dependencies from the template (`{firstName}` → deps include `firstName`) and uses a narrow-deps `useWatch` internally (v0.1.6). `compute` runs as-is — its internal watch is currently full-bag. The `dependsOn` flag on a `computed` field narrows the **FieldWrapper-level** subscription (relevant if the renderer reads `args.allValues`); it does **not** narrow the `compute` function's dependency tracking.

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

Field renderers receive `{ field, value, onChange, onBlur, error, disabled, readOnly, allValues, formApi, ariaProps }` and return a `ReactNode` (single element, fragment, or array). `ariaProps` (v0.1.2 — replaced the v0.1.0 `Slot.Root` strategy) carries `id` (for native controls — pair with the wrapper's `<label htmlFor>`) + `labelledBy` (for group-style controls — `aria-labelledby` to the wrapper's label) + the standard `aria-required` / `aria-invalid` / `aria-disabled` / `aria-describedby` attributes.

## Typed renderer authoring — `defineFieldRenderer<T>` (v0.1.7)

For custom renderers that want narrowed `value` + `field.config` types:

```tsx
import { defineFieldRenderer, defaultJsonFormRegistry } from "@/components/json-form";

interface ColorConfig {
  palette?: string[];
}

const ColorSwatch = defineFieldRenderer<string, ColorConfig>({
  displayName: "ColorSwatch",  // surfaced in <JsonFormDevtools>
  impl: ({ value, onChange, field, disabled }) => {
    const palette = field.config?.color?.palette ?? ["#FF595E", "#FFCA3A"];
    return (
      <div className="flex gap-1">
        {palette.map((c) => (
          <button key={c} type="button" disabled={disabled}
            onClick={() => onChange(c)}
            style={{ background: c, opacity: value === c ? 1 : 0.5 }}
          />
        ))}
      </div>
    );
  },
});

const registry = { ...defaultJsonFormRegistry, color: ColorSwatch };
```

`defineFieldRenderer<TValue, TConfig>` is **type-narrowing only** — there's no runtime narrowing because RHF values aren't statically known. The generics are consumer-asserted convenience. The factory attaches `displayName` as a non-enumerable property for devtools rendering.

## Narrow-deps headless hooks (v0.1.7)

When building fully-custom form layouts, subscribe to one or more fields without re-rendering on every other field's change:

```tsx
import { useJsonFormFieldValue, useJsonFormFieldsValue } from "@/components/json-form";

function Summary() {
  // Single-field — re-renders only when "country" changes
  const country = useJsonFormFieldValue<string>("country");
  return <p>You selected {country}</p>;
}

function NamePreview() {
  // Multi-field — re-renders only when one of these changes
  const { firstName, lastName } = useJsonFormFieldsValue<{
    firstName: string;
    lastName: string;
  }>(["firstName", "lastName"]);
  return <p>{firstName} {lastName}</p>;
}
```

Both hooks wrap RHF's `useWatch` scoped to the active `<JsonFormProvider>` context. The generic `<T>` is **consumer-asserted** — RHF values aren't statically known, so this is typed convenience, not a runtime guarantee. Multi-field variant rehydrates the path-keyed bag via `setByPath` so `bag["address.city"]` works for nested paths.

## Devtools panel — `<JsonFormDevtools>` (v0.1.7)

Drop it next to (or anywhere inside) a `<JsonForm>` and get a live panel with four tabs:

```tsx
import { JsonForm, JsonFormDevtools } from "@/components/json-form";

export function MyForm() {
  return (
    <>
      <JsonForm schema={schema} onSubmit={...} />
      <JsonFormDevtools />
    </>
  );
}
```

Tabs:
- **Schema** — collapsible JSON dump of the active `FormSchema`
- **Values** — live RHF values bag
- **Conditionals** — per-field visible/enabled/required booleans (uses `useConditional` internally so narrow-deps applies)
- **Errors** — flat error map

Posture:
- Default: **floating** fixed-position panel bottom-right. Pill-shaped toggle until opened. `Ctrl+Shift+J` keyboard shortcut.
- `<JsonFormDevtools inline />` — inline-block placement.
- `<JsonFormDevtools shortcut="Ctrl+Alt+D" />` — override the shortcut.
- `<JsonFormDevtools force />` — keep the panel mounted in production builds.

**Prod behavior:** the component returns `null` in production (`process.env.NODE_ENV === "production"`) and the ~250 LOC panel body is in a separate lazy chunk that's never fetched. For **true bundler-level dead-code elimination** (zero stub bytes in prod), wrap the import:

```tsx
{process.env.NODE_ENV !== "production" && <JsonFormDevtools />}
```

**Important:** `<JsonFormDevtools>` MUST be a descendant of `<JsonForm>` or `<JsonFormProvider>` — it reads `useJsonFormContext()`, which throws if no provider is in scope. Inline mode placed inside `<JsonForm>` works fine; sibling placement does NOT.

## Performance — `dependsOn` opt-in narrow-deps (v0.2.0 runtime)

Before v0.2.0, every field re-rendered on every keystroke anywhere in the form (FieldWrapper subscribed to the full values bag to populate `allValues` for the renderer). Most renderers don't read `allValues` and paid the cost for nothing.

As of v0.2.0, FieldWrapper resolves a per-field subscription mode:

- **Built-in default renderers** — audited not to read `allValues`; identity-checked against `defaultJsonFormRegistry`. They skip the watch entirely; `allValues` is a `getValues()` snapshot taken at render. **No `dependsOn` declaration needed.**
- **Custom renderer with `dependsOn: ["a","b"]`** — narrow watch on those paths only. `allValues` is rebuilt from the watched bag via `setByPath` (sparse — only the declared paths).
- **Custom renderer with `dependsOn: []`** — explicit opt-out. Skip the watch entirely; `allValues` is a `getValues()` snapshot.
- **Custom renderer without `dependsOn`** — legacy full-bag watch. Preserves v0.1.x behavior so unmigrated renderers keep working.

The whitelist check resolves on the **final renderer identity**, not on `field.type` alone — a custom renderer registered at the `text` slot correctly opts back into full-bag unless it sets `dependsOn`. `validateSchemaDev` warns when `dependsOn` references a field name that doesn't match any `schema.fields[].name`.

Worked examples:

```ts
{
  name: "summary",
  type: "summary",                    // custom renderer reading firstName + lastName
  dependsOn: ["firstName", "lastName"],  // narrow subscription
}

{
  name: "color",
  type: "color",                      // custom renderer doesn't read allValues
  dependsOn: [],                      // no subscription; allValues = getValues() snapshot
}

{
  name: "deeplyDynamic",
  type: "custom",                     // unmigrated — full-bag subscription
  // dependsOn undefined → legacy v0.1.x behavior preserved
}
```

**Stable-identity tip:** if you authored a custom renderer factory with `defineFieldRenderer`, keep the `dependsOn` array reference stable — declare it module-scope or memoize it. Each render with a new array identity invalidates `useWatch`'s dep tracking. Schema-lint flags `dependsOn` names that don't resolve to a `schema.fields[].name` (dot-path-as-flat-string; nested-shape leaves need individual entries).

## Lifecycle callbacks (v0.1.6)

```tsx
<JsonForm
  schema={schema}
  onReady={({ formApi }) => {
    // Fires once after mount + defaults applied
    console.log("form is mounted; ready to programmatic-submit");
  }}
  onSubmitAttempt={({ formApi }) => {
    // Fires on every submit press, BEFORE validation runs
    analytics.track("form_submit_attempt", { attempts: ++submitCount });
  }}
  onSubmit={({ values }) => ...}
  onSubmitError={({ errors }) => ...}     // fires only on validation failure
  onValidationChange={({ isValid, errors }) => ...}
  onChange={({ values }) => ...}
  onChangeDebounce={100}                  // default ms; structural-equality echo-guarded
/>
```

`onSubmit` still gates on validation passing. `onSubmitAttempt` is for "user tried" telemetry and submit-counter UX hints. `onReady` is for async-schema consumers that load the schema → mount the form → wire callbacks (saves a manual `useEffect` capturing the imperative handle).

## Imperative API

```tsx
const ref = useRef<JsonFormHandle>(null);

<JsonForm ref={ref} schema={schema} onSubmit={...} />

// Then:
ref.current?.submit();              // programmatic submit (returns {ok, values, errors})
ref.current?.reset();               // reset to defaultValues
ref.current?.reset({ x: 42 });      // reset with new defaults
ref.current?.setValue("x", 42);     // set a single field
ref.current?.getValue("x");         // read a single field
ref.current?.getValues();           // read the full values bag
ref.current?.setError("x", "Server rejected this value");
ref.current?.clearErrors("x");      // clear one field's error
ref.current?.clearErrors();         // ...or all errors
ref.current?.trigger("x");          // re-run validation
ref.current?.trigger();             // ...for every field
ref.current?.focus("x");
ref.current?.isDirty();
ref.current?.isValid();
ref.current?.isSubmitting();
```

## Headless usage

For fully-custom layouts, use the factory + standalone parts.

> **Note (v0.2.4):** `<JsonFormProvider>` wraps its children in `<FormProvider {...value.rhf}>` internally. You do **NOT** need to also wrap with RHF's `<FormProvider>`. The pattern below is self-contained — the standalone parts resolve their RHF context through the bridge. Pre-v0.2.4 code that wraps with both still works (the inner provider wins; same form instance).

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
| `richtext` | `Array<{ type, children }>` (Plate JSON). Canonical empty default: import `ARTICLE_BODY_EMPTY_VALUE` from `@ilinxa/article-body-01`. Serialize via `serializeArticleBodyToHtml` at export boundaries. |
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
- **Custom renderers must attach `ariaProps` to the right element** — v0.1.2 dropped the `Slot.Root` strategy. For native form controls (`<input>`, `<textarea>`, `<button>`), spread `ariaProps.id` + the `aria-*` attributes onto the control. For group-style controls (`role="radiogroup"`, `role="group"`), attach `aria-labelledby={ariaProps.labelledBy}` to the group root instead of `id`.
- **Don't read `args.allValues` from a custom renderer without setting `dependsOn`** — as of v0.2.0 built-in renderers auto-skip the full-bag subscription; consumer renderers that omit `dependsOn` keep the legacy full-bag behavior (slow). If your renderer doesn't read `allValues`, set `dependsOn: []` so the watch is skipped. If it reads `allValues.country`, set `dependsOn: ["country"]`.
- **Don't render `<JsonFormDevtools>` outside a `<JsonForm>` / `<JsonFormProvider>`** — `useJsonFormContext` throws.
- **Don't expect `<JsonFormDevtools>` to tree-shake in prod without a consumer-side guard** — the runtime returns `null` in prod, but the ~10-LOC loader stub still ships. For true dead-code-elimination, wrap with `{process.env.NODE_ENV !== "production" && <JsonFormDevtools />}`.

## Migration notes — `properties-form` vs `json-form`

`properties-form` (entity-edit) and `json-form` (schema-driven) coexist intentionally:

- `properties-form` is for one-off, deeply bespoke entity-edit flows (admin "Edit project" pages). Hand-rolled fields, full control over layout.
- `json-form` is for the same surface rendering many variants, backend-driven schemas, or AI-tooling agents driving the UI.

If you're rendering the same form for one entity type and the field set is fixed forever, `properties-form` is lighter. If the field set could change (admin-configurable forms, multi-tenant schemas, generated forms), reach for `json-form`.
