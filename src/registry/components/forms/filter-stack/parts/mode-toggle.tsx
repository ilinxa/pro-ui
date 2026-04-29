"use client";

import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import type { FilterMode } from "../types";

interface ModeToggleProps {
  value: FilterMode;
  onChange: (mode: FilterMode) => void;
  ariaLabel: string;
}

export function ModeToggle({ value, onChange, ariaLabel }: ModeToggleProps) {
  return (
    <ToggleGroup
      type="single"
      size="sm"
      value={value}
      onValueChange={(next) => {
        if (next === "union" || next === "intersection") onChange(next);
      }}
      aria-label={ariaLabel}
      variant="outline"
      className="text-xs"
    >
      <ToggleGroupItem value="union" className="px-2 text-xs">
        Union
      </ToggleGroupItem>
      <ToggleGroupItem value="intersection" className="px-2 text-xs">
        Intersection
      </ToggleGroupItem>
    </ToggleGroup>
  );
}
