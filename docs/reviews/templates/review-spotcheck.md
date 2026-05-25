# Spot-check — `<slug>` v<version>

> **How to use:** Copy this file to `docs/procomps/<slug>-procomp/reviews/<YYYY-MM-DD>-v<version>-spotcheck.md`. **Hard time-box: 25–35 minutes** per component. This is the Tier 2 deliverable — compact, fixed scope, repeatable. For the full 14-dimension review, use the `review-checklist.md` + `review-report.md` template pair instead.

---

## Header

| Field | Value |
|---|---|
| **Component** | `<slug>` |
| **Category** | `<data | feedback | forms | layout | marketing | media>` |
| **Version under review** | `<version>` |
| **Status at review time** | `<alpha | beta | stable>` |
| **Reviewer** | `<name>` |
| **Date** | `<YYYY-MM-DD>` |
| **Git SHA** | `<short SHA>` |
| **Scope** | `spot-check` |
| **Trigger** | `<sweep-tier-2 | drift-check | patch-bump | bug-report>` |
| **Verdict** | `<Pass | Pass with follow-ups | Needs revision | Block>` |

---

## Dimensions covered

A spot-check covers a **fixed core of 4 dimensions** plus **1 rotating dimension** chosen per component. The rotating dimension is the one most likely to surface real signal for *this specific component* (e.g. perf for high-N renderers, a11y for forms, design system for visually distinctive components, copy for content-heavy components, etc.).

### Fixed core (always covered)

| Dim | Name | Verified? | Notes |
|-----|------|-----------|-------|
| 1 | Procomp planning docs | `<yes / no>` | description / plan / guide present + accurate? |
| 9 | Registry distribution | `<yes / no>` | live endpoint resolves; targets locked-convention; no docs files in registry artifact |
| 10 | Meta + manifest sync | `<yes / no>` | version + status + STATUS.md row honest |
| 12 | Verification | `<yes / no>` | tsc + lint + `validate:meta-deps` clean; `pnpm build` succeeds. **For v0.1.0 first ships:** smoke harness pass (F-cross-11 path b) — `pnpm dlx shadcn add @ilinxa/<slug>` succeeds AND consumer-side `pnpm tsc --noEmit` clean post-install. See [.claude/rules/readiness-review.md](../../../.claude/rules/readiness-review.md). |

### Rotating dimension

> Pick the **single dimension** most relevant to this component's risk profile. State why.

- **Chosen:** `<dim # — name>`
- **Why:** `<one-line justification — what makes this dimension load-bearing for this component>`
- **Verified?** `<yes / no>`
- **Notes:** `<observations>`

---

## Smoke result

Copy the row for this slug from the latest smoke run at `e:/tmp/ilinxa-smoke-consumer/results/<DATE>-smoke.md`. The harness extension landed in F-cross-11 path b adds a consumer-side `pnpm tsc --noEmit` pass after install — both columns matter for v0.1.0 first ships.

| Slug | Install | TSC | Time (ms) | Notes |
|------|---------|-----|-----------|-------|
| `<slug>` | `<pass | fail | expected-fail>` | `<pass | fail | —>` | `<ms>` | `<notes>` |

If `Install` passes but `TSC` fails, that's exactly the F-cross-11 brittleness signal the harness is now designed to surface — investigate the implicated file paths in the smoke report's "tsc errors" excerpt before declaring `Pass`.

---

## Findings (max 5)

Severity legend: 🚫 Blocker · ⚠️ High · 🔸 Medium · 🔹 Low. Same `F-NN` format as full reviews. **Hard cap: 5 findings.** If more than 5 surface, the component should be promoted to a full Tier 1 review — record that as the verdict ("Needs revision — promote to Tier 1") and stop.

> If none, write: `None — clean spot-check.`

#### F-01 — `<short title>`

- **Severity:** `<🚫 | ⚠️ | 🔸 | 🔹>`
- **Dimension:** `<one of the 5 covered>`
- **Location:** `src/registry/components/<category>/<slug>/<file>:<line>`
- **Observed:** `<what you found>`
- **Suggested fix:** `<concrete, actionable>`

#### F-02 — `<short title>`

- **Severity:** `<…>`
- **Dimension:** `<…>`
- **Location:** `<…>`
- **Observed:** `<…>`
- **Suggested fix:** `<…>`

<!-- Repeat for F-03, F-04, F-05 if needed. Drop unused finding blocks. -->

---

## Verdict

**Verdict:** `<Pass | Pass with follow-ups | Needs revision | Block>`

**Justification (1–2 sentences):**

`<…>`

> If verdict is **Needs revision** with > 5 findings, promote to Tier 1 in the next session and link the full review here once written.

---

## Follow-up actions

| Action | Linked finding | Owner | Target version | Status |
|---|---|---|---|---|
| `<…>` | `F-NN` | `<name>` | `v<x.y.z>` | Open |

> If verdict is **Needs revision** or **Block**, mirror the open actions into `.claude/STATUS.md` "Open decisions / TODOs".

---

## Sign-off

- [ ] Verdict is set above
- [ ] Smoke row copied from latest run
- [ ] Tracker row updated at `docs/reviews/sweep-tracker.md`
- [ ] If Needs-revision/Block, mirrored in STATUS.md

**Reviewer signature:** `<name>` — `<YYYY-MM-DD>`
