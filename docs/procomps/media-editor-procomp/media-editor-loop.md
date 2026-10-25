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
| **Current stage** | **U5 (installs pending)** — release 3 built, uncommitted; resume: `.claude/HANDOFF-2026-10-23-social-platform-hardening.md` RESUME HERE |
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
- [ ] U7 Ship — commit + push + live poll pending

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
