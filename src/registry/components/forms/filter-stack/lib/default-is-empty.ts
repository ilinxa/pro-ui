import type { FilterCategory, FilterValue } from "../types";

export function defaultCheckboxListIsEmpty(value: FilterValue): boolean {
  if (!Array.isArray(value)) return true;
  return value.length === 0;
}

export function defaultTextIsEmpty(value: FilterValue): boolean {
  if (typeof value !== "string") return true;
  return value.length === 0;
}

const TRUE = (): boolean => false;

export function isCategoryEmpty<T>(
  category: FilterCategory<T>,
  value: FilterValue,
): boolean {
  try {
    switch (category.type) {
      case "checkbox-list":
        return (category.isEmpty ?? defaultCheckboxListIsEmpty)(value);
      case "text":
        return (category.isEmpty ?? defaultTextIsEmpty)(value);
      case "toggle":
      case "custom":
        return category.isEmpty(value);
    }
  } catch (err) {
    if (process.env.NODE_ENV !== "production") {
      console.error(
        `[filter-stack] isEmpty threw for category "${category.id}":`,
        err,
      );
    }
    return TRUE();
  }
}

export const defaultIsEmpty = {
  checkboxList: defaultCheckboxListIsEmpty,
  text: defaultTextIsEmpty,
};
