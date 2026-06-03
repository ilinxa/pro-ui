# HANDOFF — media-editor-01 v0.1.2 (GATE 3 follow-up batch)

**Date:** 2026-06-03
**Status:** ✅ Implemented + all gates green + docs updated + **committed**. **Push pending user confirmation** (push = Vercel deploy = consumer-installable).
**Resume mode:** Fresh chat — read this handoff. The next decision is whether to push, then the v0.2 cohort.

---

## What this was

Resumed the v0.1.1 spotcheck's **v0.1.2-tagged follow-ups**
([`docs/procomps/media-editor-01-procomp/reviews/2026-06-03-v0.1.1-spotcheck.md`](../docs/procomps/media-editor-01-procomp/reviews/2026-06-03-v0.1.1-spotcheck.md)).
Patch bump **v0.1.1 → v0.1.2** — declared public surface made functional +
internal hook refinement; **no public-API add/remove → no new GATE 3** (readiness
rule patch exemption).

## Closed

| Finding | Sev | Fix |
|---|---|---|
| **F-01** | ⚠️ | `onModeChange` + `onEditAction` were declared but never emitted. `onModeChange` now fires on every mode transition (effect, skips mount). `onEditAction` emits the **navigation + lifecycle** subset: `mode-change` / `tool-open` / `tool-close` (effects) + `reset` (central `performReset`). Fine-grained content-mutation actions deferred to v0.2 — the `EditAction` union is already complete so consumers switch exhaustively today. |
| **F-02** | ⚠️ | `renderPermissionDenied` threaded into `EditorCamera` — replaces the built-in prompt for the **denied** state only (pending / no-camera / error keep the built-in). |
| **F-06** | 🔸 | Pan-zoom keyboard moved from `window` to the `targetRef` element. `EditorCanvas` container made focusable (`tabIndex={0}` + `role="group"` + aria-label + `focus-visible` ring). Keys act only while the canvas holds focus. |
| **F-04** | 🔹 | Bottom-overlay JSX was uniformly under-indented (two `-4` blocks). No formatter in repo → anchor-verified whitespace-only re-indent via one-off script (`e:/tmp/reindent-media-editor.mjs`). |
| Housekeeping | 🔹 | Dropped the `as unknown as` touch cast in `editor-canvas.tsx` — broadened `handleStageMouseDown` to `KonvaEventObject<MouseEvent \| TouchEvent>`. |

## Files touched

- `src/registry/components/media/media-editor-01/hooks/use-pan-zoom.ts`
- `src/registry/components/media/media-editor-01/parts/editor-canvas.tsx`
- `src/registry/components/media/media-editor-01/parts/editor-camera.tsx`
- `src/registry/components/media/media-editor-01/media-editor-01.tsx`
- `src/registry/components/media/media-editor-01/types.ts`
- `src/registry/components/media/media-editor-01/meta.ts` (version → 0.1.2)
- `public/r/media-editor-01.json` + `public/r/story-composer-01.json` (regen — the story-composer artifact was **stale**: prior SC-08 dead-code removal hadn't been rebuilt into it)
- Guide + STATUS + component-versions + decision file + v0.1.2 review addendum

## Gates (all green)

| Check | Result |
|---|---|
| `pnpm tsc --noEmit` | 0 errors |
| `pnpm lint` | 81 errors / 22 warnings (== baseline) |
| `pnpm validate:meta-deps` | 51 / 51 clean |
| `pnpm registry:build` | ✓ |
| `pnpm build` | ✓ (exit 0, all static pages) |

## Two things worth remembering

- **`react-hooks/refs` + render props:** calling `renderPermissionDenied({ usePicker: handleGalleryClick })` during render trips the rule because `handleGalleryClick` reads a ref — even though `usePicker` is only invoked later by the consumer. The `<CameraPermissionPrompt onUsePicker={handleGalleryClick}>` **prop** form isn't flagged (props defer invocation), confirming the false positive. Fix: hoist the overlay body into a `let` above the return + a scoped `// eslint-disable-next-line react-hooks/refs` with a reason. Kept lint at the 81 baseline.
- **`onEditAction` scope is a deliberate patch-altitude call:** the full union is ~16 kinds; wiring all of them needs per-mutation hooks (some high-frequency/low-signal). The navigation + lifecycle subset is effect-derivable (fires regardless of trigger) and coherent. Removing the props was rejected (dynamicity primacy — "add later is breaking").

## Open follow-ups → v0.2 (unchanged)

- Imperative capture handle (5 methods: `takePhoto`/`startRecording`/`stopRecording`/`switchCamera`/`importFromGallery`).
- **C17 `labels` flattening** (SC-03/04 — the one genuine correctness gap; nested labels keys currently ignored; `Required<StoryComposer01Labels>` shim in place).
- Device-library media source.
- Fine-grained `onEditAction` content-mutation events (`text-*`, `sticker-*`, `draw-stroke`, `filter-apply`, `adjust-change`, `crop-set`, `undo`, `redo`).
- Remaining housekeeping nits (transformer hit-test edge case, filter `as any`, second-source parts, `editorBackground` ignored).

## To resume

1. Decide on **push** (deploys via Vercel → consumer-installable). If yes: `git push origin master` then optionally live-smoke.
2. The dev server `.next` was NOT cleared this session; if you live-test, the prior session's note about restarting `pnpm dev` no longer applies unless you cleared it.
3. cms-panel-01 GATE 1 remains the other in-flight item (unchanged).

**Decision:** [`.claude/decisions/2026-06-03-media-editor-01-v0.1.2-followup-fixes.md`](decisions/2026-06-03-media-editor-01-v0.1.2-followup-fixes.md).
