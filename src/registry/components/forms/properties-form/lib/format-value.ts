import type { PropertiesFormField } from "../types";

const EMPTY_DASH = "—";

export function formatFieldValue(
  field: PropertiesFormField,
  value: unknown,
): string {
  if (value === undefined || value === null) return EMPTY_DASH;
  switch (field.type) {
    case "string":
    case "textarea":
      return typeof value === "string" && value.length > 0 ? value : EMPTY_DASH;
    case "number":
      if (typeof value === "number" && Number.isFinite(value)) {
        return String(value);
      }
      if (typeof value === "string" && value.length > 0) return value;
      return EMPTY_DASH;
    case "boolean":
      return value ? "Yes" : "No";
    case "date":
      if (typeof value === "string" && value.length > 0) return value;
      if (value instanceof Date && !Number.isNaN(value.getTime())) {
        return value.toISOString().slice(0, 10);
      }
      return EMPTY_DASH;
    case "select": {
      const stringValue = typeof value === "string" ? value : String(value);
      const match = field.options?.find((o) => o.value === stringValue);
      return match?.label ?? stringValue;
    }
    default:
      return String(value);
  }
}

export const EMPTY_DISPLAY = EMPTY_DASH;
