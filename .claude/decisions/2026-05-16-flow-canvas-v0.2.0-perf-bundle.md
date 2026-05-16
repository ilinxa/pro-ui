---
date: 2026-05-16
type: feat
commits: [a6b3295, ac00c5c, 86d8920, 0ec3fbd]
components: [flow-canvas-01]
findings: [F-01, F-02, F-03]
status: shipped
---

# flow-canvas-01 v0.2.0 — Tier 1 + Tier 2 perf bundle

## Summary

`flow-canvas-01` v0.2.0 lands the Tier 1 + Tier 2 perf bundle spec'd in [docs/procomps/flow-canvas-01-procomp/flow-canvas-01-v0.2.0-perf-description.md](../../docs/procomps/flow-canvas-01-procomp/flow-canvas-01-v0.2.0-perf-description.md) (signed off 2026-05-14) and [flow-canvas-01-v0.2.0-procomp-plan.md](../../docs/procomps/flow-canvas-01-procomp/flow-canvas-01-v0.2.0-procomp-plan.md) (signed off 2026-05-16). Two consumer-visible deltas + four internal improvements + new sealed-folder CSS + new internal `lib/shallow.ts` helper. Zero breaking type changes. GATE 3 spot-check **Pass with follow-ups** (3 findings, all bookkeeping; none blocking ship).

### Release notes (locked text from plan Appendix B)

> **Default change:** `onlyRenderVisibleElements` now defaults to `true`. Transforms perf at large N (12–20× directional FPS lift on the protocol's stress matrix at the high end on one measured machine). Pass `={false}` to opt out — only needed if your consumer code relies on offscreen-node DOM (rare; e.g. layout measurement of nodes outside the viewport).
>
> **Behavior change:** `onChange` no longer fires on every drag tick — only on drag-end. Reduces consumer-callback overhead by ~50% at N=1000. Consumers that depended on per-tick fires (autosave during drag, real-time collab broadcast) can either (a) debounce on the receiving side as before — unchanged on the wire, just received at drag-end instead — or (b) wire to xyflow's `onNodeDrag` callback if per-tick granularity is needed. File an issue if neither path works.
>
> **Internal:** `DefaultEdge`'s xyflow store selector now uses a narrow `portEqual` comparator (avoids re-rendering on unrelated `nodeLookup` Map updates). Selection ring **visual** now driven by xyflow's `.react-flow__node.selected` CSS class — the ring applies as a pure browser-side effect regardless of React reconciliation timing (no React-render savings on selection; the win is visual resilience + a cleaner `<NodeShell>` contract). New sealed-folder `flow-canvas-01.css` auto-imported by `canvas.tsx`. New internal `lib/shallow.ts` helper (zero-dep zustand-shape comparator for future selectors).
>
> **No breaking type changes.** All v0.1.x types (`Port`, `NodeRecord`, `EdgeRecord`, `RenderContext`, `FlowCanvasExportHandle`, etc.) unchanged.
>
> **Measured:** v0.1.4 baseline (overlay-only, single machine) used as the comparison floor per plan §9 risk authorization + Path 1 ship choice. Formal protocol-compliant post-Tier-1+2 DevTools-trace measurement deferred (spotcheck F-01); the v0.1.4 + culling-on combination demonstrated 60–70 FPS at N=5000 heavy, which exceeds Tier 1's plausibility ceiling without any Tier 1 code, so the directional evidence is sufficient for ship. Citation-grade numbers come in v0.2.1.

## Context

v0.2.0 followed directly from the v0.1.4 perf investigation (decision file [2026-05-14-flow-canvas-v0.1.4-custom-json-handles.md](2026-05-14-flow-canvas-v0.1.4-custom-json-handles.md)). The v0.1.4 fix (missing port handles in `CustomJsonNode`) eliminated the warning-spam CPU cost that was masquerading as a React reconciliation bug — once the cliff was gone, the actual question became "what's the real ceiling, and what levers move it." The Stage 1 perf description answered that with a 4-tier ladder: Tier 1+2 = `flow-canvas-01` v0.2.0 (default flip + drag batching + narrow selectors + CSS selection); Tier 3 = `flow-canvas-01` v0.3.0 (canvas edge overlay + LOD); Tier 4 = a sibling procomp (`graph-canvas-01`, NOT in `flow-canvas-01`'s scope).

The Stage 2 plan re-validation pass (2026-05-16) surfaced six V-findings — all resolved in place within the plan before implementation started:

- **F-V1 (High):** the original "saves a React re-render on selection" framing was wrong (NodeAdapter recreates `<NodeShell>{renderer.render(...)}</NodeShell>` per render, so children is always a fresh JSX ref defeating `memo(NodeShell)`; and NodeAdapter itself re-renders on selection because xyflow passes new `selected` prop; and `RenderContext.isSelected` is public API so renderers re-render too). Reframed as a CSS-driven-visual + clarity win, not a React-perf win. Change still ships.
- **F-V2 (Med):** release-notes destination clarified — no centralized per-version log exists; decision file + STATUS lead + `docs/component-versions.md` row is the pattern.
- **F-V3 (Med):** CSS files ship as `registry:file`, not `registry:component` — verified by `engagement-heart-burst.css` precedent. The CLAUDE.md "every file registry:component" wording overstates; CSS is the exception.
- **F-V4 (Low):** `onNodeDragStop` flush uses the existing reducer-side-effect pattern (11 other sites in `use-canvas-data.ts` do the same) — propagating consistency, flagging the broader cleanup as a v0.3 candidate.
- **F-V5 (Low):** plan §10 F-08 self-contradiction reframed — the plan's existing line numbers are fine for its lifetime; future docs use symbol names.
- **F-V6 (Med):** `border-radius: inherit` in the CSS rule would override the renderer's existing `rounded-md` (NodeShell has no border-radius) — removed.

## Outcome

### Commits (oldest to newest)

| SHA | Title | Files |
|---|---|---|
| `a6b3295` | `perf(flow-canvas-01): v0.2.0 Tier 1 — visible-elements default + onChange drag-batching` | canvas.tsx, types.ts, use-canvas-data.ts |
| `ac00c5c` | `perf(flow-canvas-01): v0.2.0 Tier 2 — DefaultEdge narrow comparator + selection-ring CSS decoupling` | canvas.tsx, default-edge.tsx, node-adapter.tsx, node-shell.tsx, lib/shallow.ts (new), flow-canvas-01.css (new) |
| `86d8920` | `docs(flow-canvas-01): v0.2.0 guide — new §8 Performance & scale + usage.tsx back-link` | flow-canvas-01-procomp-guide.md, usage.tsx |
| `0ec3fbd` | `feat(flow-canvas-01): v0.2.0 ship — meta bump + registry regen + GATE 2 plan doc` | meta.ts, registry.json, public/r/flow-canvas-01.json, public/r/flow-canvas-01-fixtures.json, public/r/registry.json, plan doc |

### Public API matrix (cumulative v0.2.0)

| Surface | v0.1.4 | v0.2.0 | Migration |
|---|---|---|---|
| `FlowCanvasProps.onlyRenderVisibleElements` default | `false` | `true` | Pass `={false}` to opt out |
| `FlowCanvasProps.onChange` fire cadence | every node change | every change except per-tick drag (fires on drag-stop) | Debounce receiver, or wire `onNodeDrag` for per-tick |
| `RenderContext.isSelected` | populated | populated, unchanged | none |
| `NodeShell.isSelected` prop (internal) | exists | removed | None — internal type, not re-exported |
| `lib/shallow.ts` | n/a | new file (internal helper) | None |
| `flow-canvas-01.css` | n/a | new file (sealed-folder, auto-imported) | None |
| Public types (`Port`, `NodeRecord`, `EdgeRecord`, `RenderContext`, `FlowCanvasExportHandle`, etc.) | as-is | unchanged | none |

**Net:** one observable default flip, one observable soft behavior change, zero type-level breaking changes.

### Verification

- `pnpm tsc --noEmit` — exit 0
- `pnpm lint` — exit 0 (2 pre-existing virtualizer warnings unchanged from v0.1.4 baseline)
- `pnpm validate:meta-deps` — 42/42 clean
- `pnpm build` — exit 0, all 51 routes generated (including `/sandbox/flow-stress`)
- `pnpm registry:build` — clean; spot-check confirmed `flow-canvas-01.css` ships as `registry:file` with content + correct target; `lib/shallow.ts` ships as `registry:component`
- GATE 3 spot-check: [reviews/2026-05-16-v0.2.0-spotcheck.md](../../docs/procomps/flow-canvas-01-procomp/reviews/2026-05-16-v0.2.0-spotcheck.md) — verdict **Pass with follow-ups** (3 findings)

### GATE 3 spot-check follow-ups

| # | Severity | Description | Target |
|---|---|---|---|
| F-01 | 🔸 Med | Formal protocol-compliant post-Tier-1+2 measurement matrix deferred; v0.1.4 baseline used as comparison floor. Run the 4-cell DevTools-trace matrix in a follow-up session; file as `research/<date>-tier2-postship.md`. | v0.2.1 (or standalone research artifact if no code change) |
| F-02 | 🔹 Low | Smoke harness path-b not run for v0.2.0. Two new files (`lib/shallow.ts` + `flow-canvas-01.css`) are simple; producer-side build + registry artifact spot-check verify consumer-side resolution by precedent (`engagement-heart-burst.css`). | Run before push OR defer to v0.2.1 |
| F-03 | 🔹 Low | `usage.tsx` "Deferred to v0.2" heading is stale post-v0.2.0 ship. Rename + reorganize per actual deferral targets. | v0.2.1 |

## Lessons

1. **Re-validation passes earn their keep at GATE 2.** Six V-findings on a draft I authored. F-V1 was a substantive misframing (claimed perf win that wasn't real); F-V6 was a real visual-regression bug that would have shipped if not caught (`border-radius: inherit` would have squared off all renderer corners). The other four were lock-downs of TBD items or doc-staleness corrections. Memory entry `feedback_re_validation_pass_catches_real_issues.md` continues to hold — never rubber-stamp a draft into sign-off.
2. **Path 1 (skip formal baseline) was the right ship choice given the v0.1.4 evidence.** The 2026-05-14 baseline showed `xyflow + bug-fix + culling-on` hits 60-70 FPS at N=5000 heavy — that ALONE exceeds Tier 1's success bar. Running a formal pre-baseline measurement before the Tier 1 implementation would have burned 15–30 min on a confirmation we already had directionally. Plan §9 risks pre-authorized this choice. Documented as F-01 for the post-ship formal measurement.
3. **The reducer-side-effect pattern (F-V4) is a known smell with established precedent.** Eleven sites in `use-canvas-data.ts` already do it; propagating to a twelfth (`onNodeDragStop`) keeps consistency. The right cleanup is to convert all twelve sites at once in v0.3 — not introduce a one-off divergence in v0.2.0.
4. **CSS as `registry:file` is a real exception to the literal CLAUDE.md "every file registry:component" rule.** The wording overstates because the project has only one CSS file in the registry (`engagement-heart-burst.css`) and didn't surface this case when the convention was authored. CLAUDE.md amendment is a separate concern (flagged at end of plan's consistency check; not blocking).

## Cross-references

- Plan: [docs/procomps/flow-canvas-01-procomp/flow-canvas-01-v0.2.0-procomp-plan.md](../../docs/procomps/flow-canvas-01-procomp/flow-canvas-01-v0.2.0-procomp-plan.md)
- Description: [docs/procomps/flow-canvas-01-procomp/flow-canvas-01-v0.2.0-perf-description.md](../../docs/procomps/flow-canvas-01-procomp/flow-canvas-01-v0.2.0-perf-description.md)
- Spot-check review: [docs/procomps/flow-canvas-01-procomp/reviews/2026-05-16-v0.2.0-spotcheck.md](../../docs/procomps/flow-canvas-01-procomp/reviews/2026-05-16-v0.2.0-spotcheck.md)
- Baseline (v0.1.4): [docs/procomps/flow-canvas-01-procomp/research/2026-05-14-baseline.md](../../docs/procomps/flow-canvas-01-procomp/research/2026-05-14-baseline.md)
- Measurement protocol: [docs/procomps/flow-canvas-01-procomp/research/2026-05-14-measurement-protocol.md](../../docs/procomps/flow-canvas-01-procomp/research/2026-05-14-measurement-protocol.md)
- Prior decision (v0.1.4 fix): [2026-05-14-flow-canvas-v0.1.4-custom-json-handles.md](2026-05-14-flow-canvas-v0.1.4-custom-json-handles.md)
- Procomp guide §8: [docs/procomps/flow-canvas-01-procomp/flow-canvas-01-procomp-guide.md](../../docs/procomps/flow-canvas-01-procomp/flow-canvas-01-procomp-guide.md)
