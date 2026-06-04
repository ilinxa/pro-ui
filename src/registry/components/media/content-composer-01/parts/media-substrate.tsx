"use client";

import { useEffect, useRef, useState } from "react";
import { MediaEditor01 } from "@/registry/components/media/media-editor-01/media-editor-01";
import type {
  InitialSource,
  MediaEditor01Handle,
  MediaEditorState,
} from "@/registry/components/media/media-editor-01/media-editor-01";
import type { MediaSlotValue, SlotHandle, SlotRenderArgs } from "../types";
import { assignRef } from "../lib/assign-ref";
import { clampMediaSources } from "../lib/clamp-media-sources";

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
  return {
    ...prev,
    editorState: { ...state, videoBlob: null },
  };
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
  handleRef,
}: SlotRenderArgs<"mediaSlot">) {
  const mediaRef = useRef<MediaEditor01Handle | null>(null);

  const valueRef = useRef(value);
  useEffect(() => {
    valueRef.current = value;
  });

  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  // Re-edit: a re-seeded hero URL (fromContentItem) becomes the initial source.
  // Mount-only — a lazy useState initializer runs once, so the editor isn't
  // re-mounted when the draft updates (and it's render-safe to read).
  const [initialSource] = useState<InitialSource | undefined>(() =>
    value?.exportedUrl && !value?.editorState
      ? { kind: "url", url: value.exportedUrl, mode: "photo" }
      : undefined,
  );

  useEffect(() => {
    const handle: SlotHandle<MediaSlotValue> = {
      getValue: () => snapshotMediaValue(mediaRef.current, valueRef.current),
      getIsDirty: () => mediaRef.current?.getIsDirty() ?? false,
      // Structural self-check (a hero exists OR capture/edit in progress). The
      // shell's gate layers the CONFIGURED mediaRequired rule.
      validate: async () =>
        !!valueRef.current?.exportedUrl ||
        (mediaRef.current?.getIsDirty() ?? false),
      loadValue: (v) => {
        onChangeRef.current(v);
        if (v.editorState && mediaRef.current) {
          // Photo round-trips through editorState.imageSrc (videoBlob stays
          // null). VIDEO restore would re-attach v.editorState.videoBlob from
          // the shell-held Map before loadState (the locked invariant) — that
          // path is deferred to the video config (news v0.1 is photo-only).
          mediaRef.current.loadState({
            ...v.editorState,
            videoBlob: null,
          } satisfies MediaEditorState);
        }
      },
      // mediaSlot-only — pull-only export for the shell's upload-on-publish.
      export: async () => {
        if (!mediaRef.current) {
          throw new Error(
            "content-composer-01: media export requested before the editor mounted.",
          );
        }
        return mediaRef.current.export();
      },
    };
    assignRef(handleRef, handle);
  }, [handleRef]);

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
      onDirtyChange={() =>
        onChangeRef.current(
          snapshotMediaValue(mediaRef.current, valueRef.current),
        )
      }
    />
  );
}
