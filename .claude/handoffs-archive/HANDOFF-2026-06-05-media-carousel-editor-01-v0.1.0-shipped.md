# HANDOFF — media-carousel-editor-01 v0.1.0 SHIPPED (53rd procomp)

**Date:** 2026-06-05
**Status:** ✅ Built + gates green + GATE 3 Pass-with-follow-ups + local-registry smoke clean. **Commit + push pending user confirmation** (this handoff written pre-commit).

---

## TL;DR

New **media** procomp `media-carousel-editor-01` (53rd) — an Instagram-feed-post
multi-media composer: drag-drop / browse one-or-more mixed photo+video files into
an ordered reorderable thumbnail **rail** + a main **preview**, and **Edit** any
photo through a **single shared `media-editor-01`** panel (loaded serially, never
N at once). Built greenfield through GATE 1 → 2 → 3 in one session. **media-editor-01
source is unchanged** — pure composition.

Origin: user testing content-composer-01's post media step found the deferred
"Upload dropzone (Phase B retrofit)" stub and asked for the real thing.

## What shipped

14 sealed-folder files + demo/usage/meta. Controlled/uncontrolled `MediaCarouselItem[]`
+ imperative handle. `@dnd-kit` rail reorder (existing dep). Edits flatten on apply;
`export()` pull-only. Shared aspect from item 1. maxItems 10. Video Edit disabled in
v0.1 (preview/reorder/remove only).

The "no photo/video tabs" the user wanted falls out of mounting media-editor-01 in
**edit-only mode** (`enabledModes={[]}` + `initialSource`) — no capture surface.

## Gates (all green)

tsc 0 · lint baseline unchanged (no new findings) · meta-deps 53/53 · `pnpm build`
✓ (53 demos) · registry:build ✓ (14 base + 1 fixtures; no demo/usage/meta) ·
**local-registry consumer-tsc smoke: install pass + 0 errors**.

## The smoke caught a real bug (F-cross-13)

First smoke pass FAILED: the producer's `radix-ui` Tooltip (`asChild`) breaks for
`base-nova` consumers that install the **Base UI** tooltip (`render`). The only
tooltip (video "coming in v0.2" hint) → switched to a native `title`, dropping the
`tooltip` dep entirely. Re-smoke clean. Cross-procomp import (F-01 proper) rewrote
correctly through the `.tsx` entry (no `/types` mangling).

## TO PUSH (when the user confirms)

```
git add -A
git commit  # message below
git push origin master
```

Working tree (pre-commit): new `src/registry/components/media/media-carousel-editor-01/`,
new `docs/procomps/media-carousel-editor-01-procomp/`, new decision + this handoff,
2 new `public/r/*.json` artifacts, modified `registry.json` + `public/r/registry.json`
+ `src/registry/manifest.ts` + `.claude/STATUS.md`.

## GATE 3 follow-ups (all Low except the resolved High; none blocking)

- ~~F-01 F-cross-13 tooltip~~ ✅ resolved in-review (native title; dep dropped).
- F-02 (verify): edit-panel runtime flow — confirm on manual test / post-deploy.
- F-03 (v0.2): video poster-frame extraction.
- F-04 (v0.2): optional hard aspect-crop-on-add (v0.1 soft).
- F-05 (v0.1.1): backstop `maxItems` cap in `addItems` (sub-frame double-add race).
- **Follow-on gate:** content-composer-01 post-slot integration (breaking v0.2 —
  `MediaSlotValue` single-URL → array). NOT started; its own GATE 1/2/3.

## Pointers

- Decision: [`.claude/decisions/2026-06-05-media-carousel-editor-01-v0.1.0-first-ship.md`](decisions/2026-06-05-media-carousel-editor-01-v0.1.0-first-ship.md)
- GATE 1/2/3: [`docs/procomps/media-carousel-editor-01-procomp/`](../docs/procomps/media-carousel-editor-01-procomp/)
- Concurrent in-flight (unchanged): cms-panel-01 GATE 1 [`HANDOFF-2026-05-25-cms-panel-01-gate-1-awaiting-signoff.md`](HANDOFF-2026-05-25-cms-panel-01-gate-1-awaiting-signoff.md).
