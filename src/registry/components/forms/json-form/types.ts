import type { CSSProperties, ReactNode, Ref } from "react";
import type { UseFormReturn } from "react-hook-form";
import type { ZodObject, ZodTypeAny } from "zod";

/* eslint-disable @typescript-eslint/no-explicit-any -- `Record<string, any>` is required to satisfy react-hook-form's `FieldValues` constraint; `unknown` won't type-check there. */

// ─── Field DSL ───────────────────────────────────────────────────────────────

/** All built-in v0.1.x field types, plus string for consumer-registered ones. */
export type FieldType =
  // text family
  | "text" | "email" | "password" | "url" | "tel" | "textarea" | "number"
  // choice family
  | "select" | "multi-select" | "radio-group" | "checkbox" | "checkbox-group" | "switch"
  // date/time family
  | "date" | "date-range" | "time" | "datetime"
  // rich / composite (v0.1.0 + v0.1.1 `richtext`)
  | "code" | "slider" | "rating" | "richtext"
  // special
  | "computed" | "hidden" | "section" | "divider"
  // consumer-extended (registry lookup); also covers v0.1.x types ('file', 'color', 'array') before they ship
  | (string & {});

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
  /** v0.1.1 — Plate-based richtext field config. `hideToolbar` collapses both top and floating toolbars. */
  richText?: { hideToolbar?: boolean; autoFocus?: boolean };
  // v0.1.x additions land here non-breakingly: file?, color?
}

/** Declarative validators block. Compiled to Zod chain at schema-compile time. */
export interface FieldValidators {
  required?: boolean | string;
  min?: number | string | { value: number | string; message: string };
  max?: number | string | { value: number | string; message: string };
  minLength?: number | { value: number; message: string };
  maxLength?: number | { value: number; message: string };
  pattern?: string | { value: string; message: string };
  email?: boolean | { message: string };
  url?: boolean | { message: string };
}

/** Condition DSL — 11 operators + function escape hatch. */
export type Condition =
  | { field: string; equals: unknown }
  | { field: string; notEquals: unknown }
  | { field: string; in: ReadonlyArray<unknown> }
  | { field: string; notIn: ReadonlyArray<unknown> }
  | { field: string; matches: string }
  | { field: string; truthy: boolean }
  | { field: string; greaterThan: number }
  | { field: string; lessThan: number }
  | { all: ReadonlyArray<Condition> }
  | { any: ReadonlyArray<Condition> }
  | { not: Condition };

export type ConditionOrFn =
  | Condition
  | ((args: { values: Record<string, unknown> }) => boolean);

/**
 * A single field definition in the JSON schema.
 *
 * `name` is REQUIRED for all field types — including `section` and `divider`,
 * which produce no value but use `name` as a stable React key. Consumer
 * convention: prefix non-value-carrying names with `_` (e.g., `'_personal'`,
 * `'_divider1'`). Compiler ignores `name` for `section`/`divider` when
 * building the ZodObject.
 */
export interface FieldDefinition {
  name: string;
  type: FieldType;
  label?: string;
  description?: string;
  placeholder?: string;
  defaultValue?: unknown;

  validators?: FieldValidators;
  validate?: (args: { value: unknown; allValues: Record<string, unknown> }) => string | undefined;
  validateAsync?: (args: { value: unknown; allValues: Record<string, unknown> }) => Promise<string | undefined>;
  validateAsyncDebounce?: number;

  visibleWhen?: ConditionOrFn;
  enabledWhen?: ConditionOrFn;
  requiredWhen?: ConditionOrFn;
  keepValueWhenHidden?: boolean;

  options?: ReadonlyArray<FieldOption> | FieldOptionsResolver;
  searchable?: boolean;
  optionsDebounce?: number;
  min?: number; max?: number; step?: number;
  rows?: number;
  lang?: string;

  config?: FieldConfig;

  expression?: string;
  compute?: (args: { values: Record<string, unknown> }) => unknown;
  editable?: boolean;

  row?: string;
  colSpan?: "full" | 1 | 2;
  width?: "full" | "half" | "third" | "quarter" | number;
  labelPosition?: "top" | "left";

  disabled?: boolean;
  readOnly?: boolean;
  autoComplete?: string;
  autoFocus?: boolean;
}

/** Top-level form schema. */
export interface FormSchema {
  fields: ReadonlyArray<FieldDefinition>;
  validate?: (args: { values: Record<string, unknown> }) => Record<string, string> | undefined;
  zodSchema?: ZodObject<Record<string, ZodTypeAny>>;
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

/**
 * ARIA attributes the field-wrapper computes once per render and passes to
 * the renderer. Renderers MUST attach these to the appropriate interactive
 * element:
 *
 * - **Native form controls** (`<input>`, `<textarea>`, `<button>`, etc.):
 *   spread `id` + `aria-required` + `aria-invalid` + `aria-disabled` +
 *   `aria-describedby` onto the element. The wrapper's `<label htmlFor>`
 *   targets the same `id`.
 * - **Group-style controls** (`role="radiogroup"`, `role="group"`,
 *   custom widgets): attach `aria-labelledby={labelledBy}` to the group root
 *   instead of `id` (HTML `label[for]` doesn't bind to non-form controls).
 *   Still spread the remaining `aria-*` attributes.
 *
 * v0.1.2 — `ariaProps` replaces the v0.1.0 `Slot.Root` forwarding strategy.
 * That approach silently failed for Popover-wrapped controls and ARIA groups
 * because Radix `Popover.Root` is a context-only component (no DOM node).
 */
export interface FieldAriaProps {
  /** Use on native form controls so `label[htmlFor]` binds correctly. */
  id: string;
  /** Use on group-style controls via `aria-labelledby`. */
  labelledBy: string;
  "aria-required"?: true;
  "aria-invalid"?: true;
  "aria-disabled"?: true;
  "aria-describedby"?: string;
}

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
  /** v0.1.2 — ARIA bridge. See `FieldAriaProps` for usage rules. */
  ariaProps: FieldAriaProps;
}

export type FieldRenderer = (args: FieldRendererArgs) => ReactNode;

// ─── Imperative handle ────────────────────────────────────────────────────────

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
  isSubmitting: () => boolean;
}

// ─── Strings dictionary ───────────────────────────────────────────────────────

export interface JsonFormStrings {
  submit: string;
  reset: string;
  requiredIndicator: string;
  optionalIndicator: string;
  loadingOptions: string;
  optionsError: string;
  optionsRetry: string;
  noOptions: string;
  summaryHeading: string;
  submitFailed: string;
  errorTemplates: {
    required: string;
    minLength: string;
    maxLength: string;
    min: string;
    max: string;
    pattern: string;
    email: string;
    url: string;
  };
}

// ─── Component props ──────────────────────────────────────────────────────────

export type ButtonVariant = "default" | "outline" | "ghost" | "secondary" | "destructive";

export interface JsonFormProps<TValues extends Record<string, any> = Record<string, unknown>> {
  schema: FormSchema;
  defaultValues?: Partial<TValues>;
  values?: Partial<TValues>;

  onSubmit: (args: JsonFormValuesArgs<TValues>) => void | Promise<void>;
  onSubmitError?: (args: JsonFormSubmitErrorArgs<TValues>) => void;
  onChange?: (args: JsonFormValuesArgs<TValues>) => void;
  onChangeDebounce?: number;
  onValidationChange?: (args: JsonFormValidationChangeArgs) => void;

  columns?: 1 | 2;
  labelPosition?: "top" | "left";
  showSummary?: boolean;
  summaryStrategy?: "always" | "post-submit";
  showSchemaHeader?: boolean;

  submitButton?:
    | {
        label?: string;
        variant?: ButtonVariant;
        align?: "left" | "right" | "center";
        disableWhenInvalid?: boolean;
      }
    | ((args: { isSubmitting: boolean; isValid: boolean }) => ReactNode)
    | false;
  resetButton?: { label?: string; variant?: ButtonVariant };

  fieldRegistry?: Record<string, FieldRenderer>;
  renderField?: (args: { field: FieldDefinition; defaultRender: () => ReactNode }) => ReactNode;

  validationMode?: "onChange" | "onBlur" | "onTouched" | "onSubmit" | "all";

  strings?: Partial<JsonFormStrings>;
  className?: string;
  style?: CSSProperties;
  ref?: Ref<JsonFormHandle<TValues>>;
}

// ─── Standalone-parts contexts ────────────────────────────────────────────────

export type JsonFormContextValue<TValues extends Record<string, any> = Record<string, any>> = JsonFormHandle<TValues> & {
  rhf: UseFormReturn<TValues>;
  schema: FormSchema;
  zodSchema: ZodObject<Record<string, ZodTypeAny>>;
  strings: JsonFormStrings;
  formId: string;
  hasSubmitted: boolean;
  /** Merged field registry (default ⨯ consumer overrides). Exposed for standalone parts that resolve renderers. */
  fieldRegistry: Record<string, FieldRenderer>;
};

export interface UseJsonFormReturn<TValues extends Record<string, any>> {
  form: UseFormReturn<TValues>;
  zodSchema: ZodObject<Record<string, ZodTypeAny>>;
  fieldList: ReadonlyArray<FieldDefinition>;
  isValid: boolean;
  isSubmitting: boolean;
  handle: JsonFormHandle<TValues>;
}

export interface UseJsonFormOptions<TValues extends Record<string, any>> {
  defaultValues?: Partial<TValues>;
  values?: Partial<TValues>;
  validationMode?: "onChange" | "onBlur" | "onTouched" | "onSubmit" | "all";
  strings?: Partial<JsonFormStrings>;
}

/* eslint-enable @typescript-eslint/no-explicit-any */
