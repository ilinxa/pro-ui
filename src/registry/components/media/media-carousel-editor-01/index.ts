export { MediaCarouselEditor01 } from "./media-carousel-editor-01";

export type {
  MediaCarouselItem,
  MediaKind,
  MediaCarouselSource,
  MediaCarouselError,
  MediaCarouselEditor01Props,
  MediaCarouselEditor01Handle,
  MediaCarouselEditor01Labels,
} from "./types";
export { DEFAULT_CAROUSEL_LABELS } from "./types";

// Headless state primitive — for consumers that recompose the surface from the
// parts below and need the model (items / selection / editing / URL lifecycle).
export { useCarouselState } from "./hooks/use-carousel-state";
export type {
  UseCarouselStateOptions,
  UseCarouselStateResult,
  CarouselStateCallbacks,
  ApplyEditPatch,
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
export { EditPanel } from "./parts/edit-panel";
export type { EditPanelProps } from "./parts/edit-panel";
