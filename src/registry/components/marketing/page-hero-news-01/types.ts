import type { ComponentType, ReactNode } from "react";

export type PageHeroDensity = "compact" | "default" | "full";

export type PageHeroHeadingLevel = "h1" | "h2" | "h3";

export interface HeroStat {
  /** Optional Lucide-style icon. */
  icon?: ComponentType<{ className?: string }>;
  /** Bold value text (e.g. "500+", "Daily"). */
  value: string;
  /** Small label below the value (e.g. "Articles", "Updates"). */
  label: string;
}

export interface HeroStatsProps {
  stats: HeroStat[];
  className?: string;
}

export interface PageHeroNewsProps {
  /** Title is required. */
  title: string;
  /** Override `title` with a custom node (e.g. mixed bold + colors). */
  titleSlot?: ReactNode;
  /** Optional accent-colored highlight rendered as a `<span class="block">` below the title. */
  titleHighlight?: string;
  /** Optional badge text rendered above the title. */
  badge?: string;
  /** Optional Lucide-style icon for the badge. */
  badgeIcon?: ComponentType<{ className?: string }>;
  /** Optional description paragraph rendered below the title. */
  description?: string;
  /** Optional content slot rendered below the description (stats / CTAs / search / anything). */
  children?: ReactNode;

  /** Section minimum height. Default: 'default' (70vh). */
  density?: PageHeroDensity;
  /** Heading semantic level. Default: 'h1'. */
  headingAs?: PageHeroHeadingLevel;
  /** Disable the entrance animation entirely. Default: false. */
  disableReveal?: boolean;

  /** Override classes for the root <section>. */
  className?: string;
}
