"use client";

import { useEffect, useRef } from "react";
import { AlignCenter, AlignLeft, AlignRight, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import { ColorSwatchPicker } from "./color-swatch-picker";
import type {
  FontOption,
  StoryComposer01Labels,
  TextOverlay,
} from "../types";

export interface ToolTextInputProps {
  overlay: TextOverlay;
  fonts: FontOption[];
  colorPresets: string[];
  labels: Required<StoryComposer01Labels>;
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
  onChange,
  onDelete,
  className,
}: ToolTextInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

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
        "flex flex-col gap-3 rounded-2xl bg-black/70 backdrop-blur-md p-3 text-white",
        className,
      )}
    >
      <textarea
        ref={textareaRef}
        value={overlay.text}
        onChange={(e) => update({ text: e.target.value })}
        placeholder={labels.textPlaceholder}
        rows={2}
        className="w-full resize-none rounded-md bg-black/40 border border-white/15 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-white/40"
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
          className="flex-1 h-8 rounded-md bg-black/40 border border-white/15 px-2 text-xs"
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
        />

        {/* Align toggle */}
        <div className="inline-flex rounded-md bg-black/40 border border-white/15 p-0.5">
          {(["left", "center", "right"] as const).map((align) => (
            <button
              key={align}
              type="button"
              onClick={() => update({ align })}
              aria-label={`${labels.textAlign} ${align}`}
              aria-pressed={overlay.align === align}
              className={cn(
                "p-1 rounded-sm",
                overlay.align === align
                  ? "bg-white text-black"
                  : "text-white/80 hover:text-white",
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
          size="icon-sm"
          onClick={onDelete}
          aria-label="Delete text"
          className="text-red-300 hover:bg-red-500/15 hover:text-red-200"
        >
          <Trash2 className="size-4" />
        </Button>
      </div>

      {/* Font size slider */}
      <div className="flex items-center gap-3">
        <span className="text-[10px] uppercase tracking-wider text-white/60 w-10">
          {labels.textFontSize}
        </span>
        <Slider
          value={[overlay.fontSize]}
          min={MIN_FONT_SIZE}
          max={MAX_FONT_SIZE}
          step={1}
          onValueChange={(arr) => update({ fontSize: arr[0] ?? overlay.fontSize })}
          aria-label={labels.textFontSize}
          className="flex-1"
        />
        <span className="text-xs font-mono tabular-nums w-8 text-right">
          {overlay.fontSize}
        </span>
      </div>
    </div>
  );
}
