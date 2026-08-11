// media-editor capture feature — camera photo/video capture, permission
// flows, shutter control, multi-instance guard (P3 S3 feature-slicing).
//
// Injected into the base via `capture={mediaCapture}` (MediaEditorProps —
// see `../../hooks/use-capture-extension.ts`). Ships as its own registry
// item, `@ilinxa/media-editor-capture`, with a `registryDependencies: [
// "@ilinxa/media-editor"]` back onto the base.
//
// Re-exports every symbol the base barrel (../../index.ts) dropped when this
// slice was extracted — pre-split `@ilinxa/media-editor` imports of these
// names now resolve here instead. `validateGalleryFile` is the one
// exception: it's generic file-intake, not a capture concern, so it stayed
// (and remains exported from) the base.

import type { MediaCaptureExtension } from "../../hooks/use-capture-extension";
import { MediaCaptureProvider } from "./provider";

/** Pass straight through: `<MediaEditor capture={mediaCapture} />`. */
export const mediaCapture: MediaCaptureExtension = {
  Provider: MediaCaptureProvider,
};

export { MediaCaptureProvider } from "./provider";

export {
  useMediaCapture,
  suggestedVideoFilename,
  type UseMediaCaptureOptions,
  type UseMediaCaptureResult,
  type CapturedPhoto,
  type CapturedVideo,
  type CaptureStatus,
  type FacingMode,
} from "./hooks/use-media-capture";

export {
  useCameraPermissions,
  type CameraPermissionState,
  type UseCameraPermissionsResult,
} from "./hooks/use-camera-permissions";

export { useMultiInstanceGuard } from "./hooks/use-multi-instance-guard";

export { EditorCamera } from "./parts/editor-camera";
export type { EditorCameraProps } from "./parts/editor-camera";

export { CameraPermissionPrompt } from "./parts/camera-permission-prompt";
export { ShutterButton } from "./parts/shutter-button";
