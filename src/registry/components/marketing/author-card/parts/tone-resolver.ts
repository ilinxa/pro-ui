import type { AuthorCardTone } from "../types";

export interface ToneClasses {
  avatarBg: string;
  avatarIcon: string;
}

const TONE_MAP: Record<AuthorCardTone, ToneClasses> = {
  primary: { avatarBg: "bg-primary/10", avatarIcon: "text-primary" },
  accent: { avatarBg: "bg-accent", avatarIcon: "text-accent-foreground" },
  muted: { avatarBg: "bg-muted", avatarIcon: "text-muted-foreground" },
};

export function resolveTone(tone: AuthorCardTone): ToneClasses {
  return TONE_MAP[tone];
}
