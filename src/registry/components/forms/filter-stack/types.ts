import type { ReactNode, Ref } from "react";

export type FilterValue = unknown;
export type FilterMode = "union" | "intersection";

export interface FilterOption {
  value: string;
  label: string;
}

interface BaseFilterCategory<T> {
  id: string;
  label: string;
  description?: string;
  predicate: (item: T, value: FilterValue) => boolean;
}

export interface CheckboxListFilter<T> extends BaseFilterCategory<T> {
  type: "checkbox-list";
  options: ReadonlyArray<FilterOption>;
  modeToggle?: boolean;
  defaultMode?: FilterMode;
  showSoloButtons?: boolean;
  isEmpty?: (value: FilterValue) => boolean;
}

export interface ToggleFilter<T> extends BaseFilterCategory<T> {
  type: "toggle";
  isEmpty: (value: FilterValue) => boolean;
}

export interface TextFilter<T> extends BaseFilterCategory<T> {
  type: "text";
  placeholder?: string;
  debounceMs?: number;
  isEmpty?: (value: FilterValue) => boolean;
}

export interface CustomFilterRenderProps<T> {
  value: unknown;
  onChange: (value: unknown) => void;
  items: ReadonlyArray<T>;
  fieldId: string;
}

export interface CustomFilter<T> extends BaseFilterCategory<T> {
  type: "custom";
  render: (props: CustomFilterRenderProps<T>) => ReactNode;
  isEmpty: (value: FilterValue) => boolean;
}

export type FilterCategory<T> =
  | CheckboxListFilter<T>
  | ToggleFilter<T>
  | TextFilter<T>
  | CustomFilter<T>;

export interface FilterStackProps<T = unknown> {
  items: ReadonlyArray<T>;
  categories: ReadonlyArray<FilterCategory<T>>;

  values: Record<string, FilterValue>;
  onChange: (values: Record<string, FilterValue>) => void;

  onFilteredChange?: (filtered: ReadonlyArray<T>) => void;

  showClearAll?: boolean;
  clearAllLabel?: string;

  ariaLabel?: string;
  className?: string;

  ref?: Ref<FilterStackHandle>;
}

export interface FilterStackHandle {
  clearAll(): void;
  clear(categoryId: string): void;
  isEmpty(): boolean;
}
