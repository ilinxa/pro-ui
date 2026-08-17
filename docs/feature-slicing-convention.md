# Feature-slicing convention — opt-in capability as registry feature items

> **Ratified 2026-08-11 (P3.3)** after the P3.1 spike + two shipped pilots (`event-calendar` +
> `event-calendar-editing`, `media-editor` + `media-editor-capture`), verdicted in
> [`docs/plans/p3-feature-slicing-plan.md`](plans/p3-feature-slicing-plan.md) and the decision file
> [`2026-08-11-p3-feature-slicing-convention.md`](../.claude/decisions/2026-08-11-p3-feature-slicing-convention.md).
> Strategy (a) — stub-file-overwritten-by-feature-item — was REJECTED on CLI-behavior evidence
> (upgrade installs self-collide by construction; non-interactive runs phantom-abort with exit 0;
> `--overwrite` destroys consumers' local edits graph-wide).

## What a feature item is

A registry.json item that layers **only new files** onto a base component's install and wires in
through a **base-owned injection surface** — never by overwriting base files, never by module
side-effects.

| Aspect | Rule |
|---|---|
| Marker | `meta: { featureOf: "<base-slug>", budgetKB: <n> }` — the 4th exclusion predicate (beside `-fixtures` / `meta.deprecated` / `_shared`) in every roster-aware script |
| Name | `<base-slug>-<feature>` (validator F2) |
| Files | live at `src/registry/components/<cat>/<base>/features/<feature>/…` on disk; targets `components/<base>/features/<feature>/…` (F3); **zero target collisions** with base/fixtures/sibling features (F4) |
| regDeps | `@ilinxa/<base>` REQUIRED (F5 — one-command fresh install) + every shadcn primitive the feature's own files import (bare names, never pinned style URLs) |
| npm deps | the feature item declares exactly what its files import (per-item scan); the base sheds feature-only deps; producer `meta.ts` keeps the folder union (docs site renders the composed component) |
| Budget | `meta.budgetKB` on the item (F6); `validate:artifact-size` fails >20% over |
| Docs site | base `meta.ts` lists the slice in `slices: [{ name, item, description }]` → InstallationBlock renders the install step; description obeys copy canon (≤160, self-contained) |

## The injection surface (base-side contract)

1. Base owns a seam module (e.g. `hooks/use-<x>-extension.ts`): the extension TYPE, a
   `createContext(null)`, and a `use<X>Optional()` accessor. Dependency-light (react + local types).
2. Base's public API keeps its capability props (`editable`, `mediaSources`, …) and gains ONE
   optional prop (`editing?` / `capture?`) taking the extension object.
3. The feature barrel exports the ready-made extension value (e.g. `calendarEditing`,
   `mediaCapture`) plus every symbol the base barrel dropped in the split (pre-split imports keep
   resolving from base ∪ feature).
4. Base parts read the extension context and branch (`edit ? <edit.components.X/> : <ReadOnly/>`);
   feature-owned components/gestures travel INSIDE the context value (renderer-registry style), so
   **no base file ever statically imports a feature file** — enforced by validate-registry-json's
   base→own-features check (HIGH).
5. Negative path is mandatory and tested: capability requested without the extension wired → ONE
   dev-only `console.warn` (per-instance dedup) + graceful degraded behavior (read-only calendar;
   media falls back to a real base-owned file-intake surface).
6. Consumers may inject their OWN implementation of the extension type — the seam is public API.

## Consumer upgrade recipe (document with every slice)

- Fresh: `pnpm dlx shadcn@latest add @ilinxa/<base>-<feature>` alone brings base + feature.
- Upgrade onto a PRISTINE base: plain `add` — identical base files are silently skipped.
- Upgrade onto a LOCALLY-MODIFIED base: the CLI prompts per differing base file (regDep
  re-resolution). Interactive: answer `n` to base files — the feature files still land. This
  hazard is shared with the existing `-fixtures` pattern.
- **Known limit:** non-interactive (`--yes` does NOT answer file prompts) upgrades onto a modified
  base abort the whole write with exit 0 (phantom no-op). CI flows should install slices at
  project-setup time or verify files landed.
- **P4.2 re-test (2026-08-12, CLI 4.17.0):** the 4.6.0 "false success" print is gone — re-adding
  over a locally-modified file now surfaces an overwrite prompt, which non-interactive stdin
  auto-answers "no" (file untouched, exit 0, no completion summary). Still undetectable by exit
  code alone, so the CI guidance above stands unchanged. `--overwrite` now diffs per file and
  rewrites only files that actually differ (identical files reported as skipped). The
  whole-write-abort shape on conflicting *base* files was not re-reproduced in this matrix (the
  re-test covered same-item re-add); treat it as unverified on ≥4.17.0 until the next slice ship
  exercises it. Evidence: `e:/tmp/ilinxa-p4-install-matrix-report.md` §T3.

## Removed files leave orphans in every existing consumer — say so, every time

**`shadcn add` never deletes a file an item stopped shipping.** Nothing in the registry-item
schema expresses removal (verified 2026-08-17 against the shipped CLI), so a slice — which moves
files from `components/<base>/…` to `components/<base>/features/<name>/…` — leaves the *old copies
on disk* in every consumer that installed before the split. `--overwrite` refreshes the base
around them; the dead files stay, still compiling against a base that has moved.

They fail late and they fail misleadingly: the errors point at the **new** base types and read
like a producer bug. That is exactly how it presented on 2026-08-17 — a consumer `tsc` opened with
26 errors in `event-calendar`, none of them a producer defect.

Every slice ships a **`Removed in vX — delete these`** list in the base component's guide. It is
part of the slice, not a follow-up:

```md
### Removed in v0.4.0 (P3 editing split)

These moved to `@ilinxa/event-calendar-editing`. `shadcn add` cannot delete them —
remove them by hand after upgrading:

    parts/calendar-context-menu.tsx        parts/calendar-edit-affordances.tsx
    parts/calendar-edit-overlays.tsx       parts/calendar-quick-composer.tsx
    hooks/use-calendar-edit.ts             lib/edit-mutations.ts
    lib/edit-permissions.ts
```

**Detector:** `node scripts/find-orphans.mjs` in the smoke consumer
(`e:/tmp/ilinxa-smoke-consumer/`) diffs an installed tree against every `target` in
`registry.json` and reports files no item ships. Report-only by design — an "orphan" is also what
a consumer's own hand-written file inside a component folder looks like, so it never deletes.

**Both P3 pilots had orphans, and only one was found by accident.** The detector's first run
surfaced 6 more in `media-editor` (the capture split: `parts/editor-camera.tsx`,
`parts/camera-permission-prompt.tsx`, `parts/shutter-button.tsx`, `hooks/use-media-capture.ts`,
`hooks/use-camera-permissions.ts`, `hooks/use-multi-instance-guard.ts`). Two of them compile only
because `media-editor/types.ts` still carries the `@internal` `StoryComposerLabels` shim — so the
**C17 refactor that deletes that shim will break every consumer still holding them.** C17 needs
this list as a prerequisite, not an afterthought.

## When to slice

Heavy components (≥4k LOC or ≥150KB artifact) with a coherent opt-in capability axis slice **on
next major touch** — never big-bang. Current candidates ledger: the structure audits
([`reviews/structure-audits/`](reviews/structure-audits/)) — card-tree (inline-editing, 29% LOC),
gantt-timeline (editing engine, 25%), story-viewer (engagement layer, 24%). A slice must buy real
consumer weight (npm deps or ≥15% artifact) or a real capability boundary (camera permissions) —
media-editor's konva stays base BECAUSE every consumer needs the canvas; its lazy boundary, not a
slice, carries that weight.

## Tooling map (all wired into `registry:build`)

`validate-registry-json` — F1–F7 + coverage-union + collision + per-item npm/primitive/cross-import
scans + base→own-features ban · `validate-naming` — roster exclusion + copy canon on item
descriptions · `build-llms` — `↳ optional slice:` sub-lines under the base entry, honest counts ·
`validate-doc-drift` — slice mentions present AND no stale mentions · `validate-artifact-size` —
per-item budgets + artifact-completeness vs registry.json.

## Cross-references

Compound rule (the injection surface is its natural extension): [`.claude/rules/compound-component-structure.md`](../.claude/rules/compound-component-structure.md) ·
Registry mechanics: [`component-guide.md`](component-guide.md) §11.5 + the `shadcn-registry-pro` skill ·
Spike + pilots evidence: [`plans/p3-feature-slicing-plan.md`](plans/p3-feature-slicing-plan.md).
