# `force-graph` Phase 0 — Risk Spike Brief

> **Status:** **signed off 2026-04-29.** Refinements from validate pass applied (7 fixes: gate-condition wording §1+§8, fabricated dash specifics §3, Bezier over-spec §3, mix arithmetic §4, test-condition discipline §4, Tier B subset handling §9, Tier D scope §9).
> **Purpose:** Day-1 ready-to-execute brief consolidating already-locked context for the 2-day GPU benchmark spike. Not a planning artifact (Stage 1 description and v0.1 / v0.2 plans are already signed off); this is a focused execution brief so the spike author starts at "build the program" instead of "re-read the spec."
> **Scope:** This is **NOT a Claude session task.** The spike runs as 2 days of human GPU benchmarking work outside any agent session. Result is logged in [.claude/STATUS.md](../../../.claude/STATUS.md).

---

## 1. The gate (strict; pass/fail is binary on this number)

- **≥30 fps on integrated GPU at 100k edges**, steady-state with the camera idle.
- Tested on **both integrated AND discrete GPUs**. The discrete-GPU number is for headroom calibration; the integrated number is the gate.
- Sources: [graph-system-description.md §10.1](../../systems/graph-system/graph-system-description.md#101-phase-0--risk-spike-2-days), [force-graph-procomp-description.md §2 + Q4](force-graph-procomp-description.md#2-phased-delivery-v01--v06), [force-graph-v0.1-plan.md §2 + §18](force-graph-v0.1-plan.md#2-phase-0-pre-condition-must-complete-before-this-plan-signs-off).

**If pass:** v0.1 + v0.2 plans are valid as written. Implementation unblocks; next session can scaffold the component.

**If fail:** plans are invalidated; pick a contingency-tree tier (§9) and v0.1 + v0.2 plans get a "spike-result amendment" pass before implementation. Tier 1 plans + v0.6 plan are unaffected.

---

## 2. What to build — `DashedDirectedEdgeProgram` contract (locked)

A single custom Sigma WebGL edge program supporting solid+dashed × arrows × straight+curved, all per-edge attribute-driven (no uniforms). Source: [force-graph-v0.1-plan.md §8.2](force-graph-v0.1-plan.md#82-custom-dasheddirectededgeprogram).

**Per-edge attributes (locked, Q-P2):**

| Attribute | Type | Used by |
|---|---|---|
| `dashed` | `0\|1` | fragment shader — `mod(strokeLength, dashCycle)` discards pixels in gaps |
| `arrowSource` | `0\|1` | vertex shader — extend line start with arrow-tip geometry conditionally |
| `arrowTarget` | `0\|1` | vertex shader — extend line end with arrow-tip geometry conditionally |
| `curveOffset` | `float` | vertex shader — displace midpoint along perpendicular to source→target (always **0** in v0.1; consumed by v0.6 multi-edge expansion; included now to avoid program-rebuild + retest cycle later) |
| `color` | `vec4` | fragment color |
| `width` | `float` | line thickness |

**Uniforms:** none. All variation lives per-edge.

**File layout** ([force-graph-v0.1-plan.md §8.2](force-graph-v0.1-plan.md#82-custom-dasheddirectededgeprogram)):

```
parts/programs/
├── dashed-directed-edge-program.ts    # WebGL Program class
├── shaders/
│   ├── edge-vertex.glsl                # vertex shader (line endpoints + curve offset)
│   └── edge-fragment.glsl              # fragment shader (dashing + arrow heads + color)
```

**Direction visual mapping** (per [graph-visualizer-old.md §9.1](../../../graph-visualizer-old.md)):

| `EdgeType.direction` | `arrowSource` | `arrowTarget` |
|---|---|---|
| `undirected` | 0 | 0 |
| `directed` | 0 | 1 |
| `reverse` | 1 | 0 |
| `bidirectional` | 1 | 1 |

The spike must demonstrate all four through a single program instance — that's the whole point of the unified program vs. Sigma's stock split (`@sigma/edge-arrow` does directed; nothing stock does dashed+directed).

---

## 3. Implementation approach (4 steps; per [graph-visualizer-old.md §11.3](../../../graph-visualizer-old.md) + [v0.1 plan §8.2](force-graph-v0.1-plan.md#82-custom-dasheddirectededgeprogram))

1. **Start from `@sigma/edge-arrow`'s source as a base.** Clone the program class, vertex shader, fragment shader. This already handles `arrowTarget` correctly — that piece is free.
2. **Add `dashed` attribute.** Vertex shader passes per-vertex stroke-length (interpolated 0→edge-pixel-length). Fragment shader computes `mod(strokeLength, dashCycle)` and discards pixels in the gap region. Specific dash period is an aesthetic tuning concern deferred to v0.1 implementation; for the spike, any reasonable default (e.g., scaled from `@sigma/edge-arrow`'s line spacing or a fixed 4px-stroke / 4px-gap) is fine — the perf characteristic is the same regardless.
3. **Add `arrowSource` attribute.** Mirror the `arrowTarget` geometry extension at the source end. Both flags can be 1 simultaneously (bidirectional).
4. **Add `curveOffset` attribute.** Vertex shader displaces midpoint along the perpendicular to source→target by `curveOffset` pixels; tessellate the curve (quadratic Bezier or equivalent — implementation choice) between endpoints + displaced midpoint. **In v0.1 always 0** (straight lines); the spike must verify the attribute compiles, plumbs end-to-end, and renders correctly when set non-zero on a sample subset (~10 edges with `curveOffset != 0` is enough to validate; not part of the 100k benchmark).

**Sigma instance wiring** (from [v0.1 plan §8.1](force-graph-v0.1-plan.md#81-sigma-container-lifecycle)):

```ts
const sigma = new Sigma(graph, container, {
  defaultEdgeType: "dashedDirected",
  edgeProgramClasses: { dashedDirected: DashedDirectedEdgeProgram },
  // node program stays Sigma's stock NodeCircleProgram for the spike
  // (IconNodeProgram is v0.5 work; not part of this risk spike)
});
```

---

## 4. Benchmark methodology

**Graph fixture:** 100k edges over ~25k nodes (4-degree average; matches expected real-world distributions). Generate synthetic — random graph with realistic clustering (Barabási–Albert preferential attachment is fine). Direction split (sums to 100%): 50% directed-target, 25% undirected, 15% bidirectional, 10% directed-source. Independently of direction: ~30% dashed (any direction); ~10% with non-zero `curveOffset` (any direction; for the curve plumbing check).

**FA2 layout:** run for ~3 seconds via the worker, then settle. The fps gate measures **steady-state rendering at idle camera**, not layout tick performance — FA2 is not the risk being spiked. Disable FA2 for the steady-state measurement once positions stabilize.

**Measurements (capture per GPU):**

1. **Idle steady-state fps** — primary gate. Camera at default zoom showing the whole graph; no interaction; 10-second average.
2. **Pan-zoom fps** — secondary; reasonable degradation expected with `hideEdgesOnMove: false`. Capture for headroom intuition.
3. **`hideEdgesOnMove: true` pan-zoom fps** — should be near 60 fps. Confirms the production-mode escape hatch works.

**GPUs to test (at minimum):**

- Integrated: Intel Iris Xe / Apple M-series integrated / equivalent — the gate target.
- Discrete: NVIDIA GTX-class or better — headroom calibration.

**FPS overlay:** any standard rAF-based fps counter overlay (e.g., `stats.js`) or browser DevTools "Rendering" tab > "Frame Rendering Stats." Overlay must not itself meaningfully affect fps (`stats.js` is fine; React state-bound counters are not).

**Test conditions (avoid false negatives):**

- Power profile set to high-performance (NOT battery-saver / low-power); device plugged into wall power.
- Verify the actual rendering GPU via `chrome://gpu` matches intent — on dual-GPU laptops the browser may opt into the discrete GPU even when you intend integrated. Force the desired GPU via OS-level graphics settings if needed.
- No background GPU-heavy apps (video calls, screen recorders, other Chromium tabs running 3D content).
- Browser fixed to Chrome stable across runs (cross-browser variance in WebGL implementations is real; pick one and stay there).
- Hard refresh between runs to reset shader cache + GC pressure.

---

## 5. 2-day budget split (suggested; reorder if your tooling differs)

**Day 1 — implement the program:**
- Set up sandbox: standalone repo or `e:/tmp/fg-spike` with sigma, graphology, FA2 worker, `@sigma/edge-arrow` source clone, fps overlay.
- Implement `DashedDirectedEdgeProgram` per §3 steps 1–4.
- Verify all 4 direction modes + dashed combinations render correctly visually (small graph, ~50 edges, manual eyeball).
- Verify `curveOffset` plumbing on a 10-edge sample.

**Day 2 — benchmark + record:**
- Generate 100k-edge fixture per §4.
- Measure idle / pan-zoom / `hideEdgesOnMove` fps on integrated GPU. **Gate check.**
- Repeat on discrete GPU.
- Document numbers + gate result + commit SHA of spike branch in [.claude/STATUS.md](../../../.claude/STATUS.md) per §10.

---

## 6. Out of scope for the spike (explicitly)

These are NOT what the spike validates; do not let scope drift into them:

- **Custom node program / icon atlas** — v0.5 work. Use stock `NodeCircleProgram` for spike.
- **Doc-node visuals** — v0.5.
- **Group hulls, group-involving edges, group gravity** — v0.4. Not in spike fixture.
- **Source-adapter integration, validateSnapshot, Zustand store, permission resolver** — all v0.1 application code, not WebGL pipeline.
- **FA2 worker performance** — mainstream library, not the risk; spike uses it but doesn't measure it.
- **Bundle size** — `size-limit` audit lands in v0.1 implementation, not the spike.
- **A11y, keyboard shortcuts, theming** — v0.1 implementation concerns, not the WebGL pipeline question.
- **Production-quality cleanup, lifecycle, error handling** — spike is throwaway code; no React Compiler concerns; sandbox can be plain DOM if that's faster.

---

## 7. Existing source pointers

- `@sigma/edge-arrow`: starting point — npm `@sigma/edge-arrow`, source on Sigma's GitHub. Clone its `EdgeArrowProgram` class + GLSL shaders verbatim, then mutate.
- Sigma program documentation: Sigma's "custom rendering programs" guide on sigmajs.org; covers `Program` class lifecycle (`processVisibleItem`, `setUniforms`, `draw`).
- `graphology` MultiGraph API: standard; for the spike, just `addNode` + `addEdge` with type attributes set.
- `graphology-layout-forceatlas2/worker`: standard worker init; settle for ~3 seconds, then disable.

---

## 8. What "pass" looks like (concretely)

A 10-second sustained ≥30 fps reading on an integrated GPU at 100k edges, **idle camera with all edges visible** — this is the gate. (`hideEdgesOnMove` is irrelevant at idle; the setting only affects pan/zoom. Pan/zoom fps with `hideEdgesOnMove: false` is captured for headroom intuition, not as a gate condition.) All 4 direction modes (undirected, directed, reverse, bidirectional) render visually correctly. Dashed and solid edges coexist correctly. `curveOffset` plumbing demonstrated on a sample subset (curves visible when set non-zero).

---

## 9. Contingency tree (locked, decision tree — not binary)

Per [v0.1 plan Q-P4 lock](force-graph-v0.1-plan.md#17-resolved-plan-stage-questions-locked-on-sign-off-2026-04-28) + [v0.2 plan §15](force-graph-v0.2-plan.md#15-risks--alternatives) + [description Q4 + §8.5 #2](force-graph-procomp-description.md#85-plan-stage-tightenings-surfaced-during-description-review--re-validation):

**Tier A — primary plan (assumed in v0.1 + v0.2 plans):** unified `DashedDirectedEdgeProgram` per §2. Pass = ≥30 fps integrated.

**Tier B — split edge programs (intermediate fallback 1):** if the unified program fails the gate, split into two programs and switch per edge:
- `DashedEdgeProgram` (handles dashed, no arrows — for non-directional dashed connectors)
- `DirectedEdgeProgram` (handles arrows, no dashed — Sigma's stock `@sigma/edge-arrow` essentially)
- The dashed+directed intersection (doc-node directed edges per [decision #1](../../systems/graph-system/graph-system-description.md), expected as a small subset since doc nodes are a minority of the graph) renders via **targeted SVG overlay for that subset only** — not full SVG fallback. The SVG ceiling (~5k visible) is far above the expected dashed-directed count, so this works at 100k total edges as long as doc nodes stay a minority.
- Cost: program-switching overhead per edge + ~10–15KB bundle + the targeted-SVG path. Plan-level consequence: v0.1 plan §8.2 amendment + a note on the doc-edge SVG fallback path.

**Tier C — custom shader optimizations on the unified program (intermediate fallback 2):** if Tier B isn't enough or the dashed-directed subset is too large to fall back individually, optimize the unified program:
- Reduce per-vertex attribute count (pack `dashed`/`arrowSource`/`arrowTarget` into a single byte).
- Simplify fragment-shader dashing (precomputed dash texture sample instead of `mod`).
- Reduced quality at scale (drop arrow tip sub-pixel correctness).
- Plan-level consequence: §8.2 amendment + acceptance of "good enough" visual fidelity.

**Tier D — SVG-overlay rendering (worst case):** **all edges** render via SVG overlay layer (same layer that v0.4 uses for group-involving edges) — matching the [description §3 lock](force-graph-procomp-description.md#3-out-of-scope-deferred-or-external) and [graph-system-description.md §10.1](../../systems/graph-system/graph-system-description.md#101-phase-0--risk-spike-2-days). Practical visible-edge ceiling drops to ~5k — a real downgrade.
- Plan-level consequence: v0.1 + v0.2 plans both rewritten; the assumption that the WebGL pipeline carries 100k drops; product surface narrows to "small to mid-size graphs."
- Tier 1 components are unaffected ([decision #35](../../systems/graph-system/graph-system-description.md) — composition is host-side regardless).

**Order of attempts on failure:** Tier B first, then Tier C, then Tier D as last resort. Don't jump to D without trying B/C.

---

## 10. Documentation protocol when the spike completes

In [.claude/STATUS.md](../../../.claude/STATUS.md):

1. **Add a "Recent decisions" entry** dated `2026-MM-DD — Phase 0 risk spike: <pass | tier-B | tier-C | tier-D>`. Include:
   - Integrated-GPU fps at 100k edges (primary gate number)
   - Discrete-GPU fps at 100k edges
   - GPU models tested
   - Spike branch / commit SHA (if kept)
   - If tier-B/C/D: which fallback chosen + 1-2 sentence rationale
2. **Flip the "Phase 0 risk spike PENDING" item** under "Open decisions / TODOs" to `✓ done`. Replace the body with a 1-line summary linking to the Recent-decisions entry.
3. **If pass:** v0.1 implementation is unblocked. The next session can scaffold (`pnpm new:component data/force-graph`) and start v0.1 implementation per [v0.1 plan §12](force-graph-v0.1-plan.md#12-file-by-file-plan).
4. **If fallback chosen:** open a new "Recent decisions" or Open-decisions entry — `v0.1 + v0.2 plans need spike-result amendment pass` — and pause v0.1 implementation until that pass completes. Tier 1 plans + v0.6 plan can author in parallel regardless.

---

## 11. References (in priority read order if context is needed)

1. [graph-system-description.md §10.1](../../systems/graph-system/graph-system-description.md#101-phase-0--risk-spike-2-days) — the gate, system level.
2. [force-graph-v0.1-plan.md §8.2](force-graph-v0.1-plan.md#82-custom-dasheddirectededgeprogram) — the locked program contract.
3. [force-graph-v0.1-plan.md §17 Q-P2](force-graph-v0.1-plan.md#17-resolved-plan-stage-questions-locked-on-sign-off-2026-04-28) — `curveOffset` ships in v0.1.
4. [graph-visualizer-old.md §11.3](../../../graph-visualizer-old.md) — original implementation plan (4-step approach).
5. [graph-visualizer-old.md §9.1–§9.2](../../../graph-visualizer-old.md) — direction visuals + dashed+directed combination rationale.
6. [force-graph-procomp-description.md §8.5 #2](force-graph-procomp-description.md#85-plan-stage-tightenings-surfaced-during-description-review--re-validation) — contingency tree origin.

---

*End of brief. Pause for user validate pass per project cadence (draft → validate → re-validate → sign off → commit).*
