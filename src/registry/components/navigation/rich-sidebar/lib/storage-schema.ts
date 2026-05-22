/**
 * Versioned schema for localStorage persistence (L23).
 *
 * Bump STORAGE_SCHEMA_VERSION when the shape changes; the type-guard
 * silently drops mismatched payloads so older data doesn't corrupt the
 * runtime state.
 */
export const STORAGE_SCHEMA_VERSION = 1;

export interface StoredState {
  v: 1;
  collapsed: boolean;
  collapsedSectionIds: string[];
}

export function isStoredState(value: unknown): value is StoredState {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Partial<StoredState>;
  return (
    v.v === STORAGE_SCHEMA_VERSION &&
    typeof v.collapsed === "boolean" &&
    Array.isArray(v.collapsedSectionIds) &&
    v.collapsedSectionIds.every((id) => typeof id === "string")
  );
}
