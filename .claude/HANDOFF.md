# Session Handoff — graph-system Planning Sprint (post-Tier-1-cascade-COMPLETE + force-graph-v0.3-locked + ready-to-implement pause)

> **Refreshed:** 2026-04-29 (later still — this version supersedes the post-Tier-1-half refresh at commit `b1f3bf9`)
> **Purpose:** Comprehensive continuation context for the next session. Since the prior refresh, this session block shipped: **3 Tier 1 plans (filter-stack + entity-picker + markdown-editor)** completing the Tier 1 cascade, **`force-graph` v0.3 plan** locking the editing layer, and a strategic pivot signal — **the next session should start implementing**, not author more plans.
> **First read:** This is the third doc to read in a fresh session. Read [.claude/CLAUDE.md](CLAUDE.md) (auto-loaded) and [.claude/STATUS.md](STATUS.md) (auto-loaded) FIRST. Then this doc — orient via §1–§3, then jump to §5 for concrete next-step options.

If you're a fresh Claude session: don't try to derive what's been done — it's all here. Trust this document plus STATUS.md plus CLAUDE.md.

---

## 1. The 60-second project orientation

**Project:** [ilinxa-ui-pro](../) — a private high-level component library. Pro-components built on top of shadcn/ui. Single Next.js 16 app for development; eventual NPM / shadcn-registry publish target.

**Tech stack:** Next 16.2, React 19.2, Tailwind 4 (OKLCH, CSS variables), shadcn v4, TypeScript 5, pnpm 10. `babel-plugin-react-compiler` enabled.

**Critical conventions:**
- **Procomp gate** ([CLAUDE.md](CLAUDE.md) §Workflow): description → plan → guide. Stages 1+2 are signed-off gates.
- **Design tokens** ([CLAUDE.md](CLAUDE.md) §Design system mandate): signal-lime accent, Onest + JetBrains Mono fonts, cool off-white light bg, graphite-cool dark bg, `reveal-up` keyframe.
- **Next 16 has breaking changes** ([AGENTS.md](../AGENTS.md)): training data is wrong for Next 16. READ `node_modules/next/dist/docs/` before route code.

**Where things live:**
- `src/registry/components/<category>/<slug>/` — the components themselves
- `src/registry/{types,categories,manifest}.ts` — registry plumbing
- `src/app/` — docs site
- `src/components/ui/` — shadcn primitives
- `docs/procomps/<slug>-procomp/` — per-component planning docs
- `docs/systems/<slug>-system/` — system-level planning docs

**Existing components in registry** (3, all in [src/registry/manifest.ts](../src/registry/manifest.ts)):
- `data/data-table` (alpha v0.1.0) — canonical template
- `data/rich-card` (beta v0.4.0) — JSON-driven recursive card-tree viewer + editor + safety net
- `layout/workspace` (alpha v0.1.0) — splittable canvas

---

## 2. What the planning sprint has produced (current state, 2026-04-29)

The original v4 spec ([graph-visualizer-old.md](../graph-visualizer-old.md)) was a single 9-week monolithic component. The planning sprint decomposed it into 5 Tier 1 pro-components + 1 Tier 2 pro-component (`force-graph`; phased v0.1–v0.6) + 1 Tier 3 assembled-experience page.

**System-level master doc:** [docs/systems/graph-system/graph-system-description.md](../docs/systems/graph-system/graph-system-description.md). 37 cross-cutting decisions locked.

### 2.1 Procomp descriptions (Stage 1) — ALL signed off ✓

All 6 descriptions signed off 2026-04-28: `properties-form`, `detail-panel`, `filter-stack`, `entity-picker`, `markdown-editor`, `force-graph`.

### 2.2 Plans (Stage 2) — 8 of 12 done

| Plan | Status | Refinements applied on validate pass |
|---|---|---|
| [`force-graph-v0.1-plan.md`](../docs/procomps/force-graph-procomp/force-graph-v0.1-plan.md) | ✓ signed off 2026-04-28 (1040 lines) | Q-P0 added; Q-P5 + Q-P9 refined |
| [`force-graph-v0.2-plan.md`](../docs/procomps/force-graph-procomp/force-graph-v0.2-plan.md) | ✓ signed off 2026-04-29 (879 lines) | Q-P3 + Q-P10 refined |
| [`force-graph-v0.3-plan.md`](../docs/procomps/force-graph-procomp/force-graph-v0.3-plan.md) | ✓ signed off 2026-04-29 (~720 lines) | 5 substantive + 2 minor (group CRUD scope-creep removed; annotation routing rewrite; PermissionAction enum cleanup; CrudResult consolidation; NodeType.schema typed as `ReadonlyArray<unknown>`) |
| [`properties-form-procomp-plan.md`](../docs/procomps/properties-form-procomp/properties-form-procomp-plan.md) | ✓ signed off 2026-04-29 (~620 lines) | 9 fixes |
| [`detail-panel-procomp-plan.md`](../docs/procomps/detail-panel-procomp/detail-panel-procomp-plan.md) | ✓ signed off 2026-04-29 (~600 lines) | 7 fixes |
| [`filter-stack-procomp-plan.md`](../docs/procomps/filter-stack-procomp/filter-stack-procomp-plan.md) | ✓ signed off 2026-04-29 (~640 lines) | 9 fixes (5 substantive + 4 minor) |
| [`entity-picker-procomp-plan.md`](../docs/procomps/entity-picker-procomp/entity-picker-procomp-plan.md) | ✓ signed off 2026-04-29 (~720 lines) | 6 fixes (3 substantive + 3 minor) |
| [`markdown-editor-procomp-plan.md`](../docs/procomps/markdown-editor-procomp/markdown-editor-procomp-plan.md) | ✓ signed off 2026-04-29 (~960 lines) | 10 fixes (4 substantive + 6 minor — `new Marked()`, CM6 StateField for runtime candidates, Q-P8 reasoning fix, wikilink keyboard a11y) |
| `force-graph-v0.4-plan.md` | TBA | Independent; can author anytime |
| `force-graph-v0.5-plan.md` | TBA | Independent; can author anytime |
| `force-graph-v0.6-plan.md` | TBA | Independent (perf hardening; speculative without full system stood up) |
| `graph-system-plan.md` (system Stage 2) | TBA | **Now authorable for the first time** (all per-procomp plans signed off) |

**Cumulative plan stats:** 8 plans signed off; ~6,180 lines; ~64 plan-stage Q-Ps locked; ~58 substantive refinements + ~37 minor refinements caught on validate passes (~3-5 substantive per Stage 2 plan; ~2-3 substantive per description). Total commits across the sprint: ~32 (one draft + one sign-off per signed-off doc).

### 2.3 Cross-cutting state — locked decisions

37 decisions in [graph-system-description.md §8](../docs/systems/graph-system/graph-system-description.md#8-locked-decisions-index). The most operationally relevant:
- **#17** Origin field mandatory on every node + edge from v0.1
- **#22** Real-time deltas preserve UI state, do NOT enter undo stack
- **#23** System data canonical fields read-only; `annotations` field user-writable
- **#25** Permission resolver per-component in v1
- **#33** Single `applyMutation` routing (annotations route through `setAnnotation` variant)
- **#35** Tier 1 components are independent at the registry level — force-graph composes Tier 1 only at host/Tier 3
- **#36** Wikilink reconciliation runs on doc save in `force-graph` v0.5+
- **#37** Design-system mandate — Onest + JetBrains Mono, signal-lime, OKLCH only

System §8 has a "Note on plan references": legacy `force-graph-procomp-plan.md` citations mean per-phase plans (`force-graph-v0.{N}-plan.md`).

---

## 3. The Phase 0 bottleneck (still the real implementation gate)

`force-graph` v0.1 implementation is gated on a **Phase 0 risk spike**. Per [system §10.1](../docs/systems/graph-system/graph-system-description.md#101-phase-0--risk-spike-2-days):

- **Budget:** 2 dev days
- **Task:** Build a prototype `DashedDirectedEdgeProgram` (custom Sigma WebGL edge program; start from `@sigma/edge-arrow` source per v0.1 plan §8.2).
- **Test:** Render 100k edges on both integrated and discrete GPUs.
- **Gate:** **≥30 fps on integrated GPU.**

**If spike succeeds:** v0.1 + v0.2 + v0.3 plans are valid; force-graph implementation can begin (sequential v0.1 → v0.2 → v0.3 → v0.4/v0.5/v0.6 in any order).

**If spike fails:** plans are invalidated. 4-tier contingency tree per [v0.3 plan §12.1](../docs/procomps/force-graph-procomp/force-graph-v0.3-plan.md) + [spike brief §9](../docs/procomps/force-graph-procomp/force-graph-phase-0-spike-brief.md).

**The spike is independent of the procomp gate** — it doesn't block plan authoring or Tier 1 implementation. Tier 1 implementation can begin right now without waiting on the spike.

**Documentation:** when the spike runs, log results in [.claude/STATUS.md](STATUS.md) "Recent decisions" with a 2026-MM-DD date stamp.

---

## 4. The pattern that worked (replicate for next plans / verify on validate)

Across this sprint:

- **8 of 8 plans had refinements caught on the re-validation pass** (1-2 substantive per description; 3-5 substantive per Stage 2 plan).
- **The widening of the substantive count for Stage 2 plans** is documented in `feedback_re_validation_pass_catches_real_issues.md` auto-memory. Stage 2 plans surface more refinements because they cover more concrete API surface (CrudResult shape, CM6 StateField vs bake-in, marked global mutation, etc.) — issues invisible at description stage.
- v0.3 plan (the most recent) caught a major scope creep: **group CRUD was authored a phase early** (description §2.4 locks group CRUD as v0.4 work; my draft moved 5 actions to v0.3). Validate pass caught this via cross-check against description ships list. **This is the kind of issue the validate pass exists to catch.**

**The pattern, one more time:**

1. **Draft the plan** — read all dependencies first (locked decisions; signed-off siblings; original spec). Aim for ~600–1000 lines depending on phase scope. Surface 8–10 plan-stage Q-Ps with recommendations + impact ratings.
2. **Brief the user** — table form is good for Q-P scanning. Mark high-impact Qs explicitly.
3. **Wait for "validate" / "review"** — user reads the draft, asks for re-validation.
4. **Re-validation pass** — go through each Q against locked decisions, original spec, signed-off siblings, and the actual library APIs (CM6 ecosystem, Radix, cmdk, etc.). Surface refinements. **NEVER rubber-stamp.** 3-5 substantive per Stage 2 plan is normal.
5. **Wait for "go ahead"** — user reviews findings; says go-ahead means "apply revisions + sign off."
6. **Sign-off pass** — convert §X "Recommendation:" form to "**Locked: X.**"; add §X.5 plan-stage tightenings; flip status header; flip checkbox in definition-of-done; update system description §9 sub-doc map.
7. **Commit** with message format `docs(procomps/<slug>): sign off <plan>; apply N refinements`.

The user's pattern this sprint: short messages, decisive ("go ahead", "validate", "draft"). **Brevity preference confirmed in this session block** ("you messages are getting messy each time, be short and clear"). Trust the pattern; respond tersely.

---

## 5. Concrete next-step options (the strategic pivot)

**Last session-end recommendation (from the assistant): switch from planning to implementation.** All 5 Tier 1 plans + 3 force-graph plans are signed off. Force-graph implementation is gated on Phase 0 spike (NOT a Claude task). v0.4/v0.5/v0.6 plans + system Stage 2 are best authored AFTER Tier 1 components implement (real APIs surface issues that planning misses). Tier 1 implementation is unblocked.

Five reasonable directions for the next session:

### Option A — Implement a Tier 1 component (RECOMMENDED)

All 5 Tier 1 plans signed off; Phase A pre-flight install sets queued. Tier 1 components are mutually independent per decision #35; any order.

| Component | Budget | Phase A pre-flight | Why first? |
|---|---|---|---|
| **`properties-form`** | ~2-3 weeks | `pnpm dlx shadcn@latest add input select switch textarea tooltip` | **Highest unlock** — needed by force-graph v0.3, rich-card refactor benefits, standalone form surfaces benefit. Recommended first. |
| `detail-panel` | ~1.5 weeks | `pnpm dlx shadcn@latest add skeleton` | Lightest of the panel-shaped components; a good fast win after properties-form. |
| `filter-stack` | ~1.5 weeks | `pnpm dlx shadcn@latest add checkbox input switch tooltip toggle-group` | Generic facets surface; fits data-table column-filter feature too. |
| `entity-picker` | ~1 week | `pnpm dlx shadcn@latest add command` | Smallest install set; quick win. |
| `markdown-editor` | ~3 weeks | `pnpm add @codemirror/state @codemirror/view @codemirror/commands @codemirror/language @codemirror/lang-markdown @codemirror/autocomplete @codemirror/search @lezer/markdown @lezer/highlight marked` | Heaviest by bundle (~180KB ceiling) and complexity (CM6 substrate); save for last. |

Each plan includes: file-by-file file plan; build phases (typically A=types+lib+hooks, B=rendering, C=demos+integration); ARIA contract; edge cases; performance + bundle audit; Q-P locks; §X.5 plan-stage refinements that bake into implementation.

After picking, follow the plan's §8.2 (or equivalent) Build order. Phase A end-gate smoke-tests the foundational pieces; Phase B end-gate runs `axe-core` + visual checks; Phase C end-gate verifies all success criteria from the description.

### Option B — Author `force-graph` v0.4 plan (groups + filter-stack)

Editing layer extension. Composes `filter-stack` at host level. ~2.5w impl per system §10.3. Plan authoring ~600-800 lines + 10 Q-Ps; ~1 session block.

Risk: v0.4 plan may need revisions after Tier 1 components implement and surface real API issues. Safer to author after at least properties-form + detail-panel implement.

### Option C — Author `force-graph` v0.5 plan (doc nodes + wikilink reconciliation + markdown-editor)

The wikilink-reconciliation phase. Composes `markdown-editor` at host level. ~2w impl. Same risk as Option B — markdown-editor is the heaviest pro-component; better to implement first to surface CM6 lifecycle quirks.

### Option D — Author `force-graph` v0.6 plan (perf hardening; multi-edge; advanced settings)

**Speculative until full system stood up.** v0.6 includes the SVG ceiling check (description §2.6) which needs everything else in place. Authoring against the locked architecture is fine but plan will likely revise after v0.1-v0.5 implement.

### Option E — Run Phase 0 risk spike (NOT a Claude task)

The 2-day GPU benchmarking is human work. Surface [PHASE-0-ACTION-PLAN.md](PHASE-0-ACTION-PLAN.md) + [spike brief](../docs/procomps/force-graph-procomp/force-graph-phase-0-spike-brief.md) to whoever runs it. Document result in STATUS.md per spike brief §10. Unblocks force-graph v0.1 implementation.

### Option F — Author `graph-system-plan.md` (system Stage 2)

Newly authorable now that all per-procomp plans are signed off. Tier 3 wiring; integration test patterns; handoff conventions between Tier 1 and Tier 2 components. ~600-800 lines.

Same speculative risk as v0.6 — much of it benefits from real component implementations to validate against.

### Option G — Pause longer

The sprint has shipped 6 description sign-offs + 8 plan sign-offs + Phase 0 spike brief + system description consistency pass. STATUS.md is current. No urgent issues. A longer pause is reasonable.

**Recommendation rank:** A (implement) > E (Phase 0 spike — outside Claude) > B (v0.4 plan) > C (v0.5 plan) > F (system Stage 2 plan) > D (v0.6 plan) > G (pause).

---

## 6. Conventions to honor (must)

These are anchored at the system-description level and carry into all per-component plans:

- **[Decision #35](../docs/systems/graph-system/graph-system-description.md):** Tier 1 components are independent at the registry level. `force-graph` does NOT import any Tier 1 component. Composition is host/Tier 3 only. **Single most violated rule.** v0.3 plan caught a near-miss (typing `NodeType.schema?:` as `PropertiesFormField[]` would have imported properties-form types — flipped to `ReadonlyArray<unknown>` opaque carrier on validate pass).
- **[Decision #11 footnote](../docs/systems/graph-system/graph-system-description.md):** Lucide icon atlas ships in `force-graph` v0.5 (not v0.1). v0.1–v0.4 use Sigma's stock `NodeCircleProgram` (plain disc nodes).
- **[Decision #17](../docs/systems/graph-system/graph-system-description.md):** Origin field mandatory.
- **Per-phase plan reference convention:** legacy `force-graph-procomp-plan.md` citations in system §8 mean per-phase plans.
- **Phase 0 risk-spike pre-condition:** force-graph v0.1 implementation cannot begin until the spike completes.
- **CrudResult discriminated return shape** (v0.3 plan lock): all force-graph CRUD actions return `{ ok: true, ...payload } | { ok: false, code, reason?, entityIds? }`. Hosts always check `result.ok`.

### Things to never do

- **Never import `next/*` from registry components.** Tier 3 page can; pro-components cannot.
- **Never hard-code colors.** Use CSS vars from globals.css.
- **Never use Inter / Roboto / Geist / system-default fonts.** Onest + JetBrains Mono only.
- **Never use `git add -A`.** Stage specific paths.
- **Never skip hooks** (`--no-verify`).
- **Never amend commits** — create new ones.
- **Never push to remote** without explicit user request.
- **Never run a Phase 0 risk spike in a single Claude session** — it's 2 days of GPU benchmarking.
- **Never let a Tier 1 plan reference another Tier 1 component's types directly** — opaque carriers (`unknown`, `Record<string, unknown>`) only.
- **Never author plans further than necessary** — v0.4/v0.5/v0.6/system Stage 2 are speculative until Tier 1 components ship.

---

## 7. Files to read at session start, in order

For sessions resuming planning work or implementing a Tier 1 component, the full reading list. For sessions just continuing from this pause point, [.claude/CLAUDE.md](CLAUDE.md) + [.claude/STATUS.md](STATUS.md) + this file usually suffice.

1. [.claude/CLAUDE.md](CLAUDE.md) (auto-loaded)
2. [.claude/STATUS.md](STATUS.md) (auto-loaded)
3. **This file** ([.claude/HANDOFF.md](HANDOFF.md))
4. [docs/systems/graph-system/graph-system-description.md](../docs/systems/graph-system/graph-system-description.md) — 37 locked decisions
5. [docs/procomps/force-graph-procomp/force-graph-procomp-description.md](../docs/procomps/force-graph-procomp/force-graph-procomp-description.md) — phased v0.1–v0.6
6. [docs/procomps/force-graph-procomp/force-graph-v0.1-plan.md](../docs/procomps/force-graph-procomp/force-graph-v0.1-plan.md) (signed off)
7. [docs/procomps/force-graph-procomp/force-graph-v0.2-plan.md](../docs/procomps/force-graph-procomp/force-graph-v0.2-plan.md) (signed off)
8. [docs/procomps/force-graph-procomp/force-graph-v0.3-plan.md](../docs/procomps/force-graph-procomp/force-graph-v0.3-plan.md) (signed off — newly added)
9. The 5 Tier 1 procomp plans (in any order; pick the one you're implementing or referencing):
   - [properties-form](../docs/procomps/properties-form-procomp/properties-form-procomp-plan.md)
   - [detail-panel](../docs/procomps/detail-panel-procomp/detail-panel-procomp-plan.md)
   - [filter-stack](../docs/procomps/filter-stack-procomp/filter-stack-procomp-plan.md)
   - [entity-picker](../docs/procomps/entity-picker-procomp/entity-picker-procomp-plan.md)
   - [markdown-editor](../docs/procomps/markdown-editor-procomp/markdown-editor-procomp-plan.md)
10. (Skim) The 5 Tier 1 procomp descriptions — usually the plan suffices but description has the original Q-locks.
11. [docs/procomps/force-graph-procomp/force-graph-phase-0-spike-brief.md](../docs/procomps/force-graph-procomp/force-graph-phase-0-spike-brief.md) (if running the spike or referring to its outcome)
12. [docs/component-guide.md](../docs/component-guide.md) — long-form component-build reference (Stage 3 implementation patterns)
13. (Skim) [graph-visualizer-old.md](../graph-visualizer-old.md) — original v4 spec; authoritative for `force-graph` internals only

---

## 8. Recent commits (for git-log orientation)

Most recent first:

```
62a5bb7 docs(procomps/force-graph): sign off v0.3 plan; apply 7 refinements
11118c7 docs(procomps/force-graph): draft v0.3 plan (Stage 2, Phase 3 of 6)
a26fbcc docs(procomps/markdown-editor): sign off v0.1 plan; apply 10 refinements
68f38bf docs(procomps/markdown-editor): draft v0.1 plan (Stage 2)
666fcd8 docs(procomps/entity-picker): sign off v0.1 plan; apply 6 refinements
0c67a3f docs(procomps/entity-picker): draft v0.1 plan (Stage 2)
334c717 docs(procomps/filter-stack): sign off v0.1 plan; apply 9 refinements
3ca80a9 docs(procomps/filter-stack): draft v0.1 plan (Stage 2)
b1f3bf9 docs(handoff, starter-prompt): refresh for post-Tier-1-half + v0.3-cascade pause  ← PRIOR (now-superseded) handoff
68b25ba docs(procomps/detail-panel): sign off v0.1 plan; apply 7 refinements
3ebe709 docs(procomps/detail-panel): draft v0.1 plan (Stage 2)
05387a8 docs(procomps/properties-form): sign off v0.1 plan; apply 9 refinements
31c34a3 docs(procomps/properties-form): draft v0.1 plan (Stage 2)
85826b6 docs(claude): add user-facing PHASE-0-ACTION-PLAN; link from HANDOFF §5A
69163d8 docs(procomps/force-graph): sign off phase-0 spike brief; apply 7 refinements
895786d docs(claude): add STARTER-PROMPT.md for fresh-session boot
2d5fac3 docs(procomps/force-graph): sign off v0.2 plan; refine Q-P3 + Q-P10
2aa993b docs(procomps/force-graph): draft v0.2 plan (Stage 2, Phase 2 of 6)
089955f docs(procomps/force-graph): sign off v0.1 plan; add Q-P0, refine Q-P5 + Q-P9
a9d4eac docs(procomps/force-graph): draft v0.1 plan (Stage 2, Phase 1 of 6)
```

The previous handoff (commit `b1f3bf9`) is preserved in git history; the file content has been replaced by this version.

---

## 9. User pacing notes (from the sprint experience)

- **Decisive** — short messages, direct decisions ("go ahead", "validate", "what is next?", numeric / letter picks from option lists).
- **Iterative** — comfortable with draft → review → revise → sign off cycles. Doesn't try to lock everything up front.
- **Detail-tolerant for the right reasons** — willing to read 1000+-line docs if they're well-structured and decisional.
- **Brevity preference** — explicitly told the assistant "be short and clear" mid-session. Long preambles, restated framing, and section-heavy summaries are unwelcome. Match the question length: short question gets short answer; planning-task gets a structured plan body but the *response chrome* around it stays terse.
- **Trusts the pattern** — once a pattern (draft → validate → re-validate → sign-off) was demonstrated to consistently catch real issues, the user delegates by saying "go ahead" without re-prosecuting it.
- **Schedule-respecting** — explicitly asks for handoffs before pausing the session. Treats long sessions as work blocks; expects clean continuation.

When in doubt, **be decisive with reasoning, in brief**. Pick a default; one sentence on why; one sentence on the trade-off. Don't surface every possible option.

---

*End of refreshed handoff. Pause here. Resume per §5 (next-step options) when continuing — recommendation: Option A (implement a Tier 1 component, starting with properties-form).*
