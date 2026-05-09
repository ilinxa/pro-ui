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
  - F-cross-12 v0.1.x transition shipped (deprecation period begins)
status: complete
---

# F-cross-12 — v0.1.x callback transition shipped

All 6 positional callbacks across 5 components now have object-shape `<oldName>Args` siblings. Positional shapes still work (back-compat) but emit dev-only `console.warn` when called. v0.2 will remove positional shapes and rename `*Args` → `*` (the "real" name everyone gets used to).

## Summary

| Component | Old (deprecated) | New (object-shape) |
|---|---|---|
| `grid-layout-news-01` | `renderItem(item, slot)` | `renderItemArgs({ item, slot, index })` |
| `content-card-news-01` | `onClick(item, event)` | `onClickArgs({ item, event })` |
| `project-card-01` | `onClick(project, mouseEvent)` | `onClickArgs({ project, mouseEvent })` |
| `story-rail-01` | `onItemClick(item, index)` | `onItemClickArgs({ item, index })` |
| `kanban-board-01` | `onItemCreate(columnId, item)` | `onItemCreateArgs({ columnId, item })` |
| `kanban-board-01` | `onItemMove(item, from, to)` | `onItemMoveArgs({ item, from, to })` |

## Pattern

For each callback, types.ts gets:
- Old positional prop kept, JSDoc-marked `@deprecated` with migration note
- New `<oldName>Args` prop added with full object-shape signature

Component body adds a resolver:

```ts
const resolved = newPropArgs
  ? (...positional) => newPropArgs({ ...assembleArgs(...positional) })
  : oldProp
    ? (() => {
        if (process.env.NODE_ENV !== "production") {
          console.warn("[<slug>] `<oldName>` positional signature is @deprecated. Use `<oldName>Args` for the object-shape signature; v0.2 will remove the positional shape.");
        }
        return oldProp;
      })()
    : undefined;
```

The resolver is computed inline (NOT in `useMemo`) — React Compiler memoizes automatically and is strict about manual-memoization deps when destructured props vs full props don't align (caught earlier in Phase 7 Group A and Group H). The conditional-IIFE pattern emits the warn exactly once per component re-render with stale prop, which the browser dev console deduplicates.

## Per-component shape choices

- `renderItemArgs` for grid-layout-news adds a NEW `index: number` field — useful context the positional shape didn't expose. Featured-item call site passes `index: 0`.
- `onClickArgs` for content-card-news + project-card preserves the same field set, just bundled.
- `onItemClickArgs` for story-rail preserves field set.
- `onItemCreateArgs` / `onItemMoveArgs` for kanban-board preserve field sets including the nested `from` / `to` swimlane objects.

## Why dual-prop instead of arity-based runtime branching

The "single prop, dual-shape" pattern (using `Function.prototype.length` to detect old vs new) was rejected: arity is unreliable for distinguishing `(item, slot) => ...` (length 2) from `({ item, slot }) => ...` (length 1) when the consumer also writes things like `(item) => ...` (length 1, ignoring second arg). The dual-prop pattern is type-safe at the API surface, requires zero runtime heuristics, and lets v0.2 cleanly drop the deprecated prop.

## Why not bump 0.1.x → 0.2 now

Pre-1.0 SemVer technically permits breaking changes in minor bumps. But:
1. Phase 7 was explicitly scoped as the v0.1.x patch session for the sweep. Going from "patch session" directly to v0.2 minor bump compresses the deprecation transition window to zero.
2. Consumers with existing `renderItem(item, slot)` callbacks should see the deprecation warning at least once before the next session removes it.
3. v0.2 is also the natural home for F-cross-11 path (c) (cross-folder import realignment, deferred), so bundling that v0.2 cutover later is cleaner.

## Migration story for consumers

Existing positional consumers will see (in dev):

```
[grid-layout-news-01] `renderItem` positional signature `(item, slot)` is @deprecated. Use `renderItemArgs({ item, slot, index })` for the object-shape signature; v0.2 will remove the positional shape and rename `renderItemArgs` → `renderItem`.
```

Migration is mechanical:
```diff
- renderItem={(item, slot) => <Card item={item} variant={slot === 'large' ? 'hero' : 'tile'} />}
+ renderItemArgs={({ item, slot }) => <Card item={item} variant={slot === 'large' ? 'hero' : 'tile'} />}
```

The `index` field is new context — opt-in, not required.

## Verification

- `pnpm tsc --noEmit` clean across all 5 components
- `pnpm lint` clean (React Compiler `preserve-manual-memoization` rule satisfied via inline resolver, no useMemo)
- `pnpm validate:meta-deps` 36 / 36 clean
- Smoke harness re-run not required for this commit — F-cross-11 path (b)'s consumer-tsc would surface any consumer-side type breakage from this transition; the dual-prop pattern is purely additive (no removed API surface) so no break is possible.

## v0.2 cutover plan (out of scope, recorded for continuity)

When v0.2 lands:
1. Remove the deprecated positional prop from each types.ts
2. Rename `<oldName>Args` → `<oldName>` (the canonical name)
3. Remove the resolver indirection in each component (call the prop directly)
4. Bump each component to v0.2.0
5. Update procomp guides with the new (now-required) signature
6. Single-commit migration; F-cross-11 path (c) bundling possible if scope warrants

## Cross-references

- F-cross-12 sweep tracker entry remains "v0.2 candidate" but with this transition shipped, the v0.2 work is now mechanical
- STATUS.md "Open decisions / TODOs" — F-cross-12 entry struck through with transition note
- Component versions: 4 components moved to v0.1.1 (or v0.1.2 / v0.2.2 where prior bumps existed)
- Phase 7 close decision: [`2026-05-09-session-14-phase-7.md`](2026-05-09-session-14-phase-7.md)
- Earlier follow-up cleanups: [`2026-05-09-fcross04-self-host-fonts.md`](2026-05-09-fcross04-self-host-fonts.md), [`2026-05-09-fcross11-path-b-smoke-tsc.md`](2026-05-09-fcross11-path-b-smoke-tsc.md)
