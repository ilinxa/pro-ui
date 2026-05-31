"use client";

import { useEffect, useRef, useState } from "react";
import Konva from "konva";
import type { Filter as KonvaFilter } from "konva/lib/Node";
import {
  Stage,
  Layer,
  Image as KonvaImage,
  Line as KonvaLine,
  Text as KonvaText,
  Transformer,
} from "react-konva";
import { cn } from "@/lib/utils";
import {
  useKonvaStageSize,
  type StageSize,
} from "../hooks/use-konva-stage-size";
import { useKonvaSelection } from "../hooks/use-konva-selection";
import type { CropRect } from "./tool-crop-overlay";
import type {
  DrawingStroke,
  FilterPreset,
  ImageAdjustments,
  PlacedSticker,
  StickerOption,
  TextOverlay,
} from "../types";

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
  /** Text overlays (C8). */
  textOverlays?: TextOverlay[];
  /** Currently selected text overlay id (C8). */
  selectedTextId?: string | null;
  /** Fired on drag-end or transform-end of a text overlay. */
  onTextChange?: (next: TextOverlay) => void;
  /** Fired when a text overlay is tapped (selects it). */
  onTextSelect?: (id: string | null) => void;
  /** Sticker overlays (C9). */
  stickers?: PlacedSticker[];
  /** Sticker-id → StickerOption resolver (lets the editor look up src/dimensions). */
  resolveSticker?: (stickerId: string) => StickerOption | undefined;
  /** Currently selected sticker id (C9). */
  selectedStickerId?: string | null;
  onStickerChange?: (next: PlacedSticker) => void;
  onStickerSelect?: (id: string | null) => void;
  /** Completed drawing strokes (C10). */
  drawingStrokes?: DrawingStroke[];
  /** In-progress stroke (rendered live while pointer is down). */
  currentDrawingStroke?: DrawingStroke | null;
  /** When true, Stage pointer events feed the drawing pipeline. */
  isDrawing?: boolean;
  onDrawBegin?: (x: number, y: number) => void;
  onDrawExtend?: (x: number, y: number) => void;
  onDrawEnd?: () => void;
  /** Crop rect in stage coordinates (C11). Editor renders a dim+frame overlay when active. */
  cropRect?: CropRect | null;
  /** When true, the crop overlay is interactive (drag handles + reposition). */
  cropActive?: boolean;
  /** Aspect ratio of crop — locks resize behavior. */
  cropAspectRatio?: number | null;
  onCropChange?: (next: CropRect) => void;
  /** Surfaces stage dimensions to the parent (used to recompute crop rects on aspect change). */
  onStageSize?: (size: { width: number; height: number }) => void;
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
  textOverlays,
  selectedTextId,
  onTextChange,
  onTextSelect,
  stickers,
  resolveSticker,
  selectedStickerId,
  onStickerChange,
  onStickerSelect,
  drawingStrokes,
  currentDrawingStroke,
  isDrawing = false,
  onDrawBegin,
  onDrawExtend,
  onDrawEnd,
  cropRect,
  cropActive = false,
  cropAspectRatio,
  onCropChange,
  onStageSize,
  className,
}: ComposerEditorProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const stageSize = useKonvaStageSize(containerRef);
  const selection = useKonvaSelection();
  const imageNodeRef = useRef<Konva.Image | null>(null);

  const [image, imageSize] = useImage(imageUrl);
  const fit = fitInto(imageSize, stageSize);

  useEffect(() => {
    if (stageSize.width > 0 && stageSize.height > 0) {
      onStageSize?.(stageSize);
    }
  }, [stageSize, onStageSize]);

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

  const textNodeRefs = useRef<Map<string, Konva.Text>>(new Map());
  const stickerNodeRefs = useRef<Map<string, Konva.Image>>(new Map());

  // Attach the Transformer to the currently-selected node (text or sticker).
  useEffect(() => {
    const t = selection.transformerRef.current;
    if (!t) return;
    let node: Konva.Node | undefined;
    if (selectedTextId) {
      node = textNodeRefs.current.get(selectedTextId);
    } else if (selectedStickerId) {
      node = stickerNodeRefs.current.get(selectedStickerId);
    }
    if (node) {
      t.nodes([node]);
    } else {
      t.nodes([]);
    }
    t.getLayer()?.batchDraw();
  }, [
    selectedTextId,
    selectedStickerId,
    textOverlays,
    stickers,
    selection.transformerRef,
  ]);

  // Click on bare Stage background → clear all selection.
  const handleStageMouseDown = (e: Konva.KonvaEventObject<MouseEvent>) => {
    if (isDrawing) {
      // Drawing intercepts everything — see handleStagePointerDown below.
      return;
    }
    if (e.target === e.target.getStage()) {
      onTextSelect?.(null);
      onStickerSelect?.(null);
      selection.clear();
    }
  };

  // Drawing-mode pointer pipeline. We read the cursor position from the
  // Stage so it's already in stage coordinates (not page coordinates).
  const handleStagePointerDown = (
    e: Konva.KonvaEventObject<PointerEvent>,
  ) => {
    if (!isDrawing) return;
    const stage = e.target.getStage();
    const pos = stage?.getPointerPosition();
    if (pos) onDrawBegin?.(pos.x, pos.y);
  };

  const handleStagePointerMove = (
    e: Konva.KonvaEventObject<PointerEvent>,
  ) => {
    if (!isDrawing || !currentDrawingStroke) return;
    const stage = e.target.getStage();
    const pos = stage?.getPointerPosition();
    if (pos) onDrawExtend?.(pos.x, pos.y);
  };

  const handleStagePointerUp = () => {
    if (!isDrawing) return;
    onDrawEnd?.();
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
          onPointerDown={handleStagePointerDown}
          onPointerMove={handleStagePointerMove}
          onPointerUp={handleStagePointerUp}
          onPointerCancel={handleStagePointerUp}
          className="absolute inset-0"
          style={isDrawing ? { cursor: "crosshair" } : undefined}
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
          {/* drawing layer (C10) */}
          <Layer listening={false}>
            {drawingStrokes?.map((stroke) => (
              <KonvaLine
                key={stroke.id}
                points={stroke.points}
                stroke={stroke.color}
                strokeWidth={stroke.brushSize}
                lineCap="round"
                lineJoin="round"
                tension={0.4}
                globalCompositeOperation={
                  stroke.mode === "erase"
                    ? "destination-out"
                    : "source-over"
                }
              />
            ))}
            {currentDrawingStroke ? (
              <KonvaLine
                key="current"
                points={currentDrawingStroke.points}
                stroke={currentDrawingStroke.color}
                strokeWidth={currentDrawingStroke.brushSize}
                lineCap="round"
                lineJoin="round"
                tension={0.4}
                globalCompositeOperation={
                  currentDrawingStroke.mode === "erase"
                    ? "destination-out"
                    : "source-over"
                }
              />
            ) : null}
          </Layer>
          {/* sticker layer (C9) */}
          <Layer>
            {stickers?.map((placed) => {
              const option = resolveSticker?.(placed.stickerId);
              if (!option) return null;
              return (
                <PlacedStickerImage
                  key={placed.id}
                  placed={placed}
                  option={option}
                  onMount={(node) => {
                    if (node) stickerNodeRefs.current.set(placed.id, node);
                    else stickerNodeRefs.current.delete(placed.id);
                  }}
                  onSelect={() => onStickerSelect?.(placed.id)}
                  onChange={onStickerChange}
                />
              );
            })}
          </Layer>
          {/* text layer (C8) */}
          <Layer>
            {textOverlays?.map((overlay) => (
              <KonvaText
                key={overlay.id}
                ref={(node) => {
                  if (node) textNodeRefs.current.set(overlay.id, node);
                  else textNodeRefs.current.delete(overlay.id);
                }}
                x={overlay.x}
                y={overlay.y}
                text={overlay.text}
                fontFamily={overlay.fontFamily}
                fontSize={overlay.fontSize}
                fill={overlay.fill}
                align={overlay.align}
                rotation={overlay.rotation}
                scaleX={overlay.scale}
                scaleY={overlay.scale}
                draggable
                onMouseDown={(e) => {
                  e.cancelBubble = true;
                  onTextSelect?.(overlay.id);
                }}
                onTouchStart={(e) => {
                  e.cancelBubble = true;
                  onTextSelect?.(overlay.id);
                }}
                onDragEnd={(e) => {
                  onTextChange?.({
                    ...overlay,
                    x: e.target.x(),
                    y: e.target.y(),
                  });
                }}
                onTransformEnd={(e) => {
                  const node = e.target as Konva.Text;
                  const nextScale = node.scaleX();
                  onTextChange?.({
                    ...overlay,
                    x: node.x(),
                    y: node.y(),
                    rotation: node.rotation(),
                    scale: nextScale,
                  });
                }}
              />
            ))}
          </Layer>
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

      {/* Crop overlay (DOM over the Konva canvas). C11. */}
      {cropActive && cropRect && stageSize.width > 0 ? (
        <CropOverlay
          rect={cropRect}
          stageWidth={stageSize.width}
          stageHeight={stageSize.height}
          aspectRatio={cropAspectRatio ?? null}
          onChange={onCropChange}
        />
      ) : null}
    </div>
  );
}

// ─── Crop overlay (DOM) ───────────────────────────────────────────────

interface CropOverlayProps {
  rect: CropRect;
  stageWidth: number;
  stageHeight: number;
  aspectRatio: number | null;
  onChange?: (next: CropRect) => void;
}

const HANDLE_SIZE = 14;
const MIN_CROP = 40;

function CropOverlay({
  rect,
  stageWidth,
  stageHeight,
  aspectRatio,
  onChange,
}: CropOverlayProps) {
  const dragStateRef = useRef<{
    mode: "move" | "ne" | "nw" | "se" | "sw";
    startX: number;
    startY: number;
    startRect: CropRect;
  } | null>(null);

  const beginDrag = (
    mode: "move" | "ne" | "nw" | "se" | "sw",
  ) => (e: React.PointerEvent) => {
    e.stopPropagation();
    e.currentTarget.setPointerCapture?.(e.pointerId);
    dragStateRef.current = {
      mode,
      startX: e.clientX,
      startY: e.clientY,
      startRect: { ...rect },
    };
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const ds = dragStateRef.current;
    if (!ds || !onChange) return;
    const dx = e.clientX - ds.startX;
    const dy = e.clientY - ds.startY;

    let { x, y, width, height } = ds.startRect;
    const r = aspectRatio; // null = free

    if (ds.mode === "move") {
      x = clamp(ds.startRect.x + dx, 0, stageWidth - ds.startRect.width);
      y = clamp(ds.startRect.y + dy, 0, stageHeight - ds.startRect.height);
    } else {
      // Resize from a corner. Use the dominant axis to drive width when
      // aspect-locked; otherwise both axes are free.
      let nextWidth = ds.startRect.width;
      let nextHeight = ds.startRect.height;

      if (ds.mode === "se") {
        nextWidth = ds.startRect.width + dx;
        nextHeight = r ? nextWidth / r : ds.startRect.height + dy;
      } else if (ds.mode === "ne") {
        nextWidth = ds.startRect.width + dx;
        nextHeight = r ? nextWidth / r : ds.startRect.height - dy;
        y = ds.startRect.y + (ds.startRect.height - nextHeight);
      } else if (ds.mode === "sw") {
        nextWidth = ds.startRect.width - dx;
        nextHeight = r ? nextWidth / r : ds.startRect.height + dy;
        x = ds.startRect.x + (ds.startRect.width - nextWidth);
      } else if (ds.mode === "nw") {
        nextWidth = ds.startRect.width - dx;
        nextHeight = r ? nextWidth / r : ds.startRect.height - dy;
        x = ds.startRect.x + (ds.startRect.width - nextWidth);
        y = ds.startRect.y + (ds.startRect.height - nextHeight);
      }

      // Enforce min size + stage bounds.
      nextWidth = Math.max(MIN_CROP, Math.min(nextWidth, stageWidth));
      nextHeight = Math.max(MIN_CROP, Math.min(nextHeight, stageHeight));
      x = clamp(x, 0, stageWidth - nextWidth);
      y = clamp(y, 0, stageHeight - nextHeight);

      width = nextWidth;
      height = nextHeight;
    }

    onChange({ x, y, width, height });
  };

  const endDrag = () => {
    dragStateRef.current = null;
  };

  return (
    <div
      className="absolute inset-0 pointer-events-none"
      style={{ width: stageWidth, height: stageHeight }}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
    >
      {/* Dim 4 quadrants outside the crop rect */}
      <div
        className="absolute inset-x-0 top-0 bg-black/60"
        style={{ height: rect.y }}
      />
      <div
        className="absolute inset-x-0 bottom-0 bg-black/60"
        style={{ height: stageHeight - rect.y - rect.height }}
      />
      <div
        className="absolute left-0 bg-black/60"
        style={{
          top: rect.y,
          height: rect.height,
          width: rect.x,
        }}
      />
      <div
        className="absolute right-0 bg-black/60"
        style={{
          top: rect.y,
          height: rect.height,
          width: stageWidth - rect.x - rect.width,
        }}
      />

      {/* Crop frame (movable) */}
      <div
        className="absolute border-2 border-white pointer-events-auto cursor-move"
        style={{
          left: rect.x,
          top: rect.y,
          width: rect.width,
          height: rect.height,
        }}
        onPointerDown={beginDrag("move")}
      >
        {/* Rule-of-thirds grid */}
        <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 pointer-events-none">
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} className="border border-white/20" />
          ))}
        </div>

        {/* Corner handles */}
        {(["nw", "ne", "sw", "se"] as const).map((corner) => (
          <button
            type="button"
            key={corner}
            onPointerDown={beginDrag(corner)}
            className="absolute bg-white rounded-full shadow"
            style={{
              width: HANDLE_SIZE,
              height: HANDLE_SIZE,
              left:
                corner === "nw" || corner === "sw"
                  ? -HANDLE_SIZE / 2
                  : undefined,
              right:
                corner === "ne" || corner === "se"
                  ? -HANDLE_SIZE / 2
                  : undefined,
              top:
                corner === "nw" || corner === "ne"
                  ? -HANDLE_SIZE / 2
                  : undefined,
              bottom:
                corner === "sw" || corner === "se"
                  ? -HANDLE_SIZE / 2
                  : undefined,
              cursor:
                corner === "nw" || corner === "se"
                  ? "nwse-resize"
                  : "nesw-resize",
            }}
            aria-label={`Resize ${corner.toUpperCase()}`}
          />
        ))}
      </div>
    </div>
  );
}

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

// ─── Sticker rendering ────────────────────────────────────────────────

interface PlacedStickerImageProps {
  placed: PlacedSticker;
  option: StickerOption;
  onMount: (node: Konva.Image | null) => void;
  onSelect: () => void;
  onChange?: (next: PlacedSticker) => void;
}

function PlacedStickerImage({
  placed,
  option,
  onMount,
  onSelect,
  onChange,
}: PlacedStickerImageProps) {
  const [image] = useImage(option.src);
  if (!image) return null;
  return (
    <KonvaImage
      ref={(n) => onMount(n)}
      image={image}
      x={placed.x}
      y={placed.y}
      width={option.width ?? 128}
      height={option.height ?? 128}
      offsetX={(option.width ?? 128) / 2}
      offsetY={(option.height ?? 128) / 2}
      rotation={placed.rotation}
      scaleX={placed.scale}
      scaleY={placed.scale}
      draggable
      onMouseDown={(e) => {
        e.cancelBubble = true;
        onSelect();
      }}
      onTouchStart={(e) => {
        e.cancelBubble = true;
        onSelect();
      }}
      onDragEnd={(e) => {
        onChange?.({
          ...placed,
          x: e.target.x(),
          y: e.target.y(),
        });
      }}
      onTransformEnd={(e) => {
        const node = e.target as Konva.Image;
        onChange?.({
          ...placed,
          x: node.x(),
          y: node.y(),
          rotation: node.rotation(),
          scale: node.scaleX(),
        });
      }}
    />
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
