"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { useMediaEditorState } from "./hooks/use-media-editor-state";
import { resolvePresentation } from "./lib/presentation-resolver";
import { dialogSizeForAspect } from "./lib/dialog-size-for-aspect";
import { resolveCropAspects } from "./lib/resolve-crop-aspects";
import { loadInitialSource } from "./lib/initial-source-loader";
import type {
  ComposerMode,
  EditTool,
  ExportImageOpts,
  ExportOpts,
  ExportVideoOpts,
  ImageAdjustments,
  MediaEditor01Handle,
  MediaEditor01Props,
  MediaEditorState,
  SourceError,
  StickerOption,
} from "./types";

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

      // === Export (real wiring in C10) ===
      exportImage: async (_opts?: ExportImageOpts) => {
        throw new Error(NOT_IMPLEMENTED_MARKER + " (exportImage lands in C10)");
      },
      exportVideo: async (_opts?: ExportVideoOpts) => {
        throw new Error(NOT_IMPLEMENTED_MARKER + " (exportVideo lands in C10)");
      },
      export: async (_opts?: ExportOpts) => {
        throw new Error(
          NOT_IMPLEMENTED_MARKER + " (polymorphic export lands in C10)",
        );
      },

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
    [editor],
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
          ) : editor.state.stage === "edit" && editor.state.imageSrc ? (
            <img
              src={editor.state.imageSrc}
              alt=""
              className="h-full w-full object-contain"
              draggable={false}
              data-loaded-source="photo"
            />
          ) : editor.state.stage === "edit" && editor.state.videoBlob ? (
            <p className="font-medium text-foreground">
              Loaded video ({Math.round(editor.state.videoBlob.size / 1024)} KB)
            </p>
          ) : (
            <>
              <p className="font-medium text-foreground">
                {cameraIntakeAvailable
                  ? "Camera surface — C10"
                  : "Upload dropzone — C10"}
              </p>
              <p>
                aspect: <code>{aspect}</code> · sources:{" "}
                <code>{mediaSources.join(",") || "(none)"}</code>
              </p>
              {!cameraIntakeAvailable && mediaSources.length === 0 ? (
                <p className="text-amber-600 dark:text-amber-400">
                  No mediaSources + no initialSource → empty state (C11 footgun guard)
                </p>
              ) : null}
            </>
          )}
        </div>
      </div>

      {/* Toolbar — filtered by enabledTools (description §4) */}
      {enabledTools.length > 0 ? (
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
