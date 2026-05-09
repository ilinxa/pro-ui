export { StatCard, default } from "./stat-card";
export { StatCardSparkline } from "./parts/sparkline";
export type { StatCardSparklineProps } from "./parts/sparkline";
export { defaultDeltaFormat } from "./lib/format-default";
export { DEFAULT_STAT_CARD_LABELS } from "./types";
export type {
  StatCardDelta,
  StatCardIcon,
  StatCardIconPosition,
  StatCardLabels,
  StatCardProps,
  StatCardTrendContext,
  StatCardValueContext,
  StatCardVariant,
} from "./types";
// NOTE: `meta` is intentionally NOT re-exported — it's docs-site only,
// excluded from registry shipments per the post-Phase-7 cleanup
// (see .claude/decisions/ for the barrel-meta-export removal).
