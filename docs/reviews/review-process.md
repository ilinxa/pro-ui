# Review process

How to actually run a senior-grade review, end to end. This doc is the **flow**; [`review-guide.md`](review-guide.md) is the **content** (what to look for); the two templates are the **deliverable**.

## 0. Before you start

Confirm the review is warranted. See the trigger table in [`README.md`](README.md). Don't review a component for the sake of reviewing — only when the trigger is real.

A **full review** of a feature-rich procomponent (like `kanban-board-01` or `flow-canvas-01`) takes a focused engineer ~90–120 minutes end-to-end. Block the time; don't squeeze it between other tasks.

## 1. Prep (5–10 min)

- [ ] **Pick the version under review.** Note the current `meta.ts` version + the git SHA. The review is a snapshot of *that state*.
- [ ] **Read the description.md** in `docs/procomps/<slug>-procomp/`. Form your mental model **before** reading code.
- [ ] **Read the plan.md** appendix of decisions made during planning. Many findings will be "the plan said X but the code does Y" — you can't see that without reading the plan.
- [ ] **Read the guide.md.** This is the consumer's contract. Inconsistencies between guide and reality are first-class findings.
- [ ] **Open the docs site at `/components/<slug>`** in both light and dark mode. First impressions matter — note them now before code-reading biases you.
- [ ] **Copy the templates** into the procomp's reviews folder:

  ```bash
  mkdir -p docs/procomps/<slug>-procomp/reviews
  cp docs/reviews/templates/review-checklist.md docs/procomps/<slug>-procomp/reviews/<YYYY-MM-DD>-v<version>-checklist.md
  cp docs/reviews/templates/review-report.md    docs/procomps/<slug>-procomp/reviews/<YYYY-MM-DD>-v<version>-review.md
  ```

  Replace `<YYYY-MM-DD>`, `<slug>`, and `<version>` literally. Two files: a working checklist (tickable, scratch-pad) and a final report (narrative deliverable).

## 2. The eight-step review order

This sequence catches the most issues fastest. **Follow it in order** — early steps build the mental model later steps need.

1. **Description sanity check.** Does what the description promises in §5 (archetypes / use cases) actually appear in the demo? If §5 says "five archetypes covered", does the demo prove it? Note any drift.
2. **Read `<slug>.tsx` + `types.ts`.** This is the public API. **90% of "fix later" pain originates here.** Spend real time on this step — half the total review.
3. **Read `demo.tsx`.** Does it exercise every keystone path? Does it show extensibility (custom renderers, custom port types, etc.)? Is the dataset realistic or 3 lorem items?
4. **Skim `parts/` + `hooks/`.** Look for code-cleanness smells — dead code, unused vars, comments explaining WHAT instead of WHY, premature abstraction. Don't read every line; smell-check.
5. **Cross-reference `meta.ts` + `registry.json`.** Same dependencies in both? Status / version honest? `STATUS.md` Components table has a current row?
6. **Run the verification commands** (see §4). All must pass.
7. **Browser-validate** at `/components/<slug>`. Light + dark; narrow + wide. Drag, type, hit-error-paths. This catches what `tsc` cannot.
8. **Re-read `guide.md` last.** With the fresh code-knowledge, can a stranger ship this against your component? Note inconsistencies between guide examples and current API.

## 3. Working through the checklist

Open the checklist file you copied in §1. Tick items as you verify them. **Add notes inline** for anything that fails or smells — these become findings in the report. Use this severity scale:

| Severity | Meaning | Examples |
|---|---|---|
| **🚫 Blocker** | Must be fixed before the version ships / before sign-off | Public API will break consumers; security flaw; data loss path; broken build |
| **⚠️ High** | Should be fixed before the version ships; warrants a follow-up bump | Accessibility regression; missing keyboard path; design-token violation; broken edge case in demo |
| **🔸 Medium** | Should be fixed in the next normal-cadence revision | Code-cleanness smell; over-eager `useMemo`; missing empty-state copy; documentation drift |
| **🔹 Low** | Nice-to-have; track but don't gate on | Naming nit; spelling; comment polish; could-be-DRY |

Don't substitute emojis with anything else — these are the canonical markers used across reports.

> **Discipline:** if you find yourself tempted to fix something during the review, *don't*. Note it as a finding, finish the review, then fix afterwards. Mid-review fixes corrupt the snapshot and tempt you to keep "polishing" instead of evaluating.

## 4. Verification commands

Run these from repo root. **All must pass** (or pre-existing warnings noted):

```bash
pnpm tsc --noEmit                               # Type-check, project-wide
pnpm lint                                       # ESLint
pnpm build                                      # Production build (catches what tsc + lint miss)
pnpm registry:build                             # Regenerate public/r/*.json artifacts
```

For a **full review**, also smoke-test consumer install:

```bash
# In a separate tmp app:
pnpm dlx shadcn@latest add @ilinxa/<slug>
# Verify files land at the locked target paths and the component renders.
```

For components with high-N rendering (`flow-canvas-01`, `data-table`, `kanban-board-01`), exercise the **stress demo** in the browser and watch for jank.

## 5. Writing the report

Open the report file you copied. Fill it in narratively, working from your checklist annotations. Sections (mirrored in the template):

1. **Header** — component, version, reviewer, date, git SHA, scope (full / targeted / spot-check)
2. **Executive summary** — 3–5 sentences. The verdict, the single most important finding, the recommended next step. A reader should grasp the state from this alone.
3. **Strengths** — what's working well; lock these in for future components. Skipping this section is bad-faith reviewing.
4. **Findings** — grouped by severity (Blocker → High → Medium → Low). Each finding has: location (file + line), severity, description, evidence, suggested fix.
5. **Verdict** — one of: `Pass` / `Pass with follow-ups` / `Needs revision` / `Block`. See §7.
6. **Follow-up actions** — concrete tasks that emerge from findings, with owner + target version.

**Keep findings concrete.** "API surface feels closed" is not a finding. "`KanbanColumn` accepts no `header` slot — consumer cannot customize the title strip without forking; suggest adding `headerSlot?: ReactNode`" is a finding.

## 6. Findings: format

Within the report's **Findings** section, each entry follows the same shape. Copy this structure:

```markdown
### F-01 — <short title>

- **Severity:** 🚫 Blocker | ⚠️ High | 🔸 Medium | 🔹 Low
- **Dimension:** <one of the 14 from review-guide.md>
- **Location:** `src/registry/components/<category>/<slug>/<file>.tsx:<line>`
- **Observed:** <what you found>
- **Why it matters:** <consumer impact / future-proofness / a11y / etc.>
- **Suggested fix:** <concrete, actionable>
```

Numbering (`F-01`, `F-02`…) is contiguous across all severities, ordered by severity descending then by location. This makes follow-up tracking easy ("F-03 is fixed, F-07 deferred to v0.3").

## 7. Verdicts

| Verdict | Meaning | When to use |
|---|---|---|
| **Pass** | Ship it. Zero blockers, no high-severity issues, low/medium are normal cadence. | Mature components; targeted reviews where the touched area is clean. |
| **Pass with follow-ups** | Ship it, but with named follow-ups owned + scheduled. | Most full reviews land here. Some high-severity findings deferred to next version with explicit owner + bump target. |
| **Needs revision** | Fix the listed blockers + key high-severity items, then re-spot-check the affected dimensions. | Early-life or regression-prone components. |
| **Block** | Do not ship at this version. Significant rework required. | Rare. Reserved for genuine ship-blockers — broken build, public API that will break consumers, security flaw. |

## 8. Sign-off

A review is **complete** when:

- [ ] Both files (checklist + report) live in `docs/procomps/<slug>-procomp/reviews/`.
- [ ] Verdict is set in the report header.
- [ ] Follow-up actions list is concrete (owner + target version per item, or "no follow-ups required").
- [ ] If the verdict is `Needs revision` or `Block`, the next steps are recorded in [`.claude/STATUS.md`](../../.claude/STATUS.md) under "Open decisions / TODOs".
- [ ] The Recent-decisions log in `STATUS.md` gains a one-line entry referencing the review file.

## 9. Re-reviews

When a component bumps after a `Needs revision` verdict, **re-run only the dimensions implicated by the original blockers + high-severity findings** plus a quick verification pass. File the re-review as a new dated report in the same folder; do not edit the original.

When a component bumps for a **major feature** (v0.1 → v0.2 etc.), run a full review even if the prior verdict was `Pass` — feature additions create new failure modes.

## 10. Anti-patterns

Things to **not** do during a review:

- **Don't fix as you find.** Note → finish → fix afterwards. Mid-review fixing corrupts the snapshot.
- **Don't review components you authored solo.** Authors miss what authors miss. Pair-review or hand off.
- **Don't merge "found nothing" reports.** If you found nothing, you weren't looking hard enough — go back to step 2 and read the public API again.
- **Don't ship a Pass verdict with stale browser-validation.** "Looks fine, didn't open the browser" is not a Pass.
- **Don't skip strengths.** Recording what works is how the library converges on patterns.
- **Don't review across multiple components in one report.** One report per component per version. Use a separate cross-component coherence sweep when needed.
