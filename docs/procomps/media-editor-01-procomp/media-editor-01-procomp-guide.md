# media-editor-01 — consumer guide

> v0.1.1 alpha. The reusable capture + edit surface lifted out of
> [`story-composer-01`](../story-composer-01-procomp/) v0.1.5. Four
> controllable capability dials let you pull as little or as much editor
> surface as your context needs. `story-composer-01` v0.2.x is a thin
> wrapper around this; `content-composer-01`, `chat-panel`, and CMS hero
> editors are downstream consumers.
>
> v0.1.1 (2026-06-03) landed a post-walkthrough UX sweep: single-pointer
> drag-to-pan, an Instagram-style chrome model (capture-only mode tabs that
> swap to a back-to-capture arrow once a draft exists; bottom edit tools
> overlay a full-bleed canvas), container-query-sized capture controls, and a
> min/max size clamp so the surface can't collapse. See
> [Capture vs edit chrome](#capture-vs-edit-chrome) and [Pan & zoom](#pan--zoom).

## Install

```bash
pnpm dlx shadcn@latest add @ilinxa/media-editor-01
```

Adds: **38 source files**, 2 peer deps (`konva ^10.3.0` + `react-konva ^19.2.4`), 1 shadcn primitive (`dialog`).

Optional fixtures item (`@ilinxa/media-editor-01-fixtures`) ships sample initial sources + a brand-pack sticker set for demos.

## Quick start — three shapes

### 1. Inline hero re-edit (CMS / content-composer step 2)

```tsx
import { useRef } from "react";
import {
  MediaEditor01,
  type MediaEditor01Handle,
} from "@/components/media-editor-01";

export function HeroEditor({ heroUrl }: { heroUrl: string }) {
  const editorRef = useRef<MediaEditor01Handle>(null);

  return (
    <MediaEditor01
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
  MediaEditor01,
  type MediaEditor01Handle,
} from "@/components/media-editor-01";

export function AttachmentEditor() {
  const editorRef = useRef<MediaEditor01Handle>(null);
  const [open, setOpen] = useState(false);

  return (
    <>
      <button onClick={() => setOpen(true)}>Add media</button>
      <MediaEditor01
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
<MediaEditor01 ref={editorRef} presentation="inline" />
```

Default capabilities: all three modes (photo / video / text), all six edit tools, both media sources (camera + upload), free aspect. The `presentation` override keeps the auto-rule from picking `dialog` (which would need `isOpen` wiring).

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

Disabling a tool removes it from the toolbar AND skips the corresponding layer at export time. The ref handle method for that tool (e.g., `addText()`) becomes a no-op + warns in dev.

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
| `"dialog"` | Wrapped in shadcn dialog. Mobile-fullscreen / desktop-modal sized by `aspect`. | story-composer-01, chat-panel |
| `"auto"` (default) | One rule: if `enabledModes` is empty → `inline`, else `dialog`. | — |

**Dialog mode requires `isOpen` + `onClose`.** A dev-only `console.error` fires once per instance when either is missing — runtime falls back to keeping the dialog closed until you wire both.

Desktop dialog sizing is viewport-relative and aspect-locked, with a min/max **clamp** so it can't collapse on a short window or overflow a tall one. Only the *driver* dimension is sized; the other follows from the aspect ratio:

| Aspect family | Driver | Clamp |
|---|---|---|
| Portrait (`9:16`, `4:5`, `1:1`) | height | `clamp(24rem, 85dvh, 44rem)` |
| Landscape (`16:9`, `free`) | width | `clamp(28rem, 85vw, 60rem)` |

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
- The **back arrow is rendered by this component** in the edit stage (top-left) when `enabledModes` includes a capture mode. If you supply `renderTopBar`, hide your own close in the edit stage so it doesn't collide — `story-composer-01`'s `ComposerPublishBar` does this via a `showClose` prop driven off the slot-context (`!ctx.isCapturing && hasCaptureMode → hide`). Edit-only configs (no capture mode) keep their close, since there's no Back to fall back to.
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

// Video — perf-shortcut returns the raw blob when nothing has been
// overlaid AND no crop. Otherwise re-encodes through MediaRecorder
// with the Konva overlay baked per frame.
const out = await editorRef.current.exportVideo({
  mimeType: "video/webm",          // optional; auto-picks via mime-fallback
  bitsPerSecond: 2_000_000,        // optional
  onProgress: (p) => setProgress(p), // ~10 ticks during re-encode, or 2 if shortcut
});

// Polymorphic — dispatches by current mode.
const out = await editorRef.current.export();
```

`metadata: ExportMetadata` includes `width`, `height`, `mimeType`, `durationMs?` (video), `textOverlays`, `stickers`, `drawingStrokes` (count), `appliedFilter`, `adjustments`, `crop?`.

## Imperative handle

22 methods grouped by role. Pass a `ref<MediaEditor01Handle>` to access.

| Group | Methods |
|---|---|
| Inspect | `getIsDirty`, `getMode`, `getState`, `loadState` |
| Capture ⚠️ | `switchCamera`, `takePhoto`, `startRecording`, `stopRecording`, `importFromGallery` |
| Edit | `addText`, `addSticker`, `setAdjustments`, `applyFilter`, `clearLayer`, `undo`, `redo` |
| Export | `exportImage`, `exportVideo`, `export` |
| Lifecycle | `reset`, `open`, `close` |

`getState()` returns a serializable `MediaEditorState` snapshot for draft persistence; `loadState()` restores it.

> ⚠️ **Capture group — deferred to v0.2.** The imperative capture methods
> (`takePhoto` / `startRecording` / `stopRecording` / `switchCamera` /
> `importFromGallery`) currently dev-warn and no-op. Drive capture through the
> in-UI camera controls in v0.1.x; programmatic capture lands in v0.2. Everything
> else on the handle (inspect / state / edit-overlay mutation / export /
> lifecycle) is fully wired.

## Footguns

### `enabledModes: []` AND no `initialSource`

Editor has nothing to capture and nothing to edit. Runtime renders a "No source provided" empty state (or `renderEmpty()` if supplied) with `role="status"` for screen readers. Dev: `console.warn` fires once per instance pointing at the misconfig.

### 2+ capture-enabled instances on the same page

`getUserMedia` against the same camera with multiple live streams degrades quickly. Dev-only `console.warn` fires when the count crosses ≥2. Edit-only instances bypass the counter entirely. Suggested fixes: use `presentation="dialog"` for one-at-a-time UX, or drop secondary instances to edit-only mode.

### Dialog mode without `isOpen`/`onClose`

`console.error` once per instance. Dialog stays closed. Fix: wire both props from your parent's state.

## Style hooks

Data attributes on the editor root for CSS / DOM querying:

- `data-slot="media-editor-01"`
- `data-mode` — `photo` / `video` / `text` / `none`
- `data-stage` — `capture` / `edit` / `publishing`
- `data-presentation` — `inline` / `dialog`
- `data-aspect` — `9:16` / `1:1` / `16:9` / `4:5` / `free`

Inside, the canvas wrapper always carries `data-canvas-placeholder=""` (regardless of state) and `data-stage`. The empty-state branch additionally carries `data-empty-config=""`.

## More

- Full prop reference: see [types.ts](../../../src/registry/components/media/media-editor-01/types.ts).
- Architecture / Q-P locks / why the four dials look the way they do: see [`media-editor-01-procomp-description.md`](./media-editor-01-procomp-description.md).
- Commit chain + implementation notes: see [`media-editor-01-procomp-plan.md`](./media-editor-01-procomp-plan.md).
- Extraction lessons (Phase A): see the decision file at `.claude/decisions/2026-06-02-media-editor-01-extraction-c1-c8-phase-a-half.md`.

## Known gaps (v0.1.1 alpha)

The full visual pipeline is wired — camera viewfinder + shutter, all six tool
panels (text / draw / stickers / filters / adjust / crop), undo/redo, drag-pan,
and export all work end-to-end (the `story-composer-01` wrapper exercises them in
production). The remaining gaps are narrow:

- **Imperative capture handle** — `takePhoto` / `startRecording` / `stopRecording` / `switchCamera` / `importFromGallery` dev-warn and no-op; programmatic capture lands in v0.2. The in-UI camera controls are the supported capture path. (See [Imperative handle](#imperative-handle).)
- **Library media source** — `mediaSources` supports `camera` + `upload`; a device-library picker is deferred to v0.2.
- **Nested `labels` prop** — the public `labels` shape is in transition; some nested keys are not yet honored end-to-end (tracked as the C17 label-flattening refactor). Mode/tool/Back strings are correct.
- **Analytics slots** — `onModeChange` / `onEditAction` are declared but not yet emitted (v0.1.2). `renderPermissionDenied` is declared but the built-in `CameraPermissionPrompt` is always used (v0.1.2).
- **Keyboard scope** — arrow/`+`/`-`/`0` pan-zoom keys are bound at the window level; a focus-scoped binding lands in v0.1.2.

None block type-correct use of the public API.
