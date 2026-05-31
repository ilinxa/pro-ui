"use client";

import { forwardRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ColorSwatchPicker } from "./color-swatch-picker";
import type { GradientPreset } from "../lib/defaults";
import type { FontOption, StoryComposer01Labels } from "../types";

export interface TextOnlyCanvasProps {
  gradients: GradientPreset[];
  fonts: FontOption[];
  colorPresets: string[];
  labels: Required<StoryComposer01Labels>;
  className?: string;
}

export interface TextOnlyCanvasState {
  text: string;
  fontFamily: string;
  textColor: string;
  gradientId: string;
}

/**
 * Text-only mode capture surface.
 *
 * Rendered as a styled DOM element (NOT Konva) so `exportTextOnlyBlob()`
 * can rasterise it via the SVG-foreignObject technique on publish. The
 * forwardRef exposes the canvas <div> element so the publish path can
 * pass it to the exporter.
 */
export const TextOnlyCanvas = forwardRef<
  HTMLDivElement,
  TextOnlyCanvasProps & {
    value: TextOnlyCanvasState;
    onChange: (next: TextOnlyCanvasState) => void;
  }
>(function TextOnlyCanvas(
  { gradients, fonts, colorPresets, labels, value, onChange, className },
  ref,
) {
  const [pickerOpen, setPickerOpen] = useState<"gradient" | "font" | null>(
    null,
  );

  const activeGradient =
    gradients.find((g) => g.id === value.gradientId) ?? gradients[0];

  const update = (patch: Partial<TextOnlyCanvasState>) =>
    onChange({ ...value, ...patch });

  return (
    <div
      className={cn("relative flex-1 flex flex-col overflow-hidden", className)}
    >
      {/* Render surface — exported as PNG on publish */}
      <div
        ref={ref}
        className="absolute inset-0 grid place-items-center px-8"
        style={{ background: activeGradient?.background ?? "#000" }}
      >
        <textarea
          value={value.text}
          onChange={(e) => update({ text: e.target.value })}
          placeholder={labels.textPlaceholder}
          rows={3}
          aria-label={labels.textPlaceholder}
          className="w-full max-w-[20rem] resize-none bg-transparent text-center placeholder:text-current/40 focus:outline-none"
          style={{
            color: value.textColor,
            fontFamily: value.fontFamily,
            fontSize: "clamp(1.5rem, 7vw, 3rem)",
            lineHeight: 1.2,
            fontWeight: 600,
            textShadow: "0 2px 8px rgba(0,0,0,0.25)",
          }}
        />
      </div>

      {/* Bottom control bar — gradient picker + font + color */}
      <div
        className="absolute left-0 right-0 z-20 flex flex-col gap-2 px-3"
        style={{
          bottom: "max(1.25rem, env(safe-area-inset-bottom))",
        }}
      >
        {pickerOpen === "gradient" ? (
          <div className="flex items-center gap-2 overflow-x-auto rounded-2xl bg-black/70 backdrop-blur-md p-2">
            {gradients.map((g) => {
              const isActive = g.id === value.gradientId;
              return (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => update({ gradientId: g.id })}
                  aria-label={g.label}
                  aria-pressed={isActive}
                  className={cn(
                    "flex-none size-10 rounded-full ring-2 transition-shadow",
                    isActive ? "ring-white" : "ring-transparent",
                  )}
                  style={{ background: g.background }}
                />
              );
            })}
          </div>
        ) : null}

        <div className="flex items-center justify-between gap-2 rounded-2xl bg-black/70 backdrop-blur-md p-2 text-white">
          <Button
            variant="ghost"
            size="sm"
            onClick={() =>
              setPickerOpen((p) => (p === "gradient" ? null : "gradient"))
            }
            aria-pressed={pickerOpen === "gradient"}
            className="text-xs gap-2 text-white hover:bg-white/10 hover:text-white"
          >
            <span
              className="inline-block size-4 rounded-full ring-2 ring-white/40"
              style={{ background: activeGradient?.background ?? "#000" }}
              aria-hidden
            />
            <span>Background</span>
          </Button>

          <div className="flex items-center gap-2">
            <select
              value={value.fontFamily}
              onChange={(e) => update({ fontFamily: e.target.value })}
              aria-label={labels.textFontFamily}
              className="h-7 rounded-md bg-black/40 border border-white/15 px-2 text-xs"
            >
              {fonts.map((font) => (
                <option
                  key={font.id}
                  value={font.family}
                  style={{ fontFamily: font.family }}
                >
                  {font.label}
                </option>
              ))}
            </select>
            <ColorSwatchPicker
              value={value.textColor}
              presets={colorPresets}
              onChange={(c) => update({ textColor: c })}
              ariaLabel={labels.drawColor}
            />
          </div>
        </div>
      </div>
    </div>
  );
});
