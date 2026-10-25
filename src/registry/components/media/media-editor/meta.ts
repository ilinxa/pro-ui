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
    "v0.5.0 — **breaking:** every user-visible string is a label — `labels` is the nested `MediaEditorLabels` tree with every group and key optional (templated strings are functions), `labels.presets` names the built-in backgrounds / fonts / stickers / filters, `locale` formats the numbers; the `@internal` `StoryComposerLabels` shim is gone (parts and `MediaCaptureSurfaceProps.labels` take the public `MediaEditorResolvedLabels`; `editorLabelsFromFlat` converts flat labels); `labels.empty.*` now renders and `labels.publish` is removed. `acceptMediaTypes` drives both file pickers and the validator; `videoOutput.mimeTypes` restricts re-encoding and recording (video mode hidden + one `onValidationError` when none can be recorded); a passed-through video keeps its own MIME type; video drafts show no tool chips. Media chrome uses `--media-overlay` / `--media-overlay-foreground` and the recording / warning colours use `--destructive` / `--warning`. While `overlay` renders something the editor body is `inert`, focus moves into the overlay and Tab wraps inside it, and the dialog ignores its own close requests. A passed-through video reports its real size and duration. Video hiding applies only when recording is reachable (camera + capture wired). The exported `useHistory` claims Ctrl/Cmd+Z only when there is something to undo (and Ctrl+Y redoes)",
    "v0.4.0 — the documented nested `labels` prop now works (nested keys map onto the internal strings; flat keys still accepted and win on conflict); new additive `overlay` prop renders inside the editor surface (inside the dialog in dialog presentation); every warn-only handle method (capture methods, undo/redo, open, no-arg addText) is tagged `@notImplemented`; version pins removed from messages and docs",
    "v0.3.1 — `handle.open()` dev-warns instead of failing silently (dialog mode is controlled, so set `isOpen` on the component)",
    "Controllable capture modes (photo / video / text) gated by `enabledModes`",
    "Controllable edit tools (text / draw / stickers / filters / adjust / crop) gated by `enabledTools`",
    "Aspect lock (9:16 / 1:1 / 16:9 / 4:5 / free) for export + canvas",
    "Capture-vs-edit chrome: mode tabs are capture-only and swap to a back-to-capture arrow in the edit stage; bottom edit tools overlay a full-bleed canvas (IG-style scrim)",
    "Single-pointer drag-to-pan on the canvas, plus 2-finger / wheel / keyboard zoom (container-yields to draggable text/sticker overlays)",
    "Container-query-sized capture controls + min-size floor (dialog clamp / inline min-h) so the surface never collapses or overflows",
    "Media-source intake (camera + upload; a library source is not implemented)",
    "Inline / dialog / auto presentation — auto picks dialog if capture enabled, else inline",
    "Imperative ref handle: inspect / state / edit-overlay / export wired (imperative *capture* methods, undo/redo, open and no-arg addText dev-warn — not implemented)",
    "Initial-source intake (URL / Blob / File) — skips capture surface for re-edit workflows",
    "Polymorphic export() with format dispatch (jpeg / png / webp) + onProgress callback",
    "Video: picked or recorded videos export as the original file (no tool edits video yet)",
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

  version: "0.5.0",
  status: "alpha",
  heavy: true,
  // Reduced from 365 (pre-P3) — capture's ~1,284 LOC left the base folder;
  // base gained a smaller file-intake surface + the capture-extension seam
  // in exchange. Verified against the real built artifact 2026-08-11:
  // public/r/media-editor.json = 282.0KB actual. Budget tightened 300→290
  // (R4: 300 would let growth silently drift past the plan's ≤275 bar
  // context; 290 keeps ~3% headroom so real growth trips the validator).
  // 0.5.0: labels for every string (81 keys + defaults + normalizer table),
  // formats, tokens, overlay focus / Tab wrap, video probe. Built 332.8 KB
  // after the U4 fix wave (U1 estimated ~294) → budget 290 → 345.
  artifactBudgetKB: 345,
  createdAt: "2026-06-02",
  updatedAt: "2026-10-25",

  author: { name: "ilinxa" },

  dependencies: {
    // Konva peer deps landed in C10 when EditorCanvas was mounted in the
    // root component for photo/video edit stages. Versions tracked against
    // producer's package.json per validate:meta-deps F-cross-07. Unchanged
    // by the P3 S3 capture split — the folder still ships EditorCanvas (base)
    // so the union of shipped-file imports is the same; capture's own npm
    // surface (none beyond lucide-react, already listed) is declared on the
    // `media-editor-capture` registry item separately.
    shadcn: ["alert-dialog", "button", "dialog", "popover", "slider"],
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
