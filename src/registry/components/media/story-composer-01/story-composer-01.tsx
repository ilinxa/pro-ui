"use client";

import {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  MediaEditor01,
  type MediaEditor01Handle,
  type MediaEditor01Labels,
  type EditorCtx,
} from "../media-editor-01";
import { ComposerPublishBar } from "./parts/composer-publish-bar";
import { PublishingProgressOverlay } from "./parts/publishing-progress-overlay";
import { useImageUploader } from "./hooks/use-image-uploader";
import {
  DEFAULT_STORY_COMPOSER_LABELS,
  type ComposerCtx,
  type ComposerMode,
  type ComposerStage,
  type PublishedStory,
  type PublishMetadata,
  type StoryComposer01Handle,
  type StoryComposer01Labels,
  type StoryComposer01Props,
} from "./types";

/**
 * StoryComposer01 v0.2.0 — thin wrapper around `MediaEditor01`.
 *
 * Maps the v0.1.5 props 1:1 onto the media-editor surface, fixes
 * `aspect="9:16"` (Instagram-canonical), and overlays the story-shaped
 * publish flow (XHR upload + progress + onPublished/onPublishError).
 *
 * Public API preserved 100%: every v0.1.5 prop is accepted and every
 * v0.1.5 ref-handle method resolves. Internal orchestration that lived
 * in this file in v0.1.5 (camera, tool panels, discard guard, history,
 * text-only canvas) now lives inside MediaEditor01 — landed in the R1–R4
 * backfill commits.
 *
 * Known v0.2.0 polish gaps (none break the type contract):
 *   - `labels` overrides pass through verbatim as the v0.1.5 flat shape;
 *     full MediaEditor01Labels nested-shape mapping lands at C17.
 *   - `editorBackground` prop is accepted but not forwarded — the
 *     editor canvas always uses "#000" (matches the v0.1.5 default).
 *     Re-exposed in v0.2.1 if needed.
 *   - `renderPublishingOverlay` is a no-op slot in v0.2.0; the default
 *     `PublishingProgressOverlay` renders during publish.
 */

const ALL_MODES: ComposerMode[] = ["photo", "video", "text"];

type PublishStatus = "idle" | "compositing" | "uploading" | "done" | "error";

export const StoryComposer01 = forwardRef<
  StoryComposer01Handle,
  StoryComposer01Props
>(function StoryComposer01(props, ref) {
  const {
    isOpen,
    onClose,
    defaultMode,
    hideModes,
    defaultFacing,
    recordAudio,
    maxFileSizeMb,
    maxVideoDuration,
    presentation = "auto",
    confirmOnDiscard = true,
    enabledTools = ["text", "draw", "stickers", "filters", "adjust"],
    stickers,
    replaceBuiltinStickers,
    filterPresets,
    replaceBuiltinFilters,
    cropAspects,
    fonts,
    colorPresets,
    labels: labelOverrides,
    onValidationError,
    onPermissionDenied,
    renderTopBar,
    renderBottomToolbar,
    renderEmpty,
    uploadUrl,
    uploader,
    uploadFields,
    onPublished,
    onPublishError,
  } = props;

  const editorRef = useRef<MediaEditor01Handle>(null);

  // hideModes (subtract) → enabledModes (positive). Empty hideModes ⇒ all
  // three modes enabled, matching the v0.1.5 default.
  const enabledModes = useMemo<ComposerMode[]>(
    () => ALL_MODES.filter((m) => !hideModes?.includes(m)),
    [hideModes],
  );

  // story-composer's `presentation` enum vs media-editor's. "fullscreen" and
  // "modal" both map to "dialog" since media-editor's dialog mode is
  // mobile-fullscreen + desktop-modal. "auto" passes through.
  const editorPresentation = useMemo<"inline" | "dialog" | "auto">(() => {
    if (presentation === "fullscreen" || presentation === "modal") {
      return "dialog";
    }
    return "auto";
  }, [presentation]);

  const labels = useMemo<Required<StoryComposer01Labels>>(
    () => ({ ...DEFAULT_STORY_COMPOSER_LABELS, ...labelOverrides }),
    [labelOverrides],
  );

  const uploader_ = useImageUploader({ uploadUrl, uploader, uploadFields });

  const [publishStatus, setPublishStatus] = useState<PublishStatus>("idle");
  const [uploadProgress, setUploadProgress] = useState(0);

  const handlePublish = useCallback(async () => {
    if (!editorRef.current) return;
    try {
      setPublishStatus("compositing");
      setUploadProgress(0);
      const { blob, metadata } = await editorRef.current.export({
        // Export takes the first half of the progress bar; upload the second.
        onProgress: (p) => setUploadProgress(p * 0.5),
      });
      // ExportMetadata → PublishMetadata (drop the editor-only `crop` field).
      const publishMeta: PublishMetadata = {
        mode: metadata.mode,
        width: metadata.width,
        height: metadata.height,
        durationMs: metadata.durationMs,
        mimeType: metadata.mimeType,
        textOverlays: metadata.textOverlays,
        stickers: metadata.stickers,
        drawingStrokes: metadata.drawingStrokes,
        appliedFilter: metadata.appliedFilter,
        adjustments: metadata.adjustments,
      };
      setPublishStatus("uploading");
      const result = await uploader_.upload(blob, publishMeta);
      // The uploader hook surfaces its own progress; we just track final-state.
      setUploadProgress(1);

      const story: PublishedStory = {
        id: `story-${Date.now()}`,
        createdAt: new Date().toISOString(),
        items: [
          {
            id: `item-${Date.now()}`,
            type: metadata.mode === "video" ? "video" : "image",
            src: result.url,
            duration:
              metadata.mode === "video"
                ? Math.round((metadata.durationMs ?? 0) / 1000) || undefined
                : undefined,
            thumbnailUrl: result.thumbnailUrl,
          },
        ],
      };
      setPublishStatus("done");
      onPublished(story);
    } catch (err) {
      setPublishStatus("error");
      const e = err instanceof Error ? err : new Error(String(err));
      onPublishError?.(e);
    }
  }, [uploader_, onPublished, onPublishError]);

  // EditorCtx → ComposerCtx translation for slot consumers. story-composer's
  // ctx assumes a non-null mode + has publishing/cancel/publish helpers.
  const toComposerCtx = useCallback(
    (ctx: EditorCtx): ComposerCtx => ({
      mode: ctx.mode ?? "photo",
      stage: ctx.stage as ComposerStage,
      isDirty: ctx.isDirty,
      publishing: {
        active:
          publishStatus === "compositing" || publishStatus === "uploading",
        progress: uploadProgress,
      },
      setMode: (m) => {
        // No public setter on the handle; delegate via the editor ref's
        // internal state surface in v0.2.0. v0.3.0 may expose setMode().
        editorRef.current?.loadState({
          ...(editorRef.current.getState() ?? {}),
          mode: m,
        } as ReturnType<NonNullable<typeof editorRef.current>["getState"]>);
      },
      cancel: () => onClose(),
      publish: handlePublish,
    }),
    [publishStatus, uploadProgress, handlePublish, onClose],
  );

  useImperativeHandle(
    ref,
    (): StoryComposer01Handle => ({
      open: () => editorRef.current?.open(),
      close: () => editorRef.current?.close(),
      reset: () => {
        editorRef.current?.reset();
        setPublishStatus("idle");
        setUploadProgress(0);
      },
      switchCamera: async () => {
        await editorRef.current?.switchCamera();
      },
      takePhoto: async () => {
        await editorRef.current?.takePhoto();
      },
      startRecording: async () => {
        await editorRef.current?.startRecording();
      },
      stopRecording: async () => {
        await editorRef.current?.stopRecording();
      },
      importFromGallery: () => editorRef.current?.importFromGallery(),
      addText: (text) => editorRef.current?.addText(text),
      addSticker: (sticker) => editorRef.current?.addSticker(sticker),
      setAdjustments: (adj) => editorRef.current?.setAdjustments(adj),
      applyFilter: (name) => editorRef.current?.applyFilter(name),
      publish: handlePublish,
      exportBlob: async () => {
        if (!editorRef.current) {
          throw new Error("story-composer-01: editor not mounted");
        }
        const out = await editorRef.current.export();
        const publishMeta: PublishMetadata = {
          mode: out.metadata.mode,
          width: out.metadata.width,
          height: out.metadata.height,
          durationMs: out.metadata.durationMs,
          mimeType: out.metadata.mimeType,
          textOverlays: out.metadata.textOverlays,
          stickers: out.metadata.stickers,
          drawingStrokes: out.metadata.drawingStrokes,
          appliedFilter: out.metadata.appliedFilter,
          adjustments: out.metadata.adjustments,
        };
        return { blob: out.blob, metadata: publishMeta };
      },
    }),
    [handlePublish],
  );

  return (
    <>
      <MediaEditor01
        ref={editorRef}
        aspect="9:16"
        enabledModes={enabledModes}
        enabledTools={enabledTools}
        mediaSources={["camera", "upload"]}
        presentation={editorPresentation}
        isOpen={isOpen}
        onClose={onClose}
        confirmOnDiscard={confirmOnDiscard}
        defaultMode={defaultMode}
        defaultFacing={defaultFacing}
        recordAudio={recordAudio}
        maxFileSizeMb={maxFileSizeMb}
        maxVideoDuration={maxVideoDuration}
        stickers={stickers}
        replaceBuiltinStickers={replaceBuiltinStickers}
        filterPresets={filterPresets}
        replaceBuiltinFilters={replaceBuiltinFilters}
        cropAspects={cropAspects}
        fonts={fonts}
        colorPresets={colorPresets}
        // Pass-through of label overrides — MediaEditor accepts as flat shape
        // via INTERNAL_LABELS_FALLBACK merge (R2). C17 will refactor onto
        // the nested MediaEditor01Labels surface.
        labels={labelOverrides as unknown as Partial<MediaEditor01Labels>}
        onValidationError={onValidationError}
        onPermissionDenied={onPermissionDenied}
        renderEmpty={renderEmpty}
        renderTopBar={(ctx) =>
          renderTopBar ? (
            renderTopBar(toComposerCtx(ctx))
          ) : (
            <ComposerPublishBar
              isPublishing={
                publishStatus === "compositing" ||
                publishStatus === "uploading"
              }
              canPublish={ctx.isDirty}
              labels={labels}
              onPublish={handlePublish}
              onClose={onClose}
            />
          )
        }
        renderBottomToolbar={
          renderBottomToolbar
            ? (ctx) => renderBottomToolbar(toComposerCtx(ctx))
            : undefined
        }
      />
      {publishStatus === "uploading" ||
      publishStatus === "compositing" ||
      publishStatus === "error" ? (
        <PublishingProgressOverlay
          progress={publishStatus === "uploading" ? uploadProgress : null}
          status={publishStatus === "error" ? "error" : "uploading"}
          labels={labels}
          onRetry={publishStatus === "error" ? handlePublish : undefined}
          onCancel={() => {
            uploader_.cancel();
            setPublishStatus("idle");
            setUploadProgress(0);
          }}
        />
      ) : null}
    </>
  );
});
