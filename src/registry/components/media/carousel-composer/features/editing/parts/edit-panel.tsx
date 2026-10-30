"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MediaEditor } from "@/registry/components/media/media-editor/media-editor";
import type {
  InitialSource,
  MediaEditorHandle,
  MediaEditorProps,
  MediaEditorState,
} from "@/registry/components/media/media-editor/media-editor";
import type {
  CarouselEditorPanelProps,
  MediaCarouselItem,
} from "../../../types";
import { centredCropRect, offsetCropRect } from "../../../lib/aspect";

/** The only `editorProps` keys forwarded to media-editor; the rest stay the panel's. */
const FORWARDED_EDITOR_PROPS = [
  "enabledTools",
  "stickers",
  "fonts",
  "colorPresets",
  "filterPresets",
  "labels",
] as const;

function pickEditorProps(
  editorProps: Readonly<Record<string, unknown>> | undefined,
): Partial<MediaEditorProps> {
  const picked: Record<string, unknown> = {};
  if (!editorProps) return picked;
  for (const key of FORWARDED_EDITOR_PROPS) {
    if (editorProps[key] !== undefined) picked[key] = editorProps[key];
  }
  return picked as Partial<MediaEditorProps>;
}

function initialSourceFor(item: MediaCarouselItem): InitialSource {
  const mode = item.kind === "video" ? "video" : "photo";
  return item.blob
    ? { kind: "blob", blob: item.blob, mode }
    : { kind: "url", url: item.url, mode };
}

/** Cuts `rect` out of an encoded image; `null` when this environment cannot draw it. */
async function cropBlob(
  blob: Blob,
  rect: { x: number; y: number; width: number; height: number },
  mimeType: string | undefined,
): Promise<Blob | null> {
  try {
    const bitmap = await createImageBitmap(blob);
    const canvas = document.createElement("canvas");
    canvas.width = rect.width;
    canvas.height = rect.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.drawImage(bitmap, rect.x, rect.y, rect.width, rect.height, 0, 0, rect.width, rect.height);
    bitmap.close?.();
    return await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, mimeType || blob.type || "image/jpeg", 0.92),
    );
  } catch {
    return null;
  }
}

/**
 * The single, shared edit panel. Mounts ONE `media-editor` in edit-only mode
 * (`enabledModes={[]}` → no capture chrome / no photo-video tabs) for the
 * selected item, keyed by `item.id` so switching items remounts with a fresh
 * source.
 *
 * Re-edit contract (mirrors content-composer's media-substrate): when the item
 * already has `editorState`, we DON'T pass `initialSource` — `loadState` supplies
 * both the original image (`editorState.imageSrc`) AND the editable overlays.
 * Passing `initialSource` *as well* would composite the flattened export under
 * the re-applied overlays (double overlays). `initialSource` is only for the
 * first edit, before any `editorState` exists.
 */
export function CarouselEditPanel({
  item,
  aspect,
  aspectRatio,
  editorProps,
  labels,
  onApply,
  onCancel,
  onBusyChange,
}: CarouselEditorPanelProps) {
  const editorRef = useRef<MediaEditorHandle | null>(null);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  // True until media-editor shows the source (initialSource load / loadState). Escape is
  // swallowed by the carousel while this or the Done export is in flight.
  const [loading, setLoading] = useState(true);
  // ONE mount effect, in this order: a re-edit starts `loadState` first, THEN waits for the
  // editor to settle — otherwise "settled" could resolve before the load began and Escape
  // would stop being guarded while it loads. A first edit loads `initialSource` on mount.
  // `item` is fixed for this instance (the parent keys it by `item.id`).
  useEffect(() => {
    const editor = editorRef.current;
    if (item.editorState && editor) {
      // The snapshot's imageSrc is a DEAD object URL (revoked when the previous edit's
      // editor unmounted) — pass the persisted source blob so loadState re-mints a live
      // one instead of opening on a black canvas (review 1.3).
      editor.loadState(item.editorState as MediaEditorState, {
        sourceBlob: item.sourceBlob ?? null,
      });
    }
    if (!editor || typeof editor.whenSettled !== "function") {
      setLoading(false);
      return;
    }
    let alive = true;
    editor
      .whenSettled()
      .catch(() => {})
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const reportedBusy = loading || busy;
  useEffect(() => {
    onBusyChange?.(reportedBusy);
  }, [reportedBusy, onBusyChange]);

  const seedSource = item.editorState ? undefined : initialSourceFor(item);

  const isEditable = item.kind === "image";
  useEffect(() => {
    if (isEditable) return;
    if (process.env.NODE_ENV !== "production") {
      console.warn(
        `[CarouselComposer] CarouselEditPanel refused item "${item.id}": it is a ${item.kind}; only image items can be edited.`,
      );
    }
    onCancel();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleDone = async () => {
    const editor = editorRef.current;
    if (!editor || !isEditable) return;
    // Nothing changed since the source loaded: keep the item as it is instead
    // of re-encoding it (a re-encode would bake the letterbox into the photo).
    // `isModified` is media-editor 0.6.0+; an older vendored editor has none,
    // so treat it as modified (the 0.3.0 behaviour: always re-export).
    const modified =
      typeof editor.isModified === "function" ? editor.isModified() : true;
    if (!modified) {
      onCancel();
      return;
    }
    // Synchronously, before the (main-thread-heavy) export: the host's Escape guard must
    // already be armed for a key pressed in this same task, not after the effect below.
    onBusyChange?.(true);
    setBusy(true);
    setFailed(false);
    try {
      // Export only the photo's displayed area (no letterbox bars), at the photo's own
      // resolution; metadata width / height are the blob's pixels. A shared aspect: an
      // edited item must come back at it even when the crop tool was never used, so trim
      // (centred) to the largest rect of that ratio inside the photo's own pixels, never
      // upscaling. The photo's pixels are measured by a plain export first: an applied
      // crop replaces the editor's photo with a smaller one, so the item's own
      // width / height are not the pixels being exported.
      const exportAt = (rect: { width: number; height: number }) =>
        editor.exportImage({ region: "media", width: rect.width, height: rect.height });
      let result;
      if (aspectRatio == null) {
        result = await editor.exportImage({ region: "media" });
      } else {
        result = await editor.exportImage({ region: "media" });
        // The author's pan framing survives the trim (applyEdit then drops the offset).
        const rect = offsetCropRect(
          result.metadata.width,
          result.metadata.height,
          aspectRatio,
          item.cropOffset,
        );
        if (rect.width !== result.metadata.width || rect.height !== result.metadata.height) {
          const centred = centredCropRect(result.metadata.width, result.metadata.height, aspectRatio);
          // The editor's export only trims centred; an off-centre window is cut from the
          // full export. Without a canvas the centred trim is the fallback.
          const cut =
            rect.x !== centred.x || rect.y !== centred.y
              ? await cropBlob(result.blob, rect, result.metadata.mimeType)
              : null;
          result = cut
            ? { blob: cut, metadata: { ...result.metadata, width: rect.width, height: rect.height } }
            : await exportAt(rect);
        }
      }
      const { blob, metadata } = result;
      const url = URL.createObjectURL(blob);
      onApply(item.id, {
        url,
        blob,
        editorState: { ...editor.getState(), videoBlob: null },
        // The blob backing editorState.imageSrc — persisted so the NEXT
        // re-edit can re-materialize after this editor's URLs are revoked.
        sourceBlob: editor.getSourceBlob() ?? item.sourceBlob,
        exportMeta: metadata,
        width: metadata.width,
        height: metadata.height,
      });
    } catch {
      // Keep the panel open so the user can retry; nothing is committed.
      setFailed(true);
    } finally {
      setBusy(false);
    }
  };

  if (!isEditable) return null;

  return (
    <div className="flex flex-col gap-3">
      {/* No aspect-ratio or clip here: media-editor locks its own canvas to `aspect`. */}
      <div className="rounded-lg border border-border">
        <MediaEditor
          ref={editorRef}
          enabledModes={[]}
          presentation="inline"
          initialSource={seedSource}
          aspect={aspect}
          cropAspects={[aspect]}
          {...pickEditorProps(editorProps)}
        />
      </div>
      {failed ? (
        <p role="alert" className="text-sm text-destructive">
          {labels.editError}
        </p>
      ) : null}
      <div className="flex items-center justify-end gap-2">
        <Button
          type="button"
          variant="ghost"
          onClick={onCancel}
          disabled={busy}
        >
          {labels.editCancel}
        </Button>
        <Button
          type="button"
          onClick={handleDone}
          disabled={busy}
          aria-busy={busy || undefined}
        >
          {busy ? (
            <>
              <Loader2 className="size-4 animate-spin" aria-hidden />
              {labels.editSaving}
            </>
          ) : (
            labels.editDone
          )}
        </Button>
      </div>
    </div>
  );
}
