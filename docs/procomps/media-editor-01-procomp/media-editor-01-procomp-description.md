# media-editor-01 — procomp description

> Stage 1: what & why.
>
> **Extraction from `story-composer-01` v0.1.5.** Not greenfield. The Konva-based capture + edit surface inside story-composer is being lifted into a standalone procomp so it can be re-used by the in-flight `content-composer-01` (news/post/event/project authoring) and a queue of other consumers (chat attachments, profile cover photos, project hero media). Story-composer-01 simultaneously refactors to consume this extraction as **v0.2.0** (non-breaking, public API preserved) — proving the extraction is real, not theoretical, in the same release.
>
> Migration origin: `src/registry/components/media/story-composer-01/` v0.1.5 (tip `849c577`). Full file-move/stay split in §"Extraction scope" below.

## Problem

Story-composer-01's editor surface (capture → on-canvas edit → export) is the most reusable thing in our media stack — and it's currently sealed inside one procomp. Every adjacent surface that needs media authoring is forced to choose between:

1. **Re-implement** — write a parallel Konva editor (drift risk, duplicated bug surface, second `react-konva` peer-dep audit per consumer).
2. **Wrap story-composer-01 inappropriately** — open a "Create Story" UI with story-shaped chrome to edit a news hero image. Mode mismatch; users don't understand why they're "publishing a story" to edit a thumbnail.
3. **Wait for the editor** — block the queue.

None of those are acceptable. The right move is to extract the editor as its own procomp with **controllable surface area** so consumers can pull as little or as much of it as their context needs.

Concrete consumer scenarios (driving the API — **illustrative, not prescriptive**: the matrix maps known intent at description time; final per-consumer choices are made in each consumer's own description/plan):

| Consumer | Modes | Tools | Aspect | Source | Presentation |
|---|---|---|---|---|---|
| `story-composer-01` v0.2.0 (refactor) | photo / video / text | all 6 | 9:16 locked | camera + gallery | mobile-fullscreen / desktop-modal |
| `content-composer-01` news hero | photo | crop / filters / adjust | 16:9 locked | upload only (no camera in CMS) | inline (inside step 2 of composer) |
| `content-composer-01` post hero | photo | crop / filters / adjust / text / stickers | 1:1 locked | upload + library | inline |
| `content-composer-01` event cover | photo | crop / filters / adjust | 16:9 or 4:5 (consumer choice) | upload | inline |
| `chat-panel` attachment | photo / video | text / stickers / draw | free | camera + upload | dialog (mobile-fullscreen) |
| Profile cover-photo edit (future) | photo | crop / filters | 16:9 | upload only | inline |
| Edit-existing-media (CMS re-edit) | none (capture skipped) | filters / adjust / crop | per-content-type | initial blob/URL | inline |

Every row uses a strict subset of the same machinery. That's exactly the shape that wants a **black-box component with three orthogonal capability props** (modes / tools / aspect) plus a fourth (source intake) plus a fifth (presentation).

## Substrate decisions (inherited from story-composer-01 v0.1.5 — locked, not re-litigated)

| Concern | Choice | Source |
|---|---|---|
| Canvas engine | `react-konva` v19.x + `konva` v10 (peer deps) | story-composer-01 §"Substrate decisions" (project root resolves konva to v10; C1 verified) |
| Camera | `navigator.mediaDevices.getUserMedia` + `<video>` + `requestVideoFrameCallback` | inherited |
| Video capture | `MediaRecorder` with vp9 → vp8 → mp4 fallback chain | inherited |
| Video overlay compositing | `canvas.captureStream(30)` + offscreen canvas re-encode | inherited |
| Color picker | In-house popover + 12-preset swatch grid (NOT native `<input type="color">`) | inherited |
| Slider controls | shadcn `slider` primitive (plan locks substrate). | inherited |
| Modal / portal / focus trap | shadcn `dialog` primitive — used by `presentation: "dialog"` arm. Plan locks exact substrate (Radix vs Base UI) per F-cross-13. | inherited |
| Modal motion | CSS-only via Tailwind `data-state` animations | inherited |
| SSR boundary | `"use client"` + `dynamic(..., { ssr: false })` for Konva-touching parts | inherited |

The extraction does NOT relitigate any of these. The point of extracting is to share the substrate, not to reconsider it.

## What this procomp does NOT own (boundary with consumers)

This is the most important section of the description. The split is what makes the extraction work.

**media-editor-01 owns:**
- Capture surface (camera + gallery picker + mode toggle + permission flow)
- Konva canvas + multi-layer architecture (image / drawing / stickers / text / ui)
- All 6 edit tools (text / draw / stickers / filters / adjust / crop)
- Undo/redo + Ctrl+Z
- Pan + pinch-zoom
- Filter preset library (10 built-in) + sticker library (36 built-in emoji)
- Compositing (image: `stage.toDataURL`; video: `captureStream` + `MediaRecorder` overlay re-encode)
- Discard-with-confirm guard
- Imperative ref handle (export, capture, edit methods)

**Consumer (story-composer-01 / content-composer-01 / chat-panel) owns:**
- The decision of WHEN to publish (their own button, their own validation gate)
- Upload (uploadUrl / uploader / signed URLs / S3 / Cloudinary / Mux)
- Post-export semantics (what does "PublishedStory" / "ContentItem" / "ChatAttachment" look like?)
- The publish button itself (presentation prop tells media-editor which shell to render — modal vs inline — but the *publish CTA* always lives in consumer-rendered slots)
- Story/post/article/event-shaped publish callbacks
- Any draft persistence (IndexedDB / localStorage / server-side autosave)
- Compositing/upload progress UX (consumer renders busy state; media-editor only emits `onProgress` signal — see §7)

**Server-side concerns** (signed URL minting, virus scan, CDN sync) are obviously consumer-domain — listed for completeness but not in scope for any client-side procomp.

This split means **media-editor-01 has NO `onPublished` callback, NO `uploadUrl` prop, NO `uploader` prop.** It exports blob+metadata via the ref handle on demand. The consumer takes that blob and does whatever its content type needs.

## In scope (v0.1)

### 1. Capture surface (inherited, gated by `enabledModes` + `mediaSources`)

- Camera mode (default if `mediaSources` includes `"camera"`) — `getUserMedia` with `facingMode` auto-detect (UA-sniff).
- Camera switch button — front/rear on mobile.
- Gallery picker button — `<input type="file" accept="image/*,video/*">`.
- Permission-denied state — full-surface overlay with retry + fallback link.
- Permission-pending state — skeleton + "requesting camera…" copy.
- Mode toggle pill — top-center; hides any modes not in `enabledModes`. If only one mode is enabled, the pill is hidden entirely.

If `mediaSources` is `["upload"]` only (CMS case), the camera surface is replaced with a drag-and-drop dropzone + "Browse" button (keyboard-accessible — Tab focuses the Browse button, Enter opens the file picker). No camera permission flow runs.

**Footgun guard — `enabledModes: []` AND no `initialSource`**: this combination yields an editor with nothing to capture and nothing to edit. Runtime: shows a `renderEmpty` slot output (or default "No source provided" empty state). Dev: console.warn flags the misconfiguration. Documented in the guide as an explicit don't.

### 2. Capture modes (gated by `enabledModes`)

- **photo** — `<video>` frame grab → editor.
- **video** — `MediaRecorder` with long-press AND tap-to-toggle (both Instagram-parity behaviors); auto-stop at `maxVideoDuration`. Audio capture on by default; `recordAudio: false` opt-out.
- **text** — gradient background picker (8 presets) + centered text input + font/color picker → rendered to canvas → exported as PNG.

### 3. Edit canvas (Konva)

Multi-layer Konva.Stage:

```
<Stage>
  <Layer id="image">    {/* Konva.Image with cached filters */}
  <Layer id="drawing">  {/* Konva.Line[] freehand strokes */}
  <Layer id="stickers"> {/* Konva.Image[] sticker instances */}
  <Layer id="text">     {/* Konva.Text[] text overlays */}
  <Layer id="ui">       {/* Konva.Transformer */}
</Stage>
```

Each non-image layer item is selectable → Konva.Transformer with rotate + 8-handle resize + delete.

### 4. Edit tools (gated by `enabledTools`)

| Tool | Behavior | Layer touched |
|---|---|---|
| **text** | Tap → new overlay center-stage. Font dropdown + color picker + size slider. | text |
| **draw** | Freehand mode. Color + brush size + eraser. | drawing |
| **stickers** | Bottom-sheet picker. Built-in 36 emoji + consumer-supplied via `stickers` prop. | stickers |
| **filters** | Horizontal preset strip (10 built-in: Original, Clarendon, Gingham, Moon, Lark, Reyes, Juno, Slumber, Crema, Ludwig). | image (cached) |
| **adjust** | 4 sliders (brightness / contrast / saturation / blur). | image (cached) |
| **crop** | Aspect-ratio buttons. **Interaction with parent `aspect` prop:** if `aspect="9:16"` (locked), the canvas IS 9:16 — the crop tool's job is then sub-region selection WITHIN the locked aspect (default `cropAspects=[aspect]`). If `aspect="free"`, the crop tool exposes a fuller aspect menu (default `cropAspects=["9:16","1:1","16:9","4:5","free"]`). Consumer can override either default by passing `cropAspects` explicitly. | image |

Disabling a tool removes it from the toolbar AND removes the corresponding layer from the Stage if no overlays of that type exist (perf). The ref handle method for that tool (e.g., `addText()`) becomes a no-op + warns in dev.

### 5. Initial source (CMS re-edit / draft restore path)

`initialSource?: InitialSource` — when set, media-editor SKIPS the capture surface entirely and lands directly in the editor with the source pre-loaded.

```ts
type InitialSource =
  // image or video only — text mode is greenfield-only (no source semantic)
  | { kind: "url"; url: string; mode: "photo" | "video" }
  | { kind: "blob"; blob: Blob; mode: "photo" | "video" }
  | { kind: "file"; file: File };  // mode auto-detected from File.type
```

URL path: media-editor `fetch()`es the URL and loads it. Requires CORS-friendly URL. If CORS fails, consumer should pre-fetch and pass `kind: "blob"`. Validation error fires `onInitialSourceError`.

**Validation rules:**
- `initialSource.mode` (or file-type-derived mode) MUST be a member of `enabledModes`. Mismatch → `onInitialSourceError({ kind: "mode-not-enabled" })` + empty state.
- For `kind: "file"`, mode is derived from `File.type`: `image/*` → photo, `video/*` → video. Anything else (e.g. `text/plain`, `application/pdf`) → `onInitialSourceError({ kind: "unsupported-file-type" })` + empty state.
- `mode: "text"` is NOT a valid InitialSource — text-mode stories are greenfield-only. To re-edit a previously-rendered text story, load the rendered PNG via `kind: "url"` / `kind: "blob"` with `mode: "photo"`.

This is the primary path for: news/post composer step 2 ("edit the hero you uploaded in step 1"), CMS re-edit ("user wants to tweak a thumbnail published yesterday"), draft restore.

### 6. Presentation (inline vs dialog)

`presentation?: "inline" | "dialog" | "auto"` — default `"auto"`.

- **inline** — renders directly in the parent layout. No portal, no modal, no focus trap. Used by content-composer (step 2 of multi-step), CMS hero editor.
- **dialog** — wraps in shadcn `dialog`. Mobile-fullscreen / desktop-modal at a size derived from `aspect`: 400×711 (true 9:16) for `aspect="9:16"`, 600×600 for `"1:1"`, 800×450 for `"16:9"`, 500×625 for `"4:5"`, 800×600 for `"free"`. v0.1 does NOT expose a width-override prop — consumers who need custom sizing pass `presentation="inline"` and own the wrapper. Used by story-composer-01, chat-panel.
- **auto** — single rule, evaluated in order: (1) if `enabledModes` is empty (pure-edit context, no capture surface), pick `"inline"`. (2) Otherwise pick `"dialog"`. The presence of `initialSource` does NOT change the rule — capture-enabled editors with a pre-loaded source still want dialog chrome (story-composer re-edit case).

**Required-prop rule for dialog mode**: when `presentation` is `"dialog"` (or `"auto"` resolves to dialog), `isOpen` AND `onClose` are required props. Dev-only TypeScript-level enforcement is impractical (props depend on a runtime-resolved enum); runtime validation in dev (`process.env.NODE_ENV !== "production"`) fires `console.error("media-editor-01: presentation='dialog' requires isOpen + onClose props")` once per instance. Inline mode ignores both props.

Discard-with-confirm guard fires on Escape / backdrop click in dialog mode. In inline mode, the consumer owns navigation guarding (router-level beforeunload, multi-step composer "leave step" confirm, etc.) — media-editor exposes `getIsDirty()` on the handle so the consumer can wire it.

### 7. Output / export contract (LOCKED: ref handle, black-box, NOT controlled)

Per pre-sign-off lock:

```ts
export interface MediaEditor01Handle {
  // === Inspect ===
  /** True iff the user has captured OR loaded OR edited something. Capture without edit IS dirty (data loss risk). Editor-only consumers can use this for navigation guards. */
  getIsDirty: () => boolean;
  getMode: () => ComposerMode | null;
  getState: () => MediaEditorState; // serializable snapshot — for draft persistence
  loadState: (state: MediaEditorState) => void;

  // === Capture (only if enabledModes includes capture modes) ===
  switchCamera: () => Promise<void>;
  takePhoto: () => Promise<void>;
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<void>;
  importFromGallery: () => void;

  // === Edit (gated by enabledTools — disabled tool's methods warn + no-op) ===
  addText: (text?: string) => void;
  addSticker: (sticker: StickerOption) => void;
  setAdjustments: (adj: Partial<ImageAdjustments>) => void;
  applyFilter: (name: string | null) => void;
  clearLayer: (layer: "drawing" | "stickers" | "text") => void;
  undo: () => void;
  redo: () => void;

  // === Export ===
  exportImage: (opts?: ExportImageOpts) => Promise<{ blob: Blob; metadata: ExportMetadata }>;
  exportVideo: (opts?: ExportVideoOpts) => Promise<{ blob: Blob; metadata: ExportMetadata }>;
  /** Polymorphic — picks exportImage or exportVideo based on current mode. */
  export: (opts?: ExportOpts) => Promise<{ blob: Blob; metadata: ExportMetadata }>;

  // === Lifecycle ===
  reset: () => void;
  open: () => void;   // dialog mode only — no-op in inline
  close: () => void;  // dialog mode only — no-op in inline
}

export type ExportOpts = ExportImageOpts | ExportVideoOpts;
// ExportImageOpts + ExportVideoOpts shapes detailed below under "Export progress observability"
```

**Video export perf shortcut**: if `enabledTools` does NOT include `text` / `draw` / `stickers` (no overlay layers possible), `exportVideo()` skips the `captureStream` + `MediaRecorder` re-encode pipeline entirely and ships the original `videoBlob` as-recorded. Saves ~2× export time for "video upload, no editing" consumer scenarios (chat attachments, simple uploads). The shortcut is invisible to the consumer — same return shape.

**Export progress observability**: `exportVideo()` can take several seconds (re-encode pipeline). Consumer needs a way to show progress UX. The export ref-handle methods take an optional `onProgress` field in their opts:

```ts
export interface ExportImageOpts {
  format?: "image/jpeg" | "image/png" | "image/webp";
  quality?: number;
  pixelRatio?: number;
  onProgress?: (progress: number) => void; // 0..1; for jpeg/png/webp this fires twice (start, end) since compositing is sync; webp may fire interim ticks
}

export interface ExportVideoOpts {
  mimeType?: string;
  bitsPerSecond?: number;
  onProgress?: (progress: number) => void; // 0..1, fires ~10× during re-encode (or once if perf-shortcut applies)
}
```

The editor does NOT render an internal "compositing..." overlay — consumer owns the progress UX (story-composer wraps it in its existing publishing-progress-overlay; CMS consumers render their own busy state). This keeps the API surface honest with the §"What this procomp does NOT own" boundary.

### 8. Public API sketch

```ts
export interface MediaEditor01Props {
  // === Capability surface (the "partial use" dials) ===
  /** Which capture modes are available. Default ["photo","video","text"]. Empty array + initialSource = edit-only mode. */
  enabledModes?: ComposerMode[];
  /** Which edit tools appear in the toolbar. Default all 6. */
  enabledTools?: EditTool[];
  /** Which source intake methods are offered. Default ["camera","upload"]. */
  mediaSources?: MediaSource[];   // "camera" | "upload" — "library" deferred (see Out of scope)
  /** Aspect lock for the editor canvas. Default "free". */
  aspect?: AspectRatio;            // "9:16" | "1:1" | "16:9" | "4:5" | "free"

  // === Initial source (skip capture surface) ===
  initialSource?: InitialSource;
  onInitialSourceError?: (error: SourceError) => void;

  // === Presentation ===
  presentation?: "inline" | "dialog" | "auto";  // default "auto"
  isOpen?: boolean;       // dialog mode only
  onClose?: () => void;   // dialog mode only

  // === Capture config (only meaningful if enabledModes overlaps capture modes) ===
  defaultMode?: ComposerMode;
  defaultFacing?: "user" | "environment";
  maxVideoDuration?: number;    // default 30
  recordAudio?: boolean;        // default true
  maxFileSizeMb?: number;       // default 50
  onValidationError?: (error: ValidationError) => void;
  onPermissionDenied?: () => void;

  // === Edit-tool config ===
  stickers?: StickerSet[];
  replaceBuiltinStickers?: boolean;
  fonts?: FontOption[];
  colorPresets?: string[];
  filterPresets?: FilterPreset[];
  replaceBuiltinFilters?: boolean;
  cropAspects?: AspectRatio[];   // overrides default crop choices (default derivation rule: see §4 "crop" row)

  // === Discard guard ===
  confirmOnDiscard?: boolean;   // default true. Dialog mode only — fires on Escape/backdrop click/programmatic close() when dirty. Inline mode ignores this (consumer owns navigation guarding via getIsDirty() handle).

  // === Localization ===
  labels?: Partial<MediaEditor01Labels>;

  // === State change observability (no replacement for ref handle, just signals) ===
  onModeChange?: (mode: ComposerMode | null) => void;
  onDirtyChange?: (isDirty: boolean) => void;
  onEditAction?: (action: EditAction) => void;  // for analytics / undo-history sync

  // === Slots (escape hatches) ===
  renderTopBar?: (ctx: EditorCtx) => ReactNode;
  renderBottomToolbar?: (ctx: EditorCtx) => ReactNode;
  renderPermissionDenied?: (ctx: { retry: () => void; usePicker: () => void }) => ReactNode;
  renderEmpty?: () => ReactNode;
}
```

**NOTABLY ABSENT** (intentionally — consumer-owned):
- No `uploadUrl` / `uploader` / `uploadFields`
- No `onPublished` callback
- No "story" / "post" / "article" -shaped output type
- No XHR upload progress overlay (the export ref handle returns a blob; consumer owns upload UI)

### 9. Exported hooks

Live in `media-editor-01/hooks/` and are exported via the procomp's `index.ts` barrel:

- `useMediaEditorState()` — editor state machine (replaces story-composer's `useStoryComposerState` for editor-shaped concerns). Used internally and exported for consumers building custom shells.
- `useMediaCapture(opts)` — `getUserMedia` + `MediaRecorder` lifecycle. Returns `{ videoRef, stream, takePhoto, startRecording, stopRecording, switchCamera, error }`.

`useImageUploader()` is **NOT exported by media-editor-01** — it stays in story-composer-01 (upload is consumer concern). story-composer-01 v0.2.0 retains its `useImageUploader` export from v0.1.5 unchanged.

**Backward-compat for v0.1.5 consumers of story-composer-01 hooks:**
- `useMediaCapture` — was exported by story-composer-01 v0.1.5. After v0.2.0, the canonical home is media-editor-01. story-composer-01 v0.2.0 re-exports it (`export { useMediaCapture } from "../media-editor-01"`) for one minor version with a JSDoc `@deprecated` pointing at the new import path; removed in v0.3.0.
- `useStoryComposerState` — was exported by story-composer-01 v0.1.5 and has a story-shaped return type (includes `publishStatus`, `uploadProgress`, story-specific draft fields that media-editor-01 doesn't own). Stays in story-composer-01 v0.2.0 with **identical return shape**. Internals **compose `useMediaEditorState` + augment** with the story-specific fields — NOT pure delegation. Plan locks the exact composition shape so the return-type invariant is provable.

The plan also locks the exact re-export shims for any other names that v0.1.5 exposed (sticker types, filter preset types, etc. — if they're now in media-editor-01, story-composer-01 v0.2.0 re-exports them from its types.ts barrel).

### 10. Sealed-folder parts exported (for compound-shell consumers)

Even though the public API is black-box (per pre-sign-off lock Q2), the parts are still exported as named exports for advanced consumers who want to compose their own shell:

- `<EditorCamera>` — capture surface (camera + gallery + mode toggle)
- `<EditorCanvas>` — Konva canvas + transformer
- `<EditorToolbar>` — bottom edit tools
- `<ColorSwatchPicker>` — popover color picker
- `<DiscardConfirmDialog>` — unsaved-edits guard

This is a **sealed-folder export, not a compound API.** No `<MediaEditor.Camera>` ergonomics. Consumers import named exports directly. This keeps the v0.1 surface honest (one black-box top-level + escape-hatch named exports) without committing to a compound contract.

### 11. Accessibility

A+ procomps don't ship without explicit a11y. Carries forward from story-composer-01 §13 + adapts for the editor-only scope (no publish button):

- **Camera permission denied / pending**: live region (`role="status"` + `aria-live="polite"`) announces state changes. Retry button receives focus on prompt mount; "use gallery" link is a sibling focusable element.
- **All edit tools** in the toolbar have visible label + `aria-label` (consumer overrides via `labels.toolbar`). Tools are reached via Tab; toolbar items behave as a roving-tabindex group (per shadcn-equivalent pattern).
- **Text tool input** is a proper `<textarea>` with `aria-label` (consumer overrides via `labels`).
- **Color picker** is keyboard-navigable: Tab focuses the picker trigger, Enter opens, Arrow keys navigate swatches, Enter selects, Escape closes.
- **Sliders** (adjust panel): native `<input type="range">` semantics via shadcn `slider`; `aria-label` + `aria-valuetext` ("Brightness, 50%").
- **Export in progress**: `aria-busy="true"` on the editor root; consumer's progress UX should announce state changes via its own live region (media-editor only emits the `onProgress` signal).
- **Discard confirm dialog**: focus trap + Escape close + `aria-labelledby` (title) + `aria-describedby` (body) — inherited from shadcn `dialog`.
- **Konva canvas is NOT screen-reader accessible** (canvas elements have no accessibility tree). Workaround: media-editor surfaces an **"edit summary" live region** announcing actions: "Added text 'Hello'", "Applied filter Clarendon", "Recording started", "Photo captured", "Sticker placed". Consumer can opt out via `labels.editSummary.enabled = false` if their UX provides its own announcer.
- **Focus management on mode/tool transitions**: when the editor transitions capture → edit, focus moves to the first toolbar item; when a tool's modal panel opens (e.g., color picker, sticker grid), focus moves to its first interactive element; on close, focus returns to the toolbar button that opened it.
- **`enabledModes: []` + no `initialSource` empty state**: the `renderEmpty` slot output (or default fallback) gets `role="status"` + an `aria-label` describing the misconfiguration to dev (separate from the console warning).
- **Reduced-motion** (`prefers-reduced-motion: reduce`): dialog open/close animations + mode-pill transitions + tool-panel slides are disabled — falls back to instant transitions per shadcn convention.

### 12. Design-system token compliance

Inherited from story-composer-01 v0.1.5 — media-editor-01 holds the line on `.claude/CLAUDE.md` Design system mandate:

- **Fonts**: Onest (sans) for UI chrome + JetBrains Mono (mono) for any code-like surfaces. Never system fonts.
- **Accent**: `--primary` = signal-lime (`oklch(0.80 0.20 132)` light / `oklch(0.86 0.18 132)` dark). Always paired with near-black `--primary-foreground`. Lime is the publish/active-tool accent only; never on body text or icon defaults.
- **Backgrounds**: dialog backdrop uses `bg-black/95` (story-composer convention preserved); editor canvas background uses `--background` (cool off-white light / graphite-cool dark per CLAUDE.md).
- **Surfaces**: toolbar / mode-pill / tool panels use `--card` (raised surface); color picker popover uses `--popover`.
- **Forbidden**: pure-white page backgrounds (editor inline-mounted in a CMS picks up consumer's surface — verify CMS uses non-pure-white per CLAUDE.md); purple-on-white gradient clichés; neon-saturated lime.

All token usage is via Tailwind v4 CSS variables (`bg-background`, `text-foreground`, `border-border`, etc.) — no hardcoded hex values, no `tailwind.config.*` (already not present per Tailwind v4 convention). Demo's "Dark" tab verifies token-driven dark mode without per-color overrides.

### 13. Browser test matrix (feature × browser)

Carries forward from story-composer-01 — manual matrix per the `feedback_browser_test_documented_headless_patterns` memory (no automated browser tests). Each shipped feature must be exercised on each row:

| Feature | Chrome desktop | Safari iOS | Chrome Android |
|---|---|---|---|
| `getUserMedia` (camera) | ✅ HTTPS or localhost | ✅ HTTPS only | ✅ HTTPS or localhost |
| Front/rear camera switch | n/a (single cam) | ✅ | ✅ |
| `MediaRecorder` video capture | ✅ VP9 | ⚠️ MP4 only — `mime-fallback.ts` chain catches | ✅ VP9 |
| Video overlay compositing (`captureStream` + re-encode) | ✅ | ⚠️ test thoroughly — codec quirks | ✅ |
| Gallery picker (`<input type="file">`) | ✅ | ✅ | ✅ |
| Konva canvas + transformer + multi-layer | ✅ | ✅ | ✅ |
| Pan + pinch-zoom | wheel + keyboard | 2-finger touch | 2-finger touch |
| Color picker keyboard nav | ✅ | partial (Safari focus quirks) | ✅ |
| Discard confirm (Escape, backdrop) | ✅ | ✅ | ✅ |
| Dialog mobile-fullscreen | n/a | ✅ verify safe-area | ✅ |
| `prefers-reduced-motion` | ✅ | ✅ | ✅ |
| Export to JPEG/PNG/WebP | ✅ all 3 | ⚠️ WebP older iOS — fallback documented | ✅ all 3 |

Smoke is documented patterns only; consumer-tsc clean post-install (path-b) is the regression gate per shipped procomp convention.

### 14. SSR + Konva caveat

Inherited from story-composer-01 §14. `"use client"` at the procomp boundary; Konva-touching parts (canvas-shell + capture-shell) wrapped in `dynamic(import(...), { ssr: false })` so they don't crash during the RSC pass when the host page is server-rendered.

### 15. Key type sketches

```ts
export type ComposerMode = "photo" | "video" | "text";
export type EditTool = "text" | "draw" | "stickers" | "filters" | "adjust" | "crop";
export type MediaSource = "camera" | "upload";  // "library" deferred to v0.2+ (see Out of scope)
export type AspectRatio = "9:16" | "1:1" | "16:9" | "4:5" | "free";

export interface MediaEditorState {
  mode: ComposerMode | null;
  imageSrc: string | null;       // data: URI or blob: URL
  videoBlob: Blob | null;
  textBackground: GradientPreset | null;  // text mode only
  textContent: string | null;
  textOverlays: TextOverlay[];
  stickers: PlacedSticker[];
  drawingStrokes: DrawingStroke[];
  filter: string | null;
  adjustments: ImageAdjustments;
  crop: CropRect | null;
}

export interface ExportMetadata {
  mode: ComposerMode;
  width: number;
  height: number;
  durationMs?: number;
  mimeType: string;
  textOverlays: TextOverlay[];
  stickers: PlacedSticker[];
  drawingStrokes: number;
  appliedFilter?: string;
  adjustments: ImageAdjustments;
  crop?: CropRect;
}

// Rest of the types (TextOverlay, PlacedSticker, ImageAdjustments, FilterPreset, FontOption, StickerOption, StickerSet,
// GradientPreset, DrawingStroke, CropRect, ValidationError, SourceError, EditAction, EditorCtx, MediaEditor01Labels)
// move from story-composer-01 v0.1.5 types.ts as-is — types.ts re-locates them, NOT renamed (locked in plan §"Type system":
// ComposerMode stays ComposerMode, not MediaEditorMode, because v0.1.5 published it and renaming breaks backcompat;
// story-composer-01 v0.2.0 re-exports them from media-editor-01 via the type re-export band).
// New types added by this procomp: MediaEditor01Props, MediaEditor01Handle, MediaEditor01Labels, EditorCtx, InitialSource,
// ExportImageOpts, ExportVideoOpts, ExportOpts, SourceError, MediaSource, AspectRatio.
// EditorCtx is the read-only context passed to render* slots: { mode, isDirty, activeTool, enabledTools, enabledModes, aspect, isCapturing, isExporting }.
```

## Extraction scope — what moves, what stays, what splits

### Files that MOVE from `story-composer-01/` → `media-editor-01/`

**hooks/** (7 of 9):
- `use-camera-permissions.ts` → as-is
- `use-drawing-stroke.ts` → as-is
- `use-history.ts` → as-is (undo/redo)
- `use-konva-selection.ts` → as-is
- `use-konva-stage-size.ts` → as-is
- `use-media-capture.ts` → as-is (re-exported)
- `use-pan-zoom.ts` → as-is

**lib/** (5 of 6):
- `built-in-stickers.ts` → as-is (base64 inline retained from story-composer Q-P9 lock)
- `composite-video.ts` → as-is
- `export-blob.ts` → as-is
- `konva-filters.ts` → as-is
- `mime-fallback.ts` → as-is

**parts/** (16 of 20):
- `camera-permission-prompt.tsx` → as-is
- `color-swatch-picker.tsx` → as-is (renamed export remains)
- `composer-camera.tsx` → renamed `editor-camera.tsx`
- `composer-editor.tsx` → renamed `editor-canvas.tsx`
- `composer-toolbar.tsx` → renamed `editor-toolbar.tsx`
- `discard-confirm-dialog.tsx` → as-is
- `mode-toggle-pill.tsx` → as-is
- `shutter-button.tsx` → as-is
- `text-only-canvas.tsx` → as-is
- `tool-adjust-sliders.tsx` → as-is
- `tool-crop-overlay.tsx` → as-is
- `tool-draw-controls.tsx` → as-is
- `tool-filter-strip.tsx` → as-is
- `tool-sticker-picker.tsx` → as-is
- `tool-text-input.tsx` → as-is
- `video-trim-bar.tsx` → as-is

### Files that STAY in `story-composer-01/`

**hooks/** (2):
- `use-image-uploader.ts` — upload is story-specific (XHR + uploadUrl + uploader props)
- `use-story-composer-state.ts` — story-shaped state machine wrapping the editor

**lib/** (1):
- `defaults.ts` — story-specific labels + defaults (some entries split out; see "splits" below)

**parts/** (4):
- `composer-shell.tsx` — story-shaped modal chrome
- `composer-publish-bar.tsx` — story's top-right publish CTA
- `publishing-progress-overlay.tsx` — upload progress UI (consumer-specific)
- (potentially a new `parts/story-composer-shell.tsx` if the current shell needs further split)

### What SPLITS (one file becomes two)

- **`lib/defaults.ts`** — editor defaults (color presets, font list, filter list, sticker positions) move to `media-editor-01/lib/defaults.ts`. Story defaults (labels strings for "Your story" / "Close friends", upload defaults) stay.
- **`types.ts`** — editor-shaped types (`ComposerMode`, `EditTool`, `TextOverlay`, `PlacedSticker`, `ImageAdjustments`, `StickerOption`, `StickerSet`, `FilterPreset`, `FontOption`, `AspectRatio`, `ValidationError`, `GradientPreset`, `DrawingStroke`, `CropRect`, etc.) move to `media-editor-01/types.ts`. Story-shaped types (`PublishedStory`, `PublishMetadata`, `PublishResult`, `StoryComposer01Props`, `StoryComposer01Handle`, `StoryComposer01Labels`) stay in story-composer-01's types.ts. **Critical non-breaking rule**: story-composer-01 v0.2.0/types.ts MUST `export type { ComposerMode, EditTool, TextOverlay, PlacedSticker, ImageAdjustments, StickerOption, StickerSet, FilterPreset, FontOption, AspectRatio, ValidationError } from "../media-editor-01"` so any v0.1.5 consumer doing `import type { ComposerMode, ValidationError } from "@ilinxa/story-composer-01"` still type-checks. Removing the re-exports is a breaking change reserved for v0.3.0+. Plan §"Type re-exports audit" locks the full list against v0.1.5's actual exported surface (read via `tsc --emitDeclarationOnly` against the pre-extraction snapshot to catch any miss).

### story-composer-01 v0.2.0 — the consumer side

After extraction, story-composer-01 becomes a thin wrapper:

```tsx
// src/registry/components/media/story-composer-01/story-composer-01.tsx
"use client";
import { MediaEditor01, type MediaEditor01Handle } from "../media-editor-01";

export function StoryComposer01({ uploadUrl, uploader, onPublished, ... }: StoryComposer01Props) {
  const editorRef = useRef<MediaEditor01Handle>(null);
  const [isPublishing, setIsPublishing] = useState(false);

  const handlePublish = async () => {
    const { blob, metadata } = await editorRef.current!.export();
    setIsPublishing(true);
    const result = await uploadVia(uploadUrl, uploader, blob, metadata);
    onPublished(mapToPublishedStory(result, metadata));
    setIsPublishing(false);
  };

  return (
    <MediaEditor01
      ref={editorRef}
      aspect="9:16"
      enabledTools={["text","draw","stickers","filters","adjust"]} // crop opt-in carried forward
      enabledModes={["photo","video","text"]}
      mediaSources={["camera","upload"]}
      presentation="dialog"
      renderTopBar={(ctx) => <ComposerPublishBar {...ctx} onPublish={handlePublish} isPublishing={isPublishing} />}
      /* ... rest of props pass-through ... */
    />
  );
}
```

**Public API of story-composer-01 v0.2.0 is identical to v0.1.5.** No breaking change. The only diff is one new internal peer dep (`@ilinxa/media-editor-01`) declared in `meta.ts`.

## Out of scope for v0.1

- **AR face filters** (inherited from story-composer §"Out of scope")
- **Music overlay** (inherited)
- **Polls / quizzes / question stickers** (inherited)
- **GIF support** (inherited)
- **Boomerang / slow-mo / hyperlapse** (inherited)
- **Multi-segment stories** (inherited — also: this is story-domain, not editor-domain)
- **Draft persistence to IndexedDB** (editor exports state via `getState()`; consumer owns storage)
- **Pre-capture filter strip** (Instagram has this; we don't — too much complexity for v0.1; filters are edit-only)
- **Compound subcomponent API** (`<MediaEditor.Canvas />` etc.) — pre-sign-off lock = black-box. Named parts exported for escape-hatch use only, no `Root` orchestration.
- **`uploader` / `uploadUrl` props** — consumer concern. Editor exports blob; consumer owns upload.
- **Backwards-compat shim for story-composer-01 v0.1.x** — refactor is internal; public API preserved; no shim needed.
- **`mediaSources: "library"`** — a "pick from CMS media library" intake source. Deferred to v0.2+ because every CMS exposes its library API differently (Cloudinary, S3 bucket browser, Mux assets, custom). v0.1 ships `["camera","upload"]` only; consumers needing library intake can wire their library picker to fire `editor.loadState({ mode: "photo", imageSrc: pickedUrl })` via the ref handle.
- **Custom dialog size override prop** — v0.1 dialog size is derived from `aspect`. Consumers needing other sizes use `presentation="inline"` and own the wrapper. v0.2+ may add a `dialogSize` prop if demand surfaces.

## Q-Ps for sign-off (LOCKED 2026-06-02)

5 genuinely-open calls. Story-composer's Q-Ps that already locked (e.g., Q-P9 inline base64 stickers) carry forward without re-prompting.

**Sign-off summary** (all locked to recommended option):

| Q-P | Decision |
|---|---|
| **Q-P1** | (a) Default `aspect = "free"` — every consumer opts in to their lock; story-composer wrapper sets `"9:16"` explicitly. |
| **Q-P2** | (a) Default `enabledModes = ["photo","video","text"]` — Instagram-parity default; subset consumers already pass the prop. |
| **Q-P3** | (a) Default `exportImage()` format = `"image/jpeg"` quality 0.9 — safest small-file default; PNG/WebP opt-in via `{ format }`. |
| **Q-P4** | (a) `initialSource: { kind: "url" }` CORS failure → fire `onInitialSourceError({ kind: "cors" })` + empty state with retry CTA. |
| **Q-P5** | (b) Multi-instance: allow, but dev-only `console.warn` when 2+ capture-enabled instances mount. Counter gated by `NODE_ENV !== "production"`. Edit-only multi-instance unconditionally fine. |

Original Q-P table preserved below for context.

| Q-P | Question | Options |
|---|---|---|
| **Q-P1** | Default `aspect` value when consumer omits the prop. | (a) `"free"` — no aspect lock. Story-composer + every other consumer must opt-in to their lock. Removes magic. (b) `"9:16"` — inherits story's lock. Consumer must opt OUT for other shapes. (c) `"auto"` — derives from source dimensions if `initialSource` is set, else `"free"`. **(Recommended: a — `"free"`. Every consumer's needed aspect is different; story-composer explicitly sets `"9:16"` in its wrapper; no inheritance burden.)** |
| **Q-P2** | Default `enabledModes` when consumer omits the prop. | (a) `["photo","video","text"]` — all 3, matches story-composer's "Instagram parity" expectation. (b) `["photo"]` — minimal, most consumers want only photo. (c) Required prop, no default. **(Recommended: a — all 3 by default; cheapest consumer for the "I just want the full editor" case is one prop omitted. Power-consumers who want a subset are already setting other gating props anyway.)** |
| **Q-P3** | Default export format for `exportImage()`. | (a) `"image/jpeg"` at quality 0.9 — smallest file, lossy, fine for social and most CMS heroes. (b) `"image/png"` — lossless, larger file (often 3–8× JPEG), better for thumbnails / illustrations / anything with transparency. (c) `"image/webp"` — modern, smaller than PNG, similar quality, but not all consumer backends accept webp uploads. (d) Required `format` opt — no default. **(Recommended: a — JPEG 0.9 is the safest small-file default; PNG/WebP demand is consumer-specific and opt-in via `{ format }`. Universal backend support trumps theoretical quality.)** |
| **Q-P4** | `initialSource: { kind: "url" }` — fetch behavior on CORS failure. | (a) Fire `onInitialSourceError({ kind: "cors" })` and show an "Image couldn't load" empty state with a "Try a different image" CTA. Consumer-friendly. (b) Silent error + leave editor in capture-surface state. Cheap. (c) Always require consumer to pre-fetch and pass `kind: "blob"`; URL path is a footgun. **(Recommended: a — explicit error, escape hatch via blob path documented. URL convenience pays for itself in CMS use cases where the URL is same-origin.)** |
| **Q-P5** | Multi-instance behavior — can a single page mount 2+ `<MediaEditor01 />` instances simultaneously (e.g., two side-by-side hero editors in a layout-builder)? Technical reality: each instance owns its own Konva.Stage (fine, no conflict). Browsers DO allow multiple `getUserMedia` streams to the same camera, but the second stream often inherits the first's constraints + perf degrades quickly with 2+ live camera previews. | (a) Allow unconditionally — no warning. (b) Allow, but dev-only `console.warn` when 2+ capture-enabled instances mount simultaneously, suggesting the consumer use `presentation="dialog"` (one-at-a-time UX) or restrict to edit-only mode for the secondary instances. (c) Hard block — throw if a second capture-enabled instance mounts; consumer must explicitly opt out via `allowConcurrentCapture` prop. **(Recommended: b — dev-warn but don't block. Most multi-instance use cases ARE edit-only; the warning catches the real footgun without blocking valid two-camera UIs the consumer knows what they're doing about.)** |

## Dependencies (peer)

Same as story-composer-01 v0.1.5:

| Package | Version | Why |
|---|---|---|
| `konva` | `^10.3.0` | Canvas engine. (Verified at C1 — project root resolves to v10.x.) |
| `react-konva` | `^19.2.4` | Official React bindings. |

No new peer deps. story-composer-01 v0.2.0 adds `@ilinxa/media-editor-01` as a registry-side dependency (declared in registry.json `registryDependencies` + meta.ts), not a peer dep.

## Workflow / verification gates this procomp must pass

- **GATE 1** (this document) — **CLOSED 2026-06-02** ✅ (all 5 Q-Ps locked, recommended options taken)
- **GATE 2** — implementation plan (extraction sequencing + story-composer-01 v0.2.0 refactor strategy; per-commit chain; verification per stage)
- **GATE 3** — readiness review (AI-assisted per procomp-tier policy at v0.1.0; spotcheck template with rotating dim = **Public API** — extraction's dominant risk is whether the public surface maps cleanly from the v0.1.5 capabilities consumers depended on through story-composer-01; visual regression on story-composer demo tabs is the canonical check)
- **F-cross-13 smoke surface — verified LOWER risk than precedent**: media-editor consumes 3 shadcn primitives (`dialog`, `slider`, `popover`). C1 substrate verification (2026-06-02) confirmed all three import from the unified `radix-ui` package (`^1.4.3`); `@base-ui-components/react` is NOT in `package.json`. Popover exports `PopoverAnchor`; Dialog + Popover both support `asChild` on triggers. The Base-UI-shaped sub-traps that hit engagement-bar-01 v0.3.0 (2026-05-28) do NOT apply to media-editor-01 v0.1.0 — the project's primitive layer has since reverted to Radix conventions. Standard Radix patterns used in C12 (no defensive wiring needed). Live smoke (consumer-tsc + `pnpm dlx shadcn add` to a tmp consumer) at C15 + C22 mandatory as the regression gate.

## Migration origin

- **Source**: `src/registry/components/media/story-composer-01/` v0.1.5 (tip `849c577`).
- **Reason**: editor surface is more reusable than the story wrapper; concrete consumers identified for v0.1.0 ship (story-composer-01 v0.2.0 wrapper + the in-flight `content-composer-01` design).
- **Original lives on** as story-composer-01 v0.2.0 wrapper. v0.1.5 is the final pre-extraction sealed-folder version (frozen in git history).

## Estimated scope

- **~30–34 files** in the new procomp (most are moves, not rewrites)
- **~32 public props + ~22 imperative-handle methods** (props smaller than story-composer's 70+ because upload + onPublished + story-shaped concerns drop out; handle slightly bigger than story-composer's because export + state-load methods are formalized)
- **~7–8 days** end-to-end (Phase A 5 days + Phase B 2 days + Phase C 1–2 days):
  - Phase A — Day 1–2: file moves (git mv hooks/lib/parts + path-renames + types.ts split + lib/defaults.ts split) with story-composer-01 staying green
  - Phase A — Day 3: media-editor-01 root + state + presentation + capability gating + initialSource + ExportOpts + multi-instance guard
  - Phase A — Day 4: demo (5 tabs) + dummy-data + F-cross-13 defensive popover wiring + usage + meta + manifest already-mounted-since-C6
  - Phase A — Day 5: registry.json + registry:build + pre-Phase-B internal smoke + guide.md draft
  - Phase B — Day 6: story-composer-01 v0.2.0 wrapper refactor (handlePublish + ref handle wiring + presentation="dialog") + useStoryComposerState compose + demo regression
  - Phase B — Day 7: meta.ts bump + registryDependencies + manifest sync + every v0.1.5 demo tab visually verified identical
  - Phase C — Day 7–8: GATE 3 spotcheck for media-editor-01 + wrapper-equivalence spotcheck for story-composer-01 v0.2.0 + cross-procomp install smoke + STATUS + decision file + push to master
- **22 commits** locked by plan (Phase A 15 + Phase B 4 + Phase C 3). Minimum 2 pushes; realistic 22-commit chain pushed as one set at C22.
- **Browser-test matrix** carries over from story-composer-01 — Chrome desktop + Safari iOS + Chrome Android.
