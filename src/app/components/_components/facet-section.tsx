"use client";

import { useMemo } from "react";

import { Checkbox } from "@/components/ui/checkbox";
import {
  Command,
  CommandEmpty,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { cn } from "@/lib/utils";

import type { FacetOption } from "./filter-utils";

type CheckboxFacetProps<T extends string> = {
  title: string;
  options: FacetOption<T>[];
  selected: T[];
  onToggle: (value: T) => void;
};

export function CheckboxFacet<T extends string>({
  title,
  options,
  selected,
  onToggle,
}: CheckboxFacetProps<T>) {
  const selectedSet = useMemo(() => new Set(selected), [selected]);

  return (
    <FacetFrame title={title} count={selected.length}>
      <ul className="flex flex-col">
        {options.map((opt) => {
          const isChecked = selectedSet.has(opt.value);
          const id = `facet-${title.toLowerCase()}-${opt.value}`;
          return (
            <li key={opt.value}>
              <label
                htmlFor={id}
                className="flex cursor-pointer items-center gap-2.5 rounded-md px-1.5 py-1.5 text-sm transition-colors hover:bg-accent"
              >
                <Checkbox
                  id={id}
                  checked={isChecked}
                  onCheckedChange={() => onToggle(opt.value)}
                />
                <span className="flex-1 truncate font-medium text-foreground">
                  {opt.label}
                </span>
                <span className="text-xs tabular-nums text-muted-foreground">
                  {opt.count}
                </span>
              </label>
            </li>
          );
        })}
      </ul>
    </FacetFrame>
  );
}

type CommandFacetProps = {
  title: string;
  options: FacetOption[];
  selected: string[];
  onToggle: (value: string) => void;
  searchPlaceholder?: string;
};

export function CommandFacet({
  title,
  options,
  selected,
  onToggle,
  searchPlaceholder = "Filter…",
}: CommandFacetProps) {
  const selectedSet = useMemo(() => new Set(selected), [selected]);

  return (
    <FacetFrame title={title} count={selected.length}>
      <Command className="overflow-hidden rounded-md border border-border bg-card">
        <CommandInput placeholder={searchPlaceholder} />
        <CommandList className="max-h-56">
          <CommandEmpty className="py-4 text-center text-xs text-muted-foreground">
            No matches.
          </CommandEmpty>
          {options.map((opt) => {
            const isChecked = selectedSet.has(opt.value);
            return (
              <CommandItem
                key={opt.value}
                value={opt.value}
                onSelect={() => onToggle(opt.value)}
                className="flex items-center gap-2.5"
              >
                <Checkbox
                  checked={isChecked}
                  onCheckedChange={() => onToggle(opt.value)}
                  aria-label={`Toggle ${opt.label}`}
                  className="pointer-events-none"
                />
                <span className="flex-1 truncate">{opt.label}</span>
                <span className="text-xs tabular-nums text-muted-foreground">
                  {opt.count}
                </span>
              </CommandItem>
            );
          })}
        </CommandList>
      </Command>
    </FacetFrame>
  );
}

type ToggleFacetProps<T extends string> = {
  title: string;
  options: FacetOption<T>[];
  selected: T[];
  onChange: (next: T[]) => void;
};

export function ToggleFacet<T extends string>({
  title,
  options,
  selected,
  onChange,
}: ToggleFacetProps<T>) {
  return (
    <FacetFrame title={title} count={selected.length}>
      <ToggleGroup
        type="multiple"
        value={selected}
        onValueChange={(next: string[]) => onChange(next as T[])}
        className="flex flex-wrap justify-start gap-1.5"
      >
        {options.map((opt) => (
          <ToggleGroupItem
            key={opt.value}
            value={opt.value}
            aria-label={`Toggle ${opt.label}`}
            className="h-8 rounded-full border border-border px-3 text-xs capitalize data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
          >
            <span>{opt.label}</span>
            <span className="ml-1 text-[10px] tabular-nums opacity-60">
              {opt.count}
            </span>
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
    </FacetFrame>
  );
}

function FacetFrame({
  title,
  count,
  children,
}: {
  title: string;
  count: number;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-2.5">
      <header className="flex items-baseline justify-between">
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        <span
          className={cn(
            "text-xs tabular-nums text-muted-foreground",
            count > 0 && "text-foreground",
          )}
        >
          {count > 0 ? `· ${count}` : null}
        </span>
      </header>
      {children}
    </section>
  );
}
