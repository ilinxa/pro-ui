---
date: 2026-05-09
session: 14
phase: 7-followup
type: cleanup
commits:
  - c4662bb
components: []
findings:
  - F-cross-11 path (b) closed
  - new bug surfaced + fixed via path (b): barrel-meta-export drift
status: complete
---

# F-cross-11 path (b) closed — Smoke harness gains consumer-side tsc check

Phase 7 Group I closed F-cross-11 via doc-only mitigation (component-guide §11.6 + cross-references in 6 procomp guides). The brittleness *itself* (consumer-side rewrite mismatch) was mitigated by convention, not eliminated. This commit lands path (b) — the actual code-level guard at producer-commit time.

## What changed

**Harness side** (`e:/tmp/ilinxa-smoke-consumer/scripts/smoke-all.mjs`):

After the per-slug install loop completes, run `pnpm tsc --noEmit` once over the harness's full `src/` tree. Parse stderr/stdout for file paths matching `src/components/<slug>/...`, attribute each error to its slug. Augment per-slug results with a `tsc` status:

- `pass` — install passed AND slug not in tsc's failed-slug set
- `fail` — install passed AND slug IS in tsc's failed-slug set (the F-cross-11 brittleness signal)
- `skipped` — install did not pass (tsc not relevant for that slug's surface)

Report markdown gains a "Consumer-side typecheck" section with pass/fail counts, implicated-slug list, and an excerpt of tsc errors. Per-slug table gains a TSC column. Exit code is now non-zero on EITHER install failures OR tsc failures.

Cost: one `pnpm tsc --noEmit` over a full-installed harness src/ tree is ~25s. Cheaper than per-slug tsc (would be 36 × ~10–50s). Per-slug attribution still works because tsc reports paths for every error.

**Harness commit:** `9310088` "feat(smoke-all): add consumer-side tsc check after install loop (F-cross-11 path b)" — local-only, not pushed (the harness intentionally lives outside the producer repo and is never pushed).

## What it caught on its first run (producer commit `c4662bb`)

A real, pervasive producer-side bug that producer-side `tsc` couldn't catch:

Every component's barrel `index.ts` had `export { meta } from "./meta";`. `meta.ts` IS in the producer repo (so producer tsc passed) — but `meta.ts` is intentionally docs-site-only and excluded from registry shipments per CLAUDE.md ("Never include `demo.tsx`, `usage.tsx`, or `meta.ts`"). So consumer-side, every installed `index.ts` had a broken import to a non-existent file:

```
src/components/<slug>/index.ts(N,N): error TS2307: Cannot find module './meta'
```

The docs-site manifest (`src/registry/manifest.ts`) imports meta DIRECTLY from `./meta` paths — never through the barrel. So the re-export was dead code producer-side AND broken consumer-side. Fixed in producer commit `c4662bb` via a single mechanical `sed` pass over 37 sites (36 components + 1 `_template`).

The fix exemplifies path (b)'s value: producer-side everything looked clean (`pnpm tsc --noEmit` passed; nothing in producer source consumed the barrel meta export). The bug reached users only when they ran `pnpm dlx shadcn add @ilinxa/<slug>` — by which point it was too late. Path (b) catches this class of bug at producer-commit time.

## Path (c) deferral

Path (c) — realigning cross-folder import paths from `@/registry/components/<cat>/<slug>` to `@/components/<slug>` via tsconfig path mapping — remains deferred. With (b) actively guarding consumer-side tsc, (c)'s additional value is marginal:

- (b) catches every class of consumer-side type error, not just cross-folder imports
- (c) would only catch the specific subset (b) already covers
- (c) is more invasive (touches every cross-folder import in registry source)
- Today's data: (b)'s first run found a non-cross-folder bug, suggesting the cross-folder shape itself was already mostly clean (the doc-path mitigation in Group I sufficed for that subset)

If a future bug class shows up where (b) catches at-CI rather than at-commit and we want the latter, (c) becomes worth doing. Until then, leave deferred.

## Filter-stack tsc errors (not blocking; harness drift)

The first smoke run also flagged 4 errors in `filter-stack/parts/{mode-toggle,solo-button}.tsx`:
- `Type 'FilterMode' is not assignable to type 'readonly string[] | undefined'`
- `'delayDuration' does not exist on type 'TooltipProviderProps'`

Producer-side and harness-installed source files are byte-identical at these lines. The discrepancy is HARNESS-SIDE Radix primitive drift — the harness has older `@radix-ui/react-toggle-group` / `@radix-ui/react-tooltip` than the producer. Not a producer bug. Filed for a separate harness-baseline-bump follow-up (out of path (b) scope).

## Verification

After producer commit `c4662bb` pushed and Vercel redeployed:

```
$ rm -rf src/components/* && node scripts/smoke-all.mjs --slug data-table
[1/1] data-table                   ... pass           3994ms
Consumer-side typecheck: pnpm tsc --noEmit
  ✓ tsc clean (2087ms)
Install pass: 1 · TSC pass: 1 · TSC fail: 0
```

End-to-end success: install pass + tsc clean. Path (b) is operational and actively guards going forward.

## Cross-references

- Sweep tracker F-cross-11 row updated: doc-only mitigation → fully closed via paths (a) + (b)
- STATUS.md "Open decisions / TODOs" — F-cross-11 entry struck through
- Producer fix commit: `c4662bb`
- Harness extension commit: `9310088` (in `e:/tmp/ilinxa-smoke-consumer/.git`)
- Phase 7 Group I (path a — doc mitigation): [`2026-05-09-session-14-phase-7.md`](2026-05-09-session-14-phase-7.md)
