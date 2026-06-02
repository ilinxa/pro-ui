"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import type { FilterPreset } from "../types";

export interface ToolFilterStripProps {
  presets: FilterPreset[];
  /** Image URL the thumbnails sample (the captured photo). */
  sourceUrl: string;
  /** Currently-active preset id. null = "original" / no filter. */
  activeId: string | null;
  onSelect: (id: string | null) => void;
  className?: string;
}

interface ThumbnailEntry {
  preset: FilterPreset;
  url: string;
}

const THUMB_SIZE = 56;

/**
 * Horizontal scrollable strip of filter presets, each rendered as a
 * pre-rendered thumbnail of the captured photo with that filter applied.
 *
 * Q-P7a — thumbnails are computed once on edit-mode entry (~1s for ~10
 * filters on a typical 1080p photo). Subsequent taps are instant.
 *
 * For C7 we use CSS-filter approximations (cheap, no Konva), which gives
 * the user a near-WYSIWYG preview. The actual on-stage application
 * (which uses Konva.Filters) is wired in composer-editor.tsx and matches
 * the CSS recipe closely enough for browse-then-confirm UX.
 */
export function ToolFilterStrip({
  presets,
  sourceUrl,
  activeId,
  onSelect,
  className,
}: ToolFilterStripProps) {
  const [thumbs, setThumbs] = useState<ThumbnailEntry[]>([]);
  const cancelledRef = useRef(false);

  useEffect(() => {
    cancelledRef.current = false;
    if (!sourceUrl || presets.length === 0) {
      setThumbs([]);
      return;
    }

    const img = new window.Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      if (cancelledRef.current) return;
      const canvas = document.createElement("canvas");
      canvas.width = THUMB_SIZE;
      canvas.height = THUMB_SIZE;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const drawCovered = () => {
        const ratio = Math.max(
          THUMB_SIZE / img.naturalWidth,
          THUMB_SIZE / img.naturalHeight,
        );
        const w = img.naturalWidth * ratio;
        const h = img.naturalHeight * ratio;
        const x = (THUMB_SIZE - w) / 2;
        const y = (THUMB_SIZE - h) / 2;
        ctx.clearRect(0, 0, THUMB_SIZE, THUMB_SIZE);
        ctx.drawImage(img, x, y, w, h);
      };

      const out: ThumbnailEntry[] = [];
      for (const preset of presets) {
        ctx.filter = cssFilterForPreset(preset);
        drawCovered();
        out.push({ preset, url: canvas.toDataURL("image/jpeg", 0.7) });
      }
      ctx.filter = "none";
      if (!cancelledRef.current) setThumbs(out);
    };
    img.src = sourceUrl;

    return () => {
      cancelledRef.current = true;
    };
  }, [sourceUrl, presets]);

  return (
    <div
      className={cn(
        "flex items-center gap-2 overflow-x-auto overscroll-x-contain",
        "rounded-2xl bg-black/70 backdrop-blur-md p-2 text-white",
        "scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent",
        className,
      )}
    >
      {(thumbs.length > 0
        ? thumbs
        : presets.map((p) => ({ preset: p, url: "" }))
      ).map(({ preset, url }) => {
        const isActive = activeId === preset.id || (!activeId && preset.id === "original");
        return (
          <button
            key={preset.id}
            type="button"
            onClick={() =>
              onSelect(preset.id === "original" ? null : preset.id)
            }
            className={cn(
              "flex-none flex flex-col items-center gap-1 outline-none",
              "focus-visible:ring-2 focus-visible:ring-white rounded-lg",
            )}
            aria-pressed={isActive}
            aria-label={preset.label}
          >
            <div
              className={cn(
                "size-14 rounded-lg overflow-hidden bg-black/60 ring-2 transition-shadow",
                isActive ? "ring-white" : "ring-transparent",
              )}
            >
              {url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={url}
                  alt=""
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-white/5 animate-pulse" />
              )}
            </div>
            <span className="text-[10px] font-medium uppercase tracking-wider">
              {preset.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}

/**
 * Approximate each Konva filter chain with a CSS `filter:` string for the
 * preview thumbnail. CSS doesn't have a 1:1 mapping, but this approximation
 * is good enough for browse-and-pick UX.
 */
function cssFilterForPreset(preset: FilterPreset): string {
  if (preset.konvaFilters.length === 0) return "none";
  const parts: string[] = [];
  let saturate = 1;
  let brightness = 1;
  let contrast = 1;
  let sepia = 0;
  let hue = 0;
  let grayscale = 0;
  let blur = 0;
  for (const f of preset.konvaFilters) {
    switch (f.name) {
      case "Brighten":
        brightness *= 1 + (f.params?.brightness ?? 0);
        break;
      case "Contrast":
        contrast *= 1 + (f.params?.contrast ?? 0) / 100;
        break;
      case "HSL":
        saturate *= 1 + (f.params?.saturation ?? 0);
        hue += f.params?.hue ?? 0;
        break;
      case "Sepia":
        sepia = Math.min(1, sepia + 0.25);
        break;
      case "Grayscale":
        grayscale = 1;
        break;
      case "Blur":
        blur += f.params?.blurRadius ?? 0;
        break;
    }
  }
  parts.push(`brightness(${brightness.toFixed(2)})`);
  parts.push(`contrast(${contrast.toFixed(2)})`);
  parts.push(`saturate(${Math.max(0, saturate).toFixed(2)})`);
  if (hue !== 0) parts.push(`hue-rotate(${hue}deg)`);
  if (sepia > 0) parts.push(`sepia(${sepia.toFixed(2)})`);
  if (grayscale > 0) parts.push(`grayscale(${grayscale})`);
  if (blur > 0) parts.push(`blur(${blur}px)`);
  return parts.join(" ");
}
