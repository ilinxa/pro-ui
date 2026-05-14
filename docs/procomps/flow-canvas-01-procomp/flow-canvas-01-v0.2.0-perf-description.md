# `flow-canvas-01` — v0.2.0 Performance Description (Stage 1, perf scope)

> **Stage:** 1 of 3 (perf-scope follow-on) · **Status:** **Signed off 2026-05-14** (GATE 1 closed; Stage 2 plan doc unlocked)
> **Slug:** `flow-canvas-01` · **Category:** `data` (unchanged)
> **Inherits:** [v0.1.x description](flow-canvas-01-procomp-description.md) signed off; all Q1–Q24 decisions stand. **Q25–Q35 locked in this doc on 2026-05-14**.
> **Backing research:** [research/2026-05-14-perf-tier-validation.md](research/2026-05-14-perf-tier-validation.md)
> **Conceptual lineage:** unchanged from v0.1.x. This doc adds a **performance ladder** that takes the component beyond its current 200-node ceiling.
> **Parallel track (separate doc, NOT covered here):** `rich-card-in-flow` system — viewer-renderer + dialog-edit architecture for putting `rich-card` content into a flow node without mounting the full editor per node. To be described in its own Stage 1 doc; the perf tiers in *this* doc apply to flow-canvas-01 regardless of whether that system ships.

This is the **description** for v0.2.0+ work. Its job is to pin down what perf improvements we'll ship, on what conditions, and against what success criteria — before any planning or implementation. The v0.1.x description remains authoritative for everything outside the perf ladder; this doc only extends it.

---

## 1. Problem

`flow-canvas-01@0.1.3` ships with success criterion #8 from the v0.1.x description: *"a 200-node / 300-edge canvas pans, zooms, and drags at 60fps on a mid-tier laptop."* That ceiling reflects what we committed to verify at first ship, but the real ceiling — and the levers that move it — was never measured. Three concrete signals say we need to take this further:

1. **Consumer demand.** Realistic workflow / agent-graph / schema-explorer use cases run from low hundreds to low thousands of nodes. Capping advertised support at 200 leaves real consumers off the table.
2. **xyflow's own published position.** The xyflow maintainers explicitly state ([discussion #3003](https://github.com/xyflow/xyflow/discussions/3003)): *"React Flow is not intended to be used in that kind of scale [1000+ nodes] (really depends on the complexity of your nodes though). A canvas based approach would be better for that sort of use-case as the performance would be a lot better though there's trade-offs using a canvas instead."* This puts a substrate boundary near ~1,000–2,000 nodes and tells us where to stop pushing xyflow vs. switch substrate.
3. **Code-level findings from the validation pass.** Several leverage points exist in the v0.1.3 codebase that aren't pulled today, and several "obvious" optimizations turn out to be already done. The validation doc enumerates both — this description converts those findings into a **conditional, measurement-gated ladder** of milestones.

This doc defines the **perf-tier ladder**: a sequence of milestones (each independently shippable) that take `flow-canvas-01` from its v0.1 ceiling up to the published xyflow practical wall, with explicit recognition that scale beyond that wall belongs in a **sibling procomp**, not this one.

---

## 2. In scope / Out of scope (perf scope only)

### In scope

- **A measurement-first methodology.** Before any tier ships, recorded baseline + post-change FPS at a defined matrix of node counts and renderer complexities. The existing `makeStressData(count)` fixture is the substrate; this doc scopes the instrumentation to add on top of it.
- **Tier 1 — Defaults & cheap wins.** Already-known levers that were either undefaulted or not yet applied. Half-day scope. No API breaks.
- **Tier 2 — Internal optimization, no API break.** Community-validated patterns (`useShallow` selectors, CSS-driven selection styling) plus the `fireOnChange` batching finding. 1–2 day scope. No API breaks.
- **Tier 3 — Substrate-level changes within xyflow.** Canvas edge overlay; level-of-detail (LOD) node rendering by zoom. 1–2 week scope. Opt-in flag(s), additive API only — no breaking changes to consumers who don't opt in.
- **Adoption of the popup-edit convention as the recommended renderer pattern.** Not a code change per se, but a documentation + convention commitment: heavy editable content lives in a consumer-owned dialog, NOT inline in node renderers. This unlocks future heavy-content consumers (rich-card, plate editor, code-block) without trashing perf. Documented in the guide; not enforced in code.
- **Versioning.** This scope ships across two releases: **Tier 1 + Tier 2 bundled = `v0.2.0`**; **Tier 3 = `v0.3.0`** (per Q25 and Appendix A). v0.2.0 may additionally bundle the non-perf "v0.2 candidates" from the v0.1.x description (undo/redo, minimap slot, marquee selection) — those are **scoped separately**; this doc does NOT commit them in or out, only confirms the perf scope is additive to whatever else lands in the same release.
- **Tracking, evidence, and sign-off.** Each tier carries its own success criterion (FPS targets, measurement protocol) and review file under `reviews/` per the GATE-3 rule.

### Out of scope (deliberate non-goals)

- **Tier 4 — full canvas substrate (D3+Canvas or Sigma.js wrap).** Belongs in a **sibling procomp**, not `flow-canvas-01`. Per xyflow maintainer's own framing, this is custom-canvas territory; mixing it into `flow-canvas-01` would compromise both products. To be described in a separate Stage 1 doc when scoped (working slug candidate: `graph-canvas-01` — locked elsewhere).
- **Web Workers / OffscreenCanvas / GPU-accelerated layout.** Distinct engineering effort; deferred until measurements indicate it's warranted. Plausibility is "v0.3+ if any tier hits diminishing returns earlier than expected."
- **Automated regression test harness for perf** (Vitest perf assertions, Playwright FPS recordings). Still consistent with the v0.1.x informed-defer on Vitest (per STATUS.md). Manual measurement protocol is sufficient for v0.2.x. Promote to automation if the perf ladder lands more than one regression in the field.
- **Heavy-renderer benchmark fixtures.** v0.1's `makeStressData` uses `custom-json` nodes (light). v0.2 adds **one** heavier fixture (richer renderer + nested data) — NOT a benchmark farm with N varieties. Two fixtures total: light (existing) + heavy (new), at varying counts.
- **Worker-based force layout.** Auto-layout is already out of scope per v0.1.x description.
- **MiniMap perf** (xyflow's `<MiniMap>` is independent from the main canvas perf; scope is separate). MiniMap is itself a deferred v0.2 candidate per v0.1.x §2.
- **Rich-card-in-flow system.** Independently scoped; will reference Tier 1 + Tier 2 levers but does NOT depend on Tier 3 to ship. Treated as a parallel track.

---

## 3. Pre-work (measurement instrumentation)

Before any tier is implemented, the following must be in place. None of this is a tier itself — it's the **precondition for evidence-based tier scoping**.

### 3.1 Existing assets (no work needed)

| Asset | Location | What it gives us |
|---|---|---|
| Light stress fixture | [`makeStressData(count)` in dummy-data.ts](../../../src/registry/components/data/flow-canvas-01/dummy-data.ts) | Configurable N of custom-JSON nodes in a grid with deterministic sparse edges; ships with viewport preset that defeats `fitView` so culling works |
| Demo "Stress" tab | [demo.tsx](../../../src/registry/components/data/flow-canvas-01/demo.tsx) | Already-wired stress fixture in the docs site |
| `onlyRenderVisibleElements` prop | [canvas.tsx:78,242](../../../src/registry/components/data/flow-canvas-01/parts/canvas.tsx) | Already exposed; consumer opt-in (default `false`) |

### 3.2 New instrumentation (small additions, NOT a new procomp)

| Addition | Why | Effort |
|---|---|---|
| **Heavy-renderer stress fixture** — `makeHeavyStressData(count)` in dummy-data.ts. Same grid shape as `makeStressData` but uses a heavier renderer (e.g. ProjectCard adapter or a synthetic rich-renderer with 5–10 fields, 2–3 nested blocks). | Captures the "real consumer" curve, not just light-node best case. | ~½ hour |
| **Devtools stress page** — non-published route under `src/app/sandbox/flow-stress/page.tsx` (matches existing sandbox-route convention used by `src/app/sandbox/event-detail-page-01/page.tsx`) that mounts the canvas at a URL-param-driven `count`, exposes a toggle row for each lever (`onlyRenderVisibleElements`, future `useShallow`, future `edgeRenderer="svg"\|"canvas"`, future `lodHints` on/off — toggle sets `lodHints` to default object vs `undefined`), and renders a small FPS / mount-time overlay. | Lets us measure each lever in isolation without hand-editing source between runs. | ~2–3 hours |
| **Measurement protocol document** — a sub-doc under `research/` that pins: **multi-machine recording** (run the matrix on every available dev machine; record per-machine CPU / RAM / GPU / OS / browser; success-criterion is the **min FPS across all machines** at each cell), N matrix (100 / 200 / 500 / 1000 / 2000), measurement window (drag a node across the viewport for 5 s, record min FPS via Chrome DevTools Performance), how to re-run after each tier. Chrome stable, no extensions, throttling off, in all cases. | Numbers across tiers stay comparable AND catch machine-specific regressions. Without it, "Tier 1 gave us 45 fps on my M2" vs "Tier 2 gave us 50 fps on the Windows laptop" could be measurement noise OR a real perf delta hidden by hardware variance. | ~½ hour |

**Pre-work success criterion (Q-locked):** before Tier 1 lands, baseline numbers exist for the following matrix:

| | N=100 | N=200 | N=500 | N=1000 | N=2000 |
|---|---|---|---|---|---|
| Light fixture (`makeStressData`) | FPS | FPS | FPS | FPS | FPS |
| Heavy fixture (`makeHeavyStressData`) | FPS | FPS | FPS | FPS | FPS |

Each cell: min FPS during a 5-second drag, recorded twice (run-to-run reproducibility check). All 10 cells filled. The Tier ladder's plausibility estimates below are then replaced with measured numbers.

---

## 4. The tier ladder

Each tier is a **shippable milestone** under `flow-canvas-01`. Tiers are **conditional** — Tier 2 lands only if Tier 1's measurements leave headroom on the table that justifies further work, and so on. Plausibility ceilings below are estimates pending measurement (per §3.2).

### 4.1 Tier 1 — Defaults & cheap wins  (milestone candidate: **M10**)

**Scope:** flip safe defaults; eliminate per-tick consumer-callback waste.

**Concrete changes:**

| # | Change | Source / motivation | API impact |
|---|---|---|---|
| 1 | `FlowCanvasProps.onlyRenderVisibleElements` default flips from `false` to `true`. Consumer opt-out remains. | xyflow performance docs; v0.1.x already exposes this — flipping the default surfaces it to every consumer without action. Known caveats: all nodes still rendered on initial mount ([issue #4378](https://github.com/xyflow/xyflow/issues/4378)); offscreen-edge bug if offscreen node has explicit height ([issue #4329](https://github.com/xyflow/xyflow/issues/4329)) — neither blocks adoption but both should be noted in the guide. | Behavior-changing default → **opt-out via `onlyRenderVisibleElements={false}`**. Document migration line in `v0.2.0 release notes`. |
| 2 | `fireOnChange` in [use-canvas-data.ts:222-238](../../../src/registry/components/data/flow-canvas-01/hooks/use-canvas-data.ts) batches during continuous drag — fires once on drag-end, not on every tick. Other change types (`add`, `remove`, `connect`, `select`) still fire immediately. | Validation research finding. Real cost saved scales linearly with N for consumers wired to `onChange`. | None. Consumers can't observe per-tick vs per-end fires without instrumenting their own callback. |
| 3 | `fireOnChange` skip the full `nodes.map(fromXyNode)` / `edges.map(fromXyEdge)` re-map when only `position` fields changed within a single change set. Use shallow diff to short-circuit. | Same finding. ~50% callback-payload work saved at 1k nodes on drag-end. | None. |

**Plausibility ceiling after Tier 1:** ~300–500 nodes smooth (light fixture); ~200–300 smooth (heavy fixture). **Measure first.**

**Success criteria (Tier 1):**
- Light fixture: min FPS ≥ 50 at N=500 (5-second drag, Chrome DevTools).
- Heavy fixture: min FPS ≥ 50 at N=200.
- Zero new TypeScript / lint errors; `validate:meta-deps` clean.
- v0.2.0 release-notes line documenting the default flip + opt-out instructions.
- Review file `reviews/<YYYY-MM-DD>-v0.2.0-spotcheck.md` per the readiness-review rule.

**Effort estimate:** ½–1 day.

### 4.2 Tier 2 — Internal optimization, no API break  (milestone candidate: **M11**)

**Scope:** apply community-validated patterns to the internals; no public API change.

**Concrete changes:**

| # | Change | Source / motivation | API impact |
|---|---|---|---|
| 1 | Apply `useShallow` (or `createWithEqualityFn(..., shallow)` if reaching into xyflow's store — TBD at GATE 2) to the `useStore` selector in [default-edge.tsx:38-43](../../../src/registry/components/data/flow-canvas-01/parts/default-edge.tsx). Add as a doc convention for any future internal/consumer `useStore` selectors. | [xyflow PR #5629](https://github.com/xyflow/xyflow/pull/5629); [Synergy Codes guide](https://www.synergycodes.com/blog/guide-to-optimize-react-flow-project-performance); zustand standard practice. | None. |
| 2 | Move node selection visual feedback from React-prop driven (current `data-selected={selected}` on `<NodeShell>`) to **CSS-only** via xyflow's own `.react-flow__node.selected` class (added by the xyflow store directly to the node wrapper, doesn't require React re-render). Existing `data-selected` may stay as a renderer-author convenience; the visual ring switches to CSS. | xyflow team's [discussion #4975](https://github.com/xyflow/xyflow/discussions/4975) recommendation. Saves a per-selection React re-render of the selected node. | None for consumers. Renderer authors using `data-selected` for custom selection styling are unaffected (attribute stays). |
| 3 | Document the renderer-author rule: **"if you need to react to source/target node selection inside a custom edge, query xyflow's store via `useStore`, not via per-edge state."** Add to procomp guide §X. | xyflow team's recommendation (same discussion). Prevents future custom edges from duplicating selection state. | None. |

**Plausibility ceiling after Tier 2:** ~500–800 nodes smooth (light); ~300–500 (heavy). **Measure first.**

**Success criteria (Tier 2):**
- Light fixture: min FPS ≥ 50 at N=800.
- Heavy fixture: min FPS ≥ 50 at N=400.
- Visual regression check: selection ring still appears correctly in both light and dark themes, with the lime accent matching the design-system mandate.
- Zero new TypeScript / lint errors; `validate:meta-deps` clean.
- Review file per the readiness-review rule.

**Effort estimate:** 1–2 days.

### 4.3 Tier 3 — Substrate-level changes within xyflow  (milestone candidate: **M12**)

**Scope:** opt-in canvas edge overlay; opt-in level-of-detail node rendering by zoom. Both are additive (consumers who don't opt in see no change).

**Concrete changes:**

| # | Change | Source / motivation | API impact |
|---|---|---|---|
| 1 | **Canvas edge overlay.** Add a new `FlowCanvasProps.edgeRenderer?: "svg" \| "canvas"` prop, defaulting to `"svg"` (current behavior). When set to `"canvas"`, replaces xyflow's SVG edge layer with a sibling `<canvas>` element that shares the xyflow viewport transform (read via `useViewport`) and paints edges with `Path2D`-cached strokes. Hit-test for edge selection uses spatial indexing on edge midpoints. | xyflow [issue #5442](https://github.com/xyflow/xyflow/issues/5442) — user-side pattern; team aware but not library-shipped. Reference impl pattern: Yandex Gravity UI. | Additive prop. Default `"svg"` preserves v0.2.0 behavior. |
| 2 | **LOD on nodes.** Add a new `RenderContext.zoom: number` field (reactive — sourced from `useViewport()`). Renderer authors can branch on it to switch render shape. Add a `FlowCanvasProps.lodHints?: { dotZoom?: number; cardZoom?: number }` prop that consumers (and the docs guide) can use to suggest band cutoffs. **All handle positions must remain consistent across LOD modes** (use `opacity: 0` to hide, NEVER `display: none` — per the xyflow-react-pro skill's pitfall list); if a renderer changes handle count between modes it MUST call `useUpdateNodeInternals(nodeId)` after the switch. | xyflow-react-pro skill confirms `useViewport` is reactive and that `useUpdateNodeInternals` is required when handles change. | Two additive surfaces (`ctx.zoom`, `lodHints` prop). Existing renderers unaffected. |
| 3 | **Edge culling at viewport boundary.** When `edgeRenderer="canvas"`, edges whose source AND target are outside the viewport (and whose midpoint is also outside) are skipped at paint time. SVG renderer is unchanged. | Standard canvas-graph pattern; implied by #5442. | None. |

**Plausibility ceiling after Tier 3:** ~1,000–1,500 nodes smooth (light); ~500–800 (heavy). **MAYBE 2,000 with very lean renderers.** The xyflow maintainer's framing (*"not intended for that scale"*) makes 2,000 the practical wall for this substrate — beyond is Tier 4 (out of scope, sibling procomp). **Measure first.**

**Success criteria (Tier 3):**
- Light fixture with `edgeRenderer="canvas"`: min FPS ≥ 50 at N=1500.
- Heavy fixture with `edgeRenderer="canvas"`: min FPS ≥ 50 at N=600.
- LOD-enabled heavy fixture: min FPS ≥ 50 at N=1000 (zoom out to dot mode for the off-viewport nodes).
- Selection / hover / drag on canvas-rendered edges feels equivalent to SVG (visual + interaction parity verified on a checklist).
- `useUpdateNodeInternals` correctly invoked for any LOD renderers that change handle count (verified by demo + renderer-author guide rule).
- Zero new TypeScript / lint errors; `validate:meta-deps` clean.
- Review file (escalates to a **checklist** review, not spot-check, per the readiness-review rule's "Public-API-touching minor bump" category — `lodHints` and `edgeRenderer` are new public surface).

**Effort estimate:** 1–2 weeks.

### 4.4 Tier 4 — Beyond xyflow (NOT in flow-canvas-01)

**Out of scope of `flow-canvas-01`.** Scoped here only for completeness — the natural next step beyond Tier 3 is a **sibling procomp** with a fundamentally different substrate (D3+Canvas2D or Sigma.js / Cosmograph / Pixi wrap), not an extension of this component.

| Aspect | Detail |
|---|---|
| Working slug candidate | `graph-canvas-01` (or `node-canvas-01`) — locked in that procomp's own Stage 1 |
| Substrate | Canvas2D (custom build) or WebGL (Sigma.js wrap) — decided at that doc's GATE 1 |
| Use cases | Graph-DB visualizers (Neo4j-style), Obsidian-like wiki graphs, large-scale read-only network views |
| Editing | Popup-edit only (no inline; consumer-owned dialog) — same convention as Tier 2's "renderer-author rule" |
| Sweet spot | 10,000+ nodes (per xyflow maintainer + Sigma.js published benchmarks) |
| Rich-card-in-flow compat | The sibling procomp would expose a similar renderer-registry API as `flow-canvas-01` so the `RichCardViewer` adapter (defined in the rich-card-in-flow track) could be reused. **Compatibility goal, not a v0.1 ship requirement.** |

**Decision rule:** if a consumer's use case needs >2,000 simultaneous interactive nodes, point them at the sibling procomp once it exists. Until it exists, the answer is "wait, or fork." Do NOT bolt this scale onto `flow-canvas-01`.

---

## 5. Validation backing (sources)

These were established in the [research validation doc](research/2026-05-14-perf-tier-validation.md). Repeated here for procomp self-containment.

- xyflow's own published position: [discussion #3003](https://github.com/xyflow/xyflow/discussions/3003) — *"not intended to be used in that kind of scale… canvas based approach would be better."*
- xyflow team's perf recommendations: [discussion #4975](https://github.com/xyflow/xyflow/discussions/4975) — CSS selection styling, custom edge querying source/target state.
- `useShallow` necessity: [PR #5629](https://github.com/xyflow/xyflow/pull/5629) — xyflow itself adding shallow comparison to internal selectors.
- Canvas edge overlay pattern: [issue #5442](https://github.com/xyflow/xyflow/issues/5442) — user-side pattern, references Yandex Gravity UI.
- Third-party perf data: [Synergy Codes guide](https://www.synergycodes.com/blog/guide-to-optimize-react-flow-project-performance) — quantified FPS impacts of memo / array dependencies / shallow comparison.
- `onlyRenderVisibleElements` quirks: [issue #4378](https://github.com/xyflow/xyflow/issues/4378), [issue #4329](https://github.com/xyflow/xyflow/issues/4329).
- Project-internal skill: [`.claude/skills/xyflow-react-pro/SKILL.md`](../../../.claude/skills/xyflow-react-pro/SKILL.md) — authoritative xyflow v12 API map; the "performance ceiling" note (*"xyflow's documented sweet spot is ~1–2k nodes"*) was already in this skill before v0.2 planning.
- Existing code state (pre-v0.2): all the levers already pulled in [canvas.tsx](../../../src/registry/components/data/flow-canvas-01/parts/canvas.tsx), [node-adapter.tsx](../../../src/registry/components/data/flow-canvas-01/parts/node-adapter.tsx), [default-edge.tsx](../../../src/registry/components/data/flow-canvas-01/parts/default-edge.tsx), [use-canvas-data.ts](../../../src/registry/components/data/flow-canvas-01/hooks/use-canvas-data.ts).

---

## 6. Per-tier API matrix (one-glance summary)

| | Default change | New props | New context fields | Visible API break? | New external deps |
|---|---|---|---|---|---|
| Pre-work | none | none | none | no | none (Chrome DevTools is hardware-only) |
| **Tier 1** | `onlyRenderVisibleElements` default `true` | — | — | **soft default change**; opt-out exists | none |
| **Tier 2** | — | — | — | no | none |
| **Tier 3** | — | `edgeRenderer?: "svg"\|"canvas"`, `lodHints?: { dotZoom?: number; cardZoom?: number }` | `ctx.zoom: number` | no (additive) | none |
| Tier 4 (out) | n/a | n/a (sibling component) | n/a | n/a | new substrate library (TBD at sibling procomp's GATE 1) |

---

## 7. Success criteria (rolled up across all tiers)

Each tier carries its own per-tier success criteria above (§4.1, §4.2, §4.3). Rolled-up `v0.2.x → v0.3.0` ship gates:

1. **Measurement first principle holds.** Every tier shipped has filed pre- and post-measurement numbers under `research/` with the same hardware + protocol.
2. **No silent regression.** Pre-Tier-1 light fixture FPS at N=200 (current cap) must equal or exceed v0.1.3 numbers after Tier 1 ships. Same for Tier 2 over Tier 1 baseline, etc. Regressions get fixed before ship, not after.
3. **Updated success criterion #8 from v0.1.x description.** After Tier 3 ships: *"a light-fixture canvas at 1,000 nodes / 1,500 edges pans, zooms, and drags at ≥50fps on the documented hardware target."* Pending measurement.
4. **No breaking changes to the v0.1.x public API** (Q1–Q24 contracts intact). New surfaces are additive only.
5. **Two reviews authored** — one per release — under `reviews/`. v0.2.0 = spot-check (covers Tier 1 + Tier 2; no public API surface added). v0.3.0 = checklist (covers Tier 3; new public surfaces `edgeRenderer`, `lodHints`, `ctx.zoom`). Per the readiness-review rule, reviews attach to releases, not tiers.
6. **Procomp guide updated** with: (a) the popup-edit renderer convention, (b) the `useShallow` rule for custom-edge `useStore`, (c) per-tier opt-in instructions for Tier 3 props.

---

## 8. Open questions (continuing Q-numbering from Q24)

| # | Question | Proposed answer | Notes |
|---|---|---|---|
| Q25 | **Versioning** — does Tier 1 ship as `v0.2.0` and Tier 2 as `v0.2.1`, or are Tier 1 + Tier 2 bundled into one `v0.2.0` release with Tier 3 as `v0.3.0`? | **Tier 1 + Tier 2 bundled as `v0.2.0`**. Tier 3 as `v0.3.0` because it adds public props (additive, but worth a minor bump for discoverability in changelogs). | The default flip in Tier 1 is the only behavior change visible to consumers — bundling Tier 2 (no API change) keeps the upgrade path concentrated. |
| Q26 | **Default flip — strict opt-out or strict opt-in?** Currently `onlyRenderVisibleElements: false` is the default; Tier 1 proposes flipping. Does this go in `v0.2.0` as a bare default change, or behind a `flowCanvasDefaultsVersion: 2` opt-in token? | **Bare default change in `v0.2.0` with documented opt-out.** The risk of a consumer relying on always-rendered offscreen nodes for layout measurement is real but small; the upside is every consumer gets faster immediately. Documented in release notes. | Alternative is too defensive — projects this small don't need defaults-version tokens. |
| Q27 | **Hardware target for the measurement protocol** — what counts as "mid-tier laptop"? | **Multi-machine recording.** Run the measurement matrix on every available developer machine and record per-machine results in the research/measurement file. The **minimum FPS across all machines** at each (N, fixture) cell becomes the success-criterion benchmark for that cell. Each result entry must list CPU / RAM / GPU / OS / browser version. Chrome stable, no extensions, throttling off, in all cases. | Catches machine-specific regressions; numbers won't be directly comparable to single-baseline community benchmarks but reflect the real cross-hardware floor consumers see. Per-machine breakdown lives in the measurement file under `research/`. |
| Q28 | **Heavy stress fixture content** — what renderer goes in `makeHeavyStressData`? | **Synthetic "richish" renderer** declared inline in dummy-data.ts: ~3 visible fields, 1 nested visual block, 4 ports. Not the real `ProjectCard01` (would add a cross-component coupling) and not `rich-card` (5,302 LOC — would distort measurements). | Keeps the heavy fixture self-contained. Real consumer profile measurements are out of scope; they can run their own. |
| Q29 | **Tier 3 LOD — built-in helper or renderer-author responsibility?** Should `flow-canvas-01` ship a `<LODBand>` component that wraps render logic for each zoom band, or is `if (ctx.zoom < 0.4) return <DotMode/>` the responsibility of each renderer author? | **Renderer-author responsibility in v0.3.0.** A `<LODBand>` helper may be considered for v0.4 if real renderers consistently want the same shape. Premature abstraction otherwise. | Aligned with the dynamicity-primacy memory — open API, helper later if patterns emerge. |
| Q30 | **Tier 3 canvas edge selection model** — when `edgeRenderer="canvas"`, how is edge selection rendered (canvas can't easily do focus rings on individual paths)? | **Selected edge re-stroked with the same `--xy-edge-stroke-selected` color and `2.5px` width, plus a visible halo (canvas drop-shadow or a thicker underlay stroke).** Same visual identity as the SVG mode, implemented at canvas level. | Cosmetic only; locked at GATE 2 design. |
| Q31 | **Tier 3 LOD `dotZoom` / `cardZoom` band defaults** — what are reasonable zoom thresholds? | **`dotZoom: 0.4`, `cardZoom: 0.8` as built-in defaults.** Below 0.4 = dot; 0.4–0.8 = rect; above 0.8 = full card. Consumer can override per-canvas via `lodHints`. | Mirrors the band scheme in conversation; adjustable. Validate at GATE 2 with the heavy fixture's actual readability. |
| Q32 | **Migration story for consumers on `v0.1.x`** — what's the upgrade path doc shape? | **One section in the v0.2.0 release notes + a "Migrating from v0.1.x" subsection in the procomp guide.** Both list: (a) the default flip + opt-out flag, (b) the new optional props in Tier 3, (c) the recommended adoption of popup-edit renderer convention. | Standard pattern. No formal migration script needed since changes are additive + one default flip. |
| Q33 | **What does "popup-edit renderer convention" mean concretely in the guide?** | **A one-page section** with: (a) why (perf at scale), (b) what (renderer must be read-only display + `onClick` → `ctx.onEditRequest?.(nodeId)`), (c) the consumer-side dialog pattern (illustrative code), (d) note: the rich-card-in-flow system will be the canonical first consumer of this convention. | Even if rich-card-in-flow doesn't ship as part of v0.2.x, the convention should be documented because it's the prescribed pattern for any heavy node content. |
| Q34 | **Does Tier 3 require a procomp-readiness-review checklist (not spot-check)?** | **Yes — it adds public-API surface** (`edgeRenderer`, `lodHints`, `ctx.zoom`). Per the readiness-review rule, public-API-touching minor bumps escalate from spot-check to checklist if scope is broad. Tier 3 qualifies. | Tier 1 + Tier 2 ship as `v0.2.0` and share a single **spot-check** review (no public API surface added). |
| Q35 | **Does this v0.2.0 work block on the rich-card-in-flow system shipping?** | **No.** The two tracks are independent. The popup-edit convention can be documented and adopted independently of any rich-card adapter shipping. | Parallel tracks, single mention each in the others' description doc. |

---

## 9. Risks

- **Measurement noise.** Single-machine FPS measurements are inherently noisy. Mitigation: run each fixture twice, take min-of-two, document hardware + browser state. Don't promote a tier based on a single ambiguous result.
- **`onlyRenderVisibleElements` default flip surprises a consumer.** A consumer relying on always-rendered offscreen nodes (e.g. to measure their layout) sees behavior change. Mitigation: clear release notes + opt-out. Risk is low because most consumers haven't touched this prop.
- **Canvas edge overlay drift from SVG edges.** When both modes ship, visual / hover / selection behavior must stay aligned. Mitigation: locked visual checklist in Tier 3 success criteria + the review file. If canvas mode drifts, the bug is loud not silent.
- **LOD-induced handle desync.** A renderer that swaps handle counts between modes without calling `useUpdateNodeInternals` produces stale connection state. Mitigation: documented in the renderer-author guide + the `<NodeShell>` shell could log a dev-mode warning if it sees handle-count changes without the call (deferred to a v0.3 polish if it bites).
- **Scope drift toward Tier 4.** As we measure, the temptation to "just add WebGL" or "just do it inside flow-canvas-01" will be real. **The sibling-procomp boundary is a hard rule** — explicit at GATE 1. Tier 4 lives elsewhere or doesn't ship.
- **Procomp guide bloat.** Adding tier-specific opt-in instructions, the popup-edit convention, the migration section, and the renderer-author rules could push the guide past readable length. Mitigation: lock at GATE 2 that the guide gets a new "Performance & scale" top-level section that absorbs all the perf-related content; everything else stays in its existing sections.
- **Inconsistent measurement units across reviews.** Tier 1's review might cite "avg FPS during drag," Tier 2's might cite "min FPS." Mitigation: the measurement protocol locks **min FPS during 5-second drag**, period. Reviewers cite that.
- **xyflow API change between v0.2 and v0.3.** xyflow 12.x is on a fast iteration cycle. A breaking xyflow change (`useViewport` rename, `useStore` API shift) lands in the middle. Mitigation: pin xyflow at a known-good minor (`@xyflow/react@~12.10.x`) until v0.3.0 ships, then re-evaluate.
- **Heavy fixture isn't representative.** A consumer running ProjectCard adapters at scale finds Tier 2's "50 FPS at N=400" doesn't match their experience. Mitigation: the guide explicitly documents that real consumer renderers may have different perf profiles; the heavy fixture is a baseline, not a guarantee. Consumers can use the devtools stress page to substitute their own renderer.
- **Tier 3's canvas overlay maintenance cost.** Once shipped, we own the canvas-edge code path indefinitely. Mitigation: scope it as `edgeRenderer="canvas"` opt-in only; SVG path stays the default and remains a supported config. If maintenance burden becomes painful in v0.4+, the opt-in stays but it doesn't have to be the default.

---

## 10. Definition of "done" for THIS document (stage gate)

**All boxes closed 2026-05-14. Stage 2 plan doc unlocked.**

- [x] Sections 1–9 reviewed (consistency review pass authored 2026-05-14; 6 findings resolved).
- [x] **Q25–Q35 each carry an agreed or overridden answer.** *(Locked 2026-05-14 — see §8. Q25 confirmed as recommended; Q27 chose multi-machine over single-baseline recommendation; Q26, Q28–Q35 confirmed as recommended.)*
- [x] Pre-work scope (§3.2) confirmed — including the new heavy fixture, the sandbox stress page (`src/app/sandbox/flow-stress/`), and the multi-machine measurement protocol.
- [x] Tier ladder (§4) confirmed: Tier 1 + Tier 2 = `v0.2.0`, Tier 3 = `v0.3.0`, Tier 4 NOT in `flow-canvas-01`.
- [x] Per-tier API matrix (§6) confirmed — additive only, one default flip.
- [x] Success criteria (§7) acceptable; the "1,000 nodes / 1,500 edges / ≥50fps" successor to v0.1.x #8 acknowledged as **pending measurement**, not a commitment.
- [x] Risks (§9) acceptable; mitigations agreed.
- [x] Acknowledgment that **rich-card-in-flow is a parallel track**, will be described in its own Stage 1 doc, and does not block v0.2.0.
- [x] **User explicit "approved" — 2026-05-14.**

After sign-off, no editing this doc casually — changes after sign-off should be loud and intentional, not silent rewrites. Same rule as the v0.1.x description.

---

## Appendix A — Tier-to-version mapping (for changelog clarity)

| Tier | Milestone | Version target | Public API change | Default change |
|---|---|---|---|---|
| Pre-work | — | within v0.2.0 dev | none | none |
| Tier 1 | M10 | **v0.2.0** | none | `onlyRenderVisibleElements: true` |
| Tier 2 | M11 | **v0.2.0** (bundled) | none | none |
| Tier 3 | M12 | **v0.3.0** | `edgeRenderer`, `lodHints`, `ctx.zoom` (additive) | none |
| Tier 4 | — | NOT IN flow-canvas-01 | n/a | n/a |

---

## Appendix B — How this doc relates to existing planning artifacts

- **v0.1.x description** ([flow-canvas-01-procomp-description.md](flow-canvas-01-procomp-description.md)) — authoritative for the component's **what & why**. This doc adds a **perf scope** on top.
- **v0.1.x plan** ([flow-canvas-01-procomp-plan.md](flow-canvas-01-procomp-plan.md)) — authoritative for the v0.1.0 **how**. This doc's plan stage (v0.2 plan doc, TBD) is its successor for v0.2.0+ scope.
- **v0.1.x guide** ([flow-canvas-01-procomp-guide.md](flow-canvas-01-procomp-guide.md)) — living. Gets a new "Performance & scale" top-level section as v0.2.0 ships.
- **Research validation doc** ([research/2026-05-14-perf-tier-validation.md](research/2026-05-14-perf-tier-validation.md)) — empirical backing for tier scoping decisions. Cited throughout this doc.
- **Future:** rich-card-in-flow Stage 1 description — separate doc, parallel track, references the popup-edit convention from this doc.

---

## Appendix C — Quick links to the levers (file:line references)

| Lever | Location | Tier |
|---|---|---|
| `onlyRenderVisibleElements` exposed but defaulted off | [canvas.tsx:78,242](../../../src/registry/components/data/flow-canvas-01/parts/canvas.tsx) | Tier 1 |
| `fireOnChange` per-tick re-map | [use-canvas-data.ts:222-260](../../../src/registry/components/data/flow-canvas-01/hooks/use-canvas-data.ts) | Tier 1 |
| `useStore` selector in `DefaultEdge` (no `useShallow`) | [default-edge.tsx:38-43](../../../src/registry/components/data/flow-canvas-01/parts/default-edge.tsx) | Tier 2 |
| `data-selected` prop-driven selection ring | [node-shell.tsx:28](../../../src/registry/components/data/flow-canvas-01/parts/node-shell.tsx) | Tier 2 |
| `BaseEdge` SVG path rendering | [default-edge.tsx:58-69](../../../src/registry/components/data/flow-canvas-01/parts/default-edge.tsx) | Tier 3 (replaces with canvas) |
| Existing stress fixture | [dummy-data.ts:125-178](../../../src/registry/components/data/flow-canvas-01/dummy-data.ts) | Pre-work |
| Existing demo "Stress" tab | [demo.tsx](../../../src/registry/components/data/flow-canvas-01/demo.tsx) | Pre-work |
| Renderer-context type | [types.ts](../../../src/registry/components/data/flow-canvas-01/types.ts) | Tier 3 (adds `zoom`) |
| Public props type | [types.ts](../../../src/registry/components/data/flow-canvas-01/types.ts) | Tier 3 (adds `edgeRenderer`, `lodHints`) |
