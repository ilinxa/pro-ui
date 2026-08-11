import type { ComponentMeta } from "../../../types";

export const meta: ComponentMeta = {
  slug: "story-composer",
  name: "Story Composer",
  category: "media",

  description:
    "Instagram-style story creation surface — a locked 9:16 wrapper around the media editor.",
  context:
    "Third and final component in the story-system trilogy alongside story-rail (discovery) and story-viewer (consumption). v0.2.0 delegates the capture + edit surface (camera, multi-layer Konva editor, all six tools, discard guard, history) to @ilinxa/media-editor (v0.1.1+), then layers the story-specific publish pipeline on top: ComposerPublishBar in the renderTopBar slot, PublishingProgressOverlay during upload, and a 14-method handle whose publish/exportBlob methods bridge ExportMetadata → PublishMetadata → PublishedStory. Camera-first defaults: rear camera on mobile, front on desktop, microphone for video. Public API 100% preserved across the v0.1.5 → v0.2.0 boundary; the 73-name export snapshot at docs/procomps/media-editor-procomp/story-composer-v0.1.5-exports.snapshot.txt resolves through the v0.2.0 barrel without omission.",
  features: [
    "Camera capture (photo + video + text-only modes) via getUserMedia + MediaRecorder",
    "Gallery picker fallback when camera is denied or unavailable",
    "Multi-layer Konva editor: image / drawing / stickers / text / UI",
    "Six edit tools — Text, Draw (vector + eraser), Stickers (36 built-in emoji + extensible), Filters (10 Instagram-style presets with pre-rendered thumbs), Adjust (brightness/contrast/saturation/blur), and opt-in Crop (9:16 / 1:1 / 4:5). Default `enabledTools` ships the first five; consumers add `\"crop\"` when their flow isn't 9:16-locked.",
    "Pan + zoom on the editor canvas (1×–4×): single-pointer drag-to-pan (mouse or 1-finger; yields to draggable text/sticker overlays), 2-finger touch pinch, mouse wheel anchored to cursor (native non-passive — beats browser page-zoom), keyboard arrows pan in image direction, +/-/0 zoom/reset",
    "Video record: long-press hold OR tap-to-toggle shutter; auto-stop at maxVideoDuration; two-handle trim bar; overlays bake into final video via canvas.captureStream + MediaRecorder pipeline",
    "Built-in upload via XHR POST FormData with progress, plus `uploader` escape hatch for signed-URL flows (S3 / Cloudinary / Mux)",
    "Responsive: mobile-fullscreen / desktop-modal sized to a viewport-relative 9:16 with a min/max clamp (can't collapse or overflow) and safe-area awareness; top bar follows the IG chrome model (X swaps to a back arrow in the edit stage; Publish hidden during photo/video capture)",
    "Undo/redo on every overlay + stroke command (Ctrl/Cmd+Z, Ctrl/Cmd+Shift+Z; 50-deep stack)",
    "Permission-denied auto-retry via navigator.permissions.query",
    "Discard-confirm guard for unsaved edits (opt-out via confirmOnDiscard: false)",
    "Live-region announcer for screen readers (Konva canvas is opaque to SR)",
    "Five exported sealed-folder parts + three exported hooks for advanced compositions",
    "14-method imperative handle (open/close/reset, switchCamera/takePhoto/startRecording/stopRecording/importFromGallery, addText/addSticker/setAdjustments/applyFilter, publish/exportBlob)",
    "v0.2.0 architecture: thin wrapper around @ilinxa/media-editor — capture + edit surface delegated; story-shaped publish flow + ComposerPublishBar layered on top",
  ],
  tags: [
    "story-composer",
    "stories",
    "camera",
    "image-editor",
    "video",
    "konva",
    "social",
    "publish",
  ],

  version: "0.3.0",
  status: "alpha",
  createdAt: "2026-05-31",
  updatedAt: "2026-08-11",

  author: { name: "ilinxa" },

  dependencies: {
    // Shadcn primitives directly imported by story-composer: just `button`
    // (composer-publish-bar + publishing-progress-overlay). `dialog` is no
    // longer imported here — the wrapper's MediaEditor mount owns the dialog
    // chrome, so dialog resolves transitively via the @ilinxa/media-editor
    // registry dependency. Other primitives (alert-dialog, popover, slider,
    // toggle-group) moved with their consumer parts to media-editor.
    shadcn: ["button"],
    npm: {
      "lucide-react": "^1.11.0",
      // konva + react-konva resolve transitively via the @ilinxa/media-editor
      // registryDependency — the C16 wrapper refactor dropped the type-only
      // Konva.Stage ref that v0.1.5 held directly.
    },
    internal: ["media-editor"],
  },

  related: ["story-viewer", "story-rail", "post-card", "media-editor"],
};
