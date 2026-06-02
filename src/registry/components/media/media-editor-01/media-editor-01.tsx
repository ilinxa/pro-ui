"use client";

import * as React from "react";
import type Konva from "konva";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { useMediaEditorState } from "./hooks/use-media-editor-state";
import { useMultiInstanceGuard } from "./hooks/use-multi-instance-guard";
import { resolvePresentation } from "./lib/presentation-resolver";
import { dialogSizeForAspect } from "./lib/dialog-size-for-aspect";
import { resolveCropAspects } from "./lib/resolve-crop-aspects";
import { loadInitialSource } from "./lib/initial-source-loader";
import { exportPhotoBlob } from "./lib/export-blob";
import { compositeVideo } from "./lib/composite-video";
import { EditorCamera } from "./parts/editor-camera";
import { EditorCanvas } from "./parts/editor-canvas";
import type {
  ComposerMode,
  EditTool,
  ExportImageOpts,
  ExportMetadata,
  ExportOpts,
  ExportVideoOpts,
  ImageAdjustments,
  MediaEditor01Handle,
  MediaEditor01Props,
  MediaEditorState,
  SourceError,
  StickerOption,
  StoryComposer01Labels,
} from "./types";
import type {
  CapturedPhoto,
  CapturedVideo,
} from "./hooks/use-media-capture";

/**
 * media-editor-01 — black-box orchestrator (C6 skeleton).
 *
 * Grows progressively:
 *   - C6  (this commit) — root + state machine + ref handle wired with stubs
 *   - C7              — presentation (inline / dialog / auto) + isOpen guard
 *   - C8              — capability gating (enabledModes/Tools/Sources/aspect)
 *   - C9              — initialSource intake + validation
 *   - C10             — ExportOpts + onProgress + perf-shortcut
 *   - C11             — multi-instance guard + empty-state footgun
 *   - C12             — demo tabs + dummy-data + popover wiring
 *
 * C6 ships a placeholder layout (centered card mounting nothing real). The
 * actual editor surface (EditorCamera + EditorCanvas + EditorToolbar) wires
 * up incrementally in C7-C9.
 */

const NOT_IMPLEMENTED_MARKER = "media-editor-01: C6 skeleton — implementation lands in C7-C12.";

// English fallback for the v0.1.5-shaped StoryComposer01Labels that several
// part files (EditorCamera, EditorToolbar, DiscardConfirmDialog, etc.) still
// require until the C17 refactor moves them onto MediaEditor01Labels.
// Module-scoped; not exported via the barrel. Consumers override individual
// strings via the `labels` prop (mapped through DEFAULT_LABELS).
const INTERNAL_LABELS_FALLBACK: Required<StoryComposer01Labels> = {
  composerLabel: "Media editor",
  composerDescription: "Capture a photo, record a video, or compose text-only content.",
  modePhoto: "Photo",
  modeVideo: "Video",
  modeText: "Text",
  shutterPhoto: "Take photo",
  shutterVideoStart: "Start recording",
  shutterVideoStop: "Stop recording",
  galleryPicker: "Choose from gallery",
  switchCamera: "Switch camera",
  permissionDeniedTitle: "Camera access blocked",
  permissionDeniedBody:
    "We need camera permission to capture media. Enable it in your browser settings, or pick a file from your gallery.",
  permissionRetry: "Try again",
  permissionUsePicker: "Use gallery instead",
  permissionRequesting: "Requesting camera…",
  toolText: "Text",
  toolDraw: "Draw",
  toolStickers: "Stickers",
  toolFilters: "Filters",
  toolAdjust: "Adjust",
  toolCrop: "Crop",
  adjustBrightness: "Brightness",
  adjustContrast: "Contrast",
  adjustSaturation: "Saturation",
  adjustBlur: "Blur",
  drawColor: "Color",
  drawBrush: "Brush size",
  drawEraser: "Eraser",
  drawUndo: "Undo",
  drawRedo: "Redo",
  textPlaceholder: "Type something…",
  textFontFamily: "Font",
  textFontSize: "Size",
  textAlign: "Align",
  publish: "Publish",
  publishing: "Publishing…",
  published: "Published",
  close: "Close",
  discardConfirmTitle: "Discard?",
  discardConfirmBody: "You'll lose your captured media and edits.",
  discardConfirm: "Discard",
  discardCancel: "Keep editing",
  uploadFailedTitle: "Upload failed",
  uploadRetry: "Retry",
  recordingLabel: "Recording",
  trimStart: "Trim start",
  trimEnd: "Trim end",
};

function devWarnOnce(memo: Set<string>, key: string, message: string) {
  if (process.env.NODE_ENV === "production") return;
  if (memo.has(key)) return;
  memo.add(key);
  console.warn(message);
}

export const MediaEditor01 = React.forwardRef<
  MediaEditor01Handle,
  MediaEditor01Props
>(function MediaEditor01(props, ref) {
  const { defaultMode } = props;

  const editor = useMediaEditorState({
    defaultMode,
    onDirtyChange: props.onDirtyChange,
  });

  const warnedRef = React.useRef<Set<string>>(new Set());

  // ─── Capability defaults (description §8 — Q-P-locked) ─────────────

  const enabledModes = props.enabledModes ?? (["photo", "video", "text"] as const);
  const enabledTools =
    props.enabledTools ??
    (["text", "draw", "stickers", "filters", "adjust", "crop"] as const);
  const mediaSources = props.mediaSources ?? (["camera", "upload"] as const);
  const aspect = props.aspect ?? "free";

  // Crop aspects derivation per description §4.
  const resolvedCropAspects = React.useMemo(
    () => resolveCropAspects(aspect, props.cropAspects),
    [aspect, props.cropAspects],
  );

  // Mode pill is hidden when ≤1 mode enabled (per description §1).
  const showModePill = enabledModes.length >= 2;

  // ─── Initial source intake (description §5) ─────────────────────────
  // When `initialSource` is set, fetch + validate, then land directly in
  // the edit stage with mode + image/video pre-loaded. On error, surface
  // via onInitialSourceError + sit in an empty state (no auto-fallback to
  // capture — the consumer asked for a specific source and got an error).

  const [sourceError, setSourceError] =
    React.useState<SourceError | null>(null);

  const onInitialSourceErrorRef = React.useRef(props.onInitialSourceError);
  React.useEffect(() => {
    onInitialSourceErrorRef.current = props.onInitialSourceError;
  });

  // Snapshot enabledModes into a ref so the load effect doesn't re-fire on
  // array identity churn. enabledModes is read by the loader at the moment
  // the source changes; subsequent toggles of enabledModes don't retrigger
  // a re-fetch (which would be surprising — and slow on URL sources).
  const enabledModesRef = React.useRef<readonly ComposerMode[]>(enabledModes);
  React.useEffect(() => {
    enabledModesRef.current = enabledModes;
  });

  React.useEffect(() => {
    const source = props.initialSource;
    if (!source) {
      setSourceError(null);
      return;
    }

    let cancelled = false;
    let allocatedUrl: string | null = null;

    (async () => {
      const result = await loadInitialSource(source, enabledModesRef.current);
      if (cancelled) {
        if (result.ok) URL.revokeObjectURL(result.loaded.objectUrl);
        return;
      }
      if (!result.ok) {
        setSourceError(result.error);
        onInitialSourceErrorRef.current?.(result.error);
        return;
      }
      allocatedUrl = result.loaded.objectUrl;
      setSourceError(null);
      editor.setMode(result.loaded.mode);
      if (result.loaded.mode === "photo") {
        editor.setImageSrc(result.loaded.objectUrl);
      } else {
        editor.setVideoBlob(result.loaded.blob);
      }
      // Also register as a draft so the canvas mounts via the unified
      // draft path. Lifetime of the URL is governed by the cleanup below
      // (which revokes on cancel/unmount), so we don't double-revoke.
      editor.setDraft({
        source: "initial",
        kind: result.loaded.mode === "photo" ? "image" : "video",
        blob: result.loaded.blob,
        url: result.loaded.objectUrl,
        mimeType: result.loaded.blob.type,
      });
      editor.setStage("edit");
    })();

    return () => {
      cancelled = true;
      if (allocatedUrl) URL.revokeObjectURL(allocatedUrl);
    };
    // editor methods are stable refs from the hook; only `initialSource`
    // identity drives this effect. enabledModes is read via ref above so
    // a tools-dial toggle doesn't refetch a URL source mid-edit.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.initialSource]);

  // Camera surface: show if camera intake allowed AND at least one capture mode
  // is enabled; otherwise fall back to upload-only dropzone affordance.
  const hasCaptureMode = enabledModes.some(
    (m) => m === "photo" || m === "video",
  );
  const cameraIntakeAvailable =
    mediaSources.includes("camera") && hasCaptureMode;

  // ─── Konva stage handle (C10 export wiring) ─────────────────────────
  // EditorCanvas surfaces its Konva.Stage via onStageReady. The handle's
  // export methods read this ref to snapshot the canvas at publish time.
  const stageRef = React.useRef<Konva.Stage | null>(null);

  // Derive a stable object URL from the loaded video blob so EditorCanvas
  // can play it. Allocated lazily and revoked when the blob identity
  // changes or the component unmounts.
  const videoBlob = editor.state.videoBlob;
  const [videoUrl, setVideoUrl] = React.useState<string | null>(null);
  React.useEffect(() => {
    if (!videoBlob) {
      setVideoUrl(null);
      return;
    }
    const url = URL.createObjectURL(videoBlob);
    setVideoUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [videoBlob]);

  // Edit canvas is mounted whenever we have a loaded source. Source can land
  // via initialSource (sets imageSrc/videoBlob + draft) OR camera capture
  // (sets draft only) OR gallery pick (sets draft only). The unified read
  // is `editor.draft`.
  const hasLoadedSource =
    editor.draft !== null ||
    editor.state.imageSrc !== null ||
    editor.state.videoBlob !== null;
  const showEditCanvas =
    !sourceError && editor.state.stage === "edit" && hasLoadedSource;

  // ─── R2: Capture flow handlers ─────────────────────────────────────
  // Camera + gallery callbacks promote captured media to a draft and
  // transition to the edit stage. EditorCanvas takes over from there.

  const handlePhoto = React.useCallback(
    (photo: CapturedPhoto) => {
      const url = URL.createObjectURL(photo.blob);
      editor.setDraft({
        source: "camera",
        kind: "image",
        blob: photo.blob,
        url,
        width: photo.width,
        height: photo.height,
        mimeType: photo.mimeType,
      });
      editor.setMode("photo");
      editor.setImageSrc(url);
      editor.setStage("edit");
    },
    [editor],
  );

  const handleVideo = React.useCallback(
    (video: CapturedVideo) => {
      const url = URL.createObjectURL(video.blob);
      editor.setDraft({
        source: "camera",
        kind: "video",
        blob: video.blob,
        url,
        durationMs: video.durationMs,
        mimeType: video.mimeType,
      });
      editor.setMode("video");
      editor.setVideoBlob(video.blob);
      editor.setStage("edit");
    },
    [editor],
  );

  const handleGalleryFile = React.useCallback(
    (file: File) => {
      const kind: "image" | "video" = file.type.startsWith("video/")
        ? "video"
        : "image";
      const url = URL.createObjectURL(file);
      editor.setDraft({
        source: "gallery",
        kind,
        blob: file,
        url,
        mimeType: file.type,
      });
      editor.setMode(kind === "image" ? "photo" : "video");
      if (kind === "image") {
        editor.setImageSrc(url);
      } else {
        editor.setVideoBlob(file);
      }
      editor.setStage("edit");
    },
    [editor],
  );

  const mergedLabels: Required<StoryComposer01Labels> = React.useMemo(() => {
    // The MediaEditor01Labels → StoryComposer01Labels mapping is C17 work.
    // Until then, only string overrides at the keys that overlap with the
    // flat shim flow through (e.g., `composerLabel`); everything else
    // falls back to the English defaults.
    const overrides = (props.labels ?? {}) as Partial<StoryComposer01Labels>;
    return { ...INTERNAL_LABELS_FALLBACK, ...overrides };
  }, [props.labels]);

  // Capture surface is mounted when the editor is in capture stage AND the
  // current mode is photo/video AND camera intake is allowed.
  const showCameraSurface =
    editor.state.stage === "capture" &&
    cameraIntakeAvailable &&
    (editor.state.mode === "photo" || editor.state.mode === "video");

  // Auto-seed the active mode in capture stage so the camera knows what to
  // do. Picks the first enabled capture-mode if none is set yet.
  React.useEffect(() => {
    if (editor.state.mode !== null) return;
    if (editor.state.stage !== "capture") return;
    const firstCaptureMode = enabledModes.find(
      (m) => m === "photo" || m === "video",
    );
    if (firstCaptureMode) {
      editor.setMode(firstCaptureMode);
    }
    // editor.setMode is stable per hook contract; mode/stage/modes drive it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editor.state.mode, editor.state.stage, enabledModes]);

  // ─── Multi-instance guard (C11 — Q-P5 (b)) ──────────────────────────
  // Only engage the counter for capture-enabled instances. Edit-only
  // instances have no camera contention so they're unconditionally fine.
  useMultiInstanceGuard(cameraIntakeAvailable);

  // ─── Empty-state footgun guard (C11 — description §1) ────────────────
  // `enabledModes: []` AND no `initialSource` AND no current source loaded
  // → editor has nothing to capture and nothing to edit. Render the
  // renderEmpty slot output (or a default "No source provided" surface)
  // and dev-warn the misconfiguration.
  const isEmptyConfig =
    enabledModes.length === 0 &&
    props.initialSource === undefined &&
    !hasLoadedSource;

  React.useEffect(() => {
    if (!isEmptyConfig) return;
    if (process.env.NODE_ENV === "production") return;
    devWarnOnce(
      warnedRef.current,
      "empty-config",
      "media-editor-01: enabledModes=[] AND no initialSource — editor has nothing to capture or edit. Provide an initialSource or enable at least one capture mode.",
    );
  }, [isEmptyConfig]);

  // ─── Presentation resolution (description §6) ───────────────────────

  const resolved = resolvePresentation(props.presentation, enabledModes);

  // Dev-only required-prop guard: dialog mode needs isOpen + onClose.
  React.useEffect(() => {
    if (process.env.NODE_ENV === "production") return;
    if (resolved !== "dialog") return;
    if (props.isOpen === undefined || props.onClose === undefined) {
      devWarnOnce(
        warnedRef.current,
        "dialog-requires-isOpen-onClose",
        "media-editor-01: presentation='dialog' requires isOpen + onClose props. Falling back to uncontrolled-open behaviour for now.",
      );
    }
  }, [resolved, props.isOpen, props.onClose]);

  // ─── Export implementations (C10) ───────────────────────────────────
  // Factored out of the handle factory so the polymorphic export() can
  // dispatch by mode without a `this`-binding gotcha.

  const exportImage = React.useCallback(
    async (opts?: ExportImageOpts) => {
      const stage = stageRef.current;
      if (!stage) throw new Error("media-editor-01: editor canvas not ready");
      const format = opts?.format ?? "image/jpeg";
      const quality = opts?.quality ?? 0.9;
      const pixelRatio = opts?.pixelRatio ?? 2;
      const cropRect = editor.state.crop;
      const blob = await exportPhotoBlob({
        stage,
        cropRect,
        mimeType: format,
        quality,
        pixelRatio,
        onProgress: opts?.onProgress,
      });
      const width = cropRect?.width ?? stage.width();
      const height = cropRect?.height ?? stage.height();
      return {
        blob,
        metadata: buildExportMetadata(
          editor.state,
          "photo",
          width,
          height,
          format,
        ),
      };
    },
    [editor.state],
  );

  const exportVideo = React.useCallback(
    async (opts?: ExportVideoOpts) => {
      const videoBlob = editor.state.videoBlob;
      if (!videoBlob) {
        throw new Error("media-editor-01: no video blob loaded");
      }
      // Perf-shortcut: no overlays AND no crop → return the raw blob.
      // Skips the expensive MediaRecorder re-encode for the
      // "captured then immediately published" path (chat / DM flows).
      const shortcut = !hasAnyOverlay(editor.state) && !editor.state.crop;
      if (shortcut) {
        opts?.onProgress?.(0);
        opts?.onProgress?.(1);
        return {
          blob: videoBlob,
          metadata: buildExportMetadata(
            editor.state,
            "video",
            editor.state.crop?.width ?? 720,
            editor.state.crop?.height ?? 1280,
            videoBlob.type || "video/webm",
          ),
        };
      }
      // Full re-encode path: bake Konva overlays into each video frame.
      const stage = stageRef.current;
      const cropRect = editor.state.crop;
      const ow = cropRect?.width ?? stage?.width() ?? 720;
      const oh = cropRect?.height ?? stage?.height() ?? 1280;
      const result = await compositeVideo({
        sourceBlob: videoBlob,
        outputWidth: Math.round(ow),
        outputHeight: Math.round(oh),
        mimeType: opts?.mimeType,
        bitsPerSecond: opts?.bitsPerSecond,
        onProgress: opts?.onProgress,
        renderFrame: (ctx, video) => {
          ctx.clearRect(0, 0, ow, oh);
          const vw = video.videoWidth || ow;
          const vh = video.videoHeight || oh;
          const scale = Math.max(ow / vw, oh / vh);
          const dw = vw * scale;
          const dh = vh * scale;
          ctx.drawImage(video, (ow - dw) / 2, (oh - dh) / 2, dw, dh);
          if (stage) {
            const overlay = stage.toCanvas({
              x: cropRect?.x ?? 0,
              y: cropRect?.y ?? 0,
              width: cropRect?.width ?? stage.width(),
              height: cropRect?.height ?? stage.height(),
              pixelRatio: 1,
            });
            ctx.drawImage(overlay, 0, 0, ow, oh);
          }
        },
      });
      return {
        blob: result.blob,
        metadata: buildExportMetadata(
          editor.state,
          "video",
          Math.round(ow),
          Math.round(oh),
          result.mimeType,
          result.durationMs,
        ),
      };
    },
    [editor.state],
  );

  const exportPolymorphic = React.useCallback(
    async (opts?: ExportOpts) => {
      const mode = editor.state.mode;
      if (mode === "video") {
        return exportVideo(opts as ExportVideoOpts | undefined);
      }
      return exportImage(opts as ExportImageOpts | undefined);
    },
    [editor.state.mode, exportImage, exportVideo],
  );

  // ─── Imperative handle ──────────────────────────────────────────────
  // Most methods are stubs in C6. Real wiring lands in C7-C12 per the plan.
  React.useImperativeHandle(
    ref,
    (): MediaEditor01Handle => ({
      // === Inspect ===
      getIsDirty: () => editor.isDirty,
      getMode: () => editor.state.mode,
      getState: () => editor.state,
      loadState: (state: MediaEditorState) => editor.loadState(state),

      // === Capture (real wiring in C8) ===
      switchCamera: async () => {
        devWarnOnce(warnedRef.current, "switchCamera", NOT_IMPLEMENTED_MARKER);
      },
      takePhoto: async () => {
        devWarnOnce(warnedRef.current, "takePhoto", NOT_IMPLEMENTED_MARKER);
      },
      startRecording: async () => {
        devWarnOnce(warnedRef.current, "startRecording", NOT_IMPLEMENTED_MARKER);
      },
      stopRecording: async () => {
        devWarnOnce(warnedRef.current, "stopRecording", NOT_IMPLEMENTED_MARKER);
      },
      importFromGallery: () => {
        devWarnOnce(warnedRef.current, "importFromGallery", NOT_IMPLEMENTED_MARKER);
      },

      // === Edit (gated wiring in C8; real overlays in C10/C11) ===
      addText: (text?: string) => {
        if (text !== undefined) {
          editor.setTextContent(text);
        } else {
          devWarnOnce(warnedRef.current, "addText", NOT_IMPLEMENTED_MARKER);
        }
      },
      addSticker: (sticker: StickerOption) => {
        editor.addSticker({
          id: `sticker-${Date.now()}`,
          stickerId: sticker.id,
          x: 0,
          y: 0,
          rotation: 0,
          scale: 1,
        });
      },
      setAdjustments: (adj: Partial<ImageAdjustments>) =>
        editor.setAdjustments(adj),
      applyFilter: (name: string | null) => editor.setFilter(name),
      clearLayer: (layer: "drawing" | "stickers" | "text") =>
        editor.clearLayer(layer),
      undo: () => {
        devWarnOnce(warnedRef.current, "undo", NOT_IMPLEMENTED_MARKER);
      },
      redo: () => {
        devWarnOnce(warnedRef.current, "redo", NOT_IMPLEMENTED_MARKER);
      },

      // === Export (C10) ===
      exportImage,
      exportVideo,
      export: exportPolymorphic,

      // === Lifecycle ===
      reset: () => editor.reset(),
      open: () => {
        // Dialog mode is controlled — consumer owns `isOpen`. open() is a no-op;
        // the consumer must set isOpen=true. Documented in JSDoc / guide.
        // Inline mode has nothing to open.
      },
      close: () => {
        // Fire onClose so dialog-mode consumers' state machine collapses.
        // Inline-mode consumers don't pass onClose; no-op.
        if (resolved === "dialog") {
          props.onClose?.();
        }
      },
    }),
    [editor, exportImage, exportVideo, exportPolymorphic, resolved, props],
  );

  // ─── Slot context for render* props ─────────────────────────────────

  const slotCtx = React.useMemo(
    () => ({
      mode: editor.state.mode,
      stage: editor.state.stage,
      isDirty: editor.isDirty,
      isCapturing: editor.state.stage === "capture",
      isExporting: editor.state.stage === "publishing",
      activeTool: editor.activeTool,
      enabledTools: [...enabledTools] as EditTool[],
      enabledModes: [...enabledModes] as ComposerMode[],
      aspect,
    }),
    [editor, enabledTools, enabledModes, aspect],
  );

  // ─── Render — inner surface (shared by inline + dialog branches) ──

  const inner = (
    <div
      className={cn(
        "flex h-full w-full flex-col gap-3 p-4",
        // Inline-only: gets its own card chrome. In dialog mode, DialogContent
        // provides the chrome and we go edge-to-edge inside it.
        resolved === "inline" &&
          "rounded-2xl border border-border bg-card text-card-foreground shadow-sm min-h-[400px]",
      )}
      data-slot="media-editor-01"
      data-mode={editor.state.mode ?? "none"}
      data-stage={editor.state.stage}
      data-presentation={resolved}
      data-aspect={aspect}
    >
      {props.renderTopBar?.(slotCtx)}

      {/* Mode pill — top-center, hides if 1 or 0 modes enabled */}
      {showModePill ? (
        <div className="flex justify-center">
          <div className="inline-flex gap-1 rounded-full border border-border bg-muted/50 p-1 text-xs">
            {enabledModes.map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => editor.setMode(m)}
                className={cn(
                  "rounded-full px-3 py-1 font-medium transition-colors",
                  editor.state.mode === m
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
                data-mode={m}
              >
                {m}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {/* Canvas — aspect-locked placeholder (real Konva stage lands in C10) */}
      <div className="flex flex-1 items-center justify-center">
        <div
          className={cn(
            "flex flex-col items-center justify-center gap-2 overflow-hidden rounded-xl border border-dashed border-border/60 bg-muted/30 p-2 text-center text-xs text-muted-foreground",
            aspect === "free"
              ? "h-full max-h-[400px] w-full max-w-[600px]"
              : "max-h-full max-w-full",
          )}
          style={
            aspect === "free"
              ? undefined
              : {
                  aspectRatio: aspect.replace(":", " / "),
                  width: "min(100%, 480px)",
                }
          }
          data-canvas-placeholder=""
          data-stage={editor.state.stage}
        >
          {sourceError ? (
            <div className="flex flex-col items-center gap-1 p-4">
              <p className="font-medium text-destructive">
                Couldn&apos;t load source
              </p>
              <p className="text-[11px] text-muted-foreground">
                <code>{sourceError.kind}</code>
                {"url" in sourceError ? (
                  <>
                    {" · "}
                    <code className="break-all">{sourceError.url}</code>
                  </>
                ) : null}
                {sourceError.kind === "mode-not-enabled" ? (
                  <>
                    {" · attempted "}
                    <code>{sourceError.attempted}</code>
                    {" · enabled "}
                    <code>{sourceError.enabled.join(",") || "(none)"}</code>
                  </>
                ) : null}
                {sourceError.kind === "unsupported-file-type" ? (
                  <>
                    {" · type "}
                    <code>{sourceError.fileType || "(blank)"}</code>
                  </>
                ) : null}
              </p>
              {props.renderEmpty ? props.renderEmpty() : null}
            </div>
          ) : isEmptyConfig ? (
            <div
              role="status"
              aria-label="Media editor: no source provided. Pass initialSource or enable a capture mode."
              className="flex flex-col items-center gap-2 p-6 text-muted-foreground"
              data-empty-config=""
            >
              {props.renderEmpty ? (
                props.renderEmpty()
              ) : (
                <>
                  <p className="font-medium text-foreground">
                    No source provided
                  </p>
                  <p className="text-[11px]">
                    Pass <code>initialSource</code> or enable a capture mode
                    in <code>enabledModes</code>.
                  </p>
                </>
              )}
            </div>
          ) : showEditCanvas ? (
            <EditorCanvas
              imageUrl={
                editor.draft?.kind === "image"
                  ? editor.draft.url
                  : editor.state.imageSrc
              }
              videoUrl={
                editor.draft?.kind === "video" ? editor.draft.url : videoUrl
              }
              textOverlays={editor.state.textOverlays}
              stickers={editor.state.stickers}
              drawingStrokes={editor.state.drawingStrokes}
              cropRect={editor.state.crop}
              cropActive={editor.activeTool === "crop"}
              adjustments={editor.state.adjustments}
              activeFilter={null}
              onStageReady={(s) => {
                stageRef.current = s;
              }}
              className="h-full w-full"
            />
          ) : showCameraSurface ? (
            <EditorCamera
              enabled={true}
              mode={editor.state.mode === "video" ? "video" : "photo"}
              defaultFacing={props.defaultFacing}
              recordAudio={props.recordAudio}
              maxFileSizeMb={props.maxFileSizeMb}
              maxVideoDurationSec={props.maxVideoDuration}
              labels={mergedLabels}
              onPhoto={handlePhoto}
              onVideo={handleVideo}
              onGalleryFile={handleGalleryFile}
              onValidationError={props.onValidationError}
              onPermissionDenied={props.onPermissionDenied}
            />
          ) : (
            <>
              <p className="font-medium text-foreground">
                {cameraIntakeAvailable
                  ? "Initialising camera…"
                  : mediaSources.includes("upload")
                  ? "Upload dropzone (Phase B retrofit)"
                  : "No capture source available"}
              </p>
              <p>
                aspect: <code>{aspect}</code> · sources:{" "}
                <code>{mediaSources.join(",") || "(none)"}</code>
              </p>
            </>
          )}
        </div>
      </div>

      {/* Toolbar — filtered by enabledTools (description §4).
          Suppressed in empty-config: tools have nothing to act on. */}
      {enabledTools.length > 0 && !isEmptyConfig ? (
        <div className="flex flex-wrap justify-center gap-1 rounded-md border border-border bg-muted/30 p-2">
          {enabledTools.map((tool) => (
            <button
              key={tool}
              type="button"
              onClick={() => editor.setActiveTool(tool)}
              className={cn(
                "rounded px-2.5 py-1 text-xs font-medium transition-colors",
                editor.activeTool === tool
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
              data-tool={tool}
            >
              {tool}
            </button>
          ))}
          {enabledTools.includes("crop") && resolvedCropAspects.length > 1 ? (
            <span className="ml-2 self-center text-[10px] text-muted-foreground/70">
              ({resolvedCropAspects.length} crop aspects)
            </span>
          ) : null}
        </div>
      ) : null}

      {props.renderBottomToolbar?.(slotCtx)}

      {/* State inspector — visible during dev only */}
      {process.env.NODE_ENV !== "production" ? (
        <div className="rounded-md border border-dashed border-border/40 bg-muted/10 p-2 text-[10px] text-muted-foreground/80">
          mode: <code>{editor.state.mode ?? "null"}</code> · stage:{" "}
          <code>{editor.state.stage}</code> · dirty:{" "}
          <code>{editor.isDirty ? "yes" : "no"}</code> · activeTool:{" "}
          <code>{editor.activeTool ?? "none"}</code> · presentation:{" "}
          <code>{resolved}</code> · cropAspects:{" "}
          <code>{resolvedCropAspects.join(",")}</code>
        </div>
      ) : null}
    </div>
  );

  // ─── Render — presentation branch ──

  if (resolved === "inline") {
    return inner;
  }

  // Dialog branch — size derived from aspect (description §6).
  const { width, height } = dialogSizeForAspect(aspect);

  return (
    <Dialog open={props.isOpen ?? false} onOpenChange={(open) => {
      if (!open) props.onClose?.();
    }}>
      <DialogContent
        showCloseButton={false}
        className={cn(
          // Mobile: edge-to-edge fullscreen. Desktop: derived size from aspect.
          "fixed inset-0 !max-w-none gap-0 overflow-hidden p-0 sm:rounded-2xl",
          "h-[100dvh] w-screen !rounded-none",
          "md:h-[var(--media-editor-dialog-h)] md:w-[var(--media-editor-dialog-w)] md:!rounded-2xl",
          "md:max-h-[90dvh] md:max-w-[90vw]",
        )}
        style={{
          // CSS vars consumed by md: classes above. Keeps Tailwind compile static.
          ["--media-editor-dialog-w" as string]: `${width}px`,
          ["--media-editor-dialog-h" as string]: `${height}px`,
        }}
      >
        <DialogTitle className="sr-only">Media editor</DialogTitle>
        {inner}
      </DialogContent>
    </Dialog>
  );
});

// ─── Export-time helpers ──────────────────────────────────────────────

/**
 * Returns true if the edit state has any overlay / mutation that would
 * change the output vs the raw source. Drives the video perf-shortcut:
 * if nothing's been changed, skip the MediaRecorder re-encode.
 *
 * Adjustments are checked by ALL three default values — any deviation
 * counts as "modified."
 */
function hasAnyOverlay(state: MediaEditorState): boolean {
  if (state.textOverlays.length > 0) return true;
  if (state.stickers.length > 0) return true;
  if (state.drawingStrokes.length > 0) return true;
  if (state.filter !== null) return true;
  const a = state.adjustments;
  if (a.brightness !== 0 || a.contrast !== 0 || a.saturation !== 0 || a.blur !== 0) {
    return true;
  }
  return false;
}

function buildExportMetadata(
  state: MediaEditorState,
  mode: ComposerMode,
  width: number,
  height: number,
  mimeType: string,
  durationMs?: number,
): ExportMetadata {
  return {
    mode,
    width,
    height,
    durationMs,
    mimeType,
    textOverlays: state.textOverlays,
    stickers: state.stickers,
    drawingStrokes: state.drawingStrokes.length,
    appliedFilter: state.filter ?? undefined,
    adjustments: state.adjustments,
    crop: state.crop ?? undefined,
  };
}
