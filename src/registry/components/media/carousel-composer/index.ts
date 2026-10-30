export { CarouselComposer } from "./carousel-composer";

export type {
  MediaCarouselItem,
  MediaKind,
  MediaCarouselSource,
  MediaCarouselError,
  CarouselComposerProps,
  CarouselComposerHandle,
  CarouselComposerLabels,
  CarouselAspectRatio,
  CarouselCropRect,
  CarouselCropOffset,
  CarouselExportMeta,
  CarouselEditingExtension,
  CarouselEditorPanelProps,
  ApplyEditPatch,
  MediaCarouselItemPatch,
  MediaCarouselItemStatus,
  MediaCarouselErrorKind,
  CarouselComposerLabelsInput,
  CarouselComposerErrorLabels,
  CarouselComposerDragLabels,
} from "./types";
export {
  defaultCarouselComposerLabels,
  PLATFORM_SAFE_MIME,
  DEFAULT_CAROUSEL_LABELS,
} from "./types";

// Headless state primitive — for consumers that recompose the surface from the
// parts below and need the model (items / selection / editing / URL lifecycle).
export { useCarouselState } from "./hooks/use-carousel-state";
export type {
  UseCarouselStateOptions,
  UseCarouselStateResult,
  CarouselStateCallbacks,
} from "./hooks/use-carousel-state";

// Public parts — for sealed-folder consumers that want to recompose the surface.
export { MediaDropzone } from "./parts/media-dropzone";
export type { MediaDropzoneProps } from "./parts/media-dropzone";
export { PreviewRail } from "./parts/preview-rail";
export type { PreviewRailProps } from "./parts/preview-rail";
export { RailThumb } from "./parts/rail-thumb";
export type { RailThumbProps } from "./parts/rail-thumb";
export { MainPreview } from "./parts/main-preview";
export type { MainPreviewProps } from "./parts/main-preview";
export { AspectSwitch } from "./parts/aspect-switch";
export type { AspectSwitchProps } from "./parts/aspect-switch";

// The centred crop of a W × H image at a width / height ratio (what `export()` reports as `crop`).
export { centredCropRect } from "./lib/aspect";

// Image editing is the opt-in `@ilinxa/carousel-composer-editing` item
// (`features/editing/`). The base barrel never exports it, so the base installs
// without media-editor.
