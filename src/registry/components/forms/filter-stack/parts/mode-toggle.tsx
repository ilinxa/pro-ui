"use client";

import { cn } from "@/lib/utils";
import type { FilterMode } from "../types";

interface ModeToggleProps {
  value: FilterMode;
  onChange: (mode: FilterMode) => void;
  ariaLabel: string;
}

const MODES: Array<{ mode: FilterMode; label: string }> = [
  { mode: "union", label: "Union" },
  { mode: "intersection", label: "Intersection" },
];

/**
 * Plain-button segmented control. Deliberately NOT shadcn ToggleGroup — its
 * value model diverges between Radix (single: string) and Base UI (string[]),
 * an F-cross-13 carrier that breaks Base-UI consumers (calendar-01 v0.2.1
 * precedent: same swap, toggle-group dep dropped).
 */
export function ModeToggle({ value, onChange, ariaLabel }: ModeToggleProps) {
  return (
    <div
      role="group"
      aria-label={ariaLabel}
      className="inline-flex overflow-hidden rounded-md border border-input"
    >
      {MODES.map(({ mode, label }) => (
        <button
          key={mode}
          type="button"
          aria-pressed={value === mode}
          onClick={() => onChange(mode)}
          className={cn(
            "px-2 py-1 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            value === mode
              ? "bg-accent text-accent-foreground"
              : "bg-transparent text-muted-foreground hover:bg-muted hover:text-foreground",
          )}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
