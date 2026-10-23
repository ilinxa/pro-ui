# Loop state — `video-player` (U-loop)

## Status

| Field | Value |
|---|---|
| **Mode** | U-loop (change class: patch) |
| **Current stage** | CLOSED — shipped in `85b9e87`, deploy verified 2026-10-23 |
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
- [x] U7 Ship — `85b9e87` (fix-now batch) pushed to master; Vercel deploy verified 2026-10-23 (live `/r/*.json` carry the new files + `cssVars`). Decision: `.claude/decisions/2026-10-23-fix-now-hardening-batch.md`

## Run B3 — video-player v0.2.0 -> v0.2.1

### U0 Blast radius

| Surface | Why touched | Synced (stage 7) |
|---|---|---|
| `media/media-carousel` | imports `video-player/hooks/use-double-tap` in parts/single-item.tsx + parts/carousel-track.tsx; inherits the guard, own source unchanged -> no bump | (architect, stage 7) |
| `media/story-viewer, media/media-library` | import video-player; unaffected (no callers of onDoubleTap through controls) | (architect, stage 7) |
| `registry.json` | no change (no new files) | (architect, stage 7) |

### Reproduction (written before the fix)

- Bug: Two quick clicks on a control button (e.g. mute) bubble to the wrapper `onClick={handleDoubleTap}` (video-player.tsx) and fire `onDoubleTap` (accidental like).
- Render `<VideoPlayer onDoubleTap>`; `fireEvent.click(button)` x2 -> onDoubleTap called (pre-fix). Falsified: with the guard disabled, 3 of 5 tests in `__tests__/double-tap-controls.test.tsx` fail.

### Slice plan

| # | Slice | Owner | Status | Spot-check evidence |
|---|---|---|---|---|
| 1 | Shared `useDoubleTap` ignores events whose target is inside button/a/input/select/textarea/[role=button]/[role=slider] below currentTarget | implementer (Sonnet 5) | done | `hooks/use-double-tap.ts` |

### Invariants

| # | Invariant (testable) | Reviewed | Observed live |
|---|---|---|---|
| I1 | two clicks on a control never call onDoubleTap | (architect) | (architect) |
| I2 | two clicks on the video area still call it once | (architect) | (architect) |
| I-neg | single-tap timing unchanged (window logic untouched; a control click neither arms nor resets the window) | (architect) | (architect) |

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
| architect self-check (patch) | no findings beyond the contract; diff read by coordinator | architect | NONE | `__tests__/double-tap-controls.test.tsx` | — |

### GATE verdict

(architect)

### Parked

- Stale version-pinned deferrals flagged by `validate:inert-surfaces` (pre-existing backlog, T1).
