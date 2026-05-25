# Rule: Readiness review (all library tiers)

> **MANDATORY.** Every library artifact must pass a structured review before it's pushed to `master` (= deployed via Vercel = installable by consumers via `pnpm dlx shadcn add`). This rule covers all four tiers: **pro-component**, **pro-section**, **pro-page**, **pro-panel**. The tier system is defined in [`docs/library-tiers-charter.md`](../../docs/library-tiers-charter.md) — read that first if you're unfamiliar with the model.
>
> **Why this exists:** "Compiles + renders + has docs" ≠ "ready." The 2026-05 procomp sweep surfaced consistent, real issues — design-system drift, positional-callback versioning traps, broken cross-folder imports, missing meta deps, rote TODOs disguised as JSDoc. Those issues hit consumers when the gate doesn't exist. Sections, pages, and panels compose multiple procomps and will surface the same class of drift plus composition-specific failures (god-prop surfaces, mismatched callback shapes between constituents, design-token incoherence across pages). This rule closes the loop at every tier.
>
> **Previously known as `component-readiness-review.md`.** Renamed 2026-05-25 when the tier system landed. A stub at the old path redirects here for historical references.

---

## When the rule applies

The trigger table is shared across tiers; the review template + reviewer + smoke vary per tier.

| Trigger | Spotcheck template | Reviewer (procomp / section) | Reviewer (page / panel) | Min verdict to close |
|---|---|---|---|---|
| **First ship — `v0.1.0`** of any new artifact | per tier (see §"Per-tier spotcheck specifics" below) | Author OR peer | Peer (required) or AI-assisted | `Pass` or `Pass with follow-ups` |
| **`alpha → beta` promotion** | [`docs/reviews/templates/review-checklist.md`](../../docs/reviews/templates/review-checklist.md) (16 dimensions, 90–120 min) + [`review-report.md`](../../docs/reviews/templates/review-report.md) | Peer (preferred) or AI-assisted | Peer (required) or AI-assisted | `Pass` or `Pass with follow-ups` |
| **Public-API-touching minor bump** (e.g., F-cross-12-style migration; v0.x → v0.x+1 breaking) | Spot-check sufficient if narrow scope; full checklist if broad | Author OR peer | Peer (required) or AI-assisted | `Pass` or `Pass with follow-ups` |
| **Patch bump** (`v0.1.x → v0.1.y` non-breaking, no public-API touch) | NOT required | — | — | (n/a — patch bumps don't trigger this rule) |

Existing procomps reviewed during the 2026-05 sweep (see [`docs/reviews/sweep-tracker.md`](../../docs/reviews/sweep-tracker.md)) are **grandfathered** — they don't need a re-review unless they trip one of the triggers above. Sections, pages, and panels have no grandfathered cohort; every first-ship triggers a review.

## What "close" means

An artifact is **closed** (= ready to ship) when ALL of these hold:

1. Planning doc trio (description / plan / guide) complete and current — at the appropriate tier (procomp / section / page / panel).
2. tsc clean, lint clean, `validate:meta-deps` clean.
3. `pnpm build` succeeds (or whatever the current full-build command is).
4. Artifact renders correctly at its docs URL (`/components/<slug>`, `/sections/<slug>`, `/pages/<slug>`, `/panels/<slug>`).
5. **Review file authored at the artifact's review folder:**
   - procomp — `docs/procomps/<slug>-procomp/reviews/<YYYY-MM-DD>-v<version>-<scope>.md` (e.g. `docs/procomps/stat-card-procomp/reviews/...`). Slug `<noun>-<variant>-NN?`; folder appends `-procomp`.
   - section / page / panel — `docs/<tier>/<slug>/reviews/<YYYY-MM-DD>-v<version>-<scope>.md` where `<slug>` already includes the tier suffix (e.g. `docs/sections/stats-row-section-01/reviews/...`, `docs/pages/dashboard-page-01/reviews/...`, `docs/panels/cms-panel-01/reviews/...`). Folder = slug directly; no second tier suffix appended.
6. **Review verdict is `Pass` or `Pass with follow-ups`.**
7. Each `Pass with follow-ups` finding has an explicit owner + bump target (which version it lands in).
8. For pages / panels: every constituent (section, page) has passed its own GATE 3 first. The higher-tier review references constituents, doesn't re-run them.
9. STATUS.md row reflects the actual state. Decision file authored if the review surfaced anything non-obvious.

An artifact with verdict `Needs revision` or `Block` is **NOT closed**. Fix the findings, update the review file (or author a new one with a fresh date), then re-evaluate.

## Where the review fits in the workflow

The review slots between the existing "implement + ship to docs site" steps and the final "push to master" step. The tier-specific workflows mirror the procomp workflow defined in [`.claude/CLAUDE.md`](../CLAUDE.md) and [`docs/component-guide.md`](../../docs/component-guide.md); the gate position is the same:

```
[ ]  0. (Migration intake) — only if porting from another app
[ ]  1. <tier> description.md — sign-off              ←── GATE 1
[ ]  2. <tier> plan.md — sign-off                     ←── GATE 2
[ ]  3. pnpm new:<tier> <category>/<slug>             (Phase B for non-procomp tiers)
[ ]  4. Implement + populate meta.ts + demo + usage
[ ]  5. Add to manifest.ts (docs site visibility)
[ ]  6. Verify docs render
[ ]  7. Add to registry.json
[ ]  8. pnpm registry:build (local artifact verification)
[ ]  9. Author <tier> guide.md (consumer-facing)
[ ] 10. **Run review per this rule. Author review file.**  ←── GATE 3
[ ] 11. **Verdict ≥ "Pass with follow-ups" — else loop back to 4 with findings.**
[ ] 12. Update .claude/STATUS.md + author decision file if non-trivial
[ ] 13. Commit + push to master (Vercel auto-deploys)
```

Steps 1, 2, and 11 are the three blocking gates. For pages and panels, an additional pre-step is folded into GATE 1: the description must include a *constituent inventory + composition contract* (page) or *page roster + shell composition + permission model* (panel). See [`docs/library-tiers-charter.md` §"The three gates (scaled per tier)"](../../docs/library-tiers-charter.md#the-three-gates-scaled-per-tier).

---

## Per-tier spotcheck specifics

All four tiers use a **fixed core of dimensions + 1 rotating dimension**. The fixed core is shared; the rotating dimension is picked for the specific artifact's risk profile and must be documented (1 sentence why).

### Shared fixed core (all tiers)

1. **Planning docs** — description / plan / guide present, accurate, in sync with code (and for page/panel: constituent inventory accurate).
2. **Registry distribution** — live endpoint resolves; targets follow the locked convention; no `demo.tsx` / `usage.tsx` / `meta.ts` shipped (or tier-equivalent).
3. **Meta + manifest sync** — version + status accurate; STATUS.md row honest; for page/panel: constituent meta deps match shipped imports.
4. **Verification** — tsc + lint + build clean; smoke harness pass (see per-tier smoke below).

### Per-tier additions

**pro-component** — no extra fixed dim. 4 fixed + 1 rotating. Template: [`docs/reviews/templates/review-spotcheck.md`](../../docs/reviews/templates/review-spotcheck.md). Rotating dim picked from: Public API / Component internals / Design system / Performance / Accessibility / Robustness / Copy / i18n / Testability.

**pro-section** — no extra fixed dim, but rotating dim **defaults to composition integrity** (override only if composition is trivially clean and another dim has higher risk). Same template as procomp.

**pro-page** — **5 fixed dims**: the shared 4 + **composition integrity** (prop flow correctness across constituent procomps + sections; no leaked internals; no prop-drilling hacks; clean state lifting). Rotating dim picked from the standard list. Template: `docs/reviews/templates/review-spotcheck-page.md` (Phase B — until then, use the procomp spotcheck template with composition integrity manually added as fixed dim 5).

**pro-panel** — **5 fixed dims**: the shared 4 + **design coherence sweep** (do all constituent pages feel like one product? token compliance across pages? typography/spacing consistency? motion choreography coherent?). Rotating dim picked from the standard list. Template: `docs/reviews/templates/review-spotcheck-panel.md` (Phase B — until then, use the procomp spotcheck template with design coherence manually added as fixed dim 5).

### Per-tier smoke

- **pro-component / pro-section (runtime):** F-cross-11 path-b consumer-tsc smoke — `pnpm dlx shadcn add @ilinxa/<slug>` succeeds AND consumer-side `pnpm tsc --noEmit` clean post-install.
- **pro-section (scaffold-fork override):** scaffold-install + tsc clean + render in tmp consumer.
- **pro-page:** scaffold-install in tmp consumer + route renders + tsc clean. Mandatory.
- **pro-panel:** scaffold-install + tsc clean + **navigate every constituent page** + design-token sweep across all pages.

---

## Tier-scaled review mode

| Tier | Self-review acceptable | Peer or AI-assisted required |
|---|---|---|
| pro-component | ✅ for v0.1.0 + patch bumps | preferred for `alpha → beta` + breaking minors |
| pro-section | ✅ for v0.1.0 + patch bumps | preferred for `alpha → beta` + breaking minors |
| pro-page | ❌ never — composition risk too high | ✅ required at every GATE 3 |
| pro-panel | ❌ never — composition risk too high | ✅ required at every GATE 3 |

If no human peer is available for page/panel reviews, run an AI-assisted pass (spawn a `code-reviewer` agent or run a structured prompt over the diff) AND author the review file with the AI's findings tagged as such.

**Don't rubber-stamp.** The "Re-validation pass catches real issues" memory applies at every tier: even self-reviews consistently surface 1–3 substantive findings per Stage 1 description and 3–5 per Stage 2 plan. Same dynamic for GATE 3 reviews. Composition tiers (page / panel) tend to surface MORE findings, not fewer — composition is where drift hides.

---

## What the review file should contain (minimum)

The spotcheck template covers the structure. Beyond the boilerplate, ensure:

- **Header** — slug, tier, version, reviewer, date, git SHA, scope, trigger, verdict.
- **Findings** — `F-NN` numbered, severity-ordered (🚫 Blocker → ⚠️ High → 🔸 Medium → 🔹 Low). Each with location (file:line), description, evidence, suggested fix.
- **Verdict** — explicit; one of `Pass` / `Pass with follow-ups` / `Needs revision` / `Block`.
- **Follow-ups (if `Pass with follow-ups`)** — each finding gets an owner + a bump target (e.g., "fix in v0.1.1" / "fix in v0.2.0").
- **For page / panel reviews:** explicit list of constituent review files that the higher-tier review depends on, with each constituent's verdict + version called out. If any constituent is `Needs revision`, the higher-tier review cannot close.

If a `Pass with follow-ups` review surfaces a finding that turns out to be cross-cutting (affects multiple artifacts), promote it to an `F-cross-NN` entry in [`docs/reviews/sweep-tracker.md`](../../docs/reviews/sweep-tracker.md). The sweep is over, but the tracker remains the canonical home for cross-cutting findings — across all tiers.

## Severity & verdict ladders (frozen)

These are FIXED across all tiers — don't invent new ones.

**Severity:** 🚫 Blocker / ⚠️ High / 🔸 Medium / 🔹 Low.
**Verdict:** Pass / Pass with follow-ups / Needs revision / Block.

See [`docs/reviews/review-process.md` §"Verdict"](../../docs/reviews/review-process.md) for what each verdict means and when to use it.

## What this rule explicitly does NOT do

- **Doesn't replace the planning gates** (description + plan sign-off). Those are GATE 1 and GATE 2; the review is GATE 3. All tiers have all three.
- **Doesn't require automated testing.** Vitest is an informed-defer at every tier. The review is procedural rigor, not test coverage.
- **Doesn't add per-feature review burden.** A single spot-check covers a whole new artifact's first ship; subsequent patch bumps don't trigger.
- **Doesn't gate iteration during build.** Author can iterate freely between steps 3–9. The review only triggers at step 10, when the author thinks they're done.
- **Doesn't introduce a separate "GATE 0" for pages/panels.** The constituent inventory + composition contract folds into GATE 1 description (see [`docs/library-tiers-charter.md`](../../docs/library-tiers-charter.md#the-three-gates-scaled-per-tier)). The gate ladder stays at three across all tiers.

## Cross-references

- Tier system: [`docs/library-tiers-charter.md`](../../docs/library-tiers-charter.md)
- Workflow integration: [`.claude/CLAUDE.md`](../CLAUDE.md) Workflow + Skills + Rules sections
- Workflow integration: [`docs/component-guide.md`](../../docs/component-guide.md) numbered workflow + §13 verification checklist
- Templates: [`docs/reviews/templates/`](../../docs/reviews/templates/)
- Process docs: [`docs/reviews/review-process.md`](../../docs/reviews/review-process.md), [`docs/reviews/review-guide.md`](../../docs/reviews/review-guide.md)
- Sweep precedent: [`docs/reviews/sweep-tracker.md`](../../docs/reviews/sweep-tracker.md), [`docs/reviews/2026-05-09-sweep-rollup.md`](../../docs/reviews/2026-05-09-sweep-rollup.md)
- Charter decision: [`.claude/decisions/2026-05-25-library-tier-system-charter.md`](../decisions/2026-05-25-library-tier-system-charter.md)

---

**Established:** 2026-05-09 (procomp-only). **Extended:** 2026-05-25 (tier system; renamed from `component-readiness-review.md`).
**Authority:** Binding for all artifacts added after the relevant date. Existing procomps grandfathered (sweep-reviewed). No grandfathered cohort for sections / pages / panels.
