---
name: procomp-loop
description: >
  Component creation and upgrade loops for the ilinxa-ui-pro library. Two orchestrated, gate-driven
  workflows: the C-loop takes a new pro-component from idea to description (GATE 1), plan (GATE 2),
  implementation, gate battery, adversarial review, runtime + smoke proof, GATE 3 review, and ship;
  the U-loop applies the same rigor (scaled by impact) to changing an existing component. Use when
  creating, building, or shipping ANY new library component (procomp / pro-section / pro-page /
  pro-panel), and when updating, upgrading, extending, fixing, version-bumping, or promoting
  (alpha to beta) an existing one. For library artifacts this supersedes the generic
  feature-readiness-loop, which remains for non-component work (site, tooling, docs, phases).
metadata:
  version: "1.0.0"
---

# Pro-component loops (C-loop: create · U-loop: update/upgrade)

The library lives in `src/registry/components/`; planning docs in `docs/procomps/`. This skill is
the operational driver for the CLAUDE.md three-gate workflow — it does not replace the gates, it
sequences them with orchestration, adversarial checks, and runtime proof so a component ships with
internal consistency (code ↔ meta ↔ docs ↔ registry) and external consistency (installable,
consumer-tsc-clean, rendered, reviewed).

## Step 0 — resolve configs (always, before anything)

1. Read [`.claude/procomp-loop.config.md`](../../procomp-loop.config.md) — roles, model tiers,
   sign-off policy, upgrade rigor ladder, quality bars. **Criteria live there, not here** — when
   the bar changes, edit the config, not this skill.
2. Read [`.claude/readiness.config.md`](../../readiness.config.md) — gate commands, known flakes,
   env prep, agent-orchestration rules. It is authoritative for every command this skill names.
3. Read `.claude/STATUS.md` + `.claude/improvement-log.md` — prior retros are binding input.

Where configs and this skill disagree on mechanics, configs win; on process order, this file wins.

## State machine

Every run keeps its state in `docs/procomps/<slug>-procomp/<slug>-loop.md`, created from
[assets/loop-state.template.md](assets/loop-state.template.md) at stage 0. Each stage's exit
criteria are checkboxes there; **the Status header advances at every stage transition** (P4 retro
F-8: a frozen header makes the state machine a lie). A fresh session resumes by reading the state
doc and continuing from the first unchecked gate. Never hold loop state only in conversation.

## C-loop — creation (new component)

Read [references/creation-loop.md](references/creation-loop.md) for the full stage playbook
before running. At a glance:

| Stage | Name | Owner | Exit gate (binary) |
|---|---|---|---|
| C0 | Intake & frame | Architect | Requirements captured; overlap/naming-canon grep done; tier + compound-rule classified; peer deps version-verified; state doc created |
| C1 | Description | Architect | Description doc complete + self-adversarial pass (expect 1–3 findings) → **GATE 1 sign-off** |
| C2 | Plan | Architect | Plan doc + invariants table + blast-radius table + registry-item plan + size estimate → **GATE 2 sign-off** |
| C3 | Scaffold & implement | Implementer agents | `pnpm new:component` + slices done per plan; briefs from the brief template; coordinator spot-checks claims |
| C4 | Gate battery | Coordinator | All code gates green with real numbers recorded |
| C5 | Adversarial review | Finder agents find, architect verdicts | Findings table: every row CONFIRMED+fixed or DROPPED+refuted; gates re-run after fixes |
| C6 | Runtime & smoke proof | Implementer drives, architect judges | Docs site render + interactions observed; real CLI install + consumer tsc 0; negative path exercised |
| C7 | Docs & GATE 3 | Architect | Guide doc; registry roster diff; spotcheck review file, verdict ≥ Pass-with-follow-ups → **GATE 3** |
| C8 | Ship & retro | Architect | STATUS row + decision file; commit + push; post-deploy spot-check; retro appended to improvement log |

## U-loop — update / upgrade (existing component)

Read [references/upgrade-loop.md](references/upgrade-loop.md) for the full stage playbook.
Rigor scales with impact — the config's **rigor ladder** maps change class (patch / minor /
breaking / promotion) to how much of each stage is mandatory. At a glance:

| Stage | Name | Owner | Exit gate (binary) |
|---|---|---|---|
| U0 | Intake & impact | Architect | Change classified per rigor ladder; blast radius written (dependents, feature slices, interop contracts, owed follow-ups); state doc created |
| U1 | Change contract | Architect | Planning docs updated to stay true; invariants delta; bump target set → **sign-off per ladder** |
| U2 | Implement | Implementer agents | Slices done; coordinator spot-checks |
| U3 | Gate battery | Coordinator | All code gates green, numbers recorded |
| U4 | Adversarial review | Per ladder | Findings table complete (fresh finder for API-touching; self-check for patch) |
| U5 | Runtime & smoke proof | Implementer drives, architect judges | Changed surface observed live; smoke for the slug AND its dependents |
| U6 | Docs sync & review | Architect | Docs current; review file per ladder; version bumped everywhere it appears |
| U7 | Ship & retro | Architect | STATUS row; commit + push; retro if anything non-obvious |

## Orchestration (summary — full matrix in the config)

- **Architect tier = the main session.** Owns intake, planning docs, all verdicts, gate judgment,
  GATE 3 review authorship, and the ship decision. Never delegated.
- **Implementer tier = Sonnet 5 subagents**, one per independent slice; **finder tier = fresh
  Sonnet 5 subagents** (fresh context is the point — the writer never verdicts its own code).
- **Bulk-mechanical tier** (sweeps, format conversions) may use a cheaper model per the
  subagent-model-policy rule, ALWAYS followed by coordinator re-verification. **Never Opus 5,
  never the bare `opus` alias.**
- Every agent brief is built from [assets/agent-brief.template.md](assets/agent-brief.template.md)
  — its mandatory clauses (foreground-only, no git-state commands, coordinator owns shared files,
  evidence-cited claims) are earned rules from real incidents; do not trim them.
- Coordinator merges shared-file edits (`registry.json`, `manifest.ts`, `package.json`,
  `types.ts`) itself and re-runs the central battery after any agent wave.

## Sign-off policy

GATE 1 / GATE 2 (and U1) are **user decisions**. Default = pause and ask. The user may delegate
sign-off for a run ("build it end-to-end", an autonomous session with explicit instruction) —
record `sign-off: delegated by user (<context>)` in the state doc and proceed; the docs must then
be written to survive the user reading them later with no conversation context. Never
self-delegate silently.

## Anti-patterns — each one shipped a real bug here before becoming a rule

❌ Scaffolding before GATE 1/2 are signed off — renaming a published API costs a major bump.
❌ "tsc + lint green, so it works" — gates prove compilation; C6/U5 runtime proof is the only
   evidence of behavior (3 registry bugs in P3 passed every gate and died on real installs).
❌ Copying `meta.ts` deps into `registry.json` blindly — cross-check against *shipped* imports
   (demo/usage/meta are not shipped).
❌ Trusting the folder listing: `registry.json` `files[]` is hand-maintained — diff folder vs
   roster before every ship (story-viewer BLOCKER precedent).
❌ Fixing every reviewer finding — findings are hypotheses; refute first, fix only CONFIRMED
   (P3: an implementer's "base never imports Button" claim was false; a finder's claim about
   metadata inheritance was refuted by runtime evidence in P4).
❌ Backgrounding installs/gates in agent briefs; running `git stash`/`checkout` in shared trees;
   R5 audits against the dev server — all three nearly cost a working tree or the machine.
❌ Version-bumping `meta.ts` but not STATUS.md / component-versions (`--check` gate exists — run it).
❌ Skipping the smoke because "the artifact JSON looks right" — install + consumer tsc is the bar.
❌ Rubber-stamp reviews — this project's base rate is 1–3 findings per description, 3–5 per plan,
   real findings at every GATE 3. Zero findings means the review didn't happen.

## Bundled files

| File | Read it when |
|---|---|
| [references/creation-loop.md](references/creation-loop.md) | Running the C-loop — before C0 |
| [references/upgrade-loop.md](references/upgrade-loop.md) | Running the U-loop — before U0 |
| [assets/loop-state.template.md](assets/loop-state.template.md) | Creating the state doc at C0/U0 |
| [assets/agent-brief.template.md](assets/agent-brief.template.md) | Spawning any subagent |
