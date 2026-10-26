import { defaultEntityPickerLabels, type EntityPickerLabels } from "../types";

/** Merge a partial `labels` over the defaults; an explicit `undefined` keeps the default. */
export function resolveLabels(
  labels: Partial<EntityPickerLabels> | undefined,
): EntityPickerLabels {
  const out: EntityPickerLabels = { ...defaultEntityPickerLabels };
  if (!labels) return out;
  const target = out as unknown as Record<string, unknown>;
  for (const [key, value] of Object.entries(labels)) {
    if (value !== undefined) target[key] = value;
  }
  return out;
}

/**
 * Locale-formats a count. No `locale` or an invalid one formats as `"en"` —
 * never the runtime default, which can differ between server and client.
 */
export function formatCount(count: number, locale: string | undefined): string {
  try {
    return new Intl.NumberFormat(locale ?? "en").format(count);
  } catch {
    return new Intl.NumberFormat("en").format(count);
  }
}
