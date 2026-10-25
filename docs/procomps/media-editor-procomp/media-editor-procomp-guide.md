# media-editor — consumer guide

> Alpha. The reusable capture + edit surface lifted out of
> [`story-composer`](../story-composer-procomp/) v0.1.5. Four
> controllable capability dials let you pull as little or as much editor
> surface as your context needs. `story-composer` v0.2.x is a thin
> wrapper around this; `content-composer`, `chat-panel`, and CMS hero
> editors are downstream consumers.
>
> **v0.5.1 (2026-10-26)** — closing the dialog returns focus to the element that opened it; new text overlays and
> stickers start centred on the visible part of the image.
>
> **v0.5.0 (2026-10-25, breaking)** — every string is a typed label (`MediaEditorLabels`, all keys optional) plus
> `labels.presets` and `locale`; `acceptMediaTypes` and `videoOutput` (e.g. MP4 only); media chrome uses the
> `--media-overlay` tokens; the body is `inert` under `overlay`; the exported `useHistory` no longer swallows
> Ctrl/Cmd+Z on an empty stack. Upgrading from a pre-0.3 install: **delete the six old capture files first** (see
> [Removed in v0.3.0](#removed-in-v030-p3-capture-split--delete-these-by-hand)). Full list:
> [Migration 0.4 → 0.5](#migration-04--05).
>
> v0.1.1 (2026-06-03) landed a post-walkthrough UX sweep: single-pointer
> drag-to-pan, an Instagram-style chrome model (capture-only mode tabs that
> swap to a back-to-capture arrow once a draft exists; bottom edit tools
> overlay a full-bleed canvas), container-query-sized capture controls, and a
> min/max size clamp so the surface can't collapse. See
> [Capture vs edit chrome](#capture-vs-edit-chrome) and [Pan & zoom](#pan--zoom).
>
> v0.1.2 (2026-06-03) wired the GATE 3 follow-ups: `onModeChange` +
> `onEditAction` now emit (navigation + lifecycle actions); the
> `renderPermissionDenied` slot is honored for the denied state; and the
> pan-zoom keyboard is **focus-scoped to the canvas** (no longer window-bound).
>
> v0.1.3 (2026-06-05) fixed a crop-layout bug: in crop mode the bottom control
> bar (Apply/Cancel + tool tabs) floated over the canvas and covered the crop
> frame's bottom drag-handles. The controls now drop **into flow** below the
> canvas while cropping (the canvas region shrinks to reserve the space), so
> every handle stays reachable; other tools keep the space-saving overlay.

## Install

```bash
pnpm dlx shadcn@latest add @ilinxa/media-editor
```

Adds the base editor (file/gallery intake, edit canvas, all six tools, export): peer deps `konva ^10.3.0` + `react-konva ^19.2.4` + `lucide-react`, shadcn primitives `dialog` / `alert-dialog` / `popover` / `button` / `slider`.

Camera capture is a separate opt-in item, `@ilinxa/media-editor-capture` — see [Feature slices](#feature-slices-p3-2026-08-11) below.

Optional fixtures item (`@ilinxa/media-editor-fixtures`) ships sample initial sources + a brand-pack sticker set for demos.

## Quick start — three shapes

### 1. Inline hero re-edit (CMS / content-composer step 2)

```tsx
import { useRef } from "react";
import {
  MediaEditor,
  type MediaEditorHandle,
} from "@/components/media-editor";

export function HeroEditor({ heroUrl }: { heroUrl: string }) {
  const editorRef = useRef<MediaEditorHandle>(null);

  return (
    <MediaEditor
      ref={editorRef}
      aspect="16:9"
      presentation="inline"
      enabledModes={[]}                          // pure-edit; no capture
      enabledTools={["text", "filters", "adjust", "crop"]}
      initialSource={{ kind: "url", url: heroUrl, mode: "photo" }}
    />
  );
}
```

### 2. Dialog photo/video editor (chat attachment / DM)

```tsx
import { useRef, useState } from "react";
import {
  MediaEditor,
  type MediaEditorHandle,
} from "@/components/media-editor";

export function AttachmentEditor() {
  const editorRef = useRef<MediaEditorHandle>(null);
  const [open, setOpen] = useState(false);

  return (
    <>
      <button onClick={() => setOpen(true)}>Add media</button>
      <MediaEditor
        ref={editorRef}
        aspect="9:16"
        presentation="dialog"
        isOpen={open}
        onClose={() => setOpen(false)}
        enabledModes={["photo", "video"]}        // no text-mode in chat
      />
    </>
  );
}
```

### 3. Defaults (everything on)

```tsx
<MediaEditor ref={editorRef} presentation="inline" />
```

Default capabilities: all three modes (photo / video / text), all six edit tools, both media sources (camera + upload), free aspect. The camera needs the `capture` extension (`@ilinxa/media-editor-capture`); without it the editor warns once in development and falls back to file upload. The `presentation` override keeps the auto-rule from picking `dialog` (which would need `isOpen` wiring).

## Capability dials

Four orthogonal props. Pass arrays narrower than the default to gate the surface.

### `enabledModes`

| Value | Effect |
|---|---|
| `["photo", "video", "text"]` (default) | Mode tabs shown in the capture stage; all modes selectable |
| Two values, e.g. `["photo", "video"]` | Mode tabs shown in the capture stage; only listed modes selectable |
| One value, e.g. `["photo"]` | Mode tabs **hidden** (no ambiguity to resolve) |
| `[]` | Capture surface gone. Pair with `initialSource`, or the empty-state footgun guard fires |

> The mode tabs only render in the **capture** stage. Once a draft exists (edit
> stage) they're replaced by a back-to-capture arrow — see
> [Capture vs edit chrome](#capture-vs-edit-chrome).

### `enabledTools`

| Value | Default? | When to drop |
|---|---|---|
| `text` | ✅ | When typography would clash with the composer's own text controls |
| `draw` | ✅ | When freehand strokes don't fit (formal editorial, b2b CMS) |
| `stickers` | ✅ | Same — editorial / formal contexts |
| `filters` | ✅ | When the consumer applies its own color grading downstream |
| `adjust` | ✅ | When brightness/contrast/saturation are managed elsewhere |
| `crop` | ✅ | When aspect is already locked (e.g. `aspect="9:16"` stories) |

Disabling a tool removes its chip from the toolbar (and from the slot context's `enabledTools`). It does not gate anything else: the handle methods (`addText()`, `addSticker()`, `setAdjustments()`, `applyFilter()`) still work and `exportImage()` still bakes every layer the draft holds. To keep a tool's output out of an export, don't call its handle method.

### `mediaSources`

| Value | Effect |
|---|---|
| `["camera", "upload"]` (default) | Camera viewfinder + upload fallback |
| `["camera"]` | Camera only — no upload affordance |
| `["upload"]` | Drag-and-drop dropzone + Browse button. **No camera permission flow.** Good for CMS / kiosk contexts. |
| `[]` | Pure-edit. Pair with `initialSource`, or empty-state fires |

### `aspect`

| Value | Use case |
|---|---|
| `"9:16"` | Vertical: stories, DM, reels |
| `"1:1"` | Square: feed posts, profile uploads |
| `"16:9"` | Landscape: CMS hero, video thumbnails |
| `"4:5"` | Portrait: Instagram feed-portrait |
| `"free"` (default) | No aspect lock; consumer-driven sizing |

The aspect drives canvas dimensions, the default crop choice, and (in dialog mode) the modal size. Pass `cropAspects` to override the crop-tool aspect choices.

## Initial source (CMS re-edit / draft restore)

```ts
type InitialSource =
  | { kind: "url";  url: string; mode: "photo" | "video" }
  | { kind: "blob"; blob: Blob;  mode: "photo" | "video" }
  | { kind: "file"; file: File }; // mode auto-detected from File.type
```

When `initialSource` is set, the editor skips the capture surface and lands directly in the edit canvas. Validation rules:

- **URL path** — editor `fetch()`es the URL. Same-origin or CORS-friendly only.
- **`kind: "file"`** — mode derived from `File.type`. `image/*` → photo. `video/*` → video. Anything else → `unsupported-file-type` error.
- Resolved mode must be a member of `enabledModes`. Mismatch → `mode-not-enabled` error.
- Empty blob → `invalid-blob` error.

Errors surface via `onInitialSourceError`. Five kinds:

| Kind | Payload | Recovery |
|---|---|---|
| `"cors"` | `{ url, underlying }` | Pre-fetch server-side; pass via `{ kind: "blob" }` |
| `"fetch-failed"` | `{ url, underlying }` | Network error / non-OK status; retry or use blob |
| `"mode-not-enabled"` | `{ attempted, enabled }` | Source mode missing from `enabledModes`; widen the dial |
| `"unsupported-file-type"` | `{ fileType, file }` | Validate file type at picker time (`accept` attr) |
| `"invalid-blob"` | `{ reason }` | Blob has size 0; check upstream pipeline |

While in the error state the canvas renders the default "Couldn't load source" surface (or `renderEmpty()` if provided).

## Presentation: `inline` / `dialog` / `auto`

| Value | Surface | Used by |
|---|---|---|
| `"inline"` | Bare in parent layout. No portal, no focus trap. | content-composer step 2, CMS hero editor |
| `"dialog"` | Wrapped in shadcn dialog. Mobile-fullscreen / desktop-modal sized by `aspect`. | story-composer, chat-panel |
| `"auto"` (default) | One rule: if `enabledModes` is empty → `inline`, else `dialog`. | — |

**Dialog mode requires `isOpen` + `onClose`.** A dev-only `console.error` fires once per instance when either is missing — runtime falls back to keeping the dialog closed until you wire both.

**Focus on close.** However the dialog closes (Escape, Cancel / Discard, or you setting `isOpen` to false, e.g. after a publish), focus goes back to the element that had it when the dialog opened — normally your opener button. If you want focus somewhere else, move it after the dialog has closed (an effect on your open state, or later); a `focus()` call inside `onClose` runs while the dialog's focus trap is still active and is undone.

Desktop dialog sizing is viewport-relative and aspect-locked, with a min/max **clamp** so it can't collapse on a short window or overflow a tall one. Only the *driver* dimension is sized; the other follows from the aspect ratio:

| Aspect family | Driver | Clamp |
|---|---|---|
| Portrait (`9:16`, `4:5`, `1:1`) | height | `clamp(24rem, 85dvh, 44rem)` |
| Landscape (`16:9`, `free`) | width | `clamp(28rem, 85vw, 60rem)` |

**`overlay`** — `overlay?: ReactNode` is rendered as the last child of the editor surface, above the editor content. In dialog presentation it is inside the dialog content, so buttons in it stay clickable despite the modal (a sibling rendered next to `<MediaEditor>` would sit outside the dialog and be blocked). Position it with `absolute inset-0` (the surface is `relative`) and give it `z-40` or higher — the mode pill and Back button sit at `z-30`, the edit toolbars at `z-20` — plus `rounded-[inherit]` so it follows the inline surface's corners. `story-composer` uses it for its publishing overlay (requires media-editor >= 0.4.0).

Mobile breakpoint is always fullscreen (`h-[100dvh] w-screen`). The canvas fills the dialog edge-to-edge and the bottom edit tools **overlay** it (see [Capture vs edit chrome](#capture-vs-edit-chrome)). Use `presentation="inline"` if you need custom sizing — inline is width-driven with `min-h` / `max-h` bounds, so it stays responsive between a small chat embed and a full surface.

## Capture vs edit chrome

The editor follows an Instagram-style chrome model that changes between the two
stages. You don't configure this — it's automatic — but consumers wiring their
own top bar (via `renderTopBar`) need to know the contract:

| | **Capture stage** (no draft yet) | **Edit stage** (draft captured/loaded) |
|---|---|---|
| Mode tabs (Photo/Video/Text) | Shown, top-center (if ≥2 modes) | **Hidden** |
| Top-left | consumer's close, if any | **Back-to-capture arrow** (icon-only) — when a capture mode exists |
| Canvas | camera/text surface, full-bleed | media, full-bleed |
| Bottom controls | camera shutter / gallery / switch (overlay) | edit-tool row + active tool panel (**overlay**, IG scrim) |

- **Mode tabs are capture-only.** Switching modes mid-edit is meaningless, so once a draft exists they're replaced by a back-to-capture arrow that clears the draft and reopens capture in the same mode.
- **Bottom tools overlay the canvas** (they don't sit in flow below it), so the media fills the whole frame and nothing crops on a 9:16 surface.
- The **back arrow is rendered by this component** in the edit stage (top-left) when `enabledModes` includes a capture mode. If you supply `renderTopBar`, hide your own close in the edit stage so it doesn't collide — `story-composer`'s `ComposerPublishBar` does this via a `showClose` prop driven off the slot-context (`!ctx.isCapturing && hasCaptureMode → hide`). Edit-only configs (no capture mode) keep their close, since there's no Back to fall back to.
- Capture controls (shutter / gallery / switch) are **container-query sized** — they scale with the camera width, not the viewport, so they stay proportional in a dialog or a small chat embed.

## Pan & zoom

The edit canvas pans and zooms (1×–4×), disabled while drawing or cropping:

| Gesture | Action |
|---|---|
| **Drag** (single pointer — mouse or 1 finger) | **Pan.** Yields to draggable text/sticker overlays: a drag that starts on an overlay moves that overlay instead. A tap (< ~4px) never pans, so selection/placement still works. |
| 2-finger pinch (touch) | Zoom anchored to the pinch midpoint |
| Wheel / trackpad-pinch over the canvas | Zoom anchored to the cursor (native non-passive — beats browser page-zoom) |
| Arrow keys | Pan in the image's direction (ArrowRight → image shifts right) |
| `+` / `=` , `-` / `_` , `0` | Zoom in / out / reset |

The keyboard gestures are **focus-scoped** (v0.1.2): the canvas is focusable (`tabIndex`), and the keys only act while it holds focus — they never hijack arrow keys/zoom elsewhere on the page. Click or tab to the canvas to drive it from the keyboard; a focus ring marks it.

A "reset zoom" chip appears (with the current %) whenever the transform isn't at the identity. The transform is applied to the Konva stage, so overlays and strokes stay pinned to the image at any zoom/pan.

## Export

Imperative — call from your publish flow.

```tsx
// Photo / text — image output. Default mime image/jpeg, quality 0.9.
const { blob, metadata } = await editorRef.current.exportImage({
  format: "image/jpeg",            // "image/png" | "image/webp"
  quality: 0.9,
  pixelRatio: 2,                   // retina sharpness; default 2
  onProgress: (p) => setProgress(p), // fires (0) at start, (1) on done
});

// Video — returns the original blob when nothing has been overlaid AND no
// crop (always the case from the UI: no tool edits video yet). Otherwise
// re-encodes through MediaRecorder with the Konva overlay baked per frame.
const out = await editorRef.current.exportVideo({
  // optional. Default: the first type allowed by `videoOutput.mimeTypes`, else
  // the built-in chain (WebM VP9 → VP8 → MP4). An explicit value wins.
  mimeType: "video/mp4",
  bitsPerSecond: 2_000_000,        // optional
  onProgress: (p) => setProgress(p), // ~10 ticks during re-encode, or 2 if shortcut
});

// Polymorphic — dispatches by current mode.
const out = await editorRef.current.export();
```

`metadata: ExportMetadata` includes `width`, `height`, `mimeType`, `durationMs?` (video), `textOverlays`, `stickers`, `drawingStrokes` (count), `appliedFilter`, `adjustments`, `crop?`. For a passed-through video, `mimeType` is the file's own type (else the first allowed output type).

## Formats: what goes in, what comes out

| Prop | Default | Effect |
|---|---|---|
| `acceptMediaTypes` | `["image/*","video/*"]` | Both file pickers (base and capture) offer only these, and the validator rejects anything else with `onValidationError({ kind: "unsupported-type" })`. MIME types with wildcards (`video/*`), not file extensions. `initialSource` is not checked against it. The editor still handles only images and videos. |
| `videoOutput` | built-in chain | `{ mimeTypes: ["video/mp4"] }` is an allow-list, in preference order, for re-encoding and camera recording. Exact MIME types, no wildcards. When recording is reachable (`"camera"` in `mediaSources` **and** a `capture` extension wired) but the browser can record none of them (Firefox has no MP4 recorder), the **video mode is hidden** and `onValidationError({ kind: "unsupported-codec" })` fires once (only when video was in `enabledModes`). Upload-only configs keep the video mode — a video file needs no recorder. A re-encode with no allowed recorder rejects instead of producing WebM. |

Video drafts show no tool chips: none of the six tools edits video yet, so a picked or recorded video exports as the
original file; its metadata carries the real width / height / duration (read from the file), falling back to
720×1280 with no duration only when they can't be read. `VideoTrimBar` is exported for hand-built UIs but the editor
does not mount it — so `labels.trim.*` has no effect on `<MediaEditor>` (it dev-warns); pass trim labels to your own
`VideoTrimBar` through its `labels` prop.

## Labels and locale

`labels` takes the nested `MediaEditorLabels` tree; every group and key is optional and anything you leave out keeps
its English default (`DEFAULT_LABELS`, which is exactly what renders). Groups: `shell`, `capture` (with `cameraIdle`,
`cameraDenied`, `modes`, `shutter`, `errors`), `toolbar`, `adjust`, `draw`, `text`, `color`, `crop`, `canvas`,
`trim`, `discard`, `intake`, `empty`, `presets`. Templated strings are functions, e.g.
`crop.aspectCount(count, formatted)`, `trim.seconds(seconds, formatted)`, `intake.fileTooLarge(sizeMb, maxMb,
sizeFormatted, maxFormatted)`, `canvas.resizeHandle(corner)`, `color.swatch(color)`.

```tsx
<MediaEditor
  locale="tr"
  labels={{
    capture: { modes: { photo: "Fotoğraf", video: "Video", text: "Metin" } },
    toolbar: { text: "Metin", draw: "Çiz" },
    trim: { seconds: (_s, formatted) => `${formatted} sn` },
    presets: { filters: { clarendon: "Parlak" }, fonts: { onest: "Varsayılan" } },
  }}
/>
```

- `labels.presets` maps preset ids to display names for the built-in backgrounds, fonts, sticker sets, stickers and
  filters; your own preset data (`fonts`, `stickers`, `filterPresets`) still works.
- `locale` (BCP 47, default `"en"`; an invalid tag falls back to `"en"`) formats trim seconds, the crop-aspect count,
  adjust values and file sizes.
- Flat keys (`modePhoto`, `toolText`, …) are still accepted at runtime and win over nested keys (deprecated).
  `editorLabelsFromFlat(flat)` converts a flat object to the nested shape.
- `MediaEditorResolvedLabels` is the fully populated flat set the editor hands its parts and a capture surface
  (`MediaCaptureSurfaceProps.labels`) — use it when you write your own capture implementation.

## Overlay

`overlay` renders in an `absolute inset-0` host, last in the editor surface (inside the dialog content in dialog
presentation). While it renders something (`null`, `undefined`, booleans and `""` count as no overlay):

- the rest of the editor is `inert`;
- focus moves to the overlay's first focusable element (or the overlay itself) and returns when it unmounts;
- Tab / Shift+Tab wrap inside the overlay;
- the dialog ignores its own close requests (Escape, backdrop) — the overlay owns the interaction; handle Escape in
  it if you want one.

Give it `z-40` or higher (editor chrome uses up to `z-30`).

## Imperative handle

23 methods grouped by role. Pass a `ref<MediaEditorHandle>` to access.

| Group | Methods |
|---|---|
| Inspect | `getIsDirty`, `getMode`, `getState`, `loadState`, `getSourceBlob` |
| Capture (not implemented) | `switchCamera`, `takePhoto`, `startRecording`, `stopRecording`, `importFromGallery` |
| Edit | `addText` (with a text argument; the no-argument form is not implemented), `addSticker`, `setAdjustments`, `applyFilter`, `clearLayer`, `undo` (not implemented), `redo` (not implemented) |
| Export | `exportImage`, `exportVideo`, `export` |
| Lifecycle | `reset`, `open` (not implemented), `close` |

`getState()` returns a serializable `MediaEditorState` snapshot for draft persistence; `loadState()` restores it.

> ⚠️ **Not implemented.** These handle members dev-warn and do nothing (each carries `@notImplemented` in `types.ts`):
> the imperative capture methods (`takePhoto` / `startRecording` / `stopRecording` / `switchCamera` / `importFromGallery`) —
> drive capture through the in-UI camera controls instead; `undo` / `redo` (no mutations are recorded as commands);
> `open` (dialog mode is controlled — set `isOpen` on the component); and `addText()` with no argument
> (`addText(text)` works). The rest of the handle (inspect / state / edit-overlay mutation / export / `reset` / `close`) is wired.

## Feature slices (P3, 2026-08-11)

Camera capture ships as a separate, opt-in registry item — `@ilinxa/media-editor-capture` — not bundled into the base install.

**Base vs feature.** `@ilinxa/media-editor` ships the file/gallery intake surface, the edit canvas + all six tools, and export — verified artifact **332.9 KB** at 0.5.0 (282.0 KB at the split). `@ilinxa/media-editor-capture` adds `getUserMedia`/`MediaRecorder` capture, the permission-state flow, the shutter control, and the multi-instance dev-warn guard — **8 files, 53.7 KB** at 0.5.0. At the split, the two together replaced the single 315 KB artifact. `validateGalleryFile` (generic file-type/size check) stayed in base — it's file-intake, not a camera concern — so base-alone file/gallery intake is fully usable without the feature. **No npm deps moved**: `konva` / `react-konva` stay in base (every consumer needs the canvas); the feature's only dep, `lucide-react`, was already a base dep too. What changed instead is a lazy boundary — the konva edit canvas now mounts via `React.lazy(() => import("./parts/lazy-editor-canvas"))` (`parts/lazy-editor-canvas.tsx` wraps `EditorCanvas`), so the konva chunk defers off the editor's initial paint (capture-stage-only or text-only-mode instances never pay for it up front).

**Injection wiring.** Base owns the extension type + context (`hooks/use-capture-extension.ts`) and the optional `capture?: MediaCaptureExtension` prop; it never statically imports the feature package — the camera-shaped types it needs (`CapturedPhotoLike`, `MediaCaptureSurfaceProps`, …) are structurally duplicated in base rather than imported, so the base folder carries zero static dependency on `features/capture/`.

```tsx
import { MediaEditor } from "@/components/media-editor"
import { mediaCapture } from "@/components/media-editor/features/capture"

<MediaEditor mediaSources={["camera", "upload"]} capture={mediaCapture} />
```

**Negative path.** `mediaSources` includes `"camera"` but no `capture` extension is wired (feature not installed, or intentionally omitted) → one dev-only `console.warn` (`media-editor: mediaSources includes "camera" but no capture extension is wired — install @ilinxa/media-editor-capture and pass capture={mediaCapture} …`) and the editor falls back to the base file/gallery intake surface — pick a file → edit → export still works end-to-end; only the camera viewfinder is unavailable.

**Upgrade recipe.** Same pattern as `event-calendar`'s editing slice (shared P3 mechanics — see the registry-mechanics evidence in `docs/plans/p3-feature-slicing-plan.md` §R1):
- **Pristine base already installed** → `pnpm dlx shadcn@latest add @ilinxa/media-editor-capture` lands cleanly: 8 feature files created, base files byte-identical and untouched.
- **Locally-modified base** → the capture item's `registryDependencies: ["@ilinxa/media-editor"]` re-resolves base files too, so the CLI prompts per differing base file. Answer `n` at each prompt — that file is skipped, the run continues, and the capture feature's own files still land.
- **Non-interactive upgrade onto a modified base** (`--yes` in CI, or any unattended run) is a **known phantom no-op**: the prompt hits EOF, the whole run aborts silently at exit 0, and nothing is written — including the feature's own non-colliding files. Shared with the existing base+`-fixtures` pattern, not new here. Install onto a pristine base or run interactively instead.

### Removed in v0.3.0 (P3 capture split) — delete these by hand

These moved to `@ilinxa/media-editor-capture` (`features/capture/…`). **`shadcn add` cannot delete
files an item stopped shipping**, so upgrading from a pre-P3 install leaves the old copies on disk:

```
parts/editor-camera.tsx                parts/camera-permission-prompt.tsx
parts/shutter-button.tsx               hooks/use-media-capture.ts
hooks/use-camera-permissions.ts        hooks/use-multi-instance-guard.ts
```

Found 2026-08-17 by `node scripts/find-orphans.mjs` in the smoke consumer. Until 0.5.0 they still compiled because
`types.ts` kept the `@internal` `StoryComposerLabels` shim they import. **0.5.0 deletes that shim (C17), so a tree
that still holds these files fails `tsc` with errors that point at media-editor's types** — delete the six files
(or run `find-orphans.mjs`) before or right after upgrading. Convention:
[`docs/feature-slicing-convention.md`](../../feature-slicing-convention.md).

**story-composer compat band.** story-composer's v0.1.5-era re-exports were removed in story-composer 0.6.0. Three
were renamed aliases — use the real names: `ComposerEditor` → `EditorCanvas`, `ComposerToolbar` → `EditorToolbar`
(both from `@/components/media-editor`), `ComposerCamera` → `EditorCamera` (from `…/features/capture`); the same for
their `…Props` types. The rest (`ColorSwatchPicker`, the lib / default-token / crop helpers, …) keep their names —
import them from `@/components/media-editor`. The historical contract snapshot
[`story-composer-v0.1.5-exports.snapshot.txt`](./story-composer-v0.1.5-exports.snapshot.txt) is kept as a record only.

## Migration 0.4 → 0.5

| Change | What to do |
|---|---|
| `StoryComposerLabels` (the `@internal` shim) is gone; parts and `MediaCaptureSurfaceProps.labels` take `MediaEditorResolvedLabels` | Custom capture surfaces: type `labels` as `MediaEditorResolvedLabels`. Delete the six pre-0.3 capture files if you still have them (above). |
| `labels.publish` removed (it never rendered anything) | Drop it; publish copy belongs to your publish UI (story-composer has its own labels). |
| `labels.empty.noSource` now renders (it was ignored) | Nothing, unless you passed it expecting no effect. |
| `labels` is `MediaEditorLabels` with every group / key optional | Nothing — partial nested objects now type-check without a cast. |
| `DEFAULT_LABELS` now equals what renders (e.g. discard title "Discard?", not "Discard changes?") | Only matters if you read `DEFAULT_LABELS` yourself. |
| Media chrome colours use `--media-overlay` / `--media-overlay-foreground` (`cssVars` on the item); recording dot / shutter use `--destructive`, the camera warning `--warning` | Nothing — defaults ship with the item. Set the variables to theme the chrome. Scrims are a single 0.55 overlay (some were lighter or heavier). |
| `useHistory` (exported) no longer `preventDefault`s Ctrl/Cmd+Z on an empty stack; Ctrl+Y is redo | Nothing, unless you relied on the shortcut being swallowed. |
| Video drafts show no tool chips | Nothing — the chips opened nothing on video. |
| `selectRecorderMime(allowed?)` takes an optional allow-list (then returns `string \| null`) | Nothing — with no argument it keeps the chain and its return type. |
| `locale` defaults to `"en"` | Pass your locale for number formatting. |

## Footguns

### `enabledModes: []` AND no `initialSource`

Editor has nothing to capture and nothing to edit. Runtime renders a "No source provided" empty state (or `renderEmpty()` if supplied) with `role="status"` for screen readers. Dev: `console.warn` fires once per instance pointing at the misconfig.

### 2+ capture-enabled instances on the same page

`getUserMedia` against the same camera with multiple live streams degrades quickly. Dev-only `console.warn` fires when the count crosses ≥2. Edit-only instances bypass the counter entirely. Suggested fixes: use `presentation="dialog"` for one-at-a-time UX, or drop secondary instances to edit-only mode.

### Dialog mode without `isOpen`/`onClose`

`console.error` once per instance. Dialog stays closed. Fix: wire both props from your parent's state.

## Style hooks

Data attributes on the editor root for CSS / DOM querying:

- `data-slot="media-editor"`
- `data-mode` — `photo` / `video` / `text` / `none`
- `data-stage` — `capture` / `edit` / `publishing`
- `data-presentation` — `inline` / `dialog`
- `data-aspect` — `9:16` / `1:1` / `16:9` / `4:5` / `free`

Inside, the canvas wrapper always carries `data-canvas-placeholder=""` (regardless of state) and `data-stage`. The empty-state branch additionally carries `data-empty-config=""`.

## More

- Full prop reference: see [types.ts](../../../src/registry/components/media/media-editor/types.ts).
- Architecture / Q-P locks / why the four dials look the way they do: see [`media-editor-procomp-description.md`](./media-editor-procomp-description.md).
- Commit chain + implementation notes: see [`media-editor-procomp-plan.md`](./media-editor-procomp-plan.md).
- Extraction lessons (Phase A): see the decision file at `.claude/decisions/2026-06-02-media-editor-extraction-c1-c8-phase-a-half.md`.

## Known gaps

The visual pipeline is wired — camera viewfinder + shutter, all six tool
panels (text / draw / stickers / filters / adjust / crop), drag-pan, and
export work end-to-end (the `story-composer` wrapper exercises them in
production). Undo/redo is not implemented — the toolbars have no working
history. The remaining gaps are narrow:

- **Imperative capture handle** — `takePhoto` / `startRecording` / `stopRecording` / `switchCamera` / `importFromGallery` dev-warn and no-op (not implemented). The in-UI camera controls are the supported capture path. (See [Imperative handle](#imperative-handle).)
- **Library media source** — `mediaSources` supports `camera` + `upload`; a device-library picker is not implemented.
- **Sliders and RTL** — the Adjust sliders fill from the left under an inherited `dir="rtl"`.
- **Video editing** — no tool applies to a video draft (the chips are hidden); videos export as the original file. `VideoTrimBar` is exported but not mounted.
- **Undo / redo** — not implemented (handle methods dev-warn; the editor binds no Ctrl/Cmd+Z). The exported `useHistory` hook works on its own and only claims the shortcut when its stack is non-empty.
- **`onEditAction` coverage** — emits the navigation + lifecycle actions (`mode-change`, `tool-open`, `tool-close`, `reset`). The fine-grained content-mutation actions (`text-*`, `sticker-*`, `draw-stroke`, `filter-apply`, `adjust-change`, `crop-set`, `undo`, `redo`) are not emitted (no per-mutation instrumentation) — the `EditAction` union is complete so you can switch exhaustively.

**Closed in v0.1.2:** `onModeChange` + `onEditAction` now emit; the
`renderPermissionDenied` slot is honored for the denied state; the pan-zoom
keyboard is focus-scoped to the canvas (was window-bound).

None block type-correct use of the public API.
