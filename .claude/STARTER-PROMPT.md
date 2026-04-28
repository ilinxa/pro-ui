# Starter Prompt — Fresh Session Boot

> **What this is:** a copy-pasteable prompt to drop into the start of a new Claude Code session so the assistant orients itself in this project's planning state without re-deriving everything.
>
> **How to use:** copy everything between the `--- COPY BELOW ---` and `--- COPY ABOVE ---` markers and paste it as your first message in a fresh session. The new session will read the right docs, summarize the state back to you, and then wait for direction.
>
> **Variants:** §1 is the full primer (recommended for sessions resuming planning work). §2 is the short version for quick resumption when you already know what you want done.

---

## 1. Full primer (recommended)

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
8. `docs/procomps/properties-form-procomp/properties-form-procomp-plan.md` — first Tier 1 plan (signed off; pairs with detail-panel to fully unblock force-graph v0.3 plan-lock).
9. `docs/procomps/detail-panel-procomp/detail-panel-procomp-plan.md` — second Tier 1 plan (signed off; pairs with properties-form to fully unblock force-graph v0.3 plan-lock).

**Skim afterward (lower priority but useful):**

- The five signed-off Tier 1 procomp descriptions in `docs/procomps/<slug>-procomp/<slug>-procomp-description.md`: `properties-form`, `detail-panel`, `filter-stack`, `entity-picker`, `markdown-editor`.
- `docs/procomps/force-graph-procomp/force-graph-phase-0-spike-brief.md` — Phase 0 spike brief (Day-1-ready instructions for the GPU benchmark; spike itself is NOT a Claude task).
- `.claude/PHASE-0-ACTION-PLAN.md` — user-facing action plan for the Phase 0 spike (who runs it; parallel work options).
- `graph-visualizer-old.md` (repo root) — original v4 spec; authoritative for `force-graph` internals; system description supersedes it for cross-cutting only.
- `docs/component-guide.md` — long-form pro-component build reference.

**After reading, summarize back to me:**

1. The big picture — what `graph-system` is, the three usage modes, why it's decomposed into Tier 1 / Tier 2 / Tier 3.
2. What's signed off vs pending — at minimum: the 6 procomp descriptions, the 4 signed-off plans (force-graph v0.1 + v0.2; properties-form; detail-panel), the Phase 0 spike brief, and what's still TBA (force-graph v0.3 / v0.4 / v0.5 / v0.6 plans; 3 remaining Tier 1 plans — filter-stack / entity-picker / markdown-editor; system Stage 2 plan).
3. The Phase 0 risk-spike bottleneck — what it is, why it gates `force-graph` v0.1 implementation, and what happens if it fails. The spike brief + action plan provide ready-to-execute material; the spike itself is human work outside any Claude session.
4. The cascade state: **`force-graph` v0.3 plan-lock now FULLY UNBLOCKED** (properties-form + detail-panel plans both signed off); v0.4 / v0.5 still gated on remaining Tier 1 plans (filter-stack / markdown-editor); v0.6 always independent.
5. The five concrete next-step options from `HANDOFF.md` §5 (A: Phase 0 spike / B: force-graph v0.3 plan — newly unblocked / C: remaining Tier 1 plans / D: force-graph v0.6 plan / E: pause longer).

Then **wait for me to pick a direction**. Do NOT author plans, draft new docs, or modify code until I explicitly say which option to pursue.

**Working pattern in this project (must follow):**

- **Draft → validate → re-validate → sign-off** cadence for all planning docs. I'll say "draft", you draft. I'll say "validate", you do a re-validation pass against locked decisions, signed-off siblings, the original spec, and current library APIs — surface findings as a structured report. I'll say "go ahead", you apply revisions, convert §X "Recommendation:" form to "**Locked: X.**" form, add §X.5 plan-stage tightenings, flip status header, update the system description's §9 sub-doc map, and commit.
- **NEVER rubber-stamp the re-validation pass.** Project auto-memory documents that this cadence has consistently caught 1–3 substantive refinements per planning artifact across the sprint. Skipping it produces lower-quality locks. See `feedback_re_validation_pass_catches_real_issues.md` in auto-memory.
- **Decisive recommendations + impact analysis preferred** over option lists. Pick a default, explain why, surface the main trade-off.
- **Per-phase plan reference convention:** legacy `force-graph-procomp-plan.md` citations in system §8 mean per-phase plans (`force-graph-v0.{N}-plan.md`). System §8 has an explicit note on this.
- **Decision #35 (Tier 1 independence)** is the single most violated rule if you're not careful — `force-graph` does NOT import any Tier 1 component at the registry level; composition is host/Tier 3 only.
- **Decision #11 footnote** — Lucide icon atlas ships in `force-graph` v0.5, not v0.1, per the phased-plan reinterpretation.
- **Phase 0 risk spike pre-condition** — `force-graph` v0.1 implementation cannot begin until the spike completes (≥30 fps on integrated GPU at 100k edges with `DashedDirectedEdgeProgram`). The spike itself is NOT a Claude task — it's 2 days of GPU benchmarking outside any session.

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
- Decision #35 — Tier 1 components are independent; force-graph does NOT import Tier 1 at registry level.
- Decision #11 footnote — Lucide icon atlas ships in v0.5, not v0.1.
- Per-phase plan refs — `force-graph-procomp-plan.md` legacy citations mean per-phase plans (`force-graph-v0.{N}-plan.md`).
- Working pattern — draft → validate → re-validate → sign-off; never rubber-stamp the re-validation pass.

I'll tell you what to do next once you've confirmed orientation.

--- COPY ABOVE ---
```

---

## 3. When to use which

| Scenario | Use |
|---|---|
| Fresh session, weeks since last work, want full re-orient | §1 full primer |
| Same week, you remember the broad strokes, want to dive into specific work | §2 short variant |
| Mid-sprint pause within the same day | Just say "continue from HANDOFF" — auto-memory + auto-loaded STATUS usually suffice |

## 4. Maintenance

When the planning state changes meaningfully:

- If `HANDOFF.md` is refreshed (new pause point), this file's references stay accurate — no edit needed.
- If the file paths in §1 change (e.g., new per-phase plan added that's worth highlighting at session start), update §1's "Required reading" list to include it.
- If a new mandatory convention lands (a new rule that must be honored from session start), add it to the "Working pattern" / "Critical reminders" sections in both §1 and §2.

The starter prompt is meant to be stable across pauses; the per-pause specifics live in `HANDOFF.md`. If you find yourself updating this file every pause, the content probably belongs in `HANDOFF.md` instead.
