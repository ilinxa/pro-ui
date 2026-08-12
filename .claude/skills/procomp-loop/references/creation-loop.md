# C-loop — creation playbook (stage detail)

Companion to SKILL.md. Commands and flake handling: `.claude/readiness.config.md`. Criteria and
model matrix: `.claude/procomp-loop.config.md`. This file is the *order and content* of each stage.

## C0 — Intake & frame (architect)

1. **Capture the idea** in 3–6 sentences: who needs it, what it renders, what data shape it hosts,
   what it must NOT be. If requirements come from another app, route through migration intake
   (`pnpm new:migration <slug>`) first — that system precedes this loop, then feeds C1.
2. **Roadmap & overlap check:** read `.claude/STATUS.md` (is it queued? does a sibling exist?);
   grep `src/registry/` manifest + tags for overlapping components; check `docs/naming-canon.md`
   rules for the slug (noun-first, no `-NN` suffix, ≤160-char description conventions).
3. **Classify:**
   - Tier (procomp / section / page / panel — charter: `docs/library-tiers-charter.md`). Pages and
     panels additionally need constituent inventory at GATE 1 and never self-review at GATE 3.
   - Compound-rule trigger (`.claude/rules/compound-component-structure.md`): ≥3 mountable
     regions, composes another procomp, heavy dep, or plausible subset consumer → MUST plan the
     headless-Root + flat-parts + assembly shape from the start. Single-unit widgets are exempt —
     don't over-engineer.
   - Category — existing one from `src/registry/categories.ts`, or flag that a new category needs
     the two-file edit (types + CATEGORIES) as part of the plan.
4. **Verify every anticipated third-party peer exists**: `pnpm view <pkg> version` — during
   planning, never during implementation (locked lesson: plans have cited phantom packages).
5. **Create the state doc** at `docs/procomps/<slug>-procomp/<slug>-loop.md` from the template.
   Record: mode (C-loop), sign-off policy for this run, model roster, slice plan placeholder.

**Exit:** all five done; scope fits one loop run (a compound with many parts may need slice groups
— rate-limit like a human lead would).

## C1 — Description → GATE 1 (architect)

Author `docs/procomps/<slug>-procomp/<slug>-procomp-description.md` with the required sections
(problem · in/out of scope · target consumers · rough API sketch · example usages · success
criteria · open questions — see `docs/procomps/README.md`).

Then run a **self-adversarial pass before requesting sign-off**: attack scope creep, naming, the
"should this exist at all" question, and overlap with shipped components. Project base rate is 1–3
real findings per description — record them and the resolutions in the state doc. Present open
questions to the user *with a recommendation each* (decision-question format).

**Exit:** GATE 1 sign-off recorded (user, or delegated-mode note).

## C2 — Plan → GATE 2 (architect)

Author `<slug>-procomp-plan.md` with the required sections (final API · file-by-file plan ·
dependencies · composition pattern · client/server · edge cases · accessibility · risks). Add the
loop's three extra artifacts, in the plan doc or state doc:

1. **Invariants table** — testable properties that must hold (these become C5 review targets and
   C6 verification targets). Include at least one negative-path invariant.
2. **Blast-radius table** — every surface this touches: manifest, categories, registry.json,
   docs pages, STATUS, component-versions, llms/README (generated — never hand-edit).
3. **Registry-item plan** — base + `<slug>-fixtures` items, exact `files[]` with locked-convention
   targets, `registryDependencies` vs npm `dependencies` derived from *planned shipped imports*.
   UI mount points enumerated, not just types/state (locked lesson from media-editor extraction).
   Size estimate: source bytes × ~1.13 (JSON-wrap overhead) vs the size budget.

Compound components: the plan MUST enumerate the tier inventory (Root / context parts / standalone
primitives / assembly) and the lazy boundaries — a plan with a god-prop monolith fails GATE 2.
Defensive authoring is standing policy: no `asChild` on custom components, no Radix-only API
assumptions (F-cross-13 — consumers may run Base UI), popover width via dual vars.

Run the **self-adversarial plan pass** (base rate 3–5 findings): attack API dynamicity ("add
later" is a breaking change — open surfaces by default), controlled/uncontrolled duality, SSR
safety (no `Date.now()`/`Math.random()` in render), import legality (`react`, `@/components/ui/*`,
`@/lib/utils`, declared deps only — never `next/*`).

**Exit:** GATE 2 sign-off recorded. Only now is scaffolding allowed.

## C3 — Scaffold & implement (implementer agents, coordinator merges)

1. Coordinator runs `pnpm new:component <category>/<slug>` and pastes the printed 3 manifest
   lines (placed with category siblings, not appended at the bottom).
2. Slice the plan into independently buildable cuts (types+core → parts → demo/usage+meta).
   Small diffs; every model's defect rate explodes with diff size.
3. Spawn implementers per the config matrix, briefs from the brief template. Brief content:
   the plan file path, the slice contract, allowed file list, and the mandatory clauses. Agents
   NEVER touch `registry.json` / `manifest.ts` / `package.json` / shared `types.ts` — they emit
   proposed edits in their report; the coordinator applies them.
4. **Coordinator spot-checks agent claims by reading the actual files** before ticking a slice
   (P4: implementer claims were wrong twice). Meta deps grow per-commit from real imports; keep
   `from`-imports first (validator regex).

**Exit:** all slices ticked with spot-check evidence; `meta.ts` fully populated (version `0.1.0`,
status `alpha`, no scaffold TODO strings anywhere).

## C4 — Gate battery (coordinator)

Run the config's gates **in order** (tsc → lint → meta-deps → registry validators → doc validators
→ `registry:build` → `build`), with env prep first. Record real numbers/outputs in the state doc.
One retry per flake, only if it matches the known-flakes list; second failure → back to C3.

**Exit:** all green with numbers.

## C5 — Adversarial review (finders find, architect verdicts)

Spawn 1–2 **fresh** finder agents over the component diff (axes: code-vs-plan invariants ·
code-vs-docs truth · consumer's-eye API critique · design-token compliance). The architect then
**refutes each finding against the source**: CONFIRMED (file:line) or DROPPED (refutation). Only
CONFIRMED get fixed — implementer fixes, architect re-checks, affected gates re-run.

**Exit:** findings table complete in the state doc; no open CONFIRMED rows.

## C6 — Runtime & smoke proof (implementer drives, architect judges)

Both halves mandatory for first ships — green gates ≠ verification:

1. **Docs-site proof:** production build (`pnpm build` + `next start`, never dev for audits);
   verify catalog card + detail page render, **mount and exercise every documented interaction
   pattern** (controlled-mode precedent), light + dark themes. Instrument per config
   (stealth-browser MCP or host-side Playwright fallback).
2. **Install proof (F-cross-11 path b):** from the smoke consumer (`e:/tmp/ilinxa-smoke-consumer/`),
   real `pnpm dlx shadcn@latest add @ilinxa/<slug>` (serve `public/r/` locally to avoid Vercel
   bot-mitigation) → consumer `pnpm tsc --noEmit` **0 errors** → component renders in the consumer.
   Add missing primitive npm deps per the known flake before judging tsc output. Fixtures item
   installs too. Exercise at least one negative path (invalid input, empty data, absent handler
   hides its affordance).

**Exit:** every invariant observed live; evidence (screenshots / output) noted in the state doc.

## C7 — Docs & GATE 3 (architect)

1. Author `<slug>-procomp-guide.md` (when to use / composition / gotchas / follow-ups).
2. **Registry roster diff:** compare the component folder file list vs `registry.json` `files[]`
   — hand-maintained, drifts (BLOCKER precedent). Never ship `demo.tsx` / `usage.tsx` / `meta.ts`.
3. Re-run `pnpm registry:build` + doc validators (docs settled only now — running them earlier
   certifies docs that later fixes invalidate).
4. Author the **GATE 3 spotcheck review** at `docs/procomps/<slug>-procomp/reviews/
   <YYYY-MM-DD>-v0.1.0-spotcheck.md` from `docs/reviews/templates/review-spotcheck.md`: fixed 4
   dimensions + 1 rotating dimension chosen for this component's risk profile (state why). Smoke
   row copied from C6. Verdict per the frozen ladder; every follow-up gets owner + bump target.
   Pages/panels: peer or AI-assisted review required, findings tagged; constituents must have
   closed their own GATE 3 first.

**Exit:** verdict ≥ `Pass with follow-ups`. `Needs revision`/`Block` → loop back to C3 with the
findings; >5 findings → promote to full checklist review.

## C8 — Ship & retro (architect)

1. Update `.claude/STATUS.md` (component row + count + Recent activity) and author a decision file
   if anything non-obvious surfaced. Run `pnpm validate:doc-budget`.
2. **Base commit**: code + docs + review + state doc together, conventional message, real gate
   numbers in the body. Push to `master` (push = deploy = installable — GATE 3 must already hold).
3. Post-deploy spot-check: live `/r/<slug>.json` resolves (respect the 60s polling rule) and the
   docs page renders on the deployment.
4. **Retro** (5 min): keep / change / config-lied? → append to `.claude/improvement-log.md`.
   Promote any parked items to their owners. Update the state doc Status header to `CLOSED`.

**Exit:** history verified, deployed artifact spot-checked, retro logged.
