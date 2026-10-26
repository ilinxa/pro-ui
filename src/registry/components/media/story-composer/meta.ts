import type { ComponentMeta } from "../../../types";

export const meta: ComponentMeta = {
  slug: "story-composer",
  name: "Story Composer",
  category: "media",

  description:
    "Instagram-style story creation surface — a locked 9:16 wrapper around the media editor.",
  context:
    "Third component in the story-system trilogy alongside story-rail (discovery) and story-viewer (consumption). It wraps @ilinxa/media-editor (requires 0.6.0+) for the capture + edit surface and layers the story publish flow on top: ComposerPublishBar in the renderTopBar slot, an optional details step (caption + host fields), and the progress / error overlay — both rendered through the editor's overlay prop, with the editor body inert behind them. The default install is upload-only; camera capture is opt-in by passing capture={mediaCapture} from @ilinxa/media-editor-capture, which keeps camera capture and recording out of the default install. Konva stays with the editor.",
  features: [
    "v0.6.1 — a mode switch keeps media-editor's modified flag, so Cancel after an edit still asks to discard (media-editor 0.6.0 `loadState(…, { keepModified })`)",
    "v0.6.0 — **breaking:** camera opt-in — the default install is upload-only and no longer depends on `@ilinxa/media-editor-capture`; pass `capture={mediaCapture}` to add it (`sources` defaults follow). `acceptMediaTypes` and `videoOutput` (e.g. MP4 only) are forwarded to media-editor. Details step: `caption` (`maxLength`, `required`), `renderPublishFields`, controlled `publishFields` / `onPublishFieldsChange`, `canPublish(fields)`; the uploader receives the fields as a third argument and the default upload adds them to its FormData. Error state: Cancel keeps the draft, `getErrorMessage`, localized uploader errors, `renderPublishingOverlay` gets `status` / `error` / `retry` / `cancel`. `onPublished(story, result)` passes the uploader's result untouched; a successful publish consumes the draft (the editor resets); one publish at a time, and close / `reset()` / Cancel cancel it; `publish()` opens the details step when one is configured; `ctx.openDetails`; Escape in the details step is Back and never closes the dialog. `labels.editor` takes media-editor's nested labels (no cast); `locale`; `labels.published` is announced. Overlay colours use `--media-overlay` tokens. Removed: the stale compat re-exports (ComposerCamera / ComposerEditor / ComposerToolbar / ColorSwatchPicker and the lib / default-token / crop helpers — import them from media-editor) and the never-rendered `drawUndo` / `drawRedo` / `textAlign` label keys",
    "v0.5.0 — the publishing overlay (default and `renderPublishingOverlay`) renders inside media-editor's dialog via its `overlay` prop, so Retry / Cancel are clickable",
    "v0.4.1 — `editorBackground` is marked @notImplemented and dev-warns; it was declared and never applied",
    "Photo, video and text-only modes; file upload by default, camera (photo + video recording) with the capture add-on",
    "Multi-layer Konva editor: image / drawing / stickers / text",
    "Edit tools — Text, Draw (with eraser), Stickers (built-in emoji + your own), Filters (built-in presets with thumbnails), Adjust (brightness / contrast / saturation / blur), and opt-in Crop. Default `enabledTools` ships the first five",
    "Pan + zoom on the editor canvas (1×–4×): drag to pan (yields to draggable overlays), two-finger pinch, wheel anchored to the cursor, arrow keys, +/-/0",
    "Video: picked or recorded videos are uploaded as the original file — no tool edits video (the tool chips are hidden for video drafts)",
    "Built-in upload via XHR POST FormData with progress, plus an `uploader` escape hatch for signed-URL flows",
    "Responsive: mobile full-screen / desktop 9:16 modal, safe-area aware; top bar follows the IG chrome model",
    "Discard-confirm guard for unsaved edits (opt-out via confirmOnDiscard: false)",
    "Exported parts: ComposerPublishBar, PublishDetailsStep; hooks: useStoryComposerState, useImageUploader",
    "Imperative handle: publish / exportBlob / reset / close and the editor's edit methods (addText, addSticker, setAdjustments, applyFilter); the capture methods and open forward to the editor, where they are not implemented",
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

  version: "0.6.1",
  status: "alpha",
  // 0.6.0: details step + publish fields + labels + the publish state machine
  // (run token, close reset). Built 74.7 KB after the U4 fix wave → 60 → 80.
  artifactBudgetKB: 80,
  createdAt: "2026-05-31",
  updatedAt: "2026-10-25",

  author: { name: "ilinxa" },

  dependencies: {
    // Shadcn primitives directly imported by story-composer: `button`
    // (publish bar, overlay, details step) and `textarea` (details step
    // caption). `dialog` resolves transitively via @ilinxa/media-editor.
    shadcn: ["button", "textarea"],
    npm: {
      "lucide-react": "^1.11.0",
      // konva + react-konva resolve transitively via the @ilinxa/media-editor
      // registryDependency.
    },
    internal: ["media-editor"],
  },

  related: ["story-viewer", "story-rail", "post-card", "media-editor"],
};
