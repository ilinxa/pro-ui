import type { EntityLike } from "../types";

function fold(text: string, locale: string | undefined): string {
  if (!locale) return text.toLowerCase();
  try {
    return text.toLocaleLowerCase(locale);
  } catch {
    // Invalid BCP 47 tag: fall back rather than hide every item.
    return text.toLowerCase();
  }
}

export function defaultMatch<T extends EntityLike>(
  item: T,
  query: string,
  locale?: string,
): boolean {
  if (query.length === 0) return true;
  return fold(item.label, locale).includes(fold(query, locale));
}
