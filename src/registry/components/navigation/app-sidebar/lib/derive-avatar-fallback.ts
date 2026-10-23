/**
 * Derive 2-character avatar fallback initials from a name (L35).
 *
 * Examples:
 *   "Ahmet Kaya"      → "AK"
 *   "Slack"           → "SL"
 *   "  spaced  out  " → "SO"
 *   ""                → "?"
 *   "🙃 emoji"         → "🙃E"  (preserves leading char graceful for emoji)
 */
export function deriveAvatarFallback(name: string | undefined | null): string {
  if (!name) return "?";
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "?";
  // v0.5.0 — by code point, not UTF-16 unit, so an emoji / astral initial is
  // not cut in half. Case mapping is locale-neutral (`toUpperCase`) so the
  // server and client agree; Turkish dotted İ etc. — pass `avatarFallback`.
  const chars = (word: string) => Array.from(word);
  if (words.length === 1) {
    return chars(words[0]).slice(0, 2).join("").toUpperCase();
  }
  return (chars(words[0])[0] + chars(words[1])[0]).toUpperCase();
}
