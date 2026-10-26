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
| **Current stage** | **Closed** — release 3 shipped `3259610`, live-verified 2026-10-26 |
| **Sign-off policy** | user-interactive; composed by story-composer, carousel-composer and content-composer → breaking parts are always the user's call. Push: the user granted push-without-asking for each Part 3 release after a final consistency review (2026-10-25). |
| **Version target** | v0.4.1 → **v0.5.0** (+ `media-editor-capture` 0.5.0), released **together with story-composer 0.6.0** |
| **Started / updated** | 2026-10-25 / 2026-10-25 |

Source: request §5.5 (`E:/tmp/social-ui-v2/PROUI_HANDOFF.md:1106-1156`) as amended by the digest §Part 3 "media-editor";
fix-on-touch ledger item **C17** (`.claude/procomp-loop.config.md`).

## Stage checklist (run Part 3)

- [x] U0 Intake — read-only intake agent (Sonnet 5) + architect verdicts (below)
- [x] U1 Change contract — **sign-off:** platform 2026-10-25 (`PROUI_REPLY_2026-10-25_PART3.md`); the user's go is given per release (order in the platform reply)
- [x] U2 Implement — user "go" 2026-10-25; slices A/B (media-editor) + C (story-composer), see "U2 result"
- [x] U3 Gate battery — two full runs, see "U3"
- [x] U4 Adversarial review — 2 code finders + browser finder; fix waves falsified, see "U4"
- [x] U5 Runtime & smoke — browser ✓ (re-verify 8/9 + crop-chip fix, falsified); installs ✓ (story-composer alone 4.18.0 + 3.8.5; capture + dependents 4.18.0; content-composer alone 3.8.5; the 3.8.5 dependency-already-installed abort = story-viewer F-01 class) — see "U5 — installs"
- [x] U6 Docs sync & review — guide / meta / usage / CHANGELOG / review file; smoke rows; pre-push consistency review (CR-1…) — see "Final consistency review"
- [x] U7 Ship — `3259610` pushed to master; live 2026-10-26 00:10 (media-editor 0.5.0, media-editor-capture 0.5.0, story-composer 0.6.0 served; story-composer no longer depends on capture)

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

### Pre-U2 scope review (2026-10-25) — corrections

Source: `.claude/review-2026-10-25-part3-scope.md` (fresh Sonnet finder + architect). Where these lines differ from the text above, these win.

- **Overlay focus:** while `props.overlay` is mounted the editor body is `inert` (+ test). No overlay → unchanged (invariant). [F-04]
- **ME4:** the pass-through shortcut's `"video/webm"` metadata fallback (`media-editor.tsx:881`) becomes the blob's type or the first allowed output type. [F-05]
- ME2 count corrected: 4 palette classes in the capture slice + 3 in `parts/tool-text-input.tsx` (7). [F-20]

## U2 — Implement (release 3, started 2026-10-25 on the user's go)

Architect decisions taken at U2 (the U1 contract left them open):

- **C17 shape.** `StoryComposerLabels` shim deleted. New public `MediaEditorResolvedLabels` (flat, fully populated, the
  existing flat key names kept, new keys added; templates are functions) is what parts and the capture seam
  (`MediaCaptureSurfaceProps.labels`) take. `MediaEditorLabels` (nested) is the only typed input: every group and key
  optional. Flat keys stay accepted at runtime by `normalizeEditorLabels` (deprecated). New public helper
  `editorLabelsFromFlat(flat)` → nested, for legacy flat callers (story-composer uses it).
- `labels.empty.*` becomes implemented (the editor's own empty / error copy). `labels.publish.*` (never rendered, no
  editor surface) is removed — breaking, in the migration note.
- `DEFAULT_LABELS` is aligned with the strings the editor actually renders (today it differs from the internal fallback).
- `locale?` prop added (trim-bar seconds and counts through `Intl.NumberFormat`).
- ME4 prop names fixed before the slices: `acceptMediaTypes?: string[]`, `videoOutput?: { mimeTypes?: string[] }`
  (declared in `types.ts` by the architect).
- Media chrome: scrims → `bg-media-overlay` (opacity adjusted to keep the look), white → `media-overlay-foreground`;
  the opaque black stage stays `bg-black` (tolerated over media, story-viewer precedent).

| # | Slice | Owner | Status |
|---|---|---|---|
| A | C17 + ME1: labels type, every hard-coded string, presets labels, `locale`, capture-slice labels, tests | Sonnet implementer (wave 1) | running |
| B | ME2 tokens · ME3 `useHistory` · ME4 accept / video allow-list / chip gating / webm fallback · overlay `inert` · tests | Sonnet implementer (wave 2, after A) | queued |
| — | registry.json roster + `cssVars.theme` media-overlay mapping, meta 0.5.0 + budget 300, guide, CHANGELOG, contract closure | architect | queued |

### U2 result (2026-10-25)

- Slice A (labels / C17 / `locale` / presets): done — 81 resolved keys, nested tree all-optional, `editorLabelsFromFlat`,
  `DEFAULT_LABELS` = rendered English (4 strings reconciled), 8 jsx-literal rows → 0; tests `labels-lib.test.ts`,
  `labels.test.tsx` (falsified, all CAUGHT except the "no warn" half of one test).
- Slice B (ME2 / ME3 / ME4 / `inert` / contract): done — palette 7 → 0, black/white → media-overlay tokens (`/70` panels
  get `backdrop-brightness-75`; opaque stage `bg-black` kept), `useHistory` empty-stack + Ctrl+Y, accept list + MIME
  allow-list + video-mode hiding + re-encode rejection + F-05 fallback, video drafts show no chips (no tool edits video),
  body `inert` + focus move/restore under `overlay`; tests `formats`, `contract-0-5-0`, `tokens`, `overlay`,
  `history-keyboard` (31 mutations; generic SSR test NOT CAUGHT — the MediaRecorder hydration test is the real one).
- Architect: `formatNumber` default `"en"` (was the runtime locale — server / client could differ); `now-ok` on the
  `onstop` `Date.now()`; registry roster (+`lib/format-number.ts`, `lib/preset-names.ts`), `cssVars.theme`
  media-overlay pair, versions 0.5.0 (base, fixtures, capture); baseline lowered — **0 rows**, `closed` += media-editor;
  meta 0.5.0, budget 290 → **330** (built 317.9 KB; U1 estimate ~294 was low); guide (Formats, Labels and locale,
  Overlay, Migration 0.4 → 0.5, orphan warning now mandatory), usage, CHANGELOG.

### U3 — Gate battery (2026-10-25)

| Gate | Result |
|---|---|
| tsc | exit 0, 0 errors |
| lint | exit 0 — 0 errors, 11 warnings |
| registry:build | first run exit 1: stale `scripts/heavy-edges-baseline.json` row (story-composer → media-editor-capture no longer exists — intended) → row deleted → exit 0; artifact-size 0 high (media-editor 317.9 / 300 before the budget raise, capture 53.7 / 65) |
| doc-budget | exit 0 |
| tests (`NODE_ENV=production`, threads) | 133 / 135 files, 1837 passed, 3 failed — all 3 from the stale baseline (registry-deps gate + served versions not regenerated); after the fix `registry-versions` + `registry-deps-gate` 30 / 30 |
| build | exit 0 (381 s) |
| validate-contract | 0 new violations; media-editor + story-composer 0 rows, 15 closed |

### U4 — Adversarial review (2026-10-25)

Fresh Sonnet code finder on a frozen snapshot (`ad9bb…`, 13 rows) + the story-composer finder's dependents axis + a
browser finder on `next start -p 3200`. Architect verdicts:

| # | Sev | Finding | Verdict | Fix (wave 1) |
|---|---|---|---|---|
| M1 | ⚠️ | `labels.shell.editTools` + `labels.trim.*` inert in `<MediaEditor>` (chip row has no toolbar role; trim bar never mounted) | CONFIRMED | chip row `role="toolbar"` + label; `trim` `@notImplemented` + dev-warn |
| M2 | 🔸 | `defaultMode="video"` + unrecordable allow-list stays video after hydration | CONFIRMED | post-hydration reset |
| M3 | 🔸 | `color-mix(… var(--media-overlay-foreground))` — the bare var is undefined in a consumer install | CONFIRMED | fallbacks + token test |
| M4 | 🔸 | English size-limit text changed ("2.25" → "2.3", "1000" → "1,000") — invariant I3 | CONFIRMED | no grouping, 3 digits |
| M5 | 🔸 | `overlay=""` / `0` / `true` makes the body inert with nothing shown | CONFIRMED | children-based check |
| M6 | 🔸 | overlay without a focusable control leaves focus on an inert element | CONFIRMED | host `tabIndex=-1` fallback |
| M7 | 🔸 | video hiding + `unsupported-codec` fire in upload-only configs; `presentation="auto"` flips | CONFIRMED | gate on camera + capture wired; presentation from declared modes |
| M8 | 🔹 | hover affordance lost (`hover:` = base) | CONFIRMED | visible hover |
| M9 | 🔹 | JSDoc says locale default is the runtime locale; brush / font sizes unformatted | CONFIRMED | fixed |
| M10 | 🔹 | stale JSDoc (`ExportVideoOpts.mimeType`, `overlay`, `acceptMediaTypes` extensions) | CONFIRMED | reworded |
| M11 | 🔹 | pass-through metadata reports 720×1280 and no duration (architect) | CONFIRMED | draft dimensions / duration |
| M12 | 🔹 | vacuous focus test; missing cases | CONFIRMED | tests added with each fix |
| M13 | 🔹 | handle identity changes with inline `labels` | CONFIRMED (optional) | label via ref |
| SC-2 | ⚠️ | dialog Escape / backdrop under an overlay opens the discard confirm or closes the host mid-upload (story-composer finder) | CONFIRMED | dialog ignores close requests while `overlay` is mounted |

Browser finder (`next start -p 3200`, Chromium + WebKit; 14 demo tabs, light + dark, zero console errors / hydration
warnings) — verdicts:

| # | Sev | Finding | Verdict |
|---|---|---|---|
| B1 | 🔸 | Tab sticks at the ends of an overlay in dialog presentation (focus trap targets inert body) | CONFIRMED → M14 (explicit wrap, story-viewer `focus-wrap` precedent) |
| B2 | 🔸 | Escape under the details step / error overlay opens Discard | = SC-2 |
| B3 | 🔸 | focus stays on DialogContent when the overlay mounts (dialog presentation) | CONFIRMED → M15 |
| B5 | 🔸 | text Color swatch collapses to 7 px in a narrow inline editor | CONFIRMED → M16 |
| B6 | 🔸 | new text overlay spawns off-centre (stage units) | CONFIRMED → M20 (timeboxed; park if pre-existing + large) |
| B7 | 🔸 | "(N crop aspects)" hint ~3.6:1 | CONFIRMED → M17 |
| B8 | 🔹 | touch targets < 24 px (align, aspect chips, sticker tabs, crop handles) | CONFIRMED → M18 |
| B10 | 🔹 | sliders ignore inherited `dir="rtl"` | CONFIRMED — follow-up (F-cross-13 carrier: Radix vs Base UI `dir`; owner: media-editor next patch) |
| B11 | 🔹 | focus lands on BODY after the controlled dialog closes | CONFIRMED — follow-up (host owns the trigger; guide note) |
| B12 | 🔹 | RTL demo leaks English (demo-only) | CONFIRMED → M19 |

### U4 fix wave (2026-10-25)

Sonnet implementer; tests in `__tests__/u4-fixes.test.tsx` (+ `formats`, `tokens`, `contract-0-5-0`); every fix
falsified — all CAUGHT. M1a toolbar role + label · M1b `labels.trim` `@notImplemented` + dev-warn · M2 post-hydration
reset · M3 `var(--media-overlay-foreground,currentColor)` + raw-var token test · M4 English size text identical
(`grouping:false`) · M5 `hasRenderableOverlay` · M6 + M14 + M15 new `lib/overlay-focus.ts` (host `tabIndex=-1`, Tab
wrap, dialog focus pull-back after Radix FocusScope's `focus(container)` — `@radix-ui/react-focus-scope` dist lines
71–85) · M7 `recordingReachable` + presentation from declared modes · M8 hover · M9 JSDoc + brush / font size via
`formatNumber` · M10 JSDoc · M11 new `lib/probe-video.ts` (real size / duration) · M16 `shrink-0` · M17 crop hint
`text-muted-foreground`, scrim text /60→/75, /70→/80 · M18 24 px targets (crop handles: 24 px hit area around the 14 px
dot) · M19 Arabic demo labels · SC-2 `onOpenChange` ignores close while an overlay renders.
Not taken: **M13** (handle identity — the hook result is a fresh object each render; pre-existing) and **M20** (new text
at a fixed `x:100, y:200` — pre-existing since `HEAD`) → follow-ups. Roster += `lib/probe-video.ts`, `lib/overlay-focus.ts`.
The overlay host is now an `absolute inset-0` box (was `display: contents`; a `contents` box cannot take focus).

### U5 — installs (2026-10-25/26)

`pnpm test:install` on the local `public/r` (commit charge 47.4 / 63.8 GB before starting — the earlier timeouts were
the host, and the old content-composer "timeout" was most likely the 3.8.5 overwrite prompt below waiting on stdin).

| Items | CLI | Result |
|---|---|---|
| `story-composer` | 4.18.0 | pass — story-composer 0.6.0 + media-editor 0.5.0, tsc 0, no `features/capture` in the consumer (pre-restart); re-run 2026-10-26 after CR-2/CR-3 on the rebuilt `public/r`: pass, tsc 0 |
| `story-composer` | 3.8.5 | pass, tsc 0 |
| `media-editor`, `-capture`, `story-composer-fixtures`, `carousel-composer`, `content-composer` | 4.18.0 | pass — 13 items, tsc 0 |
| same sequence | 3.8.5 | expected-fail — `content-composer` stops at "types.ts already exists. Overwrite?" (its media-editor dependency was installed by the earlier adds; `--yes` does not answer it), writes nothing, exit 0; json-form tsc errors are fallout. story-viewer F-01 class |
| `content-composer` alone | 3.8.5 | pass — media-editor 0.5.0 + capture 0.5.0 + the content-composer tree, tsc 0 |

### Final consistency review (pre-push, 2026-10-26)

- **Versions:** 0.5.0 / 0.5.0 / 0.6.0 on meta.ts, registry.json (base, fixtures, capture), `public/r`,
  component-versions, README, CHANGELOG, STATUS, both guides — consistent.
- **Roster vs folder:** media-editor, media-editor-capture, story-composer — missing 0, extra 0.
- **Claims vs code:** fresh Sonnet doc verifier (read-only) over CHANGELOG, both guides, meta, usage, registry.json —
  12 findings, all confirmed and fixed (recorded as CR-* in each review file): the migration table sent the renamed
  aliases `ComposerEditor` / `ComposerToolbar` / `ComposerCamera` to media-editor under their old names (High);
  `enabledTools` documented as gating export + handle methods (it filters the chip row); Cancel's label while uploading;
  `videoOutput` inert without `capture`; story-composer's exported label defaults never rendered (now equal the
  rendered English, script-diffed 0); `trimStart` / `trimEnd` inert + dev-warning in the demo (removed); stale sizes;
  `meta.ts` shadcn deps; four wording items. Video trim/bake and "no MediaRecorder" did not recur.
- **Counts:** media-editor 9 test files + story-composer 6 = 15 files / 193 passed (1 skipped), run alone.
- **Final battery (after the CR fixes):** tsc 0 · lint 0 errors / 11 warnings · `registry:build` 0 (validators 0
  findings) · doc-budget 0 · tests 138 files / 1900 passed / 6 skipped · `pnpm build` 0 (77 pages). Artifacts:
  media-editor 332.9 / 345 KB, capture 53.7 / 65, story-composer 74.5 / 80.

### U7 — Ship (2026-10-26)

`3259610` pushed to `master` (with `0cd1a7d`). Live poll (≥ 150 s apart): poll 1 (00:07) still 0.4.1 / 0.5.1; poll 2
(00:10) `/r/media-editor.json` 0.5.0 with `lib/probe-video.ts`, `/r/media-editor-capture.json` 0.5.0 (8 files),
`/r/story-composer.json` 0.6.0 with `parts/publish-details-step.tsx` and `registryDependencies`
`@ilinxa/media-editor, button, textarea`. Release 3 closed.


## Run — 0.5.1 patch (U-loop, 2026-10-26)

**Trigger:** platform reply `E:/tmp/social-ui-v2/PROUI_REPLY_2026-10-26_MEDIA_EDITOR_STORY_COMPOSER.md` — two requests;
user go 2026-10-26 ("patch first"). **Class:** patch (behaviour fixes, no public-API change) → architect self-check, no
review file, slug install + tsc. Bump 0.5.0 → 0.5.1 (capture follows). story-composer: no shipped file changes (gets
both fixes through its media-editor dependency) → stays 0.6.0; one new test there.

### U0 — intake / blast radius
- Follow-ups taken: **F-01** (text start position), **F-05** (focus on close) + story-composer **F-03** (same defect).
- Same class found while reading: sticker tray placed at a fixed `200,200` (comment claimed "canvas center"),
  `handle.addSticker` at `0,0` (half off the corner) — taken.
- Dependents: story-composer, carousel-composer, content-composer, capture slice — none passes coordinates or owns the
  dialog focus; behaviour change only (focus target on close, initial overlay position).

### U1 — contract
- Platform claim "Cancel and Escape already return focus" — **refuted** before fixing: Radix's modal content
  `onCloseAutoFocus` focuses `context.triggerRef` only (react-dialog dist line 146–148); hosts open the editor with
  their own button (no `DialogTrigger`), so Escape, Cancel and the post-publish close all left focus on `<body>`
  (reproduction below, red before the fix). A host `focus()` inside `onClose` is also undone (trap still active).
- Invariants: focus goes back to the element focused when the dialog opened, after every close path, only when focus
  was stranded (body / inside the closing dialog / the discard alertdialog) — a host that moves focus after the close
  wins; no Radix-only props (F-cross-13). New text / sticker = centre of (image rect ∩ viewport) in stage space,
  pan / zoom aware; text centred by its measured box.

### U2 — implement (architect, small diff)
- `media-editor.tsx`: opener captured in a layout effect when the dialog opens; restore in a passive effect on close
  (after the focus scope releases its trap); `DialogContent` ref for the "inside the closing dialog" check.
- New `lib/placement.ts` (`visibleImageCenter(stage)`, `measureTextBox` — canvas `measureText`, 0.6 em fallback in
  jsdom / SSR; type-only Konva import, lazy boundary intact); `EditorCanvas` names the base image node; text seed,
  sticker tray and `handle.addSticker` use it. Roster += `lib/placement.ts`.
- Tests: `story-composer/__tests__/focus-return.test.tsx` (real editor, export stubbed; Escape / Close / publish
  success / host-moves-focus-after-close) — **red 4/4 before the fix** (one by a wrong ctx name, fixed), green after;
  falsified (restore disabled → 3 fail). `media-editor/__tests__/placement.test.tsx` (geometry units + stub canvas
  with a fake stage: Text tool, tray, zoomed `handle.addSticker`) — falsified against the 0.5.0 file → 3 fail.

### U3 — Gate battery (2026-10-26)
tsc 0 · lint 0 errors / 11 warnings · `registry:build` 0 (validators 0 findings) · doc-budget 0 · tests **140 files /
1912 passed** / 6 skipped · `pnpm build` 0. Artifacts: media-editor **338.9 / 345 KB** (+6.0 KB — `lib/placement.ts` + the
focus restore; 6 KB headroom left, watch it), capture 53.7 / 65. Roster: missing 0 / extra 0 (43 files).

### U4 — Architect self-check (patch ladder)
Close paths all cross the `isOpen` true→false edge (Escape, Cancel / Discard via `requestClose`, host-driven); the
overlay's own focus hand-back runs before the restore (publish-success path proven in the browser); StrictMode
double-mount is a no-op (`wasDialogOpenRef` seeded with the current state); Base UI: no Radix-only props, and if a
Base UI `DialogContent` does not forward `ref` the check degrades to body / alertdialog only; `stageRef` is nulled by
the canvas ref callback on unmount, so text mode never reads a stale stage; saved overlay positions and exports are
untouched. Not covered (unchanged behaviour): a host that unmounts `<MediaEditor>` instead of setting `isOpen` false
gets Radix's default (no restore). No findings to fix.

### U5 — Runtime proof (production build, `next start -p 3200`, Playwright Chromium)
| Check | Desktop 1280×900 | Mobile 390×844 |
|---|---|---|
| story-composer demo: Escape → focus | BUTTON "Open composer" | BUTTON "Open composer" |
| story-composer demo: publish (demo uploader; `onPublished` closes) → dialog closed, focus | closed · "Open composer" | closed · "Open composer" |
| media-editor Chat demo (dialog): Escape → focus | BUTTON "Open editor" | — |
| 400×1600 PNG uploaded → Text tool | text centred on the image (screenshot) | text centred on the image (screenshot) |
| → sticker from the tray | centred on the image (screenshot) | centred on the image (screenshot) |

### U5 — installs
`story-composer` on CLI 3.8.5 + 4.18.0 → story-composer 0.6.0 + **media-editor 0.5.1** (incl. `lib/placement.ts`),
consumer tsc 0 both; `media-editor-capture` on 4.18.0 → capture 0.5.1 + media-editor 0.5.1, tsc 0.

### U6 — docs + consistency
0.5.1 on meta.ts, registry.json (base / fixtures / capture), `public/r`, component-versions, CHANGELOG (+ capture line),
STATUS, guide banner. Guides: media-editor "Focus on close" under Presentation, the "New text position" known gap
removed; story-composer Accessibility note. Follow-ups F-01 / F-05 (media-editor) and F-03 (story-composer) marked done
in their review files. Patch ladder: no review file. Decision `.claude/decisions/2026-10-26-media-editor-v0-5-1.md`;
report-back `.claude/report-back-2026-10-26-media-editor-0-5-1.md`.

### U7 — Ship (2026-10-26)
`0b5556a` pushed (with `58f8cc0`, `9df1a34`); live poll 2 (00:50) serves `/r/media-editor.json` 0.5.1 with `lib/placement.ts`. Patch closed.


## Run — 0.6.0 (U-loop, platform note M7E + F-05, started 2026-10-26)

### Status

| Field | Value |
|---|---|
| **Mode** | U-loop (change class: **breaking minor** — `ExportMetadata.width/height` and the default image export change values; composed by story-composer, carousel-composer(-editing), content-composer → always the user's call) |
| **Current stage** | **Closed** — shipped `143dcec`, live-verified 2026-10-26 23:27 |
| **Sign-off policy** | user-interactive (composed component). Push grant: **given 2026-10-26** — push after the pre-push doc verifier's fixes + re-run gates, then verify live. |
| **Version target** | v0.5.1 → **v0.6.0** (+ `media-editor-capture` 0.6.0); dependents per U1 |
| **Started / updated** | 2026-10-26 / 2026-10-26 |

**Trigger:** user go 2026-10-26 ("start the media-editor 0.6.0 U-loop with that check"). Input: platform note
`E:/tmp/social-ui-v2/PROUI_NOTE_M7E_MEDIA_EDITOR.md` (11 asks, production build, Chromium + WebKit) + carousel-composer
follow-up **F-05** (`docs/procomps/carousel-composer-procomp/reviews/2026-10-26-v0.3.0-platform-contract.md`).

### Stage checklist

- [x] U0 Intake — 2 fresh read-only Sonnet validators (asks split by subsystem) + architect spot-checks (below)
- [x] U1 Change contract — below; **sign-off: user 2026-10-26** (4 decisions, all as recommended)
- [x] U2 Implement · [x] U3 Gate battery (runs 1–7) · [x] U4 Adversarial review (2 finders, 26 rows) · [x] U5 Runtime & smoke (2 browser passes, 8/8 installs) · [x] U6 Docs & review (doc verifier, review file) · [x] U7 Ship (2 finders + dependents axis) · [ ] U5 Runtime & smoke (slug + ALL dependents + capture + carousel-composer-editing) · [ ] U6 Docs & review file · [ ] U7 Ship

### U0 — validation of the asks (source-level; runtime proof owed at U5)

Architect re-read the decisive lines: `parts/editor-canvas.tsx:205-229` (crop frame = 80 % of the stage),
`:234-247` (`node.cache()` deps `[image, activeFilter, adjustments]`; Konva 10.3 `Image._attrsAffectingSize = ['image']`),
`media-editor.tsx:255-287,495` (only 4 of 15 `EditAction` kinds emitted), `hooks/use-media-editor-state.ts:292-303`
(`isDirty`), `types.ts:278` (`ExportMetadata.width` documented as "Output pixel size").

| # | Ask | Verdict | Root cause (file:line) | Wider than reported |
|---|---|---|---|---|
| 1 | crop presets / free frame fit the stage, not the photo | CONFIRMED (mechanism mis-attributed) | auto-init frame `editor-canvas.tsx:205-229`; drag/resize clamps to stage `:612-636,677`; Apply intersects with the fit rect (`media-editor.tsx:1819-1841`) → a 1:1 preset on a letterboxed photo bakes non-square | `fitCropToStage` / `ToolCropOverlay` / `ASPECT_RATIO_VALUES` are exported but never used by the editor; Done with the crop tool still open exports the raw stage rect incl. letterbox (`media-editor.tsx:906-921`) |
| 2 | `textOnly` missing from state; text export via `foreignObject` | CONFIRMED both | `textOnly` is a separate `useState` (`use-media-editor-state.ts:247`); `exportText` → SVG `foreignObject` → canvas (`lib/export-blob.ts:131-147`) | text export ignores `format` / `quality` / `pixelRatio` (always 2× PNG); content-composer `lib/gates.ts:93` reads a typed text card as "no media" (same cause) |
| 3 | dialog grid tracks unconstrained | CONFIRMED | shadcn `DialogContent` is `grid` (auto tracks); `media-editor.tsx:2019-2048` adds none; root min-content (chip row `w-max` + in-flow crop panel) grows the track; no className prop exists | — |
| 4 | metadata = CSS px; output follows the stage; no size / region opts | CONFIRMED (image + text); video already real px | `media-editor.tsx:905,920-921`; `export-blob.ts:47-53,142-143`; `ExportImageOpts` `types.ts:251-260` | contradicts our own doc (`types.ts:278` "Output pixel size") → a bug, not a design; image export is down-sampled to the viewport (a 4000 px photo exports at 2 × stage) |
| 5 | `getIsDirty()` true after `initialSource` loads | CONFIRMED (by design) | `use-media-editor-state.ts:292-303` | **11 of 15 `EditAction` kinds (`text-*`, `sticker-*`, `draw-stroke`, `filter-apply`, `adjust-change`, `crop-set`, `undo`, `redo`) are declared, never emitted** — disclosed in the `onEditAction` JSDoc (so not an inert-surface defect), but the platform's ask needs them; `isDirty` ignores `adjustments`; the editor's own discard-confirm asks on an untouched `initialSource` photo. content-composer uses `getIsDirty` as "has media" at 3 sites → must NOT change; add `isModified` |
| 6 | focus not returned when the host unmounts on Done | PARTIAL | `isOpen` true→false path works (pinned by story-composer `focus-return.test.tsx`); unmount (no effect cleanup, `media-editor.tsx:1316-1338`) and inline presentation (no opener captured) are broken; `handle.close()` = `requestClose`, no focus | — |
| 7 | no export background colour | PARTIAL | Konva stage unfilled; preview bg `#000` is CSS on the container (`editor-canvas.tsx:110,337`); JPEG (default) flattens to black = preview, PNG/WebP keep alpha ≠ preview | video composite also `clearRect` (`media-editor.tsx:1041`) |
| 8 | chip row cut at ~396 px, no scroll cue | PARTIAL | no scroll cue — true (`media-editor.tsx:1919-1924`, scrollbar hidden); no "centred overflow clips the start" bug in the classes → the cut chips are most likely #3 (root wider than the overflow-hidden dialog). Re-check in the browser after #3 | `role="toolbar"` without roving tabindex / arrow keys |
| 9 | export during a crop source swap | CONFIRMED (mechanism; wording partly off) | Apply sets the new draft synchronously (`media-editor.tsx:1878-1887`) → `getSourceBlob()` new at once; `useImage` keeps the old element until load (`editor-canvas.tsx:866-907`); `exportImage` awaits nothing | same window on first `initialSource` load (stage mounted, `image === null` → blank export) and after `loadState({sourceBlob})`; a `useImage` error makes exports silently blank |
| 10 | overlays stored in stage CSS px | CONFIRMED, WIDER | text x/y/fontSize, sticker x/y, stroke points/brushSize, crop — all stage px; `loadState` replaces verbatim (`use-media-editor-state.ts:160`) | **crop Apply does not remap overlays** → after a crop they no longer sit on the same picture content, in one session |
| 11 | stale layout after crop closes | CONFIRMED symptom; **the proposed fix (reset pan/zoom) would not work** | stale Konva `node.cache()` bitmap: cache effect never re-runs on a fit-size change; 386/504 = 0.766 matches the reported ~0.77 | every stage resize after load (rotate, window resize) — and inline editors (carousel-editing, content-composer) resize on every crop open/close |
| F-05 | Done on an untouched photo bakes black bars | CONFIRMED | full-stage export (no crop) → transparent letterbox → JPEG black; carousel stores `metadata.width/height` (CSS, stage) as the item size | no image pass-through (video has one); any filter / text edit bakes the bars too |

**Blast radius:** story-composer (`story-composer.tsx:313-330,455,495-515` — forwards `metadata` + overlay coords to the
host uploader), carousel-composer-editing (`features/editing/parts/edit-panel.tsx:79-117` — inline, `cropAspects=[aspect]`,
stores metadata size + `editorState`), content-composer (`content-composer.tsx:190-211,281-310`, `parts/media-substrate.tsx:56-225`,
`lib/gates.ts:93,200` — persists `editorState` + `exportMetadata`, uses `getIsDirty` as "has media"), capture slice (no
handle/state use), `carousel-composer/types.ts:15` duplicate aspect union. Tests pinning behaviour: `u4-fixes.test.tsx`
(video metadata = real px). Size: **338.9 / 345 KB** (6 KB headroom).

**Parked:** `fitCropToStage` exported but stage-only (fix to take a bounds rect); toolbar roving tabindex; physical
`left`/`translate-x` dialog centring (marked `dir-ok`); `setDraft` revokes the old URL while it may still paint.

### U1 — Change contract (signed off by the user 2026-10-26)

User decisions: (1) `ExportMetadata.width/height` **fixed** to the blob's pixel size (our doc already promised it; video
already did) — breaking value change, migration table; (2) default image export stays the **full stage**; new opt-in
`region: "media"`; carousel-composer-editing uses it, and an untouched Done keeps the original item; (3) overlays:
**additive** `MediaEditorState.frame` + remap (no state-format change); (4) build now on the user's sign-off; the
platform gets the report-back at ship.

Public contract (architect-written in `types.ts` before U2 — the source of truth):

| Ask | Public surface |
|---|---|
| 1 | `CropAspect = AspectRatio \| "original" \| \`${number}:${number}\``; `cropAspects?: CropAspect[]` (invalid → dropped + dev-warn); label `crop.original`; frames laid out on / clamped to the photo's displayed rect; `fitCropToStage` gains an optional bounds rect |
| 2 | `MediaEditorState.textOnly?` (always filled by `getState`, restored by `loadState`); `textContent` / `textBackground` kept in sync while in text mode; text card drawn with Canvas 2D (`exportTextOnlyBlob` stays exported, `@deprecated`); `ExportMetadata.textOnly?` |
| 3 | grid tracks `minmax(0,1fr)` on the dialog content; `dialogClassName?` |
| 4 | `ExportImageOpts.region / width / height / maxEdge`; `pixelRatio` default 2, photo's own resolution for `region: "media"`; metadata = blob pixels; `ExportMetadata.frame?` |
| 5 | `handle.isModified()` + `EditorCtx.isModified` (set by any committed content change, cleared by a load / reset); discard confirm uses it; all content `EditAction`s emitted on commit (`undo` / `redo` stay unemitted — no undo stack); `getIsDirty` unchanged (content-composer reads it as "has media"), but now also counts adjustments |
| 6 | focus restore also on unmount-while-focused and in inline presentation; `close()` doc |
| 7 | `ExportImageOpts.backgroundColor?`; `canvasBackground?` prop (preview + export default fill) |
| 8 | inline-start / inline-end fade cue on the chip row when it overflows; re-check the cut chips after #3 |
| 9 | `handle.isSettled()` / `whenSettled({ timeoutMs })`; `exportImage` awaits it and rejects instead of exporting a blank canvas |
| 10 | `MediaEditorState.frame?: StateFrame` (stage size + media rect); `loadState` maps from it once the new layout is known; overlays follow the photo on every media-rect change (resize, rotate) and on crop Apply |
| 11 | re-cache the Konva image node when the fitted size changes |
| F-05 | carousel-composer-editing: Done with `!isModified()` keeps the item; else `export({ region: "media" })`, item size = blob pixels |

**Invariants (regression targets):** I1 `getIsDirty` semantics unchanged except adjustments; I2 default image export =
full stage at pixelRatio 2 (only the metadata numbers change); I3 video metadata / pass-through unchanged
(`u4-fixes.test.tsx`); I4 old snapshots (no `frame` / `textOnly`) load exactly as before; I5 flat labels still accepted;
I6 the 0.5.1 focus restore on `isOpen` true→false; I7 `exportPhotoBlob` / `exportTextOnlyBlob` / `useMediaEditorState`
signatures keep compiling for existing callers; I8 no new `EditAction` union members (exhaustive host switches).

**Slices:** A (Sonnet) — `lib/crop-aspect.ts`, `lib/frame-map.ts`, `lib/export-geometry.ts`, `lib/text-card-export.ts`,
`renderPhoto` in `lib/export-blob.ts`, `lib/resolve-crop-aspects.ts`, `parts/tool-crop-overlay.tsx`,
`parts/editor-canvas.tsx` (#1 frame + clamps, #11, new callbacks). B (Sonnet) — `media-editor.tsx`,
`hooks/use-media-editor-state.ts`, `parts/text-only-canvas.tsx` wiring (#2 sync, 3, 4 wiring, 5, 6, 7, 8, 9, 10 wiring).
Architect — typed stubs for A's modules (written before U2), carousel-composer-editing (F-05), docs.
**Size:** 338.9 / 345 KB, estimate +12–15 KB; budget set after the last fix wave.

### U2 — Implement (started 2026-10-26)

- **Architect, before the slices:** public contract in `types.ts` (+ `crop.original` label, `CropAspect` / `StateFrame`
  barrel exports); typed stubs for slice A's seams (`lib/crop-aspect.ts`, `lib/frame-map.ts`, `lib/export-geometry.ts`,
  `lib/text-card-export.ts`, `renderPhoto` + `ExportPhotoOptions.backgroundColor` in `lib/export-blob.ts`,
  `EditorCanvasProps.onMediaRect / onImagePainted(url, natural) / onImageError`). tsc after the contract: 6 errors, all
  owed by slice B.
- **Architect, F-05 (carousel-composer-editing):** `features/editing/parts/edit-panel.tsx` — Done with
  `!isModified()` closes like Cancel (no re-encode, no apply); otherwise `exportImage({ region: "media" })`, item size =
  blob pixels. `__tests__/editing-seam.test.tsx`: mock handle → `isModified` / `exportImage`; asserts the region and
  a new "Done with no change keeps the item" test — 8/8 alone; **falsified** (guard + region removed → both fail),
  restored.
- Slices A and B: two Sonnet implementers launched in parallel (background), briefs from the template.
- **Slice A** (Sonnet): the 4 seam libs, `renderPhoto`, `resolveCropAspects` widened, `fitCropToStage(…, bounds?)`,
  canvas #11 re-cache / #1 fit-rect frame + clamps / `onMediaRect` / `onImagePainted` / `onImageError`. 7 new test
  files (64 tests), mutation-falsified (one equivalent mutant). **Slice B** (Sonnet): state sync, `isModified` +
  EditActions, settled, export wiring, frame remap (a)/(b)/(c), dialog grid + `dialogClassName`, chip-row cue,
  focus on unmount / inline, `canvasBackground`; `shell-0-6-0.test.tsx` (39 tests), 35 mutations all killed.
- **Architect after the slices:** B parked "story-composer's mode switch `loadState({...getState(), mode})` now clears
  `isModified`" → a regression (edit → switch tab → Cancel closes without the discard confirm). Fixed with additive
  `LoadStateOpts.keepModified` (media-editor) + story-composer passes it (→ story-composer **0.6.1**); tests in
  `shell-0-6-0.test.tsx` and `story-composer-0-6-0.test.tsx` (mock gains `loadState` recording) — falsified (both fail
  without the fix), restored. Versions: media-editor / capture 0.6.0, story-composer 0.6.1, carousel-composer /
  -editing 0.3.1 (meta + CHANGELOG). Roster: 4 new `lib/` files added to the `media-editor` item; roster diff clean.

### U3 — Gate battery (2026-10-26, run 1 — `E:/tmp/ilinxa-release-kit/logs/battery-me060-1`)
tsc 0 · lint 0 errors / 11 warnings · `registry:build` 0 (all validators) · doc-budget 0 · tests (`NODE_ENV=production`)
**197 files / 2688 passed / 6 skipped** · `pnpm build` 0. Artifact **media-editor 401.7 / 345 KB** (−16.4 %, under the
1.2× hard fail; +62.8 KB vs 0.5.1 — U1 estimated +12–15: the shell grew ~800 lines) · capture 53.7 / 65.

### U4 — Adversarial review (2026-10-26) — 2 fresh Sonnet finders on the frozen snapshot `E:/tmp/ilinxa-release-kit/snap-me060`
Finder 1 = core correctness (17 rows, runtime probes P1–P3 under `E:/tmp/ilinxa-release-kit/finder1/`); finder 2 =
dependents / public surface / a11y / contract (20 rows). Merged + architect verdicts (F = finder 1, D = finder 2).
Fix owner: **A** = fix-wave implementer A (libs + canvas), **B** = fix-wave implementer B (shell + hook), **Arch** = architect.

| Row | Sev | Finding | Verdict | Owner |
|---|---|---|---|---|
| R1 (F1, D10) | ⚠️ | settled ignores the pending overlay remap → export right after crop Apply / `loadState` bakes pre-remap overlays; metadata read from the closure's stale state | CONFIRMED (probe P1) | B |
| R2 (F2, D3) | ⚠️ | image node always `cache()`d at device pixel ratio → `region:"media"` (and the 2× default on 1× screens, pre-existing) up-scales a screen-size bitmap | CONFIRMED (Konva `Node.js:177-193,285-295`) | A |
| R3 (F3, D4) | 🔸 | natural-resolution export uncapped → 48 MP photo exceeds iOS canvas area (blank / `toBlob` null) | CONFIRMED | A |
| R4 (F4) | 🔸 | hidden container (0×0) → `onMediaRect(null)` drops the media baseline → next resize maps by stage ratios (50 px off in probe P3) | CONFIRMED (probe P3) | A (canvas: no null while stage is 0) + B (keep baseline when media goes null for the same source) |
| R5 (F5, D7, D18) | ⚠️ | text-card export font = 7 % of card width vs preview `clamp(1.5rem,7vw,3rem)` (viewport) → 0.6× on desktop, different wrapping; no `ctx.direction` | CONFIRMED | A (options) + B (measure the live textarea) |
| R6 (F6) | 🔸 | Back leaves `isModified` true (Text tool auto-seeds an overlay) → discard confirm + F-05 re-encode; `text-add` with no compensating remove | CONFIRMED (probe P2) | B |
| R7 (F7, D1) | 🔸 | Back restores the entry snapshot's coordinates without its frame → displaced after a resize during the tool | CONFIRMED | B |
| R8 (F8, D12) | 🔹 | invalid `cropAspects` warns on every render | CONFIRMED | A (module-level dedupe) + B (memoize the call) |
| R9 (F9, D16) | 🔹 | text snapshot without `textOnly` keeps the old card; `handle.addText` in text mode invisible | CONFIRMED | B |
| R10 (F10, D17) | 🔹 | adjust debounce survives reset / load / new source; not flushed by an export | CONFIRMED | B |
| R11 (F11) | 🔹 | crop Apply in flight can be overtaken by `loadState`; export during Apply's encode is "settled" | CONFIRMED (source ordering) | B |
| R12 (F12) | 🔹 | `overrideUrlRef` not cleared by intake handlers → stuck unsettled after an odd `loadState` | CONFIRMED | B |
| R13 (F13) | 🔹 | `backgroundColor` / `canvasBackground` with `var()` / invalid → canvas ignores it | CONFIRMED | A |
| R14 (F14, D14, D15, D17) | 🔹 | doc mismatches: `pixelRatio` vs `maxEdge`; text card ignores `region` / `backgroundColor`; `frame` on composite video; per-keystroke `text-update` | CONFIRMED | Arch (types.ts docs, done) + B (frame on composited video) |
| R15 (F15) | 🔹 | selected item's Transformer handles baked into the export (pre-existing) | CONFIRMED | A |
| R16 (F16) | 🔹 | `onImagePainted` waits on rAF → hidden tab stalls `whenSettled` to the 10 s timeout | CONFIRMED | A |
| R17 (F17) | 🔹 | `getState()` can pair the committed state with a newer frame for one tick | PLAUSIBLE → fix with R1 | B |
| R18 (D2) | ⚠️ | story-composer `PublishMetadata` width/height now blob px while overlays stay stage px, no `frame` | CONFIRMED | Arch — `frame` / `textOnly` forwarded + documented, test falsified |
| R19 (D5) | 🔸 | sub-pixel dark fringe on `region:"media"` JPEG | PLAUSIBLE — U5 corner-pixel check after R2 | U5 |
| R20 (D6) | ⚠️ | content-composer still exports an untouched photo full-stage (bars) | DEFERRED — content-composer re-design (queued, owns F-04 / F-06); follow-up F-07 | content-composer |
| R21 (D8) | 🔸 | `isSettled()` true during the `initialSource` fetch / decode | CONFIRMED | B |
| R22 (D9) | 🔸 | canvas remount (mode switch, dialog reopen) keeps `paintedUrlRef` → "settled" on a fresh stage | CONFIRMED | B (tie painted to the stage instance) |
| R23 (D11) | 🔸 | discard confirm no longer covers an unedited camera / gallery capture (not in CHANGELOG) | CONFIRMED | B (confirm when modified OR captured this session; doc done) |
| R24 (D13) | 🔸 | carousel-composer-editing 0.3.1 on a vendored media-editor 0.5.1: `isModified` undefined | CONFIRMED | Arch — `typeof` guard |
| R25 (D19) | 🔹 | artifact 401.7 / 345 KB | CONFIRMED | Arch — budget after the last wave |
| R26 (D20) | 🔹 | inline unmount with focus on `<body>` (route change) focuses a stale opener | CONFIRMED | B (inline: restore only when focus was inside) |

### U4 fix wave 1 (2026-10-26)
- **Wave A** (Sonnet; libs + canvas): R2 (cache only when a filter / adjustment is active; exports re-cache the base
  image node at the export ratio, restored in `finally`), R3 (`NATURAL_MAX_EDGE` 4096 for the `region:"media"`
  default, `MAX_OUTPUT_PIXELS` 16 777 216 on every geometry result; single-canvas encode when sizes match), R4 canvas
  half, R5 lib half (`fontSizePx` / `textBoxWidth` / `direction`), R8 lib half (module-level dev-warning dedupe), R13
  (`resolveFillColor` via computed style), R15 (UI layer + transformer named and hidden during the render), R16 (rAF
  raced with a 100 ms timer). Every fix mutation-falsified; no row refuted.
- **Wave B** (Sonnet; shell + hook): R1 + R17 (commit tick; settled waits for pending AND committed remaps;
  `exportImage` / `getState` read the committed state + frame), R4 shell half, R5 shell half (`measureTextInput` via
  `data-slot="text-only-input"`), R6 + R7 (Back restores the entry flag, maps the entry snapshot onto the live frame,
  emits compensating removes), R8 shell half, R9, R10 (drop on reset / load / new source; flush on export; a
  `keepModified` round-trip flushes), R11 (`sourceEpochRef` token, Apply in flight = unsettled), R12, R14 (frame on
  composited video), R21 (`sourceLoadingRef`), R22 (painted tied to the stage instance), R23 (`capturedRef`: confirm
  when modified OR captured this session), R26. New `__tests__/shell-0-6-0-fixes.test.tsx` (31 tests); 26 mutations,
  one vacuous test found by its own mutation and replaced.
- **Architect:** R18 (story-composer `PublishMetadata.frame` / `textOnly`, falsified), R24 (`typeof isModified` guard),
  R14 docs, the two parked gaps: a second Apply press while the first encodes is ignored, and `rgb(0 0 0 / 0)` counts
  as transparent. **My first double-Apply test was vacuous** — the crop stub keeps one `release` slot, so a second
  encode could never complete; the mutation run caught it; the test now asserts one `toBlob` call. Both falsified
  through a Python harness (a `sed` regex mutation silently did not apply — check that a mutation APPLIED before
  trusting a green run).
- Demo: Edit-only tab gains a Region toggle (stage / media) and an output readout (`W × H px`, `modified`).

### U3 — Gate battery runs 2–3 (after fix wave 1)
- **Run 2:** `registry:build` 1 + tests 1 — `validate:registry-tokens` read the selector string
  `[data-slot="text-only-input"]` as a Tailwind `text-*` colour class ("only-input"). Renamed the slot to
  `textcard-input` (validator 0 findings). Lesson: a data-slot / selector string that starts with a utility prefix
  (`text-`, `bg-`, `border-`) is scanned as a class.
- **Run 3:** tsc 0 · lint 0 errors / 11 warnings · tests **198 files / 2758 passed / 6 skipped** · `pnpm build` 0 ·
  `registry:build` artifacts built, only `validate:artifact-size` red: **media-editor 422.9 / 345 KB** (over the 1.2×
  hard fail). Runtime (rolldown, Konva / React external, min + gzip): **0.5.1 25.5 KB → 0.6.0 32.8 KB gzip (+7.3,
  +29 %)**; the source artifact grew +84 KB (the shell ~+1 000 lines incl. JSDoc that ships vendored). Budget set at
  the final battery (after the browser fix wave), per the release-6 retro.

### U5 — Runtime (production build, `next start -p 3200`, started 2026-10-26)
Browser finder (Sonnet, brief `E:/tmp/ilinxa-release-kit/briefs/brief-me060-browser.md`) on media-editor /
story-composer / carousel-composer pages — results below.
**Browser finder result (Chromium, 1280×900 + 390×844, light / dark; WebKit not installed on this machine — not
covered; artefacts `E:/tmp/ilinxa-release-kit/browser-me060/`).** Console clean on all three pages; no page overflow
at 390.

| Row | Sev | Finding | Verdict |
|---|---|---|---|
| W1 | ⚠️ | text overlays draw at ~10 px whatever `fontSize`: the default font families are `var(--font-…)` strings, which a canvas rejects (`ctx.font` reads back `10px sans-serif`) — on screen and in exports; pre-existing since the fonts became tokens | CONFIRMED (in-page probe) → fix wave 2 |
| W2 | 🔸 | discard confirm → "Keep editing" leaves focus on `<body>` with the dialog open | CONFIRMED → fix wave 2 |
| W3 | 🔹 | inline editor: a tool panel's Apply unmounts → focus `<body>` (carousel edit panel) | CONFIRMED → fix wave 2 |
| W4 | 🔸 | `region:"media"` smears at 3000×2000 / 3000×2250 (right size, resampled; other sizes pixel-exact) | CONFIRMED → fix wave 2 (likely a ±1 px rescale in `renderPhoto`) |
| W5 | 🔹 | text card shows only the last 3 lines while editing a long text; the export draws all | DEFERRED — preview design (`rows={3}`); follow-up F-08 |
| W6 | 🔹 | text-card font is `clamp(1.5rem, 7vw, 3rem)` — viewport-relative, so card-relative size differs by viewport (the export now matches the preview) | DEFERRED — follow-up F-08 (container-query units) |
| W7–W8 | — | chip row narrower with Crop open (cue present); demo export after Reset errors (expected) | DROPPED |

**Passing (measured):** #3 dialog (Apply / Cancel inside the dialog box, clickable, both viewports, both themes) · #8
chip-row cue (LTR + RTL, flips on scroll) · #1 crop (every preset inside the photo, ratios exact to <1 %, drag /
resize clamped, 1:1 Apply → 960×960) · #11 (picture centred + fitted after Apply and across 1280→390→1280→700×600; an
export right after Apply has opaque photo corners) · #4 / F-05 (stage `W × H` = the blob's natural size; `media` = the
photo's own size, no letterbox, **no edge fringe — R19 refuted**; a 1600×1200 PNG round-trips with mean diff 0) ·
F-05 carousel (untouched Done keeps the same blob + size; an edit gives a bar-free item at the image's pixels;
re-edit puts the overlay back on the same content) · #5 discard (gallery / camera pick untouched → asks) · #6 focus
(every close path → the opener; carousel Done / Cancel → Edit) · #2 text card (export = preview for six fonts and
three gradients at both widths) · #10 overlays (same photo-relative spot across viewport changes; the sticker follows
a crop). Not reachable from the docs demos: an untouched `initialSource` in a dialog, `backgroundColor` /
`canvasBackground` (unit-tested only).

### U5 fix wave 2 (2026-10-26) — Sonnet implementer; all four rows mutation-falsified (harness prints "applied")
- **W1** `resolveCanvasFontFamily` (`lib/placement.ts`): a `var()` family is resolved through computed style (cached,
  SSR-safe, falls back to the `var()` fallback list) before it reaches Konva `<Text>` and `measureTextBox`; stored
  `fontFamily` stays the token. `__tests__/u5-fonts.test.tsx` (canvas stub rejects `var(` like Chromium).
- **W2** the discard confirm records the focused element when it opens and restores it (else the dialog content) when
  it closes without discarding. **W3** a tool closing with focus on `<body>` focuses its chip. `__tests__/u5-focus.test.tsx`.
- **W4** root cause confirmed by arithmetic: Konva sizes `toCanvas` as `floor(size × pixelRatio)`; with
  `pixelRatio = natural / media.width`, e.g. `309 × (3000 / 309) = 2999.9999999999995` → a 2999-px canvas for a
  3000-px target → the whole image resampled by 3000/2999. `snapPixelRatio` nudges the ratio by a few ulps; a Konva
  canvas within ±1 px of the target is copied 1:1. `__tests__/u5-export-pixel-grid.test.ts`.
- Media folder: 85 files / 1073 passed / 1 skipped; tsc / eslint / registry-tokens clean.
- Budget: `artifactBudgetKB` 345 → **440** (set at the final battery; rationale in `meta.ts`).

### U5 browser re-verify (fresh Sonnet, production build after fix wave 2; `E:/tmp/ilinxa-release-kit/browser-me060/reverify/`)
**W1–W4 PASS** — text overlays draw at `fontSize` (≈0.7 × size cap height; export 2×) and scale with a crop exactly
like stickers; "Keep editing" → focus on the editor dialog content (Chat + story-composer, 1280 / 390); a tool's Apply /
Back → its chip (media-editor Edit-only + carousel inline, every tool, both viewports); `region:"media"` pixel-exact
(diff 0 everywhere, edges 0) for 15 sizes at 7 window widths incl. 3000×2000 / 3000×2250. **Regression sweep PASS**
(#3, #1, #11, F-05 carousel, #6, #8); console clean on all three pages (every tab, both viewports); no page overflow.

| Row | Sev | Finding | Verdict |
|---|---|---|---|
| NEW-1 | 🔸 | narrow stage (390 → 256-px stage): the Text tool's seed overlay is centred by the placeholder width ("Type something…" ≈ 327 px at 40 px) → `x = −35.6`, text clipped ("ELLO"), baked into exports and the carousel item; hidden before W1 by the 10-px rendering | CONFIRMED → fixed by the architect: `visibleImageArea` + `fitTextInArea` (`lib/placement.ts`) — the seed shrinks (≥ 12 px) when wider than 90 % of the visible picture and is clamped inside it; `placement.test.tsx` (+3 tests), falsified (widened area → fails), restored |

### U3 — final battery (run 5, after NEW-1; `E:/tmp/ilinxa-release-kit/logs/battery-me060-5`)
tsc 0 · lint 0 errors / 11 warnings · `registry:build` 0 (all validators) · doc-budget 0 · tests (`NODE_ENV=production`)
**201 files / 2778 passed / 6 skipped** · `pnpm build` 0 (77 pages). Artifacts: media-editor **431.7 / 440 KB**,
capture 53.7 / 65, story-composer 75.2 / 80, carousel-composer 105.4 / 115, carousel-composer-editing 10.3 / 11. (Run 4
had two 5 s timeouts in comment-thread / entity-picker under load — 86 / 86 alone, known flake.) NEW-1 re-checked in
the browser on this build: 256-px stage → seed `x = 13.5`, `fontSize` 28, whole word visible in editor and export.

### U5 — installs (`E:/tmp/ilinxa-release-kit/installs-me060.sh`, `pnpm test:install` against local `public/r`)
| Run | Items @ CLI | Result |
|---|---|---|
| a | media-editor @ 4.18.0 | pass, tsc 0 — **no `features/capture` folder** (base alone ships no camera code) |
| b | media-editor + media-editor-capture @ 4.18.0 | pass, tsc 0 — `features/capture` lands |
| c | media-editor + media-editor-fixtures @ 3.8.5 | pass, tsc 0 |
| d / e | story-composer @ 4.18.0 / 3.8.5 | pass, tsc 0 — brings media-editor 0.6.0 |
| f | carousel-composer + carousel-composer-editing @ 4.18.0 | pass, tsc 0 |
| g | carousel-composer-editing @ 3.8.5 | pass, tsc 0 |
| h | content-composer @ 3.8.5 | pass, tsc 0 (10 component folders) |
Installed files carry `// @ilinxa/media-editor 0.6.0` / `carousel-composer-editing 0.3.1`; the 4 new `lib/` files land.

### U6 — pre-push doc verifier (fresh Sonnet, read-only; 2026-10-26)
Media suite 85 files / 1076 passed; inert-surfaces 64/64; doc-drift green; links 0 broken; roster + artifact sizes match.
11 rows: **2 code bugs** — the handle's `exportImage` threw in text mode (only `export()` reached the Canvas 2D card,
while the guide and the report-back told the platform to call `exportImage` for stories) → `exportImageOrText`
delegates; text cards had no 16.7 MP cap (docs said "every export") → capped. Both with tests, falsified (harness
prints "applied"). 9 doc rows fixed: text-card default PNG and `maxEdge` capping; `getIsDirty` "now also counts
adjustments"; seeding from `textBackground`; the `video/webm` fallback; the `region:"media"` coordinate formula (guide +
`ExportMetadata.frame` JSDoc + report-back); story-composer `meta.ts` floor 0.6.0+; the editing add-on's CHANGELOG
wording; what triggers the discard confirm (Escape / backdrop / `handle.close()` — a host Cancel must call `close()`).

### U3 — final battery after the doc-verifier fixes (runs 6–7)
Run 6: STATUS 0.1 KB over its budget (slimmed) + one new `exhaustive-deps` warning (`useImperativeHandle` deps named
`exportImage`, not `exportImageOrText`; fixed). **Run 7: tsc 0 · lint 0 errors / 11 warnings · `registry:build` 0 ·
doc-budget 0 · tests 201 files / 2780 passed / 6 skipped · `pnpm build` 0.** Artifacts: media-editor **431.7 / 440 KB**,
capture 53.7, story-composer 75.2, carousel-composer 105.4, carousel-composer-editing 10.3.

### U7 — Ship (2026-10-26)
`143dcec` pushed with `7902628` (23:14). Live poll (≥ 150 s apart): polls 1–3 (23:18–23:24) still 0.5.1; **poll 4
(23:27) `/r/media-editor.json` 0.6.0 with `lib/frame-map.ts` (stamp `@ilinxa/media-editor 0.6.0`),
`/r/media-editor-capture.json` 0.6.0, `/r/story-composer.json` 0.6.1, `/r/carousel-composer.json` and
`/r/carousel-composer-editing.json` 0.3.1**; `/components/media-editor` 200. Retro in `.claude/improvement-log.md`.
Follow-ups F-07 (content-composer), F-08 (text-card preview), F-09 (WebKit) in the review file. Run closed.
