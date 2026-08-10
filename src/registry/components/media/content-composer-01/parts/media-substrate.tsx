"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { MediaEditor01 } from "@/registry/components/media/media-editor-01/media-editor-01";
import type {
  InitialSource,
  MediaEditor01Handle,
  MediaEditorState,
} from "@/registry/components/media/media-editor-01/media-editor-01";
import type { MediaSlotValue, SlotHandle, SlotRenderArgs } from "../types";
import { assignRef } from "../lib/assign-ref";
import { clampMediaSources } from "../lib/clamp-media-sources";
import { editorStateHasMedia } from "../lib/gates";

/**
 * Shell-held cache of the source blob backing each mediaSlot step's
 * `editorState.imageSrc`, keyed by step id. The object URL inside a persisted
 * editorState dies with the capturing editor instance (single-step mount), so
 * a step-revisit needs the blob to re-mint a live URL before `loadState`
 * (review 1.3 / 1.4). Provided by the composer root as a stable bare Map (NOT
 * a `{ current }` wrapper — the React Compiler treats `.current` reads inside
 * memoized callbacks as ref access and bails); blobs are plain memory — no
 * revocation lifecycle, the map dies with the composer.
 */
export const MediaSourceBlobCacheContext = createContext<Map<
  string,
  Blob
> | null>(null);

/**
 * Compose the shell-side MediaSlotValue from the live editor state. `exportedUrl`
 * / `pendingBlobRef` / `exportMetadata` are shell concepts media-editor doesn't
 * know — preserve them from `prev`. The non-serializable live `videoBlob` is
 * nulled (the SerializableMediaEditorState contract) before it can reach the
 * draft JSON.
 */
function snapshotMediaValue(
  handle: MediaEditor01Handle | null,
  prev: MediaSlotValue | undefined,
): MediaSlotValue {
  if (!handle) return prev ?? {};
  const state = handle.getState();
  const editorState = { ...state, videoBlob: null };
  if (!editorStateHasMedia(editorState)) {
    // Reset/discard flip: the capture is gone, so the stale pending-export
    // marker must go with it — otherwise the mediaRequired gate passes on a
    // DISCARDED hero and publish uploads it (adversarial-review N1). The
    // orphaned blobMap entry on the shell side is harmless: uploadHero only
    // reads it through pendingBlobRef.
    const rest: MediaSlotValue = { ...prev };
    delete rest.pendingBlobRef;
    delete rest.exportMetadata;
    return { ...rest, editorState };
  }
  return { ...prev, editorState };
}

/**
 * `mediaSlot` substrate mount. 1:1 dial passthrough onto `<MediaEditor01>` —
 * `mediaSources` is the ONLY transformed dial (clamped to the real MediaSource
 * union). `presentation="inline"` is forced inside the composer (never portals a
 * dialog over the composer surface). Export is PULL-ONLY: the shell calls
 * `handle.export()` at publish/schedule; the substrate never exports on its own.
 */
export function MediaSubstrateMount({
  slotConfig,
  value,
  onChange,
  ctx,
  handleRef,
}: SlotRenderArgs<"mediaSlot">) {
  const mediaRef = useRef<MediaEditor01Handle | null>(null);
  const sourceBlobCache = useContext(MediaSourceBlobCacheContext);
  const stepId = ctx.stepId;

  const valueRef = useRef(value);
  useEffect(() => {
    valueRef.current = value;
  });

  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  // Mirror the blob backing the current canvas image into the shell cache so
  // the NEXT mount of this step can re-materialize the editorState snapshot.
  // Called on every dirty flip (capture / gallery / reset+retake) and at every
  // shell pull (getValue / export), so crop-apply source swaps are picked up
  // at step-leave too.
  const stashSourceBlob = useCallback(() => {
    const blob = mediaRef.current?.getSourceBlob();
    if (blob) sourceBlobCache?.set(stepId, blob);
  }, [sourceBlobCache, stepId]);

  // Re-seed the editor from a persisted editorState snapshot. Shared by the
  // step-revisit mount effect (review 1.4) and the handle's loadValue.
  const restoreEditorState = useCallback(
    (v: MediaSlotValue) => {
      const es = v.editorState;
      if (!es || !mediaRef.current) return;
      const sourceBlob = sourceBlobCache?.get(stepId) ?? null;
      if (sourceBlob) {
        // Full restore: loadState re-mints a live object URL from the blob
        // (the snapshot's imageSrc is dead — review 1.3) and rebuilds the
        // draft so the edit tools work exactly as before the step unmounted.
        mediaRef.current.loadState(
          { ...es, videoBlob: null } satisfies MediaEditorState,
          { sourceBlob },
        );
        return;
      }
      const deadImageSrc = !!es.imageSrc && es.imageSrc.startsWith("blob:");
      if (!deadImageSrc) {
        // Snapshot's imageSrc is durable (or absent) — replay it verbatim.
        mediaRef.current.loadState({
          ...es,
          videoBlob: null,
        } satisfies MediaEditorState);
        return;
      }
      if (v.exportedUrl) {
        // No cached blob (e.g. externally persisted draft in a fresh session)
        // but a flattened upload exists: show it WITHOUT replaying overlays —
        // they're already baked into the export (double-overlay hazard).
        mediaRef.current.loadState({
          ...es,
          videoBlob: null,
          imageSrc: v.exportedUrl,
          textOverlays: [],
          stickers: [],
          drawingStrokes: [],
          filter: null,
          adjustments: { brightness: 0, contrast: 0, saturation: 0, blur: 0 },
          crop: null,
        } satisfies MediaEditorState);
      }
      // else: nothing recoverable — leave the editor empty (documented limit:
      // durable cross-reload persistence rides with the upload backend).
    },
    [sourceBlobCache, stepId],
  );

  // Re-edit: a re-seeded hero URL (fromContentItem) becomes the initial source.
  // Mount-only — a lazy useState initializer runs once, so the editor isn't
  // re-mounted when the draft updates (and it's render-safe to read). When an
  // editorState snapshot exists, the restore effect below owns seeding instead
  // (passing initialSource TOO would race its async fetch against loadState).
  const [initialSource] = useState<InitialSource | undefined>(() =>
    value?.exportedUrl && !value?.editorState
      ? { kind: "url", url: value.exportedUrl, mode: "photo" }
      : undefined,
  );

  // Step-revisit restore (review 1.4): a fresh capture persists editorState
  // but no exportedUrl — previously this mounted an EMPTY editor and the
  // user's hero vanished. Runs once, after the editor mounts.
  const restoredRef = useRef(false);
  useEffect(() => {
    if (restoredRef.current) return;
    restoredRef.current = true;
    const v = valueRef.current;
    if (v?.editorState) restoreEditorState(v);
  }, [restoreEditorState]);

  useEffect(() => {
    const handle: SlotHandle<MediaSlotValue> = {
      getValue: () => {
        stashSourceBlob();
        return snapshotMediaValue(mediaRef.current, valueRef.current);
      },
      getIsDirty: () => mediaRef.current?.getIsDirty() ?? false,
      // Structural self-check (a hero exists OR capture/edit in progress). The
      // shell's gate layers the CONFIGURED mediaRequired rule. Content-aware
      // (not truthiness) — see editorStateHasMedia (N1).
      validate: async () =>
        !!valueRef.current?.exportedUrl ||
        !!valueRef.current?.pendingBlobRef ||
        editorStateHasMedia(valueRef.current?.editorState) ||
        (mediaRef.current?.getIsDirty() ?? false),
      loadValue: (v) => {
        onChangeRef.current(v);
        // Same re-materialization as the mount restore — the persisted
        // snapshot's imageSrc can't be trusted (review 1.3).
        if (v.editorState) restoreEditorState(v);
      },
      // mediaSlot-only — pull-only export for the shell's upload-on-publish.
      export: async () => {
        if (!mediaRef.current) {
          throw new Error(
            "content-composer-01: media export requested before the editor mounted.",
          );
        }
        stashSourceBlob();
        return mediaRef.current.export();
      },
    };
    assignRef(handleRef, handle);
  }, [handleRef, restoreEditorState, stashSourceBlob]);

  return (
    <MediaEditor01
      ref={mediaRef}
      enabledModes={slotConfig.enabledModes}
      enabledTools={slotConfig.enabledTools}
      mediaSources={clampMediaSources(slotConfig.mediaSources)}
      aspect={slotConfig.aspect}
      cropAspects={slotConfig.cropAspects}
      maxFileSizeMb={slotConfig.maxFileSizeMb}
      presentation="inline"
      initialSource={initialSource}
      onDirtyChange={() => {
        stashSourceBlob();
        const snap = snapshotMediaValue(mediaRef.current, valueRef.current);
        if (!editorStateHasMedia(snap.editorState)) {
          // Discarded capture: the cached source blob belongs to the dropped
          // image — clear it so a later restore can't resurrect it (N1).
          sourceBlobCache?.delete(stepId);
        }
        onChangeRef.current(snap);
      }}
    />
  );
}
