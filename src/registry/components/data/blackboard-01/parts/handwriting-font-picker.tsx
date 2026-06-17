"use client";

import { cn } from "@/lib/utils";
import type { HandwritingFont } from "../types";

export interface HandwritingFontPickerProps {
  fonts: HandwritingFont[];
  value: string;
  onChange: (fontKey: string) => void;
  label?: string;
  className?: string;
}

/** Handwriting-font picker — each option previewed in its own face. Pure + context-free. */
export function HandwritingFontPicker({
  fonts,
  value,
  onChange,
  label = "Handwriting",
  className,
}: HandwritingFontPickerProps) {
  return (
    <div role="radiogroup" aria-label={label} className={cn("flex items-center gap-0.5", className)}>
      {fonts.map((font) => {
        const selected = font.key === value;
        return (
          <button
            key={font.key}
            type="button"
            role="radio"
            aria-checked={selected}
            aria-label={font.label}
            title={font.label}
            onClick={() => onChange(font.key)}
            style={{ fontFamily: `var(${font.cssVar})` }}
            className={cn(
              "flex h-6 min-w-6 items-center justify-center rounded-md px-1.5 text-lg leading-none text-white/85 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]",
              selected ? "bg-white/15 text-white" : "hover:bg-white/8",
            )}
          >
            {font.label.charAt(0)}
          </button>
        );
      })}
    </div>
  );
}
