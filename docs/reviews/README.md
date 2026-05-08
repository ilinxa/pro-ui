# Procomp review system

A senior-grade review framework for ilinxa-ui-pro procomponents. Use this when a component is approaching beta-gate, when bumping a major-feature version (e.g. v0.1 → v0.2), before a public-distribution build, or whenever a fresh pair of eyes is genuinely useful.

> **Goal:** ship procomponents that hold up under real-consumer use. **Not** to ceremonially tick boxes.

## What's in this folder

| File | Purpose |
|---|---|
| [`README.md`](README.md) | This file — overview, index, when to use |
| [`review-process.md`](review-process.md) | The end-to-end flow: trigger → prep → review → report → sign-off |
| [`review-guide.md`](review-guide.md) | **The deep reference.** 14 review dimensions × what to check, why, good vs bad signals |
| [`templates/review-checklist.md`](templates/review-checklist.md) | Tickable checklist — copy into the procomp folder, work through it during the review |
| [`templates/review-report.md`](templates/review-report.md) | Narrative report — copy into the procomp folder, fill in findings + verdict |

## Where filled reviews live

Per-component, **not** in this folder. A completed review produces **two** files (a working checklist + the narrative report), both timestamped + version-tagged, both living next to the procomp docs:

```
docs/procomps/<slug>-procomp/
├── <slug>-procomp-description.md
├── <slug>-procomp-plan.md
├── <slug>-procomp-guide.md
└── reviews/
    ├── <YYYY-MM-DD>-v<version>-checklist.md   ← working scratch (tickable, with notes)
    └── <YYYY-MM-DD>-v<version>-review.md      ← the deliverable (narrative + verdict)
```

Filename pattern is **deterministic** — date (`YYYY-MM-DD`) + version (`v<x.y.z>`) + role (`checklist` | `review`). Re-reviews on a later version produce a new pair (no overwriting). Two reviews on the same component, same day, same version is the only collision case — append `-r2`, `-r3` to the version segment if it ever comes up.

This keeps every doc about a procomp's lifecycle in one folder, matching how description / plan / guide already work.

## When to trigger a review

| Trigger | Rigor |
|---|---|
| Pre-beta-gate (status moving from `alpha` → `beta`) | **Full review** — every dimension |
| Major-feature bump (v0.1 → v0.2, v0.2 → v0.3) | **Full review** — every dimension |
| Pre-public-distribution / pre-NPM extraction | **Full review** + cross-component coherence pass |
| Patch bump (v0.1.0 → v0.1.1) | **Targeted review** — only dimensions the patch touches |
| Quarterly drift-check on shipped components | **Spot-check** — pick 3–5 dimensions, rotate over time |
| Consumer-reported bug or DX confusion | **Targeted review** — the dimensions implicated by the report |

## The 14 review dimensions

Detailed in [`review-guide.md`](review-guide.md). Summary:

1. **Procomp planning docs** — description / plan / guide completeness + accuracy
2. **Public API** — surface openness, future-proofness, type safety
3. **Component code** — sealed-folder hygiene, cleanness, conventions
4. **Demo + usage** — coverage, realism, extensibility shown
5. **Dependencies** — declared, minimal, accurate
6. **Design system** — token adherence, no forbidden patterns
7. **Accessibility** — keyboard, ARIA, motion, contrast
8. **Performance** — memo, refs, render budget
9. **Registry distribution** — `registry.json` correctness, target paths
10. **Meta + manifest sync** — version + status + STATUS.md row honest
11. **UI copy / text** — empty states, errors, labels
12. **Verification** — tsc / lint / build / browser
13. **Migration provenance** — when ported from another app
14. **Cross-component coherence** — pattern consistency across the library

## Cross-references

- Project conventions: [`.claude/CLAUDE.md`](../../.claude/CLAUDE.md)
- Current state: [`.claude/STATUS.md`](../../.claude/STATUS.md)
- Per-component versions: [`docs/component-versions.md`](../component-versions.md)
- Procomp authoring workflow: [`docs/procomps/README.md`](../procomps/README.md)
- Component-author rules + worked example: [`docs/component-guide.md`](../component-guide.md)
- Migration intake: [`docs/migrations/README.md`](../migrations/README.md)
