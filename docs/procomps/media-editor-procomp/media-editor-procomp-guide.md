# media-editor — consumer guide

> Alpha. The reusable capture + edit surface lifted out of
> [`story-composer`](../story-composer-procomp/) v0.1.5. Four
> controllable capability dials let you pull as little or as much editor
> surface as your context needs. `story-composer` v0.2.x is a thin
> wrapper around this; `content-composer`, `chat-panel`, and CMS hero
> editors are downstream consumers.
>
> **v0.8.0 (2026-10-30)** — a fixed `aspect` fixes the stage (the largest box of the ratio, letterboxed, on every
> viewport); a fixed-aspect dialog runs the stage edge to edge on a dark surface; `contentClassName`;
> `dismissOnOutsidePress`; icon tool chips that go icon-only when narrow; named slider thumbs. See [`aspect`](#aspect)
> and [Migration 0.7 → 0.8](#migration-07--08).
>
> **v0.7.0 (2026-10-29, breaking type)** — the canvas `aspect` takes any `"W:H"` (`CanvasAspect`, also in the slot
> context); `defaultCropAspect`; `crop-set` carries `aspect` + `ratio`; `getState()` / `loadState` carry `cropAspect`;
> a mounted editor follows a new `cropAspects` list; chips are `aria-pressed` and named by `labels.crop.aspect`; text
> cards show every line while editing at the size they export. See [Carrying a crop aspect](#carrying-a-crop-aspect)
> and [Migration 0.6 → 0.7](#migration-06--07).
>
> **v0.6.0 (2026-10-26, breaking)** — `ExportMetadata.width` / `height` are the exported blob's pixels (they were
> the on-screen size); crop frames fit the photo; export `region` / `width` / `height` / `maxEdge` /
> `backgroundColor`; `isModified()`, `isSettled()` / `whenSettled()`; every content `EditAction` is emitted;
> snapshots carry the text card and their layout (`frame`); text overlays draw at their real size; several layout /
> focus fixes. See [Migration 0.5 → 0.6](#migration-05--06).
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
| `"W:H"` (0.7.0), e.g. `"1.91:1"` | Any other ratio — a feed's landscape post, a carousel's shared aspect |

The aspect drives canvas dimensions, the capture crop, the default crop choice (`[aspect]`), and (in dialog mode) the
modal size — landscape when the ratio is above 1, portrait otherwise (`"free"` sizes as a 4:3 landscape). An invalid `"W:H"` falls back to `"free"` with
one development warning. `"original"` is not a canvas aspect (the photo's ratio is unknown before it loads): resolve
it yourself and pass `"W:H"`. Pass `cropAspects` to override the crop-tool aspect choices.

**A fixed aspect fixes the stage (0.8.0).** With any aspect but `"free"`, the on-screen stage is the largest box of
that ratio that fits the space the editor has, centred, with the letterbox around it (outside the stage) — on every
viewport, in both presentations, and while the crop panel takes room. The Konva stage takes the ratio to the pixel
(both sides within 1 px of the box, never larger), so an `exportImage({ region: "stage" })` is that ratio and a
`{ width, height }` export of the same ratio trims nothing. In a phone-fullscreen 9:16 dialog the stage is
390 × 693 on a 390 × 844 screen, with dark bands above and below; in the desktop dialog (already 9:16) it fills the
dialog edge to edge. Inline, the canvas is width-driven — `min(100%, 30rem, 70vh × W/H)` — so a short window
shrinks it instead of breaking the ratio.

`cropAspects` takes every value above plus `"original"` (the loaded photo's own ratio — the chip reads
`labels.crop.original`) and any `"W:H"` string with positive numbers (`"3:2"`, `"1.91:1"`). Invalid entries are dropped
with one development warning each. Crop frames — the default frame, every preset and every drag / resize — are laid
out on and clamped to the **photo's displayed area**, so a `1:1` crop of a letterboxed photo is square. With a single
entry the crop tool shows no chip row (the one aspect is applied).

### Carrying a crop aspect

In a multi-photo post the first photo's aspect usually applies to the rest. The editor reports what was chosen and
opens on it:

```tsx
const [aspect, setAspect] = useState<CropAspect>("4:5");

<MediaEditor
  key={photo.id}                       // one editor per photo — defaultCropAspect is read at mount
  cropAspects={["original", "1:1", "4:5", "1.91:1"]}
  defaultCropAspect={aspect}           // Crop opens on it, its frame laid out
  onEditAction={(a) => {
    if (a.kind === "crop-set") setAspect(a.aspect); // a.ratio: width / height ("original" resolved)
  }}
/>
```

- `crop-set` fires on **Apply** (not on a chip pick) with `{ crop, aspect, ratio }`; `ratio` is `null` for `"free"` and
  the photo's own ratio for `"original"`.
- `getState().cropAspect` is the current chip selection (also without Apply); `loadState` restores it when it is one
  of the current `cropAspects`. Picking a chip changes the `getState()` snapshot (not `isModified()`); `reset()` keeps
  the selection.
- `defaultCropAspect` must be one of the resolved `cropAspects`, otherwise the first entry is used (one development
  warning).
- A mounted editor follows a new `cropAspects` list: when the selected aspect is no longer in it, the selection moves
  to `defaultCropAspect` (if listed) or the first entry and any pending crop frame is cleared. (Before 0.7.0 a mounted
  editor kept the list it was created with.)
- Chip names: `labels.crop.aspect(aspect, format)` — default `labels.crop.free` / `labels.crop.original` for those two,
  otherwise the ratio with locale digits and no grouping (`"1.91:1"`, `"١٫٩١:١"` in `ar-EG`). A host `crop.aspect`
  names every chip, `"free"` and `"original"` included. Chips are `aria-pressed`.

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

**Discard confirm.** With `confirmOnDiscard` (default true), Escape, a backdrop press and `handle.close()` (wire your
own Cancel button to it) ask first when the content
was changed (`isModified()`) or the media came from the camera or the file picker in this session (a capture cannot be
re-loaded). An untouched `initialSource` or `loadState` closes without asking.

**Dialog content classes.** `dialogClassName` is merged last onto the dialog's content element. Its grid tracks are
`minmax(0, 1fr)`, so the crop panel (which sits in flow) can no longer push crop Apply / Cancel or Done out of the
dialog. Keep the dialog's height definite: with a fixed aspect the canvas region is a size container, so a class that
makes the height `auto` (or an in-flow top / bottom bar taller than the dialog) leaves it 0 high — the editor warns
once in development.

**Edge to edge (0.8.0).** A fixed-aspect dialog draws no padding or border around the stage. Your `renderTopBar` /
`renderBottomToolbar` row, when it sits in flow, now meets the dialog edge — give it its own padding (the editor's
own Back arrow, mode pill and tool scrim are positioned over the stage and need nothing). The letterbox is the
editor's root surface and defaults to the canvas's black; the surface carries the `dark` class, so everything inside
it — the editor's chrome, your `renderTopBar` / `renderBottomToolbar` and `overlay` — renders with your dark-theme
tokens whatever the page theme (dialogs it opens, such as the discard confirm, keep the page theme).

**Root surface classes.** `contentClassName` is merged last onto the editor's root (`data-slot="media-editor"`) in
both presentations: `p-0 border-0 shadow-none` drops the inline card chrome, `bg-…` colours the letterbox.

**Backdrop presses.** `dismissOnOutsidePress={false}` (dialog only) makes a press on the backdrop do nothing — a story
editor should not close because a thumb missed the 9:16 box. Escape, `handle.close()` and your own close control
still close (a dirty editor still asks first). It works with Radix and Base UI dialogs: a reason passed to
`onOpenChange` (Base UI) decides; otherwise the editor records where the press started.

**Canvas background.** `canvasBackground` (any CSS colour, `var(--token)` too) is shown behind the photo and is the
default fill of image exports, so what you see is what is exported. Without it the canvas is black on screen and an
export leaves uncovered areas transparent (JPEG encodes them black).

**Focus on close.** However the dialog closes (Escape, Cancel / Discard, or you setting `isOpen` to false, e.g. after a publish), focus goes back to the element that had it when the dialog opened — normally your opener button. If you want focus somewhere else, move it after the dialog has closed (an effect on your open state, or later); a `focus()` call inside `onClose` runs while the dialog's focus trap is still active and is undone. Focus also goes back
to the opener when you **unmount** `<MediaEditor>` while it holds focus (dialog or inline), and after the discard
confirm's "Keep editing" it returns into the editor.

Desktop dialog sizing is viewport-relative and aspect-locked, with a min/max **clamp** so it can't collapse on a short window or overflow a tall one. Only the *driver* dimension is sized; the other follows from the aspect ratio:

| Aspect family | Driver | Clamp |
|---|---|---|
| Portrait (`9:16`, `4:5`, `1:1`) | height | `clamp(24rem, 85dvh, 44rem)` |
| Landscape (`16:9`, `free`) | width | `clamp(28rem, 85vw, 60rem)` |

**`overlay`** — `overlay?: ReactNode` is rendered as the last child of the editor surface, above the editor content. In dialog presentation it is inside the dialog content, so buttons in it stay clickable despite the modal (a sibling rendered next to `<MediaEditor>` would sit outside the dialog and be blocked). Position it with `absolute inset-0` (the surface is `relative`) and give it `z-40` or higher — the mode pill and Back button sit at `z-30`, the edit toolbars at `z-20` — plus `rounded-[inherit]` so it follows the inline surface's corners. `story-composer` uses it for its publishing overlay (requires media-editor >= 0.4.0).

Mobile breakpoint is always fullscreen (`h-[100dvh] w-screen`). With `"free"` the canvas fills the dialog; with a fixed aspect it is the fitted, letterboxed stage described under [`aspect`](#aspect). The bottom edit tools **overlay** it (see [Capture vs edit chrome](#capture-vs-edit-chrome)); on a narrow editor the tool chips turn icon-only (each keeps its name for assistive technology and as a tooltip). Use `presentation="inline"` if you need custom sizing — inline is width-driven, so it stays responsive between a small chat embed and a full surface.

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
// Photo / text — image output. Default mime image/jpeg (text cards: png), quality 0.9.
const { blob, metadata } = await editorRef.current.exportImage({
  format: "image/jpeg",            // "image/png" | "image/webp"
  quality: 0.9,
  region: "media",                 // "stage" (default) | "media" — the photo only, no letterbox
  maxEdge: 2048,                   // optional cap on the longer edge
  backgroundColor: "var(--card)",  // optional fill under transparent areas
  onProgress: (p) => setProgress(p), // fires (0) at start, (1) on done
});
// metadata.width / height are the blob's pixels.

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

**Region and size.**

| Option | Effect |
|---|---|
| `region: "stage"` (default) | The whole canvas, or the crop frame while one is set. Areas the photo does not cover are transparent (JPEG: black) unless filled. Unchanged from 0.5 apart from the metadata numbers. |
| `region: "media"` | Only the photo's displayed area (∩ the crop frame) — no letterbox; overlays outside it are cut. Default size = the photo's own resolution, capped at 4096 px on the longer edge. |
| `pixelRatio` | Output pixels per canvas CSS pixel. Default 2 (or the photo's resolution for `"media"`). |
| `width` / `height` | Exact output size. One of them: the other follows the region's aspect. Both: the region is centre-trimmed to that aspect. Wins over `maxEdge` and `pixelRatio`. |
| `maxEdge` | Caps the longer edge of the size the other options give; never scales up. |
| `backgroundColor` | Fill painted under the content (any CSS colour, incl. `var()`); default `canvasBackground`, else none. An unresolvable value is ignored with a development warning. |

Every image export is also capped at 16.7 million pixels (the iOS canvas limit). Exports draw the photo at the export
resolution (not the screen copy), and selection handles never appear in an export.

**Text cards** (text mode) are drawn with Canvas 2D at the size shown on screen (`pixelRatio` default 2) and honour
`format` / `quality` (default PNG); `region` and `backgroundColor` do not apply, and `width` / `height` scale the card
with its aspect kept (`width` wins), `maxEdge` capping the result. `exportImage()` and `export()` both reach it in text
mode. Metadata carries `textOnly`.

What you see is what is exported (0.7.0): the card is the reference box — the font (7 % of the card's width, 24–48 px)
and the wrap width (the card width minus 4 rem, at most 40 rem) follow the card, not the viewport; the input grows with
the text, and when the text is taller than the space between a top margin (up to 88 px) and the controls — the bar's
real height, also with the background picker open — the font steps down until every line fits.
The export reads the live font size, wrap width, line height and the text's top from the input and draws each line
where the preview shows it. Limit: at 14 px the font stops shrinking and the input scrolls; the export still draws
every line from the input's top, and only a block taller than the whole card is centred, cutting its first and last
lines.

**Waiting for the canvas.** A crop Apply, `loadState` or `initialSource` swaps the source asynchronously. `exportImage`
waits until the new source is painted and the overlays have been moved onto it (`whenSettled`, 10 s timeout), and
rejects — instead of exporting a blank or half-updated canvas — when the source failed to load. `isSettled()` reports
it synchronously.

`metadata: ExportMetadata` includes `width` / `height` (**the blob's pixels**), `mimeType`, `durationMs?` (video),
`textOverlays`, `stickers`, `drawingStrokes` (count), `appliedFilter`, `adjustments`, `crop?`, `textOnly?` (text
card) and `frame?`. Overlay and crop coordinates are **stage CSS pixels**, not blob pixels; `frame` (`stageWidth`,
`stageHeight`, `media?`) is the layout they are in — map a point onto a whole-stage export with
`x * width / frame.stageWidth`, onto a `region: "media"` export with
`(x - frame.media.x) * width / frame.media.width` (with a crop set, the exported rect is the crop ∩ `frame.media`;
use its origin and width instead). For a passed-through video, `mimeType` is the file's own type (else the first allowed
output type, else `video/webm`) and `frame` is omitted.

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
`crop.aspectCount(count, formatted)`, `crop.aspect(aspect, format)` (chip names, 0.7.0), `trim.seconds(seconds, formatted)`, `intake.fileTooLarge(sizeMb, maxMb,
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

26 methods grouped by role. Pass a `ref<MediaEditorHandle>` to access.

| Group | Methods |
|---|---|
| Inspect | `getIsDirty`, `isModified`, `getMode`, `getState`, `loadState`, `getSourceBlob`, `isSettled`, `whenSettled` |
| Capture (not implemented) | `switchCamera`, `takePhoto`, `startRecording`, `stopRecording`, `importFromGallery` |
| Edit | `addText` (with a text argument; the no-argument form is not implemented), `addSticker`, `setAdjustments`, `applyFilter`, `clearLayer`, `undo` (not implemented), `redo` (not implemented) |
| Export | `exportImage`, `exportVideo`, `export` |
| Lifecycle | `reset`, `open` (not implemented), `close` |

`getState()` returns a serializable `MediaEditorState` snapshot for draft persistence; `loadState()` restores it.

- **Text cards** round-trip: `getState().textOnly` holds the text, font, colour and background (and `textContent` /
  `textBackground` mirror it in text mode). A text snapshot without `textOnly` (from before 0.6.0) seeds the card from
  its `textContent` and `textBackground`.
- **Layout.** `getState().frame` records the stage size and the photo's displayed rect the coordinates were taken in.
  `loadState` maps text / stickers / strokes / crop from that frame onto the current layout once the photo is shown,
  so a draft reopened on another screen size (or a rotated phone) keeps its overlays on the same picture content.
  Overlays also follow the photo when the canvas resizes or a crop is applied. Snapshots without `frame` load as before.
- `isModified()` is false right after a load (`initialSource`, `loadState`, a capture / pick) and true after any
  content change; `getIsDirty()` still means "has something loaded or edited". `loadState(state, { keepModified:
  true })` keeps the flag — for a round-trip of the editor's own state (`loadState({ ...getState(), mode })`).
- `onEditAction` emits `text-add` / `text-update` / `text-remove`, `sticker-add` / `sticker-remove`, `draw-stroke`,
  `filter-apply`, `adjust-change` (once a slider has been still for 250 ms, flushed by an export) and `crop-set` (with
  the selected `aspect` and its `ratio`, 0.7.0) on commit, besides `mode-change` / `tool-open` / `tool-close` / `reset`. Loading emits none; Back on a tool panel emits
  removes for what it discards.

> ⚠️ **Not implemented.** These handle members dev-warn and do nothing (each carries `@notImplemented` in `types.ts`):
> the imperative capture methods (`takePhoto` / `startRecording` / `stopRecording` / `switchCamera` / `importFromGallery`) —
> drive capture through the in-UI camera controls instead; `undo` / `redo` (no mutations are recorded as commands);
> `open` (dialog mode is controlled — set `isOpen` on the component); and `addText()` with no argument
> (`addText(text)` works). The rest of the handle (inspect / state / edit-overlay mutation / export / `reset` / `close`) is wired.

## Feature slices (P3, 2026-08-11)

Camera capture ships as a separate, opt-in registry item — `@ilinxa/media-editor-capture` — not bundled into the base install.

**Base vs feature.** `@ilinxa/media-editor` ships the file/gallery intake surface, the edit canvas + all six tools, and export — verified artifact **468.0 KB** at 0.8.0 (447.4 KB at 0.7.0, 431.7 KB at 0.6.0, 332.9 KB at 0.5.0, 282.0 KB at the split). `@ilinxa/media-editor-capture` adds `getUserMedia`/`MediaRecorder` capture, the permission-state flow, the shutter control, and the multi-instance dev-warn guard — **8 files, 53.7 KB** at 0.5.0. At the split, the two together replaced the single 315 KB artifact. `validateGalleryFile` (generic file-type/size check) stayed in base — it's file-intake, not a camera concern — so base-alone file/gallery intake is fully usable without the feature. **No npm deps moved**: `konva` / `react-konva` stay in base (every consumer needs the canvas); the feature's only dep, `lucide-react`, was already a base dep too. What changed instead is a lazy boundary — the konva edit canvas now mounts via `React.lazy(() => import("./parts/lazy-editor-canvas"))` (`parts/lazy-editor-canvas.tsx` wraps `EditorCanvas`), so the konva chunk defers off the editor's initial paint (capture-stage-only or text-only-mode instances never pay for it up front).

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

## Migration 0.5 → 0.6

| Change | What to do |
|---|---|
| **`ExportMetadata.width` / `height` are the blob's pixels** for photo and text exports (they were the canvas CSS size; at the default `pixelRatio` 2 the numbers double) | If you stored them as the item size, nothing — they are now right. If you placed `textOverlays` / `stickers` against them, scale by `width / frame.stageWidth`. |
| Crop frames fit the photo, not the canvas | Nothing — a preset now yields its ratio on a letterboxed photo. |
| The discard confirm follows `isModified()` (and captures); an untouched `initialSource` closes without asking | Nothing, unless you relied on the question. |
| Snapshots gain optional `textOnly` and `frame` | Nothing — both optional; old snapshots load as before. Persist them with the rest of the state. |
| `onEditAction` emits content actions | Ignore the kinds you don't handle; the `EditAction` union is unchanged. |
| `exportImage` waits for a source swap and rejects on a failed / blank source | Catch it as you catch other export errors. |
| `exportTextOnlyBlob` is deprecated (the editor draws text cards with Canvas 2D) | Keep it for your own DOM surfaces, or draw with Canvas 2D. |
| `cropAspects` type is `CropAspect[]` | Nothing — a wider type. |
| Text overlays draw at their real `fontSize` (a canvas cannot read a `var(--font-…)` family, so they drew at 10 px) | Check text placed with older versions — it renders at the size it was given now. |

## Migration 0.6 → 0.7

| Change | What to do |
|---|---|
| **The canvas `aspect` and `EditorCtx.aspect` (your slots' context) are `CanvasAspect`** — any `"W:H"` besides the five `AspectRatio` values | A `switch` / `Record<AspectRatio, …>` over the slot context's `aspect` must handle `"W:H"` (parse it, or fall back). Passing one of the five values works as before. |
| `EditAction` `crop-set` has required `aspect` and `ratio` | Readers: nothing. Code that **builds** a `crop-set` action (mocks, fixtures, a replayed log) adds both fields. |
| `MediaEditorResolvedLabels` gains a required `cropAspectName` | Only if you hand-build a full resolved (flat) label set — e.g. a custom capture surface's `labels`: add it. Nested `labels` are unaffected. |
| A mounted editor follows a new `cropAspects` list | Drop a `key` remount you added to work around the stale list (keep it if you want `defaultCropAspect` re-read per photo). |
| Chips are named by `labels.crop.aspect` (default: the ratio in locale digits) | A custom `"W:H"` chip that showed the raw string now shows locale digits (`"1.91:1"` in English, unchanged). Pass `crop.aspect` for custom names. |
| Text cards fit the card (font, wrap width, auto-grow, step-down) and the export follows the preview | A text story looks smaller on a desktop dialog than before (the font follows the card, not the viewport) and long text is no longer clipped to three lines. Re-check any screenshot test of the text card. |
| `getState()` carries `cropAspect` | Persist it with the rest of the snapshot (optional — older snapshots load as before). |

## Migration 0.7 → 0.8

No type changes; the layout of a **fixed** aspect changed (`"free"` is as before).

| Change | What to do |
|---|---|
| The stage is the fitted box of the aspect (letterboxed), not the leftover space | Drop export workarounds that centre-trim or pad a stage export to your ratio — `region: "stage"` is the ratio now. A host that read the stage size expecting it to fill a phone screen gets the fitted size. |
| A fixed-aspect dialog has no padding / border around the stage | Give an in-flow `renderTopBar` / `renderBottomToolbar` row its own padding. Remove a `dialogClassName` you used to size the box to the ratio to counter the old padding (keep one that sizes the dialog itself). |
| A fixed-aspect dialog is a dark surface (black letterbox, `dark` class on the editor root) | Pass `contentClassName="bg-…"` for another letterbox colour. Your `renderTopBar` / `overlay` content renders with dark-theme tokens there — check it in a light page. |
| Inline: the canvas width is `min(100%, 30rem, 70vh × W/H)` (was full width with a 70vh height cap that broke the ratio) | On a short window the inline canvas is narrower than before. |
| Tool chips carry icons and go icon-only on a narrow editor | Screenshot tests of the tool row change. Chip names are unchanged. |
| New `contentClassName`, `dismissOnOutsidePress` | Optional. |

## Footguns

### `enabledModes: []` AND no `initialSource`

Editor has nothing to capture and nothing to edit. Runtime renders a "No source provided" empty state (or `renderEmpty()` if supplied) with `role="status"` for screen readers. Dev: `console.warn` fires once per instance pointing at the misconfig.

### 2+ capture-enabled instances on the same page

`getUserMedia` against the same camera with multiple live streams degrades quickly. Dev-only `console.warn` fires when the count crosses ≥2. Edit-only instances bypass the counter entirely. Suggested fixes: use `presentation="dialog"` for one-at-a-time UX, or drop secondary instances to edit-only mode.

### Dialog mode without `isOpen`/`onClose`

`console.error` once per instance. Dialog stays closed. Fix: wire both props from your parent's state.

### A fixed-aspect dialog with an `auto` height

The canvas region is a size container: if `dialogClassName` / `contentClassName` (or an in-flow bar taller than the
dialog) leaves it without a definite height, the stage is 0 high and nothing shows. One development warning
(`canvas-region-collapsed`) names it. Keep the dialog's height definite.

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
- **`undo` / `redo` actions** — never emitted (there is no undo stack); every other `EditAction` kind is.
- **Very long text cards** — at the 14 px floor the input scrolls (the export draws every line); a block taller than
  the whole card is centred and loses its first and last lines (see [Export](#export)).
- **Dialog size for ratios just above 1** (`"5:4"`, `"4:3"`, `"free"`) — the dialog is width-driven for any ratio above
  1 and its height cap can win on short viewports, so the canvas ratio drifts there.
- **Moving a sticker** sets `isModified()` but has no `EditAction` kind (the union has no `sticker-update`).

**Closed in v0.1.2:** `onModeChange` + `onEditAction` now emit; the
`renderPermissionDenied` slot is honored for the denied state; the pan-zoom
keyboard is focus-scoped to the canvas (was window-bound).

None block type-correct use of the public API.
