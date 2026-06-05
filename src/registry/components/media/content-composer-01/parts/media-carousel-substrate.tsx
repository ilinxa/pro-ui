"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";
import { MediaCarouselEditor01 } from "@/registry/components/media/media-carousel-editor-01/media-carousel-editor-01";
import type { MediaCarouselItem } from "@/registry/components/media/media-carousel-editor-01/media-carousel-editor-01";
// ↑ import from the .tsx component-file path (the F-01-safe entry — its tail band
//   re-exports the types; a barrel/`/types` import gets mangled by the rewriter).
import type {
  MediaCarouselItemRef,
  MediaCarouselSlotValue,
  SlotHandle,
  SlotRenderArgs,
} from "../types";
import { assignRef } from "../lib/assign-ref";

/** A ref to a per-composer map of live carousel items (with blobs), keyed by step id. */
export type CarouselLiveCache = { current: Map<string, MediaCarouselItem[]> };

/**
 * Live-items cache provided by the composer root. The carousel's local blobs
 * can't live in the JSON-clean draft, so navigating away from the media step
 * would otherwise drop them. The shell stays mounted across steps, so caching
 * the live items here (and running the carousel with `revokeOnUnmount={false}`
 * so its object URLs survive the step unmount) makes step navigation lossless.
 * Durable cross-RELOAD persistence still rides with the upload-at-publish
 * backend (deferred); the composer root revokes any cached blob URLs on unmount.
 */
export const CarouselLiveCacheContext = createContext<CarouselLiveCache | null>(
  null,
);

/** Live carousel items → JSON-clean draft refs. Object URLs aren't durable, so
 *  only real (https/remote) URLs persist; local items keep no recoverable URL
 *  (and therefore no `editorState` — it would be unreconstructable bloat). */
function serialize(items: MediaCarouselItem[]): MediaCarouselSlotValue {
  return {
    items: items.map((it): MediaCarouselItemRef => {
      const durable = !it.url.startsWith("blob:");
      return {
        id: it.id,
        kind: it.kind,
        exportedUrl: durable ? it.url : undefined,
        editorState:
          durable && it.editorState
            ? { ...it.editorState, videoBlob: null }
            : undefined,
        exportMetadata: durable ? it.exportMeta : undefined,
      };
    }),
  };
}

/** Rebuild live items from the draft. Only refs with a durable URL can be
 *  restored; returns the count of dropped (local, un-uploaded) refs so the
 *  caller can surface the loss instead of silently truncating. */
function reconstruct(value: MediaCarouselSlotValue | undefined): {
  items: MediaCarouselItem[];
  dropped: number;
} {
  if (!value?.items?.length) return { items: [], dropped: 0 };
  const items: MediaCarouselItem[] = [];
  let dropped = 0;
  for (const r of value.items) {
    if (r.exportedUrl) {
      items.push({
        id: r.id,
        kind: r.kind,
        url: r.exportedUrl,
        editorState: r.editorState ?? undefined,
        exportMeta: r.exportMetadata,
      });
    } else {
      dropped += 1;
    }
  }
  return { items, dropped };
}

/**
 * `mediaCarouselSlot` substrate mount. The substrate CONTROLS the carousel: it
 * holds the live `MediaCarouselItem[]` (with blobs) and feeds it the blob-free
 * serialized view to the draft on every change. On (re)mount it prefers the
 * shell's live cache (lossless step-revisit) and falls back to reconstructing
 * from the persisted draft.
 */
export function MediaCarouselSubstrateMount({
  slotConfig,
  value,
  onChange,
  ctx,
  handleRef,
}: SlotRenderArgs<"mediaCarouselSlot">) {
  const cache = useContext(CarouselLiveCacheContext);
  const stepId = ctx.stepId;

  const [items, setItems] = useState<MediaCarouselItem[]>(() => {
    const cached = cache?.current.get(stepId);
    if (cached) return cached;
    const { items: rebuilt, dropped } = reconstruct(value);
    if (dropped > 0 && process.env.NODE_ENV !== "production") {
      console.warn(
        `content-composer-01: ${dropped} local carousel item(s) couldn't be restored ` +
          `(not yet uploaded). Durable persistence rides with the upload-at-publish backend.`,
      );
    }
    return rebuilt;
  });

  const itemsRef = useRef(items);
  useEffect(() => {
    itemsRef.current = items;
  });

  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  // Dirty baseline — a freshly restored/cached draft is NOT dirty until edited
  // (length-as-dirty would falsely flag a reopened post draft + churn autosave).
  const dirtyRef = useRef(false);

  // Mirror live items into the shell cache so a step-revisit restores them
  // exactly (blobs included), not just the durable subset.
  useEffect(() => {
    cache?.current.set(stepId, items);
  }, [cache, stepId, items]);

  useEffect(() => {
    const handle: SlotHandle<MediaCarouselSlotValue> = {
      getValue: () => serialize(itemsRef.current),
      getIsDirty: () => dirtyRef.current,
      validate: async () => itemsRef.current.length > 0,
      loadValue: (v) => {
        const { items: rebuilt } = reconstruct(v);
        itemsRef.current = rebuilt;
        dirtyRef.current = false;
        setItems(rebuilt);
      },
    };
    assignRef(handleRef, handle);
  }, [handleRef]);

  return (
    <MediaCarouselEditor01
      value={items}
      onChange={(next) => {
        dirtyRef.current = true;
        setItems(next);
        onChangeRef.current(serialize(next));
      }}
      // The shell cache + composer-root cleanup own URL revocation across step
      // nav; don't let the carousel revoke on its (frequent) step unmounts.
      revokeOnUnmount={false}
      maxItems={slotConfig.maxItems ?? 10}
      maxFileSizeMb={slotConfig.maxFileSizeMb}
      accept={slotConfig.accept ?? ["image", "video"]}
      aspect={slotConfig.aspect ?? "auto"}
      editorProps={
        slotConfig.enabledTools
          ? { enabledTools: slotConfig.enabledTools }
          : undefined
      }
    />
  );
}
