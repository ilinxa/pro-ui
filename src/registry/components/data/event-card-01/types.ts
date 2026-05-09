import type { ElementType, MouseEvent, ReactNode } from "react";
import type { EventStatus } from "./lib/event-status";

export type { EventStatus };

export type EventCard01Variant = "grid" | "feed" | "list" | "compact";

export interface EventCardItem {
  /** Stable identifier. Used for React keys and the default ariaLabel. */
  id: string;
  /** Headline. Rendered as <h3>. Required. */
  title: string;
  /** Event-type label (e.g. "Conference", "Webinar"). Used as a key into `typeStyles`. Required. */
  type: string;
  /** Start date. ISO-8601 string parseable by `new Date()`. Required — drives status logic. */
  date: string;
  /** End date. ISO-8601 string. Optional — defaults to `date` (single-day event). */
  endDate?: string;
  /** Time string ("09:00 - 18:00"). Optional — meta line omitted if missing. */
  time?: string;
  /** Location string ("Istanbul Conference Center", "Virtual", etc). Optional. */
  location?: string;
  /** Image URL. Optional — placeholder rendered if missing. */
  image?: string;
  /** Image alt-text. Optional — falls back to `title`. */
  imageAlt?: string;
  /** Short summary. Optional — variant gracefully omits. */
  description?: string;
  /** Total seat count. Optional — capacity bar + capacity-derived states (full / lastSpots) skipped if absent. */
  capacity?: number;
  /** Currently-registered count. Optional — same as `capacity`. */
  registered?: number;
  /** Promotional flag. Optional — adds visual lift treatment. */
  featured?: boolean;
}

export interface EventCard01Labels {
  // ─── Status badges ──────────────────────────────────────────────
  /** Default: 'Ended'. */
  expired?: string;
  /** Default: 'Live now'. */
  ongoing?: string;
  /** Default: 'Soon'. */
  upcoming?: string;
  /** Default: 'Registration open'. */
  open?: string;
  /** Default: 'Sold out'. */
  full?: string;
  /** Default: 'Last spots'. */
  lastSpots?: string;
  // ─── Image-area overlays ────────────────────────────────────────
  /**
   * Suffix on the days-until countdown. Default: 'days left'.
   * @deprecated Use `formatDaysUntilSuffix` (callback) for plural-correct labels.
   *   Setting this still works (used as a static suffix for all counts) but
   *   produces ungrammatical output at count === 1 ("1 days left").
   */
  daysUntilSuffix?: string;
  /** Pulsing-dot pill text on `ongoing` events. Default: 'Happening now'. */
  ongoingIndicator?: string;
  // ─── Capacity counter ───────────────────────────────────────────
  /**
   * Suffix on the spots-left counter. Default: 'spots left'.
   * @deprecated Use `formatSpotsLeftSuffix` (callback) for plural-correct labels.
   */
  spotsLeftSuffix?: string;
  /** Spots-left counter when capacity hit. Default: 'Sold out'. */
  spotsLeftFull?: string;
  /** aria-label prefix on the capacity progress bar. Default: 'Registered'. */
  capacityAriaPrefix?: string;
  /** Word between the registered + capacity numbers in the aria-label. Default: 'of'. */
  capacityAriaSeparator?: string;
  // ─── CTA ────────────────────────────────────────────────────────
  /** Default: 'Register'. */
  ctaRegister?: string;
  /** Default: 'Join'. */
  ctaJoin?: string;
  /** Default: 'View details'. */
  ctaViewDetails?: string;
  /** Default: 'Sold out'. */
  ctaSoldOut?: string;
  // ─── A11y ───────────────────────────────────────────────────────
  /** sr-only label on the featured-star icon. Default: 'Featured event'. */
  featuredAriaLabel?: string;
}

export interface EventCard01Props {
  /** The event to render. */
  event: EventCardItem;

  /** Visual variant. Required — no default; explicit per render site. */
  variant: EventCard01Variant;

  // ─── Navigation ──────────────────────────────────────────────────
  /** URL the card links to. Mutually exclusive with `getHref`. */
  href?: string;
  /** Alternative href derivation. Receives the event, returns a URL. */
  getHref?: (event: EventCardItem) => string;
  /** Click handler, fired before navigation if href is also set. */
  onClick?: (event: EventCardItem, mouseEvent: MouseEvent) => void;
  /** Element used for the link. Default: 'a'. Pass NextLink / RemixLink / etc. */
  linkComponent?: ElementType;

  // ─── Time / formatting ───────────────────────────────────────────
  /** Custom date formatter. Default: browser locale long format. */
  formatDate?: (dateString: string) => string;
  /**
   * Format the days-until suffix as a function of count. Default uses
   * `Intl.PluralRules` ("day left" at 1, "days left" otherwise). Receives the
   * integer day-count, returns a string. Takes precedence over `labels.daysUntilSuffix`.
   */
  formatDaysUntilSuffix?: (count: number) => string;
  /**
   * Format the spots-left suffix as a function of count. Default uses
   * `Intl.PluralRules` ("spot left" at 1, "spots left" otherwise). Takes
   * precedence over `labels.spotsLeftSuffix`.
   */
  formatSpotsLeftSuffix?: (count: number) => string;
  /** Inject a "now" reference for deterministic status (tests, live clocks). Default: new Date() at render. */
  now?: Date;
  /** Override the derived status. Rare — for preview / what-if states. */
  statusOverride?: EventStatus;
  /** Localized labels. Defaults are English. */
  labels?: EventCard01Labels;

  // ─── Theming ─────────────────────────────────────────────────────
  /** Map of event-type → Tailwind class string. Default: empty (falls to bg-muted). */
  typeStyles?: Record<string, { className: string }>;
  /** Override classes for the title. */
  titleClassName?: string;
  /** Override classes for the image. */
  imageClassName?: string;
  /** Override classes for the root <article>. */
  className?: string;

  // ─── Accessibility ───────────────────────────────────────────────
  /** Override the link's accessible name. Default: title. */
  ariaLabel?: string;

  // ─── Nested interactives (overlay-link pattern) ──────────────────
  /** Optional cluster of buttons/links that sit ABOVE the link overlay (z-10). */
  actions?: ReactNode;

  // ─── Performance ─────────────────────────────────────────────────
  /** Image loading strategy. Default: 'lazy'. */
  loading?: "lazy" | "eager";
}

/** Default English labels — exported for consumer composition. */
export const DEFAULT_EVENT_CARD_LABELS: Required<EventCard01Labels> = {
  expired: "Ended",
  ongoing: "Live now",
  upcoming: "Soon",
  open: "Registration open",
  full: "Sold out",
  lastSpots: "Last spots",
  daysUntilSuffix: "days left",
  ongoingIndicator: "Happening now",
  spotsLeftSuffix: "spots left",
  spotsLeftFull: "Sold out",
  capacityAriaPrefix: "Registered",
  capacityAriaSeparator: "of",
  ctaRegister: "Register",
  ctaJoin: "Join",
  ctaViewDetails: "View details",
  ctaSoldOut: "Sold out",
  featuredAriaLabel: "Featured event",
};
