"use client";

import {
  forwardRef,
  lazy,
  Suspense,
  useCallback,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { ComposerShell } from "./parts/composer-shell";
import { ModeTogglePill } from "./parts/mode-toggle-pill";
import type Konva from "konva";
import { ComposerCamera } from "./parts/composer-camera";
import { ComposerPublishBar } from "./parts/composer-publish-bar";
import { ComposerToolbar } from "./parts/composer-toolbar";
import { DiscardConfirmDialog } from "./parts/discard-confirm-dialog";
import { PublishingProgressOverlay } from "./parts/publishing-progress-overlay";
import { ToolAdjustSliders } from "./parts/tool-adjust-sliders";
import { ToolCropOverlay } from "./parts/tool-crop-overlay";
import {
  ASPECT_RATIO_VALUES,
  fitCropToStage,
  type CropRect,
} from "./parts/tool-crop-overlay";
import { ToolDrawControls } from "./parts/tool-draw-controls";
import { ToolFilterStrip } from "./parts/tool-filter-strip";
import { ToolStickerPicker } from "./parts/tool-sticker-picker";
import { ToolTextInput } from "./parts/tool-text-input";
import { VideoTrimBar } from "./parts/video-trim-bar";
import { useDrawingStroke } from "./hooks/use-drawing-stroke";
import { useHistory } from "./hooks/use-history";
import { useImageUploader } from "./hooks/use-image-uploader";
import { compositeVideo } from "./lib/composite-video";
import { exportPhotoBlob } from "./lib/export-blob";
import { resolveFilterPresets } from "./lib/konva-filters";
import { resolveStickerSets } from "./lib/built-in-stickers";
import {
  DEFAULT_COLOR_PRESETS,
  DEFAULT_FONTS,
} from "./lib/defaults";

// React.lazy defers the react-konva import to client-side render, avoiding
// SSR evaluation of konva's top-level `window` reference. Cannot use
// `next/dynamic` here — registry code can't import from next/*.
const ComposerEditor = lazy(() =>
  import("./parts/composer-editor").then((m) => ({
    default: m.ComposerEditor,
  })),
);
import { useStoryComposerState } from "./hooks/use-story-composer-state";
import {
  type CapturedPhoto,
  type CapturedVideo,
  type UseMediaCaptureResult,
} from "./hooks/use-media-capture";
import {
  DEFAULT_ADJUSTMENTS,
  DEFAULT_STORY_COMPOSER_LABELS,
  type EditTool,
  type DrawingStroke,
  type ImageAdjustments,
  type PlacedSticker,
  type PublishedStory,
  type PublishMetadata,
  type StickerOption,
  type StoryComposer01Handle,
  type StoryComposer01Labels,
  type StoryComposer01Props,
  type TextOverlay,
} from "./types";

interface DraftMedia {
  source: "camera" | "gallery";
  kind: "image" | "video";
  blob: Blob;
  /** Object URL for preview — revoked when draft is replaced or composer closes. */
  url: string;
  width?: number;
  height?: number;
  durationMs?: number;
  mimeType: string;
}

interface TrimRange {
  startSec: number;
  endSec: number;
  durationSec: number;
}

export const StoryComposer01 = forwardRef<
  StoryComposer01Handle,
  StoryComposer01Props
>(function StoryComposer01(
  {
    isOpen,
    onClose,
    defaultMode = "photo",
    hideModes,
    defaultFacing,
    recordAudio = true,
    maxFileSizeMb = 50,
    presentation = "auto",
    editorBackground = "#000",
    confirmOnDiscard = true,
    uploadUrl,
    uploader,
    uploadFields,
    onPublished,
    onPublishError,
    enabledTools = ["text", "draw", "stickers", "filters", "adjust", "crop"],
    filterPresets,
    replaceBuiltinFilters,
    stickers: stickersProp,
    replaceBuiltinStickers,
    cropAspects = ["9:16", "1:1", "4:5"],
    fonts = DEFAULT_FONTS,
    colorPresets = DEFAULT_COLOR_PRESETS,
    labels: labelOverrides,
    onPermissionDenied,
    onValidationError,
  },
  ref,
) {
  const presets = useMemo(
    () => resolveFilterPresets(filterPresets, !!replaceBuiltinFilters),
    [filterPresets, replaceBuiltinFilters],
  );

  const stickerSets = useMemo(
    () => resolveStickerSets(stickersProp, !!replaceBuiltinStickers),
    [stickersProp, replaceBuiltinStickers],
  );

  const stickerById = useMemo(() => {
    const map = new Map<string, StickerOption>();
    for (const set of stickerSets) {
      for (const s of set.stickers) map.set(s.id, s);
    }
    return map;
  }, [stickerSets]);
  const labels = useMemo<Required<StoryComposer01Labels>>(
    () => ({ ...DEFAULT_STORY_COMPOSER_LABELS, ...labelOverrides }),
    [labelOverrides],
  );

  const state = useStoryComposerState({ defaultMode, hideModes });
  const captureRef = useRef<UseMediaCaptureResult | null>(null);
  const [draft, setDraft] = useState<DraftMedia | null>(null);
  const [trim, setTrim] = useState<TrimRange | null>(null);
  const [activeTool, setActiveTool] = useState<EditTool | null>(null);
  const [adjustments, setAdjustments] = useState<ImageAdjustments>(
    DEFAULT_ADJUSTMENTS,
  );
  const [activeFilterId, setActiveFilterId] = useState<string | null>(null);
  const [textOverlays, setTextOverlays] = useState<TextOverlay[]>([]);
  const [selectedTextId, setSelectedTextId] = useState<string | null>(null);
  const [placedStickers, setPlacedStickers] = useState<PlacedSticker[]>([]);
  const [selectedStickerId, setSelectedStickerId] = useState<string | null>(
    null,
  );
  const [drawingStrokes, setDrawingStrokes] = useState<DrawingStroke[]>([]);
  const [drawColor, setDrawColor] = useState("#ffffff");
  const [drawBrushSize, setDrawBrushSize] = useState(8);
  const [drawMode, setDrawMode] = useState<"draw" | "erase">("draw");
  const [cropAspect, setCropAspect] = useState(cropAspects[0] ?? "9:16");
  const [cropRect, setCropRect] = useState<CropRect | null>(null);
  const stageSizeRef = useRef<{ width: number; height: number } | null>(null);
  const stageRef = useRef<Konva.Stage | null>(null);
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);

  const uploader_ = useImageUploader({ uploadUrl, uploader, uploadFields });

  const history = useHistory({ capacity: 50, bindKeyboard: isOpen });

  const activeFilter = useMemo(
    () => presets.find((p) => p.id === activeFilterId) ?? null,
    [presets, activeFilterId],
  );

  // Set draft + revoke prior object URL.
  const acceptDraft = useCallback((next: DraftMedia | null) => {
    setDraft((prev) => {
      if (prev?.url) URL.revokeObjectURL(prev.url);
      return next;
    });
    if (!next || next.kind !== "video") setTrim(null);
    if (!next) {
      setActiveTool(null);
      setAdjustments(DEFAULT_ADJUSTMENTS);
      setActiveFilterId(null);
      setTextOverlays([]);
      setSelectedTextId(null);
      setPlacedStickers([]);
      setSelectedStickerId(null);
      setDrawingStrokes([]);
      setCropRect(null);
      setCropAspect(cropAspects[0] ?? "9:16");
      history.reset();
    }
  }, [cropAspects, history]);

  const performClose = useCallback(() => {
    acceptDraft(null);
    state.reset();
    uploader_.reset();
    onClose();
  }, [acceptDraft, onClose, state, uploader_]);

  // ─── Text-overlay commands (wrapped through history for C10 undo) ─────

  const addTextOverlay = useCallback(
    (initialText?: string) => {
      const id = `text-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      const newOverlay: TextOverlay = {
        id,
        text: initialText ?? labels.textPlaceholder,
        x: 100,
        y: 200,
        rotation: 0,
        scale: 1,
        fontFamily: fonts[0]?.family ?? "sans-serif",
        fontSize: 40,
        fill: "#ffffff",
        align: "center",
      };
      history.execute({
        label: "Add text",
        do: () => setTextOverlays((prev) => [...prev, newOverlay]),
        undo: () =>
          setTextOverlays((prev) => prev.filter((o) => o.id !== id)),
      });
      setSelectedTextId(id);
      state.markDirty(true);
    },
    [fonts, history, labels.textPlaceholder, state],
  );

  const updateTextOverlay = useCallback(
    (next: TextOverlay) => {
      // Capture the previous state once when this terminal action fires.
      let prevOverlay: TextOverlay | undefined;
      setTextOverlays((prev) => {
        prevOverlay = prev.find((o) => o.id === next.id);
        return prev;
      });
      if (!prevOverlay) return;
      const before = prevOverlay;
      history.execute({
        label: "Edit text",
        do: () =>
          setTextOverlays((prev) =>
            prev.map((o) => (o.id === next.id ? next : o)),
          ),
        undo: () =>
          setTextOverlays((prev) =>
            prev.map((o) => (o.id === before.id ? before : o)),
          ),
      });
      state.markDirty(true);
    },
    [history, state],
  );

  const deleteTextOverlay = useCallback(
    (id: string) => {
      let removed: TextOverlay | undefined;
      let index = -1;
      setTextOverlays((prev) => {
        index = prev.findIndex((o) => o.id === id);
        removed = prev[index];
        return prev;
      });
      if (!removed) return;
      const item = removed;
      const at = index;
      history.execute({
        label: "Delete text",
        do: () =>
          setTextOverlays((prev) => prev.filter((o) => o.id !== id)),
        undo: () =>
          setTextOverlays((prev) => {
            const copy = [...prev];
            copy.splice(at, 0, item);
            return copy;
          }),
      });
      setSelectedTextId((prev) => (prev === id ? null : prev));
      state.markDirty(true);
    },
    [history, state],
  );

  // ─── Sticker commands (wrapped through history) ──────────────────────

  const addStickerOverlay = useCallback(
    (sticker: StickerOption) => {
      const id = `sticker-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      const placed: PlacedSticker = {
        id,
        stickerId: sticker.id,
        x: 200,
        y: 300,
        rotation: 0,
        scale: 1,
      };
      history.execute({
        label: "Add sticker",
        do: () => setPlacedStickers((prev) => [...prev, placed]),
        undo: () =>
          setPlacedStickers((prev) => prev.filter((s) => s.id !== id)),
      });
      setSelectedStickerId(id);
      setSelectedTextId(null);
      state.markDirty(true);
    },
    [history, state],
  );

  const updateStickerOverlay = useCallback(
    (next: PlacedSticker) => {
      let prev: PlacedSticker | undefined;
      setPlacedStickers((cur) => {
        prev = cur.find((s) => s.id === next.id);
        return cur;
      });
      if (!prev) return;
      const before = prev;
      history.execute({
        label: "Move sticker",
        do: () =>
          setPlacedStickers((cur) =>
            cur.map((s) => (s.id === next.id ? next : s)),
          ),
        undo: () =>
          setPlacedStickers((cur) =>
            cur.map((s) => (s.id === before.id ? before : s)),
          ),
      });
      state.markDirty(true);
    },
    [history, state],
  );

  // ─── Drawing-stroke command ───────────────────────────────────────────

  const commitDrawingStroke = useCallback(
    (stroke: DrawingStroke) => {
      history.execute({
        label: "Draw stroke",
        do: () => setDrawingStrokes((prev) => [...prev, stroke]),
        undo: () =>
          setDrawingStrokes((prev) => prev.filter((s) => s.id !== stroke.id)),
      });
      state.markDirty(true);
    },
    [history, state],
  );

  const drawing = useDrawingStroke({
    color: drawColor,
    brushSize: drawBrushSize,
    mode: drawMode,
    onStrokeComplete: commitDrawingStroke,
  });

  // ─── Publish flow ────────────────────────────────────────────────────

  const buildMetadata = useCallback(
    (
      mode: "photo" | "video" | "text",
      width: number,
      height: number,
      mimeType: string,
      durationMs?: number,
    ): PublishMetadata => ({
      mode,
      width,
      height,
      mimeType,
      durationMs,
      textOverlays,
      stickers: placedStickers,
      drawingStrokes: drawingStrokes.length,
      appliedFilter: activeFilterId ?? undefined,
      adjustments,
    }),
    [
      activeFilterId,
      adjustments,
      drawingStrokes.length,
      placedStickers,
      textOverlays,
    ],
  );

  const handlePublish = useCallback(async () => {
    if (!draft) return;
    state.setStage("publishing");
    try {
      let blob: Blob;
      let width: number;
      let height: number;
      let mimeType: string;
      let durationMs: number | undefined;

      if (draft.kind === "image") {
        if (!stageRef.current) throw new Error("Editor canvas not ready");
        blob = await exportPhotoBlob({
          stage: stageRef.current,
          cropRect,
          mimeType: "image/jpeg",
          quality: 0.92,
        });
        width = cropRect?.width ?? stageRef.current.width();
        height = cropRect?.height ?? stageRef.current.height();
        mimeType = "image/jpeg";
      } else {
        // Video draft — Q-P1a bake-in.
        // The stage-snapshot-over-video baking pipeline is wired here; for
        // a no-overlay/no-trim draft we still re-encode for consistency.
        const stage = stageRef.current;
        const ow = cropRect?.width ?? draft.width ?? 720;
        const oh = cropRect?.height ?? draft.height ?? 1280;
        const result = await compositeVideo({
          sourceBlob: draft.blob,
          outputWidth: Math.round(ow),
          outputHeight: Math.round(oh),
          renderFrame: (ctx, video) => {
            ctx.clearRect(0, 0, ow, oh);
            // Draw video frame (cover-fit into output rect).
            const vw = video.videoWidth || ow;
            const vh = video.videoHeight || oh;
            const scale = Math.max(ow / vw, oh / vh);
            const dw = vw * scale;
            const dh = vh * scale;
            ctx.drawImage(
              video,
              (ow - dw) / 2,
              (oh - dh) / 2,
              dw,
              dh,
            );
            // Snapshot overlay layers (text + sticker + drawing) from the
            // Konva stage and paint on top.
            if (stage) {
              const overlayCanvas = stage.toCanvas({
                x: cropRect?.x ?? 0,
                y: cropRect?.y ?? 0,
                width: cropRect?.width ?? stage.width(),
                height: cropRect?.height ?? stage.height(),
                pixelRatio: 1,
              });
              ctx.drawImage(overlayCanvas, 0, 0, ow, oh);
            }
          },
        });
        blob = result.blob;
        mimeType = result.mimeType;
        durationMs = result.durationMs;
        width = Math.round(ow);
        height = Math.round(oh);
      }

      const metadata = buildMetadata(
        draft.kind === "image" ? "photo" : "video",
        width,
        height,
        mimeType,
        durationMs,
      );
      const result = await uploader_.upload(blob, metadata);

      const story: PublishedStory = {
        id: `story-${Date.now()}`,
        createdAt: new Date().toISOString(),
        items: [
          {
            id: `item-${Date.now()}`,
            type: draft.kind,
            src: result.url,
            duration:
              draft.kind === "video"
                ? Math.round((durationMs ?? 0) / 1000) || undefined
                : undefined,
            thumbnailUrl: result.thumbnailUrl,
          },
        ],
      };
      state.setStage("done");
      onPublished(story);
      // Auto-close on success after a short success-state beat.
      setTimeout(() => {
        performClose();
      }, 800);
    } catch (err) {
      state.setStage("error");
      const e = err as Error;
      if (onPublishError) onPublishError(e);
    }
  }, [
    buildMetadata,
    cropRect,
    draft,
    onPublishError,
    onPublished,
    performClose,
    state,
    uploader_,
  ]);

  const handlePhoto = useCallback(
    (photo: CapturedPhoto) => {
      const url = URL.createObjectURL(photo.blob);
      acceptDraft({
        source: "camera",
        kind: "image",
        blob: photo.blob,
        url,
        width: photo.width,
        height: photo.height,
        mimeType: photo.mimeType,
      });
      // Transition to edit stage — actual editor surface lands C6.
      state.setStage("edit");
      state.markDirty(true);
    },
    [acceptDraft, state],
  );

  const handleVideo = useCallback(
    (video: CapturedVideo) => {
      const url = URL.createObjectURL(video.blob);
      acceptDraft({
        source: "camera",
        kind: "video",
        blob: video.blob,
        url,
        durationMs: video.durationMs,
        mimeType: video.mimeType,
      });
      state.setStage("edit");
      state.markDirty(true);
    },
    [acceptDraft, state],
  );

  const handleGalleryFile = useCallback(
    (file: File) => {
      const kind: "image" | "video" = file.type.startsWith("video/")
        ? "video"
        : "image";
      const url = URL.createObjectURL(file);
      acceptDraft({
        source: "gallery",
        kind,
        blob: file,
        url,
        mimeType: file.type,
      });
      state.setStage("edit");
      state.markDirty(true);
    },
    [acceptDraft, state],
  );

  const handleOpenChange = useCallback(
    (next: boolean) => {
      if (next) return;
      // Guard the close path when the editor is dirty (Q-P10a).
      if (confirmOnDiscard && state.isDirty && state.stage !== "publishing") {
        setShowDiscardConfirm(true);
        return;
      }
      performClose();
    },
    [confirmOnDiscard, performClose, state.isDirty, state.stage],
  );

  useImperativeHandle(
    ref,
    () => {
      const noop = () => {
        /* no-op for compat */
      };
      return {
        open: () => {
          /* host owns isOpen */
        },
        close: () => onClose(),
        reset: () => {
          acceptDraft(null);
          state.reset();
        },
        switchCamera: async () => {
          await captureRef.current?.switchCamera();
        },
        takePhoto: async () => {
          const photo = await captureRef.current?.takePhoto();
          if (photo) handlePhoto(photo);
        },
        startRecording: async () => {
          await captureRef.current?.startRecording();
        },
        stopRecording: async () => {
          const video = await captureRef.current?.stopRecording();
          if (video) handleVideo(video);
        },
        importFromGallery: noop,
        addText: (text?: string) => addTextOverlay(text),
        addSticker: (sticker) => addStickerOverlay(sticker),
        setAdjustments: (partial) =>
          setAdjustments((prev) => ({ ...prev, ...partial })),
        applyFilter: (name) => setActiveFilterId(name),
        publish: handlePublish,
        exportBlob: async () => {
          if (!draft) throw new Error("No draft to export");
          if (draft.kind === "image") {
            if (!stageRef.current) throw new Error("Editor not ready");
            const blob = await exportPhotoBlob({
              stage: stageRef.current,
              cropRect,
            });
            return {
              blob,
              metadata: buildMetadata(
                "photo",
                cropRect?.width ?? stageRef.current.width(),
                cropRect?.height ?? stageRef.current.height(),
                "image/jpeg",
              ),
            };
          }
          return {
            blob: draft.blob,
            metadata: buildMetadata(
              "video",
              draft.width ?? 720,
              draft.height ?? 1280,
              draft.mimeType,
              draft.durationMs,
            ),
          };
        },
      };
    },
    [
      acceptDraft,
      addStickerOverlay,
      addTextOverlay,
      buildMetadata,
      cropRect,
      draft,
      handlePhoto,
      handlePublish,
      handleVideo,
      onClose,
      state,
    ],
  );

  const selectedText = useMemo(
    () => textOverlays.find((o) => o.id === selectedTextId) ?? null,
    [textOverlays, selectedTextId],
  );

  // Toggling tools: Text auto-adds an overlay if none selected; non-text
  // tools clear text selection. Crop seeds a centered max-fit rect on open.
  const handleToolSelect = useCallback(
    (tool: EditTool | null) => {
      setActiveTool(tool);
      if (tool === "text" && !selectedText) {
        addTextOverlay();
      }
      if (tool !== "text") {
        setSelectedTextId(null);
      }
      if (tool !== "stickers") {
        setSelectedStickerId(null);
      }
      if (tool === "crop" && !cropRect && stageSizeRef.current) {
        const ss = stageSizeRef.current;
        setCropRect(fitCropToStage(cropAspect, ss.width, ss.height));
      }
    },
    [addTextOverlay, cropAspect, cropRect, selectedText],
  );

  const handleCropAspectChange = useCallback(
    (next: typeof cropAspect) => {
      setCropAspect(next);
      const ss = stageSizeRef.current;
      if (ss) setCropRect(fitCropToStage(next, ss.width, ss.height));
    },
    [],
  );

  const captureActive = state.stage === "capture" && state.mode !== "text";

  return (
    <ComposerShell
      isOpen={isOpen}
      onOpenChange={handleOpenChange}
      presentation={presentation}
      background={editorBackground}
      ariaLabel={labels.composerLabel}
    >
      {/* Top bar — capture stage shows close + mode pill; edit stage shows publish bar. */}
      {state.stage === "capture" ? (
        <div className="absolute top-[max(0.75rem,env(safe-area-inset-top))] left-3 right-3 z-30 flex items-center justify-between">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleOpenChange(false)}
            aria-label={labels.close}
            className="text-white hover:bg-white/10 hover:text-white"
          >
            <X className="size-5" />
          </Button>
          <ModeTogglePill
            mode={state.mode}
            visibleModes={state.visibleModes}
            labels={labels}
            onModeChange={state.setMode}
          />
          <div className="size-9" aria-hidden />
        </div>
      ) : (
        <ComposerPublishBar
          isPublishing={state.stage === "publishing"}
          canPublish={!!draft}
          labels={labels}
          onPublish={handlePublish}
          onClose={() => handleOpenChange(false)}
        />
      )}

      {/* Capture surface (camera + gallery picker) */}
      {captureActive ? (
        <ComposerCamera
          enabled={isOpen && captureActive}
          mode={state.mode}
          defaultFacing={defaultFacing}
          recordAudio={recordAudio}
          maxFileSizeMb={maxFileSizeMb}
          maxVideoDurationSec={30}
          labels={labels}
          onPhoto={handlePhoto}
          onVideo={handleVideo}
          onGalleryFile={handleGalleryFile}
          onValidationError={onValidationError}
          onPermissionDenied={onPermissionDenied}
        />
      ) : null}

      {/* Text-only mode placeholder (lands C13) */}
      {state.stage === "capture" && state.mode === "text" ? (
        <div className="flex-1 flex items-center justify-center text-white/50 text-xs">
          Text mode · capture surface lands C13
        </div>
      ) : null}

      {/* Edit-stage — Konva canvas (image) + native video preview + trim bar */}
      {state.stage === "edit" && draft ? (
        <div className="flex-1 relative bg-black flex flex-col">
          <div className="flex-1 relative">
            {/* For video drafts we need a measurable size to initialize trim. */}
            {draft.kind === "video" ? (
              <video
                src={draft.url}
                autoPlay
                loop
                muted
                playsInline
                onLoadedMetadata={(e) => {
                  const v = e.currentTarget;
                  if (
                    !trim &&
                    Number.isFinite(v.duration) &&
                    v.duration > 0
                  ) {
                    setTrim({
                      startSec: 0,
                      endSec: v.duration,
                      durationSec: v.duration,
                    });
                  }
                }}
                className="absolute inset-0 w-full h-full object-contain"
              />
            ) : (
              <Suspense fallback={<div className="absolute inset-0 bg-black" />}>
                <ComposerEditor
                  imageUrl={draft.url}
                  background={editorBackground}
                  adjustments={adjustments}
                  activeFilter={activeFilter}
                  textOverlays={textOverlays}
                  selectedTextId={selectedTextId}
                  onTextChange={updateTextOverlay}
                  onTextSelect={(id) => {
                    setSelectedTextId(id);
                    if (id) {
                      setActiveTool("text");
                      setSelectedStickerId(null);
                    }
                  }}
                  stickers={placedStickers}
                  resolveSticker={(id) => stickerById.get(id)}
                  selectedStickerId={selectedStickerId}
                  onStickerChange={updateStickerOverlay}
                  onStickerSelect={(id) => {
                    setSelectedStickerId(id);
                    if (id) {
                      setActiveTool("stickers");
                      setSelectedTextId(null);
                    }
                  }}
                  drawingStrokes={drawingStrokes}
                  currentDrawingStroke={drawing.currentStroke}
                  isDrawing={activeTool === "draw"}
                  onDrawBegin={drawing.beginAt}
                  onDrawExtend={drawing.extendTo}
                  onDrawEnd={drawing.end}
                  cropRect={cropRect}
                  cropActive={activeTool === "crop"}
                  cropAspectRatio={ASPECT_RATIO_VALUES[cropAspect]}
                  onCropChange={setCropRect}
                  onStageSize={(size) => {
                    stageSizeRef.current = size;
                    // First-frame init if user opened crop before size was known.
                    if (activeTool === "crop" && !cropRect) {
                      setCropRect(
                        fitCropToStage(cropAspect, size.width, size.height),
                      );
                    }
                  }}
                  onStageReady={(s) => {
                    stageRef.current = s;
                  }}
                />
              </Suspense>
            )}
          </div>
          {/* Active tool panel — all six tools */}
          {draft.kind === "image" && activeTool === "crop" ? (
            <div
              className="shrink-0 px-3 pt-2"
              style={{ paddingBottom: "0.5rem" }}
            >
              <ToolCropOverlay
                activeAspect={cropAspect}
                availableAspects={cropAspects}
                labels={labels}
                onAspectChange={handleCropAspectChange}
              />
            </div>
          ) : null}
          {draft.kind === "image" && activeTool === "draw" ? (
            <div
              className="shrink-0 px-3 pt-2"
              style={{ paddingBottom: "0.5rem" }}
            >
              <ToolDrawControls
                color={drawColor}
                brushSize={drawBrushSize}
                mode={drawMode}
                colorPresets={colorPresets}
                labels={labels}
                onColorChange={setDrawColor}
                onBrushSizeChange={setDrawBrushSize}
                onModeChange={setDrawMode}
              />
            </div>
          ) : null}
          {draft.kind === "image" && activeTool === "stickers" ? (
            <div
              className="shrink-0 px-3 pt-2"
              style={{ paddingBottom: "0.5rem" }}
            >
              <ToolStickerPicker
                sets={stickerSets}
                onPick={addStickerOverlay}
              />
            </div>
          ) : null}
          {draft.kind === "image" && activeTool === "text" && selectedText ? (
            <div
              className="shrink-0 px-3 pt-2"
              style={{ paddingBottom: "0.5rem" }}
            >
              <ToolTextInput
                overlay={selectedText}
                fonts={fonts}
                colorPresets={colorPresets}
                labels={labels}
                onChange={updateTextOverlay}
                onDelete={() => deleteTextOverlay(selectedText.id)}
              />
            </div>
          ) : null}
          {draft.kind === "image" && activeTool === "filters" ? (
            <div
              className="shrink-0 px-3 pt-2"
              style={{ paddingBottom: "0.5rem" }}
            >
              <ToolFilterStrip
                presets={presets}
                sourceUrl={draft.url}
                activeId={activeFilterId}
                onSelect={setActiveFilterId}
              />
            </div>
          ) : null}
          {draft.kind === "image" && activeTool === "adjust" ? (
            <div
              className="shrink-0 px-3 pt-2"
              style={{ paddingBottom: "0.5rem" }}
            >
              <ToolAdjustSliders
                value={adjustments}
                onChange={setAdjustments}
                labels={labels}
              />
            </div>
          ) : null}

          {/* Trim bar — video only */}
          {draft.kind === "video" && trim ? (
            <div
              className="shrink-0 px-4 pt-3"
              style={{
                paddingBottom: "max(1rem, env(safe-area-inset-bottom))",
              }}
            >
              <VideoTrimBar
                videoUrl={draft.url}
                startSec={trim.startSec}
                endSec={trim.endSec}
                durationSec={trim.durationSec}
                labels={labels}
                onChange={(next) =>
                  setTrim((prev) => (prev ? { ...prev, ...next } : prev))
                }
              />
            </div>
          ) : null}

          {/* Bottom toolbar — image drafts only (video trim has its own surface) */}
          {draft.kind === "image" ? (
            <div
              className="shrink-0 px-3 pt-1"
              style={{
                paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))",
              }}
            >
              <ComposerToolbar
                activeTool={activeTool}
                enabledTools={enabledTools}
                pendingTools={[]}
                labels={labels}
                onSelect={handleToolSelect}
              />
            </div>
          ) : null}
        </div>
      ) : null}

      {/* Publishing / success / error overlay */}
      {(state.stage === "publishing" ||
        state.stage === "done" ||
        state.stage === "error") &&
      draft ? (
        <PublishingProgressOverlay
          progress={
            uploader_.status === "uploading" ? uploader_.progress : null
          }
          status={
            state.stage === "done"
              ? "done"
              : state.stage === "error"
                ? "error"
                : "uploading"
          }
          errorMessage={uploader_.error?.message}
          labels={labels}
          onRetry={
            state.stage === "error"
              ? () => {
                  state.setStage("edit");
                  void handlePublish();
                }
              : undefined
          }
          onCancel={
            state.stage === "publishing"
              ? () => {
                  uploader_.cancel();
                  state.setStage("edit");
                }
              : undefined
          }
        />
      ) : null}

      {/* Discard-confirm guard (Q-P10a) */}
      <DiscardConfirmDialog
        open={showDiscardConfirm}
        labels={labels}
        onCancel={() => setShowDiscardConfirm(false)}
        onConfirm={() => {
          setShowDiscardConfirm(false);
          performClose();
        }}
      />
    </ComposerShell>
  );
});
