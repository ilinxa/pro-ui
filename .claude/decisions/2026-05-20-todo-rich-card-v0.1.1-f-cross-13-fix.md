---
date: 2026-05-20
type: fix
commits: [431da34]
components: [todo-rich-card]
findings: [F-cross-13]
status: shipped
---

# todo-rich-card v0.1.1 — F-cross-13 primitive divergence fix (smoke F-04 closure)

## Summary

`todo-rich-card@v0.1.1` closes F-04 from the v0.1.0 GATE 3 spotcheck. F-cross-11 path-b smoke against the published Vercel artifact surfaced 3 F-cross-13 instances (Radix → Base UI primitive divergence between producer-pinned `src/components/ui/*` and consumer-installed primitives via `shadcn@4.6.0 add`):

| Site | Symptom | Fix |
|---|---|---|
| [`parts/edit-inline.tsx:133`](../../src/registry/components/data/todo-rich-card/parts/edit-inline.tsx) | `Select.onValueChange` callback typed `(v: string) => void` rejected by Base UI's `(v: string \| null) => void` | Widened to `(v: string \| null) => { const next = v ?? ""; setValue(next); commit(..., next); }` |
| [`parts/edit-popup.tsx:177`](../../src/registry/components/data/todo-rich-card/parts/edit-popup.tsx) | Same class on status Select | Same widening pattern with `setField("status", v ?? "")` |
| [`parts/time-info.tsx:32`](../../src/registry/components/data/todo-rich-card/parts/time-info.tsx) | `TooltipProvider.delayDuration={200}` — Radix prop name, Base UI uses `delay` | Dropped the prop; default delay is acceptable |

Same defensive callback contravariance + divergent-prop-name drop pattern established in rich-card-in-flow v0.2.0 B4 ([commit `5684bc5`](https://github.com/ilinxa/pro-ui/commit/5684bc5)); per-procomp defense path (a) from the [F-cross-13 sweep-tracker entry](../../docs/reviews/sweep-tracker.md). Path (b) — producer-side primitive refresh — remains a standalone hygiene task.

**Patch-bump exemption** per the [readiness-review rule](../rules/component-readiness-review.md). Internal-only fix, no public API touch, GATE 3 skipped; v0.1.0 spotcheck verdict `Pass with follow-ups` carries forward with F-04 flipped to **Closed**.

## Verification

| Check | Result |
|---|---|
| Producer `pnpm tsc --noEmit` | ✅ 0 errors |
| Producer `pnpm lint` | ✅ 2 pre-existing virtualizer warnings, unchanged |
| `pnpm validate:meta-deps` | ✅ 44/44 clean |
| `pnpm registry:build` | ✅ `public/r/todo-rich-card.json` + `-fixtures.json` regenerated |
| F-cross-11 path-b consumer-tsc (post-Vercel-deploy) | ✅ 0 todo-rich-card errors (97 pre-existing peer-dep errors in code-block / flow-canvas-01 / json-form / pdf-viewer carried forward; not regressions) |

## Lesson

The F-cross-13 lock is now reinforced by a second clean precedent (rcif v0.2.0 B4 was the first). Any procomp that ships `Select` or `Tooltip` will hit this on first path-b smoke. **Future v0.1.0 first-ship plans should pre-emptively widen Select `onValueChange` callbacks and avoid the divergent prop names** — saves a same-day patch bump cycle.
