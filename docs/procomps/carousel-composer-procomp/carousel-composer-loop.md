# Loop state — `carousel-composer` (U-loop)

## Status

| Field | Value |
|---|---|
| **Mode** | U-loop (change class: patch) |
| **Current stage** | U7 — gates 1–8 green, consumer smoke 23/23 + tsc 0; committed locally, push awaits user |
| **Sign-off policy** | patch — architect proceeds (batch plan docs/plans/fix-now-batch-plan.md, sign-off delegated by user 2026-10-23) |
| **Version target** | v0.2.0 -> v0.2.1 |
| **Model roster** | architect: main session · implementers: Sonnet 5 |
| **Started / updated** | 2026-10-23 / 2026-10-23 |

## Stage checklist

- [x] U0 Intake & impact — blast radius + reproduction recorded below
- [x] U1 Change contract — batch plan (docs/plans/fix-now-batch-plan.md); sign-off per policy above
- [x] U2 Implement — slice table below
- [x] U3 Gate battery — gates 1–8 green (batch gate battery, docs/plans/fix-now-batch-plan.md)
- [x] U4 Adversarial review — architect self-check (patch); findings table below
- [x] U5 Runtime & smoke — `pnpm build` ✓ (77 pages); consumer smoke (shadcn@4.18.0, local `public/r`): 23/23 installs exit 0, consumer `tsc` 0 errors; cssVars land only in `@theme inline`; base media-editor compiles without the capture slice
- [x] U6 Docs sync & GATE 3 — guides/meta current; minors reviewed in spotcheck files (Pass with follow-ups); patches: architect self-check (no review file per ladder)
- [ ] U7 Ship

## Run B4 — carousel-composer v0.2.0 -> v0.2.1

### U0 Blast radius

| Surface | Why touched | Synced (stage 7) |
|---|---|---|
| `media/content-composer` | wraps carousel-composer; uses handle.openEditor only for images in practice - re-verify at coordinator smoke | (architect, stage 7) |
| `registry.json` | no change | (architect, stage 7) |

### Reproduction (written before the fix)

- Bug: `handle.openEditor(id)` (hooks/use-carousel-state.ts) had no kind guard: a video id set editingId, mounted EditPanel -> media-editor export() would re-encode the video.
- `useCarouselState({defaultValue:[image, video]})`; `openEditor(videoId)` -> editingId === videoId (pre-fix). Falsified: guard disabled -> `open-editor-guard.test.tsx` 'no-op for a video item' fails.

### Slice plan

| # | Slice | Owner | Status | Spot-check evidence |
|---|---|---|---|---|
| 1 | `openEditor` refuses non-image items (dev-warn, no-op, no onEditOpen) | implementer (Sonnet 5) | done | `hooks/use-carousel-state.ts` |
| 2 | `EditPanel` refuses non-image item (dev-warn, calls onCancel, renders null) | implementer (Sonnet 5) | done | `parts/edit-panel.tsx` |
| 3 | `videoNotEditable` default unpinned; guide section 11.6, demo.tsx, usage.tsx, meta.ts corrected | implementer (Sonnet 5) | done | `types.ts, demo.tsx, usage.tsx, meta.ts, guide` |

### Invariants

| # | Invariant (testable) | Reviewed | Observed live |
|---|---|---|---|
| I1 | openEditor(videoId) leaves editingId null and fires no onEditOpen | (architect) | (architect) |
| I2 | openEditor(imageId) unchanged | (architect) | (architect) |
| I-neg | EditPanel never mounts media-editor for a video | (architect) | (architect) |

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
| component tests (implementer run) | `__tests__/` file added in this slice; implementer run: pass |

### Findings table

| # | Finding | Source | Verdict | Evidence | Fix |
|---|---|---|---|---|---|
| architect self-check (patch) | no findings beyond the contract; diff read by coordinator | architect | NONE | `__tests__/open-editor-guard.test.tsx` | — |

### GATE verdict

(architect)

### Parked

- Stale version-pinned deferrals flagged by `validate:inert-surfaces` (pre-existing backlog, T1).
