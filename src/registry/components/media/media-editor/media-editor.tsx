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
import { renderPhoto } from "./lib/export-blob";
import { exportTextCardBlob } from "./lib/text-card-export";
import {
  MAX_OUTPUT_PIXELS,
  computeExportGeometry,
} from "./lib/export-geometry";
import { cropAspectToRatio } from "./lib/crop-aspect";
import { mapToFrame, remapForCrop } from "./lib/frame-map";
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
  fitTextInArea,
  measureTextBox,
  visibleImageArea,
  visibleImageCenter,
} from "./lib/placement";
import type {
  AspectRatio,
  ComposerMode,
  CropAspect,
  CropRect,
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
  PlacedSticker,
  SourceError,
  StateFrame,
  StickerOption,
  TextOverlay,
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
  // `cropAspects` is keyed by content (like `videoOutput.mimeTypes`) so an inline
  // array literal neither re-resolves every render nor re-fires the invalid-entry
  // dev warning; the resolved list is memoised once for both consumers below.
  const aspect = props.aspect ?? "free";
  const cropAspectsKey = props.cropAspects ? props.cropAspects.join("\n") : null;
  const declaredCropAspects = React.useMemo(
    () =>
      cropAspectsKey === null
        ? undefined
        : cropAspectsKey === ""
          ? ([] as CropAspect[])
          : (cropAspectsKey.split("\n") as CropAspect[]),
    [cropAspectsKey],
  );
  const resolvedCropAspects = React.useMemo(
    () => resolveCropAspects(aspect, declaredCropAspects),
    [aspect, declaredCropAspects],
  );
  const initialCropAspect = resolvedCropAspects[0] ?? "free";

  // `labels.presets` renames presets by id. Keyed by content so an inline
  // `labels={{ ... }}` literal does not rebuild the preset arrays every render
  // (the filter strip re-renders its thumbnails when the array identity changes).
  // Derived above the state hook: the hook syncs the text card's background
  // from these same presets.
  const presetNamesKey = JSON.stringify(props.labels?.presets ?? null);
  const names = React.useMemo(
    () => JSON.parse(presetNamesKey) as MediaEditorPresetNames | null,
    [presetNamesKey],
  );
  const resolvedGradients = React.useMemo(
    () => renameBackgrounds(DEFAULT_TEXT_GRADIENTS, names?.backgrounds),
    [names],
  );

  const editor = useMediaEditorState({
    defaultMode,
    defaultCropAspect: initialCropAspect,
    gradients: resolvedGradients,
    onDirtyChange: props.onDirtyChange,
  });

  const warnedRef = React.useRef<Set<string>>(new Set());

  // ─── Modified flag (0.6.0) ──────────────────────────────────────────
  // "Content changed since the source loaded". The ref is the synchronous
  // truth (a handle read right after a change must see it); the state mirrors
  // it for the slot context. Cleared by every source load and by reset.
  const [modified, setModified] = React.useState(false);
  const modifiedRef = React.useRef(false);

  // ─── Commit tracking (0.6.0 fix wave) ───────────────────────────────
  // Working copies (refs) are updated synchronously by handlers; React state
  // commits later. "Settled" must also mean the state a change dispatched has
  // COMMITTED, so every dispatch that matters (a content change, a remap, a
  // baseline change, a load) bumps a tick and sets `awaitingCommitRef`; the
  // layout effect below clears it once the render containing the change has
  // committed, and records the state / frame that render shows.
  const [, setSyncTick] = React.useState(0);
  const awaitingCommitRef = React.useRef(false);
  const bumpCommit = React.useCallback(() => {
    awaitingCommitRef.current = true;
    setSyncTick((t) => t + 1);
  }, []);
  const committedRef = React.useRef<MediaEditorState>(editor.state);
  /** The frame recorded with the committed state (never ahead of it). */
  const committedFrameRef = React.useRef<StateFrame | undefined>(undefined);

  const markModified = React.useCallback(() => {
    modifiedRef.current = true;
    setModified(true);
    bumpCommit();
  }, [bumpCommit]);
  const setModifiedFlag = React.useCallback((value: boolean) => {
    modifiedRef.current = value;
    setModified(value);
  }, []);
  const clearModified = React.useCallback(() => setModifiedFlag(false), [setModifiedFlag]);
  /** The media came from the camera / file picker in this session (not re-loadable). */
  const capturedRef = React.useRef(false);
  /** Bumped by every source load / reset: a stale crop Apply compares it and gives up. */
  const sourceEpochRef = React.useRef(0);
  /** Crop Applies in flight (encoding the cropped image). */
  const applyInFlightRef = React.useRef(0);
  /** True while `initialSource` is being fetched / decoded. */
  const sourceLoadingRef = React.useRef(props.initialSource != null);

  // ─── Canvas bookkeeping (0.6.0) ─────────────────────────────────────
  // Konva stage handle (C10 export wiring): EditorCanvas surfaces its
  // Konva.Stage via onStageReady; the export methods snapshot it.
  const stageRef = React.useRef<Konva.Stage | null>(null);
  const stageSizeRef = React.useRef<{ width: number; height: number } | null>(null);
  /** The photo's displayed rect on the stage, as last reported by the canvas. */
  const mediaRectRef = React.useRef<CropRect | null>(null);
  /** URL of the image the canvas last painted, its natural size, and the last load failure. */
  const paintedUrlRef = React.useRef<string | null>(null);
  /** The Konva stage that painted it: a remounted canvas (new stage) is unsettled until it paints again. */
  const paintedStageRef = React.useRef<Konva.Stage | null>(null);
  const naturalRef = React.useRef<{ width: number; height: number } | null>(null);
  const errorUrlRef = React.useRef<string | null>(null);
  const [mediaRatio, setMediaRatio] = React.useState<number | null>(null);
  /** The layout the snapshot's coordinates are currently in (+ the image it was measured for). */
  const frameRef = React.useRef<StateFrame | null>(null);
  const frameUrlRef = React.useRef<string | null>(null);
  /** Remaps waiting for the new image's media rect (crop Apply / loadState with a frame). */
  const pendingCropRef = React.useRef<{ url: string; cropInMedia: CropRect } | null>(null);
  const pendingLoadRef = React.useRef<{ url: string | null; frame: StateFrame } | null>(null);
  /** The image URL the editor is about to show (set synchronously by Apply / loadState). */
  const overrideUrlRef = React.useRef<string | null>(null);
  /** The image URL the canvas should be showing; null when no photo is expected. */
  const targetUrlRef = React.useRef<string | null>(null);
  const transformRef = React.useRef(editor.transformState);
  const snapshotCacheRef = React.useRef<{
    base: MediaEditorState;
    frame: StateFrame;
    out: MediaEditorState;
  } | null>(null);
  const mountedRef = React.useRef(true);
  React.useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // ─── Labels ─────────────────────────────────────────────────────────
  // DEFAULT_LABELS (the single English source) merged with the consumer's
  // nested labels; flat keys (deprecated) are still accepted and win.
  const mergedLabels: MediaEditorResolvedLabels = React.useMemo(
    () => resolveEditorLabels(props.labels),
    [props.labels],
  );
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

  // ─── Settle core (0.6.0) ────────────────────────────────────────────
  // "Settled" = the canvas shows the current source AND nothing that moves the
  // snapshot is in flight: no source fetch / decode, no crop Apply encoding, no
  // overlay remap waiting for the new media rect, and the state those produced
  // has committed. Declared before the effects / handlers that touch it.
  const waitersRef = React.useRef<Set<SettleWaiter>>(new Set());
  const settleStatus = React.useCallback((): "settled" | "pending" | "error" => {
    const target = targetUrlRef.current;
    if (target !== null && errorUrlRef.current === target) return "error";
    if (
      sourceLoadingRef.current ||
      applyInFlightRef.current > 0 ||
      awaitingCommitRef.current ||
      pendingCropRef.current !== null
    ) {
      return "pending";
    }
    const pendingLoad = pendingLoadRef.current;
    // A load with no image (video / text) can only remap once a stage reports.
    if (pendingLoad && (pendingLoad.url !== null || stageSizeRef.current !== null)) {
      return "pending";
    }
    if (target !== null) {
      const stage = stageRef.current;
      if (
        paintedUrlRef.current !== target ||
        stage === null ||
        paintedStageRef.current !== stage
      ) {
        return "pending";
      }
    }
    return "settled";
  }, []);
  const checkWaiters = React.useCallback(() => {
    const status = settleStatus();
    if (status === "pending") return;
    for (const w of [...waitersRef.current]) {
      waitersRef.current.delete(w);
      clearTimeout(w.timer);
      if (status === "error") {
        w.reject(new Error(loadErrorMessage(targetUrlRef.current ?? "")));
      } else {
        w.resolve();
      }
    }
  }, [settleStatus]);

  // adjust-change: one trailing-debounced action per slider gesture. Not
  // driven by the slider's own commit event (Radix onValueCommit): consumers
  // may run Base UI. `flushAdjust` emits now (an export, Apply); `dropAdjust`
  // forgets the pending gesture (a reset / load / new source replaced what it
  // described).
  const adjustPatchRef = React.useRef<Partial<ImageAdjustments>>({});
  const adjustTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const flushAdjust = React.useCallback(() => {
    if (adjustTimerRef.current !== null) clearTimeout(adjustTimerRef.current);
    adjustTimerRef.current = null;
    const patch = adjustPatchRef.current;
    adjustPatchRef.current = {};
    if (Object.keys(patch).length > 0) {
      emitEditAction({ kind: "adjust-change", patch });
    }
  }, [emitEditAction]);
  const dropAdjust = React.useCallback(() => {
    if (adjustTimerRef.current !== null) clearTimeout(adjustTimerRef.current);
    adjustTimerRef.current = null;
    adjustPatchRef.current = {};
  }, []);
  React.useEffect(
    () => () => {
      if (adjustTimerRef.current !== null) clearTimeout(adjustTimerRef.current);
    },
    [],
  );

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
      sourceLoadingRef.current = false;
      checkWaiters();
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSourceError(null);
      return;
    }

    let cancelled = false;
    let allocatedUrl: string | null = null;
    // Fetching / decoding: not settled until the source lands (or fails).
    sourceLoadingRef.current = true;

    (async () => {
      const result = await loadInitialSource(source, enabledModesRef.current);
      if (cancelled) {
        if (result.ok) URL.revokeObjectURL(result.loaded.objectUrl);
        return;
      }
      if (!result.ok) {
        sourceLoadingRef.current = false;
        setSourceError(result.error);
        onInitialSourceErrorRef.current?.(result.error);
        checkWaiters();
        return;
      }
      allocatedUrl = result.loaded.objectUrl;
      // A new source: it supersedes the pending adjust gesture, any crop Apply
      // in flight and a stale image override, and it is not a capture.
      sourceEpochRef.current += 1;
      capturedRef.current = false;
      dropAdjust();
      overrideUrlRef.current =
        result.loaded.mode === "photo" ? result.loaded.objectUrl : null;
      if (result.loaded.mode === "photo") {
        targetUrlRef.current = result.loaded.objectUrl;
      }
      sourceLoadingRef.current = false;
      bumpCommit();
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
      clearModified();
      pendingCropRef.current = null;
      pendingLoadRef.current = null;
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
  // Control that held focus when the discard confirm opened; "Keep editing"
  // hands focus back to it (Radix would return it to a trigger, and there is none).
  // `undefined` = nothing pending; `null` = nothing held focus (restore to the surface).
  const discardReturnFocusRef = React.useRef<HTMLElement | null | undefined>(undefined);
  const textOnlyRef = React.useRef<HTMLDivElement | null>(null);

  // Run a clean reset that also drops the history stack. Emits the `reset`
  // edit-action centrally so every reset path (handle.reset, back-to-capture,
  // discard-confirm) reports it once.
  const performReset = React.useCallback(() => {
    editor.reset();
    history.reset();
    clearModified();
    capturedRef.current = false;
    sourceEpochRef.current += 1;
    dropAdjust();
    pendingCropRef.current = null;
    pendingLoadRef.current = null;
    overrideUrlRef.current = null;
    bumpCommit();
    emitEditAction({ kind: "reset" });
  }, [editor, history, emitEditAction, clearModified, dropAdjust, bumpCommit]);

  // Close path with confirm-on-discard. Mirrors v0.1.5 Q-P10a:
  //   - In dialog mode, fires onClose unless modified (then shows confirm).
  //   - In inline mode, just lets the consumer know via onClose (no UI
  //     close to perform).
  const requestClose = React.useCallback(() => {
    // A capture / file pick cannot be re-loaded, so discarding it asks even
    // before any edit; an `initialSource` / `loadState` stays recoverable.
    if (
      props.confirmOnDiscard !== false &&
      (modifiedRef.current || capturedRef.current)
    ) {
      const active = document.activeElement;
      discardReturnFocusRef.current =
        active instanceof HTMLElement &&
        active !== document.body &&
        active.closest('[role="alertdialog"]') === null
          ? active
          : null;
      setShowDiscardConfirm(true);
      return;
    }
    props.onClose?.();
  }, [props]);

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

  // ─── Settled + frame tracking (0.6.0) ───────────────────────────────
  // The canvas reports what it painted (`onImagePainted`), failed to load
  // (`onImageError`) and where the photo sits on the stage (`onMediaRect`).
  // "Settled" = the painted image is the one the editor is showing.
  const canvasImageUrl =
    editor.draft?.kind === "image" ? editor.draft.url : editor.state.imageSrc;
  const expectedUrl =
    showEditCanvas && editor.state.mode === "photo" ? canvasImageUrl : null;

  React.useLayoutEffect(() => {
    // The render that just committed: record the state / frame it shows (what
    // `getState()` and an awaiting export read), then settle waiters.
    committedRef.current = editor.state;
    committedFrameRef.current = frameRef.current ?? undefined;
    awaitingCommitRef.current = false;
    if (overrideUrlRef.current !== null && overrideUrlRef.current === expectedUrl) {
      overrideUrlRef.current = null;
    }
    targetUrlRef.current = overrideUrlRef.current ?? expectedUrl;
    checkWaiters();
  });
  React.useEffect(() => {
    const waiters = waitersRef.current;
    return () => {
      for (const w of waiters) {
        clearTimeout(w.timer);
        w.reject(new Error("media-editor: unmounted while waiting for the image"));
      }
      waiters.clear();
    };
  }, []);

  const isSettled = React.useCallback(() => settleStatus() === "settled", [settleStatus]);
  const whenSettled = React.useCallback(
    (opts?: { timeoutMs?: number }) =>
      new Promise<void>((resolve, reject) => {
        const status = settleStatus();
        if (status === "settled") {
          resolve();
          return;
        }
        if (status === "error") {
          reject(new Error(loadErrorMessage(targetUrlRef.current ?? "")));
          return;
        }
        const timeoutMs = opts?.timeoutMs ?? 10000;
        const waiter: SettleWaiter = {
          resolve,
          reject,
          timer: setTimeout(() => {
            waitersRef.current.delete(waiter);
            reject(
              new Error(
                `media-editor: the image was not painted within ${timeoutMs} ms`,
              ),
            );
          }, timeoutMs),
        };
        waitersRef.current.add(waiter);
      }),
    [settleStatus],
  );

  // Overlay / stroke / crop coordinates are stage px. Keep them on the same
  // picture content when the layout under them changes:
  //   (a) same image, new stage size / media rect (resize, rotate, crop panel
  //       open / close) -> mapToFrame(old -> new);
  //   (b) crop Apply -> remapForCrop once the cropped image is painted;
  //   (c) loadState with a frame -> mapToFrame(state.frame -> current) once the
  //       loaded image's media rect is known.
  // (b) and (c) wait for the paint and block (a) meanwhile. None of them is a
  // modification and none emits an EditAction.
  const setBaseline = React.useCallback(
    (cur: StateFrame, url: string | null) => {
      if (!frameRef.current || !sameFrame(frameRef.current, cur)) {
        frameRef.current = cur;
        // `getState()` reads the frame recorded with the committed state: make
        // sure a render commits it.
        bumpCommit();
      }
      frameUrlRef.current = url;
    },
    [bumpCommit],
  );
  /** Run a remap inside the reducer and mark the editor unsettled until it commits. */
  const dispatchRemap = React.useCallback(
    (fn: (st: MediaEditorState) => MediaEditorState) => {
      transformRef.current(fn);
      bumpCommit();
    },
    [bumpCommit],
  );
  const runLayoutSync = React.useCallback(() => {
    const size = stageSizeRef.current;
    if (!size) return;
    const media = mediaRectRef.current;
    const cur: StateFrame = {
      stageWidth: size.width,
      stageHeight: size.height,
      ...(media ? { media } : {}),
    };
    const pendingCrop = pendingCropRef.current;
    if (pendingCrop) {
      if (paintedUrlRef.current === pendingCrop.url && media) {
        pendingCropRef.current = null;
        const { cropInMedia } = pendingCrop;
        dispatchRemap((st) => remapForCrop(st, cropInMedia, media));
        setBaseline(cur, pendingCrop.url);
      }
      return;
    }
    const pendingLoad = pendingLoadRef.current;
    if (pendingLoad) {
      const ready =
        pendingLoad.url === null ||
        (paintedUrlRef.current === pendingLoad.url && media !== null);
      if (ready) {
        pendingLoadRef.current = null;
        const to: StateFrame =
          pendingLoad.url === null
            ? { stageWidth: size.width, stageHeight: size.height }
            : cur;
        const from = pendingLoad.frame;
        dispatchRemap((st) => mapToFrame(st, from, to));
        setBaseline(to, pendingLoad.url);
      }
      return;
    }
    const prev = frameRef.current;
    const url = targetUrlRef.current;
    if (prev && frameUrlRef.current === url) {
      // The photo's rect vanished for the SAME source (a hidden / 0x0 container
      // reports no media): keep the baseline so the next real layout maps from it.
      if (prev.media && !cur.media) return;
      if (!sameFrame(prev, cur)) {
        dispatchRemap((st) => mapToFrame(st, prev, cur));
      }
    }
    setBaseline(cur, url);
  }, [setBaseline, dispatchRemap]);
  // Coalesced to a microtask: the canvas reports from its own effects, which
  // may run before this component's layout effect has recorded the new target.
  const syncScheduledRef = React.useRef(false);
  const scheduleLayoutSync = React.useCallback(() => {
    if (syncScheduledRef.current) return;
    syncScheduledRef.current = true;
    queueMicrotask(() => {
      syncScheduledRef.current = false;
      if (mountedRef.current) runLayoutSync();
    });
  }, [runLayoutSync]);

  // The canvas calls this with `null` then the stage on every render (inline
  // ref), so nothing is cleared here: "painted" is compared by stage identity.
  const handleStageReady = React.useCallback((st: Konva.Stage | null) => {
    stageRef.current = st;
  }, []);
  const handleStageSize = React.useCallback(
    (size: { width: number; height: number }) => {
      if (size.width <= 0 || size.height <= 0) return;
      stageSizeRef.current = size;
      scheduleLayoutSync();
    },
    [scheduleLayoutSync],
  );
  const handleMediaRect = React.useCallback(
    (rect: CropRect | null) => {
      mediaRectRef.current = rect;
      scheduleLayoutSync();
    },
    [scheduleLayoutSync],
  );
  const handleImagePainted = React.useCallback(
    (url: string, natural: { width: number; height: number }) => {
      paintedUrlRef.current = url;
      paintedStageRef.current = stageRef.current;
      naturalRef.current = natural;
      if (errorUrlRef.current === url) errorUrlRef.current = null;
      setMediaRatio(
        natural.width > 0 && natural.height > 0
          ? natural.width / natural.height
          : null,
      );
      scheduleLayoutSync();
      checkWaiters();
    },
    [scheduleLayoutSync, checkWaiters],
  );
  const handleImageError = React.useCallback(
    (url: string) => {
      errorUrlRef.current = url;
      if (pendingCropRef.current?.url === url) pendingCropRef.current = null;
      if (pendingLoadRef.current?.url === url) pendingLoadRef.current = null;
      checkWaiters();
    },
    [checkWaiters],
  );
  /** The frame recorded with the committed state, else the live layout. */
  const currentFrame = React.useCallback((): StateFrame | undefined => {
    if (committedFrameRef.current) return committedFrameRef.current;
    const size = stageSizeRef.current;
    if (!size) return undefined;
    const media = mediaRectRef.current;
    return {
      stageWidth: size.width,
      stageHeight: size.height,
      ...(media ? { media } : {}),
    };
  }, []);

  // ─── Edit-action commits (0.6.0) ────────────────────────────────────
  // Every committed content change marks the editor modified; most also emit
  // one EditAction. Loading a source emits / marks nothing.
  const commitTextUpdate = (next: TextOverlay) => {
    const cur = editor.state.textOverlays.find((o) => o.id === next.id);
    editor.updateTextOverlay(next.id, next);
    markModified();
    if (!cur) return;
    const patch = shallowPatch(cur, next);
    if (Object.keys(patch).length > 0) {
      emitEditAction({ kind: "text-update", id: next.id, patch });
    }
  };
  const commitTextRemove = (id: string) => {
    editor.removeTextOverlay(id);
    markModified();
    emitEditAction({ kind: "text-remove", id });
  };
  const commitFilter = React.useCallback(
    (name: string | null) => {
      editor.setFilter(name);
      markModified();
      emitEditAction({ kind: "filter-apply", name });
    },
    [editor, markModified, emitEditAction],
  );
  const commitAdjust = (next: ImageAdjustments) => {
    const patch = shallowPatch(editor.state.adjustments, next);
    editor.setAdjustments(next);
    markModified();
    if (Object.keys(patch).length === 0) return;
    adjustPatchRef.current = { ...adjustPatchRef.current, ...patch };
    if (adjustTimerRef.current !== null) clearTimeout(adjustTimerRef.current);
    adjustTimerRef.current = setTimeout(flushAdjust, ADJUST_DEBOUNCE_MS);
  };

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

  // A camera / file-picker source: a new source (supersedes adjust gesture, crop
  // Apply in flight, remaps, a stale image override), flagged as a capture so the
  // dialog's discard confirm covers it even before any edit.
  const beginCapturedSource = React.useCallback(() => {
    clearModified();
    capturedRef.current = true;
    sourceEpochRef.current += 1;
    dropAdjust();
    pendingCropRef.current = null;
    pendingLoadRef.current = null;
    overrideUrlRef.current = null;
    bumpCommit();
  }, [clearModified, dropAdjust, bumpCommit]);

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
      beginCapturedSource();
    },
    [editor, beginCapturedSource],
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
      beginCapturedSource();
    },
    [editor, beginCapturedSource],
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
      beginCapturedSource();
    },
    [editor, beginCapturedSource],
  );

  // ─── R3: Tool-panel resolved data ─────────────────────────────────
  // (`names` / `resolvedGradients` are derived above the state hook.)
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
      markModified();
      emitEditAction({ kind: "draw-stroke", stroke: currentDrawingStroke });
    }
    setCurrentDrawingStroke(null);
  }, [currentDrawingStroke, editor, markModified, emitEditAction]);

  // Tool-panel state snapshot: captures editor.state at the moment the user
  // enters a tool (activeTool flips from null → tool) so a "Back" button can
  // revert any in-tool changes. Cleared on tool exit so re-entering captures
  // a fresh baseline.
  // The entry also records the layout the snapshot's coordinates were in and
  // the modified flag, so Back can put both back (a Back is not a modification
  // and must not leave coordinates behind a resize that happened meanwhile).
  const toolEntrySnapshot = React.useRef<{
    state: MediaEditorState;
    frame: StateFrame | undefined;
    modified: boolean;
  } | null>(null);
  const prevActiveToolRef = React.useRef<EditTool | null>(null);
  React.useEffect(() => {
    const prev = prevActiveToolRef.current;
    const curr = editor.activeTool;
    if (prev === null && curr !== null) {
      toolEntrySnapshot.current = {
        state: editor.state,
        frame: committedFrameRef.current,
        modified: modifiedRef.current,
      };
    } else if (curr === null) {
      toolEntrySnapshot.current = null;
    }
    prevActiveToolRef.current = curr;
    // editor.state is read intentionally at entry; deps only on activeTool.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editor.activeTool]);

  const handleApplyTool = React.useCallback(() => {
    flushAdjust();
    editor.setSelectedTextId(null);
    editor.setSelectedStickerId(null);
    editor.setActiveTool(null);
  }, [editor, flushAdjust]);
  const handleBackTool = React.useCallback(() => {
    dropAdjust();
    const entry = toolEntrySnapshot.current;
    if (entry) {
      // Items that exist now but not at entry go away: tell the host.
      const now = committedRef.current;
      const hadText = new Set(entry.state.textOverlays.map((o) => o.id));
      const hadSticker = new Set(entry.state.stickers.map((x) => x.id));
      const removedText = now.textOverlays.filter((o) => !hadText.has(o.id));
      const removedStickers = now.stickers.filter((x) => !hadSticker.has(x.id));
      // The entry snapshot is in the entry frame; map it onto the layout now.
      const live = currentFrame();
      const restored =
        entry.frame && live
          ? mapToFrame(entry.state, entry.frame, live)
          : entry.state;
      editor.loadState(restored);
      setModifiedFlag(entry.modified);
      bumpCommit();
      for (const o of removedText) emitEditAction({ kind: "text-remove", id: o.id });
      for (const x of removedStickers) {
        emitEditAction({ kind: "sticker-remove", id: x.id });
      }
    }
    editor.setSelectedTextId(null);
    editor.setSelectedStickerId(null);
    editor.setActiveTool(null);
  }, [editor, dropAdjust, currentFrame, setModifiedFlag, bumpCommit, emitEditAction]);

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
    // Centred on the part of the image currently in view (pan / zoom aware),
    // and fully inside it: on a narrow stage the placeholder can be wider than
    // the picture, so the starting size shrinks to fit.
    const fontFamily = resolvedFonts[0]?.family ?? "sans-serif";
    const area = visibleImageArea(stageRef.current);
    const measure = (size: number) =>
      measureTextBox(mergedLabels.textPlaceholder, fontFamily, size);
    const placed = area
      ? fitTextInArea(area, 40, measure)
      : (() => {
          const box = measure(40);
          return {
            x: FALLBACK_PLACEMENT.x - box.width / 2,
            y: FALLBACK_PLACEMENT.y - box.height / 2,
            fontSize: 40,
          };
        })();
    const fontSize = placed.fontSize;
    const overlay: TextOverlay = {
      id,
      text: mergedLabels.textPlaceholder,
      x: placed.x,
      y: placed.y,
      rotation: 0,
      scale: 1,
      fontFamily,
      fontSize,
      fill: "#ffffff",
      align: "center",
    };
    editor.addTextOverlay(overlay);
    markModified();
    emitEditAction({ kind: "text-add", overlay });
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
      const placed: PlacedSticker = {
        id,
        stickerId: sticker.id,
        x: center.x,
        y: center.y,
        rotation: 0,
        scale: 1,
      };
      editor.addSticker(placed);
      markModified();
      emitEditAction({ kind: "sticker-add", placed });
      editor.setSelectedStickerId(id);
    },
    [editor, markModified, emitEditAction],
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
      // A crop Apply / loadState / first load swaps the source asynchronously;
      // exporting before the canvas shows it would produce a blank (or stale)
      // image, so wait for it. A pending adjust gesture is reported first.
      flushAdjust();
      await whenSettled();
      // Everything below reads the state the settled render COMMITTED (a ref),
      // never the closure of the call: a crop Apply / loadState remap may have
      // landed during the wait.
      const committed = committedRef.current;
      const stage = stageRef.current;
      if (!stage) throw new Error("media-editor: editor canvas not ready");
      if (!paintedUrlRef.current) {
        throw new Error(
          "media-editor: no image is painted on the canvas — nothing to export",
        );
      }
      const format = opts?.format ?? "image/jpeg";
      const quality = opts?.quality ?? 0.9;
      const geometry = computeExportGeometry({
        stage: { width: stage.width(), height: stage.height() },
        media: mediaRectRef.current,
        crop: committed.crop,
        naturalWidth: naturalRef.current?.width,
        opts: {
          region: opts?.region,
          pixelRatio: opts?.pixelRatio,
          width: opts?.width,
          height: opts?.height,
          maxEdge: opts?.maxEdge,
        },
      });
      // Identity-transform guard: exporting while pan/zoomed would bake the
      // viewport transform into the output (stage.toCanvas captures the
      // rendered stage). Normalize, snapshot, restore.
      const rendered = await withStageIdentityTransform(stage, () =>
        renderPhoto({
          stage,
          rect: geometry.rect,
          pixelRatio: geometry.pixelRatio,
          width: geometry.width,
          height: geometry.height,
          mimeType: format,
          quality,
          backgroundColor: opts?.backgroundColor ?? props.canvasBackground,
          onProgress: opts?.onProgress,
        }),
      );
      return {
        blob: rendered.blob,
        metadata: buildExportMetadata(
          committed,
          "photo",
          rendered.width,
          rendered.height,
          format,
          undefined,
          { frame: currentFrame() },
        ),
      };
    },
    [whenSettled, flushAdjust, currentFrame, props.canvasBackground],
  );

  // Text-only mode draws the text card with Canvas 2D (no Konva stage exists
  // in text mode) — review 1.2: without this branch, publishing a text story
  // threw "editor canvas not ready".
  const exportText = React.useCallback(
    async (opts?: ExportImageOpts) => {
      flushAdjust();
      const el = textOnlyRef.current;
      if (!el || el.offsetWidth === 0 || el.offsetHeight === 0) {
        throw new Error("media-editor: text canvas not ready");
      }
      // Measure the live text surface so the card is drawn the way the preview
      // shows it (font size is viewport-relative, the box is capped, RTL).
      const input = el.querySelector<HTMLTextAreaElement>(
        '[data-slot="textcard-input"]',
      );
      const measured = measureTextInput(input);
      const width = el.offsetWidth;
      const height = el.offsetHeight;
      const mimeType = opts?.format ?? "image/png";
      // Size options turn into a pixel ratio on the card (width wins over
      // height; maxEdge caps the result, never scaling up).
      let pixelRatio = opts?.pixelRatio ?? 2;
      if (opts?.width) pixelRatio = opts.width / width;
      else if (opts?.height) pixelRatio = opts.height / height;
      if (opts?.maxEdge) {
        pixelRatio = Math.min(pixelRatio, opts.maxEdge / Math.max(width, height));
      }
      // The same canvas-area cap as photo exports (iOS limit).
      if (width * pixelRatio * height * pixelRatio > MAX_OUTPUT_PIXELS) {
        pixelRatio = Math.sqrt(MAX_OUTPUT_PIXELS / (width * height));
      }
      opts?.onProgress?.(0);
      const result = await exportTextCardBlob({
        textOnly: editor.textOnly,
        background:
          resolvedGradients.find((g) => g.id === editor.textOnly.gradientId) ??
          null,
        fonts: resolvedFonts,
        width,
        height,
        pixelRatio,
        mimeType,
        quality: opts?.quality,
        ...measured,
      });
      opts?.onProgress?.(1);
      return {
        blob: result.blob,
        metadata: buildExportMetadata(
          editor.state,
          "text",
          result.width,
          result.height,
          mimeType,
          undefined,
          { textOnly: editor.textOnly },
        ),
      };
    },
    [editor.state, editor.textOnly, resolvedGradients, resolvedFonts, flushAdjust],
  );

  // Read through a ref so an inline `labels` literal does not change the
  // handle's identity every render.
  const videoCodecUnavailableRef = React.useRef(mergedLabels.videoCodecUnavailable);
  React.useEffect(() => {
    videoCodecUnavailableRef.current = mergedLabels.videoCodecUnavailable;
  });

  const exportVideo = React.useCallback(
    async (opts?: ExportVideoOpts) => {
      flushAdjust();
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
          { frame: currentFrame() },
        ),
      };
    },
    [editor.state, editor.draft, allowedVideoMimes, flushAdjust, currentFrame],
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

  // The handle's `exportImage` covers text cards too (no Konva stage exists in
  // text mode, so the photo path alone would throw "canvas not ready").
  const exportImageOrText = React.useCallback(
    (opts?: ExportImageOpts) =>
      editor.state.mode === "text" ? exportText(opts) : exportImage(opts),
    [editor.state.mode, exportImage, exportText],
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
      isModified: () => modifiedRef.current,
      isSettled,
      whenSettled,
      getMode: () => editor.state.mode,
      getState: () => {
        // Stable while nothing changed (callers compare snapshots by identity).
        // The frame recorded with the committed state (not the live baseline,
        // which a pending remap may have moved ahead of it).
        const frame = committedFrameRef.current;
        if (!frame) return editor.state;
        const cached = snapshotCacheRef.current;
        if (cached && cached.base === editor.state && cached.frame === frame) {
          return cached.out;
        }
        const out: MediaEditorState = { ...editor.state, frame };
        snapshotCacheRef.current = { base: editor.state, frame, out };
        return out;
      },
      loadState: (state: MediaEditorState, opts?: LoadStateOpts) => {
        const sourceBlob = opts?.sourceBlob ?? null;
        // The image URL the loaded snapshot will show (null: no photo).
        let loadedUrl: string | null = null;
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
          loadedUrl = url;
        } else {
          editor.loadState(state);
          if (state.mode === "photo") {
            loadedUrl =
              (editor.draft?.kind === "image"
                ? editor.draft.url
                : state.imageSrc) ?? null;
          }
        }
        // A load is not a modification (unless the caller keeps the flag, e.g.
        // a mode round-trip); it supersedes any remap, crop Apply and pending
        // adjust gesture in flight. A round-trip of the editor's own state keeps
        // the gesture's action (the edit is still in the state) and the capture flag.
        if (opts?.keepModified) {
          flushAdjust();
        } else {
          clearModified();
          capturedRef.current = false;
          dropAdjust();
        }
        sourceEpochRef.current += 1;
        pendingCropRef.current = null;
        overrideUrlRef.current = loadedUrl;
        if (loadedUrl !== null) targetUrlRef.current = loadedUrl;
        pendingLoadRef.current = state.frame
          ? { url: loadedUrl, frame: state.frame }
          : null;
        bumpCommit();
        if (state.frame) scheduleLayoutSync();
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
          // In text mode the card's text IS `textOnly.text` (textContent follows it).
          if (editor.state.mode === "text") editor.setTextOnly({ text });
          else editor.setTextContent(text);
          markModified();
        } else {
          devWarnOnce(
          warnedRef.current,
          "addText",
          "media-editor: handle.addText() with no argument is not implemented — pass the text: addText(text).",
        );
        }
      },
      addSticker: (sticker: StickerOption) => {
        const placed: PlacedSticker = {
          // now-ok: builds an id inside an imperative handle method; never reaches markup
          id: `sticker-${Date.now()}`,
          stickerId: sticker.id,
          ...(visibleImageCenter(stageRef.current) ?? FALLBACK_PLACEMENT),
          rotation: 0,
          scale: 1,
        };
        editor.addSticker(placed);
        markModified();
        emitEditAction({ kind: "sticker-add", placed });
      },
      setAdjustments: (adj: Partial<ImageAdjustments>) => {
        editor.setAdjustments(adj);
        markModified();
        if (Object.keys(adj).length > 0) {
          emitEditAction({ kind: "adjust-change", patch: adj });
        }
      },
      applyFilter: (name: string | null) => commitFilter(name),
      clearLayer: (layer: "drawing" | "stickers" | "text") => {
        const st = editor.state;
        editor.clearLayer(layer);
        if (layer === "stickers") {
          for (const x of st.stickers) {
            emitEditAction({ kind: "sticker-remove", id: x.id });
          }
        } else if (layer === "text") {
          for (const x of st.textOverlays) {
            emitEditAction({ kind: "text-remove", id: x.id });
          }
        }
        const had =
          layer === "drawing"
            ? st.drawingStrokes.length > 0
            : layer === "stickers"
              ? st.stickers.length > 0
              : st.textOverlays.length > 0 || st.textContent !== null;
        if (had) markModified();
      },
      // No execute() callers exist — the stack is always empty, so these are
      // honest (dev-warning) no-ops, not silent ones.
      undo: () => {
        devWarnOnce(warnedRef.current, "undo", NOT_WIRED_HISTORY_MARKER);
      },
      redo: () => {
        devWarnOnce(warnedRef.current, "redo", NOT_WIRED_HISTORY_MARKER);
      },

      // === Export (C10) ===
      exportImage: exportImageOrText,
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
      exportImageOrText,
      exportVideo,
      exportPolymorphic,
      resolved,
      performReset,
      requestClose,
      isSettled,
      whenSettled,
      markModified,
      clearModified,
      emitEditAction,
      scheduleLayoutSync,
      commitFilter,
      flushAdjust,
      dropAdjust,
      bumpCommit,
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
  const surfaceRef = React.useRef<HTMLDivElement | null>(null);
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
  // Read at unmount: inline hands focus back only when it was inside the editor.
  const inlinePresentationRef = React.useRef(resolved === "inline");
  React.useEffect(() => {
    inlinePresentationRef.current = resolved === "inline";
  }, [resolved]);
  // Inline presentation has no open transition: the opener is whatever held
  // focus when the editor mounted (outside the editor itself).
  React.useLayoutEffect(() => {
    if (resolved !== "inline") return;
    const active = document.activeElement;
    openerRef.current =
      active instanceof HTMLElement &&
      active !== document.body &&
      surfaceRef.current?.contains(active) !== true
        ? active
        : null;
  }, [resolved]);
  // Unmount while focus is inside the editor (or lost to <body> with the
  // unmount): hand focus back to the opener if it is still in the document.
  // A layout cleanup runs before React detaches the DOM, so "was focus
  // inside" is still answerable; the focus move waits a microtask for the
  // detach. Best effort; a host that moves focus itself afterwards wins.
  React.useLayoutEffect(() => {
    return () => {
      const opener = openerRef.current;
      if (!opener) return;
      const active = document.activeElement;
      // eslint-disable-next-line react-hooks/exhaustive-deps -- read at unmount, on purpose
      const surface = dialogContentRef.current ?? surfaceRef.current;
      const wasInside =
        active instanceof HTMLElement &&
        (surface?.contains(active) === true ||
          active.closest('[role="alertdialog"]') !== null);
      const inline = inlinePresentationRef.current;
      queueMicrotask(() => {
        if (!opener.isConnected) return;
        const now = document.activeElement;
        // Inline: focus parked on <body> (a route change, a click on empty
        // space) is not ours to move; only focus that was inside the editor is.
        // Dialog: it is, since focus was trapped inside the dialog.
        if (wasInside || (!inline && (now === null || now === document.body))) {
          opener.focus({ preventScroll: true });
        }
      });
    };
  }, []);
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

  // "Keep editing" (or Escape on the confirm): focus goes back to the control
  // that had it before the confirm opened, else to the editor's own surface.
  // The confirm's focus scope releases a pass or two after `open` flips, so the
  // restore retries for a few frames; it only acts while focus is stranded on
  // <body> / inside the closing confirm, so a control the user focused wins.
  const wasDiscardOpenRef = React.useRef(false);
  React.useEffect(() => {
    const was = wasDiscardOpenRef.current;
    wasDiscardOpenRef.current = showDiscardConfirm;
    if (showDiscardConfirm || !was) return;
    const target = discardReturnFocusRef.current;
    discardReturnFocusRef.current = undefined;
    if (target === undefined) return;
    const restore = () => {
      const active = document.activeElement;
      const stranded =
        active === null ||
        active === document.body ||
        (active instanceof HTMLElement &&
          active.closest('[role="alertdialog"]') !== null);
      if (!stranded) return true;
      const host = target?.isConnected
        ? target
        : (dialogContentRef.current ?? surfaceRef.current);
      if (!host?.isConnected) return true;
      if (host !== target && !host.hasAttribute("tabindex")) {
        host.setAttribute("tabindex", "-1");
      }
      host.focus({ preventScroll: true });
      return document.activeElement === host;
    };
    let frames = 0;
    let frame = 0;
    const tick = () => {
      if (restore() || ++frames >= 4) return;
      frame = requestAnimationFrame(tick);
    };
    restore();
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [showDiscardConfirm]);

  // A tool panel's Apply / Back unmounts the panel with focus inside it, which
  // strands focus on <body>. The tool's chip stays mounted: focus goes there.
  const focusToolRef = React.useRef<EditTool | null>(null);
  React.useEffect(() => {
    const tool = editor.activeTool;
    if (tool !== null) {
      focusToolRef.current = tool;
      return;
    }
    const prev = focusToolRef.current;
    focusToolRef.current = null;
    if (!prev) return;
    const active = document.activeElement;
    if (active !== null && active !== document.body) return;
    const chip = surfaceRef.current?.querySelector<HTMLElement>(
      `[role="toolbar"] [data-tool="${prev}"]`,
    );
    chip?.focus({ preventScroll: true });
  }, [editor.activeTool]);

  // ─── Slot context for render* props ─────────────────────────────────

  const slotCtx = React.useMemo(
    () => ({
      mode: editor.state.mode,
      stage: editor.state.stage,
      isDirty: editor.isDirty,
      isModified: modified,
      isCapturing: editor.state.stage === "capture",
      isExporting: editor.state.stage === "publishing",
      activeTool: editor.activeTool,
      enabledTools: [...enabledTools] as EditTool[],
      enabledModes: [...enabledModes] as ComposerMode[],
      aspect,
    }),
    [editor, modified, enabledTools, enabledModes, aspect],
  );

  // ─── Render — inner surface (shared by inline + dialog branches) ──

  const inner = (
    <div
      ref={surfaceRef}
      className={cn(
        // `relative` anchors the floating top-center control (mode pill / Back)
        // and the consumer's renderTopBar (X / Publish) to the SAME box so they
        // share one row instead of stacking.
        "relative flex h-full w-full min-h-0 min-w-0 flex-col gap-3 p-4",
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
                <div
                  className="flex h-full w-full flex-col items-center justify-center gap-2 text-muted-foreground"
                  style={
                    props.canvasBackground
                      ? { background: props.canvasBackground }
                      : undefined
                  }
                >
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
                onTextChange={commitTextUpdate}
                onTextSelect={editor.setSelectedTextId}
                stickers={editor.state.stickers}
                resolveSticker={resolveSticker}
                selectedStickerId={editor.selectedStickerId}
                onStickerChange={(next) => {
                  editor.updateSticker(next.id, next);
                  markModified();
                }}
                onStickerSelect={editor.setSelectedStickerId}
                drawingStrokes={editor.state.drawingStrokes}
                currentDrawingStroke={currentDrawingStroke}
                isDrawing={editor.activeTool === "draw"}
                onDrawBegin={handleDrawBegin}
                onDrawExtend={handleDrawExtend}
                onDrawEnd={handleDrawEnd}
                cropRect={editor.state.crop}
                cropActive={editor.activeTool === "crop"}
                cropAspectRatio={cropAspectToRatio(editor.cropAspect, mediaRatio)}
                onCropChange={editor.setCrop}
                adjustments={editor.state.adjustments}
                activeFilter={
                  resolvedFilterPresets.find(
                    (f) => f.id === editor.state.filter,
                  ) ?? null
                }
                labels={mergedLabels}
                onStageReady={handleStageReady}
                onStageSize={handleStageSize}
                onMediaRect={handleMediaRect}
                onImagePainted={handleImagePainted}
                onImageError={handleImageError}
                background={props.canvasBackground}
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
              onChange={(next) => {
                editor.setTextOnly(next);
                markModified();
              }}
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
                    onChange={commitTextUpdate}
                    onDelete={() => {
                      commitTextRemove(selectedText.id);
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
                    onSelect={commitFilter}
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
                    onChange={commitAdjust}
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
                          {a === "free"
                            ? mergedLabels.cropAspectFree
                            : a === "original"
                              ? mergedLabels.cropAspectOriginal
                              : a}
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
                      // A second press while the first Apply encodes is ignored
                      // (both would race to replace the draft).
                      if (applyInFlightRef.current > 0) return;
                      // Token: a loadState / reset / new source while this encodes
                      // supersedes the Apply, which must then touch nothing (it
                      // would overwrite the newer draft). In flight = unsettled.
                      const epoch = sourceEpochRef.current;
                      const stale = () =>
                        sourceEpochRef.current !== epoch || !mountedRef.current;
                      applyInFlightRef.current += 1;
                      try {
                        const img = new Image();
                        img.crossOrigin = "anonymous";
                        await new Promise<void>((resolve, reject) => {
                          img.onload = () => resolve();
                          img.onerror = () =>
                            reject(new Error("image load failed"));
                          img.src = sourceUrl;
                        });
                        if (stale()) return;
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
                        if (stale()) return;
                        if (!blob) {
                          editor.setActiveTool(null);
                          return;
                        }
                        const newUrl = URL.createObjectURL(blob);
                        // The content inside the crop (stage px) is shown at
                        // the new image's media rect once it is painted — the
                        // overlays follow (see runLayoutSync). Until then the
                        // editor is "unsettled" on the new URL.
                        pendingCropRef.current = {
                          url: newUrl,
                          cropInMedia: { x: ix, y: iy, width: iw, height: ih },
                        };
                        overrideUrlRef.current = newUrl;
                        targetUrlRef.current = newUrl;
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
                        markModified();
                        emitEditAction({
                          kind: "crop-set",
                          crop: { x: ix, y: iy, width: iw, height: ih },
                        });
                      } catch {
                        if (!stale()) editor.setActiveTool(null);
                      } finally {
                        applyInFlightRef.current -= 1;
                        checkWaiters();
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
            <ChipRowScroller>
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
            </ChipRowScroller>
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
          discardReturnFocusRef.current = undefined;
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
          // shadcn's DialogContent is a grid with auto tracks: the editor
          // root's min-content (chip row, in-flow crop panel) would widen the
          // track past the overflow-hidden box. Pin both tracks to the box.
          "grid-cols-[minmax(0,1fr)] grid-rows-[minmax(0,1fr)]",
          props.dialogClassName,
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

// ─── 0.6.0 helpers ────────────────────────────────────────────────────

/** Trailing debounce for `adjust-change` (one action per slider gesture). */
const ADJUST_DEBOUNCE_MS = 250;

interface SettleWaiter {
  resolve: () => void;
  reject: (error: Error) => void;
  timer: ReturnType<typeof setTimeout>;
}

function loadErrorMessage(url: string): string {
  return `media-editor: the image could not be loaded (${url})`;
}

/** The keys of `next` whose value differs from `prev`. */
function shallowPatch<T extends object>(prev: T, next: T): Partial<T> {
  const patch: Partial<T> = {};
  for (const key of Object.keys(next) as (keyof T)[]) {
    if (prev[key] !== next[key]) patch[key] = next[key];
  }
  return patch;
}

/**
 * Measure the live text-card input so the exported card matches the preview:
 * its computed font size, the width its text wraps in (content box) and the
 * text direction. A value the environment cannot report is left out.
 */
function measureTextInput(el: HTMLTextAreaElement | null): {
  fontSizePx?: number;
  textBoxWidth?: number;
  direction?: "ltr" | "rtl";
} {
  if (!el || typeof getComputedStyle === "undefined") return {};
  const cs = getComputedStyle(el);
  const out: { fontSizePx?: number; textBoxWidth?: number; direction?: "ltr" | "rtl" } = {};
  const fontSize = parseFloat(cs.fontSize);
  if (Number.isFinite(fontSize) && fontSize > 0) out.fontSizePx = fontSize;
  const padding =
    (parseFloat(cs.paddingInlineStart) || 0) + (parseFloat(cs.paddingInlineEnd) || 0);
  const box = el.clientWidth - padding;
  if (box > 0) out.textBoxWidth = box;
  if (cs.direction === "rtl" || cs.direction === "ltr") out.direction = cs.direction;
  return out;
}

function sameRect(a: CropRect | undefined, b: CropRect | undefined): boolean {
  if (!a || !b) return a === b;
  return a.x === b.x && a.y === b.y && a.width === b.width && a.height === b.height;
}

function sameFrame(a: StateFrame, b: StateFrame): boolean {
  return (
    a.stageWidth === b.stageWidth &&
    a.stageHeight === b.stageHeight &&
    sameRect(a.media, b.media)
  );
}

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
 * Scroll container for the tool chip row. When the chips overflow, a fade
 * (CSS mask) appears on the inline-start / inline-end edge that has hidden
 * content, so the row reads as scrollable. RTL-correct: the distance from the
 * start edge is |scrollLeft| in every direction (modern browsers report a
 * negative scrollLeft in RTL), and the mask direction follows the computed
 * `direction`. Exposes `data-overflow-start` / `data-overflow-end`.
 */
function ChipRowScroller({ children }: { children: React.ReactNode }) {
  const ref = React.useRef<HTMLDivElement | null>(null);
  const [cue, setCue] = React.useState({ start: false, end: false, rtl: false });
  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => {
      const max = el.scrollWidth - el.clientWidth;
      const fromStart = Math.abs(el.scrollLeft);
      const rtl = (getComputedStyle(el).direction || "ltr") === "rtl";
      const next = {
        start: max > 1 && fromStart > 1,
        end: max > 1 && fromStart < max - 1,
        rtl,
      };
      setCue((prev) =>
        prev.start === next.start && prev.end === next.end && prev.rtl === next.rtl
          ? prev
          : next,
      );
    };
    measure();
    el.addEventListener("scroll", measure, { passive: true });
    const ro =
      typeof ResizeObserver === "undefined" ? null : new ResizeObserver(measure);
    ro?.observe(el);
    if (el.firstElementChild) ro?.observe(el.firstElementChild);
    return () => {
      el.removeEventListener("scroll", measure);
      ro?.disconnect();
    };
  }, []);
  const mask =
    cue.start || cue.end
      ? `linear-gradient(${cue.rtl ? "to left" : "to right"}, ${
          cue.start ? "transparent 0, black 1.5rem" : "black 0"
        }, ${cue.end ? "black calc(100% - 1.5rem), transparent 100%" : "black 100%"})`
      : undefined;
  return (
    <div
      ref={ref}
      data-overflow-start={cue.start ? "" : undefined}
      data-overflow-end={cue.end ? "" : undefined}
      style={{ maskImage: mask, WebkitMaskImage: mask }}
      className="max-w-full self-center overflow-x-auto rounded-full border border-border bg-background/80 backdrop-blur [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      {children}
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
  extra?: Pick<ExportMetadata, "frame" | "textOnly">,
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
    ...(extra?.frame ? { frame: extra.frame } : {}),
    ...(extra?.textOnly ? { textOnly: extra.textOnly } : {}),
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
