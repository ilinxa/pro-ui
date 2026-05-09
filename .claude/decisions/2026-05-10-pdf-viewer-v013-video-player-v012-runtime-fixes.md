---
date: 2026-05-10
session: post-pdf-viewer-pause-runtime-fixes
phase: post-2026-05-09-pause
type: patch
commits: pending-this-session
components: [pdf-viewer, video-player-01]
findings: []
status: shipped
---

# pdf-viewer v0.1.3 + video-player-01 v0.1.2 — runtime regression patch-bumps

## What landed

Two unrelated runtime regressions surfaced when the user opened component detail pages in the docs site. Both fixed in the same session as patch-bumps (no public-API change). Per the readiness-review rule, patch bumps don't trigger GATE 3.

### pdf-viewer 0.1.2 → 0.1.3

**Symptom.** Opening `/components/pdf-viewer` (URL tab demo) threw a runtime invariant inside `react-pdf`:

```
Invariant failed: Attempted to load page annotations, but no document was specified.
Wrap <Page /> in a <Document /> or pass explicit `pdf` prop.
```

…even though the `pdf` prop was explicitly being passed to `<Page>`.

**Root cause.** The viewer used a "split" architecture: a hidden `<Document>` as a *sibling* loader (driven by the `usePdfDocument` hook's callbacks), and rendered `<Page pdf={pdfDocument}>` outside that Document. In react-pdf v10, `<Page>` accepts the `pdf` prop standalone — but its child `AnnotationLayer` reads `pdf` *exclusively* from `useDocumentContext()` (see `node_modules/react-pdf/dist/Page/AnnotationLayer.js:14-19`). The Page's `pdf` prop never reaches the page context, so the AnnotationLayer can't see the document.

This is a known react-pdf gotcha that the docstring even references ("…some advanced functions like linking between pages inside a document may not be working correctly" — but the comment understates it: AnnotationLayer outright fails, not just degrades).

**Fix.** Wrapped the page list inside the same `<Document>` that does loading, instead of having Document as a hidden sibling. Used `className="contents"` on the Document so its wrapper div is transparent to layout. Single Document instance now drives both loading lifecycle and DocumentContext propagation. The `usePdfDocument` callbacks (onLoadSuccess / onLoadError / onPassword / onSourceError) and `pdfDocument` flow are unchanged.

Single-file change: [src/registry/components/media/pdf-viewer/pdf-viewer.tsx](../../src/registry/components/media/pdf-viewer/pdf-viewer.tsx).

**Why this slipped past the v0.1.0 GATE 3 spot-check.** The spot-check covered all 5 dimensions (procomp docs, registry distribution, meta+manifest sync, verification, and rotating dim) and verified `pnpm build` + tsc + lint + smoke. None of those exercise the runtime annotation-layer path — the page renders fine in build / SSR (no client-side errors) and in the smoke consumer (which doesn't open the URL tab in a browser). This is an argument for *one* additional check on the next review of any non-trivial component: open the docs page in dev mode and check the browser console.

### video-player-01 0.1.1 → 0.1.2

**Symptom.** Opening `/components/video-player-01` showed `GET https://videos.pexels.com/...mp4 403 (Forbidden)` for every video, no playback.

**Root cause.** Pexels' video CDN now blocks anonymous hotlinks (returns 403 with `AccessDenied` for unauthenticated GETs to `videos.pexels.com/video-files/...`). All 6 sample URLs in `dummy-data.ts` pointed at Pexels. This is a third-party policy change, not a code regression — but it broke the demo and breaks the fixtures item shipped to consumers.

**Fix.** Swapped all 6 sample URLs in [src/registry/components/media/video-player-01/dummy-data.ts](../../src/registry/components/media/video-player-01/dummy-data.ts) for verified hotlink-friendly equivalents:

| Export | New source |
|---|---|
| `SAMPLE_VIDEO_URL` | `test-videos.co.uk` Big Buck Bunny 720p 10s 1MB |
| `SAMPLE_POSTER_URL` | `images.placeholders.dev` 1280×720 SVG placeholder |
| `SAMPLE_VERTICAL_VIDEO_URL` | MDN `cc0-videos/friday.mp4` (now landscape — comment updated to flag this for story-style consumers) |
| `SAMPLE_LOOP_VIDEO_URL` | MDN `cc0-videos/flower.mp4` |
| `SAMPLE_VIDEO_URL_B` | `test-videos.co.uk` Jellyfish 720p |
| `SAMPLE_VIDEO_URL_C` | `test-videos.co.uk` Sintel 720p |

Each URL was curl-verified to return HTTP 206 with `video/mp4` content-type (= range-request support, prerequisite for `<video>` to seek and stream). Posters were verified separately (200 / image content-type).

**Domain choices, why these:**
- **test-videos.co.uk** — long-running public test-clip mirror; serves the canonical Blender Foundation films (BBB / Sintel / TearsOfSteel) at multiple sizes; range-request support; permissive hotlinking.
- **MDN `interactive-examples.mdn.mozilla.net/media/cc0-videos/`** — Mozilla's test bucket; CC0; powers MDN's interactive `<video>` examples; rock-solid uptime.
- **placeholders.dev** — purpose-built SVG placeholder service; replaces the dead Pexels poster.

I tried `commondatastorage.googleapis.com/gtv-videos-bucket` (the de-facto demo source for years) but it now also returns `AccessDenied` — Google revoked anonymous access to the bucket sometime recently. Worth knowing for future demos.

**Consumer impact.** Existing consumers who installed `video-player-01-fixtures` before this patch have the dead Pexels URLs baked in until they re-run `pnpm dlx shadcn@latest add @ilinxa/video-player-01-fixtures`. No way to fix that retroactively. The base `video-player-01` item is unaffected.

## Why patch (not minor)

Both changes are pure regression fixes with zero API surface change:
- pdf-viewer: same component tree shape from the consumer's POV; only the internal Document/Page wiring shifted. No prop changes, no callback shape changes, no new exports.
- video-player-01: the 6 `SAMPLE_*` exports keep their names + types; only their string values changed.

Per `.claude/rules/component-readiness-review.md`, patch bumps don't trigger GATE 3.

## Verification

- `pnpm tsc --noEmit` clean
- `pnpm lint` clean
- `pnpm validate:meta-deps` 38/38 clean
- Both URLs verified by curl (range request returns 206 + correct content-type) before commit

Browser smoke (manual, in dev):
- `/components/pdf-viewer` URL tab — pages render, annotation layer attaches, no console errors
- `/components/video-player-01` Default / Custom controls / Captions / Decorative / Carousel tabs — all videos play

## Files touched

- `src/registry/components/media/pdf-viewer/pdf-viewer.tsx` — restructure Document wrapping
- `src/registry/components/media/pdf-viewer/meta.ts` — version 0.1.2 → 0.1.3
- `src/registry/components/media/video-player-01/dummy-data.ts` — 6 URL swaps + comment updates
- `src/registry/components/media/video-player-01/meta.ts` — version 0.1.1 → 0.1.2, updatedAt → 2026-05-10
- `.claude/STATUS.md` — header note + components rows + recent activity pointer
- `.claude/decisions/2026-05-10-pdf-viewer-v013-video-player-v012-runtime-fixes.md` — this file

## Open follow-ups (none new)

- pdf-viewer: F-01 / F-02 / F-03 from the v0.1.0 review remain open as previously logged.
- video-player-01: no findings logged in this patch.

## Lessons / one-line takeaways

- **react-pdf gotcha:** `<Page pdf={...}>` standalone WORKS for the page itself (Page-level invariant) but FAILS for AnnotationLayer (which reads pdf only from DocumentContext). Always wrap pages in `<Document>` even when you have a separate loading-state hook.
- **Public CDN demo URLs decay.** Both Pexels (recent) and Google's `gtv-videos-bucket` (recent) revoked anonymous hotlink access. Default to test-videos.co.uk + MDN cc0-videos for future demos. Curl-verify before committing.
- **GATE 3 spot-check should include "browser console open".** A 1-minute browser-mode dev-server check catches runtime errors that build/tsc/lint/smoke don't.
