---
date: 2026-06-03
session: media-editor-01-v0.1.2-gate3-followup-batch
phase: shipped
type: patch-bump — GATE 3 follow-up batch (no new review required)
commits: ["<media-editor-01 v0.1.2 patch commit — this batch>"]
components: ["media-editor-01"]
findings: 4 v0.1.1-review follow-ups closed + 1 housekeeping nit + 1 stale-artifact correction
status: shipped-pending-push
---

# Decision: media-editor-01 v0.1.2 — GATE 3 follow-up batch

## Summary

Resumed the `media-editor-01` v0.1.1 GATE 3 spotcheck
([`2026-06-03-v0.1.1-spotcheck.md`](../../docs/procomps/media-editor-01-procomp/reviews/2026-06-03-v0.1.1-spotcheck.md))
follow-ups tagged **v0.1.2**. This is a **patch bump** — it makes already-declared
public surface functional and refines an existing internal hook option. No props
added, none removed, no breaking change → **GATE 3 not re-triggered** per
[`readiness-review.md`](../rules/readiness-review.md) (patch bumps are exempt).

Closed this batch:

| Finding | Sev | What landed |
|---|---|---|
| **F-01** | ⚠️ High | `onModeChange` + `onEditAction` were declared but never emitted. Wired both. `onModeChange` fires on every mode transition (effect-driven, skips mount). `onEditAction` emits the navigation + lifecycle subset — `mode-change`, `tool-open`, `tool-close` (effects) and `reset` (central `performReset`). Fine-grained content-mutation actions documented as v0.2 (per-mutation instrumentation); the `EditAction` union is already complete so consumers switch exhaustively today. |
| **F-02** | ⚠️ High | `renderPermissionDenied` slot was declared but `CameraPermissionPrompt` was always used. Threaded the slot into `EditorCamera` — it replaces the built-in prompt for the **denied** state only (pending / no-camera / error keep the built-in). |
| **F-06** | 🔸 Med | `usePanZoom` arrow/`+`/`-`/`0` keys were bound at `window` (hijack risk). Now bound to the `targetRef` element; `EditorCanvas` container made focusable (`tabIndex={0}` + `role="group"` + aria-label + focus-visible ring). Keys only act while the canvas holds focus. |
| **F-04** | 🔹 Low | The bottom-overlay JSX was uniformly under-indented (two `-4` blocks: the `<>` tool-panel fragment + the chip-row inner). No formatter in the repo → did an anchor-verified whitespace-only re-indent via a one-off script (`e:/tmp/reindent-media-editor.mjs`). Pure formatting; tsc confirms no structural change. |
| Housekeeping | 🔹 Low | Removed the `as unknown as` touch-handler cast in `editor-canvas.tsx` by broadening `handleStageMouseDown`'s event type to `KonvaEventObject<MouseEvent \| TouchEvent>` (assignable to both `onMouseDown` + `onTouchStart`). The remaining housekeeping nits (transformer hit-test edge case, filter `as any`, second-source parts, `editorBackground` ignored) stay batched for v0.1.2/v0.2 — they need design calls, not mechanical edits. |

## How `onEditAction` was scoped (the one real judgment call)

The `EditAction` union has ~16 kinds. Wiring all of them requires hooks at dozens
of mutation call sites (and some — live crop drag, continuous adjust slider — are
high-frequency/low-signal). For a **patch**, that surface + risk isn't justified.
The coherent, complete, low-risk subset is the **navigation + lifecycle** events
that are fully derivable from state via effects (so they fire regardless of
trigger source) plus the central `reset`. That converts the prop from
"declared but NEVER emitted" (the review smell) into a functioning observability
hook, and the JSDoc + guide are explicit about what's deferred to v0.2. The
alternative — *removing* the props — was rejected per the dynamicity/reusability
primacy rule ("add it later is a breaking change").

## One drive-by correction

`pnpm registry:build` regenerated `public/r/story-composer-01.json` with a
one-line change (dropping `useEffect` from a `use-story-composer-state.ts`
import). The committed artifact at `112b68f` was **stale** vs the source — the
prior session's SC-08 dead-code removal edited the source but the artifact wasn't
rebuilt in sync. Regenerating brought artifact == source. Kept (correct state).

## A lint trap worth remembering

F-02's first cut tripped a **new** `react-hooks/refs` error (+1 over the 81
baseline): calling `renderPermissionDenied({ usePicker: handleGalleryClick })`
**during render**, where `handleGalleryClick` reads `fileInputRef.current`, looks
to the rule like a ref-read-during-render — even though `usePicker` is only
invoked later by the consumer in an event handler. The `<CameraPermissionPrompt
onUsePicker={handleGalleryClick}>` **prop** form isn't flagged (props defer
invocation), which confirms the asymmetry is a heuristic false positive for the
render-prop pattern. Fix: hoist the overlay body into a `let permissionOverlay`
above the return (reads cleaner anyway) so a scoped
`// eslint-disable-next-line react-hooks/refs` with a reason fits as a normal line
comment. Back to the 81/22 baseline.

## Gates

| Check | Result |
|---|---|
| `pnpm tsc --noEmit` | 0 errors |
| `pnpm lint` | 81 errors / 22 warnings (== baseline) |
| `pnpm validate:meta-deps` | 51 / 51 clean |
| `pnpm registry:build` | ✓ (`public/r/media-editor-01.json` + stale `story-composer-01.json` regenerated) |
| `pnpm build` | ✓ compiled, all static pages |

## Still open (unchanged)

- **v0.2** — imperative capture handle (5 methods); C17 `labels` flattening
  (SC-03/04 — the one genuine correctness gap); device-library media source;
  fine-grained `onEditAction` content-mutation events; remaining housekeeping nits.

## Files touched

- `hooks/use-pan-zoom.ts` — keyboard listener target-scoped (was window); option JSDoc.
- `parts/editor-canvas.tsx` — container `tabIndex`/`role`/aria + focus ring; touch-cast removal.
- `parts/editor-camera.tsx` — `renderPermissionDenied` prop + denied-state substitution (hoisted overlay body).
- `media-editor-01.tsx` — `onModeChange`/`onEditAction` emitters (effects + `performReset`); slot pass-through; bottom-overlay re-indent.
- `types.ts` — `onModeChange`/`onEditAction` prop JSDoc (what emits in v0.1.2 vs v0.2).
- `meta.ts` — version `0.1.1 → 0.1.2`.
- Guide — v0.1.2 banner, focus-scoped keyboard note, Known-gaps refresh (v0.1.2 closures + `onEditAction` coverage).
