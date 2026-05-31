import type { ComponentMeta } from "../../../types";

export const meta: ComponentMeta = {
  slug: "story-composer-01",
  name: "Story Composer 01",
  category: "media",

  description:
    "Instagram-canonical story creation surface: camera-first capture (photo/video/text), gallery pick, multi-layer Konva editor (text, stickers, drawing, filters, adjust, crop), built-in upload.",
  context:
    "Third and final component in the story-system trilogy alongside story-rail-01 (discovery) and story-viewer-01 (consumption). Composer publishes a PublishedStory (shape-compatible with viewer's Story) via onPublished callback OR built-in XHR upload to a consumer-supplied uploadUrl (with `uploader` escape hatch for signed-URL flows). Camera-first defaults: rear camera on mobile, front on desktop, microphone for video. Built on react-konva v19 for multi-layer canvas editing with filter presets and transformer handles.",
  features: [
    "Camera capture (photo + video + text-only modes) via getUserMedia + MediaRecorder",
    "Gallery picker fallback when camera is denied or unavailable",
    "Multi-layer Konva editor: image / drawing / stickers / text / UI",
    "Six edit tools: Text, Draw (vector + eraser), Stickers, Filters (10 presets), Adjust (brightness/contrast/saturation/blur), Crop (9:16 / 1:1 / 4:5)",
    "Built-in upload via XHR POST FormData with progress, plus `uploader` escape hatch for signed-URL flows",
    "Responsive: mobile-fullscreen / desktop-modal (400×711 true 9:16) with safe-area awareness",
    "Undo/redo for overlay operations",
    "Permission-denied auto-retry via navigator.permissions.query",
    "Discard-confirm guard for unsaved edits",
  ],
  tags: [
    "story-composer-01",
    "stories",
    "camera",
    "image-editor",
    "video",
    "konva",
    "social",
    "publish",
  ],

  version: "0.1.0",
  status: "alpha",
  createdAt: "2026-05-31",
  updatedAt: "2026-05-31",

  author: { name: "ilinxa" },

  dependencies: {
    shadcn: [
      "alert-dialog",
      "button",
      "dialog",
      "popover",
      "slider",
      "toggle-group",
    ],
    npm: {
      "lucide-react": "^1.11.0",
      konva: "^10.3.0",
      "react-konva": "^19.2.4",
    },
    internal: [],
  },

  related: ["story-viewer-01", "story-rail-01", "post-card-01"],
};
