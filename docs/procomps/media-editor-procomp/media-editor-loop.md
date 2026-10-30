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

# Run — release 8 (media-editor 0.7.0 + media-carousel 0.4.0 + carousel-composer 0.4.0 + post-card 0.8.0; platform request 2026-10-27, group 2)

Lead state doc for release 8; `media-carousel-loop.md`, `carousel-composer-loop.md` and `post-card-loop.md` carry
pointer sections.

## Status

| Field | Value |
|---|---|
| **Mode** | U-loop. media-editor **breaking minor** (canvas `aspect` / slot-context `aspect` widened to `"W:H"`) · carousel-composer **breaking minor** (`CarouselEditorPanelProps.aspect` widened) · media-carousel **minor** (additive) · post-card **minor** (forwarding + its inline `PostMediaItem` copy follows) |
| **Current stage** | CLOSED — shipped in `b3607dd`, live-verified 2026-10-29 16:45 (U7 below) |
| **Sign-off policy** | **delegated by user** for U1 and the push ("go ahead and start and finish release 8 … end to end", 2026-10-29). The two breaking widenings on composed components were put to the user separately (config: never delegated) — **approved 2026-10-29: "Yes, ship both"** (carousel-composer 0.4.0 + media-editor 0.7.0 with a migration note). |
| **Version target** | media-editor 0.6.0 → **0.7.0** (capture item follows) · media-carousel 0.3.1 → **0.4.0** (the planned 0.3.2 patch for MC-2 folds into it — one re-vendor for the platform) · carousel-composer 0.3.1 → **0.4.0** (+ `carousel-composer-editing` follows) · post-card 0.7.0 → **0.8.0** |
| **Model roster** | architect: main session · implementers: 4 × Sonnet 5 (A1 text card, A2 crop aspect + canvas aspect, B media-carousel + post-card, C carousel-composer + editing add-on) · finders: 2 × fresh Sonnet 5 (U4) + browser finder (U5) · doc verifier: fresh Sonnet 5 (U6) |
| **Started / updated** | 2026-10-29 / 2026-10-29 |

## U0 — Intake & impact

**Scope** (ground truth `.claude/platform-request-verification-2026-10-28.md` §Group 2; request text
`E:/tmp/social-ui-v2/PROUI_REQUEST_2026-10-27.md` §ME-1 / ME-2 / CC-1 / MC-1 / MC-2; MC-3 is ours, found at
verification). **Inbox check:** `E:/tmp/social-ui-v2/` listed by date — newest is our own release-7b reply; the
platform's `PROUI_REPLY_2026-10-28_VERIFIED.md` corrections for P-b are adopted below (single-entry `cropAspects` shows
no chip; MC-1 must not put a focusable toggle inside `aria-hidden`; re-check 4:5 / 1.91:1 feed rendering).

| Ask | Component | Folded in |
|---|---|---|
| ME-1 text card shows all lines at its export size (= our 0.6.0 F-08) | media-editor | export layout no longer assumes 3 rows |
| ME-2 `defaultCropAspect`, aspect in `crop-set` + `getState()`, chip names, `aria-pressed` | media-editor | stale `cropAspects` after mount (verified, source) |
| CC-1 shared aspect: any `CropAspect`, `aspectOptions` switch, every frame / edit / crop follows | carousel-composer (+ editing add-on) | square rail thumbs; edited-but-uncropped items exported at the photo's ratio; media-editor canvas `aspect` widened (would crash the dialog branch for `"W:H"`); media-carousel can't show 4:5 / 1.91:1 |
| MC-1 per-slide caption | media-carousel, post-card | single-item + `renderItem` paths must render it |
| MC-2 counter chip over the neighbour with 2 items | media-carousel | Embla's effective loop (edge margins, Prev/Next at the ends); `peekRatio` half-wired |
| MC-3 video labels + locale | media-carousel, post-card | video `alt` names the player |

**Not taken (owner + target unchanged):** media-editor C17 (`StoryComposerLabels` shim on the capture seam —
breaking, not asked) · F-07 content-composer export path (content-composer re-design) · F-09 WebKit pass (platform) ·
SC-1 uploader signal (story-composer / content-composer — not in release 8's plan; on request) · content-composer
`aspectOptions` passthrough (re-design).

**Blast radius**

| Surface | Relation | What must hold |
|---|---|---|
| story-composer | mounts media-editor; translates `EditorCtx` → `ComposerCtx` | compiles unchanged (tsc after the type edits: 0 errors outside the 3 folders); its tests green |
| content-composer | mounts media-editor (`media-substrate`) and carousel-composer + editing add-on (`media-carousel-substrate`, `aspect` typed by media-editor's `AspectRatio`) | narrower types still assign; its tests green; no change unless a test fails |
| carousel-composer-editing | feature item, mounts media-editor with the carousel aspect | passes a `"W:H"` canvas aspect + `cropAspects=[aspect]`; Done exports at the shared aspect |
| media-editor-capture | feature item | untouched; version follows the base |
| post-card | composes media-carousel; inline copy `PostMediaItem` + its own `aspect` union | copy gains `caption`, union gains `"W:H"`, forwards caption / video labels; guard test keeps the copy equal |
| media-carousel-01 / media-carousel-editor-01 / media-editor-01 | alias items | resolve |
| fixtures items | install + consumer tsc | |
| Docs | 4 guides (+ migration rows for the two breaking widenings), STATUS rows, component-versions, CHANGELOG, generated llms / README, `meta.ts` budgets | U6 |

## U1 — Change contract (sign-off recorded above)

**Public types written by the architect before U2** (search the files for "0.7.0" / "0.4.0"):
`media-editor/types.ts` (`CanvasAspect`, `aspect`, `defaultCropAspect`, `cropAspects` re-sync note, `crop-set`
`aspect` + `ratio`, `MediaEditorState.cropAspect`, `labels.crop.aspect`, `EditorCtx.aspect`) ·
`media-carousel/types.ts` (`MediaCarouselAspect` + `"W:H"`, `MediaItem.caption`, `captionLines`, `captionClassName`,
`labels.captionShowMore` / `captionShowLess` / `video`, `peekRatio` wired, `locale` reaches videos) ·
`carousel-composer/types.ts` (`CarouselAspectRatio` = media-editor's `CropAspect`, `CarouselCropRect`, item `crop`
from `export()`, `aspect` controlled + `defaultAspect` + `onAspectChange` + `aspectOptions`, `labels.aspectSwitch` /
`aspectOption` (optional — the 7b lesson), panel `aspect` without `"original"` + `aspectRatio`, `handle.getAspect`).
`tsc` after the edits: 8 errors, all inside the three folders (the work), none in dependents.

**Architect decisions**
- **One media-carousel release (0.4.0)**, not 0.3.2 then 0.4.0: the platform re-vendors once; MC-2 is a fix inside it.
- **ME-1:** the card is the reference box. Font size and wrap width are container-relative (`cqi` on the card), the
  textarea grows with its content (JS height from `scrollHeight`, no reliance on `field-sizing`), and when the text
  is taller than the card the font steps down to a floor so every line stays visible. The export draws the lines
  where the preview shows them (no `ROWS = 3` block). Beyond the floor the input scrolls — documented limit.
- **ME-2:** `defaultCropAspect` is mount-time (like `defaultMode`); `cropAspects` changes are followed while mounted
  (the stale-aspect fix); `crop-set` carries `aspect` and the resolved `ratio` (needed for `"original"`); chips get
  `aria-pressed` and their names from `labels.crop.aspect(aspect, format)`.
- **Canvas `aspect` takes `"W:H"`** (user-approved breaking widening): CSS ratio, capture crop ratio and dialog sizing
  (orientation from the ratio) all read it; invalid → `"free"` + one dev warning. `"original"` stays crop-only.
- **MC-1 caption lives inside its slide group, under the frame** (outside the `overflow-hidden` aspect box): read once
  with its slide, inactive slides keep `aria-hidden` + `inert`, the image keeps `alt ?? ""` — no `aria-describedby`
  (a visible described-by caption reads twice) and nothing focusable under `aria-hidden` (axe). expandable-text
  (cross-category, `data/`) is a static `@/registry/…` import + `registryDependencies`. Layout: slides align to the
  start and the viewport follows the active slide's height, so an item without a caption takes no space; when any
  item has a caption the dots render in flow below the slides (never over a caption) and the nav buttons stay
  centred on the media frame.
- **MC-2:** the counter chip renders inside the active slide's frame (gallery and linear), so it can never sit over
  a neighbour; edge margins and Prev / Next at the ends follow Embla's **effective** loop (Embla turns loop off when
  the slides can't fill it); slide width = `1 − 2 × peekRatio`.
- **CC-1:** `"auto"` snaps to the nearest of `aspectOptions` (else the four standard ratios); `"original"` = item 1's
  ratio (1:1 until known) and reaches the edit panel as `"W:H"`; rail thumbs keep their height and take the shared
  ratio; the editing add-on locks media-editor to the aspect (`aspect` + `cropAspects=[aspect]`) and **Done exports
  at the shared aspect** (`region: "media"` with a width / height of that ratio inside the photo's own pixels — no
  upscale), so an edited item no longer comes back at the photo's ratio. `export()` adds the centred `crop` per image.
  The switch shows only while item 1 is selected and nothing is being edited. `"free"` keeps today's behaviour.
- **post-card 0.8.0** follows media-carousel: copy gains `caption`, `aspect` gains `"W:H"`, forwards `captionLines`
  and the new carousel labels through its existing media props.

**Invariants**

| # | Invariant (testable) | U4 | U5 |
|---|---|---|---|
| I1 | A 6-line text card shows 6 lines while editing at 390 px and 1440 px; the export's line breaks and positions match the preview (pixel-compared) incl. 1 line, a long unbroken word, RTL | | |
| I2 | `defaultCropAspect="4:5"` opens Crop on 4:5 with its frame; Apply after picking 1:1 emits `crop-set` `{ aspect: "1:1", ratio: 1 }`; `"original"` reports the photo's ratio | | |
| I3 | A mounted editor given a new `cropAspects` that drops the selected aspect selects the new default / first entry (no remount) | | |
| I4 | `"1.91:1"` chip reads "1.91:1" (locale digits), custom names via `labels.crop.aspect`, chips `aria-pressed` | | |
| I5 | Canvas `aspect="1.91:1"` renders a 1.91 frame inline and in the dialog branch (no crash); invalid → free + one warning | | |
| I6 | `getState().cropAspect` round-trips through `loadState` | | |
| I7 | Two captioned items: swiping changes the visible caption; each is read once (axe clean, no focusable in `aria-hidden`); an item without caption takes no space; single-item and `renderItem` paths render captions | | |
| I8 | 2 items, gallery, loop: counter chip lies inside the active slide's box (browser layout); Prev / Next at the ends handled when Embla dropped the loop | | |
| I9 | Video slides name the player from `alt` / `labels.video`, time text in `locale`; no English leaks with a Turkish labels object | | |
| I10 | `aspect="4:5"` / `"1.91:1"` on media-carousel renders that frame | | |
| I11 | carousel-composer `aspectOptions={["original","1:1","4:5","1.91:1"]}`: switching on item 1 reframes every thumb + the preview; the edit panel locks to it; an edited-but-uncropped item exports at the aspect; `export()` crop of an unedited item matches the aspect, centred | | |
| I-reg | 0.6.0 / 0.3.1 / 0.7.0 suites green unchanged (except tests asserting the replaced behaviour, listed); dependents' suites green | | |
| I-neg | carousel-composer base install has no media-editor file; media-carousel without captions renders as 0.3.1 (dots overlaid as before) | | |

## U2 — Implement

| # | Slice | Owner | Files | Status |
|---|---|---|---|---|
| A1 | ME-1 text card | Sonnet | `media-editor/parts/text-only-canvas.tsx`, `lib/text-card-export.ts`, in `media-editor.tsx` only `measureTextInput` + `exportText` | pending |
| A2 | ME-2 + canvas `aspect` | Sonnet | rest of `media-editor` (not A1's), `lib/*aspect*`, `hooks/use-media-editor-state.ts`, `lib/normalize-labels.ts`, label defaults | pending |
| B | MC-1/2/3 + `"W:H"` aspect; post-card follows | Sonnet | `media-carousel/**`, `data/post-card/**` (not meta / usage) | pending |
| C | CC-1 | Sonnet | `carousel-composer/**` incl. `features/editing/` (not meta / usage) | pending |

### U2 — results (2026-10-29)

All four slices done; spot-checked by the coordinator (file:line read): A1 card `containerType: "size"` + `cqi` font /
width + fit with a 14 px floor (`parts/text-only-canvas.tsx`), export placed from `textTopPx` / `lineHeightPx`
(`lib/text-card-export.ts` `textBlockTop`, `measureTextInput`); A2 `isValidCanvasAspect`, `defaultCropAspect`,
render-phase stale-list follow in `hooks/use-media-editor-state.ts`, `crop-set` `aspect` + `ratio`, chips
`aria-pressed` + `cropAspectName` (A2 added the flat `MediaEditorResolvedLabels.cropAspectName` — accepted: the
nested→flat table needs it); B caption part `parts/slide-caption.tsx`, Embla effective loop from
`internalEngine().options.loop` (`embla-carousel.esm.js:1528,1628`), chip in the active frame, post-card copy +
`PostMediaVideoLabels`; C `lib/aspect.ts` resolution + `centredCropRect`, `parts/aspect-switch.tsx`, thumbs, panel.
**Coordinator fix during spot-check:** C's Done export sized a first edit from the item's own `width` / `height` — an
applied crop had already replaced the editor's photo with a smaller one, so the export would upscale it (3× for a
1000-px crop of a 4000-px photo). Now always measured by a plain `region: "media"` export first, then trimmed; the
two tests that pinned the shortcut were rewritten, plus a small-crop regression test (6/6). New test files: 7 (A1 1,
A2 1, B 4, C 2 — incl. post-card `forwarding-0-8-0`). Roster: `parts/slide-caption.tsx` and `parts/aspect-switch.tsx`
added to `registry.json`; media-carousel gains `@ilinxa/expandable-text`.

### U3 — battery run 1 (2026-10-29)

tsc 0 · lint 0 errors / 11 warnings (contract: no new violations) · `registry:build` 0 · doc-budget 0 · tests **227
files: 3129 passed / 6 skipped / 7 failed — all 7 are 5 s timeouts in unrelated files under host load** (6 `tests/*-gate`
repo tests + one code-block test; re-run alone before the ship) · `pnpm build` 0. Artifacts vs budget: media-editor
444.4 / 440, media-carousel 69.1 / 60, carousel-composer 117.7 / 115, -editing 11.3 / 11, post-card 191.9 / 200,
capture 53.7 / 65 — budgets set at the final battery.

### U4 — adversarial review (2 fresh finders on a frozen snapshot; architect verdicts)

| # | Finding | Verdict | Fix |
|---|---|---|---|
| F1-1 ⚠️ | edit-panel wrapper (`overflow-hidden` + ratio) clips the editor's 400 px surface at wide ratios (1.91:1 on a phone ≈ 187 px) | CONFIRMED (pre-existing for 16:9, headline now) | FX-A A1: drop the wrapper ratio — the editor locks its own canvas |
| F1-2 | controlled `aspect` + `aspectOptions` without `onAspectChange` → a switch that does nothing, silently | CONFIRMED (inert-surface class) | FX-A A2 dev warning |
| F1-3 | unguarded `Intl.NumberFormat(locale)` (`"tr_TR"` throws) and grouped digits (`"1,920:1,080"`) | CONFIRMED | FX-A A3 |
| F1-4 | thumbs clamp width → 9:16 / 21:9 thumbs off-ratio | CONFIRMED | FX-A A4 |
| F1-5 | inline canvas `min-h-64` beats `aspect-ratio` for wide custom aspects; capture crop disagrees | CONFIRMED (pre-existing for 16:9) | FX-A A5 |
| F1-6 | dialog orientation by `ratio > 1` only — 5:4 / 4:3 hit the height clamp | CONFIRMED, Low, pre-existing (`"free"` = 4:3 already) | follow-up FU-3 |
| F1-7 | inline CSS ratio built from the raw string | CONFIRMED Low | FX-A A5 |
| F1-8 | whitespace accepted by the composer, rejected by the editor | CONFIRMED | FX-A A8 |
| F1-9 | content-composer: edited items now trimmed to the shared aspect, unedited not; `crop` never reaches its payload; `"auto"` 4:3 → 1:1 | CONFIRMED as behaviour change (intended by CC-1) | doc: content-composer guide + migration; payload → content-composer re-design |
| F1-10 | items edited before a switch stay at the old aspect | CONFIRMED (by design — re-edit restores the source) | doc |
| F1-11 | `getState()` identity changes on a chip pick; reset keeps `cropAspect` | CONFIRMED, accepted | doc |
| F1-12 / 13 / 14 | `aspectOptions` not de-duplicated; re-pick fires `onAspectChange`; `centredCropRect` tolerance on tiny images | CONFIRMED Low | FX-A A12 / A13 / A14 |
| F1-15 | add-on 0.4.0 on base 0.3.1 fails to compile (`centredCropRect`) | CONFIRMED (registry deps can't pin versions) | doc: update both |
| F1-16 | new optional labels stay English with a full 0.3 labels object | CONFIRMED, by design (7b lesson) | doc |
| F1-types | new required members: `crop-set` `aspect` / `ratio`, `MediaEditorResolvedLabels.cropAspectName`, `CarouselComposerHandle.getAspect`; `CarouselAspectRatio` / deprecated `AspectRatio` alias widened | CONFIRMED — only hosts that CONSTRUCT these (mocks, fixtures, hand-built resolved labels) | migration rows in both guides |
| F2-1 | effective loop false → true never re-measures | CONFIRMED | FX-M M1 |
| F2-2 | a focused Prev / Next that becomes `disabled` drops focus to `<body>` | CONFIRMED (introduced here) | FX-M M2 `aria-disabled` |
| F2-3 | measured height stale after `items` change (detached node observed) | CONFIRMED | FX-M M3 |
| F2-4 | first-paint shift; no-ResizeObserver path never measures | CONFIRMED | FX-M M4 |
| F2-5 | `peekRatio` unclamped now that it is wired (0.5 → 0 % slides, NaN invalid) | CONFIRMED (introduced here) | FX-M M5 |
| F2-6 | text card never re-fits after a late web-font load | CONFIRMED | FX-T T6 |
| F2-7 | 176 px reserve < bottom bar with the gradient picker open | CONFIRMED | FX-T T7 |
| F2-8 | empty card's placeholder cut to one row | CONFIRMED (introduced here) | FX-T T8 |
| F2-9 | media-carousel `"W:H"` parser stricter than the editor's | CONFIRMED Low | FX-M M9 |
| F2-10 | 0.3.1 DOM differences without captions (inner wrapper, chip in the slide, `aria`-disabled ends, inline flex basis, single-item wrapper) | CONFIRMED, accepted | doc (guide "Upgrading to 0.4.0") |
| F2-11 | 2-item loop: slides jump ≈ 7.5 % after mount (margins land after Embla's first measure) | CONFIRMED Low | follow-up FU-4 |
| F2-12 | export vs preview details: (a) trailing space trimmed, (f) stale fallback constants; (b–e) baseline / rounding / shadow / past-floor | (a)(f) CONFIRMED; (b–e) accepted, documented | FX-T T12a / T12f |
| F2-13 | 1 px fit steps (≤ 34 reflows per keystroke) | CONFIRMED Low | FX-T T13 binary search |
| F2-14 | inline `labels.video` object → new player labels identity per render | CONFIRMED Low | doc (memoise `labels`) |

### U4 — fix wave (3 parallel implementers: FX-M media-carousel, FX-T text card, FX-A aspect pipeline)

Every CONFIRMED row above fixed with a regression test (new files `media-carousel/__tests__/r8-fixes.test.tsx`,
`media-editor/__tests__/text-card-0-7-0-fixes.test.tsx`, `carousel-composer/__tests__/aspect-pipeline-fixes.test.tsx`,
`media-editor/__tests__/canvas-placeholder-aspect.test.tsx`). Falsified: FX-M 7 of 8 tests red on revert (the M9
"accepts" test cannot go red — the old parser accepted a superset; the reject test covers it); FX-T 5 red on revert;
FX-A ran only 5 of its rows red, so the coordinator falsified the other five with an assert-and-restore script
(A1, A2, A3 grouping + guard, A4, A8: each 1–2 red, every file restored byte-identical). Behaviour changes recorded in
the guides: nav buttons `aria-disabled` (not `disabled`) at the ends; `peekRatio` clamped 0–0.45; `" 4 : 5"` is no
longer a valid ratio anywhere (one grammar in all three components, `".5:1"` valid). Battery run 2 caught a roster miss
(FX-A's new `lib/format-number.ts`, `validate:registry-json` high) — added; tests 231 files / 3167 passed, 2 timeouts in
repo-gate files that pass alone (44/44).

### U5 — browser pass (fresh Sonnet, production build on :3200, Chromium 1280 × 900 + 390 × 844, light + dark)

All 7 items reached (no WebKit on this machine — F-09 stays the platform's). Evidence:
`E:/tmp/ilinxa-release-kit/browser-r8/`.

| # | Finding | Verdict | Fix |
|---|---|---|---|
| W1 ⚠️ | text card in a small inline card with the gradient picker open: the input overlapped the bar (1280 inline card 598 × 336: 3 lines at 37 px reach 235 px vs bar top 208) — the `0.4 × cardH` floor ignored the bar and the input stayed centred on the whole card | CONFIRMED (FX-T's T7 was right for tall cards only) | coordinator: the bar's height is the bottom reserve, the top reserve is capped at 88 px, the input is centred in the space between (card padding); test "F1 (browser)" falsified (red without the padding line); T7 expectation moved to the new geometry (top capped) |
| W2 🔹 | 40 lines at the 14 px floor: preview scrolls (≈ 31 visible), export draws 36 of 40 | DROPPED — the documented limit (guide "Export", Known gaps) | — |
| W3 🔸 | content-composer Post: a mouse click on Back after Next does nothing once (blur validation shifts the layout) | DROPPED — pre-existing, already logged at release 6 (W6 / W7 → content-composer F-06, owner: re-design) | — |

Passing (measured): text card preview = export line count and row positions for 1 / 3 / 6 / 12 lines, a wrapping
paragraph, a long word and Arabic at 390 and 1280 (rows within 0.3 % of the card height); 25 px / 24 px fonts in the
story dialog, nothing under the bar with the picker open there; placeholder fully visible; re-fit on resize. Crop:
canvas 1.917 (1.91:1, inline at 390 and 1280), Crop opens on 4:5 (frame 0.796), chips "1.91:1" / "4:5" / "1:1"
`aria-pressed`, `crop-set 1:1 ratio=1` by mouse, Enter and Space. Carousel: captions below the frame, height follows
the active slide (998 uncaptioned / 1026 / 1070 / 1090 expanded), dots below, nav centred on the frame (dy ±0.1 px),
no Tab stop in an inactive slide, axe clean ×4; two items: chip inside the active frame at every position, edge peek,
`aria-disabled` ends keep focus; 4:5 → 0.800, 1.91:1 → 1.910; no 7.5 % shift observed. carousel-composer: switch only
on item 1, thumbs exact (1.91:1 → 120 × 62.8, 4:5 → 51.2 × 64), no re-pick event, keyboard + focus ring; edit at
1.91:1 on 390 fully visible (canvas 1.924), Done without crop → 1080 × 565, a small crop → no upscale; export crops
centred (1080 × 565 @ 0,257; 864 × 1080 @ 108,0); axe clean on 8 tabs × 2 schemes × 2 viewports. post-card and
content-composer unchanged except the intended trim of edited items (1600 × 1200 → 1200 × 1200 at 1:1). Console: 0
errors / warnings / hydration messages on all six pages; no horizontal overflow at 390.

W1 re-verified on a rebuilt production build (`browser-r8/inl2.mjs`, picker open, 0–8 lines): no overlap at 1280
(inline card 598 × 336 — text bottom ≤ 200, bar top 208) or 390 (256 × 254 — bottom 118, bar top 126); on the 256-px
card long text scrolls in the space left while the picker is open (closing it gives the room back) — the documented
limit.

### U3 — final battery (run 3, after the W1 fix)

tsc 0 · lint 0 errors / 11 warnings · `registry:build` 0 (full chain: 133 stamped entries, 69 artifacts 0 high) ·
doc-budget 0 · tests **231 / 231 files, 3170 passed, 6 skipped** · `pnpm build` 0. Artifacts / budgets (set from this
run): media-editor 447.4 / 470, media-carousel 71.5 / 80, carousel-composer 121.1 / 135, -editing 11.3 / 13, post-card
191.9 / 200, capture 53.7 / 65.

### U6 — docs sync + pre-push doc verifier (fresh Sonnet, read-only)

Docs written by the architect: 4 guides (+ content-composer note), description + plan notes on all four trios, 3
`usage.tsx` sections, CHANGELOG (6 lines), `meta.ts` (versions, feature lines, budgets), barrel (`AspectSwitch`,
`centredCropRect`), 4 review files (`reviews/2026-10-29-v0.7.0-release-8.md`, media-carousel / carousel-composer
`v0.4.0-release-8`, post-card `v0.8.0-forwarding`), decision file, STATUS, reply draft. The verifier: **0 wrong claims,
13 rows** — the reply's empty "How it was checked" (filled at ship); the reply under-stated the type breaks (now lists
the new required members), said every image gets a `crop` (not for `"free"`) and that the "Video" leak is gone
(only with `alt` / `labels.video`); the text-card limit wording (the export cuts only a block taller than the CARD; the
top reserve); the thumb box; `peekRatio` fallback; the v0.1.1 loop note; the Install section missing expandable-text;
a stale 431.7 KB; two JSDoc notes. All fixed (JSDoc → `registry:build` re-run 0, tsc 0).

### U5 — installs (`pnpm test:install`, local `public/r` after the last `registry:build`)

A first 11-run matrix timed out in the consumers' own `pnpm install` (600 s, ~50 packages linked — host load from
another project's test runs; registry reachable in 0.36 s) and was stopped. Consolidated re-run, one consumer per run:

| Run | Items | CLI | Result |
|---|---|---|---|
| A | media-editor, media-editor-capture, media-carousel, carousel-composer, carousel-composer-editing, post-card, content-composer | 4.18.0 | pass — all files land, stamps, consumer `tsc` 0 (13 component folders) |
| B | media-editor-fixtures, media-carousel-fixtures, carousel-composer-editing, post-card-fixtures, story-composer | 3.8.5 | **post-card + fixtures did not land** → investigated below; after the re-add, consumer `tsc` 0, stamps `post-card 0.8.0`, `media-carousel 0.4.0`, `media-editor 0.7.0`, `carousel-composer 0.4.0` |
| C | carousel-composer (base alone — negative path) | 3.8.5 | pass — only `carousel-composer/` lands (no media-editor), consumer `tsc` 0 |

**Finding I-1 (CLI 3.8.5, pre-existing class, newly reached):** a re-add on CLI 3.8.5 asks to overwrite every
already-installed file that has a rewritten **cross-category** import, although its content is identical (an
`--overwrite` re-add leaves `slide-caption.tsx` byte-identical; 4.18.0 does not prompt — measured on consumer A for
media-carousel and post-card re-adds). Proven pre-existing: post-card's `parts/variant-nodes.tsx` (imports
media-carousel, shipped since 0.3) prompts the same way. media-carousel 0.4.0's `parts/slide-caption.tsx` (imports
expandable-text) puts one such file into every install that already has media-carousel — e.g. adding post-card after
media-carousel. Interactive: one extra "n". Non-interactive (closed stdin / CI) on 3.8.5: the whole add stops with exit
0 and writes nothing (the known-flake row in `readiness.config.md`). Run B hit it with the harness's piped answers.
Mitigation: documented (guide Install + the reply: re-add with `--overwrite`, or CLI 4.x); follow-up media-carousel
F-03.

### U7 — Ship (2026-10-29)

`b3607dd` pushed 16:29. Live poll (160 s apart): polls 1–5 (16:32–16:43) still 0.3.1; **poll 6 (16:45) `/r/media-carousel.json`
with `parts/slide-caption.tsx`**; then every item carries its stamp — `media-editor 0.7.0` (47 files), `media-editor-capture
0.7.0`, `media-carousel 0.4.0` (15), `carousel-composer 0.4.0` (25, incl. `aspect-switch.tsx` / `format-number.ts`),
`carousel-composer-editing 0.4.0`, `post-card 0.8.0`; `/components/{media-editor,media-carousel,carousel-composer,post-card}`
200. GATE 3: Pass with follow-ups ×4 (reviews in each `reviews/` folder). Retro in `.claude/improvement-log.md`. Run
closed; the reply to the platform is `.claude/report-back-2026-10-29-release-8.md` (the user sends it).

# Run — release 10 (media-editor 0.8.0 + carousel-composer 0.5.0; platform request 2026-10-30)

Lead state doc for release 10; `carousel-composer-loop.md` carries a pointer section. Request text:
`E:/tmp/social-ui-v2/PROUI_REQUEST_2026-10-30_MEDIA_EDITOR.md` (checked by the platform against media-editor 0.7.0).

## Status

| Field | Value |
|---|---|
| **Mode** | U-loop. media-editor **minor with a layout behaviour change** (fixed-aspect stage fit + edge-to-edge dialog; 2 additive props) · carousel-composer **minor** (additive: alt for videos, pan, Escape guard, non-drag reorder) |
| **Current stage** | CLOSED — shipped in `182e038`, live-verified 2026-10-30 13:10 (U7 below). GATE 3: Pass with follow-ups ×2 (`reviews/2026-10-30-v0.8.0-release-10.md`, carousel-composer `reviews/2026-10-30-v0.5.0-release-10.md`) |
| **Sign-off policy** | U1 minor → user. The media-editor layout change lands on a component three others compose (story-composer, content-composer, carousel-composer-editing) → never delegated; asked explicitly. **Signed off by the user 2026-10-30:** the fit + edge-to-edge is the DEFAULT for a fixed aspect (not opt-in); run **end to end incl. push** (same as releases 8 / 9). |
| **Version target** | media-editor 0.7.0 → **0.8.0** (`media-editor-capture` follows) · carousel-composer 0.4.0 → **0.5.0** (`carousel-composer-editing` follows). story-composer / content-composer: no bump unless a test or a forwarded prop changes |
| **Model roster** | architect: main session · implementers: 2 × Sonnet 5 (ME, CC) · finders: 2 × fresh Sonnet 5 (U4) + browser finder (U5) · doc verifier: fresh Sonnet 5 (U6) |
| **Started / updated** | 2026-10-30 / 2026-10-30 |

## U0 — Intake & impact (source-validated 2026-10-30)

Inbox check: `E:/tmp/social-ui-v2/` listed by date — the request (02:06) is the newest platform file; nothing older is
unread since release 9.

| Ask | Verdict | Evidence / reach |
|---|---|---|
| 1 fixed aspect fixes the stage | **TRUE, wider** | Dialog: the canvas box is `h-full w-full` (`media-editor.tsx:2319`), so its inline `aspect-ratio` is ignored and the Konva stage = the leftover box (`use-konva-stage-size.ts` measures it). Phones: `h-[100dvh] w-screen` → stage = viewport minus chrome. **Not reported:** inline has the same defect — `w-full … max-h-[70vh]` (`:2326`) breaks the ratio whenever the height clamp engages (9:16 at 480 px wide on a ≤ 1 080 px-tall window); this is the box carousel-composer-editing exports from. Also entering Crop drops the controls into flow (`:2555`) — today that shrinks the region and changes the stage ratio mid-edit. |
| 2 edge to edge | **TRUE** | 34 px = root `p-4` ×2 (`:2227`) + canvas box `border` ×2 (`:2312`). Our preset's DialogContent uses `ring-1` (no layout); a consumer preset with `border` adds 2 px more. `dialogClassName` reaches DialogContent only. The box's `border` also breaks the ratio by itself (border-box `aspect-ratio`). |
| 3 `dismissOnOutsidePress` | **TRUE** | `onOpenChange` (`:2918`) maps every close request to `requestClose()`; Escape and backdrop are indistinguishable there; the only guard is `overlay`, which blocks both. |
| opt. themable frame | covered | by the new `contentClassName` (root surface) + existing `dialogClassName`; the letterbox is the root's background |
| opt. tool strip at 344 px | **PARTLY** | `ChipRowScroller` (`:3159`) already scrolls with an edge-fade cue; chips are text-only, so a 344 px strip hides 2–3 tools behind a scroll |
| 4 alt for videos | **TRUE, wider** | `parts/alt-field.tsx:19` returns null for non-images. **Not reported:** the preview `<video>` has no accessible name (`main-preview.tsx:94-108`); default `altPlaceholder` says "this image" (`types.ts:293`). Storage is already kind-agnostic. |
| 5 pan in the shared frame | **TRUE** | `crop` is derived at `export()` only, always centred (`carousel-composer.tsx:470-479`, `lib/aspect.ts:129-139`); preview + rail are `object-cover` centred. A pan needs stored state; rail thumbs must follow; edit-apply bakes the crop so the pan must clear there. No pointer handlers on the preview today (dnd is rail-only). |
| 6 Escape while a panel prepares | **TRUE (mechanism differs)** | The base has no key handling at all. Radix (`useEscapeKeydown`, document capture) and Base UI both act before React handlers, so a `stopPropagation` in the panel cannot help — only a window-capture native listener precedes them. The base cannot see a custom panel's "preparing" — it needs a signal. |
| 7 reorder without drag | **PARTLY** | dnd-kit keyboard reorder exists + announced (`carousel-composer.tsx:416-446`), but needs measured rects (untestable in jsdom) and there is no one-press control, no `handle` method. Direction must be logical (rail mirrors in RTL). |

**Blast radius**

| Surface | Relation | What must hold |
|---|---|---|
| story-composer | mounts media-editor in a 9:16 dialog; forwards `renderTopBar` / `renderBottomToolbar` / `overlay` | compiles; its suites green; its dialog now renders edge to edge (intended — this is the platform's surface); the overlay still covers the whole surface |
| content-composer | mounts media-editor inline (`media-substrate`) + carousel-composer + editing add-on | inline chrome unchanged by default; carousel props unchanged; suites green |
| carousel-composer-editing | mounts media-editor inline with the shared aspect; Done exports from the stage | the inline ratio fix applies (stage = exact aspect); reports busy to the base (ask 6); clears pan on Apply (ask 5) |
| media-editor-capture | feature item | camera preview fills the fitted box; version follows |
| fixtures + alias items | install + consumer tsc | |
| Docs | 2 guides (layout-change migration rows), STATUS rows, component-versions, CHANGELOG, generated llms / README, `meta.ts` budgets | U6 |

## U1 — Change contract (signed off 2026-10-30)

**media-editor 0.8.0**
- **ME-1 fixed-aspect fit (asks 1).** When `aspect` is not `"free"`, the canvas box is the largest box of that ratio
  inside the canvas region, centred; the letterbox is the region (outside the stage). Dialog: the region is a size
  container and the box is `width: min(100cqw, 100cqh × W/H)` + `aspect-ratio`. Inline: width-driven
  `width: min(100%, 30rem, 70vh × W/H)` so the 70vh cap can no longer break the ratio. The capture surface and the
  text card live in the same box, so they follow. The stage derives its height from its width and the ratio
  (one rounding, not two). Crop mode keeps the ratio (the box shrinks, the stage re-fits; overlays stay on the photo).
  `"free"` unchanged.
- **ME-2 edge to edge (ask 2).** Fixed aspect + dialog presentation: no root padding / gap around the canvas region,
  no box border / rounding, `border-0` on the dialog content (the dialog's own rounding + ring stay). In-flow rows
  (crop panel, consumer `renderTopBar` / `renderBottomToolbar`) keep their own spacing. Inline keeps its card chrome.
- **ME-3 `contentClassName?: string`** — classes for the editor's root surface (`data-slot="media-editor"`), both
  presentations, merged last (so `p-0 border-0 bg-black` works inline too, and themes the letterbox / frame).
- **ME-4 `dismissOnOutsidePress?: boolean`** (default `true`; dialog only, no effect inline). `false`: a backdrop
  press does nothing; Escape, `handle.close()` and the host's close keep working; the overlay guard is unchanged.
  Classification without Radix-only props: Base UI's `onOpenChange(open, details)` reason when present, else a
  window-capture `pointerdown` record (outside the content element) held until that press's `click` has passed.
- **ME-5 tool strip (optional ask).** Chips gain icons; below a container width the labels become visually hidden
  (icon-only, `aria-label` + `title` carry the name). No new prop.

**carousel-composer 0.5.0** (all additive, defaults reproduce 0.4.0)
- **CC-4 `enableAltText?: boolean | "images" | "all" | ((item) => boolean)`** — `true` = `"images"`. Same field and
  counter; optional `labels.altPlaceholderVideo`; the preview `<video>` gets its name from `alt`.
- **CC-5 `enablePan?: boolean`** (images only; pan, no zoom — zoom changes the crop size and is a separate step).
  Item gains `cropOffset?: { x: number; y: number }` (0..1 focal point on the overflow axis; 0.5 = today's centre).
  Preview and rail use the same `object-position`; `export()` `crop` uses the same maths (one rounding rule).
  Pointer drag + arrow keys on a focusable, labelled preview; `touch-action: none` only while pan is enabled and the
  photo overflows; overlay buttons excluded. Cleared on edit-apply and on a `url` change. `onCropOffsetChange?`.
- **CC-6 Escape guard.** Panel props gain `onBusyChange?(busy)`; the shipped editing panel reports its load and Done
  export. While a panel is busy the base swallows Escape at window capture (so no host dialog closes);
  `onEditingChange?(editing)` lets a host gate its own dialog as media-editor's overlay does.
- **CC-7 non-drag reorder.** `reorderButtons?: boolean` renders a visually hidden "move earlier / move later" pair per
  thumb (visible on focus; logical direction, so correct in RTL), announced via `labels.moved(position, total)`;
  `onMove?(id, delta)`; `handle.moveItem(id, delta)`. Hidden while editing, like the drag handle.

**Not taken:** pan zoom (`cropScale`, a later step) · content-composer forwarding `crop` / `cropOffset` / alt (the
re-design) · media-editor C17 (breaking, not asked).

**Invariants**

| # | Invariant (testable) | U4 | U5 |
|---|---|---|---|
| I1 | `aspect="9:16"` dialog: stage ratio within 1 px of 9:16 at 1440 × 900, 390 × 844 and 344 × 740; stage export `region: "stage"` is 9:16 to the rounding | | |
| I2 | Same in the inline branch at a 480 px-wide host on a 700 px-tall window (the old clamp case) and in the carousel edit panel | | |
| I3 | Entering / leaving Crop keeps the ratio; a text overlay stays on the same photo point | | |
| I4 | Fixed-aspect dialog: stage = dialog box (no padding / border) when nothing else is in flow; `"free"` and inline layouts unchanged (layout snapshot) | | |
| I5 | `dismissOnOutsidePress={false}`: backdrop mouse AND touch press keep it open; Escape opens the discard confirm when dirty / closes when clean; a host button calling `handle.close()` works; Radix and Base UI | | |
| I6 | `contentClassName` reaches the root in both presentations and wins over the defaults | | |
| I7 | 344 px dialog: every tool reachable without horizontal scroll; each chip named | | |
| I8 | `enableAltText="all"`: a video shows the field + counter with the video placeholder; the preview video is named by its alt; predicate form honoured | | |
| I9 | `enablePan`: dragging item 2 moves preview + its rail thumb identically; `export()` crop matches the shown region (pixel-compared); edit-apply clears the offset; keyboard pan works; overlay buttons still click | | |
| I10 | Escape during the shipped panel's load / Done export does not close a host dialog (Radix + Base UI); Escape when idle behaves as 0.4.0 | | |
| I11 | `reorderButtons`: move earlier / later reorders, fires `onReorder` + `onMove`, announces, keeps focus, is correct in RTL; `handle.moveItem` same without UI | | |
| I-reg | 0.7.0 / 0.4.0 suites green (tests asserting the replaced layout listed); story-composer, content-composer, editing suites green | | |
| I-neg | base carousel-composer install still has no media-editor file; media-editor base without capture renders the fitted box | | |

## U2 — Implement (started 2026-10-30)

Public types written by the architect first (`media-editor/types.ts`: `aspect` JSDoc, `contentClassName`,
`dismissOnOutsidePress`; `carousel-composer/types.ts`: every "0.5.0" member, `CarouselCropOffset` exported from the
barrel). `tsc` after the type edits: **1 error**, `carousel-composer.tsx(468)` handle missing `moveItem` — the work;
none in dependents. Brief: `E:/tmp/ilinxa-release-kit/briefs/brief-r10-common.md`.

| # | Slice | Owner | Files | Status |
|---|---|---|---|---|
| ME | ME-1…ME-5 + demo + tests | Sonnet | `media-editor/**` (not types / meta / usage) | **done** — media-editor suite 29 files / 394 passed + 1 skipped; 3 new test files (26 tests); falsified in one batch (12 red → green after byte-exact restore); tsc 0, eslint 0, inert-surfaces 64/64. New file `lib/close-reason.ts` → added to `registry.json` (roster 0 high). Coordinator spot-check: close classifier + press record (cleared by keydown before any dismiss layer) and the fit maths read OK. Open for U4 / U5: `stageSizeFor` can make the stage ≤ 1 px taller than its box; the 31rem icon-only threshold is estimated, not measured; I3 (overlay position across Crop) has no test — browser pass. Demo: "Chat" tab gains the dismiss toggle + host Close |
| CC | CC-4…CC-7 + editing panel busy + demo + tests | Sonnet | `carousel-composer/**` incl. `features/editing/` (not types / meta / usage) | **done** — 1 new test file (19 tests), `editing-seam` key list +`onBusyChange`; falsified (6 + 2 reverts red → green); carousel + content-composer 18 files / 169 passed; tsc 0, eslint 0; no new shipped file. Coordinator spot-check: one crop maths for display + export (0.5 = 0.4.0 byte-for-byte), window-capture Escape guard only while busy, render-phase busy reset, add-on waits on media-editor's `whenSettled()`. Open for U5: focus after a button move (jsdom can't falsify it) |

Coordinator: `meta.ts` (versions 0.8.0 / 0.5.0, features), `CHANGELOG.md` (media-editor, -capture, carousel-composer,
-editing), `registry.json` (+ `lib/close-reason.ts`).

## U3 — Gate battery

- Run 1 (`E:/tmp/ilinxa-release-kit/logs/battery-r10-1`): tsc 0 · lint **1** (`validate-contract` keydown at
  `carousel-composer.tsx:601` — the CC-6 window-capture listener) · registry:build 1 (same gate, so the version sync
  never ran) · doc-budget 0 · tests 1 (3 failed, all cascade: contract-gate + 2 registry-versions; 236 / 238 files,
  3 294 passed) · build 0.
- Fix: `keydown-ok:` escape on the listener with its reason (it must run at window capture, before the dialog's
  document-level Escape; `use-global-keydown` cannot). Run 2 (`…/battery-r10-2`): lint 0 (0 errors, **11** warnings —
  below the 13 baseline) · registry:build 0 (registry-json 0 high, inert 0, barrel 0, artifact-size 0 high:
  carousel-composer **142.9 KB vs 135** budget — set after the last fix wave; media-editor 456.5 / 470) · the two
  cascade test files 56 / 56. tsc, build unchanged since run 1 (no source change but a comment).

## U4 — Adversarial review (2 fresh Sonnet finders on the frozen snapshot `E:/tmp/ilinxa-release-kit/snap-r10`)

**Finder B — carousel-composer** (9 rows; architect verdicts)

| # | Sev | Finding | Verdict |
|---|---|---|---|
| B1 | ⚠️ | `updateItem` clears `cropOffset` on ANY `url` change — an upload (`{ url: remote, status }`, same image) silently drops the author's pan; controlled `value` keeps it (inconsistent). The test pinned the bug. | **CONFIRMED** — the U1 contract was wrong. Clear only when the image changes: an edit apply, or a patch that changes `width` / `height`. Types JSDoc + test follow |
| B2 | 🔸 | The edit panel's Done trims with `centredCropRect` (ignores `cropOffset`), then `applyEdit` deletes the offset — an edit loses the author's framing | **CONFIRMED** — trim with `offsetCropRect(…, item.cropOffset)` |
| B3 | 🔸 | Re-edit path: the `whenSettled()` effect runs before the `loadState` effect, so "settled" can resolve before the load starts → not busy while loading | **CONFIRMED** (ordering) — start `whenSettled` after `loadState`, one effect; re-edit test |
| B4 | 🔸 | Move pair (`start-0.5 top-0.5`, 2 × `size-5`) overlaps the remove button on narrow thumbs (9:16 ≈ 2.25rem, 4:5 ≈ 3.2rem) | **CONFIRMED** — relayout; browser measures at 9:16 |
| B5 | 🔸 | `touch-none` on the whole pannable preview blocks vertical page scroll on phones | **CONFIRMED** — `touch-pan-y` when only x overflows, `touch-pan-x` when only y |
| B6 | 🔸 | New labels missing from the TR / AR demo bundles in `dummy-data.ts` | **CONFIRMED** (demo / fixtures data) — add them |
| B7 | 🔸 | Move pair is `pointer-events-none opacity-0` until focus-within → mouse / touch can't reach it; JSDoc + meta claim "touch-assistive" | **CONFIRMED** — reveal on thumb hover too; JSDoc says keyboard + assistive tech + tests |
| B8 | 🔹 | `moveFocusRef` stays set when a controlled host rejects / echoes late → a later unrelated items change steals focus | **CONFIRMED** — clear the ref on the next effect run and after one frame |
| B9 | 🔹 | Pan edges: (a) late-echo snap-back (live cleared on pointerup), (b) arrow steps from a stale offset, (c) no `onLostPointerCapture`, (d) second pointerdown overwrites the drag, (e)–(h) minor | **(a)(b)(c)(d) CONFIRMED** — keep the live offset until the committed value matches (or the item changes), step from the live value, cancel on lost capture, ignore a second pointer; (e)–(h) **DROPPED** (sub-pixel / unreachable: `"free"` is never pannable) |
| B-x | 🔹 | A throwing `enableAltText` predicate crashes render | **DROPPED** — host code; same as every other host callback in the component |

**Finder A — media-editor + dependents** (7 rows; architect verdicts)

| # | Sev | Finding | Verdict |
|---|---|---|---|
| A1 | 🔸 | `stageSizeFor` rounds the width and derives the height: the error scales by 1/R (9:16: stage 0.8 px taller or 1.2 px shorter than the box; 1:3 ≈ 2 px) — I1 says "within 1 px" | **CONFIRMED** — round the LONGER side, derive the shorter from it, clamp each side to the rounded measured size |
| A2 | 🔸 | The size-container region has no intrinsic size: a host class that makes the dialog height `auto` (or an in-flow bar taller than the dialog) collapses the box to 0 — 0.7.0 still rendered | **CONFIRMED** (host-triggered) — dev-warn once when a fixed-aspect dialog region measures 0 |
| A3 | 🔸 | Phone fullscreen 9:16: the ~75 px letterbox bands show the light dialog background behind chrome built for dark media (back arrow, story-composer's top bar, bottom scrim) | **CONFIRMED** — a fixed-aspect dialog defaults its root (the letterbox) to the canvas's dark default; `contentClassName` overrides. Visual check at U5 |
| A4 | 🔹 | Two ME-4 tests are vacuous (`handle.close()` bypasses `onOpenChange`; a press inside never closes) | **CONFIRMED** — rewrite to drive the close through `onOpenChange` after a press with no click / after a portaled-child press |
| A5 | 🔹 | Icon-only threshold ignores the crop-aspect count span (~50–60 px); I7 at 344 px is marginal; icon chips ~38 × 30 px | **CONFIRMED** — hide the count span in the narrow state; browser measures the threshold |
| A6 | 🔹 | Touch backdrop: a keydown between the touch pointerdown and Radix's deferred click clears the record → the deferred dismissal closes the editor | **CONFIRMED** — only Escape clears the record |
| A7 | 🔹 | (a) inline inset ring hidden under the canvas, (b) stray `relative` on chips, (c) orphaned JSDoc at the threshold, (d) no container-query units before Safari 16 | **(b)(c) CONFIRMED** (tidy) · **(a)(d) DROPPED** (cosmetic on the empty state only; container-query units are in every browser this library targets — Next 16 / React 19) |

### U3 — battery after the fix wave (host under heavy load from other projects' tsc / vitest / eslint jobs)

- Run 3 (`…/battery-r10-3`): tsc 0 (643 s) · lint 0 · registry:build 0 (artifact sizes: carousel-composer 146.7 /
  135, carousel-composer-editing 14.2 / 13, media-editor 465.9 / 470 — budgets set at the final battery) · doc-budget
  0 · tests: **partial** (196 / ~241 files ran; 11 failures, all 5 s timeouts) · build **1** — Turbopack PostCSS worker
  "timeout while receiving message … deadline has elapsed" (load, not code).
- Run 4 (`…/battery-r10-4`, build then serial tests): **build 0** (2 125 s) · tests 215 files passed, 6 failed (11
  tests, all timeouts) + 20 workers never started. Every missing / failed file re-run alone (`rerun.log`, `one.out`
  with `--testTimeout=120000`, `threads4.log` on the thread pool): all pass except two load-bound cases —
  `tests/registry-deps-gate.test.ts` (the validator took 310 s inside the test; the same validator is green inside
  `registry:build`, run 3) and code-block `component-soft-failure` (its own fixed 30 s timeout; 142 s of imports;
  code-block is not in this diff). No assertion failure anywhere.

### U4 fix wave (2 parallel Sonnet implementers; every row falsified red → green, byte-exact restore)

- **media-editor (A1–A6):** `stageSizeFor` fits the largest ratio box, rounds the longer side, derives + clamps
  (9:16 / 1:3 / 3:1 / 16:9 / 1:1 / 1.91:1 within 1 px, never larger — coordinator read the function); collapsed-region
  dev warn (`canvas-region-collapsed`); fixed-aspect dialog root `bg-black` (the canvas's own default is `#000`,
  `editor-canvas.tsx:137`; `bg-media-overlay` is a translucent scrim) before `contentClassName`; the two vacuous tests
  replaced (stubbed reason-less `onOpenChange` + record lifetime, new `dismiss-record-lifetime-0-8-0.test.tsx`); count
  span `sr-only` in the narrow state; only Escape clears the press record. A7b kept: the chips' `relative` anchors
  their `sr-only` labels. Tests changed: `fixed-aspect` `stageSizeFor` cases (height-limited box), `tokens.test.ts`
  `bg-black` allowlist 2 → 3. media-editor + story-composer: 38 files / 489 passed + 1 skipped; tsc 0; eslint 0;
  contract 0.
- **carousel-composer (B1–B9a–d):** url-only `updateItem` keeps `cropOffset` (size change clears); Done trims with
  `offsetCropRect` — an off-centre window is cut from the full `region: "media"` export by a local `cropBlob`
  (`createImageBitmap` + canvas, same MIME, 0.92), centred / no-canvas falls back to the editor's own trim
  (coordinator read it; cost: a second encode for an off-centre cut — accepted); re-edit `loadState` then
  `whenSettled` in one effect; move pair relaid (narrow thumbs < 5rem: between remove and grip; wide: bottom row
  beside the grip) and shown on `group-hover` / `focus-within`; `touch-pan-y` / `touch-pan-x` by overflow axis;
  TR / AR bundles complete (+ `aspectSwitch` / `aspectOption`, missing since 0.4.0) with a coverage test; focus-restore
  ref keyed to the target index + cleared after a frame; pending pan kept until the host echoes, arrows step from it,
  lost capture cancels, a second pointer ignored. Tests changed: the B1 test (was pinning the bug), the keyboard test's
  `touch-none`. carousel + content-composer 19 files / 181 passed; tsc 0; eslint 0; contract 0. **Parked:** a
  controlled host that never accepts a pan keeps showing the dragged offset (no reject signal); `exportMeta` overlay
  coordinates are not re-based after an off-centre cut (`editorState` unaffected).

## U5 — browser pass (fresh Sonnet, production build `next start -p 3200`, Chromium, `E:/tmp/ilinxa-release-kit/browser-r10/`)

**Observed PASS:** I1 — Chat 9:16 dialog box 375.75 × 668 / stage 376 × 668 at 1440 (10 px side bands: the demo's 36 px
in-flow host bar), phone 390 × 844 box 390 × 693.33 / stage 390 × 693, 344 × 740 box 344 × 611.55 / stage 344 × 612;
root `rgb(0,0,0)`, padding 0, borders 0, light + dark; story-composer stage = its dialog exactly (396 × 704, gap 0).
I2 — inline 16:9 / 1.91:1 within 1 px at 1280 × 900, 1280 × 560, 390, 344; no horizontal overflow. I3 — Crop keeps
0.5625 and the text overlay keeps its photo point (0.162,0.146 → 0.163,0.148); Cancel pixel-identical. I4 — free
inline unchanged (16 px padding, 1 px dashed, 600 × 337.5). I5 — `dismissOnOutsidePress={false}` mouse + touch
backdrop stays open; Escape closes clean / confirms dirty; host Close works; default closes. I7 — 344 / 390 / 1280:
six icon chips 38 × 30, scroller 256 = 256 (no scroll), names intact. I8 — video alt field + counter + placeholder,
`<video aria-label>`, thumb name, axe 0. I9 — pan drag / clamp / arrows 5 % + Shift 20 %, thumb follows on commit,
buttons don't pan, `touch-action` pan-y / pan-x, page scrolls 185 px on a vertical swipe, `export()` crops match
(471,0 / 0,371). I10 — Escape during load and on re-edit keeps the dialog. I11 — hover reveal + click, no overlaps
(narrow layout), focus kept, announcement, `aria-disabled` end, RTL (simulated). I12 — 0 console errors / hydration
warnings across 4 pages (32 tabs), axe 0 on every demo panel, focus returns in media-editor + story-composer.

| # | Sev | Finding | Verdict |
|---|---|---|---|
| F-1 | ⚠️ | carousel Escape guard: Done → Escape at once closes the host dialog every time — Done's export blocks the main thread (~940 ms, 387 KB JPEG), the queued keydown is delivered after the panel unmounted (guard gone); the guard also arms only after a state → effect chain (a same-task synthetic Escape was not swallowed) | **CONFIRMED** — arm the guard synchronously (a ref the panel's `onBusyChange` sets, a listener installed for the whole edit), the shipped panel reports busy BEFORE it starts the export, and swallow an Escape whose `timeStamp` precedes the end of the busy period (listener kept briefly after busy / unmount) |
| F-2 | 🔹 | Pan: ArrowLeft on a tall item (no x overflow) changes `x` 50 → 45 % (stored offset + `onCropOffsetChange` move with no visible effect) | **CONFIRMED** (B9b regressed the no-overflow guard) — ignore + don't prevent an arrow on an axis without overflow |
| F-3 | 🔸 | Light theme: axe `color-contrast` on the inactive mode pill (1.71 : 1), the capture placeholder (1.21 : 1) and the crop panel (2.22 : 1) — light-theme chrome on the new black letterbox (A3) | **CONFIRMED, caused by A3** — the edge-to-edge surface takes the dark colour scheme (`dark` class on the root → every token in the subtree is the dark theme), so all chrome is dark-on-dark-correct in either page theme |
| F-4 | 🔹 | axe `aria-input-field-name`: the Text tool's size slider thumb has no name | **CONFIRMED** (pre-existing, cheap) — name it with `labels.text.fontSize` |
| F-5 | 🔹 | stage up to +0.45 px past the fractional box | **DROPPED** — within the contract (clamped to the rounded box; ≤ 1 px) |
| F-6 | 🔹 | tap sizes: icon chips 38 × 30, reorder pair 16 × 16 | **Follow-up** (spacing-exempt under WCAG 2.5.8: no other target within the 24 px circle — measured no overlaps); reply note |
| F-7 | 🔹 | carousel "Escape guard" demo dialog: no Radix trigger → focus to `body` on close + a missing-Description warning (content-composer demo the same) | **CONFIRMED** for the carousel demo (fix the demo wiring); content-composer demo parked (not in this release) |
| F-8 | 🔹 | Chat demo stage not edge to edge vertically (in-flow host bar) | **DROPPED** — the documented in-flow-row behaviour; story-composer (absolute bar) is exact |

**Fix wave 2 — carousel (F-1, F-2, F-7 + demo reach):** busy is a ref set synchronously by the panel's
`onBusyChange`; the window-capture listener lives for the whole edit plus a 1 s grace (`ESCAPE_GRACE_MS`) and swallows
an Escape while busy or whose `timeStamp` precedes the end of the busy period (the edit closing ends it); the add-on
reports busy synchronously at the start of Done. F-2 was float noise (`~1e-14` overflow on the fitted axis) — < 0.5 px
now counts as no overflow. Demo: Escape-guard dialog with a trigger + description; Pan tab gains the editing add-on;
Reorder tab gains 9:16 and `dir="rtl"` toggles. New `release-10-fix-wave-2.test.tsx` (9; 5 red with the reverts,
byte-exact restore, green); the unmount-removal test now advances past the grace. carousel + content-composer 20 files
/ 190 passed (thread pool — the forks pool would not start under load); tsc 0; eslint 0; contract 0. Coordinator read
the guard.

**Fix wave 2 — media-editor (F-3, F-4):** edge-to-edge root `dark bg-black text-foreground` + `color-scheme: dark`
(before `contentClassName`); the discard confirm portals out and keeps the page theme; `overlay` is inside (dark —
documented). F-4 was wider: all three slider kinds (text size, brush, every adjust slider) — shadcn `Slider` puts
`aria-label` on the root, the focusable `role="slider"` is the thumb; new `hooks/use-slider-thumb-label.ts` labels the
thumbs (Radix + Base UI; coordinator read it; added to `registry.json`). New `release-10-fix-wave-2-0-8-0.test.tsx` (6; 4
red with the reverts, byte-exact restore, green). media-editor + story-composer 39 files / 495 passed + 1 skipped
(thread pool); tsc 0; eslint 0; contract 0.

### U5 — browser re-verify after fix wave 2 (fresh Sonnet, final build; `…/browser-r10/reverify/`) — 7 / 7 PASS

F-1: Done after a real edit (blocking 460–700 ms export, 387 KB JPEG) → Escape at once: dialog stays open **10 / 10**;
same-task synthetic Escape swallowed; Escape after Edit (loading) stays open; Escape ~2 s after Done / when idle
closes (0.4.0 behaviour). Done on an UNMODIFIED edit exports nothing and is not busy — Escape closes there (expected).
F-7: focus back on the trigger 10 / 10, no Radix warning. F-2: arrows ignored + not prevented on the axis without
overflow, both item shapes. F-3: axe 0 violations (any rule) on the Chat dialog at capture / photo / Crop / Text, 1280
+ 390, light + dark, and story-composer; root `dark` + `color-scheme: dark` + black; inactive pill 7.25 : 1; the
discard confirm is outside the root and keeps the page theme. F-4: every slider named (Size, Brush size, Brightness,
Contrast, Saturation, Blur), persists across value changes and tool switches; axe `aria-input-field-name` 0 / 12.
Newly reached: pan → Edit → Done keeps the framing (wide panned right → the right half; tall panned down → the bottom);
9:16 rail at 1280 + 344 — thumb 36 × 64, pair / remove / grip no overlaps in any state, hover-click reorders, focus
kept, `aria-disabled` end; native `dir="rtl"` — item 1 rightmost, earlier / later logical, chevrons rotated,
announcements. Regression: Chat 390 stage 390 × 693, dismiss cases, pan drag + clamp, 0 console errors / hydration
warnings on four pages (48 tabs). Not run: WebKit, a Base UI consumer, touch (unchanged since the first pass).

### U3 — final battery (run 5 + the final test run; the host still loaded by other projects)

Run 5 (`…/battery-r10-5`): tsc 0 · lint 0 · registry:build 0 · doc-budget 0 · build 0 (3 035 s) · tests partial (45
workers never started; 10 timeouts; no assertion failure). After the budgets / doc fixes: registry:build 0 (budgets:
media-editor 468.0 / 490, carousel-composer 147.8 / 155, editing 14.5 / 16, capture 53.7 / 65 — 0 high). **Final full
test run** (`…/final-r10/tests.log`, `NODE_ENV=production`, thread pool, serial, 120 s timeout): **239 / 239 files,
3 319 passed, 0 failed**; the 4 files whose worker did not start, run alone: 4 / 4, 21 passed. **243 / 243 files green.**

### U5 — installs (`pnpm test:install`, local `public/r` after the last `registry:build`)

The harness's fresh consumers time out in their own BASELINE `pnpm install` (before anything of ours is added — pnpm
linking from the store at ~1 package / 10 s on this host; seen idle at 13 % CPU too): a / b / c / d / f exit 1 at 600 s
with no component added (twice for a). **e — `story-composer` @ CLI 3.8.5: PASS**, exit 0, consumer tsc 0 (pulls
media-editor 0.8.0). Kept-consumer path (release-8 precedent): consumer e (`E:/tmp/ilinxa-it-r10e/cli-3.8.5`), `@ilinxa`
pointed at a local server of `public/` → `shadcn@3.8.5 add @ilinxa/media-editor @ilinxa/media-editor-capture
@ilinxa/carousel-composer @ilinxa/carousel-composer-editing --overwrite` exit 0 (new `lib/close-reason.ts`,
`hooks/use-slider-thumb-label.ts`, `features/editing/`, `features/capture/` landed) → **consumer tsc 0**. Negative path
(base carousel-composer brings no media-editor): the `install-graph` test (green in the final run). CLI 4.18.0 not
re-run on a fresh consumer (the baseline install) — the platform re-adds on their own toolchain.

Not run (no demo reaches them): stage export, `contentClassName`, pan → Edit → Done (unit-tested, B2), reorder at a
9:16 aspect, native RTL rail (the demo wraps in `dir=ltr`; `useDirection` reads at mount), WebKit. Fix wave 2 adds a
pan + editing tab and a 9:16 option to the reorder tab so the re-verify can reach them.

Base UI is not installed in this repo (`node_modules/@base-ui*` absent) — the reason strings are checked against the known enum by reading; the platform's Base UI version is the real test (reply note).


### U7 — Ship (2026-10-30)

`182e038` pushed 12:48. Live poll (160 s apart): polls 1–7 (12:51–13:07) still 0.7.0 / 0.4.0; **poll 8 (13:10)
`/r/media-editor.json` 0.8.0 and `/r/carousel-composer.json` 0.5.0**; `carousel-composer-editing` 0.5.0,
`media-editor-capture` 0.8.0; the media-editor artifact carries `lib/close-reason.ts` and
`hooks/use-slider-thumb-label.ts`; `/components/media-editor` 200. GATE 3: Pass with follow-ups ×2. Retro in
`.claude/improvement-log.md`; decision `.claude/decisions/2026-10-30-release-10-fixed-aspect-stage.md`. Run closed; the
reply to the platform is `.claude/report-back-2026-10-30-release-10.md` (the user sends it).

---

# Run — 0.8.1 (leaving the crop tool; platform note 2026-10-30)

Request: `E:/tmp/social-ui-v2/PROUI_REQUEST_2026-10-30_CROP_PENDING.md`. Decision:
`.claude/decisions/2026-10-31-media-editor-crop-exit-and-platform-closures.md`. Evidence:
`E:/tmp/ilinxa-release-kit/r0831/`.

## Status

| Field | Value |
|---|---|
| **Mode** | U-loop, **patch** (no signature change; `loadState` and the public hook's `setActiveTool` tighten a defective state). Ladder asks a self-check; 1 fresh finder added, given the least-sure decisions |
| **Current stage** | U6 done, U7 waiting for the user's go: **not committed, not pushed** |
| **Sign-off** | U1 patch: architect proceeds, recorded here. Push: not authorised this run |
| **Version target** | media-editor 0.8.0 → **0.8.1** (`media-editor-capture` follows); no dependent bump |
| **Started / updated** | 2026-10-30 / 2026-10-31 |

## U0 — Intake (source-validated)

| Claim | Verdict | Evidence |
|---|---|---|
| Tool chip leaves the rectangle set, stage uncropped, export trims | **TRUE** | Chip called `setActiveTool` only; the frame stayed in `state.crop` and `exportImage` passes it to `computeExportGeometry`. Reproduced on live 0.8.0 |
| Reachable only from the chip row | **WIDER** | 3 failed-Apply exits + the `catch` closed the tool and kept the frame; `loadState` could restore a hidden frame; a source swap kept the old photo's frame; on a video source the frame also drove `exportVideo` |
| Not reported | **NEW** | Cancel during an Apply encode: the photo still changed afterwards |

Blast radius: story-composer (mode round trip keeps the frame, the tool stays open), content-composer `media-substrate` and
carousel `edit-panel` (a restored snapshot loses a never-applied frame, see F5), `media-editor-capture` (version follows).

## U1 — Contract

`state.crop` exists only while the crop tool is open. Apply burns it in; every other way out discards it. Discard over
commit because the frame is auto-created at 80 % and Apply cannot be undone. An export with the tool open still trims to
the visible frame (unchanged, documented).

## U2 — Implement

`setActiveTool` clears the frame for any tool but `"crop"` in the same update (`set-crop` is a no-op when unchanged);
`loadState` drops a frame unless the tool is open; Cancel bumps the source epoch; chips are ignored only while the crop
tool is open with an Apply in flight; a new `initialSource` closes the open tool. Regression tests first:
`__tests__/crop-leave-0-8-1.test.tsx` was **16 red of 23** before the fix; removing the hook's clear re-fails 12.

## U4 — Adversarial review (1 fresh Sonnet finder)

| Row | Verdict | Outcome |
|---|---|---|
| F1 chips dead after Cancel until the stale Apply ends | CONFIRMED, new | Guard narrowed to an open crop tool; test added |
| F2 a hung encode locks the chips | CLOSED by F1 | Cancel closes the tool, so the chips work |
| F3 frame laid out on the old photo after a swap | CONFIRMED, mostly old | A new source closes the tool |
| F4 tool stuck on a video keeps a frame via `loadState` | CONFIRMED, old | Same root cause, same fix |
| F5 Done with Crop open: the re-edit shows the whole photo | Not a defect | The hidden-frame behaviour being removed; documented in the guide and CHANGELOG |
| F6 a host's cached handle reads a stale tool | DROPPED | Every cached-handle read is stale; the worst outcome is a fresh frame |

Coordinator: the F3 / F4 fix made `cropActive && !isVideoEdit` and a `mode === "photo"` check in `loadState` unreachable;
both removed. The gate battery then caught a test stub missing `clearRect`: an unhandled error that would have failed
`test:run`, and with it the deploy.

## U3 — Gate battery

`…/r0831/exit.txt`: tsc 0 · lint 0 errors (11 warnings) · meta-deps 0 · registry:build 0 · doc-drift 0 · doc-budget 0 ·
build 0. Tests (`NODE_ENV=production`, thread pool): 229 files, 2 946 passed, 6 skipped, then 15 errors "Failed to start
threads worker" (host flake, no assertion failed). Those 15 run alone, serially: **15 / 15, 419 passed, exit 0**.
**244 / 244 files, 3 365 passed.**

## U5 — Browser replay (host Playwright, Chromium, 390 × 844, photo with a red band on every edge; `…/r0831/replay.mjs`)

Live 0.8.0 **5 / 12** (`crop` set after leaving; exports 173 × 307 and 270 × 480, band gone). Production build 0.8.1
**12 / 12** (`crop` null; stage export 512 × 508 and media export 800 × 600 keep the band on all four sides; Apply
270 × 480; Crop re-opens with a frame after each of the 4 other tools; 0 console errors). Run on the inline Edit-only
demo: no demo exposes `getState` / export in a fixed-aspect dialog, so that exact surface is covered by unit tests on
the same state path. Not run: WebKit, touch, a Base UI consumer.

## U5 — Install (kept consumer `E:/tmp/ilinxa-it-r10e/cli-3.8.5`, local `public/` server)

`shadcn@3.8.5 add @ilinxa/media-editor @ilinxa/media-editor-capture @ilinxa/story-composer @ilinxa/content-composer
--overwrite`: exit 0 (a first run hit a 280 s limit in the consumer's own dependency step and counts for nothing); the
fix is in the installed hook; **consumer tsc exit 0, 0 errors**. CLI 4.18.0 and a fresh consumer not run.

## U6 — Docs

Guide "Leaving the crop tool", CHANGELOG (+ capture), `meta.ts`, STATUS, `types.ts` JSDoc, component-versions, built
artifacts. F-02 in `reviews/2026-10-30-v0.8.0-release-10.md` updated: Base UI half closed from `@base-ui/react` 1.4.1
source, WebKit half stays with the platform. Patch: no review file required.
