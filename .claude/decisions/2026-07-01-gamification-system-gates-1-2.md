---
date: 2026-07-01
session: gamification-system planning (GATES 1 + 2)
phase: planning
type: system-planning
commits: []   # working tree uncommitted at lock time
components:
  - team-progress-bar-01
  - team-trophy-shelf-01
  - cooperative-challenge-01
  - task-choice-control-01
  - team-quest-log-01
  - team-feedback-loop-01
findings: "GATE-1 audit found+fixed F-1..F-6 (added D-15 team-prop convention + D-16 celebration ownership); GATE-2 revalidation found+fixed the F-cross-13 framing error (progress/input wrongly flagged 'new primitive') in 2 plans. All docs aligned; tsc 0."
status: locked-for-resume
---

# Gamification system — GATES 1 + 2 complete, planning locked

## What

Stood up a new **`gamification-system`** (a *system* per [`docs/systems/README.md`](../../docs/systems/README.md), like `graph-system`): a **cooperative-only, team-scoped gamification layer** extracted from the thesis "Gamification Design Specification" (`e:\2026\thesis`). Decomposed into **6 pro-components, one per SDT element**:

| Slug | Element | SDT need |
|---|---|---|
| `team-progress-bar-01` | E1 Team progress bar | Competence |
| `team-trophy-shelf-01` | E2 Team milestone badges | Competence + Relatedness |
| `cooperative-challenge-01` | E3 Cooperative challenges | Relatedness |
| `task-choice-control-01` | E4 Task choice / volunteering | Autonomy |
| `team-quest-log-01` | E5 Team narrative framing | Autonomy + Relatedness |
| `team-feedback-loop-01` | E6 Engagement/progression feedback | Competence |

GATE 1 (system description + elements catalogue + 6 component descriptions) and GATE 2 (6 implementation plans) authored, deep-reviewed twice, and signed off. The `gamification` registry category was plumbed (D-01) and `team-progress-bar-01` scaffolded. **No component code implemented yet.** Working tree GREEN (`tsc` 0), uncommitted.

## Why these decisions

- **Decomposed into 6 independent pro-components, not one mega-component** — the library's pay-for-what-you-use identity (compound rule); each element is reusable beyond this domain.
- **Components are INDEPENDENT at the registry level (D-03), NOT a shared foundation package up front (D-04).** This was the key architectural call: the user initially wanted a shared "basement" package, but the deep re-validation surfaced that this conflicts with graph-system's signed-off precedent (decision #25 "don't pre-extract; premature abstraction is the bigger risk" + #35 "components independent at the registry level") AND re-introduces the cross-procomp type-import bug class that bit content-composer-01 / the task-family. **Resolution (user chose "contract now, extract kit later"):** lock the shared domain model + cooperative-only/telemetry rules in the system description's Locked Decisions (documented contract), keep each component self-contained (`registryDependencies: []`), and extract a shared `gamification-kit` only after 2–3 components prove the recurring surface. "All together" = a future Tier-host page, not a shipped umbrella.
- **D-15 (team-prop convention)** added during the GATE-1 audit: components that render team-identity *text* take a `team` object subset; identity-only components take scalar `teamId`. Resolved an inconsistency where `team-progress-bar-01` had `teamId`+`teamName` while siblings took a `team` object.
- **D-16 (celebration ownership)** added: `team-trophy-shelf-01`'s in-place award and `team-feedback-loop-01`'s overlay never trigger each other; the host wires one path per event kind (prevents double-celebration).
- **F-cross-13 reframed** during GATE-2 revalidation: the divergence risk attaches to the *primitive's* Radix↔Base-UI divergence-proneness, NOT "new to the library." `progress`/`input` (already installed, simple) were wrongly flagged as new-primitive smoke risks; corrected. Only feedback-loop's confetti npm is a genuinely new dep (→ 4-ship smoke).

## Process note (worth keeping)

The user ran the **"author → deep-adversarially-revalidate → confirm consistent → proceed"** loop at every gate (descriptions, then plans). Each revalidation pass caught **real** issues that the first pass missed (F-1..F-6 + D-15/D-16 at GATE 1; the F-cross-13 framing error at GATE 2). This is the "re-validation pass catches real issues" memory holding at the system-planning tier. The 6 descriptions and 6 plans were authored by parallel subagents from a shared brief, then I cross-checked them in one context for inter-doc alignment.

## Resume

`team-progress-bar-01` is scaffolded — implement it per its plan, then proceed down the build order. Full resume guide: [`HANDOFF-2026-07-01-gamification-system-gates-1-2-locked.md`](../HANDOFF-2026-07-01-gamification-system-gates-1-2-locked.md).
