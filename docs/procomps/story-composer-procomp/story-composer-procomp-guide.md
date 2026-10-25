# story-composer — consumer guide

> v0.6.0 alpha. Third component in the story-system trilogy:
> [`story-rail`](../story-rail-procomp/) (discovery), [`story-viewer`](../story-viewer-procomp/) (consumption),
> **`story-composer`** (creation). A locked 9:16 wrapper around [`media-editor`](../media-editor-procomp/) that adds the
> story publish flow (upload, progress, details step, error recovery).

## Install

```bash
pnpm dlx shadcn@latest add @ilinxa/story-composer
```

This installs story-composer and `@ilinxa/media-editor` (≥ 0.5.0; Konva + react-konva come with the editor). The
default install is **upload-only**: no camera code and no `getUserMedia` — the editor only records (re-encodes) when
overlays are baked into a video, which its tools never do today.

To add the camera, install the capture add-on and pass it in:

```bash
pnpm dlx shadcn@latest add @ilinxa/media-editor-capture
```

```tsx
import { mediaCapture } from "@/components/media-editor/features/capture";

<StoryComposer capture={mediaCapture} … />
```

Optional fixtures item (`@ilinxa/story-composer-fixtures`) ships the sample data used by the docs demo.

> **Release together with media-editor 0.5.0.** story-composer 0.6.0 uses media-editor's typed labels, `locale`,
> `acceptMediaTypes`, `videoOutput` and its `inert` body under overlays. When updating, re-add both:
> `pnpm dlx shadcn@latest add @ilinxa/story-composer @ilinxa/media-editor --overwrite`.

## Quick start

```tsx
import { useState } from "react";
import { StoryComposer } from "@/components/story-composer";

export function CreateStoryButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button onClick={() => setOpen(true)}>Create story</button>
      <StoryComposer
        isOpen={open}
        onClose={() => setOpen(false)}
        uploadUrl="/api/stories"
        onPublished={(story, result) => {
          // `result` is exactly what your upload returned (server ids, timestamps, …)
          setOpen(false);
        }}
      />
    </>
  );
}
```

## Sources and formats

| Prop | Default | Effect |
|---|---|---|
| `capture` | — | The camera add-on (`mediaCapture` from `@ilinxa/media-editor-capture`). Without it there is no camera tab. |
| `sources` | `["camera","upload"]` with `capture`, else `["upload"]` | Intake sources passed to the editor. |
| `acceptMediaTypes` | `["image/*","video/*"]` | What the file picker offers **and** what the validator accepts (wildcards allowed). |
| `videoOutput` | built-in chain (WebM VP9 → VP8 → MP4) | `{ mimeTypes: ["video/mp4"] }` restricts re-encoding and recording to those types. With `capture`, if the browser can record none of them (Firefox has no MP4 recorder), in-browser recording is unavailable and `onValidationError` fires once; uploading a video file still works. Without `capture` nothing is recorded or re-encoded, so it has no effect. |
| `maxFileSizeMb` | `50` | Larger files are rejected through `onValidationError`. |
| `maxVideoDuration` | `30` | Camera recording limit, in seconds. |

An unedited video is uploaded as the original file (no re-encode). The uploader always receives a `Blob`, not the
original `File`; read `metadata.mimeType` for its type.

## Capture modes

| Mode | Behaviour |
|---|---|
| **`photo`** (default) | Pick or take a photo, then edit. |
| **`video`** | Pick a video (or record with `capture`: long-press or tap-to-toggle, auto-stop at `maxVideoDuration`). Videos are not edited: no tools apply to a video draft, and it is uploaded as the original file. |
| **`text`** | Gradient background + centred text + font and colour picker. PNG output. |

Hide modes with `hideModes={["video","text"]}`; pick the start mode with `defaultMode`.

## Edit tools

Default `enabledTools` is `["text","draw","stickers","filters","adjust"]`; **Crop is opt-in** (stories are 9:16).

| Tool | Behaviour |
|---|---|
| **Text** | Draggable, rotatable, scalable overlays; font / size / colour / align. |
| **Draw** | Freehand strokes with eraser; colour + brush size. |
| **Stickers** | Built-in emoji stickers plus yours via `stickers`. |
| **Filters** | Built-in presets with thumbnails; add or replace with `filterPresets` / `replaceBuiltinFilters`. |
| **Adjust** | Brightness / contrast / saturation / blur. |
| **Crop** | Opt-in; ratios from `cropAspects`. |

Video drafts show no tool chips — none of the tools edits video yet.

There is no undo / redo: `undo` / `redo` on the editor handle are not implemented and the editor binds no Ctrl/Cmd+Z.

## Pan + zoom

The editor canvas zooms 1× → 4×, anchored to the cursor or pinch midpoint.

| Gesture | Behaviour |
|---|---|
| **Drag** (one pointer) | Pan. A drag that starts on a text / sticker overlay moves the overlay instead; a tap never pans. |
| **Two-finger pinch** | Zoom around the midpoint; a two-finger drag pans. |
| **Mouse wheel** | Zoom around the cursor. |
| **Arrow keys** | Pan. |
| **`+` / `-` / `0`** | Zoom in / out / reset. |

Pan and zoom are off while drawing and while cropping.

## Top bar

| | **Capture stage** | **Edit stage** |
|---|---|---|
| Start | **✕ Close** | **← Back to capture** |
| Centre | Photo / Video / Text tabs | — |
| End | Publish — hidden during photo / video capture, shown for text | **Publish** |

`ComposerPublishBar` renders this in the editor's `renderTopBar` slot; pass `renderTopBar` to replace it.

## Publish

**Default upload** — `POST` multipart `FormData` with `file`, `metadata` (JSON), every `uploadFields` entry, and the
publish fields (`caption` and your fields; non-strings JSON-encoded):

```tsx
<StoryComposer uploadUrl="/api/stories" uploadFields={{ csrfToken: token }} onPublished={…} />
```

**Custom uploader** — signed URLs, direct-to-storage, etc. It wins over `uploadUrl`:

```tsx
<StoryComposer
  uploader={async (blob, metadata, fields) => {
    const presigned = await fetch("/api/presign").then((r) => r.json());
    await fetch(presigned.uploadUrl, { method: "PUT", body: blob });
    return { url: presigned.publicUrl, id: presigned.storyId, caption: fields?.caption };
  }}
  onPublished={(story, result) => {/* result.id is your server id */}}
/>
```

`onPublished(story, result)`: `story` is a convenience shape (`items[0].src = result.url`, client-made ids and
`createdAt`); **`result` is your uploader's resolved value, untouched** — use it for server ids and timestamps.
One-argument handlers keep working.

### Details step (caption and your fields)

Set `caption` or `renderPublishFields` and Publish opens a details step over the editor (Back / Publish) instead of
publishing in one tap:

```tsx
<StoryComposer
  caption={{ maxLength: 220, required: false }}
  renderPublishFields={({ value, onChange, status }) => (
    <AudiencePicker
      value={value.audience as string | undefined}
      disabled={status !== "idle"}
      onChange={(audience) => onChange({ ...value, audience })}
    />
  )}
  canPublish={(fields) => fields.audience !== undefined}
  …
/>
```

- `publishFields` + `onPublishFieldsChange` make the fields controlled (the prop wins every render); otherwise they
  reset after a successful publish, on close and on `reset()`.
- The details Publish is enabled only when the caption rules (`required`, `maxLength`) **and** `canPublish(fields)`
  pass; a caption problem is shown under the field (`labels.captionRequired`, `labels.captionTooLong(max)`). A host
  `canPublish` gives no reason of its own — render one in your fields. Without a details step, `canPublish` gates the
  top-bar Publish.
- Escape inside the details step is Back. The counter is isolated for RTL.
- `handle.publish()` and `ctx.publish()` open the details step when one is configured and closed; with the step open
  (or none configured) they publish. When `caption` or `canPublish` blocks it they warn once in development and resolve
  without publishing. One publish runs at a time. A custom `renderTopBar` opens the step with `ctx.openDetails()`.
- Publish fields named `file`, `metadata` or any `uploadFields` key are skipped (one dev warning); `null` / `undefined`
  values are skipped; an empty caption is sent.

### Status lifecycle

`status` runs `idle` → `compositing` → `uploading` → `done` or `error`. `done` announces `labels.published` and settles
to `idle` the next time the composer opens or the details step opens. Closing (`isOpen` false), `reset()` and Cancel
return to `idle` and cancel any publish in flight (a pending `done` survives a close, so the announcement is not cut
off, and settles on reopen). **A successful publish consumes the draft:** the editor is reset after
`onPublished`, so the next open starts fresh. Cancel and errors keep the draft.

### Progress and errors

The progress / error overlay renders inside the editor surface (inside the dialog in dialog presentation), and the
editor behind it is `inert`.

- **Retry** re-runs the publish; **Cancel** returns to the editor with the draft intact. Its label is
  `labels.discardCancel` ("Keep editing") while uploading and `labels.uploadCancel` ("Cancel") in the error state.
- The message is `getErrorMessage?.(error) ?? labels.uploadFailedBody`. The default uploader's own errors are labels
  too (`uploadErrorHttp(status)`, `uploadErrorNetwork`, `uploadErrorBadResponse` — a non-JSON 2xx response, with the
  parser error as `cause` — and `uploadErrorNoDestination`), so `onPublishError` receives a localized message.
  `uploadCancelled` is what `useImageUploader().upload()` rejects with on cancel; the composer treats that as a cancel,
  not an error.
- A throwing `onPublished` does not show the error overlay or fire `onPublishError`; the error reaches the `publish()`
  caller.
- Escape does nothing while the progress / error overlay is up (use its buttons), and the dialog does not close.
- `renderPublishingOverlay({ progress, mode, status, error, retry, cancel })` replaces the default overlay.
- When publishing completes, `labels.published` is announced to screen readers.

## Localization

- `labels` — story-composer's own strings (publish bar, details step, overlay, uploader errors). Templated strings are
  functions: `captionCounter(count, max)`, `uploadErrorHttp(status)`.
- `labels.editor` — the editor's nested labels (`MediaEditorLabels`, see the media-editor guide), passed straight
  through. The older flat editor keys on `labels` (`modePhoto`, `toolText`, …) still work and win over
  `labels.editor` on conflict.
- `locale` — BCP 47 tag for numbers (progress %, caption counter) and the editor's numbers.

## Responsive

- **Mobile** (`< md`): full-screen, safe-area aware.
- **Desktop** (`≥ md`): centred 9:16 modal.
- `presentation="fullscreen" | "modal" | "auto"` (default `"auto"`). `"fullscreen"` and `"modal"` behave the same —
  both use the editor's dialog, which is full-screen on mobile and a modal on desktop; `"auto"` lets the editor decide.

## Permissions (with `capture`)

- Camera permission is requested on open; video mode also asks for the microphone (`recordAudio={false}` skips it).
- A denied state shows retry + "use gallery instead"; it re-checks automatically through
  `navigator.permissions.query` where supported.
- `onPermissionDenied` fires once per denial. Requires HTTPS (or `localhost`).

## Customization

| Prop | Default | What it changes |
|---|---|---|
| `defaultFacing` | rear on touch devices, front elsewhere | Initial camera (with `capture`) |
| `fonts` / `colorPresets` | built-in sets | Text-tool fonts, colour swatches |
| `filterPresets` / `stickers` | built-in sets | Add, or replace with `replaceBuiltinFilters` / `replaceBuiltinStickers` |
| `cropAspects` | editor default | Crop ratio buttons (with the crop tool) |
| `confirmOnDiscard` | `true` | Confirm before discarding unsaved work |
| `editorBackground` | — | **Not implemented** — accepted, dev-warns, no effect |

## Exports

- `StoryComposer`, `ComposerPublishBar`, `PublishDetailsStep`, `useStoryComposerState`, `useImageUploader`,
  `DEFAULT_STORY_COMPOSER_LABELS`, `DEFAULT_ADJUSTMENTS`, and the types (`StoryComposerProps`, `StoryComposerHandle`,
  `StoryComposerLabels`, `PublishFields`, `PublishStatus`, `Uploader`, `PublishResult`, `PublishedStory`, …).
- Editor parts and helpers come from `@/components/media-editor`; the camera from
  `@/components/media-editor/features/capture`.

## Imperative handle

```tsx
const ref = useRef<StoryComposerHandle>(null);
ref.current?.publish();      // respects the caption / canPublish gates
ref.current?.exportBlob();   // { blob, metadata } without uploading
ref.current?.reset();
ref.current?.addText("Hello!");
ref.current?.addSticker(sticker);
ref.current?.setAdjustments({ brightness: 0.2 });
ref.current?.applyFilter("clarendon");
ref.current?.close();
```

`open`, `switchCamera`, `takePhoto`, `startRecording`, `stopRecording` and `importFromGallery` forward to the editor,
where they are **not implemented** (dev-warn, no effect) — use `isOpen` and the in-UI controls.

## Migration 0.5 → 0.6

| Change | What to do |
|---|---|
| **Camera is opt-in.** A default install has no camera tab and no `media-editor-capture` dependency. | `pnpm dlx shadcn@latest add @ilinxa/media-editor-capture` and pass `capture={mediaCapture}`. |
| `onPublished(story, result)` | Nothing — one-argument handlers still compile. Read server data from `result`. |
| `Uploader(blob, metadata, fields?)` | Nothing — two-argument uploaders still compile. |
| Removed renamed aliases: `ComposerEditor` / `ComposerEditorProps`, `ComposerToolbar` / `ComposerToolbarProps`, `ComposerCamera` / `ComposerCameraProps` | Use the real names: `EditorCanvas` / `EditorCanvasProps` and `EditorToolbar` / `EditorToolbarProps` from `@/components/media-editor`; `EditorCamera` / `EditorCameraProps` from `@/components/media-editor/features/capture`. |
| Removed re-exports (same name in media-editor): `ColorSwatchPicker` / `ColorSwatchPickerProps`, `resolveFilterPresets`, `BUILT_IN_FILTER_PRESETS`, `resolveStickerSets`, `BUILT_IN_STICKER_SETS`, `exportPhotoBlob`, `exportTextOnlyBlob`, `ExportPhotoOptions`, `compositeVideo`, `CompositeVideoOptions`, `CompositeVideoResult`, `selectRecorderMime`, `containerFor`, `PREFERRED_RECORDER_MIME_TYPES`, `RecorderMimeType`, `DEFAULT_TEXT_GRADIENTS`, `DEFAULT_FONTS`, `DEFAULT_COLOR_PRESETS`, `GradientPreset`, `fitCropToStage`, `ASPECT_RATIO_VALUES`, `CropRect` | Import them from `@/components/media-editor`. |
| Removed label keys `drawUndo`, `drawRedo`, `textAlign`, `trimStart`, `trimEnd` (nothing rendered them) | Use `labels.editor.text.alignLeft` / `alignCenter` / `alignRight`; drop the rest. |
| `DEFAULT_STORY_COMPOSER_LABELS` now equals the English the editor renders (`composerLabel` "Media editor", `discardConfirmTitle` "Discard?", …) — the old values never reached the screen | Set `labels.composerLabel` (e.g. "Create story") if you want a story-specific dialog title. |
| Overlay colours use `--media-overlay` / `--media-overlay-foreground`; the warning icon uses `--warning`. The overlay's Retry / Publish buttons use the default button colour. | Defaults ship with the item (`cssVars`); set the variables to theme them. |
| `Required<StoryComposerLabels>` → `ResolvedStoryComposerLabels` for the parts' `labels` prop | Only if you render `ComposerPublishBar` yourself. |

## Accessibility

- Every button has an accessible name from `labels`; Publish is `aria-busy` while uploading.
- The editor behind the progress / error / details overlay is `inert`.
- Permission states use `role="alert"`; completion is announced through `role="status"`.
- RTL: logical utilities only; the demo has an RTL example.

## Related

- [`media-editor`](../media-editor-procomp/) — the editor this wraps (labels, formats, handle)
- [`story-rail`](../story-rail-procomp/) · [`story-viewer`](../story-viewer-procomp/) · [`post-card`](../post-card-procomp/)

## Substrate decisions

See [`story-composer-procomp-description.md`](./story-composer-procomp-description.md) §"Substrate decisions" —
react-konva over Fabric.js for the official React 19 binding; XHR (not fetch) for upload progress. Konva stays with
the editor (platform-accepted 2026-10-25); only the camera / recorder is optional.
