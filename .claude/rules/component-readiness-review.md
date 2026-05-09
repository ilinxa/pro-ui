# Rule: Component readiness review

> **MANDATORY.** Every new component must pass a structured review before it's pushed to `master` (= deployed via Vercel = installable by consumers via `pnpm dlx shadcn add`). The same review system used for the 2026-05 sweep applies to all future components, in perpetuity.
>
> **Why this exists:** "Compiles + renders + has docs" ≠ "ready." The sweep surfaced consistent, real issues — design-system drift, positional-callback versioning traps, broken cross-folder imports, missing meta deps, rote TODOs disguised as JSDoc. Those issues hit consumers when the gate doesn't exist. This rule closes the loop.

---

## When the rule applies

| Trigger | Review template | Reviewer | Min verdict to close |
|---|---|---|---|
| **First ship — `v0.1.0`** of any new component | [`docs/reviews/templates/review-spotcheck.md`](../../docs/reviews/templates/review-spotcheck.md) (5 dimensions, 25–35 min) | Author OR peer | `Pass` or `Pass with follow-ups` |
| **`alpha → beta` promotion** of any component | [`docs/reviews/templates/review-checklist.md`](../../docs/reviews/templates/review-checklist.md) (16 dimensions, 90–120 min) + [`review-report.md`](../../docs/reviews/templates/review-report.md) | Peer (preferred) or AI-assisted | `Pass` or `Pass with follow-ups` |
| **Public-API-touching minor bump** (e.g., F-cross-12-style migration; v0.x → v0.x+1 breaking) | Spot-check sufficient if narrow scope; full checklist if broad | Author OR peer | `Pass` or `Pass with follow-ups` |
| **Patch bump** (`v0.1.x → v0.1.y` non-breaking, no public-API touch) | NOT required | — | (n/a — patch bumps don't trigger this rule) |

Existing components reviewed during the 2026-05 sweep (see [`docs/reviews/sweep-tracker.md`](../../docs/reviews/sweep-tracker.md)) are **grandfathered** — they don't need a re-review unless they trip one of the triggers above.

## What "close" means

A component is **closed** (= ready to ship) when ALL of these hold:

1. Procomp doc trio (description / plan / guide) complete and current.
2. tsc clean, lint clean, `validate-meta-deps` 36/36 clean.
3. `pnpm build` succeeds (or whatever the current full-build command is).
4. Component renders correctly at `/components/<slug>` in dev mode.
5. **Review file authored at `docs/procomps/<slug>-procomp/reviews/<YYYY-MM-DD>-v<version>-<scope>.md`.**
6. **Review verdict is `Pass` or `Pass with follow-ups`.**
7. Each `Pass with follow-ups` finding has an explicit owner + bump target (which version it lands in).
8. STATUS.md row reflects the actual state. Decision file authored if the review surfaced anything non-obvious.

A component with verdict `Needs revision` or `Block` is **NOT closed**. Fix the findings, update the review file (or author a new one with a fresh date), then re-evaluate.

## Where the review fits in the workflow

The review slots between the existing "implement + ship to docs site" steps and the final "push to master" step. Updated workflow checklist (also enforced in [`.claude/CLAUDE.md`](../CLAUDE.md) and [`docs/component-guide.md`](../../docs/component-guide.md)):

```
[ ]  0. (Migration intake) — only if porting from another app
[ ]  1. Procomp description.md — sign-off              ←── GATE 1 (existing)
[ ]  2. Procomp plan.md — sign-off                     ←── GATE 2 (existing)
[ ]  3. pnpm new:component <category>/<slug>
[ ]  4. Implement + populate meta.ts + demo + usage
[ ]  5. Add to manifest.ts (docs site visibility)
[ ]  6. Verify docs render at /components and /components/<slug>
[ ]  7. Add to registry.json (base + fixtures items)
[ ]  8. pnpm registry:build (local artifact verification)
[ ]  9. Author procomp guide.md (consumer-facing)
[ ] 10. **Run review per this rule. Author review file.**  ←── GATE 3 (new)
[ ] 11. **Verdict ≥ "Pass with follow-ups" — else loop back to 4 with findings.**
[ ] 12. Update .claude/STATUS.md + author decision file if non-trivial
[ ] 13. Commit + push to master (Vercel auto-deploys)
```

Steps 10–11 are the new gate. Steps 1, 2, and 11 are the three blocking gates in the workflow.

## What a v0.1.0 spot-check review covers (the bar)

Use [`review-spotcheck.md`](../../docs/reviews/templates/review-spotcheck.md). It hits a **fixed core of 4 dimensions** plus **1 rotating dimension** chosen for the specific component's risk profile.

### Fixed core
1. **Procomp planning docs** — description / plan / guide present, accurate, in sync with code.
2. **Registry distribution** — live endpoint resolves; targets follow the locked convention; no `demo.tsx` / `usage.tsx` / `meta.ts` shipped.
3. **Meta + manifest sync** — version + status accurate; STATUS.md row honest.
4. **Verification** — tsc + lint + build clean; **F-cross-11 path-b consumer-tsc smoke run for the new slug**.

### Rotating dimension (pick one)
- Public API (slot/callback shapes; F-cross-12 lessons applied)
- Component code internals
- Design system
- Performance
- Accessibility
- Robustness (edge cases, soft-failure)
- Copy / i18n
- Testability

Pick the dimension most likely to surface real signal for THIS component. Document why the rotating dim was chosen (1 sentence).

## What the review file should contain (minimum)

The spot-check template covers the structure. Beyond the boilerplate, ensure:

- **Header** — slug, version, reviewer, date, git SHA, scope, trigger, verdict.
- **Findings** — `F-NN` numbered, severity-ordered (🚫 Blocker → ⚠️ High → 🔸 Medium → 🔹 Low). Each with location (file:line), description, evidence, suggested fix.
- **Verdict** — explicit; one of `Pass` / `Pass with follow-ups` / `Needs revision` / `Block`.
- **Follow-ups (if `Pass with follow-ups`)** — each finding gets an owner + a bump target (e.g., "fix in v0.1.1" / "fix in v0.2.0").

If a `Pass with follow-ups` review surfaces a finding that turns out to be cross-cutting (affects multiple components), promote it to an `F-cross-NN` entry in [`docs/reviews/sweep-tracker.md`](../../docs/reviews/sweep-tracker.md). The sweep is over, but the tracker remains the canonical home for cross-cutting findings.

## Severity & verdict ladders (frozen)

These are FIXED — don't invent new ones.

**Severity:** 🚫 Blocker / ⚠️ High / 🔸 Medium / 🔹 Low.
**Verdict:** Pass / Pass with follow-ups / Needs revision / Block.

See [`docs/reviews/review-process.md` §"Verdict"](../../docs/reviews/review-process.md) for what each verdict means and when to use it.

## Self-review vs peer review

- **Self-review IS allowed** for v0.1.0 spot-checks and patch-level reviews.
- **Peer review is strongly preferred** for `alpha → beta` promotions and breaking minor bumps. If no peer is available, run an AI-assisted review pass (e.g., spawn a `code-reviewer` agent or run a structured prompt over the diff) AND author the review file with the AI's findings tagged as such.
- **Don't rubber-stamp.** The "Re-validation pass catches real issues" memory applies: even self-reviews consistently surface 1–3 substantive findings per Stage 1 description and 3–5 per Stage 2 plan. Same dynamic for component reviews.

## What this rule explicitly does NOT do

- **Doesn't replace the procomp planning gates** (description + plan sign-off). Those are GATE 1 and GATE 2; the review is GATE 3.
- **Doesn't require automated testing.** Vitest is an informed-defer (per STATUS.md). The review is procedural rigor, not test coverage.
- **Doesn't add per-feature review burden.** A single spot-check covers a whole new component's first ship; subsequent patch bumps don't trigger.
- **Doesn't gate iteration during build.** Author can iterate freely between steps 3–9. The review only triggers at step 10, when the author thinks they're done.

## Cross-references

- Workflow integration: [`.claude/CLAUDE.md`](../CLAUDE.md) workflow section (steps 10–11)
- Workflow integration: [`docs/component-guide.md`](../../docs/component-guide.md) numbered workflow + §13 verification checklist
- Templates: [`docs/reviews/templates/`](../../docs/reviews/templates/)
- Process docs: [`docs/reviews/review-process.md`](../../docs/reviews/review-process.md), [`docs/reviews/review-guide.md`](../../docs/reviews/review-guide.md)
- Sweep precedent: [`docs/reviews/sweep-tracker.md`](../../docs/reviews/sweep-tracker.md), [`docs/reviews/2026-05-09-sweep-rollup.md`](../../docs/reviews/2026-05-09-sweep-rollup.md)

---

**Established:** 2026-05-09 (post-Phase-7, before stat-card v0.1.0).
**Authority:** This rule is binding for all components added after this date. Existing components are grandfathered (sweep-reviewed).
