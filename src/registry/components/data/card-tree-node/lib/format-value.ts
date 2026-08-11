import type { FlatFieldType } from "../types";

const NUMBER_FORMAT = new Intl.NumberFormat(undefined);
const DATE_FORMAT = new Intl.DateTimeFormat(undefined, { dateStyle: "short" });

/**
 * Render a flat field's value as a display string. Type-aware:
 *   - `number`  → locale-aware separator formatting (`1,234.56`)
 *   - `boolean` → "✓" / "—" (true / false). Dashboards-friendly; avoids the
 *     ambiguity of "Yes"/"No" without consuming the field-key column.
 *   - `date`    → short locale date (`5/16/26` US, `16/05/2026` EU)
 *   - `string`  → as-is
 */
export function formatValue(value: unknown, type: FlatFieldType): string {
  switch (type) {
    case "number":
      return typeof value === "number" ? NUMBER_FORMAT.format(value) : String(value);
    case "boolean":
      return value === true ? "✓" : "—";
    case "date": {
      if (typeof value !== "string") return String(value);
      const d = new Date(value);
      if (Number.isNaN(d.getTime())) return value;
      return DATE_FORMAT.format(d);
    }
    case "string":
    default:
      return typeof value === "string" ? value : String(value);
  }
}
