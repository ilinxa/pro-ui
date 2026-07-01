# `team-progress-bar-01` — Pro-component Description (Stage 1 / GATE 1)

> **Stage:** 1 of 3 · **Status:** DRAFT — pending GATE 1 sign-off
> **Slug:** `team-progress-bar-01` · **Category:** `gamification` · **Tier:** pro-component (light shadcn-style compound — see §0)
> **Element / SDT need:** E1 (Team Progress Bar) · **Competence**
> **System origin:** part of the signed-off [`gamification-system`](../../systems/gamification-system/gamification-system-description.md) (GATE 1 signed off 2026-07-01). Upstream extraction: [gamification-elements-catalogue.md → C1 / E1](../../systems/gamification-system/gamification-elements-catalogue.md).

This is the **description** doc (the "what & why"). Its job: pin down what we're building and why, map the data slice it consumes to the visual surface, surface the few open decisions, and earn sign-off before any planning or code. The shared contract (domain model, cooperative-only rules, telemetry, design mandate) lives in the [system description](../../systems/gamification-system/gamification-system-description.md) — this doc honors it and references it rather than re-deriving it.

> 🎯 **Read-me-first.** This is a deliberately small component — **one progress bar per team board**. §4 is the data slice every visual derives from. §7 carries the locked system-inherited decisions plus the one real component-specific call (`Milestone[]` vs direct `value`). The component is **always visible, read-only, this-team-only** — no hidden/locked states, no comparison, never a ranking (system §5.3 / D-08).

---

## 0. Compound-structure declaration (mandated)

Assessed honestly against [`.claude/rules/compound-component-structure.md`](../../../.claude/rules/compound-component-structure.md):

| Trigger | Trips? |
|---|---|
| ≥ 3 distinct mountable regions | **No** — one bar, optional label, optional milestone ticks. Two of these are sub-fragments of one bar, not independent regions. |
| Composes ≥ 1 other procomp | **No** — imports zero registry components (system D-03). |
| Pulls a heavy dep | **No** — builds on the shadcn `progress` primitive; no Konva/pdf.js/charting weight. |
| A reasonable consumer would want a subset | **Borderline yes** — a consumer may want bar-only (slim header inline), bar + numeric label, or bar + per-milestone tick marks. |

**Verdict: a *light* compound.** This is the borderline case the system flagged (D-05). A bare progress bar is nearly a single-unit widget, but the subset trigger is real: dropping the label or the ticks is a legitimate "lighter version" a host header would want. So it ships as a **minimal** shadcn-style compound — a headless `Root` that owns the progress math + telemetry + context, two flat à-la-carte parts, and one logic-free assembly. Not the full ~10-part media-library shape; just enough to honor the rule and the pay-for-what-you-use identity. Flat exports always (`TeamProgressBarRoot`, never `TeamProgressBar.Root`).

**Rough part inventory** (precise tier split + names locked at GATE 2):

| Tier | Members (rough) | Role |
|---|---|---|
| **B — headless Root** | `TeamProgressBarRoot` | Resolves `value` from `Milestone[]` (or accepts direct `value`), owns the `progress-bar.checked` emit, holds context. Renders `children`. No data/persistence state. |
| **B — context parts** (flat) | `TeamProgressBarTrack` · `TeamProgressBarLabel` | `Track` = the filled bar (+ optional milestone ticks); `Label` = the team name / "% complete" readout. Each reads `useTeamProgressBar()` — no prop-drilling. |
| **C — standalone primitive** (context-free) | `ProgressTrack` | Dumb, prop-driven fill bar usable anywhere (takes a 0–100 number). The `Track` part is a thin context wrapper over it. |
| **A — assembly** | `TeamProgressBar01` | `Root` + `Track` + `Label`, gated by `showLabel` / `showTicks`. Contains no logic the parts don't. Demo + screenshot use this. |

**Tree-shaking story:** each part is its own module re-exported from the barrel; dropping `Label` or the ticks falls out for free. There is no heavy dep to `React.lazy` — the whole component is light by construction.

> If GATE 2 finds the compound adds more ceremony than value (e.g. the ticks collapse into one `Track` prop and `Label` never ships separately), the fallback is a single sealed `team-progress-bar` widget with `showLabel`/`showTicks` props. Flagged as **Q-1** in §7. The description commits to the light-compound shape unless the plan demonstrates the simpler form is strictly better.

---

## 1. Problem

A team-management board needs to answer one question at a glance: **"how far is *our team* through the journey?"** — and answer it in a way that builds **competence** (SDT) without tipping into comparison or ranking.

- A team-board header has a slot for an always-on motivational cue, but a raw "3 / 8 tasks" string is flat and easy to ignore.
- Hosts hand-roll a progress bar each time, usually re-deriving percentage from whatever local notion of "progress" is handy — which drifts from the milestone spine the rest of the gamification layer uses.
- The risk every time is that "progress" quietly becomes "progress vs. the other team" or "who contributed most" — the exact competitive failure modes the system excludes by design (system §5.3).

This procomp is the safe, reusable primitive for that header slot: **one bar, this team's milestone-completion %, derived from the shared milestone spine, always visible, never comparative.** It is the simplest component in the gamification pack and the first to build (system §10 build order).

---

## 2. In scope / Out of scope

### In scope

- **One progress bar per team board**, showing **% of planned team milestones completed** (`done` count / total). Designed to sit in a team-board header.
- **Always visible** — no hidden, locked, empty-locked, or "unlock me" states (catalogue §7.5).
- **This team's own % only** — no comparison number, no second bar, no other team's data (system D-08 / §5.1).
- **Two input modes** (Q-2): a `Milestone[]` (the component computes %) **or** a direct `value` (0–100) for the simplest standalone drop-in.
- **Optional numeric readout** — e.g. "62%" or "5 / 8 milestones", off-by-prop.
- **Optional per-milestone tick marks** on the track (one notch per milestone, filled notches = done), off-by-prop — a richer competence cue when a `Milestone[]` is supplied.
- **Optional team name / label** for context (e.g. "Team Aurora — 62%").
- **Telemetry** — emits `{ type: "progress-bar.checked"; teamId: string }` via the optional `onEvent` callback when the bar is viewed/interacted with (system §6 / D-07).
- **Design-system compliant** surface — signal-lime fill, Onest/JetBrains Mono, OKLCH tokens, `reveal-up` entrance (system D-13).
- **Standalone-usable** — `<TeamProgressBar value={62} />` works with nothing else mounted (system D-06).
- **Portable** — zero `next/*`, no `process.env`, no app context, no other registry import (system D-03); SSR-safe.

### Out of scope (deferred / never)

- **Any comparison or ranking** — no other team's bar, no "you're #2", no per-member contribution split. *Never* (system §5.3 / D-08).
- **Inter-team / public surfaces** — team-scoped only; the bar never renders on a public page (system §5.1).
- **Per-individual progress** — progress is team-owned; never "your tasks vs. theirs".
- **Editing milestones / marking them done** — the bar is read-only; the host owns the milestone data and mutation (system D-06).
- **A separate progress notion** — % derives only from milestones; the component never invents its own completion metric (system D-09).
- **Animated celebration on completion** — that's E6 (`team-feedback-loop-01`), a separate procomp. This bar may animate its fill transition, but the celebration overlay is not here.
- **Persistence / backend / realtime** — host concern (system §11).
- **Telemetry transport / envelope fields** (timestamp, anonymized IDs, app variant) — host wires them at its transport layer (system §6).

### Deliberate non-goals (any version)

- **Not a leaderboard, not a ranking, not a scoreboard.** Hard constraint (system §5.3) — if a host wants any of these, it is out of scope for this system.
- **Not a milestone editor or timeline.** Chapter/beat framing is E5 (`team-quest-log-01`); the editor is the host's.
- **Not a generic multi-series progress widget.** One series, one team, one %.

---

## 3. Target consumers

| Archetype | Example | What they need |
|---|---|---|
| **Team-board header** *(primary)* | Gamified kanban / project board top bar | Always-visible single bar of this team's milestone % from a `Milestone[]`; lime fill; team name label |
| **Standalone drop-in** *(primary)* | Any team app wanting a quick "X% done" cue | `<TeamProgressBar value={62} />` with no gamification infrastructure |
| **Gamification-system host** *(integration)* | The Tier-host page (`src/app/systems/gamification-system/page.tsx`) | Feeds the same `Milestone[]` it feeds the trophy shelf / quest log; wires `onEvent` to its analytics |

Non-targets: per-member dashboards, cross-team summaries, public progress pages (all excluded by the cooperative-only constraint).

---

## 4. Data structure — the slice this component consumes

This component **declares its own slice** of the shared domain model in its own `types.ts` — it does **not** import from another registry component (system D-03). The slice it needs is the `Milestone` (system §4 is the source of truth; do not fork it):

```ts
// Re-declared locally in team-progress-bar-01/types.ts (no shared import in v1).
interface Milestone {
  id: string;
  label: string;     // e.g. "First playable build" — tooltip on a tick mark
  done: boolean;     // → counts toward the numerator
  doneAt?: string;   // ISO 8601 — not rendered by the bar (reserved)
  order: number;     // → tick-mark left-to-right ordering on the track
}
```

The host owns milestones; the bar consumes `done`/total. **Progress % = `done` count / total × 100** (system D-09 — the milestone is the shared spine; the bar invents no other notion of progress).

### Field → visual mapping (the design table)

| Input | Where it shows | Notes for design |
|---|---|---|
| `Milestone[]` length | Tick-mark count (if `showTicks`) + denominator of "N / M" | One notch per milestone, in `order` |
| `milestones.filter(done).length` | **Fill width** + numerator | The whole bar geometry. `done / total → 0–100%` |
| `value` (0–100, direct mode) | **Fill width** | Alternative to `Milestone[]`; bypasses the tick/denominator detail |
| `milestone.done` (per item) | Filled vs. empty **tick mark** | Filled notch = done; in `order` |
| `milestone.label` | Tick-mark tooltip / `aria-label` | Optional; ticks are decorative + accessible |
| `team.name` (optional) | Leading label text | e.g. "Team Aurora — 62%" |
| computed % | Numeric readout (if `showLabel`) | "62%" or "5 / 8 milestones" — format is a prop choice (Q-3) |

### Percentage resolution (deterministic — lock this in design)

```
if value provided:        pct = clamp(value, 0, 100)
else if milestones:       pct = total === 0 ? 0 : round(done / total * 100)
else:                     pct = 0   (empty/uninitialised — bar renders at 0%, never hidden)
fillWidth = pct%
ticks     = showTicks && milestones ? one notch per milestone (filled iff done) : none
```

Edge: `total === 0` (no milestones yet) → 0%, bar still renders (always-visible rule). `value` and `Milestone[]` both supplied → `value` wins (explicit override); flag the redundancy in dev (Q-2).

---

## 5. Rough API sketch (NOT final — that's the plan stage)

Illustrative; canonical shape lands in `src/registry/components/gamification/team-progress-bar-01/types.ts` at plan stage. **This is a small surface** — roughly **~10 feature concepts**, well under the ~25 ceiling. It deliberately stays tiny: the whole point is a drop-in bar.

```ts
import type { Milestone } from "./types"; // local slice — NOT imported from another component (D-03)
import type { GamificationEvent } from "./types"; // local re-declaration of the system §6 union slice

export type TeamProgressBarProps = {
  // ── Data (one of the two; value wins if both given) ──
  /** Milestones for this team; % = done/total. Enables tick marks + "N / M" readout. */
  milestones?: Milestone[];
  /** Direct 0–100 percentage for the simplest standalone use; overrides `milestones`. */
  value?: number;

  /** This team — a subset of the shared Team (system D-15): `id` for the telemetry
   *  payload + scope, `name` for the optional leading label. */
  team: { id: string; name?: string };

  // ── Display (assembly toggles) ──
  showLabel?: boolean;       // numeric readout; default true
  showTicks?: boolean;       // per-milestone notches; default false (needs `milestones`)
  /** How the readout reads. default "percent". */
  labelFormat?: "percent" | "fraction"; // "62%" vs "5 / 8 milestones"

  // ── Telemetry (system §6 / D-07) ──
  onEvent?: (e: GamificationEvent) => void; // emits { type: "progress-bar.checked"; teamId }

  className?: string;
  "aria-label"?: string;
};
```

> Note the small prop count: there is no controlled/uncontrolled pairing, no imperative handle, no event storm — the bar is read-only and stateless beyond the derived %. If the plan finds it needs more than ~12 concepts, the scope has crept and we revisit §2.

---

## 6. Example usages

### 6.1 — Standalone, direct value (simplest)

```tsx
import { TeamProgressBar01 } from "@/registry/components/gamification/team-progress-bar-01";

<TeamProgressBar01 team={{ id: "T-001", name: "Team Aurora" }} value={62} />
```

### 6.2 — From milestones, with ticks (the gamification header)

```tsx
<TeamProgressBar01
  team={{ id: "T-001", name: "Team Aurora" }}
  milestones={team.milestones}     // % = done / total
  showTicks
  labelFormat="fraction"           // "5 / 8 milestones"
  onEvent={(e) => analytics.track(e.type, e)} // host adds envelope fields
/>
```

### 6.3 — Composed / lighter (bar only, no label) — proves the compound path

```tsx
import {
  TeamProgressBarRoot, TeamProgressBarTrack,
} from "@/registry/components/gamification/team-progress-bar-01";

<TeamProgressBarRoot team={{ id: "T-001" }} milestones={team.milestones}>
  <TeamProgressBarTrack showTicks />   {/* no Label part → lighter, tree-shaken */}
</TeamProgressBarRoot>
```

---

## 7. Decisions

Locked rows are the system-inherited constraints (do not re-litigate here). Open rows recommend a default and confirm at sign-off / plan stage.

| # | Question | Decision |
|---|---|---|
| **D-03** *(inherited)* | Registry independence | 🔒 Imports **no** other registry component; declares its own `Milestone` slice in `types.ts`. |
| **D-05** *(inherited)* | Compound shape | 🔒 Ships as a **light** shadcn-style compound (§0) — borderline single-unit, but the subset trigger (bar-only vs bar+label vs bar+ticks) justifies a `Root` + 2 parts + assembly. Flat exports. |
| **D-06** *(inherited)* | Prop-driven, controlled | 🔒 Works standalone with direct props; no provider/store required. |
| **D-07** *(inherited)* | Telemetry | 🔒 Optional `onEvent`; emits `{ type: "progress-bar.checked"; teamId }` only. No env-specific code, never `next/*`. |
| **D-08** *(inherited)* | Cooperative + team-scoped | 🔒 This team's % only; never inter-team / public / per-individual; never a leaderboard/ranking. |
| **D-09** *(inherited)* | Milestone is the spine | 🔒 % derives from `done`/total; no separate progress notion. |
| **D-13** *(inherited)* | Design system | 🔒 Onest + JetBrains Mono, signal-lime fill `oklch(0.80 0.20 132)` light / `oklch(0.86 0.18 132)` dark on near-black foreground, OKLCH tokens, `reveal-up`, chroma ≤ 0.20, no hard-coded colors, no pure-white page bg. |
| **D-15** *(inherited)* | Team prop convention | 🔒 Renders the team name, so takes a `team: { id; name? }` subset (system D-15), not a bare `teamId`+`teamName`. `team.id` carries the telemetry payload. |
| **Q-1** | Light compound vs single sealed widget | **Recommend** the light compound (per D-05). Fallback to a single `team-progress-bar` widget with `showLabel`/`showTicks` props **only if** GATE 2 shows the parts add ceremony without value. *Confirm at sign-off.* |
| **Q-2** | Input: `Milestone[]` vs direct `value` | **Recommend** accept **both** — `value` for the simplest drop-in, `milestones` to enable ticks + "N / M" + the milestone spine. `value` wins if both supplied (dev-warn on redundancy). *Confirm at sign-off.* |
| **Q-3** | Readout format | **Recommend** `labelFormat: "percent" \| "fraction"`, default `"percent"`; `"fraction"` requires `milestones`. *Confirm at plan stage.* |
| **Q-4** | When does `progress-bar.checked` fire? | **Recommend** on first in-viewport reveal (a "feature-viewed" semantic per catalogue C1), debounced to once per mount; optionally also on explicit hover/focus. *Confirm at plan stage — keep it a "viewed" event, not a per-frame storm.* |
| **Q-5** | Animate the fill on `value` change? | **Recommend** yes — a short CSS width transition on the fill (respecting `prefers-reduced-motion`); **not** a celebration (that's E6). *Confirm at plan stage.* |

---

## 8. Risks

- **Scope creep into comparison.** The single biggest risk for *this* component is a well-meaning "just add the other team's bar for context" request. It is excluded by design (system §5.3 / D-08) — the API has no slot for a second series, and that is intentional. GATE 3 verifies no comparison surface leaked in.
- **Over-engineering the compound.** A progress bar is small; a 4-tier compound could be more ceremony than a host wants. Mitigation: keep it to `Root` + 2 parts + assembly, and hold the single-sealed-widget fallback (Q-1) ready if the plan proves the parts add no value.
- **Dual input ambiguity** (`value` vs `milestones`). Both supplied is a real footgun. Mitigation: deterministic precedence (`value` wins) + a dev-mode warning; documented in §4 and the guide.
- **Telemetry storm.** A naïve "fire on render" emits on every re-render. Mitigation: "viewed once per mount" semantics (Q-4), debounced; the event is a feature-view, not a heartbeat.
- **`total === 0` divide.** No milestones yet must render 0%, not `NaN`% or a hidden bar. Covered deterministically in §4.
- **SSR / reveal determinism.** The `reveal-up` entrance and any viewport-based telemetry must be SSR-safe (no layout read on first server paint). Same class of trap the gantt/card solved; the plan documents the seam.
- **Design-token drift.** Easy to reach for a hard-coded green. The fill MUST be the signal-lime token (system D-13); §10 ties every color to a token.

---

## 9. Success criteria

v1 ships when:

1. **Renders this team's milestone %** — `done`/total from a `Milestone[]`, or a direct `value`; every field in §4's table produces its mapped element.
2. **Percentage resolution is deterministic** — §4's resolution holds for all cases (value-only, milestones-only, both, `total === 0`).
3. **Always visible** — no hidden/locked states; `total === 0` renders a 0% bar, not nothing.
4. **This-team-only** — no comparison number, no second bar, no other team's data, no per-individual split anywhere in the rendered output (verified at GATE 3 against system §5.3).
5. **Optional label + ticks** — `showLabel` / `showTicks` / `labelFormat` all render correctly; ticks reflect per-milestone `done` in `order`.
6. **Telemetry** — `onEvent` emits exactly `{ type: "progress-bar.checked"; teamId }`, once per mount (Q-4), with no env-specific code.
7. **Compound is real** — flat exports; the hand-assembled bar-only subset (§6.3) renders; dropping `Label` tree-shakes it; the demo includes a "Composed / lighter" example.
8. **Design system** — signal-lime fill matched to the token in light + dark; Onest/JetBrains Mono; one `reveal-up` entrance; chroma ≤ 0.20; no hard-coded colors.
9. **A11y** — the bar is a proper `role="progressbar"` with `aria-valuenow/min/max`; ticks are decorative-but-labelled; respects `prefers-reduced-motion`.
10. **Portability** — no `next/*`, no `process.env`, SSR-safe, registry-import-clean, imports no other registry component (D-03).
11. **Demo + (deferred) tests** — demo exercises both input modes + label/tick variants + empty (`total === 0`); the percentage-resolution math is unit-testable (Vitest informed-defer per house convention).

---

## 10. Design coverage checklist (what design must produce)

> Each box is a state to define against the **ilinxa-ui-pro design system** ([`src/app/globals.css`](../../../src/app/globals.css)): **signal-lime** fill `oklch(0.80 0.20 132)` light / `oklch(0.86 0.18 132)` dark (always with near-black `--primary-foreground`), cool off-white `--background` / pure-white raised `--card`, graphite-cool dark surfaces, **Onest** (sans) / **JetBrains Mono** (mono, for the numeric readout), one orchestrated `reveal-up` entrance. **Forbidden:** pure-white page backgrounds, neon-saturated lime (chroma ≤ 0.20), Inter/Roboto/Geist/system-font defaults.

**A. Bar anatomy**
- [ ] Track (unfilled) — token: `--muted` / `--secondary`.
- [ ] Fill — token: signal-lime `--primary` (`oklch(0.80 0.20 132)` light / `oklch(0.86 0.18 132)` dark); foreground text on fill = near-black `--primary-foreground`.
- [ ] 0% (empty / `total === 0`) · ~mid · 100% (complete) states.
- [ ] Fill transition animation on value change (respecting `prefers-reduced-motion`).

**B. Label**
- [ ] Numeric readout `"62%"` (JetBrains Mono) · fraction `"5 / 8 milestones"` · with leading team name `"Team Aurora — 62%"`. Text token: `--foreground` / `--muted-foreground`.

**C. Tick marks (optional)**
- [ ] One notch per milestone, in `order` · filled notch (done) vs empty notch · tooltip/`aria-label` from `milestone.label`. Tokens: filled = `--primary`, empty = `--border` / `--muted-foreground`.

**D. Responsive**
- [ ] Full-width header bar · narrow / compact inline · label-wrap or hide at small widths.

**E. Tokens & motion**
- [ ] Map every color to a token (track, fill, fill-foreground, tick filled/empty, label text). One `reveal-up` entrance on first mount; no per-element reveal storm.

---

## 11. Definition of "done" for THIS document (stage gate)

- [ ] §§0–10 drafted, reconciled to `ilinxa-ui-pro` conventions (paths, imports, design tokens) and to the [system description](../../systems/gamification-system/gamification-system-description.md).
- [ ] Data slice pinned to the system's `Milestone` (§4), re-declared locally per D-03 (no shared import).
- [ ] Compound-structure assessed honestly (§0) — declared a **light** compound, with the single-sealed-widget fallback flagged (Q-1).
- [ ] System-inherited decisions (D-03, D-05, D-06, D-07, D-08, D-09, D-13) recorded as locked rows (§7); not re-litigated.
- [ ] Component-specific open questions (Q-1 light-compound, Q-2 dual input, Q-3 readout format, Q-4 telemetry timing, Q-5 fill animation) surfaced with recommended defaults.
- [ ] **User sign-off** → Stage 2 (`team-progress-bar-01-procomp-plan.md`, GATE 2).

After sign-off, changes to this doc are loud and intentional, not silent rewrites.
