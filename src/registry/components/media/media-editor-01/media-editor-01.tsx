"use client";

import * as React from "react";
import type Konva from "konva";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { useMediaEditorState } from "./hooks/use-media-editor-state";
import { useMultiInstanceGuard } from "./hooks/use-multi-instance-guard";
import { resolvePresentation } from "./lib/presentation-resolver";
import { dialogDimsForAspect } from "./lib/dialog-size-for-aspect";
import { resolveCropAspects } from "./lib/resolve-crop-aspects";
import { loadInitialSource } from "./lib/initial-source-loader";
import { exportPhotoBlob } from "./lib/export-blob";
import { compositeVideo } from "./lib/composite-video";
import { EditorCamera } from "./parts/editor-camera";
import { EditorCanvas } from "./parts/editor-canvas";
import { DiscardConfirmDialog } from "./parts/discard-confirm-dialog";
import { TextOnlyCanvas } from "./parts/text-only-canvas";
import { ToolAdjustSliders } from "./parts/tool-adjust-sliders";
import { ToolDrawControls } from "./parts/tool-draw-controls";
import { ToolFilterStrip } from "./parts/tool-filter-strip";
import { ToolStickerPicker } from "./parts/tool-sticker-picker";
import { ToolTextInput } from "./parts/tool-text-input";
import { resolveFilterPresets } from "./lib/konva-filters";
import { resolveStickerSets } from "./lib/built-in-stickers";
import {
  DEFAULT_COLOR_PRESETS,
  DEFAULT_FONTS,
  DEFAULT_TEXT_GRADIENTS,
} from "./lib/defaults";
import { useHistory } from "./hooks/use-history";
import type {
  AspectRatio,
  ComposerMode,
  EditAction,
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
 * media-editor-01 — black-box orchestrator.
 *
 * Owns the editor state machine, capability gating
 * (enabledModes/Tools/Sources/aspect), presentation (inline / dialog / auto),
 * initial-source intake, the Konva editor surface (EditorCamera / EditorCanvas /
 * tool panels), export pipeline, and the imperative ref handle.
 *
 * Known v0.1.x gap: the imperative *capture* handle methods (takePhoto,
 * startRecording, stopRecording, switchCamera, importFromGallery) are deferred
 * to v0.2 — they dev-warn if called. The in-UI camera controls are the
 * supported capture path in v0.1.x; everything else on the handle (inspect /
 * state / export / edit-overlay mutation) is fully wired.
 */

const NOT_IMPLEMENTED_MARKER =
  "media-editor-01: imperative capture (takePhoto / startRecording / stopRecording / switchCamera / importFromGallery) is deferred to v0.2 — drive capture via the in-UI controls for now.";

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

  // Seed the editor's cropAspect with the first allowed option (the hook's
  // "free" fallback may not be in the consumer-derived list). Computed
  // inline here — the memoized version below covers the render path.
  const initialCropAspect =
    resolveCropAspects(props.aspect ?? "free", props.cropAspects)[0] ?? "free";

  const editor = useMediaEditorState({
    defaultMode,
    defaultCropAspect: initialCropAspect,
    onDirtyChange: props.onDirtyChange,
  });

  const warnedRef = React.useRef<Set<string>>(new Set());

  // ─── Observability emitters (onModeChange / onEditAction) ──────────
  // Latest-callback refs so the emit effects below depend only on the state
  // they watch — never on parent-supplied callback identity (which churns on
  // every parent render and would refire the effects spuriously).
  const onModeChangeRef = React.useRef(props.onModeChange);
  const onEditActionRef = React.useRef(props.onEditAction);
  React.useEffect(() => {
    onModeChangeRef.current = props.onModeChange;
    onEditActionRef.current = props.onEditAction;
  });
  const emitEditAction = React.useCallback((action: EditAction) => {
    onEditActionRef.current?.(action);
  }, []);

  // Emit mode changes to onModeChange + onEditAction. Effect-driven so it
  // catches EVERY transition source (mode tab, gallery pick, initialSource
  // load, programmatic) rather than threading the callback through each call
  // site. Skips the initial mount so a seeded defaultMode doesn't fire.
  const prevEmitModeRef = React.useRef<ComposerMode | null | undefined>(
    undefined,
  );
  React.useEffect(() => {
    const mode = editor.state.mode;
    const prev = prevEmitModeRef.current;
    if (prev !== undefined && prev !== mode) {
      onModeChangeRef.current?.(mode);
      emitEditAction({ kind: "mode-change", from: prev, to: mode });
    }
    prevEmitModeRef.current = mode;
  }, [editor.state.mode, emitEditAction]);

  // Emit tool-open / tool-close as the active tool changes. A tool→tool switch
  // emits a close for the old then an open for the new. Skips the initial mount.
  const prevEmitToolRef = React.useRef<EditTool | null | undefined>(undefined);
  React.useEffect(() => {
    const curr = editor.activeTool;
    const prev = prevEmitToolRef.current;
    if (prev !== undefined && prev !== curr) {
      if (prev !== null) emitEditAction({ kind: "tool-close", tool: prev });
      if (curr !== null) emitEditAction({ kind: "tool-open", tool: curr });
    }
    prevEmitToolRef.current = curr;
  }, [editor.activeTool, emitEditAction]);

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
      // eslint-disable-next-line react-hooks/set-state-in-effect
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

  // ─── R4: Undo / redo history + discard guard ─────────────────────────

  const history = useHistory({ capacity: 50, bindKeyboard: true });

  const [showDiscardConfirm, setShowDiscardConfirm] = React.useState(false);
  const textOnlyRef = React.useRef<HTMLDivElement | null>(null);

  // Run a clean reset that also drops the history stack. Emits the `reset`
  // edit-action centrally so every reset path (handle.reset, back-to-capture,
  // discard-confirm) reports it once.
  const performReset = React.useCallback(() => {
    editor.reset();
    history.reset();
    emitEditAction({ kind: "reset" });
  }, [editor, history, emitEditAction]);

  // Close path with confirm-on-discard. Mirrors v0.1.5 Q-P10a:
  //   - In dialog mode, fires onClose unless dirty (then shows confirm).
  //   - In inline mode, just lets the consumer know via onClose (no UI
  //     close to perform).
  const requestClose = React.useCallback(() => {
    if (props.confirmOnDiscard !== false && editor.isDirty) {
      setShowDiscardConfirm(true);
      return;
    }
    props.onClose?.();
  }, [editor.isDirty, props]);

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
      // eslint-disable-next-line react-hooks/set-state-in-effect
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

  // ─── R3: Tool-panel resolved data ─────────────────────────────────
  const resolvedStickerSets = React.useMemo(
    () =>
      resolveStickerSets(props.stickers, !!props.replaceBuiltinStickers),
    [props.stickers, props.replaceBuiltinStickers],
  );
  const resolvedFilterPresets = React.useMemo(
    () =>
      resolveFilterPresets(
        props.filterPresets,
        !!props.replaceBuiltinFilters,
      ),
    [props.filterPresets, props.replaceBuiltinFilters],
  );
  const resolvedFonts = React.useMemo(
    () => props.fonts ?? DEFAULT_FONTS,
    [props.fonts],
  );
  const resolvedColorPresets = React.useMemo(
    () => props.colorPresets ?? DEFAULT_COLOR_PRESETS,
    [props.colorPresets],
  );

  // Flatten resolved sticker sets into a Map<id, StickerOption> for the
  // canvas-side resolveSticker(stickerId) lookup. Memoized — only rebuilds
  // when the sets change.
  const stickerIndex = React.useMemo(() => {
    const m = new Map<string, StickerOption>();
    for (const set of resolvedStickerSets) {
      for (const sticker of set.stickers) m.set(sticker.id, sticker);
    }
    return m;
  }, [resolvedStickerSets]);
  const resolveSticker = React.useCallback(
    (stickerId: string) => stickerIndex.get(stickerId),
    [stickerIndex],
  );

  // In-progress drawing stroke kept locally — committed to editor state on
  // pointer-up via addDrawingStroke. Lives outside MediaEditorState because
  // it's transient render-only data.
  const [currentDrawingStroke, setCurrentDrawingStroke] = React.useState<
    import("./types").DrawingStroke | null
  >(null);
  const handleDrawBegin = React.useCallback(
    (x: number, y: number) => {
      setCurrentDrawingStroke({
        id: `stroke-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        points: [x, y],
        color: editor.drawingTool.color,
        brushSize: editor.drawingTool.brushSize,
        mode: editor.drawingTool.mode,
      });
    },
    [editor.drawingTool],
  );
  const handleDrawExtend = React.useCallback((x: number, y: number) => {
    setCurrentDrawingStroke((prev) =>
      prev ? { ...prev, points: [...prev.points, x, y] } : prev,
    );
  }, []);
  const handleDrawEnd = React.useCallback(() => {
    // Commit OUTSIDE the setState updater — React 19 strict mode invokes the
    // updater twice in dev, which would call addDrawingStroke twice with the
    // same id and produce duplicate-key warnings. setState updaters must be
    // pure. Closure-read of the current stroke is fine here.
    if (currentDrawingStroke && currentDrawingStroke.points.length >= 4) {
      editor.addDrawingStroke(currentDrawingStroke);
    }
    setCurrentDrawingStroke(null);
  }, [currentDrawingStroke, editor]);

  // Tool-panel state snapshot: captures editor.state at the moment the user
  // enters a tool (activeTool flips from null → tool) so a "Back" button can
  // revert any in-tool changes. Cleared on tool exit so re-entering captures
  // a fresh baseline.
  const toolEntrySnapshot = React.useRef<MediaEditorState | null>(null);
  const prevActiveToolRef = React.useRef<EditTool | null>(null);
  React.useEffect(() => {
    const prev = prevActiveToolRef.current;
    const curr = editor.activeTool;
    if (prev === null && curr !== null) {
      toolEntrySnapshot.current = editor.state;
    } else if (curr === null) {
      toolEntrySnapshot.current = null;
    }
    prevActiveToolRef.current = curr;
    // editor.state is read intentionally at entry; deps only on activeTool.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editor.activeTool]);

  const handleApplyTool = React.useCallback(() => {
    editor.setSelectedTextId(null);
    editor.setSelectedStickerId(null);
    editor.setActiveTool(null);
  }, [editor]);
  const handleBackTool = React.useCallback(() => {
    const snap = toolEntrySnapshot.current;
    if (snap) editor.loadState(snap);
    editor.setSelectedTextId(null);
    editor.setSelectedStickerId(null);
    editor.setActiveTool(null);
  }, [editor]);

  const selectedText = React.useMemo(
    () =>
      editor.state.textOverlays.find((o) => o.id === editor.selectedTextId) ??
      null,
    [editor.state.textOverlays, editor.selectedTextId],
  );

  // Auto-add a text overlay when the text tool activates with nothing
  // selected. Mirrors v0.1.5 behavior — tapping "Text" gives you something
  // to edit immediately rather than presenting an empty inspector.
  const lastSeededToolRef = React.useRef<EditTool | null>(null);
  React.useEffect(() => {
    if (editor.activeTool !== "text") {
      lastSeededToolRef.current = null;
      return;
    }
    if (selectedText) return;
    if (lastSeededToolRef.current === "text") return;
    lastSeededToolRef.current = "text";
    const id = `text-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    editor.addTextOverlay({
      id,
      text: INTERNAL_LABELS_FALLBACK.textPlaceholder,
      x: 100,
      y: 200,
      rotation: 0,
      scale: 1,
      fontFamily: resolvedFonts[0]?.family ?? "sans-serif",
      fontSize: 40,
      fill: "#ffffff",
      align: "center",
    });
    editor.setSelectedTextId(id);
    // editor methods are stable; only activeTool/selectedText/fonts drive seed.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editor.activeTool, selectedText, resolvedFonts]);

  // Sticker pick → add at canvas center + select for the transformer.
  const handleStickerPick = React.useCallback(
    (sticker: StickerOption) => {
      const id = `sticker-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      editor.addSticker({
        id,
        stickerId: sticker.id,
        x: 200,
        y: 200,
        rotation: 0,
        scale: 1,
      });
      editor.setSelectedStickerId(id);
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

  // Mode auto-seed removed — initial state is intentionally mode:null so the
  // canvas can render a clean "Connect to camera" entry-point button instead
  // of jumping straight into a permission prompt. The button + mode tabs are
  // the user gestures that move the editor out of the empty state. Only the
  // text-only fallback (no capture modes available) does NOT need a gesture.
  React.useEffect(() => {
    if (editor.state.mode !== null) return;
    if (editor.state.stage !== "capture") return;
    const captureModesEnabled = enabledModes.some(
      (m) => m === "photo" || m === "video",
    );
    if (!captureModesEnabled && enabledModes.includes("text")) {
      editor.setMode("text");
    }
    // editor.setMode is stable per hook contract; mode/stage/modes drive it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editor.state.mode, editor.state.stage, enabledModes]);

  // Tracks whether the user has explicitly clicked a button that should kick
  // off the camera-acquire flow. When true, EditorCamera receives autoAcquire
  // and the browser permission prompt fires inside the same user-gesture
  // tick — avoiding spontaneous prompts on first paint.
  const [userInitiatedCamera, setUserInitiatedCamera] = React.useState(false);

  // "Back" from the edit stage → return to the capture surface so the user can
  // re-take. Clears the captured draft + edits + history (via performReset),
  // then restores the capture mode so the camera reopens in the same mode —
  // gesture-credited through userInitiatedCamera so there's no fresh permission
  // friction. Only offered when a capture mode exists (see hasCaptureMode).
  const backToCapture = React.useCallback(() => {
    const mode = editor.state.mode;
    performReset();
    if (mode === "photo" || mode === "video") {
      editor.setMode(mode);
      setUserInitiatedCamera(true);
    }
  }, [editor, performReset]);

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
  // Inspect / state / export / edit-overlay methods are fully wired. The
  // imperative CAPTURE methods (takePhoto / startRecording / stopRecording /
  // switchCamera / importFromGallery) are deferred to v0.2 — they dev-warn
  // until then; the in-UI camera controls are the supported capture path.
  React.useImperativeHandle(
    ref,
    (): MediaEditor01Handle => ({
      // === Inspect ===
      getIsDirty: () => editor.isDirty,
      getMode: () => editor.state.mode,
      getState: () => editor.state,
      loadState: (state: MediaEditorState) => editor.loadState(state),

      // === Capture (imperative path deferred to v0.2 — dev-warns; see note above) ===
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

      // === Edit ===
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
      undo: () => history.undo(),
      redo: () => history.redo(),

      // === Export (C10) ===
      exportImage,
      exportVideo,
      export: exportPolymorphic,

      // === Lifecycle ===
      reset: () => performReset(),
      open: () => {
        // Dialog mode is controlled — consumer owns `isOpen`. open() is a no-op;
        // the consumer must set isOpen=true. Documented in JSDoc / guide.
        // Inline mode has nothing to open.
      },
      close: () => {
        // Routes through requestClose so confirm-on-discard guard fires
        // if the editor is dirty. The dialog-mode branch in the wrapper
        // also wires onOpenChange→requestClose for backdrop/Escape.
        if (resolved === "dialog") {
          requestClose();
        }
      },
    }),
    [
      editor,
      exportImage,
      exportVideo,
      exportPolymorphic,
      resolved,
      history,
      performReset,
      requestClose,
    ],
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
        // `relative` anchors the floating top-center control (mode pill / Back)
        // and the consumer's renderTopBar (X / Publish) to the SAME box so they
        // share one row instead of stacking.
        "relative flex h-full w-full flex-col gap-3 p-4",
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

      {/* Top-center control — absolutely centered so it shares the consumer
          top-bar's row (X left / Publish right) instead of stacking under it.
          Capture stage → mode pill (choose what to capture). Hidden once a
          draft exists: switching modes mid-edit is meaningless. */}
      {editor.state.stage === "capture" && showModePill ? (
        <div className="absolute top-[max(0.75rem,env(safe-area-inset-top))] left-1/2 z-30 -translate-x-1/2">
          <div className="inline-flex gap-1 rounded-full border border-border bg-muted/50 p-1 text-xs backdrop-blur">
            {enabledModes.map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => {
                  editor.setMode(m);
                  if (m === "photo" || m === "video") {
                    setUserInitiatedCamera(true);
                  }
                }}
                className={cn(
                  "rounded-full px-3 py-1 font-medium transition-colors",
                  editor.state.mode === m
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
                data-mode={m}
              >
                {m === "photo"
                  ? mergedLabels.modePhoto
                  : m === "video"
                    ? mergedLabels.modeVideo
                    : mergedLabels.modeText}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {/* Edit stage → Back-to-capture (icon-only, top-left), taking the close
          button's slot. The consumer's renderTopBar hides its own close here so
          Back is the single left-corner action (Instagram convention). Only
          when a capture mode exists to return to — edit-only consumers
          (initialSource, no capture modes) keep their close button instead. */}
      {editor.state.stage === "edit" && hasCaptureMode ? (
        <div className="absolute top-[max(0.75rem,env(safe-area-inset-top))] left-3 z-30">
          <button
            type="button"
            onClick={backToCapture}
            aria-label="Back to capture"
            className="inline-flex size-9 items-center justify-center rounded-full bg-black/30 text-white backdrop-blur transition-colors hover:bg-black/45"
          >
            <ArrowLeft className="size-5" />
          </button>
        </div>
      ) : null}

      {/* Canvas — aspect-locked placeholder (real Konva stage lands in C10).
          min-h-0 lets this flex-1 region shrink below the aspect-locked card's
          intrinsic height so the bottom tool row keeps its space instead of
          being pushed past the dialog's clipped (overflow-hidden) bottom edge. */}
      <div className="relative flex flex-1 min-h-0 items-center justify-center">
        <div
          className={cn(
            "flex flex-col items-stretch justify-center gap-2 overflow-hidden rounded-xl border border-dashed border-border/60 bg-muted/30 text-center text-xs text-muted-foreground",
            // Fixed aspect ratio, sized to fill the frame (no side letterbox).
            resolved === "dialog"
              ? // Dialog: fill the region edge-to-edge. The dialog itself is
                // aspect-locked, so the canvas fills full width + height and the
                // bottom controls OVERLAY the canvas (like the camera shutter)
                // rather than taking flow space — so nothing shifts or crops.
                "h-full w-full max-h-full max-w-full"
              : // Inline has no guaranteed definite height, so drive by WIDTH
                // with min/max bounds — responsive between a chat-embed (small)
                // and a full surface (large) without breaking the ratio.
                aspect === "free"
                ? "w-full min-h-64 min-w-50 max-w-150 max-h-[70vh]"
                : "w-full min-h-64 min-w-50 max-w-120 max-h-[70vh]",
          )}
          style={{
            aspectRatio:
              aspect === "free" ? "16 / 9" : aspect.replace(":", " / "),
          }}
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
              selectedTextId={editor.selectedTextId}
              onTextChange={(next) => editor.updateTextOverlay(next.id, next)}
              onTextSelect={editor.setSelectedTextId}
              stickers={editor.state.stickers}
              resolveSticker={resolveSticker}
              selectedStickerId={editor.selectedStickerId}
              onStickerChange={(next) => editor.updateSticker(next.id, next)}
              onStickerSelect={editor.setSelectedStickerId}
              drawingStrokes={editor.state.drawingStrokes}
              currentDrawingStroke={currentDrawingStroke}
              isDrawing={editor.activeTool === "draw"}
              onDrawBegin={handleDrawBegin}
              onDrawExtend={handleDrawExtend}
              onDrawEnd={handleDrawEnd}
              cropRect={editor.state.crop}
              cropActive={editor.activeTool === "crop"}
              cropAspectRatio={aspectAsRatio(editor.cropAspect)}
              onCropChange={editor.setCrop}
              adjustments={editor.state.adjustments}
              activeFilter={
                resolvedFilterPresets.find(
                  (f) => f.id === editor.state.filter,
                ) ?? null
              }
              onStageReady={(s) => {
                stageRef.current = s;
              }}
              className="h-full w-full"
            />
          ) : editor.state.stage === "capture" &&
            editor.state.mode === "text" &&
            enabledModes.includes("text") ? (
            <TextOnlyCanvas
              ref={textOnlyRef}
              gradients={DEFAULT_TEXT_GRADIENTS}
              fonts={resolvedFonts}
              colorPresets={resolvedColorPresets}
              labels={mergedLabels}
              value={editor.textOnly}
              onChange={(next) => editor.setTextOnly(next)}
            />
          ) : showCameraSurface ? (
            <EditorCamera
              enabled={true}
              mode={editor.state.mode === "video" ? "video" : "photo"}
              defaultFacing={props.defaultFacing}
              recordAudio={props.recordAudio}
              maxFileSizeMb={props.maxFileSizeMb}
              maxVideoDurationSec={props.maxVideoDuration}
              captureAspectRatio={aspectAsRatio(aspect)}
              autoAcquireOverride={userInitiatedCamera}
              labels={mergedLabels}
              onPhoto={handlePhoto}
              onVideo={handleVideo}
              onGalleryFile={handleGalleryFile}
              onValidationError={props.onValidationError}
              onPermissionDenied={props.onPermissionDenied}
              renderPermissionDenied={props.renderPermissionDenied}
            />
          ) : cameraIntakeAvailable ? (
            <div className="flex h-full w-full flex-col items-center justify-center gap-4 p-6 text-center">
              <p className="text-sm text-muted-foreground">
                Pick a mode above, or jump straight to the camera.
              </p>
              <button
                type="button"
                onClick={() => {
                  const firstCapture = enabledModes.find(
                    (m) => m === "photo" || m === "video",
                  );
                  if (firstCapture) {
                    editor.setMode(firstCapture);
                    setUserInitiatedCamera(true);
                  }
                }}
                className="rounded-full bg-primary px-5 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
              >
                Connect to camera
              </button>
            </div>
          ) : (
            <>
              <p className="font-medium text-foreground">
                {mediaSources.includes("upload")
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

      {/* Bottom control overlay — edit stage only. Floats over the bottom of
          the full-bleed canvas (mirrors the camera's overlaid shutter) with a
          scrim, so the tool panel + chip row never steal the canvas's space or
          get clipped by the dialog's bottom edge. */}
      {showEditCanvas ? (
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 flex flex-col items-stretch gap-2 bg-linear-to-t from-black/70 via-black/30 to-transparent px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-10 *:pointer-events-auto">
          {/* Active tool panel — keyed by editor.activeTool. Renders above the
              chip-row toolbar. Image-draft tools only show on image drafts;
              video-draft trim/etc. land in R4. */}
          {editor.draft?.kind === "image" ? (
            <>
              {editor.activeTool === "text" && selectedText ? (
                <ToolPanelFrame onBack={handleBackTool} onApply={handleApplyTool}>
                  <ToolTextInput
                    overlay={selectedText}
                    fonts={resolvedFonts}
                    colorPresets={resolvedColorPresets}
                    labels={mergedLabels}
                    onChange={(next) =>
                      editor.updateTextOverlay(next.id, next)
                    }
                    onDelete={() => {
                      editor.removeTextOverlay(selectedText.id);
                      editor.setSelectedTextId(null);
                    }}
                  />
                </ToolPanelFrame>
              ) : null}
              {editor.activeTool === "stickers" ? (
                <ToolPanelFrame onBack={handleBackTool} onApply={handleApplyTool}>
                  <ToolStickerPicker
                    sets={resolvedStickerSets}
                    onPick={handleStickerPick}
                  />
                </ToolPanelFrame>
              ) : null}
              {editor.activeTool === "filters" && editor.draft.url ? (
                <ToolPanelFrame onBack={handleBackTool} onApply={handleApplyTool}>
                  <ToolFilterStrip
                    presets={resolvedFilterPresets}
                    sourceUrl={editor.draft.url}
                    activeId={editor.state.filter}
                    onSelect={(id) => editor.setFilter(id)}
                  />
                </ToolPanelFrame>
              ) : null}
              {editor.activeTool === "adjust" ? (
                <ToolPanelFrame onBack={handleBackTool} onApply={handleApplyTool}>
                  <ToolAdjustSliders
                    value={editor.state.adjustments}
                    onChange={(next) => editor.setAdjustments(next)}
                    labels={mergedLabels}
                  />
                </ToolPanelFrame>
              ) : null}
              {editor.activeTool === "draw" ? (
                <ToolPanelFrame onBack={handleBackTool} onApply={handleApplyTool}>
                  <ToolDrawControls
                    color={editor.drawingTool.color}
                    brushSize={editor.drawingTool.brushSize}
                    mode={editor.drawingTool.mode}
                    colorPresets={resolvedColorPresets}
                    labels={mergedLabels}
                    onColorChange={(color) => editor.setDrawingTool({ color })}
                    onBrushSizeChange={(brushSize) =>
                      editor.setDrawingTool({ brushSize })
                    }
                    onModeChange={(mode) => editor.setDrawingTool({ mode })}
                  />
                </ToolPanelFrame>
              ) : null}
              {editor.activeTool === "crop" ? (
                <div className="flex flex-wrap items-center justify-center gap-2 rounded-md border border-border bg-muted/30 p-2">
                  {resolvedCropAspects.length > 1 ? (
                    <div className="flex flex-wrap items-center gap-1 border-r border-border pr-2">
                      {resolvedCropAspects.map((a) => (
                        <button
                          key={a}
                          type="button"
                          onClick={() => {
                            editor.setCropAspect(a);
                            editor.setCrop(null);
                          }}
                          className={cn(
                            "rounded px-2 py-0.5 text-xs font-medium transition-colors",
                            editor.cropAspect === a
                              ? "bg-primary text-primary-foreground"
                              : "border border-border bg-muted/40 text-muted-foreground hover:bg-muted hover:text-foreground",
                          )}
                        >
                          {a}
                        </button>
                      ))}
                    </div>
                  ) : null}
                  <button
                    type="button"
                    onClick={async () => {
                      // Apply crop = burn the cropRect into the source image at
                      // NATIVE resolution. We can't use stage.toCanvas() — that
                      // captures the displayed stage size (typically smaller than
                      // source), so output would be down-sampled. Instead: load
                      // the source image as <img>, map cropRect from stage coords
                      // → image natural coords via the object-contain fit region,
                      // then drawImage into a new canvas at natural resolution.
                      const stage = stageRef.current;
                      const crop = editor.state.crop;
                      const sourceUrl =
                        editor.draft?.url ?? editor.state.imageSrc;
                      if (!stage || !crop || !sourceUrl) {
                        editor.setActiveTool(null);
                        return;
                      }
                      try {
                        const img = new Image();
                        img.crossOrigin = "anonymous";
                        await new Promise<void>((resolve, reject) => {
                          img.onload = () => resolve();
                          img.onerror = () =>
                            reject(new Error("image load failed"));
                          img.src = sourceUrl;
                        });
                        // Compute the image's object-contain fit region in stage
                        // coords (mirrors the Konva canvas's fitInto helper).
                        const stageW = stage.width();
                        const stageH = stage.height();
                        const fitScale = Math.min(
                          stageW / img.naturalWidth,
                          stageH / img.naturalHeight,
                        );
                        const fitW = img.naturalWidth * fitScale;
                        const fitH = img.naturalHeight * fitScale;
                        const fitX = (stageW - fitW) / 2;
                        const fitY = (stageH - fitH) / 2;
                        // Intersect crop with fit (clip letterbox area out).
                        const ix = Math.max(crop.x, fitX);
                        const iy = Math.max(crop.y, fitY);
                        const iw =
                          Math.min(crop.x + crop.width, fitX + fitW) - ix;
                        const ih =
                          Math.min(crop.y + crop.height, fitY + fitH) - iy;
                        if (iw <= 0 || ih <= 0) {
                          editor.setActiveTool(null);
                          return;
                        }
                        // Map intersection to natural image coords.
                        const natScale = img.naturalWidth / fitW;
                        const sx = (ix - fitX) * natScale;
                        const sy = (iy - fitY) * natScale;
                        const sw = iw * natScale;
                        const sh = ih * natScale;
                        const canvas = document.createElement("canvas");
                        canvas.width = Math.round(sw);
                        canvas.height = Math.round(sh);
                        const ctx = canvas.getContext("2d");
                        if (!ctx) {
                          editor.setActiveTool(null);
                          return;
                        }
                        ctx.drawImage(
                          img,
                          sx,
                          sy,
                          sw,
                          sh,
                          0,
                          0,
                          canvas.width,
                          canvas.height,
                        );
                        const blob = await new Promise<Blob | null>((res) => {
                          canvas.toBlob(res, "image/jpeg", 0.92);
                        });
                        if (!blob) {
                          editor.setActiveTool(null);
                          return;
                        }
                        const newUrl = URL.createObjectURL(blob);
                        // Replace draft + imageSrc with the cropped image so the
                        // tool sub-panel gate (editor.draft?.kind === "image")
                        // stays true and re-crop works on the new image.
                        editor.setDraft({
                          source: editor.draft?.source ?? "initial",
                          kind: "image",
                          blob,
                          url: newUrl,
                          width: canvas.width,
                          height: canvas.height,
                          mimeType: "image/jpeg",
                        });
                        editor.setImageSrc(newUrl);
                        editor.setCrop(null);
                        editor.setActiveTool(null);
                      } catch {
                        editor.setActiveTool(null);
                      }
                    }}
                    className="rounded bg-primary px-3 py-1 text-xs font-medium text-primary-foreground hover:opacity-90"
                  >
                    Apply
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      editor.setCrop(null);
                      editor.setActiveTool(null);
                    }}
                    className="rounded border border-border bg-muted/40 px-3 py-1 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
                  >
                    Cancel
                  </button>
                </div>
              ) : null}
            </>
          ) : null}

      {/* Edit-tool chip row — filtered by enabledTools (description §4). Only
          in the edit stage: the tools act on a captured draft, so they have
          nothing to do during capture / text-only / empty-config. Centered when
          the chips fit, horizontally scrollable when they don't, so they never
          crop on narrow (9:16) widths. */}
          {enabledTools.length > 0 && !isEmptyConfig ? (
            <div className="max-w-full self-center overflow-x-auto rounded-full border border-border bg-background/80 backdrop-blur [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              <div className="mx-auto flex w-max items-center gap-1 p-1">
                {enabledTools.map((tool) => (
                  <button
                    key={tool}
                    type="button"
                    onClick={() => editor.setActiveTool(tool)}
                    className={cn(
                      "shrink-0 rounded-full px-3 py-1 text-xs font-medium capitalize transition-colors",
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
                  <span className="ml-2 shrink-0 self-center text-[10px] text-muted-foreground/70">
                    ({resolvedCropAspects.length} crop aspects)
                  </span>
                ) : null}
              </div>
            </div>
          ) : null}
        </div>
      ) : null}

      {props.renderBottomToolbar?.(slotCtx)}

      {/* Discard confirm — fires from requestClose() when isDirty + close
          attempt (backdrop / Escape / handle.close()). Q-P10a. */}
      <DiscardConfirmDialog
        open={showDiscardConfirm}
        labels={mergedLabels}
        onCancel={() => setShowDiscardConfirm(false)}
        onConfirm={() => {
          setShowDiscardConfirm(false);
          performReset();
          props.onClose?.();
        }}
      />
    </div>
  );

  // ─── Render — presentation branch ──

  if (resolved === "inline") {
    return inner;
  }

  // Dialog branch — sizing derived from aspect (description §6). On desktop
  // the dialog is a viewport-relative box constrained by aspect-ratio:
  // height-driven for portrait aspects, width-driven for landscape. The
  // unspecified dimension is computed from CSS aspect-ratio; max-* clamps
  // the secondary axis when the driver would force overflow.
  const { aspectRatio, orientation } = dialogDimsForAspect(aspect);

  return (
    <Dialog
      open={props.isOpen ?? false}
      onOpenChange={(open) => {
        if (!open) requestClose();
      }}
    >
      <DialogContent
        showCloseButton={false}
        className={cn(
          // Mobile: edge-to-edge fullscreen. Defeat shadcn base centering
          // (top-1/2 left-1/2 + -translate-x/y-1/2) so the dialog anchors at 0,0.
          "!fixed !inset-0 !top-0 !left-0 !translate-x-0 !translate-y-0",
          "!max-w-none gap-0 overflow-hidden p-0",
          "h-[100dvh] w-screen !rounded-none",
          // Desktop: restore viewport-centered positioning. !inset-auto cancels
          // the mobile !inset-0 so top/left:50% can land.
          "md:!inset-auto md:!top-1/2 md:!left-1/2",
          "md:!-translate-x-1/2 md:!-translate-y-1/2",
          "md:!rounded-2xl",
          // Aspect-ratio-driven sizing. Only the DRIVER dimension is sized; the
          // other follows from the inline aspectRatio. Using clamp() on the
          // driver gives a min + max floor/ceiling WITHOUT breaking the ratio
          // (the derived dimension still tracks it) — so the dialog can't
          // collapse to an unusable thumbnail on a short window. portrait drives
          // height (clamped 24rem–44rem around 85dvh); landscape drives width
          // (clamped 28rem–60rem around 85vw). max-w/max-h clamp the derived
          // axis if it would exceed the viewport.
          orientation === "portrait"
            ? "md:h-[clamp(24rem,85dvh,44rem)] md:w-auto md:max-w-[90vw]"
            : "md:w-[clamp(28rem,85vw,60rem)] md:h-auto md:max-h-[85dvh]",
        )}
        style={{
          // aspect-ratio is driven inline (Tailwind v4's md:aspect-[…] doesn't
          // support runtime values without a JIT-friendly literal).
          aspectRatio,
        }}
      >
        <DialogTitle className="sr-only">{mergedLabels.composerLabel}</DialogTitle>
        <DialogDescription className="sr-only">
          {mergedLabels.composerDescription}
        </DialogDescription>
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
/** Default display ratio used for `aspect="free"` — chosen to match the
 * typical webcam frame so preview ↔ capture stay consistent and the canvas
 * doesn't render as a too-wide / too-short box. */
const FREE_ASPECT_FALLBACK = 16 / 9;

/**
 * Convert an `AspectRatio` string ("9:16", "1:1", etc.) to a numeric ratio
 * (width / height) for capture-time cropping. For `"free"`, returns
 * `FREE_ASPECT_FALLBACK` so the captured frame is cropped to the same shape
 * the canvas is displayed at (avoiding the "captured photo doesn't match
 * preview" mismatch the canvas-placeholder uses the same ratio).
 */
function aspectAsRatio(aspect: AspectRatio): number {
  if (aspect === "free") return FREE_ASPECT_FALLBACK;
  const [w, h] = aspect.split(":").map(Number);
  if (!w || !h) return FREE_ASPECT_FALLBACK;
  return w / h;
}

/**
 * Shared chrome for tool sub-panels: wraps the tool's own UI with a Back +
 * Apply button row so every tool follows the same Apply/revert contract.
 * Back calls `onBack` which restores the state snapshot captured at tool
 * entry. Apply just closes the panel, keeping all in-tool changes.
 * Crop has its own custom panel chrome because Apply burns the cropped
 * image into a new blob — that's outside the generic snapshot/restore model.
 */
function ToolPanelFrame({
  onBack,
  onApply,
  children,
}: {
  onBack: () => void;
  onApply: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-end gap-2 px-1">
        <button
          type="button"
          onClick={onBack}
          className="rounded border border-border bg-muted/40 px-3 py-1 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          Back
        </button>
        <button
          type="button"
          onClick={onApply}
          className="rounded bg-primary px-3 py-1 text-xs font-medium text-primary-foreground hover:opacity-90"
        >
          Apply
        </button>
      </div>
      {children}
    </div>
  );
}

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
