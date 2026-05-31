# story-composer-01 — procomp description

> Stage 1: what & why.
>
> **Greenfield** — no migration origin. Inspired by Instagram's "Create Story" flow. Closes the story system trilogy:
> - [`story-rail-01`](../story-rail-01-procomp/) — discovery (horizontal user rail with unread rings)
> - [`story-viewer-01`](../story-viewer-01-procomp/) — consumption (full-screen viewer with cube transitions)
> - **`story-composer-01`** — creation (camera-first capture + edit + publish)
>
> Decoupled from the other two. Composer publishes a `PublishedStory` (shape-compatible with `story-viewer-01`'s `Story`) via the `onPublished(story)` callback OR via built-in upload to `uploadUrl`. Host maps composer.PublishedStory → viewer.Story (trivial — same field names) and appends to the feed; the rail/viewer pick it up. Composer doesn't know either of them exists, AND does NOT cross-import types — the registry rule bans cross-procomp imports beyond `react` / `@/components/ui/*` / `@/lib/utils` / explicit peer deps.

## Problem

Every social product needs an Instagram-canonical story creation surface — camera-first, gallery-fallback, on-canvas editing, one-tap publish. Building it ad-hoc means re-implementing:

- `getUserMedia` lifecycle (acquire → stream → capture → release) with permission-denied UX
- Front/rear camera switching on mobile, with the right `facingMode` constraints
- Gallery picker (`<input type="file" accept="image/*,video/*">`) that doesn't trash the camera stream
- Canvas-based image editor with **draggable text overlays + stickers + freehand drawing + filter presets + brightness/contrast/saturation/blur**
- Video capture via `MediaRecorder` (codec selection, blob assembly, preview, trim)
- **Compositing**: text + stickers + drawing layers must bake into the final PNG/JPEG/WebM blob on publish
- Multi-layer canvas (image / text / stickers / drawing) with per-layer transformer handles (resize/rotate/delete)
- Upload with progress + retry, plus an escape-hatch for signed-URL flows (S3, Cloudinary, Mux)
- Responsive composition: full-screen on mobile (portrait 9:16), centered modal on desktop (matches `story-viewer-01`'s `md:w-100 md:h-175 md:rounded-2xl`)

`story-composer-01` ships all of this as a single sealed procomp built on **`react-konva` v19.x** (multi-layer canvas, React-19-compatible, official React bindings — chosen over Fabric.js after research showing Fabric has no official React-19 binding and only a 3rd-party `fabricjs-react` wrapper).

## Substrate decisions (locked at description time)

| Concern | Choice | Why |
|---|---|---|
| Canvas editor | **`react-konva` v19.x + `konva` v9** (peer deps) | Official React bindings (Fabric has none); React-19-compatible by version-major-match; multi-layer architecture (one Konva.Layer per concern: image / text / stickers / drawing); built-in canvas filters (`Konva.Filters.Brighten`/`Contrast`/`HSL`/`Blur`/`Noise`); Konva docs cover stickers + filters explicitly. |
| Camera | `navigator.mediaDevices.getUserMedia({ video: { facingMode } })` + `<video>` + `requestVideoFrameCallback` for snapshot | Web-standard. No peer dep. |
| Video capture | `MediaRecorder` (codec preference: `video/webm;codecs=vp9` → fallback `video/webm;codecs=vp8` → fallback `video/mp4`) | Web-standard. Composer hands the consumer a `Blob` + `mimeType`. |
| Video overlay compositing | `requestVideoFrameCallback` + offscreen `<canvas>` re-encoded via `MediaRecorder` reading from `canvas.captureStream(30)` | Pure web-stdlib. No `ffmpeg.wasm` (~25MB) for v0.1. v0.2 can add ffmpeg.wasm path for higher-quality compositing if needed. |
| Modal / portal / focus trap | shadcn `dialog` (Radix) — same as `story-viewer-01` | Free focus trap, portal, Escape, aria-modal. |
| Modal motion | CSS-only via Tailwind `data-state` animations | Matches `story-viewer-01` motion ethos. No `framer-motion` peer dep. |
| Color picker (text + drawing) | In-house picker — shadcn `popover` + 12-preset swatch grid + custom hex input | No new peer dep. Native `<input type="color">` is intentionally NOT used (inconsistent OS-native UI breaks the design system). |
| Slider controls (brightness/contrast/saturation/blur) | shadcn `slider` (Radix) | Already a project primitive. |
| Upload | Built-in `XMLHttpRequest` POST FormData with progress events (uploadUrl prop), plus `uploader?: (blob, meta) => Promise<{ url }>` escape hatch | XHR (not fetch) because fetch lacks upload-progress events in browsers. Escape hatch covers signed-URL flows (S3 pre-signed PUT, Cloudinary, Mux direct upload). |

## In scope (v0.1 — full Instagram parity per user lock)

### 1. Capture surface

- **Camera mode (default on mount)** — `getUserMedia` with `facingMode: "user"` on desktop, `facingMode: "environment"` on mobile (touch-capable UA sniff). Shutter button center-bottom.
- **Camera switch button** — bottom-right, flips front↔rear (mobile only; hidden on desktop unless multiple devices enumerated).
- **Gallery picker button** — bottom-left, opens `<input type="file" accept="image/*,video/*">`. On image: loads into editor. On video: loads into video editor (trim mode).
- **Permission-denied state** — full-screen overlay with instruction copy + retry button + "use gallery instead" fallback link.
- **Permission-pending state** — skeleton + "requesting camera…" copy.
- **Mode toggle pill** — top-center, "Photo / Video / Text" (Instagram parity). Switches capture mode. Text mode lets users post text-only stories (gradient background + centered text).

### 2. Capture mode — photo

- Tap shutter → grab current `<video>` frame via `canvas.drawImage` → transition to editor.
- Editor canvas dimensions: **9:16 portrait** (Instagram-canonical), clamped to viewport with `aspect-[9/16]` + `max-h-[100dvh]`.

### 3. Capture mode — video

- **Two shutter behaviors (both shipped — Instagram parity):**
  - **Long-press hold** → start recording on press, stop on release. Ring fills around shutter (0 → `maxVideoDuration`s).
  - **Tap-to-toggle** → tap once to start (ring begins filling + shutter switches to a red stop icon), tap again to stop. Ideal for desktop where long-press is unergonomic.
- Auto-stop when `maxVideoDuration` (default 30s) is reached → transition to editor.
- **Audio capture is ON by default** (video without audio is broken UX); consumer can disable via `recordAudio: false` (separate mic permission acquired alongside camera; permission-denied UX same as camera-denied state).
- Trim UI: two-handle range slider on a video scrubber timeline + frame previews every 1s. Output trimmed via the same MediaRecorder pipeline reading from a `<video>` playing the trimmed segment into a canvas.
- Live preview during recording shows red dot + elapsed time top-center.

### 4. Capture mode — text-only

- Gradient background picker (8 presets: lime, sunset, lavender, mono, etc.)
- Centered text input with auto-resize
- Font + color picker (same picker reused from text overlay tool)
- Tap publish → rendered to canvas → exported as PNG

### 5. Editor canvas (Konva)

Multi-layer Konva.Stage with:

```
<Stage>
  <Layer id="image">     {/* Konva.Image with cached filters */}
  <Layer id="drawing">   {/* Konva.Line[] freehand strokes */}
  <Layer id="stickers">  {/* Konva.Image[] sticker instances */}
  <Layer id="text">      {/* Konva.Text[] text overlays */}
  <Layer id="ui">        {/* Konva.Transformer (selection handles) */}
</Stage>
```

Each non-image layer item is selectable → renders a Konva.Transformer with rotate + 8-handle resize + delete-on-trash-tap.

### 6. Edit tools (bottom toolbar)

| Tool | Behavior |
|---|---|
| **Aa Text** | Tap → new text overlay added center-stage in edit mode. Text input bar appears above keyboard. Font dropdown (8 fonts: Onest, JetBrains Mono, serif, etc.) + color picker + size slider. |
| **🎨 Draw** | Tap → entered freehand mode. Color picker + brush size slider + eraser toggle. Tap outside canvas to exit. |
| **😊 Stickers** | Tap → bottom-sheet picker. v0.1 ships ~30 emoji-stickers as built-in + accepts `stickers: StickerSet[]` prop for consumer-supplied PNGs. Tap sticker → added center-stage. |
| **🌈 Filters** | Tap → horizontal scrollable strip of ~10 presets (Original, Clarendon, Gingham, Moon, Lark, Reyes, Juno, Slumber, Crema, Ludwig). Each is a named `Konva.Filters` combo. Tap → applies + closes strip. |
| **⚙️ Adjust** | Tap → 4 sliders (Brightness / Contrast / Saturation / Blur). Live-applied to the image layer via `node.cache()` + `node.filters([...])`. |
| **✂️ Crop** | Optional toggle. Aspect-ratio buttons. v0.1 ratio set is locked at Q-P4 sign-off (recommended: 9:16 + 1:1 + 4:5). |

### 7. Publish flow

- **Publish button** — top-right, primary CTA. Disabled during compositing.
- **Compositing step** — runs `stage.toDataURL({ pixelRatio: 2, mimeType: "image/jpeg", quality: 0.9 })` for photo. For video: `canvas.captureStream(30)` + `MediaRecorder` with layered re-render via `requestAnimationFrame`.
- **Upload step** (if `uploadUrl` set) — XHR POST FormData with `onUploadProgress` → linear progress bar overlay.
- **Custom uploader** (if `uploader` prop set) — composer hands `(blob, metadata)` to consumer's async function; consumer returns `{ url, ...rest }`. Use this for S3 pre-signed URLs, Cloudinary, Mux direct upload.
- **Success state** — checkmark animation + auto-close + `onPublished(story)` fires with the constructed `PublishedStory` (shape-compatible with `story-viewer-01`'s `Story` — no cross-import).
- **Failure state** — error toast + retry button. Composer does NOT auto-reset on failure (user keeps their edits).

### 8. Public API sketch

```ts
export interface StoryComposer01Props {
  // === Display ===
  isOpen: boolean;
  onClose: () => void;

  // === Publish destination ===
  /** If set, composer POSTs FormData to this URL on publish. Mutually exclusive with `uploader`. */
  uploadUrl?: string;
  /** Custom uploader (signed-URL flows). Receives composited blob + metadata, must return { url }. */
  uploader?: (blob: Blob, metadata: PublishMetadata) => Promise<PublishResult>;
  /** Extra fields appended to FormData (auth headers go via uploader). */
  uploadFields?: Record<string, string>;
  /** Fires after successful upload with the constructed PublishedStory (shape-compatible with story-viewer-01's Story — no type cross-import). */
  onPublished: (story: PublishedStory) => void;
  /** Fires on upload failure. If undefined, composer shows internal error toast. */
  onPublishError?: (error: Error) => void;

  // === Capture ===
  /** "photo" | "video" | "text". Default "photo". */
  defaultMode?: ComposerMode;
  /** Modes to hide from the toggle pill. Default `[]` (all 3 modes visible). Pass e.g. `["video"]` to ship photo + text only. */
  hideModes?: ComposerMode[];
  /** Camera facingMode default. Auto-detected from UA if not set. */
  defaultFacing?: "user" | "environment";
  /** Max video duration in seconds. Default 30. */
  maxVideoDuration?: number;
  /** Capture audio during video recording. Default true. */
  recordAudio?: boolean;
  /** Max file size in MB for gallery picks. Default 50. Composer rejects with `onValidationError`. */
  maxFileSizeMb?: number;
  /** Fires on validation failure (file too big, wrong type, unsupported codec, etc.). */
  onValidationError?: (error: ValidationError) => void;

  // === Edit tools ===
  /** Consumer-supplied sticker set. Merged with built-in emoji-stickers unless `replaceBuiltinStickers: true`. */
  stickers?: StickerSet[];
  replaceBuiltinStickers?: boolean;
  /** Font family list for text tool. Defaults to project tokens (Onest, JetBrains Mono) + 6 web-safe. */
  fonts?: FontOption[];
  /** Color palette for text + drawing color pickers. Defaults to 12 brand-friendly presets. */
  colorPresets?: string[];
  /** Filter presets. Merged with built-in 10 unless `replaceBuiltinFilters: true`. */
  filterPresets?: FilterPreset[];
  replaceBuiltinFilters?: boolean;
  /** Enable/disable tools. Default all enabled. */
  enabledTools?: EditTool[]; // "text" | "draw" | "stickers" | "filters" | "adjust" | "crop"

  // === Layout ===
  /** Aspect ratios offered by crop tool. Default locked at Q-P4 sign-off (rec: ["9:16","1:1","4:5"]). */
  cropAspects?: AspectRatio[];
  /** Mobile-fullscreen | desktop-modal — auto by default. */
  presentation?: "auto" | "fullscreen" | "modal";

  // === Localization ===
  labels?: Partial<StoryComposer01Labels>;

  // === Permissions ===
  /** Fires when camera permission is denied. Consumer can show their own help UI. */
  onPermissionDenied?: () => void;

  // === Slots (escape hatches) ===
  renderTopBar?: (ctx: ComposerCtx) => ReactNode;
  renderBottomToolbar?: (ctx: ComposerCtx) => ReactNode;
  renderPermissionDenied?: (ctx: { retry: () => void; usePicker: () => void }) => ReactNode;
  renderEmpty?: () => ReactNode;
  renderPublishingOverlay?: (ctx: { progress: number; mode: ComposerMode }) => ReactNode;
}

export interface PublishMetadata {
  mode: ComposerMode;          // "photo" | "video" | "text"
  width: number;
  height: number;
  durationMs?: number;         // video only
  mimeType: string;
  textOverlays: TextOverlay[]; // for analytics / re-edit
  stickers: PlacedSticker[];
  drawingStrokes: number;
  appliedFilter?: string;      // preset name
  adjustments: ImageAdjustments;
}

export interface PublishResult {
  url: string;                 // the uploaded media URL
  thumbnailUrl?: string;       // optional poster for video
  [key: string]: unknown;
}
```

### 9. Imperative handle

```ts
export interface StoryComposer01Handle {
  // Lifecycle
  open: () => void;
  close: () => void;
  reset: () => void;            // clear current draft, return to capture surface
  // Capture
  switchCamera: () => Promise<void>;
  takePhoto: () => Promise<void>;
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<void>;
  importFromGallery: () => void; // opens the <input type="file"> dialog
  // Edit
  addText: (text?: string) => void;
  addSticker: (sticker: StickerOption) => void;
  setAdjustments: (adj: Partial<ImageAdjustments>) => void;
  applyFilter: (name: string | null) => void;
  // Publish
  publish: () => Promise<void>;
  exportBlob: () => Promise<{ blob: Blob; metadata: PublishMetadata }>;
}
```

### 10. Exported hooks (advanced consumers)

- `useStoryComposerState()` — internal state machine if consumer wants to render a fully custom shell.
- `useMediaCapture(opts)` — `getUserMedia` + `MediaRecorder` lifecycle (acquire / release / capture / record / stop). Returns `{ videoRef, stream, takePhoto, startRecording, stopRecording, switchCamera, error }`.
- `useImageUploader(opts)` — XHR upload with progress. Returns `{ upload, progress, status, error, cancel }`.

### 11. Slot extension points

Beyond the `render*` props in §8, sealed-folder parts exported for consumers who want to compose their own shell:

- `<ComposerCamera>` — capture surface (camera + gallery + mode toggle)
- `<ComposerEditor>` — Konva canvas + transformer
- `<ComposerToolbar>` — bottom edit tools
- `<ComposerPublishBar>` — top bar with close + publish CTA
- `<ColorSwatchPicker>` — popover color picker (reusable in text + drawing)

### 12. Responsive behavior

- **Mobile** (`< md`): full-screen, edge-to-edge, safe-area padding (top notch + bottom home-bar). Edit toolbar floats above bottom safe-area.
- **Desktop** (`>= md`): centered modal, **400×711px** (true 9:16 portrait at `md:w-100 md:h-[44.4375rem]`). **Note — minor deviation from story-viewer-01's `md:w-100 md:h-175` (400×700 ≈ 8:14)**: composer locks to true 9:16 because exports must match the user's downstream platform (Instagram, TikTok). Viewer uses 400×700 because it consumes already-cropped media at any aspect. Backdrop `bg-black/95`. Backdrop click closes only if no unsaved edits (else triggers confirm modal — see Q-P10).
- **Landscape mobile**: composer locks to portrait orientation via CSS (no `screen.orientation.lock` API — just `aspect-[9/16]` constraint + black letterbox).

### 13. Accessibility

- Camera permission denied: live region announces, retry button focuses on prompt close.
- All edit tools have `aria-label` + visible label on focus-visible.
- Text-tool input is a proper `<textarea>` with `aria-label`.
- Color picker is keyboard-navigable (Tab + Arrow keys through swatches).
- Publish button has loading state announced (`aria-busy`).
- Konva canvas itself is NOT screen-reader accessible (no accessibility tree in canvas) — composer surfaces an "edit summary" live region announcing "Added text 'Hello'", "Applied filter Clarendon", "Recording started", etc.

### 14. SSR + Konva caveat

`konva` references `window` at module top-level, so `react-konva` cannot be SSR'd. In Next.js 16 + React 19, the procomp file must be `"use client"` (already required by the registry convention — all procomps are client) AND the Konva-touching parts (`ComposerEditor`, the canvas-shell) use `dynamic(import(...), { ssr: false })` so they don't crash during the RSC pass when the host page is server-rendered. The non-Konva parts (capture, toolbar, publish bar) can stay statically imported and skip the SSR-skip wrapper. GATE 2 plan locks the exact boundary.

### 15. Sticker asset shipping

Built-in stickers (~30 emoji-style PNGs at 256×256) ship as static assets. Two viable patterns:
- **(a) Inline base64 in `dummy-data.ts` / `assets.ts`** — registry-friendly (`registry:component` files only), but bloats the JS bundle (~80–150KB depending on PNG compression).
- **(b) Separate PNG files shipped via registry, served from `/public/r/story-composer-01/stickers/`** — needs shadcn registry `type: "registry:file"` entries with `target: "public/r/story-composer-01/stickers/<name>.png"`. Adds binary handling to the registry pipeline.

Lock at sign-off — see Q-P9.

### 16. Key type sketches (to be locked in GATE 2 + types.ts)

```ts
export type ComposerMode = "photo" | "video" | "text";

export interface StickerOption {
  id: string;
  src: string;          // URL or data: URI; consumer-supplied or built-in inline base64
  alt: string;          // accessible label
  width?: number;       // default natural
  height?: number;
}

export interface StickerSet {
  id: string;           // e.g. "emoji" | "brand-stickers"
  label: string;        // visible category name in picker
  stickers: StickerOption[];
}

export interface FilterPreset {
  id: string;           // "clarendon" | "gingham" | ...
  label: string;
  /** Konva filter chain + per-filter param overrides. */
  konvaFilters: KonvaFilterSpec[];
}

export interface ImageAdjustments {
  brightness: number;   // -1 .. 1, default 0
  contrast: number;     // -100 .. 100, default 0 (Konva.Filters.Contrast scale)
  saturation: number;   // -2 .. 10, default 0 (Konva.Filters.HSL.saturation)
  blur: number;         // 0 .. 40, default 0 (Konva.Filters.Blur.blurRadius)
}

export interface TextOverlay {
  id: string;
  text: string;
  x: number; y: number; rotation: number; scale: number;
  fontFamily: string;
  fontSize: number;
  fill: string;
  align: "left" | "center" | "right";
}

export interface PlacedSticker {
  id: string;
  stickerId: string;    // refs StickerOption.id
  x: number; y: number; rotation: number; scale: number;
}

export interface PublishedStory {
  id: string;
  /** ISO date string — matches pro-ui convention from story-viewer-01. */
  createdAt: string;
  items: Array<{
    id: string;
    type: "image" | "video";
    src: string;          // uploaded media URL
    duration?: number;    // seconds; image default 5, video = actual duration
    thumbnailUrl?: string;
  }>;
}

export interface ValidationError {
  kind: "file-too-large" | "unsupported-type" | "unsupported-codec" | "duration-exceeded";
  message: string;
  file?: File;
}
```

## Out of scope for v0.1

- **AR face filters / face tracking** (would need MediaPipe / TensorFlow.js — separate procomp `story-composer-ar-01` if ever)
- **Music overlay** (would need audio mixing + track licensing UI; deferred)
- **Polls / quizzes / question stickers** (these are interactive sticker types — deferred to v0.2)
- **GIF support** (animated GIFs as stickers are tricky in canvas; deferred)
- **Boomerang / slow-mo / hyperlapse** (video effects — deferred)
- **Multi-segment stories** (chaining multiple captures into one Story before publish — see Q-P5)
- **Draft persistence** (saving in-progress edits to IndexedDB and restoring on next open — deferred to v0.2)
- **Crop with non-9:16 aspects** unless Q-P4 says otherwise

## Q-Ps for sign-off (lock before GATE 2)

These are intentional open calls — answer at sign-off so GATE 2 can lock the API.

| Q-P | Question | Options |
|---|---|---|
| **Q-P1** | Video compositing — bake text + stickers + drawing INTO the video frames, or skip overlay-on-video for v0.1 (overlays only on photos)? | (a) Bake-in via `canvas.captureStream` + `MediaRecorder` re-encode (heavier, ~2× export time, but Instagram-parity). (b) Skip overlays on video (video publishes as-recorded; only photo + text mode support edit tools). **(Recommended: a)** |
| **Q-P2** | Drawing tool — vector polylines (Konva.Line) or raster (offscreen canvas)? Plus: eraser toggle in v0.1 or v0.2? | (a) Vector + eraser. (b) Vector, no eraser (use undo). (c) Raster, no eraser. **(Recommended: a — vector for editability, eraser is one Konva.GlobalCompositeOperation flip)** |
| **Q-P3** | Stickers — consumer-only set, built-in only, or both (with `replaceBuiltinStickers` flag)? | (a) Both — composer ships ~30 emoji-stickers, consumer can extend or replace. (b) Consumer-only (no built-ins). (c) Built-in only (no extension). **(Recommended: a — open dynamism per project preference)** |
| **Q-P4** | Crop aspect ratios in v0.1 — 9:16 only, or also 1:1 + 4:5 + free? | (a) 9:16 only (Instagram-story canonical). (b) 9:16 + 1:1 + 4:5 (story + post + portrait-post). (c) All four + free. **(Recommended: b — 9:16 default, 1:1 + 4:5 toggleable; matches multi-format social pipelines)** |
| **Q-P5** | Multi-segment stories — can users chain 2+ captures into one Story before publish, or one-capture-per-publish in v0.1? | (a) One-capture-per-publish (matches Instagram's individual-story-item model; multi-segment is the user's next "create story" tap). (b) Multi-segment — composer holds an array of items, "Add to story" button after each capture, publish bundles all. **(Recommended: a — simpler, matches consumer mental model; multi-segment is a v0.2 addition driven by demand)** |
| **Q-P6** | Default `uploadUrl` request shape — POST FormData with the blob as field `file`, or PUT raw blob? | (a) POST FormData (`file` + `uploadFields`) — standard multipart; works with Express/Fastify/multer/multipart-parsers. (b) PUT raw blob — works with S3 pre-signed PUT URLs but requires `uploader` escape hatch for FormData backends anyway. **(Recommended: a — POST FormData is the broader default; S3 PUT goes via `uploader`)** |
| **Q-P7** | Live filter preview strip — pre-render each filter as a thumbnail (1 second extra processing, but instant browse) or apply on-tap-only (instant browse, full-res application, but no preview thumb)? | (a) Pre-render thumbnails (better UX, +1s on edit-mode entry). (b) Apply on tap (no preview thumb, instant entry). **(Recommended: a — Instagram parity, perceived quality)** |
| **Q-P8** | Camera permission UI — if denied, do we offer auto-retry on settings change (`navigator.permissions.query` watching), or static "denied, please enable in browser settings" message? | (a) Auto-retry via `permissions.query` + change event listener (smoother UX). (b) Static message with link to browser-settings help. **(Recommended: a — the API is standardized, the wiring is ~15 LOC)** |
| **Q-P9** | Built-in sticker assets — inline base64 in TS (registry-friendly, ~80–150KB JS bloat) or separate PNG files via `registry:file` (binary asset pipeline, clean bundle)? | (a) Inline base64. (b) Separate PNGs via `registry:file` + public-hosted. (c) NO built-in stickers in v0.1 — consumer-supplied only. **(Recommended: a for v0.1 — simpler, ships everything via one item; revisit if bundle bloat becomes real)** |
| **Q-P10** | Unsaved-edits guard — backdrop click + Escape + close button on a dirty editor: silent discard, confirm modal, or auto-save draft? | (a) Confirm modal ("Discard story?" with cancel/discard). (b) Silent discard (matches Instagram, which silently discards). (c) Auto-save to consumer-supplied `draftStore` (deferred — adds prop surface). **(Recommended: a — safer default; consumer can opt-out via `confirmOnDiscard: false`)** |

## Dependencies (peer)

| Package | Version | Why |
|---|---|---|
| `konva` | `^9.3` | Canvas engine — built-in filters, layers, transformer. |
| `react-konva` | `^19.0` | Official React bindings, React-19-compatible (version-major-locked to React major). |

Color picker is in-house (no peer dep) — confirmed in §"Substrate decisions". GATE 2 will lock exact `konva` + `react-konva` versions via `pnpm view`.

No other new peer deps. Camera + video + upload all use web platform APIs.

## Workflow / verification gates this procomp must pass

- GATE 1 (this document) — user sign-off ✋ pending
- GATE 2 — implementation plan
- GATE 3 — readiness review (peer/AI-assisted given scope; spotcheck template with rotating dim = **performance** given Konva + canvas + MediaRecorder + XHR-upload all in one procomp)

## Migration origin

None. Greenfield.

## Estimated scope

- **~32–38 files** (rivals story-viewer-01's 28 — composer adds capture / video / upload concerns)
- **~70–80 public props** (rivals story-viewer-01's 64)
- **~7–10 days** end-to-end (revised from initial 5-day estimate — Konva substrate + video compositing + browser-test matrix all add real time vs. a pure-DOM procomp)
- **2 new peer deps** (`konva`, `react-konva`) — color picker is in-house, no third dep
- **Largest test surface yet** — camera, video record, upload, canvas compositing, sticker placement, drawing all need manual browser-test per the `feedback_browser_test_documented_headless_patterns.md` memory. Browser-test matrix: Chrome desktop + Safari iOS + Chrome Android (camera + MediaRecorder behave differently across all three)
