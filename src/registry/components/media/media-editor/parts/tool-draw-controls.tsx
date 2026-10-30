"use client";

import { Eraser, Pen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import { ColorSwatchPicker } from "./color-swatch-picker";
import { useSliderThumbLabel } from "../hooks/use-slider-thumb-label";
import { formatNumber } from "../lib/format-number";
import type { MediaEditorResolvedLabels } from "../types";

export interface ToolDrawControlsProps {
  color: string;
  brushSize: number;
  mode: "draw" | "erase";
  colorPresets: string[];
  labels: MediaEditorResolvedLabels;
  /** BCP 47 locale for the brush size shown. Default: `"en"`. */
  locale?: string;
  onColorChange: (color: string) => void;
  onBrushSizeChange: (size: number) => void;
  onModeChange: (mode: "draw" | "erase") => void;
  className?: string;
}

const MIN_BRUSH = 1;
const MAX_BRUSH = 60;

export function ToolDrawControls({
  color,
  brushSize,
  mode,
  colorPresets,
  labels,
  locale,
  onColorChange,
  onBrushSizeChange,
  onModeChange,
  className,
}: ToolDrawControlsProps) {
  const sizeRef = useSliderThumbLabel(labels.drawBrush);
  return (
    <div
      className={cn(
        "flex flex-col gap-3 rounded-2xl bg-media-overlay backdrop-brightness-75 backdrop-blur-md p-3 text-media-overlay-foreground",
        className,
      )}
    >
      {/* Top row: mode toggle + color */}
      <div className="flex items-center justify-between gap-3">
        <div className="inline-flex shrink-0 rounded-md bg-media-overlay border border-media-overlay-foreground/15 p-0.5">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onModeChange("draw")}
            aria-pressed={mode === "draw"}
            aria-label={labels.toolDraw}
            className={cn(
              "h-7 px-2 rounded-sm gap-1.5 text-xs",
              mode === "draw"
                ? "bg-media-overlay-foreground text-black hover:bg-media-overlay-foreground/90 hover:text-black"
                : "text-media-overlay-foreground/80 hover:bg-media-overlay-foreground/10 hover:text-media-overlay-foreground",
            )}
          >
            <Pen className="size-3.5" />
            <span>{labels.toolDraw}</span>
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onModeChange("erase")}
            aria-pressed={mode === "erase"}
            aria-label={labels.drawEraser}
            className={cn(
              "h-7 px-2 rounded-sm gap-1.5 text-xs",
              mode === "erase"
                ? "bg-media-overlay-foreground text-black hover:bg-media-overlay-foreground/90 hover:text-black"
                : "text-media-overlay-foreground/80 hover:bg-media-overlay-foreground/10 hover:text-media-overlay-foreground",
            )}
          >
            <Eraser className="size-3.5" />
            <span>{labels.drawEraser}</span>
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[10px] uppercase tracking-wider text-media-overlay-foreground/75">
            {labels.drawColor}
          </span>
          <ColorSwatchPicker
            value={color}
            presets={colorPresets}
            onChange={onColorChange}
            ariaLabel={labels.drawColor}
            labels={labels}
          />
        </div>
      </div>

      {/* Brush size */}
      <div className="flex items-center gap-3">
        <span className="text-[10px] uppercase tracking-wider text-media-overlay-foreground/75 w-12">
          {labels.drawBrush}
        </span>
        <Slider
          ref={sizeRef}
          value={[brushSize]}
          min={MIN_BRUSH}
          max={MAX_BRUSH}
          step={1}
          // Radix emits number[]; Base UI number | readonly number[] (F-cross-13)
          onValueChange={(v) =>
            onBrushSizeChange(typeof v === "number" ? v : (v[0] ?? brushSize))
          }
          aria-label={labels.drawBrush}
          className="flex-1"
        />
        <span className="text-xs font-mono tabular-nums w-7 text-end">
          {formatNumber(brushSize, locale)}
        </span>
      </div>
    </div>
  );
}
