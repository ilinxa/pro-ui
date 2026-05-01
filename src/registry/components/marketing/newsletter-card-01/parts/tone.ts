import type { NewsletterCardTone } from "../types";

/**
 * Tone → Tailwind class fragments. Each tone gets a frame (background +
 * border) + a heading color modifier. The frame is `rounded-2xl border p-6`
 * by default, applied at the part level.
 */
const TONE_MAP: Record<NewsletterCardTone, { frame: string; heading: string }> = {
  primary: {
    frame: "border-primary/20 bg-primary/5",
    heading: "text-foreground",
  },
  accent: {
    frame: "border-accent/40 bg-accent/30",
    heading: "text-accent-foreground",
  },
  muted: {
    frame: "border-border/50 bg-muted/40",
    heading: "text-foreground",
  },
};

export const resolveTone = (tone: NewsletterCardTone) => TONE_MAP[tone];
