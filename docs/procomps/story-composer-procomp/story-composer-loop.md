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
| **Current stage** | U1 — **awaiting sign-off** (Part 3 proposal) |
| **Sign-off policy** | user-interactive. Ask before every push. |
| **Version target** | v0.5.1 → **v0.6.0**, released **together with media-editor 0.5.0** |
| **Started / updated** | 2026-10-25 / 2026-10-25 |

Source: request §5.8 (`E:/tmp/social-ui-v2/PROUI_HANDOFF.md:1434-1490`) as amended by the digest §Part 3
"story-composer" and locked decision 5's note ("story-composer is a media-editor wrapper by design — its add-on story
needs a plan").

## Stage checklist (run Part 3)

- [x] U0 Intake — read-only intake agent (Sonnet 5) + architect verdicts (below)
- [ ] U1 Change contract — sign-off: pending
- [ ] U2 · [ ] U3 · [ ] U4 · [ ] U5 · [ ] U6 · [ ] U7

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
