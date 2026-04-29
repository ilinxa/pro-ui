# Starter Prompt — Fresh Session Boot

> **What this is:** a copy-pasteable prompt to drop into the start of a new Claude Code session so the assistant orients itself in this project's planning state without re-deriving everything.
>
> **How to use:** copy everything between the `--- COPY BELOW ---` and `--- COPY ABOVE ---` markers and paste it as your first message in a fresh session. The new session will read the right docs, summarize the state back to you, and then wait for direction.
>
> **Variants:** §1 is the full primer (recommended for sessions resuming planning OR starting Tier 1 implementation). §2 is the short version for quick resumption. §3 is implementation-specific (skip the planning context).

---

## 1. Full primer (recommended for fresh sessions)

```
--- COPY BELOW ---

Before doing anything else, orient yourself in this project. Read these docs IN ORDER and confirm you've internalized them by summarizing back the key takeaways:

**Required reading (in order):**

1. `.claude/CLAUDE.md` — project conventions (likely auto-loaded; verify it's in context)
2. `.claude/STATUS.md` — live project state (likely auto-loaded; verify it's in context)
3. `.claude/HANDOFF.md` — session continuation context for the current pause point. **Read this carefully** — it's the bridge from the prior session block to this one.
4. `docs/systems/graph-system/graph-system-description.md` — the master cross-cutting contract. 37 locked decisions; §8 is the decision index; §9 is the sub-doc map showing what's signed off.
5. `docs/procomps/force-graph-procomp/force-graph-procomp-description.md` — the Tier 2 component, phased v0.1–v0.6.
6. `docs/procomps/force-graph-procomp/force-graph-v0.1-plan.md` — viewer-core foundation plan (signed off).
7. `docs/procomps/force-graph-procomp/force-graph-v0.2-plan.md` — interaction infrastructure plan (signed off).
8. `docs/procomps/force-graph-procomp/force-graph-v0.3-plan.md` — editing-layer plan (signed off; CRUD + permissions + applyMutation routing).
9. The 5 signed-off Tier 1 plans (in any order — read the one you're implementing first, skim the others):
   - `docs/procomps/properties-form-procomp/properties-form-procomp-plan.md`
   - `docs/procomps/detail-panel-procomp/detail-panel-procomp-plan.md`
   - `docs/procomps/filter-stack-procomp/filter-stack-procomp-plan.md`
   - `docs/procomps/entity-picker-procomp/entity-picker-procomp-plan.md`
   - `docs/procomps/markdown-editor-procomp/markdown-editor-procomp-plan.md`

**Skim afterward (lower priority but useful):**

- The 5 Tier 1 procomp descriptions (Stage 1) at `docs/procomps/<slug>-procomp/<slug>-procomp-description.md` — usually plans suffice; descriptions have the original Q-locks.
- `docs/procomps/force-graph-procomp/force-graph-phase-0-spike-brief.md` — Phase 0 spike brief (Day-1-ready GPU benchmark instructions; spike is NOT a Claude task).
- `.claude/PHASE-0-ACTION-PLAN.md` — user-facing action plan for the Phase 0 spike.
- `graph-visualizer-old.md` (repo root) — original v4 spec; authoritative for `force-graph` internals.
- `docs/component-guide.md` — long-form pro-component build reference (helpful for Stage 3 implementation patterns).

**After reading, summarize back to me:**

1. The big picture — what `graph-system` is, the three usage modes, why decomposed into Tier 1 / Tier 2 / Tier 3.
2. What's signed off — at minimum: 6 procomp descriptions, **8 plans signed off** (all 5 Tier 1 plans + force-graph v0.1, v0.2, v0.3), Phase 0 spike brief.
3. What's TBA: force-graph v0.4 / v0.5 / v0.6 plans + system Stage 2 plan. All implementation work.
4. The Phase 0 risk-spike bottleneck — gates `force-graph` v0.1 implementation only. Independent of Tier 1 implementation. NOT a Claude task.
5. **Cascade state: 5 of 5 Tier 1 plans signed off (cascade COMPLETE); force-graph v0.3 + v0.4 + v0.5 plan-locks all fully unblocked; system Stage 2 plan now authorable.**
6. The seven concrete next-step options from `HANDOFF.md` §5 (A: implement a Tier 1 component (RECOMMENDED) / B: force-graph v0.4 plan / C: force-graph v0.5 plan / D: force-graph v0.6 plan / E: Phase 0 spike (not Claude work) / F: system Stage 2 plan / G: pause longer).

Then **wait for me to pick a direction**. Do NOT author plans, draft new docs, or modify code until I explicitly say which option to pursue.

**Working pattern in this project (must follow):**

- **Draft → validate → re-validate → sign-off** cadence for all planning docs. I'll say "draft", you draft. I'll say "validate", you do a re-validation pass against locked decisions, signed-off siblings, the original spec, and current library APIs — surface findings as a structured report. I'll say "go ahead", you apply revisions, convert §X "Recommendation:" form to "**Locked: X.**" form, add §X.5 plan-stage tightenings, flip status header, update the system description's §9 sub-doc map, and commit.
- **NEVER rubber-stamp the re-validation pass.** Project auto-memory documents that this cadence consistently catches refinements per planning artifact (1-3 substantive per Stage 1 description; 3-5 substantive per Stage 2 plan). Skipping it produces lower-quality locks. See `feedback_re_validation_pass_catches_real_issues.md` in auto-memory.
- **Decisive recommendations + impact analysis preferred** over option lists. Pick a default, explain why, surface the main trade-off — in brief.
- **Brevity preference confirmed** — keep responses short and clear; avoid long preambles, restated framing, and excessive section structure unless the task itself requires it. Match question length.
- **Per-phase plan reference convention:** legacy `force-graph-procomp-plan.md` citations in system §8 mean per-phase plans (`force-graph-v0.{N}-plan.md`).
- **Decision #35 (Tier 1 independence)** is the single most violated rule — `force-graph` does NOT import any Tier 1 component at the registry level; composition is host/Tier 3 only. v0.3 plan caught a near-miss (typing `NodeType.schema?:` would have imported properties-form types — flipped to `ReadonlyArray<unknown>` opaque carrier on validate pass).
- **Decision #11 footnote** — Lucide icon atlas ships in `force-graph` v0.5, not v0.1, per the phased-plan reinterpretation.
- **Phase 0 risk spike pre-condition** — `force-graph` v0.1 implementation cannot begin until the spike completes (≥30 fps on integrated GPU at 100k edges with `DashedDirectedEdgeProgram`). The spike is NOT a Claude task.
- **CrudResult discriminated return** (force-graph v0.3 lock): all CRUD actions return `{ ok: true, ...payload } | { ok: false, code, reason?, entityIds? }`. Hosts always check `result.ok`.

Ready to receive your summary, then wait for direction.

--- COPY ABOVE ---
```

---

## 2. Short variant (quick resumption)

Use this when you've already chosen what to do and just need the assistant oriented enough to execute. Skip the full primer.

```
--- COPY BELOW ---

Read in order: `.claude/CLAUDE.md`, `.claude/STATUS.md`, `.claude/HANDOFF.md`. Then pick from HANDOFF §5 next-step options or wait for my specific request.

Critical reminders:
- Decision #35 — Tier 1 components are independent; force-graph does NOT import Tier 1 at registry level (use opaque carriers like `unknown` or `Record<string, unknown>` for cross-tier data).
- Decision #11 footnote — Lucide icon atlas ships in v0.5, not v0.1.
- Per-phase plan refs — `force-graph-procomp-plan.md` legacy citations mean per-phase plans (`force-graph-v0.{N}-plan.md`).
- Working pattern — draft → validate → re-validate → sign-off; never rubber-stamp the re-validation pass.
- Brevity preference — keep responses short and clear; match question length.
- 5 of 5 Tier 1 plans + force-graph v0.1/v0.2/v0.3 plans signed off; recommendation is to implement next, not author more plans.

I'll tell you what to do next once you've confirmed orientation.

--- COPY ABOVE ---
```

---

## 3. Implementation-specific variant

Use this when you're starting Tier 1 component implementation. Skips the force-graph plan readings (not needed for Tier 1 implementation per decision #35).

```
--- COPY BELOW ---

I'm starting implementation of a Tier 1 component. Read these docs in order:

1. `.claude/CLAUDE.md` (project conventions)
2. `.claude/STATUS.md` (live state)
3. `.claude/HANDOFF.md` (current pause point)
4. `docs/component-guide.md` (Stage 3 implementation patterns; Anatomy of a component folder)
5. The plan for the component I'm implementing: `docs/procomps/<slug>-procomp/<slug>-procomp-plan.md`
6. `src/registry/components/data/data-table/` (canonical template — read its file structure to mirror)
7. `src/registry/components/data/rich-card/` (more complex example — useful for state-heavy components)

I'll tell you which Tier 1 component to start with. Run the Phase A pre-flight install from the plan's §X.2 (or equivalent) BEFORE anything else, then `pnpm new:component <category>/<slug>` to scaffold from the template.

Working pattern:
- Phase A — types + lib + hooks (foundational; smoke-test at end)
- Phase B — rendering parts + main component (axe-core smoke at end)
- Phase C — demos + integration verification (verify all success criteria from the description)

After each Phase, commit and pause for review. Don't push to remote.

Critical reminders:
- Use existing shadcn primitives where they're in the repo; install missing ones via `pnpm dlx shadcn@latest add <name>` BEFORE Phase A starts.
- Decision #37 — design tokens (Onest + JetBrains Mono, signal-lime, OKLCH only, NO hard-coded colors).
- React 19 ref-as-prop (no forwardRef) — preserves generic inference; the pattern across all 5 Tier 1 plans.
- Decision #35 — Tier 1 components are independent; never import another Tier 1 component.

--- COPY ABOVE ---
```

---

## 4. When to use which

| Scenario | Use |
|---|---|
| Fresh session, weeks since last work, want full re-orient | §1 full primer |
| Same week, you remember the broad strokes, want to dive in | §2 short variant |
| Starting Tier 1 implementation specifically | §3 implementation variant |
| Mid-sprint pause within the same day | Just say "continue from HANDOFF" — auto-memory + auto-loaded STATUS usually suffice |

## 5. Maintenance

When the planning state changes meaningfully:

- If `HANDOFF.md` is refreshed (new pause point), this file's references stay accurate — no edit needed.
- If the file paths in §1 change (new per-phase plan signed off worth highlighting at session start), update §1's "Required reading" list.
- If a new mandatory convention lands, add it to the "Working pattern" / "Critical reminders" sections in §1, §2, and §3.

The starter prompt is meant to be stable across pauses; per-pause specifics live in `HANDOFF.md`. If you find yourself updating this file every pause, the content probably belongs in `HANDOFF.md` instead.
