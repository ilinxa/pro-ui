// carousel-composer editing feature — image editing through a shared
// media-editor, shipped as its own opt-in registry item
// (`@ilinxa/carousel-composer-editing`). It is the ONLY part of carousel-composer
// that depends on media-editor (and so on Konva).
//
// Injected into the base via `editing={carouselEditing}` (CarouselComposerProps —
// see `../../hooks/use-editing-extension.ts`). Ships with
// `registryDependencies: ["@ilinxa/carousel-composer", "@ilinxa/media-editor"]`.
//
// Also exports typed readers for the two item fields the base keeps opaque
// (`editorStateOf`, `exportMetaOf`) and the media-editor types a host needs.

import type { CarouselEditingExtension } from "../../types";
// Types are re-exported through `import type` + `export type`: the shadcn path
// rewriter rewrites `import` declarations only, never `export … from`.
import type {
  ExportMetadata,
  InitialSource,
  MediaEditorHandle,
  MediaEditorProps,
  MediaEditorState,
} from "@/registry/components/media/media-editor/media-editor";
import { CarouselEditPanel } from "./parts/edit-panel";

/** Pass straight through: `<CarouselComposer editing={carouselEditing} />`. */
export const carouselEditing: CarouselEditingExtension = {
  Panel: CarouselEditPanel,
};

export { CarouselEditPanel } from "./parts/edit-panel";
export { editorStateOf, exportMetaOf } from "./lib/accessors";

/** The media-editor props `CarouselComposer`'s `editorProps` forwards to the panel. */
export type CarouselEditorProps = Pick<
  MediaEditorProps,
  | "enabledTools"
  | "stickers"
  | "fonts"
  | "colorPresets"
  | "filterPresets"
  | "labels"
>;

export type {
  MediaEditorState,
  ExportMetadata,
  InitialSource,
  MediaEditorHandle,
};
