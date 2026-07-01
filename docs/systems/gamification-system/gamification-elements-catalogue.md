# Gamification Elements Catalogue

> **Status:** Pre-GATE-1 extraction (component inventory). Feeds the eventual `gamification-system` description → plan → guide gate (see [docs/systems/README.md](../README.md)).
> **Date:** 2026-06-30
> **Purpose:** Enumerate every UI component implied by the thesis "Gamification Design Specification," with each component's functional, interaction, visibility, data, and telemetry requirements traced back to source sections. This is the raw inventory that a future `gamification-system` build pipeline consumes — it is **not** itself a signed-off system description.

---

## Provenance

Extracted from the thesis project (`e:\2026\thesis`), not authored here. Canonical sources (read-only; re-extract if revised):

| Source doc | Role |
|---|---|
| `output/for-advisor/PRJ001_Methodology_Appendix_A_Gamification-Design_2026-05-13.md` | **Canonical spec** — the 6 elements, SDT mapping, exclusions, visibility rules, UI/UX notes |
| `app-instruction/V2_UI_UX_Features.md` | Design-ready V2 (gamified) feature set; restates Appendix A §4–§8 for engineering |
| `app-instruction/V1_UI_UX_Features.md` | Plain baseline (control); defines the shared core the gamification layer sits on |
| `app-instruction/App_Data_Capture.md` | Data shape + telemetry events each component must emit |
| `plans/PLN-0010_P3_Gamification-Design-Spec.md` | Source planning spec with decision-log provenance (LOG-0003…LOG-0040) |

Section references below (e.g. "§4.1 E1", "§7.5") are to **Appendix A** unless noted.

---

## Experimental framing (why the constraints are non-negotiable)

These components are the **V2 (gamified) treatment** in a 2-arm between-subjects game-jam study. V1 (control) is the same app with the gamification layer removed. Any visible difference between V1 and V2 *outside* the gamification zone confounds the independent variable — so the constraints below are research requirements, not preferences.

- **V2-only, package-isolated.** Gamification ships as a separate package layered on a shared-core library; the core kanban is byte-identical between V1 and V2 (§7.7).
- **Team-scoped always.** Never inter-team, never public, never per-individual (§6).
- **SDT-grounded.** Every element maps to a Self-Determination Theory basic psychological need (autonomy / competence / relatedness); the mapping is non-negotiable (V2 §3).
- **Cooperative-only.** No competitive mechanics; the exclusion list in [§ Do NOT build](#hard-guardrails--do-not-build) is a hard constraint (V2 §5).

---

## Global constraints (apply to every component)

| Constraint | Rule | Source |
|---|---|---|
| Team-scoped | Each component shows only **this team's** state — no comparison number, no other team's data | §6 |
| No public surface | Nothing renders on a public or inter-team surface | §6, §7.6 |
| Never forced | No mandatory mechanics; opt-in / skippable wherever a choice exists | §5, §7.2, §7.3, §7.4 |
| Non-blocking animation | Feedback animations are **brief (< 1 s), skippable, no modal blocking** | §7.1 |
| About the team | Feedback and rewards are about the team, not individuals | §6, §4.1 E6 |
| Package isolation | All components live in the gamification package, absent from V1's manifest | §7.7 |

---

## Component catalogue

### C0 — Gamification zone / panel *(cross-cutting shell)*
- The visually distinct board region that hosts every gamification element. V1 and V2 differ **only** here (§6).
- **Requirement:** cleanly separable so the same core kanban renders with or without it (package isolation, §7.7).

---

### E1 — Team Progress Bar · *Competence*
**C1 — Team Progress Bar**
- One bar per team board showing **% of planned milestones completed** (§4.1 E1).
- **Always visible on the team-board header**; no hidden or locked states (§7.5).
- Shows **only this team's own %** — no comparison number, no other team's bar (§6).
- **Data:** completed vs. total planned milestones → a single 0–100% value.
- **Telemetry:** "progress-bar checked" feature-view event (Data-Capture §2.2 metric 3).
- **Evidence basis:** Sailer et al. (2017) — performance graphs elevated competence.

---

### E2 — Team Milestone Badges · *Competence + Relatedness*
**C2 — Milestone Badge (token)**
- A single badge awarded at a team milestone (e.g., "First playable build") (§4.1 E2).
- **Belongs to the team, not individuals** (§6).
- Appears with a subtle animation when awarded (overlaps E6 / §4.1 E6).
- **Data:** badge ID (`BD-XXXX`), label, awarded timestamp.

**C3 — Team Trophy Shelf (container)**
- Gallery of earned badges, displayed on the team's board only — **never a public or inter-team surface** (§7.6).
- Holds C2 tokens; natural compound (`Root` shelf + badge parts) per the library's compound rule.
- **Telemetry:** "badges viewed" feature-view event (Data-Capture §2.2 metric 3).
- **Evidence basis:** Sailer et al. (2017) — badges elevated competence; Ch 2 §2.4 cooperative-design supports relatedness.

---

### E3 — Cooperative Team Challenges · *Relatedness*
**C4 — Cooperative Challenge Card/Panel**
- Optional challenge with a **shared team goal** (e.g., "All 5 members commit a task this morning"); completion rewards the **whole team equally** (§4.1 E3).
- Shows the challenge, progress toward it, and the team reward on completion.

**C5 — Challenge opt-in control** *(part of C4)*
- Challenges are **opt-in at the team level**; refusing has **no penalty** (§7.3).
- **Telemetry:** "challenge opened" feature-view event (Data-Capture §2.2 metric 3).
- **Evidence basis:** Dindar et al. (2021), partial η² = .10 for cooperation effect on relatedness.

---

### E4 — Task Choice / Volunteering · *Autonomy*
**C6 — Task "Open for anyone" / Volunteer affordance** *(augments the shared-core task card — not a standalone surface)*
- Members can mark a task **"open for anyone"** or **self-assign** without external direction (§4.1 E4).
- **Choice always available, never forced**; reassignment does **not penalize** the previous assignee (§7.4).
- **Data:** per-task `open-for-anyone` flag + claim/volunteer action.
- **Telemetry:** "choice-interaction" feature event (Data-Capture §2.2 metric 3).
- **Evidence basis:** Sailer et al. (2017) meaningful choice; Ryan & Deci (2000) autonomy as volition.

---

### E5 — Team Narrative Framing · *Autonomy + Relatedness*
**C7 — Quest-name prompt / editor**
- Team picks a short **"quest name"** for its journey (§4.1 E5).
- **Optional and skippable**; an empty name **defaults to the team's literal name** (§7.2).

**C8 — Narrative chapter timeline**
- Milestone beats framed as **chapters**; **team-scoped** (no inter-team comparison) (§4.1 E5, §6).
- **Telemetry:** "narrative chapter viewed" feature-view event (Data-Capture §2.2 metric 3).
- **Evidence basis:** Sailer et al. (2017) meaningful story as task meaningfulness; narrative + cooperative synthesis (Ch 2).

---

### E6 — Engagement & Progression Feedback Loops · *Competence*
**C9 — Feedback / celebration animation layer**
- Real-time UI update when team progress advances (e.g., badge appears) (§4.1 E6).
- **Brief (< 1 s), skippable, non-blocking — no modal blocking** (§7.1).
- Feedback is **about the team, not individuals** (§6).

**C10 — "Next-task" prompt / nudge**
- Closes the engagement loop: task-completion → feedback animation → **next-task prompt** (6D Devise, §4.2).
- Progression loop: milestone → team badge + narrative beat → next milestone.
- **Evidence basis:** Werbach & Hunter (2012) — engagement + progression loops (6D Devise step).

---

## Summary table

| ID | Component | Element | SDT need | Standalone vs. augment | Telemetry event |
|----|-----------|---------|----------|------------------------|-----------------|
| C0 | Gamification zone/panel | shell | — | container | — |
| C1 | Team progress bar | E1 | Competence | standalone (board header) | progress-bar checked |
| C2 | Milestone badge | E2 | Comp + Relat | part of C3 | — |
| C3 | Team trophy shelf | E2 | Comp + Relat | standalone (compound) | badges viewed |
| C4 | Cooperative challenge card | E3 | Relatedness | standalone | challenge opened |
| C5 | Challenge opt-in control | E3 | Relatedness | part of C4 | challenge opened |
| C6 | Task open/volunteer affordance | E4 | Autonomy | augments task card | choice-interaction |
| C7 | Quest-name prompt/editor | E5 | Auto + Relat | standalone | — |
| C8 | Narrative chapter timeline | E5 | Auto + Relat | standalone | narrative chapter viewed |
| C9 | Feedback/celebration layer | E6 | Competence | overlay | — |
| C10 | Next-task prompt/nudge | E6 | Competence | overlay/inline | — |

**6 elements → ~10 discrete UI components + 1 shell.** C2/C5 are parts of C3/C4; C6 augments the existing kanban task card.

**SDT need coverage** (all three targeted): Autonomy = E4 + E5; Competence = E1 + E2 + E6; Relatedness = E2 + E3 + E5 (V2 §3).

---

## Telemetry events (feature-usage, Data-Capture §2.2 metric 3)

Each event emits the locked schema (Data-Capture §2.3): event name, ISO-8601 timestamp w/ timezone, anonymized user ID (`P-XXXX`), team ID (`T-XXX`), entity IDs (e.g. `BD-XXXX`), app variant (`V1`/`V2`).

| Event | Emitted by |
|---|---|
| progress-bar checked | C1 |
| badges viewed | C3 |
| challenge opened | C4 / C5 |
| narrative chapter viewed | C8 |
| choice-interaction | C6 |

---

## Hard guardrails — do NOT build

Excluded by design; would confound the experiment. **Hard constraint, not a guideline** (V2 §5; Appendix A §5):

- ❌ Public / individual **leaderboards** (Li et al. 2024 — 23% public-discomfort anchor)
- ❌ **Inter-team visible ranking** / cross-team score visibility (Papadopoulos et al. 2024)
- ❌ **Mandatory** mechanics — anything forced (Ryan & Deci 2000; Sailer et al. 2017)
- ❌ **Individual-only rewards** or **per-member rankings within a team**
- ❌ Points, public rankings, public failure displays (absent from V1 too, V1 §4)

If a design constraint forces any of the above, **escalate to the researcher before implementing** (V2 §5).

---

## Mapping to existing ilinxa-ui-pro components

Where these may reuse or extend the current library (49+ shipped procomps):

| Catalogue component | Likely relationship |
|---|---|
| C6 task open/volunteer affordance | **Augments** `kanban-board-01` and/or `todo-rich-card` (task-card surfaces already exist) |
| C3 team trophy shelf | New compound (`Root` + badge parts) per [.claude/rules/compound-component-structure.md](../../../.claude/rules/compound-component-structure.md) |
| C1 team progress bar | New procomp; builds on shadcn `progress` primitive |
| C4 cooperative challenge card | New procomp |
| C8 narrative chapter timeline | New procomp; conceptually adjacent to `gantt-timeline-01` / `calendar-01` (date-ordered beats) |
| C9 / C10 feedback layer + nudge | Overlay utilities; check existing reveal/animation tokens in [globals.css](../../../src/app/globals.css) (`reveal-up`) |

---

## Open questions (resolve at GATE 1 of the system description)

1. **System vs. loose procomps.** These share a data model (milestones, badges, team scope) and cross-cutting telemetry — they qualify as a `gamification-system` per [docs/systems/README.md](../README.md). Confirm before scaffolding individual procomps.
2. **Milestone data model.** C1, C2/C3, C8, C10 all depend on a shared "team milestone" concept. The catalogue does not define it; the system description must (what is a milestone, who defines them, completed/total source).
3. **Telemetry contract.** Whether the library components *emit* events (callback props) or the host wires telemetry. Library code must stay portable (no env-specific code) — telemetry is almost certainly a host concern surfaced via callbacks.
4. **C6 ownership.** Decide whether task-choice lands as a new prop on existing kanban/task-card procomps or a separate wrapper.
5. **Build order.** Suggested: C1 (simplest, standalone) → C2/C3 → C9/C10 → C4 → C7/C8 → C6 (touches existing components, highest blast radius).

---

*Last updated: 2026-06-30. Extracted from thesis Methodology Appendix A (FINAL canonical) + V1/V2 UI-UX specs + App Data Capture. Re-extract if Appendix A is revised.*
