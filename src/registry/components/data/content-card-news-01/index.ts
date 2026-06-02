// ─── Root component ─────────────────────────────────────────────────────────
export { ContentCardNews01, default } from "./content-card-news-01";

// ─── Public types (v0.2 carry + v0.3.0 additions) ───────────────────────────
export type {
  // v0.2 carry
  ContentCardItem,
  ContentCardNewsLabels,
  ContentCardNewsProps,
  ContentCardNewsVariant,
  ResolvedPartProps,
  // v0.3 — role-aware + permissions
  NewsViewerMode,
  ContentCardPermissionAction,
  ContentCardPermissions,
  ContentCardMutationHandlers,
  ContentCardEngagementHandlers,
  ContentCardClickHandlers,
  ContentCardNews01Handle,
  // v0.3 — entity sub-types
  NewsArticleAuthor,
  NewsPublisher,
  ContentStatus,
  NewsVisibility,
  ContentSensitivity,
  ContentPaywall,
} from "./types";

// ─── Default constants (label dictionary) ───────────────────────────────────
export { DEFAULT_LABELS } from "./types";

// ─── Hooks + format helpers (v0.2 carry) ────────────────────────────────────
export { defaultRelativeTime } from "./hooks/use-relative-time";
export { defaultDateFormat, toDate } from "./lib/format-default";

// ─── v0.3 — permission resolver + kebab defaults ────────────────────────────
export {
  resolveContentCardPermissions,
  canPerformActionInternal,
  PERMISSION_DEFAULTS_BY_MODE,
} from "./lib/permissions";
export {
  defaultContentCardKebabActions,
  stripQuotedRecursion,
} from "./lib/defaults";

// ─── v0.3 — sub-exported parts (badge primitives + composites) ──────────────
// Per description §10 #7: 6 main composite parts + 5 small badge primitives.
// C5 ships the badge primitives + the badge-stack composite; C6 adds author/publisher;
// C7-C10 add paywall/sensitive/quoted/engagement.
export { NewsBadges } from "./parts/news-badges";
export { StatusBadge } from "./parts/status-badge";
export { VisibilityBadge } from "./parts/visibility-badge";
export { SponsorBadge } from "./parts/sponsor-badge";
export { LiveUpdateLine } from "./parts/live-update-line";
export { NewsAuthorByline } from "./parts/news-author-byline";
export { NewsPublisherRow } from "./parts/news-publisher-row";
export { NewsPaywallGate } from "./parts/news-paywall-gate";
export { ContentSensitiveGate } from "./parts/content-sensitive-gate";
export { QuotedArticleCard } from "./parts/quoted-article-card";
export { NewsEngagementCounts } from "./parts/news-engagement-counts";
export { NewsKebab } from "./parts/news-kebab";
