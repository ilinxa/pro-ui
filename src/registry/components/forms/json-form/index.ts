// Top-level component + standalone parts
export { JsonForm } from "./json-form";
export {
  JsonFormProvider,
  useJsonFormContext,
  useJsonFormHasSubmitted,
} from "./json-form-context";
export { JsonFormField } from "./parts/json-form-field";
export { JsonFormErrorSummary } from "./parts/error-summary";
export { JsonFormSubmitButton } from "./parts/submit-button";
export { JsonFormResetButton } from "./parts/reset-button";
export { FormHeader as JsonFormHeader } from "./parts/form-header";
export { FieldWrapper as JsonFormFieldWrapper } from "./parts/field-wrapper";

// Headless factory + default registry (consumer can spread + extend)
export { useJsonForm } from "./hooks/use-json-form";
export { defaultJsonFormRegistry } from "./lib/default-registry";

// String dictionary + helpers
export { defaultStrings as defaultJsonFormStrings, mergeStrings as mergeJsonFormStrings } from "./lib/strings";

// Note: `ARTICLE_BODY_EMPTY_VALUE` (the canonical Plate "empty paragraph"
// default) is intentionally NOT re-exported from this barrel. Earlier
// attempts (v0.1.3 + v0.1.4) hit a shadcn path-rewriter inconsistency
// where cross-slug imports from `index.ts` (and `lib/*.ts`) didn't get
// the same flattening as imports from `parts/*.tsx`. Consumers using
// `richtext` fields should import the empty default directly from
// `@ilinxa/article-body-01`:
//
//   import { ARTICLE_BODY_EMPTY_VALUE } from "@/components/article-body-01";
//
// (or whatever the consumer-side path is for their setup). Documented
// in usage.tsx.

// Public types
export type {
  ButtonVariant,
  Condition,
  ConditionOrFn,
  FieldConfig,
  FieldAriaProps,
  FieldDefinition,
  FieldOption,
  FieldOptionsResolver,
  FieldRenderer,
  FieldRendererArgs,
  FieldType,
  FieldValidators,
  FormSchema,
  JsonFormContextValue,
  JsonFormHandle,
  JsonFormProps,
  JsonFormStrings,
  JsonFormSubmitErrorArgs,
  JsonFormValidationChangeArgs,
  JsonFormValuesArgs,
  UseJsonFormOptions,
  UseJsonFormReturn,
} from "./types";
