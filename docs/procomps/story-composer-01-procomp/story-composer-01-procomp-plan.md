# story-composer-01 — procomp plan

> Stage 2: how (the implementation contract).
>
> See [`story-composer-01-procomp-description.md`](./story-composer-01-procomp-description.md) for what & why. Description signed off — all 10 Q-Ps locked to recommendations.
>
> **Third (and final) component in the story-system trilogy.** Sibling to `story-viewer-01` (consumption) + `story-rail-01` (discovery). Closes the story product surface.

## Sealed-folder file map (locked)

```
src/registry/components/media/story-composer-01/
├── story-composer-01.tsx                    # root: Dialog wrapper + state orchestration + handle + dynamic Konva import
├── parts/
│   ├── composer-shell.tsx                   # Dialog content surface (mobile-fullscreen / desktop-modal switch + safe-area)
│   ├── composer-camera.tsx                  # capture surface — camera + gallery + mode pill (EXPORTED)
│   ├── composer-editor.tsx                  # Konva Stage + layers + transformer (EXPORTED; client-only dynamic-imported)
│   ├── composer-toolbar.tsx                 # bottom edit tools (Text/Draw/Stickers/Filters/Adjust/Crop) (EXPORTED)
│   ├── composer-publish-bar.tsx             # top bar: close + publish CTA + progress overlay (EXPORTED)
│   ├── camera-permission-prompt.tsx         # denied / pending / retry states
│   ├── mode-toggle-pill.tsx                 # Photo / Video / Text segment switcher
│   ├── shutter-button.tsx                   # tap-to-toggle + long-press hold; ring progress on record
│   ├── video-trim-bar.tsx                   # two-handle range slider + frame previews
│   ├── text-only-canvas.tsx                 # text-mode capture surface (gradient bg + centered text input)
│   ├── tool-text-input.tsx                  # active-text-overlay editor (above keyboard)
│   ├── tool-draw-controls.tsx               # color + brush size + eraser toggle
│   ├── tool-sticker-picker.tsx              # bottom-sheet sticker grid
│   ├── tool-filter-strip.tsx                # horizontal preset filter scroller (pre-rendered thumbnails)
│   ├── tool-adjust-sliders.tsx              # 4 sliders panel
│   ├── tool-crop-overlay.tsx                # crop frame + aspect-ratio buttons
│   ├── color-swatch-picker.tsx              # popover color picker (EXPORTED — reused in text + draw)
│   ├── discard-confirm-dialog.tsx           # unsaved-edits confirm
│   └── publishing-progress-overlay.tsx      # XHR progress UI
├── hooks/
│   ├── use-story-composer-state.ts          # reducer + mode + capture stage transitions (EXPORTED)
│   ├── use-media-capture.ts                 # getUserMedia + MediaRecorder lifecycle (EXPORTED)
│   ├── use-image-uploader.ts                # XHR upload + progress + cancel (EXPORTED)
│   ├── use-camera-permissions.ts            # navigator.permissions.query watch + auto-retry
│   ├── use-konva-stage-size.ts              # ResizeObserver-driven Stage dimensions
│   ├── use-konva-selection.ts               # Konva.Transformer attach/detach + delete-on-trash
│   ├── use-drawing-stroke.ts                # pointer-events → Konva.Line builder (vector + eraser)
│   └── use-history.ts                       # undo/redo stack for overlays (text/sticker/draw add/remove/move)
├── lib/
│   ├── konva-filters.ts                     # preset filter chains (Clarendon / Gingham / Moon / Lark / Reyes / Juno / Slumber / Crema / Ludwig)
│   ├── composite-video.ts                   # canvas.captureStream + MediaRecorder pipeline for overlay-on-video
│   ├── export-blob.ts                       # stage.toBlob (photo) + composite-video (video) + text-only PNG export
│   ├── mime-fallback.ts                     # MediaRecorder codec preference chain
│   └── built-in-stickers.ts                 # inline base64 emoji-sticker set (~30 items)
├── types.ts                                 # all types + DEFAULT_STORY_COMPOSER_LABELS
├── dummy-data.ts                            # gradient presets + sample sticker sets + sample uploadUrl
├── demo.tsx                                 # 5 tabs (default / dark / hide-video-mode / custom-stickers / custom-uploader)
├── usage.tsx
├── meta.ts
└── index.ts
```

**Total: 39 files in the sealed folder.**
- **Base registry item** ships **35 files** (excludes `demo.tsx`, `usage.tsx`, `meta.ts`, and `dummy-data.ts` per locked target convention).
- **Fixtures registry item** ships **1 file** (`dummy-data.ts`).
- The inline-base64 sticker set is its OWN file `lib/built-in-stickers.ts` shipped in the **base** item so the default sticker set works without the fixtures install.

## Dependencies (locked)

| Surface | Source | Notes |
|---|---|---|
| `Dialog`, `DialogContent`, `DialogPortal`, `DialogOverlay` | `@/components/ui/dialog` (already installed) | Modal frame |
| `Button` | `@/components/ui/button` | All CTAs |
| `Slider` | `@/components/ui/slider` | Adjust panel + trim bar |
| `Popover`, `PopoverContent`, `PopoverTrigger` | `@/components/ui/popover` | Color picker; **see F-cross-13 — Base UI doesn't accept `asChild` on PopoverTrigger; render the trigger button directly** |
| `ToggleGroup`, `ToggleGroupItem` | `@/components/ui/toggle-group` | Mode pill + crop-aspect buttons |
| `AlertDialog` etc. | `@/components/ui/alert-dialog` | Discard-confirm modal |
| `cn` | `@/lib/utils` | Standard |
| `Stage`, `Layer`, `Image`, `Text`, `Line`, `Transformer` | `react-konva` `^19.2.4` (NEW peer dep — version-major-locked to React major; verified via `pnpm view`) | Canvas editor |
| `Konva.Filters.*`, `Konva.Image`, etc. | `konva` `^10.3.0` (NEW peer dep — react-konva v19 peer-supports `^8 \|\| ^9 \|\| ^10`; v10 is current latest, taken) | Filter primitives, image utilities |
| Lucide icons | `lucide-react` | `Camera`, `Image as ImageIcon`, `Type`, `Palette`, `Smile`, `Wand`, `Sliders`, `Crop`, `X`, `Send`, `RotateCw`, `SwitchCamera`, `Mic`, `MicOff`, `Eraser`, `Undo`, `Redo`, `Check`, `AlertTriangle` |

**2 new peer deps total:** `konva ^10.3.0` + `react-konva ^19.2.4`. Versions verified via `pnpm view` at plan-finalization time.

### F-cross-13 substrate-divergence pre-wires

Per `project_shadcn_primitive_radix_baseui_divergence.md` memory, defensively design around Base UI quirks from day one:

- **Popover** — DO NOT use `asChild` on `PopoverTrigger`; render the trigger button as a direct child with `<button>` HTML props spread. Pattern proven in engagement-bar-01 v0.3.2.
- **Slider** — Base UI slider needs explicit `min`/`max`/`step` for all 4 adjust sliders; default fallbacks insufficient.
- **AlertDialog** — same `data-state` animation classes as Dialog; verify the discard-confirm modal renders the right backdrop layer (z-index above the composer modal).
- **ToggleGroup** — `type="single"` mode for mode-pill, `value` + `onValueChange` (controlled).

## Type system (locked from description §16)

`types.ts` exports everything from description §16 plus internal-only types:

```ts
import type { ReactNode, MutableRefObject } from "react";

// ─── Modes ──────────────────────────────────────────────────────────────
export type ComposerMode = "photo" | "video" | "text";
export type ComposerStage = "capture" | "edit" | "publishing" | "done" | "error";

// ─── Media + capture ────────────────────────────────────────────────────
export interface ValidationError {
  kind: "file-too-large" | "unsupported-type" | "unsupported-codec" | "duration-exceeded" | "no-camera" | "permission-denied";
  message: string;
  file?: File;
}

// ─── Stickers + filters + edit overlays ─────────────────────────────────
export interface StickerOption { id: string; src: string; alt: string; width?: number; height?: number; }
export interface StickerSet { id: string; label: string; stickers: StickerOption[]; }

export interface FilterPreset {
  id: string;
  label: string;
  konvaFilters: KonvaFilterSpec[];
}
export interface KonvaFilterSpec {
  /** e.g. "Brighten" | "Contrast" | "HSL" | "Blur" | "Noise" | "Sepia" | "RGB" */
  name: string;
  params?: Record<string, number>;
}

export interface ImageAdjustments {
  brightness: number; contrast: number; saturation: number; blur: number;
}
export const DEFAULT_ADJUSTMENTS: ImageAdjustments = { brightness: 0, contrast: 0, saturation: 0, blur: 0 };

export interface TextOverlay {
  id: string; text: string;
  x: number; y: number; rotation: number; scale: number;
  fontFamily: string; fontSize: number; fill: string;
  align: "left" | "center" | "right";
}
export interface PlacedSticker {
  id: string; stickerId: string;
  x: number; y: number; rotation: number; scale: number;
}
export interface DrawingStroke {
  id: string;
  points: number[];          // [x0, y0, x1, y1, ...] flat for Konva.Line
  color: string;
  brushSize: number;
  mode: "draw" | "erase";    // erase = globalCompositeOperation: "destination-out"
}

// ─── Fonts ──────────────────────────────────────────────────────────────
export interface FontOption { id: string; label: string; family: string; }

// ─── Aspect ratios ──────────────────────────────────────────────────────
export type AspectRatio = "9:16" | "1:1" | "4:5" | "free";

// ─── Tools enabled flag ─────────────────────────────────────────────────
export type EditTool = "text" | "draw" | "stickers" | "filters" | "adjust" | "crop";

// ─── Publish ────────────────────────────────────────────────────────────
export interface PublishMetadata {
  mode: ComposerMode;
  width: number; height: number;
  durationMs?: number;
  mimeType: string;
  textOverlays: TextOverlay[];
  stickers: PlacedSticker[];
  drawingStrokes: number;
  appliedFilter?: string;
  adjustments: ImageAdjustments;
}
export interface PublishResult { url: string; thumbnailUrl?: string; [key: string]: unknown; }

export interface PublishedStoryItem {
  id: string; type: "image" | "video"; src: string; duration?: number; thumbnailUrl?: string;
}
export interface PublishedStory {
  id: string; createdAt: string;
  items: PublishedStoryItem[];
}

// ─── Context for slot render props ──────────────────────────────────────
export interface ComposerCtx {
  mode: ComposerMode; stage: ComposerStage;
  isDirty: boolean;
  publishing: { active: boolean; progress: number };
  setMode: (m: ComposerMode) => void;
  cancel: () => void;
  publish: () => Promise<void>;
}

// ─── i18n ───────────────────────────────────────────────────────────────
export interface StoryComposer01Labels {
  composerLabel?: string;
  modePhoto?: string; modeVideo?: string; modeText?: string;
  shutterPhoto?: string; shutterVideoStart?: string; shutterVideoStop?: string;
  galleryPicker?: string; switchCamera?: string;
  permissionDeniedTitle?: string; permissionDeniedBody?: string;
  permissionRetry?: string; permissionUsePicker?: string;
  toolText?: string; toolDraw?: string; toolStickers?: string; toolFilters?: string; toolAdjust?: string; toolCrop?: string;
  adjustBrightness?: string; adjustContrast?: string; adjustSaturation?: string; adjustBlur?: string;
  drawColor?: string; drawBrush?: string; drawEraser?: string;
  publish?: string; publishing?: string; published?: string;
  discardConfirmTitle?: string; discardConfirmBody?: string; discardConfirm?: string; discardCancel?: string;
  uploadFailedTitle?: string; uploadRetry?: string;
  recordingLabel?: string;
}
export const DEFAULT_STORY_COMPOSER_LABELS: Required<StoryComposer01Labels> = { /* ~30 keys; English defaults */ };
```

## Props surface (locked from description §8)

Already sketched in description §8. The plan deltas vs the description:

- Add `recordAudio?: boolean` (default `true`) — locked per F-06 fix.
- Add `confirmOnDiscard?: boolean` (default `true`) — locked per Q-P10.
- Add `editorBackground?: string` (default `"#000"`) — Konva Stage canvas background.
- All other props as per description §8.

## Imperative handle

Per description §9 — unchanged. Plus internal-only refs the handle does NOT expose: `stageRef`, `transformerRef`, `videoRef`, `mediaRecorderRef`, `xhrRef`.

## Implementation order (commit chain)

15 commits (C1 → C15) following the `7b453a3..e10ef5c`-style chain. Each commit is independently verifiable (tsc + lint + `validate:meta-deps` clean) and pushable. `meta.ts` deps are updated progressively as each commit's imports land — not deferred to C13.

| # | Commit | Lands |
|---|---|---|
| **C1** | `chore(story-composer-01): scaffold + add peer deps` | `pnpm new:component media/story-composer-01`. `pnpm add konva react-konva` (exact versions via `pnpm view`). Empty `types.ts` + skeleton `story-composer-01.tsx` that throws. Manifest entry. Empty meta deps. tsc clean. |
| **C2** | `feat(story-composer-01): types + labels + DEFAULT_ADJUSTMENTS` | Full `types.ts` from plan above. `DEFAULT_STORY_COMPOSER_LABELS` populated. No runtime code yet. |
| **C3** | `feat(story-composer-01): Dialog shell + state machine + responsive layout + mode pill` | `composer-shell.tsx` (mobile-fullscreen / desktop-400x711-modal), `mode-toggle-pill.tsx`, **`use-story-composer-state.ts`** (the main reducer driving stage transitions `capture → edit → publishing → done/error` + mode + dirty-flag). Imperative handle skeleton via `React.forwardRef` + `useImperativeHandle` — handle methods are stub-throws to start, filled in by their backing-feature commit. Stage = "capture" only; renders mode-toggle + empty surfaces. Demo: shows the empty shell. No camera yet. |
| **C4** | `feat(story-composer-01): camera capture + permissions + gallery pick` | `use-media-capture.ts` + `use-camera-permissions.ts` + `composer-camera.tsx` + `camera-permission-prompt.tsx` + `shutter-button.tsx`. Photo capture working end-to-end (camera → snap → blob → log to console). Gallery picker working. permissions.query watch wired. Audio capture flag wired but only matters in C5. |
| **C5** | `feat(story-composer-01): video record + trim` | MediaRecorder pipeline in `use-media-capture.ts`. Both shutter behaviors (long-press + tap-to-toggle). `video-trim-bar.tsx`. `mime-fallback.ts`. Recording works; trim UI works on captured blob. |
| **C6** | `feat(story-composer-01): Konva editor canvas + SSR-safe dynamic import` | `composer-editor.tsx` + `use-konva-stage-size.ts` + `use-konva-selection.ts`. Stage with 5 layers wired. Image layer renders captured photo. `dynamic(... { ssr: false })` boundary at the import site. Demo: photo capture transitions to editor showing the photo. |
| **C7** | `feat(story-composer-01): adjust sliders + filter presets + thumbnails` | `tool-adjust-sliders.tsx` + `tool-filter-strip.tsx` + `lib/konva-filters.ts`. 4 sliders live-applied via `node.cache()` + `node.filters()`. 10 filter presets (Original + 9 Instagram-style). Pre-rendered thumbnails on edit-mode entry (Q-P7 (a)). |
| **C8** | `feat(story-composer-01): text overlay tool` | `tool-text-input.tsx` + text-layer rendering in editor. New text overlay center-stage with selection handles. Font + color + size + align controls. Color picker via `color-swatch-picker.tsx` (popover + 12 swatches + hex input). |
| **C9** | `feat(story-composer-01): sticker tool + built-in emoji set` | `tool-sticker-picker.tsx` + `lib/built-in-stickers.ts` (inline base64 ~30 items, Q-P9 (a)). Consumer-supplied `stickers: StickerSet[]` merged with built-in unless `replaceBuiltinStickers`. |
| **C10** | `feat(story-composer-01): drawing tool + eraser + history + retro-wire undo for text/sticker overlays` | `tool-draw-controls.tsx` + `use-drawing-stroke.ts` + `use-history.ts`. Vector polylines via Konva.Line. Eraser via `globalCompositeOperation: "destination-out"`. **Undo/redo lands here as a generic command stack and is retro-wired into C8 (text add/move/edit/delete) and C9 (sticker add/move/scale/delete)** — those commits land their state writes as commands from day one to avoid a refactor; C10 just adds the stack + Ctrl+Z/Ctrl+Shift+Z bindings on top. |
| **C11** | `feat(story-composer-01): crop tool` | `tool-crop-overlay.tsx`. 3 aspect ratios (9:16, 1:1, 4:5) per Q-P4 (b). **Crop is a viewport-export concern, not a Stage-resize**: Stage dimensions stay constant; the crop rect is a transformer-handles overlay within the Stage; on export, only pixels inside the crop rect are written to the final blob. Overlays don't get repositioned — they keep their stage coordinates; anything outside the crop rect is clipped on export. |
| **C12** | `feat(story-composer-01): publish flow + uploader + composite export` | `composer-publish-bar.tsx` + `publishing-progress-overlay.tsx` + `discard-confirm-dialog.tsx` + `use-image-uploader.ts` + `lib/export-blob.ts` + `lib/composite-video.ts`. `stage.toBlob()` for photo. `canvas.captureStream(30)` + MediaRecorder for overlay-on-video bake (Q-P1 (a)). XHR POST FormData (Q-P6 (a)) + `uploader` escape hatch. `confirmOnDiscard` guard. Success state → `onPublished(story)` → auto-close. |
| **C13** | `feat(story-composer-01): text-only mode + final demo + a11y polish + guide + meta` | `text-only-canvas.tsx` with 8 gradient presets. PNG export for text-mode. Demo 5 tabs (default / hide-video / custom-stickers / custom-uploader / dark). Live-region edit-event announcer. `meta.ts` finalized (version `0.1.0` + status `alpha` + deps audited). Author `story-composer-01-procomp-guide.md` (consumer-facing usage notes — the third planning doc required per CLAUDE.md workflow). |
| **C14** | `chore(story-composer-01): registry.json + smoke harness` | Add base + fixtures items to `registry.json`. `pnpm registry:build` clean. **Manual audit** per `project_registry_roster_manual_audit_pattern.md`: diff sealed-folder vs `registry.json files[]`. Run smoke harness (path-b consumer-tsc). |
| **C15** | `feat(story-composer-01): readiness review v0.1.0` | Author `reviews/2026-MM-DD-v0.1.0-spotcheck.md` (AI-assisted, GATE 3 since procomp). Fixed-core 4 dims + rotating dim = **performance** (Konva caching + filter chain + canvas.captureStream + XHR). Findings → patches as needed. Pass-with-follow-ups minimum. |

**Estimated commit budget:** 15 commits (12 feat + 1 chore-scaffold + 1 chore-registry + 1 feat-review). Final on-disk file count: 39. Final registry roster: 35 base + 1 fixtures = 36.

## Risks + mitigations

| Risk | Mitigation |
|---|---|
| **react-konva + Next.js 16 RSC crash** — Konva touches `window` at import time | `dynamic(() => import("./parts/composer-editor"), { ssr: false })` at the import site in `story-composer-01.tsx`. Verified pattern. |
| **Konva canvas perf with full-screen image + 5 layers + filter chain** | Use `node.cache()` ONLY on the image node (filters applied). Other layers stay uncached. Throttle slider `onChange` to `requestAnimationFrame`. |
| **MediaRecorder codec mismatch across browsers** — Safari iOS doesn't ship VP9 | `mime-fallback.ts` chain: `video/webm;codecs=vp9` → `video/webm;codecs=vp8` → `video/mp4` → throw `ValidationError("unsupported-codec")`. |
| **Composited-video MediaRecorder produces silent track when source video had audio** | `canvas.captureStream(30)` is video-only; mix in the audio track from the original MediaStream via `MediaStream.addTrack(audioTrack)` before passing to the new MediaRecorder. If `recordAudio: false`, skip the audio-track add (the source has no audio track to mix). |
| **XHR upload progress fires inconsistently for tiny blobs** | Progress UI shows determinate bar only when `event.lengthComputable` is true; falls back to indeterminate animation otherwise. |
| **iOS Safari blocks `getUserMedia` on non-HTTPS** | Dev demo page must use HTTPS or `localhost` (already true for `pnpm dev`). Document in guide. |
| **iOS Safari `100dvh` reflow on URL-bar collapse** | Use `100dvh` + safe-area-inset; verified in story-viewer-01 v0.4.1. |
| **inline base64 sticker bundle bloat** | Use 256×256 PNGs through `pngquant`-level compression target; aim for ~3-4KB each, ~30 stickers = ~100KB total. If it bloats > 200KB at C9, fall back to Q-P9 (b) (separate PNG files via `registry:file`). |
| **F-cross-13 Popover/Select/Slider divergence between Radix and Base UI** | All 4 surfaces defensively wired per memory + engagement-bar-01 v0.3.2 fixes. Test in smoke harness post-install. |
| **Konva.Transformer interferes with drawing pointer events** | Drawing layer captures `pointermove` BEFORE Konva.Transformer; `tool-draw-controls.tsx` detaches the Transformer when draw mode is active. |
| **Undo/redo memory bloat for many drawings** | Cap history at 50 entries; oldest entries evicted FIFO. |

## Verification gates per commit

Every commit must pass before push:
1. `pnpm tsc --noEmit` clean
2. `pnpm lint` clean
3. `pnpm validate:meta-deps` clean (drift caught at C1 if peer deps not declared)
4. `pnpm build` clean (catches RSC + dynamic-import boundary regressions)
5. `pnpm registry:build` clean (C14 onwards)
6. Docs page `/components/story-composer-01` returns 200 (after C3 onwards)
7. **Browser-test** the documented patterns:
   - C4: photo capture → snap → editor transition (Chrome desktop + Chrome Android)
   - C5: video record (both shutter behaviors) + trim (all 3 mobile browsers)
   - C7: filter live-preview + slider responsiveness (no frame drops)
   - C8-C10: text + sticker + drawing add/move/resize/delete
   - C12: publish → uploadUrl POST → success / failure paths
   - C13: text-only mode publish → PNG output

## GATE 3 readiness review

Per `.claude/rules/readiness-review.md`:
- Spotcheck template — **5 dims:** 4 shared + 1 rotating = **performance** (justified: Konva multi-layer + filter chains + canvas.captureStream + XHR-upload are all perf-sensitive substrates; never combined in any prior procomp).
- AI-assisted review per `feedback_audit_systematic_scope_before_committing.md` + procomp-tier reviewer policy (self OR AI-assisted at v0.1.0).
- Mandatory smoke harness: path-b consumer-tsc clean post-install at `e:/tmp/ilinxa-smoke-consumer/`.
- Expected sub-Blocker findings: F-cross-13 Popover/Slider/AlertDialog tweaks (defensively pre-wired, but live smoke may surface edge cases).

## Workflow gates

- GATE 1 — description ✅ signed off (Q-Ps locked to recommendations)
- GATE 2 — this plan ✋ awaiting sign-off
- GATE 3 — readiness review at C15

## Migration origin

None. Greenfield.
