// Canonical wikilink pattern (Q-P2 lock):
// - [[label]]
// - [[label|alias]]
// - NOT image embeds (![[...]]) — caller must check isImageEmbed
// - NO nested square brackets
// - NO #anchor (deferred to v0.2)
export const WIKILINK_PATTERN = "\\[\\[([^\\[\\]\\n|]+?)(?:\\|([^\\[\\]\\n]+?))?\\]\\]";

export function makeWikilinkRegex(): RegExp {
  return new RegExp(WIKILINK_PATTERN, "g");
}

export interface WikilinkMatch {
  full: string;
  label: string;
  alias: string | undefined;
  start: number;
  end: number;
}

export function findWikilinks(text: string): WikilinkMatch[] {
  const matches: WikilinkMatch[] = [];
  for (const m of text.matchAll(makeWikilinkRegex())) {
    if (m.index === undefined) continue;
    if (isImageEmbed(text, m.index)) continue;
    matches.push({
      full: m[0],
      label: m[1].trim(),
      alias: m[2]?.trim(),
      start: m.index,
      end: m.index + m[0].length,
    });
  }
  return matches;
}

export function isImageEmbed(text: string, matchStart: number): boolean {
  return matchStart > 0 && text.charAt(matchStart - 1) === "!";
}
