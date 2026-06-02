import type { ComponentMeta } from "../../../types";

export const meta: ComponentMeta = {
  slug: "media-editor-01",
  name: "Media Editor 01",
  category: "media",

  description:
    "Black-box media capture + edit surface (photo / video / text) with controllable capability dials — extracted from story-composer-01 for re-use by content-composer / chat / CMS hero editors.",
  context:
    "The reusable Konva-based editor lifted out of story-composer-01 v0.1.5. Three orthogonal capability props (enabledModes, enabledTools, aspect) plus media source intake and inline/dialog presentation let consumers pull as little or as much editor surface as their context needs. Story-composer-01 v0.2.0 becomes a thin wrapper around this. content-composer-01, chat-panel attachments, and CMS hero editors are downstream consumers.",
  features: [
    "Controllable capture modes (photo / video / text) gated by `enabledModes`",
    "Controllable edit tools (text / draw / stickers / filters / adjust / crop) gated by `enabledTools`",
    "Aspect lock (9:16 / 1:1 / 16:9 / 4:5 / free) for export + canvas",
    "Media-source intake (camera + upload; library deferred to v0.2)",
    "Inline / dialog / auto presentation — auto picks dialog if capture enabled, else inline",
    "Imperative ref handle: 22 methods covering inspect / capture / edit / export / lifecycle",
    "Initial-source intake (URL / Blob / File) — skips capture surface for re-edit workflows",
    "Polymorphic export() with format dispatch (jpeg / png / webp) + onProgress callback",
    "Video-export perf shortcut: skips re-encode if no overlay tools enabled",
    "Multi-instance dev-warn guard for camera contention",
    "Sealed-folder parts exported (EditorCamera / EditorCanvas / EditorToolbar / ColorSwatchPicker / DiscardConfirmDialog) for advanced composition",
  ],
  tags: [
    "media-editor-01",
    "image-editor",
    "video",
    "konva",
    "camera",
    "filters",
    "stickers",
    "editor",
  ],

  version: "0.1.0",
  status: "alpha",
  createdAt: "2026-06-02",
  updatedAt: "2026-06-02",

  author: { name: "ilinxa" },

  dependencies: {
    // Grow progressively as each commit's imports land (per `project_validate_meta_deps_lint` memory + plan C1 lock).
    // Verified at C1: konva ^10.3.0 + react-konva ^19.2.4 will be added when first source file imports them.
    // shadcn primitives (dialog, slider, popover, button, input, select) added when corresponding parts land in C3-C12.
    shadcn: [],
    npm: {},
    internal: [],
  },

  related: [],
};
