"use client";

import { cn } from "@/lib/utils";
import type { CarouselAspectRatio } from "../types";

export interface AspectSwitchProps {
  options: readonly CarouselAspectRatio[];
  /** The option shown as pressed. */
  active: CarouselAspectRatio | null;
  groupLabel: string;
  optionLabel: (aspect: CarouselAspectRatio) => string;
  onPick: (aspect: CarouselAspectRatio) => void;
}

/** Toggle buttons that pick the shared aspect. Pressed state is `aria-pressed`. */
export function AspectSwitch({ options, active, groupLabel, optionLabel, onPick }: AspectSwitchProps) {
  return (
    <div
      role="group"
      aria-label={groupLabel}
      data-aspect-switch=""
      className="flex max-w-[calc(100%-7rem)] flex-wrap gap-1 rounded-md border border-border bg-background/90 p-1 shadow-sm"
    >
      {options.map((option) => {
        const pressed = option === active;
        return (
          <button
            key={option}
            type="button"
            aria-pressed={pressed}
            onClick={() => onPick(option)}
            className={cn(
              "inline-flex min-h-8 min-w-8 items-center justify-center rounded px-2 text-xs font-medium tabular-nums outline-none transition focus-visible:ring-2 focus-visible:ring-ring",
              pressed
                ? "bg-primary text-primary-foreground"
                : "text-foreground hover:bg-muted",
            )}
          >
            {optionLabel(option)}
          </button>
        );
      })}
    </div>
  );
}
