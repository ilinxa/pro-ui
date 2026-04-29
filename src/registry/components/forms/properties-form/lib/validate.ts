import type { PropertiesFormField } from "../types";

const VALIDATOR_THROW_MESSAGE = "Validation error — see console";

export function safeValidateField(
  field: PropertiesFormField,
  value: unknown,
  allValues: Record<string, unknown>,
): string | undefined {
  if (!field.validate) return undefined;
  try {
    return field.validate(value, allValues);
  } catch (err) {
    if (process.env.NODE_ENV !== "production") {
      console.error(
        `[properties-form] validate threw for field "${field.key}":`,
        err,
      );
    }
    return VALIDATOR_THROW_MESSAGE;
  }
}

export function runRequiredCheck(
  field: PropertiesFormField,
  value: unknown,
): string | undefined {
  if (!field.required) return undefined;
  if (value === undefined || value === null) return "Required";
  if (typeof value === "string" && value.trim().length === 0) return "Required";
  return undefined;
}

export function validateAllFields(
  schema: ReadonlyArray<PropertiesFormField>,
  values: Record<string, unknown>,
): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const field of schema) {
    if (field.permission === "hidden") continue;
    const value = values[field.key];
    const requiredError = runRequiredCheck(field, value);
    if (requiredError) {
      errors[field.key] = requiredError;
      continue;
    }
    const userError = safeValidateField(field, value, values);
    if (userError) errors[field.key] = userError;
  }
  return errors;
}

export function safeRunFormValidate<T extends Record<string, unknown>>(
  hostValidate: ((values: T) => Record<string, string> | undefined) | undefined,
  values: T,
): { errors: Record<string, string>; formError: string | undefined } {
  if (!hostValidate) return { errors: {}, formError: undefined };
  try {
    const result = hostValidate(values);
    return { errors: result ?? {}, formError: undefined };
  } catch (err) {
    if (process.env.NODE_ENV !== "production") {
      console.error("[properties-form] form-level validate threw:", err);
    }
    return { errors: {}, formError: VALIDATOR_THROW_MESSAGE };
  }
}
