import type { ComponentMeta } from "../../../types";

export const meta: ComponentMeta = {
  slug: "media-editor",
  name: "Media Editor",
  category: "media",

  description:
    "Media capture and edit surface for photo, video, and text — capability dials and an Instagram-style chrome model.",
  context:
    "The reusable Konva-based editor lifted out of story-composer v0.1.5. Four orthogonal capability dials (enabledModes, enabledTools, mediaSources, aspect) plus initialSource intake and inline/dialog presentation let consumers pull as little or as much editor surface as their context needs. The chrome follows an Instagram model: mode tabs appear only in the capture stage and are replaced by a back-to-capture arrow once a draft exists; bottom edit tools overlay a full-bleed canvas; the canvas drag-pans with a single pointer (plus 2-finger / wheel / keyboard zoom). Story-composer-01 v0.2.0 is a thin wrapper around this. content-composer, chat-panel attachments, and CMS hero editors are downstream consumers.",
  features: [
    "Controllable capture modes (photo / video / text) gated by `enabledModes`",
    "Controllable edit tools (text / draw / stickers / filters / adjust / crop) gated by `enabledTools`",
    "Aspect lock (9:16 / 1:1 / 16:9 / 4:5 / free) for export + canvas",
    "Capture-vs-edit chrome: mode tabs are capture-only and swap to a back-to-capture arrow in the edit stage; bottom edit tools overlay a full-bleed canvas (IG-style scrim)",
    "Single-pointer drag-to-pan on the canvas, plus 2-finger / wheel / keyboard zoom (container-yields to draggable text/sticker overlays)",
    "Container-query-sized capture controls + min-size floor (dialog clamp / inline min-h) so the surface never collapses or overflows",
    "Media-source intake (camera + upload; library deferred to v0.2)",
    "Inline / dialog / auto presentation — auto picks dialog if capture enabled, else inline",
    "Imperative ref handle: inspect / state / edit-overlay / export wired (imperative *capture* methods dev-warn — deferred to v0.2)",
    "Initial-source intake (URL / Blob / File) — skips capture surface for re-edit workflows",
    "Polymorphic export() with format dispatch (jpeg / png / webp) + onProgress callback",
    "Video-export perf shortcut: skips MediaRecorder re-encode when nothing has been overlaid on the source",
    "Multi-instance dev-warn guard for camera contention",
    "Sealed-folder parts exported (EditorCanvas / EditorToolbar / ColorSwatchPicker / DiscardConfirmDialog) for advanced composition",
    "v0.1.5 — F-cross-13 path-b sweep: ModeTogglePill swaps shadcn ToggleGroup for a plain-button segmented control (Radix single-string vs Base-UI string[] value model; filter-panel 0.1.1 / event-calendar v0.2.1 precedent); pill styling + re-tap-noop semantics preserved. Zero public-API change.",
    "v0.3.0 — P3 feature-slicing: camera capture (getUserMedia/MediaRecorder, permission flows, shutter, multi-instance guard) split into the opt-in `@ilinxa/media-editor-capture` slice, wired in via `capture={mediaCapture}` (injection extension, not a static import). Base-alone now ships a real file/gallery intake surface (pick a file → edit → export) instead of a placeholder; the konva edit canvas gained a `React.lazy` boundary.",
  ],
  tags: [
    "media-editor",
    "image-editor",
    "video",
    "konva",
    "camera",
    "filters",
    "stickers",
    "editor",
  ],

  version: "0.3.0",
  status: "alpha",
  // Reduced from 365 (pre-P3) — capture's ~1,284 LOC left the base folder;
  // base gained a smaller file-intake surface + the capture-extension seam
  // in exchange. Verified against the real built artifact 2026-08-11:
  // public/r/media-editor.json = 282.0KB actual. Budget tightened 300→290
  // (R4: 300 would let growth silently drift past the plan's ≤275 bar
  // context; 290 keeps ~3% headroom so real growth trips the validator).
  artifactBudgetKB: 290,
  createdAt: "2026-06-02",
  updatedAt: "2026-08-11",

  author: { name: "ilinxa" },

  dependencies: {
    // Konva peer deps landed in C10 when EditorCanvas was mounted in the
    // root component for photo/video edit stages. Versions tracked against
    // producer's package.json per validate:meta-deps F-cross-07. Unchanged
    // by the P3 S3 capture split — the folder still ships EditorCanvas (base)
    // so the union of shipped-file imports is the same; capture's own npm
    // surface (none beyond lucide-react, already listed) is declared on the
    // `media-editor-capture` registry item separately.
    shadcn: ["dialog"],
    npm: {
      konva: "^10.3.0",
      "react-konva": "^19.2.4",
      "lucide-react": "^1.11.0",
    },
    internal: [],
  },

  // P3 feature-slicing (S3) — opt-in capability layered on top of this base.
  slices: [
    {
      name: "capture",
      item: "media-editor-capture",
      description:
        "Camera photo and video capture with permission flows, shutter controls, and multi-instance guard.",
    },
  ],

  related: [],
};
