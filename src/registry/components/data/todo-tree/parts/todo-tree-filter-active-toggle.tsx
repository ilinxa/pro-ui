"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ActiveMode = "all" | "active" | "inactive";

export interface TodoTreeFilterActiveToggleProps {
  value: ActiveMode | undefined;
  onChange: (next: ActiveMode) => void;
  className?: string;
}

const MODES: ReadonlyArray<{ value: ActiveMode; label: string }> = [
  { value: "all", label: "All" },
  { value: "active", label: "Active" },
  { value: "inactive", label: "Done" },
];

/**
 * Segmented control for the active/inactive filter. Three values; uses
 * native `<button>` array with `aria-pressed` rather than a Tabs primitive
 * to keep the trigger trivially compact.
 */
export function TodoTreeFilterActiveToggle({
  value = "all",
  onChange,
  className,
}: TodoTreeFilterActiveToggleProps) {
  return (
    <div
      role="group"
      aria-label="Filter by active state"
      className={cn(
        "inline-flex h-8 items-center rounded-md border border-input bg-background p-0.5",
        className,
      )}
    >
      {MODES.map((mode) => (
        <Button
          key={mode.value}
          type="button"
          variant={value === mode.value ? "secondary" : "ghost"}
          size="sm"
          aria-pressed={value === mode.value}
          onClick={() => onChange(mode.value)}
          className="h-7 px-2 text-xs"
        >
          {mode.label}
        </Button>
      ))}
    </div>
  );
}
