# Loop state — `<slug>` (<C-loop | U-loop>)

<!-- Copy to docs/procomps/<slug>-procomp/<slug>-loop.md at stage 0. This file IS the state
     machine: a fresh session resumes from the first unchecked gate. Update the Status header at
     EVERY stage transition — a stale header makes the file a lie (P4 retro F-8). -->

## Status

| Field | Value |
|---|---|
| **Mode** | `<C-loop | U-loop (change class: patch/minor/breaking/promotion)>` |
| **Current stage** | `<C0..C8 | U0..U7> — <one-line what's happening>` |
| **Sign-off policy** | `<user-interactive | delegated by user (context: …)>` |
| **Version target** | `<v0.1.0 | vX.Y.Z → vX.Y'.Z'>` |
| **Model roster** | architect: main session · implementers: `<model>` · finders: `<model>` |
| **Started / updated** | `<YYYY-MM-DD>` / `<YYYY-MM-DD>` |

## Stage checklist

<!-- Keep only the relevant loop's rows. Tick with evidence, not intentions. -->

- [ ] 0 Intake — overlap/naming grep · tier + compound classified · peers verified (`pnpm view` outputs)
- [ ] 1 Description/contract — self-adversarial findings recorded · **sign-off:** `<…>`
- [ ] 2 Plan — invariants + blast-radius + registry-item plan + size estimate · **sign-off:** `<…>`
- [ ] 3 Implement — slices below all ticked with spot-check evidence
- [ ] 4 Gate battery — real numbers below
- [ ] 5 Adversarial review — findings table below, no open CONFIRMED
- [ ] 6 Runtime & smoke — evidence below, negative path included
- [ ] 7 Docs & GATE 3 review — review file path + verdict: `<…>`
- [ ] 8 Ship — commit SHA · post-deploy check · retro appended

## Slice plan

| # | Slice | Owner (agent/self) | Status | Spot-check evidence |
|---|---|---|---|---|
| 1 | `<…>` | `<…>` | `<pending/done>` | `<file:line read by coordinator>` |

## Invariants

| # | Invariant (testable) | Reviewed (C5/U4) | Observed live (C6/U5) |
|---|---|---|---|
| I1 | `<…>` | `<…>` | `<evidence>` |
| I-neg | `<negative path>` | `<…>` | `<evidence>` |

## Blast radius

| Surface | Why touched | Synced (stage 7) |
|---|---|---|
| `<manifest.ts / registry.json / STATUS / …>` | `<…>` | `<…>` |

## Gate battery (stage 4 — real numbers)

| Gate | Result |
|---|---|
| tsc | `<…>` |
| lint | `<…>` |
| meta-deps | `<…>` |
| registry validators | `<…>` |
| doc validators | `<…>` |
| registry:build | `<…>` |
| build | `<…>` |

## Findings table (stage 5)

| # | Finding (failure scenario) | Source | Verdict | Evidence / refutation | Fix |
|---|---|---|---|---|---|
| F1 | `<…>` | `<finder-1/self>` | `<CONFIRMED/DROPPED>` | `<file:line>` | `<commit'd in slice N / —>` |

## Runtime & smoke evidence (stage 6)

- Docs site: `<what was mounted/exercised, themes, screenshots>`
- Install: `<slug(s) installed · consumer tsc result · render check · negative path>`

## Parked

<!-- Adjacent problems discovered but out of scope. One line + owner suggestion. Promoted at close. -->

## Pre-mortem (stage 8)

If this breaks for a consumer, it breaks because: `<…>`
