---
date: 2026-06-02
session: media-editor-01-extraction-c1-c22-close
phase: ship
type: cross-procomp-extraction-plus-wrapper-refactor
commits: ["d4611c9", "f7ba118", "11ea17e", "826eb17", "b9e4c2f", "81025f2", "ffcadfa", "f6dd4bd", "a017811", "fa871e2", "640ed29", "046466b", "30f31da", "aa2a6e3", "b2a668f", "923f363", "cb0aaad", "d131d91", "116f75b", "f72c004", "68df4cc", "af68869", "87b72e3", "de11984", "9c0ddb1", "8dfd840", "5296766", "6c7bd0c", "a512a85", "2dc91f4", "dc23f93", "d5eaf27"]
components: ["media-editor-01", "story-composer-01"]
findings: 10
status: shipped-pre-push
---

# Decision: media-editor-01 v0.1.0 extraction + story-composer-01 v0.2.0 wrapper refactor

## Summary

Single 32-commit chain that **extracted the Konva-based capture + edit surface from story-composer-01 v0.1.5 into a standalone procomp (`media-editor-01` v0.1.0)** and **refactored story-composer-01 into a thin v0.2.0 wrapper** around it. Public API preserved 100% across both procomps; 73-name C2 snapshot resolves through v0.2.0 barrel; cross-procomp registry-dep convention established as the FIRST inter-procomp install path in the library.

Pre-extraction tip: `849c577`. Final pre-push tip: `d5eaf27` (32 commits ahead of `origin/master`).

## Key architectural moves

1. **Capability-dial extraction.** Four orthogonal props (`enabledModes` / `enabledTools` / `mediaSources` / `aspect`) factor the v0.1.5 monolith into a re-usable surface for `content-composer-01` (news/post/event/project authoring), `chat-panel` attachments, and CMS hero editors. Story-composer-01 becomes one of several consumers, not the canonical surface.

2. **Cross-procomp registry-dep convention.** Story-composer-01's `meta.ts.internal: ["media-editor-01"]` + `registry.json registryDependencies: ["@ilinxa/media-editor-01"]` + relative `../media-editor-01` imports. Konva / react-konva resolve transitively via the registry-dep, dropping them from story-composer's `npm` deps. Caught by `validate:meta-deps`.

3. **Backward-compat re-export band.** Story-composer-01 v0.2.0's `index.ts` barrel preserves every v0.1.5 name via re-exports from `@ilinxa/media-editor-01`. 9 of those are `@deprecated`-tagged (useMediaCapture family + utilities) to nudge future consumers to import directly. v0.3.0 removes the deprecation.

4. **State machine split.** `MediaEditorState` (serializable persistent snapshot — 12 fields) stays minimal; new working state (draft / trim / selection / drawingTool / cropAspect / textOnly) spreads alongside via `useMediaEditorState`'s return shape. `useStoryComposerState` v0.2.0 composes the editor hook + augments with `publishStatus` / `uploadProgress` / `publishError` for story-shaped publish concerns.

5. **Backfill chain after C15 review.** Phase A's plan optimistically assumed UI mount work was complete at C8. C15 review surfaced the gap: gating + state + export contract shipped, but the actual capture/edit UI (EditorCamera, 5 tool panels, DiscardConfirmDialog, TextOnlyCanvas, undo/redo wiring) had been left as placeholders. Backfilled in R1–R4 (4 commits, ~22 pieces of state moved from story-composer-01.tsx into useMediaEditorState) before the C16 wrapper refactor could proceed cleanly.

## Q-P locks (from GATE 1 sign-off 2026-06-02)

| # | Lock |
|---|---|
| Q-P1 | `aspect="free"` default (free-form sizing; consumer locks via prop) |
| Q-P2 | `enabledModes=["photo","video","text"]` default (all three on) |
| Q-P3 | Default export format `image/jpeg` quality `0.9` |
| Q-P4 | CORS failure on URL source → fires `onInitialSourceError({ kind: "cors" })` + empty state with retry CTA (consumer-friendly explicit error) |
| Q-P5 | Multi-instance allowed; dev-only `console.warn` when 2+ capture-enabled instances mount (gated `NODE_ENV !== "production"`) |

## Findings summary (10 across two GATE 3 reviews)

### media-editor-01 v0.1.0 review (`docs/procomps/media-editor-01-procomp/reviews/2026-06-02-v0.1.0-spotcheck.md`)
| # | Severity | Target | Status |
|---|---|---|---|
| F-01 | 🔸 Med | v0.1.1 | `history.execute()` not wrapping individual mutations — undo/redo stacks empty |
| F-02 | 🔸 Med | v0.3.0 | `setMode` workaround via loadState in story-composer wrapper |
| F-03 | 🔸 Med | v0.3.0 | `StoryComposer01Labels` cast in MediaEditor01 root is type-unsafe |
| F-04 | 🔹 Low | v0.2.1 if found | Visual regression — user post-push walkthrough |
| F-05 | — | closed | Plan §C10 wording vs runtime-gate impl drift — **closed in-review** |

### story-composer-01 v0.2.0 review (`docs/procomps/story-composer-01-procomp/reviews/2026-06-02-v0.2.0-spotcheck.md`)
| # | Severity | Target | Status |
|---|---|---|---|
| F-01 | 🔸 Med | v0.2.1 | `editorBackground` not forwarded |
| F-02 | — | closed | `renderPublishingOverlay` slot wired — **closed in-review** |
| F-03 | 🔸 Med | v0.3.0 | `setMode` workaround (cross-refs media-editor-01 F-02) |
| F-04 | 🔹 Low | v0.2.1 docs | Story-composer planning trio still describes v0.1.5 architecture |
| F-05 | 🔹 Low | v0.2.1 if found | Visual regression (same as media-editor-01 F-04) |

Net: 8 open / 2 closed-in-review. None blocking the v0.1.0 / v0.2.0 ship.

## Execution lessons (10)

1. **Planning docs need to enumerate UI mount points alongside type/state surfaces.** Phase A's plan listed types, hooks, lib helpers, and the imperative handle. It did NOT enumerate WHICH parts actually get mounted in the root component. C15 review caught this; R1–R4 backfilled. Future extractions: add a "Root JSX mount points" subsection to the planning doc.

2. **Snapshot-before-move surfaces hidden coupling.** The C2 snapshot captured 74 named exports the consumer surface depends on. Without it, the C5 + C16 work would have silently dropped tail dependencies.

3. **Type-shape regressions are easy when copy-paste-typing extracted types.** C4 caught `CropRect` (4 vs 5 fields) + `GradientPreset.css` vs `.background` field-name drift before the new types could ship.

4. **F-cross-13 substrate risk is point-in-time, not static.** C1 verified the shadcn substrate was Radix-backed at extraction time (Popover, Dialog, Slider). The same primitives had been Base-UI-shaped during the engagement-bar-01 v0.3.0 sub-trap arc weeks earlier. Re-verify per extraction; defensive wiring is project-time-dependent.

5. **Cross-procomp imports need explicit conventions caught by lint.** C3 introduced the FIRST inter-procomp runtime dep in the library. `validate:meta-deps` had to be extended to track the `internal:` array in `meta.ts`; missing the declaration would have shipped a phantom import. Established as load-bearing tooling.

6. **React 19 ref-during-render rule is strict.** Multiple times during R1–R4, the initial draft accessed a ref's `.current` synchronously during render. React 19 lint flags this as an error (not warning). All accesses moved to `useEffect` / `useImperativeHandle` bodies.

7. **Dialog sizing via CSS custom properties keeps Tailwind static-analyzable.** C7 wired aspect-derived dialog dimensions via `--media-editor-dialog-w / -h` CSS custom properties consumed by `md:w-[var(...)]` classes. Tailwind's static analyzer doesn't see dynamic values; the CSS-custom-property bridge keeps the compile clean.

8. **"Partial use" gating demos need their own UI, not real parts composed in.** C8's "Capability dials" demo tab was built from scratch (showing visual affordances of gating results) rather than mounting the real parts, because the parts themselves weren't wired yet. Decision file D-9 documented this.

9. **Backward-compat re-exports + cross-procomp registry deps + `@deprecated` JSDoc are the three legs of a non-breaking minor-version refactor.** Each one alone would have broken some consumer surface; the three together preserve v0.1.5 imports verbatim while pointing migration paths at the new import location.

10. **In-review fixes for Low-severity findings close follow-up tables tighter than deferral.** F-05 (media-editor plan §C10 wording) + F-02 (story-composer renderPublishingOverlay) both took <5 minutes in-review and removed two open items from the follow-up cohort. Worth defaulting to "patch if small enough" rather than "defer if not urgent."

## File counts

| Procomp | On-disk | Registry artifact | Versioned at |
|---|---|---|---|
| `media-editor-01` | 41 files (38 sealed-folder + demo + usage + meta) | 38 base + 1 fixtures | v0.1.0 alpha |
| `story-composer-01` | 11 files (8 sealed-folder + demo + usage + meta) | 8 base + 1 fixtures | v0.2.0 alpha (was v0.1.5; 38 → 8 file trim) |

## Cross-references

- Procomp planning trio (media-editor-01): [description.md](../../docs/procomps/media-editor-01-procomp/media-editor-01-procomp-description.md), [plan.md](../../docs/procomps/media-editor-01-procomp/media-editor-01-procomp-plan.md), [guide.md](../../docs/procomps/media-editor-01-procomp/media-editor-01-procomp-guide.md)
- Procomp planning trio (story-composer-01 — v0.1.5-era; v0.2.0 amendment is F-04): [description.md](../../docs/procomps/story-composer-01-procomp/story-composer-01-procomp-description.md), [plan.md](../../docs/procomps/story-composer-01-procomp/story-composer-01-procomp-plan.md), [guide.md](../../docs/procomps/story-composer-01-procomp/story-composer-01-procomp-guide.md)
- GATE 3 review files: [media-editor-01 v0.1.0](../../docs/procomps/media-editor-01-procomp/reviews/2026-06-02-v0.1.0-spotcheck.md), [story-composer-01 v0.2.0](../../docs/procomps/story-composer-01-procomp/reviews/2026-06-02-v0.2.0-spotcheck.md)
- C2 type-export snapshot: [story-composer-01-v0.1.5-exports.snapshot.txt](../../docs/procomps/media-editor-01-procomp/story-composer-01-v0.1.5-exports.snapshot.txt)
- Pre-extraction handoff (C8 pause, frozen): [`HANDOFF-2026-06-02-media-editor-01-c8-paused-unpushed.md`](../HANDOFF-2026-06-02-media-editor-01-c8-paused-unpushed.md)
- Close handoff: [`HANDOFF-2026-06-02-media-editor-01-v0.1.0-and-story-composer-01-v0.2.0-CLOSED.md`](../HANDOFF-2026-06-02-media-editor-01-v0.1.0-and-story-composer-01-v0.2.0-CLOSED.md)
