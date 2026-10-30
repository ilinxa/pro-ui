"use client";

import { useEffect, useRef } from "react";
import { AlignCenter, AlignLeft, AlignRight, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import { ColorSwatchPicker } from "./color-swatch-picker";
import { useSliderThumbLabel } from "../hooks/use-slider-thumb-label";
import { formatNumber } from "../lib/format-number";
import type {
  FontOption,
  MediaEditorResolvedLabels,
  TextOverlay,
} from "../types";

export interface ToolTextInputProps {
  overlay: TextOverlay;
  fonts: FontOption[];
  colorPresets: string[];
  labels: MediaEditorResolvedLabels;
  /** BCP 47 locale for the font size shown. Default: `"en"`. */
  locale?: string;
  onChange: (next: TextOverlay) => void;
  onDelete: () => void;
  className?: string;
}

const MIN_FONT_SIZE = 16;
const MAX_FONT_SIZE = 96;

/**
 * Active-text-overlay editor — text input, font, size, color, align.
 * Mounts when there's a selected text overlay.
 */
export function ToolTextInput({
  overlay,
  fonts,
  colorPresets,
  labels,
  locale,
  onChange,
  onDelete,
  className,
}: ToolTextInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const sizeRef = useSliderThumbLabel(labels.textFontSize);

  // Autofocus when a new overlay is selected.
  useEffect(() => {
    textareaRef.current?.focus();
    textareaRef.current?.select();
  }, [overlay.id]);

  const update = (patch: Partial<TextOverlay>) =>
    onChange({ ...overlay, ...patch });

  return (
    <div
      className={cn(
        "flex flex-col gap-3 rounded-2xl bg-media-overlay backdrop-brightness-75 backdrop-blur-md p-3 text-media-overlay-foreground",
        className,
      )}
    >
      <textarea
        ref={textareaRef}
        value={overlay.text}
        onChange={(e) => update({ text: e.target.value })}
        placeholder={labels.textPlaceholder}
        rows={2}
        className="w-full resize-none rounded-md bg-media-overlay border border-media-overlay-foreground/15 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-media-overlay-foreground/40"
        style={{ fontFamily: overlay.fontFamily }}
      />

      {/* Font + color + delete */}
      <div className="flex items-center gap-2">
        <label className="sr-only" htmlFor="text-font">
          {labels.textFontFamily}
        </label>
        <select
          id="text-font"
          value={overlay.fontFamily}
          onChange={(e) => update({ fontFamily: e.target.value })}
          className="min-w-0 flex-1 h-8 rounded-md bg-media-overlay border border-media-overlay-foreground/15 px-2 text-xs"
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
          value={overlay.fill}
          presets={colorPresets}
          onChange={(color) => update({ fill: color })}
          ariaLabel={labels.drawColor}
          labels={labels}
        />

        {/* Align toggle */}
        <div className="inline-flex shrink-0 rounded-md bg-media-overlay border border-media-overlay-foreground/15 p-0.5">
          {(["left", "center", "right"] as const).map((align) => (
            <button
              key={align}
              type="button"
              onClick={() => update({ align })}
              aria-label={
                align === "left"
                  ? labels.textAlignLeft
                  : align === "center"
                    ? labels.textAlignCenter
                    : labels.textAlignRight
              }
              aria-pressed={overlay.align === align}
              className={cn(
                "inline-grid min-h-6 min-w-6 place-items-center rounded-sm",
                overlay.align === align
                  ? "bg-media-overlay-foreground text-black"
                  : "text-media-overlay-foreground/80 hover:text-media-overlay-foreground",
              )}
            >
              {align === "left" ? (
                <AlignLeft className="size-3.5" />
              ) : align === "center" ? (
                <AlignCenter className="size-3.5" />
              ) : (
                <AlignRight className="size-3.5" />
              )}
            </button>
          ))}
        </div>

        <Button
          variant="ghost"
          size="icon"
          onClick={onDelete}
          aria-label={labels.textDelete}
          className="size-8 shrink-0 text-[color-mix(in_oklab,var(--destructive)_45%,var(--media-overlay-foreground,currentColor))] hover:bg-destructive/15 hover:text-[color-mix(in_oklab,var(--destructive)_25%,var(--media-overlay-foreground,currentColor))]"
        >
          <Trash2 className="size-4" />
        </Button>
      </div>

      {/* Font size slider */}
      <div className="flex items-center gap-3">
        <span className="text-[10px] uppercase tracking-wider text-media-overlay-foreground/75 w-10">
          {labels.textFontSize}
        </span>
        <Slider
          ref={sizeRef}
          value={[overlay.fontSize]}
          min={MIN_FONT_SIZE}
          max={MAX_FONT_SIZE}
          step={1}
          // Radix emits number[]; Base UI number | readonly number[] (F-cross-13)
          onValueChange={(v) =>
            update({ fontSize: typeof v === "number" ? v : (v[0] ?? overlay.fontSize) })
          }
          aria-label={labels.textFontSize}
          className="flex-1"
        />
        <span className="text-xs font-mono tabular-nums w-8 text-end">
          {formatNumber(overlay.fontSize, locale)}
        </span>
      </div>
    </div>
  );
}
