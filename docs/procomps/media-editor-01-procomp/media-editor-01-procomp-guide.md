# media-editor-01 — consumer guide

> v0.1.0 alpha. The reusable capture + edit surface lifted out of
> [`story-composer-01`](../story-composer-01-procomp/) v0.1.5. Four
> controllable capability dials let you pull as little or as much editor
> surface as your context needs. `story-composer-01` v0.2.0 becomes a thin
> wrapper around this; `content-composer-01`, `chat-panel`, and CMS hero
> editors are downstream consumers.
>
> Initial draft authored at C15 (Phase A close). Subject to refinement
> through Phase B (story-composer-01 v0.2.0 wrapper refactor) and the
> GATE 3 review at C20.

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
| `["photo", "video", "text"]` (default) | Mode pill shown; all modes selectable |
| Two values, e.g. `["photo", "video"]` | Mode pill shown; only listed modes selectable |
| One value, e.g. `["photo"]` | Mode pill **hidden** (no ambiguity to resolve) |
| `[]` | Capture surface gone. Pair with `initialSource`, or the empty-state footgun guard fires |

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

Desktop dialog dimensions by aspect:

| Aspect | Dimensions |
|---|---|
| `9:16` | 400 × 711 (true 9:16) |
| `1:1` | 600 × 600 |
| `16:9` | 800 × 450 |
| `4:5` | 500 × 625 |
| `free` | 800 × 600 |

Mobile breakpoint always fullscreen (`h-[100dvh] w-screen !rounded-none`). Use `presentation="inline"` if you need custom sizing — own the wrapper yourself.

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
| Capture | `switchCamera`, `takePhoto`, `startRecording`, `stopRecording`, `importFromGallery` |
| Edit | `addText`, `addSticker`, `setAdjustments`, `applyFilter`, `clearLayer`, `undo`, `redo` |
| Export | `exportImage`, `exportVideo`, `export` |
| Lifecycle | `reset`, `open`, `close` |

`getState()` returns a serializable `MediaEditorState` snapshot for draft persistence; `loadState()` restores it.

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
- `data-stage` — `capture` / `edit` / `publishing` / `done` / `error`
- `data-presentation` — `inline` / `dialog`
- `data-aspect` — `9:16` / `1:1` / `16:9` / `4:5` / `free`

Inside, the canvas wrapper always carries `data-canvas-placeholder=""` (regardless of state) and `data-stage`. The empty-state branch additionally carries `data-empty-config=""`.

## More

- Full prop reference: see [types.ts](../../../src/registry/components/media/media-editor-01/types.ts).
- Architecture / Q-P locks / why the four dials look the way they do: see [`media-editor-01-procomp-description.md`](./media-editor-01-procomp-description.md).
- Commit chain + implementation notes: see [`media-editor-01-procomp-plan.md`](./media-editor-01-procomp-plan.md).
- Extraction lessons (Phase A): see the decision file at `.claude/decisions/2026-06-02-media-editor-01-extraction-c1-c8-phase-a-half.md`.

## Known gaps (v0.1.0 alpha)

The shipped surface stops at the capability + state machine + export contract. Some leaves are still wired as stubs that warn in dev:

- Capture surface UI (camera viewfinder, dropzone, shutter) — placeholder text until C12+ of Phase B / a v0.1.x patch.
- Tool panels (sticker picker, color swatch, adjust sliders, text input, draw controls, filter strip) — exported via the barrel but not composed into the root toolbar yet.
- Undo / redo — handle methods exist but are stubs.

These don't block consumer-side type-correct use of the public API surface; they affect what shows up visually. The Phase B story-composer-01 v0.2.0 wrapper exercises the full edit pipeline, which is the integration smoke for these leaves landing.
