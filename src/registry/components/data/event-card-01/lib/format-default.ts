export function formatEventDate(dateString: string, locale?: string): string {
  return new Date(dateString).toLocaleDateString(locale, {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function getDaysUntilEvent(
  dateString: string,
  now: Date = new Date(),
): number {
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  const eventDate = new Date(dateString);
  eventDate.setHours(0, 0, 0, 0);
  return Math.ceil(
    (eventDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
  );
}

const enPluralRules = new Intl.PluralRules("en");

/** Default English plural-correct days-until suffix. "day left" / "days left". */
export function defaultFormatDaysUntilSuffix(count: number): string {
  return enPluralRules.select(count) === "one" ? "day left" : "days left";
}

/** Default English plural-correct spots-left suffix. "spot left" / "spots left". */
export function defaultFormatSpotsLeftSuffix(count: number): string {
  return enPluralRules.select(count) === "one" ? "spot left" : "spots left";
}
