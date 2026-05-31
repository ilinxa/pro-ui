"use client";

import { useCallback } from "react";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import type { ImageAdjustments, StoryComposer01Labels } from "../types";

export interface ToolAdjustSlidersProps {
  value: ImageAdjustments;
  onChange: (next: ImageAdjustments) => void;
  labels: Required<StoryComposer01Labels>;
  className?: string;
}

interface SliderConfig {
  key: keyof ImageAdjustments;
  label: string;
  min: number;
  max: number;
  step: number;
}

export function ToolAdjustSliders({
  value,
  onChange,
  labels,
  className,
}: ToolAdjustSlidersProps) {
  const configs: SliderConfig[] = [
    {
      key: "brightness",
      label: labels.adjustBrightness,
      min: -1,
      max: 1,
      step: 0.05,
    },
    {
      key: "contrast",
      label: labels.adjustContrast,
      min: -100,
      max: 100,
      step: 5,
    },
    {
      key: "saturation",
      label: labels.adjustSaturation,
      min: -2,
      max: 5,
      step: 0.1,
    },
    {
      key: "blur",
      label: labels.adjustBlur,
      min: 0,
      max: 40,
      step: 1,
    },
  ];

  const update = useCallback(
    (key: keyof ImageAdjustments, next: number) => {
      onChange({ ...value, [key]: next });
    },
    [onChange, value],
  );

  return (
    <div
      className={cn(
        "flex flex-col gap-4 p-4 rounded-2xl bg-black/70 backdrop-blur-md text-white",
        className,
      )}
    >
      {configs.map((cfg) => (
        <div key={cfg.key} className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium">{cfg.label}</span>
            <span className="font-mono tabular-nums text-white/60">
              {formatValue(value[cfg.key], cfg.key)}
            </span>
          </div>
          <Slider
            value={[value[cfg.key]]}
            min={cfg.min}
            max={cfg.max}
            step={cfg.step}
            onValueChange={(arr) => update(cfg.key, arr[0] ?? 0)}
            aria-label={cfg.label}
          />
        </div>
      ))}
    </div>
  );
}

function formatValue(v: number, key: keyof ImageAdjustments): string {
  if (key === "contrast" || key === "blur") return String(Math.round(v));
  return v.toFixed(2);
}
