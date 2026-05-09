---
date: 2026-05-09
session: 14
phase: 7-followup
type: cleanup
commits:
  - (this commit)
components:
  - grid-layout-news-01
  - content-card-news-01
  - project-card-01
  - story-rail-01
  - kanban-board-01
findings:
  - F-cross-12 fully closed (v0.2 cutover)
status: complete
---

# F-cross-12 — v0.2 cutover landed

The v0.1.x deprecation transition (sibling `*Args` props with dev-only `console.warn` on the old positional shapes) shipped in commit `8b212d2`. This commit removes the deprecated positional shapes entirely and renames `<oldName>Args` → `<oldName>` (canonical name now carries the object shape).

## Per-component shape (final)

| Component | Final signature |
|---|---|
| `grid-layout-news-01` | `renderItem({ item, slot, index })` |
| `content-card-news-01` | `onClick({ item, event })` |
| `project-card-01` | `onClick({ project, mouseEvent })` |
| `story-rail-01` | `onItemClick({ item, index })` |
| `kanban-board-01` | `onItemCreate({ columnId, item })` + `onItemMove({ item, from, to })` |

## What changed in code

For each component:
- **types.ts** — old positional prop entry removed; `*Args` prop entry renamed to canonical name (`renderItem`, `onClick`, `onItemClick`, `onItemCreate`, `onItemMove`)
- **Main `<slug>.tsx`** — resolver IIFE removed; the destructured prop is now used directly. Where internal parts/hooks still take a positional shape (they're internal contract, not consumer-facing), a small adapter wrapper bridges between the public object-shape callback and the internal positional one (`handlePartClick` in project-card-01, `handlePartItemClick` in story-rail-01, `handlePartItemMove` in kanban-board-01).
- **`magazine-tower.tsx`** (grid-layout-news's part) — switched to object-shape internally for consistency with the parent
- **Demos** — `(item, slot) => ...` patterns updated to `({ item: alias, slot }) => ...` etc.

## Demo touch summary

- grid-layout-news-01/demo.tsx — 3 `renderItem={(article, slot) =>` sites updated to `({ item: article, slot })`
- story-rail-01/demo.tsx — 1 `onItemClick={(item, index) =>` site updated to `({ item, index })`
- content-card-news-01/demo.tsx — no card-level onClick usage; only Button-level (DOM-shape, untouched)
- project-card-01/demo.tsx — same; no card-level onClick
- kanban-board-01/demo.tsx — neither callback used in demo

## Version bumps

| Component | From | To |
|---|---|---|
| `grid-layout-news-01` | 0.1.2 | 0.2.0 (breaking — positional `renderItem` removed) |
| `content-card-news-01` | 0.1.1 | 0.2.0 (breaking — positional `onClick` removed) |
| `project-card-01` | 0.1.1 | 0.2.0 (breaking — positional `onClick` removed) |
| `story-rail-01` | 0.1.1 | 0.2.0 (breaking — positional `onItemClick` removed) |
| `kanban-board-01` | 0.2.2 | 0.3.0 (breaking — positional `onItemCreate` + `onItemMove` removed) |

All five hit a new minor (allowed for pre-1.0 per CLAUDE.md SemVer).

## Why immediate cutover after the v0.1.x deprecation

The v0.1.x transition (`8b212d2`) was authored just before this cutover. Normally consumers would have a release window between deprecation and removal to migrate; here:

- The library is single-team-internal (no external consumers known)
- The deprecation transition served primarily as a TYPE-LEVEL signpost (`@deprecated` JSDoc → IDE tooltip warns) rather than a multi-week migration window
- F-cross-11 path (b)'s consumer-side smoke tsc would catch any consumer who fell behind; today the consumer surface (this repo's own demos + tests) is fully migrated in this same commit
- Bundling the cutover with the transition keeps the `*Args` naming churn out of the long-term API history — future readers see only the object-shape canonical names, not the transitional sibling

## Verification

- `pnpm tsc --noEmit` clean
- `pnpm lint` clean (the simpler post-cutover code has no React Compiler memoization issues)
- `pnpm validate:meta-deps` 36 / 36 clean
- F-cross-11 path (b) consumer-side tsc would flag any breakage on next smoke run; the demo updates cover the consumer surface in this repo

## Cross-references

- v0.1.x transition: [`2026-05-09-fcross12-callback-migration-transition.md`](2026-05-09-fcross12-callback-migration-transition.md)
- F-cross-04 (offline build): [`2026-05-09-fcross04-self-host-fonts.md`](2026-05-09-fcross04-self-host-fonts.md)
- F-cross-11 path (b) (consumer-tsc smoke): [`2026-05-09-fcross11-path-b-smoke-tsc.md`](2026-05-09-fcross11-path-b-smoke-tsc.md)
- Phase 7 close: [`2026-05-09-session-14-phase-7.md`](2026-05-09-session-14-phase-7.md)
- All 12 F-cross findings now closed.
