export type RegistrationStatus = "open" | "lastSpots" | "full" | "closed";

export interface DeriveRegistrationStatusOptions {
  capacity?: number;
  registered?: number;
  /** Explicitly close registration regardless of capacity. */
  closed?: boolean;
  /** Percent (0–1) of capacity at which status flips to 'lastSpots'. Default: 0.8. */
  lastSpotsRatio?: number;
}

/**
 * Pure function. Derives registration status from capacity + registered + closed flag.
 *
 * - `closed: true` always returns "closed"
 * - capacity / registered missing → "open" (no-quota mode)
 * - registered >= capacity → "full"
 * - registered/capacity >= lastSpotsRatio → "lastSpots"
 * - otherwise → "open"
 */
export function deriveRegistrationStatus(
  opts: DeriveRegistrationStatusOptions,
): RegistrationStatus {
  if (opts.closed === true) return "closed";

  const { capacity, registered } = opts;
  if (capacity == null || registered == null) return "open";

  if (registered >= capacity) return "full";

  const ratio = capacity === 0 ? 1 : registered / capacity;
  const threshold = opts.lastSpotsRatio ?? 0.8;
  if (ratio >= threshold) return "lastSpots";

  return "open";
}
