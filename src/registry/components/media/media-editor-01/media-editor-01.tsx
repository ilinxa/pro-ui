"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { useMediaEditorState } from "./hooks/use-media-editor-state";
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
        // No-op in inline; real wiring in C7 dialog mode.
      },
      close: () => {
        // No-op in inline; real wiring in C7 dialog mode.
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
      enabledTools: props.enabledTools ?? ([
        "text",
        "draw",
        "stickers",
        "filters",
        "adjust",
        "crop",
      ] satisfies EditTool[]),
      enabledModes: props.enabledModes ?? ([
        "photo",
        "video",
        "text",
      ] satisfies ComposerMode[]),
      aspect: props.aspect ?? "free",
    }),
    [editor, props.enabledTools, props.enabledModes, props.aspect],
  );

  // ─── Render (C6: placeholder layout; C7 wires presentation chrome) ──

  return (
    <div
      className={cn(
        "flex flex-col gap-4 rounded-2xl border border-border bg-card p-6 text-card-foreground shadow-sm",
        "min-h-[320px]",
      )}
      data-slot="media-editor-01"
      data-mode={editor.state.mode ?? "none"}
      data-stage={editor.state.stage}
    >
      {props.renderTopBar?.(slotCtx)}

      <div className="flex flex-1 flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border/60 bg-muted/30 p-8 text-center text-sm text-muted-foreground">
        <p className="font-medium text-foreground">media-editor-01 — C6 skeleton</p>
        <p>State machine wired; capture/edit surface lands in C7-C12.</p>
        <p className="text-xs">
          mode: <code>{editor.state.mode ?? "null"}</code> · stage:{" "}
          <code>{editor.state.stage}</code> · dirty:{" "}
          <code>{editor.isDirty ? "yes" : "no"}</code>
        </p>
      </div>

      {props.renderBottomToolbar?.(slotCtx)}
    </div>
  );
});
