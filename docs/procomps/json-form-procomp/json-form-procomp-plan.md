# json-form — procomp plan

> Stage 2: how. The implementation contract.
>
> **Status (2026-05-22):** this document is the v0.1.0 GATE 2 lock — historical record. Current shipped surface is **v0.2.5**. The v0.1.x increment plans (v0.1.1 `richtext`, v0.1.2 `ariaProps`, v0.1.6 narrow-deps + lifecycle callbacks, v0.1.7 `defineFieldRenderer` + headless hooks + `<JsonFormDevtools>`) landed additively; the v0.2.0 plan is captured separately at [`json-form-procomp-plan-v0.2.0.md`](./json-form-procomp-plan-v0.2.0.md). Source of truth for current API surface: [`json-form-procomp-guide.md`](./json-form-procomp-guide.md). Counts and type lists below reflect v0.1.0 (`24 built-in types`); v0.1.1 added `richtext` → 25.
>
> **Predecessor:** [`json-form-procomp-description.md`](./json-form-procomp-description.md), signed off after a careful review pass that surfaced 3 blockers + 5 high + 8 medium + 7 low findings — all resolved inline. The description locked: custom field-DSL → Zod, RHF v7 substrate, extensible renderer registry, 4 field families (text + choice + date/time + rich-composite), conditional + computed, hybrid `config` shape, hidden-vs-visible split, computed-as-interpolation-only.

## Substrate decisions (locked)

| Decision | Choice | Source |
|---|---|---|
| Slug | `json-form` | Description, GATE 1 lock |
| Category | `forms` (existing in `categories.ts`) | Description, GATE 1 lock |
| Sibling relationship | coexists with `properties-form` (entity-edit, hand-rolled) — different intent, different state model | Description, prologue |
| Substrate — form state | **`react-hook-form` v7.75.0** | Description Q2 + `pnpm view` 2026-05-12 |
| Substrate — resolver | **`@hookform/resolvers` v5.2.2** (`/zod` import path) | Description Q2 + `pnpm view` 2026-05-12 |
| Substrate — validation | **`zod` v4.4.3** (**refined from description's `^3.x` — v4 is current stable, @hookform/resolvers v5 supports it via standard-schema spec**) | Plan-stage refinement |
| RHF validation mode | `onTouched` — error after first blur OR submit attempt | Description Q28 |
| Renderer registry | extensible `Record<string, FieldRenderer>`; consumer-provided merges over defaults | Description in-scope |
| Render-slot precedence | `renderField` (form-level wrapper) > `fieldRegistry` lookup > built-in default | Description in-scope (render slots) |
| JSON shape | custom field-DSL `FormSchema { fields: FieldDefinition[]; validate?; zodSchema?; meta? }` | Description, GATE 1 lock |
| Conditional logic — Condition DSL | 11 object-shape operators + function escape hatch | Description in-scope + Q10/C1 + L-03 |
| Conditional perf model | per-field `watch(deps)` subscription; ~50-conditional dev-warning ceiling | Description Q44 (O1) |
| Hidden-value handling | `type: 'hidden'` ALWAYS submits; `visibleWhen: false` strips by default; opt-out via per-field `keepValueWhenHidden: true` | Description Q10 (C1) |
| Disabled-value handling | submits (mirrors RHF default) | Description Q11 |
| Field-config shape | hybrid: simple primitives top-level (`min`/`max`/`step`/`lang`/`rows`/`options`/`searchable`), complex objects under `config?: { code?, date?, rating? }` | Description Q42 (A1) |
| Computed expression | interpolation-only (`{fieldName}` template; dot-paths OK); function escape hatch via `compute: (values) => unknown` | Description Q43 (A3) |
| Computed memoization | parse `expression` template OR run `compute` with proxy values to detect deps; subscribe via RHF `watch()` to only those | Description Q13 |
| Meta header rendering | default on; opt-out via `showSchemaHeader={false}` | Description Q25 (A2) |
| Field types in v0.1.0 | text (×7), choice (×6), date/time (×4), rich/composite (`code` + `slider` + `rating`), special (`computed` / `hidden` / `section` / `divider`) — **24 types total** | Description in-scope |
| Field types deferred to v0.1.x | `richtext` (waits for plate-editor procomp), `file` (waits for file-upload-01), `color` (waits for color-picker-01), `array` (own UX problem) | Description out-of-scope + Q4 |
| Multi-step / wizard | deferred to v0.1.x | Description Q5 |
| Visual builder | deferred to v0.2 (separate procomp) | Description out-of-scope |
| Hook exports | `useJsonForm(schema, options)` — headless factory; `useJsonFormContext()` — context accessor (TWO distinct hooks; resolves the H-04 collision) | Description Q30 + standalone-parts |
| Standalone parts | `<JsonFormProvider>`, `<JsonFormField>`, `<JsonFormSubmitButton>`, `<JsonFormResetButton>`, `<JsonFormErrorSummary>` | Description Q37 |
| Submit button | shown by default, right-aligned; `submitButton={false}` hides; `submitButton: { disableWhenInvalid: true }` opts into the anti-pattern | Description Q19 + Q40 |
| Reset button | hidden by default; opt in by passing the object | Description Q20 |
| Error summary | post-submit by default; `summaryStrategy: 'always'` overrides | Description Q21 + Q22 |
| `'use client'` | json-form.tsx + all standalone parts; no `next/*` imports anywhere | Description (registry portability rule) |
| Cross-registry dep | `@ilinxa/code-block` (shipped); declared in `meta.ts` via the existing `dependencies.internal` key (already in `ComponentDependencies` type at `src/registry/types.ts:20`); lint script extended to validate it (plan-stage T2) | Description T2 |
| Object-shape callbacks | all callbacks `(args: { ... }) => ...` | Description F-cross-12 |
| Theme system | piggyback on existing project tokens (Onest + JetBrains Mono, OKLCH, signal-lime) — no new tokens | Description Q33 |
| Locale defaults | English `strings` dictionary (18 entries: 10 top-level + 8 errorTemplates) shipped; consumer overrides via shallow merge | Description Q26 |
| Bundle posture | RHF + Zod + wrappers + shadcn primitives we already import. `code` field dynamic-imports `@ilinxa/code-block` on first use. Single client bundle. | Description success #12 + T3 |

---

## Final API

All types live in `types.ts` and re-export from `index.ts`. Object-shape callback args follow the F-cross-12 mandate. Lower-cased TS-style enums consistent with code-block's precedent (`'view' | 'edit'`, not `'View' | 'Edit'`).

```ts
import type { CSSProperties, ReactNode, Ref } from "react";
import type {
  Control,
  FieldErrors,
  UseFormReturn,
} from "react-hook-form";
import type { ZodObject, ZodTypeAny } from "zod";

// ─── Field DSL ───────────────────────────────────────────────────────────────

/** All built-in v0.1.0 field types, plus string for consumer-registered ones. */
export type FieldType =
  // text family
  | "text" | "email" | "password" | "url" | "tel" | "textarea" | "number"
  // choice family
  | "select" | "multi-select" | "radio-group" | "checkbox" | "checkbox-group" | "switch"
  // date/time family
  | "date" | "date-range" | "time" | "datetime"
  // rich / composite (v0.1.0)
  | "code" | "slider" | "rating"
  // special
  | "computed" | "hidden" | "section" | "divider"
  // consumer-extended (registry lookup); also covers v0.1.x types before they ship
  | (string & {});  // intersection with empty object preserves IntelliSense for builtin literals

/** Static-array form of options. */
export interface FieldOption {
  value: unknown;
  label: string;
  description?: string;
  disabled?: boolean;
}

/** Async resolver form of options. */
export type FieldOptionsResolver = (args: {
  query?: string;
  allValues: Record<string, unknown>;
}) => Promise<FieldOption[]>;

/** Per-field type-specific config (hybrid shape — A1 resolution). */
export interface FieldConfig {
  code?: { editorExtensions?: unknown[]; readOnly?: boolean };
  date?: { firstDayOfWeek?: 0 | 1 | 2 | 3 | 4 | 5 | 6; minYear?: number; maxYear?: number };
  rating?: { stars?: number };
  // v0.1.x additions land here non-breakingly:
  //   richText?: PlateConfig (waits for plate-editor procomp)
  //   file?: FileUploadConfig (waits for file-upload-01)
  //   color?: ColorPickerConfig (waits for color-picker-01)
}

/**
 * Declarative validators block. Compiled to Zod chain at schema-compile time.
 *
 * REFINEMENT vs description: every validator (except `email`/`url` which are pure booleans)
 * accepts either a primitive value (uses the strings.errorTemplates default message) OR an
 * object form `{ value, message }` for a custom message per validator. This generalizes the
 * `required?: boolean | string` pattern from the description across all validator types.
 */
export interface FieldValidators {
  required?: boolean | string;       // boolean = use default message; string = custom message
  min?: number | string | { value: number | string; message: string };  // string for date types (ISO 8601)
  max?: number | string | { value: number | string; message: string };
  minLength?: number | { value: number; message: string };
  maxLength?: number | { value: number; message: string };
  pattern?: string | { value: string; message: string };  // regex source
  email?: boolean | { message: string };
  url?: boolean | { message: string };
}

/** Condition DSL — 11 operators + function escape hatch. */
export type Condition =
  | { field: string; equals: unknown }
  | { field: string; notEquals: unknown }
  | { field: string; in: ReadonlyArray<unknown> }
  | { field: string; notIn: ReadonlyArray<unknown> }
  | { field: string; matches: string }                      // regex source
  | { field: string; truthy: boolean }                      // truthy: true → JS-truthy; false → falsy
  | { field: string; greaterThan: number }
  | { field: string; lessThan: number }
  | { all: ReadonlyArray<Condition> }                       // AND
  | { any: ReadonlyArray<Condition> }                       // OR
  | { not: Condition };                                     // NOT

export type ConditionOrFn =
  | Condition
  | ((args: { values: Record<string, unknown> }) => boolean);

/** A single field definition in the JSON schema. */
export interface FieldDefinition {
  /**
   * Form path (supports dot-paths). REQUIRED for all field types — including
   * `section` and `divider`, which produce no value but use `name` as a stable
   * React key. Consumers conventionally prefix non-value-carrying names with
   * `_` (e.g., `name: '_personal'`, `name: '_divider1'`) to signal "no value
   * produced." Matches the description's Example 4 precedent. (See T9.)
   */
  name: string;
  type: FieldType;
  label?: string;
  description?: string;              // helper text below label
  placeholder?: string;
  defaultValue?: unknown;

  validators?: FieldValidators;
  validate?: (args: { value: unknown; allValues: Record<string, unknown> }) => string | undefined;
  validateAsync?: (args: { value: unknown; allValues: Record<string, unknown> }) => Promise<string | undefined>;
  validateAsyncDebounce?: number;    // default 400ms

  visibleWhen?: ConditionOrFn;
  enabledWhen?: ConditionOrFn;
  requiredWhen?: ConditionOrFn;
  keepValueWhenHidden?: boolean;     // default false — preserve value across visibleWhen-false transitions

  // simple type-specific primitives stay at top level
  options?: ReadonlyArray<FieldOption> | FieldOptionsResolver;
  searchable?: boolean;              // select: switch to Command+Popover combobox pattern
  optionsDebounce?: number;          // async resolver debounce, default 200ms
  min?: number; max?: number; step?: number;
  rows?: number;                     // textarea
  lang?: string;                     // code

  config?: FieldConfig;

  // computed
  expression?: string;               // pure interpolation: '{firstName} {lastName}'
  compute?: (args: { values: Record<string, unknown> }) => unknown;
  editable?: boolean;                // computed: opt into editable mode

  // layout
  row?: string;                      // group with sibling fields on same row
  colSpan?: "full" | 1 | 2;
  width?: "full" | "half" | "third" | "quarter" | number;  // number = 0..1 fraction
  labelPosition?: "top" | "left";

  // misc
  disabled?: boolean;
  readOnly?: boolean;
  autoComplete?: string;
  autoFocus?: boolean;
}

/** Top-level form schema. */
export interface FormSchema {
  fields: ReadonlyArray<FieldDefinition>;
  validate?: (args: { values: Record<string, unknown> }) => Record<string, string> | undefined;
  zodSchema?: ZodObject<Record<string, ZodTypeAny>>;        // escape hatch — consumer-provided wins on conflict
  meta?: { id?: string; version?: string; title?: string; description?: string };
}

// ─── Callback arg shapes (object-shape per F-cross-12) ───────────────────────

export interface JsonFormValuesArgs<TValues> {
  values: TValues;
  formApi: JsonFormHandle<TValues>;
}

export interface JsonFormSubmitErrorArgs<TValues> {
  errors: Record<string, string>;
  formApi: JsonFormHandle<TValues>;
}

export interface JsonFormValidationChangeArgs {
  isValid: boolean;
  errors: Record<string, string>;
}

// ─── FieldRenderer (T1 lock — single canonical name) ─────────────────────────

export interface FieldRendererArgs {
  field: FieldDefinition;
  value: unknown;
  onChange: (next: unknown) => void;
  onBlur: () => void;
  error: string | undefined;
  disabled: boolean;
  readOnly: boolean;
  allValues: Record<string, unknown>;
  formApi: JsonFormHandle<Record<string, unknown>>;
}

export type FieldRenderer = (args: FieldRendererArgs) => ReactNode;

// ─── Imperative handle ────────────────────────────────────────────────────────

/**
 * Imperative handle. The 11 methods from the description are all here, plus a
 * plan-stage addition: `isSubmitting()` — cheap to expose (it's just an RHF
 * formState read) and consumers writing async submit flows reach for it
 * naturally. Non-controversial refinement.
 */
export interface JsonFormHandle<TValues = Record<string, unknown>> {
  submit: () => Promise<{ ok: boolean; values?: TValues; errors?: Record<string, string> }>;
  reset: (values?: Partial<TValues>) => void;
  setValue: (name: string, value: unknown) => void;
  getValue: (name: string) => unknown;
  getValues: () => TValues;
  setError: (name: string, message: string) => void;
  clearErrors: (name?: string) => void;
  trigger: (name?: string | string[]) => Promise<boolean>;
  focus: (name: string) => void;
  isDirty: () => boolean;
  isValid: () => boolean;
  isSubmitting: () => boolean;     // plan-stage addition (not in description)
}

// ─── Strings dictionary ───────────────────────────────────────────────────────

export interface JsonFormStrings {
  submit: string;                    // default 'Submit'
  reset: string;                     // default 'Reset'
  requiredIndicator: string;         // default '*'
  optionalIndicator: string;         // default '(optional)'  — used when consumer enables it
  loadingOptions: string;            // default 'Loading…'
  optionsError: string;              // default 'Failed to load options'
  optionsRetry: string;              // default 'Retry'
  noOptions: string;                 // default 'No options'
  summaryHeading: string;            // default 'Please fix the following errors:'
  submitFailed: string;              // default 'Submission failed. Please try again.'
  errorTemplates: {
    required: string;                // default 'This field is required'
    minLength: string;               // 'Must be at least {n} characters'
    maxLength: string;               // 'Must be at most {n} characters'
    min: string;                     // 'Must be at least {n}'
    max: string;                     // 'Must be at most {n}'
    pattern: string;                 // 'Value does not match the required pattern'
    email: string;                   // 'Must be a valid email address'
    url: string;                     // 'Must be a valid URL'
  };
}

// ─── Component props ──────────────────────────────────────────────────────────

export type ButtonVariant = "default" | "outline" | "ghost" | "secondary" | "destructive";

export interface JsonFormProps<TValues extends Record<string, unknown> = Record<string, unknown>> {
  // core
  schema: FormSchema;
  defaultValues?: Partial<TValues>;
  values?: Partial<TValues>;         // controlled mode — RHF `values` prop semantics

  // lifecycle (all object-shape)
  onSubmit: (args: JsonFormValuesArgs<TValues>) => void | Promise<void>;
  onSubmitError?: (args: JsonFormSubmitErrorArgs<TValues>) => void;
  onChange?: (args: JsonFormValuesArgs<TValues>) => void;
  onChangeDebounce?: number;         // default 100ms
  onValidationChange?: (args: JsonFormValidationChangeArgs) => void;

  // layout
  columns?: 1 | 2;
  labelPosition?: "top" | "left";    // default 'top'; per-field override wins
  showSummary?: boolean;
  summaryStrategy?: "always" | "post-submit";  // default 'post-submit'
  showSchemaHeader?: boolean;        // default true (A2 lock)

  // submit / reset surfaces
  submitButton?:
    | {
        label?: string;
        variant?: ButtonVariant;
        align?: "left" | "right" | "center";
        disableWhenInvalid?: boolean;
      }
    | ((args: { isSubmitting: boolean; isValid: boolean }) => ReactNode)
    | false;
  resetButton?: { label?: string; variant?: ButtonVariant };  // hidden by default

  // extensibility
  fieldRegistry?: Record<string, FieldRenderer>;
  renderField?: (args: { field: FieldDefinition; defaultRender: () => ReactNode }) => ReactNode;

  // RHF behaviour passthrough
  validationMode?: "onChange" | "onBlur" | "onTouched" | "onSubmit" | "all";  // default 'onTouched'

  // misc
  strings?: Partial<JsonFormStrings>;
  className?: string;
  style?: CSSProperties;
  ref?: Ref<JsonFormHandle<TValues>>;  // React 19 — ref as prop, not forwardRef
}

// ─── Standalone-parts contexts ────────────────────────────────────────────────

/** Returned by useJsonFormContext(). Shape mirrors JsonFormHandle but reads RHF context. */
export type JsonFormContextValue<TValues = Record<string, unknown>> = JsonFormHandle<TValues> & {
  rhf: UseFormReturn<TValues>;                              // escape hatch for power users
  schema: FormSchema;
  zodSchema: ZodObject<Record<string, ZodTypeAny>>;
  strings: JsonFormStrings;
  formId: string;                                            // from React 19 useId() — deterministic ID prefix for SSR-stable field IDs
};

/** useJsonForm factory return shape. */
export interface UseJsonFormReturn<TValues> {
  form: UseFormReturn<TValues>;       // RHF instance
  zodSchema: ZodObject<Record<string, ZodTypeAny>>;
  fieldList: ReadonlyArray<FieldDefinition>;
  isValid: boolean;
  isSubmitting: boolean;
  handle: JsonFormHandle<TValues>;
}

export interface UseJsonFormOptions<TValues> {
  defaultValues?: Partial<TValues>;
  values?: Partial<TValues>;
  validationMode?: "onChange" | "onBlur" | "onTouched" | "onSubmit" | "all";
  strings?: Partial<JsonFormStrings>;
}
```

---

## File-by-file plan

Sealed-folder shape (per CLAUDE.md). **42 files total** (verified by grep of the tables below). Each path is relative to `src/registry/components/forms/json-form/`.

### Top-level

| File | Purpose | Key exports |
|---|---|---|
| `json-form.tsx` | Top-level component. `'use client'`. Composes `<JsonFormProvider>` + RHF's `<FormProvider>` + a layout shell that walks `schema.fields` and renders each via the resolver chain (`renderField` → `fieldRegistry` → default). Wires Zod resolver, validation mode, submit/reset surfaces, error summary, meta header, imperative handle. Single `<form>` root. | `JsonForm` (default export + named) |
| `json-form-context.tsx` | React context that exposes `JsonFormContextValue` to descendants. Defines `JsonFormProvider`. Also defines `useJsonFormContext()` — the **accessor** hook (resolves H-04 from review). | `JsonFormProvider`, `useJsonFormContext` |
| `types.ts` | All types listed in §"Final API" above. | All types exported. |
| `index.ts` | Public-API barrel. Exports the component, standalone parts, both hooks, types, and the default registry as a value (for consumers extending it). **Does NOT re-export `meta`** — per F-cross-11 path-b lesson. | All public symbols. |
| `meta.ts` | `ComponentMeta` entry. Lists shadcn deps (`form`, `radio-group`, `slider`, `label`, `input`, `textarea`, `select`, `checkbox`, `switch`, `command`, `popover`, `calendar`, `button`, `separator`, `badge`, `tooltip`, `scroll-area`), npm deps (`react-hook-form`, `@hookform/resolvers`, `zod`, `lucide-react`), and the internal-registry dep (`@ilinxa/code-block`) under `dependencies.internal: ["code-block"]` (the key already exists in `ComponentDependencies` at `src/registry/types.ts:20`; json-form is the first component to use it — see T2 for the matching lint extension). | `meta` |
| `demo.tsx` | 7-tab demo (per success #15 lock): registration, backend-driven (mocked fetch), conditional, computed + sections, rich-fields (code + slider + rating), imperative API, custom registry. | Default export. |
| `usage.tsx` | Usage doc. Covers: basic shape, validators table, conditional examples, custom field registration, hook usage, accessibility notes, FAQ (why no built-in submit-disable, why submit only on Enter, etc.). | Default export. |
| `dummy-data.ts` | 6 named fixtures + their default-values: `registrationFormSchema`, `contactFormSchema`, `conditionalFormSchema`, `computedFormSchema`, `richFieldsFormSchema`, `adminUserFormSchema`. | All named exports. |

### `parts/` — field renderers + UI atoms (one renderer per field family where the variants share substrate; 16 files total)

| File | Field types covered | Substrate |
|---|---|---|
| `parts/field-text.tsx` | `text`, `email`, `password`, `url`, `tel`, `number` | shadcn `Input` (single component, `type` attr varies per FieldDefinition.type). `number` uses `z.coerce.number()` in the schema-compiler to handle the input-element's string → number conversion; the renderer itself just passes the raw string through `onChange` (RHF + Zod resolver coerce on validation). |
| `parts/field-textarea.tsx` | `textarea` | shadcn `Textarea` |
| `parts/field-select.tsx` | `select`, `multi-select` | shadcn `Select` (static, ≤ ~25 options); switches to `Command + Popover + Badge` for `searchable: true` OR `multi-select` |
| `parts/field-radio-group.tsx` | `radio-group` | shadcn `RadioGroup` (prerequisite install) |
| `parts/field-checkbox.tsx` | `checkbox` | shadcn `Checkbox` |
| `parts/field-checkbox-group.tsx` | `checkbox-group` | shadcn `Checkbox` × N inside a flex column |
| `parts/field-switch.tsx` | `switch` | shadcn `Switch` |
| `parts/field-date.tsx` | `date`, `date-range`, `time`, `datetime` | shadcn `Calendar` + `Popover` for date variants; native `<input type="time">` for `time`; combined Calendar+time for `datetime` (no shadcn primitive, hand-rolled in v0.1.0) |
| `parts/field-code.tsx` | `code` | Imports `@ilinxa/code-block` (`mode='edit'`) directly; `export default` shape required by `React.lazy`. The lazy boundary lives in `default-registry.ts` (`React.lazy(() => import('../parts/field-code'))`) so the chunk only ships when a `code` field appears in a form. **No `field-code-inner.tsx`** — single file, one lazy boundary. |
| `parts/field-slider.tsx` | `slider` | shadcn `Slider` (prerequisite install) |
| `parts/field-rating.tsx` | `rating` | Custom inline star widget. Lucide `Star` icon, fill state per index. Keyboard: arrow keys cycle, number keys jump. |
| `parts/field-computed.tsx` | `computed` | Read-only `<output>` element (HTML5 semantic) for non-editable; `field-text` re-used when `editable: true`. |
| `parts/field-hidden.tsx` | `hidden` | Renders `null`. Value tracked via RHF `register()` and ALWAYS included in submission (C1 lock). **Validation behavior:** declarative `validators` (e.g., `required`, `pattern`) DO apply at submit time — hidden fields can still fail validation (e.g., a CSRF token must be present). When validation fails on a hidden field, the error surfaces in the `<JsonFormErrorSummary>` (no inline display since there's no UI). |
| `parts/field-section.tsx` | `section` | `<fieldset>` + `<legend>`; consumers style via `[data-jsonform-section]`. |
| `parts/field-divider.tsx` | `divider` | shadcn `Separator`. |
| `parts/field-fallback.tsx` | unknown types | Renders an inline error placeholder + dev `console.warn`. |

### `parts/` — surface atoms (5 more files; 21 parts total)

| File | Purpose |
|---|---|
| `parts/form-header.tsx` | Renders `<h2>{meta.title}</h2>` + `<p>{meta.description}</p>` when `showSchemaHeader` is true and `meta` is present. |
| `parts/error-summary.tsx` | `<JsonFormErrorSummary>` standalone-part. `<div role="alert" aria-live="polite">` with `<h3>` heading and `<ul>` of anchor-linked errors. Respects `summaryStrategy`. |
| `parts/submit-button.tsx` | `<JsonFormSubmitButton>` standalone-part. Wraps shadcn `Button`. Reads `isSubmitting`, `isValid` from context. Honors `disableWhenInvalid` opt-in (default no). |
| `parts/reset-button.tsx` | `<JsonFormResetButton>` standalone-part. Wraps shadcn `Button` (variant `outline`). Calls `formApi.reset()`. |
| `parts/field-wrapper.tsx` | Shared layout shell — renders `<label>` + helper text + the renderer's output + error message. Handles ARIA wiring (`aria-required`, `aria-invalid`, `aria-describedby`). Used by every field renderer. |
| `parts/json-form-field.tsx` | `<JsonFormField name="...">` standalone-part. Looks up field by name in current schema, calls the resolver chain. Wraps in field-wrapper. |

### `hooks/` — RHF-aware logic

| File | Purpose | Returns |
|---|---|---|
| `hooks/use-conditional.ts` | Evaluates `visibleWhen` / `enabledWhen` / `requiredWhen` for one field. Internally subscribes only to the dependency set extracted from the Condition. Returns `{ visible, enabled, required }`. Counts toward the 50-conditional dev-warning ceiling. | `{ visible: boolean; enabled: boolean; required: boolean }` |
| `hooks/use-computed.ts` | Evaluates `expression` OR `compute` for a `computed` field. Uses dependency-extraction (template parse for `expression`; proxy-probe for `compute`) + RHF `watch(deps)`. | `unknown` (the computed value) |
| `hooks/use-debounced-callback.ts` | Tiny utility (~15 LOC): returns a debounced version of a callback. **Hand-rolled, no external dep** — `use-debounce` npm package would add a peer dep for ~15 lines of logic. Used by `onChange` debounce, async resolver debounce, async validate debounce. | `(args) => void` |
| `hooks/use-json-form.ts` | The **headless factory** hook. Builds the Zod schema (calls `compileSchema(schema, mergedStrings)` where `mergedStrings = { ...defaultStrings, ...options.strings }`), instantiates `useForm` with the resolver, wires `validationMode`, `defaultValues`, `values`, returns `UseJsonFormReturn`. Used internally by `<JsonForm>` AND exposed for power users. **strings flow:** `<JsonForm props.strings>` → `useJsonForm({ strings })` → `mergedStrings` → `compileSchema(strings)` for error templates → `<JsonFormProvider value={{ ..., strings }}>` for runtime use by `FieldWrapper` / `ErrorSummary`. | `UseJsonFormReturn<TValues>` |
| `hooks/use-async-options.ts` | For choice fields with async resolvers. Debounces the query, handles loading + error states, returns `{ options, loading, error, retry }`. | `{ options, loading, error, retry }` |

### `lib/` — pure functions

| File | Purpose | Exports |
|---|---|---|
| `lib/schema-compiler.ts` | Top-level entry: `compileSchema(schema, strings) → ZodObject`. Walks `schema.fields`, builds per-field Zod chains from `validators` blocks, applies `validate` / `validateAsync` via `.refine()` / `.refine(async)`, applies form-level `validate` via `.superRefine()`, handles `requiredWhen` via a final `.superRefine()` that conditionally enforces required-ness. Merges consumer's `zodSchema` LAST (consumer wins on conflict — M-03 lock + T8). **Dot-path → nested ZodObject:** fields with dot-paths like `'address.city'` group under their root segment and recurse: `{ address: z.object({ city: z.string() }) }`. Non-trivial — see risks. **`validate` + `validateAsync` interaction:** both run when present; sync error takes precedence (no async call if sync rejects); if sync passes, async runs and surfaces its error. | `compileSchema` |
| `lib/condition-evaluator.ts` | `evaluateCondition(cond, values) → boolean`. Handles all 11 operators + recursive `all`/`any`/`not`. `extractConditionDeps(cond) → Set<string>` for subscription optimization. | `evaluateCondition`, `extractConditionDeps` |
| `lib/expression-parser.ts` | Pure interpolation: `parseExpression(expr) → { template: string; deps: Set<string> }`. Splits `'{a} - {b}'` into `['', a, ' - ', b]` parts. `interpolate(template, values) → string`. Dot-path resolution: `{address.city}` reads `values.address.city`. | `parseExpression`, `interpolate` |
| `lib/default-registry.ts` | The default `FieldRenderer` registry: 16 entries (one per field-renderer file). Exposed publicly as `defaultJsonFormRegistry` for consumers to spread + extend. Dynamic-imports for the `code` field renderer via `React.lazy(() => import('../parts/field-code'))`. | `defaultJsonFormRegistry` |
| `lib/strings.ts` | Default English `JsonFormStrings` dictionary. Helper: `formatErrorTemplate(template, params) → string` — handles `{n}` placeholder substitution. | `defaultStrings`, `formatErrorTemplate` |
| `lib/path.ts` | Tiny dot-path helpers: `getByPath(obj, 'a.b.c')`, `setByPath(obj, 'a.b.c', value)`. RHF handles deep-set internally but `expression` interpolation needs read-side dot-path. | `getByPath`, `setByPath` |
| `lib/validate-schema.ts` | Dev-only sanity checks: duplicate field names (warn + dev error), > 50 active conditionals (perf-ceiling warn — O1 lock), unknown field types (warn). Called once per schema-compile inside `compileSchema`. | `validateSchemaDev` |

### Final inventory: **42 files**

Breakdown (verified via grep on the tables above):
- Top-level: 8 (`json-form.tsx`, `json-form-context.tsx`, `types.ts`, `index.ts`, `meta.ts`, `demo.tsx`, `usage.tsx`, `dummy-data.ts`)
- `parts/` field renderers: 16
- `parts/` surface atoms: 6 (form-header, error-summary, submit-button, reset-button, field-wrapper, json-form-field)
- `hooks/`: 5
- `lib/`: 7

Comparable to: file-manager (32 files), code-block (42 files), rich-card (51 files). Sits at the upper end of the sealed-folder norm — appropriate for the surface size.

---

## Dependencies

### Locked npm versions (verified via `pnpm view` 2026-05-12)

```json
{
  "react-hook-form": "^7.75.0",
  "@hookform/resolvers": "^5.2.2",
  "zod": "^4.4.3",
  "lucide-react": "^1.11.0"
}
```

All four go in `meta.ts` `dependencies.npm`. RHF + resolvers + zod are NEW project deps; lucide-react is already present.

### Prerequisite shadcn primitives (must be added BEFORE scaffolding)

Single command before `pnpm new:component`:

```bash
pnpm dlx shadcn@latest add form radio-group slider label
```

The prerequisite step lands in the same PR as the implementation (lockfile churn captured + reviewed together). All four primitives go in `meta.ts` `dependencies.shadcn`.

Already-present primitives the component re-uses (also declared in `meta.ts`): `input`, `textarea`, `select`, `checkbox`, `switch`, `command`, `popover`, `calendar`, `button`, `separator`, `badge`, `tooltip`, `scroll-area`.

### Internal-registry dependency (cross-registry — T2)

`@ilinxa/code-block` (shipped v0.1.0) — slotted by `field-code.tsx` for the `code` field type.

**`validate-meta-deps` declaration shape:** the `dependencies.internal?: string[]` key **already exists** in the `ComponentDependencies` type (`src/registry/types.ts:20`) — json-form is the first component to actually USE it. No existing component declares an internal dep; review confirmed zero matches in `scripts/validate-meta-deps.mjs` for `internal`, so the lint currently passes-through silently. The plan-stage extension:

1. Scans imports for `@ilinxa/<slug>` patterns within registry component sources.
2. Verifies every detected slug appears in the component's `dependencies.internal`.
3. Verifies every declared internal slug exists in the registry's `manifest.ts` (= it's a real shipped component).
4. Estimated ~30-50 LOC change to `scripts/validate-meta-deps.mjs`.

If the lint extension proves trickier than estimated, fall back to declaring `@ilinxa/code-block` correctly under `dependencies.internal` anyway (the key exists, so the meta.ts is type-clean) and ship the lint extension in a follow-up PR. Either way the meta.ts shape is locked.

### React 19 compat verified

- `react-hook-form@^7.75.0` peer = `react ^16.8.0 || ^17 || ^18 || ^19` — works ✓
- `@hookform/resolvers@^5.2.2` peer = `react-hook-form ^7.55.0` — works ✓
- `zod@^4.4.3` — no peer dep, pure TS — works ✓

### Zod v3 → v4 refinement (refinement from description Q2)

Description said `zod@^3.x`; plan refined to `^4.4.3`. Reasoning:

- v4 is the current stable (released earlier in 2026; mature).
- @hookform/resolvers v5 supports v4 via standard-schema spec — same import path (`@hookform/resolvers/zod`).
- v4 has better type inference, faster runtime, smaller bundle.
- No reason to ship v3 today.

Notable v4 changes the implementation must handle:

- `z.string().email()` is now `z.email()` (top-level).
- `z.coerce.number()` works identically — used by `number` field type.
- Async refinements (`.refine(async)`) work identically.
- Discriminated unions slightly stricter — won't affect json-form internals.

---

## Verification approach (no unit tests in v0.1.0)

Per STATUS.md "Test runner not wired" informed-defer: v0.1.0 ships WITHOUT Vitest / unit tests. Verification rests on four layers:

1. **`pnpm tsc --noEmit`** — types compile across the 42 files + the public API contract.
2. **`pnpm lint`** — code style + obvious bugs.
3. **`pnpm build`** — Next.js + Turbopack production build clean.
4. **`pnpm validate:meta-deps`** — declared deps match shipped imports (the lint extension for `dependencies.internal` ships in the same PR per T2 + P-01).
5. **Manual demo verification** — all 7 demo tabs at `/components/json-form` rendered + interacted-with in dev mode.
6. **Smoke harness (path-b consumer-tsc)** — `pnpm dlx shadcn@latest add @ilinxa/json-form` from `e:/tmp/ilinxa-smoke-consumer/`; consumer-side `pnpm tsc --noEmit` clean.
7. **GATE 3 spot-check review** — structural review per `.claude/rules/component-readiness-review.md`.

**Unit tests are deferred** to the project-wide testing decision (per STATUS.md). When that lands, candidate first-tests for json-form: `lib/expression-parser.ts` (parse `{a.b.c}` interpolation, escape edge cases) + `lib/condition-evaluator.ts` (all 11 operators + recursion) + `lib/schema-compiler.ts` (dot-path → nested ZodObject construction, the most complex pure-function module).

---

## Composition pattern

```
<JsonForm schema={...} onSubmit={...}>
  └── 'use client'
  └── <JsonFormProvider value={ctx}>            (our context — JsonFormContextValue)
      └── <FormProvider {...rhfMethods}>         (RHF context)
          └── <form onSubmit={handleSubmit}>
              └── [optional] <FormHeader />       (if meta + showSchemaHeader)
              └── [optional] <ErrorSummary />     (if showSummary && conditions met)
              └── {schema.fields.map(renderFieldResolverChain)}
              └── <SubmitButton /> + [optional] <ResetButton />
```

**Resolver chain** for each field:

```ts
function renderFieldResolverChain(field: FieldDefinition): ReactNode {
  const defaultRender = () => {
    const renderer = mergedRegistry[field.type] ?? defaultRegistry["__fallback__"];
    return <FieldWrapper field={field}><renderer {...args} /></FieldWrapper>;
  };
  return props.renderField
    ? props.renderField({ field, defaultRender })
    : defaultRender();
}
```

**FieldWrapper** is the single source of ARIA truth — every field gets the same label/error/helper-text shell. Per-field renderers only render the input itself.

**Conditional logic** lives in `FieldWrapper`:

```ts
const { visible, enabled, required } = useConditional(field);
if (!visible) return null;            // unmount — strips from form state via RHF unregister if !keepValueWhenHidden
const ariaProps = { 'aria-required': required, 'aria-invalid': hasError, 'aria-describedby': ... };
// renderer receives `disabled: !enabled || field.disabled`
```

**Computed fields** subscribe via `useComputed`:

```ts
const value = useComputed(field);     // re-renders only when deps change
return <output>{value}</output>;
```

**Multi-instance isolation:** Each `<JsonForm>` mounts a fresh `<FormProvider>`. Multiple forms on the same page share zero state — covered by RHF's default scoping.

---

## Client vs server

- **`'use client'` on:** `json-form.tsx`, `json-form-context.tsx`, every `parts/*.tsx`, every `hooks/*.ts` (hooks need the runtime).
- **Pure `.ts` files (no directive):** `types.ts`, `lib/*.ts` (schema-compiler, condition-evaluator, expression-parser, default-registry, strings, path, validate-schema).
- **RSC variant — NOT in v0.1.0.** RHF requires the client runtime. A hypothetical `@ilinxa/json-form/server` variant could pre-render the schema's chrome (headers, labels) for SEO/SSR-of-initial-paint, but interactivity demands hydration. Deferred indefinitely.

No `next/*` imports anywhere in the registry folder (per CLAUDE.md portability rule). The component renders inside any React 19 app, not just Next.js.

---

## Edge cases

| Case | Behaviour |
|---|---|
| Empty `fields: []` | Renders header (if meta) + submit button. No fields, no errors, no validation. |
| Unknown field `type` | Renders `field-fallback.tsx` with an inline error placeholder + dev `console.warn`. Form continues. |
| Duplicate field names | Dev `console.error` + render first occurrence + warn. Production: silent first-occurrence render. (Q12) |
| Conditional cycle (A visible when B visible when A) | Detected at compile-time via `validateSchemaDev`: walks the dependency graph, flags cycles, dev warns. Runtime falls back to "always true." |
| Computed field references itself | Same as above — detected + warned + falls back to empty string. |
| Computed `expression` references unknown field | Renders empty for that segment + dev warns. |
| Async resolver throws | UI shows "Failed to load options" + retry button. Form continues. |
| Async resolver pending on submit | Submit blocks until pending validation resolves (RHF native behavior). |
| `defaultValues` has extra keys not in schema | Preserved silently (Q22 behavior). Useful for hidden state. |
| `schema` prop changes identity | Form re-mounts (RHF re-initializes). Documented as a footgun — consumers should memoize their schemas. |
| `values` prop (controlled) | RHF resets to these every render (RHF v7 `values` prop). Consumer owns external state-of-record. |
| Submit fires on Enter inside textarea | NO — `<textarea>` Enter inserts newline (standard browser behavior). Documented. |
| Submit fires on Enter inside other text fields | YES — `<button type="submit">` captures Enter. Standard form behavior. |
| Network error during async submit | Thrown error from `onSubmit` surfaces as form-level error via `<ErrorSummary>` + dev-warn. |
| `requiredWhen` evaluates true after initial render | Field gains the required asterisk + Zod re-validates on next submit attempt. |
| Disabled field with validator | Validation skipped (RHF doesn't validate disabled fields by default). |
| Section/divider `name` | REQUIRED on the type — used as the React key. Convention: prefix with `_` (e.g., `'_personal'`, `'_divider1'`). Compiler ignores it for ZodObject construction. |
| Multiple JsonForm on same page | Each owns its own RHF + JsonFormProvider context. No cross-contamination. |
| `<JsonFormField name="x">` rendered outside a JsonForm | `useJsonFormContext()` throws a dev-friendly error: "useJsonFormContext must be used inside a <JsonForm>." |
| > 50 active conditionals | `validateSchemaDev` emits a dev warning. Component still works; perf may degrade. |
| Value-shape divergence across field types | Single `name` can produce a primitive (`string` for `text`/`email`/`date`), a number (`number`/`slider`/`rating`), a boolean (`checkbox`/`switch`), an array (`multi-select`/`checkbox-group`: `unknown[]`), or an object (`date-range`: `{ start, end }`). `TValues` generic is the consumer's responsibility to type per-field. Documented in usage.tsx with a value-shape-per-type table. |
| `validate` and `validateAsync` both set on a field | Sync runs first; if it returns an error, async is skipped (perf + UX win — no need to call the network if sync already failed). If sync passes, async runs and its result surfaces. Documented. |

---

## Accessibility

| Concern | Implementation |
|---|---|
| Label association | Every input has a `<label for={fieldId}>` rendered by `FieldWrapper`. Field IDs are deterministic and SSR-stable: `${formId}-${field.name}` where `formId` comes from React 19's `useId()` called once at the top of `<JsonForm>` and passed via `JsonFormContextValue`. Dot-paths in `field.name` are normalized (`.` → `_`) in the ID slug so HTML id attributes stay valid. |
| Visually-hidden labels | When `field.labelPosition === 'sr-only'` (NOT in v0.1.0 type — deferred; for now all labels are visible). |
| `aria-required` | Set when static `required: true` OR `requiredWhen` evaluates true. |
| `aria-invalid` | Set when the field has a current error. |
| `aria-describedby` | Links to helper text and/or error message via deterministic IDs (`${fieldId}-description`, `${fieldId}-error`). |
| Error messages | `<p role="alert" id={errorId}>{message}</p>` — announced by screen readers. |
| Error summary | `<div role="alert" aria-live="polite">` with `<h3>` and `<a href="#${fieldId}">` anchor links. Focus moves to summary on submit failure. |
| Submit button | `<button type="submit">` — Enter in any field fires it (browser default). |
| Reset button | `<button type="reset" onClick={preventDefault + formApi.reset()}>` — own handler, prevent native reset. |
| Focus management | On submit failure, focus moves to the first error field (DOM order). Implementation: post-validation effect calls `formApi.focus(firstErrorName)`. |
| Section semantics | `<fieldset>` + `<legend>{label}</legend>`. Native group semantics for screen readers. |
| Radio groups | shadcn `RadioGroup` wraps Radix's `<RadioGroupRoot>` which provides correct keyboard nav (arrow keys cycle, space selects). |
| Checkbox groups | Each `<Checkbox>` keyboard-navigable via tab. No special grouping (HTML doesn't have a checkbox-group primitive). |
| Switch | shadcn `Switch` → Radix `Switch` → button with `role="switch"` + `aria-checked`. |
| Calendar | shadcn `Calendar` → react-day-picker. Full keyboard support (arrow keys, page-up/down). |
| Time inputs | Native `<input type="time">` — keyboard-accessible by default. |
| Slider | shadcn `Slider` → Radix `Slider`. Arrow keys adjust by step. |
| Rating | Custom widget: `role="radiogroup"`, each star is `role="radio"` with `aria-checked`. Arrow keys cycle, number keys jump (1-N). |
| Computed field | `<output>` element — `role="status"` implicit; not focusable. |
| Hidden field | Renders nothing — no a11y concern. |
| Divider | `<hr role="separator">` (shadcn `Separator`). |
| Live region | The `<ErrorSummary>` doubles as the form's live region. Validation state changes announce via `aria-live="polite"`. |
| Loading async options | Combobox shows `<span role="status">{strings.loadingOptions}</span>` inline. |
| Lighthouse target | a11y ≥ 95 on the demo page. |

---

## Risks & alternatives

### Risks

1. **Dot-path → nested ZodObject construction is non-trivial.** Fields with names like `'address.city'`, `'address.zip'`, `'profile.social.twitter'` must group under their root segment and recurse to build a correctly-nested `ZodObject`. The naive approach (build flat keys and let Zod typecheck them as strings) breaks down for any consumer that does `formApi.getValues().address.city`. Mitigation: dedicated test fixtures in `dummy-data.ts` covering 1, 2, and 3-level deep dot-paths; impl in `lib/schema-compiler.ts` uses a path-trie + post-order ZodObject construction. Estimated 60-80 LOC. Real complexity flagged here so it doesn't surprise mid-implementation.

2. **Zod v3 → v4 migration surprises.** Internal compile logic uses v4 API. If a consumer pins zod@^3 in their app, our resolved Zod will conflict at the type level. Mitigation: declare zod as a peer dep at v4+ in `meta.ts`; document the requirement in usage.tsx; verify shadcn-add lock includes zod v4.

3. **`@hookform/resolvers` v5 is relatively new** (released Q1 2026). API may shift in patch versions. Mitigation: pin `^5.2.2` (not `^5.x`), validate-meta-deps locks the exact range, lockfile in repo.

4. **Conditional dependency tracking via proxy-probe (`compute` function deps)** is brittle for compute functions with conditional branches (`if (x) read y; else read z;` — proxy only sees the branch taken on first run). Mitigation: document the limitation; recommend `expression` for simple cases (deterministic dep extraction via template parse); provide an optional `dependsOn?: string[]` field-DSL key in v0.1.x as an explicit override.

5. **Cross-registry dep lint extension scope (T2).** Extending `validate-meta-deps.mjs` to scan `@ilinxa/<slug>` imports is new territory. Mitigation: meta.ts shape locks regardless (`dependencies.internal` key already in type system); if the lint extension blows scope, ship the declaration correctly and extend the lint in a follow-up PR (P-01 alternative path).

6. **Bundle bloat from shadcn primitives we add.** `form`, `radio-group`, `slider`, `label` each pull in a Radix primitive. Estimated +30-40KB total minified. Acceptable for a forms component but worth measuring. Mitigation: bundle audit in GATE 3 review.

7. **`'use client'` boundary mismatch in Next.js apps.** Consumers placing `<JsonForm>` deep inside a server-component subtree will hit hydration warnings if their schema is computed on the server then mismatched on the client. Mitigation: document the pattern in usage.tsx — schemas must round-trip JSON-cleanly.

8. **`renderField` slot can break a11y if consumers don't wrap with `FieldWrapper`.** Mitigation: document explicitly; export `FieldWrapper` as a standalone part for consumer use; recommend `defaultRender()` over hand-rolling.

9. **Computed expression parser is hand-written (no formal grammar).** Bugs in dot-path resolution or escape characters in field names could surface as silent failures. Mitigation: unit-test the parser (manual test fixtures in `dummy-data.ts` cover edge cases like field names with periods, empty templates, fields-with-spaces).

### Alternatives considered

- **TanStack Form instead of RHF.** Newer (v0.x), smaller, framework-agnostic. Pros: smaller bundle, better TS inference. Cons: less mature, smaller ecosystem, shadcn's `Form` is RHF-based. **Rejected** — RHF is the stable industry-standard and what the project's primitives already wrap.

- **Conform-To instead of RHF.** Progressive enhancement, server-actions-friendly. Pros: works without JS, server-actions native. Cons: violates registry portability rule (Next-specific patterns). **Rejected.**

- **JSON-Schema 2020-12 spec instead of custom DSL.** Pros: standard, portable. Cons: verbose, weak at UX hints (placeholder, helper, computed-from). **Rejected** (GATE 1 lock).

- **Building from scratch (no RHF).** Pros: lighter, full control. Cons: re-implements 1000s of person-hours of RHF refinement (uncontrolled inputs, narrow re-renders, validation timing). **Rejected** — properties-form already covers the lightweight case; json-form is intentionally heavier.

- **Form-renderer + Form-builder as 2 procomps.** Pros: cleaner separation. Cons: 2x procomp overhead, builder is v0.2 anyway. **Rejected** (GATE 1 lock).

---

## Plan-stage tightening resolutions (T1–T9)

| ID | Resolution |
|---|---|
| T1 | `FieldRenderer = (args: FieldRendererArgs) => ReactNode`. `FieldRendererArgs` defined exhaustively in §"Final API". Single canonical name (no `FieldRendererComponent` alias). |
| T2 | Use the existing `dependencies.internal?: string[]` key (already in `ComponentDependencies` at `src/registry/types.ts:20`; json-form is the first to use it). `meta.ts` declares `dependencies.internal: ["code-block"]`. Lint script `scripts/validate-meta-deps.mjs` gains a branch that scans `@ilinxa/<slug>` imports and verifies the declared list — implementation lands in the same PR. If the lint extension is non-trivial, ship json-form with the correct `internal` declaration anyway (type-clean) and follow-up the lint extension in a later PR. |
| T3 | Single-file lazy: `default-registry.ts` does `const FieldCode = React.lazy(() => import('../parts/field-code'))`. `field-code.tsx` `export default`s the field-renderer and imports `@ilinxa/code-block` directly — that import becomes part of the lazy chunk. A `<Suspense fallback={<FieldLoadingShell />}>` lives at the render-chain level (inside `<FieldWrapper>`) so every dynamic field gets a uniform loading state. Other rich/composite types (`slider`, `rating`) are small enough to ship synchronously — no lazy wrapper. |
| T4 | `readOnly: true` = field is rendered but uneditable; value IS submitted; `<input readonly>`. `disabled: true` = field is rendered greyed + not focusable; value IS submitted; `<input disabled>`. `enabledWhen: false` is equivalent to `disabled: true` for that render cycle. Documented in usage.tsx. |
| T5 | `pnpm dlx shadcn@latest add form radio-group slider label` runs as the first commit in the json-form PR. Lockfile churn (`pnpm-lock.yaml` + `src/components/ui/*.tsx`) lives in the same PR for atomic review. |
| T6 | Versions locked: `react-hook-form@^7.75.0`, `@hookform/resolvers@^5.2.2`, `zod@^4.4.3`. Verified via `pnpm view` 2026-05-12. Description's `zod@^3.x` refined to `^4.4.3` (current stable). |
| T7 | `truthy: true` → JS-truthy check (`!!value`); `truthy: false` → `!value`. Edge cases documented: `'0'` is truthy (string), `0` is falsy (number), `[]` is truthy (array reference), `''` is falsy. Table lands in usage.tsx. |
| T8 | `compileSchema` builds a ZodObject from the field DSL, then deep-merges with `schema.zodSchema` if present using the algorithm: for each key in `schema.zodSchema.shape`, replace the DSL-generated entry. Consumer-provided takes precedence per key. Worked example in usage.tsx with `email`: DSL `validators.minLength: 3` + consumer `z.string().email().min(5)` → final schema is the consumer's `.email().min(5)`. |
| T9 | `FieldDefinition.name` is REQUIRED for all field types — including `section` and `divider`. For non-value-carrying types, `name` is used purely as a stable React key; consumer convention is to prefix with `_` (e.g., `'_personal'`, `'_divider1'`) to signal "no value produced." This matches the description's Example 4 precedent and avoids a 24-variant TS discriminated union or runtime checks. Compiler ignores `name` for `section`/`divider` types when building the ZodObject — those types don't contribute a key to the validated shape. |

---

## Plan-stage open questions (re-validation pass surfaced)

> Each numbered. User resolves before sign-off.

1. **P-01 — `validate-meta-deps` lint extension scope.** The `dependencies.internal` key already exists in the `ComponentDependencies` type; what's missing is lint *enforcement* (validate-meta-deps.mjs currently doesn't scan for `@ilinxa/<slug>` imports vs declarations). Estimated 30-50 LOC change. **Recommendation: include the lint extension in the json-form PR.** Alternative: ship json-form's meta.ts with the correct `dependencies.internal: ["code-block"]` declaration (already type-clean — no shape change needed), extend the lint in a follow-up PR. Both paths are valid; first is cleaner.

2. **P-02 — Rating widget keyboard model.** v0.1.0 ships rating with arrow keys (cycle ±1) + number keys (jump 1-N). **Recommendation: also support Home/End** (jump to first/last star) for fuller keyboard parity with shadcn Slider. Costs ~5 LOC.

3. **P-03 — `time` field — native `<input type="time">` or custom dropdown?** Native is accessible and keyboard-friendly but stylistically inconsistent with shadcn primitives. Custom dropdown (hours/minutes Selects) matches shadcn but is more code. **Recommendation: native `<input type="time">` in v0.1.0**, styled to align with shadcn Input via Tailwind. Custom dropdown landing in v0.2 if visual inconsistency surfaces.

4. **P-04 — `datetime` field — combined Calendar+time or two side-by-side?** Combined puts the time input INSIDE the calendar popover (matches Notion). Side-by-side has two separate fields (calendar + time-of-day). **Recommendation: combined inside the Popover** — single ISO 8601 string value, single field-DSL entry, single error.

5. **P-05 — `multi-select` chip overflow.** When many selections, chips wrap. Should there be a max-displayed-chips cap with a "+N more" badge? **Recommendation: ship without a cap in v0.1.0**; document the wrap behavior. Add `maxChipsBeforeOverflow: number` config in v0.2 if real consumers complain.

6. **P-06 — `compute` proxy-probe failure modes.** A `compute` function that branches on the FIRST call's values may miss deps used in other branches. **Recommendation: document the limitation; add `dependsOn?: string[]` field-DSL key in v0.1.x as an explicit override** (additive, non-breaking).

7. **P-07 — `<JsonFormProvider>` standalone use without `<JsonForm>`.** Power users may want to render a custom form layout from scratch while still using our context. **Recommendation: support it**: `<JsonFormProvider value={ctx}>` takes a context value directly. Consumers can build the context via `useJsonForm(schema)`. Documented in usage.tsx as the "fully-headless" pattern.

8. **P-08 — Schema-validation strictness.** `validateSchemaDev` runs at compile time and dev-warns on issues. Should it ALSO throw in dev (not just warn) on critical errors (duplicate names, cyclic conditionals)? **Recommendation: warn-only in v0.1.0** — throwing breaks the consumer's app while they're iterating; warning surfaces the issue without blocking. Upgrade to `throw` in v0.2 if real consumers ship broken schemas to prod.

9. **P-09 — `defaultValues` deep-merge vs replace semantics.** When both `schema.fields[i].defaultValue` (per-field) and props `defaultValues[i]` (form-level) are set, which wins? **Recommendation: form-level wins** (matches RHF mental model — `useForm({ defaultValues })` is the source of truth). Per-field `defaultValue` fills gaps for keys absent from form-level. Documented.

10. **P-10 — Async submit cancellation.** If the user submits, edits, and submits again before the first promise resolves, do we cancel the first? RHF doesn't auto-cancel. **Recommendation: don't auto-cancel in v0.1.0**; document that consumers wanting cancellation can wrap their `onSubmit` with an AbortController. Add `cancelInFlightOnSubmit?: boolean` in v0.2 if asked.

11. **P-11 — `onChange` debounce and `values` (controlled) prop interaction.** `onChange` debounce 100ms means a controlled-mode parent receives values 100ms after the user types. **Recommendation: debounce default 100ms holds**, but document that controlled-mode consumers may want `onChangeDebounce: 0` for tight sync. **Anti-pattern:** using both `values` (controlled) AND `onChange` (change-tracking) is double-bookkeeping — the consumer's external state IS the source-of-truth, so `onChange` becomes redundant. Guide explicitly says: "pick one — `onChange` for tracking changes outward, `values` for syncing changes inward; using both invites consistency bugs."

12. **P-12 — Error display position when label is left-aligned.** With `labelPosition: 'left'`, where does the error message go? Below the input (right column)? Below both label + input (full-width)? **Recommendation: below the input only (right column)** — keeps the visual rhythm of the form. Document.

13. **P-13 — Demo "backend-driven" tab — what's the mocked endpoint?** Demo needs a fake `fetch()` that resolves to a sample schema. **Recommendation: ship a `/dummy-data` export `mockFetchSchema(formId: string)` returning a promise** that resolves after 800ms with one of the bundled fixtures (`registrationFormSchema`, `contactFormSchema`, etc.). Documented in usage.tsx.

14. **P-14 — `schema.zodSchema` and the v4 import path.** Consumers passing `zodSchema` must use zod v4. If they're stuck on v3, the type union fails. **Recommendation: declare a peer-dep `zod@^4` in `meta.ts`**, document the upgrade requirement in usage.tsx FAQ. v0.2 could add a `zod-v3` compat shim if real consumers report blockers.

---

## Sign-off

> **Awaiting user sign-off.** Once confirmed, scaffolding (`pnpm new:component forms/json-form`) and implementation begin — preceded by `pnpm dlx shadcn@latest add form radio-group slider label`.

### What the implementation PR will contain (in order)

1. `pnpm dlx shadcn@latest add form radio-group slider label` (lockfile churn + 4 new ui/ files).
2. `pnpm add react-hook-form@^7.75.0 @hookform/resolvers@^5.2.2 zod@^4.4.3` (3 new npm deps).
3. `validate-meta-deps` lint extension (if P-01 resolves to "in this PR").
4. `pnpm new:component forms/json-form` (scaffold from `src/registry/components/_template/_template/` per the scaffolder's wired-in path).
5. Implementation of 42 files per the file-by-file plan above.
6. `manifest.ts` 3-line edit registering json-form in the docs site.
7. `registry.json` 2-item edit (base + fixtures items) per the locked target convention.
8. `pnpm tsc --noEmit && pnpm lint && pnpm validate:meta-deps && pnpm build` — all clean.
9. Demo verified at `/components/json-form` (7 tabs, all rendering).
10. Smoke harness: `pnpm dlx shadcn@latest add @ilinxa/json-form` from `e:/tmp/ilinxa-smoke-consumer/`; consumer-side `pnpm tsc --noEmit` clean.
11. `docs/procomps/json-form-procomp/json-form-procomp-guide.md` authored.
12. GATE 3 spot-check review at `docs/procomps/json-form-procomp/reviews/2026-05-XX-v0.1.0-spotcheck.md` (5 dimensions: procomp docs, registry distribution, meta+manifest sync, verification, plus one rotating dimension — recommended **Public API** given the surface size).
13. STATUS.md update (Components table row + Recent activity pointer + Active queue strikethrough).
14. Decision file at `.claude/decisions/2026-05-XX-json-form-v01-pipeline.md`.

### Estimated effort

- Scaffolding + types + schema-compiler + condition-evaluator: ~1 session
- Built-in field renderers + field-wrapper + ARIA: ~1-2 sessions
- Hooks + lib + dynamic-import wiring: ~1 session
- Demo + usage + dummy-data: ~1 session
- Smoke harness + review + decision file + STATUS: ~0.5 session

**Total: ~5 sessions** — large but bounded.

After sign-off + GATE 3 verdict ≥ "Pass with follow-ups", json-form pushes to master and Vercel auto-deploys.
