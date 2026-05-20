"use client";

import { useState } from "react";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useDebouncedCallback } from "../hooks/use-debounced-callback";
import { cn } from "@/lib/utils";

export interface TodoTreeSearchInputProps {
  /** Current debounced query — used as the canonical source on external changes. */
  value: string;
  onChange: (next: string) => void;
  /** Default 200ms per Q-P4. */
  delayMs?: number;
  placeholder?: string;
  className?: string;
}

/**
 * Search input. Raw text lives in a local input ref so each keystroke
 * doesn't churn the reducer; a debounced (default 200ms) wrapper publishes
 * the trimmed value via `onChange`. External resets (clear-all-filters)
 * sync the local input by re-seeding on prop change.
 */
export function TodoTreeSearchInput({
  value,
  onChange,
  delayMs = 200,
  placeholder = "Search items...",
  className,
}: TodoTreeSearchInputProps) {
  const [local, setLocal] = useState(value);
  const [lastSeenValue, setLastSeenValue] = useState(value);

  // Adjust local-on-prop-change without an effect — React's recommended
  // pattern for "derived state that syncs to a prop" (avoids the cascading-
  // render warning that fires for setState-in-useEffect on a value dep).
  if (value !== lastSeenValue) {
    setLastSeenValue(value);
    setLocal(value);
  }

  const debounced = useDebouncedCallback(onChange, delayMs);

  return (
    <div className={cn("relative flex-1 min-w-0", className)}>
      <Search className="pointer-events-none absolute left-2 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
      <Input
        type="search"
        value={local}
        placeholder={placeholder}
        onChange={(e) => {
          setLocal(e.target.value);
          debounced(e.target.value);
        }}
        className="h-8 pl-7 pr-7"
        aria-label="Search todo tree"
      />
      {local.length > 0 && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="Clear search"
          onClick={() => {
            setLocal("");
            onChange("");
          }}
          className="absolute right-0.5 top-1/2 size-7 -translate-y-1/2 p-0"
        >
          <X className="size-3" />
        </Button>
      )}
    </div>
  );
}
