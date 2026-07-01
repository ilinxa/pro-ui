# Gamification System — System Description

> **Status:** **GATE 1 signed off 2026-07-01** (Q1–Q5 accepted as proposed; slugs locked, `gamification` category confirmed, host-page + one-procomp-per-element confirmed). Next: the 6 component descriptions, then the Stage 2 system plan.
> **Working title:** `gamification-system` (locked at sign-off; rename only at NPM extraction)
> **Created:** 2026-07-01
> **Owner:** ilinxa team
> **Source / origin:** thesis Gamification Design Specification — see [gamification-elements-catalogue.md](gamification-elements-catalogue.md) for the upstream extraction and provenance.

This document is the integration contract for a multi-component product surface: a **cooperative-only, team-scoped gamification layer**. It composes six pro-components (one per gamification element) into one coherent, opt-in package that a host can adopt à-la-carte or whole.

This is **not** an implementation spec. Each constituent pro-component carries its own procomp description, plan, and guide. This doc fixes what the components must agree on — the shared domain model, the cooperative-only constraints, the telemetry contract, and the composition pattern. Where a sub-doc exists, this document defers to it; where they disagree, **this document wins** (flag it back here so we revise consciously).

---

## 0. How to read this document

- **§1** — intent (why this exists, what "good" means here).
- **§3** — the component inventory; follow links to each procomp folder for depth.
- **§4–§6** — the cross-cutting concerns every constituent component must honor (data model, cooperative-only rules, telemetry).
- **§7** — how the components compose ("one by one" and "all together").
- **§8** — the **Locked Decisions index**; once signed off these propagate to every procomp doc as constraints.
- **§9** — sub-document status tracker.
- **§12** — the only blocking section for sign-off.

---

## 1. Vision

### 1.1 The problem

A team-management app wants an **optional gamification layer** that boosts coordination and motivation without the failure modes of typical gamification (leaderboards, individual rankings, public failure displays). The layer must be:

- **Cooperative-only and team-scoped** — every surface shows *this team's* state; nothing is inter-team, public, or per-individual.
- **Adoptable in pieces** — a host may want only the progress bar, or only the trophy shelf, or the whole pack.
- **A clean separation from the core app** — the same core kanban must render with or without the gamification layer (in the source thesis experiment, this is the difference between the control and treatment app; for the library it is simply good modularity).

These are not six unrelated widgets — they share a **domain model** (teams, milestones, badges) and a **set of hard constraints** (cooperative-only, team-scoped, non-blocking feedback). That shared contract is what makes this a *system* and not a loose folder of components.

### 1.2 Goals

- **Six pro-components, one per gamification element**, each production-ready, efficient, and modular.
- **Usable one by one** — every component works standalone with direct props, zero gamification infrastructure required.
- **Usable all together** — a host page wires them into the full layer; the shared contract guarantees they cohere.
- **No mega-component.** Each component is a shadcn-style compound (headless `Root` + flat à-la-carte parts + logic-free assembly), so a consumer drops parts they don't need and gets a lighter, tree-shaken version — per [.claude/rules/compound-component-structure.md](../../../.claude/rules/compound-component-structure.md).
- **Independent at the registry level.** No component imports another; each `shadcn add` is self-contained. Shared code is *earned*, not assumed (see §8 D-04).
- **Portable.** Registry code stays free of `next/*` and env-specific code; telemetry and persistence are host concerns surfaced via callbacks.

### 1.3 Non-goals

- **No competitive mechanics, ever.** Leaderboards, inter-team ranking, per-member ranking, points, public failure displays are excluded by design (§5.3) — a hard constraint, not a guideline.
- **No shared foundation package up front.** A shared `gamification-kit` is a *deferred* extraction, made only after 2–3 components prove the recurring surface (§8 D-04). Premature abstraction is the bigger risk (graph-system precedent, decision #25).
- **No persistence / backend.** Components are controlled; the host owns data + persistence.
- **No telemetry SDK.** The library defines the event shape; the host wires analytics via a callback (§6).

### 1.4 Why decompose instead of one big component

- **Pay-for-what-you-use.** A host wanting only a progress bar shouldn't pull a narrative timeline or a celebration overlay.
- **Reusability beyond this domain.** A `team-progress-bar` or `team-trophy-shelf` is useful in any team app, not just a gamified one.
- **Independent shipping cadence.** Each component ships through its own procomp gate; the pack accretes without a big-bang release.
- **Cleaner future NPM extraction.** Six focused components travel better than one monolith.

---

## 2. Naming

Working title: **`gamification-system`** (the new registry category is `gamification`).

Component slugs follow the library `<noun>-<variant>-NN` convention. Proposed (confirm at sign-off):

| Element | Slug | Renders |
|---|---|---|
| E1 | `team-progress-bar-01` | team milestone-completion bar |
| E2 | `team-trophy-shelf-01` | earned team badges gallery (+ single badge primitive) |
| E3 | `cooperative-challenge-01` | shared-goal challenge card (+ opt-in control) |
| E4 | `task-choice-control-01` | "open for anyone" / volunteer affordance for a task |
| E5 | `team-quest-log-01` | quest-name editor + milestone-chapter timeline |
| E6 | `team-feedback-loop-01` | milestone celebration overlay + next-task nudge |

> Naming is a sign-off item (§12 Q1). `task-choice-control-01` and `team-feedback-loop-01` are the least-settled; alternatives noted there.

---

## 3. Component inventory

Six pro-components, plus a Tier-host assembled experience that is **not** a registry component.

### 3.1 The six pro-components

Each is independently useful, ships through its own procomp gate, and honors the §4–§6 contracts. Mapping to the source elements and SDT needs (provenance in [gamification-elements-catalogue.md](gamification-elements-catalogue.md)):

| # | Slug | Category | Element / SDT need | Role | Compound shape (rough) |
|---|---|---|---|---|---|
| 1 | `team-progress-bar-01` | gamification | E1 / Competence | % of team milestones complete; always visible; this-team-only | bar + ticks + label parts |
| 2 | `team-trophy-shelf-01` | gamification | E2 / Competence + Relatedness | team-owned badge gallery | `Root` shelf + flat `Badge` primitive + award animation |
| 3 | `cooperative-challenge-01` | gamification | E3 / Relatedness | optional shared-goal challenge; whole-team reward | card + progress + opt-in control parts |
| 4 | `task-choice-control-01` | gamification | E4 / Autonomy | mark task "open for anyone" / self-assign; never forced | open-flag + claim/volunteer + assignee parts |
| 5 | `team-quest-log-01` | gamification | E5 / Autonomy + Relatedness | quest name + milestone beats as chapters; skippable | quest-name editor part + chapter-timeline part |
| 6 | `team-feedback-loop-01` | gamification | E6 / Competence | <1s skippable celebration on progress + next-task nudge | celebration overlay part + nudge part |

Per the compound rule, each ships as `Root` + flat parts + a logic-free `<Name>` assembly with flat exports; single-unit pieces (e.g. a bare progress bar) are exempt where a subset is not reasonable. Tier inventory is locked per-component at each GATE 2.

### 3.2 The assembled experience (NOT in the registry)

"All together" is a **host page** at `src/app/systems/gamification-system/page.tsx` (adds/uses the "Systems" top-nav peer, mirroring graph-system decision #29). It wires the six components into the full gamification zone with example host state. This is the integration demo + the contract's living test — **host code, not a shipped component.** There is no mega "gamification-board" component.

### 3.3 What is intentionally NOT a pro-component

- **The "gamification zone" layout** — the board region that holds the elements. It's a host-layout concern (Tier-host), not a registry component.
- **A shared foundation / provider package** — deferred (§8 D-04). Not built up front.
- **Telemetry transport, persistence adapters, milestone definitions** — host code (§6, §4).

---

## 4. Shared domain model (cross-cutting)

Every constituent component honors this model. **In v1 each component re-declares the slice it needs in its own `types.ts`** — there is no shared import (§8 D-03/D-04). This document is the source of truth; the types below are the contract, not a shipped module.

```ts
// The shared spine. Progress (E1), badges (E2), and chapters (E5)
// all derive from milestones.
interface Milestone {
  id: string;
  label: string;            // e.g. "First playable build"
  done: boolean;
  doneAt?: string;          // ISO 8601 w/ timezone
  order: number;            // sequence in the team journey
}

interface Team {
  id: string;
  name: string;
  questName?: string;       // E5; empty → falls back to `name`
  members: { id: string; displayName: string; avatarUrl?: string }[];
}

interface Badge {
  id: string;               // BD-XXXX
  label: string;
  awardedAt?: string;       // ISO 8601; undefined → not yet earned
  milestoneId?: string;     // the milestone that earned it
}

interface Challenge {
  id: string;
  label: string;            // e.g. "All 5 members commit a task this morning"
  optedIn: boolean;         // team-level opt-in (E3); refusing has no penalty
  progress: { current: number; target: number };
  reward?: string;          // whole-team reward, equal for all
  done: boolean;
}

interface NarrativeChapter {
  id: string;
  title: string;
  milestoneId: string;      // the beat this chapter frames
  order: number;
}

// E4 augments a task; the component is generic over the host's task shape.
interface TaskChoiceState {
  taskId: string;
  openForAnyone: boolean;
  assigneeId?: string;      // undefined → unassigned
}
```

**Milestone is the shared spine (§8 D-09).** The host defines milestones; components consume `done`/total. Progress % = `done.length / total`. Badges and chapters reference `milestoneId`. No component invents its own progress notion.

**Host keeps `Badge.awardedAt` in sync with its milestone.** A badge's "earned" state is driven by `Badge.awardedAt` (the trophy shelf), while progress (E1) and chapters (E5) derive from `Milestone.done`. The host owns both and sets `awardedAt` when the badge's milestone completes — the components do not enforce the linkage.

**E6 trigger shapes are component-local, NOT part of this model.** `team-feedback-loop-01` (E6) is a stateless feedback *renderer*: the host pushes it pre-rendered view shapes — `FeedbackEvent { kind, title, detail?, narrativeBeat? }` and `NextTaskSuggestion { taskId, label }` — declared **locally in that component**, intentionally not added to the shared domain model above. They mirror the model (the host derives `title`/`narrativeBeat` from a milestone/badge/chapter) but the component never resolves a `milestoneId`/`Badge` itself.

---

## 5. Cooperative-only & team-scope rules (cross-cutting)

These are the constraints that make the layer safe by design. They are **hard requirements**, enforced in every component plan and verified at each GATE 3.

### 5.1 Team-scope

| Rule | Applies to |
|---|---|
| Every surface shows **only this team's** state — no comparison number, no other team's data | all |
| Nothing renders on a **public or inter-team** surface | all |
| Badges, challenges, narrative, progress are **team-owned**, never per-individual | E1, E2, E3, E5 |

### 5.2 Never-forced

| Rule | Applies to |
|---|---|
| Challenges are **opt-in** at the team level; refusing has no penalty | E3 |
| Quest name is **skippable**; empty → defaults to the team's literal name | E5 |
| Task choice is **always available, never forced**; reassignment never penalizes the previous assignee | E4 |
| Feedback animations are **brief (< 1s), skippable, non-blocking** — no modal blocking | E6 (§8 D-10) |

### 5.3 Excluded by design — these components are NEVER built

Public/individual **leaderboards** · **inter-team ranking** or cross-team score visibility · **mandatory** mechanics · **individual-only rewards** · **per-member rankings within a team** · points · public failure displays.

> If a host requirement seems to need any of the above, it is out of scope for this system — do not add it. (Source: thesis Appendix A §5; these would confound the experiment the components originate from and are antithetical to the cooperative-only design.)

---

## 6. Telemetry contract (cross-cutting)

Library code is **never env-specific** — no analytics SDK, no `next/*`. Components surface a single optional callback; the host wires transport.

```ts
type GamificationEvent =
  | { type: "progress-bar.checked";   teamId: string }
  | { type: "badges.viewed";          teamId: string; badgeId?: string }
  | { type: "challenge.opened";       teamId: string; challengeId: string }
  | { type: "challenge.opt-in";       teamId: string; challengeId: string; optedIn: boolean }
  | { type: "narrative.chapter-viewed"; teamId: string; chapterId: string }
  | { type: "task-choice.interaction"; teamId: string; taskId: string };

// Every component accepts (optionally):
type WithTelemetry = { onEvent?: (e: GamificationEvent) => void };
```

The host adds the locked envelope fields (timestamp, anonymized user/team IDs, app variant) at its transport layer. Components only emit the semantic event. (Source events map to the catalogue's telemetry table; envelope per thesis App-Data-Capture §2.3.)

---

## 7. Composition contracts

### 7.1 One by one

Each component is **prop-driven and self-sufficient.** `<TeamProgressBar value={62} />` works with nothing else mounted. No provider, no shared store, no sibling component required. This is the "usable one by one" guarantee (§8 D-12).

### 7.2 All together

The **host** (the Tier-host page, §3.2) holds the team/milestone/badge state and feeds each component via props, exactly as graph-system's host wires its Tier-1 panels (graph-system §7.1). The shared domain model (§4) guarantees the props line up. No global store, no umbrella component.

### 7.3 The deferred kit

Once 2–3 components are built and the recurring hooks/utils/types are concrete (e.g. progress math, the event factory, a `useTeam`-style reader, an optional `GamificationProvider`), they are extracted into `src/lib/gamification/` or a dedicated foundation item — **then**, with a known surface, not now. This is the "extract after it's proven" pattern (graph-system decision #25; task-family clipboard-hoist precedent). Until then, minor type duplication across folders is accepted as the price of independence + distribution safety.

### 7.4 Celebration ownership (cross-component)

Two components can animate a "progress advanced" moment: `team-trophy-shelf-01`'s **in-place award reveal** (the durable surface — a badge pops in on its shelf) and `team-feedback-loop-01`'s **transient celebration overlay** (the moment — a brief flourish). They are complementary, but a host that BOTH mounts the trophy shelf AND routes `badge`/`milestone` events to the feedback-loop must avoid double-celebrating the same event. The contract (D-16): pick **one** path per event kind — keep the shelf's in-place reveal and don't push that kind to the feedback-loop, OR set the shelf's `animateAward={false}` and let the feedback-loop own the moment. **Neither component triggers the other**; the host wires exactly one.

---

## 8. Locked decisions index

Locked at the system level; every constituent procomp inherits these as constraints. Append (don't renumber) as new decisions surface.

| # | Decision | Where enforced |
|---|---|---|
| D-01 | **New `gamification` registry category.** Update [categories.ts](../../../src/registry/categories.ts), [types.ts](../../../src/registry/types.ts), [new-component.mjs](../../../scripts/new-component.mjs) before scaffolding any component. | one-off plumbing before GATE-2 build |
| D-02 | **Six pro-components, one per element** (E1–E6), slugs per §2. | §3.1 |
| D-03 | **Components are independent at the registry level** — none imports another; each owns the domain-model slice it needs. | all component plans |
| D-04 | **No shared foundation package up front.** A `gamification-kit` is extracted only after 2–3 components prove the surface. | §7.3 |
| D-05 | **Each component is a shadcn-style compound** (headless `Root` + flat à-la-carte parts + logic-free `<Name>` assembly, flat exports, heavy deps `React.lazy`). Single-unit pieces exempt. | [compound rule](../../../.claude/rules/compound-component-structure.md); each GATE 2 |
| D-06 | **Prop-driven, controlled, self-sufficient** — every component works standalone with direct props; no provider/store required in v1. | §7.1; all plans |
| D-07 | **Telemetry via optional `onEvent` callback** with the §6 `GamificationEvent` union. No env-specific code. | §6; all plans |
| D-08 | **Cooperative-only + team-scoped** per §5; excluded mechanics (§5.3) never built. | all plans; GATE 3 |
| D-09 | **Milestone is the shared spine.** Progress %, badges, and chapters all derive from milestones; host defines milestones. | §4 |
| D-10 | **Feedback is non-blocking:** animations < 1s, skippable, no modal blocking; feedback is about the team, not individuals. | E6 plan |
| D-11 | **"All together" is a Tier-host page** at `src/app/systems/gamification-system/page.tsx`, not a shipped umbrella component. | §3.2 |
| D-12 | **Optional provider / dual-mode is a candidate for the deferred kit (§7.3), not a v1 foundation.** | §7.1 |
| D-13 | **Design-system mandate** honored by every component: Onest + JetBrains Mono, signal-lime accent, OKLCH, [globals.css](../../../src/app/globals.css) tokens, no hard-coded colors, `reveal-up` for reveals. | all plans; GATE 3 |
| D-14 | **Rollout = "spec all, then build."** System description → all 6 component descriptions → all plans (signed off) → build in dependency order. | §10 |
| D-15 | **Team prop convention.** A component that renders team-identity **text** (name / questName) accepts a `team` object — a subset of the §4 `Team`, declaring only the fields it renders. A component needing only team **identity** for telemetry/scope (optionally plus a `members` list) accepts a scalar `teamId` (+ `members`). Keeps host-page wiring predictable without forcing identity-only components to take a whole team object. | all component plans; §4 |
| D-16 | **Celebration ownership.** `team-trophy-shelf-01` (in-place badge reveal) and `team-feedback-loop-01` (transient overlay) are complementary; a host using both routes each event kind to exactly **one** (shelf `animateAward={false}` to let the feedback-loop own it, or don't push that kind to the feedback-loop). Neither component triggers the other. | §7.4; trophy-shelf + feedback-loop plans |

---

## 9. Sub-document map

| Pro-component | Description | Plan | Guide | Status |
|---|---|---|---|---|
| `team-progress-bar-01` | TBA | TBA | TBA | queued (after this doc signs off) |
| `team-trophy-shelf-01` | TBA | TBA | TBA | queued |
| `cooperative-challenge-01` | TBA | TBA | TBA | queued |
| `task-choice-control-01` | TBA | TBA | TBA | queued |
| `team-quest-log-01` | TBA | TBA | TBA | queued |
| `team-feedback-loop-01` | TBA | TBA | TBA | queued |
| **System-level** | this doc | `gamification-system-plan.md` (TBA) | `gamification-system-guide.md` (TBA) | **description DRAFT — pending sign-off** |

Each procomp folder lives at `docs/procomps/<slug>-procomp/` per convention.

---

## 10. Build order across the system

Per D-14 ("spec all, then build"):

1. **This system description** → GATE 1 sign-off.
2. **All 6 component descriptions** (independent, contract-honoring) → sign off as a package.
3. **`gamification` category plumbing** (D-01) — one-off PR.
4. **All 6 component plans + the system plan** (GATE 2) → sign off; each plan locks its compound tier inventory + tree-shaking story.
5. **Build in dependency order.** Suggested: `team-progress-bar-01` (simplest, standalone) → `team-trophy-shelf-01` → `team-feedback-loop-01` → `cooperative-challenge-01` → `team-quest-log-01` → `task-choice-control-01` (touches task-card patterns, highest blast radius). Each goes through GATE 3.
6. **Tier-host page** wiring the set.
7. **Revisit the deferred-kit decision** (§7.3) once 2–3 components are built.

---

## 11. Out of scope / deferred

1. **Shared foundation/kit package** — deferred until proven (§7.3).
2. **`GamificationProvider` / dual-mode context** — candidate for the deferred kit (D-12).
3. **Persistence / backend / realtime sync** — host concern.
4. **Telemetry transport** — host wires the `onEvent` callback (§6).
5. **The excluded competitive mechanics (§5.3)** — never.
6. **Automated tests (Vitest)** — informed-defer per library convention; GATE 3 is procedural.
7. **NPM extraction / rename** — only when the system extracts to its own package.

---

## 12. Open questions for sign-off

| # | Question | Proposed resolution |
|---|---|---|
| Q1 | **Component slugs** (§2) — confirm names; `task-choice-control-01` (alt: `task-volunteer-control-01`) and `team-feedback-loop-01` (alt: `progress-celebration-01`) are least-settled. | accept as proposed unless you prefer the alts |
| Q2 | **Six components = one per element**, or split any further (e.g. E2 badge vs shelf as two procomps; E5 quest-name vs timeline as two)? | keep one-per-element; sub-parts live inside each compound |
| Q3 | **`task-choice-control-01` as a standalone procomp** vs folding E4 into the existing `kanban-board-01` / `todo-rich-card`? | standalone procomp (keeps the pack self-contained + reusable); host can drop it into any task card |
| Q4 | **Category** — confirm `gamification` as a new top-level category (vs nesting under `data`). | new `gamification` category (D-01) |
| Q5 | **Tier-host page location** `src/app/systems/gamification-system/page.tsx` + "Systems" nav. | accept (mirrors graph-system #29) |

This is the only blocking section. ~~Resolve Q1–Q5 (or accept the proposals) to sign off GATE 1.~~ **RESOLVED 2026-07-01 — all proposals accepted.**

---

## 13. Update protocol

Not a changelog. Locked-decision changes edit the §8 row in place (with a dated footnote if non-obvious); new decisions append to §8; sub-doc status changes update §9; resolved questions strike through in §12. A meaningful change gets a one-line [.claude/STATUS.md](../../../.claude/STATUS.md) entry.

---

*End of system description. Next stage (after sign-off): all 6 component descriptions, then the Stage 2 system plan (`gamification-system-plan.md`).*
