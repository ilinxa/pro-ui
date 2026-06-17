"use client";

import { cn } from "@/lib/utils";
import type { InkColor } from "../types";

export interface InkColorPickerProps {
  palette: InkColor[];
  value: string;
  onChange: (colorKey: string) => void;
  /** Append a native color input for free-hex picking. */
  allowFreeColor?: boolean;
  label?: string;
  className?: string;
}

/** Curated chalk-ink swatch row. Pure + context-free (`value`/`onChange`). */
export function InkColorPicker({
  palette,
  value,
  onChange,
  allowFreeColor = false,
  label = "Ink color",
  className,
}: InkColorPickerProps) {
  return (
    <div role="radiogroup" aria-label={label} className={cn("flex items-center gap-1", className)}>
      {palette.map((ink) => {
        const selected = ink.key === value;
        return (
          <button
            key={ink.key}
            type="button"
            role="radio"
            aria-checked={selected}
            aria-label={ink.label}
            title={ink.label}
            onClick={() => onChange(ink.key)}
            className={cn(
              "size-5 rounded-full ring-offset-1 ring-offset-transparent transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]",
              selected ? "scale-110 ring-2 ring-white/70" : "ring-1 ring-white/15 hover:scale-105",
            )}
            style={{ backgroundColor: ink.value }}
          />
        );
      })}
      {allowFreeColor ? (
        <label
          className="ml-0.5 inline-flex size-5 cursor-pointer items-center justify-center rounded-full ring-1 ring-white/15"
          title="Custom color"
          style={{
            background:
              "conic-gradient(from 0deg, oklch(0.8 0.2 30), oklch(0.8 0.2 130), oklch(0.8 0.2 230), oklch(0.8 0.2 330), oklch(0.8 0.2 30))",
          }}
        >
          <input
            type="color"
            aria-label="Custom ink color"
            className="size-0 opacity-0"
            onChange={(e) => onChange(e.target.value)}
          />
        </label>
      ) : null}
    </div>
  );
}
