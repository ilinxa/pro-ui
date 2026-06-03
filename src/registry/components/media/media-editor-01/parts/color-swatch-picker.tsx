"use client";

import { useState } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export interface ColorSwatchPickerProps {
  value: string;
  presets: string[];
  onChange: (color: string) => void;
  ariaLabel: string;
  triggerClassName?: string;
}

/**
 * Popover color picker — preset swatch grid + free-form hex input.
 *
 * The trigger renders a 28px circle showing the current color.
 * No native <input type="color"> (intentionally — it breaks design-system
 * consistency across OS pickers).
 *
 * F-cross-13 defense: PopoverTrigger renders as its own button without
 * `asChild` — Base UI's PopoverTrigger doesn't accept Slot mergeProps,
 * and the namespaced `radix-ui` package isn't portable across consumers
 * (some have only @radix-ui/react-popover individually). Composing
 * directly through PopoverTrigger works against either shape.
 */
export function ColorSwatchPicker({
  value,
  presets,
  onChange,
  ariaLabel,
  triggerClassName,
}: ColorSwatchPickerProps) {
  const [hexDraft, setHexDraft] = useState(value);
  const [open, setOpen] = useState(false);

  const commitHex = (raw: string) => {
    const trimmed = raw.trim();
    if (/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(trimmed)) {
      onChange(trimmed);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        aria-label={ariaLabel}
        className={cn(
          "inline-grid place-items-center size-7 rounded-full ring-2 ring-white/40 hover:ring-white transition-shadow",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white",
          triggerClassName,
        )}
        style={{ background: value }}
      >
        <span className="sr-only">{ariaLabel}</span>
      </PopoverTrigger>
      <PopoverContent
        sideOffset={8}
        className="w-56 p-3 bg-popover text-popover-foreground"
      >
        <div className="grid grid-cols-6 gap-2">
          {presets.map((color) => {
            const isActive = color.toLowerCase() === value.toLowerCase();
            return (
              <button
                key={color}
                type="button"
                onClick={() => {
                  onChange(color);
                  setHexDraft(color);
                }}
                aria-label={`Color ${color}`}
                aria-pressed={isActive}
                className={cn(
                  "size-7 rounded-full ring-2 ring-offset-1 ring-offset-popover",
                  isActive ? "ring-foreground" : "ring-transparent",
                )}
                style={{ background: color }}
              />
            );
          })}
        </div>
        <div className="mt-3 flex items-center gap-2">
          <label className="text-xs text-muted-foreground" htmlFor="color-hex">
            Hex
          </label>
          <input
            id="color-hex"
            type="text"
            value={hexDraft}
            onChange={(e) => setHexDraft(e.target.value)}
            onBlur={(e) => commitHex(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                commitHex((e.target as HTMLInputElement).value);
                setOpen(false);
              }
            }}
            placeholder="#ffffff"
            className="flex-1 min-w-0 h-7 rounded-md border border-input bg-background px-2 text-xs font-mono"
          />
        </div>
      </PopoverContent>
    </Popover>
  );
}
