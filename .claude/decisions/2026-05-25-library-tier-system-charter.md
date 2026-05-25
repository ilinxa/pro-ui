---
date: 2026-05-25
type: decision
commits: []
components: []
findings: []
status: shipped
---

# Library tier system charter (Phase A landed; tooling + pilots queued)

## Summary

Formalized a four-tier library model — **pro-component** (existing) + **pro-section** + **pro-page** + **pro-panel** (new) — and locked the model + readiness-review rule before any tier-specific tooling or first pilots are built. Phase A is foundational docs + rule restructure only; no scaffolders, registry infrastructure, or templates yet. Those land in Phase B alongside the first pilot in each tier.

The user pitched this as: *"create predefined panels and pages using our components and make them downloadable packages or somehow reusable during our projects... we even could make it more structurel: pro component we already have / pro sections / pro pages / pro panels."* Yes, it's doable; the question was always how to scale the existing three-gate workflow (description → plan → readiness review) to multi-procomp / multi-page artifacts without either collapsing into god-components or fragmenting into ungoverned snowflakes.

## Context

Pre-decision, `ilinxa-ui-pro` was strictly a procomp library (49 components across 8 categories, all sealed-folder runtime-distributed `registry:component` artifacts). Consumers building real apps face composition fatigue: even with great procomps, they still have to compose a sidebar + topbar + auth shell + dashboard page from scratch every time. The fix conceptually is shadcn's `registry:block` model (consumer installs once, owns + edits the code forever — a snapshot, not a live dep), but applied at three tier sizes: sections (1–3 procomps), pages (one route), panels (route group + shell + many pages).

Three forks were locked before authoring:
1. **Rule structure:** one generic `readiness-review.md` with four tiered sections (chosen over per-tier rule files; over keeping the old name).
2. **Docs layout:** side-by-side dirs (`docs/sections/`, `docs/pages/`, `docs/panels/`) mirroring `docs/procomps/`.
3. **Section shape:** sealed folder mirroring procomp exactly (chosen over a lighter shape; preserves scaffolder reuse + meta-deps validator reuse).

A fourth fork was locked during deep revalidation:
4. **Charter step (constituent inventory + composition contract for pages / panels)** folds into GATE 1 description rather than becoming a new GATE 0. The gate ladder stays at three across all tiers.

## Deep revalidation

A revalidation pass surfaced 15 findings before the charter was written (per the documented "Re-validation pass catches real issues" memory). All 15 folded into the charter or rule:

⚠️ **High** (6): Distribution model not actually tier-locked → per-tier defaults + per-artifact lock at GATE 1. Scaffold install-target was undefined → charter declares conventions for sections / pages / panels (with "first-pilot may revise" caveat). Pre-GATE-1 charter step had no formal slot → folded into GATE 1 description. Per-tier meta schema undefined → charter declares the field skeleton; concrete types defer to Phase B. Panel GATE 3 needs design coherence as a FIXED dim (not rotating) → charter adds it. Page GATE 3 needs composition integrity as a FIXED dim → charter adds it.

🔸 **Medium** (5): Tier boundaries by procomp-count vague → restated by responsibility. Scaffold versioning story → charter declares snapshots, no SemVer compat across re-installs. Cross-tier dep tracking → meta schema lists upstream deps; lint extension deferred to Phase B. Tier-scaled review mode → procomp + section self-OK, page + panel peer/AI required. Naming + namespace → `<noun>-section-NN` / `<noun>-page-NN` / `<noun>-panel-NN` all under `@ilinxa/<slug>`.

🔹 **Low** (4): STATUS.md layout → four per-tier tables (deferred). Migration intake applicability → `--tier` flag in Phase B. Constituent ownership / forking → shared at library, panel-local variants live in panel's `parts/`. Smoke automation → harness extension in Phase B.

## Outcome

Phase A files landed (no commits yet; user will commit-and-push):

- **`docs/library-tiers-charter.md`** (new) — the source of truth. Locks the four-tier model, responsibility-based tier boundaries, default + override distribution rules, scaffold install targets, the three-gate scaling per tier, slug + namespace conventions, scaffold versioning semantics, per-tier meta schema skeleton, tier-scaled review mode, ownership + forking policy, workflow placement, Phase B + Phase C deferred items, and what the charter explicitly does NOT do.
- **`.claude/rules/readiness-review.md`** (new — renamed from `component-readiness-review.md`) — the readiness-review rule, extended to cover all four tiers. Same three-gate spine; per-tier fixed-core dims, smoke variations, and reviewer requirements added.
- **`.claude/rules/component-readiness-review.md`** (overwritten as 4-line stub) — redirect to the new file. Preserves backwards compatibility for the ~50 historical review files + decision files that reference the old path. The original procomp-only text is preserved verbatim in git history at this commit's parent.
- **`docs/sections/README.md`**, **`docs/pages/README.md`**, **`docs/panels/README.md`** (new) — empty tier dirs with operational READMEs. Each declares status ("0 shipped, placeholder until Phase B"), mirrors procomp folder shape, and adds tier-specific stage sections.
- **`.claude/CLAUDE.md`** (edited) — added a "Library tiers" subsection between the procomp Workflow and the Gotchas. Updated the Rules section's rule path (`component-readiness-review.md` → `readiness-review.md`) and broadened the rule statement to cover all four tiers.
- **`docs/component-guide.md`** (edited) — §13 "Component readiness review" header retitled to "Readiness review" + rule path updated + cross-reference to the charter for non-procomp tiers.
- **`docs/reviews/templates/review-spotcheck.md`** + **`docs/reviews/templates/review-checklist.md`** (edited) — rule path updated to the renamed file.
- **`docs/procomps/README.md`** (edited) — workflow checklist line 12 rule path updated.
- **`.claude/STATUS.md`** (edited) — added a "## Library tiers" snapshot block (procomp 49 / section 0 / page 0 / panel 0); Recent activity pointer added.

Verification: zero runtime files touched. `tsc` / `lint` / `validate:meta-deps` / `pnpm build` not relevant for docs-only changes. Historical references to the old rule path resolve via the stub.

## What this decision explicitly does NOT do

- Doesn't ship any section, page, or panel. Zero new runtime artifacts.
- Doesn't write Phase B tooling (scaffolders, registry infra, per-tier categories, meta-deps validator extension, smoke harness extensions).
- Doesn't define category taxonomies for sections / pages / panels — that's Phase B's job after pilots reveal what categories are useful.
- Doesn't migrate any existing procomp into the new tier system. All 49 procomps are unchanged.
- Doesn't rewrite the ~50 historical review + decision files that referenced `component-readiness-review.md` — they resolve via the stub.
- Doesn't add automated testing. Vitest remains an informed-defer at every tier.

## Next gates (when the user wants to move forward)

**Phase B trigger:** when the user picks a pro-section pilot. That ships, surfaces what the pilot teaches about the model, charter gets a v2 if needed, then Phase B tooling for the section tier lands (scaffolder + planning-doc templates + registry infra + categories). Then pro-page pilot. Then pro-panel pilot. Composition risk compounds; do not skip levels.

**Phase C** is pilots in order: section → page → panel. The charter explicitly forbids panel-first; the composition risk compounds.

## Cross-references

- Charter: [`docs/library-tiers-charter.md`](../../docs/library-tiers-charter.md)
- Rule: [`.claude/rules/readiness-review.md`](../rules/readiness-review.md)
- Tier READMEs: [`docs/sections/README.md`](../../docs/sections/README.md), [`docs/pages/README.md`](../../docs/pages/README.md), [`docs/panels/README.md`](../../docs/panels/README.md)
- Old rule stub: [`.claude/rules/component-readiness-review.md`](../rules/component-readiness-review.md)
- Procomp gate precedent: [`.claude/decisions/2026-05-09-component-readiness-review-rule.md`](2026-05-09-component-readiness-review-rule.md)
