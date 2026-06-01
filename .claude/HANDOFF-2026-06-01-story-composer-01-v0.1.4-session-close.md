# HANDOFF — story-composer-01 v0.1.4 session close

> **Status:** 🟢 Closed. v0.1.0 → v0.1.4 shipped, pushed, deployed, smoke-verified. **20 commits in one day** (15-commit ship chain + 5-version patch arc). Tip `c64df7a` on master, deployed via Vercel.

## Resume-from-cold guide

1. **Read this handoff first** — it's the canonical entry point for the entire arc.
2. **Then the decision file** at [`.claude/decisions/2026-06-01-story-composer-01-v0.1.0-first-ship.md`](decisions/2026-06-01-story-composer-01-v0.1.0-first-ship.md) for the architectural log + Q-P locks + commit table.
3. **Then the consumer guide** at [`docs/procomps/story-composer-01-procomp/story-composer-01-procomp-guide.md`](../docs/procomps/story-composer-01-procomp/story-composer-01-procomp-guide.md) for the public API.
4. **Then the GATE 3 spotcheck** at [`docs/procomps/story-composer-01-procomp/reviews/2026-05-31-v0.1.0-spotcheck.md`](../docs/procomps/story-composer-01-procomp/reviews/2026-05-31-v0.1.0-spotcheck.md) for carry-over findings.

## What shipped

50th procomp. Closes the story-system trilogy: `story-rail-01` (discovery) + `story-viewer-01` (consumption) + **`story-composer-01`** (creation).

### Versions

| Version | SHA | Headline |
|---|---|---|
| **v0.1.0** | `cff7265` | First ship — 15-commit chain (C1 scaffold → C15 GATE 3 review). Full Instagram parity: 3 modes (photo / video / text), 6 edit tools (text / draw / stickers / filters / adjust / crop), 36 built-in emoji stickers, 10 filter presets, undo/redo, mobile-fullscreen / desktop 400×711 9:16 modal. |
| **v0.1.1** | `fb18b90` | Smoke patch — 3 F-cross-13 sub-traps against consumer-side shadcn primitives (`radix-ui` namespace import / `showCloseButton` prop / `size="icon-sm"`). |
| **v0.1.2** | `e46778a` | Radix a11y — `DialogContent` was missing `DialogDescription`; added required prop + sr-only desc + new `composerDescription` label. |
| **v0.1.3** | `75acbba` | Pan + pinch-zoom — new `usePanZoom` hook; touch 2-finger / desktop wheel / keyboard. |
| **v0.1.4** | `c64df7a` | 3 user-reported fixes: wheel zoom no longer needs Ctrl (native non-passive listener); crop removed from default `enabledTools` (stories are 9:16-locked); camera flicker root-cause fixed (`requestAudio` default flipped to false + bounded auto-retry). |

## Numbers

| Metric | Value |
|---|---|
| Commits in arc | 20 (15 ship chain + 5 patch versions) |
| Files on disk | 41 (40 source + 1 new `use-pan-zoom.ts` in v0.1.3) |
| Files via registry | 38 (37 base + 1 fixtures) |
| Public props | ~30 |
| Imperative handle methods | 15 |
| Exported sealed-folder parts | 5 (ComposerCamera / ComposerEditor / ComposerToolbar / ComposerPublishBar / ColorSwatchPicker) |
| Exported hooks | 3 (useStoryComposerState / useMediaCapture / useImageUploader) — plus `usePanZoom` is internal-only |
| Exported lib helpers | 5 (resolveFilterPresets / resolveStickerSets / exportPhotoBlob / exportTextOnlyBlob / compositeVideo) |
| Exported default tokens | 5 (DEFAULT_TEXT_GRADIENTS / DEFAULT_FONTS / DEFAULT_COLOR_PRESETS / BUILT_IN_FILTER_PRESETS / BUILT_IN_STICKER_SETS) |
| New peer deps | 2 (`konva ^10.3.0` + `react-konva ^19.2.4`) |
| New shadcn deps | 6 (alert-dialog + button + dialog + popover + slider + toggle-group) |

## Verification

- ✅ `pnpm tsc --noEmit` clean throughout 20-commit chain
- ✅ `pnpm lint` baseline unchanged
- ✅ `pnpm validate:meta-deps` clean (50/50 slugs)
- ✅ `pnpm registry:build` clean
- ✅ `pnpm build` exit 0 (59 static pages; verified RSC + React.lazy + Konva boundary holds)
- ✅ **Smoke harness path-b consumer-tsc green** — `pnpm dlx shadcn@4.6.0 add @ilinxa/story-composer-01` installs 36/36 files; consumer `pnpm tsc --noEmit` 0 errors.

## GATE 3 review

[`docs/procomps/story-composer-01-procomp/reviews/2026-05-31-v0.1.0-spotcheck.md`](../docs/procomps/story-composer-01-procomp/reviews/2026-05-31-v0.1.0-spotcheck.md) — **Pass with follow-ups**

| F# | Severity | Status |
|---|---|---|
| F-01 RAF-throttle adjust sliders | 🔸 Medium | **Open → v0.1.5** candidate |
| F-02 Drawing-stroke counter-ref signal | 🔹 Low | **Open → v0.1.x** (defer-if-no-drop) |
| F-03 `index.ts` barrel — 14 promised exports | ⚠️ High | ✅ closed in C15 |
| F-04 STATUS.md catalog 49→50 | 🔸 Medium | ✅ closed in C15 |
| F-05 `pnpm build` verification | 🔸 Medium | ✅ closed in C15 |

## Open follow-ups (carried forward)

1. **F-01 RAF-throttle adjust sliders** — v0.1.5 candidate. Match the rich-card slider pattern.
2. **F-02 Drawing-stroke counter-ref signal** — v0.1.x; defer if no measurable drop.
3. **Smile-icon polish** — still blocked on `engagement-bar-01` upstream `defaultReactionIcon` prop (carried over from story-viewer-01 v0.4.4 handoff; unrelated to story-composer-01 itself).
4. **Crop-with-zoom integration** — currently mutually exclusive (crop is DOM overlay, pan-zoom is Konva transform). v0.2 candidate: rewrite crop as Konva.Rect so they cooperate. Documented as deferred in v0.1.3 commit body.

## Concurrent in-flight (untouched)

- [`HANDOFF-2026-05-25-cms-panel-01-gate-1-awaiting-signoff.md`](HANDOFF-2026-05-25-cms-panel-01-gate-1-awaiting-signoff.md) — cms-panel-01 GATE 1 description awaiting sign-off + 10 open questions. **No changes this session.**

## Past handoffs (frozen, in chronological order)

- [`HANDOFF-2026-06-01-story-composer-01-v0.1.0-shipped.md`](HANDOFF-2026-06-01-story-composer-01-v0.1.0-shipped.md) — frozen at v0.1.0 ship; superseded by this file
- [`HANDOFF-2026-05-30-story-viewer-01-v0.4.4-session-close.md`](HANDOFF-2026-05-30-story-viewer-01-v0.4.4-session-close.md)
- [`HANDOFF-2026-05-29-story-viewer-01-v0.3.9-session-close.md`](HANDOFF-2026-05-29-story-viewer-01-v0.3.9-session-close.md)
- [`HANDOFF-2026-05-28-story-viewer-01-v0.2.0-c6-pause.md`](HANDOFF-2026-05-28-story-viewer-01-v0.2.0-c6-pause.md)
- [`HANDOFF-2026-05-28-session-close-engagement-bar-01-v0.3.2-shipped.md`](HANDOFF-2026-05-28-session-close-engagement-bar-01-v0.3.2-shipped.md)
- [`HANDOFF-2026-05-28-session-close-post-card-01-v0.2.1-shipped.md`](HANDOFF-2026-05-28-session-close-post-card-01-v0.2.1-shipped.md)
- [`HANDOFF-2026-05-09-session-pause.md`](HANDOFF-2026-05-09-session-pause.md)

## Lessons captured (memory carriers)

These were either reinforced or newly surfaced this arc:

- **Smoke harness as the F-cross-13 oracle** — 4 consecutive ships now follow `ship → smoke → patch → re-smoke clean` (post-card-01 / engagement-bar-01 / todo-tree / story-composer-01). Same-day patch is the default expectation for any new procomp using Popover / Slider / Dialog / Button.
- **Registry roster manual audit** — caught the `use-pan-zoom.ts` addition in v0.1.3; would have been a v0.4.3-class blocker without it. Diff sealed folder vs `registry.json files[]` is now a hard pre-push step on every minor bump.
- **Audio permission in photo mode is a flicker trap** — getUserMedia({audio:true}) rejects on mic-denied even when camera is granted. Only request audio when actually needed. Auto-retry effects against permission state need a bounded ref or they will infinite-loop on stable denials.
- **React onWheel is passive** — preventDefault doesn't work for browser zoom blocking. Native `addEventListener("wheel", h, { passive: false })` does.

## Suggested resume phrasing

> "resume story-composer-01 — v0.1.5 perf patch" → land F-01 + F-02 in one micro-version bump
> "resume cms-panel-01" → switch to the GATE 1 sign-off thread
> "what's next?" → general triage; new session reads STATUS.md's Active queue
