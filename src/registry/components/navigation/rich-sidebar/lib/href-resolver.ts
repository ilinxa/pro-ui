import type { NavItem } from "../types";

export interface HrefResolverOpts {
  templateValues?: Record<string, string>;
  resolveHref?: (item: NavItem, values: Record<string, string> | undefined) => string;
}

/**
 * Resolve a NavItem's href to its final string form (v0.2.0).
 *
 * Precedence per L43:
 *   1. `resolveHref` callback (if provided) — return value is final
 *   2. `{key}` substitution from `templateValues` (when item.href has placeholders)
 *   3. `item.href` as-is
 *
 * Returns `undefined` when the item has no href (consumer rendered as label).
 *
 * Dev-mode warns when `item.href` references `{xxx}` placeholders not present
 * in `templateValues` (Q19; missing-only — unused values are common and
 * silently ignored). Warning is NODE_ENV-gated so it tree-shakes from prod
 * bundles.
 */
export function resolveItemHref(
  item: NavItem,
  opts: HrefResolverOpts,
): string | undefined {
  const { templateValues, resolveHref } = opts;

  if (resolveHref) {
    return resolveHref(item, templateValues);
  }

  if (!item.href) return undefined;
  if (!templateValues) return item.href;

  return substituteTemplate(item.href, templateValues);
}

/**
 * Set-based dedup per re-validation Finding 3 — distinct placeholders
 * trigger ONE `replaceAll` call each + one dev-warn entry each, regardless
 * of how many times the placeholder appears in the href.
 */
function substituteTemplate(
  href: string,
  values: Record<string, string>,
): string {
  const placeholders = new Set<string>();
  for (const [, key] of href.matchAll(/\{([^}]+)\}/g)) {
    placeholders.add(key);
  }
  if (placeholders.size === 0) return href;

  const missingKeys = new Set<string>();
  let result = href;
  for (const key of placeholders) {
    if (key in values) {
      result = result.replaceAll(`{${key}}`, values[key]!);
    } else if (process.env.NODE_ENV !== "production") {
      missingKeys.add(key);
    }
  }

  if (missingKeys.size > 0 && process.env.NODE_ENV !== "production") {
    console.warn(
      `[rich-sidebar] href "${href}" references placeholder${missingKeys.size === 1 ? "" : "s"} ` +
        `{${Array.from(missingKeys).join("}, {")}} not present in hrefTemplateValues. ` +
        `Substitution skipped for missing keys.`,
    );
  }

  return result;
}
