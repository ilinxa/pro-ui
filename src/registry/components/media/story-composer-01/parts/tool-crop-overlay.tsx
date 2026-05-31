"use client";

import { cn } from "@/lib/utils";
import type { AspectRatio, StoryComposer01Labels } from "../types";

export interface ToolCropOverlayProps {
  activeAspect: AspectRatio;
  availableAspects: AspectRatio[];
  labels: Required<StoryComposer01Labels>;
  onAspectChange: (aspect: AspectRatio) => void;
  className?: string;
}

const ASPECT_LABEL: Record<AspectRatio, string> = {
  "9:16": "9:16",
  "1:1": "1:1",
  "4:5": "4:5",
  free: "Free",
};

export function ToolCropOverlay({
  activeAspect,
  availableAspects,
  labels,
  onAspectChange,
  className,
}: ToolCropOverlayProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-center gap-2 rounded-2xl bg-black/70 backdrop-blur-md p-2 text-white",
        className,
      )}
    >
      <span className="text-[10px] uppercase tracking-wider text-white/60 px-2">
        {labels.toolCrop}
      </span>
      {availableAspects.map((aspect) => {
        const isActive = activeAspect === aspect;
        return (
          <button
            key={aspect}
            type="button"
            onClick={() => onAspectChange(aspect)}
            aria-pressed={isActive}
            className={cn(
              "rounded-full px-3 py-1 text-xs font-medium tracking-wide transition-colors",
              isActive
                ? "bg-white text-black"
                : "text-white/70 hover:bg-white/10 hover:text-white",
            )}
          >
            {ASPECT_LABEL[aspect]}
          </button>
        );
      })}
    </div>
  );
}

// ─── Geometry helpers (consumed by composer-editor) ───────────────────

export interface CropRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export const ASPECT_RATIO_VALUES: Record<AspectRatio, number | null> = {
  "9:16": 9 / 16,
  "1:1": 1,
  "4:5": 4 / 5,
  free: null,
};

/**
 * Centered, max-fitting rect for the given aspect ratio inside the stage.
 * Returns the full stage rect for "free" (no constraint).
 */
export function fitCropToStage(
  aspect: AspectRatio,
  stageWidth: number,
  stageHeight: number,
): CropRect {
  const ratio = ASPECT_RATIO_VALUES[aspect];
  if (ratio === null) {
    return { x: 0, y: 0, width: stageWidth, height: stageHeight };
  }
  // Find largest rect with the given aspect that fits inside stage.
  let width = stageWidth;
  let height = stageWidth / ratio;
  if (height > stageHeight) {
    height = stageHeight;
    width = stageHeight * ratio;
  }
  return {
    x: (stageWidth - width) / 2,
    y: (stageHeight - height) / 2,
    width,
    height,
  };
}
