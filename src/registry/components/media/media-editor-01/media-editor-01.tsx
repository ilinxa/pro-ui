"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { useMediaEditorState } from "./hooks/use-media-editor-state";
import { resolvePresentation } from "./lib/presentation-resolver";
import { dialogSizeForAspect } from "./lib/dialog-size-for-aspect";
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

  // ─── Capability defaults ────────────────────────────────────────────

  const enabledModes = props.enabledModes ?? (["photo", "video", "text"] as const);
  const enabledTools =
    props.enabledTools ??
    (["text", "draw", "stickers", "filters", "adjust", "crop"] as const);
  const aspect = props.aspect ?? "free";

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
        "flex h-full w-full flex-col gap-4 p-6",
        // Inline-only: gets its own card chrome. In dialog mode, DialogContent
        // provides the chrome and we go edge-to-edge inside it.
        resolved === "inline" &&
          "rounded-2xl border border-border bg-card text-card-foreground shadow-sm min-h-[320px]",
      )}
      data-slot="media-editor-01"
      data-mode={editor.state.mode ?? "none"}
      data-stage={editor.state.stage}
      data-presentation={resolved}
    >
      {props.renderTopBar?.(slotCtx)}

      <div className="flex flex-1 flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border/60 bg-muted/30 p-8 text-center text-sm text-muted-foreground">
        <p className="font-medium text-foreground">media-editor-01 — C7 skeleton</p>
        <p>State + presentation wired. Capture/edit surface lands in C8-C12.</p>
        <p className="text-xs">
          mode: <code>{editor.state.mode ?? "null"}</code> · stage:{" "}
          <code>{editor.state.stage}</code> · dirty:{" "}
          <code>{editor.isDirty ? "yes" : "no"}</code> · presentation:{" "}
          <code>{resolved}</code> · aspect: <code>{aspect}</code>
        </p>
      </div>

      {props.renderBottomToolbar?.(slotCtx)}
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
