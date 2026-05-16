# HANDOFF — rich-card-in-flow Workstream B (flow-canvas-01@v0.2.1 SHIPPED, B remaining), 2026-05-16

> **Read this first** when resuming work on rich-card-in-flow@v0.1.0 first ship.
> Locations referenced are relative to repo root.

## TL;DR — exactly where we are

1. **flow-canvas-01@v0.2.0 SHIPPED + pushed** earlier this session (commits `a6b3295`..`6587ef6`). Tier 1 + Tier 2 perf bundle. GATE 3 spot-check **Pass with follow-ups** — 3 v0.2.1 candidates parked in STATUS.md Open decisions.
2. **rich-card-in-flow Stage 1 description SIGNED OFF + committed** (commit `4a9b5a3`). All 10 Qs locked.
3. **rich-card-in-flow Stage 2 plan v3 SIGNED OFF (GATE 2 closed)** — commit `f3108f5` ([docs/procomps/rich-card-in-flow-procomp/rich-card-in-flow-procomp-plan.md](../docs/procomps/rich-card-in-flow-procomp/rich-card-in-flow-procomp-plan.md)). Pre-impl review caught Blocker F-V6 (`NodeRenderer<RichCardJsonNode>` fails `TData extends NodeData` constraint — `__type` is required on NodeData, absent on RichCardJsonNode); resolved via new `type RichCardCanvasNode = NodeData & RichCardJsonNode` intersection in rich-card-in-flow's `types.ts` (precedent: customJsonRenderer). Plan now has 7 F-findings + 6 V-findings + 4 gap fold-ins all resolved.
4. **Workstream A — flow-canvas-01@v0.2.1 SHIPPED locally** — commits `9dbb06c` (A1 code edits) + `55c630e` (A2 meta + registry regen). `onEditRequest` API on both surfaces + `updateNodeData` helper exported. Patch-bump exemption — GATE 3 skipped, v0.2.0 verdict carries forward. tsc + lint + validate-meta-deps + registry:build all clean. **A3 tracking commit + push happens at end of this session.**
5. **Workstream B — rich-card-in-flow@v0.1.0 first ship is the REMAINING WORK.** ~4–6 hours estimated. Scaffold + 13 files + smoke harness path-b (F-V2 lock, REQUIRED for v0.1.0 first ships) + GATE 3 spot-check (rotating dim: Public API).

## What's NEXT when you resume

**The user-defined next step:** start Workstream B — `rich-card-in-flow@v0.1.0` first ship.

1. Run `pnpm new:component data/rich-card-in-flow` — scaffolds the sealed folder.
2. Implement per plan §5 file-by-file spec (13 files; ~700 LoC total).
3. Run `pnpm tsc --noEmit && pnpm lint && pnpm validate:meta-deps` clean before each commit.
4. After registry.json + `pnpm registry:build` + docs render verification, run **smoke harness path-b** per F-V2 lock (REQUIRED for v0.1.0 first ships — not skippable). Harness at `e:/tmp/ilinxa-smoke-consumer/`; serve `public/r/rich-card-in-flow.json` locally + point smoke consumer's `@ilinxa` namespace at localhost. Consumer-side `pnpm tsc --noEmit` clean post-install is the bar.
5. Author Stage 3 guide alongside implementation.
6. **GATE 3 spot-check REQUIRED.** Rotating dim: **Public API** (subPath signature, viewer composition, imperative-ref pattern). Verdict ≥ `Pass with follow-ups`.
7. STATUS.md + decision file + push.

### Alternative pivot points (if user redirects)

- **flow-canvas-01@v0.2.0 spotcheck follow-ups (F-01 / F-02 / F-03)** — parked v0.2.1 candidates (now v0.2.2 since v0.2.1 just shipped without folding them in). F-01 (formal post-Tier-1+2 measurement) is the most rigorous one.
- **3 remaining active-queue procomps** — `rich-graph-2`, `chat-panel`, `notification-system`. None started.
- **Roadmap items** — `empty-state`, `multi-select`, `page-header`, etc.

## Implementation sequence

### Workstream A — `flow-canvas-01@v0.2.1` patch — DONE LOCALLY (push pending at end of session)

| Commit | SHA | Files | What |
|---|---|---|---|
| **A1** ✅ | `9dbb06c` | `types.ts` · `parts/node-adapter.tsx` · `registries/canvas-context.tsx` · `flow-canvas-01.tsx` · `lib/update-node-data.ts` (new) · `index.ts` | Added `onEditRequest` (both surfaces) + ref-mirror plumbing in `flow-canvas-01.tsx` (F-V5 lock) + new `updateNodeData` helper |
| **A2** ✅ | `55c630e` | `meta.ts` · `registry.json` · `public/r/flow-canvas-01.json` (regenerated) · `public/r/registry.json` | Version 0.2.0 → 0.2.1; registry.json gains `lib/update-node-data.ts` as `registry:component`; `pnpm registry:build` regen — verified artifact line 103 |
| **A3** | (this commit) | `.claude/STATUS.md` · `.claude/decisions/2026-05-16-flow-canvas-v0.2.1-on-edit-request.md` (new) · `docs/component-versions.md` · this HANDOFF | Tracking update + decision file |

**Push at end of A3** — Vercel auto-deploys; `@ilinxa/flow-canvas-01@v0.2.1` becomes consumable.

### Workstream B — `rich-card-in-flow@v0.1.0` first ship (~4–6 hours)

New sealed folder. GATE 3 spot-check REQUIRED (Public API rotating dim). Smoke harness path-b REQUIRED (F-V2 lock — v0.1.0 first ship per readiness-review rule, NOT skippable).

| Step | Files | What |
|---|---|---|
| **Scaffold** | (folder creation) | `pnpm new:component data/rich-card-in-flow` |
| **B1** | `parts/rich-card-viewer.tsx` · `parts/subcard-block.tsx` · `parts/flat-field-strip.tsx` · `lib/enumerate-subcards.ts` · `lib/derive-title.ts` · `lib/derive-flat-fields.ts` · `lib/format-value.ts` | Implement viewer renderer + subcard block + flat-field strip + 4 lib helpers |
| **B2** | `types.ts` · `index.ts` · `meta.ts` · `src/registry/manifest.ts` | Public barrel + types + meta + manifest registration |
| **B3** | `dummy-data.ts` · `demo.tsx` · `usage.tsx` | Demo + usage; verify `/components/rich-card-in-flow` renders |
| **B4** | `registry.json` · `public/r/*.json` (regenerated) | Base item + fixtures item; `pnpm registry:build` |
| **B-smoke** | Run smoke harness path-b against locally-served `public/r/rich-card-in-flow.json` | F-V2 lock; required pre-push |
| **B-guide** | `rich-card-in-flow-procomp-guide.md` | Stage 3 procomp guide (8 sections per plan §10 Impl-time list) |
| **B-review** | `reviews/<date>-v0.1.0-spotcheck.md` | GATE 3 spot-check (rotating dim: Public API) |
| **B5** | `.claude/STATUS.md` · `.claude/decisions/<date>-rich-card-in-flow-v0.1.0-first-ship.md` | Tracking update + decision file |

**Push** Workstream B (Vercel auto-deploys; `@ilinxa/rich-card-in-flow@v0.1.0` available).

## Key locks (must honor at impl time)

| Lock | Source | What it means |
|---|---|---|
| **subPath = `__rcid`** | F-01 | Renderer reads `subcard.__rcid` and fires `ctx.onEditRequest?.(rcid)`. NOT a path-like string. |
| **Imperative `RichCardHandle.focusCard(id)` via ref** | F-02 | Consumer dialog wiring uses `useRef<RichCardHandle>()` + `useEffect` calling `focusCard(subPath)`. The hypothetical `initialFocusPath` prop does NOT exist on rich-card. |
| **Graceful degradation when `__rcid` is missing** | F-03 | Subcard renders + ports paint, but click bubbles to root (not subcard-targeted). Dev-mode warning. |
| **`Object.entries` walker for subcard enumeration** | F-04 | rich-card uses open-shape, not a fixed `children[]` array. Helper `enumerateSubcards(data)` uses heuristic: `__rcid` OR `__rcorder` OR `__rcmeta` OR `ports?: Port[]` → is-card-like. |
| **Position-relative chain for subcard handles** | F-05 + G1 | Every DOM level (NodeShell, RichCardViewer outer, SubcardBlock) MUST be `position: relative` or xyflow handles fly to wrong ancestor. Comment in each level's code. |
| **`<RichCard editable={true}>` + `rich-card@^0.4.0`** | F-06 | rich-card defaults `editable={false}`; dialog must explicitly enable. Peer dep already satisfied (rich-card at v0.4.1). |
| **Single-click trigger, not double-click** | F-07 | Matches n8n's gesture. v0.2 escape hatch via `editTrigger?: "click" \| "doubleClick"` if consumer signals. |
| **`<div role="group">` outer + nested `<button>`s** | F-V1 | NOT a button-of-buttons (invalid HTML + double-click firing). Title strip and each subcard get their own `<button>`; outer is grouping role. |
| **Smoke harness path-b is REQUIRED** | F-V2 | v0.1.0 first ship per readiness-review rule. Not skippable like v0.2.0's case. |
| **Ref-mirror `onEditRequest` in flow-canvas-01.tsx** | F-V5 | Matches existing defensive posture in `use-canvas-data.ts` (which already ref-mirrors all consumer callbacks). Plan §4.3.1 + §4.3.2 spell out the exact wiring. **Now SHIPPED in v0.2.1.** |
| **`type RichCardCanvasNode = NodeData & RichCardJsonNode`** | F-V6 | `NodeRenderer<TData extends NodeData>` requires `__type: string` which `RichCardJsonNode` doesn't have. Intersection type defined in rich-card-in-flow's `types.ts`; re-exported from `index.ts`. Renderer is `NodeRenderer<RichCardCanvasNode>`; `data.ports` accessed directly (no `(data as NodeData)` cast). Subcards stay typed as `RichCardJsonNode` with `(card as NodeData).ports` cast at the subcard boundary. Precedent: `customJsonRenderer`'s `type CustomJsonData = NodeData & { _label?: string }` in [parts/custom-json-node.tsx:8](../src/registry/components/data/flow-canvas-01/parts/custom-json-node.tsx). |

## Files to read on resume (in order)

1. **This file** — start here.
2. [`.claude/STATUS.md`](STATUS.md) — current snapshot.
3. [`docs/procomps/rich-card-in-flow-procomp/rich-card-in-flow-procomp-description.md`](../docs/procomps/rich-card-in-flow-procomp/rich-card-in-flow-procomp-description.md) — Stage 1 signed off, all 10 Qs locked.
4. [`docs/procomps/rich-card-in-flow-procomp/rich-card-in-flow-procomp-plan.md`](../docs/procomps/rich-card-in-flow-procomp/rich-card-in-flow-procomp-plan.md) — Stage 2 plan v3 signed off (GATE 2 closed). Most important for impl.
5. [`docs/procomps/flow-canvas-01-procomp/flow-canvas-01-v0.2.0-perf-description.md`](../docs/procomps/flow-canvas-01-procomp/flow-canvas-01-v0.2.0-perf-description.md) — Q33 of this doc IS the popup-edit convention that rich-card-in-flow implements canonically.
6. [`.claude/decisions/2026-05-16-flow-canvas-v0.2.1-on-edit-request.md`](decisions/2026-05-16-flow-canvas-v0.2.1-on-edit-request.md) — Workstream A decision file; explains the v0.2.1 API surface in detail.
7. (When implementing) [`src/registry/components/data/flow-canvas-01/`](../src/registry/components/data/flow-canvas-01/) — the host source (v0.2.1 state now includes `onEditRequest` + `updateNodeData`).
8. (When implementing) [`src/registry/components/data/rich-card/`](../src/registry/components/data/rich-card/) — the editor (v0.4.1 beta).
9. (When implementing) [`src/registry/components/data/rich-card/types.ts`](../src/registry/components/data/rich-card/types.ts) for `RichCardJsonNode` + `RichCardProps` + `RichCardHandle` shapes.

## Tree state post-Workstream A

- 42 components total; flow-canvas-01 bumped 0.2.0 → 0.2.1.
- All recent commits clean: tsc + lint + validate-meta-deps + build + registry:build all passing.
- Pre-existing virtualizer warnings (2) unchanged.
- Untracked items kept out of commits (deliberate): `src/app/components/[slug]/_lib/` (auto-generated source-map).

## Pre-existing v0.2.0 spotcheck follow-ups (NOT folded into v0.2.1)

These were tagged as v0.2.1 candidates pre-Workstream-A but v0.2.1 stayed minimal-scope (just the API addition). They're now **v0.2.2 candidates** for `flow-canvas-01`:
- **F-01 (Med):** formal protocol-compliant post-Tier-1+2 measurement matrix deferred. Run 4 cells (light vis-on N=200/N=2000, heavy vis-on N=200/N=1000) per protocol §3; file as `research/<date>-tier2-postship.md`.
- **F-02 (Low):** smoke harness path-b not run for v0.2.0 OR v0.2.1.
- **F-03 (Low):** `usage.tsx` "Deferred to v0.2" heading stale post-v0.2.0 ship.

**These DO NOT block rich-card-in-flow.** They're separate work that can interleave or wait.

## Decision points the resume session may face

1. **Approve the plan as-is?** Recommended. The plan is approval-ready (5 V-findings + 4 gaps all folded in; 13-step sequencing; explicit DoD).
2. **Workstream A bundled with v0.2.0 spotcheck follow-ups?** Could bundle F-01 measurement INTO Workstream A's commit A3 (then v0.2.1 ships with the formal measurement file). Or keep separate. User's call.
3. **Q10 helper home — confirm flow-canvas-01@v0.2.1?** Plan §4.4 locks this (helper ships with flow-canvas-01@v0.2.1; rich-card-in-flow re-exports for ergonomic convenience). Pre-emptive answer is "yes."

## Pause reason

User explicitly requested pause + tracking-state update before continuing in a fresh session: *"ok update the memory docs and other tracking docs and states / i will continue the conversation in a fresh new session"*.

This handoff + the tracking-state commit are the deliverables of this pause.

## Estimated time to resume

- Read this + STATUS + the plan: ~10 minutes
- Approve / discuss the plan: variable (10 min to 1 hour depending on findings to discuss)
- Workstream A: 1–2 hours
- Workstream B: 4–6 hours

Full ship of rich-card-in-flow@v0.1.0 + flow-canvas-01@v0.2.1: realistically 1–2 sessions.
