import type { ReactNode } from "react";

/**
 * `team-trophy-shelf-01` — public type surface.
 *
 * Framework-free (no `"use client"`): importable from a server component's type
 * position. Per system D-03 every type is **re-declared locally** — this
 * component imports nothing from another registry component. The
 * `gamification-system` description (§4 domain model, §6 telemetry union) is the
 * source of truth these slices are copied from, not imported.
 */

/**
 * A team milestone trophy. `awardedAt` is the **single discriminator** of
 * earned vs locked: present → earned; absent → a not-yet-earned (locked) slot.
 */
export interface Badge {
  id: string;
  /** Badge label — e.g. "First playable build". Truncates; full label in tooltip. */
  label: string;
  /** ISO 8601 award time. `undefined` → NOT yet earned (locked slot). */
  awardedAt?: string;
  /** The milestone that earned it (shared spine, D-09). Optional link target. */
  milestoneId?: string;
}

/**
 * This team — identity subset (system D-15). `id` scopes telemetry; `name` is an
 * OPTIONAL header-title fallback (the name only feeds an optional title, so the
 * object stays `{ id; name? }`).
 */
export interface Team {
  id: string;
  name?: string;
}

/**
 * The system §6 union narrowed to this component's emit surface. `badgeId` is
 * present only on the per-badge "opened" event.
 */
export type GamificationEvent = {
  type: "badges.viewed";
  teamId: string;
  badgeId?: string;
};

export type BadgeSize = "sm" | "md";

/** Data + telemetry surface shared by the assembly and the headless `Root`. */
export interface TeamTrophyShelfBaseProps {
  /** This team's badges — earned AND (optionally) not-yet-earned slots. */
  badges: Badge[];
  /** The owning team (telemetry teamId + optional header-title fallback). D-15. */
  team: Team;
  /** Render not-yet-earned badges as locked slots. Default `true`. */
  showLocked?: boolean;
  /** Override the header title; defaults to `${team.name} trophies` / "Team trophies". */
  title?: string;
  /** Token size. Default `"md"`. */
  size?: BadgeSize;
  /**
   * Animate newly-earned badges (diff vs previous render). Default `true`.
   *
   * **D-16 (celebration ownership):** a host that routes badge/milestone events to
   * `team-feedback-loop-01` (E6) MUST set this `false` so the moment is not
   * celebrated twice. Neither component triggers the other; the host wires exactly
   * one path per event kind.
   */
  animateAward?: boolean;
  /** Telemetry — `badges.viewed` (system D-07 / §6). */
  onEvent?: (event: GamificationEvent) => void;
  /** Fired when a badge is opened/inspected; the consumer wires what opens. */
  onBadgeOpen?: (badge: Badge) => void;
  /** Custom badge artwork; falls back to a lucide glyph. */
  renderBadgeIcon?: (badge: Badge) => ReactNode;
  className?: string;
  "aria-label"?: string;
}

/** Props for the batteries-included `TeamTrophyShelf01` assembly. */
export interface TeamTrophyShelf01Props extends TeamTrophyShelfBaseProps {
  /** Render the header (title + earned count). Default `true`. */
  showHeader?: boolean;
}

/** Props for the headless provider `TeamTrophyShelfRoot`. */
export interface TeamTrophyShelfRootProps extends TeamTrophyShelfBaseProps {
  children: ReactNode;
}

/** Props for the context-free Tier-C `TeamMilestoneBadge` token. */
export interface TeamMilestoneBadgeProps {
  badge: Badge;
  size?: BadgeSize;
  /** Render the locked state when not earned. Default `true`. */
  showLocked?: boolean;
  onOpen?: (badge: Badge) => void;
  renderIcon?: (badge: Badge) => ReactNode;
  className?: string;
}

/** Props for the lazy Tier-C `BadgeAwardOverlay`. */
export interface BadgeAwardOverlayProps {
  /** The settling token to wrap. */
  children: ReactNode;
  /** Run the burst (the Grid passes true only for a newly-earned id). Default `false`. */
  active?: boolean;
  /** Called when the < 1s reveal completes (for chaining / cleanup). */
  onDone?: () => void;
  className?: string;
}

/** The resolved state every context part reads — one source of truth. */
export interface TeamTrophyShelfContextValue {
  /** Resolved list (earned + optional locked), in host order. */
  slots: Badge[];
  team: Team;
  title?: string;
  size: BadgeSize;
  showLocked: boolean;
  animateAward: boolean;
  /** IDs of badges earned since the previous render. */
  newAwards: ReadonlySet<string>;
  earnedCount: number;
  totalCount: number;
  /** True when `onBadgeOpen` was supplied — tokens become interactive buttons. */
  isInteractive: boolean;
  /** Open/inspect a badge (fires telemetry + `onBadgeOpen`). */
  openBadge: (badge: Badge) => void;
  /** Clear a badge from `newAwards` once its reveal completes. */
  onAwardDone: (badgeId: string) => void;
  renderBadgeIcon?: (badge: Badge) => ReactNode;
}
