"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowUpDown } from "lucide-react";
import type { TodoTreeSort } from "../types";
import { cn } from "@/lib/utils";

interface SortOption {
  value: string;
  label: string;
  spec: Exclude<TodoTreeSort, { kind: "custom" }>;
}

const SORT_OPTIONS: ReadonlyArray<SortOption> = [
  { value: "name-asc", label: "Name ↑", spec: { kind: "name", direction: "asc" } },
  { value: "name-desc", label: "Name ↓", spec: { kind: "name", direction: "desc" } },
  { value: "setAt-asc", label: "Created ↑", spec: { kind: "setAt", direction: "asc" } },
  { value: "setAt-desc", label: "Created ↓", spec: { kind: "setAt", direction: "desc" } },
  { value: "expireAt-asc", label: "Due ↑", spec: { kind: "expireAt", direction: "asc" } },
  { value: "expireAt-desc", label: "Due ↓", spec: { kind: "expireAt", direction: "desc" } },
  { value: "status-asc", label: "Status ↑", spec: { kind: "status", direction: "asc" } },
  { value: "status-desc", label: "Status ↓", spec: { kind: "status", direction: "desc" } },
];

function sortToValue(sort: TodoTreeSort): string | undefined {
  if (sort.kind === "custom") return undefined;
  return `${sort.kind}-${sort.direction}`;
}

export interface TodoTreeSortDropdownProps {
  value: TodoTreeSort;
  onChange: (next: TodoTreeSort) => void;
  className?: string;
}

/**
 * Sort selector. 4 sort kinds × 2 directions = 8 options + a "Custom" display
 * label when the consumer has set a custom comparator (the dropdown reads
 * read-only in that case until the consumer flips back to a named kind).
 *
 * F-cross-13 pre-emption (L11): onValueChange widened to accept `string | null`
 * (Base UI's Select signature). Null coalesces to "name-asc".
 */
export function TodoTreeSortDropdown({
  value,
  onChange,
  className,
}: TodoTreeSortDropdownProps) {
  const isCustom = value.kind === "custom";
  const current = sortToValue(value);

  return (
    <Select
      value={current ?? ""}
      disabled={isCustom}
      onValueChange={(v: string | null) => {
        const choice = v ?? "name-asc";
        const match = SORT_OPTIONS.find((o) => o.value === choice);
        if (!match) return;
        onChange(match.spec);
      }}
    >
      <SelectTrigger
        aria-label="Sort"
        className={cn("h-8 w-[140px]", className)}
      >
        <ArrowUpDown className="mr-1 size-3.5 text-muted-foreground" />
        <SelectValue placeholder={isCustom ? "Custom" : "Sort"} />
      </SelectTrigger>
      <SelectContent>
        {SORT_OPTIONS.map((o) => (
          <SelectItem key={o.value} value={o.value}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
