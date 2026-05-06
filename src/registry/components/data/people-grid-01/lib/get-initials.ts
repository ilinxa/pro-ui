const TITLE_PATTERN = /^(Dr|Prof|Mr|Mrs|Ms|Sr|Jr)\.?$/i;

/**
 * Pure function. Returns 1–2 uppercase initials from a name.
 *
 * Skips common honorifics (Dr., Prof., Mr., Mrs., Ms., Sr., Jr.).
 *
 * @example
 * getInitials("Dr. Ahmet Yılmaz")    // → "AY"
 * getInitials("Prof. Dr. Elif Kaya") // → "EK"
 * getInitials("Madonna")             // → "M"
 * getInitials("")                    // → "?"
 */
export function getInitials(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return "?";

  const parts = trimmed
    .split(/\s+/)
    .filter((p) => !TITLE_PATTERN.test(p));

  if (parts.length === 0) {
    return trimmed.charAt(0).toUpperCase() || "?";
  }
  if (parts.length === 1) {
    return parts[0].charAt(0).toUpperCase();
  }
  return (
    parts[0].charAt(0) + parts[parts.length - 1].charAt(0)
  ).toUpperCase();
}
