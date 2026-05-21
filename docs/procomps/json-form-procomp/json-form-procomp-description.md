# json-form — procomp description

> Stage 1: what & why. The "should we build this at all?" doc.
>
> **Status (2026-05-22):** this document is the v0.1.0 GATE 1 lock — kept as historical record. The current shipped surface is **v0.2.5**. Several incremental ships have landed since v0.1.0: `richtext` field type (v0.1.1), `ariaProps` bridge replacing `Slot.Root` (v0.1.2), narrow-deps conditionals + lifecycle callbacks (v0.1.6), `defineFieldRenderer<TValue,TConfig>` + narrow-deps headless hooks (`useJsonFormFieldValue` / `useJsonFormFieldsValue`) + `<JsonFormDevtools>` (v0.1.7), per-field subscription gate via the `BUILTIN_RENDERER_TYPES_SKIPPING_ALL_VALUES` whitelist + deep-merge `defaultValues` (v0.2.0), `<JsonFormProvider>` bridges RHF's `<FormProvider>` internally (v0.2.4), `<FieldRadioGroup>` always-controlled (v0.2.5). Source of truth for **current** API surface: [`json-form-procomp-guide.md`](json-form-procomp-guide.md) + the v0.2.0 plan at [`json-form-procomp-plan-v0.2.0.md`](json-form-procomp-plan-v0.2.0.md). Sketches in this doc (rough API signatures, "in scope (v0.1.0)" lists, "out of scope" deferrals) are intentionally not back-edited; some have been superseded.
>
> **Greenfield component.** Not a migration. Sibling-not-replacement of the shipped `properties-form` (v0.1.1) — the two share the "render typed fields from a spec" family but split on intent. `properties-form` is **edit-an-entity** (lightweight hand-rolled state, ~300 LoC, no RHF, read↔edit toggle, per-field permissions — wired into `detail-panel` + force-graph). `json-form` is **author-a-form-from-JSON** (RHF + Zod substrate, extensible field registry, conditional logic, computed fields, rich field types — the runtime engine for registration forms, surveys, CMS-driven forms, admin schemas). They coexist; the guides cross-reference. This doc anchors the central-form-system concept long-promised in the active queue.

## Problem

Every meaningful app in the ilinxa orbit (and any consumer app built on this library) eventually needs the same surface: **a runtime-defined form, described by JSON, rendered with proper field types, validated against a typed schema, with conditional fields that show / hide / require based on other fields, and a clean submit flow**. The list is unsurprising — registration, onboarding, profile editing, settings panels, multi-section signups, surveys, A/B-tested form variants, admin panels with backend-defined schemas, CMS-authored content forms, low-code form builders, support intake forms, content moderation tools, billing flows.

Today there are three flavors of "form" in the codebase + reachable consumer apps:

- **Hand-rolled forms per surface** — what teams actually do. Every form is a bespoke composition of shadcn `Input` / `Select` / `Checkbox` + a hand-written validation function. Validation diverges per surface (some throw, some return errors, some swallow). A11y wiring (`<label for>`, `aria-invalid`, `aria-describedby`) is correct on the careful pages, wrong on the rushed ones. When the backend ships a new field, the frontend rebuilds the form. When marketing wants an A/B'd version, devs duplicate the form. When the CMS team wants to author a contact form without code, they can't.
- **`properties-form`** — already shipped, but explicitly scoped to "edit an entity": 6 hardcoded field types, no conditional logic in v0.1, no async option loading, no rich-composite fields, no multi-step. Its design budget (~300 LoC, no RHF) is correct for what it does — settings panels, detail-panel inline edits, force-graph node editing — and we are NOT going to inflate it.
- **`react-jsonschema-form` (RJSF) / Formily / FormKit / SurveyJS** — third-party "JSON form" libraries. Each ships its own renderer stack, theme system, and component primitives. None speak shadcn, none honor the ilinxa design tokens (signal-lime, OKLCH, Onest/JetBrains Mono), none compose with the procomps we ship now or plan to ship (`code-block` today; future `file-upload-01`, `color-picker-01`, and a Plate-based richtext substrate when those land). Adopting one means writing a heavy adapter layer that re-skins their renderers against our primitives and tokens — a months-long project for a half-result. RJSF in particular pins to JSON Schema 2020-12, which is verbose and weaker at expressing the field-level UX hints (placeholder, helper text, computed-from) that real forms need.

This component closes that gap. **`json-form` is the runtime form engine the project has needed since day one** — a JSON-described form that:

1. Compiles its field DSL to a Zod schema at runtime (single source of validation truth).
2. Uses `react-hook-form` v7 as the state substrate (the industry-standard, performance-tested choice — uncontrolled by default, narrow re-renders, the same library shadcn's own `Form` component wraps).
3. Renders each field through a **renderer-registry** the consumer can extend (proven pattern from `workspace` + `kanban-board-01`).
4. Slots existing procomps as first-class field types: `code-block` in edit mode for code fields (shipped today). Future `file-upload-01`, `color-picker-01`, and a Plate-based richtext substrate land as additive v0.1.x extensions when those procomps ship — none of them are required for the v0.1.0 ship.
5. Honors a declarative conditional-logic layer (`visibleWhen` / `enabledWhen` / `requiredWhen`) plus a `computed` field type for derived values — covers ~95% of real-world form reactivity without consumers writing reactive code.
6. Stays in pure JSON. Consumers can author the schema in TypeScript, load it from a database, parse it from a CMS, or pipe it from a backend endpoint. The library does not require the schema to be a JavaScript value at build time — it works equally well with runtime JSON.

The consumer is a **frontend dev with a form definition (a JSON shape) and the requirement "render this professionally, validate it correctly, handle conditional fields, submit it cleanly, and let me drop it inside any page"**. They do not want to wire RHF themselves, build per-field a11y, write reactive `watch()` subscriptions, or maintain a renderer stack.

## In scope (v0.1.0)

**JSON-driven authoring** — single `schema` prop accepting either an inline TS object or a JSON-deserialized runtime value. Round-trips cleanly: any schema authored in TS can be stringified, persisted, and re-rendered identically. **No build-time compilation required** — schemas can come from `fetch()`, localStorage, a CMS, or a database column.

**Substrate locked: `react-hook-form` v7 + `@hookform/resolvers/zod`** — the industry-standard React form library. Uncontrolled by default for performance (only the dirty fields re-render). Zod compiled from the DSL becomes the single resolver.

**Prerequisite shadcn primitives (must be added via `pnpm dlx shadcn@latest add` before json-form can be built)** — verified against the current `src/components/ui/` inventory:

- `form` — shadcn's RHF-aware Form primitive (`Form` / `FormField` / `FormItem` / `FormLabel` / `FormControl` / `FormDescription` / `FormMessage`). NOT yet in the project; required as the base composition layer so json-form composes WITH shadcn's existing form primitives, not against them.
- `radio-group` — required for the `radio-group` field type. NOT yet in the project.
- `slider` — required for the `slider` field type. NOT yet in the project.
- `label` — required for accessible label-input associations. NOT yet in the project (currently inlined; explicit primitive is cleaner).

Already present and reused as-is: `input`, `textarea`, `select`, `checkbox`, `switch`, `command`, `popover`, `calendar`, `button`, `separator`, `badge`, `tooltip`, `scroll-area`. Plan stage runs `pnpm dlx shadcn@latest add form radio-group slider label` as a prerequisite step.

**Renderer registry (extensible)** — every field type maps to a React component via a `FieldRenderer` registry (single canonical name across the doc — no `FieldRendererComponent` alias). v0.1.0 ships a default registry with all built-in types; consumers extend it via `fieldRegistry={{ 'my-custom-type': MyComponent }}` to add new types or override defaults. Renderer signature: `(args: { field, value, onChange, onBlur, error, disabled, allValues, formApi }) => ReactNode` — object-shape args from day one (F-cross-12 lessons hard-applied).

**Built-in field types (v0.1.0):**

- **Text family** (string-typed): `text`, `email`, `password`, `url`, `tel`, `textarea`, `number`. Wraps shadcn `Input` + `Textarea`. Format validators auto-derived from `type` (email regex, URL parse, tel pattern). `number` uses `z.coerce.number()` to handle the input-element string→number conversion.
- **Choice family**: `select` (shadcn `Select` for static lists; switches to a `Command + Popover` combobox pattern opt-in via `searchable: true`), `multi-select` (`Command + Popover` + chip pills via `Badge`), `radio-group` (shadcn `RadioGroup`), `checkbox` (single boolean), `checkbox-group` (multiple selections composing `Checkbox`), `switch` (boolean as toggle). Options can be a static array `Array<{ value, label, description?, disabled? }>` OR an async resolver `(query?: string) => Promise<Array<...>>` — async resolvers debounce 200ms and surface a loading state.
- **Date/time family**: `date`, `date-range`, `time`, `datetime`. Wraps shadcn `Calendar` + `Popover`. Stores ISO 8601 strings on the form values (date: `YYYY-MM-DD`, time: `HH:mm`, datetime: full ISO). `date-range` produces `{ start: string; end: string }`.
- **Rich / composite (slotting existing procomps + small built-ins)**:
  - `code` — slots `@ilinxa/code-block` (shipped v0.1.0) in `mode='edit'`. Value is the raw code string. `lang` prop forwarded.
  - `slider` — wraps shadcn `Slider` (added as a prerequisite). `min` / `max` / `step` from DSL.
  - `rating` — inline star-rating widget (built-in, no external dep). `stars` (number of stars, default 5) on `config.rating.stars`; value is the selected integer.
- **Special field types**:
  - `computed` — derived from other fields. **Two forms (locked per A3):** (a) `expression: string` — pure interpolation of field references using `{fieldName}` syntax (e.g., `'{firstName} {lastName}'`); supports dot-path references (`{address.city}`); no operators, no conditionals, no function calls. (b) `compute: (values) => unknown` — function escape hatch for anything more complex. Read-only by default; consumer can opt into editable computed via `editable: true`. Re-evaluates on dependency change (RHF `watch()` under the hood — see O1 in the open questions for the perf ceiling).
  - `hidden` — value carried in form state but no UI rendered. **Always submits** regardless of any visibility / strip logic (that's the type's whole purpose — stored value with no UI). Useful for IDs, CSRF tokens, multi-step state. Distinguished from `visibleWhen: false` (which strips on submit by default — see "Hidden fields' values" below).
  - `section` — non-field; renders a `<fieldset>` with `<legend>` to group subsequent fields. Adds visual hierarchy and a11y semantics.
  - `divider` — horizontal rule between fields for visual rhythm. No value.

**Deferred field types** (additive, non-breaking when added):
- `richtext` — waits for a future `@ilinxa/plate-editor` procomp. **Plate is not yet adopted in any shipped registry component** (verified 2026-05-12: `markdown-editor` uses CodeMirror, not Plate). Adds in v0.1.x via `config.richText` when the plate-editor procomp ships. v0.1.0 ships without richtext; consumers needing rich text register a custom field via `fieldRegistry` or use `markdown-editor` outside the form.
- `file` — waits for `@ilinxa/file-upload-01` procomp to land. Adds in v0.1.x.
- `color` — waits for `@ilinxa/color-picker-01` procomp. Adds in v0.1.x.

**Conditional logic layer** — declarative on each field:

- `visibleWhen?: Condition` — when false, the field is removed from the DOM. No validation runs against it; the field's value is preserved in form state but stripped from the `onSubmit` payload by default. Opt out of the strip via `keepValueWhenHidden: true` on the field (per C1 lock, Q10).
- `enabledWhen?: Condition` — when false, the field renders with `disabled`. Value is preserved and submitted.
- `requiredWhen?: Condition` — overrides static `required` based on other fields. Compiled into Zod's `.superRefine()` when the form schema is built.

**Condition DSL** (kept small, deliberately):
```ts
type Condition =
  | { field: string; equals: unknown }
  | { field: string; notEquals: unknown }
  | { field: string; in: unknown[] }
  | { field: string; notIn: unknown[] }
  | { field: string; matches: string }       // regex source against string value
  | { field: string; truthy: boolean }       // truthy: true → field value is truthy; false → falsy
  | { field: string; greaterThan: number }
  | { field: string; lessThan: number }
  | { all: Condition[] }                      // logical AND
  | { any: Condition[] }                      // logical OR
  | { not: Condition };                       // logical NOT
```

Covers the realistic 95% case. Compiles to a RHF `watch()` subscription that re-evaluates only when the relevant fields change. Consumer escape hatch: any field type can accept a function-form predicate (`visibleWhen: (values) => boolean`) for cases the DSL can't express — surfaced in the guide as a "you probably don't need this, but if you do…" pattern.

**Validation pipeline**:

- **Field-level (declarative)** — each field has a `validators` block: `required`, `min`, `max`, `minLength`, `maxLength`, `pattern` (regex source), `email`, `url`. Compiled to Zod chain per field. Custom error messages per validator (`required: 'Email is required'` or `required: true`).
- **Field-level (function)** — `validate?: (value, allValues) => string | undefined` — sync escape hatch returning an error string or `undefined`. Compiled into Zod's `.refine()`.
- **Async validation** — `validateAsync?: (value, allValues) => Promise<string | undefined>` — debounced 400ms; renders a small inline spinner while pending; error surfaces on resolve. Compiled into Zod's `.refine(async ...)`.
- **Form-level** — top-level `schema.validate?: (values) => Record<string, string> | undefined` for cross-field assertions that don't fit per-field. Errors keyed by field name.
- **Zod escape hatch** — `schema.zodSchema?: ZodObject` accepts a pre-built Zod schema. The two schemas are MERGED with **consumer-provided Zod winning on conflict** (consumers who write explicit Zod did so deliberately; their constraints should take precedence over the DSL's declarative defaults). For consumers who already have a Zod schema and want to use it as the source of validation truth, the field DSL becomes purely UI hints.

**Layout & rendering**:

- **Default layout** — flat vertical stack with consistent spacing per the project's design-system rhythm (defined in the component's CSS or via Tailwind utilities — exact token names locked at plan stage). `section` field type breaks the flow with a `<fieldset>` + `<legend>`.
- **Two-column layout** — opt-in via `<JsonForm columns={2}>`. Fields can opt OUT per-field via `colSpan: 'full'`. v0.1.0 supports `1` (default) and `2` only — `3+` deferred to v0.2.
- **Label position** — top-aligned by default. `<JsonForm labelPosition="left" />` supports left-aligned labels for compact admin forms. Per-field override via `labelPosition` on the DSL.
- **Field width** — `width?: 'full' | 'half' | 'third' | 'quarter' | number` — relative width within the row (used inside the 2-column layout or for inline rows when a `row` grouping is used).
- **Row grouping** — fields can declare `row: string` (any matching string groups them on the same horizontal row). Useful for "First name | Last name" pairs.

**Submission & lifecycle** — all callbacks take a single args object (object-shape per F-cross-12, hard-applied):

- `onSubmit: (args: { values, formApi }) => void | Promise<void>` — fires on valid submit. Async submits show a spinner on the submit button + disable form fields while pending (`aria-busy="true"` on `<form>`).
- `onSubmitError?: (args: { errors, formApi }) => void` — fires when submit fails validation. Useful for analytics / debugging.
- `onChange?: (args: { values, formApi }) => void` — fires on any field change. Debounced 100ms. Useful for autosave hooks (consumer-owned).
- `onValidationChange?: (args: { isValid, errors }) => void` — fires when overall validity changes. Useful for enabling external "Next" buttons.
- `onSubmit` returns `void | Promise<void>` — the form treats submission as successful unless the function throws (or rejects); thrown errors surface as a form-level error in the summary.

**Imperative API** — `<JsonForm ref={formRef}>` exposes:

```ts
interface JsonFormHandle<TValues> {
  submit(): Promise<{ ok: boolean; values?: TValues; errors?: Record<string, string> }>;
  reset(values?: Partial<TValues>): void;
  setValue(name: string, value: unknown): void;
  getValue(name: string): unknown;
  getValues(): TValues;
  setError(name: string, message: string): void;
  clearErrors(name?: string): void;
  trigger(name?: string | string[]): Promise<boolean>;  // re-run validation
  focus(name: string): void;
  isDirty(): boolean;
  isValid(): boolean;
}
```

These wrap RHF's `useFormContext` ergonomically — consumers using the ref never touch RHF directly.

**Default values & resets**:

- `defaultValues?: Partial<TValues>` — initial values for the form. Merges with field-level `defaultValue` (DSL field wins on conflict).
- `values?: Partial<TValues>` — controlled mode. When provided, RHF runs in controlled mode (every render the form is reset to these values). Mirrors RHF's `values` prop semantics.
- `reset()` — restores to `defaultValues` (or merge of `defaultValues` + field-level defaults). Clears errors. Clears dirty.

**Error rendering**:

- **Inline per field** — `<p role="alert">` below the input, ARIA-associated via `aria-describedby` and `aria-invalid`.
- **Summary at top** — optional `<JsonForm showSummary />`. Renders a list of all errors with anchor links to the offending fields. Particularly valuable for long forms.
- **Focus management** — on submit failure, focus moves to the first error in DOM order. Triggered via `formRef.focus(firstErrorName)` internally.

**Field naming & paths**:

- **Flat names by default** — `name: 'email'`. Stored as `values.email`.
- **Dot-path support** — `name: 'address.city'`. Stored as `values.address.city`. RHF handles deep-set internally.
- **Array / repeating fieldset fields** — deferred to v0.1.x (see Out of scope + Q4); v0.1.0 ships flat fields + dot-path nesting only.

**Accessibility (full first-class support)**:

- Every input has an associated `<label for>` (NOT placeholder-as-label). Labels visually hidden via class for icon-only fields.
- `aria-required` on required fields.
- `aria-invalid` toggled on validation state.
- `aria-describedby` linking helper text and error messages.
- `role="alert"` on error messages.
- Submit button captures form submission via `<button type="submit">` (Enter key in any field fires it).
- Focus management on submit failure: first error gets focus.
- Sections use `<fieldset>` + `<legend>` for screen-reader semantics.
- Keyboard navigation works via standard tab order (no `tabIndex` hacks).
- Lighthouse a11y target: ≥ 95.

**Polymorphic root** — accepts `className` and `style` (forwarded to the `<form>` element). Polymorphic `as` prop NOT supported in v0.1.0 (`<form>` semantics matter — Enter-to-submit, native validation, action attribute compatibility). Consumers wrap externally.

**Render slots (override hooks)** — two override seams sit alongside `fieldRegistry` for layout-level customization:

- `renderField?: (args: { field, defaultRender }) => ReactNode` — form-level hook called for every field. `defaultRender()` returns the renderer-registry output; the consumer can wrap, replace, or short-circuit per field. Useful for forms that want to layer per-field analytics, tooltips, or layout chrome without re-implementing each renderer.
- Standalone parts (`<JsonFormField name="...">`, etc.) — for consumers building fully-custom JSX around individual fields.

The hierarchy is: `renderField` > `fieldRegistry` lookup > built-in default renderer.

**Object-shape callbacks throughout** — all callbacks take a single args object. F-cross-12 lessons hard-applied; no positional shapes anywhere on the public API.

**Soft-failure modes**:

- Unknown field type → render an error placeholder + dev `console.warn`. Form continues to function.
- Invalid `Condition` shape → treat condition as "always true" (field visible / enabled / required default) + dev warning.
- `defaultValues` containing keys not in the schema → preserve them silently (don't error). Useful for hidden state.
- Async resolver throws → show "Failed to load options" + retry button. Form continues.
- Empty `fields: []` schema → renders the meta header (if present) + the submit button (and reset, if enabled). No fields, no errors.
- Computed field's `expression` references an unknown field → renders empty string for that segment + dev warning. Form continues.
- Multiple `<JsonForm>` instances on the same page → each owns its own RHF context; values + validation are fully isolated. No special handling needed; consumers compose freely.

**Client-component posture (`'use client'`)** — `json-form.tsx` and all standalone parts carry `'use client'` (RHF hooks require client runtime). The directive is the only React-runtime concession; no `next/*` imports anywhere in the registry folder (per the project's portability rule). Initial render still happens server-side in a Next.js host; the form hydrates on the client and takes over.

**Standalone parts exported** — per the project's standalone-parts pattern (`<DataTable.Header>`, `<CodeBlockHeader>`, etc.), `json-form` exports composable atoms:

- `<JsonFormProvider>` — RHF context provider (for consumers who want to compose custom JSX around the form).
- `<JsonFormField name="...">` — renders a single field by name (looks it up in the schema). Useful inside custom layouts.
- `<JsonFormSubmitButton>` — pre-wired submit button.
- `<JsonFormResetButton>` — pre-wired reset button.
- `<JsonFormErrorSummary>` — pre-wired error summary.
- `useJsonFormContext()` — accessor hook for the form API from inside child components rendered under `<JsonFormProvider>` / `<JsonForm>`. Returns the same `JsonFormHandle` shape the `ref` exposes.

**Hook export (headless factory)** — `useJsonForm<TValues>(schema, options)` for consumers who want a fully-headless variant: compile the schema, get back `{ form, zodSchema, fieldList, isValid, isSubmitting, ... }`, render the form themselves with full control over every primitive. Power-user escape hatch; documented but not the primary surface. Distinct from `useJsonFormContext` — the factory creates a new form instance, the context accessor reads an existing one.

## Out of scope (deferred)

Each is real demand, deferred to keep v0.1.0 tractable. Most are additive when added (non-breaking).

- **Visual form builder UI** — a drag-and-drop tool that authors the JSON schema. Separate procomp (`form-builder` candidate) for v0.2 or later. v0.1.0 is the runtime engine; authoring is JSON by hand or by a backend.
- **Multi-step / wizard mode** — sequential page-by-page submission with progress indicator. Real demand (onboarding flows, surveys) but is a fundamentally different UX shape. Defer to v0.1.x or v0.2 as `steps?: Array<{ title, fields[] }>` extension. v0.1.0 ships single-page only.
- **File-upload field type (`file`)** — waits for the future `@ilinxa/file-upload-01` standalone procomp. Adds non-breakingly in v0.1.x once that procomp lands.
- **Color-picker field type (`color`)** — waits for the future `@ilinxa/color-picker-01` standalone procomp. Adds non-breakingly in v0.1.x.
- **Array / repeating fieldset field type** — fields that produce arrays of sub-objects (e.g., "Add another address"). Real demand but the UX shape (add / remove / reorder) is its own design problem. **TBD in open questions whether this ships in v0.1.0 or defers to v0.1.x.**
- **Nested sub-forms (a field whose value is itself a form)** — composability, but rarely needed; deep dot-paths handle the simple nesting case. Defer indefinitely; revisit if real demand surfaces.
- **JSON Schema (RJSF) compatibility** — parsing JSON Schema 2020-12 input. We use our own DSL. v0.2 adapter possible (`jsonSchemaToFormSchema(schema)`) for consumers migrating from RJSF; out of v0.1.0.
- **Autosave / draft persistence** — saving form state to localStorage / server every N seconds. Consumer-owned via `onChange`. We do not ship persistence.
- **Server-actions integration (Next.js `<form action={action}>`)** — Next-specific, violates registry portability rule (no `next/*`). Consumer wires `onSubmit` to call their server action. Documented in guide.
- **i18n / localization framework** — labels, descriptions, error messages are passed as strings. Consumer pre-translates. We do not ship a translation system. ARIA live regions use English defaults overridable via a single `strings` prop.
- **Visual designer for the schema** — see "visual form builder" above.
- **Computed field with side effects** — `compute` is pure-function. If consumers need a side-effectful derived value, they use `onChange` + `setValue()`.
- **Cross-form linking** — two forms on the same page that share state. Use a parent state owner. Out of scope.
- **Schema validation of the schema itself** — we don't validate that the input schema is well-formed. Bad schemas surface as render errors. v0.2 could ship a `validateSchema(s): SchemaError[]` utility.
- **Custom theming beyond design tokens** — we render via shadcn primitives + project tokens. Custom theming = override the renderer. Document in guide.

## Target consumers

In rough order of how loud the demand is from inside the ilinxa orbit:

1. **socialmedia_adv_app forms** — registration, profile editing, ad-set wizards, business onboarding. Multiple form surfaces today are hand-rolled; `json-form` would unify them.
2. **CMS-authored forms (consumer apps)** — content team defines a contact form / lead capture form in the CMS, frontend renders it without code changes. The backend-driven case is the most ambitious but also the highest leverage.
3. **Admin panels with backend schemas** — any "edit this record" page where the record shape comes from the API. Replaces hand-rolled "edit X" forms across admin surfaces.
4. **Survey / questionnaire systems** — multi-page polls, NPS surveys, feedback forms. Multi-step (v0.1.x) extends this.
5. **Onboarding flows** — first-run user setup, KYC flows, account verification. Often multi-step + conditional + sometimes computed.
6. **A/B-tested form variants** — marketing wants to test "registration form A" vs "registration form B" without dev round-trips. The schema is the experiment artifact.
7. **Settings pages** — large config pages with many typed knobs grouped into sections. Could use `properties-form` for narrower cases; `json-form` covers when settings cross 20+ fields with conditionals.
8. **Support intake forms** — bug reports, feature requests, contact forms. Often have conditional "if you reported a bug, please describe…" branches.
9. **Billing / payment flows** — typed financial inputs with strict validation. The strict-validation case showcases the Zod substrate.
10. **Low-code platforms** — consumers building a low-code app generator that produces forms at runtime.

`json-form` is the consumer-facing answer to "I have a form to render and it has 5+ fields and I don't want to wire RHF myself." `properties-form` remains the answer for "I have an entity to inspect / edit, sometimes with mixed permissions."

## Rough API sketch

Three core props plus optional ergonomic ones. Final signatures locked in Stage 2.

```ts
type FieldType =
  // text family
  | 'text' | 'email' | 'password' | 'url' | 'tel' | 'textarea' | 'number'
  // choice family
  | 'select' | 'multi-select' | 'radio-group' | 'checkbox' | 'checkbox-group' | 'switch'
  // date/time family
  | 'date' | 'date-range' | 'time' | 'datetime'
  // rich / composite (v0.1.0)
  | 'code' | 'slider' | 'rating'
  // special
  | 'computed' | 'hidden' | 'section' | 'divider'
  // consumer-extended (registry lookup) — also covers v0.1.x types ('richtext', 'file', 'color') before they ship
  | string;

// Sections + dividers don't carry a value; their `name` is optional and (when present) used
// only as a stable React key. All value-carrying types require `name`. Plan stage spells the
// discriminated union explicitly; for the description sketch we keep `name` required and
// note the section/divider exception inline.
interface FieldDefinition {
  name: string;                    // form path (supports dot-paths). Optional for `section` / `divider` types — see note above.
  type: FieldType;
  label?: string;
  description?: string;            // helper text below label
  placeholder?: string;
  defaultValue?: unknown;

  // validation (declarative)
  validators?: {
    required?: boolean | string;
    min?: number | string;         // string for date types (ISO 8601)
    max?: number | string;
    minLength?: number;
    maxLength?: number;
    pattern?: string;              // regex source
    email?: boolean;
    url?: boolean;
  };
  // validation (function escape hatches)
  validate?: (value: unknown, allValues: Record<string, unknown>) => string | undefined;
  validateAsync?: (value: unknown, allValues: Record<string, unknown>) => Promise<string | undefined>;

  // conditional logic
  visibleWhen?: Condition | ((values: Record<string, unknown>) => boolean);
  enabledWhen?: Condition | ((values: Record<string, unknown>) => boolean);
  requiredWhen?: Condition | ((values: Record<string, unknown>) => boolean);

  // choice family
  options?: Array<{ value: unknown; label: string; description?: string; disabled?: boolean }>
          | ((query?: string, allValues?: Record<string, unknown>) => Promise<Array<...>>);
  searchable?: boolean;            // select: use combobox over native select

  // numeric / slider / rating
  min?: number; max?: number; step?: number;

  // textarea
  rows?: number;

  // simple type-specific primitives stay at top level
  lang?: string;                   // code field

  // Complex / nested type-specific config lives under `config` (per A1 resolution: hybrid shape)
  config?: {
    code?: { editorExtensions?: unknown[]; readOnly?: boolean };
    date?: { firstDayOfWeek?: 0 | 1 | 2 | 3 | 4 | 5 | 6; minYear?: number; maxYear?: number };
    rating?: { stars?: number };   // rating: total star count (default 5); avoids semantic clash with `validators.max`
    // v0.1.x additions (NOT in v0.1.0): richText?: PlateConfig (waits for plate-editor procomp),
    //                                  file?: FileUploadConfig (waits for file-upload-01),
    //                                  color?: ColorPickerConfig (waits for color-picker-01)
  };

  // visibility-override
  keepValueWhenHidden?: boolean;   // preserve value across `visibleWhen: false` transitions (default: false)

  // computed
  expression?: string;             // template like '{firstName} {lastName}'
  compute?: (values: Record<string, unknown>) => unknown;
  editable?: boolean;              // computed field that's also editable

  // layout
  row?: string;                    // group fields on the same horizontal row
  colSpan?: 'full' | 1 | 2;
  width?: 'full' | 'half' | 'third' | 'quarter' | number;
  labelPosition?: 'top' | 'left';

  // misc
  disabled?: boolean;
  readOnly?: boolean;
  autoComplete?: string;
  autoFocus?: boolean;
}

interface FormSchema {
  fields: FieldDefinition[];
  validate?: (values: Record<string, unknown>) => Record<string, string> | undefined;
  zodSchema?: ZodObject;           // escape hatch — merged with DSL-compiled schema
  meta?: { id?: string; version?: string; title?: string; description?: string };
}

interface JsonFormProps<TValues extends Record<string, unknown> = Record<string, unknown>> {
  schema: FormSchema;
  defaultValues?: Partial<TValues>;
  values?: Partial<TValues>;       // controlled mode

  onSubmit: (args: { values: TValues; formApi: JsonFormHandle<TValues> }) => void | Promise<void>;
  onSubmitError?: (args: { errors: Record<string, string>; formApi: JsonFormHandle<TValues> }) => void;
  onChange?: (args: { values: TValues; formApi: JsonFormHandle<TValues> }) => void;
  onValidationChange?: (args: { isValid: boolean; errors: Record<string, string> }) => void;

  // layout
  columns?: 1 | 2;
  labelPosition?: 'top' | 'left';
  showSummary?: boolean;
  showSchemaHeader?: boolean;      // default true; renders <h2>{meta.title} + <p>{meta.description} above the form when meta is present (A2 resolution)
  // Shown by default (per Q19). Set to `false` to hide the built-in button when the
  // consumer renders their own outside the form (e.g., imperative-API flows).
  submitButton?:
    | {
        label?: string;
        variant?: ButtonVariant;
        align?: 'left' | 'right' | 'center';
        disableWhenInvalid?: boolean;   // opt-in; default false (per Q40 — always-enabled is the default)
      }
    | ((args: { isSubmitting: boolean; isValid: boolean }) => ReactNode)
    | false;
  // Hidden by default (per Q20). Opt in by providing the object.
  resetButton?: { label?: string; variant?: ButtonVariant };

  // extensibility
  fieldRegistry?: Record<string, FieldRenderer>;
  renderField?: (args: { field: FieldDefinition; defaultRender: () => ReactNode }) => ReactNode;

  // misc
  strings?: Partial<JsonFormStrings>;  // ARIA + button labels for i18n; type spelled out at plan stage
  className?: string;
  style?: CSSProperties;
}
```

Consumer happy path — three props (`schema`, `defaultValues`, `onSubmit`):

```tsx
<JsonForm
  schema={{
    fields: [
      { name: 'email', type: 'email', label: 'Email', validators: { required: true } },
      { name: 'password', type: 'password', label: 'Password', validators: { required: true, minLength: 8 } },
    ],
  }}
  onSubmit={async ({ values }) => { await signUp(values); }}
/>
```

## Example usages

### 1. Registration form (the simplest happy path)

```tsx
<JsonForm
  schema={{
    fields: [
      { name: 'firstName', type: 'text', label: 'First name', validators: { required: true }, row: 'name' },
      { name: 'lastName',  type: 'text', label: 'Last name',  validators: { required: true }, row: 'name' },
      { name: 'email',     type: 'email', label: 'Email', validators: { required: true } },
      { name: 'password',  type: 'password', label: 'Password', validators: { required: true, minLength: 8 } },
      { name: 'tos',       type: 'checkbox', label: 'I accept the Terms of Service', validators: { required: 'You must accept the ToS' } },
    ],
    meta: { id: 'registration', version: '1' },
  }}
  onSubmit={async ({ values }) => signUp(values)}
/>
```

### 2. Backend-driven schema (the high-leverage case)

```tsx
const { data: schema, isLoading } = useQuery({
  queryKey: ['form-schema', 'contact'],
  queryFn: () => fetch('/api/forms/contact').then(r => r.json()),
});

if (isLoading) return <Skeleton />;

return (
  <JsonForm
    schema={schema}
    onSubmit={async ({ values }) => {
      const result = await fetch('/api/forms/contact/submit', { method: 'POST', body: JSON.stringify(values) });
      if (!result.ok) throw new Error('Submission failed');
    }}
  />
);
```

Schema lives in the CMS / database / backend. Frontend renders without a deploy when the form changes.

### 3. Conditional fields (the showcase case)

```tsx
<JsonForm
  schema={{
    fields: [
      { name: 'role', type: 'select', label: 'I am a…', options: [
        { value: 'individual', label: 'Individual' },
        { value: 'business', label: 'Business' },
      ], validators: { required: true } },

      // Show only for businesses
      { name: 'companyName', type: 'text', label: 'Company name',
        visibleWhen: { field: 'role', equals: 'business' },
        requiredWhen: { field: 'role', equals: 'business' } },
      { name: 'taxId', type: 'text', label: 'Tax ID',
        visibleWhen: { field: 'role', equals: 'business' } },

      // Show only for individuals
      { name: 'dateOfBirth', type: 'date', label: 'Date of birth',
        visibleWhen: { field: 'role', equals: 'individual' },
        validators: { required: true, max: new Date().toISOString().slice(0, 10) } },

      // Show only when EITHER role is selected AND a contact channel is chosen
      { name: 'contactMethod', type: 'radio-group', label: 'Preferred contact', options: [
        { value: 'email', label: 'Email' }, { value: 'phone', label: 'Phone' },
      ]},
      { name: 'phone', type: 'tel', label: 'Phone',
        visibleWhen: { all: [{ field: 'role', truthy: true }, { field: 'contactMethod', equals: 'phone' }] },
        requiredWhen: { field: 'contactMethod', equals: 'phone' } },
    ],
  }}
  onSubmit={async ({ values }) => save(values)}
/>
```

### 4. Computed fields + sections

```tsx
<JsonForm
  schema={{
    fields: [
      { type: 'section', name: '_personal', label: 'Personal' },
      { name: 'firstName', type: 'text', label: 'First name', validators: { required: true }, row: 'name' },
      { name: 'lastName',  type: 'text', label: 'Last name',  validators: { required: true }, row: 'name' },
      { name: 'fullName',  type: 'computed', label: 'Full name (preview)',
        expression: '{firstName} {lastName}' },

      { type: 'section', name: '_address', label: 'Address' },
      { name: 'address.street', type: 'text', label: 'Street' },
      { name: 'address.city',   type: 'text', label: 'City', row: 'cityzip' },
      { name: 'address.zip',    type: 'text', label: 'ZIP',  row: 'cityzip', validators: { pattern: '^[0-9]{5}$' } },
    ],
  }}
  onSubmit={async ({ values }) => save(values)}
/>
```

### 5. Rich/composite fields (procomp slotting — v0.1.0 set)

```tsx
<JsonForm
  schema={{
    fields: [
      { name: 'title', type: 'text', label: 'Article title', validators: { required: true } },
      { name: 'codeSample', type: 'code', lang: 'ts', label: 'Code example',
        config: { code: { readOnly: false } } },
      { name: 'quality',    type: 'rating', label: 'Self-rated quality',
        config: { rating: { stars: 5 } } },
      { name: 'engagement', type: 'slider', label: 'Expected engagement', min: 0, max: 100, step: 5 },
    ],
  }}
  onSubmit={async ({ values }) => publish(values)}
/>
```

> v0.1.0 ships `code` + `slider` + `rating`. `richtext` (Plate-based), `file`, and `color` field types are deferred to v0.1.x — they each land additively when their dedicated procomp ships. Until then, consumers needing rich text either compose `markdown-editor` outside the form or register a custom field via `fieldRegistry`.

### 6. Imperative API (multi-form flows)

```tsx
const formRef = useRef<JsonFormHandle<RegistrationValues>>(null);

return (
  <>
    <JsonForm ref={formRef} schema={...} onSubmit={...} submitButton={false} />
    <Button onClick={async () => {
      const result = await formRef.current?.submit();
      if (result?.ok) navigate('/welcome');
    }}>
      Continue
    </Button>
  </>
);
```

### 7. Custom field registration (extending the registry)

```tsx
const ColorSwatchField: FieldRenderer = ({ value, onChange, field }) => (
  <div className="flex gap-1">
    {field.options?.map(o => (
      <button key={o.value} type="button" onClick={() => onChange(o.value)}
              style={{ backgroundColor: o.value as string }}
              className={cn('h-8 w-8 rounded border', value === o.value && 'ring-2 ring-ring')} />
    ))}
  </div>
);

<JsonForm
  schema={{ fields: [
    { name: 'accent', type: 'color-swatch', label: 'Accent color',
      options: [{ value: '#84cc16', label: 'Lime' }, { value: '#f97316', label: 'Orange' }] },
  ]}}
  fieldRegistry={{ 'color-swatch': ColorSwatchField }}
  onSubmit={...}
/>
```

## Success criteria

The component is "done" for v0.1.0 when:

1. **All built-in field types render correctly** — every type in the listed set has a clean default renderer + validation chain.
2. **JSON schema round-trips** — a schema authored in TS, stringified, parsed back, and rendered produces a visually identical form.
3. **Conditional logic verified** — `visibleWhen` / `enabledWhen` / `requiredWhen` work for all 11 Condition operators (`equals`, `notEquals`, `in`, `notIn`, `matches`, `truthy`, `greaterThan`, `lessThan`, `all`, `any`, `not`) plus the function-form escape hatch. Conditional fields' validation runs only when visible; field's value is stripped from the submit payload by default unless `keepValueWhenHidden: true` is set per field.
4. **Computed fields verified** — both `expression` (template) and `compute` (function) work; values re-evaluate when dependencies change; pure-derived (no infinite-loop risk).
5. **Validation pipeline complete** — declarative validators compile to Zod; sync `validate` + async `validateAsync` work; form-level `validate` catches cross-field errors; `zodSchema` escape hatch merges correctly.
6. **Submission flow works** — sync + async `onSubmit`; submit button disables + shows spinner during async submit; thrown errors surface as form-level error.
7. **Imperative API works** — every method on `JsonFormHandle` works as documented; ref forwarding clean.
8. **Renderer registry works** — consumer can register custom types; consumer can override built-in types; unknown types render error placeholder.
9. **Layout** — 1-col + 2-col layouts work; `row` grouping renders fields side-by-side; `colSpan` overrides; label position both options.
10. **Error UX** — inline errors render with proper a11y; optional summary renders with anchor links; focus moves to first error on submit failure.
11. **A11y audit passes** — labels associated, ARIA correct, keyboard navigation works, Lighthouse a11y ≥ 95 on demo.
12. **Bundle posture** — initial chunk reasonable (RHF + Zod + the wrappers + shadcn primitives we already import). Rich/composite field types (plate, code-block) dynamic-import on first use to avoid loading their grammars / editors when not used.
13. **Standalone parts + hooks exported** — `<JsonFormProvider>`, `<JsonFormField>`, `<JsonFormSubmitButton>`, `<JsonFormResetButton>`, `<JsonFormErrorSummary>` (components), plus `useJsonFormContext()` (context accessor) and `useJsonForm()` (headless factory) — all work in isolation, with distinct semantics.
14. **Object-shape callbacks throughout** — no positional shapes on the public API.
15. **Demo at `/components/json-form`** demonstrates **seven scenarios, each its own tab**: simple registration, backend-driven (mocked fetch), conditional fields, computed fields + sections, rich-field showcase (code + slider + rating — the v0.1.0 set), imperative API, custom registry. Error states are exercised inside the conditional + custom-registry tabs (no dedicated "error" tab).
16. **`tsc + lint + build` clean**; `validate-meta-deps` clean.
17. **Smoke harness** — `pnpm dlx shadcn add @ilinxa/json-form` from consumer; consumer-side `pnpm tsc --noEmit` clean.
18. **GATE 3 spot-check review** — verdict ≥ "Pass with follow-ups".

## Open questions

> Each question has a recommended starting position. User should mark each with their preferred resolution OR push back on the recommendation.

1. **Slug — `json-form` or alternatives?** Locked above to `json-form` (Recommended). No re-litigation unless a stronger name surfaces during plan authoring.

2. **Substrate version — RHF v7.x?** RHF v8 is in alpha as of 2026-05. v7 is stable, widely consumed, and what shadcn's `<Form>` wraps. **Recommendation:** **`react-hook-form@^7.x`** + **`@hookform/resolvers@^3.x`** + **`zod@^3.x`**. Plan stage runs `pnpm view` to lock exact versions per the "verify peer packages exist during plan" memory.

3. **Zod compilation strategy — compile once at mount or lazily per field?** Per-render compile would thrash; compile-once at mount + memoize via `useMemo(() => buildZodFromSchema(schema), [schema])` is the cheap path. **Recommendation:** **compile once per `schema` identity** via `useMemo`. Consumers who reload schemas frequently need to memoize their schema object themselves (documented). Plan stage may add a `schemaVersion` field for explicit cache-busting.

4. **Array field type — ship in v0.1.0 or defer to v0.1.x?** Real demand (multi-row data), but the UX (add / remove / reorder rows) is its own design problem with non-trivial accessibility. Shipping in v0.1.0 inflates surface significantly. **Recommendation:** **defer to v0.1.x**. v0.1.0 ships flat fields + dot-path nesting only. Adding `type: 'array'` later is additive and non-breaking. Real-world consumers asking for arrays in v0.1.0 use the `hidden` field + custom UI workaround documented in the guide.

5. **Multi-step / wizard mode — v0.1.0 or v0.1.x?** Multi-step is a different UX shape (progress indicator, "Next" / "Back" buttons, per-step validation). **Recommendation:** **v0.1.x** (additive `steps?: Array<{ title, fields[] }>` extension). v0.1.0 focuses on single-page forms — the largest, simplest, most common case. Multi-step has consumers (onboarding) but isn't blocking the v0.1.0 ship.

6. **`values` prop (controlled mode) — ship in v0.1.0 or defer?** RHF's `values` prop puts the form in a "reset to these every render" mode. Useful for syncing with external state (URL params, external store). **Recommendation:** **ship in v0.1.0**. Cheap — RHF handles internally. Documented as the "external-state-of-record" pattern.

7. **Async validation debounce default — 400ms or configurable?** Standard practice is 300-500ms. **Recommendation:** **400ms default**, overridable per field via `validateAsyncDebounce: number`. Documented in the guide.

8. **Async option-loader debounce default — same 400ms or different?** Combobox-style searches typically use 200-300ms (the user is typing fast). **Recommendation:** **200ms default** for option loaders, overridable via `optionsDebounce: number` per field.

9. **`requiredWhen` rendering — show required asterisk dynamically?** When `requiredWhen` evaluates true, the field should visually mark itself required (asterisk after label). **Recommendation:** **yes — render dynamic asterisk** when `requiredWhen` is currently true. Visually consistent with static `required: true` fields.

10. **Hidden fields' values — submit them by default or strip them? Locked (re-validation C1):** `type: 'hidden'` ALWAYS submits its value (that's the type's whole purpose — explicit stored value with no UI). `visibleWhen: false` strips the field's stale value from the `onSubmit` payload by default. Per-field opt-out via `keepValueWhenHidden: true` for cases where the value should persist across visibility toggles (e.g., the user toggles a section off then back on and we want their prior values preserved). Default matches "what the user sees is what they submit" while preserving the explicit `hidden` type's contract.

11. **Disabled fields' values — submit or strip?** Disabled is different from hidden — the field is shown but greyed. **Recommendation:** **submit disabled values** (mirrors HTML `<input disabled>` semantics inverted — HTML actually strips them, but most React form libraries submit them; we follow RHF default which submits). Document the divergence from native HTML.

12. **Field naming collision — what happens?** Two fields with the same `name`. **Recommendation:** **dev error in development** + render the first occurrence + warn. In production, render the first occurrence silently. Compile-time check via a schema-validation utility (v0.2 candidate).

13. **`computed` field — pure or memoized?** `compute: (values) => x` runs every time `values` changes. **Recommendation:** **memoize via shallow-compare on referenced field names**. Plan stage tracks: parse the `expression` template OR run `compute` once with proxy values to detect dependencies, subscribe via RHF `watch()` to only those, recompute only when those change.

14. **`section` field type — fully styled (border, background) or minimal (just `<fieldset>` + `<legend>`)?** **Recommendation:** **minimal default** — `<fieldset>` with a `<legend>` for the label and an optional `<p>` for description. No border / background. Consumer applies styling via `className` on the section or via global CSS targeting `[data-jsonform-section]`. Keeps the design system clean.

15. **`divider` field type — necessary?** Could just use a CSS-level "every 4 fields, draw a line" rule. **Recommendation:** **ship it** — explicit `divider` field is more honest about intent (semantic vs visual) and lets consumers control rhythm precisely. Renders an `<hr role="separator">`.

16. **Label position — global or per-field default?** **Recommendation:** **both**, with form-level `labelPosition` cascading and per-field override. Default `'top'`. Field-level wins on conflict.

17. **`columns: 2` — does it require explicit `colSpan` per field, or auto-row?** Auto-row means "two adjacent fields end up side-by-side." **Recommendation:** **auto-row by default**. Field can opt out via `colSpan: 'full'` to take the full row. Fields with `row: 'X'` matching another's `row` always group side-by-side regardless of column config.

18. **`row` grouping vs `columns: 2` — which wins?** **Recommendation:** **`row` is explicit grouping (always honored)**; `columns: 2` is auto-flow. `row`-grouped fields render in a flex row inside whatever column they land in. Document the interaction.

19. **Submit button position — inside or outside the rendered form?** **Recommendation:** **inside, at the bottom, right-aligned by default**. Configurable via `submitButton.align`. Setting `submitButton={false}` removes it (consumer renders their own outside).

20. **Reset button — default visible or hidden?** **Recommendation:** **hidden by default**. Most forms don't need a reset button. `resetButton: { label: 'Reset' }` opts in.

21. **Error summary position — top or bottom?** **Recommendation:** **top** when shown. Visible to screen readers before the form (with `aria-live="polite"`). Most-common UX precedent (GitHub forms, Stripe forms).

22. **Error summary trigger — always-on or post-submit only?** **Recommendation:** **post-submit only** by default — showing all errors before the user has tried to submit is hostile. Once `formApi.submit()` has been called at least once, the summary stays visible until the form is valid. Configurable via `summaryStrategy: 'always' | 'post-submit'`.

23. **Polymorphic root — support `as` / `asChild`?** **Recommendation:** **no in v0.1.0**. `<form>` semantics are load-bearing for the submit flow (Enter-to-submit, keyboard handling). Consumers wrap externally. Revisit in v0.2 if real demand.

24. **`schema.meta` — purely informational, or used for cache busting / persistence?** **Recommendation:** **informational in v0.1.0** (title / description rendered as form header if present). v0.2 may add `id`-based draft-persistence hooks.

25. **Form header — render `schema.meta.title` + `description`? Locked (re-validation A2):** **yes when present, opt-out via `showSchemaHeader={false}`**. Default-on means backend-driven forms get titles for free; consumer wrapping the form in their own header section sets `showSchemaHeader={false}` to suppress duplication. Title renders as `<h2>`; description as `<p>`. Both are skipped when `schema.meta` is absent.

26. **i18n `strings` prop — what's in the default set?** Defaults: submit button label, reset button label, "required" indicator, "loading…" for async options, "Submission failed" for thrown errors, summary heading ("Please fix the following errors:"), error templates ("Must be at least {n} characters"). **Recommendation:** **ship a ~12-entry default English dictionary**; consumer overrides via shallow merge.

27. **`onChange` debounce default — 100ms or 0ms?** **Recommendation:** **100ms default**, overridable via `onChangeDebounce: number`. Most consumers using `onChange` are autosaving / tracking — not first-render-critical.

28. **RHF mode — `onChange` / `onBlur` / `onSubmit` / `all`?** RHF's validation trigger. **Recommendation:** **`onTouched`** — show errors after a field has been blurred at least once OR after submit attempt. Mirrors industry standard (Stripe, GitHub, Notion forms). Per-form override via `validationMode: 'onChange' | 'onBlur' | 'onTouched' | 'onSubmit' | 'all'`.

29. **Disabled state — submit-while-pending visual?** **Recommendation:** during async `onSubmit`, set `aria-busy="true"` on the `<form>`; disable submit button; show spinner inside it. Other fields remain interactive (consumer might want to let users edit while submission retries). Document the choice.

30. **Hook exports — what ships? Locked:** v0.1.0 ships TWO distinct hooks (resolves the H-04 name collision the review surfaced): (a) `useJsonForm<TValues>(schema, options)` — headless **factory** hook that creates a new form instance from a schema; returns `{ form, zodSchema, fieldList, isValid, isSubmitting, ... }` for consumers rendering the form themselves with full primitive control; (b) `useJsonFormContext()` — **accessor** hook for reading the form API from inside a child rendered under `<JsonFormProvider>` / `<JsonForm>`; returns the same `JsonFormHandle` shape the `ref` exposes. Both are power-user APIs; documented but not the primary surface.

31. **Plate field type — ships in v0.1.0? Locked (review verification 2026-05-12): NO.** Verified state of the registry: `markdown-editor` (the only WYSIWYG-adjacent procomp in `forms/`) uses CodeMirror, not Plate. No `plate-editor` procomp exists. The earlier note about "Plate as WYSIWYG substrate" was aspirational, not shipped. `richtext` field type is deferred to v0.1.x and lands additively when an `@ilinxa/plate-editor` procomp ships (or whichever substrate the team eventually picks). v0.1.0's `config.richText` slot is reserved in the type sketch but excluded from the v0.1.0 type union; consumers needing rich text in the meantime register a custom field via `fieldRegistry` or compose `markdown-editor` outside the form.

32. **Code field type — uses shipped `@ilinxa/code-block` in `mode='edit'`?** **Recommendation:** **yes**. code-block v0.1.0 ships an edit mode (CodeMirror 6). json-form's code field passes `value`, `onChange`, `lang`, `filename` through to it. Documented as a substrate-composition case.

33. **Theme — does json-form ship its own design tokens or piggyback on existing `--*` tokens?** **Recommendation:** **piggyback** entirely on existing project tokens. The form uses shadcn primitives which use the project tokens already. New tokens only if a need surfaces — none anticipated.

34. **What ships in `dummy-data.ts`?** Fixtures: a `registrationFormSchema`, a `contactFormSchema`, a `conditionalFormSchema` (the showcase), a `computedFormSchema`, a `richFieldsFormSchema`, an `adminUserFormSchema` (longer, multi-section), `defaultValues` for each. **Recommendation:** ship ~6 fixtures covering each demo tab.

35. **Demo tabs — which scenarios make the demo? Locked:** 7 tabs, matching success criterion #15: (1) simple registration, (2) backend-driven (mocked fetch), (3) conditional fields, (4) computed + sections, (5) rich-fields (code + slider + rating), (6) imperative API, (7) custom registry. Error states get woven into the conditional and custom-registry tabs rather than getting their own.

36. **`pnpm validate:meta-deps` declarations — what gets declared?** v0.1.0 set: `react-hook-form`, `@hookform/resolvers`, `zod`, `lucide-react` (icons), and `@ilinxa/code-block` (registry-internal dep — the one cross-registry dep in v0.1.0; plan stage works out the exact declaration shape with the lint script). `@ilinxa/plate-editor` lands when `richtext` ships in v0.1.x; not declared in v0.1.0.

37. **Standalone parts — naming convention?** Match the existing pattern: `<JsonFormProvider>`, `<JsonFormField>`, `<JsonFormSubmitButton>`, `<JsonFormResetButton>`, `<JsonFormErrorSummary>`. **Recommendation:** confirmed.

38. **Should we ship a `jsonSchemaToFormSchema(schema)` adapter for RJSF migration in v0.1.0?** **Recommendation:** **no** — defer to v0.2. v0.1.0 establishes the DSL; the JSON-Schema adapter is a separate piece of work and risks expanding scope.

39. **`hidden` field type — same as `<input type="hidden">` or just "stored value, no UI"?** **Recommendation:** **stored value, no UI** (renders nothing in the DOM). Mirrors RHF's invisible-but-tracked behavior. Used for things like CSRF tokens, multi-step state, or `id` carrying across edits.

40. **Submit button — should it auto-disable when the form is invalid?** **Recommendation:** **no, always-enabled by default** — disabling submit on invalid forms is a UX anti-pattern (the user doesn't know WHY it's disabled). Show errors on submit attempt instead. Consumer can opt into auto-disable via `submitButton: { disableWhenInvalid: true }`.

41. **`type: 'hidden'` field config bucket — does it belong under top-level or `config`?** Per A1's hybrid resolution, `hidden` has no nested config; it's a pure stored-value type. **Recommendation:** **stays at top-level type discriminator** with no special config. The `value` it stores comes from `defaultValue` or `setValue()` calls — no other knobs.

42. **A1 (locked) — Field-config shape: hybrid (simple primitives top-level, complex objects under `config`).** Simple primitives (`lang`, `min`, `max`, `step`, `rows`, `options`, `searchable`) live at the top of `FieldDefinition`. Complex objects (`richText`, `code`, `date` future buckets) live under `config?: { richText?, code?, date? }`. Trade-off: slightly larger `FieldDefinition` surface but consumer ergonomics stay strong for the common cases while complex configs cluster predictably. Plan stage exhaustively lists each type's accepted top-level vs `config` keys.

43. **A3 (locked) — Computed `expression` is interpolation-only (`{fieldName}`); `compute` function handles everything else.** No operators, no conditionals, no function calls inside the expression string. Parser is ~20 lines of pure-JS string replace (no `eval`, no runtime risk). Documented in guide: "anything beyond `{x} {y}` goes in `compute: (values) => ...`."

44. **O1 (locked) — Conditional-logic performance: ship the simpler subscription model in v0.1.0, document the ~50-conditional ceiling.** Each condition compiles to a small dependency set; the form subscribes via RHF `watch()` per field on the union of all conditional dependencies. Realistic forms (30–40 fields, ≤20 conditional rules) stay well inside the budget. Plan stage adds a dev-warning at compile time when a schema exceeds 50 active conditionals so consumers know they're approaching the ceiling. Set-based optimizer revisits in v0.2 if real consumers hit the wall.

## Sign-off

> **Awaiting user sign-off.** Once confirmed, Stage 2 (`json-form-procomp-plan.md`) authoring begins.

### Locked decisions (pre-sign-off)

From the AskUserQuestion sequence prior to drafting:

- **Slug:** `json-form` (forms category). Sibling-not-replacement of `properties-form`.
- **Scope:** one procomp — renderer + extensible field registry. Visual builder deferred to a separate future procomp.
- **JSON shape:** custom field DSL → compiled to Zod internally. JSON-Schema parsing + Zod-first not adopted.
- **State substrate:** `react-hook-form` v7.x + `@hookform/resolvers` + `zod` (versions verified at GATE 2).
- **Renderer pattern:** registry-based, consumer-extensible (proven on `workspace` + `kanban-board-01`).
- **Field types v0.1.0:** text (text, email, password, url, tel, textarea, number), choice (select, multi-select, radio-group, checkbox, checkbox-group, switch), date/time (date, date-range, time, datetime), rich/composite (`code` via shipped `@ilinxa/code-block` + inline `slider` + `rating`). Special types: `computed`, `hidden`, `section`, `divider`.
- **Deferred to v0.1.x:** `richtext` field type (waits for a future `@ilinxa/plate-editor` — confirmed 2026-05-12: NOT shipped yet); `file` (waits for `@ilinxa/file-upload-01`); `color` (waits for `@ilinxa/color-picker-01`). All three additive, non-breaking when added.
- **Prerequisite shadcn primitives** (must be added via `pnpm dlx shadcn@latest add` before json-form can be built — verified missing in the project's `src/components/ui/` as of 2026-05-12): `form`, `radio-group`, `slider`, `label`. Already present: input, textarea, select, checkbox, switch, command, popover, calendar, button, separator, badge, tooltip, scroll-area.
- **Conditional logic:** declarative `visibleWhen` / `enabledWhen` / `requiredWhen` + Condition DSL (12 operators) + function escape hatch + `computed` field type.

### Locked decisions (from re-validation pass)

Re-validation surfaced **1 contradiction + 3 ambiguities + 1 optimization call**, all resolved inline above:

- **C1 — Hidden field semantics:** `type: 'hidden'` ALWAYS submits; `visibleWhen: false` strips by default. Per-field override via `keepValueWhenHidden: true`. (Q10)
- **A1 — Field-config shape:** hybrid — simple primitives top-level, complex objects under `config?: { richText?, code?, date? }`. (Q42)
- **A2 — Meta header rendering:** default on, opt-out via `showSchemaHeader={false}`. (Q25)
- **A3 — Computed expression power:** string interpolation only (`{field}`) + function escape hatch (`compute`). No mini-expression-language. (Q43)
- **O1 — Conditional perf:** ship simpler subscription model in v0.1.0; document the ~50-conditional ceiling; dev-warning at compile time when exceeded. (Q44)

### Plan-stage tightenings (won't block sign-off — addressed at GATE 2)

1. **T1 — `FieldRenderer` prop signature** — lock the exact shape: `(args: { field, value, onChange, onBlur, error, disabled, allValues, formApi }) => ReactNode` (TS interface fully spelled out, single canonical name).
2. **T2 — Cross-registry dep declaration** for `@ilinxa/code-block` (shipped — the one cross-registry dep in v0.1.0) in `validate-meta-deps`. Plan stage works out exact declaration shape with the lint script.
3. **T3 — Dynamic-import pattern** for the `code` field type so `@ilinxa/code-block`'s Shiki + CodeMirror chunks stay out of forms that don't use it. Registry maps `'code' → React.lazy(() => import('./parts/field-code'))`. Same pattern reserved for v0.1.x rich fields.
4. **T4 — `readOnly` vs `disabled` semantics** — both are field-level props; `readOnly` is "submitted but not editable" (`<input readonly>`), `disabled` is "submitted but greyed and not focusable". Plan documents the seam + how each composes with `enabledWhen: false`.
5. **T5 — Prerequisite primitives install gate** — plan-stage step before scaffolding: `pnpm dlx shadcn@latest add form radio-group slider label`. Verify each lands in `src/components/ui/`; capture lockfile churn in the same PR.
6. **T6 — Exact RHF version + Zod version pins** verified via `pnpm view react-hook-form version` + `pnpm view @hookform/resolvers version` + `pnpm view zod version` per the "verify peer packages exist during plan" memory.
7. **T7 — `truthy: boolean` semantics** — plan documents that `truthy: true` checks JS-truthy (covers `0`, `''`, `null`, `undefined`, `false`, `NaN` as false), and `truthy: false` is the falsy mirror. Edge cases (e.g., is `'0'` truthy? Yes per JS) get an explicit table in the guide.
8. **T8 — `zodSchema` merge semantics** — plan spells out the per-field precedence algorithm (consumer-provided Zod wins on conflict per M-03 lock) with a worked example showing what happens when a DSL `validators: { minLength: 3 }` collides with consumer `zodSchema.shape.email: z.string().min(5)`.
9. **T9 — Section / divider type discrimination** — `name` is optional for `section` + `divider`, required everywhere else. Plan decides whether to express this as a TS discriminated union (cleaner types, larger surface) or runtime-check (simpler types, runtime errors). Recommendation lean: discriminated union.

After Stage 2 sign-off, scaffolding (`pnpm new:component forms/json-form`) and implementation begin.
