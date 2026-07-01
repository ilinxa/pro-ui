# team-trophy-shelf-01 — consumer guide

> Stage 3: how to use it. Companion to the [description](./team-trophy-shelf-01-procomp-description.md) (GATE 1) and [plan](./team-trophy-shelf-01-procomp-plan.md) (GATE 2). Shipped v0.1.0, 2026-07-01. Second component of the [`gamification-system`](../../systems/gamification-system/gamification-system-description.md).

A **team trophy shelf** — a durable gallery of a team's earned milestone badges, with honest locked slots for what's ahead, an optional header count, an awarded-date tooltip, and a brief (< 1s), skippable, non-blocking reveal when a badge is newly earned. Plus the standalone `TeamMilestoneBadge` token, usable inline anywhere.

## When to use

- A **team board's gamification zone** — "what has this team accomplished?" (the durable artifact gallery; the progress bar is the live rate).
- **Inline milestone references** — the bare `TeamMilestoneBadge` next to a quest chapter, a feed item, a milestone row.
- Any **team-achievements surface** that must stay cooperative (team-owned, never a ranking).

## When NOT to use

- **A leaderboard / ranking / per-member tally** → out of scope for the whole system, forever (D-08). No `members`, no "awarded to <person>", no rank.
- **A live completion %** → that's `team-progress-bar-01` (E1).
- **A completion *celebration overlay*** → the in-place shelf reveal is here; a transient full-surface celebration is `team-feedback-loop-01` (E6). See D-16 below.
- **A milestone editor / quest timeline** → the host awards badges (sets `awardedAt`); sequencing is `team-quest-log-01` (E5).

## Quick start

```tsx
import { TeamTrophyShelf01 } from "@/components/team-trophy-shelf-01"

<TeamTrophyShelf01
  team={{ id: team.id, name: team.name }}
  badges={badges}              // earned + not-yet-earned slots
  showLocked                    // show the journey, not just the wins
  onEvent={track}               // { type: "badges.viewed", teamId, badgeId? }
  onBadgeOpen={(b) => openMilestone(b.milestoneId)}
/>
```

## Data — `awardedAt` is the discriminator

```ts
interface Badge {
  id: string
  label: string
  awardedAt?: string   // ISO 8601; undefined → not yet earned (locked slot)
  milestoneId?: string // the milestone that earned it (optional link)
}
interface Team { id: string; name?: string }   // name only feeds an optional header title
```

Present `awardedAt` → earned (full lime medallion + awarded-date tooltip). Absent → a locked slot (desaturated, dashed, `Lock` glyph). Flip it from `undefined` → a timestamp and that badge plays the reveal.

## Props

| Prop | Default | Notes |
|---|---|---|
| `badges` | — | earned + (optional) locked slots |
| `team` | — | `{ id, name? }` — `id` scopes telemetry; `name` is an optional title fallback |
| `showLocked` | `true` | render not-yet-earned slots |
| `showHeader` | `true` | title + earned-count pill ("4 / 9") |
| `title` | `${team.name} trophies` | overrides the header title |
| `size` | `"md"` | token size (`"sm"` for dense/inline) |
| `animateAward` | `true` | play the diff-driven reveal (see D-16) |
| `onEvent` | — | `badges.viewed` telemetry |
| `onBadgeOpen` | — | fires when a badge is opened; **also makes tokens interactive buttons** |
| `renderBadgeIcon` | — | custom badge artwork (falls back to a lucide glyph) |

## The award reveal (D-10 + D-16)

- **Diff-driven + SSR-safe:** nothing animates on load. The reveal only plays when a *controlled* `badges` update flips a badge's `awardedAt` on. First paint is always the settled state (no hydration flash).
- **Non-blocking:** the burst is `aria-hidden`, never traps or steals focus, never blocks input/scroll, and clears itself in < 1s.
- **Reduced-motion:** `prefers-reduced-motion` skips straight to the settled token.
- **D-16 — celebration ownership:** if you *also* route badge/milestone events to a `team-feedback-loop-01` (E6) overlay, set **`animateAward={false}`** here so the moment isn't celebrated twice. Neither component triggers the other — you wire exactly one path per event kind.

## Composition — the compound

```tsx
import {
  TeamTrophyShelfRoot, TeamTrophyShelfGrid, TeamMilestoneBadge,
} from "@/components/team-trophy-shelf-01"

// Bare token — no shelf chrome, no award chunk in the bundle:
<TeamMilestoneBadge badge={badge} size="sm" />

// Custom layout, no header, award chunk never loaded:
<TeamTrophyShelfRoot team={team} badges={badges} animateAward={false}>
  <section className="rounded-xl border p-4">
    <h3 className="font-mono text-xs uppercase tracking-wide">Team trophies</h3>
    <TeamTrophyShelfGrid />
  </section>
</TeamTrophyShelfRoot>
```

- `TeamTrophyShelfRoot` — headless: resolves slots, owns the diff + telemetry, holds context.
- `TeamTrophyShelfGrid` / `TeamTrophyShelfHeader` / `TeamTrophyShelfEmpty` — flat context parts.
- `TeamMilestoneBadge` — the context-free Tier-C token (earned + locked, `sm`/`md`, `renderIcon`, `onOpen`).
- `BadgeAwardOverlay` — the reveal burst, **`React.lazy`**: it's a separate chunk, so the bare-token path and `animateAward={false}` never pull it.
- `useTeamTrophyShelf()` — read the resolved state in a hand-assembled layout (throws outside `Root`).

## Accessibility

- The grid is a `role="list"`; each token is a `listitem`. Each badge's `aria-label` states the label, the earned/locked state, and (if earned) the awarded date — so the state reads without color vision (glyph + text, never color alone).
- A token is a real `<button>` **only** when `onBadgeOpen` is wired; otherwise it's a non-focusable `role="img"` (no dead affordances). The awarded date is always in the `aria-label`; the tooltip is a hover enhancement.
- The reveal is non-blocking and reduced-motion-safe.

## Portability

Zero `next/*`, no app context, SSR-safe, imports **no other registry component** — only the shadcn `tooltip` / `badge` / `separator` primitives + lucide glyphs. Install:

```bash
pnpm dlx shadcn@latest add @ilinxa/team-trophy-shelf-01
# fixtures (sample badges): add @ilinxa/team-trophy-shelf-01-fixtures
```
