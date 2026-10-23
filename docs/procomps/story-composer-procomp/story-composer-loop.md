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
