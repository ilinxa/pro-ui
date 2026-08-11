# Readiness review — P3 feature-slicing (phase-level, GATE 3)

- **Date:** 2026-08-11 · **Scope:** the P3 arc — feature-item convention + validators + 2 pilots
  (`event-calendar`→`0.4.0` + `event-calendar-editing`, `media-editor`→`0.3.0` +
  `media-editor-capture`) + consumer lockstep (`story-composer` 0.4.0, `content-composer` 0.3.1) +
  `gamification-kit` extraction (6× team 0.2.1) + `validate:artifact-size` + structure audits.
- **Review type:** AI-assisted adversarial (3 independent fresh-context finders → architect
  refute-checks → verdicts), per the readiness-loop R4 protocol. Public-API-touching minors on 10
  components → full-checklist depth.
- **State machine + full evidence:** [`docs/plans/p3-feature-slicing-plan.md`](../plans/p3-feature-slicing-plan.md)
  (spike table, invariants, R4 findings table with per-finding verdicts, R5 runtime evidence).
  Convention: [`docs/feature-slicing-convention.md`](../feature-slicing-convention.md). ADR:
  [`.claude/decisions/2026-08-11-p3-feature-slicing-convention.md`](../../.claude/decisions/2026-08-11-p3-feature-slicing-convention.md).

## Findings summary (R4 + R5)

| Source | Count | Disposition |
|---|---|---|
| Adversarial finders (3, fresh context) | 14 | 13 CONFIRMED+fixed+re-gated · 1 CONFIRMED follow-up w/ owner (MED-4) · stash-corruption hypothesis REFUTED both pilots |
| R5 e2e (real installs, both backends) | 3 registry-data bugs | fixed pre-ship: missing `slider` regDep (→ new catalog-wide primitive-scan validator, found exactly 2 gaps) · 27 pinned `new-york/*` style-URL regDeps de-pinned (one proven to clobber a consumer primitive — retires the known F-cross-13 pinned-URL carrier class) · editing item `button` |
| Gate battery en route | 4 | deps schema shape, 2 undeclared npm deps (caught by new validator), doc-drift 5th-script gap |

Highest-severity confirmed: (1) base→own-features imports had ZERO validator enforcement — now a
dedicated HIGH check; (2) media-editor base-alone install failed consumer tsc (missing primitives)
— now impossible to reintroduce silently.

## Close conditions (rule: readiness-review.md)

1. **Planning trios current** ✅ — both pilot procomp folders updated with dated addenda correcting
   split-falsified claims (agent report 2026-08-11); convention doc + guide §11.5 sub-block + skill
   §16 + CLAUDE.md integrated within budget (11.9/12.0KB).
2. **Gates** ✅ — tsc 0 · lint 0 err/9 pre-existing warn · full `registry:build` chain exit 0
   (63 base + 2 feature + 52 aliases; artifact-size 65/65) · `pnpm build` exit 0 (103s). Consumer
   smoke: install matrix green BOTH backends (Base-UI base-nova + Radix new-york), consumer tsc 0
   in five fresh consumers incl. feature-alone + upgrade paths.
3. **Review file** ✅ — this file.
4. **Verdict ≥ Pass with follow-ups; every follow-up owner'd** ✅ — see below.
5. **Constituent gates** n/a (no pages/panels).
6. **STATUS honest + decision files** — landing with the R7 close-out commit.

## Verdict: **Pass with follow-ups**

Follow-ups (owner + target):
- **MED-4 + audit sibling** — content-composer statically wires the capture extension regardless
  of config (media-substrate.tsx) AND `lib/substrates.tsx` eagerly imports all four substrate
  mounts (news-only configs still bundle CarouselComposer + `@dnd-kit`; post-refactor audit ⚠️).
  Same root (config-driven capability not import-gated) → ONE pass, owner: content-composer
  **v0.4.0** (fix-on-touch).
- **Size-bar deviations, accepted-with-note:** calendar base 137.3KB vs revised ≤135 bar (+1.7%),
  media base 282KB vs ≤275 (+2.5%) — JSON-wrap overhead unmodeled in the estimates; substantive
  criteria met (calendar −33% + `@dnd-kit` shed; media capture sliced + intake-to-base + konva
  lazy). Budgets now enforce at 160/110/290/65 — owner: `validate:artifact-size` (mechanical).
- **Structure-audit findings** (8 pre-refactor one-pagers + 3 post-refactor) — fix-on-touch owners
  recorded per file in [`structure-audits/`](structure-audits/).
- **F-cross-15 filed** (static-import-instead-of-lazy for heavy/optional code, 5 of 8 audited) —
  [`sweep-tracker.md`](sweep-tracker.md); policy fix-on-touch, slice candidates noted.
- **Non-interactive upgrade phantom no-op** (CLI behavior, shared with fixtures) — documented in
  the convention doc + skill; owner: re-test on CLI majors at the P4.2 smoke variants.
- **Doc-follow-up:** task-family clipboard docs gap (audit cross-pattern #2) — owner: task-tree /
  gantt-timeline next patch touch.

**GATE 3 CLOSED** — pending only the R7 close-out commit + push (history verification per the
readiness loop §Commit points).
