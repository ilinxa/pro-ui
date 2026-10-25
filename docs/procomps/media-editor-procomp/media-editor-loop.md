# Loop state — `media-editor` (U-loop)

## Run 2026-10-23 — B7 nested labels, overlay prop, @notImplemented, version pins

### Status

| Field | Value |
|---|---|
| **Mode** | U-loop (change class: minor) |
| **Current stage** | CLOSED — shipped in `85b9e87`, deploy verified 2026-10-23 |
| **Sign-off policy** | minor — delegated by user 2026-10-23 for the fix-now batch (docs/plans/fix-now-batch-plan.md); architect signs off contract B7 |
| **Version target** | v0.3.1 → v0.4.0 |
| **Model roster** | architect: main session · implementers: Sonnet 5 · finders: Sonnet 5 |
| **Started / updated** | 2026-10-23 / 2026-10-23 |

### Stage checklist

- [x] U0 Intake & impact — blast radius + reproduction recorded below
- [x] U1 Change contract — batch plan (docs/plans/fix-now-batch-plan.md); sign-off per policy above
- [x] U2 Implement — slice table below
- [x] U3 Gate battery — gates 1–8 green (batch gate battery, docs/plans/fix-now-batch-plan.md)
- [x] U4 Adversarial review — finders; findings table below
- [x] U5 Runtime & smoke — `pnpm build` ✓ (77 pages); consumer smoke (shadcn@4.18.0, local `public/r`): 23/23 installs exit 0, consumer `tsc` 0 errors; cssVars land only in `@theme inline`; base media-editor compiles without the capture slice
- [x] U6 Docs sync & GATE 3 — guides/meta current; minors reviewed in spotcheck files (Pass with follow-ups); patches: architect self-check (no review file per ladder) — review file `reviews/2026-10-23-v0.4.0-spotcheck.md` exists; GATE 3 closure pending
- [x] U7 Ship — `85b9e87` (fix-now batch) pushed to master; Vercel deploy verified 2026-10-23 (live `/r/*.json` carry the new files + `cssVars`). Decision: `.claude/decisions/2026-10-23-fix-now-hardening-batch.md`

### Contract

See `docs/plans/fix-now-batch-plan.md` row B7: (a) nested `labels` honored via normalizer (flat wins on conflict); (b) additive `overlay?: ReactNode`, last child of the inner box in both presentations; (c) `@notImplemented` on every warn-only handle type member; (d) version pins removed, guide corrected.

### Slice plan

| # | Slice | Owner | Status | Spot-check evidence |
|---|---|---|---|---|
| 1 | `lib/normalize-labels.ts` + `mergedLabels` memo | implementer | done | `media-editor.tsx` mergedLabels memo; `__tests__/normalize-labels.test.ts` |
| 2 | `overlay` prop (types + render as last child of `inner`) | implementer | done | `__tests__/overlay.test.tsx` (inline + dialog) |
| 3 | `@notImplemented` on handle members (types.ts) | implementer | done | types.ts handle block |
| 4 | Version pins removed (code, types, guide, description) | implementer | done | `validate-inert-surfaces.mjs media-editor` = 0 findings |
| 5 | meta 0.4.0 + guide (overlay, labels, handle table, known gaps) | implementer | done | meta.ts, guide |

### Invariants

| # | Invariant (testable) | Reviewed | Observed live |
|---|---|---|---|
| I1 | Nested `labels` keys change the rendered string | `normalize-labels.test.ts` | `overlay.test.tsx` renders "Foto" from `capture.modes.photo` |
| I2 | story-composer flat labels output byte-identical (flat wins, flat keys pass through) | `normalize-labels.test.ts` "flat only" / "mixed" | coordinator smoke |
| I3 | carousel-composer / content-composer compile unchanged (neither passes `labels` to MediaEditor; `overlay` optional) | grep | consumer tsc (coordinator) |
| I-neg | Non-string label values ignored; default English strings unchanged | `normalize-labels.test.ts` "ignores non-string" | — |

### Blast radius (U0)

| Surface | Why touched | Synced |
|---|---|---|
| story-composer | consumes media-editor; passes flat labels; B8 uses `overlay` | B8 run |
| carousel-composer | imports media-editor; passes no `labels`/`overlay` | compile unchanged |
| content-composer | imports media-editor (media-substrate); passes no `labels`/`overlay` | compile unchanged |
| media-editor-capture feature item | `featureOf: media-editor`; capture feature untouched | untouched |
| registry.json (media-editor item) | new shipped file `lib/normalize-labels.ts` must be added to `files[]` | coordinator |
| docs/procomps/media-editor-procomp guide + description | version pins removed, overlay documented | done |

### Reproduction

Direct consumer passes `labels={{ capture: { modes: { photo: "Foto" } } }}`: before the change the tab still read "Photo" (nested cast to the flat shape, `DEFAULT_LABELS` unused). After: reads "Foto".

### Gate battery

Batch-wide numbers copied from `docs/plans/fix-now-batch-plan.md` (2026-10-23).

| Gate | Result |
|---|---|
| tsc | exit 0, 0 errors (consumer-strict flags) |
| lint | exit 0 — 0 errors, 14 warnings (= known baseline) |
| meta-deps | exit 0 — 64/64 clean |
| registry validators | all exit 0: whitelist ✓ · registry-json 0 high / 6 warn (all pre-existing: filter-bar ×2, rich-text-editor `@platejs/resizable`, post-card ×2, project-card) · naming 0 · no-control-chars 1438 files · barrel-exports 0 high · inert-surfaces 0 · registry-tokens 0 (new) |
| doc validators | doc-drift ✓ (inside registry:build) · doc-budget ✓ |
| registry:build | exit 0 — 66 artifacts, artifact-size 0 high; `cssVars` + new files verified in `public/r/*.json` |
| build | exit 0 — compiled in 3.8 min, 77/77 static pages (first attempt OOM'd on a memory-starved host; retry clean) |
| tests (`NODE_ENV=production`) | exit 0 — **35 files / 263 tests** (first run of the session: 14 files + 21 worker-start timeouts — the known cold-start flake; retry clean, counts compared) |
| component tests (implementer run) | `NODE_ENV=production pnpm exec vitest run` media-editor `__tests__`: normalize-labels (4) + overlay (3) pass |

### Findings table

| # | Finding | Source | Verdict | Evidence | Fix |
|---|---|---|---|---|---|
| F-B1 | dark-theme `--destructive-foreground` near-white on the lifted red ≈ 2.8:1 (fails AA) | finder (B7/B8/T2) | CONFIRMED 🔸 | contrast computed 2.77 vs 6.96 near-black | dark → `oklch(0.13 0 0)`; registry fallback → `var(--background)` (adapts per theme) |
| F-B2 | media-editor `labels.publish.*` / `labels.empty.noSource` typed but inert | finder (B7/B8/T2) | CONFIRMED 🔸 | no consumer | `@notImplemented` + dev-warn once per mount; test |
| F-B5 | overlay corners square on the rounded inline surface | finder (B7/B8/T2) | CONFIRMED 🔹 | no radius | `rounded-[inherit]` |
| F-B6 | overlay docs lack z-index guidance | finder (B7/B8/T2) | CONFIRMED 🔹 | chrome at z-20/30 | guide + JSDoc: `z-40`+ |
| F-B7 | media-editor test named "honors nested labels end-to-end" only asserted a mount (implementer over-claimed) | coordinator | CONFIRMED 🔹 | test body | now asserts "Foto" renders |

<!-- Findings and the GATE verdict are filled by the architect. -->

### Parked

- `PublishingProgressOverlay` uses raw `bg-black` / `text-white` (story-composer) - token loop.
- story-composer description doc has 3 stale-deferral findings (`validate-inert-surfaces.mjs story-composer`).

---

# Run — Part 3 (social-platform request §5.5 ME1–ME4 + owed C17)

## Status

| Field | Value |
|---|---|
| **Mode** | U-loop (change class: **breaking** — C17 removes the `@internal` `StoryComposerLabels` shim from the public capture seam; 0.x minor) |
| **Current stage** | U1 — **awaiting sign-off** (Part 3 proposal) |
| **Sign-off policy** | user-interactive; composed by story-composer, carousel-composer and content-composer → breaking parts are always the user's call. Ask before every push. |
| **Version target** | v0.4.1 → **v0.5.0** (+ `media-editor-capture` 0.5.0), released **together with story-composer 0.6.0** |
| **Started / updated** | 2026-10-25 / 2026-10-25 |

Source: request §5.5 (`E:/tmp/social-ui-v2/PROUI_HANDOFF.md:1106-1156`) as amended by the digest §Part 3 "media-editor";
fix-on-touch ledger item **C17** (`.claude/procomp-loop.config.md`).

## Stage checklist (run Part 3)

- [x] U0 Intake — read-only intake agent (Sonnet 5) + architect verdicts (below)
- [ ] U1 Change contract — sign-off: pending
- [ ] U2 · [ ] U3 · [ ] U4 · [ ] U5 · [ ] U6 · [ ] U7

## U0 — Intake

Not in `closed`. Baseline: palette 7 (5 in the capture slice: `text-amber-400`, `bg-red-500` ×3; 3 red classes in
`parts/tool-text-input.tsx`), jsx-literal **39**, clock 4 (`Date.now()` ids / timing, none drive markup). Three test files.
Built **288.0 KB / budget 290**; capture 53.9 / 65.

| Item | Code today | Verdict |
|---|---|---|
| ME1 nested labels | `lib/normalize-labels.ts` maps 24 nested paths onto the flat shape (0.4.0) | already fixed |
| ME1 hard-coded strings | "Back to capture" (`media-editor.tsx:1172`), crop "Apply" / "Cancel", "({n} crop aspects)", "Reset zoom", `Resize ${corner}`, "Edit tools", "Delete text", `Color ${c}`, "Hex", file-intake / empty / error copy, capture "Camera ready" / "Enable camera" … (the 39 rows) | confirmed |
| ME1 preset names | English names in `lib/defaults.ts` (backgrounds, fonts), `lib/built-in-stickers.ts`, `lib/konva-filters.ts` (Instagram-style filter names); no label path | confirmed |
| ME1 typed labels, no story-composer cast (C17) | `story-composer.tsx:351` `as unknown as Partial<MediaEditorLabels>`; the public capture seam types `labels` with the `@internal` shim (`hooks/use-capture-extension.ts:54`) | confirmed (breaking) |
| ME2 palette | 7 classes, not "throughout"; the rest is black/white on media chrome (decision 3) | partial |
| ME3 stubs | capture methods, `addText()` with no text, `undo` / `redo`, `open()` all `@notImplemented` + dev-warn; gate clean | already self-disclosing |
| ME3 Ctrl+Z | the editor binds no keys (`useHistory({ bindKeyboard: false })`, `:400`). The **exported `useHistory` hook** calls `preventDefault` on Ctrl+Z even with an empty stack | request wrong for the editor; true for the hook |
| ME3 (wider) `VideoTrimBar` | exported, never mounted by the editor (renders fine standalone) | noted, kept |
| ME4 recorder prefers WebM | `lib/mime-fallback.ts:8-15` WebM first; used by `compositeVideo` and capture; `ExportVideoOpts.mimeType` exists but capture has no override; Firefox has no MP4 `MediaRecorder` | confirmed |
| ME4 accept / pass-through | both file inputs hard-code `image/*,video/*`; the validator accepts any `video/*`; no-overlay video export returns the original blob, but the tool chip row is not gated by draft kind (video drafts show chips that open nothing); guide example uses `mimeType: "video/webm"` | confirmed |

Blast radius: **story-composer** (wrapper; flat labels cast; `useMediaEditorState`; compat re-exports),
**carousel-composer** (`EditPanel` mounts `<MediaEditor>`; forwards `labels`), **content-composer** (substrate mounts it with
`capture`, no labels), the **capture slice** (imports the shim — must release with the base), carousel-composer's
inline copy of `validateGalleryFile`. **Orphans:** pre-P3 installs still hold six old capture files under `parts/` /
`hooks/` that compile only because the shim exists — C17 must ship the "Removed in — delete these" list.

## U1 — Change contract (proposed)

- **ME1 strings:** new label keys for every hard-coded string (English defaults identical), nested equivalents in
  `MediaEditorLabels` (optional groups, additive). `labels.presets?: { backgrounds?, fonts?, stickerSets?, stickers?,
  filters? }` (id → name maps; fall back to the constant). jsx-literal baseline → 0.
- **C17 (breaking):** delete the `StoryComposerLabels` shim. Parts and the capture seam take a public, typed labels
  type owned by media-editor. Flat keys stay accepted by `normalizeEditorLabels` (deprecated, not removed), so existing
  flat callers keep working at runtime. story-composer passes `labels.editor` without a cast (its run). Orphan list +
  `scripts/find-orphans.mjs` in the smoke consumer.
- **ME2:** the 7 palette classes → `destructive` / `warning` tokens; media chrome black/white → `--media-overlay` /
  `--media-overlay-foreground` (`cssVars.theme`, var fallbacks). Same look in the default theme.
- **ME3:** keep the stubs self-disclosing (implementing them is a product request). `useHistory` prevents Ctrl+Z only
  when there is something to undo / redo.
- **ME4:** `acceptMediaTypes?` (default `["image/*", "video/*"]`) drives both file inputs **and** the validator.
  `videoOutput?: { mimeTypes?: string[] }` allow-list for re-encode and capture (`selectRecorderMime(allowed)`); no
  match → video mode hidden + `onValidationError`. Defaults unchanged (WebM-first chain). Tool chips hidden for video
  drafts. Video export stays pass-through by default. Guide example fixed.
- **Tests:** `describeContract`, `locale="tr"` / labels (every string), hydration, RTL demo, accept / allow-list with a
  `MediaRecorder` stub, `useHistory` empty-stack, type test (story-composer passes labels without a cast). Falsify all.

### Invariants

| # | Invariant |
|---|---|
| I1 | flat label keys still accepted and still win over nested |
| I2 | `capture={mediaCapture}` seam and `MediaCaptureExtension` shape; handle member names |
| I3 | default accept string, MIME chain order, pass-through shortcut, image export output |
| I4 | `heavy: true`, `meta.slices`, `lib/` file names in `registry.json` |

### Size

288.0 KB / 290; estimate +5–7 KB → ~294. Budget → **300**.

### Open questions (in the proposal)

1. Release the breaking label change together with story-composer (recommended; it can't land alone).
2. MP4-only video output: on Firefox video capture is then unavailable. Acceptable?
3. Translatable preset names (`labels.presets`) as well as passing their own preset data? Recommendation: both.

### Platform reply (Part 3 run)

Platform reply `E:/tmp/social-ui-v2/PROUI_REPLY_2026-10-25_PART3.md`: scope signed off as proposed, including every breaking change. Release order: (1) story-viewer 0.5.4 → 0.6.0 · (2) media-editor 0.5.0 + story-composer 0.6.0 · (3) filter-bar 0.3.0 + entity-picker 0.2.0 · (4) post-card 0.6.0 + comment-thread 0.4.0 · (5) carousel-composer 0.3.0 (+ content-composer patch) · (6) app-sidebar 0.6.0, whenever convenient.

- Ships with story-composer 0.6.0 (release 2). MP4-only output accepted: on Firefox only in-browser recording is unavailable; uploading a video file still works.
- Preset names: as recommended (`labels.presets` + their own preset data).
