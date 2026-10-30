"use client";

import { useCallback, type ComponentProps } from "react";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import { useSliderThumbLabel } from "../hooks/use-slider-thumb-label";
import { formatNumber } from "../lib/format-number";
import type { ImageAdjustments, MediaEditorResolvedLabels } from "../types";

export interface ToolAdjustSlidersProps {
  value: ImageAdjustments;
  onChange: (next: ImageAdjustments) => void;
  labels: MediaEditorResolvedLabels;
  /** BCP 47 locale for the values shown. Default: `"en"`. */
  locale?: string;
  className?: string;
}

interface SliderConfig {
  key: keyof ImageAdjustments;
  label: string;
  min: number;
  max: number;
  step: number;
}

/** Slider whose thumb (the focusable role="slider") carries the name. */
function NamedSlider({
  label,
  ...props
}: { label: string } & Omit<ComponentProps<typeof Slider>, "aria-label" | "ref">) {
  const ref = useSliderThumbLabel(label);
  return <Slider ref={ref} aria-label={label} {...props} />;
}

export function ToolAdjustSliders({
  value,
  onChange,
  labels,
  locale,
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
        "flex flex-col gap-4 p-4 rounded-2xl bg-media-overlay backdrop-brightness-75 backdrop-blur-md text-media-overlay-foreground",
        className,
      )}
    >
      {configs.map((cfg) => (
        <div key={cfg.key} className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium">{cfg.label}</span>
            <span className="font-mono tabular-nums text-media-overlay-foreground/75">
              {formatValue(value[cfg.key], cfg.key, locale)}
            </span>
          </div>
          <NamedSlider
            label={cfg.label}
            value={[value[cfg.key]]}
            min={cfg.min}
            max={cfg.max}
            step={cfg.step}
            // Radix emits number[]; Base UI number | readonly number[] (F-cross-13)
            onValueChange={(v) => update(cfg.key, typeof v === "number" ? v : (v[0] ?? 0))}
          />
        </div>
      ))}
    </div>
  );
}

function formatValue(
  v: number,
  key: keyof ImageAdjustments,
  locale: string | undefined,
): string {
  if (key === "contrast" || key === "blur") return formatNumber(Math.round(v), locale);
  return formatNumber(v, locale, { min: 2 });
}
