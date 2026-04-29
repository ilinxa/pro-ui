import type { FilterCategory } from "../types";

export const RESERVED_SUFFIXES = ["__mode"] as const;

export function validateCategorySchema(
  categories: ReadonlyArray<FilterCategory<unknown>>,
): void {
  if (process.env.NODE_ENV === "production") return;

  const seen = new Set<string>();
  for (const cat of categories) {
    for (const suffix of RESERVED_SUFFIXES) {
      if (cat.id.endsWith(suffix)) {
        console.error(
          `[filter-stack] category id "${cat.id}" ends in reserved suffix "${suffix}". ` +
            `Pick a different id; "${suffix}" is used internally for mode storage.`,
        );
      }
    }
    if (seen.has(cat.id)) {
      console.error(`[filter-stack] duplicate category id "${cat.id}".`);
    }
    seen.add(cat.id);
    if (
      cat.type === "checkbox-list" &&
      (!cat.options || cat.options.length === 0)
    ) {
      console.warn(
        `[filter-stack] checkbox-list category "${cat.id}" has no options.`,
      );
    }
    if (
      cat.type === "checkbox-list" &&
      cat.modeToggle === false &&
      cat.defaultMode !== undefined
    ) {
      console.warn(
        `[filter-stack] category "${cat.id}" has \`defaultMode\` but \`modeToggle\` is false; defaultMode will be ignored.`,
      );
    }
  }
}
