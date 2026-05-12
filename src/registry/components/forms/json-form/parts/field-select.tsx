"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { ChevronDownIcon, XIcon } from "lucide-react";
import type { FieldAriaProps, FieldOption, FieldRenderer } from "../types";
import { useAsyncOptions } from "../hooks/use-async-options";
import { useJsonFormContext } from "../json-form-context";

/**
 * Combined renderer for `select` + `multi-select`. Static-option `select`
 * uses shadcn `Select`; `searchable: true` OR `multi-select` switches to a
 * `Command + Popover` combobox.
 */
export const FieldSelect: FieldRenderer = ({
  field,
  value,
  onChange,
  onBlur,
  disabled,
  ariaProps,
}) => {
  const isMulti = field.type === "multi-select";
  const useCombobox = isMulti || !!field.searchable;
  const { options, loading, error, retry, setQuery } = useAsyncOptions(field);
  const ctx = useJsonFormContext();

  if (!useCombobox) {
    return (
      <Select
        value={value == null ? "" : String(value)}
        onValueChange={(v) => onChange(v == null ? null : coerceOptionValue(v, options))}
        disabled={disabled}
      >
        <SelectTrigger
          id={ariaProps.id}
          className="w-full"
          onBlur={onBlur}
          aria-required={ariaProps["aria-required"]}
          aria-invalid={ariaProps["aria-invalid"]}
          aria-disabled={ariaProps["aria-disabled"]}
          aria-describedby={ariaProps["aria-describedby"]}
        >
          <SelectValue placeholder={field.placeholder ?? "Select…"} />
        </SelectTrigger>
        <SelectContent>
          {loading ? (
            <div className="px-2 py-1 text-xs text-muted-foreground">
              {ctx.strings.loadingOptions}
            </div>
          ) : null}
          {error ? (
            <div className="flex items-center justify-between px-2 py-1 text-xs text-destructive">
              <span>{ctx.strings.optionsError}</span>
              <Button size="xs" variant="ghost" onClick={retry}>
                {ctx.strings.optionsRetry}
              </Button>
            </div>
          ) : null}
          {!loading && options.length === 0 && !error ? (
            <div className="px-2 py-1 text-xs text-muted-foreground">
              {ctx.strings.noOptions}
            </div>
          ) : null}
          {options.map((opt) => (
            <SelectItem
              key={String(opt.value)}
              value={String(opt.value)}
              disabled={opt.disabled}
            >
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }

  return (
    <ComboboxSelect
      isMulti={isMulti}
      value={value}
      onChange={onChange}
      onBlur={onBlur}
      disabled={disabled}
      options={options}
      loading={loading}
      error={error}
      retry={retry}
      setQuery={setQuery}
      placeholder={field.placeholder}
      ariaProps={ariaProps}
    />
  );
};

interface ComboboxProps {
  isMulti: boolean;
  value: unknown;
  onChange: (next: unknown) => void;
  onBlur: () => void;
  disabled: boolean;
  options: FieldOption[];
  loading: boolean;
  error: string | null;
  retry: () => void;
  setQuery: (q: string) => void;
  placeholder?: string;
  ariaProps: FieldAriaProps;
}

function ComboboxSelect({
  isMulti,
  value,
  onChange,
  onBlur,
  disabled,
  options,
  loading,
  error,
  retry,
  setQuery,
  placeholder,
  ariaProps,
}: ComboboxProps) {
  const ctx = useJsonFormContext();
  const [open, setOpen] = useState(false);
  const selected = normalizeSelected(value, isMulti);

  function toggle(opt: FieldOption) {
    if (isMulti) {
      const next = selected.includes(opt.value)
        ? selected.filter((v) => v !== opt.value)
        : [...selected, opt.value];
      onChange(next);
      return;
    }
    onChange(opt.value);
    setOpen(false);
  }

  function removeChip(v: unknown, e: React.MouseEvent) {
    e.stopPropagation();
    if (!isMulti) return;
    onChange(selected.filter((x) => x !== v));
  }

  return (
    <Popover
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) onBlur();
      }}
    >
      <PopoverTrigger asChild>
        <Button
          id={ariaProps.id}
          variant="outline"
          role="combobox"
          aria-expanded={open}
          aria-required={ariaProps["aria-required"]}
          aria-invalid={ariaProps["aria-invalid"]}
          aria-disabled={ariaProps["aria-disabled"]}
          aria-describedby={ariaProps["aria-describedby"]}
          disabled={disabled}
          className="h-auto min-h-9 w-full justify-between gap-1.5 px-2.5 py-1.5 font-normal"
        >
          <span className="flex flex-1 flex-wrap items-center gap-1">
            {selected.length === 0 ? (
              <span className="text-muted-foreground">
                {placeholder ?? "Select…"}
              </span>
            ) : isMulti ? (
              selected.map((v) => {
                const opt = options.find((o) => o.value === v);
                return (
                  <Badge
                    key={String(v)}
                    variant="secondary"
                    className={cn("gap-1 pr-1")}
                  >
                    <span>{opt?.label ?? String(v)}</span>
                    <span
                      role="button"
                      aria-label={`Remove ${opt?.label ?? String(v)}`}
                      tabIndex={0}
                      onClick={(e) => removeChip(v, e)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          e.stopPropagation();
                          onChange(selected.filter((x) => x !== v));
                        }
                      }}
                      className="inline-flex size-3.5 cursor-pointer items-center justify-center rounded hover:bg-foreground/10"
                    >
                      <XIcon className="size-3" />
                    </span>
                  </Badge>
                );
              })
            ) : (
              <span>
                {options.find((o) => o.value === selected[0])?.label ??
                  String(selected[0])}
              </span>
            )}
          </span>
          <ChevronDownIcon className="size-4 shrink-0 text-muted-foreground" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-(--radix-popover-trigger-width) p-0">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Search…"
            onValueChange={setQuery}
          />
          <CommandList>
            {loading ? (
              <div className="px-3 py-2 text-xs text-muted-foreground">
                {ctx.strings.loadingOptions}
              </div>
            ) : null}
            {error ? (
              <div className="flex items-center justify-between px-3 py-2 text-xs text-destructive">
                <span>{ctx.strings.optionsError}</span>
                <Button size="xs" variant="ghost" onClick={retry}>
                  {ctx.strings.optionsRetry}
                </Button>
              </div>
            ) : null}
            {!loading && options.length === 0 && !error ? (
              <CommandEmpty>{ctx.strings.noOptions}</CommandEmpty>
            ) : null}
            <CommandGroup>
              {options.map((opt) => {
                const isSel = selected.includes(opt.value);
                return (
                  <CommandItem
                    key={String(opt.value)}
                    value={String(opt.label)}
                    disabled={opt.disabled}
                    data-checked={isSel || undefined}
                    onSelect={() => toggle(opt)}
                  >
                    <span>{opt.label}</span>
                    {opt.description ? (
                      <span className="ml-auto text-xs text-muted-foreground">
                        {opt.description}
                      </span>
                    ) : null}
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

function normalizeSelected(value: unknown, isMulti: boolean): unknown[] {
  if (isMulti) {
    if (Array.isArray(value)) return value;
    return value == null ? [] : [value];
  }
  if (value == null || value === "") return [];
  return [value];
}

/**
 * Preserve non-string option.value types through the shadcn Select string
 * round-trip. shadcn Select only accepts string values; if the consumer's
 * option had `{ value: 42, label: "..." }`, we'd otherwise submit `"42"`
 * instead of `42`. Look up the original `option.value` by stringified key.
 */
function coerceOptionValue(raw: string, options: FieldOption[]): unknown {
  const match = options.find((o) => String(o.value) === raw);
  return match ? match.value : raw;
}

export default FieldSelect;
