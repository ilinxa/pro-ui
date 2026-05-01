/**
 * Default absolute-date formatter — browser locale, long format
 * (e.g. "May 1, 2026"). Consumers override via `formatDate` prop.
 */
export const defaultDateFormat = (date: Date): string =>
  date.toLocaleDateString(undefined, {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

/**
 * Coerce a `string | Date` value to `Date`. Returns `undefined` if
 * the input is itself undefined or fails to parse.
 */
export const toDate = (value: string | Date | undefined): Date | undefined => {
  if (value === undefined) return undefined;
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? undefined : value;
  }
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
};
