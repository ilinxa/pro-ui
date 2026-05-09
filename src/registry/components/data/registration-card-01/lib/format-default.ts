const enPluralRules = new Intl.PluralRules("en");

/** Default English plural-correct spots-left suffix. "spot left" / "spots left". */
export function defaultFormatSpotsLeftSuffix(count: number): string {
  return enPluralRules.select(count) === "one" ? "spot left" : "spots left";
}
