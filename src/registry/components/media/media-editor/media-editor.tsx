"use client";

import * as React from "react";
import type Konva from "konva";
import { ArrowLeft, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { useMediaEditorState } from "./hooks/use-media-editor-state";
import { useCaptureExtensionOptional } from "./hooks/use-capture-extension";
import { resolvePresentation } from "./lib/presentation-resolver";
import { probeVideo } from "./lib/probe-video";
import { focusOverlay, wrapTabWithinOverlay } from "./lib/overlay-focus";
import { resolveEditorLabels } from "./lib/normalize-labels";
import { formatNumber } from "./lib/format-number";
import {
  renameBackgrounds,
  renameFilters,
  renameFonts,
  renameStickerSets,
} from "./lib/preset-names";
import { dialogDimsForAspect } from "./lib/dialog-size-for-aspect";
import { resolveCropAspects } from "./lib/resolve-crop-aspects";
import { loadInitialSource } from "./lib/initial-source-loader";
import { exportPhotoBlob, exportTextOnlyBlob } from "./lib/export-blob";
import { compositeVideo } from "./lib/composite-video";
import {
  acceptAttribute,
  validateGalleryFile,
} from "./lib/validate-media-file";
import { selectRecorderMime } from "./lib/mime-fallback";
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
import {
  FALLBACK_PLACEMENT,
  measureTextBox,
  visibleImageCenter,
} from "./lib/placement";
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
  LoadStateOpts,
  MediaEditorHandle,
  MediaEditorProps,
  MediaEditorState,
  SourceError,
  StickerOption,
  MediaEditorPresetNames,
  MediaEditorResolvedLabels,
  ValidationError,
} from "./types";
import type {
  CapturedPhotoLike as CapturedPhoto,
  CapturedVideoLike as CapturedVideo,
} from "./hooks/use-capture-extension";

// Lazy-load the konva canvas (compound-component-structure rule — heavy dep
// boundary). Module-scoped (not inside the component) so the lazy factory's
// identity is stable across renders. `parts/lazy-editor-canvas` is a
// same-folder default-export wrapper — EditorCanvas itself is a named
// export and React.lazy needs a default one.
const LazyEditorCanvas = React.lazy(() => import("./parts/lazy-editor-canvas"));

/**
 * media-editor — black-box orchestrator.
 *
 * Owns the editor state machine, capability gating
 * (enabledModes/Tools/Sources/aspect), presentation (inline / dialog / auto),
 * initial-source intake, the Konva editor surface (camera surface / EditorCanvas /
 * tool panels), export pipeline, and the imperative ref handle.
 *
 * P3 S3 (feature-slicing): the camera capture surface is no longer statically
 * imported here — it's injected via the optional `capture` prop
 * (`MediaCaptureExtension`, see `hooks/use-capture-extension.ts`). Install
 * `@ilinxa/media-editor-capture` and pass `capture={mediaCapture}` to enable
 * a live camera; without it, "camera" in `mediaSources` falls back to the
 * base file/gallery intake surface (one dev console.warn) — base-alone stays
 * a real pick-file → edit → export flow. `MediaEditor` itself is a thin
 * wrapper that mounts `props.capture.Provider` (when present) around
 * `MediaEditorImpl`, which holds all the logic below and reads the
 * extension back out via `useCaptureExtensionOptional()`.
 *
 * Known gap: the imperative *capture* handle methods (takePhoto,
 * startRecording, stopRecording, switchCamera, importFromGallery) are not
 * implemented — they dev-warn if called. The in-UI camera controls are the
 * supported capture path. Also not implemented: handle.undo / redo, handle.open,
 * and handle.addText() with no argument (all dev-warn). The rest of the handle
 * (inspect / state / export / edit-overlay mutation) is wired.
 */

const NOT_IMPLEMENTED_MARKER =
  "media-editor: imperative capture (takePhoto / startRecording / stopRecording / switchCamera / importFromGallery) is not implemented — drive capture via the in-UI controls instead.";

const NOT_WIRED_HISTORY_MARKER =
  "media-editor: undo/redo is not wired (no mutations are recorded as commands) — no-op.";

/**
 * True when the `overlay` prop renders something. `null`, `undefined`, `true`,
 * `false` and `""` render nothing and must not lock the editor behind an
 * invisible overlay; `0` renders "0" (React prints it), so it counts as active.
 */
function hasRenderableOverlay(node: React.ReactNode): boolean {
  return React.Children.toArray(node).some((c) => c !== "");
}

/** `useSyncExternalStore` subscribe for a value that never notifies (browser capability probes). */
const subscribeNever = () => () => {};

/**
 * Edit tools that have a working UI on a VIDEO draft. None today: the tool
 * panels (text / stickers / filters / adjust / draw / crop) are all mounted
 * only for image drafts, and a video draft renders as a plain `<video>`. Add a
 * tool here when it gains a video implementation; until then its chip stays
 * hidden rather than opening nothing.
 */
const VIDEO_DRAFT_TOOLS: readonly EditTool[] = [];

function devWarnOnce(memo: Set<string>, key: string, message: string) {
  if (process.env.NODE_ENV === "production") return;
  if (memo.has(key)) return;
  memo.add(key);
  console.warn(message);
}

// Thin outer wrapper — its ONLY job is mounting `props.capture.Provider`
// (when a capture extension is wired) as an ANCESTOR of the real
// implementation, so `MediaEditorImpl` can read it back via
// `useCaptureExtensionOptional()` (a component can't consume a context
// Provider it renders itself — the Provider must be an ancestor). No other
// logic lives here; everything else is unchanged in `MediaEditorImpl` below.
export const MediaEditor = React.forwardRef<MediaEditorHandle, MediaEditorProps>(
  function MediaEditor(props, ref) {
    if (props.capture) {
      const { Provider } = props.capture;
      return (
        <Provider>
          <MediaEditorImpl {...props} ref={ref} />
        </Provider>
      );
    }
    return <MediaEditorImpl {...props} ref={ref} />;
  },
);

const MediaEditorImpl = React.forwardRef<
  MediaEditorHandle,
  MediaEditorProps
>(function MediaEditorImpl(props, ref) {
  const captureExt = useCaptureExtensionOptional();

  // ─── Output / intake formats (ME4) ──────────────────────────────────
  // `videoOutput.mimeTypes` keyed by content so an inline array literal does
  // not change identity every parent render. An empty list means "no
  // allow-list" (the built-in chain).
  const videoMimeKey = props.videoOutput?.mimeTypes?.join("\n") ?? "";
  const allowedVideoMimes = React.useMemo(
    () => (videoMimeKey ? videoMimeKey.split("\n") : undefined),
    [videoMimeKey],
  );
  // With an allow-list, can this browser record any of it? Read through
  // useSyncExternalStore so the server render and the hydration pass both see
  // `true` (MediaRecorder is absent on the server); the client then re-renders
  // with the real answer, without a hydration mismatch.
  const recorderCanEncodeAllowList = React.useSyncExternalStore(
    subscribeNever,
    () =>
      allowedVideoMimes === undefined ||
      selectRecorderMime(allowedVideoMimes) !== null,
    () => true,
  );
  // Recording is only REACHABLE when the camera source is on AND a capture
  // extension is wired. Without it there is no recorder to restrict, so video
  // stays available (a video FILE needs no recorder) and nothing is reported.
  // Both inputs are identical on the server and the client, so this cannot
  // flip between SSR and hydration.
  const recordingReachable =
    (props.mediaSources ?? ["camera", "upload"]).includes("camera") &&
    captureExt?.CameraSurface != null;
  const videoRecordable = recorderCanEncodeAllowList || !recordingReachable;
  // A video start mode is meaningless when video is hidden.
  const defaultMode =
    props.defaultMode === "video" && !videoRecordable
      ? undefined
      : props.defaultMode;

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

  // ─── Labels ─────────────────────────────────────────────────────────
  // DEFAULT_LABELS (the single English source) merged with the consumer's
  // nested labels; flat keys (deprecated) are still accepted and win.
  const mergedLabels: MediaEditorResolvedLabels = React.useMemo(
    () => resolveEditorLabels(props.labels),
    [props.labels],
  );
  const presetNames = props.labels?.presets;
  // `labels.trim` only reaches the exported VideoTrimBar, which this component
  // never mounts — say so instead of silently ignoring it.
  const hasTrimLabels = props.labels?.trim !== undefined;
  React.useEffect(() => {
    if (!hasTrimLabels) return;
    devWarnOnce(
      warnedRef.current,
      "labels-trim-inert",
      "media-editor: labels.trim has no effect on <MediaEditor> — the editor does not mount the trim bar. Pass those labels to an exported VideoTrimBar you mount yourself (its `labels` prop).",
    );
  }, [hasTrimLabels]);
  const { locale } = props;

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

  // The server snapshot above says "recordable", so a `defaultMode="video"` can
  // be seeded into state and hydrated; once the real answer arrives and video
  // is hidden, leave the capture stage with no mode (what a client-only render
  // shows) instead of sitting on a mode that is not offered.
  const { setMode: setEditorMode } = editor;
  React.useEffect(() => {
    if (
      !videoRecordable &&
      editor.state.mode === "video" &&
      editor.state.stage === "capture"
    ) {
      setEditorMode(null);
    }
  }, [videoRecordable, editor.state.mode, editor.state.stage, setEditorMode]);

  // ─── Capability defaults (description §8 — Q-P-locked) ─────────────

  // Memoized so the `??`-fallback arrays keep a stable identity across
  // renders (both feed hook dependency arrays further down).
  const declaredModes = React.useMemo(
    () => props.enabledModes ?? (["photo", "video", "text"] as const),
    [props.enabledModes],
  );
  // Video mode is hidden when `videoOutput.mimeTypes` names nothing this
  // browser can record. Uploading a video FILE still works (pass-through needs
  // no recorder), so the loader below keeps checking the declared modes.
  const enabledModes = React.useMemo(
    () =>
      videoRecordable
        ? declaredModes
        : declaredModes.filter((m) => m !== "video"),
    [declaredModes, videoRecordable],
  );

  // Tell the host once per mount that video recording was hidden because none
  // of `videoOutput.mimeTypes` is recordable here. Skipped when the consumer
  // never enabled video mode (nothing was lost).
  const onValidationErrorRef = React.useRef(props.onValidationError);
  React.useEffect(() => {
    onValidationErrorRef.current = props.onValidationError;
  });
  const codecErrorFiredRef = React.useRef(false);
  React.useEffect(() => {
    if (videoRecordable || codecErrorFiredRef.current) return;
    if (!declaredModes.includes("video")) return;
    codecErrorFiredRef.current = true;
    onValidationErrorRef.current?.({
      kind: "unsupported-codec",
      message: mergedLabels.videoCodecUnavailable,
    });
  }, [videoRecordable, declaredModes, mergedLabels]);

  const enabledTools = React.useMemo(
    () =>
      props.enabledTools ??
      (["text", "draw", "stickers", "filters", "adjust", "crop"] as const),
    [props.enabledTools],
  );
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
  // The loader gets the DECLARED modes: a video FILE still loads when the
  // allow-list hides the video recorder (pass-through needs no recorder).
  const enabledModesRef = React.useRef<readonly ComposerMode[]>(declaredModes);
  React.useEffect(() => {
    enabledModesRef.current = declaredModes;
  });

  // Value-based effect key: url-kind sources are idiomatically passed as
  // inline object literals (fresh identity every parent render) — keying the
  // load effect on the object identity would cancel + revoke + refetch on
  // every render, killing the loaded image mid-edit. url-kind keys by
  // content; blob/file-kind keys by the payload's identity (the wrapper
  // object may churn, the Blob/File itself doesn't).
  const initialSourceDep: string | Blob | File | null = !props.initialSource
    ? null
    : props.initialSource.kind === "url"
      ? `url|${props.initialSource.mode}|${props.initialSource.url}`
      : props.initialSource.kind === "blob"
        ? props.initialSource.blob
        : props.initialSource.file;

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
    // editor methods are stable refs from the hook; only the VALUE-keyed
    // `initialSourceDep` drives this effect (see derivation above). The
    // effect body reads props.initialSource from the render that changed the
    // key. enabledModes is read via ref above so a tools-dial toggle doesn't
    // refetch a URL source mid-edit.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialSourceDep]);

  // Camera surface: show if camera intake allowed AND at least one capture mode
  // is enabled; otherwise fall back to the base file/gallery intake surface.
  const hasCaptureMode = enabledModes.some(
    (m) => m === "photo" || m === "video",
  );
  // `cameraIntakeAvailable` is CONFIG-only (does the consumer want camera at
  // all). `captureSurfaceReady` additionally requires the capture extension
  // to actually be wired (`props.capture` → `captureExt`) — camera requested
  // but unwired degrades to the file-intake surface below (one dev-warn),
  // rather than a dead "Connect to camera" button.
  const cameraIntakeAvailable =
    mediaSources.includes("camera") && hasCaptureMode;
  const CameraSurface = captureExt?.CameraSurface ?? null;
  const captureSurfaceReady = cameraIntakeAvailable && CameraSurface !== null;

  React.useEffect(() => {
    if (!cameraIntakeAvailable) return;
    if (captureExt?.CameraSurface) return;
    devWarnOnce(
      warnedRef.current,
      "capture-extension-missing",
      'media-editor: mediaSources includes "camera" but no capture extension is wired — install @ilinxa/media-editor-capture and pass capture={mediaCapture} (MediaEditorProps.capture) to enable the camera. Falling back to file/gallery intake.',
    );
  }, [cameraIntakeAvailable, captureExt]);

  // ─── R4: Undo / redo history + discard guard ─────────────────────────

  // Command-stack scaffolding — nothing calls history.execute(), so the
  // stack is always empty. bindKeyboard stays OFF (no per-mutation command
  // layer): a live window Ctrl/Cmd+Z listener that preventDefault()s
  // page-wide while doing nothing is strictly worse than no listener. handle.undo/redo dev-warn accordingly (see the handle below).
  const history = useHistory({ capacity: 50, bindKeyboard: false });

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

  // Tool chips follow what the draft can actually do: a video draft is a plain
  // `<video>` with no tool panels, so only the tools in VIDEO_DRAFT_TOOLS show
  // (none today) instead of chips that open nothing.
  const isVideoEdit =
    editor.draft?.kind === "video" ||
    (editor.draft === null && editor.state.mode === "video");
  const visibleTools = React.useMemo(
    () =>
      isVideoEdit
        ? enabledTools.filter((t) => VIDEO_DRAFT_TOOLS.includes(t))
        : enabledTools,
    [isVideoEdit, enabledTools],
  );

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
  // `labels.presets` renames presets by id. Keyed by content so an inline
  // `labels={{ ... }}` literal does not rebuild the preset arrays every render
  // (the filter strip re-renders its thumbnails when the array identity changes).
  const presetNamesKey = JSON.stringify(presetNames ?? null);
  const names = React.useMemo(
    () => JSON.parse(presetNamesKey) as MediaEditorPresetNames | null,
    [presetNamesKey],
  );
  const resolvedStickerSets = React.useMemo(
    () =>
      renameStickerSets(
        resolveStickerSets(props.stickers, !!props.replaceBuiltinStickers),
        names?.stickerSets,
        names?.stickers,
      ),
    [props.stickers, props.replaceBuiltinStickers, names],
  );
  const resolvedFilterPresets = React.useMemo(
    () =>
      renameFilters(
        resolveFilterPresets(props.filterPresets, !!props.replaceBuiltinFilters),
        names?.filters,
      ),
    [props.filterPresets, props.replaceBuiltinFilters, names],
  );
  const resolvedFonts = React.useMemo(
    () => renameFonts(props.fonts ?? DEFAULT_FONTS, names?.fonts),
    [props.fonts, names],
  );
  const resolvedGradients = React.useMemo(
    () => renameBackgrounds(DEFAULT_TEXT_GRADIENTS, names?.backgrounds),
    [names],
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
    // Centred on the part of the image currently in view (pan / zoom aware).
    const fontFamily = resolvedFonts[0]?.family ?? "sans-serif";
    const fontSize = 40;
    const center = visibleImageCenter(stageRef.current) ?? FALLBACK_PLACEMENT;
    const box = measureTextBox(mergedLabels.textPlaceholder, fontFamily, fontSize);
    editor.addTextOverlay({
      id,
      text: mergedLabels.textPlaceholder,
      x: center.x - box.width / 2,
      y: center.y - box.height / 2,
      rotation: 0,
      scale: 1,
      fontFamily,
      fontSize,
      fill: "#ffffff",
      align: "center",
    });
    editor.setSelectedTextId(id);
    // editor methods are stable; only activeTool/selectedText/fonts drive seed.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editor.activeTool, selectedText, resolvedFonts]);

  // Sticker pick → add centred on the visible image + select for the
  // transformer (stickers are drawn centred on their x / y).
  const handleStickerPick = React.useCallback(
    (sticker: StickerOption) => {
      const id = `sticker-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      const center = visibleImageCenter(stageRef.current) ?? FALLBACK_PLACEMENT;
      editor.addSticker({
        id,
        stickerId: sticker.id,
        x: center.x,
        y: center.y,
        rotation: 0,
        scale: 1,
      });
      editor.setSelectedStickerId(id);
    },
    [editor],
  );

  // Capture surface is mounted when the editor is in capture stage AND the
  // current mode is photo/video AND a camera extension is actually wired.
  const showCameraSurface =
    editor.state.stage === "capture" &&
    captureSurfaceReady &&
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
  // P3 S3: the guard's call site moved into the capture feature's
  // EditorCamera (features/capture/parts/editor-camera.tsx) — it's a pure
  // capture concern (live-camera contention), and the base can no longer
  // statically import the hook that implements it. It now fires while the
  // camera surface is actually mounted rather than merely "configured for
  // camera" — a tighter, still-accurate trigger window. Base-alone (no
  // capture extension) never acquires a camera, so it needs no guard at all.

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
      "media-editor: enabledModes=[] AND no initialSource — editor has nothing to capture or edit. Provide an initialSource or enable at least one capture mode.",
    );
  }, [isEmptyConfig]);

  // ─── Presentation resolution (description §6) ───────────────────────

  // Resolved from the DECLARED modes: hiding video after hydration must not
  // flip the presentation (dialog -> inline) under the consumer.
  const resolved = resolvePresentation(props.presentation, declaredModes);

  // Dev-only required-prop guard: dialog mode needs isOpen + onClose.
  React.useEffect(() => {
    if (process.env.NODE_ENV === "production") return;
    if (resolved !== "dialog") return;
    if (props.isOpen === undefined || props.onClose === undefined) {
      devWarnOnce(
        warnedRef.current,
        "dialog-requires-isOpen-onClose",
        "media-editor: presentation='dialog' requires isOpen + onClose props. Falling back to uncontrolled-open behaviour for now.",
      );
    }
  }, [resolved, props.isOpen, props.onClose]);

  // ─── Export implementations (C10) ───────────────────────────────────
  // Factored out of the handle factory so the polymorphic export() can
  // dispatch by mode without a `this`-binding gotcha.

  const exportImage = React.useCallback(
    async (opts?: ExportImageOpts) => {
      const stage = stageRef.current;
      if (!stage) throw new Error("media-editor: editor canvas not ready");
      const format = opts?.format ?? "image/jpeg";
      const quality = opts?.quality ?? 0.9;
      const pixelRatio = opts?.pixelRatio ?? 2;
      const cropRect = editor.state.crop;
      // Identity-transform guard: exporting while pan/zoomed would bake the
      // viewport transform into the output (stage.toCanvas captures the
      // rendered stage). Normalize, snapshot, restore.
      const blob = await withStageIdentityTransform(stage, () =>
        exportPhotoBlob({
          stage,
          cropRect,
          mimeType: format,
          quality,
          pixelRatio,
          onProgress: opts?.onProgress,
        }),
      );
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

  // Text-only mode rasterizes the styled DOM surface (no Konva stage exists in
  // text mode) — review 1.2: without this branch, publishing a text story
  // threw "editor canvas not ready".
  const exportText = React.useCallback(
    async (opts?: ExportImageOpts) => {
      const el = textOnlyRef.current;
      if (!el || el.offsetWidth === 0 || el.offsetHeight === 0) {
        throw new Error("media-editor: text canvas not ready");
      }
      const width = el.offsetWidth;
      const height = el.offsetHeight;
      opts?.onProgress?.(0);
      const blob = await exportTextOnlyBlob(el, width, height);
      opts?.onProgress?.(1);
      return {
        blob,
        metadata: buildExportMetadata(
          editor.state,
          "text",
          width,
          height,
          "image/png",
        ),
      };
    },
    [editor.state],
  );

  // Read through a ref so an inline `labels` literal does not change the
  // handle's identity every render.
  const videoCodecUnavailableRef = React.useRef(mergedLabels.videoCodecUnavailable);
  React.useEffect(() => {
    videoCodecUnavailableRef.current = mergedLabels.videoCodecUnavailable;
  });

  const exportVideo = React.useCallback(
    async (opts?: ExportVideoOpts) => {
      const videoBlob = editor.state.videoBlob;
      if (!videoBlob) {
        throw new Error("media-editor: no video blob loaded");
      }
      // Perf-shortcut: no overlays AND no crop → return the raw blob.
      // Skips the expensive MediaRecorder re-encode for the
      // "captured then immediately published" path (chat / DM flows).
      const shortcut = !hasAnyOverlay(editor.state) && !editor.state.crop;
      if (shortcut) {
        opts?.onProgress?.(0);
        // Report the real file's size and length: the draft knows them for a
        // capture; otherwise read them from the blob's own metadata. Only when
        // that fails too do the old portrait constants stand in.
        const draft = editor.draft?.blob === videoBlob ? editor.draft : null;
        let width = draft?.width;
        let height = draft?.height;
        let durationMs = draft?.durationMs;
        if (!width || !height || durationMs === undefined) {
          const probed = await probeVideo(videoBlob);
          if (probed) {
            if (!width || !height) {
              width = probed.width;
              height = probed.height;
            }
            durationMs ??= probed.durationMs;
          }
        }
        opts?.onProgress?.(1);
        return {
          blob: videoBlob,
          metadata: buildExportMetadata(
            editor.state,
            "video",
            width && height ? width : 720,
            width && height ? height : 1280,
            // A typeless blob reports the preferred allowed output type, else the
            // long-standing WebM default.
            videoBlob.type || allowedVideoMimes?.[0] || "video/webm",
            durationMs,
          ),
        };
      }
      // Full re-encode path: bake Konva overlays into each video frame. With an
      // allow-list and no recordable match there is nothing to encode into —
      // reject instead of silently producing a format the host did not allow.
      // (An explicit per-call `opts.mimeType` still wins.)
      if (
        !opts?.mimeType &&
        allowedVideoMimes &&
        selectRecorderMime(allowedVideoMimes) === null
      ) {
        throw new Error(videoCodecUnavailableRef.current);
      }
      const stage = stageRef.current;
      const cropRect = editor.state.crop;
      const ow = cropRect?.width ?? stage?.width() ?? 720;
      const oh = cropRect?.height ?? stage?.height() ?? 1280;
      // Identity-transform guard for the per-frame overlay snapshot — same
      // viewport-baking issue as exportImage, held for the whole re-encode.
      const runComposite = () => compositeVideo({
        sourceBlob: videoBlob,
        outputWidth: Math.round(ow),
        outputHeight: Math.round(oh),
        mimeType: opts?.mimeType,
        allowedMimeTypes: allowedVideoMimes,
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
      const result = stage
        ? await withStageIdentityTransform(stage, runComposite)
        : await runComposite();
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
    [editor.state, editor.draft, allowedVideoMimes],
  );

  const exportPolymorphic = React.useCallback(
    async (opts?: ExportOpts) => {
      const mode = editor.state.mode;
      if (mode === "video") {
        return exportVideo(opts as ExportVideoOpts | undefined);
      }
      if (mode === "text") {
        return exportText(opts as ExportImageOpts | undefined);
      }
      return exportImage(opts as ExportImageOpts | undefined);
    },
    [editor.state.mode, exportImage, exportVideo, exportText],
  );

  // ─── Imperative handle ──────────────────────────────────────────────
  // Inspect / state / export / edit-overlay methods are fully wired. The
  // imperative CAPTURE methods (takePhoto / startRecording / stopRecording /
  // switchCamera / importFromGallery) are not implemented — they dev-warn
  // until then; the in-UI camera controls are the supported capture path.
  React.useImperativeHandle(
    ref,
    (): MediaEditorHandle => ({
      // === Inspect ===
      getIsDirty: () => editor.isDirty,
      getMode: () => editor.state.mode,
      getState: () => editor.state,
      loadState: (state: MediaEditorState, opts?: LoadStateOpts) => {
        const sourceBlob = opts?.sourceBlob ?? null;
        if (sourceBlob && state.mode !== "video") {
          // Re-materialize (review 1.3): a persisted snapshot's imageSrc is a
          // dead object URL once the capturing editor unmounted. Mint a fresh
          // URL from the caller-persisted source blob and rebuild the draft so
          // the canvas AND the draft-gated tool panels run as they did
          // pre-unmount. setDraft's lifecycle owns revoking the minted URL.
          const url = URL.createObjectURL(sourceBlob);
          editor.loadState({ ...state, imageSrc: url });
          editor.setDraft({
            source: "initial",
            kind: "image",
            blob: sourceBlob,
            url,
            mimeType: sourceBlob.type || "image/jpeg",
          });
        } else {
          editor.loadState(state);
        }
      },
      getSourceBlob: () =>
        editor.draft && editor.draft.kind === "image"
          ? editor.draft.blob
          : null,

      // === Capture (imperative path not implemented — dev-warns; see note above) ===
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
          devWarnOnce(
          warnedRef.current,
          "addText",
          "media-editor: handle.addText() with no argument is not implemented — pass the text: addText(text).",
        );
        }
      },
      addSticker: (sticker: StickerOption) => {
        editor.addSticker({
          // now-ok: builds an id inside an imperative handle method; never reaches markup
          id: `sticker-${Date.now()}`,
          stickerId: sticker.id,
          ...(visibleImageCenter(stageRef.current) ?? FALLBACK_PLACEMENT),
          rotation: 0,
          scale: 1,
        });
      },
      setAdjustments: (adj: Partial<ImageAdjustments>) =>
        editor.setAdjustments(adj),
      applyFilter: (name: string | null) => editor.setFilter(name),
      clearLayer: (layer: "drawing" | "stickers" | "text") =>
        editor.clearLayer(layer),
      // No execute() callers exist — the stack is always empty, so these are
      // honest (dev-warning) no-ops, not silent ones.
      undo: () => {
        devWarnOnce(warnedRef.current, "undo", NOT_WIRED_HISTORY_MARKER);
      },
      redo: () => {
        devWarnOnce(warnedRef.current, "redo", NOT_WIRED_HISTORY_MARKER);
      },

      // === Export (C10) ===
      exportImage,
      exportVideo,
      export: exportPolymorphic,

      // === Lifecycle ===
      reset: () => performReset(),
      /**
       * Dialog mode is controlled: the consumer owns `isOpen`, so the handle
       * genuinely cannot open the editor, and inline mode has nothing to open.
       * That made this a legitimate no-op — but a SILENT one, which is
       * indistinguishable from a broken method at the call site.
       *
       * It now says so, exactly as this component's capture methods already
       * do. Being unable to act is fine; being unable to act quietly is not.
       *
       * @notImplemented Set `isOpen` on the component instead.
       */
      open: () => {
        devWarnOnce(
          warnedRef.current,
          "handle-open-noop",
          "media-editor: handle.open() cannot open the editor — dialog mode is controlled, so set isOpen={true} on the component (inline mode has nothing to open).",
        );
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
      performReset,
      requestClose,
    ],
  );

  // ─── Overlay focus (F-04) ───────────────────────────────────────────
  // While a consumer `overlay` is mounted, everything BEHIND it (the editor
  // body) is `inert` — unreachable by keyboard, pointer and assistive tech —
  // so the overlay behaves as a modal layer in both presentations. The
  // overlay itself sits outside the inert wrapper. A dialog's focus trap does
  // not look at `inert`, so focus is moved into the overlay explicitly when
  // the overlay mounts and focus is not already inside it, and handed back to
  // the control that held it when the overlay goes away.
  const overlayActive = hasRenderableOverlay(props.overlay);
  const bodyRef = React.useRef<HTMLDivElement | null>(null);
  const overlayHostRef = React.useRef<HTMLDivElement | null>(null);
  const restoreFocusRef = React.useRef<HTMLElement | null>(null);
  React.useLayoutEffect(() => {
    if (!overlayActive) {
      const prev = restoreFocusRef.current;
      restoreFocusRef.current = null;
      const active = document.activeElement;
      if (
        prev &&
        prev.isConnected &&
        (active === null || active === document.body)
      ) {
        prev.focus({ preventScroll: true });
      }
      return;
    }
    const body = bodyRef.current;
    const host = overlayHostRef.current;
    if (!host) return;
    const active = document.activeElement;
    if (active instanceof HTMLElement && body?.contains(active)) {
      restoreFocusRef.current = active;
    }
    if (!(active instanceof HTMLElement) || !host.contains(active)) {
      // No reachable control inside (a read-only notice, a spinner): focus the
      // host itself so keyboard focus is not stranded on the inert body.
      focusOverlay(host);
    }
  }, [overlayActive]);

  // Dialog presentation: the dialog's focus scope (Radix FocusScope: its mount
  // effect focuses the first tabbable candidate, which ignores `inert` — that
  // lands inside the inert body, the focus() is a no-op, and it falls back to
  // focusing the dialog root) can run AFTER the layout effect above, and its
  // content may not even be mounted yet then (the portal mounts a pass later).
  // So, while an overlay is up, (a) retry the move for a couple of frames and
  // (b) pull focus back whenever it lands on the dialog root itself.
  // See node_modules/@radix-ui/react-focus-scope/dist/index.mjs (`focus(container)`).
  React.useEffect(() => {
    if (!overlayActive || resolved !== "dialog") return;
    const move = () => {
      const host = overlayHostRef.current;
      if (!host) return;
      const active = document.activeElement;
      if (active instanceof HTMLElement && host.contains(active)) return;
      focusOverlay(host);
    };
    let frame = requestAnimationFrame(() => {
      move();
      frame = requestAnimationFrame(move);
    });
    const onFocusIn = (e: FocusEvent) => {
      const host = overlayHostRef.current;
      const target = e.target;
      if (!host || !(target instanceof HTMLElement)) return;
      if (target.getAttribute("role") === "dialog" && target.contains(host)) {
        focusOverlay(host);
      }
    };
    document.addEventListener("focusin", onFocusIn);
    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener("focusin", onFocusIn);
    };
  }, [overlayActive, resolved]);

  // Dialog presentation: hand focus back to the control that opened the dialog
  // when it closes — Escape, Cancel / Discard, or the host closing it after a
  // publish. Radix returns focus only to a <DialogTrigger>, and hosts open this
  // dialog with their own button, so focus was left on <body>. The opener is
  // read in a layout effect, before the dialog's focus scope moves focus in;
  // the restore is a passive effect, so it runs after the focus scope has
  // released its trap. It only acts when focus was left on <body> or inside
  // the closing dialog (or the discard confirm), so a host that moves focus
  // itself after the close wins (its effects run after this one).
  const dialogOpen = resolved === "dialog" && (props.isOpen ?? false);
  const dialogContentRef = React.useRef<HTMLDivElement | null>(null);
  const openerRef = React.useRef<HTMLElement | null>(null);
  React.useLayoutEffect(() => {
    if (!dialogOpen) return;
    const active = document.activeElement;
    openerRef.current =
      active instanceof HTMLElement && active !== document.body ? active : null;
  }, [dialogOpen]);
  const wasDialogOpenRef = React.useRef(dialogOpen);
  React.useEffect(() => {
    const wasOpen = wasDialogOpenRef.current;
    wasDialogOpenRef.current = dialogOpen;
    if (dialogOpen || !wasOpen) return;
    const opener = openerRef.current;
    openerRef.current = null;
    if (!opener || !opener.isConnected) return;
    const active = document.activeElement;
    const stranded =
      active === null ||
      active === document.body ||
      (active instanceof HTMLElement &&
        (dialogContentRef.current?.contains(active) === true ||
          active.closest('[role="alertdialog"]') !== null));
    if (stranded) opener.focus({ preventScroll: true });
  }, [dialogOpen]);

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
      data-slot="media-editor"
      data-mode={editor.state.mode ?? "none"}
      data-stage={editor.state.stage}
      data-presentation={resolved}
      data-aspect={aspect}
    >
      {/* Editor body — `display: contents` keeps the children in the surface's
          flex/absolute layout; the wrapper exists only to carry `inert` while a
          consumer overlay is mounted (the overlay and the discard dialog stay
          outside it). */}
      <div
        ref={bodyRef}
        className="contents"
        data-slot="media-editor-body"
        inert={overlayActive}
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
        <div className="absolute top-[max(0.75rem,env(safe-area-inset-top))] start-3 z-30">
          <button
            type="button"
            onClick={backToCapture}
            aria-label={mergedLabels.backToCapture}
            className="inline-flex size-9 items-center justify-center rounded-full bg-media-overlay text-media-overlay-foreground backdrop-blur transition-colors hover:bg-media-overlay-foreground/10"
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
                {mergedLabels.emptyLoadFailed}
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
                    {` · ${mergedLabels.emptyAttempted} `}
                    <code>{sourceError.attempted}</code>
                    {` · ${mergedLabels.emptyEnabled} `}
                    <code>
                      {sourceError.enabled.join(",") || mergedLabels.emptyNone}
                    </code>
                  </>
                ) : null}
                {sourceError.kind === "unsupported-file-type" ? (
                  <>
                    {` · ${mergedLabels.emptyType} `}
                    <code>{sourceError.fileType || mergedLabels.emptyBlank}</code>
                  </>
                ) : null}
              </p>
              {props.renderEmpty ? props.renderEmpty() : null}
            </div>
          ) : isEmptyConfig ? (
            <div
              role="status"
              aria-label={mergedLabels.emptyNoSourceAria}
              className="flex flex-col items-center gap-2 p-6 text-muted-foreground"
              data-empty-config=""
            >
              {props.renderEmpty ? (
                props.renderEmpty()
              ) : (
                <>
                  <p className="font-medium text-foreground">
                    {mergedLabels.emptyNoSource}
                  </p>
                  <p className="text-[11px]">{mergedLabels.emptyNoSourceHint}</p>
                </>
              )}
            </div>
          ) : showEditCanvas ? (
            <React.Suspense
              fallback={
                <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-muted-foreground">
                  <Loader2
                    className="size-6 animate-spin text-primary"
                    aria-hidden="true"
                  />
                </div>
              }
            >
              <LazyEditorCanvas
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
                labels={mergedLabels}
                onStageReady={(s) => {
                  stageRef.current = s;
                }}
                className="h-full w-full"
              />
            </React.Suspense>
          ) : editor.state.stage === "capture" &&
            editor.state.mode === "text" &&
            enabledModes.includes("text") ? (
            <TextOnlyCanvas
              ref={textOnlyRef}
              gradients={resolvedGradients}
              fonts={resolvedFonts}
              colorPresets={resolvedColorPresets}
              labels={mergedLabels}
              value={editor.textOnly}
              onChange={(next) => editor.setTextOnly(next)}
            />
          ) : showCameraSurface && CameraSurface ? (
            <CameraSurface
              enabled={true}
              mode={editor.state.mode === "video" ? "video" : "photo"}
              defaultFacing={props.defaultFacing}
              recordAudio={props.recordAudio}
              maxFileSizeMb={props.maxFileSizeMb}
              maxVideoDurationSec={props.maxVideoDuration}
              captureAspectRatio={aspectAsRatio(aspect)}
              autoAcquireOverride={userInitiatedCamera}
              labels={mergedLabels}
              locale={locale}
              acceptMediaTypes={props.acceptMediaTypes}
              videoMimeTypes={allowedVideoMimes}
              onPhoto={handlePhoto}
              onVideo={handleVideo}
              onGalleryFile={handleGalleryFile}
              onValidationError={props.onValidationError}
              onPermissionDenied={props.onPermissionDenied}
              renderPermissionDenied={props.renderPermissionDenied}
            />
          ) : captureSurfaceReady ? (
            <div className="flex h-full w-full flex-col items-center justify-center gap-4 p-6 text-center">
              <p className="text-sm text-muted-foreground">
                {mergedLabels.connectHint}
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
                {mergedLabels.connectCamera}
              </button>
            </div>
          ) : mediaSources.includes("upload") ||
            mediaSources.includes("camera") ? (
            // Base file/gallery intake — the ONLY intake surface base-alone
            // ships (no capture extension installed), and the fallback when
            // "camera" was requested but nothing answered it (dev-warn fired
            // above). Real, not a placeholder: picking a file promotes it
            // through the SAME draft path as a camera capture would
            // (handleGalleryFile → editor.setDraft → stage "edit").
            <FileIntakeSurface
              labels={mergedLabels}
              locale={locale}
              acceptMediaTypes={props.acceptMediaTypes}
              maxFileSizeMb={props.maxFileSizeMb ?? 50}
              onFile={handleGalleryFile}
              onValidationError={props.onValidationError}
            />
          ) : (
            <>
              <p className="font-medium text-foreground">
                {mergedLabels.emptyNoCaptureSource}
              </p>
              <p>
                {mergedLabels.emptyAspect} <code>{aspect}</code>
                {` · ${mergedLabels.emptySources} `}
                <code>{mediaSources.join(",") || mergedLabels.emptyNone}</code>
              </p>
            </>
          )}
        </div>
      </div>

      {/* Bottom control overlay — edit stage only. Floats over the bottom of
          the full-bleed canvas (mirrors the camera's overlaid shutter) with a
          scrim, so the tool panel + chip row never steal the canvas's space or
          get clipped by the dialog's bottom edge.

          EXCEPTION — crop: the crop frame's bottom drag-handles live at the
          image's bottom edge, so a floating overlay would cover them (you
          couldn't grab the bottom handles). When the crop tool is active the
          controls drop INTO FLOW below the canvas instead — the canvas region
          (flex-1) shrinks to reserve the space, keeping every handle reachable.
          Other tools are sliders/inputs (no canvas-edge handles), so they keep
          the space-saving overlay. */}
      {showEditCanvas && !(isVideoEdit && visibleTools.length === 0) ? (
        <div
          className={cn(
            "flex flex-col items-stretch gap-2 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] *:pointer-events-auto",
            editor.activeTool === "crop"
              ? "relative pt-2"
              : "pointer-events-none absolute inset-x-0 bottom-0 z-20 bg-linear-to-t from-media-overlay to-transparent pt-10",
          )}
        >
          {/* Active tool panel — keyed by editor.activeTool. Renders above the
              chip-row toolbar. Image-draft tools only show on image drafts;
              video-draft trim/etc. land in R4. */}
          {editor.draft?.kind === "image" ? (
            <>
              {editor.activeTool === "text" && selectedText ? (
                <ToolPanelFrame
                  labels={mergedLabels}
                  onBack={handleBackTool}
                  onApply={handleApplyTool}
                >
                  <ToolTextInput
                    overlay={selectedText}
                    fonts={resolvedFonts}
                    colorPresets={resolvedColorPresets}
                    labels={mergedLabels}
                    locale={locale}
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
                <ToolPanelFrame
                  labels={mergedLabels}
                  onBack={handleBackTool}
                  onApply={handleApplyTool}
                >
                  <ToolStickerPicker
                    sets={resolvedStickerSets}
                    onPick={handleStickerPick}
                  />
                </ToolPanelFrame>
              ) : null}
              {editor.activeTool === "filters" && editor.draft.url ? (
                <ToolPanelFrame
                  labels={mergedLabels}
                  onBack={handleBackTool}
                  onApply={handleApplyTool}
                >
                  <ToolFilterStrip
                    presets={resolvedFilterPresets}
                    sourceUrl={editor.draft.url}
                    activeId={editor.state.filter}
                    onSelect={(id) => editor.setFilter(id)}
                  />
                </ToolPanelFrame>
              ) : null}
              {editor.activeTool === "adjust" ? (
                <ToolPanelFrame
                  labels={mergedLabels}
                  onBack={handleBackTool}
                  onApply={handleApplyTool}
                >
                  <ToolAdjustSliders
                    value={editor.state.adjustments}
                    onChange={(next) => editor.setAdjustments(next)}
                    labels={mergedLabels}
                    locale={locale}
                  />
                </ToolPanelFrame>
              ) : null}
              {editor.activeTool === "draw" ? (
                <ToolPanelFrame
                  labels={mergedLabels}
                  onBack={handleBackTool}
                  onApply={handleApplyTool}
                >
                  <ToolDrawControls
                    color={editor.drawingTool.color}
                    brushSize={editor.drawingTool.brushSize}
                    mode={editor.drawingTool.mode}
                    colorPresets={resolvedColorPresets}
                    labels={mergedLabels}
                    locale={locale}
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
                    <div className="flex flex-wrap items-center gap-1 border-e border-border pe-2">
                      {resolvedCropAspects.map((a) => (
                        <button
                          key={a}
                          type="button"
                          onClick={() => {
                            editor.setCropAspect(a);
                            editor.setCrop(null);
                          }}
                          className={cn(
                            "min-h-6 min-w-6 rounded px-2 py-0.5 text-xs font-medium transition-colors",
                            editor.cropAspect === a
                              ? "bg-primary text-primary-foreground"
                              : "border border-border bg-muted/40 text-muted-foreground hover:bg-muted hover:text-foreground",
                          )}
                        >
                          {a === "free" ? mergedLabels.cropAspectFree : a}
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
                    {mergedLabels.apply}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      editor.setCrop(null);
                      editor.setActiveTool(null);
                    }}
                    className="rounded border border-border bg-muted/40 px-3 py-1 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
                  >
                    {mergedLabels.cancel}
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
          {visibleTools.length > 0 && !isEmptyConfig ? (
            <div className="max-w-full self-center overflow-x-auto rounded-full border border-border bg-background/80 backdrop-blur [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              <div
                role="toolbar"
                aria-label={mergedLabels.editTools}
                aria-orientation="horizontal"
                className="mx-auto flex w-max items-center gap-1 p-1"
              >
                {visibleTools.map((tool) => (
                  <button
                    key={tool}
                    type="button"
                    onClick={() => editor.setActiveTool(tool)}
                    className={cn(
                      "shrink-0 rounded-full px-3 py-1 text-xs font-medium transition-colors",
                      editor.activeTool === tool
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground",
                    )}
                    data-tool={tool}
                  >
                    {toolChipLabel(tool, mergedLabels)}
                  </button>
                ))}
                {visibleTools.includes("crop") && resolvedCropAspects.length > 1 ? (
                  <span className="ms-2 shrink-0 self-center text-[10px] text-muted-foreground" dir="auto">
                    {mergedLabels.cropAspectCount(
                      resolvedCropAspects.length,
                      formatNumber(resolvedCropAspects.length, locale),
                    )}
                  </span>
                ) : null}
              </div>
            </div>
          ) : null}
        </div>
      ) : null}

      {props.renderBottomToolbar?.(slotCtx)}
      </div>

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

      {/* Consumer overlay — last child of the surface so it stacks above the
          editor and, in dialog presentation, lives inside the dialog content. */}
      {overlayActive ? (
        <div
          ref={overlayHostRef}
          // A box (not `display: contents`) so the host can take focus when the
          // overlay has no focusable control; consumers position their overlay
          // `absolute inset-0` inside it, which resolves to the same area.
          className="absolute inset-0 outline-none"
          tabIndex={-1}
          data-slot="media-editor-overlay"
          onKeyDown={wrapTabWithinOverlay}
        >
          {props.overlay}
        </div>
      ) : null}
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
        // While a consumer overlay is mounted it owns interaction: Escape, a
        // backdrop press or the dialog's own close request must not reach
        // requestClose() (discard confirm over the overlay / closing the host
        // mid-upload). Gated here, not via Radix-only props, so it holds for
        // Base UI dialogs too.
        if (!open && !overlayActive) requestClose();
      }}
    >
      <DialogContent
        ref={dialogContentRef}
        showCloseButton={false}
        className={cn(
          // Mobile: edge-to-edge fullscreen. Defeat shadcn base centering
          // (top-1/2 left-1/2 + -translate-x/y-1/2) so the dialog anchors at 0,0.
          // dir-ok: Dialog centring (left:50% + -translate-x-1/2) must stay physical in any direction; the gate cannot see it through the ! prefix
          "!fixed !inset-0 !top-0 !left-0 !translate-x-0 !translate-y-0",
          "!max-w-none gap-0 overflow-hidden p-0",
          "h-[100dvh] w-screen !rounded-none",
          // Desktop: restore viewport-centered positioning. !inset-auto cancels
          // the mobile !inset-0 so top/left:50% can land.
          // dir-ok: Dialog centring (left:50% + -translate-x-1/2) must stay physical in any direction; the gate cannot see it through the ! prefix
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
 * Base file/gallery intake surface (P3 S3 — part B). The ONLY intake path
 * base-alone ships once the capture feature slice is a separate install:
 * a button + a hidden `<input type="file">`, honoring `maxFileSizeMb` via
 * `validateGalleryFile` (same validation the capture feature's gallery
 * button used pre-split). Matches the existing "Connect to camera" chrome —
 * no new visual language.
 */
function FileIntakeSurface({
  labels,
  locale,
  acceptMediaTypes,
  maxFileSizeMb,
  onFile,
  onValidationError,
}: {
  labels: MediaEditorResolvedLabels;
  locale?: string;
  maxFileSizeMb: number;
  acceptMediaTypes?: string[];
  onFile: (file: File) => void;
  onValidationError?: (error: ValidationError) => void;
}) {
  const inputRef = React.useRef<HTMLInputElement | null>(null);
  return (
    <div
      className="flex h-full w-full flex-col items-center justify-center gap-4 p-6 text-center"
      data-intake-surface="file"
    >
      <p className="text-sm text-muted-foreground">
        {labels.intakePrompt}
      </p>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="rounded-full bg-primary px-5 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
      >
        {labels.galleryPicker}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept={acceptAttribute(acceptMediaTypes)}
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = ""; // reset so picking the same file twice re-fires
          if (!file) return;
          const err = validateGalleryFile(file, maxFileSizeMb, {
            labels,
            locale,
            acceptMediaTypes,
          });
          if (err) {
            onValidationError?.(err);
            return;
          }
          onFile(file);
        }}
        hidden
        className="hidden"
      />
    </div>
  );
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
  labels,
  onBack,
  onApply,
  children,
}: {
  labels: MediaEditorResolvedLabels;
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
          {labels.back}
        </button>
        <button
          type="button"
          onClick={onApply}
          className="rounded bg-primary px-3 py-1 text-xs font-medium text-primary-foreground hover:opacity-90"
        >
          {labels.apply}
        </button>
      </div>
      {children}
    </div>
  );
}

/** Chip label for an edit tool — routed through the labels prop (i18n). */
function toolChipLabel(
  tool: EditTool,
  labels: MediaEditorResolvedLabels,
): string {
  switch (tool) {
    case "text":
      return labels.toolText;
    case "draw":
      return labels.toolDraw;
    case "stickers":
      return labels.toolStickers;
    case "filters":
      return labels.toolFilters;
    case "adjust":
      return labels.toolAdjust;
    case "crop":
      return labels.toolCrop;
  }
}

/**
 * Run `fn` with the stage temporarily at the identity transform (scale 1,
 * position 0,0), restoring the prior pan/zoom afterwards. Export snapshots
 * (stage.toCanvas) capture the RENDERED stage — exporting while zoomed/panned
 * would bake the viewport into the output.
 */
async function withStageIdentityTransform<T>(
  stage: Konva.Stage,
  fn: () => Promise<T>,
): Promise<T> {
  const prior = {
    x: stage.x(),
    y: stage.y(),
    scaleX: stage.scaleX(),
    scaleY: stage.scaleY(),
  };
  if (
    prior.x === 0 &&
    prior.y === 0 &&
    prior.scaleX === 1 &&
    prior.scaleY === 1
  ) {
    return fn();
  }
  stage.scale({ x: 1, y: 1 });
  stage.position({ x: 0, y: 0 });
  stage.batchDraw();
  try {
    return await fn();
  } finally {
    stage.scale({ x: prior.scaleX, y: prior.scaleY });
    stage.position({ x: prior.x, y: prior.y });
    stage.batchDraw();
  }
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

// ─── Tail type re-exports (cross-procomp consumers) ──────────────────────────
// Procomps that compose media-editor must import these types from THIS
// component-file path, not `./types`: the shadcn path rewriter preserves the
// component-file path but mangles `/types` cross-procomp imports (F-S1).
export type {
  MediaEditorProps,
  MediaEditorHandle,
  MediaEditorState,
  ExportMetadata,
  InitialSource,
  ComposerMode,
  EditTool,
  MediaSource,
  AspectRatio,
  LoadStateOpts,
} from "./types";
