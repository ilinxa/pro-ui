"use client";

import { Check, Palette } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { findSwatch, swatchCssColor } from "../lib/palette";
import type { KanbanPaletteSwatch } from "../types";

export function ColumnColorPicker({
  palette,
  current,
  onChange,
  disabled,
}: {
  palette: KanbanPaletteSwatch[];
  current: string | undefined;
  onChange: (id: string | undefined) => void;
  disabled?: boolean;
}) {
  const currentSwatch = findSwatch(palette, current);
  const currentColor = swatchCssColor(currentSwatch);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-6"
          disabled={disabled}
          aria-label="Pick column color"
          data-stop-click
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
        >
          {currentColor ? (
            <span
              className="size-3.5 rounded-full border border-border"
              style={{ backgroundColor: currentColor }}
              aria-hidden="true"
            />
          ) : (
            <Palette className="size-3.5 text-muted-foreground" aria-hidden="true" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-auto p-2"
        align="start"
        onPointerDown={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col gap-2">
          <div className="grid grid-cols-6 gap-1">
            {palette.map((s) => {
              const color = swatchCssColor(s);
              const active = current === s.id;
              return (
                <button
                  key={s.id}
                  type="button"
                  className={cn(
                    "relative flex size-6 items-center justify-center rounded-md border border-border transition",
                    "hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  )}
                  style={{ backgroundColor: color }}
                  aria-label={s.label}
                  aria-pressed={active}
                  onClick={() => onChange(s.id)}
                >
                  {active ? (
                    <Check className="size-3 text-background drop-shadow" aria-hidden="true" />
                  ) : null}
                </button>
              );
            })}
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 text-xs"
            onClick={() => onChange(undefined)}
          >
            Clear color
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
