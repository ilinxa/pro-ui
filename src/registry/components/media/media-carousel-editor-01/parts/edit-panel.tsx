"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MediaEditor01 } from "@/registry/components/media/media-editor-01/media-editor-01";
import type {
  AspectRatio,
  InitialSource,
  MediaCarouselEditor01Props,
  MediaCarouselItem,
  MediaEditor01Handle,
} from "../types";
import type { ApplyEditPatch } from "../hooks/use-carousel-state";
import { aspectToCss } from "../lib/aspect";

export interface EditPanelProps {
  item: MediaCarouselItem;
  aspect: AspectRatio;
  editorProps?: MediaCarouselEditor01Props["editorProps"];
  labels: {
    editDone: string;
    editCancel: string;
    editSaving: string;
    editError: string;
  };
  onApply: (id: string, patch: ApplyEditPatch) => void;
  onCancel: () => void;
}

function initialSourceFor(item: MediaCarouselItem): InitialSource {
  const mode = item.kind === "video" ? "video" : "photo";
  return item.blob
    ? { kind: "blob", blob: item.blob, mode }
    : { kind: "url", url: item.url, mode };
}

/**
 * The single, shared edit panel. Mounts ONE `media-editor-01` in edit-only mode
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
export function EditPanel({
  item,
  aspect,
  editorProps,
  labels,
  onApply,
  onCancel,
}: EditPanelProps) {
  const editorRef = useRef<MediaEditor01Handle | null>(null);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);

  const seedSource = item.editorState ? undefined : initialSourceFor(item);

  // Restore prior editable layers for a re-edit (mount-only — `item` is fixed
  // for this instance because the parent keys it by `item.id`).
  useEffect(() => {
    if (item.editorState && editorRef.current) {
      editorRef.current.loadState(item.editorState);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleDone = async () => {
    const editor = editorRef.current;
    if (!editor) return;
    setBusy(true);
    setFailed(false);
    try {
      const { blob, metadata } = await editor.export();
      const url = URL.createObjectURL(blob);
      onApply(item.id, {
        url,
        blob,
        editorState: { ...editor.getState(), videoBlob: null },
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

  return (
    <div className="flex flex-col gap-3">
      <div
        className="overflow-hidden rounded-lg border border-border"
        style={{ aspectRatio: aspectToCss(aspect) }}
      >
        <MediaEditor01
          ref={editorRef}
          enabledModes={[]}
          presentation="inline"
          initialSource={seedSource}
          aspect={aspect}
          cropAspects={[aspect]}
          {...editorProps}
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
