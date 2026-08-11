import { Clock, Newspaper, TrendingUp } from "lucide-react";
import type { HeroStat } from "./types";

export const NEWS_HERO_DEFAULTS = {
  badge: "News & Updates",
  badgeIcon: Newspaper,
  title: "Latest Stories",
  titleHighlight: "From Our Team",
  description:
    "Insights, announcements, and behind-the-scenes from our editorial team.",
};

export const NEWS_HERO_STATS_EN: HeroStat[] = [
  { icon: Newspaper, value: "500+", label: "Articles" },
  { icon: TrendingUp, value: "10K+", label: "Readers" },
  { icon: Clock, value: "Daily", label: "Updates" },
];

/** Turkish-flavored content for the localized demo, matching the kasder source. */
export const NEWS_HERO_DEFAULTS_TR = {
  badge: "Haberler & Duyurular",
  badgeIcon: Newspaper,
  title: "Güncel Haberler",
  titleHighlight: "Son Gelişmeler",
  description:
    "Kentsel gelişim, şehir planlama ve sürdürülebilirlik alanındaki en son gelişmeleri ve duyuruları takip edin.",
};

export const NEWS_HERO_STATS_TR: HeroStat[] = [
  { icon: Newspaper, value: "500+", label: "Makale" },
  { icon: TrendingUp, value: "10K+", label: "Okuyucu" },
  { icon: Clock, value: "Günlük", label: "Güncelleme" },
];
