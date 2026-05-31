# story-composer-01 — consumer guide

> v0.1.0 alpha. Third (and final) component in the story-system trilogy:
> [`story-rail-01`](../story-rail-01-procomp/) (discovery), [`story-viewer-01`](../story-viewer-01-procomp/) (consumption),
> **`story-composer-01`** (creation). Builds on `react-konva` v19 + `konva` v10. Camera-first.

## Install

```bash
pnpm dlx shadcn@latest add @ilinxa/story-composer-01
```

Adds: 35 source files, 2 peer deps (`konva ^10.3.0` + `react-konva ^19.2.4`), 6 shadcn primitives (`alert-dialog`, `button`, `dialog`, `popover`, `slider`, `toggle-group`).

Optional fixtures item (`@ilinxa/story-composer-01-fixtures`) ships sample dummy data for demos.

## Quick start

```tsx
import { useState } from "react";
import { StoryComposer01 } from "@/components/story-composer-01";

export function CreateStoryButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button onClick={() => setOpen(true)}>Create story</button>
      <StoryComposer01
        isOpen={open}
        onClose={() => setOpen(false)}
        uploadUrl="/api/stories"
        onPublished={(story) => {
          console.log("published:", story);
          setOpen(false);
        }}
      />
    </>
  );
}
```

## Capture modes

| Mode | Behavior |
|---|---|
| **`photo`** (default) | Tap shutter → snap → editor with all 6 tools |
| **`video`** | Long-press hold OR tap-to-toggle. Auto-stop at `maxVideoDuration` (default 30s). Trim UI in edit stage. Overlays bake into final video on publish (Q-P1a). |
| **`text`** | 8 gradient backgrounds + centered text + font + color picker. PNG output on publish. |

Hide modes via `hideModes={["video", "text"]}`. Change default via `defaultMode="text"`.

## Edit tools (all enabled by default)

| Tool | Behavior |
|---|---|
| **Text** | Draggable, rotatable, scaleable text overlays. Font / size / color / align. Multiple overlays per story. |
| **Draw** | Vector freehand strokes (Konva.Line) with eraser (composite-out). Color + brush size (1-60px). |
| **Stickers** | 36 built-in emoji stickers + your own via `stickers={[…]}`. Draggable, rotatable, scaleable. |
| **Filters** | 10 presets (Clarendon / Gingham / Moon / Lark / Reyes / Juno / Slumber / Crema / Ludwig + Original). Pre-rendered thumbnails on edit-mode entry. |
| **Adjust** | Brightness / Contrast / Saturation / Blur sliders. Applied via Konva's filter chain on top of any preset. |
| **Crop** | 3 aspect ratios (9:16, 1:1, 4:5). Crop is a viewport-export concern — overlays stay where they are; pixels outside the rect get clipped on publish. |

Disable any subset via `enabledTools={["text","filters","adjust"]}`.

Undo/redo on every overlay command + every drawing stroke. Ctrl/Cmd+Z, Ctrl/Cmd+Shift+Z. 50-deep stack, FIFO past cap.

## Publish

Pick one:

**Default POST FormData** — composer uploads to your endpoint as multipart with `file` + `metadata` JSON fields:

```tsx
<StoryComposer01
  uploadUrl="/api/stories"
  uploadFields={{ csrfToken: token }} // extra fields appended
  onPublished={(story) => /* story.items[0].src = uploaded URL */}
/>
```

**Custom uploader** — for S3 pre-signed PUT, Cloudinary direct upload, Mux, etc.:

```tsx
<StoryComposer01
  uploader={async (blob, metadata) => {
    const presigned = await fetch("/api/presign").then(r => r.json());
    await fetch(presigned.uploadUrl, { method: "PUT", body: blob });
    return { url: presigned.publicUrl, thumbnailUrl: presigned.thumbUrl };
  }}
  onPublished={(story) => /* … */}
/>
```

The custom uploader takes precedence over `uploadUrl` if both are passed.

## Responsive

- **Mobile** (`< md`): full-screen, edge-to-edge, safe-area-aware (notch + bottom home bar).
- **Desktop** (`≥ md`): centered 400×711 modal (true 9:16 portrait).
- Override via `presentation="fullscreen" | "modal" | "auto"`.

## Permissions

- Camera permission is requested on open (via `getUserMedia`).
- Video mode also requests microphone (set `recordAudio={false}` to skip).
- Denied state shows a retry + "use gallery instead" fallback.
- **Auto-retry** on settings change via `navigator.permissions.query` watch (Chrome/Firefox/Edge). Safari falls back to manual retry.
- Fires `onPermissionDenied` once per denial cycle for consumer-side UX (analytics, help banner, etc.).

**Requires HTTPS** (or `localhost`). `getUserMedia` rejects on non-secure origins.

## Customization

| Prop | Default | What it changes |
|---|---|---|
| `defaultFacing` | `"environment"` on touch UAs, `"user"` elsewhere | Initial camera facing |
| `maxVideoDuration` | `30` | Max recording length in seconds |
| `maxFileSizeMb` | `50` | Gallery pick size limit; rejected with `onValidationError` |
| `fonts` | 8 (Onest + JetBrains Mono + 6 web-safe) | Text-tool font list |
| `colorPresets` | 12 brand-friendly | Color picker swatches |
| `filterPresets` | 10 built-in | Add or replace (via `replaceBuiltinFilters: true`) |
| `stickers` | 36 built-in (4 categories) | Add or replace (via `replaceBuiltinStickers: true`) |
| `cropAspects` | `["9:16","1:1","4:5"]` | Crop ratio buttons |
| `editorBackground` | `"#000"` | Canvas surface background |
| `confirmOnDiscard` | `true` | Q-P10a — confirm before discarding dirty edits |
| `presentation` | `"auto"` | `"fullscreen"` / `"modal"` / `"auto"` |
| `labels` | 45 keys (English) | i18n + copy customization |

## Slot extension points

Five sealed-folder parts exported for consumers who want to compose their own shell:

```tsx
import {
  ComposerCamera,
  ComposerEditor,
  ComposerToolbar,
  ComposerPublishBar,
  ColorSwatchPicker,
} from "@/components/story-composer-01";
```

Plus three exported hooks:

```tsx
import {
  useStoryComposerState,
  useMediaCapture,
  useImageUploader,
} from "@/components/story-composer-01";
```

## Imperative handle

```tsx
const composerRef = useRef<StoryComposer01Handle>(null);

// 15 methods total:
composerRef.current.open();
composerRef.current.close();
composerRef.current.reset();
composerRef.current.switchCamera();
composerRef.current.takePhoto();
composerRef.current.startRecording();
composerRef.current.stopRecording();
composerRef.current.importFromGallery();
composerRef.current.addText("Hello!");
composerRef.current.addSticker(stickerOption);
composerRef.current.setAdjustments({ brightness: 0.2 });
composerRef.current.applyFilter("clarendon");
composerRef.current.publish();
composerRef.current.exportBlob();
```

## Accessibility

- Keyboard: Tab through controls; Ctrl/Cmd+Z + Ctrl/Cmd+Shift+Z for undo/redo (ignored while typing in inputs).
- Live-region announcer surfaces "Text added", "Sticker added: X", etc. since the Konva canvas itself is opaque to screen readers.
- All buttons have `aria-label`; toggles use `aria-pressed`; publish button is `aria-busy` during upload.
- Color pickers are keyboard-navigable.
- Permission-denied state uses `role="alert"` + `aria-live="polite"`.

## Browser support

| Browser | Camera | Video record | Composite export |
|---|---|---|---|
| Chrome desktop / Android | ✅ | ✅ VP9 → VP8 | ✅ |
| Safari iOS / macOS | ✅ | ✅ MP4 H.264 | ✅ (audio mix best-effort) |
| Firefox | ✅ | ✅ VP8 | ✅ |
| Edge | ✅ | ✅ VP9 → VP8 | ✅ |

`navigator.permissions.query({name:"camera"})` works in Chrome/Firefox/Edge; Safari falls back to direct `getUserMedia` probing.

## Not in v0.1 (deferred)

- AR face filters / face tracking (would need MediaPipe / TF.js)
- Music overlay (audio mixing + licensing UI)
- Polls / quizzes / question stickers (interactive sticker types)
- GIF stickers
- Boomerang / slow-mo / hyperlapse
- Multi-segment stories (one capture per publish in v0.1; multi-segment v0.2)
- Draft persistence (IndexedDB save/restore)
- "Free" crop aspect (only ratio-locked in v0.1)

## Related

- [`story-rail-01`](../story-rail-01-procomp/) — discovery surface (horizontal user rail)
- [`story-viewer-01`](../story-viewer-01-procomp/) — consumption surface (full-screen modal with cube transitions)
- [`post-card-01`](../post-card-01-procomp/) — companion feed card

## Substrate decisions

See [`story-composer-01-procomp-description.md`](./story-composer-01-procomp-description.md) §"Substrate decisions" for the full rationale — chiefly: react-konva chosen over Fabric.js for the official React-19 binding; SVG-data-URL stickers chosen over PNG-base64 for bundle weight; XHR (not fetch) for upload because of progress events; React.lazy (not next/dynamic) for the SSR boundary.
