"use client";

import { Eraser, Pen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import { ColorSwatchPicker } from "./color-swatch-picker";
import type { StoryComposer01Labels } from "../types";

export interface ToolDrawControlsProps {
  color: string;
  brushSize: number;
  mode: "draw" | "erase";
  colorPresets: string[];
  labels: Required<StoryComposer01Labels>;
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
  onColorChange,
  onBrushSizeChange,
  onModeChange,
  className,
}: ToolDrawControlsProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 rounded-2xl bg-black/70 backdrop-blur-md p-3 text-white",
        className,
      )}
    >
      {/* Top row: mode toggle + color */}
      <div className="flex items-center justify-between gap-3">
        <div className="inline-flex rounded-md bg-black/40 border border-white/15 p-0.5">
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
                ? "bg-white text-black hover:bg-white hover:text-black"
                : "text-white/80 hover:bg-white/10 hover:text-white",
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
                ? "bg-white text-black hover:bg-white hover:text-black"
                : "text-white/80 hover:bg-white/10 hover:text-white",
            )}
          >
            <Eraser className="size-3.5" />
            <span>{labels.drawEraser}</span>
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[10px] uppercase tracking-wider text-white/60">
            {labels.drawColor}
          </span>
          <ColorSwatchPicker
            value={color}
            presets={colorPresets}
            onChange={onColorChange}
            ariaLabel={labels.drawColor}
          />
        </div>
      </div>

      {/* Brush size */}
      <div className="flex items-center gap-3">
        <span className="text-[10px] uppercase tracking-wider text-white/60 w-12">
          {labels.drawBrush}
        </span>
        <Slider
          value={[brushSize]}
          min={MIN_BRUSH}
          max={MAX_BRUSH}
          step={1}
          onValueChange={(arr) => onBrushSizeChange(arr[0] ?? brushSize)}
          aria-label={labels.drawBrush}
          className="flex-1"
        />
        <span className="text-xs font-mono tabular-nums w-7 text-right">
          {brushSize}
        </span>
      </div>
    </div>
  );
}
