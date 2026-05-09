import type { ReactNode } from "react";
import type { RegistrationStatus } from "./lib/registration-status";

export type { RegistrationStatus };

export interface RegistrationCard01Labels {
  /** Default: "Capacity". Top-row left label above the bar. */
  capacityLabel?: ReactNode;
  /**
   * Default: "spots left". Counter suffix when spots remain.
   * @deprecated Use `formatSpotsLeftSuffix` (callback) for plural-correct labels.
   *   Setting this still works (used as a static suffix for all counts) but
   *   produces ungrammatical output at count === 1 ("1 spots left").
   */
  spotsLeftSuffix?: string;
  /** Default: "Sold out". Counter text when capacity reached. */
  spotsLeftFull?: string;
  /** Default: "registered". Bottom-row left counter suffix. */
  registeredSuffix?: string;
  /** Default: "capacity". Bottom-row right counter suffix. */
  capacitySuffix?: string;
  /** Default: "Register". Primary CTA when registration is open. */
  ctaRegister?: string;
  /** Default: "Sold out". Primary CTA when status === 'full'. */
  ctaSoldOut?: string;
  /** Default: "Closed". Primary CTA when status === 'closed'. */
  ctaClosed?: string;
  /** Default: "Registration unavailable". Primary CTA when no onRegister provided. */
  ctaUnavailable?: string;
  /** Default: "Share". Secondary share button label (when default share is rendered). */
  ctaShare?: string;
  /** aria-label on the progress bar. Default: "Registration capacity". */
  ariaLabel?: string;
}

export interface RegistrationCard01Props {
  /** Total seats / units. Optional — when absent, no-quota mode (bar hidden). */
  capacity?: number;
  /** Currently registered count. Optional — when absent, no-quota mode. */
  registered?: number;
  /** Explicitly close registration regardless of capacity. Default: false. */
  closed?: boolean;

  /** Override the auto-derived state. Rare — for preview / what-if. */
  statusOverride?: RegistrationStatus;

  // ─── Thresholds ─────────────────────────────────────────────────
  /** Percent (0–1) of capacity at which status flips to 'lastSpots'. Default: 0.8. */
  lastSpotsRatio?: number;
  /** Absolute spots-left count at which the counter color flips to text-destructive. Default: 10. */
  urgentSpotsCount?: number;

  // ─── Formatters ──────────────────────────────────────────────────
  /**
   * Format the spots-left suffix as a function of count. Default uses
   * `Intl.PluralRules` ("spot left" at 1, "spots left" otherwise). Receives
   * the integer spots-left count, returns a string. Takes precedence over
   * `labels.spotsLeftSuffix`.
   */
  formatSpotsLeftSuffix?: (count: number) => string;

  // ─── Heading ─────────────────────────────────────────────────────
  /** Optional section heading. */
  heading?: string;
  /** Heading semantic level. Default: 'h3'. */
  headingAs?: "h2" | "h3" | "h4";

  // ─── Visual ──────────────────────────────────────────────────────
  /** Wrap in card chrome (`bg-card rounded-2xl p-6 border shadow-lg`). Default: true. */
  framed?: boolean;

  // ─── Actions ─────────────────────────────────────────────────────
  /** Primary CTA click handler. Optional — when omitted, CTA renders as disabled with `ctaUnavailable` label. */
  onRegister?: () => void;
  /** Default share-button click handler. When provided + `actions` NOT provided, renders an outline Share button. */
  onShare?: () => void;
  /** Custom action(s) slot — fully replaces the default share button. */
  actions?: ReactNode;

  /** Localized labels. */
  labels?: RegistrationCard01Labels;

  // ─── Style overrides ─────────────────────────────────────────────
  className?: string;
  headingClassName?: string;
  barClassName?: string;
  ctaClassName?: string;
}

/** Default English labels — exported for consumer composition. */
export const DEFAULT_REGISTRATION_CARD_LABELS: Required<RegistrationCard01Labels> = {
  capacityLabel: "Capacity",
  spotsLeftSuffix: "spots left",
  spotsLeftFull: "Sold out",
  registeredSuffix: "registered",
  capacitySuffix: "capacity",
  ctaRegister: "Register",
  ctaSoldOut: "Sold out",
  ctaClosed: "Closed",
  ctaUnavailable: "Registration unavailable",
  ctaShare: "Share",
  ariaLabel: "Registration capacity",
};
