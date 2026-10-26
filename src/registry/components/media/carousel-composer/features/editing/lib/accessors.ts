import type {
  ExportMetadata,
  MediaEditorState,
} from "@/registry/components/media/media-editor/media-editor";
import type { MediaCarouselItem } from "../../../types";

/** The item's editable layers, typed as media-editor's `MediaEditorState`. */
export function editorStateOf(
  item: Pick<MediaCarouselItem, "editorState">,
): MediaEditorState | undefined {
  return item.editorState as MediaEditorState | undefined;
}

/** The item's last export metadata, typed as media-editor's `ExportMetadata`. */
export function exportMetaOf(
  item: Pick<MediaCarouselItem, "exportMeta">,
): ExportMetadata | undefined {
  return item.exportMeta as ExportMetadata | undefined;
}
