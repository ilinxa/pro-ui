# U-loop — update / upgrade playbook (stage detail)

Companion to SKILL.md. The U-loop exists because changing a **published, installable** component
is riskier than creating one: consumers exist, dependents compose it, feature slices inject into
it, and interop contracts (clipboard envelopes, context shapes) span components. Rigor scales
with the change class via the config's **rigor ladder** — read it first; it decides which stages
below are mandatory vs collapsed.

## U0 — Intake & impact (architect)

1. **Classify the change** per the rigor ladder: `patch` (bug fix, no public-API touch) ·
   `minor` (additive API / new feature) · `breaking` (signature/behavior change) · `promotion`
   (alpha → beta). When in doubt between two classes, take the higher one.
2. **Read the component's existing truth**: `meta.ts` (current version/status), the procomp doc
   trio, its latest review file's **open follow-ups** (owed fix-on-touch items — F-cross-15
   static-vs-lazy, `--radix-popover-trigger-width` dual-var audit, and any per-component cohort
   items land NOW if the touch overlaps them; note the ones deliberately not taken).
3. **Blast-radius table** — wider than creation; enumerate ALL of:
   - **Dependents:** grep `registry.json` for the slug in other items' `registryDependencies`,
     and `src/registry/` for cross-procomp imports of it.
   - **Feature-slice items** (`meta.featureOf` pointing at this base) — injection surfaces must
     survive the change.
   - **Interop contracts:** clipboard envelopes (`ilinxa/task`), shared kits (`_shared`),
     context shapes other components read.
   - Docs surfaces: detail page, guide, STATUS row, component-versions, generated llms/README.
4. **Create the state doc** `docs/procomps/<slug>-procomp/<slug>-loop.md` (or append a new run
   section if one exists) — mode U-loop, change class, ladder row, roster.

**Exit:** class + blast radius recorded; scope fits one run.

## U1 — Change contract → sign-off (architect)

1. **Update the planning docs to stay true** — GATE 3 close-condition 1 requires the trio
   *current*, and drift is permanent if not paid on-touch. Patch class: usually a no-change check,
   recorded. Minor/breaking: description scope + plan API sections updated; breaking additionally
   gets a short **migration note** in the guide doc (old → new, what breaks, why).
2. **Invariants delta:** which existing invariants must still hold (regression targets), which
   are new. Existing behavior that consumers rely on is an invariant even if undocumented.
3. **Version bump target** (semver while 0.x: breaking → minor bump `0.x+1.0`; feature → minor;
   fix → patch) + the review trigger it implies per `.claude/rules/readiness-review.md`.
4. Sign-off per the ladder: patch → architect proceeds (record it); minor/breaking/promotion →
   user sign-off (or delegated-mode note). Breaking changes to a component another procomp
   composes are ALWAYS surfaced to the user — a finding analyzed against one consumer can be
   wrong for the other (R10 lesson).

**Exit:** contract + bump target recorded; sign-off per ladder.

## U2 — Implement (implementer agents / architect for small diffs)

Same rules as C3: slices, brief template, coordinator owns shared files, spot-check claims.
A patch-class change with a diff the architect can hold comfortably may skip agents entirely —
don't orchestrate for a 20-line fix. **Regression tests-of-record:** with no unit runner, the
regression proof burden moves to U5 — write the reproduction into the state doc *before* fixing
(what input broke, what should happen) so U5 can replay it.

**Exit:** slices ticked; version bumped in `meta.ts`; deps re-derived (removing files can orphan
declared deps — re-run meta-deps after ANY file removal).

## U3 — Gate battery (coordinator)

Identical to C4: full battery in order, env prep, real numbers, one flake retry max.

**Exit:** all green with numbers.

## U4 — Adversarial review (per ladder)

- `patch`: architect self-check against the invariants delta (hat-switch honesty: try to break
  the fix; check the fix didn't narrow behavior a dependent relies on).
- `minor` / `breaking` / `promotion`: 1–2 fresh finder agents over the diff **plus the dependents
  listed in U0** — the axis unique to upgrades is *dependent regression*: does every composing
  component / feature slice / interop contract still hold? Architect refutes → CONFIRMED/DROPPED
  → fixes → re-run affected gates.

**Exit:** findings table complete; no open CONFIRMED rows.

## U5 — Runtime & smoke proof

1. **Replay the U2 reproduction** (for fixes) and exercise every new/changed documented pattern
   live on the production build — the docs-site demo AND at least one dependent's demo if the
   blast radius listed dependents.
2. **Smoke — the changed slug and its dependents:** real CLI install from local artifacts →
   consumer tsc 0 → render. For minor/breaking: install at least one dependent item too (its
   `registryDependencies` resolution exercises the new artifact). Feature slices over the base:
   re-install base + slice and verify base-without-feature still compiles AND renders (negative
   path is mandatory).
3. Promotion class: run the FULL per-tier smoke + browser pass — promotion certifies maturity,
   the proof burden is highest here.

**Exit:** invariants (old + new) observed live; evidence recorded.

## U6 — Docs sync & review (architect)

1. Walk the U0 blast-radius table: every row updated or explicitly cleared. Regenerate the
   catalog (`registry:build`) and run `pnpm validate:component-versions --check` if versions
   moved, plus doc validators.
2. **Review file per the readiness-review trigger table:** patch → none required; API-touching
   minor → spotcheck (narrow) at `docs/procomps/<slug>-procomp/reviews/<date>-v<ver>-<scope>.md`;
   broad minor / breaking → spotcheck or full checklist per breadth; promotion → **full checklist**
   (16 dims) + report, peer/AI-assisted preferred. Verdict ≥ Pass-with-follow-ups to close.
3. Roster diff `registry.json` vs folder (files added/removed this run are exactly where the
   drift precedent lives).

**Exit:** docs true; review file per ladder with verdict; roster clean.

## U7 — Ship & retro (architect)

Same as C8: STATUS row (version + any status change), decision file if non-obvious, base commit
with gate numbers (`fix(<slug>):` / `feat(<slug>):` per class), push, post-deploy spot-check of
the changed artifact JSON, retro to the improvement log when anything surprised. Follow-ups taken
from the owed list get marked done in their source review files; follow-ups deferred get their
owner + target re-confirmed, not silently dropped.

**Exit:** shipped, history honest, follow-up ledger consistent.
