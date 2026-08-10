# Readiness review — full specification (all library tiers)

> **Canonical long-form spec.** The always-loaded rule at [`.claude/rules/readiness-review.md`](../../.claude/rules/readiness-review.md) is the ~3KB core (triggers, close-conditions, ladders); THIS file holds the per-tier detail. Moved here 2026-08-10 (production-readiness plan P0.2) to cut per-session token load. Content below is the full 2026-05-25 rule, unchanged in substance.

---

## Why this exists

"Compiles + renders + has docs" ≠ "ready." The 2026-05 procomp sweep surfaced consistent, real issues — design-system drift, positional-callback versioning traps, broken cross-folder imports, missing meta deps, rote TODOs disguised as JSDoc. Those issues hit consumers when the gate doesn't exist. Sections, pages, and panels compose multiple procomps and will surface the same class of drift plus composition-specific failures (god-prop surfaces, mismatched callback shapes between constituents, design-token incoherence across pages). This rule closes the loop at every tier.

The tier system is defined in [`docs/library-tiers-charter.md`](../library-tiers-charter.md).

## When the rule applies

| Trigger | Spotcheck template | Reviewer (procomp / section) | Reviewer (page / panel) | Min verdict to close |
|---|---|---|---|---|
| **First ship — `v0.1.0`** of any new artifact | per tier (see below) | Author OR peer | Peer (required) or AI-assisted | `Pass` or `Pass with follow-ups` |
| **`alpha → beta` promotion** | [`templates/review-checklist.md`](templates/review-checklist.md) (16 dimensions, 90–120 min) + [`templates/review-report.md`](templates/review-report.md) | Peer (preferred) or AI-assisted | Peer (required) or AI-assisted | `Pass` or `Pass with follow-ups` |
| **Public-API-touching minor bump** (e.g., F-cross-12-style migration; v0.x → v0.x+1 breaking) | Spot-check sufficient if narrow scope; full checklist if broad | Author OR peer | Peer (required) or AI-assisted | `Pass` or `Pass with follow-ups` |
| **Patch bump** (`v0.1.x → v0.1.y` non-breaking, no public-API touch) | NOT required | — | — | (n/a) |

Existing procomps reviewed during the 2026-05 sweep (see [`sweep-tracker.md`](sweep-tracker.md)) are **grandfathered** — no re-review unless they trip a trigger. Sections, pages, and panels have no grandfathered cohort.

## What "close" means

An artifact is **closed** (= ready to ship) when ALL of these hold:

1. Planning doc trio (description / plan / guide) complete and current — at the appropriate tier.
2. tsc clean, lint clean, `validate:meta-deps` clean.
3. `pnpm build` succeeds.
4. Artifact renders correctly at its docs URL (`/components/<slug>`, `/sections/<slug>`, `/pages/<slug>`, `/panels/<slug>`).
5. **Review file authored at the artifact's review folder:**
   - procomp — `docs/procomps/<slug>-procomp/reviews/<YYYY-MM-DD>-v<version>-<scope>.md`. Slug `<noun>-<variant>-NN?`; folder appends `-procomp`.
   - section / page / panel — `docs/<tier>/<slug>/reviews/<YYYY-MM-DD>-v<version>-<scope>.md` where `<slug>` already includes the tier suffix. Folder = slug directly.
6. **Review verdict is `Pass` or `Pass with follow-ups`.**
7. Each `Pass with follow-ups` finding has an explicit owner + bump target.
8. For pages / panels: every constituent has passed its own GATE 3 first. The higher-tier review references constituents, doesn't re-run them.
9. STATUS.md row reflects the actual state. Decision file authored if the review surfaced anything non-obvious.

`Needs revision` or `Block` = NOT closed. Fix, update the review file (or author a new one), re-evaluate.

## Where the review fits in the workflow

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

Steps 1, 2, and 11 are the three blocking gates. For pages and panels, GATE 1 additionally requires a *constituent inventory + composition contract* (page) or *page roster + shell composition + permission model* (panel). See the charter §"The three gates (scaled per tier)".

## Per-tier spotcheck specifics

All four tiers use a **fixed core of dimensions + 1 rotating dimension** picked for the artifact's risk profile (document the pick in 1 sentence).

### Shared fixed core (all tiers)

1. **Planning docs** — description / plan / guide present, accurate, in sync with code (page/panel: constituent inventory accurate).
2. **Registry distribution** — live endpoint resolves; targets follow the locked convention; no `demo.tsx` / `usage.tsx` / `meta.ts` shipped.
3. **Meta + manifest sync** — version + status accurate; STATUS.md row honest; page/panel: constituent meta deps match shipped imports.
4. **Verification** — tsc + lint + build clean; smoke harness pass (per-tier smoke below).

### Per-tier additions

- **pro-component** — no extra fixed dim. 4 fixed + 1 rotating. Template: [`templates/review-spotcheck.md`](templates/review-spotcheck.md). Rotating dim from: Public API / Component internals / Design system / Performance / Accessibility / Robustness / Copy / i18n / Testability.
- **pro-section** — rotating dim **defaults to composition integrity** (override only if composition is trivially clean and another dim has higher risk). Same template as procomp.
- **pro-page** — **5 fixed dims**: shared 4 + **composition integrity** (prop flow across constituents; no leaked internals; no prop-drilling hacks; clean state lifting). Template: `templates/review-spotcheck-page.md` (Phase B — until then, procomp spotcheck + composition integrity as manual fixed dim 5).
- **pro-panel** — **5 fixed dims**: shared 4 + **design coherence sweep** (one-product feel, token compliance across pages, typography/spacing consistency, motion choreography). Template: `templates/review-spotcheck-panel.md` (Phase B — until then, procomp spotcheck + design coherence as manual fixed dim 5).

### Per-tier smoke

- **pro-component / pro-section (runtime):** F-cross-11 path-b consumer-tsc smoke — `pnpm dlx shadcn add @ilinxa/<slug>` succeeds AND consumer-side `pnpm tsc --noEmit` clean post-install.
- **pro-section (scaffold-fork override):** scaffold-install + tsc clean + render in tmp consumer.
- **pro-page:** scaffold-install in tmp consumer + route renders + tsc clean. Mandatory.
- **pro-panel:** scaffold-install + tsc clean + **navigate every constituent page** + design-token sweep across all pages.

## Tier-scaled review mode

| Tier | Self-review acceptable | Peer or AI-assisted required |
|---|---|---|
| pro-component | ✅ for v0.1.0 + patch bumps | preferred for `alpha → beta` + breaking minors |
| pro-section | ✅ for v0.1.0 + patch bumps | preferred for `alpha → beta` + breaking minors |
| pro-page | ❌ never — composition risk too high | ✅ required at every GATE 3 |
| pro-panel | ❌ never — composition risk too high | ✅ required at every GATE 3 |

If no human peer is available for page/panel reviews, run an AI-assisted pass (spawn a `code-reviewer` agent or a structured prompt over the diff) AND tag the AI's findings as such in the review file.

**Don't rubber-stamp.** Even self-reviews consistently surface 1–3 substantive findings per Stage 1 description and 3–5 per Stage 2 plan; GATE 3 reviews follow the same pattern. Composition tiers surface MORE findings, not fewer.

## What the review file should contain (minimum)

- **Header** — slug, tier, version, reviewer, date, git SHA, scope, trigger, verdict.
- **Findings** — `F-NN` numbered, severity-ordered. Each with location (file:line), description, evidence, suggested fix.
- **Verdict** — explicit; one of `Pass` / `Pass with follow-ups` / `Needs revision` / `Block`.
- **Follow-ups (if `Pass with follow-ups`)** — each finding gets an owner + a bump target.
- **Page / panel reviews:** explicit list of constituent review files with each constituent's verdict + version. If any constituent is `Needs revision`, the higher-tier review cannot close.

Cross-cutting findings (affecting multiple artifacts) get promoted to `F-cross-NN` in [`sweep-tracker.md`](sweep-tracker.md).

## Severity & verdict ladders (frozen)

**Severity:** 🚫 Blocker / ⚠️ High / 🔸 Medium / 🔹 Low.
**Verdict:** Pass / Pass with follow-ups / Needs revision / Block.

See [`review-process.md`](review-process.md) §"Verdict" for what each verdict means.

## What this rule explicitly does NOT do

- Doesn't replace GATE 1 / GATE 2 planning sign-offs.
- Doesn't require automated testing (Vitest is an informed-defer at every tier).
- Doesn't add per-feature review burden — one spot-check per first ship; patch bumps don't trigger.
- Doesn't gate iteration during build (steps 3–9 iterate freely; review triggers at step 10).
- Doesn't introduce a "GATE 0" for pages/panels — constituent inventory folds into GATE 1.

## Cross-references

Tier system: [`library-tiers-charter.md`](../library-tiers-charter.md) · Templates: [`templates/`](templates/) · Process: [`review-process.md`](review-process.md), [`review-guide.md`](review-guide.md) · Sweep precedent: [`sweep-tracker.md`](sweep-tracker.md), [`2026-05-09-sweep-rollup.md`](2026-05-09-sweep-rollup.md) · Charter decision: `.claude/decisions/2026-05-25-library-tier-system-charter.md`

---

**Established:** 2026-05-09 (procomp-only). **Extended:** 2026-05-25 (tier system). **Split core/spec:** 2026-08-10 (P0.2).
**Authority:** Binding for all artifacts added after the relevant date. Existing procomps grandfathered; no grandfathered cohort for sections / pages / panels.
