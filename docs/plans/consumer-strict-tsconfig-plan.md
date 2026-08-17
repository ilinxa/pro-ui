# Plan — consumer-strict TypeScript gate (F1 `override` + the class behind it)

> Readiness-loop state machine. A fresh session resumes at the first unchecked box.
> **Status:** R7 complete — shipped.

## Goal

One sentence: **make the producer compile its own vendored source at least as strictly as a
plausible consumer does, so a consumer's stricter `tsconfig` can never again be the first thing
that finds a defect.**

## Why this, and not just "add the keyword"

F1 as reported is 3 missing `override` modifiers in one file. Measured, it is **17 across six
files**. But the *interesting* number is why nobody saw it: the repo's `tsconfig.json` sets
`strict: true`, and `noImplicitOverride` **is not part of `strict`**. It is a separate opt-in. So
the file compiled clean in-repo and could only ever fail downstream — and because the library ships
**vendored `.tsx`**, `skipLibCheck` cannot shield the consumer the way it would for a `.d.ts`.

This is the same shape as the standing rule in `.claude/improvement-log.md`:

> **run the check in the environment that matters**

There, the environment was `NODE_ENV=production` in CI. Here, it is *the consumer's compiler flags*.
Gate 1 has always run the producer's flags, which is not the environment that matters for a
vendored-source library.

## Evidence — measured, not assumed (R0)

Every consumer-plausible strict flag, run against the real tree. `registry` = errors inside
`src/registry/` (what actually ships); `files` = distinct files.

| Flag | registry errors | files | dominant codes | decision |
|---|---:|---:|---|---|
| `verbatimModuleSyntax` | **0** | 0 | — | **enable — free** |
| `noFallthroughCasesInSwitch` | **0** | 0 | — | **enable — free** |
| `noImplicitOverride` | **15** | 5 | TS4114×15 | **enable — fix 15 (+2 docs-site)** |
| `noImplicitReturns` | **2** | 2 | TS7030×2 | **enable — fix 2** |
| `noUnusedLocals` | 10 | 10 | TS6133×10 | park |
| `noUnusedParameters` | 11 | 5 | TS6133×11 | park |
| `noPropertyAccessFromIndexSignature` | 243 | 40 | TS4111×243 | park |
| `noUncheckedIndexedAccess` | 383 | 92 | TS18048×175 TS2532×82 | park |
| `exactOptionalPropertyTypes` | 525 | 236 | TS2375×360 TS2379×127 | park |

Baseline on the current config: **0 errors**.

The four enabled flags cost **19 fixes total** and close the reported defect permanently. The five
parked flags are real consumer-break risk but are separate projects (525 errors is not a slice);
they are recorded with live numbers below so the debt is visible rather than folklore.

## In scope

- Add `override` to the 17 TS4114 sites (5 shipped components + 1 docs-site file).
- Fix the 2 TS7030 (`noImplicitReturns`) sites.
- Enable the 4 affordable flags in the root `tsconfig.json` — so **gate 1 enforces them forever**.
- Mirror the flags into the smoke consumer's `tsconfig.json` — the environment that matters.
- Tests that prove the gate is *armed*, not merely present.
- Patch-bump + ship the 5 touched components.

## Out of scope (parked, with numbers)

- The 5 parked flags above. Owner: a dedicated burn-down arc, one flag per run, cheapest first
  (`noUnusedLocals` 10 → `noUnusedParameters` 11 → `noPropertyAccessFromIndexSignature` 243 →
  `noUncheckedIndexedAccess` 383 → `exactOptionalPropertyTypes` 525).
- `noUnusedParameters` is deliberately *not* bundled as "cheap": some fixes would touch parameter
  lists on public callback types, which is a breaking-change decision, not hygiene.

## Invariants (R1) — written testable

| # | Invariant | How it is verified |
|---|---|---|
| I1 | No shipped registry file has a class member that overrides a base member without `override`. | `pnpm tsc --noEmit` (flags now on) → 0 |
| I2 | The four flags stay on. Removing any one is caught, not silently lost. | `tsconfig-strictness.test.ts` asserts each flag `=== true` |
| I3 | The gate is **armed**: reintroducing the defect fails the build. | test compiles a fixture missing `override` → expects TS4114 |
| I4 | The gate is **not a blanket failer**: correct code passes. | same test, corrected fixture → expects clean |
| I5 | Behavior is unchanged — `override` and the return fixes are compile-time only. | full suite green; error boundaries still catch (existing tests) |
| I6 | A real consumer compiling with these flags gets 0 errors. | smoke: consumer tsconfig carries the flags, `tsc` → 0 |

## Blast radius (R1)

| Surface | Touched? | Action |
|---|---|---|
| `card-tree` · `card-tree-node` · `filter-panel` · `properties-form` · `media-library` | yes — `override` | patch bump each; STATUS rows; artifacts rebuild |
| `task-tree` | yes — 2 × TS7030 | patch bump |
| `src/app/.../json-playground.tsx` | yes — 2 × TS4114 | fix; not shipped, no bump |
| `tsconfig.json` | yes | 4 flags added |
| smoke consumer `tsconfig.json` | yes | flags mirrored |
| `__tests__/` | new file | `tsconfig-strictness.test.ts` |
| `.claude/readiness.config.md` | yes | gate 1 note + parked flag table |
| STATUS.md · component-versions · llms/README | yes | regenerate |
| ADR | yes | `.claude/decisions/2026-08-18-consumer-strict-tsconfig.md` |

## Slices

- [x] **S1** — 17 × `override` (6 files)
- [x] **S2** — 2 × `noImplicitReturns` (2 files)
- [x] **S3** — enable 4 flags in root `tsconfig.json`
- [x] **S4** — `tsconfig-strictness.test.ts` (I2/I3/I4)
- [x] **S5** — mirror flags into smoke consumer; version bumps + docs

## Phase checklist

- [x] **R0** framing + measured flag table + improvement log read
- [x] **R1** invariants + blast radius + ADR drafted
- [x] **R2** slices implemented with tests
- [x] **R3** gate battery green with real numbers
- [x] **R4** adversarial review, findings table complete
- [x] **R5** runtime verification incl. negative path
- [x] **R6** docs synced, base commit landed
- [x] **R7** close-out, retro appended

## Gate numbers (R3)

tsc **0** · lint **0 errors / 14 warnings** (baseline) · meta-deps **64/64 clean** · registry
validators **0 high** (6 pre-existing warn; barrel 1 warn = media-editor C17) · no-control-chars
**1,415 clean** · registry:build **exit 0** · artifact-size **66 audited, 0 high** · next build
**exit 0** · tests **16 files / 112 passed** under `NODE_ENV=production` (was 15 / 102).

Falsification of the new gate (both directions):

| Breakage | Result |
|---|---|
| remove `noImplicitOverride` from tsconfig | `repo` tests **exit 1** — "must stay enabled…" |
| reintroduce the defect in a real component | `tsc` **non-zero**, TS4114 at the exact site |
| both restored | tsc **0** · repo tests **0** |

## Findings (R4)

Fresh finder, six axes. Five clean **on hard evidence**, including two probes I did not ask for:
forcing `override` onto `static getDerivedStateFromError` (confirms TS1029/TS4113 — so the sweep
could not have over-applied), and re-compiling each ARMED fixture with only the flag-under-test
off (confirms no test rides along on the pre-existing `isolatedModules`).

| # | Finding | Failure scenario | Verdict | Evidence |
|---|---|---|---|---|
| A | `return true;` changes visitor behaviour | none constructible — `forEachItem` stops only on strict `=== false`, so `true` and `undefined` are indistinguishable to it | **DROPPED** | `tree-walker.ts:126` |
| B | `override` applied to a non-overriding member | none — only `state` / `componentDidCatch` / `componentDidUpdate` / `render` marked; statics left alone | **DROPPED** | 6 files + TS1029 probe |
| C | New tests pass for the wrong reason | none — each ARMED test pinned to its own flag by isolation probe; `compile()` resolves the real tsconfig via the TS API so it cannot drift | **DROPPED** | `tests/consumer-strict-tsconfig.test.ts` |
| D | Sweep incomplete | none — grep finds exactly 6 class components repo-wide; `tsc` exit 0 | **DROPPED** | `npx tsc --noEmit` |
| E | **Plan doc claims work that does not exist** — R6/R7 pre-ticked; blast-radius table promised an ADR + `readiness.config.md` update that were absent; STATUS still read "F1 deferred" | A next session resumes from STATUS/plan and believes F1 closed + documented when the durable record says deferred and no ADR exists | **CONFIRMED** (Medium) | `ls .claude/decisions/*consumer-strict*` → no match |
| F | New `tests/` dir breaks a folder-walker | none — all walkers scope to `src/registry/components/`; four validators re-run clean | **DROPPED** | validators re-run |

**E fixed before close-out:** ADR written (`.claude/decisions/2026-08-18-consumer-strict-tsconfig.md`),
`readiness.config.md` updated (gate-1 note, parked-flag table, `repo` tier), STATUS.md Recent-activity
entry added. The boxes below were only ticked once each was true — which is the whole point of the
finding: **a state doc that overstates what landed is exactly as harmful as a stale config**, and it
was caught only because the finder checked the tree instead of trusting the checkboxes.

## Pre-mortem (R7)

If this breaks, it breaks because a consumer enables one of the five **parked** flags — most likely
`exactOptionalPropertyTypes` (525) — and hits exactly the class of failure this arc was meant to
end, just through a door we measured and chose to leave shut for now. That is a known, numbered
risk, not a surprise; the burn-down order is written above.
