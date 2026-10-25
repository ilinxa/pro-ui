# Loop state — `story-composer` (U-loop)

## Run 2026-10-23 — B8 publishing overlay through media-editor overlay prop

### Status

| Field | Value |
|---|---|
| **Mode** | U-loop (change class: patch) |
| **Current stage** | CLOSED — shipped in `85b9e87`, deploy verified 2026-10-23 |
| **Sign-off policy** | patch — delegated by user 2026-10-23 for the fix-now batch (docs/plans/fix-now-batch-plan.md); architect signs off contract B8 |
| **Version target** | v0.4.1 → v0.5.0 (raised from patch at U4: finder F3 — coupling to media-editor >= 0.4.0) |
| **Model roster** | architect: main session · implementers: Sonnet 5 · finders: Sonnet 5 |
| **Started / updated** | 2026-10-23 / 2026-10-23 |

### Stage checklist

- [x] U0 Intake & impact — blast radius + reproduction recorded below
- [x] U1 Change contract — batch plan (docs/plans/fix-now-batch-plan.md); sign-off per policy above
- [x] U2 Implement — slice table below
- [x] U3 Gate battery — gates 1–8 green (batch gate battery, docs/plans/fix-now-batch-plan.md)
- [x] U4 Adversarial review — finders; findings table below
- [x] U5 Runtime & smoke — `pnpm build` ✓ (77 pages); consumer smoke (shadcn@4.18.0, local `public/r`): 23/23 installs exit 0, consumer `tsc` 0 errors; cssVars land only in `@theme inline`; base media-editor compiles without the capture slice
- [x] U6 Docs sync & GATE 3 — guides/meta current; minors reviewed in spotcheck files (Pass with follow-ups); patches: architect self-check (no review file per ladder) — review = media-editor spotcheck (covers both) `../media-editor-procomp/reviews/2026-10-23-v0.4.0-spotcheck.md` exists; GATE 3 closure pending
- [x] U7 Ship — `85b9e87` (fix-now batch) pushed to master; Vercel deploy verified 2026-10-23 (live `/r/*.json` carry the new files + `cssVars`). Decision: `.claude/decisions/2026-10-23-fix-now-hardening-batch.md`

### Contract

See `docs/plans/fix-now-batch-plan.md` row B8: the publishing overlay (default and `renderPublishingOverlay`) is passed via media-editor `overlay`, so Retry/Cancel sit inside the dialog. No public API change. Requires media-editor >= 0.4.0.

### Slice plan

| # | Slice | Owner | Status | Spot-check evidence |
|---|---|---|---|---|
| 1 | Pass overlay through `overlay`, drop sibling render | implementer | done | `story-composer.tsx` `overlay={publishingOverlay}`; `__tests__/publishing-overlay.test.tsx` |
| 2 | Guide note (requires media-editor >= 0.4.0) + meta 0.4.2 → raised to **0.5.0** at U4 (F-B3) | implementer/architect | done | guide Install section |

### Invariants

| # | Invariant (testable) | Reviewed | Observed live |
|---|---|---|---|
| I1 | Error-state Retry button is a descendant of the editor dialog | `publishing-overlay.test.tsx` (mocked MediaEditor renders overlay in `role=dialog`) | coordinator runtime check |
| I2 | `renderPublishingOverlay` output goes through the same slot | `publishing-overlay.test.tsx` second test | — |
| I3 | Labels output unchanged (still the flat object) | diff: `labels=` prop untouched | — |
| I-neg | No overlay when status idle (dialog empty) | first test asserts 0 children before publish | — |

### Blast radius (U0)

| Surface | Why touched | Synced |
|---|---|---|
| media-editor | needs >= 0.4.0 (`overlay`) | B7 run |
| story-composer guide | requires-media-editor note | done |
| meta.ts | 0.5.0 + changelog (raised from 0.4.2 at U4, F-B3) | done |

### Reproduction

Dialog presentation, publish fails: the overlay (`absolute inset-0 z-40`) rendered as a sibling of the portaled DialogContent; the modal blocked pointer events, so Retry/Cancel were unreachable.

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
| component tests (implementer run) | `NODE_ENV=production pnpm exec vitest run` story-composer `__tests__/publishing-overlay.test.tsx`: 2 pass |

### Findings table

| # | Finding | Source | Verdict | Evidence | Fix |
|---|---|---|---|---|---|
| F-B3 | story-composer patch bump hides a coupling to media-editor ≥ 0.4.0 | finder (B7/B8/T2) | CONFIRMED 🔸 | partial update → TS error / no overlay | bumped **0.5.0** + meta note |
| F-B5 | overlay corners square on the rounded inline surface | finder (B7/B8/T2) | CONFIRMED 🔹 | no radius | `rounded-[inherit]` |

<!-- Findings and the GATE verdict are filled by the architect. -->

### Parked

- Controls under the overlay stay tabbable (needs `inert` on the editor body) - story-composer Part 3 loop (already in batch plan).

---

# Run — Part 3 (social-platform request §5.8 SC1–SC6 + decision 5)

## Status

| Field | Value |
|---|---|
| **Mode** | U-loop (change class: **breaking** — camera becomes opt-in (default install drops capture); `labels.editor` follows media-editor C17; 0.x minor) |
| **Current stage** | **Closed** — release 3 shipped `3259610`, live-verified 2026-10-26 |
| **Sign-off policy** | user-interactive. Push: the user granted push-without-asking for each Part 3 release after a final consistency review (2026-10-25). |
| **Version target** | v0.5.1 → **v0.6.0**, released **together with media-editor 0.5.0** |
| **Started / updated** | 2026-10-25 / 2026-10-25 |

Source: request §5.8 (`E:/tmp/social-ui-v2/PROUI_HANDOFF.md:1434-1490`) as amended by the digest §Part 3
"story-composer" and locked decision 5's note ("story-composer is a media-editor wrapper by design — its add-on story
needs a plan").

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

Not in `closed`. Baseline 1 row (palette `text-amber-400`, `parts/publishing-progress-overlay.tsx`); the overlay's
`bg-black/85` / `text-white` also fall under decision 3. One test file. Built 50.5 KB / budget 60 — but a default
install also brings media-editor (288 KB) + capture (54 KB) + Konva.

| Item | Code today | Verdict |
|---|---|---|
| SC1 WebM | `mediaCapture` statically imported (`story-composer.tsx:20`) and always passed with `mediaSources={["camera","upload"]}` (`:330-331`); recording and re-encode prefer WebM (media-editor); shortcut metadata falls back to `video/webm` | confirmed |
| SC2 publish fields / caption | none of `caption`, `renderPublishFields`, `canPublish`; `canPublish={ctx.isDirty}` hard-wired; `Uploader(blob, metadata)` | confirmed |
| SC3 overlay outside the dialog | `overlay` now rendered inside the editor surface (0.5.0) | already fixed |
| SC4 error state | error branch renders Retry only; `errorMessage` exists on the overlay but is never passed; `text-amber-400`; slot context lacks status / retry / cancel; uploader errors are English | confirmed |
| SC5 invented data | `onPublished` gets `story-${Date.now()}` ids and `new Date()`; server fields in `PublishResult` are dropped | confirmed (generic return = breaking → use a second argument) |
| SC6 labels cast | `as unknown as Partial<MediaEditorLabels>` (`:351`); works at runtime via the normalizer | partial (cast removal = media-editor C17) |
| Digest: controls under the overlay tabbable | the overlay is a plain sibling inside the editor surface; nothing is `inert` | confirmed (fix lives in media-editor) |

Also: `meta.ts` still says "v0.2.0 / 73-name snapshot"; the compat re-exports marked "REMOVED in v0.5.0" are still
exported at 0.5.1 (a promise not kept — either keep and re-word, or remove in this breaking release); `labels.published`
declared and never rendered. Dependents: fixtures + alias only.

## Decision 5 — the add-on story (architect verdict)

Konva is media-editor's canvas. While story-composer wraps the editor, Konva installs with it (it is already lazy at
runtime). The MediaRecorder / WebM part is the separable piece: media-editor already degrades the camera to file intake
when no `capture` is passed, and the capture item already exists.

**Verdict: camera opt-in, editor kept.** story-composer drops its `@ilinxa/media-editor-capture` dependency and the
static import; a host that wants the camera installs `@ilinxa/media-editor-capture` and passes `capture={mediaCapture}`.
This matches the platform's own request (upload by default, camera opt-in) and keeps WebM recording out of a default
install. It is a default change (a fresh install has no camera tab) — hence breaking, with a migration note. A lean
no-editor story flow (a separate rewrite) is only worth it if the platform has that flow; and "installable without
Konva" is named a non-goal for story-composer in the proposal.

## U1 — Change contract (proposed)

- **SC1:** `capture?: MediaCaptureExtension` (default `undefined` → upload only); `sources?` (default: `camera` +
  `upload` when `capture` is given, `upload` otherwise); `acceptMediaTypes?` / `videoOutput?` passed to media-editor's
  ME4 props. Migration: "to keep the camera, add `@ilinxa/media-editor-capture` and pass `capture={mediaCapture}`".
- **SC2:** `caption?: { maxLength?, required? }` (first-class field with labels), `renderPublishFields?({ value, onChange,
  status })`, `publishFields?` / `onPublishFieldsChange?` (controlled pair), `canPublish?(fields)`; `Uploader(blob,
  metadata, fields?)` (extra argument); the default upload adds `caption` + fields to its FormData.
- **SC4:** Cancel in the error state (`labels.uploadCancel`, default keeps today's wording); `getErrorMessage?(error)`
  feeds the overlay message; uploader error strings become labels; `text-amber-400` → token; overlay colours →
  media-overlay tokens; `renderPublishingOverlay` context gains `status`, `error`, `retry`, `cancel`.
- **SC5:** `onPublished(story, result)` — the uploader's resolved value, untouched, as a second argument (one-argument
  handlers keep compiling).
- **SC6:** `labels.editor?: Partial<MediaEditorLabels>` passed straight through; flat keys still mapped (flat wins);
  the cast goes (needs media-editor C17, same release).
- **Overlay focus:** media-editor makes the editor body `inert` while an overlay is mounted (media-editor run, tested
  here).
- **Housekeeping:** re-word stale `meta.ts`; decide the "REMOVED in v0.5.0" compat band (question 4); remove or render
  `labels.published`.
- **Tests:** `describeContract`, `locale="tr"` + hydration, RTL demo, upload-only default (no camera, no recorder),
  publish fields reach the uploader, error Cancel keeps the draft, overlay `inert`, type test (no cast).

### Invariants

| # | Invariant |
|---|---|
| I1 | with `capture={mediaCapture}`: today's tabs, publish bar and 9:16 dialog |
| I2 | handle (14 methods) unchanged; `exportBlob` / `publish` behave as today |
| I3 | `PublishedStory` / `PublishResult` / `Uploader` stay assignable from today's callers; one-argument `onPublished`, two-argument uploader and flat `labels` keep compiling |
| I4 | the overlay renders inside the dialog content |

### Size

50.5 KB / 60; estimate +7 KB → ~58. Budget → **70** if SC2 grows.

### Open questions (in the proposal)

1. Camera opt-in (default install drops capture) — accept the default change? Konva stays with the editor — accept as a
   non-goal for story-composer?
2. Do they need a no-editor story flow (upload + caption + publish, no tools)? Only then a lean variant.
3. The uploader gets a `Blob`; do they need the original `File` (name kept)?
4. Remove the old compat re-exports in this breaking release (recommended) or keep them?

### Platform reply (Part 3 run)

Platform reply `E:/tmp/social-ui-v2/PROUI_REPLY_2026-10-25_PART3.md`: scope signed off as proposed, including every breaking change. Release order: (1) story-viewer 0.5.4 → 0.6.0 · (2) media-editor 0.5.0 + story-composer 0.6.0 · (3) filter-bar 0.3.0 + entity-picker 0.2.0 · (4) post-card 0.6.0 + comment-thread 0.4.0 · (5) carousel-composer 0.3.0 (+ content-composer patch) · (6) app-sidebar 0.6.0, whenever convenient.

- Camera opt-in (upload-only default) **confirmed**. No separate no-editing flow needed — they use the editor (Konva staying is accepted).
- Questions 3 (Blob vs File) and 4 (compat re-exports) not answered → as recommended: keep passing the `Blob`, note it in the guide; remove the stale compat re-exports in this breaking release.

### Pre-U2 scope review (2026-10-25) — corrections

Source: `.claude/review-2026-10-25-part3-scope.md` (fresh Sonnet finder + architect). Where these lines differ from the text above, these win.

- **SC1 is only real without the capture import graph:** remove the `ComposerCamera` / `EditorCameraProps` re-exports (`index.ts`) along with the static `mediaCapture` import. Smoke: an upload-only install (base item alone) compiles with consumer `tsc` 0 and contains no `features/capture` file. Question 4 resolved: remove the stale compat re-exports. [F-03]
- Overlay colours ship through the `--media-overlay` `cssVars.theme` mapping on this item (`validate:registry-tokens`). [F-09]
- Decision 5 waiver (Konva stays with the editor, platform-accepted) is recorded in the U7 decision file. [F-16]

## U2 — Implement (release 3, started 2026-10-25 on the user's go)

Architect decisions taken at U2:

- **Publish details step.** When `caption` or `renderPublishFields` is configured, Publish opens a details step (rendered
  through media-editor `overlay`) with the caption field, the host fields and Back / Publish; `canPublish(fields)`
  gates its Publish. Without either, Publish stays one tap (today's behaviour).
- `PublishFields = { caption?: string } & Record<string, unknown>`; the default uploader appends `caption` and each
  field to the FormData (non-strings JSON-encoded).
- Labels: story-composer maps its flat editor keys with media-editor's `editorLabelsFromFlat` and merges
  `labels.editor` (flat-derived wins); the cast goes. Only overrides are forwarded, as today (output unchanged).
- `labels.published` is rendered as the polite announcement when publishing completes.
- Every stale compat band in `index.ts` is removed (the "REMOVED in v0.5.0" aliases and the "removed in v0.3.0" lib /
  defaults / crop re-exports) — question 4, as recommended.

| # | Slice | Owner | Status |
|---|---|---|---|
| C | SC1 capture opt-in · SC2 publish fields · SC4 error state · SC5 `onPublished(story, result)` · SC6 labels · housekeeping · tests | Sonnet implementer (wave 1, parallel with media-editor A) | running |
| — | registry.json (drop `media-editor-capture` dep, roster, cssVars), meta 0.6.0, guide + migration, CHANGELOG, contract closure | architect | queued |

### U2 result (2026-10-25)

- Slice C: done — SC1 (no `features/capture` import in shipped files), SC2 (details step `parts/publish-details-step.tsx`,
  `PublishFields`, controlled pair, `canPublish`, uploader 3rd arg, FormData), SC4 (Cancel keeps the draft,
  `getErrorMessage`, localized uploader errors via a `messages` option, overlay ctx), SC5, SC6 (`editorLabelsFromFlat`
  + deep merge, no cast), `labels.published` → `role="status"`, `locale`, compat bands removed (29 names), RTL + caption
  demo tabs. Tests: 4 files; every new test falsified (CAUGHT) except 3 green-only rows.
- Architect: removed the never-rendered `drawUndo` / `drawRedo` / `textAlign` keys (found by a key-reachability scan —
  the inert-surface gate does not see label keys); the source-scan test now skips unshipped `demo` / `usage` / `meta`;
  registry (`textarea` dep, `-media-editor-capture`, roster + `publish-details-step.tsx`, cssVars, 0.6.0); stale
  heavy-edge baseline row deleted; contract `closed` += story-composer; meta 0.6.0, budget 60 → **70** (built 63.6 KB);
  guide rewritten for 0.6.0 (it still described v0.1.5 and claimed undo/redo + trim/bake on video), usage, CHANGELOG.

### U3 — Gate battery (2026-10-25)

Shared with media-editor — see `../media-editor-procomp/media-editor-loop.md` "U3 — Gate battery (2026-10-25)".

### U4 — Adversarial review (2026-10-25)

Fresh Sonnet finder on a frozen snapshot (story-composer + dependents axis, 17 rows) + browser finder. Architect verdicts:

| # | Sev | Finding | Verdict | Fix (wave 1) |
|---|---|---|---|---|
| S1 | ⚠️ | 14 flat editor keys (`shutterPhoto`, `drawColor`, `textPlaceholder`, `composerLabel`, …) no longer forwarded | CONFIRMED (verified `EDITOR_FLAT_KEYS` = 24) | forward every override through `editorLabelsFromFlat` |
| S2 | ⚠️ | Escape / backdrop under the details step or upload → discard confirm / host closed mid-upload | CONFIRMED | media-editor ignores dialog close under an overlay; Escape in details = Back |
| S3 | ⚠️ | details step / error / caption survive close + reopen; status stuck at `done` | CONFIRMED | reset on close; `done` → `idle` |
| S4 | ⚠️ | the guide's `renderPublishFields` example disables the picker on the 2nd story | CONFIRMED | falls out of S3 |
| S5 | 🔸 | Cancel → Publish races the abandoned flow (single boolean) | CONFIRMED | run token |
| S6 | 🔸 | no re-entrancy guard; `reset()` mid-publish still reaches `onPublished` | CONFIRMED | guard + reset cancels |
| S7 | 🔸 | a throwing `onPublished` shows "Upload failed" and Retry re-uploads | CONFIRMED | outside the try |
| S8 | 🔸 | gated `publish()` resolves silently; custom top bars can't reach the details step | CONFIRMED | opens the step / dev-warns; `ctx.openDetails` |
| S9 | 🔸 | `uploadErrorBadResponse` dead (SyntaxError passed through in English) | CONFIRMED | wrap with `cause` |
| S10 | 🔸 | focus lost when overlay content swaps | CONFIRMED | autofocus per state |
| S11 | 🔸 | details step a11y (counter, invalid / required, disabled reason, live region re-announces %) | CONFIRMED | fixed |
| S12 | 🔸 | default accept admits WebM; request §5.8 asked for a no-WebM default | DROPPED as a code change — U1 (platform-signed) kept `["image/*","video/*"]`; hosts pass `acceptMediaTypes` / `videoOutput`. Recorded in the U7 decision + report-back |
| S13 | 🔹 | explicit `undefined` label overrides wipe defaults (function labels crash) | CONFIRMED | filter undefined |
| S14 | 🔹 | FormData field collisions; `null` sent as `"null"` | CONFIRMED | reserved keys skipped + warn |
| S15 | 🔹 | `Intl.NumberFormat` per render, throws on a malformed locale | CONFIRMED | memo + `"en"` fallback |
| S16 | 🔹 | dependents (carousel / content-composer) have 2 tests in total | CONFIRMED — follow-up (owner: carousel-composer 0.3.0 loop, release 5); U5 installs both |
| S17 | 🔹 | duplicate `PublishStatus` in the hook | CONFIRMED | import |

Browser finder verdicts (story-composer rows; shared rows in the media-editor loop doc):

| # | Sev | Finding | Verdict |
|---|---|---|---|
| B4 | 🔸 | after a successful publish, reopening shows the published draft | CONFIRMED → S18 (draft consumed on success) |
| B7 | 🔸 | caption counter 3.26:1 / placeholder ~4.3:1 over a bright image | CONFIRMED → S19 |
| B9 | 🔹 | caption counter reversed in RTL | CONFIRMED → S20 |
| B12 | 🔹 | RTL demo leaks English (demo-only) | CONFIRMED → S21 |
| B13 | 🔹 | in-flight Cancel reads "Keep editing" | DROPPED — today's wording, intentional |

### U4 fix wave (2026-10-25)

Sonnet implementer; tests `__tests__/fix-wave.test.tsx` + `fix-wave-real-editor.test.tsx` (real editor, dialog
presentation); 27 mutations, all CAUGHT (S6's first test missed the double start — the token masked it; an
`export()` count fixed the test). S1 whole override object through `editorLabelsFromFlat` · S2 Escape in details = Back,
no-op on the overlay · S3/S4 close resets the flow, `done` → `idle` · S5 run token · S6 one flow at a time, `reset()`
cancels · S7 `onPublished` outside the try · S8 `publish()` opens the details step / dev-warns; `ctx.openDetails` · S9
bad JSON → labelled error with `cause` · S10 autofocus per overlay state · S11 counter `aria-describedby`,
`aria-invalid` / `aria-required`, visible reason (`captionRequired`, `captionTooLong(max)`), % outside the live region ·
S13 `definedOnly` · S14 reserved FormData keys · S15 cached formatters, `"en"` fallback · S17 · S18 the editor resets
after a successful publish · S19 `backdrop-brightness-40` + text alphas (computed, re-measure in the browser) · S20
`<bdi dir="ltr">` counter · S21 Arabic demo. Final: 6 files / 73 tests.

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


## Run — media-editor 0.5.1 patch (2026-10-26) — no story-composer version change

Platform request: focus back to the opener after a successful publish closes the dialog (**F-03**). Root cause is in
media-editor's dialog (Escape and Cancel were affected too — the platform's claim that they worked was refuted); fixed
there, see `../media-editor-procomp/media-editor-loop.md` "Run — 0.5.1 patch". No shipped story-composer file changes,
so it stays 0.6.0 and picks the fix up through its media-editor dependency. New regression test here:
`__tests__/focus-return.test.tsx` (real editor; Escape, Close, publish success, host moving focus after close).
Guide: Accessibility gains the focus-on-close note.
