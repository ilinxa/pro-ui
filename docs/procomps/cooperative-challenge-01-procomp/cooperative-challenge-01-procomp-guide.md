# cooperative-challenge-01 — consumer guide

> The **Relatedness** surface of the [`gamification-system`](../../systems/gamification-system/gamification-system-description.md) (E3). A safe-by-design cooperative team challenge: one shared goal, collective progress, a whole-team reward, and a **penalty-free** opt-in. Third component of the pack.

Install: `pnpm dlx shadcn@latest add @ilinxa/cooperative-challenge-01` (add `@ilinxa/cooperative-challenge-01-fixtures` for the sample data).

## When to use

- A team app wants a **cooperative** challenge next to its progress bar / trophy shelf — one shared goal, collective progress, a reward the whole team earns together.
- You need a challenge surface that is **safe by design**: never forced, never per-individual, never competitive.
- You need only a **penalty-free join/leave toggle** to drop onto an existing surface (use the bare `OptInToggle`).

## When NOT to use

- **Competitive** challenges, leaderboards, or per-member ranking — excluded by design (there is no prop for them, on purpose).
- **Individual** goals/streaks — this is a *team* surface.
- The milestone progress bar → use `team-progress-bar-01` (E1). The heavy completion celebration → `team-feedback-loop-01` (E6).

## Quick start

```tsx
import { CooperativeChallenge01 } from "@/components/cooperative-challenge-01";

export function TeamChallengeZone({ challenge, team }) {
  return (
    <CooperativeChallenge01
      challenge={challenge} // { id, label, optedIn, progress:{current,target}, reward?, done }
      team={team}           // { id, name, members:[{ id, displayName, avatarUrl? }] }
      onOptInChange={(optedIn) => persistOptIn(team.id, challenge.id, optedIn)}
      onEvent={(e) => analytics.track(e.type, e)}
    />
  );
}
```

## The data

| Field | Renders as |
|---|---|
| `challenge.label` | Header label (truncated; full text on `title`) |
| `challenge.progress.current / .target` | **Collective** meter + `current / target` count (mono). Never per-member. |
| `challenge.reward` | Whole-team reward chip ("The team earns/earned: …"). Omit → hidden. |
| `challenge.optedIn` | Controlled opt-in value → drives the Join/Leave control + card emphasis |
| `challenge.done` | Lightweight inline "Completed together" earned treatment (wins over `optedIn`) |
| `team.name` | Optional secondary header line |
| `team.members[]` | `TeamMemberStack` avatar pile (identity only) |

## Never-forced (the load-bearing rule)

This component exists to make refusing **cost-free and obvious**:

- **Opted-out is a first-class, neutral, joinable state** — full-opacity `--card`/`--muted`, an "Optional" badge, a prominent **Join** action, and a visible *no-penalty* hint. It is never greyed-as-failure.
- **Leaving is one click** — no confirm dialog, no "are you sure you want to abandon?" copy, no warning tone. As cost-free as joining.
- There is **no prop, mode, or path** that forces a team in or blocks leaving.

Localize the framing with `joinLabel` / `leaveLabel` / `noPenaltyHint`.

## Controlled opt-in

`challenge.optedIn` **is** the value — the host owns it and persists it. `onOptInChange(next)` fires on toggle; re-render with the new `challenge.optedIn`. **Omit `onOptInChange`** and the control hides entirely — a read-only progress + reward card falls out for free (capability-gating).

## Composition (light compound)

```tsx
// Read-only card — just omit the handler:
<CooperativeChallenge01 challenge={challenge} team={team} />

// Card body only (no control):
<CooperativeChallenge01 challenge={challenge} team={team} showOptIn={false} />

// Just the penalty-free toggle, on any surface (context-free, no Root):
import { OptInToggle } from "@/components/cooperative-challenge-01";
<OptInToggle optedIn={challenge.optedIn} onOptInChange={join} />

// Hand-assembled from parts (identical behavior to the assembly):
import {
  CooperativeChallengeRoot, CooperativeChallengeHeader,
  CooperativeChallengeProgress, CooperativeChallengeReward, CooperativeChallengeOptIn,
} from "@/components/cooperative-challenge-01";

<CooperativeChallengeRoot challenge={challenge} team={team} onOptInChange={join} onEvent={track}>
  <CooperativeChallengeHeader />
  <CooperativeChallengeProgress />
  <CooperativeChallengeReward />
  <CooperativeChallengeOptIn />
</CooperativeChallengeRoot>
```

`show*` props on the assembly map to mounting/not-mounting parts: `showOptIn`, `showReward`, `showMemberStack`. A loading state is a component, not a prop — mount `<CooperativeChallengeSkeleton />` while fetching.

## The done state vs E6

`done` renders a **lightweight inline "Completed together" ack** (a pill, non-blocking, no modal, reduced-motion-safe). The **heavy celebration overlay is `team-feedback-loop-01` (E6)** — compose it alongside and route the challenge-done event there. Neither component triggers the other; the host wires exactly one celebration path per event.

## Telemetry

`onEvent` (optional; omit → no-op) emits the local two-event slice:

- `{ type: "challenge.opened", teamId, challengeId }` — once on first mount (StrictMode-safe; re-fires only on a new `challenge.id`).
- `{ type: "challenge.opt-in", teamId, challengeId, optedIn }` — on toggle.

No analytics SDK, no `next/*`. The host adds the envelope (timestamp, anonymized IDs) at its transport layer.

## Accessibility

- The card is a labelled `role="group"` (`aria-label` defaults to the challenge label).
- The opt-in control is a labelled `<button>` with `aria-pressed`; the visible text is the label; the no-penalty hint is `aria-describedby`-associated.
- The meter is a `role="progressbar"`; AT reads the count ("3 of 5") via `aria-valuetext`, not a bare %.
- The member stack is one label ("5 team members"), avatars decorative; the completed transition is announced once via `aria-live="polite"` (no focus steal).
- State is never conveyed by color alone (badge/glyph + text).

## Design system

Signal-lime (`--primary`) for active/earned; neutral `--card`/`--muted` for joinable (never `--destructive`); reward chip token-based; one `reveal-up` entrance; the completed micro-motion respects `prefers-reduced-motion`.

## Portability

Zero `next/*`, no app context, no other registry import. Own `types.ts` slice (system D-03). SSR-safe. Only the shadcn `progress` / `avatar` / `button` / `badge` / `skeleton` primitives + `lucide-react`.
