---
date: 2026-05-09
session: 14
phase: 7-followup
type: cleanup
commits:
  - (this commit)
components: []
findings: []
status: complete
---

# Session 14 follow-up — Close the smaller open items in STATUS.md

Post-Phase-7 cleanup pass on STATUS.md "Open decisions / TODOs" — close the items that have actually been settled, restructure the rest as informed-defers with explicit triggers, drop redundant settled-rule notes.

## Summary

Two real changes plus a structure refactor:

1. **Removed 4 unused fields from `src/registry/types.ts`** — `ComponentMeta.subcategory`, `ComponentMeta.thumbnail`, `RegistryEntry.examples`, plus the `ComponentExample` type. All confirmed zero-references via grep. Adding API surface without consumers risked accidental population that has no effect; better to remove and re-add later if a real use case appears.

2. **Removed the "Lime contrast pattern" entry from Open decisions / TODOs.** It's not a TODO — it's a settled design rule already enshrined in `.claude/CLAUDE.md`'s *Design system mandate* section. Listing it as an open decision was stale.

3. **Restructured `## Open decisions / TODOs` into two sub-sections:**
   - **Active — needs decision or work** — F-cross-12 (v0.2) + F-cross-11 follow-up paths (b)/(c).
   - **Informed defers — explicit trigger to revisit** — MDX, NPM, Vitest, F-cross-04. Each entry now states a concrete trigger condition rather than open-ended "consider …".
   
   Closed entries (F-cross-01, F-cross-11) dropped from the active list — their per-decision files preserve the history.

## Why

The TODO list was accumulating stale items: closed-but-not-pruned entries, settled rules misfiled as TODOs, deferred work without explicit revisit conditions. Result: hard to scan; new contributors couldn't tell which items still mattered.

The cleanup leaves only items that are either (a) actively being weighed for v0.2, or (b) genuinely deferred but with a stated trigger that defines when to look at them again.

## What was confirmed unused (verbatim grep evidence)

```
ComponentMeta.subcategory:
  - src/registry/types.ts:34 (definition only — zero other matches)

ComponentMeta.thumbnail:
  - src/registry/types.ts:51 (definition only)
  - story-rail-01/parts/story-thumbnail.tsx:47 — UNRELATED (`labels.thumbnailAriaLabel` on the story-rail labels, not the meta field)
  - event-card-01/usage.tsx:53 — UNRELATED (the word "thumbnail" appearing in a doc string about the list variant)

RegistryEntry.examples + ComponentExample:
  - src/registry/types.ts:24 (ComponentExample definition)
  - src/registry/types.ts:58 (examples? field)
  - zero other matches anywhere in the repo
```

No `meta.ts` file populates `subcategory` or `thumbnail`. No `manifest.ts` registration provides `examples`. Safe removal.

## What was kept

- `ComponentMeta.related` — actively used by sweep-tracker to link siblings (verified via grep). Stays.
- All other meta fields — actively rendered in the docs site detail pages.

## Verification

- `pnpm tsc --noEmit` clean
- `pnpm lint` clean
- `pnpm validate:meta-deps` 36/36 clean

No type narrowing or removal triggered any cascading errors — confirms the dead-weight conclusion.

## Going forward

The 4 informed-defers each have an explicit trigger in STATUS.md. The 2 active items are F-cross-12 + F-cross-11 follow-up paths (b)/(c) — both v0.2-bound. New component work from the Roadmap (stat-card, empty-state, multi-select, etc.) is the next likely move.

## Cross-references

- STATUS.md restructure (this commit)
- `src/registry/types.ts` (4 type members removed)
- Phase 7 close decision: [`2026-05-09-session-14-phase-7.md`](2026-05-09-session-14-phase-7.md)
