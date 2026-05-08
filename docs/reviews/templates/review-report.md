# Review report — `<slug>` v<version>

> **How to use:** Copy this file to `docs/procomps/<slug>-procomp/reviews/<YYYY-MM-DD>-v<version>-review.md`. Fill it in narratively after working through the checklist. The checklist captures *did I check it*; this report captures *what I found and what to do about it*.

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
| **Scope** | `<full | targeted | spot-check>` |
| **Trigger** | `<pre-beta-gate | major-feature-bump | pre-public | patch | drift-check | bug-report>` |
| **Companion checklist** | [`<YYYY-MM-DD>-v<version>-checklist.md`](./<YYYY-MM-DD>-v<version>-checklist.md) |
| **Verdict** | `<Pass | Pass with follow-ups | Needs revision | Block>` |

---

## 1. Executive summary

<!--
Three to five sentences. The verdict, the single most important finding, the recommended next step.
A reader should grasp the state from this section alone.
-->

`<TL;DR goes here.>`

**Headline finding:** `<the one thing>`

**Recommended next step:** `<concrete, actionable, named owner>`

---

## 2. Strengths

<!--
What's working well. Lock these in for future components — explicit strengths drive pattern reuse across the library.
Skipping this section is bad-faith reviewing.
-->

- `<strength 1 — be specific; cite a file/line/concept>`
- `<strength 2>`
- `<strength 3>`

---

## 3. Findings

<!--
Numbered F-01, F-02, … — contiguous across all severities, ordered severity-desc → location-asc.
Use the format below for each finding. Group sub-headers by severity for skim-ability.
-->

### Severity legend

- 🚫 **Blocker** — must be fixed before this version ships / before sign-off
- ⚠️ **High** — should be fixed before ship; warrants a follow-up bump
- 🔸 **Medium** — should be fixed in the next normal-cadence revision
- 🔹 **Low** — nice-to-have; track but don't gate on

### 3.1 Blockers (🚫)

> If none, write: `None.`

#### F-01 — `<short title>`

- **Severity:** 🚫 Blocker
- **Dimension:** `<one of the 14 dimensions from review-guide.md>`
- **Location:** `src/registry/components/<category>/<slug>/<file>.tsx:<line>`
- **Observed:** `<what you found, factually>`
- **Why it matters:** `<consumer impact / future-proofness / a11y / etc.>`
- **Suggested fix:** `<concrete, actionable>`

### 3.2 High (⚠️)

> If none, write: `None.`

#### F-02 — `<short title>`

- **Severity:** ⚠️ High
- **Dimension:** `<…>`
- **Location:** `<…>`
- **Observed:** `<…>`
- **Why it matters:** `<…>`
- **Suggested fix:** `<…>`

### 3.3 Medium (🔸)

> If none, write: `None.`

#### F-03 — `<short title>`

- **Severity:** 🔸 Medium
- **Dimension:** `<…>`
- **Location:** `<…>`
- **Observed:** `<…>`
- **Why it matters:** `<…>`
- **Suggested fix:** `<…>`

### 3.4 Low (🔹)

> If none, write: `None.`

#### F-04 — `<short title>`

- **Severity:** 🔹 Low
- **Dimension:** `<…>`
- **Location:** `<…>`
- **Observed:** `<…>`
- **Why it matters:** `<…>`
- **Suggested fix:** `<…>`

---

## 4. Verification results

<!--
The boring-but-load-bearing ground truth. Paste actual output excerpts where relevant.
-->

| Command | Result | Notes |
|---|---|---|
| `pnpm tsc --noEmit` | `<pass | fail>` | `<n warnings; pre-existing or new>` |
| `pnpm lint` | `<pass | fail>` | `<…>` |
| `pnpm build` | `<pass | fail>` | `<bundle size, build time>` |
| `pnpm registry:build` | `<pass | fail>` | `<artifact regenerated cleanly>` |
| Browser validation (light) | `<pass | fail>` | `<paths exercised>` |
| Browser validation (dark) | `<pass | fail>` | `<paths exercised>` |
| Smoke install (full reviews) | `<pass | fail | n/a>` | `<consumer outcome>` |

**Pre-existing warnings carried over:**

```
<paste verbatim, or write "none">
```

---

## 5. Verdict

**Verdict:** `<Pass | Pass with follow-ups | Needs revision | Block>`

**Justification:**

<!--
Two to four sentences. Why this verdict given the findings above.
For "Pass with follow-ups", name the items being deferred and to which version.
For "Needs revision" / "Block", name the items that must change before re-review.
-->

`<…>`

---

## 6. Follow-up actions

<!--
Concrete tasks emerging from findings. Each task gets an owner + target version.
Findings already in the report don't need to be repeated word-for-word — link by F-NN.
-->

| Action | Linked finding | Owner | Target version | Status |
|---|---|---|---|---|
| `<action 1>` | `F-01` | `<name>` | `v<x.y.z>` | Open |
| `<action 2>` | `F-02` | `<name>` | `v<x.y.z>` | Open |

> If verdict is **Needs revision** or **Block**, mirror the open actions into [`.claude/STATUS.md`](../../../../.claude/STATUS.md) under "Open decisions / TODOs".

---

## 7. Cross-component observations (optional)

<!--
Things you noticed that aren't about THIS component but that emerged while reviewing it.
Patterns worth promoting, anti-patterns worth flagging library-wide, naming inconsistencies, etc.
Keep this short — full library-wide audits are their own review.
-->

- `<observation 1>`
- `<observation 2>`

---

## 8. Reviewer reflection (optional)

<!--
What was hard to evaluate? What dimensions does the current process under-cover?
Feed this back into review-process.md / review-guide.md if a real gap surfaced.
-->

`<…>`

---

## Sign-off

- [ ] Verdict is set above
- [ ] Follow-up actions table is concrete (or "no follow-ups required")
- [ ] If verdict is `Needs revision` or `Block`, items mirrored in `.claude/STATUS.md`
- [ ] Recent-decisions log in `STATUS.md` has a one-line entry pointing to this review
- [ ] Companion checklist file is committed alongside this report

**Reviewer signature:** `<name>` — `<YYYY-MM-DD>`
