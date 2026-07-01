# `cooperative-challenge-01` — Pro-component Description (Stage 1 / GATE 1)

> **Stage:** 1 of 3 · **Status:** DRAFT — pending GATE 1 sign-off
> **Slug:** `cooperative-challenge-01` · **Category:** `gamification` · **Tier:** pro-component (ships as a light **shadcn-style compound** — see §0)
> **System:** member of the [`gamification-system`](../../systems/gamification-system/gamification-system-description.md) (E3 of 6). Upstream extraction: [gamification-elements-catalogue.md](../../systems/gamification-system/gamification-elements-catalogue.md) components **C4 (challenge card) + C5 (opt-in control)**.
> **Element / SDT need:** **E3 — Cooperative Team Challenges · Relatedness.** Evidence basis: Dindar et al. (2021), partial η² = .10 for the cooperation effect on relatedness (catalogue §E3).

This is the **description** doc (the "what & why"). Its job: pin down what we're building and why, give a precise inventory of the data it visualizes + the states it must cover, surface the open design decisions, and earn sign-off before any planning or code. It defers to the [system description](../../systems/gamification-system/gamification-system-description.md) for the shared contract (domain model §4, cooperative-only rules §5, telemetry §6, locked decisions §8); where this doc and the system doc disagree, **the system doc wins** — flag it back there.

> 🎯 **Read-me-first.** This is the **Relatedness** surface of the pack: an **optional, opt-in, whole-team** challenge. The single most important constraint (system §5.2) is **never-forced**: opting in is a deliberate team choice, refusing has **no penalty**, and the reward — when earned — goes to the **whole team equally, never an individual** (system D-08). §2 fixes scope around those two hard rules; §10 is the coverage checklist (opted-in / opted-out / completed states).

---

## 0. Compound-structure declaration (mandated)

`cooperative-challenge-01` is a **light compound**. It does **not** trip the heavy triggers in [`.claude/rules/compound-component-structure.md`](../../../.claude/rules/compound-component-structure.md) — no heavy dep, composes no other procomp (system D-03: imports NO other registry component) — but it **does** satisfy the "a reasonable consumer would want a subset" trigger: a host may want **just the challenge card body** (read-only progress display, no controls) or **just the opt-in control** (a bare toggle to drop onto an existing surface). Per system **D-05**, it therefore ships as a shadcn-style compound: headless `Root` + flat à-la-carte parts + standalone primitives + one logic-free assembly. **Flat exports, never a `Name.Root` namespace.**

**Rough part inventory** (precise tier split + names locked at GATE 2):

| Tier | Members (rough) | Role |
|---|---|---|
| **B — headless Root** | `CooperativeChallengeRoot` | Owns the (controlled) `optedIn` echo + selection state, derives progress %, emits the two `onEvent` telemetry events, exposes context. Renders `children`. No internal data state (controlled, system D-06). |
| **B — context parts** (flat) | `CooperativeChallengeHeader` · `CooperativeChallengeProgress` · `CooperativeChallengeReward` · `CooperativeChallengeOptIn` | One module per region; each reads `useCooperativeChallenge()` — no prop-drilling. `OptIn` is the opt-in/opt-out control (catalogue C5). |
| **C — standalone primitives** (context-free) | `ChallengeProgressMeter` · `ChallengeRewardChip` · `OptInToggle` · `TeamMemberStack` | Dumb, prop-driven; usable anywhere (e.g. `OptInToggle` on any surface, `TeamMemberStack` = avatar pile of `Team.members`). |
| **A — assembly** | `CooperativeChallenge01` | `Root` + the parts above, gated by `show*` toggles. Contains no logic the parts don't. Demo + screenshot use this. |

**Tree-shaking story:** each part is its own module re-exported from the barrel. A consumer who wants only the opt-in control imports `CooperativeChallengeOptIn` (or the bare `OptInToggle`) and never pulls the card chrome; a read-only progress card falls out by omitting the `onOptInChange` handler (the control hides — capability-gating). No `React.lazy` needed (no heavy dep).

---

## 1. Problem

Team apps that want to boost **coordination and belonging** reach for "challenges" — but the usual implementations are exactly the failure modes the [gamification-system](../../systems/gamification-system/gamification-system-description.md) exists to avoid (system §1.1, §5.3): individual challenges, competitive ranking, mandatory participation, per-person rewards, public failure displays. Those *reduce* relatedness and confound the cooperative-design intent.

What's missing is a **safe-by-design cooperative challenge surface**: a card that shows **one shared team goal** ("All 5 members commit a task this morning"), **the team's collective progress toward it**, the **whole-team reward** on completion — and an **opt-in control that makes refusing cost-free and obvious**. It must:

1. render a single `Challenge` (label, progress, reward, done) **team-scoped** — only *this* team's state, never inter-team or per-individual (system §5.1, D-08),
2. show progress as a **collective** quantity (`current / target`) — never a per-member breakdown or ranking,
3. surface an **opt-in toggle at the team level** where opting out is one click, penalty-free, and visually neutral (not a "you failed" treatment) — system §5.2,
4. on completion, present the reward as **belonging to the whole team equally** (system D-08), with a brief non-blocking acknowledgement,
5. be **prop-driven and self-sufficient** — `<CooperativeChallenge01 challenge={…} team={…} />` works with nothing else mounted (system §7.1, D-06).

Today every product hand-rolls this and usually drifts into the excluded mechanics. This procomp is the cooperative-correct primitive.

---

## 2. In scope / Out of scope

### v1 — in scope

**The challenge card**
- Render **one `Challenge`** (the recommendation; see §7-D-C1) for **one `Team`**: label, progress, reward, done state.
- **Header** — challenge `label` + an optional `TeamMemberStack` (avatar pile of `team.members`) reinforcing *this is your team's shared goal*. Optional team `name`.
- **Progress** — a collective meter from `progress.current` / `progress.target` (e.g. "3 / 5 members committed"). A single bar + numeric count. **Never** a per-member list, ranking, or comparison number.
- **Reward** — the whole-team reward (`reward` string) shown as a chip/banner, framed as *the team earns this together* (system D-08). Hidden if `reward` is undefined.
- **Done state** — when `done: true`, the card shifts to a **completed / earned** treatment (signal-lime success accent, brief non-blocking acknowledgement, reward shown as earned). No modal blocking (consistent with the system's non-blocking-feedback ethos, D-10).

**The opt-in control (catalogue C5)**
- A **team-level opt-in toggle** bound to `challenge.optedIn`. Controlled: the host owns the value; the component echoes and fires `onOptInChange` + the `challenge.opt-in` telemetry event.
- **Opted-out is a first-class, neutral state** — not greyed-as-failure. The card still renders the goal + reward as *available if you join*, with a clear, low-friction "Join this challenge" affordance. **Refusing has no penalty** and the copy/visual must say so (system §5.2 — the CRITICAL never-forced rule).
- **Opt-out is always available** even after opting in (a team can leave a challenge it joined; no penalty, no "are you sure you want to abandon" guilt pattern).

**Telemetry** (system §6, D-07)
- Emits `{ type: "challenge.opened"; teamId; challengeId }` on first reveal/mount of the card (the catalogue's "challenge opened" feature-view event).
- Emits `{ type: "challenge.opt-in"; teamId; challengeId; optedIn }` when the team toggles opt-in.
- Both via the optional `onEvent` callback; no analytics SDK, no `next/*` (system §6).

**Standalone / composed paths** (D-05)
- Card-body-only (no control), opt-in-control-only (bare toggle), and full assembly all available; demo includes a "Composed / lighter" example.

**States** — opted-in (active, in progress) · opted-out (neutral, joinable) · completed (`done`) · no-reward · empty/loading (skeleton card) · single-member vs full team avatar stack · long label truncation.

**Portability** — zero `next/*`, no `process.env`, no app context; own `types.ts` slice (system D-03); registry-import-clean (`react`, `@/components/ui/*`, `@/lib/utils`, declared shadcn primitives only). SSR-safe.

### v1 — out of scope (deferred)

- **Multiple challenges / a challenge list** — v1 renders one challenge (see §7-D-C1). A host with several wires a list of cards; a built-in `ChallengeList` part is a candidate for **v2** if the recurring need proves out.
- **Per-member contribution breakdown** — the progress is collective by design; a "who committed" expansion is *deliberately* not built (risks per-individual framing; would need a research check, catalogue Hard Guardrails). Reserved-only if ever, behind a flag, v2+.
- **Challenge authoring / editing** (creating goals, setting targets, picking rewards) — host concern; the component renders a `Challenge`, it doesn't author one.
- **Reward redemption / fulfilment** — the component *displays* the reward; granting/redeeming it is host backend.
- **Countdown / deadline timers** — the `Challenge` slice has no time field in v1; a deadline is a v2 additive field if needed.
- **Celebration overlay** — the heavy completion animation belongs to **E6 `team-feedback-loop-01`** (catalogue C9). This card's `done` treatment is a lightweight inline acknowledgement; the host can compose the feedback-loop overlay alongside it.
- **Persistence / backend / realtime** — host (system §11).
- **Automated tests (Vitest)** — informed-defer per library convention (system §11.6); GATE 3 is procedural.

### Deliberate non-goals (any version) — system §5.3 enforced

- **NO mandatory challenges.** Participation is always opt-in; there is no prop, mode, or path that forces a team into a challenge. (System §5.2, D-08.)
- **NO individual rewards.** The reward is whole-team, equal for all — never per-member, never "top contributor." (System D-08.)
- **NO competitive mechanics** — no leaderboard, no inter-team ranking, no per-member ranking within the team, no points, no public/inter-team surface, no public failure display. (System §5.3.)
- **NO penalty for opting out or leaving** — opting out is neutral and cost-free, visually and in copy. (System §5.2.)
- **Not a task editor / not a server-state synchroniser** — renders a `Challenge`; host wires data + persistence.

---

## 3. Target consumers

| Archetype | Example | What they need |
|---|---|---|
| **Team-management / project app** *(primary)* | A cooperative challenge in the team's gamification zone next to the progress bar + trophy shelf | One shared goal, collective progress, whole-team reward, cost-free opt-in |
| **Standalone team app adopting one piece** *(primary)* | Wants only an opt-in challenge card, no other gamification | Self-sufficient card via direct props; no provider/store (system §7.1) |
| **Host needing just the control** *(secondary)* | An existing surface that needs a penalty-free "join this team challenge" toggle | The bare `CooperativeChallengeOptIn` / `OptInToggle` part, dropped à-la-carte |
| **Gamification-system host page** *(integration)* | `src/app/systems/gamification-system/page.tsx` wiring all six elements | Card fed from host team/challenge state; events bubble to host telemetry (system §3.2, §7.2) |

Non-targets: competitive challenges (excluded by design, §5.3), individual goals/streaks (not cooperative), the milestone progress bar (→ `team-progress-bar-01`, E1), the celebration overlay (→ `team-feedback-loop-01`, E6).

---

## 4. Data structure — what the card is drawn from

**The component declares its OWN `types.ts` slice** of the system domain model — it imports NO other registry component (system D-03/D-04). The slice below is the contract (source of truth: system description §4); the component consumes a `Challenge` + the owning `Team`.

```ts
// Declared locally in cooperative-challenge-01/types.ts — NOT imported.
interface Challenge {
  id: string;
  label: string;                          // → card header label, e.g. "All 5 members commit a task this morning"
  optedIn: boolean;                       // → team-level opt-in; drives the OptIn control (refusing has no penalty)
  progress: { current: number; target: number };  // → collective progress meter
  reward?: string;                        // → whole-team reward chip; undefined → no reward shown
  done: boolean;                          // → completed/earned treatment
}

interface Team {
  id: string;
  name: string;                           // → optional team name in the header
  members: { id: string; displayName: string; avatarUrl?: string }[];  // → TeamMemberStack avatar pile
}
```

### Field → visual mapping (the design table)

| Field | Where it shows | Notes for design |
|---|---|---|
| `challenge.label` | Card header (primary line) | Truncate with ellipsis; full text on title attr / tooltip |
| `challenge.progress.current` / `.target` | **Collective progress meter** + count label | Bar fill = `current / target`; label e.g. "3 / 5". **Never** per-member rows |
| `challenge.reward` | Reward chip / banner | Framed "the team earns: …"; hidden if undefined |
| `challenge.optedIn` | **OptIn control** state + card emphasis | `true` → active card; `false` → neutral "joinable" card. Opt-out always available |
| `challenge.done` | Completed/earned treatment | Signal-lime success accent; reward shown earned; brief non-blocking ack; no modal |
| `team.name` | Header (secondary, optional) | Reinforces team-scope |
| `team.members[]` | `TeamMemberStack` avatar pile | Avatar w/ initials fallback; +N overflow chip; reinforces "shared goal" |

### Derived values (deterministic — lock in design)

```
progressFraction = clamp(progress.current / max(progress.target, 1), 0, 1)
isJoinable       = !optedIn && !done           → neutral "Join this challenge" card
isActive         = optedIn && !done            → active in-progress card
isComplete       = done                        → earned/completed treatment (reward earned)
hasReward        = reward != null && reward !== ""
```

> **No component-invented progress notion** (system D-09 spirit): progress is exactly the `Challenge.progress` the host supplies; the card does not derive challenge progress from milestones (that's E1's job). The two are independent quantities.

---

## 5. Rough API sketch (NOT final — that's the plan stage)

Illustrative. The canonical shape lands in `src/registry/components/gamification/cooperative-challenge-01/types.ts` at plan stage; defer to it on naming. **Types are declared locally** (system D-03) — no import from another registry component.

```ts
import type { GamificationEvent } from "./types"; // local slice of the system §6 union

export type CooperativeChallengeProps = {
  /** The shared team goal to render (one challenge in v1). */
  challenge: Challenge;
  /** The team that owns the challenge (avatar stack + scope). */
  team: Team;

  // Opt-in (controlled, team-level — never forced)
  /** Fires when the team opts in/out. Omit → read-only card (control hides). */
  onOptInChange?: (optedIn: boolean) => void;

  // Telemetry (system §6, D-07) — emits challenge.opened + challenge.opt-in
  onEvent?: (e: GamificationEvent) => void;

  // Assembly toggles (the parts also stand alone)
  showOptIn?: boolean;          // default true; false → card body only
  showReward?: boolean;         // default true (auto-hides if no reward)
  showMemberStack?: boolean;    // default true

  // Copy overrides (so hosts can localize the never-forced framing)
  joinLabel?: string;           // default "Join this challenge"
  leaveLabel?: string;          // default "Leave challenge"  (penalty-free)
  noPenaltyHint?: string;       // default "Optional — no penalty for sitting this one out"

  className?: string;
  "aria-label"?: string;
};

// Standalone-part prop shapes (Tier C) are simpler subsets, e.g.:
export type OptInToggleProps = {
  optedIn: boolean;
  onOptInChange?: (optedIn: boolean) => void;
  joinLabel?: string;
  leaveLabel?: string;
  noPenaltyHint?: string;
  disabled?: boolean;
};
```

**Surface budget:** ~1 prop category beyond data — read-only display + one controlled toggle + telemetry. Counting *feature concepts* (data: `challenge` + `team`; the controlled opt-in pair as one; `onEvent`; three `show*` toggles; three copy overrides), this sketch is **~10 concepts, comfortably under the ~25 ceiling.** A light compound; if a real v1 grows a god-prop surface, the parts must absorb it.

---

## 6. Example usages

### 6.1 — Drop-in cooperative challenge (the primary consumer)

```tsx
import { CooperativeChallenge01 } from "@/registry/components/gamification/cooperative-challenge-01";

function TeamChallengeZone({ challenge, team }: { challenge: Challenge; team: Team }) {
  return (
    <CooperativeChallenge01
      challenge={challenge}                 // { label, optedIn, progress, reward, done }
      team={team}                           // { name, members }
      onOptInChange={(optedIn) => persistOptIn(team.id, challenge.id, optedIn)}
      onEvent={track}                       // host wires the analytics envelope
    />
  );
}
```

Refusing is one click and penalty-free; on `done`, the card shows the whole-team reward as earned with a brief inline acknowledgement (no modal).

### 6.2 — Read-only card (no control — omit the handler)

```tsx
<CooperativeChallenge01
  challenge={challenge}
  team={team}
  // no onOptInChange → opt-in control hides; pure progress + reward display
/>
```

Capability-gating: omitting `onOptInChange` collapses the component to a read-only progress card — the read-only variant falls out for free (compound rule).

### 6.3 — Composed / lighter: just the opt-in control (proves the compound path)

```tsx
import {
  CooperativeChallengeRoot,
  CooperativeChallengeOptIn,
} from "@/registry/components/gamification/cooperative-challenge-01";

// Drop only the penalty-free opt-in toggle onto an existing surface.
<CooperativeChallengeRoot challenge={challenge} team={team} onOptInChange={join} onEvent={track}>
  <CooperativeChallengeOptIn />
</CooperativeChallengeRoot>

// …or the bare context-free primitive, no Root:
// <OptInToggle optedIn={challenge.optedIn} onOptInChange={join} />
```

---

## 7. Decisions

Locked rows inherit from the [system description §8](../../systems/gamification-system/gamification-system-description.md#8-locked-decisions-index); component-specific rows recommend a default and confirm at sign-off / plan stage.

### 7.1 Inherited from the system (locked — do not re-litigate here)

| # | Decision | Applied to this component |
|---|---|---|
| **D-03** | Independent at the registry level; own `types.ts` slice; imports no other registry component | This card declares its own `Challenge`/`Team`/`GamificationEvent` slice (§4); no cross-procomp import. |
| **D-05** | Ships as a shadcn-style compound (flat exports) | Light compound: `Root` + card parts + `OptIn` control part + standalone primitives + assembly (§0). |
| **D-06** | Prop-driven, controlled, self-sufficient; no provider/store | `challenge`/`team` are props; `optedIn` is controlled; no internal data state (§5). |
| **D-07** | Telemetry via optional `onEvent` | Emits `challenge.opened` + `challenge.opt-in` (§2). |
| **D-08** | Cooperative-only + team-scoped: whole-team reward, never individual; never inter-team/public | Reward is whole-team equal; progress is collective; never per-member ranking (§2, §4). |
| **D-13** | Design-system mandate (Onest/JetBrains Mono, signal-lime, OKLCH, globals.css tokens, `reveal-up`) | Honored in §10; no hard-coded colors. |

### 7.2 Component-specific (recommend now, confirm at sign-off)

| # | Question | Recommendation |
|---|---|---|
| **D-C1** | **One challenge or a list?** | **One `Challenge` per component in v1.** A host with several maps over `CooperativeChallenge01`; a built-in `ChallengeList` part is a v2 candidate if the recurring need proves out. Keeps the v1 surface small and the never-forced framing per-challenge clear. *(Confirm.)* |
| **D-C2** | **How is progress shown?** | **Collective meter only** — a single bar + `current / target` count label. **Never** a per-member breakdown, list, or ranking (would risk per-individual framing, §5.3). The avatar `TeamMemberStack` reinforces *shared*, but is not a per-member progress display. *(Confirm.)* |
| **D-C3** | **Opt-in / opt-out UX** | **Opted-out is a neutral, first-class "joinable" state** (not greyed-as-failure); **opt-out is always available** even after joining, with **no guilt/confirm pattern**; a visible `noPenaltyHint` states refusing is cost-free. The control is a clear toggle/button bound to `challenge.optedIn` (controlled). This is the CRITICAL never-forced rule (§5.2) made literal in the UI. *(Confirm.)* |
| **D-C4** | **Done/completed treatment** | **Lightweight inline earned treatment** (signal-lime success accent + brief non-blocking ack + reward-earned chip). The heavy celebration overlay is **E6 `team-feedback-loop-01`** (composed alongside, not built here). No modal blocking. *(Confirm.)* |
| **D-C5** | **`challenge.opened` emit timing** | **On first reveal/mount of the card** (the catalogue's "challenge opened" feature-view semantics). Guarded against double-emit on re-render. *(Confirm at plan.)* |
| **D-C6** | **Controlled-only opt-in, or uncontrolled `defaultOptedIn` too?** | **Controlled-only in v1** (`challenge.optedIn` is the value; host persists). Simpler, matches D-06 and the family's controlled echo pattern. Add `defaultOptedIn` only if a real uncontrolled need surfaces. *(Confirm at plan.)* |

---

## 8. Risks

- **Never-forced framing is easy to get subtly wrong.** A greyed-out opted-out card *reads* as "you failed / you're locked out" even if it isn't. Design must make opted-out **neutral and inviting**, with explicit cost-free copy — this is the load-bearing constraint (system §5.2). GATE 3 verifies it.
- **Per-individual leak.** Any "who's committed" or "you still need to commit" framing drifts toward per-member tracking — excluded by design (§5.3). Keep progress strictly collective (D-C2); a per-member breakdown needs a researcher check before it's ever considered.
- **Reward must read as whole-team.** Copy/visual must say *the team earns this together* — never "you'll get." A first-person reward framing violates D-08.
- **Done-state scope creep into E6.** The completed treatment must stay a lightweight inline ack; the heavy celebration is `team-feedback-loop-01`'s job. Keep the seam clean (D-C4) so a host composes both without duplication.
- **Telemetry double-emit.** `challenge.opened` on mount must guard against React re-render / StrictMode double-invoke (the family's `useEffect`-emit-guard pattern). Plan locks the guard.
- **Controlled echo correctness.** `optedIn` is controlled; the toggle must echo the prop, not hold local state — the rich-card/calendar controlled-echo lesson. Plan states the single chokepoint.
- **Type duplication across the pack.** Declaring `Challenge`/`Team` locally duplicates the system slice — accepted as the price of registry independence (system D-03/D-04). The deferred `gamification-kit` (§7.3) may dedupe later; do not import early.
- **Design-token discipline.** Success/earned accent must be signal-lime per tokens (no ad-hoc green); progress meter colors from tokens. No hard-coded colors (D-13).

---

## 9. Success criteria

v1 ships when:

1. **`Challenge` + `Team` render** — every field in §4's table produces its mapped element.
2. **Never-forced is literal** — opted-out is a neutral, joinable, penalty-free state with explicit cost-free copy; opt-out is always available; no guilt/confirm pattern.
3. **Whole-team reward** — the reward reads as the team's collectively, never individual; no per-member reward path exists.
4. **Collective progress** — meter + `current / target` count; no per-member breakdown or ranking anywhere.
5. **Done treatment** — `done` shows a lightweight, non-blocking earned treatment (signal-lime); no modal; the heavy celebration is left to E6.
6. **Telemetry** — `challenge.opened` (first reveal, double-emit-guarded) + `challenge.opt-in` (`{ optedIn }`) fire through `onEvent`; portable (no SDK, no `next/*`).
7. **States** — opted-in · opted-out (joinable) · completed · no-reward · empty/loading · single-member vs full stack · long-label all designed + built.
8. **Compound is real** — flat exports; card-body-only (omit handler) + opt-in-control-only (§6.3) subsets render; demo includes a "Composed / lighter" example.
9. **Self-sufficient** — `<CooperativeChallenge01 challenge team />` works standalone, no provider/store (system §7.1).
10. **A11y** — opt-in is a labelled, keyboard-operable toggle/button; progress meter has accessible value/text; completed state is announced non-intrusively.
11. **Portability** — own `types.ts` slice, no cross-procomp import, no `next/*`/`process.env`, SSR-safe, registry-import-clean.
12. **Design tokens** — every color maps to a `globals.css` token; one orchestrated `reveal-up` entrance; no hard-coded colors.

---

## 10. Design coverage checklist (what design must produce)

> Each box is a screen/state against the **ilinxa-ui-pro design system** ([`src/app/globals.css`](../../../src/app/globals.css)): **signal-lime** accent `oklch(0.80 0.20 132)` light / `oklch(0.86 0.18 132)` dark (always with near-black `--primary-foreground`), cool off-white `--background` (raised `--card`/`--popover` to pure white), graphite-cool dark surfaces, **Onest** (sans) / **JetBrains Mono** (mono for counts), one orchestrated `reveal-up` entrance (60ms stagger). **Forbidden:** pure-white page backgrounds, purple-on-white gradient clichés, neon-saturated lime (chroma ≤ 0.20), Inter/Roboto/Geist/system-font defaults.

**A. The three primary states** *(the load-bearing trio)*
- [ ] **Opted-in / active** — challenge engaged, progress in motion (active emphasis, signal-lime accent on the meter / control).
- [ ] **Opted-out / joinable** — **neutral, inviting**, goal + reward shown as *available if you join*, prominent penalty-free "Join" affordance + cost-free hint. NOT greyed-as-failure.
- [ ] **Completed / earned** (`done`) — signal-lime success treatment, reward shown earned, brief non-blocking acknowledgement (no modal).

**B. Card anatomy**
- [ ] Header: label (truncation + overflow) · optional team name · `TeamMemberStack` (avatars + initials fallback + +N overflow).
- [ ] Progress meter: bar fill + `current / target` count (mono) · 0% / partial / 100% fills.
- [ ] Reward chip/banner: present · absent (auto-hidden) · earned variant.
- [ ] Opt-in control: opt-in (Join) · opt-out (Leave) · disabled · the `noPenaltyHint`.

**C. Color → token mapping**
- [ ] Active accent → signal-lime (`--primary`); success/earned → signal-lime; meter track → `--muted`, fill → `--primary`; reward chip → token-based (no ad-hoc green); neutral opted-out → `--muted`/`--secondary` (not a destructive tone). Map **every** color to a token.

**D. States & responsive**
- [ ] Empty/loading skeleton (card silhouette + meter shimmer) · single-member team · full-stack team · long label · very large `target` (count formatting).
- [ ] Wide · medium · narrow (control wraps below; member stack collapses) — card is drop-in at varied widths.

**E. Motion**
- [ ] One orchestrated `reveal-up` entrance on first mount · progress-fill transition · brief (<1s) non-blocking earned acknowledgement (no modal, skippable per the family's non-blocking ethos).

---

## 11. Definition of "done" for THIS document (stage gate)

- [ ] §§0–10 drafted, reconciled to `ilinxa-ui-pro` + `gamification-system` conventions (paths, imports, design tokens, locked decisions).
- [ ] Data structure pinned to the system §4 slice (declared locally, §4) — no cross-procomp import (D-03).
- [ ] Compound-structure declared with rough part inventory (§0) — light compound, subset paths named (D-05).
- [ ] Cooperative-only constraints made literal: never-forced opt-in (§2, §7-D-C3), whole-team reward (§2, §8), collective progress (§7-D-C2), no excluded mechanics (§2 non-goals) — per system §5.
- [ ] Telemetry contract honored: `challenge.opened` + `challenge.opt-in` via `onEvent` (§2, §7-D-C5; system §6, D-07).
- [ ] Component-specific decisions D-C1…D-C6 recommended for sign-off (§7.2).
- [ ] **User sign-off** → Stage 2 (`cooperative-challenge-01-procomp-plan.md`, GATE 2).

After sign-off, changes to this doc are loud and intentional, not silent rewrites. Where this doc and the [system description](../../systems/gamification-system/gamification-system-description.md) disagree, the system doc wins.
