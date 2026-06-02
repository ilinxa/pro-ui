# media-editor-01 — procomp plan

> Stage 2: how (the implementation contract).
>
> See [`media-editor-01-procomp-description.md`](./media-editor-01-procomp-description.md) for what & why. **GATE 1 CLOSED 2026-06-02** — all 5 Q-Ps locked to recommendations (`aspect="free"`, `enabledModes=["photo","video","text"]`, `format="image/jpeg" q=0.9`, CORS-fires-onInitialSourceError, multi-instance dev-warn).
>
> **Extraction from `story-composer-01` v0.1.5** (tip `849c577`). Not greenfield. Story-composer-01 simultaneously refactors to consume this extraction as **v0.2.0** in the same release (non-breaking, public API preserved). This plan covers BOTH the extraction (Phase A) AND the wrapper refactor (Phase B) AND the close (Phase C).

## Sealed-folder file map (LOCKED)

```
src/registry/components/media/media-editor-01/
├── media-editor-01.tsx                      # root: black-box orchestrator + ref handle + dialog/inline switch + dynamic Konva import
├── parts/
│   ├── editor-camera.tsx                    # (EXPORTED via barrel) capture surface — camera + gallery + mode pill [renamed from composer-camera; v0.1.5 symbol ComposerCamera aliased in story-composer-01 v0.2.0 barrel]
│   ├── editor-canvas.tsx                    # (EXPORTED via barrel) Konva Stage + layers + transformer; client-only dynamic-imported [renamed from composer-editor; aliased]
│   ├── editor-toolbar.tsx                   # (EXPORTED via barrel) bottom edit tools [renamed from composer-toolbar; aliased]
│   ├── color-swatch-picker.tsx              # (EXPORTED via barrel) popover color picker [F-cross-13 surface — Base UI Popover defensive wiring]
│   ├── discard-confirm-dialog.tsx           # (EXPORTED via barrel) unsaved-edits confirm [F-cross-13 surface — verify substrate]
│   ├── camera-permission-prompt.tsx         # (INTERNAL) denied / pending / retry states
│   ├── mode-toggle-pill.tsx                 # (INTERNAL) Photo / Video / Text segment switcher (hides if enabledModes < 2)
│   ├── shutter-button.tsx                   # (INTERNAL) tap-to-toggle + long-press hold
│   ├── video-trim-bar.tsx                   # (INTERNAL) two-handle range slider + frame previews
│   ├── text-only-canvas.tsx                 # (INTERNAL) text-mode capture surface
│   ├── tool-text-input.tsx                  # (INTERNAL) active-text-overlay editor
│   ├── tool-draw-controls.tsx               # (INTERNAL) color + brush size + eraser
│   ├── tool-sticker-picker.tsx              # (INTERNAL) bottom-sheet sticker grid
│   ├── tool-filter-strip.tsx                # (INTERNAL) horizontal preset filter scroller
│   ├── tool-adjust-sliders.tsx              # (INTERNAL) 4 sliders panel
│   └── tool-crop-overlay.tsx                # (INTERNAL) crop frame + aspect-ratio buttons (interacts with parent `aspect` prop)
├── hooks/
│   ├── use-media-editor-state.ts            # NEW (written from scratch in C6, NOT a move) — reducer + mode + stage transitions + dirty flag (EXPORTED via barrel)
│   ├── use-media-capture.ts                 # getUserMedia + MediaRecorder lifecycle (EXPORTED via barrel)
│   ├── use-camera-permissions.ts            # navigator.permissions.query watch (INTERNAL)
│   ├── use-konva-stage-size.ts              # ResizeObserver-driven Stage dimensions (INTERNAL)
│   ├── use-konva-selection.ts               # Konva.Transformer attach/detach (INTERNAL)
│   ├── use-drawing-stroke.ts                # pointer-events → Konva.Line builder (INTERNAL)
│   ├── use-history.ts                       # undo/redo stack (INTERNAL)
│   ├── use-pan-zoom.ts                      # pan + pinch-zoom (INTERNAL)
│   └── use-multi-instance-guard.ts          # NEW (written in C11) — module-level counter + dev-warn for 2+ capture-enabled mounts (Q-P5) (INTERNAL)
├── lib/
│   ├── konva-filters.ts                     # 10 preset filter chains
│   ├── composite-video.ts                   # canvas.captureStream + MediaRecorder pipeline (+ perf-shortcut skip path)
│   ├── export-blob.ts                       # stage.toBlob (photo) + composite-video (video) + text-only PNG export + format dispatch
│   ├── mime-fallback.ts                     # MediaRecorder codec preference chain
│   ├── built-in-stickers.ts                 # inline base64 36 emoji-sticker set
│   ├── defaults.ts                          # NEW — editor defaults (color presets, font list, filter list, gradient presets, DEFAULT_ADJUSTMENTS, DEFAULT_LABELS) [split from story-composer/lib/defaults.ts]
│   ├── dialog-size-for-aspect.ts            # NEW — aspect → {width,height} derivation per description §6
│   ├── initial-source-loader.ts             # NEW — InitialSource → MediaEditorState resolver (URL fetch + CORS error + File.type detection + validation)
│   └── presentation-resolver.ts             # NEW — "auto" → "inline" | "dialog" resolution per description §6
├── types.ts                                 # editor-shaped types + ExportImageOpts/ExportVideoOpts/ExportOpts + InitialSource + MediaEditor01Props + MediaEditor01Handle + MediaEditor01Labels + EditorCtx + SourceError
├── dummy-data.ts                            # sample initial sources + sample sticker sets + sample filter presets
├── demo.tsx                                 # 5 tabs: defaults / news-hero-config / chat-config / edit-only / dark
├── usage.tsx                                # consumer-facing usage notes (docs site)
├── meta.ts                                  # version 0.1.0 + status alpha + deps audited
└── index.ts                                 # barrel exports
```

**Final on-disk file count**: 33 files (1 root + 16 parts + 9 hooks + 9 lib + types.ts + dummy-data.ts + demo.tsx + usage.tsx + meta.ts + index.ts; demo + usage + meta NOT shipped via registry).

**Final registry roster**: 30 base files (`registry:component`) + 1 fixtures (`dummy-data.ts`) = 31 distributed artifacts. demo/usage/meta excluded per locked convention.

## Dependencies (LOCKED)

### Peer deps (inherited from story-composer-01 v0.1.5 — no change)

| Package | Version constraint | Why |
|---|---|---|
| `konva` | `^10.3.0` | Canvas engine; built-in filters/layers/Transformer. Verified at C1 against project root `package.json`. |
| `react-konva` | `^19.2.4` | Official React bindings; React-19-compatible by version-major-match. Verified at C1. |

C1 verification result: `package.json` shows `konva ^10.3.0` and `react-konva ^19.2.4`. Story-composer-01 v0.1.5's meta.ts had `konva ^9.3` historically but the project root resolved it forward to v10 during the v0.1.5 ship (per `validate:meta-deps` clean status at tip `849c577`). media-editor-01 v0.1.0 locks v10 explicitly.

### Internal deps

`@/components/ui/dialog`, `@/components/ui/slider`, `@/components/ui/popover`, `@/components/ui/button`, `@/components/ui/input`, `@/components/ui/select`, `@/lib/utils` (already in story-composer-01's deps; carries forward).

### Cross-procomp dependency wiring (FIRST inter-procomp runtime dep in this library)

story-composer-01 v0.2.0 is the first procomp in ilinxa-ui-pro that depends on another procomp at runtime. The CLAUDE.md import allowlist (`react`, `@/components/ui/*`, `@/lib/utils`, peer deps) is silent on cross-procomp imports — this plan locks the convention.

**Import path convention — relative `../<slug>`**:

```ts
// story-composer-01/story-composer-01.tsx
import { MediaEditor01, type MediaEditor01Handle } from "../media-editor-01";
```

NOT `@/registry/components/media/media-editor-01` (dev-only path; breaks post-install) and NOT `@/components/media-editor-01` (post-install path; doesn't resolve in dev).

**Why relative works in BOTH environments**:
- Dev: from `src/registry/components/media/story-composer-01/story-composer-01.tsx`, `../media-editor-01` resolves to `src/registry/components/media/media-editor-01/` — sibling under the same category folder.
- Post-install: shadcn flattens both procomps to `components/story-composer-01/` and `components/media-editor-01/` (locked target convention `components/<slug>/<sub-path>`). From the installed `components/story-composer-01/story-composer-01.tsx`, `../media-editor-01` resolves to `components/media-editor-01/` — identical relative shape.

**Pre-condition**: both procomps must live in the same category folder (`media/`) during dev. ✅ already true.

**Distribution wiring — `registryDependencies` field**:

`registry.json`'s shadcn convention for cross-item deps is `registryDependencies` (NOT `dependencies` — that field is for NPM peer deps).

```jsonc
// registry.json — story-composer-01 entry (v0.2.0)
{
  "name": "story-composer-01",
  "type": "registry:component",
  "title": "Story Composer 01",
  "description": "...",
  "dependencies": ["konva@^9.3.0", "react-konva@^19.0.0"],
  "registryDependencies": [
    "https://ilinxa-proui.vercel.app/r/media-editor-01.json"
  ],
  "files": [ /* ... */ ]
}
```

When a consumer runs `pnpm dlx shadcn add @ilinxa/story-composer-01`, shadcn:
1. Reads story-composer-01.json
2. Sees `registryDependencies` → resolves + installs media-editor-01.json FIRST
3. Then installs story-composer-01 files; relative imports `../media-editor-01` resolve to the just-installed sibling.

**Verification (C19 + C22)**:
- C19: `pnpm registry:build` succeeds with both items + cross-dep wired.
- C22 smoke: `pnpm dlx shadcn@4.6.0 add @ilinxa/story-composer-01` in a fresh tmp consumer pulls media-editor-01 transitively; consumer-side `pnpm tsc --noEmit` clean (proves relative imports resolve post-install).

This convention applies to any future inter-procomp dep. **Convention name**: "sibling-category relative import + registryDependencies". Should be added to `.claude/CLAUDE.md` Gotchas + `docs/component-guide.md` after this extraction lands.

### F-cross-13 substrate verification (C1 task)

Before any code, verify the actual substrate of each shadcn primitive used:

```bash
# C1 verification step (mandatory before C6)
grep -E "from \"@(radix-ui|base-ui-components)" src/components/ui/dialog.tsx src/components/ui/slider.tsx src/components/ui/popover.tsx
```

**C1 verification result (2026-06-02)**: ALL THREE primitives import from the unified `radix-ui` package (`^1.4.3`); `@base-ui-components/react` is NOT in `package.json`. `popover.tsx` exports `PopoverAnchor`; `dialog.tsx` and `popover.tsx` both support `asChild` on their triggers (each appears 2× in the file).

**F-cross-13 risk reassessment for media-editor-01**: significantly LOWER than initially planned. The primitives behave per Radix conventions. The defensive patterns from engagement-bar-01 v0.3.0 sub-trap arc (no `PopoverAnchor`, no `asChild`, `queueMicrotask` override) were responses to a Base-UI-shaped Popover that has since been reverted/replaced in the project's primitive layer. **For media-editor-01 v0.1.0**: use Popover/Dialog with standard Radix patterns (PopoverAnchor + asChild OK). C12 simplifies — no defensive wiring needed. Smoke harness (C15 + C22) still mandatory as a regression gate, but Popover sub-trap is no longer the expected failure mode.

If a future shadcn update flips the primitive back to Base UI, the smoke harness will catch it and the defensive patterns from engagement-bar-01 v0.3.2 can be re-applied (precedent preserved in memory + decision files).

## Type system (LOCKED — references description §15 + §7)

All types defined in `types.ts` of media-editor-01. The shape sketches in description §15 are normative; this section locks the deltas added during Q-P sign-off:

```ts
// === Q-P-locked additions ===

export type AspectRatio = "9:16" | "1:1" | "16:9" | "4:5" | "free";
// Q-P1 lock: DEFAULT_ASPECT = "free"

export type MediaSource = "camera" | "upload";  // "library" deferred per description §"Out of scope"
// Default: ["camera", "upload"]

// Q-P2 lock: DEFAULT_ENABLED_MODES = ["photo", "video", "text"]

export interface ExportImageOpts {
  format?: "image/jpeg" | "image/png" | "image/webp";  // Q-P3 lock: default "image/jpeg"
  quality?: number;                                     // 0..1, only meaningful for jpeg/webp; default 0.9
  pixelRatio?: number;                                  // default 2 (retina)
  onProgress?: (progress: number) => void;              // 0..1
}

export interface ExportVideoOpts {
  mimeType?: string;
  bitsPerSecond?: number;
  onProgress?: (progress: number) => void;              // 0..1
}

export type ExportOpts = ExportImageOpts | ExportVideoOpts;

// Q-P4 lock: SourceError discriminated kinds
export type SourceError =
  | { kind: "cors"; url: string; underlying: Error }
  | { kind: "fetch-failed"; url: string; underlying: Error }
  | { kind: "mode-not-enabled"; attempted: ComposerMode; enabled: ComposerMode[] }
  | { kind: "unsupported-file-type"; fileType: string; file: File }
  | { kind: "invalid-blob"; reason: string };

// Q-P5 lock: multi-instance dev-warn — no public type; internals only
// (use-multi-instance-guard.ts is purely internal)

// === Editor context passed to render* slots ===
export interface EditorCtx {
  mode: ComposerMode | null;
  isDirty: boolean;
  isCapturing: boolean;
  isExporting: boolean;
  activeTool: EditTool | null;
  enabledTools: EditTool[];
  enabledModes: ComposerMode[];
  aspect: AspectRatio;
}

// === Labels (i18n) — full keys defined for consumer override ===
export interface MediaEditor01Labels {
  capture: {
    requestingCamera: string;
    cameraDenied: { title: string; body: string; retryCta: string; useGalleryCta: string };
    galleryButton: string;
    switchCamera: string;
    modes: { photo: string; video: string; text: string };
  };
  toolbar: {
    text: string; draw: string; stickers: string; filters: string; adjust: string; crop: string;
  };
  adjust: { brightness: string; contrast: string; saturation: string; blur: string };
  publish: { exporting: string; cancel: string; ready: string };
  discard: { title: string; body: string; cancel: string; confirm: string };
  empty: { noSource: string };
}
```

Other types (`ComposerMode`, `EditTool`, `TextOverlay`, `PlacedSticker`, `ImageAdjustments`, `StickerOption`, `StickerSet`, `FilterPreset`, `FontOption`, `MediaEditorState`, `ExportMetadata`, `ValidationError`, `GradientPreset`, `DrawingStroke`, `CropRect`, `EditAction`, `InitialSource`) — shape inherited from story-composer-01 v0.1.5 `types.ts`. Renamed `Composer*` prefixes to `MediaEditor*` only where the type is now public on media-editor-01's surface AND was story-shaped before (e.g., NO renames — `ComposerMode` stays as-is to preserve story-composer-01 v0.2.0 backcompat via re-export).

## Props surface (LOCKED from description §8 + Q-P locks)

Full `MediaEditor01Props` interface in description §8. Plan locks defaults:

```ts
const DEFAULTS = {
  enabledModes: ["photo", "video", "text"] as const,           // Q-P2 (a)
  enabledTools: ["text", "draw", "stickers", "filters", "adjust", "crop"] as const,
  mediaSources: ["camera", "upload"] as const,
  aspect: "free" as const,                                      // Q-P1 (a)
  presentation: "auto" as const,
  defaultMode: undefined,    // resolves to enabledModes[0]
  defaultFacing: undefined,  // UA-sniff
  maxVideoDuration: 30,
  recordAudio: true,
  maxFileSizeMb: 50,
  replaceBuiltinStickers: false,
  replaceBuiltinFilters: false,
  confirmOnDiscard: true,
} as const;

// cropAspects default-derivation (description §4 crop row):
// - If aspect !== "free": defaults to [aspect]
// - If aspect === "free": defaults to ["9:16", "1:1", "16:9", "4:5", "free"]
// Consumer can override either default by passing cropAspects explicitly.
```

## Imperative handle (LOCKED from description §7)

`MediaEditor01Handle` shape locked verbatim in description §7. Handle is attached via `React.forwardRef` + `useImperativeHandle` on the root component.

**Disabled-tool semantics**: if `enabledTools` excludes the corresponding tool, the method (e.g. `addText()` when `text` not enabled):
- Dev (`NODE_ENV !== "production"`): `console.warn("media-editor-01.addText(): 'text' tool not in enabledTools — call ignored.")` once per session per method.
- Prod: silent no-op.

**Capture method semantics when capture not enabled**: if `enabledModes` excludes capture modes AND `initialSource` is set, `switchCamera/takePhoto/startRecording/stopRecording/importFromGallery` follow the same dev-warn + silent-noop pattern.

**Lifecycle methods in wrong presentation**: `open()` and `close()` are silent no-ops in `presentation="inline"`. NO dev-warn (intentionally — consumer code may pass both `open()` and `close()` to a shared handler that doesn't know the presentation; warning would be noisy).

## story-composer-01 v0.2.0 — wrapper refactor contract

Story-composer-01 v0.2.0 becomes a thin wrapper. Public API preserved 100%. Internal changes:

### Files in story-composer-01/ AFTER refactor

```
src/registry/components/media/story-composer-01/
├── story-composer-01.tsx                    # thin wrapper around MediaEditor01 + publish flow
├── parts/
│   ├── composer-shell.tsx                   # KEPT — story-shaped modal chrome (delegates dialog to MediaEditor)
│   ├── composer-publish-bar.tsx             # KEPT — story's top-right publish CTA + close X
│   └── publishing-progress-overlay.tsx      # KEPT — XHR upload progress UI
├── hooks/
│   ├── use-story-composer-state.ts          # REFACTORED — composes useMediaEditorState + augments with publish/upload state
│   └── use-image-uploader.ts                # KEPT — XHR upload + progress + cancel
├── lib/
│   └── defaults.ts                          # KEPT — story-shaped DEFAULT_STORY_COMPOSER_LABELS + upload defaults
├── types.ts                                 # KEPT — story-shaped types + RE-EXPORT BAND from media-editor-01
├── dummy-data.ts                            # KEPT — story fixtures
├── demo.tsx                                 # KEPT — same 5 tabs from v0.1.5
├── usage.tsx                                # KEPT — story-specific usage
├── meta.ts                                  # BUMPED to v0.2.0 + adds @ilinxa/media-editor-01 dep
└── index.ts                                 # KEPT — same export surface (verified against v0.1.5 by snapshot diff)
```

### `useStoryComposerState` composition contract

```ts
// story-composer-01/hooks/use-story-composer-state.ts (v0.2.0)
import { useMediaEditorState } from "../media-editor-01";

export function useStoryComposerState(opts: UseStoryComposerStateOpts) {
  const editorState = useMediaEditorState(opts.editor);  // delegates editor concerns

  // Story-shaped additions (NOT in useMediaEditorState):
  const [publishStatus, setPublishStatus] = useState<PublishStatus>("idle");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [publishError, setPublishError] = useState<Error | null>(null);

  return {
    ...editorState,        // identical fields to v0.1.5 editor-shaped surface
    publishStatus,         // story-only — preserved from v0.1.5
    uploadProgress,        // story-only — preserved from v0.1.5
    publishError,          // story-only — preserved from v0.1.5
    setPublishStatus,
    setUploadProgress,
    setPublishError,
  };
}
```

**Return-shape invariant**: the v0.2.0 return shape is a strict superset of v0.1.5's. Any v0.1.5 caller destructuring fields continues to work. **Verification: snapshot `tsc --emitDeclarationOnly` against pre-extraction tip + post-refactor; diff is additive-only.**

### Type re-export band

`story-composer-01/types.ts` v0.2.0 prepends:

```ts
// === Backward-compat re-exports — types moved to media-editor-01 in v0.2.0 ===
// Removing these is a breaking change reserved for v0.3.0+.
export type {
  ComposerMode,
  EditTool,
  TextOverlay,
  PlacedSticker,
  ImageAdjustments,
  StickerOption,
  StickerSet,
  FilterPreset,
  FontOption,
  AspectRatio,
  ValidationError,
  GradientPreset,
  DrawingStroke,
  CropRect,
  MediaEditor01Labels,
} from "../media-editor-01";

// (Optional hook re-export with @deprecated JSDoc — see C17)
export { useMediaCapture } from "../media-editor-01";
```

### Type re-exports audit script (C2 task)

```bash
# Captures v0.1.5's exported type surface before any moves happen.
# Run on the pre-extraction tip (currently 849c577) to baseline.
cd src/registry/components/media/story-composer-01 && \
  pnpm tsc --emitDeclarationOnly --outDir /tmp/story-composer-01-v0.1.5-types && \
  cat /tmp/story-composer-01-v0.1.5-types/index.d.ts > docs/procomps/media-editor-01-procomp/story-composer-01-v0.1.5-exports.snapshot.txt
```

The snapshot becomes the contract: every name in the snapshot MUST still resolve from `@ilinxa/story-composer-01` after v0.2.0. CI-style check: post-C17, re-run the same emitDeclarationOnly and diff against snapshot; any missing name fails the audit.

### story-composer-01.tsx (v0.2.0) wrapper sketch

```tsx
"use client";
import * as React from "react";
import { MediaEditor01, type MediaEditor01Handle } from "../media-editor-01";
import { ComposerPublishBar } from "./parts/composer-publish-bar";
import { useImageUploader } from "./hooks/use-image-uploader";
import { useStoryComposerState } from "./hooks/use-story-composer-state";
import type { StoryComposer01Props, StoryComposer01Handle, PublishedStory } from "./types";

export const StoryComposer01 = React.forwardRef<StoryComposer01Handle, StoryComposer01Props>(
  function StoryComposer01(props, ref) {
    const editorRef = React.useRef<MediaEditor01Handle>(null);
    const story = useStoryComposerState({ editor: { /* mapped opts */ } });
    const uploader = useImageUploader({ uploadUrl: props.uploadUrl, uploader: props.uploader });

    const handlePublish = React.useCallback(async () => {
      if (!editorRef.current) return;
      story.setPublishStatus("compositing");
      const { blob, metadata } = await editorRef.current.export({
        onProgress: (p) => story.setUploadProgress(p * 0.5),  // export = first 50%
      });
      story.setPublishStatus("uploading");
      const result = await uploader.upload(blob, metadata, (p) => story.setUploadProgress(0.5 + p * 0.5));  // upload = second 50%
      story.setPublishStatus("done");
      props.onPublished(mapToPublishedStory(result, metadata));
    }, [props, story, uploader]);

    // Imperative handle preserved verbatim from v0.1.5 — delegates to editorRef + adds story-specific methods
    React.useImperativeHandle(ref, () => ({
      open: () => editorRef.current?.open(),
      close: () => editorRef.current?.close(),
      reset: () => { editorRef.current?.reset(); story.setPublishStatus("idle"); },
      switchCamera: () => editorRef.current!.switchCamera(),
      takePhoto: () => editorRef.current!.takePhoto(),
      startRecording: () => editorRef.current!.startRecording(),
      stopRecording: () => editorRef.current!.stopRecording(),
      importFromGallery: () => editorRef.current!.importFromGallery(),
      addText: (text) => editorRef.current!.addText(text),
      addSticker: (sticker) => editorRef.current!.addSticker(sticker),
      setAdjustments: (adj) => editorRef.current!.setAdjustments(adj),
      applyFilter: (name) => editorRef.current!.applyFilter(name),
      publish: handlePublish,
      exportBlob: () => editorRef.current!.export(),
    }), [handlePublish, story]);

    return (
      <MediaEditor01
        ref={editorRef}
        aspect="9:16"
        enabledModes={["photo", "video", "text"]}
        enabledTools={["text", "draw", "stickers", "filters", "adjust"]}  // crop opt-in carried forward from v0.1.4 fix
        mediaSources={["camera", "upload"]}
        presentation="dialog"
        isOpen={props.isOpen}
        onClose={props.onClose}
        // ...all other props mapped 1:1...
        renderTopBar={(ctx) => (
          <ComposerPublishBar
            {...ctx}
            onPublish={handlePublish}
            publishStatus={story.publishStatus}
            uploadProgress={story.uploadProgress}
          />
        )}
      />
    );
  }
);
```

## Implementation order (commit chain)

**22 commits** (C1 → C22) across 3 phases. Phase A grows media-editor-01 via `git mv` so history is preserved AND story-composer-01 stays green throughout. Phase B refactors story-composer-01 to consume the new procomp. Phase C closes both with reviews + smoke.

### Phase A — media-editor-01 extraction (C1 → C15)

| # | Commit | Lands |
|---|---|---|
| **C1** | `chore(media-editor-01): scaffold + verify F-cross-13 substrate` | `pnpm new:component media/media-editor-01`. Empty `types.ts` + skeleton root that throws. Manifest entry. `pnpm view konva react-konva version` → lock exact constraints in meta.ts. Run F-cross-13 substrate grep on `dialog/slider/popover` — record findings in this commit message. tsc clean. |
| **C2** | `feat(media-editor-01): types.ts + index.ts barrel scaffold + run story-composer-01 v0.1.5 type-export snapshot` | Author `types.ts` per "Type system" section above. Write minimal `index.ts` barrel (types-only exports for now; hooks/parts/lib re-exports added as files land in C3-C12). Snapshot story-composer-01 v0.1.5 type-export surface to `docs/procomps/media-editor-01-procomp/story-composer-01-v0.1.5-exports.snapshot.txt` via `tsc --declaration --emitDeclarationOnly --noEmit false --outDir /tmp/...` (override default `noEmit: true` via CLI flags or temp tsconfig). No runtime code yet. tsc clean (types compile in isolation). |
| **C3** | `feat(media-editor-01): move 7 hooks via git mv + barrel re-exports + update story-composer-01 imports` | `git mv` exactly 7 hooks (`use-camera-permissions`, `use-drawing-stroke`, `use-history`, `use-konva-selection`, `use-konva-stage-size`, `use-media-capture`, `use-pan-zoom`) from `story-composer-01/hooks/` → `media-editor-01/hooks/`. **`use-story-composer-state.ts` is NOT touched** — it stays in story-composer-01 and continues to be its public export (preserved verbatim until C17). `use-media-editor-state.ts` is written NET-NEW in C6 (not moved). Extend `media-editor-01/index.ts` barrel to re-export the moved hooks. In SAME C3 commit, update story-composer-01's imports of the 7 moved hooks to go through the barrel: `import { useMediaCapture } from "../media-editor-01"`. Story-composer-01 still ships v0.1.5 functionally identical. tsc clean. lint clean. demo at `/components/story-composer-01` renders identical. **`git log --follow`** verified for each moved file before push. |
| **C4** | `feat(media-editor-01): split lib/ + git mv to media-editor-01` | Split `story-composer-01/lib/defaults.ts` into editor-defaults (→ media-editor-01) + story-defaults (stays). `git mv` 5 lib files (`built-in-stickers`, `composite-video`, `export-blob`, `konva-filters`, `mime-fallback`) → media-editor-01/lib/. Update story-composer-01 imports. Story-composer-01 still works. |
| **C5** | `feat(media-editor-01): move parts via git mv + file+symbol renames + story-composer-01 v0.2.0 backward-compat aliases + barrel updates` | `git mv` 16 parts to `media-editor-01/parts/`. Three file-renames in same commit: `composer-camera` → `editor-camera`, `composer-editor` → `editor-canvas`, `composer-toolbar` → `editor-toolbar`. **Symbol renames inside the renamed files**: `ComposerCamera` → `EditorCamera`, `ComposerEditor` → `EditorCanvas`, `ComposerToolbar` → `EditorToolbar`. Update story-composer-01's imports to `import { EditorCamera, EditorCanvas, EditorToolbar } from "../media-editor-01"`. **Backward-compat audit**: grep story-composer-01 v0.1.5's `index.ts` barrel for `ComposerCamera` / `ComposerEditor` / `ComposerToolbar` exports — if any were public, add aliases in story-composer-01's barrel (`export { EditorCamera as ComposerCamera } from "../media-editor-01"`) with `@deprecated` JSDoc pointing at new names. media-editor-01 barrel re-exports the 5 EXPORTED parts (EditorCamera, EditorCanvas, EditorToolbar, ColorSwatchPicker, DiscardConfirmDialog). Story-composer-01 demo verifies identical render. |
| **C6** | `feat(media-editor-01): root component + ref handle skeleton + write use-media-editor-state.ts NEW + manifest entry` | Write `media-editor-01.tsx` as black-box orchestrator. Imperative handle skeleton via `forwardRef` + `useImperativeHandle` — methods are stubs that delegate to internal state. **Write `use-media-editor-state.ts` NEW** (not moved) — the editor-shaped reducer (mode + dirty flag + active tool + stage transitions; no story-shaped fields). Renders editor-camera + editor-canvas + editor-toolbar with NO gating yet (all features on). Add `src/registry/manifest.ts` entry NOW so `/components/media-editor-01` renders in `pnpm dev` from this commit onwards (docs visibility during C7-C12 verification). Minimal demo.tsx mounting the component. tsc clean. |
| **C7** | `feat(media-editor-01): presentation = inline / dialog / auto + isOpen guard` | `lib/presentation-resolver.ts` (auto rule per description §6) + `lib/dialog-size-for-aspect.ts` (size map per description §6). `media-editor-01.tsx` wraps in `Dialog` when presentation resolves to "dialog". Runtime dev-only `console.error` when dialog mode lacks `isOpen` (once per instance). Inline mode renders bare. Demo tab "Inline" added. |
| **C8** | `feat(media-editor-01): capability gating (enabledModes/enabledTools/mediaSources/aspect + crop interaction)` | All 4 capability props wired. Toolbar filters by `enabledTools`. Mode pill filters by `enabledModes` (hides if 1 mode). Camera surface filters by `mediaSources` (dropzone if no camera). Aspect-locked canvas. Crop tool's `cropAspects` default-derivation from `aspect`. Layer removal when corresponding tool disabled (perf). Demo tab "Capability dials" added. |
| **C9** | `feat(media-editor-01): initialSource intake + validation + File.type detection + onInitialSourceError` | `lib/initial-source-loader.ts` resolves `InitialSource` → `MediaEditorState`. URL path fetches; CORS error → `onInitialSourceError({ kind: "cors", ... })`. File-type detection (image/* → photo, video/* → video, else `unsupported-file-type`). Mode-mismatch validation against `enabledModes`. Editor lands directly in edit canvas when `initialSource` set (skips capture). Demo tab "Edit-only" added. |
| **C10** | `feat(media-editor-01): ExportOpts + onProgress + video perf-shortcut + format dispatch` | `lib/export-blob.ts` handles all 3 formats (jpeg/png/webp) via canvas `.toBlob()`. Default `image/jpeg` quality 0.9 (Q-P3). Video perf-shortcut: if `enabledTools` lacks overlays, skip `composite-video.ts` re-encode. **Amendment (2026-06-02 post-C20 review):** implementation gates on the runtime state — `!hasAnyOverlay(state) && !state.crop` — a strict superset of the originally-planned static `enabledTools`-only check (fires when EITHER the user disabled overlay tools OR added nothing). Same intent, broader coverage. See [`reviews/2026-06-02-v0.1.0-spotcheck.md`](reviews/2026-06-02-v0.1.0-spotcheck.md) F-05. `onProgress` callback wired in both image (start/end) and video (10× ticks) paths. Polymorphic `export()` dispatches by current mode. |
| **C11** | `feat(media-editor-01): footgun guards (multi-instance dev-warn + empty-state)` | `hooks/use-multi-instance-guard.ts` module-level counter; `useEffect` mount/unmount. Dev-only `console.warn` when 2+ capture-enabled instances mount (Q-P5 (b)). Empty-state for `enabledModes:[]` + no `initialSource` (description §1 footgun guard). Slot `renderEmpty` honored if set. |
| **C12** | `feat(media-editor-01): demo.tsx (5 tabs) + dummy-data + popover wiring verified Radix-shaped` | demo 5 tabs: "Defaults / News-hero / Chat / Edit-only / Dark". `dummy-data.ts` with sample sources + stickers. Popover wiring uses standard Radix patterns (PopoverAnchor + asChild OK) per C1 substrate verification — no defensive wiring needed for media-editor-01 v0.1.0. Smoke harness (C15 + C22) is the regression gate. |
| **C13** | `feat(media-editor-01): usage.tsx + meta.ts v0.1.0 finalized` | `usage.tsx` (consumer docs). `meta.ts` v0.1.0 + status `alpha` + deps audited (`pnpm validate:meta-deps` clean). Manifest entry was added in C6 (now refines title/description if needed). Verify `/components/media-editor-01` renders in `pnpm dev` with all 5 demo tabs working. |
| **C14** | `chore(media-editor-01): registry.json — base + fixtures items` | Add base item (slug `media-editor-01`, all `registry:component`, no demo/usage/meta) + fixtures item (slug `media-editor-01-fixtures`, deps on base, just `dummy-data.ts`). `pnpm registry:build` clean. **Manual roster audit** per `project_registry_roster_manual_audit_pattern.md`: diff sealed-folder vs `registry.json files[]`. |
| **C15** | `feat(media-editor-01): pre-Phase-B internal smoke + guide.md draft` | Run path-b smoke harness against `media-editor-01` in tmp consumer (consumer-tsc clean). Author initial draft of `media-editor-01-procomp-guide.md` (consumer-facing usage notes — the third planning doc required per workflow). |

### Phase B — story-composer-01 v0.2.0 wrapper refactor (C16 → C19)

| # | Commit | Lands |
|---|---|---|
| **C16** | `feat(story-composer-01): v0.2.0 wrapper refactor — consume media-editor-01` | Rewrite `story-composer-01.tsx` per wrapper sketch above. Map all props 1:1 to MediaEditor01. Forward ref handle delegates to editor ref + augments with story-shaped methods. NO public API change. |
| **C17** | `refactor(story-composer-01): v0.2.0 useStoryComposerState composes useMediaEditorState` | `use-story-composer-state.ts` composes `useMediaEditorState` + augments with story-shaped state (publishStatus/uploadProgress/publishError). Return shape strict superset of v0.1.5. Verified via `tsc --emitDeclarationOnly` diff against C2 snapshot — must be additive-only. Re-export `useMediaCapture` from media-editor-01 with `@deprecated` JSDoc. |
| **C18** | `chore(story-composer-01): v0.2.0 demo tabs visual-regression check + type re-export audit` | Walk every v0.1.5 demo tab (`/components/story-composer-01` in `pnpm dev`) and confirm identical behavior. Run type-export audit (compare post-refactor `tsc --emitDeclarationOnly` against C2 snapshot — every v0.1.5 export name still resolves). If anything drifted, fix in this commit. |
| **C19** | `chore(story-composer-01): v0.2.0 meta + registry.json registryDependencies + manifest sync` | `meta.ts` v0.1.5 → v0.2.0. Add the media-editor-01 registry URL to story-composer-01's `registryDependencies` array in `registry.json` (NOT `dependencies` — that's NPM peers; cross-registry-item deps use `registryDependencies` per shadcn convention; see "Cross-procomp dependency wiring" section above). Re-run `pnpm validate:meta-deps` + `pnpm registry:build`. Manifest description bump. |

### Phase C — close (C20 → C22)

| # | Commit | Lands |
|---|---|---|
| **C20** | `feat(media-editor-01): GATE 3 readiness review v0.1.0` | Author `docs/procomps/media-editor-01-procomp/reviews/2026-MM-DD-v0.1.0-spotcheck.md`. Fixed-core 4 dims + rotating dim = **Public API** (procomp-tier standard list; justified: extraction's dominant risk IS public-surface preservation — does media-editor-01's API map cleanly to v0.1.5 capabilities consumers depended on via story-composer-01?). AI-assisted per readiness-review.md rule (procomp tier, v0.1.0 first ship, AI acceptable). Findings → patches as needed. Verdict ≥ Pass-with-follow-ups. |
| **C21** | `feat(story-composer-01): GATE 3 wrapper-equivalence spotcheck v0.2.0` | Author `docs/procomps/story-composer-01-procomp/reviews/2026-MM-DD-v0.2.0-spotcheck.md`. Standard procomp spotcheck — rotating dim = **Public API** (per readiness-review.md "Public-API-touching minor bump" trigger; lens: v0.1.5 surface preservation, including every v0.1.5 demo tab behaves identically, every v0.1.5 exported type resolves via re-export band, every v0.1.5 ref-handle method works, useStoryComposerState return-shape strict-superset). Findings → patches in this commit. |
| **C22** | `chore(media-editor-01 + story-composer-01): cross-procomp smoke + STATUS + decision file + push` | Install BOTH into tmp consumer via `pnpm dlx shadcn@4.6.0 add @ilinxa/media-editor-01 && pnpm dlx shadcn@4.6.0 add @ilinxa/story-composer-01`. Consumer-side `pnpm tsc --noEmit` clean. Update `.claude/STATUS.md`. Author decision file `.claude/decisions/2026-MM-DD-media-editor-01-v0.1.0-extraction-and-story-composer-01-v0.2.0.md`. Push to master. Vercel auto-deploys. |

**Estimated commit budget**: 22 commits (15 Phase A + 4 Phase B + 3 Phase C). Final on-disk file count: 33 (media-editor-01) + 14 (story-composer-01 v0.2.0; reduced from 39 in v0.1.5 since 16 parts + 7 hooks + 5 lib moved out). Final registry roster: 31 (media-editor-01) + 12-ish (story-composer-01 v0.2.0; verify in C19).

## Risks + mitigations

| Risk | Mitigation |
|---|---|
| **`git mv` history loss across multiple files in one commit** — git's rename detection is heuristic | Each Phase-A move commit uses explicit `git mv` per file; verify `git log --follow` traces correctly post-commit before pushing. If any file's history fails to follow, split into smaller move commits. |
| **story-composer-01 breaks mid-extraction (C3-C5)** | Each move commit updates story-composer-01's import paths in the SAME commit. tsc clean is the canary — fails immediately if any import is missed. Demo at `/components/story-composer-01` is a runtime canary checked after every Phase-A commit. |
| **`useStoryComposerState` v0.2.0 return shape silently drifts from v0.1.5** | C2 snapshots v0.1.5 declarations to disk. C18 re-emits + diffs. Any non-additive drift fails the audit. |
| **F-cross-13 sub-traps on new shadcn primitive use** — `dialog`/`slider`/`popover` substrate divergence | C1 substrate grep documented actuals: all 3 primitives are Radix-backed via the unified `radix-ui` package (no Base UI in deps). Defensive wiring NOT needed for v0.1.0. C15 + C22 smoke catches any future regression if the primitive layer flips back to Base UI. |
| **Konva canvas perf regression after extraction** (e.g. accidental re-render of editor-canvas part) | Compare frame rates on filter-slider + drawing tools in C15 against story-composer-01 v0.1.5 baseline. Investigate any > 20% drop before C16. |
| **`exportVideo()` `onProgress` callback fires inconsistently** — captureStream re-encode doesn't expose progress events | Use frame-counter heuristic: divide elapsed frames-encoded by total expected frames. Approximation good enough for progress UX. Document in JSDoc that prop is best-effort. |
| **Multi-instance guard counter leaks on hot-reload during dev** | `useEffect` mount/unmount counter increment/decrement; React 19 StrictMode mounts twice in dev. Use `useRef` flag to debounce. Worst case: false-positive warn — annoying but not broken. |
| **CORS-fetched `initialSource` succeeds but image fails to decode** | `onInitialSourceError({ kind: "invalid-blob", reason })` fires from `<Image>` `onError`. UI shows empty state with retry. |
| **`presentation: "auto"` resolution surprises a consumer who set initialSource + enabledModes both** | description §6 locked the rule (empty enabledModes → inline; else dialog). C18 demo tab "Edit-only" exercises both arms; review in C20 validates rule reads correctly. |
| **`dialog-size-for-aspect` mismatch with story-composer's existing 400×711 sizing** | story-composer's wrapper passes `aspect="9:16"` which resolves to 400×711 — identical to v0.1.5. Verify in C18 demo regression. |

## Verification gates per commit

Every commit must pass before push:

1. `pnpm tsc --noEmit` clean (both procomps)
2. `pnpm lint` clean
3. `pnpm validate:meta-deps` clean
4. `pnpm build` clean
5. `pnpm registry:build` clean (C14 onwards)
6. Docs pages render: `/components/media-editor-01` (C13+) AND `/components/story-composer-01` (all Phase A — must stay green throughout)
7. **`git log --follow`** traces correctly for any moved file (Phase A)
8. **Type-export snapshot diff** clean (C2 baseline; re-checked at C18; must be additive-only)
9. **Browser-test** the documented patterns at the relevant commit:
   - C6: standalone media-editor demo renders + tools work
   - C7: dialog mode opens/closes; inline mode renders bare
   - C8: each capability dial visibly changes the surface
   - C9: edit-only mode with sample URL loads + edit works
   - C10: export produces correct format/quality; progress callback fires
   - C12: F-cross-13 defensive Popover wiring works (no console errors)
   - C15: smoke harness in tmp consumer green
   - C18: every story-composer-01 v0.1.5 demo tab unchanged in behavior

## GATE 3 readiness review

Per `.claude/rules/readiness-review.md`:

- **media-editor-01 spotcheck** (C20): Template = `docs/reviews/templates/review-spotcheck.md`. 5 dims = 4 shared core + 1 rotating = **Public API** (extraction's dominant risk — does the public surface map cleanly?). AI-assisted acceptable per procomp tier + v0.1.0 first-ship policy. Mandatory smoke = path-b consumer-tsc clean.
- **story-composer-01 v0.2.0 spotcheck** (C21): Same template; rotating dim = **Public API** (under the "Public-API-touching minor bump" trigger from readiness-review.md, lens = v0.1.5-surface preservation). Verifies the v0.1.5 → v0.2.0 transition is non-breaking. AI-assisted acceptable.
- **Cross-procomp smoke** (C22): Install BOTH procomps into tmp consumer + consumer-tsc clean + manual smoke of story-composer's demo via the installed copy.

## Workflow gates

- **GATE 1** — description ✅ CLOSED 2026-06-02 (5 Q-Ps locked)
- **GATE 2** — this plan ✅ CLOSED 2026-06-02 (22-commit chain locked across Phase A/B/C; cross-procomp dep convention locked; type re-export contract locked)
- **GATE 3** — readiness review at C20 (media-editor-01) + C21 (story-composer-01 v0.2.0 wrapper-equivalence)

## Migration origin

- **Source**: `src/registry/components/media/story-composer-01/` v0.1.5 (tip `849c577`).
- **Method**: `git mv` per file in atomic commits that update story-composer-01 imports in the same diff. Preserves git history for every moved file (`git log --follow` continues to trace).
- **story-composer-01 v0.1.5** is the final pre-extraction sealed-folder version. The v0.2.0 wrapper begins from C16.
