---
date: 2026-06-02
session: media-editor-01-extraction-phase-a-first-half
phase: Phase A (extraction) commits C1-C8 of 22; PAUSED before C9
type: extraction
commits:
  - d4611c9  # C1: scaffold + F-cross-13 substrate verify + peer-dep lock
  - f7ba118  # C2: types.ts + barrel + v0.1.5 type-export snapshot
  - 11ea17e  # C3: git mv 7 hooks + mime-fallback + barrel + story-composer-01 imports
  - 826eb17  # C4: git mv 5 remaining lib files + CropRect/GradientPreset shape fix
  - b9e4c2f  # C5: git mv 16 parts + 3 symbol renames + backward-compat aliases
  - 81025f2  # C6: root orchestrator + use-media-editor-state.ts NEW + manifest entry
  - ffcadfa  # C7: presentation (inline/dialog/auto) + isOpen guard + dialog wrapping
  - f6dd4bd  # C8: capability gating (enabledModes/Tools/Sources/aspect + crop derivation)
components:
  - media-editor-01  # new procomp v0.1.0 (first half of Phase A complete)
  - story-composer-01  # v0.1.5 surface preserved via backward-compat re-exports; v0.2.0 wrapper refactor lands in Phase B
findings:
  - 8 commits clean; tsc/lint/meta-deps all green at every commit boundary
  - 74-name v0.1.5 public surface snapshot captured as backward-compat contract (much larger than plan's initial ~15-name estimate)
  - F-cross-13 substrate verified Radix-backed (NOT Base UI as engagement-bar-01 v0.3.0 precedent suggested) — defensive wiring NOT needed for v0.1.0
  - Cross-procomp dep convention established as FIRST inter-procomp runtime dep in library
status: PAUSED — 8 commits unpushed; resume from C9
---

# media-editor-01 extraction — Phase A first half (C1-C8 of 22)

**Slug:** `media-editor-01` (category: media)
**Source:** Extraction from `story-composer-01` v0.1.5 (tip `849c577`)
**Approach:** 22-commit chain across 3 phases (A=15, B=4, C=3)
**Outcome:** Phase A C1-C8 complete; 8 commits unpushed; resume at C9

## Decision summary

Authored GATE 1 description + GATE 2 plan via the procomp workflow on 2026-06-02 (same day as content-card-news-01 v0.3.0 session close at tip `849c577`). Both gates passed re-validation passes + deep cross-document audit + A+ trait additions. All 5 Q-Ps locked to recommended options.

Then executed C1-C8 of the locked 22-commit chain. Phase A's job is to lift the Konva-based capture + edit surface from `story-composer-01` v0.1.5 into a reusable procomp with controllable capability dials (`enabledModes` / `enabledTools` / `mediaSources` / `aspect`) so `content-composer-01` (the in-flight news/post/event/project authoring composer), `chat-panel` attachments, profile cover-photo edit, and CMS hero editors can all consume the same editor without forced story-shaped chrome.

**Same release** ships `story-composer-01` v0.2.0 as a thin wrapper around `media-editor-01` — proving the extraction is real, not theoretical (Phase B = C16-C19).

## Why pause at C8

User-requested pause. C8 completes the "capability dials wired" milestone — the central "partial use" promise from the description is now demonstrable in the Capability dials demo tab. Natural stopping point before C9 starts on the initialSource intake / CMS re-edit path.

Phase A remaining (~7 commits + ~3 days):
- C9: `initialSource` intake + `lib/initial-source-loader.ts` + validation rules (CORS / unsupported-file-type / mode-not-enabled) + Edit-only demo tab
- C10: ExportOpts + onProgress + video perf-shortcut + format dispatch
- C11: multi-instance guard + empty-state footgun
- C12: 5-tab demo + dummy-data + popover wiring
- C13: usage.tsx + meta.ts v0.1.0 finalized
- C14: registry.json — base + fixtures items
- C15: pre-Phase-B internal smoke + guide.md draft

Then Phase B (4 commits) → Phase C (3 commits) → push.

## Commit-by-commit log

### C1 (`d4611c9`) — chore: scaffold + verify F-cross-13 substrate + lock peer-dep versions
- Ran `pnpm new:component media/media-editor-01` → 7 scaffold files
- **F-cross-13 substrate verification** — grep confirmed all 3 primitives (Dialog, Slider, Popover) backed by `radix-ui ^1.4.3`; `@base-ui-components/react` NOT in package.json; PopoverAnchor + asChild both work. Defensive Base-UI-shaped wiring (engagement-bar-01 v0.3.2 patterns) NOT needed for v0.1.0.
- **Peer-dep version lock**: package.json shows `konva ^10.3.0` + `react-konva ^19.2.4` (plan initially guessed konva ^9.3 — corrected to v10 in description + plan).
- **meta.ts deps kept EMPTY** per `project_validate_meta_deps_lint` progressive-growth precedent. Deps grow as imports land.

### C2 (`f7ba118`) — feat: types.ts + index.ts barrel scaffold + v0.1.5 type-export snapshot
- Authored 460-line `types.ts` with 15 inherited editor types (copied verbatim from v0.1.5 to preserve shape) + 12 NEW types (InitialSource, SourceError, EditorCtx, MediaEditorState, EditAction, ExportImageOpts/VideoOpts/Opts, ExportMetadata, GradientPreset, MediaSource, CropRect, MediaEditor01Labels) + MediaEditor01Props (~32 props) + MediaEditor01Handle (22 methods) + DEFAULT_LABELS.
- Added additive non-breaking: AspectRatio gains "16:9" (was 4 values in v0.1.5; narrowing-style consumers unaffected).
- **Snapshot file `story-composer-01-v0.1.5-exports.snapshot.txt`** captures 74 named exports from v0.1.5 surface — significantly larger than the plan's initial ~15-name estimate. This is the backward-compat contract: every name must still resolve from `@ilinxa/story-composer-01` after v0.2.0.
- Minimal barrel scaffolded; hooks/lib/parts re-exports added progressively in C3-C6.
- media-editor-01.tsx + demo.tsx + dummy-data.ts updated to compile-stub state (throwing forwardRef + placeholder demo).

### C3 (`11ea17e`) — feat: move 7 hooks + mime-fallback via git mv
- `git mv` 7 hooks individually (use-camera-permissions, use-drawing-stroke, use-history, use-konva-selection, use-konva-stage-size, use-media-capture, use-pan-zoom) for history preservation.
- **mime-fallback pulled in early** — `use-media-capture` imports it, would have failed tsc otherwise. Plan said C4; effectively C3 moved 1 lib, C4 moved 4.
- `use-story-composer-state.ts` NOT moved — stays in story-composer-01 as its public export until C17 refactor.
- Story-composer-01 imports updated to use `../media-editor-01` barrel (FIRST cross-procomp dep in library).
- **`validate:meta-deps` caught the new cross-procomp dep** — story-composer-01/meta.ts updated with `internal: ["media-editor-01"]` to pass the lint.
- `git log --follow` traces correctly across the moves.

### C4 (`826eb17`) — feat: git mv 5 remaining lib files + CropRect/GradientPreset shape fix
- `git mv` built-in-stickers, composite-video, defaults, export-blob, konva-filters → media-editor-01/lib/.
- **Plan deviation**: lib/defaults.ts was supposed to "split" but actual inspection showed contents are 100% editor-shaped. Moved wholesale; no split. Story-shaped defaults (DEFAULT_STORY_COMPOSER_LABELS, DEFAULT_ADJUSTMENTS) already live in types.ts.
- **Critical shape fixes**:
  - CropRect: I added `aspect: AspectRatio` field in C2 (5 fields total). v0.1.5 ships 4 fields. Adding required fields IS breaking. Reverted.
  - GradientPreset.css: string → .background: string to match v0.1.5 contract.
- Intra-procomp import fixes: defaults.ts imports GradientPreset from `../types` (no longer redefines); composite-video imports selectRecorderMime from `./mime-fallback` sibling; export-blob imports CropRect from `../types` (was `../parts/tool-crop-overlay`).
- Story-composer-01/lib/ is now EMPTY (all 6 originals relocated across C3+C4).

### C5 (`b9e4c2f`) — feat: git mv 16 parts + 3 symbol renames + backward-compat aliases
- `git mv` 16 parts (13 as-is + 3 with file renames: composer-camera → editor-camera, composer-editor → editor-canvas, composer-toolbar → editor-toolbar).
- **Symbol renames inside the renamed files**: ComposerCamera → EditorCamera, ComposerEditor → EditorCanvas, ComposerToolbar → EditorToolbar.
- **Backward-compat aliases** in story-composer-01 v0.2.0 barrel: `export { EditorCamera as ComposerCamera, EditorCanvas as ComposerEditor, EditorToolbar as ComposerToolbar }` with @deprecated JSDoc.
- **`StoryComposer01Labels` compile-time shim** added to media-editor-01/types.ts as `@internal` (NOT exported via barrel). 10 moved parts referenced this story-shaped flat-label type; refactoring each is C17 territory. Shim mirrors v0.1.5 shape verbatim so parts compile post-move.
- **AspectRatio expansion** propagated: story-composer-01/types.ts now imports + re-exports AspectRatio from media-editor-01. story-composer-01.tsx adds explicit `useState<AspectRatio>` type annotation to prevent widening. ToolCropOverlay's `Record<AspectRatio, X>` tables expanded with "16:9" entries.
- **ToolCropOverlay decoupled** from `Required<StoryComposer01Labels>` prop to `cropLabel?: string` prop. story-composer-01.tsx usage updated from `labels={labels}` to `cropLabel={labels.toolCrop}`. Wasn't in v0.1.5 public snapshot so non-breaking.
- meta.ts trimmed shadcn deps: removed alert-dialog/popover/slider/toggle-group (moved with parts); kept button + dialog. Removed react-konva from npm (moved with editor-canvas); kept konva (still used as type-only in main wrapper).
- Story-composer-01/parts/ now has 3 remaining files (composer-shell, composer-publish-bar, publishing-progress-overlay — all story-shaped).

### C6 (`81025f2`) — feat: root component + use-media-editor-state.ts NEW + manifest entry
- Authored `hooks/use-media-editor-state.ts` (NEW, ~250 lines) — reducer-backed state machine with 13 action kinds. Pure editor concerns; no publish/upload state (those are consumer-owned per plan §"What media-editor-01 does NOT own"). Returns state + isDirty + activeTool + ~17 action methods. Fires `opts.onDirtyChange` on transitions (skips initial-mount).
- **Lint discipline**: initial draft used ref-write-during-render (4 React 19 lint errors). Refactored to proper `useState` + `useEffect` idioms.
- Replaced C2 throwing stub with real `media-editor-01.tsx` — forwardRef + useImperativeHandle exposing all 22 MediaEditor01Handle methods. 9 functional, 13 dev-warn stubs (real wiring lands in C7-C12).
- **Manifest entry brought forward from C13** to C6 (per pass-1 review fix) so `/components/media-editor-01` renders in `pnpm dev` from this commit onwards — enables docs visibility during C7-C12 verification.
- meta.ts: TODO description replaced with real description + 11 features + 8 tags.

### C7 (`ffcadfa`) — feat: presentation (inline/dialog/auto) + isOpen guard + dialog wrapping
- 2 new lib files: `presentation-resolver.ts` (single-rule auto logic per description §6) + `dialog-size-for-aspect.ts` (frozen Record<AspectRatio, DialogSize>).
- Wired shadcn `Dialog` + `DialogContent` + sr-only `DialogTitle`. Inner render extracted as const so it's reused in both inline + dialog branches.
- **CSS custom properties** (`--media-editor-dialog-w` / `-h`) carry aspect-derived size so Tailwind classes stay statically analyzable.
- **Mobile-fullscreen fallback** at `< md` breakpoint via `h-[100dvh] w-screen !rounded-none`.
- **Required-prop guard**: useEffect-based runtime dev-only `console.error` when presentation resolves to "dialog" but isOpen/onClose props missing. Once per instance.
- `close()` ref-handle method now functional (fires onClose in dialog mode); `open()` stays no-op + dev-warn.
- meta.shadcn: added "dialog" (progressive-growth lock).
- demo.tsx: "Inline" + "Dialog" tabs. Dialog tab has aspect picker exercising all 5 size derivations.

### C8 (`f6dd4bd`) — feat: capability gating (enabledModes/Tools/Sources/aspect + crop derivation)
- New `lib/resolve-crop-aspects.ts` encodes description §4 interaction rule.
- **All 4 capability dials wired** with visible affordances:
  - `enabledModes` drives top-center mode pill (auto-hides when < 2 modes)
  - `enabledTools` filters bottom toolbar (only enabled tools shown)
  - `mediaSources` switches canvas affordance label (Camera vs Upload)
  - `aspect` applies via inline `aspect-ratio: <num> / <denom>` style; data-aspect attribute for CSS targeting
- **Empty-state preview** when mediaSources is empty (warns about C11's footgun guard).
- **"Capability dials" demo tab** built with live toggles for all 4 dials — interactive demo of the "partial use" promise.
- State inspector visible in dev only (process.env.NODE_ENV gated).
- **Actual editor parts NOT composed yet** — C9 starts wiring the capture surface, C10 the canvas. C8 shows visual affordances of the gating result.

## Key technical decisions (deltas from plan)

| # | Decision | Why |
|---|---|---|
| D-1 | mime-fallback pulled into C3 from C4 | use-media-capture cross-dep otherwise fails tsc |
| D-2 | lib/defaults.ts wholesale-move (no split) | File is 100% editor-shaped; plan description was inaccurate |
| D-3 | CropRect kept at 4 fields (no `aspect`) | v0.1.5 shape preserved; adding required fields = breaking |
| D-4 | GradientPreset field rename css → background | v0.1.5 contract preserved |
| D-5 | StoryComposer01Labels @internal compile shim | 10 parts reference it; full refactor is C17 territory |
| D-6 | AspectRatio additive "16:9" | Description §15 requires 5; v0.1.5 had 4; narrowing-style non-breaking |
| D-7 | ToolCropOverlay decoupled from labels object | Was internal anyway (not in v0.1.5 public snapshot) |
| D-8 | F-cross-13 substrate = Radix, defensive wiring SKIPPED | C1 grep confirmed; plan + description updated |
| D-9 | Dialog size via CSS custom properties | Tailwind classes stay statically analyzable |
| D-10 | C8 shows visual affordances (not full parts compose) | Full Konva canvas integration is C9-C10 work; C8 stays focused |

## Cross-procomp dependency wiring (FIRST in library)

The extraction creates the first inter-procomp runtime dep. Plan §"Cross-procomp dependency wiring" locked the convention:

1. **Import path**: relative `../media-editor-01` (works dev + post-install — both procomps live in `media/` category dir; shadcn flattens both to `components/<slug>/` post-install so relative path resolves identically).
2. **Registry.json field**: `registryDependencies` (NOT `dependencies` — that's NPM peers; cross-registry-item deps use `registryDependencies` per shadcn convention). Lands in C19.
3. **meta.ts**: `internal: ["media-editor-01"]` in story-composer-01/meta.ts (caught by validate:meta-deps at C3 and required for lint).

Convention name: "sibling-category relative import + registryDependencies". Should be added to `.claude/CLAUDE.md` Gotchas + `docs/component-guide.md` after this extraction lands (probably C22).

## What's preserved for resume

- HANDOFF doc at `.claude/HANDOFF-2026-06-02-media-editor-01-c8-paused-unpushed.md`
- Description + plan locked + closed (GATE 1 + GATE 2 = CLOSED 2026-06-02)
- Snapshot file at `docs/procomps/media-editor-01-procomp/story-composer-01-v0.1.5-exports.snapshot.txt`
- All 8 commits internally consistent + verifiable per gates
- 8 commits unpushed — push when comfortable (Vercel auto-deploys but procomp not yet in registry.json)

## Lessons captured

1. **Snapshot before move surfaces hidden coupling.** The C2 type-export snapshot caught that story-composer-01's v0.1.5 public surface is 74 names — significantly larger than the plan's initial ~15-name estimate. Without the snapshot, C17's audit would have surprises.

2. **Plan's "split" description can be inaccurate.** lib/defaults.ts was described as splitting; actual contents are 100% editor-shaped. Trust file inspection over plan claims.

3. **Type shape regressions are easy to introduce when copy-paste-typing.** CropRect (5 vs 4 fields) and GradientPreset.css (vs .background) were both shape regressions in my C2 types.ts. C4 caught them when actual code referenced the original v0.1.5 shapes. Cross-check shape with the v0.1.5 source before authoring extracted types.

4. **F-cross-13 risk is point-in-time.** engagement-bar-01 v0.3.0 (2026-05-28) discovered Popover was Base UI. media-editor-01 (2026-06-02) finds it's reverted to Radix. The substrate isn't static. C1 substrate-verify is the right safety net.

5. **Cross-procomp imports need explicit conventions.** The validate:meta-deps lint properly caught the first cross-procomp dep at C3. Without this lint, we would have shipped story-composer-01 with an undeclared internal dep that breaks shadcn install ordering. The progressive-growth pattern + validate-meta-deps lint = essential pair.

6. **React 19 "no ref-access during render" rule is strict.** Initial draft of use-media-editor-state used `prevDirtyRef.current !== isDirty` during render (a common React 18 pattern). React 19 lint blocks this. The fix is straightforward — move into useEffect — but recognize the pattern shift.

7. **Dialog content sizing needs CSS custom properties to be Tailwind-safe.** Dynamic `width: ${px}px` works but loses Tailwind's compile-time class scanning. CSS variables consumed by static utility classes (`md:w-[var(...)]`) keep the static analysis intact while allowing runtime values.

8. **"Partial use" demos require their own UI surface — don't depend on the real parts compose.** Wiring EditorCamera + EditorCanvas + EditorToolbar requires Konva + camera + state-driven prop flow. C8's gating demo needs to show what the dials DO without that integration. Building a parallel demo UI (chips for tools, pills for modes) is the right call — keeps commits focused and reviewable.

---

**Status:** PAUSED at C8/22. 8 commits UNPUSHED. Resume from C9 per plan §"Implementation order (commit chain)".

**Resume entry point:** [`HANDOFF-2026-06-02-media-editor-01-c8-paused-unpushed.md`](../HANDOFF-2026-06-02-media-editor-01-c8-paused-unpushed.md)
