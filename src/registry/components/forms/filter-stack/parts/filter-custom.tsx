"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";
import type { CustomFilter, FilterValue } from "../types";

interface FilterCustomProps<T> {
  category: CustomFilter<T>;
  values: Record<string, FilterValue>;
  onChange: (values: Record<string, FilterValue>) => void;
  items: ReadonlyArray<T>;
  fieldId: string;
}

class FilterErrorBoundary extends Component<
  { categoryId: string; children: ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(error: Error, info: ErrorInfo) {
    if (process.env.NODE_ENV !== "production") {
      console.error(
        `[filter-stack] custom render crashed for category "${this.props.categoryId}":`,
        error,
        info,
      );
    }
  }
  render() {
    if (this.state.hasError) {
      return (
        <p role="alert" className="text-xs text-destructive">
          Custom filter crashed — see console.
        </p>
      );
    }
    return this.props.children;
  }
}

export function FilterCustom<T>({
  category,
  values,
  onChange,
  items,
  fieldId,
}: FilterCustomProps<T>) {
  return (
    <FilterErrorBoundary categoryId={category.id}>
      {category.render({
        value: values[category.id],
        onChange: (next) => onChange({ ...values, [category.id]: next }),
        items,
        fieldId,
      })}
    </FilterErrorBoundary>
  );
}
