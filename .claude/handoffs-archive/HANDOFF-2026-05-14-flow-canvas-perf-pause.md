# HANDOFF — flow-canvas-01 perf-tier work, paused 2026-05-14

> **Read this first** when resuming work on flow-canvas-01 perf or v0.2 ladder.
> Locations referenced are relative to repo root.

## TL;DR — exactly where we are

1. **v0.1.4 patch SHIPPED locally** (not committed yet). Fixed a real bug — built-in `customJsonRenderer` never rendered port handles even when data declared them, so xyflow's edge layer warning-spammed the console + burned FPS on failed `getEdgePosition` lookups. ~6-line fix delivered **~15-20× FPS improvement** at the light-fixture cliff *(overlay-only measurement on a single machine; formal DevTools-trace re-measurement still pending — see §"Pre-work is PARTIALLY done" below).*
2. **v0.2.0 perf-tier description SIGNED OFF** ([docs/procomps/flow-canvas-01-procomp/flow-canvas-01-v0.2.0-perf-description.md](../docs/procomps/flow-canvas-01-procomp/flow-canvas-01-v0.2.0-perf-description.md)). Q25–Q35 locked. Tier 1+2=`v0.2.0`, Tier 3=`v0.3.0`, Tier 4=sibling procomp (OUT OF SCOPE of flow-canvas-01).
3. **Pre-work artifacts SHIPPED**: measurement protocol, baseline measurements doc, heavy synthetic stress fixture (`makeHeavyStressData` in dummy-data.ts), non-published sandbox stress page at `src/app/sandbox/flow-stress/`. **Note:** the MEASUREMENTS themselves are partial — overlay-only, single machine, missing N=1000/2000 cells. See §"Pre-work is PARTIALLY done" below.
4. **Memory + STATUS + version doc all aligned to `v0.1.4` + 42 components.**

**Nothing is committed to git yet.** The user pauses sessions before committing as their convention.

**Tree state:** `pnpm tsc --noEmit` clean · `pnpm lint` 0 errors (2 pre-existing warnings in `src/registry/components/navigation/file-manager/parts/file-manager-list-view.tsx:146` and `src/registry/components/navigation/file-tree/hooks/use-tree-virtual.ts:29` — both `useVirtualizer` React Compiler skip-memoization warnings predating this session) · `pnpm validate:meta-deps` 42/42 clean.

## Pre-work is PARTIALLY done — read before claiming "pre-work ✓"

Description §3.2 says the pre-work success criterion is "all 10 cells filled in the N=100/200/500/1000/2000 × light/heavy matrix, recorded twice each, via DevTools Performance trace per protocol §3." Current state:

| Component | Status |
|---|---|
| Heavy synthetic stress fixture (`makeHeavyStressData`) | ✅ shipped in dummy-data.ts |
| Devtools sandbox stress page (`/sandbox/flow-stress`) | ✅ shipped |
| Measurement protocol doc | ✅ shipped |
| **Baseline measurements filled into the matrix** | **⚠ partial** — overlay-only, single machine; N=1000/2000 cells missing for several columns; heavy fixture beyond N=500 only loosely measured |

The baseline doc explicitly self-caveats: *"directionally accurate but not citation-grade. Single machine (CPU/RAM/GPU not logged). Single observer (one set of eyes on the overlay). N=1000 and N=2000 not measured for heavy."*

**What this means for Stage 2 plan work:**
- The plan doc CAN use the existing baseline numbers as directional inputs (they're enough to redirect tier-ladder priorities — see "Implications for the v0.2 tier ladder" below).
- The plan doc CANNOT cite the existing baseline numbers as success-criterion proof. Tier 1 review will require **fresh, protocol-compliant measurements** (DevTools Performance trace, multi-machine, full matrix) before any "Tier 1 shipped" claim.
- A reasonable first step inside the Stage 2 plan work: schedule that protocol-compliant re-measurement. Doesn't block plan drafting; does block Tier 1 ship.

## What's NEXT when you resume

1. **Commit the session's work** if the user hasn't already. Suggested split (see [STATUS.md "Last updated"](STATUS.md) for the full deliverables list):
   - Commit 1: `fix(flow-canvas-01): v0.1.4 — render port handles in custom-json renderer` (just `parts/custom-json-node.tsx` + `meta.ts`)
   - Commit 2: `docs(flow-canvas-01): v0.2 perf-tier description + pre-work artifacts` (everything else)
   - **Ignore `src/app/components/[slug]/_lib/source-map.generated.ts`** if `git status` flags it untracked — it's an auto-generated build artifact from the 2026-05-12 detail-page work (regenerated on every `pnpm dev`/`pnpm build`/`pnpm registry:build` via `scripts/build-source-map.mjs`), NOT part of this session's perf batch. Don't include in either commit. Verify before committing — `git log -- 'src/app/components/[slug]/_lib/'` returns no history (never committed; possibly gitignored).
2. **Draft the v0.2 Stage 2 plan doc** at `docs/procomps/flow-canvas-01-procomp/flow-canvas-01-v0.2.0-procomp-plan.md`. It should absorb the updated priors from the v0.1.4 fix (see "Implications for the tier ladder" below).
3. **Once the plan doc is signed off**, implement Tier 1 — the description's §4.1 lists **three** changes (not two):
   1. `FlowCanvasProps.onlyRenderVisibleElements` default flips from `false` to `true` (consumer opt-out via explicit `={false}` remains)
   2. `fireOnChange` in [use-canvas-data.ts:222-238](../src/registry/components/data/flow-canvas-01/hooks/use-canvas-data.ts) batches during continuous drag — fires once on drag-end, not every tick; other change types still fire immediately
   3. `fireOnChange` skips the full `nodes.map(fromXyNode)` / `edges.map(fromXyEdge)` re-map when only `position` fields changed within a single change set (shallow-diff short-circuit)
   Plus a fresh protocol-compliant measurement (see §"Pre-work is PARTIALLY done"). Half- to one-day of work.
4. **Then Tier 2 if needed** based on post-Tier-1 measurements: `useShallow` on `DefaultEdge`'s `useStore` selector + CSS-driven selection styling.
5. **Tier 3 only if measurements demand**: canvas edge overlay + LOD via `useViewport`. Spec'd in the description doc; needs re-justification at GATE 2 plan stage because v0.1.4 + Tier 1+2 may have already eliminated the need.

## Report — the problem and how we fixed it

### The problem (as stated by user)

`flow-canvas-01@0.1.3` felt heavy at 200 nodes despite shipping with success criterion "200 nodes / 60fps." User wanted to know if a substrate swap (D3+Canvas, Sigma.js) was warranted, or if there was headroom inside xyflow.

### What we investigated

| Step | Artifact | Outcome |
|---|---|---|
| 1. Architectural research | [research/2026-05-14-perf-tier-validation.md](../docs/procomps/flow-canvas-01-procomp/research/2026-05-14-perf-tier-validation.md) | Identified 4 tiers of perf work + the xyflow ~1-2k node ceiling + sibling-procomp boundary at 10k+. Cited xyflow community sources + the project's xyflow-react-pro skill. |
| 2. Description doc + 35 locked decisions | [flow-canvas-01-v0.2.0-perf-description.md](../docs/procomps/flow-canvas-01-procomp/flow-canvas-01-v0.2.0-perf-description.md) | Tier ladder formalized, Q25–Q35 answered, success criteria pending measurement, signed off. |
| 3. Measurement protocol | [research/2026-05-14-measurement-protocol.md](../docs/procomps/flow-canvas-01-procomp/research/2026-05-14-measurement-protocol.md) | Multi-machine recording, min-FPS-across-machines as success-criterion benchmark, N=100/200/500/1000/2000 matrix, light + heavy fixtures. |
| 4. Heavy synthetic stress fixture | `makeHeavyStressData(count)` in [dummy-data.ts](../src/registry/components/data/flow-canvas-01/dummy-data.ts) | Self-contained synthetic richish renderer (3 fields + 1 nested block + 4 ports). Not coupled to `ProjectCard01` or `rich-card`. |
| 5. Sandbox stress page | [src/app/sandbox/flow-stress/](../src/app/sandbox/flow-stress/) | URL-param-driven N/fixture/visibility lever toggles, rolling FPS overlay (eyeball-only — see Rule 2 below). |
| 6. Baseline measurements by user | [research/2026-05-14-baseline.md](../docs/procomps/flow-canvas-01-procomp/research/2026-05-14-baseline.md) | Surfaced a startling finding: light fixture (`custom-json`) was 7-15 FPS at N=200 while heavy fixture was 50-60 FPS at the same N. **Heavy was faster than light.** |

### What we tried that DIDN'T work

**Patch attempt 1 — `<details>`/`<summary>` rewrite of `CustomJsonNode`** (hypothesis: per-node `useState` + memo-wrapper indirection caused slowness). Result: tradeoff — vis-on improved 2-3× at N=200 but vis-off REGRESSED 4-5× at N=100 because the `<pre>` element was moved from "conditionally mounted" to "always mounted, browser hides via `display:none`." **Reverted.** The original v0.1.3 code's conditional `<pre>` mount was actually a deliberate perf optimization that the patch unknowingly removed.

### What actually fixed it

User opened the sandbox page in the browser at N=200 light, screenshot-captured one render, and pointed at the console flood:

```
[React Flow]: Couldn't create edge for source handle id: "out", edge id: se-0-a
[React Flow]: Couldn't create edge for source handle id: "out", edge id: se-1-a
... × thousands per second ...
```

The fixture data declared `ports: [{id: "in"}, {id: "out"}]` and edges referenced `s0:out → s1:in`, but the rendered DOM had **no `<Handle>` elements** because `CustomJsonNodeImpl` never called `<PortsAt>`. xyflow's edge layer was calling `getEdgePosition` for handles that didn't exist in the DOM, on every frame, for every edge — at N=200 × ~2 edges × 60 fps ≈ **24,000 failed lookups + console warnings per second**. THAT was the CPU cost masquerading as a perf bug.

**Fix** ([decision file](decisions/2026-05-14-flow-canvas-v0.1.4-custom-json-handles.md)):

```diff
+ import { PortsAt } from "./ports-at";
  // ...
  function CustomJsonNodeImpl({ data }: { data: CustomJsonData }) {
    return (
-     <div className={cn("min-w-45 max-w-90 rounded-md ...")}>
+     <div className={cn("relative min-w-45 max-w-90 rounded-md ...")}>
        <button ...>...</button>
        {expanded && <pre>...</pre>}
+       <PortsAt ports={data.ports} position="left" />
+       <PortsAt ports={data.ports} position="right" />
+       <PortsAt ports={data.ports} position="top" />
+       <PortsAt ports={data.ports} position="bottom" />
      </div>
    );
  }
```

### Measured impact (light stress fixture, user's hardware)

⚠ **All numbers below are overlay-only readings on a single machine (no DevTools Performance trace, no hardware logged).** Per the [measurement protocol §9](../docs/procomps/flow-canvas-01-procomp/research/2026-05-14-measurement-protocol.md), the FPS overlay is a smell test, not a citation-grade measurement. Use these to direct planning; do NOT cite them in release notes or success-criterion claims without formal re-measurement.

| N | Vis off — before → AFTER | Vis on — before → AFTER |
|---:|---|---|
| 100 | 70-110 (laggy) → **155** | 40-90 → **160** |
| 200 | **7-15 (very laggy)** → **90-100** | **7-15 (very laggy)** → **100-115** |
| 500 | **3-4 (dead)** → **50-70** | **3-4 (dead)** → **80-90** |
| 1000 | (not prior measured) → **20-30** | (not prior measured) → **60-80** |

**Directional finding: ~15-20× improvement** (overlay-only). Console clean during pan. The light fixture appears faster than the heavy fixture at equal N (fewer DOM nodes per renderer). Formal protocol-compliant re-measurement is needed before this gets cited as proof.

### Methodology lessons captured

Four rules locked into the project's auto-memory (`feedback_perf_debug_methodology.md`, surfaced via MEMORY.md's index) + the measurement protocol §9-§10:

1. **Investigate visually-rendered output BEFORE guessing at React internals.** A screenshot + console scan beats reading code for "what's wrong with this canvas." This bug was visible in the DOM from day one; three speculative patches chased phantoms before the user pointed at the obvious thing.
2. **The FPS overlay is a smell test, not a measurement.** A 1-second rolling average shows 50 FPS while individual frames stutter at 100-200ms. Feels terrible, looks fine on the overlay. Use Chrome DevTools Performance trace + subjective "does it feel smooth" — trust eyes when overlay disagrees.
3. **Long dev sessions degrade browser + HMR state independent of code.** Heavy fixture at N=5000 went from 60-70 FPS smooth to 30-49 FPS laggy with NO code changes affecting it. Restoring recipe: kill dev-server bash task → kill the underlying node process if it survives (TaskStop leaves it; needs `Stop-Process -Id <pid> -Force` via PowerShell) → restart dev-server → **open in incognito window** (bypasses browser HMR module cache + extensions).
4. **Patch attempts that introduce regressions get reverted before measuring further.** Pure perf-bug patches must be strict improvements. A tradeoff is not a fix.

## Implications for the v0.2 tier ladder

The v0.1.4 fix changed the perf landscape enough that the description's Tier-1 plausibility ceilings are now UNDERSHOTS:

| Tier 1 success criterion (description) | Pre-v0.1.4 reality | Post-v0.1.4 reality |
|---|---|---|
| Light ≥50 FPS at N=500 | 3-4 FPS (dead) | **80-90 FPS** (already exceeded) |
| Heavy ≥50 FPS at N=200 | 50-60 (already met) | unchanged |

So when drafting the Stage 2 plan doc:

- **Tier 1** still ships — all THREE changes from description §4.1 (default-flip, drag-end batching, position-only shallow-diff short-circuit). The default-flip is now **directionally** valuable: at N=5000 heavy + culling-on the user measured 60-70 FPS overlay; at N=5000 heavy + culling-off the user measured 5-6 FPS overlay. **~12× directional lift** attributable to the lever alone *(overlay-only single-machine; subject to formal re-measurement)*.
- **Tier 2** urgency reduced. Light is comfortably smooth at N=1000 already; Tier 2's `useShallow` + CSS selection still makes sense but isn't urgent.
- **Tier 3** needs **fresh use-case justification** at the GATE 2 plan stage. If `xyflow + bug-fix + culling` clearly does 5k smooth, what does Tier 3 add? The plan stage should explicitly answer this before committing to canvas-edge-overlay engineering.
- **Tier 4 (sibling procomp) threshold should rise.** Two framings to consider — the plan doc can pick the load-bearing one:
  - **Node-count framing:** raise from "2k+" to "10k-20k+." xyflow + bug-fix + culling is more capable than the description assumed.
  - **Capability framing (more durable):** *"when you genuinely need zero DOM per node"* — survives future xyflow improvements; a node-count threshold can drift as xyflow upstream evolves. Recommended as the primary framing.

**Do NOT edit the description doc** to reflect these realizations — it's signed off, and changes after sign-off are loud and intentional (per the DoD rule). The Stage 2 plan doc is where these updated priors land.

## Files to read on resume (in order)

1. **This file** — start here.
2. [STATUS.md](STATUS.md) — current snapshot (Components row + Last-updated lead + Recent-activity pointer).
3. [decisions/2026-05-14-flow-canvas-v0.1.4-custom-json-handles.md](decisions/2026-05-14-flow-canvas-v0.1.4-custom-json-handles.md) — the bug-fix decision file.
4. [docs/procomps/flow-canvas-01-procomp/flow-canvas-01-v0.2.0-perf-description.md](../docs/procomps/flow-canvas-01-procomp/flow-canvas-01-v0.2.0-perf-description.md) — signed-off Stage 1 description; Q25–Q35 are the locked decisions.
5. [docs/procomps/flow-canvas-01-procomp/research/2026-05-14-baseline.md](../docs/procomps/flow-canvas-01-procomp/research/2026-05-14-baseline.md) — the measurements that drove the v0.1.4 fix + patch attempt log.
6. [docs/procomps/flow-canvas-01-procomp/research/2026-05-14-measurement-protocol.md](../docs/procomps/flow-canvas-01-procomp/research/2026-05-14-measurement-protocol.md) — protocol for any future tier measurement.
7. [docs/procomps/flow-canvas-01-procomp/research/2026-05-14-perf-tier-validation.md](../docs/procomps/flow-canvas-01-procomp/research/2026-05-14-perf-tier-validation.md) — the research that drove the tier ladder design.
8. The two source files of the fix:
   - [src/registry/components/data/flow-canvas-01/parts/custom-json-node.tsx](../src/registry/components/data/flow-canvas-01/parts/custom-json-node.tsx)
   - [src/registry/components/data/flow-canvas-01/meta.ts](../src/registry/components/data/flow-canvas-01/meta.ts)

## Quick-reference for resuming

**Dev server**: was running on port 3000 during the session. Check before starting another: `Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue` (PowerShell) — empty result = port free. If still bound, kill the owning PID via `Stop-Process -Id <pid> -Force` first; the bash-wrapped task may have orphaned a node child process (TaskStop leaves it). Then `pnpm dev`.

**Sandbox stress page URL pattern**:
```
http://localhost:3000/sandbox/flow-stress?n=200&fixture=light&visible=on
                                          ─┬─  ──────┬─────  ────┬────
                                           │         │           └─ onlyRenderVisibleElements
                                           │         └─ "light" (custom-json) or "heavy" (synthetic)
                                           └─ 0..5000
```

**If you want to draft the plan doc**: GATE 2 protocol applies — author → user sign-off ("v0.2 plan approved" or similar) → only THEN implement. Don't run `pnpm new:component` (component already exists).

**If you want to commit first**: use the two-commit split shown in §"What's NEXT" item 1.

**If you want to take a fresh measurement first**: open the sandbox page in an **incognito window** (browser-cache + HMR-cache + extensions all bypassed in one shot), follow the [measurement protocol](../docs/procomps/flow-canvas-01-procomp/research/2026-05-14-measurement-protocol.md), file a new measurement doc under `research/` as `2026-MM-DD-baseline-fresh.md`.

---

**Pause reason:** user requested pause after long measurement-heavy session; the v0.1.4 fix is a complete shipment unit; the v0.2 Stage 2 plan benefits from a fresh head.

**Estimated time to resume:** half a day to draft the plan doc; an additional half day for Tier 1 implementation if signed off the same day.
