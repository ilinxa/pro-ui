// Tier A — batteries-included assembly.
export { TeamTrophyShelf01 } from "./team-trophy-shelf-01";

// Tier B — headless provider + flat à-la-carte parts.
export { TeamTrophyShelfRoot } from "./parts/team-trophy-shelf-root";
export { TeamTrophyShelfGrid } from "./parts/team-trophy-shelf-grid";
export { TeamTrophyShelfHeader } from "./parts/team-trophy-shelf-header";
export { TeamTrophyShelfEmpty } from "./parts/team-trophy-shelf-empty";

// Tier C — context-free primitives. The award overlay is the lazy-chunk host;
// the Grid pulls it via React.lazy, so importing it here for standalone use does
// not force it into a bare-token consumer's bundle (unused re-exports tree-shake).
export { TeamMilestoneBadge } from "./parts/team-milestone-badge";
export { default as BadgeAwardOverlay } from "./parts/badge-award-overlay";

// Context consumer for hand-assembled layouts.
export { useTeamTrophyShelf } from "./hooks/use-team-trophy-shelf";

// Public types.
export type {
  TeamTrophyShelf01Props,
  TeamTrophyShelfRootProps,
  TeamTrophyShelfBaseProps,
  TeamTrophyShelfContextValue,
  TeamMilestoneBadgeProps,
  BadgeAwardOverlayProps,
  Badge,
  Team,
  BadgeSize,
  GamificationEvent,
} from "./types";
