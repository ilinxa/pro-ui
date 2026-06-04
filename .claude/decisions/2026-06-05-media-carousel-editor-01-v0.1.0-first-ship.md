---
date: 2026-06-05
session: media-carousel-editor-01 first ship
phase: procomp GATE 1→3 (single session)
type: ship
commits: [pending]
components: [media-carousel-editor-01, media-editor-01]
findings: [F-01-resolved-fcross13-tooltip, F-02-editpanel-runtime-verify, F-03-video-poster, F-04-hard-aspect-crop, F-05-maxitems-race]
status: shipped (Pass with follow-ups)
---

# media-carousel-editor-01 v0.1.0 — first ship (53rd procomp)

## What & why

A new **media** procomp: a multi-item media composer with Instagram-feed-post
semantics. Triggered by hands-on testing of `content-composer-01`'s post media
step on 2026-06-04 — the user found the "Upload dropzone (Phase B retrofit)"
stub (which lives in **media-editor-01**, surfaced via the composer's 1:1
passthrough) and asked for: a real droppable + browse zone (one or more files),
a thumbnail rail + main preview, drag-to-reorder, and a single shared edit panel
that loads the selected item into media-editor-01 — explicitly NOT separating
photo and video.

## The load-bearing architectural decision

**Build a new procomp that drives ONE shared media-editor-01 instance — do not
expand media-editor-01 to multi-item.** media-editor-01 is shipped (v0.1.2) and
shared (story-composer-01 depends on its single-item semantics). The carousel
owns the *collection* (intake / rail / order / preview / edit-panel lifecycle);
media-editor-01 keeps owning the *single item*. A single editor instance is
loaded serially per item (keyed remount), never N concurrent — which also avoids
tripping media-editor-01's multi-instance guard. **media-editor-01 source is
unchanged** (the diff touches only the new folder + registry + manifest).

User correction during GATE 1 (improved the design): the edit panel is ONE shared
surface, not N editors — Edit pushes the selected item in, Done flattens the
export back, switching items reloads the same panel.

## The "no photo/video tabs" insight

media-editor-01's `enabledModes={[]}` + `initialSource` = **edit-only mode** (no
capture surface, no photo/video capture tabs). The carousel mounts the editor
exactly this way. Intake is file-based (MIME decides `image` vs `video`), so the
capture-mode tabs the user complained about never appear.

## Shape

14 sealed-folder files: root + 5 parts (`media-dropzone`, `preview-rail`,
`rail-thumb`, `main-preview`, `edit-panel`) + 2 hooks (`use-carousel-state`,
sealed `use-controllable-state`) + 4 lib (`file-intake`, `validate-media-file`,
`aspect`, `clamp-sources`) + types/index. dnd via `@dnd-kit` (already a repo dep
— kanban-board-01). Controlled/uncontrolled `MediaCarouselItem[]` + imperative
handle (getItems / export / addFiles / removeItem / select / openEditor / reset).
Edits flatten on apply (rail/preview always publish-ready); `export()` pull-only.
Shared aspect from item 1 (overridable). maxItems default 10.

## Decisions locked (GATE 1)

- Name `media-carousel-editor-01` (authoring counterpart to the `media-carousel-01`
  viewer; output shaped to feed it).
- Aspect: shared, derived from item 1, overridable.
- Edit presentation: single shared panel in the main area.
- Video Edit: disabled in v0.1 (preview/reorder/remove only; tooltip→native title).
- `"library"` source: clamped to upload-only in v0.1.
- content-composer post-slot integration: **separate follow-on gate** (breaking
  content-composer v0.2 — `MediaSlotValue` single-URL → array). NOT in this ship.

## Impl-time corrections (plan amended)

1. **ValidationError not re-exported** by media-editor-01's `.tsx` tail band →
   the carousel defines its own `MediaCarouselError` (keeps media-editor-01
   untouched; cross-procomp surface = the component + 5 types from the `.tsx`).
2. **Tooltip dropped (F-cross-13)** — see below.
3. Selection made *derived* (not a reconcile effect) → no setState-in-effect lint.

## F-01 — F-cross-13 caught by the local-registry smoke (resolved pre-ship)

Producer uses `radix-ui` tooltip (`asChild`); a `base-nova` consumer installs the
**Base UI** tooltip (`render` prop). The only tooltip (the video "coming in v0.2"
hint) failed consumer-tsc (`TS2322`) while producer-tsc passed. The **local-registry
smoke** (serve `public/` on localhost → repoint harness → `shadcn add` + tsc)
caught it pre-push. Fix: native `title` + `aria-label`, drop the `tooltip` dep
entirely. Re-smoke clean (0 consumer-tsc errors). Cross-procomp import (F-01 proper)
rewrote correctly: `@/registry/components/media/media-editor-01/media-editor-01`
→ `@/components/media-editor-01/media-editor-01` (no `/types` mangling — routing
through the `.tsx` entry held).

**Lesson:** for trivial hints in distributed components, prefer native affordances
over the Tooltip primitive; and the local-registry smoke is the gate that catches
the radix/Base-UI split before a deploy cycle.

## Gates

tsc 0 · lint baseline unchanged (no new findings) · meta-deps 53/53 · `pnpm build`
✓ · registry:build ✓ (14 base + 1 fixtures; no demo/usage/meta) · local-registry
consumer-tsc smoke: install pass + 0 errors. GATE 3 spotcheck **Pass with
follow-ups** ([review](../../docs/procomps/media-carousel-editor-01-procomp/reviews/2026-06-05-v0.1.0-spotcheck.md)).

## Open follow-ups

- F-02 (verify): edit-panel runtime flow confirmed only by tsc + static preview — confirm on manual test / post-deploy.
- F-03 (v0.2): video poster-frame extraction (rail uses live `<video>`).
- F-04 (v0.2): optional hard aspect-crop-on-add (v0.1 is soft object-fit).
- F-05 (v0.1.1): backstop `maxItems` cap inside `addItems` (sub-frame double-add race).
- Follow-on gate: content-composer-01 post-slot integration (breaking v0.2).

## Pointers

- GATE 1: [`docs/procomps/media-carousel-editor-01-procomp/media-carousel-editor-01-procomp-description.md`](../../docs/procomps/media-carousel-editor-01-procomp/media-carousel-editor-01-procomp-description.md)
- GATE 2: [`docs/procomps/media-carousel-editor-01-procomp/media-carousel-editor-01-procomp-plan.md`](../../docs/procomps/media-carousel-editor-01-procomp/media-carousel-editor-01-procomp-plan.md)
- GATE 3: [`docs/procomps/media-carousel-editor-01-procomp/reviews/2026-06-05-v0.1.0-spotcheck.md`](../../docs/procomps/media-carousel-editor-01-procomp/reviews/2026-06-05-v0.1.0-spotcheck.md)
