# `force-graph` — migration intake notes

> **Unusual migration shape:** this is a **self-migration** from `force-graph` v0.2-frozen (removed 2026-05-08) to a future `force-graph` v3 (design TBD). Not an inbound migration from another app. The `original/` folder contains the v0.2 sealed-folder source code + all four iterations of the procomp planning docs (description, v0.1 plan, v0.2 plan, v0.3 plan, phase-0 spike brief, two obsidian.jsx reference examples).

## Source

- **Removed from:** `src/registry/components/data/force-graph/` and `docs/procomps/force-graph-procomp/`
- **Last shipped state:** v0.2.0 (alpha, frozen)
- **Removal date:** 2026-05-08
- **Removal commit:** TBD (post-removal commit; reference once committed)
- **Reason for removal:** Component was problematic; user committed to recreating under a new design + plan rather than continuing v0.2 → v0.3.
- **Manifest entry removed at:** `src/registry/manifest.ts` (3 imports + REGISTRY array entry)
- **Registry entries removed at:** `registry.json` — none (component was never shipped to registry; consistent with F-cross-03 in the sweep tracker)
- **Sigma substrate skill:** `.claude/skills/sigma-react-pro/` retained — useful reference if the recreation also uses sigma. Re-evaluate if the recreation chooses a different graph library.

## Role

`force-graph` was a JSON-driven, force-directed graph visualization built on **Sigma.js** with a **FA2 layout worker** running off the main thread. Target use cases: knowledge-graph viewers, network/topology UIs, dependency visualizations. Items were arbitrary `{ id, label, ... }` nodes + `{ source, target, ... }` edges; layout tuning happened via consumer-supplied FA2 config.

## What to preserve from v0.2 (design DNA)

> Fill before authoring v3 description. Non-exhaustive seeds; user adds the specifics that mattered.

- _(seed: per-node click + hover affordances; physics-tuned settle behavior)_
- _(seed: theming via `--xy-*` / project tokens — same convention used in flow-canvas-01)_
- _(seed: large-N performance budget, e.g. 1000-node target)_
- _(seed: layout pause/resume interaction)_

## What was problematic in v0.2 (rewrite candidates)

> Fill before v3 plan stage. The reasons force-graph stopped being shipped.

- _(seed: sigma's React integration ergonomics — wrap-and-forget never quite worked)_
- _(seed: FA2 worker lifecycle issues — settle detection, restart-on-data-change)_
- _(seed: never made it into `registry.json` — consumer install path was unproven)_
- _(seed: cross-component dep version drift risk if sigma is shared with future graph components)_

## Phased planning archive

The `original/procomp-docs/` folder contains **four plan iterations** (v0.1, v0.2, v0.3 — v0.3 was authored but the component never bumped past v0.2-shipped) plus a phase-0 spike brief and two obsidian-graph example `.jsx` files used for visual reference. Read these in order when starting v3:

1. `force-graph-phase-0-spike-brief.md` — original investigation brief
2. `force-graph-procomp-description.md` — what & why (v0.2 vintage)
3. `force-graph-v0.1-plan.md` → `force-graph-v0.2-plan.md` → `force-graph-v0.3-plan.md` — the planned-but-not-shipped v0.3 documents what direction was being explored
4. `obsidian_graph_example.jsx`, `obsidian_graph_sigma.jsx` — reference implementations from the obsidian community

These are inputs to the v3 analysis.md (extraction pass). The user decides whether v3 keeps sigma, switches to `cosmos` / `cytoscape` / `d3-force-3d`, or goes a different direction entirely.

## Library evaluation for v3 (open)

> Pre-fill when v3 design starts.

- **Sigma.js** — current substrate. Pros: WebGL, mature, FA2 built-in. Cons: React integration ergonomics; the v0.2 implementation hit issues here.
- **Cosmos** — GPU-accelerated, very fast for large graphs. Cons: less mature, smaller community.
- **Cytoscape.js** — Canvas/SVG. Pros: rich features, well-known. Cons: not WebGL, hits perf ceiling earlier.
- **react-force-graph** — D3-based, smaller scale. Pros: simple. Cons: not a ground-up rewrite candidate.
- **xyflow** (already a project peer dep via flow-canvas-01) — could host a graph view as an `xyflow` flow with custom nodes/edges. Pros: dep already present; consistent with flow-canvas substrate. Cons: not designed for force-directed layouts; would need force-layout adapter.

## v3 readiness checklist (when recreation begins)

- [ ] User signs off on this `source-notes.md`
- [ ] Assistant writes `analysis.md` (extraction pass — what to keep, what to rewrite, library decision)
- [ ] User signs off on `analysis.md`
- [ ] New procomp planning kicks off at `docs/procomps/force-graph-procomp/` (greenfield — old procomp docs are archived here, not edited in place)
- [ ] description → plan → guide following the standard procomp workflow
- [ ] Implementation against the new plan (probably as `force-graph` if the slug is reused, or a different slug if the new design is structurally different — `graph-canvas-01`, `network-viewer-01`, etc.)
- [ ] Ship to `registry.json` from day one this time (don't repeat the never-shipped trap)
