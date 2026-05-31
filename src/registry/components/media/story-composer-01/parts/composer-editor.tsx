"use client";

import { useEffect, useRef, useState } from "react";
import Konva from "konva";
import type { Filter as KonvaFilter } from "konva/lib/Node";
import { Stage, Layer, Image as KonvaImage, Transformer } from "react-konva";
import { cn } from "@/lib/utils";
import {
  useKonvaStageSize,
  type StageSize,
} from "../hooks/use-konva-stage-size";
import { useKonvaSelection } from "../hooks/use-konva-selection";
import type { FilterPreset, ImageAdjustments } from "../types";

export interface ComposerEditorProps {
  /** Image draft preview URL. For video drafts, the editor renders a <video> overlay instead (C7+). */
  imageUrl: string | null;
  /** Video draft preview URL (overlay edits land C7+; for now displays as background). */
  videoUrl?: string | null;
  /** Canvas surface background — usually composer's editorBackground. */
  background?: string;
  /** Brightness/contrast/saturation/blur sliders (C7). */
  adjustments?: ImageAdjustments;
  /** Active filter preset (C7). null = no preset. */
  activeFilter?: FilterPreset | null;
  className?: string;
}

/**
 * Multi-layer Konva canvas with:
 *   <Layer id="image">     — captured media as Konva.Image (filters land C7)
 *   <Layer id="drawing">   — freehand strokes (C10)
 *   <Layer id="stickers">  — sticker instances (C9)
 *   <Layer id="text">      — text overlays (C8)
 *   <Layer id="ui">        — Konva.Transformer (selection handles)
 *
 * C6: only the image layer renders. Other layers are wired empty so
 * subsequent commits land their items into the right z-order without
 * a substrate refactor.
 */
export function ComposerEditor({
  imageUrl,
  videoUrl,
  background = "#000",
  adjustments,
  activeFilter,
  className,
}: ComposerEditorProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const stageSize = useKonvaStageSize(containerRef);
  const selection = useKonvaSelection();
  const imageNodeRef = useRef<Konva.Image | null>(null);

  const [image, imageSize] = useImage(imageUrl);
  const fit = fitInto(imageSize, stageSize);

  // Apply filter chain + adjustments to the image node.
  // Konva requires .cache() before filters take effect. Re-cache when the
  // image source changes; re-apply filter params on every change.
  useEffect(() => {
    const node = imageNodeRef.current;
    if (!node || !image) return;
    const filterChain = buildKonvaFilterChain(
      activeFilter ?? null,
      adjustments,
    );
    node.cache();
    // The Konva.Filters array type is loose; chain is a list of filter fns.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    node.filters(filterChain as any);
    applyFilterParams(node, activeFilter ?? null, adjustments);
    node.getLayer()?.batchDraw();
  }, [image, activeFilter, adjustments]);

  // Click on bare Stage background → clear selection (UX: tap outside to deselect).
  const handleStageMouseDown = (e: Konva.KonvaEventObject<MouseEvent>) => {
    if (e.target === e.target.getStage()) {
      selection.clear();
    }
  };

  return (
    <div
      ref={containerRef}
      className={cn("relative w-full h-full overflow-hidden", className)}
      style={{ background }}
    >
      {/* Video drafts render as plain <video> until C7+ wires overlays. */}
      {videoUrl ? (
        <video
          src={videoUrl}
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-contain"
        />
      ) : null}

      {/* Stage requires non-zero dimensions; render only after size is measured. */}
      {stageSize.width > 0 && stageSize.height > 0 ? (
        <Stage
          width={stageSize.width}
          height={stageSize.height}
          onMouseDown={handleStageMouseDown}
          onTouchStart={handleStageMouseDown as unknown as (e: Konva.KonvaEventObject<TouchEvent>) => void}
          className="absolute inset-0"
        >
          {/* image layer */}
          <Layer listening={false}>
            {image && imageUrl ? (
              <KonvaImage
                ref={imageNodeRef}
                image={image}
                x={fit.x}
                y={fit.y}
                width={fit.width}
                height={fit.height}
              />
            ) : null}
          </Layer>
          {/* drawing layer — empty in C6, populated C10 */}
          <Layer />
          {/* sticker layer — empty in C6, populated C9 */}
          <Layer />
          {/* text layer — empty in C6, populated C8 */}
          <Layer />
          {/* ui layer — Transformer attached on selection */}
          <Layer>
            <Transformer
              ref={selection.transformerRef}
              rotateEnabled
              keepRatio={false}
              boundBoxFunc={(_oldBox, newBox) => {
                // Prevent degenerate negative-size handles.
                if (newBox.width < 8 || newBox.height < 8) return _oldBox;
                return newBox;
              }}
            />
          </Layer>
        </Stage>
      ) : null}
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────

interface Size {
  width: number;
  height: number;
}

/** Load an image element + report its natural size. Returns [image, size]. */
function useImage(
  src: string | null,
): [HTMLImageElement | null, Size] {
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [size, setSize] = useState<Size>({ width: 0, height: 0 });

  useEffect(() => {
    if (!src) {
      setImage(null);
      setSize({ width: 0, height: 0 });
      return;
    }
    const img = new window.Image();
    img.crossOrigin = "anonymous";
    let cancelled = false;
    img.onload = () => {
      if (cancelled) return;
      setImage(img);
      setSize({ width: img.naturalWidth, height: img.naturalHeight });
    };
    img.onerror = () => {
      if (cancelled) return;
      setImage(null);
    };
    img.src = src;
    return () => {
      cancelled = true;
    };
  }, [src]);

  return [image, size];
}

// ─── Filter helpers ───────────────────────────────────────────────────

const KONVA_FILTER_MAP: Record<string, KonvaFilter | undefined> = {
  Brighten: Konva.Filters.Brighten,
  Contrast: Konva.Filters.Contrast,
  HSL: Konva.Filters.HSL,
  Sepia: Konva.Filters.Sepia,
  Grayscale: Konva.Filters.Grayscale,
  Blur: Konva.Filters.Blur,
  Noise: Konva.Filters.Noise,
};

/** Build the KonvaFilter array for the active preset + adjust sliders. */
function buildKonvaFilterChain(
  preset: FilterPreset | null,
  adjustments?: ImageAdjustments,
): KonvaFilter[] {
  const seen = new Set<string>();
  const out: KonvaFilter[] = [];
  const add = (name: string) => {
    if (seen.has(name)) return;
    const fn = KONVA_FILTER_MAP[name];
    if (!fn) return;
    seen.add(name);
    out.push(fn);
  };
  if (preset) {
    for (const spec of preset.konvaFilters) add(spec.name);
  }
  // Always include the adjustment filters so the sliders work over any preset.
  if (adjustments) {
    if (adjustments.brightness !== 0) add("Brighten");
    if (adjustments.contrast !== 0) add("Contrast");
    if (adjustments.saturation !== 0) add("HSL");
    if (adjustments.blur > 0) add("Blur");
  }
  return out;
}

/** Push numeric filter params onto the image node. */
function applyFilterParams(
  node: Konva.Image,
  preset: FilterPreset | null,
  adjustments?: ImageAdjustments,
) {
  // Reset to neutral before applying.
  node.brightness(0);
  node.contrast(0);
  node.saturation(0);
  node.hue(0);
  node.blurRadius(0);

  // Apply preset values first.
  if (preset) {
    for (const spec of preset.konvaFilters) {
      const p = spec.params ?? {};
      if (spec.name === "Brighten" && p.brightness !== undefined) {
        node.brightness(p.brightness);
      } else if (spec.name === "Contrast" && p.contrast !== undefined) {
        node.contrast(p.contrast);
      } else if (spec.name === "HSL") {
        if (p.saturation !== undefined) node.saturation(p.saturation);
        if (p.hue !== undefined) node.hue(p.hue);
      } else if (spec.name === "Blur" && p.blurRadius !== undefined) {
        node.blurRadius(p.blurRadius);
      }
    }
  }
  // Adjustments add on top of preset values.
  if (adjustments) {
    node.brightness(node.brightness() + adjustments.brightness);
    node.contrast(node.contrast() + adjustments.contrast);
    node.saturation(node.saturation() + adjustments.saturation);
    if (adjustments.blur > 0) node.blurRadius(adjustments.blur);
  }
}

/** Object-fit: contain inside the stage. */
function fitInto(
  source: Size,
  target: StageSize,
): { x: number; y: number; width: number; height: number } {
  if (
    source.width === 0 ||
    source.height === 0 ||
    target.width === 0 ||
    target.height === 0
  ) {
    return { x: 0, y: 0, width: 0, height: 0 };
  }
  const scale = Math.min(
    target.width / source.width,
    target.height / source.height,
  );
  const width = source.width * scale;
  const height = source.height * scale;
  const x = (target.width - width) / 2;
  const y = (target.height - height) / 2;
  return { x, y, width, height };
}
