# Session Handoff — graph-system Planning Sprint (post-v0.2 plan pause)

> **Refreshed:** 2026-04-29 (this version supersedes the 2026-04-28 mid-description-sweep handoff at commit `27adc2e`)
> **Purpose:** Comprehensive continuation context for the next session resuming graph-system planning work, after the second pause point (v0.1 + v0.2 plans signed off).
> **First read:** This is the third doc to read in a fresh session. Read [.claude/CLAUDE.md](CLAUDE.md) (auto-loaded; project conventions) and [.claude/STATUS.md](STATUS.md) (auto-loaded; live state) FIRST. Then this doc — orient via §1–§3, then jump to §5 for concrete next-step options.

If you're a fresh Claude session: don't try to derive what's been done — it's all here. Trust this document plus STATUS.md plus CLAUDE.md.

---

## 1. The 60-second project orientation

**Project:** [ilinxa-ui-pro](../) — a private high-level component library. Pro-components (fully-composed, dependency-explicit) built on top of shadcn/ui that don't exist as primitives. Single Next.js 16 app for development; eventual NPM / shadcn-registry publish target.

**Tech stack:** Next 16.2, React 19.2, Tailwind 4 (OKLCH, CSS variables only, no `tailwind.config.*`), shadcn v4 (Radix base, Nova preset, neutral), TypeScript 5, pnpm 10. `babel-plugin-react-compiler` enabled.

**Critical convention — procomp gate** ([.claude/CLAUDE.md](CLAUDE.md) §Workflow): every new pro-component must pass through three written stages BEFORE any code lands:
1. `<slug>-procomp-description.md` (what & why)
2. `<slug>-procomp-plan.md` (how) — for force-graph: per-phase plans `<slug>-v0.{N}-plan.md`
3. `<slug>-procomp-guide.md` (consumer-facing usage notes)

Stages 1 and 2 are signed-off gates. Stage 3 is authored alongside implementation. Folder: `docs/procomps/<slug>-procomp/`.

**Critical convention — design tokens** ([.claude/CLAUDE.md](CLAUDE.md) §Design system mandate): signal-lime accent (`oklch(0.80 0.20 132)` / `oklch(0.86 0.18 132)`), Onest + JetBrains Mono fonts (NOT Inter / Roboto / Geist / system defaults), cool off-white light bg, graphite-cool dark bg, `reveal-up` keyframe for orchestrated reveals. OKLCH only; no hard-coded colors.

**Critical convention — Next 16 has breaking changes** ([AGENTS.md](../AGENTS.md)): your training data is wrong for Next 16. READ `node_modules/next/dist/docs/` before writing any route code.

**Where things live:**
- `src/registry/components/<category>/<slug>/` — the components themselves (sealed folders following `data-table` shape)
- `src/registry/types.ts`, `categories.ts`, `manifest.ts` — registry plumbing
- `src/app/` — docs site (consumes registry)
- `src/components/ui/` — shadcn primitives (treat as third-party)
- `docs/procomps/<slug>-procomp/` — per-component planning docs (the gate)
- `docs/systems/<slug>-system/` — system-level planning docs (introduced in this sprint)

**Existing components in registry** (3, all in [src/registry/manifest.ts](../src/registry/manifest.ts)):
- `data/data-table` (alpha v0.1.0) — canonical template
- `data/rich-card` (beta v0.4.0) — JSON-driven recursive card-tree viewer + editor + safety net
- `layout/workspace` (alpha v0.1.0) — splittable canvas

---

## 2. What the planning sprint has produced (current state, 2026-04-29)

The original v4 spec ([graph-visualizer-old.md](../graph-visualizer-old.md)) was a single 9-week monolithic component. Across two session blocks (2026-04-28 + 2026-04-29), the planning sprint decomposed it into:

- **5 Tier 1 pro-components** (generic, no graph dependency)
- **1 Tier 2 pro-component** (`force-graph`; phased v0.1–v0.6)
- **1 Tier 3 assembled-experience page** (host code at `src/app/systems/graph-system/page.tsx` — NOT a registry component)

**System-level master doc:** [docs/systems/graph-system/graph-system-description.md](../docs/systems/graph-system/graph-system-description.md). 37 cross-cutting decisions locked. **Decision #11 footnoted on 2026-04-29** to clarify the Lucide icon atlas ships in **v0.5** (not v0.1) per the phased plan — the original "v0.1" wording predated the procomp decomposition.

### 2.1 Procomp descriptions (Stage 1) — ALL signed off ✓

| # | Slug | Category | Status |
|---|---|---|---|
| 1 | `properties-form` | forms | ✓ signed off 2026-04-28 |
| 2 | `detail-panel` | feedback | ✓ signed off 2026-04-28 |
| 3 | `filter-stack` | forms | ✓ signed off 2026-04-28 |
| 4 | `entity-picker` | forms | ✓ signed off 2026-04-28 |
| 5 | `markdown-editor` | forms | ✓ signed off 2026-04-28 |
| 6 | `force-graph` (Tier 2; phased v0.1–v0.6) | data | ✓ signed off 2026-04-28 |

The 6 description sign-offs spanned 12 commits (one draft + one sign-off per procomp). 5 of 6 had refinements caught on the re-validation pass (1–3 substantive refinements per procomp). Pattern that worked: draft → user says "validate" → re-validate against locked decisions + signed-off siblings → surface refinements → user says "go ahead" → apply refinements + sign-off commit.

### 2.2 Plans (Stage 2) — partially complete

| Plan | Status | Blocked on |
|---|---|---|
| [`force-graph-v0.1-plan.md`](../docs/procomps/force-graph-procomp/force-graph-v0.1-plan.md) | ✓ signed off 2026-04-28 (1040 lines) | Phase 0 risk spike (§3) before implementation |
| [`force-graph-v0.2-plan.md`](../docs/procomps/force-graph-procomp/force-graph-v0.2-plan.md) | ✓ signed off 2026-04-29 (879 lines) | v0.1 implementation lands first |
| `force-graph-v0.6-plan.md` | not started | Independent; can author anytime |
| `force-graph-v0.3-plan.md` | not started | Gated on `properties-form` + `detail-panel` plans |
| `force-graph-v0.4-plan.md` | not started | Gated on `filter-stack` plan |
| `force-graph-v0.5-plan.md` | not started | Gated on `markdown-editor` plan |
| `properties-form-procomp-plan.md` | not started | Independent (decision #35) |
| `detail-panel-procomp-plan.md` | not started | Independent |
| `filter-stack-procomp-plan.md` | not started | Independent |
| `entity-picker-procomp-plan.md` | not started | Independent |
| `markdown-editor-procomp-plan.md` | not started | Independent |
| `graph-system-plan.md` (system Stage 2) | not started | After all per-procomp Stage 2 plans lock |

**v0.1 plan key locks** (per [§17 of v0.1 plan](../docs/procomps/force-graph-procomp/force-graph-v0.1-plan.md)):
- Origin-aware data model (every node + edge carries `origin: "system" | "user"`; `systemRef` mandatory when system-origin)
- Two-layer state: graphology `MultiGraph` imperative OUTSIDE Zustand; Zustand has `groupEdges` / `ui` (scaffolded) / `history` (scaffolded) / `settings` / derived slices; `graphologyAdapter` bumps `graphVersion` on every node↔node mutation
- `validateSnapshot` — 12 checks; structured error returns; graceful degradation for unknown system `schemaType` (decision #24); strict reject for unknown `edgeTypeId` (Q-P10 lock)
- Full `GraphInput = GraphSnapshot | GraphSource` from v0.1 (loadInitial required; subscribe + applyMutation optional; applyMutation type-supported but unused until v0.3)
- Custom `DashedDirectedEdgeProgram` structure (Phase 0 spike outcome lands here; `curveOffset` attribute shipped from v0.1 even though only used in v0.6)
- Single `<ForceGraph>` component in v0.1; compound API (`ForceGraph.Provider` + `ForceGraph.Canvas`) deferred to v0.2 per Q-P0
- Bundle ceiling 300KB component-alone (Tier 1 deps NOT included per decision #35)

**v0.2 plan key locks** (per [§16 of v0.2 plan](../docs/procomps/force-graph-procomp/force-graph-v0.2-plan.md)):
- Compound API (`<ForceGraph.Provider>` + `<ForceGraph.Canvas>`) — single `<ForceGraph>` continues working as a thin convenience wrapper
- `useGraphSelector` + `useGraphActions` as public hooks consuming Provider's React context; Zustand v5's `useShallow` wrapper for object selectors (Q-P3 — Zustand v5 removed equality-fn parameter from `useStore`)
- UI slice fully activated (selection / hovered / linkingMode / multiEdgeExpanded / dragState); history slice fully activated (ring buffer of composite transactional entries with both `forwards` + `inverses` per Q-P6 lock)
- Drag-to-pin produces ONE drag-coalesced history entry; FA2 worker pauses dragged node via graphology `fixed: true`
- Linking-mode infrastructure: canvas-side state only; picker chrome lives at Tier 3 per decision #35
- Keyboard shortcuts canvas-focus only (Cmd+Z / Cmd+Shift+Z / Esc) via native `addEventListener`
- `pinned` state is layout-local — NOT subject to canonical-field permission (drag-to-pin works for system + user nodes alike)
- Data prop swap mid-life triggers full reset; hosts stabilize via `useMemo` to prevent (NOT React `key` — that's the opposite direction)

### 2.3 Cross-cutting state — locked decisions

37 decisions in [graph-system-description.md §8](../docs/systems/graph-system/graph-system-description.md#8-locked-decisions-index). The most operationally relevant for plan authoring:
- **#17 Origin field mandatory** on every node + edge from v0.1
- **#22 Real-time deltas preserve UI state**, do NOT enter undo stack
- **#23 System data canonical fields read-only; `annotations` field user-writable**
- **#25 Permission resolver per-component in v1**
- **#33 Single `applyMutation` routing** (annotations route through `setAnnotation` variant)
- **#35 Tier 1 components are independent at the registry level** — force-graph composes Tier 1 only at host/Tier 3
- **#36 Wikilink reconciliation runs on doc save in `force-graph` v0.5+** (markdown-editor's `onSave` triggers it)
- **#37 Design-system mandate** — Onest + JetBrains Mono, signal-lime, OKLCH only

System §8 has a "Note on plan references": legacy `force-graph-procomp-plan.md` citations in the "Where it's enforced" column mean per-phase plans (`force-graph-v0.{N}-plan.md`).

---

## 3. The Phase 0 bottleneck (real next-action; NOT a Claude task)

`force-graph` v0.1 implementation is gated on a **Phase 0 risk spike**. Per [system §10.1](../docs/systems/graph-system/graph-system-description.md#101-phase-0--risk-spike-2-days):

- **Budget:** 2 dev days
- **Task:** Build a prototype `DashedDirectedEdgeProgram` (custom Sigma WebGL edge program supporting solid+dashed × arrows × straight+curved, all uniform-driven; start from `@sigma/edge-arrow` source per spec §11.3).
- **Test:** Render 100k edges on both integrated and discrete GPUs.
- **Gate:** **≥30 fps on integrated GPU.**

**If spike succeeds:** v0.1 + v0.2 plans are valid; `force-graph` v0.1 implementation can begin. v0.2 plan implementation runs sequentially after v0.1 lands.

**If spike fails:** plans are invalidated. The contingency tree (per [v0.1 plan Q-P4 + v0.2 plan §15](../docs/procomps/force-graph-procomp/force-graph-v0.1-plan.md)):
1. Try intermediate fallbacks first — split edge programs (separate dashed-only and directed-only WebGL programs, switching per edge); custom shader optimizations.
2. Worst case: SVG-overlay rendering for all edges; practical edge ceiling drops to ~5k visible.

The spike is **independent of the procomp gate** — it doesn't block plan authoring. Tier 1 plans + force-graph v0.6 plan can author while the spike is pending.

**Documentation:** when the spike runs, log results in [.claude/STATUS.md](STATUS.md) "Recent decisions" with a 2026-MM-DD date stamp; flip the Open-decisions item to `✓ done`.

---

## 4. The pattern that worked (replicate for next plans)

The draft → user-validate → re-validate-pass → sign-off cadence consistently surfaces real issues. Across this sprint:

- 5 of 6 procomp descriptions had refinements caught on the re-validation pass
- v0.1 plan added a new Q-P0 (compound API deferral) on re-validation
- v0.2 plan revised Q-P3 (Zustand v5 API correction) and Q-P10 (wording fix) on re-validation
- System description consistency pass caught stale plan-file references in §7.2, §8, §11.5

**Replicate for the next plan author:**

1. **Draft the plan** — read all dependencies first (locked decisions; signed-off siblings; original spec). Aim for ~600–1000 lines depending on phase scope. Surface 8–10 plan-stage Q-Ps with recommendations + impact ratings.
2. **Brief the user** — table form is good for Q-P scanning. Mark high-impact Qs explicitly.
3. **Wait for "validate" / "review"** — user reads the draft, asks for re-validation.
4. **Re-validation pass** — go through each Q against locked decisions, original spec, signed-off siblings, and the actual library APIs (e.g., Zustand v5 vs v4 differences). Surface refinements.
5. **Wait for "go ahead"** — user reviews findings; says go-ahead means "apply revisions + sign off."
6. **Sign-off pass** — convert §X "Recommendation:" form to "**Locked: X.**" form; add §X.5 plan-stage tightenings; flip status header; flip checkbox in definition-of-done; update system description §9 sub-doc map.
7. **Commit** with message format `docs(procomps/<slug>): sign off <plan>; <refinements>`.

The user's pattern this sprint has been: short messages, decisive ("go ahead", "validate", "what is next?"). Trust the pattern; skip the re-validation pass at your own peril.

---

## 5. Concrete next-step options

When the next session begins, three reasonable directions:

### Option A — Phase 0 risk spike (NOT a Claude task)
Run the 2-day GPU benchmarking work outside any Claude session. Document the result in STATUS.md. **This is the real next-action** for unblocking force-graph implementation; everything else is more planning. **Two docs cover this:**
- [PHASE-0-ACTION-PLAN.md](PHASE-0-ACTION-PLAN.md) — user-facing action plan (who runs the spike: user / teammate / contractor; parallel work options; post-spike protocol). Surface this to the user FIRST when they pick Option A.
- [docs/procomps/force-graph-procomp/force-graph-phase-0-spike-brief.md](../docs/procomps/force-graph-procomp/force-graph-phase-0-spike-brief.md) — technical brief for the spike author (locked program contract, 4-step approach, benchmark methodology + test conditions, 4-tier contingency tree).

### Option B — `properties-form` plan (recommended for continued planning)
First Tier 1 plan. **Deepest dependency in the cascade** — gates `force-graph` v0.3 alongside `detail-panel` plan. The mixed-permission §6.2 showcase (system-origin canonical fields read-only sitting alongside user-owned annotations editable) is the architectural anchor for all editing surfaces.

- Description: [properties-form-procomp-description.md](../docs/procomps/properties-form-procomp/properties-form-procomp-description.md)
- 8 plan-stage tightenings already surfaced in description §8.5
- ~600–800 lines; ~2–3 weeks of implementation work
- Independent of force-graph plans per decision #35

### Option C — `force-graph` v0.6 plan
Last independent force-graph plan. Closes the "all force-graph plans not gated on Tier 1" milestone before the Tier 1 cascade.

- Phase: perf hardening + multi-edge expansion + advanced settings
- 2 weeks focused
- Composes zero Tier 1 components per [system §10.3](../docs/systems/graph-system/graph-system-description.md)
- Speculative until full system stood up (SVG-ceiling check needs everything else in place); authoring against the locked architecture is fine.

### Option D — Pause longer
The sprint has shipped 6 description sign-offs + 2 plan sign-offs + a system-description consistency pass. STATUS.md is current. No urgent issues. A longer pause is reasonable — Phase 0 spike is the actual gate.

**Tier 1 plans (B + the other 4)** are mutually independent per decision #35; can author in any order, in parallel across sessions. force-graph v0.3+ plans are gated on specific Tier 1 plans (v0.3 → properties-form + detail-panel; v0.4 → filter-stack; v0.5 → markdown-editor); deferring them is correct until Tier 1 plans land.

---

## 6. Conventions to honor (must)

These are anchored at the system-description level and carry into all per-component plans:

- **[Decision #35](../docs/systems/graph-system/graph-system-description.md):** Tier 1 components are independent at the registry level. `force-graph` does NOT import any Tier 1 component. Composition is host/Tier 3 only. **Single most violated rule** if you're not careful — it's tempting to import Tier 1 across components for "easy" composition. Don't.
- **[Decision #11 footnote](../docs/systems/graph-system/graph-system-description.md):** Lucide icon atlas ships in `force-graph` v0.5 (not v0.1). v0.1–v0.4 use Sigma's stock `NodeCircleProgram` (plain disc nodes). Per the [v0.1 plan Q-P3](../docs/procomps/force-graph-procomp/force-graph-v0.1-plan.md) deviation.
- **[Decision #17](../docs/systems/graph-system/graph-system-description.md):** Origin field mandatory. Every node + edge has `origin: "system" | "user"`. No defaults. Validates on `importSnapshot`.
- **Per-phase plan reference convention:** legacy `force-graph-procomp-plan.md` citations in system §8's "Where it's enforced" column mean the relevant per-phase plan (`force-graph-v0.{N}-plan.md`). System §8 has an explicit note on this.
- **Phase 0 risk-spike pre-condition:** force-graph v0.1 implementation cannot begin until the spike completes and the result is documented in STATUS.

### Things to never do

- **Never import `next/*` from registry components** ([CLAUDE.md](CLAUDE.md)). Tier 3 page can; pro-components cannot.
- **Never hard-code colors.** Use CSS vars from [globals.css](../src/app/globals.css) ([decision #37](../docs/systems/graph-system/graph-system-description.md)).
- **Never use Inter / Roboto / Geist / system-default fonts.** Onest + JetBrains Mono only.
- **Never use `git add -A`.** Stage specific paths.
- **Never skip hooks** (`--no-verify`, etc.). Investigate failures.
- **Never amend commits** — create new ones.
- **Never push to remote** without explicit user request.
- **Never run a Phase 0 risk spike in a single Claude session** — it's 2 days of GPU benchmarking; surface as separate work.

---

## 7. Files to read at session start, in order

1. [.claude/CLAUDE.md](CLAUDE.md) (auto-loaded) — project conventions
2. [.claude/STATUS.md](STATUS.md) (auto-loaded) — live project state
3. **This file** ([.claude/HANDOFF.md](HANDOFF.md)) — session continuation context
4. [docs/systems/graph-system/graph-system-description.md](../docs/systems/graph-system/graph-system-description.md) — master cross-cutting contract (37 locked decisions)
5. [docs/systems/README.md](../docs/systems/README.md) — systems-tier governance
6. [docs/procomps/README.md](../docs/procomps/README.md) — procomp gate
7. [docs/component-guide.md](../docs/component-guide.md) — long-form component-build reference
8. [docs/procomps/force-graph-procomp/force-graph-procomp-description.md](../docs/procomps/force-graph-procomp/force-graph-procomp-description.md) — phased v0.1–v0.6 surface
9. [docs/procomps/force-graph-procomp/force-graph-v0.1-plan.md](../docs/procomps/force-graph-procomp/force-graph-v0.1-plan.md) — viewer-core foundation
10. [docs/procomps/force-graph-procomp/force-graph-v0.2-plan.md](../docs/procomps/force-graph-procomp/force-graph-v0.2-plan.md) — interaction infrastructure
11. The 5 Tier 1 descriptions (in any order):
    - [properties-form](../docs/procomps/properties-form-procomp/properties-form-procomp-description.md)
    - [detail-panel](../docs/procomps/detail-panel-procomp/detail-panel-procomp-description.md)
    - [filter-stack](../docs/procomps/filter-stack-procomp/filter-stack-procomp-description.md)
    - [entity-picker](../docs/procomps/entity-picker-procomp/entity-picker-procomp-description.md)
    - [markdown-editor](../docs/procomps/markdown-editor-procomp/markdown-editor-procomp-description.md)
12. (Skim) [graph-visualizer-old.md](../graph-visualizer-old.md) — original v4 spec; authoritative for `force-graph` internals; system description supersedes for cross-cutting only

After all that you'll have the full picture. Then pick from §5.

---

## 8. Recent commits (for git-log orientation)

Most recent first; full history via `git log`:

```
2d5fac3 docs(procomps/force-graph): sign off v0.2 plan; refine Q-P3 + Q-P10
2aa993b docs(procomps/force-graph): draft v0.2 plan (Stage 2, Phase 2 of 6)
8cb70f7 docs(systems/graph-system): consistency pass; footnote decision #11
089955f docs(procomps/force-graph): sign off v0.1 plan; add Q-P0, refine Q-P5 + Q-P9
a9d4eac docs(procomps/force-graph): draft v0.1 plan (Stage 2, Phase 1 of 6)
ed3740c docs(status): description sweep complete; trim recent-decisions log
e8df9d0 docs(procomps/force-graph): sign off description; refine Q5 + Q8 + Q10
c27b78f docs(procomps/force-graph): draft v0.1 description
79d9b53 docs(procomps/markdown-editor): sign off description; reverse Q1, refine Q4 + Q8
6a48b69 docs(procomps/markdown-editor): draft v0.1 description
27adc2e docs(handoff): comprehensive session handoff for fresh-session resumption  ← the previous (now-superseded) handoff
47869dc docs(procomps/entity-picker): sign off description
d376f03 docs(procomps/entity-picker): draft v0.1 description
```

The previous handoff (commit `27adc2e`) is preserved in git history; the file content has been replaced by this version.

---

## 9. User pacing notes (from the sprint experience)

- **Decisive** — short messages, direct decisions ("go ahead", "validate", "what is next?", "1" / "2" picks from option lists).
- **Iterative** — comfortable with draft → review → revise → sign off cycles. Doesn't try to lock everything up front.
- **Detail-tolerant for the right reasons** — willing to read 1000+-line docs if they're well-structured and decisional. Will push back if recommendations feel un-validated ("re-validate carefully", "deeply review").
- **Schedule-respecting** — explicitly asks for handoffs before pausing the session. Treats long sessions as work blocks; expects clean continuation.
- **Trusts the pattern** — once a pattern (draft → validate → re-validate → sign-off) was demonstrated to consistently catch real issues, the user delegates by saying "go ahead" without re-prosecuting it.

When in doubt, **be decisive with reasoning**. Don't surface every possible option — pick a default, explain why, list the main trade-off. The user values forward motion with reversible decisions over exhaustive deliberation.

---

*End of refreshed handoff. Pause here. Resume per §5 (next-step options) when continuing.*
