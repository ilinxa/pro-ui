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
  if (words.length === 1) {
    return words[0].slice(0, 2).toUpperCase();
  }
  return (words[0][0] + words[1][0]).toUpperCase();
}
