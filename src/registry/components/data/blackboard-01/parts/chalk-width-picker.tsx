"use client";

import { cn } from "@/lib/utils";
import type { NoteWidth } from "../types";

export interface ChalkWidthPickerProps {
  widths: NoteWidth[];
  value: NoteWidth;
  onChange: (width: NoteWidth) => void;
  label?: string;
  className?: string;
}

const STROKE_PX: Record<NoteWidth, number> = { thin: 1.5, regular: 3, bold: 5 };

/** Chalk-thickness picker — a glyph of increasing stroke per level. Pure + context-free. */
export function ChalkWidthPicker({
  widths,
  value,
  onChange,
  label = "Chalk width",
  className,
}: ChalkWidthPickerProps) {
  return (
    <div role="radiogroup" aria-label={label} className={cn("flex items-center gap-0.5", className)}>
      {widths.map((w) => {
        const selected = w === value;
        return (
          <button
            key={w}
            type="button"
            role="radio"
            aria-checked={selected}
            aria-label={w}
            title={w}
            onClick={() => onChange(w)}
            className={cn(
              "flex size-6 items-center justify-center rounded-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]",
              selected ? "bg-white/15" : "hover:bg-white/8",
            )}
          >
            <span
              aria-hidden
              className="block w-3.5 rounded-full bg-white/80"
              style={{ height: STROKE_PX[w] }}
            />
          </button>
        );
      })}
    </div>
  );
}
