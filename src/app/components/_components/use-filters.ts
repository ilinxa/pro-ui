"use client";

import { useCallback, useMemo, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import type {
  ComponentCategorySlug,
  ComponentStatus,
} from "@/registry/types";
import {
  EMPTY_FILTERS,
  activeCount as countActive,
  isEmpty,
  type FilterState,
} from "./filter-utils";

const SEP = ",";

const KEYS = {
  q: "q",
  categories: "cat",
  stacks: "stack",
  tags: "tag",
  status: "status",
} as const;

const VALID_CATEGORIES = new Set<ComponentCategorySlug>([
  "data",
  "forms",
  "navigation",
  "feedback",
  "marketing",
  "layout",
  "media",
  "overlays",
  "auth",
]);

const VALID_STATUSES = new Set<ComponentStatus>([
  "alpha",
  "beta",
  "stable",
  "deprecated",
]);

function readList(params: URLSearchParams, key: string): string[] {
  const raw = params.get(key);
  if (!raw) return [];
  return raw
    .split(SEP)
    .map((s) => s.trim())
    .filter(Boolean);
}

function parseFilters(params: URLSearchParams): FilterState {
  const categories = readList(params, KEYS.categories).filter((c): c is ComponentCategorySlug =>
    VALID_CATEGORIES.has(c as ComponentCategorySlug),
  );
  const status = readList(params, KEYS.status).filter((s): s is ComponentStatus =>
    VALID_STATUSES.has(s as ComponentStatus),
  );

  return {
    q: params.get(KEYS.q) ?? "",
    categories,
    stacks: readList(params, KEYS.stacks),
    tags: readList(params, KEYS.tags),
    status,
  };
}

function writeList(params: URLSearchParams, key: string, values: string[]): void {
  if (values.length === 0) {
    params.delete(key);
  } else {
    params.set(key, values.join(SEP));
  }
}

function serializeFilters(filters: FilterState): URLSearchParams {
  const params = new URLSearchParams();
  if (filters.q.trim() !== "") params.set(KEYS.q, filters.q);
  writeList(params, KEYS.categories, filters.categories);
  writeList(params, KEYS.stacks, filters.stacks);
  writeList(params, KEYS.tags, filters.tags);
  writeList(params, KEYS.status, filters.status);
  return params;
}

export type UseFiltersResult = {
  filters: FilterState;
  setFilter: <K extends keyof FilterState>(key: K, value: FilterState[K]) => void;
  toggleListValue: <K extends "categories" | "stacks" | "tags" | "status">(
    key: K,
    value: FilterState[K][number],
  ) => void;
  removeListValue: <K extends "categories" | "stacks" | "tags" | "status">(
    key: K,
    value: FilterState[K][number],
  ) => void;
  clearAll: () => void;
  hasActive: boolean;
  activeCount: number;
  isPending: boolean;
};

export function useFilters(): UseFiltersResult {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const filters = useMemo(
    () => parseFilters(new URLSearchParams(searchParams.toString())),
    [searchParams],
  );

  const push = useCallback(
    (next: FilterState) => {
      const params = serializeFilters(next);
      const qs = params.toString();
      const url = qs ? `${pathname}?${qs}` : pathname;
      startTransition(() => {
        router.replace(url, { scroll: false });
      });
    },
    [pathname, router],
  );

  const setFilter = useCallback(
    <K extends keyof FilterState>(key: K, value: FilterState[K]) => {
      push({ ...filters, [key]: value });
    },
    [filters, push],
  );

  const toggleListValue = useCallback(
    <K extends "categories" | "stacks" | "tags" | "status">(
      key: K,
      value: FilterState[K][number],
    ) => {
      const list = filters[key] as string[];
      const next = list.includes(value as string)
        ? list.filter((v) => v !== value)
        : [...list, value as string];
      push({ ...filters, [key]: next as FilterState[K] });
    },
    [filters, push],
  );

  const removeListValue = useCallback(
    <K extends "categories" | "stacks" | "tags" | "status">(
      key: K,
      value: FilterState[K][number],
    ) => {
      const list = filters[key] as string[];
      const next = list.filter((v) => v !== value);
      push({ ...filters, [key]: next as FilterState[K] });
    },
    [filters, push],
  );

  const clearAll = useCallback(() => {
    push(EMPTY_FILTERS);
  }, [push]);

  return {
    filters,
    setFilter,
    toggleListValue,
    removeListValue,
    clearAll,
    hasActive: !isEmpty(filters),
    activeCount: countActive(filters),
    isPending,
  };
}
