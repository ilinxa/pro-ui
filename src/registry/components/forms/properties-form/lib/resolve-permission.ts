import type {
  FieldPermission,
  PropertiesFormField,
} from "../types";

export function resolveFieldPermission(
  field: PropertiesFormField,
  values: Record<string, unknown>,
  hostResolver?: (
    field: PropertiesFormField,
    values: Record<string, unknown>,
  ) => FieldPermission | undefined,
): FieldPermission {
  if (hostResolver) {
    let hostResult: FieldPermission | undefined;
    try {
      hostResult = hostResolver(field, values);
    } catch (err) {
      if (process.env.NODE_ENV !== "production") {
        console.error(
          `[properties-form] resolvePermission threw for field "${field.key}":`,
          err,
        );
      }
      hostResult = undefined;
    }
    if (hostResult !== undefined) return hostResult;
  }
  if (field.permission !== undefined) return field.permission;
  return "editable";
}
