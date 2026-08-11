---
date: 2026-08-11
session: P3 readiness loop (feature-slicing end-to-end)
phase: P3.1–P3.3
type: architecture-convention
commits: fe72f47 (base commit, 188 files) + the R7 close-out commit
components: [event-calendar 0.4.0, event-calendar-editing, media-editor 0.3.0, media-editor-capture, story-composer 0.4.0, content-composer 0.3.1, gamification-kit, team-* 0.2.1]
findings: spike C1–C7 + two seam maps + R4 14 findings (13 fixed, MED-4 owned) + R5 3 registry bugs; full evidence in docs/plans/p3-feature-slicing-plan.md; GATE 3 verdict Pass-with-follow-ups in docs/reviews/2026-08-11-p3-feature-slicing-review.md
status: FINAL — ratified 2026-08-11
---

# P3 feature-slicing convention: injection-surface feature items (strategy b)

## Decision

Heavy opt-in capability ships as a **feature item**: a registry.json item marked
`meta: { featureOf: "<base-slug>", budgetKB: <n> }`, named `<base-slug>-<feature>`, shipping ONLY
NEW files into `components/<base-slug>/features/<feature-name>/...`, with
`registryDependencies: ["@ilinxa/<base-slug>"]`. The base component exposes a **prop-based
injection surface** (base-owned extension context + extension type + optional prop, null default);
feature files export the implementation. No base file ever statically imports a feature file.
Module-side-effect registration is forbidden (RSC/tree-shaking fragility).

**Strategy (a) — stub-file-overwritten-by-feature-item — is REJECTED** on spike evidence:
the stub≠real content difference makes every upgrade install collide by construction, and the CLI's
conflict handling is hostile to that path — non-interactive runs abort the ENTIRE write with exit 0
(phantom success), and `--overwrite` rewrites every differing file in the resolved graph,
destroying consumers' local edits to base files (spike C2). Strategy (b) never self-collides;
its only residual hazard (regDep re-resolution prompting on locally-modified base files) is shared
with the existing fixtures pattern, absent on pristine bases (C3b), and survivable interactively
(answer `n`; the feature file still lands — C6).

## Locked mechanics

1. Marker: `meta.featureOf` — the 4th exclusion predicate beside `-fixtures` / `meta.deprecated` /
   `_shared` in validate-registry-json / validate-naming / build-llms (lockstep).
2. Feature-only npm deps live on the feature item (per-item `dependencies` — registry-side scan is
   per-item). Producer meta.ts keeps the union (docs site renders the composed component;
   `validate:meta-deps` stays folder-scoped — unchanged).
3. Back-compat: capability props (e.g. `editable`) stay on the base's public API; set without the
   extension wired → read-only behavior + one console.warn (documented negative path).
4. Docs site renders the full composed component; only `InstallationBlock` is slice-aware
   (driven by new `ComponentMeta.slices`).
5. Size governance: `ComponentMeta.artifactBudgetKB` (all components) + feature-item `meta.budgetKB`;
   `validate:artifact-size` fails >20% over budget; budget raises are same-commit auditable.
6. Upgrade recipe (docs): pristine base → plain `add` works; locally-modified base → interactive
   prompt, answer `n` per base file; non-interactive upgrades onto modified bases are a known
   phantom-no-op (pre-existing fixtures-pattern hazard, now documented).

## Evidence-based deviation from the master plan

The P3.2 "base ≤50% of current artifact" bar is unreachable for both pilots
(media-editor's capture axis = 15.3% LOC, zero npm weight — the KB is konva, needed by every
consumer; event-calendar's honest edit axis ≈ 37%). Revised bars (plan doc §Success bars):
event-calendar base ≤135KB + sheds `@dnd-kit/*`; media-editor: capture slice + file-intake moved
to base (upload path was a placeholder — pre-existing gap) + konva `React.lazy` + story-composer
deprecated-re-export cleanup. Pilot 2's value is proving the convention on the hardest consumer
topology, not KB.
