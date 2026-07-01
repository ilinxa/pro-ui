# team-progress-bar-01 — consumer guide

> Stage 3: how to use it. Companion to the [description](./team-progress-bar-01-procomp-description.md) (GATE 1) and [plan](./team-progress-bar-01-procomp-plan.md) (GATE 2). Shipped v0.1.0, 2026-07-01. First component of the [`gamification-system`](../../systems/gamification-system/gamification-system-description.md).

An **always-visible, read-only** progress bar that reports **one team's milestone-completion %** for a team-board header. Signal-lime fill, optional per-milestone tick notches, an optional percent/fraction readout, a reduced-motion-aware fill transition, and a `progress-bar.checked` telemetry event fired once when the bar is first viewed. It builds **competence** (SDT) without ever tipping into comparison.

## When to use

- A **team-board header** — the always-on "how far is *our team* through the journey?" cue.
- A **standalone "% done" drop-in** — `<TeamProgressBar01 team value />` with no other infrastructure.
- The **gamification-system host** — feed it the same `Milestone[]` you feed the (future) trophy shelf / quest log.

## When NOT to use

- **Comparison / ranking / leaderboards** → out of scope for the whole system, forever (D-08). There is no `compareTo`, no `teams[]`, no per-member split, and there never will be.
- **A milestone editor or timeline** → the host owns milestone data + mutation; chapter/beat framing is the (future) `team-quest-log-01`.
- **A completion celebration overlay** → that's the (future) `team-feedback-loop-01` (E6). This bar may animate its fill, but the burst lives elsewhere.
- **A generic multi-series progress widget** → one team, one series, one %.

## Quick start

```tsx
import { TeamProgressBar01 } from "@/components/team-progress-bar-01"

<TeamProgressBar01
  team={{ id: team.id, name: team.name }}
  milestones={team.milestones}     // % = done / total
  showTicks
  labelFormat="fraction"           // "5 / 8 milestones"
  onEvent={(e) => analytics.track(e.type, e)}  // host adds the envelope
/>
```

Or the simplest standalone form — a direct 0–100 number:

```tsx
<TeamProgressBar01 team={{ id: "T-001", name: "Team Aurora" }} value={62} />
```

## Two input modes

| Prop | Behavior |
|---|---|
| `milestones?: Milestone[]` | Component computes `done / total`. Enables tick marks + the `"fraction"` readout. |
| `value?: number` | A direct 0–100 percentage. **Wins** if both are supplied (and dev-warns the redundancy). |

`value` is clamped to `0..100`. No milestones and no value → **0%** (the bar still renders — always visible, never `NaN`, never hidden).

```ts
interface Milestone {
  id: string
  label: string     // tick-mark tooltip
  done: boolean      // counts toward the numerator
  doneAt?: string    // ISO 8601 — reserved, not rendered
  order: number      // left-to-right tick ordering
}
```

## Display props

| Prop | Default | Notes |
|---|---|---|
| `showLabel` | `true` | The numeric readout. |
| `showTicks` | `false` | Per-milestone notches (needs `milestones`). |
| `labelFormat` | `"percent"` | `"percent"` → `"62%"`; `"fraction"` → `"5 / 8 milestones"`. `"fraction"` without milestones falls back to percent (+ dev-warn). |
| `aria-label` | `"<team> progress: <pct>%"` | Override the progressbar's accessible name. |

## Composition patterns

It ships as a **light shadcn-style compound**. The batteries-included `TeamProgressBar01` is just `TeamProgressBarRoot` + `TeamProgressBarLabel` + `TeamProgressBarTrack`. Compose the parts directly for a lighter / custom build — drop the `Label` and it tree-shakes away:

```tsx
import {
  TeamProgressBarRoot, TeamProgressBarTrack,
} from "@/components/team-progress-bar-01"

<TeamProgressBarRoot team={{ id: "T-001" }} milestones={team.milestones}>
  <TeamProgressBarTrack showTicks />   {/* bar only, no readout */}
</TeamProgressBarRoot>
```

- `TeamProgressBarRoot` — headless: resolves the %, owns the telemetry emit, holds context. The single source of truth.
- `TeamProgressBarTrack` — the lime fill bar (+ optional ticks). Reads context.
- `TeamProgressBarLabel` — the readout. Reads context.
- `ProgressTrack` — a **context-free** Tier-C primitive: a dumb lime fill bar that takes a `pct` (0–100), usable anywhere with zero telemetry/context.
- `useTeamProgressBar()` — read the resolved progress in a hand-assembled layout (throws outside `Root`).

## Telemetry

The only event is `progress-bar.checked`:

```ts
type GamificationEvent = { type: "progress-bar.checked"; teamId: string }
```

- Fired **once per mount**, on the bar's first in-viewport reveal (IntersectionObserver, ≥ 1px), then the observer disconnects. It is a *feature-viewed* signal, **not** a per-render heartbeat.
- **Omit `onEvent`** and no observer is created (pay-for-what-you-use).
- The component emits only the semantic event; **you** add the envelope (timestamp, anonymized IDs, app variant) at your transport layer.
- An inline `onEvent={e => …}` is safe — it's read through a ref, so it never re-subscribes the observer.
- *Note:* "once per mount" means swapping the `team` prop on an already-mounted, already-viewed bar does **not** re-fire.

## Accessibility

- The bar is a proper `role="progressbar"` with `aria-valuenow` / `aria-valuemin` / `aria-valuemax` (from the underlying Radix `Progress`), plus an `aria-label`. This is the single accessible representation of the value — even with `showLabel={false}`.
- Tick marks are decorative (`aria-hidden`) and carry a `title` from `milestone.label`; done vs pending is conveyed by thickness as well as color.
- The fill transition and the `reveal-up` entrance both respect `prefers-reduced-motion: reduce`.

## Design system

The fill is the signal-lime `--primary` token (light + dark), the track is `--muted`, the readout is JetBrains Mono (`font-mono`, `tabular-nums`). No hard-coded colors. One `reveal-up` entrance on mount.

## Portability

Zero `next/*`, no app context, no `process.env` at runtime (only a dev-warn guard, erased in production), SSR-safe, and it imports **no other registry component** — only the shadcn `progress` primitive. Install:

```bash
pnpm dlx shadcn@latest add @ilinxa/team-progress-bar-01
# fixtures (sample milestones): add @ilinxa/team-progress-bar-01-fixtures
```
