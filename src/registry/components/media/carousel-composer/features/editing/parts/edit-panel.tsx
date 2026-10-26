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
import { aspectToCss } from "../../../lib/aspect";

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
  editorProps,
  labels,
  onApply,
  onCancel,
}: CarouselEditorPanelProps) {
  const editorRef = useRef<MediaEditorHandle | null>(null);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);

  const seedSource = item.editorState ? undefined : initialSourceFor(item);

  // Restore prior editable layers for a re-edit (mount-only — `item` is fixed
  // for this instance because the parent keys it by `item.id`). The snapshot's
  // imageSrc is a DEAD object URL (revoked when the previous edit's editor
  // unmounted) — pass the persisted source blob so loadState re-mints a live
  // one instead of opening on a black canvas (review 1.3).
  useEffect(() => {
    if (item.editorState && editorRef.current) {
      editorRef.current.loadState(item.editorState as MediaEditorState, {
        sourceBlob: item.sourceBlob ?? null,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
    setBusy(true);
    setFailed(false);
    try {
      // Export only the photo's displayed area (no letterbox bars), at the
      // photo's own resolution; metadata width / height are the blob's pixels.
      const { blob, metadata } = await editor.exportImage({ region: "media" });
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
      <div
        className="overflow-hidden rounded-lg border border-border"
        style={{ aspectRatio: aspectToCss(aspect) }}
      >
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
