# `team-trophy-shelf-01` — Pro-component Description (Stage 1 / GATE 1)

> **Stage:** 1 of 3 · **Status:** DRAFT — pending GATE 1 sign-off
> **Slug:** `team-trophy-shelf-01` · **Category:** `gamification` · **Tier:** pro-component (ships as a **shadcn-style compound** — see §0)
> **Element / SDT need:** E2 (Team Milestone Badges) / **Competence + Relatedness**
> **System:** member of the `gamification-system`. The shared contract is the [gamification system description](../../systems/gamification-system/gamification-system-description.md); upstream extraction is the [gamification elements catalogue](../../systems/gamification-system/gamification-elements-catalogue.md) (components **C2 + C3**). Where this doc and the system description disagree, **the system description wins** — flag it back there.

This is the **description** doc (the "what & why"). Its job: pin down what we're building and why, inventory the data it renders and the states it must cover, surface the open design decisions, and earn sign-off before any planning or code.

> 🎯 **Read-me-first.** This component renders a **team trophy shelf** — a gallery of earned **team milestone badges** ("First playable build"), plus a single **badge primitive** (one token) usable standalone, plus a subtle **award animation** when a badge is newly earned. Badges **belong to the team, not individuals** (system D-08), and the shelf renders **only on the team board — never on a public or inter-team surface**. §4 is the exact data slice; §10 is the coverage checklist.

---

## 0. Compound-structure declaration (mandated)

`team-trophy-shelf-01` trips the [compound rule](../../../.claude/rules/compound-component-structure.md): a consumer can reasonably want **only the bare badge token** (rendered inline next to a milestone, in a tooltip, in a feed item) without the shelf chrome, the empty/locked-slot logic, or the award-animation overlay. That subset must fall out for free. It is also the system's locked decision **D-05** (each component ships as a shadcn-style compound). **Therefore it ships as a shadcn-style compound** — headless `Root` provider + flat à-la-carte parts + standalone primitives + one logic-free assembly. Flat exports, never a `Name.Root` namespace.

This is a **small** compound (one heavy-ish concern — the award animation — and one genuinely-reusable primitive). The Tier-C `TeamMilestoneBadge` is the load-bearing reason for the compound: it is the standalone "one token" deliverable.

**Rough part inventory** (precise tier split + names locked at GATE 2):

| Tier | Members (rough) | Role |
|---|---|---|
| **B — headless Root** | `TeamTrophyShelfRoot` | Owns the badge list (earned + optional locked slots), derives newly-earned diff for the award trigger, owns hover/focus + selection state, fires `onEvent` (`badges.viewed`), holds the context. Renders `children`. |
| **B — context parts** (flat) | `TeamTrophyShelfGrid` · `TeamTrophyShelfHeader` (optional count/title) · `TeamTrophyShelfEmpty` | One module per region; each reads `useTeamTrophyShelf()` — no prop-drilling. |
| **C — standalone primitives** (context-free) | `TeamMilestoneBadge` (the bare token — earned + locked variants) · `BadgeAwardOverlay` (the brief reveal animation) | Dumb, prop-driven; usable anywhere outside the shelf. |
| **A — assembly** | `TeamTrophyShelf01` | `Root` + the parts above, gated by `show*` toggles. Contains no logic the parts don't. Demo + screenshot use this. |

**Tree-shaking story:** each part is its own module re-exported from the barrel. The **award animation** (`BadgeAwardOverlay`) is the one weight-bearing piece — if it pulls a motion lib (canvas confetti / framer-style spring), it is `React.lazy` so a consumer rendering only `TeamMilestoneBadge` (or the shelf with `animateAward={false}`) never pulls the animation code into their graph. A bare-token-only consumer imports just `TeamMilestoneBadge` and pulls nothing else.

---

## 1. Problem

A team-management app's board needs a **"what has this team accomplished?"** surface that the progress bar (E1, a single live %) can't express: a **durable gallery of earned milestone trophies** the team can look back on. Badges are the *artifacts* of progress; the progress bar is the *rate*. Both derive from the same milestones (system D-09), but the shelf answers a different question — recognition + shared pride, not status.

Concretely the host needs:

1. a **shelf** that lays out the team's earned milestone badges as a gallery,
2. an honest treatment of **earned vs not-yet-earned** so the team sees what's ahead (recommended: render locked/empty slots — §7),
3. a **single badge token** reusable anywhere a milestone is referenced (next to a quest chapter, in a feed, in a tooltip) — *the same visual language* as the shelf, not a re-skin,
4. a **brief, skippable, non-blocking award animation** when a badge is newly earned (system D-10) — celebration without interruption,
5. all of it **team-owned and team-board-only** (system D-08): never public, inter-team, or per-individual.

Today a host hand-rolls this each time (badge anatomy, locked-slot states, the award reveal, a11y), usually skipping accessibility and the locked-state design. This procomp is that primitive — the E2 slice of the gamification layer.

**SDT grounding (why E2 maps to two needs):** badges elevate **Competence** (visible mastery markers; Sailer et al. 2017) and, because they are team-owned and celebrated together, **Relatedness** (cooperative-design synthesis, catalogue C3). This dual mapping is why the award animation and the team-ownership constraint are first-class, not decoration.

---

## 2. In scope / Out of scope

### v1 — in scope

**The shelf**
- A **gallery** of the team's badges, laid out in a responsive grid/row.
- **Earned badges** render fully (icon/label, awarded date, optional milestone link); **not-yet-earned** badges render as **locked/empty slots** (recommended default — §7-D-c) so the team sees its journey, not just the wins.
- **Empty state** (no badges defined at all, or none earned yet) — designed, not an afterthought.
- Optional **header** (title + earned-count, e.g. "4 / 9 trophies").

**The badge token (Tier-C `TeamMilestoneBadge`)**
- A single, self-contained badge: icon/glyph, label, and an **earned vs locked** visual state. Earned shows the award affordance (date on hover/tooltip); locked is dimmed/desaturated with a lock cue.
- Usable **standalone** — drop one next to a milestone, in a quest chapter, in a tooltip, with zero shelf scaffolding.
- Optional size variant (`sm` token vs full shelf tile).

**The award animation (Tier-C `BadgeAwardOverlay`)**
- A **brief (< 1s), skippable, non-blocking** reveal when a badge transitions from not-earned → earned (system D-10). No modal, no blocking overlay, no focus trap.
- Trigger is **diff-driven** (recommended — §7-D-d): the Root compares the incoming badge list against the previous render and animates only the *newly-earned* badges. A consumer can opt out (`animateAward={false}`) or force it imperatively.
- Honors `prefers-reduced-motion` (skips to the settled state).

**Telemetry**
- Optional `onEvent?: (e: GamificationEvent) => void`. Emits `{ type: "badges.viewed"; teamId: string; badgeId?: string }` — fired once on first meaningful view of the shelf, and (with `badgeId`) when an individual badge is opened/inspected (system D-07, §6 of the system description).

**Team-scope + cooperative-only (hard constraints — system §5, D-08)**
- Renders **only this team's** badges; never a comparison, another team's shelf, or a per-member breakdown.
- Team-owned: no "awarded to <person>"; the audience is the team.
- Never on a public or inter-team surface (the host enforces placement; the component carries no public-surface affordances).

**Portability**
- Zero `next/*`, no `process.env`, no app context. SSR-safe (award diff computes client-side after first paint; first paint is the settled state — no animation flash on hydration). Registry-import-clean: only `react`, `@/components/ui/*`, `@/lib/utils`, and declared third-party deps. **Imports no other registry component** (system D-03) — declares its own `Badge` / `Team` slice in its own `types.ts`.

### v1 — out of scope (deferred)

- **Badge editing / awarding from the UI** — the host awards badges (sets `awardedAt`); the shelf is a display + celebration surface, not an editor.
- **Badge rarity tiers / point values / scoring** — excluded by the cooperative-only mandate (no points; system §5.3).
- **Per-member badge attribution** — excluded by design (team-owned only; system D-08).
- **Drag-to-reorder / custom badge layout** — host controls order via array order; no in-shelf reordering in v1.
- **Sharing / export (image/social)** — would risk a public surface (system §5); host concern if ever.
- **Custom badge artwork pipeline** — v1 takes an icon name/glyph from the host; rich illustrated badge assets are a host-supplied slot, not a v1 feature.
- **Persistence / backend** — host owns data (system §11).

### Deliberate non-goals (any version)

- **Not a leaderboard.** No ranking, no inter-team comparison, no per-member tally — ever (system §5.3).
- **Not a progress bar.** Live completion % is `team-progress-bar-01` (E1); the shelf is the durable artifact gallery.
- **Not a notification/toast system.** The award animation is an in-place reveal on the shelf/token, not a global toast queue.
- **Not a quest timeline.** Milestone-as-narrative-chapters is `team-quest-log-01` (E5); the shelf references milestones but doesn't sequence them.

---

## 3. Target consumers

| Archetype | Example | What they need |
|---|---|---|
| **Team board / gamification zone** *(primary)* | The team-board's gamification panel | A trophy shelf showing this team's earned + upcoming badges, with a celebratory reveal when one lands |
| **Bare-badge inline use** *(primary)* | A milestone row, a quest chapter, a feed item | The `TeamMilestoneBadge` token alone — same visual language, no shelf chrome |
| **Generic team app** *(secondary)* | Any "team achievements" surface beyond the gamification study | A reusable team-owned badge gallery, decoupled from the rest of the pack |

Non-targets: public profile pages, inter-team comparison views, per-individual achievement walls (all excluded by system §5.3 / D-08), live-rate displays (→ `team-progress-bar-01`).

---

## 4. Data structure — what each badge is drawn from

**The component declares its own slice** of the shared domain model in its own `types.ts` (system D-03 — imports no other registry component). This is the contract, not a shipped module; it is the E2-relevant subset of the system's §4 model:

```ts
// Declared in team-trophy-shelf-01/types.ts — NOT imported from another component.
interface Badge {
  id: string;            // → React key; entity id in telemetry (badgeId)
  label: string;         // → badge label ("First playable build")
  awardedAt?: string;    // ISO 8601; undefined → NOT yet earned (locked/empty slot)
  milestoneId?: string;  // → the milestone that earned it (shared spine, D-09)
}

interface Team {
  id: string;            // → teamId in telemetry
  name: string;          // → fallback header title ("<name>'s trophies")
}
```

> The component is given `Team` (for telemetry `teamId` + an optional header title) and `Badge[]` (the team's badges — earned and, optionally, not-yet-earned slots). `awardedAt` is the **single source of truth for earned vs locked**: present → earned (and drives the "awarded date" + the diff-based award animation); absent → locked slot.

### Field → visual mapping (the design table)

| `Badge` / `Team` field | Where it shows | Notes for design |
|---|---|---|
| `label` | Badge label (token + shelf tile) | Truncate with ellipsis; full label in tooltip |
| `awardedAt` **present** | **Earned state** — full color/icon + awarded date | Date on hover/tooltip; never per-person |
| `awardedAt` **absent** | **Locked slot** — dimmed/desaturated + lock cue | Recommended default (§7-D-c); shows the team what's ahead |
| `awardedAt` **newly present** (diff vs prev render) | **Award animation** triggers | Brief < 1s, skippable, non-blocking (D-10) |
| `milestoneId` | Optional link/affordance from badge → its milestone | Optional; host wires what opens (no required target) |
| `Team.name` | Optional shelf header title | Falls back if no explicit `title` prop |
| `Team.id` | — (telemetry only) | `teamId` in every emitted event |
| `Badge.id` | React key + telemetry `badgeId` | Stable identity for the award diff |

### Earned-vs-locked resolution (deterministic — lock this in design)

```
isEarned   = badge.awardedAt != null
isLocked   = badge.awardedAt == null          → render as locked/empty slot (if showLocked)
isNewAward = isEarned && prevById[badge.id]?.awardedAt == null   → animate this badge
```

---

## 5. Rough API sketch (NOT final — that's the plan stage)

Illustrative. The canonical shape lands in `team-trophy-shelf-01/types.ts` at plan stage; defer to it on naming. Types are **declared here, not imported** (system D-03).

```ts
import type { GamificationEvent } from "./types"; // local slice; the system §6 union narrowed to badges.viewed

export type TeamTrophyShelfProps = {
  /** This team's badges — earned AND (optionally) not-yet-earned slots. */
  badges: Badge[];
  /** The owning team (telemetry teamId + optional header title fallback). */
  team: Team;

  // Display
  /** Render not-yet-earned badges as locked slots. Default true (recommended §7-D-c). */
  showLocked?: boolean;
  /** Optional shelf header (title + earned count). Default true. */
  showHeader?: boolean;
  /** Override the header title; defaults to `${team.name} trophies`. */
  title?: string;
  /** Token size in the shelf. Default "md". */
  size?: "sm" | "md";

  // Award animation (non-blocking, < 1s, skippable — D-10)
  /** Animate newly-earned badges (diff vs previous render). Default true. */
  animateAward?: boolean;

  // Telemetry (system D-07 / §6)
  onEvent?: (e: GamificationEvent) => void;

  // Interaction (optional)
  /** Fired when a badge is opened/inspected; consumer wires what opens. */
  onBadgeOpen?: (badge: Badge) => void;

  // Slots (optional, advanced)
  /** Custom badge artwork by icon name/glyph or full render. */
  renderBadgeIcon?: (badge: Badge) => React.ReactNode;

  className?: string;
  "aria-label"?: string;
};

// Tier-C bare token — usable with zero shelf scaffolding.
export type TeamMilestoneBadgeProps = {
  badge: Badge;
  size?: "sm" | "md";
  /** Render the locked state when not earned. Default true. */
  showLocked?: boolean;
  onOpen?: (badge: Badge) => void;
  renderIcon?: (badge: Badge) => React.ReactNode;
  className?: string;
};
```

**Surface budget:** small. Counting *feature concepts* and excluding boilerplate (`className`, `aria-label`): the shelf is **~9 concepts**, the bare token **~5** — comfortably under the ~25 ceiling. If a real v1 blows past ~15 shelf concepts, the API is wrong and we restart this section; the compound parts absorb the overflow.

---

## 6. Example usages

### 6.1 — The trophy shelf on the team board (the primary consumer)

```tsx
import { TeamTrophyShelf01 } from "@/registry/components/gamification/team-trophy-shelf-01";

function TeamGamificationZone({ team, badges }: { team: Team; badges: Badge[] }) {
  return (
    <TeamTrophyShelf01
      team={team}
      badges={badges}            // earned + not-yet-earned slots
      showLocked                 // show the journey, not just the wins
      onEvent={track}            // host wires { type: "badges.viewed", teamId, badgeId? }
      onBadgeOpen={(b) => openMilestone(b.milestoneId)}
    />
  );
}
```

When the host flips a badge's `awardedAt` from `undefined` to a timestamp (a milestone completed), that badge plays the brief award reveal in place — no toast, no modal, no blocked input.

### 6.2 — The bare badge token, inline next to a milestone (proves the lighter path)

```tsx
import { TeamMilestoneBadge } from "@/registry/components/gamification/team-trophy-shelf-01";

// In a quest chapter, a feed item, or a milestone row — no shelf, no animation overlay.
<li className="flex items-center gap-2">
  <TeamMilestoneBadge badge={badge} size="sm" />
  <span>{milestone.label}</span>
</li>
```

This imports **only** the Tier-C token — the shelf chrome, locked-slot grid logic, and the (potentially lazy) award animation never enter the consumer's bundle.

### 6.3 — Composed / lighter shelf (custom layout, no header) — proves the compound path

```tsx
import {
  TeamTrophyShelfRoot, TeamTrophyShelfGrid,
} from "@/registry/components/gamification/team-trophy-shelf-01";

<TeamTrophyShelfRoot team={team} badges={badges} animateAward={false}>
  <section className="rounded-xl border p-4">
    <h3 className="font-mono text-xs uppercase tracking-wide">Team trophies</h3>
    <TeamTrophyShelfGrid />
  </section>
</TeamTrophyShelfRoot>
```

A consumer who wants a custom header drops `TeamTrophyShelfHeader`, brings their own, and with `animateAward={false}` the lazy animation module never loads.

---

## 7. Decisions

System-inherited rows are **locked** (they propagate from the [system description §8](../../systems/gamification-system/gamification-system-description.md) and cannot be re-litigated here). Component-specific rows recommend a default to confirm at sign-off / plan stage.

### System-inherited (locked — from the system description)

| # | Decision | Source |
|---|---|---|
| **D-03** | **Independent at the registry level** — imports NO other registry component; declares its own `Badge` / `Team` slice in its own `types.ts`. | system D-03 |
| **D-05** | **Ships as a shadcn-style compound** — `Root` + flat parts (`TeamTrophyShelfGrid`, …) + Tier-C `TeamMilestoneBadge` + `BadgeAwardOverlay` + a logic-free `<TeamTrophyShelf01>` assembly. Flat exports (never `X.Root`); heavy animation dep `React.lazy`. | system D-05; [compound rule](../../../.claude/rules/compound-component-structure.md) |
| **D-06** | **Prop-driven, controlled, self-sufficient** — works standalone with direct props; no provider/store required. | system D-06 |
| **D-07** | **Telemetry via optional `onEvent`** — emits `{ type: "badges.viewed"; teamId; badgeId? }`; no env-specific code. | system D-07; system §6 |
| **D-08** | **Cooperative-only + team-scoped** — team-owned badges only; never inter-team / public / per-individual. | system D-08; system §5 |
| **D-09** | **Milestone is the shared spine** — a badge references `milestoneId`; the host defines milestones + sets `awardedAt`. | system D-09 |
| **D-10** | **Award animation is brief (< 1s), skippable, non-blocking** — no modal blocking; honors `prefers-reduced-motion`. | system D-10 |
| **D-13** | **Design-system mandate** — Onest + JetBrains Mono, signal-lime accent, OKLCH only, [globals.css](../../../src/app/globals.css) tokens, `reveal-up`, no hard-coded colors, chroma ≤ 0.20. | system D-13 |

### Component-specific (recommend a default — confirm at sign-off)

| # | Question | Recommendation |
|---|---|---|
| **D-a** | **Compound shape** | **Compound** (per D-05): the bare `TeamMilestoneBadge` token is a genuine standalone deliverable, so the subset must fall out. Rough inventory in §0; precise tier split at GATE 2. |
| **D-b** | **Where does the bare badge live — its own procomp or a part of this one?** | **A part of this one** (system Q2: sub-parts live inside the compound). The token is Tier-C; no separate `milestone-badge-01` procomp. |
| **D-c** | **Earned vs not-yet-earned slots** | **Render locked/empty slots by default** (`showLocked={true}`). Showing the journey (what's ahead) reinforces Competence + gives the shelf shape even early on. `showLocked={false}` collapses to earned-only. `awardedAt` is the single discriminator (§4). |
| **D-d** | **Award-animation trigger** | **Diff-driven** — the Root compares incoming `badges` vs the previous render and animates only newly-earned (`awardedAt` newly present). No imperative "play" call required in the common case; `animateAward={false}` opts out; an imperative handle (`playAward(id)`) is a nice-to-have for the plan. SSR-safe: first paint is the settled state (no hydration flash). **Per system D-16 (celebration ownership):** a host that routes badge/milestone events to `team-feedback-loop-01` sets `animateAward={false}` here so the moment isn't celebrated twice. |
| **D-e** | **Animation weight / dependency** | **Lazy, lightweight.** Prefer CSS/`reveal-up`-family keyframes for the core reveal (no dep). If a richer celebration (confetti/spark) is wanted, isolate it in `BadgeAwardOverlay` as a `React.lazy` boundary so the bare-token path and `animateAward={false}` never pull it. Decide the exact treatment at design/plan. |
| **D-f** | **Badge artwork source** | **Host-supplied icon/glyph via `renderBadgeIcon` slot**, with a sensible token default (lucide glyph + label). No artwork pipeline in v1 (§2 out-of-scope). |
| **D-g** | **Slug / category** | `gamification/team-trophy-shelf-01`. `-01` suffix per library convention; `gamification` is the new category (system D-01, one-off plumbing before GATE 2). |
| **D-h** | **Telemetry firing model** | `badges.viewed` (no `badgeId`) fires **once** on first meaningful shelf view; `badges.viewed` (with `badgeId`) fires on `onBadgeOpen`. Avoid firing on every hover. |

---

## 8. Risks

- **Visual coherence of locked vs earned.** The locked state must read as "not yet" without looking broken/disabled-in-error. Design must specify the desaturation + lock cue against light + dark `--card`/`--background`, chroma ≤ 0.20.
- **Award animation must not block or flash.** SSR/hydration: the first paint is the *settled* state; the diff (and thus the animation) only runs after mount with a real previous value — otherwise every badge "awards" on load. Plan must state the seam (e.g. `prevBadgesRef` initialized to the first render, animation gated on a mounted flag). This is the same set-state-in-effect / SSR-determinism trap calendar-01 and the card solved.
- **Lazy animation boundary correctness.** `BadgeAwardOverlay` must be a real `React.lazy` boundary so the bare-token path and `animateAward={false}` truly drop the weight — verify at GATE 3 (the compound rule's lazy-boundary check). If the reveal is pure CSS this risk evaporates; decide early.
- **`prefers-reduced-motion`.** Must skip to the settled state, not just shorten — verify.
- **Team-scope leakage.** Easy to accidentally add a per-person "awarded to" or a count that implies comparison. The component must carry **no** per-individual or inter-team affordance (system §5.3 hard constraint; GATE 3 verifies).
- **Telemetry over-firing.** `badges.viewed` on every render/hover would spam the host's analytics. Lock the once-per-view firing model (D-h).
- **Independence vs duplication.** Re-declaring `Badge`/`Team` (not importing) is the system's deliberate choice (D-03/D-04). Accept the minor type duplication as the price of distribution safety; do not "helpfully" import the sibling's types.
- **Empty-state honesty.** "No badges yet" must feel encouraging (Competence), not like an error or a dead panel — design the empty + all-locked states explicitly.

---

## 9. Success criteria

v1 ships when:

1. **`Badge[]` renders** — every field in §4's table produces its mapped element; earned and locked states both render.
2. **Earned-vs-locked is deterministic** — `awardedAt` present/absent drives the state per §4; `showLocked` toggles the locked slots cleanly.
3. **Award animation** — a badge transitioning not-earned → earned plays a brief (< 1s), skippable, **non-blocking** reveal; `animateAward={false}` and `prefers-reduced-motion` both suppress it; **no hydration flash**.
4. **Bare token works standalone** — `TeamMilestoneBadge` renders correctly with zero shelf scaffolding and pulls no shelf/animation weight (§6.2).
5. **Compound is real** — flat exports; a hand-assembled subset (§6.3) renders; `animateAward={false}` / bare-token path keep the (lazy) animation out of the bundle; the demo includes a "Composed / lighter" example and a bare-token example.
6. **Telemetry** — `onEvent` emits `{ type: "badges.viewed"; teamId; badgeId? }` per the firing model (D-h); never per hover.
7. **Cooperative-only + team-scope honored** — no per-individual, inter-team, or public affordance anywhere (system §5.3); GATE 3 verifies.
8. **States** — earned, locked, mixed, all-earned, all-locked, empty (no badges) all designed + built.
9. **Design-system compliance** — every color maps to a `globals.css` token; Onest/JetBrains Mono; signal-lime accent with near-black foreground; one orchestrated `reveal-up` entrance; chroma ≤ 0.20; no hard-coded colors.
10. **A11y** — shelf is a navigable list; each badge announces label + earned/locked state + (if earned) awarded date; award animation is non-blocking and reduced-motion-safe.
11. **Portability** — no `next/*`, no `process.env`, SSR-safe, registry-import-clean; imports no other registry component (D-03).
12. **Demo + (deferred) tests** — demo exercises all states + the award reveal; earned/locked resolution + the award diff are unit-testable (Vitest informed-defer per house convention).

---

## 10. Design coverage checklist (what design must produce)

> Each box is a screen/state to define against the **ilinxa-ui-pro design system** ([`src/app/globals.css`](../../../src/app/globals.css)): **signal-lime** accent `oklch(0.80 0.20 132)` light / `oklch(0.86 0.18 132)` dark (always with near-black `--primary-foreground`), cool off-white `--background` (raised `--card`/`--popover` to pure white), graphite-cool dark surfaces, **Onest** (sans) / **JetBrains Mono** (mono), one orchestrated `reveal-up` entrance (60ms stagger). **Forbidden:** pure-white page backgrounds, purple-on-white gradient clichés, neon-saturated lime (chroma ≤ 0.20), Inter/Roboto/Geist/system-font defaults.

**A. Badge anatomy (the Tier-C token)**
- [ ] Earned badge (icon/glyph + label + awarded affordance) · locked/empty slot (desaturated + lock cue) · `sm` vs `md` size · custom `renderBadgeIcon` slot · label truncation + tooltip · hover/focus state · selected/opened state.

**B. The shelf**
- [ ] Responsive grid/row layout · optional header (title + earned count, e.g. "4 / 9") · earned + locked mixed · all-earned · all-locked · dense (many badges) · wrap behaviour.

**C. Award animation**
- [ ] The brief (< 1s) reveal frames · the settled (post-animation) state · `prefers-reduced-motion` fallback (skip to settled) · `animateAward={false}` (no animation) · confirm non-blocking (input/scroll never trapped).

**D. States**
- [ ] Empty (no badges defined) · none-earned (all locked) · single badge · many badges · mixed earned/locked.

**E. Responsive**
- [ ] Wide desktop · medium · narrow (token reflow / wrap; bare-token inline sizing).

**F. Tokens & motion**
- [ ] Map **every** color to a design token — earned badge fill/accent (signal-lime family or per-badge), locked desaturation, lock-cue color, label/foreground, shelf surface, header. One orchestrated `reveal-up` entrance on first mount; the award reveal is its own brief motion (D-10).

---

## 11. Definition of "done" for THIS document (stage gate)

- [ ] §§0–10 drafted, reconciled to `ilinxa-ui-pro` conventions (paths, imports, design tokens) and to the [gamification system description](../../systems/gamification-system/gamification-system-description.md).
- [ ] Data structure pinned to the **declared** `Badge` / `Team` slice (§4) — re-declared locally, imported from nothing (system D-03).
- [ ] Compound-structure declared with rough part inventory (§0) — per the mandatory rule + system D-05.
- [ ] System-inherited decisions recorded as locked (§7); component-specific decisions recommend defaults (earned/locked slots D-c, diff-driven award trigger D-d, lazy/lightweight animation D-e).
- [ ] Telemetry event fixed to `{ type: "badges.viewed"; teamId; badgeId? }` with a once-per-view firing model (§7-D-h, §6 of the system description).
- [ ] Cooperative-only + team-scope constraints carried through scope (§2), risks (§8), and success criteria (§9) as hard requirements.
- [ ] **User approved to proceed** → Stage 2 (`team-trophy-shelf-01-procomp-plan.md`, GATE 2).

After sign-off, changes to this doc are loud and intentional, not silent rewrites.
