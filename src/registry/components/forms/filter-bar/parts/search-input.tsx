"use client";

import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

/**
 * Search input with magnifier icon. Internal debounce when running in
 * uncontrolled mode (`isControlled = false`); controlled mode passes
 * value through immediately.
 */
export function SearchInput({
  value,
  onChange,
  isControlled,
  debounceMs,
  placeholder,
  ariaLabel,
  className,
}: {
  value: string;
  onChange: (next: string) => void;
  isControlled: boolean;
  debounceMs: number;
  placeholder: string;
  ariaLabel: string;
  className?: string;
}) {
  // Local state is the source of truth for keystrokes in uncontrolled mode.
  // In controlled mode the prop is the source of truth and `localValue`
  // is unused (so its initial seed doesn't matter).
  const [localValue, setLocalValue] = useState(value);

  // Debounce localValue → upstream onChange in uncontrolled mode only.
  useEffect(() => {
    if (isControlled) return;
    if (localValue === value) return;
    const id = setTimeout(() => onChange(localValue), debounceMs);
    return () => clearTimeout(id);
  }, [localValue, value, isControlled, debounceMs, onChange]);

  return (
    <div role="search" className={cn("relative", className)}>
      <Search
        aria-hidden="true"
        className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground"
      />
      <Input
        type="search"
        value={isControlled ? value : localValue}
        onChange={(event) => {
          const next = event.target.value;
          if (isControlled) onChange(next);
          else setLocalValue(next);
        }}
        placeholder={placeholder}
        aria-label={ariaLabel}
        className="h-14 rounded-xl border-border/50 pl-12 text-lg focus-visible:border-primary"
      />
    </div>
  );
}
