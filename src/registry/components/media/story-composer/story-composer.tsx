"use client";

import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  MediaEditor,
  editorLabelsFromFlat,
  type MediaEditorHandle,
  type MediaEditorLabels,
  type MediaEditorResolvedLabels,
  type MediaSource,
  type EditorCtx,
} from "../media-editor";
import { ComposerPublishBar } from "./parts/composer-publish-bar";
import { PublishDetailsStep } from "./parts/publish-details-step";
import { PublishingProgressOverlay } from "./parts/publishing-progress-overlay";
import { useImageUploader } from "./hooks/use-image-uploader";
import {
  DEFAULT_STORY_COMPOSER_LABELS,
  type ComposerCtx,
  type ComposerMode,
  type PublishedStory,
  type PublishFields,
  type PublishMetadata,
  type PublishResult,
  type PublishStatus,
  type ResolvedStoryComposerLabels,
  type StoryComposerHandle,
  type StoryComposerProps,
} from "./types";

/**
 * StoryComposer — thin wrapper around `MediaEditor`.
 *
 * Maps the story-shaped props onto the media-editor surface, fixes
 * `aspect="9:16"` (Instagram-canonical), and overlays the story-shaped
 * publish flow (optional details step, XHR upload + progress, error state,
 * onPublished / onPublishError).
 *
 * Upload-only by default: the camera is an opt-in. Install
 * `@ilinxa/media-editor-capture` and pass `capture={mediaCapture}` to keep it.
 *
 * Known gaps (none break the type contract):
 *   - `editorBackground` is accepted but not implemented (dev-warns) — the
 *     editor canvas always uses "#000".
 *   - `renderPublishingOverlay` is honored — the consumer slot replaces the
 *     default `PublishingProgressOverlay` during publish, and is rendered
 *     through media-editor's `overlay` prop.
 */

const ALL_MODES: ComposerMode[] = ["photo", "video", "text"];

/** The entries of `obj` whose value is not `undefined` (an explicit `undefined` never overrides a default). */
function definedOnly<T extends object>(obj: T): Partial<T> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v !== undefined) out[k] = v;
  }
  return out as Partial<T>;
}

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

/** Recursive object merge; `over` wins and undefined values never overwrite. */
function deepMerge<T extends object>(
  base: T | undefined,
  over: T | undefined,
): T {
  const out: Record<string, unknown> = {
    ...(base as Record<string, unknown> | undefined),
  };
  for (const [k, v] of Object.entries(
    (over ?? {}) as Record<string, unknown>,
  )) {
    if (v === undefined) continue;
    const cur = out[k];
    out[k] = isPlainObject(cur) && isPlainObject(v) ? deepMerge(cur, v) : v;
  }
  return out as T;
}

/** Caption rules of the `caption` prop: `required` needs text, `maxLength` caps it. */
function captionOk(
  caption: StoryComposerProps["caption"],
  fields: PublishFields,
): boolean {
  if (!caption) return true;
  const text = typeof fields.caption === "string" ? fields.caption : "";
  if (caption.required && text.trim().length === 0) return false;
  if (caption.maxLength !== undefined && text.length > caption.maxLength) {
    return false;
  }
  return true;
}

export const StoryComposer = forwardRef<
  StoryComposerHandle,
  StoryComposerProps
>(function StoryComposer(props, ref) {
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
    editorBackground,
    fonts,
    colorPresets,
    labels: labelOverrides,
    onValidationError,
    onPermissionDenied,
    renderTopBar,
    renderBottomToolbar,
    renderEmpty,
    renderPermissionDenied,
    renderPublishingOverlay,
    uploadUrl,
    uploader,
    uploadFields,
    onPublished,
    onPublishError,
    getErrorMessage,
    capture,
    sources,
    acceptMediaTypes,
    videoOutput,
    locale,
    caption,
    renderPublishFields,
    publishFields,
    onPublishFieldsChange,
    canPublish: canPublishProp,
  } = props;

  const editorRef = useRef<MediaEditorHandle>(null);

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

  const labels = useMemo<ResolvedStoryComposerLabels>(
    () => ({
      ...DEFAULT_STORY_COMPOSER_LABELS,
      ...(labelOverrides ? definedOnly(labelOverrides) : null),
    }),
    [labelOverrides],
  );

  // Nested `labels.editor` first, then the host's flat overrides (converted by
  // media-editor's helper) over it — flat wins. The WHOLE override object goes
  // through `editorLabelsFromFlat`, which ignores every key it does not know
  // (story-composer's own `publish`, `close`, `uploadCancel`, `detailsBack` ...
  // are not editor keys), so every editor-relevant flat key reaches the editor.
  // Only host overrides are forwarded, never story-composer's defaults, so the
  // editor keeps resolving its own defaults.
  const editorLabels = useMemo<Partial<MediaEditorLabels> | undefined>(() => {
    if (!labelOverrides) return undefined;
    const { editor: nested, ...flat } = definedOnly(labelOverrides);
    return deepMerge<Partial<MediaEditorLabels>>(
      nested,
      editorLabelsFromFlat(flat as Partial<MediaEditorResolvedLabels>),
    );
  }, [labelOverrides]);

  const uploader_ = useImageUploader({
    uploadUrl,
    uploader,
    uploadFields,
    messages: labels,
  });

  const [publishStatus, setPublishStatus] = useState<PublishStatus>("idle");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [publishError, setPublishError] = useState<Error | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  // Publish fields — controlled when `publishFields` is defined (it wins on
  // every render), otherwise held here.
  const [innerFields, setInnerFields] = useState<PublishFields>({});
  const fields: PublishFields = publishFields ?? innerFields;
  const handleFieldsChange = useCallback(
    (next: PublishFields) => {
      if (publishFields === undefined) setInnerFields(next);
      onPublishFieldsChange?.(next);
    },
    [publishFields, onPublishFieldsChange],
  );
  const hasDetails = caption !== undefined || renderPublishFields !== undefined;
  const fieldsAllowed =
    captionOk(caption, fields) && (canPublishProp?.(fields) ?? true);

  // Upload-only unless the host opts into the camera with `capture`.
  const editorSources = useMemo<MediaSource[]>(
    () => sources ?? (capture ? ["camera", "upload"] : ["upload"]),
    [sources, capture],
  );

  // Mirror uploader_.progress (0..1) into uploadProgress's upload half
  // (0.5..1) so the progress bar advances smoothly through the upload phase
  // instead of jumping from 0.5 to 1.
  useEffect(() => {
    if (publishStatus !== "uploading") return;
    setUploadProgress(0.5 + uploader_.progress * 0.5);
  }, [publishStatus, uploader_.progress]);

  // Run token. Every publish takes `++runRef.current`; Cancel / reset / close
  // bump it too, so a flow that was cancelled (export() cannot be aborted, a
  // custom uploader may ignore its abort) sees `run !== runRef.current` after
  // each await and stops — it can never publish, resurrect the overlay or
  // overwrite the status of a newer run.
  const runRef = useRef(0);
  // One flow at a time: true from the moment a run starts until it settles.
  const flowActiveRef = useRef(false);
  const warnedRef = useRef(new Set<string>());
  const warnOnce = useCallback((key: string, message: string) => {
    if (process.env.NODE_ENV === "production") return;
    if (warnedRef.current.has(key)) return;
    warnedRef.current.add(key);
    console.warn(message);
  }, []);
  // useImageUploader's `cancel` is a stable callback (the result object is not).
  const cancelUpload = uploader_.cancel;

  // Invalidate the in-flight run (if any) and abort its XHR.
  const abortFlow = useCallback(() => {
    runRef.current += 1;
    flowActiveRef.current = false;
    cancelUpload();
  }, [cancelUpload]);

  // Opening the details step settles a finished publish (`done` -> `idle`).
  const openDetailsStep = useCallback(() => {
    if (!hasDetails) {
      warnOnce(
        "open-details-unconfigured",
        "story-composer: openDetails() was called but no details step is configured — pass `caption` or `renderPublishFields`.",
      );
      return;
    }
    setPublishStatus((s) => (s === "done" ? "idle" : s));
    setDetailsOpen(true);
  }, [hasDetails, warnOnce]);

  // Closing (`isOpen` false) ends the session: cancel the in-flight publish,
  // close the details step, drop the uncontrolled fields and return to `idle`.
  // A pending `done` is kept through the close (the polite announcement must
  // not be cut off) and settles to `idle` when the composer reopens.
  useEffect(() => {
    if (isOpen) {
      setPublishStatus((s) => (s === "done" ? "idle" : s));
      return;
    }
    abortFlow();
    setDetailsOpen(false);
    setUploadProgress(0);
    setPublishError(null);
    setPublishStatus((s) => (s === "done" ? s : "idle"));
    setInnerFields({});
  }, [isOpen, abortFlow]);

  // Publishing is gated on the caption rules and `canPublish`, whichever way
  // it is started (details step, handle.publish(), ctx.publish()).
  const handlePublish = useCallback(async () => {
    if (!editorRef.current) return;
    if (flowActiveRef.current) return;
    if (!captionOk(caption, fields) || !(canPublishProp?.(fields) ?? true)) {
      return;
    }
    const run = ++runRef.current;
    const stale = () => run !== runRef.current;
    flowActiveRef.current = true;
    setPublishError(null);
    setDetailsOpen(false);
    let story: PublishedStory;
    let result: PublishResult;
    try {
      setPublishStatus("compositing");
      setUploadProgress(0);
      const { blob, metadata } = await editorRef.current.export({
        // Export takes the first half of the progress bar; upload the second.
        onProgress: (p) => {
          if (!stale()) setUploadProgress(p * 0.5);
        },
      });
      if (stale()) return;
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
      // Upload runs the second half of the bar; uploader_.progress is mirrored
      // into uploadProgress via the effect below.
      result = await uploader_.upload(blob, publishMeta, fields);
      if (stale()) return;
      setUploadProgress(1);

      story = {
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
    } catch (err) {
      // A cancelled / reset / closed run (or a newer one) owns the state now.
      if (stale()) return;
      flowActiveRef.current = false;
      const e = err instanceof Error ? err : new Error(String(err));
      // An AbortError that did not come from our Cancel (a custom uploader
      // aborting itself) is a cancellation, not a failure: back to the editor.
      if (e.name === "AbortError") {
        setPublishStatus("idle");
        setUploadProgress(0);
        return;
      }
      setPublishError(e);
      setPublishStatus("error");
      onPublishError?.(e);
      return;
    }
    // The upload succeeded. `onPublished` runs OUTSIDE the try above: a host
    // handler that throws is the host's bug, not an upload failure — it must not
    // raise the error overlay or fire `onPublishError`. It is deliberately not
    // caught, so the error surfaces to the caller (a rejected `publish()`
    // promise; an unhandled rejection for the built-in buttons).
    flowActiveRef.current = false;
    setPublishStatus("done");
    setInnerFields({});
    try {
      onPublished(story, result);
    } finally {
      // A successful publish consumes the draft: the next open starts at
      // capture / intake, not on the story that was just published. (Cancel and
      // error paths never reach here, so they keep the draft.)
      editorRef.current?.reset();
    }
  }, [
    uploader_,
    onPublished,
    onPublishError,
    caption,
    fields,
    canPublishProp,
  ]);

  // Public entry (handle.publish() / ctx.publish()). One flow at a time; with a
  // details step configured and closed it opens the step instead of publishing;
  // when the gates block it, it says so (dev) and resolves without publishing.
  const requestPublish = useCallback(async () => {
    if (flowActiveRef.current) return;
    if (publishStatus === "error") {
      await handlePublish(); // the error overlay is up: this is a retry
      return;
    }
    if (hasDetails && !detailsOpen) {
      openDetailsStep();
      return;
    }
    if (!captionOk(caption, fields) || !(canPublishProp?.(fields) ?? true)) {
      warnOnce(
        "publish-blocked",
        "story-composer: publish() was blocked by caption.required / canPublish",
      );
      return;
    }
    await handlePublish();
  }, [
    publishStatus,
    hasDetails,
    detailsOpen,
    openDetailsStep,
    caption,
    fields,
    canPublishProp,
    warnOnce,
    handlePublish,
  ]);

  // Back to the editor with the draft intact: only the publish flow resets.
  const handleCancelPublish = useCallback(() => {
    abortFlow();
    setPublishStatus("idle");
    setUploadProgress(0);
    setPublishError(null);
  }, [abortFlow]);

  // EditorCtx → ComposerCtx translation for slot consumers. story-composer's
  // ctx assumes a non-null mode + has publishing/cancel/publish helpers.
  const toComposerCtx = useCallback(
    (ctx: EditorCtx): ComposerCtx => ({
      mode: ctx.mode ?? "photo",
      stage: ctx.stage,
      isDirty: ctx.isDirty,
      publishing: {
        active:
          publishStatus === "compositing" || publishStatus === "uploading",
        progress: uploadProgress,
      },
      setMode: (m) => {
        // No public setter on the handle yet (v0.3.0 may expose setMode());
        // round-trip through the editor's typed state surface to flip just the
        // mode. getState() is non-null, so no cast/fallback is needed.
        const editor = editorRef.current;
        if (editor) editor.loadState({ ...editor.getState(), mode: m });
      },
      cancel: () => onClose(),
      publish: requestPublish,
      openDetails: openDetailsStep,
    }),
    [publishStatus, uploadProgress, requestPublish, openDetailsStep, onClose],
  );

  useImperativeHandle(
    ref,
    (): StoryComposerHandle => ({
      open: () => editorRef.current?.open(),
      close: () => editorRef.current?.close(),
      reset: () => {
        // Cancels an in-flight publish too (token bump + uploader cancel).
        abortFlow();
        editorRef.current?.reset();
        setPublishStatus("idle");
        setUploadProgress(0);
        setPublishError(null);
        setDetailsOpen(false);
        if (publishFields === undefined) setInnerFields({});
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
      publish: requestPublish,
      exportBlob: async () => {
        if (!editorRef.current) {
          throw new Error("story-composer: editor not mounted");
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
    [requestPublish, abortFlow, publishFields],
  );

  /*
   * `editorBackground` has never been applied. StoryComposer is a thin wrapper
   * that renders `<MediaEditor>` directly — there is no container of its own to
   * paint, and MediaEditor exposes no background prop to forward to, so
   * honouring this would be a cross-component feature rather than a wiring fix.
   *
   * Until then it says so out loud. A styling prop that silently does nothing
   * is the most expensive kind to debug: the consumer assumes their value is
   * wrong, not that the prop is dead.
   */
  useEffect(() => {
    if (process.env.NODE_ENV === "production") return;
    if (editorBackground === undefined) return;
    console.warn(
      "story-composer: `editorBackground` is not implemented and has no effect — StoryComposer renders MediaEditor directly and has no surface of its own to paint. Style the editor from your own layout instead.",
    );
  }, [editorBackground]);

  // Passed through MediaEditor's `overlay` so it renders INSIDE the editor
  // surface — in dialog presentation that is inside the dialog content, which
  // keeps Retry / Cancel clickable (a sibling would sit outside the modal).
  // The publish flow wins over the details step.
  const publishInFlight =
    publishStatus === "uploading" ||
    publishStatus === "compositing" ||
    publishStatus === "error";
  const overlay = publishInFlight ? (
    renderPublishingOverlay ? (
      renderPublishingOverlay({
        progress: uploadProgress,
        mode: (editorRef.current?.getMode() ?? "photo") as ComposerMode,
        status: publishStatus,
        error: publishError,
        retry: handlePublish,
        cancel: handleCancelPublish,
      })
    ) : (
      <PublishingProgressOverlay
        progress={publishStatus === "uploading" ? uploadProgress : null}
        status={publishStatus === "error" ? "error" : "uploading"}
        errorMessage={
          publishError ? getErrorMessage?.(publishError) : undefined
        }
        labels={labels}
        locale={locale}
        onRetry={publishStatus === "error" ? handlePublish : undefined}
        onCancel={handleCancelPublish}
      />
    )
  ) : hasDetails && detailsOpen ? (
    <PublishDetailsStep
      labels={labels}
      locale={locale}
      caption={caption}
      value={fields}
      onChange={handleFieldsChange}
      canPublish={fieldsAllowed}
      onBack={() => setDetailsOpen(false)}
      onPublish={handlePublish}
    >
      {renderPublishFields?.({
        value: fields,
        onChange: handleFieldsChange,
        status: publishStatus,
      })}
    </PublishDetailsStep>
  ) : null;

  return (
    <>
      <MediaEditor
        ref={editorRef}
        aspect="9:16"
        enabledModes={enabledModes}
        enabledTools={enabledTools}
        mediaSources={editorSources}
        capture={capture}
        acceptMediaTypes={acceptMediaTypes}
        videoOutput={videoOutput}
        locale={locale}
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
        labels={editorLabels}
        onValidationError={onValidationError}
        onPermissionDenied={onPermissionDenied}
        renderEmpty={renderEmpty}
        renderPermissionDenied={renderPermissionDenied}
        renderTopBar={(ctx) =>
          renderTopBar ? (
            renderTopBar(toComposerCtx(ctx))
          ) : (
            <ComposerPublishBar
              isPublishing={
                publishStatus === "compositing" ||
                publishStatus === "uploading"
              }
              // With a details step the caption rules are enforced there, so
              // the top-bar Publish only needs content to open it.
              canPublish={ctx.isDirty && (hasDetails || fieldsAllowed)}
              // Hide Publish only during photo/video capture (nothing captured
              // yet → a disabled CTA just crowds the mode pill). Text mode lives
              // in the capture stage too but IS publishable, so keep it there.
              showPublish={!ctx.isCapturing || ctx.mode === "text"}
              // Hide the close X in the edit stage when the editor shows its own
              // Back arrow in that corner (capture modes enabled). Keep it during
              // capture, and for edit-only configs that have no Back.
              showClose={
                ctx.isCapturing ||
                !(
                  ctx.enabledModes.includes("photo") ||
                  ctx.enabledModes.includes("video")
                )
              }
              labels={labels}
              onPublish={hasDetails ? openDetailsStep : handlePublish}
              onClose={onClose}
            />
          )
        }
        renderBottomToolbar={
          renderBottomToolbar
            ? (ctx) => renderBottomToolbar(toComposerCtx(ctx))
            : undefined
        }
        overlay={overlay}
      />
      {/* Polite completion announcement (labels.published). */}
      <div role="status" className="sr-only">
        {publishStatus === "done" ? labels.published : null}
      </div>
    </>
  );
});
