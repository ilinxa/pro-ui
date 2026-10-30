"use client";

import { useCallback, useEffect, useRef, useState } from "react";
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
  useKonvaSelection,
  usePanZoom,
  type StageSize,
} from "../../media-editor";
import { Button } from "@/components/ui/button";
import { Maximize2 } from "lucide-react";
import type { CropRect } from "./tool-crop-overlay";
import { resolveEditorLabels } from "../lib/normalize-labels";
import {
  BASE_IMAGE_NODE_NAME,
  TRANSFORMER_NODE_NAME,
  UI_LAYER_NAME,
  resolveCanvasFontFamily,
} from "../lib/placement";
import type {
  DrawingStroke,
  FilterPreset,
  ImageAdjustments,
  MediaEditorResolvedLabels,
  PlacedSticker,
  StickerOption,
  TextOverlay,
} from "../types";

export interface EditorCanvasProps {
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
  /** Surfaces the underlying Konva.Stage instance for export (C12). */
  onStageReady?: (stage: Konva.Stage | null) => void;
  /**
   * The photo's displayed (fitted) rect on the stage, CSS px — fires whenever
   * it changes (stage resize, new image), and `null` when no image is shown.
   * SLICE A (0.6.0).
   */
  onMediaRect?: (rect: CropRect | null) => void;
  /**
   * Fires once the Konva layer has drawn the image for `imageUrl` (after it
   * loaded and the next frame painted), with the image's natural size.
   * SLICE A (0.6.0).
   */
  onImagePainted?: (
    url: string,
    natural: { width: number; height: number },
  ) => void;
  /** Fires when the image for `imageUrl` fails to load. SLICE A (0.6.0). */
  onImageError?: (url: string) => void;
  /** Accessible names. Default: the English defaults. */
  labels?: CanvasLabels;
  className?: string;
  /**
   * Fixed stage ratio (width / height) — set by the shell for a fixed canvas
   * `aspect` so the stage takes it exactly (0.8.0). Internal.
   */
  stageRatio?: number | null;
}

type CanvasLabels = Pick<
  MediaEditorResolvedLabels,
  "canvasAriaLabel" | "resetZoom" | "resizeHandle"
>;

const DEFAULT_CANVAS_LABELS: CanvasLabels = resolveEditorLabels(undefined);

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
export function EditorCanvas({
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
  onStageReady,
  onMediaRect,
  onImagePainted,
  onImageError,
  labels = DEFAULT_CANVAS_LABELS,
  className,
  stageRatio,
}: EditorCanvasProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const stageRef = useRef<Konva.Stage | null>(null);
  const stageSize = useKonvaStageSize(containerRef, stageRatio);
  // Destructure the selection hook result to locals up front. `transformerRef`
  // is a ref-typed field; reading it as `selection.transformerRef` makes the
  // React Compiler's aliasing analysis treat the whole result object as a ref
  // container and flag every access (known false-positive class — same fix as
  // story-viewer/reply-composer).
  const { transformerRef, clear: clearSelection } = useKonvaSelection();
  const imageNodeRef = useRef<Konva.Image | null>(null);

  // Single-pointer drag-pan must yield to draggable overlays. Hit-test the
  // stage on pointer-down: if a listening node (text / sticker / transformer
  // handle) is under the pointer, don't pan — let Konva drag that node. The
  // image layer is listening={false}, so background/image hits return null →
  // pan engages.
  const shouldStartPan = useCallback((e: { clientX: number; clientY: number }) => {
    const stage = stageRef.current;
    if (!stage) return true;
    const rect = stage.container().getBoundingClientRect();
    return !stage.getIntersection({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  }, []);

  // Pan + pinch-zoom (single-pointer drag / touch 2-finger / wheel / keyboard).
  // Disabled when:
  //   - drawing is active (Stage owns the pointer pipeline for strokes)
  //   - cropping is active (crop overlay is DOM; can't follow stage transform)
  const panZoom = usePanZoom({
    targetRef: containerRef,
    enabled: !isDrawing && !cropActive,
    shouldStartPan,
  });

  // Crop maps stage-coordinate rects onto the source image assuming an
  // identity stage transform, and the DOM crop overlay can't follow stage
  // zoom/pan — normalize the view the moment the crop tool takes over.
  // (Pan/zoom is merely DISABLED while cropping; without this reset a
  // zoom-then-crop crops the wrong region.)
  const panZoomReset = panZoom.reset;
  useEffect(() => {
    if (cropActive) panZoomReset();
  }, [cropActive, panZoomReset]);

  const [image, imageSize, loadedSrc] = useImage(imageUrl, onImageError);
  const fit = fitInto(imageSize, stageSize);
  const hasFit = fit.width > 0 && fit.height > 0;
  // Where the crop frame lives: the photo's displayed rect, else the stage.
  const bounds: CropRect = hasFit
    ? { x: fit.x, y: fit.y, width: fit.width, height: fit.height }
    : { x: 0, y: 0, width: stageSize.width, height: stageSize.height };
  const boundsX = bounds.x;
  const boundsY = bounds.y;
  const boundsW = bounds.width;
  const boundsH = bounds.height;

  // Report the photo's displayed rect — on change only (value compare).
  const onMediaRectRef = useRef(onMediaRect);
  useEffect(() => {
    onMediaRectRef.current = onMediaRect;
  });
  const lastMediaRectRef = useRef<CropRect | null>(null);
  useEffect(() => {
    // A 0x0 stage (hidden container) is not "no image": keep the last report.
    if (!hasFit && image && imageUrl) return;
    const next: CropRect | null = hasFit
      ? { x: fit.x, y: fit.y, width: fit.width, height: fit.height }
      : null;
    const prev = lastMediaRectRef.current;
    const same =
      prev === next ||
      (prev !== null &&
        next !== null &&
        prev.x === next.x &&
        prev.y === next.y &&
        prev.width === next.width &&
        prev.height === next.height);
    if (same) return;
    lastMediaRectRef.current = next;
    onMediaRectRef.current?.(next);
  }, [hasFit, fit.x, fit.y, fit.width, fit.height, image, imageUrl]);

  // Plain-<img> underlay: visible while Konva decodes the blob URL into its
  // own HTMLImageElement and waits for the Stage's ResizeObserver to fire.
  // Without this the user sees a black background between Suspense resolving
  // and the KonvaImage actually rendering. Once `image` lands, hide the
  // underlay so applied filters/adjustments aren't doubled by the unfiltered
  // copy bleeding through Konva's transparent canvas.
  const showUnderlay = !!imageUrl && !image;

  useEffect(() => {
    if (stageSize.width > 0 && stageSize.height > 0) {
      onStageSize?.(stageSize);
    }
  }, [stageSize, onStageSize]);

  // Auto-initialize cropRect when the crop tool activates without an existing
  // rect. Default = centered, 80% of stage dimensions, respecting cropAspectRatio
  // if set (rect aspect = min of stage-fit + crop-lock). Without this, clicking
  // the crop button activates the tool but leaves the overlay invisible because
  // it gates on `cropRect != null`.
  useEffect(() => {
    if (!cropActive) return;
    if (cropRect) return;
    if (stageSize.width <= 0 || stageSize.height <= 0) return;
    if (!onCropChange) return;
    // 80 % of the photo's displayed rect (the stage when no photo is shown).
    let rw = boundsW * 0.8;
    let rh = boundsH * 0.8;
    if (cropAspectRatio && cropAspectRatio > 0) {
      // Fit the largest centered rect with cropAspectRatio inside 80%-of-stage.
      const boxAspect = rw / rh;
      if (boxAspect > cropAspectRatio) {
        rw = rh * cropAspectRatio;
      } else {
        rh = rw / cropAspectRatio;
      }
    }
    onCropChange({
      x: boundsX + (boundsW - rw) / 2,
      y: boundsY + (boundsH - rh) / 2,
      width: rw,
      height: rh,
    });
  }, [
    cropActive,
    cropRect,
    stageSize,
    boundsX,
    boundsY,
    boundsW,
    boundsH,
    cropAspectRatio,
    onCropChange,
  ]);

  // Apply filter chain + adjustments to the image node.
  // Konva requires .cache() before filters take effect. Re-cache when the
  // image source changes; re-apply filter params on every change.
  // Re-cache when the fitted size changes too: a cached bitmap keeps the size
  // it was taken at, so a stage resize / crop open-close would otherwise draw a
  // stale, wrongly scaled copy. Nothing to cache while the fitted size is 0.
  const fitWidth = fit.width;
  const fitHeight = fit.height;
  useEffect(() => {
    const node = imageNodeRef.current;
    if (!node || !image) return;
    if (fitWidth <= 0 || fitHeight <= 0) return;
    const filterChain = buildKonvaFilterChain(
      activeFilter ?? null,
      adjustments,
    );
    node.clearCache();
    if (filterChain.length > 0) {
      // Only a filtered image needs the cached bitmap (Konva filters run on
      // it). A plain image stays uncached so it draws at full resolution -
      // a cache is taken at the screen pixel ratio and would make every
      // export an up-scaled copy of the on-screen bitmap.
      node.cache();
      // The Konva.Filters array type is loose; chain is a list of filter fns.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      node.filters(filterChain as any);
    } else {
      node.filters([]);
    }
    applyFilterParams(node, activeFilter ?? null, adjustments);
    node.getLayer()?.batchDraw();
  }, [image, activeFilter, adjustments, fitWidth, fitHeight]);

  // Tell the host once the image for the CURRENT `imageUrl` is on screen: it
  // has loaded (not the previous image kept during a src change), the node has
  // been drawn, and one more frame has passed.
  const onImagePaintedRef = useRef(onImagePainted);
  useEffect(() => {
    onImagePaintedRef.current = onImagePainted;
  });
  const paintedUrlRef = useRef<string | null>(null);
  const naturalWidth = imageSize.width;
  const naturalHeight = imageSize.height;
  useEffect(() => {
    if (!imageUrl) {
      paintedUrlRef.current = null;
      return;
    }
    if (paintedUrlRef.current === imageUrl) return;
    if (!image || loadedSrc !== imageUrl) return;
    const node = imageNodeRef.current;
    if (!node || fitWidth <= 0 || fitHeight <= 0) return;
    node.getLayer()?.batchDraw();
    const url = imageUrl;
    const natural = { width: naturalWidth, height: naturalHeight };
    // rAF is throttled / suspended in a hidden tab; a short timer backs it up.
    // Whichever fires first reports, once.
    let done = false;
    const fire = () => {
      if (done) return;
      done = true;
      paintedUrlRef.current = url;
      onImagePaintedRef.current?.(url, natural);
    };
    const raf = requestAnimationFrame(fire);
    const timer = setTimeout(fire, PAINT_TIMER_FALLBACK_MS);
    return () => {
      done = true;
      cancelAnimationFrame(raf);
      clearTimeout(timer);
    };
  }, [
    imageUrl,
    image,
    loadedSrc,
    fitWidth,
    fitHeight,
    naturalWidth,
    naturalHeight,
  ]);

  const textNodeRefs = useRef<Map<string, Konva.Text>>(new Map());
  const stickerNodeRefs = useRef<Map<string, Konva.Image>>(new Map());

  // Attach the Transformer to the currently-selected node (text or sticker).
  useEffect(() => {
    const t = transformerRef.current;
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
    transformerRef,
  ]);

  // Click/tap on bare Stage background → clear all selection. Accepts mouse OR
  // touch events so it can wire to both onMouseDown + onTouchStart without a cast.
  const handleStageMouseDown = (
    e: Konva.KonvaEventObject<MouseEvent | TouchEvent>,
  ) => {
    if (isDrawing) {
      // Drawing intercepts everything — see handleStagePointerDown below.
      return;
    }
    if (e.target === e.target.getStage()) {
      onTextSelect?.(null);
      onStickerSelect?.(null);
      clearSelection();
    }
  };

  // Drawing-mode pointer pipeline. We read the cursor position from the
  // Stage so it's already in stage coordinates (not page coordinates).
  const handleStagePointerDown = (
    e: Konva.KonvaEventObject<PointerEvent>,
  ) => {
    if (!isDrawing) return;
    const stage = e.target.getStage();
    // getRelativePointerPosition returns coords AFTER the Stage's own scale +
    // position transform, which is what we want — strokes stick to the image
    // regardless of zoom/pan state.
    const pos = stage?.getRelativePointerPosition();
    if (pos) onDrawBegin?.(pos.x, pos.y);
  };

  const handleStagePointerMove = (
    e: Konva.KonvaEventObject<PointerEvent>,
  ) => {
    if (!isDrawing || !currentDrawingStroke) return;
    const stage = e.target.getStage();
    // getRelativePointerPosition returns coords AFTER the Stage's own scale +
    // position transform, which is what we want — strokes stick to the image
    // regardless of zoom/pan state.
    const pos = stage?.getRelativePointerPosition();
    if (pos) onDrawExtend?.(pos.x, pos.y);
  };

  const handleStagePointerUp = () => {
    if (!isDrawing) return;
    onDrawEnd?.();
  };

  return (
    <div
      ref={containerRef}
      // Focusable so usePanZoom's keyboard listener (bound to this element, not
      // window) is focus-scoped — arrow/zoom keys only act when the canvas holds
      // focus. role/aria-label name the region for AT.
      tabIndex={0}
      role="group"
      aria-label={labels.canvasAriaLabel}
      className={cn(
        "relative w-full h-full overflow-hidden touch-none",
        "outline-hidden focus-visible:ring-2 focus-visible:ring-ring/70 focus-visible:ring-inset",
        className,
      )}
      style={{ background }}
      onPointerDown={panZoom.handlers.onPointerDown}
      onPointerMove={panZoom.handlers.onPointerMove}
      onPointerUp={panZoom.handlers.onPointerUp}
      onPointerCancel={panZoom.handlers.onPointerCancel}
    >
      {/* Instant-photo underlay — see `showUnderlay` above. */}
      {showUnderlay ? (
        <img
          src={imageUrl ?? undefined}
          alt=""
          draggable={false}
          className="absolute inset-0 w-full h-full object-contain pointer-events-none"
        />
      ) : null}

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
          ref={(s) => {
            stageRef.current = s;
            onStageReady?.(s);
          }}
          width={stageSize.width}
          height={stageSize.height}
          scaleX={panZoom.transform.scale}
          scaleY={panZoom.transform.scale}
          x={panZoom.transform.x}
          y={panZoom.transform.y}
          onMouseDown={handleStageMouseDown}
          onTouchStart={handleStageMouseDown}
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
                name={BASE_IMAGE_NODE_NAME}
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
                fontFamily={resolveCanvasFontFamily(overlay.fontFamily)}
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
          <Layer name={UI_LAYER_NAME}>
            <Transformer
              ref={transformerRef}
              name={TRANSFORMER_NODE_NAME}
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

      {/* Reset-zoom CTA — only visible when zoomed/panned, hidden during crop */}
      {!panZoom.isIdentity && !cropActive ? (
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={panZoom.reset}
          aria-label={labels.resetZoom}
          className="absolute top-3 start-3 z-20 gap-1.5 bg-media-overlay backdrop-blur-md text-media-overlay-foreground hover:bg-media-overlay-foreground/10 hover:text-media-overlay-foreground"
        >
          <Maximize2 className="size-3.5" />
          <span className="text-xs font-mono tabular-nums">
            {Math.round(panZoom.transform.scale * 100)}%
          </span>
        </Button>
      ) : null}

      {/* Crop overlay (DOM over the Konva canvas). C11. */}
      {cropActive && cropRect && stageSize.width > 0 ? (
        <CropOverlay
          rect={cropRect}
          stageWidth={stageSize.width}
          stageHeight={stageSize.height}
          bounds={bounds}
          aspectRatio={cropAspectRatio ?? null}
          resizeHandleLabel={labels.resizeHandle}
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
  /** The frame is clamped to this rect (the photo's displayed rect, else the stage). */
  bounds: CropRect;
  aspectRatio: number | null;
  resizeHandleLabel: (corner: string) => string;
  onChange?: (next: CropRect) => void;
}

const HANDLE_SIZE = 14;
/** Hit area of a corner handle (WCAG 2.5.8 minimum target is 24px); the dot stays HANDLE_SIZE. */
const HANDLE_HIT = 24;
const MIN_CROP = 40;

function CropOverlay({
  rect,
  stageWidth,
  stageHeight,
  bounds,
  aspectRatio,
  resizeHandleLabel,
  onChange,
}: CropOverlayProps) {
  const boundsRight = bounds.x + bounds.width;
  const boundsBottom = bounds.y + bounds.height;
  const dragStateRef = useRef<{
    mode: "move" | "ne" | "nw" | "se" | "sw";
    startX: number;
    startY: number;
    startRect: CropRect;
  } | null>(null);

  // Plain two-arg handler invoked from inline arrows in the JSX props below.
  // (The previous curried `beginDrag(mode)` builder ran during render, which
  // made the compiler flag its ref write; the handler form only runs on the
  // pointer event.)
  const beginDrag = (
    mode: "move" | "ne" | "nw" | "se" | "sw",
    e: React.PointerEvent,
  ) => {
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
      x = clamp(ds.startRect.x + dx, bounds.x, boundsRight - ds.startRect.width);
      y = clamp(ds.startRect.y + dy, bounds.y, boundsBottom - ds.startRect.height);
    } else {
      // Resize from a corner. Compute signed "growth" for each axis (positive
      // = corner drag enlarges the rect). When aspect-locked, the rect must
      // stay locked end-to-end — including when it hits a stage edge: growth
      // stops cleanly, never breaks ratio. We compute max-allowable next
      // dimensions given the anchor position + stage bounds, then clamp the
      // drive to the most-restrictive of (candidate-from-drag, max-from-X,
      // max-from-Y-mapped-through-r). When free, axes are independent.
      const growX =
        ds.mode === "se" || ds.mode === "ne" ? dx : -dx;
      const growY =
        ds.mode === "se" || ds.mode === "sw" ? dy : -dy;
      // Max additional growth allowed in each axis, given the anchor.
      const maxGrowX =
        ds.mode === "ne" || ds.mode === "se"
          ? boundsRight - (ds.startRect.x + ds.startRect.width)
          : ds.startRect.x - bounds.x;
      const maxGrowY =
        ds.mode === "sw" || ds.mode === "se"
          ? boundsBottom - (ds.startRect.y + ds.startRect.height)
          : ds.startRect.y - bounds.y;
      const maxNextW = ds.startRect.width + maxGrowX;
      const maxNextH = ds.startRect.height + maxGrowY;

      let nextWidth: number;
      let nextHeight: number;
      if (r) {
        // User drives EITHER axis. Pick the axis with larger signed growth.
        const xEquivFromY = growY * r;
        const drive =
          Math.abs(xEquivFromY) > Math.abs(growX) ? xEquivFromY : growX;
        let candidateW = ds.startRect.width + drive;
        // Aspect-respecting upper bound: width can't exceed maxNextW OR
        // maxNextH * r (whichever binds first). Lower bound: MIN_CROP.
        const aspectCappedMaxW = Math.min(maxNextW, maxNextH * r);
        candidateW = Math.min(candidateW, aspectCappedMaxW);
        candidateW = Math.max(candidateW, MIN_CROP);
        // Same for shrink direction — width derived height must be >= MIN_CROP.
        candidateW = Math.max(candidateW, MIN_CROP * r);
        nextWidth = candidateW;
        nextHeight = nextWidth / r;
      } else {
        // Free resize — each axis clamped independently.
        nextWidth = Math.max(
          MIN_CROP,
          Math.min(ds.startRect.width + growX, maxNextW),
        );
        nextHeight = Math.max(
          MIN_CROP,
          Math.min(ds.startRect.height + growY, maxNextH),
        );
      }

      // Anchor: the corner opposite to the dragged one stays fixed.
      if (ds.mode === "nw" || ds.mode === "sw") {
        x = ds.startRect.x + (ds.startRect.width - nextWidth);
      }
      if (ds.mode === "nw" || ds.mode === "ne") {
        y = ds.startRect.y + (ds.startRect.height - nextHeight);
      }

      // Stage-bound clamp (safety; aspect-respecting cap above should make
      // these no-ops in normal cases).
      x = clamp(x, bounds.x, boundsRight - nextWidth);
      y = clamp(y, bounds.y, boundsBottom - nextHeight);

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
        className="absolute inset-x-0 top-0 bg-media-overlay"
        style={{ height: rect.y }}
      />
      <div
        className="absolute inset-x-0 bottom-0 bg-media-overlay"
        style={{ height: stageHeight - rect.y - rect.height }}
      />
      <div
        // dir-ok: dim mask sized in px from Konva stage coordinates (rect.x), physical axis
        className="absolute left-0 bg-media-overlay"
        style={{
          top: rect.y,
          height: rect.height,
          width: rect.x,
        }}
      />
      <div
        // dir-ok: dim mask sized in px from Konva stage coordinates (rect.x), physical axis
        className="absolute right-0 bg-media-overlay"
        style={{
          top: rect.y,
          height: rect.height,
          width: stageWidth - rect.x - rect.width,
        }}
      />

      {/* Crop frame (movable) */}
      <div
        className="absolute border-2 border-media-overlay-foreground pointer-events-auto cursor-move"
        style={{
          left: rect.x,
          top: rect.y,
          width: rect.width,
          height: rect.height,
        }}
        onPointerDown={(e) => beginDrag("move", e)}
      >
        {/* Rule-of-thirds grid */}
        <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 pointer-events-none">
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} className="border border-media-overlay-foreground/20" />
          ))}
        </div>

        {/* Corner handles */}
        {(["nw", "ne", "sw", "se"] as const).map((corner) => (
          <button
            type="button"
            key={corner}
            onPointerDown={(e) => beginDrag(corner, e)}
            className="absolute grid place-items-center"
            style={{
              width: HANDLE_HIT,
              height: HANDLE_HIT,
              left:
                corner === "nw" || corner === "sw"
                  ? -HANDLE_HIT / 2
                  : undefined,
              right:
                corner === "ne" || corner === "se"
                  ? -HANDLE_HIT / 2
                  : undefined,
              top:
                corner === "nw" || corner === "ne"
                  ? -HANDLE_HIT / 2
                  : undefined,
              bottom:
                corner === "sw" || corner === "se"
                  ? -HANDLE_HIT / 2
                  : undefined,
              cursor:
                corner === "nw" || corner === "se"
                  ? "nwse-resize"
                  : "nesw-resize",
            }}
            aria-label={resizeHandleLabel(corner.toUpperCase())}
          >
            {/* The visible dot stays HANDLE_SIZE and centred on the corner; the
                button around it is the >= 24px hit area. */}
            <span
              aria-hidden="true"
              className="pointer-events-none block rounded-full bg-media-overlay-foreground shadow"
              style={{ width: HANDLE_SIZE, height: HANDLE_SIZE }}
            />
          </button>
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
  onError?: (url: string) => void,
): [HTMLImageElement | null, Size, string | null] {
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [size, setSize] = useState<Size>({ width: 0, height: 0 });
  // Which src the current `image` was loaded from (a src->src change keeps the
  // old image until the new one lands, so `image` may belong to an older src).
  const [loadedSrc, setLoadedSrc] = useState<string | null>(null);
  const onErrorRef = useRef(onError);
  useEffect(() => {
    onErrorRef.current = onError;
  });

  // Reset when the source is CLEARED — during render via the guarded
  // prev-props pattern (React docs "adjusting state when props change"), so
  // the effect below only does external-system work (image loading).
  // Deliberately fires only on the →null transition: a src→src change keeps
  // the old image visible until the replacement loads (existing behavior).
  const [prevSrc, setPrevSrc] = useState(src);
  if (prevSrc !== src) {
    setPrevSrc(src);
    if (!src) {
      setImage(null);
      setSize({ width: 0, height: 0 });
      setLoadedSrc(null);
    }
  }

  useEffect(() => {
    if (!src) return;
    const img = new window.Image();
    img.crossOrigin = "anonymous";
    let cancelled = false;
    img.onload = () => {
      if (cancelled) return;
      setImage(img);
      setSize({ width: img.naturalWidth, height: img.naturalHeight });
      setLoadedSrc(src);
    };
    img.onerror = () => {
      if (cancelled) return;
      setImage(null);
      setLoadedSrc(null);
      onErrorRef.current?.(src);
    };
    img.src = src;
    return () => {
      cancelled = true;
    };
  }, [src]);

  return [image, size, loadedSrc];
}

/** Hidden-tab backstop for the post-paint frame wait (ms). */
const PAINT_TIMER_FALLBACK_MS = 100;

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
