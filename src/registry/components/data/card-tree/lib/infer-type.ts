/**
 * Pure scalar type inference for flat fields.
 *
 * v0.1 supports five field types:
 *   string | number | boolean | date | null
 *
 * `date` is a string-subtype: an ISO-8601 string that ALSO parses to a real Date.
 * The dual check (regex + Date.parse) rules out false positives like "2026-12-99".
 */

export type FlatFieldType = "string" | "number" | "boolean" | "date" | "null";

export type DateDetection =
  | "auto"
  | "never"
  | ((value: string) => boolean);

const ISO_8601 =
  /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})?)?$/;

/**
 * Returns the resolved `FlatFieldType` for a JSON-scalar value, or `null`
 * if the value isn't a supported scalar (caller should error).
 */
export function inferFlatFieldType(
  value: unknown,
  dateDetection: DateDetection,
): FlatFieldType | null {
  if (value === null) return "null";
  if (typeof value === "boolean") return "boolean";
  if (typeof value === "number") return Number.isFinite(value) ? "number" : "string";
  if (typeof value === "string") return inferStringType(value, dateDetection);
  return null;
}

function inferStringType(
  value: string,
  dateDetection: DateDetection,
): FlatFieldType {
  if (dateDetection === "never") return "string";
  if (typeof dateDetection === "function") {
    return dateDetection(value) ? "date" : "string";
  }
  // 'auto': pattern match + real-date validation
  if (ISO_8601.test(value) && !Number.isNaN(Date.parse(value))) return "date";
  return "string";
}
