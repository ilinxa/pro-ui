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
import { ComposerCamera } from "./parts/composer-camera";
import { ComposerToolbar } from "./parts/composer-toolbar";
import { ToolAdjustSliders } from "./parts/tool-adjust-sliders";
import { ToolFilterStrip } from "./parts/tool-filter-strip";
import { ToolStickerPicker } from "./parts/tool-sticker-picker";
import { ToolTextInput } from "./parts/tool-text-input";
import { VideoTrimBar } from "./parts/video-trim-bar";
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
  type ImageAdjustments,
  type PlacedSticker,
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
    enabledTools = ["text", "draw", "stickers", "filters", "adjust", "crop"],
    filterPresets,
    replaceBuiltinFilters,
    stickers: stickersProp,
    replaceBuiltinStickers,
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
    }
  }, []);

  // ─── Text-overlay commands (designed so C10 can wrap into history) ────

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
      setTextOverlays((prev) => [...prev, newOverlay]);
      setSelectedTextId(id);
      state.markDirty(true);
    },
    [fonts, labels.textPlaceholder, state],
  );

  const updateTextOverlay = useCallback(
    (next: TextOverlay) => {
      setTextOverlays((prev) =>
        prev.map((o) => (o.id === next.id ? next : o)),
      );
      state.markDirty(true);
    },
    [state],
  );

  const deleteTextOverlay = useCallback(
    (id: string) => {
      setTextOverlays((prev) => prev.filter((o) => o.id !== id));
      setSelectedTextId((prev) => (prev === id ? null : prev));
      state.markDirty(true);
    },
    [state],
  );

  // ─── Sticker commands ─────────────────────────────────────────────────

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
      setPlacedStickers((prev) => [...prev, placed]);
      setSelectedStickerId(id);
      setSelectedTextId(null);
      state.markDirty(true);
    },
    [state],
  );

  const updateStickerOverlay = useCallback(
    (next: PlacedSticker) => {
      setPlacedStickers((prev) =>
        prev.map((s) => (s.id === next.id ? next : s)),
      );
      state.markDirty(true);
    },
    [state],
  );

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
      if (!next) {
        acceptDraft(null);
        state.reset();
        onClose();
      }
    },
    [acceptDraft, onClose, state],
  );

  useImperativeHandle(
    ref,
    () => {
      const notReady = () =>
        Promise.reject(new Error("story-composer-01: feature lands later"));
      const noop = () => {
        throw new Error("story-composer-01: feature lands later");
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
        publish: notReady,
        exportBlob: () =>
          Promise.reject(
            new Error("story-composer-01: feature lands later"),
          ),
      };
    },
    [
      acceptDraft,
      addStickerOverlay,
      addTextOverlay,
      handlePhoto,
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
  // tools clear text selection. Stickers keeps the picker open.
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
    },
    [addTextOverlay, selectedText],
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
      {/* Top bar — close + mode pill + reserved publish-CTA slot */}
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
                />
              </Suspense>
            )}
          </div>
          {/* Active tool panel (text / stickers / filters / adjust — draw/crop land C10-C11) */}
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
                pendingTools={["draw", "crop"]}
                labels={labels}
                onSelect={handleToolSelect}
              />
            </div>
          ) : null}
        </div>
      ) : null}
    </ComposerShell>
  );
});
