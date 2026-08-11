import type { PricingTone, ResolvedTone } from "../types";

const TONE_MAP: Record<PricingTone, ResolvedTone> = {
  primary: {
    cardBorder: "border-border/60",
    highlightRing: "ring-primary/30",
    highlightBorder: "border-primary",
    badgeBg: "bg-primary",
    badgeText: "text-primary-foreground",
    toggleActiveBg: "bg-primary",
    toggleActiveText: "text-primary-foreground",
  },
  accent: {
    cardBorder: "border-accent/40",
    highlightRing: "ring-accent/40",
    highlightBorder: "border-accent",
    badgeBg: "bg-accent",
    badgeText: "text-accent-foreground",
    toggleActiveBg: "bg-accent",
    toggleActiveText: "text-accent-foreground",
  },
  muted: {
    cardBorder: "border-border/50",
    highlightRing: "ring-foreground/15",
    highlightBorder: "border-foreground/50",
    badgeBg: "bg-muted",
    badgeText: "text-foreground",
    toggleActiveBg: "bg-foreground",
    toggleActiveText: "text-background",
  },
};

export const resolveTone = (tone: PricingTone): ResolvedTone => TONE_MAP[tone];
