---
date: 2026-06-01
session: story-composer-01-v0.1.5-patch
phase: ship
type: component-patch
commits: []
components: ["story-composer-01"]
findings: 0
status: shipped
version: "0.1.5"
previous_tip: c64df7a
---

# story-composer-01 v0.1.5 — photo-preview latency + keyboard pan direction + demo uploader

Single-commit patch on top of the v0.1.0→v0.1.4 same-day arc. Two user-reported runtime fixes plus a demo-site UX nicety.

## What changed

### 1. Photo preview no longer flashes black between shutter and editor (perceived-speed fix)

After pressing the shutter, the user previously stared at a black background until the lazy `react-konva` chunk resolved AND the blob URL was decoded a second time inside `useImage` AND the Stage's ResizeObserver fired. The captured pixels already exist the moment `URL.createObjectURL(photo.blob)` returns — there was no reason to wait.

Two cooperating changes:

- **Suspense fallback now renders the photo** ([story-composer-01.tsx:870-884](../../src/registry/components/media/story-composer-01/story-composer-01.tsx#L870-L884)) — instead of `<div className="absolute inset-0 bg-black" />`, the fallback paints `<img src={draft.url}>` so first-shot lazy-chunk-load latency is visually instant.
- **Editor underlay `<img>`** ([composer-editor.tsx:142-150,258-267](../../src/registry/components/media/story-composer-01/parts/composer-editor.tsx#L142-L267)) — bridges the gap between Suspense resolving and Konva's `useImage`/stage init. Gated on `showUnderlay = !!imageUrl && !image` so it auto-hides once Konva has the image, avoiding filter/adjustment bleed-through the unfiltered underlay.

Deeper optimization (passing the already-decoded `HTMLImageElement` or canvas directly to Konva to avoid the second decode) is a bigger refactor deferred to v0.2.

### 2. Keyboard arrow pan direction inverted

[use-pan-zoom.ts:253-273](../../src/registry/components/media/story-composer-01/hooks/use-pan-zoom.ts#L253-L273) — flipped sign on all four arrow keys. The old code used scrolling-the-viewport semantics ("right" = shift content left); the natural mental model when you're looking at media you want to reposition is moving-the-image semantics. `ArrowRight` now increases `transform.x`, etc. No public-API change — `panBy` is still internal.

### 3. Demo uploader — every tab now round-trips to "Done"

`demo.tsx` previously routed four of five tabs through `uploadUrl: SAMPLE_UPLOAD_URL` (= `https://example.com/upload/story`). `example.com` doesn't accept POSTs, so the demo's own working error-handling path was the only thing the user ever saw on press-Publish. Now every tab uses a shared local `demoUploader` (fakes a 1.5s upload, returns the blob's own object URL) so the docs site demonstrates the success path end-to-end. The `uploadUrl` prop still exists and is documented in `usage.tsx` for consumers who want a real endpoint; `SAMPLE_UPLOAD_URL` from `dummy-data.ts` is no longer used by the demo (kept exported for prop reference).

## Verification

- `pnpm tsc --noEmit` — clean
- `pnpm exec eslint <changed files>` — 5 errors / 0 warnings, ALL pre-existing in `CropOverlay` + `useImage` (untouched code); 0 new lint issues from this patch
- `pnpm validate:meta-deps` — 50/50 clean (no deps changed)

## Why this is a patch (not a minor)

Per [`.claude/rules/readiness-review.md`](../rules/readiness-review.md), patch bumps (v0.1.x → v0.1.y, non-breaking, no public-API touch) do not trigger GATE 3. All three changes here are runtime-only:

- `usePanZoom` keyboard internals (no signature change)
- ComposerEditor internal underlay (no prop change)
- demo.tsx (docs-site only, not in the shipped registry artifact per the locked target convention)

## What is still deferred

Same list as v0.1.4 — these did not become v0.1.5 candidates:

- **F-01** adjust-slider re-cache thrashing → RAF-throttle. Still queued for v0.1.6.
- **F-02** drawing-stroke array-clone signal → counter ref. Still defer-if-no-drop.
- **Crop-with-zoom integration** → v0.2 (needs DOM→Konva crop overlay rewrite so the crop frame can ride the Stage transform).
- **Single-decode photo path** (canvas → Konva directly, no blob→Image()→URL→Image() round-trip) → v0.2 for further perceived-speed gains beyond the underlay fix.
