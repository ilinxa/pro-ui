import type { BlackboardNote } from "../types";

/**
 * Derive the unread count: notes strictly after `lastSeenNoteId` in the stream.
 * `notes` is oldest → newest. A null/unknown lastSeen ⇒ everything is unread.
 * Pending/failed optimistic notes never count.
 */
export function deriveUnread(
  notes: BlackboardNote[],
  lastSeenNoteId: string | null | undefined,
): number {
  const real = notes.filter((n) => !n.pending && !n.failed);
  if (!lastSeenNoteId) return real.length;
  const idx = real.findIndex((n) => n.id === lastSeenNoteId);
  if (idx === -1) return real.length; // last-seen note no longer present → treat all as unread
  return real.length - idx - 1;
}

/** The newest real note's id, or null. */
export function latestNoteId(notes: BlackboardNote[]): string | null {
  for (let i = notes.length - 1; i >= 0; i--) {
    if (!notes[i].pending && !notes[i].failed) return notes[i].id;
  }
  return null;
}
