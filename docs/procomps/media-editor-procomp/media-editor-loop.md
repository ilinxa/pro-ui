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
