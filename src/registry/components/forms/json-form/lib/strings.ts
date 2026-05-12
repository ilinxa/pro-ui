import type { JsonFormStrings } from "../types";

export const defaultStrings: JsonFormStrings = {
  submit: "Submit",
  reset: "Reset",
  requiredIndicator: "*",
  optionalIndicator: "(optional)",
  loadingOptions: "Loading…",
  optionsError: "Failed to load options",
  optionsRetry: "Retry",
  noOptions: "No options",
  summaryHeading: "Please fix the following errors:",
  submitFailed: "Submission failed. Please try again.",
  errorTemplates: {
    required: "This field is required",
    minLength: "Must be at least {n} characters",
    maxLength: "Must be at most {n} characters",
    min: "Must be at least {n}",
    max: "Must be at most {n}",
    pattern: "Value does not match the required pattern",
    email: "Must be a valid email address",
    url: "Must be a valid URL",
  },
};

/** Substitute `{n}`, `{value}`, etc. in a template. */
export function formatErrorTemplate(
  template: string,
  params: Record<string, string | number>,
): string {
  return template.replace(/\{(\w+)\}/g, (_, key) =>
    key in params ? String(params[key]) : `{${key}}`,
  );
}

/** Shallow-merge consumer overrides into the default strings dictionary. */
export function mergeStrings(
  overrides: Partial<JsonFormStrings> | undefined,
): JsonFormStrings {
  if (!overrides) return defaultStrings;
  return {
    ...defaultStrings,
    ...overrides,
    errorTemplates: {
      ...defaultStrings.errorTemplates,
      ...(overrides.errorTemplates ?? {}),
    },
  };
}
