"use client";

import { useTeamTrophyShelf } from "./hooks/use-team-trophy-shelf";
import { TeamTrophyShelfEmpty } from "./parts/team-trophy-shelf-empty";
import { TeamTrophyShelfGrid } from "./parts/team-trophy-shelf-grid";
import { TeamTrophyShelfHeader } from "./parts/team-trophy-shelf-header";
import { TeamTrophyShelfRoot } from "./parts/team-trophy-shelf-root";
import type { TeamTrophyShelf01Props } from "./types";

/** Emptiness gate — routes to Grid or the designed Empty state. Reads context only. */
function TeamTrophyShelfBody() {
  const { slots } = useTeamTrophyShelf();
  return slots.length === 0 ? <TeamTrophyShelfEmpty /> : <TeamTrophyShelfGrid />;
}

/**
 * Tier A — the batteries-included assembly: `Root` + `showHeader`-gated `Header`
 * + (`Grid` | `Empty`). Contains **no logic the parts don't** — a hand-assembled
 * layout (`TeamTrophyShelfRoot` + a subset of parts) behaves identically.
 *
 * A durable gallery of ONE team's earned milestone badges, honest locked slots for
 * what's ahead, and a brief non-blocking reveal when a badge is newly earned. No
 * ranking, no per-member split, no comparison — ever (system §5.3 / D-08).
 */
export function TeamTrophyShelf01({
  badges,
  team,
  showLocked = true,
  showHeader = true,
  title,
  size = "md",
  animateAward = true,
  onEvent,
  onBadgeOpen,
  renderBadgeIcon,
  className,
  "aria-label": ariaLabel,
}: TeamTrophyShelf01Props) {
  return (
    <TeamTrophyShelfRoot
      badges={badges}
      team={team}
      showLocked={showLocked}
      title={title}
      size={size}
      animateAward={animateAward}
      onEvent={onEvent}
      onBadgeOpen={onBadgeOpen}
      renderBadgeIcon={renderBadgeIcon}
      className={className}
      aria-label={ariaLabel}
    >
      {showHeader ? <TeamTrophyShelfHeader /> : null}
      <TeamTrophyShelfBody />
    </TeamTrophyShelfRoot>
  );
}
