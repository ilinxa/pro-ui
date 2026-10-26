# Loop state — `news-card` (U-loop)

## Status

| Field | Value |
|---|---|
| **Mode** | U-loop (change class: patch) |
| **Current stage** | CLOSED — shipped in `85b9e87`, deploy verified 2026-10-23 |
| **Sign-off policy** | patch — architect proceeds (batch plan docs/plans/fix-now-batch-plan.md, sign-off delegated by user 2026-10-23) |
| **Version target** | v0.4.2 -> v0.4.3 |
| **Model roster** | architect: main session · implementers: Sonnet 5 |
| **Started / updated** | 2026-10-23 / 2026-10-23 |

## Stage checklist

- [x] U0 Intake & impact — blast radius + reproduction recorded below
- [x] U1 Change contract — batch plan (docs/plans/fix-now-batch-plan.md); sign-off per policy above
- [x] U2 Implement — slice table below
- [x] U3 Gate battery — gates 1–8 green (batch gate battery, docs/plans/fix-now-batch-plan.md)
- [x] U4 Adversarial review — finders; findings table below
- [x] U5 Runtime & smoke — `pnpm build` ✓ (77 pages); consumer smoke (shadcn@4.18.0, local `public/r`): 23/23 installs exit 0, consumer `tsc` 0 errors; cssVars land only in `@theme inline`; base media-editor compiles without the capture slice
- [x] U6 Docs sync & GATE 3 — guides/meta current; minors reviewed in spotcheck files (Pass with follow-ups); patches: architect self-check (no review file per ladder)
- [x] U7 Ship — `85b9e87` (fix-now batch) pushed to master; Vercel deploy verified 2026-10-23 (live `/r/*.json` carry the new files + `cssVars`). Decision: `.claude/decisions/2026-10-23-fix-now-hardening-batch.md`

## Run B6 — news-card v0.4.2 -> v0.4.3

### U0 Blast radius

| Surface | Why touched | Synced (stage 7) |
|---|---|---|
| `media/content-composer` | imports news-card; unaffected | (architect, stage 7) |
| `registry.json` | no change | (architect, stage 7) |

### Reproduction (written before the fix)

- Bug: `item.updatedAt` JSDoc says it renders an '(edited)' suffix; nothing renders it.
- Render `<NewsCard item={{...,updatedAt}}>` -> no console output, no '(edited)' text (pre-fix). Test asserts exactly 1 warn across re-renders, 0 when absent.

### Slice plan

| # | Slice | Owner | Status | Spot-check evidence |
|---|---|---|---|---|
| 1 | types.ts JSDoc `@notImplemented` ('not rendered yet') | implementer (Sonnet 5) | done | `types.ts` |
| 2 | Once-per-mount dev-warn in NewsCardImpl | implementer (Sonnet 5) | done | `news-card.tsx` |
| 3 | Guide: known-limitations bullet (guide never claimed '(edited)') | implementer (Sonnet 5) | done | `guide` |

### Invariants

| # | Invariant (testable) | Reviewed | Observed live |
|---|---|---|---|
| I1 | updatedAt present -> one warn per mount | (architect) | (architect) |
| I-neg | absent -> no warn | (architect) | (architect) |

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
| F-A7 | news-card warn says "not rendered yet" | finder (B1–B6) | DROPPED | unpinned wording is allowed by the rule | — |

### GATE verdict

(architect)

### Parked

- Stale version-pinned deferrals flagged by `validate:inert-surfaces` (pre-existing backlog, T1).

---

## Run — news-card v0.4.4 -> v0.4.5 (Part 3 release 5, with comment-thread 0.4.0)

| Field | Value |
|---|---|
| **Mode** | U-loop (change class: **patch** — honours a field the shared menu type gained) |
| **Current stage** | U6 done — ships in the release 5 commit (see `docs/procomps/comment-thread-procomp/comment-thread-loop.md`, "Run — Part 3 release 5") |
| **Sign-off policy** | user go 2026-10-26 (release 5 "end to end") |

- **Why:** comment-thread 0.4.0 adds `CommentMenuItem.hidden`; news-card reuses the type for its kebab and would have
  rendered hidden items.
- **Change:** `news-kebab.tsx` leaves out hidden items; the featured / large / list / medium variants render no trigger
  when every item is hidden (the list variant then keeps its arrow). The pre-push doc verifier found that
  `openKebab()` with every item hidden armed a later pop-open — `news-card.tsx` now guards it.
- **Tests:** `__tests__/kebab-hidden.test.tsx` (4), every one falsified. Installs: final matrix on CLI 4.18.0 + 3.8.5 (6 runs, all PASS, consumer tsc 0 — see comment-thread-loop.md "U5 — installs"). Artifact 181.8 / 210 KB.
- **Docs:** `meta.ts` 0.4.5, CHANGELOG bullet, guide note.
