# HANDOFF — story-composer-01 v0.1.5 session close

> **Status:** 🟢 Closed. v0.1.0 → v0.1.5 shipped, pushed, deployed. **22 commits in one day** (15-commit ship chain + 5 patch versions + 2 closing commits for v0.1.5 fixes + doc alignment). Tip `b647ca4` on master, deployed via Vercel. Working tree clean.

## Resume-from-cold guide

1. **Read this handoff first** — it's the canonical entry point.
2. **For the v0.1.5 patch detail**, see [`.claude/decisions/2026-06-01-story-composer-01-v0.1.5-photo-preview-and-arrow-keys.md`](decisions/2026-06-01-story-composer-01-v0.1.5-photo-preview-and-arrow-keys.md).
3. **For the full v0.1.0 → v0.1.4 arc**, see [`.claude/decisions/2026-06-01-story-composer-01-v0.1.0-first-ship.md`](decisions/2026-06-01-story-composer-01-v0.1.0-first-ship.md) + [`HANDOFF-2026-06-01-story-composer-01-v0.1.4-session-close.md`](HANDOFF-2026-06-01-story-composer-01-v0.1.4-session-close.md) (now frozen).
4. **For the public API** (now fully aligned with v0.1.5 state), see [`docs/procomps/story-composer-01-procomp/story-composer-01-procomp-guide.md`](../docs/procomps/story-composer-01-procomp/story-composer-01-procomp-guide.md).
5. **For carry-over findings**, see the [GATE 3 spotcheck](../docs/procomps/story-composer-01-procomp/reviews/2026-05-31-v0.1.0-spotcheck.md) (frozen v0.1.0 review — verdict carries forward through patch bumps).

## What happened this session

User loaded the v0.1.4 handoff and immediately reported two runtime bugs from a fresh test pass:

1. **"After taking picture it takes too long for picture preview to show up."**
2. **"Keyboard arrows are working but in flip direction — right should move image right, top should move it to top."**

Then later: a screenshot of the "Upload failed" screen + a wall of MetaMask extension console warnings, asking "am I supposed to see this?"

Then: "do both" — meaning ship the demo uploader swap AND a v0.1.5 patch with the two fixes.

Then: a deep audit pass — "review and confirm everything is fully accurate, consistent, matched — especially the guides, text contents, documents + registry-related things, then push."

All three pieces shipped + audited + pushed in two commits.

## Versions

| Version | SHA | Headline |
|---|---|---|
| v0.1.0 | `cff7265` | First ship — 15-commit chain (C1 scaffold → C15 GATE 3 review). Full Instagram parity. |
| v0.1.1 | `fb18b90` | Smoke patch — 3 F-cross-13 sub-traps against consumer-side shadcn primitives. |
| v0.1.2 | `e46778a` | Radix a11y — added required `DialogDescription`. |
| v0.1.3 | `75acbba` | Pan + pinch-zoom — new `usePanZoom` hook; touch / wheel / keyboard. |
| v0.1.4 | `c64df7a` | 3 user-reported fixes: wheel zoom no longer needs Ctrl; crop opt-in; camera flicker (mic permission) root-cause fix. |
| **v0.1.5** | **`721fa75`** | **Photo preview latency (Suspense fallback + editor underlay `<img>`) + keyboard arrow direction inverted + docs-site `demoUploader` so all 5 demo tabs round-trip Publish→Done.** |
| docs sweep | `b647ca4` | Aligned guide / meta / registry / usage with v0.1.3 → v0.1.5 state (banner version, file count, edit-tools table with crop opt-in, NEW pan-zoom sections in both guide + usage, NEW pan-zoom feature in meta + registry description). |

## v0.1.5 ship — what changed

### 1. Instant photo preview after shutter

[story-composer-01.tsx:870-884](../src/registry/components/media/story-composer-01/story-composer-01.tsx#L870-L884) + [composer-editor.tsx:142-150,258-267](../src/registry/components/media/story-composer-01/parts/composer-editor.tsx#L142-L267).

Old: black flash between shutter and editor while three serial async steps resolve — Suspense chunk load → `useImage` decoding the blob URL into a fresh `Image()` → `useKonvaStageSize` first measurement.

Fix: two cooperating `<img>` underlays sourced from the same blob URL.

- **Suspense fallback** now renders `<img src={draft.url} object-contain>` instead of a black div. First-shot lazy-chunk-load latency is visually instant.
- **Editor underlay** inside `ComposerEditor` is gated on `showUnderlay = !!imageUrl && !image` — covers the gap between Suspense resolving and Konva's `useImage` + Stage init completing. Auto-hides the instant `image` lands so applied filters/adjustments don't bleed-through the unfiltered underlay.

Deeper optimization (canvas→Konva direct, avoiding the second blob decode entirely) is queued for v0.2 — would need `takePhoto` to return an `HTMLImageElement` or `HTMLCanvasElement` in addition to the blob.

### 2. Keyboard arrow pan direction

[use-pan-zoom.ts:253-273](../src/registry/components/media/story-composer-01/hooks/use-pan-zoom.ts#L253-L273) — flipped sign on all four arrow keys.

Old: scrolling-the-viewport semantics (ArrowRight → shift content LEFT). Confusing when the user thinks they're moving the image.

New: moving-the-image semantics. ArrowRight → `transform.x +=`, ArrowDown → `transform.y +=`, etc. No public API change (`panBy` is internal).

### 3. Demo uploader — every tab round-trips

[demo.tsx](../src/registry/components/media/story-composer-01/demo.tsx) previously routed 4/5 tabs through `uploadUrl: SAMPLE_UPLOAD_URL` (`https://example.com/upload/story`). `example.com` doesn't accept POSTs, so every Publish hit the working error-handling path — user saw "Upload failed" every time.

Now every tab uses a shared local `demoUploader` (fakes 1.5s success, returns `URL.createObjectURL(blob)`). The `uploadUrl` prop is still documented in `usage.tsx` for consumers who want the built-in XHR path. `SAMPLE_UPLOAD_URL` from `dummy-data.ts` is preserved but no longer referenced by the demo.

## Doc alignment sweep — what aligned

Caught drift in 5 surfaces. All fixed in `b647ca4`:

| Surface | Was | Now |
|---|---|---|
| `guide.md` banner | "v0.1.0 alpha" | "v0.1.5 alpha" |
| `guide.md` install | "35 source files" | "37 source files" |
| `guide.md` §Edit tools | "all enabled by default" + misleading disable example | Table with Default column flagging Crop as opt-in (since v0.1.4); 3-example usage block (default / post-style+crop / minimal) |
| `guide.md` (missing) | pan + pinch-zoom from v0.1.3 was undocumented | NEW §"Pan + pinch-zoom" — touch / wheel / arrow keys / +/-/0 / disabled-during-draw-or-crop |
| `meta.ts` features | "Six edit tools: …Crop" implied default-on | Reworded to "default ships the first five; consumers add `\"crop\"`" + NEW pan-zoom feature bullet |
| `registry.json` description | listed Crop as built-in default; no pan-zoom | Same alignment as meta; `public/r/*.json` regenerated |
| `usage.tsx` Photo line | "full toolbar (Text / Draw / Stickers / Filters / Adjust / Crop)" | "default toolbar (…Adjust)"; Crop noted as opt-in via `enabledTools` |
| `usage.tsx` (missing) | pan-zoom unmentioned | NEW short reference section |

Frozen + intentionally untouched: `description.md` / `plan.md` (GATE 1/2 planning records — patches don't update them by convention); the v0.1.0 spotcheck review.

## Numbers (current state, post-doc-sweep)

| Metric | Value |
|---|---|
| Total commits in story-composer-01 arc | 22 (15 ship chain + 5 patch versions + 1 v0.1.5 fix + 1 doc-alignment) |
| Files on disk in sealed folder | 41 (38 registry-shipped + demo + usage + meta) |
| Files via registry | 38 (37 base + 1 fixtures) |
| Public props | ~30 |
| Imperative handle methods | 15 |
| Exported sealed-folder parts | 5 (ComposerCamera / ComposerEditor / ComposerToolbar / ComposerPublishBar / ColorSwatchPicker) |
| Exported hooks | 3 (useStoryComposerState / useMediaCapture / useImageUploader) — `usePanZoom` is internal-only |
| Exported lib helpers | 5 (resolveFilterPresets / resolveStickerSets / exportPhotoBlob / exportTextOnlyBlob / compositeVideo) |
| Exported default tokens | 5 (DEFAULT_TEXT_GRADIENTS / DEFAULT_FONTS / DEFAULT_COLOR_PRESETS / BUILT_IN_FILTER_PRESETS / BUILT_IN_STICKER_SETS) |
| Peer deps | 2 (`konva ^10.3.0` + `react-konva ^19.2.4`) |
| Shadcn deps | 6 (alert-dialog + button + dialog + popover + slider + toggle-group) |

## Verification (final pass before push)

- ✅ `pnpm tsc --noEmit` clean (across both commits)
- ✅ `pnpm lint` baseline unchanged (5 pre-existing errors in untouched code; 0 new issues from the v0.1.5 + doc commits)
- ✅ `pnpm validate:meta-deps` clean (50/50 slugs)
- ✅ `pnpm registry:build` clean — regenerated `public/r/story-composer-01.json` + `public/r/registry.json` for the updated description
- ✅ Registry roster manually audited — 37 base + 1 fixtures, diff vs disk = **aligned** (excluding demo / usage / meta / dummy-data per locked convention)
- ⏳ **Live smoke harness** — not re-run this session. Last known green: v0.1.4 (`pnpm dlx shadcn@4.6.0 add @ilinxa/story-composer-01` → 36/36 install + 0 consumer-tsc errors). v0.1.5 expected to install 38/38 (no schema changes); recommend re-running after Vercel rebuild completes.

## Open follow-ups (carried forward — same list as v0.1.4)

1. **F-01 RAF-throttle adjust sliders** — v0.1.6 candidate now (didn't land in v0.1.5). Match the rich-card slider pattern.
2. **F-02 Drawing-stroke counter-ref signal** — v0.1.x; defer if no measurable drop.
3. **Crop-with-zoom integration** — v0.2 candidate. Currently mutually exclusive (crop is DOM overlay; pan-zoom is Konva transform). Rewrite crop as `Konva.Rect` so they cooperate.
4. **Single-decode photo path** — v0.2 candidate. Pass `HTMLImageElement` / `HTMLCanvasElement` from `takePhoto` directly to Konva so the second `useImage` decode is avoided entirely. The v0.1.5 underlay fixes the *perceived* latency; this would fix the *actual* latency.
5. **Smile-icon polish** — still blocked on `engagement-bar-01` upstream `defaultReactionIcon` prop. Carried over from story-viewer-01 v0.4.4 handoff; unrelated to story-composer-01.
6. **Live smoke harness re-run for v0.1.5** — recommended after Vercel rebuild lands; install path is unchanged so no surprises expected.

## Concurrent in-flight (untouched)

- [`HANDOFF-2026-05-25-cms-panel-01-gate-1-awaiting-signoff.md`](HANDOFF-2026-05-25-cms-panel-01-gate-1-awaiting-signoff.md) — cms-panel-01 GATE 1 description awaiting sign-off + 10 open questions. **No changes this session.**

## Past handoffs (frozen, chronological)

- [`HANDOFF-2026-06-01-story-composer-01-v0.1.4-session-close.md`](HANDOFF-2026-06-01-story-composer-01-v0.1.4-session-close.md) — frozen at v0.1.4; superseded by this file
- [`HANDOFF-2026-06-01-story-composer-01-v0.1.0-shipped.md`](HANDOFF-2026-06-01-story-composer-01-v0.1.0-shipped.md) — frozen at v0.1.0
- [`HANDOFF-2026-05-30-story-viewer-01-v0.4.4-session-close.md`](HANDOFF-2026-05-30-story-viewer-01-v0.4.4-session-close.md)
- [`HANDOFF-2026-05-29-story-viewer-01-v0.3.9-session-close.md`](HANDOFF-2026-05-29-story-viewer-01-v0.3.9-session-close.md)
- [`HANDOFF-2026-05-28-story-viewer-01-v0.2.0-c6-pause.md`](HANDOFF-2026-05-28-story-viewer-01-v0.2.0-c6-pause.md)
- [`HANDOFF-2026-05-28-session-close-engagement-bar-01-v0.3.2-shipped.md`](HANDOFF-2026-05-28-session-close-engagement-bar-01-v0.3.2-shipped.md)
- [`HANDOFF-2026-05-28-session-close-post-card-01-v0.2.1-shipped.md`](HANDOFF-2026-05-28-session-close-post-card-01-v0.2.1-shipped.md)
- [`HANDOFF-2026-05-09-session-pause.md`](HANDOFF-2026-05-09-session-pause.md)

## Top-of-queue alternatives (if starting fresh)

The session-pause point is genuinely open. Choose one:

1. **cms-panel-01 GATE 1 sign-off** — concurrent in-flight, awaiting user. 10 open questions queued. Highest-momentum unfinished work; first pro-panel pilot.
2. **story-composer-01 v0.1.6** — would close F-01 (RAF-throttle adjust sliders). Small targeted patch.
3. **story-composer-01 v0.2** — bundle the v0.2 candidates (single-decode photo path + crop-with-zoom integration). Larger; would benefit from a fresh GATE 1.
4. **Live smoke re-run** for v0.1.5 once Vercel rebuilds — small DX win to confirm consumer install works as expected.

## State lock checklist

- [x] All v0.1.5 changes committed (`721fa75`)
- [x] All doc-alignment changes committed (`b647ca4`)
- [x] Both commits pushed to `origin/master`
- [x] Working tree clean
- [x] tsc / lint / meta-deps / registry:build all green
- [x] Registry roster audited (37 base + 1 fixtures, aligned with disk)
- [x] meta.ts version 0.1.5 + features include pan-zoom
- [x] registry.json description matches meta
- [x] STATUS.md row reflects v0.1.5
- [x] STATUS.md Recent activity entry for v0.1.5 in place
- [x] STATUS.md active-handoff banner updated (now points to THIS file)
- [x] Decision file authored at [`decisions/2026-06-01-story-composer-01-v0.1.5-photo-preview-and-arrow-keys.md`](decisions/2026-06-01-story-composer-01-v0.1.5-photo-preview-and-arrow-keys.md)
- [x] Auto-memory updated (MEMORY.md index + topic file)
- [x] This handoff file authored
