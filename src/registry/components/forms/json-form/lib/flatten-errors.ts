/**
 * Shared error-flattener for RHF's nested error tree.
 *
 * The error tree can be either:
 *   { fieldName: { message: '...', type: '...' } }
 * or deeper:
 *   { address: { city: { message: '...' } } }
 *
 * Both flatten to dot-path keys. Two shapes are exposed because callers want
 * different output: `flattenRhfErrorsToRecord` for callback payloads (record),
 * `flattenRhfErrorsToList` for the summary UI (ordered list).
 */

interface FlatEntry {
  path: string;
  message: string;
}

function* walkRhfErrors(
  errors: Record<string, unknown>,
  prefix = "",
): Generator<FlatEntry> {
  for (const [key, val] of Object.entries(errors)) {
    if (!val) continue;
    const path = prefix ? `${prefix}.${key}` : key;
    if (
      typeof val === "object" &&
      val !== null &&
      "message" in val &&
      typeof (val as { message?: unknown }).message === "string"
    ) {
      yield { path, message: String((val as { message?: unknown }).message) };
      continue;
    }
    if (typeof val === "object" && val !== null) {
      yield* walkRhfErrors(val as Record<string, unknown>, path);
    }
  }
}

/** Flatten errors to `{ 'path.to.field': 'message' }`. Callback-payload shape. */
export function flattenRhfErrorsToRecord(
  errors: Record<string, unknown>,
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const { path, message } of walkRhfErrors(errors)) {
    out[path] = message;
  }
  return out;
}

/** Flatten errors to an ordered list. Summary-UI shape. */
export function flattenRhfErrorsToList(
  errors: Record<string, unknown>,
): Array<{ name: string; message: string }> {
  const out: Array<{ name: string; message: string }> = [];
  for (const { path, message } of walkRhfErrors(errors)) {
    out.push({ name: path, message });
  }
  return out;
}
