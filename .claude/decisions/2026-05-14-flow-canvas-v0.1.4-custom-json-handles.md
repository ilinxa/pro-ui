---
date: 2026-05-14
type: fix
commits: []
components: [flow-canvas-01]
findings: []
status: shipped
---

# flow-canvas-01 v0.1.4 — fix custom-json renderer missing port handles

## Summary

`customJsonRenderer` — the built-in fallback for unknown `__type` data and `__type: "custom-json"` — never rendered `<Handle>` elements, even when `data.ports` declared ports. Every render frame, xyflow's edge layer called `getEdgePosition` for each edge, failed because the source/target handles didn't exist in the DOM, and logged a "[React Flow]: Couldn't create edge for source handle id" warning. At N=200 with two edges per node, this was ~24,000 failed lookups + console warnings per second — the cliff in light-fixture FPS at N≥100 was warning-spam CPU cost, not a React reconciliation cost. **Fix:** added 4 `<PortsAt>` calls (one per side) to `CustomJsonNodeImpl`. Result: 15-20× FPS improvement at N=200-1000 on the light fixture, console clean during pan.

## Context

Discovered during v0.2 perf-tier pre-work measurement (see [docs/procomps/flow-canvas-01-procomp/research/2026-05-14-baseline.md](../../docs/procomps/flow-canvas-01-procomp/research/2026-05-14-baseline.md)). The light stress fixture (`makeStressData`, custom-json nodes) was hitting a hard wall at N=200 (~10 FPS) while the heavy fixture (synthetic richish renderer) handled N=5000 at 60-70 FPS. After a wrong-hypothesis patch attempt (`<details>`/`<summary>` rewrite, reverted), the user spotted via screenshot + console that:

1. Custom-json nodes rendered with no visible port circles.
2. The console flooded with "[React Flow]: Couldn't create edge ..." warnings during pan.

The fixture data declared ports correctly (`ports: [{id: "in", side: "left", dir: "in"}, {id: "out", side: "right", dir: "out", multi: true}]`); the renderer simply didn't emit `<Handle>` elements for them. Comparison against the heavy renderer (which had `<PortsAt>` calls all along) confirmed the bug.

Without this fix, every consumer who dropped port-bearing JSON onto a canvas that fell through to the `custom-json` fallback (no registered renderer for that `__type`) saw broken edges + a flood of warnings + extreme FPS degradation at any scale.

## Outcome

**Code:**
- [src/registry/components/data/flow-canvas-01/parts/custom-json-node.tsx](../../src/registry/components/data/flow-canvas-01/parts/custom-json-node.tsx) — added `import { PortsAt } from "./ports-at"`; added `relative` to the outer wrapper className (xyflow handles need a positioned ancestor); added 4 `<PortsAt ports={data.ports} position="..." />` lines before the closing `</div>`. Total: ~6 lines.
- [src/registry/components/data/flow-canvas-01/meta.ts](../../src/registry/components/data/flow-canvas-01/meta.ts) — `version: "0.1.3" → "0.1.4"`, `updatedAt: "2026-05-11" → "2026-05-14"`.

**Verification:**
- `pnpm tsc --noEmit` — 0 errors.
- `pnpm lint` — 0 errors (2 pre-existing warnings in unrelated files).
- `pnpm validate:meta-deps` — 42/42 clean.
- Dev server hot-reloaded; sandbox stress page returns HTTP 200.
- Console during pan: clean (no edge warnings).
- FPS overlay during pan (light fixture, vis-on, sandbox stress page):
  - N=100: 40-90 → **160**
  - N=200: 7-15 → **100-115**
  - N=500: 3-4 → **80-90**
  - N=1000: not prior measured → **60-80**

**Behavior change:** none for callers using port-less data. For port-bearing data falling through to the fallback, port handles now render correctly and edges resolve — what the API contract always implied but didn't deliver.

**Review:** none required per [`.claude/rules/component-readiness-review.md`](../rules/component-readiness-review.md) — patch bumps (v0.1.x → v0.1.y, non-breaking, no public-API touch) do not trigger GATE 3.

## Lessons

1. **Investigate visually-rendered output before guessing at React internals.** Three speculative patches (useState removal, memo wrapper indirection, Tailwind class concerns) chased phantoms. One screenshot + one console scan from the user pinpointed the real bug in under a minute.
2. **xyflow's "missing handle" failure mode is loud in dev (warnings) but silent in perf attribution.** The `getEdgePosition` failures happen during reconciliation; they don't show as a hot component in React DevTools' "what re-rendered." They show as raw frametime cost.
3. **The FPS overlay can mislead.** A 1-second rolling average can show 50 FPS while frametimes stutter 100-200ms individually — feels terrible, looks fine on the overlay. Trust the eyes; cite DevTools Performance traces. Captured in [the measurement protocol](../../docs/procomps/flow-canvas-01-procomp/research/2026-05-14-measurement-protocol.md) §9.
4. **Long dev sessions degrade browser + HMR state independently of code.** Heavy fixture at N=5000 went from 60-70 FPS smooth to 30-49 FPS laggy with NO code changes affecting it; full restart (kill dev server PID, fresh dev server, incognito tab) restored it. Don't diagnose perf in a long-running dev session without controlling for this.

## Implications for v0.2 perf-tier roadmap

The bug fix alone delivers most of what Tier 1's plausibility ceiling promised:

| Tier 1 claim | Pre-v0.1.4 reality | Post-v0.1.4 reality |
|---|---|---|
| Light fixture ≥50 FPS at N=500 | 3-4 FPS (dead) | 80-90 FPS (smooth) |
| Heavy fixture ≥50 FPS at N=200 | 50-60 FPS (already smooth) | unchanged |

This shifts the urgency of the tier ladder — see [the baseline doc's "Implications for the v0.2 description's tier ladder" section](../../docs/procomps/flow-canvas-01-procomp/research/2026-05-14-baseline.md#implications-for-the-v02-descriptions-tier-ladder) for the full picture. Briefly: Tier 1 still ships (the default-flip is now demonstrably-valuable), Tier 2's urgency drops (light is already smooth at N=1000), Tier 3 needs a fresh use-case justification, and the sibling-procomp threshold should rise toward 10-20k.

The v0.2 description doc stays sealed (signed off 2026-05-14; changes after sign-off are loud and intentional). The v0.2 Stage 2 **plan doc** absorbs these updated priors as planning inputs.

## Cross-references

- Baseline measurements + patch attempt log: [docs/procomps/flow-canvas-01-procomp/research/2026-05-14-baseline.md](../../docs/procomps/flow-canvas-01-procomp/research/2026-05-14-baseline.md)
- Measurement protocol: [docs/procomps/flow-canvas-01-procomp/research/2026-05-14-measurement-protocol.md](../../docs/procomps/flow-canvas-01-procomp/research/2026-05-14-measurement-protocol.md)
- Driving description (still signed off, this patch doesn't change it): [docs/procomps/flow-canvas-01-procomp/flow-canvas-01-v0.2.0-perf-description.md](../../docs/procomps/flow-canvas-01-procomp/flow-canvas-01-v0.2.0-perf-description.md)
- Component source: [src/registry/components/data/flow-canvas-01/parts/custom-json-node.tsx](../../src/registry/components/data/flow-canvas-01/parts/custom-json-node.tsx)
- Readiness-review rule (patch-bump exemption): [.claude/rules/component-readiness-review.md](../rules/component-readiness-review.md)
